-- Putzy-Pedia: einmal im Supabase SQL-Editor ausführen.
-- seen: wer welche Entwicklung schon gesehen hat (Stufe 1 = zweite Form, 2 = dritte Form).
create table seen (
  person text not null check (person in ('adrian', 'ulrike')),
  monster text not null,
  stage int not null check (stage in (1, 2, 3)),
  seen_at timestamptz not null default now(),
  primary key (person, monster, stage)
);

-- Anzahl erledigter Aufgaben pro Monster und Person, für die Statistik im Pedia.
create view monster_stats with (security_invoker = true) as
  select monster, person, count(*)::int as tasks from completions group by monster, person;

alter table seen enable row level security;
create policy household on seen for all to anon using (true) with check (true);

alter publication supabase_realtime add table seen;
