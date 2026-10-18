// Geheime Reihen: Eine Elementreihe wird freigeschaltet, sobald ein Monster dieses Elements die Endform
// einer mindestens dreistufigen Reihe erreicht (Aali und Kokeli zählen also nicht, bei Samsi erst Arborius).
// Wichti (ohne Element) kommt mit der letzten der fünf. Sichtbar ist eine Reihe erst ab dem Tag danach.
import type { Seen } from './db'
import { isHatched, type Egg } from './eggs'
import { MONSTERS, levelFor, stageFor, type Monster, type Person } from './game'

// Freischaltungen: Monster-id → Tag (YYYY-MM-DD), an dem die Bedingung erfüllt war.
export type Unlocks = Record<string, string>

const elemental = MONSTERS.filter((m) => m.secret && m.element !== 'ohne')

const reachedEnd = (m: Monster, monsterXp: Record<string, number>) =>
  m.stages.length >= 3 && stageFor(m, levelFor(monsterXp[m.id] ?? 0)) === m.stages.length - 1

// Elementreihen, deren Bedingung erfüllt ist, die aber noch nicht gespeichert sind.
export const newUnlocks = (monsterXp: Record<string, number>, unlocks: Unlocks) =>
  elemental.filter((s) => !unlocks[s.id] && MONSTERS.some((m) => m.element === s.element && reachedEnd(m, monsterXp)))

// Tag der Freischaltung, bei Wichti der späteste der fünf.
export function unlockedOn(m: Monster, unlocks: Unlocks) {
  if (m.element !== 'ohne') return unlocks[m.id]
  const days = elemental.map((s) => unlocks[s.id])
  return days.every(Boolean) ? days.sort().at(-1) : undefined
}

export function isVisible(m: Monster, unlocks: Unlocks, today: string) {
  if (!m.secret) return true
  const on = unlockedOn(m, unlocks)
  return !!on && on < today
}

// Reihen aus Eiern erst nach dem Ausbrüten.
export const visibleMonsters = (unlocks: Unlocks, today: string, eggs: Egg[]) =>
  MONSTERS.filter((m) => (m.egg ? isHatched(m, eggs) : isVisible(m, unlocks, today)))

// Sichtbare geheime Reihen, deren Freischaltung diese Person noch nicht gesehen hat (seen mit Stufe 0),
// nach Tag und Nummer sortiert, damit Wichti zuletzt kommt.
export const unrevealed = (seen: Seen[], person: Person, unlocks: Unlocks, today: string) =>
  MONSTERS.filter((m) => m.secret && isVisible(m, unlocks, today))
    .filter((m) => !seen.some((s) => s.person === person && s.monster === m.id && s.stage === 0))
    .sort((a, b) => unlockedOn(a, unlocks)!.localeCompare(unlockedOn(b, unlocks)!) || Number(a.id) - Number(b.id))
