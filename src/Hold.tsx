// Entwicklung und Level 30: Solange die Szene läuft, überspringt nur Gedrückthalten, damit ein
// versehentlicher Tipp sie nicht wegwischt. Ist die Szene fertig (done), schließt ein Tipp.
import { useEffect, useRef, useState } from 'react'

const HOLD_MS = 1000

export function useHold(onDone: () => void, done: boolean) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const stop = () => {
    clearTimeout(timer.current)
    setHolding(false)
  }
  const handlers = done
    ? { onClick: onDone }
    : {
        onPointerDown: () => {
          setHolding(true)
          timer.current = setTimeout(onDone, HOLD_MS)
        },
        onPointerUp: stop,
        onPointerLeave: stop,
        onPointerCancel: stop,
        onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
      }
  return { holding, handlers }
}

export function HoldHint({ done, holding, className }: { done: boolean; holding: boolean; className: string }) {
  if (done) return <span className={className}>Tippen zum Schließen</span>
  return (
    <span className={`${className} hold-hint${holding ? ' holding' : ''}`} style={{ ['--hold' as string]: `${HOLD_MS}ms` }}>
      <svg className="hold-ring" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="7" opacity=".3" />
        <circle className="hold-fill" cx="10" cy="10" r="7" pathLength="1" />
      </svg>
      Gedrückt halten zum Überspringen
    </span>
  )
}
