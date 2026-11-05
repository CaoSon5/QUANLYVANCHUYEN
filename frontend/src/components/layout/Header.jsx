// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\components\layout\
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/roles';
import './layout.css';

// Vai trò có trang danh sách đơn hàng để tra cứu mã vận đơn
const SEARCH_ROLES = ['admin', 'dispatcher'];

export default function Header() {
  const navigate = useNavigate();
  const { role, user, logout } = useAuth();
  const config = ROLES[role];
  const [query, setQuery] = useState('');
  const canSearch = SEARCH_ROLES.includes(role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Gõ mã vận đơn (hoặc tên người nhận) rồi Enter: mở danh sách đơn đã lọc sẵn
  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!canSearch || !q) return;
    navigate(`/${role}/orders?search=${encodeURIComponent(q)}`);
  };

  return (
    <header className="header">
      <form className="search-box" onSubmit={handleSearch}>
        <Search size={16} />
        <input
          placeholder="Tra cứu mã vận đơn..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {canSearch && <kbd>Enter</kbd>}
      </form>

      <div className="header-right">
        <button className="icon-btn" aria-label="Thông báo">
          <Bell size={20} />
        </button>
        <button
          className="icon-btn"
          title="Đổi mật khẩu"
          aria-label="Đổi mật khẩu"
          onClick={() => navigate('/change-password')}
        >
          <KeyRound size={20} />
        </button>
        <div className="divider" />
        <div className="user-chip">
          <div className="avatar">{config.short}</div>
          <div>
            <div className="user-name">{user.fullName}</div>
            <div className="user-role">{config.label}</div>
          </div>
          <ChevronDown size={16} />
        </div>
        <button className="btn" onClick={handleLogout}>Đăng xuất</button>
      </div>
    </header>
  );
}
