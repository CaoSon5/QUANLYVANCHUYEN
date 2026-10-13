using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Repositories.Interfaces;

public class OrderFilter
{
    public Guid? SellerId { get; set; }
    public Guid? PickupWarehouseId { get; set; }
    public Guid? PickupShipperId { get; set; }
    public List<OrderStatus>? Statuses { get; set; }
    public string? Search { get; set; }
    public bool OldestFirst { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class SellerOrderCounts
{
    public int Total { get; set; }
    public int InProgress { get; set; }
    public int Delivered { get; set; }
    public decimal CodPending { get; set; }
}

public interface IOrderRepository
{
    Task<long> NextCodeNumberAsync();

    Task<Order?> GetTrackedAsync(Guid id);            // để sửa (có theo dõi thay đổi)
    Task<Order?> GetDetailAsync(Guid id);             // kèm lịch sử, chỉ đọc
    Task<Order?> GetByCodeAsync(string code);

    Task<(List<Order> Items, int Total)> SearchAsync(OrderFilter filter);
    Task<SellerOrderCounts> GetSellerCountsAsync(Guid sellerId);
    Task<int> CountPendingPickupAsync(Guid warehouseId);
    Task<int> CountAcceptedPickupAsync(Guid shipperId);

    Task AddAsync(Order order);
    void AddHistory(OrderStatusHistory history);
    Task SaveAsync();
}
