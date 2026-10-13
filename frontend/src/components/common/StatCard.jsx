// Đặt vào: D:\spreeexpress\frontend\src\components\common\
import { Package, Truck, TrendingUp, Wallet } from 'lucide-react';
import './common.css';

// 4 kiểu icon/màu cố định theo thứ tự thẻ (giống Figma)
const STYLES = [
  { icon: Package, tone: 'blue' },
  { icon: Truck, tone: 'sky' },
  { icon: TrendingUp, tone: 'green' },
  { icon: Wallet, tone: 'purple' },
];

// value: số hiển thị, chưa có thì hiện "—".
// trend: chuỗi tăng trưởng, ví dụ "12.5%". Chỉ hiện nhãn khi được truyền vào (chưa có số thật thì bỏ trống).
export default function StatCard({ index = 0, label, value = '—', trend }) {
  const { icon: Icon, tone } = STYLES[index % STYLES.length];
  return (
    <div className="card stat-card">
      <div className="stat-top">
        <span className={`stat-icon tone-${tone}`}><Icon size={20} /></span>
        {trend && <span className="trend"><TrendingUp size={12} /> {trend}</span>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
