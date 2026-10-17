import { describe, expect, it } from 'vitest'
import { easter, eventFor } from './events'

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
    expect(on('2027-01-02')).toBeNull()
    expect(on('2026-03-20')).toBe('fruehjahrsputz')
    expect(on('2026-03-27')).toBeNull()
    expect(on('2026-06-01')).toBe('jahrestag')
    expect(on('2026-06-21')).toBe('sonnenwende')
    expect(on('2026-08-04')).toBe('hochsommer')
    expect(on('2026-08-05')).toBeNull()
  })

  it('berechnet Ostern', () => {
    expect(easter(2024).toDateString()).toBe(new Date(2024, 2, 31).toDateString())
    expect(easter(2026).toDateString()).toBe(new Date(2026, 3, 5).toDateString())
    expect(easter(2027).toDateString()).toBe(new Date(2027, 2, 28).toDateString())
  })

  it('legt Ostern und Fasching um den Ostersonntag', () => {
    expect(on('2026-04-02')).toBeNull()
    expect(on('2026-04-03')).toBe('ostern')
    expect(on('2026-04-06')).toBe('ostern')
    expect(on('2026-04-07')).toBeNull()
    expect(on('2026-02-11')).toBeNull()
    expect(on('2026-02-12')).toBe('fasching')
    expect(on('2026-02-18')).toBe('fasching')
    expect(on('2026-02-19')).toBeNull()
  })

  it('zeigt Advent nur an den vier Adventssonntagen', () => {
    expect(on('2026-11-29')).toBe('advent')
    expect(on('2026-11-30')).toBeNull()
    expect(on('2026-12-13')).toBe('advent')
    expect(on('2026-12-20')).toBe('weihnachten')
  })

  it('gibt Hochzeitstag und Valentinstag Vorrang', () => {
    expect(on('2028-04-14')).toBe('hochzeitstag') // Karfreitag 2028
    expect(on('2026-02-14')).toBe('valentinstag') // mitten im Fasching
    expect(on('2027-03-26')).toBe('ostern') // Karfreitag im Frühjahrsputz
  })
})
