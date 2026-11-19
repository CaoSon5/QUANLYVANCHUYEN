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

    // Kho của shipper (để nhóm "shipper đang giữ tiền" theo kho)
    public Guid? WarehouseId { get; set; }
    public string? WarehouseCode { get; set; }
    public string? WarehouseName { get; set; }
    public string? RegionCode { get; set; }     // mã kho vùng quản lý kho đó
}

// Một đơn giao thành công, dùng để tính báo cáo doanh thu
public class DeliveredFeeRow
{
    public DateTime DeliveredAt { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal CodCollected { get; set; }
}

// Một khoản tiền phát sinh tại một thời điểm, dùng để gom theo ngày/tháng/năm trong báo cáo tài chính
public class MoneyRow
{
    public DateTime At { get; set; }
    public decimal Amount { get; set; }
    public decimal Extra { get; set; }   // khoản phụ: phí vận chuyển (đơn giao) hoặc chênh lệch (phiếu nộp)
}

// Dữ liệu thô cho báo cáo tài chính
public class FinanceReportData
{
    public List<MoneyRow> Delivered { get; set; } = new();  // đơn giao thành công: At = ngày giao, Amount = COD thu, Extra = phí vận chuyển
    public List<MoneyRow> Remitted { get; set; } = new();   // phiếu đã xác nhận: At = ngày xác nhận, Amount = thực nhận, Extra = thực nhận - khai nộp
    public List<MoneyRow> Settled { get; set; } = new();    // bảng đối soát đã lập: At = ngày lập, Amount = COD gộp
    public List<MoneyRow> PaidOut { get; set; } = new();    // bảng đối soát đã chuyển tiền: At = ngày chuyển, Amount = số tiền thực trả

    // Công nợ tại thời điểm hiện tại
    public decimal RemittancesPendingAmount { get; set; }   // phiếu nộp chờ xác nhận
    public decimal ReceivedNotSettled { get; set; }         // COD đã về công ty nhưng chưa lập bảng đối soát
    public decimal DifferenceTotal { get; set; }            // tổng chênh lệch của mọi phiếu đã xác nhận
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

    // Dữ liệu cho báo cáo tài chính trong khoảng [fromUtc, toUtc)
    Task<FinanceReportData> GetFinanceReportDataAsync(DateTime fromUtc, DateTime toUtc);

    // Các đơn giao thành công trong khoảng thời gian [fromUtc, toUtc), để lập báo cáo doanh thu
    Task<List<DeliveredFeeRow>> GetDeliveredFeeRowsAsync(DateTime fromUtc, DateTime toUtc);
    Task SaveAsync();
}
