// Arenaleiter im Pedia: alle 12 Leiter, besiegte mit Stempel, Spezial-Leiter erst nach allen normalen, die kommen können.
// Darunter die Unique-Monster der Spezial-Leiter, sichtbar nach dem ersten Sieg (sie lassen sich nicht wählen).
import { LEADERS, leaderImg, leadersSeen, leadersWon, specialsOpen } from './arena'
import { leaderColors } from './Arena'
import { useBack } from './back'
import type { Snapshot } from './db'
import type { Monster } from './game'
import { Dot } from './Boss'
import { Lock } from './Expeditions'

export function ArenaLeaders({ snap, monsters, onBack }: { snap: Snapshot; monsters: Monster[]; onBack: () => void }) {
  useBack(onBack)
  const seen = leadersSeen(snap.arenaWeeks)
  const won = leadersWon(snap.arenaWeeks, snap.arenaFights)
  const allNormal = specialsOpen(seen, monsters)
  const wins = (id: string) => snap.arenaFights.filter((f) => f.won && snap.arenaWeeks.find((w) => w.week_start === f.week_start)?.leader === id).length
  return (
    <main className="screen">
      <div className="bar">
        <button className="btn back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <h1 className="bar-title">Arenaleiter</h1>
      </div>
      <span className="fine left">
        {won.size} von {LEADERS.length} besiegt. Spezial-Leiter kommen, wenn ihr alle normalen gesehen habt, die gerade kommen können.
      </span>
      <div className="lead-grid">
        {LEADERS.map((l) => {
          if (l.special && !allNormal && !seen.has(l.id))
            return (
              <div key={l.id} className="lcard locked special">
                <span className="lpic">
                  <Lock size={26} />
                </span>
                <b>Spezial</b>
                <small>nach allen normalen</small>
              </div>
            )
          const [a, b] = leaderColors(l.elements)
          const known = seen.has(l.id)
          const n = wins(l.id)
          return (
            <div key={l.id} className={`lcard${l.special ? ' special' : ''}${known ? '' : ' unknown'}`}>
              <span className="lpic" style={{ background: `linear-gradient(140deg, ${a}, ${b})` }}>
                <img src={leaderImg(l)} alt="" />
                <span className="lels">
                  {l.elements.map((e) => (
                    <Dot key={e} e={e} size={16} />
                  ))}
                </span>
              </span>
              {n > 0 && <span className="stampw">BESIEGT</span>}
              <b>{known ? l.name : '???'}</b>
              <small>{n > 0 ? (n === 1 ? '1 Sieg' : `${n} Siege`) : known ? 'noch unbesiegt' : 'noch nicht da'}</small>
            </div>
          )
        })}
      </div>
      <h2 className="section-title">Unique-Monster</h2>
      <div className="uniq">
        {LEADERS.filter((l) => l.special).flatMap((l) =>
          l.uniques!.map((u) =>
            won.has(l.id) ? (
              <div key={u.id} className="u">
                <img src={`/arena/unique-${u.id}.webp`} alt="" />
                <span>
                  {u.name}
                  <small>
                    {u.elements.map((e) => (
                      <Dot key={e} e={e} size={14} />
                    ))}
                  </small>
                </span>
              </div>
            ) : (
              <div key={u.id} className="u">
                <span className="q">?</span>
                <small>{seen.has(l.id) || allNormal ? `${l.name} besiegen` : 'Spezial-Leiter besiegen'}</small>
              </div>
            ),
          ),
        )}
      </div>
      <span className="fine">Unique-Monster kämpfen nur für ihren Leiter. Ihr könnt sie nicht wählen.</span>
    </main>
  )
}
