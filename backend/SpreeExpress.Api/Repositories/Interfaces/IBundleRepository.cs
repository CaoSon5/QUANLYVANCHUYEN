// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Repositories\Interfaces\
using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Repositories.Interfaces;

public class BundleFilter
{
    public Guid? CurrentWarehouseId { get; set; }   // chỉ bao đang nằm ở kho này
    public BundleStatus? Status { get; set; }
    public string? Search { get; set; }             // mã bao hoặc mã của một đơn trong bao
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public interface IBundleRepository
{
    Task<long> NextNumberAsync();
    void Add(Bundle bundle);

    // Có theo dõi, kèm danh sách đơn: dùng khi thêm, bớt đơn hoặc đổi trạng thái bao
    Task<Bundle?> GetTrackedAsync(Guid id);
    Task<Bundle?> GetTrackedByCodeAsync(string code);   // có theo dõi, kèm đơn: dùng khi lên xe

    // Chỉ đọc, kèm kho và đơn: dùng để hiển thị chi tiết
    Task<Bundle?> GetDetailAsync(Guid id);

    Task<(List<Bundle> Items, int Total)> SearchAsync(BundleFilter filter);
    Task SaveAsync();
}
