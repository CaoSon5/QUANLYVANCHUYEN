// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Entities\
namespace SpreeExpress.Api.Entities;

// Vòng đời của một bao hàng (gộp nhiều đơn cùng đi một kho đích)
public enum BundleStatus
{
    Open,        // Đang gộp: còn thêm hoặc bớt đơn được
    Sealed,      // Đã đóng bao, chờ lên xe
    InTransit,   // Đang trên xe (thuộc một chuyến vận chuyển)
    Received,    // Đã đến kho đích, chờ mở bao
    Opened,      // Đã mở bao, các đơn đã nhập kho tại kho đích
    Cancelled    // Đã hủy bao, các đơn trở lại kho
}
