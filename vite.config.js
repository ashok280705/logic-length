import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

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
    // Generate a single JS bundle for simpler deployment
    rollupOptions: {
      output: {
        manualChunks: undefined
      },
      // Ensure proper handling of routes
      input: {
        main: resolve(__dirname, 'index.html')
      }
    },
    // Ensure assets are referenced with relative paths
    assetsDir: 'assets',
    assetsInlineLimit: 4096,
    // Create 200.html file for SPA routing to support direct URL access
    copyPublicDir: true
  },
  // Use relative paths for assets to support subdirectory deployments
  base: './',
  // Configure preview server
  preview: {
    port: 3000,
    host: true
  }
})
