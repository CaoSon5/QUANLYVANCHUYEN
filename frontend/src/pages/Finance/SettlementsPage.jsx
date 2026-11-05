// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Finance\
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { financeApi } from '../../api/financeApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import SettlementTable from './SettlementTable';
import SettlementDetailModal from './SettlementDetailModal';
import SettlementCreateModal from './SettlementCreateModal';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import './finance.css';

const PAGE_SIZE = 10;

// Kế toán: lập bảng đối soát theo kỳ cho từng người bán (FR60)
export default function SettlementsPage() {
  const { role } = useAuth();
  const canCreate = role === 'accountant';

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await financeApi.settlements({ status: status || undefined, page, pageSize: PAGE_SIZE });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Đối soát người bán"
        subtitle="Lập bảng đối soát theo kỳ: tiền COD đã thu trừ phí vận chuyển và các khoản phát sinh."
        action={canCreate ? 'Lập bảng đối soát' : undefined}
        onAction={() => setCreating(true)}
      />

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Danh sách bảng đối soát</div>
            <div className="card-sub">Đơn chỉ được đối soát khi kế toán đã xác nhận nhận tiền COD từ shipper</div>
          </div>
          <select className="acc-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Mọi trạng thái</option>
            <option value="pending">Chờ chuyển tiền</option>
            <option value="paid">Đã chuyển tiền</option>
          </select>
        </div>

        {message && <div className="od-ok">{message}</div>}
        {error && <div className="acc-banner">{error}</div>}

        <SettlementTable items={items} loading={loading} onOpen={(s) => setOpenId(s.id)} />

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
      {creating && (
        <SettlementCreateModal
          onClose={() => setCreating(false)}
          onSaved={(text) => { setCreating(false); setMessage(text); load(); }}
        />
      )}
    </>
  );
}
