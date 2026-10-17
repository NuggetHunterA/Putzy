-- Putzy: Datenbank-Schema. Einmal im Supabase SQL-Editor ausführen.
-- Zugriff hat, wer den Haushaltslink (mit dem Schlüssel) kennt.

create table tasks (
  id text primary key,
  room text not null,
  name text not null,
  element text not null check (element in ('wasser', 'feuer', 'natur', 'luft', 'licht')),
  effort text not null check (effort in ('K', 'M', 'G')),
  interval_days int not null check (interval_days between 1 and 365),
  -- Erste Fälligkeit, solange die Aufgabe noch nie erledigt wurde (siehe reset-alles.sql).
  first_due date not null default current_date,
  sort int not null
);

create table completions (
  id uuid primary key default gen_random_uuid(),
  -- Wird eine Aufgabe gelöscht, bleibt die Erledigung (und damit die XP) erhalten.
  task_id text references tasks (id) on delete set null,
  -- Ständige Aufgabe (id aus STANDING in src/game.ts), dann ist task_id leer.
  standing text,
  person text not null check (person in ('adrian', 'ulrike')),
  monster text not null,
  xp int not null,
  done_at timestamptz not null default now()
);
create index on completions (task_id, done_at desc);
-- Jede Aufgabe zählt pro Tag (deutsche Zeit) nur einmal. Haken beide Handys gleichzeitig ab, gewinnt die erste Erledigung.
create unique index completions_once_per_day on completions (task_id, ((done_at at time zone 'Europe/Berlin')::date));
-- Ständige Aufgaben zählen pro Tag und Person einmal.
create unique index completions_standing_once_per_day
  on completions (standing, person, ((done_at at time zone 'Europe/Berlin')::date)) where standing is not null;

-- Monsterwahl pro Woche: jede Person ein Monster, jedes Monster nur einmal pro Woche.
create table picks (
  week_start date not null,
  person text not null check (person in ('adrian', 'ulrike')),
  monster text not null,
  primary key (week_start, person),
  unique (week_start, monster)
);

-- Putzy-Pedia: wer welche Entwicklung schon gesehen hat (Stufe 1 = zweite Form, 2 = dritte Form).
create table seen (
  person text not null check (person in ('adrian', 'ulrike')),
  monster text not null,
  stage int not null check (stage in (1, 2, 3)),
  seen_at timestamptz not null default now(),
  primary key (person, monster, stage)
);

-- Was ist neu: höchste Neuigkeit (src/news.ts), die eine Person schon gesehen hat.
create table news_seen (
  person text primary key check (person in ('adrian', 'ulrike')),
  last_id int not null
);

create view task_last_done with (security_invoker = true) as
  select task_id, max(done_at) as last_done_at from completions group by task_id;

create view monster_xp with (security_invoker = true) as
  select monster, sum(xp)::int as xp from completions group by monster;

create view monster_stats with (security_invoker = true) as
  select monster, person, count(*)::int as tasks from completions group by monster, person;

alter table tasks enable row level security;
alter table completions enable row level security;
alter table picks enable row level security;
alter table seen enable row level security;
alter table news_seen enable row level security;

create policy household on tasks for all to anon using (true) with check (true);
create policy household on completions for all to anon using (true) with check (true);
create policy household on picks for all to anon using (true) with check (true);
create policy household on seen for all to anon using (true) with check (true);
create policy household on news_seen for all to anon using (true) with check (true);

alter publication supabase_realtime add table tasks, completions, picks, seen;
