// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Reports\
import { formatVnd } from '../../utils/format';
import './reports.css';

// Biểu đồ cột doanh thu theo kỳ. Rê chuột vào cột để xem số liệu chính xác.
export default function RevenueBars({ buckets, height = 220 }) {
  const max = Math.max(1, ...buckets.map((b) => b.revenue));
  const total = buckets.reduce((sum, b) => sum + b.revenue, 0);
  const step = Math.max(1, Math.ceil(buckets.length / 12)); // chỉ hiện khoảng 12 nhãn cho khỏi chật

  return (
    <div className="rev-wrap">
      <div className="rev-bars" style={{ height }}>
        {buckets.map((b, i) => (
          <div className="rev-col" key={b.key} title={`${b.label}: ${formatVnd(b.revenue)} (${b.orderCount} đơn)`}>
            <div className="rev-bar" style={{ height: b.revenue === 0 ? 0 : `${Math.max(2, (b.revenue / max) * 100)}%` }} />
            <span className="rev-label">{i % step === 0 ? b.label : ''}</span>
          </div>
        ))}
      </div>
      {total === 0 && <div className="rev-empty">Chưa có doanh thu trong kỳ này</div>}
    </div>
  );
}
