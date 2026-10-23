// Startbildschirm: flache Leiste mit Fortschritt und euren Monstern, Pedia-Band, dann die Aufgabenliste mit den ständigen Aufgaben oben.
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useStrike } from './strike'
import { FLOOR, bossImg, canFight, hitsCount, shortDay, type BossState } from './bosses'
import { bossHit } from './fx'
import { ElementIcon } from './ElementIcon'
import { Compass } from './Expeditions'
import { EVENT_LABEL, eventBonus, eventEnd, eventFor } from './events'
import { ELEMENTS, MAX_LEVEL, PEOPLE, STANDING, STANDING_EFFORT, TEAM_BONUS, backdrop, dayString, daysUntilDue, dueLabel, elementsOf, intervalLabel, levelFor, monsterById, stageFor, weekStart, xpForLevel, xpOf, type Element, type Monster, type Person, type Standing } from './game'
import { PEDIA_ORDER, dexTotal, discoveredCount, isDiscovered } from './pedia'
import { openOneOffs, type Completion, type Snapshot, type Task } from './db'
import { STREAK_START, addDays, current, longest, weekDays } from './streak'

const SOON_DAYS = 7

type Row = { task: Task; days: number; done?: Completion }

type Props = {
  snap: Snapshot
  person: Person
  // Nur sichtbare Monster, geheime Reihen erst nach ihrer Freischaltung.
  monsters: Monster[]
  now: Date
  // Streak-Punkte auf dem gemeinsamen Konto.
  points: number
  live: boolean
  onToggle: (row: Row) => void
  onStanding: (s: Standing, done?: Completion) => void
  onAttackEnd: () => void
  onIntervals: () => void
  onPedia: () => void
  onOneOffs: () => void
  onExpeditions: () => void
  // Heimgekehrte Trupps, deren Heimkehr diese Person noch nicht gesehen hat.
  homecomings: number
  // Laufender Boss oder null.
  boss: BossState | null
  onBoss: () => void
}

export type { Row }

export function Home({ snap, person, monsters, now, points, live, onToggle, onStanding, onAttackEnd, onIntervals, onPedia, onOneOffs, onExpeditions, homecomings, boss, onBoss }: Props) {
  const { myBadge, strike } = useStrike(snap, person, onAttackEnd)
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
  const oneoffs = openOneOffs(snap).length

  // XP, die dein Monster für eine Aufgabe bekäme, mit Element- und Event-Bonus.
  const myMonster = monsterById(snap.picks.find((p) => p.person === person)!.monster)
  const myElements = elementsOf(myMonster, snap.monsterXp[myMonster.id] ?? 0)
  const bonus = eventBonus(now)
  const xpFor = (t: Task) => xpOf(t, myElements, bonus)
  // Boss: Jede Erledigung trifft ihn mit ihren XP. Treffer fliegen beim Abhaken zur Boss-Leiste.
  const bossPic = useRef<HTMLImageElement>(null)
  const hitting = boss && hitsCount(boss, now) ? boss : null
  const hitBoss = (element: Element, xp: number, dot: HTMLElement) => {
    if (!hitting || !bossPic.current) return
    const damage = Math.min(xp, Math.round(hitting.lp * (1 - FLOOR)) - hitting.damage)
    if (damage > 0) bossHit(dot, bossPic.current, element, damage)
  }
  const toggle = (row: Row, dot: HTMLElement) =>
    strike(!!row.done, row.task, dot, () => {
      onToggle(row)
      if (!row.done) hitBoss(row.task.element, xpFor(row.task), dot)
    })
  const toggleStanding = (s: Standing, dot: HTMLElement) => {
    const mine = snap.today.find((c) => c.standing === s.id && c.person === person)
    const work = { effort: STANDING_EFFORT, element: s.element }
    strike(!!mine, work, dot, () => {
      onStanding(s, mine)
      if (!mine) hitBoss(s.element, xpOf(work, myElements, bonus), dot)
    })
  }

  return (
    <main className="screen">
      <header className="home-head">
        <div className="col">
          <span className="kicker-row">
            <span className="kicker">{now.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }).toUpperCase()}</span>
            <StreakBadge snap={snap} now={now} points={points} />
          </span>
          <h1 className="logo">Putzy</h1>
        </div>
        <span className="head-btns">
          <button className={`gear${homecomings > 0 ? ' hot' : ''}`} onClick={onExpeditions} aria-label={`Expeditionen, ${homecomings} zurück`}>
            <Compass size={22} />
            {homecomings > 0 && <span className="gear-count">{homecomings}</span>}
          </button>
          <button className={`gear${oneoffs > 0 ? ' has-count' : ''}`} onClick={onOneOffs} aria-label={`Einmalige Aufgaben, ${oneoffs} offen`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="4" width="14" height="17" rx="2" />
              <path d="M9 4V2.8h6V4M9 11l2 2 4-4M9 17h6" />
            </svg>
            {oneoffs > 0 && <span className="gear-count">{oneoffs}</span>}
          </button>
          <button className="gear" onClick={onIntervals} aria-label="Aufgaben">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
          </button>
        </span>
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
        <span className="pct">{pct}%</span>
        <span className="bubble">
          {today.length === 0 ? (
            'Heute frei!'
          ) : pct === 100 ? (
            'Alles glänzt!'
          ) : (
            <>
              {doneCount} von {today.length}
              <br />
              besiegt
            </>
          )}
        </span>
        <span className="team">
          {[person, other].map((p) => (
            <MonsterBadge key={p} person={p} snap={snap} imgRef={p === person ? myBadge : undefined} />
          ))}
        </span>
      </div>

      {boss && <BossBar s={boss} now={now} imgRef={bossPic} onClick={onBoss} />}

      <PediaBanner snap={snap} monsters={monsters} onClick={onPedia} />

      <TaskSection title="Heute" badge={<EventBadge now={now} />} rows={today} person={person} xp={xpFor} bonus={bonus} onToggle={toggle}>
        <StandingStrip today={snap.today} person={person} onToggle={toggleStanding} />
      </TaskSection>
      {soon.length > 0 && <TaskSection title="Demnächst" rows={soon} person={person} xp={xpFor} bonus={bonus} onToggle={toggle} />}

      <footer className="live">
        <span className={`live-dot ${live ? 'on' : ''}`} />
        <span>{live ? 'Live verbunden' : 'Verbinde …'}</span>
      </footer>
    </main>
  )
}

