// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Controllers\
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Bao hàng: nhân viên kho tạo bao, thêm bớt đơn và đóng bao (FR33, FR34).
// Nhân viên kho xem bao ở kho mình; Admin và Điều phối viên xem tất cả (FR20, FR40).
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BundlesController : ControllerBase
{
    private readonly IBundleService _bundles;

    public BundlesController(IBundleService bundles) => _bundles = bundles;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ----- Xem -----

    [Authorize(Roles = "Warehouse,Admin,Dispatcher")]
    [HttpGet]
    public async Task<ActionResult<PagedResult<BundleDto>>> List(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _bundles.ListAsync(UserId, status, search, page, pageSize));

    [Authorize(Roles = "Warehouse,Admin,Dispatcher")]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BundleDto>> Get(Guid id) =>
        Ok(await _bundles.GetAsync(UserId, id));

    // ----- Thao tác của nhân viên kho -----

    // Các kho kế tiếp mà kho mình được gộp bao đi (kèm mã kho để nhập)
    [Authorize(Roles = "Warehouse")]
    [HttpGet("destinations")]
    public async Task<ActionResult<List<DestinationOptionDto>>> Destinations([FromQuery] string? search) =>
        Ok(await _bundles.ListDestinationsAsync(UserId, search));

    // Các đơn trong kho mình có kho kế tiếp = kho đích của bao này (để chọn thêm vào bao)
    [Authorize(Roles = "Warehouse")]
    [HttpGet("{id:guid}/candidates")]
    public async Task<ActionResult<List<BundleOrderDto>>> Candidates(Guid id) =>
        Ok(await _bundles.ListCandidatesAsync(UserId, id));

    [Authorize(Roles = "Warehouse")]
    [HttpPost]
    public async Task<ActionResult<BundleDto>> Create(CreateBundleRequest request) =>
        Ok(await _bundles.CreateAsync(UserId, request));

    [Authorize(Roles = "Warehouse")]
    [HttpPost("{id:guid}/orders")]
    public async Task<ActionResult<BundleDto>> AddOrder(Guid id, AddBundleOrderRequest request) =>
        Ok(await _bundles.AddOrderAsync(UserId, id, request.Code));

    [Authorize(Roles = "Warehouse")]
    [HttpDelete("{id:guid}/orders/{orderId:guid}")]
    public async Task<ActionResult<BundleDto>> RemoveOrder(Guid id, Guid orderId) =>
        Ok(await _bundles.RemoveOrderAsync(UserId, id, orderId));

    [Authorize(Roles = "Warehouse")]
    [HttpPost("{id:guid}/seal")]
    public async Task<ActionResult<BundleDto>> Seal(Guid id) =>
        Ok(await _bundles.SealAsync(UserId, id));

    [Authorize(Roles = "Warehouse")]
    [HttpPost("{id:guid}/reopen")]
    public async Task<ActionResult<BundleDto>> Reopen(Guid id) =>
        Ok(await _bundles.ReopenAsync(UserId, id));

    [Authorize(Roles = "Warehouse")]
    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<BundleDto>> Cancel(Guid id) =>
        Ok(await _bundles.CancelAsync(UserId, id));
}
