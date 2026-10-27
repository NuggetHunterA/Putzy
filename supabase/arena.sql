-- Putzy: Arena, Wochen-Trank und Joker. Einmal im Supabase SQL-Editor ausführen, mehrfach ausführbar.
-- arena_weeks: Leiter, Gegner-Team, Trainingszeiten und Rezept einer Woche, ausgelost beim ersten Öffnen (src/arena.ts).
create table if not exists arena_weeks (
  week_start date primary key,
  leader text not null,
  foes jsonb not null,
  windows jsonb not null,
  recipe jsonb not null,
  created_at timestamptz not null default now()
);

-- arena_fights: ein Kampf je Person und Woche. Teams, Trank und Ergebnis werden beim Start festgehalten.
create table if not exists arena_fights (
  id uuid primary key,
  week_start date not null references arena_weeks (week_start) on delete cascade,
  person text not null check (person in ('adrian', 'ulrike')),
  team jsonb not null,
  foes jsonb not null,
  potion text check (potion in ('schild', 'kraft', 'leben', 'element')),
  master boolean not null default false,
  won boolean not null,
  started_at timestamptz not null default now(),
  unique (week_start, person)
);

-- arena_brews: der gebraute Wochen-Trank, einer je Woche.
create table if not exists arena_brews (
  week_start date primary key references arena_weeks (week_start) on delete cascade,
  person text not null check (person in ('adrian', 'ulrike')),
  master boolean not null,
  brewed_at timestamptz not null default now()
);

-- arena_seen: wer welche Kampf- oder Brau-Szene schon gesehen hat (ref: Kampf-id oder brew:Woche).
create table if not exists arena_seen (
  person text not null check (person in ('adrian', 'ulrike')),
  ref text not null,
  primary key (person, ref)
);

-- jokers: eingesetzte Joker. anchor ist die letzte Erledigung oder erste Fälligkeit, ein Joker je Aufgabe und Intervall.
create table if not exists jokers (
  id uuid primary key default gen_random_uuid(),
  task_id text not null,
  anchor date not null,
  person text not null check (person in ('adrian', 'ulrike')),
  used_at timestamptz not null default now(),
  unique (task_id, anchor)
);

alter table arena_weeks enable row level security;
alter table arena_fights enable row level security;
alter table arena_brews enable row level security;
alter table arena_seen enable row level security;
alter table jokers enable row level security;
drop policy if exists household on arena_weeks;
drop policy if exists household on arena_fights;
drop policy if exists household on arena_brews;
drop policy if exists household on arena_seen;
drop policy if exists household on jokers;
create policy household on arena_weeks for all to anon using (true) with check (true);
create policy household on arena_fights for all to anon using (true) with check (true);
create policy household on arena_brews for all to anon using (true) with check (true);
create policy household on arena_seen for all to anon using (true) with check (true);
create policy household on jokers for all to anon using (true) with check (true);
grant select, insert, update, delete on arena_weeks, arena_fights, arena_brews, arena_seen, jokers to anon;

do $$
declare t text;
begin
  foreach t in array array['arena_weeks', 'arena_fights', 'arena_brews', 'jokers'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;
