// Datenzugriff auf Supabase. Der Schlüssel kommt aus dem Haushaltslink (#k=…), nicht aus dem Build.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Fight } from './bosses'
import type { Egg } from './eggs'
import { fruitXp, type Expedition, type Feeding, type Fruit } from './expeditions'
import type { Effort, Element, Person } from './game'
import type { Earned } from './stamps'
import type { StreakWeek } from './streak'

export type Task = {
  id: string
  room: string
  name: string
  element: Element
  effort: Effort
  interval_days: number
  first_due: string
  sort: number
}
// team: Monster, die dafür den Team-Bonus von je team_xp XP bekommen haben (zählt in monster_xp).
export type Completion = { id: string; task_id: string | null; standing: string | null; oneoff: string | null; person: Person; monster: string; xp: number; team: string[]; team_xp: number; done_at: string }
export type Pick = { week_start: string; person: Person; monster: string }
export type Seen = { person: Person; monster: string; stage: number }
// Alle Erledigungen in kurz, für Eure Werte im Pedia.
export type Done = { monster: string; task_id: string | null; standing: string | null; oneoff: string | null; person: Person; xp: number; done_at: string }
export type OneOff = { id: string; name: string; created_at: string }

export type Snapshot = {
  tasks: Task[]
  lastDone: Record<string, Date>
  // XP mit Früchten; cleanXp ohne Früchte, nur für die Bremse (src/expeditions.ts).
  monsterXp: Record<string, number>
  cleanXp: Record<string, number>
  today: Completion[]
  picks: Pick[]
  seen: Seen[]
  // Was ist neu: zuletzt gesehene Neuigkeit pro Person (fehlt, solange die Person noch keinen Stand hat).
  newsSeen: Partial<Record<Person, number>>
  // Erledigte Aufgaben pro Monster und Person.
  tasksDone: Record<string, Partial<Record<Person, number>>>
  // Einmalige Aufgaben, älteste zuerst, und ihre Erledigungen, neueste zuerst.
  oneoffs: OneOff[]
  oneoffsDone: Completion[]
  done: Done[]
  // Geheime Reihen: Monster-id → Tag der Freischaltung (src/secret.ts).
  unlocks: Record<string, string>
  // Eier im Nest und ausgebrütete (src/eggs.ts), gespeicherte Streak-Punkte pro Woche (src/streak.ts).
  eggs: Egg[]
  streakWeeks: StreakWeek[]
  // Stempelheft (src/stamps.ts): verdiente Stempel und welche Animation wer schon gesehen hat.
  stamps: Earned[]
  stampsSeen: { person: Person; stamp: string }[]
  // Expeditionen, älteste zuerst, wer welche Heimkehr gesehen hat, und verfütterte Früchte.
  expeditions: Expedition[]
  expeditionsSeen: { person: Person; expedition: string }[]
  feedings: Feeding[]
  // Boss-Endkämpfe, älteste zuerst, und wer welche Kampf-Szene gesehen hat.
  bossFights: Fight[]
  bossFightsSeen: { person: Person; fight: string }[]
}

// Einmalige Aufgaben ohne Erledigung.
export const openOneOffs = (snap: Snapshot) => snap.oneoffs.filter((o) => !snap.oneoffsDone.some((c) => c.oneoff === o.id))

const KEY_STORAGE = 'putzy.key'

// Liest den Schlüssel aus dem Link, merkt ihn sich und entfernt ihn aus der Adresszeile.
function householdKey() {
  const fromHash = new URLSearchParams(location.hash.slice(1)).get('k')
  if (fromHash) {
    localStorage.setItem(KEY_STORAGE, fromHash)
    history.replaceState(null, '', location.pathname)
  }
  return localStorage.getItem(KEY_STORAGE)
}

let client: SupabaseClient | null = null

export function connect() {
  const key = householdKey()
  if (key) client = createClient(import.meta.env.VITE_SUPABASE_URL, key)
  return client !== null
}

const db = () => client!

function check<T>({ data, error }: { data: T | null; error: unknown }) {
  if (error) throw error
  return data as T
}

