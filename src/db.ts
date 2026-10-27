// Datenzugriff auf Supabase. Der Schlüssel kommt aus dem Haushaltslink (#k=…), nicht aus dem Build.
// Nur Datenbank und Live-Verbindung, nicht das ganze Supabase-Paket (Login, Dateispeicher, Funktionen braucht Putzy nicht).
import { PostgrestClient } from '@supabase/postgrest-js'
import { RealtimeClient } from '@supabase/realtime-js'
import type { ArenaFight, ArenaWeek, Brew, JokerUse } from './arena'
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
  // Arena (src/arena.ts): ausgeloste Wochen, Kämpfe, gebraute Tränke, gesehene Szenen und eingesetzte Joker.
  arenaWeeks: ArenaWeek[]
  arenaFights: ArenaFight[]
  arenaBrews: Brew[]
  arenaSeen: { person: Person; ref: string }[]
  jokers: JokerUse[]
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

let client: PostgrestClient | null = null
let live: RealtimeClient | null = null

// Gleiche Anmeldung wie createClient aus @supabase/supabase-js ohne Login: Schlüssel als apikey und Bearer.
export function connect() {
  const key = householdKey()
  if (key) {
    const url = import.meta.env.VITE_SUPABASE_URL
    client = new PostgrestClient(`${url}/rest/v1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    live = new RealtimeClient(`${url.replace(/^http/, 'ws')}/realtime/v1`, { params: { apikey: key }, accessToken: async () => key })
  }
  return client !== null
}

const db = () => client!

function check<T>({ data, error }: { data: T | null; error: unknown }) {
  if (error) throw error
  return data as T
}

// prev: zuletzt geladene Erledigungen in kurz (src/App.tsx), aus denen nur die letzten Tage erneuert werden.
export async function load(todayStart: Date, week: string, prev: Done[] | null): Promise<Snapshot> {
  const [tasks, last, xp, today, picks, seen, stats, news, oneoffs, oneoffsDone, unlocks, eggs, streakWeeks, stamps, stampsSeen, expeditions, expeditionsSeen, feedings, bossFights, bossFightsSeen, arenaWeeks, arenaFights, arenaBrews, arenaSeen, jokers, loadedDone] = await Promise.all([
    db().from('tasks').select('*').order('sort'),
    db().from('task_last_done').select('*'),
    db().from('monster_xp').select('*'),
    db().from('completions').select('*').gte('done_at', todayStart.toISOString()).order('done_at'),
    db().from('picks').select('*').eq('week_start', week),
    all<Seen>((a, b) => db().from('seen').select('person, monster, stage').order('person').order('monster').order('stage').range(a, b)),
    db().from('monster_stats').select('*'),
    db().from('news_seen').select('*'),
    all<OneOff>((a, b) => db().from('oneoffs').select('*').order('created_at').order('id').range(a, b)),
    all<Completion>((a, b) => db().from('completions').select('*').not('oneoff', 'is', null).order('done_at', { ascending: false }).order('id').range(a, b)),
    all<{ monster: string; unlocked_on: string }>((a, b) => db().from('unlocks').select('*').order('monster').range(a, b)),
    all<Egg>((a, b) => db().from('eggs').select('*').order('monster').range(a, b)),
    all<StreakWeek>((a, b) => db().from('streak_weeks').select('*').order('week_start').range(a, b)),
    all<Earned>((a, b) => db().from('stamps').select('*').order('id').range(a, b)),
    all<{ person: Person; stamp: string }>((a, b) => db().from('stamps_seen').select('person, stamp').order('person').order('stamp').range(a, b)),
    all<Expedition>((a, b) => db().from('expeditions').select('*').order('started_at').order('id').range(a, b)),
    all<{ person: Person; expedition: string }>((a, b) => db().from('expeditions_seen').select('person, expedition').order('person').order('expedition').range(a, b)),
    all<Feeding>((a, b) => db().from('feedings').select('*').order('fed_at').order('id').range(a, b)),
    all<Fight>((a, b) => db().from('boss_fights').select('*').order('started_at').order('id').range(a, b)),
    all<{ person: Person; fight: string }>((a, b) => db().from('boss_fights_seen').select('person, fight').order('person').order('fight').range(a, b)),
    all<ArenaWeek>((a, b) => db().from('arena_weeks').select('week_start, leader, foes, windows, recipe').order('week_start').range(a, b)),
    all<ArenaFight>((a, b) => db().from('arena_fights').select('*').order('started_at').order('id').range(a, b)),
    all<Brew>((a, b) => db().from('arena_brews').select('*').order('week_start').range(a, b)),
    all<{ person: Person; ref: string }>((a, b) => db().from('arena_seen').select('person, ref').order('person').order('ref').range(a, b)),
    all<JokerUse>((a, b) => db().from('jokers').select('*').order('used_at').order('id').range(a, b)),
    loadDone(todayStart, prev),
  ])
  // Eine gelöschte Aufgabe setzt task_id auch in älteren Erledigungen auf null, das sieht das Nachladen nicht.
  const taskIds = new Set(check<Task[]>(tasks).map((t) => t.id))
  const done = loadedDone.some((d) => d.task_id && !taskIds.has(d.task_id)) ? await allDone() : loadedDone
  const tasksDone: Snapshot['tasksDone'] = {}
  for (const r of check<{ monster: string; person: Person; tasks: number }[]>(stats)) {
    tasksDone[r.monster] = { ...tasksDone[r.monster], [r.person]: r.tasks }
  }
  const cleanXp: Record<string, number> = Object.fromEntries(check<{ monster: string; xp: number }[]>(xp).map((r) => [r.monster, r.xp]))
  const monsterXp = { ...cleanXp }
  for (const [m, n] of Object.entries(fruitXp(feedings))) monsterXp[m] = (monsterXp[m] ?? 0) + n
  return {
    tasks: check(tasks),
    lastDone: Object.fromEntries(check<{ task_id: string; last_done_at: string }[]>(last).map((r) => [r.task_id, new Date(r.last_done_at)])),
    monsterXp,
    cleanXp,
    today: check(today),
    picks: check(picks),
    seen,
    newsSeen: Object.fromEntries(check<{ person: Person; last_id: number }[]>(news).map((r) => [r.person, r.last_id])),
    tasksDone,
    oneoffs,
    oneoffsDone,
    done,
    unlocks: Object.fromEntries(unlocks.map((r) => [r.monster, r.unlocked_on])),
    eggs,
    streakWeeks,
    stamps,
    stampsSeen,
    expeditions,
    expeditionsSeen,
    feedings,
    bossFights,
    bossFightsSeen,
    arenaWeeks,
    arenaFights,
    arenaBrews,
    arenaSeen,
    jokers,
  }
}

// Supabase liefert höchstens 1000 Zeilen pro Abfrage, deshalb holen wachsende Tabellen seitenweise.
// Die Sortierung muss eindeutig sein, sonst rutschen Zeilen zwischen zwei Seiten hin und her.
async function all<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = []
  for (let from = 0; ; from += 1000) {
    const page = check<T[]>(await query(from, from + 999))
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}

const DONE_FIELDS = 'monster, task_id, standing, oneoff, person, xp, done_at'
// Tag, an dem die Erledigungen zuletzt vollständig geladen wurden.
const DONE_FULL_STORAGE = 'putzy.doneFull'
// So weit zurück werden Erledigungen immer frisch geholt; das fängt Rückgängig-Machen und gleichzeitiges Abhaken auf.
const DONE_FRESH_DAYS = 2

const allDone = () => all<Done>((a, b) => db().from('completions').select(DONE_FIELDS).order('done_at').order('id').range(a, b))

// Eure Werte im Pedia, Streak, Stempel, Boss und Arena brauchen alle Erledigungen. Vollständig geladen wird beim
// ersten Laden des Tages, sonst nur die letzten Tage, angesetzt an den Rest von prev. Stimmt die Anzahl dann nicht
// mit der Datenbank überein, wird doch alles geladen.
async function loadDone(todayStart: Date, prev: Done[] | null) {
  const day = todayStart.toDateString()
  let fullDay: string | null = null
  try {
    fullDay = localStorage.getItem(DONE_FULL_STORAGE)
  } catch {
    // Ohne Speicher immer vollständig laden.
  }
  if (prev && fullDay === day) {
    const since = new Date(todayStart)
    since.setDate(since.getDate() - DONE_FRESH_DAYS)
    const [recent, total] = await Promise.all([
      all<Done>((a, b) => db().from('completions').select(DONE_FIELDS).gte('done_at', since.toISOString()).order('done_at').order('id').range(a, b)),
      db().from('completions').select('id', { count: 'exact', head: true }),
    ])
    if (total.error) throw total.error
    const done = mergeDone(prev, recent, since)
    if (done.length === total.count) return done
  }
  const done = await allDone()
  try {
    localStorage.setItem(DONE_FULL_STORAGE, day)
  } catch {
    // Dann wird beim nächsten Mal wieder vollständig geladen.
  }
  return done
}

// Ältere Erledigungen aus prev, ab since die frisch geladenen. Beide sind nach Zeit sortiert, das Ergebnis also auch.
export const mergeDone = (prev: Done[], recent: Done[], since: Date) => [...prev.filter((d) => new Date(d.done_at) < since), ...recent]

// Wochenrückblick: alle Monsterwahlen, Erledigungen und Stempel.
export async function loadHistory() {
  const [picks, completions, stamps] = await Promise.all([
    all<Pick>((a, b) => db().from('picks').select('*').order('week_start').order('person').range(a, b)),
    all<Completion>((a, b) => db().from('completions').select('*').order('done_at').order('id').range(a, b)),
    all<Earned>((a, b) => db().from('stamps').select('*').order('id').range(a, b)),
  ])
  return { picks, completions, stamps }
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

// Bleibt die erste Auslosung: Lost das andere Handy gleichzeitig, gilt die zuerst gespeicherte.
export async function saveArenaWeek(w: ArenaWeek) {
  check(await db().from('arena_weeks').upsert(w, { ignoreDuplicates: true }))
}

// Ein Kampf je Person und Woche: Ein zweiter Start (anderes Handy) schlägt fehl (23505).
export async function startArenaFight(f: ArenaFight) {
  check(await db().from('arena_fights').insert(f))
}

// Ein Trank je Woche: Braut die andere Person gleichzeitig, schlägt das zweite Speichern fehl (23505).
export async function brewPotion(b: Omit<Brew, 'brewed_at'>) {
  check(await db().from('arena_brews').insert(b))
}

export async function markArenaSeen(person: Person, ref: string) {
  check(await db().from('arena_seen').upsert({ person, ref }, { ignoreDuplicates: true }))
}

// Ein Joker je Aufgabe und Intervall (23505, wenn die andere Person schneller war).
export async function spendJoker(j: Omit<JokerUse, 'id' | 'used_at'>) {
  check(await db().from('jokers').insert(j))
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

// Zuletzt geladener Stand, damit die App beim Öffnen sofort etwas zeigt. Gilt nur für denselben Programmstand,
// nach einem Update fehlen im alten Stand sonst neue Felder.
const CACHE_STORAGE = 'putzy.snapshot'
const BUILD = import.meta.url

export function saveCache(snap: Snapshot) {
  try {
    localStorage.setItem(CACHE_STORAGE, JSON.stringify({ build: BUILD, snap }))
  } catch {
    // Speicher voll oder gesperrt: Dann startet die App wie bisher ohne gemerkten Stand.
  }
}

// Erledigungen von gestern und Monsterwahlen der Vorwoche gehören nicht mehr zu heute.
export function readCache(todayStart: Date, week: string): Snapshot | null {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_STORAGE) ?? 'null')
    if (cache?.build !== BUILD) return null
    const s: Snapshot = cache.snap
    return {
      ...s,
      lastDone: Object.fromEntries(Object.entries(s.lastDone).map(([id, d]) => [id, new Date(d)])),
      today: s.today.filter((c) => new Date(c.done_at) >= todayStart),
      picks: s.picks.filter((p) => p.week_start === week),
    }
  } catch {
    return null
  }
}

// Jede Änderung auf einem der beiden Handys löst ein Neuladen aus. Mehrere Änderungen kurz hintereinander
// (z. B. Erledigung und Stempel) ergeben nur eines.
export function subscribe(onChange: () => void, onStatus: (live: boolean) => void) {
  let timer = 0
  const changed = () => {
    clearTimeout(timer)
    timer = window.setTimeout(onChange, 300)
  }
  const channel = live!
    .channel('household')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'completions' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'picks' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'oneoffs' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'seen' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'unlocks' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'eggs' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stamps' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expeditions' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feedings' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'boss_fights' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_weeks' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_fights' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_brews' }, changed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jokers' }, changed)
    .subscribe((status) => onStatus(status === 'SUBSCRIBED'))
  return () => {
    clearTimeout(timer)
    live!.removeChannel(channel)
  }
}
