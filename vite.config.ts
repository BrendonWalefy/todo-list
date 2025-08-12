import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
const repoBase = process.env.NODE_ENV === 'production' ? '/todo-list/' : '/'

export default defineConfig({
  base: repoBase,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: { enabled: true },
      manifest: {
        name: 'Lista de Tarefas - Kanban',
        short_name: 'Kanban',
        description: 'Kanban de tarefas offline-first',
        theme_color: '#242424',
        background_color: '#242424',
        display: 'standalone',
        start_url: repoBase,
        scope: repoBase,
        lang: 'pt-BR',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})
