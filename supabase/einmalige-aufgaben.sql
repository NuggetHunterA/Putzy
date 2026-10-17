-- Putzy: einmalige Aufgaben (Rauchmelder anbringen, Flur streichen, …). Einmal im Supabase SQL-Editor ausführen, mehrfach ausführbar.
-- Erledigt ist eine einmalige Aufgabe, sobald es eine Erledigung mit ihrer id in oneoff gibt.
create table if not exists oneoffs (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);
alter table completions add column if not exists oneoff text references oneoffs (id) on delete set null;
-- Jede einmalige Aufgabe wird nur einmal erledigt.
create unique index if not exists completions_oneoff_once on completions (oneoff) where oneoff is not null;

alter table oneoffs enable row level security;
drop policy if exists household on oneoffs;
create policy household on oneoffs for all to anon using (true) with check (true);
grant select, insert, update, delete on oneoffs to anon;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'oneoffs') then
    alter publication supabase_realtime add table oneoffs;
  end if;
end $$;
