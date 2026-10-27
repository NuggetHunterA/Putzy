import { describe, expect, it } from 'vitest'
import type { ArenaFight, ArenaWeek } from './arena'
import type { Done, Task } from './db'
import type { Egg } from './eggs'
import { xpForLevel } from './game'
import { FIXED, hidden, newStamps, stamps, unseenStamps, xpBeforeUnseen, type Earned, type Facts } from './stamps'

const task = { id: 'katzenklo', room: 'Ganzes Haus', name: 'Katzenklo leeren', element: 'licht', effort: 'K', interval_days: 1, first_due: '2026-10-01', sort: 1 } as Task
const done = (over: Partial<Done> = {}, day = 1): Done => ({
  monster: '5', task_id: null, standing: null, oneoff: null, person: 'adrian', xp: 10, done_at: `2026-10-${String(day).padStart(2, '0')}T18:00:00`, ...over,
})
const facts = (over: Partial<Facts> = {}): Facts => ({ done: [], tasks: [task], monsterXp: {}, unlocks: {}, eggs: [], streakWeeks: [], bossFights: [], arenaWeeks: [], arenaFights: [], jokers: [], today: '2026-10-18', week: '2026-10-12', ...over })
const ids = (f: Facts, earned: Earned[] = []) => newStamps(f, earned).map((s) => s.id)
const stamp = (id: string) => FIXED.find((s) => s.id === id)!
const egg = (monster: string, over: Partial<Egg> = {}): Egg => ({ monster, found_at: '2026-10-01T10:00:00Z', found_by: null, found_task: null, hatched_at: null, hatched_by: null, ...over })

