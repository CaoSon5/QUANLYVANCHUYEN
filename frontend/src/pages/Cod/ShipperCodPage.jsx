// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Cod\
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { codApi } from '../../api/financeApi';
import { getErrorMessage } from '../../api/authApi';
import { formatDateTime, formatShortMoney, formatVnd } from '../../utils/format';
import { RemittancePill } from '../Finance/FinancePills';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import '../Finance/finance.css';

// Shipper: xem COD đang giữ và nộp tiền cho kế toán (FR57)
export default function ShipperCodPage() {
  const [holding, setHolding] = useState({ totalAmount: 0, orderCount: 0, orders: [] });
  const [selected, setSelected] = useState(new Set());
  const [history, setHistory] = useState({ items: [], total: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [h, list, pending] = await Promise.all([
        codApi.holding(),
        codApi.remittances({ page, pageSize: 10 }),
        codApi.remittances({ status: 'pending', page: 1, pageSize: 1 }),
      ]);
      setHolding(h);
      setSelected(new Set(h.orders.map((o) => o.id))); // mặc định chọn tất cả
      setHistory(list);
      setPendingCount(pending.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const allChecked = holding.orders.length > 0 && selected.size === holding.orders.length;
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(holding.orders.map((o) => o.id)));

  const chosen = holding.orders.filter((o) => selected.has(o.id));
  const chosenTotal = chosen.reduce((sum, o) => sum + o.codCollected, 0);

  const submit = async () => {
    if (chosen.length === 0) return;
    if (!window.confirm(`Nộp ${chosen.length} đơn, tổng ${formatVnd(chosenTotal)} cho kế toán?`)) return;

    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await codApi.createRemittance(chosen.map((o) => o.id));
      setMessage(`Đã tạo phiếu nộp ${r.code} (${formatVnd(r.totalAmount)}). Hãy đưa đủ số tiền cho kế toán, kế toán sẽ đối chiếu và xác nhận.`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(history.total / 10));

  return (
    <>
      <PageHeader
        title="Ghi nhận COD"
        subtitle="Tiền thu hộ bạn đang giữ. Cuối ngày hãy nộp cho kế toán để được đối chiếu."
      />

      <div className="grid grid-3 section">
        <StatCard index={0} label="COD đang giữ" value={formatShortMoney(holding.totalAmount)} />
        <StatCard index={1} label="Đơn chưa nộp" value={holding.orderCount} />
        <StatCard index={2} label="Phiếu chờ kế toán xác nhận" value={pendingCount} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Đơn chưa nộp tiền</div>
            <div className="card-sub">Các đơn giao thành công có thu COD. Bỏ chọn đơn nào chưa muốn nộp.</div>
          </div>
          <button className="btn btn-primary" disabled={busy || chosen.length === 0} onClick={submit}>
            {busy ? 'Đang nộp...' : `Nộp COD (${chosen.length} đơn · ${formatVnd(chosenTotal)})`}
          </button>
        </div>

        {message && <div className="od-ok">{message}</div>}
        {error && <div className="acc-banner">{error}</div>}

        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" className="chk" checked={allChecked} onChange={toggleAll} /></th>
                <th>MÃ VẬN ĐƠN</th><th>NGƯỜI NHẬN</th><th>GIAO LÚC</th><th>COD ĐÃ THU</th>
              </tr>
            </thead>
            <tbody>
              {holding.orders.map((o) => (
                <tr key={o.id}>
                  <td><input type="checkbox" className="chk" checked={selected.has(o.id)} onChange={() => toggle(o.id)} /></td>
                  <td className="code-link">{o.code}</td>
                  <td>{o.receiverName}</td>
                  <td>{formatDateTime(o.deliveredAt)}</td>
                  <td><b>{formatVnd(o.codCollected)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && holding.orders.length === 0 && (
            <div className="acc-empty">Bạn không còn khoản COD nào cần nộp. COD xuất hiện ở đây sau khi bạn giao thành công đơn có thu tiền.</div>
          )}
          {loading && <div className="acc-empty">Đang tải...</div>}
        </div>
      </div>

      <div className="card acc-card section">
        <div className="card-title">Lịch sử nộp COD</div>
        <div className="card-sub">Phiếu nộp của bạn và kết quả kế toán xác nhận</div>

        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 700 }}>
            <thead>
              <tr><th>MÃ PHIẾU</th><th>SỐ ĐƠN</th><th>KHAI NỘP</th><th>KẾ TOÁN NHẬN</th><th>NỘP LÚC</th><th>TRẠNG THÁI</th></tr>
            </thead>
            <tbody>
              {history.items.map((r) => (
                <tr key={r.id}>
                  <td className="code-link">{r.code}</td>
                  <td>{r.orderCount}</td>
                  <td>{formatVnd(r.totalAmount)}</td>
                  <td>
                    {r.receivedAmount != null ? formatVnd(r.receivedAmount) : <span className="muted">—</span>}
                    {r.difference ? <div className="money-neg" style={{ fontSize: 12 }}>Chênh lệch {formatVnd(r.difference)}</div> : null}
                    {r.confirmNote && <div className="muted" style={{ fontSize: 12 }}>{r.confirmNote}</div>}
                  </td>
                  <td>{formatDateTime(r.createdAt)}</td>
                  <td><RemittancePill status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && history.items.length === 0 && <div className="acc-empty">Bạn chưa nộp phiếu nào.</div>}
        </div>

        <div className="acc-foot">
          <span>Tổng <b>{history.total}</b> phiếu</span>
          <div className="acc-pager">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            <span>Trang {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div>
      </div>
    </>
  );
}
