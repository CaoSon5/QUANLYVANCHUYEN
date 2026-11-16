// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import { tripApi } from '../../api/tripApi';
import { getErrorMessage } from '../../api/authApi';

// FR24: đổi tài xế hoặc đổi kho nhận hàng khi tài xế chưa đến kho
export default function ReassignTripModal({ trip, drivers, onClose, onSaved }) {
  const [warehouses, setWarehouses] = useState([]);
  const [driverId, setDriverId] = useState(trip.driverId);
  const [code, setCode] = useState(trip.pickupCode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    tripApi.warehouses().then(setWarehouses).catch(() => {});
  }, []);

  // Tài xế chọn được: đang rảnh và có xe, cộng tài xế hiện tại của chuyến
  const options = drivers.filter((d) => d.id === trip.driverId || (d.isIdle && d.hasVehicle));
  const typed = code.trim().toUpperCase();

  const submit = async (e) => {
    e.preventDefault();
    const driverChanged = driverId !== trip.driverId;
    const warehouseChanged = typed && typed !== trip.pickupCode.toUpperCase();
    if (!driverChanged && !warehouseChanged) return setError('Bạn chưa đổi gì');

    setError('');
    setLoading(true);
    try {
      await tripApi.reassign(trip.id, {
        driverId: driverChanged ? driverId : null,
        warehouseCode: warehouseChanged ? typed : null,
      });
      onSaved(`Đã cập nhật chuyến ${trip.code}.`);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title={`Đổi chuyến ${trip.code}`} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="form-label">Tài xế</label>
        <select className="form-input" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
          {options.map((d) => (
            <option key={d.id} value={d.id}>{d.fullName} · {d.vehiclePlate} · {d.capacityKg} kg{d.id === trip.driverId ? ' (hiện tại)' : ''}</option>
          ))}
        </select>

        <label className="form-label">Mã kho tài xế đến nhận hàng</label>
        <input className="form-input" list="reassign-warehouses" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
        <datalist id="reassign-warehouses">
          {warehouses.map((w) => <option key={w.id} value={w.code}>{w.name}</option>)}
        </datalist>
        <div className="form-hint">Chỉ đổi được khi tài xế chưa đến kho. Chuyến đã chạy thì hủy hoặc chờ hoàn thành.</div>

        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </div>
      </form>
    </Modal>
  );
}
