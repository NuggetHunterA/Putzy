// Putzy-Pedia: Übersicht aller Reihen und Detailseite mit Infos, die alle 5 Level freigeschaltet werden.
import { Fragment, useState } from 'react'
import type { Snapshot } from './db'
import { ElementIcon } from './ElementIcon'
import { ELEMENTS, MAX_LEVEL, MONSTERS, PEOPLE, STAGE_LEVELS, backdrop, levelFor, xpForLevel, type Monster, type Person } from './game'
import { PEDIA, PEDIA_ORDER, UNLOCK, dexNo, discoveredCount, isDiscovered } from './pedia'

type Props = {
  snap: Snapshot
  onBack: () => void
  onReplay: (m: Monster, stage: number) => void
}

const STAGES = [0, 1, 2]
const fmt = (n: number) => n.toLocaleString('de-DE')

export function Pedia({ snap, onBack, onReplay }: Props) {
  const [open, setOpen] = useState<Monster | null>(null)
  const show = (m: Monster | null) => {
    setOpen(m)
    window.scrollTo(0, 0)
  }
  if (open) return <Detail m={open} snap={snap} onBack={() => show(null)} onReplay={onReplay} />

  const found = discoveredCount(snap.seen)
  const total = MONSTERS.length * 3
  return (
    <main className="screen">
      <div className="bar">
        <button className="btn back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <h1 className="bar-title">Putzy-Pedia</h1>
      </div>
      <div className="dex-count">
        {found} von {total} entdeckt
        <span className="xpbar">
          <span style={{ width: `${(found / total) * 100}%`, background: 'var(--accent)' }} />
        </span>
      </div>
      {PEDIA_ORDER.map((m) => {
        const level = levelFor(snap.monsterXp[m.id] ?? 0)
        return (
          <button key={m.id} className={`dex-card ${level === MAX_LEVEL ? 'gold' : ''}`} onClick={() => show(m)}>
            <span className="dex-top">
              #{dexNo(m, 0)}–{dexNo(m, 2)}
              <Element m={m} />
              <span className="lv">{level === MAX_LEVEL ? 'Lv 30 · MAX ★' : `Lv ${level}`}</span>
            </span>
            <span className="dex-line">
              {STAGES.map((s) => (
                <Fragment key={s}>
                  {s > 0 && <span className="arrow">›</span>}
                  <Slot m={m} stage={s} snap={snap} hint />
                </Fragment>
              ))}
            </span>
          </button>
        )
      })}
    </main>
  )
}

function Element({ m }: { m: Monster }) {
  return (
    <span className="dex-el" style={{ background: ELEMENTS[m.element].soft }}>
      <ElementIcon element={m.element} size={14} />
      {ELEMENTS[m.element].name}
    </span>
  )
}

// Eine Stufe als Kreis: entdeckt in Farbe, sonst schwarze Silhouette mit „???“.
function Slot({ m, stage, snap, hint }: { m: Monster; stage: number; snap: Snapshot; hint?: boolean }) {
  const found = isDiscovered(snap.seen, m.id, stage)
  return (
    <span className="slot">
      <span className={`slot-img ${found ? '' : 'hidden'}`} style={found ? { background: backdrop(m.element) } : undefined}>
        <img src={m.files[stage]} alt="" />
      </span>
      <b>{found ? m.stages[stage] : '???'}</b>
      {hint && !found && <small>ab Lv {STAGE_LEVELS[stage - 1]}</small>}
    </span>
  )
}

