// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\utils\
// Xuất file Excel (.xlsx) ngay trên trình duyệt bằng thư viện exceljs (cài: npm install exceljs).
// Thư viện chỉ được tải khi bấm nút xuất nên không làm chậm trang.

// Định dạng tiền: 1.250.000đ (Excel hiểu là số nên vẫn cộng trừ được), số âm màu đỏ
export const MONEY_FORMAT = '#,##0"đ";[Red]-#,##0"đ"';

// build(workbook): hàm do trang truyền vào để tạo các sheet
export async function downloadExcel(filename, build) {
  const mod = await import('exceljs');
  const ExcelJS = mod.default ?? mod;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Spree Express';
  workbook.created = new Date();
  build(workbook);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
