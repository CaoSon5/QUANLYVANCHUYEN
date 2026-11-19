// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\WarehouseOps\
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { warehouseApi } from '../../api/warehouseApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import '../Warehouses/warehouses.css';

const TYPE_LABEL = { regional: 'Kho vùng', local: 'Kho địa phương' };

const InfoItem = ({ label, children, wide }) => (
  <div style={wide ? { gridColumn: '1 / -1' } : undefined}>
    <div className="trk-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
    <div style={{ marginTop: 3, fontWeight: 600 }}>{children}</div>
  </div>
);

const Pill = ({ ok, children }) => <span className={`pill ${ok ? 'pill-ok' : 'pill-off'}`}>{children}</span>;

// Nhân viên kho: tổng quan bưu cục mình được gán (chỉ đọc). Thông tin kho và nhân sự do Admin quản lý.
export default function PostOfficePage() {
  const { role, user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await warehouseApi.mine());
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  if (!data) {
    return (
      <>
        <PageHeader title="Quản lý bưu cục" subtitle="Tổng quan bưu cục của bạn." />
        {error ? <div className="acc-banner">{error}</div> : <div className="acc-empty">Đang tải...</div>}
      </>
    );
  }

  const d = data.detail;
  const w = d.warehouse;
  const isLocal = w.type === 'local';
  const loadOf = (id) => data.shipperLoads.find((l) => l.shipperId === id) ?? { pickupsPending: 0, deliveriesPending: 0, outForDelivery: 0 };

  // Việc cần xử lý: urgent = có số khác 0 thì cần chú ý ngay
  const tasks = [
    { label: 'Đơn đang về kho, chờ nhập kho', count: d.incoming, to: 'inbound', urgent: true },
    { label: 'Đơn shipper đã nhận giao, chờ xuất hàng', count: d.awaitingDispatch, to: 'outbound', urgent: true },
    { label: 'Hàng hoàn chờ bàn giao cho người bán', count: data.returnsPending, to: 'returns', urgent: true },
    { label: 'Bao đã đóng, chờ lên xe', count: data.bundlesSealed, to: 'bundles', urgent: true },
    { label: 'Bao đã đến kho, chờ mở', count: data.bundlesReceived, to: 'bundles', urgent: true },
    { label: 'Xe đang đỗ ở kho, chờ xử lý', count: data.tripsAtWarehouse, to: 'trips', urgent: true },
    { label: 'Đơn lưu quá 48 giờ', count: d.stale48h, to: 'inventory', urgent: true },
    { label: 'Bao đang gộp', count: data.bundlesOpen, to: 'bundles' },
    { label: 'Xe đang trên đường đến kho', count: data.tripsIncoming, to: 'trips' },
  ];
  const pending = tasks.filter((t) => t.urgent).reduce((sum, t) => sum + t.count, 0);

  return (
    <>
      <PageHeader title="Quản lý bưu cục" subtitle={`Tổng quan kho ${w.code} - ${w.name} của bạn.`} />
      {error && <div className="acc-banner">{error}</div>}

      <div className="card section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="wh-code">{w.code}</span>
          <h2 style={{ margin: 0, fontSize: 22 }}>{w.name}</h2>
          <Pill ok={w.isActive}>{w.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</Pill>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px 24px', marginTop: 18 }}>
          <InfoItem label="Loại kho"><span className={`pill ${isLocal ? 'pill-local' : 'pill-regional'}`}>{TYPE_LABEL[w.type] ?? w.type}</span></InfoItem>
          {isLocal && <InfoItem label="Kho vùng quản lý">{w.parentCode ? `${w.parentCode} - ${w.parentName}` : '—'}</InfoItem>}
          <InfoItem label="Nhân viên kho">{w.staffCount}</InfoItem>
          {isLocal && <InfoItem label="Shipper phụ trách">{w.shipperCount}</InfoItem>}
          <InfoItem label="Địa chỉ" wide>{w.address}</InfoItem>
        </div>
        <div className="form-hint" style={{ marginTop: 14 }}>Thông tin kho và nhân sự do Admin quản lý. Cần thay đổi, hãy liên hệ Admin.</div>
      </div>

      <div className="grid grid-4 section">
        <StatCard index={0} label="Tồn kho hiện tại" value={d.stockCount} showTrend={false} />
        <StatCard index={1} label="Nhập kho hôm nay" value={data.receivedToday} showTrend={false} />
        <StatCard index={2} label="Xuất kho hôm nay" value={data.dispatchedToday} showTrend={false} />
        <StatCard index={3} label="Lưu quá 48 giờ" value={d.stale48h} showTrend={false} />
      </div>

      <div className="card acc-card section">
        <div className="card-title">Việc cần xử lý</div>
        <div className="card-sub">
          {pending > 0 ? `Có ${pending} việc đang chờ bạn xử lý.` : 'Không có việc nào tồn đọng. Mọi thứ ở kho đang được xử lý đúng hạn.'}
        </div>
        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 480 }}>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.label}>
                  <td>{t.label}</td>
                  <td style={{ width: 90 }}>
                    <b className={t.urgent && t.count > 0 ? 'rate-bad' : t.count > 0 ? 'rate-mid' : ''} style={t.count === 0 ? { color: 'var(--muted)', fontWeight: 600 } : undefined}>{t.count}</b>
                  </td>
                  <td style={{ width: 90 }}>
                    <Link className="act-btn" to={`/${role}/${t.to}`}>Mở</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isLocal ? (
        <div className="card acc-card section">
          <div className="card-title">Shipper phụ trách <span className="muted">({d.shippers.length})</span></div>
          <div className="card-sub">Khối lượng việc đang có của từng shipper trong kho.</div>
          <div className="acc-scroll">
            <table className="data-table" style={{ minWidth: 700 }}>
              <thead><tr><th>SHIPPER</th><th>TRẠNG THÁI</th><th>ĐÃ NHẬN, ĐI LẤY HÀNG</th><th>ĐÃ NHẬN GIAO, CHỜ XUẤT</th><th>ĐANG GIAO</th></tr></thead>
              <tbody>
                {d.shippers.map((m) => {
                  const l = loadOf(m.id);
                  return (
                    <tr key={m.id} className={m.isActive ? '' : 'row-locked'}>
                      <td><b>{m.fullName}</b><div className="muted" style={{ fontSize: 13 }}>{m.email} · {m.phone}</div></td>
                      <td><Pill ok={m.isActive}>{m.isActive ? 'Hoạt động' : 'Đã khóa'}</Pill></td>
                      <td>{l.pickupsPending}</td>
                      <td>{l.deliveriesPending}</td>
                      <td>{l.outForDelivery}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {d.shippers.length === 0 && <div className="acc-empty">Kho chưa có shipper nào. Liên hệ Admin để gán shipper.</div>}
          </div>
        </div>
      ) : (
        <div className="card acc-card section">
          <div className="card-title">Kho địa phương trực thuộc <span className="muted">({d.children.length})</span></div>
          <div className="acc-scroll">
            <table className="data-table" style={{ minWidth: 420 }}>
              <thead><tr><th>MÃ KHO</th><th>TÊN KHO</th><th>TRẠNG THÁI</th></tr></thead>
              <tbody>
                {d.children.map((c) => (
                  <tr key={c.id} className={c.isActive ? '' : 'row-locked'}>
                    <td><b>{c.code}</b></td>
                    <td>{c.name}</td>
                    <td><Pill ok={c.isActive}>{c.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {d.children.length === 0 && <div className="acc-empty">Chưa có kho địa phương nào trực thuộc kho vùng này.</div>}
          </div>
        </div>
      )}

      <div className="card acc-card section">
        <div className="card-title">Nhân viên kho <span className="muted">({d.staff.length})</span></div>
        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 520 }}>
            <thead><tr><th>NHÂN VIÊN</th><th>LIÊN HỆ</th><th>TRẠNG THÁI</th></tr></thead>
            <tbody>
              {d.staff.map((m) => (
                <tr key={m.id} className={m.isActive ? '' : 'row-locked'}>
                  <td><b>{m.fullName}</b>{m.id === user?.id && <span className="muted"> (bạn)</span>}</td>
                  <td>{m.email}<div className="muted" style={{ fontSize: 13 }}>{m.phone}</div></td>
                  <td><Pill ok={m.isActive}>{m.isActive ? 'Hoạt động' : 'Đã khóa'}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
