// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Services\Implementations\
using System.Text.RegularExpressions;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Repositories.Interfaces;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Services.Implementations;

// Bao hàng: gộp nhiều đơn cùng đi một kho đích để chuyển giữa các kho (FR33, FR34, FR40)
public class BundleService : IBundleService
{
    private readonly IBundleRepository _bundles;
    private readonly IOrderRepository _orders;
    private readonly IWarehouseRepository _warehouses;
    private readonly IUserRepository _users;

    public BundleService(
        IBundleRepository bundles, IOrderRepository orders,
        IWarehouseRepository warehouses, IUserRepository users)
    {
        _bundles = bundles;
        _orders = orders;
        _warehouses = warehouses;
        _users = users;
    }

    // ================= CHỌN KHO ĐÍCH =================

    // Kho đích của bao chính là KHO KẾ TIẾP trên đường đi (không phải kho đích cuối của đơn):
    //  - Kho địa phương: chỉ đi về kho vùng của mình.
    //  - Kho vùng: đi xuống các kho địa phương của nó, hoặc sang kho vùng khác.
    public async Task<List<DestinationOptionDto>> ListDestinationsAsync(Guid staffId, string? search)
    {
        var staff = await GetStaffAsync(staffId);
        var all = await ActiveMapAsync();
        var text = search?.Trim();

        return AllowedNextHops(staff.WarehouseId!.Value, all)
            .Where(w => string.IsNullOrEmpty(text)
                        || w.Code.Contains(text, StringComparison.OrdinalIgnoreCase)
                        || w.Name.Contains(text, StringComparison.OrdinalIgnoreCase))
            .OrderBy(w => w.Code)
            .Select(w => new DestinationOptionDto
            {
                Id = w.Id,
                Code = w.Code,
                Name = w.Name,
                Type = w.Type.ToString().ToLowerInvariant(),
                ParentCode = w.ParentId.HasValue && all.TryGetValue(w.ParentId.Value, out var p) ? p.Code : null,
            })
            .ToList();
    }

    // Các đơn trong kho của nhân viên (đã nhập kho, chưa vào bao) có kho kế tiếp đúng bằng kho đích của bao này.
    // Dùng để hiện sẵn danh sách "đơn đi kho này" khi gộp bao.
    public async Task<List<BundleOrderDto>> ListCandidatesAsync(Guid staffId, Guid bundleId)
    {
        var staff = await GetStaffAsync(staffId);
        var bundle = await GetOwnTrackedAsync(staff, bundleId);
        var all = await ActiveMapAsync();

        var (items, _) = await _orders.SearchAsync(new OrderFilter
        {
            CurrentWarehouseId = staff.WarehouseId,
            Statuses = new List<OrderStatus> { OrderStatus.InWarehouse },
            OldestFirst = true,
            Page = 1,
            PageSize = 500,
        });

        return items
            .Where(o => ResolveNextHop(o.DestinationWarehouseId, staff.WarehouseId!.Value, all).Next?.Id == bundle.DestinationWarehouseId)
            .Select(o => new BundleOrderDto
            {
                OrderId = o.Id,
                Code = o.Code,
                ReceiverName = o.ReceiverName,
                ReceiverDistrict = o.ReceiverDistrict,
                ReceiverProvince = o.ReceiverProvince,
                WeightKg = o.WeightKg,
                Pieces = o.ReceivedQuantity ?? o.Quantity,
                CodAmount = o.CodAmount,
            }).ToList();
    }

    // ================= TẠO, THÊM, BỚT, ĐÓNG BAO =================

