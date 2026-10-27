// Stempelheft: Stempel für Meilensteine, Elemente und jede Aufgabe. Gemeinsam für beide und rückwirkend gezählt.
// Ein Stempel wird gespeichert, sobald seine Bedingung erfüllt ist, und bleibt dann (auch wenn ein Haken zurückgenommen wird).
// Bonus-XP gehen an alle Monster, die in dem Moment sichtbar sind (bei Element-Stempeln nur an dieses Element),
// und zählen über die Tabelle stamps in die Monster-XP (supabase/stempelheft.sql).
import { LEADERS, leaderById, leadersSeen, leadersWon } from './arena'
import { BOSSES } from './bosses'
import type { Done, Snapshot, Task } from './db'
import type { Egg } from './eggs'
import { EVENT_LABEL } from './events'
import { ELEMENTS, MAX_LEVEL, MONSTERS, STANDING, TASK_ELEMENTS, dayString, levelFor, stageFor, type MonsterElement, type Person } from './game'
import { isVisible, visibleMonsters } from './secret'
import { longest, weekDays, weekPoints } from './streak'

// Gespeicherter Stempel (Tabelle stamps). person fehlt, wenn ihn beide zusammen verdient haben.
// label: Name der Aufgabe beim Verdienen, damit gelöschte Aufgaben ihren Stempel behalten.
export type Earned = { id: string; earned_at: string; person: Person | null; xp: number; monsters: string[]; label: string | null }

// Alles, was die Bedingungen brauchen.
export type Facts = Pick<Snapshot, 'done' | 'tasks' | 'monsterXp' | 'unlocks' | 'eggs' | 'streakWeeks' | 'bossFights' | 'arenaWeeks' | 'arenaFights' | 'jokers'> & { today: string; week: string }

export type Icon = 'pfeil' | 'geheim' | 'topf' | 'haus' | 'schwamm' | 'ei' | 'nest' | 'klemmbrett' | 'krone' | 'schwert' | 'pokal' | MonsterElement

export type Stamp = {
  id: string
  group: string
  name: string
  // Bedingung als Satz, z. B. „25× Katzenklo leeren“.
  text: string
  // Schrift im Bogen oben, in der Mitte ein Symbol oder eine kurze Zahl.
  arc: string
  icon?: Icon
  big?: string
  color: string
  // Verdient, sobald count das Ziel erreicht.
  goal: number
  count: (f: Facts) => number
  // Bonus-XP; element fehlt bei „für alle“. null: keine XP.
  reward: { xp: number; element?: MonsterElement } | null
}

export const TASK_GOAL = 25
const COLOR = { arena: '#B8321E', boss: '#2A1846', evo: '#D6284A', geheim: '#6A52B0', standing: '#FF5A3C', streak: '#00B39B', ei: '#C78A4A', grau: '#8C82A8', summe: '#1B1530', level: '#9B7BFF', gold: '#E0B000' }
// Licht ist als Tinte auf Weiß zu blass, deshalb dunkler.
export const ink = (e: MonsterElement) => (e === 'licht' ? COLOR.gold : ELEMENTS[e].strong)

const secrets = MONSTERS.filter((m) => m.secret)
const fmt = (n: number) => n.toLocaleString('de-DE')
const forAll = (xp: number) => (xp ? { xp } : null)

const levels = (f: Facts) => MONSTERS.map((m) => ({ m, level: levelFor(f.monsterXp[m.id] ?? 0) }))
const maxStage = (f: Facts) => Math.max(...levels(f).map(({ m, level }) => stageFor(m, level)))
const evolutions = (f: Facts, e: MonsterElement) => levels(f).filter(({ m }) => m.element === e).reduce((n, { m, level }) => n + stageFor(m, level), 0)

// Ständige Aufgaben pro Tag und Person.
function standingDays(done: Done[]) {
  const days = new Map<string, Partial<Record<Person, number>>>()
  for (const c of done) {
    if (!c.standing) continue
    const day = dayString(new Date(c.done_at))
    const p = days.get(day) ?? {}
    p[c.person] = (p[c.person] ?? 0) + 1
    days.set(day, p)
  }
  return [...days.values()]
}

// Wochen mit 7 Punkten: abgeschlossene und die laufende, sobald sie sieben geschaffte Tage hat.
function perfectWeeks(f: Facts) {
  const past = weekPoints(f.week, f.streakWeeks, f.tasks, f.done, f.jokers).filter((w) => w.points === 7).length
  return past + (longest(weekDays(f.week, f.today, f.tasks, f.done, f.jokers)) === 7 ? 1 : 0)
}

