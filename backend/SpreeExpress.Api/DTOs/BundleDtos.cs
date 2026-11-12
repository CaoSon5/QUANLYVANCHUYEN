// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\DTOs\
using System.ComponentModel.DataAnnotations;

namespace SpreeExpress.Api.DTOs;

// Một kho có thể chọn làm kho đích của bao
public class DestinationOptionDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;        // regional | local
    public string? ParentCode { get; set; }                 // kho vùng quản lý (nếu là kho địa phương)
}

public class BundleOrderDto
{
    public Guid OrderId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverDistrict { get; set; } = string.Empty;
    public string ReceiverProvince { get; set; } = string.Empty;
    public decimal WeightKg { get; set; }
    public int Pieces { get; set; }
    public decimal CodAmount { get; set; }
}

public class BundleDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;       // open | sealed | in_transit | received | opened | cancelled

    public string OriginCode { get; set; } = string.Empty;
    public string OriginName { get; set; } = string.Empty;
    public string CurrentCode { get; set; } = string.Empty;
    public string CurrentName { get; set; } = string.Empty;
    public Guid DestinationId { get; set; }
    public string DestinationCode { get; set; } = string.Empty;
    public string DestinationName { get; set; } = string.Empty;
    public string DestinationType { get; set; } = string.Empty;

    public int OrderCount { get; set; }
    public decimal TotalWeightKg { get; set; }
    public int TotalPieces { get; set; }
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime? SealedAt { get; set; }

    public List<BundleOrderDto> Orders { get; set; } = new();   // chỉ có ở trang chi tiết
}

public class CreateBundleRequest
{
    // Mã kho đích, nhập một lần lúc tạo bao
    [Required(ErrorMessage = "Vui lòng nhập mã kho đích")]
    [StringLength(20, ErrorMessage = "Mã kho không hợp lệ")]
    public string DestinationCode { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự")]
    public string? Note { get; set; }
}

public class AddBundleOrderRequest
{
    [Required(ErrorMessage = "Vui lòng nhập mã vận đơn")]
    [StringLength(30, ErrorMessage = "Mã vận đơn không hợp lệ")]
    public string Code { get; set; } = string.Empty;
}
