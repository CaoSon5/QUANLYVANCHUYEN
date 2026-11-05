// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Repositories\Interfaces\
using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Repositories.Interfaces;

public class OrderStatusCount
{
    public OrderStatus Status { get; set; }
    public int Count { get; set; }
}

public class FailureReasonCount
{
    public string Reason { get; set; } = string.Empty;
    public int Count { get; set; }
}

// Một mốc hành động của shipper trong lịch sử đơn (lấy hàng, giao thành công, giao thất bại)
public class ShipperActionRow
{
    public Guid ActorId { get; set; }
    public OrderStatus Status { get; set; }
}

public class DeliveredOrderRow
{
    public Guid? ShipperId { get; set; }
    public DateTime? DispatchedAt { get; set; }
    public DateTime DeliveredAt { get; set; }
    public decimal CodCollected { get; set; }
}

public class ShipperInfo
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? WarehouseCode { get; set; }
    public bool IsActive { get; set; }
}

public class WarehouseInfo
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public WarehouseType Type { get; set; }
    public bool IsActive { get; set; }
}

// Một đơn đang nằm trong hệ thống kho (hoặc đang về kho)
public class StockRow
{
    public Guid? CurrentWarehouseId { get; set; }
    public Guid PickupWarehouseId { get; set; }
    public OrderStatus Status { get; set; }
    public int Quantity { get; set; }
    public int? ReceivedQuantity { get; set; }
    public DateTime? ReceivedAt { get; set; }
}

public class CodReportCounts
{
    public decimal CodCollected { get; set; }
    public int CodOrders { get; set; }
    public decimal Held { get; set; }
    public decimal PendingRemittanceAmount { get; set; }
    public int PendingRemittances { get; set; }
    public decimal ConfirmedReceived { get; set; }
    public decimal NetDifference { get; set; }
    public int ShortRemittances { get; set; }
    public decimal PendingPayout { get; set; }
    public int PendingSettlements { get; set; }
    public decimal PaidOut { get; set; }
    public int PaidSettlements { get; set; }
}

// Truy vấn dữ liệu cho các báo cáo quản lý (FR13 đến FR18). Chỉ đọc, không sửa dữ liệu.
public interface IReportRepository
{
    // FR13, FR15: các đơn được tạo trong [fromUtc, toUtc)
    Task<List<OrderStatusCount>> GetStatusCountsAsync(DateTime fromUtc, DateTime toUtc);
    Task<int> CountDeliveredFirstTryAsync(DateTime fromUtc, DateTime toUtc);
    Task<List<FailureReasonCount>> GetFailureReasonCountsAsync(DateTime fromUtc, DateTime toUtc);

    // FR16
    Task<List<ShipperActionRow>> GetShipperActionRowsAsync(DateTime fromUtc, DateTime toUtc);
    Task<List<DeliveredOrderRow>> GetDeliveredOrderRowsAsync(DateTime fromUtc, DateTime toUtc);
    Task<List<ShipperInfo>> GetShippersAsync();

    // FR17
    Task<List<WarehouseInfo>> GetWarehousesAsync();
    Task<List<StockRow>> GetStockRowsAsync();

    // FR18
    Task<CodReportCounts> GetCodCountsAsync(DateTime fromUtc, DateTime toUtc);
}
