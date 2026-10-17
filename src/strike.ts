import { useRef } from 'react'
import { attack } from './fx'
import { levelFor, monsterById, stageFor, xpOf, type Person, type Work } from './game'
import type { Snapshot } from './db'

// Abhaken mit Angriff: Offene Aufgabe: erst greift dein Monster aus myBadge an, beim Treffer wird sie abgehakt (hit).
// Erledigte: sofort rückgängig.
export function useStrike(snap: Snapshot, person: Person, onAttackEnd: () => void) {
  const myBadge = useRef<HTMLSpanElement>(null)
  const busy = useRef(false)
  const myPick = snap.picks.find((p) => p.person === person)
  const strike = async (done: boolean, work: Work, dot: HTMLElement, hit: () => void) => {
    if (busy.current) return
    const badge = myBadge.current
    if (done || !myPick || !badge) return hit()
    busy.current = true
    const m = monsterById(myPick.monster)
    try {
      await attack({
        from: badge.querySelector('img')!,
        to: dot,
        bar: badge.parentElement!.querySelector('.xpbar')!,
        src: m.files[stageFor(m, levelFor(snap.monsterXp[m.id] ?? 0))],
        element: m.element,
        taskElement: work?.element,
        xp: xpOf(work, m.element),
        onHit: hit,
      })
    } finally {
      busy.current = false
      onAttackEnd()
    }
  }
  return { myBadge, strike }
}
