import { useEffect, useMemo, useState } from 'react';
import { orderApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatVnd } from '../../utils/format';
import './orders.css';

const PHONE_REGEX = /^(0|\+84)\d{9}$/;
const cleanPhone = (v) => v.replace(/\s/g, '');

// Form tạo / sửa yêu cầu lấy hàng (dùng chung). mode: 'create' | 'edit'
export default function OrderForm({ mode, order, onSaved, onCancel }) {
  const { user } = useAuth();
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    senderName: order?.senderName ?? user?.fullName ?? '',
    senderPhone: order?.senderPhone ?? user?.phone ?? '',
    senderAddress: order?.senderAddress ?? '',
    receiverName: order?.receiverName ?? '',
    receiverPhone: order?.receiverPhone ?? '',
    receiverAddress: order?.receiverAddress ?? '',
    destinationWarehouseId: order?.destinationWarehouseId ?? '',
    itemDescription: order?.itemDescription ?? '',
    quantity: String(order?.quantity ?? 1),
    weightKg: String(order?.weightKg ?? 1),
    declaredValue: String(order?.declaredValue ?? 0),
    codAmount: String(order?.codAmount ?? 0),
    note: order?.note ?? '',
    pickupWarehouseId: order?.pickupWarehouseId ?? '',
  });
  const [warehouses, setWarehouses] = useState([]);
  const [destinations, setDestinations] = useState([]); // quận/huyện (kho địa phương) kèm tỉnh/thành (kho vùng)
  const [regionId, setRegionId] = useState('');
  const [fee, setFee] = useState(order?.shippingFee ?? null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  useEffect(() => {
    orderApi.pickupWarehouses().then(setWarehouses).catch(() => {});
    orderApi.destinations().then(setDestinations).catch(() => {});
  }, []);

  // Danh sách tỉnh/thành (không trùng) và quận/huyện thuộc tỉnh đang chọn
  const regions = useMemo(() => {
    const map = new Map();
    destinations.forEach((d) => { if (!map.has(d.regionId)) map.set(d.regionId, d.regionName); });
    return [...map].map(([id, name]) => ({ id, name }));
  }, [destinations]);
  const districts = destinations.filter((d) => d.regionId === regionId);

  // Khi sửa đơn: tự chọn lại tỉnh/thành của quận/huyện đã lưu
  useEffect(() => {
    if (regionId || !form.destinationWarehouseId) return;
    const d = destinations.find((x) => x.id === form.destinationWarehouseId);
    if (d) setRegionId(d.regionId);
  }, [destinations, form.destinationWarehouseId, regionId]);

  // Tính phí dự kiến theo cân nặng (đợi 0,4 giây sau khi ngừng gõ)
  useEffect(() => {
    const w = Number(form.weightKg);
    if (!(w > 0)) {
      setFee(null);
      return undefined;
    }
    const t = setTimeout(() => {
      orderApi.fee(w).then((r) => setFee(r.fee)).catch(() => setFee(null));
    }, 400);
    return () => clearTimeout(t);
  }, [form.weightKg]);

  // Giữ lại kho hiện tại của đơn trong danh sách dù kho đã ngừng hoạt động
  const options = [...warehouses];
  if (isEdit && order.pickupWarehouseId && !options.some((w) => w.id === order.pickupWarehouseId)) {
    options.push({ id: order.pickupWarehouseId, code: order.pickupWarehouseCode, name: order.pickupWarehouseName });
  }

  const validate = () => {
    const required = [
      ['senderName', 'Vui lòng nhập tên người gửi'],
      ['senderAddress', 'Vui lòng nhập địa chỉ lấy hàng'],
      ['receiverName', 'Vui lòng nhập tên người nhận'],
      ['receiverAddress', 'Vui lòng nhập địa chỉ người nhận'],
      ['itemDescription', 'Vui lòng nhập nội dung hàng hóa'],
    ];
    for (const [field, msg] of required) if (!form[field].trim()) return msg;

    if (!PHONE_REGEX.test(cleanPhone(form.senderPhone))) return 'Số điện thoại người gửi không hợp lệ';
    if (!PHONE_REGEX.test(cleanPhone(form.receiverPhone))) return 'Số điện thoại người nhận không hợp lệ';

    const q = Number(form.quantity);
    if (!Number.isInteger(q) || q < 1 || q > 1000) return 'Số kiện phải là số nguyên từ 1 đến 1000';
    const w = Number(form.weightKg);
    if (!(w >= 0.01 && w <= 1000)) return 'Cân nặng phải từ 0,01 đến 1000 kg';
    if (!(Number(form.declaredValue) >= 0)) return 'Giá trị hàng không hợp lệ';
    if (!(Number(form.codAmount) >= 0)) return 'Tiền thu hộ (COD) không hợp lệ';
    if (!regionId) return 'Vui lòng chọn tỉnh/thành người nhận';
    if (!form.destinationWarehouseId) return 'Vui lòng chọn quận/huyện người nhận';
    if (!form.pickupWarehouseId) return 'Vui lòng chọn kho lấy hàng';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);

    setError('');
    setLoading(true);
    try {
      const body = {
        senderName: form.senderName.trim(),
        senderPhone: cleanPhone(form.senderPhone),
        senderAddress: form.senderAddress.trim(),
        receiverName: form.receiverName.trim(),
        receiverPhone: cleanPhone(form.receiverPhone),
        receiverAddress: form.receiverAddress.trim(),
        destinationWarehouseId: form.destinationWarehouseId,
        itemDescription: form.itemDescription.trim(),
        quantity: Number(form.quantity),
        weightKg: Number(form.weightKg),
        declaredValue: Number(form.declaredValue),
        codAmount: Number(form.codAmount),
        note: form.note.trim() || null,
        pickupWarehouseId: form.pickupWarehouseId,
      };
      const saved = isEdit ? await orderApi.update(order.id, body) : await orderApi.create(body);
      onSaved(saved);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="of-section" style={{ marginTop: 0 }}>
        <h3>Người gửi (nơi lấy hàng)</h3>
        <div className="of-grid">
          <div>
            <label className="form-label">Họ tên người gửi</label>
            <input className="form-input" value={form.senderName} onChange={set('senderName')} />
          </div>
          <div>
            <label className="form-label">Số điện thoại</label>
            <input className="form-input" value={form.senderPhone} onChange={set('senderPhone')} placeholder="0901234567" />
          </div>
          <div className="full">
            <label className="form-label">Địa chỉ lấy hàng</label>
            <input className="form-input" value={form.senderAddress} onChange={set('senderAddress')} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
          </div>
          <div className="full">
            <label className="form-label">Kho lấy hàng (kho phụ trách khu vực của bạn)</label>
            <select className="form-input" value={form.pickupWarehouseId} onChange={set('pickupWarehouseId')}>
              <option value="">— Chọn kho —</option>
              {options.map((w) => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
            </select>
            {options.length === 0 && <div className="form-hint">Hệ thống chưa có kho địa phương nào. Vui lòng liên hệ quản lý.</div>}
          </div>
        </div>
      </div>

      <div className="of-section">
        <h3>Người nhận</h3>
        <div className="of-grid">
          <div>
            <label className="form-label">Họ tên người nhận</label>
            <input className="form-input" value={form.receiverName} onChange={set('receiverName')} />
          </div>
          <div>
            <label className="form-label">Số điện thoại</label>
            <input className="form-input" value={form.receiverPhone} onChange={set('receiverPhone')} placeholder="0901234567" />
          </div>
          <div className="full">
            <label className="form-label">Địa chỉ giao hàng</label>
            <input className="form-input" value={form.receiverAddress} onChange={set('receiverAddress')} placeholder="Số nhà, đường, phường/xã" />
          </div>
          <div>
            <label className="form-label">Tỉnh / Thành phố</label>
            <select
              className="form-input" value={regionId}
              onChange={(e) => { setRegionId(e.target.value); setForm({ ...form, destinationWarehouseId: '' }); }}
            >
              <option value="">— Chọn tỉnh/thành —</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Quận / Huyện</label>
            <select
              className="form-input" value={form.destinationWarehouseId} onChange={set('destinationWarehouseId')}
              disabled={!regionId}
            >
              <option value="">— Chọn quận/huyện —</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {destinations.length === 0 && <div className="form-hint">Hệ thống chưa có khu vực nhận hàng nào. Vui lòng liên hệ quản lý.</div>}
          </div>
        </div>
      </div>

      <div className="of-section">
        <h3>Hàng hóa</h3>
        <div className="of-grid">
          <div className="full">
            <label className="form-label">Nội dung hàng hóa</label>
            <input className="form-input" value={form.itemDescription} onChange={set('itemDescription')} placeholder="Quần áo, giày dép..." />
          </div>
        </div>
        <div className="of-grid-3">
          <div>
            <label className="form-label">Số kiện</label>
            <input className="form-input" type="number" min="1" value={form.quantity} onChange={set('quantity')} />
          </div>
          <div>
            <label className="form-label">Cân nặng (kg)</label>
            <input className="form-input" type="number" min="0.01" step="0.01" value={form.weightKg} onChange={set('weightKg')} />
          </div>
          <div>
            <label className="form-label">Giá trị hàng (đ)</label>
            <input className="form-input" type="number" min="0" step="1000" value={form.declaredValue} onChange={set('declaredValue')} />
          </div>
        </div>
        <div className="of-grid">
          <div>
            <label className="form-label">Tiền thu hộ - COD (đ)</label>
            <input className="form-input" type="number" min="0" step="1000" value={form.codAmount} onChange={set('codAmount')} />
            <div className="form-hint">Nhập 0 nếu người nhận không phải trả tiền khi nhận hàng.</div>
          </div>
          <div>
            <label className="form-label">Ghi chú cho shipper (không bắt buộc)</label>
            <input className="form-input" value={form.note} onChange={set('note')} placeholder="Gọi trước khi đến, hàng dễ vỡ..." />
          </div>
        </div>
      </div>

      <div className="of-fee">
        <span>Phí vận chuyển dự kiến</span>
        <b>{fee == null ? '—' : formatVnd(fee)}</b>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="of-actions">
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Hủy</button>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Gửi yêu cầu lấy hàng'}
        </button>
      </div>
    </form>
  );
}
