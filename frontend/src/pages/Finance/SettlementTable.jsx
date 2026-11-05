// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Finance\
import { formatDateOnly, formatVnd } from '../../utils/format';
import { SettlementPill } from './FinancePills';
import '../Accounts/accounts.css';
import './finance.css';

// Bảng danh sách bảng đối soát, dùng chung cho Kế toán và Người bán
export default function SettlementTable({ items, loading, showSeller = true, onOpen, onPay }) {
  return (
    <div className="acc-scroll">
      <table className="data-table" style={{ minWidth: 920 }}>
        <thead>
          <tr>
            <th>MÃ ĐỐI SOÁT</th>{showSeller && <th>NGƯỜI BÁN</th>}<th>KỲ</th><th>SỐ ĐƠN</th>
            <th>COD ĐÃ THU</th><th>PHÍ VC</th><th>PHÁT SINH</th><th>THỰC TRẢ</th><th>TRẠNG THÁI</th><th />
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id}>
              <td className="code-link">{s.code}</td>
              {showSeller && <td>{s.sellerName}</td>}
              <td style={{ whiteSpace: 'nowrap' }}>{formatDateOnly(s.from)} - {formatDateOnly(s.to)}</td>
              <td>{s.orderCount}</td>
              <td>{formatVnd(s.grossCod)}</td>
              <td>−{formatVnd(s.shippingFee)}</td>
              <td>{s.totalAdjustments === 0 ? <span className="muted">—</span> : formatVnd(s.totalAdjustments)}</td>
              <td className={s.netAmount < 0 ? 'money-neg' : 'money-pos'}>{formatVnd(s.netAmount)}</td>
              <td><SettlementPill status={s.status} /></td>
              <td>
                <div className="row-actions">
                  <button className="act-btn" onClick={() => onOpen(s)}>Xem</button>
                  {onPay && s.status === 'pending' && (
                    <button className="btn btn-primary btn-sm" onClick={() => onPay(s)}>
                      {s.netAmount > 0 ? 'Xác nhận chuyển tiền' : 'Xác nhận bù trừ'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && items.length === 0 && <div className="acc-empty">Chưa có bảng đối soát nào.</div>}
      {loading && items.length === 0 && <div className="acc-empty">Đang tải...</div>}
    </div>
  );
}
