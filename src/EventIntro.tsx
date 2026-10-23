// Event-Begrüßung beim ersten Öffnen im Event: Der Name fällt Buchstabe für Buchstabe herein, darunter Zeitraum und
// Bonus als Sticker. Hat das Event ein Ei, rollt es ins Nest; das ersetzt dessen Fund-Szene. Hat es einen Boss, steigt
// er auf einer zweiten Seite aus dem Abfluss.
import { useEffect, useRef, useState } from 'react'
import { useBack } from './back'
import { BOSS_POINTS, bossImg, weakness, type BossState } from './bosses'
import { eggCost, eggFile, eggName } from './eggs'
import { ElementIcon } from './ElementIcon'
import { EVENT_LABEL, eventBonus, eventEnd, eventStart, type AppEvent } from './events'
import { burst } from './fx'
import { ELEMENTS, TEAM_BONUS, type Monster } from './game'

const short = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}.`

export function EventIntro({ event, now, egg, boss, onDone }: { event: AppEvent; now: Date; egg: Monster | null; boss: BossState | null; onDone: () => void }) {
  useBack(onDone)
  const [bossPage, setBossPage] = useState(false)
  const img = useRef<HTMLImageElement>(null)
  const bonus = eventBonus(now)!
  const look = ELEMENTS[bonus]
  const name = EVENT_LABEL[event].replace(/^\S+ /, '')
  const start = eventStart(now)
  const end = eventEnd(now)
  const left = Math.round((end.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 864e5)
  const when = start.getTime() === end.getTime() ? end.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' }) : `${short(start)} bis ${short(end)}`
  const rest = left === 0 ? 'Nur noch heute' : `Noch ${left + 1} Tage, bis ${end.toLocaleDateString('de-DE', { weekday: 'long' })}`

  const hop = () => {
    const el = img.current!
    el.classList.remove('hop')
    void el.offsetWidth
    el.classList.add('hop')
    navigator.vibrate?.(40)
    const r = el.getBoundingClientRect()
    burst(r.left + r.width / 2, r.top + r.height / 2, egg!.element, 16, 120)
  }

  if (bossPage && boss) return <BossIntro s={boss} onDone={onDone} />

  return (
    <div className={`intro ${egg ? '' : 'no-egg'}`} style={{ ['--glow' as string]: look.soft, ['--n' as string]: name.length }}>
      <div className="intro-fx" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${-i * 1.7}s`, animationDuration: `${9 + (i % 4) * 2}s`, scale: `${0.7 + (i % 3) * 0.25}` }} />
        ))}
      </div>
      <span className="intro-kicker">EVENT STARTET</span>
      <h1 className="intro-title" aria-label={name}>
        {[...name].map((c, i) => (
          <span key={i} style={{ ['--i' as string]: i }}>
            {c}
          </span>
        ))}
      </h1>
      <div className="intro-when">
        {when}
        <small>{rest}</small>
      </div>
      <div className="intro-bonus">
        <span className="event-badge-dot" style={{ background: look.strong }}>
          <ElementIcon element={bonus} />
        </span>
        <b>+50% XP</b>
        <span>für {look.name}-Aufgaben</span>
      </div>
      <div className="intro-bonus intro-team">
        <span className="event-badge-dot" style={{ background: look.strong }}>
          <ElementIcon element={bonus} />
        </span>
        <b>+{TEAM_BONUS} XP</b>
        <span>für alle {look.name}-Monster bei jeder {look.name}-Aufgabe</span>
      </div>
      {egg ? (
        <>
          <div className="intro-egg">
            <svg className="egg-nest" viewBox="0 0 210 54" aria-hidden="true">
              <path d="M10 10 Q105 70 200 10 L192 34 Q105 70 18 34 Z" fill="#C78A4A" stroke="#1B1530" strokeWidth="4" strokeLinejoin="round" />
              <path d="M30 26 L60 36 M80 38 L110 34 M130 40 L160 30 M170 24 L190 20" stroke="#8A5A2A" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <img ref={img} src={eggFile(egg.id)} alt={eggName(egg)} onClick={hop} />
          </div>
          <p className="intro-egg-text">
            Zu {name} ist ein <b>{eggName(egg)}</b> aufgetaucht! Es liegt schon im Nest. Ausbrüten im Pedia für nur {eggCost(egg.id)} Streak-Punkte.
          </p>
        </>
      ) : (
        <p className="intro-egg-text">Sammelt in diesen Tagen so viel XP wie möglich!</p>
      )}
      <button className="btn intro-btn" onClick={boss?.boss.event === event && !boss.fight ? () => setBossPage(true) : onDone}>
        Los geht's!
      </button>
    </div>
  )
}

// Zweite Seite: Der Boss steigt auf, der Boden bebt, Name und Fakten stempeln herein.
function BossIntro({ s, onDone }: { s: BossState; onDone: () => void }) {
  const stage = useRef<HTMLDivElement>(null)
  const weak = weakness(s.boss)
  useEffect(() => {
    const id = setTimeout(() => {
      const r = stage.current?.getBoundingClientRect()
      if (r) burst(r.left + r.width / 2, r.top + r.height * 0.75, s.boss.element, 26, 140)
      navigator.vibrate?.(60)
    }, 950)
    return () => clearTimeout(id)
  }, [s.boss.element])
  const day = new Date(`${s.lastDay}T12:00`).toLocaleDateString('de-DE', { weekday: 'long' })
  return (
    <div className="intro boss-intro" style={{ ['--glow' as string]: ELEMENTS[s.boss.element].soft, ['--n' as string]: s.boss.name.length }}>
      <span className="intro-kicker">EIN BOSS TAUCHT AUF</span>
      <div className="boss-stage" ref={stage}>
        <img src={bossImg(s.boss)} alt="" />
      </div>
      <h1 className="intro-title" aria-label={s.boss.name}>
        {[...s.boss.name].map((c, i) => (
          <span key={i} style={{ ['--i' as string]: i }}>
            {c}
          </span>
        ))}
      </h1>
      <div className="boss-facts">
        <span className="bfact">
          <span className="event-badge-dot" style={{ background: ELEMENTS[s.boss.element].strong }}>
            <ElementIcon element={s.boss.element} />
          </span>
          <span>{ELEMENTS[s.boss.element].name}-Boss</span>
        </span>
        <span className="bfact">
          <b>{s.lp}</b> LP
        </span>
        <span className="bfact weak">
          <span className="event-badge-dot" style={{ background: ELEMENTS[weak].strong }}>
            <ElementIcon element={weak} />
          </span>
          <span>
            {ELEMENTS[weak].name}-Monster
            <br />
            haben Vorteil
          </span>
        </span>
      </div>
      <p className="intro-egg-text">
        Jede erledigte Aufgabe schwächt ihn. Ab {day} schickt ihr drei Monster in den Endkampf. Sieg bringt <b>{BOSS_POINTS} Streak-Punkte</b>.
      </p>
      <button className="btn intro-btn" onClick={onDone}>
        Wir putzen ihn weg!
      </button>
    </div>
  )
}
