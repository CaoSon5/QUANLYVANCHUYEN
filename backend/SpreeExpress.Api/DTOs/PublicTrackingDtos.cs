// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\DTOs\
namespace SpreeExpress.Api.DTOs;

// ===== Tra cứu công khai cho khách nhận hàng (FR69) =====
// Chỉ chứa thông tin khách cần để theo dõi đơn. Tên và số điện thoại được che bớt;
// không có địa chỉ chi tiết, phí vận chuyển, tên hay số điện thoại shipper, ghi chú nội bộ.

public class PublicTrackingEventDto
{
    public string Status { get; set; } = string.Empty;   // dạng snake_case: in_warehouse...
    public string Text { get; set; } = string.Empty;     // câu mô tả cho khách
    public DateTime At { get; set; }
}

public class PublicTrackingDto
{
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StatusText { get; set; } = string.Empty;
    public bool IsFinal { get; set; }                    // đã kết thúc: giao xong, hoàn về, hoặc hủy

    public string SenderName { get; set; } = string.Empty;      // đã che
    public string ReceiverName { get; set; } = string.Empty;    // đã che
    public string ReceiverPhone { get; set; } = string.Empty;   // đã che
    public string ReceiverArea { get; set; } = string.Empty;    // chỉ quận/huyện và tỉnh/thành

    public decimal CodAmount { get; set; }               // số tiền khách cần chuẩn bị khi nhận hàng
    public string? CurrentLocation { get; set; }         // tên kho nếu hàng đang nằm trong kho
    public int FailedAttempts { get; set; }              // số lần giao chưa thành công

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<PublicTrackingEventDto> Events { get; set; } = new();   // cũ nhất đứng trước
}

// Một dòng trong kết quả tra cứu theo số điện thoại
public class PublicTrackingSummaryDto
{
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StatusText { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;      // đã che
    public DateTime UpdatedAt { get; set; }
}
