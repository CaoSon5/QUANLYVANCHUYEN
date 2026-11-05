// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Reports\
import StatCard from '../../components/common/StatCard';
import { reportApi } from '../../api/reportApi';
import { downloadCsv } from '../../utils/csv';
import { formatDateTime } from '../../utils/format';
import useReport from './useReport';
import '../Accounts/accounts.css';
import './reports.css';

// FR17: tồn kho theo từng kho, tại thời điểm xem
export default function InventoryReport() {
  const { data, loading, error, reload } = useReport(() => reportApi.inventory(), []);

  const exportCsv = () => {
    if (!data) return;
    downloadCsv('bao-cao-ton-kho.csv', [
      ['Mã kho', 'Tên kho', 'Loại', 'Đang về kho', 'Đã nhập kho', 'Chờ xuất', 'Chờ giao lại', 'Chờ hoàn', 'Tổng đơn', 'Tổng kiện', 'Quá 48 giờ', 'Giờ lưu trung bình'],
      ...data.warehouses.map((w) => [w.code, w.name, w.type === 'regional' ? 'Kho vùng' : 'Kho địa phương', w.incoming, w.inStock, w.awaitingDispatch, w.retry, w.returning, w.totalOrders, w.pieces, w.stale48h, w.averageStorageHours ?? '']),
    ]);
  };

  return (
    <>
      {error && <div className="acc-banner">{error}</div>}

      <div className="grid grid-4 section">
        <StatCard index={0} label="Đơn đang nằm trong kho" value={data ? data.totalOrders : '—'} />
        <StatCard index={1} label="Lưu quá 48 giờ" value={data ? data.totalStale : '—'} />
        <StatCard index={2} label="Đang trên đường về kho" value={data ? data.totalIncoming : '—'} />
        <StatCard index={3} label="Chờ xuất cho shipper" value={data ? data.totalAwaitingDispatch : '—'} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Tồn kho theo từng kho</div>
            <div className="card-sub">{data ? `Cập nhật lúc ${formatDateTime(data.generatedAt)}` : 'Đang tải...'}</div>
          </div>
          <div className="acc-tools">
            <button className="btn" onClick={reload} disabled={loading}>{loading ? 'Đang tải...' : 'Làm mới'}</button>
            <button className="btn" disabled={!data} onClick={exportCsv}>Xuất file CSV</button>
          </div>
        </div>

        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>KHO</th><th>ĐANG VỀ KHO</th><th>ĐÃ NHẬP KHO</th><th>CHỜ XUẤT</th><th>CHỜ GIAO LẠI</th>
                <th>CHỜ HOÀN</th><th>TỔNG ĐƠN</th><th>TỔNG KIỆN</th><th>QUÁ 48 GIỜ</th><th>GIỜ LƯU TB</th>
              </tr>
            </thead>
            <tbody>
              {data?.warehouses.map((w) => (
                <tr key={w.id}>
                  <td>
                    <b>{w.code}</b>{!w.isActive && <span className="muted"> (đã ngừng)</span>}
                    <div className="muted" style={{ fontSize: 13 }}>{w.name} · {w.type === 'regional' ? 'Kho vùng' : 'Kho địa phương'}</div>
                  </td>
                  <td>{w.incoming}</td>
                  <td>{w.inStock}</td>
                  <td>{w.awaitingDispatch}</td>
                  <td>{w.retry}</td>
                  <td>{w.returning}</td>
                  <td><b>{w.totalOrders}</b></td>
                  <td>{w.pieces}</td>
                  <td className={w.stale48h > 0 ? 'rate-bad' : ''}>{w.stale48h}</td>
                  <td>{w.averageStorageHours == null ? <span className="muted">—</span> : `${w.averageStorageHours} giờ`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.warehouses.length === 0 && <div className="acc-empty">Chưa có kho nào.</div>}
          {loading && !data && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="report-note">
          "Đang về kho" là đơn shipper đã lấy hàng nhưng kho chưa nhập. "Quá 48 giờ" tính từ lúc nhập kho. Số liệu là ảnh chụp tại thời điểm xem, không phụ thuộc khoảng ngày.
        </div>
      </div>
    </>
  );
}
