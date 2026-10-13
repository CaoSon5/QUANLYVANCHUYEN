// Đặt vào: D:\spreeexpress\frontend\src\pages\Warehouses\
import { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import { warehouseApi } from '../../api/warehouseApi';
import { getErrorMessage } from '../../api/authApi';

const CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9-]{1,19}$/;

export default function WarehouseFormModal({ mode, warehouse, onClose, onSaved }) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    code: '',
    name: warehouse?.name ?? '',
    address: warehouse?.address ?? '',
    type: warehouse?.type ?? 'regional',
    parentId: warehouse?.parentId ?? '',
  });
  const [regionals, setRegionals] = useState([]);
  const [loadedRegionals, setLoadedRegionals] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Danh sách kho vùng đang hoạt động để chọn "kho vùng quản lý"
  useEffect(() => {
    warehouseApi
      .options()
      .then((list) => setRegionals(list.filter((w) => w.type === 'regional' && w.id !== warehouse?.id)))
      .catch(() => {})
      .finally(() => setLoadedRegionals(true));
  }, [warehouse?.id]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Giữ lại kho vùng hiện tại trong danh sách dù nó đã ngừng hoạt động
  const parentOptions = [...regionals];
  if (isEdit && warehouse.parentId && !parentOptions.some((w) => w.id === warehouse.parentId)) {
    parentOptions.push({ id: warehouse.parentId, code: warehouse.parentCode, name: warehouse.parentName ?? '' });
  }

  const isLocal = form.type === 'local';

  const validate = () => {
    if (!isEdit && !CODE_REGEX.test(form.code.trim())) {
      return 'Mã kho gồm 2 đến 20 ký tự: chữ, số hoặc dấu gạch ngang (-), ví dụ HCM hoặc HOCMON';
    }
    if (!form.name.trim()) return 'Vui lòng nhập tên kho';
    if (!form.address.trim()) return 'Vui lòng nhập địa chỉ';
    if (isLocal && !form.parentId) return 'Kho địa phương phải thuộc một kho vùng, vui lòng chọn kho vùng quản lý';
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
        name: form.name.trim(),
        address: form.address.trim(),
        type: form.type,
        parentId: isLocal ? form.parentId : null,
      };
      if (isEdit) await warehouseApi.update(warehouse.id, body);
      else await warehouseApi.create({ ...body, code: form.code.trim().toUpperCase() });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title={isEdit ? `Sửa kho ${warehouse.code}` : 'Thêm kho mới'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="form-label">Mã kho</label>
        {isEdit ? (
          <>
            <input className="form-input" value={warehouse.code} disabled />
            <div className="form-hint">Mã kho cố định, không thể thay đổi sau khi tạo.</div>
          </>
        ) : (
          <>
            <input
              className="form-input" value={form.code} onChange={set('code')}
              placeholder="HCM hoặc HOCMON" maxLength={20} autoFocus style={{ textTransform: 'uppercase' }}
            />
            <div className="form-hint">Bạn tự đặt, không được trùng với kho khác. Không đổi được sau khi tạo.</div>
          </>
        )}

        <label className="form-label">Tên kho</label>
        <input className="form-input" value={form.name} onChange={set('name')} placeholder="Kho vùng TP. Hồ Chí Minh" />

        <label className="form-label">Địa chỉ</label>
        <input className="form-input" value={form.address} onChange={set('address')} placeholder="Số nhà, đường, phường/xã, tỉnh/thành" />

        <label className="form-label">Loại kho</label>
        <select className="form-input" value={form.type} onChange={set('type')}>
          <option value="regional">Kho vùng</option>
          <option value="local">Kho địa phương</option>
        </select>
        <div className="form-hint">
          {isLocal
            ? 'Kho địa phương là điểm lấy và giao hàng của một khu, có shipper phụ trách. Hàng đi tới khu khác phải về kho vùng của nó trước.'
            : 'Kho vùng là trung tâm trung chuyển của một tỉnh/thành: gộp bao, chuyển sang kho vùng khác và về các kho địa phương bên dưới. Không gán shipper vào kho vùng.'}
        </div>

        {isLocal && (
          <>
            <label className="form-label">Kho vùng quản lý</label>
            <select className="form-input" value={form.parentId} onChange={set('parentId')}>
              <option value="">— Chọn kho vùng —</option>
              {parentOptions.map((w) => (
                <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
              ))}
            </select>
            {loadedRegionals && parentOptions.length === 0 && (
              <div className="form-hint">Chưa có kho vùng nào đang hoạt động. Hãy tạo kho vùng trước, rồi mới tạo kho địa phương.</div>
            )}
          </>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo kho'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
