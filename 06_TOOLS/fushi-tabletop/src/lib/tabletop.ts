import type {
  CharacterSheet,
  TabletopCell,
  TabletopGridSpan,
  TabletopData,
  TabletopMap,
  TabletopScene,
  TabletopToken,
  TabletopTokenSize,
  TabletopTokenSizePreset,
  Tone,
} from '../data/types'

export const DEFAULT_TABLETOP_ZOOM = 0.9
export const MIN_TABLETOP_ZOOM = 0.35
export const MAX_TABLETOP_ZOOM = 2.4
export const DEFAULT_TABLETOP_GRID_VISIBLE = true
export const DEFAULT_TABLETOP_GRID_CELL_SIZE = 104
export const MIN_TABLETOP_GRID_CELL_SIZE = 64
export const MAX_TABLETOP_GRID_CELL_SIZE = 176

export function getTabletopMaps(tabletop: TabletopData): TabletopMap[] {
  if (tabletop.maps.length > 0) {
    return tabletop.maps
  }

  if (tabletop.assetLibrary.maps.length > 0) {
    return tabletop.assetLibrary.maps
  }

  return [tabletop.map]
}

export function getTabletopScenes(tabletop: TabletopData): TabletopScene[] {
  if (tabletop.scenes.length > 0) {
    return tabletop.scenes
  }

  return [
    {
      id: tabletop.initialSceneId || 'scene-default',
      name: 'Cena atual',
      mapId: tabletop.map.id,
      tokens: tabletop.initialTokens,
      metadata: {
        musicTrackId: '',
        ambienceTrackId: '',
        lightingPresetId: '',
        weatherPresetId: '',
        uiThemePresetId: '',
        introCardId: '',
        cinematicId: '',
        cameraPresetId: '',
        notes: '',
      },
    },
  ]
}

export function clampTabletopCell(
  cell: TabletopCell,
  map: TabletopMap,
): TabletopCell {
  return {
    column: Math.max(0, Math.min(map.gridColumns - 1, cell.column)),
    row: Math.max(0, Math.min(map.gridRows - 1, cell.row)),
  }
}

export function normalizeTabletopTokenSize(size: number | undefined): TabletopTokenSize {
  if (size === 2 || size === 3) {
    return size
  }

  return 1
}

export function normalizeTabletopTokenCustomSize(
  value: unknown,
): TabletopGridSpan | undefined {
  const candidate =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null
  const columns = typeof candidate?.columns === 'number' ? candidate.columns : Number.NaN
  const rows = typeof candidate?.rows === 'number' ? candidate.rows : Number.NaN

  if (
    candidate &&
    Number.isInteger(columns) &&
    Number.isInteger(rows) &&
    columns > 0 &&
    rows > 0
  ) {
    return {
      columns,
      rows,
    }
  }

  return undefined
}

export function resolveTabletopTokenSpan(
  value:
    | TabletopTokenSize
    | TabletopGridSpan
    | Pick<TabletopToken, 'size' | 'customSize'>
    | undefined,
  customSize?: TabletopGridSpan,
): TabletopGridSpan & { preset: TabletopTokenSizePreset } {
  if (typeof value === 'object' && value) {
    if ('size' in value) {
      const normalizedCustomSize = normalizeTabletopTokenCustomSize(value.customSize)

      if (normalizedCustomSize) {
        return {
          ...normalizedCustomSize,
          preset: 'custom',
        }
      }

      const size = normalizeTabletopTokenSize(value.size)

      return {
        columns: size,
        rows: size,
        preset: size === 3 ? '3x3' : size === 2 ? '2x2' : '1x1',
      }
    }

    const directSpan = normalizeTabletopTokenCustomSize(value)

    if (directSpan) {
      return {
        ...directSpan,
        preset: 'custom',
      }
    }
  }

  const normalizedCustomSize = normalizeTabletopTokenCustomSize(customSize)

  if (normalizedCustomSize) {
    return {
      ...normalizedCustomSize,
      preset: 'custom',
    }
  }

  const size =
    typeof value === 'number' ? normalizeTabletopTokenSize(value) : 1

  return {
    columns: size,
    rows: size,
    preset: size === 3 ? '3x3' : size === 2 ? '2x2' : '1x1',
  }
}

