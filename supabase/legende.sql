-- Putzy: Legenden-Szene auf Level 30 (src/Legend.tsx). Einmal im Supabase SQL-Editor ausführen, mehrfach ausführbar.
-- seen mit Stufe 30: Legenden-Szene gesehen, damit jede Person sie einmal sieht.
alter table seen drop constraint if exists seen_stage_check;
alter table seen add constraint seen_stage_check check (stage between -1 and 3 or stage = 30);
