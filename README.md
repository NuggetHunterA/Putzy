# Putzy

Putzy - the personal household helper. Eine PWA für Adrian und Ulrike: feste Haushaltsaufgaben mit Intervallen, Abhaken mit Live-Sync auf beiden Handys und Putz-Monster, die mit euren XP leveln.

## Spielregeln

- Jede Aufgabe hat einen Aufwand: K = 10 XP, M = 25 XP, G = 50 XP. Passt das Element zum Monster der Woche, gibt es 125 %.
- Ständige Aufgaben (Kochen, Einkaufen, Wäsche, Spülmaschine, Garten) stehen als Leiste unter „Heute“. Jede Person hakt sie einmal pro Tag ab und bekommt XP wie für Aufwand K.
- Einmalige Aufgaben (Klemmbrett auf der Startseite) haben kein Element und geben immer 20 XP. Jede wird nur einmal erledigt.
- Das Intervall zählt ab der letzten Erledigung. Jede Aufgabe zählt pro Tag nur einmal: Wer zuerst abhakt, bekommt die XP.
- Zurücknehmen kann man nur den eigenen Haken, bei einmaligen Aufgaben nur am selben Tag.
- Jeden Montag wählt jede Person ein Monster. Ein Monster gibt es einmal im Haushalt, es behält seine XP dauerhaft und ist pro Woche nur für eine Person wählbar.
- Sechs geheime Reihen (`secret` in `src/game.ts`, Regeln in `src/secret.ts`) sind anfangs nirgends zu sehen. Erreicht ein Monster eines Elements die Endform einer mindestens dreistufigen Reihe (bei Samsi Arborius), wird die geheime Reihe dieses Elements freigeschaltet; Wichti (ohne Element, 30 XP für einmalige Aufgaben, nie Element-Bonus) kommt mit der fünften. Sichtbar wird eine Reihe ab dem Tag danach, mit einer Animation beim ersten Öffnen. Datenbank: `supabase/geheime-monster.sql`.
- Von Level n auf n+1 braucht ein Monster 130 + 4 × n XP (`LEVEL_BASE` und `LEVEL_STEP` in `src/game.ts`). Die meisten Monster entwickeln sich auf Level 10 (1.350 XP) und 25 (4.320 XP); Kokeli, Samsi und Aali haben eigene Stufen (`levels` in `src/game.ts`).

## Einrichtung

1. **Supabase:** neues Projekt anlegen, im SQL-Editor `supabase/schema.sql` und danach `supabase/tasks.sql` ausführen. Am ersten echten Tag `supabase/reset-alles.sql` ausführen: Es löscht alle Testdaten samt XP und verteilt die ersten Fälligkeiten.
2. **Vercel:** Repository importieren und die Umgebungsvariable `VITE_SUPABASE_URL` setzen (Project Settings > API in Supabase).
3. **Haushaltslink:** `https://<eure-vercel-domain>/#k=<publishable- bzw. anon-key>`. Diesen Link einmal auf jedem Handy öffnen, Namen wählen und in Chrome „Zum Startbildschirm hinzufügen“. Der Schlüssel steht nur im Link, nicht im Code. Wer den Link kennt, kommt in die App, also nicht weitergeben.

Die Aufgaben pflegt ihr in der App (Zahnrad auf der Startseite). `supabase/tasks.sql` dient nur zum ersten Befüllen.

## Entwicklung

```sh
npm install
cp .env.example .env.local   # VITE_SUPABASE_URL eintragen
npm run dev
npm test
```
