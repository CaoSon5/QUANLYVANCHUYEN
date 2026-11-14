// Đặt vào: D:\spreeexpress\frontend\src\pages\Dashboard\
import { Calendar, ChevronDown } from 'lucide-react';

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DEFAULT_LEGEND = [
  { label: 'Thành công', color: '#2f7bff' },
  { label: 'Đang xử lý', color: '#dbe7fb' },
];

// Biểu đồ cột "Sản lượng vận hành".
// Chưa truyền data -> chỉ hiện khung trống (thang 0 đến 200 như cũ). Khi có dữ liệu thật, truyền vào mảng:
//   [{ day: 'T2', done: 120, pending: 55 }, ...]
// - pending có thể bỏ trống: khi đó chỉ vẽ một cột (done) cho mỗi ngày.
// - tip (tuỳ chọn): chữ hiện khi rê chuột lên cột, ví dụ ngày đầy đủ.
// Các prop tuỳ chọn khác (mặc định giữ giao diện cũ):
//   title, subtitle, legend: [{ label, color }]
//   range: { value, options: [{ value, label }], onChange } -> hiện nút chọn kỳ thay cho nút "7 ngày qua"
export default function OutputChart({
  data,
  title = 'Sản lượng vận hành',
  subtitle = 'Số đơn xử lý trong 7 ngày gần nhất',
  legend = DEFAULT_LEGEND,
  range,
}) {
  const hasData = Array.isArray(data) && data.length > 0;
  const rows = hasData ? data : DAYS.map((day) => ({ day, done: 0, pending: 0 }));
  const showPending = rows.some((d) => d.pending != null);

  // Chưa có dữ liệu thì giữ thang 0 đến 200. Có dữ liệu thì thang tự co giãn theo giá trị lớn nhất (chia hết cho 4)
  const peak = Math.max(0, ...rows.map((d) => Math.max(d.done || 0, d.pending || 0)));
  const max = hasData ? Math.max(4, Math.ceil(peak / 4) * 4) : 200;
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(max * f));

  return (
    <div className="card">
      <div className="chart-head">
        <div>
          <div className="card-title">{title}</div>
          <div className="card-sub">{subtitle}</div>
        </div>
        {range ? (
          <div style={{ display: 'flex', gap: 8 }}>
            {range.options.map((o) => (
              <button
                key={o.value}
                className={`btn btn-sm ${range.value === o.value ? 'btn-primary' : ''}`}
                onClick={() => range.onChange(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : (
          <button className="btn select-btn"><Calendar size={16} /> 7 ngày qua <ChevronDown size={14} /></button>
        )}
      </div>

      <div className="bars">
        <div className="bars-y">
          {ticks.map((v, i) => <span key={i}>{v}</span>)}
        </div>
        <div className="bars-plot">
          <div className="bars-grid">
            {[0, 1, 2, 3, 4].map((i) => <i key={i} />)}
          </div>
          <div className="bars-cols">
            {rows.map((d, i) => (
              <div className="bars-col" key={i} title={`${d.tip || d.day}: ${d.done || 0}`}>
                <div className="bars-pair">
                  <i className="b-done" style={{ height: `${((d.done || 0) / max) * 100}%` }} />
                  {showPending && <i className="b-pending" style={{ height: `${((d.pending || 0) / max) * 100}%` }} />}
                </div>
                <span>{d.day}</span>
              </div>
            ))}
          </div>
          {!hasData && <div className="chart-empty-note">Chưa có dữ liệu</div>}
        </div>
      </div>

      <div className="legend">
        {legend.map((l) => (
          <span key={l.label}><i style={{ background: l.color }} /> {l.label}</span>
        ))}
      </div>
    </div>
  );
}
