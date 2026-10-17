-- Putzy: Aufgaben in der App anlegen, ändern und löschen. Einmal im Supabase SQL-Editor ausführen.
drop policy if exists household on tasks;
drop policy if exists household_interval on tasks;
create policy household on tasks for all to anon using (true) with check (true);
grant select, insert, update, delete on tasks to anon;
