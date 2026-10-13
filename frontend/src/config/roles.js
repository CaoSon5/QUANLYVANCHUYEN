// Đặt vào: D:\spreeexpress\frontend\src\config\
import {
  LayoutGrid, Package, Truck, MapPin, Archive, Wallet, Settings, Clock,
  Download, Upload, TrendingUp, Plus, Calendar, Boxes, Store, BookOpen,
} from 'lucide-react';

/*
 * Nút "Tạo đơn hàng" (dashboard.action) chỉ có ở Người bán và Nhân viên kho. Vai trò khác không khai báo thì không hiện nút.
 *
 * Mỗi role gồm:
 *  - thông tin hiển thị (nhãn, màu, mô tả ở thẻ "Đang đăng nhập")
 *  - menu: slug (đường dẫn), label, icon, badge (tuỳ chọn), page (tuỳ chọn: khung trang riêng)
 *  - dashboard: nội dung trang Tổng quan (số liệu mẫu, sẽ thay bằng API)
 */
export const ROLES = {
  admin: {
    key: 'admin', short: 'QL', label: 'Quản lý', color: '#1d4ed8',
    desc: 'Quản trị toàn hệ thống',
    menu: [
      { slug: 'dashboard', label: 'Tổng quan', icon: LayoutGrid },
      { slug: 'orders', label: 'Quản lý đơn hàng', icon: Package,
        page: { title: 'Quản lý đơn hàng', subtitle: 'Tra cứu, lọc và quản lý toàn bộ vòng đời vận đơn.', stats: ['Tổng vận đơn', 'Đang giao', 'Hoàn tất hôm nay'] } },
      { slug: 'dispatch', label: 'Điều phối tài xế', icon: Truck,
        page: { title: 'Điều phối tài xế', subtitle: 'Chỉ định tài xế và kho đầu tiên tài xế cần đến nhận hàng.', action: 'Điều phối tài xế', stats: ['Chờ điều phối', 'Chuyến đang chạy', 'Tài xế sẵn sàng'] } },
      { slug: 'tracking', label: 'Theo dõi hành trình', icon: MapPin,
        page: { title: 'Theo dõi hành trình', subtitle: 'Theo dõi timeline đơn hàng và vị trí shipper theo thời gian thực.', action: 'Mở bản đồ', stats: ['Đang di chuyển', 'Sắp giao', 'Cảnh báo trễ'] } },
      { slug: 'warehouses', label: 'Kho & bưu cục', icon: Archive,
        page: { title: 'Kho & bưu cục', subtitle: 'Quản lý nhập, xuất và tồn hàng tại các bưu cục.', action: 'Quét mã vận đơn', stats: ['Đang lưu kho', 'Đã nhập hôm nay', 'Đã xuất hôm nay'] } },
      { slug: 'cod', label: 'Đối soát COD', icon: Wallet,
        page: { title: 'Đối soát COD', subtitle: 'Đối chiếu tiền thu hộ theo shipper và vận đơn.', action: 'Tạo phiên đối soát', stats: ['COD đã thu', 'Chờ nộp', 'Đã đối soát'] } },
      { slug: 'staff', label: 'Nhân sự & phương tiện', icon: Truck,
        page: { title: 'Nhân sự & phương tiện', subtitle: 'Quản lý hồ sơ, trạng thái của shipper, tài xế và phương tiện.', action: 'Thêm nhân sự', stats: ['Tổng nhân sự', 'Đang hoạt động', 'Phương tiện'] } },
      { slug: 'accounts', label: 'Tài khoản & phân quyền', icon: Settings,
        page: { title: 'Tài khoản & phân quyền', subtitle: 'Quản lý người dùng và quyền truy cập theo vai trò.', action: 'Thêm tài khoản', stats: ['Tài khoản', 'Vai trò', 'Đang hoạt động'] } },
    ],
    dashboard: {
      title: 'Tổng quan hệ thống',
      subtitle: 'Theo dõi toàn bộ hoạt động của Spree Express hôm nay.',
      stats: [
        { label: 'Tổng đơn hàng', value: '—' },
        { label: 'Shipper hoạt động', value: '—' },
        { label: 'COD đã thu', value: '—' },
        { label: 'Giao thành công', value: '—' },
      ],
      showOrdersTable: true,
    },
  },

  dispatcher: {
    key: 'dispatcher', short: 'ĐP', label: 'Điều phối viên', color: '#2563eb',
    desc: 'Điều phối và giám sát đơn hàng',
    menu: [
      { slug: 'dashboard', label: 'Tổng quan', icon: LayoutGrid },
      { slug: 'orders', label: 'Quản lý đơn hàng', icon: Package },
      { slug: 'dispatch', label: 'Điều phối tài xế', icon: Truck },
      { slug: 'tracking', label: 'Theo dõi hành trình', icon: MapPin },
      { slug: 'delay-alerts', label: 'Cảnh báo chậm nhận', icon: Clock },
    ],
    dashboard: {
      title: 'Trung tâm điều phối',
      subtitle: 'Tổng quan hoạt động nhận hàng hôm nay.',
      stats: [
        { label: 'Chờ phân công', value: '—' },
        { label: 'Chờ lấy hàng', value: '—' },
        { label: 'Đang giao hàng', value: '—' },
        { label: 'Hoàn tất hôm nay', value: '—' },
      ],
    },
  },

  warehouse: {
    key: 'warehouse', short: 'NK', label: 'Nhân viên kho', color: '#0284c7',
    desc: 'Quản lý hàng hóa tại bưu cục',
    menu: [
      { slug: 'dashboard', label: 'Tổng quan', icon: LayoutGrid },
      { slug: 'inbound', label: 'Nhập hàng vào kho', icon: Download },
      { slug: 'outbound', label: 'Xuất hàng cho shipper', icon: Truck },
      { slug: 'inventory', label: 'Kiểm tra tồn kho', icon: Package },
      { slug: 'post-office', label: 'Quản lý bưu cục', icon: Archive },
    ],
    dashboard: {
      title: 'Vận hành bưu cục',
      action: 'Tạo đơn hàng',
      subtitle: 'Theo dõi nhập, xuất và tồn kho tại bưu cục trung tâm.',
      stats: [
        { label: 'Đã nhập hôm nay', value: '—' },
        { label: 'Đã xuất hôm nay', value: '—' },
        { label: 'Kiện đang lưu', value: '—' },
        { label: 'Tồn quá 48 giờ', value: '—' },
      ],
    },
  },

  driver: {
    key: 'driver', short: 'TX', label: 'Tài xế', color: '#0d9488',
    desc: 'Vận chuyển bao hàng liên kho',
    menu: [
      { slug: 'dashboard', label: 'Tổng quan', icon: LayoutGrid },
      { slug: 'first-warehouse', label: 'Kho nhận hàng đầu tiên', icon: Archive },
      { slug: 'route', label: 'Hành trình liên kho', icon: MapPin },
      { slug: 'packages', label: 'Bao hàng trên xe', icon: Package },
      { slug: 'confirm', label: 'Xác nhận giao nhận', icon: Truck },
      { slug: 'history', label: 'Lịch sử chuyến', icon: Clock },
    ],
    dashboard: {
      title: 'Hành trình liên kho',
      subtitle: 'Theo dõi kho nhận hàng, bao hàng trên xe và điểm đến tiếp theo.',
      stats: [
        { label: 'Kho nhận đầu tiên', value: '—' },
        { label: 'Bao hàng trên xe', value: '—' },
        { label: 'Kho trong tuyến', value: '—' },
        { label: 'Tải trọng xe', value: '—' },
      ],
    },
  },

  shipper: {
    key: 'shipper', short: 'SP', label: 'Shipper', color: '#0ea5e9',
    desc: 'Nhận và giao hàng',
    menu: [
      { slug: 'dashboard', label: 'Tổng quan', icon: LayoutGrid },
      { slug: 'pending-pickup', label: 'Đơn chờ lấy', icon: Package },
      { slug: 'pending-delivery', label: 'Đơn chờ giao', icon: Truck },
      { slug: 'confirm-pickup', label: 'Xác nhận lấy hàng', icon: Download },
      { slug: 'delivering', label: 'Đang giao hàng', icon: Truck },
      { slug: 'cod', label: 'Ghi nhận COD', icon: Wallet },
      { slug: 'history', label: 'Lịch sử giao hàng', icon: Clock },
    ],
    dashboard: {
      title: 'Xin chào!', greeting: true,
      subtitle: 'Nhận đơn lấy hàng và giao hàng trong khu vực kho bạn phụ trách.',
      stats: [
        { label: 'Đơn chờ lấy', value: '—' },
        { label: 'Đơn chờ giao', value: '—' },
        { label: 'Đang giao', value: '—' },
        { label: 'COD đã thu', value: '—' },
      ],
    },
  },

  accountant: {
    key: 'accountant', short: 'KT', label: 'Kế toán', color: '#4f46e5',
    desc: 'Đối soát COD và công nợ',
    menu: [
      { slug: 'dashboard', label: 'Tổng quan', icon: LayoutGrid },
      { slug: 'shipper-cod', label: 'Đối chiếu COD shipper', icon: Wallet },
      { slug: 'seller-settlement', label: 'Đối soát người bán', icon: Calendar },
      { slug: 'payout', label: 'Xác nhận chuyển tiền', icon: Upload },
      { slug: 'reports', label: 'Báo cáo tài chính', icon: TrendingUp },
    ],
    dashboard: {
      title: 'Trung tâm đối soát',
      subtitle: 'Kiểm soát dòng tiền COD và công nợ người bán hôm nay.',
      stats: [
        { label: 'COD đã thu', value: '—' },
        { label: 'Chờ shipper nộp', value: '—' },
        { label: 'Lệnh chuyển tiền', value: '—' },
        { label: 'Đã đối soát', value: '—' },
      ],
    },
  },

  seller: {
    key: 'seller', short: 'NB', label: 'Người bán', color: '#2f7bff',
    desc: 'Tạo đơn, theo dõi và đối soát',
    menu: [
      { slug: 'dashboard', label: 'Tổng quan', icon: LayoutGrid },
      { slug: 'create-pickup', label: 'Tạo yêu cầu lấy hàng', icon: Plus },
      { slug: 'my-orders', label: 'Đơn hàng của tôi', icon: Package },
      { slug: 'tracking', label: 'Tra cứu hành trình', icon: MapPin },
      { slug: 'addresses', label: 'Sổ địa chỉ', icon: BookOpen },
    ],
    dashboard: {
      title: 'Xin chào!', greeting: true,
      subtitle: 'Tạo yêu cầu lấy hàng và theo dõi các đơn bạn đã gửi.',
      action: 'Tạo đơn hàng',
      stats: [
        { label: 'Tổng đơn hàng', value: '—' },
        { label: 'Đang vận chuyển', value: '—' },
        { label: 'Đã giao', value: '—' },
        { label: 'COD chờ nhận', value: '—' },
      ],
    },
  },
};

export const ROLE_LIST = Object.values(ROLES);
