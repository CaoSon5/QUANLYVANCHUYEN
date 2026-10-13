using SpreeExpress.Api.DTOs;

namespace SpreeExpress.Api.Services.Interfaces;

public interface IUserService
{
    Task<PagedResult<UserDetailDto>> ListAsync(string? search, string? role, bool? isActive, int page, int pageSize);
    Task<UserSummaryDto> GetSummaryAsync();
    Task<UserDetailDto> CreateAsync(CreateUserRequest request);
    Task<UserDetailDto> UpdateAsync(Guid id, UpdateUserRequest request);
    Task<UserDetailDto> SetStatusAsync(Guid currentUserId, Guid id, bool isActive);
    Task ResetPasswordAsync(Guid id, string newPassword);
}
