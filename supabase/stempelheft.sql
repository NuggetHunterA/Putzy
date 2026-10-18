-- Putzy: Stempelheft. Einmal im Supabase SQL-Editor ausführen, mehrfach ausführbar.
-- stamps: verdiente Stempel (src/stamps.ts). Bonus-XP gehen an die Monster in monsters und zählen in monster_xp.
create table if not exists stamps (
  id text primary key,
  earned_at timestamptz not null default now(),
  -- Leer, wenn beide ihn zusammen verdient haben.
  person text check (person in ('adrian', 'ulrike')),
  xp int not null default 0,
  monsters text[] not null default '{}',
  -- Name der Aufgabe beim Verdienen, damit gelöschte Aufgaben ihren Stempel behalten.
  label text
);

-- stamps_seen: wer die Animation eines Stempels schon gesehen hat.
create table if not exists stamps_seen (
  person text not null check (person in ('adrian', 'ulrike')),
  stamp text not null,
  primary key (person, stamp)
);

create or replace view monster_xp with (security_invoker = true) as
  select monster, sum(xp)::int as xp from (
    select monster, xp from completions
    union all
    select unnest(monsters), xp from stamps
  ) x group by monster;

alter table stamps enable row level security;
alter table stamps_seen enable row level security;
drop policy if exists household on stamps;
drop policy if exists household on stamps_seen;
create policy household on stamps for all to anon using (true) with check (true);
create policy household on stamps_seen for all to anon using (true) with check (true);
grant select, insert, update, delete on stamps, stamps_seen to anon;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'stamps') then
    alter publication supabase_realtime add table stamps;
  end if;
end $$;
