import { describe, expect, it } from 'vitest'
import { AREA_EGGS, type Egg } from './eggs'
import {
  AREAS, advantage, areaBusy, areaById, basket, blocked, canFeed, canStart, eggsToFile, expeditionPoints, fruitCap, isOpen, mapAreas, odds, rollLoot,
  truppSlots, unseenHomecomings, weekExpeditions, type Expedition, type Loot,
} from './expeditions'
import { monsterById, xpForLevel } from './game'

const lv = (ids: Record<string, number>) => Object.fromEntries(Object.entries(ids).map(([id, l]) => [id, xpForLevel(l)]))
const team = (...ids: string[]) => ids.map(monsterById)
const loot = (more: Partial<Loot> = {}): Loot => ({ tier: 'klein', fruits: ['beere'], streak: 0, egg: null, shiny: null, ...more })
const exp = (more: Partial<Expedition> = {}): Expedition => ({
  id: 'e1', area: 'flur', monsters: ['2'], started_by: 'adrian', started_at: '2026-10-23T08:00:00Z', ends_at: '2026-10-23T14:00:00Z', recalled_at: null, loot: loot(), ...more,
})
const egg = (monster: string): Egg => ({ monster, found_at: 'x', found_by: null, found_task: null, hatched_at: null, hatched_by: null })
const NOW = new Date('2026-10-23T12:00:00Z')
const LATER = new Date('2026-10-23T15:00:00Z')

