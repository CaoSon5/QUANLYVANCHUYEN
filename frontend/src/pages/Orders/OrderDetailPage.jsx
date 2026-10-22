// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Orders\
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { orderApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import OrderDetailView from './OrderDetailView';
import OrderStatusPill from './OrderStatusPill';
import '../Accounts/accounts.css';
import '../Warehouses/warehouses.css';
import './orders.css';

// Chi tiết một đơn (chỉ xem) cho Admin, Điều phối viên. Đường dẫn: /<vai trò>/orders/<id>
export default function OrderDetailPage({ id }) {
  const { role } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setOrder(null);
    setError('');
    orderApi.get(id).then(setOrder).catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  const back = <Link className="wh-back" to={`/${role}/orders`}><ArrowLeft size={18} /> Danh sách đơn hàng</Link>;

  if (!order) {
    return (
      <>
        {back}
        {error ? <div className="acc-banner">{error}</div> : <div className="acc-empty">Đang tải...</div>}
      </>
    );
  }

  return (
    <>
      {back}
      <div className="od-head">
        <div className="od-title">
          <h1>{order.code}</h1>
          <OrderStatusPill status={order.status} />
        </div>
      </div>
      <div className="od-ok" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' }}>
        Người bán: <b>{order.sellerName}</b>
      </div>
      <OrderDetailView order={order} />
    </>
  );
}
