import type {
  TabletopMap,
  TabletopMediaAsset,
  TabletopTransitionAsset,
} from '../data/types'

export type TabletopLibraryCategory = 'maps' | 'transitions' | 'music' | 'npcs'

export interface TabletopLibraryFolder {
  id: string
  category: TabletopLibraryCategory
  name: string
  parentId: string
  icon?: string
  sortOrder?: number
}

export interface TabletopLibraryItemFolders {
  maps: Record<string, string>
  transitions: Record<string, string>
  music: Record<string, string>
  npcs: Record<string, string>
}

export interface TabletopLibraryHiddenItems {
  maps: Record<string, true>
  transitions: Record<string, true>
  music: Record<string, true>
  npcs: Record<string, true>
}

export interface PersistedTabletopLibraryState {
  version: 1
  folders: TabletopLibraryFolder[]
  itemFolders: TabletopLibraryItemFolders
  hiddenItems: TabletopLibraryHiddenItems
  customMaps: TabletopMap[]
  customTransitions: TabletopTransitionAsset[]
  customMusicTracks: TabletopMediaAsset[]
  customAmbienceTracks: TabletopMediaAsset[]
  mapOverrides: Record<string, Partial<TabletopMap>>
  favoriteTrackIds: string[]
  trackVolumes: Record<string, number>
}

export const TABLETOP_LIBRARY_STORAGE_KEY = 'fushi-tabletop:asset-library:v1'
const DEFAULT_TABLETOP_LIBRARY_CAMPAIGN_ID = 'campaign-local-default'

function normalizeCampaignStorageId(campaignId?: string) {
  return campaignId?.trim() || DEFAULT_TABLETOP_LIBRARY_CAMPAIGN_ID
}

export function getPersistedTabletopLibraryStorageKey(campaignId?: string) {
  const normalizedCampaignId = normalizeCampaignStorageId(campaignId)

  return `${TABLETOP_LIBRARY_STORAGE_KEY}:campaign:${normalizedCampaignId}`
}

function shouldFallbackToLegacyStorage(campaignId?: string) {
  const normalizedCampaignId = normalizeCampaignStorageId(campaignId)

  return !campaignId || normalizedCampaignId === DEFAULT_TABLETOP_LIBRARY_CAMPAIGN_ID
}

export const EMPTY_TABLETOP_LIBRARY_STATE: PersistedTabletopLibraryState = {
  version: 1,
  folders: [],
  itemFolders: {
    maps: {},
    transitions: {},
    music: {},
    npcs: {},
  },
  hiddenItems: {
    maps: {},
    transitions: {},
    music: {},
    npcs: {},
  },
  customMaps: [],
  customTransitions: [],
  customMusicTracks: [],
  customAmbienceTracks: [],
  mapOverrides: {},
  favoriteTrackIds: [],
  trackVolumes: {},
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function readStorageItem(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorageItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return
  }
}

function normalizeFolder(value: unknown): TabletopLibraryFolder | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.parentId !== 'string' ||
    (value.category !== 'maps' &&
      value.category !== 'transitions' &&
      value.category !== 'music' &&
      value.category !== 'npcs')
  ) {
    return null
  }

  return {
    id: value.id,
    category: value.category,
    name: value.name,
    parentId: value.parentId,
    icon: typeof value.icon === 'string' ? value.icon : undefined,
    sortOrder: typeof value.sortOrder === 'number' ? value.sortOrder : undefined,
  }
}

function normalizeStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === 'string' && typeof entry[1] === 'string',
    ),
  )
}

function normalizeItemFolders(value: unknown): TabletopLibraryItemFolders {
  if (!isRecord(value)) {
    return cloneValue(EMPTY_TABLETOP_LIBRARY_STATE.itemFolders)
  }

  return {
    maps: normalizeStringRecord(value.maps),
    transitions: normalizeStringRecord(value.transitions),
    music: normalizeStringRecord(value.music),
    npcs: normalizeStringRecord(value.npcs),
  }
}

function normalizeBooleanRecord(value: unknown): Record<string, true> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, true] => entry[1] === true)
      .map(([key]) => [key, true]),
  )
}

function normalizeHiddenItems(value: unknown): TabletopLibraryHiddenItems {
  if (!isRecord(value)) {
    return cloneValue(EMPTY_TABLETOP_LIBRARY_STATE.hiddenItems)
  }

  return {
    maps: normalizeBooleanRecord(value.maps),
    transitions: normalizeBooleanRecord(value.transitions),
    music: normalizeBooleanRecord(value.music),
    npcs: normalizeBooleanRecord(value.npcs),
  }
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string')))
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] =>
        typeof entry[0] === 'string' && typeof entry[1] === 'number',
    ),
  )
}

function normalizeMaps(value: unknown): TabletopMap[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is TabletopMap => {
    if (!isRecord(item)) {
      return false
    }

    return (
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.image === 'string' &&
      typeof item.stageWidth === 'number' &&
      typeof item.stageHeight === 'number' &&
      typeof item.gridColumns === 'number' &&
      typeof item.gridRows === 'number'
    )
  })
}

function normalizeTransitions(value: unknown): TabletopTransitionAsset[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is TabletopTransitionAsset => {
    if (!isRecord(item)) {
      return false
    }

    return (
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.summary === 'string' &&
      typeof item.biomeId === 'string' &&
      (item.type === 'image' || item.type === 'video') &&
      typeof item.assetUrl === 'string' &&
      typeof item.description === 'string'
    )
  })
}

