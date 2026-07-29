import {
  BatteryLow,
  Bone,
  BrainCog,
  ChevronsDown,
  CirclePause,
  Cross,
  Diamond,
  Droplets,
  Eye,
  FastForward,
  Flame,
  FlaskConical,
  HeartPulse,
  Orbit,
  Atom,
  Shield,
  ShieldOff,
  Shuffle,
  Skull,
  Snowflake,
  Sparkles,
  Syringe,
  Target,
  TrendingDown,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import type { TabletopStatusIcon as TabletopStatusIconName } from '../../data/statusCatalog'

const STATUS_ICON_COMPONENTS: Record<TabletopStatusIconName, LucideIcon> = {
  aggro: Target,
  aura: Waves,
  bleeding: Droplets,
  broken: Bone,
  burning: Flame,
  confused: Shuffle,
  controlled: BrainCog,
  custom: Diamond,
  exhausted: BatteryLow,
  fear: Eye,
  frozen: Snowflake,
  healing: HeartPulse,
  paralyzed: CirclePause,
  poisoned: FlaskConical,
  protection: Shield,
  science: Atom,
  slow: ChevronsDown,
  special: Sparkles,
  speed: FastForward,
  stunned: Orbit,
  tired: Cross,
  unconscious: Skull,
  vaccine: Syringe,
  vulnerable: ShieldOff,
  weakened: TrendingDown,
}

interface TabletopStatusIconProps {
  className?: string
  icon: TabletopStatusIconName
  label?: string
  size?: number
}

export function TabletopStatusIcon({
  className,
  icon,
  label,
  size = 20,
}: TabletopStatusIconProps) {
  const Icon = STATUS_ICON_COMPONENTS[icon]

  return (
    <Icon
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={className}
      role={label ? 'img' : undefined}
      size={size}
      strokeWidth={1.8}
    />
  )
}
