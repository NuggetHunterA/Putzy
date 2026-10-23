// Boss-Sammlung im Pedia: besiegte Bosse mit Datum und Trupp, entkommene blass, unbekannte als Schatten mit ihrem nächsten
// Auftritt. Antippen eines Kampfs spielt ihn nochmal ab.
import { useBack } from './back'
import { BOSSES, bossImg, bossesWon, nextVisit, type Boss, type Fight } from './bosses'
import type { Snapshot } from './db'
import { EVENT_LABEL } from './events'
import { Faces } from './Expeditions'

const dayMonth = (day: string) => `${Number(day.slice(8))}.${Number(day.slice(5, 7))}.`

// Bester Kampf je Boss: ein Sieg, sonst der letzte.
const fightFor = (b: Boss, fights: Fight[]) => {
  const own = fights.filter((f) => f.event === b.event)
  return own.find((f) => f.won) ?? own.at(-1)
}

export function Bosses({ snap, now, onBack, onReplay }: { snap: Snapshot; now: Date; onBack: () => void; onReplay: (f: Fight) => void }) {
  useBack(onBack)
  const rank = (b: Boss) => {
    const f = fightFor(b, snap.bossFights)
    return f ? (f.won ? '0' : '1') : `2${nextVisit(b, now) ?? '9'}`
  }
  const list = [...BOSSES].sort((a, b) => rank(a).localeCompare(rank(b)))
  return (
    <main className="screen">
      <div className="bar">
        <button className="btn back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <h1 className="bar-title">Bosse</h1>
      </div>
      <span className="bhint">
        {bossesWon(snap.bossFights)} von {BOSSES.length} besiegt. Jeder Boss kommt zu seinem Event, Unbesiegte kommen im nächsten Jahr wieder.
      </span>
      <div className="boss-grid">
        {list.map((b) => {
          const f = fightFor(b, snap.bossFights)
          const [icon, ...name] = EVENT_LABEL[b.event].split(' ')
          if (!f) {
            const next = nextVisit(b, now)
            return (
              <div key={b.event} className="bcard">
                <span className="ev">{icon}</span>
                <img className="pic sil" src={bossImg(b)} alt="" />
                <b>???</b>
                <small>
                  {name.join(' ')}
                  {next ? ` · ab ${dayMonth(next)}` : ''}
                </small>
              </div>
            )
          }
          return (
            <button key={b.event} className={`bcard ${f.won ? 'won' : 'fled'}`} onClick={() => onReplay(f)}>
              <span className="ev">{icon}</span>
              <span className="stampw">{f.won ? 'BESIEGT' : 'ENTKOMMEN'}</span>
              <img className="pic" src={bossImg(b)} alt="" />
              <b>{b.name}</b>
              <small>{f.won ? new Date(f.started_at).toLocaleDateString('de-DE') : `kommt ${name.join(' ')} ${f.year + 1} wieder`}</small>
              <Faces ids={f.monsters} xp={snap.monsterXp} />
            </button>
          )
        })}
      </div>
    </main>
  )
}
