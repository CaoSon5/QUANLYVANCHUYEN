using SpreeExpress.Api.DTOs;

namespace SpreeExpress.Api.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<UserDto> GetMeAsync(Guid userId);
    Task<AuthResponse> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);

    // Thiết lập lần đầu: chỉ cho tạo admin khi hệ thống chưa có admin nào
    Task<bool> NeedsSetupAsync();
    Task<AuthResponse> SetupAdminAsync(SetupAdminRequest request);
}
