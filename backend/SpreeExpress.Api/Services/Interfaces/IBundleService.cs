// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Services\Interfaces\
using SpreeExpress.Api.DTOs;

namespace SpreeExpress.Api.Services.Interfaces;

public interface IBundleService
{
    // Nhân viên kho: chọn kho đích, thêm bớt đơn, đóng bao (FR33, FR34)
    Task<List<DestinationOptionDto>> ListDestinationsAsync(Guid staffId, string? search);
    Task<BundleDto> CreateAsync(Guid staffId, CreateBundleRequest request);
    Task<BundleDto> AddOrderAsync(Guid staffId, Guid bundleId, string orderCode);
    Task<BundleDto> RemoveOrderAsync(Guid staffId, Guid bundleId, Guid orderId);
    Task<BundleDto> SealAsync(Guid staffId, Guid bundleId);
    Task<BundleDto> ReopenAsync(Guid staffId, Guid bundleId);
    Task<BundleDto> CancelAsync(Guid staffId, Guid bundleId);

    // Nhân viên kho xem bao ở kho mình; Admin, Điều phối viên xem tất cả (FR20, FR40)
    Task<PagedResult<BundleDto>> ListAsync(Guid viewerId, string? status, string? search, int page, int pageSize);
    Task<BundleDto> GetAsync(Guid viewerId, Guid bundleId);
}
