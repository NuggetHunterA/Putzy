// Expeditionen: Monster, die gerade nicht Wochenmonster sind, ziehen als Trupp in ein Gebiet und bringen Beute mit.
// Das Ergebnis wird beim Start gewürfelt (fest aus der Expeditions-id) und gespeichert, damit beide dasselbe sehen.
// Früchte-XP zählen wie andere XP, nur die Bremse rechnet mit Putz-XP allein (Konzept: expeditionen.md).
import type { Pick } from './db'
import { chance, type Egg } from './eggs'
import { addDays } from './streak'
import { dayString, elementsOf, levelFor, stageFor, type Element, type Monster, type MonsterElement, type Person } from './game'

export type Fruit = 'beere' | 'pflaume' | 'apfel' | 'gold'
export const FRUITS: Record<Fruit, { name: string; xp: number }> = {
  beere: { name: 'Beere', xp: 5 },
  pflaume: { name: 'Pflaume', xp: 10 },
  apfel: { name: 'Apfel', xp: 20 },
  gold: { name: 'Goldapfel', xp: 50 },
}
export const FRUIT_ORDER: Fruit[] = ['beere', 'pflaume', 'apfel', 'gold']

// Bedingung als Liste von Elementen (jedes Monster deckt eines ab) oder als Sonderregel.
type Need = MonsterElement[] | { distinct: number } | { final: number }

export type Area = {
  id: string
  name: string
  // 1 bis 3; Quartals-Gebiete zählen wie Stufe 2.
  tier: 1 | 2 | 3
  hours: number
  minLevel: number
  // Gegner-Elemente, leer bei gemischten Gegnern und ohne Element: dann gibt es keinen Element-Vorteil.
  enemies: Element[]
  enemyLabel: string
  need: MonsterElement[]
  bonus: Need
  // Monster-id des Gebiets-Eis.
  egg?: string
  // Kalenderquartal 1 bis 4, nur dann geöffnet.
  quarter?: number
}

export const AREAS: Area[] = [
  { id: 'flur', name: 'Flur-Pfad', tier: 1, hours: 6, minLevel: 1, enemies: [], enemyLabel: 'gemischt', need: [], bonus: { distinct: 2 } },
  { id: 'lagune', name: 'Spülbecken-Lagune', tier: 1, hours: 6, minLevel: 5, enemies: ['wasser'], enemyLabel: 'Wasser', need: ['licht'], bonus: ['licht', 'licht'] },
  { id: 'vulkan', name: 'Backofen-Vulkan', tier: 1, hours: 6, minLevel: 5, enemies: ['feuer'], enemyLabel: 'Feuer', need: ['wasser'], bonus: ['wasser', 'wasser', 'natur'] },
  { id: 'dschungel', name: 'Terrassen-Dschungel', tier: 2, hours: 12, minLevel: 12, enemies: ['natur'], enemyLabel: 'Natur', need: ['feuer'], bonus: ['feuer', 'feuer'], egg: '29' },
  { id: 'klippen', name: 'Wäscheleinen-Klippen', tier: 2, hours: 12, minLevel: 12, enemies: ['luft'], enemyLabel: 'Luft', need: ['natur'], bonus: ['natur', 'natur', 'wasser'], egg: '30' },
  { id: 'gipfel', name: 'Lampenschirm-Gipfel', tier: 2, hours: 12, minLevel: 12, enemies: ['licht'], enemyLabel: 'Licht', need: ['luft'], bonus: ['luft', 'luft', 'ohne'], egg: '31' },
  { id: 'wueste', name: 'Staubwüste unterm Sofa', tier: 3, hours: 24, minLevel: 22, enemies: ['luft', 'licht'], enemyLabel: 'Luft und Licht', need: ['natur', 'luft'], bonus: { distinct: 3 }, egg: '32' },
  { id: 'keller', name: 'Keller-Labyrinth', tier: 3, hours: 24, minLevel: 25, enemies: [], enemyLabel: 'ohne Element', need: ['ohne'], bonus: { final: 3 }, egg: '33' },
  { id: 'schnee', name: 'Schneeballberg', tier: 2, hours: 12, minLevel: 5, enemies: ['luft'], enemyLabel: 'Luft', need: ['natur'], bonus: ['natur', 'natur'], egg: '34', quarter: 1 },
  { id: 'pollen', name: 'Pollenwiese', tier: 2, hours: 12, minLevel: 5, enemies: ['natur'], enemyLabel: 'Natur', need: ['feuer'], bonus: ['feuer', 'licht'], egg: '35', quarter: 2 },
  { id: 'plansch', name: 'Planschbecken', tier: 2, hours: 12, minLevel: 5, enemies: ['wasser'], enemyLabel: 'Wasser', need: ['licht'], bonus: ['licht', 'licht', 'luft'], egg: '36', quarter: 3 },
  { id: 'kamin', name: 'Kaminecke', tier: 2, hours: 12, minLevel: 5, enemies: ['feuer'], enemyLabel: 'Feuer', need: ['wasser'], bonus: ['wasser', 'wasser'], egg: '37', quarter: 4 },
]
export const areaById = (id: string) => AREAS.find((a) => a.id === id)!
export const areaOfEgg = (monster: string) => AREAS.find((a) => a.egg === monster)

