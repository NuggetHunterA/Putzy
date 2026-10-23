// Heimkehr eines Trupps: Pergamentkarte mit dem Heimweg, Kampf-Rückblick in der Kulisse des Gebiets, dann öffnet sich
// die Beutekiste (Klein Holz, Gut mit Strahlen, Super Gold mit Konfetti). Danach, falls gewürfelt, die Shiny-Enthüllung.
// Antippen überspringt bis zur Beute. Aufbruch: kurz, der Trupp zieht los.
import { useEffect, useRef, useState } from 'react'
import { useBack } from './back'
import { fruitImg } from './Expeditions'
import { FRUITS, areaById, beatsArea, shinyFilter, type Expedition, type Fruit } from './expeditions'
import { eggFile } from './eggs'
import { burst, confetti } from './fx'
import { ELEMENTS, PEOPLE, backdrop, levelFor, monsterById, stageFor, type Monster, type MonsterElement, type Person } from './game'

type Phase = 'map' | 'fight' | 'chest' | 'loot' | 'shiny'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const mid = (el: Element | null) => {
  const r = el!.getBoundingClientRect()
  return [r.left + r.width / 2, r.top + r.height / 2] as const
}

export function Homecoming({ exp, person, monsterXp, onDone }: { exp: Expedition; person: Person; monsterXp: Record<string, number>; onDone: () => void }) {
  useBack(onDone)
  const area = areaById(exp.area)
  const trupp = exp.monsters.map(monsterById)
  const { loot } = exp
  const [phase, setPhase] = useState<Phase>('map')
  const [hit, setHit] = useState(-1)
  const [hp, setHp] = useState(100)
  const skip = useRef(false)
  const enemy = useRef<HTMLImageElement>(null)
  const chest = useRef<HTMLDivElement>(null)
  const enemyEl: MonsterElement = area.enemies[0] ?? 'ohne'
  const imgOf = (m: Monster) => m.files[stageFor(m, levelFor(monsterXp[m.id] ?? 0))]

  useEffect(() => {
    let alive = true
    const go = () => alive && !skip.current
    ;(async () => {
      await wait(2300)
      if (!go()) return
      setPhase('fight')
      await wait(1500)
      for (let i = 0; i < trupp.length; i++) {
        if (!go()) return
        setHit(i)
        await wait(300)
        if (!go()) return
        const [x, y] = mid(enemy.current)
        const adv = beatsArea(trupp[i], area, monsterXp)
        burst(x, y, trupp[i].element, adv ? 24 : 12, adv ? 130 : 80)
        setHp(i === trupp.length - 1 ? 0 : 100 - ((i + 1) * 100) / (trupp.length + 0.5))
        await wait(900)
      }
      if (!go()) return
      setHit(-1)
      const [x, y] = mid(enemy.current)
      burst(x, y, enemyEl, 30, 150)
      await wait(800)
      if (!go()) return
      setPhase('chest')
      await wait(1700)
      if (!go()) return
      setPhase('loot')
    })()
    return () => {
      alive = false
    }
  }, [])

  // Kiste öffnet sich mit dem Wechsel zur Beute, auch nach dem Überspringen.
  useEffect(() => {
    if (phase !== 'loot' || !chest.current) return
    navigator.vibrate?.(loot.tier === 'super' ? [80, 40, 160] : 40)
    const [x, y] = mid(chest.current)
    if (loot.tier === 'super') confetti(x, y)
    burst(x, y, 'licht', loot.tier === 'klein' ? 6 : 16, 120)
  }, [phase, loot.tier])
  const open = phase === 'loot'

  const tap = () => {
    if (phase === 'loot' || phase === 'shiny') return
    skip.current = true
    setPhase('loot')
  }

  const counts = loot.fruits.reduce<Partial<Record<Fruit, number>>>((n, f) => ({ ...n, [f]: (n[f] ?? 0) + 1 }), {})
  const summary = [
    ...Object.entries(counts).map(([f, n]) => `+${n} ${n === 1 ? FRUITS[f as Fruit].name : PLURAL[f as Fruit]}`),
    ...(loot.streak ? ['+1 Streak-Punkt'] : []),
    ...(loot.egg ? ['ein Ei fürs Nest'] : []),
  ].join(' · ')
  const shinyMonster = loot.shiny && monsterById(loot.shiny.monster)

  if (phase === 'shiny' && loot.shiny && shinyMonster) return <ShinyReveal m={shinyMonster} stage={loot.shiny.stage} onDone={onDone} />

  const kulisse = `url(/expedition/kulisse-${area.id}.webp), linear-gradient(${ELEMENTS[enemyEl].hi}, ${ELEMENTS[enemyEl].bg})`

  return (
    <div className="hk" onClick={tap}>
      {phase === 'map' ? (
        <div className="hk-map">
          <svg className="hk-trail" viewBox="0 0 390 700" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <path d="M290 120 C 330 230 120 230 150 340 S 300 420 200 560" fill="none" stroke="#1B1530" strokeWidth="5" strokeDasharray="4 14" strokeLinecap="round" />
          </svg>
          <span className="hk-place hk-from">
            <img src={`/expedition/gegner-${area.id}.webp`} alt="" />
            <b>{area.name}</b>
          </span>
          <span className="hk-place hk-home">
            <svg width="86" height="78" viewBox="0 0 96 86" aria-hidden="true">
              <path d="M8 40 L48 6 L88 40" fill="#D6284A" stroke="#1B1530" strokeWidth="5" strokeLinejoin="round" />
              <rect x="16" y="38" width="64" height="44" fill="#FFF" stroke="#1B1530" strokeWidth="5" />
              <rect x="40" y="54" width="16" height="28" fill="#FFD23F" stroke="#1B1530" strokeWidth="4" />
            </svg>
            <b>Zuhause</b>
          </span>
          <span className="hk-token">
            {trupp.map((m) => (
              <img key={m.id} src={imgOf(m)} alt="" style={{ background: backdrop(m.element) }} />
            ))}
          </span>
          <span className="hk-stamp">ZURÜCK!</span>
          <span className="hk-hint">{exp.started_by === person ? 'Dein Trupp' : `${PEOPLE[exp.started_by]}s Trupp`} ist wieder da</span>
        </div>
      ) : (
        <div className="hk-scene" style={{ backgroundImage: kulisse }}>
          <span className="hk-banner">Rückblick: {area.name}</span>
          <div className="hk-team">
            {trupp.map((m, i) => (
              <img
                key={m.id}
                className={`hk-mon ${hit === i ? 'lunge' : ''} ${phase !== 'fight' ? 'watch' : ''}`}
                style={{ animationDelay: `${i * 0.12}s` }}
                src={imgOf(m)}
                alt={m.stages[stageFor(m, levelFor(monsterXp[m.id] ?? 0))]}
              />
            ))}
          </div>
          {phase === 'fight' && (
            <div className={`hk-enemy ${hp === 0 ? 'down' : ''} ${hit >= 0 ? 'hurt' : ''}`} key={hit}>
              <span className="hk-hp">
                <span style={{ width: `${hp}%` }} />
              </span>
              <img ref={enemy} src={`/expedition/gegner-${area.id}.webp`} alt="" />
            </div>
          )}
          {phase === 'fight' && hit >= 0 && (
            <span className="hk-call" key={`c${hit}`}>
              {trupp[hit].move}!{beatsArea(trupp[hit], area, monsterXp) && <span className="hk-adv">VORTEIL!</span>}
            </span>
          )}
          {(phase === 'chest' || phase === 'loot') && (
            <div className={`hk-chest ${loot.tier} ${open ? 'open' : ''}`} ref={chest}>
              {open && loot.tier !== 'klein' && <span className="hk-rays" />}
              <Chest gold={loot.tier === 'super'} open={open} />
            </div>
          )}
          {phase === 'loot' && (
            <>
              <div className="hk-loot">
                {loot.fruits.map((f, i) => (
                  <span key={i} className="hk-item" style={{ animationDelay: `${0.25 + i * 0.22}s` }}>
                    <img src={fruitImg(f)} alt={FRUITS[f].name} />
                  </span>
                ))}
                {loot.egg && (
                  <span className="hk-item" style={{ animationDelay: `${0.25 + loot.fruits.length * 0.22}s` }}>
                    <img src={eggFile(loot.egg)} alt="Ei" />
                  </span>
                )}
                {loot.streak > 0 && (
                  <span className="hk-item hk-point" style={{ animationDelay: `${0.25 + loot.fruits.length * 0.22}s` }}>
                    +1
                  </span>
                )}
              </div>
              {loot.tier !== 'klein' && <span className="hk-tier">{loot.tier === 'super' ? 'SUPER!' : 'GUT!'}</span>}
              <div className="hk-bottom">
                <span className="hk-sum">{summary}</span>
                {loot.shiny ? (
                  <button className="btn" onClick={() => setPhase('shiny')}>
                    Moment … da glitzert was!
                  </button>
                ) : (
                  <button className="btn" onClick={onDone}>
                    Einsammeln
                  </button>
                )}
              </div>
            </>
          )}
          {phase !== 'loot' && <span className="hk-skip">Tippen zum Überspringen</span>}
        </div>
      )}
    </div>
  )
}

