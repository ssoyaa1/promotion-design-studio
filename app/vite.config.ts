import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev proxy for Google Sheets CSV (CORS fallback).
// Frontend calls `/gsheet?url=<encoded gviz csv url>` and Vite forwards it,
// stripping the browser CORS constraint during development.
export default defineConfig({
  plugins: [react()],
  server: {
    // Fixed port so the OAuth "Authorized JavaScript origin" stays stable.
    port: 5173,
    strictPort: true,
    proxy: {
      '/gsheet': {
        target: 'https://docs.google.com',
        changeOrigin: true,
        secure: true,
        // Rewrite `/gsheet?url=<full-url>` -> the real gviz path on docs.google.com.
        rewrite: (path) => {
          const q = path.indexOf('?')
          const search = q >= 0 ? path.slice(q + 1) : ''
          const params = new URLSearchParams(search)
          const target = params.get('url')
          if (!target) return path
          try {
            const u = new URL(target)
            return u.pathname + u.search
          } catch {
            return path
          }
        },
      },
    },
  },
})
