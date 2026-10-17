-- Putzy: Aufgabenliste vom 17.10.2026 einspielen. Erst supabase/tasks.sql ausführen,
-- danach diese Datei einmal im Supabase SQL-Editor. Bisherige XP der Monster bleiben erhalten.

-- Gelöschte Aufgaben nehmen ihre Erledigungen (und damit XP) nicht mehr mit.
alter table completions alter column task_id drop not null;
alter table completions drop constraint completions_task_id_fkey;
alter table completions add constraint completions_task_id_fkey
  foreign key (task_id) references tasks (id) on delete set null;

-- Zusammengelegte und geteilte Aufgaben übernehmen die Erledigungen ihrer Vorgänger.
update completions set task_id = 'ganzes-haus--muelleimer-leeren'
  where task_id in ('ganzes-haus--muell-rausbringen', 'ganzes-haus--altpapier-und-gelben-sack-rausbringen');
update completions set task_id = 'ganzes-haus--fenster-unten-putzen' where task_id = 'ganzes-haus--fenster-putzen';

delete from tasks where id in (
  'ganzes-haus--muell-rausbringen',
  'ganzes-haus--altpapier-und-gelben-sack-rausbringen',
  'ganzes-haus--waesche-aufhaengen-und-zusammenlegen',
  'ganzes-haus--buegeln',
  'ganzes-haus--fenster-putzen'
);

-- Neue Aufgaben nicht alle heute fällig stellen, sondern über ihr Intervall verteilen (wie start.sql).
update tasks set first_due = current_date + floor(random() * interval_days)::int
where id in (
  'ganzes-haus--muelleimer-leeren', 'ganzes-haus--glasmuell-entsorgen', 'ganzes-haus--fenster-oben-putzen',
  'ganzes-haus--fenster-unten-putzen', 'kueche--dunstabzugshaube-abwischen', 'kueche--spuelmaschine-reinigen',
  'kueche--schraenke-auswischen', 'bad-oben--waschmaschine-reinigen', 'flur--spiegel-putzen', 'flur--treppe-reinigen',
  'kinderzimmer--kinderkleidung-aussortieren', 'kinderzimmer--spielzeug-aussortieren', 'draussen--gehweg-saeubern',
  'draussen--reifenwechsel'
) and id not in (select task_id from completions where task_id is not null);
