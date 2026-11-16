// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Entities\
namespace SpreeExpress.Api.Entities;

// Bao hàng (FR33, FR34): nhân viên kho gộp các đơn cùng đi một kho đích để chuyển đi cùng nhau.
// Kho đích được chọn một lần lúc tạo bao, sau đó chỉ việc thêm đơn.
public class Bundle
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Mã bao, ví dụ BAO26110400001
    public string Code { get; set; } = string.Empty;

    // Kho tạo bao
    public Guid OriginWarehouseId { get; set; }
    public Warehouse? Origin { get; set; }

    // Kho đang giữ bao (đổi khi bao được chuyển đi)
    public Guid CurrentWarehouseId { get; set; }
    public Warehouse? Current { get; set; }

    // Kho đích: nơi bao sẽ được mở và các đơn nhập kho
    public Guid DestinationWarehouseId { get; set; }
    public Warehouse? Destination { get; set; }

    public BundleStatus Status { get; set; } = BundleStatus.Open;

    // Số liệu tổng hợp, được tính lại mỗi lần thêm hoặc bớt đơn
    public int OrderCount { get; set; }
    public decimal TotalWeightKg { get; set; }
    public int TotalPieces { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public DateTime? SealedAt { get; set; }

    // Chuyến vận chuyển đang chở bao (FR35)
    public Guid? TripId { get; set; }
    public Trip? Trip { get; set; }
    public int LoadSeq { get; set; }                   // thứ tự lên xe, dùng để chọn kho đến tiếp theo
    public DateTime? LoadedAt { get; set; }
    public Guid? LoadedAtWarehouseId { get; set; }     // kho nơi bao được lên xe
    public Warehouse? LoadedAtWarehouse { get; set; }

    public DateTime? ReceivedAt { get; set; }          // kho đích nhận bao (FR30)
    public DateTime? OpenedAt { get; set; }            // kho đích mở bao (FR39)

    public List<Order> Orders { get; set; } = new();
}
