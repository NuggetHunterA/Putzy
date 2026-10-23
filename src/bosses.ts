// Event-Bosse: Zu jedem Event mit mindestens 3 Tagen taucht ein Schmutz-Boss auf. Jede Erledigung im Event schwächt ihn
// (Schaden = XP, Aufgaben im Event-Element doppelt), ab dem letzten Tag tritt ein Trupp aus drei Monstern gegen ihn an.
// Das Ergebnis wird beim Start aus der zufälligen Kampf-id gewürfelt und gespeichert (Konzept: bosse.md im Projektordner).
import type { Done, Task } from './db'
import { chance } from './eggs'
import { eventFor, type AppEvent } from './events'
import { advantageAgainst, beatenBy } from './expeditions'
import { STANDING, dayString, levelFor, type Element, type Monster, type Person } from './game'
import { addDays } from './streak'

export type Boss = { event: AppEvent; name: string; element: Element; slug: string }

// Element: das, was vom Bonus-Element des Events geschlagen wird.
export const BOSSES: Boss[] = [
  { event: 'fruehjahrsputz', name: 'Fettfürst', element: 'feuer', slug: 'fettfuerst' },
  { event: 'ostern', name: 'Muffelmief', element: 'luft', slug: 'muffelmief' },
  { event: 'neujahr_cn', name: 'Reiskleber', element: 'natur', slug: 'reiskleber' },
  { event: 'sonnenwende', name: 'Pfützengroll', element: 'wasser', slug: 'pfuetzengroll' },
  { event: 'hochsommer', name: 'Grillgrausel', element: 'feuer', slug: 'grillgrausel' },
  { event: 'herbstanfang', name: 'Schlierenschreck', element: 'licht', slug: 'schlierenschreck' },
  { event: 'erntedank', name: 'Schwirrschwarm', element: 'luft', slug: 'schwirrschwarm' },
  { event: 'halloween', name: 'Schleimgeist', element: 'wasser', slug: 'schleimgeist' },
  { event: 'weihnachten', name: 'Knisterknäuel', element: 'luft', slug: 'knisterknaeuel' },
  { event: 'silvester', name: 'Konfettikrake', element: 'licht', slug: 'konfettikrake' },
]
export const bossFor = (event: AppEvent) => BOSSES.find((b) => b.event === event)
export const bossImg = (b: Boss) => `/boss/${b.slug}.webp`
// Aufgaben dieses Elements machen doppelten Schaden: das Bonus-Element des Events.
export const weakness = (b: Boss) => beatenBy(b.element)

export const LP_PER_DAY = 120
// Der Boss fällt höchstens auf diesen Anteil seiner LP.
export const FLOOR = 0.1
export const BOSS_POINTS = 6
// So viele Tage nach dem Event lässt sich der Kampf noch auslösen.
export const GRACE_DAYS = 2

// Gespeicherter Kampf (Tabelle boss_fights). damage und lp halten den Stand beim Start fest.
export type Fight = { id: string; event: AppEvent; year: number; monsters: string[]; started_by: Person; started_at: string; won: boolean; chance: number; damage: number; lp: number }

