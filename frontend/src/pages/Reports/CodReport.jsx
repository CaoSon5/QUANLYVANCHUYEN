// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Reports\
import StatCard from '../../components/common/StatCard';
import { reportApi } from '../../api/reportApi';
import { downloadCsv } from '../../utils/csv';
import { formatDateOnly, formatDateTime, formatShortMoney, formatVnd } from '../../utils/format';
import useReport from './useReport';
import '../Accounts/accounts.css';
import './reports.css';

// FR18: báo cáo đối soát COD, theo dõi tiền từ khách -> shipper -> công ty -> người bán
export default function CodReport({ range }) {
  const { data, loading, error } = useReport(
    () => reportApi.cod({ from: range.from, to: range.to }),
    [range.from, range.to],
  );

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`bao-cao-cod-${data.from}-${data.to}.csv`, [
      ['Chỉ tiêu', 'Giá trị (đ)', 'Ghi chú'],
      ['COD shipper đã thu', data.codCollected, `${data.codOrders} đơn, trong kỳ`],
      ['Kế toán đã nhận từ shipper', data.confirmedReceived, 'trong kỳ'],
      ['Chênh lệch khi nộp', data.netDifference, `${data.shortRemittances} phiếu thiếu tiền, trong kỳ`],
      ['Đã chuyển cho người bán', data.paidOut, `${data.paidSettlements} bảng, trong kỳ`],
      ['Shipper chưa nộp', data.held, 'tại thời điểm xem'],
      ['Đã nộp, chờ kế toán xác nhận', data.pendingRemittanceAmount, `${data.pendingRemittances} phiếu, tại thời điểm xem`],
      ['Chờ chuyển cho người bán', data.pendingPayout, `${data.pendingSettlements} bảng, tại thời điểm xem`],
      [],
      ['Shipper đang giữ tiền', 'Số đơn', 'Số tiền (đ)'],
      ...data.holdings.map((h) => [h.shipperName, h.orderCount, h.amount]),
    ]);
  };

  return (
    <>
      {error && <div className="acc-banner">{error}</div>}

      <div className="sub-title">Trong kỳ đã chọn{data ? ` (${formatDateOnly(data.from)} đến ${formatDateOnly(data.to)})` : ''}</div>
      <div className="grid grid-4" style={{ marginTop: 12 }}>
        <StatCard index={0} label="COD shipper đã thu" value={data ? formatShortMoney(data.codCollected) : '—'} />
        <StatCard index={1} label="Kế toán đã nhận từ shipper" value={data ? formatShortMoney(data.confirmedReceived) : '—'} />
        <StatCard index={2} label="Chênh lệch khi nộp" value={data ? (data.netDifference === 0 ? '0đ' : formatShortMoney(data.netDifference)) : '—'} />
        <StatCard index={3} label="Đã chuyển cho người bán" value={data ? formatShortMoney(data.paidOut) : '—'} />
      </div>

      <div className="sub-title">Tại thời điểm xem</div>
      <div className="grid grid-4" style={{ marginTop: 12 }}>
        <StatCard index={0} label="Shipper chưa nộp" value={data ? formatShortMoney(data.held) : '—'} />
        <StatCard index={1} label="Đã nộp, chờ kế toán xác nhận" value={data ? formatShortMoney(data.pendingRemittanceAmount) : '—'} />
        <StatCard index={2} label="Chờ chuyển cho người bán" value={data ? formatShortMoney(data.pendingPayout) : '—'} />
        <StatCard index={3} label="Phiếu nộp thiếu tiền (trong kỳ)" value={data ? data.shortRemittances : '—'} />
      </div>

      <div className="card acc-card section">
        <div className="acc-head">
          <div>
            <div className="card-title">Shipper đang giữ tiền COD</div>
            <div className="card-sub">Tiền đã thu từ khách nhưng chưa nộp về công ty</div>
          </div>
          <button className="btn" disabled={!data} onClick={exportCsv}>Xuất file CSV</button>
        </div>

        <div className="acc-scroll">
          <table className="data-table" style={{ minWidth: 560 }}>
            <thead><tr><th>SHIPPER</th><th>SỐ ĐƠN CHƯA NỘP</th><th>SỐ TIỀN ĐANG GIỮ</th><th>ĐƠN CŨ NHẤT</th></tr></thead>
            <tbody>
              {data?.holdings.map((h) => (
                <tr key={h.shipperId}>
                  <td><b>{h.shipperName}</b><div className="muted" style={{ fontSize: 13 }}>{h.shipperPhone}</div></td>
                  <td>{h.orderCount}</td>
                  <td><b>{formatVnd(h.amount)}</b></td>
                  <td>{formatDateTime(h.oldestDeliveredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.holdings.length === 0 && <div className="acc-empty">Không shipper nào đang giữ tiền COD chưa nộp.</div>}
          {loading && !data && <div className="acc-empty">Đang tải...</div>}
        </div>

        <div className="report-note">
          Chênh lệch khi nộp = tổng (thực nhận − khai nộp) của các phiếu được kế toán xác nhận trong kỳ; số âm nghĩa là shipper nộp thiếu.
          Muốn xử lý phiếu nộp hoặc bảng đối soát, vào mục <b>Đối soát COD</b>.
        </div>
      </div>
    </>
  );
}
