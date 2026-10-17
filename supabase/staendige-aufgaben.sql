-- Putzy: ständige Aufgaben (Kochen, Einkaufen, …). Einmal im Supabase SQL-Editor ausführen, mehrfach ausführbar.
-- Sie stehen fest im Code (STANDING in src/game.ts), Erledigungen tragen ihre id in standing statt einer task_id.
alter table completions add column if not exists standing text;
-- Jede Person hakt jede ständige Aufgabe pro Tag (deutsche Zeit) höchstens einmal ab.
create unique index if not exists completions_standing_once_per_day
  on completions (standing, person, ((done_at at time zone 'Europe/Berlin')::date)) where standing is not null;
