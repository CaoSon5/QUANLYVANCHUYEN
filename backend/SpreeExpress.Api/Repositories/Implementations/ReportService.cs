// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Services\Implementations\
using System.Text.RegularExpressions;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Repositories.Interfaces;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Services.Implementations;

// Các báo cáo quản lý cho Admin (FR13 đến FR18). Doanh thu phí vận chuyển (FR14) nằm ở FinanceService.
public class ReportService : IReportService
{
    private readonly IReportRepository _reports;
    private readonly IFinanceRepository _finance;

    public ReportService(IReportRepository reports, IFinanceRepository finance)
    {
        _reports = reports;
        _finance = finance;
    }

    // ================= FR13, FR15: ĐƠN THEO TRẠNG THÁI, TỈ LỆ GIAO =================

    // Phạm vi: các đơn ĐƯỢC TẠO trong kỳ, xem trạng thái hiện tại của chúng.
    // Tỉ lệ giao tính trên các đơn đã có kết quả giao (thành công, thất bại, đang hoàn, đã hoàn),
    // đơn còn đang vận chuyển chưa tính vì chưa có kết quả.
    public async Task<OrderReportDto> GetOrderReportAsync(DateOnly? from, DateOnly? to)
    {
        var range = Range(from, to, 366);

        var counts = await _reports.GetStatusCountsAsync(range.FromUtc, range.ToUtc);
        var byStatus = counts.ToDictionary(c => c.Status, c => c.Count);
        int Get(OrderStatus s) => byStatus.TryGetValue(s, out var n) ? n : 0;
        var total = byStatus.Values.Sum();

        var statuses = Enum.GetValues<OrderStatus>()
            .Select(s => new StatusCountDto
            {
                Status = StatusKey(s),
                Count = Get(s),
                Percent = Pct(Get(s), total) ?? 0,
            })
            .ToList();

        var delivered = Get(OrderStatus.Delivered);
        var failed = Get(OrderStatus.DeliveryFailed);
        var returning = Get(OrderStatus.Returning);
        var returned = Get(OrderStatus.Returned);
        var attempted = delivered + failed + returning + returned;
        var firstTry = await _reports.CountDeliveredFirstTryAsync(range.FromUtc, range.ToUtc);

        var reasons = await _reports.GetFailureReasonCountsAsync(range.FromUtc, range.ToUtc);

        return new OrderReportDto
        {
            From = range.From,
            To = range.To,
            TotalOrders = total,
            Statuses = statuses,
            Outcome = new DeliveryOutcomeDto
            {
                Delivered = delivered,
                DeliveredFirstTry = firstTry,
                DeliveryFailed = failed,
                Returning = returning,
                Returned = returned,
                Attempted = attempted,
                SuccessRate = Pct(delivered, attempted),
                FailedRate = Pct(failed, attempted),
                ReturnRate = Pct(returning + returned, attempted),
                FirstTryRate = Pct(firstTry, delivered),
            },
            FailureReasons = reasons
                .OrderByDescending(r => r.Count)
                .Select(r => new FailureReasonCountDto { Reason = r.Reason, Count = r.Count })
                .ToList(),
        };
    }

    // ================= FR16: HIỆU SUẤT SHIPPER =================

