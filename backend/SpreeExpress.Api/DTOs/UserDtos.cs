using System.ComponentModel.DataAnnotations;

namespace SpreeExpress.Api.DTOs;

public class UserDetailDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // chữ thường
    public bool IsActive { get; set; }
    public bool MustChangePassword { get; set; }
    public Guid? WarehouseId { get; set; }
    public string? WarehouseCode { get; set; }
    public string? WarehouseName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class UserSummaryDto
{
    public int Total { get; set; }
    public int Active { get; set; }
}

// Admin tạo tài khoản cho nhân viên / shipper / tài xế...
public class CreateUserRequest
{
    [Required(ErrorMessage = "Vui lòng nhập họ và tên")]
    [StringLength(100, ErrorMessage = "Họ và tên tối đa 100 ký tự")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập email")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập số điện thoại")]
    [RegularExpression(@"^(0|\+84)\d{9}$", ErrorMessage = "Số điện thoại không hợp lệ")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập mật khẩu")]
    [MinLength(6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự")]
    [MaxLength(100, ErrorMessage = "Mật khẩu tối đa 100 ký tự")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng chọn vai trò")]
    public string Role { get; set; } = string.Empty;

    // Bắt buộc với nhân viên kho và shipper; vai trò khác bỏ trống
    public Guid? WarehouseId { get; set; }
}

public class UpdateUserRequest
{
    [Required(ErrorMessage = "Vui lòng nhập họ và tên")]
    [StringLength(100, ErrorMessage = "Họ và tên tối đa 100 ký tự")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập email")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập số điện thoại")]
    [RegularExpression(@"^(0|\+84)\d{9}$", ErrorMessage = "Số điện thoại không hợp lệ")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng chọn vai trò")]
    public string Role { get; set; } = string.Empty;

    // Bắt buộc với nhân viên kho và shipper; vai trò khác bỏ trống
    public Guid? WarehouseId { get; set; }
}

public class SetStatusRequest
{
    public bool IsActive { get; set; }
}

public class ResetPasswordRequest
{
    [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới")]
    [MinLength(6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự")]
    [MaxLength(100, ErrorMessage = "Mật khẩu tối đa 100 ký tự")]
    public string NewPassword { get; set; } = string.Empty;
}