    // Nhập mã kho đích một lần lúc tạo bao, sau đó chỉ việc thêm đơn
    public async Task<BundleDto> CreateAsync(Guid staffId, CreateBundleRequest request)
    {
        var staff = await GetStaffAsync(staffId);

        var code = request.DestinationCode.Trim().ToUpperInvariant();
        var all = await ActiveMapAsync();
        var destination = all.Values.FirstOrDefault(w => w.Code.ToUpperInvariant() == code)
                          ?? throw new AppException($"Không tìm thấy kho đích có mã {code} (hoặc kho đã ngừng hoạt động)", 404);

        if (destination.Id == staff.WarehouseId)
            throw new AppException("Kho đích phải khác kho của bạn", 400);

        var allowed = AllowedNextHops(staff.WarehouseId!.Value, all);
        if (!allowed.Any(w => w.Id == destination.Id))
            throw new AppException(
                $"Từ kho của bạn chỉ gộp bao đi các kho: {string.Join(", ", allowed.Select(w => w.Code).OrderBy(c => c))}. " +
                "Hàng đi nơi khác phải về kho vùng trước.", 400);

        var number = await _bundles.NextNumberAsync();
        var bundle = new Bundle
        {
            Code = $"BAO{DateTime.UtcNow.AddHours(7):yyMMdd}{number:D5}",
            OriginWarehouseId = staff.WarehouseId!.Value,
            CurrentWarehouseId = staff.WarehouseId!.Value,
            DestinationWarehouseId = destination.Id,
            Note = Clean(request.Note),
            CreatedById = staffId,
        };

        _bundles.Add(bundle);
        await _bundles.SaveAsync();
        return await DetailAsync(bundle.Id);
    }

    // Thêm một đơn vào bao bằng cách quét hoặc nhập mã vận đơn
    public async Task<BundleDto> AddOrderAsync(Guid staffId, Guid bundleId, string orderCode)
    {
        var staff = await GetStaffAsync(staffId);
        var bundle = await GetOwnTrackedAsync(staff, bundleId);

        if (bundle.Status != BundleStatus.Open)
            throw new AppException("Bao đã đóng, hãy mở lại bao trước khi thêm đơn", 409);

        var code = (orderCode ?? string.Empty).Trim().ToUpperInvariant();
        var order = await _orders.GetTrackedByCodeAsync(code)
                    ?? throw new AppException($"Không tìm thấy đơn hàng {code}", 404);

        if (order.CurrentWarehouseId != staff.WarehouseId)
            throw new AppException($"Đơn {code} không nằm trong kho của bạn", 403);

        if (order.BundleId == bundle.Id)
            throw new AppException($"Đơn {code} đã có trong bao này rồi", 409);

        if (order.Status != OrderStatus.InWarehouse)
        {
            var reason = order.Status switch
            {
                OrderStatus.Bundled => $"đã nằm trong bao {order.Bundle?.Code}",
                OrderStatus.DeliveryAccepted => "đã có shipper nhận giao",
                OrderStatus.DeliveryFailed => "đang chờ giao lại",
                OrderStatus.Returning => "đang chờ hoàn hàng",
                OrderStatus.OutForDelivery => "đang được giao",
                OrderStatus.PickedUp => "chưa nhập kho",
                _ => "không ở trạng thái đã nhập kho",
            };
            throw new AppException($"Không thêm vào bao được: đơn {code} {reason}", 409);
        }

        // Kho kế tiếp của đơn phải trùng kho đích của bao
        var all = await ActiveMapAsync();
        var (next, problem) = ResolveNextHop(order.DestinationWarehouseId, staff.WarehouseId!.Value, all);
        if (next is null)
            throw new AppException($"Không thêm vào bao được: đơn {code} {problem}", 409);
        if (next.Id != bundle.DestinationWarehouseId)
            throw new AppException($"Đơn {code} cần đi kho {next.Code}, không thuộc bao đi kho {bundle.Destination?.Code}", 409);

        order.Status = OrderStatus.Bundled;
        order.BundleId = bundle.Id;
        order.UpdatedAt = DateTime.UtcNow;
        bundle.Orders.Add(order);
        Recalculate(bundle);

        _orders.AddHistory(new OrderStatusHistory
        {
            OrderId = order.Id,
            Status = OrderStatus.Bundled,
            Note = $"Đã đưa vào bao {bundle.Code} (đi kho {bundle.Destination?.Code})",
            ActorUserId = staffId,
        });

        await _bundles.SaveAsync();
        return await DetailAsync(bundle.Id);
    }

