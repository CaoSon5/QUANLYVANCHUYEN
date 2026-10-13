namespace SpreeExpress.Api.Entities;

// Trạng thái vận đơn. Lưu dạng chữ trong database nên thêm giá trị mới sau này không cần migration.
public enum OrderStatus
{
    PendingPickup,   // Chờ shipper nhận lấy hàng
    PickupAccepted,  // Shipper đã nhận, chưa đến lấy
    PickedUp,        // Shipper đã lấy hàng từ người bán
    InWarehouse,     // Đã nhập kho
    InTransit,       // Đang vận chuyển liên kho
    OutForDelivery,  // Đang giao cho người nhận
    Delivered,       // Giao thành công
    DeliveryFailed,  // Giao thất bại
    Returned,        // Đã hoàn về người bán
    Cancelled        // Người bán đã hủy
}
