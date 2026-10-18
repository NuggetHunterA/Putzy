// Eier: Fund und Schlüpfen auf derselben dunklen Bühne wie die geheimen Reihen.
// Fund: Das Ei rollt wackelnd herein, Antippen lässt es mit Blitz ins Nest plumpsen.
// Schlüpfen: Drei Tipper knacken das Ei, dann fliegen die Schalen weg und Stufe 1 steht da.
import { useRef, useState } from 'react'
import { useBack } from './back'
import { eggCost, eggFile, eggName, type Egg } from './eggs'
import { burst, confetti } from './fx'
import { ELEMENTS, PEOPLE, type Monster, type Person } from './game'

export type Scene = { egg: Egg; kind: 'found' | 'hatch'; monster: Monster }

const TAPS = 3

export function EggScene({ scene, person, canPick, onDone }: { scene: Scene; person: Person; canPick: boolean; onDone: () => void }) {
  useBack(onDone)
  return scene.kind === 'found' ? <Found scene={scene} person={person} onDone={onDone} /> : <Hatch scene={scene} person={person} canPick={canPick} onDone={onDone} />
}

// Blitz, Funken in Elementfarbe, Konfetti und Vibration aus der Mitte der Bühne.
function boom(stage: HTMLElement, m: Monster) {
  navigator.vibrate?.([80, 40, 160])
  const r = stage.getBoundingClientRect()
  burst(r.left + r.width / 2, r.top + r.height / 2, m.element, 26, 260)
  confetti(r.left + r.width / 2, r.top + r.height / 2)
}

// Wer hat es wo gefunden bzw. ausgebrütet, aus Sicht der Person, die zuschaut.
const who = (by: Person | null, person: Person, verb: string) => (by === person ? `Du hast es ${verb}` : `${PEOPLE[by!]} hat es ${verb}`)

