import { Navigate, useParams } from 'react-router-dom';
import { ROLES } from '../config/roles';
import { PAGES } from './pageRegistry';
import RoleDashboard from './Dashboard/RoleDashboard';
import GenericPage from './Generic/GenericPage';

// Chọn trang theo URL /:role/:page dựa trên config/roles.js và pageRegistry.js
export default function RolePage() {
  const { role, page } = useParams();
  const config = ROLES[role];
  const item = config?.menu.find((m) => m.slug === page);

  if (!item) return <Navigate to={`/${role}/dashboard`} replace />;
  if (page === 'dashboard') return <RoleDashboard config={config} />;

  const Custom = PAGES[`${role}/${page}`];
  if (Custom) return <Custom />;

  return <GenericPage item={item} />;
}