    // Đếm theo từng lần hành động ghi trong lịch sử đơn (đúng người, đúng thời điểm), nên một đơn
    // giao thất bại rồi giao lại sẽ tính 1 lần thất bại cho shipper đầu và 1 lần thành công cho shipper sau.
    public async Task<ShipperReportDto> GetShipperReportAsync(DateOnly? from, DateOnly? to)
    {
        var range = Range(from, to, 366);

        var actions = await _reports.GetShipperActionRowsAsync(range.FromUtc, range.ToUtc);
        var deliveredRows = await _reports.GetDeliveredOrderRowsAsync(range.FromUtc, range.ToUtc);
        var shippers = await _reports.GetShippersAsync();

        var actionsBy = actions.GroupBy(a => a.ActorId).ToDictionary(g => g.Key, g => g.ToList());
        var deliveredBy = deliveredRows
            .Where(d => d.ShipperId.HasValue)
            .GroupBy(d => d.ShipperId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        var list = new List<ShipperPerformanceDto>();
        foreach (var s in shippers)
        {
            actionsBy.TryGetValue(s.Id, out var a);
            deliveredBy.TryGetValue(s.Id, out var d);

            var pickups = a?.Count(x => x.Status == OrderStatus.PickedUp) ?? 0;
            var ok = a?.Count(x => x.Status == OrderStatus.Delivered) ?? 0;
            var bad = a?.Count(x => x.Status == OrderStatus.DeliveryFailed || x.Status == OrderStatus.Returning) ?? 0;

            // Shipper đã nghỉ mà trong kỳ không có hoạt động thì không cần hiện
            if (!s.IsActive && pickups + ok + bad == 0) continue;

            var timed = d?.Where(x => x.DispatchedAt.HasValue).ToList();
            decimal? avgHours = timed is { Count: > 0 }
                ? Math.Round((decimal)timed.Average(x => (x.DeliveredAt - x.DispatchedAt!.Value).TotalHours), 1)
                : null;

            list.Add(new ShipperPerformanceDto
            {
                ShipperId = s.Id,
                FullName = s.FullName,
                Phone = s.Phone,
                WarehouseCode = s.WarehouseCode,
                IsActive = s.IsActive,
                Pickups = pickups,
                Delivered = ok,
                Failed = bad,
                SuccessRate = Pct(ok, ok + bad),
                CodCollected = d?.Sum(x => x.CodCollected) ?? 0,
                AverageDeliveryHours = avgHours,
            });
        }

        list = list.OrderByDescending(x => x.Delivered).ThenBy(x => x.FullName).ToList();

        return new ShipperReportDto
        {
            From = range.From,
            To = range.To,
            Shippers = list,
            TotalPickups = list.Sum(x => x.Pickups),
            TotalDelivered = list.Sum(x => x.Delivered),
            TotalFailed = list.Sum(x => x.Failed),
            TotalCod = list.Sum(x => x.CodCollected),
        };
    }

    // ================= FR17: TỒN KHO THEO TỪNG KHO =================

    // Ảnh chụp tại thời điểm xem (không theo kỳ): mỗi kho đang giữ bao nhiêu đơn, bao nhiêu kiện, đơn nào quá hạn.
    public async Task<InventoryReportDto> GetInventoryReportAsync()
    {
        var warehouses = await _reports.GetWarehousesAsync();
        var stock = await _reports.GetStockRowsAsync();

        var now = DateTime.UtcNow;
        var staleBefore = now.AddHours(-48);
        var inside = new[]
        {
            OrderStatus.InWarehouse, OrderStatus.DeliveryAccepted, OrderStatus.DeliveryFailed, OrderStatus.Returning,
        };

        var list = new List<WarehouseStockDto>();
        foreach (var w in warehouses)
        {
            var mine = stock.Where(s => s.CurrentWarehouseId == w.Id && inside.Contains(s.Status)).ToList();
            var incoming = stock.Count(s => s.Status == OrderStatus.PickedUp && s.PickupWarehouseId == w.Id);

            // Kho đã ngừng hoạt động và không còn gì thì không hiện
            if (!w.IsActive && mine.Count == 0 && incoming == 0) continue;

            var hours = mine
                .Where(s => s.ReceivedAt.HasValue)
                .Select(s => (now - s.ReceivedAt!.Value).TotalHours)
                .ToList();

            list.Add(new WarehouseStockDto
            {
                Id = w.Id,
                Code = w.Code,
                Name = w.Name,
                Type = w.Type.ToString().ToLowerInvariant(),
                IsActive = w.IsActive,
                Incoming = incoming,
                InStock = mine.Count(s => s.Status == OrderStatus.InWarehouse),
                AwaitingDispatch = mine.Count(s => s.Status == OrderStatus.DeliveryAccepted),
                Retry = mine.Count(s => s.Status == OrderStatus.DeliveryFailed),
                Returning = mine.Count(s => s.Status == OrderStatus.Returning),
                TotalOrders = mine.Count,
                Pieces = mine.Sum(s => s.ReceivedQuantity ?? s.Quantity),
                Stale48h = mine.Count(s => s.ReceivedAt.HasValue && s.ReceivedAt.Value < staleBefore),
                AverageStorageHours = hours.Count > 0 ? Math.Round((decimal)hours.Average(), 1) : null,
            });
        }

        return new InventoryReportDto
        {
            GeneratedAt = now,
            Warehouses = list,
            TotalOrders = list.Sum(x => x.TotalOrders),
            TotalStale = list.Sum(x => x.Stale48h),
            TotalIncoming = list.Sum(x => x.Incoming),
            TotalAwaitingDispatch = list.Sum(x => x.AwaitingDispatch),
        };
    }

    // ================= FR18: ĐỐI SOÁT COD =================

    public async Task<CodReportDto> GetCodReportAsync(DateOnly? from, DateOnly? to)
    {
        var range = Range(from, to, 366);

        var c = await _reports.GetCodCountsAsync(range.FromUtc, range.ToUtc);
        var holdings = await _finance.GetHoldingsPerShipperAsync();

        return new CodReportDto
        {
            From = range.From,
            To = range.To,
            CodCollected = c.CodCollected,
            CodOrders = c.CodOrders,
            ConfirmedReceived = c.ConfirmedReceived,
            NetDifference = c.NetDifference,
            ShortRemittances = c.ShortRemittances,
            PaidOut = c.PaidOut,
            PaidSettlements = c.PaidSettlements,
            Held = c.Held,
            PendingRemittanceAmount = c.PendingRemittanceAmount,
            PendingRemittances = c.PendingRemittances,
            PendingPayout = c.PendingPayout,
            PendingSettlements = c.PendingSettlements,
            Holdings = holdings.Select(h => new ShipperHoldingDto
            {
                ShipperId = h.ShipperId,
                ShipperName = h.ShipperName,
                ShipperPhone = h.ShipperPhone,
                OrderCount = h.OrderCount,
                Amount = h.Amount,
                OldestDeliveredAt = h.OldestDeliveredAt,
            }).ToList(),
        };
    }

    // ================= helpers =================

    // Khoảng ngày theo giờ Việt Nam (gồm cả ngày kết thúc). Mặc định 30 ngày gần nhất.
    private static (DateOnly From, DateOnly To, DateTime FromUtc, DateTime ToUtc) Range(DateOnly? from, DateOnly? to, int maxDays)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
        var end = to ?? today;
        var start = from ?? end.AddDays(-29);

        if (end < start)
            throw new AppException("Khoảng thời gian không hợp lệ: ngày kết thúc trước ngày bắt đầu", 400);
        if (end.DayNumber - start.DayNumber + 1 > maxDays)
            throw new AppException($"Báo cáo tối đa {maxDays} ngày mỗi lần xem", 400);

        return (start, end, VnToUtc(start), VnToUtc(end.AddDays(1)));
    }

    private static DateTime VnToUtc(DateOnly d) =>
        DateTime.SpecifyKind(d.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc).AddHours(-7);

    // Phần trăm làm tròn 1 chữ số; null nếu mẫu bằng 0 (tránh chia cho 0 và tránh hiện 0% gây hiểu nhầm)
    private static decimal? Pct(int part, int whole) =>
        whole == 0 ? null : Math.Round((decimal)part * 100 / whole, 1);

    // OrderStatus.InWarehouse -> "in_warehouse"
    private static string StatusKey(OrderStatus status) =>
        Regex.Replace(status.ToString(), "(?<!^)([A-Z])", "_$1").ToLowerInvariant();
}
