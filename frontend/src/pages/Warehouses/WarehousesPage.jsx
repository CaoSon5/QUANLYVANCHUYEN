import { useParams } from 'react-router-dom';
import WarehouseList from './WarehouseList';
import WarehouseDetail from './WarehouseDetail';

// /<role>/warehouses -> danh sách kho; /<role>/warehouses/<id> -> chi tiết kho
export default function WarehousesPage() {
  const { id } = useParams();
  return id ? <WarehouseDetail id={id} /> : <WarehouseList />;
}
