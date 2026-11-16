// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Repositories\Implementations\
using Microsoft.EntityFrameworkCore;
using SpreeExpress.Api.Data;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Repositories.Interfaces;

namespace SpreeExpress.Api.Repositories.Implementations;

public class TripRepository : ITripRepository
{
    private readonly AppDbContext _db;

    public TripRepository(AppDbContext db) => _db = db;

    public Task<long> NextNumberAsync() =>
        _db.Database.SqlQuery<long>($"SELECT nextval('trip_code_seq') AS \"Value\"").FirstAsync();

    public void Add(Trip trip) => _db.Trips.Add(trip);

    public Task<Trip?> GetTrackedAsync(Guid id) =>
        _db.Trips
            .Include(t => t.Driver)
            .Include(t => t.Pickup)
            .Include(t => t.Current)
            .Include(t => t.Next)
            .Include(t => t.Stops)
            .Include(t => t.Discrepancies)
            .Include(t => t.Bundles).ThenInclude(b => b.Orders)
            .Include(t => t.Bundles).ThenInclude(b => b.Destination)
            .Include(t => t.Bundles).ThenInclude(b => b.LoadedAtWarehouse)
            .FirstOrDefaultAsync(t => t.Id == id);

    public Task<Trip?> GetDetailAsync(Guid id) =>
        _db.Trips.AsNoTracking()
            .Include(t => t.Driver)
            .Include(t => t.Pickup)
            .Include(t => t.Current)
            .Include(t => t.Next)
            .Include(t => t.Stops).ThenInclude(s => s.Warehouse)
            .Include(t => t.Discrepancies).ThenInclude(d => d.Warehouse)
            .Include(t => t.Discrepancies).ThenInclude(d => d.ReportedBy)
            .Include(t => t.Bundles).ThenInclude(b => b.Destination)
            .Include(t => t.Bundles).ThenInclude(b => b.LoadedAtWarehouse)
            .FirstOrDefaultAsync(t => t.Id == id);

    public async Task<(List<Trip> Items, int Total)> SearchAsync(TripFilter f)
    {
        IQueryable<Trip> query = _db.Trips.AsNoTracking()
            .Include(t => t.Driver)
            .Include(t => t.Pickup)
            .Include(t => t.Current)
            .Include(t => t.Next)
            .Include(t => t.Bundles);

        if (f.DriverId.HasValue)
        {
            var driverId = f.DriverId.Value;
            query = query.Where(t => t.DriverId == driverId);
        }

        if (f.WarehouseId.HasValue)
        {
            var w = f.WarehouseId.Value;
            query = query.Where(t => t.PickupWarehouseId == w || t.CurrentWarehouseId == w || t.NextWarehouseId == w
                                     || t.Bundles.Any(b => b.DestinationWarehouseId == w || b.OriginWarehouseId == w));
        }

        if (f.Status.HasValue)
        {
            var status = f.Status.Value;
            query = query.Where(t => t.Status == status);
        }

        if (f.ActiveOnly)
        {
            query = query.Where(t => t.Status == TripStatus.Assigned
                                     || t.Status == TripStatus.AtWarehouse
                                     || t.Status == TripStatus.InTransit);
        }

        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var escaped = f.Search.Trim().Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
            var pattern = $"%{escaped}%";
            query = query.Where(t =>
                EF.Functions.ILike(t.Code, pattern) ||
                (t.Driver != null && EF.Functions.ILike(t.Driver.FullName, pattern)) ||
                t.Bundles.Any(b => EF.Functions.ILike(b.Code, pattern)));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((f.Page - 1) * f.PageSize)
            .Take(f.PageSize)
            .ToListAsync();

        return (items, total);
    }

    public Task<Trip?> GetActiveForDriverAsync(Guid driverId) =>
        _db.Trips.AsNoTracking()
            .FirstOrDefaultAsync(t => t.DriverId == driverId
                                      && (t.Status == TripStatus.Assigned
                                          || t.Status == TripStatus.AtWarehouse
                                          || t.Status == TripStatus.InTransit));

    public Task<List<Trip>> GetActiveTripsAsync() =>
        _db.Trips.AsNoTracking()
            .Include(t => t.Current)
            .Include(t => t.Next)
            .Where(t => t.Status == TripStatus.Assigned
                        || t.Status == TripStatus.AtWarehouse
                        || t.Status == TripStatus.InTransit)
            .ToListAsync();

    public Task<List<Trip>> GetTripsForWarehouseAsync(Guid warehouseId) =>
        _db.Trips.AsNoTracking()
            .Include(t => t.Driver)
            .Include(t => t.Pickup)
            .Include(t => t.Current)
            .Include(t => t.Next)
            .Include(t => t.Bundles).ThenInclude(b => b.Destination)
            .Include(t => t.Bundles).ThenInclude(b => b.LoadedAtWarehouse)
            .Where(t => (t.Status == TripStatus.AtWarehouse && t.CurrentWarehouseId == warehouseId)
                        || ((t.Status == TripStatus.Assigned || t.Status == TripStatus.InTransit)
                            && t.NextWarehouseId == warehouseId))
            .OrderBy(t => t.CreatedAt)
            .ToListAsync();