export function clampTabletopGridCellSize(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_TABLETOP_GRID_CELL_SIZE
  }

  return Math.max(
    MIN_TABLETOP_GRID_CELL_SIZE,
    Math.min(MAX_TABLETOP_GRID_CELL_SIZE, Math.round(value)),
  )
}

export function getTabletopMapCellSize(
  map: TabletopMap,
  scene?: Pick<TabletopScene, 'gridCellSize'> | null,
) {
  if (typeof scene?.gridCellSize === 'number') {
    return clampTabletopGridCellSize(scene.gridCellSize)
  }

  if (typeof map.cellSize === 'number') {
    return clampTabletopGridCellSize(map.cellSize)
  }

  if (map.gridColumns > 0 && map.stageWidth > 0) {
    return clampTabletopGridCellSize(map.stageWidth / map.gridColumns)
  }

  return DEFAULT_TABLETOP_GRID_CELL_SIZE
}

export function getTabletopMapStageSize(
  map: TabletopMap,
  scene?: Pick<TabletopScene, 'gridCellSize'> | null,
) {
  const cellSize = getTabletopMapCellSize(map, scene)

  return {
    cellSize,
    stageWidth: map.gridColumns * cellSize,
    stageHeight: map.gridRows * cellSize,
  }
}

export function clampTabletopTokenCell(
  cell: TabletopCell,
  map: TabletopMap,
  size:
    | TabletopTokenSize
    | TabletopGridSpan
    | Pick<TabletopToken, 'size' | 'customSize'>,
  customSize?: TabletopGridSpan,
): TabletopCell {
  const span = resolveTabletopTokenSpan(size, customSize)

  return {
    column: Math.max(0, Math.min(map.gridColumns - span.columns, cell.column)),
    row: Math.max(0, Math.min(map.gridRows - span.rows, cell.row)),
  }
}

function buildTokenFootprint(
  cell: TabletopCell,
  span: TabletopGridSpan,
) {
  const footprint = new Set<string>()

  for (let rowOffset = 0; rowOffset < span.rows; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < span.columns; columnOffset += 1) {
      footprint.add(`${cell.column + columnOffset}:${cell.row + rowOffset}`)
    }
  }

  return footprint
}

export function findNextOpenCell(
  tokens: TabletopToken[],
  map: TabletopMap,
  size: TabletopTokenSize | Pick<TabletopToken, 'size' | 'customSize'> = 1,
  customSize?: TabletopGridSpan,
): TabletopCell {
  const requestedSpan = resolveTabletopTokenSpan(size, customSize)
  const occupied = new Set<string>()

  tokens.forEach((token) => {
    const span = resolveTabletopTokenSpan(token)

    buildTokenFootprint(clampTabletopTokenCell(token.cell, map, token), span).forEach(
      (key) => occupied.add(key),
    )
  })

  const centerColumn = Math.floor(map.gridColumns / 2)
  const centerRow = Math.floor(map.gridRows / 2)
  const maxRadius = Math.max(map.gridColumns, map.gridRows)

  for (let radius = 0; radius <= maxRadius; radius += 1) {
    for (let row = centerRow - radius; row <= centerRow + radius; row += 1) {
      for (
        let column = centerColumn - radius;
        column <= centerColumn + radius;
        column += 1
      ) {
        const nextCell = clampTabletopTokenCell(
          { column, row },
          map,
          requestedSpan,
        )
        const footprint = buildTokenFootprint(nextCell, requestedSpan)
        const isOccupied = [...footprint].some((key) => occupied.has(key))

        if (!isOccupied) {
          return nextCell
        }
      }
    }
  }

  return clampTabletopTokenCell(
    {
      column: centerColumn,
      row: centerRow,
    },
    map,
    requestedSpan,
  )
}

export function buildTokenLabel(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function getTokenColor(tone: Tone, kind: CharacterSheet['tipo']) {
  if (tone === 'critical') {
    return '#ca747a'
  }

  if (tone === 'watch') {
    return kind === 'player' ? '#d1b182' : '#c69a58'
  }

  return kind === 'player' ? '#92c0b6' : '#7caf88'
}
