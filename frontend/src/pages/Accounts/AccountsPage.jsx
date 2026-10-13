import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { userApi } from '../../api/userApi';
import { getErrorMessage } from '../../api/authApi';
import { ROLES, ROLE_LIST } from '../../config/roles';
import { useAuth } from '../../context/AuthContext';
import UserFormModal from './UserFormModal';
import ResetPasswordModal from './ResetPasswordModal';
import './accounts.css';

const PAGE_SIZE = 10;

const initials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] ?? '?').toUpperCase();
};

export default function AccountsPage() {
  const { user: me } = useAuth();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total: 0, active: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { type: 'create' | 'edit' | 'reset', user? }

  // Gõ xong 0,3 giây mới gọi tìm kiếm
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
        userApi.list({
          search: debouncedSearch || undefined,
          role: role || undefined,
          isActive: status === '' ? undefined : status === 'active',
          page,
          pageSize: PAGE_SIZE,
        }),
        userApi.summary(),
      ]);
      setItems(list.items);
      setTotal(list.total);
      setSummary(sum);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, role, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (u) => {
    const action = u.isActive ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản của ${u.fullName}?`)) return;
    try {
      await userApi.setStatus(u.id, !u.isActive);
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
        title="Tài khoản & phân quyền"
        subtitle="Quản lý người dùng và quyền truy cập theo vai trò."
        action="Thêm tài khoản"
        onAction={() => setModal({ type: 'create' })}
      />

      <div className="grid grid-3 section">
        <StatCard index={0} label="Tài khoản" value={summary.total} showTrend={false} />
        <StatCard index={1} label="Vai trò" value={ROLE_LIST.length} showTrend={false} />
        <StatCard index={2} label="Đang hoạt động" value={summary.active} showTrend={false} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Danh sách tài khoản</div>
            <div className="card-sub">Khóa tài khoản thay cho xóa để giữ lại lịch sử đơn hàng</div>
          </div>
          <div className="acc-tools">
            <div className="acc-search">
              <Search size={16} />
              <input placeholder="Tìm tên, email, số điện thoại..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="acc-select" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
              <option value="">Tất cả vai trò</option>
              {ROLE_LIST.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
            <select className="acc-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Mọi trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Đã khóa</option>
            </select>
          </div>
        </div>

        {error && <div className="acc-banner">{error}</div>}

        <div className="acc-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>NGƯỜI DÙNG</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>NGÀY TẠO</th><th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => {
                const r = ROLES[u.role];
                const isAdminRow = u.role === 'admin';
                const isMe = u.id === me?.id;
                return (
                  <tr key={u.id} className={u.isActive ? '' : 'row-locked'}>
                    <td>
                      <div className="user-cell">
                        <span className="u-avatar" style={{ background: r?.color ?? '#64748b' }}>{initials(u.fullName)}</span>
                        <div>
                          <b>{u.fullName}{isMe && ' (bạn)'}</b>
                          <small>{u.email} · {u.phone}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="pill" style={{ background: `${r?.color ?? '#64748b'}1a`, color: r?.color ?? '#64748b' }}>
                        {r?.label ?? u.role}
                      </span>
                      {u.warehouseCode && <small style={{ display: 'block', color: 'var(--muted)', marginTop: 4 }}>Kho {u.warehouseCode}</small>}
                    </td>
                    <td>
                      <span className={`pill ${u.isActive ? 'pill-ok' : 'pill-off'}`}>
                        {u.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                      {u.mustChangePassword && <span className="pill pill-wait">Chờ đổi mật khẩu</span>}
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div className="row-actions">
                        <button className="act-btn" onClick={() => setModal({ type: 'edit', user: u })}>Sửa</button>
                        <button className="act-btn" onClick={() => setModal({ type: 'reset', user: u })}>Đặt lại MK</button>
                        <button
                          className={`act-btn ${u.isActive ? 'danger' : 'success'}`}
                          disabled={isAdminRow || isMe}
                          title={isAdminRow || isMe ? 'Không thể khóa tài khoản Admin' : ''}
                          onClick={() => toggleStatus(u)}
                        >
                          {u.isActive ? 'Khóa' : 'Mở khóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && items.length === 0 && <div className="acc-empty">Không có tài khoản nào phù hợp.</div>}
          {loading && items.length === 0 && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="acc-foot">
          <span>Tổng <b>{total}</b> tài khoản</span>
          <div className="acc-pager">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            <span>Trang {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div>
      </div>

      {modal?.type === 'create' && <UserFormModal mode="create" onClose={closeModal} onSaved={handleSaved} />}
      {modal?.type === 'edit' && <UserFormModal mode="edit" user={modal.user} onClose={closeModal} onSaved={handleSaved} />}
      {modal?.type === 'reset' && <ResetPasswordModal user={modal.user} onClose={closeModal} onSaved={handleSaved} />}
    </>
  );
}
