-- Putzy: Streak-Punkte und Eier. Einmal im Supabase SQL-Editor ausführen, mehrfach ausführbar.
-- eggs: gefundene Eier (src/eggs.ts), zu Beginn das Wasser-Ei der Schwamm-Reihe. Ausgebrütet, sobald hatched_at gesetzt ist.
create table if not exists eggs (
  monster text primary key,
  found_at timestamptz not null default now(),
  found_by text check (found_by in ('adrian', 'ulrike')),
  found_task text,
  hatched_at timestamptz,
  hatched_by text check (hatched_by in ('adrian', 'ulrike'))
);
insert into eggs (monster) values ('19') on conflict do nothing;

-- streak_weeks: Streak-Punkte abgeschlossener Wochen (src/streak.ts), vom ersten Handy der neuen Woche gespeichert.
create table if not exists streak_weeks (
  week_start date primary key,
  points int not null check (points between 0 and 7)
);

-- seen mit Stufe -1: Fund eines Eis gesehen.
alter table seen drop constraint if exists seen_stage_check;
alter table seen add constraint seen_stage_check check (stage between -1 and 3);

alter table eggs enable row level security;
alter table streak_weeks enable row level security;
drop policy if exists household on eggs;
drop policy if exists household on streak_weeks;
create policy household on eggs for all to anon using (true) with check (true);
create policy household on streak_weeks for all to anon using (true) with check (true);
grant select, insert, update, delete on eggs, streak_weeks to anon;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'eggs') then
    alter publication supabase_realtime add table eggs;
  end if;
end $$;
