// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\WarehouseOps\
import '../Orders/orders.css';

export const BUNDLE_STATUS = {
  open: { label: 'Đang gộp', tone: 'amber' },
  sealed: { label: 'Đã đóng bao', tone: 'blue' },
  in_transit: { label: 'Đang vận chuyển', tone: 'purple' },
  received: { label: 'Đã đến kho đích', tone: 'purple' },
  opened: { label: 'Đã mở bao', tone: 'green' },
  missing: { label: 'Thất lạc', tone: 'red' },
  cancelled: { label: 'Đã hủy', tone: 'gray' },
};

export const WAREHOUSE_TYPE = { regional: 'Kho vùng', local: 'Kho địa phương' };

// Nhãn trạng thái của bao hàng
export default function BundlePill({ status }) {
  const s = BUNDLE_STATUS[status] ?? { label: status, tone: 'gray' };
  return <span className={`st st-${s.tone}`}>{s.label}</span>;
}
