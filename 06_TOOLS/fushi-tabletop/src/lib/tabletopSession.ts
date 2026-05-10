import type {
  AppViewMode,
  RollRecord,
  TabletopCameraState,
  TabletopCell,
  TabletopSceneMetadata,
  TabletopScene,
  TokenControl,
  TabletopToken,
  TabletopTokenVisibility,
} from '../data/types'
import {
  clampTabletopGridCellSize,
  normalizeTabletopTokenSize,
  normalizeTabletopTokenCustomSize,
  DEFAULT_TABLETOP_GRID_VISIBLE,
  DEFAULT_TABLETOP_ZOOM,
  MAX_TABLETOP_ZOOM,
  MIN_TABLETOP_ZOOM,
} from './tabletop'
import { storageAdapter } from './storage/storageAdapter'

export const TABLETOP_SESSION_STORAGE_KEY = 'fushi-tabletop:mesa-session:v1'
export const TABLETOP_VIEW_STORAGE_KEY = 'fushi-tabletop:mesa-view:v1'
export const TABLETOP_TRANSITION_SYNC_STORAGE_KEY = 'tabletop_session_state'
export const TABLETOP_TRANSITION_OVERRIDES_STORAGE_KEY =
  'fushi-tabletop:transition-overrides:v1'
const DEFAULT_TABLETOP_SESSION_CAMPAIGN_ID = 'campaign-local-default'
const LEGACY_SCENE_ID = 'scene-legacy-current'
const LEGACY_SCENE_MAP_ID = 'legacy-map-current'

function normalizeCampaignStorageId(campaignId?: string) {
  return campaignId?.trim() || DEFAULT_TABLETOP_SESSION_CAMPAIGN_ID
}

export function getPersistedTabletopSessionStorageKey(campaignId?: string) {
  const normalizedCampaignId = normalizeCampaignStorageId(campaignId)

  return `${TABLETOP_SESSION_STORAGE_KEY}:campaign:${normalizedCampaignId}`
}

export function getPersistedTransitionOverridesStorageKey(campaignId?: string) {
  const normalizedCampaignId = normalizeCampaignStorageId(campaignId)

  return `${TABLETOP_TRANSITION_OVERRIDES_STORAGE_KEY}:campaign:${normalizedCampaignId}`
}

export interface TabletopPing {
  id: string
  cell: TabletopCell
  authorView: AppViewMode
  createdAt: number
}

export interface TabletopLogEntry {
  id: string
  type: 'message' | 'roll' | 'ping' | 'system'
  visibility: 'public' | 'gm'
  author: string
  text: string
  createdAt: string
  roll?: RollRecord
}

export interface PersistedTabletopSession {
  version: 11
  currentSceneId: string
  initialSceneId: string
  scenes: TabletopScene[]
  tokens: TabletopToken[] | null
  selectedTokenId: string
  selectedTokenIds: string[]
  removedCharacterIdsByScene: Record<string, string[]>
  gmCameraControlEnabled: boolean
  zoom: number
  isGridVisible: boolean
  logEntries: TabletopLogEntry[]
}

export interface PersistedViewPreferences {
  viewMode: AppViewMode
  playerCharacterId: string
}

export interface SharedTransitionPlaybackState {
  activeTransitionId: string | null
  startedAt: number
  paused: boolean
  currentTime: number
  mapTargetId: string | null
}

