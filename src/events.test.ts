import { describe, expect, it } from 'vitest'
import { easter, eventBonus, eventEnd, eventFor, eventStart } from './events'

describe('Event-Designs', () => {
  const on = (d: string) => eventFor(new Date(`${d}T12:00:00`))

  it('erkennt feste Zeiträume einschließlich Rändern', () => {
    expect(on('2026-10-27')).toBeNull()
    expect(on('2026-10-28')).toBe('halloween')
    expect(on('2026-10-31')).toBe('halloween')
    expect(on('2026-11-01')).toBeNull()
    expect(on('2026-12-19')).toBeNull()
    expect(on('2026-12-20')).toBe('weihnachten')
    expect(on('2026-12-26')).toBe('weihnachten')
    expect(on('2026-12-27')).toBeNull()
    expect(on('2026-12-31')).toBe('silvester')
    expect(on('2027-01-01')).toBe('silvester')
    expect(on('2027-01-02')).toBe('silvester')
    expect(on('2027-01-03')).toBeNull()
    expect(on('2026-06-01')).toBe('jahrestag')
    expect(on('2026-06-17')).toBeNull()
    expect(on('2026-06-18')).toBe('sonnenwende')
    expect(on('2026-06-22')).toBe('sonnenwende')
    expect(on('2026-06-23')).toBeNull()
    expect(on('2026-08-04')).toBe('hochsommer')
    expect(on('2026-08-05')).toBeNull()
  })

  it('berechnet Ostern', () => {
    expect(easter(2024).toDateString()).toBe(new Date(2024, 2, 31).toDateString())
    expect(easter(2026).toDateString()).toBe(new Date(2026, 3, 5).toDateString())
    expect(easter(2027).toDateString()).toBe(new Date(2027, 2, 28).toDateString())
  })

  it('legt Ostern um den Ostersonntag', () => {
    expect(on('2026-04-02')).toBeNull()
    expect(on('2026-04-03')).toBe('ostern')
    expect(on('2026-04-06')).toBe('ostern')
    expect(on('2026-04-07')).toBeNull()
  })

  it('beginnt den Frühjahrsputz 3 Wochen nach Karfreitag', () => {
    expect(on('2026-03-20')).toBeNull()
    expect(on('2026-04-23')).toBeNull()
    expect(on('2026-04-24')).toBe('fruehjahrsputz') // Karfreitag 3.4. + 21 Tage
    expect(on('2026-04-30')).toBe('fruehjahrsputz')
    expect(on('2026-05-01')).toBe('maifeiertag')
    expect(on('2027-04-16')).toBe('fruehjahrsputz') // Karfreitag 26.3. + 21 Tage
    expect(on('2027-04-22')).toBe('fruehjahrsputz')
    expect(on('2027-04-23')).toBeNull()
  })

  it('kennt Chinesisches Neujahr aus der Liste', () => {
    expect(on('2027-02-05')).toBeNull()
    expect(on('2027-02-06')).toBe('neujahr_cn')
    expect(on('2027-02-09')).toBe('neujahr_cn')
    expect(on('2027-02-10')).toBeNull()
    expect(on('2028-01-26')).toBe('neujahr_cn')
    expect(on('2026-02-14')).toBeNull() // kein Valentinstag und kein Fasching mehr
  })

  it('erkennt Maifeiertag, Herbstanfang und Erntedank', () => {
    expect(on('2027-04-30')).toBe('maifeiertag')
    expect(on('2027-05-01')).toBe('maifeiertag')
    expect(on('2027-05-02')).toBeNull()
    expect(on('2026-09-22')).toBe('herbstanfang')
    expect(on('2026-09-24')).toBe('herbstanfang')
    expect(on('2026-09-25')).toBeNull()
    expect(on('2026-10-01')).toBeNull()
    expect(on('2026-10-02')).toBe('erntedank')
    expect(on('2026-10-03')).toBe('erntedank') // erster Oktober-Sonntag ist der 4.
    expect(on('2026-10-04')).toBe('erntedank')
    expect(on('2026-10-05')).toBeNull()
    expect(on('2028-09-29')).toBe('erntedank') // 1.10.2028 ist ein Sonntag
    expect(on('2028-09-28')).toBeNull()
    expect(on('2028-10-01')).toBe('erntedank')
  })

  it('gibt jedem Event ein Bonus-Element', () => {
    expect(eventBonus(new Date('2026-10-30T12:00:00'))).toBe('licht')
    expect(eventBonus(new Date('2026-12-24T12:00:00'))).toBe('natur')
    expect(eventBonus(new Date('2027-02-07T12:00:00'))).toBe('feuer')
    expect(eventBonus(new Date('2026-11-02T12:00:00'))).toBeNull()
  })

  it('zeigt Advent nur an den vier Adventssonntagen', () => {
    expect(on('2026-11-29')).toBe('advent')
    expect(on('2026-11-30')).toBeNull()
    expect(on('2026-12-13')).toBe('advent')
    expect(on('2026-12-20')).toBe('weihnachten')
  })

  it('gibt Hochzeitstag und Ostern Vorrang', () => {
    expect(on('2028-04-14')).toBe('hochzeitstag') // Karfreitag 2028
    expect(on('2027-03-26')).toBe('ostern') // Karfreitag im Frühjahrsputz
  })

  it('findet ersten und letzten Tag, auch über den Jahreswechsel', () => {
    const day = (d: Date) => d.toDateString()
    expect(day(eventStart(new Date('2026-10-30T12:00:00')))).toBe(day(new Date(2026, 9, 28)))
    expect(day(eventEnd(new Date('2026-10-30T12:00:00')))).toBe(day(new Date(2026, 9, 31)))
    expect(day(eventStart(new Date('2027-01-01T12:00:00')))).toBe(day(new Date(2026, 11, 31)))
  })
})
