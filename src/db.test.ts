import { describe, expect, it } from 'vitest'
import { mergeDone, type Done } from './db'

const done = (done_at: string, monster = '1'): Done => ({ monster, task_id: 't', standing: null, oneoff: null, person: 'adrian', xp: 10, done_at })

describe('mergeDone', () => {
  const since = new Date('2026-10-25T22:00:00Z')

  it('nimmt ältere Erledigungen aus prev und ab since nur die frischen', () => {
    const prev = [done('2026-10-20T08:00:00+00:00'), done('2026-10-26T08:00:00+00:00', 'alt')]
    const recent = [done('2026-10-26T08:00:00+00:00', 'neu'), done('2026-10-27T08:00:00+00:00')]
    expect(mergeDone(prev, recent, since).map((d) => d.monster)).toEqual(['1', 'neu', '1'])
  })

  it('vergisst eine zurückgenommene Erledigung der letzten Tage', () => {
    const prev = [done('2026-10-20T08:00:00+00:00'), done('2026-10-27T08:00:00+00:00')]
    expect(mergeDone(prev, [], since)).toHaveLength(1)
  })

  it('vergleicht Zeiten, nicht Texte', () => {
    // Gleicher Zeitpunkt in anderer Schreibweise als since: gehört zu den frischen.
    expect(mergeDone([done('2026-10-26T00:00:00+02:00')], [], since)).toHaveLength(0)
  })
})
