// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\routes\
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';
import SetupPage from '../pages/Setup/SetupPage';
import ChangePasswordPage from '../pages/ChangePassword/ChangePasswordPage';
import RolePage from '../pages/RolePage';
import PublicTrackingPage from '../pages/Tracking/PublicTrackingPage';

// Chỉ cho vào khi đã đăng nhập và đúng role trên URL
function RequireAuth({ children }) {
  const { role, user } = useAuth();
  const { role: urlRole } = useParams();

  if (!role || !ROLES[role]) return <Navigate to="/login" replace />;
  // Chưa đổi mật khẩu lần đầu thì không cho vào hệ thống
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (urlRole !== role) return <Navigate to={`/${role}/dashboard`} replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* Trang công khai cho khách nhận hàng, không cần đăng nhập (FR69) */}
      <Route path="/tra-cuu" element={<PublicTrackingPage />} />
      <Route path="/tra-cuu/:code" element={<PublicTrackingPage />} />

      <Route path="/:role" element={<RequireAuth><MainLayout /></RequireAuth>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path=":page" element={<RolePage />} />
        <Route path=":page/:id" element={<RolePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
