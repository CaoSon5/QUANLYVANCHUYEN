// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Dashboard\
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import OutputChart from './OutputChart';
import DeliveryDonut from './DeliveryDonut';
import OrdersTable from './OrdersTable';
import { useAuth } from '../../context/AuthContext';
import { orderApi } from '../../api/orderApi';
import { shortName } from '../../utils/formatName';
import { formatShortMoney } from '../../utils/format';
import './dashboard.css';

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

  useEffect(() => {
    if (role !== 'seller' && role !== 'shipper' && role !== 'warehouse') return;
    orderApi.summary().then(setLive).catch(() => {});
  }, [role]);

  let liveValues = null;
  let liveSubtitle = subtitle;
  if (live && role === 'seller') {
    liveValues = [live.total, live.inProgress, live.delivered, formatShortMoney(live.codPending)];
  }
  if (live && role === 'shipper') {
    // COD đã thu: chưa có phần ghi nhận giao hàng nên giữ "—"
    liveValues = [live.pendingPickup, live.pendingDelivery, live.outForDelivery, formatShortMoney(live.codCollected)];
    liveSubtitle = `Có ${live.pendingPickup} yêu cầu lấy hàng và ${live.pendingDelivery} đơn chờ giao tại kho của bạn, ${live.outForDelivery} đơn đang giao.`;
  }

  if (live && role === 'warehouse') {
    liveValues = [live.receivedToday, live.dispatchedToday, live.inventory, live.stale48h];
    liveSubtitle = `Có ${live.incoming} đơn đang về kho, ${live.awaitingDispatch} đơn chờ xuất cho shipper, ${live.inventory} đơn đang lưu trong kho.`;
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

      <div className="grid grid-main section">
        <OutputChart />
        <DeliveryDonut />
      </div>

      {showOrdersTable && (
        <div className="section">
          <OrdersTable />
        </div>
      )}
    </>
  );
}
