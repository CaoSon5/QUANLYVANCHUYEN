// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { tripApi } from '../../api/tripApi';
import { getErrorMessage } from '../../api/authApi';
import { formatDateTime } from '../../utils/format';
import BundlePill from '../Warehouses/BundlePill';
import CapacityBar from './CapacityBar';
import TripPill from './TripPill';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import './trips.css';

// Tài xế: chuyến đang chạy. Xác nhận đến kho, xuất phát đến kho kế tiếp, hoàn thành chuyến (FR42 đến FR48)
export default function DriverTripPage() {
  const [trip, setTrip] = useState(undefined); // undefined: đang tải, null: chưa có chuyến
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setTrip(await tripApi.current());
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000); // tự cập nhật để thấy nhân viên kho đã nhận bao chưa
    return () => clearInterval(timer);
  }, [load]);

  const act = async (fn, okText) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const updated = await fn(trip.id);
      setTrip(updated.status === 'completed' ? null : updated);
      setMessage(okText);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (trip === undefined) {
    return <><PageHeader title="Chuyến hiện tại" subtitle="Đang tải..." />{error && <div className="acc-banner">{error}</div>}</>;
  }

  if (trip === null) {
    return (
      <>
        <PageHeader title="Chuyến hiện tại" subtitle="Bạn chưa có chuyến nào." />
        {message && <div className="od-ok">{message}</div>}
        {error && <div className="acc-banner">{error}</div>}
        <div className="trip-card" style={{ marginTop: 20 }}>
          <div className="trip-big">Bạn đang rảnh</div>
          <div className="trip-sub">Điều phối viên sẽ phân chuyến cho bạn. Khi có chuyến, trang này tự hiện kho bạn cần đến.</div>
        </div>
      </>
    );
  }

  const onTruck = trip.bundles.filter((b) => b.status === 'in_transit').sort((a, b) => a.loadSeq - b.loadSeq);
  const hereBundles = trip.bundles.filter((b) => b.destinationCode === trip.currentCode && b.loadedAtCode !== trip.currentCode);
  const nextPreview = onTruck[0];

  return (
    <>
      <PageHeader title="Chuyến hiện tại" subtitle={`Chuyến ${trip.code} · xe ${trip.vehiclePlate}`} />
      {message && <div className="od-ok">{message}</div>}
      {error && <div className="acc-banner">{error}</div>}

      <div className="trip-card" style={{ marginTop: 20 }}>
        <div className="trip-title"><TripPill status={trip.status} /><span className="muted">Tạo lúc {formatDateTime(trip.createdAt)}</span></div>

        {trip.status === 'assigned' && (
          <>
            <div className="trip-big">Đến kho {trip.nextCode} để nhận hàng</div>
            <div className="trip-sub">{trip.nextName}{trip.note && <><br />Ghi chú của điều phối viên: {trip.note}</>}</div>
            <div className="trip-actions">
              <button className="btn btn-primary" disabled={busy} onClick={() => act(tripApi.arrive, `Đã xác nhận đến kho ${trip.nextCode}. Nhân viên kho sẽ xếp bao lên xe.`)}>
                Tôi đã đến kho {trip.nextCode}
              </button>
            </div>
          </>
        )}

        {trip.status === 'at_warehouse' && (
          <>
            <div className="trip-big">Đang ở kho {trip.currentCode}</div>
            <div className="trip-sub">{trip.currentName}</div>

            {trip.awaitingHere > 0 ? (
              <div className="trip-step"><span className="chk-wait">Chờ nhân viên kho nhận {trip.awaitingHere} bao đi kho này.</span> Bạn chưa xuất phát được cho đến khi kho nhận xong hoặc chốt nhận hàng.</div>
            ) : onTruck.length > 0 ? (
              <div className="trip-step"><span className="chk-ok">Đã thả xong.</span> Trên xe còn {onTruck.length} bao. Kho kế tiếp: <b>{nextPreview.destinationCode}</b> · {nextPreview.destinationName}.</div>
            ) : trip.startedAt ? (
              <div className="trip-step"><span className="chk-ok">Xe đã hết bao.</span> Bạn có thể hoàn thành chuyến.</div>
            ) : (
              <div className="trip-step"><span className="chk-wait">Chờ nhân viên kho xếp bao lên xe.</span> Xếp xong bạn sẽ xuất phát được.</div>
            )}

            {hereBundles.length > 0 && (
              <div className="trip-step">
                Bao thả ở kho này:{' '}
                {hereBundles.map((b) => (
                  <span key={b.id} style={{ marginRight: 12 }}>{b.code} <BundlePill status={b.status} /></span>
                ))}
              </div>
            )}

            <div className="trip-actions">
              {trip.awaitingHere === 0 && onTruck.length > 0 && (
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => window.confirm(`Xác nhận đã thả và nhận đủ bao ở kho ${trip.currentCode}, xuất phát đến kho ${nextPreview.destinationCode}?`) && act(tripApi.depart, `Đã xuất phát đến kho ${nextPreview.destinationCode}.`)}
                >
                  Xuất phát đến kho {nextPreview.destinationCode}
                </button>
              )}
              {onTruck.length === 0 && trip.startedAt && (
                <button className="btn btn-primary" disabled={busy} onClick={() => act(tripApi.complete, 'Đã hoàn thành chuyến. Cảm ơn bạn!')}>
                  Hoàn thành chuyến
                </button>
              )}
            </div>
          </>
        )}

        {trip.status === 'in_transit' && (
          <>
            <div className="trip-big">Đang đến kho {trip.nextCode}</div>
            <div className="trip-sub">{trip.nextName}</div>
            <div className="trip-actions">
              <button className="btn btn-primary" disabled={busy} onClick={() => act(tripApi.arrive, `Đã xác nhận đến kho ${trip.nextCode}. Nhân viên kho sẽ nhận bao.`)}>
                Tôi đã đến kho {trip.nextCode}
              </button>
            </div>
          </>
        )}

        <CapacityBar load={trip.loadKg} capacity={trip.capacityKg} />
      </div>

      {onTruck.length > 0 && (
        <div className="card acc-card section">
          <div className="card-title">Bao đang trên xe <span className="muted">({onTruck.length})</span></div>
          <div className="card-sub">Xếp theo thứ tự lên xe, kho đến kế tiếp theo bao lên sớm nhất.</div>
          <div className="acc-scroll">
            <table className="data-table" style={{ minWidth: 520 }}>
              <thead><tr><th>THỨ TỰ</th><th>MÃ BAO</th><th>KHO ĐÍCH</th><th>CÂN NẶNG</th></tr></thead>
              <tbody>
                {onTruck.map((b) => (
                  <tr key={b.id}>
                    <td>{b.loadSeq}</td>
                    <td className="code-link">{b.code}</td>
                    <td><b>{b.destinationCode}</b><div className="muted" style={{ fontSize: 13 }}>{b.destinationName}</div></td>
                    <td>{b.totalWeightKg} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
