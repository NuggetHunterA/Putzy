// Datenzugriff auf Supabase. Der Schlüssel kommt aus dem Haushaltslink (#k=…), nicht aus dem Build.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Effort, Element, Person } from './game'

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
export type Completion = { id: string; task_id: string | null; standing: string | null; oneoff: string | null; person: Person; monster: string; xp: number; done_at: string }
export type Pick = { week_start: string; person: Person; monster: string }
export type Seen = { person: Person; monster: string; stage: number }
export type OneOff = { id: string; name: string; created_at: string }

export type Snapshot = {
  tasks: Task[]
  lastDone: Record<string, Date>
  monsterXp: Record<string, number>
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
  const [tasks, last, xp, today, picks, seen, stats, news, oneoffs, oneoffsDone] = await Promise.all([
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
  ])
  const tasksDone: Snapshot['tasksDone'] = {}
  for (const r of check<{ monster: string; person: Person; tasks: number }[]>(stats)) {
    tasksDone[r.monster] = { ...tasksDone[r.monster], [r.person]: r.tasks }
  }
  return {
    tasks: check(tasks),
    lastDone: Object.fromEntries(check<{ task_id: string; last_done_at: string }[]>(last).map((r) => [r.task_id, new Date(r.last_done_at)])),
    monsterXp: Object.fromEntries(check<{ monster: string; xp: number }[]>(xp).map((r) => [r.monster, r.xp])),
    today: check(today),
    picks: check(picks),
    seen: check(seen),
    newsSeen: Object.fromEntries(check<{ person: Person; last_id: number }[]>(news).map((r) => [r.person, r.last_id])),
    tasksDone,
    oneoffs: check(oneoffs),
    oneoffsDone: check(oneoffsDone),
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
    .subscribe((status) => onStatus(status === 'SUBSCRIBED'))
  return () => {
    db().removeChannel(channel)
  }
}