// Streak dieser Woche klein neben dem Datum: Seifenblase und „4 TAGE“.
// Antippen zeigt kurz, was eine Streak ist, einen Punkt pro Tag (gelb geschafft, dunkel gerissen, Ring heute) und den Kontostand.
function StreakBadge({ snap, now, points }: { snap: Snapshot; now: Date; points: number }) {
  const [open, setOpen] = useState(false)
  const today = dayString(now)
  const todayIndex = (now.getDay() + 6) % 7
  const days = weekDays(weekStart(now), today, snap.tasks, snap.done)
  const streak = current(days, todayIndex)
  // Hüpfer, wenn die Zahl steigt (heute geschafft), nicht beim Öffnen der App.
  const [hop, setHop] = useState(0)
  const [last, setLast] = useState(streak)
  if (streak !== last) {
    setLast(streak)
    if (streak > last) setHop(hop + 1)
  }
  const dot = (ok: boolean, i: number) => (i === todayIndex ? `today${ok ? ' ok' : ''}` : i > todayIndex || addDays(weekStart(now), i) < STREAK_START ? 'later' : ok ? 'ok' : 'miss')
  return (
    <>
      <button className="streak" onClick={() => setOpen(!open)} aria-label={`Streak: ${streak} Tage am Stück`}>
        <span key={hop} className={hop ? 'streak-hop' : ''}>
          {streak === 1 ? '1 Tag' : `${streak} Tage`}
        </span>
      </button>
      {open && (
        <button className="streak-info" onClick={() => setOpen(false)}>
          <span className="streak-info-head">
            <b>{streak === 1 ? '1 Tag' : `${streak} Tage`} am Stück!</b>
            <span className="streak-days" aria-hidden="true">
              {days.map((ok, i) => (
                <i key={i} className={dot(ok, i)} />
              ))}
            </span>
          </span>
          <span>Ein Tag zählt, wenn alle fälligen Aufgaben abgehakt sind. Die längste Streak der Woche gibt am Montag Punkte für euer Konto (jetzt {points}).</span>
          <small>Diese Woche bisher: {longest(days)} Punkte</small>
        </button>
      )}
    </>
  )
}

