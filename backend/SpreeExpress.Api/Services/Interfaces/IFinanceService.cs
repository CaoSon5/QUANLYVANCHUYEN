// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Services\Interfaces\
using SpreeExpress.Api.DTOs;

namespace SpreeExpress.Api.Services.Interfaces;

public interface IFinanceService
{
    // ----- Shipper nộp COD (FR57) -----
    Task<HoldingDto> GetHoldingAsync(Guid shipperId);
    Task<RemittanceDto> CreateRemittanceAsync(Guid shipperId, List<Guid>? orderIds);

    // shipperId = null: xem mọi phiếu (Kế toán); có giá trị: chỉ phiếu của shipper đó
    Task<PagedResult<RemittanceDto>> ListRemittancesAsync(Guid? shipperId, string? status, int page, int pageSize);
    Task<RemittanceDto> GetRemittanceAsync(Guid id, Guid? shipperId);

    // ----- Kế toán đối chiếu COD (FR59) -----
    Task<RemittanceDto> ConfirmRemittanceAsync(Guid accountantId, Guid id, ConfirmRemittanceRequest request);
    Task<List<ShipperHoldingDto>> GetHoldingsAsync();

    // ----- Đối soát người bán (FR60, FR61, FR67) -----
    Task<List<SellerLookupDto>> ListSellersAsync(string? search);
    Task<SettlementPreviewDto> PreviewSettlementAsync(SettlementPeriodRequest request);
    Task<SettlementDto> CreateSettlementAsync(Guid accountantId, CreateSettlementRequest request);
    Task<PagedResult<SettlementDto>> ListSettlementsAsync(Guid? sellerId, string? status, int page, int pageSize);
    Task<SettlementDto> GetSettlementAsync(Guid viewerId, bool viewerIsSeller, Guid id);
    Task<SettlementDto> PaySettlementAsync(Guid accountantId, Guid id, PaySettlementRequest request);

    Task<FinanceSummaryDto> GetSummaryAsync();

    // ----- Báo cáo (FR14) -----
    Task<ShippingRevenueDto> GetShippingRevenueAsync(string? granularity, DateOnly? from, DateOnly? to);
}
