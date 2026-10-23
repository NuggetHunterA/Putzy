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

-- Einmalige Aufgaben: kein Element, kein Intervall, immer ONEOFF_XP (src/game.ts).
create table oneoffs (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table completions (
  id uuid primary key default gen_random_uuid(),
  -- Wird eine Aufgabe gelöscht, bleibt die Erledigung (und damit die XP) erhalten.
  task_id text references tasks (id) on delete set null,
  -- Ständige Aufgabe (id aus STANDING in src/game.ts), dann ist task_id leer.
  standing text,
  -- Einmalige Aufgabe, dann ist task_id leer.
  oneoff text references oneoffs (id) on delete set null,
  person text not null check (person in ('adrian', 'ulrike')),
  monster text not null,
  xp int not null,
  -- Team-Bonus im Event: Monster, die dafür je team_xp XP extra bekommen.
  team text[] not null default '{}',
  team_xp int not null default 0,
  done_at timestamptz not null default now()
);
create index on completions (task_id, done_at desc);
-- Jede Aufgabe zählt pro Tag (deutsche Zeit) nur einmal. Haken beide Handys gleichzeitig ab, gewinnt die erste Erledigung.
create unique index completions_once_per_day on completions (task_id, ((done_at at time zone 'Europe/Berlin')::date));
-- Ständige Aufgaben zählen pro Tag und Person einmal.
create unique index completions_standing_once_per_day
  on completions (standing, person, ((done_at at time zone 'Europe/Berlin')::date)) where standing is not null;
-- Einmalige Aufgaben werden nur einmal erledigt.
create unique index completions_oneoff_once on completions (oneoff) where oneoff is not null;

-- Monsterwahl pro Woche: jede Person ein Monster, jedes Monster nur einmal pro Woche.
create table picks (
  week_start date not null,
  person text not null check (person in ('adrian', 'ulrike')),
  monster text not null,
  primary key (week_start, person),
  unique (week_start, monster)
);

-- Putzy-Pedia: wer welche Entwicklung schon gesehen hat (Stufe 1 = zweite Form, 2 = dritte Form).
-- Stufe 0: hat die Freischaltung einer geheimen Reihe bzw. das Schlüpfen aus einem Ei gesehen, Stufe -1: den Fund eines Eis,
-- Stufe 30: die Legenden-Szene auf Level 30.
create table seen (
  person text not null check (person in ('adrian', 'ulrike')),
  monster text not null,
  stage int not null check (stage between -1 and 3 or stage = 30),
  seen_at timestamptz not null default now(),
  primary key (person, monster, stage)
);

-- Geheime Reihen (src/secret.ts): Tag, an dem die Bedingung erfüllt war. Sichtbar ab dem Tag danach.
create table unlocks (
  monster text primary key,
  unlocked_on date not null
);

-- Eier (src/eggs.ts): zu Beginn das Wasser-Ei der Schwamm-Reihe. Ausgebrütet, sobald hatched_at gesetzt ist.
create table eggs (
  monster text primary key,
  found_at timestamptz not null default now(),
  found_by text check (found_by in ('adrian', 'ulrike')),
  found_task text,
  hatched_at timestamptz,
  hatched_by text check (hatched_by in ('adrian', 'ulrike'))
);
insert into eggs (monster) values ('19');

-- Streak-Punkte abgeschlossener Wochen (src/streak.ts).
create table streak_weeks (
  week_start date primary key,
  points int not null check (points between 0 and 7)
);

-- Was ist neu: höchste Neuigkeit (src/news.ts), die eine Person schon gesehen hat.
create table news_seen (
  person text primary key check (person in ('adrian', 'ulrike')),
  last_id int not null
);

create view task_last_done with (security_invoker = true) as
  select task_id, max(done_at) as last_done_at from completions group by task_id;

-- Stempelheft (src/stamps.ts): verdiente Stempel. Bonus-XP gehen an die Monster in monsters. person leer: beide zusammen.
create table stamps (
  id text primary key,
  earned_at timestamptz not null default now(),
  person text check (person in ('adrian', 'ulrike')),
  xp int not null default 0,
  monsters text[] not null default '{}',
  -- Name der Aufgabe beim Verdienen, damit gelöschte Aufgaben ihren Stempel behalten.
  label text
);

-- Wer die Animation eines Stempels schon gesehen hat.
create table stamps_seen (
  person text not null check (person in ('adrian', 'ulrike')),
  stamp text not null,
  primary key (person, stamp)
);

-- Expeditionen (src/expeditions.ts): Trupps mit der beim Start gewürfelten Beute, zurückgerufen sobald recalled_at gesetzt ist.
create table expeditions (
  id uuid primary key,
  area text not null,
  monsters text[] not null check (cardinality(monsters) between 1 and 3),
  started_by text not null check (started_by in ('adrian', 'ulrike')),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  recalled_at timestamptz,
  loot jsonb not null
);

-- Wer die Heimkehr eines Trupps schon gesehen hat.
create table expeditions_seen (
  person text not null check (person in ('adrian', 'ulrike')),
  expedition uuid not null references expeditions (id) on delete cascade,
  primary key (person, expedition)
);

-- Verfütterte Früchte. Früchte-XP zählen nicht in monster_xp, die App rechnet sie dazu (Bremse in src/expeditions.ts).
create table feedings (
  id uuid primary key default gen_random_uuid(),
  monster text not null,
  fruit text not null check (fruit in ('beere', 'pflaume', 'apfel', 'gold')),
  xp int not null,
  person text not null check (person in ('adrian', 'ulrike')),
  fed_at timestamptz not null default now()
);

-- XP aus Erledigungen, Team-Boni und Stempel-Boni.
create view monster_xp with (security_invoker = true) as
  select monster, sum(xp)::int as xp from (
    select monster, xp from completions
    union all
    select unnest(team), team_xp from completions
    union all
    select unnest(monsters), xp from stamps
  ) x group by monster;

create view monster_stats with (security_invoker = true) as
  select monster, person, count(*)::int as tasks from completions group by monster, person;

alter table tasks enable row level security;
alter table completions enable row level security;
alter table oneoffs enable row level security;
alter table picks enable row level security;
alter table seen enable row level security;
alter table news_seen enable row level security;
alter table unlocks enable row level security;
alter table eggs enable row level security;
alter table streak_weeks enable row level security;
alter table stamps enable row level security;
alter table stamps_seen enable row level security;
alter table expeditions enable row level security;
alter table expeditions_seen enable row level security;
alter table feedings enable row level security;

create policy household on tasks for all to anon using (true) with check (true);
create policy household on completions for all to anon using (true) with check (true);
create policy household on oneoffs for all to anon using (true) with check (true);
create policy household on picks for all to anon using (true) with check (true);
create policy household on seen for all to anon using (true) with check (true);
create policy household on news_seen for all to anon using (true) with check (true);
create policy household on unlocks for all to anon using (true) with check (true);
create policy household on eggs for all to anon using (true) with check (true);
create policy household on streak_weeks for all to anon using (true) with check (true);
create policy household on stamps for all to anon using (true) with check (true);
create policy household on stamps_seen for all to anon using (true) with check (true);
create policy household on expeditions for all to anon using (true) with check (true);
create policy household on expeditions_seen for all to anon using (true) with check (true);
create policy household on feedings for all to anon using (true) with check (true);

-- Neue Tabellen bekommen ab 30.10.2026 keinen API-Zugriff mehr automatisch, daher ausdrücklich.
grant select, insert, update, delete on tasks, completions, oneoffs, picks, seen, news_seen, unlocks, eggs, streak_weeks, stamps, stamps_seen, expeditions, expeditions_seen, feedings to anon;
grant select on task_last_done, monster_xp, monster_stats to anon;

alter publication supabase_realtime add table tasks, completions, oneoffs, picks, seen, unlocks, eggs, stamps, expeditions, feedings;