// Während eines Events: Bonus-Element klein neben „Heute“, antippen zeigt Event und Laufzeit.
function EventBadge({ now }: { now: Date }) {
  const [open, setOpen] = useState(false)
  const event = eventFor(now)
  const bonus = eventBonus(now)
  if (!event || !bonus) return null
  const end = eventEnd(now)
  const left = Math.round((end.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 864e5)
  return (
    <>
      <button className="event-badge" onClick={() => setOpen(!open)} aria-label={`${EVENT_LABEL[event]}: ${ELEMENTS[bonus].name} +50 % XP`}>
        <span className="event-badge-dot" style={{ background: ELEMENTS[bonus].soft }}>
          <ElementIcon element={bonus} />
        </span>
        +50%
      </button>
      {open && (
        <button className="streak-info" onClick={() => setOpen(false)}>
          <span className="streak-info-head">
            <b>{EVENT_LABEL[event]}</b>
          </span>
          <span>
            {ELEMENTS[bonus].name}-Aufgaben bringen 50 % mehr XP, zusätzlich zum Element-Bonus deines Monsters. Außerdem bekommen alle {ELEMENTS[bonus].name}-Monster je {TEAM_BONUS} XP.
          </span>
          <small>{left === 0 ? 'Nur noch heute' : `Noch bis ${end.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })}`}</small>
        </button>
      )}
    </>
  )
}

// Boss-Leiste unter dem Fortschritt: Bild, LP-Balken mit Boden-Marke (FLOOR) und wann der Kampf ist. Am letzten Tag
// leuchtet sie und wird zum Knopf „Zum Kampf!“, nach dem Kampf steht das Ergebnis darin.
function BossBar({ s, now, imgRef, onClick }: { s: BossState; now: Date; imgRef: RefObject<HTMLImageElement | null>; onClick: () => void }) {
  const left = s.lp - s.damage
  const ready = canFight(s, now)
  const when = s.fight ? (s.fight.won ? 'Besiegt!' : 'Entkommen') : ready ? (dayString(now) === s.lastDay ? 'heute!' : `bis ${shortDay(s.open)}`) : `Kampf ab ${shortDay(s.lastDay)}`
  return (
    <button className={`boss-bar${ready ? ' ready' : ''}${s.fight ? ' over' : ''}`} onClick={onClick} aria-label={`${s.boss.name}: ${left} von ${s.lp} LP`}>
      <img ref={imgRef} className="bb-img" src={bossImg(s.boss)} alt="" />
      <span className="bb-main">
        <span className="bb-top">
          <span className="bb-name">{s.boss.name}</span>
          <span className="event-badge-dot" style={{ background: ELEMENTS[s.boss.element].strong }}>
            <ElementIcon element={s.boss.element} />
          </span>
          {!ready && <span className="bb-tag">BOSS</span>}
        </span>
        <span className="hpbar">
          <span style={{ width: `${(left / s.lp) * 100}%` }} />
          <i style={{ left: `${FLOOR * 100}%` }} />
        </span>
        <span className="bb-meta">
          <span>{ready ? `${left} LP übrig` : `${left} / ${s.lp} LP`}</span>
          <span>{when}</span>
        </span>
      </span>
      {ready ? <span className="bb-fight">Zum Kampf!</span> : <span className="bb-go">›</span>}
    </button>
  )
}

// Antippen: Monster hüpft und sagt kurz, wie viele XP bis zum nächsten Level fehlen.
export function MonsterBadge({ person, snap, imgRef }: { person: Person; snap: Snapshot; imgRef?: RefObject<HTMLSpanElement | null> }) {
  const [talk, setTalk] = useState(0)
  useEffect(() => {
    if (!talk) return
    const t = setTimeout(() => setTalk(0), 2500)
    return () => clearTimeout(t)
  }, [talk])
  const pick = snap.picks.find((p) => p.person === person)
  if (!pick) {
    return (
      <span className="badge" title={`${PEOPLE[person]} wählt noch`}>
        <span className="badge-img empty" />
        <b>wählt noch</b>
      </span>
    )
  }
  const m = monsterById(pick.monster)
  const xp = snap.monsterXp[m.id] ?? 0
  const level = levelFor(xp)
  const stage = stageFor(m, level)
  const from = xpForLevel(level)
  const progress = level === MAX_LEVEL ? 1 : (xp - from) / (xpForLevel(level + 1) - from)
  const line = level === MAX_LEVEL ? 'Level 30 erreicht! ★' : `Noch ${(xpForLevel(level + 1) - xp).toLocaleString('de-DE')} XP bis Lv ${level + 1}!`
  return (
    <button className="badge" title={`${PEOPLE[person]}: ${m.stages[stage]}, Level ${level}`} onClick={() => setTalk((n) => n + 1)}>
      {talk > 0 && (
        <span key={`say${talk}`} className="say" role="status">
          {line}
        </span>
      )}
      <span key={`img${talk}`} ref={imgRef} className={`badge-img ${talk > 0 ? 'hop' : ''}`} style={{ background: backdrop(m.element), color: ELEMENTS[m.element].strong }}>
        <img src={m.files[stage]} alt="" />
      </span>
      <b>Lv {level}</b>
      <span className="xpbar">
        <span style={{ width: `${progress * 100}%`, background: ELEMENTS[m.element].strong }} />
      </span>
    </button>
  )
}

// Schmales Pedia-Band über den Aufgaben: eure zwei stärksten Monster und eine Silhouette als Lockruf.
function PediaBanner({ snap, monsters, onClick }: { snap: Snapshot; monsters: Monster[]; onClick: () => void }) {
  const xp = (id: string) => snap.monsterXp[id] ?? 0
  const top = [...monsters].sort((a, b) => xp(b.id) - xp(a.id)).slice(0, 2)
  const shown = (m: Monster) => m.stages.findLastIndex((_, s) => isDiscovered(snap.seen, m.id, s))
  const hidden = PEDIA_ORDER.filter((m) => monsters.includes(m)).flatMap((m) => m.levels.map((_, i) => i + 1).filter((s) => !isDiscovered(snap.seen, m.id, s)).map((s) => m.files[s]))[0]
  return (
    <button className="pedia-banner" onClick={onClick} aria-label={`Putzy-Pedia, ${discoveredCount(snap.seen, monsters)} von ${dexTotal(monsters)} entdeckt`}>
      <span className="pb-title">Putzy-Pedia</span>
      <span className="pb-sub">
        {discoveredCount(snap.seen, monsters)}/{dexTotal(monsters)}
      </span>
      <span className="pb-mons" aria-hidden="true">
        {top.map((m) => (
          <img key={m.id} src={m.files[shown(m)]} alt="" />
        ))}
        {hidden && <img className="sil" src={hidden} alt="" />}
      </span>
      <span className="pb-go" aria-hidden="true">
        ›
      </span>
    </button>
  )
}

// Ständige Aufgaben als Leiste unter „Heute“: Knopf mit Kurzname, je eine Marke pro Person, die heute abgehakt hat.
function StandingStrip({ today, person, onToggle }: { today: Completion[]; person: Person; onToggle: (s: Standing, dot: HTMLElement) => void }) {
  const did = (s: Standing, p: Person) => today.some((c) => c.standing === s.id && c.person === p)
  return (
    <div className="standing">
      {STANDING.map((s) => {
        const mine = did(s, person)
        return (
          <button
            key={s.id}
            className={`st-btn ${mine ? 'mine' : ''}`}
            aria-pressed={mine}
            aria-label={s.name}
            onClick={(e) => onToggle(s, e.currentTarget.querySelector('.st-dot')!)}
          >
            <span className="st-dot" style={{ background: ELEMENTS[s.element][mine ? 'strong' : 'soft'] }}>
              {mine ? <b>✓</b> : <ElementIcon element={s.element} />}
              <span className="st-marks">
                {(Object.keys(PEOPLE) as Person[]).map((p) => (
                  <i key={p} className={did(s, p) ? 'on' : ''} title={PEOPLE[p]}>
                    {PEOPLE[p][0]}
                  </i>
                ))}
              </span>
            </span>
            <span className="st-name">{s.short}</span>
          </button>
        )
      })}
    </div>
  )
}

// Erledigte Zeilen lassen sich nur von der Person zurücknehmen, die sie abgehakt hat.
function TaskSection({ title, badge, rows, person, xp, bonus, onToggle, children }: { title: string; badge?: ReactNode; rows: Row[]; person: Person; xp: (t: Task) => number; bonus: Element | null; onToggle: (r: Row, dot: HTMLElement) => void; children?: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">{title}</h2>
        {badge}
      </div>
      {children}
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
            disabled={!!r.done && r.done.person !== person}
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
            <span className="row-side">
              <span className={`row-due ${!r.done && r.days < 0 ? 'late' : ''}`}>{r.done ? `${PEOPLE[r.done.person]} ✓` : dueLabel(r.days)}</span>
              <span className={`row-xp${!r.done && r.task.element === bonus ? ' bonus' : ''}`}>{r.done ? r.done.xp : xp(r.task)} XP</span>
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </section>
  )
}
