import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { orderApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { ORDER_STATUS } from '../../config/orderStatus';
import { formatDateTime, formatShortMoney, formatVnd } from '../../utils/format';
import OrderStatusPill from './OrderStatusPill';
import '../Accounts/accounts.css';
import '../Warehouses/warehouses.css';
import './orders.css';

const PAGE_SIZE = 10;

// Người bán: danh sách đơn của tôi (FR66)
export default function MyOrdersList() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total: 0, inProgress: 0, delivered: 0, codPending: 0 });
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
        orderApi.listMine({ search: debouncedSearch || undefined, status: status || undefined, page, pageSize: PAGE_SIZE }),
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
        title="Đơn hàng của tôi"
        subtitle="Theo dõi các đơn bạn đã gửi. Đơn chưa có shipper nhận vẫn sửa hoặc hủy được."
        action="Tạo yêu cầu lấy hàng"
        onAction={() => navigate('/seller/create-pickup')}
      />

      <div className="grid grid-4 section">
        <StatCard index={0} label="Tổng đơn hàng" value={summary.total} showTrend={false} />
        <StatCard index={1} label="Đang vận chuyển" value={summary.inProgress} showTrend={false} />
        <StatCard index={2} label="Đã giao" value={summary.delivered} showTrend={false} />
        <StatCard index={3} label="COD chờ nhận" value={formatShortMoney(summary.codPending)} showTrend={false} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Danh sách đơn hàng</div>
            <div className="card-sub">Mới nhất ở trên cùng</div>
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
                <th>MÃ VẬN ĐƠN</th><th>NGƯỜI NHẬN</th><th>ĐIỂM ĐẾN</th><th>NGÀY TẠO</th>
                <th>PHÍ VẬN CHUYỂN</th><th>COD</th><th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id}>
                  <td><Link className="code-link" to={`/seller/my-orders/${o.id}`}>{o.code}</Link></td>
                  <td><b>{o.receiverName}</b><div className="muted" style={{ fontSize: 13 }}>{o.receiverPhone}</div></td>
                  <td>{o.receiverDistrict}, {o.receiverProvince}</td>
                  <td>{formatDateTime(o.createdAt)}</td>
                  <td><b>{formatVnd(o.shippingFee)}</b></td>
                  <td>{o.codAmount > 0 ? formatVnd(o.codAmount) : <span className="muted">—</span>}</td>
                  <td><OrderStatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && <div className="acc-empty">Chưa có đơn hàng nào. Bấm "Tạo yêu cầu lấy hàng" để gửi đơn đầu tiên.</div>}
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
