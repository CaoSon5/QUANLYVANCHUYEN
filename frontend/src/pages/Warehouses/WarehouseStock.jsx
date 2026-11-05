// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Warehouses\
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { orderApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/format';
import OrderStatusPill from '../Orders/OrderStatusPill';
import '../Accounts/accounts.css';
import '../Orders/orders.css';

const PAGE_SIZE = 10;

// Số giờ hàng đã nằm trong kho kể từ lúc nhập
const hoursSince = (iso) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000) : null);

// FR09: các đơn đang nằm trong một kho (đã nhập kho, chờ xuất, chờ giao lại, chờ hoàn)
export default function WarehouseStock({ warehouseId }) {
  const { role } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      const res = await orderApi.listByWarehouse(warehouseId, {
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [warehouseId, debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="card acc-card section">
      <div className="acc-head">
        <div>
          <div className="card-title">Tồn kho</div>
          <div className="card-sub">Các đơn đang nằm trong kho, lưu lâu nhất xếp trước</div>
        </div>
        <div className="acc-search">
          <Search size={16} />
          <input placeholder="Tìm mã đơn, người nhận..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {error && <div className="acc-banner">{error}</div>}

      <div className="acc-scroll">
        <table className="data-table" style={{ minWidth: 760 }}>
          <thead>
            <tr>
              <th>MÃ VẬN ĐƠN</th><th>NGƯỜI BÁN</th><th>NGƯỜI NHẬN</th><th>TRẠNG THÁI</th><th>SỐ KIỆN</th><th>NHẬP KHO LÚC</th><th>LƯU</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => {
              const hours = hoursSince(o.receivedAt);
              return (
                <tr key={o.id}>
                  <td><Link className="code-link" to={`/${role}/orders/${o.id}`}>{o.code}</Link></td>
                  <td>{o.sellerName}</td>
                  <td>{o.receiverName}</td>
                  <td><OrderStatusPill status={o.status} /></td>
                  <td>{o.receivedQuantity ?? o.quantity}</td>
                  <td>{formatDateTime(o.receivedAt)}</td>
                  <td style={hours !== null && hours >= 48 ? { color: '#b91c1c', fontWeight: 700 } : undefined}>
                    {hours === null ? <span className="muted">—</span> : `${hours} giờ`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && items.length === 0 && !error && (
          <div className="acc-empty">{debouncedSearch ? 'Không có đơn nào khớp từ khóa.' : 'Kho này hiện không có đơn nào.'}</div>
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
  );
}
