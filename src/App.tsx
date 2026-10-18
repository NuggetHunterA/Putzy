import { useCallback, useEffect, useRef, useState } from 'react'
import { Celebration, type Cel } from './Celebration'
import { Evolution } from './Evolution'
import { eventFor } from './events'
import './events.css'
import { complete, connect, deleteOneOff, deleteTask, findEgg, hatchEgg, load, markNews, markSeen, markStampSeen, pickMonster, saveOneOff, saveStamps, saveTask, saveWeeks, setInterval as saveInterval, subscribe, undo, unlock, type Completion, type OneOff, type Snapshot, type Task } from './db'
import { balance, nextEggScene, rollEgg, type Egg } from './eggs'
import { EggScene, type Scene } from './EggScene'
import { Home, type Row } from './Home'
import { Intervals } from './Intervals'
import { MonsterPick } from './MonsterPick'
import { OneOffs } from './OneOffs'
import { LATEST_NEWS, unread } from './news'
import { NewsBox } from './NewsBox'
import { Pedia } from './Pedia'
import { previousWeek } from './review'
import { unseen } from './pedia'
import { Reveal } from './Reveal'
import { newStamps, stamps, unseenStamps, xpBeforeUnseen, type Earned, type Facts } from './stamps'
import { StampScene } from './StampScene'
import { Stamps } from './Stamps'
import { WeekReview } from './WeekReview'
import { newUnlocks, unrevealed, visibleMonsters } from './secret'
import { PEOPLE, STANDING_EFFORT, dayString, levelFor, monsterById, stageFor, weekStart, xpOf, type Monster, type MonsterElement, type Person, type Standing, type Work } from './game'
import { weekPoints } from './streak'

