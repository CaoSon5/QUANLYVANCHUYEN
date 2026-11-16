// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { tripApi } from '../../api/tripApi';
import { getErrorMessage } from '../../api/authApi';
import BundlePill from '../Warehouses/BundlePill';
import CapacityBar from './CapacityBar';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import './trips.css';

// Tài xế: các bao hàng của chuyến và bao đang trên xe
export default function DriverBundlesPage() {
  const [trip, setTrip] = useState(undefined);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setTrip(await tripApi.current());
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const bundles = trip?.bundles ?? [];
  const onTruck = bundles.filter((b) => b.status === 'in_transit');

  return (
    <>
      <PageHeader title="Bao hàng trên xe" subtitle={trip ? `Chuyến ${trip.code} · xe ${trip.vehiclePlate}` : 'Các bao đang chở trong chuyến của bạn.'} />

      <div className="grid grid-3 section">
        <StatCard index={0} label="Bao đang trên xe" value={trip ? onTruck.length : '—'} />
        <StatCard index={1} label="Tổng cân nặng đang chở" value={trip ? `${trip.loadKg} kg` : '—'} />
        <StatCard index={2} label="Đã giao tới kho đích" value={trip ? trip.bundlesReceived : '—'} />
      </div>

      {error && <div className="acc-banner">{error}</div>}

      <div className="card acc-card section">
        {trip && <CapacityBar load={trip.loadKg} capacity={trip.capacityKg} />}
        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 620 }}>
            <thead><tr><th>MÃ BAO</th><th>LÊN XE TẠI</th><th>KHO ĐÍCH</th><th>ĐƠN</th><th>CÂN NẶNG</th><th>TRẠNG THÁI</th></tr></thead>
            <tbody>
              {bundles.map((b) => (
                <tr key={b.id}>
                  <td className="code-link">{b.code}</td>
                  <td>{b.loadedAtCode || '—'}</td>
                  <td><b>{b.destinationCode}</b><div className="muted" style={{ fontSize: 13 }}>{b.destinationName}</div></td>
                  <td>{b.orderCount}</td>
                  <td>{b.totalWeightKg} kg</td>
                  <td><BundlePill status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {trip === null && <div className="acc-empty">Bạn chưa có chuyến nào.</div>}
          {trip && bundles.length === 0 && <div className="acc-empty">Chưa có bao nào lên xe. Nhân viên kho sẽ xếp bao khi bạn đến kho.</div>}
          {trip === undefined && !error && <div className="acc-empty">Đang tải...</div>}
        </div>
      </div>
    </>
  );
}
