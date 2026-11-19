// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\
import AccountsPage from './Accounts/AccountsPage';
import WarehousesPage from './Warehouses/WarehousesPage';
import CreatePickupPage from './Orders/CreatePickupPage';
import MyOrdersPage from './Orders/MyOrdersPage';
import TrackingPage from './Orders/TrackingPage';
import PendingPickupPage from './Pickups/PendingPickupPage';
import ConfirmPickupPage from './Pickups/ConfirmPickupPage';
import AdminOrdersPage from './Orders/AdminOrdersPage';
import InboundPage from './Warehouses/InboundPage';
import InventoryPage from './Warehouses/InventoryPage';
import OutboundPage from './Warehouses/OutboundPage';
import ReturnsPage from './Warehouses/ReturnsPage';
import BundlesPage from './Warehouses/BundlesPage';
import WarehouseTripsPage from './Trips/WarehouseTripsPage';
import PostOfficePage from './Warehouses/PostOfficePage';
import DispatchPage from './Trips/DispatchPage';
import TripTrackingPage from './Trips/TripTrackingPage';
import DelayAlertsPage from './Trips/DelayAlertsPage';
import DriverTripPage from './Trips/DriverTripPage';
import DriverBundlesPage from './Trips/DriverBundlesPage';
import DriverHistoryPage from './Trips/DriverHistoryPage';
import PendingDeliveryPage from './Deliveries/PendingDeliveryPage';
import DeliveringPage from './Deliveries/DeliveringPage';
import DeliveryHistoryPage from './Deliveries/DeliveryHistoryPage';
import ShipperCodPage from './Cod/ShipperCodPage';
import RemittancesPage from './Finance/RemittancesPage';
import SettlementsPage from './Finance/SettlementsPage';
import PayoutPage from './Finance/PayoutPage';
import MySettlementsPage from './Finance/MySettlementsPage';
import ShippingRevenuePage from './Reports/ShippingRevenuePage';
import FinanceReportPage from './Finance/FinanceReportPage';
import OpsReportsPage from './Reports/OpsReportsPage';

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
  'warehouse/outbound': OutboundPage,
  'warehouse/returns': ReturnsPage,
  'warehouse/bundles': BundlesPage,
  'warehouse/trips': WarehouseTripsPage,
  'warehouse/post-office': PostOfficePage,
  'dispatcher/dispatch': DispatchPage,
  'dispatcher/tracking': TripTrackingPage,
  'dispatcher/delay-alerts': DelayAlertsPage,
  'admin/trips': TripTrackingPage,
  'driver/trip': DriverTripPage,
  'driver/packages': DriverBundlesPage,
  'driver/history': DriverHistoryPage,
  'shipper/pending-delivery': PendingDeliveryPage,
  'shipper/delivering': DeliveringPage,
  'shipper/history': DeliveryHistoryPage,
  'shipper/cod': ShipperCodPage,
  'accountant/shipper-cod': RemittancesPage,
  'accountant/seller-settlement': SettlementsPage,
  'accountant/payout': PayoutPage,
  'admin/cod': RemittancesPage,
  'seller/settlements': MySettlementsPage,
  'admin/reports': ShippingRevenuePage,
  'admin/ops-reports': OpsReportsPage,
  'accountant/reports': FinanceReportPage,
};
