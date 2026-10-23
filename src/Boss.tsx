// Boss-Seite: Stand des laufenden Bosses, Schaden je Person, Trupp aus drei Monstern mit Siegchance und ab dem letzten
// Event-Tag der Knopf zum Endkampf. Nach dem Kampf steht das Ergebnis darin und lässt sich nochmal ansehen.
import { useState } from 'react'
import { useBack } from './back'
import { FLOOR, bestTrupp, bossImg, canFight, shortDay, weakness, winChance, type BossState, type Fight } from './bosses'
import type { Snapshot } from './db'
import { ElementIcon } from './ElementIcon'
import { EVENT_LABEL } from './events'
import { Faces } from './Expeditions'
import { advantageAgainst, awayMonsters } from './expeditions'
import { ELEMENTS, PEOPLE, backdrop, dayString, levelFor, monsterById, stageFor, type MonsterElement, type Monster, type Person } from './game'

type Props = {
  s: BossState
  snap: Snapshot
  person: Person
  // Nur sichtbare Monster.
  monsters: Monster[]
  now: Date
  onBack: () => void
  onFight: (trupp: Monster[]) => void
  onReplay: (f: Fight) => void
}

const imgOf = (m: Monster, xp: number) => m.files[stageFor(m, levelFor(xp))]

export function Dot({ e, size = 18 }: { e: MonsterElement; size?: number }) {
  return (
    <span className="eldot" style={{ width: size, height: size, background: ELEMENTS[e].strong }}>
      <ElementIcon element={e} size={size * 0.62} />
    </span>
  )
}

export function Boss({ s, snap, person, monsters, now, onBack, onFight, onReplay }: Props) {
  useBack(onBack)
  const xp = snap.monsterXp
  const away = awayMonsters(snap.expeditions, now)
  const free = monsters.filter((m) => !away.has(m.id))
  const [ids, setIds] = useState(() => bestTrupp(s.boss, free, xp).map((m) => m.id))
  const [picking, setPicking] = useState(false)
  const trupp = ids.map(monsterById)
  const weak = weakness(s.boss)
  const left = s.lp - s.damage
  const ready = canFight(s, now)
  const odds = winChance(s.boss, s.damage, s.lp, trupp, xp)
  const weakPct = Math.round((s.damage / s.lp) * 100)
  const when = s.fight ? (s.fight.won ? 'Besiegt!' : 'Entkommen') : ready ? (dayString(now) === s.lastDay ? 'letzter Event-Tag' : `Kampf bis ${shortDay(s.open)}`) : `Kampf ab ${shortDay(s.lastDay)}`

  return (
    <main className="screen boss-screen">
      <div className="bar">
        <button className="btn back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <h1 className="bar-title">{s.boss.name}</h1>
        <span className="pill plain">{EVENT_LABEL[s.boss.event]}</span>
      </div>

      <div className="boss-hero">
        <div className="hero-top">
          <span className="pill">
            <Dot e={s.boss.element} />
            {ELEMENTS[s.boss.element].name}
          </span>
          <span className="pill">
            <Dot e={weak} />
            schwach gegen {ELEMENTS[weak].name}
          </span>
        </div>
        <img className={s.fight && !s.fight.won ? 'fled' : ''} src={bossImg(s.boss)} alt="" />
        <div className="hero-hp">
          <span className="hpbar">
            <span style={{ width: `${(left / s.lp) * 100}%` }} />
            <i style={{ left: `${FLOOR * 100}%` }} />
          </span>
          <span className="bb-meta">
            <span>{ready ? `${left} LP übrig · ${weakPct}% geschwächt` : `${left} / ${s.lp} LP`}</span>
            <span>{when}</span>
          </span>
        </div>
      </div>

      {s.fight ? (
        <Result f={s.fight} event={EVENT_LABEL[s.boss.event].replace(/^\S+ /, '')} xp={xp} onReplay={() => onReplay(s.fight!)} />
      ) : (
        <>
          {!ready && <Damage by={s.by} snap={snap} weak={weak} floor={Math.round(s.lp * FLOOR)} />}
          <h3 className="sub">Euer Trupp</h3>
          <div className="slots">
            {[0, 1, 2].map((i) => {
              const m = trupp[i]
              if (!m) return <button key={i} className="slot empty" onClick={() => setPicking(true)}>Platz {i + 1}</button>
              const adv = advantageAgainst([s.boss.element], [m], xp)
              return (
                <button key={m.id} className="slot" onClick={() => setPicking(true)}>
                  {adv !== 0 && <span className={`adv ${adv > 0 ? 'up' : 'down'}`}>{adv > 0 ? '▲ Vorteil' : '▼ Nachteil'}</span>}
                  <span className="pic" style={{ background: backdrop(m.element) }}>
                    <img src={imgOf(m, xp[m.id] ?? 0)} alt="" />
                  </span>
                  <b>{m.stages[stageFor(m, levelFor(xp[m.id] ?? 0))]}</b>
                  <span className="small">Lv {levelFor(xp[m.id] ?? 0)}</span>
                </button>
              )
            })}
          </div>
          <Odds odds={odds} weakPct={weakPct} today={!ready} />
          {ready && (
            <span className="bhint center">
              Was ihr nach dem Kampf erledigt, schwächt ihn nicht mehr.
              <br />
              Ein Kampf für euch beide, {PEOPLE[person === 'adrian' ? 'ulrike' : 'adrian']} sieht ihn danach auch.
            </span>
          )}
          <button className={`go-btn${ready ? '' : ' off'}`} disabled={!ready || trupp.length === 0} onClick={() => onFight(trupp)}>
            {ready ? 'Zum Kampf!' : `Kampf ab ${shortDay(s.lastDay)}`}
          </button>
        </>
      )}

      {picking && <TruppSheet s={s} monsters={monsters} away={away} xp={xp} ids={ids} onDone={(next) => (setIds(next), setPicking(false))} />}
    </main>
  )
}

