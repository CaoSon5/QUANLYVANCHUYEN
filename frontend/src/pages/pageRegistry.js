// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\
import AccountsPage from './Accounts/AccountsPage';
import WarehousesPage from './Warehouses/WarehousesPage';
import CreatePickupPage from './Orders/CreatePickupPage';
import MyOrdersPage from './Orders/MyOrdersPage';
import TrackingPage from './Orders/TrackingPage';
import PendingPickupPage from './Pickups/PendingPickupPage';
import ConfirmPickupPage from './Pickups/ConfirmPickupPage';
import AdminOrdersPage from './Orders/AdminOrdersPage';
import InboundPage from './WarehouseOps/InboundPage';
import InventoryPage from './WarehouseOps/InventoryPage';

// Trang đã làm xong chức năng thật. Khóa dạng "<role>/<slug>".
// Mục menu nào chưa có ở đây sẽ hiện trang khung (GenericPage).
export const PAGES = {
  'admin/accounts': AccountsPage,
  'admin/warehouses': WarehousesPage,
  'seller/create-pickup': CreatePickupPage,
  'seller/my-orders': MyOrdersPage,
  'seller/tracking': TrackingPage,
  'shipper/pending-pickup': PendingPickupPage,
  'shipper/confirm-pickup': ConfirmPickupPage,
  'admin/orders': AdminOrdersPage,
  'dispatcher/orders': AdminOrdersPage,
  'warehouse/inbound': InboundPage,
  'warehouse/inventory': InventoryPage,
};
