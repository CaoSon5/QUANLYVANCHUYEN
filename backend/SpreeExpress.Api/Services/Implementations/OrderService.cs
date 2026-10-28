// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Services\Implementations\
using System.Globalization;
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
    private readonly int _maxAttempts;

    public OrderService(
        IOrderRepository orders, IUserRepository users,
        IWarehouseRepository warehouses, ShippingFeeCalculator fees, IConfiguration config)
    {
        // Số lần giao thất bại tối đa (FR55). Đổi bằng cấu hình Delivery:MaxAttempts, mặc định 3.
        _maxAttempts = Math.Max(1, config.GetValue("Delivery:MaxAttempts", 3));
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

        return await WithPhotosAsync(ToDto(order, canModify: order.Status == OrderStatus.PendingPickup, withHistory: true));
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
        return await WithPhotosAsync(ToDto(order, canModify, withHistory: true));
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
                PendingDelivery = user.WarehouseId.HasValue ? await _orders.CountDeliverableAsync(user.WarehouseId.Value) : 0,
                AcceptedDelivery = await _orders.CountDeliveryAsync(userId, OrderStatus.DeliveryAccepted),
                OutForDelivery = await _orders.CountDeliveryAsync(userId, OrderStatus.OutForDelivery),
                CodCollected = await _orders.SumCodCollectedByShipperAsync(userId),
            };
        }

        if (user.Role == UserRole.Warehouse)
        {
            if (!user.WarehouseId.HasValue) return new OrderSummaryDto();

            // Ngày mới tính theo giờ Việt Nam (UTC+7)
            var startOfTodayUtc = DateTime.UtcNow.AddHours(7).Date.AddHours(-7);
            var staleBeforeUtc = DateTime.UtcNow.AddHours(-48);
            var c = await _orders.GetWarehouseCountsAsync(user.WarehouseId.Value, startOfTodayUtc, staleBeforeUtc);

            return new OrderSummaryDto
            {
                Incoming = c.Incoming,
                Inventory = c.Inventory,
                ReceivedToday = c.ReceivedToday,
                Stale48h = c.Stale,
                AwaitingDispatch = c.AwaitingDispatch,
                DispatchedToday = c.DispatchedToday,
            };
        }

        if (user.Role == UserRole.Admin || user.Role == UserRole.Dispatcher)
        {
            var c = await _orders.GetOverallCountsAsync();
            return new OrderSummaryDto
            {
                Total = c.Total,
                InProgress = c.InProgress,
                Delivered = c.Delivered,
                CodPending = c.CodPending,
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

    // ================= ADMIN, ĐIỀU PHỐI: XEM MỌI ĐƠN =================

    public async Task<PagedResult<OrderDto>> ListAllAsync(string? search, string? status, int page, int pageSize)
    {
        var filter = new OrderFilter
        {
            Search = search?.Trim(),
            Statuses = string.IsNullOrWhiteSpace(status) ? null : new List<OrderStatus> { ParseStatus(status) },
        };
        return await SearchAsync(filter, page, pageSize, canModifyForSeller: false);
    }

    // ================= NHÂN VIÊN KHO =================

    // FR32, FR40: xem hàng của kho mình (không thấy kho khác)
    public async Task<PagedResult<OrderDto>> ListWarehouseOrdersAsync(
        Guid staffId, string scope, string? search, int page, int pageSize)
    {
        var staff = await GetWarehouseStaffAsync(staffId);

        var filter = new OrderFilter { Search = search?.Trim(), OldestFirst = true };
        if (scope == "incoming")
        {
            // Shipper đã lấy hàng, đang mang về kho của đơn này
            filter.PickupWarehouseId = staff.WarehouseId;
            filter.Statuses = new List<OrderStatus> { OrderStatus.PickedUp };
        }
        else if (scope == "dispatch")
        {
            // Shipper đã nhận giao, đang chờ kho xuất hàng
            filter.CurrentWarehouseId = staff.WarehouseId;
            filter.Statuses = new List<OrderStatus> { OrderStatus.DeliveryAccepted };
        }
        else
        {
            // Tồn kho: hàng đang nằm trong kho (kể cả đơn đã có shipper nhận giao nhưng chưa xuất)
            filter.CurrentWarehouseId = staff.WarehouseId;
            filter.Statuses = new List<OrderStatus>
            {
                OrderStatus.InWarehouse, OrderStatus.DeliveryAccepted, OrderStatus.DeliveryFailed, OrderStatus.Returning,
            };
        }

        return await SearchAsync(filter, page, pageSize, canModifyForSeller: false);
    }

    // FR29: nhập hàng vào kho bằng cách quét (hoặc gõ) mã vận đơn khi shipper mang hàng về
    public async Task<OrderDto> ReceiveAtWarehouseAsync(Guid staffId, ReceiveOrderRequest request)
    {
        var staff = await GetWarehouseStaffAsync(staffId);

        var code = request.Code.Trim().ToUpperInvariant();
        var order = await _orders.GetTrackedByCodeAsync(code)
                    ?? throw new AppException($"Không tìm thấy đơn hàng {code}", 404);

        // Mỗi kho chỉ nhập hàng của kho mình
        if (order.PickupWarehouseId != staff.WarehouseId)
            throw new AppException($"Đơn {code} thuộc kho {order.PickupWarehouse?.Code}, không phải kho của bạn", 403);

        if (order.Status == OrderStatus.InWarehouse && order.CurrentWarehouseId == staff.WarehouseId)
            throw new AppException($"Đơn {code} đã được nhập kho trước đó", 409);

        if (order.Status != OrderStatus.PickedUp)
        {
            var reason = order.Status switch
            {
                OrderStatus.PendingPickup => "chưa có shipper nhận",
                OrderStatus.PickupAccepted => "shipper chưa lấy hàng",
                OrderStatus.Cancelled => "đã bị hủy",
                _ => "không ở trạng thái chờ nhập kho",
            };
            throw new AppException($"Không nhập kho được: đơn {code} {reason}", 409);
        }

        var expected = order.PickedQuantity ?? order.Quantity;
        var received = request.ReceivedQuantity ?? expected;
        var note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        order.Status = OrderStatus.InWarehouse;
        order.CurrentWarehouseId = staff.WarehouseId;
        order.ReceivedAt = DateTime.UtcNow;
        order.ReceivedQuantity = received;
        order.UpdatedAt = DateTime.UtcNow;

        var text = $"Đã nhập kho {order.PickupWarehouse?.Code}: nhận {received}/{expected} kiện";
        if (received != expected) text += " (lệch so với số kiện shipper đã lấy)";
        if (note is not null) text += $". Ghi chú: {note}";

        _orders.AddHistory(new OrderStatusHistory
        {
            OrderId = order.Id,
            Status = OrderStatus.InWarehouse,
            Note = text,
            ActorUserId = staffId,
        });

        await _orders.SaveAsync();
        return await LoadDtoAsync(order.Id, canModify: false);
    }

    // FR31: kho xuất hàng cho shipper đã nhận giao. Nhân viên kho quét mã để đối chiếu và bàn giao.
    public async Task<OrderDto> DispatchToShipperAsync(Guid staffId, DispatchOrderRequest request)
    {
        var staff = await GetWarehouseStaffAsync(staffId);

        var code = request.Code.Trim().ToUpperInvariant();
        var order = await _orders.GetTrackedByCodeAsync(code)
                    ?? throw new AppException($"Không tìm thấy đơn hàng {code}", 404);

        if (order.CurrentWarehouseId != staff.WarehouseId)
            throw new AppException($"Đơn {code} không nằm trong kho của bạn", 403);

        if (order.Status != OrderStatus.DeliveryAccepted)
        {
            var reason = order.Status switch
            {
                OrderStatus.InWarehouse => "chưa có shipper nào nhận giao",
                OrderStatus.OutForDelivery => "đã được xuất kho trước đó",
                OrderStatus.Cancelled => "đã bị hủy",
                _ => "không ở trạng thái chờ xuất kho",
            };
            throw new AppException($"Không xuất kho được: đơn {code} {reason}", 409);
        }

        var shipperName = order.DeliveryShipper?.FullName ?? "shipper";

        order.Status = OrderStatus.OutForDelivery;
        order.DispatchedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;

        _orders.AddHistory(new OrderStatusHistory
        {
            OrderId = order.Id,
            Status = OrderStatus.OutForDelivery,
            Note = $"Kho {order.CurrentWarehouse?.Code} đã xuất hàng cho shipper {shipperName}, đang đi giao",
            ActorUserId = staffId,
        });

        await _orders.SaveAsync();
        return await LoadDtoAsync(order.Id, canModify: false);
    }

    // ================= SHIPPER NHẬN GIAO HÀNG =================

    // FR52: đơn đã nhập kho tại kho mình phụ trách, đang chờ shipper nhận giao
    public async Task<PagedResult<OrderDto>> ListDeliverableAsync(
        Guid shipperId, string? search, int page, int pageSize)
    {
        var shipper = await GetShipperWithWarehouseAsync(shipperId);

        var filter = new OrderFilter
        {
            CurrentWarehouseId = shipper.WarehouseId,
            Statuses = new List<OrderStatus> { OrderStatus.InWarehouse, OrderStatus.DeliveryFailed },
            Search = search?.Trim(),
            OldestFirst = true,
        };
        return await SearchAsync(filter, page, pageSize, canModifyForSeller: false);
    }

    // status: accepted (đã nhận, chờ lấy hàng ở kho) | out_for_delivery (đang đi giao)
    public async Task<PagedResult<OrderDto>> ListMyDeliveriesAsync(
        Guid shipperId, string? status, string? search, int page, int pageSize)
    {
        var statuses = status switch
        {
            "accepted" => new List<OrderStatus> { OrderStatus.DeliveryAccepted },
            "out_for_delivery" => new List<OrderStatus> { OrderStatus.OutForDelivery },
            _ => new List<OrderStatus> { OrderStatus.DeliveryAccepted, OrderStatus.OutForDelivery },
        };

        var filter = new OrderFilter
        {
            DeliveryShipperId = shipperId,
            Statuses = statuses,
            Search = search?.Trim(),
            OldestFirst = true,
        };
        return await SearchAsync(filter, page, pageSize, canModifyForSeller: false);
    }

    // FR52: shipper tự chọn đơn muốn giao
    public async Task<OrderDto> AcceptDeliveryAsync(Guid shipperId, Guid orderId)
    {
        var shipper = await GetShipperWithWarehouseAsync(shipperId);
        var order = await _orders.GetTrackedAsync(orderId)
                    ?? throw new AppException("Không tìm thấy đơn hàng", 404);

        if (order.CurrentWarehouseId != shipper.WarehouseId)
            throw new AppException("Đơn này không nằm ở kho bạn phụ trách", 403);
        if (order.Status != OrderStatus.InWarehouse && order.Status != OrderStatus.DeliveryFailed)
            throw new AppException("Đơn đã có người nhận giao hoặc chưa sẵn sàng để giao", 409);

        var retry = order.Status == OrderStatus.DeliveryFailed;
        var retryText = retry ? $" lại (lần {order.DeliveryAttempts + 1})" : "";

        order.Status = OrderStatus.DeliveryAccepted;
        order.DeliveryShipperId = shipperId;
        order.DeliveryAcceptedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;

        _orders.AddHistory(new OrderStatusHistory
        {
            OrderId = order.Id,
            Status = OrderStatus.DeliveryAccepted,
            Note = $"Shipper {shipper.FullName} đã nhận giao{retryText}, sẽ đến kho lấy hàng",
            ActorUserId = shipperId,
        });

        await _orders.SaveAsync();
        return await LoadDtoAsync(order.Id, canModify: false);
    }

    // ================= SHIPPER CẬP NHẬT KẾT QUẢ GIAO =================

    private static readonly Dictionary<string, string> FailureReasons = new()
    {
        ["no_contact"] = "Không liên lạc được với người nhận",
        ["refused"] = "Khách từ chối nhận hàng",
        ["wrong_address"] = "Sai địa chỉ giao hàng",
    };

    // FR53, FR56: giao thành công, ghi nhận số COD thực thu và ảnh bàn giao (nếu có)
    public async Task<OrderDto> CompleteDeliveryAsync(
        Guid shipperId, Guid orderId, decimal? collectedAmount, string? note, List<PhotoUpload> photos)
    {
        var order = await _orders.GetTrackedAsync(orderId)
                    ?? throw new AppException("Không tìm thấy đơn hàng", 404);
        EnsureMyDelivery(order, shipperId);

        var collected = collectedAmount ?? order.CodAmount;
        note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();

        // Thu khác số COD của đơn thì bắt buộc ghi lý do
        if (collected != order.CodAmount && note is null)
            throw new AppException(
                $"Số tiền thu ({Vnd(collected)}) khác số COD của đơn ({Vnd(order.CodAmount)}), vui lòng ghi chú lý do", 400);

        order.Status = OrderStatus.Delivered;
        order.DeliveredAt = DateTime.UtcNow;
        order.CodCollected = collected;
        order.UpdatedAt = DateTime.UtcNow;

        var text = order.CodAmount > 0 ? $"Giao thành công. Đã thu COD {Vnd(collected)}" : "Giao thành công (đơn không thu COD)";
        if (collected != order.CodAmount) text += $" (đơn yêu cầu {Vnd(order.CodAmount)})";
        if (note is not null) text += $". Ghi chú: {note}";
        if (photos.Count > 0) text += $". Kèm {photos.Count} ảnh";

        AddHistoryWithPhotos(order, OrderStatus.Delivered, text, shipperId, "delivered", photos);
        await _orders.SaveAsync();
        return await LoadDtoAsync(order.Id, canModify: false);
    }

    // FR54, FR55: giao thất bại kèm lý do. Chưa quá số lần quy định thì giao lại, quá thì chuyển sang chờ hoàn hàng.
    public async Task<OrderDto> FailDeliveryAsync(
        Guid shipperId, Guid orderId, string reason, string? note, List<PhotoUpload> photos)
    {
        if (!FailureReasons.TryGetValue(reason, out var reasonText))
            throw new AppException("Lý do giao thất bại không hợp lệ", 400);

        var order = await _orders.GetTrackedAsync(orderId)
                    ?? throw new AppException("Không tìm thấy đơn hàng", 404);
        EnsureMyDelivery(order, shipperId);

        note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();

        order.DeliveryAttempts += 1;
        order.LastFailureReason = reason;
        order.UpdatedAt = DateTime.UtcNow;

        string text;
        if (order.DeliveryAttempts >= _maxAttempts)
        {
            order.Status = OrderStatus.Returning;
            text = $"Giao thất bại lần {order.DeliveryAttempts}/{_maxAttempts}: {reasonText}. Đã hết số lần giao lại, đơn chuyển sang chờ hoàn hàng về người bán";
        }
        else
        {
            order.Status = OrderStatus.DeliveryFailed;
            text = $"Giao thất bại lần {order.DeliveryAttempts}/{_maxAttempts}: {reasonText}. Đơn sẽ được giao lại";
        }

        if (note is not null) text += $". Ghi chú: {note}";
        if (photos.Count > 0) text += $". Kèm {photos.Count} ảnh";

        AddHistoryWithPhotos(order, order.Status, text, shipperId, "failed", photos);
        await _orders.SaveAsync();
        return await LoadDtoAsync(order.Id, canModify: false);
    }

    // Ảnh minh chứng: chỉ người có quyền xem đơn mới xem được ảnh
    public async Task<(byte[] Data, string ContentType)> GetPhotoAsync(Guid userId, Guid orderId, Guid photoId)
    {
        var viewer = await GetUserAsync(userId);
        var order = await _orders.GetDetailAsync(orderId);
        if (order is null || !CanView(viewer, order))
            throw new AppException("Không tìm thấy ảnh", 404);

        var photo = await _orders.GetPhotoAsync(orderId, photoId)
                    ?? throw new AppException("Không tìm thấy ảnh", 404);
        return (photo.Data, photo.ContentType);
    }

    private static void EnsureMyDelivery(Order order, Guid shipperId)
    {
        if (order.DeliveryShipperId != shipperId)
            throw new AppException("Bạn không phải shipper giao đơn này", 403);
        if (order.Status != OrderStatus.OutForDelivery)
            throw new AppException("Đơn không ở trạng thái đang giao (kho chưa xuất hàng hoặc đã cập nhật kết quả)", 409);
    }

    private void AddHistoryWithPhotos(
        Order order, OrderStatus status, string note, Guid actorId, string kind, List<PhotoUpload> photos)
    {
        _orders.AddHistory(new OrderStatusHistory
        {
            OrderId = order.Id,
            Status = status,
            Note = note,
            ActorUserId = actorId,
        });

        foreach (var p in photos)
        {
            _orders.AddPhoto(new OrderPhoto
            {
                OrderId = order.Id,
                Kind = kind,
                ContentType = p.ContentType,
                Data = p.Data,
                UploadedById = actorId,
            });
        }
    }

    private async Task<OrderDto> WithPhotosAsync(OrderDto dto)
    {
        var photos = await _orders.GetPhotoInfosAsync(dto.Id);
        dto.Photos = photos.Select(p => new OrderPhotoDto
        {
            Id = p.Id,
            Kind = p.Kind,
            CreatedAt = p.CreatedAt,
            UploadedByName = p.UploadedByName,
        }).ToList();
        return dto;
    }

    // 1500000 -> "1.500.000đ" (tự định dạng để không phụ thuộc ngôn ngữ máy chủ)
    private static string Vnd(decimal v) => v.ToString("#,0", CultureInfo.InvariantCulture).Replace(",", ".") + "đ";

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
        return await WithPhotosAsync(ToDto(order, canModify, withHistory: true));
    }

    private async Task<User> GetUserAsync(Guid userId) =>
        await _users.GetByIdAsync(userId) ?? throw new AppException("Không tìm thấy tài khoản", 404);

    private async Task<User> GetWarehouseStaffAsync(Guid staffId)
    {
        var user = await GetUserAsync(staffId);
        if (user.Role != UserRole.Warehouse)
            throw new AppException("Chỉ nhân viên kho mới dùng được chức năng này", 403);
        if (!user.WarehouseId.HasValue)
            throw new AppException("Tài khoản chưa được gán kho. Vui lòng liên hệ quản lý.", 400);
        return user;
    }

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
                            || order.DeliveryShipperId == viewer.Id
                            || (order.Status == OrderStatus.PendingPickup && order.PickupWarehouseId == viewer.WarehouseId)
                            || ((order.Status == OrderStatus.InWarehouse || order.Status == OrderStatus.DeliveryFailed)
                                && viewer.WarehouseId.HasValue && order.CurrentWarehouseId == viewer.WarehouseId),
        UserRole.Warehouse => viewer.WarehouseId.HasValue
                              && (order.PickupWarehouseId == viewer.WarehouseId || order.CurrentWarehouseId == viewer.WarehouseId),
        _ => false,
    };

    private static bool IsInWarehouse(OrderStatus s) =>
        s == OrderStatus.InWarehouse || s == OrderStatus.DeliveryAccepted
        || s == OrderStatus.DeliveryFailed || s == OrderStatus.Returning;

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

    private OrderDto ToDto(Order o, bool canModify, bool withHistory) => new()
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
        // "Đang ở kho" chỉ đúng khi hàng còn nằm trong kho (chưa xuất)
        CurrentWarehouseCode = IsInWarehouse(o.Status) ? o.CurrentWarehouse?.Code : null,
        CurrentWarehouseName = IsInWarehouse(o.Status) ? o.CurrentWarehouse?.Name : null,
        DeliveryShipperId = o.DeliveryShipperId,
        DeliveryShipperName = o.DeliveryShipper?.FullName,
        DeliveryShipperPhone = o.DeliveryShipper?.Phone,
        DeliveryAcceptedAt = o.DeliveryAcceptedAt,
        DispatchedAt = o.DispatchedAt,
        DeliveryAttempts = o.DeliveryAttempts,
        MaxDeliveryAttempts = _maxAttempts,
        DeliveredAt = o.DeliveredAt,
        CodCollected = o.CodCollected,
        LastFailureReason = o.LastFailureReason,
        ReceivedAt = o.ReceivedAt,
        ReceivedQuantity = o.ReceivedQuantity,
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
