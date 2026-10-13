// Đặt vào: D:\spreeexpress\backend\SpreeExpress.Api\DTOs\
using System.ComponentModel.DataAnnotations;

namespace SpreeExpress.Api.DTOs;

public class WarehouseDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "regional" | "local"
    public Guid? ParentId { get; set; }
    public string? ParentCode { get; set; }
    public string? ParentName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int StaffCount { get; set; }
    public int ShipperCount { get; set; }
}

public class WarehouseMemberDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class WarehouseChildDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class WarehouseDetailDto
{
    public WarehouseDto Warehouse { get; set; } = new();
    public List<WarehouseMemberDto> Staff { get; set; } = new();
    public List<WarehouseMemberDto> Shippers { get; set; } = new();
    public List<WarehouseChildDto> Children { get; set; } = new();

    // Tồn kho hiện tại: sẽ có số thật khi làm module đơn hàng
    public int StockCount { get; set; }
}

public class WarehouseSummaryDto
{
    public int Total { get; set; }
    public int Active { get; set; }
    public int Regional { get; set; }
    public int Local { get; set; }
}

// Dùng cho ô chọn kho (form tạo tài khoản, chọn kho vùng quản lý...)
public class WarehouseOptionDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}

public class CreateWarehouseRequest
{
    // Mã kho do Admin tự đặt (không trùng). Chữ, số, dấu gạch ngang, dài 2 đến 20 ký tự. Ví dụ: HCM, HOCMON, HN-CG
    [Required(ErrorMessage = "Vui lòng nhập mã kho")]
    [RegularExpression(@"^[A-Za-z0-9][A-Za-z0-9\-]{1,19}$", ErrorMessage = "Mã kho gồm 2 đến 20 ký tự: chữ, số hoặc dấu gạch ngang (-)")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập tên kho")]
    [StringLength(150, ErrorMessage = "Tên kho tối đa 150 ký tự")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập địa chỉ")]
    [StringLength(300, ErrorMessage = "Địa chỉ tối đa 300 ký tự")]
    public string Address { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng chọn loại kho")]
    public string Type { get; set; } = string.Empty;

    // Kho vùng quản lý: BẮT BUỘC với kho địa phương, bỏ trống với kho vùng
    public Guid? ParentId { get; set; }
}

public class UpdateWarehouseRequest
{
    [Required(ErrorMessage = "Vui lòng nhập tên kho")]
    [StringLength(150, ErrorMessage = "Tên kho tối đa 150 ký tự")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập địa chỉ")]
    [StringLength(300, ErrorMessage = "Địa chỉ tối đa 300 ký tự")]
    public string Address { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng chọn loại kho")]
    public string Type { get; set; } = string.Empty;

    public Guid? ParentId { get; set; }
}

public class AssignMemberRequest
{
    [Required(ErrorMessage = "Vui lòng chọn tài khoản")]
    public Guid? UserId { get; set; }
}
