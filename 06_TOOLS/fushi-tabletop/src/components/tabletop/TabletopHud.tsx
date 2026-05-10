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
          <span>{item.shortLabel}</span>
        </button>
      ))}
    </nav>
  )
}
