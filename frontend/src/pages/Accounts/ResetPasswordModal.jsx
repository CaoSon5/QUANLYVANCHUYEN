import { useState } from 'react';
import Modal from '../../components/common/Modal';
import { userApi } from '../../api/userApi';
import { getErrorMessage } from '../../api/authApi';

export default function ResetPasswordModal({ user, onClose, onSaved }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');

    setError('');
    setLoading(true);
    try {
      await userApi.resetPassword(user.id, password);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title="Đặt lại mật khẩu" onClose={onClose}>
      <p style={{ color: 'var(--muted)', marginTop: 4, lineHeight: 1.6 }}>
        Đặt mật khẩu tạm cho <b>{user.fullName}</b> ({user.email}). Hãy gửi mật khẩu này cho họ, họ sẽ phải đổi lại khi đăng nhập{user.role === 'admin' ? '' : ' lần tới'}.
      </p>

      <form onSubmit={handleSubmit}>
        <label className="form-label">Mật khẩu mới</label>
        <input
          className="form-input"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Tối thiểu 6 ký tự"
          autoFocus
        />
        <label style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>
          <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} /> Hiện mật khẩu
        </label>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
