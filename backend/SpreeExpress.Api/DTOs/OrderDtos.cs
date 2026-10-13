using System.ComponentModel.DataAnnotations;

namespace SpreeExpress.Api.DTOs;

// Dùng chung cho tạo mới và sửa yêu cầu lấy hàng
public class OrderRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên người gửi")]
    [StringLength(100, ErrorMessage = "Tên người gửi tối đa 100 ký tự")]
    public string SenderName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập số điện thoại người gửi")]
    [RegularExpression(@"^(0|\+84)\d{9}$", ErrorMessage = "Số điện thoại người gửi không hợp lệ")]
    public string SenderPhone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập địa chỉ lấy hàng")]
    [StringLength(300, ErrorMessage = "Địa chỉ lấy hàng tối đa 300 ký tự")]
    public string SenderAddress { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập tên người nhận")]
    [StringLength(100, ErrorMessage = "Tên người nhận tối đa 100 ký tự")]
    public string ReceiverName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập số điện thoại người nhận")]
    [RegularExpression(@"^(0|\+84)\d{9}$", ErrorMessage = "Số điện thoại người nhận không hợp lệ")]
    public string ReceiverPhone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập địa chỉ người nhận")]
    [StringLength(300, ErrorMessage = "Địa chỉ người nhận tối đa 300 ký tự")]
    public string ReceiverAddress { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập quận/huyện người nhận")]
    [StringLength(100)]
    public string ReceiverDistrict { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập tỉnh/thành người nhận")]
    [StringLength(100)]
    public string ReceiverProvince { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập nội dung hàng hóa")]
    [StringLength(200, ErrorMessage = "Nội dung hàng hóa tối đa 200 ký tự")]
    public string ItemDescription { get; set; } = string.Empty;

    [Range(1, 1000, ErrorMessage = "Số kiện phải từ 1 đến 1000")]
    public int Quantity { get; set; } = 1;

    [Range(0.01, 1000, ErrorMessage = "Cân nặng phải từ 0,01 đến 1000 kg")]
    public decimal WeightKg { get; set; }

    [Range(0, 1000000000, ErrorMessage = "Giá trị hàng không hợp lệ")]
    public decimal DeclaredValue { get; set; }

    [Range(0, 1000000000, ErrorMessage = "Tiền thu hộ (COD) không hợp lệ")]
    public decimal CodAmount { get; set; }

    [StringLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự")]
    public string? Note { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn kho lấy hàng")]
    public Guid? PickupWarehouseId { get; set; }
}

public class CancelOrderRequest
{
    [StringLength(500, ErrorMessage = "Lý do tối đa 500 ký tự")]
    public string? Reason { get; set; }
}

public class ConfirmPickupRequest
{
    [Range(1, 1000, ErrorMessage = "Số kiện thực tế phải từ 1 đến 1000")]
    public int PickedQuantity { get; set; }

    [StringLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự")]
    public string? Note { get; set; }
}

public class OrderHistoryDto
{
    public string Status { get; set; } = string.Empty; // dạng snake_case: pending_pickup...
    public string? Note { get; set; }
    public string? ActorName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class OrderDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    public Guid SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;

    public string SenderName { get; set; } = string.Empty;
    public string SenderPhone { get; set; } = string.Empty;
    public string SenderAddress { get; set; } = string.Empty;

    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverPhone { get; set; } = string.Empty;
    public string ReceiverAddress { get; set; } = string.Empty;
    public string ReceiverDistrict { get; set; } = string.Empty;
    public string ReceiverProvince { get; set; } = string.Empty;

    public string ItemDescription { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal WeightKg { get; set; }
    public decimal DeclaredValue { get; set; }
    public decimal CodAmount { get; set; }
    public decimal ShippingFee { get; set; }
    public string? Note { get; set; }

    public Guid PickupWarehouseId { get; set; }
    public string PickupWarehouseCode { get; set; } = string.Empty;
    public string PickupWarehouseName { get; set; } = string.Empty;
    public string PickupWarehouseAddress { get; set; } = string.Empty;

    public Guid? ShipperId { get; set; }
    public string? ShipperName { get; set; }
    public string? ShipperPhone { get; set; }
    public int? PickedQuantity { get; set; }
    public string? PickupNote { get; set; }
    public string? CancelReason { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? PickedUpAt { get; set; }

    // Người bán còn sửa / hủy được không (chỉ khi chưa có shipper nhận)
    public bool CanModify { get; set; }

    // Chỉ có ở trang chi tiết
    public List<OrderHistoryDto> History { get; set; } = new();
}

// Số liệu cho trang Tổng quan: người bán dùng 4 số đầu, shipper dùng 2 số sau
public class OrderSummaryDto
{
    public int Total { get; set; }
    public int InProgress { get; set; }
    public int Delivered { get; set; }
    public decimal CodPending { get; set; }
    public int PendingPickup { get; set; }
    public int AcceptedPickup { get; set; }
}
