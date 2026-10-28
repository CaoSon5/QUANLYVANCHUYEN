// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\api\
import axiosClient from './axiosClient';

export const orderApi = {
  // Người bán
  pickupWarehouses: () => axiosClient.get('/api/orders/pickup-warehouses').then((r) => r.data),
  fee: (weightKg) => axiosClient.get('/api/orders/fee', { params: { weightKg } }).then((r) => r.data),
  create: (data) => axiosClient.post('/api/orders', data).then((r) => r.data),
  update: (id, data) => axiosClient.put(`/api/orders/${id}`, data).then((r) => r.data),
  cancel: (id, reason) => axiosClient.post(`/api/orders/${id}/cancel`, { reason }).then((r) => r.data),
  listMine: (params) => axiosClient.get('/api/orders/mine', { params }).then((r) => r.data),
  byCode: (code) => axiosClient.get(`/api/orders/by-code/${encodeURIComponent(code)}`).then((r) => r.data),

  // Admin, Điều phối viên: xem mọi đơn
  listAll: (params) => axiosClient.get('/api/orders', { params }).then((r) => r.data),

  // Ảnh minh chứng: cần gửi kèm token nên tải về dạng blob rồi mới hiển thị
  photoBlob: (orderId, photoId) =>
    axiosClient.get(`/api/orders/${orderId}/photos/${photoId}`, { responseType: 'blob' }).then((r) => r.data),

  // Dùng chung
  get: (id) => axiosClient.get(`/api/orders/${id}`).then((r) => r.data),
  summary: () => axiosClient.get('/api/orders/summary').then((r) => r.data),
};

export const pickupApi = {
  available: (params) => axiosClient.get('/api/pickups/available', { params }).then((r) => r.data),
  mine: (params) => axiosClient.get('/api/pickups/mine', { params }).then((r) => r.data),
  accept: (id) => axiosClient.post(`/api/pickups/${id}/accept`).then((r) => r.data),
  confirm: (id, data) => axiosClient.post(`/api/pickups/${id}/confirm`, data).then((r) => r.data),
};

// Nhân viên kho: nhập hàng vào kho và xem hàng của kho mình
export const warehouseOrderApi = {
  // scope: 'incoming' (đang trên đường về kho) | 'inventory' (đang lưu kho)
  list: (scope, params) =>
    axiosClient.get('/api/warehouse-orders', { params: { scope, ...params } }).then((r) => r.data),
  receive: (data) => axiosClient.post('/api/warehouse-orders/receive', data).then((r) => r.data),
  // Xuất hàng cho shipper đã nhận giao
  dispatch: (data) => axiosClient.post('/api/warehouse-orders/dispatch', data).then((r) => r.data),
};

// Shipper: nhận giao hàng tại kho mình phụ trách
export const deliveryApi = {
  available: (params) => axiosClient.get('/api/deliveries/available', { params }).then((r) => r.data),
  // status: 'accepted' (đã nhận, chờ lấy ở kho) | 'out_for_delivery' (đang đi giao)
  mine: (params) => axiosClient.get('/api/deliveries/mine', { params }).then((r) => r.data),
  accept: (id) => axiosClient.post(`/api/deliveries/${id}/accept`).then((r) => r.data),
  // Kết quả giao: gửi FormData (có thể kèm ảnh)
  deliver: (id, formData) => axiosClient.post(`/api/deliveries/${id}/delivered`, formData).then((r) => r.data),
  fail: (id, formData) => axiosClient.post(`/api/deliveries/${id}/failed`, formData).then((r) => r.data),
};
