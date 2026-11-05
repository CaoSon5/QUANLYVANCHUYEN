// Đặt vào: D:\spreeexpress_supabase\spreeexpress\backend\SpreeExpress.Api\Entities\
namespace SpreeExpress.Api.Entities;

// Phiếu nộp COD của shipper: chờ kế toán xác nhận -> đã xác nhận
public enum RemittanceStatus
{
    Pending,
    Confirmed
}

// Bảng đối soát cho người bán: chờ chuyển tiền -> đã chuyển tiền
public enum SettlementStatus
{
    Pending,
    Paid
}
