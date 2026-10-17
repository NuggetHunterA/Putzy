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
export type Completion = { id: string; task_id: string | null; person: Person; monster: string; xp: number; done_at: string }
export type Pick = { week_start: string; person: Person; monster: string }
export type Seen = { person: Person; monster: string; stage: number }

export type Snapshot = {
  tasks: Task[]
  lastDone: Record<string, Date>
  monsterXp: Record<string, number>
  today: Completion[]
  picks: Pick[]
  seen: Seen[]
  // Erledigte Aufgaben pro Monster und Person.
  tasksDone: Record<string, Partial<Record<Person, number>>>
}

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
  const [tasks, last, xp, today, picks, seen, stats] = await Promise.all([
    db().from('tasks').select('*').order('sort'),
    db().from('task_last_done').select('*'),
    db().from('monster_xp').select('*'),
    db().from('completions').select('*').gte('done_at', todayStart.toISOString()).order('done_at'),
    db().from('picks').select('*').eq('week_start', week),
    db().from('seen').select('person, monster, stage'),
    db().from('monster_stats').select('*'),
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
    tasksDone,
  }
}

export async function complete(c: Omit<Completion, 'id' | 'done_at'>) {
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

export async function setInterval(taskId: string, days: number) {
  check(await db().from('tasks').update({ interval_days: days }).eq('id', taskId))
}

// Jede Änderung auf einem der beiden Handys löst ein Neuladen aus. Die Datenmenge ist klein.
export function subscribe(onChange: () => void, onStatus: (live: boolean) => void) {
  const channel = db()
    .channel('household')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'completions' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'picks' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'seen' }, onChange)
    .subscribe((status) => onStatus(status === 'SUBSCRIBED'))
  return () => {
    db().removeChannel(channel)
  }
}
