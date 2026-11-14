// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\WarehouseOps\
import { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import { bundleApi } from '../../api/bundleApi';
import { getErrorMessage } from '../../api/authApi';
import { WAREHOUSE_TYPE } from './BundlePill';

// Tạo bao: nhập mã kho đích MỘT LẦN, sau đó chỉ việc quét đơn bỏ vào bao
export default function CreateBundleModal({ onClose, onCreated }) {
  const [options, setOptions] = useState([]);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bundleApi.destinations().then(setOptions).catch(() => {});
  }, []);

  const typed = code.trim().toUpperCase();
  const match = options.find((o) => o.code.toUpperCase() === typed);

  const submit = async (e) => {
    e.preventDefault();
    if (!typed) return setError('Vui lòng nhập mã kho đích');
    setError('');
    setLoading(true);
    try {
      const bundle = await bundleApi.create({ destinationCode: typed, note: note.trim() || null });
      onCreated(bundle);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title="Tạo bao hàng" onClose={onClose}>
      <form onSubmit={submit}>
        <label className="form-label">Mã kho đích</label>
        <input
          className="form-input"
          list="bundle-destinations"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Nhập mã kho, ví dụ HCM"
          autoFocus
          autoComplete="off"
        />
        <datalist id="bundle-destinations">
          {options.map((o) => <option key={o.id} value={o.code}>{o.name}</option>)}
        </datalist>

        {typed && (
          <div className="form-hint" style={{ color: match ? '#15803d' : '#b45309' }}>
            {match
              ? `→ ${match.name} (${WAREHOUSE_TYPE[match.type] ?? match.type}${match.parentCode ? `, thuộc kho vùng ${match.parentCode}` : ''})`
              : 'Chưa khớp mã kho nào. Gõ thử vài chữ để xem gợi ý.'}
          </div>
        )}
        <div className="form-hint">Chỉ nhập mã kho một lần ở đây. Sau đó bạn chỉ cần quét hoặc nhập mã các đơn đi kho này.</div>

        <label className="form-label">Ghi chú (không bắt buộc)</label>
        <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />

        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo bao'}</button>
        </div>
      </form>
    </Modal>
  );
}
