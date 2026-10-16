// Intervalle der festen Aufgaben einstellen.
import { ElementIcon } from './ElementIcon'
import { ELEMENTS, intervalLabel } from './game'
import type { Task } from './db'

export function Intervals({ tasks, onChange, onBack }: { tasks: Task[]; onChange: (t: Task, days: number) => void; onBack: () => void }) {
  const rooms = [...new Set(tasks.map((t) => t.room))]
  return (
    <main className="screen">
      <header className="bar">
        <button className="btn" onClick={onBack}>
          Zurück
        </button>
        <h1 className="bar-title">Intervalle</h1>
      </header>
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
                <span className="iv-name">
                  {t.name}
                  <small>{intervalLabel(t.interval_days)}</small>
                </span>
                <button className="step" aria-label={`${t.name} öfter`} disabled={t.interval_days <= 1} onClick={() => onChange(t, t.interval_days - 1)}>
                  −
                </button>
                <span className="iv-days">{t.interval_days}</span>
                <button className="step" aria-label={`${t.name} seltener`} disabled={t.interval_days >= 365} onClick={() => onChange(t, t.interval_days + 1)}>
                  +
                </button>
              </div>
            ))}
        </section>
      ))}
    </main>
  )
}
