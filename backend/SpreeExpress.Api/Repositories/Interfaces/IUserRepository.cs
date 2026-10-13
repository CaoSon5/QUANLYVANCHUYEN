using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByIdentifierAsync(string identifier); // email hoặc số điện thoại

    // excludeId: bỏ qua chính người đó khi kiểm tra trùng lúc sửa thông tin
    Task<bool> EmailExistsAsync(string email, Guid? excludeId = null);
    Task<bool> PhoneExistsAsync(string phone, Guid? excludeId = null);
    Task<bool> AnyAdminAsync();

    Task<(List<User> Items, int Total)> SearchAsync(
        string? search, UserRole? role, bool? isActive, int page, int pageSize);
    Task<int> CountAsync();
    Task<int> CountActiveAsync();

    Task AddAsync(User user);
    Task UpdateAsync(User user);
}
