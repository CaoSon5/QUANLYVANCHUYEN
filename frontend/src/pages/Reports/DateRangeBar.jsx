// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Reports\
import './reports.css';

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n) => {
  const now = new Date();
  return iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n));
};

// 30 ngày gần nhất
export const defaultRange = () => ({ from: daysAgo(29), to: iso(new Date()) });

const PRESETS = [
  { label: '7 ngày', get: () => ({ from: daysAgo(6), to: iso(new Date()) }) },
  { label: '30 ngày', get: defaultRange },
  { label: '90 ngày', get: () => ({ from: daysAgo(89), to: iso(new Date()) }) },
  {
    label: 'Tháng này',
    get: () => {
      const now = new Date();
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
    },
  },
];

// Chọn khoảng ngày cho báo cáo: nhập tay hoặc bấm khoảng có sẵn
export default function DateRangeBar({ range, onChange }) {
  return (
    <div className="report-controls" style={{ marginTop: 16 }}>
      <div>
        <label>Từ ngày</label>
        <input className="acc-select" type="date" value={range.from} onChange={(e) => onChange({ ...range, from: e.target.value })} />
      </div>
      <div>
        <label>Đến ngày</label>
        <input className="acc-select" type="date" value={range.to} onChange={(e) => onChange({ ...range, to: e.target.value })} />
      </div>
      <div className="preset-row">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" className="act-btn" onClick={() => onChange(p.get())}>{p.label}</button>
        ))}
      </div>
    </div>
  );
}
