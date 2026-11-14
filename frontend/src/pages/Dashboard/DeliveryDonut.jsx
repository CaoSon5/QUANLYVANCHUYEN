// Đặt vào: D:\spreeexpress\frontend\src\pages\Dashboard\
// Tên và màu các nhóm trạng thái (chỉ là khung, không phải số liệu)
const GROUPS = [
  { key: 'success', label: 'Thành công', color: '#2563eb' },
  { key: 'delivering', label: 'Đang giao', color: '#0ea5e9' },
  { key: 'pending', label: 'Chờ lấy', color: '#f59e0b' },
  { key: 'failed', label: 'Thất bại', color: '#ef4444' },
];

// Biểu đồ tròn "Tình hình giao nhận".
// Chưa truyền data -> chỉ hiện vòng tròn trống. Khi có dữ liệu thật, truyền vào một trong hai dạng:
//   Dạng phần trăm: { total: 1248, percent: { success: 72, delivering: 14, pending: 9, failed: 5 } }
//   Dạng số lượt:   { total: 12, counts: { success: 9, failed: 3 } }  -> chú giải hiện số lượt, không hiện phần trăm
// Các prop tuỳ chọn khác (mặc định giữ giao diện cũ): title, subtitle, groups, centerLabel, emptyNote, doneNote
export default function DeliveryDonut({
  data,
  title = 'Tình hình giao nhận',
  subtitle = 'Cập nhật theo thời gian thực',
  groups = GROUPS,
  centerLabel = 'Tổng đơn',
  emptyNote = 'Số liệu giao nhận sẽ hiển thị khi hệ thống có đơn hàng.',
  doneNote = 'Cập nhật theo thời gian thực.',
}) {
  const hasData = Boolean(data && data.total > 0);
  const counts = hasData ? data.counts : undefined;

  // Tỷ lệ (0 đến 100) để vẽ cung tròn
  const share = (key) => (counts ? ((counts[key] ?? 0) / data.total) * 100 : data.percent?.[key] ?? 0);
  const valueText = (key) => (counts ? `${counts[key] ?? 0} lượt` : `${data.percent?.[key] ?? 0}%`);

  let acc = 0;

  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-sub">{subtitle}</div>

      <div className="donut-wrap">
        <div className="donut-box">
          <svg viewBox="0 0 42 42" className="donut">
            <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#eef2f7" strokeWidth="5" />
            {hasData && groups.map((g) => {
              const p = share(g.key);
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
            <span>{centerLabel}</span>
          </div>
        </div>

        <ul className="donut-legend">
          {groups.map((g) => (
            <li key={g.key}>
              <i style={{ background: g.color }} />
              <span>{g.label}</span>
              <b>{hasData ? valueText(g.key) : '—'}</b>
            </li>
          ))}
        </ul>
      </div>

      <div className="notice notice-empty">
        {hasData ? doneNote : emptyNote}
      </div>
    </div>
  );
}
