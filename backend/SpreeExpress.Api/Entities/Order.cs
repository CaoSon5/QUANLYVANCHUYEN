// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Entities\
namespace SpreeExpress.Api.Entities;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Mã vận đơn, ví dụ SPR25062400128
    public string Code { get; set; } = string.Empty;
    public OrderStatus Status { get; set; } = OrderStatus.PendingPickup;

    public Guid SellerId { get; set; }
    public User? Seller { get; set; }

    // Người gửi (nơi shipper đến lấy hàng)
    public string SenderName { get; set; } = string.Empty;
    public string SenderPhone { get; set; } = string.Empty;
    public string SenderAddress { get; set; } = string.Empty;

    // Người nhận
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string ReceiverAddress { get; set; } = string.Empty;
    public string ReceiverDistrict { get; set; } = string.Empty;
    public string ReceiverProvince { get; set; } = string.Empty;

    // Hàng hóa
    public string ItemDescription { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal WeightKg { get; set; }
    public decimal DeclaredValue { get; set; }
    public decimal CodAmount { get; set; }
    public decimal ShippingFee { get; set; }
    public string? Note { get; set; }

    // Lấy hàng: kho địa phương phụ trách và shipper nhận đơn
    public Guid PickupWarehouseId { get; set; }
    public Warehouse? PickupWarehouse { get; set; }
    public Guid? PickupShipperId { get; set; }
    public User? PickupShipper { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? PickedUpAt { get; set; }
    public int? PickedQuantity { get; set; }
    public string? PickupNote { get; set; }

    public string? CancelReason { get; set; }

    // Nhập kho: kho đang giữ hàng, thời điểm nhập và số kiện thực nhận
    public Guid? CurrentWarehouseId { get; set; }
    public Warehouse? CurrentWarehouse { get; set; }
    public DateTime? ReceivedAt { get; set; }
    public int? ReceivedQuantity { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<OrderStatusHistory> History { get; set; } = new();
}
