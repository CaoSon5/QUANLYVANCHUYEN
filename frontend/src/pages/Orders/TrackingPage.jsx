import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { orderApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import OrderDetailView from './OrderDetailView';
import OrderStatusPill from './OrderStatusPill';
import '../Accounts/accounts.css';
import './orders.css';

// Người bán: tra cứu hành trình bằng mã vận đơn (FR65). Đường dẫn: /seller/tracking/<mã>
export default function TrackingPage() {
  const navigate = useNavigate();
  const { id: codeParam } = useParams();

  const [code, setCode] = useState(codeParam ?? '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!codeParam) {
      setOrder(null);
      setError('');
      return;
    }
    setCode(codeParam);
    setLoading(true);
    setError('');
    orderApi
      .byCode(codeParam)
      .then(setOrder)
      .catch((err) => { setOrder(null); setError(getErrorMessage(err)); })
      .finally(() => setLoading(false));
  }, [codeParam]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) navigate(`/seller/tracking/${encodeURIComponent(c)}`);
  };

  return (
    <>
      <PageHeader title="Tra cứu hành trình" subtitle="Nhập mã vận đơn để xem đơn hàng đang ở đâu." />

      <form className="card section" onSubmit={handleSubmit}>
        <div className="track-box">
          <input className="form-input" placeholder="Ví dụ: SPR25062400128" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
          <button className="btn btn-primary" type="submit"><Search size={18} /> Tra cứu</button>
        </div>
        {error && <div className="form-error">{error}</div>}
      </form>

      {loading && <div className="acc-empty">Đang tìm...</div>}

      {order && (
        <>
          <div className="od-head section">
            <div className="od-title">
              <h1>{order.code}</h1>
              <OrderStatusPill status={order.status} />
            </div>
          </div>
          <OrderDetailView order={order} />
        </>
      )}
    </>
  );
}
