import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://logic-length.onrender.com'
          : 'http://localhost:5002',
        changeOrigin: true,
        secure: true,
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
    },
    // Ensure assets are referenced with relative paths
    assetsDir: 'assets',
    assetsInlineLimit: 4096,
    // Create 200.html file for SPA routing
    copyPublicDir: true
  },
  // Use relative paths for assets
  base: './',
  // Configure preview server
  preview: {
    port: 3000,
    host: true
  }
})
