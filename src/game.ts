// Spielregeln von Putzy: Elemente, Monster, XP, Level und Fälligkeit.

export type Element = 'wasser' | 'feuer' | 'natur' | 'luft' | 'licht'
export type Effort = 'K' | 'M' | 'G'
export type Person = 'adrian' | 'ulrike'

export const PEOPLE: Record<Person, string> = { adrian: 'Adrian', ulrike: 'Ulrike' }

export const ELEMENTS: Record<Element, { name: string; soft: string; strong: string }> = {
  wasser: { name: 'Wasser', soft: '#7FD8F7', strong: '#3EC1F3' },
  feuer: { name: 'Feuer', soft: '#FF8A6B', strong: '#FF5A3C' },
  natur: { name: 'Natur', soft: '#B7E39A', strong: '#5BC44A' },
  luft: { name: 'Luft', soft: '#E9D5FF', strong: '#9B7BFF' },
  licht: { name: 'Licht', soft: '#FFE89A', strong: '#FFD23F' },
}

export type Monster = {
  id: string
  element: Element
  stages: [string, string, string]
  files: [string, string, string]
  move: string
}

const monster = (id: string, element: Element, move: string, names: [string, string, string], slugs: [string, string, string]): Monster => ({
  id,
  element,
  move,
  stages: names,
  files: slugs.map((s, i) => `/monster/${id}-${i + 1}-${s}.webp`) as [string, string, string],
})

export const MONSTERS: Monster[] = [
  monster('2', 'wasser', 'Gezeitenstoß', ['Plitsch', 'Platschkoi', 'Tsunadra'], ['plitsch', 'platschkoi', 'tsunadra']),
  monster('4', 'wasser', 'Perlschaum-Wirbel', ['Schaumi', 'Blubbro', 'Spumagon'], ['schaumi', 'blubbro', 'spumagon']),
  monster('5', 'feuer', 'Glut-Schrubb', ['Funki', 'Glutfuchs', 'Infernyx'], ['funki', 'glutfuchs', 'infernyx']),
  monster('6', 'natur', 'Moos-Sammler', ['Krümel', 'Kompostkröte', 'Gaiamoos'], ['kruemel', 'kompostkroete', 'gaiamoos']),
  monster('3', 'luft', 'Taifun-Sog', ['Fluffi', 'Wirbelwusel', 'Taifunox'], ['fluffi', 'wirbelwusel', 'taifunox']),
  monster('7', 'luft', 'Kuschel-Zyklon', ['Flausch', 'Wollwächter', 'Kaschmira'], ['flausch', 'wollwaechter', 'kaschmira']),
  monster('1', 'licht', 'Mondglanz-Pfote', ['Miezo', 'Katzelot', 'Sphinxar'], ['miezo', 'katzelot', 'sphinxar']),
  monster('8', 'licht', 'Prisma-Ordnung', ['Funkel', 'Prismabot', 'Kristallos'], ['funkel', 'prismabot', 'kristallos']),
]

export const monsterById = (id: string) => MONSTERS.find((m) => m.id === id)!

export const EFFORT_XP: Record<Effort, number> = { K: 10, M: 25, G: 50 }
export const ELEMENT_BONUS = 1.5
// Von Level n auf n+1 braucht ein Monster LEVEL_FACTOR × n XP.
export const LEVEL_FACTOR = 30
export const STAGE_LEVELS = [10, 25]

export function xpFor(effort: Effort, taskElement: Element, monsterElement: Element) {
  return Math.round(EFFORT_XP[effort] * (taskElement === monsterElement ? ELEMENT_BONUS : 1))
}

// Gesamt-XP, die man für ein Level braucht: Summe von 30 × n für n = 1 … level-1.
export const xpForLevel = (level: number) => (LEVEL_FACTOR * level * (level - 1)) / 2

export function levelFor(xp: number) {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  return level
}

export const stageFor = (level: number) => (level >= STAGE_LEVELS[1] ? 2 : level >= STAGE_LEVELS[0] ? 1 : 0)

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
