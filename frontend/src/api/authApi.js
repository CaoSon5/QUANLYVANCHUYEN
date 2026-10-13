import axiosClient from './axiosClient';

export const authApi = {
  login: (data) => axiosClient.post('/api/auth/login', data).then((r) => r.data),
  register: (data) => axiosClient.post('/api/auth/register', data).then((r) => r.data),
  changePassword: (data) =>
    axiosClient.post('/api/auth/change-password', data).then((r) => r.data),
  me: () => axiosClient.get('/api/auth/me').then((r) => r.data),

  // Thiết lập lần đầu (tạo admin đầu tiên)
  setupStatus: () => axiosClient.get('/api/setup/status').then((r) => r.data),
  setupAdmin: (data) => axiosClient.post('/api/setup/admin', data).then((r) => r.data),
};

// Lấy thông báo lỗi từ backend ({ message }) hoặc báo lỗi kết nối
export function getErrorMessage(err) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.request) return 'Không kết nối được máy chủ. Hãy kiểm tra backend đã chạy chưa.';
  return 'Đã có lỗi xảy ra, vui lòng thử lại.';
}