export async function load(todayStart: Date, week: string): Promise<Snapshot> {
  const [tasks, last, xp, today, picks, seen, stats, news, oneoffs, oneoffsDone, unlocks, eggs, streakWeeks, stamps, stampsSeen, expeditions, expeditionsSeen, feedings, bossFights, bossFightsSeen, done] = await Promise.all([
    db().from('tasks').select('*').order('sort'),
    db().from('task_last_done').select('*'),
    db().from('monster_xp').select('*'),
    db().from('completions').select('*').gte('done_at', todayStart.toISOString()).order('done_at'),
    db().from('picks').select('*').eq('week_start', week),
    db().from('seen').select('person, monster, stage'),
    db().from('monster_stats').select('*'),
    db().from('news_seen').select('*'),
    db().from('oneoffs').select('*').order('created_at'),
    db().from('completions').select('*').not('oneoff', 'is', null).order('done_at', { ascending: false }),
    db().from('unlocks').select('*'),
    db().from('eggs').select('*'),
    db().from('streak_weeks').select('*'),
    db().from('stamps').select('*'),
    db().from('stamps_seen').select('person, stamp'),
    db().from('expeditions').select('*').order('started_at'),
    db().from('expeditions_seen').select('person, expedition'),
    db().from('feedings').select('*').order('fed_at'),
    db().from('boss_fights').select('*').order('started_at'),
    db().from('boss_fights_seen').select('person, fight'),
    loadDone(),
  ])
  const tasksDone: Snapshot['tasksDone'] = {}
  for (const r of check<{ monster: string; person: Person; tasks: number }[]>(stats)) {
    tasksDone[r.monster] = { ...tasksDone[r.monster], [r.person]: r.tasks }
  }
  const cleanXp: Record<string, number> = Object.fromEntries(check<{ monster: string; xp: number }[]>(xp).map((r) => [r.monster, r.xp]))
  const fed = check<Feeding[]>(feedings)
  const monsterXp = { ...cleanXp }
  for (const [m, n] of Object.entries(fruitXp(fed))) monsterXp[m] = (monsterXp[m] ?? 0) + n
  return {
    tasks: check(tasks),
    lastDone: Object.fromEntries(check<{ task_id: string; last_done_at: string }[]>(last).map((r) => [r.task_id, new Date(r.last_done_at)])),
    monsterXp,
    cleanXp,
    today: check(today),
    picks: check(picks),
    seen: check(seen),
    newsSeen: Object.fromEntries(check<{ person: Person; last_id: number }[]>(news).map((r) => [r.person, r.last_id])),
    tasksDone,
    oneoffs: check(oneoffs),
    oneoffsDone: check(oneoffsDone),
    done,
    unlocks: Object.fromEntries(check<{ monster: string; unlocked_on: string }[]>(unlocks).map((r) => [r.monster, r.unlocked_on])),
    eggs: check(eggs),
    streakWeeks: check(streakWeeks),
    stamps: check(stamps),
    stampsSeen: check(stampsSeen),
    expeditions: check(expeditions),
    expeditionsSeen: check(expeditionsSeen),
    feedings: fed,
    bossFights: check(bossFights),
    bossFightsSeen: check(bossFightsSeen),
  }
}

// Wochenrückblick: alle Monsterwahlen, Erledigungen und Stempel. Supabase liefert höchstens 1000 Zeilen pro Abfrage,
// deshalb werden die Erledigungen seitenweise geholt.
export async function loadHistory() {
  const picks = check<Pick[]>(await db().from('picks').select('*'))
  const stamps = check<Earned[]>(await db().from('stamps').select('*'))
  const completions: Completion[] = []
  for (let from = 0; ; from += 1000) {
    const page = check<Completion[]>(await db().from('completions').select('*').order('done_at').order('id').range(from, from + 999))
    completions.push(...page)
    if (page.length < 1000) return { picks, completions, stamps }
  }
}

// Eure Werte im Pedia: alle Erledigungen in kurz, seitenweise wie beim Wochenrückblick.
async function loadDone() {
  const done: Done[] = []
  for (let from = 0; ; from += 1000) {
    const page = check<Done[]>(await db().from('completions').select('monster, task_id, standing, oneoff, person, xp, done_at').order('done_at').order('id').range(from, from + 999))
    done.push(...page)
    if (page.length < 1000) return done
  }
}

// standing nur bei ständigen, oneoff nur bei einmaligen Aufgaben mitschicken, normale Erledigungen bleiben wie bisher.
export async function complete(c: Omit<Completion, 'id' | 'done_at' | 'standing' | 'oneoff'> & { standing?: string; oneoff?: string }) {
  check(await db().from('completions').insert(c))
}

export async function undo(completionId: string) {
  check(await db().from('completions').delete().eq('id', completionId))
}

export async function pickMonster(p: Pick) {
  check(await db().from('picks').insert(p))
}

export async function markSeen(s: Seen) {
  check(await db().from('seen').upsert(s, { ignoreDuplicates: true }))
}

