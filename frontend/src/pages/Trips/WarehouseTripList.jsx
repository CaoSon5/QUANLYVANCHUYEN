// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { tripApi } from '../../api/tripApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import CapacityBar from './CapacityBar';
import TripPill from './TripPill';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import './trips.css';

// Nhân viên kho: xe đang ở kho mình (xử lý nhận bao, lên hàng) và xe đang đến
export default function WarehouseTripList() {
  const { role, user } = useAuth();
  const [data, setData] = useState({ atWarehouse: [], incoming: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await tripApi.forWarehouse());
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000); // tự cập nhật để thấy xe vừa đến
    return () => clearInterval(timer);
  }, [load]);

  return (
    <>
      <PageHeader
        title="Xe & chuyến"
        subtitle={user?.warehouseCode
          ? `Xe vận chuyển đang ở hoặc đang đến kho ${user.warehouseCode} - ${user.warehouseName}.`
          : 'Xe vận chuyển đang ở hoặc đang đến kho của bạn.'}
      />

      <div className="grid grid-3 section">
        <StatCard index={0} label="Xe đang ở kho" value={data.atWarehouse.length} />
        <StatCard index={1} label="Xe đang đến kho" value={data.incoming.length} />
      </div>

      {error && <div className="acc-banner">{error}</div>}

      <div className="card section">
        <div className="card-title">Xe đang ở kho</div>
        <div className="card-sub">Bấm "Xử lý xe" để nhận bao đi kho này hoặc xếp bao lên xe.</div>
        {!loading && data.atWarehouse.length === 0 && <div className="acc-empty">Hiện không có xe nào đang đỗ ở kho của bạn.</div>}
        <div className="trip-grid">
          {data.atWarehouse.map((t) => (
            <div className="trip-card" key={t.id}>
              <div className="trip-title"><b>{t.code}</b><TripPill status={t.status} /></div>
              <div className="trip-big" style={{ fontSize: 18 }}>{t.vehiclePlate}</div>
              <div className="trip-sub">Tài xế {t.driverName} · {t.driverPhone}</div>
              <CapacityBar load={t.loadKg} capacity={t.capacityKg} />
              <div className="trip-sub" style={{ marginTop: 8 }}>
                {t.awaitingHere > 0
                  ? <span className="chk-wait">Chờ nhận {t.awaitingHere} bao đi kho này</span>
                  : <span className="chk-ok">Không có bao nào chờ nhận</span>}
                {' · '}Trên xe {t.bundlesOnTruck} bao
              </div>
              <div className="trip-actions">
                <Link className="btn btn-primary" to={`/${role}/trips/${t.id}`}>Xử lý xe</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card acc-card section">
        <div className="card-title">Xe đang đến kho</div>
        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 560 }}>
            <thead><tr><th>MÃ CHUYẾN</th><th>TÀI XẾ</th><th>TÌNH TRẠNG</th><th>BAO TRÊN XE</th></tr></thead>
            <tbody>
              {data.incoming.map((t) => (
                <tr key={t.id}>
                  <td className="code-link">{t.code}</td>
                  <td><b>{t.driverName}</b><div className="muted" style={{ fontSize: 13 }}>{t.vehiclePlate}</div></td>
                  <td>{t.status === 'assigned' ? 'Tài xế đang đến kho này để nhận hàng' : 'Đang trên đường đến kho này'}</td>
                  <td>{t.bundlesOnTruck} bao · {t.loadKg} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && data.incoming.length === 0 && <div className="acc-empty">Không có xe nào đang trên đường đến kho này.</div>}
        </div>
      </div>
    </>
  );
}
