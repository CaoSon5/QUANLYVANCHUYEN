// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Reports\
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportApi } from '../../api/reportApi';
import { getErrorMessage } from '../../api/authApi';
import { formatVnd } from '../../utils/format';
import RevenueBars from './RevenueBars';
import './reports.css';

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Khung doanh thu 14 ngày gần nhất ở trang Tổng quan của Admin
export default function AdminRevenuePanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
    reportApi
      .shippingRevenue({ granularity: 'day', from: iso(from), to: iso(now) })
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  return (
    <div className="card">
      <div className="chart-head">
        <div>
          <div className="card-title">Doanh thu phí vận chuyển 14 ngày gần nhất</div>
          <div className="card-sub">
            {data ? <>Tổng <b>{formatVnd(data.totalRevenue)}</b> từ {data.totalOrders} đơn giao thành công</> : 'Chỉ tính các đơn giao thành công'}
          </div>
        </div>
        <Link className="btn" to="/admin/reports">Xem báo cáo chi tiết</Link>
      </div>
      {error && <div className="acc-banner">{error}</div>}
      {data && <RevenueBars buckets={data.buckets} height={200} />}
      {!data && !error && <div className="acc-empty">Đang tải...</div>}
    </div>
  );
}
