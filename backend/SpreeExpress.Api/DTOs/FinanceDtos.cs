// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\DTOs\
using System.ComponentModel.DataAnnotations;

namespace SpreeExpress.Api.DTOs;

// Một dòng đơn hàng trong phiếu nộp / bảng đối soát
public class FinanceOrderLineDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public DateTime? DeliveredAt { get; set; }
    public decimal CodAmount { get; set; }        // COD theo đơn
    public decimal CodCollected { get; set; }     // COD shipper thực thu
    public decimal ShippingFee { get; set; }
}

// ----- Shipper nộp COD (FR57) -----

public class HoldingDto
{
    public decimal TotalAmount { get; set; }
    public int OrderCount { get; set; }
    public List<FinanceOrderLineDto> Orders { get; set; } = new();
}

public class CreateRemittanceRequest
{
    // Bỏ trống = nộp tất cả đơn đang giữ tiền
    public List<Guid>? OrderIds { get; set; }
}

public class RemittanceDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public Guid ShipperId { get; set; }
    public string ShipperName { get; set; } = string.Empty;
    public string ShipperPhone { get; set; } = string.Empty;
    public int OrderCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal? ReceivedAmount { get; set; }
    public decimal? Difference { get; set; }       // thực nhận - khai nộp (âm = thiếu tiền)
    public string Status { get; set; } = string.Empty;   // pending | confirmed
    public string? ConfirmNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public string? ConfirmedByName { get; set; }
    public List<FinanceOrderLineDto> Orders { get; set; } = new();   // chỉ có ở trang chi tiết
}

public class ConfirmRemittanceRequest
{
    // Bỏ trống = nhận đủ số tiền khai nộp
    [Range(0, 1000000000, ErrorMessage = "Số tiền thực nhận không hợp lệ")]
    public decimal? ReceivedAmount { get; set; }

    [StringLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự")]
    public string? Note { get; set; }
}

public class ShipperHoldingDto
{
    public Guid ShipperId { get; set; }
    public string ShipperName { get; set; } = string.Empty;
    public string ShipperPhone { get; set; } = string.Empty;
    public int OrderCount { get; set; }
    public decimal Amount { get; set; }
    public DateTime? OldestDeliveredAt { get; set; }
}

// ----- Đối soát người bán (FR60, FR61, FR67) -----

public class SellerLookupDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class AdjustmentRequest
{
    [Required(ErrorMessage = "Vui lòng nhập nội dung khoản phát sinh")]
    [StringLength(200, ErrorMessage = "Nội dung khoản phát sinh tối đa 200 ký tự")]
    public string Description { get; set; } = string.Empty;

    // Âm = trừ vào tiền người bán, dương = cộng thêm
    [Range(-1000000000, 1000000000, ErrorMessage = "Số tiền khoản phát sinh không hợp lệ")]
    public decimal Amount { get; set; }
}

public class AdjustmentDto
{
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class SettlementPeriodRequest
{
    [Required(ErrorMessage = "Vui lòng chọn người bán")]
    public Guid? SellerId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn ngày bắt đầu kỳ đối soát")]
    public DateOnly? From { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn ngày kết thúc kỳ đối soát")]
    public DateOnly? To { get; set; }
}

public class CreateSettlementRequest : SettlementPeriodRequest
{
    public List<AdjustmentRequest>? Adjustments { get; set; }

    [StringLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự")]
    public string? Note { get; set; }
}

public class SettlementPreviewDto
{
    public Guid SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public int OrderCount { get; set; }
    public decimal GrossCod { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal NetBeforeAdjustments { get; set; }

    // Đơn đã giao trong kỳ nhưng chưa đủ điều kiện (COD chưa được kế toán xác nhận nhận từ shipper)
    public int ExcludedCount { get; set; }
    public decimal ExcludedAmount { get; set; }

    public List<FinanceOrderLineDto> Orders { get; set; } = new();
}

public class SettlementDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public Guid SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public string SellerEmail { get; set; } = string.Empty;
    public string SellerPhone { get; set; } = string.Empty;
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public int OrderCount { get; set; }
    public decimal GrossCod { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal TotalAdjustments { get; set; }
    public decimal NetAmount { get; set; }
    public string Status { get; set; } = string.Empty;   // pending | paid
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? PaidByName { get; set; }
    public string? PaymentRef { get; set; }
    public List<FinanceOrderLineDto> Orders { get; set; } = new();    // chỉ có ở trang chi tiết
    public List<AdjustmentDto> Adjustments { get; set; } = new();     // chỉ có ở trang chi tiết
}

public class PaySettlementRequest
{
    [StringLength(100, ErrorMessage = "Mã giao dịch tối đa 100 ký tự")]
    public string? PaymentRef { get; set; }
}

// Số liệu tổng quan cho Kế toán
public class FinanceSummaryDto
{
    public decimal CodCollectedTotal { get; set; }     // tổng COD shipper đã thu
    public decimal CodHeld { get; set; }               // COD shipper đang giữ, chưa nộp
    public int RemittancesPending { get; set; }        // phiếu nộp chờ xác nhận
    public int SettlementsPending { get; set; }        // bảng đối soát chờ chuyển tiền
    public int SettlementsPaid { get; set; }           // bảng đối soát đã chuyển tiền
    public decimal PendingPayoutAmount { get; set; }   // tổng tiền chờ chuyển cho người bán
}

// ----- Báo cáo doanh thu phí vận chuyển (FR14) -----

public class RevenueBucketDto
{
    public string Key { get; set; } = string.Empty;      // ngày đầu kỳ, dạng yyyy-MM-dd
    public string Label { get; set; } = string.Empty;    // nhãn hiển thị: 31/10, 10/2026 hoặc 2026
    public int OrderCount { get; set; }                  // số đơn giao thành công trong kỳ
    public decimal Revenue { get; set; }                 // tổng phí vận chuyển của các đơn đó
    public decimal CodCollected { get; set; }            // tổng COD đã thu của các đơn đó
}

public class ShippingRevenueDto
{
    public string Granularity { get; set; } = string.Empty;   // day | month | year
    public DateOnly From { get; set; }                        // ngày đầu của kỳ đầu tiên (đã chuẩn hóa)
    public DateOnly To { get; set; }                          // ngày cuối của kỳ cuối cùng (đã chuẩn hóa)
    public List<RevenueBucketDto> Buckets { get; set; } = new();

    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public decimal AverageFee { get; set; }                   // phí trung bình mỗi đơn
    public decimal TotalCod { get; set; }

    // Kỳ liền trước có cùng độ dài, để so sánh
    public decimal PreviousRevenue { get; set; }
    public int PreviousOrders { get; set; }
    public decimal? ChangePercent { get; set; }               // null nếu kỳ trước chưa có doanh thu
}
