import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import OrderForm from './OrderForm';

// Người bán: tạo yêu cầu lấy hàng (FR63)
export default function CreatePickupPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Tạo yêu cầu lấy hàng"
        subtitle="Điền thông tin người gửi, người nhận và hàng hóa. Shipper tại kho phụ trách sẽ nhận đơn của bạn."
      />
      <div className="section">
        <OrderForm mode="create" onSaved={(order) => navigate(`/seller/my-orders/${order.id}`)} />
      </div>
    </>
  );
}
