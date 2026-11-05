// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Controllers\
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Tra cứu hành trình đơn hàng cho khách nhận hàng bằng mã vận đơn hoặc số điện thoại (FR69).
// Không cần đăng nhập, nên có giới hạn số lần gọi theo IP và chỉ trả thông tin đã che bớt.
[ApiController]
[Route("api/public/tracking")]
[AllowAnonymous]
public class PublicTrackingController : ControllerBase
{
    private readonly IOrderService _orders;

    public PublicTrackingController(IOrderService orders) => _orders = orders;

    // Địa chỉ IP của người gọi. Phía sau proxy (Render) lấy mục cuối của X-Forwarded-For,
    // là mục do proxy tin cậy thêm vào, người dùng không giả mạo được.
    private string ClientIp()
    {
        var forwarded = Request.Headers["X-Forwarded-For"].ToString();
        if (!string.IsNullOrWhiteSpace(forwarded))
            return forwarded.Split(',').Last().Trim();
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private ObjectResult TooManyRequests() =>
        StatusCode(StatusCodes.Status429TooManyRequests,
            new { message = "Bạn tra cứu quá nhanh, vui lòng thử lại sau ít phút" });

    // Tra cứu theo mã vận đơn: chi tiết và hành trình
    [HttpGet("{code}")]
    public async Task<ActionResult<PublicTrackingDto>> ByCode(string code)
    {
        if (!PublicRateLimiter.Allow($"code:{ClientIp()}", 60, TimeSpan.FromMinutes(1)))
            return TooManyRequests();

        return Ok(await _orders.GetPublicTrackingAsync(code));
    }

    // Tra cứu theo số điện thoại người nhận: chỉ danh sách rút gọn, giới hạn chặt hơn vì dễ bị dò
    [HttpGet]
    public async Task<ActionResult<List<PublicTrackingSummaryDto>>> ByPhone([FromQuery] string? phone)
    {
        if (!PublicRateLimiter.Allow($"phone:{ClientIp()}", 15, TimeSpan.FromMinutes(1)))
            return TooManyRequests();

        return Ok(await _orders.FindPublicByPhoneAsync(phone ?? string.Empty));
    }
}
