-- Putzy: Startskript für den ersten echten Tag. Erst ausführen, wenn ihr loslegt.
-- Löscht alle Testdaten (Erledigungen, XP und Monsterwahl) und verteilt die erste Fälligkeit
-- jeder Aufgabe zufällig auf die Tage ihres Intervalls, damit nicht alles am ersten Tag ansteht.
alter table tasks add column if not exists first_due date not null default current_date;

delete from completions;
delete from picks;
update tasks set first_due = current_date + floor(random() * interval_days)::int;
