// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Finance\
import { useCallback, useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { financeApi } from '../../api/financeApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateOnly, formatShortMoney, formatVnd } from '../../utils/format';
import SettlementTable from './SettlementTable';
import SettlementDetailModal from './SettlementDetailModal';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import './finance.css';

const PAGE_SIZE = 10;

// Xác nhận đã chuyển tiền cho người bán (FR61)
function PayModal({ settlement, onClose, onPaid }) {
  const [paymentRef, setPaymentRef] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const owes = settlement.netAmount <= 0;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await financeApi.paySettlement(settlement.id, { paymentRef: paymentRef.trim() || null });
      onPaid(owes
        ? `Đã xác nhận bù trừ bảng ${settlement.code}.`
        : `Đã xác nhận chuyển ${formatVnd(settlement.netAmount)} cho ${settlement.sellerName} (bảng ${settlement.code}).`);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title={owes ? `Xác nhận bù trừ ${settlement.code}` : `Xác nhận chuyển tiền ${settlement.code}`} onClose={onClose}>
      <div className="result-banner">
        Người bán: <b>{settlement.sellerName}</b> · {settlement.sellerPhone}<br />
        Kỳ: {formatDateOnly(settlement.from)} đến {formatDateOnly(settlement.to)} · {settlement.orderCount} đơn<br />
        {owes
          ? <>Người bán còn nợ <b className="money-neg">{formatVnd(Math.abs(settlement.netAmount))}</b>, không có khoản nào cần chuyển.</>
          : <>Số tiền cần chuyển: <b className="money-pos">{formatVnd(settlement.netAmount)}</b></>}
      </div>

      <form onSubmit={submit}>
        <label className="form-label">Mã giao dịch ngân hàng (không bắt buộc)</label>
        <input className="form-input" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} maxLength={100} placeholder="Ví dụ: FT25062400123" autoFocus />
        <div className="form-hint">
          {owes
            ? 'Bấm xác nhận để đánh dấu bảng này đã được xử lý bù trừ.'
            : 'Chỉ bấm xác nhận sau khi bạn đã thực hiện chuyển khoản. Hệ thống không tự chuyển tiền.'}
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Xác nhận'}</button>
        </div>
      </form>
    </Modal>
  );
}

// Kế toán: danh sách bảng đối soát cần chuyển tiền cho người bán
export default function PayoutPage() {
  const { role } = useAuth();
  const canPay = role === 'accountant';

  const [tab, setTab] = useState('pending'); // pending | paid
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ settlementsPending: 0, settlementsPaid: 0, pendingPayoutAmount: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [openId, setOpenId] = useState(null);
  const [paying, setPaying] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, sum] = await Promise.all([
        financeApi.settlements({ status: tab, page, pageSize: PAGE_SIZE }),
        financeApi.summary(),
      ]);
      setItems(list.items);
      setTotal(list.total);
      setSummary(sum);
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
      <PageHeader title="Xác nhận chuyển tiền" subtitle="Chuyển tiền đối soát cho người bán rồi xác nhận lại trên hệ thống." />

      <div className="grid grid-3 section">
        <StatCard index={0} label="Bảng chờ chuyển tiền" value={summary.settlementsPending} />
        <StatCard index={1} label="Tổng tiền chờ chuyển" value={formatShortMoney(summary.pendingPayoutAmount)} />
        <StatCard index={2} label="Bảng đã chuyển tiền" value={summary.settlementsPaid} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div className="acc-tools">
            <button className={`btn ${tab === 'pending' ? 'btn-primary' : ''}`} style={tab === 'pending' ? { boxShadow: 'none' } : undefined} onClick={() => switchTab('pending')}>Chờ chuyển tiền</button>
            <button className={`btn ${tab === 'paid' ? 'btn-primary' : ''}`} style={tab === 'paid' ? { boxShadow: 'none' } : undefined} onClick={() => switchTab('paid')}>Đã chuyển tiền</button>
          </div>
        </div>

        {message && <div className="od-ok">{message}</div>}
        {error && <div className="acc-banner">{error}</div>}

        <SettlementTable
          items={items}
          loading={loading}
          onOpen={(s) => setOpenId(s.id)}
          onPay={canPay ? (s) => setPaying(s) : undefined}
        />

        <div className="acc-foot">
          <span>Tổng <b>{total}</b> bảng đối soát</span>
          <div className="acc-pager">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            <span>Trang {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div>
      </div>

      {openId && <SettlementDetailModal id={openId} onClose={() => setOpenId(null)} />}
      {paying && (
        <PayModal
          settlement={paying}
          onClose={() => setPaying(null)}
          onPaid={(text) => { setPaying(null); setMessage(text); load(); }}
        />
      )}
    </>
  );
}
