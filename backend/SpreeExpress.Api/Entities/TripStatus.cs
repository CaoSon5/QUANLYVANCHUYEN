// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Entities\
namespace SpreeExpress.Api.Entities;

// Vòng đời của một chuyến vận chuyển liên kho
public enum TripStatus
{
    Assigned,     // Điều phối viên đã phân tài xế, tài xế chưa đến kho
    AtWarehouse,  // Tài xế đang ở một kho: nhân viên kho lên hàng hoặc nhận hàng
    InTransit,    // Tài xế đã xuất phát, đang trên đường đến kho kế tiếp
    Completed,    // Đã hoàn thành: xe không còn bao nào cần giao
    Cancelled     // Đã hủy
}

public enum DiscrepancyType
{
    Missing,  // Thiếu: bao có trong phiếu chuyển nhưng kho nhận không thấy
    Extra     // Thừa: kho nhận thấy bao không có trong phiếu chuyển
}