export interface PersistedTransitionOverride {
  assetUrl?: string
  thumbnailUrl?: string
  toMapId?: string
  type?: 'image' | 'video'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isValidCell(value: unknown): value is TabletopCell {
  return (
    isRecord(value) &&
    Number.isInteger(value.column) &&
    Number.isInteger(value.row)
  )
}

function normalizeTokenVisibility(value: unknown): TabletopTokenVisibility | null {
  if (value === 'public' || value === 'gm') {
    return value
  }

  if (typeof value === 'boolean') {
    return value ? 'public' : 'gm'
  }

  return null
}

function normalizeTokenControl(value: unknown): TokenControl | undefined {
  if (!isRecord(value) || !Array.isArray(value.controlledByPlayerIds)) {
    return undefined
  }

  return {
    controlledByPlayerIds: value.controlledByPlayerIds.filter(
      (playerId): playerId is string => typeof playerId === 'string',
    ),
    primaryControllerId:
      typeof value.primaryControllerId === 'string'
        ? value.primaryControllerId
        : undefined,
    sharedControl: value.sharedControl === true,
  }
}

function normalizeToken(value: unknown): TabletopToken | null {
  if (!isRecord(value)) {
    return null
  }

  const visibility = normalizeTokenVisibility(
    value.visibility ?? value.visibleInPlayerView,
  )

  if (
    typeof value.id !== 'string' ||
    typeof value.characterId !== 'string' ||
    typeof value.label !== 'string' ||
    typeof value.color !== 'string' ||
    !visibility ||
    !isValidCell(value.cell)
  ) {
    return null
  }

  return {
    id: value.id,
    characterId: value.characterId,
    label: value.label,
    color: value.color,
    cell: value.cell,
    size: normalizeTabletopTokenSize(
      typeof value.size === 'number' ? value.size : undefined,
    ),
    customSize: normalizeTabletopTokenCustomSize(value.customSize),
    visibility,
    control: normalizeTokenControl(value.control),
  }
}

function normalizeCameraState(value: unknown): TabletopCameraState | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const nextCameraState: TabletopCameraState = {}

  if (typeof value.zoom === 'number' && !Number.isNaN(value.zoom)) {
    nextCameraState.zoom = sanitizeZoom(value.zoom)
  }

  if (typeof value.scrollLeft === 'number' && !Number.isNaN(value.scrollLeft)) {
    nextCameraState.scrollLeft = value.scrollLeft
  }

  if (typeof value.scrollTop === 'number' && !Number.isNaN(value.scrollTop)) {
    nextCameraState.scrollTop = value.scrollTop
  }

  return Object.keys(nextCameraState).length > 0 ? nextCameraState : undefined
}

function normalizeSceneMetadata(value: unknown): TabletopSceneMetadata {
  if (!isRecord(value)) {
    return {
      musicTrackId: '',
      ambienceTrackId: '',
      lightingPresetId: '',
      weatherPresetId: '',
      uiThemePresetId: '',
      introCardId: '',
      cinematicId: '',
      cameraPresetId: '',
      notes: '',
    }
  }

  return {
    musicTrackId: typeof value.musicTrackId === 'string' ? value.musicTrackId : '',
    ambienceTrackId:
      typeof value.ambienceTrackId === 'string' ? value.ambienceTrackId : '',
    lightingPresetId:
      typeof value.lightingPresetId === 'string' ? value.lightingPresetId : '',
    weatherPresetId:
      typeof value.weatherPresetId === 'string' ? value.weatherPresetId : '',
    uiThemePresetId:
      typeof value.uiThemePresetId === 'string' ? value.uiThemePresetId : '',
    introCardId: typeof value.introCardId === 'string' ? value.introCardId : '',
    cinematicId: typeof value.cinematicId === 'string' ? value.cinematicId : '',
    cameraPresetId:
      typeof value.cameraPresetId === 'string' ? value.cameraPresetId : '',
    notes: typeof value.notes === 'string' ? value.notes : '',
  }
}

function normalizeScene(value: unknown): TabletopScene | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.mapId !== 'string' ||
    !Array.isArray(value.tokens)
  ) {
    return null
  }

  const tokens = value.tokens
    .map((token) => normalizeToken(token))
    .filter((token): token is TabletopToken => token !== null)

  if (tokens.length !== value.tokens.length) {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    mapId: value.mapId,
    tokens,
    gridCellSize:
      typeof value.gridCellSize === 'number'
        ? clampTabletopGridCellSize(value.gridCellSize)
        : undefined,
    cameraState: normalizeCameraState(value.cameraState),
    metadata: normalizeSceneMetadata(value.metadata),
  }
}

