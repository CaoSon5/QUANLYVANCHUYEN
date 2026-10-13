// "Trần Quốc Huy" -> "Quốc Huy" (lấy 2 từ cuối để chào hỏi)
export function shortName(fullName = '') {
  const parts = fullName.trim().split(/\s+/);
  return parts.slice(-2).join(' ');
}
