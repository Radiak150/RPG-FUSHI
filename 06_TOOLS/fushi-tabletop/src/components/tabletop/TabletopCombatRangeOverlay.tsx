import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { TabletopMap, TabletopToken } from '../../data/types'
import type { TabletopCombatPreview } from '../../lib/tabletopSession'

interface TabletopCombatRangeOverlayProps {
  map: TabletopMap
  onClose: () => void
  preview: TabletopCombatPreview | null
  tokens: TabletopToken[]
}

function getHighlightedCells(map: TabletopMap, preview: TabletopCombatPreview) {
  if (preview.shape === 'map') {
    return []
  }

  const radius = Math.max(1, (preview.radiusMeters ?? 1.5) / 1.5)
  const cells: Array<{ column: number; row: number }> = []
  const startColumn = Math.max(0, Math.floor(preview.origin.column - radius))
  const endColumn = Math.min(map.gridColumns - 1, Math.ceil(preview.origin.column + radius))
  const startRow = Math.max(0, Math.floor(preview.origin.row - radius))
  const endRow = Math.min(map.gridRows - 1, Math.ceil(preview.origin.row + radius))

  for (let row = startRow; row <= endRow; row += 1) {
    for (let column = startColumn; column <= endColumn; column += 1) {
      const inside = preview.shape === 'adjacent'
        ? Math.max(
            Math.abs(column - preview.origin.column),
            Math.abs(row - preview.origin.row),
          ) <= 1
        : Math.hypot(column - preview.origin.column, row - preview.origin.row) <= radius

      if (inside) {
        cells.push({ column, row })
      }
    }
  }

  return cells
}

export function TabletopCombatRangeOverlay({
  map,
  onClose,
  preview,
  tokens,
}: TabletopCombatRangeOverlayProps) {
  if (!preview) return null

  const style = {
    '--combat-preview-color': preview.color,
  } as CSSProperties
  const cells = getHighlightedCells(map, preview)
  const targetToken = preview.targetTokenId
    ? tokens.find((token) => token.id === preview.targetTokenId) ?? null
    : null

  return (
    <>
      <div
        className={`tabletop-combat-range tabletop-combat-range--${preview.shape}`}
        style={style}
      >
        {preview.shape === 'map' ? <div className="tabletop-combat-range__map" /> : null}
        {cells.map((cell) => (
          <div
            className="tabletop-combat-range__cell"
            key={`${cell.column}-${cell.row}`}
            style={{
              height: `${100 / map.gridRows}%`,
              left: `${(cell.column / map.gridColumns) * 100}%`,
              top: `${(cell.row / map.gridRows) * 100}%`,
              width: `${100 / map.gridColumns}%`,
            }}
          />
        ))}
        <div
          className="tabletop-combat-range__origin"
          style={{
            left: `${((preview.origin.column + 0.5) / map.gridColumns) * 100}%`,
            top: `${((preview.origin.row + 0.5) / map.gridRows) * 100}%`,
          }}
        >
          <span>{preview.label}</span>
        </div>
        {targetToken ? (
          <div
            aria-label={`Alvo: ${targetToken.label}`}
            className="tabletop-combat-range__target"
            style={{
              height: `${100 / map.gridRows}%`,
              left: `${(targetToken.cell.column / map.gridColumns) * 100}%`,
              top: `${(targetToken.cell.row / map.gridRows) * 100}%`,
              width: `${100 / map.gridColumns}%`,
            }}
          >
            <span>ALVO</span>
          </div>
        ) : null}
      </div>
      {typeof document !== 'undefined'
        ? createPortal(
          <button
            aria-label="Fechar visualizacao da area"
            className="tabletop-combat-range__close"
            onClick={onClose}
            style={style}
            title="Fechar area"
            type="button"
          >
            x
          </button>,
          document.body,
        )
        : null}
    </>
  )
}
