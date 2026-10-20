// Eier: Zu Beginn liegt das Wasser-Ei der Schwamm-Reihe im Nest, die anderen tauchen zufällig beim Abhaken auf.
// Ausbrüten kostet Streak-Punkte vom gemeinsamen Konto und macht die Reihe ab Stufe 1 sichtbar.
// seen mit Stufe -1: Fund gesehen, mit Stufe 0: Schlüpfen gesehen (beide Animationen sieht jede Person einmal).
import type { Seen } from './db'
import type { AppEvent } from './events'
import { ELEMENTS, MONSTERS, type Monster, type MonsterElement, type Person } from './game'
import type { StreakWeek } from './streak'

export type Egg = {
  monster: string
  found_at: string
  // Leer beim Start-Ei.
  found_by: Person | null
  found_task: string | null
  hatched_at: string | null
  hatched_by: Person | null
}

export const START_EGG = '19'
// Welches Ei eine Aufgabe dieses Elements finden kann; einmalige Aufgaben finden das Ei ohne Element.
export const ELEMENT_EGG: Record<MonsterElement, string> = { wasser: '20', feuer: '21', natur: '24', luft: '23', licht: '22', ohne: '25' }
export const EGG_CHANCE = 0.005
export const ONEOFF_EGG_CHANCE = 0.01
// Gewürfelt wird nur, solange höchstens so viele Eier auf das Ausbrüten warten.
export const MAX_WAITING = 1

// Event-Eier: Zum Event liegt das Ei ohne Zufall im Nest, auch wenn dort schon Eier warten, und ist billiger.
// Den Fund zeigt die Event-Begrüßung (EventIntro.tsx), nicht die Ei-Szene.
export const EVENT_EGGS: Partial<Record<AppEvent, string>> = { halloween: '26', weihnachten: '27', neujahr_cn: '28' }
// Event, zu dem dieses Ei gehört.
export const eventEgg = (monster: string) => (Object.keys(EVENT_EGGS) as AppEvent[]).find((e) => EVENT_EGGS[e] === monster)
// Event-Ei, das heute ins Nest gehört und noch fehlt.
export const dueEventEgg = (event: AppEvent | null, eggs: Egg[]) => {
  const id = event && EVENT_EGGS[event]
  return id && !eggs.some((x) => x.monster === id) ? id : null
}

export const eggCost = (monster: string) => (monster === START_EGG ? 35 : eventEgg(monster) ? 10 : 75)
export const eggFile = (monster: string) => `/monster/${monster}-0-ei.webp`
export const eggName = (m: Monster) => (m.element === 'ohne' ? 'Ei ohne Element' : `${ELEMENTS[m.element].name}-Ei`)

export const waiting = (eggs: Egg[]) => eggs.filter((e) => !e.hatched_at)
export const isHatched = (m: Monster, eggs: Egg[]) => eggs.some((e) => e.monster === m.id && e.hatched_at)

// Konto: Punkte aller abgeschlossenen Wochen minus ausgebrütete Eier.
export const balance = (weeks: StreakWeek[], eggs: Egg[]) =>
  weeks.reduce((n, w) => n + w.points, 0) - eggs.filter((e) => e.hatched_at).reduce((n, e) => n + eggCost(e.monster), 0)

// Zahl zwischen 0 und 1, fest für denselben Schlüssel (FNV-1a).
function chance(key: string) {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return (h >>> 0) / 2 ** 32
}

// Wurf beim Abhaken: Schlüssel aus Tag und Aufgabe, damit Zurücknehmen und erneutes Abhaken nicht neu würfelt.
// Gibt die Monster-id des gefundenen Eis zurück oder null.
export function rollEgg(key: string, element: MonsterElement, eggs: Egg[]) {
  const id = ELEMENT_EGG[element]
  if (waiting(eggs).length > MAX_WAITING || eggs.some((e) => e.monster === id)) return null
  return chance(key) < (element === 'ohne' ? ONEOFF_EGG_CHANCE : EGG_CHANCE) ? id : null
}

const sawIt = (seen: Seen[], person: Person, monster: string, stage: number) =>
  seen.some((s) => s.person === person && s.monster === monster && s.stage === stage)

// Nächste Animation, die diese Person noch nicht gesehen hat: erst Funde (ohne Event-Eier), dann Schlüpfen, jeweils älteste zuerst.
export function nextEggScene(eggs: Egg[], seen: Seen[], person: Person) {
  const byTime = (at: (e: Egg) => string) => [...eggs].sort((a, b) => at(a).localeCompare(at(b)))
  const found = byTime((e) => e.found_at).find((e) => !eventEgg(e.monster) && !sawIt(seen, person, e.monster, -1))
  if (found) return { egg: found, kind: 'found' as const, monster: MONSTERS.find((m) => m.id === found.monster)! }
  const hatched = byTime((e) => e.hatched_at ?? '').find((e) => e.hatched_at && !sawIt(seen, person, e.monster, 0))
  return hatched && { egg: hatched, kind: 'hatch' as const, monster: MONSTERS.find((m) => m.id === hatched.monster)! }
}
