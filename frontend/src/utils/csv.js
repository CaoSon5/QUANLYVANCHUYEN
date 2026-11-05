// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\utils\
// Tải về file CSV từ bảng số liệu. Có BOM để Excel đọc đúng tiếng Việt.
const cell = (v) => {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadCsv(filename, rows) {
  const csv = `\uFEFF${rows.map((r) => r.map(cell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