    public Task<List<User>> GetDriversAsync() =>
        _db.Users.AsNoTracking()
            .Include(u => u.Warehouse)
            .Where(u => u.Role == UserRole.Driver && u.IsActive)
            .OrderBy(u => u.FullName)
            .ToListAsync();

    // Kho tài xế đứng khi hoàn thành chuyến gần nhất (dùng làm "kho hiện tại" của tài xế rảnh, FR23)
    public async Task<Dictionary<Guid, Guid>> GetLastCompletedWarehouseByDriverAsync()
    {
        var rows = await _db.Trips.AsNoTracking()
            .Where(t => t.Status == TripStatus.Completed && t.CurrentWarehouseId != null)
            .Select(t => new { t.DriverId, t.CompletedAt, t.CurrentWarehouseId })
            .ToListAsync();

        return rows
            .GroupBy(r => r.DriverId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(r => r.CompletedAt).First().CurrentWarehouseId!.Value);
    }

    public async Task<List<WarehouseLabel>> GetWarehouseLabelsAsync(IEnumerable<Guid> ids)
    {
        var list = ids.Distinct().ToList();
        var rows = await _db.Warehouses.AsNoTracking()
            .Where(w => list.Contains(w.Id))
            .Select(w => new { w.Id, w.Code, w.Name })
            .ToListAsync();
        return rows.Select(w => new WarehouseLabel { Id = w.Id, Code = w.Code, Name = w.Name }).ToList();
    }

    public async Task<List<StaleItem>> GetStaleItemsAsync(
        DateTime pendingPickupBefore, DateTime unclaimedDeliveryBefore,
        DateTime unloadedBundleBefore, DateTime assignedTripBefore)
    {
        var result = new List<StaleItem>();

        var pickups = await _db.Orders.AsNoTracking()
            .Include(o => o.PickupWarehouse)
            .Where(o => o.Status == OrderStatus.PendingPickup && o.CreatedAt < pendingPickupBefore)
            .OrderBy(o => o.CreatedAt).Take(50).ToListAsync();
        result.AddRange(pickups.Select(o => new StaleItem
        {
            Kind = "order_pickup", Id = o.Id, Code = o.Code, Since = o.CreatedAt,
            Text = "Chờ shipper nhận lấy hàng", WarehouseCode = o.PickupWarehouse?.Code,
        }));

        var deliveries = await _db.Orders.AsNoTracking()
            .Include(o => o.CurrentWarehouse)
            .Where(o => o.Status == OrderStatus.InWarehouse && o.ReceivedAt != null && o.ReceivedAt < unclaimedDeliveryBefore)
            .OrderBy(o => o.ReceivedAt).Take(50).ToListAsync();
        result.AddRange(deliveries.Select(o => new StaleItem
        {
            Kind = "order_delivery", Id = o.Id, Code = o.Code, Since = o.ReceivedAt!.Value,
            Text = "Đã nhập kho nhưng chưa có shipper nhận giao", WarehouseCode = o.CurrentWarehouse?.Code,
        }));

        var bundles = await _db.Bundles.AsNoTracking()
            .Include(b => b.Current)
            .Include(b => b.Destination)
            .Where(b => b.Status == BundleStatus.Sealed && b.SealedAt != null && b.SealedAt < unloadedBundleBefore)
            .OrderBy(b => b.SealedAt).Take(50).ToListAsync();
        result.AddRange(bundles.Select(b => new StaleItem
        {
            Kind = "bundle", Id = b.Id, Code = b.Code, Since = b.SealedAt!.Value,
            Text = $"Bao đã đóng, chưa lên xe (đi kho {b.Destination?.Code})", WarehouseCode = b.Current?.Code,
        }));

        var trips = await _db.Trips.AsNoTracking()
            .Include(t => t.Driver)
            .Include(t => t.Pickup)
            .Where(t => t.Status == TripStatus.Assigned && t.CreatedAt < assignedTripBefore)
            .OrderBy(t => t.CreatedAt).Take(50).ToListAsync();
        result.AddRange(trips.Select(t => new StaleItem
        {
            Kind = "trip", Id = t.Id, Code = t.Code, Since = t.CreatedAt,
            Text = $"Tài xế {t.Driver?.FullName} chưa đến kho nhận hàng", WarehouseCode = t.Pickup?.Code,
        }));

        return result;
    }

    public async Task SaveAsync()
    {
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // Có người khác vừa thao tác cùng bao hoặc đơn này
            throw new AppException("Dữ liệu vừa được người khác cập nhật, vui lòng tải lại trang và thử lại", 409);
        }
    }
}
