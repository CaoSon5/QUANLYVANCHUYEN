// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Reports\
import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DateRangeBar, { defaultRange } from './DateRangeBar';
import OrderStatusReport from './OrderStatusReport';
import ShipperReport from './ShipperReport';
import InventoryReport from './InventoryReport';
import CodReport from './CodReport';
import '../Accounts/accounts.css';
import './reports.css';

const TABS = [
  { key: 'orders', label: 'Đơn hàng & tỉ lệ giao' },
  { key: 'shippers', label: 'Hiệu suất shipper' },
  { key: 'inventory', label: 'Tồn kho' },
  { key: 'cod', label: 'Đối soát COD' },
];

// Báo cáo vận hành cho Admin (FR13, FR15, FR16, FR17, FR18). Doanh thu (FR14) có trang riêng.
export default function OpsReportsPage() {
  const [tab, setTab] = useState('orders');
  const [range, setRange] = useState(defaultRange());

  return (
    <>
      <PageHeader title="Báo cáo vận hành" subtitle="Tình hình đơn hàng, hiệu suất shipper, tồn kho và dòng tiền COD." />

      <div className="card acc-card section">
        <div className="report-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`btn ${tab === t.key ? 'btn-primary' : ''}`}
              style={tab === t.key ? { boxShadow: 'none' } : undefined}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab !== 'inventory' && <DateRangeBar range={range} onChange={setRange} />}
      </div>

      {tab === 'orders' && <OrderStatusReport range={range} />}
      {tab === 'shippers' && <ShipperReport range={range} />}
      {tab === 'inventory' && <InventoryReport />}
      {tab === 'cod' && <CodReport range={range} />}
    </>
  );
}
