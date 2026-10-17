// Startbildschirm: Manga-Fortschrittspanel, eure Monster und die Aufgabenliste.
import { AnimatePresence, motion } from 'motion/react'
import { useRef, type RefObject } from 'react'
import { attack } from './fx'
import { ElementIcon } from './ElementIcon'
import { ELEMENTS, MAX_LEVEL, MONSTERS, PEOPLE, backdrop, daysUntilDue, dueLabel, intervalLabel, levelFor, monsterById, stageFor, xpFor, xpForLevel, type Person } from './game'
import { PEDIA_ORDER, discoveredCount, isDiscovered } from './pedia'
import type { Completion, Snapshot, Task } from './db'

const SOON_DAYS = 7

type Row = { task: Task; days: number; done?: Completion }

type Props = {
  snap: Snapshot
  person: Person
  now: Date
  live: boolean
  onToggle: (row: Row) => void
  onAttackEnd: () => void
  onIntervals: () => void
  onPedia: () => void
}

export type { Row }

export function Home({ snap, person, now, live, onToggle, onAttackEnd, onIntervals, onPedia }: Props) {
  const myBadge = useRef<HTMLSpanElement>(null)
  const busy = useRef(false)
  const rows: Row[] = snap.tasks.map((task) => ({
    task,
    days: daysUntilDue(snap.lastDone[task.id] ?? null, task.interval_days, now, task.first_due),
    done: snap.today.findLast((c) => c.task_id === task.id),
  }))
  const today = rows.filter((r) => r.done || r.days <= 0).sort((a, b) => Number(!!a.done) - Number(!!b.done) || a.days - b.days)
  const soon = rows.filter((r) => !r.done && r.days > 0 && r.days <= SOON_DAYS).sort((a, b) => a.days - b.days)
  const doneCount = today.filter((r) => r.done).length
  const pct = today.length ? Math.round((doneCount / today.length) * 100) : 100
  const other: Person = person === 'adrian' ? 'ulrike' : 'adrian'
  const myPick = snap.picks.find((p) => p.person === person)

  // Offene Aufgabe: erst greift dein Monster an, beim Treffer wird sie abgehakt. Erledigte: sofort rückgängig.
  const toggle = async (row: Row, dot: HTMLElement) => {
    if (busy.current) return
    const badge = myBadge.current
    if (row.done || !myPick || !badge) return onToggle(row)
    busy.current = true
    const m = monsterById(myPick.monster)
    try {
      await attack({
        from: badge.querySelector('img')!,
        to: dot,
        bar: badge.parentElement!.querySelector('.xpbar')!,
        src: m.files[stageFor(levelFor(snap.monsterXp[m.id] ?? 0))],
        element: m.element,
        taskElement: row.task.element,
        xp: xpFor(row.task.effort, row.task.element, m.element),
        onHit: () => onToggle(row),
      })
    } finally {
      busy.current = false
      onAttackEnd()
    }
  }

  return (
    <main className="screen">
      <header className="home-head">
        <div className="col">
          <span className="kicker">{now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }).toUpperCase()}</span>
          <h1 className="title">
            Team
            <br />
            <span className="accent">Glanzwerk</span>
          </h1>
        </div>
        <button className="gear" onClick={onIntervals} aria-label="Intervalle">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </button>
      </header>

      <div className="panel">
        <div className="water" style={{ height: `${Math.max(pct, 8)}%` }}>
          <div className="tone2" aria-hidden="true" />
          <div className="wave-box" aria-hidden="true">
            <svg className="wave" width="100%" height="16" viewBox="0 0 800 16" preserveAspectRatio="none">
              <path d="M0 9 Q25 0 50 9 T100 9 T150 9 T200 9 T250 9 T300 9 T350 9 T400 9 T450 9 T500 9 T550 9 T600 9 T650 9 T700 9 T750 9 T800 9 V16 H0 Z" fill="#3EC1F3" stroke="#1B1530" strokeWidth="3" />
            </svg>
          </div>
        </div>
        <div className="panel-content">
          <span className="pct">{pct}%</span>
          <span className="bubble">
            {today.length === 0 ? 'Heute ist nichts fällig.' : `${doneCount} von ${today.length} besiegt.`}
            <br />
            {pct === 100 ? 'Alles glänzt!' : 'Weiter so, Team!'}
          </span>
        </div>
      </div>

      <div className="team">
        {[person, other].map((p) => (
          <MonsterBadge key={p} person={p} snap={snap} imgRef={p === person ? myBadge : undefined} />
        ))}
      </div>

      <PediaBanner snap={snap} onClick={onPedia} />

      <TaskSection title="Heute" rows={today} onToggle={toggle} />
      {soon.length > 0 && <TaskSection title="Demnächst" rows={soon} onToggle={toggle} />}

      <footer className="live">
        <span className={`live-dot ${live ? 'on' : ''}`} />
        <span>{live ? 'Live verbunden' : 'Verbinde …'}</span>
      </footer>
    </main>
  )
}

