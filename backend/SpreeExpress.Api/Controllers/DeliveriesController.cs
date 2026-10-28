// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Controllers\
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Helpers;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Shipper nhận giao hàng: xem đơn chờ giao tại kho mình và tự chọn đơn muốn giao
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Shipper")]
public class DeliveriesController : ControllerBase
{
    private readonly IOrderService _orders;

    public DeliveriesController(IOrderService orders) => _orders = orders;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Đơn đã nhập kho tại kho mình phụ trách, chưa ai nhận giao
    [HttpGet("available")]
    public async Task<ActionResult<PagedResult<OrderDto>>> Available(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _orders.ListDeliverableAsync(UserId, search, page, pageSize));

    // Đơn mình đã nhận giao: status = accepted (chờ lấy ở kho) | out_for_delivery (đang đi giao)
    [HttpGet("mine")]
    public async Task<ActionResult<PagedResult<OrderDto>>> Mine(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _orders.ListMyDeliveriesAsync(UserId, status, search, page, pageSize));

    [HttpPost("{id:guid}/accept")]
    public async Task<ActionResult<OrderDto>> Accept(Guid id) =>
        Ok(await _orders.AcceptDeliveryAsync(UserId, id));

    // Giao thành công (FR53, FR56). multipart/form-data: collectedAmount, note, photos (tối đa 3 ảnh, không bắt buộc)
    [HttpPost("{id:guid}/delivered")]
    public async Task<ActionResult<OrderDto>> Delivered(Guid id, [FromForm] DeliverForm form) =>
        Ok(await _orders.CompleteDeliveryAsync(
            UserId, id, form.CollectedAmount, form.Note, await PhotoReader.ReadAsync(form.Photos)));

    // Giao thất bại kèm lý do (FR54, FR55). multipart/form-data: reason, note, photos
    [HttpPost("{id:guid}/failed")]
    public async Task<ActionResult<OrderDto>> Failed(Guid id, [FromForm] FailForm form) =>
        Ok(await _orders.FailDeliveryAsync(
            UserId, id, form.Reason, form.Note, await PhotoReader.ReadAsync(form.Photos)));
}
