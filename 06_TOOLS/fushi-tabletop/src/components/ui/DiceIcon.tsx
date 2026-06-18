import { useId, type CSSProperties } from 'react'

interface DiceIconProps {
  color?: string
  label?: string
  rolling?: boolean
  size?: 'sm' | 'md' | 'lg'
  type: number
}

const DICE_SHAPES: Record<number, { points?: string; kind: 'coin' | 'poly' | 'rounded' }> = {
  2: { kind: 'coin' },
  4: { kind: 'poly', points: '64 12 111 102 17 102' },
  6: { kind: 'rounded' },
  8: { kind: 'poly', points: '64 10 113 64 64 118 15 64' },
  10: { kind: 'poly', points: '64 9 106 46 92 109 36 109 22 46' },
  12: { kind: 'poly', points: '64 9 103 25 119 64 103 103 64 119 25 103 9 64 25 25' },
  16: { kind: 'poly', points: '64 8 101 19 120 50 114 86 88 114 49 119 16 99 8 64 16 29 49 9' },
  20: { kind: 'poly', points: '64 8 101 21 120 57 111 97 76 120 36 112 10 80 14 39 43 13' },
  30: { kind: 'poly', points: '64 6 91 13 112 33 122 60 116 88 96 111 69 122 40 116 17 96 6 69 12 40 35 16' },
  100: { kind: 'coin' },
}

function getShape(type: number) {
  return DICE_SHAPES[type] ?? DICE_SHAPES[20]
}

export function DiceIcon({
  color = '#d8a34d',
  label,
  rolling = false,
  size = 'md',
  type,
}: DiceIconProps) {
  const gradientId = useId().replace(/:/g, '')
  const shape = getShape(type)
  const displayLabel = label ?? (type === 2 ? '1d2' : String(type))
  const labelFontSize = displayLabel.length > 3 ? 18 : type === 100 ? 24 : 29
  const style = {
    '--dice-color': color,
  } as CSSProperties

  return (
    <svg
      aria-hidden="true"
      className={`dice-icon dice-icon--${size}${rolling ? ' dice-icon--rolling' : ''}`}
      style={style}
      viewBox="0 0 128 128"
    >
      <defs>
        <radialGradient id={`${gradientId}-glow`} cx="34%" cy="24%" r="78%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.22" stopColor="#fff0b4" stopOpacity="0.46" />
          <stop offset="0.58" stopColor={color} stopOpacity="0.96" />
          <stop offset="1" stopColor="#17100a" stopOpacity="1" />
        </radialGradient>
        <linearGradient id={`${gradientId}-cut`} x1="14" x2="116" y1="12" y2="116">
          <stop stopColor="#fff4c7" stopOpacity="0.92" />
          <stop offset="0.5" stopColor="#14100d" stopOpacity="0.22" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.52" />
        </linearGradient>
      </defs>
      {shape.kind === 'coin' ? (
        <>
          <circle
            cx="64"
            cy="64"
            fill={`url(#${gradientId}-glow)`}
            r={type === 100 ? 49 : 45}
            stroke="#fff1b4"
            strokeWidth="4"
          />
          <circle cx="64" cy="64" fill="none" r={type === 100 ? 36 : 30} stroke="#2b2115" strokeOpacity="0.42" strokeWidth="5" />
          {type === 100 ? (
            <circle cx="64" cy="64" fill="none" r="21" stroke="#fff1b4" strokeOpacity="0.58" strokeWidth="3" />
          ) : null}
        </>
      ) : shape.kind === 'rounded' ? (
        <>
          <rect
            fill={`url(#${gradientId}-glow)`}
            height="82"
            rx="12"
            stroke="#fff1b4"
            strokeWidth="4"
            transform="rotate(-2 64 64)"
            width="82"
            x="23"
            y="23"
          />
          <path d="M34 38h60M35 89h58M40 32l47 64M89 34 39 94" fill="none" stroke="#2b2115" strokeOpacity="0.26" strokeWidth="4" />
        </>
      ) : (
        <>
          <polygon fill={`url(#${gradientId}-glow)`} points={shape.points} stroke="#fff1b4" strokeLinejoin="round" strokeWidth="4" />
          <path d="M64 12v104M18 64h92M37 28l54 72M91 28 37 100" fill="none" stroke="#2b2115" strokeOpacity="0.28" strokeWidth="4" />
          <polygon fill={`url(#${gradientId}-cut)`} points={shape.points} opacity="0.32" />
        </>
      )}
      <text
        fill="#fff8dd"
        fontFamily="Georgia, serif"
        fontSize={labelFontSize}
        fontWeight="800"
        textAnchor="middle"
        x="64"
        y="73"
      >
        {displayLabel}
      </text>
    </svg>
  )
}