function createLegacyScene(tokens: TabletopToken[] | null) {
  return {
    id: LEGACY_SCENE_ID,
    name: 'Cena atual',
    mapId: LEGACY_SCENE_MAP_ID,
    tokens: tokens ?? [],
    metadata: normalizeSceneMetadata(null),
  } satisfies TabletopScene
}

function normalizeScenes(input: {
  scenes?: TabletopScene[]
  currentSceneId?: string
  initialSceneId?: string
  tokens?: TabletopToken[] | null
}) {
  const nextScenes =
    Array.isArray(input.scenes) && input.scenes.length > 0
      ? input.scenes.map((scene) => ({
          ...scene,
          tokens: scene.tokens.map((token) => ({ ...token })),
          metadata: normalizeSceneMetadata(scene.metadata),
        }))
      : [createLegacyScene(input.tokens ?? null)]

  const currentSceneId = nextScenes.some((scene) => scene.id === input.currentSceneId)
    ? input.currentSceneId ?? nextScenes[0].id
    : nextScenes[0].id
  const initialSceneId = nextScenes.some((scene) => scene.id === input.initialSceneId)
    ? input.initialSceneId ?? nextScenes[0].id
    : nextScenes[0].id
  const currentScene =
    nextScenes.find((scene) => scene.id === currentSceneId) ?? nextScenes[0]

  return {
    scenes: nextScenes,
    currentSceneId,
    initialSceneId,
    currentTokens: currentScene?.tokens ?? [],
  }
}

function isValidRollRecord(value: unknown): value is RollRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.contexto === 'string' &&
    Array.isArray(value.resultados) &&
    value.resultados.every((result) => typeof result === 'number') &&
    typeof value.bonus === 'number' &&
    typeof value.modo === 'string' &&
    typeof value.resultadoBase === 'number' &&
    typeof value.total === 'number' &&
    typeof value.resultadoTexto === 'string' &&
    typeof value.quantidadeDados === 'number' &&
    typeof value.tipoDado === 'number'
  )
}

function isValidLogEntry(value: unknown): value is TabletopLogEntry {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    (value.type === 'message' ||
      value.type === 'roll' ||
      value.type === 'ping' ||
      value.type === 'system') &&
    (value.visibility === 'public' || value.visibility === 'gm') &&
    typeof value.author === 'string' &&
    typeof value.text === 'string' &&
    typeof value.createdAt === 'string' &&
    (value.roll === undefined || isValidRollRecord(value.roll))
  )
}

function sanitizeZoom(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_TABLETOP_ZOOM
  }

  return Math.max(MIN_TABLETOP_ZOOM, Math.min(MAX_TABLETOP_ZOOM, value))
}

function normalizeSharedTransitionPlaybackState(
  value: unknown,
): SharedTransitionPlaybackState | null {
  if (!isRecord(value)) {
    return null
  }

  const activeTransitionId =
    typeof value.activeTransitionId === 'string' ? value.activeTransitionId : null
  const mapTargetId =
    typeof value.mapTargetId === 'string' ? value.mapTargetId : null
  const startedAt =
    typeof value.startedAt === 'number' && Number.isFinite(value.startedAt)
      ? value.startedAt
      : 0
  const currentTime =
    typeof value.currentTime === 'number' && Number.isFinite(value.currentTime)
      ? value.currentTime
      : 0

  return {
    activeTransitionId,
    startedAt,
    paused: value.paused === true,
    currentTime: Math.max(0, currentTime),
    mapTargetId,
  }
}

function normalizeTransitionOverrides(
  value: unknown,
): Record<string, PersistedTransitionOverride> {
  if (!isRecord(value)) {
    return {}
  }

  const nextEntries: Array<[string, PersistedTransitionOverride]> = []

  Object.entries(value).forEach(([transitionId, overrideValue]) => {
    if (!isRecord(overrideValue)) {
      return
    }

    const nextOverride: PersistedTransitionOverride = {}

    if (
      typeof overrideValue.assetUrl === 'string' &&
      overrideValue.assetUrl.length > 0
    ) {
      nextOverride.assetUrl = overrideValue.assetUrl
    }

    if (
      typeof overrideValue.thumbnailUrl === 'string' &&
      overrideValue.thumbnailUrl.length > 0
    ) {
      nextOverride.thumbnailUrl = overrideValue.thumbnailUrl
    }

    if (
      typeof overrideValue.toMapId === 'string' &&
      overrideValue.toMapId.length > 0
    ) {
      nextOverride.toMapId = overrideValue.toMapId
    }

    if (overrideValue.type === 'image' || overrideValue.type === 'video') {
      nextOverride.type = overrideValue.type
    }

    if (Object.keys(nextOverride).length === 0) {
      return
    }

    nextEntries.push([transitionId, nextOverride])
  })

  return Object.fromEntries(nextEntries)
}

