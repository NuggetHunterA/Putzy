import { describe, expect, it } from 'vitest'
import { monsterById, xpForLevel } from './game'
import { isVisible, newUnlocks, unlockedOn, unrevealed, visibleMonsters } from './secret'

const ids = (ms: { id: string }[]) => ms.map((m) => m.id)
const all = { '13': '2026-10-20', '14': '2026-10-21', '15': '2026-10-22', '16': '2026-10-22', '17': '2026-10-23' }

describe('Geheime Reihen', () => {
  it('schalten frei, wenn ein Monster des Elements die Endform einer dreistufigen Reihe erreicht', () => {
    expect(ids(newUnlocks({ '2': xpForLevel(25) - 1 }, {}))).toEqual([])
    expect(ids(newUnlocks({ '2': xpForLevel(25) }, {}))).toEqual(['13'])
    expect(ids(newUnlocks({ '2': xpForLevel(25) }, { '13': '2026-10-20' }))).toEqual([])
  })

  it('zählen Aali und Kokeli nicht und bei Samsi erst Arborius', () => {
    expect(ids(newUnlocks({ '11': xpForLevel(30), '9': xpForLevel(30) }, {}))).toEqual([])
    expect(ids(newUnlocks({ '10': xpForLevel(29) }, {}))).toEqual([])
    expect(ids(newUnlocks({ '10': xpForLevel(30) }, {}))).toEqual(['17'])
  })

  it('zeigen eine Reihe erst ab dem Tag nach der Freischaltung', () => {
    const wali = monsterById('13')
    expect(isVisible(wali, {}, '2026-10-21')).toBe(false)
    expect(isVisible(wali, { '13': '2026-10-20' }, '2026-10-20')).toBe(false)
    expect(isVisible(wali, { '13': '2026-10-20' }, '2026-10-21')).toBe(true)
    expect(isVisible(monsterById('2'), {}, '2026-10-21')).toBe(true)
    expect(visibleMonsters({}, '2026-10-21', [])).toHaveLength(12)
  })

  it('schalten Wichti mit der letzten der fünf Elementreihen frei', () => {
    const wichti = monsterById('18')
    const { '17': _, ...four } = all
    expect(unlockedOn(wichti, four)).toBeUndefined()
    expect(unlockedOn(wichti, all)).toBe('2026-10-23')
    expect(isVisible(wichti, all, '2026-10-24')).toBe(true)
  })

  it('zeigen jeder Person jede Freischaltung einmal, Wichti zuletzt', () => {
    const seen = [{ person: 'adrian' as const, monster: '13', stage: 0 }]
    expect(ids(unrevealed(seen, 'adrian', all, '2026-10-24'))).toEqual(['14', '15', '16', '17', '18'])
    expect(ids(unrevealed(seen, 'ulrike', all, '2026-10-22'))).toEqual(['13', '14'])
  })
})