function MonsterBadge({ person, snap, imgRef }: { person: Person; snap: Snapshot; imgRef?: RefObject<HTMLSpanElement | null> }) {
  const pick = snap.picks.find((p) => p.person === person)
  if (!pick) {
    return (
      <div className="badge">
        <span className="badge-img empty" />
        <span className="badge-text">
          <b>{PEOPLE[person]}</b>
          <small>wählt noch</small>
        </span>
      </div>
    )
  }
  const m = monsterById(pick.monster)
  const xp = snap.monsterXp[m.id] ?? 0
  const level = levelFor(xp)
  const stage = stageFor(level)
  const from = xpForLevel(level)
  const progress = level === MAX_LEVEL ? 1 : (xp - from) / (xpForLevel(level + 1) - from)
  return (
    <div className="badge">
      <span ref={imgRef} className="badge-img" style={{ background: backdrop(m.element), color: ELEMENTS[m.element].strong }}>
        <img src={m.files[stage]} alt="" />
      </span>
      <span className="badge-text">
        <b>{PEOPLE[person]}</b>
        <small>
          Lv {level} · {m.stages[stage]}
        </small>
        <span className="xpbar">
          <span style={{ width: `${progress * 100}%`, background: ELEMENTS[m.element].strong }} />
        </span>
      </span>
    </div>
  )
}

// Großer Einstieg ins Pedia: eure zwei stärksten Monster und eine Silhouette als Lockruf.
function PediaBanner({ snap, onClick }: { snap: Snapshot; onClick: () => void }) {
  const xp = (id: string) => snap.monsterXp[id] ?? 0
  const top = [...MONSTERS].sort((a, b) => xp(b.id) - xp(a.id)).slice(0, 2)
  const shown = (id: string) => [2, 1, 0].find((s) => isDiscovered(snap.seen, id, s))!
  const hidden = PEDIA_ORDER.flatMap((m) => [1, 2].filter((s) => !isDiscovered(snap.seen, m.id, s)).map((s) => m.files[s]))[0]
  return (
    <button className="pedia-banner" onClick={onClick}>
      <span className="pb-text">
        <span className="pb-kicker">Euer Monsterbuch</span>
        <span className="pb-title">Putzy-Pedia</span>
        <span className="pb-sub">{discoveredCount(snap.seen)} von {MONSTERS.length * 3} entdeckt</span>
      </span>
      <span className="pb-mons" aria-hidden="true">
        {top.map((m) => (
          <img key={m.id} src={m.files[shown(m.id)]} alt="" />
        ))}
        {hidden && <img className="sil" src={hidden} alt="" />}
      </span>
      <span className="pb-go" aria-hidden="true">
        ›
      </span>
    </button>
  )
}

function TaskSection({ title, rows, onToggle }: { title: string; rows: Row[]; onToggle: (r: Row, dot: HTMLElement) => void }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      <AnimatePresence initial={false}>
        {rows.map((r, i) => (
          <motion.button
            key={r.task.id}
            layout
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0, transition: { type: 'spring', bounce: 0.45, delay: Math.min(i, 8) * 0.04 } }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`row ${r.done ? 'is-done' : ''}`}
            aria-pressed={!!r.done}
            onClick={(e) => onToggle(r, e.currentTarget.querySelector('.dot')!)}
          >
            <span className="dot" style={{ background: ELEMENTS[r.task.element].soft }}>
              <ElementIcon element={r.task.element} />
            </span>
            <span className="row-text">
              <span className="row-name">{r.task.name}</span>
              <span className="row-meta">
                {r.task.room} · {intervalLabel(r.task.interval_days)}
              </span>
            </span>
            <span className="row-due">{r.done ? `${PEOPLE[r.done.person]} ✓` : dueLabel(r.days)}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </section>
  )
}
