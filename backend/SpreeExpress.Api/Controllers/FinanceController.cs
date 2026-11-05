// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Controllers\
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Kế toán: đối chiếu COD shipper nộp, lập bảng đối soát và xác nhận chuyển tiền cho người bán.
// Admin được xem; chỉ Kế toán được thao tác.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Accountant,Admin")]
public class FinanceController : ControllerBase
{
    private readonly IFinanceService _finance;

    public FinanceController(IFinanceService finance) => _finance = finance;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("summary")]
    public async Task<ActionResult<FinanceSummaryDto>> Summary() =>
        Ok(await _finance.GetSummaryAsync());

    // ----- Đối chiếu COD shipper -----

    // Mỗi shipper đang giữ bao nhiêu tiền COD chưa nộp
    [HttpGet("holdings")]
    public async Task<ActionResult<List<ShipperHoldingDto>>> Holdings() =>
        Ok(await _finance.GetHoldingsAsync());

    [HttpGet("remittances")]
    public async Task<ActionResult<PagedResult<RemittanceDto>>> Remittances(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _finance.ListRemittancesAsync(null, status, page, pageSize));

    [HttpGet("remittances/{id:guid}")]
    public async Task<ActionResult<RemittanceDto>> Remittance(Guid id) =>
        Ok(await _finance.GetRemittanceAsync(id, null));

    [Authorize(Roles = "Accountant")]
    [HttpPost("remittances/{id:guid}/confirm")]
    public async Task<ActionResult<RemittanceDto>> ConfirmRemittance(Guid id, ConfirmRemittanceRequest request) =>
        Ok(await _finance.ConfirmRemittanceAsync(UserId, id, request));

    // ----- Đối soát người bán -----

    [HttpGet("sellers")]
    public async Task<ActionResult<List<SellerLookupDto>>> Sellers([FromQuery] string? search) =>
        Ok(await _finance.ListSellersAsync(search));

    [Authorize(Roles = "Accountant")]
    [HttpPost("settlements/preview")]
    public async Task<ActionResult<SettlementPreviewDto>> Preview(SettlementPeriodRequest request) =>
        Ok(await _finance.PreviewSettlementAsync(request));

    [Authorize(Roles = "Accountant")]
    [HttpPost("settlements")]
    public async Task<ActionResult<SettlementDto>> CreateSettlement(CreateSettlementRequest request) =>
        Ok(await _finance.CreateSettlementAsync(UserId, request));

    [HttpGet("settlements")]
    public async Task<ActionResult<PagedResult<SettlementDto>>> Settlements(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _finance.ListSettlementsAsync(null, status, page, pageSize));

    [HttpGet("settlements/{id:guid}")]
    public async Task<ActionResult<SettlementDto>> Settlement(Guid id) =>
        Ok(await _finance.GetSettlementAsync(UserId, false, id));

    [Authorize(Roles = "Accountant")]
    [HttpPost("settlements/{id:guid}/pay")]
    public async Task<ActionResult<SettlementDto>> Pay(Guid id, PaySettlementRequest request) =>
        Ok(await _finance.PaySettlementAsync(UserId, id, request));
}
