namespace SpreeExpress.Api.Entities;

public class Warehouse
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Mã kho cố định do hệ thống cấp, ví dụ HCM-01. Không sửa sau khi tạo.
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public WarehouseType Type { get; set; }

    // Kho địa phương trực thuộc một kho vùng (có thể chưa gắn)
    public Guid? ParentId { get; set; }
    public Warehouse? Parent { get; set; }
    public ICollection<Warehouse> Children { get; set; } = new List<Warehouse>();

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Nhân viên kho và shipper được gán vào kho này
    public ICollection<User> Members { get; set; } = new List<User>();
}
