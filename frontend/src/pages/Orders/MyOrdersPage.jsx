import { useParams } from 'react-router-dom';
import MyOrdersList from './MyOrdersList';
import SellerOrderDetail from './SellerOrderDetail';

// /seller/my-orders -> danh sách; /seller/my-orders/<id> -> chi tiết
export default function MyOrdersPage() {
  const { id } = useParams();
  return id ? <SellerOrderDetail id={id} /> : <MyOrdersList />;
}
