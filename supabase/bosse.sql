-- Putzy: Event-Bosse. Einmal im Supabase SQL-Editor ausführen, mehrfach ausführbar.
-- boss_fights: ein Endkampf je Boss und Jahr (src/bosses.ts). Ergebnis, Siegchance, Schaden und LP werden beim Start festgehalten.
create table if not exists boss_fights (
  id uuid primary key,
  event text not null,
  year int not null,
  monsters text[] not null check (cardinality(monsters) between 1 and 3),
  started_by text not null check (started_by in ('adrian', 'ulrike')),
  started_at timestamptz not null default now(),
  won boolean not null,
  chance int not null,
  damage int not null,
  lp int not null,
  unique (event, year)
);

-- boss_fights_seen: wer die Kampf-Szene schon gesehen hat.
create table if not exists boss_fights_seen (
  person text not null check (person in ('adrian', 'ulrike')),
  fight uuid not null references boss_fights (id) on delete cascade,
  primary key (person, fight)
);

alter table boss_fights enable row level security;
alter table boss_fights_seen enable row level security;
drop policy if exists household on boss_fights;
drop policy if exists household on boss_fights_seen;
create policy household on boss_fights for all to anon using (true) with check (true);
create policy household on boss_fights_seen for all to anon using (true) with check (true);
grant select, insert, update, delete on boss_fights, boss_fights_seen to anon;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'boss_fights') then
    alter publication supabase_realtime add table boss_fights;
  end if;
end $$;
