// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\api\
import axiosClient from './axiosClient';

const get = (url, params) => axiosClient.get(url, { params }).then((r) => r.data);
const post = (url, body) => axiosClient.post(url, body).then((r) => r.data);

// Shipper: COD đang giữ và nộp tiền (FR57)
export const codApi = {
  holding: () => get('/api/cod/holding'),
  createRemittance: (orderIds) => post('/api/cod/remittances', { orderIds }),
  remittances: (params) => get('/api/cod/remittances', params),
};

// Kế toán (Admin chỉ xem): đối chiếu COD, đối soát người bán, chuyển tiền (FR59 đến FR61)
export const financeApi = {
  summary: () => get('/api/finance/summary'),
  holdings: () => get('/api/finance/holdings'),
  remittances: (params) => get('/api/finance/remittances', params),
  remittance: (id) => get(`/api/finance/remittances/${id}`),
  confirmRemittance: (id, body) => post(`/api/finance/remittances/${id}/confirm`, body),
  sellers: (search) => get('/api/finance/sellers', { search }),
  previewSettlement: (body) => post('/api/finance/settlements/preview', body),
  createSettlement: (body) => post('/api/finance/settlements', body),
  settlements: (params) => get('/api/finance/settlements', params),
  settlement: (id) => get(`/api/finance/settlements/${id}`),
  paySettlement: (id, body) => post(`/api/finance/settlements/${id}/pay`, body),
};

// Người bán xem bảng đối soát của mình (FR67)
export const mySettlementApi = {
  list: (params) => get('/api/my-settlements', params),
  get: (id) => get(`/api/my-settlements/${id}`),
};
