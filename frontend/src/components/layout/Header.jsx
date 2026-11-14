// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\components\layout\
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, KeyRound, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/roles';
import './layout.css';
import './user-menu.css';

// Vai trò có trang danh sách đơn hàng để tra cứu mã vận đơn
const SEARCH_ROLES = ['admin', 'dispatcher'];

export default function Header() {
  const navigate = useNavigate();
  const { role, user, logout } = useAuth();
  const config = ROLES[role];
  const [query, setQuery] = useState('');
  const canSearch = SEARCH_ROLES.includes(role);

  // Menu thả xuống ở tên tài khoản: đóng khi bấm ra ngoài hoặc nhấn Esc
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

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
        <div className="divider" />
        <div className="user-menu-wrap" ref={menuRef}>
          <div
            className="user-chip"
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen((v) => !v);
              }
            }}
          >
            <div className="avatar">{config.short}</div>
            <div>
              <div className="user-name">{user.fullName}</div>
              <div className="user-role">{config.label}</div>
            </div>
            <ChevronDown size={16} className={`user-chevron${open ? ' open' : ''}`} />
          </div>

          {open && (
            <div className="user-menu" role="menu">
              <div className="user-menu-head">
                <b>{user.fullName}</b>
                <span>{config.label}</span>
                {user.email && <span className="user-menu-email">{user.email}</span>}
              </div>
              <button className="user-menu-item" role="menuitem" onClick={() => go(`/${role}/profile`)}>
                <User size={16} /> Xem hồ sơ
              </button>
              <button className="user-menu-item" role="menuitem" onClick={() => go('/change-password')}>
                <KeyRound size={16} /> Đổi mật khẩu
              </button>
              <div className="user-menu-sep" />
              <button className="user-menu-item danger" role="menuitem" onClick={handleLogout}>
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
