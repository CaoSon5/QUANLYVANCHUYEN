using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Toàn bộ API quản lý tài khoản chỉ dành cho Admin
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _users;

    public UsersController(IUserService users) => _users = users;

    [HttpGet]
    public async Task<ActionResult<PagedResult<UserDetailDto>>> List(
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _users.ListAsync(search, role, isActive, page, pageSize));

    [HttpGet("summary")]
    public async Task<ActionResult<UserSummaryDto>> Summary() =>
        Ok(await _users.GetSummaryAsync());

    [HttpPost]
    public async Task<ActionResult<UserDetailDto>> Create(CreateUserRequest request) =>
        Ok(await _users.CreateAsync(request));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserDetailDto>> Update(Guid id, UpdateUserRequest request) =>
        Ok(await _users.UpdateAsync(id, request));

    // Khóa / mở khóa tài khoản (không xóa để giữ lịch sử đơn hàng)
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<UserDetailDto>> SetStatus(Guid id, SetStatusRequest request)
    {
        var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _users.SetStatusAsync(currentUserId, id, request.IsActive));
    }

    // Admin đặt lại mật khẩu cho người khác
    [HttpPost("{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, ResetPasswordRequest request)
    {
        await _users.ResetPasswordAsync(id, request.NewPassword);
        return NoContent();
    }
}
