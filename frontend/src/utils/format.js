// 32000 -> "32.000đ"
export function formatVnd(value) {
  const n = Number(value) || 0;
  return `${n.toLocaleString('vi-VN')}đ`;
}

// 18600000 -> "18,6 tr"; số nhỏ hơn 1 triệu thì hiện đầy đủ
export function formatShortMoney(value) {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`;
  return formatVnd(n);
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
  });
}