const PERSON_STORAGE = 'putzy.person'
// Wann diese Person das Stempelheft zuletzt geöffnet hat; neuere Stempel zählen im Pedia als „neu“.
const STAMPS_STORAGE = 'putzy.stampsOpened'
const LOAD_ERROR = 'Keine Verbindung zur Datenbank.'
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
  const [view, setView] = useState<'home' | 'intervals' | 'pedia' | 'oneoffs' | 'weeks' | 'stamps'>('home')
  const [cel, setCel] = useState<Cel | null>(null)
  const closeCel = useCallback(() => setCel(null), [])
  // Vollbild gibt es nur bei Level-Up; es startet, wenn der Angriff des Monsters vorbei ist.
  const pendingCel = useRef<Cel | null>(null)
  // Entwicklungen laufen aus der Warteschlange (unseen), nie während eines Angriffs.
  const [evo, setEvo] = useState<Cel | null>(null)
  const closeEvo = useCallback(() => setEvo(null), [])
  const [attacking, setAttacking] = useState(false)
  // Freischaltung einer geheimen Reihe, die gerade gezeigt wird.
  const [secret, setSecret] = useState<Monster | null>(null)
  const closeSecret = useCallback(() => setSecret(null), [])
  // Fund oder Schlüpfen eines Eis, das gerade gezeigt wird.
  const [eggShown, setEggShown] = useState<Scene | null>(null)
  const closeEgg = useCallback(() => setEggShown(null), [])
  // Stempel, dessen Animation gerade läuft.
  const [stampShown, setStampShown] = useState<Earned | null>(null)
  const closeStamp = useCallback(() => setStampShown(null), [])
  const now = useNow()
  const week = weekStart(now)
  const day = now.toDateString()
  const today = dayString(now)
  // Woche, deren Wochenrückblick schon weggeklickt ist; danach kommt die Monsterwahl.
  const [reviewed, setReviewed] = useState<string | null>(null)
  const doneReview = useCallback(() => setReviewed(week), [week])

  // Event-Design nur auf der Startseite, nicht in der Monsterwahl oder den Unterseiten.
  const homeEvent = view === 'home' && snap?.picks.some((p) => p.person === person) ? eventFor(now) : null
  useEffect(() => {
    if (homeEvent) document.documentElement.dataset.event = homeEvent
    else delete document.documentElement.dataset.event
  }, [homeEvent])

  const refresh = useCallback(async () => {
    try {
      const d = new Date()
      setSnap(await load(new Date(d.getFullYear(), d.getMonth(), d.getDate()), weekStart(d)))
      // Nur die Lade-Meldung zurücknehmen; eine Meldung zu einem Schreibfehler bleibt stehen, bis man sie antippt.
      setError((e) => (e === LOAD_ERROR ? null : e))
    } catch {
      setError(LOAD_ERROR)
    }
  }, [])

  // Neu laden beim Start, bei jeder Änderung und beim Zurückkehren in die App: Was die Live-Verbindung
  // verpasst hat, während das Handy im Hintergrund lag, wird nicht nachgeliefert.
  useEffect(() => {
    if (!connected) return
    refresh()
    const onShow = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onShow)
    const unsubscribe = subscribe(refresh, setLive)
    return () => {
      document.removeEventListener('visibilitychange', onShow)
      unsubscribe()
    }
  }, [refresh, day])

  // Geheime Reihen: Ist eine Bedingung erfüllt, wird der heutige Tag gespeichert. Pro Reihe nur ein Versuch je Start.
  const fresh = snap ? newUnlocks(snap.monsterXp, snap.unlocks).map((m) => m.id).join() : ''
  const unlockTried = useRef(new Set<string>())
  useEffect(() => {
    const ids = fresh.split(',').filter((id) => id && !unlockTried.current.has(id))
    if (ids.length === 0) return
    ids.forEach((id) => unlockTried.current.add(id))
    unlock(ids, today).catch(() => setError('Das hat nicht geklappt. Ich lade neu.')).finally(refresh)
  }, [fresh, today, refresh])

  // Ab dem Tag danach: Freischaltung zeigen (vor Entwicklungen) und sofort als gesehen merken (Stufe 0).
  const reveal = snap && person ? unrevealed(snap.seen, person, snap.unlocks, today)[0] : undefined
  useEffect(() => {
    if (!reveal || !person || secret || evo || cel || attacking) return
    const seen = { person, monster: reveal.id, stage: 0 }
    setSnap((s) => s && { ...s, seen: [...s.seen, seen] })
    setSecret(reveal)
    markSeen(seen).catch(() => setError('Das hat nicht geklappt. Ich lade neu.')).finally(refresh)
  }, [reveal, person, secret, evo, cel, attacking, refresh])

  // Eier: Fund (Stufe -1) und Schlüpfen (Stufe 0) zeigen, nach geheimen Reihen und vor Entwicklungen.
  const eggScene = snap && person && !reveal ? nextEggScene(snap.eggs, snap.seen, person) : undefined
  useEffect(() => {
    if (!eggScene || !person || secret || eggShown || evo || cel || attacking) return
    const seen = { person, monster: eggScene.monster.id, stage: eggScene.kind === 'found' ? -1 : 0 }
    setSnap((s) => s && { ...s, seen: [...s.seen, seen] })
    setEggShown(eggScene)
    markSeen(seen).catch(() => setError('Das hat nicht geklappt. Ich lade neu.')).finally(refresh)
  }, [eggScene, person, secret, eggShown, evo, cel, attacking, refresh])

  // Streak-Punkte abgeschlossener Wochen, die noch nicht gespeichert sind, festhalten. Einmal pro Woche je Start.
  const points = snap ? weekPoints(week, snap.streakWeeks, snap.tasks, snap.done) : []
  const weeksSaved = useRef<string | null>(null)
  useEffect(() => {
    if (!snap || weeksSaved.current === week) return
    const unsaved = weekPoints(week, snap.streakWeeks, snap.tasks, snap.done).filter((w) => !snap.streakWeeks.some((s) => s.week_start === w.week_start))
    if (unsaved.length === 0) return
    weeksSaved.current = week
    saveWeeks(unsaved).catch(() => setError('Das hat nicht geklappt. Ich lade neu.')).finally(refresh)
  }, [snap, week, refresh])

  // Stempel: Ist eine Bedingung erfüllt, wird der Stempel samt Bonus gespeichert. Pro Stempel nur ein Versuch je Start.
  const facts: Facts | null = snap && { done: snap.done, tasks: snap.tasks, monsterXp: snap.monsterXp, unlocks: snap.unlocks, eggs: snap.eggs, streakWeeks: snap.streakWeeks, today, week }
  const earnable = facts && snap ? newStamps(facts, snap.stamps) : []
  const earnableKey = earnable.map((e) => e.id).join()
  const stampTried = useRef(new Set<string>())
  useEffect(() => {
    const list = earnable.filter((e) => !stampTried.current.has(e.id))
    if (list.length === 0) return
    list.forEach((e) => stampTried.current.add(e.id))
    saveStamps(list).catch(() => setError('Das hat nicht geklappt. Ich lade neu.')).finally(refresh)
    // earnable ändert sich mit jedem Neuladen, entscheidend sind nur neue Stempel.
  }, [earnableKey, refresh])
  const stampsSeen = snap && person ? snap.stampsSeen.filter((s) => s.person === person).map((s) => s.stamp) : []

  // Nächste noch nicht gesehene Entwicklung abspielen und sofort als gesehen merken. Entwicklungen, die erst ein
  // noch nicht gesehener Stempel ausgelöst hat, warten bis nach seiner Animation.
  const next = snap && person ? unseen(snap.seen, person, xpBeforeUnseen(snap.monsterXp, snap.stamps, stampsSeen))[0] : undefined
  useEffect(() => {
    if (!next || !person || reveal || secret || eggScene || eggShown || stampShown || evo || cel || attacking) return
    const seen = { person, monster: next.monster.id, stage: next.stage }
    setSnap((s) => s && { ...s, seen: [...s.seen, seen] })
    setEvo(evolution(next.monster, next.stage))
    markSeen(seen).catch(() => setError('Das hat nicht geklappt. Ich lade neu.')).finally(refresh)
  }, [next, person, reveal, secret, eggScene, eggShown, stampShown, evo, cel, attacking, refresh])

  // Stempel nach den Entwicklungen zeigen, ältester zuerst, und sofort als gesehen merken.
  const stampNext = snap && person && !next ? unseenStamps(snap.stamps, stampsSeen)[0] : undefined
  useEffect(() => {
    if (!stampNext || !person || reveal || secret || eggScene || eggShown || stampShown || evo || cel || attacking) return
    setSnap((s) => s && { ...s, stampsSeen: [...s.stampsSeen, { person, stamp: stampNext.id }] })
    setStampShown(stampNext)
    markStampSeen(person, stampNext.id).catch(() => setError('Das hat nicht geklappt. Ich lade neu.')).finally(refresh)
  }, [stampNext, person, reveal, secret, eggScene, eggShown, stampShown, evo, cel, attacking, refresh])

  // Was ist neu: Wer noch keinen Stand hat, startet still beim aktuellen, sonst gäbe es alles als neu.
  const seeNews = useCallback(
    (p: Person) => {
      setSnap((s) => s && { ...s, newsSeen: { ...s.newsSeen, [p]: LATEST_NEWS } })
      markNews(p, LATEST_NEWS).catch(() => setError('Das hat nicht geklappt. Ich lade neu.')).finally(refresh)
    },
    [refresh],
  )
  const newsSeen = snap && person ? snap.newsSeen[person] : undefined
  const newsStart = snap && person && newsSeen === undefined ? person : null
  // Nur einmal pro Start versuchen, damit ein fehlschlagendes Speichern nicht endlos wiederholt wird.
  const newsStarted = useRef(false)
  useEffect(() => {
    if (!newsStart || newsStarted.current) return
    newsStarted.current = true
    seeNews(newsStart)
  }, [newsStart, seeNews])

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
  const monsters = visibleMonsters(snap.unlocks, today, snap.eggs)
  const bank = balance(points, snap.eggs)
  // Die Box kommt erst auf der Startseite, wenn Monsterwahl, Freischaltungen und Entwicklungen durch sind.
  const news = myPick && view === 'home' && !reveal && !secret && !eggScene && !eggShown && !next && !stampNext && !stampShown && !evo && !cel && !attacking ? unread(newsSeen) : []

  // Abhaken: XP mit Element-Bonus, Level-Up merken, dann speichern (save bekommt Monster und XP).
  // find: Wurf für ein Ei (Schlüssel, Element der Aufgabe, ihr Name), gespeichert nach der Erledigung.
  const award = (work: Work, save: (monster: string, xp: number) => Promise<void>, find: { key: string; element: MonsterElement; task: string }) => {
    const monster = monsterById(myPick!.monster)
    const xp = xpOf(work, monster.element)
    const before = snap.monsterXp[monster.id] ?? 0
    const level = levelFor(before + xp)
    setAttacking(true)
    // Bei einer Entwicklung übernimmt die Warteschlange, sonst gibt es das Level-Up-Vollbild.
    if (level > levelFor(before) && stageFor(monster, level) === stageFor(monster, levelFor(before))) {
      pendingCel.current = {
        key: Date.now(),
        monster,
        stageBefore: stageFor(monster, levelFor(before)),
        stageAfter: stageFor(monster, level),
        level,
        xp,
        bonus: work?.element === monster.element,
      }
    }
    const egg = rollEgg(find.key, find.element, snap.eggs)
    run(
      save(monster.id, xp).then(() => egg ? findEgg({ monster: egg, found_by: person, found_task: find.task }) : undefined, (e) => {
        pendingCel.current = null
        // 23505: Die andere Person hat die Aufgabe heute schon abgehakt. Das Neuladen zeigt, wer.
        if (e?.code === '23505') return setError('Das war heute schon erledigt.')
        throw e
      }),
    )
  }

  const onToggle = (row: Row) => {
    if (row.done) return run(undo(row.done.id))
    award(row.task, (monster, xp) => complete({ task_id: row.task.id, person, monster, xp }), { key: `${today}|${row.task.id}`, element: row.task.element, task: row.task.name })
  }

  // Ständige Aufgabe: done ist der eigene Haken von heute, nur der lässt sich zurücknehmen.
  const onStanding = (s: Standing, done?: Completion) => {
    if (done) return run(undo(done.id))
    award({ effort: STANDING_EFFORT, element: s.element }, (monster, xp) => complete({ task_id: null, standing: s.id, person, monster, xp }), {
      key: `${today}|${s.id}|${person}`,
      element: s.element,
      task: s.name,
    })
  }

  // Einmalige Aufgabe: done ist ihre Erledigung, rückgängig nur die eigene am selben Tag (siehe OneOffs).
  const onOneOff = (o: OneOff, done?: Completion) => {
    if (done) return run(undo(done.id))
    award(null, (monster, xp) => complete({ task_id: null, oneoff: o.id, person, monster, xp }), { key: o.id, element: 'ohne', task: o.name })
  }

  const onAddOneOff = (name: string) => {
    const o = { id: crypto.randomUUID(), name }
    setSnap({ ...snap, oneoffs: [...snap.oneoffs, { ...o, created_at: new Date().toISOString() }] })
    run(saveOneOff(o))
  }

  const onSaveOneOff = (o: OneOff) => {
    setSnap({ ...snap, oneoffs: snap.oneoffs.map((x) => (x.id === o.id ? o : x)) })
    run(saveOneOff({ id: o.id, name: o.name }))
  }

  const onDeleteOneOff = (o: OneOff) => {
    setSnap({ ...snap, oneoffs: snap.oneoffs.filter((x) => x.id !== o.id) })
    run(deleteOneOff(o.id))
  }

  const onHatch = (e: Egg) => run(hatchEgg(e.monster, person))

  const stampShownDef = stampShown && stamps(snap.tasks, snap.stamps).find((s) => s.id === stampShown.id)
  const stampsOpened = localStorage.getItem(STAMPS_STORAGE) ?? ''
  const onStamps = () => {
    localStorage.setItem(STAMPS_STORAGE, new Date().toISOString())
    setView('stamps')
  }

  const onAttackEnd = () => {
    setCel(pendingCel.current)
    pendingCel.current = null
    setAttacking(false)
  }

  const onInterval = (task: Task, days: number) => {
    setSnap({ ...snap, tasks: snap.tasks.map((t) => (t.id === task.id ? { ...t, interval_days: days } : t)) })
    run(saveInterval(task.id, days))
  }

  const onSaveTask = (task: Task) => {
    const known = snap.tasks.some((t) => t.id === task.id)
    const tasks = known ? snap.tasks.map((t) => (t.id === task.id ? task : t)) : [...snap.tasks, task]
    setSnap({ ...snap, tasks: tasks.sort((a, b) => a.sort - b.sort) })
    run(saveTask(task))
  }

  const onDeleteTask = (task: Task) => {
    setSnap({ ...snap, tasks: snap.tasks.filter((t) => t.id !== task.id) })
    run(deleteTask(task.id))
  }

  return (
    <>
      {!myPick && reviewed !== week ? (
        <WeekReview
          key={week}
          tasks={snap.tasks}
          week={previousWeek(week)}
          streak={points.length > 0 ? { earned: points.at(-1)!.points, bank } : undefined}
          onDone={doneReview}
        />
      ) : !myPick ? (
        <MonsterPick person={person} monsters={monsters} picks={snap.picks} monsterXp={snap.monsterXp} onPick={(m) => run(pickMonster({ week_start: week, person, monster: m }))} />
      ) : view === 'intervals' ? (
        <Intervals tasks={snap.tasks} onChange={onInterval} onSave={onSaveTask} onDelete={onDeleteTask} onBack={() => setView('home')} />
      ) : view === 'oneoffs' ? (
        <OneOffs
          snap={snap}
          person={person}
          now={now}
          onAdd={onAddOneOff}
          onToggle={onOneOff}
          onSave={onSaveOneOff}
          onDelete={onDeleteOneOff}
          onAttackEnd={onAttackEnd}
          onBack={() => setView('home')}
        />
      ) : view === 'pedia' ? (
        <Pedia
          snap={snap}
          monsters={monsters}
          points={bank}
          stampsNew={snap.stamps.filter((e) => e.earned_at > stampsOpened).length}
          onHatch={onHatch}
          onBack={() => setView('home')}
          onReplay={(m, stage) => setEvo(evolution(m, stage))}
          onWeeks={() => setView('weeks')}
          onStamps={onStamps}
        />
      ) : view === 'stamps' ? (
        <Stamps snap={snap} facts={facts!} onBack={() => setView('pedia')} />
      ) : view === 'weeks' ? (
        <WeekReview tasks={snap.tasks} week={week} archive onDone={() => setView('pedia')} />
      ) : (
        <Home
          snap={snap}
          person={person}
          monsters={monsters}
          now={now}
          points={bank}
          live={live}
          onToggle={onToggle}
          onStanding={onStanding}
          onAttackEnd={onAttackEnd}
          onIntervals={() => setView('intervals')}
          onPedia={() => setView('pedia')}
          onOneOffs={() => setView('oneoffs')}
        />
      )}
      {error && (
        <button className="toast" onClick={() => setError(null)}>
          {error}
        </button>
      )}
      {news.length > 0 && <NewsBox news={news} monsterImg={weekImg(monsterById(myPick!.monster), snap.monsterXp)} onDone={() => seeNews(person)} />}
      {cel && <Celebration cel={cel} onDone={closeCel} />}
      {evo && <Evolution cel={evo} onDone={closeEvo} />}
      {secret && <Reveal monster={secret} canPick={!myPick} onDone={closeSecret} />}
      {stampShownDef && (
        <StampScene
          stamp={stampShownDef}
          earned={stampShown!}
          person={person}
          monsterXp={snap.monsterXp}
          onDone={closeStamp}
        />
      )}
      {eggShown && <EggScene scene={eggShown} person={person} canPick={!myPick} onDone={closeEgg} />}
    </>
  )
}

// Entwicklung auf eine Stufe, wie sie die Szene braucht (auch zum Wiederholen im Pedia).
function evolution(monster: Monster, stage: number): Cel {
  return { key: Date.now(), monster, stageBefore: stage - 1, stageAfter: stage, level: monster.levels[stage - 1], xp: 0, bonus: false }
}

// Aktuelle Stufe des Wochenmonsters für den Kopf der Neuigkeiten-Box.
function weekImg(m: Monster, monsterXp: Record<string, number>) {
  return m.files[stageFor(m, levelFor(monsterXp[m.id] ?? 0))]
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <main className="screen center">
      <h1 className="title">{title}</h1>
      <p className="lead">{text}</p>
    </main>
  )
}
