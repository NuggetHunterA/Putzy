// Spielregeln von Putzy: Elemente, Monster, XP, Level und Fälligkeit.

export type Element = 'wasser' | 'feuer' | 'natur' | 'luft' | 'licht'
export type Effort = 'K' | 'M' | 'G'
export type Person = 'adrian' | 'ulrike'

export const PEOPLE: Record<Person, string> = { adrian: 'Adrian', ulrike: 'Ulrike' }

// soft/strong: Elementfarbe. bg/hi: Gegenfarbe als Hintergrund hinter dem Monster, damit es sich abhebt.
export const ELEMENTS: Record<Element, { name: string; soft: string; strong: string; bg: string; hi: string }> = {
  wasser: { name: 'Wasser', soft: '#7FD8F7', strong: '#3EC1F3', bg: '#FFC93C', hi: '#FFE89A' },
  feuer: { name: 'Feuer', soft: '#FF8A6B', strong: '#FF5A3C', bg: '#1F2B66', hi: '#3A4C9E' },
  natur: { name: 'Natur', soft: '#B7E39A', strong: '#5BC44A', bg: '#B9A3F5', hi: '#E1D6FF' },
  luft: { name: 'Luft', soft: '#E9D5FF', strong: '#9B7BFF', bg: '#8FE3C6', hi: '#D2F7EA' },
  licht: { name: 'Licht', soft: '#FFE89A', strong: '#FFD23F', bg: '#3B2A6B', hi: '#6A52B0' },
}

export const backdrop = (e: Element) => `radial-gradient(circle at 50% 40%, ${ELEMENTS[e].hi} 0 35%, ${ELEMENTS[e].bg} 75%)`

// stages: Namen; \u00AD ist ein weiches Trennzeichen, damit lange Namen in schmalen Feldern sauber umbrechen.
// levels: ab welchem Level die nächste Stufe kommt, also immer eine Zahl weniger als Stufen.
export type Monster = {
  id: string
  element: Element
  stages: string[]
  files: string[]
  levels: number[]
  move: string
}

const monster = (id: string, element: Element, move: string, names: string[], slugs: string[], levels = [10, 25]): Monster => ({
  id,
  element,
  move,
  stages: names,
  files: slugs.map((s, i) => `/monster/${id}-${i + 1}-${s}.webp`),
  levels,
})

export const MONSTERS: Monster[] = [
  monster('2', 'wasser', 'Gezeitenstoß', ['Plitsch', 'Platschkoi', 'Tsunadra'], ['plitsch', 'platschkoi', 'tsunadra']),
  monster('4', 'wasser', 'Perlschaum-Wirbel', ['Schaumi', 'Blubbro', 'Spumagon'], ['schaumi', 'blubbro', 'spumagon']),
  monster('5', 'feuer', 'Glut-Schrubb', ['Funki', 'Glutfuchs', 'Infernyx'], ['funki', 'glutfuchs', 'infernyx']),
  monster('9', 'feuer', 'Brutzel-Blitz', ['Kokeli', 'Salamandor'], ['kokeli', 'salamandor'], [15]),
  monster('6', 'natur', 'Moos-Sammler', ['Krümel', 'Kompost\u00ADkröte', 'Gaiamoos'], ['kruemel', 'kompostkroete', 'gaiamoos']),
  monster('10', 'natur', 'Gießkannen-Segen', ['Samsi', 'Sprössli', 'Blattwart', 'Arborius'], ['samsi', 'sproessli', 'blattwart', 'arborius'], [10, 20, 30]),
  monster('3', 'luft', 'Taifun-Sog', ['Fluffi', 'Wirbel\u00ADwusel', 'Taifunox'], ['fluffi', 'wirbelwusel', 'taifunox']),
  monster('7', 'luft', 'Kuschel-Zyklon', ['Flausch', 'Woll\u00ADwächter', 'Kaschmira'], ['flausch', 'wollwaechter', 'kaschmira']),
  monster('1', 'licht', 'Mondglanz-Pfote', ['Miezo', 'Katzelot', 'Sphinxar'], ['miezo', 'katzelot', 'sphinxar']),
  monster('8', 'licht', 'Prisma-Ordnung', ['Funkel', 'Prismabot', 'Kristallos'], ['funkel', 'prismabot', 'kristallos']),
]

