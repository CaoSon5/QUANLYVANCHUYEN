// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Services\Interfaces\
using SpreeExpress.Api.DTOs;

namespace SpreeExpress.Api.Services.Interfaces;

public interface IReportService
{
    Task<OrderReportDto> GetOrderReportAsync(DateOnly? from, DateOnly? to);          // FR13, FR15
    Task<ShipperReportDto> GetShipperReportAsync(DateOnly? from, DateOnly? to);      // FR16
    Task<DriverReportDto> GetDriverReportAsync(DateOnly? from, DateOnly? to);        // FR16 (tài xế)
    Task<InventoryReportDto> GetInventoryReportAsync();                              // FR17
    Task<CodReportDto> GetCodReportAsync(DateOnly? from, DateOnly? to);              // FR18
}
