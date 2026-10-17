import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/vocabulaire-/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
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
          { src: '/vocabulaire-/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], navigateFallback: '/vocabulaire-/index.html' }
    })
  ]
})
