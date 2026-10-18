// Freischaltung einer geheimen Reihe: dunkel, eine wackelnde Silhouette mit Fragezeichen. Antippen: Blitz,
// dann steht das Monster in Farbe da, mit Name, Element und dem Hinweis, ab wann man es wählen kann.
import { useRef, useState } from 'react'
import { useBack } from './back'
import { burst, confetti } from './fx'
import { ELEMENTS, type Monster } from './game'

export function Reveal({ monster, canPick, onDone }: { monster: Monster; canPick: boolean; onDone: () => void }) {
  useBack(onDone)
  const [open, setOpen] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const look = ELEMENTS[monster.element]
  const name = monster.stages[0]

  const show = () => {
    if (open) return
    setOpen(true)
    navigator.vibrate?.([80, 40, 160])
    const r = stage.current!.getBoundingClientRect()
    burst(r.left + r.width / 2, r.top + r.height / 2, monster.element, 26, 260)
    confetti(r.left + r.width / 2, r.top + r.height / 2)
  }

  return (
    <div className={`evo rev ${open ? 'evo-reveal' : 'evo-charge'}`} style={{ ['--glow' as string]: look.soft }} onClick={show}>
      <div className="evo-rays" aria-hidden="true" />
      <div className="rev-text">{open ? 'Eine geheime Reihe ist erwacht!' : 'Nanu, ein neues Monster?'}</div>
      {!open && <div className="rev-sub">Da versteckt sich jemand …</div>}
      <div className="evo-stage" ref={stage}>
        <img className={open ? '' : 'rev-sil'} src={monster.files[0]} alt={open ? name : ''} />
        {!open && (
          <span className="rev-q" aria-hidden="true">
            ?
          </span>
        )}
      </div>
      {open && <div className="evo-flash" aria-hidden="true" />}
      <div className={`evo-banner rev-banner ${open ? 'in' : ''}`} role="status">
        <span className="evo-names">
          {name} <span className="rev-chip" style={{ background: look.soft }}>{look.name}</span>
        </span>
        <span className="evo-sub">{canPick ? 'Du kannst es gleich auswählen.' : 'Ab nächster Woche kannst du es wählen.'}</span>
      </div>
      {open ? (
        <button className="btn rev-btn" onClick={onDone}>
          Hallo, {name}!
        </button>
      ) : (
        <span className="evo-skip">Antippen zum Aufdecken</span>
      )}
    </div>
  )
}
