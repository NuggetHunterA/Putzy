import { describe, expect, it } from 'vitest'
import { balance, dueEventEgg, eggCost, eggName, nextEggScene, rollEgg, type Egg } from './eggs'
import { monsterById } from './game'

const egg = (monster: string, more: Partial<Egg> = {}): Egg => ({ monster, found_at: '2026-10-19T10:00:00Z', found_by: null, found_task: null, hatched_at: null, hatched_by: null, ...more })
// Schlüssel, deren Wurf unter 0,5 % bzw. 1 % liegt, und einer, der nie trifft.
const keys = (hit: boolean, chance: number) => Array.from({ length: 5000 }, (_, i) => `k${i}`).filter((k) => (rollEgg(k, chance === 0.01 ? 'ohne' : 'feuer', []) !== null) === hit)

describe('Eier', () => {
  it('würfelt fest pro Schlüssel ungefähr mit 0,5 % bzw. 1 %', () => {
    const hits = keys(true, 0.005).length
    expect(hits).toBeGreaterThan(10)
    expect(hits).toBeLessThan(45)
    expect(keys(true, 0.01).length).toBeGreaterThan(hits)
    const k = keys(true, 0.005)[0]
    expect(rollEgg(k, 'feuer', [])).toBe('21')
    expect(rollEgg(k, 'feuer', [])).toBe('21')
  })

  it('würfelt nicht, wenn das Ei schon da ist oder zwei Eier warten', () => {
    const k = keys(true, 0.005)[0]
    expect(rollEgg(k, 'feuer', [egg('21', { hatched_at: '2026-11-01T10:00:00Z' })])).toBeNull()
    expect(rollEgg(k, 'feuer', [egg('19')])).toBe('21')
    expect(rollEgg(k, 'feuer', [egg('19'), egg('20')])).toBeNull()
    expect(rollEgg(k, 'feuer', [egg('19', { hatched_at: '2026-11-01T10:00:00Z' }), egg('20')])).toBe('21')
  })

  it('zieht ausgebrütete Eier vom Konto ab: Start-Ei 35, Zufallsfunde 60', () => {
    const weeks = [{ week_start: '2026-10-19', points: 7 }, { week_start: '2026-10-26', points: 100 }]
    expect(balance(weeks, [egg('19')])).toBe(107)
    expect(balance(weeks, [egg('19', { hatched_at: 'x' }), egg('20', { hatched_at: 'x' })])).toBe(12)
  })

  it('heißt nur nach dem Element', () => {
    expect(eggName(monsterById('19'))).toBe('Wasser-Ei')
    expect(eggName(monsterById('25'))).toBe('Ei ohne Element')
  })

  it('zeigt jeder Person erst Funde, dann Schlüpfen, jeweils einmal', () => {
    const eggs = [egg('19', { hatched_at: '2026-11-01T10:00:00Z', hatched_by: 'adrian' }), egg('21', { found_at: '2026-10-25T10:00:00Z', found_by: 'ulrike' })]
    const scene = (seen: { person: 'adrian'; monster: string; stage: number }[]) => {
      const s = nextEggScene(eggs, seen, 'adrian')
      return s && `${s.kind}:${s.monster.id}`
    }
    expect(scene([])).toBe('found:19')
    expect(scene([{ person: 'adrian', monster: '19', stage: -1 }])).toBe('found:21')
    expect(scene([{ person: 'adrian', monster: '19', stage: -1 }, { person: 'adrian', monster: '21', stage: -1 }])).toBe('hatch:19')
    expect(scene([{ person: 'adrian', monster: '19', stage: -1 }, { person: 'adrian', monster: '21', stage: -1 }, { person: 'adrian', monster: '19', stage: 0 }])).toBeUndefined()
  })

  it('legt Event-Eier auch bei vollem Nest und macht sie billiger', () => {
    const full = [egg('19'), egg('21'), egg('22')]
    expect(dueEventEgg('halloween', full)).toBe('26')
    expect(dueEventEgg('halloween', [...full, egg('26')])).toBeNull()
    expect(dueEventEgg('ostern', full)).toBeNull()
    expect(dueEventEgg(null, full)).toBeNull()
    expect(eggCost('26')).toBe(10)
    expect(eggCost('21')).toBe(60)
    expect(eggName(monsterById('26'))).toBe('Licht-Ei')
  })

  it('zeigt für Event-Eier keine Fund-Szene, das übernimmt die Event-Begrüßung', () => {
    const eggs = [egg('26', { hatched_at: '2026-10-29T10:00:00Z', hatched_by: 'adrian' })]
    expect(nextEggScene(eggs, [], 'adrian')?.kind).toBe('hatch')
  })
})
