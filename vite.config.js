import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://134.185.103.190:8082',
        changeOrigin: true,
      },
      '/timeetf': {
        target: 'https://www.timeetf.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/timeetf/, ''),
        secure: false,
        cookieDomainRewrite: '',
        headers: {
          Referer: 'https://www.timeetf.co.kr/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
    },
  },
})
