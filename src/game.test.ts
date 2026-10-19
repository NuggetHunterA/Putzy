import { describe, expect, it } from 'vitest'
import { daysUntilDue, firstDue, levelFor, monsterById, elementsOf, nextInterval, stageFor, weekStart, xpFor, xpForLevel, xpOf } from './game'

describe('XP', () => {
  it('gibt 125 % beim passenden Element', () => {
    expect(xpFor('M', 'wasser', ['wasser'])).toBe(31)
    expect(xpFor('M', 'wasser', ['feuer'])).toBe(25)
    expect(xpFor('K', 'licht', ['licht'])).toBe(13)
    expect(xpFor('G', 'luft', ['luft'])).toBe(63)
    // Event-Bonus kommt zum Element-Bonus dazu, gilt aber nur fürs Event-Element.
    expect(xpFor('M', 'feuer', ['wasser'], 'feuer')).toBe(38)
    expect(xpFor('M', 'feuer', ['feuer'], 'feuer')).toBe(47)
    expect(xpFor('M', 'wasser', ['wasser'], 'feuer')).toBe(31)
  })

  it('gibt Doppelelement-Monstern den Bonus für beide Elemente, aber erst ab der Endstufe', () => {
    const aurorail = monsterById('22')
    expect(elementsOf(aurorail, xpForLevel(25) - 1)).toEqual(['licht'])
    expect(elementsOf(aurorail, xpForLevel(25))).toEqual(['licht', 'feuer'])
    expect(xpFor('M', 'feuer', elementsOf(aurorail, xpForLevel(25)))).toBe(31)
    expect(elementsOf(monsterById('1'), 99_999)).toEqual(['licht'])
  })

  it('gibt für einmalige Aufgaben immer 20, ohne Bonus', () => {
    expect(xpOf(null, ['wasser'])).toBe(20)
    expect(xpOf({ effort: 'M', element: 'wasser' }, ['wasser'])).toBe(31)
  })

  it('gibt Monstern ohne Element 30 XP für einmalige Aufgaben und nie den Bonus', () => {
    expect(xpOf(null, ['ohne'])).toBe(30)
    expect(xpOf(null, ['wasser'], 'wasser')).toBe(20)
    expect(xpOf({ effort: 'M', element: 'wasser' }, ['ohne'])).toBe(25)
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
    const aali = monsterById('11')
    expect([19, 20, 30].map((l) => stageFor(aali, l))).toEqual([0, 1, 1])
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
  it('macht neue Aufgaben nach dem halben Intervall fällig', () => {
    expect(firstDue(1, now)).toBe('2026-10-16')
    expect(firstDue(2, now)).toBe('2026-10-16')
    expect(firstDue(3, now)).toBe('2026-10-17')
    expect(firstDue(7, now)).toBe('2026-10-19')
    expect(firstDue(30, now)).toBe('2026-10-31')
    expect(firstDue(365, now)).toBe('2027-04-16')
  })
})

describe('Wochenstart', () => {
  it('ist Montag', () => {
    expect(weekStart(new Date(2026, 9, 16))).toBe('2026-10-12')
    expect(weekStart(new Date(2026, 9, 12, 0, 1))).toBe('2026-10-12')
    expect(weekStart(new Date(2026, 9, 18, 23, 59))).toBe('2026-10-12')
  })
})

describe('Intervall-Stufen', () => {
  it('springt zur nächsten Stufe', () => {
    expect(nextInterval(60, 1)).toBe(90)
    expect(nextInterval(90, 1)).toBe(180)
    expect(nextInterval(7, -1)).toBe(3)
  })
  it('bleibt an den Enden stehen', () => {
    expect(nextInterval(1, -1)).toBe(1)
    expect(nextInterval(365, 1)).toBe(365)
  })
  it('fängt Werte zwischen den Stufen ein', () => {
    expect(nextInterval(5, 1)).toBe(7)
    expect(nextInterval(5, -1)).toBe(3)
  })
})