export const monsterById = (id: string) => MONSTERS.find((m) => m.id === id)!

export const EFFORT_XP: Record<Effort, number> = { K: 10, M: 25, G: 50 }
// In der App heißt der Aufwand S/M/L, in der Datenbank K/M/G.
export const EFFORT_LABEL: Record<Effort, string> = { K: 'S', M: 'M', G: 'L' }
export const ELEMENT_BONUS = 1.25
// Von Level n auf n+1 braucht ein Monster LEVEL_BASE + LEVEL_STEP × n XP.
export const LEVEL_BASE = 130
export const LEVEL_STEP = 4
export const MAX_LEVEL = 30

export function xpFor(effort: Effort, taskElement: Element, monsterElement: Element) {
  return Math.round(EFFORT_XP[effort] * (taskElement === monsterElement ? ELEMENT_BONUS : 1))
}

// Gesamt-XP, die man für ein Level braucht: Summe von 130 + 4 × n für n = 1 … level-1.
export const xpForLevel = (level: number) => (level - 1) * LEVEL_BASE + (LEVEL_STEP * level * (level - 1)) / 2

export function levelFor(xp: number) {
  let level = 1
  while (level < MAX_LEVEL && xpForLevel(level + 1) <= xp) level++
  return level
}

export const stageFor = (m: Monster, level: number) => m.levels.filter((at) => level >= at).length

// Kalendertag (lokal) als Zahl, damit Tagesdifferenzen nicht an Sommerzeit scheitern.
const dayNumber = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)

export const sameDay = (a: Date, b: Date) => dayNumber(a) === dayNumber(b)

// Tage bis zur nächsten Fälligkeit, gezählt ab der letzten Erledigung. Nie erledigt = erste Fälligkeit (YYYY-MM-DD).
export function daysUntilDue(lastDone: Date | null, intervalDays: number, now: Date, firstDue: string) {
  if (!lastDone) {
    const [y, m, d] = firstDue.split('-').map(Number)
    return dayNumber(new Date(y, m - 1, d)) - dayNumber(now)
  }
  return dayNumber(lastDone) + intervalDays - dayNumber(now)
}

// Montag der aktuellen Woche als YYYY-MM-DD (lokale Zeit).
export function weekStart(now: Date) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Erste Fälligkeit einer neuen Aufgabe (YYYY-MM-DD): nach dem halben Intervall, abgerundet, bei 1 oder 2 Tagen heute.
export function firstDue(intervalDays: number, now: Date) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (intervalDays <= 2 ? 0 : Math.floor(intervalDays / 2)))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Einstellbare Intervalle in Tagen. − und + springen zur nächsten Stufe.
const INTERVAL_STEPS = [1, 2, 3, 7, 14, 30, 60, 90, 180, 365]

export const nextInterval = (days: number, dir: 1 | -1) =>
  (dir > 0 ? INTERVAL_STEPS.find((s) => s > days) : INTERVAL_STEPS.findLast((s) => s < days)) ?? days

export function intervalLabel(days: number) {
  if (days === 1) return 'täglich'
  if (days === 7) return 'jede Woche'
  if (days % 7 === 0) return `alle ${days / 7} Wochen`
  return `alle ${days} Tage`
}

export function dueLabel(days: number) {
  if (days < -1) return `${-days} Tage drüber`
  if (days === -1) return 'seit gestern'
  if (days === 0) return 'heute'
  if (days === 1) return 'morgen'
  return `in ${days} Tagen`
}
