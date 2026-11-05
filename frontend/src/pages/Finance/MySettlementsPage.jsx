// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Finance\
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import { mySettlementApi } from '../../api/financeApi';
import { getErrorMessage } from '../../api/authApi';
import SettlementTable from './SettlementTable';
import SettlementDetailModal from './SettlementDetailModal';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import './finance.css';

const PAGE_SIZE = 10;

// Người bán: xem bảng đối soát theo kỳ của chính mình (FR67)
export default function MySettlementsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await mySettlementApi.list({ status: status || undefined, page, pageSize: PAGE_SIZE });
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
        title="Đối soát COD"
        subtitle="Tiền thu hộ của các đơn đã giao, sau khi trừ phí vận chuyển, được đối soát và chuyển cho bạn theo kỳ."
      />

      <div className="result-banner section" style={{ marginTop: 24 }}>
        <b>Cách tính:</b> Tiền nhận = COD đã thu − phí vận chuyển ± khoản phát sinh (nếu có).
        Đơn chỉ vào bảng đối soát khi công ty đã nhận tiền COD từ shipper.
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Bảng đối soát của tôi</div>
            <div className="card-sub">Bấm "Xem" để biết chi tiết từng đơn trong kỳ</div>
          </div>
          <select className="acc-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Mọi trạng thái</option>
            <option value="pending">Chờ chuyển tiền</option>
            <option value="paid">Đã chuyển tiền</option>
          </select>
        </div>

        {error && <div className="acc-banner">{error}</div>}

        <SettlementTable items={items} loading={loading} showSeller={false} onOpen={(s) => setOpenId(s.id)} />

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
    </>
  );
}
