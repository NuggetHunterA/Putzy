import { describe, expect, it } from 'vitest'
import type { Completion, Pick, Task } from './db'
import { previousWeek, reviewWeeks, weekLabel, weekReview, weekStamps } from './review'
import type { Earned } from './stamps'

const task: Task = { id: 't1', room: 'Bad', name: 'Wanne', element: 'wasser', effort: 'M', interval_days: 7, first_due: '2026-10-01', sort: 1 }
let n = 0
const done = (monster: string, xp: number, at: string, extra: Partial<Completion> = {}): Completion => ({
  id: String(n++), task_id: null, standing: null, oneoff: null, person: 'adrian', monster, xp, team: [], team_xp: 0, done_at: new Date(at).toISOString(), ...extra,
})
const picks: Pick[] = [
  { week_start: '2026-10-05', person: 'adrian', monster: '2' },
  { week_start: '2026-10-12', person: 'adrian', monster: '2' },
  { week_start: '2026-10-12', person: 'ulrike', monster: '5' },
]

describe('Wochenrückblick', () => {
  it('zählt XP, Level und Aufgaben pro Element nur in der Woche', () => {
    const completions = [
      done('2', 1300, '2026-10-06T10:00'), // Vorwoche: Level 9
      done('2', 31, '2026-10-12T08:00', { task_id: 't1' }),
      done('2', 13, '2026-10-14T08:00', { standing: 'kochen' }),
      done('2', 20, '2026-10-15T08:00', { oneoff: 'o1' }),
      done('2', 25, '2026-10-16T08:00', { task_id: 'geloescht' }),
      done('2', 50, '2026-10-19T08:00', { task_id: 't1' }), // nächste Woche
    ]
    const [adrian, ulrike] = weekReview('2026-10-12', picks, completions, [task])
    expect(adrian.xp).toBe(89)
    expect([adrian.levelBefore, adrian.levelAfter]).toEqual([9, 10])
    expect([adrian.stageBefore, adrian.stageAfter]).toEqual([0, 1])
    expect(adrian.tasks).toEqual({ wasser: 1, feuer: 1, natur: 0, luft: 0, licht: 0, einmalig: 1 })
    expect(ulrike).toMatchObject({ person: 'ulrike', xp: 0, levelBefore: 1, levelAfter: 1 })
  })

  it('zählt Stempel-Boni zur Woche, in der der Stempel kam', () => {
    const stamp = (id: string, at: string, monsters: string[]): Earned => ({ id, earned_at: new Date(at).toISOString(), person: 'adrian', xp: 15, monsters, label: null })
    const stamps = [stamp('a', '2026-10-06T10:00', ['2']), stamp('b', '2026-10-13T10:00', ['2', '5']), stamp('c', '2026-10-14T10:00', ['8'])]
    const [adrian, ulrike] = weekReview('2026-10-12', picks, [done('2', 1340, '2026-10-06T10:00')], [], stamps) // 1.340 + 15 Bonus = Level 10
    expect(adrian).toMatchObject({ xp: 15, levelBefore: 10 })
    expect(ulrike).toMatchObject({ xp: 15 })
    expect(weekStamps('2026-10-12', stamps)).toBe(2)
  })

  it('zählt Team-Boni zur Woche der Erledigung, auch bei fremden Erledigungen', () => {
    const completions = [
      done('2', 1345, '2026-10-06T10:00', { team: ['2'], team_xp: 5 }), // 1.345 + 5 Team-Bonus = Level 10
      done('5', 25, '2026-10-13T10:00', { person: 'ulrike', team: ['2', '5'], team_xp: 5 }),
    ]
    const [adrian, ulrike] = weekReview('2026-10-12', picks, completions, [])
    expect(adrian).toMatchObject({ xp: 5, levelBefore: 10 })
    expect(ulrike).toMatchObject({ xp: 30 })
  })

  it('zeigt nur Personen mit Monster in der Woche', () => {
    expect(weekReview('2026-10-05', picks, [], []).map((w) => w.person)).toEqual(['adrian'])
    expect(weekReview('2026-09-28', picks, [], [])).toEqual([])
  })

  it('listet Wochen mit Monsterwahl, neueste zuerst', () => {
    expect(reviewWeeks(picks)).toEqual(['2026-10-12', '2026-10-05'])
  })

  it('findet die Vorwoche und beschriftet den Zeitraum', () => {
    expect(previousWeek('2026-10-12')).toBe('2026-10-05')
    expect(previousWeek('2026-11-02')).toBe('2026-10-26')
    expect(weekLabel('2026-10-12')).toBe('12.–18.10.')
    expect(weekLabel('2026-09-28')).toBe('28.09.–04.10.')
  })
})