// Bleibt der erste Tag: Ein zweites Handy, das dieselbe Freischaltung meldet, ändert nichts.
export async function unlock(monsters: string[], day: string) {
  check(await db().from('unlocks').upsert(monsters.map((monster) => ({ monster, unlocked_on: day })), { ignoreDuplicates: true }))
}

// Gefundenes Ei ins Nest. Findet das andere Handy dasselbe Ei gleichzeitig, bleibt der erste Fund.
export async function findEgg(e: Omit<Egg, 'found_at' | 'hatched_at' | 'hatched_by'>) {
  check(await db().from('eggs').upsert(e, { ignoreDuplicates: true }))
}

// Nur ein noch nicht ausgebrütetes Ei schlüpft, ein zweites Handy ändert nichts mehr.
export async function hatchEgg(monster: string, person: Person) {
  check(await db().from('eggs').update({ hatched_at: new Date().toISOString(), hatched_by: person }).eq('monster', monster).is('hatched_at', null))
}

// Punkte abgeschlossener Wochen festhalten; spätere Änderungen an Aufgaben ändern sie nicht mehr.
export async function saveWeeks(weeks: StreakWeek[]) {
  check(await db().from('streak_weeks').upsert(weeks, { ignoreDuplicates: true }))
}

// Bleibt der erste Eintrag: Melden beide Handys denselben Stempel, gilt der zuerst gespeicherte.
export async function saveStamps(stamps: Omit<Earned, 'earned_at'>[]) {
  check(await db().from('stamps').upsert(stamps, { ignoreDuplicates: true }))
}

export async function markStampSeen(person: Person, stamp: string) {
  check(await db().from('stamps_seen').upsert({ person, stamp }, { ignoreDuplicates: true }))
}

// Die Beute steht schon fest (rollLoot in expeditions.ts), die id hat sie mitbestimmt.
export async function startExpedition(e: Omit<Expedition, 'recalled_at'>) {
  check(await db().from('expeditions').insert(e))
}

// Nur ein noch laufender Trupp lässt sich zurückrufen.
export async function recallExpedition(id: string) {
  check(await db().from('expeditions').update({ recalled_at: new Date().toISOString() }).eq('id', id).is('recalled_at', null).gt('ends_at', new Date().toISOString()))
}

export async function markHomecomingSeen(person: Person, expedition: string) {
  check(await db().from('expeditions_seen').upsert({ person, expedition }, { ignoreDuplicates: true }))
}

export async function feed(f: { monster: string; fruit: Fruit; xp: number; person: Person }) {
  check(await db().from('feedings').insert(f))
}

// Ein Kampf je Boss und Jahr: Startet das andere Handy gleichzeitig, schlägt das zweite Speichern fehl (23505).
export async function startBossFight(f: Fight) {
  check(await db().from('boss_fights').insert(f))
}

export async function markBossFightSeen(person: Person, fight: string) {
  check(await db().from('boss_fights_seen').upsert({ person, fight }, { ignoreDuplicates: true }))
}

export async function markNews(person: Person, lastId: number) {
  check(await db().from('news_seen').upsert({ person, last_id: lastId }))
}

export async function setInterval(taskId: string, days: number) {
  check(await db().from('tasks').update({ interval_days: days }).eq('id', taskId))
}

// Legt eine Aufgabe an oder überschreibt sie (gleiche id).
export async function saveTask(t: Task) {
  check(await db().from('tasks').upsert(t))
}

// Erledigungen bleiben, ihre XP auch (task_id wird null).
export async function deleteTask(taskId: string) {
  check(await db().from('tasks').delete().eq('id', taskId))
}

// Legt eine einmalige Aufgabe an oder benennt sie um (gleiche id).
export async function saveOneOff(o: Omit<OneOff, 'created_at'>) {
  check(await db().from('oneoffs').upsert(o))
}

export async function deleteOneOff(id: string) {
  check(await db().from('oneoffs').delete().eq('id', id))
}

// Jede Änderung auf einem der beiden Handys löst ein Neuladen aus. Die Datenmenge ist klein.
export function subscribe(onChange: () => void, onStatus: (live: boolean) => void) {
  const channel = db()
    .channel('household')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'completions' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'picks' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'oneoffs' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'seen' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'unlocks' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'eggs' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stamps' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expeditions' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feedings' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'boss_fights' }, onChange)
    .subscribe((status) => onStatus(status === 'SUBSCRIBED'))
  return () => {
    db().removeChannel(channel)
  }
}
