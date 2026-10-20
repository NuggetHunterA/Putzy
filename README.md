# Putzy

Putzy - the personal household helper. Eine PWA für Adrian und Ulrike: feste Haushaltsaufgaben mit Intervallen, Abhaken mit Live-Sync auf beiden Handys und Putz-Monster, die mit euren XP leveln.

## Spielregeln

- Jede Aufgabe hat einen Aufwand: S = 10 XP, M = 25 XP, L = 50 XP (in der Datenbank K/M/G). Passt das Element zum Monster der Woche, gibt es 125 %.
- Ständige Aufgaben (Kochen, Einkaufen, Wäsche, Spülmaschine, Garten) stehen als Leiste unter „Heute“. Jede Person hakt sie einmal pro Tag ab und bekommt XP wie für Aufwand K.
- Einmalige Aufgaben (Klemmbrett auf der Startseite) haben kein Element und geben 20 XP, Monstern ohne Element 30 XP. Jede wird nur einmal erledigt.
- Das Intervall zählt ab der letzten Erledigung. Jede Aufgabe zählt pro Tag nur einmal: Wer zuerst abhakt, bekommt die XP.
- Zurücknehmen kann man nur den eigenen Haken, bei einmaligen Aufgaben nur am selben Tag.
- Jeden Montag wählt jede Person ein Monster. Ein Monster gibt es einmal im Haushalt, es behält seine XP dauerhaft und ist pro Woche nur für eine Person wählbar.
- Sechs geheime Reihen (`secret` in `src/game.ts`, Regeln in `src/secret.ts`) sind anfangs nirgends zu sehen. Erreicht ein Monster eines Elements die Endform einer mindestens dreistufigen Reihe (bei Samsi Arborius), wird die geheime Reihe dieses Elements freigeschaltet; Wichti (ohne Element, 30 XP für einmalige Aufgaben, nie Element-Bonus) kommt mit der fünften. Sichtbar wird eine Reihe ab dem Tag danach, mit einer Animation beim ersten Öffnen. Datenbank: `supabase/geheime-monster.sql`.
- Streak und Eier (`src/streak.ts`, `src/eggs.ts`): Ein Tag zählt zur Streak, wenn am Ende keine normale Aufgabe mehr fällig ist; die längste Streak einer Woche gibt montags 0 bis 7 Punkte aufs gemeinsame Konto. Damit brütet ihr im Pedia Eier aus (Start-Ei 35, Event-Eier 10, sonst 60 Punkte). Weitere Eier findet man beim Abhaken mit 0,5 %, und zwar das Ei des Elements der Aufgabe (einmalige Aufgaben finden mit 1 % das Ei ohne Element), solange höchstens ein Ei wartet. Datenbank: `supabase/streak-eier.sql`.
- Events (`src/events.ts`, `src/events.css`): Zu 14 Events im Jahr (z. B. Ostern, Halloween, Weihnachten) bekommt die Startseite ein eigenes Design. Aufgaben des Event-Elements geben in der Zeit das 1,5-Fache an XP, zusätzlich zum Element-Bonus (`EVENT_BONUS`). Außerdem bekommt jedes freigeschaltete Monster des Event-Elements für jede solche Aufgabe 5 XP (`TEAM_BONUS`, Doppelelemente ab der Endstufe), angezeigt als Leiste unten (`src/TeamBar.tsx`); Datenbank: `supabase/team-bonus.sql`. Zu Halloween, Weihnachten und Chinesischem Neujahr liegt außerdem ein Event-Ei im Nest (`EVENT_EGGS` in `src/eggs.ts`), ohne Zufall und auch wenn schon Eier warten.
- Stempelheft (`src/stamps.ts`): 83 Stempel für Meilensteine, Element-Entwicklungen und jede Aufgabe (25× erledigt), gemeinsam und rückwirkend gezählt. Viele geben Bonus-XP an alle sichtbaren Monster bzw. an die eines Elements; die Boni zählen in die Monster-XP und den Wochenrückblick. Jede Person sieht die Animation jedes Stempels einmal. Datenbank: `supabase/stempelheft.sql`.
- Von Level n auf n+1 braucht ein Monster 130 + 4 × n XP (`LEVEL_BASE` und `LEVEL_STEP` in `src/game.ts`). Die meisten Monster entwickeln sich auf Level 10 (1.350 XP) und 25 (4.320 XP); Kokeli, Samsi und Aali haben eigene Stufen (`levels` in `src/game.ts`). Höchstes Level ist 30.
- Doppelelemente: Einige Reihen (z. B. Papillora, Korallgard, Aurorail und die Event-Monster) bekommen mit der Endstufe ein zweites Element (`second` in `src/game.ts`) und dann den Element-Bonus für beide.

## Einrichtung

1. **Supabase:** neues Projekt anlegen, im SQL-Editor `supabase/schema.sql` und danach `supabase/tasks.sql` ausführen. `schema.sql` enthält alle Tabellen; `geheime-monster.sql`, `streak-eier.sql`, `stempelheft.sql` und `team-bonus.sql` braucht nur eine Datenbank, die vor diesen Features angelegt wurde. Am ersten echten Tag `supabase/reset-alles.sql` ausführen: Es löscht alle Testdaten samt XP und verteilt die ersten Fälligkeiten.
2. **Vercel:** Repository importieren und die Umgebungsvariable `VITE_SUPABASE_URL` setzen (Project Settings > API in Supabase).
3. **Haushaltslink:** `https://<eure-vercel-domain>/#k=<publishable- bzw. anon-key>`. Diesen Link einmal auf jedem Handy öffnen, Namen wählen und in Chrome „Zum Startbildschirm hinzufügen“. Der Schlüssel steht nur im Link, nicht im Code. Wer den Link kennt, kommt in die App, also nicht weitergeben.

Die Aufgaben pflegt ihr in der App (Zahnrad auf der Startseite). `supabase/tasks.sql` dient nur zum ersten Befüllen.

Neuigkeiten für Adrian und Ulrike stehen in `src/news.ts` und erscheinen einmal pro Person in der Box „Was ist neu“.

## Entwicklung

```sh
npm install
cp .env.example .env.local   # VITE_SUPABASE_URL eintragen
npm run dev
npm test
```