describe('Stempelheft', () => {
  it('hat 29 feste Stempel und je einen pro ständiger und normaler Aufgabe', () => {
    expect(FIXED).toHaveLength(52)
    expect(stamps([task], [])).toHaveLength(52 + 5 + 1)
  })

  it('stempelt eine Aufgabe beim 25. Mal, egal wer, mit 15 XP für alle sichtbaren Licht-Monster', () => {
    const list = (n: number) => Array.from({ length: n }, (_, i) => done({ task_id: 'katzenklo', person: i % 2 ? 'ulrike' : 'adrian' }, i + 1))
    expect(ids(facts({ done: list(24) }))).not.toContain('task:katzenklo')
    const s = newStamps(facts({ done: list(25) }), []).find((e) => e.id === 'task:katzenklo')!
    expect(s).toEqual({ id: 'task:katzenklo', person: 'adrian', xp: 15, monsters: ['1', '8'], label: 'Katzenklo leeren' })
  })

  it('stempelt Entwicklungen auf Stufe 2, 3 und 4 ohne XP', () => {
    expect(ids(facts({ monsterXp: { '2': xpForLevel(10) } }))).toContain('evo-2')
    expect(ids(facts({ monsterXp: { '2': xpForLevel(25) } }))).toEqual(expect.arrayContaining(['evo-2', 'evo-3']))
    expect(ids(facts({ monsterXp: { '2': xpForLevel(30) } }))).not.toContain('evo-4')
    expect(ids(facts({ monsterXp: { '10': xpForLevel(30) } }))).toContain('evo-4')
    expect(newStamps(facts({ monsterXp: { '2': xpForLevel(10) } }), []).find((s) => s.id === 'evo-2')!.monsters).toEqual([])
  })

  it('zählt jede Entwicklung eines Elements einzeln', () => {
    const meister = stamp('meister-wasser')
    expect(meister.count(facts({ monsterXp: { '2': xpForLevel(25), '4': xpForLevel(10) } }))).toBe(3)
    const s = newStamps(facts({ monsterXp: { '2': xpForLevel(25), '4': xpForLevel(25) } }), []).find((e) => e.id === 'meister-wasser')!
    expect(s.monsters).toEqual(['2', '4', '11'])
  })

  it('stempelt einen vollen Tag pro Person und Volles Haus nur, wenn beide alle fünf haben', () => {
    const all = (person: 'adrian' | 'ulrike') => ['kochen', 'einkaufen', 'waesche', 'spuelmaschine', 'garten'].map((standing) => done({ standing, person }))
    expect(ids(facts({ done: all('adrian') }))).toContain('tag-voll')
    expect(ids(facts({ done: all('adrian') }))).not.toContain('haus-voll')
    expect(ids(facts({ done: [...all('adrian'), ...all('ulrike')] }))).toContain('haus-voll')
    expect(newStamps(facts({ done: [...all('adrian'), ...all('ulrike')] }), []).find((s) => s.id === 'haus-voll')!.person).toBe(null)
  })

  it('zählt das Start-Ei nicht als Fund, aber beim Ausbrüten', () => {
    expect(ids(facts({ eggs: [egg('19')] }))).not.toContain('ei-fund')
    const found = newStamps(facts({ eggs: [egg('19'), egg('20', { found_by: 'ulrike' })] }), [])
    expect(found.find((s) => s.id === 'ei-fund')!.person).toBe('ulrike')
    const hatched = newStamps(facts({ eggs: [egg('19', { hatched_at: '2026-10-20T10:00:00Z', hatched_by: 'adrian' })] }), [])
    expect(hatched.find((s) => s.id === 'ei-schlupf')!.person).toBe('adrian')
  })

  it('zählt für XP-Stempel nur Aufgaben-XP und für Level-Ups jedes Level aller Monster', () => {
    expect(stamp('xp-10000').count(facts({ done: [done({ xp: 50 }), done({ xp: 25 })], monsterXp: { '5': 99_999 } }))).toBe(75)
    expect(stamp('levelups-10').count(facts({ monsterXp: { '2': xpForLevel(4), '5': xpForLevel(8) } }))).toBe(10)
  })

  it('speichert schon gespeicherte Stempel nicht noch einmal', () => {
    const f = facts({ monsterXp: { '2': xpForLevel(10) } })
    const earned: Earned = { id: 'evo-2', earned_at: '2026-10-18T10:00:00Z', person: 'adrian', xp: 0, monsters: [], label: null }
    expect(ids(f, [earned])).not.toContain('evo-2')
  })

  it('behält Stempel gelöschter Aufgaben mit ihrem Namen', () => {
    const earned: Earned = { id: 'task:alt', earned_at: '2026-10-18T10:00:00Z', person: 'adrian', xp: 15, monsters: ['1'], label: 'Alte Aufgabe' }
    expect(stamps([task], [earned]).at(-1)).toMatchObject({ id: 'task:alt', name: 'Alte Aufgabe', group: 'Gelöschte Aufgaben' })
  })

  it('verrät geheime Monster erst, wenn eins aufgedeckt ist', () => {
    expect(hidden(stamp('geheim-1'), facts())).toBe(true)
    expect(hidden(stamp('geheim-1'), facts({ unlocks: { '13': '2026-10-10' } }))).toBe(false)
    expect(hidden(stamp('meister-ohne'), facts())).toBe(true)
    expect(hidden(stamp('meister-wasser'), facts())).toBe(false)
  })

  it('zieht Boni ungesehener Stempel ab, damit ausgelöste Entwicklungen danach kommen', () => {
    const earned: Earned[] = [
      { id: 'a', earned_at: '2026-10-18T10:00:00Z', person: 'adrian', xp: 15, monsters: ['1', '8'], label: null },
      { id: 'b', earned_at: '2026-10-17T10:00:00Z', person: null, xp: 10, monsters: ['1'], label: null },
    ]
    expect(xpBeforeUnseen({ '1': 100, '8': 50 }, earned, ['b'])).toEqual({ '1': 85, '8': 35 })
    expect(unseenStamps(earned, []).map((e) => e.id)).toEqual(['b', 'a'])
  })
  it('gibt einen Stempel für den ersten Sieg gegen einen Boss', () => {
    const fight = (won: boolean) => ({ id: 'f', event: 'halloween', year: 2026, monsters: ['1'], started_by: 'ulrike', started_at: '2026-10-31T10:00:00Z', won, chance: 60, damage: 400, lp: 480 }) as const
    expect(ids(facts({ bossFights: [{ ...fight(false), monsters: ['1'] }] }))).not.toContain('boss-halloween')
    const s = newStamps(facts({ bossFights: [{ ...fight(true), monsters: ['1'] }] }), []).find((e) => e.id === 'boss-halloween')!
    expect(s).toMatchObject({ person: 'ulrike', xp: 0, monsters: [] })
  })
})

describe('Arena-Stempel', () => {
  it('gibt den Stempel für den ersten Sieg gegen einen Leiter und verrät Spezial-Leiter erst, wenn sie da waren', () => {
    const week = { week_start: '2026-11-02', leader: 'glut', foes: [], windows: [], recipe: {} } as unknown as ArenaWeek
    const fight = (won: boolean) => ({ id: 'f', week_start: '2026-11-02', person: 'ulrike', team: [], foes: [], potion: null, master: false, won, started_at: '2026-11-03T10:00:00Z' }) as ArenaFight
    expect(ids(facts({ arenaWeeks: [week], arenaFights: [fight(false)] }))).not.toContain('arena-glut')
    const s = newStamps(facts({ arenaWeeks: [week], arenaFights: [fight(true)] }), []).find((e) => e.id === 'arena-glut')!
    expect(s).toMatchObject({ person: 'ulrike', xp: 0 })
    const all = stamps([task], [])
    expect(hidden(all.find((x) => x.id === 'arena-glut')!, facts())).toBe(false)
    expect(hidden(all.find((x) => x.id === 'arena-nebelfrau')!, facts())).toBe(true)
  })
})
