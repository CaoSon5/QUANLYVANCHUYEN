import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { pickupApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { formatDateTime, formatShortMoney } from '../../utils/format';
import OrderStatusPill from '../Orders/OrderStatusPill';
import '../Accounts/accounts.css';
import '../Orders/orders.css';

const PAGE_SIZE = 10;

function ConfirmModal({ order, onClose, onSaved }) {
  const [quantity, setQuantity] = useState(String(order.quantity));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const q = Number(quantity);
    if (!Number.isInteger(q) || q < 1) return setError('Số kiện thực tế phải là số nguyên từ 1 trở lên');

    setError('');
    setLoading(true);
    try {
      await pickupApi.confirm(order.id, { pickedQuantity: q, note: note.trim() || null });
      onSaved(order.code);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title={`Xác nhận lấy hàng ${order.code}`} onClose={onClose}>
      <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginTop: 4 }}>
        Người bán khai báo <b>{order.quantity} kiện</b> ({order.itemDescription}). Hãy đếm số kiện thực tế và kiểm tra tình trạng trước khi xác nhận.
      </p>
      <form onSubmit={handleSubmit}>
        <label className="form-label">Số kiện thực tế lấy được</label>
        <input className="form-input" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus />

        <label className="form-label">Tình trạng / ghi chú (không bắt buộc)</label>
        <textarea className="form-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Ví dụ: 1 kiện bị móp góc, thiếu 1 kiện..." />

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Xác nhận đã lấy hàng'}</button>
        </div>
      </form>
    </Modal>
  );
}

// Shipper: xác nhận đã lấy hàng tại người bán (FR51)
export default function ConfirmPickupPage() {
  const [tab, setTab] = useState('accepted'); // accepted: chờ lấy | picked_up: đã lấy
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await pickupApi.mine({ status: tab, page, pageSize: PAGE_SIZE });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const switchTab = (t) => { setTab(t); setPage(1); setMessage(''); };

  return (
    <>
      <PageHeader
        title="Xác nhận lấy hàng"
        subtitle="Đến lấy hàng tại người bán, kiểm tra số lượng và tình trạng kiện hàng rồi xác nhận."
      />

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Đơn tôi đã nhận</div>
            <div className="card-sub">Đơn mới nhận nằm ở tab "Chờ lấy hàng"</div>
          </div>
          <div className="acc-tools">
            <button className={`btn ${tab === 'accepted' ? 'btn-primary' : ''}`} style={tab === 'accepted' ? { boxShadow: 'none' } : undefined} onClick={() => switchTab('accepted')}>Chờ lấy hàng</button>
            <button className={`btn ${tab === 'picked_up' ? 'btn-primary' : ''}`} style={tab === 'picked_up' ? { boxShadow: 'none' } : undefined} onClick={() => switchTab('picked_up')}>Đã lấy hàng</button>
          </div>
        </div>

        {message && <div className="od-ok">{message}</div>}
        {error && <div className="acc-banner">{error}</div>}

        <div className="acc-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ VẬN ĐƠN</th><th>ĐỊA CHỈ LẤY HÀNG</th><th>HÀNG</th><th>COD</th>
                <th>{tab === 'accepted' ? 'NHẬN ĐƠN LÚC' : 'LẤY HÀNG LÚC'}</th><th>TRẠNG THÁI</th>{tab === 'accepted' && <th />}
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id}>
                  <td className="code-link">{o.code}</td>
                  <td>
                    <b>{o.senderName}</b> · {o.senderPhone}
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{o.senderAddress}</div>
                  </td>
                  <td>
                    {tab === 'picked_up' && o.pickedQuantity != null ? `${o.pickedQuantity}/${o.quantity} kiện` : `${o.quantity} kiện`} · {o.weightKg} kg
                    <div className="muted" style={{ fontSize: 13 }}>{o.itemDescription}</div>
                  </td>
                  <td>{o.codAmount > 0 ? formatShortMoney(o.codAmount) : <span className="muted">—</span>}</td>
                  <td>{formatDateTime(tab === 'accepted' ? o.acceptedAt : o.pickedUpAt)}</td>
                  <td><OrderStatusPill status={o.status} /></td>
                  {tab === 'accepted' && (
                    <td><button className="btn btn-primary btn-sm" onClick={() => setConfirming(o)}>Xác nhận lấy hàng</button></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <div className="acc-empty">
              {tab === 'accepted' ? 'Bạn chưa nhận đơn nào cần lấy. Vào "Đơn chờ lấy" để chọn đơn.' : 'Chưa có đơn nào đã lấy.'}
            </div>
          )}
          {loading && items.length === 0 && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="acc-foot">
          <span>Tổng <b>{total}</b> đơn</span>
          <div className="acc-pager">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            <span>Trang {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div>
      </div>

      {confirming && (
        <ConfirmModal
          order={confirming}
          onClose={() => setConfirming(null)}
          onSaved={(code) => { setConfirming(null); setMessage(`Đã xác nhận lấy hàng đơn ${code}. Mang hàng về kho để nhập kho.`); load(); }}
        />
      )}
    </>
  );
}
