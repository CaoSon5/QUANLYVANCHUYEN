// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\pages\Deliveries\
import { useEffect, useMemo, useRef, useState } from 'react';
import { resizeImage } from '../../utils/image';
import '../Orders/orders.css';

// Chọn hoặc chụp tối đa `max` ảnh (không bắt buộc). Ảnh được thu nhỏ trước khi gửi.
export default function PhotoPicker({ files, onChange, max = 3 }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const pick = async (e) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ''; // cho phép chọn lại cùng một ảnh
    if (picked.length === 0) return;

    setError('');
    setBusy(true);
    try {
      const resized = [];
      for (const file of picked.slice(0, max - files.length)) {
        // eslint-disable-next-line no-await-in-loop
        resized.push(await resizeImage(file));
      }
      onChange([...files, ...resized]);
    } catch {
      setError('Không đọc được ảnh này, hãy thử ảnh khác.');
    } finally {
      setBusy(false);
    }
  };

  const remove = (index) => onChange(files.filter((_, i) => i !== index));

  return (
    <div>
      <div className="pk-row">
        {previews.map((url, i) => (
          <div className="pk-thumb" key={url}>
            <img src={url} alt={`Ảnh ${i + 1}`} />
            <button type="button" aria-label="Xóa ảnh" onClick={() => remove(i)}>×</button>
          </div>
        ))}
        {files.length < max && (
          <button type="button" className="pk-add" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? 'Đang xử lý...' : '+ Thêm ảnh'}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={pick} />
      <div className="form-hint">Không bắt buộc. Tối đa {max} ảnh, tự động thu nhỏ trước khi gửi. Trên điện thoại có thể chụp trực tiếp.</div>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
