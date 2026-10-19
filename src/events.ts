// Event-Designs der Startseite: zu bestimmten Tagen im Jahr bekommt die Startseite ein eigenes Thema (siehe events.css).
// Jedes Event hat dazu ein Bonus-Element: Aufgaben dieses Elements bringen in der Zeit mehr XP (EVENT_BONUS in game.ts).
import type { Element } from './game'

export type AppEvent =
  | 'hochzeitstag'
  | 'ostern'
  | 'neujahr_cn'
  | 'fruehjahrsputz'
  | 'maifeiertag'
  | 'sonnenwende'
  | 'jahrestag'
  | 'hochsommer'
  | 'herbstanfang'
  | 'erntedank'
  | 'halloween'
  | 'weihnachten'
  | 'advent'
  | 'silvester'

// Ostersonntag nach dem gregorianischen Algorithmus von Gauß (Meeus/Jones/Butcher).
export function easter(year: number) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const h = (19 * a + b - Math.floor(b / 4) - Math.floor((8 * b + 13) / 25) + 15) % 30
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - (c % 4)) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

const mmdd = (d: Date) => (d.getMonth() + 1) * 100 + d.getDate()
// Von bis einschließlich, als MMTT (z. B. 1028 für den 28.10.).
const fixed = (from: number, to = from) => (d: Date) => mmdd(d) >= from && mmdd(d) <= to
// Tage relativ zum Ostersonntag, von bis einschließlich.
const aroundEaster = (from: number, to: number) => (d: Date) => {
  const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - easter(d.getFullYear()).getTime()) / 864e5)
  return diff >= from && diff <= to
}

// Chinesisches Neujahr folgt dem Mondkalender, deshalb als Liste (Monat, Tag) je Jahr.
const NEUJAHR_CN: Record<number, [number, number]> = {
  2027: [2, 6], 2028: [1, 26], 2029: [2, 13], 2030: [2, 3], 2031: [1, 23],
  2032: [2, 11], 2033: [1, 31], 2034: [2, 19], 2035: [2, 8],
}
// Tage von ref bis d (beide als Kalendertage).
const daysFrom = (ref: Date, d: Date) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - ref.getTime()) / 864e5)
// Neujahrstag und die drei Tage danach.
const neujahrCn = (d: Date) => {
  const md = NEUJAHR_CN[d.getFullYear()]
  if (!md) return false
  const diff = daysFrom(new Date(d.getFullYear(), md[0] - 1, md[1]), d)
  return diff >= 0 && diff <= 3
}
// Erster Sonntag im Oktober und die zwei Tage davor.
const erntedank = (d: Date) => {
  const sunday = new Date(d.getFullYear(), 9, 1 + ((7 - new Date(d.getFullYear(), 9, 1).getDay()) % 7))
  const diff = daysFrom(sunday, d)
  return diff >= -2 && diff <= 0
}

// Reihenfolge = Vorrang, wenn zwei Events auf denselben Tag fallen.
const EVENTS: [AppEvent, (d: Date) => boolean, Element][] = [
  ['hochzeitstag', fixed(414), 'feuer'],
  ['ostern', aroundEaster(-2, 1), 'natur'], // Karfreitag bis Ostermontag
  ['neujahr_cn', neujahrCn, 'feuer'],
  ['fruehjahrsputz', fixed(320, 326), 'wasser'],
  ['maifeiertag', fixed(430, 501), 'natur'],
  ['sonnenwende', fixed(618, 622), 'licht'],
  ['jahrestag', fixed(601), 'licht'],
  ['hochsommer', fixed(801, 804), 'wasser'],
  ['herbstanfang', fixed(922, 924), 'luft'],
  ['erntedank', erntedank, 'natur'],
  ['halloween', fixed(1028, 1031), 'licht'],
  ['weihnachten', fixed(1220, 1226), 'natur'],
  ['advent', (d) => d.getDay() === 0 && fixed(1127, 1224)(d), 'feuer'], // die vier Adventssonntage
  ['silvester', (d) => fixed(1231)(d) || fixed(101)(d), 'luft'], // bis Neujahr
]

// Name für die Bonus-Plakette auf der Startseite.
export const EVENT_LABEL: Record<AppEvent, string> = {
  hochzeitstag: '💍 Hochzeitstag',
  ostern: '🐣 Ostern',
  neujahr_cn: '🐉 Chin. Neujahr',
  fruehjahrsputz: '🧽 Frühjahrsputz',
  maifeiertag: '🌼 Maifeiertag',
  sonnenwende: '☀️ Sonnenwende',
  jahrestag: '💛 Jahrestag',
  hochsommer: '🏖️ Hochsommer',
  herbstanfang: '🍂 Herbstanfang',
  erntedank: '🌾 Erntedank',
  halloween: '🎃 Halloween',
  weihnachten: '🎄 Weihnachten',
  advent: '🕯️ Advent',
  silvester: '🎆 Silvester',
}

const find = (date: Date) => EVENTS.find(([, on]) => on(date))
export const eventFor = (date: Date): AppEvent | null => find(date)?.[0] ?? null
export const eventBonus = (date: Date): Element | null => find(date)?.[2] ?? null
// Erster bzw. letzter Tag des Events, das an date läuft.
const edge = (date: Date, step: 1 | -1) => {
  const event = eventFor(date)
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  while (event && eventFor(new Date(day.getFullYear(), day.getMonth(), day.getDate() + step)) === event) day.setDate(day.getDate() + step)
  return day
}
export const eventStart = (date: Date) => edge(date, -1)
export const eventEnd = (date: Date) => edge(date, 1)
