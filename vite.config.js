import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/vocabulaire-/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Mot à Mot — Mon français',
        short_name: 'Mot à Mot',
        description: 'Mon vocabulaire français, à retenir et à utiliser chaque jour.',
        lang: 'fr',
        start_url: '/vocabulaire-/',
        scope: '/vocabulaire-/',
        display: 'standalone',
        background_color: '#f6f6f2',
        theme_color: '#172920',
        icons: [
          { src: '/vocabulaire-/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/vocabulaire-/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], navigateFallback: '/vocabulaire-/index.html' }
    })
  ]
})
