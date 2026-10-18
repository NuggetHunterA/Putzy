import { describe, expect, it } from 'vitest'
import { MONSTERS, monsterById } from './game'
import { dexNo, dexTotal, discoveredCount, isDiscovered, unseen } from './pedia'

const open = MONSTERS.filter((m) => !m.secret)

describe('Putzy-Pedia', () => {
  it('zeigt Stufe 1 immer, spätere erst wenn jemand sie gesehen hat', () => {
    const seen = [{ person: 'ulrike' as const, monster: '2', stage: 1 }]
    expect(isDiscovered([], '5', 0)).toBe(true)
    expect(isDiscovered(seen, '2', 1)).toBe(true)
    expect(isDiscovered(seen, '2', 2)).toBe(false)
    expect(discoveredCount(seen, open)).toBe(13)
  })

  it('spielt erreichte Entwicklungen nach, die diese Person noch nicht gesehen hat', () => {
    const xp = { '2': 4320, '5': 1350, '1': 100 }
    const seen = [{ person: 'adrian' as const, monster: '2', stage: 1 }]
    const list = (p: 'adrian' | 'ulrike') => unseen(seen, p, xp).map((e) => `${e.monster.id}:${e.stage}`)
    expect(list('adrian')).toEqual(['2:2', '5:1'])
    expect(list('ulrike')).toEqual(['2:1', '2:2', '5:1'])
  })

  it('zählt Reihen mit 2 und 4 Stufen fortlaufend bis 35, geheime Reihen danach bis 53', () => {
    expect(dexTotal(open)).toBe(35)
    expect(dexTotal(MONSTERS)).toBe(53)
    expect(dexNo(monsterById('13'), 0)).toBe('36')
    expect(dexNo(monsterById('18'), 2)).toBe('53')
    expect(dexNo(monsterById('8'), 2)).toBe('24')
    expect(dexNo(monsterById('9'), 0)).toBe('25')
    expect(dexNo(monsterById('9'), 1)).toBe('26')
    expect(dexNo(monsterById('10'), 0)).toBe('27')
    expect(dexNo(monsterById('10'), 3)).toBe('30')
    expect(dexNo(monsterById('11'), 0)).toBe('31')
    expect(dexNo(monsterById('12'), 2)).toBe('35')
  })

  it('spielt bei Samsi alle drei Entwicklungen nach', () => {
    const list = unseen([], 'adrian', { '10': 5510 }).map((e) => `${e.monster.id}:${e.stage}`)
    expect(list).toEqual(['10:1', '10:2', '10:3'])
  })
})
