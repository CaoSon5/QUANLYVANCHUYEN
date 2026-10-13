import { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import { userApi } from '../../api/userApi';
import { warehouseApi } from '../../api/warehouseApi';
import { getErrorMessage } from '../../api/authApi';

// Gán nhân viên kho hoặc shipper (role = 'warehouse' | 'shipper') vào kho đang xem
export default function AssignMemberModal({ warehouse, role, onClose, onSaved }) {
  const label = role === 'shipper' ? 'shipper' : 'nhân viên kho';

  const [candidates, setCandidates] = useState([]);
  const [userId, setUserId] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userApi
      .list({ role, isActive: true, page: 1, pageSize: 100 })
      .then((res) => setCandidates(res.items.filter((u) => u.warehouseId !== warehouse.id)))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoadingList(false));
  }, [role, warehouse.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return setError(`Vui lòng chọn ${label}`);

    setError('');
    setSaving(true);
    try {
      await warehouseApi.assignMember(warehouse.id, userId);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  const chosen = candidates.find((u) => u.id === userId);

  return (
    <Modal title={`Gán ${label} vào kho ${warehouse.code}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {loadingList ? (
          <p className="panel-empty">Đang tải danh sách...</p>
        ) : candidates.length === 0 ? (
          <p className="panel-empty">
            Không còn tài khoản {label} nào để gán. Hãy tạo thêm ở trang <b>Tài khoản &amp; phân quyền</b>.
          </p>
        ) : (
          <>
            <label className="form-label">Chọn {label}</label>
            <select className="form-input" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">— Chọn —</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email}){u.warehouseCode ? ` - đang ở ${u.warehouseCode}` : ' - chưa có kho'}
                </option>
              ))}
            </select>
            {chosen?.warehouseCode && (
              <div className="form-hint">
                Mỗi người chỉ thuộc một kho, nên {chosen.fullName} sẽ được chuyển từ kho {chosen.warehouseCode} sang kho này.
              </div>
            )}
          </>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={saving || candidates.length === 0}>
            {saving ? 'Đang gán...' : 'Gán vào kho'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
