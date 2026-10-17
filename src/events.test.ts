import { describe, expect, it } from 'vitest'
import { eventFor } from './events'

describe('Event-Designs', () => {
  const on = (d: string) => eventFor(new Date(`${d}T12:00:00`))

  it('erkennt die Zeiträume einschließlich Rändern', () => {
    expect(on('2026-10-27')).toBeNull()
    expect(on('2026-10-28')).toBe('halloween')
    expect(on('2026-10-31')).toBe('halloween')
    expect(on('2026-11-01')).toBeNull()
    expect(on('2026-12-19')).toBeNull()
    expect(on('2026-12-20')).toBe('weihnachten')
    expect(on('2026-12-26')).toBe('weihnachten')
    expect(on('2026-12-27')).toBeNull()
    expect(on('2026-12-31')).toBe('silvester')
    expect(on('2027-01-01')).toBeNull()
  })
})
