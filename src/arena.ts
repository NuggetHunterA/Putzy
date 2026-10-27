// Arena: Jeden Montag fordert ein Arenaleiter mit seinem Team heraus. Unter der Woche stört ihr seine Trainings und
// sammelt Zutaten für den Wochen-Trank, jede Person kämpft einmal. Ein Sieg bringt einen Joker, der eine Aufgabe um
// einen Tag schiebt. Leiter, Team, Trainingszeiten und Rezept werden beim ersten Öffnen der Woche ausgelost und
// gespeichert, damit sich das Team unter der Woche nicht mit euren Levels ändert (Konzept: arena.md im Projektordner).
import type { Done, Task } from './db'
import { chance } from './eggs'
import { AREAS, BEATS, isHome, isOpen, type Expedition, type Feeding } from './expeditions'
import { STANDING, TASK_ELEMENTS, dayString, elementsOf, levelFor, monsterById, stageFor, type Effort, type Element, type Monster, type MonsterElement, type Person } from './game'
import { addDays, weekDays } from './streak'

// Erster Montag mit Leiter.
export const ARENA_START = '2026-11-02'
export const MAX_JOKERS = 5
export const ROUNDS = 12

export type Unique = { id: string; name: string; elements: MonsterElement[]; move: string }
export type Leader = { id: string; name: string; elements: MonsterElement[]; room: string; special?: true; uniques?: Unique[] }

export const LEADERS: Leader[] = [
  { id: 'gischt', name: 'Kapitänin Gischt', elements: ['wasser'], room: 'Bad unten' },
  { id: 'glut', name: 'Meister Glut', elements: ['feuer'], room: 'Küche' },
  { id: 'moos', name: 'Gärtnerin Moos', elements: ['natur'], room: 'Wintergarten' },
  { id: 'boee', name: 'Pilotin Böe', elements: ['luft'], room: 'Flur' },
  { id: 'funkel', name: 'Professor Funkel', elements: ['licht'], room: 'Wohnzimmer' },
  { id: 'grau', name: 'Hausmeister Grau', elements: ['ohne'], room: 'Ganzes Haus' },
  { id: 'brodel', name: 'Dampfkoch Brodel', elements: ['wasser', 'feuer'], room: 'Küche' },
  { id: 'wirr', name: 'Sturmgärtner Wirr', elements: ['natur', 'luft'], room: 'Wintergarten' },
  { id: 'polarlicht', name: 'Polarlicht-Duo', elements: ['luft', 'licht'], room: 'Kinderzimmer' },
  {
    id: 'schmutzkoenig', name: 'Schmutzkönig', elements: ['feuer', 'natur'], room: 'Ganzes Haus', special: true,
    uniques: [{ id: 'hydrapilz', name: 'Hydrapilz', elements: ['natur', 'feuer'], move: 'Sporenglut' }, { id: 'qualmlilie', name: 'Qualmlilie', elements: ['feuer', 'natur'], move: 'Bratrauch-Biss' }],
  },
  {
    id: 'nebelfrau', name: 'Nebelfrau', elements: ['wasser', 'licht'], room: 'Bad oben', special: true,
    uniques: [{ id: 'spiegelqualle', name: 'Spiegelqualle', elements: ['wasser', 'licht'], move: 'Zerrspiegel' }, { id: 'dunstharfe', name: 'Dunstharfe', elements: ['licht', 'wasser'], move: 'Dampfakkord' }],
  },
  {
    id: 'staubbaron', name: 'Der Staubbaron', elements: ['luft', 'ohne'], room: 'Wohnzimmer', special: true,
    uniques: [{ id: 'fusselgolem', name: 'Fusselgolem', elements: ['ohne', 'luft'], move: 'Fusselfaust' }, { id: 'beutelschlund', name: 'Beutelschlund', elements: ['luft', 'ohne'], move: 'Saugrüssel' }],
  },
]
export const leaderById = (id: string) => LEADERS.find((l) => l.id === id)!
export const leaderImg = (l: Leader) => `/arena/leiter-${l.id}.webp`
export const UNIQUES = LEADERS.flatMap((l) => l.uniques ?? [])
export const uniqueById = (id: string) => UNIQUES.find((u) => u.id === id)

// Elemente, die den Leiter schlagen. Bei „ohne Element“ zählt jedes.
export const counters = (l: Leader): Element[] => (l.elements.includes('ohne') ? TASK_ELEMENTS : TASK_ELEMENTS.filter((e) => l.elements.includes(BEATS[e])))

