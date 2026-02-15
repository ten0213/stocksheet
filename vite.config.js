import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://13.125.139.31:8088',
        changeOrigin: true,
      },
      '/timeetf': {
        target: 'https://timeetf.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/timeetf/, ''),
        secure: false,
        cookieDomainRewrite: '',
      },
    },
  },
})
