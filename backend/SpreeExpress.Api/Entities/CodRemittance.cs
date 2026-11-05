// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Entities\
namespace SpreeExpress.Api.Entities;

// Phiếu nộp COD: shipper nộp số tiền thu hộ của các đơn đã giao thành công (FR57).
// Kế toán đối chiếu số tiền thực nhận rồi xác nhận (FR59).
public class CodRemittance
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Mã phiếu, ví dụ NT2506240001
    public string Code { get; set; } = string.Empty;

    public Guid ShipperId { get; set; }
    public User? Shipper { get; set; }

    public int OrderCount { get; set; }
    public decimal TotalAmount { get; set; }         // tổng COD shipper khai nộp
    public decimal? ReceivedAmount { get; set; }     // số tiền kế toán thực nhận
    public RemittanceStatus Status { get; set; } = RemittanceStatus.Pending;
    public string? ConfirmNote { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }
    public Guid? ConfirmedById { get; set; }
    public User? ConfirmedBy { get; set; }

    public List<Order> Orders { get; set; } = new();
}
