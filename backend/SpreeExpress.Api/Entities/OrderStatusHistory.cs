namespace SpreeExpress.Api.Entities;

// Mỗi dòng là một mốc trong hành trình đơn hàng (timeline)
public class OrderStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    public OrderStatus Status { get; set; }
    public string? Note { get; set; }

    // Người thực hiện (người bán, shipper...)
    public Guid? ActorUserId { get; set; }
    public User? ActorUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
