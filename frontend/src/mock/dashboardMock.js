// Dữ liệu mẫu cho biểu đồ và bảng. Sau này thay bằng dữ liệu từ API.
export const WEEK_DATA = [
  { day: 'T2', done: 120, pending: 55 },
  { day: 'T3', done: 140, pending: 70 },
  { day: 'T4', done: 95, pending: 40 },
  { day: 'T5', done: 160, pending: 85 },
  { day: 'T6', done: 175, pending: 100 },
  { day: 'T7', done: 135, pending: 70 },
  { day: 'CN', done: 190, pending: 110 },
];

export const DONUT_DATA = {
  total: '1.248',
  items: [
    { label: 'Thành công', percent: 72, color: '#2563eb' },
    { label: 'Đang giao', percent: 14, color: '#0ea5e9' },
    { label: 'Chờ lấy', percent: 9, color: '#f59e0b' },
    { label: 'Thất bại', percent: 5, color: '#ef4444' },
  ],
};

export const PENDING_ORDERS = [
  { code: 'SPR25062400128', name: 'Nguyễn Minh Anh', phone: '0903 456 789', to: 'Quận 7, TP. Hồ Chí Minh', time: '08:42 hôm nay', fee: '32.000đ' },
  { code: 'SPR25062400127', name: 'Trần Hoàng Nam', phone: '0918 236 450', to: 'Cầu Giấy, Hà Nội', time: '08:35 hôm nay', fee: '28.500đ' },
  { code: 'SPR25062400126', name: 'Lê Thu Hương', phone: '0987 442 182', to: 'Hải Châu, Đà Nẵng', time: '08:21 hôm nay', fee: '41.000đ' },
  { code: 'SPR25062400125', name: 'Phạm Gia Bảo', phone: '0935 214 068', to: 'Ninh Kiều, Cần Thơ', time: '08:08 hôm nay', fee: '36.000đ' },
  { code: 'SPR25062400124', name: 'Vũ Ngọc Linh', phone: '0962 553 810', to: 'Thủ Đức, TP. Hồ Chí Minh', time: '07:56 hôm nay', fee: '24.500đ' },
];
