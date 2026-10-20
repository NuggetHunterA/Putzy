// Team-Bonus im Event: Unten fährt eine Leiste herein, die Monster mit Bonus ploppen nacheinander mit „+5“ auf,
// dann fährt sie wieder weg. Blockiert nichts, man kann weiter abhaken.
import { ELEMENTS, TEAM_BONUS, backdrop, levelFor, stageFor, type Element, type Monster } from './game'

export type Team = { key: number; element: Element; monsters: Monster[]; monsterXp: Record<string, number> }

// Mehr passen auf schmalen Handys nicht in eine Reihe, der Rest steht als Zahl daneben.
const MAX_SHOWN = 6

export function TeamBar({ team, onDone }: { team: Team; onDone: () => void }) {
  const look = ELEMENTS[team.element]
  const rest = team.monsters.length - MAX_SHOWN
  return (
    <div className="team-bar" role="status" onAnimationEnd={(e) => e.animationName === 'team-out' && onDone()}>
      <div className="team-head">
        <b style={{ color: look.strong }}>✨ Team-Bonus</b>
        <span>
          {look.name}-Monster +{TEAM_BONUS} XP
        </span>
      </div>
      <div className="team-mons">
        {team.monsters.slice(0, MAX_SHOWN).map((m, i) => (
          <span key={m.id} className="team-mon" style={{ animationDelay: `${0.35 + i * 0.11}s` }}>
            <span className="team-round" style={{ background: backdrop(m.element) }}>
              <img src={m.files[stageFor(m, levelFor((team.monsterXp[m.id] ?? 0) + TEAM_BONUS))]} alt={m.stages[0]} />
            </span>
            <span className="team-plus">+{TEAM_BONUS}</span>
          </span>
        ))}
        {rest > 0 && <span className="team-more">+{rest}</span>}
      </div>
    </div>
  )
}
