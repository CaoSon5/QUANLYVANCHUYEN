import axiosClient from './axiosClient';

export const warehouseApi = {
  list: (params) => axiosClient.get('/api/warehouses', { params }).then((r) => r.data),
  summary: () => axiosClient.get('/api/warehouses/summary').then((r) => r.data),
  options: () => axiosClient.get('/api/warehouses/options').then((r) => r.data),
  get: (id) => axiosClient.get(`/api/warehouses/${id}`).then((r) => r.data),
  create: (data) => axiosClient.post('/api/warehouses', data).then((r) => r.data),
  update: (id, data) => axiosClient.put(`/api/warehouses/${id}`, data).then((r) => r.data),
  setStatus: (id, isActive) =>
    axiosClient.patch(`/api/warehouses/${id}/status`, { isActive }).then((r) => r.data),
  assignMember: (id, userId) =>
    axiosClient.post(`/api/warehouses/${id}/members`, { userId }).then((r) => r.data),
  removeMember: (id, userId) =>
    axiosClient.delete(`/api/warehouses/${id}/members/${userId}`).then((r) => r.data),
};
