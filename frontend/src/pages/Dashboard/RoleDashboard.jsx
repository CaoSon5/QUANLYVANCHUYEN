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
    // Đơn chờ giao, đang giao, COD: chưa có phần giao hàng nên giữ "—"
    liveValues = [live.pendingPickup, '—', '—', '—'];
    liveSubtitle = `Có ${live.pendingPickup} yêu cầu lấy hàng đang chờ tại kho của bạn, bạn đã nhận ${live.acceptedPickup} đơn chưa lấy.`;
  }

  if (live && role === 'warehouse') {
    // Đã xuất hôm nay: chưa có phần xuất kho nên giữ "—"
    liveValues = [live.receivedToday, '—', live.inventory, live.stale48h];
    liveSubtitle = `Có ${live.incoming} đơn đang trên đường về kho, ${live.inventory} đơn đang lưu trong kho.`;
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
