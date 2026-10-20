// Wochenrückblick: was die Monster einer Woche an XP, Level, Entwicklung und Aufgaben pro Element geschafft haben.
// Alles wird aus den gespeicherten Erledigungen, Stempel-Boni und der Monsterwahl berechnet, es gibt keine eigene Tabelle.
import type { Completion, Pick, Task } from './db'
import type { Earned } from './stamps'
import { PEOPLE, STANDING, TASK_ELEMENTS, levelFor, monsterById, stageFor, weekStart, type Element, type Monster, type Person } from './game'

// Einmalige Aufgaben haben kein Element und bekommen eine eigene Zeile.
export type Kind = Element | 'einmalig'
export const KINDS: Kind[] = [...TASK_ELEMENTS, 'einmalig']

export type MonsterWeek = {
  person: Person
  monster: Monster
  xp: number
  levelBefore: number
  levelAfter: number
  stageBefore: number
  stageAfter: number
  tasks: Record<Kind, number>
}

// Element einer Erledigung; null bei einer gelöschten Aufgabe (zählt dann nur in die XP).
function kindOf(c: Completion, tasks: Task[]): Kind | null {
  if (c.oneoff) return 'einmalig'
  if (c.standing) return STANDING.find((s) => s.id === c.standing)?.element ?? null
  return tasks.find((t) => t.id === c.task_id)?.element ?? null
}

const weekOf = (c: Completion) => weekStart(new Date(c.done_at))

// Ein Eintrag pro Person, die in der Woche ein Monster hatte, in der Reihenfolge von PEOPLE.
// Stempel-Boni zählen zur XP der Woche, in der der Stempel kam, Team-Boni zur Woche der Erledigung.
export function weekReview(week: string, picks: Pick[], completions: Completion[], tasks: Task[], stamps: Earned[] = []): MonsterWeek[] {
  return (Object.keys(PEOPLE) as Person[]).flatMap((person) => {
    const pick = picks.find((p) => p.week_start === week && p.person === person)
    if (!pick) return []
    const monster = monsterById(pick.monster)
    const own = completions.filter((c) => c.monster === monster.id)
    const bonus = stamps.filter((e) => e.monsters.includes(monster.id))
    const team = completions.filter((c) => c.team.includes(monster.id))
    const bonusXp = (keep: (w: string) => boolean) =>
      bonus.filter((e) => keep(weekStart(new Date(e.earned_at)))).reduce((n, e) => n + e.xp, 0) + team.filter((c) => keep(weekOf(c))).reduce((n, c) => n + c.team_xp, 0)
    const before = own.filter((c) => weekOf(c) < week).reduce((n, c) => n + c.xp, 0) + bonusXp((w) => w < week)
    const done = own.filter((c) => weekOf(c) === week)
    const xp = done.reduce((n, c) => n + c.xp, 0) + bonusXp((w) => w === week)
    const counts = Object.fromEntries(KINDS.map((k) => [k, 0])) as Record<Kind, number>
    for (const c of done) {
      const k = kindOf(c, tasks)
      if (k) counts[k]++
    }
    const levelBefore = levelFor(before)
    const levelAfter = levelFor(before + xp)
    return [{ person, monster, xp, levelBefore, levelAfter, stageBefore: stageFor(monster, levelBefore), stageAfter: stageFor(monster, levelAfter), tasks: counts }]
  })
}

// Stempel, die in dieser Woche verdient wurden.
export const weekStamps = (week: string, stamps: Earned[]) => stamps.filter((e) => weekStart(new Date(e.earned_at)) === week).length

// Wochen mit Monsterwahl, neueste zuerst.
export const reviewWeeks = (picks: Pick[]) => [...new Set(picks.map((p) => p.week_start))].sort().reverse()

// Montag der Vorwoche als YYYY-MM-DD.
export function previousWeek(week: string) {
  const [y, m, d] = week.split('-').map(Number)
  return weekStart(new Date(y, m - 1, d - 7))
}

// Zeitraum Montag bis Sonntag, z. B. „12.–18.10.“ oder „28.09.–04.10.“.
export function weekLabel(week: string) {
  const [y, m, d] = week.split('-').map(Number)
  const end = new Date(y, m - 1, d + 6)
  const pad = (n: number) => String(n).padStart(2, '0')
  const to = `${pad(end.getDate())}.${pad(end.getMonth() + 1)}.`
  return end.getMonth() + 1 === m ? `${pad(d)}.–${to}` : `${pad(d)}.${pad(m)}.–${to}`
}
