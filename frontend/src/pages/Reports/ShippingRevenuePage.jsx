// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Reports\
import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { reportApi } from '../../api/reportApi';
import { getErrorMessage } from '../../api/authApi';
import { formatDateOnly, formatShortMoney, formatVnd } from '../../utils/format';
import RevenueBars from './RevenueBars';
import '../Accounts/accounts.css';
import './reports.css';

const GRANULARITIES = [
  { key: 'day', label: 'Theo ngày' },
  { key: 'month', label: 'Theo tháng' },
  { key: 'year', label: 'Theo năm' },
];

const pad = (n) => String(n).padStart(2, '0');
const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoMonth = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

// Khoảng thời gian mặc định: 30 ngày, 12 tháng hoặc 5 năm gần nhất
function defaultRange(g) {
  const now = new Date();
  if (g === 'month') return { from: isoMonth(new Date(now.getFullYear(), now.getMonth() - 11, 1)), to: isoMonth(now) };
  if (g === 'year') return { from: String(now.getFullYear() - 4), to: String(now.getFullYear()) };
  return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)), to: isoDay(now) };
}

// Giá trị ô nhập -> ngày gửi lên máy chủ (yyyy-MM-dd)
function toApiDate(g, value) {
  if (g === 'month') return `${value}-01`;
  if (g === 'year') return `${value}-01-01`;
  return value;
}

// Báo cáo doanh thu phí vận chuyển theo ngày, tháng, năm (FR14)
export default function ShippingRevenuePage() {
  const [granularity, setGranularity] = useState('day');
  const [range, setRange] = useState(defaultRange('day'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!range.from || !range.to) return undefined;
    if (range.to < range.from) {
      setError('Ngày kết thúc phải sau ngày bắt đầu');
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    reportApi
      .shippingRevenue({ granularity, from: toApiDate(granularity, range.from), to: toApiDate(granularity, range.to) })
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [granularity, range]);

  const switchGranularity = (g) => {
    setGranularity(g);
    setRange(defaultRange(g));
  };

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => String(thisYear - i));

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Kỳ', 'Số đơn giao thành công', 'Doanh thu phí vận chuyển (đ)', 'COD đã thu (đ)'],
      ...data.buckets.map((b) => [b.label, b.orderCount, b.revenue, b.codCollected]),
      ['Tổng', data.totalOrders, data.totalRevenue, data.totalCod],
    ];
    // BOM giúp Excel đọc đúng tiếng Việt
    const csv = `\uFEFF${rows.map((r) => r.join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `doanh-thu-phi-${granularity}-${data.from}-${data.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const change = data?.changePercent;
  const changeText = change == null ? '—' : `${change > 0 ? '▲ ' : change < 0 ? '▼ ' : ''}${Math.abs(change)}%`;

  return (
    <>
      <PageHeader
        title="Báo cáo doanh thu"
        subtitle="Doanh thu phí vận chuyển theo ngày, tháng, năm. Chỉ tính các đơn giao thành công."
      />

      <div className="card acc-card section">
        <div className="report-controls">
          <div className="acc-tools">
            {GRANULARITIES.map((g) => (
              <button
                key={g.key}
                className={`btn ${granularity === g.key ? 'btn-primary' : ''}`}
                style={granularity === g.key ? { boxShadow: 'none' } : undefined}
                onClick={() => switchGranularity(g.key)}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div>
            <label>{granularity === 'year' ? 'Từ năm' : granularity === 'month' ? 'Từ tháng' : 'Từ ngày'}</label>
            {granularity === 'year' ? (
              <select className="acc-select" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            ) : (
              <input className="acc-select" type={granularity === 'month' ? 'month' : 'date'} value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
            )}
          </div>
          <div>
            <label>{granularity === 'year' ? 'Đến năm' : granularity === 'month' ? 'Đến tháng' : 'Đến ngày'}</label>
            {granularity === 'year' ? (
              <select className="acc-select" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            ) : (
              <input className="acc-select" type={granularity === 'month' ? 'month' : 'date'} value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
            )}
          </div>

          <button className="btn" style={{ marginLeft: 'auto' }} disabled={!data} onClick={exportCsv}>Xuất file CSV</button>
        </div>
        {error && <div className="acc-banner">{error}</div>}
      </div>

      <div className="grid grid-4 section">
        <StatCard index={0} label="Tổng doanh thu phí" value={data ? formatShortMoney(data.totalRevenue) : '—'} />
        <StatCard index={1} label="Đơn giao thành công" value={data ? data.totalOrders : '—'} />
        <StatCard index={2} label="Phí trung bình mỗi đơn" value={data ? formatVnd(data.averageFee) : '—'} />
        <StatCard index={3} label="So với kỳ trước" value={data ? changeText : '—'} />
      </div>

      <div className="card acc-card section">
        <div className="card-title">Biểu đồ doanh thu</div>
        <div className="card-sub">
          {data
            ? `Từ ${formatDateOnly(data.from)} đến ${formatDateOnly(data.to)}. Kỳ liền trước cùng độ dài: ${formatVnd(data.previousRevenue)} (${data.previousOrders} đơn).`
            : 'Đang tải...'}
        </div>

        {data && <RevenueBars buckets={data.buckets} />}

        {data && (
          <div className="acc-scroll" style={{ marginTop: 8 }}>
            <table className="data-table" style={{ minWidth: 520 }}>
              <thead>
                <tr><th>KỲ</th><th>SỐ ĐƠN GIAO THÀNH CÔNG</th><th>DOANH THU PHÍ VẬN CHUYỂN</th><th>COD ĐÃ THU</th></tr>
              </thead>
              <tbody>
                {data.buckets.map((b) => (
                  <tr key={b.key}>
                    <td>{b.label}</td>
                    <td>{b.orderCount}</td>
                    <td>{b.revenue > 0 ? <b>{formatVnd(b.revenue)}</b> : <span className="muted">—</span>}</td>
                    <td>{b.codCollected > 0 ? formatVnd(b.codCollected) : <span className="muted">—</span>}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>Tổng</td><td>{data.totalOrders}</td><td>{formatVnd(data.totalRevenue)}</td><td>{formatVnd(data.totalCod)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {loading && !data && <div className="acc-empty">Đang tải...</div>}

        <div className="report-note">
          Doanh thu = tổng phí vận chuyển của các đơn <b>giao thành công</b>, tính theo ngày giao (giờ Việt Nam).
          Đơn đang vận chuyển, giao thất bại hoặc đã hủy chưa được tính.
        </div>
      </div>
    </>
  );
}
