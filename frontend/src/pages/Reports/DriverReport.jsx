// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Reports\
import StatCard from '../../components/common/StatCard';
import { reportApi } from '../../api/reportApi';
import { downloadCsv } from '../../utils/csv';
import { formatDateOnly } from '../../utils/format';
import useReport from './useReport';
import '../Accounts/accounts.css';
import './reports.css';

// FR16: hiệu suất làm việc của từng tài xế
export default function DriverReport({ range }) {
  const { data, loading, error } = useReport(
    () => reportApi.drivers({ from: range.from, to: range.to }),
    [range.from, range.to],
  );

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`bao-cao-tai-xe-${data.from}-${data.to}.csv`, [
      ['Tài xế', 'Số điện thoại', 'Biển số xe', 'Tải trọng (kg)', 'Chuyến hoàn thành', 'Chuyến đang chạy', 'Bao đã giao', 'Cân nặng đã giao (kg)', 'Bao thất lạc', 'Giờ chạy trung bình'],
      ...data.drivers.map((d) => [d.fullName, d.phone, d.vehiclePlate ?? '', d.capacityKg ?? '', d.tripsCompleted, d.tripsInProgress, d.bundlesDelivered, d.weightDeliveredKg, d.bundlesMissing, d.averageTripHours ?? '']),
    ]);
  };

  return (
    <>
      {error && <div className="acc-banner">{error}</div>}

      <div className="grid grid-4 section">
        <StatCard index={0} label="Chuyến hoàn thành" value={data ? data.totalTrips : '—'} />
        <StatCard index={1} label="Bao đã giao tới kho đích" value={data ? data.totalBundles : '—'} />
        <StatCard index={2} label="Cân nặng đã chở" value={data ? `${data.totalWeightKg} kg` : '—'} />
        <StatCard index={3} label="Bao thất lạc" value={data ? data.totalMissing : '—'} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Hiệu suất từng tài xế</div>
            <div className="card-sub">
              {data ? `Chuyến hoàn thành từ ${formatDateOnly(data.from)} đến ${formatDateOnly(data.to)}, xếp theo số chuyến` : 'Đang tải...'}
            </div>
          </div>
          <button className="btn" disabled={!data} onClick={exportCsv}>Xuất file CSV</button>
        </div>

        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>TÀI XẾ</th><th>XE</th><th>CHUYẾN XONG</th><th>ĐANG CHẠY</th><th>BAO ĐÃ GIAO</th>
                <th>CÂN NẶNG</th><th>BAO THẤT LẠC</th><th>GIỜ CHẠY TB</th>
              </tr>
            </thead>
            <tbody>
              {data?.drivers.map((d) => (
                <tr key={d.driverId}>
                  <td><b>{d.fullName}</b>{!d.isActive && <span className="muted"> (đã khóa)</span>}<div className="muted" style={{ fontSize: 13 }}>{d.phone}</div></td>
                  <td>{d.vehiclePlate ? <>{d.vehiclePlate}<div className="muted" style={{ fontSize: 13 }}>{d.capacityKg} kg</div></> : <span className="muted">Chưa có</span>}</td>
                  <td><b>{d.tripsCompleted}</b></td>
                  <td>{d.tripsInProgress}</td>
                  <td>{d.bundlesDelivered}</td>
                  <td>{d.weightDeliveredKg} kg</td>
                  <td className={d.bundlesMissing > 0 ? 'rate-bad' : ''}>{d.bundlesMissing}</td>
                  <td>{d.averageTripHours == null ? <span className="muted">—</span> : `${d.averageTripHours} giờ`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.drivers.length === 0 && <div className="acc-empty">Chưa có tài xế nào. Tạo tài khoản vai trò Tài xế ở mục Tài khoản & phân quyền.</div>}
          {loading && !data && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="report-note">
          Chỉ tính các chuyến đã hoàn thành trong khoảng ngày chọn (bao đã được kho đích nhận). Giờ chạy trung bình tính từ lúc xuất phát đến lúc hoàn thành chuyến.
        </div>
      </div>
    </>
  );
}
