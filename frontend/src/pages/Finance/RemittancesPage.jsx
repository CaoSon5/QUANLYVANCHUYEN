// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Finance\
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { financeApi } from '../../api/financeApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, formatShortMoney, formatVnd } from '../../utils/format';
import { RemittancePill } from './FinancePills';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import './finance.css';
import './holdings.css';

const PAGE_SIZE = 10;
const NO_WAREHOUSE = 'none';

// Nhóm shipper đang giữ tiền theo kho: kho giữ nhiều tiền nhất ở trên, kho "chưa gán" ở cuối
function groupByWarehouse(holdings) {
  const map = new Map();
  holdings.forEach((h) => {
    const key = h.warehouseId ?? NO_WAREHOUSE;
    if (!map.has(key)) {
      map.set(key, {
        key,
        code: h.warehouseCode,
        name: h.warehouseName,
        regionCode: h.regionCode,
        shippers: [],
        amount: 0,
        orders: 0,
      });
    }
    const g = map.get(key);
    g.shippers.push(h);
    g.amount += h.amount;
    g.orders += h.orderCount;
  });

  const list = [...map.values()];
  list.forEach((g) => g.shippers.sort((a, b) => b.amount - a.amount));
  list.sort((a, b) => {
    if (a.key === NO_WAREHOUSE) return 1;
    if (b.key === NO_WAREHOUSE) return -1;
    return b.amount - a.amount;
  });
  return list;
}

