// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import { tripApi } from '../../api/tripApi';
import { getErrorMessage } from '../../api/authApi';
import { WAREHOUSE_TYPE } from '../Warehouses/BundlePill';

// FR22: phân một tài xế rảnh đến một kho để nhận hàng. Chọn kho bằng mã kho.
export default function AssignTripModal({ driver, onClose, onSaved }) {
  const [warehouses, setWarehouses] = useState([]);
  const [code, setCode] = useState(driver.warehouseCode ?? '');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    tripApi.warehouses().then(setWarehouses).catch(() => {});
  }, []);

  const typed = code.trim().toUpperCase();
  const match = warehouses.find((w) => w.code.toUpperCase() === typed);

  const submit = async (e) => {
    e.preventDefault();
    if (!typed) return setError('Vui lòng nhập mã kho tài xế đến nhận hàng');
    setError('');
    setLoading(true);
    try {
      const trip = await tripApi.create({ driverId: driver.id, warehouseCode: typed, note: note.trim() || null });
      onSaved(`Đã phân chuyến ${trip.code}: tài xế ${driver.fullName} đến kho ${trip.pickupCode} nhận hàng.`);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title={`Phân chuyến cho ${driver.fullName}`} onClose={onClose}>
      <div className="result-banner" style={{ marginTop: 0 }}>
        Xe <b>{driver.vehiclePlate}</b> · tải tối đa <b>{driver.capacityKg} kg</b><br />
        {driver.location}
      </div>

      <form onSubmit={submit}>
        <label className="form-label">Mã kho tài xế đến nhận hàng</label>
        <input
          className="form-input"
          list="trip-warehouses"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Nhập mã kho, ví dụ HOCMON"
          autoFocus
          autoComplete="off"
        />
        <datalist id="trip-warehouses">
          {warehouses.map((w) => <option key={w.id} value={w.code}>{w.name}</option>)}
        </datalist>
        {typed && (
          <div className="form-hint" style={{ color: match ? '#15803d' : '#b45309' }}>
            {match
              ? `→ ${match.name} (${WAREHOUSE_TYPE[match.type] ?? match.type})`
              : 'Chưa khớp mã kho nào. Gõ thử vài chữ để xem gợi ý.'}
          </div>
        )}

        <label className="form-label">Ghi chú cho tài xế (không bắt buộc)</label>
        <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />

        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang phân...' : 'Phân chuyến'}</button>
        </div>
      </form>
    </Modal>
  );
}
