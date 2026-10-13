using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Shipper nhận và xác nhận lấy hàng
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Shipper")]
public class PickupsController : ControllerBase
{
    private readonly IOrderService _orders;

    public PickupsController(IOrderService orders) => _orders = orders;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Yêu cầu lấy hàng đang chờ tại kho mình phụ trách
    [HttpGet("available")]
    public async Task<ActionResult<PagedResult<OrderDto>>> Available(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _orders.ListAvailablePickupsAsync(UserId, search, page, pageSize));

    // Đơn mình đã nhận: status = accepted (chờ lấy) | picked_up (đã lấy)
    [HttpGet("mine")]
    public async Task<ActionResult<PagedResult<OrderDto>>> Mine(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _orders.ListMyPickupsAsync(UserId, status, search, page, pageSize));

    [HttpPost("{id:guid}/accept")]
    public async Task<ActionResult<OrderDto>> Accept(Guid id) =>
        Ok(await _orders.AcceptPickupAsync(UserId, id));

    [HttpPost("{id:guid}/confirm")]
    public async Task<ActionResult<OrderDto>> Confirm(Guid id, ConfirmPickupRequest request) =>
        Ok(await _orders.ConfirmPickupAsync(UserId, id, request));
}
