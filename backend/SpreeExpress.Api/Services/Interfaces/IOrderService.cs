// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Services\Interfaces\
using SpreeExpress.Api.DTOs;

namespace SpreeExpress.Api.Services.Interfaces;

public interface IOrderService
{
    // Người bán
    Task<List<WarehouseOptionDto>> GetPickupWarehousesAsync();
    decimal EstimateFee(decimal weightKg);
    Task<OrderDto> CreateAsync(Guid sellerId, OrderRequest request);
    Task<OrderDto> UpdateAsync(Guid sellerId, Guid orderId, OrderRequest request);
    Task<OrderDto> CancelAsync(Guid sellerId, Guid orderId, string? reason);
    Task<PagedResult<OrderDto>> ListMineAsync(Guid sellerId, string? search, string? status, int page, int pageSize);
    Task<OrderDto> GetByCodeAsync(Guid sellerId, string code);

    // Xem chi tiết (kiểm tra quyền theo vai trò)
    Task<OrderDto> GetDetailAsync(Guid userId, Guid orderId);
    Task<OrderSummaryDto> GetSummaryAsync(Guid userId);

    // Shipper lấy hàng
    Task<PagedResult<OrderDto>> ListAvailablePickupsAsync(Guid shipperId, string? search, int page, int pageSize);
    Task<PagedResult<OrderDto>> ListMyPickupsAsync(Guid shipperId, string? status, string? search, int page, int pageSize);
    Task<OrderDto> AcceptPickupAsync(Guid shipperId, Guid orderId);
    Task<OrderDto> ConfirmPickupAsync(Guid shipperId, Guid orderId, ConfirmPickupRequest request);

    // Admin, Điều phối viên: xem mọi đơn trong hệ thống
    Task<PagedResult<OrderDto>> ListAllAsync(string? search, string? status, int page, int pageSize);

    // Nhân viên kho: scope = "incoming" (đang về kho) | "inventory" (đang lưu kho)
    Task<PagedResult<OrderDto>> ListWarehouseOrdersAsync(Guid staffId, string scope, string? search, int page, int pageSize);
    Task<OrderDto> ReceiveAtWarehouseAsync(Guid staffId, ReceiveOrderRequest request);

    // Nhân viên kho: xuất hàng cho shipper đã nhận giao (FR31)
    Task<OrderDto> DispatchToShipperAsync(Guid staffId, DispatchOrderRequest request);

    // Shipper: xem đơn chờ giao tại kho mình và tự nhận giao (FR52)
    Task<PagedResult<OrderDto>> ListDeliverableAsync(Guid shipperId, string? search, int page, int pageSize);
    Task<PagedResult<OrderDto>> ListMyDeliveriesAsync(Guid shipperId, string? status, string? search, int page, int pageSize);
    Task<OrderDto> AcceptDeliveryAsync(Guid shipperId, Guid orderId);

    // Shipper cập nhật kết quả giao (FR53, FR54, FR55, FR56)
    Task<OrderDto> CompleteDeliveryAsync(Guid shipperId, Guid orderId, decimal? collectedAmount, string? note, List<PhotoUpload> photos);
    Task<OrderDto> FailDeliveryAsync(Guid shipperId, Guid orderId, string reason, string? note, List<PhotoUpload> photos);

    // Ảnh minh chứng giao hàng
    Task<(byte[] Data, string ContentType)> GetPhotoAsync(Guid userId, Guid orderId, Guid photoId);
}
