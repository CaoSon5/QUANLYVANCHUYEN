// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\config\
// Trạng thái vận đơn: khóa trùng với backend (snake_case), tone là tên lớp màu trong orders.css
export const ORDER_STATUS = {
  pending_pickup: { label: 'Chờ lấy hàng', tone: 'amber' },
  pickup_accepted: { label: 'Shipper đã nhận', tone: 'blue' },
  picked_up: { label: 'Đã lấy hàng', tone: 'sky' },
  in_warehouse: { label: 'Đã nhập kho', tone: 'purple' },
  delivery_accepted: { label: 'Shipper nhận giao', tone: 'blue' },
  in_transit: { label: 'Đang vận chuyển', tone: 'sky' },
  out_for_delivery: { label: 'Đang giao', tone: 'blue' },
  delivered: { label: 'Giao thành công', tone: 'green' },
  delivery_failed: { label: 'Giao thất bại', tone: 'red' },
  returning: { label: 'Chờ hoàn hàng', tone: 'amber' },
  returned: { label: 'Đã hoàn hàng', tone: 'gray' },
  cancelled: { label: 'Đã hủy', tone: 'gray' },
};

// Lý do giao thất bại: khóa trùng với backend (FR54)
export const FAILURE_REASONS = {
  no_contact: 'Không liên lạc được với người nhận',
  refused: 'Khách từ chối nhận hàng',
  wrong_address: 'Sai địa chỉ giao hàng',
};
