// Was ist neu: Neuigkeiten für die Box beim Öffnen. Bei jedem spürbaren Feature unten einen Eintrag
// mit der nächsten Nummer ergänzen (Titel und ein bis zwei kurze Sätze).
export type News = { id: number; title: string; text: string }

export const NEWS: News[] = [
  { id: 1, title: 'Aufgaben selbst pflegen', text: 'Über das Zahnrad könnt ihr jetzt Aufgaben anlegen, ändern und löschen.' },
  { id: 2, title: 'Ständige Aufgaben', text: 'Kochen, Einkaufen, Wäsche, Spülmaschine und Garten stehen jetzt als Leiste oben unter „Heute“. Jeder von euch hakt sie einmal am Tag ab und bekommt XP wie für Aufwand S.' },
  { id: 3, title: 'Einmalige Aufgaben', text: 'Für Dinge wie Rauchmelder anbringen oder Flur streichen gibt es jetzt das Klemmbrett oben rechts. Jeder kann dort Aufgaben anlegen, und jede erledigte bringt 20 XP.' },
  { id: 4, title: 'Neue Monster: Aali und Raupsi', text: 'Aali der Aal (Wasser) entwickelt sich auf Level 20 zu Siphonix, Raupsi die Raupe (Luft) wird über Kokonella zu Papillora. Kokeli hat außerdem ein neues Bild.' },
  { id: 5, title: 'Monster antippen', text: 'Tippt oben auf euer Monster: Es hüpft und verrät, wie viele XP bis zum nächsten Level fehlen.' },
  { id: 6, title: 'XP auf einen Blick', text: 'Auf der Startseite steht jetzt bei jeder Aufgabe, wie viele XP sie deinem Monster bringt, inklusive Element-Bonus. Beim Abhaken bleiben die XP etwas länger stehen.' },
  { id: 7, title: 'Event-Designs', text: 'Zu Festen und besonderen Tagen verkleidet sich die Startseite mit eigenem Himmel, Mütze auf dem Logo und passender Deko. Welche Tage das sind, verraten wir nicht.' },
  { id: 8, title: 'Zuverlässiger abhaken', text: 'Putzy lädt beim Zurückkehren in die App den neuesten Stand, und Fehlermeldungen bleiben stehen, bis ihr sie antippt. Einen Haken kann nur noch zurücknehmen, wer ihn gesetzt hat.' },
  { id: 9, title: 'Wochenrückblick', text: 'Zum Wochenstart seht ihr vor der Monsterwahl, was eure Monster letzte Woche geschafft haben: XP, Level, Entwicklungen und Aufgaben pro Element. Alle Wochen findet ihr in der Putzy-Pedia.' },
  { id: 10, title: 'Listen merken sich die Stelle', text: 'Nach dem Zurück aus einer Monsterreihe oder einer Aufgabe landet ihr wieder an derselben Stelle der Liste. Auf schmalen Handys sind jetzt beide Monster auf der Startseite ganz zu sehen.' },
  { id: 11, title: 'Mehr im Pedia', text: 'Jede Stufe hat jetzt ihren eigenen Pedia-Eintrag, und der Steckbrief verrät, wie groß ein Monster im Vergleich wirklich ist. Ab Level 5 stehen dort außerdem eure Werte: Lieblingsaufgabe, dabei seit und Rekordwoche.' },
  { id: 12, title: 'Neue Namen und Bilder', text: 'Funkel heißt jetzt Glitzi und Fluffi heißt Brisi, damit man sie nicht mehr mit Funki und Flausch verwechselt. Infernyx, Brisis Reihe, Salamandor, Sprössli und Papillora haben neue Bilder, und einige Pedia-Texte wiederholen sich nicht mehr.' },
  { id: 13, title: 'Streaks und Monster-Eier', text: 'Der Schwamm am Logo zählt die Tage dieser Woche, an denen alle fälligen Aufgaben erledigt waren. Die längste Streak gibt montags Punkte für euer gemeinsames Konto, damit brütet ihr im Pedia Eier aus. Das erste Ei liegt schon im Nest, weitere tauchen beim Abhaken ganz selten auf.' },
  { id: 14, title: 'Stempelheft', text: 'Für Meilensteine, Elemente und jede Aufgabe, die ihr 25× erledigt, gibt es jetzt Stempel, oft mit Bonus-XP für eure Monster. Ihr findet das Stempelheft im Pedia neben den Rückblicken.' },
  { id: 15, title: 'Streak neben dem Datum', text: 'Die Streak steht jetzt klein neben dem Datum, und das Logo hat wieder seine Seifenblasen. Antippen zeigt wie bisher die Erklärung, jetzt mit den Punkten für jeden Tag der Woche. Im Pedia heißen die Rückblicke jetzt „Wochen“.' },
  { id: 16, title: 'Doppelelemente', text: 'Aurorail, Korallgard und Papillora bekommen mit der Endstufe ein zweites Element: Aurorail Feuer, Korallgard und Papillora Natur. Dann gibt es den Element-Bonus für Aufgaben aus beiden Elementen.' },
  { id: 18, title: 'Event-Upgrade', text: 'Events sind jetzt wertvoller. Sie bieten Boni und manche Events sogar zusätzliche Überraschungen.' },
  { id: 17, title: 'Listenansicht im Pedia', text: 'Über den Schalter „Reihen | Liste“ zeigt das Pedia jede Stufe als kleine Kachel, so seht ihr viel mehr Monster auf einmal. In der Liste könnt ihr nach Element filtern.' },
  { id: 20, title: 'Legenden auf Level 30', text: 'Erreicht ein Monster Level 30, füllt es sich mit Gold und erzählt seine Legende. Diese Szene seht ihr beide, egal wer die Aufgabe abgehakt hat.' },
  { id: 19, title: 'Neue Entwicklungs-Level', text: 'Blattwart entwickelt sich jetzt schon auf Level 28 zu Arborius statt erst auf Level 30. Monster mit zwei Stufen, also Aali und Kokeli, entwickeln sich jetzt beide auf Level 18.' },
  { id: 21, title: 'Expeditionen', text: 'Über den Kompass oben schickt ihr Monster, die gerade nicht Wochenmonster sind, als Trupp in Gebiete im ganzen Haus. Sie bringen Früchte für XP mit, selten Streak-Punkte, neue Gebiets-Eier und ganz selten ein Shiny.' },
  { id: 22, title: 'Kleineres Nest, mehr Eier', text: 'Das Nest im Pedia ist jetzt kompakter. Zufalls-Eier tauchen auch noch auf, wenn schon zwei Eier warten.' },
  { id: 23, title: 'Event-Bosse', text: 'Zu zehn Events taucht ein Schmutz-Boss auf. Jede erledigte Aufgabe schwächt ihn um ihre XP, ab dem letzten Event-Tag schickt ihr drei Monster in den Endkampf, ein Sieg bringt 6 Streak-Punkte. Silvester geht jetzt bis zum 2. Januar.' },
  { id: 24, title: 'Frühjahrsputz nach Ostern', text: 'Der Frühjahrsputz beginnt jetzt jedes Jahr genau drei Wochen nach dem Start des Oster-Events und dauert eine Woche. Den Stempel „Volles Nest“ gibt es schon für 10 ausgebrütete Eier.' },
  { id: 25, title: 'Level-Up beim Füttern', text: 'Steigt ein Monster durch eine Frucht aus dem Fruchtkorb ein Level auf, gibt es jetzt auch das Level-Up-Vollbild wie beim Abhaken.' },
  { id: 26, title: 'Lieblingsaufgabe mit Raum', text: 'Im Steckbrief steht bei der Lieblingsaufgabe jetzt auch der Raum, also zum Beispiel „Küche · 12-mal erledigt“. Gleichnamige Aufgaben in verschiedenen Räumen werden dafür getrennt gezählt.' },
]

export const LATEST_NEWS = Math.max(0, ...NEWS.map((n) => n.id))

// Neuigkeiten seit dem letzten Stand, neueste oben. Ohne Stand (neue Person) gibt es keine.
export const unread = (lastSeen: number | undefined, news = NEWS) =>
  lastSeen === undefined ? [] : news.filter((n) => n.id > lastSeen).sort((a, b) => b.id - a.id)
