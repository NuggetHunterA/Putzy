import { describe, expect, it } from 'vitest'
import { daysUntilDue, levelFor, stageFor, weekStart, xpFor, xpForLevel } from './game'

describe('XP', () => {
  it('gibt 125 % beim passenden Element', () => {
    expect(xpFor('M', 'wasser', 'wasser')).toBe(31)
    expect(xpFor('M', 'wasser', 'feuer')).toBe(25)
    expect(xpFor('K', 'licht', 'licht')).toBe(13)
    expect(xpFor('G', 'luft', 'luft')).toBe(63)
  })
})

describe('Level', () => {
  it('folgt 30 × n XP pro Level', () => {
    expect(levelFor(0)).toBe(1)
    expect(levelFor(29)).toBe(1)
    expect(levelFor(30)).toBe(2)
    expect(xpForLevel(10)).toBe(1350)
    expect(xpForLevel(25)).toBe(9000)
    expect(levelFor(1349)).toBe(9)
    expect(levelFor(1350)).toBe(10)
  })
  it('entwickelt auf Level 10 und 25', () => {
    expect(stageFor(9)).toBe(0)
    expect(stageFor(10)).toBe(1)
    expect(stageFor(24)).toBe(1)
    expect(stageFor(25)).toBe(2)
  })
})

describe('Fälligkeit', () => {
  const now = new Date(2026, 9, 16, 21, 0)
  it('zählt ab Erledigung', () => {
    expect(daysUntilDue(new Date(2026, 9, 16, 8, 0), 7, now, '2026-10-16')).toBe(7)
    expect(daysUntilDue(new Date(2026, 9, 1, 23, 0), 14, now, '2026-10-16')).toBe(-1)
  })
  it('nutzt die erste Fälligkeit, solange nie erledigt', () => {
    expect(daysUntilDue(null, 7, now, '2026-10-16')).toBe(0)
    expect(daysUntilDue(null, 7, now, '2026-10-20')).toBe(4)
  })
  it('rechnet über die Zeitumstellung in ganzen Tagen', () => {
    expect(daysUntilDue(new Date(2026, 9, 24, 12, 0), 2, new Date(2026, 9, 26, 0, 30), '2026-10-16')).toBe(0)
  })
})

describe('Wochenstart', () => {
  it('ist Montag', () => {
    expect(weekStart(new Date(2026, 9, 16))).toBe('2026-10-12')
    expect(weekStart(new Date(2026, 9, 12, 0, 1))).toBe('2026-10-12')
    expect(weekStart(new Date(2026, 9, 18, 23, 59))).toBe('2026-10-12')
  })
})
