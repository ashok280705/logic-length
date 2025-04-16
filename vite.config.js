import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { writeFileSync } from 'fs'

// Log environment for debugging
console.log('Vite environment:', process.env.NODE_ENV);
console.log('Building for production:', process.env.NODE_ENV === 'production');

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to create _redirects file for Netlify or Vercel
    {
      name: 'create-deployment-files',
      closeBundle: () => {
        console.log('Creating deployment files...');
        
        // Create Netlify _redirects file for SPA routing
        try {
          writeFileSync('dist/_redirects', '/* /index.html 200');
          console.log('Created Netlify _redirects file');
        } catch (error) {
          console.error('Error creating _redirects file:', error);
        }
        
        // Create Vercel config
        try {
          const vercelConfig = {
            "rewrites": [
              { "source": "/(.*)", "destination": "/index.html" }
            ]
          };
          writeFileSync('dist/vercel.json', JSON.stringify(vercelConfig, null, 2));
          console.log('Created Vercel config file');
        } catch (error) {
          console.error('Error creating vercel.json:', error);
        }
      }
    }
  ],
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
