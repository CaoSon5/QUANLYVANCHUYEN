using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Admin và Điều phối viên được xem danh sách kho; chỉ Admin được thêm, sửa, đổi trạng thái, gán người.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Dispatcher")]
public class WarehousesController : ControllerBase
{
    private readonly IWarehouseService _warehouses;

    public WarehousesController(IWarehouseService warehouses) => _warehouses = warehouses;

    [HttpGet]
    public async Task<ActionResult<PagedResult<WarehouseDto>>> List(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await _warehouses.ListAsync(search, type, isActive, page, pageSize));

    [HttpGet("summary")]
    public async Task<ActionResult<WarehouseSummaryDto>> Summary() =>
        Ok(await _warehouses.GetSummaryAsync());

    // Danh sách rút gọn các kho đang hoạt động, dùng cho ô chọn kho
    [HttpGet("options")]
    public async Task<ActionResult<List<WarehouseOptionDto>>> Options() =>
        Ok(await _warehouses.GetOptionsAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WarehouseDetailDto>> Get(Guid id) =>
        Ok(await _warehouses.GetDetailAsync(id));

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<WarehouseDto>> Create(CreateWarehouseRequest request) =>
        Ok(await _warehouses.CreateAsync(request));

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<WarehouseDto>> Update(Guid id, UpdateWarehouseRequest request) =>
        Ok(await _warehouses.UpdateAsync(id, request));

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<WarehouseDto>> SetStatus(Guid id, SetStatusRequest request) =>
        Ok(await _warehouses.SetStatusAsync(id, request.IsActive));

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:guid}/members")]
    public async Task<ActionResult<WarehouseDetailDto>> AssignMember(Guid id, AssignMemberRequest request) =>
        Ok(await _warehouses.AssignMemberAsync(id, request.UserId!.Value));

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}/members/{userId:guid}")]
    public async Task<ActionResult<WarehouseDetailDto>> RemoveMember(Guid id, Guid userId) =>
        Ok(await _warehouses.RemoveMemberAsync(id, userId));
}
