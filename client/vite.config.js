import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-icon.svg'], // Update this
      manifest: {
        name: 'Yahtzee Multiplayer',
        short_name: 'Yahtzee',
        description: 'Real-time multiplayer Yahtzee with wallets and streaks!',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: 'any', // 'any' is the magic word for SVGs!
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})