    // Gỡ một đơn khỏi bao: đơn trở lại trạng thái đã nhập kho
    public async Task<BundleDto> RemoveOrderAsync(Guid staffId, Guid bundleId, Guid orderId)
    {
        var staff = await GetStaffAsync(staffId);
        var bundle = await GetOwnTrackedAsync(staff, bundleId);

        if (bundle.Status != BundleStatus.Open)
            throw new AppException("Bao đã đóng, hãy mở lại bao trước khi bớt đơn", 409);

        var order = bundle.Orders.FirstOrDefault(o => o.Id == orderId)
                    ?? throw new AppException("Đơn này không có trong bao", 404);

        ReleaseOrder(order, bundle, $"Đã gỡ khỏi bao {bundle.Code}", staffId);
        bundle.Orders.Remove(order);
        Recalculate(bundle);

        await _bundles.SaveAsync();
        return await DetailAsync(bundle.Id);
    }

    public async Task<BundleDto> SealAsync(Guid staffId, Guid bundleId)
    {
        var staff = await GetStaffAsync(staffId);
        var bundle = await GetOwnTrackedAsync(staff, bundleId);

        if (bundle.Status != BundleStatus.Open)
            throw new AppException("Bao này đã được đóng rồi", 409);
        if (bundle.Orders.Count == 0)
            throw new AppException("Bao chưa có đơn nào, hãy thêm đơn trước khi đóng bao", 400);

        bundle.Status = BundleStatus.Sealed;
        bundle.SealedAt = DateTime.UtcNow;

        await _bundles.SaveAsync();
        return await DetailAsync(bundle.Id);
    }

    // Mở lại bao đã đóng (chưa lên xe) để thêm hoặc bớt đơn (FR34)
    public async Task<BundleDto> ReopenAsync(Guid staffId, Guid bundleId)
    {
        var staff = await GetStaffAsync(staffId);
        var bundle = await GetOwnTrackedAsync(staff, bundleId);

        if (bundle.Status != BundleStatus.Sealed)
            throw new AppException("Chỉ mở lại được bao đang ở trạng thái đã đóng, chưa lên xe", 409);

        bundle.Status = BundleStatus.Open;
        bundle.SealedAt = null;

        await _bundles.SaveAsync();
        return await DetailAsync(bundle.Id);
    }

    // Hủy bao: mọi đơn bên trong trở lại trạng thái đã nhập kho
    public async Task<BundleDto> CancelAsync(Guid staffId, Guid bundleId)
    {
        var staff = await GetStaffAsync(staffId);
        var bundle = await GetOwnTrackedAsync(staff, bundleId);

        if (bundle.Status != BundleStatus.Open && bundle.Status != BundleStatus.Sealed)
            throw new AppException("Chỉ hủy được bao chưa lên xe", 409);

        foreach (var order in bundle.Orders.ToList())
            ReleaseOrder(order, bundle, $"Bao {bundle.Code} đã hủy, đơn trở lại kho", staffId);

        bundle.Orders.Clear();
        bundle.Status = BundleStatus.Cancelled;
        Recalculate(bundle);

        await _bundles.SaveAsync();
        return await DetailAsync(bundle.Id);
    }

    // FR39: mở bao đã đến kho đích. Các đơn bên trong nhập kho, shipper của kho này giao như thường.
    public async Task<BundleDto> OpenAsync(Guid staffId, Guid bundleId)
    {
        var staff = await GetStaffAsync(staffId);
        var bundle = await GetOwnTrackedAsync(staff, bundleId);

        if (bundle.Status != BundleStatus.Received)
            throw new AppException("Chỉ mở được bao đã đến kho đích và đã được kho nhận", 409);

        var now = DateTime.UtcNow;
        foreach (var order in bundle.Orders)
        {
            order.Status = OrderStatus.InWarehouse;
            order.CurrentWarehouseId = staff.WarehouseId;
            order.ReceivedAt = now;   // tính thời gian lưu kho từ lúc nhập kho đích
            order.UpdatedAt = now;

            _orders.AddHistory(new OrderStatusHistory
            {
                OrderId = order.Id,
                Status = OrderStatus.InWarehouse,
                Note = $"Đã mở bao {bundle.Code}, nhập kho {bundle.Current?.Code}",
                ActorUserId = staffId,
            });
        }

        bundle.Status = BundleStatus.Opened;
        bundle.OpenedAt = now;

        await _bundles.SaveAsync();
        return await DetailAsync(bundle.Id);
    }

    // ================= XEM, TÌM KIẾM (FR20, FR40) =================

