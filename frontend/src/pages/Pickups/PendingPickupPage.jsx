import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { pickupApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, formatShortMoney, formatVnd } from '../../utils/format';
import '../Accounts/accounts.css';
import '../Orders/orders.css';

const PAGE_SIZE = 10;

// Shipper: xem yêu cầu lấy hàng đang chờ tại kho mình phụ trách và tự nhận đơn (FR50)
export default function PendingPickupPage() {
  const { user } = useAuth();

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
      const res = await pickupApi.available({ search: debouncedSearch || undefined, page, pageSize: PAGE_SIZE });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(getErrorMessage(err));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async (o) => {
    if (!window.confirm(`Nhận đơn ${o.code} và đến lấy hàng tại "${o.senderAddress}"?`)) return;
    setBusyId(o.id);
    setError('');
    setMessage('');
    try {
      await pickupApi.accept(o.id);
      setMessage(`Đã nhận đơn ${o.code}. Vào mục "Xác nhận lấy hàng" khi bạn đã lấy hàng.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
      load(); // làm mới: đơn đã nhận sẽ biến mất khỏi danh sách chờ
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Đơn chờ lấy"
        subtitle={user?.warehouseCode
          ? `Yêu cầu lấy hàng đang chờ tại kho ${user.warehouseCode} - ${user.warehouseName}. Bạn tự chọn đơn muốn nhận.`
          : 'Yêu cầu lấy hàng đang chờ tại kho bạn phụ trách.'}
      />

      <div className="grid grid-3 section">
        <StatCard index={0} label="Đơn đang chờ nhận" value={total} showTrend={false} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Danh sách chờ nhận</div>
            <div className="card-sub">Đơn tạo sớm nhất ở trên cùng</div>
          </div>
          <div className="acc-search">
            <Search size={16} />
            <input placeholder="Tìm mã đơn, tên người gửi..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {message && <div className="od-ok">{message}</div>}
        {error && <div className="acc-banner">{error}</div>}

        <div className="acc-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ VẬN ĐƠN</th><th>NGƯỜI GỬI / ĐỊA CHỈ LẤY</th><th>HÀNG</th>
                <th>COD</th><th>TẠO LÚC</th><th />
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id}>
                  <td className="code-link">{o.code}</td>
                  <td>
                    <b>{o.senderName}</b> · {o.senderPhone}
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{o.senderAddress}</div>
                    {o.note && <div style={{ fontSize: 13, marginTop: 2, color: '#b45309' }}>Ghi chú: {o.note}</div>}
                  </td>
                  <td>{o.quantity} kiện · {o.weightKg} kg<div className="muted" style={{ fontSize: 13 }}>{o.itemDescription}</div></td>
                  <td>{o.codAmount > 0 ? formatShortMoney(o.codAmount) : <span className="muted">—</span>}</td>
                  <td>{formatDateTime(o.createdAt)}</td>
                  <td>
                    <button className="btn btn-primary btn-sm" disabled={busyId === o.id} onClick={() => accept(o)}>
                      {busyId === o.id ? 'Đang nhận...' : 'Nhận đơn'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && !error && <div className="acc-empty">Hiện chưa có yêu cầu lấy hàng nào đang chờ ở kho của bạn.</div>}
          {loading && items.length === 0 && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="acc-foot">
          <span>Tổng <b>{total}</b> đơn chờ</span>
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
