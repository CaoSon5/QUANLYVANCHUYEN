import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi, getErrorMessage } from '../../api/authApi';
import AuthLayout from './AuthLayout';
import './login.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Hệ thống chưa có admin -> chuyển sang trang thiết lập lần đầu
  useEffect(() => {
    authApi
      .setupStatus()
      .then((s) => s.needsSetup && navigate('/setup', { replace: true }))
      .catch(() => {}); // backend chưa chạy: bỏ qua, lúc đăng nhập sẽ báo lỗi
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login({ identifier, password });
      login(data);
      // Tài khoản do Admin tạo: bắt buộc đổi mật khẩu ở lần đăng nhập đầu
      if (data.user.mustChangePassword) {
        navigate('/change-password');
        return;
      }
      // Vai trò do server trả về, đưa vào đúng giao diện của vai trò đó
      navigate(`/${data.user.role}/dashboard`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Đăng nhập hệ thống</h2>
        <p className="login-desc">Đăng nhập bằng tài khoản do quản lý cấp hoặc tài khoản người bán của bạn.</p>

        <label className="label">Email hoặc số điện thoại</label>
        <input
          className="input"
          placeholder="ban@email.com hoặc 0901234567"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoFocus
        />

        <label className="label">Mật khẩu</label>
        <div className="input pw">
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" onClick={() => setShowPw(!showPw)}>{showPw ? 'Ẩn' : 'Hiện'}</button>
        </div>

        <div className="row-between">
          <label className="remember"><input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập</label>
          <a href="#" className="link">Quên mật khẩu?</a>
        </div>

        {error && <div className="error-box">{error}</div>}

        <button className="btn btn-primary submit" type="submit" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : <>Đăng nhập <ChevronRight size={18} /></>}
        </button>

        <p className="auth-switch">
          Bạn là người bán mới? <Link to="/register">Đăng ký tài khoản</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
