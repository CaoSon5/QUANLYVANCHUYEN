// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Dashboard\
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import OutputChart from './OutputChart';
import DeliveryDonut from './DeliveryDonut';
import OrdersTable from './OrdersTable';
import { useAuth } from '../../context/AuthContext';
import { orderApi, deliveryApi } from '../../api/orderApi';
import { financeApi, codApi } from '../../api/financeApi';
import { reportApi } from '../../api/reportApi';
import AdminRevenuePanel from '../Reports/AdminRevenuePanel';
import { shortName } from '../../utils/formatName';
import { formatShortMoney } from '../../utils/format';
import './dashboard.css';

const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const two = (n) => String(n).padStart(2, '0');

// Nhãn trục ngang của biểu đồ shipper: 7 ngày hiện thứ, 30 ngày hiện ngày/tháng (cách 5 ngày một nhãn cho đỡ chật)
function dayLabel(iso, index, total) {
  const [y, m, d] = iso.split('-').map(Number);
  if (total <= 7) return WEEKDAY[new Date(y, m - 1, d).getDay()];
  return index % 5 === 0 ? `${two(d)}/${two(m)}` : '';
}

const SHIPPER_DONUT_GROUPS = [
  { key: 'success', label: 'Giao thành công', color: '#2563eb' },
  { key: 'failed', label: 'Giao thất bại', color: '#ef4444' },
];

