import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/myInvoice/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/domain': path.resolve(__dirname, './src/domain'),
      '@/storage': path.resolve(__dirname, './src/storage'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/pdf': path.resolve(__dirname, './src/pdf'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
  },
})