const milestone = (s: Omit<Stamp, 'group'>): Stamp => ({ ...s, group: 'Meilensteine' })

// Meilensteine und Element-Stempel in der Reihenfolge der abgesegneten Liste.
export const FIXED: Stamp[] = [
  ...['Erste Verwandlung', 'Zweite Verwandlung', 'Ganz groß'].map((name, i) =>
    milestone({
      id: `evo-${i + 2}`, name, arc: `Stufe ${i + 2}`, icon: 'pfeil', color: COLOR.evo, goal: i + 1, reward: null,
      text: i === 2 ? 'Ein Monster erreicht Stufe 4 (nur Arborius)' : `Ein Monster erreicht Stufe ${i + 2}`,
      count: maxStage,
    }),
  ),
  milestone({ id: 'geheim-1', name: 'Entdecker', text: 'Ein geheimes Monster aufgedeckt', arc: 'Entdecker', icon: 'geheim', color: COLOR.geheim, goal: 1, reward: forAll(10),
    count: (f) => secrets.filter((m) => isVisible(m, f.unlocks, f.today)).length }),
  milestone({ id: 'geheim-6', name: 'Alle Geheimnisse', text: `Alle ${secrets.length} geheimen Monster aufgedeckt`, arc: 'Geheimnisse', icon: 'geheim', color: COLOR.geheim, goal: secrets.length, reward: forAll(15),
    count: (f) => secrets.filter((m) => isVisible(m, f.unlocks, f.today)).length }),
  milestone({ id: 'tag-voll', name: 'Voller Tag', text: 'Eine Person hakt an einem Tag alle 5 ständigen Aufgaben ab', arc: 'Voller Tag', icon: 'topf', color: COLOR.standing, goal: STANDING.length, reward: forAll(10),
    count: (f) => Math.max(0, ...standingDays(f.done).map((p) => Math.max(p.adrian ?? 0, p.ulrike ?? 0))) }),
  milestone({ id: 'haus-voll', name: 'Volles Haus', text: 'Ihr beide hakt am selben Tag jeweils alle 5 ständigen Aufgaben ab', arc: 'Volles Haus', icon: 'haus', color: COLOR.standing, goal: STANDING.length, reward: forAll(15),
    count: (f) => Math.max(0, ...standingDays(f.done).map((p) => Math.min(p.adrian ?? 0, p.ulrike ?? 0))) }),
  milestone({ id: 'woche-1', name: 'Perfekte Woche', text: 'Eine Woche mit 7-Tage-Streak', arc: 'Perfekt', icon: 'schwamm', color: COLOR.streak, goal: 1, reward: forAll(10), count: perfectWeeks }),
  milestone({ id: 'woche-3', name: 'Drei perfekte Wochen', text: 'Insgesamt 3 Wochen mit 7-Tage-Streak', arc: '3 Wochen', icon: 'schwamm', color: COLOR.streak, goal: 3, reward: forAll(20), count: perfectWeeks }),
  milestone({ id: 'ei-fund', name: 'Eierfund', text: 'Ein Ei beim Abhaken gefunden (das Start-Ei zählt nicht)', arc: 'Eierfund', icon: 'ei', color: COLOR.ei, goal: 1, reward: forAll(10),
    count: (f) => f.eggs.filter((e) => e.found_by).length }),
  milestone({ id: 'ei-schlupf', name: 'Geschlüpft', text: 'Ein Ei ausgebrütet', arc: 'Geschlüpft', icon: 'ei', color: COLOR.ei, goal: 1, reward: forAll(10),
    count: (f) => f.eggs.filter((e) => e.hatched_at).length }),
  milestone({ id: 'ei-alle', name: 'Volles Nest', text: '10 Eier ausgebrütet', arc: 'Volles Nest', icon: 'nest', color: COLOR.ei, goal: 10, reward: forAll(25),
    count: (f) => f.eggs.filter((e) => e.hatched_at).length }),
  milestone({ id: 'einmalig-30', name: 'Projekt-Profis', text: '30 einmalige Aufgaben erledigt', arc: 'Projekte', icon: 'klemmbrett', color: COLOR.grau, goal: 30, reward: forAll(15),
    count: (f) => f.done.filter((c) => c.oneoff).length }),
  ...([[100, 'Hundert', 10], [500, 'Fünfhundert', 15], [1000, 'Tausend', 25]] as const).map(([n, name, xp]) =>
    milestone({ id: `aufgaben-${n}`, name, text: `${fmt(n)} Aufgaben erledigt`, arc: 'Aufgaben', big: String(n), color: COLOR.summe, goal: n, reward: forAll(xp), count: (f) => f.done.length }),
  ),
  milestone({ id: 'gold', name: 'Goldstück', text: `Ein Monster erreicht Level ${MAX_LEVEL}`, arc: `Level ${MAX_LEVEL}`, icon: 'krone', color: COLOR.gold, goal: MAX_LEVEL, reward: forAll(25),
    count: (f) => Math.max(...levels(f).map((l) => l.level)) }),
  // Zählt jedes Level, das irgendein Monster aufsteigt, auch durch Stempel-Boni.
  ...([[10, 0], [50, 5], [100, 10]] as const).map(([n, xp]) =>
    milestone({ id: `levelups-${n}`, name: `${n} Level-Ups`, text: `Eure Monster sind zusammen ${n}× aufgestiegen`, arc: 'Level-Ups', big: String(n), color: COLOR.level, goal: n, reward: forAll(xp),
      count: (f) => levels(f).reduce((sum, l) => sum + l.level - 1, 0) }),
  ),
  // Nur XP aus Aufgaben, keine Stempel-Boni.
  ...([[10_000, '10k'], [50_000, '50k'], [100_000, '100k']] as const).map(([n, big]) =>
    milestone({ id: `xp-${n}`, name: `${fmt(n)} XP`, text: `${fmt(n)} XP mit Aufgaben verdient`, arc: 'XP', big, color: COLOR.evo, goal: n, reward: null,
      count: (f) => f.done.reduce((sum, c) => sum + c.xp, 0) }),
  ),
  ...([...TASK_ELEMENTS, 'ohne'] as MonsterElement[]).map((e) => {
    const name = e === 'ohne' ? 'Ohne' : ELEMENTS[e].name
    return {
      id: `meister-${e}`, group: 'Elemente', name: `${name}-Meister`, arc: name, icon: e, color: ink(e), goal: 4, reward: { xp: 20, element: e },
      text: e === 'ohne' ? '4× ein Monster ohne Element entwickelt' : `4× ein ${name}-Monster entwickelt`,
      count: (f: Facts) => evolutions(f, e),
    }
  }),
  // Ein Stempel je Boss für den ersten Sieg, ohne XP.
  ...BOSSES.map((b) => ({
    id: `boss-${b.event}`, group: 'Bosse', name: b.name, text: `${b.name} besiegt (${EVENT_LABEL[b.event].replace(/^\S+ /, '')})`, arc: b.name, icon: 'schwert' as const,
    color: COLOR.boss, goal: 1, reward: null, count: (f: Facts) => f.bossFights.filter((x) => x.event === b.event && x.won).length,
  })),
  // Ein Stempel je Arenaleiter für den ersten Sieg und einer für alle 12, ohne XP.
  ...LEADERS.map((l) => ({
    id: `arena-${l.id}`, group: 'Arena', name: l.name, text: `${l.name} in der Arena besiegt`, arc: l.name, icon: 'pokal' as const,
    color: COLOR.arena, goal: 1, reward: null, count: (f: Facts) => Number(leadersWon(f.arenaWeeks, f.arenaFights).has(l.id)),
  })),
  { id: 'arena-champion', group: 'Arena', name: 'Arena-Champion', text: `Alle ${LEADERS.length} Arenaleiter besiegt`, arc: 'Champion', icon: 'pokal', color: COLOR.gold, goal: LEADERS.length, reward: null,
    count: (f) => leadersWon(f.arenaWeeks, f.arenaFights).size },
]

