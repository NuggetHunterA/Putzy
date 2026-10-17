// Einmalige Aufgaben (Rauchmelder anbringen, Flur streichen, …): anlegen, abhaken, umbenennen, löschen.
import { useState, type FormEvent } from 'react'
import { ONEOFF_XP, PEOPLE, sameDay, type Person } from './game'
import { openOneOffs, type Completion, type OneOff, type Snapshot } from './db'
import { useBack } from './back'
import { MonsterBadge } from './Home'
import { useStrike } from './strike'
import { Confirm } from './TaskEdit'

const DONE_SHOWN = 10

type Props = {
  snap: Snapshot
  person: Person
  now: Date
  onAdd: (name: string) => void
  onToggle: (o: OneOff, done?: Completion) => void
  onSave: (o: OneOff) => void
  onDelete: (o: OneOff) => void
  onAttackEnd: () => void
  onBack: () => void
}

export function OneOffs({ snap, person, now, onAdd, onToggle, onSave, onDelete, onAttackEnd, onBack }: Props) {
  useBack(onBack)
  const { myBadge, strike } = useStrike(snap, person, onAttackEnd)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<OneOff | null>(null)
  if (editing)
    return (
      <OneOffEdit
        oneoff={editing}
        onSave={(o) => {
          onSave(o)
          setEditing(null)
        }}
        onDelete={(o) => {
          onDelete(o)
          setEditing(null)
        }}
        onBack={() => setEditing(null)}
      />
    )

  const add = (e: FormEvent) => {
    e.preventDefault()
    onAdd(name.trim())
    setName('')
  }
  const done = snap.oneoffsDone.slice(0, DONE_SHOWN).flatMap((c) => {
    const o = snap.oneoffs.find((o) => o.id === c.oneoff)
    return o ? [{ o, c }] : []
  })

  return (
    <main className="screen">
      <header className="bar">
        <button className="btn" onClick={onBack}>
          Zurück
        </button>
        <h1 className="bar-title">Einmalige Aufgaben</h1>
        <span className="team">
          <MonsterBadge person={person} snap={snap} imgRef={myBadge} />
        </span>
      </header>
      <form className="oo-add" onSubmit={add}>
        <input className="input" placeholder="Neue Aufgabe …" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn new-task" disabled={name.trim() === ''}>
          Anlegen
        </button>
      </form>
      <p className="oo-note">Jede einmalige Aufgabe gibt {ONEOFF_XP} XP.</p>
      <section className="section">
        <h2 className="section-title">Offen</h2>
        {openOneOffs(snap).map((o) => (
          <div key={o.id} className="row">
            <button className="oo-hit" onClick={(e) => strike(false, null, e.currentTarget.querySelector('.dot')!, () => onToggle(o))}>
              <span className="dot oo-dot">
                <Tool />
              </span>
              <span className="row-text">
                <span className="row-name">{o.name}</span>
                <span className="row-meta">einmalig · {ONEOFF_XP} XP</span>
              </span>
            </button>
            <button className="oo-pen" aria-label={`${o.name} bearbeiten`} onClick={() => setEditing(o)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 20h4L19 9l-4-4L4 16z" />
              </svg>
            </button>
          </div>
        ))}
      </section>
      {done.length > 0 && (
        <section className="section">
          <h2 className="section-title">Erledigt</h2>
          {done.map(({ o, c }) => {
            const when = new Date(c.done_at)
            // Rückgängig nur am selben Tag, damit XP und Level nicht Wochen später verschwinden.
            const undoable = sameDay(when, now)
            return (
              <button key={o.id} className="row is-done" disabled={!undoable} aria-pressed onClick={() => onToggle(o, c)}>
                <span className="dot oo-dot">
                  <Tool />
                </span>
                <span className="row-text">
                  <span className="row-name">{o.name}</span>
                </span>
                <span className="row-due">
                  {PEOPLE[c.person]} ✓ {when.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                </span>
              </button>
            )
          })}
        </section>
      )}
    </main>
  )
}

function OneOffEdit({ oneoff, onSave, onDelete, onBack }: { oneoff: OneOff; onSave: (o: OneOff) => void; onDelete: (o: OneOff) => void; onBack: () => void }) {
  useBack(onBack)
  const [name, setName] = useState(oneoff.name)
  const [confirm, setConfirm] = useState(false)
  return (
    <main className="screen">
      <header className="bar">
        <button className="btn" onClick={onBack}>
          Zurück
        </button>
        <h1 className="bar-title">Aufgabe</h1>
      </header>
      <label className="field">
        <span className="label">Name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <button className="news-btn" disabled={name.trim() === ''} onClick={() => onSave({ ...oneoff, name: name.trim() })}>
        Speichern
      </button>
      <button className="del" onClick={() => setConfirm(true)}>
        Aufgabe löschen
      </button>
      {confirm && <Confirm name={oneoff.name} onDelete={() => onDelete(oneoff)} onCancel={() => setConfirm(false)} />}
    </main>
  )
}

// Werkzeug statt Element-Symbol.
function Tool() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.8 1.8 0 0 0 2.6 2.6l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.3-.4-.4-2.3z" />
    </svg>
  )
}
