// Đặt vào: D:\spreeexpress\backend\SpreeExpress.Api\Repositories\Interfaces\
using SpreeExpress.Api.Entities;

namespace SpreeExpress.Api.Repositories.Interfaces;

// Một dòng trong danh sách kho (đã kèm số nhân viên, số shipper, kho vùng quản lý)
public class WarehouseRow
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public WarehouseType Type { get; set; }
    public Guid? ParentId { get; set; }
    public string? ParentCode { get; set; }
    public string? ParentName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int StaffCount { get; set; }
    public int ShipperCount { get; set; }
}

public interface IWarehouseRepository
{
    Task<Warehouse?> GetByIdAsync(Guid id);          // để sửa (có theo dõi thay đổi)
    Task<Warehouse?> GetDetailAsync(Guid id);        // kèm thành viên và kho trực thuộc (chỉ đọc)
    Task<WarehouseRow?> GetRowAsync(Guid id);

    Task<(List<WarehouseRow> Items, int Total)> SearchAsync(
        string? search, WarehouseType? type, bool? isActive, int page, int pageSize);
    Task<(int Total, int Active, int Regional, int Local)> GetCountsAsync();
    Task<List<Warehouse>> GetActiveAsync();

    Task<bool> CodeExistsAsync(string code);
    Task<bool> HasChildrenAsync(Guid id);
    Task<bool> HasActiveChildrenAsync(Guid id);
    Task<bool> HasShippersAsync(Guid id);

    Task AddAsync(Warehouse warehouse);
    Task UpdateAsync(Warehouse warehouse);
}