const taskStamp = (id: string, name: string, group: string, element: MonsterElement, count: Stamp['count']): Stamp => ({
  id, group, name, text: `${TASK_GOAL}× ${name}`, arc: name, big: `${TASK_GOAL}×`, color: ink(element), goal: TASK_GOAL, reward: { xp: 15, element }, count,
})

// Alle Stempel: feste, ständige Aufgaben, Aufgaben nach Raum. Gelöschte Aufgaben nur, wenn ihr Stempel schon verdient ist.
export function stamps(tasks: Task[], earned: Earned[]): Stamp[] {
  const gone = earned.filter((e) => e.id.startsWith('task:') && !tasks.some((t) => `task:${t.id}` === e.id))
  return [
    ...FIXED,
    ...STANDING.map((s) => taskStamp(`standing:${s.id}`, s.name, 'Ständige Aufgaben', s.element, (f) => f.done.filter((c) => c.standing === s.id).length)),
    ...tasks.map((t) => taskStamp(`task:${t.id}`, t.name, t.room, t.element, (f) => f.done.filter((c) => c.task_id === t.id).length)),
    ...gone.map((e) => ({ ...taskStamp(e.id, e.label ?? 'Gelöschte Aufgabe', 'Gelöschte Aufgaben', 'ohne', () => TASK_GOAL), color: COLOR.grau })),
  ]
}

