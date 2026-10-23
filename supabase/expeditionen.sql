-- Putzy: Expeditionen. Einmal im Supabase SQL-Editor ausführen, mehrfach ausführbar.
-- expeditions: Trupps (src/expeditions.ts). Die Beute wird beim Start gewürfelt und mitgespeichert.
-- Zurückgerufen, sobald recalled_at gesetzt ist, dann ohne Beute.
create table if not exists expeditions (
  id uuid primary key,
  area text not null,
  monsters text[] not null check (cardinality(monsters) between 1 and 3),
  started_by text not null check (started_by in ('adrian', 'ulrike')),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  recalled_at timestamptz,
  loot jsonb not null
);

-- expeditions_seen: wer die Heimkehr eines Trupps schon gesehen hat.
create table if not exists expeditions_seen (
  person text not null check (person in ('adrian', 'ulrike')),
  expedition uuid not null references expeditions (id) on delete cascade,
  primary key (person, expedition)
);

-- feedings: verfütterte Früchte. Früchte-XP zählen nicht in monster_xp, die App rechnet sie dazu (Bremse in expeditions.ts).
create table if not exists feedings (
  id uuid primary key default gen_random_uuid(),
  monster text not null,
  fruit text not null check (fruit in ('beere', 'pflaume', 'apfel', 'gold')),
  xp int not null,
  person text not null check (person in ('adrian', 'ulrike')),
  fed_at timestamptz not null default now()
);

alter table expeditions enable row level security;
alter table expeditions_seen enable row level security;
alter table feedings enable row level security;
drop policy if exists household on expeditions;
drop policy if exists household on expeditions_seen;
drop policy if exists household on feedings;
create policy household on expeditions for all to anon using (true) with check (true);
create policy household on expeditions_seen for all to anon using (true) with check (true);
create policy household on feedings for all to anon using (true) with check (true);
grant select, insert, update, delete on expeditions, expeditions_seen, feedings to anon;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'expeditions') then
    alter publication supabase_realtime add table expeditions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'feedings') then
    alter publication supabase_realtime add table feedings;
  end if;
end $$;
