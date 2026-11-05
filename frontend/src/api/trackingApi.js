// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\api\
import axios from 'axios';

// Client riêng cho trang công khai: không gắn token đăng nhập và không tự chuyển về trang đăng nhập khi gặp lỗi
const publicClient = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Khách nhận hàng tra cứu hành trình (FR69)
export const trackingApi = {
  byCode: (code) => publicClient.get(`/api/public/tracking/${encodeURIComponent(code)}`).then((r) => r.data),
  byPhone: (phone) => publicClient.get('/api/public/tracking', { params: { phone } }).then((r) => r.data),
};
