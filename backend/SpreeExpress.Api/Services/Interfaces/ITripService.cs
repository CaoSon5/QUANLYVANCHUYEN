// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Services\Interfaces\
using SpreeExpress.Api.DTOs;

namespace SpreeExpress.Api.Services.Interfaces;

public interface ITripService
{
    // ----- Điều phối viên, Admin (FR20 đến FR27) -----
    Task<List<DriverOptionDto>> ListDriversAsync(Guid userId);
    Task<TripDto> CreateAsync(Guid userId, CreateTripRequest request);
    Task<TripDto> ReassignAsync(Guid userId, Guid tripId, ReassignTripRequest request);
    Task<TripDto> CancelAsync(Guid userId, Guid tripId);
    Task<StaleReportDto> GetStaleAsync(Guid userId);
    Task<List<DestinationOptionDto>> ListWarehousesAsync(Guid userId, string? search);   // FR21

    // ----- Xem chuyến (Điều phối viên, Admin, tài xế của chuyến, nhân viên kho liên quan) -----
    Task<PagedResult<TripDto>> ListAsync(Guid viewerId, string? status, string? search, int page, int pageSize);
    Task<TripDto> GetAsync(Guid viewerId, Guid tripId);

    // ----- Tài xế (FR41 đến FR48) -----
    Task<TripDto?> GetCurrentAsync(Guid driverId);
    Task<TripDto> ArriveAsync(Guid driverId, Guid tripId);
    Task<TripDto> DepartAsync(Guid driverId, Guid tripId);
    Task<TripDto> CompleteAsync(Guid driverId, Guid tripId);

    // ----- Nhân viên kho (FR30, FR35 đến FR38) -----
    Task<WarehouseTripsDto> GetForWarehouseAsync(Guid staffId);
    Task<TripDto> LoadBundleAsync(Guid staffId, Guid tripId, string bundleCode);
    Task<TripDto> UnloadBundleAsync(Guid staffId, Guid tripId, Guid bundleId);
    Task<TripDto> ReceiveBundleAsync(Guid staffId, Guid tripId, string bundleCode);
    Task<TripDto> FinishReceivingAsync(Guid staffId, Guid tripId, string? note);
    Task<TripDto> ReportExtraAsync(Guid staffId, Guid tripId, string bundleCode, string? note);
}
