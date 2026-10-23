// Stempelheft: alle Stempel in Gruppen, vier pro Reihe. Antippen öffnet ein Blatt mit Bedingung, Belohnung und wer ihn verdient hat.
import { useState } from 'react'
import { useBack } from './back'
import type { Snapshot } from './db'
import { PEOPLE, levelFor, monsterById, stageFor } from './game'
import { StampMark } from './StampMark'
import { hidden, rewardText, stamps, type Earned, type Facts, type Stamp } from './stamps'

// Gleiche Schräglage für denselben Stempel bei jedem Öffnen, zwischen -10 und 10 Grad.
export function tilt(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return (Math.abs(h) % 21) - 10
}

const short = (at: string) => new Date(at).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' })
const long = (at: string) => new Date(at).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })
export const byWhom = (e: Earned) => (e.person ? PEOPLE[e.person] : 'Ihr beide')

// Namen in der aktuellen Stufe, „A, B und C“.
export function monsterNames(ids: string[], monsterXp: Record<string, number>) {
  const names = ids.map((id) => {
    const m = monsterById(id)
    return m.stages[stageFor(m, levelFor(monsterXp[id] ?? 0))].replace('­', '')
  })
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} und ${names.at(-1)}` : names[0]
}

export function Stamps({ snap, facts, onBack }: { snap: Snapshot; facts: Facts; onBack: () => void }) {
  useBack(onBack)
  const [open, setOpen] = useState<Stamp | null>(null)
  const all = stamps(snap.tasks, snap.stamps)
  const earned = (s: Stamp) => snap.stamps.find((e) => e.id === s.id)
  const groups = [...new Set(all.map((s) => s.group))]
  const isTask = (g: string) => g !== 'Meilensteine' && g !== 'Elemente' && g !== 'Bosse'

  return (
    <main className="screen">
      <div className="bar">
        <button className="btn back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <h1 className="bar-title">Stempelheft</h1>
      </div>
      <div className="dex-count">
        {snap.stamps.length} von {all.length} Stempeln
        <span className="xpbar">
          <span style={{ width: `${(snap.stamps.length / all.length) * 100}%`, background: 'var(--accent)' }} />
        </span>
      </div>
      {groups.map((g, i) => (
        <section key={g} className="sh-group">
          {!isTask(g) && <h2 className="section-title">{g}</h2>}
          {isTask(g) && !isTask(groups[i - 1]) && <h2 className="section-title">Aufgaben</h2>}
          {isTask(g) && <p className="sh-room">{g}</p>}
          <div className="sh-grid">
            {all
              .filter((s) => s.group === g)
              .map((s) => (
                <Cell key={s.id} s={s} e={earned(s)} hide={!earned(s) && hidden(s, facts)} n={s.count(facts)} onOpen={() => setOpen(s)} />
              ))}
          </div>
        </section>
      ))}
      {open && <Sheet s={open} e={earned(open)} hide={!earned(open) && hidden(open, facts)} n={open.count(facts)} monsterXp={snap.monsterXp} onClose={() => setOpen(null)} />}
    </main>
  )
}

function Cell({ s, e, hide, n, onOpen }: { s: Stamp; e?: Earned; hide: boolean; n: number; onOpen: () => void }) {
  return (
    <button className="sh-cell" onClick={onOpen}>
      <StampMark stamp={s} open={!e} hide={hide} tilt={tilt(s.id)} />
      <span className="sh-name">{hide ? '???' : s.name}</span>
      {e ? (
        <span className="sh-sub">
          {byWhom(e)} · {short(e.earned_at)}
        </span>
      ) : hide ? (
        <span className="sh-sub">geheim</span>
      ) : (
        <>
          {s.goal > 1 && (
            <span className="sh-prog">
              <span style={{ width: `${Math.min(1, n / s.goal) * 100}%` }} />
            </span>
          )}
          <span className="sh-sub">{s.goal > 1 ? `${Math.min(n, s.goal).toLocaleString('de-DE')} / ${s.goal.toLocaleString('de-DE')}` : 'offen'}</span>
        </>
      )}
    </button>
  )
}

function Sheet({ s, e, hide, n, monsterXp, onClose }: { s: Stamp; e?: Earned; hide: boolean; n: number; monsterXp: Record<string, number>; onClose: () => void }) {
  useBack(onClose)
  return (
    <div className="sh-dim" onClick={onClose}>
      <div className="sh-sheet" onClick={(ev) => ev.stopPropagation()}>
        <StampMark stamp={s} open={!e} hide={hide} size={130} tilt={tilt(s.id)} />
        <b className="sh-title">{hide ? '???' : s.name}</b>
        <p className="sh-text">{hide ? 'Ein Geheimnis, das ihr erst noch entdecken müsst.' : s.text}</p>
        {!hide && <span className="sh-chip" style={{ background: s.reward ? s.color : 'var(--ground)', color: s.reward ? '#fff' : 'var(--ink)' }}>{rewardText(s.reward)}</span>}
        {e ? (
          <p className="sh-meta">
            {e.person ? `Ausgelöst von ${PEOPLE[e.person]}` : 'Von euch beiden verdient'} am {long(e.earned_at)}.
            {e.monsters.length > 0 && (
              <>
                <br />
                {monsterNames(e.monsters, monsterXp)} {e.monsters.length > 1 ? 'haben je' : 'hat'} {e.xp} XP bekommen.
              </>
            )}
          </p>
        ) : (
          !hide && s.goal > 1 && <p className="sh-meta">Bisher {Math.min(n, s.goal).toLocaleString('de-DE')} von {s.goal.toLocaleString('de-DE')}.</p>
        )}
        <button className="btn sh-close" onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  )
}
