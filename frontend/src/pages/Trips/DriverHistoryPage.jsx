// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { tripApi } from '../../api/tripApi';
import { getErrorMessage } from '../../api/authApi';
import { formatDateTime } from '../../utils/format';
import TripDetailModal from './TripDetailModal';
import '../Accounts/accounts.css';
import '../Orders/orders.css';
import './trips.css';

const PAGE_SIZE = 10;

const hours = (a, b) => (a && b ? Math.round(((new Date(b) - new Date(a)) / 3_600_000) * 10) / 10 : null);

// Tài xế: lịch sử các chuyến đã hoàn thành
export default function DriverHistoryPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailId, setDetailId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tripApi.list({ status: 'completed', page, pageSize: PAGE_SIZE });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Lịch sử chuyến" subtitle="Các chuyến bạn đã hoàn thành." />

      <div className="grid grid-3 section">
        <StatCard index={0} label="Chuyến đã hoàn thành" value={total} />
      </div>

      {error && <div className="acc-banner">{error}</div>}

      <div className="card acc-card section">
        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 720 }}>
            <thead><tr><th>MÃ CHUYẾN</th><th>XUẤT PHÁT</th><th>HOÀN THÀNH</th><th>THỜI GIAN CHẠY</th><th>BAO ĐÃ GIAO</th><th /></tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td className="code-link">{t.code}</td>
                  <td>{formatDateTime(t.startedAt)}</td>
                  <td>{formatDateTime(t.completedAt)}</td>
                  <td>{hours(t.startedAt, t.completedAt) ?? '—'} giờ</td>
                  <td>{t.bundlesReceived}{t.bundlesMissing > 0 && <span className="chk-bad"> · {t.bundlesMissing} thiếu</span>}</td>
                  <td><button className="act-btn" onClick={() => setDetailId(t.id)}>Xem</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && !error && <div className="acc-empty">Bạn chưa hoàn thành chuyến nào.</div>}
          {loading && items.length === 0 && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="acc-foot">
          <span>Tổng <b>{total}</b> chuyến</span>
          <div className="acc-pager">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            <span>Trang {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div>
      </div>

      {detailId && <TripDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}
