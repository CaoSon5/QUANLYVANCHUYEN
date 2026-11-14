
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { bundleApi } from '../../api/bundleApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, formatShortMoney } from '../../utils/format';
import BundlePill, { WAREHOUSE_TYPE } from './BundlePill';
import '../Accounts/accounts.css';
import '../Orders/orders.css';

// Chi tiết một bao: quét mã đơn để thêm vào bao, bớt đơn, đóng bao, mở lại, hủy bao (FR33, FR34)
export default function BundleDetailPage({ id }) {
  const { role } = useAuth();
  const canEdit = role === 'warehouse';
  const inputRef = useRef(null);

  const [bundle, setBundle] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setBundle(await bundleApi.get(id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isOpen = bundle?.status === 'open';
  const isSealed = bundle?.status === 'sealed';

  // Chạy một thao tác rồi cập nhật bao từ kết quả trả về
  const run = async (action, successText) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      setBundle(await action());
      if (successText) setMessage(successText);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submitScan = async (e) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    const ok = await run(() => bundleApi.addOrder(id, c), `Đã thêm đơn ${c.toUpperCase()} vào bao.`);
    if (ok) setCode('');
    inputRef.current?.focus();
  };

  const removeOrder = (o) => run(() => bundleApi.removeOrder(id, o.orderId), `Đã gỡ đơn ${o.code} khỏi bao.`);

  const seal = () => {
    if (!window.confirm(`Đóng bao ${bundle.code} với ${bundle.orderCount} đơn? Bạn vẫn mở lại được cho đến khi bao lên xe.`)) return;
    run(() => bundleApi.seal(id), 'Đã đóng bao. Bao đang chờ lên xe.');
  };

  const reopen = () => run(() => bundleApi.reopen(id), 'Đã mở lại bao, bạn có thể thêm hoặc bớt đơn.');

  const cancel = () => {
    if (!window.confirm(`Hủy bao ${bundle.code}? Các đơn bên trong sẽ trở lại kho.`)) return;
    run(() => bundleApi.cancel(id), 'Đã hủy bao, các đơn đã trở lại kho.');
  };

  const back = <Link className="wh-back" to={`/${role}/bundles`}><ArrowLeft size={18} /> Danh sách bao hàng</Link>;

  if (!bundle) {
    return (
      <>
        {back}
        {error ? <div className="acc-banner">{error}</div> : <div className="acc-empty">Đang tải...</div>}
      </>
    );
  }

  return (
    <>
      {back}

      <div className="od-head">
        <div className="od-title">
          <h1>{bundle.code}</h1>
          <BundlePill status={bundle.status} />
        </div>
        {canEdit && (isOpen || isSealed) && (
          <div className="wh-actions">
            {isOpen && <button className="btn btn-primary" disabled={busy || bundle.orderCount === 0} onClick={seal}>Đóng bao</button>}
            {isSealed && <button className="btn" disabled={busy} onClick={reopen}>Mở lại bao</button>}
            <button className="btn" style={{ color: '#b91c1c' }} disabled={busy} onClick={cancel}>Hủy bao</button>
          </div>
        )}
      </div>

      <div className="result-banner" style={{ marginTop: 0 }}>
        Đi kho đích: <b>{bundle.destinationCode}</b> · {bundle.destinationName}
        {' '}({WAREHOUSE_TYPE[bundle.destinationType] ?? bundle.destinationType})<br />
        Đang ở kho: {bundle.currentCode} · Tạo bởi {bundle.createdByName ?? '—'} lúc {formatDateTime(bundle.createdAt)}
        {bundle.sealedAt && <> · Đóng bao lúc {formatDateTime(bundle.sealedAt)}</>}
        {bundle.note && <><br />Ghi chú: {bundle.note}</>}
      </div>

      <div className="grid grid-3 section">
        <StatCard index={0} label="Số đơn trong bao" value={bundle.orderCount} />
        <StatCard index={1} label="Tổng cân nặng" value={`${bundle.totalWeightKg} kg`} />
        <StatCard index={2} label="Tổng số kiện" value={bundle.totalPieces} />
      </div>

      {message && <div className="od-ok">{message}</div>}
      {error && <div className="acc-banner">{error}</div>}

      {canEdit && isOpen && (
        <form className="card section" onSubmit={submitScan}>
          <div className="card-title">Thêm đơn vào bao</div>
          <div className="card-sub">Quét (hoặc gõ) mã vận đơn của hàng bỏ vào bao này rồi bấm Enter. Không cần nhập lại kho đích.</div>
          <div className="track-box" style={{ marginTop: 16 }}>
            <input
              ref={inputRef}
              className="form-input"
              placeholder="SPR26110400001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              autoComplete="off"
            />
            <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Đang thêm...' : 'Thêm vào bao'}</button>
          </div>
        </form>
      )}

      {canEdit && isSealed && (
        <div className="od-alert">
          Bao đã đóng và đang chờ lên xe. Việc xếp bao lên xe và vận chuyển sẽ làm ở bước chuyến vận chuyển. Hiện bạn vẫn mở lại bao để chỉnh sửa được.
        </div>
      )}

      <div className="card acc-card section">
        <div className="card-title">Các đơn trong bao <span className="muted">({bundle.orderCount})</span></div>
        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 700 }}>
            <thead>
              <tr><th>MÃ VẬN ĐƠN</th><th>NGƯỜI NHẬN</th><th>KHU VỰC GIAO</th><th>KIỆN</th><th>CÂN NẶNG</th><th>COD</th>{canEdit && isOpen && <th />}</tr>
            </thead>
            <tbody>
              {bundle.orders.map((o) => (
                <tr key={o.orderId}>
                  <td>
                    {role === 'admin' || role === 'dispatcher'
                      ? <Link className="code-link" to={`/${role}/orders/${o.orderId}`}>{o.code}</Link>
                      : <span className="code-link">{o.code}</span>}
                  </td>
                  <td>{o.receiverName}</td>
                  <td>{o.receiverDistrict}, {o.receiverProvince}</td>
                  <td>{o.pieces}</td>
                  <td>{o.weightKg} kg</td>
                  <td>{o.codAmount > 0 ? formatShortMoney(o.codAmount) : <span className="muted">—</span>}</td>
                  {canEdit && isOpen && (
                    <td><button className="act-btn danger" disabled={busy} onClick={() => removeOrder(o)}>Gỡ</button></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {bundle.orders.length === 0 && (
            <div className="acc-empty">{isOpen ? 'Bao còn trống. Quét mã đơn ở khung phía trên để thêm.' : 'Bao này không còn đơn nào.'}</div>
          )}
        </div>
      </div>
    </>
  );
}
