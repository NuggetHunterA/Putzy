// Gelber Schwamm mit Zahl: aktuelle Streak auf der Startseite, Konto im Pedia.
export function Sponge({ n, size }: { n?: number; size: number }) {
  return (
    <svg className="sponge" width={size} height={size * 0.82} viewBox="0 0 56 46" aria-hidden="true">
      <path d="M5 9 Q4 4 9 4 L47 3 Q52 3 52 8 L53 38 Q53 43 48 43 L9 43 Q4 43 4 38 Z" fill="#FFD23F" stroke="#1B1530" strokeWidth="3" strokeLinejoin="round" />
      <g fill="#E0A800">
        <circle cx="11" cy="11" r="2.4" />
        <circle cx="46" cy="10" r="2" />
        <circle cx="45" cy="34" r="2.6" />
        <circle cx="12" cy="35" r="2" />
        <circle cx="28" cy="38" r="1.5" />
        <circle cx="20" cy="8" r="1.4" />
      </g>
      {n !== undefined && (
        <text x="28.5" y="31" textAnchor="middle" fontFamily="Bangers" fontSize="26" fill="#1B1530">
          {n}
        </text>
      )}
    </svg>
  )
}
