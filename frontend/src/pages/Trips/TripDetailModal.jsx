// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import { tripApi } from '../../api/tripApi';
import { getErrorMessage } from '../../api/authApi';
import { formatDateTime } from '../../utils/format';
import BundlePill from '../Warehouses/BundlePill';
import CapacityBar from './CapacityBar';
import TripPill from './TripPill';
import '../Accounts/accounts.css';
import './trips.css';

// Chi tiết một chuyến: tài xế, xe, các điểm dừng, bao trên xe, thiếu thừa (FR20, FR25)
export default function TripDetailModal({ id, onClose }) {
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    tripApi.get(id).then(setTrip).catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (!trip) {
    return (
      <Modal title="Chuyến vận chuyển" onClose={onClose} wide>
        {error ? <div className="form-error">{error}</div> : <div className="acc-empty">Đang tải...</div>}
      </Modal>
    );
  }

  return (
    <Modal title={`Chuyến ${trip.code}`} onClose={onClose} wide>
      <div className="result-banner" style={{ marginTop: 0 }}>
        <TripPill status={trip.status} /><br />
        Tài xế: <b>{trip.driverName}</b> · {trip.driverPhone} · Xe <b>{trip.vehiclePlate}</b><br />
        Kho nhận hàng đầu tiên: <b>{trip.pickupCode}</b> · {trip.pickupName}
        {trip.currentCode && <><br />Kho gần nhất tài xế đã đến: <b>{trip.currentCode}</b></>}
        {trip.nextCode && <><br />Đang đi đến kho: <b>{trip.nextCode}</b> · {trip.nextName}</>}
        <br />Tạo lúc {formatDateTime(trip.createdAt)}
        {trip.startedAt && <> · Xuất phát lúc {formatDateTime(trip.startedAt)}</>}
        {trip.completedAt && <> · Hoàn thành lúc {formatDateTime(trip.completedAt)}</>}
        {trip.note && <><br />Ghi chú: {trip.note}</>}
      </div>

      <CapacityBar load={trip.loadKg} capacity={trip.capacityKg} />

      <div className="card-title" style={{ marginTop: 18 }}>Các điểm dừng</div>
      <div className="acc-scroll" style={{ margin: '8px 0 0' }}>
        <table className="data-table" style={{ minWidth: 560 }}>
          <thead><tr><th>#</th><th>KHO</th><th>ĐẾN LÚC</th><th>RỜI LÚC</th><th>CHỐT NHẬN HÀNG</th></tr></thead>
          <tbody>
            {trip.stops.map((s) => (
              <tr key={s.seq}>
                <td>{s.seq}</td>
                <td><b>{s.warehouseCode}</b><div className="muted" style={{ fontSize: 13 }}>{s.warehouseName}</div></td>
                <td>{formatDateTime(s.arrivedAt)}</td>
                <td>{s.departedAt ? formatDateTime(s.departedAt) : <span className="muted">—</span>}</td>
                <td>{s.receiveFinishedAt ? formatDateTime(s.receiveFinishedAt) : <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {trip.stops.length === 0 && <div className="acc-empty">Tài xế chưa đến kho nào.</div>}
      </div>

      <div className="card-title" style={{ marginTop: 18 }}>Bao hàng của chuyến</div>
      <div className="acc-scroll" style={{ margin: '8px 0 0' }}>
        <table className="data-table" style={{ minWidth: 640 }}>
          <thead><tr><th>MÃ BAO</th><th>LÊN XE TẠI</th><th>KHO ĐÍCH</th><th>ĐƠN</th><th>CÂN NẶNG</th><th>TRẠNG THÁI</th><th>NHẬN LÚC</th></tr></thead>
          <tbody>
            {trip.bundles.map((b) => (
              <tr key={b.id}>
                <td className="code-link">{b.code}</td>
                <td>{b.loadedAtCode || '—'}</td>
                <td><b>{b.destinationCode}</b><div className="muted" style={{ fontSize: 13 }}>{b.destinationName}</div></td>
                <td>{b.orderCount}</td>
                <td>{b.totalWeightKg} kg</td>
                <td><BundlePill status={b.status} /></td>
                <td>{b.receivedAt ? formatDateTime(b.receivedAt) : <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {trip.bundles.length === 0 && <div className="acc-empty">Chuyến chưa chở bao nào.</div>}
      </div>

      {trip.discrepancies.length > 0 && (
        <>
          <div className="card-title" style={{ marginTop: 18 }}>Thiếu, thừa khi đối chiếu</div>
          <div className="acc-scroll" style={{ margin: '8px 0 0' }}>
            <table className="data-table" style={{ minWidth: 640 }}>
              <thead><tr><th>LOẠI</th><th>KHO</th><th>MÃ BAO</th><th>GHI CHÚ</th><th>NGƯỜI BÁO</th><th>LÚC</th></tr></thead>
              <tbody>
                {trip.discrepancies.map((d) => (
                  <tr key={d.id}>
                    <td className={d.type === 'missing' ? 'chk-bad' : 'chk-wait'}>{d.type === 'missing' ? 'Thiếu' : 'Thừa'}</td>
                    <td>{d.warehouseCode}</td>
                    <td className="code-link">{d.bundleCode}</td>
                    <td>{d.note ?? <span className="muted">—</span>}</td>
                    <td>{d.reportedByName ?? '—'}</td>
                    <td>{formatDateTime(d.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="form-actions"><button className="btn" onClick={onClose}>Đóng</button></div>
    </Modal>
  );
}
