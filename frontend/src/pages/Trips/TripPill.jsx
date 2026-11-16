// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import '../Orders/orders.css';

export const TRIP_STATUS = {
  assigned: { label: 'Chờ tài xế đến kho', tone: 'amber' },
  at_warehouse: { label: 'Đang ở kho', tone: 'blue' },
  in_transit: { label: 'Đang vận chuyển', tone: 'purple' },
  completed: { label: 'Hoàn thành', tone: 'green' },
  cancelled: { label: 'Đã hủy', tone: 'gray' },
};

// Nhãn trạng thái của chuyến vận chuyển
export default function TripPill({ status }) {
  const s = TRIP_STATUS[status] ?? { label: status, tone: 'gray' };
  return <span className={`st st-${s.tone}`}>{s.label}</span>;
}
