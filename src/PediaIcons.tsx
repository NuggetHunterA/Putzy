// Bilder für die Pedia-Kacheln im Stil des Schwamms: dicke Umrisse, flache Farben, ein Glanzpunkt.

// Comic-Totenkopf mit gekreuzten Schrubbbürsten: verrät keinen Boss.
export function Skull({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" stroke="#1B1530" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      {[40, -40].map((r) => (
        <g key={r} transform={`rotate(${r} 32 32)`}>
          <rect x="29.5" y="10" width="5" height="52" rx="2.5" fill="#C78A4A" />
          <rect x="24" y="1" width="16" height="11" rx="3" fill="#FFD23F" />
          <path d="M27 12v3M32 12v3M37 12v3" strokeWidth="2" />
        </g>
      ))}
      <g transform="translate(32 33) scale(.78) translate(-32 -30)">
      <path d="M32 8C19 8 11 17 11 28c0 7 3 11 7 13v7c0 2 1.5 3 3 3h22c1.5 0 3-1 3-3v-7c4-2 7-6 7-13C53 17 45 8 32 8Z" fill="#F4F1FA" />
      <ellipse cx="23.5" cy="29" rx="5.5" ry="6" fill="#1B1530" />
      <ellipse cx="40.5" cy="29" rx="5.5" ry="6" fill="#1B1530" />
      <circle cx="25" cy="27" r="1.6" fill="#7FD8F7" stroke="none" />
      <circle cx="42" cy="27" r="1.6" fill="#7FD8F7" stroke="none" />
      <path d="M32 35l-3 5h6z" fill="#1B1530" strokeWidth="2" />
      <path d="M24 44v7M29.3 44v7M34.7 44v7M40 44v7" strokeWidth="2.2" />
      <ellipse cx="20" cy="17" rx="3" ry="5" fill="#fff" stroke="none" transform="rotate(35 20 17)" opacity=".9" />
      </g>
    </svg>
  )
}

// Gummistempel mit rotem Griff und Abdruck darunter.
export function RubberStamp({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" stroke="#1B1530" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="32" cy="55" rx="22" ry="6" fill="none" stroke="#D6284A" strokeWidth="3" strokeDasharray="7 3" />
      <path d="M26 54l4 3 8-7" fill="none" stroke="#D6284A" strokeWidth="3" />
      <circle cx="32" cy="13" r="9" fill="#D6284A" />
      <ellipse cx="29" cy="10" rx="2.5" ry="3.5" fill="#fff" stroke="none" opacity=".85" transform="rotate(-30 29 10)" />
      <path d="M28 21h8l2 12H26z" fill="#C78A4A" />
      <rect x="14" y="33" width="36" height="8" rx="3" fill="#C78A4A" />
      <rect x="16" y="41" width="32" height="5" rx="1.5" fill="#D6284A" />
    </svg>
  )
}
