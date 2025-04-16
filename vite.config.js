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
    // Ensure assets are referenced with correct paths
    assetsDir: 'assets',
    assetsInlineLimit: 4096,
    // Create necessary HTML files for SPA routing
    copyPublicDir: true,
    // Preserve error stack information even in production
    sourcemap: true,
    minify: {
      keepNames: true
    }
  },
  // Use relative paths for Render deployment with HashRouter
  base: '',
  // Configure preview server
  preview: {
    port: 3000,
    host: true
  }
})
