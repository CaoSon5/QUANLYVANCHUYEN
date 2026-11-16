// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { tripApi } from '../../api/tripApi';
import { getErrorMessage } from '../../api/authApi';
import { formatDateTime } from '../../utils/format';
import BundleList from '../Warehouses/BundleList';
import BundleDetailPage from '../Warehouses/BundleDetailPage';
import TripDetailModal from './TripDetailModal';
import TripPill, { TRIP_STATUS } from './TripPill';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import './trips.css';

const PAGE_SIZE = 10;

function TripsTab() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tripApi.list({ status: status || undefined, search: debouncedSearch || undefined, page, pageSize: PAGE_SIZE });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="card acc-card section">
      <div className="acc-head">
        <div className="acc-tools">
          <select className="acc-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Mọi trạng thái</option>
            <option value="active">Đang chạy (chưa xong)</option>
            {Object.entries(TRIP_STATUS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
          </select>
        </div>
        <div className="acc-search">
          <Search size={16} />
          <input placeholder="Tìm mã chuyến, tên tài xế hoặc mã bao..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {error && <div className="acc-banner">{error}</div>}

      <div className="acc-scroll">
        <table className="data-table" style={{ minWidth: 860 }}>
          <thead><tr><th>MÃ CHUYẾN</th><th>TÀI XẾ</th><th>TRẠNG THÁI</th><th>VỊ TRÍ</th><th>BAO</th><th>TẠO LÚC</th><th /></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td className="code-link">{t.code}</td>
                <td><b>{t.driverName}</b><div className="muted" style={{ fontSize: 13 }}>{t.vehiclePlate}</div></td>
                <td><TripPill status={t.status} /></td>
                <td>
                  {t.status === 'assigned' && <>Đến nhận hàng ở <b>{t.nextCode}</b></>}
                  {t.status === 'at_warehouse' && <>Đang ở <b>{t.currentCode}</b></>}
                  {t.status === 'in_transit' && <>Đang đến <b>{t.nextCode}</b></>}
                  {(t.status === 'completed' || t.status === 'cancelled') && <span className="muted">—</span>}
                </td>
                <td>
                  {t.bundlesOnTruck} trên xe · {t.bundlesReceived} đã nhận
                  {t.bundlesMissing > 0 && <span className="chk-bad"> · {t.bundlesMissing} thiếu</span>}
                </td>
                <td>{formatDateTime(t.createdAt)}</td>
                <td><button className="act-btn" onClick={() => setDetailId(t.id)}>Xem</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && !error && <div className="acc-empty">Không có chuyến nào khớp.</div>}
        {loading && items.length === 0 && <div className="acc-empty">Đang tải...</div>}
      </div>

      <div className="acc-foot">
        <span>Tổng <b>{total}</b> chuyến</span>
        <div className="acc-pager">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
          <span>Trang {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
        </div>
      </div>

      {detailId && <TripDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

// Theo dõi hành trình liên kho: các chuyến vận chuyển và bao hàng, tìm theo mã hoặc trạng thái (FR20, FR25)
export default function TripTrackingPage() {
  const [tab, setTab] = useState('trips');
  const [bundleId, setBundleId] = useState(null);

  return (
    <>
      <PageHeader title="Theo dõi hành trình" subtitle="Các chuyến vận chuyển liên kho và bao hàng đang trên đường." />

      <div className="card acc-card section" style={{ paddingBottom: 18 }}>
        <div className="acc-tools">
          <button className={`btn ${tab === 'trips' ? 'btn-primary' : ''}`} style={tab === 'trips' ? { boxShadow: 'none' } : undefined} onClick={() => { setTab('trips'); setBundleId(null); }}>Chuyến vận chuyển</button>
          <button className={`btn ${tab === 'bundles' ? 'btn-primary' : ''}`} style={tab === 'bundles' ? { boxShadow: 'none' } : undefined} onClick={() => setTab('bundles')}>Bao hàng</button>
        </div>
      </div>

      {tab === 'trips' && <TripsTab />}
      {tab === 'bundles' && (bundleId
        ? <BundleDetailPage id={bundleId} onBack={() => setBundleId(null)} />
        : <BundleList onOpen={setBundleId} />)}
    </>
  );
}
