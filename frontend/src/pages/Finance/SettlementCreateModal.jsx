// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Finance\
import { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import { financeApi } from '../../api/financeApi';
import { getErrorMessage } from '../../api/authApi';
import { formatDateTime, formatVnd } from '../../utils/format';
import '../Accounts/accounts.css';
import './finance.css';

const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Lập bảng đối soát cho một người bán theo kỳ (FR60): xem trước số liệu, thêm khoản phát sinh, rồi lập.
export default function SettlementCreateModal({ onClose, onSaved }) {
  const now = new Date();
  const [search, setSearch] = useState('');
  const [sellers, setSellers] = useState([]);
  const [sellerId, setSellerId] = useState('');
  const [from, setFrom] = useState(isoDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(isoDate(now));
  const [preview, setPreview] = useState(null);
  const [adjustments, setAdjustments] = useState([]); // { description, amount }
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Gõ xong 0,3 giây mới tìm người bán
  useEffect(() => {
    const t = setTimeout(() => {
      financeApi.sellers(search.trim() || undefined).then(setSellers).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Đổi người bán hoặc kỳ thì số liệu xem trước không còn đúng
  useEffect(() => {
    setPreview(null);
  }, [sellerId, from, to]);

  const periodError = () => {
    if (!sellerId) return 'Vui lòng chọn người bán';
    if (!from || !to) return 'Vui lòng chọn kỳ đối soát';
    if (to < from) return 'Ngày kết thúc phải sau ngày bắt đầu';
    return '';
  };

  const runPreview = async () => {
    const msg = periodError();
    if (msg) return setError(msg);
    setError('');
    setBusy(true);
    try {
      setPreview(await financeApi.previewSettlement({ sellerId, from, to }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const updateAdj = (index, field, value) =>
    setAdjustments(adjustments.map((a, i) => (i === index ? { ...a, [field]: value } : a)));

  const cleanAdjustments = () =>
    adjustments
      .filter((a) => a.description.trim() || String(a.amount).trim())
      .map((a) => ({ description: a.description.trim(), amount: Number(a.amount) }));

  const adjustmentTotal = cleanAdjustments().reduce((sum, a) => sum + (Number.isFinite(a.amount) ? a.amount : 0), 0);
  const net = preview ? preview.grossCod - preview.shippingFee + adjustmentTotal : 0;

  const submit = async (e) => {
    e.preventDefault();
    const msg = periodError();
    if (msg) return setError(msg);
    if (!preview) return setError('Hãy bấm "Xem trước" để kiểm tra số liệu trước khi lập bảng');

    const adj = cleanAdjustments();
    for (const a of adj) {
      if (!a.description) return setError('Mỗi khoản phát sinh cần có nội dung');
      if (!Number.isFinite(a.amount) || a.amount === 0) return setError('Số tiền khoản phát sinh phải khác 0');
    }

    setError('');
    setBusy(true);
    try {
      const created = await financeApi.createSettlement({
        sellerId, from, to, adjustments: adj, note: note.trim() || null,
      });
      onSaved(`Đã lập bảng đối soát ${created.code} cho ${created.sellerName}.`);
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title="Lập bảng đối soát" onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="three-col">
          <div>
            <label className="form-label">Người bán</label>
            <input className="form-input" placeholder="Tìm tên, email, số điện thoại..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="form-input" style={{ marginTop: 8 }} value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
              <option value="">— Chọn người bán —</option>
              {sellers.map((s) => <option key={s.id} value={s.id}>{s.fullName} ({s.email})</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Từ ngày</label>
            <input className="form-input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Đến ngày</label>
            <input className="form-input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <button type="button" className="btn" style={{ marginTop: 14 }} disabled={busy} onClick={runPreview}>
          {busy && !preview ? 'Đang tính...' : 'Xem trước số liệu'}
        </button>

        {preview && (
          <>
            <div className="result-banner">
              Có <b>{preview.orderCount}</b> đơn đủ điều kiện (đã giao trong kỳ, tiền COD đã được kế toán xác nhận nhận từ shipper).
              {preview.excludedCount > 0 && (
                <><br /><span style={{ color: '#b45309' }}>
                  Còn {preview.excludedCount} đơn ({formatVnd(preview.excludedAmount)}) đã giao nhưng shipper chưa nộp hoặc kế toán chưa xác nhận, sẽ để kỳ sau.
                </span></>
              )}
            </div>

            {preview.orders.length > 0 && (
              <div className="acc-scroll" style={{ margin: '14px 0 0', maxHeight: 220, overflowY: 'auto' }}>
                <table className="data-table" style={{ minWidth: 520 }}>
                  <thead><tr><th>MÃ VẬN ĐƠN</th><th>GIAO LÚC</th><th>COD ĐÃ THU</th><th>PHÍ VC</th></tr></thead>
                  <tbody>
                    {preview.orders.map((o) => (
                      <tr key={o.id}>
                        <td className="code-link">{o.code}</td>
                        <td>{formatDateTime(o.deliveredAt)}</td>
                        <td>{formatVnd(o.codCollected)}</td>
                        <td>{formatVnd(o.shippingFee)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <label className="form-label">Khoản phát sinh (không bắt buộc)</label>
            <div className="form-hint">Nhập số <b>âm</b> để trừ vào tiền người bán (ví dụ phí hoàn hàng: -20000), số <b>dương</b> để cộng thêm (ví dụ bồi hoàn: 50000).</div>
            {adjustments.map((a, i) => (
              <div className="adj-row" key={i}>
                <input className="form-input" placeholder="Nội dung (ví dụ: Phí hoàn hàng)" value={a.description} onChange={(e) => updateAdj(i, 'description', e.target.value)} />
                <input className="form-input" type="number" step="1000" placeholder="Số tiền" value={a.amount} onChange={(e) => updateAdj(i, 'amount', e.target.value)} />
                <button type="button" aria-label="Xóa" onClick={() => setAdjustments(adjustments.filter((_, k) => k !== i))}>×</button>
              </div>
            ))}
            {adjustments.length < 10 && (
              <button type="button" className="act-btn" style={{ marginTop: 10 }} onClick={() => setAdjustments([...adjustments, { description: '', amount: '' }])}>
                + Thêm khoản phát sinh
              </button>
            )}

            <table className="sum-table">
              <tbody>
                <tr><td>Tổng COD đã thu</td><td>{formatVnd(preview.grossCod)}</td></tr>
                <tr><td>Phí vận chuyển</td><td>−{formatVnd(preview.shippingFee)}</td></tr>
                <tr><td>Khoản phát sinh</td><td>{adjustmentTotal > 0 ? '+' : ''}{formatVnd(adjustmentTotal)}</td></tr>
                <tr className="sum-total">
                  <td>{net < 0 ? 'Người bán còn nợ' : 'Số tiền chuyển cho người bán'}</td>
                  <td className={net < 0 ? 'money-neg' : 'money-pos'}>{formatVnd(Math.abs(net))}</td>
                </tr>
              </tbody>
            </table>

            <label className="form-label">Ghi chú (không bắt buộc)</label>
            <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          </>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !preview}>
            {busy && preview ? 'Đang lập...' : 'Lập bảng đối soát'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