// Element-Kreis: Wasser schlägt Feuer, Feuer Natur, Natur Luft, Luft Licht, Licht Wasser.
export const BEATS: Record<Element, Element> = { wasser: 'feuer', feuer: 'natur', natur: 'luft', luft: 'licht', licht: 'wasser' }
export const beatenBy = (e: Element) => (Object.keys(BEATS) as Element[]).find((k) => BEATS[k] === e)!

export type Loot = {
  tier: 'klein' | 'gut' | 'super'
  fruits: Fruit[]
  streak: number
  egg: string | null
  shiny: Shiny | null
}
export type Shiny = { monster: string; stage: number }

export type Expedition = {
  id: string
  area: string
  monsters: string[]
  started_by: Person
  started_at: string
  ends_at: string
  recalled_at: string | null
  loot: Loot
}
// Verfüttert: eine Frucht an ein Monster.
export type Feeding = { id: string; monster: string; fruit: Fruit; xp: number; person: Person; fed_at: string }

export const quarterOf = (now: Date) => Math.floor(now.getMonth() / 3) + 1

// Stufe 2 ab 4 Monstern mit Level 12, Stufe 3 ab 3 Monstern mit Level 22.
export const UNLOCK_TIER = { 2: { count: 4, level: 12 }, 3: { count: 3, level: 22 } } as const

const levelsOf = (monsters: Monster[], monsterXp: Record<string, number>) => monsters.map((m) => levelFor(monsterXp[m.id] ?? 0))

export function tierOpen(tier: 1 | 2 | 3, monsters: Monster[], monsterXp: Record<string, number>) {
  if (tier === 1) return true
  const { count, level } = UNLOCK_TIER[tier]
  return levelsOf(monsters, monsterXp).filter((l) => l >= level).length >= count
}

// Quartals-Gebiete zählen nur im eigenen Quartal, dann immer offen.
export const isOpen = (a: Area, monsters: Monster[], monsterXp: Record<string, number>, now: Date) =>
  a.quarter ? a.quarter === quarterOf(now) : tierOpen(a.tier, monsters, monsterXp)

// Gebiete auf der Karte: feste und das Quartals-Gebiet von heute.
export const mapAreas = (now: Date) => AREAS.filter((a) => !a.quarter || a.quarter === quarterOf(now))

// Trupps gleichzeitig: 1, plus 1 je 5 Monster ab Level 10, höchstens 3.
export const truppSlots = (monsters: Monster[], monsterXp: Record<string, number>) =>
  Math.min(3, 1 + Math.floor(levelsOf(monsters, monsterXp).filter((l) => l >= 10).length / 5))

export const isAway = (e: Expedition, now: Date) => !e.recalled_at && new Date(e.ends_at) > now
export const isHome = (e: Expedition, now: Date) => !e.recalled_at && new Date(e.ends_at) <= now
export const awayMonsters = (exps: Expedition[], now: Date) => new Set(exps.filter((e) => isAway(e, now)).flatMap((e) => e.monsters))

// Warum ein Monster nicht mit darf, oder null. Wochenmonster beider Personen bleiben zu Hause.
export function blocked(m: Monster, area: Area, monsterXp: Record<string, number>, picks: Pick[], away: Set<string>) {
  if (picks.some((p) => p.monster === m.id)) return 'Wochenmonster'
  if (away.has(m.id)) return 'unterwegs'
  if (levelFor(monsterXp[m.id] ?? 0) < area.minLevel) return `ab Lv ${area.minLevel}`
  return null
}

// Deckt der Trupp die Liste ab? Jedes Monster zählt für höchstens ein Element (bei drei Monstern einfach durchprobieren).
function covers(sets: MonsterElement[][], need: MonsterElement[]): boolean {
  if (need.length === 0) return true
  const [first, ...rest] = need
  return sets.some((s, i) => s.includes(first) && covers(sets.filter((_, j) => j !== i), rest))
}

const isFinal = (m: Monster, xp: number) => stageFor(m, levelFor(xp)) === m.levels.length

