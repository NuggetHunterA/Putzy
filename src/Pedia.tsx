// Putzy-Pedia: Übersicht aller Reihen und Detailseite mit Infos, die alle 5 Level freigeschaltet werden.
import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { useBack } from './back'
import type { Snapshot } from './db'
import { eggCost, eggFile, eggName, eventEgg, waiting, type Egg } from './eggs'
import { EVENT_LABEL } from './events'
import { ElementIcon } from './ElementIcon'
import { ELEMENTS, MAX_LEVEL, PEOPLE, backdrop, elementsOf, levelFor, monsterById, stageFor, xpForLevel, type Monster, type Person } from './game'
import { Sponge } from './Sponge'
import { StampMark } from './StampMark'
import { tilt } from './Stamps'
import { stamps } from './stamps'
import { PEDIA, PEDIA_ORDER, UNLOCK, dexNo, dexTotal, discoveredCount, isDiscovered, lastStage, listStages, monsterStats, type DexFilter, type Stats } from './pedia'

type Props = {
  snap: Snapshot
  // Nur sichtbare Monster, geheime Reihen erst nach ihrer Freischaltung.
  monsters: Monster[]
  // Streak-Punkte auf dem gemeinsamen Konto, zum Ausbrüten.
  points: number
  onHatch: (e: Egg) => void
  onBack: () => void
  onReplay: (m: Monster, stage: number) => void
  onWeeks: () => void
  // Stempelheft: Anzahl der Stempel seit dem letzten Öffnen.
  stampsNew: number
  onStamps: () => void
}

// Stufen als Spalten: Slot, Pfeil, Slot … für 2 bis 4 Stufen.
const stagesOf = (m: Monster) => m.stages.map((_, s) => s)
const stageGrid = (m: Monster) => ({ gridTemplateColumns: `repeat(${m.stages.length - 1}, 1fr auto) 1fr` })
const fmt = (n: number) => n.toLocaleString('de-DE')
// Welche Ansicht zuletzt offen war, „liste“ oder „reihen“.
const VIEW_STORAGE = 'putzy.pediaView'
const FILTERS: DexFilter[] = ['alle', 'wasser', 'feuer', 'natur', 'luft', 'licht', 'ohne']

