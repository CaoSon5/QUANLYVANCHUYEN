// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Services\Implementations\
using System.Globalization;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Repositories.Interfaces;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Services.Implementations;

// Dòng tiền COD: shipper nộp tiền -> kế toán đối chiếu -> đối soát và trả tiền người bán
public class FinanceService : IFinanceService
{
    private readonly IFinanceRepository _finance;
    private readonly IUserRepository _users;

    public FinanceService(IFinanceRepository finance, IUserRepository users)
    {
        _finance = finance;
        _users = users;
    }

    // ================= SHIPPER NỘP COD (FR57) =================

    // COD shipper đang giữ: các đơn giao thành công, có thu tiền, chưa nộp
    public async Task<HoldingDto> GetHoldingAsync(Guid shipperId)
    {
        var orders = await _finance.GetHeldOrdersAsync(shipperId);
        return new HoldingDto
        {
            TotalAmount = orders.Sum(o => o.CodCollected ?? 0),
            OrderCount = orders.Count,
            Orders = orders.Select(ToLine).ToList(),
        };
    }

    public async Task<RemittanceDto> CreateRemittanceAsync(Guid shipperId, List<Guid>? orderIds)
    {
        var orders = await _finance.GetTrackedHeldOrdersAsync(shipperId, orderIds);
        if (orders.Count == 0)
            throw new AppException("Không có đơn COD nào cần nộp", 400);

        // Chọn đơn cụ thể thì mọi đơn được chọn phải hợp lệ
        if (orderIds is { Count: > 0 } && orders.Count != orderIds.Distinct().Count())
            throw new AppException("Có đơn không hợp lệ hoặc đã được nộp trước đó, vui lòng tải lại trang", 400);

        var number = await _finance.NextRemittanceNumberAsync();
        var remittance = new CodRemittance
        {
            Code = $"NT{DateCode()}{number:D4}",
            ShipperId = shipperId,
            OrderCount = orders.Count,
            TotalAmount = orders.Sum(o => o.CodCollected ?? 0),
        };

        foreach (var o in orders) o.CodRemittanceId = remittance.Id;

        _finance.AddRemittance(remittance);
        await _finance.SaveAsync();
        return await GetRemittanceAsync(remittance.Id, null);
    }