// Ohne Namen, solange der Stempel ein geheimes Monster verraten würde.
export function hidden(s: Stamp, f: Facts) {
  if (s.id.startsWith('geheim-')) return s.count(f) === 0
  if (s.id.startsWith('boss-')) return !f.bossFights.some((x) => `boss-${x.event}` === s.id)
  if (s.id.startsWith('arena-') && s.id !== 'arena-champion') return !!leaderById(s.id.slice(6)).special && !leadersSeen(f.arenaWeeks).has(s.id.slice(6))
  if (s.id === 'meister-ohne') return !visibleMonsters(f.unlocks, f.today, f.eggs).some((m) => m.element === 'ohne')
  return false
}

// Wer den Stempel ausgelöst hat: bei Eiern wer gefunden bzw. ausgebrütet hat, bei Streak und Volles Haus beide,
// sonst wer zuletzt etwas abgehakt hat.
function earnedBy(s: Stamp, f: Facts): Person | null {
  const first = (list: Egg[], at: (e: Egg) => string) => [...list].sort((a, b) => at(a).localeCompare(at(b)))[0]
  if (s.id === 'ei-fund') return first(f.eggs.filter((e) => e.found_by), (e) => e.found_at).found_by
  if (s.id.startsWith('ei-')) return first(f.eggs.filter((e) => e.hatched_at), (e) => e.hatched_at!).hatched_by
  if (s.id.startsWith('woche-') || s.id === 'haus-voll') return null
  if (s.id.startsWith('boss-')) return f.bossFights.find((x) => `boss-${x.event}` === s.id && x.won)!.started_by
  if (s.id.startsWith('arena-')) {
    const leaderOf = (week: string) => f.arenaWeeks.find((w) => w.week_start === week)?.leader
    return f.arenaFights.filter((x) => x.won && (s.id === 'arena-champion' || `arena-${leaderOf(x.week_start)}` === s.id)).at(-1)?.person ?? null
  }
  return f.done.reduce<Done | null>((last, c) => (!last || c.done_at >= last.done_at ? c : last), null)?.person ?? null
}

// Stempel, deren Bedingung erfüllt ist, die aber noch nicht gespeichert sind, fertig zum Speichern.
export function newStamps(f: Facts, earned: Earned[]): Omit<Earned, 'earned_at'>[] {
  const visible = visibleMonsters(f.unlocks, f.today, f.eggs)
  return stamps(f.tasks, earned)
    .filter((s) => !earned.some((e) => e.id === s.id) && s.count(f) >= s.goal)
    .map((s) => ({
      id: s.id,
      person: earnedBy(s, f),
      xp: s.reward?.xp ?? 0,
      monsters: s.reward ? visible.filter((m) => !s.reward!.element || m.element === s.reward!.element).map((m) => m.id) : [],
      label: s.id.startsWith('task:') ? s.name : null,
    }))
}

// Monster-XP ohne die Boni der Stempel, die diese Person noch nicht gesehen hat. So kommen Entwicklungen,
// die erst ein Stempel ausgelöst hat, nach seiner Animation.
export function xpBeforeUnseen(monsterXp: Record<string, number>, earned: Earned[], seen: string[]) {
  const xp = { ...monsterXp }
  for (const e of earned) if (!seen.includes(e.id)) for (const m of e.monsters) xp[m] = (xp[m] ?? 0) - e.xp
  return xp
}

// Verdiente Stempel, deren Animation diese Person noch nicht gesehen hat, ältester zuerst.
export const unseenStamps = (earned: Earned[], seen: string[]) =>
  earned.filter((e) => !seen.includes(e.id)).sort((a, b) => a.earned_at.localeCompare(b.earned_at) || a.id.localeCompare(b.id))

// Belohnung als Text, z. B. „+15 XP für alle Licht-Monster“.
export function rewardText(r: Stamp['reward']) {
  if (!r) return 'Nur der Stempel, keine XP'
  const who = !r.element ? 'Monster' : r.element === 'ohne' ? 'Monster ohne Element' : `${ELEMENTS[r.element].name}-Monster`
  return `+${r.xp} XP für alle ${who}`
}
