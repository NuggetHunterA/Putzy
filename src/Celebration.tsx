// Vollbild beim Level-Up. Die Entwicklung hat eine eigene Szene (Evolution.tsx).
import { useEffect } from 'react'
import { ELEMENTS, type Monster } from './game'

export type Cel = {
  key: number
  monster: Monster
  stageBefore: number
  stageAfter: number
  level: number
  xp: number
  bonus: boolean
}

const DURATION = 2700

export function Celebration({ cel, onDone }: { cel: Cel; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, DURATION)
    return () => clearTimeout(t)
  }, [cel.key, onDone])

  const { monster } = cel
  return (
    <button className="cel" style={{ background: ELEMENTS[monster.element].strong, animationDuration: `${DURATION}ms` }} onClick={onDone} aria-label="Schließen">
      <div className="cel-stripes" aria-hidden="true" />
      <span className="cel-ring" aria-hidden="true" />
      <div className="cel-stage">
        <img className="cel-zoom" src={monster.files[cel.stageAfter]} alt={monster.stages[cel.stageAfter]} />
      </div>
      <div className="cel-call" role="status">
        <span className="cel-move">{monster.move}!</span>
        <span className="cel-sub">
          Level {cel.level} erreicht · +{cel.xp} XP{cel.bonus ? ' · Element-Bonus' : ''}
        </span>
      </div>
    </button>
  )
}
