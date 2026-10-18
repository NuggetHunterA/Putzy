// Wochenrückblick: montags vor der Monsterwahl die Vorwoche, in der Pedia als Archiv zum Blättern.
import { useEffect, useState } from 'react'
import { useBack } from './back'
import { loadHistory, type Completion, type Pick, type Task } from './db'
import type { Earned } from './stamps'
import { ElementIcon } from './ElementIcon'
import { ELEMENTS, PEOPLE, backdrop } from './game'
import { Sponge } from './Sponge'
import { KINDS, reviewWeeks, weekLabel, weekReview, weekStamps, type Kind, type MonsterWeek } from './review'

type Props = {
  tasks: Task[]
  // Woche, mit der der Rückblick startet: montags die Vorwoche, im Archiv die laufende.
  week: string
  // Archiv: mit Blättern und „Diese Woche · bisher“. Sonst wird eine Woche ohne Monster übersprungen.
  archive?: boolean
  // Montags: Streak-Punkte der Vorwoche und Kontostand danach.
  streak?: { earned: number; bank: number }
  onDone: () => void
}

const ONEOFF_COLOR = '#8C82A8'

export function WeekReview({ tasks, week: start, archive, streak, onDone }: Props) {
  useBack(onDone)
  const [history, setHistory] = useState<{ picks: Pick[]; completions: Completion[]; stamps: Earned[] } | null>(null)
  const [failed, setFailed] = useState(false)
  const [week, setWeek] = useState(start)
  useEffect(() => {
    loadHistory().then(setHistory, () => setFailed(true))
  }, [])

  const cards = history ? weekReview(week, history.picks, history.completions, tasks, history.stamps) : []
  // Montags: Ohne Monster in der Vorwoche oder ohne Verbindung geht es direkt zur Monsterwahl.
  const skip = !archive && (failed || (history !== null && cards.length === 0))
  useEffect(() => {
    if (skip) onDone()
  }, [skip, onDone])

  if (!history || skip) {
    return (
      <main className="screen center">
        <p className="lead">{failed ? 'Keine Verbindung zur Datenbank.' : 'Rückblick lädt …'}</p>
      </main>
    )
  }

  const weeks = reviewWeeks(history.picks)
  const i = weeks.indexOf(week)
  const older = weeks[i + 1]
  const newer = i > 0 ? weeks[i - 1] : undefined
  const label = !archive ? `Letzte Woche · ${weekLabel(week)}` : week === start ? 'Diese Woche · bisher' : weekLabel(week)
  const max = Math.max(1, ...cards.flatMap((c) => KINDS.map((k) => c.tasks[k])))
  const stamped = weekStamps(week, history.stamps)

  return (
    <main className="screen">
      <header className="wr-head">
        {archive && (
          <button className="btn back" disabled={!older} onClick={() => setWeek(older)} aria-label="Ältere Woche">
            ‹
          </button>
        )}
        <span className="kicker">{label.toUpperCase()}</span>
        {archive && (
          <button className="btn back" disabled={!newer} onClick={() => newer && setWeek(newer)} aria-label="Neuere Woche">
            ›
          </button>
        )}
      </header>
      <h1 className="wr-title">Wochenrückblick</h1>
      {streak && (
        <div className="wr-streak">
          <Sponge n={streak.earned} size={34} />
          <span>
            +{streak.earned} Streak-Punkte · Konto jetzt {streak.bank}
          </span>
        </div>
      )}
      {stamped > 0 && (
        <div className="wr-streak">
          <span className="wr-stamp" aria-hidden="true" />
          <span>
            Stempel: {stamped} neu im Stempelheft
          </span>
        </div>
      )}
      <div className="wr-cols" style={{ gridTemplateColumns: cards.length > 1 ? '1fr 1fr' : 'minmax(0, 50%)' }}>
        {cards.map((c) => (
          <Card key={c.person} c={c} max={max} />
        ))}
      </div>
      <button className="news-btn" onClick={onDone}>
        {archive ? 'Zurück zur Pedia' : 'Weiter zur Monsterwahl'}
      </button>
    </main>
  )
}

function Card({ c, max }: { c: MonsterWeek; max: number }) {
  const m = c.monster
  const evolved = c.stageAfter > c.stageBefore
  return (
    <section className="wr-col">
      <div className="wr-hero" style={{ background: backdrop(m.element) }}>
        <img className="wr-big" src={m.files[c.stageAfter]} alt="" />
        {evolved && (
          <>
            <span className="wr-old" style={{ background: backdrop(m.element) }}>
              <img src={m.files[c.stageBefore]} alt="" />
            </span>
            <span className="wr-tag">Entwickelt!</span>
          </>
        )}
      </div>
      <div className="wr-body">
        <div>
          <span className="kicker">{PEOPLE[c.person].toUpperCase()}</span>
          <div className="wr-name">{m.stages[c.stageAfter]}</div>
        </div>
        <div className="wr-xp">+{c.xp.toLocaleString('de-DE')} XP</div>
        <div className="wr-lv">
          {c.levelAfter === c.levelBefore ? (
            <>
              <i>Lv {c.levelBefore}</i> gleich
            </>
          ) : (
            <>
              <i>Lv {c.levelBefore}</i>→<i className="up">Lv {c.levelAfter}</i>
            </>
          )}
        </div>
        <div className="wr-bars">
          {KINDS.map((k) => (
            <div key={k} className={`wr-bar ${c.tasks[k] ? '' : 'zero'}`} aria-label={`${label(k)}: ${c.tasks[k]}`}>
              <KindIcon k={k} />
              <span className="track">
                <span style={{ width: `${(c.tasks[k] / max) * 100}%`, background: k === 'einmalig' ? ONEOFF_COLOR : ELEMENTS[k].strong }} />
              </span>
              <b>{c.tasks[k]}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const label = (k: Kind) => (k === 'einmalig' ? 'Einmalig' : ELEMENTS[k].name)

// Einmalige Aufgaben mit dem Klemmbrett von der Startseite.
function KindIcon({ k }: { k: Kind }) {
  if (k !== 'einmalig') return <ElementIcon element={k} size={18} />
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V2.8h6V4M9 11l2 2 4-4M9 17h6" />
    </svg>
  )
}
