import { describe, expect, it } from 'vitest'
import { daysUntilDue, levelFor, monsterById, stageFor, weekStart, xpFor, xpForLevel } from './game'

describe('XP', () => {
  it('gibt 125 % beim passenden Element', () => {
    expect(xpFor('M', 'wasser', 'wasser')).toBe(31)
    expect(xpFor('M', 'wasser', 'feuer')).toBe(25)
    expect(xpFor('K', 'licht', 'licht')).toBe(13)
    expect(xpFor('G', 'luft', 'luft')).toBe(63)
  })
})

describe('Level', () => {
  it('folgt 130 + 4 × n XP pro Level', () => {
    expect(levelFor(0)).toBe(1)
    expect(levelFor(133)).toBe(1)
    expect(levelFor(134)).toBe(2)
    expect(xpForLevel(10)).toBe(1350)
    expect(xpForLevel(25)).toBe(4320)
    expect(levelFor(1349)).toBe(9)
    expect(levelFor(1350)).toBe(10)
  })
  it('endet bei Level 30', () => {
    expect(xpForLevel(30)).toBe(5510)
    expect(levelFor(5509)).toBe(29)
    expect(levelFor(5510)).toBe(30)
    expect(levelFor(99_999)).toBe(30)
  })
  it('entwickelt 3er-Reihen auf Level 10 und 25', () => {
    const m = monsterById('1')
    expect(stageFor(m, 9)).toBe(0)
    expect(stageFor(m, 10)).toBe(1)
    expect(stageFor(m, 24)).toBe(1)
    expect(stageFor(m, 25)).toBe(2)
  })
  it('entwickelt Kokeli auf Level 15 und Samsi auf 10, 20 und 30', () => {
    const kokeli = monsterById('9')
    expect(stageFor(kokeli, 14)).toBe(0)
    expect(stageFor(kokeli, 15)).toBe(1)
    expect(stageFor(kokeli, 30)).toBe(1)
    const samsi = monsterById('10')
    expect([9, 10, 19, 20, 29, 30].map((l) => stageFor(samsi, l))).toEqual([0, 1, 1, 2, 2, 3])
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
