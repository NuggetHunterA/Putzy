// Event-Designs der Startseite: zu festen Daten im Jahr bekommt die Startseite ein eigenes Thema (siehe events.css).
export type AppEvent = 'halloween' | 'weihnachten' | 'silvester'

// Zeiträume als [Monat, Tag] von bis einschließlich.
const EVENTS: { id: AppEvent; from: [number, number]; to: [number, number] }[] = [
  { id: 'halloween', from: [10, 28], to: [10, 31] },
  { id: 'weihnachten', from: [12, 20], to: [12, 26] },
  { id: 'silvester', from: [12, 31], to: [12, 31] },
]

export function eventFor(date: Date): AppEvent | null {
  const md = (date.getMonth() + 1) * 100 + date.getDate()
  return EVENTS.find((e) => md >= e.from[0] * 100 + e.from[1] && md <= e.to[0] * 100 + e.to[1])?.id ?? null
}
