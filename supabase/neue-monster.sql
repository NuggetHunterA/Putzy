-- Neue Reihen Kokeli (2 Stufen) und Samsi (4 Stufen): gesehene Entwicklungen bis Stufe 4 erlauben.
-- Die Monster selbst stehen im Code (src/game.ts), dafür braucht es keine Tabelle.
alter table seen drop constraint seen_stage_check;
alter table seen add constraint seen_stage_check check (stage in (1, 2, 3));