export function meets(need: Need, trupp: Monster[], monsterXp: Record<string, number>) {
  if ('distinct' in need) return new Set(trupp.map((m) => m.element)).size >= need.distinct
  if ('final' in need) return trupp.filter((m) => isFinal(m, monsterXp[m.id] ?? 0)).length >= need.final
  return covers(trupp.map((m) => elementsOf(m, monsterXp[m.id] ?? 0)), need)
}

// Je Monster und Gegner-Element: +1, wenn eines seiner Elemente es schlägt, −1, wenn es das Hauptelement schlägt.
export const advantage = (area: Area, trupp: Monster[], monsterXp: Record<string, number>) => advantageAgainst(area.enemies, trupp, monsterXp)

// Dasselbe für eine Liste von Gegner-Elementen, auch für die Bosse (src/bosses.ts).
export function advantageAgainst(enemies: Element[], trupp: Monster[], monsterXp: Record<string, number>) {
  let n = 0
  for (const m of trupp) {
    const els = elementsOf(m, monsterXp[m.id] ?? 0)
    for (const enemy of enemies) {
      if (els.some((e) => e !== 'ohne' && BEATS[e] === enemy)) n++
      if (m.element !== 'ohne' && beatenBy(m.element) === enemy) n--
    }
  }
  return n
}

export type Odds = { gut: number; super: number; shiny: number; over: number; adv: number; bonus: boolean }

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

// Chancen als Anteile zwischen 0 und 1.
export function odds(area: Area, trupp: Monster[], monsterXp: Record<string, number>): Odds {
  const avg = trupp.reduce((n, m) => n + levelFor(monsterXp[m.id] ?? 0), 0) / trupp.length
  const over = clamp(avg - area.minLevel, 0, 10)
  const adv = advantage(area, trupp, monsterXp)
  const bonus = meets(area.bonus, trupp, monsterXp)
  return {
    gut: clamp(20 + over + 5 * adv + (bonus ? 15 : 0), 5, 70) / 100,
    super: clamp(2 + 0.2 * over + 0.5 * adv + (bonus ? 3 : 0), 0, 10) / 100,
    shiny: ((0.2 + 0.02 * over) * (bonus ? 2 : 1)) / 100,
    over,
    adv,
    bonus,
  }
}

export const canStart = (area: Area, trupp: Monster[], monsterXp: Record<string, number>) =>
  trupp.length >= 1 && trupp.length <= 3 && trupp.every((m) => levelFor(monsterXp[m.id] ?? 0) >= area.minLevel) && meets(area.need, trupp, monsterXp)

// Shinys aus allen Expeditionen, die nicht zurückgerufen wurden (auch laufende, damit nichts doppelt gewürfelt wird).
export const shinies = (exps: Expedition[]) => exps.filter((e) => !e.recalled_at && e.loot.shiny).map((e) => e.loot.shiny!)
// Shinys, die schon zu sehen sind: nur aus heimgekehrten Trupps.
export const shownShinies = (exps: Expedition[], now: Date) => exps.filter((e) => isHome(e, now) && e.loot.shiny).map((e) => e.loot.shiny!)
export const isShiny = (list: Shiny[], monster: string, stage: number) => list.some((s) => s.monster === monster && s.stage === stage)

const KLEIN: Record<1 | 2 | 3, Fruit> = { 1: 'beere', 2: 'pflaume', 3: 'apfel' }
const GUT: Record<1 | 2 | 3, Fruit> = { 1: 'beere', 2: 'apfel', 3: 'gold' }
const SUPER: Record<1 | 2 | 3, Fruit[]> = { 1: ['apfel'], 2: ['gold'], 3: ['gold', 'gold'] }

// Beute beim Start: Klein immer, Gut, Super und Shiny einzeln gewürfelt. Super bringt das Gebiets-Ei, solange es fehlt,
// sonst in 3 von 4 Fällen Früchte, sonst einen Streak-Punkt. Shiny: zufälliges Monster und eine Stufe, die seine Reihe
// schon erreicht hat und noch nicht Shiny ist; gibt es keine, ein Goldapfel.
export function rollLoot(id: string, area: Area, trupp: Monster[], monsterXp: Record<string, number>, eggs: Egg[], exps: Expedition[]): Loot {
  const o = odds(area, trupp, monsterXp)
  const gut = chance(`${id}:gut`) < o.gut
  const sup = chance(`${id}:super`) < o.super
  const fruits: Fruit[] = [KLEIN[area.tier]]
  if (gut) fruits.push(GUT[area.tier])
  let streak = 0
  let egg: string | null = null
  if (sup) {
    const eggTaken = !area.egg || eggs.some((e) => e.monster === area.egg) || exps.some((e) => !e.recalled_at && e.loot.egg === area.egg)
    if (!eggTaken) egg = area.egg!
    else if (chance(`${id}:streak`) < 0.25) streak = 1
    else fruits.push(...SUPER[area.tier])
  }
  let shiny: Shiny | null = null
  if (chance(`${id}:shiny`) < o.shiny) {
    const taken = shinies(exps)
    const options = trupp.flatMap((m) =>
      Array.from({ length: stageFor(m, levelFor(monsterXp[m.id] ?? 0)) + 1 }, (_, stage) => ({ monster: m.id, stage })).filter((s) => !isShiny(taken, s.monster, s.stage)),
    )
    if (options.length) shiny = options[Math.floor(chance(`${id}:who`) * options.length)]
    else fruits.push('gold')
  }
  return { tier: sup ? 'super' : gut ? 'gut' : 'klein', fruits, streak, egg, shiny }
}