// Kämpfer, wie er gespeichert wird: Monster-id (oder Unique-id), Stufe, Level und Elemente zu dem Zeitpunkt.
export type Fighter = { id: string; stage: number; level: number; elements: MonsterElement[] }
export const fighterName = (f: Fighter) => uniqueById(f.id)?.name ?? monsterById(f.id).stages[f.stage].replace('­', '')
export const fighterImg = (f: Fighter) => (uniqueById(f.id) ? `/arena/unique-${f.id}.webp` : monsterById(f.id).files[f.stage])
export const fighterMove = (f: Fighter) => uniqueById(f.id)?.move ?? monsterById(f.id).move
export const fighterOf = (m: Monster, monsterXp: Record<string, number>): Fighter => {
  const xp = monsterXp[m.id] ?? 0
  return { id: m.id, stage: stageFor(m, levelFor(xp)), level: levelFor(xp), elements: elementsOf(m, xp) }
}

export type Window = { day: string; from: number; to: number }

export type Potion = 'schild' | 'kraft' | 'leben' | 'element'
export const POTIONS: Record<Potion, { name: string; text: string; master: string; color: string }> = {
  schild: { name: 'Schildtrank', text: 'Gegner-Treffer −10 %', master: 'Gegner-Treffer −15 %', color: '#3EC1F3' },
  kraft: { name: 'Krafttrank', text: 'Eure Treffer +10 %', master: 'Eure Treffer +20 %', color: '#FF5A3C' },
  leben: { name: 'Lebenstrank', text: 'Eure LP +10 %', master: 'Eure LP +20 %', color: '#5BC44A' },
  element: { name: 'Elementtrank', text: 'Element-Vorteil ×1,4 statt ×1,25', master: 'Element-Vorteil ×1,4 und Gegner-Treffer −10 %', color: '#9B7BFF' },
}

export const INGREDIENTS: Record<Element, string[]> = {
  wasser: ['Seifenperle', 'Kalkflocke', 'Regenträne'],
  feuer: ['Glutkern', 'Pfefferfunke', 'Kaminasche'],
  natur: ['Tautropfen', 'Moosfaden', 'Apfelkern'],
  luft: ['Federflaum', 'Windhauch', 'Pollenstaub'],
  licht: ['Sonnenstaub', 'Mondsplitter', 'Kerzenwachs'],
}
export const MASTER_INGREDIENTS = ['Goldseife', 'Drachenzwiebel', 'Sternenschaum']

// Fundort einer Zutat. chance: Anteil je passender Heimkehr.
export type Spot =
  | { kind: 'gebiet'; area: string; chance: number }
  | { kind: 'trupp'; element: MonsterElement; chance: number }
  | { kind: 'beute' }
  | { kind: 'fern'; chance: number }
  | { kind: 'element'; element: Element; n: number }
  | { kind: 'konter'; n: number }
  | { kind: 'aufwand'; effort: Effort; n: number }
  | { kind: 'staendig'; n: number }
  | { kind: 'staendig1'; standing: string; n: number }
  | { kind: 'raum'; room: string; n: number }
  | { kind: 'streak'; n: number }
  | { kind: 'einmalig' }
  | { kind: 'fruechte'; n: number }
  | { kind: 'zusammen' }
  | { kind: 'frueh' }
  | { kind: 'spaet' }
  | { kind: 'wochenmonster'; n: number }
  | { kind: 'alle-staendigen' }
  | { kind: 'raeume'; n: number }

// element fehlt bei der Meisterzutat.
export type Ingredient = { name: string; element: Element | null; spot: Spot }
export type Recipe = { potion: Potion; ingredients: Ingredient[]; master: Ingredient }

// Gespeicherte Woche (Tabelle arena_weeks).
export type ArenaWeek = { week_start: string; leader: string; foes: Fighter[]; windows: Window[]; recipe: Recipe }
// Gespeicherter Kampf (Tabelle arena_fights): Teams mit Level und Elementen beim Start, Trank und Ergebnis.
export type ArenaFight = { id: string; week_start: string; person: Person; team: Fighter[]; foes: Fighter[]; potion: Potion | null; master: boolean; won: boolean; started_at: string }
export type Brew = { week_start: string; person: Person; master: boolean; brewed_at: string }
// Joker-Einsatz: anchor ist der Tag der letzten Erledigung oder die erste Fälligkeit, damit der Joker nur bis zur
// nächsten Erledigung gilt.
export type JokerUse = { id: string; task_id: string; anchor: string; person: Person; used_at: string }

