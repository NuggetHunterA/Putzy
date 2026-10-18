// Android-Zurück: Jede offene Ebene (Unterseite, Detail, Vollbild) legt einen Verlaufseintrag an.
// Zurück schließt die oberste Ebene. Schließt man sie per Knopf, wird ihr Eintrag wieder entfernt,
// damit Zurück auf der Startseite die App wie gewohnt verlässt.
// Die Scrollstelle darunter merkt sich jede Ebene selbst und stellt sie beim Schließen wieder her,
// denn das automatische Zurückspringen des Browsers landete auf Android teils auf einer leeren Stelle.
import { useEffect, useRef, useState } from 'react'

history.scrollRestoration = 'manual'

const open: { current: () => void }[] = []
let removing = 0
let ignore = false

addEventListener('popstate', () => {
  if (ignore) ignore = false
  else open.pop()?.current()
})

export function useBack(onBack: () => void) {
  const ref = useRef(onBack)
  // Beim ersten Rendern zeigt die Seite noch die Ebene darunter.
  const [below] = useState(() => window.scrollY)
  useEffect(() => {
    ref.current = onBack
  })
  useEffect(() => {
    history.pushState(null, '')
    open.push(ref)
    return () => {
      window.scrollTo(0, below)
      const i = open.indexOf(ref)
      if (i < 0) return // schon per Zurück geschlossen
      open.splice(i, 1)
      // Mehrere Ebenen, die zusammen schließen, nehmen ihre Einträge in einem Schritt zurück.
      if (removing++ === 0)
        queueMicrotask(() => {
          ignore = true
          history.go(-removing)
          removing = 0
        })
    }
  }, [])
}
