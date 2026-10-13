import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { warehouseApi } from '../../api/warehouseApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { TYPE_LABEL } from '../../config/warehouse';
import StatCard from '../../components/common/StatCard';
import WarehouseFormModal from './WarehouseFormModal';
import AssignMemberModal from './AssignMemberModal';
import '../Accounts/accounts.css';
import './warehouses.css';

function MemberPanel({ title, subtitle, members, canEdit, addLabel, emptyText, onAdd, onRemove }) {
  return (
    <div className="card">
      <div className="panel-head">
        <div>
          <div className="card-title">{title} <span className="muted">({members.length})</span></div>
          <div className="card-sub">{subtitle}</div>
        </div>
        {canEdit && <button className="btn btn-primary btn-sm" onClick={onAdd}>{addLabel}</button>}
      </div>

      {members.length === 0 ? (
        <div className="panel-empty">{emptyText}</div>
      ) : (
        <div className="acc-scroll" style={{ marginTop: 16 }}>
          <table className="data-table" style={{ minWidth: 380 }}>
            <thead>
              <tr><th>HỌ TÊN</th><th>TRẠNG THÁI</th>{canEdit && <th />}</tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className={m.isActive ? '' : 'row-locked'}>
                  <td>
                    <b>{m.fullName}</b>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{m.email} · {m.phone}</div>
                  </td>
                  <td><span className={`pill ${m.isActive ? 'pill-ok' : 'pill-off'}`}>{m.isActive ? 'Hoạt động' : 'Đã khóa'}</span></td>
                  {canEdit && <td><button className="act-btn danger" onClick={() => onRemove(m)}>Gỡ khỏi kho</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function WarehouseDetail({ id }) {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'edit' | 'staff' | 'shipper'

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await warehouseApi.get(id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const backLink = (
    <Link className="wh-back" to={`/${role}/warehouses`}><ArrowLeft size={18} /> Danh sách kho</Link>
  );

  if (!data) {
    return (
      <>
        {backLink}
        {error ? <div className="acc-banner">{error}</div> : <div className="acc-empty">Đang tải...</div>}
      </>
    );
  }

  const w = data.warehouse;
  const isLocal = w.type === 'local';

  const toggleStatus = async () => {
    const action = w.isActive ? 'ngừng hoạt động' : 'mở lại hoạt động';
    if (!window.confirm(`Bạn có chắc muốn ${action} kho ${w.code}?`)) return;
    try {
      await warehouseApi.setStatus(w.id, !w.isActive);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const removeMember = async (m) => {
    if (!window.confirm(`Gỡ ${m.fullName} khỏi kho ${w.code}?`)) return;
    try {
      setData(await warehouseApi.removeMember(w.id, m.id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const closeModal = () => setModal(null);
  const handleSaved = () => {
    closeModal();
    load();
  };

  return (
    <>
      {backLink}

      <div className="wh-head">
        <div className="wh-title">
          <span className="wh-code">{w.code}</span>
          <h1>{w.name}</h1>
          <span className={`pill ${w.isActive ? 'pill-ok' : 'pill-off'}`}>{w.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span>
        </div>
        {isAdmin && (
          <div className="wh-actions">
            <button className="btn" onClick={() => setModal('edit')}>Sửa thông tin</button>
            <button className="btn" onClick={toggleStatus}>{w.isActive ? 'Ngừng hoạt động' : 'Mở lại hoạt động'}</button>
          </div>
        )}
      </div>

      {error && <div className="acc-banner">{error}</div>}

      <div className="card section">
        <div className="card-title">Thông tin kho</div>
        <div className="info-grid">
          <div className="info-item"><small>Loại kho</small><div><span className={`pill ${isLocal ? 'pill-local' : 'pill-regional'}`}>{TYPE_LABEL[w.type]}</span></div></div>
          <div className="info-item"><small>Kho vùng quản lý</small><div>{w.parentCode ? `${w.parentCode} - ${w.parentName}` : '—'}</div></div>
          <div className="info-item"><small>Ngày tạo</small><div>{new Date(w.createdAt).toLocaleDateString('vi-VN')}</div></div>
          <div className="info-item" style={{ gridColumn: '1 / -1' }}><small>Địa chỉ</small><div>{w.address}</div></div>
        </div>
      </div>

      <div className="grid grid-3 section">
        <StatCard index={0} label="Tồn kho hiện tại" value={data.stockCount} showTrend={false} />
        <StatCard index={1} label="Nhân viên kho" value={w.staffCount} showTrend={false} />
        <StatCard index={2} label={isLocal ? 'Shipper phụ trách' : 'Kho địa phương trực thuộc'} value={isLocal ? w.shipperCount : data.children.length} showTrend={false} />
      </div>

      <div className="member-grid section">
        <MemberPanel
          title="Nhân viên kho"
          subtitle="Chỉ thấy và thao tác dữ liệu của kho này"
          members={data.staff}
          canEdit={isAdmin && w.isActive}
          addLabel="Gán nhân viên"
          emptyText="Kho chưa có nhân viên nào."
          onAdd={() => setModal('staff')}
          onRemove={removeMember}
        />

        {isLocal ? (
          <MemberPanel
            title="Shipper phụ trách"
            subtitle="Shipper tự nhận đơn trong khu vực của kho này"
            members={data.shippers}
            canEdit={isAdmin && w.isActive}
            addLabel="Gán shipper"
            emptyText="Kho chưa có shipper nào."
            onAdd={() => setModal('shipper')}
            onRemove={removeMember}
          />
        ) : (
          <div className="card">
            <div className="card-title">Kho địa phương trực thuộc <span className="muted">({data.children.length})</span></div>
            <div className="card-sub">Shipper chỉ được gán vào kho địa phương, không gán vào kho vùng</div>
            {data.children.length === 0 ? (
              <div className="panel-empty">Chưa có kho địa phương nào gắn với kho vùng này.</div>
            ) : (
              <div className="child-list">
                {data.children.map((c) => (
                  <Link key={c.id} to={`/${role}/warehouses/${c.id}`} className="child-chip">
                    <b>{c.code}</b>{c.name}{!c.isActive && ' (ngừng)'}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card section">
        <div className="card-title">Tồn kho</div>
        <div className="card-sub">Danh sách đơn hàng và bao hàng đang lưu tại kho</div>
        <div className="placeholder">Sẽ hiển thị khi hoàn thiện module đơn hàng</div>
      </div>

      {modal === 'edit' && <WarehouseFormModal mode="edit" warehouse={w} onClose={closeModal} onSaved={handleSaved} />}
      {modal === 'staff' && <AssignMemberModal warehouse={w} role="warehouse" onClose={closeModal} onSaved={handleSaved} />}
      {modal === 'shipper' && <AssignMemberModal warehouse={w} role="shipper" onClose={closeModal} onSaved={handleSaved} />}
    </>
  );
}
