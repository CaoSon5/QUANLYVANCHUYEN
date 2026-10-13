// Trạng thái vận đơn: khóa trùng với backend (snake_case), tone là tên lớp màu trong orders.css
export const ORDER_STATUS = {
  pending_pickup: { label: 'Chờ lấy hàng', tone: 'amber' },
  pickup_accepted: { label: 'Shipper đã nhận', tone: 'blue' },
  picked_up: { label: 'Đã lấy hàng', tone: 'sky' },
  in_warehouse: { label: 'Đã nhập kho', tone: 'purple' },
  in_transit: { label: 'Đang vận chuyển', tone: 'sky' },
  out_for_delivery: { label: 'Đang giao', tone: 'blue' },
  delivered: { label: 'Giao thành công', tone: 'green' },
  delivery_failed: { label: 'Giao thất bại', tone: 'red' },
  returned: { label: 'Đã hoàn hàng', tone: 'gray' },
  cancelled: { label: 'Đã hủy', tone: 'gray' },
};
