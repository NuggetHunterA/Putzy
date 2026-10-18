// Stempel-Animation auf derselben dunklen Bühne wie Eier und geheime Reihen.
// Der Stempel schwebt schief über einem Blatt Papier, Antippen: Klatsch mit Tintenspritzern und Vibration,
// danach hüpfen die Monster, die Bonus-XP bekommen, einzeln mit „+XP“.
import { useRef, useState } from 'react'
import { useBack } from './back'
import { backdrop, levelFor, monsterById, stageFor, PEOPLE, type Person } from './game'
import { StampMark } from './StampMark'
import { tilt } from './Stamps'
import { rewardText, type Earned, type Stamp } from './stamps'

// Mehr Monster passen nicht unter das Banner, der Rest steht als Zahl daneben.
const MAX_SHOWN = 10

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export function StampScene({ stamp: s, earned: e, person, monsterXp, onDone }: { stamp: Stamp; earned: Earned; person: Person; monsterXp: Record<string, number>; onDone: () => void }) {
  useBack(onDone)
  const [phase, setPhase] = useState<'hover' | 'slam' | 'reward'>('hover')
  const paper = useRef<HTMLDivElement>(null)
  const slam = () => {
    if (phase !== 'hover') return
    setPhase('slam')
    navigator.vibrate?.([30, 30, 140])
    setTimeout(() => splash(paper.current!, s.color), 260)
    setTimeout(() => setPhase('reward'), 1300)
  }
  const who = e.person === person ? 'dir' : e.person ? PEOPLE[e.person] : 'euch beiden'

  return (
    <div className={`evo rev st-scene ${phase === 'hover' ? 'evo-charge' : 'evo-reveal'}`} style={{ ['--glow' as string]: '#FFD23F' }} onClick={slam}>
      <div className="evo-rays" aria-hidden="true" />
      <div className="rev-text st-shout">{phase === 'reward' ? `${s.name}!` : 'Stempel verdient!'}</div>
      {phase === 'hover' && <div className="rev-sub">{s.text} …</div>}
      <div className={`st-paper ${phase}`} ref={paper}>
        <span className="st-stamp">
          <StampMark stamp={s} size={180} tilt={phase === 'hover' ? 0 : tilt(s.id)} />
        </span>
      </div>
      {phase === 'slam' && <span className="st-klatsch">Klatsch!</span>}
      {phase === 'slam' && <div className="evo-flash" aria-hidden="true" />}
      <div className={`evo-banner rev-banner st-banner ${phase === 'reward' ? 'in' : ''}`} role="status">
        <span className="evo-names">
          {s.reward ? `+${s.reward.xp} XP` : 'Ins Heft!'} <span className="rev-chip" style={{ background: 'var(--sun)' }}>{rewardText(s.reward).replace(/^\+\d+ XP für /, '')}</span>
        </span>
        <span className="evo-sub">
          {s.text}, verdient von {who}.
        </span>
        {phase === 'reward' && e.monsters.length > 0 && (
          <span className="st-mons">
            {e.monsters.slice(0, MAX_SHOWN).map((id, i) => {
              const m = monsterById(id)
              const level = levelFor(monsterXp[id] ?? 0)
              const up = level > levelFor((monsterXp[id] ?? 0) - e.xp)
              return (
                <span key={id} className="st-mon" style={{ animationDelay: `${0.5 + i * 0.12}s` }}>
                  <span className="st-round" style={{ background: backdrop(m.element) }}>
                    <img src={m.files[stageFor(m, level)]} alt="" />
                  </span>
                  <span className="st-plus">{up ? `Lv ${level}!` : `+${e.xp}`}</span>
                </span>
              )
            })}
            {e.monsters.length > MAX_SHOWN && <span className="st-more">+{e.monsters.length - MAX_SHOWN}</span>}
          </span>
        )}
      </div>
      {phase === 'reward' ? (
        <button className="btn rev-btn" onClick={onDone}>
          Weiter
        </button>
      ) : (
        phase === 'hover' && <span className="evo-skip">Antippen</span>
      )}
    </div>
  )
}

// Tintenspritzer in der Farbe des Stempels rund um den Abdruck.
function splash(target: HTMLElement, color: string) {
  if (reduced()) return
  const r = target.getBoundingClientRect()
  for (let i = 0; i < 16; i++) {
    const dot = document.createElement('span')
    dot.className = 'st-ink'
    dot.style.background = color
    const size = 6 + Math.random() * 12
    dot.style.width = dot.style.height = `${size}px`
    const a = (i / 16) * Math.PI * 2 + Math.random() * 0.3
    const d = 90 + Math.random() * 70
    dot.style.left = `${r.width / 2 + Math.cos(a) * d - size / 2}px`
    dot.style.top = `${r.height / 2 + Math.sin(a) * d * 0.8 - size / 2}px`
    target.appendChild(dot)
  }
}
