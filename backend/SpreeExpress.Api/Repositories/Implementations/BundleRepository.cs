// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Repositories\Implementations\
using Microsoft.EntityFrameworkCore;
using SpreeExpress.Api.Data;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Repositories.Interfaces;

namespace SpreeExpress.Api.Repositories.Implementations;

public class BundleRepository : IBundleRepository
{
    private readonly AppDbContext _db;

    public BundleRepository(AppDbContext db) => _db = db;

    public Task<long> NextNumberAsync() =>
        _db.Database.SqlQuery<long>($"SELECT nextval('bundle_code_seq') AS \"Value\"").FirstAsync();

    public void Add(Bundle bundle) => _db.Bundles.Add(bundle);

    public Task<Bundle?> GetTrackedAsync(Guid id) =>
        _db.Bundles
            .Include(b => b.Origin)
            .Include(b => b.Current)
            .Include(b => b.Destination)
            .Include(b => b.CreatedBy)
            .Include(b => b.Orders)
            .FirstOrDefaultAsync(b => b.Id == id);

    public Task<Bundle?> GetTrackedByCodeAsync(string code) =>
        _db.Bundles
            .Include(b => b.Origin)
            .Include(b => b.Current)
            .Include(b => b.Destination)
            .Include(b => b.Orders)
            .FirstOrDefaultAsync(b => b.Code == code);

    public Task<Bundle?> GetDetailAsync(Guid id) =>
        _db.Bundles.AsNoTracking()
            .Include(b => b.Origin)
            .Include(b => b.Current)
            .Include(b => b.Destination)
            .Include(b => b.CreatedBy)
            .Include(b => b.Orders)
            .FirstOrDefaultAsync(b => b.Id == id);

    public async Task<(List<Bundle> Items, int Total)> SearchAsync(BundleFilter f)
    {
        IQueryable<Bundle> query = _db.Bundles.AsNoTracking()
            .Include(b => b.Origin)
            .Include(b => b.Current)
            .Include(b => b.Destination)
            .Include(b => b.CreatedBy);

        if (f.CurrentWarehouseId.HasValue)
        {
            var warehouseId = f.CurrentWarehouseId.Value;
            query = query.Where(b => b.CurrentWarehouseId == warehouseId);
        }

        if (f.Status.HasValue)
        {
            var status = f.Status.Value;
            query = query.Where(b => b.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var escaped = f.Search.Trim().Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
            var pattern = $"%{escaped}%";
            query = query.Where(b =>
                EF.Functions.ILike(b.Code, pattern) ||
                b.Orders.Any(o => EF.Functions.ILike(o.Code, pattern)));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((f.Page - 1) * f.PageSize)
            .Take(f.PageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task SaveAsync()
    {
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            // Có người khác vừa thao tác cùng các đơn này (ví dụ đơn vừa được thêm vào bao khác)
            throw new AppException("Dữ liệu vừa được người khác cập nhật, vui lòng tải lại trang và thử lại", 409);
        }
    }
}
