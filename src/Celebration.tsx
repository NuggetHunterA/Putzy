// Vollbild beim Level-Up, bleibt stehen, bis man tippt. Die Entwicklung hat eine eigene Szene (Evolution.tsx).
import { useBack } from './back'
import { ELEMENTS, MAX_LEVEL, type Monster } from './game'
import { UNLOCK_LEVELS } from './pedia'

export type Cel = {
  key: number
  monster: Monster
  stageBefore: number
  stageAfter: number
  level: number
  xp: number
  bonus: boolean
}

export function Celebration({ cel, onDone }: { cel: Cel; onDone: () => void }) {
  useBack(onDone)

  const { monster } = cel
  return (
    <button className="cel" style={{ background: ELEMENTS[monster.element].strong }} onClick={onDone} aria-label="Schließen">
      <div className="cel-stripes" aria-hidden="true" />
      <span className="cel-ring" aria-hidden="true" />
      <div className="cel-stage">
        <img className="cel-zoom" src={monster.files[cel.stageAfter]} alt={monster.stages[cel.stageAfter]} />
      </div>
      <div className="cel-call" role="status">
        <span className="cel-move">{monster.move}!</span>
        <span className="cel-sub">
          {cel.level === MAX_LEVEL ? 'MAX-Level erreicht' : `Level ${cel.level} erreicht`} · +{cel.xp} XP{cel.bonus ? ' · Element-Bonus' : ''}
        </span>
        {UNLOCK_LEVELS.includes(cel.level) && <span className="cel-sub">Neuer Pedia-Eintrag freigeschaltet</span>}
      </div>
      <span className="evo-skip cel-skip">Tippen zum Schließen</span>
    </button>
  )
}
