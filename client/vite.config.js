import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // /api 로 시작하는 요청은 Express 서버(5000)로 전달
    // Windows 에서 localhost 가 IPv6(::1)로 잡히는 문제를 피하려고 127.0.0.1 사용
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
})
