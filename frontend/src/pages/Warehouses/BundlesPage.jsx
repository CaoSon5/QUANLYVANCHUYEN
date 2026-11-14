// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\WarehouseOps\
import { useParams } from 'react-router-dom';
import BundleList from './BundleList';
import BundleDetailPage from './BundleDetailPage';

// /:role/bundles là danh sách bao, /:role/bundles/:id là chi tiết một bao
export default function BundlesPage() {
  const { id } = useParams();
  return id ? <BundleDetailPage id={id} /> : <BundleList />;
}
