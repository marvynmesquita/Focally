import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Porta padrão: 4000 ou PORT do ambiente
const port = parseInt(process.env.PORT || '4000', 10)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'image/logo-192.png', 'image/logo-512.png'],
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/audio\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: /\/(?:image|assets)\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 }
            }
          }
        ]
      },
      manifest: {
        name: 'Focally',
        short_name: 'Focally',
        description: 'Transmissão de Áudio Assistiva',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: '/image/logo-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/image/logo-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    allowedHosts: ['focally.onrender.com', 'localhost', '127.0.0.1'],
    port: port,
    host: '0.0.0.0', // Escuta em todas as interfaces (necessário para Render)
    strictPort: true, // Falha se a porta estiver em uso
  },
  preview: {
    allowedHosts: ['focally.onrender.com', 'localhost', '127.0.0.1'],
    port: port,
    host: '0.0.0.0', // Escuta em todas as interfaces (necessário para Render)
    strictPort: true,
  },
})