// Jahr, zu dem ein Tag des Events gehört: Silvester zählt zum Jahr, in dem es beginnt.
const seasonYear = (event: AppEvent, d: Date) => (event === 'silvester' && d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear())
const fromDay = (day: string) => {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

// Alle Tage (YYYY-MM-DD), an denen das Event in diesem Jahr wirklich läuft. Tage mit einem Event mit Vorrang fehlen.
export function bossDays(event: AppEvent, year: number) {
  const days: string[] = []
  for (let d = new Date(year, 0, 1, 12); d.getFullYear() <= year || d.getMonth() === 0; d.setDate(d.getDate() + 1)) {
    if (eventFor(d) === event && seasonYear(event, d) === year) days.push(dayString(d))
  }
  return days
}

export const lpFor = (days: string[]) => LP_PER_DAY * days.length

export type BossTime = { boss: Boss; year: number; days: string[]; lastDay: string; open: string }

// Der Boss, dessen Zeit gerade läuft: vom ersten Event-Tag bis GRACE_DAYS nach dem letzten.
export function currentBoss(now: Date): BossTime | null {
  const today = dayString(now)
  for (let back = 0; back <= GRACE_DAYS; back++) {
    const d = fromDay(addDays(today, -back))
    const event = eventFor(d)
    const boss = event && bossFor(event)
    if (!boss) continue
    const year = seasonYear(boss.event, d)
    const days = bossDays(boss.event, year)
    const lastDay = days.at(-1)!
    if (today <= addDays(lastDay, GRACE_DAYS)) return { boss, year, days, lastDay, open: addDays(lastDay, GRACE_DAYS) }
  }
  return null
}

// Erster Tag des nächsten Auftritts ab heute, oder null (z. B. Chinesisches Neujahr nach der Tabelle in events.ts).
export function nextVisit(boss: Boss, now: Date) {
  const today = dayString(now)
  for (const year of [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]) {
    const first = bossDays(boss.event, year)[0]
    if (first && first >= today) return first
  }
  return null
}

const elementOf = (c: Done, tasks: Task[]) =>
  c.task_id ? tasks.find((t) => t.id === c.task_id)?.element : c.standing ? STANDING.find((s) => s.id === c.standing)?.element : undefined

// Schaden je Person aus den Erledigungen an den Event-Tagen, vor dem Kampf. Noch nicht gedeckelt.
export function damageBy(t: BossTime, done: Done[], tasks: Task[], fight?: Fight) {
  const by: Record<Person, number> = { adrian: 0, ulrike: 0 }
  const double = weakness(t.boss)
  for (const c of done) {
    if (!t.days.includes(dayString(new Date(c.done_at))) || (fight && c.done_at >= fight.started_at)) continue
    by[c.person] += c.xp * (elementOf(c, tasks) === double ? 2 : 1)
  }
  return by
}

// Gedeckelter Schaden: Der Boss behält immer FLOOR seiner LP.
export const capped = (damage: number, lp: number) => Math.min(damage, Math.round(lp * (1 - FLOOR)))

// Siegchance in ganzen Prozent mit Aufschlüsselung: 5 + 50 × geschwächter Anteil + Ø-Level ÷ 30 × 20 + 5 je Element-Vorteil
// (−5 je Nachteil), zwischen 5 und 85.
export function winChance(boss: Boss, damage: number, lp: number, trupp: Monster[], monsterXp: Record<string, number>) {
  const weak = Math.round((50 * capped(damage, lp)) / lp)
  const avg = trupp.reduce((n, m) => n + levelFor(monsterXp[m.id] ?? 0), 0) / Math.max(1, trupp.length)
  const level = Math.round((avg / 30) * 20)
  const adv = advantageAgainst([boss.element], trupp, monsterXp)
  return { weak, avg, level, adv, total: Math.min(85, Math.max(5, 5 + weak + level + 5 * adv)) }
}

// Vorschlag für den Trupp: die drei Monster mit dem größten eigenen Beitrag (Level und Element).
export function bestTrupp(boss: Boss, monsters: Monster[], monsterXp: Record<string, number>) {
  const score = (m: Monster) => (levelFor(monsterXp[m.id] ?? 0) / 30) * 20 / 3 + 5 * advantageAgainst([boss.element], [m], monsterXp)
  return [...monsters].sort((a, b) => score(b) - score(a)).slice(0, 3)
}

// Wurf aus der zufälligen Kampf-id: Er steht erst beim Start fest und wird mit dem Kampf gespeichert.
export const rollWin = (id: string, percent: number) => chance(`boss:${id}`) < percent / 100

export const fightOf = (fights: Fight[], t: BossTime) => fights.find((f) => f.event === t.boss.event && f.year === t.year)
export const bossPoints = (fights: Fight[]) => fights.filter((f) => f.won).length * BOSS_POINTS
// Wie viele verschiedene Bosse schon einmal besiegt wurden.
export const bossesWon = (fights: Fight[]) => BOSSES.filter((b) => fights.some((f) => f.event === b.event && f.won)).length

// Kämpfe, deren Szene diese Person noch nicht gesehen hat, ältester zuerst.
export const unseenFights = (fights: Fight[], seen: { person: Person; fight: string }[], person: Person) =>
  fights.filter((f) => !seen.some((s) => s.person === person && s.fight === f.id)).sort((a, b) => a.started_at.localeCompare(b.started_at))

// Stand des laufenden Bosses für Startseite und Boss-Seite: LP, Schaden (gedeckelt; nach einem Sieg alle LP, nach einer
// Flucht der beim Start festgehaltene) und der Kampf.
export function bossState(now: Date, done: Done[], tasks: Task[], fights: Fight[]) {
  const t = currentBoss(now)
  if (!t) return null
  const fight = fightOf(fights, t)
  const by = damageBy(t, done, tasks, fight)
  const lp = lpFor(t.days)
  return { ...t, lp, by, damage: fight ? (fight.won ? lp : fight.damage) : capped(by.adrian + by.ulrike, lp), fight }
}
export type BossState = NonNullable<ReturnType<typeof bossState>>
// Ab dem letzten Event-Tag lässt sich der Kampf auslösen, solange es noch keinen gibt.
export const canFight = (s: BossState, now: Date) => !s.fight && dayString(now) >= s.lastDay
// Treffer zählen nur an Event-Tagen und vor dem Kampf.
export const hitsCount = (s: BossState, now: Date) => !s.fight && s.days.includes(dayString(now))
// Wochentag und Datum, z. B. „Sa., 31.10.“.
export const shortDay = (day: string) => fromDay(day).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })
