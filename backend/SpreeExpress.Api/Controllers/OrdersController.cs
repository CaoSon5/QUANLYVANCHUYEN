// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Controllers\
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orders;

    public OrdersController(IOrderService orders) => _orders = orders;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ----- Người bán -----

    [Authorize(Roles = "Seller")]
    [HttpGet("pickup-warehouses")]
    public async Task<ActionResult<List<WarehouseOptionDto>>> PickupWarehouses() =>
        Ok(await _orders.GetPickupWarehousesAsync());

    [Authorize(Roles = "Seller")]
    [HttpGet("fee")]
    public ActionResult Fee([FromQuery] decimal weightKg) =>
        Ok(new { fee = _orders.EstimateFee(weightKg) });

    [Authorize(Roles = "Seller")]
    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(OrderRequest request) =>
        Ok(await _orders.CreateAsync(UserId, request));

    [Authorize(Roles = "Seller")]
    [HttpGet("mine")]
    public async Task<ActionResult<PagedResult<OrderDto>>> Mine(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _orders.ListMineAsync(UserId, search, status, page, pageSize));

    [Authorize(Roles = "Seller")]
    [HttpGet("by-code/{code}")]
    public async Task<ActionResult<OrderDto>> ByCode(string code) =>
        Ok(await _orders.GetByCodeAsync(UserId, code));

    [Authorize(Roles = "Seller")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<OrderDto>> Update(Guid id, OrderRequest request) =>
        Ok(await _orders.UpdateAsync(UserId, id, request));

    [Authorize(Roles = "Seller")]
    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<OrderDto>> Cancel(Guid id, CancelOrderRequest request) =>
        Ok(await _orders.CancelAsync(UserId, id, request.Reason));

    // ----- Admin, Điều phối viên: xem mọi đơn -----

    [Authorize(Roles = "Admin,Dispatcher")]
    [HttpGet]
    public async Task<ActionResult<PagedResult<OrderDto>>> All(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _orders.ListAllAsync(search, status, page, pageSize));

    // ----- Dùng chung -----

    [Authorize(Roles = "Seller,Shipper,Warehouse,Admin,Dispatcher")]
    [HttpGet("summary")]
    public async Task<ActionResult<OrderSummaryDto>> Summary() =>
        Ok(await _orders.GetSummaryAsync(UserId));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderDto>> Get(Guid id) =>
        Ok(await _orders.GetDetailAsync(UserId, id));
}
