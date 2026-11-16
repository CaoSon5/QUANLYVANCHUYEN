// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Repositories\Interfaces\
using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Repositories.Interfaces;

public class TripFilter
{
    public Guid? DriverId { get; set; }
    public Guid? WarehouseId { get; set; }          // chuyến có dừng, đến hoặc nhận hàng ở kho này
    public TripStatus? Status { get; set; }
    public bool ActiveOnly { get; set; }            // chỉ các chuyến chưa hoàn thành, chưa hủy
    public string? Search { get; set; }             // mã chuyến, tên tài xế hoặc mã bao trong chuyến
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class WarehouseLabel
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class StaleItem
{
    public string Kind { get; set; } = string.Empty;
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime Since { get; set; }
    public string? WarehouseCode { get; set; }
}

public interface ITripRepository
{
    Task<long> NextNumberAsync();
    void Add(Trip trip);

    // Có theo dõi, kèm bao (và đơn trong bao), điểm dừng, thiếu thừa: dùng khi đổi trạng thái chuyến
    Task<Trip?> GetTrackedAsync(Guid id);

    // Chỉ đọc, đầy đủ thông tin để hiển thị chi tiết
    Task<Trip?> GetDetailAsync(Guid id);

    Task<(List<Trip> Items, int Total)> SearchAsync(TripFilter filter);

    // Chuyến chưa hoàn thành của một tài xế (nếu có)
    Task<Trip?> GetActiveForDriverAsync(Guid driverId);
    Task<List<Trip>> GetActiveTripsAsync();

    // Với nhân viên kho: xe đang ở kho này, và xe đang trên đường tới kho này
    Task<List<Trip>> GetTripsForWarehouseAsync(Guid warehouseId);

    Task<List<User>> GetDriversAsync();
    Task<Dictionary<Guid, Guid>> GetLastCompletedWarehouseByDriverAsync();
    Task<List<WarehouseLabel>> GetWarehouseLabelsAsync(IEnumerable<Guid> ids);

    // FR26: việc chờ quá lâu
    Task<List<StaleItem>> GetStaleItemsAsync(DateTime pendingPickupBefore, DateTime unclaimedDeliveryBefore,
        DateTime unloadedBundleBefore, DateTime assignedTripBefore);

    Task SaveAsync();
}
