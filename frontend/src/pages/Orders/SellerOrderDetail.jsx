import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { orderApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import OrderForm from './OrderForm';
import OrderDetailView from './OrderDetailView';
import OrderStatusPill from './OrderStatusPill';
import '../Accounts/accounts.css';
import '../Warehouses/warehouses.css';
import './orders.css';

export default function SellerOrderDetail({ id }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setOrder(await orderApi.get(id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    setOrder(null);
    setEditing(false);
    load();
  }, [load]);

  const back = <Link className="wh-back" to="/seller/my-orders"><ArrowLeft size={18} /> Đơn hàng của tôi</Link>;

  if (!order) {
    return (
      <>
        {back}
        {error ? <div className="acc-banner">{error}</div> : <div className="acc-empty">Đang tải...</div>}
      </>
    );
  }

  const handleCancel = async () => {
    setBusy(true);
    try {
      setOrder(await orderApi.cancel(order.id, reason.trim() || null));
      setCancelling(false);
      setReason('');
    } catch (err) {
      setError(getErrorMessage(err));
      setCancelling(false);
      load(); // trạng thái có thể đã đổi (shipper vừa nhận)
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {back}

      <div className="od-head">
        <div className="od-title">
          <h1>{order.code}</h1>
          <OrderStatusPill status={order.status} />
        </div>
        {order.canModify && !editing && (
          <div className="wh-actions">
            <button className="btn" onClick={() => setEditing(true)}>Sửa đơn</button>
            <button className="btn" style={{ color: '#b91c1c' }} onClick={() => setCancelling(true)}>Hủy đơn</button>
          </div>
        )}
      </div>

      {error && <div className="acc-banner">{error}</div>}

      {order.canModify && !editing && (
        <div className="od-alert">Đơn đang chờ shipper nhận. Bạn vẫn có thể sửa hoặc hủy cho tới khi có shipper nhận đơn.</div>
      )}
      {!order.canModify && order.status !== 'cancelled' && (
        <div className="od-ok">Đơn đã có shipper nhận và đang được xử lý nên không thể sửa hoặc hủy.</div>
      )}

      {editing ? (
        <div className="section">
          <OrderForm
            mode="edit"
            order={order}
            onSaved={(saved) => { setOrder(saved); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <OrderDetailView order={order} />
      )}

      {cancelling && (
        <Modal title="Hủy yêu cầu lấy hàng" onClose={() => setCancelling(false)}>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginTop: 4 }}>
            Bạn chắc chắn muốn hủy đơn <b>{order.code}</b>? Đơn đã hủy không thể khôi phục.
          </p>
          <label className="form-label">Lý do hủy (không bắt buộc)</label>
          <textarea className="form-input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          <div className="form-actions">
            <button className="btn" onClick={() => setCancelling(false)}>Không hủy</button>
            <button className="btn btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626', boxShadow: 'none' }} disabled={busy} onClick={handleCancel}>
              {busy ? 'Đang hủy...' : 'Hủy đơn'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
