import AccountsPage from './Accounts/AccountsPage';
import WarehousesPage from './Warehouses/WarehousesPage';
import CreatePickupPage from './Orders/CreatePickupPage';
import MyOrdersPage from './Orders/MyOrdersPage';
import TrackingPage from './Orders/TrackingPage';
import PendingPickupPage from './Pickups/PendingPickupPage';
import ConfirmPickupPage from './Pickups/ConfirmPickupPage';

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
};
