import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Version 0.n, n = Nummer des zuletzt gemergten Pull Requests, aus der Git-Historie bzw. der Commit-Nachricht von Vercel.
// Vorschau-Builds von Vercel tragen die Nummer ihres Pull Requests und den Zusatz „Vorschau“.
function version() {
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_GIT_PULL_REQUEST_ID) return `0.${process.env.VERCEL_GIT_PULL_REQUEST_ID} (Vorschau)`
  let log = process.env.VERCEL_GIT_COMMIT_MESSAGE ?? ''
  try {
    log = execSync('git log -50 --format=%s', { encoding: 'utf8' }) + log
  } catch {
    // Ohne Git bleibt nur die Commit-Nachricht.
  }
  const pr = log.match(/Merge pull request #(\d+)|\(#(\d+)\)/)
  const n = pr ? `0.${pr[1] ?? pr[2]}` : '0.?'
  return process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production' ? `${n} (Vorschau)` : n
}

export default defineConfig({
  define: { __VERSION__: JSON.stringify(version()) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Putzy',
        short_name: 'Putzy',
        lang: 'de',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#EDE6FF',
        theme_color: '#EDE6FF',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,webp}'] },
    }),
  ],
})
