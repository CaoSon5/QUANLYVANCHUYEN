// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { tripApi } from '../../api/tripApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/format';
import AssignTripModal from './AssignTripModal';
import ReassignTripModal from './ReassignTripModal';
import TripDetailModal from './TripDetailModal';
import TripPill from './TripPill';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import './trips.css';

// Điều phối viên: xem tài xế rảnh và đang ở đâu (FR23), phân tài xế đến kho (FR22), đổi hoặc hủy chuyến (FR24)
export default function DispatchPage() {
  const { role } = useAuth();
  const canManage = role === 'dispatcher' || role === 'admin';

  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [assignFor, setAssignFor] = useState(null);
  const [reassign, setReassign] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [d, t] = await Promise.all([tripApi.drivers(), tripApi.list({ status: 'active', page: 1, pageSize: 50 })]);
      setDrivers(d);
      setTrips(t);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 20000); // tự cập nhật để thấy tài xế đã đến kho hay chưa
    return () => clearInterval(timer);
  }, [load]);

  const done = (text) => {
    setAssignFor(null);
    setReassign(null);
    setMessage(text);
    load();
  };

  const cancel = async (trip) => {
    if (!window.confirm(`Hủy chuyến ${trip.code} của tài xế ${trip.driverName}?`)) return;
    setError('');
    try {
      await tripApi.cancel(trip.id);
      done(`Đã hủy chuyến ${trip.code}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const idleReady = drivers.filter((d) => d.isIdle && d.hasVehicle).length;

  return (
    <>
      <PageHeader title="Điều phối tài xế" subtitle="Phân tài xế rảnh đến kho nhận hàng và theo dõi các chuyến đang chạy." />

      <div className="grid grid-3 section">
        <StatCard index={0} label="Tài xế rảnh, sẵn sàng" value={idleReady} />
        <StatCard index={1} label="Tài xế đang chạy" value={drivers.filter((d) => !d.isIdle).length} />
        <StatCard index={2} label="Chuyến đang chạy" value={trips.total} />
      </div>

      {message && <div className="od-ok">{message}</div>}
      {error && <div className="acc-banner">{error}</div>}

      <div className="card acc-card section">
        <div className="card-title">Tài xế</div>
        <div className="card-sub">Tài xế rảnh xếp trước. Cần có biển số và tải trọng xe thì mới phân chuyến được (Admin cập nhật trong hồ sơ tài xế).</div>
        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 760 }}>
            <thead><tr><th>TÀI XẾ</th><th>XE</th><th>VỊ TRÍ</th><th>TRẠNG THÁI</th><th /></tr></thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td><b>{d.fullName}</b><div className="muted" style={{ fontSize: 13 }}>{d.phone}</div></td>
                  <td>
                    {d.hasVehicle
                      ? <>{d.vehiclePlate}<div className="muted" style={{ fontSize: 13 }}>Tải tối đa {d.capacityKg} kg</div></>
                      : <span className="chk-wait">Chưa có thông tin xe</span>}
                  </td>
                  <td>{d.location}</td>
                  <td>
                    {d.isIdle
                      ? <span className="st st-green">Rảnh</span>
                      : <><span className="st st-amber">Đang chạy</span><div className="muted" style={{ fontSize: 13 }}>{d.activeTripCode}</div></>}
                  </td>
                  <td>
                    {canManage && d.isIdle && (
                      <button className="btn btn-primary btn-sm" disabled={!d.hasVehicle} title={d.hasVehicle ? '' : 'Tài xế chưa có thông tin xe'} onClick={() => setAssignFor(d)}>
                        Phân chuyến
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && drivers.length === 0 && <div className="acc-empty">Chưa có tài xế nào. Admin tạo tài khoản vai trò Tài xế ở mục Tài khoản & phân quyền.</div>}
          {loading && <div className="acc-empty">Đang tải...</div>}
        </div>
      </div>

      <div className="card acc-card section">
        <div className="card-title">Chuyến đang chạy <span className="muted">({trips.total})</span></div>
        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 860 }}>
            <thead><tr><th>MÃ CHUYẾN</th><th>TÀI XẾ</th><th>TRẠNG THÁI</th><th>KHO</th><th>BAO TRÊN XE</th><th>TẠO LÚC</th><th /></tr></thead>
            <tbody>
              {trips.items.map((t) => {
                const empty = t.bundlesOnTruck + t.bundlesReceived + t.bundlesMissing === 0;
                const cancellable = t.status === 'assigned' || (t.status === 'at_warehouse' && empty);
                return (
                  <tr key={t.id}>
                    <td><button className="code-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setDetailId(t.id)}>{t.code}</button></td>
                    <td><b>{t.driverName}</b><div className="muted" style={{ fontSize: 13 }}>{t.vehiclePlate}</div></td>
                    <td><TripPill status={t.status} /></td>
                    <td>
                      {t.status === 'assigned' && <>Đến nhận hàng ở <b>{t.nextCode}</b></>}
                      {t.status === 'at_warehouse' && <>Đang ở <b>{t.currentCode}</b></>}
                      {t.status === 'in_transit' && <>Đang đến <b>{t.nextCode}</b></>}
                    </td>
                    <td>{t.bundlesOnTruck} bao · {t.loadKg}/{t.capacityKg} kg</td>
                    <td>{formatDateTime(t.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="act-btn" onClick={() => setDetailId(t.id)}>Xem</button>
                        {canManage && t.status === 'assigned' && <button className="act-btn" onClick={() => setReassign(t)}>Đổi</button>}
                        {canManage && cancellable && <button className="act-btn danger" onClick={() => cancel(t)}>Hủy</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && trips.items.length === 0 && <div className="acc-empty">Không có chuyến nào đang chạy.</div>}
        </div>
      </div>

      {assignFor && <AssignTripModal driver={assignFor} onClose={() => setAssignFor(null)} onSaved={done} />}
      {reassign && <ReassignTripModal trip={reassign} drivers={drivers} onClose={() => setReassign(null)} onSaved={done} />}
      {detailId && <TripDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}
