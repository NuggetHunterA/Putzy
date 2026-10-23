-- Putzy: setzt ALLES zurück. Nur für den ersten echten Tag gedacht.
-- Löscht alle Erledigungen (und damit alle XP), Monsterwahlen, gesehenen Entwicklungen, freigeschalteten Reihen, Eier, Streak-Punkte, Stempel und Expeditionen und verteilt die erste
-- Fälligkeit jeder Aufgabe zufällig auf die Tage ihres Intervalls, damit nicht alles am ersten Tag ansteht.
delete from completions;
delete from picks;
delete from seen;
delete from unlocks;
delete from streak_weeks;
delete from eggs;
delete from stamps;
delete from stamps_seen;
delete from expeditions;
delete from feedings;
insert into eggs (monster) values ('19');
update tasks set first_due = current_date + floor(random() * interval_days)::int;