describe('Expeditionen', () => {
  it('hat für jedes Gebiets-Ei genau ein Gebiet', () => {
    expect(AREAS.flatMap((a) => (a.egg ? [a.egg] : [])).sort()).toEqual([...AREA_EGGS].sort())
  })

  it('öffnet Stufe 2 ab 4 Monstern mit Level 12, Stufe 3 ab 3 mit Level 22, Quartals-Gebiete nur im Quartal', () => {
    const ms = team('1', '2', '3', '4')
    expect(isOpen(areaById('dschungel'), ms, lv({ 1: 12, 2: 12, 3: 12, 4: 11 }), NOW)).toBe(false)
    expect(isOpen(areaById('dschungel'), ms, lv({ 1: 12, 2: 12, 3: 12, 4: 12 }), NOW)).toBe(true)
    expect(isOpen(areaById('wueste'), ms, lv({ 1: 22, 2: 22, 3: 21 }), NOW)).toBe(false)
    expect(isOpen(areaById('wueste'), ms, lv({ 1: 22, 2: 22, 3: 22 }), NOW)).toBe(true)
    expect(isOpen(areaById('kamin'), [], {}, NOW)).toBe(true)
    expect(isOpen(areaById('schnee'), [], {}, NOW)).toBe(false)
    expect(mapAreas(NOW).map((a) => a.id)).toEqual(['flur', 'lagune', 'vulkan', 'dschungel', 'klippen', 'gipfel', 'wueste', 'keller', 'kamin'])
  })

  it('gibt 1 Trupp plus 1 je 5 Monster ab Level 10, höchstens 3', () => {
    const ms = team('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12')
    const ten = (n: number) => Object.fromEntries(ms.slice(0, n).map((m) => [m.id, xpForLevel(10)]))
    expect(truppSlots(ms, ten(4))).toBe(1)
    expect(truppSlots(ms, ten(5))).toBe(2)
    expect(truppSlots(ms, ten(12))).toBe(3)
  })

  it('lässt Wochenmonster, Monster unterwegs und zu niedrige Level nicht mit', () => {
    const lagune = areaById('lagune')
    const picks = [{ week_start: '2026-10-19', person: 'ulrike' as const, monster: '1' }]
    expect(blocked(monsterById('1'), lagune, lv({ 1: 9 }), picks, new Set())).toBe('Wochenmonster')
    expect(blocked(monsterById('8'), lagune, lv({ 8: 9 }), [], new Set(['8']))).toBe('unterwegs')
    expect(blocked(monsterById('8'), lagune, lv({ 8: 4 }), [], new Set())).toBe('ab Lv 5')
    expect(blocked(monsterById('8'), lagune, lv({ 8: 5 }), [], new Set())).toBeNull()
  })

  it('lässt pro Gebiet nur einen Trupp gleichzeitig los', () => {
    const flur = areaById('flur')
    expect(areaBusy(flur, [exp()], NOW)).toBe(true)
    expect(areaBusy(flur, [exp()], LATER)).toBe(false)
    expect(areaBusy(flur, [exp({ recalled_at: '2026-10-23T09:00:00Z' })], NOW)).toBe(false)
    expect(areaBusy(areaById('lagune'), [exp()], NOW)).toBe(false)
  })

  it('verlangt das geforderte Element und das Mindestlevel für jedes Monster', () => {
    const wueste = areaById('wueste')
    expect(canStart(wueste, team('6', '3'), lv({ 6: 22, 3: 22 }))).toBe(true)
    expect(canStart(wueste, team('6', '1'), lv({ 6: 22, 1: 22 }))).toBe(false)
    expect(canStart(wueste, team('6', '3', '1'), lv({ 6: 22, 3: 22, 1: 21 }))).toBe(false)
    // Papillora (Luft, Endstufe + Natur) deckt nur eines der beiden ab.
    expect(canStart(wueste, team('12'), lv({ 12: 25 }))).toBe(false)
    expect(canStart(areaById('flur'), team('2'), {})).toBe(true)
    expect(canStart(areaById('flur'), [], {})).toBe(false)
  })

  it('zählt den Element-Vorteil je Monster und Gegner', () => {
    const lagune = areaById('lagune')
    expect(advantage(lagune, team('1', '8'), {})).toBe(2)
    // Feuer gegen Wasser: −1.
    expect(advantage(lagune, team('1', '5'), {})).toBe(0)
    expect(advantage(areaById('flur'), team('1', '5'), {})).toBe(0)
  })

  it('rechnet die Chancen wie im Beispiel des Konzepts', () => {
    const o = odds(areaById('lagune'), team('1', '8'), lv({ 1: 14, 8: 14 }))
    expect(o.gut).toBeCloseTo(0.54)
    expect(o.super).toBeCloseTo(0.078)
    expect(o.shiny).toBeCloseTo(0.0038)
    // „Über“ ist bei 10 gedeckelt: 20 + 10 + 15 + 15 = 60 %, 2 + 2 + 1,5 + 3 = 8,5 %.
    const strong = odds(areaById('lagune'), team('1', '8', '14'), lv({ 1: 30, 8: 30, 14: 30 }))
    expect(strong.over).toBe(10)
    expect(strong.gut).toBeCloseTo(0.6)
    expect(strong.super).toBeCloseTo(0.085)
    // Schwache Trupps fallen nicht unter 5 %.
    expect(odds(areaById('lagune'), team('5', '9', '15'), lv({ 5: 5, 9: 5, 15: 5 })).gut).toBeCloseTo(0.05)
  })

  it('würfelt die Beute fest pro id, Klein immer, Super bringt das fehlende Gebiets-Ei', () => {
    const dschungel = areaById('dschungel')
    const ms = team('5', '9')
    const xp = lv({ 5: 22, 9: 22 })
    const ids = Array.from({ length: 4000 }, (_, i) => `id${i}`)
    const all = ids.map((id) => rollLoot(id, dschungel, ms, xp, [], []))
    expect(rollLoot('id7', dschungel, ms, xp, [], [])).toEqual(rollLoot('id7', dschungel, ms, xp, [], []))
    expect(all.every((l) => l.fruits[0] === 'pflaume')).toBe(true)
    const supers = ids.filter((_, i) => all[i].tier === 'super')
    expect(supers.length).toBeGreaterThan(100)
    expect(supers.every((id) => rollLoot(id, dschungel, ms, xp, [], []).egg === '29')).toBe(true)
    const withEgg = supers.map((id) => rollLoot(id, dschungel, ms, xp, [egg('29')], []))
    expect(withEgg.every((l) => l.egg === null)).toBe(true)
    const streaks = withEgg.filter((l) => l.streak === 1).length
    expect(streaks).toBeGreaterThan(withEgg.length * 0.1)
    expect(streaks).toBeLessThan(withEgg.length * 0.4)
    // Ein laufender Trupp, der das Ei schon mitbringt, zählt auch.
    expect(rollLoot(supers[0], dschungel, ms, xp, [], [exp({ loot: loot({ egg: '29' }) })]).egg).toBeNull()
  })

  it('macht Shinys nur aus erreichten Stufen, die noch nicht Shiny sind', () => {
    const flur = areaById('flur')
    const ms = team('2')
    const xp = lv({ 2: 11 })
    const id = Array.from({ length: 20000 }, (_, i) => `s${i}`).find((k) => rollLoot(k, flur, ms, xp, [], []).shiny)!
    const s = rollLoot(id, flur, ms, xp, [], []).shiny!
    expect(s.monster).toBe('2')
    expect(s.stage).toBeLessThanOrEqual(1)
    const both = [exp({ loot: loot({ shiny: { monster: '2', stage: 0 } }) }), exp({ loot: loot({ shiny: { monster: '2', stage: 1 } }) })]
    const none = rollLoot(id, flur, ms, xp, [], both)
    expect(none.shiny).toBeNull()
    expect(none.fruits).toContain('gold')
  })

  it('füllt den Korb und das Konto erst bei der Heimkehr, zurückgerufene Trupps bringen nichts', () => {
    const exps = [
      exp({ loot: loot({ fruits: ['beere', 'apfel'], streak: 1 }) }),
      exp({ id: 'e2', recalled_at: '2026-10-23T09:00:00Z', loot: loot({ fruits: ['gold'], streak: 1 }) }),
    ]
    expect(basket(exps, [], NOW)).toEqual({ beere: 0, pflaume: 0, apfel: 0, gold: 0 })
    expect(basket(exps, [{ id: 'f', monster: '2', fruit: 'beere', xp: 5, person: 'adrian', fed_at: 'x' }], LATER)).toEqual({ beere: 0, pflaume: 0, apfel: 1, gold: 0 })
    expect(expeditionPoints(exps, LATER)).toBe(1)
  })

  it('bremst Früchte beim höchsten Level aus Putz-XP', () => {
    const cap = fruitCap(lv({ 1: 12, 2: 8 }))
    expect(cap).toBe(12)
    expect(canFeed(xpForLevel(13) - 21, 'apfel', cap)).toBe(true)
    expect(canFeed(xpForLevel(13) - 20, 'apfel', cap)).toBe(false)
    expect(canFeed(xpForLevel(13) - 20, 'pflaume', cap)).toBe(true)
  })

  it('zeigt jede Heimkehr jeder Person einmal und legt Gebiets-Eier ins Nest', () => {
    const exps = [exp({ id: 'b', ends_at: '2026-10-23T14:30:00Z', loot: loot({ egg: '29' }) }), exp({ id: 'a' })]
    expect(unseenHomecomings(exps, [], 'adrian', NOW)).toEqual([])
    expect(unseenHomecomings(exps, [{ person: 'adrian', expedition: 'a' }], 'adrian', LATER).map((e) => e.id)).toEqual(['b'])
    expect(unseenHomecomings(exps, [{ person: 'adrian', expedition: 'a' }], 'ulrike', LATER).map((e) => e.id)).toEqual(['a', 'b'])
    expect(eggsToFile(exps, [], LATER).map((e) => e.id)).toEqual(['b'])
    expect(eggsToFile(exps, [egg('29')], LATER)).toEqual([])
  })

  it('zählt im Wochenrückblick heimgekehrte Trupps und Früchte-XP der Woche', () => {
    const exps = [exp(), exp({ id: 'e2', recalled_at: 'x' }), exp({ id: 'e3', ends_at: '2026-10-30T14:00:00Z' })]
    const fed = [{ id: 'f', monster: '2', fruit: 'apfel' as const, xp: 20, person: 'adrian' as const, fed_at: '2026-10-24T10:00:00Z' }]
    expect(weekExpeditions('2026-10-19', exps, fed, new Date('2026-11-01T10:00:00Z'))).toEqual({ trips: 1, fruitXp: 20 })
  })
})
