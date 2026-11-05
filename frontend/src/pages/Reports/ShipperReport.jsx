// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Reports\
import StatCard from '../../components/common/StatCard';
import { reportApi } from '../../api/reportApi';
import { downloadCsv } from '../../utils/csv';
import { formatDateOnly, formatShortMoney, formatVnd } from '../../utils/format';
import useReport from './useReport';
import '../Accounts/accounts.css';
import './reports.css';

// Màu tỉ lệ: từ 90% trở lên tốt, dưới 70% cần chú ý
const rateClass = (v) => (v == null ? '' : v >= 90 ? 'rate-good' : v < 70 ? 'rate-bad' : 'rate-mid');

// FR16: hiệu suất làm việc của từng shipper
export default function ShipperReport({ range }) {
  const { data, loading, error } = useReport(
    () => reportApi.shippers({ from: range.from, to: range.to }),
    [range.from, range.to],
  );

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`bao-cao-shipper-${data.from}-${data.to}.csv`, [
      ['Shipper', 'Số điện thoại', 'Kho', 'Đơn đã lấy', 'Giao thành công', 'Giao thất bại', 'Tỉ lệ thành công (%)', 'COD đã thu (đ)', 'Giờ giao trung bình'],
      ...data.shippers.map((s) => [s.fullName, s.phone, s.warehouseCode ?? '', s.pickups, s.delivered, s.failed, s.successRate ?? '', s.codCollected, s.averageDeliveryHours ?? '']),
    ]);
  };

  return (
    <>
      {error && <div className="acc-banner">{error}</div>}

      <div className="grid grid-4 section">
        <StatCard index={0} label="Đơn đã lấy hàng" value={data ? data.totalPickups : '—'} />
        <StatCard index={1} label="Giao thành công" value={data ? data.totalDelivered : '—'} />
        <StatCard index={2} label="Giao thất bại" value={data ? data.totalFailed : '—'} />
        <StatCard index={3} label="COD đã thu" value={data ? formatShortMoney(data.totalCod) : '—'} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Hiệu suất từng shipper</div>
            <div className="card-sub">
              {data ? `Từ ${formatDateOnly(data.from)} đến ${formatDateOnly(data.to)}, xếp theo số đơn giao thành công` : 'Đang tải...'}
            </div>
          </div>
          <button className="btn" disabled={!data} onClick={exportCsv}>Xuất file CSV</button>
        </div>

        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th>SHIPPER</th><th>KHO</th><th>ĐÃ LẤY</th><th>GIAO THÀNH CÔNG</th><th>GIAO THẤT BẠI</th>
                <th>TỈ LỆ THÀNH CÔNG</th><th>COD ĐÃ THU</th><th>GIỜ GIAO TB</th>
              </tr>
            </thead>
            <tbody>
              {data?.shippers.map((s) => (
                <tr key={s.shipperId}>
                  <td>
                    <b>{s.fullName}</b>{!s.isActive && <span className="muted"> (đã khóa)</span>}
                    <div className="muted" style={{ fontSize: 13 }}>{s.phone}</div>
                  </td>
                  <td>{s.warehouseCode ?? <span className="muted">—</span>}</td>
                  <td>{s.pickups}</td>
                  <td><b>{s.delivered}</b></td>
                  <td>{s.failed}</td>
                  <td className={rateClass(s.successRate)}>{s.successRate == null ? '—' : `${s.successRate}%`}</td>
                  <td>{s.codCollected > 0 ? formatVnd(s.codCollected) : <span className="muted">—</span>}</td>
                  <td>{s.averageDeliveryHours == null ? <span className="muted">—</span> : `${s.averageDeliveryHours} giờ`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.shippers.length === 0 && <div className="acc-empty">Chưa có shipper nào hoạt động trong kỳ này.</div>}
          {loading && !data && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="report-note">
          Số liệu đếm theo từng lần thao tác của shipper trong lịch sử đơn. Giờ giao trung bình tính từ lúc kho xuất hàng đến lúc giao thành công.
          Hiệu suất <b>tài xế</b> sẽ có khi hệ thống làm phần chuyến vận chuyển giữa các kho.
        </div>
      </div>
    </>
  );
}
