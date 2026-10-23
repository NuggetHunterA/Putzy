// Expeditionen: Karte des Hauses mit allen Gebieten, laufende Trupps, Logbuch und Fruchtkorb.
// Offenes Gebiet antippen: Trupp zusammenstellen. Gesperrtes Gebiet antippen: Blatt mit der genauen Bedingung.
import { useRef, useState, type ReactNode } from 'react'
import { useBack } from './back'
import type { Snapshot } from './db'
import { ElementIcon } from './ElementIcon'
import {
  FRUITS, FRUIT_ORDER, UNLOCK_TIER, areaById, awayMonsters, basket, blocked, canFeed, canStart, fruitCap, isAway, isOpen, mapAreas, odds,
  truppSlots, type Area, type Expedition, type Fruit,
} from './expeditions'
import { burst, flyTo } from './fx'
import { ELEMENTS, PEOPLE, backdrop, levelFor, monsterById, stageFor, xpForLevel, type Monster, type MonsterElement } from './game'

type Props = {
  snap: Snapshot
  monsters: Monster[]
  now: Date
  onBack: () => void
  onStart: (area: Area, trupp: Monster[]) => void
  onRecall: (e: Expedition) => void
  onFeed: (m: Monster, fruit: Fruit) => void
}

export const fruitImg = (f: Fruit) => `/expedition/frucht-${f}.webp`
const imgOf = (m: Monster, xp: number) => m.files[stageFor(m, levelFor(xp))]
const clock = (d: Date) => d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

