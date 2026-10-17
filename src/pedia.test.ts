import { describe, expect, it } from 'vitest'
import { discoveredCount, isDiscovered, unseen } from './pedia'

describe('Putzy-Pedia', () => {
  it('zeigt Stufe 1 immer, spätere erst wenn jemand sie gesehen hat', () => {
    const seen = [{ person: 'ulrike' as const, monster: '2', stage: 1 }]
    expect(isDiscovered([], '5', 0)).toBe(true)
    expect(isDiscovered(seen, '2', 1)).toBe(true)
    expect(isDiscovered(seen, '2', 2)).toBe(false)
    expect(discoveredCount(seen)).toBe(9)
  })

  it('spielt erreichte Entwicklungen nach, die diese Person noch nicht gesehen hat', () => {
    const xp = { '2': 4320, '5': 1350, '1': 100 }
    const seen = [{ person: 'adrian' as const, monster: '2', stage: 1 }]
    const list = (p: 'adrian' | 'ulrike') => unseen(seen, p, xp).map((e) => `${e.monster.id}:${e.stage}`)
    expect(list('adrian')).toEqual(['2:2', '5:1'])
    expect(list('ulrike')).toEqual(['2:1', '2:2', '5:1'])
  })
})
