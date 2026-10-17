// Monsterwahl zum Wochenstart. Ein Monster, das die andere Person schon hat, ist gesperrt.
import { ELEMENTS, MONSTERS, PEOPLE, backdrop, levelFor, stageFor, type Person } from './game'
import type { Pick } from './db'

type Props = {
  person: Person
  picks: Pick[]
  monsterXp: Record<string, number>
  onPick: (monsterId: string) => void
}

export function MonsterPick({ person, picks, monsterXp, onPick }: Props) {
  return (
    <main className="screen">
      <header className="pick-head">
        <span className="kicker">Neue Woche</span>
        <h1 className="title">
          Wähle dein
          <br />
          <span className="accent">Monster</span>
        </h1>
        <p className="lead">{PEOPLE[person]}, mit wem putzt du diese Woche? Passende Aufgaben geben 150 % XP.</p>
      </header>
      <div className="pick-grid">
        {MONSTERS.map((m, i) => {
          const takenBy = picks.find((p) => p.monster === m.id && p.person !== person)
          const level = levelFor(monsterXp[m.id] ?? 0)
          const stage = stageFor(level)
          return (
            <button
              key={m.id}
              className="pick-card"
              style={{ animationDelay: `${i * 0.04}s` }}
              disabled={!!takenBy}
              onClick={() => onPick(m.id)}
            >
              <span className="pick-img" style={{ background: backdrop(m.element) }}>
                <img src={m.files[stage]} alt="" />
                <span className="chip">{ELEMENTS[m.element].name}</span>
              </span>
              <span className="pick-name">{m.stages[stage]}</span>
              <span className="pick-meta">{takenBy ? `${PEOPLE[takenBy.person]} hat ihn` : `Level ${level}`}</span>
            </button>
          )
        })}
      </div>
    </main>
  )
}
