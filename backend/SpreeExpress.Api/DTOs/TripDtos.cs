// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\DTOs\
using System.ComponentModel.DataAnnotations;

namespace SpreeExpress.Api.DTOs;

// Tài xế trong màn hình điều phối (FR23): rảnh hay đang bận, đang ở đâu, xe thế nào
public class DriverOptionDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? VehiclePlate { get; set; }
    public decimal? CapacityKg { get; set; }
    public bool HasVehicle { get; set; }               // đã có biển số và tải trọng thì mới phân chuyến được
    public bool IsIdle { get; set; }
    public string? ActiveTripCode { get; set; }
    public string? ActiveTripStatus { get; set; }
    public string? WarehouseCode { get; set; }         // kho hiện tại (với tài xế rảnh)
    public string? WarehouseName { get; set; }
    public string Location { get; set; } = string.Empty;   // câu mô tả vị trí
}

public class TripStopDto
{
    public int Seq { get; set; }
    public string WarehouseCode { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public DateTime ArrivedAt { get; set; }
    public DateTime? DepartedAt { get; set; }
    public DateTime? ReceiveFinishedAt { get; set; }
}

public class TripBundleDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;     // in_transit | received | opened | missing ...
    public string LoadedAtCode { get; set; } = string.Empty;
    public string DestinationCode { get; set; } = string.Empty;
    public string DestinationName { get; set; } = string.Empty;
    public int OrderCount { get; set; }
    public decimal TotalWeightKg { get; set; }
    public int LoadSeq { get; set; }
    public DateTime? LoadedAt { get; set; }
    public DateTime? ReceivedAt { get; set; }
}

public class TripDiscrepancyDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;       // missing | extra
    public string WarehouseCode { get; set; } = string.Empty;
    public string BundleCode { get; set; } = string.Empty;
    public string? Note { get; set; }
    public string? ReportedByName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TripDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;      // assigned | at_warehouse | in_transit | completed | cancelled

    public Guid DriverId { get; set; }
    public string DriverName { get; set; } = string.Empty;
    public string DriverPhone { get; set; } = string.Empty;
    public string VehiclePlate { get; set; } = string.Empty;
    public decimal CapacityKg { get; set; }
    public decimal LoadKg { get; set; }                     // đang chở trên xe
    public decimal FreeKg { get; set; }                     // còn chở thêm được

    public string PickupCode { get; set; } = string.Empty;
    public string PickupName { get; set; } = string.Empty;
    public Guid? CurrentWarehouseId { get; set; }
    public string? CurrentCode { get; set; }
    public string? CurrentName { get; set; }
    public Guid? NextWarehouseId { get; set; }
    public string? NextCode { get; set; }
    public string? NextName { get; set; }

    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public int BundlesOnTruck { get; set; }
    public int BundlesReceived { get; set; }
    public int BundlesMissing { get; set; }
    public int AwaitingHere { get; set; }                   // bao đi kho tài xế đang đứng, chờ kho nhận

    // Chỉ có ở trang chi tiết
    public List<TripBundleDto> Bundles { get; set; } = new();
    public List<TripStopDto> Stops { get; set; } = new();
    public List<TripDiscrepancyDto> Discrepancies { get; set; } = new();
}

// Màn hình của nhân viên kho: xe đang ở kho mình và xe đang trên đường tới
public class WarehouseTripsDto
{
    public List<TripDto> AtWarehouse { get; set; } = new();
    public List<TripDto> Incoming { get; set; } = new();
}

// FR26: các việc chờ quá lâu mà chưa ai nhận
public class StaleItemDto
{
    public string Kind { get; set; } = string.Empty;        // order_pickup | order_delivery | bundle | trip
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime Since { get; set; }
    public string? WarehouseCode { get; set; }
}

public class StaleReportDto
{
    public int PendingPickupHours { get; set; }
    public int UnclaimedDeliveryHours { get; set; }
    public int UnloadedBundleHours { get; set; }
    public int AssignedTripHours { get; set; }
    public List<StaleItemDto> Items { get; set; } = new();
}

public class CreateTripRequest
{
    [Required(ErrorMessage = "Vui lòng chọn tài xế")]
    public Guid? DriverId { get; set; }

    // Mã kho tài xế đến nhận hàng đầu tiên
    [Required(ErrorMessage = "Vui lòng nhập mã kho tài xế đến nhận hàng")]
    [StringLength(20, ErrorMessage = "Mã kho không hợp lệ")]
    public string WarehouseCode { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự")]
    public string? Note { get; set; }
}

public class ReassignTripRequest
{
    public Guid? DriverId { get; set; }

    [StringLength(20, ErrorMessage = "Mã kho không hợp lệ")]
    public string? WarehouseCode { get; set; }
}

public class TripBundleCodeRequest
{
    [Required(ErrorMessage = "Vui lòng nhập mã bao")]
    [StringLength(30, ErrorMessage = "Mã bao không hợp lệ")]
    public string Code { get; set; } = string.Empty;
}

public class FinishReceivingRequest
{
    [StringLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự")]
    public string? Note { get; set; }
}

public class ReportExtraRequest
{
    [Required(ErrorMessage = "Vui lòng nhập mã bao thừa")]
    [StringLength(30, ErrorMessage = "Mã bao không hợp lệ")]
    public string Code { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Ghi chú tối đa 500 ký tự")]
    public string? Note { get; set; }
}
