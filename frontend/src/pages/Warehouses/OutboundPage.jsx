
import { useCallback, useEffect, useRef, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { orderApi, warehouseOrderApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, formatShortMoney } from '../../utils/format';
import '../Accounts/accounts.css';
import '../Orders/orders.css';

// Nhân viên kho: xuất hàng cho shipper đã nhận giao (FR31).
// Shipper tự nhận đơn ở mục "Đơn chờ giao", rồi đến kho lấy. Nhân viên kho đối chiếu mã đơn và bàn giao.
export default function OutboundPage() {
  const { user } = useAuth();
  const inputRef = useRef(null);

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(null); // 'scan' | id nhóm shipper | id đơn
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState([]);
  const [summary, setSummary] = useState({ awaitingDispatch: 0, dispatchedToday: 0 });
  const [recent, setRecent] = useState([]);

  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([
        warehouseOrderApi.list('dispatch', { page: 1, pageSize: 50 }),
        orderApi.summary(),
      ]);
      setWaiting(list.items);
      setSummary(sum);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
    inputRef.current?.focus();
  }, [load]);

  // Xuất một đơn; trả về true nếu thành công
  const dispatchOne = async (orderCode) => {
    try {
      const order = await warehouseOrderApi.dispatch({ code: orderCode });
      setRecent((list) => [{ ...order, at: new Date().toISOString() }, ...list].slice(0, 15));
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  const submitScan = async (e) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) return setError('Vui lòng quét hoặc nhập mã vận đơn');

    setError('');
    setBusy('scan');
    const ok = await dispatchOne(c);
    if (ok) setCode('');
    setBusy(null);
    await load();
    inputRef.current?.focus();
  };

  const dispatchRow = async (o) => {
    setError('');
    setBusy(o.id);
    await dispatchOne(o.code);
    setBusy(null);
    await load();
  };

  const dispatchGroup = async (group) => {
    if (!window.confirm(`Xuất ${group.orders.length} đơn cho shipper ${group.name}?`)) return;
    setError('');
    setBusy(group.id);
    for (const o of group.orders) {
      // Dừng ngay khi có đơn lỗi để nhân viên xử lý
      // eslint-disable-next-line no-await-in-loop
      const ok = await dispatchOne(o.code);
      if (!ok) break;
    }
    setBusy(null);
    await load();
  };

  // Gom các đơn chờ xuất theo shipper
  const groups = Object.values(
    waiting.reduce((acc, o) => {
      const key = o.deliveryShipperId ?? 'none';
      if (!acc[key]) acc[key] = { id: key, name: o.deliveryShipperName ?? '—', phone: o.deliveryShipperPhone, orders: [] };
      acc[key].orders.push(o);
      return acc;
    }, {}),
  );

  return (
    <>
      <PageHeader
        title="Xuất hàng cho shipper"
        subtitle={user?.warehouseCode
          ? `Bàn giao hàng của kho ${user.warehouseCode} - ${user.warehouseName} cho shipper đã nhận giao.`
          : 'Bàn giao hàng cho shipper đã nhận giao.'}
      />

      <div className="grid grid-3 section">
        <StatCard index={0} label="Chờ xuất kho" value={summary.awaitingDispatch} />
        <StatCard index={1} label="Đã xuất hôm nay" value={summary.dispatchedToday} />
      </div>

      <form className="card section" onSubmit={submitScan}>
        <div className="card-title">Quét mã để xuất kho</div>
        <div className="card-sub">Quét (hoặc gõ) mã vận đơn của hàng đang bàn giao cho shipper, bấm Enter.</div>
        <div className="track-box" style={{ marginTop: 16 }}>
          <input ref={inputRef} className="form-input" placeholder="SPR25062400128" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn btn-primary" type="submit" disabled={busy === 'scan'}>{busy === 'scan' ? 'Đang xuất...' : 'Xuất kho'}</button>
        </div>
        {error && <div className="form-error">{error}</div>}
      </form>

      <div className="card acc-card section">
        <div className="card-title">Đang chờ xuất kho <span className="muted">({waiting.length})</span></div>
        <div className="card-sub">Các đơn shipper đã bấm "Nhận giao" ở mục Đơn chờ giao, gom theo shipper.</div>

        {groups.length === 0 && (
          <div className="acc-empty">Chưa có đơn nào chờ xuất. Đơn xuất hiện ở đây sau khi shipper bấm "Nhận giao".</div>
        )}

        {groups.map((g) => (
          <div key={g.id} style={{ marginTop: 22 }}>
            <div className="panel-head">
              <div>
                <b style={{ fontSize: 16 }}>{g.name}</b>
                <span className="muted"> · {g.phone} · {g.orders.length} đơn</span>
              </div>
              <button className="btn btn-primary btn-sm" disabled={busy === g.id} onClick={() => dispatchGroup(g)}>
                {busy === g.id ? 'Đang xuất...' : `Xuất tất cả (${g.orders.length})`}
              </button>
            </div>
            <div className="acc-scroll" style={{ marginTop: 8 }}>
              <table className="data-table" style={{ minWidth: 640 }}>
                <thead>
                  <tr><th>MÃ VẬN ĐƠN</th><th>NGƯỜI NHẬN</th><th>SỐ KIỆN</th><th>COD</th><th /></tr>
                </thead>
                <tbody>
                  {g.orders.map((o) => (
                    <tr key={o.id}>
                      <td className="code-link">{o.code}</td>
                      <td>
                        <b>{o.receiverName}</b>
                        <div className="muted" style={{ fontSize: 13 }}>{o.receiverDistrict}, {o.receiverProvince}</div>
                      </td>
                      <td>{o.receivedQuantity ?? o.quantity}</td>
                      <td>{o.codAmount > 0 ? formatShortMoney(o.codAmount) : <span className="muted">—</span>}</td>
                      <td>
                        <button className="act-btn" disabled={busy === o.id} onClick={() => dispatchRow(o)}>
                          {busy === o.id ? 'Đang xuất...' : 'Xuất'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="card acc-card section">
        <div className="card-title">Vừa xuất kho</div>
        <div className="card-sub">Các đơn bạn đã xuất trong lần làm việc này</div>
        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 560 }}>
            <thead><tr><th>MÃ VẬN ĐƠN</th><th>SHIPPER</th><th>NGƯỜI NHẬN</th><th>LÚC</th></tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={`${o.id}-${o.at}`}>
                  <td className="code-link">{o.code}</td>
                  <td>{o.deliveryShipperName}</td>
                  <td>{o.receiverName}</td>
                  <td>{formatDateTime(o.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 && <div className="acc-empty">Chưa xuất đơn nào.</div>}
        </div>
      </div>
    </>
  );
}
