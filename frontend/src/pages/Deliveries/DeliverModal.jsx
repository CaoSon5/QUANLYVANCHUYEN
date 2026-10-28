// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Deliveries\
import { useState } from 'react';
import Modal from '../../components/common/Modal';
import { deliveryApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { formatVnd } from '../../utils/format';
import PhotoPicker from './PhotoPicker';

// Giao thành công: ghi nhận số COD thực thu, ghi chú và ảnh bàn giao (không bắt buộc)
export default function DeliverModal({ order, onClose, onSaved }) {
  const [collected, setCollected] = useState(String(order.codAmount));
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const amount = Number(collected);
  const differs = Number.isFinite(amount) && amount !== order.codAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Number.isFinite(amount) || amount < 0) return setError('Số tiền thu không hợp lệ');
    if (differs && !note.trim()) return setError('Số tiền thu khác số COD của đơn, vui lòng ghi chú lý do');

    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('collectedAmount', String(amount));
      if (note.trim()) fd.append('note', note.trim());
      photos.forEach((f) => fd.append('photos', f));
      await deliveryApi.deliver(order.id, fd);
      onSaved(`Đã cập nhật đơn ${order.code}: giao thành công.`);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title={`Giao thành công ${order.code}`} onClose={onClose}>
      <div className="result-banner">
        Người nhận: <b>{order.receiverName}</b> · {order.receiverPhone}<br />
        COD cần thu: <b>{order.codAmount > 0 ? formatVnd(order.codAmount) : 'không thu (đã thanh toán)'}</b>
      </div>

      <form onSubmit={handleSubmit}>
        <label className="form-label">Số tiền COD thực thu (đ)</label>
        <input className="form-input" type="number" min="0" step="1000" value={collected} onChange={(e) => setCollected(e.target.value)} autoFocus />
        {differs && <div className="form-hint" style={{ color: '#b45309' }}>Số tiền khác COD của đơn, bạn cần ghi chú lý do bên dưới.</div>}

        <label className="form-label">Ghi chú (không bắt buộc)</label>
        <textarea className="form-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Ví dụ: người nhận là người nhà, để hàng ở bảo vệ..." />

        <label className="form-label">Ảnh bàn giao</label>
        <PhotoPicker files={photos} onChange={setPhotos} />

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang gửi...' : 'Xác nhận giao thành công'}</button>
        </div>
      </form>
    </Modal>
  );
}
