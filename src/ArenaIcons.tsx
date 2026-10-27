// Symbole der Arena: Joker-Karte, Zutaten, Meisterzutat, Kessel, Trank-Flasche, Pokal und der Element-Kreis.
import { useId } from 'react'
import { ElementIcon } from './ElementIcon'
import { BEATS } from './expeditions'
import { ELEMENTS, TASK_ELEMENTS, type Element, type MonsterElement } from './game'

const INK = '#1B1530'

export function Joker({ size = 18, empty = false }: { size?: number; empty?: boolean }) {
  if (empty)
    return (
      <svg width={size * 0.78} height={size} viewBox="0 0 28 36" aria-hidden="true">
        <rect x="2" y="2" width="24" height="32" rx="5" fill="none" stroke="#8A82A6" strokeWidth="2.6" strokeDasharray="4 3" />
      </svg>
    )
  return (
    <svg width={size * 0.78} height={size} viewBox="0 0 28 36" aria-hidden="true">
      <rect x="2" y="2" width="24" height="32" rx="5" fill="#FFD23F" stroke={INK} strokeWidth="3" />
      <path d="M14 9l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 29h12" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function Trophy({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6" />
    </svg>
  )
}

// Zutat als Kugel in der Farbe ihres Elements; ohne Element golden (Meisterzutat), solange unbekannt mit Fragezeichen.
export function Ingredient({ element, size = 30, unknown = false }: { element: Element | null; size?: number; unknown?: boolean }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      {element ? (
        <>
          <circle cx="16" cy="17" r="12" fill={ELEMENTS[element].strong} stroke={INK} strokeWidth="2.6" />
          <circle cx="16" cy="17" r="7" fill={ELEMENTS[element].soft} opacity=".7" />
        </>
      ) : (
        <>
          <defs>
            <radialGradient id={id} cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor="#FFF6C2" />
              <stop offset="1" stopColor="#F2A900" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="17" r="12" fill={`url(#${id})`} stroke={INK} strokeWidth="2.6" />
        </>
      )}
      {unknown ? (
        <text x="16" y="23" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="17" fill={INK}>
          ?
        </text>
      ) : (
        <ellipse cx="11.5" cy="12" rx="3" ry="4.2" fill="#fff" opacity=".85" transform="rotate(-30 11.5 12)" />
      )}
      {element && <path d="M25 3l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill="#fff" stroke={INK} strokeWidth="1.3" />}
    </svg>
  )
}

export function Kettle({ liquid = '#5BC44A', size = 70, glow = false }: { liquid?: string; size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      {glow && <circle cx="40" cy="40" r="38" fill="#FFD23F" opacity=".35" />}
      <circle cx="30" cy="16" r="5" fill={liquid} stroke={INK} strokeWidth="2" />
      <circle cx="46" cy="10" r="3.5" fill={liquid} stroke={INK} strokeWidth="2" />
      <path d="M10 34 Q10 70 40 70 Q70 70 70 34 Z" fill="#2B2340" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <ellipse cx="40" cy="34" rx="31" ry="9" fill={liquid} stroke={INK} strokeWidth="3.5" style={{ transition: 'fill .4s' }} />
      <circle cx="32" cy="32" r="3" fill="#fff" opacity=".6" />
      <circle cx="48" cy="35" r="2" fill="#fff" opacity=".6" />
      <path d="M20 70l-4 7M60 70l4 7" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d="M6 36h6M68 36h6" stroke={INK} strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

export function Bottle({ color, size = 90, gold = false }: { color: string; size?: number; gold?: boolean }) {
  const path = 'M24 12h12v12c10 4 16 12 16 24a22 22 0 0 1-44 0c0-12 6-20 16-24z'
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 60 78" aria-hidden="true">
      {gold && <circle cx="30" cy="46" r="30" fill="#FFD23F" opacity=".45" />}
      <rect x="23" y="4" width="14" height="8" rx="2" fill="#C9935A" stroke={INK} strokeWidth="3" />
      <path d={path} fill="#fff" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M10 46c8-4 32-4 40 0a20 20 0 0 1-40 0z" fill={color} />
      <path d={path} fill="none" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <ellipse cx="19" cy="40" rx="3" ry="6" fill="#fff" opacity=".8" transform="rotate(20 19 40)" />
      {gold && <path d="M50 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FFF6C2" stroke={INK} strokeWidth="1.8" />}
    </svg>
  )
}

// Element-Kreis: Pfeil heißt „schlägt“. Elemente des Leiters rot umrandet, seine Konter grün, ihre Pfeile hervorgehoben.
export function ElementCircle({ lead, size = 128 }: { lead: MonsterElement[]; size?: number }) {
  const id = useId()
  const order = TASK_ELEMENTS
  const counter = order.filter((e) => lead.includes(BEATS[e]))
  const pos = order.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    return [64 + 46 * Math.cos(a), 64 + 46 * Math.sin(a)]
  })
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" aria-hidden="true">
      <defs>
        <marker id={`${id}a`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0l10 5-10 5z" fill={INK} />
        </marker>
        <marker id={`${id}g`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M0 0l10 5-10 5z" fill="#00B39B" />
        </marker>
      </defs>
      {order.map((e, i) => {
        const [x1, y1] = pos[i]
        const [x2, y2] = pos[(i + 1) % 5]
        const len = Math.hypot(x2 - x1, y2 - y1)
        const [ux, uy] = [(x2 - x1) / len, (y2 - y1) / len]
        const hot = counter.includes(e)
        return (
          <line key={e} x1={x1 + ux * 17} y1={y1 + uy * 17} x2={x2 - ux * 19} y2={y2 - uy * 19} stroke={hot ? '#00B39B' : INK} strokeWidth={hot ? 4 : 2.4} markerEnd={`url(#${id}${hot ? 'g' : 'a'})`} opacity={hot ? 1 : 0.5} />
        )
      })}
      {order.map((e, i) => {
        const [x, y] = pos[i]
        const ring = lead.includes(e) ? '#D6284A' : counter.includes(e) ? '#00B39B' : null
        return (
          <g key={e}>
            {ring && <circle cx={x} cy={y} r="17" fill="none" stroke={ring} strokeWidth="3.5" />}
            <circle cx={x} cy={y} r="12.5" fill={ELEMENTS[e].strong} stroke={INK} strokeWidth="2.4" />
            <g transform={`translate(${x - 8} ${y - 8})`} color={INK}>
              <ElementIcon element={e} size={16} />
            </g>
          </g>
        )
      })}
    </svg>
  )
}