const PLURAL: Record<Fruit, string> = { beere: 'Beeren', pflaume: 'Pflaumen', apfel: 'Äpfel', gold: 'Goldäpfel' }

function Chest({ gold, open }: { gold: boolean; open: boolean }) {
  const body = gold ? ['#FFE27A', '#F2A900', '#C98A00'] : ['#D99A5B', '#8E5626', '#6E3F18']
  return (
    <svg viewBox="0 0 200 170" aria-hidden="true">
      <defs>
        <linearGradient id={`ch${gold}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={body[0]} />
          <stop offset="1" stopColor={body[1]} />
        </linearGradient>
      </defs>
      <g transform="translate(0 60)">
        <rect x="8" y="6" width="184" height="98" rx="10" fill={`url(#ch${gold})`} stroke="#1B1530" strokeWidth="6" />
        <rect x="8" y="40" width="184" height="14" fill={body[2]} stroke="#1B1530" strokeWidth="5" />
        <rect x="84" y="30" width="32" height="34" rx="6" fill="#fff" stroke="#1B1530" strokeWidth="5" />
        <circle cx="100" cy="47" r="5" fill="#1B1530" />
      </g>
      <g className={open ? 'hk-lid off' : 'hk-lid'}>
        <path d="M8 126 V90 Q100 50 192 90 V126 Z" fill={body[0]} stroke="#1B1530" strokeWidth="6" strokeLinejoin="round" />
        <path d="M84 126 V84 h32 V126" fill="none" stroke="#1B1530" strokeWidth="5" />
      </g>
    </svg>
  )
}

// Shiny-Enthüllung: einmalig, das Monster wechselt mit Blitz und Glitzer die Farbe.
function ShinyReveal({ m, stage, onDone }: { m: Monster; stage: number; onDone: () => void }) {
  const [on, setOn] = useState(false)
  const pic = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const t = setTimeout(() => {
      setOn(true)
      navigator.vibrate?.([60, 40, 120])
      const [x, y] = mid(pic.current)
      burst(x, y, 'licht', 30, 170)
      confetti(x, y)
    }, 1400)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className={`hk hk-shiny ${on ? 'on' : ''}`}>
      <span className="hk-banner">{on ? '✦ Shiny! ✦' : 'Da glitzert was …'}</span>
      <div className="hk-shiny-pic" ref={pic} style={{ background: backdrop(m.element) }}>
        <img src={m.files[stage]} alt="" style={{ filter: on ? shinyFilter(m.id) : undefined }} />
        {on && ['12% 20%', '78% 30%', '20% 75%', '84% 72%', '50% 8%'].map((p, i) => <span key={i} className="glit" style={{ left: p.split(' ')[0], top: p.split(' ')[1], animationDelay: `${i * 0.15}s` }}>✦</span>)}
      </div>
      {on && (
        <div className="hk-bottom">
          <span className="hk-sum">{m.stages[stage]} ist jetzt Shiny und glänzt so für immer im Pedia.</span>
          <button className="btn" onClick={onDone}>
            Wunderbar!
          </button>
        </div>
      )}
    </div>
  )
}

// Aufbruch: Trupp hüpft los und läuft aus dem Bild.
export function Departure({ exp, monsterXp, onDone }: { exp: Expedition; monsterXp: Record<string, number>; onDone: () => void }) {
  useBack(onDone)
  const area = areaById(exp.area)
  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="hk hk-depart" onClick={onDone}>
      <span className="hk-banner">Auf zur {area.name}!</span>
      <div className="hk-depart-team">
        {exp.monsters.map((id, i) => {
          const m = monsterById(id)
          return <img key={id} src={m.files[stageFor(m, levelFor(monsterXp[id] ?? 0))]} alt="" style={{ animationDelay: `${i * 0.12}s` }} />
        })}
      </div>
      <span className="hk-sum dark">zurück in {area.hours} Stunden</span>
    </div>
  )
}
