// Đặt vào: frontend\src\pages\Deliveries\DeliveryHistoryPage.jsx
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { deliveryApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { formatDateTime, formatVnd } from '../../utils/format';
import '../Accounts/accounts.css';
import '../Orders/orders.css';

const PAGE_SIZE = 10;

const TABS = [
  { key: '', label: 'Tất cả' },
  { key: 'delivered', label: 'Giao thành công' },
  { key: 'failed', label: 'Giao thất bại' },
];

const RESULT = {
  delivered: { text: 'Thành công', color: '#15803d', bg: '#dcfce7' },
  failed: { text: 'Thất bại, giao lại', color: '#b45309', bg: '#fef3c7' },
  returning: { text: 'Thất bại, chờ hoàn', color: '#b91c1c', bg: '#fee2e2' },
};

// Shipper: lịch sử các lần giao (thành công và thất bại), lấy từ nhật ký trạng thái đơn
export default function DeliveryHistoryPage() {
  const [result, setResult] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await deliveryApi.history({ result: result || undefined, page, pageSize: PAGE_SIZE }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [result, page]);

  useEffect(() => {
    load();
  }, [load]);

  const changeTab = (key) => {
    setResult(key);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Lịch sử giao hàng" subtitle="Các lần bạn đã cập nhật kết quả giao, kèm ghi chú và số COD đã thu." />

      <div className="grid grid-3 section">
        <StatCard index={0} label={result ? 'Số lần theo bộ lọc' : 'Tổng số lần giao'} value={data.total} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Nhật ký giao hàng</div>
            <div className="card-sub">Mới nhất ở trên cùng</div>
          </div>
          <div className="row-actions">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`btn btn-sm ${result === t.key ? 'btn-primary' : ''}`}
                onClick={() => changeTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="acc-banner">{error}</div>}

        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th>THỜI GIAN</th><th>MÃ VẬN ĐƠN</th><th>NGƯỜI NHẬN</th><th>KẾT QUẢ</th><th>COD ĐÃ THU</th><th>GHI CHÚ</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((h) => {
                const r = RESULT[h.result] || RESULT.failed;
                return (
                  <tr key={h.id}>
                    <td>{formatDateTime(h.createdAt)}</td>
                    <td className="code-link">{h.orderCode}</td>
                    <td>
                      <b>{h.receiverName}</b>
                      <div className="muted" style={{ fontSize: 13 }}>{h.receiverAddress}</div>
                    </td>
                    <td>
                      <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: r.color, background: r.bg }}>
                        {r.text}
                      </span>
                    </td>
                    <td>
                      {h.result === 'delivered' && h.codCollected != null
                        ? <b>{h.codCollected > 0 ? formatVnd(h.codCollected) : 'Không thu'}</b>
                        : <span className="muted">—</span>}
                    </td>
                    <td style={{ maxWidth: 320, fontSize: 13 }}>{h.note || <span className="muted">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && data.items.length === 0 && <div className="acc-empty">Chưa có lần giao nào được ghi nhận.</div>}
          {loading && data.items.length === 0 && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="acc-foot">
          <span>Tổng <b>{data.total}</b> lần giao</span>
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
