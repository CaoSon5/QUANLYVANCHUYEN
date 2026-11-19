// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Finance\
import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { financeApi } from '../../api/financeApi';
import { getErrorMessage } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { downloadExcel } from '../../utils/excel';
import { formatVnd } from '../../utils/format';
import { buildFinanceWorkbook } from './financeReportExcel';
import '../Accounts/accounts.css';
import './financeReport.css';

const GRANULARITIES = [
  { key: 'day', label: 'Theo ngày' },
  { key: 'month', label: 'Theo tháng' },
  { key: 'year', label: 'Theo năm' },
];
const COLUMN_TITLE = { day: 'NGÀY', month: 'THÁNG', year: 'NĂM' };

const pad = (n) => String(n).padStart(2, '0');
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Khoảng mặc định theo từng cách xem, nằm trong giới hạn của backend (ngày 93, tháng 36, năm 10)
function defaultRange(g) {
  const to = new Date();
  const from = new Date();
  if (g === 'month') from.setMonth(from.getMonth() - 11, 1);
  else if (g === 'year') from.setFullYear(from.getFullYear() - 4, 0, 1);
  else from.setDate(from.getDate() - 29);
  return { from: toIso(from), to: toIso(to) };
}

// "2026-10-31" -> "31/10/2026"
const fmtDate = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const Money = ({ value }) => (
  <span className={value < 0 ? 'fr-neg' : undefined}>{formatVnd(value)}</span>
);

