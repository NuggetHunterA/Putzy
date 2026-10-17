// Event-Designs der Startseite: zu bestimmten Tagen im Jahr bekommt die Startseite ein eigenes Thema (siehe events.css).
export type AppEvent =
  | 'hochzeitstag'
  | 'ostern'
  | 'valentinstag'
  | 'fasching'
  | 'fruehjahrsputz'
  | 'sonnenwende'
  | 'jahrestag'
  | 'hochsommer'
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

// Reihenfolge = Vorrang, wenn zwei Events auf denselben Tag fallen.
const EVENTS: [AppEvent, (d: Date) => boolean][] = [
  ['hochzeitstag', fixed(414)],
  ['ostern', aroundEaster(-2, 1)], // Karfreitag bis Ostermontag
  ['valentinstag', fixed(214)],
  ['fasching', aroundEaster(-52, -46)], // Weiberfastnacht bis Aschermittwoch
  ['fruehjahrsputz', fixed(320, 326)],
  ['sonnenwende', fixed(621)],
  ['jahrestag', fixed(601)],
  ['hochsommer', fixed(801, 804)],
  ['halloween', fixed(1028, 1031)],
  ['weihnachten', fixed(1220, 1226)],
  ['advent', (d) => d.getDay() === 0 && fixed(1127, 1224)(d)], // die vier Adventssonntage
  ['silvester', (d) => fixed(1231)(d) || fixed(101)(d)], // bis Neujahr
]

export const eventFor = (date: Date): AppEvent | null => EVENTS.find(([, on]) => on(date))?.[0] ?? null
