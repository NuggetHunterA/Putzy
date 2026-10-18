-- Putzy: geheime Monsterreihen. Einmal im Supabase SQL-Editor ausführen, mehrfach ausführbar.
-- unlocks: Tag, an dem eine geheime Reihe freigeschaltet wurde. seen mit Stufe 0: Freischaltung gesehen.
create table if not exists unlocks (
  monster text primary key,
  unlocked_on date not null
);
alter table seen drop constraint if exists seen_stage_check;
alter table seen add constraint seen_stage_check check (stage between 0 and 3);

alter table unlocks enable row level security;
drop policy if exists household on unlocks;
create policy household on unlocks for all to anon using (true) with check (true);
grant select, insert, update, delete on unlocks to anon;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'unlocks') then
    alter publication supabase_realtime add table unlocks;
  end if;
end $$;