    public async Task<PagedResult<BundleDto>> ListAsync(
        Guid viewerId, string? status, string? search, int page, int pageSize)
    {
        var viewer = await GetUserAsync(viewerId);
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var filter = new BundleFilter { Search = search?.Trim(), Page = page, PageSize = pageSize };

        if (viewer.Role == UserRole.Warehouse)
        {
            if (viewer.WarehouseId is null)
                throw new AppException("Tài khoản của bạn chưa được gán kho", 403);
            filter.CurrentWarehouseId = viewer.WarehouseId;   // nhân viên kho chỉ thấy bao đang ở kho mình
        }
        else if (viewer.Role != UserRole.Admin && viewer.Role != UserRole.Dispatcher)
        {
            throw new AppException("Bạn không có quyền xem bao hàng", 403);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<BundleStatus>(status.Replace("_", ""), ignoreCase: true, out var st) || !Enum.IsDefined(st))
                throw new AppException("Trạng thái bao không hợp lệ", 400);
            filter.Status = st;
        }

        var (items, total) = await _bundles.SearchAsync(filter);
        return new PagedResult<BundleDto>
        {
            Items = items.Select(b => ToDto(b, withOrders: false)).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<BundleDto> GetAsync(Guid viewerId, Guid bundleId)
    {
        var viewer = await GetUserAsync(viewerId);
        var bundle = await _bundles.GetDetailAsync(bundleId)
                     ?? throw new AppException("Không tìm thấy bao hàng", 404);

        var allowed = viewer.Role switch
        {
            UserRole.Admin or UserRole.Dispatcher => true,
            UserRole.Warehouse => viewer.WarehouseId.HasValue
                                  && (bundle.CurrentWarehouseId == viewer.WarehouseId
                                      || bundle.DestinationWarehouseId == viewer.WarehouseId),
            _ => false,
        };
        if (!allowed) throw new AppException("Không tìm thấy bao hàng", 404);

        return ToDto(bundle, withOrders: true);
    }

    // ================= helpers =================

    // Kho đang hoạt động, tra theo Id
    private async Task<Dictionary<Guid, Warehouse>> ActiveMapAsync() =>
        (await _warehouses.GetActiveAsync()).ToDictionary(w => w.Id);

    // Các kho mà kho hiện tại được phép gộp bao đi tới (xem ListDestinationsAsync)
    private static List<Warehouse> AllowedNextHops(Guid currentId, Dictionary<Guid, Warehouse> all)
    {
        if (!all.TryGetValue(currentId, out var current)) return new List<Warehouse>();

        if (current.Type == WarehouseType.Local)
            return current.ParentId.HasValue && all.TryGetValue(current.ParentId.Value, out var hub)
                ? new List<Warehouse> { hub }
                : new List<Warehouse>();

        return all.Values
            .Where(w => w.Id != current.Id
                        && (w.Type == WarehouseType.Regional || w.ParentId == current.Id))
            .ToList();
    }

    // Kho kế tiếp của một đơn, tính từ kho đang giữ nó:
    //  - đã ở kho đích: không gộp bao, giao thẳng cho khách
    //  - ở kho địa phương khác kho đích: về kho vùng của mình
    //  - ở kho vùng: nếu kho đích thuộc vùng này thì đi thẳng kho đích, không thì sang kho vùng của kho đích
    private static (Warehouse? Next, string? Problem) ResolveNextHop(
        Guid? destinationId, Guid currentId, Dictionary<Guid, Warehouse> all)
    {
        if (!destinationId.HasValue)
            return (null, "chưa có kho đích (đơn tạo trước khi hệ thống cập nhật), cần sửa lại địa chỉ nhận");
        if (!all.TryGetValue(destinationId.Value, out var dest))
            return (null, "có kho đích đã ngừng hoạt động");
        if (!all.TryGetValue(currentId, out var current))
            return (null, "đang ở kho không còn hoạt động");
        if (current.Id == dest.Id)
            return (null, "đã tới kho đích, hãy giao thẳng cho khách, không cần gộp bao");

        Warehouse? next;
        if (current.Type == WarehouseType.Local)
            next = current.ParentId.HasValue && all.TryGetValue(current.ParentId.Value, out var hub) ? hub : null;
        else if (dest.ParentId == current.Id)
            next = dest;
        else
            next = dest.ParentId.HasValue && all.TryGetValue(dest.ParentId.Value, out var destHub) ? destHub : null;

        return next is null ? (null, "chưa xác định được kho kế tiếp (kho vùng không hoạt động)") : (next, null);
    }

    private async Task<User> GetUserAsync(Guid id) =>
        await _users.GetByIdAsync(id) ?? throw new AppException("Tài khoản không tồn tại", 401);

    private async Task<User> GetStaffAsync(Guid id)
    {
        var user = await GetUserAsync(id);
        if (user.Role != UserRole.Warehouse || user.WarehouseId is null)
            throw new AppException("Chỉ nhân viên kho đã được gán kho mới thao tác được với bao hàng", 403);
        return user;
    }

    // Bao phải đang nằm ở kho của nhân viên thì mới được thao tác
    private async Task<Bundle> GetOwnTrackedAsync(User staff, Guid bundleId)
    {
        var bundle = await _bundles.GetTrackedAsync(bundleId)
                     ?? throw new AppException("Không tìm thấy bao hàng", 404);
        if (bundle.CurrentWarehouseId != staff.WarehouseId)
            throw new AppException("Bao này không nằm trong kho của bạn", 403);
        return bundle;
    }

    private async Task<BundleDto> DetailAsync(Guid bundleId)
    {
        var bundle = await _bundles.GetDetailAsync(bundleId)
                     ?? throw new AppException("Không tìm thấy bao hàng", 404);
        return ToDto(bundle, withOrders: true);
    }

    // Đưa đơn ra khỏi bao: trở lại trạng thái đã nhập kho
    private void ReleaseOrder(Order order, Bundle bundle, string note, Guid actorId)
    {
        order.Status = OrderStatus.InWarehouse;
        order.BundleId = null;
        order.UpdatedAt = DateTime.UtcNow;

        _orders.AddHistory(new OrderStatusHistory
        {
            OrderId = order.Id,
            Status = OrderStatus.InWarehouse,
            Note = note,
            ActorUserId = actorId,
        });
    }

    private static void Recalculate(Bundle bundle)
    {
        bundle.OrderCount = bundle.Orders.Count;
        bundle.TotalWeightKg = bundle.Orders.Sum(o => o.WeightKg);
        bundle.TotalPieces = bundle.Orders.Sum(o => o.ReceivedQuantity ?? o.Quantity);
    }

    private static string? Clean(string? text) => string.IsNullOrWhiteSpace(text) ? null : text.Trim();

    // BundleStatus.InTransit -> "in_transit"
    private static string StatusKey(BundleStatus status) =>
        Regex.Replace(status.ToString(), "(?<!^)([A-Z])", "_$1").ToLowerInvariant();

    private static BundleDto ToDto(Bundle b, bool withOrders) => new()
    {
        Id = b.Id,
        Code = b.Code,
        Status = StatusKey(b.Status),
        OriginCode = b.Origin?.Code ?? string.Empty,
        OriginName = b.Origin?.Name ?? string.Empty,
        CurrentCode = b.Current?.Code ?? string.Empty,
        CurrentName = b.Current?.Name ?? string.Empty,
        DestinationId = b.DestinationWarehouseId,
        DestinationCode = b.Destination?.Code ?? string.Empty,
        DestinationName = b.Destination?.Name ?? string.Empty,
        DestinationType = b.Destination?.Type.ToString().ToLowerInvariant() ?? string.Empty,
        OrderCount = b.OrderCount,
        TotalWeightKg = b.TotalWeightKg,
        TotalPieces = b.TotalPieces,
        Note = b.Note,
        CreatedAt = b.CreatedAt,
        CreatedByName = b.CreatedBy?.FullName,
        SealedAt = b.SealedAt,
        Orders = withOrders
            ? b.Orders.OrderBy(o => o.Code).Select(o => new BundleOrderDto
            {
                OrderId = o.Id,
                Code = o.Code,
                ReceiverName = o.ReceiverName,
                ReceiverDistrict = o.ReceiverDistrict,
                ReceiverProvince = o.ReceiverProvince,
                WeightKg = o.WeightKg,
                Pieces = o.ReceivedQuantity ?? o.Quantity,
                CodAmount = o.CodAmount,
            }).ToList()
            : new List<BundleOrderDto>(),
    };
}
