// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Trips\
import { useParams } from 'react-router-dom';
import WarehouseTripList from './WarehouseTripList';
import WarehouseTripHandling from './WarehouseTripHandling';

// /warehouse/trips là danh sách xe, /warehouse/trips/:id là xử lý một xe
export default function WarehouseTripsPage() {
  const { id } = useParams();
  return id ? <WarehouseTripHandling id={id} /> : <WarehouseTripList />;
}
