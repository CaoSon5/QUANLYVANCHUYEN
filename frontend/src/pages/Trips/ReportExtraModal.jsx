// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import { useState } from 'react';
import Modal from '../../components/common/Modal';
import { tripApi } from '../../api/tripApi';
import { getErrorMessage } from '../../api/authApi';

// FR38: báo bao thừa, thấy trên xe nhưng không có trong phiếu chuyển
export default function ReportExtraModal({ tripId, onClose, onSaved }) {
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return setError('Vui lòng nhập mã bao thừa');
    setError('');
    setLoading(true);
    try {
      const trip = await tripApi.reportExtra(tripId, code.trim(), note.trim() || null);
      onSaved(trip, `Đã ghi nhận bao thừa ${code.trim().toUpperCase()}.`);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title="Báo bao thừa" onClose={onClose}>
      <div className="result-banner" style={{ marginTop: 0 }}>
        Dùng khi thấy một bao trên xe mà <b>không có</b> trong phiếu chuyển của chuyến này. Hệ thống ghi nhận để điều phối viên và Admin xử lý.
      </div>
      <form onSubmit={submit}>
        <label className="form-label">Mã bao (đọc trên tem hoặc nhãn)</label>
        <input className="form-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="BAO26110400001" autoFocus autoComplete="off" />
        <label className="form-label">Ghi chú (không bắt buộc)</label>
        <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Ví dụ: bao rách, không rõ tem" />
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Ghi nhận'}</button>
        </div>
      </form>
    </Modal>
  );
}