// Cửa sổ chi tiết phiếu nộp. Kế toán đối chiếu số tiền thực nhận rồi xác nhận (FR59).
function RemittanceModal({ id, canConfirm, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [received, setReceived] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    financeApi
      .remittance(id)
      .then((d) => { setData(d); setReceived(String(d.totalAmount)); })
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (!data) {
    return (
      <Modal title="Phiếu nộp COD" onClose={onClose} wide>
        {error ? <div className="form-error">{error}</div> : <div className="acc-empty">Đang tải...</div>}
      </Modal>
    );
  }

  const amount = Number(received);
  const differs = Number.isFinite(amount) && amount !== data.totalAmount;

  const confirm = async (e) => {
    e.preventDefault();
    if (!Number.isFinite(amount) || amount < 0) return setError('Số tiền thực nhận không hợp lệ');
    if (differs && !note.trim()) return setError('Số tiền thực nhận khác số khai nộp, vui lòng ghi chú lý do');

    setError('');
    setLoading(true);
    try {
      await financeApi.confirmRemittance(id, { receivedAmount: amount, note: note.trim() || null });
      onChanged(`Đã xác nhận phiếu ${data.code}.`);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title={`Phiếu nộp ${data.code}`} onClose={onClose} wide>
      <div className="result-banner">
        Shipper: <b>{data.shipperName}</b> · {data.shipperPhone}<br />
        Nộp lúc {formatDateTime(data.createdAt)} · {data.orderCount} đơn · Khai nộp <b>{formatVnd(data.totalAmount)}</b>{' '}
        <RemittancePill status={data.status} />
        {data.status === 'confirmed' && (
          <>
            <br />
            Đã nhận <b>{formatVnd(data.receivedAmount)}</b>
            {data.difference ? <span className="money-neg"> (chênh lệch {formatVnd(data.difference)})</span> : null}
            {' '}· xác nhận bởi {data.confirmedByName ?? '—'} lúc {formatDateTime(data.confirmedAt)}
            {data.confirmNote && <><br />Ghi chú: {data.confirmNote}</>}
          </>
        )}
      </div>

      <div className="acc-scroll" style={{ margin: '16px 0 0' }}>
        <table className="data-table" style={{ minWidth: 520 }}>
          <thead><tr><th>MÃ VẬN ĐƠN</th><th>NGƯỜI NHẬN</th><th>GIAO LÚC</th><th>COD ĐÃ THU</th></tr></thead>
          <tbody>
            {data.orders.map((o) => (
              <tr key={o.id}>
                <td className="code-link">{o.code}</td>
                <td>{o.receiverName}</td>
                <td>{formatDateTime(o.deliveredAt)}</td>
                <td><b>{formatVnd(o.codCollected)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.status === 'pending' && canConfirm && (
        <form onSubmit={confirm}>
          <div className="two-col">
            <div>
              <label className="form-label">Số tiền thực nhận (đ)</label>
              <input className="form-input" type="number" min="0" value={received} onChange={(e) => setReceived(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Ghi chú {differs ? '(bắt buộc)' : '(không bắt buộc)'}</label>
              <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do nếu thực nhận khác khai nộp" />
            </div>
          </div>
          {differs && <div className="form-hint" style={{ color: '#b45309' }}>Số tiền khác số shipper khai nộp ({formatVnd(data.totalAmount)}).</div>}
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>Đóng</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Xác nhận đã nhận tiền'}</button>
          </div>
        </form>
      )}

      {!(data.status === 'pending' && canConfirm) && (
        <div className="form-actions"><button type="button" className="btn" onClick={onClose}>Đóng</button></div>
      )}
    </Modal>
  );
}

// Kế toán: đối chiếu COD shipper nộp. Admin được xem, chỉ Kế toán được xác nhận.
export default function RemittancesPage() {
  const { role } = useAuth();
  const canConfirm = role === 'accountant';

  const [tab, setTab] = useState('pending'); // pending | confirmed | holdings
  const [items, setItems] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ codCollectedTotal: 0, codHeld: 0, remittancesPending: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [openId, setOpenId] = useState(null);
  const [collapsed, setCollapsed] = useState(() => new Set()); // các kho đang thu gọn ở tab "đang giữ tiền"

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const sumPromise = financeApi.summary();
      if (tab === 'holdings') {
        const [h, sum] = await Promise.all([financeApi.holdings(), sumPromise]);
        setHoldings(h);
        setSummary(sum);
      } else {
        const [list, sum] = await Promise.all([
          financeApi.remittances({ status: tab, page, pageSize: PAGE_SIZE }),
          sumPromise,
        ]);
        setItems(list.items);
        setTotal(list.total);
        setSummary(sum);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  const switchTab = (t) => { setTab(t); setPage(1); setMessage(''); };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const groups = useMemo(() => groupByWarehouse(holdings), [holdings]);
  const holdingTotal = holdings.reduce((sum, h) => sum + h.amount, 0);
  const toggleGroup = (key) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const daysSince = (iso) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : null);

  const tabBtn = (key, label) => (
    <button
      className={`btn ${tab === key ? 'btn-primary' : ''}`}
      style={tab === key ? { boxShadow: 'none' } : undefined}
      onClick={() => switchTab(key)}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader
        title="Đối chiếu COD shipper"
        subtitle="Kiểm tra tiền thu hộ shipper nộp về so với các đơn họ đã giao thành công."
      />

      <div className="grid grid-3 section">
        <StatCard index={0} label="COD shipper đã thu" value={formatShortMoney(summary.codCollectedTotal)} />
        <StatCard index={1} label="Chờ shipper nộp" value={formatShortMoney(summary.codHeld)} />
        <StatCard index={2} label="Phiếu chờ xác nhận" value={summary.remittancesPending} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div className="acc-tools">
            {tabBtn('pending', 'Chờ xác nhận')}
            {tabBtn('confirmed', 'Đã xác nhận')}
            {tabBtn('holdings', 'Shipper đang giữ tiền')}
          </div>
        </div>

        {message && <div className="od-ok">{message}</div>}
        {error && <div className="acc-banner">{error}</div>}

        {tab === 'holdings' ? (
          <>
            <div className="hd-sum">
              <div><b>{formatVnd(holdingTotal)}</b><span>Tổng tiền shipper đang giữ</span></div>
              <div><b>{holdings.length}</b><span>Shipper đang giữ tiền</span></div>
              <div><b>{groups.length}</b><span>Kho có tiền chưa nộp</span></div>
            </div>

            {groups.length > 0 && (
              <div className="hd-tools">
                <button type="button" className="act-btn" onClick={() => setCollapsed(new Set())}>Mở rộng tất cả</button>
                <button type="button" className="act-btn" onClick={() => setCollapsed(new Set(groups.map((g) => g.key)))}>Thu gọn tất cả</button>
              </div>
            )}

            <div className="acc-scroll">
              <table className="data-table hd-table" style={{ minWidth: 620 }}>
                <thead><tr><th>KHO / SHIPPER</th><th>SỐ ĐƠN CHƯA NỘP</th><th>SỐ TIỀN ĐANG GIỮ</th><th>ĐƠN CŨ NHẤT</th></tr></thead>
                <tbody>
                  {groups.map((g) => {
                    const closed = collapsed.has(g.key);
                    const rows = [
                      <tr key={`g-${g.key}`} className={`hd-kho ${g.key === NO_WAREHOUSE ? 'hd-none' : ''}`} onClick={() => toggleGroup(g.key)}>
                        <td>
                          <button
                            type="button" className={`hd-tg ${closed ? 'closed' : ''}`} aria-expanded={!closed}
                            aria-label={closed ? 'Mở rộng' : 'Thu gọn'}
                            onClick={(e) => { e.stopPropagation(); toggleGroup(g.key); }}
                          >
                            <ChevronDown size={16} />
                          </button>
                          {g.key === NO_WAREHOUSE ? (
                            'Chưa gán kho'
                          ) : (
                            <>
                              <span className="code-link">{g.code}</span> {g.name}
                              {g.regionCode && <span className="hd-meta">{g.regionCode}</span>}
                            </>
                          )}
                          <span className="hd-meta">{g.shippers.length} shipper</span>
                        </td>
                        <td>{g.orders}</td>
                        <td><b>{formatVnd(g.amount)}</b></td>
                        <td />
                      </tr>,
                    ];

                    if (!closed) {
                      g.shippers.forEach((h) => {
                        const days = daysSince(h.oldestDeliveredAt);
                        rows.push(
                          <tr key={h.shipperId} className="hd-sp">
                            <td className="hd-sp-name"><b>{h.shipperName}</b><div className="muted" style={{ fontSize: 13 }}>{h.shipperPhone}</div></td>
                            <td>{h.orderCount}</td>
                            <td><b>{formatVnd(h.amount)}</b></td>
                            <td style={days >= 2 ? { color: '#b91c1c', fontWeight: 700 } : undefined}>{days === null ? '—' : `${days} ngày trước`}</td>
                          </tr>,
                        );
                      });
                    }
                    return rows;
                  })}
                </tbody>
              </table>
              {!loading && holdings.length === 0 && <div className="acc-empty">Không shipper nào đang giữ tiền COD chưa nộp.</div>}
            </div>
          </>
        ) : (
          <>
            <div className="acc-scroll">
              <table className="data-table">
                <thead>
                  <tr><th>MÃ PHIẾU</th><th>SHIPPER</th><th>SỐ ĐƠN</th><th>KHAI NỘP</th><th>THỰC NHẬN</th><th>NỘP LÚC</th><th>TRẠNG THÁI</th><th /></tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id}>
                      <td className="code-link">{r.code}</td>
                      <td>{r.shipperName}</td>
                      <td>{r.orderCount}</td>
                      <td><b>{formatVnd(r.totalAmount)}</b></td>
                      <td>
                        {r.receivedAmount != null ? formatVnd(r.receivedAmount) : <span className="muted">—</span>}
                        {r.difference ? <div className="money-neg" style={{ fontSize: 12 }}>Chênh lệch {formatVnd(r.difference)}</div> : null}
                      </td>
                      <td>{formatDateTime(r.createdAt)}</td>
                      <td><RemittancePill status={r.status} /></td>
                      <td>
                        <button className={r.status === 'pending' && canConfirm ? 'btn btn-primary btn-sm' : 'act-btn'} onClick={() => setOpenId(r.id)}>
                          {r.status === 'pending' && canConfirm ? 'Đối chiếu' : 'Xem'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && items.length === 0 && (
                <div className="acc-empty">{tab === 'pending' ? 'Không có phiếu nào đang chờ xác nhận.' : 'Chưa có phiếu nào đã xác nhận.'}</div>
              )}
              {loading && items.length === 0 && <div className="acc-empty">Đang tải...</div>}
            </div>

            <div className="acc-foot">
              <span>Tổng <b>{total}</b> phiếu</span>
              <div className="acc-pager">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
                <span>Trang {page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {openId && (
        <RemittanceModal
          id={openId}
          canConfirm={canConfirm}
          onClose={() => setOpenId(null)}
          onChanged={(text) => { setOpenId(null); setMessage(text); load(); }}
        />
      )}
    </>
  );
}
