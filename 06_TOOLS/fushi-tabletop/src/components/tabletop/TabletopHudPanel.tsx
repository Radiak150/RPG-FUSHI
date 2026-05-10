import type { PropsWithChildren, ReactNode } from 'react'

interface TabletopHudPanelProps extends PropsWithChildren {
  title: string
  subtitle?: string
  onClose: () => void
  footer?: ReactNode
  showChrome?: boolean
}

export function TabletopHudPanel({
  title,
  subtitle,
  onClose,
  footer,
  showChrome = true,
  children,
}: TabletopHudPanelProps) {
  return (
    <aside className="tabletop-hud-panel" role="dialog" aria-label={title}>
      {showChrome ? (
        <div className="tabletop-hud-panel__top">
          <div>
            <p className="eyebrow">HUD</p>
            <h3>{title}</h3>
            {subtitle ? <p className="support-copy">{subtitle}</p> : null}
          </div>

          <button
            aria-label="Fechar painel"
            className="tabletop-icon-button"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>
      ) : null}

      <div className="tabletop-hud-panel__content">{children}</div>

      {footer ? <div className="tabletop-hud-panel__footer">{footer}</div> : null}
    </aside>
  )
}
