import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { orderApi, warehouseOrderApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/format';
import OrderStatusPill from '../Orders/OrderStatusPill';
import '../Accounts/accounts.css';
import '../Orders/orders.css';

const PAGE_SIZE = 10;

// Số giờ đã lưu trong kho
const hoursSince = (iso) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000) : null);

// Nhân viên kho: xem tồn kho của kho mình (FR32) và tìm kiếm đơn (FR40)
export default function InventoryPage() {
  const { user } = useAuth();

  const [tab, setTab] = useState('inventory'); // inventory: đang lưu kho | incoming: đang về kho
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ incoming: 0, inventory: 0, stale48h: 0 });
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
      const [list, sum] = await Promise.all([
        warehouseOrderApi.list(tab, { search: debouncedSearch || undefined, page, pageSize: PAGE_SIZE }),
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
  }, [tab, debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  const switchTab = (t) => { setTab(t); setPage(1); };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Kiểm tra tồn kho"
        subtitle={user?.warehouseCode
          ? `Hàng của kho ${user.warehouseCode} - ${user.warehouseName}. Bạn chỉ thấy dữ liệu kho của mình.`
          : 'Hàng của kho bạn phụ trách.'}
      />

      <div className="grid grid-3 section">
        <StatCard index={0} label="Đang lưu trong kho" value={summary.inventory} />
        <StatCard index={1} label="Đang trên đường về kho" value={summary.incoming} />
        <StatCard index={2} label="Tồn quá 48 giờ" value={summary.stale48h} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div className="acc-tools">
            <button className={`btn ${tab === 'inventory' ? 'btn-primary' : ''}`} style={tab === 'inventory' ? { boxShadow: 'none' } : undefined} onClick={() => switchTab('inventory')}>Đang lưu kho</button>
            <button className={`btn ${tab === 'incoming' ? 'btn-primary' : ''}`} style={tab === 'incoming' ? { boxShadow: 'none' } : undefined} onClick={() => switchTab('incoming')}>Đang về kho</button>
          </div>
          <div className="acc-search">
            <Search size={16} />
            <input placeholder="Tìm mã đơn, tên, số điện thoại..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {error && <div className="acc-banner">{error}</div>}

        <div className="acc-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ VẬN ĐƠN</th><th>NGƯỜI GỬI</th><th>NGƯỜI NHẬN</th><th>SỐ KIỆN</th>
                <th>{tab === 'inventory' ? 'NHẬP KHO LÚC' : 'SHIPPER LẤY LÚC'}</th>
                {tab === 'inventory' && <th>ĐÃ LƯU</th>}
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => {
                const hours = tab === 'inventory' ? hoursSince(o.receivedAt) : null;
                const stale = hours !== null && hours >= 48;
                return (
                  <tr key={o.id}>
                    <td className="code-link">{o.code}</td>
                    <td>{o.senderName}<div className="muted" style={{ fontSize: 13 }}>{o.senderPhone}</div></td>
                    <td>
                      <b>{o.receiverName}</b>
                      <div className="muted" style={{ fontSize: 13 }}>{o.receiverDistrict}, {o.receiverProvince}</div>
                    </td>
                    <td>{tab === 'inventory' ? (o.receivedQuantity ?? o.quantity) : (o.pickedQuantity ?? o.quantity)}</td>
                    <td>{formatDateTime(tab === 'inventory' ? o.receivedAt : o.pickedUpAt)}</td>
                    {tab === 'inventory' && (
                      <td style={stale ? { color: '#b91c1c', fontWeight: 700 } : undefined}>{hours} giờ{stale ? ' (quá hạn)' : ''}</td>
                    )}
                    <td><OrderStatusPill status={o.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <div className="acc-empty">{tab === 'inventory' ? 'Kho chưa có hàng nào.' : 'Chưa có đơn nào về kho. Đơn chỉ hiện ở đây sau khi shipper bấm “Xác nhận lấy hàng”.'}</div>
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