function Damage({ by, snap, weak, floor }: { by: Record<Person, number>; snap: Snapshot; weak: MonsterElement; floor: number }) {
  const sum = Math.max(1, by.adrian + by.ulrike)
  return (
    <div className="card dmg">
      {(Object.keys(PEOPLE) as Person[]).map((p) => {
        const pick = snap.picks.find((x) => x.person === p)
        const color = pick ? ELEMENTS[monsterById(pick.monster).element].strong : 'var(--accent)'
        return (
          <div key={p} className="dmg-row">
            <span className="who">{PEOPLE[p]}</span>
            <span className="bar2">
              <span style={{ width: `${(by[p] / sum) * 100}%`, background: color }} />
            </span>
            <span className="n">{by[p]}</span>
          </div>
        )
      })}
      <span className="bhint">
        Schaden = XP der Aufgabe, {ELEMENTS[weak].name}-Aufgaben doppelt. {floor} LP bleiben immer übrig, damit der Kampf spannend bleibt.
      </span>
    </div>
  )
}

function Odds({ odds, weakPct, today }: { odds: ReturnType<typeof winChance>; weakPct: number; today: boolean }) {
  return (
    <div className="card odds">
      <span className="odds-big" style={{ ['--p' as string]: odds.total }}>
        <b>{odds.total}%</b>
        <small>SIEG</small>
      </span>
      <div className="odds-list">
        <div>
          <span>Grundchance</span>
          <b>+5</b>
        </div>
        <div>
          <span>Geschwächt {weakPct}%</span>
          <b>+{odds.weak}</b>
        </div>
        <div>
          <span>Level Ø {Math.round(odds.avg)}</span>
          <b>+{odds.level}</b>
        </div>
        {odds.adv !== 0 && (
          <div>
            <span>
              {Math.abs(odds.adv)}× Element-{odds.adv > 0 ? 'Vorteil' : 'Nachteil'}
            </span>
            <b>{odds.adv > 0 ? `+${odds.adv * 5}` : `−${-odds.adv * 5}`}</b>
          </div>
        )}
        {today && (
          <div className="tot">
            <span>Stand heute</span>
            <b>{odds.total}%</b>
          </div>
        )}
      </div>
    </div>
  )
}

