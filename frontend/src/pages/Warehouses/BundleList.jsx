// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\WarehouseOps\
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { bundleApi } from '../../api/bundleApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/format';
import BundlePill, { BUNDLE_STATUS } from './BundlePill';
import CreateBundleModal from './CreateBundleModal';
import '../Accounts/accounts.css';
import '../Orders/orders.css';

const PAGE_SIZE = 10;

// Nhân viên kho: danh sách bao ở kho mình, tìm bao theo mã bao hoặc mã đơn trong bao (FR40)
export default function BundleList({ onOpen }) {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const canCreate = role === 'warehouse';

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ open: 0, sealed: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

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
      const [list, open, sealed] = await Promise.all([
        bundleApi.list({ status: status || undefined, search: debouncedSearch || undefined, page, pageSize: PAGE_SIZE }),
        bundleApi.list({ status: 'open', page: 1, pageSize: 1 }),
        bundleApi.list({ status: 'sealed', page: 1, pageSize: 1 }),
      ]);
      setItems(list.items);
      setTotal(list.total);
      setCounts({ open: open.total, sealed: sealed.total });
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
    <>
      <PageHeader
        title="Bao hàng"
        subtitle={user?.warehouseCode
          ? `Gộp các đơn cùng đi một kho đích thành bao tại kho ${user.warehouseCode} - ${user.warehouseName}.`
          : 'Gộp các đơn cùng đi một kho đích thành bao.'}
        action={canCreate ? 'Tạo bao' : undefined}
        onAction={() => setCreating(true)}
      />

      <div className="grid grid-3 section">
        <StatCard index={0} label="Bao đang gộp" value={counts.open} />
        <StatCard index={1} label="Bao đã đóng, chờ lên xe" value={counts.sealed} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div className="acc-tools">
            <select className="acc-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Mọi trạng thái</option>
              {Object.entries(BUNDLE_STATUS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
            </select>
          </div>
          <div className="acc-search">
            <Search size={16} />
            <input placeholder="Tìm mã bao hoặc mã đơn trong bao..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {error && <div className="acc-banner">{error}</div>}

        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 820 }}>
            <thead>
              <tr><th>MÃ BAO</th><th>KHO ĐÍCH</th><th>SỐ ĐƠN</th><th>TỔNG CÂN NẶNG</th><th>TỔNG KIỆN</th><th>TRẠNG THÁI</th><th>TẠO LÚC</th></tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td>
                    {onOpen
                      ? <button className="code-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => onOpen(b.id)}>{b.code}</button>
                      : <Link className="code-link" to={`/${role}/bundles/${b.id}`}>{b.code}</Link>}
                  </td>
                  <td><b>{b.destinationCode}</b><div className="muted" style={{ fontSize: 13 }}>{b.destinationName}</div></td>
                  <td>{b.orderCount}</td>
                  <td>{b.totalWeightKg} kg</td>
                  <td>{b.totalPieces}</td>
                  <td><BundlePill status={b.status} /></td>
                  <td>{formatDateTime(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && !error && (
            <div className="acc-empty">
              {debouncedSearch || status ? 'Không có bao nào khớp.' : 'Chưa có bao nào. Bấm "Tạo bao", nhập mã kho đích rồi quét các đơn đi kho đó.'}
            </div>
          )}
          {loading && items.length === 0 && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="acc-foot">
          <span>Tổng <b>{total}</b> bao</span>
          <div className="acc-pager">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            <span>Trang {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div>
      </div>

      {creating && (
        <CreateBundleModal
          onClose={() => setCreating(false)}
          onCreated={(bundle) => navigate(`/${role}/bundles/${bundle.id}`)}
        />
      )}
    </>
  );
}
