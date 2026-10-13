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
