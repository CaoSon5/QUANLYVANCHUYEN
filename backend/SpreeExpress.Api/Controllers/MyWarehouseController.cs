// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Controllers\
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Bưu cục của tôi: nhân viên kho xem tổng quan kho mình được gán (chỉ đọc).
// Thông tin kho và nhân sự do Admin quản lý (FR05 đến FR12).
[ApiController]
[Route("api/my-warehouse")]
[Authorize(Roles = "Warehouse")]
public class MyWarehouseController : ControllerBase
{
    private readonly IWarehouseService _warehouses;

    public MyWarehouseController(IWarehouseService warehouses) => _warehouses = warehouses;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<MyWarehouseDto>> Get() =>
        Ok(await _warehouses.GetMineAsync(UserId));
}