function Found({ scene, person, onDone }: { scene: Scene; person: Person; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const { egg, monster: m } = scene
  const look = ELEMENTS[m.element]
  const show = () => {
    if (open) return
    setOpen(true)
    boom(stage.current!, m)
  }
  const sub = egg.found_by
    ? `${who(egg.found_by, person, `bei „${egg.found_task}“ gefunden`)}. Ausbrüten im Pedia für ${eggCost(m.id)} Streak-Punkte.`
    : `Euer erstes Ei! Ausbrüten im Pedia für ${eggCost(m.id)} Streak-Punkte.`

  return (
    <div className={`evo rev ${open ? 'evo-reveal' : 'evo-charge'}`} style={{ ['--glow' as string]: look.soft }} onClick={show}>
      <div className="evo-rays" aria-hidden="true" />
      <div className="rev-text">{open ? 'Ein Ei ist aufgetaucht!' : 'Was rollt denn da?'}</div>
      {!open && <div className="rev-sub">{egg.found_task ? `Bei „${egg.found_task}“ ist etwas aufgetaucht …` : 'Da liegt schon etwas bereit …'}</div>}
      <div className="evo-stage egg-stage" ref={stage}>
        <img className={open ? 'egg-img' : 'egg-img egg-roll'} src={eggFile(m.id)} alt={open ? eggName(m) : ''} />
        {open && <Nest />}
      </div>
      {open && <div className="evo-flash" aria-hidden="true" />}
      <div className={`evo-banner rev-banner ${open ? 'in' : ''}`} role="status">
        <span className="evo-names">
          {eggName(m)} <span className="rev-chip" style={{ background: look.soft }}>{look.name}</span>
        </span>
        <span className="evo-sub">{sub}</span>
      </div>
      {open ? (
        <button className="btn rev-btn" onClick={onDone}>
          Ab ins Nest!
        </button>
      ) : (
        <span className="evo-skip">Antippen</span>
      )}
    </div>
  )
}

function Hatch({ scene, person, canPick, onDone }: { scene: Scene; person: Person; canPick: boolean; onDone: () => void }) {
  const [taps, setTaps] = useState(0)
  const stage = useRef<HTMLDivElement>(null)
  const { egg, monster: m } = scene
  const look = ELEMENTS[m.element]
  const name = m.stages[0].replace('­', '')
  const open = taps > TAPS
  const tap = () => {
    if (taps >= TAPS) return
    navigator.vibrate?.(40)
    setTaps(taps + 1)
    // Nach dem letzten Tipper bricht kurz Licht aus den Rissen, dann schlüpft es.
    if (taps + 1 === TAPS)
      setTimeout(() => {
        setTaps(TAPS + 1)
        boom(stage.current!, m)
      }, 900)
  }

  return (
    <div className={`evo rev ${open ? 'evo-reveal' : 'evo-charge'}`} style={{ ['--glow' as string]: look.soft }} onClick={tap}>
      <div className="evo-rays" aria-hidden="true" />
      <div className="rev-text">{open ? 'Geschlüpft!' : taps === TAPS ? 'Gleich …!' : 'Da tut sich was!'}</div>
      {taps < TAPS && <div className="rev-sub">Tippe aufs Ei, um zu helfen</div>}
      <div className={`evo-stage egg-stage ${taps === TAPS ? 'egg-glow' : ''}`} ref={stage}>
        {open ? (
          <>
            <img src={m.files[0]} alt={name} />
            <Shell side="left" />
            <Shell side="right" />
          </>
        ) : (
          <>
            <img key={taps} className={`egg-img ${taps > 0 ? 'egg-shake' : 'egg-wobble'}`} src={eggFile(m.id)} alt="" />
            <Cracks n={taps} />
          </>
        )}
      </div>
      {!open && (
        <span className="egg-taps" aria-hidden="true">
          {Array.from({ length: TAPS }, (_, i) => (
            <i key={i} className={i < taps ? 'on' : ''} />
          ))}
        </span>
      )}
      {open && <div className="evo-flash" aria-hidden="true" />}
      <div className={`evo-banner rev-banner ${open ? 'in' : ''}`} role="status">
        <span className="evo-names">
          {name} <span className="rev-chip" style={{ background: look.soft }}>{look.name}</span>
        </span>
        <span className="evo-sub">
          {who(egg.hatched_by, person, 'ausgebrütet')}. {canPick ? 'Du kannst es gleich auswählen.' : 'Ab nächster Woche könnt ihr es wählen.'}
        </span>
      </div>
      {open && (
        <button className="btn rev-btn" onClick={onDone}>
          Hallo, {name}!
        </button>
      )}
    </div>
  )
}

function Nest() {
  return (
    <svg className="egg-nest" viewBox="0 0 210 54" aria-hidden="true">
      <path d="M10 10 Q105 70 200 10 L192 34 Q105 70 18 34 Z" fill="#C78A4A" stroke="#1B1530" strokeWidth="4" strokeLinejoin="round" />
      <path d="M30 26 L60 36 M80 38 L110 34 M130 40 L160 30 M170 24 L190 20" stroke="#8A5A2A" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// Risse über dem Ei, einer mehr pro Tipper.
const CRACKS = ['M34 30 l9 9 -7 9 10 7 -5 8', 'M70 26 l-8 10 9 7 -6 10 7 6', 'M12 56 l12 -7 9 9 10 -10 10 9 10 -9 12 7 13 -5']
function Cracks({ n }: { n: number }) {
  return (
    <svg className="egg-cracks" viewBox="0 0 100 100" aria-hidden="true">
      {CRACKS.slice(0, n).map((d) => (
        <path key={d} d={d} fill="none" stroke="#1B1530" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  )
}

function Shell({ side }: { side: 'left' | 'right' }) {
  return (
    <svg className={`egg-shell ${side}`} viewBox="0 0 100 50" aria-hidden="true">
      <path d="M8 10 C8 30 20 44 50 44 C80 44 92 30 92 10 l-10 8 -9 -8 -8 8 -9 -8 -8 8 -9 -8 -9 8 -10 -8z" fill="#FFF6D8" stroke="#1B1530" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  )
}
