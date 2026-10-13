import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/roles';
import './layout.css';

export default function Header() {
  const navigate = useNavigate();
  const { role, user, logout } = useAuth();
  const config = ROLES[role];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="search-box">
        <Search size={16} />
        <input placeholder="Tra cứu mã vận đơn..." />
        <kbd>⌘ K</kbd>
      </div>

      <div className="header-right">
        <button className="icon-btn" aria-label="Thông báo">
          <Bell size={20} />
          <span className="dot" />
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
