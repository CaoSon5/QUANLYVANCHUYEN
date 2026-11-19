// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\config\
// Tài khoản nhận tiền COD của công ty (hiện là dữ liệu MẪU để test).
// Khi chạy thật: điền số tài khoản thật và đổi testMode thành false.
export const BANK = {
  // true: hiện nút "Tôi đã chuyển khoản (giả lập)" để demo luồng mà không cần chuyển tiền thật
  testMode: true,

  bankId: 'MB',                          // mã ngân hàng theo VietQR: MB, VCB, TCB, ACB, BIDV, VPB...
  bankName: 'MB Bank',
  accountNo: '0123456789',               // số tài khoản mẫu
  accountName: 'CONG TY SPREE EXPRESS',  // viết hoa, không dấu
};

// Đường dẫn ảnh QR VietQR đã điền sẵn số tiền và nội dung chuyển khoản
export function vietQrUrl({ amount, content }) {
  const params = new URLSearchParams({
    amount: String(Math.round(Number(amount) || 0)),
    addInfo: content,
    accountName: BANK.accountName,
  });
  return `https://img.vietqr.io/image/${BANK.bankId}-${BANK.accountNo}-compact2.png?${params.toString()}`;
}