// Fruchtkorb: Früchte heimgekehrter Trupps minus verfütterte.
export function basket(exps: Expedition[], feedings: Feeding[], now: Date) {
  const n: Record<Fruit, number> = { beere: 0, pflaume: 0, apfel: 0, gold: 0 }
  for (const e of exps) if (isHome(e, now)) for (const f of e.loot.fruits) n[f]++
  for (const f of feedings) n[f.fruit]--
  return n
}

// Streak-Punkte aus heimgekehrten Trupps, für das Konto (balance in eggs.ts).
export const expeditionPoints = (exps: Expedition[], now: Date) => exps.filter((e) => isHome(e, now)).reduce((n, e) => n + e.loot.streak, 0)

// Früchte-XP pro Monster.
export function fruitXp(feedings: Feeding[]) {
  const xp: Record<string, number> = {}
  for (const f of feedings) xp[f.monster] = (xp[f.monster] ?? 0) + f.xp
  return xp
}

// Bremse: höchstes Level aus Putz-XP allein. Eine Frucht darf ein Monster höchstens bis dahin heben.
export const fruitCap = (cleanXp: Record<string, number>) => Math.max(1, ...Object.values(cleanXp).map(levelFor))
export const canFeed = (xp: number, fruit: Fruit, cap: number) => levelFor(xp + FRUITS[fruit].xp) <= cap

// Heimkehr, die diese Person noch nicht gesehen hat, älteste zuerst.
export const unseenHomecomings = (exps: Expedition[], seen: { person: Person; expedition: string }[], person: Person, now: Date) =>
  exps
    .filter((e) => isHome(e, now) && !seen.some((s) => s.person === person && s.expedition === e.id))
    .sort((a, b) => a.ends_at.localeCompare(b.ends_at))

// Gebiets-Eier aus heimgekehrten Trupps, die noch nicht im Nest liegen.
export const eggsToFile = (exps: Expedition[], eggs: Egg[], now: Date) =>
  exps.filter((e) => isHome(e, now) && e.loot.egg && !eggs.some((x) => x.monster === e.loot.egg))

// Shiny: fester Farbton je Reihe als Farbfilter über dem normalen Bild (Umrisse bleiben).
// Blasse Reihen bekommen erst eine Tönung, sonst ändert der Farbton bei ihnen kaum etwas.
const SHINY_TINT: Record<string, number> = { 3: 120, 4: 240, 12: 0, 20: 300, 23: 0, 26: 120, 30: 300, 34: 0 }
export const shinyFilter = (monster: string) =>
  monster in SHINY_TINT
    ? `sepia(.6) hue-rotate(${SHINY_TINT[monster]}deg) saturate(1.8)`
    : `hue-rotate(${90 + ((Number(monster) * 67) % 180)}deg) saturate(1.25)`

// Wer schlägt das Gegner-Element? Für den Kampf-Rückblick der Heimkehr.
export const beatsArea = (m: Monster, area: Area, monsterXp: Record<string, number>) =>
  elementsOf(m, monsterXp[m.id] ?? 0).some((e) => e !== 'ohne' && area.enemies.includes(BEATS[e]))

// Wochenrückblick: heimgekehrte Expeditionen und verfütterte Früchte-XP der Woche (Montag week, lokale Zeit).
export function weekExpeditions(week: string, exps: Expedition[], feedings: Feeding[], now: Date) {
  const inWeek = (at: string) => {
    const day = dayString(new Date(at))
    return day >= week && day < addDays(week, 7)
  }
  return {
    trips: exps.filter((e) => isHome(e, now) && inWeek(e.ends_at)).length,
    fruitXp: feedings.filter((f) => inWeek(f.fed_at)).reduce((n, f) => n + f.xp, 0),
  }
}
