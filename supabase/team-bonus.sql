-- Putzy: Team-Bonus im Event. Einmal im Supabase SQL-Editor ausführen, mehrfach ausführbar.
-- team: Monster, die für diese Erledigung den Team-Bonus von je team_xp XP bekommen (src/game.ts, TEAM_BONUS).
-- Wird die Erledigung zurückgenommen, verschwindet der Bonus mit ihr.
alter table completions add column if not exists team text[] not null default '{}';
alter table completions add column if not exists team_xp int not null default 0;

create or replace view monster_xp with (security_invoker = true) as
  select monster, sum(xp)::int as xp from (
    select monster, xp from completions
    union all
    select unnest(team), team_xp from completions
    union all
    select unnest(monsters), xp from stamps
  ) x group by monster;
