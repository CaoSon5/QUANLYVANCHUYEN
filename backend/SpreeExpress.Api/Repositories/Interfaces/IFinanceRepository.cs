// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Repositories\Interfaces\
using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Repositories.Interfaces;

public class ShipperHolding
{
    public Guid ShipperId { get; set; }
    public string ShipperName { get; set; } = string.Empty;
    public string ShipperPhone { get; set; } = string.Empty;
    public int OrderCount { get; set; }
    public decimal Amount { get; set; }
    public DateTime? OldestDeliveredAt { get; set; }
}

// Một đơn giao thành công, dùng để tính báo cáo doanh thu
public class DeliveredFeeRow
{
    public DateTime DeliveredAt { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal CodCollected { get; set; }
}

public class FinanceCounts
{
    public decimal CodCollectedTotal { get; set; }
    public decimal CodHeld { get; set; }
    public int RemittancesPending { get; set; }
    public int SettlementsPending { get; set; }
    public int SettlementsPaid { get; set; }
    public decimal PendingPayoutAmount { get; set; }
}

public interface IFinanceRepository
{
    Task<long> NextRemittanceNumberAsync();
    Task<long> NextSettlementNumberAsync();

    // Shipper nộp COD: đơn giao thành công, có thu tiền, chưa nằm trong phiếu nộp nào
    Task<List<Order>> GetHeldOrdersAsync(Guid shipperId);
    Task<List<Order>> GetTrackedHeldOrdersAsync(Guid shipperId, List<Guid>? orderIds);
    Task<List<ShipperHolding>> GetHoldingsPerShipperAsync();

    void AddRemittance(CodRemittance remittance);
    Task<CodRemittance?> GetRemittanceTrackedAsync(Guid id);
    Task<CodRemittance?> GetRemittanceDetailAsync(Guid id);
    Task<(List<CodRemittance> Items, int Total)> SearchRemittancesAsync(
        Guid? shipperId, RemittanceStatus? status, int page, int pageSize);

    // Đối soát người bán
    Task<List<Order>> GetEligibleOrdersAsync(Guid sellerId, DateTime fromUtc, DateTime toUtc, bool tracked);
    Task<(int Count, decimal Amount)> GetExcludedOrdersAsync(Guid sellerId, DateTime fromUtc, DateTime toUtc);

    void AddSettlement(Settlement settlement);
    Task<Settlement?> GetSettlementTrackedAsync(Guid id);
    Task<Settlement?> GetSettlementDetailAsync(Guid id);
    Task<(List<Settlement> Items, int Total)> SearchSettlementsAsync(
        Guid? sellerId, SettlementStatus? status, int page, int pageSize);

    Task<FinanceCounts> GetCountsAsync();

    // Các đơn giao thành công trong khoảng thời gian [fromUtc, toUtc), để lập báo cáo doanh thu
    Task<List<DeliveredFeeRow>> GetDeliveredFeeRowsAsync(DateTime fromUtc, DateTime toUtc);
    Task SaveAsync();
}
