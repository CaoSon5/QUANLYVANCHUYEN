// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\DTOs\
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

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

    // Đang nằm ở kho nào (sau khi nhập kho)
    public string? CurrentWarehouseCode { get; set; }
    public string? CurrentWarehouseName { get; set; }
    public DateTime? ReceivedAt { get; set; }
    public int? ReceivedQuantity { get; set; }

    // Giao hàng
    public Guid? DeliveryShipperId { get; set; }
    public string? DeliveryShipperName { get; set; }
    public string? DeliveryShipperPhone { get; set; }
    public DateTime? DeliveryAcceptedAt { get; set; }
    public DateTime? DispatchedAt { get; set; }

    // Kết quả giao hàng
    public int DeliveryAttempts { get; set; }       // số lần giao thất bại đã ghi nhận
    public int MaxDeliveryAttempts { get; set; }    // số lần tối đa theo quy định
    public DateTime? DeliveredAt { get; set; }
    public decimal? CodCollected { get; set; }
    public string? LastFailureReason { get; set; }
    public List<OrderPhotoDto> Photos { get; set; } = new();

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

    // Nhân viên kho
    public int Incoming { get; set; }       // đang trên đường về kho
    public int Inventory { get; set; }      // đang lưu trong kho
    public int ReceivedToday { get; set; }  // nhập kho hôm nay
    public int Stale48h { get; set; }       // lưu quá 48 giờ
    public int AwaitingDispatch { get; set; } // shipper đã nhận giao, chờ kho xuất hàng
    public int DispatchedToday { get; set; }  // đã xuất kho hôm nay

    // Shipper giao hàng
    public int PendingDelivery { get; set; }  // đơn chờ giao tại kho mình phụ trách
    public int AcceptedDelivery { get; set; } // đã nhận giao, chưa lấy hàng ở kho
    public int OutForDelivery { get; set; }   // đang đi giao
    public decimal CodCollected { get; set; } // tổng COD shipper đã thu
}

// Nhân viên kho nhập hàng vào kho bằng mã vận đơn (quét hoặc gõ)
public class ReceiveOrderRequest
{
    [Required(ErrorMessage = "Vui lòng nhập mã vận đơn")]
    [StringLength(30, ErrorMessage = "Mã vận đơn không hợp lệ")]
    public string Code { get; set; } = string.Empty;

    // Bỏ trống = nhận đủ số kiện shipper đã lấy. Nhập khác để ghi nhận thiếu/thừa.
    [Range(1, 1000, ErrorMessage = "Số kiện nhận phải từ 1 đến 1000")]
    public int? ReceivedQuantity { get; set; }

    [StringLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự")]
    public string? Note { get; set; }
}

// Nhân viên kho xuất hàng cho shipper bằng mã vận đơn
public class DispatchOrderRequest
{
    [Required(ErrorMessage = "Vui lòng nhập mã vận đơn")]
    [StringLength(30, ErrorMessage = "Mã vận đơn không hợp lệ")]
    public string Code { get; set; } = string.Empty;
}

public class OrderPhotoDto
{
    public Guid Id { get; set; }
    public string Kind { get; set; } = string.Empty;   // delivered | failed
    public DateTime CreatedAt { get; set; }
    public string? UploadedByName { get; set; }
}

// Ảnh đã đọc và kiểm tra từ form, sẵn sàng lưu
public class PhotoUpload
{
    public string ContentType { get; set; } = string.Empty;
    public byte[] Data { get; set; } = Array.Empty<byte>();
}

// Giao thành công. Gửi dạng multipart/form-data vì có thể kèm ảnh.
public class DeliverForm
{
    // Số COD thực thu. Bỏ trống = đúng số COD của đơn.
    [Range(0, 1000000000, ErrorMessage = "Số tiền thu không hợp lệ")]
    public decimal? CollectedAmount { get; set; }

    [StringLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự")]
    public string? Note { get; set; }

    public List<IFormFile>? Photos { get; set; }
}

// Giao thất bại kèm lý do (FR54)
public class FailForm
{
    // no_contact | refused | wrong_address
    [Required(ErrorMessage = "Vui lòng chọn lý do giao thất bại")]
    public string Reason { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự")]
    public string? Note { get; set; }

    public List<IFormFile>? Photos { get; set; }
}
