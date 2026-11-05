// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Controllers\
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpreeExpress.Api.DTOs;
using SpreeExpress.Api.Services.Interfaces;

namespace SpreeExpress.Api.Controllers;

// Báo cáo quản lý (FR13 đến FR18). Hiện có: doanh thu phí vận chuyển. Dành cho Admin và Kế toán.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Accountant")]
public class ReportsController : ControllerBase
{
    private readonly IFinanceService _finance;
    private readonly IReportService _reports;

    public ReportsController(IFinanceService finance, IReportService reports)
    {
        _finance = finance;
        _reports = reports;
    }

    // granularity = day | month | year. from, to dạng yyyy-MM-dd (bỏ trống = mặc định gần nhất)
    [HttpGet("shipping-revenue")]
    public async Task<ActionResult<ShippingRevenueDto>> ShippingRevenue(
        [FromQuery] string? granularity,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to) =>
        Ok(await _finance.GetShippingRevenueAsync(granularity, from, to));

    // FR13, FR15: đơn theo trạng thái và tỉ lệ giao thành công, thất bại, hoàn hàng
    [HttpGet("orders")]
    public async Task<ActionResult<OrderReportDto>> Orders([FromQuery] DateOnly? from, [FromQuery] DateOnly? to) =>
        Ok(await _reports.GetOrderReportAsync(from, to));

    // FR16: hiệu suất từng shipper
    [HttpGet("shippers")]
    public async Task<ActionResult<ShipperReportDto>> Shippers([FromQuery] DateOnly? from, [FromQuery] DateOnly? to) =>
        Ok(await _reports.GetShipperReportAsync(from, to));

    // FR17: tồn kho theo từng kho (tại thời điểm xem)
    [HttpGet("inventory")]
    public async Task<ActionResult<InventoryReportDto>> Inventory() =>
        Ok(await _reports.GetInventoryReportAsync());

    // FR18: đối soát COD
    [HttpGet("cod")]
    public async Task<ActionResult<CodReportDto>> Cod([FromQuery] DateOnly? from, [FromQuery] DateOnly? to) =>
        Ok(await _reports.GetCodReportAsync(from, to));
}