// Zufallsfolge aus einem Schlüssel.
const dice = (key: string) => {
  let n = 0
  return () => chance(`${key}:${n++}`)
}
const pickOne = <T>(list: T[], r: number) => list[Math.floor(r * list.length)]
const shuffle = <T>(list: T[], roll: () => number) =>
  list
    .map((x) => ({ x, r: roll() }))
    .sort((a, b) => a.r - b.r)
    .map(({ x }) => x)

// ---------- Auslosung am Montag ----------

const rowsFor = (l: Leader, monsters: Monster[]) => monsters.filter((m) => l.elements.includes(m.element))

// Teamgröße: 3, ab 8 Reihen mit Level 10 vier, ab 14 fünf. Spezial-Leiter immer 5.
export function teamSize(l: Leader, monsters: Monster[], monsterXp: Record<string, number>) {
  if (l.special) return 5
  const strong = monsters.filter((m) => levelFor(monsterXp[m.id] ?? 0) >= 10).length
  return strong >= 14 ? 5 : strong >= 8 ? 4 : 3
}

// Gegner-Level: Durchschnitt eurer stärksten Monster (so viele wie Plätze) × 1,25 + 1, Spezial-Leiter +2. Kann über 30 gehen.
export function foeLevel(l: Leader, size: number, monsters: Monster[], monsterXp: Record<string, number>) {
  const top = monsters.map((m) => levelFor(monsterXp[m.id] ?? 0)).sort((a, b) => b - a).slice(0, size)
  const avg = top.reduce((n, x) => n + x, 0) / Math.max(1, top.length)
  return Math.round(avg * 1.25 + 1) + (l.special ? 2 : 0)
}

// Leiter der Woche: nicht in den letzten 3 Wochen, mindestens 2 sichtbare Reihen in seinen Elementen,
// Spezial-Leiter erst, wenn jeder normale einmal da war. Findet sich keiner, fällt die 4-Wochen-Regel weg.
export function drawLeader(week: string, history: ArenaWeek[], monsters: Monster[]) {
  const recent = history.filter((h) => h.week_start < week && h.week_start >= addDays(week, -21)).map((h) => h.leader)
  const seen = new Set(history.filter((h) => h.week_start < week).map((h) => h.leader))
  const allNormal = LEADERS.filter((l) => !l.special).every((l) => seen.has(l.id))
  const fits = LEADERS.filter((l) => rowsFor(l, monsters).length >= 2 && (!l.special || allNormal))
  const fresh = fits.filter((l) => !recent.includes(l.id))
  return pickOne(fresh.length ? fresh : fits, chance(`arena:${week}:leiter`))
}

// Gegner-Team: Reihen aus euren sichtbaren in den Elementen des Leiters, auf der Stufe, die ihr erreicht habt.
// Zu wenige Reihen: Dieselbe Reihe darf mehrmals vorkommen. Spezial-Leiter bringen ihre zwei Unique-Monster mit.
export function rollFoes(week: string, l: Leader, monsters: Monster[], monsterXp: Record<string, number>): Fighter[] {
  const size = teamSize(l, monsters, monsterXp)
  const level = foeLevel(l, size, monsters, monsterXp)
  const uniques = (l.uniques ?? []).map((u) => ({ id: u.id, stage: 0, level, elements: u.elements }))
  const rows = shuffle(rowsFor(l, monsters), dice(`arena:${week}:team`))
  const picked = Array.from({ length: size - uniques.length }, (_, i) => rows[i % rows.length])
  return [...uniques, ...picked.map((m) => ({ ...fighterOf(m, monsterXp), level }))]
}

// Trainingszeiten: 3 Fenster an verschiedenen Tagen, eines am Wochenende, je 2 oder 3 Stunden zwischen 7 und 22 Uhr.
export function rollWindows(week: string): Window[] {
  const roll = dice(`arena:${week}:training`)
  const weekend = 5 + Math.floor(roll() * 2)
  const others = shuffle([0, 1, 2, 3, 4, 5, 6].filter((d) => d !== weekend), roll).slice(0, 2)
  return [weekend, ...others]
    .sort((a, b) => a - b)
    .map((d) => {
      const hours = 2 + Math.floor(roll() * 2)
      const from = 7 + Math.floor(roll() * (22 - hours - 7 + 1))
      return { day: addDays(week, d), from, to: from + hours }
    })
}