function Result({ f, event, xp, onReplay }: { f: Fight; event: string; xp: Record<string, number>; onReplay: () => void }) {
  const day = new Date(f.started_at).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'numeric' })
  return (
    <div className={`card boss-result ${f.won ? 'won' : 'fled'}`}>
      <span className="stampw">{f.won ? 'BESIEGT' : 'ENTKOMMEN'}</span>
      <Faces ids={f.monsters} xp={xp} big />
      <span>
        {PEOPLE[f.started_by]} hat am {day} gekämpft, Siegchance {f.chance}%.
      </span>
      <b>{f.won ? `+6 Streak-Punkte für euer Konto!` : `Er kommt ${event} ${f.year + 1} wieder.`}</b>
      <span className="bhint">Was ihr jetzt erledigt, schwächt ihn nicht mehr.</span>
      <button className="btn" onClick={onReplay}>
        Kampf nochmal ansehen
      </button>
    </div>
  )
}

// Trupp-Auswahl als Blatt von unten: ▲ schlägt das Boss-Element, ▼ wird von ihm geschlagen. Monster auf Expedition sind
// unterwegs und nicht wählbar. Die Siegchance rechnet live mit.
function TruppSheet({ s, monsters, away, xp, ids: start, onDone }: { s: BossState; monsters: Monster[]; away: Set<string>; xp: Record<string, number>; ids: string[]; onDone: (ids: string[]) => void }) {
  const [ids, setIds] = useState(start)
  const close = () => onDone(ids.length > 0 ? ids : start)
  useBack(close)
  const adv = (m: Monster) => advantageAgainst([s.boss.element], [m], xp)
  const list = [...monsters].sort((a, b) => Number(away.has(a.id)) - Number(away.has(b.id)) || adv(b) - adv(a) || (xp[b.id] ?? 0) - (xp[a.id] ?? 0))
  const toggle = (id: string) => setIds((x) => (x.includes(id) ? x.filter((y) => y !== id) : x.length < 3 ? [...x, id] : x))
  const odds = winChance(s.boss, s.damage, s.lp, ids.map(monsterById), xp)
  const el = ELEMENTS[s.boss.element].name
  return (
    <div className="sheet-wrap" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <span className="grab" />
        <h3>
          Trupp wählen <small>{ids.length} von 3</small>
        </h3>
        <div className="legend">
          <span>▲ schlägt {el} (+5%)</span>
          <span>▼ wird von {el} geschlagen (−5%)</span>
        </div>
        <div className="pickgrid">
          {list.map((m) => {
            const out = away.has(m.id)
            const a = adv(m)
            const n = ids.indexOf(m.id) + 1
            return (
              <button key={m.id} className={`pk ${n ? 'on' : ''} ${out ? 'off away' : ''}`} disabled={out} onClick={() => toggle(m.id)}>
                {a !== 0 && <span className={`mark ${a > 0 ? 'up' : 'down'}`}>{a > 0 ? '▲' : '▼'}</span>}
                {n > 0 && <span className="num">{n}</span>}
                <span className="pic" style={{ background: backdrop(m.element) }}>
                  <img src={imgOf(m, xp[m.id] ?? 0)} alt="" />
                </span>
                {out ? 'unterwegs' : `Lv ${levelFor(xp[m.id] ?? 0)}`}
              </button>
            )
          })}
        </div>
        <div className="sheet-foot">
          <span className="odds-big small" style={{ ['--p' as string]: odds.total }}>
            <b>{odds.total}%</b>
          </span>
          <span className="bhint">
            Siegchance ändert sich,
            <br />
            sobald ihr tauscht
          </span>
          <button className="btn" disabled={ids.length === 0} onClick={close}>
            Fertig
          </button>
        </div>
      </div>
    </div>
  )
}
