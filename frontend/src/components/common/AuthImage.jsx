// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\components\common\
import { useEffect, useState } from 'react';
import { orderApi } from '../../api/orderApi';

// Hiển thị ảnh cần đăng nhập: tải bằng token rồi tạo địa chỉ tạm để hiện (thẻ <img> thường không gửi được token).
export default function AuthImage({ orderId, photoId, alt = '' }) {
  const [src, setSrc] = useState(null);   // null: đang tải, '': lỗi

  useEffect(() => {
    let url = null;
    let cancelled = false;

    orderApi
      .photoBlob(orderId, photoId)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => !cancelled && setSrc(''));

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [orderId, photoId]);

  if (src === null) return <div className="photo-loading">Đang tải ảnh...</div>;
  if (src === '') return <div className="photo-loading">Không tải được ảnh</div>;

  return (
    <a href={src} target="_blank" rel="noreferrer" title="Mở ảnh lớn">
      <img src={src} alt={alt} />
    </a>
  );
}
