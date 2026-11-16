// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Entities\
namespace SpreeExpress.Api.Entities;

// Chuyến vận chuyển liên kho (FR22): một tài xế đi nhận bao ở kho, chở đến các kho đích rồi hoàn thành chuyến.
public class Trip
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Mã chuyến, ví dụ CH26110400001
    public string Code { get; set; } = string.Empty;

    public Guid DriverId { get; set; }
    public User? Driver { get; set; }

    // Thông tin xe được chụp lại lúc phân chuyến, để sau này đổi hồ sơ tài xế không làm sai chuyến cũ
    public string VehiclePlate { get; set; } = string.Empty;
    public decimal CapacityKg { get; set; }

    public TripStatus Status { get; set; } = TripStatus.Assigned;

    // Kho tài xế đến nhận hàng đầu tiên (FR22)
    public Guid PickupWarehouseId { get; set; }
    public Warehouse? Pickup { get; set; }

    // Kho gần nhất tài xế đã đến (giữ nguyên sau khi xuất phát)
    public Guid? CurrentWarehouseId { get; set; }
    public Warehouse? Current { get; set; }

    // Kho tài xế phải đến tiếp theo
    public Guid? NextWarehouseId { get; set; }
    public Warehouse? Next { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedById { get; set; }
    public User? CreatedBy { get; set; }

    public DateTime? StartedAt { get; set; }      // lần xuất phát đầu tiên
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    public List<Bundle> Bundles { get; set; } = new();
    public List<TripStop> Stops { get; set; } = new();
    public List<TripDiscrepancy> Discrepancies { get; set; } = new();
}

// Một lần dừng ở kho trong chuyến
public class TripStop
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TripId { get; set; }
    public Trip? Trip { get; set; }

    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    public int Seq { get; set; }
    public DateTime ArrivedAt { get; set; }
    public DateTime? DepartedAt { get; set; }
    public DateTime? ReceiveFinishedAt { get; set; }   // kho đã chốt nhận hàng ở lần dừng này
}

// Thiếu, thừa bao khi đối chiếu với phiếu chuyển (FR38)
public class TripDiscrepancy
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TripId { get; set; }
    public Trip? Trip { get; set; }

    public Guid WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }

    public DiscrepancyType Type { get; set; }

    public Guid? BundleId { get; set; }
    public string BundleCode { get; set; } = string.Empty;   // lưu cả mã gõ tay khi không có bao tương ứng
    public string? Note { get; set; }

    public Guid ReportedById { get; set; }
    public User? ReportedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