function Detail({ m, snap, onBack, onReplay }: { m: Monster; snap: Snapshot; onBack: () => void; onReplay: Props['onReplay'] }) {
  const known = STAGES.filter((s) => isDiscovered(snap.seen, m.id, s))
  const [stage, setStage] = useState(known[known.length - 1])
  const xp = snap.monsterXp[m.id] ?? 0
  const level = levelFor(xp)
  const max = level === MAX_LEVEL
  const progress = max ? 1 : (xp - xpForLevel(level)) / (xpForLevel(level + 1) - xpForLevel(level))
  const done = snap.tasksDone[m.id] ?? {}
  const people = Object.keys(PEOPLE) as Person[]
  const tasks = people.reduce((n, p) => n + (done[p] ?? 0), 0)
  const share = (p: Person) => (tasks ? Math.round(((done[p] ?? 0) / tasks) * 100) : 0)
  const e = PEDIA[m.id]

  // Infoblöcke und Stufen in Level-Reihenfolge; Gesperrtes als Schloss-Zeile.
  const blocks = [
    { at: UNLOCK.facts, title: 'Steckbrief', body: <Facts e={e} stage={stage} /> },
    { at: STAGE_LEVELS[0], title: 'Stufe 2', stage: 1 },
    { at: UNLOCK.entry, title: 'Pedia-Eintrag', body: <p>{e.text}</p> },
    {
      at: UNLOCK.quirk,
      title: 'Eigenart',
      body: (
        <span className="likes">
          <span>
            <small>Mag</small>
            {e.likes}
          </span>
          <span>
            <small>Mag gar nicht</small>
            {e.dislikes}
          </span>
        </span>
      ),
    },
    { at: STAGE_LEVELS[1], title: 'Stufe 3', stage: 2 },
    { at: UNLOCK.legend, title: '★ Legende', body: <p>{e.legend}</p>, legend: true },
  ]

  return (
    <main className="screen">
      <div className="bar">
        <button className="btn back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <span className="kicker">
          PUTZY-PEDIA · #{dexNo(m, 0)}–{dexNo(m, 2)}
        </span>
      </div>
      <div className="stages">
        {STAGES.map((s) => (
          <Fragment key={s}>
            {s > 0 && <span className="arrow">›</span>}
            <button className={`stage-btn ${s === stage ? 'sel' : ''}`} disabled={!known.includes(s)} onClick={() => setStage(s)}>
              <Slot m={m} stage={s} snap={snap} />
            </button>
          </Fragment>
        ))}
      </div>
      <div className={`detail-hero ${max ? 'gold' : ''}`} style={{ background: backdrop(m.element) }}>
        <span className="chip">{ELEMENTS[m.element].name}</span>
        <span className="dex-no">#{dexNo(m, stage)}</span>
        <img src={m.files[stage]} alt={m.stages[stage]} />
      </div>
      <div className="col">
        <h2 className="detail-name">{m.stages[stage]}</h2>
        <span className="detail-sub">Attacke: {m.move}</span>
      </div>
      <div className="lvbox">
        <span className="lvrow">
          <span className="big">{max ? 'Level 30 · MAX ★' : `Level ${level}`}</span>
          <span>{max ? `${fmt(xp)} XP` : `${fmt(xp)} / ${fmt(xpForLevel(level + 1))} XP`}</span>
        </span>
        <span className="xpbar">
          <span style={{ width: `${progress * 100}%`, background: max ? 'var(--sun)' : ELEMENTS[m.element].strong }} />
        </span>
        <span className="lvrow">
          <span>{tasks === 1 ? '1 Aufgabe' : `${tasks} Aufgaben`}</span>
          {tasks > 0 && <span>{people.map((p) => `${PEOPLE[p]} ${share(p)} %`).join(' · ')}</span>}
        </span>
        {tasks > 0 && (
          <span className="split">
            {people.map((p, i) => (
              <span key={p} style={{ width: `${share(p)}%`, background: i === 0 ? ELEMENTS[m.element].strong : 'var(--accent)' }} />
            ))}
          </span>
        )}
      </div>
      <div className="replays">
        {[1, 2].map((s) =>
          known.includes(s) ? (
            <button key={s} className="btn" onClick={() => onReplay(m, s)}>
              ▶ Entwicklung {s}→{s + 1}
            </button>
          ) : (
            <button key={s} className="btn" disabled>
              🔒 {s}→{s + 1} ab Lv {STAGE_LEVELS[s - 1]}
            </button>
          ),
        )}
      </div>
      {blocks.map((b) => {
        if (b.stage !== undefined) {
          return known.includes(b.stage) ? null : <Locked key={b.title} title={b.title} at={b.at} />
        }
        if (level < b.at) return <Locked key={b.title} title={b.title} at={b.at} />
        return (
          <section key={b.title} className={`info ${b.legend ? 'legend' : ''}`}>
            <h3>
              {b.title} <span>LV {b.at}</span>
            </h3>
            {b.body}
          </section>
        )
      })}
    </main>
  )
}

function Facts({ e, stage }: { e: (typeof PEDIA)[string]; stage: number }) {
  return (
    <span className="facts">
      <span className="fact">
        <small>Größe</small>
        <b>{e.sizes[stage]}</b>
      </span>
      <span className="fact">
        <small>Gewicht</small>
        <b>{e.weights[stage]}</b>
      </span>
      <span className="fact">
        <small>Liebt</small>
        <b>{e.room}</b>
      </span>
    </span>
  )
}

function Locked({ title, at }: { title: string; at: number }) {
  return (
    <div className="locked">
      <span aria-hidden="true">🔒</span> {title.replace('★ ', '')}
      <em>ab Lv {at}</em>
    </div>
  )
}
