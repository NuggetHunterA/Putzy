// Ein runder Gummistempel: Doppelring in Tintenfarbe, Name im Bogen oben, Symbol oder Zahl in der Mitte.
// Verdient leicht schief mit Tinten-Struktur, offen als gestrichelter grauer Umriss.
import { useId } from 'react'
import { ElementIcon } from './ElementIcon'
import type { Icon, Stamp } from './stamps'

const OPEN = '#B4AECB'

const ICONS: Record<Exclude<Icon, 'wasser' | 'feuer' | 'natur' | 'luft' | 'licht' | 'ohne'>, string> = {
  pfeil: 'M12 20V5M6 11l6-6 6 6',
  geheim: 'M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .9-1 1.7V15M12 18.5v.1',
  topf: 'M5 10h14v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3zM3 10h18M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2',
  haus: 'M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5',
  schwamm: 'M7 7h10a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3zM9 11v.1M14 13v.1M16 10v.1',
  ei: 'M12 3c3.6 0 6 5.4 6 10a6 6 0 0 1-12 0c0-4.6 2.4-10 6-10zM7 13l2.5-2 2.5 2 2.5-2 2.5 2',
  nest: 'M3 13c3 6 15 6 18 0M5 13c1-3 3-4 4-4M19 13c-1-3-3-4-4-4M9.5 12a2.5 3 0 1 1 5 0',
  klemmbrett: 'M7 4h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 3h6v3H9zM9 12l2 2 4-4',
  krone: 'M4 18h16M5 15L4 7l5 4 3-6 3 6 5-4-1 8z',
}

export function StampMark({ stamp, open = false, hide = false, size = 64, tilt = 0 }: { stamp: Stamp; open?: boolean; hide?: boolean; size?: number; tilt?: number }) {
  const id = useId()
  const c = open ? OPEN : stamp.color
  const icon = hide ? 'geheim' : stamp.icon
  const big = hide ? undefined : stamp.big
  const arc = hide ? '???' : stamp.arc
  return (
    <svg className="stamp-mark" width={size} height={size} viewBox="0 0 100 100" style={{ rotate: `${open ? 0 : tilt}deg` }} aria-hidden="true">
      <defs>
        <path id={`${id}a`} d="M 17 50 A 33 33 0 0 1 83 50" />
        {/* Tinte: Rauschen stanzt kleine Lücken aus, wie bei einem echten Stempel. */}
        <filter id={`${id}f`}>
          <feTurbulence baseFrequency=".9" numOctaves="2" seed={stamp.id.length} />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.45" />
          <feComposite in="SourceGraphic" operator="in" />
        </filter>
      </defs>
      {open && <circle cx="50" cy="50" r="45" fill="#fff" />}
      <g filter={open ? undefined : `url(#${id}f)`}>
        <circle cx="50" cy="50" r="45" fill="none" stroke={c} strokeWidth="5" strokeDasharray={open ? '7 6' : undefined} />
        <circle cx="50" cy="50" r="37" fill="none" stroke={c} strokeWidth="2" />
        <text fontFamily="Bricolage Grotesque, system-ui, sans-serif" fontWeight="800" fontSize={arc.length > 14 ? 8 : 10.5} letterSpacing="1" fill={c}>
          <textPath href={`#${id}a`} startOffset="50%" textAnchor="middle">
            {(arc.length > 22 ? `${arc.slice(0, 21)}…` : arc).toUpperCase()}
          </textPath>
        </text>
        {big ? (
          <text x="50" y="63" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize={big.length > 3 ? 24 : 32} fill={c}>
            {big}
          </text>
        ) : icon && icon in ICONS ? (
          <g transform="translate(32 34) scale(1.5)" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICONS[icon as keyof typeof ICONS]} />
          </g>
        ) : (
          icon && (
            <g transform="translate(32 34) scale(1.5)" color={c}>
              <ElementIcon element={icon as Exclude<Icon, keyof typeof ICONS>} size={24} />
            </g>
          )
        )}
      </g>
    </svg>
  )
}
