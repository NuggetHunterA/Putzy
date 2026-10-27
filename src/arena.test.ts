import { describe, expect, it } from 'vitest'
import {
  LEADERS, counters, drawLeader, factor, foeLevel, hintsFor, jokerAccount, leaderById, progress, rollFoes, rollRecipe, rollWindows, simulate, teamSize, trainingHits,
  verdict, weakened, type ArenaFight, type ArenaWeek, type Ctx, type Fighter, type Potion,
} from './arena'
import type { Done, Task } from './db'
import { MONSTERS, monsterById, xpForLevel } from './game'
import { addDays, weekDays } from './streak'

const WEEK = '2026-11-02'
const lv = (ids: Record<string, number>) => Object.fromEntries(Object.entries(ids).map(([id, l]) => [id, xpForLevel(l)]))
const base = MONSTERS.filter((m) => !m.secret && !m.egg)
const task = (id: string, more: Partial<Task> = {}): Task => ({ id, room: 'Küche', name: id, element: 'wasser', effort: 'M', interval_days: 7, first_due: WEEK, sort: 0, ...more })
const done = (at: string, more: Partial<Done> = {}): Done => ({ monster: '2', task_id: 'bad', standing: null, oneoff: null, person: 'adrian', xp: 25, done_at: new Date(at).toISOString(), ...more })
const week = (more: Partial<ArenaWeek> = {}): ArenaWeek => ({
  week_start: WEEK,
  leader: 'glut',
  foes: [16, 18, 17].map((level) => ({ id: '5', stage: 1, level, elements: ['feuer'] })),
  windows: [{ day: '2026-11-02', from: 18, to: 20 }, { day: '2026-11-04', from: 7, to: 10 }, { day: '2026-11-07', from: 14, to: 17 }],
  recipe: {
    potion: 'kraft',
    ingredients: [
      { name: 'Seifenperle', element: 'wasser', spot: { kind: 'spaet' } },
      { name: 'Federflaum', element: 'luft', spot: { kind: 'element', element: 'wasser', n: 2 } },
      { name: 'Moosfaden', element: 'natur', spot: { kind: 'zusammen' } },
    ],
    master: { name: 'Goldseife', element: null, spot: { kind: 'raeume', n: 4 } },
  },
  ...more,
})
const ctx = (list: Done[], more: Partial<Ctx> = {}): Ctx => ({
  week: week(),
  now: new Date('2026-11-08T21:00:00'),
  tasks: [task('bad', { room: 'Bad unten' }), task('herd', { element: 'feuer' })],
  done: list,
  jokers: [],
  expeditions: [],
  feedings: [],
  monsterXp: {},
  ...more,
})

