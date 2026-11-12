import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  server: {
    host: true,
    // Allow tunnel hostnames (loca.lt, trycloudflare.com, ngrok, etc.) without editing per URL.
    allowedHosts: true,
  },
})
