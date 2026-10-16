// Verwandlungsanimation beim Abhaken, mit Extra-Szene, wenn sich das Monster entwickelt.
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
  task: string
}

export function Celebration({ cel, onDone }: { cel: Cel; onDone: () => void }) {
  const evolves = cel.stageAfter > cel.stageBefore
  const duration = evolves ? 5200 : 2700

  useEffect(() => {
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [cel.key, duration, onDone])

  const { monster } = cel
  return (
    <button
      className={`cel ${evolves ? 'cel-evolve' : ''}`}
      style={{ background: ELEMENTS[monster.element].strong, animationDuration: `${duration}ms` }}
      onClick={onDone}
      aria-label="Schließen"
    >
      <div className="cel-stripes" aria-hidden="true" />
      <span className="cel-ring" aria-hidden="true" />
      {evolves ? (
        <div className="cel-stage">
          <img className="cel-old" src={monster.files[cel.stageBefore]} alt="" />
          <img className="cel-new" src={monster.files[cel.stageAfter]} alt={monster.stages[cel.stageAfter]} />
        </div>
      ) : (
        <div className="cel-stage">
          <img className="cel-zoom" src={monster.files[cel.stageAfter]} alt={monster.stages[cel.stageAfter]} />
        </div>
      )}
      <div className="cel-call" role="status">
        {evolves ? (
          <>
            <span className="cel-move">{monster.stages[cel.stageBefore]} entwickelt sich!</span>
            <span className="cel-sub">
              Jetzt: {monster.stages[cel.stageAfter]} · Level {cel.level}
            </span>
          </>
        ) : (
          <>
            <span className="cel-move">{monster.move}!</span>
            <span className="cel-sub">
              {cel.task} · +{cel.xp} XP{cel.bonus ? ' · Element-Bonus' : ''}
            </span>
          </>
        )}
      </div>
    </button>
  )
}
