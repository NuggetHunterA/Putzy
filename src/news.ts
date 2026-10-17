// Was ist neu: Neuigkeiten für die Box beim Öffnen. Bei jedem spürbaren Feature unten einen Eintrag
// mit der nächsten Nummer ergänzen (Titel und ein bis zwei kurze Sätze).
export type News = { id: number; title: string; text: string }

export const NEWS: News[] = [
  { id: 1, title: 'Aufgaben selbst pflegen', text: 'Über das Zahnrad könnt ihr jetzt Aufgaben anlegen, ändern und löschen.' },
  { id: 2, title: 'Ständige Aufgaben', text: 'Kochen, Einkaufen, Wäsche, Spülmaschine und Garten stehen jetzt als Leiste oben unter „Heute“. Jeder von euch hakt sie einmal am Tag ab und bekommt XP wie für Aufwand S.' },
  { id: 3, title: 'Einmalige Aufgaben', text: 'Für Dinge wie Rauchmelder anbringen oder Flur streichen gibt es jetzt das Klemmbrett oben rechts. Jeder kann dort Aufgaben anlegen, und jede erledigte bringt 20 XP.' },
  { id: 4, title: 'Neue Monster: Aali und Raupsi', text: 'Aali der Aal (Wasser) entwickelt sich auf Level 20 zu Siphonix, Raupsi die Raupe (Luft) wird über Kokonella zu Papillora. Kokeli hat außerdem ein neues Bild.' },
  { id: 5, title: 'Monster antippen', text: 'Tippt oben auf euer Monster: Es hüpft und verrät, wie viele XP bis zum nächsten Level fehlen.' },
]

export const LATEST_NEWS = Math.max(0, ...NEWS.map((n) => n.id))

// Neuigkeiten seit dem letzten Stand, neueste oben. Ohne Stand (neue Person) gibt es keine.
export const unread = (lastSeen: number | undefined, news = NEWS) =>
  lastSeen === undefined ? [] : news.filter((n) => n.id > lastSeen).sort((a, b) => b.id - a.id)
