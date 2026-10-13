import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi, getErrorMessage } from '../../api/authApi';
import AuthLayout from '../Login/AuthLayout';
import '../Login/login.css';

// Trang đổi mật khẩu. Tài khoản do Admin tạo/đặt lại mật khẩu bị đưa tới đây ở lần đăng nhập đầu.
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { token, user, login, logout } = useAuth();

  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token || !user) return <Navigate to="/login" replace />;

  const forced = user.mustChangePassword;
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    if (!form.current) return 'Vui lòng nhập mật khẩu hiện tại';
    if (form.next.length < 6) return 'Mật khẩu mới tối thiểu 6 ký tự';
    if (form.next === form.current) return 'Mật khẩu mới phải khác mật khẩu hiện tại';
    if (form.next !== form.confirm) return 'Mật khẩu nhập lại không khớp';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);

    setError('');
    setLoading(true);
    try {
      const data = await authApi.changePassword({
        currentPassword: form.current,
        newPassword: form.next,
      });
      login(data); // cập nhật token và thông tin mới (đã hết bắt buộc đổi mật khẩu)
      navigate(`/${data.user.role}/dashboard`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="login-form">
        <h2>{forced ? 'Đổi mật khẩu lần đầu' : 'Đổi mật khẩu'}</h2>
        <p className="login-desc">
          {forced ? (
            <>Xin chào <b>{user.fullName}</b>. Mật khẩu hiện tại do quản lý cấp nên chỉ dùng tạm. Vui lòng đặt mật khẩu của riêng bạn để tiếp tục.</>
          ) : (
            'Nhập mật khẩu hiện tại và mật khẩu mới.'
          )}
        </p>

        <label className="label">{forced ? 'Mật khẩu tạm được cấp' : 'Mật khẩu hiện tại'}</label>
        <input className="input" type={showPw ? 'text' : 'password'} value={form.current} onChange={set('current')} autoFocus />

        <label className="label">Mật khẩu mới</label>
        <input className="input" type={showPw ? 'text' : 'password'} placeholder="Tối thiểu 6 ký tự" value={form.next} onChange={set('next')} />

        <label className="label">Nhập lại mật khẩu mới</label>
        <input className="input" type={showPw ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} />

        <label className="remember" style={{ marginTop: 14 }}>
          <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} /> Hiện mật khẩu
        </label>

        {error && <div className="error-box" style={{ marginTop: 20 }}>{error}</div>}

        <button className="btn btn-primary submit" type="submit" disabled={loading} style={{ marginTop: 24 }}>
          {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
        </button>

        <p className="auth-switch">
          {forced ? (
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Đăng xuất</a>
          ) : (
            <Link to={`/${user.role}/dashboard`}>Quay lại</Link>
          )}
        </p>
      </form>
    </AuthLayout>
  );
}
