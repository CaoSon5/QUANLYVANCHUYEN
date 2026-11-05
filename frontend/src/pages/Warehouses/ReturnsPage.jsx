// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\WarehouseOps\
import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { warehouseOrderApi } from '../../api/orderApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { FAILURE_REASONS } from '../../config/orderStatus';
import { formatDateTime } from '../../utils/format';
import '../Accounts/accounts.css';
import '../Orders/orders.css';

const PAGE_SIZE = 10;

// Bàn giao hàng hoàn cho người bán: ghi lại người thực tế nhận hàng
function HandOverModal({ order, onClose, onDone }) {
  const [receiver, setReceiver] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await warehouseOrderApi.handOverReturn({
        code: order.code,
        receiverName: receiver.trim() || null,
        note: note.trim() || null,
      });
      onDone(`Đã bàn giao hàng hoàn của đơn ${order.code}. Người bán sẽ xác nhận khi nhận được hàng.`);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <Modal title={`Bàn giao hàng hoàn ${order.code}`} onClose={onClose}>
      <div className="result-banner">
        Người bán: <b>{order.sellerName}</b> · {order.senderPhone}<br />
        Địa chỉ lấy hàng ban đầu: {order.senderAddress}<br />
        {order.receivedQuantity ?? order.quantity} kiện · giao thất bại {order.deliveryAttempts} lần
        ({FAILURE_REASONS[order.lastFailureReason] ?? 'không rõ lý do'})
      </div>

      <form onSubmit={submit}>
        <label className="form-label">Người nhận hàng hoàn (không bắt buộc)</label>
        <input
          className="form-input"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          maxLength={100}
          placeholder="Ví dụ: chủ shop, hoặc tên shipper mang trả"
          autoFocus
        />
        <label className="form-label">Ghi chú (không bắt buộc)</label>
        <textarea className="form-input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        <div className="form-hint">Chỉ bấm xác nhận khi hàng đã thực sự rời kho. Việc này không hoàn tác được.</div>

        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Xác nhận đã bàn giao'}</button>
        </div>
      </form>
    </Modal>
  );
}

// Nhân viên kho: các đơn giao thất bại hết số lần, đang chờ trả hàng về người bán (FR68)
export default function ReturnsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await warehouseOrderApi.list('returns', { search: debouncedSearch || undefined, page, pageSize: PAGE_SIZE });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Hàng hoàn chờ trả"
        subtitle={user?.warehouseCode
          ? `Đơn của kho ${user.warehouseCode} đã giao thất bại hết số lần, chờ trả hàng về người bán.`
          : 'Đơn đã giao thất bại hết số lần, chờ trả hàng về người bán.'}
      />

      <div className="grid grid-3 section">
        <StatCard index={0} label="Hàng hoàn chờ bàn giao" value={total} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Danh sách hàng hoàn</div>
            <div className="card-sub">Việc người bán tự đến lấy hay shipper mang trả do kho sắp xếp, hệ thống ghi nhận người nhận thực tế.</div>
          </div>
          <div className="acc-search">
            <Search size={16} />
            <input placeholder="Tìm mã đơn, tên người bán..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {message && <div className="od-ok">{message}</div>}
        {error && <div className="acc-banner">{error}</div>}

        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th>MÃ VẬN ĐƠN</th><th>NGƯỜI BÁN / ĐỊA CHỈ LẤY HÀNG</th><th>SỐ KIỆN</th><th>LÝ DO GIAO THẤT BẠI</th><th>CẬP NHẬT</th><th />
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id}>
                  <td className="code-link">{o.code}</td>
                  <td>
                    <b>{o.sellerName}</b> · {o.senderPhone}
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{o.senderAddress}</div>
                  </td>
                  <td>{o.receivedQuantity ?? o.quantity}</td>
                  <td>
                    {FAILURE_REASONS[o.lastFailureReason] ?? <span className="muted">—</span>}
                    <div className="muted" style={{ fontSize: 13 }}>{o.deliveryAttempts} lần giao thất bại</div>
                  </td>
                  <td>{formatDateTime(o.updatedAt ?? o.createdAt)}</td>
                  <td><button className="btn btn-primary btn-sm" onClick={() => setSelected(o)}>Bàn giao</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && !error && (
            <div className="acc-empty">Không có hàng hoàn nào đang chờ. Đơn xuất hiện ở đây khi shipper giao thất bại hết số lần quy định.</div>
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

      {selected && (
        <HandOverModal
          order={selected}
          onClose={() => setSelected(null)}
          onDone={(text) => { setSelected(null); setMessage(text); load(); }}
        />
      )}
    </>
  );
}
