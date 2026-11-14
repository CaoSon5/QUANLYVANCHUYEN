// Đặt vào: frontend\src\pages\Profile\ProfilePage.jsx
import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { authApi, getErrorMessage } from '../../api/authApi';
import { ROLES } from '../../config/roles';
import { formatDateTime } from '../../utils/format';
import './profile.css';

// Vai trò được gán vào một kho
const WAREHOUSE_ROLES = ['shipper', 'warehouse'];
const PHONE_RE = /^(0|\+84)\d{9}$/;

function Row({ label, children }) {
  return (
    <div className="profile-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// Hồ sơ của người đang đăng nhập. Dùng chung cho mọi vai trò.
// Tự sửa được: họ tên, số điện thoại (có hỏi xác nhận trước khi lưu). Email, vai trò, kho do quản trị viên quản lý.
export default function ProfilePage() {
  const { role, user, login } = useAuth();
  const config = ROLES[role];
  const [me, setMe] = useState(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Hiện ngay thông tin đã lưu lúc đăng nhập, rồi làm mới bằng dữ liệu mới nhất từ máy chủ
  useEffect(() => {
    authApi.me().then(setMe).catch(() => {});
  }, []);

  const p = { ...user, ...me };
  const warehouse = p.warehouseName
    ? `${p.warehouseName}${p.warehouseCode ? ` (${p.warehouseCode})` : ''}`
    : p.warehouse?.name || '';

  const newName = form.fullName.trim();
  const newPhone = form.phone.trim();
  const nameChanged = newName !== (p.fullName || '');
  const phoneChanged = newPhone !== (p.phone || '');

  const startEdit = () => {
    setForm({ fullName: p.fullName || '', phone: p.phone || '' });
    setError('');
    setMessage('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError('');
  };

  // Kiểm tra sơ bộ rồi mới hỏi xác nhận
  const requestSave = () => {
    if (!newName) return setError('Vui lòng nhập họ và tên');
    if (newName.length > 100) return setError('Họ và tên tối đa 100 ký tự');
    if (!PHONE_RE.test(newPhone)) return setError('Số điện thoại không hợp lệ (ví dụ 0912345678)');
    if (!nameChanged && !phoneChanged) return setError('Bạn chưa thay đổi thông tin nào');
    setError('');
    setConfirming(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    try {
      const res = await authApi.updateProfile({ fullName: newName, phone: newPhone });
      login(res); // cập nhật token và thông tin người dùng, tên ở góc trên đổi ngay
      setMe(res.user);
      setEditing(false);
      setConfirming(false);
      setMessage('Đã cập nhật hồ sơ thành công.');
    } catch (err) {
      setConfirming(false);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Hồ sơ của tôi" subtitle="Thông tin tài khoản đang đăng nhập." />

      <div className="card profile-card section">
        <div className="profile-top">
          <div className="profile-avatar" style={{ background: config.color }}>{config.short}</div>
          <div>
            <div className="profile-name">{p.fullName}</div>
            <div className="profile-sub">{config.label}</div>
          </div>
        </div>

        {message && !editing && <div className="profile-ok">{message}</div>}
        {error && <div className="profile-err">{error}</div>}

        <dl className="profile-grid">
          <Row label="Họ và tên">
            {editing ? (
              <input
                className="form-input"
                value={form.fullName}
                maxLength={100}
                autoFocus
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            ) : (
              p.fullName || '—'
            )}
          </Row>
          <Row label="Email">{p.email || '—'}</Row>
          <Row label="Số điện thoại">
            {editing ? (
              <input
                className="form-input"
                value={form.phone}
                inputMode="tel"
                maxLength={12}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            ) : (
              p.phone || '—'
            )}
          </Row>
          <Row label="Vai trò">{config.label}</Row>
          {WAREHOUSE_ROLES.includes(role) && (
            <Row label="Kho phụ trách">{warehouse || 'Chưa được gán kho'}</Row>
          )}
          {p.createdAt && <Row label="Ngày tạo tài khoản">{formatDateTime(p.createdAt)}</Row>}
        </dl>

        {editing && (
          <div className="profile-hint">
            Email, vai trò và kho phụ trách do quản trị viên quản lý. Hãy liên hệ quản trị viên nếu cần thay đổi.
          </div>
        )}

        <div className="profile-actions">
          {editing ? (
            <>
              <button className="btn btn-primary" onClick={requestSave}>Lưu thay đổi</button>
              <button className="btn" onClick={cancelEdit}>Hủy</button>
            </>
          ) : (
            <button className="btn" onClick={startEdit}>Chỉnh sửa hồ sơ</button>
          )}
        </div>
      </div>

      {confirming && (
        <Modal title="Xác nhận thay đổi hồ sơ" onClose={() => !saving && setConfirming(false)}>
          <p style={{ marginTop: 0 }}>Bạn có chắc chắn muốn lưu các thay đổi sau không?</p>
          <ul className="profile-changes">
            {nameChanged && (
              <li>
                <span>Họ và tên</span>
                <s>{p.fullName}</s> → <b>{newName}</b>
              </li>
            )}
            {phoneChanged && (
              <li>
                <span>Số điện thoại</span>
                <s>{p.phone}</s> → <b>{newPhone}</b>
              </li>
            )}
          </ul>
          <div className="form-actions">
            <button type="button" className="btn" disabled={saving} onClick={() => setConfirming(false)}>Quay lại</button>
            <button type="button" className="btn btn-primary" disabled={saving} onClick={confirmSave}>
              {saving ? 'Đang lưu...' : 'Xác nhận lưu'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
