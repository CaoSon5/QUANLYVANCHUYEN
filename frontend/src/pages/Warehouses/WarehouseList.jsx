// Đặt vào: D:\spreeexpress\frontend\src\pages\Warehouses\
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import RowMenu from '../../components/common/RowMenu';
import { warehouseApi } from '../../api/warehouseApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { TYPE_LABEL } from '../../config/warehouse';
import WarehouseFormModal from './WarehouseFormModal';
import '../Accounts/accounts.css';
import './warehouses.css';

// Lấy một lần tối đa 100 kho rồi nhóm theo kho vùng (không phân trang để một kho vùng không bị cắt đôi)
const FETCH_SIZE = 100;
const NO_PARENT = 'none';

const byCode = (a, b) => a.code.localeCompare(b.code, 'vi');

// Nhóm kho địa phương dưới kho vùng của nó. Kho vùng bị lọc mất (ví dụ khi tìm kiếm) vẫn hiện làm tiêu đề nhóm.
function buildGroups(items) {
  const groups = new Map();
  items.filter((w) => w.type === 'regional').forEach((w) => groups.set(w.id, { key: w.id, head: w, children: [] }));

  const orphans = [];
  items.filter((w) => w.type !== 'regional').forEach((w) => {
    if (!w.parentId) {
      orphans.push(w);
      return;
    }
    let g = groups.get(w.parentId);
    if (!g) {
      g = {
        key: w.parentId,
        head: { id: w.parentId, code: w.parentCode ?? '', name: w.parentName ?? '', type: 'regional', placeholder: true },
        children: [],
      };
      groups.set(w.parentId, g);
    }
    g.children.push(w);
  });

  const list = [...groups.values()].sort((a, b) => byCode(a.head, b.head));
  list.forEach((g) => g.children.sort(byCode));
  if (orphans.length > 0) {
    list.push({ key: NO_PARENT, head: null, children: orphans.sort(byCode) });
  }
  return list;
}

export default function WarehouseList() {
  const { role } = useAuth();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total: 0, active: 0, regional: 0, local: 0 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { type: 'create' | 'edit', warehouse? }
  const [collapsed, setCollapsed] = useState(() => new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
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
          page: 1,
          pageSize: FETCH_SIZE,
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
  }, [debouncedSearch, type, status]);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = role === 'admin';
  const groups = useMemo(() => buildGroups(items), [items]);

  // Khi đang tìm kiếm thì luôn mở hết để thấy kết quả khớp
  const forceOpen = debouncedSearch !== '';
  const isOpen = (key) => forceOpen || !collapsed.has(key);

  const toggleGroup = (key) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(groups.filter((g) => g.head).map((g) => g.key)));

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

  // Nút Xem + menu "⋯" (Sửa, Ngừng/Mở lại) của một kho
  const renderActions = (w, withMenu) => (
    <div className="row-actions">
      <Link className="act-btn" to={`/${role}/warehouses/${w.id}`}>Xem</Link>
      {isAdmin && withMenu && (
        <RowMenu
          items={[
            { label: 'Sửa kho', onClick: () => setModal({ type: 'edit', warehouse: w }) },
            {
              label: w.isActive ? 'Ngừng hoạt động' : 'Mở lại hoạt động',
              danger: w.isActive,
              success: !w.isActive,
              onClick: () => toggleStatus(w),
            },
          ]}
        />
      )}
    </div>
  );

  const statusPill = (w) =>
    w.placeholder
      ? <span className="muted">—</span>
      : <span className={`pill ${w.isActive ? 'pill-ok' : 'pill-off'}`}>{w.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span>;

  // Dựng danh sách dòng và đánh số thứ tự liên tục
  let stt = 0;
  const rows = [];
  groups.forEach((g) => {
    const open = isOpen(g.key);

    if (g.head) {
      const h = g.head;
      stt += 1;
      rows.push(
        <tr key={`h-${g.key}`} className={`wh-reg ${h.isActive === false ? 'row-locked' : ''}`}>
          <td className="col-stt">{stt}</td>
          <td>
            <button
              type="button" className={`wh-tg ${open ? '' : 'closed'}`} aria-expanded={open}
              aria-label={open ? 'Thu gọn' : 'Mở rộng'} onClick={() => toggleGroup(g.key)}
            >
              <ChevronDown size={16} />
            </button>
            <Link className="code-link" to={`/${role}/warehouses/${h.id}`}>{h.code}</Link>
          </td>
          <td>
            {h.name}
            <span className="wh-cnt">{g.children.length} kho địa phương</span>
            {!h.placeholder && <div className="wh-sub">{h.staffCount} nhân viên</div>}
          </td>
          <td>{statusPill(h)}</td>
          <td>{renderActions(h, !h.placeholder)}</td>
        </tr>,
      );
    } else {
      rows.push(
        <tr key="h-none" className="wh-none">
          <td className="col-stt" />
          <td colSpan={4}>
            <button
              type="button" className={`wh-tg ${open ? '' : 'closed'}`} aria-expanded={open}
              aria-label={open ? 'Thu gọn' : 'Mở rộng'} onClick={() => toggleGroup(g.key)}
            >
              <ChevronDown size={16} />
            </button>
            Chưa gắn kho vùng
            <span className="wh-cnt">{g.children.length} kho</span>
          </td>
        </tr>,
      );
    }

    if (!open) return;
    g.children.forEach((w) => {
      stt += 1;
      rows.push(
        <tr key={w.id} className={`wh-loc ${w.isActive ? '' : 'row-locked'}`}>
          <td className="col-stt">{stt}</td>
          <td><Link className="code-link" to={`/${role}/warehouses/${w.id}`}>{w.code}</Link></td>
          <td className="wh-nm-loc">
            <b>{w.name}</b>
            <div className="wh-sub">{w.address} · {w.staffCount} NV · {w.shipperCount} shipper</div>
          </td>
          <td>{statusPill(w)}</td>
          <td>{renderActions(w, true)}</td>
        </tr>,
      );
    });
  });

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
            <select className="acc-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Tất cả loại kho</option>
              <option value="regional">{TYPE_LABEL.regional}</option>
              <option value="local">{TYPE_LABEL.local}</option>
            </select>
            <select className="acc-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Mọi trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>
        </div>

        {error && <div className="acc-banner">{error}</div>}

        {groups.length > 0 && (
          <div className="wh-tools">
            <button type="button" className="act-btn" onClick={expandAll}>Mở rộng tất cả</button>
            <button type="button" className="act-btn" onClick={collapseAll}>Thu gọn tất cả</button>
          </div>
        )}

        <div className="acc-scroll">
          <table className="data-table wh-tree">
            <thead>
              <tr>
                <th className="col-stt">STT</th><th>MÃ KHO</th><th>TÊN KHO</th><th>TRẠNG THÁI</th><th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
          {!loading && items.length === 0 && <div className="acc-empty">Chưa có kho nào phù hợp. {isAdmin && 'Bấm "Thêm kho" để tạo kho đầu tiên.'}</div>}
          {loading && items.length === 0 && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="acc-foot">
          <span>
            Tổng <b>{total}</b> kho
            {total > items.length && ` (đang hiển thị ${items.length}, hãy dùng ô tìm kiếm để thu hẹp)`}
          </span>
        </div>
      </div>

      {modal?.type === 'create' && <WarehouseFormModal mode="create" onClose={closeModal} onSaved={handleSaved} />}
      {modal?.type === 'edit' && <WarehouseFormModal mode="edit" warehouse={modal.warehouse} onClose={closeModal} onSaved={handleSaved} />}
    </>
  );
}