// Was die Auslosung der Fundorte wissen muss: Stand am Montag.
export type Setup = {
  monsters: Monster[]
  monsterXp: Record<string, number>
  tasks: Task[]
  // Normale Aufgaben, die in dieser Woche fällig werden.
  dueThisWeek: Task[]
  openOneOffs: number
  now: Date
}

const perWeek = (tasks: Task[], room: string) => tasks.filter((t) => t.room === room).reduce((n, t) => n + 7 / t.interval_days, 0)

// Kategorien der Fundorte, je mit den Fundorten, die diese Woche machbar sind.
function categories(l: Leader, s: Setup): Spot[][] {
  const open = AREAS.filter((a) => isOpen(a, s.monsters, s.monsterXp, s.now))
  const elements = [...new Set(s.monsters.map((m) => m.element))]
  const bigDue = s.dueThisWeek.filter((t) => t.effort === 'G').length
  const rooms = [...new Set(s.tasks.map((t) => t.room))].filter((r) => r !== l.room && perWeek(s.tasks, r) >= 2)
  return [
    [...open.map((a) => ({ kind: 'gebiet' as const, area: a.id, chance: 0.4 })), ...elements.map((e) => ({ kind: 'trupp' as const, element: e, chance: 0.3 })), { kind: 'beute' }],
    // Jedes Element hat eine ständige Aufgabe, damit schafft es jedes auf 4 Aufgaben pro Woche.
    [...TASK_ELEMENTS.map((e) => ({ kind: 'element' as const, element: e, n: 4 })), { kind: 'konter', n: 2 }],
    [...(bigDue >= 1 ? [{ kind: 'aufwand' as const, effort: 'G' as const, n: 1 }] : []), { kind: 'aufwand', effort: 'M', n: 3 }, { kind: 'aufwand', effort: 'K', n: 6 }],
    [{ kind: 'staendig', n: 8 }, ...STANDING.map((x) => ({ kind: 'staendig1' as const, standing: x.id, n: 3 }))],
    rooms.map((room) => ({ kind: 'raum', room, n: 2 })),
    [{ kind: 'streak', n: 3 }],
    s.openOneOffs > 0 ? [{ kind: 'einmalig' }] : [],
    [{ kind: 'fruechte', n: 3 }],
    [{ kind: 'zusammen' }],
    [{ kind: 'frueh' }, { kind: 'spaet' }],
    [{ kind: 'wochenmonster', n: 3 }],
  ]
}

function masterSpots(s: Setup): Spot[] {
  const far = AREAS.some((a) => (a.tier === 3 || a.quarter) && isOpen(a, s.monsters, s.monsterXp, s.now))
  return [
    ...(far ? [{ kind: 'fern' as const, chance: 0.25 }] : []),
    ...(s.dueThisWeek.filter((t) => t.effort === 'G').length >= 3 ? [{ kind: 'aufwand' as const, effort: 'G' as const, n: 3 }] : []),
    { kind: 'streak', n: 5 },
    { kind: 'alle-staendigen' },
    { kind: 'raeume', n: 4 },
  ]
}

// Rezept: Trank-Art, 3 Zutaten aus 3 Elementen mit Fundorten aus 3 Kategorien, dazu die Meisterzutat.
export function rollRecipe(week: string, l: Leader, s: Setup): Recipe {
  const roll = dice(`arena:${week}:trank`)
  const potion = pickOne(Object.keys(POTIONS) as Potion[], roll())
  const elements = shuffle(TASK_ELEMENTS, roll).slice(0, 3)
  const cats = shuffle(categories(l, s).filter((c) => c.length > 0), roll).slice(0, 3)
  const ingredients = elements.map((e, i) => ({ name: pickOne(INGREDIENTS[e], roll()), element: e, spot: pickOne(cats[i], roll()) }))
  const master = { name: pickOne(MASTER_INGREDIENTS, roll()), element: null, spot: pickOne(masterSpots(s), roll()) }
  return { potion, ingredients, master }
}

export function rollWeek(week: string, history: ArenaWeek[], s: Setup): ArenaWeek {
  const l = drawLeader(week, history, s.monsters)
  return { week_start: week, leader: l.id, foes: rollFoes(week, l, s.monsters, s.monsterXp), windows: rollWindows(week), recipe: rollRecipe(week, l, s) }
}

// ---------- Unter der Woche ----------

