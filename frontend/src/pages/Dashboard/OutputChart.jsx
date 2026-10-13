// Đặt vào: D:\spreeexpress\frontend\src\pages\Dashboard\
import { Calendar, ChevronDown } from 'lucide-react';

const MAX = 200;
const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// Biểu đồ cột "Sản lượng vận hành".
// Chưa truyền data -> chỉ hiện khung trống. Khi có dữ liệu thật, truyền vào mảng:
//   [{ day: 'T2', done: 120, pending: 55 }, ...]   (7 ngày)
export default function OutputChart({ data }) {
  const hasData = Array.isArray(data) && data.length > 0;
  const rows = hasData ? data : DAYS.map((day) => ({ day, done: 0, pending: 0 }));

  return (
    <div className="card">
      <div className="chart-head">
        <div>
          <div className="card-title">Sản lượng vận hành</div>
          <div className="card-sub">Số đơn xử lý trong 7 ngày gần nhất</div>
        </div>
        <button className="btn select-btn"><Calendar size={16} /> 7 ngày qua <ChevronDown size={14} /></button>
      </div>

      <div className="bars">
        <div className="bars-y">
          {[200, 150, 100, 50, 0].map((v) => <span key={v}>{v}</span>)}
        </div>
        <div className="bars-plot">
          <div className="bars-grid">
            {[0, 1, 2, 3, 4].map((i) => <i key={i} />)}
          </div>
          <div className="bars-cols">
            {rows.map((d) => (
              <div className="bars-col" key={d.day}>
                <div className="bars-pair">
                  <i className="b-done" style={{ height: `${(d.done / MAX) * 100}%` }} />
                  <i className="b-pending" style={{ height: `${(d.pending / MAX) * 100}%` }} />
                </div>
                <span>{d.day}</span>
              </div>
            ))}
          </div>
          {!hasData && <div className="chart-empty-note">Chưa có dữ liệu</div>}
        </div>
      </div>

      <div className="legend">
        <span><i style={{ background: '#2f7bff' }} /> Thành công</span>
        <span><i style={{ background: '#dbe7fb' }} /> Đang xử lý</span>
      </div>
    </div>
  );
}