describe('Arena: Auslosung', () => {
  it('kennt die Konter-Elemente, bei „ohne Element“ zählt jedes', () => {
    expect(counters(leaderById('glut'))).toEqual(['wasser'])
    expect(counters(leaderById('brodel'))).toEqual(['wasser', 'licht'])
    expect(counters(leaderById('grau'))).toHaveLength(5)
  })

  it('überspringt Leiter mit zu wenigen Reihen, wiederholt keinen innerhalb von 4 Wochen und bringt Spezial-Leiter erst nach allen normalen', () => {
    const history = (ids: string[]) => ids.map((leader, i) => ({ ...week(), week_start: `2026-10-${String(5 + i * 7).padStart(2, '0')}`, leader }))
    for (let i = 0; i < 30; i++) {
      const w = `2027-01-${String(1 + i).padStart(2, '0')}`
      const l = drawLeader(w, [], base)
      expect(l.id).not.toBe('grau')
      expect(l.special).toBeUndefined()
    }
    for (let k = 0; k < 20; k++) {
      const w = addDays('2026-11-02', 7 * k)
      const recent = ['glut', 'moos', 'boee'].map((leader, i) => ({ ...week(), week_start: addDays(w, -7 * (i + 1)), leader }))
      expect(['glut', 'moos', 'boee']).not.toContain(drawLeader(w, recent, base).id)
    }
    const ohne = MONSTERS.filter((m) => m.element === 'ohne')
    const all = history(LEADERS.filter((l) => !l.special).map((l) => l.id))
    const specials = new Set(Array.from({ length: 60 }, (_, i) => drawLeader(`2027-03-01:${i}`, all, [...base, ...ohne]).special))
    expect(specials.has(true)).toBe(true)
  })

  it('wählt die Teamgröße nach Reihen mit Level 10 und das Level aus euren stärksten Monstern', () => {
    const ms = base
    const ten = (n: number) => Object.fromEntries(ms.slice(0, n).map((m) => [m.id, xpForLevel(10)]))
    expect(teamSize(leaderById('glut'), ms, ten(7))).toBe(3)
    expect(teamSize(leaderById('glut'), ms, ten(8))).toBe(4)
    expect(teamSize(leaderById('nebelfrau'), ms, {})).toBe(5)
    // Stärkste drei: 14, 12, 10 → Ø 12 × 1,25 + 1 = 16; Spezial +2.
    const xp = lv({ 1: 14, 2: 12, 3: 10, 4: 2 })
    expect(foeLevel(leaderById('glut'), 3, ms, xp)).toBe(16)
    expect(foeLevel(leaderById('nebelfrau'), 3, ms, xp)).toBe(18)
  })

  it('stellt das Gegner-Team aus euren Reihen auf eurer Stufe, Spezial-Leiter mit ihren Unique-Monstern', () => {
    const xp = lv({ 5: 12, 9: 4 })
    const foes = rollFoes(WEEK, leaderById('glut'), base, xp)
    expect(foes).toHaveLength(3)
    for (const f of foes) {
      expect(['5', '9']).toContain(f.id)
      expect(f.stage).toBe(f.id === '5' ? 1 : 0)
      expect(f.level).toBe(foes[0].level)
    }
    const special = rollFoes(WEEK, leaderById('schmutzkoenig'), base, xp)
    expect(special.map((f) => f.id).slice(0, 2)).toEqual(['hydrapilz', 'qualmlilie'])
    expect(special).toHaveLength(5)
  })

  it('legt drei Trainingsfenster auf verschiedene Tage, eines am Wochenende', () => {
    for (const w of ['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23']) {
      const ws = rollWindows(w)
      expect(new Set(ws.map((x) => x.day)).size).toBe(3)
      expect(ws.some((x) => [5, 6].includes(new Date(x.day).getDay() === 0 ? 6 : new Date(x.day).getDay() - 1))).toBe(true)
      for (const x of ws) {
        expect(x.from).toBeGreaterThanOrEqual(7)
        expect(x.to).toBeLessThanOrEqual(22)
        expect(x.to - x.from).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('lost drei Zutaten aus drei Elementen, ohne Fundorte, die diese Woche nicht gehen', () => {
    for (const w of ['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30']) {
      const r = rollRecipe(w, leaderById('glut'), { monsters: base, monsterXp: {}, tasks: [task('a')], dueThisWeek: [], openOneOffs: 0, now: new Date(w) })
      expect(new Set(r.ingredients.map((i) => i.element)).size).toBe(3)
      const spots = [...r.ingredients.map((i) => i.spot), r.master.spot]
      expect(spots.some((s) => s.kind === 'einmalig' || (s.kind === 'aufwand' && s.effort === 'G'))).toBe(false)
    }
  })
})

describe('Arena: unter der Woche', () => {
  it('zählt Fundorte ab Montag', () => {
    const list = [done('2026-11-01T21:00'), done('2026-11-03T20:30'), done('2026-11-04T09:00', { person: 'ulrike', task_id: 'herd' })]
    const x = ctx(list)
    expect(progress({ kind: 'spaet' }, x)).toEqual({ have: 1, need: 1 })
    expect(progress({ kind: 'element', element: 'wasser', n: 2 }, x)).toEqual({ have: 1, need: 2 })
    expect(progress({ kind: 'zusammen' }, x)).toEqual({ have: 0, need: 1 })
    expect(progress({ kind: 'zusammen' }, ctx([...list, done('2026-11-04T08:00')]))).toEqual({ have: 1, need: 1 })
  })

  it('trifft je Fenster höchstens einmal, nur mit dem Konter-Element, und schwächt das stärkste Monster', () => {
    const list = [done('2026-11-02T18:10'), done('2026-11-02T19:00'), done('2026-11-04T08:00', { task_id: 'herd' }), done('2026-11-07T13:59')]
    const hits = trainingHits(ctx(list))
    expect(hits.map((h) => (h ? h.done_at : null))).toEqual([list[0].done_at, null, null])
    expect(weakened(week().foes, 2).map((f) => f.level)).toEqual([16, 16, 17])
  })

  it('meldet beim Abhaken neue Zutaten und gestörte Trainings', () => {
    const x = ctx([done('2026-11-02T10:00')])
    const hints = hintsFor(x, [], done('2026-11-02T19:30'))
    expect(hints.map((h) => h.kind)).toEqual(['zutat', 'training'])
    expect(hints[0].kind === 'zutat' && hints[0].ingredient.name).toBe('Federflaum')
    expect(hintsFor(x, [{ week_start: WEEK, person: 'adrian', master: false, brewed_at: 'x' }], done('2026-11-02T19:30'))).toEqual([])
  })

  it('zählt einen Joker in der Streak als einen Tag mehr', () => {
    const tasks = [task('a', { interval_days: 2, first_due: '2026-11-02' })]
    const list = [done('2026-11-02T10:00', { task_id: 'a' })]
    expect(weekDays(WEEK, '2026-11-05', tasks, list)).toEqual([true, true, false, false, false, false, false])
    const joker = { id: 'j', task_id: 'a', anchor: '2026-11-02', person: 'adrian' as const, used_at: 'x' }
    expect(weekDays(WEEK, '2026-11-05', tasks, list, [joker])).toEqual([true, true, true, false, false, false, false])
  })
})

describe('Arena: Kampf und Joker', () => {
  const fighter = (level: number, ...elements: Fighter['elements']): Fighter => ({ id: '2', stage: 0, level, elements })

  it('nimmt bei zwei Elementen das günstigere', () => {
    expect(factor(['wasser'], ['feuer'])).toBe(1.25)
    expect(factor(['natur'], ['feuer'])).toBe(0.8)
    expect(factor(['natur', 'wasser'], ['feuer'])).toBe(1.25)
    expect(factor(['ohne'], ['feuer'])).toBe(1)
  })

  it('spielt denselben Kampf aus derselben id gleich nach', () => {
    const team = [fighter(10, 'wasser'), fighter(12, 'licht')]
    const foes = [fighter(14, 'feuer'), fighter(14, 'feuer')]
    expect(simulate('a', team, foes, null, false)).toEqual(simulate('a', team, foes, null, false))
    const { hits } = simulate('a', team, foes, null, false)
    expect(Math.max(...hits.map((h) => h.round))).toBeLessThanOrEqual(12)
  })

  // Wie Konzept 7: 4 Monster, Gegner alle Wasser mit Level × 1,25 + 1, „Konter“ = 2 Licht-Monster.
  it('ist ohne Vorbereitung kaum zu schaffen, mit Trank etwa jede zweite Woche, mit allem etwa 3 von 4', () => {
    const rate = (team: Fighter[], foes: Fighter[], potion: Potion | null, master: boolean) => {
      let wins = 0
      for (let i = 0; i < 1000; i++) if (simulate(`balance:${i}`, team, foes, potion, master).won) wins++
      return wins / 1000
    }
    for (const level of [6, 12, 20]) {
      const foes = Array.from({ length: 4 }, () => fighter(Math.round(level * 1.25 + 1), 'wasser'))
      const plain = Array.from({ length: 4 }, () => fighter(level, 'luft'))
      const konter = [...plain.slice(0, 2), fighter(level, 'licht'), fighter(level, 'licht')]
      expect(rate(plain, foes, null, false)).toBeLessThan(0.05)
      expect(rate(konter, weakened(foes, 3), 'kraft', false)).toBeGreaterThan(0.4)
      expect(rate(konter, weakened(foes, 3), 'kraft', false)).toBeLessThan(0.7)
      for (const p of ['schild', 'kraft', 'leben', 'element'] as Potion[]) {
        expect(rate(konter, weakened(foes, 3), p, true)).toBeGreaterThan(0.6)
        expect(rate(konter, weakened(foes, 3), p, true)).toBeLessThan(0.85)
      }
    }
    expect(verdict([fighter(6, 'luft')], [fighter(20, 'wasser')], null, false)).toBe('schwer')
  })

  it('zählt Joker der Reihe nach, höchstens 5, Siege bei vollem Konto verfallen', () => {
    const fight = (id: string, at: string, won = true) => ({ id, started_at: at, won }) as ArenaFight
    const use = (at: string) => ({ id: at, task_id: 't', anchor: 'x', person: 'adrian' as const, used_at: at })
    const fights = ['1', '2', '3', '4', '5', '6'].map((n) => fight(n, `2026-11-0${n}`))
    expect(jokerAccount(fights, [])).toEqual({ balance: 5, lost: ['6'] })
    expect(jokerAccount(fights, [use('2026-11-05T12')])).toEqual({ balance: 5, lost: [] })
    expect(jokerAccount([fight('1', '2026-11-01', false)], [])).toEqual({ balance: 0, lost: [] })
  })

  it('hat für jeden Leiter Bild-Namen und bei Spezial-Leitern zwei Unique-Monster', () => {
    expect(LEADERS).toHaveLength(12)
    expect(LEADERS.filter((l) => l.special).every((l) => l.uniques?.length === 2)).toBe(true)
    expect(monsterById('5').move).toBeTruthy()
  })
})
