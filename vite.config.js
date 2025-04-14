import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_SERVER_URL || 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  // Add build configuration for SPA routing
  build: {
    outDir: 'dist',
    // Make sure to generate a single JS bundle for simpler deployment
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  // Add base URL configuration
  base: '/',
  // Configure preview server
  preview: {
    port: 3000,
    host: true
  }
})
