// Đặt vào: D:\spreeexpress\frontend\src\pages\Warehouses\
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { warehouseApi } from '../../api/warehouseApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { TYPE_LABEL } from '../../config/warehouse';
import WarehouseFormModal from './WarehouseFormModal';
import '../Accounts/accounts.css';
import './warehouses.css';

const PAGE_SIZE = 10;

export default function WarehouseList() {
  const { role } = useAuth();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total: 0, active: 0, regional: 0, local: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { type: 'create' | 'edit', warehouse? }

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
        warehouseApi.list({
          search: debouncedSearch || undefined,
          type: type || undefined,
          isActive: status === '' ? undefined : status === 'active',
          page,
          pageSize: PAGE_SIZE,
        }),
        warehouseApi.summary(),
      ]);
      setItems(list.items);
      setTotal(list.total);
      setSummary(sum);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, type, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = role === 'admin';

  const toggleStatus = async (w) => {
    const action = w.isActive ? 'ngừng hoạt động' : 'mở lại hoạt động';
    if (!window.confirm(`Bạn có chắc muốn ${action} kho ${w.code} - ${w.name}?`)) return;
    try {
      await warehouseApi.setStatus(w.id, !w.isActive);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const closeModal = () => setModal(null);
  const handleSaved = () => {
    closeModal();
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Kho & bưu cục"
        subtitle="Quản lý danh sách kho, nhân viên kho và shipper phụ trách."
        action={isAdmin ? 'Thêm kho' : undefined}
        onAction={() => setModal({ type: 'create' })}
      />

      <div className="grid grid-4 section">
        <StatCard index={0} label="Tổng số kho" value={summary.total} showTrend={false} />
        <StatCard index={1} label="Kho vùng" value={summary.regional} showTrend={false} />
        <StatCard index={2} label="Kho địa phương" value={summary.local} showTrend={false} />
        <StatCard index={3} label="Đang hoạt động" value={summary.active} showTrend={false} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Danh sách kho</div>
            <div className="card-sub">Mã kho do Admin đặt, không trùng và không thay đổi sau khi tạo</div>
          </div>
          <div className="acc-tools">
            <div className="acc-search">
              <Search size={16} />
              <input placeholder="Tìm theo mã kho hoặc tên kho..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="acc-select" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
              <option value="">Tất cả loại kho</option>
              <option value="regional">{TYPE_LABEL.regional}</option>
              <option value="local">{TYPE_LABEL.local}</option>
            </select>
            <select className="acc-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Mọi trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>
        </div>

        {error && <div className="acc-banner">{error}</div>}

        <div className="acc-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ KHO</th><th>TÊN KHO</th><th>LOẠI</th><th>KHO VÙNG QUẢN LÝ</th>
                <th>NHÂN VIÊN</th><th>SHIPPER</th><th>TRẠNG THÁI</th><th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id} className={w.isActive ? '' : 'row-locked'}>
                  <td><Link className="code-link" to={`/${role}/warehouses/${w.id}`}>{w.code}</Link></td>
                  <td>
                    <b>{w.name}</b>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{w.address}</div>
                  </td>
                  <td><span className={`pill ${w.type === 'regional' ? 'pill-regional' : 'pill-local'}`}>{TYPE_LABEL[w.type]}</span></td>
                  <td>
                    {w.parentCode
                      ? w.parentCode
                      : w.type === 'local'
                        ? <span className="pill pill-wait" style={{ marginLeft: 0 }}>Chưa gắn kho vùng</span>
                        : <span className="muted">—</span>}
                  </td>
                  <td>{w.staffCount}</td>
                  <td>{w.type === 'local' ? w.shipperCount : <span className="muted">—</span>}</td>
                  <td><span className={`pill ${w.isActive ? 'pill-ok' : 'pill-off'}`}>{w.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span></td>
                  <td>
                    <div className="row-actions">
                      <Link className="act-btn" to={`/${role}/warehouses/${w.id}`}>Xem</Link>
                      {isAdmin && <button className="act-btn" onClick={() => setModal({ type: 'edit', warehouse: w })}>Sửa</button>}
                      {isAdmin && (
                        <button className={`act-btn ${w.isActive ? 'danger' : 'success'}`} onClick={() => toggleStatus(w)}>
                          {w.isActive ? 'Ngừng' : 'Mở lại'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && <div className="acc-empty">Chưa có kho nào phù hợp. {isAdmin && 'Bấm "Thêm kho" để tạo kho đầu tiên.'}</div>}
          {loading && items.length === 0 && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="acc-foot">
          <span>Tổng <b>{total}</b> kho</span>
          <div className="acc-pager">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            <span>Trang {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div>
      </div>

      {modal?.type === 'create' && <WarehouseFormModal mode="create" onClose={closeModal} onSaved={handleSaved} />}
      {modal?.type === 'edit' && <WarehouseFormModal mode="edit" warehouse={modal.warehouse} onClose={closeModal} onSaved={handleSaved} />}
    </>
  );
}
