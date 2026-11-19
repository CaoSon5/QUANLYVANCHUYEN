// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Finance\
// Dựng file Excel của Báo cáo tài chính: 2 sheet "Tổng quan" và "Chi tiết theo kỳ"
import { MONEY_FORMAT } from '../../utils/excel';

const GRANULARITY_LABEL = { day: 'theo ngày', month: 'theo tháng', year: 'theo năm' };
const COLUMN_TITLE = { day: 'Ngày', month: 'Tháng', year: 'Năm' };

const BLUE = 'FF1D4ED8';
const GREY = 'FFE2E8F0';

// "2026-10-31" -> "31/10/2026"
const fmtDate = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const styleHeader = (row) => {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
};

export function buildFinanceWorkbook(workbook, data, exportedBy) {
  // ---------- Sheet 1: Tổng quan ----------
  const ws = workbook.addWorksheet('Tổng quan');
  ws.columns = [{ width: 46 }, { width: 24 }];

  ws.mergeCells('A1:B1');
  ws.getCell('A1').value = 'BÁO CÁO TÀI CHÍNH';
  ws.getCell('A1').font = { bold: true, size: 16 };

  ws.mergeCells('A2:B2');
  ws.getCell('A2').value = `Kỳ báo cáo: ${fmtDate(data.from)} đến ${fmtDate(data.to)} (${GRANULARITY_LABEL[data.granularity] ?? ''})`;
  ws.mergeCells('A3:B3');
  ws.getCell('A3').value = `Ngày xuất: ${new Date().toLocaleString('vi-VN')}${exportedBy ? ` · Người xuất: ${exportedBy}` : ''}`;
  ws.getCell('A3').font = { color: { argb: 'FF64748B' } };

  let r = 5;
  const section = (title, items) => {
    ws.getCell(`A${r}`).value = title;
    ws.getCell(`B${r}`).value = 'Số tiền';
    styleHeader(ws.getRow(r));
    ws.getCell(`A${r}`).alignment = { vertical: 'middle', horizontal: 'left' };
    r += 1;
    items.forEach(([label, value]) => {
      ws.getCell(`A${r}`).value = label;
      const cell = ws.getCell(`B${r}`);
      cell.value = value;
      cell.numFmt = MONEY_FORMAT;
      ws.getRow(r).eachCell((c) => { c.border = { bottom: { style: 'thin', color: { argb: GREY } } }; });
      r += 1;
    });
    r += 1;
  };

  section('CHỈ SỐ TRONG KỲ', [
    ['Tổng COD shipper đã thu', data.codCollected],
    ['Đã về công ty (phiếu nộp đã xác nhận)', data.codRemitted],
    ['Đã đối soát với người bán', data.codSettled],
    ['Đã chuyển cho người bán', data.paidOut],
    ['Doanh thu phí vận chuyển', data.shippingFee],
    ['Chênh lệch khi nộp tiền (âm = thiếu)', data.difference],
  ]);

  section('CÔNG NỢ HIỆN TẠI (tính đến lúc xuất file)', [
    ['Shipper đang giữ, chưa nộp', data.shipperHolding],
    ['Phiếu nộp chờ xác nhận', data.remittancesPendingAmount],
    ['COD đã về công ty, chưa lập đối soát', data.receivedNotSettled],
    ['Bảng đối soát chờ chuyển tiền', data.payoutPending],
    ['Tổng chênh lệch mọi phiếu đã xác nhận', data.differenceTotal],
  ]);

  ws.getCell(`A${r}`).value = 'Lưu ý: mỗi khoản tính theo ngày phát sinh của chính nó (COD theo ngày giao, về công ty theo ngày xác nhận phiếu, đối soát theo ngày lập, trả người bán theo ngày chuyển tiền).';
  ws.getCell(`A${r}`).font = { italic: true, color: { argb: 'FF64748B' } };
  ws.mergeCells(`A${r}:B${r}`);
  ws.getCell(`A${r}`).alignment = { wrapText: true, vertical: 'top' };
  ws.getRow(r).height = 48;

  // ---------- Sheet 2: Chi tiết theo kỳ ----------
  const detail = workbook.addWorksheet('Chi tiết theo kỳ');
  detail.columns = [
    { header: COLUMN_TITLE[data.granularity] ?? 'Kỳ', key: 'label', width: 14 },
    { header: 'COD đã thu', key: 'collected', width: 18 },
    { header: 'Đã về công ty', key: 'remitted', width: 18 },
    { header: 'Đã đối soát', key: 'settled', width: 18 },
    { header: 'Đã trả người bán', key: 'paid', width: 18 },
    { header: 'Phí vận chuyển', key: 'fee', width: 18 },
    { header: 'Chênh lệch nộp tiền', key: 'diff', width: 20 },
  ];
  styleHeader(detail.getRow(1));

  data.buckets.forEach((b) => {
    detail.addRow({
      label: b.label,
      collected: b.codCollected,
      remitted: b.codRemitted,
      settled: b.codSettled,
      paid: b.paidOut,
      fee: b.shippingFee,
      diff: b.difference,
    });
  });

  const total = detail.addRow({
    label: 'Tổng cộng',
    collected: data.codCollected,
    remitted: data.codRemitted,
    settled: data.codSettled,
    paid: data.paidOut,
    fee: data.shippingFee,
    diff: data.difference,
  });
  total.font = { bold: true };
  total.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } }; });

  ['B', 'C', 'D', 'E', 'F', 'G'].forEach((col) => { detail.getColumn(col).numFmt = MONEY_FORMAT; });
  detail.getColumn('A').alignment = { horizontal: 'left' };
  detail.views = [{ state: 'frozen', ySplit: 1 }];
}
