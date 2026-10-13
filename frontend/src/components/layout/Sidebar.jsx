// Đặt vào: D:\spreeexpress\frontend\src\components\layout\
import { NavLink } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../config/roles';
import './layout.css';

export default function Sidebar() {
  const { role } = useAuth();
  const config = ROLES[role];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-box"><Truck size={22} /></div>
        <div>
          <div className="logo-name">SPREE <span>EXPRESS</span></div>
          <div className="logo-sub">LOGISTICS</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">QUẢN LÝ</div>
        {config.menu.map(({ slug, label, icon: Icon, badge }) => (
          <NavLink
            key={slug}
            to={`/${role}/${slug}`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
            {badge && <em className="nav-badge">{badge}</em>}
          </NavLink>
        ))}
      </nav>

      <div className="role-box">
        <small>ĐANG ĐĂNG NHẬP</small>
        <strong>{config.label}</strong>
        <span>{config.desc}</span>
      </div>
    </aside>
  );
}
