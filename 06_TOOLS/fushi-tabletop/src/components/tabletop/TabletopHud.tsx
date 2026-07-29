import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'
import { ShieldAlert, type LucideIcon } from 'lucide-react'

interface HudItem {
  id: string
  label: string
  shortLabel: string
}

interface TabletopHudProps {
  items: HudItem[]
  activeItemId: string | null
  onToggle: (itemId: string) => void
}

const HUD_ITEM_ICONS: Record<string, string> = {
  maps: '/assets/ui/icons/hud-map.svg',
  book: '/assets/ui/icons/hud-book.svg',
  music: '/assets/ui/icons/hud-msc.svg',
  npcs: '/assets/ui/icons/hud-npc.svg',
  objects: '/assets/ui/icons/hud-obj.svg',
  world: '/assets/ui/icons/hud-mun-compass.svg',
  turns: '/assets/ui/icons/hud-trn-turns.svg',
  builds: '/assets/ui/icons/hud-bui-builds.svg',
  events: '/assets/ui/icons/hud-eve-events.svg',
  diagnostics: '/assets/ui/icons/hud-net-diagnostics.svg',
}

const HUD_ITEM_LUCIDE_ICONS: Record<string, LucideIcon> = {
  statuses: ShieldAlert,
}

export function TabletopHud({
  items,
  activeItemId,
  onToggle,
}: TabletopHudProps) {
  return (
    <nav className="tabletop-hud" aria-label="Controles da mesa">
      {items.map((item) => (
        <HudButton
          active={activeItemId === item.id}
          item={item}
          key={item.id}
          onToggle={onToggle}
        />
      ))}
    </nav>
  )
}

function HudButton({
  active,
  item,
  onToggle,
}: {
  active: boolean
  item: HudItem
  onToggle: (itemId: string) => void
}) {
  const Icon = HUD_ITEM_LUCIDE_ICONS[item.id]

  return (
    <button
      aria-label={item.label}
      className={`tabletop-hud__button${
        active ? ' tabletop-hud__button--active' : ''
      }`}
      onClick={() => onToggle(item.id)}
      title={item.label}
      type="button"
    >
      {Icon ? (
        <Icon aria-hidden="true" size={24} strokeWidth={1.7} />
      ) : HUD_ITEM_ICONS[item.id] ? (
        <img
          alt=""
          className="tabletop-hud__icon"
          src={resolveRuntimeAssetUrl(HUD_ITEM_ICONS[item.id])}
        />
      ) : (
        <span>{item.shortLabel}</span>
      )}
    </button>
  )
}
