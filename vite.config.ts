import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: [
      'lionfish-app-7u4bq.ondigitalocean.app',
      'admin.penniwyse.com',
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
