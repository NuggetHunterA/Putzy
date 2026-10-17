// Eine Aufgabe anlegen, ändern oder löschen.
import { useState } from 'react'
import { ElementIcon } from './ElementIcon'
import { EFFORT_LABEL, EFFORT_XP, ELEMENTS, firstDue, intervalLabel, nextInterval, type Effort, type Element } from './game'
import type { Task } from './db'
import { useBack } from './back'

type Props = { task: Task | null; tasks: Task[]; onSave: (t: Task) => void; onDelete: (t: Task) => void; onBack: () => void }

export function TaskEdit({ task, tasks, onSave, onDelete, onBack }: Props) {
  useBack(onBack)
  const rooms = [...new Set(tasks.map((t) => t.room))]
  const [name, setName] = useState(task?.name ?? '')
  const [room, setRoom] = useState(task?.room ?? '')
  const [newRoom, setNewRoom] = useState(false)
  const [element, setElement] = useState<Element | null>(task?.element ?? null)
  const [effort, setEffort] = useState<Effort>(task?.effort ?? 'K')
  const [days, setDays] = useState(task?.interval_days ?? 7)
  const [confirm, setConfirm] = useState(false)

  const cleanName = name.trim()
  const cleanRoom = room.trim()
  const duplicate = tasks.some((t) => t.id !== task?.id && t.room === cleanRoom && t.name.toLowerCase() === cleanName.toLowerCase())
  const ready = cleanName !== '' && cleanRoom !== '' && element !== null && !duplicate

  const save = () => {
    // Neu oder in einen anderen Raum verschoben: ans Ende des Raums.
    const sort = task && task.room === cleanRoom ? task.sort : Math.max(0, ...tasks.map((t) => t.sort)) + 1
    onSave({
      id: task?.id ?? crypto.randomUUID(),
      room: cleanRoom,
      name: cleanName,
      element: element!,
      effort,
      interval_days: days,
      first_due: task?.first_due ?? firstDue(days, new Date()),
      sort,
    })
  }

  return (
    <main className="screen">
      <header className="bar">
        <button className="btn" onClick={onBack}>
          Zurück
        </button>
        <h1 className="bar-title">{task ? 'Aufgabe' : 'Neue Aufgabe'}</h1>
      </header>
      <label className="field">
        <span className="label">Name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="field">
        <span className="label">Raum</span>
        <div className="chips">
          {rooms.map((r) => (
            <button key={r} className={`chip-btn${!newRoom && r === room ? ' on' : ''}`} onClick={() => {
                setNewRoom(false)
                setRoom(r)
              }}>
              {r}
            </button>
          ))}
          <button className={`chip-btn add${newRoom ? ' on' : ''}`} onClick={() => {
              setNewRoom(true)
              setRoom('')
            }}>
            + Neuer Raum
          </button>
        </div>
        {newRoom && <input className="input" placeholder="Name des Raums" autoFocus value={room} onChange={(e) => setRoom(e.target.value)} />}
      </div>
      <div className="field">
        <span className="label">Element</span>
        <div className="chips">
          {(Object.keys(ELEMENTS) as Element[]).map((e) => (
            <button key={e} className={`chip-btn${e === element ? ' on' : ''}`} style={e === element ? undefined : { background: ELEMENTS[e].soft }} onClick={() => setElement(e)}>
              <ElementIcon element={e} size={15} />
              {ELEMENTS[e].name}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="label">Aufwand</span>
        <div className="seg">
          {(Object.keys(EFFORT_XP) as Effort[]).map((e) => (
            <button key={e} className={e === effort ? 'on' : ''} onClick={() => setEffort(e)}>
              {EFFORT_LABEL[e]}
              <small>{EFFORT_XP[e]} XP</small>
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="label">Intervall</span>
        <div className="iv-row">
          <span className="iv-name iv-pad">{intervalLabel(days)}</span>
          <button className="step" aria-label="öfter" disabled={days <= 1} onClick={() => setDays(nextInterval(days, -1))}>
            −
          </button>
          <span className="iv-days">{days}</span>
          <button className="step" aria-label="seltener" disabled={days >= 365} onClick={() => setDays(nextInterval(days, 1))}>
            +
          </button>
        </div>
      </div>
      {duplicate && <p className="hint">In {cleanRoom} gibt es „{cleanName}“ schon.</p>}
      <button className="news-btn" disabled={!ready} onClick={save}>
        Speichern
      </button>
      {task && (
        <button className="del" onClick={() => setConfirm(true)}>
          Aufgabe löschen
        </button>
      )}
      {task && confirm && <Confirm name={task.name} onDelete={() => onDelete(task)} onCancel={() => setConfirm(false)} />}
    </main>
  )
}

export function Confirm({ name, onDelete, onCancel }: { name: string; onDelete: () => void; onCancel: () => void }) {
  useBack(onCancel)
  return (
    <div className="news">
      <div className="confirm">
        <h2 className="confirm-title">Wirklich löschen?</h2>
        <p className="confirm-text">
          <b>{name}</b> verschwindet aus der Liste. Schon verdiente XP bleiben bei den Monstern.
        </p>
        <button className="news-btn red" onClick={onDelete}>
          Löschen
        </button>
        <button className="btn" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </div>
  )
}
