import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../server/static',  // Output built files into Django static folder
    emptyOutDir: true,
  },
  server: {
    host: '::', // Enables listening on IPv6
    port: 5173,
    allowedHosts: ['eagleeye.ooguy.com'],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000", // Django backend
        changeOrigin: true,
        secure: false,
      },
    },
  }
})