// Kế toán: báo cáo tài chính (dòng tiền COD trong kỳ, công nợ hiện tại). Admin cũng xem được.
export default function FinanceReportPage() {
  const { user } = useAuth();

  const [granularity, setGranularity] = useState('month');
  const [range, setRange] = useState(() => defaultRange('month'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!range.from || !range.to) return undefined;
    if (range.from > range.to) {
      setError('Ngày bắt đầu phải trước ngày kết thúc');
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    financeApi
      .report({ granularity, from: range.from, to: range.to })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [granularity, range]);

  const chooseGranularity = (g) => {
    setGranularity(g);
    setRange(defaultRange(g));
  };

  const exportExcel = async () => {
    if (!data) return;
    setExporting(true);
    setError('');
    try {
      await downloadExcel(
        `bao-cao-tai-chinh_${data.from}_${data.to}.xlsx`,
        (workbook) => buildFinanceWorkbook(workbook, data, user?.fullName),
      );
    } catch (err) {
      setError(
        err?.message?.includes('exceljs') || err?.message?.includes('import')
          ? 'Chưa cài thư viện xuất Excel. Hãy chạy "npm install exceljs" trong thư mục frontend rồi chạy lại.'
          : getErrorMessage(err),
      );
    } finally {
      setExporting(false);
    }
  };

  const steps = data
    ? [
        { label: 'Shipper đã thu', value: data.codCollected, color: '#378ADD' },
        { label: 'Đã về công ty', value: data.codRemitted, color: '#1D9E75' },
        { label: 'Đã đối soát người bán', value: data.codSettled, color: '#7F77DD' },
        { label: 'Đã chuyển cho người bán', value: data.paidOut, color: '#D85A30' },
      ]
    : [];
  const maxStep = Math.max(1, ...steps.map((s) => s.value));

  return (
    <>
      <PageHeader
        title="Báo cáo tài chính"
        subtitle="Dòng tiền COD từ shipper đến người bán và các khoản công nợ hiện tại."
      />

      <div className="card section">
        <div className="fr-filter">
          <div className="fr-filter-left">
            {GRANULARITIES.map((g) => (
              <button
                key={g.key} type="button"
                className={`btn ${granularity === g.key ? 'btn-primary' : ''}`}
                style={granularity === g.key ? { boxShadow: 'none' } : undefined}
                onClick={() => chooseGranularity(g.key)}
              >
                {g.label}
              </button>
            ))}
            <div className="fr-date">
              <label htmlFor="fr-from">Từ ngày</label>
              <input id="fr-from" type="date" value={range.from} max={range.to} onChange={(e) => setRange({ ...range, from: e.target.value })} />
            </div>
            <div className="fr-date">
              <label htmlFor="fr-to">Đến ngày</label>
              <input id="fr-to" type="date" value={range.to} min={range.from} onChange={(e) => setRange({ ...range, to: e.target.value })} />
            </div>
          </div>
          <button type="button" className="btn" disabled={!data || loading || exporting} onClick={exportExcel}>
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
        {error && <div className="acc-banner">{error}</div>}
      </div>

      {data && (
        <>
          <div className="grid grid-4 section">
            <StatCard index={0} label="Tổng COD shipper đã thu" value={formatVnd(data.codCollected)} showTrend={false} />
            <StatCard index={1} label="Đã về công ty" value={formatVnd(data.codRemitted)} showTrend={false} />
            <StatCard index={2} label="Đã trả người bán" value={formatVnd(data.paidOut)} showTrend={false} />
            <StatCard index={3} label="Doanh thu phí vận chuyển" value={formatVnd(data.shippingFee)} showTrend={false} />
          </div>

          <div className="fr-two section">
            <div className="card">
              <div className="card-title">Dòng tiền COD</div>
              <div className="card-sub">
                Từ {fmtDate(data.from)} đến {fmtDate(data.to)}. Tiền thu hộ đi qua từng bước, từ shipper đến người bán.
              </div>
              <div className="fr-flow">
                {steps.map((s) => (
                  <div key={s.label} className="fr-step">
                    <span>{s.label}</span>
                    <div className="fr-bar"><i style={{ width: `${(s.value / maxStep) * 100}%`, background: s.color }} /></div>
                    <span className="fr-amt">{formatVnd(s.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Công nợ hiện tại</div>
              <div className="card-sub">Tính đến hôm nay, không phụ thuộc kỳ báo cáo</div>
              <div className="fr-debt">
                <div><span>Shipper đang giữ, chưa nộp</span><b className={data.shipperHolding > 0 ? 'fr-warn' : undefined}>{formatVnd(data.shipperHolding)}</b></div>
                <div><span>Phiếu nộp chờ xác nhận</span><b>{formatVnd(data.remittancesPendingAmount)}</b></div>
                <div><span>COD đã về, chưa lập đối soát</span><b>{formatVnd(data.receivedNotSettled)}</b></div>
                <div><span>Bảng đối soát chờ chuyển tiền</span><b>{formatVnd(data.payoutPending)}</b></div>
                <div><span>Chênh lệch khi nộp tiền (cộng dồn)</span><b><Money value={data.differenceTotal} /></b></div>
              </div>
            </div>
          </div>

          <div className="card acc-card section">
            <div className="card-title">Chi tiết theo {GRANULARITIES.find((g) => g.key === data.granularity)?.label.toLowerCase().replace('theo ', '')}</div>
            <div className="card-sub">Mỗi dòng là một kỳ trong khoảng đã chọn</div>

            <div className="acc-scroll">
              <table className="data-table" style={{ minWidth: 820 }}>
                <thead>
                  <tr>
                    <th>{COLUMN_TITLE[data.granularity]}</th>
                    <th className="num">COD ĐÃ THU</th><th className="num">ĐÃ VỀ CÔNG TY</th><th className="num">ĐÃ ĐỐI SOÁT</th>
                    <th className="num">ĐÃ TRẢ NGƯỜI BÁN</th><th className="num">PHÍ VẬN CHUYỂN</th><th className="num">CHÊNH LỆCH</th>
                  </tr>
                </thead>
                <tbody>
                  {data.buckets.map((b) => (
                    <tr key={b.key}>
                      <td><b>{b.label}</b></td>
                      <td className="num">{formatVnd(b.codCollected)}</td>
                      <td className="num">{formatVnd(b.codRemitted)}</td>
                      <td className="num">{formatVnd(b.codSettled)}</td>
                      <td className="num">{formatVnd(b.paidOut)}</td>
                      <td className="num">{formatVnd(b.shippingFee)}</td>
                      <td className="num"><Money value={b.difference} /></td>
                    </tr>
                  ))}
                  <tr className="fr-total">
                    <td>Tổng cộng</td>
                    <td className="num">{formatVnd(data.codCollected)}</td>
                    <td className="num">{formatVnd(data.codRemitted)}</td>
                    <td className="num">{formatVnd(data.codSettled)}</td>
                    <td className="num">{formatVnd(data.paidOut)}</td>
                    <td className="num">{formatVnd(data.shippingFee)}</td>
                    <td className="num"><Money value={data.difference} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="fr-note">
              Mỗi cột tính theo ngày phát sinh của chính nó: COD theo ngày giao, đã về công ty theo ngày xác nhận phiếu,
              đã đối soát theo ngày lập bảng, đã trả người bán theo ngày chuyển tiền. Vì vậy các cột không nhất thiết bằng nhau trong cùng một kỳ.
            </div>
          </div>
        </>
      )}

      {!data && loading && <div className="card section"><div className="acc-empty">Đang tải...</div></div>}
    </>
  );
}
