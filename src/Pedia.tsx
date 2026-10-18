// Putzy-Pedia: Übersicht aller Reihen und Detailseite mit Infos, die alle 5 Level freigeschaltet werden.
import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { useBack } from './back'
import type { Snapshot } from './db'
import { ElementIcon } from './ElementIcon'
import { ELEMENTS, MAX_LEVEL, PEOPLE, backdrop, levelFor, monsterById, stageFor, xpForLevel, type Monster, type Person } from './game'
import { PEDIA, PEDIA_ORDER, UNLOCK, dexNo, dexTotal, discoveredCount, isDiscovered, lastStage, monsterStats, type Stats } from './pedia'

type Props = {
  snap: Snapshot
  // Nur sichtbare Monster, geheime Reihen erst nach ihrer Freischaltung.
  monsters: Monster[]
  onBack: () => void
  onReplay: (m: Monster, stage: number) => void
  onWeeks: () => void
}

// Stufen als Spalten: Slot, Pfeil, Slot … für 2 bis 4 Stufen.
const stagesOf = (m: Monster) => m.stages.map((_, s) => s)
const stageGrid = (m: Monster) => ({ gridTemplateColumns: `repeat(${m.stages.length - 1}, 1fr auto) 1fr` })
const fmt = (n: number) => n.toLocaleString('de-DE')

export function Pedia({ snap, monsters, onBack, onReplay, onWeeks }: Props) {
  useBack(onBack)
  const [open, setOpen] = useState<Monster | null>(null)
  if (open) return <Detail m={open} snap={snap} onBack={() => setOpen(null)} onReplay={onReplay} />

  const found = discoveredCount(snap.seen, monsters)
  const total = dexTotal(monsters)
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
      <button className="wr-entry" onClick={onWeeks}>
        <span className="wr-pair">
          {snap.picks.map((p) => {
            const m = monsterById(p.monster)
            return (
              <span key={p.person} className="wr-old" style={{ background: backdrop(m.element) }}>
                <img src={m.files[stageFor(m, levelFor(snap.monsterXp[m.id] ?? 0))]} alt="" />
              </span>
            )
          })}
        </span>
        <span>
          <b>Wochenrückblicke</b>
          <small>Diese Woche bisher und alle alten Wochen</small>
        </span>
        <span className="go">›</span>
      </button>
      {PEDIA_ORDER.filter((m) => monsters.includes(m)).map((m) => {
        const level = levelFor(snap.monsterXp[m.id] ?? 0)
        return (
          <button key={m.id} className={`dex-card ${level === MAX_LEVEL ? 'gold' : ''}`} onClick={() => setOpen(m)}>
            <span className="dex-top">
              #{dexNo(m, 0)}–{dexNo(m, lastStage(m))}
              <Element m={m} />
              <span className="lv">{level === MAX_LEVEL ? 'Lv 30 · MAX ★' : `Lv ${level}`}</span>
            </span>
            <span className={`dex-line ${m.stages.length > 3 ? 'many' : ''}`} style={stageGrid(m)}>
              {stagesOf(m).map((s) => (
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
      {hint && !found && <small>ab Lv {m.levels[stage - 1]}</small>}
    </span>
  )
}

function Detail({ m, snap, onBack, onReplay }: { m: Monster; snap: Snapshot; onBack: () => void; onReplay: Props['onReplay'] }) {
  useBack(onBack)
  useEffect(() => window.scrollTo(0, 0), [])
  const known = stagesOf(m).filter((s) => isDiscovered(snap.seen, m.id, s))
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

  // Infoblöcke und Stufen in Level-Reihenfolge, bei gleichem Level die Stufe zuerst; Gesperrtes als Schloss-Zeile.
  const stageBlocks = m.levels.map((at, i) => ({ at, title: `Stufe ${i + 2}`, stage: i + 1 }))
  const infoBlocks = [
    { at: UNLOCK.facts, title: 'Steckbrief', body: <Facts e={e} stage={stage} stats={monsterStats(snap.done, m.id, snap.tasks)} /> },
    { at: UNLOCK.entry, title: 'Pedia-Eintrag', body: <p>{e.text[stage]}</p> },
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
    { at: UNLOCK.legend, title: '★ Legende', body: <p>{e.legend}</p>, legend: true },
  ]
  const blocks: { at: number; title: string; stage?: number; body?: ReactNode; legend?: boolean }[] = [...stageBlocks, ...infoBlocks].sort((a, b) => a.at - b.at)

  return (
    <main className="screen">
      <div className="bar">
        <button className="btn back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <span className="kicker">
          PUTZY-PEDIA · #{dexNo(m, 0)}–{dexNo(m, lastStage(m))}
        </span>
      </div>
      <div className={`stages ${m.stages.length > 3 ? 'many' : ''}`} style={stageGrid(m)}>
        {stagesOf(m).map((s) => (
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
        {m.levels.map((_, i) => i + 1).map((s) =>
          known.includes(s) ? (
            <button key={s} className="btn" onClick={() => onReplay(m, s)}>
              ▶ Entwicklung {s}→{s + 1}
            </button>
          ) : (
            <button key={s} className="btn" disabled>
              🔒 {s}→{s + 1} ab Lv {m.levels[s - 1]}
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

function Facts({ e, stage, stats }: { e: (typeof PEDIA)[string]; stage: number; stats: Stats }) {
  const since = stats.since?.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', year: '2-digit' })
  return (
    <>
      <span className="facts">
        <Fact label="Größe" value={e.sizes[stage]} />
        <Fact label="Gewicht" value={e.weights[stage]} />
        <Fact label="Liebt" value={e.room} />
      </span>
      <span className="compare">{e.compare[stage]}</span>
      <span className="stats">
        <small>Eure Werte</small>
        <span>
          Lieblingsaufgabe
          <b>
            {stats.favorite?.name ?? '–'}
            {stats.favorite && <em>{stats.favorite.tasks}-mal erledigt</em>}
          </b>
        </span>
        <span>
          Dabei seit <b>{since ?? '–'}</b>
        </span>
        <span>
          Rekordwoche <b>{stats.record ? `${stats.record.tasks} Aufgaben · KW ${stats.record.week}` : '–'}</b>
        </span>
      </span>
    </>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span className="fact">
      <small>{label}</small>
      <b>{value}</b>
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
