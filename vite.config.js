// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 將所有 /api 開頭的請求代理到 Vercel 的本地開發伺服器
      '/api': {
        target: 'http://localhost:3000', // 您的 vercel dev 運行的 URL
        changeOrigin: true, // 需要更改來源，否則可能會被 CORS 阻擋
        // 不需要 rewrite，因為前端路徑和後端路徑是匹配的
      },
    }
  }
})