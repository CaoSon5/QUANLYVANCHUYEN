
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
import PendingDeliveryPage from './Deliveries/PendingDeliveryPage';
import DeliveringPage from './Deliveries/DeliveringPage';
import ShipperCodPage from './Cod/ShipperCodPage';
import RemittancesPage from './Finance/RemittancesPage';
import SettlementsPage from './Finance/SettlementsPage';
import PayoutPage from './Finance/PayoutPage';
import MySettlementsPage from './Finance/MySettlementsPage';
import ShippingRevenuePage from './Reports/ShippingRevenuePage';
import OpsReportsPage from './Reports/OpsReportsPage';


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
  'shipper/pending-delivery': PendingDeliveryPage,
  'shipper/delivering': DeliveringPage,
  'shipper/cod': ShipperCodPage,
  'accountant/shipper-cod': RemittancesPage,
  'accountant/seller-settlement': SettlementsPage,
  'accountant/payout': PayoutPage,
  'admin/cod': RemittancesPage,
  'seller/settlements': MySettlementsPage,
  'admin/reports': ShippingRevenuePage,
  'admin/ops-reports': OpsReportsPage,
  'accountant/reports': ShippingRevenuePage,
};