// Alles, was Training und Trank aus der Woche nachrechnen.
export type Ctx = {
  week: ArenaWeek
  now: Date
  tasks: Task[]
  done: Done[]
  jokers: JokerUse[]
  expeditions: Expedition[]
  feedings: Feeding[]
  monsterXp: Record<string, number>
}

const inWeek = (week: string, at: string) => {
  const day = dayString(new Date(at))
  return day >= week && day < addDays(week, 7)
}
type Work = { element: Element; effort: Effort; room: string | null }
export function workOf(c: Pick<Done, 'task_id' | 'standing'>, tasks: Task[]): Work | null {
  const t = c.task_id ? tasks.find((x) => x.id === c.task_id) : undefined
  if (t) return { element: t.element, effort: t.effort, room: t.room }
  const s = c.standing ? STANDING.find((x) => x.id === c.standing) : undefined
  return s ? { element: s.element, effort: 'K', room: null } : null
}
const weekDone = (x: Ctx) => x.done.filter((c) => inWeek(x.week.week_start, c.done_at) && new Date(c.done_at) <= x.now)
const homecomings = (x: Ctx) =>
  x.expeditions.filter((e) => isHome(e, x.now) && inWeek(x.week.week_start, e.ends_at)).sort((a, b) => a.ends_at.localeCompare(b.ends_at))
const byDay = (list: Done[]) => {
  const days = new Map<string, Done[]>()
  for (const c of list) days.set(dayString(new Date(c.done_at)), [...(days.get(dayString(new Date(c.done_at))) ?? []), c])
  return [...days.values()]
}

// Erfüllt diese Heimkehr den Fundort? Zufall fest aus Expedition und Woche.
export function homecomingFinds(spot: Spot, e: Expedition, week: string) {
  const lucky = (p: number) => chance(`arena:${week}:${e.id}`) < p
  if (spot.kind === 'gebiet') return e.area === spot.area && lucky(spot.chance)
  if (spot.kind === 'trupp') return e.monsters.some((id) => monsterById(id).element === spot.element) && lucky(spot.chance)
  if (spot.kind === 'beute') return e.loot.tier !== 'klein'
  if (spot.kind === 'fern') return AREAS.some((a) => a.id === e.area && (a.tier === 3 || !!a.quarter)) && lucky(spot.chance)
  return false
}

// Fortschritt je Fundort: wie viel schon da ist und wie viel es braucht.
export function progress(spot: Spot, x: Ctx): { have: number; need: number } {
  const list = weekDone(x)
  const work = (c: Done) => workOf(c, x.tasks)
  const count = (n: number, ok: (c: Done) => boolean) => ({ have: Math.min(n, list.filter(ok).length), need: n })
  const once = (ok: boolean) => ({ have: ok ? 1 : 0, need: 1 })
  const leader = leaderById(x.week.leader)
  switch (spot.kind) {
    case 'gebiet':
    case 'trupp':
    case 'beute':
    case 'fern':
      return once(homecomings(x).some((e) => homecomingFinds(spot, e, x.week.week_start)))
    case 'element':
      return count(spot.n, (c) => work(c)?.element === spot.element)
    case 'konter':
      return count(spot.n, (c) => counters(leader).includes(work(c)?.element as Element))
    case 'aufwand':
      return count(spot.n, (c) => work(c)?.effort === spot.effort)
    case 'staendig':
      return count(spot.n, (c) => !!c.standing)
    case 'staendig1':
      return count(spot.n, (c) => c.standing === spot.standing)
    case 'raum':
      return count(spot.n, (c) => work(c)?.room === spot.room)
    case 'streak': {
      const days = weekDays(x.week.week_start, dayString(x.now), x.tasks, x.done, x.jokers)
      return { have: Math.min(spot.n, days.filter(Boolean).length), need: spot.n }
    }
    case 'einmalig':
      return count(1, (c) => !!c.oneoff)
    case 'fruechte':
      return { have: Math.min(spot.n, x.feedings.filter((f) => inWeek(x.week.week_start, f.fed_at)).length), need: spot.n }
    case 'zusammen':
      return once(byDay(list).some((d) => d.some((c) => c.person === 'adrian') && d.some((c) => c.person === 'ulrike')))
    case 'frueh':
      return count(1, (c) => new Date(c.done_at).getHours() < 8)
    case 'spaet':
      return count(1, (c) => new Date(c.done_at).getHours() >= 20)
    case 'wochenmonster':
      return count(spot.n, (c) => elementsOf(monsterById(c.monster), x.monsterXp[c.monster] ?? 0).includes(work(c)?.element as Element))
    case 'alle-staendigen':
      return { have: Math.max(0, ...byDay(list).map((d) => new Set(d.filter((c) => c.standing).map((c) => c.standing)).size)), need: STANDING.length }
    case 'raeume':
      return { have: Math.min(spot.n, Math.max(0, ...byDay(list).map((d) => new Set(d.map((c) => work(c)?.room).filter(Boolean)).size))), need: spot.n }
  }
}
export const found = (spot: Spot, x: Ctx) => {
  const p = progress(spot, x)
  return p.have >= p.need
}

