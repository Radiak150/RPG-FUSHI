import type { Tone } from '../../data/types'

interface StatusPillProps {
  label: string
  tone: Tone
}

export function StatusPill({ label, tone }: StatusPillProps) {
  return <span className={`status-pill status-pill--${tone}`}>{label}</span>
}
