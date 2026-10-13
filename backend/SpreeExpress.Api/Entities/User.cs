namespace SpreeExpress.Api.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;

    // true: phải đổi mật khẩu ở lần đăng nhập tiếp theo (do Admin tạo / đặt lại mật khẩu)
    public bool MustChangePassword { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Kho mà nhân viên kho / shipper được gán (mỗi người chỉ thuộc một kho). Vai trò khác để trống.
    public Guid? WarehouseId { get; set; }
    public Warehouse? Warehouse { get; set; }
}
