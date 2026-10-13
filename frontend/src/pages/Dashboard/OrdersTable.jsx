// Đặt vào: D:\spreeexpress\frontend\src\pages\Dashboard\
import { Search, Download } from 'lucide-react';

// Bảng "Nghiệp vụ cần xử lý": hiện chỉ có khung, chưa có dữ liệu.
// Khi làm phần điều phối, nối API và đổ danh sách đơn vào <tbody>.
export default function OrdersTable() {
  const rows = [];

  return (
    <div className="card table-card">
      <div className="chart-head">
        <div>
          <div className="card-title">Nghiệp vụ cần xử lý <span className="count-pill">{rows.length} mục</span></div>
          <div className="card-sub">Ưu tiên đơn tạo sớm và sắp quá thời gian xử lý</div>
        </div>
        <div className="table-tools">
          <div className="mini-search"><Search size={16} /><input placeholder="Tìm mã đơn, người nhận..." /></div>
          <select className="mini-select"><option>Tất cả</option></select>
          <button className="btn"><Download size={16} /> Xuất file</button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>MÃ VẬN ĐƠN</th><th>NGƯỜI NHẬN</th><th>ĐIỂM ĐẾN</th>
              <th>THỜI GIAN TẠO</th><th>PHÍ VẬN CHUYỂN</th><th>TRẠNG THÁI</th><th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="table-empty">Chưa có đơn hàng nào cần xử lý.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-foot">
        <span>Hiển thị <b>0</b> trong 0 đơn</span>
      </div>
    </div>
  );
}
