import { useCallback, useEffect, useRef, useState } from 'react'
import { Celebration, type Cel } from './Celebration'
import { Evolution } from './Evolution'
import { complete, connect, load, pickMonster, setInterval as saveInterval, subscribe, undo, type Snapshot, type Task } from './db'
import { Home, type Row } from './Home'
import { Intervals } from './Intervals'
import { MonsterPick } from './MonsterPick'
import { PEOPLE, levelFor, monsterById, stageFor, weekStart, xpFor, type Person } from './game'

const PERSON_STORAGE = 'putzy.person'
const connected = connect()

// Aktuelle Zeit, minütlich und beim Zurückkehren in die App aktualisiert (für Tageswechsel).
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = window.setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return now
}

export default function App() {
  const [person, setPerson] = useState(() => localStorage.getItem(PERSON_STORAGE) as Person | null)
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [live, setLive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'home' | 'intervals'>('home')
  const [cel, setCel] = useState<Cel | null>(null)
  const closeCel = useCallback(() => setCel(null), [])
  // Vollbild gibt es nur bei Level-Up; es startet, wenn der Angriff des Monsters vorbei ist.
  const pendingCel = useRef<Cel | null>(null)
  const now = useNow()
  const week = weekStart(now)
  const day = now.toDateString()

  const refresh = useCallback(async () => {
    try {
      const d = new Date()
      setSnap(await load(new Date(d.getFullYear(), d.getMonth(), d.getDate()), weekStart(d)))
      setError(null)
    } catch {
      setError('Keine Verbindung zur Datenbank.')
    }
  }, [])

  useEffect(() => {
    if (!connected) return
    refresh()
    return subscribe(refresh, setLive)
  }, [refresh, day])

  // Fehler bei Schreibzugriffen: Meldung zeigen und den echten Stand neu laden.
  const run = (action: Promise<unknown>) =>
    action.catch(() => setError('Das hat nicht geklappt. Ich lade neu.')).finally(refresh)

  if (!connected) {
    return <Message title="Haushaltslink fehlt" text="Öffne Putzy einmal über euren Haushaltslink. Danach merkt sich das Handy den Zugang." />
  }

  if (!person) {
    return (
      <main className="screen center">
        <h1 className="title">
          Wer
          <br />
          <span className="accent">bist du?</span>
        </h1>
        <div className="names">
          {(Object.keys(PEOPLE) as Person[]).map((p) => (
            <button
              key={p}
              className="name-btn"
              onClick={() => {
                localStorage.setItem(PERSON_STORAGE, p)
                setPerson(p)
              }}
            >
              {PEOPLE[p]}
            </button>
          ))}
        </div>
      </main>
    )
  }

  if (!snap) return <Message title="Putzy lädt …" text={error ?? ''} />

  const myPick = snap.picks.find((p) => p.person === person)

  const onToggle = (row: Row) => {
    if (row.done) return run(undo(row.done.id))
    const monster = monsterById(myPick!.monster)
    const xp = xpFor(row.task.effort, row.task.element, monster.element)
    const before = snap.monsterXp[monster.id] ?? 0
    const level = levelFor(before + xp)
    if (level > levelFor(before)) {
      pendingCel.current = {
        key: Date.now(),
        monster,
        stageBefore: stageFor(levelFor(before)),
        stageAfter: stageFor(level),
        level,
        xp,
        bonus: row.task.element === monster.element,
      }
    }
    run(complete({ task_id: row.task.id, person, monster: monster.id, xp }))
  }

  const onInterval = (task: Task, days: number) => {
    setSnap({ ...snap, tasks: snap.tasks.map((t) => (t.id === task.id ? { ...t, interval_days: days } : t)) })
    run(saveInterval(task.id, days))
  }

  return (
    <>
      {!myPick ? (
        <MonsterPick person={person} picks={snap.picks} monsterXp={snap.monsterXp} onPick={(m) => run(pickMonster({ week_start: week, person, monster: m }))} />
      ) : view === 'intervals' ? (
        <Intervals tasks={snap.tasks} onChange={onInterval} onBack={() => setView('home')} />
      ) : (
        <Home
          snap={snap}
          person={person}
          now={now}
          live={live}
          onToggle={onToggle}
          onAttackEnd={() => {
            setCel(pendingCel.current)
            pendingCel.current = null
          }}
          onIntervals={() => setView('intervals')}
        />
      )}
      {error && (
        <button className="toast" onClick={() => setError(null)}>
          {error}
        </button>
      )}
      {cel && (cel.stageAfter > cel.stageBefore ? <Evolution cel={cel} onDone={closeCel} /> : <Celebration cel={cel} onDone={closeCel} />)}
    </>
  )
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <main className="screen center">
      <h1 className="title">{title}</h1>
      <p className="lead">{text}</p>
    </main>
  )
}
