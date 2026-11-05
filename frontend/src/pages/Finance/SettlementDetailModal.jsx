// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Finance\
import { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import { financeApi, mySettlementApi } from '../../api/financeApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { formatDateOnly, formatDateTime, formatVnd } from '../../utils/format';
import { SettlementPill } from './FinancePills';
import '../Accounts/accounts.css';
import './finance.css';

// Chi tiết một bảng đối soát: cách tính tiền và các đơn trong kỳ (FR60, FR67)
export default function SettlementDetailModal({ id, onClose }) {
  const { role } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const request = role === 'seller' ? mySettlementApi.get(id) : financeApi.settlement(id);
    request.then(setData).catch((err) => setError(getErrorMessage(err)));
  }, [id, role]);

  if (!data) {
    return (
      <Modal title="Bảng đối soát" onClose={onClose} wide>
        {error ? <div className="form-error">{error}</div> : <div className="acc-empty">Đang tải...</div>}
      </Modal>
    );
  }

  const signed = (n) => (n > 0 ? `+${formatVnd(n)}` : formatVnd(n));

  return (
    <Modal title={`Đối soát ${data.code}`} onClose={onClose} wide>
      <div className="result-banner">
        {role !== 'seller' && <>Người bán: <b>{data.sellerName}</b> · {data.sellerPhone}<br /></>}
        Kỳ đối soát: <b>{formatDateOnly(data.from)} đến {formatDateOnly(data.to)}</b> · {data.orderCount} đơn{' '}
        <SettlementPill status={data.status} /><br />
        Lập lúc {formatDateTime(data.createdAt)}{data.createdByName ? ` bởi ${data.createdByName}` : ''}
        {data.status === 'paid' && (
          <>
            <br />Đã chuyển tiền lúc {formatDateTime(data.paidAt)}{data.paidByName ? ` bởi ${data.paidByName}` : ''}
            {data.paymentRef && <> · Mã giao dịch: <b>{data.paymentRef}</b></>}
          </>
        )}
        {data.note && <><br />Ghi chú: {data.note}</>}
      </div>

      <table className="sum-table">
        <tbody>
          <tr><td>Tổng COD đã thu ({data.orderCount} đơn)</td><td>{formatVnd(data.grossCod)}</td></tr>
          <tr><td>Phí vận chuyển</td><td>−{formatVnd(data.shippingFee)}</td></tr>
          {data.adjustments.map((a, i) => (
            <tr key={i}>
              <td>Khoản phát sinh: {a.description}</td>
              <td className={a.amount < 0 ? 'money-neg' : 'money-pos'}>{signed(a.amount)}</td>
            </tr>
          ))}
          <tr className="sum-total">
            <td>{data.netAmount < 0 ? 'Người bán còn nợ' : 'Số tiền chuyển cho người bán'}</td>
            <td className={data.netAmount < 0 ? 'money-neg' : 'money-pos'}>{formatVnd(Math.abs(data.netAmount))}</td>
          </tr>
        </tbody>
      </table>
      {data.netAmount < 0 && (
        <div className="form-hint">Phí vận chuyển lớn hơn tiền COD thu được trong kỳ nên khoản chênh lệch được bù trừ vào kỳ sau hoặc thu riêng.</div>
      )}

      <div className="acc-scroll" style={{ margin: '18px 0 0' }}>
        <table className="data-table" style={{ minWidth: 560 }}>
          <thead><tr><th>MÃ VẬN ĐƠN</th><th>NGƯỜI NHẬN</th><th>GIAO LÚC</th><th>COD ĐÃ THU</th><th>PHÍ VC</th></tr></thead>
          <tbody>
            {data.orders.map((o) => (
              <tr key={o.id}>
                <td className="code-link">{o.code}</td>
                <td>{o.receiverName}</td>
                <td>{formatDateTime(o.deliveredAt)}</td>
                <td>{formatVnd(o.codCollected)}</td>
                <td>{formatVnd(o.shippingFee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.orders.length === 0 && <div className="acc-empty">Bảng này chỉ có khoản phát sinh, không có đơn hàng.</div>}
      </div>

      <div className="form-actions"><button className="btn" onClick={onClose}>Đóng</button></div>
    </Modal>
  );
}
