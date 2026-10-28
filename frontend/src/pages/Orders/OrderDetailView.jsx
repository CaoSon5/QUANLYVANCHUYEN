// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Orders\
import { formatDateTime, formatVnd } from '../../utils/format';
import AuthImage from '../../components/common/AuthImage';
import { FAILURE_REASONS } from '../../config/orderStatus';
import OrderStatusPill from './OrderStatusPill';
import './orders.css';

function Info({ label, children, full }) {
  return (
    <div className={full ? 'full' : ''}>
      <small>{label}</small>
      <div>{children || '—'}</div>
    </div>
  );
}

// Hiển thị chi tiết một đơn hàng và hành trình (dùng cho người bán và shipper)
export default function OrderDetailView({ order: o }) {
  const history = [...o.history].reverse(); // mốc mới nhất lên đầu

  return (
    <>
      <div className="od-grid section">
        <div className="card">
          <div className="card-title">Người gửi</div>
          <div className="od-info">
            <Info label="Họ tên">{o.senderName}</Info>
            <Info label="Số điện thoại">{o.senderPhone}</Info>
            <Info label="Địa chỉ lấy hàng" full>{o.senderAddress}</Info>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Người nhận</div>
          <div className="od-info">
            <Info label="Họ tên">{o.receiverName}</Info>
            <Info label="Số điện thoại">{o.receiverPhone}</Info>
            <Info label="Địa chỉ giao hàng" full>
              {o.receiverAddress}, {o.receiverDistrict}, {o.receiverProvince}
            </Info>
          </div>
        </div>
      </div>

      <div className="od-grid section">
        <div className="card">
          <div className="card-title">Hàng hóa</div>
          <div className="od-info">
            <Info label="Nội dung" full>{o.itemDescription}</Info>
            <Info label="Số kiện">{o.quantity}</Info>
            <Info label="Cân nặng">{o.weightKg} kg</Info>
            <Info label="Giá trị hàng">{formatVnd(o.declaredValue)}</Info>
            <Info label="Tiền thu hộ (COD)">{formatVnd(o.codAmount)}</Info>
            <Info label="Phí vận chuyển">{formatVnd(o.shippingFee)}</Info>
            <Info label="Ghi chú">{o.note}</Info>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Lấy hàng & giao hàng</div>
          <div className="od-info">
            <Info label="Kho phụ trách" full>
              {o.pickupWarehouseCode} - {o.pickupWarehouseName}
              <div className="muted" style={{ fontWeight: 400, fontSize: 13 }}>{o.pickupWarehouseAddress}</div>
            </Info>
            <Info label="Shipper nhận đơn">{o.shipperName ? `${o.shipperName} (${o.shipperPhone})` : 'Chưa có shipper nhận'}</Info>
            <Info label="Thời gian nhận đơn">{formatDateTime(o.acceptedAt)}</Info>
            <Info label="Số kiện thực lấy">{o.pickedQuantity != null ? `${o.pickedQuantity}/${o.quantity} kiện` : null}</Info>
            <Info label="Thời gian lấy hàng">{formatDateTime(o.pickedUpAt)}</Info>
            <Info label="Đang ở kho">{o.currentWarehouseCode ? `${o.currentWarehouseCode} - ${o.currentWarehouseName}` : null}</Info>
            <Info label="Nhập kho lúc">{o.receivedAt ? formatDateTime(o.receivedAt) : null}</Info>
            <Info label="Số kiện nhận tại kho">{o.receivedQuantity != null ? `${o.receivedQuantity}/${o.pickedQuantity ?? o.quantity} kiện` : null}</Info>
            <Info label="Shipper giao hàng">{o.deliveryShipperName ? `${o.deliveryShipperName} (${o.deliveryShipperPhone})` : null}</Info>
            <Info label="Nhận giao lúc">{o.deliveryAcceptedAt ? formatDateTime(o.deliveryAcceptedAt) : null}</Info>
            <Info label="Xuất kho lúc">{o.dispatchedAt ? formatDateTime(o.dispatchedAt) : null}</Info>
            <Info label="Giao thành công lúc">{o.deliveredAt ? formatDateTime(o.deliveredAt) : null}</Info>
            <Info label="COD đã thu">{o.codCollected != null ? formatVnd(o.codCollected) : null}</Info>
            {o.deliveryAttempts > 0 && (
              <Info label="Giao thất bại" full>
                {`${o.deliveryAttempts}/${o.maxDeliveryAttempts} lần · lần gần nhất: ${FAILURE_REASONS[o.lastFailureReason] ?? 'không rõ lý do'}`}
              </Info>
            )}
            {o.pickupNote && <Info label="Ghi chú của shipper" full>{o.pickupNote}</Info>}
            {o.cancelReason && <Info label="Lý do hủy" full>{o.cancelReason}</Info>}
          </div>
        </div>
      </div>

      {o.photos?.length > 0 && (
        <div className="card section">
          <div className="card-title">Hình ảnh giao hàng</div>
          <div className="card-sub">Ảnh shipper chụp khi cập nhật kết quả giao. Bấm vào ảnh để xem lớn.</div>
          <div className="photo-grid">
            {o.photos.map((p) => (
              <figure key={p.id} className="photo-item">
                <AuthImage orderId={o.id} photoId={p.id} alt="Ảnh giao hàng" />
                <figcaption>
                  <span className={`st ${p.kind === 'delivered' ? 'st-green' : 'st-red'}`}>
                    {p.kind === 'delivered' ? 'Giao thành công' : 'Giao thất bại'}
                  </span>
                  <small>{formatDateTime(p.createdAt)}{p.uploadedByName ? ` · ${p.uploadedByName}` : ''}</small>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      <div className="card section">
        <div className="card-title">Hành trình đơn hàng</div>
        <div className="card-sub">Mốc mới nhất nằm trên cùng</div>
        <ul className="timeline">
          {history.map((h, i) => (
            <li key={`${h.createdAt}-${i}`} className={i === 0 ? 'latest' : ''}>
              <OrderStatusPill status={h.status} />
              {h.note && <div className="tl-note">{h.note}</div>}
              <div className="tl-meta">
                {formatDateTime(h.createdAt)}{h.actorName ? ` · ${h.actorName}` : ''}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

