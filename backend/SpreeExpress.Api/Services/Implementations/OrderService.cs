using System.Text.RegularExpressions;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Repositories.Interfaces;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Services.Implementations;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orders;
    private readonly IUserRepository _users;
    private readonly IWarehouseRepository _warehouses;
    private readonly ShippingFeeCalculator _fees;

    public OrderService(
        IOrderRepository orders, IUserRepository users,
        IWarehouseRepository warehouses, ShippingFeeCalculator fees)
    {
        _orders = orders;
        _users = users;
        _warehouses = warehouses;
        _fees = fees;
    }

    // ================= NGƯỜI BÁN =================

    // Kho lấy hàng người bán được chọn: các kho địa phương đang hoạt động
    public async Task<List<WarehouseOptionDto>> GetPickupWarehousesAsync()
    {
        var list = await _warehouses.GetActiveAsync();
        return list
            .Where(w => w.Type == WarehouseType.Local)
            .Select(w => new WarehouseOptionDto
            {
                Id = w.Id,
                Code = w.Code,
                Name = w.Name,
                Type = w.Type.ToString().ToLowerInvariant(),
            }).ToList();
    }

    public decimal EstimateFee(decimal weightKg) => _fees.Calculate(weightKg);

    public async Task<OrderDto> CreateAsync(Guid sellerId, OrderRequest r)
    {
        var warehouse = await ValidatePickupWarehouseAsync(r.PickupWarehouseId!.Value, currentWarehouseId: null);

        var order = new Order
        {
            Code = await GenerateCodeAsync(),
            Status = OrderStatus.PendingPickup,
            SellerId = sellerId,
            PickupWarehouseId = warehouse.Id,
        };
        Apply(order, r);

        order.History.Add(new OrderStatusHistory
        {
            Status = OrderStatus.PendingPickup,
            Note = "Người bán tạo yêu cầu lấy hàng",
            ActorUserId = sellerId,
        });

        await _orders.AddAsync(order);
        return await LoadDtoAsync(order.Id, canModify: true);
    }

    public async Task<OrderDto> UpdateAsync(Guid sellerId, Guid orderId, OrderRequest r)
    {
        var order = await GetOwnedOrderAsync(sellerId, orderId);
        EnsureNotAccepted(order, "sửa");

        await ValidatePickupWarehouseAsync(r.PickupWarehouseId!.Value, order.PickupWarehouseId);
        order.PickupWarehouseId = r.PickupWarehouseId.Value;
        Apply(order, r);
        order.UpdatedAt = DateTime.UtcNow;

        _orders.AddHistory(new OrderStatusHistory
        {
            OrderId = order.Id,
            Status = order.Status,
            Note = "Người bán cập nhật thông tin yêu cầu lấy hàng",
            ActorUserId = sellerId,
        });

        await _orders.SaveAsync();
        return await LoadDtoAsync(order.Id, canModify: true);
    }

    public async Task<OrderDto> CancelAsync(Guid sellerId, Guid orderId, string? reason)
    {
        var order = await GetOwnedOrderAsync(sellerId, orderId);
        EnsureNotAccepted(order, "hủy");

        reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
        order.Status = OrderStatus.Cancelled;
        order.CancelReason = reason;
        order.UpdatedAt = DateTime.UtcNow;

        _orders.AddHistory(new OrderStatusHistory
        {
            OrderId = order.Id,
            Status = OrderStatus.Cancelled,
            Note = reason is null ? "Người bán đã hủy yêu cầu lấy hàng" : $"Người bán đã hủy yêu cầu lấy hàng. Lý do: {reason}",
            ActorUserId = sellerId,
        });

        await _orders.SaveAsync();
        return await LoadDtoAsync(order.Id, canModify: false);
    }

    public async Task<PagedResult<OrderDto>> ListMineAsync(
        Guid sellerId, string? search, string? status, int page, int pageSize)
    {
        var filter = new OrderFilter
        {
            SellerId = sellerId,
            Search = search?.Trim(),
            Statuses = string.IsNullOrWhiteSpace(status) ? null : new List<OrderStatus> { ParseStatus(status) },
        };
        return await SearchAsync(filter, page, pageSize, canModifyForSeller: true);
    }

    public async Task<OrderDto> GetByCodeAsync(Guid sellerId, string code)
    {
        var order = await _orders.GetByCodeAsync(code.Trim().ToUpperInvariant());
        if (order is null || order.SellerId != sellerId)
            throw new AppException("Không tìm thấy đơn hàng với mã này", 404);

        return ToDto(order, canModify: order.Status == OrderStatus.PendingPickup, withHistory: true);
    }

    // ================= XEM CHI TIẾT / TỔNG QUAN =================

    public async Task<OrderDto> GetDetailAsync(Guid userId, Guid orderId)
    {
        var viewer = await GetUserAsync(userId);
        var order = await _orders.GetDetailAsync(orderId);

        if (order is null || !CanView(viewer, order))
            throw new AppException("Không tìm thấy đơn hàng", 404);

        var canModify = viewer.Role == UserRole.Seller
                        && order.SellerId == viewer.Id
                        && order.Status == OrderStatus.PendingPickup;
        return ToDto(order, canModify, withHistory: true);
    }

    public async Task<OrderSummaryDto> GetSummaryAsync(Guid userId)
    {
        var user = await GetUserAsync(userId);

        if (user.Role == UserRole.Seller)
        {
            var c = await _orders.GetSellerCountsAsync(userId);
            return new OrderSummaryDto
            {
                Total = c.Total,
                InProgress = c.InProgress,
                Delivered = c.Delivered,
                CodPending = c.CodPending,
            };
        }

        if (user.Role == UserRole.Shipper)
        {
            return new OrderSummaryDto
            {
                PendingPickup = user.WarehouseId.HasValue ? await _orders.CountPendingPickupAsync(user.WarehouseId.Value) : 0,
                AcceptedPickup = await _orders.CountAcceptedPickupAsync(userId),
            };
        }

        return new OrderSummaryDto();
    }

    // ================= SHIPPER LẤY HÀNG =================

    // FR50: danh sách yêu cầu lấy hàng đang chờ tại kho mình phụ trách
    public async Task<PagedResult<OrderDto>> ListAvailablePickupsAsync(
        Guid shipperId, string? search, int page, int pageSize)
    {
        var shipper = await GetShipperWithWarehouseAsync(shipperId);

        var filter = new OrderFilter
        {
            PickupWarehouseId = shipper.WarehouseId,
            Statuses = new List<OrderStatus> { OrderStatus.PendingPickup },
            Search = search?.Trim(),
            OldestFirst = true, // đơn tạo sớm nhất lên đầu
        };
        return await SearchAsync(filter, page, pageSize, canModifyForSeller: false);
    }

    public async Task<PagedResult<OrderDto>> ListMyPickupsAsync(
        Guid shipperId, string? status, string? search, int page, int pageSize)
    {
        var statuses = status switch
        {
            "accepted" => new List<OrderStatus> { OrderStatus.PickupAccepted },
            "picked_up" => new List<OrderStatus> { OrderStatus.PickedUp },
            _ => new List<OrderStatus> { OrderStatus.PickupAccepted, OrderStatus.PickedUp },
        };

        var filter = new OrderFilter
        {
            PickupShipperId = shipperId,
            Statuses = statuses,
            Search = search?.Trim(),
            OldestFirst = status == "accepted",
        };
        return await SearchAsync(filter, page, pageSize, canModifyForSeller: false);
    }

    // FR50: shipper tự chọn đơn muốn nhận
    public async Task<OrderDto> AcceptPickupAsync(Guid shipperId, Guid orderId)
    {
        var shipper = await GetShipperWithWarehouseAsync(shipperId);
        var order = await _orders.GetTrackedAsync(orderId)
                    ?? throw new AppException("Không tìm thấy đơn hàng", 404);

        if (order.PickupWarehouseId != shipper.WarehouseId)
            throw new AppException("Đơn này không thuộc khu vực kho của bạn", 403);
        if (order.Status != OrderStatus.PendingPickup)
            throw new AppException("Đơn đã có người nhận hoặc đã bị hủy", 409);

        order.Status = OrderStatus.PickupAccepted;
        order.PickupShipperId = shipperId;
        order.AcceptedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;

        _orders.AddHistory(new OrderStatusHistory
        {
            OrderId = order.Id,
            Status = OrderStatus.PickupAccepted,
            Note = $"Shipper {shipper.FullName} đã nhận đơn, sẽ đến lấy hàng",
            ActorUserId = shipperId,
        });

        await _orders.SaveAsync();
        return await LoadDtoAsync(order.Id, canModify: false);
    }

    // FR51: đến lấy hàng, xác nhận số lượng và tình trạng kiện hàng
    public async Task<OrderDto> ConfirmPickupAsync(Guid shipperId, Guid orderId, ConfirmPickupRequest r)
    {
        var order = await _orders.GetTrackedAsync(orderId)
                    ?? throw new AppException("Không tìm thấy đơn hàng", 404);

        if (order.PickupShipperId != shipperId)
            throw new AppException("Bạn không phải shipper nhận đơn này", 403);
        if (order.Status != OrderStatus.PickupAccepted)
            throw new AppException("Đơn không ở trạng thái chờ lấy hàng", 409);

        var note = string.IsNullOrWhiteSpace(r.Note) ? null : r.Note.Trim();

        order.Status = OrderStatus.PickedUp;
        order.PickedUpAt = DateTime.UtcNow;
        order.PickedQuantity = r.PickedQuantity;
        order.PickupNote = note;
        order.UpdatedAt = DateTime.UtcNow;

        var text = $"Shipper đã lấy hàng: {r.PickedQuantity}/{order.Quantity} kiện";
        if (r.PickedQuantity != order.Quantity) text += " (lệch so với yêu cầu)";
        if (note is not null) text += $". Ghi chú: {note}";

        _orders.AddHistory(new OrderStatusHistory
        {
            OrderId = order.Id,
            Status = OrderStatus.PickedUp,
            Note = text,
            ActorUserId = shipperId,
        });

        await _orders.SaveAsync();
        return await LoadDtoAsync(order.Id, canModify: false);
    }

    // ================= helpers =================

    private async Task<PagedResult<OrderDto>> SearchAsync(OrderFilter filter, int page, int pageSize, bool canModifyForSeller)
    {
        filter.Page = Math.Max(1, page);
        filter.PageSize = Math.Clamp(pageSize, 1, 100);

        var (items, total) = await _orders.SearchAsync(filter);

        return new PagedResult<OrderDto>
        {
            Items = items.Select(o => ToDto(o, canModifyForSeller && o.Status == OrderStatus.PendingPickup, withHistory: false)).ToList(),
            Total = total,
            Page = filter.Page,
            PageSize = filter.PageSize,
        };
    }

    private async Task<OrderDto> LoadDtoAsync(Guid orderId, bool canModify)
    {
        var order = await _orders.GetDetailAsync(orderId)
                    ?? throw new AppException("Không tìm thấy đơn hàng", 404);
        return ToDto(order, canModify, withHistory: true);
    }

    private async Task<User> GetUserAsync(Guid userId) =>
        await _users.GetByIdAsync(userId) ?? throw new AppException("Không tìm thấy tài khoản", 404);

    private async Task<User> GetShipperWithWarehouseAsync(Guid shipperId)
    {
        var user = await GetUserAsync(shipperId);
        if (user.Role != UserRole.Shipper)
            throw new AppException("Chỉ shipper mới dùng được chức năng này", 403);
        if (!user.WarehouseId.HasValue)
            throw new AppException("Tài khoản shipper chưa được gán kho. Vui lòng liên hệ quản lý.", 400);
        return user;
    }

    // Lấy đơn của chính người bán này (đơn người khác coi như không tồn tại)
    private async Task<Order> GetOwnedOrderAsync(Guid sellerId, Guid orderId)
    {
        var order = await _orders.GetTrackedAsync(orderId);
        if (order is null || order.SellerId != sellerId)
            throw new AppException("Không tìm thấy đơn hàng", 404);
        return order;
    }

    // FR64: chỉ sửa / hủy được trước khi shipper nhận
    private static void EnsureNotAccepted(Order order, string action)
    {
        if (order.Status != OrderStatus.PendingPickup)
            throw new AppException($"Đơn đã được shipper nhận hoặc không còn chờ lấy, không thể {action}", 400);
    }

    private async Task<Warehouse> ValidatePickupWarehouseAsync(Guid warehouseId, Guid? currentWarehouseId)
    {
        var warehouse = await _warehouses.GetByIdAsync(warehouseId)
                        ?? throw new AppException("Không tìm thấy kho lấy hàng", 400);
        if (warehouse.Type != WarehouseType.Local)
            throw new AppException("Kho lấy hàng phải là kho địa phương", 400);
        if (warehouseId != currentWarehouseId && !warehouse.IsActive)
            throw new AppException("Kho lấy hàng đã ngừng hoạt động", 400);
        return warehouse;
    }

    private void Apply(Order order, OrderRequest r)
    {
        order.SenderName = r.SenderName.Trim();
        order.SenderPhone = r.SenderPhone.Trim();
        order.SenderAddress = r.SenderAddress.Trim();
        order.ReceiverName = r.ReceiverName.Trim();
        order.ReceiverPhone = r.ReceiverPhone.Trim();
        order.ReceiverAddress = r.ReceiverAddress.Trim();
        order.ReceiverDistrict = r.ReceiverDistrict.Trim();
        order.ReceiverProvince = r.ReceiverProvince.Trim();
        order.ItemDescription = r.ItemDescription.Trim();
        order.Quantity = r.Quantity;
        order.WeightKg = r.WeightKg;
        order.DeclaredValue = r.DeclaredValue;
        order.CodAmount = r.CodAmount;
        order.ShippingFee = _fees.Calculate(r.WeightKg);
        order.Note = string.IsNullOrWhiteSpace(r.Note) ? null : r.Note.Trim();
    }

    // Mã vận đơn: SPR + ngày (giờ Việt Nam) + số thứ tự 5 chữ số, ví dụ SPR25062400128
    private async Task<string> GenerateCodeAsync()
    {
        var number = await _orders.NextCodeNumberAsync();
        var date = DateTime.UtcNow.AddHours(7).ToString("yyMMdd");
        return $"SPR{date}{number:D5}";
    }

    // Shipper chỉ thấy đơn chờ ở kho mình hoặc đơn mình đã nhận; Admin, Điều phối xem được mọi đơn
    private static bool CanView(User viewer, Order order) => viewer.Role switch
    {
        UserRole.Admin or UserRole.Dispatcher => true,
        UserRole.Seller => order.SellerId == viewer.Id,
        UserRole.Shipper => order.PickupShipperId == viewer.Id
                            || (order.Status == OrderStatus.PendingPickup && order.PickupWarehouseId == viewer.WarehouseId),
        UserRole.Warehouse => order.PickupWarehouseId == viewer.WarehouseId,
        _ => false,
    };

    // "pending_pickup" -> OrderStatus.PendingPickup
    private static OrderStatus ParseStatus(string value)
    {
        if (!Enum.TryParse<OrderStatus>(value.Replace("_", ""), ignoreCase: true, out var status) || !Enum.IsDefined(status))
            throw new AppException("Trạng thái không hợp lệ", 400);
        return status;
    }

    // OrderStatus.PendingPickup -> "pending_pickup"
    private static string StatusKey(OrderStatus status) =>
        Regex.Replace(status.ToString(), "(?<!^)([A-Z])", "_$1").ToLowerInvariant();

    private static OrderDto ToDto(Order o, bool canModify, bool withHistory) => new()
    {
        Id = o.Id,
        Code = o.Code,
        Status = StatusKey(o.Status),
        SellerId = o.SellerId,
        SellerName = o.Seller?.FullName ?? string.Empty,
        SenderName = o.SenderName,
        SenderPhone = o.SenderPhone,
        SenderAddress = o.SenderAddress,
        ReceiverName = o.ReceiverName,
        ReceiverPhone = o.ReceiverPhone,
        ReceiverAddress = o.ReceiverAddress,
        ReceiverDistrict = o.ReceiverDistrict,
        ReceiverProvince = o.ReceiverProvince,
        ItemDescription = o.ItemDescription,
        Quantity = o.Quantity,
        WeightKg = o.WeightKg,
        DeclaredValue = o.DeclaredValue,
        CodAmount = o.CodAmount,
        ShippingFee = o.ShippingFee,
        Note = o.Note,
        PickupWarehouseId = o.PickupWarehouseId,
        PickupWarehouseCode = o.PickupWarehouse?.Code ?? string.Empty,
        PickupWarehouseName = o.PickupWarehouse?.Name ?? string.Empty,
        PickupWarehouseAddress = o.PickupWarehouse?.Address ?? string.Empty,
        ShipperId = o.PickupShipperId,
        ShipperName = o.PickupShipper?.FullName,
        ShipperPhone = o.PickupShipper?.Phone,
        PickedQuantity = o.PickedQuantity,
        PickupNote = o.PickupNote,
        CancelReason = o.CancelReason,
        CreatedAt = o.CreatedAt,
        AcceptedAt = o.AcceptedAt,
        PickedUpAt = o.PickedUpAt,
        CanModify = canModify,
        History = withHistory
            ? o.History.OrderBy(h => h.CreatedAt).Select(h => new OrderHistoryDto
            {
                Status = StatusKey(h.Status),
                Note = h.Note,
                ActorName = h.ActorUser?.FullName,
                CreatedAt = h.CreatedAt,
            }).ToList()
            : new List<OrderHistoryDto>(),
    };
}
