import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // strictPort: nếu cổng 5173 đang bị chương trình khác chiếm thì báo lỗi ngay, không âm thầm đổi sang cổng khác
  server: { port: 5173, strictPort: true, open: true },
});
