// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { tripApi } from '../../api/tripApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/format';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import './trips.css';

const KIND = {
  order_pickup: 'Đơn chờ shipper lấy hàng',
  order_delivery: 'Đơn chờ shipper nhận giao',
  bundle: 'Bao chưa lên xe',
  trip: 'Tài xế chưa đến kho',
};

const hoursSince = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000));

// FR26: các đơn, bao, chuyến chờ quá lâu mà chưa ai nhận
export default function DelayAlertsPage() {
  const { role } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await tripApi.stale());
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  const count = (kind) => data?.items.filter((i) => i.kind === kind).length ?? 0;
  const threshold = {
    order_pickup: data?.pendingPickupHours,
    order_delivery: data?.unclaimedDeliveryHours,
    bundle: data?.unloadedBundleHours,
    trip: data?.assignedTripHours,
  };

  return (
    <>
      <PageHeader title="Cảnh báo chậm nhận" subtitle="Những việc chờ quá lâu mà chưa có shipper hoặc tài xế nhận. Bấm vào đơn để phân công thủ công." />

      <div className="grid grid-4 section">
        <StatCard index={0} label="Đơn chờ lấy hàng" value={data ? count('order_pickup') : '—'} />
        <StatCard index={1} label="Đơn chờ giao" value={data ? count('order_delivery') : '—'} />
        <StatCard index={2} label="Bao chưa lên xe" value={data ? count('bundle') : '—'} />
        <StatCard index={3} label="Tài xế chưa đến kho" value={data ? count('trip') : '—'} />
      </div>

      {error && <div className="acc-banner">{error}</div>}

      <div className="card acc-card section">
        <div className="card-title">Việc đang chờ lâu</div>
        {data && (
          <div className="card-sub">
            Ngưỡng cảnh báo: đơn chờ lấy {data.pendingPickupHours} giờ, đơn chờ giao {data.unclaimedDeliveryHours} giờ,
            bao chưa lên xe {data.unloadedBundleHours} giờ, tài xế chưa đến kho {data.assignedTripHours} giờ. Lâu nhất xếp trước.
          </div>
        )}

        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 760 }}>
            <thead><tr><th>LOẠI</th><th>MÃ</th><th>NỘI DUNG</th><th>KHO</th><th>CHỜ TỪ</th><th /></tr></thead>
            <tbody>
              {data?.items.map((i) => (
                <tr key={`${i.kind}-${i.id}`}>
                  <td>{KIND[i.kind] ?? i.kind}</td>
                  <td className="code-link">{i.code}</td>
                  <td>{i.text}</td>
                  <td>{i.warehouseCode ?? <span className="muted">—</span>}</td>
                  <td>
                    <b className={hoursSince(i.since) >= (threshold[i.kind] ?? 0) * 3 ? 'chk-bad' : 'chk-wait'}>{hoursSince(i.since)} giờ</b>
                    <div className="muted" style={{ fontSize: 12 }}>{formatDateTime(i.since)}</div>
                  </td>
                  <td>
                    {(i.kind === 'order_pickup' || i.kind === 'order_delivery') && (
                      <Link className="btn btn-sm" to={`/${role}/orders/${i.id}`}>Xem và phân công</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.items.length === 0 && <div className="acc-empty">Không có việc nào chờ quá lâu. Mọi thứ đang được xử lý đúng hạn.</div>}
          {!data && !error && <div className="acc-empty">Đang tải...</div>}
        </div>
      </div>
    </>
  );
}