    public async Task<PagedResult<RemittanceDto>> ListRemittancesAsync(
        Guid? shipperId, string? status, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        RemittanceStatus? filter = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<RemittanceStatus>(status, ignoreCase: true, out var st) || !Enum.IsDefined(st))
                throw new AppException("Trạng thái không hợp lệ", 400);
            filter = st;
        }

        var (items, total) = await _finance.SearchRemittancesAsync(shipperId, filter, page, pageSize);
        return new PagedResult<RemittanceDto>
        {
            Items = items.Select(r => ToRemittanceDto(r, withOrders: false)).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<RemittanceDto> GetRemittanceAsync(Guid id, Guid? shipperId)
    {
        var r = await _finance.GetRemittanceDetailAsync(id)
                ?? throw new AppException("Không tìm thấy phiếu nộp", 404);
        if (shipperId.HasValue && r.ShipperId != shipperId.Value)
            throw new AppException("Không tìm thấy phiếu nộp", 404);
        return ToRemittanceDto(r, withOrders: true);
    }

    // ================= KẾ TOÁN ĐỐI CHIẾU COD (FR59) =================

    public async Task<RemittanceDto> ConfirmRemittanceAsync(Guid accountantId, Guid id, ConfirmRemittanceRequest request)
    {
        var r = await _finance.GetRemittanceTrackedAsync(id)
                ?? throw new AppException("Không tìm thấy phiếu nộp", 404);
        if (r.Status != RemittanceStatus.Pending)
            throw new AppException("Phiếu này đã được xác nhận", 409);

        var received = request.ReceivedAmount ?? r.TotalAmount;
        var note = Clean(request.Note);

        // Thực nhận khác số khai nộp thì bắt buộc ghi lý do để truy vết chênh lệch
        if (received != r.TotalAmount && note is null)
            throw new AppException(
                $"Số tiền thực nhận ({Vnd(received)}) khác số shipper khai nộp ({Vnd(r.TotalAmount)}), vui lòng ghi chú lý do", 400);

        r.ReceivedAmount = received;
        r.Status = RemittanceStatus.Confirmed;
        r.ConfirmNote = note;
        r.ConfirmedAt = DateTime.UtcNow;
        r.ConfirmedById = accountantId;

        await _finance.SaveAsync();
        return await GetRemittanceAsync(id, null);
    }

    // Mỗi shipper đang giữ bao nhiêu tiền COD chưa nộp
    public async Task<List<ShipperHoldingDto>> GetHoldingsAsync()
    {
        var list = await _finance.GetHoldingsPerShipperAsync();
        return list.Select(h => new ShipperHoldingDto
        {
            ShipperId = h.ShipperId,
            ShipperName = h.ShipperName,
            ShipperPhone = h.ShipperPhone,
            OrderCount = h.OrderCount,
            Amount = h.Amount,
            OldestDeliveredAt = h.OldestDeliveredAt,
        }).ToList();
    }

    // ================= ĐỐI SOÁT NGƯỜI BÁN =================

    public async Task<List<SellerLookupDto>> ListSellersAsync(string? search)
    {
        var (items, _) = await _users.SearchAsync(search?.Trim(), UserRole.Seller, true, 1, 50);
        return items.Select(u => new SellerLookupDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            Phone = u.Phone,
        }).ToList();
    }

    // Xem trước số liệu của kỳ đối soát, chưa lưu gì
    public async Task<SettlementPreviewDto> PreviewSettlementAsync(SettlementPeriodRequest request)
    {
        var seller = await GetSellerAsync(request.SellerId!.Value);
        var (fromUtc, toUtc) = PeriodToUtc(request.From!.Value, request.To!.Value);

        var orders = await _finance.GetEligibleOrdersAsync(seller.Id, fromUtc, toUtc, tracked: false);
        var (excludedCount, excludedAmount) = await _finance.GetExcludedOrdersAsync(seller.Id, fromUtc, toUtc);

        var gross = orders.Sum(o => o.CodCollected ?? 0);
        var fees = orders.Sum(o => o.ShippingFee);

        return new SettlementPreviewDto
        {
            SellerId = seller.Id,
            SellerName = seller.FullName,
            From = request.From!.Value,
            To = request.To!.Value,
            OrderCount = orders.Count,
            GrossCod = gross,
            ShippingFee = fees,
            NetBeforeAdjustments = gross - fees,
            ExcludedCount = excludedCount,
            ExcludedAmount = excludedAmount,
            Orders = orders.Select(ToLine).ToList(),
        };
    }

    // FR60: lập bảng đối soát cho một người bán theo kỳ, tự trừ phí vận chuyển và khoản phát sinh
    public async Task<SettlementDto> CreateSettlementAsync(Guid accountantId, CreateSettlementRequest request)
    {
        var seller = await GetSellerAsync(request.SellerId!.Value);
        var (fromUtc, toUtc) = PeriodToUtc(request.From!.Value, request.To!.Value);

        var adjustments = request.Adjustments ?? new List<AdjustmentRequest>();
        if (adjustments.Count > 10)
            throw new AppException("Tối đa 10 khoản phát sinh mỗi bảng đối soát", 400);
        if (adjustments.Any(a => a.Amount == 0))
            throw new AppException("Số tiền của khoản phát sinh phải khác 0", 400);

        var orders = await _finance.GetEligibleOrdersAsync(seller.Id, fromUtc, toUtc, tracked: true);
        if (orders.Count == 0 && adjustments.Count == 0)
            throw new AppException("Không có đơn nào đủ điều kiện đối soát trong kỳ này", 400);

        var gross = orders.Sum(o => o.CodCollected ?? 0);
        var fees = orders.Sum(o => o.ShippingFee);
        var adjustmentTotal = adjustments.Sum(a => a.Amount);

        var number = await _finance.NextSettlementNumberAsync();
        var settlement = new Settlement
        {
            Code = $"DS{DateCode()}{number:D4}",
            SellerId = seller.Id,
            PeriodFrom = request.From!.Value,
            PeriodTo = request.To!.Value,
            OrderCount = orders.Count,
            GrossCod = gross,
            TotalShippingFee = fees,
            TotalAdjustments = adjustmentTotal,
            NetAmount = gross - fees + adjustmentTotal,
            Note = Clean(request.Note),
            CreatedById = accountantId,
        };

        foreach (var a in adjustments)
        {
            settlement.Adjustments.Add(new SettlementAdjustment
            {
                Description = a.Description.Trim(),
                Amount = a.Amount,
            });
        }

        // Gắn đơn vào bảng đối soát: mỗi đơn chỉ được đối soát một lần
        foreach (var o in orders) o.SettlementId = settlement.Id;

        _finance.AddSettlement(settlement);
        await _finance.SaveAsync();
        return await GetSettlementAsync(accountantId, false, settlement.Id);
    }

    public async Task<PagedResult<SettlementDto>> ListSettlementsAsync(
        Guid? sellerId, string? status, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        SettlementStatus? filter = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<SettlementStatus>(status, ignoreCase: true, out var st) || !Enum.IsDefined(st))
                throw new AppException("Trạng thái không hợp lệ", 400);
            filter = st;
        }

        var (items, total) = await _finance.SearchSettlementsAsync(sellerId, filter, page, pageSize);
        return new PagedResult<SettlementDto>
        {
            Items = items.Select(s => ToSettlementDto(s, detail: false)).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    // FR67: người bán chỉ xem được bảng đối soát của chính mình
    public async Task<SettlementDto> GetSettlementAsync(Guid viewerId, bool viewerIsSeller, Guid id)
    {
        var s = await _finance.GetSettlementDetailAsync(id)
                ?? throw new AppException("Không tìm thấy bảng đối soát", 404);
        if (viewerIsSeller && s.SellerId != viewerId)
            throw new AppException("Không tìm thấy bảng đối soát", 404);
        return ToSettlementDto(s, detail: true);
    }

    // FR61: xác nhận đã chuyển tiền cho người bán
    public async Task<SettlementDto> PaySettlementAsync(Guid accountantId, Guid id, PaySettlementRequest request)
    {
        var s = await _finance.GetSettlementTrackedAsync(id)
                ?? throw new AppException("Không tìm thấy bảng đối soát", 404);
        if (s.Status == SettlementStatus.Paid)
            throw new AppException("Bảng đối soát này đã được xác nhận chuyển tiền", 409);

        s.Status = SettlementStatus.Paid;
        s.PaidAt = DateTime.UtcNow;
        s.PaidById = accountantId;
        s.PaymentRef = Clean(request.PaymentRef);

        await _finance.SaveAsync();
        return await GetSettlementAsync(accountantId, false, id);
    }

    public async Task<FinanceSummaryDto> GetSummaryAsync()
    {
        var c = await _finance.GetCountsAsync();
        return new FinanceSummaryDto
        {
            CodCollectedTotal = c.CodCollectedTotal,
            CodHeld = c.CodHeld,
            RemittancesPending = c.RemittancesPending,
            SettlementsPending = c.SettlementsPending,
            SettlementsPaid = c.SettlementsPaid,
            PendingPayoutAmount = c.PendingPayoutAmount,
        };
    }

    // ================= BÁO CÁO DOANH THU PHÍ VẬN CHUYỂN (FR14) =================

    // Doanh thu = tổng phí vận chuyển của các đơn GIAO THÀNH CÔNG, tính theo ngày giao (giờ Việt Nam).
    // granularity: day | month | year. Mặc định: 30 ngày / 12 tháng / 5 năm gần nhất.
    public async Task<ShippingRevenueDto> GetShippingRevenueAsync(string? granularity, DateOnly? from, DateOnly? to)
    {
        var g = (granularity ?? "day").Trim().ToLowerInvariant();
        if (g != "day" && g != "month" && g != "year")
            throw new AppException("Chỉ hỗ trợ báo cáo theo ngày, tháng hoặc năm", 400);

        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
        var end = to ?? today;
        var start = from ?? (g == "month" ? end.AddMonths(-11) : g == "year" ? end.AddYears(-4) : end.AddDays(-29));

        var (rangeStart, rangeEnd, count) = NormalizeRange(g, start, end);
        var previousStart = Shift(g, rangeStart, -count);

        var currentFromUtc = VnToUtc(rangeStart);
        var rows = await _finance.GetDeliveredFeeRowsAsync(VnToUtc(previousStart), VnToUtc(rangeEnd));

        DateOnly BucketStart(DateTime utc)
        {
            var vn = utc.AddHours(7);
            return g == "month" ? new DateOnly(vn.Year, vn.Month, 1)
                 : g == "year" ? new DateOnly(vn.Year, 1, 1)
                 : DateOnly.FromDateTime(vn);
        }

        var current = rows.Where(r => r.DeliveredAt >= currentFromUtc).ToList();
        var previous = rows.Where(r => r.DeliveredAt < currentFromUtc).ToList();
        var lookup = current.GroupBy(r => BucketStart(r.DeliveredAt)).ToDictionary(x => x.Key, x => x.ToList());

        // Điền đủ mọi kỳ, kỳ nào chưa có đơn thì bằng 0 để biểu đồ liền mạch
        var buckets = new List<RevenueBucketDto>();
        for (var d = rangeStart; d < rangeEnd; d = Shift(g, d, 1))
        {
            lookup.TryGetValue(d, out var list);
            buckets.Add(new RevenueBucketDto
            {
                Key = d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                Label = g == "year" ? d.ToString("yyyy", CultureInfo.InvariantCulture)
                      : g == "month" ? d.ToString("MM/yyyy", CultureInfo.InvariantCulture)
                      : d.ToString("dd/MM", CultureInfo.InvariantCulture),
                OrderCount = list?.Count ?? 0,
                Revenue = list?.Sum(r => r.ShippingFee) ?? 0,
                CodCollected = list?.Sum(r => r.CodCollected) ?? 0,
            });
        }

        var totalRevenue = current.Sum(r => r.ShippingFee);
        var previousRevenue = previous.Sum(r => r.ShippingFee);

        return new ShippingRevenueDto
        {
            Granularity = g,
            From = rangeStart,
            To = rangeEnd.AddDays(-1),
            Buckets = buckets,
            TotalRevenue = totalRevenue,
            TotalOrders = current.Count,
            AverageFee = current.Count == 0 ? 0 : Math.Round(totalRevenue / current.Count, 0),
            TotalCod = current.Sum(r => r.CodCollected),
            PreviousRevenue = previousRevenue,
            PreviousOrders = previous.Count,
            ChangePercent = previousRevenue == 0 ? null : Math.Round((totalRevenue - previousRevenue) / previousRevenue * 100, 1),
        };
    }

    // Chuẩn hóa khoảng báo cáo về đầu kỳ đầu tiên và đầu kỳ ngay sau kỳ cuối, kèm số kỳ
    private static (DateOnly Start, DateOnly EndExclusive, int Count) NormalizeRange(string g, DateOnly from, DateOnly to)
    {
        if (to < from)
            throw new AppException("Khoảng thời gian không hợp lệ: ngày kết thúc trước ngày bắt đầu", 400);

        if (g == "month")
        {
            var start = new DateOnly(from.Year, from.Month, 1);
            var endEx = new DateOnly(to.Year, to.Month, 1).AddMonths(1);
            var count = (endEx.Year - start.Year) * 12 + endEx.Month - start.Month;
            if (count > 36) throw new AppException("Báo cáo theo tháng tối đa 36 tháng", 400);
            return (start, endEx, count);
        }

        if (g == "year")
        {
            var count = to.Year - from.Year + 1;
            if (count > 10) throw new AppException("Báo cáo theo năm tối đa 10 năm", 400);
            return (new DateOnly(from.Year, 1, 1), new DateOnly(to.Year, 1, 1).AddYears(1), count);
        }

        var days = to.DayNumber - from.DayNumber + 1;
        if (days > 93) throw new AppException("Báo cáo theo ngày tối đa 93 ngày", 400);
        return (from, to.AddDays(1), days);
    }

    private static DateOnly Shift(string g, DateOnly d, int n) =>
        g == "month" ? d.AddMonths(n) : g == "year" ? d.AddYears(n) : d.AddDays(n);

    // Ngày Việt Nam (UTC+7) -> thời điểm UTC của 00:00 ngày đó
    private static DateTime VnToUtc(DateOnly d) =>
        DateTime.SpecifyKind(d.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc).AddHours(-7);

    // ================= helpers =================

    private async Task<User> GetSellerAsync(Guid sellerId)
    {
        var user = await _users.GetByIdAsync(sellerId);
        if (user is null || user.Role != UserRole.Seller)
            throw new AppException("Không tìm thấy người bán", 404);
        return user;
    }

    // Kỳ đối soát tính theo ngày Việt Nam (UTC+7), gồm cả ngày kết thúc
    private static (DateTime FromUtc, DateTime ToUtc) PeriodToUtc(DateOnly from, DateOnly to)
    {
        if (to < from)
            throw new AppException("Kỳ đối soát không hợp lệ: ngày kết thúc trước ngày bắt đầu", 400);
        if (to.DayNumber - from.DayNumber > 92)
            throw new AppException("Mỗi kỳ đối soát tối đa 93 ngày", 400);

        var fromUtc = DateTime.SpecifyKind(from.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc).AddHours(-7);
        var toUtc = DateTime.SpecifyKind(to.AddDays(1).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc).AddHours(-7);
        return (fromUtc, toUtc);
    }

    private static string DateCode() => DateTime.UtcNow.AddHours(7).ToString("yyMMdd");

    private static string? Clean(string? text) => string.IsNullOrWhiteSpace(text) ? null : text.Trim();

    // 1500000 -> "1.500.000đ" (tự định dạng để không phụ thuộc ngôn ngữ máy chủ)
    private static string Vnd(decimal v) => v.ToString("#,0", CultureInfo.InvariantCulture).Replace(",", ".") + "đ";

    private static FinanceOrderLineDto ToLine(Order o) => new()
    {
        Id = o.Id,
        Code = o.Code,
        ReceiverName = o.ReceiverName,
        DeliveredAt = o.DeliveredAt,
        CodAmount = o.CodAmount,
        CodCollected = o.CodCollected ?? 0,
        ShippingFee = o.ShippingFee,
    };

    private static RemittanceDto ToRemittanceDto(CodRemittance r, bool withOrders) => new()
    {
        Id = r.Id,
        Code = r.Code,
        ShipperId = r.ShipperId,
        ShipperName = r.Shipper?.FullName ?? string.Empty,
        ShipperPhone = r.Shipper?.Phone ?? string.Empty,
        OrderCount = r.OrderCount,
        TotalAmount = r.TotalAmount,
        ReceivedAmount = r.ReceivedAmount,
        Difference = r.ReceivedAmount.HasValue ? r.ReceivedAmount.Value - r.TotalAmount : null,
        Status = r.Status.ToString().ToLowerInvariant(),
        ConfirmNote = r.ConfirmNote,
        CreatedAt = r.CreatedAt,
        ConfirmedAt = r.ConfirmedAt,
        ConfirmedByName = r.ConfirmedBy?.FullName,
        Orders = withOrders
            ? r.Orders.OrderBy(o => o.DeliveredAt).Select(ToLine).ToList()
            : new List<FinanceOrderLineDto>(),
    };

    private static SettlementDto ToSettlementDto(Settlement s, bool detail) => new()
    {
        Id = s.Id,
        Code = s.Code,
        SellerId = s.SellerId,
        SellerName = s.Seller?.FullName ?? string.Empty,
        SellerEmail = s.Seller?.Email ?? string.Empty,
        SellerPhone = s.Seller?.Phone ?? string.Empty,
        From = s.PeriodFrom,
        To = s.PeriodTo,
        OrderCount = s.OrderCount,
        GrossCod = s.GrossCod,
        ShippingFee = s.TotalShippingFee,
        TotalAdjustments = s.TotalAdjustments,
        NetAmount = s.NetAmount,
        Status = s.Status.ToString().ToLowerInvariant(),
        Note = s.Note,
        CreatedAt = s.CreatedAt,
        CreatedByName = s.CreatedBy?.FullName,
        PaidAt = s.PaidAt,
        PaidByName = s.PaidBy?.FullName,
        PaymentRef = s.PaymentRef,
        Orders = detail
            ? s.Orders.OrderBy(o => o.DeliveredAt).Select(ToLine).ToList()
            : new List<FinanceOrderLineDto>(),
        Adjustments = detail
            ? s.Adjustments.Select(a => new AdjustmentDto { Description = a.Description, Amount = a.Amount }).ToList()
            : new List<AdjustmentDto>(),
    };
}
