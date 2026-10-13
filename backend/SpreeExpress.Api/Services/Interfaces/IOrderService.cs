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
}
