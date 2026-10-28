// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Deliveries\
import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { deliveryApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { FAILURE_REASONS } from '../../config/orderStatus';
import { formatDateTime, formatShortMoney } from '../../utils/format';
import '../Accounts/accounts.css';
import '../Orders/orders.css';

const PAGE_SIZE = 10;

// Shipper: xem đơn đã nhập kho tại kho mình phụ trách và tự chọn đơn muốn giao (FR52)
export default function PendingDeliveryPage() {
  const { user } = useAuth();

  const [tab, setTab] = useState('available'); // available: chờ nhận giao | accepted: đã nhận, chờ lấy ở kho
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);

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
      const params = { search: debouncedSearch || undefined, page, pageSize: PAGE_SIZE };
      const res = tab === 'available'
        ? await deliveryApi.available(params)
        : await deliveryApi.mine({ ...params, status: 'accepted' });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(getErrorMessage(err));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async (o) => {
    if (!window.confirm(`Nhận giao đơn ${o.code} đến "${o.receiverAddress}, ${o.receiverDistrict}"?`)) return;
    setBusyId(o.id);
    setError('');
    setMessage('');
    try {
      await deliveryApi.accept(o.id);
      setMessage(`Đã nhận giao đơn ${o.code}. Hãy đến kho lấy hàng, nhân viên kho sẽ xuất hàng cho bạn.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
      load();
    }
  };

  const switchTab = (t) => { setTab(t); setPage(1); setMessage(''); };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Đơn chờ giao"
        subtitle={user?.warehouseCode
          ? `Đơn đã về kho ${user.warehouseCode} - ${user.warehouseName}. Bạn tự chọn đơn muốn giao, rồi đến kho lấy hàng.`
          : 'Đơn đã về kho bạn phụ trách. Bạn tự chọn đơn muốn giao.'}
      />

      <div className="grid grid-3 section">
        <StatCard index={0} label={tab === 'available' ? 'Đơn chờ nhận giao' : 'Đơn đã nhận, chờ lấy ở kho'} value={total} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div className="acc-tools">
            <button className={`btn ${tab === 'available' ? 'btn-primary' : ''}`} style={tab === 'available' ? { boxShadow: 'none' } : undefined} onClick={() => switchTab('available')}>Chờ nhận giao</button>
            <button className={`btn ${tab === 'accepted' ? 'btn-primary' : ''}`} style={tab === 'accepted' ? { boxShadow: 'none' } : undefined} onClick={() => switchTab('accepted')}>Đã nhận, chờ lấy ở kho</button>
          </div>
          <div className="acc-search">
            <Search size={16} />
            <input placeholder="Tìm mã đơn, tên người nhận..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {message && <div className="od-ok">{message}</div>}
        {error && <div className="acc-banner">{error}</div>}

        <div className="acc-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ VẬN ĐƠN</th><th>NGƯỜI NHẬN / ĐỊA CHỈ GIAO</th><th>HÀNG</th><th>COD</th>
                <th>{tab === 'available' ? 'NHẬP KHO LÚC' : 'NHẬN GIAO LÚC'}</th>{tab === 'available' && <th />}
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id}>
                  <td className="code-link">{o.code}</td>
                  <td>
                    <b>{o.receiverName}</b> · {o.receiverPhone}
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      {o.receiverAddress}, {o.receiverDistrict}, {o.receiverProvince}
                    </div>
                    {o.status === 'delivery_failed' && (
                      <div style={{ fontSize: 13, marginTop: 4, color: '#b91c1c' }}>
                        Giao lại lần {o.deliveryAttempts + 1}/{o.maxDeliveryAttempts} · lần trước: {FAILURE_REASONS[o.lastFailureReason] ?? 'giao thất bại'}
                      </div>
                    )}
                  </td>
                  <td>
                    {o.receivedQuantity ?? o.quantity} kiện · {o.weightKg} kg
                    <div className="muted" style={{ fontSize: 13 }}>{o.itemDescription}</div>
                  </td>
                  <td>{o.codAmount > 0 ? formatShortMoney(o.codAmount) : <span className="muted">—</span>}</td>
                  <td>{formatDateTime(tab === 'available' ? o.receivedAt : o.deliveryAcceptedAt)}</td>
                  {tab === 'available' && (
                    <td>
                      <button className="btn btn-primary btn-sm" disabled={busyId === o.id} onClick={() => accept(o)}>
                        {busyId === o.id ? 'Đang nhận...' : 'Nhận giao'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && !error && (
            <div className="acc-empty">
              {tab === 'available'
                ? 'Hiện chưa có đơn nào chờ giao tại kho của bạn. Đơn xuất hiện ở đây sau khi nhân viên kho nhập kho.'
                : 'Bạn chưa nhận giao đơn nào đang chờ lấy hàng.'}
            </div>
          )}
          {loading && items.length === 0 && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="acc-foot">
          <span>Tổng <b>{total}</b> đơn</span>
          <div className="acc-pager">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            <span>Trang {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div>
      </div>
    </>
  );
}
