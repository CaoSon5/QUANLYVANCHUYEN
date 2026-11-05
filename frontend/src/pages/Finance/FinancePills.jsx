// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Finance\
import '../Orders/orders.css';

// Nhãn trạng thái phiếu nộp COD của shipper
export function RemittancePill({ status }) {
  return status === 'confirmed'
    ? <span className="st st-green">Đã xác nhận</span>
    : <span className="st st-amber">Chờ xác nhận</span>;
}

// Nhãn trạng thái bảng đối soát của người bán
export function SettlementPill({ status }) {
  return status === 'paid'
    ? <span className="st st-green">Đã chuyển tiền</span>
    : <span className="st st-amber">Chờ chuyển tiền</span>;
}
