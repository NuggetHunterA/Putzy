import { describe, expect, it } from 'vitest'
import { MONSTERS, monsterById, xpForLevel } from './game'
import { PEDIA, dexNo, dexTotal, discoveredCount, isDiscovered, isoWeek, listStages, monsterStats, unseen } from './pedia'

const open = MONSTERS.filter((m) => !m.secret && !m.egg)

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

  it('zählt Reihen mit 2 und 4 Stufen fortlaufend bis 35, geheime Reihen bis 53, Reihen aus Eiern bis 74, Event-Reihen bis 83', () => {
    expect(dexTotal(open)).toBe(35)
    expect(dexTotal(MONSTERS)).toBe(83)
    expect(dexNo(monsterById('28'), 2)).toBe('83')
    expect(dexNo(monsterById('19'), 0)).toBe('54')
    expect(dexNo(monsterById('25'), 2)).toBe('74')
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

  it('hat pro Stufe einen Eintrag, Größe, Gewicht und Vergleich', () => {
    for (const m of MONSTERS) {
      const e = PEDIA[m.id]
      for (const list of [e.text, e.sizes, e.weights, e.compare]) expect(list).toHaveLength(m.stages.length)
    }
  })

  it('rechnet Eure Werte aus den Erledigungen eines Monsters', () => {
    const tasks = [{ id: 'bad', name: 'Bad putzen' }, { id: 'boden', name: 'Boden wischen' }] as Parameters<typeof monsterStats>[2]
    const c = (task_id: string | null, done_at: string, monster = '2', standing: string | null = null) => ({ monster, task_id, standing, oneoff: null, person: 'adrian' as const, xp: 10, done_at })
    const done = [
      c('bad', '2026-10-06T08:00:00Z'),
      c('boden', '2026-10-07T08:00:00Z'),
      c(null, '2026-10-08T08:00:00Z', '2', 'kochen'),
      c(null, '2026-10-09T08:00:00Z', '2', 'kochen'),
      c('bad', '2026-10-14T08:00:00Z'),
      c(null, '2026-10-01T08:00:00Z'), // einmalige Aufgabe zählt für Datum und Woche, nicht als Lieblingsaufgabe
      c('bad', '2026-09-01T08:00:00Z', '5'),
    ]
    expect(monsterStats(done, '2', tasks)).toEqual({ favorite: { name: 'Bad putzen', tasks: 2 }, since: new Date('2026-10-01T08:00:00Z'), record: { tasks: 4, week: 41 } })
    expect(monsterStats(done, '9', tasks)).toEqual({ favorite: null, since: null, record: null })
  })

  it('zählt Kalenderwochen nach ISO', () => {
    expect(isoWeek(new Date(2026, 9, 18))).toBe(42)
    expect(isoWeek(new Date(2027, 0, 1))).toBe(53)
    expect(isoWeek(new Date(2025, 11, 29))).toBe(1)
  })

  it('listet jede Stufe einzeln und filtert nach Element, Zweitelement erst mit der Endstufe', () => {
    const ids = (filter: Parameters<typeof listStages>[2], xp = {}) => listStages(open, xp, filter).map((s) => `${s.m.id}:${s.stage}`)
    expect(ids('alle')).toHaveLength(35)
    expect(ids('alle').slice(0, 4)).toEqual(['1:0', '1:1', '1:2', '2:0'])
    expect(ids('wasser')).toEqual(['2:0', '2:1', '2:2', '4:0', '4:1', '4:2', '11:0', '11:1'])
    expect(ids('natur')).not.toContain('12:2')
    expect(ids('natur', { '12': xpForLevel(25) })).toContain('12:2')
    expect(ids('natur', { '12': xpForLevel(25) })).not.toContain('12:1')
    expect(ids('ohne')).toEqual([])
  })
})
