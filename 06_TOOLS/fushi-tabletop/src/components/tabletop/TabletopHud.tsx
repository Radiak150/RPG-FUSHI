import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'

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
  diagnostics: '/assets/ui/icons/hud-net-diagnostics.svg',
}

export function TabletopHud({
  items,
  activeItemId,
  onToggle,
}: TabletopHudProps) {
  return (
    <nav className="tabletop-hud" aria-label="Controles da mesa">
      {items.map((item) => (
        <button
          aria-label={item.label}
          className={`tabletop-hud__button${
            activeItemId === item.id ? ' tabletop-hud__button--active' : ''
          }`}
          key={item.id}
          onClick={() => onToggle(item.id)}
          title={item.label}
          type="button"
        >
          {HUD_ITEM_ICONS[item.id] ? (
            <img
              alt=""
              className="tabletop-hud__icon"
              src={resolveRuntimeAssetUrl(HUD_ITEM_ICONS[item.id])}
            />
          ) : (
            <span>{item.shortLabel}</span>
          )}
        </button>
      ))}
    </nav>
  )
}
