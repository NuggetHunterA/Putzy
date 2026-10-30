// Monsterwahl zum Wochenstart. Ein Monster, das die andere Person schon hat, ist gesperrt, eines auf Expedition auch;
// dessen Trupp lässt sich ohne Beute zurückrufen.
import { useState } from 'react'
import { counters, leaderImg, type Leader } from './arena'
import { leaderColors } from './Arena'
import { Dot } from './Boss'
import { EVENT_LABEL, weekEvent } from './events'
import { ELEMENTS, PEOPLE, backdrop, levelFor, stageFor, type Monster, type Person } from './game'
import type { Pick } from './db'
import { Compass, left } from './Expeditions'
import { areaById, type Expedition } from './expeditions'

type Props = {
  person: Person
  // Nur sichtbare Monster, geheime Reihen erst nach ihrer Freischaltung.
  monsters: Monster[]
  picks: Pick[]
  monsterXp: Record<string, number>
  // Trupps, die gerade unterwegs sind.
  expeditions: Expedition[]
  now: Date
  onPick: (monsterId: string) => void
  onRecall: (e: Expedition) => void
  // Arenaleiter der Woche mit dem Level seines Teams, sobald ausgelost.
  arena?: { leader: Leader; level: number }
}

export function MonsterPick({ person, monsters, picks, monsterXp, expeditions, now, onPick, onRecall, arena }: Props) {
  const [recall, setRecall] = useState<Expedition | null>(null)
  return (
    <main className="screen">
      <header className="pick-head">
        <span className="pick-kick">
          <span className="kicker">Neue Woche</span>
          <WeekEvent now={now} />
        </span>
        <h1 className="title">
          Wähle dein
          <br />
          <span className="accent">Monster</span>
        </h1>
        <p className="lead">{PEOPLE[person]}, mit wem putzt du diese Woche? Passende Aufgaben geben 125 % XP.</p>
      </header>
      {arena && <LeaderMini leader={arena.leader} level={arena.level} />}
      <div className="pick-grid">
        {monsters.map((m, i) => {
          const takenBy = picks.find((p) => p.monster === m.id && p.person !== person)
          const away = expeditions.find((e) => e.monsters.includes(m.id))
          const level = levelFor(monsterXp[m.id] ?? 0)
          const stage = stageFor(m, level)
          return (
            <div key={m.id} className={`pick-wrap ${away ? 'away' : ''}`}>
              <button className={`pick-card ${away ? 'away' : ''}`} style={{ animationDelay: `${i * 0.04}s` }} disabled={!!takenBy || !!away} onClick={() => onPick(m.id)}>
                <span className="pick-img" style={{ background: backdrop(m.element) }}>
                  <img src={m.files[stage]} alt="" />
                  <span className="chip">{ELEMENTS[m.element].name}</span>
                  {away && (
                    <span className="away-tag">
                      <Compass size={12} /> unterwegs · {left(new Date(away.ends_at), now)}
                    </span>
                  )}
                </span>
                <span className="pick-name">{m.stages[stage]}</span>
                <span className="pick-meta">{takenBy ? `${PEOPLE[takenBy.person]} hat ihn` : `Level ${level}`}</span>
              </button>
              {away && (
                <button className="pick-recall" onClick={() => setRecall(away)}>
                  Zurückrufen
                </button>
              )}
            </div>
          )
        })}
      </div>
      {recall && (
        <div className="news">
          <div className="confirm">
            <h2 className="confirm-title">Trupp zurückrufen?</h2>
            <p className="confirm-text">Der Trupp aus der {areaById(recall.area).name} kommt sofort heim, aber ohne Beute. Danach sind alle seine Monster wieder wählbar.</p>
            <button
              className="news-btn red"
              onClick={() => {
                onRecall(recall)
                setRecall(null)
              }}
            >
              Zurückrufen
            </button>
            <button className="btn" onClick={() => setRecall(null)}>
              Doch nicht
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

// Arenaleiter der Woche als kleine Karte mit Tipp, welches Element hilft.
function LeaderMini({ leader, level }: { leader: Leader; level: number }) {
  const [a, b] = leaderColors(leader.elements)
  const help = leader.elements.includes('ohne') ? [] : counters(leader)
  return (
    <div className="leader-mini" style={{ background: `linear-gradient(140deg, ${a}, ${b})` }}>
      <img src={leaderImg(leader)} alt="" />
      <span className="t">
        <span className="k">ARENALEITER DER WOCHE</span>
        <b>{leader.name}</b>
        <span className="tip">
          {help.map((e) => (
            <Dot key={e} e={e} size={18} />
          ))}
          {help.length ? `${help.map((e) => ELEMENTS[e].name).join(' und ')} hilft` : 'ohne Element'} · Team Lv {level > 30 ? '30+' : level}
        </span>
      </span>
    </div>
  )
}

// Event dieser Woche als Plakette neben „Neue Woche“: Name, ab wann bzw. bis wann, Bonus-Element.
function WeekEvent({ now }: { now: Date }) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
  const w = weekEvent(monday)
  if (!w) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekday = (d: Date) => d.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '')
  const when = w.day <= today ? `bis ${weekday(w.end)}` : `ab ${weekday(w.day)}`
  return (
    <span className="week-event" aria-label={`${EVENT_LABEL[w.event]} ${when}: ${ELEMENTS[w.bonus].name} +50 % XP`}>
      {EVENT_LABEL[w.event]} {when} · <Dot e={w.bonus} size={18} />
      +50 %
    </span>
  )
}
