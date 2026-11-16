// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { tripApi } from '../../api/tripApi';
import { bundleApi } from '../../api/bundleApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/format';
import BundlePill from '../Warehouses/BundlePill';
import CapacityBar from './CapacityBar';
import ReportExtraModal from './ReportExtraModal';
import TripPill from './TripPill';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import './trips.css';

// Nhân viên kho xử lý một xe đang đỗ ở kho: nhận bao đi kho này (FR30, FR37, FR38), lên hàng (FR35, FR36)
export default function WarehouseTripHandling({ id }) {
  const { role } = useAuth();
  const receiveRef = useRef(null);
  const loadRef = useRef(null);

  const [trip, setTrip] = useState(null);
  const [sealed, setSealed] = useState([]);
  const [receiveCode, setReceiveCode] = useState('');
  const [loadCode, setLoadCode] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([tripApi.get(id), bundleApi.list({ status: 'sealed', page: 1, pageSize: 50 })]);
      setTrip(t);
      setSealed(s.items);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  const run = async (action, okText) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      setTrip(await action());
      if (okText) setMessage(okText);
      const s = await bundleApi.list({ status: 'sealed', page: 1, pageSize: 50 });
      setSealed(s.items);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const receive = async (e) => {
    e.preventDefault();
    const c = receiveCode.trim();
    if (!c) return;
    const ok = await run(() => tripApi.receive(id, c), `Đã nhận bao ${c.toUpperCase()}.`);
    if (ok) setReceiveCode('');
    receiveRef.current?.focus();
  };

  const loadBundle = async (code) => {
    const c = (code ?? loadCode).trim();
    if (!c) return;
    const ok = await run(() => tripApi.load(id, c), `Đã xếp bao ${c.toUpperCase()} lên xe.`);
    if (ok && !code) setLoadCode('');
    loadRef.current?.focus();
  };

  const finish = (waitingCount) => {
    const text = waitingCount > 0
      ? `Còn ${waitingCount} bao đi kho này chưa quét sẽ bị ghi nhận là THIẾU. Chốt nhận hàng?`
      : 'Chốt nhận hàng ở lần dừng này?';
    if (!window.confirm(text)) return;
    run(() => tripApi.finishReceiving(id, note.trim() || null), 'Đã chốt nhận hàng.');
  };

  const back = <Link className="wh-back" to={`/${role}/trips`}><ArrowLeft size={18} /> Xe & chuyến</Link>;

  if (!trip) {
    return <>{back}{error ? <div className="acc-banner">{error}</div> : <div className="acc-empty">Đang tải...</div>}</>;
  }

  const here = trip.currentCode;
  const atHere = trip.status === 'at_warehouse';
  const lastStop = trip.stops[trip.stops.length - 1];
  const arrivedAt = lastStop ? new Date(lastStop.arrivedAt).getTime() : 0;
  const expected = trip.bundles.filter((b) => b.destinationCode === here && b.loadedAtCode !== here);
  const waiting = expected.filter((b) => b.status === 'in_transit');
  const finished = Boolean(lastStop?.receiveFinishedAt);
  const loadedHere = trip.bundles.filter(
    (b) => b.status === 'in_transit' && b.loadedAtCode === here && b.loadedAt && new Date(b.loadedAt).getTime() >= arrivedAt,
  );

  return (
    <>
      {back}
      <PageHeader title={`Xe ${trip.vehiclePlate}`} subtitle={`Chuyến ${trip.code} · tài xế ${trip.driverName} (${trip.driverPhone})`} />

      {message && <div className="od-ok">{message}</div>}
      {error && <div className="acc-banner">{error}</div>}

      <div className="card section">
        <div className="trip-title"><TripPill status={trip.status} /><span className="muted">{atHere ? `Đang đỗ ở kho ${here}` : 'Xe không còn ở kho này'}</span></div>
        <CapacityBar load={trip.loadKg} capacity={trip.capacityKg} />
        {!atHere && <div className="od-alert" style={{ marginTop: 12 }}>Xe đã rời kho hoặc chưa đến kho này nên chưa thao tác được. Bên dưới là thông tin chuyến.</div>}
      </div>

      {atHere && (
        <div className="two-panel section">
          {/* ---- Nhận bao ---- */}
          <div className="card">
            <div className="card-title">Nhận bao đi kho này</div>
            <div className="card-sub">Quét (hoặc gõ) mã bao thả xuống kho này rồi bấm Enter. Bao đi kho khác phải để nguyên trên xe.</div>

            {!finished && (
              <form onSubmit={receive} className="track-box" style={{ marginTop: 14 }}>
                <input ref={receiveRef} className="form-input" placeholder="BAO26110400001" value={receiveCode} onChange={(e) => setReceiveCode(e.target.value)} autoComplete="off" />
                <button className="btn btn-primary" type="submit" disabled={busy}>Nhận bao</button>
              </form>
            )}

            <div className="acc-scroll" style={{ marginTop: 14 }}>
              <table className="data-table" style={{ minWidth: 380 }}>
                <thead><tr><th>MÃ BAO</th><th>TỪ KHO</th><th>CÂN NẶNG</th><th>TRẠNG THÁI</th></tr></thead>
                <tbody>
                  {expected.map((b) => (
                    <tr key={b.id}>
                      <td className="code-link">{b.code}</td>
                      <td>{b.loadedAtCode || '—'}</td>
                      <td>{b.totalWeightKg} kg</td>
                      <td><BundlePill status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {expected.length === 0 && <div className="acc-empty">Phiếu chuyển không có bao nào đi kho này.</div>}
            </div>

            <div className="trip-step">
              {finished
                ? <span className="chk-ok">Đã chốt nhận hàng lúc {formatDateTime(lastStop.receiveFinishedAt)}.</span>
                : waiting.length > 0
                  ? <span className="chk-wait">Còn {waiting.length} bao chưa nhận.</span>
                  : <span className="chk-ok">Đã nhận đủ các bao đi kho này.</span>}
            </div>

            {!finished && waiting.length > 0 && (
              <>
                <label className="form-label">Ghi chú khi chốt (ví dụ lý do thiếu)</label>
                <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
              </>
            )}
            <div className="trip-actions">
              {!finished && waiting.length > 0 && <button className="btn" style={{ color: '#b91c1c' }} disabled={busy} onClick={() => finish(waiting.length)}>Chốt nhận hàng (ghi nhận thiếu)</button>}
              <button className="btn" disabled={busy} onClick={() => setExtraOpen(true)}>Báo bao thừa</button>
            </div>
          </div>

          {/* ---- Lên hàng ---- */}
          <div className="card">
            <div className="card-title">Lên hàng</div>
            <div className="card-sub">Quét mã bao đã đóng để xếp lên xe. Xe còn trống <b>{trip.freeKg} kg</b>.</div>

            <form onSubmit={(e) => { e.preventDefault(); loadBundle(); }} className="track-box" style={{ marginTop: 14 }}>
              <input ref={loadRef} className="form-input" placeholder="BAO26110400001" value={loadCode} onChange={(e) => setLoadCode(e.target.value)} autoComplete="off" />
              <button className="btn btn-primary" type="submit" disabled={busy}>Lên xe</button>
            </form>

            <div className="card-title" style={{ marginTop: 18, fontSize: 15 }}>Bao đã đóng, chờ lên xe <span className="muted">({sealed.length})</span></div>
            <div className="acc-scroll" style={{ marginTop: 6 }}>
              <table className="data-table" style={{ minWidth: 380 }}>
                <thead><tr><th>MÃ BAO</th><th>KHO ĐÍCH</th><th>CÂN NẶNG</th><th /></tr></thead>
                <tbody>
                  {sealed.map((b) => {
                    const tooHeavy = b.totalWeightKg > trip.freeKg;
                    return (
                      <tr key={b.id}>
                        <td className="code-link">{b.code}</td>
                        <td><b>{b.destinationCode}</b></td>
                        <td>{b.totalWeightKg} kg</td>
                        <td>
                          <button className="act-btn" disabled={busy || tooHeavy} title={tooHeavy ? 'Xe không đủ chỗ cho bao này' : ''} onClick={() => loadBundle(b.code)}>
                            {tooHeavy ? 'Quá tải' : 'Lên xe'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {sealed.length === 0 && <div className="acc-empty">Kho không có bao nào đã đóng đang chờ.</div>}
            </div>

            {loadedHere.length > 0 && (
              <>
                <div className="card-title" style={{ marginTop: 18, fontSize: 15 }}>Vừa xếp lên xe tại kho này <span className="muted">({loadedHere.length})</span></div>
                <div className="acc-scroll" style={{ marginTop: 6 }}>
                  <table className="data-table" style={{ minWidth: 380 }}>
                    <thead><tr><th>MÃ BAO</th><th>KHO ĐÍCH</th><th>CÂN NẶNG</th><th /></tr></thead>
                    <tbody>
                      {loadedHere.map((b) => (
                        <tr key={b.id}>
                          <td className="code-link">{b.code}</td>
                          <td><b>{b.destinationCode}</b></td>
                          <td>{b.totalWeightKg} kg</td>
                          <td><button className="act-btn danger" disabled={busy} onClick={() => run(() => tripApi.unload(id, b.id), `Đã gỡ bao ${b.code} khỏi xe.`)}>Gỡ</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="form-hint">Gỡ được đến khi tài xế xuất phát khỏi kho.</div>
              </>
            )}
          </div>
        </div>
      )}

      {trip.discrepancies.length > 0 && (
        <div className="card acc-card section">
          <div className="card-title">Thiếu, thừa đã ghi nhận</div>
          <div className="acc-scroll">
            <table className="data-table" style={{ minWidth: 560 }}>
              <thead><tr><th>LOẠI</th><th>KHO</th><th>MÃ BAO</th><th>GHI CHÚ</th><th>LÚC</th></tr></thead>
              <tbody>
                {trip.discrepancies.map((d) => (
                  <tr key={d.id}>
                    <td className={d.type === 'missing' ? 'chk-bad' : 'chk-wait'}>{d.type === 'missing' ? 'Thiếu' : 'Thừa'}</td>
                    <td>{d.warehouseCode}</td>
                    <td className="code-link">{d.bundleCode}</td>
                    <td>{d.note ?? <span className="muted">—</span>}</td>
                    <td>{formatDateTime(d.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {extraOpen && (
        <ReportExtraModal
          tripId={trip.id}
          onClose={() => setExtraOpen(false)}
          onSaved={(updated, text) => { setTrip(updated); setExtraOpen(false); setMessage(text); }}
        />
      )}
    </>
  );
}
