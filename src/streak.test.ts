import { describe, expect, it } from 'vitest'
import type { Done, Task } from './db'
import { current, longest, pastWeeks, weekDays, weekPoints } from './streak'

const task = (id: string, interval_days: number, first_due: string): Task => ({ id, room: 'Küche', name: id, element: 'feuer', effort: 'K', interval_days, first_due, sort: 0 })
const done = (task_id: string, day: string): Done => ({ monster: '5', task_id, standing: null, oneoff: null, person: 'adrian', xp: 10, done_at: `${day}T18:00:00` })
const week = '2026-10-19'

describe('Streak', () => {
  it('zählt einen Tag, wenn am Ende nichts mehr fällig oder überfällig ist', () => {
    const tasks = [task('a', 1, '2026-10-19'), task('b', 3, '2026-10-20')]
    // Mo: a erledigt. Di: a erledigt, b fällig und offen. Mi: a und b (überfällig) erledigt. Do: nichts.
    const list = [done('a', '2026-10-19'), done('a', '2026-10-20'), done('a', '2026-10-21'), done('b', '2026-10-21')]
    expect(weekDays(week, '2026-10-22', tasks, list)).toEqual([true, false, true, false, false, false, false])
  })

  it('zählt einen Tag ohne fällige Aufgabe mit, auch ohne Erledigung', () => {
    const tasks = [task('a', 7, '2026-10-19')]
    expect(weekDays(week, '2026-10-25', tasks, [done('a', '2026-10-19')])).toEqual([true, true, true, true, true, true, true])
  })

  it('ignoriert ständige Aufgaben und Tage vor dem Start', () => {
    const standing: Done = { monster: '5', task_id: null, standing: 'kochen', oneoff: null, person: 'adrian', xp: 10, done_at: '2026-10-19T12:00:00' }
    expect(weekDays('2026-10-12', '2026-10-25', [], [standing]).every((d) => !d)).toBe(true)
  })

  it('gibt die längste Streak der Woche als Punkte und zählt heute erst, wenn geschafft', () => {
    expect(longest([true, true, false, true, true, true, false])).toBe(3)
    expect(longest([false, false, false, false, false, false, false])).toBe(0)
    expect(current([true, true, true, false, false, false, false], 3)).toBe(3)
    expect(current([true, true, true, true, false, false, false], 3)).toBe(4)
    expect(current([true, false, true, false, false, false, false], 3)).toBe(1)
  })

  it('nimmt gespeicherte Wochen, rechnet fehlende nach und beginnt mit der Startwoche', () => {
    expect(pastWeeks('2026-10-19')).toEqual([])
    expect(pastWeeks('2026-11-02')).toEqual(['2026-10-19', '2026-10-26'])
    const tasks = [task('a', 7, '2026-10-19')]
    const saved = [{ week_start: '2026-10-19', points: 2 }]
    expect(weekPoints('2026-11-02', saved, tasks, [done('a', '2026-10-19'), done('a', '2026-10-26')])).toEqual([saved[0], { week_start: '2026-10-26', points: 7 }])
  })
})