const areaName = (id: string) => AREAS.find((a) => a.id === id)!.name
const elName: Record<MonsterElement, string> = { wasser: 'Wasser', feuer: 'Feuer', natur: 'Natur', luft: 'Luft', licht: 'Licht', ohne: 'ohne Element' }
const sizeName: Record<Effort, string> = { K: 'S', M: 'M', G: 'L' }

export function spotText(spot: Spot, l: Leader) {
  switch (spot.kind) {
    case 'gebiet':
      return `Heimkehr aus ${areaName(spot.area)}, ${spot.chance * 100} % Chance`
    case 'trupp':
      return `Heimkehr eines Trupps mit ${spot.element === 'ohne' ? 'einem Monster ohne Element' : `einem ${elName[spot.element]}-Monster`}, ${spot.chance * 100} % Chance`
    case 'beute':
      return 'Heimkehr mit guter Beute (oder besser)'
    case 'fern':
      return `Heimkehr aus einem Stufe-3- oder Quartals-Gebiet, ${spot.chance * 100} % Chance`
    case 'element':
      return `${spot.n} Aufgaben im Element ${elName[spot.element]}`
    case 'konter':
      return l.elements.includes('ohne') ? `${spot.n} Aufgaben mit Element` : `${spot.n} Aufgaben im Element ${counters(l).map((e) => elName[e]).join(' oder ')}`
    case 'aufwand':
      return spot.n === 1 ? `1 Aufgabe der Größe ${sizeName[spot.effort]}` : `${spot.n} Aufgaben der Größe ${sizeName[spot.effort]}${spot.effort === 'K' ? ' (auch ständige)' : ''}`
    case 'staendig':
      return `${spot.n} ständige Aufgaben`
    case 'staendig1':
      return `${spot.n}× ${STANDING.find((s) => s.id === spot.standing)!.name}`
    case 'raum':
      return `${spot.n} Aufgaben in ${spot.room}`
    case 'streak':
      return `${spot.n} geschaffte Streak-Tage`
    case 'einmalig':
      return '1 einmalige Aufgabe erledigen'
    case 'fruechte':
      return `${spot.n} Früchte verfüttern`
    case 'zusammen':
      return 'An einem Tag erledigt jeder von euch eine Aufgabe'
    case 'frueh':
      return '1 Aufgabe vor 8 Uhr'
    case 'spaet':
      return '1 Aufgabe nach 20 Uhr'
    case 'wochenmonster':
      return `${spot.n} Aufgaben mit Element-Bonus eures Wochenmonsters`
    case 'alle-staendigen':
      return 'An einem Tag alle 5 ständigen Aufgaben (zusammen)'
    case 'raeume':
      return `${spot.n} Aufgaben in ${spot.n} verschiedenen Räumen an einem Tag`
  }
}

// Meisterzutat: Name und Fundort erscheinen nach 3 Aufgaben im Raum des Leiters.
export const MASTER_REVEAL = 3
export const roomTasks = (x: Ctx) => Math.min(MASTER_REVEAL, weekDone(x).filter((c) => workOf(c, x.tasks)?.room === leaderById(x.week.leader).room).length)

// Training: erste Erledigung im Konter-Element je Fenster, oder null.
export function trainingHits(x: Ctx) {
  const l = leaderById(x.week.leader)
  return x.week.windows.map((w) =>
    weekDone(x)
      .filter((c) => {
        const d = new Date(c.done_at)
        return dayString(d) === w.day && d.getHours() >= w.from && d.getHours() < w.to && counters(l).includes(workOf(c, x.tasks)?.element as Element)
      })
      .sort((a, b) => a.done_at.localeCompare(b.done_at))[0] ?? null,
  )
}

