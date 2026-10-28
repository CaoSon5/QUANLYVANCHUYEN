// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Repositories\Implementations\
using Microsoft.EntityFrameworkCore;
using SpreeExpress.Api.Data;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Repositories.Interfaces;

namespace SpreeExpress.Api.Repositories.Implementations;

public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _db;

    public OrderRepository(AppDbContext db) => _db = db;

    public Task<long> NextCodeNumberAsync() =>
        _db.Database.SqlQuery<long>($"SELECT nextval('order_code_seq') AS \"Value\"").FirstAsync();

    public Task<Order?> GetTrackedAsync(Guid id) =>
        _db.Orders
            .Include(o => o.Seller)
            .Include(o => o.PickupWarehouse)
            .Include(o => o.PickupShipper)
            .Include(o => o.CurrentWarehouse)
            .Include(o => o.DeliveryShipper)
            .FirstOrDefaultAsync(o => o.Id == id);

    private IQueryable<Order> DetailQuery() =>
        _db.Orders.AsNoTracking()
            .Include(o => o.Seller)
            .Include(o => o.PickupWarehouse)
            .Include(o => o.PickupShipper)
            .Include(o => o.CurrentWarehouse)
            .Include(o => o.DeliveryShipper)
            .Include(o => o.History).ThenInclude(h => h.ActorUser);

    public Task<Order?> GetDetailAsync(Guid id) =>
        DetailQuery().FirstOrDefaultAsync(o => o.Id == id);

    public Task<Order?> GetByCodeAsync(string code) =>
        DetailQuery().FirstOrDefaultAsync(o => o.Code == code);

    public async Task<(List<Order> Items, int Total)> SearchAsync(OrderFilter f)
    {
        IQueryable<Order> query = _db.Orders.AsNoTracking()
            .Include(o => o.Seller)
            .Include(o => o.PickupWarehouse)
            .Include(o => o.PickupShipper)
            .Include(o => o.CurrentWarehouse)
            .Include(o => o.DeliveryShipper);

        if (f.SellerId.HasValue)
        {
            var id = f.SellerId.Value;
            query = query.Where(o => o.SellerId == id);
        }

        if (f.PickupWarehouseId.HasValue)
        {
            var id = f.PickupWarehouseId.Value;
            query = query.Where(o => o.PickupWarehouseId == id);
        }

        if (f.PickupShipperId.HasValue)
        {
            var id = f.PickupShipperId.Value;
            query = query.Where(o => o.PickupShipperId == id);
        }

        if (f.DeliveryShipperId.HasValue)
        {
            var id = f.DeliveryShipperId.Value;
            query = query.Where(o => o.DeliveryShipperId == id);
        }

        if (f.CurrentWarehouseId.HasValue)
        {
            var id = f.CurrentWarehouseId.Value;
            query = query.Where(o => o.CurrentWarehouseId == id);
        }

        if (f.Statuses is { Count: > 0 })
        {
            var statuses = f.Statuses;
            query = query.Where(o => statuses.Contains(o.Status));
        }

        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var escaped = f.Search.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
            var pattern = $"%{escaped}%";
            query = query.Where(o =>
                EF.Functions.ILike(o.Code, pattern) ||
                EF.Functions.ILike(o.ReceiverName, pattern) ||
                EF.Functions.ILike(o.ReceiverPhone, pattern) ||
                EF.Functions.ILike(o.SenderName, pattern));
        }

        var total = await query.CountAsync();

        query = f.OldestFirst
            ? query.OrderBy(o => o.CreatedAt)
            : query.OrderByDescending(o => o.CreatedAt);

        var items = await query
            .Skip((f.Page - 1) * f.PageSize)
            .Take(f.PageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<SellerOrderCounts> GetSellerCountsAsync(Guid sellerId)
    {
        var mine = _db.Orders.AsNoTracking().Where(o => o.SellerId == sellerId);

        return new SellerOrderCounts
        {
            Total = await mine.CountAsync(o => o.Status != OrderStatus.Cancelled),
            InProgress = await mine.CountAsync(o =>
                o.Status != OrderStatus.Cancelled &&
                o.Status != OrderStatus.Delivered &&
                o.Status != OrderStatus.Returned),
            Delivered = await mine.CountAsync(o => o.Status == OrderStatus.Delivered),
            CodPending = await mine.Where(o => o.Status == OrderStatus.Delivered).SumAsync(o => o.CodCollected ?? o.CodAmount),
        };
    }

    public Task<Order?> GetTrackedByCodeAsync(string code) =>
        _db.Orders
            .Include(o => o.Seller)
            .Include(o => o.PickupWarehouse)
            .Include(o => o.PickupShipper)
            .Include(o => o.CurrentWarehouse)
            .Include(o => o.DeliveryShipper)
            .FirstOrDefaultAsync(o => o.Code == code);

    public async Task<SellerOrderCounts> GetOverallCountsAsync()
    {
        var all = _db.Orders.AsNoTracking();

        return new SellerOrderCounts
        {
            Total = await all.CountAsync(o => o.Status != OrderStatus.Cancelled),
            InProgress = await all.CountAsync(o =>
                o.Status != OrderStatus.Cancelled &&
                o.Status != OrderStatus.Delivered &&
                o.Status != OrderStatus.Returned),
            Delivered = await all.CountAsync(o => o.Status == OrderStatus.Delivered),
            CodPending = await all.Where(o => o.Status == OrderStatus.Delivered).SumAsync(o => o.CodCollected ?? o.CodAmount),
        };
    }

    public async Task<WarehouseOrderCounts> GetWarehouseCountsAsync(
        Guid warehouseId, DateTime startOfTodayUtc, DateTime staleBeforeUtc)
    {
        // Hàng đang nằm trong kho: đã nhập kho, kể cả đơn shipper đã nhận giao nhưng kho chưa xuất
        var inventory = _db.Orders.AsNoTracking()
            .Where(o => o.CurrentWarehouseId == warehouseId &&
                        (o.Status == OrderStatus.InWarehouse || o.Status == OrderStatus.DeliveryAccepted ||
                         o.Status == OrderStatus.DeliveryFailed || o.Status == OrderStatus.Returning));

        return new WarehouseOrderCounts
        {
            Incoming = await _db.Orders.CountAsync(o =>
                o.PickupWarehouseId == warehouseId && o.Status == OrderStatus.PickedUp),
            Inventory = await inventory.CountAsync(),
            ReceivedToday = await _db.Orders.CountAsync(o =>
                o.CurrentWarehouseId == warehouseId && o.ReceivedAt >= startOfTodayUtc),
            Stale = await inventory.CountAsync(o => o.ReceivedAt < staleBeforeUtc),
            AwaitingDispatch = await _db.Orders.CountAsync(o =>
                o.CurrentWarehouseId == warehouseId && o.Status == OrderStatus.DeliveryAccepted),
            DispatchedToday = await _db.Orders.CountAsync(o =>
                o.CurrentWarehouseId == warehouseId && o.DispatchedAt >= startOfTodayUtc),
        };
    }

    public Task<int> CountPendingPickupAsync(Guid warehouseId) =>
        _db.Orders.CountAsync(o => o.PickupWarehouseId == warehouseId && o.Status == OrderStatus.PendingPickup);

    public Task<int> CountAcceptedPickupAsync(Guid shipperId) =>
        _db.Orders.CountAsync(o => o.PickupShipperId == shipperId && o.Status == OrderStatus.PickupAccepted);

    public Task<int> CountDeliverableAsync(Guid warehouseId) =>
        _db.Orders.CountAsync(o => o.CurrentWarehouseId == warehouseId &&
            (o.Status == OrderStatus.InWarehouse || o.Status == OrderStatus.DeliveryFailed));

    public Task<int> CountDeliveryAsync(Guid shipperId, OrderStatus status) =>
        _db.Orders.CountAsync(o => o.DeliveryShipperId == shipperId && o.Status == status);

    public Task<decimal> SumCodCollectedByShipperAsync(Guid shipperId) =>
        _db.Orders
            .Where(o => o.DeliveryShipperId == shipperId && o.Status == OrderStatus.Delivered)
            .SumAsync(o => o.CodCollected ?? 0m);

    public Task<List<OrderPhotoInfo>> GetPhotoInfosAsync(Guid orderId) =>
        _db.OrderPhotos.AsNoTracking()
            .Where(p => p.OrderId == orderId)
            .OrderBy(p => p.CreatedAt)
            .Select(p => new OrderPhotoInfo
            {
                Id = p.Id,
                Kind = p.Kind,
                CreatedAt = p.CreatedAt,
                UploadedByName = p.UploadedBy != null ? p.UploadedBy.FullName : null,
            })
            .ToListAsync();

    public Task<OrderPhoto?> GetPhotoAsync(Guid orderId, Guid photoId) =>
        _db.OrderPhotos.AsNoTracking().FirstOrDefaultAsync(p => p.Id == photoId && p.OrderId == orderId);

    public void AddPhoto(OrderPhoto photo) => _db.OrderPhotos.Add(photo);

    public async Task AddAsync(Order order)
    {
        _db.Orders.Add(order);
        await SaveAsync();
    }

    // Thêm hẳn vào DbSet (không thêm qua order.History) để chắc chắn là INSERT
    public void AddHistory(OrderStatusHistory history) => _db.OrderStatusHistory.Add(history);

    public async Task SaveAsync()
    {
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // Đơn vừa bị người khác đổi trạng thái (ví dụ shipper khác nhận trước, hoặc người bán vừa hủy)
            throw new AppException("Đơn hàng vừa được cập nhật bởi người khác, vui lòng tải lại trang", 409);
        }
    }
}