export function Pedia({ snap, monsters, points, onHatch, onBack, onReplay, onWeeks, stampsNew, onStamps }: Props) {
  useBack(onBack)
  const [open, setOpen] = useState<{ m: Monster; stage?: number } | null>(null)
  const [hatch, setHatch] = useState<Egg | null>(null)
  const [list, setList] = useState(() => localStorage.getItem(VIEW_STORAGE) === 'liste')
  const [filter, setFilter] = useState<DexFilter>('alle')
  if (open) return <Detail m={open.m} start={open.stage} snap={snap} onBack={() => setOpen(null)} onReplay={onReplay} />

  const all = stamps(snap.tasks, snap.stamps)
  // Neuester Stempel als Bild auf der Kachel, solange keiner verdient ist ein offener.
  const newest = [...snap.stamps].sort((a, b) => b.earned_at.localeCompare(a.earned_at))[0]
  const latest = all.find((s) => s.id === newest?.id)
  const showList = (on: boolean) => {
    setList(on)
    localStorage.setItem(VIEW_STORAGE, on ? 'liste' : 'reihen')
  }
  const shown = list ? listStages(monsters, snap.monsterXp, filter) : []
  const filtered = list && filter !== 'alle'
  const found = filtered ? shown.filter((s) => isDiscovered(snap.seen, s.m.id, s.stage)).length : discoveredCount(snap.seen, monsters)
  const total = filtered ? shown.length : dexTotal(monsters)
  return (
    <main className="screen">
      <div className="bar">
        <button className="btn back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <h1 className="bar-title">Putzy-Pedia</h1>
        <span className="bank" aria-label={`${points} Streak-Punkte`}>
          <Sponge size={30} />
          {points}
        </span>
      </div>
      <div className="pd-pair">
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
          <b>Wochen</b>
          <small>Rückblick</small>
        </span>
      </button>
      <button className="wr-entry sh-entry" onClick={onStamps}>
        {latest && <StampMark stamp={latest} size={44} tilt={tilt(latest.id)} />}
        <span>
          <b>Stempelheft</b>
          <small>
            {snap.stamps.length} von {all.length}
          </small>
        </span>
        {stampsNew > 0 && <span className="sh-new">{stampsNew} neu</span>}
      </button>
      </div>
      {waiting(snap.eggs).length > 0 && (
        <>
          <h2 className="section-title">Nest</h2>
          {waiting(snap.eggs).map((e) => (
            <EggCard key={e.monster} egg={e} points={points} onHatch={() => setHatch(e)} />
          ))}
          <h2 className="section-title">Monster</h2>
        </>
      )}
      <div className="seg two">
        <button className={list ? '' : 'on'} onClick={() => showList(false)}>
          Reihen
        </button>
        <button className={list ? 'on' : ''} onClick={() => showList(true)}>
          Liste
        </button>
      </div>
      {list && (
        <div className="el-filter">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={f === filter ? 'on' : ''}
              style={f === 'alle' ? undefined : { background: f === filter ? ELEMENTS[f].soft : undefined }}
              aria-label={f === 'alle' ? undefined : ELEMENTS[f].name}
              aria-pressed={f === filter}
              onClick={() => setFilter(f)}
            >
              {f === 'alle' ? 'Alle' : <ElementIcon element={f} size={16} />}
            </button>
          ))}
        </div>
      )}
      <div className="dex-count">
        {filtered && `${ELEMENTS[filter].name}: `}
        {found} von {total} entdeckt
        <span className="xpbar">
          <span style={{ width: `${total ? (found / total) * 100 : 0}%`, background: 'var(--accent)' }} />
        </span>
      </div>
      {list && (
        <div className="dex-grid">
          {shown.map(({ m, stage, elements }) => {
            const known = isDiscovered(snap.seen, m.id, stage)
            const gold = levelFor(snap.monsterXp[m.id] ?? 0) === MAX_LEVEL
            return (
              <button key={`${m.id}-${stage}`} className={`dex-tile ${gold ? 'gold' : ''}`} onClick={() => setOpen({ m, stage })}>
                <span className={`slot-img ${known ? '' : 'hidden'}`} style={known ? { background: backdrop(m.element) } : undefined}>
                  <img src={m.files[stage]} alt="" />
                </span>
                <span className="dex-tile-no">
                  #{dexNo(m, stage)}
                  {elements.map((e) => (
                    <span key={e} className="dex-tile-el" style={{ background: ELEMENTS[e].soft }} aria-label={ELEMENTS[e].name}>
                      <ElementIcon element={e} size={11} />
                    </span>
                  ))}
                </span>
                <b>{known ? m.stages[stage] : '???'}</b>
              </button>
            )
          })}
        </div>
      )}
      {!list && PEDIA_ORDER.filter((m) => monsters.includes(m)).map((m) => {
        const level = levelFor(snap.monsterXp[m.id] ?? 0)
        return (
          <button key={m.id} className={`dex-card ${level === MAX_LEVEL ? 'gold' : ''}`} onClick={() => setOpen({ m })}>
            <span className="dex-top">
              #{dexNo(m, 0)}–{dexNo(m, lastStage(m))}
              <Element m={m} xp={snap.monsterXp[m.id] ?? 0} />
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
      {hatch && (
        <HatchConfirm
          egg={hatch}
          points={points}
          onHatch={() => {
            setHatch(null)
            onHatch(hatch)
          }}
          onCancel={() => setHatch(null)}
        />
      )}
    </main>
  )
}

// Wartendes Ei: Bild, Element, Name und Knopf zum Ausbrüten (grau mit fehlenden Punkten, solange es nicht reicht).
function EggCard({ egg, points, onHatch }: { egg: Egg; points: number; onHatch: () => void }) {
  const m = monsterById(egg.monster)
  const cost = eggCost(m.id)
  return (
    <div className="egg-card">
      <span className="egg-card-img" style={{ background: `radial-gradient(circle at 50% 40%, #fff 0 30%, ${ELEMENTS[m.element].soft} 80%)` }}>
        <img src={eggFile(m.id)} alt="" />
      </span>
      <span className="egg-card-body">
        <span className="dex-top">
          <Element m={m} />
        </span>
        <b className="egg-card-name">{eggName(m)}</b>
        {points >= cost ? (
          <button className="btn egg-card-btn" onClick={onHatch}>
            Ausbrüten · {cost}
          </button>
        ) : (
          <span className="btn egg-card-btn off">
            {cost} Punkte · noch {cost - points}
          </span>
        )}
      </span>
    </div>
  )
}

function HatchConfirm({ egg, points, onHatch, onCancel }: { egg: Egg; points: number; onHatch: () => void; onCancel: () => void }) {
  useBack(onCancel)
  const m = monsterById(egg.monster)
  const cost = eggCost(m.id)
  return (
    <div className="news">
      <div className="confirm">
        <img className="confirm-egg" src={eggFile(m.id)} alt="" />
        <h2 className="confirm-title">{eggName(m)} ausbrüten?</h2>
        <p className="confirm-text">
          Das kostet {cost} Streak-Punkte von eurem gemeinsamen Konto ({points}). Danach bleiben {points - cost}.
        </p>
        <button className="news-btn" onClick={onHatch}>
          Ausbrüten!
        </button>
        <button className="btn" onClick={onCancel}>
          Noch nicht
        </button>
      </div>
    </div>
  )
}

// Element-Chip; mit xp ab der Endstufe auch das Zweitelement, dann nur als Symbole, damit die Zeile auf schmale Handys passt.
function Element({ m, xp = 0 }: { m: Monster; xp?: number }) {
  const [main, second] = elementsOf(m, xp)
  return (
    <span className="dex-el" style={{ background: ELEMENTS[main].soft }} aria-label={second && `${ELEMENTS[main].name} + ${ELEMENTS[second].name}`}>
      <ElementIcon element={main} size={14} />
      {second ? (
        <>
          +<ElementIcon element={second} size={14} />
        </>
      ) : (
        ELEMENTS[main].name
      )}
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

// start: Stufe, die vorausgewählt sein soll (aus der Listenansicht); unentdeckt oder ohne Angabe die letzte entdeckte.
function Detail({ m, start, snap, onBack, onReplay }: { m: Monster; start?: number; snap: Snapshot; onBack: () => void; onReplay: Props['onReplay'] }) {
  useBack(onBack)
  // Geschweifte Klammern: Neuere Browser geben bei scrollTo ein Promise zurück, React hielte es sonst für die Aufräumfunktion.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  const known = stagesOf(m).filter((s) => isDiscovered(snap.seen, m.id, s))
  const [stage, setStage] = useState(start !== undefined && known.includes(start) ? start : known[known.length - 1])
  const xp = snap.monsterXp[m.id] ?? 0
  const level = levelFor(xp)
  const max = level === MAX_LEVEL
  const progress = max ? 1 : (xp - xpForLevel(level)) / (xpForLevel(level + 1) - xpForLevel(level))
  const done = snap.tasksDone[m.id] ?? {}
  const people = Object.keys(PEOPLE) as Person[]
  const tasks = people.reduce((n, p) => n + (done[p] ?? 0), 0)
  const share = (p: Person) => (tasks ? Math.round(((done[p] ?? 0) / tasks) * 100) : 0)
  const e = PEDIA[m.id]
  // Event-Monster: aus welchem Event und Jahr das Ei stammt.
  const event = eventEgg(m.id)
  const eventEggFound = event && snap.eggs.find((x) => x.monster === m.id)
  const origin = eventEggFound && `Von ${EVENT_LABEL[event].replace(/^\S+ /, '')} ${eventEggFound.found_at.slice(0, 4)}`

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
        <span className="chips">
          <span className="chip">{elementsOf(m, xp).map((e) => ELEMENTS[e].name).join(' + ')}</span>
          {origin && <span className="chip">{origin}</span>}
          {m.second && stageFor(m, level) < m.levels.length && (
            <span className="chip later">
              + {ELEMENTS[m.second].name} ab Lv {m.levels[m.levels.length - 1]}
            </span>
          )}
        </span>
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
