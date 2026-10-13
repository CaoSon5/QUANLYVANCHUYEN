using Microsoft.EntityFrameworkCore;
using SpreeExpress.Api.Data;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Repositories.Interfaces;

namespace SpreeExpress.Api.Repositories.Implementations;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db) => _db = db;

    public Task<User?> GetByIdAsync(Guid id) =>
        _db.Users.Include(u => u.Warehouse).FirstOrDefaultAsync(u => u.Id == id);

    public Task<User?> GetByIdentifierAsync(string identifier) =>
        _db.Users.Include(u => u.Warehouse).FirstOrDefaultAsync(u => u.Email == identifier || u.Phone == identifier);

    public Task<bool> EmailExistsAsync(string email, Guid? excludeId = null) =>
        _db.Users.AnyAsync(u => u.Email == email && (excludeId == null || u.Id != excludeId));

    public Task<bool> PhoneExistsAsync(string phone, Guid? excludeId = null) =>
        _db.Users.AnyAsync(u => u.Phone == phone && (excludeId == null || u.Id != excludeId));

    public Task<bool> AnyAdminAsync() =>
        _db.Users.AnyAsync(u => u.Role == UserRole.Admin);

    public async Task<(List<User> Items, int Total)> SearchAsync(
        string? search, UserRole? role, bool? isActive, int page, int pageSize)
    {
        IQueryable<User> query = _db.Users.AsNoTracking().Include(u => u.Warehouse);

        if (!string.IsNullOrWhiteSpace(search))
        {
            // Tìm không phân biệt hoa thường theo tên, email, số điện thoại
            var escaped = search.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
            var pattern = $"%{escaped}%";
            query = query.Where(u =>
                EF.Functions.ILike(u.FullName, pattern) ||
                EF.Functions.ILike(u.Email, pattern) ||
                EF.Functions.ILike(u.Phone, pattern));
        }

        if (role.HasValue)
        {
            var r = role.Value;
            query = query.Where(u => u.Role == r);
        }

        if (isActive.HasValue)
        {
            var a = isActive.Value;
            query = query.Where(u => u.IsActive == a);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    public Task<int> CountAsync() => _db.Users.CountAsync();

    public Task<int> CountActiveAsync() => _db.Users.CountAsync(u => u.IsActive);

    public async Task AddAsync(User user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(User user)
    {
        await _db.SaveChangesAsync();
    }
}
