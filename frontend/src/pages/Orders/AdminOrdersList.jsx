import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { orderApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { ORDER_STATUS } from '../../config/orderStatus';
import { formatDateTime, formatVnd } from '../../utils/format';
import OrderStatusPill from './OrderStatusPill';
import '../Accounts/accounts.css';
import '../Warehouses/warehouses.css';
import './orders.css';

const PAGE_SIZE = 10;

// Admin, Điều phối viên: xem mọi đơn hàng của hệ thống (chỉ xem, không tạo hay sửa)
export default function AdminOrdersList() {
  const { role } = useAuth();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total: 0, inProgress: 0, delivered: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
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
      const [list, sum] = await Promise.all([
        orderApi.listAll({ search: debouncedSearch || undefined, status: status || undefined, page, pageSize: PAGE_SIZE }),
        orderApi.summary(),
      ]);
      setItems(list.items);
      setTotal(list.total);
      setSummary(sum);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Quản lý đơn hàng"
        subtitle="Tra cứu, lọc và theo dõi toàn bộ vòng đời vận đơn trong hệ thống."
      />

      <div className="grid grid-3 section">
        <StatCard index={0} label="Tổng vận đơn" value={summary.total} />
        <StatCard index={1} label="Đang xử lý" value={summary.inProgress} />
        <StatCard index={2} label="Đã giao" value={summary.delivered} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Danh sách đơn hàng</div>
            <div className="card-sub">Mới nhất ở trên cùng. Bấm mã vận đơn để xem chi tiết và hành trình.</div>
          </div>
          <div className="acc-tools">
            <div className="acc-search">
              <Search size={16} />
              <input placeholder="Tìm mã đơn, tên, số điện thoại..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="acc-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Mọi trạng thái</option>
              {Object.entries(ORDER_STATUS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="acc-banner">{error}</div>}

        <div className="acc-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ VẬN ĐƠN</th><th>NGƯỜI BÁN</th><th>NGƯỜI NHẬN</th><th>KHO LẤY HÀNG</th>
                <th>ĐANG Ở KHO</th><th>NGÀY TẠO</th><th>PHÍ VC</th><th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id}>
                  <td><Link className="code-link" to={`/${role}/orders/${o.id}`}>{o.code}</Link></td>
                  <td>{o.sellerName}</td>
                  <td>
                    <b>{o.receiverName}</b>
                    <div className="muted" style={{ fontSize: 13 }}>{o.receiverDistrict}, {o.receiverProvince}</div>
                  </td>
                  <td>{o.pickupWarehouseCode}</td>
                  <td>{o.currentWarehouseCode ?? <span className="muted">—</span>}</td>
                  <td>{formatDateTime(o.createdAt)}</td>
                  <td>{formatVnd(o.shippingFee)}</td>
                  <td><OrderStatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && <div className="acc-empty">Chưa có đơn hàng nào.</div>}
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
