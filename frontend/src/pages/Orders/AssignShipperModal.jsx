// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Orders\
import { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import { orderApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';

// FR27: Điều phối viên, Admin phân công thủ công một shipper cho đơn (trường hợp ngoại lệ)
export default function AssignShipperModal({ order, onClose, onDone }) {
  const pickup = order.status === 'pending_pickup';
  const [shippers, setShippers] = useState(null);
  const [shipperId, setShipperId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    orderApi.assignableShippers(order.id).then(setShippers).catch((err) => { setError(getErrorMessage(err)); setShippers([]); });
  }, [order.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!shipperId) return setError('Vui lòng chọn shipper');
    setError('');
    setLoading(true);
    try {
      onDone(await orderApi.assign(order.id, shipperId));
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title={`Phân công shipper ${order.code}`} onClose={onClose}>
      <div className="result-banner" style={{ marginTop: 0 }}>
        {pickup ? 'Phân công shipper đến lấy hàng.' : 'Phân công shipper nhận giao hàng.'}
        {' '}Chỉ dùng khi cần xử lý ngoại lệ. Bình thường shipper tự chọn đơn.
      </div>

      <form onSubmit={submit}>
        <label className="form-label">Shipper của kho {pickup ? 'lấy hàng' : 'đang giữ hàng'}</label>
        {shippers === null ? (
          <div className="muted">Đang tải...</div>
        ) : (
          <select className="form-input" value={shipperId} onChange={(e) => setShipperId(e.target.value)} autoFocus>
            <option value="">— Chọn shipper —</option>
            {shippers.map((s) => <option key={s.id} value={s.id}>{s.fullName} · {s.phone}</option>)}
          </select>
        )}
        {shippers && shippers.length === 0 && !error && <div className="form-hint">Kho này chưa có shipper nào đang hoạt động.</div>}

        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading || !shippers}>{loading ? 'Đang lưu...' : 'Phân công'}</button>
        </div>
      </form>
    </Modal>
  );
}
