import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development the browser talks to Vite (port 5173) and Vite forwards /api to Flask.
    // This keeps everything same-origin, exactly like production, so no CORS is needed.
    proxy: { '/api': 'http://127.0.0.1:5000' },
  },
})