// Jeder Treffer nimmt dem gerade stärksten Gegner 1 Level.
export function weakened(foes: Fighter[], hits: number) {
  const out = foes.map((f) => ({ ...f }))
  for (let i = 0; i < hits; i++) out.reduce((best, f) => (f.level > best.level ? f : best)).level--
  return out
}

// Stand der Woche für Arena-Seite, Startseite und Hinweise beim Abhaken.
export function weekState(x: Ctx, brews: Brew[]) {
  const leader = leaderById(x.week.leader)
  const hits = trainingHits(x)
  const got = x.week.recipe.ingredients.map((i) => found(i.spot, x))
  const brew = brews.find((b) => b.week_start === x.week.week_start) ?? null
  return {
    leader,
    hits,
    foes: weakened(x.week.foes, hits.filter(Boolean).length),
    got,
    masterKnown: roomTasks(x) >= MASTER_REVEAL,
    masterGot: found(x.week.recipe.master.spot, x),
    brew,
  }
}
export type WeekState = ReturnType<typeof weekState>

// Hinweise beim Abhaken: was die neue Erledigung in der Arena bewirkt hat.
export type Hint = { kind: 'zutat'; ingredient: Ingredient; have: number } | { kind: 'training'; foe: Fighter } | { kind: 'meister-entdeckt' | 'meister'; ingredient: Ingredient }
export function hintsFor(x: Ctx, brews: Brew[], c: Done): Hint[] {
  const before = weekState(x, brews)
  const after = weekState({ ...x, done: [...x.done, c] }, brews)
  if (before.brew) return []
  const out: Hint[] = []
  x.week.recipe.ingredients.forEach((ingredient, i) => {
    if (after.got[i] && !before.got[i]) out.push({ kind: 'zutat', ingredient, have: after.got.filter(Boolean).length })
  })
  if (after.hits.filter(Boolean).length > before.hits.filter(Boolean).length) {
    const i = before.foes.findIndex((f, k) => f.level !== after.foes[k].level)
    out.push({ kind: 'training', foe: before.foes[i] })
  }
  if (after.masterKnown && !before.masterKnown) out.push({ kind: 'meister-entdeckt', ingredient: x.week.recipe.master })
  if (after.masterGot && !before.masterGot) out.push({ kind: 'meister', ingredient: x.week.recipe.master })
  return out
}

// ---------- Kampf ----------

export const lpOf = (f: Fighter) => Math.round((40 + 6 * f.level) * (f.elements.includes('ohne') ? 1.2 : 1))
export const attackOf = (f: Fighter) => 8 + 1.5 * f.level

// Element-Faktor eines Angriffs. Monster mit zwei Elementen greifen mit dem günstigeren an.
export function factor(from: MonsterElement[], to: MonsterElement[], advantage = 1.25) {
  let best: number | null = null
  for (const a of from)
    for (const d of to) {
      if (a === 'ohne' || d === 'ohne') continue
      const f = BEATS[a] === d ? advantage : BEATS[d] === a ? 0.8 : 1
      best = Math.max(best ?? 0, f)
    }
  return best ?? 1
}

// Trank-Wirkung: eigene LP, eigene Treffer, Gegner-Treffer und Element-Vorteil. Schild- und Lebenstrank sind schwächer
// als im Konzept, sonst gewinnt der Meistertrank fast immer (Simulation in arena.test.ts).
export function potionEffect(potion: Potion | null, master: boolean) {
  const e = { lp: 1, mine: 1, theirs: 1, advantage: 1.25 }
  if (potion === 'schild') e.theirs = master ? 0.85 : 0.9
  if (potion === 'kraft') e.mine = master ? 1.2 : 1.1
  if (potion === 'leben') e.lp = master ? 1.2 : 1.1
  if (potion === 'element') {
    e.advantage = 1.4
    if (master) e.theirs = 0.9
  }
  return e
}

export type Side = 'team' | 'foes'
export type Hit = { round: number; side: Side; from: number; to: number; damage: number; advantage: boolean; down: boolean }

