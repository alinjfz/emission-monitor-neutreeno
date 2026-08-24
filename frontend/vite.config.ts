/** Frontend build configuration and same-origin-looking development API proxy. */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Components always call /api; only the dev server needs to know the backend host.
      '/api': process.env.VITE_API_PROXY ?? 'http://127.0.0.1:8000',
    },
  },
})
