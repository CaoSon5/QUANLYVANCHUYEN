import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi, getErrorMessage } from '../../api/authApi';
import AuthLayout from '../Login/AuthLayout';
import '../Login/login.css';

const PHONE_REGEX = /^(0|\+84)\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Trả về thông báo lỗi đầu tiên, hoặc '' nếu hợp lệ
  const validate = () => {
    if (!form.fullName.trim()) return 'Vui lòng nhập họ và tên';
    if (!EMAIL_REGEX.test(form.email.trim())) return 'Email không hợp lệ';
    if (!PHONE_REGEX.test(form.phone.replace(/\s/g, ''))) return 'Số điện thoại không hợp lệ';
    if (form.password.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
    if (form.password !== form.confirm) return 'Mật khẩu nhập lại không khớp';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);

    setError('');
    setLoading(true);
    try {
      const data = await authApi.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\s/g, ''),
        password: form.password,
      });
      login(data); // đăng ký xong tự đăng nhập
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
        <h2>Đăng ký tài khoản</h2>
        <p className="login-desc">
          Dành cho người bán muốn gửi hàng qua Spree Express. Tài khoản nhân viên do Quản lý cấp.
        </p>

        <label className="label">Họ và tên</label>
        <input className="input" placeholder="Nguyễn Văn A" value={form.fullName} onChange={set('fullName')} />

        <label className="label">Email</label>
        <input className="input" type="email" placeholder="ban@email.com" value={form.email} onChange={set('email')} />

        <label className="label">Số điện thoại</label>
        <input className="input" placeholder="0901234567" value={form.phone} onChange={set('phone')} />

        <label className="label">Mật khẩu</label>
        <div className="input pw">
          <input type={showPw ? 'text' : 'password'} placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={set('password')} />
          <button type="button" onClick={() => setShowPw(!showPw)}>{showPw ? 'Ẩn' : 'Hiện'}</button>
        </div>

        <label className="label">Nhập lại mật khẩu</label>
        <input className="input" type={showPw ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} />

        {error && <div className="error-box" style={{ marginTop: 20 }}>{error}</div>}

        <button className="btn btn-primary submit" type="submit" disabled={loading} style={{ marginTop: 24 }}>
          {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>

        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
