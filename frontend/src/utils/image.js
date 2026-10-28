// Đặt vào: D:\spreeexpress_supabase\spreeexpress\frontend\src\utils\
// Thu nhỏ và nén ảnh ngay trên trình duyệt trước khi gửi: ảnh chụp điện thoại thường vài MB, nén còn khoảng 100-300 KB.
const MAX_SIDE = 1280;          // cạnh dài tối đa (px)
const MAX_BYTES = 1_400_000;    // phải nhỏ hơn giới hạn 1,5 MB của máy chủ
const QUALITIES = [0.72, 0.6, 0.5, 0.4];

async function loadImage(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // trình duyệt không đọc được bằng cách này, thử cách bên dưới
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function resizeImage(file) {
  const source = await loadImage(file);
  const width = source.naturalWidth ?? source.width;
  const height = source.naturalHeight ?? source.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  if (source.close) source.close();

  for (const quality of QUALITIES) {
    // eslint-disable-next-line no-await-in-loop
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size <= MAX_BYTES) {
      return new File([blob], `anh-${Date.now()}.jpg`, { type: 'image/jpeg' });
    }
  }
  throw new Error('Ảnh quá lớn');
}
