using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Repositories.Interfaces;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Services.Implementations;

// Quản lý tài khoản (chỉ Admin được gọi, xem UsersController)
public class UserService : IUserService
{
    private readonly IUserRepository _users;
    private readonly IWarehouseRepository _warehouses;

    public UserService(IUserRepository users, IWarehouseRepository warehouses)
    {
        _users = users;
        _warehouses = warehouses;
    }

    public async Task<PagedResult<UserDetailDto>> ListAsync(
        string? search, string? role, bool? isActive, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        UserRole? roleFilter = null;
        if (!string.IsNullOrWhiteSpace(role))
        {
            if (!Enum.TryParse<UserRole>(role, ignoreCase: true, out var r) || !Enum.IsDefined(r))
                throw new AppException("Vai trò không hợp lệ", 400);
            roleFilter = r;
        }

        var (items, total) = await _users.SearchAsync(search?.Trim(), roleFilter, isActive, page, pageSize);

        return new PagedResult<UserDetailDto>
        {
            Items = items.Select(ToDetail).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<UserSummaryDto> GetSummaryAsync() => new()
    {
        Total = await _users.CountAsync(),
        Active = await _users.CountActiveAsync(),
    };

    public async Task<UserDetailDto> CreateAsync(CreateUserRequest request)
    {
        var role = ParseAssignableRole(request.Role);
        var email = request.Email.Trim().ToLowerInvariant();
        var phone = request.Phone.Trim();

        if (await _users.EmailExistsAsync(email))
            throw new AppException("Email đã được sử dụng", 409);
        if (await _users.PhoneExistsAsync(phone))
            throw new AppException("Số điện thoại đã được sử dụng", 409);

        var warehouseId = await ResolveWarehouseAsync(role, request.WarehouseId, currentWarehouseId: null);

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Phone = phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = role,
            WarehouseId = warehouseId,
            MustChangePassword = true, // nhân viên phải tự đổi mật khẩu ở lần đăng nhập đầu
        };

        await _users.AddAsync(user);

        // Nạp lại để có thông tin kho đi kèm
        var saved = await _users.GetByIdAsync(user.Id) ?? user;
        return ToDetail(saved);
    }

    public async Task<UserDetailDto> UpdateAsync(Guid id, UpdateUserRequest request)
    {
        var user = await GetOrThrowAsync(id);
        var email = request.Email.Trim().ToLowerInvariant();
        var phone = request.Phone.Trim();

        if (await _users.EmailExistsAsync(email, id))
            throw new AppException("Email đã được sử dụng", 409);
        if (await _users.PhoneExistsAsync(phone, id))
            throw new AppException("Số điện thoại đã được sử dụng", 409);

        // Vai trò của Admin cố định; những người khác không được nâng lên Admin
        if (user.Role != UserRole.Admin)
        {
            var role = ParseAssignableRole(request.Role);
            var warehouseId = await ResolveWarehouseAsync(role, request.WarehouseId, user.WarehouseId);
            user.Role = role;
            user.WarehouseId = warehouseId;
        }

        user.FullName = request.FullName.Trim();
        user.Email = email;
        user.Phone = phone;

        await _users.UpdateAsync(user);

        var saved = await _users.GetByIdAsync(id) ?? user;
        return ToDetail(saved);
    }

    public async Task<UserDetailDto> SetStatusAsync(Guid currentUserId, Guid id, bool isActive)
    {
        var user = await GetOrThrowAsync(id);

        // Không cho khóa Admin (duy nhất) hoặc tự khóa chính mình, tránh bị khóa khỏi hệ thống
        if (!isActive && (user.Role == UserRole.Admin || user.Id == currentUserId))
            throw new AppException("Không thể khóa tài khoản Admin", 400);

        user.IsActive = isActive;
        await _users.UpdateAsync(user);
        return ToDetail(user);
    }

    public async Task ResetPasswordAsync(Guid id, string newPassword)
    {
        var user = await GetOrThrowAsync(id);
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        // Mật khẩu do Admin đặt chỉ là mật khẩu tạm; riêng Admin tự đặt cho mình thì không bắt đổi
        user.MustChangePassword = user.Role != UserRole.Admin;
        await _users.UpdateAsync(user);
    }

    private async Task<User> GetOrThrowAsync(Guid id) =>
        await _users.GetByIdAsync(id) ?? throw new AppException("Không tìm thấy tài khoản", 404);

    // Nhân viên kho và shipper bắt buộc thuộc một kho; các vai trò khác không có kho.
    // currentWarehouseId: kho hiện tại của người đó, để vẫn sửa được thông tin khi kho đã ngừng hoạt động.
    private async Task<Guid?> ResolveWarehouseAsync(UserRole role, Guid? warehouseId, Guid? currentWarehouseId)
    {
        if (role != UserRole.Warehouse && role != UserRole.Shipper) return null;

        if (!warehouseId.HasValue)
            throw new AppException(
                role == UserRole.Shipper ? "Vui lòng chọn kho địa phương cho shipper" : "Vui lòng chọn kho cho nhân viên kho", 400);

        var warehouse = await _warehouses.GetByIdAsync(warehouseId.Value)
                        ?? throw new AppException("Không tìm thấy kho", 400);

        if (role == UserRole.Shipper && warehouse.Type != WarehouseType.Local)
            throw new AppException("Shipper chỉ được gán vào kho địa phương", 400);

        if (warehouseId != currentWarehouseId && !warehouse.IsActive)
            throw new AppException("Kho đã ngừng hoạt động", 400);

        return warehouseId;
    }

    // Vai trò được phép gán: mọi vai trò TRỪ Admin (hệ thống chỉ có một Admin)
    private static UserRole ParseAssignableRole(string value)
    {
        if (!Enum.TryParse<UserRole>(value, ignoreCase: true, out var role) || !Enum.IsDefined(role))
            throw new AppException("Vai trò không hợp lệ", 400);
        if (role == UserRole.Admin)
            throw new AppException("Hệ thống chỉ có một Admin, không thể tạo thêm", 400);
        return role;
    }

    private static UserDetailDto ToDetail(User u) => new()
    {
        Id = u.Id,
        FullName = u.FullName,
        Email = u.Email,
        Phone = u.Phone,
        Role = u.Role.ToString().ToLowerInvariant(),
        IsActive = u.IsActive,
        MustChangePassword = u.MustChangePassword,
        WarehouseId = u.WarehouseId,
        WarehouseCode = u.Warehouse?.Code,
        WarehouseName = u.Warehouse?.Name,
        CreatedAt = u.CreatedAt,
    };
}
