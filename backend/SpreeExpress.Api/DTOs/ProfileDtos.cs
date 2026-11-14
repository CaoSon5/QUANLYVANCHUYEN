// Đặt vào: backend\SpreeExpress.Api\DTOs\ (file MỚI)
using System.ComponentModel.DataAnnotations;

namespace SpreeExpress.Api.DTOs;

// Người dùng tự sửa hồ sơ của chính mình: CHỈ họ tên và số điện thoại.
// Cố ý không có email, vai trò, kho để không ai tự nâng quyền hay đổi kho qua API này.
public class UpdateProfileRequest
{
    [Required(ErrorMessage = "Vui lòng nhập họ và tên")]
    [StringLength(100, ErrorMessage = "Họ và tên tối đa 100 ký tự")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập số điện thoại")]
    [RegularExpression(@"^(0|\+84)\d{9}$", ErrorMessage = "Số điện thoại không hợp lệ")]
    public string Phone { get; set; } = string.Empty;
}
