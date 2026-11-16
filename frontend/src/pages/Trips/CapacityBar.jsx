// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import './trips.css';

// Thanh tải trọng của xe: đang chở bao nhiêu trên tối đa bao nhiêu
export default function CapacityBar({ load, capacity }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((load / capacity) * 100)) : 0;
  const free = Math.max(0, capacity - load);
  return (
    <div className="cap">
      <div className="cap-bar"><span className={pct >= 90 ? 'full' : ''} style={{ width: `${pct}%` }} /></div>
      <div className="cap-text">Đang chở <b>{load} kg</b> / tải tối đa {capacity} kg · còn trống <b>{free} kg</b></div>
    </div>
  );
}
