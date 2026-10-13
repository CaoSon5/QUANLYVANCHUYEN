import { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import { userApi } from '../../api/userApi';
import { warehouseApi } from '../../api/warehouseApi';
import { getErrorMessage } from '../../api/authApi';
import { ROLES, ROLE_LIST } from '../../config/roles';

const PHONE_REGEX = /^(0|\+84)\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Vai trò có thể gán: tất cả trừ Admin (hệ thống chỉ có một Admin)
const ASSIGNABLE = ROLE_LIST.filter((r) => r.key !== 'admin');

// Nhân viên kho và shipper bắt buộc thuộc một kho
const needsWarehouse = (role) => role === 'warehouse' || role === 'shipper';

export default function UserFormModal({ mode, user, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const isAdminUser = isEdit && user.role === 'admin';

  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    role: user?.role ?? 'shipper',
    warehouseId: user?.warehouseId ?? '',
    password: '',
  });
  const [warehouses, setWarehouses] = useState([]);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    warehouseApi.options().then(setWarehouses).catch(() => {});
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Đổi vai trò thì xóa kho đã chọn nếu không còn hợp lệ (shipper chỉ ở kho địa phương)
  const handleRoleChange = (e) => {
    const role = e.target.value;
    const current = warehouses.find((w) => w.id === form.warehouseId);
    const stillValid = needsWarehouse(role) && current && (role !== 'shipper' || current.type === 'local');
    setForm({ ...form, role, warehouseId: stillValid ? form.warehouseId : '' });
  };

  // Shipper chỉ chọn được kho địa phương; nhân viên kho chọn mọi kho
  const warehouseOptions = warehouses.filter((w) => form.role !== 'shipper' || w.type === 'local');
  if (
    isEdit && user.warehouseId && needsWarehouse(form.role) &&
    !warehouseOptions.some((w) => w.id === user.warehouseId)
  ) {
    // Kho hiện tại đã ngừng hoạt động nên không có trong danh sách: vẫn giữ lại để khỏi mất lựa chọn
    warehouseOptions.push({ id: user.warehouseId, code: user.warehouseCode, name: user.warehouseName ?? '' });
  }

  const validate = () => {
    if (!form.fullName.trim()) return 'Vui lòng nhập họ và tên';
    if (!EMAIL_REGEX.test(form.email.trim())) return 'Email không hợp lệ';
    if (!PHONE_REGEX.test(form.phone.replace(/\s/g, ''))) return 'Số điện thoại không hợp lệ';
    if (!isEdit && form.password.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
    if (!isAdminUser && needsWarehouse(form.role) && !form.warehouseId) {
      return form.role === 'shipper' ? 'Vui lòng chọn kho địa phương cho shipper' : 'Vui lòng chọn kho cho nhân viên kho';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);

    setError('');
    setLoading(true);
    try {
      const body = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\s/g, ''),
        role: form.role,
        warehouseId: needsWarehouse(form.role) && form.warehouseId ? form.warehouseId : null,
      };
      if (isEdit) await userApi.update(user.id, body);
      else await userApi.create({ ...body, password: form.password });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Sửa tài khoản' : 'Thêm tài khoản'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="form-label">Họ và tên</label>
        <input className="form-input" value={form.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn A" autoFocus />

        <label className="form-label">Email</label>
        <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="nhanvien@congty.vn" />

        <label className="form-label">Số điện thoại</label>
        <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="0901234567" />

        <label className="form-label">Vai trò</label>
        {isAdminUser ? (
          <>
            <select className="form-input" value="admin" disabled>
              <option value="admin">{ROLES.admin.label}</option>
            </select>
            <div className="form-hint">Vai trò của Admin không thể thay đổi.</div>
          </>
        ) : (
          <select className="form-input" value={form.role} onChange={handleRoleChange}>
            {ASSIGNABLE.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
        )}

        {!isAdminUser && needsWarehouse(form.role) && (
          <>
            <label className="form-label">{form.role === 'shipper' ? 'Kho địa phương phụ trách' : 'Kho làm việc'}</label>
            <select className="form-input" value={form.warehouseId} onChange={set('warehouseId')}>
              <option value="">— Chọn kho —</option>
              {warehouseOptions.map((w) => (
                <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
              ))}
            </select>
            <div className="form-hint">
              {warehouseOptions.length === 0
                ? 'Chưa có kho phù hợp. Hãy tạo kho ở mục Kho & bưu cục trước.'
                : form.role === 'shipper'
                  ? 'Shipper chỉ nhận đơn trong khu vực của kho này.'
                  : 'Nhân viên kho chỉ thấy dữ liệu của kho này. Mỗi người chỉ thuộc một kho.'}
            </div>
          </>
        )}

        {!isEdit && (
          <>
            <label className="form-label">Mật khẩu</label>
            <input
              className="form-input"
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="Tối thiểu 6 ký tự"
            />
            <label style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>
              <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} /> Hiện mật khẩu
            </label>
            <div className="form-hint">Đây là mật khẩu tạm. Người dùng sẽ phải đổi mật khẩu ở lần đăng nhập đầu tiên.</div>
          </>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
