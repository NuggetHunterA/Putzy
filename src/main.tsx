import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const root = document.getElementById('root')!

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
