import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Kamai Kaksha (The Earning Classroom)',
        short_name: 'Kamai Kaksha',
        description: 'Voice-first offline PWA turning village skills into livelihoods, savings, and credit history.',
        theme_color: '#5B6CFF',
        background_color: '#FBFBFE',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/delta'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'kamai-delta-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api/extract-lifemap': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true
      },
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 5173,
    host: true,
    proxy: {
      '/api/extract-lifemap': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true
      },
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true
      }
    }
  }
});
