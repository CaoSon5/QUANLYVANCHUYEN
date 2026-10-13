import { ORDER_STATUS } from '../../config/orderStatus';
import './orders.css';

export default function OrderStatusPill({ status }) {
  const s = ORDER_STATUS[status] ?? { label: status, tone: 'gray' };
  return <span className={`st st-${s.tone}`}>{s.label}</span>;
}