function normalizeRemovedCharacterIdsByScene(
  value: unknown,
): Record<string, string[]> {
  if (!isRecord(value)) {
    return {}
  }

  const normalizedEntries: Array<[string, string[]]> = []

  Object.entries(value).forEach(([sceneId, characterIds]) => {
    if (!Array.isArray(characterIds)) {
      return
    }

    const nextCharacterIds = Array.from(
      new Set(
        characterIds.filter(
          (characterId: unknown): characterId is string =>
            typeof characterId === 'string' && characterId.length > 0,
        ),
      ),
    )

    if (nextCharacterIds.length === 0) {
      return
    }

    normalizedEntries.push([sceneId, nextCharacterIds])
  })

  return Object.fromEntries(normalizedEntries)
}

export function createPersistedTabletopSession(input?: {
  currentSceneId?: string
  initialSceneId?: string
  scenes?: TabletopScene[]
  tokens?: TabletopToken[] | null
  selectedTokenId?: string
  selectedTokenIds?: string[]
  removedCharacterIdsByScene?: Record<string, string[]>
  gmCameraControlEnabled?: boolean
  zoom?: number
  isGridVisible?: boolean
  logEntries?: TabletopLogEntry[]
}): PersistedTabletopSession {
  const normalizedScenes = normalizeScenes({
    scenes: input?.scenes,
    currentSceneId: input?.currentSceneId,
    initialSceneId: input?.initialSceneId,
    tokens: input?.tokens ?? null,
  })
  const selectedTokenIds = Array.isArray(input?.selectedTokenIds)
    ? input.selectedTokenIds.filter((value): value is string => typeof value === 'string')
    : typeof input?.selectedTokenId === 'string' && input.selectedTokenId
      ? [input.selectedTokenId]
      : []

  return {
    version: 11,
    currentSceneId: normalizedScenes.currentSceneId,
    initialSceneId: normalizedScenes.initialSceneId,
    scenes: normalizedScenes.scenes,
    tokens: normalizedScenes.currentTokens,
    selectedTokenId:
      selectedTokenIds[selectedTokenIds.length - 1] ?? input?.selectedTokenId ?? '',
    selectedTokenIds,
    removedCharacterIdsByScene: normalizeRemovedCharacterIdsByScene(
      input?.removedCharacterIdsByScene,
    ),
    gmCameraControlEnabled: input?.gmCameraControlEnabled === true,
    zoom: sanitizeZoom(input?.zoom),
    isGridVisible:
      typeof input?.isGridVisible === 'boolean'
        ? input.isGridVisible
        : DEFAULT_TABLETOP_GRID_VISIBLE,
    logEntries: Array.isArray(input?.logEntries) ? input.logEntries : [],
  }
}