function normalizeMediaAssets(value: unknown): TabletopMediaAsset[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is TabletopMediaAsset => {
    if (!isRecord(item)) {
      return false
    }

    return (
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.summary === 'string' &&
      typeof item.source === 'string'
    )
  })
}

function normalizeMapOverrides(value: unknown): Record<string, Partial<TabletopMap>> {
  if (!isRecord(value)) {
    return {}
  }

  const entries: Array<[string, Partial<TabletopMap>]> = []

  Object.entries(value).forEach(([mapId, override]) => {
    if (!isRecord(override)) {
      return
    }

    const nextOverride: Partial<TabletopMap> = {}

    if (typeof override.name === 'string') {
      nextOverride.name = override.name
    }

    if (typeof override.image === 'string') {
      nextOverride.image = override.image
    }

    if (typeof override.imageUrl === 'string') {
      nextOverride.imageUrl = override.imageUrl
    }

    if (typeof override.previewImage === 'string') {
      nextOverride.previewImage = override.previewImage
    }

    if (typeof override.thumbnailUrl === 'string') {
      nextOverride.thumbnailUrl = override.thumbnailUrl
    }

    if (typeof override.summary === 'string') {
      nextOverride.summary = override.summary
    }

    if (typeof override.biomeId === 'string') {
      nextOverride.biomeId = override.biomeId
    }

    if (typeof override.biome === 'string') {
      nextOverride.biome = override.biome
    }

    if (typeof override.campaignId === 'string') {
      nextOverride.campaignId = override.campaignId
    }

    if (typeof override.folderId === 'string') {
      nextOverride.folderId = override.folderId
    }

    if (typeof override.munLocationId === 'string') {
      nextOverride.munLocationId = override.munLocationId
    }

    if (
      override.source === 'manual' ||
      override.source === 'mun_generated' ||
      override.source === 'imported'
    ) {
      nextOverride.source = override.source
    }

    if (
      override.type === 'livre' ||
      override.type === 'evento' ||
      override.type === 'base' ||
      override.type === 'extra' ||
      override.type === 'interior' ||
      override.type === 'dungeon'
    ) {
      nextOverride.type = override.type
    }

    if (
      override.mapVisibility === 'mestre_apenas' ||
      override.mapVisibility === 'preparado' ||
      override.mapVisibility === 'ativo_para_jogadores' ||
      override.mapVisibility === 'arquivado'
    ) {
      nextOverride.mapVisibility = override.mapVisibility
    }

    if (typeof override.stageWidth === 'number') {
      nextOverride.stageWidth = override.stageWidth
    }

    if (typeof override.stageHeight === 'number') {
      nextOverride.stageHeight = override.stageHeight
    }

    if (typeof override.gridColumns === 'number') {
      nextOverride.gridColumns = override.gridColumns
    }

    if (typeof override.gridRows === 'number') {
      nextOverride.gridRows = override.gridRows
    }

    if (typeof override.cellSize === 'number') {
      nextOverride.cellSize = override.cellSize
    }

    if (Object.keys(nextOverride).length > 0) {
      entries.push([mapId, nextOverride])
    }
  })

  return Object.fromEntries(entries)
}

export function createTabletopLibraryState(
  input?: Partial<PersistedTabletopLibraryState>,
): PersistedTabletopLibraryState {
  return {
    version: 1,
    folders: Array.isArray(input?.folders)
      ? input.folders.map(normalizeFolder).filter((folder): folder is TabletopLibraryFolder => folder !== null)
      : [],
    itemFolders: normalizeItemFolders(input?.itemFolders),
    hiddenItems: normalizeHiddenItems(input?.hiddenItems),
    customMaps: normalizeMaps(input?.customMaps),
    customTransitions: normalizeTransitions(input?.customTransitions),
    customMusicTracks: normalizeMediaAssets(input?.customMusicTracks),
    customAmbienceTracks: normalizeMediaAssets(input?.customAmbienceTracks),
    mapOverrides: normalizeMapOverrides(input?.mapOverrides),
    favoriteTrackIds: normalizeStringArray(input?.favoriteTrackIds),
    trackVolumes: normalizeNumberRecord(input?.trackVolumes),
  }
}

export function readPersistedTabletopLibraryState(
  campaignId?: string,
): PersistedTabletopLibraryState {
  const rawValue =
    readStorageItem(getPersistedTabletopLibraryStorageKey(campaignId)) ??
    (shouldFallbackToLegacyStorage(campaignId)
      ? readStorageItem(TABLETOP_LIBRARY_STORAGE_KEY)
      : null)

  if (!rawValue) {
    return cloneValue(EMPTY_TABLETOP_LIBRARY_STATE)
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown

    if (!isRecord(parsedValue) || parsedValue.version !== 1) {
      return cloneValue(EMPTY_TABLETOP_LIBRARY_STATE)
    }

    return createTabletopLibraryState(parsedValue)
  } catch {
    return cloneValue(EMPTY_TABLETOP_LIBRARY_STATE)
  }
}

export function writePersistedTabletopLibraryState(
  state: PersistedTabletopLibraryState,
  campaignId?: string,
) {
  writeStorageItem(
    getPersistedTabletopLibraryStorageKey(campaignId),
    JSON.stringify(createTabletopLibraryState(state)),
  )
}