// Trang tổng quan dùng chung cho mọi vai trò, nội dung khung lấy từ config.dashboard.
// - Thẻ thống kê: hiện "—" cho tới khi có số thật.
//     + Người bán và Shipper đã nối API (/api/orders/summary).
//     + Các vai trò khác: nối API ở đây khi làm xong chức năng tương ứng.
// - Biểu đồ: hiện khung trống. Khi có dữ liệu, truyền prop data vào OutputChart / DeliveryDonut.
export default function RoleDashboard({ config }) {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { subtitle, stats, showOrdersTable, greeting, action } = config.dashboard;
  const title = greeting ? `Xin chào, ${shortName(user.fullName)}!` : config.dashboard.title;

  const [live, setLive] = useState(null);
  const [holding, setHolding] = useState(null); // shipper: COD đang giữ
  const [shipperStats, setShipperStats] = useState(null); // shipper: thống kê số lượt giao
  const [days, setDays] = useState(7); // shipper: kỳ thống kê (7 hoặc 30 ngày)

  useEffect(() => {
    if (role === 'admin') {
      // Tổng quan Admin: số đơn toàn hệ thống và doanh thu phí vận chuyển tháng này
      const t = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const day = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      Promise.all([
        orderApi.summary(),
        reportApi.shippingRevenue({ granularity: 'month', from: day(new Date(t.getFullYear(), t.getMonth(), 1)), to: day(t) }),
      ])
        .then(([summary, revenue]) => setLive({ ...summary, revenueMonth: revenue.totalRevenue }))
        .catch(() => {});
      return;
    }
    if (role === 'accountant') {
      financeApi.summary().then(setLive).catch(() => {});
      return;
    }
    if (role === 'shipper') codApi.holding().then(setHolding).catch(() => {});
    if (role !== 'seller' && role !== 'shipper' && role !== 'warehouse') return;
    orderApi.summary().then(setLive).catch(() => {});
  }, [role]);

  // Shipper: số lượt giao thành công/thất bại theo ngày cho hai biểu đồ
  useEffect(() => {
    if (role !== 'shipper') return;
    deliveryApi.stats({ days }).then(setShipperStats).catch(() => {});
  }, [role, days]);

  let liveValues = null;
  let liveSubtitle = subtitle;
  if (live && role === 'seller') {
    liveValues = [live.total, live.inProgress, live.delivered, formatShortMoney(live.codPending)];
    if (live.returnsPending > 0) {
      liveSubtitle = `Có ${live.returnsPending} đơn hàng hoàn đang chờ bạn xác nhận đã nhận lại.`;
    }
  }
  if (live && role === 'shipper') {
    // Thẻ cuối: COD đang giữ (đã thu, chưa nộp cho kế toán)
    liveValues = [
      live.pendingPickup, live.pendingDelivery, live.outForDelivery,
      holding ? formatShortMoney(holding.totalAmount) : '—',
    ];
    liveSubtitle = `Có ${live.pendingPickup} yêu cầu lấy hàng và ${live.pendingDelivery} đơn chờ giao tại kho của bạn, ${live.outForDelivery} đơn đang giao.`;
    if (holding && holding.orderCount > 0) {
      liveSubtitle += ` Bạn đang giữ COD của ${holding.orderCount} đơn chưa nộp.`;
    }
  }

  if (live && role === 'warehouse') {
    liveValues = [live.receivedToday, live.dispatchedToday, live.inventory, live.stale48h];
    liveSubtitle = `Có ${live.incoming} đơn đang về kho, ${live.awaitingDispatch} đơn chờ xuất cho shipper, ${live.inventory} đơn đang lưu trong kho.`;
    if (live.returnsPending > 0) liveSubtitle += ` ${live.returnsPending} đơn hàng hoàn chờ bàn giao cho người bán.`;
  }

  if (live && role === 'admin') {
    liveValues = [live.total, live.inProgress, live.delivered, formatShortMoney(live.revenueMonth)];
  }

  if (live && role === 'accountant') {
    liveValues = [
      formatShortMoney(live.codCollectedTotal), formatShortMoney(live.codHeld),
      live.settlementsPending, live.settlementsPaid,
    ];
    liveSubtitle = `Có ${live.remittancesPending} phiếu nộp COD chờ xác nhận, ${live.settlementsPending} bảng đối soát chờ chuyển tiền (${formatShortMoney(live.pendingPayoutAmount)}).`;
  }

  // Biểu đồ: chỉ Shipper truyền thêm tuỳ chọn, các vai trò khác giữ nguyên giao diện mặc định
  let outputProps = {};
  let donutProps = {};
  if (role === 'shipper') {
    const n = shipperStats ? shipperStats.daily.length : days;
    outputProps = {
      data: shipperStats
        ? shipperStats.daily.map((d, i) => ({
            day: dayLabel(d.date, i, n),
            tip: d.date.split('-').reverse().join('/'),
            done: d.delivered,
          }))
        : undefined,
      title: 'Đơn đã giao',
      subtitle: shipperStats
        ? `Bạn đã giao ${shipperStats.delivered} đơn trong ${shipperStats.days} ngày qua`
        : `Số đơn giao thành công trong ${days} ngày qua`,
      legend: [{ label: 'Đơn giao thành công', color: '#2f7bff' }],
      range: {
        value: days,
        options: [{ value: 7, label: '7 ngày' }, { value: 30, label: '30 ngày' }],
        onChange: setDays,
      },
    };
    donutProps = {
      data: shipperStats && shipperStats.delivered + shipperStats.failed > 0
        ? { total: shipperStats.delivered + shipperStats.failed, counts: { success: shipperStats.delivered, failed: shipperStats.failed } }
        : undefined,
      title: 'Kết quả các lượt giao',
      subtitle: `Số lượt giao trong ${shipperStats ? shipperStats.days : days} ngày qua`,
      groups: SHIPPER_DONUT_GROUPS,
      centerLabel: 'Tổng lượt giao',
      emptyNote: 'Chưa có lượt giao nào trong kỳ này.',
      doneNote: 'Mỗi lần giao thất bại tính là một lượt, đơn phải giao lại nhiều lần sẽ được tính nhiều lượt.',
    };
  }

  return (
    <>
      <PageHeader
        title={title}
        subtitle={liveSubtitle}
        action={action}
        // Người bán: mở form tạo yêu cầu lấy hàng. Nhân viên kho: chờ làm chức năng tạo đơn tại quầy.
        onAction={role === 'seller' ? () => navigate('/seller/create-pickup') : undefined}
      />

      <div className="grid grid-4 section">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            index={i}
            label={s.label}
            value={liveValues ? String(liveValues[i]) : s.value}
            showTrend={false}
          />
        ))}
      </div>

      {role === 'admin' ? (
        <div className="section">
          <AdminRevenuePanel />
        </div>
      ) : (
        <div className="grid grid-main section">
          <OutputChart {...outputProps} />
          <DeliveryDonut {...donutProps} />
        </div>
      )}

      {showOrdersTable && (
        <div className="section">
          <OrdersTable />
        </div>
      )}
    </>
  );
}
