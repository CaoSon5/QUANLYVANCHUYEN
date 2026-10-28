// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Deliveries\
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { deliveryApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { formatDateTime, formatShortMoney } from '../../utils/format';
import OrderStatusPill from '../Orders/OrderStatusPill';
import DeliverModal from './DeliverModal';
import FailModal from './FailModal';
import '../Accounts/accounts.css';
import '../Orders/orders.css';

const PAGE_SIZE = 10;

// Shipper: các đơn kho đã xuất cho mình. Cập nhật giao thành công (kèm thu COD) hoặc giao thất bại (FR53 đến FR56).
export default function DeliveringPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState(null); // { type: 'deliver' | 'fail', order }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await deliveryApi.mine({ status: 'out_for_delivery', page, pageSize: PAGE_SIZE });
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

  const handleSaved = (text) => {
    setModal(null);
    setMessage(text);
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Đang giao hàng" subtitle="Các đơn kho đã xuất cho bạn. Giao xong hãy cập nhật kết quả cho từng đơn." />

      <div className="grid grid-3 section">
        <StatCard index={0} label="Đơn đang giao" value={total} />
      </div>

      <div className="card acc-card section">
        <div className="card-title">Danh sách đơn đang giao</div>
        <div className="card-sub">Bấm "Giao thành công" khi đã bàn giao hàng, hoặc "Thất bại" nếu không giao được.</div>

        {message && <div className="od-ok">{message}</div>}
        {error && <div className="acc-banner">{error}</div>}

        <div className="acc-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ VẬN ĐƠN</th><th>NGƯỜI NHẬN / ĐỊA CHỈ GIAO</th><th>COD CẦN THU</th>
                <th>LẦN GIAO</th><th>XUẤT KHO LÚC</th><th>TRẠNG THÁI</th><th />
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id}>
                  <td className="code-link">{o.code}</td>
                  <td>
                    <b>{o.receiverName}</b> · <a href={`tel:${o.receiverPhone}`} style={{ color: 'var(--primary)' }}>{o.receiverPhone}</a>
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      {o.receiverAddress}, {o.receiverDistrict}, {o.receiverProvince}
                    </div>
                    {o.note && <div style={{ fontSize: 13, marginTop: 2, color: '#b45309' }}>Ghi chú: {o.note}</div>}
                  </td>
                  <td>{o.codAmount > 0 ? <b>{formatShortMoney(o.codAmount)}</b> : <span className="muted">—</span>}</td>
                  <td>{o.deliveryAttempts + 1}/{o.maxDeliveryAttempts}</td>
                  <td>{formatDateTime(o.dispatchedAt)}</td>
                  <td><OrderStatusPill status={o.status} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'deliver', order: o })}>Giao thành công</button>
                      <button className="act-btn danger" onClick={() => setModal({ type: 'fail', order: o })}>Thất bại</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <div className="acc-empty">Bạn chưa có đơn nào đang giao. Đơn xuất hiện ở đây sau khi nhân viên kho xuất hàng cho bạn.</div>
          )}
          {loading && items.length === 0 && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="acc-foot">
          <span>Tổng <b>{total}</b> đơn</span>
          <div className="acc-pager">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
            <span>Trang {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
          </div>
        </div>
      </div>

      {modal?.type === 'deliver' && <DeliverModal order={modal.order} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal?.type === 'fail' && <FailModal order={modal.order} onClose={() => setModal(null)} onSaved={handleSaved} />}
    </>
  );
}