// Kampf aus der Kampf-id: Jede Runde greift jedes lebende Monster einmal an (zufällige Reihenfolge) und trifft das
// gegnerische mit den wenigsten LP. Sieg, wenn die Gegner umfallen oder nach 12 Runden mehr Rest-LP in Prozent bleiben.
export function simulate(id: string, team: Fighter[], foes: Fighter[], potion: Potion | null, master: boolean) {
  const roll = dice(`arena:${id}`)
  const fx = potionEffect(potion, master)
  const max = { team: team.map((f) => Math.round(lpOf(f) * fx.lp)), foes: foes.map(lpOf) }
  const lp = { team: [...max.team], foes: [...max.foes] }
  const fighters = { team, foes }
  const hits: Hit[] = []
  const alive = (side: Side) => lp[side].some((x) => x > 0)
  for (let round = 1; round <= ROUNDS && alive('team') && alive('foes'); round++) {
    const order = shuffle([...team.map((_, i) => ['team', i] as const), ...foes.map((_, i) => ['foes', i] as const)], roll)
    for (const [side, from] of order) {
      const other: Side = side === 'team' ? 'foes' : 'team'
      if (lp[side][from] <= 0 || !alive(other)) continue
      const to = lp[other].reduce((best, x, i) => (x > 0 && (best < 0 || x < lp[other][best]) ? i : best), -1)
      const f = factor(fighters[side][from].elements, fighters[other][to].elements, side === 'team' ? fx.advantage : 1.25)
      const damage = Math.max(1, Math.round(attackOf(fighters[side][from]) * f * (0.5 + roll()) * (side === 'team' ? fx.mine : fx.theirs)))
      lp[other][to] = Math.max(0, lp[other][to] - damage)
      hits.push({ round, side, from, to, damage, advantage: f > 1, down: lp[other][to] === 0 })
    }
  }
  const share = (side: Side) => lp[side].reduce((n, x) => n + x, 0) / max[side].reduce((n, x) => n + x, 0)
  return { hits, max, won: !alive('foes') || (alive('team') && share('team') > share('foes')) }
}

// Grobe Einschätzung aus 200 Probekämpfen.
export function verdict(team: Fighter[], foes: Fighter[], potion: Potion | null, master: boolean) {
  if (team.length === 0) return 'schwer' as const
  let wins = 0
  for (let i = 0; i < 200; i++) if (simulate(`probe:${i}`, team, foes, potion, master).won) wins++
  return wins >= 130 ? ('leicht' as const) : wins >= 70 ? ('ausgeglichen' as const) : ('schwer' as const)
}

// Vorschlag fürs Team: die Monster mit dem besten Wert aus Level und Element gegen die Gegner.
export function bestTeam(monsters: Monster[], monsterXp: Record<string, number>, foes: Fighter[], size: number) {
  const score = (m: Monster) => {
    const f = fighterOf(m, monsterXp)
    return f.level * (foes.reduce((n, foe) => n + factor(f.elements, foe.elements), 0) / Math.max(1, foes.length))
  }
  return [...monsters].sort((a, b) => score(b) - score(a)).slice(0, size)
}

// ---------- Joker ----------

// Kontostand: Siege und Einsätze der Reihe nach, höchstens 5. Siege bei vollem Konto verfallen.
export function jokerAccount(fights: ArenaFight[], uses: JokerUse[]) {
  const events = [...fights.filter((f) => f.won).map((f) => ({ at: f.started_at, fight: f.id })), ...uses.map((u) => ({ at: u.used_at, fight: null }))].sort((a, b) => a.at.localeCompare(b.at))
  let balance = 0
  const lost: string[] = []
  for (const e of events) {
    if (!e.fight) balance = Math.max(0, balance - 1)
    else if (balance >= MAX_JOKERS) lost.push(e.fight)
    else balance++
  }
  return { balance, lost }
}

// Tag, an dem die laufende Fälligkeit hängt: letzte Erledigung oder erste Fälligkeit.
export const anchorOf = (lastDone: Date | null, firstDue: string) => (lastDone ? dayString(lastDone) : firstDue)
export const jokered = (jokers: JokerUse[], taskId: string, anchor: string) => jokers.some((j) => j.task_id === taskId && j.anchor === anchor)
// Joker gehen nur für normale Aufgaben, die heute oder morgen fällig sind und noch keinen Joker haben.
export const canJoker = (days: number, isJokered: boolean) => !isJokered && (days === 0 || days === 1)

// ---------- Fürs Pedia ----------

// Leiter, die schon einmal da waren, und besiegte (mindestens ein Sieg).
export const leadersSeen = (weeks: ArenaWeek[]) => new Set(weeks.map((w) => w.leader))
export const leadersWon = (weeks: ArenaWeek[], fights: ArenaFight[]) =>
  new Set(fights.filter((f) => f.won).map((f) => weeks.find((w) => w.week_start === f.week_start)?.leader).filter((x): x is string => !!x))
