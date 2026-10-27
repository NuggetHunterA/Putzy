import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const root = document.getElementById('root')!

// Aufgeklappte Falt-Handys und Tablets: alles 35 % größer statt einer schmalen Spalte mit viel Rand.
// Über den Viewport statt CSS-zoom, damit Animationen, die an Bildschirmpositionen hängen, an der richtigen Stelle bleiben.
const viewport = document.querySelector<HTMLMetaElement>('meta[name=viewport]')!
function fitViewport() {
  const wide = Math.min(screen.width, screen.height) >= 600
  viewport.content = wide ? `width=${Math.round(screen.width / 1.35)}, viewport-fit=cover` : 'width=device-width, initial-scale=1.0, viewport-fit=cover'
}
fitViewport()
addEventListener('resize', fitViewport)

// Absturz statt leerer Seite: Fehlermeldung zeigen, damit man sie weitergeben kann.
function showCrash(error: unknown) {
  const text = error instanceof Error ? `${error.message}\n\n${error.stack ?? ''}` : String(error)
  root.innerHTML = '<main class="screen center"><h1 class="title">Hoppla</h1><p class="lead">Putzy ist abgestürzt. Schick diese Meldung an Claude:</p><pre style="white-space:pre-wrap;font-size:12px;text-align:left;max-width:100%"></pre><button class="btn">Neu laden</button></main>'
  root.querySelector('pre')!.textContent = text
  root.querySelector('button')!.onclick = () => location.reload()
}

createRoot(root, { onUncaughtError: showCrash }).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
