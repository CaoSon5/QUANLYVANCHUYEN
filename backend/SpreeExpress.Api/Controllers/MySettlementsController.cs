// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Controllers\
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Người bán xem bảng đối soát của chính mình (FR67)
[ApiController]
[Route("api/my-settlements")]
[Authorize(Roles = "Seller")]
public class MySettlementsController : ControllerBase
{
    private readonly IFinanceService _finance;

    public MySettlementsController(IFinanceService finance) => _finance = finance;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<PagedResult<SettlementDto>>> List(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _finance.ListSettlementsAsync(UserId, status, page, pageSize));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SettlementDto>> Get(Guid id) =>
        Ok(await _finance.GetSettlementAsync(UserId, true, id));
}
