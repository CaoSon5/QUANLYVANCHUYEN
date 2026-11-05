// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Reports\
import StatCard from '../../components/common/StatCard';
import { reportApi } from '../../api/reportApi';
import { FAILURE_REASONS, ORDER_STATUS } from '../../config/orderStatus';
import { downloadCsv } from '../../utils/csv';
import { formatDateOnly } from '../../utils/format';
import OrderStatusPill from '../Orders/OrderStatusPill';
import useReport from './useReport';
import '../Accounts/accounts.css';
import './reports.css';

const pct = (v) => (v == null ? '—' : `${v}%`);

// FR13, FR15: số lượng đơn theo trạng thái và tỉ lệ giao thành công, thất bại, hoàn hàng
export default function OrderStatusReport({ range }) {
  const { data, loading, error } = useReport(
    () => reportApi.orders({ from: range.from, to: range.to }),
    [range.from, range.to],
  );

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`bao-cao-don-hang-${data.from}-${data.to}.csv`, [
      ['Trạng thái', 'Số đơn', 'Tỉ lệ (%)'],
      ...data.statuses.map((s) => [ORDER_STATUS[s.status]?.label ?? s.status, s.count, s.percent]),
      ['Tổng', data.totalOrders, 100],
      [],
      ['Chỉ số giao hàng', 'Giá trị'],
      ['Số đơn đã có kết quả giao', data.outcome.attempted],
      ['Tỉ lệ giao thành công (%)', data.outcome.successRate ?? ''],
      ['Tỉ lệ giao thất bại, chờ giao lại (%)', data.outcome.failedRate ?? ''],
      ['Tỉ lệ hoàn hàng (%)', data.outcome.returnRate ?? ''],
      ['Giao thành công ngay lần đầu (%)', data.outcome.firstTryRate ?? ''],
    ]);
  };

  const o = data?.outcome;

  return (
    <>
      {error && <div className="acc-banner">{error}</div>}

      <div className="grid grid-4 section">
        <StatCard index={0} label="Đơn tạo trong kỳ" value={data ? data.totalOrders : '—'} />
        <StatCard index={1} label="Tỉ lệ giao thành công" value={o ? pct(o.successRate) : '—'} />
        <StatCard index={2} label="Tỉ lệ giao thất bại" value={o ? pct(o.failedRate) : '—'} />
        <StatCard index={3} label="Tỉ lệ hoàn hàng" value={o ? pct(o.returnRate) : '—'} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Đơn theo trạng thái</div>
            <div className="card-sub">
              {data ? `Các đơn được tạo từ ${formatDateOnly(data.from)} đến ${formatDateOnly(data.to)}, theo trạng thái hiện tại` : 'Đang tải...'}
            </div>
          </div>
          <button className="btn" disabled={!data} onClick={exportCsv}>Xuất file CSV</button>
        </div>

        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 520 }}>
            <thead><tr><th>TRẠNG THÁI</th><th>SỐ ĐƠN</th><th>TỈ LỆ</th><th style={{ width: '35%' }} /></tr></thead>
            <tbody>
              {data?.statuses.map((s) => (
                <tr key={s.status}>
                  <td><OrderStatusPill status={s.status} /></td>
                  <td><b>{s.count}</b></td>
                  <td>{s.percent}%</td>
                  <td><div className="hbar"><span style={{ width: `${s.percent}%` }} /></div></td>
                </tr>
              ))}
              {data && (
                <tr className="total-row"><td>Tổng</td><td>{data.totalOrders}</td><td>100%</td><td /></tr>
              )}
            </tbody>
          </table>
          {loading && !data && <div className="acc-empty">Đang tải...</div>}
        </div>

        {o && (
          <div className="report-note">
            Tỉ lệ giao được tính trên <b>{o.attempted}</b> đơn đã có kết quả giao (giao thành công, giao thất bại, chờ hoàn, đã hoàn).
            Đơn còn đang vận chuyển hoặc đã hủy chưa có kết quả nên không tính.
            {o.delivered > 0 && <> Trong số đơn giao thành công, <b>{pct(o.firstTryRate)}</b> giao được ngay lần đầu.</>}
          </div>
        )}
      </div>

      <div className="card acc-card section">
        <div className="card-title">Lý do giao thất bại</div>
        <div className="card-sub">Lý do của lần thất bại gần nhất ở các đơn từng giao thất bại</div>
        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 420 }}>
            <thead><tr><th>LÝ DO</th><th>SỐ ĐƠN</th></tr></thead>
            <tbody>
              {data?.failureReasons.map((r) => (
                <tr key={r.reason}><td>{FAILURE_REASONS[r.reason] ?? r.reason}</td><td><b>{r.count}</b></td></tr>
              ))}
            </tbody>
          </table>
          {data && data.failureReasons.length === 0 && <div className="acc-empty">Không có đơn nào giao thất bại trong kỳ này.</div>}
        </div>
      </div>
    </>
  );
}
