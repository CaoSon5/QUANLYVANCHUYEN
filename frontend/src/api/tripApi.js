// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\api\
import axiosClient from './axiosClient';

const get = (url, params) => axiosClient.get(url, { params }).then((r) => r.data);
const post = (url, body) => axiosClient.post(url, body).then((r) => r.data);

// Chuyến vận chuyển liên kho (FR20 đến FR27, FR30, FR35 đến FR48)
export const tripApi = {
  // Điều phối viên, Admin
  drivers: () => get('/api/trips/drivers'),
  warehouses: (search) => get('/api/trips/warehouses', { search }),
  create: (body) => post('/api/trips', body),
  reassign: (id, body) => post(`/api/trips/${id}/reassign`, body),
  cancel: (id) => post(`/api/trips/${id}/cancel`),
  stale: () => get('/api/trips/stale'),

  // Xem chuyến. status: assigned | at_warehouse | in_transit | completed | cancelled | active
  list: (params) => get('/api/trips', params),
  get: (id) => get(`/api/trips/${id}`),

  // Tài xế. current() trả về null khi đang rảnh (máy chủ trả 204)
  current: () => axiosClient.get('/api/trips/current').then((r) => r.data || null),
  arrive: (id) => post(`/api/trips/${id}/arrive`),
  depart: (id) => post(`/api/trips/${id}/depart`),
  complete: (id) => post(`/api/trips/${id}/complete`),

  // Nhân viên kho
  forWarehouse: () => get('/api/trips/warehouse'),
  load: (id, code) => post(`/api/trips/${id}/load`, { code }),
  unload: (id, bundleId) => axiosClient.delete(`/api/trips/${id}/bundles/${bundleId}`).then((r) => r.data),
  receive: (id, code) => post(`/api/trips/${id}/receive`, { code }),
  finishReceiving: (id, note) => post(`/api/trips/${id}/finish-receiving`, { note: note || null }),
  reportExtra: (id, code, note) => post(`/api/trips/${id}/extra`, { code, note: note || null }),
};
