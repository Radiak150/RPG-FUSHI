import type { CSSProperties } from 'react'
import type { TabletopMap } from '../../data/types'
import type {
  TabletopVfxPreset,
  TabletopVfxPresentationState,
} from '../../data/vfxCatalog'

interface VfxTokenPosition {
  cell: {
    column: number
    row: number
  }
  id: string
}

export function TabletopVfxPresentation({
  map,
  presentation,
  preset,
  tokens,
}: {
  map: TabletopMap
  presentation: TabletopVfxPresentationState | null
  preset: TabletopVfxPreset | null
  tokens: VfxTokenPosition[]
}) {
  if (!presentation || !preset) {
    return null
  }

  const targetToken =
    presentation.targetTokenId &&
    tokens.find((token) => token.id === presentation.targetTokenId)
  const originX = targetToken
    ? ((targetToken.cell.column + 0.5) / map.gridColumns) * 100
    : 50
  const originY = targetToken
    ? ((targetToken.cell.row + 0.5) / map.gridRows) * 100
    : 50

  const style = {
    '--tabletop-vfx-color': preset.color,
    '--tabletop-vfx-origin-x': `${originX}%`,
    '--tabletop-vfx-origin-y': `${originY}%`,
  } as CSSProperties

  return (
    <div
      aria-hidden="true"
      className={[
        'tabletop-vfx-presentation',
        `tabletop-vfx-presentation--${preset.variant}`,
        `tabletop-vfx-presentation--${preset.scope}`,
      ].join(' ')}
      data-preset-id={preset.id}
      data-testid="tabletop-vfx-presentation"
      key={presentation.id}
      style={style}
    >
      <span className="tabletop-vfx-presentation__core" />
      <span className="tabletop-vfx-presentation__ring tabletop-vfx-presentation__ring--one" />
      <span className="tabletop-vfx-presentation__ring tabletop-vfx-presentation__ring--two" />
      <span className="tabletop-vfx-presentation__particles" />
    </div>
  )
}
