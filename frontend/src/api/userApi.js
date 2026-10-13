import axiosClient from './axiosClient';

export const userApi = {
  list: (params) => axiosClient.get('/api/users', { params }).then((r) => r.data),
  summary: () => axiosClient.get('/api/users/summary').then((r) => r.data),
  create: (data) => axiosClient.post('/api/users', data).then((r) => r.data),
  update: (id, data) => axiosClient.put(`/api/users/${id}`, data).then((r) => r.data),
  setStatus: (id, isActive) =>
    axiosClient.patch(`/api/users/${id}/status`, { isActive }).then((r) => r.data),
  resetPassword: (id, newPassword) =>
    axiosClient.post(`/api/users/${id}/reset-password`, { newPassword }),
};
