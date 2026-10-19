// Level 30: Im Dunkeln füllt sich das Monster mit Gold, Blitz, dann steht es in Farbe auf Gold, springt, brüllt
// und schwebt atmend vor einem Sternenring. Darunter die Legende aus dem Pedia. Bleibt, bis man tippt.
import { useEffect, useRef, useState } from 'react'
import { useBack } from './back'
import { burst, confetti, pullIn } from './fx'
import type { Monster } from './game'
import { PEDIA } from './pedia'

const STARS = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4)

export function Legend({ monster, onDone }: { monster: Monster; onDone: () => void }) {
  useBack(onDone)
  const [gold, setGold] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const last = monster.stages.length - 1
  const name = monster.stages[last]

  useEffect(() => {
    let alive = true
    let stopPull = () => {}
    let idle: ReturnType<typeof setInterval> | undefined
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const center = () => {
      const r = stage.current!.getBoundingClientRect()
      return [r.left + r.width / 2, r.top + r.height / 2] as const
    }
    ;(async () => {
      await wait(400)
      if (!alive) return
      stopPull = pullIn(stage.current!, 'licht')
      await wait(2600)
      stopPull()
      if (!alive) return
      setGold(true)
      navigator.vibrate?.([80, 40, 160])
      burst(...center(), 'licht', 30, 260)
      confetti(...center())
      await wait(620)
      if (!alive) return
      burst(...center(), monster.element, 26, 200)
      idle = setInterval(() => burst(...center(), monster.element, 6, 140), 2400)
    })()
    return () => {
      alive = false
      stopPull()
      clearInterval(idle)
    }
  }, [monster])

  return (
    <button className={`leg ${gold ? 'leg-gold' : ''}`} onClick={onDone} aria-label="Schließen">
      <div className="leg-rays" aria-hidden="true" />
      <div className="leg-text" aria-hidden="true">
        Nanu? {name} fängt an zu glänzen …
      </div>
      <div className="leg-title" aria-hidden="true">
        LEGENDE!
      </div>
      <div className="leg-stage" ref={stage}>
        <div className="leg-ring" aria-hidden="true">
          <svg viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="86" fill="none" stroke="#FFF3B8" strokeWidth="6" strokeDasharray="4 10" />
          <circle cx="100" cy="100" r="74" fill="none" stroke="#FFFFFF" strokeOpacity=".6" strokeWidth="3" />
          {STARS.map((a) => (
            <text key={a} x={100 + Math.cos(a) * 86} y={100 + Math.sin(a) * 86 + 7} textAnchor="middle" fontSize="20" fill="#FFF3B8" stroke="#1B1530" strokeWidth="1.5">
              ★
            </text>
          ))}
          </svg>
        </div>
        <span className="leg-shadow" aria-hidden="true" />
        <div className="leg-mon">
          <img src={monster.files[last]} alt={name} />
          <img className="leg-fill" src={monster.files[last]} alt="" />
        </div>
      </div>
      {gold && <div className="leg-flash" aria-hidden="true" />}
      <div className="leg-call" role="status">
        <span className="evo-names">
          {name} <i>★</i> Level 30
        </span>
        <span className="leg-legend">{PEDIA[monster.id].legend}</span>
      </div>
      <span className="evo-skip leg-skip">Tippen zum Schließen</span>
    </button>
  )
}
