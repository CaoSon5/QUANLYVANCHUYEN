// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Entities\
namespace SpreeExpress.Api.Entities;

// Bảng đối soát theo kỳ cho một người bán (FR60, FR61, FR67).
// Tiền trả người bán = tổng COD đã thu - phí vận chuyển + các khoản phát sinh.
public class Settlement
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Mã bảng đối soát, ví dụ DS2506240001
    public string Code { get; set; } = string.Empty;

    public Guid SellerId { get; set; }
    public User? Seller { get; set; }

    public DateOnly PeriodFrom { get; set; }
    public DateOnly PeriodTo { get; set; }

    public int OrderCount { get; set; }
    public decimal GrossCod { get; set; }            // tổng COD đã thu của các đơn trong kỳ
    public decimal TotalShippingFee { get; set; }    // tổng phí vận chuyển bị trừ
    public decimal TotalAdjustments { get; set; }    // tổng khoản phát sinh (âm = trừ, dương = cộng)
    public decimal NetAmount { get; set; }           // số tiền thực trả người bán (âm = người bán còn nợ phí)

    public SettlementStatus Status { get; set; } = SettlementStatus.Pending;
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedById { get; set; }
    public User? CreatedBy { get; set; }

    public DateTime? PaidAt { get; set; }
    public Guid? PaidById { get; set; }
    public User? PaidBy { get; set; }
    public string? PaymentRef { get; set; }          // mã giao dịch chuyển tiền

    public List<Order> Orders { get; set; } = new();
    public List<SettlementAdjustment> Adjustments { get; set; } = new();
}

public class SettlementAdjustment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SettlementId { get; set; }
    public Settlement? Settlement { get; set; }

    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }              // âm = trừ vào tiền người bán, dương = cộng thêm
}
