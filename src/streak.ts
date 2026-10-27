// Streak: Ein Tag zählt, wenn an seinem Ende keine normale Aufgabe mehr fällig oder überfällig ist.
// Ständige und einmalige Aufgaben zählen nicht. Die Tage werden aus den Erledigungen nachgerechnet, damit auch
// ein Tag ohne fällige Aufgabe zählt, an dem niemand die App öffnet. Montags beginnt die Streak wieder bei 0,
// die längste Streak der Vorwoche gibt Punkte (0 bis 7) für das gemeinsame Konto. Ein Joker (arena.ts) schiebt
// die Fälligkeit einer Aufgabe um einen Tag.
import type { JokerUse } from './arena'
import type { Done, Task } from './db'
import { dayString, daysUntilDue } from './game'

// Erster Tag, der zählt: der Montag nach dem Start des Features.
export const STREAK_START = '2026-10-19'

// Gespeicherte Punkte einer abgeschlossenen Woche (Tabelle streak_weeks).
export type StreakWeek = { week_start: string; points: number }

const date = (day: string) => {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (day: string, n: number) => {
  const d = date(day)
  d.setDate(d.getDate() + n)
  return dayString(d)
}

// Erledigungstage (YYYY-MM-DD) pro Aufgabe, aufsteigend.
function doneDays(done: Done[]) {
  const days = new Map<string, string[]>()
  for (const c of done) if (c.task_id) days.set(c.task_id, [...(days.get(c.task_id) ?? []), dayString(new Date(c.done_at))])
  for (const list of days.values()) list.sort()
  return days
}

// Für jeden Tag der Woche (Mo bis So): geschafft oder nicht. Tage nach heute und vor dem Start zählen nicht.
export function weekDays(week: string, today: string, tasks: Task[], done: Done[], jokers: JokerUse[] = []) {
  const days = doneDays(done)
  return [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const day = addDays(week, i)
    if (day < STREAK_START || day > today) return false
    return tasks.every((t) => {
      const last = days.get(t.id)?.findLast((d) => d <= day)
      const joker = jokers.some((j) => j.task_id === t.id && j.anchor === (last ?? t.first_due)) ? 1 : 0
      return daysUntilDue(last ? date(last) : null, t.interval_days, date(day), t.first_due) + joker > 0
    })
  })
}

// Längste Streak einer Woche, gleich ihren Punkten.
export const longest = (days: boolean[]) => days.reduce<[number, number]>(([best, run], ok) => (ok ? [Math.max(best, run + 1), run + 1] : [best, 0]), [0, 0])[0]

// Aktuelle Streak: geschaffte Tage am Stück bis gestern, mit heute, sobald heute geschafft ist.
export function current(days: boolean[], todayIndex: number) {
  let n = 0
  for (let i = days[todayIndex] ? todayIndex : todayIndex - 1; i >= 0 && days[i]; i--) n++
  return n
}

// Abgeschlossene Wochen seit dem Start bis vor die laufende, älteste zuerst.
export function pastWeeks(week: string) {
  const weeks: string[] = []
  for (let w = STREAK_START; w < week; w = addDays(w, 7)) weeks.push(w)
  return weeks
}

// Punkte aller abgeschlossenen Wochen: gespeichert oder, falls noch nicht gespeichert, nachgerechnet.
export function weekPoints(week: string, saved: StreakWeek[], tasks: Task[], done: Done[], jokers: JokerUse[] = []) {
  return pastWeeks(week).map((w) => saved.find((s) => s.week_start === w) ?? { week_start: w, points: longest(weekDays(w, addDays(w, 6), tasks, done, jokers)) })
}
