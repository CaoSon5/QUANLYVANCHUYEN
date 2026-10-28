// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Deliveries\
import { useState } from 'react';
import Modal from '../../components/common/Modal';
import { deliveryApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { FAILURE_REASONS } from '../../config/orderStatus';
import PhotoPicker from './PhotoPicker';

// Giao thất bại: chọn lý do (FR54), ghi chú và ảnh (không bắt buộc)
export default function FailModal({ order, onClose, onSaved }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const attemptNo = order.deliveryAttempts + 1;
  const isLast = attemptNo >= order.maxDeliveryAttempts;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return setError('Vui lòng chọn lý do giao thất bại');

    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('reason', reason);
      if (note.trim()) fd.append('note', note.trim());
      photos.forEach((f) => fd.append('photos', f));
      await deliveryApi.fail(order.id, fd);
      onSaved(
        isLast
          ? `Đã ghi nhận giao thất bại đơn ${order.code}. Đơn hết số lần giao lại nên chuyển sang chờ hoàn hàng.`
          : `Đã ghi nhận giao thất bại đơn ${order.code}. Hãy mang hàng về kho, đơn sẽ được giao lại.`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title={`Giao thất bại ${order.code}`} onClose={onClose}>
      <div className="result-banner">
        Người nhận: <b>{order.receiverName}</b> · {order.receiverPhone}<br />
        Đây là lần giao thứ <b>{attemptNo}/{order.maxDeliveryAttempts}</b>.{' '}
        {isLast
          ? 'Nếu thất bại lần này, đơn sẽ chuyển sang chờ hoàn hàng về người bán.'
          : 'Nếu thất bại, hãy mang hàng về kho để giao lại sau.'}
      </div>

      <form onSubmit={handleSubmit}>
        <label className="form-label">Lý do</label>
        <select className="form-input" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="">— Chọn lý do —</option>
          {Object.entries(FAILURE_REASONS).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
        </select>

        <label className="form-label">Ghi chú (không bắt buộc)</label>
        <textarea className="form-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Ví dụ: gọi 3 cuộc không bắt máy, nhà khóa cửa..." />

        <label className="form-label">Ảnh minh chứng</label>
        <PhotoPicker files={photos} onChange={setPhotos} />

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626', boxShadow: 'none' }} disabled={loading}>
            {loading ? 'Đang gửi...' : 'Xác nhận giao thất bại'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
