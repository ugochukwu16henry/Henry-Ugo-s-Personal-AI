import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.png'],
      manifest: {
        name: "Henry Ugo's Personal AI",
        short_name: "Henry AI",
        description: "A next-generation, local-first AI code editor",
        theme_color: '#1e1e1e',
        background_color: '#1e1e1e',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['development', 'productivity'],
        shortcuts: [
          {
            name: 'New Task',
            short_name: 'Task',
            description: 'Create a new AI task',
            url: '/?action=new-task',
            icons: [{ src: 'icon.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/localhost:11434\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ollama-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: ['@monaco-editor/react']
  }
})

