// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Orders\
import { useParams } from 'react-router-dom';
import AdminOrdersList from './AdminOrdersList';
import OrderDetailPage from './OrderDetailPage';

// /<vai trò>/orders -> danh sách mọi đơn; /<vai trò>/orders/<id> -> chi tiết (chỉ xem)
export default function AdminOrdersPage() {
  const { id } = useParams();
  return id ? <OrderDetailPage id={id} /> : <AdminOrdersList />;
}
