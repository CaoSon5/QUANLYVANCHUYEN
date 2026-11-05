// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Controllers\
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Shipper: xem COD đang giữ và nộp tiền (FR57)
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Shipper")]
public class CodController : ControllerBase
{
    private readonly IFinanceService _finance;

    public CodController(IFinanceService finance) => _finance = finance;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // COD đang giữ: đơn giao thành công, đã thu tiền, chưa nộp
    [HttpGet("holding")]
    public async Task<ActionResult<HoldingDto>> Holding() =>
        Ok(await _finance.GetHoldingAsync(UserId));

    // Nộp COD: không gửi orderIds thì nộp tất cả đơn đang giữ
    [HttpPost("remittances")]
    public async Task<ActionResult<RemittanceDto>> Create(CreateRemittanceRequest request) =>
        Ok(await _finance.CreateRemittanceAsync(UserId, request.OrderIds));

    [HttpGet("remittances")]
    public async Task<ActionResult<PagedResult<RemittanceDto>>> List(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _finance.ListRemittancesAsync(UserId, status, page, pageSize));

    [HttpGet("remittances/{id:guid}")]
    public async Task<ActionResult<RemittanceDto>> Get(Guid id) =>
        Ok(await _finance.GetRemittanceAsync(id, UserId));
}
