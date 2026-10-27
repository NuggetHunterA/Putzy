// Ein runder Gummistempel: Doppelring in Tintenfarbe, Symbol oder Zahl oben, Name gerade auf einer Banderole darunter.
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
  schwert: 'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2',
  pokal: 'M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6',
}

// Name für die Banderole: lange Namen auf so viele ganze Wörter gekürzt, wie hineinpassen.
function ribbonText(arc: string) {
  if (arc.length <= 17) return arc
  const words = arc.split(' ')
  let t = words[0]
  for (const w of words.slice(1)) if (`${t} ${w}`.length <= 17) t = `${t} ${w}`; else break
  return t
}

export function StampMark({ stamp, open = false, hide = false, size = 64, tilt = 0 }: { stamp: Stamp; open?: boolean; hide?: boolean; size?: number; tilt?: number }) {
  const id = useId()
  const c = open ? OPEN : stamp.color
  const icon = hide ? 'geheim' : stamp.icon
  const big = hide ? undefined : stamp.big
  const label = (hide ? '???' : ribbonText(stamp.arc)).toUpperCase()
  const fs = label.length > 12 ? 11 : label.length > 9 ? 13 : label.length > 6 ? 15.5 : 18
  return (
    <svg className="stamp-mark" width={size} height={size} viewBox="0 0 100 100" style={{ rotate: `${open ? 0 : tilt}deg`, overflow: 'visible' }} aria-hidden="true">
      <defs>
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
        {big ? (
          <text x="50" y="46" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize={big.length > 3 ? 22 : 28} fill={c}>
            {big}
          </text>
        ) : icon && icon in ICONS ? (
          <g transform="translate(35.6 21.6) scale(1.2)" fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICONS[icon as keyof typeof ICONS]} />
          </g>
        ) : (
          icon && (
            <g transform="translate(35.6 21.6) scale(1.2)" color={c}>
              <ElementIcon element={icon as Exclude<Icon, keyof typeof ICONS>} size={24} />
            </g>
          )
        )}
      </g>
      {/* Banderole ohne Tintenlücken, damit der Name auch klein lesbar bleibt. */}
      <path d="M -4 60 H 104 L 98 70 L 104 80 H -4 L 2 70 Z" fill={c} />
      <text x="50" y={70 + fs * 0.36} textAnchor="middle" fontFamily="Bricolage Grotesque, system-ui, sans-serif" fontWeight="800" fontSize={fs} letterSpacing=".2" fill="#fff"
        textLength={label.length * fs * 0.68 > 94 ? 94 : undefined} lengthAdjust="spacingAndGlyphs">
        {label}
      </text>
    </svg>
  )
}
