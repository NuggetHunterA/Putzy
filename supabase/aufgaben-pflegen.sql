-- Putzy: Aufgaben in der App anlegen, ändern und löschen. Einmal im Supabase SQL-Editor ausführen.
drop policy household on tasks;
drop policy household_interval on tasks;
create policy household on tasks for all to anon using (true) with check (true);
grant select, insert, update, delete on tasks to anon;