export function left(ends: Date, now: Date) {
  const min = Math.max(1, Math.ceil((ends.getTime() - now.getTime()) / 60_000))
  return min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min` : `${min} min`
}

export function Expeditions({ snap, monsters, now, onBack, onStart, onRecall, onFeed }: Props) {
  useBack(onBack)
  const [sheet, setSheet] = useState<Area | null>(null)
  const [picking, setPicking] = useState<Area | null>(null)
  const [feeding, setFeeding] = useState(false)
  const [recall, setRecall] = useState<Expedition | null>(null)
  const xp = snap.monsterXp
  const away = snap.expeditions.filter((e) => isAway(e, now))
  const slots = truppSlots(monsters, xp)
  const fruits = basket(snap.expeditions, snap.feedings, now)

  if (picking) return <TruppPick area={picking} snap={snap} monsters={monsters} now={now} free={slots - away.length} onBack={() => setPicking(null)} onStart={(t) => {
    setPicking(null)
    onStart(picking, t)
  }} />
  if (feeding) return <Basket snap={snap} monsters={monsters} now={now} onBack={() => setFeeding(false)} onFeed={onFeed} />

  const room = (a: Area, cls = '') => {
    const open = isOpen(a, monsters, xp, now)
    const trupp = away.find((e) => e.area === a.id)
    const found = a.egg && snap.eggs.some((e) => e.monster === a.egg)
    return (
      <button key={a.id} className={`room ${cls} ${open ? '' : 'locked'} ${trupp ? 'busy' : ''}`} onClick={() => (open ? setPicking(a) : setSheet(a))}>
        <span className="room-bg" style={{ backgroundImage: `url(/expedition/kulisse-${a.id}.webp)` }} />
        {trupp && <img className="peek" src={`/expedition/gegner-${a.id}.webp`} alt="" />}
        <b>{a.name}</b>
        {open ? (
          <span className="meta">
            {a.hours} h · ab Lv {a.minLevel}
            {a.id === 'flur' ? ' · Einstieg' : ''}
          </span>
        ) : (
          <span className="lockline">
            <Lock size={12} /> {lockShort(a)}
          </span>
        )}
        {trupp && <Faces ids={trupp.monsters} xp={xp} progress={progress(trupp, now)} />}
        <span className="enemy">{a.enemies.length ? a.enemies.map((e) => <Dot key={e} e={e} size={20} />) : a.id === 'keller' ? <Dot e="ohne" size={20} /> : null}</span>
        {a.egg && <span className="egg"><EggMark found={!!found} size={14} /></span>}
        {a.quarter && <span className="season-tag">{SEASON[a.quarter]}</span>}
      </button>
    )
  }
  const areas = mapAreas(now)
  const byId = (id: string) => areas.find((a) => a.id === id)
  const season = areas.find((a) => a.quarter)!
  const log = snap.expeditions.filter((e) => !isAway(e, now)).slice(-5).reverse()

  return (
    <main className="screen exp-screen">
      <header className="exp-head">
        <HeadArt />
        <button className="btn" onClick={onBack}>
          Zurück
        </button>
        <h1>Expeditionen</h1>
      </header>

      <div className="map">
        <div className="roof">
          <img src="/expedition/dach.webp" alt="" />
          {room(byId('gipfel')!)}
        </div>
        <span className="floor-label beam">OBEN</span>
        {room(byId('klippen')!)}
        {room(byId('wueste')!)}
        <span className="floor-label beam">UNTEN</span>
        {room(byId('lagune')!)}
        {room(byId('vulkan')!)}
        {room(byId('flur')!)}
        {room(byId('dschungel')!)}
        {room(season, 'season')}
        <span className="floor-label beam">KELLER</span>
        <div className="cellar">{room(byId('keller')!, 'wide')}</div>
      </div>

      <div className="basket wicker">
        {FRUIT_ORDER.map((f) => (
          <span key={f} className="f">
            <img src={fruitImg(f)} alt={FRUITS[f].name} />
            {Math.max(0, fruits[f])}
          </span>
        ))}
        <button className="btn" onClick={() => setFeeding(true)}>
          Füttern
        </button>
      </div>

      <h2 className="exp-title">
        Trupps <small>{away.length} von {slots} unterwegs</small>
      </h2>
      {away.map((e) => (
        <div key={e.id} className="trupp">
          <Faces ids={e.monsters} xp={xp} big />
          <span className="trupp-text">
            <b>{areaById(e.area).name}</b>
            <span className="small">
              noch {left(new Date(e.ends_at), now)} · zurück {clock(new Date(e.ends_at))}
            </span>
            <span className="mini-bar">
              <span style={{ width: `${progress(e, now)}%` }} />
            </span>
          </span>
          <button className="recall" onClick={() => setRecall(e)}>
            Zurückrufen
          </button>
        </div>
      ))}
      {away.length < slots && <div className="free">+ Neuer Trupp · Gebiet auf der Karte antippen</div>}
      <p className="small center-note">1 Trupp, plus 1 je 5 Monster ab Level 10, höchstens 3.</p>

      {log.length > 0 && (
        <>
          <h2 className="exp-title">Logbuch</h2>
          <div className="trupp log notebook">
            {log.map((e) => (
              <span key={e.id} className="log-row">
                <span>{areaById(e.area).name}</span>
                <span className="log-loot">
                  {e.recalled_at ? (
                    'zurückgerufen'
                  ) : (
                    <>
                      {e.loot.tier !== 'klein' && <b className={`stamp-mini ${e.loot.tier}`}>{e.loot.tier === 'super' ? 'SUPER' : 'GUT'}</b>}
                      {e.loot.fruits.map((f, i) => (
                        <img key={i} src={fruitImg(f)} alt={FRUITS[f].name} />
                      ))}
                      {e.loot.egg && <EggMark found size={13} />}
                      {e.loot.streak > 0 && ' +1 Punkt'}
                      {e.loot.shiny && ' ✦'}
                    </>
                  )}
                  <span className="log-who"> · {PEOPLE[e.started_by]}, {dayLabel(new Date(e.ends_at), now)}</span>
                </span>
              </span>
            ))}
          </div>
        </>
      )}

      {sheet && <LockedSheet area={sheet} snap={snap} monsters={monsters} now={now} onClose={() => setSheet(null)} />}
      {recall && (
        <RecallConfirm
          e={recall}
          onYes={() => {
            onRecall(recall)
            setRecall(null)
          }}
          onNo={() => setRecall(null)}
        />
      )}
    </main>
  )
}

const SEASON: Record<number, string> = { 1: 'WINTER', 2: 'FRÜHLING', 3: 'SOMMER', 4: 'HERBST' }

export const progress = (e: Expedition, now: Date) => {
  const a = new Date(e.started_at).getTime()
  const b = new Date(e.ends_at).getTime()
  return Math.min(100, Math.max(0, ((now.getTime() - a) / (b - a)) * 100))
}

function dayLabel(d: Date, now: Date) {
  const days = Math.round((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000)
  if (days <= 0) return clock(d)
  if (days === 1) return 'gestern'
  return d.toLocaleDateString('de-DE', { weekday: 'short' })
}

const lockShort = (a: Area) => (a.tier === 3 ? `${UNLOCK_TIER[3].count} Monster Lv ${UNLOCK_TIER[3].level}` : `${UNLOCK_TIER[2].count} Monster Lv ${UNLOCK_TIER[2].level}`)

const needText = (need: Area['need'] | Area['bonus']) => {
  if ('distinct' in need) return `${need.distinct} verschiedene Elemente`
  if ('final' in need) return `${need.final} Monster in der Endstufe`
  if (need.length === 0) return 'nichts'
  const n: Partial<Record<MonsterElement, number>> = {}
  for (const e of need) n[e] = (n[e] ?? 0) + 1
  return Object.entries(n).map(([e, k]) => `${k}× ${e === 'ohne' ? 'ohne Element' : ELEMENTS[e as MonsterElement].name}`).join(' und ')
}

function Dot({ e, size = 22 }: { e: MonsterElement; size?: number }) {
  return (
    <span className="eldot" style={{ width: size, height: size, background: ELEMENTS[e].strong }}>
      <ElementIcon element={e} size={size * 0.62} />
    </span>
  )
}

export function Faces({ ids, xp, progress: pct, big }: { ids: string[]; xp: Record<string, number>; progress?: number; big?: boolean }) {
  return (
    <>
      <span className={`faces ${big ? 'big' : ''}`}>
        {ids.map((id) => {
          const m = monsterById(id)
          return <img key={id} src={imgOf(m, xp[id] ?? 0)} alt="" style={{ background: backdrop(m.element) }} />
        })}
      </span>
      {pct !== undefined && (
        <span className="mini-bar">
          <span style={{ width: `${pct}%` }} />
        </span>
      )}
    </>
  )
}

export function Lock({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function EggMark({ found, size = 18 }: { found: boolean; size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 20 24" aria-label={found ? 'Ei gefunden' : 'Ei versteckt'}>
      <path d="M10 2C5.5 2 2 10 2 15a8 8 0 0 0 16 0C18 10 14.5 2 10 2z" fill={found ? '#FFD23F' : '#fff'} stroke={found ? '#1B1530' : '#8A82A6'} strokeWidth="2.2" strokeDasharray={found ? undefined : '3 2.5'} />
      {found ? (
        <path d="M6 15l3 3 5-6" fill="none" stroke="#1B1530" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <text x="10" y="18" textAnchor="middle" fontSize="10" fontWeight="800" fill="#8A82A6">
          ?
        </text>
      )}
    </svg>
  )
}

export function Compass({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor" />
    </svg>
  )
}

// Kopf der Seite: Berge, Weg und Kompass, damit man die Seite sofort wiedererkennt.
function HeadArt() {
  return (
    <svg className="bg" viewBox="0 0 400 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d="M0 150 L0 104 L50 70 L84 96 L140 40 L196 98 L238 66 L290 108 L336 58 L400 100 L400 150 Z" fill="#17483D" stroke="#1B1530" strokeWidth="3" />
      <path d="M140 40 L156 56 L146 54 L136 62 L128 52 Z M336 58 L350 72 L340 70 L330 76 L324 68 Z" fill="#fff" opacity=".85" />
      <path d="M20 140 C 90 120 120 136 180 118 S 300 120 380 96" fill="none" stroke="#FFD23F" strokeWidth="4" strokeDasharray="3 10" strokeLinecap="round" />
      <g transform="translate(352 34)" opacity=".9">
        <circle r="22" fill="none" stroke="#FFD23F" strokeWidth="3" />
        <path d="M0 -17 L5 0 L0 17 L-5 0Z" fill="#FFD23F" />
        <path d="M-17 0 L0 4 L17 0 L0 -4Z" fill="#FFD23F" opacity=".6" />
      </g>
      <circle cx="300" cy="22" r="2" fill="#fff" />
      <circle cx="250" cy="30" r="1.6" fill="#fff" />
      <circle cx="210" cy="16" r="1.4" fill="#fff" />
    </svg>
  )
}

function Facts({ area, snap }: { area: Area; snap: Snapshot }) {
  const found = area.egg && snap.eggs.some((e) => e.monster === area.egg)
  return (
    <>
      <div className="facts">
        <span className="fact">
          <small>DAUER</small>
          {area.hours} h · ab Lv {area.minLevel}
        </span>
        <span className="fact">
          <small>GEGNER</small>
          {area.enemyLabel}
        </span>
        <span className="fact">
          <small>GEFORDERT</small>
          {needText(area.need)}
        </span>
        <span className="fact">
          <small>BONUS</small>
          {needText(area.bonus)}
        </span>
      </div>
      {area.egg && (
        <span className="fact egg-fact">
          <EggMark found={!!found} size={16} /> {found ? 'Das Ei dieses Gebiets habt ihr schon gefunden.' : 'Hier ist ein Ei versteckt, noch nicht gefunden.'}
        </span>
      )}
    </>
  )
}

function LockedSheet({ area, snap, monsters, now, onClose }: { area: Area; snap: Snapshot; monsters: Monster[]; now: Date; onClose: () => void }) {
  useBack(onClose)
  const tier = area.tier === 3 ? UNLOCK_TIER[3] : UNLOCK_TIER[2]
  const xp = snap.monsterXp
  const top = [...monsters].sort((a, b) => (xp[b.id] ?? 0) - (xp[a.id] ?? 0)).slice(0, tier.count)
  const reached = top.filter((m) => levelFor(xp[m.id] ?? 0) >= tier.level).length
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <span className="grab" />
        <h3>
          <Lock size={20} /> {area.name}
        </h3>
        {area.quarter && !isOpen(area, monsters, xp, now) ? (
          <div className="req">
            <b>Nur im {SEASON[area.quarter].toLowerCase()} geöffnet.</b>
          </div>
        ) : (
          <div className="req">
            <b>
              Freischalten: {tier.count} Monster auf Level {tier.level} · {reached} von {tier.count} ✓
            </b>
            {top.map((m) => {
              const lv = levelFor(xp[m.id] ?? 0)
              const pct = Math.min(100, ((xp[m.id] ?? 0) / xpForLevel(tier.level)) * 100)
              return (
                <span key={m.id} className="progrow">
                  <img src={imgOf(m, xp[m.id] ?? 0)} alt="" style={{ background: backdrop(m.element) }} />
                  {m.stages[stageFor(m, lv)]}
                  <span className="xpbar">
                    <span style={{ width: `${pct}%`, background: lv >= tier.level ? 'var(--live)' : ELEMENTS[m.element].strong }} />
                  </span>
                  Lv {lv}
                  {lv >= tier.level ? ' ✓' : ''}
                </span>
              )
            })}
            <span className="small">
              Es zählen eure {tier.count} höchsten Monster. Danach: jedes Monster im Trupp ab Lv {area.minLevel}.
            </span>
          </div>
        )}
        <Facts area={area} snap={snap} />
        <button className="btn" onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  )
}

function RecallConfirm({ e, onYes, onNo }: { e: Expedition; onYes: () => void; onNo: () => void }) {
  useBack(onNo)
  return (
    <div className="news">
      <div className="confirm">
        <h2 className="confirm-title">Trupp zurückrufen?</h2>
        <p className="confirm-text">Der Trupp aus der {areaById(e.area).name} kommt sofort heim, aber ohne Beute.</p>
        <button className="news-btn red" onClick={onYes}>
          Zurückrufen
        </button>
        <button className="btn" onClick={onNo}>
          Weiter erkunden lassen
        </button>
      </div>
    </div>
  )
}

const pct = (x: number) => `${(x * 100).toLocaleString('de-DE', { maximumFractionDigits: x < 0.01 ? 2 : 1 })} %`

function TruppPick({ area, snap, monsters, now, free, onBack, onStart }: { area: Area; snap: Snapshot; monsters: Monster[]; now: Date; free: number; onBack: () => void; onStart: (t: Monster[]) => void }) {
  useBack(onBack)
  const [ids, setIds] = useState<string[]>([])
  const xp = snap.monsterXp
  const away = awayMonsters(snap.expeditions, now)
  const trupp = ids.map(monsterById)
  const ok = canStart(area, trupp, xp)
  const o = trupp.length ? odds(area, trupp, xp) : null
  const ends = new Date(now.getTime() + area.hours * 3_600_000)
  const list = [...monsters].sort((a, b) => Number(!!blocked(a, area, xp, snap.picks, away)) - Number(!!blocked(b, area, xp, snap.picks, away)) || (xp[b.id] ?? 0) - (xp[a.id] ?? 0))
  const toggle = (id: string) => setIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s))
  const needOk = trupp.length > 0 && ok
  const bonusOk = !!o?.bonus

  return (
    <main className="screen exp-screen">
      <header className="bar">
        <button className="btn back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <h1 className="bar-title">Trupp losschicken</h1>
      </header>
      <div className="area-head">
        {area.enemies.length ? <Dot e={area.enemies[0]} size={34} /> : <Dot e="ohne" size={34} />}
        <span className="col">
          <b>{area.name}</b>
          <span className="small">
            Gegner {area.enemyLabel} · {area.hours} h · jedes Monster ab Lv {area.minLevel}
          </span>
        </span>
      </div>
      <div className="reqs">
        <span className={`rq ${needOk ? 'ok' : ''}`}>Gefordert: {needText(area.need)}{needOk ? ' ✓' : ''}</span>
        <span className={`rq ${bonusOk ? 'ok' : ''}`}>★ Bonus: {needText(area.bonus)}{bonusOk ? ' ✓' : ''}</span>
      </div>
      <div className="slots">
        {[0, 1, 2].map((i) => {
          const m = trupp[i]
          if (!m) return <span key={i} className="slot empty">Platz {i + 1}</span>
          return (
            <button key={m.id} className="slot" onClick={() => toggle(m.id)}>
              <span className="x">✕</span>
              <span className="pic" style={{ background: backdrop(m.element) }}>
                <img src={imgOf(m, xp[m.id] ?? 0)} alt="" />
              </span>
              <b>{m.stages[stageFor(m, levelFor(xp[m.id] ?? 0))]}</b>
              <span className="small">Lv {levelFor(xp[m.id] ?? 0)}</span>
            </button>
          )
        })}
      </div>
      {o && (
        <div className="chances">
          <Chance name="Gut" p={o.gut} max={0.7} color="#5BC44A" why={`Grund 20 · ${Math.round(o.over)} Level über · Vorteil ${o.adv >= 0 ? '+' : ''}${o.adv * 5}${o.bonus ? ' · Bonus +15' : ''}`} />
          <Chance name="Super" p={o.super} max={0.1} color="#FF8A6B" why="höchstens 10 %" />
          <Chance name="Shiny" p={o.shiny} max={0.1} color="#B9A3F5" why={o.bonus ? 'mit Bonus doppelt' : 'mit Bonus doppelt so oft'} />
        </div>
      )}
      <div className="pickgrid">
        {list.map((m) => {
          const why = ids.includes(m.id) ? null : blocked(m, area, xp, snap.picks, away)
          const lv = levelFor(xp[m.id] ?? 0)
          return (
            <button key={m.id} className={`pk ${ids.includes(m.id) ? 'on' : ''} ${why ? 'off' : ''}`} disabled={!!why} onClick={() => toggle(m.id)}>
              <span className="el">
                <Dot e={m.element} size={15} />
              </span>
              <span className="pic" style={{ background: backdrop(m.element) }}>
                <img src={imgOf(m, xp[m.id] ?? 0)} alt="" />
              </span>
              Lv {lv}
              {why && <span className="why">{why === 'Wochenmonster' ? 'Woche' : why}</span>}
            </button>
          )
        })}
      </div>
      <button className="btn go" disabled={!ok || free <= 0} onClick={() => onStart(trupp)}>
        {free <= 0 ? 'Alle Trupps sind unterwegs' : ok ? `Losschicken · zurück um ${clock(ends)}` : 'Gefordertes Element fehlt'}
      </button>
      <Facts area={area} snap={snap} />
    </main>
  )
}

function Chance({ name, p, max, color, why }: { name: string; p: number; max: number; color: string; why: string }) {
  return (
    <div className="ch">
      <span>{name}</span>
      <span className="ch-bar">
        <span style={{ width: `${Math.min(100, (p / max) * 100)}%`, background: color }} />
      </span>
      <span className="ch-pct">{pct(p)}</span>
      <span className="why">{why}</span>
    </div>
  )
}

function Basket({ snap, monsters, now, onBack, onFeed }: { snap: Snapshot; monsters: Monster[]; now: Date; onBack: () => void; onFeed: (m: Monster, f: Fruit) => void }) {
  useBack(onBack)
  const fruits = basket(snap.expeditions, snap.feedings, now)
  const [fruit, setFruit] = useState<Fruit>(() => FRUIT_ORDER.find((f) => fruits[f] > 0) ?? 'beere')
  const cap = fruitCap(snap.cleanXp)
  const capMonster = monsters.find((m) => levelFor(snap.cleanXp[m.id] ?? 0) === cap)
  const xp = snap.monsterXp
  const list = [...monsters].sort((a, b) => (xp[a.id] ?? 0) - (xp[b.id] ?? 0))
  const refs = useRef<Record<string, HTMLSpanElement | null>>({})
  const [floats, setFloats] = useState<{ key: number; id: string; text: ReactNode }[]>([])

  const give = (m: Monster) => {
    const before = xp[m.id] ?? 0
    const gain = FRUITS[fruit].xp
    const pic = refs.current[m.id]
    if (!pic) return onFeed(m, fruit)
    const r = pic.getBoundingClientRect()
    flyTo(fruitImg(fruit), r, () => {
      burst(r.left + r.width / 2, r.top + r.height / 2, m.element, 14, 70)
      pic.animate([{ scale: 1 }, { scale: 1.18 }, { scale: 1 }], { duration: 320 })
      const up = levelFor(before + gain) > levelFor(before)
      const key = Date.now()
      setFloats((f) => [...f, { key, id: m.id, text: up ? `Level ${levelFor(before + gain)}!` : `+${gain} XP` }])
      setTimeout(() => setFloats((f) => f.filter((x) => x.key !== key)), 1400)
      onFeed(m, fruit)
    })
  }

  return (
    <main className="screen exp-screen">
      <header className="bar">
        <button className="btn back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <h1 className="bar-title">Fruchtkorb</h1>
      </header>
      <div className="fruitrow">
        {FRUIT_ORDER.map((f) => (
          <button key={f} className={`fr ${f === fruit ? 'on' : ''} ${fruits[f] <= 0 ? 'none' : ''}`} onClick={() => setFruit(f)}>
            <img src={fruitImg(f)} alt="" />
            <span className="n">{Math.max(0, fruits[f])}</span>
            {FRUITS[f].name} · {FRUITS[f].xp}
          </button>
        ))}
      </div>
      <div className="note">
        Grenze: <b>Level {cap}</b>, das höchste Level aus Putz-XP{capMonster ? ` (${capMonster.stages[stageFor(capMonster, cap)]})` : ''}. Früchte heben kein Monster darüber.
      </div>
      {list.map((m) => {
        const now = xp[m.id] ?? 0
        const lv = levelFor(now)
        const can = canFeed(now, fruit, cap)
        const from = xpForLevel(lv)
        const span = xpForLevel(lv + 1) - from
        const w = lv >= 30 ? 100 : ((now - from) / span) * 100
        const plus = can ? Math.min(100 - w, (FRUITS[fruit].xp / span) * 100) : 0
        return (
          <div key={m.id} className={`feed ${can ? '' : 'atcap'}`}>
            <span className="pic" ref={(el) => void (refs.current[m.id] = el)} style={{ background: backdrop(m.element) }}>
              <img src={imgOf(m, now)} alt="" />
              {floats.filter((f) => f.id === m.id).map((f) => (
                <span key={f.key} className="feed-float">
                  {f.text}
                </span>
              ))}
            </span>
            <span className="t">
              <b>
                {m.stages[stageFor(m, lv)]} · Lv {lv}
              </b>
              <span className="xpbar">
                <span style={{ width: `${w}%`, background: ELEMENTS[m.element].strong }} />
                <span className="plus" style={{ width: `${plus}%` }} />
              </span>
            </span>
            <button className="give" disabled={!can || fruits[fruit] <= 0} onClick={() => give(m)}>
              {!can ? 'an der Grenze' : `+${FRUITS[fruit].xp} XP`}
            </button>
          </div>
        )
      })}
    </main>
  )
}
