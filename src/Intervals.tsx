// Aufgaben pflegen: Intervalle direkt in der Liste, alles andere auf der Bearbeiten-Seite.
import { useState } from 'react'
import { ElementIcon } from './ElementIcon'
import { EFFORT_LABEL, ELEMENTS, intervalLabel, nextInterval } from './game'
import type { Task } from './db'
import { useBack } from './back'
import { TaskEdit } from './TaskEdit'

type Props = {
  tasks: Task[]
  onChange: (t: Task, days: number) => void
  onSave: (t: Task) => void
  onDelete: (t: Task) => void
  onBack: () => void
}

export function Intervals({ tasks, onChange, onSave, onDelete, onBack }: Props) {
  useBack(onBack)
  // null: Liste, 'new': neue Aufgabe, sonst die Aufgabe in Bearbeitung.
  const [editing, setEditing] = useState<Task | 'new' | null>(null)
  const edit = (t: Task | 'new' | null) => {
    setEditing(t)
    window.scrollTo(0, 0)
  }
  if (editing)
    return (
      <TaskEdit
        task={editing === 'new' ? null : editing}
        tasks={tasks}
        onSave={(t) => {
          onSave(t)
          edit(null)
        }}
        onDelete={(t) => {
          onDelete(t)
          edit(null)
        }}
        onBack={() => edit(null)}
      />
    )

  const rooms = [...new Set(tasks.map((t) => t.room))]
  return (
    <main className="screen">
      <header className="bar">
        <button className="btn" onClick={onBack}>
          Zurück
        </button>
        <h1 className="bar-title">Aufgaben</h1>
      </header>
      <button className="btn new-task" onClick={() => edit('new')}>
        + Neue Aufgabe
      </button>
      {rooms.map((room) => (
        <section key={room} className="section">
          <h2 className="section-title">{room}</h2>
          {tasks
            .filter((t) => t.room === room)
            .map((t) => (
              <div key={t.id} className="iv-row">
                <span className="dot" style={{ background: ELEMENTS[t.element].soft }}>
                  <ElementIcon element={t.element} size={18} />
                </span>
                <button className="iv-name iv-edit" onClick={() => edit(t)}>
                  {t.name}
                  <small>
                    {intervalLabel(t.interval_days)} · {EFFORT_LABEL[t.effort]}
                  </small>
                </button>
                <button className="step" aria-label={`${t.name} öfter`} disabled={t.interval_days <= 1} onClick={() => onChange(t, nextInterval(t.interval_days, -1))}>
                  −
                </button>
                <span className="iv-days">{t.interval_days}</span>
                <button className="step" aria-label={`${t.name} seltener`} disabled={t.interval_days >= 365} onClick={() => onChange(t, nextInterval(t.interval_days, 1))}>
                  +
                </button>
              </div>
            ))}
        </section>
      ))}
    </main>
  )
}
