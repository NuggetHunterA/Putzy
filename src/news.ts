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
  { id: 12, title: 'Neue Namen und Bilder', text: 'Funkel heißt jetzt Glitzi und Fluffi heißt Brisi, damit sie nicht mehr mit Funki und Flausch verwechselt werden. Infernyx ist jetzt ein Feuerfuchs, und einige Pedia-Einträge haben neue Texte, damit sich die Monster weniger wiederholen.' },
]

export const LATEST_NEWS = Math.max(0, ...NEWS.map((n) => n.id))

// Neuigkeiten seit dem letzten Stand, neueste oben. Ohne Stand (neue Person) gibt es keine.
export const unread = (lastSeen: number | undefined, news = NEWS) =>
  lastSeen === undefined ? [] : news.filter((n) => n.id > lastSeen).sort((a, b) => b.id - a.id)
