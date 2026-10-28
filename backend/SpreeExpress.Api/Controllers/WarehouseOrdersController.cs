
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Nhân viên kho: nhập hàng vào kho và xem hàng của kho mình
[ApiController]
[Route("api/warehouse-orders")]
[Authorize(Roles = "Warehouse")]
public class WarehouseOrdersController : ControllerBase
{
    private readonly IOrderService _orders;

    public WarehouseOrdersController(IOrderService orders) => _orders = orders;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // scope = incoming (đang trên đường về kho) | inventory (đang lưu trong kho) | dispatch (chờ xuất cho shipper)
    [HttpGet]
    public async Task<ActionResult<PagedResult<OrderDto>>> List(
        [FromQuery] string scope = "inventory",
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _orders.ListWarehouseOrdersAsync(UserId, scope, search, page, pageSize));

    [HttpPost("receive")]
    public async Task<ActionResult<OrderDto>> Receive(ReceiveOrderRequest request) =>
        Ok(await _orders.ReceiveAtWarehouseAsync(UserId, request));

    // Xuất hàng cho shipper đã nhận giao (FR31)
    [HttpPost("dispatch")]
    public async Task<ActionResult<OrderDto>> Dispatch(DispatchOrderRequest request) =>
        Ok(await _orders.DispatchToShipperAsync(UserId, request));
}
