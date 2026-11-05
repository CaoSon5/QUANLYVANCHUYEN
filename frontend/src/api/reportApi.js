// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\api\
import axiosClient from './axiosClient';

// Báo cáo quản lý (Admin, Kế toán)
export const reportApi = {
  // params: { granularity: 'day' | 'month' | 'year', from: 'yyyy-MM-dd', to: 'yyyy-MM-dd' }
  shippingRevenue: (params) => axiosClient.get('/api/reports/shipping-revenue', { params }).then((r) => r.data),

  // Báo cáo vận hành. params: { from: 'yyyy-MM-dd', to: 'yyyy-MM-dd' } (bỏ trống = 30 ngày gần nhất)
  orders: (params) => axiosClient.get('/api/reports/orders', { params }).then((r) => r.data),       // FR13, FR15
  shippers: (params) => axiosClient.get('/api/reports/shippers', { params }).then((r) => r.data),   // FR16
  inventory: () => axiosClient.get('/api/reports/inventory').then((r) => r.data),                   // FR17
  cod: (params) => axiosClient.get('/api/reports/cod', { params }).then((r) => r.data),             // FR18
};
