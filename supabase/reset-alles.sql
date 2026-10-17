-- Putzy: setzt ALLES zurück. Nur für den ersten echten Tag gedacht.
-- Löscht alle Erledigungen (und damit alle XP), Monsterwahlen und gesehenen Entwicklungen und verteilt die erste
-- Fälligkeit jeder Aufgabe zufällig auf die Tage ihres Intervalls, damit nicht alles am ersten Tag ansteht.
delete from completions;
delete from picks;
delete from seen;
update tasks set first_due = current_date + floor(random() * interval_days)::int;
