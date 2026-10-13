// Đặt vào: D:\spreeexpress\backend\SpreeExpress.Api\Repositories\Implementations\
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SpreeExpress.Api.Data;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Repositories.Interfaces;

namespace SpreeExpress.Api.Repositories.Implementations;

public class WarehouseRepository : IWarehouseRepository
{
    private readonly AppDbContext _db;

    public WarehouseRepository(AppDbContext db) => _db = db;

    private static readonly Expression<Func<Warehouse, WarehouseRow>> ToRow = w => new WarehouseRow
    {
        Id = w.Id,
        Code = w.Code,
        Name = w.Name,
        Address = w.Address,
        Type = w.Type,
        ParentId = w.ParentId,
        ParentCode = w.Parent != null ? w.Parent.Code : null,
        ParentName = w.Parent != null ? w.Parent.Name : null,
        IsActive = w.IsActive,
        CreatedAt = w.CreatedAt,
        StaffCount = w.Members.Count(m => m.Role == UserRole.Warehouse),
        ShipperCount = w.Members.Count(m => m.Role == UserRole.Shipper),
    };

    public Task<Warehouse?> GetByIdAsync(Guid id) =>
        _db.Warehouses.FirstOrDefaultAsync(w => w.Id == id);

    public Task<Warehouse?> GetDetailAsync(Guid id) =>
        _db.Warehouses.AsNoTracking()
            .Include(w => w.Children)
            .Include(w => w.Members)
            .FirstOrDefaultAsync(w => w.Id == id);

    public Task<WarehouseRow?> GetRowAsync(Guid id) =>
        _db.Warehouses.AsNoTracking().Where(w => w.Id == id).Select(ToRow).FirstOrDefaultAsync();

    public async Task<(List<WarehouseRow> Items, int Total)> SearchAsync(
        string? search, WarehouseType? type, bool? isActive, int page, int pageSize)
    {
        IQueryable<Warehouse> query = _db.Warehouses.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var escaped = search.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
            var pattern = $"%{escaped}%";
            query = query.Where(w => EF.Functions.ILike(w.Code, pattern) || EF.Functions.ILike(w.Name, pattern));
        }

        if (type.HasValue)
        {
            var t = type.Value;
            query = query.Where(w => w.Type == t);
        }

        if (isActive.HasValue)
        {
            var a = isActive.Value;
            query = query.Where(w => w.IsActive == a);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(w => w.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToRow)
            .ToListAsync();

        return (items, total);
    }

    public async Task<(int Total, int Active, int Regional, int Local)> GetCountsAsync()
    {
        var total = await _db.Warehouses.CountAsync();
        var active = await _db.Warehouses.CountAsync(w => w.IsActive);
        var regional = await _db.Warehouses.CountAsync(w => w.Type == WarehouseType.Regional);
        var local = await _db.Warehouses.CountAsync(w => w.Type == WarehouseType.Local);
        return (total, active, regional, local);
    }

    public Task<List<Warehouse>> GetActiveAsync() =>
        _db.Warehouses.AsNoTracking().Where(w => w.IsActive).OrderBy(w => w.Code).ToListAsync();

    public Task<bool> CodeExistsAsync(string code) =>
        _db.Warehouses.AnyAsync(w => w.Code == code);

    public Task<bool> HasChildrenAsync(Guid id) =>
        _db.Warehouses.AnyAsync(w => w.ParentId == id);

    public Task<bool> HasActiveChildrenAsync(Guid id) =>
        _db.Warehouses.AnyAsync(w => w.ParentId == id && w.IsActive);

    public Task<bool> HasShippersAsync(Guid id) =>
        _db.Users.AnyAsync(u => u.WarehouseId == id && u.Role == UserRole.Shipper);

    public async Task AddAsync(Warehouse warehouse)
    {
        _db.Warehouses.Add(warehouse);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Warehouse warehouse)
    {
        await _db.SaveChangesAsync();
    }
}