export function readPersistedTabletopSession(
  campaignId?: string,
): PersistedTabletopSession | null {
  const parsedValue = storageAdapter.loadCampaignSession(campaignId)

  if (!isRecord(parsedValue)) {
    return null
  }

  if (
    parsedValue.version !== 11 &&
    parsedValue.version !== 10 &&
    parsedValue.version !== 9 &&
    parsedValue.version !== 1 &&
    parsedValue.version !== 2 &&
    parsedValue.version !== 3 &&
    parsedValue.version !== 4 &&
    parsedValue.version !== 5 &&
    parsedValue.version !== 6 &&
    parsedValue.version !== 7 &&
    parsedValue.version !== 8
  ) {
    return null
  }

  const legacyTokens = Array.isArray(parsedValue.tokens)
    ? parsedValue.tokens
        .map((token) => normalizeToken(token))
        .filter((token): token is TabletopToken => token !== null)
    : null
  const scenes = Array.isArray(parsedValue.scenes)
    ? parsedValue.scenes
        .map((scene) => normalizeScene(scene))
        .filter((scene): scene is TabletopScene => scene !== null)
    : []
  const selectedTokenIds = Array.isArray(parsedValue.selectedTokenIds)
    ? parsedValue.selectedTokenIds.filter(
        (value): value is string => typeof value === 'string',
      )
    : []
  const logEntries =
    Array.isArray(parsedValue.logEntries) && parsedValue.logEntries.every(isValidLogEntry)
      ? parsedValue.logEntries
      : []

  return createPersistedTabletopSession({
    currentSceneId:
      typeof parsedValue.currentSceneId === 'string'
        ? parsedValue.currentSceneId
        : undefined,
    initialSceneId:
      typeof parsedValue.initialSceneId === 'string'
        ? parsedValue.initialSceneId
        : undefined,
    scenes: scenes.length > 0 ? scenes : undefined,
    tokens: legacyTokens,
    selectedTokenId:
      typeof parsedValue.selectedTokenId === 'string'
        ? parsedValue.selectedTokenId
        : '',
    selectedTokenIds,
    removedCharacterIdsByScene: normalizeRemovedCharacterIdsByScene(
      parsedValue.removedCharacterIdsByScene,
    ),
    gmCameraControlEnabled: parsedValue.gmCameraControlEnabled === true,
    zoom: typeof parsedValue.zoom === 'number' ? parsedValue.zoom : undefined,
    isGridVisible:
      typeof parsedValue.isGridVisible === 'boolean'
        ? parsedValue.isGridVisible
        : DEFAULT_TABLETOP_GRID_VISIBLE,
    logEntries,
  })
}

export function writePersistedTabletopSession(
  session: PersistedTabletopSession,
  campaignId?: string,
) {
  storageAdapter.saveCampaignSession(campaignId, session)
}

export function clearPersistedTabletopSession(campaignId?: string) {
  storageAdapter.clearCampaignSession(campaignId)
}

export function readSharedTransitionPlaybackState(): SharedTransitionPlaybackState | null {
  return normalizeSharedTransitionPlaybackState(
    storageAdapter.loadTransitionPlaybackState(),
  )
}

export function writeSharedTransitionPlaybackState(
  state: SharedTransitionPlaybackState,
) {
  storageAdapter.saveTransitionPlaybackState(state)
}

export function clearSharedTransitionPlaybackState() {
  storageAdapter.saveTransitionPlaybackState({
      activeTransitionId: null,
      startedAt: 0,
      paused: false,
      currentTime: 0,
      mapTargetId: null,
    } satisfies SharedTransitionPlaybackState)
}

export function readPersistedTransitionOverrides(campaignId?: string) {
  return normalizeTransitionOverrides(
    storageAdapter.loadTransitionOverrides(campaignId),
  )
}

export function writePersistedTransitionOverrides(
  overrides: Record<string, PersistedTransitionOverride>,
  campaignId?: string,
) {
  storageAdapter.saveTransitionOverrides(campaignId, overrides)
}

export function readPersistedViewPreferences(): PersistedViewPreferences {
  const parsedValue = storageAdapter.loadViewPreferences()

  if (!isRecord(parsedValue)) {
    return {
      viewMode: 'player',
      playerCharacterId: '',
    }
  }

  return {
    viewMode: parsedValue.viewMode === 'player' ? 'player' : 'gm',
    playerCharacterId:
      typeof parsedValue.playerCharacterId === 'string'
        ? parsedValue.playerCharacterId
        : '',
  }
}

export function writePersistedViewPreferences(
  preferences: PersistedViewPreferences,
) {
  storageAdapter.saveViewPreferences(preferences)
}

export function clearPersistedViewPreferences() {
  storageAdapter.clearViewPreferences()
}
