
import { useCallback, useEffect, useRef, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { warehouseOrderApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/format';
import '../Accounts/accounts.css';
import '../Orders/orders.css';

// Nhân viên kho: nhập hàng vào kho bằng mã vận đơn (FR29).
// Máy quét mã vạch hoạt động như bàn phím nên quét thẳng vào ô mã rồi Enter là nhập kho.
export default function InboundPage() {
  const { user } = useAuth();
  const inputRef = useRef(null);

  const [code, setCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState([]); // các đơn vừa nhập trong phiên này
  const [incoming, setIncoming] = useState([]);
  const [incomingTotal, setIncomingTotal] = useState(0);

  const loadIncoming = useCallback(async () => {
    try {
      const res = await warehouseOrderApi.list('incoming', { page: 1, pageSize: 8 });
      setIncoming(res.items);
      setIncomingTotal(res.total);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    loadIncoming();
    inputRef.current?.focus();
  }, [loadIncoming]);

  const submit = async (e) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) return setError('Vui lòng quét hoặc nhập mã vận đơn');

    const q = quantity.trim() === '' ? null : Number(quantity);
    if (q !== null && (!Number.isInteger(q) || q < 1)) return setError('Số kiện thực nhận phải là số nguyên từ 1 trở lên');

    setError('');
    setBusy(true);
    try {
      const order = await warehouseOrderApi.receive({ code: c, receivedQuantity: q, note: note.trim() || null });
      setRecent((list) => [{ ...order, at: new Date().toISOString() }, ...list].slice(0, 15));
      setCode('');
      setQuantity('');
      setNote('');
      loadIncoming();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
      inputRef.current?.focus(); // sẵn sàng quét đơn tiếp theo
    }
  };

  return (
    <>
      <PageHeader
        title="Nhập hàng vào kho"
        subtitle={user?.warehouseCode
          ? `Quét mã vận đơn khi shipper mang hàng về kho ${user.warehouseCode} - ${user.warehouseName}.`
          : 'Quét mã vận đơn khi shipper mang hàng về kho.'}
      />

      <form className="card section" onSubmit={submit}>
        <div className="card-title">Quét mã vận đơn</div>
        <div className="card-sub">Đặt con trỏ vào ô bên dưới rồi quét mã (hoặc gõ tay), bấm Enter để nhập kho.</div>

        <div className="track-box" style={{ marginTop: 16 }}>
          <input
            ref={inputRef} className="form-input" placeholder="SPR25062400128"
            value={code} onChange={(e) => setCode(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Đang nhập...' : 'Nhập kho'}</button>
        </div>

        <button type="button" className="act-btn" style={{ marginTop: 14 }} onClick={() => setShowMore(!showMore)}>
          {showMore ? 'Ẩn tùy chọn' : 'Ghi nhận thiếu / thừa hoặc ghi chú'}
        </button>

        {showMore && (
          <div className="of-grid">
            <div>
              <label className="form-label">Số kiện thực nhận</label>
              <input className="form-input" type="number" min="1" placeholder="Bỏ trống = đủ số kiện shipper đã lấy" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Ghi chú</label>
              <input className="form-input" placeholder="Ví dụ: 1 kiện bị móp" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        )}

        {error && <div className="form-error">{error}</div>}
      </form>

      <div className="grid grid-main section">
        <div className="card acc-card">
          <div className="card-title">Vừa nhập kho</div>
          <div className="card-sub">Các đơn bạn đã nhập trong lần làm việc này</div>
          <div className="acc-scroll">
            <table className="data-table" style={{ minWidth: 520 }}>
              <thead><tr><th>MÃ VẬN ĐƠN</th><th>NGƯỜI NHẬN</th><th>SỐ KIỆN</th><th>LÚC</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={`${o.id}-${o.at}`}>
                    <td className="code-link">{o.code}</td>
                    <td>{o.receiverName}</td>
                    <td>{o.receivedQuantity}/{o.pickedQuantity ?? o.quantity}</td>
                    <td>{formatDateTime(o.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recent.length === 0 && <div className="acc-empty">Chưa nhập đơn nào.</div>}
          </div>
        </div>

        <div className="card acc-card">
          <div className="card-title">Đang trên đường về kho <span className="muted">({incomingTotal})</span></div>
          <div className="card-sub">Chỉ hiện đơn shipper đã bấm “Xác nhận lấy hàng”, chưa nhập kho. Bấm để điền mã.</div>
          <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
            {incoming.map((o) => (
              <button
                type="button" key={o.id} className="act-btn" style={{ textAlign: 'left', padding: '12px 14px' }}
                onClick={() => { setCode(o.code); inputRef.current?.focus(); }}
              >
                <b>{o.code}</b>
                <div className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
                  {o.pickedQuantity ?? o.quantity} kiện · {o.senderName}
                </div>
              </button>
            ))}
            {incoming.length === 0 && <div className="acc-empty" style={{ padding: '20px 0' }}>Chưa có đơn nào về kho. Đơn chỉ hiện ở đây sau khi shipper bấm “Xác nhận lấy hàng”.</div>}
          </div>
        </div>
      </div>
    </>
  );
}
