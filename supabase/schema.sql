-- Putzy: Datenbank-Schema. Einmal im Supabase SQL-Editor ausführen.
-- Zugriff hat, wer den Haushaltslink (mit dem Schlüssel) kennt.

create table tasks (
  id text primary key,
  room text not null,
  name text not null,
  element text not null check (element in ('wasser', 'feuer', 'natur', 'luft', 'licht')),
  effort text not null check (effort in ('K', 'M', 'G')),
  interval_days int not null check (interval_days between 1 and 365),
  -- Erste Fälligkeit, solange die Aufgabe noch nie erledigt wurde (siehe start.sql).
  first_due date not null default current_date,
  sort int not null
);

create table completions (
  id uuid primary key default gen_random_uuid(),
  -- Wird eine Aufgabe gelöscht, bleibt die Erledigung (und damit die XP) erhalten.
  task_id text references tasks (id) on delete set null,
  person text not null check (person in ('adrian', 'ulrike')),
  monster text not null,
  xp int not null,
  done_at timestamptz not null default now()
);
create index on completions (task_id, done_at desc);

-- Monsterwahl pro Woche: jede Person ein Monster, jedes Monster nur einmal pro Woche.
create table picks (
  week_start date not null,
  person text not null check (person in ('adrian', 'ulrike')),
  monster text not null,
  primary key (week_start, person),
  unique (week_start, monster)
);

create view task_last_done with (security_invoker = true) as
  select task_id, max(done_at) as last_done_at from completions group by task_id;

create view monster_xp with (security_invoker = true) as
  select monster, sum(xp)::int as xp from completions group by monster;

alter table tasks enable row level security;
alter table completions enable row level security;
alter table picks enable row level security;

create policy household on tasks for select to anon using (true);
create policy household_interval on tasks for update to anon using (true) with check (true);
create policy household on completions for all to anon using (true) with check (true);
create policy household on picks for all to anon using (true) with check (true);

-- In der App darf nur das Intervall einer Aufgabe geändert werden.
revoke update on tasks from anon;
grant update (interval_days) on tasks to anon;

alter publication supabase_realtime add table tasks, completions, picks;
