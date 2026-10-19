// Entwicklung: Bildschirm wird dunkel, das Monster wird zur Silhouette, wechselt immer schneller
// zwischen alter und neuer Form, weißer Blitz, dann steht die neue Stufe in Farbe da.
import { useEffect, useRef, useState } from 'react'
import { useBack } from './back'
import type { Cel } from './Celebration'
import { burst, confetti, pullIn } from './fx'
import { ELEMENTS } from './game'

const GAPS = [520, 460, 400, 340, 290, 240, 200, 165, 135, 110, 90, 75, 62, 52, 45, 40, 36, 33, 30, 30]
const CLOSE_AFTER = 4000

type Phase = 'intro' | 'charge' | 'reveal'

export function Evolution({ cel, onDone }: { cel: Cel; onDone: () => void }) {
  useBack(onDone)
  const [phase, setPhase] = useState<Phase>('intro')
  const [showNew, setShowNew] = useState(false)
  const [banner, setBanner] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const { monster } = cel
  const element = monster.element

  useEffect(() => {
    let alive = true
    let stopPull = () => {}
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
    ;(async () => {
      await wait(1000)
      if (!alive) return
      setPhase('charge')
      stopPull = pullIn(stage.current!, element)
      await wait(1100)
      let flip = false
      for (const gap of GAPS) {
        if (!alive) return
        flip = !flip
        setShowNew(flip)
        stage.current?.animate([{ scale: 1.08 }, { scale: 1 }], { duration: 180, easing: 'ease-out' })
        if (gap > 100) navigator.vibrate?.(15)
        await wait(gap)
      }
      stopPull()
      if (!alive) return
      setShowNew(true)
      setPhase('reveal')
      navigator.vibrate?.([80, 40, 160])
      const r = stage.current!.getBoundingClientRect()
      burst(r.left + r.width / 2, r.top + r.height / 2, element, 26, 260)
      confetti(r.left + r.width / 2, r.top + r.height / 2)
      await wait(700)
      if (!alive) return
      setBanner(true)
      await wait(CLOSE_AFTER)
      if (alive) onDone()
    })()
    return () => {
      alive = false
      stopPull()
    }
  }, [cel.key, element, onDone])

  const silhouette = phase !== 'intro' && phase !== 'reveal'
  return (
    <button className={`evo evo-${phase}`} style={{ ['--glow' as string]: ELEMENTS[element].soft }} onClick={onDone} aria-label="Schließen">
      <div className="evo-rays" aria-hidden="true" />
      <div className="evo-text" aria-hidden={phase === 'reveal'}>
        Nanu? {monster.stages[cel.stageBefore]} verändert sich …
      </div>
      <div className="evo-stage" ref={stage}>
        <img className={silhouette ? 'sil' : ''} src={monster.files[cel.stageBefore]} alt="" hidden={showNew} />
        <img className={silhouette ? 'sil' : ''} src={monster.files[cel.stageAfter]} alt={monster.stages[cel.stageAfter]} hidden={!showNew} />
      </div>
      {phase === 'reveal' && <div className="evo-flash" aria-hidden="true" />}
      <div className={`evo-banner ${banner ? 'in' : ''}`} role="status">
        <span className="evo-names">
          {monster.stages[cel.stageBefore]} <i>→</i> {monster.stages[cel.stageAfter]}
        </span>
        <span className="evo-sub">
          Level {cel.level} · Attacke: {monster.move}
        </span>
        {monster.second && cel.stageAfter === monster.levels.length && <span className="evo-sub">Neues Element: {ELEMENTS[monster.second].name}!</span>}
      </div>
      <span className="evo-skip">Tippen zum Schließen</span>
    </button>
  )
}
