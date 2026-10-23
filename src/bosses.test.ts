import { describe, expect, it } from 'vitest'
import { BOSSES, bestTrupp, bossDays, bossFor, bossPoints, bossState, canFight, capped, currentBoss, damageBy, lpFor, nextVisit, weakness, winChance, type Fight } from './bosses'
import type { Done } from './db'
import { eventBonus } from './events'
import { monsterById, xpForLevel } from './game'

const at = (d: string) => new Date(`${d}T12:00:00`)
const done = (day: string, xp: number, c: Partial<Done> = {}): Done => ({ monster: '2', task_id: null, standing: null, oneoff: null, person: 'adrian', xp, done_at: at(day).toISOString(), ...c })

describe('Bosse', () => {
  it('hat zu jedem Boss das Element, das vom Event-Bonus geschlagen wird', () => {
    for (const b of BOSSES) {
      const day = bossDays(b.event, 2027)[0]
      expect(eventBonus(at(day))).toBe(weakness(b))
    }
  })

  it('zählt nur Tage, an denen das Event wirklich läuft', () => {
    expect(bossDays('halloween', 2026)).toEqual(['2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'])
    expect(lpFor(bossDays('halloween', 2026))).toBe(480)
    // Silvester gehört zum Jahr, in dem es beginnt, und geht bis 2.1.
    expect(bossDays('silvester', 2026)).toEqual(['2026-12-31', '2027-01-01', '2027-01-02'])
    // Der Frühjahrsputz hängt an Ostern: 2027 vom 16. bis 22.4.
    expect(bossDays('fruehjahrsputz', 2027)).toEqual(['2027-04-16', '2027-04-17', '2027-04-18', '2027-04-19', '2027-04-20', '2027-04-21', '2027-04-22'])
  })

  it('läuft vom ersten Event-Tag bis zwei Tage nach dem Ende', () => {
    expect(currentBoss(at('2026-10-27'))).toBeNull()
    expect(currentBoss(at('2026-10-28'))?.boss.name).toBe('Schleimgeist')
    expect(currentBoss(at('2026-11-02'))?.lastDay).toBe('2026-10-31')
    expect(currentBoss(at('2026-11-03'))).toBeNull()
    expect(currentBoss(at('2027-01-04'))?.year).toBe(2026)
    expect(currentBoss(at('2027-01-05'))).toBeNull()
  })

  it('nennt den nächsten Auftritt', () => {
    expect(nextVisit(bossFor('halloween')!, at('2026-10-23'))).toBe('2026-10-28')
    expect(nextVisit(bossFor('halloween')!, at('2026-11-05'))).toBe('2027-10-28')
  })

  it('rechnet Schaden aus den XP der Erledigungen an Event-Tagen, nur vor dem Kampf', () => {
    const t = currentBoss(at('2026-10-29'))!
    const list = [
      done('2026-10-28', 30, { task_id: 'spiegel' }),
      done('2026-10-28', 20, { task_id: 'bad', person: 'ulrike' }),
      done('2026-10-29', 10, { standing: 'einkaufen' }),
      done('2026-10-29', 20, { oneoff: 'x' }),
      done('2026-10-27', 50, { task_id: 'spiegel' }),
      done('2026-11-01', 50, { task_id: 'spiegel' }),
    ]
    expect(damageBy(t, list)).toEqual({ adrian: 30 + 10 + 20, ulrike: 20 })
    const fight = { started_at: at('2026-10-29').toISOString() } as Fight
    expect(damageBy(t, list, fight)).toEqual({ adrian: 30, ulrike: 20 })
  })

  it('lässt immer 10 % der LP übrig', () => {
    expect(capped(300, 480)).toBe(300)
    expect(capped(900, 480)).toBe(432)
  })

  it('berechnet die Siegchance wie im Konzept', () => {
    const halloween = bossFor('halloween')!
    const xp = (lv: number) => xpForLevel(lv)
    // Plitsch Lv 6 neutral, Funki Lv 8 Nachteil, Krümel Lv 4 neutral, 410 von 480 geschwächt.
    const low = winChance(halloween, 410, 480, ['2', '5', '6'].map(monsterById), { 2: xp(6), 5: xp(8), 6: xp(4) })
    expect(low).toMatchObject({ weak: 43, level: 4, adv: -1, total: 47 })
    // Gaiamoos, Papillora (Luft mit Natur), Kaschmira gegen den Luft-Boss.
    const weihnachten = bossFor('weihnachten')!
    const high = winChance(weihnachten, 900, 840, ['6', '12', '7'].map(monsterById), { 6: xp(28), 12: xp(27), 7: xp(26) })
    expect(high).toMatchObject({ weak: 45, level: 18, adv: 2, total: 78 })
    expect(winChance(weihnachten, 2000, 840, ['6', '12', '7'].map(monsterById), { 6: xp(30), 12: xp(30), 7: xp(30) }).total).toBe(80)
    // Nie unter 5 %: ungeschwächt, Level 1, drei Feuer-Monster gegen Wasser.
    expect(winChance(halloween, 0, 480, ['5', '9', '15'].map(monsterById), {}).total).toBe(5)
  })

  it('schlägt Monster mit Element-Vorteil vor', () => {
    const t = bestTrupp(bossFor('halloween')!, ['1', '2', '5', '8', '6'].map(monsterById), {})
    expect(t.map((m) => m.id).sort()).toEqual(['1', '8', '2'].sort())
  })

  it('öffnet den Kampf ab dem letzten Tag und zeigt danach das Ergebnis', () => {
    const list = [done('2026-10-28', 100, { task_id: 'bad' })]
    const mid = bossState(at('2026-10-29'), list, [])!
    expect(mid).toMatchObject({ lp: 480, damage: 100 })
    expect(canFight(mid, at('2026-10-29'))).toBe(false)
    expect(canFight(bossState(at('2026-11-02'), list, [])!, at('2026-11-02'))).toBe(true)
    const fight = (won: boolean) => ({ event: 'halloween', year: 2026, won, damage: 100, lp: 480, started_at: at('2026-10-31').toISOString() }) as Fight
    expect(bossState(at('2026-11-01'), list, [fight(true)])!.damage).toBe(480)
    expect(bossState(at('2026-11-01'), list, [fight(false)])!.damage).toBe(100)
    expect(canFight(bossState(at('2026-11-01'), list, [fight(false)])!, at('2026-11-01'))).toBe(false)
  })

  it('gibt 6 Punkte je Sieg', () => {
    const f = (won: boolean) => ({ won }) as Fight
    expect(bossPoints([f(true), f(false), f(true)])).toBe(12)
  })
})
