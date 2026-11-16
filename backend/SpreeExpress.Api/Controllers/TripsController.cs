// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Controllers\
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Chuyến vận chuyển liên kho. Điều phối viên và Admin điều phối, tài xế chạy chuyến,
// nhân viên kho lên hàng và nhận hàng.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TripsController : ControllerBase
{
    private readonly ITripService _trips;

    public TripsController(ITripService trips) => _trips = trips;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ----- Điều phối viên, Admin -----

    [Authorize(Roles = "Admin,Dispatcher")]
    [HttpGet("drivers")]
    public async Task<ActionResult<List<DriverOptionDto>>> Drivers() =>
        Ok(await _trips.ListDriversAsync(UserId));

    // Danh sách kho (kèm mã kho) để chọn nơi tài xế đến nhận hàng (FR21)
    [Authorize(Roles = "Admin,Dispatcher")]
    [HttpGet("warehouses")]
    public async Task<ActionResult<List<DestinationOptionDto>>> Warehouses([FromQuery] string? search) =>
        Ok(await _trips.ListWarehousesAsync(UserId, search));

    [Authorize(Roles = "Admin,Dispatcher")]
    [HttpPost]
    public async Task<ActionResult<TripDto>> Create(CreateTripRequest request) =>
        Ok(await _trips.CreateAsync(UserId, request));

    [Authorize(Roles = "Admin,Dispatcher")]
    [HttpPost("{id:guid}/reassign")]
    public async Task<ActionResult<TripDto>> Reassign(Guid id, ReassignTripRequest request) =>
        Ok(await _trips.ReassignAsync(UserId, id, request));

    [Authorize(Roles = "Admin,Dispatcher")]
    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<TripDto>> Cancel(Guid id) =>
        Ok(await _trips.CancelAsync(UserId, id));

    [Authorize(Roles = "Admin,Dispatcher")]
    [HttpGet("stale")]
    public async Task<ActionResult<StaleReportDto>> Stale() =>
        Ok(await _trips.GetStaleAsync(UserId));

    // ----- Xem chuyến -----

    // status: assigned | at_warehouse | in_transit | completed | cancelled | active (chưa xong)
    [Authorize(Roles = "Admin,Dispatcher,Driver,Warehouse")]
    [HttpGet]
    public async Task<ActionResult<PagedResult<TripDto>>> List(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _trips.ListAsync(UserId, status, search, page, pageSize));

    [Authorize(Roles = "Admin,Dispatcher,Driver,Warehouse")]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TripDto>> Get(Guid id) =>
        Ok(await _trips.GetAsync(UserId, id));

    // ----- Tài xế -----

    // Chuyến đang chạy của tôi; không có thì trả 204
    [Authorize(Roles = "Driver")]
    [HttpGet("current")]
    public async Task<ActionResult<TripDto>> Current()
    {
        var trip = await _trips.GetCurrentAsync(UserId);
        return trip is null ? NoContent() : Ok(trip);
    }

    [Authorize(Roles = "Driver")]
    [HttpPost("{id:guid}/arrive")]
    public async Task<ActionResult<TripDto>> Arrive(Guid id) =>
        Ok(await _trips.ArriveAsync(UserId, id));

    [Authorize(Roles = "Driver")]
    [HttpPost("{id:guid}/depart")]
    public async Task<ActionResult<TripDto>> Depart(Guid id) =>
        Ok(await _trips.DepartAsync(UserId, id));

    [Authorize(Roles = "Driver")]
    [HttpPost("{id:guid}/complete")]
    public async Task<ActionResult<TripDto>> Complete(Guid id) =>
        Ok(await _trips.CompleteAsync(UserId, id));

    // ----- Nhân viên kho -----

    // Xe đang ở kho tôi và xe đang trên đường tới
    [Authorize(Roles = "Warehouse")]
    [HttpGet("warehouse")]
    public async Task<ActionResult<WarehouseTripsDto>> ForWarehouse() =>
        Ok(await _trips.GetForWarehouseAsync(UserId));

    [Authorize(Roles = "Warehouse")]
    [HttpPost("{id:guid}/load")]
    public async Task<ActionResult<TripDto>> Load(Guid id, TripBundleCodeRequest request) =>
        Ok(await _trips.LoadBundleAsync(UserId, id, request.Code));

    [Authorize(Roles = "Warehouse")]
    [HttpDelete("{id:guid}/bundles/{bundleId:guid}")]
    public async Task<ActionResult<TripDto>> Unload(Guid id, Guid bundleId) =>
        Ok(await _trips.UnloadBundleAsync(UserId, id, bundleId));

    [Authorize(Roles = "Warehouse")]
    [HttpPost("{id:guid}/receive")]
    public async Task<ActionResult<TripDto>> Receive(Guid id, TripBundleCodeRequest request) =>
        Ok(await _trips.ReceiveBundleAsync(UserId, id, request.Code));

    [Authorize(Roles = "Warehouse")]
    [HttpPost("{id:guid}/finish-receiving")]
    public async Task<ActionResult<TripDto>> FinishReceiving(Guid id, FinishReceivingRequest request) =>
        Ok(await _trips.FinishReceivingAsync(UserId, id, request.Note));

    [Authorize(Roles = "Warehouse")]
    [HttpPost("{id:guid}/extra")]
    public async Task<ActionResult<TripDto>> Extra(Guid id, ReportExtraRequest request) =>
        Ok(await _trips.ReportExtraAsync(UserId, id, request.Code, request.Note));
}
