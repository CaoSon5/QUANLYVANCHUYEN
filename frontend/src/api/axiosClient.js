import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Gắn token đăng nhập vào mọi request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token hết hạn, tài khoản bị khóa hoặc đổi vai trò -> về trang đăng nhập.
// (Bỏ qua các API đăng nhập/đăng ký/thiết lập vì 401 ở đó là sai thông tin, không phải hết phiên)
axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url ?? '';
    const isPublicCall =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/register') ||
      url.includes('/api/setup');

    if (error.response?.status === 401 && !isPublicCall) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
