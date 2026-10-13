// Đặt vào: D:\spreeexpress\frontend\src\pages\Dashboard\
// Tên và màu các nhóm trạng thái (chỉ là khung, không phải số liệu)
const GROUPS = [
  { key: 'success', label: 'Thành công', color: '#2563eb' },
  { key: 'delivering', label: 'Đang giao', color: '#0ea5e9' },
  { key: 'pending', label: 'Chờ lấy', color: '#f59e0b' },
  { key: 'failed', label: 'Thất bại', color: '#ef4444' },
];

// Biểu đồ tròn "Tình hình giao nhận".
// Chưa truyền data -> chỉ hiện vòng tròn trống. Khi có dữ liệu thật, truyền vào:
//   { total: 1248, percent: { success: 72, delivering: 14, pending: 9, failed: 5 } }
export default function DeliveryDonut({ data }) {
  const hasData = Boolean(data && data.total > 0);
  let acc = 0;

  return (
    <div className="card">
      <div className="card-title">Tình hình giao nhận</div>
      <div className="card-sub">Cập nhật theo thời gian thực</div>

      <div className="donut-wrap">
        <div className="donut-box">
          <svg viewBox="0 0 42 42" className="donut">
            <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#eef2f7" strokeWidth="5" />
            {hasData && GROUPS.map((g) => {
              const p = data.percent?.[g.key] ?? 0;
              const el = (
                <circle
                  key={g.key} cx="21" cy="21" r="15.9155" fill="none"
                  stroke={g.color} strokeWidth="5"
                  strokeDasharray={`${p} ${100 - p}`}
                  strokeDashoffset={25 - acc}
                />
              );
              acc += p;
              return el;
            })}
          </svg>
          <div className="donut-center">
            <strong>{hasData ? data.total.toLocaleString('vi-VN') : '—'}</strong>
            <span>Tổng đơn</span>
          </div>
        </div>

        <ul className="donut-legend">
          {GROUPS.map((g) => (
            <li key={g.key}>
              <i style={{ background: g.color }} />
              <span>{g.label}</span>
              <b>{hasData ? `${data.percent?.[g.key] ?? 0}%` : '—'}</b>
            </li>
          ))}
        </ul>
      </div>

      <div className="notice notice-empty">
        {hasData ? 'Cập nhật theo thời gian thực.' : 'Số liệu giao nhận sẽ hiển thị khi hệ thống có đơn hàng.'}
      </div>
    </div>
  );
}
