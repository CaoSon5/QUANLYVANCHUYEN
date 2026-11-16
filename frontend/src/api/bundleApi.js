// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\api\
import axiosClient from './axiosClient';

const get = (url, params) => axiosClient.get(url, { params }).then((r) => r.data);

// Bao hàng: gộp nhiều đơn cùng đi một kho đích (FR33, FR34, FR40)
export const bundleApi = {
  list: (params) => get('/api/bundles', params),
  get: (id) => get(`/api/bundles/${id}`),
  // Các kho có thể chọn làm kho đích (kèm mã kho)
  destinations: (search) => get('/api/bundles/destinations', { search }),
  create: (body) => axiosClient.post('/api/bundles', body).then((r) => r.data),
  addOrder: (id, code) => axiosClient.post(`/api/bundles/${id}/orders`, { code }).then((r) => r.data),
  removeOrder: (id, orderId) => axiosClient.delete(`/api/bundles/${id}/orders/${orderId}`).then((r) => r.data),
  seal: (id) => axiosClient.post(`/api/bundles/${id}/seal`).then((r) => r.data),
  reopen: (id) => axiosClient.post(`/api/bundles/${id}/reopen`).then((r) => r.data),
  cancel: (id) => axiosClient.post(`/api/bundles/${id}/cancel`).then((r) => r.data),
  // Kho đích mở bao đã nhận (FR39)
  open: (id) => axiosClient.post(`/api/bundles/${id}/open`).then((r) => r.data),
};
