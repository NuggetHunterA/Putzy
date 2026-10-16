import type { Element } from './game'

const PATHS: Record<Element, React.ReactNode> = {
  wasser: <path d="M12 3c3.5 4.5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.5-6.5 6-11z" />,
  feuer: <path d="M12 3c1 3 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 0 2 1 3.5 2.5 3.5 0-3.5-1-5.5 0-8.5z" />,
  natur: (
    <>
      <path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z" />
      <path d="M5 19l8-8" />
    </>
  ),
  luft: (
    <>
      <path d="M3 8h11a3 3 0 1 0-3-3" />
      <path d="M3 12h16a3 3 0 1 1-3 3" />
      <path d="M3 16h7" />
    </>
  ),
  licht: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
    </>
  ),
}

export function ElementIcon({ element, size = 22 }: { element: Element; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[element]}
    </svg>
  )
}
