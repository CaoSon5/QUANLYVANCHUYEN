using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Entities;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Repositories.Interfaces;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly JwtTokenGenerator _jwt;

    public AuthService(IUserRepository users, JwtTokenGenerator jwt)
    {
        _users = users;
        _jwt = jwt;
    }

    // Đăng ký công khai: LUÔN tạo tài khoản Người bán.
    // Tài khoản nhân viên (điều phối, kho, tài xế, shipper...) do Admin tạo, không cho tự đăng ký.
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var user = await CreateUserAsync(
            request.FullName, request.Email, request.Phone, request.Password, UserRole.Seller);
        return BuildResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var identifier = request.Identifier.Trim();
        identifier = identifier.Contains('@')
            ? identifier.ToLowerInvariant()
            : identifier.Replace(" ", "");

        var user = await _users.GetByIdentifierAsync(identifier);

        // Cùng một thông báo cho "không tồn tại" và "sai mật khẩu" để không lộ tài khoản nào có thật
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new AppException("Sai tài khoản hoặc mật khẩu", 401);

        if (!user.IsActive)
            throw new AppException("Tài khoản đã bị khóa", 403);

        // Vai trò lấy từ database, frontend dựa vào đó để đưa vào đúng giao diện
        return BuildResponse(user);
    }

    public async Task<UserDto> GetMeAsync(Guid userId)
    {
        var user = await _users.GetByIdAsync(userId)
                   ?? throw new AppException("Không tìm thấy tài khoản", 404);
        return ToDto(user);
    }

    public async Task<AuthResponse> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _users.GetByIdAsync(userId)
                   ?? throw new AppException("Không tìm thấy tài khoản", 404);

        // Dùng mã 400 (không phải 401) để frontend không tự đăng xuất khi nhập sai mật khẩu hiện tại
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new AppException("Mật khẩu hiện tại không đúng", 400);

        if (request.CurrentPassword == request.NewPassword)
            throw new AppException("Mật khẩu mới phải khác mật khẩu hiện tại", 400);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.MustChangePassword = false;
        await _users.UpdateAsync(user);

        return BuildResponse(user);
    }

    public async Task<bool> NeedsSetupAsync() => !await _users.AnyAdminAsync();

    public async Task<AuthResponse> SetupAdminAsync(SetupAdminRequest request)
    {
        if (await _users.AnyAdminAsync())
            throw new AppException("Hệ thống đã được thiết lập, không thể tạo admin theo cách này", 403);

        var user = await CreateUserAsync(
            request.FullName, request.Email, request.Phone, request.Password, UserRole.Admin);
        return BuildResponse(user);
    }

    private async Task<User> CreateUserAsync(
        string fullName, string email, string phone, string password, UserRole role)
    {
        email = email.Trim().ToLowerInvariant();
        phone = phone.Trim();

        if (await _users.EmailExistsAsync(email))
            throw new AppException("Email đã được sử dụng", 409);
        if (await _users.PhoneExistsAsync(phone))
            throw new AppException("Số điện thoại đã được sử dụng", 409);

        var user = new User
        {
            FullName = fullName.Trim(),
            Email = email,
            Phone = phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = role,
        };

        await _users.AddAsync(user);
        return user;
    }

    private AuthResponse BuildResponse(User user) => new()
    {
        Token = _jwt.Generate(user),
        User = ToDto(user),
    };

    private static UserDto ToDto(User u) => new()
    {
        Id = u.Id,
        FullName = u.FullName,
        Email = u.Email,
        Phone = u.Phone,
        Role = u.Role.ToString().ToLowerInvariant(),
        MustChangePassword = u.MustChangePassword,
        WarehouseId = u.WarehouseId,
        WarehouseCode = u.Warehouse?.Code,
        WarehouseName = u.Warehouse?.Name,
    };
}
