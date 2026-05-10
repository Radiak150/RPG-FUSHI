import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { TabletopCinematicsLibrary } from '../components/tabletop/TabletopCinematicsLibrary'
import { TabletopCinematicOverlay } from '../components/tabletop/TabletopCinematicOverlay'
import {
  MapConfigurationModal,
  type MapConfigurationFolderOption,
  type MapConfigurationSaveData,
} from '../components/tabletop/MapConfigurationModal'
import { TabletopMapLibrary } from '../components/tabletop/TabletopMapLibrary'
import { TabletopAccessPanel } from '../components/tabletop/TabletopAccessPanel'
import {
  TabletopMusicLibrary,
  type TabletopMixerTrackState,
  type TabletopMusicCreateInput,
  type TabletopMusicLibraryItem,
} from '../components/tabletop/TabletopMusicLibrary'
import { TabletopNpcLibrary } from '../components/tabletop/TabletopNpcLibrary'
import { TabletopNotesPanel } from '../components/tabletop/TabletopNotesPanel'
import { SceneIntroCard } from '../components/tabletop/SceneIntroCard'
import { TabletopAudioPanel } from '../components/tabletop/TabletopAudioPanel'
import { TabletopBoard } from '../components/tabletop/TabletopBoard'
import { TabletopHelpPanel } from '../components/tabletop/TabletopHelpPanel'
import { TabletopHud } from '../components/tabletop/TabletopHud'
import { TabletopHudPanel } from '../components/tabletop/TabletopHudPanel'
import { TabletopSessionLog } from '../components/tabletop/TabletopSessionLog'
import { TabletopTransitionOverlay } from '../components/tabletop/TabletopTransitionOverlay'
import { TransitionConfigurationModal } from '../components/tabletop/TransitionConfigurationModal'
import { TabletopWeatherOverlay } from '../components/tabletop/TabletopWeatherOverlay'
import {
  TabletopWorldMundiPanel,
  type WorldMundiMapPlaceholderRequest,
} from '../components/tabletop/TabletopWorldMundiPanel'
import { TokenInspector } from '../components/tabletop/TokenInspector'
import { FloatingWindow } from '../components/ui/FloatingWindow'
import type {
  CharacterSheet,
  TabletopOriginalConsciousnessState,
  TabletopAssetLibrary,
  TabletopMediaAsset,
  TabletopMap,
  TabletopScene,
  TabletopToken,
  TabletopTokenSize,
  TabletopTokenSizePreset,
} from '../data/types'
import { useMasterData } from '../hooks/useMasterData'
import { useViewMode } from '../hooks/useViewMode'
import { normalizeCharacterSheet } from '../lib/characterSheet'
import type { FushiAccessProfile, FushiAccessProfileId } from '../lib/playerAccess'
import {
  getCharacterById,
  getPlayerCharacters,
} from '../lib/selectors'
import {
  buildTokenLabel,
  clampTabletopGridCellSize,
  clampTabletopCell,
  clampTabletopTokenCell,
  DEFAULT_TABLETOP_GRID_CELL_SIZE,
  DEFAULT_TABLETOP_GRID_VISIBLE,
  DEFAULT_TABLETOP_ZOOM,
  findNextOpenCell,
  getTabletopMapCellSize,
  getTokenColor,
  getTabletopMaps,
  getTabletopScenes,
  MAX_TABLETOP_GRID_CELL_SIZE,
  MAX_TABLETOP_ZOOM,
  MIN_TABLETOP_GRID_CELL_SIZE,
  MIN_TABLETOP_ZOOM,
  resolveTabletopTokenSpan,
} from '../lib/tabletop'
import {
  createTabletopLibraryState,
  getPersistedTabletopLibraryStorageKey,
  readPersistedTabletopLibraryState,
  type PersistedTabletopLibraryState,
  type TabletopLibraryCategory,
  writePersistedTabletopLibraryState,
} from '../lib/tabletopLibraryState'
import {
  createTabletopAudioElement,
  sanitizeAudioVolume,
  stopAudioElement,
  syncTabletopAudioChannel,
  type TabletopAudioTransportState,
} from '../lib/tabletopAudio'
import {
  getSceneCameraTarget,
  getSceneCameraZoom,
  resolveTabletopSceneRuntime,
} from '../lib/tabletopRuntime'
import {
  clearPersistedTabletopSession,
  clearSharedTransitionPlaybackState,
  createPersistedTabletopSession,
  getPersistedTabletopSessionStorageKey,
  getPersistedTransitionOverridesStorageKey,
  readPersistedTabletopSession,
  readPersistedTransitionOverrides,
  readSharedTransitionPlaybackState,
  TABLETOP_SESSION_STORAGE_KEY,
  TABLETOP_TRANSITION_OVERRIDES_STORAGE_KEY,
  TABLETOP_TRANSITION_SYNC_STORAGE_KEY,
  type PersistedTransitionOverride,
  type SharedTransitionPlaybackState,
  type TabletopLogEntry,
  type TabletopPing,
  writePersistedTransitionOverrides,
  writeSharedTransitionPlaybackState,
  writePersistedTabletopSession,
} from '../lib/tabletopSession'
import {
  createWorldMundiBody,
  createWorldMundiConsciousness,
  createWorldMundiLogEntry,
  createWorldMundiNpcState,
  createWorldMundiParty,
  createWorldMundiPlayer,
  createWorldMundiState,
  getPersistedWorldMundiStorageKey,
  readPersistedWorldMundiState,
  TABLETOP_WORLD_MUNDI_STORAGE_KEY,
  type WorldMundiBody,
  writePersistedWorldMundiState,
} from '../lib/worldMundiState'

type HudPanelId =
  | 'npcs'
  | 'maps'
  | 'music'
  | 'world'
  | 'cinematics'
  | 'book'
  | 'settings'

type UtilityWindowId = 'audio' | 'log' | 'notes' | 'access' | 'help' | null

const TABLETOP_NOTES_STORAGE_KEY = 'fushi-tabletop:personal-notes:v1'
const TABLETOP_IDENTITY_RESOURCES_STORAGE_KEY =
  'fushi-tabletop:identity-resources:v1'

type IdentityResourceProfileId = Exclude<FushiAccessProfileId, 'gm'>

interface IdentityResourcePool {
  atributos?: CharacterSheet['atributos']
  determinacaoAtual: number
  determinacaoMaxima: number
  fushiAtual: number
  fushiMaximo: number
  jogador?: string
  pericias?: CharacterSheet['pericias']
}

type IdentityResourceState = Record<
  string,
  Partial<Record<IdentityResourceProfileId, IdentityResourcePool>>
>

function readPersistedTabletopNotes(): Record<string, string> {
  try {
    const rawValue = window.localStorage.getItem(TABLETOP_NOTES_STORAGE_KEY)

    if (!rawValue) {
      return {}
    }

    const parsedValue = JSON.parse(rawValue) as unknown

    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsedValue).filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === 'string' && typeof entry[1] === 'string',
      ),
    )
  } catch {
    return {}
  }
}

function writePersistedTabletopNotes(notes: Record<string, string>) {
  try {
    window.localStorage.setItem(TABLETOP_NOTES_STORAGE_KEY, JSON.stringify(notes))
  } catch {
    return
  }
}

function isIdentityResourceProfileId(value: string): value is IdentityResourceProfileId {
  return (
    value === 'player1' ||
    value === 'player2' ||
    value === 'player3' ||
    value === 'player4' ||
    value === 'player5'
  )
}

function normalizeIdentityResourcePool(value: unknown): IdentityResourcePool | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Partial<Record<keyof IdentityResourcePool, unknown>>
  const normalizedJogador =
    typeof record.jogador === 'string' ? record.jogador : undefined
  const atributos =
    record.atributos &&
    typeof record.atributos === 'object' &&
    !Array.isArray(record.atributos)
      ? (record.atributos as Partial<CharacterSheet['atributos']>)
      : null
  const normalizedAtributos =
    atributos &&
    typeof atributos.forca === 'number' &&
    typeof atributos.agilidade === 'number' &&
    typeof atributos.intelecto === 'number' &&
    typeof atributos.presenca === 'number' &&
    typeof atributos.vigor === 'number'
      ? {
          agilidade: Math.max(0, Math.round(atributos.agilidade)),
          forca: Math.max(0, Math.round(atributos.forca)),
          intelecto: Math.max(0, Math.round(atributos.intelecto)),
          presenca: Math.max(0, Math.round(atributos.presenca)),
          vigor: Math.max(0, Math.round(atributos.vigor)),
        }
      : undefined
  const normalizedPericias = Array.isArray(record.pericias)
    ? record.pericias
        .map((skill) => {
          if (!skill || typeof skill !== 'object' || Array.isArray(skill)) {
            return null
          }

          const skillRecord = skill as Partial<CharacterSheet['pericias'][number]>
          const atributoBase = skillRecord.atributoBase

          if (
            typeof skillRecord.id !== 'string' ||
            typeof skillRecord.nome !== 'string' ||
            typeof skillRecord.bonusPericia !== 'number' ||
            typeof skillRecord.resumo !== 'string' ||
            (atributoBase !== 'forca' &&
              atributoBase !== 'agilidade' &&
              atributoBase !== 'intelecto' &&
              atributoBase !== 'presenca' &&
              atributoBase !== 'vigor')
          ) {
            return null
          }

          return {
            atributoBase,
            bonusPericia: Math.round(skillRecord.bonusPericia),
            id: skillRecord.id,
            nome: skillRecord.nome,
            resumo: skillRecord.resumo,
          }
        })
        .filter((skill): skill is CharacterSheet['pericias'][number] => Boolean(skill))
    : undefined

  if (
    typeof record.fushiAtual !== 'number' ||
    typeof record.fushiMaximo !== 'number' ||
    typeof record.determinacaoAtual !== 'number' ||
    typeof record.determinacaoMaxima !== 'number'
  ) {
    return null
  }

  return {
    atributos: normalizedAtributos,
    determinacaoAtual: Math.max(0, Math.round(record.determinacaoAtual)),
    determinacaoMaxima: Math.max(0, Math.round(record.determinacaoMaxima)),
    fushiAtual: Math.max(0, Math.round(record.fushiAtual)),
    fushiMaximo: Math.max(0, Math.round(record.fushiMaximo)),
    jogador: normalizedJogador,
    pericias: normalizedPericias,
  }
}

function readPersistedIdentityResources(): IdentityResourceState {
  try {
    const rawValue = window.localStorage.getItem(TABLETOP_IDENTITY_RESOURCES_STORAGE_KEY)

    if (!rawValue) {
      return {}
    }

    const parsedValue = JSON.parse(rawValue) as unknown

    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
      return {}
    }

    const nextState: IdentityResourceState = {}

    Object.entries(parsedValue as Record<string, unknown>).forEach(
      ([bodyKey, profileEntries]) => {
        if (
          !profileEntries ||
          typeof profileEntries !== 'object' ||
          Array.isArray(profileEntries)
        ) {
          return
        }

        Object.entries(profileEntries as Record<string, unknown>).forEach(
          ([profileId, poolValue]) => {
            if (!isIdentityResourceProfileId(profileId)) {
              return
            }

            const pool = normalizeIdentityResourcePool(poolValue)

            if (!pool) {
              return
            }

            nextState[bodyKey] = {
              ...nextState[bodyKey],
              [profileId]: pool,
            }
          },
        )
      },
    )

    return nextState
  } catch {
    return {}
  }
}

function writePersistedIdentityResources(resources: IdentityResourceState) {
  try {
    window.localStorage.setItem(
      TABLETOP_IDENTITY_RESOURCES_STORAGE_KEY,
      JSON.stringify(resources),
    )
  } catch {
    return
  }
}

function getIdentityResourcePool(character: CharacterSheet): IdentityResourcePool {
  return {
    atributos: { ...character.atributos },
    determinacaoAtual: character.recursos.determinacaoAtual,
    determinacaoMaxima: character.recursos.determinacaoMaxima,
    fushiAtual: character.recursos.fushiAtual,
    fushiMaximo: character.recursos.fushiMaximo,
    jogador: character.jogador,
    pericias: character.pericias.map((skill) => ({ ...skill })),
  }
}

function applyIdentityResourcePool(
  character: CharacterSheet,
  pool: IdentityResourcePool | null,
) {
  if (!pool) {
    return character
  }

  return {
    ...character,
    atributos: pool.atributos ? { ...pool.atributos } : character.atributos,
    jogador: pool.jogador ?? character.jogador,
    pericias: pool.pericias ? pool.pericias.map((skill) => ({ ...skill })) : character.pericias,
    recursos: {
      ...character.recursos,
      determinacaoAtual: pool.determinacaoAtual,
      determinacaoMaxima: pool.determinacaoMaxima,
      fushiAtual: pool.fushiAtual,
      fushiMaximo: pool.fushiMaximo,
    },
  }
}

function centerScrollableViewport(viewport: HTMLDivElement | null) {
  if (!viewport) {
    return
  }

  viewport.scrollTo({
    left: Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2),
    top: Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 2),
    behavior: 'smooth',
  })
}

function buildSceneId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `scene-${crypto.randomUUID()}`
  }

  return `scene-${Date.now()}`
}

function buildLibraryItemId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function removeRecordKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).filter(([entryKey]) => entryKey !== key),
  ) as Record<string, T>
}

function buildTabletopTokenId(characterId: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `token-${characterId}-${crypto.randomUUID()}`
  }

  return `token-${characterId}-${Date.now()}`
}

function buildRuntimeEventId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function getRuntimeTimestamp() {
  return Date.now()
}

function playRollNotification() {
  try {
    const AudioContextConstructor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioContextConstructor) {
      return
    }

    const audioContext = new AudioContextConstructor()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime)
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2)

    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.22)

    window.setTimeout(() => {
      void audioContext.close().catch(() => undefined)
    }, 260)
  } catch {
    return
  }
}

function createEmptySceneMetadata(): TabletopScene['metadata'] {
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

function resolveMapById(maps: TabletopMap[], fallbackMap: TabletopMap, mapId: string) {
  return maps.find((map) => map.id === mapId) ?? fallbackMap
}

interface TabletopIntroOverlayState {
  introCardId: string
  sceneId: string
  triggerId: number
}

interface TabletopCinematicOverlayState {
  cinematicId: string
  triggerId: number
}

interface TabletopTransitionOverlayState {
  transitionId: string
  triggerId: number
}

interface TabletopImagePreviewState {
  id: string
  src: string
  label: string
  createdAt: number
}

const TABLETOP_IMAGE_PREVIEW_STORAGE_KEY = 'fushi-tabletop:image-preview:v1'
const EMPTY_TABLETOP_LOG_ENTRIES: TabletopLogEntry[] = []

function readSharedImagePreviewState(): TabletopImagePreviewState | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawValue = window.localStorage.getItem(TABLETOP_IMAGE_PREVIEW_STORAGE_KEY)

    if (!rawValue) {
      return null
    }

    const parsedValue = JSON.parse(rawValue) as Partial<TabletopImagePreviewState> | null

    if (!parsedValue || typeof parsedValue !== 'object') {
      return null
    }

    if (
      typeof parsedValue.id !== 'string' ||
      typeof parsedValue.src !== 'string' ||
      typeof parsedValue.label !== 'string' ||
      typeof parsedValue.createdAt !== 'number'
    ) {
      return null
    }

    return {
      id: parsedValue.id,
      src: parsedValue.src,
      label: parsedValue.label,
      createdAt: parsedValue.createdAt,
    }
  } catch {
    return null
  }
}

function writeSharedImagePreviewState(state: TabletopImagePreviewState) {
  try {
    window.localStorage.setItem(TABLETOP_IMAGE_PREVIEW_STORAGE_KEY, JSON.stringify(state))
  } catch {
    return
  }
}

function clearSharedImagePreviewState() {
  try {
    window.localStorage.removeItem(TABLETOP_IMAGE_PREVIEW_STORAGE_KEY)
  } catch {
    return
  }
}

function addRemovedCharacterToScene(
  removedCharacterIdsByScene: Record<string, string[]>,
  sceneId: string,
  characterId: string,
) {
  const currentIds = removedCharacterIdsByScene[sceneId] ?? []

  if (currentIds.includes(characterId)) {
    return removedCharacterIdsByScene
  }

  return {
    ...removedCharacterIdsByScene,
    [sceneId]: [...currentIds, characterId],
  }
}

function removeRemovedCharacterFromScene(
  removedCharacterIdsByScene: Record<string, string[]>,
  sceneId: string,
  characterId: string,
) {
  const currentIds = removedCharacterIdsByScene[sceneId] ?? []

  if (!currentIds.includes(characterId)) {
    return removedCharacterIdsByScene
  }

  const nextIds = currentIds.filter((currentCharacterId) => currentCharacterId !== characterId)

  if (nextIds.length === 0) {
    const nextRemovedCharacterIdsByScene = { ...removedCharacterIdsByScene }

    delete nextRemovedCharacterIdsByScene[sceneId]

    return nextRemovedCharacterIdsByScene
  }

  return {
    ...removedCharacterIdsByScene,
    [sceneId]: nextIds,
  }
}

function createTokenForCharacter(input: {
  character: CharacterSheet
  existingTokens: TabletopToken[]
  map: TabletopMap
}): TabletopToken {
  const { character, existingTokens, map } = input
  const size: TabletopTokenSize =
    character.tokenSize === 2 || character.tokenSize === 3
      ? character.tokenSize
      : 1

  return {
    id: buildTabletopTokenId(character.id),
    characterId: character.id,
    label: buildTokenLabel(character.nome),
    color: getTokenColor(character.tone, character.tipo),
    cell: findNextOpenCell(existingTokens, map, size),
    size,
    visibility: character.tipo === 'player' ? 'public' : 'gm',
    control: character.permissions?.tokenControl
      ? {
          ...character.permissions.tokenControl,
          controlledByPlayerIds: [
            ...character.permissions.tokenControl.controlledByPlayerIds,
          ],
        }
      : undefined,
  }
}

function getMapVisualPreset(input: {
  map: TabletopMap
  biomes?: Array<{
    id: string
    themePresetId: string
    weatherPresetId: string
  }>
}) {
  const biome = input.biomes?.find((item) => item.id === input.map.biomeId) ?? null
  const lightingPresetId =
    input.map.type === 'interior' || input.map.type === 'dungeon'
      ? 'lighting-cave'
      : input.map.type === 'evento'
        ? 'lighting-warm'
        : 'lighting-neutral'
  const cameraPresetId =
    input.map.type === 'livre' || input.map.type === 'base'
      ? 'camera-wide'
      : input.map.type === 'evento'
        ? 'camera-close'
        : 'camera-default'

  return {
    lightingPresetId,
    weatherPresetId: biome?.weatherPresetId ?? 'weather-none',
    uiThemePresetId: biome?.themePresetId ?? 'ui-fushi-default',
    cameraPresetId,
  }
}

function getPlayerProfileId(profile: FushiAccessProfile | null) {
  return profile?.role === 'player' ? profile.id : ''
}

function getIdentityProfileId(profile: FushiAccessProfile | null) {
  return profile?.role === 'player' && isIdentityResourceProfileId(profile.id)
    ? profile.id
    : ''
}

function getPlayerProfileIndex(profileId: string) {
  const match = /^player(\d+)$/.exec(profileId)

  if (!match) {
    return -1
  }

  return Number(match[1]) - 1
}

function getSharedBodyHostId(character: CharacterSheet | null | undefined) {
  return character?.sharedBody?.bodyId?.trim() || ''
}

function getTokenIdentityBodyKey(token: TabletopToken | null | undefined) {
  return token?.bodyId || token?.characterId || ''
}

function getWorldMundiBodyIdForCharacter(characterId: string) {
  return `corpo-${characterId}`
}

function getWorldMundiConsciousnessIdForPlayer(playerId: string) {
  return `consciencia_${playerId}`
}

function getShortPlayerLabel(profileId: string) {
  const index = getPlayerProfileIndex(profileId)

  return index >= 0 ? `J${index + 1}` : profileId
}

function applyPersistentBodyControlToToken(
  token: TabletopToken,
  body: WorldMundiBody,
): TabletopToken {
  const playerId = body.jogadorControladorId
  const consciousnessId =
    body.conscienciaControladoraId || getWorldMundiConsciousnessIdForPlayer(playerId)

  if (!playerId || !body.ocupadoPorConsciencia) {
    return token
  }

  const controlledByPlayerIds = Array.from(
    new Set([...(token.control?.controlledByPlayerIds ?? []), playerId]),
  )

  return {
    ...token,
    bodyId: body.id,
    control: {
      ...(token.control ?? {
        controlledByPlayerIds: [],
        sharedControl: false,
      }),
      controlledByPlayerIds,
      primaryControllerId: token.control?.primaryControllerId ?? playerId,
      sharedControl: controlledByPlayerIds.length > 1,
    },
    controladoPorJogadorId: playerId,
    label: getShortPlayerLabel(playerId),
    persistentControl: {
      bodyId: body.id,
      consciousnessId,
      linkedAt: token.persistentControl?.linkedAt ?? new Date().toISOString(),
      originalConsciousnessState: body.estadoDaConscienciaOriginal,
      playerId,
    },
    tokenKind: 'player_corpo',
  }
}

function resolveFocusedPlayerCharacter(input: {
  activeProfile: FushiAccessProfile | null
  playerCharacterId: string
  playerCharacters: CharacterSheet[]
  viewMode: string
}) {
  if (input.viewMode !== 'player') {
    return (
      input.playerCharacters.find(
        (character) => character.id === input.playerCharacterId,
      ) ??
      input.playerCharacters[0] ??
      null
    )
  }

  const activeCharacterId =
    input.playerCharacterId || input.activeProfile?.characterId || ''
  const directCharacter = input.playerCharacters.find(
    (character) => character.id === activeCharacterId,
  )

  if (directCharacter) {
    return directCharacter
  }

  const fallbackIndex = getPlayerProfileIndex(input.activeProfile?.id ?? '')

  return fallbackIndex >= 0 ? input.playerCharacters[fallbackIndex] ?? null : null
}

function getSharedBodySheetOptions(input: {
  hostCharacterId: string
  profiles: FushiAccessProfile[]
  characters: CharacterSheet[]
}) {
  if (!input.hostCharacterId) {
    return []
  }

  return input.characters
    .filter((character) => getSharedBodyHostId(character) === input.hostCharacterId)
    .map((character) => {
      const profile =
        input.profiles.find(
          (item) => item.role === 'player' && item.characterId === character.id,
        ) ?? null

      return {
        character,
        characterId: character.id,
        characterName: character.nome,
        label: profile?.label ?? character.jogador ?? character.nome,
        selectionId: character.id,
      }
    })
}

export function TablePage() {
  const { data, updateCharacter } = useMasterData()
  const {
    accessState,
    activeAccessProfile,
    logoutAccessProfile,
    playerCharacterId,
    resetViewMode,
    updateAccessProfile,
    viewMode,
  } = useViewMode()
  const boardRootRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const pingTimeoutsRef = useRef<number[]>([])
  const pendingSceneCameraKeyRef = useRef('')
  const cameraPersistFrameRef = useRef<number | null>(null)
  const pendingViewportCameraRef = useRef<{
    sceneId: string
    scrollLeft: number
    scrollTop: number
    zoom: number
  } | null>(null)
  const musicAudioRef = useRef<HTMLAudioElement | null>(null)
  const ambienceAudioRef = useRef<HTMLAudioElement | null>(null)
  const mixerAudioElementsRef = useRef<Record<string, HTMLAudioElement>>({})
  const lastAudioSceneKeyRef = useRef('')
  const rollToastTimeoutRef = useRef<number | null>(null)
  const lastRollToastIdRef = useRef('')
  const [session, setSession] = useState(() => readPersistedTabletopSession())
  const [personalNotesByOwner, setPersonalNotesByOwner] = useState(() =>
    readPersistedTabletopNotes(),
  )
  const [identityResourcesByBody, setIdentityResourcesByBody] = useState(() =>
    readPersistedIdentityResources(),
  )
  const [libraryState, setLibraryState] = useState(() =>
    readPersistedTabletopLibraryState(),
  )
  const [worldMundiState, setWorldMundiState] = useState(() =>
    readPersistedWorldMundiState(),
  )
  const [activeHudPanel, setActiveHudPanel] = useState<HudPanelId | null>(null)
  const [activeUtilityWindow, setActiveUtilityWindow] =
    useState<UtilityWindowId>(null)
  const [inspectedTokenId, setInspectedTokenId] = useState('')
  const [sharedBodySheetProfileByToken, setSharedBodySheetProfileByToken] =
    useState<Record<string, string>>({})
  const [identityResourceProfileByToken, setIdentityResourceProfileByToken] =
    useState<Record<string, FushiAccessProfileId | ''>>({})
  const [configureMapId, setConfigureMapId] = useState<string | null>(null)
  const [focusedMapLibraryId, setFocusedMapLibraryId] = useState('')
  const [isMeasureToolActive, setIsMeasureToolActive] = useState(false)
  const [playersCanMeasure, setPlayersCanMeasure] = useState(true)
  const [preparedSceneIdOverride, setPreparedSceneIdOverride] = useState('')
  const [sceneEntryId, setSceneEntryId] = useState(0)
  const [introOverlayState, setIntroOverlayState] =
    useState<TabletopIntroOverlayState | null>(null)
  const [transitionOverlayState, setTransitionOverlayState] =
    useState<TabletopTransitionOverlayState | null>(null)
  const [cinematicOverlayState, setCinematicOverlayState] =
    useState<TabletopCinematicOverlayState | null>(null)
  const [audioTransportState, setAudioTransportState] =
    useState<TabletopAudioTransportState>('stopped')
  const [musicVolume, setMusicVolume] = useState(0.18)
  const [ambienceVolume, setAmbienceVolume] = useState(0.14)
  const [audioStatusMessage, setAudioStatusMessage] = useState('')
  const [mixerTracks, setMixerTracks] = useState<Record<string, TabletopMixerTrackState>>({})
  const [libraryAudioStatusMessage, setLibraryAudioStatusMessage] = useState('')
  const [tableFeedbackMessage, setTableFeedbackMessage] = useState('')
  const [rollToastEntry, setRollToastEntry] = useState<TabletopLogEntry | null>(null)
  const [imagePreviewState, setImagePreviewState] =
    useState<TabletopImagePreviewState | null>(() => readSharedImagePreviewState())
  const [pings, setPings] = useState<TabletopPing[]>([])
  const [sharedTransitionPlaybackState, setSharedTransitionPlaybackState] =
    useState<SharedTransitionPlaybackState | null>(() =>
      readSharedTransitionPlaybackState(),
    )
  const [transitionOverrides, setTransitionOverrides] = useState<
    Record<string, PersistedTransitionOverride>
  >(() => readPersistedTransitionOverrides())
  const [playerLocalZoomByScene, setPlayerLocalZoomByScene] = useState<
    Record<string, number>
  >({})
  const [sceneReturnTransitionActive, setSceneReturnTransitionActive] =
    useState(false)
  const [configureTransitionId, setConfigureTransitionId] = useState<string | null>(null)

  const isGridVisible = session?.isGridVisible ?? DEFAULT_TABLETOP_GRID_VISIBLE
  const logEntries = session?.logEntries ?? EMPTY_TABLETOP_LOG_ENTRIES
  const activeCampaignId = data?.campaigns.activeCampaignId ?? 'campaign-local-default'
  const [loadedTableCampaignId, setLoadedTableCampaignId] = useState(activeCampaignId)

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) {
        return
      }

      setSession(readPersistedTabletopSession(activeCampaignId))
      setLibraryState(readPersistedTabletopLibraryState(activeCampaignId))
      setWorldMundiState(readPersistedWorldMundiState(activeCampaignId))
      setTransitionOverrides(readPersistedTransitionOverrides(activeCampaignId))
      setPreparedSceneIdOverride('')
      setInspectedTokenId('')
      setFocusedMapLibraryId('')
      setIsMeasureToolActive(false)
      setLoadedTableCampaignId(activeCampaignId)
    })

    return () => {
      cancelled = true
    }
  }, [activeCampaignId])

  useEffect(() => {
    if (loadedTableCampaignId !== activeCampaignId) {
      return
    }

    if (!session) {
      clearPersistedTabletopSession(activeCampaignId)
      return
    }

    writePersistedTabletopSession(session, activeCampaignId)
  }, [activeCampaignId, loadedTableCampaignId, session])

  useEffect(() => {
    if (loadedTableCampaignId !== activeCampaignId) {
      return
    }

    writePersistedTabletopLibraryState(libraryState, activeCampaignId)
  }, [activeCampaignId, libraryState, loadedTableCampaignId])

  useEffect(() => {
    if (loadedTableCampaignId !== activeCampaignId) {
      return
    }

    writePersistedWorldMundiState(worldMundiState, activeCampaignId)
  }, [activeCampaignId, loadedTableCampaignId, worldMundiState])

  useEffect(() => {
    writePersistedTabletopNotes(personalNotesByOwner)
  }, [personalNotesByOwner])

  useEffect(() => {
    writePersistedIdentityResources(identityResourcesByBody)
  }, [identityResourcesByBody])

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (
        event.storageArea !== window.localStorage ||
        !event.key
      ) {
        return
      }

      if (
        event.key === TABLETOP_SESSION_STORAGE_KEY ||
        event.key === getPersistedTabletopSessionStorageKey(activeCampaignId)
      ) {
        setSession(readPersistedTabletopSession(activeCampaignId))
      }

      if (event.key === TABLETOP_TRANSITION_SYNC_STORAGE_KEY) {
        setSharedTransitionPlaybackState(readSharedTransitionPlaybackState())
      }

      if (
        event.key === TABLETOP_TRANSITION_OVERRIDES_STORAGE_KEY ||
        event.key === getPersistedTransitionOverridesStorageKey(activeCampaignId)
      ) {
        setTransitionOverrides(readPersistedTransitionOverrides(activeCampaignId))
      }

      if (event.key === TABLETOP_IMAGE_PREVIEW_STORAGE_KEY) {
        setImagePreviewState(readSharedImagePreviewState())
      }

      if (event.key === TABLETOP_NOTES_STORAGE_KEY) {
        setPersonalNotesByOwner(readPersistedTabletopNotes())
      }

      if (event.key === TABLETOP_IDENTITY_RESOURCES_STORAGE_KEY) {
        setIdentityResourcesByBody(readPersistedIdentityResources())
      }

      if (
        event.key === TABLETOP_WORLD_MUNDI_STORAGE_KEY ||
        event.key === getPersistedWorldMundiStorageKey(activeCampaignId)
      ) {
        setWorldMundiState(readPersistedWorldMundiState(activeCampaignId))
      }

      if (
        event.key === getPersistedTabletopLibraryStorageKey(activeCampaignId)
      ) {
        setLibraryState(readPersistedTabletopLibraryState(activeCampaignId))
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [activeCampaignId])

  useEffect(() => {
    if (loadedTableCampaignId !== activeCampaignId) {
      return
    }

    writePersistedTransitionOverrides(transitionOverrides, activeCampaignId)
  }, [activeCampaignId, loadedTableCampaignId, transitionOverrides])

  const hudItems = useMemo(
    () => [
      { id: 'maps', label: 'Mapas', shortLabel: 'MAP' },
      { id: 'music', label: 'Musicas', shortLabel: 'MSC' },
      { id: 'npcs', label: 'NPCs', shortLabel: 'NPC' },
      { id: 'world', label: 'Mapa Mundi', shortLabel: 'MUN' },
    ] as const,
    [],
  )

  useEffect(() => {
    return () => {
      pingTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      if (cameraPersistFrameRef.current !== null) {
        window.cancelAnimationFrame(cameraPersistFrameRef.current)
      }
      if (rollToastTimeoutRef.current !== null) {
        window.clearTimeout(rollToastTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!tableFeedbackMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setTableFeedbackMessage('')
    }, 2200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [tableFeedbackMessage])

  useEffect(() => {
    const lastEntry = logEntries[logEntries.length - 1]

    if (!lastEntry || lastEntry.type !== 'roll' || !lastEntry.roll) {
      return
    }

    if (lastEntry.visibility === 'gm' && viewMode !== 'gm') {
      return
    }

    if (lastRollToastIdRef.current === lastEntry.id) {
      return
    }

    lastRollToastIdRef.current = lastEntry.id
    setRollToastEntry(lastEntry)
    playRollNotification()

    if (rollToastTimeoutRef.current !== null) {
      window.clearTimeout(rollToastTimeoutRef.current)
    }

    rollToastTimeoutRef.current = window.setTimeout(() => {
      setRollToastEntry(null)
      rollToastTimeoutRef.current = null
    }, 5200)
  }, [logEntries, viewMode])

  useEffect(() => {
    if (!sceneReturnTransitionActive) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setSceneReturnTransitionActive(false)
    }, 520)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [sceneReturnTransitionActive])

  useEffect(() => {
    if (viewMode !== 'gm') {
      return
    }

    function handleDocumentPointerDown(event: PointerEvent) {
      const target = event.target

      if (!(target instanceof Node) || boardRootRef.current?.contains(target)) {
        return
      }

      if (
        target instanceof Element &&
        target.closest(
          '.floating-window, .tabletop-screen__utility, .tabletop-screen__hud, .tabletop-screen__topbar, .modal-overlay, .tabletop-image-preview, .tabletop-roll-toast',
        )
      ) {
        return
      }

      setSession((currentSession) => {
        if (!currentSession || currentSession.selectedTokenIds.length === 0) {
          return currentSession
        }

        return createPersistedTabletopSession({
          ...currentSession,
          currentSceneId: currentSession.currentSceneId,
          initialSceneId: currentSession.initialSceneId,
          scenes: currentSession.scenes,
          selectedTokenIds: [],
          selectedTokenId: '',
          logEntries: currentSession.logEntries,
        })
      })
    }

    document.addEventListener('pointerdown', handleDocumentPointerDown, true)

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
    }
  }, [viewMode])

  useEffect(() => {
    musicAudioRef.current = createTabletopAudioElement()
    ambienceAudioRef.current = createTabletopAudioElement()

    return () => {
      if (musicAudioRef.current) {
        stopAudioElement(musicAudioRef.current)
        musicAudioRef.current = null
      }

      if (ambienceAudioRef.current) {
        stopAudioElement(ambienceAudioRef.current)
        ambienceAudioRef.current = null
      }

      Object.values(mixerAudioElementsRef.current).forEach((element) => {
        stopAudioElement(element)
        element.removeAttribute('src')
        element.load()
      })
      mixerAudioElementsRef.current = {}
    }
  }, [])

  const playerCharacters = useMemo(
    () => (data ? getPlayerCharacters(data) : []),
    [data],
  )
  const focusedPlayerCharacter = resolveFocusedPlayerCharacter({
    activeProfile: activeAccessProfile,
    playerCharacterId,
    playerCharacters,
    viewMode,
  })
  const personalNotesOwnerId =
    viewMode === 'gm'
      ? 'gm'
      : `player:${activeAccessProfile?.id || focusedPlayerCharacter?.id || playerCharacterId || 'guest'}`
  const personalNotesOwnerLabel =
    viewMode === 'gm'
      ? 'Notas do mestre'
      : `Notas de ${activeAccessProfile?.label ?? focusedPlayerCharacter?.nome ?? 'jogador'}`
  const personalNotes = personalNotesByOwner[personalNotesOwnerId] ?? ''
  const availableMaps = useMemo(
    () => {
      const baseMaps = data ? getTabletopMaps(data.tabletop) : []
      const mergedMaps = [...baseMaps, ...libraryState.customMaps].filter(
        (map) => !libraryState.hiddenItems.maps[map.id],
      )

      return mergedMaps.map((map) => ({
        ...map,
        ...(libraryState.mapOverrides[map.id] ?? {}),
      }))
    },
    [
      data,
      libraryState.customMaps,
      libraryState.hiddenItems.maps,
      libraryState.mapOverrides,
    ],
  )
  const mapPreviewById = useMemo(
    () =>
      Object.fromEntries(
        availableMaps.map((map) => [
          map.id,
          map.thumbnailUrl ?? map.previewImage ?? map.imageUrl ?? map.image,
        ]),
      ),
    [availableMaps],
  )
  const defaultScenes = useMemo(
    () => (data ? getTabletopScenes(data.tabletop) : []),
    [data],
  )
  const availableBiomes = useMemo(() => data?.tabletop.biomes ?? [], [data])
  const availableTransitions = useMemo(
    () =>
      [
        ...(data?.tabletop.transitions ?? []),
        ...libraryState.customTransitions,
      ]
        .filter((transition) => !libraryState.hiddenItems.transitions[transition.id])
        .map((transition) => {
        const override = transitionOverrides[transition.id]

        if (!override) {
          return transition
        }

        return {
          ...transition,
          assetUrl: override.assetUrl ?? transition.assetUrl,
          thumbnailUrl: override.thumbnailUrl ?? transition.thumbnailUrl,
          toMapId: override.toMapId ?? transition.toMapId,
          type: override.type ?? transition.type,
        }
      }),
    [
      data?.tabletop.transitions,
      libraryState.customTransitions,
      libraryState.hiddenItems.transitions,
      transitionOverrides,
    ],
  )
  const assetLibrary = useMemo<TabletopAssetLibrary | null>(
    () =>
      data
        ? {
            ...data.tabletop.assetLibrary,
            ambienceTracks: [
              ...data.tabletop.assetLibrary.ambienceTracks,
              ...libraryState.customAmbienceTracks,
            ].filter((track) => !libraryState.hiddenItems.music[track.id]),
            maps: availableMaps,
            musicTracks: [
              ...data.tabletop.assetLibrary.musicTracks,
              ...libraryState.customMusicTracks,
            ].filter((track) => !libraryState.hiddenItems.music[track.id]),
            transitions: availableTransitions,
          }
        : null,
    [
      availableMaps,
      availableTransitions,
      data,
      libraryState.customAmbienceTracks,
      libraryState.customMusicTracks,
      libraryState.hiddenItems.music,
    ],
  )
  const sourceScenes = session?.scenes.length ? session.scenes : defaultScenes
  const initialSceneId =
    session?.initialSceneId &&
    sourceScenes.some((scene) => scene.id === session.initialSceneId)
      ? session.initialSceneId
      : data?.tabletop.initialSceneId && sourceScenes.some((scene) => scene.id === data.tabletop.initialSceneId)
        ? data.tabletop.initialSceneId
        : (sourceScenes[0]?.id ?? '')
  const currentSceneId =
    session?.currentSceneId &&
    sourceScenes.some((scene) => scene.id === session.currentSceneId)
      ? session.currentSceneId
      : initialSceneId
  const scenes = useMemo(() => {
    if (!data) {
      return session?.scenes ?? []
    }

    return sourceScenes.map((scene) => {
      const sceneMap =
        availableMaps.find((map) => map.id === scene.mapId) ?? data.tabletop.map

        return {
          ...scene,
          tokens: scene.tokens
          .filter((token) =>
            data.characters.items.some(
              (character) => character.id === token.characterId,
            ),
          )
          .map((token) => ({
            ...token,
            cell: clampTabletopTokenCell(token.cell, sceneMap, token),
          })),
        }
      })
  }, [availableMaps, data, session?.scenes, sourceScenes])
  const preparedSceneId =
    preparedSceneIdOverride &&
    scenes.some((scene) => scene.id === preparedSceneIdOverride)
      ? preparedSceneIdOverride
      : currentSceneId
  const currentScene =
    scenes.find((scene) => scene.id === currentSceneId) ?? scenes[0] ?? null
  const preparedScene =
    scenes.find((scene) => scene.id === preparedSceneId) ?? currentScene
  const initialScene =
    scenes.find((scene) => scene.id === initialSceneId) ?? scenes[0] ?? null
  const activeMap =
    availableMaps.find((map) => map.id === currentScene?.mapId) ?? data?.tabletop.map ?? null
  const preparedSceneMap =
    availableMaps.find((map) => map.id === preparedScene?.mapId) ?? data?.tabletop.map ?? null
  const preparedSceneCellSize =
    preparedSceneMap && preparedScene
      ? getTabletopMapCellSize(preparedSceneMap, preparedScene)
      : undefined
  const sceneRuntime = useMemo(
    () =>
      currentScene
        ? resolveTabletopSceneRuntime({
            scene: currentScene,
            assetLibrary,
          })
        : null,
    [assetLibrary, currentScene],
  )
  const preparedSceneRuntime = useMemo(
    () =>
      preparedScene
        ? resolveTabletopSceneRuntime({
            scene: preparedScene,
            assetLibrary,
          })
        : null,
    [assetLibrary, preparedScene],
  )
  const boardScene = viewMode === 'gm' ? preparedScene : currentScene
  const boardSceneId = boardScene?.id ?? currentSceneId
  const boardMap =
    availableMaps.find((map) => map.id === boardScene?.mapId) ?? data?.tabletop.map ?? null
  const boardMapCellSize =
    boardMap && boardScene ? getTabletopMapCellSize(boardMap, boardScene) : undefined
  const boardSceneRuntime = viewMode === 'gm' ? preparedSceneRuntime : sceneRuntime
  const boardSceneCameraKey = boardScene
    ? [boardScene.id, sceneEntryId].join(':')
    : ''
  const sceneThemeStyle = useMemo(
    () => (boardSceneRuntime?.uiTheme.variables ?? {}) as CSSProperties,
    [boardSceneRuntime?.uiTheme.variables],
  )
  const activeIntroCard = sceneRuntime?.introCard ?? null
  const activeTransitionOverlay =
    transitionOverlayState
      ? availableTransitions.find(
          (asset) => asset.id === transitionOverlayState.transitionId,
        ) ?? null
      : null
  const configurableTransition =
    configureTransitionId
      ? availableTransitions.find((transition) => transition.id === configureTransitionId) ??
        null
      : null
  const configurableMap =
    configureMapId
      ? availableMaps.find((map) => map.id === configureMapId) ?? null
      : null
  const mapFolderOptions = useMemo<MapConfigurationFolderOption[]>(
    () => [
      { id: '', label: 'Todas as pastas' },
      ...availableBiomes.map((biome) => ({
        id: `virtual:maps:biome:${biome.id}`,
        label: `🗺️ ${biome.name}`,
      })),
      ...libraryState.folders
        .filter((folder) => folder.category === 'maps')
        .map((folder) => ({
          id: folder.id,
          label: `${folder.icon ?? '📁'} ${folder.name}`,
        })),
    ],
    [availableBiomes, libraryState.folders],
  )
  const gmCameraControlEnabled = session?.gmCameraControlEnabled ?? false
  const activeSceneAudio = sceneRuntime?.audio ?? {
    music: null,
    ambience: null,
  }
  const sceneAudioKey = currentScene
    ? [
        currentScene.id,
        activeSceneAudio.music?.id ?? '',
        activeSceneAudio.ambience?.id ?? '',
        sceneEntryId,
      ].join(':')
    : ''
  const zoom =
    session?.zoom ??
    (boardScene && boardSceneRuntime
      ? getSceneCameraZoom({
          scene: boardScene,
          cameraRuntime: boardSceneRuntime.camera,
        })
      : DEFAULT_TABLETOP_ZOOM)
  const effectiveZoom =
    viewMode === 'player' && !gmCameraControlEnabled
      ? playerLocalZoomByScene[currentSceneId] ?? zoom
      : zoom
  const isBoardCameraLocked =
    viewMode === 'player' && gmCameraControlEnabled
  const canUseMeasureTool = viewMode === 'gm' || playersCanMeasure
  const isActiveMapVisibleToPlayer =
    viewMode === 'gm' ||
    !activeMap?.mapVisibility ||
    activeMap.mapVisibility === 'ativo_para_jogadores'
  const isIntroCardVisible = Boolean(
    activeIntroCard &&
      introOverlayState &&
      introOverlayState.sceneId === currentSceneId &&
      introOverlayState.introCardId === activeIntroCard.id,
  )

  const tokens = useMemo(() => {
    if (!boardScene || !boardMap) {
      return session?.tokens ?? []
    }

    return boardScene.tokens.map((token) => ({
      ...token,
      cell: clampTabletopTokenCell(token.cell, boardMap, token),
    }))
  }, [boardMap, boardScene, session?.tokens])

  const activePlayerProfileId = getPlayerProfileId(activeAccessProfile)
  const focusedPlayerSharedBodyHostId = getSharedBodyHostId(focusedPlayerCharacter)
  const sharedBodyHostCharacterIds = new Set(
    playerCharacters
      .map((character) => getSharedBodyHostId(character))
      .filter(Boolean),
  )
  const scenePlayerTokens = tokens.filter(
    (token) =>
      playerCharacters.some((character) => character.id === token.characterId) ||
      sharedBodyHostCharacterIds.has(token.characterId),
  )
  const focusedPlayerToken = focusedPlayerCharacter
    ? scenePlayerTokens.find(
        (token) =>
          token.characterId === focusedPlayerCharacter.id ||
          token.characterId === focusedPlayerSharedBodyHostId,
      )
    : undefined
  const occupiedPlayerBodies = useMemo(
    () =>
      Object.values(worldMundiState.corpos).filter(
        (body) =>
          body.ocupadoPorConsciencia &&
          body.jogadorControladorId &&
          body.npcOriginalId,
      ),
    [worldMundiState.corpos],
  )
  const playerBodyByCharacterId = useMemo(
    () =>
      new Map(
        occupiedPlayerBodies.map((body) => [
          body.npcOriginalId,
          body,
        ]),
      ),
    [occupiedPlayerBodies],
  )

  function getPersistentBodyForToken(token: TabletopToken | null | undefined) {
    if (!token) {
      return null
    }

    if (token.bodyId && worldMundiState.corpos[token.bodyId]) {
      const body = worldMundiState.corpos[token.bodyId]

      return body.ocupadoPorConsciencia ? body : null
    }

    return playerBodyByCharacterId.get(token.characterId) ?? null
  }

  function getTokenSharedBodyHostId(token: TabletopToken) {
    if (!data) {
      return ''
    }

    const tokenCharacter = getCharacterById(data, token.characterId)

    if (tokenCharacter?.isSharedBodyHost) {
      return tokenCharacter.id
    }

    return getSharedBodyHostId(tokenCharacter)
  }

  const activePlayerControlledTokens =
    viewMode === 'player' && activePlayerProfileId
      ? tokens.filter(
          (token) =>
            token.control?.controlledByPlayerIds.includes(activePlayerProfileId) ||
            getPersistentBodyForToken(token)?.jogadorControladorId === activePlayerProfileId,
        )
      : []
  const playerToken =
    viewMode === 'player'
      ? activePlayerControlledTokens[0] ?? null
      : focusedPlayerToken || scenePlayerTokens[0] || null
  const isFocusedPlayerMissingFromScene = false

  function canActivePlayerControlToken(token: TabletopToken) {
    if (viewMode === 'gm') {
      return true
    }

    if (!activePlayerProfileId) {
      return false
    }

    if (getPersistentBodyForToken(token)?.jogadorControladorId === activePlayerProfileId) {
      return true
    }

    return token.control?.controlledByPlayerIds.includes(activePlayerProfileId) ?? false
  }

  function resolveIdentityResourcePoolForToken(
    token: TabletopToken,
    profileId: FushiAccessProfileId | '',
    fallbackCharacter: CharacterSheet | null,
  ): IdentityResourcePool | null {
    if (!isIdentityResourceProfileId(profileId)) {
      return null
    }

    const bodyKey = getTokenIdentityBodyKey(token)
    const storedPool = identityResourcesByBody[bodyKey]?.[profileId]

    if (storedPool) {
      return storedPool
    }

    const profile = accessState.profiles.find((item) => item.id === profileId) ?? null
    const profileCharacter =
      profile?.characterId && data
        ? getCharacterById(data, profile.characterId)
        : null

    const sourceCharacter = profileCharacter ?? fallbackCharacter

    if (!sourceCharacter) {
      return {
        determinacaoAtual: 0,
        determinacaoMaxima: 0,
        fushiAtual: 0,
        fushiMaximo: 0,
        pericias: [],
      }
    }

    return getIdentityResourcePool(sourceCharacter)
  }

  const visibleTokens =
    viewMode === 'gm'
      ? tokens
      : tokens.filter(
          (token) => token.visibility === 'public' || canActivePlayerControlToken(token),
        )

  const persistedSelectionIds = session?.selectedTokenIds ?? []
  const removedCharacterIdsByScene = useMemo(
    () => session?.removedCharacterIdsByScene ?? {},
    [session?.removedCharacterIdsByScene],
  )
  const gmSelectedTokenIds = persistedSelectionIds.filter((tokenId) =>
    visibleTokens.some((token) => token.id === tokenId),
  )
  const selectedTokenIds =
    viewMode === 'player'
      ? (playerToken ? [playerToken.id] : [])
      : gmSelectedTokenIds

  const primarySelectedTokenId =
    selectedTokenIds[selectedTokenIds.length - 1] ??
    (viewMode === 'player' ? playerToken?.id ?? '' : '')

  const selectedTokens = visibleTokens.filter((token) =>
    selectedTokenIds.includes(token.id),
  )
  const activeTokenId = visibleTokens.some((token) => token.id === inspectedTokenId)
    ? inspectedTokenId
    : ''

  const activeToken =
    visibleTokens.find((token) => token.id === activeTokenId) ?? null
  const primarySelectedToken =
    tokens.find((token) => token.id === primarySelectedTokenId) ?? null
  const activeTokenSpan = activeToken ? resolveTabletopTokenSpan(activeToken) : null
  const activeTokenSizeSummary = activeTokenSpan
    ? `${activeTokenSpan.columns}x${activeTokenSpan.rows} celulas`
    : null

  const sharedBodySheetOptions =
    data && activeToken
      ? getSharedBodySheetOptions({
          characters: data.characters.items,
          hostCharacterId: getTokenSharedBodyHostId(activeToken) || activeToken.characterId,
          profiles: accessState.profiles,
        })
      : []
  const activeSharedBodySheetSelectionId =
    activeToken && viewMode === 'gm'
      ? sharedBodySheetProfileByToken[activeToken.id] ?? ''
      : ''
  const activeSharedBodySheetCharacter =
    activeSharedBodySheetSelectionId && sharedBodySheetOptions.length > 0
      ? sharedBodySheetOptions.find(
          (option) => option.selectionId === activeSharedBodySheetSelectionId,
        )?.character ?? null
      : null
  const identityResourceOptions =
    activeToken
      ? Array.from(
          new Set([
            ...(activeToken.control?.controlledByPlayerIds ?? []),
            getPersistentBodyForToken(activeToken)?.jogadorControladorId ?? '',
          ]),
        )
          .filter(isIdentityResourceProfileId)
          .map((profileId) =>
            accessState.profiles.find(
              (profile) =>
                profile.id === profileId &&
                profile.role === 'player' &&
                isIdentityResourceProfileId(profile.id),
            ),
          )
          .filter((profile): profile is FushiAccessProfile => Boolean(profile))
          .map((profile) => ({
            label: profile.label,
            profileId: profile.id,
          }))
      : []
  const baseActiveCharacter =
    data && activeToken
      ? viewMode === 'player' &&
        focusedPlayerCharacter &&
        focusedPlayerSharedBodyHostId &&
        getTokenSharedBodyHostId(activeToken) === focusedPlayerSharedBodyHostId
        ? focusedPlayerCharacter
        : activeSharedBodySheetCharacter ?? getCharacterById(data, activeToken.characterId)
      : null
  const activeIdentityResourceProfileId =
    activeToken && viewMode === 'player' && canActivePlayerControlToken(activeToken)
      ? getIdentityProfileId(activeAccessProfile)
      : activeToken && viewMode === 'gm'
        ? identityResourceProfileByToken[activeToken.id] ??
          getPersistentBodyForToken(activeToken)?.jogadorControladorId ??
          ''
        : ''
  const activeIdentityResourcePool =
    activeToken && baseActiveCharacter
      ? resolveIdentityResourcePoolForToken(
          activeToken,
          activeIdentityResourceProfileId,
          baseActiveCharacter,
        )
      : null
  const activeCharacter = baseActiveCharacter
    ? applyIdentityResourcePool(baseActiveCharacter, activeIdentityResourcePool)
    : null

  const activeFaction =
    data && activeCharacter
      ? data.factions.items.find((faction) => faction.id === activeCharacter.faccao) ??
        null
      : null
  const canEditActiveCharacter = Boolean(
    activeCharacter &&
      (viewMode === 'gm' || (activeToken && canActivePlayerControlToken(activeToken))),
  )
  const canEditActiveToken = Boolean(
    activeToken &&
      (viewMode === 'gm' || canActivePlayerControlToken(activeToken)),
  )
  const sheetActionTokenId =
    primarySelectedTokenId || playerToken?.id || activeToken?.id || ''
  const boardPings = pings.map((ping) => ({
    id: ping.id,
    cell: ping.cell,
    label: ping.authorView === 'gm' ? 'M' : 'J',
  }))

  const npcLibraryCharacters = useMemo(
    () =>
      data
        ? data.characters.items.filter((character) => character.tipo === 'npc')
        : [],
    [data],
  )
  const spawnLibraryCharacters = useMemo(
    () =>
      [...playerCharacters, ...npcLibraryCharacters].filter(
        (character) => !libraryState.hiddenItems.npcs[character.id],
      ),
    [libraryState.hiddenItems.npcs, npcLibraryCharacters, playerCharacters],
  )
  const activeSceneCharacterIds = tokens.map((token) => token.characterId)
  const audioLibraryTracks = useMemo<TabletopMusicLibraryItem[]>(
    () =>
      assetLibrary
        ? [
            ...assetLibrary.musicTracks.map((track) => ({
              ...track,
              libraryType: 'music' as const,
              categoryLabel: track.category ?? 'Musica',
            })),
            ...assetLibrary.ambienceTracks.map((track) => ({
              ...track,
              libraryType: 'ambience' as const,
              categoryLabel: track.category ?? 'Ambiencia',
            })),
          ]
        : [],
    [assetLibrary],
  )
  const preparedSceneCinematic = preparedSceneRuntime?.cinematic ?? null
  const activeCinematicOverlay =
    cinematicOverlayState && assetLibrary
      ? assetLibrary.cinematics.find(
          (asset) => asset.id === cinematicOverlayState.cinematicId,
        ) ?? null
      : null

  const tokenViews = data
    ? visibleTokens
        .map((token) => {
          const character = getCharacterById(data, token.characterId)
          const persistentBody = getPersistentBodyForToken(token)
          const persistentProfile =
            persistentBody?.jogadorControladorId
              ? accessState.profiles.find(
                  (profile) => profile.id === persistentBody.jogadorControladorId,
                ) ?? null
              : null

          if (!character) {
            return null
          }

          return {
            id: token.id,
            label: persistentBody
              ? getShortPlayerLabel(persistentBody.jogadorControladorId)
              : token.label,
            name: persistentBody
              ? `${persistentProfile?.label ?? getShortPlayerLabel(persistentBody.jogadorControladorId)} / ${character.nome}`
              : character.nome,
            color: token.color,
            portraitUrl: character.avatarUrl,
            tokenImageUrl: character.tokenImageUrl,
            topdownImageUrl: character.topdownImageUrl,
            cell: token.cell,
            size: token.size,
            customSize: token.customSize,
            visibility: token.visibility,
            isSelected: selectedTokenIds.includes(token.id),
            isPrimarySelected: token.id === primarySelectedTokenId,
            isControllable: canActivePlayerControlToken(token),
          }
        })
        .filter((token): token is NonNullable<typeof token> => Boolean(token))
    : []
  const currentMundiLocationForPlayerMap =
    currentScene?.mapId
      ? worldMundiState.locations.find((location) => location.mapId === currentScene.mapId) ??
        null
      : null

  useEffect(() => {
    if (!session || !currentScene || !activeMap || playerCharacters.length === 0) {
      return
    }

    const hasPlayerToken = currentScene.tokens.some((token) =>
      playerCharacters.some((character) => character.id === token.characterId),
    )

    if (hasPlayerToken) {
      return
    }

    const fallbackPlayer = focusedPlayerCharacter ?? playerCharacters[0] ?? null

    if (!fallbackPlayer) {
      return
    }

    const removedCharactersOnCurrentScene =
      removedCharacterIdsByScene[currentSceneId] ?? []

    if (removedCharactersOnCurrentScene.includes(fallbackPlayer.id)) {
      return
    }

    const fallbackToken = createTokenForCharacter({
      character: fallbackPlayer,
      existingTokens: currentScene.tokens,
      map: activeMap,
    })

    const timeoutId = window.setTimeout(() => {
      setSession((currentSession) => {
        if (!currentSession) {
          return currentSession
        }

        const currentSessionScene =
          currentSession.scenes.find((scene) => scene.id === currentSceneId) ?? null

        if (!currentSessionScene) {
          return currentSession
        }

        const currentHasPlayerToken = currentSessionScene.tokens.some((token) =>
          playerCharacters.some((character) => character.id === token.characterId),
        )

        if (currentHasPlayerToken) {
          return currentSession
        }

        const removedCharactersOnCurrentScene =
          currentSession.removedCharacterIdsByScene[currentSceneId] ?? []

        if (removedCharactersOnCurrentScene.includes(fallbackPlayer.id)) {
          return currentSession
        }

        const nextScenes = currentSession.scenes.map((scene) =>
          scene.id === currentSceneId
            ? {
                ...scene,
                tokens: [...scene.tokens, fallbackToken],
              }
            : scene,
        )

        return createPersistedTabletopSession({
          ...currentSession,
          currentSceneId,
          initialSceneId: currentSession.initialSceneId,
          scenes: nextScenes,
        })
      })
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [
    activeMap,
    currentScene,
    currentSceneId,
    focusedPlayerCharacter,
    removedCharacterIdsByScene,
    playerCharacters,
    session,
  ])

  useEffect(() => {
    if (!session || !currentScene || !activeMap || !data || !currentMundiLocationForPlayerMap) {
      return
    }

    const bodiesForScene = occupiedPlayerBodies.filter(
      (body) =>
        body.localAtualId === currentMundiLocationForPlayerMap.id &&
        body.npcOriginalId &&
        data.characters.items.some((character) => character.id === body.npcOriginalId),
    )

    if (bodiesForScene.length === 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setSession((currentSession) => {
        if (!currentSession) {
          return currentSession
        }

        const scene = currentSession.scenes.find((entry) => entry.id === currentSceneId)

        if (!scene) {
          return currentSession
        }

        const removedCharactersOnCurrentScene =
          currentSession.removedCharacterIdsByScene[currentSceneId] ?? []
        let nextTokens = scene.tokens
        let changed = false

        bodiesForScene.forEach((body) => {
          if (removedCharactersOnCurrentScene.includes(body.npcOriginalId)) {
            return
          }

          const existingToken = nextTokens.find(
            (token) => token.characterId === body.npcOriginalId,
          )

          if (existingToken) {
            const nextToken = applyPersistentBodyControlToToken(existingToken, body)

            if (JSON.stringify(nextToken) !== JSON.stringify(existingToken)) {
              nextTokens = nextTokens.map((token) =>
                token.id === existingToken.id ? nextToken : token,
              )
              changed = true
            }
            return
          }

          const character = getCharacterById(data, body.npcOriginalId)

          if (!character) {
            return
          }

          const nextToken = applyPersistentBodyControlToToken(
            createTokenForCharacter({
              character,
              existingTokens: nextTokens,
              map: activeMap,
            }),
            body,
          )

          nextTokens = [...nextTokens, nextToken]
          changed = true
        })

        if (!changed) {
          return currentSession
        }

        return createPersistedTabletopSession({
          ...currentSession,
          scenes: currentSession.scenes.map((entry) =>
            entry.id === currentSceneId ? { ...entry, tokens: nextTokens } : entry,
          ),
        })
      })
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [
    activeMap,
    currentMundiLocationForPlayerMap,
    currentScene,
    currentSceneId,
    data,
    occupiedPlayerBodies,
    session,
  ])

  useEffect(() => {
    if (!boardSceneCameraKey) {
      return
    }

    pendingSceneCameraKeyRef.current = boardSceneCameraKey
  }, [boardSceneCameraKey])

  useEffect(() => {
    if (!boardScene || !boardSceneRuntime || !boardSceneCameraKey) {
      return
    }

    if (pendingSceneCameraKeyRef.current !== boardSceneCameraKey) {
      return
    }

    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      const nextCameraTarget = getSceneCameraTarget({
        viewport,
        scene: boardScene,
        cameraRuntime: boardSceneRuntime.camera,
      })

      viewport.scrollLeft = nextCameraTarget.scrollLeft
      viewport.scrollTop = nextCameraTarget.scrollTop
      pendingSceneCameraKeyRef.current = ''
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [boardScene, boardSceneCameraKey, boardSceneRuntime, effectiveZoom])

  useEffect(() => {
    if (
      viewMode !== 'player' ||
      !gmCameraControlEnabled ||
      !currentScene ||
      !sceneRuntime
    ) {
      return
    }

    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      const nextCameraTarget = getSceneCameraTarget({
        viewport,
        scene: currentScene,
        cameraRuntime: sceneRuntime.camera,
      })

      viewport.scrollLeft = nextCameraTarget.scrollLeft
      viewport.scrollTop = nextCameraTarget.scrollTop
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [
    currentScene,
    currentScene?.cameraState?.scrollLeft,
    currentScene?.cameraState?.scrollTop,
    currentSceneId,
    gmCameraControlEnabled,
    sceneRuntime,
    viewMode,
  ])

  useEffect(() => {
    const musicElement = musicAudioRef.current
    const ambienceElement = ambienceAudioRef.current

    if (!musicElement || !ambienceElement) {
      return
    }

    const currentMusicElement: HTMLAudioElement = musicElement
    const currentAmbienceElement: HTMLAudioElement = ambienceElement

    if (!sceneAudioKey) {
      stopAudioElement(currentMusicElement)
      stopAudioElement(currentAmbienceElement)
      return
    }

    const sceneChanged = lastAudioSceneKeyRef.current !== sceneAudioKey
    lastAudioSceneKeyRef.current = sceneAudioKey

    if (audioTransportState === 'stopped') {
      stopAudioElement(currentMusicElement)
      stopAudioElement(currentAmbienceElement)
      return
    }

    let cancelled = false

    async function syncSceneAudio() {
      const [musicResult, ambienceResult] = await Promise.all([
        syncTabletopAudioChannel({
          channelId: 'music',
          element: currentMusicElement,
          track: activeSceneAudio.music,
          volume: musicVolume,
          shouldPlay: audioTransportState === 'playing',
          restart: sceneChanged,
        }),
        syncTabletopAudioChannel({
          channelId: 'ambience',
          element: currentAmbienceElement,
          track: activeSceneAudio.ambience,
          volume: ambienceVolume,
          shouldPlay: audioTransportState === 'playing',
          restart: sceneChanged,
        }),
      ])

      if (cancelled) {
        return
      }

      if (musicResult === 'blocked' || ambienceResult === 'blocked') {
        setAudioStatusMessage(
          'Autoplay bloqueado pelo navegador. Use Play para liberar a trilha.',
        )
        return
      }

      setAudioStatusMessage('')
    }

    void syncSceneAudio()

    return () => {
      cancelled = true
    }
  }, [
    activeSceneAudio.ambience,
    activeSceneAudio.music,
    ambienceVolume,
    audioTransportState,
    musicVolume,
    sceneAudioKey,
  ])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      setActiveHudPanel(null)
      setActiveUtilityWindow(null)
      setInspectedTokenId('')
      setIntroOverlayState(null)
      setTransitionOverlayState(null)
      setCinematicOverlayState(null)
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function updateSession(
    updater: (
      currentSession: ReturnType<typeof createPersistedTabletopSession>,
    ) => ReturnType<typeof createPersistedTabletopSession>,
  ) {
    setSession((currentSession) => {
      const baseSession =
        currentSession ??
        createPersistedTabletopSession({
          currentSceneId,
          initialSceneId,
          scenes,
          tokens,
          selectedTokenIds,
          selectedTokenId: primarySelectedTokenId,
          removedCharacterIdsByScene,
          zoom,
          isGridVisible,
          logEntries,
        })

      return updater(baseSession)
    })
  }

  function updateLibraryState(
    updater: (
      currentState: PersistedTabletopLibraryState,
    ) => PersistedTabletopLibraryState,
  ) {
    setLibraryState((currentState) => createTabletopLibraryState(updater(currentState)))
  }

  function getLibraryFolderIcon(category: TabletopLibraryCategory) {
    switch (category) {
      case 'maps':
        return '🗺️'
      case 'transitions':
        return '🎬'
      case 'music':
        return '🎵'
      case 'npcs':
        return '🎭'
      default:
        return '📁'
    }
  }

  function createLibraryFolder(
    category: TabletopLibraryCategory,
    parentId: string,
    name: string,
  ) {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return
    }

    updateLibraryState((currentState) => ({
      ...currentState,
      folders: [
        ...currentState.folders,
        {
          id: buildLibraryItemId('folder'),
          category,
          name: trimmedName,
          parentId,
          icon: getLibraryFolderIcon(category),
          sortOrder:
            Math.max(
              0,
              ...currentState.folders
                .filter(
                  (folder) =>
                    folder.category === category && folder.parentId === parentId,
                )
                .map((folder) => folder.sortOrder ?? 0),
            ) + 1,
        },
      ],
    }))
  }

  function isLibraryFolderEmpty(
    state: PersistedTabletopLibraryState,
    folderId: string,
  ) {
    const hasChildFolder = state.folders.some((folder) => folder.parentId === folderId)
    const hasAssignedItem = Object.values(state.itemFolders).some((assignments) =>
      Object.values(assignments).some((itemFolderId) => itemFolderId === folderId),
    )

    return !hasChildFolder && !hasAssignedItem
  }

  function renameLibraryFolder(folderId: string, name: string) {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return
    }

    updateLibraryState((currentState) => ({
      ...currentState,
      folders: currentState.folders.map((folder) =>
        folder.id === folderId ? { ...folder, name: trimmedName } : folder,
      ),
    }))
  }

  function deleteLibraryFolder(folderId: string) {
    updateLibraryState((currentState) => {
      if (!currentState.folders.some((folder) => folder.id === folderId)) {
        return currentState
      }

      if (!isLibraryFolderEmpty(currentState, folderId)) {
        window.alert('So e possivel excluir uma pasta vazia.')
        return currentState
      }

      return {
        ...currentState,
        folders: currentState.folders.filter((folder) => folder.id !== folderId),
      }
    })
  }

  function moveLibraryFolder(folderId: string, direction: 'up' | 'down') {
    updateLibraryState((currentState) => {
      const targetFolder = currentState.folders.find((folder) => folder.id === folderId)

      if (!targetFolder) {
        return currentState
      }

      const siblings = currentState.folders
        .filter(
          (folder) =>
            folder.category === targetFolder.category &&
            folder.parentId === targetFolder.parentId,
        )
        .sort((a, b) => {
          const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER
          const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER

          if (orderA !== orderB) {
            return orderA - orderB
          }

          return a.name.localeCompare(b.name)
        })
      const currentIndex = siblings.findIndex((folder) => folder.id === folderId)
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= siblings.length) {
        return currentState
      }

      const nextSiblings = [...siblings]
      const [movingFolder] = nextSiblings.splice(currentIndex, 1)
      nextSiblings.splice(nextIndex, 0, movingFolder)
      const orderByFolderId = new Map(
        nextSiblings.map((folder, index) => [folder.id, index + 1]),
      )

      return {
        ...currentState,
        folders: currentState.folders.map((folder) =>
          orderByFolderId.has(folder.id)
            ? { ...folder, sortOrder: orderByFolderId.get(folder.id) }
            : folder,
        ),
      }
    })
  }

  function assignLibraryItemFolder(
    category: keyof PersistedTabletopLibraryState['itemFolders'],
    itemId: string,
    folderId: string,
  ) {
    updateLibraryState((currentState) => ({
      ...currentState,
      itemFolders: {
        ...currentState.itemFolders,
        [category]: {
          ...currentState.itemFolders[category],
          [itemId]: folderId,
        },
      },
    }))
  }

  function getWorldMundiMapType(type: WorldMundiMapPlaceholderRequest['type']): TabletopMap['type'] {
    if (
      type === 'dungeon_visivel' ||
      type === 'dungeon_escondida' ||
      type === 'dungeon_condicional'
    ) {
      return 'dungeon'
    }

    if (type === 'base_faccao') {
      return 'base'
    }

    if (type === 'evento') {
      return 'evento'
    }

    if (type === 'subponto' || type === 'descanso' || type === 'recurso') {
      return 'livre'
    }

    if (type === 'vila') {
      return 'interior'
    }

    return 'extra'
  }

  function getWorldMundiPlaceholderPalette(thumbnailTipo: string) {
    switch (thumbnailTipo) {
      case 'caverna':
        return ['#101318', '#30323a', '#0a0c0f']
      case 'vila':
        return ['#456846', '#94764f', '#1e2b23']
      case 'floresta':
        return ['#173c2a', '#3f7a4c', '#0d1712']
      case 'ruina':
        return ['#4b4650', '#857867', '#171419']
      case 'montanha':
        return ['#2f3b42', '#7d8790', '#11171b']
      case 'vulcao':
        return ['#251b19', '#8e4634', '#0c0908']
      case 'neve':
        return ['#d5e3e7', '#6d91a5', '#16232c']
      case 'praia':
        return ['#22677d', '#d8c388', '#12343d']
      default:
        return ['#14342b', '#557f6b', '#0b1210']
    }
  }

  function buildWorldMundiPlaceholderImage(request: WorldMundiMapPlaceholderRequest) {
    const [startColor, middleColor, endColor] = getWorldMundiPlaceholderPalette(
      request.thumbnailTipo,
    )
    const escapedTitle = request.locationName.replace(/[<>&]/g, '')
    const escapedBiome = request.biomeFolderName.replace(/[<>&]/g, '')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1600" viewBox="0 0 2400 1600"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${startColor}"/><stop offset="0.55" stop-color="${middleColor}"/><stop offset="1" stop-color="${endColor}"/></linearGradient><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(245,242,236,0.12)" stroke-width="2"/></pattern></defs><rect width="2400" height="1600" fill="url(#bg)"/><rect width="2400" height="1600" fill="url(#grid)" opacity="0.55"/><ellipse cx="620" cy="310" rx="420" ry="150" fill="rgba(245,242,236,0.13)"/><circle cx="1970" cy="315" r="150" fill="rgba(233,201,126,0.55)"/><rect x="120" y="1110" width="2160" height="280" rx="28" fill="rgba(7,12,14,0.34)" stroke="rgba(245,242,236,0.16)"/><text x="180" y="1205" fill="#f5f2ec" font-family="Georgia, serif" font-size="72" font-weight="700">${escapedTitle}</text><text x="180" y="1285" fill="#d0d8d5" font-family="Arial, sans-serif" font-size="34">${escapedBiome}</text><text x="180" y="1350" fill="#b7c5c0" font-family="Arial, sans-serif" font-size="28">Placeholder criado pelo MUN. Substitua a imagem quando o asset final estiver pronto.</text></svg>`

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  }

  function ensureWorldMundiMapPlaceholders(requests: WorldMundiMapPlaceholderRequest[]) {
    if (requests.length === 0) {
      return
    }

    updateLibraryState((currentState) => {
      const folderById = new Map(currentState.folders.map((folder) => [folder.id, folder]))
      const nextFolders = [...currentState.folders]
      const nextCustomMaps = [...currentState.customMaps]
      const nextMapFolders = { ...currentState.itemFolders.maps }
      const nextMapOverrides = { ...currentState.mapOverrides }

      function ensureFolder(input: {
        category: TabletopLibraryCategory
        icon: string
        id: string
        name: string
        parentId: string
        sortOrder?: number
      }) {
        if (folderById.has(input.id)) {
          return
        }

        const folder = {
          category: input.category,
          icon: input.icon,
          id: input.id,
          name: input.name,
          parentId: input.parentId,
          sortOrder: input.sortOrder,
        }

        folderById.set(folder.id, folder)
        nextFolders.push(folder)
      }

      requests.forEach((request, index) => {
        ensureFolder({
          category: 'maps',
          icon: 'MAP',
          id: request.rootFolderId,
          name: request.rootFolderName,
          parentId: '',
          sortOrder: 1,
        })
        ensureFolder({
          category: 'maps',
          icon: 'BIO',
          id: request.biomeFolderId,
          name: request.biomeFolderName,
          parentId: request.rootFolderId,
          sortOrder: index + 1,
        })
        ensureFolder({
          category: 'maps',
          icon: 'LOC',
          id: request.folderId,
          name: request.locationName,
          parentId: request.biomeFolderId,
          sortOrder: index + 1,
        })

        if (!nextCustomMaps.some((map) => map.id === request.mapId)) {
          const placeholderImage = buildWorldMundiPlaceholderImage(request)

          nextCustomMaps.push({
            id: request.mapId,
            biome: request.biomeFolderName,
            biomeId: request.biomaId,
            campaignId: activeCampaignId,
            cellSize: 100,
            defaultCamera: {
              zoom: 0.78,
            },
            folderId: request.folderId,
            gridColumns: 24,
            gridRows: 16,
            image: placeholderImage,
            imageUrl: placeholderImage,
            mapVisibility: 'mestre_apenas',
            munLocationId: request.locationId,
            name: request.mapName,
            previewImage: placeholderImage,
            source: 'mun_generated',
            stageHeight: 1600,
            stageWidth: 2400,
            summary: request.summary,
            thumbnailUrl: placeholderImage,
            type: getWorldMundiMapType(request.type),
          })
        }

        nextMapFolders[request.mapId] = request.folderId
        nextMapOverrides[request.mapId] = {
          ...(nextMapOverrides[request.mapId] ?? {}),
          biomeId: request.biomaId,
          campaignId: activeCampaignId,
          folderId: request.folderId,
          munLocationId: request.locationId,
          source: 'mun_generated',
        }
      })

      return createTabletopLibraryState({
        ...currentState,
        customMaps: nextCustomMaps,
        folders: nextFolders,
        itemFolders: {
          ...currentState.itemFolders,
          maps: nextMapFolders,
        },
        mapOverrides: nextMapOverrides,
      })
    })
  }

  function linkWorldMundiLocationToMap(mapId: string, locationId: string) {
    const location =
      worldMundiState.locations.find((entry) => entry.id === locationId) ?? null

    updateLibraryState((currentState) => {
      const nextCustomMaps = currentState.customMaps.map((map) =>
        map.id === mapId
          ? {
              ...map,
              biomeId: location?.biomaId ?? map.biomeId,
              campaignId: activeCampaignId,
              munLocationId: locationId,
              source: map.source ?? 'manual',
            }
          : map,
      )

      return createTabletopLibraryState({
        ...currentState,
        customMaps: nextCustomMaps,
        mapOverrides: {
          ...currentState.mapOverrides,
          [mapId]: {
            ...(currentState.mapOverrides[mapId] ?? {}),
            biomeId: location?.biomaId ?? currentState.mapOverrides[mapId]?.biomeId,
            campaignId: activeCampaignId,
            munLocationId: locationId,
            source: currentState.customMaps.some((map) => map.id === mapId)
              ? (currentState.customMaps.find((map) => map.id === mapId)?.source ?? 'manual')
              : 'manual',
          },
        },
      })
    })
  }

  function setMapVisibility(
    mapId: string,
    mapVisibility: NonNullable<TabletopMap['mapVisibility']>,
  ) {
    updateLibraryState((currentState) =>
      createTabletopLibraryState({
        ...currentState,
        mapOverrides: {
          ...currentState.mapOverrides,
          [mapId]: {
            ...(currentState.mapOverrides[mapId] ?? {}),
            mapVisibility,
          },
        },
      }),
    )
  }

  function prepareMapPreviewScene(mapId: string) {
    if (!data) {
      return ''
    }

    const targetMap =
      availableMaps.find((map) => map.id === mapId) ?? data.tabletop.map ?? null

    if (!targetMap) {
      return ''
    }

    const existingScene =
      scenes.find((scene) => scene.mapId === mapId && scene.id === preparedSceneId) ??
      scenes.find((scene) => scene.mapId === mapId && scene.id.startsWith('scene-map-prep-')) ??
      scenes.find((scene) => scene.mapId === mapId)

    if (existingScene) {
      setPreparedSceneIdOverride(existingScene.id)
      return existingScene.id
    }

    const sourceScene = currentScene ?? scenes[0] ?? null

    if (!sourceScene) {
      return ''
    }

    const candidateSceneId = `scene-map-prep-${mapId}`
    const nextSceneId = scenes.some((scene) => scene.id === candidateSceneId)
      ? buildSceneId()
      : candidateSceneId
    const mapPreset = getMapVisualPreset({
      biomes: availableBiomes,
      map: targetMap,
    })
    const nextScene: TabletopScene = {
      ...sourceScene,
      cameraState: undefined,
      gridCellSize: targetMap.cellSize,
      id: nextSceneId,
      mapId,
      metadata: {
        ...createEmptySceneMetadata(),
        ...mapPreset,
      },
      name: `${targetMap.name} - preparo`,
      tokens: [],
    }

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.some((scene) => scene.id === nextScene.id)
          ? currentSession.scenes
          : [...currentSession.scenes, nextScene],
        selectedTokenId: '',
        selectedTokenIds: [],
      }),
    )
    setPreparedSceneIdOverride(nextScene.id)
    setInspectedTokenId('')

    return nextScene.id
  }

  function openWorldMundiMap(mapId: string) {
    setFocusedMapLibraryId(mapId)
    setMapVisibility(mapId, 'preparado')
    prepareMapPreviewScene(mapId)

    setActiveHudPanel('maps')
    setTableFeedbackMessage('Mapa local aberto no MAP em modo preparacao.')
  }

  function prepareMapForGm(mapId: string) {
    setFocusedMapLibraryId(mapId)
    setMapVisibility(mapId, 'preparado')
    prepareMapPreviewScene(mapId)

    setActiveHudPanel('maps')
    setTableFeedbackMessage('Mapa em preparacao. Jogadores ainda nao veem.')
  }

  function activateMapForPlayers(mapId: string) {
    const existingScene =
      scenes.find((scene) => scene.id === preparedSceneId && scene.mapId === mapId) ??
      scenes.find((scene) => scene.mapId === mapId) ??
      null

    if (existingScene) {
      setMapVisibility(mapId, 'ativo_para_jogadores')
      enterScene(existingScene.id)
      setTableFeedbackMessage('Mapa ativado para os jogadores.')
      return
    }

    if (!data) {
      return
    }

    const targetMap =
      availableMaps.find((map) => map.id === mapId) ?? data.tabletop.map ?? null
    const sourceScene = currentScene ?? scenes[0] ?? null

    if (!targetMap || !sourceScene) {
      return
    }

    const nextSceneId = `scene-map-prep-${mapId}`
    const mapPreset = getMapVisualPreset({
      biomes: availableBiomes,
      map: targetMap,
    })
    const nextScene: TabletopScene = {
      ...sourceScene,
      cameraState: undefined,
      gridCellSize: targetMap.cellSize,
      id: nextSceneId,
      mapId,
      metadata: {
        ...createEmptySceneMetadata(),
        ...mapPreset,
      },
      name: `${targetMap.name} - preparo`,
      tokens: [],
    }
    const nextSceneRuntime = resolveTabletopSceneRuntime({
      assetLibrary,
      scene: nextScene,
    })

    setMapVisibility(mapId, 'ativo_para_jogadores')
    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: nextScene.id,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.some((scene) => scene.id === nextScene.id)
          ? currentSession.scenes
          : [...currentSession.scenes, nextScene],
        selectedTokenId: '',
        selectedTokenIds: [],
        zoom: getSceneCameraZoom({
          cameraRuntime: nextSceneRuntime.camera,
          scene: nextScene,
        }),
      }),
    )
    setPreparedSceneIdOverride(nextScene.id)
    setInspectedTokenId('')
    setActiveHudPanel(null)
    setSceneEntryId((currentValue) => currentValue + 1)
    setTableFeedbackMessage('Mapa ativado para os jogadores.')
  }

  function hideMapFromPlayers(mapId: string) {
    const shouldHide = window.confirm(
      'Isso vai remover o mapa atual da visao dos jogadores. Confirmar?',
    )

    if (!shouldHide) {
      return
    }

    setMapVisibility(mapId, 'mestre_apenas')
    setTableFeedbackMessage('Mapa oculto dos jogadores.')
  }

  function returnToActivePlayerMap() {
    setPreparedSceneIdOverride(currentSceneId)
    setFocusedMapLibraryId(currentScene?.mapId ?? '')
    setTableFeedbackMessage('Mestre voltou ao mapa ativo dos jogadores.')
  }

  function handleCreateMap(folderId: string) {
    const baseMap = activeMap ?? data?.tabletop.map

    if (!baseMap) {
      return
    }

    const nextMap: TabletopMap = {
      ...baseMap,
      id: buildLibraryItemId('map'),
      campaignId: activeCampaignId,
      mapVisibility: 'mestre_apenas',
      name: `Novo mapa ${libraryState.customMaps.length + 1}`,
      source: 'manual',
      summary: 'Mapa local criado pelo mestre.',
      folderId,
    }

    updateLibraryState((currentState) => ({
      ...currentState,
      customMaps: [...currentState.customMaps, nextMap],
      itemFolders: {
        ...currentState.itemFolders,
        maps: {
          ...currentState.itemFolders.maps,
          [nextMap.id]: folderId,
        },
      },
    }))
    setConfigureMapId(nextMap.id)
  }

  function handleSaveMapConfiguration(nextMap: MapConfigurationSaveData) {
    const folderId = nextMap.folderId ?? ''

    updateLibraryState((currentState) => {
      const isCustomMap = currentState.customMaps.some((map) => map.id === nextMap.id)
      const nextCustomMaps = isCustomMap
        ? currentState.customMaps.map((map) =>
            map.id === nextMap.id ? { ...nextMap, folderId } : map,
          )
        : currentState.customMaps
      const mapOverride: Partial<TabletopMap> = { ...nextMap }
      delete mapOverride.folderId

      return {
        ...currentState,
        customMaps: nextCustomMaps,
        itemFolders: {
          ...currentState.itemFolders,
          maps: {
            ...currentState.itemFolders.maps,
            [nextMap.id]: folderId,
          },
        },
        mapOverrides: isCustomMap
          ? currentState.mapOverrides
          : {
              ...currentState.mapOverrides,
              [nextMap.id]: mapOverride,
            },
      }
    })
  }

  function handleCreateTransition(folderId: string) {
    const fallbackTransition = availableTransitions[0] ?? null
    const fallbackMap = activeMap ?? data?.tabletop.map ?? availableMaps[0] ?? null
    const biomeId =
      fallbackMap?.biomeId ?? availableBiomes[0]?.id ?? fallbackTransition?.biomeId ?? 'custom'
    const nextTransition = {
      id: buildLibraryItemId('interlude'),
      name: `Novo interludio ${libraryState.customTransitions.length + 1}`,
      summary: 'Interludio local criado pelo mestre.',
      category: 'transition',
      folderId,
      biomeId,
      fromMapId: currentScene?.mapId,
      toMapId: currentScene?.mapId ?? fallbackMap?.id,
      type: 'image' as const,
      assetUrl: fallbackTransition?.assetUrl ?? fallbackMap?.image ?? '',
      thumbnailUrl:
        fallbackTransition?.thumbnailUrl ??
        fallbackMap?.thumbnailUrl ??
        fallbackMap?.previewImage ??
        fallbackMap?.image,
      description: 'Configure a midia e o destino antes de mostrar aos jogadores.',
    }

    updateLibraryState((currentState) => ({
      ...currentState,
      customTransitions: [...currentState.customTransitions, nextTransition],
      itemFolders: {
        ...currentState.itemFolders,
        transitions: {
          ...currentState.itemFolders.transitions,
          [nextTransition.id]: folderId,
        },
      },
    }))
    setConfigureTransitionId(nextTransition.id)
  }

  function handleCreateMusicTrack(input: TabletopMusicCreateInput) {
    const nextTrack: TabletopMediaAsset = {
      id: buildLibraryItemId(input.libraryType === 'music' ? 'music' : 'ambience'),
      name: input.name,
      summary: input.summary,
      category: input.category,
      folderId: input.folderId,
      source: input.source,
    }

    updateLibraryState((currentState) => ({
      ...currentState,
      customAmbienceTracks:
        input.libraryType === 'ambience'
          ? [...currentState.customAmbienceTracks, nextTrack]
          : currentState.customAmbienceTracks,
      customMusicTracks:
        input.libraryType === 'music'
          ? [...currentState.customMusicTracks, nextTrack]
          : currentState.customMusicTracks,
      itemFolders: {
        ...currentState.itemFolders,
        music: {
          ...currentState.itemFolders.music,
          [nextTrack.id]: input.folderId,
        },
      },
    }))
  }

  function deleteLibraryMap(mapId: string) {
    if (scenes.some((scene) => scene.mapId === mapId)) {
      window.alert('Esse mapa esta sendo usado por uma cena. Troque a cena de mapa antes de excluir.')
      return
    }

    updateLibraryState((currentState) => {
      const isCustomMap = currentState.customMaps.some((map) => map.id === mapId)

      return {
        ...currentState,
        customMaps: currentState.customMaps.filter((map) => map.id !== mapId),
        hiddenItems: {
          ...currentState.hiddenItems,
          maps: isCustomMap
            ? removeRecordKey(currentState.hiddenItems.maps, mapId)
            : {
                ...currentState.hiddenItems.maps,
                [mapId]: true,
              },
        },
        itemFolders: {
          ...currentState.itemFolders,
          maps: removeRecordKey(currentState.itemFolders.maps, mapId),
        },
        mapOverrides: removeRecordKey(currentState.mapOverrides, mapId),
      }
    })
  }

  function deleteLibraryTransition(transitionId: string) {
    updateLibraryState((currentState) => {
      const isCustomTransition = currentState.customTransitions.some(
        (transition) => transition.id === transitionId,
      )

      return {
        ...currentState,
        customTransitions: currentState.customTransitions.filter(
          (transition) => transition.id !== transitionId,
        ),
        hiddenItems: {
          ...currentState.hiddenItems,
          transitions: isCustomTransition
            ? removeRecordKey(currentState.hiddenItems.transitions, transitionId)
            : {
                ...currentState.hiddenItems.transitions,
                [transitionId]: true,
              },
        },
        itemFolders: {
          ...currentState.itemFolders,
          transitions: removeRecordKey(
            currentState.itemFolders.transitions,
            transitionId,
          ),
        },
      }
    })
    setTransitionOverrides((currentOverrides) =>
      removeRecordKey(currentOverrides, transitionId),
    )
  }

  function hideLibraryCharacter(characterId: string) {
    updateLibraryState((currentState) => ({
      ...currentState,
      hiddenItems: {
        ...currentState.hiddenItems,
        npcs: {
          ...currentState.hiddenItems.npcs,
          [characterId]: true,
        },
      },
      itemFolders: {
        ...currentState.itemFolders,
        npcs: removeRecordKey(currentState.itemFolders.npcs, characterId),
      },
    }))
  }

  function deleteLibraryTrack(trackId: string) {
    const audioElement = mixerAudioElementsRef.current[trackId]

    if (audioElement) {
      stopAudioElement(audioElement)
      audioElement.removeAttribute('src')
      audioElement.load()
      delete mixerAudioElementsRef.current[trackId]
    }

    setMixerTracks((currentTracks) => removeRecordKey(currentTracks, trackId))
    updateLibraryState((currentState) => {
      const isCustomMusicTrack = currentState.customMusicTracks.some(
        (track) => track.id === trackId,
      )
      const isCustomAmbienceTrack = currentState.customAmbienceTracks.some(
        (track) => track.id === trackId,
      )
      const isCustomTrack = isCustomMusicTrack || isCustomAmbienceTrack

      return {
        ...currentState,
        customAmbienceTracks: currentState.customAmbienceTracks.filter(
          (track) => track.id !== trackId,
        ),
        customMusicTracks: currentState.customMusicTracks.filter(
          (track) => track.id !== trackId,
        ),
        favoriteTrackIds: currentState.favoriteTrackIds.filter(
          (favoriteTrackId) => favoriteTrackId !== trackId,
        ),
        hiddenItems: {
          ...currentState.hiddenItems,
          music: isCustomTrack
            ? removeRecordKey(currentState.hiddenItems.music, trackId)
            : {
                ...currentState.hiddenItems.music,
                [trackId]: true,
              },
        },
        itemFolders: {
          ...currentState.itemFolders,
          music: removeRecordKey(currentState.itemFolders.music, trackId),
        },
        trackVolumes: removeRecordKey(currentState.trackVolumes, trackId),
      }
    })
  }

  function updateCurrentScene(
    updater: (scene: TabletopScene) => TabletopScene,
  ) {
    updateSession((currentSession) => {
      const nextScenes = currentSession.scenes.map((scene) =>
        scene.id === boardSceneId ? updater(scene) : scene,
      )

      return createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: nextScenes,
        tokens:
          nextScenes.find((scene) => scene.id === boardSceneId)?.tokens ?? tokens,
      })
    })
  }

  function setSelection(nextTokenIds: string[]) {
    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes,
        selectedTokenIds: nextTokenIds,
        selectedTokenId: nextTokenIds[nextTokenIds.length - 1] ?? '',
        logEntries: currentSession.logEntries,
      }),
    )
  }

  function persistCurrentSceneCamera(input: {
    sceneId: string
    scrollLeft: number
    scrollTop: number
    zoom: number
  }) {
    pendingViewportCameraRef.current = input

    if (cameraPersistFrameRef.current !== null) {
      return
    }

    cameraPersistFrameRef.current = window.requestAnimationFrame(() => {
      cameraPersistFrameRef.current = null
      const nextCameraState = pendingViewportCameraRef.current

      if (!nextCameraState) {
        return
      }

      pendingViewportCameraRef.current = null

      updateSession((currentSession) => {
        const sceneToUpdate =
          currentSession.scenes.find((scene) => scene.id === nextCameraState.sceneId) ??
          null

        if (!sceneToUpdate) {
          return currentSession
        }

        const previousCameraState = sceneToUpdate.cameraState ?? {}
        const hasChanged =
          Math.abs((previousCameraState.scrollLeft ?? 0) - nextCameraState.scrollLeft) >
            0.5 ||
          Math.abs((previousCameraState.scrollTop ?? 0) - nextCameraState.scrollTop) > 0.5 ||
          Math.abs((previousCameraState.zoom ?? currentSession.zoom) - nextCameraState.zoom) >
            0.001

        if (!hasChanged) {
          return currentSession
        }

        return createPersistedTabletopSession({
          ...currentSession,
          currentSceneId: currentSession.currentSceneId,
          initialSceneId: currentSession.initialSceneId,
          scenes: currentSession.scenes.map((scene) =>
            scene.id === nextCameraState.sceneId
              ? {
                  ...scene,
                  cameraState: {
                    ...scene.cameraState,
                    scrollLeft: nextCameraState.scrollLeft,
                    scrollTop: nextCameraState.scrollTop,
                    zoom: nextCameraState.zoom,
                  },
                }
              : scene,
          ),
          zoom: nextCameraState.zoom,
        })
      })
    })
  }

  function handleViewportCameraChange(input: {
    scrollLeft: number
    scrollTop: number
  }) {
    if (!boardScene || viewMode !== 'gm') {
      return
    }

    persistCurrentSceneCamera({
      sceneId: boardScene.id,
      scrollLeft: input.scrollLeft,
      scrollTop: input.scrollTop,
      zoom,
    })
  }

  function ensureSceneHasPlayerToken(
    sceneTokens: TabletopToken[],
    map: TabletopMap,
  ) {
    const nextTokens = sceneTokens.map((token) => ({
      ...token,
      cell: clampTabletopTokenCell(token.cell, map, token),
    }))
    const hasPlayerToken = nextTokens.some((token) =>
      playerCharacters.some((character) => character.id === token.characterId),
    )

    if (hasPlayerToken || playerCharacters.length === 0) {
      return nextTokens
    }

    const fallbackPlayer = focusedPlayerCharacter ?? playerCharacters[0] ?? null

    if (!fallbackPlayer) {
      return nextTokens
    }

    return [
      ...nextTokens,
      createTokenForCharacter({
        character: fallbackPlayer,
        existingTokens: nextTokens,
        map,
      }),
    ]
  }

  function prepareScene(sceneId: string) {
    const targetScene = scenes.find((scene) => scene.id === sceneId) ?? null

    if (!targetScene) {
      return
    }

    setPreparedSceneIdOverride(sceneId)
    setAudioStatusMessage('')
    setTableFeedbackMessage(`Cena preparada: ${targetScene.name}`)
    appendLogEntry({
      id: buildRuntimeEventId(`log-scene-prepared-${sceneId}`),
      type: 'system',
      visibility: 'gm',
      author: 'Mesa',
      text: `Cena preparada: ${targetScene.name}`,
      createdAt: new Date().toISOString(),
    })
  }

  function openIntroOverlay(sceneId: string, introCardId: string) {
    setIntroOverlayState((currentState) => ({
      sceneId,
      introCardId,
      triggerId: (currentState?.triggerId ?? 0) + 1,
    }))
  }

  function enterScene(sceneId = preparedSceneId) {
    const nextScene = scenes.find((scene) => scene.id === sceneId) ?? null

    if (!nextScene) {
      return
    }

    const nextSceneRuntime = resolveTabletopSceneRuntime({
      scene: nextScene,
      assetLibrary,
    })

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: nextScene.id,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes,
        selectedTokenIds: [],
        selectedTokenId: '',
        zoom: getSceneCameraZoom({
          scene: nextScene,
          cameraRuntime: nextSceneRuntime.camera,
        }),
      }),
    )
    setPreparedSceneIdOverride(nextScene.id)
    setInspectedTokenId('')
    setActiveHudPanel(null)
    setAudioStatusMessage('Cena pronta. Audio segue manual.')
    setSceneEntryId((currentValue) => currentValue + 1)
    setAudioTransportState('stopped')
    setTransitionOverlayState(null)
    setCinematicOverlayState(null)
    setTableFeedbackMessage(`Cena na mesa: ${nextScene.name}`)
    appendLogEntry({
      id: buildRuntimeEventId(`log-scene-enter-${nextScene.id}`),
      type: 'system',
      visibility: 'gm',
      author: 'Mesa',
      text: `Cena entrou na mesa: ${nextScene.name}`,
      createdAt: new Date().toISOString(),
    })

    if (nextSceneRuntime.introCard) {
      openIntroOverlay(nextScene.id, nextSceneRuntime.introCard.id)
    } else {
      setIntroOverlayState(null)
    }
  }

  function createScene() {
    if (!data) {
      return
    }

    const sourceScene = preparedScene ?? currentScene

    if (!sourceScene) {
      return
    }

    const sourceMap = resolveMapById(availableMaps, data.tabletop.map, sourceScene.mapId)
    const nextScene: TabletopScene = {
      ...sourceScene,
      id: buildSceneId(),
      name: `Nova cena ${scenes.length + 1}`,
      tokens: ensureSceneHasPlayerToken(sourceScene.tokens, sourceMap),
      gridCellSize: sourceScene.gridCellSize ?? sourceMap.cellSize,
      cameraState: sourceScene.cameraState
        ? { ...sourceScene.cameraState }
        : undefined,
      metadata: createEmptySceneMetadata(),
    }

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: [...currentSession.scenes, nextScene],
      }),
    )
    setPreparedSceneIdOverride(nextScene.id)
    setInspectedTokenId('')
    setAudioStatusMessage('')
  }

  function duplicateScene(sceneId: string) {
    if (!data) {
      return
    }

    const sourceScene = scenes.find((scene) => scene.id === sceneId) ?? null

    if (!sourceScene) {
      return
    }

    const sourceMap = resolveMapById(availableMaps, data.tabletop.map, sourceScene.mapId)
    const nextScene: TabletopScene = {
      ...sourceScene,
      id: buildSceneId(),
      name: `${sourceScene.name} copia`,
      tokens: ensureSceneHasPlayerToken(sourceScene.tokens, sourceMap),
      gridCellSize: sourceScene.gridCellSize ?? sourceMap.cellSize,
      cameraState: sourceScene.cameraState
        ? { ...sourceScene.cameraState }
        : undefined,
      metadata: { ...sourceScene.metadata },
    }

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: [...currentSession.scenes, nextScene],
      }),
    )
    setPreparedSceneIdOverride(nextScene.id)
    setInspectedTokenId('')
    setAudioStatusMessage('')
  }

  function renameScene(sceneId: string, name: string) {
    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                name,
              }
            : scene,
        ),
      }),
    )
  }

  function deleteScene(sceneId: string) {
    if (scenes.length <= 1) {
      return
    }

    const fallbackScene = scenes.find((scene) => scene.id !== sceneId) ?? null

    if (!fallbackScene) {
      return
    }

    updateSession((currentSession) => {
      const nextScenes = currentSession.scenes.filter((scene) => scene.id !== sceneId)
      const nextCurrentSceneId =
        currentSession.currentSceneId === sceneId
          ? fallbackScene.id
          : currentSession.currentSceneId
      const nextInitialSceneId =
        currentSession.initialSceneId === sceneId
          ? fallbackScene.id
          : currentSession.initialSceneId
      const nextCurrentScene =
        nextScenes.find((scene) => scene.id === nextCurrentSceneId) ?? nextScenes[0]

      return createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: nextCurrentSceneId,
        initialSceneId: nextInitialSceneId,
        scenes: nextScenes,
        tokens: nextCurrentScene?.tokens ?? [],
        selectedTokenIds: [],
        selectedTokenId: '',
      })
    })
    setPreparedSceneIdOverride((currentId) =>
      currentId === sceneId || preparedSceneId === sceneId ? fallbackScene.id : currentId,
    )
    setIntroOverlayState(null)
    setTransitionOverlayState(null)
    setCinematicOverlayState(null)
    setInspectedTokenId('')
    setAudioStatusMessage('')
    setAudioTransportState('stopped')
  }

  function setInitialScene(sceneId: string) {
    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: sceneId,
        scenes: currentSession.scenes,
      }),
    )
  }

  function updateSceneMap(sceneId: string, mapId: string) {
    if (!data) {
      return
    }

    const targetMap = resolveMapById(availableMaps, data.tabletop.map, mapId)
    const mapPreset = getMapVisualPreset({
      map: targetMap,
      biomes: data.tabletop.biomes,
    })

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                mapId,
                gridCellSize: targetMap.cellSize,
                tokens: scene.tokens.map((token) => ({
                  ...token,
                  cell: clampTabletopTokenCell(token.cell, targetMap, token),
                })),
                metadata: {
                  ...scene.metadata,
                  ...mapPreset,
                },
              }
            : scene,
        ),
      }),
    )

    const targetScene = scenes.find((scene) => scene.id === sceneId) ?? null
    const feedbackTarget = sceneId === currentSceneId ? 'Mapa na mesa' : 'Mapa atualizado'

    setTableFeedbackMessage(`${feedbackTarget}: ${targetMap.name}`)
    appendLogEntry({
      id: buildRuntimeEventId(`log-map-update-${sceneId}-${targetMap.id}`),
      type: 'system',
      visibility: 'gm',
      author: 'Mesa',
      text: `${feedbackTarget}: ${targetScene?.name ?? 'Cena'} -> ${targetMap.name}`,
      createdAt: new Date().toISOString(),
    })
  }

  function updateSceneMetadata<K extends keyof TabletopScene['metadata']>(
    sceneId: string,
    key: K,
    value: TabletopScene['metadata'][K],
  ) {
    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                metadata: {
                  ...scene.metadata,
                  [key]: value,
                },
              }
            : scene,
        ),
      }),
    )
  }

  function updateSceneGridCellSize(sceneId: string, nextCellSize: number) {
    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                gridCellSize: clampTabletopGridCellSize(nextCellSize),
              }
            : scene,
        ),
      }),
    )
  }

  function setMixerTrackState(
    trackId: string,
    updater: (currentState: TabletopMixerTrackState) => TabletopMixerTrackState,
  ) {
    setMixerTracks((currentTracks) => {
      const currentState =
        currentTracks[trackId] ?? {
          currentTime: 0,
          duration: 0,
          status: 'stopped' as const,
          volume: libraryState.trackVolumes[trackId] ?? 0.35,
        }

      return {
        ...currentTracks,
        [trackId]: updater(currentState),
      }
    })
  }

  function ensureMixerAudioElement(track: TabletopMusicLibraryItem) {
    let audioElement = mixerAudioElementsRef.current[track.id]

    if (!audioElement) {
      audioElement = createTabletopAudioElement()
      audioElement.volume = sanitizeAudioVolume(
        mixerTracks[track.id]?.volume ?? libraryState.trackVolumes[track.id] ?? 0.35,
      )
      audioElement.onloadedmetadata = () => {
        setMixerTrackState(track.id, (currentState) => ({
          ...currentState,
          duration: Number.isFinite(audioElement.duration) ? audioElement.duration : 0,
        }))
      }
      audioElement.ontimeupdate = () => {
        setMixerTrackState(track.id, (currentState) => ({
          ...currentState,
          currentTime: audioElement.currentTime,
          duration: Number.isFinite(audioElement.duration)
            ? audioElement.duration
            : currentState.duration,
        }))
      }
      mixerAudioElementsRef.current[track.id] = audioElement
    }

    if (audioElement.getAttribute('src') !== track.source) {
      stopAudioElement(audioElement)
      audioElement.src = track.source
      audioElement.load()
      setMixerTrackState(track.id, (currentState) => ({
        ...currentState,
        currentTime: 0,
        duration: 0,
        status: 'stopped',
      }))
    }

    return audioElement
  }

  async function playMixerTrack(track: TabletopMusicLibraryItem) {
    if (!track.source) {
      return
    }

    const audioElement = ensureMixerAudioElement(track)
    audioElement.volume = sanitizeAudioVolume(
      mixerTracks[track.id]?.volume ?? libraryState.trackVolumes[track.id] ?? 0.35,
    )

    try {
      await audioElement.play()
      setMixerTrackState(track.id, (currentState) => ({
        ...currentState,
        currentTime: audioElement.currentTime,
        duration: Number.isFinite(audioElement.duration)
          ? audioElement.duration
          : currentState.duration,
        status: 'playing',
        volume: audioElement.volume,
      }))
      setLibraryAudioStatusMessage('')
    } catch {
      setLibraryAudioStatusMessage(
        'Autoplay bloqueado pelo navegador. Clique em Ativar novamente para liberar o som.',
      )
    }
  }

  function pauseMixerTrack(trackId: string) {
    const audioElement = mixerAudioElementsRef.current[trackId]

    if (!audioElement) {
      return
    }

    audioElement.pause()
    setMixerTrackState(trackId, (currentState) => ({
      ...currentState,
      currentTime: audioElement.currentTime,
      status: 'paused',
    }))
  }

  function stopMixerTrack(trackId: string) {
    const audioElement = mixerAudioElementsRef.current[trackId]

    if (!audioElement) {
      setMixerTrackState(trackId, (currentState) => ({
        ...currentState,
        currentTime: 0,
        status: 'stopped',
      }))
      return
    }

    stopAudioElement(audioElement)
    setMixerTrackState(trackId, (currentState) => ({
      ...currentState,
      currentTime: 0,
      duration: Number.isFinite(audioElement.duration)
        ? audioElement.duration
        : currentState.duration,
      status: 'stopped',
    }))
  }

  function seekMixerTrack(trackId: string, time: number) {
    const audioElement = mixerAudioElementsRef.current[trackId]
    const nextTime = Math.max(0, time)

    if (audioElement) {
      audioElement.currentTime = Math.min(
        nextTime,
        Number.isFinite(audioElement.duration) ? audioElement.duration : nextTime,
      )
    }

    setMixerTrackState(trackId, (currentState) => ({
      ...currentState,
      currentTime: audioElement?.currentTime ?? nextTime,
    }))
  }

  function setMixerTrackVolume(trackId: string, volume: number) {
    const nextVolume = sanitizeAudioVolume(volume)
    const audioElement = mixerAudioElementsRef.current[trackId]

    if (audioElement) {
      audioElement.volume = nextVolume
    }

    setMixerTrackState(trackId, (currentState) => ({
      ...currentState,
      volume: nextVolume,
    }))
    updateLibraryState((currentState) => ({
      ...currentState,
      trackVolumes: {
        ...currentState.trackVolumes,
        [trackId]: nextVolume,
      },
    }))
  }

  function toggleFavoriteTrack(trackId: string) {
    updateLibraryState((currentState) => {
      const isFavorite = currentState.favoriteTrackIds.includes(trackId)

      return {
        ...currentState,
        favoriteTrackIds: isFavorite
          ? currentState.favoriteTrackIds.filter(
              (favoriteTrackId) => favoriteTrackId !== trackId,
            )
          : [...currentState.favoriteTrackIds, trackId],
      }
    })
  }

  function playFavoriteTracks() {
    const favoriteTracks = libraryState.favoriteTrackIds
      .map((trackId) => audioLibraryTracks.find((track) => track.id === trackId))
      .filter((track): track is TabletopMusicLibraryItem => Boolean(track))

    favoriteTracks.forEach((track) => {
      void playMixerTrack(track)
    })
  }

  function pauseAllMixerTracks() {
    Object.entries(mixerAudioElementsRef.current).forEach(([trackId, audioElement]) => {
      audioElement.pause()
      setMixerTrackState(trackId, (currentState) => ({
        ...currentState,
        currentTime: audioElement.currentTime,
        status: currentState.status === 'stopped' ? 'stopped' : 'paused',
      }))
    })
  }

  function stopAllMixerTracks() {
    Object.entries(mixerAudioElementsRef.current).forEach(([trackId, audioElement]) => {
      stopAudioElement(audioElement)
      setMixerTrackState(trackId, (currentState) => ({
        ...currentState,
        currentTime: 0,
        status: 'stopped',
      }))
    })
  }

  function triggerSceneIntroOverlay() {
    if (!currentScene || !activeIntroCard) {
      return
    }

    openIntroOverlay(currentScene.id, activeIntroCard.id)
  }

  function triggerTransitionOverlay(transitionId: string) {
    if (availableTransitions.length === 0) {
      return
    }

    const transition =
      availableTransitions.find((asset) => asset.id === transitionId) ?? null

    if (!transition) {
      return
    }

    setTransitionOverlayState((currentState) => ({
      transitionId: transition.id,
      triggerId: (currentState?.triggerId ?? 0) + 1,
    }))
    setTableFeedbackMessage(`Transicao aberta: ${transition.name}`)
    appendLogEntry({
      id: buildRuntimeEventId(`log-transition-${transition.id}`),
      type: 'system',
      visibility: 'gm',
      author: 'Mesa',
      text: `Transicao exibida: ${transition.name}`,
      createdAt: new Date().toISOString(),
    })
  }

  function handleTransitionPlaybackStateChange(
    nextState: SharedTransitionPlaybackState,
  ) {
    setSharedTransitionPlaybackState(nextState)
    writeSharedTransitionPlaybackState(nextState)
  }

  function closeTransitionOverlay() {
    setTransitionOverlayState(null)
    setSharedTransitionPlaybackState(null)
    clearSharedTransitionPlaybackState()
  }

  function applyTransitionToScene(mapId: string) {
    if (!currentScene || !mapId) {
      closeTransitionOverlay()
      return
    }

    const sceneId = currentScene.id

    closeTransitionOverlay()

    window.requestAnimationFrame(() => {
      updateSceneMap(sceneId, mapId)
      setSceneReturnTransitionActive(true)
    })
  }

  function concludeTransitionOverlay() {
    if (!activeTransitionOverlay) {
      closeTransitionOverlay()
      return
    }

    if (!activeTransitionOverlay.toMapId) {
      closeTransitionOverlay()
      return
    }

    applyTransitionToScene(activeTransitionOverlay.toMapId)
  }

  function handleSaveTransitionOverride(
    transition: NonNullable<typeof configurableTransition>,
    config: PersistedTransitionOverride & { customName?: string },
  ) {
    if (config.customName?.trim()) {
      updateLibraryState((currentState) => ({
        ...currentState,
        customTransitions: currentState.customTransitions.map((currentTransition) =>
          currentTransition.id === transition.id
            ? {
                ...currentTransition,
                name: config.customName?.trim() ?? currentTransition.name,
              }
            : currentTransition,
        ),
      }))
    }

    setTransitionOverrides((currentOverrides) => {
      const nextOverrides = { ...currentOverrides }
      const nextOverride: PersistedTransitionOverride = {}

      if (config.assetUrl && config.assetUrl !== transition.assetUrl) {
        nextOverride.assetUrl = config.assetUrl
      }

      if (config.thumbnailUrl && config.thumbnailUrl !== transition.thumbnailUrl) {
        nextOverride.thumbnailUrl = config.thumbnailUrl
      }

      if (config.toMapId && config.toMapId !== transition.toMapId) {
        nextOverride.toMapId = config.toMapId
      }

      if (config.type && config.type !== transition.type) {
        nextOverride.type = config.type
      }

      if (Object.keys(nextOverride).length > 0) {
        nextOverrides[transition.id] = nextOverride
      } else {
        delete nextOverrides[transition.id]
      }

      return nextOverrides
    })
  }

  function applyCinematicToPreparedScene(cinematicId: string) {
    if (!preparedScene || !assetLibrary) {
      return
    }

    const cinematic =
      assetLibrary.cinematics.find((asset) => asset.id === cinematicId) ?? null

    if (!cinematic) {
      return
    }

    updateSceneMetadata(preparedScene.id, 'cinematicId', cinematic.id)
  }

  function triggerCinematicOverlay(cinematicId: string) {
    if (!assetLibrary) {
      return
    }

    const cinematic =
      assetLibrary.cinematics.find((asset) => asset.id === cinematicId) ?? null

    if (!cinematic) {
      return
    }

    setCinematicOverlayState((currentState) => ({
      cinematicId: cinematic.id,
      triggerId: (currentState?.triggerId ?? 0) + 1,
    }))
  }

  function appendLogEntry(entry: TabletopLogEntry) {
    updateSession((currentSession) => ({
      ...currentSession,
      logEntries: [...currentSession.logEntries, entry].slice(-80),
    }))
  }

  function clearLogEntries() {
    updateSession((currentSession) => ({
      ...currentSession,
      logEntries: [],
    }))
  }

  function openImagePreview(src: string, label: string) {
    setImagePreviewState({
      id: buildRuntimeEventId('image-preview-local'),
      src,
      label,
      createdAt: getRuntimeTimestamp(),
    })
  }

  function broadcastImagePreview(src: string, label: string) {
    const nextPreviewState = {
      id: buildRuntimeEventId('image-preview-shared'),
      src,
      label,
      createdAt: getRuntimeTimestamp(),
    }

    setImagePreviewState(nextPreviewState)
    writeSharedImagePreviewState(nextPreviewState)
  }

  function closeImagePreview() {
    setImagePreviewState(null)
    clearSharedImagePreviewState()
  }

  function handleAudioPlay() {
    if (!activeSceneAudio.music && !activeSceneAudio.ambience) {
      setAudioStatusMessage('A cena atual nao tem musica ou ambiencia definida.')
      setAudioTransportState('stopped')
      return
    }

    setAudioStatusMessage('')
    setAudioTransportState('playing')
  }

  function handleAudioPause() {
    setAudioTransportState('paused')
  }

  function handleAudioStop() {
    setAudioTransportState('stopped')
  }

  function handleTokenOpen(tokenId: string) {
    const nextToken = visibleTokens.find((token) => token.id === tokenId) ?? null

    if (!nextToken || !data) {
      return
    }

    if (viewMode === 'player') {
      const nextCharacter = getCharacterById(data, nextToken.characterId)

      if (canActivePlayerControlToken(nextToken)) {
        setInspectedTokenId(nextToken.id)
        return
      }

      const previewSource =
        nextCharacter?.avatarUrl ??
        nextCharacter?.tokenImageUrl ??
        nextCharacter?.topdownImageUrl ??
        ''

      if (previewSource && nextCharacter) {
        openImagePreview(previewSource, nextCharacter.nome)
      }

      return
    }

    setInspectedTokenId(nextToken.id)
  }

  function handleWheelZoom(input: {
    deltaY: number
    offsetX: number
    offsetY: number
  }) {
    if (viewMode === 'player' && gmCameraControlEnabled) {
      return
    }

    const viewport = viewportRef.current

    if (!viewport) {
      return
    }

    const nextZoom = Math.max(
      MIN_TABLETOP_ZOOM,
      Math.min(
        MAX_TABLETOP_ZOOM,
        effectiveZoom + (input.deltaY > 0 ? -0.12 : 0.12),
      ),
    )

    if (Math.abs(nextZoom - effectiveZoom) < 0.001) {
      return
    }

    const nextScrollLeft =
      ((viewport.scrollLeft + input.offsetX) / effectiveZoom) * nextZoom - input.offsetX
    const nextScrollTop =
      ((viewport.scrollTop + input.offsetY) / effectiveZoom) * nextZoom - input.offsetY

    if (viewMode === 'player') {
      setPlayerLocalZoomByScene((currentValue) => ({
        ...currentValue,
        [currentSceneId]: nextZoom,
      }))

      window.requestAnimationFrame(() => {
        viewport.scrollLeft = nextScrollLeft
        viewport.scrollTop = nextScrollTop
      })
      return
    }

    updateSession((currentSession) => ({
      ...createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.map((scene) =>
          scene.id === boardSceneId
            ? {
                ...scene,
                cameraState: {
                  ...scene.cameraState,
                  zoom: nextZoom,
                },
              }
            : scene,
        ),
        zoom: nextZoom,
      }),
    }))

    window.requestAnimationFrame(() => {
      viewport.scrollLeft = nextScrollLeft
      viewport.scrollTop = nextScrollTop
      persistCurrentSceneCamera({
        sceneId: boardSceneId,
        scrollLeft: nextScrollLeft,
        scrollTop: nextScrollTop,
        zoom: nextZoom,
      })
    })
  }

  function handlePing(cell: { column: number; row: number }) {
    const createdAt = getRuntimeTimestamp()
    const nextPing: TabletopPing = {
      id: buildRuntimeEventId('ping'),
      cell,
      authorView: viewMode,
      createdAt,
    }

    setPings((currentPings) => [...currentPings, nextPing].slice(-8))
    pingTimeoutsRef.current.push(
      window.setTimeout(() => {
        setPings((currentPings) =>
          currentPings.filter((currentPing) => currentPing.id !== nextPing.id),
        )
      }, 1600),
    )
    appendLogEntry({
      id: `log-ping-${nextPing.id}`,
      type: 'ping',
      visibility: 'public',
      author: viewMode === 'gm' ? 'Mestre' : 'Jogador',
      text: 'Ping no mapa',
      createdAt: new Date().toISOString(),
    })
  }

  function handleTokenSelect(tokenId: string, options: { additive: boolean }) {
    const nextToken = visibleTokens.find((token) => token.id === tokenId) ?? null

    if (!nextToken) {
      return
    }

    if (viewMode === 'player') {
      if (!canActivePlayerControlToken(nextToken)) {
        return
      }

      return
    }

    const currentSelection = selectedTokenIds
    const nextSelection =
      options.additive
        ? currentSelection.includes(tokenId)
          ? currentSelection.filter((currentId) => currentId !== tokenId)
          : [...currentSelection, tokenId]
        : [tokenId]

    setSelection(nextSelection)
  }

  function handleClearSelection() {
    if (viewMode === 'player' || selectedTokenIds.length === 0) {
      return
    }

    setSelection([])
  }

  function moveTokensToCell(input: {
    cell: { column: number; row: number }
    tokenId?: string
    clearSelectionAfterMove?: boolean
  }) {
    if (!boardMap) {
      return
    }

    const baseMovementTokens =
      input.tokenId && selectedTokens.some((token) => token.id === input.tokenId)
        ? selectedTokens
        : input.tokenId
          ? tokens.filter((token) => token.id === input.tokenId)
          : viewMode === 'player'
            ? playerToken
              ? [playerToken]
              : []
            : selectedTokens
    const controllableTokens = baseMovementTokens.filter(
      (token) => canActivePlayerControlToken(token),
    )

    if (controllableTokens.length === 0) {
      return
    }

    const targetToken =
      input.tokenId
        ? controllableTokens.find((token) => token.id === input.tokenId)
        : undefined
    const anchorToken =
      targetToken ??
      controllableTokens.find((token) => token.id === primarySelectedTokenId) ??
      controllableTokens[0]

    if (!anchorToken) {
      return
    }

    const nextSelectionIds = controllableTokens.map((token) => token.id)
    const nextCell = clampTabletopCell(input.cell, boardMap)
    const columnDelta = nextCell.column - anchorToken.cell.column
    const rowDelta = nextCell.row - anchorToken.cell.row

    updateSession((currentSession) => {
      const nextScenes = currentSession.scenes.map((scene) =>
        scene.id === boardSceneId
          ? {
              ...scene,
              tokens: scene.tokens.map((token) =>
                controllableTokens.some(
                  (selectedToken) => selectedToken.id === token.id,
                )
                  ? {
                      ...token,
                      cell: clampTabletopTokenCell(
                        {
                          column: token.cell.column + columnDelta,
                          row: token.cell.row + rowDelta,
                        },
                        boardMap,
                        token,
                      ),
                    }
                  : token,
              ),
            }
          : scene,
      )

      return createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: nextScenes,
        tokens:
          nextScenes.find((scene) => scene.id === boardSceneId)?.tokens ?? tokens,
        selectedTokenIds:
          viewMode === 'gm' && input.clearSelectionAfterMove ? [] : nextSelectionIds,
        selectedTokenId:
          viewMode === 'gm' && input.clearSelectionAfterMove
            ? ''
            : nextSelectionIds[nextSelectionIds.length - 1] ?? '',
      })
    })
  }

  function handleBoardCellAction(cell: { column: number; row: number }) {
    if (viewMode === 'gm' && selectedTokenIds.length === 0) {
      handleClearSelection()
      return
    }

    moveTokensToCell({
      cell,
      clearSelectionAfterMove: viewMode === 'gm',
    })
  }

  function handleTokenDrop(input: { tokenId: string; cell: { column: number; row: number } }) {
    moveTokensToCell({
      ...input,
      clearSelectionAfterMove: false,
    })
  }

  function spawnCharacterOnCurrentScene(characterId: string) {
    if (!data || !boardMap || !boardScene || viewMode !== 'gm' || !characterId) {
      return
    }

    const nextCharacter = data.characters.items.find(
      (character) => character.id === characterId,
    )

    if (!nextCharacter) {
      return
    }

    const existingToken =
      boardScene.tokens.find((token) => token.characterId === nextCharacter.id) ?? null

    if (existingToken) {
      updateSession((currentSession) =>
        createPersistedTabletopSession({
          ...currentSession,
          currentSceneId: currentSession.currentSceneId,
          initialSceneId: currentSession.initialSceneId,
          scenes: currentSession.scenes,
          removedCharacterIdsByScene: removeRemovedCharacterFromScene(
            currentSession.removedCharacterIdsByScene,
            boardSceneId,
            nextCharacter.id,
          ),
        }),
      )
      setSelection([existingToken.id])
      setActiveHudPanel(null)
      setInspectedTokenId(existingToken.id)
      return
    }

    const nextToken = createTokenForCharacter({
      character: nextCharacter,
      existingTokens: tokens,
      map: boardMap,
    })

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.map((scene) =>
          scene.id === boardSceneId
            ? {
                ...scene,
                tokens: [...scene.tokens, nextToken],
              }
            : scene,
        ),
        tokens: [...tokens, nextToken],
        selectedTokenIds: [nextToken.id],
        selectedTokenId: nextToken.id,
        removedCharacterIdsByScene: removeRemovedCharacterFromScene(
          currentSession.removedCharacterIdsByScene,
          boardSceneId,
          nextCharacter.id,
        ),
      }),
    )
    setActiveHudPanel(null)
    setInspectedTokenId(nextToken.id)
  }

  function removeTokenFromCurrentScene(tokenId: string) {
    if (!boardScene || viewMode !== 'gm') {
      return
    }

    const tokenToRemove =
      boardScene.tokens.find((token) => token.id === tokenId) ?? null

    if (!tokenToRemove) {
      return
    }

    const shouldClearSelection = selectedTokenIds.includes(tokenId)

    updateSession((currentSession) => {
      const nextScenes = currentSession.scenes.map((scene) =>
        scene.id === boardSceneId
          ? {
              ...scene,
              tokens: scene.tokens.filter((token) => token.id !== tokenId),
            }
          : scene,
      )
      const nextSelectedTokenIds = shouldClearSelection
        ? []
        : currentSession.selectedTokenIds.filter((selectedTokenId) => selectedTokenId !== tokenId)

      return createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: nextScenes,
        selectedTokenIds: nextSelectedTokenIds,
        selectedTokenId: nextSelectedTokenIds[nextSelectedTokenIds.length - 1] ?? '',
        removedCharacterIdsByScene: addRemovedCharacterToScene(
          currentSession.removedCharacterIdsByScene,
          boardSceneId,
          tokenToRemove.characterId,
        ),
      })
    })

    if (shouldClearSelection) {
      setInspectedTokenId('')
    } else if (inspectedTokenId === tokenId) {
      setInspectedTokenId('')
    }

    setTableFeedbackMessage(`Token removido da cena: ${tokenToRemove.label}`)
  }

  function removeCharacterTokenFromCurrentScene(characterId: string) {
    if (!boardScene || viewMode !== 'gm') {
      return
    }

    const tokenToRemove =
      boardScene.tokens.find((token) => token.characterId === characterId) ?? null

    if (!tokenToRemove) {
      return
    }

    removeTokenFromCurrentScene(tokenToRemove.id)
  }

  function handleTokenSizeChange(
    tokenId: string,
    preset: Exclude<TabletopTokenSizePreset, 'custom'>,
  ) {
    if (!boardMap) {
      return
    }

    const nextSize: TabletopTokenSize =
      preset === '3x3' ? 3 : preset === '2x2' ? 2 : 1

    updateSession((currentSession) => {
      const nextScenes = currentSession.scenes.map((scene) =>
        scene.id === boardSceneId
          ? {
              ...scene,
              tokens: scene.tokens.map((token) => {
                if (token.id !== tokenId) {
                  return token
                }

                const resizedToken: TabletopToken = {
                  ...token,
                  size: nextSize,
                  customSize: undefined,
                }

                return {
                  ...resizedToken,
                  cell: clampTabletopTokenCell(token.cell, boardMap, resizedToken),
                }
              }),
            }
          : scene,
      )

      return createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: nextScenes,
        tokens:
          nextScenes.find((scene) => scene.id === boardSceneId)?.tokens ?? tokens,
      })
    })

    const nextLabel = preset === '3x3' ? '3x3' : preset === '2x2' ? '2x2' : '1x1'
    setTableFeedbackMessage(`Token ajustado: ${nextLabel}`)
  }

  function handleResetSession() {
    pingTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    pingTimeoutsRef.current = []
    clearPersistedTabletopSession()
    clearSharedTransitionPlaybackState()
    stopAllMixerTracks()
    setSession(null)
    setActiveHudPanel(null)
    setActiveUtilityWindow(null)
    setInspectedTokenId('')
    setPings([])
    setPreparedSceneIdOverride('')
    setSceneEntryId(0)
    setIntroOverlayState(null)
    setTransitionOverlayState(null)
    setCinematicOverlayState(null)
    setSharedTransitionPlaybackState(null)
    setAudioStatusMessage('')
    setTableFeedbackMessage('')
    setAudioTransportState('stopped')
    setPlayerLocalZoomByScene({})
    setSceneReturnTransitionActive(false)
    resetViewMode()
    pendingSceneCameraKeyRef.current = ''
    lastAudioSceneKeyRef.current = ''
  }

  function toggleHudPanel(panelId: HudPanelId) {
    setActiveHudPanel((currentPanel) => (currentPanel === panelId ? null : panelId))
  }

  function handleToggleTokenVisibility(tokenId: string) {
    if (viewMode !== 'gm') {
      return
    }

    const targetToken = tokens.find((token) => token.id === tokenId) ?? null
    const nextVisibility = targetToken?.visibility === 'public' ? 'gm' : 'public'

    updateCurrentScene((scene) => ({
      ...scene,
      tokens: scene.tokens.map((token) =>
        token.id === tokenId
          ? {
              ...token,
              visibility: token.visibility === 'public' ? 'gm' : 'public',
            }
          : token,
      ),
    }))

    if (targetToken) {
      setTableFeedbackMessage(
        nextVisibility === 'public'
          ? `${targetToken.label} visivel para jogadores`
          : `${targetToken.label} oculto dos jogadores`,
      )
    }
  }

  function handleTokenControlChange(tokenId: string, playerIds: FushiAccessProfileId[]) {
    if (viewMode !== 'gm') {
      return
    }

    const targetToken = tokens.find((token) => token.id === tokenId) ?? null
    const nextControl =
      playerIds.length > 0
        ? {
            controlledByPlayerIds: playerIds,
            primaryControllerId: playerIds[0],
            sharedControl: playerIds.length > 1,
          }
        : undefined

    if (targetToken && data && playerIds.length > 0) {
      const bodyKey = getTokenIdentityBodyKey(targetToken)
      const tokenCharacter = getCharacterById(data, targetToken.characterId)

      setIdentityResourcesByBody((currentResources) => {
        const currentBodyResources = currentResources[bodyKey] ?? {}
        const nextBodyResources = { ...currentBodyResources }

        playerIds.forEach((profileId) => {
          if (!isIdentityResourceProfileId(profileId) || nextBodyResources[profileId]) {
            return
          }

          const profile = accessState.profiles.find((item) => item.id === profileId) ?? null
          const profileCharacter =
            profile?.characterId ? getCharacterById(data, profile.characterId) : null
          const sourceCharacter = profileCharacter ?? tokenCharacter

          if (!sourceCharacter) {
            return
          }

          nextBodyResources[profileId] = getIdentityResourcePool(sourceCharacter)
        })

        return {
          ...currentResources,
          [bodyKey]: nextBodyResources,
        }
      })
    }

    updateCurrentScene((scene) => ({
      ...scene,
      tokens: scene.tokens.map((token) =>
        token.id === tokenId
          ? {
              ...token,
              control: nextControl,
            }
          : token,
      ),
    }))

    setTableFeedbackMessage(
      playerIds.length > 0
        ? `${targetToken?.label ?? 'Token'} liberado para ${playerIds.length} jogador(es)`
        : `${targetToken?.label ?? 'Token'} sem controle de jogador`,
    )
  }

  function handleBindTokenAsPlayerBody(
    tokenId: string,
    playerId: FushiAccessProfileId,
    originalState: TabletopOriginalConsciousnessState,
  ) {
    if (viewMode !== 'gm' || !data || !isIdentityResourceProfileId(playerId)) {
      return
    }

    const targetToken = tokens.find((token) => token.id === tokenId) ?? null
    const targetCharacter = targetToken
      ? getCharacterById(data, targetToken.characterId)
      : null

    if (!targetToken || !targetCharacter) {
      return
    }

    const profile =
      accessState.profiles.find((entry) => entry.id === playerId && entry.role === 'player') ??
      null
    const consciousnessId =
      worldMundiState.players[playerId]?.conscienciaId ||
      getWorldMundiConsciousnessIdForPlayer(playerId)
    const bodyId = getWorldMundiBodyIdForCharacter(targetCharacter.id)
    const mapLocationId =
      boardScene?.mapId
        ? worldMundiState.locations.find((location) => location.mapId === boardScene.mapId)
            ?.id ?? ''
        : ''
    const existingParty =
      Object.values(worldMundiState.parties).find((party) =>
        party.memberPlayerIds.includes(playerId),
      ) ?? null
    const localAtualId =
      existingParty?.localAtualId ||
      mapLocationId ||
      worldMundiState.selectedLocationId ||
      worldMundiState.locations[0]?.id ||
      'caverna_primeiro_corpo'
    const body = createWorldMundiBody({
      id: bodyId,
      nome: targetCharacter.nome,
      tipo: targetCharacter.tipo === 'npc' ? 'npc_importante' : 'humano',
      localAtualId,
      ocupadoPorConsciencia: true,
      conscienciaControladoraId: consciousnessId,
      jogadorControladorId: playerId,
      npcOriginalId: targetCharacter.id,
      estadoDaConscienciaOriginal: originalState,
    })
    const nextToken = applyPersistentBodyControlToToken(targetToken, body)

    setIdentityResourcesByBody((currentResources) => {
      const currentBodyResources = currentResources[bodyId] ?? {}
      const sourceCharacter =
        profile?.characterId && data
          ? getCharacterById(data, profile.characterId) ?? targetCharacter
          : targetCharacter

      return {
        ...currentResources,
        [bodyId]: {
          ...currentBodyResources,
          [playerId]: currentBodyResources[playerId] ?? getIdentityResourcePool(sourceCharacter),
        },
      }
    })

    setWorldMundiState((currentState) => {
      const existingPlayer = currentState.players[playerId]
      const existingConsciousness =
        currentState.consciencias[consciousnessId] ?? null
      const previousBodyId = existingConsciousness?.corpoAtualId ?? ''
      const currentExistingParty =
        Object.values(currentState.parties).find((party) =>
          party.memberPlayerIds.includes(playerId),
        ) ?? null
      const playerPartyId =
        currentExistingParty?.id ||
        existingConsciousness?.grupoAtualId ||
        currentState.selectedPartyId ||
        'party_protagonistas'
      const nextBodies = { ...currentState.corpos }

      if (
        previousBodyId &&
        previousBodyId !== bodyId &&
        nextBodies[previousBodyId]?.jogadorControladorId === playerId
      ) {
        nextBodies[previousBodyId] = createWorldMundiBody({
          ...nextBodies[previousBodyId],
          ocupadoPorConsciencia: false,
          conscienciaControladoraId: '',
          jogadorControladorId: '',
        })
      }

      nextBodies[bodyId] = body

      const nextParties = Object.fromEntries(
        Object.entries(currentState.parties).map(([partyId, party]) => {
          const nextPlayerIds = party.memberPlayerIds.includes(playerId)
            ? party.memberPlayerIds
            : partyId === playerPartyId
              ? [...party.memberPlayerIds, playerId]
              : party.memberPlayerIds

          return [
            partyId,
            createWorldMundiParty({
              ...party,
              memberPlayerIds: nextPlayerIds,
              memberCharacterIds: party.memberCharacterIds.filter(
                (characterId) => characterId !== targetCharacter.id,
              ),
            }),
          ]
        }),
      )

      const existingNpc = currentState.npcs[targetCharacter.id]
      const nextNpc = createWorldMundiNpcState({
        ...(existingNpc ?? {
          characterId: targetCharacter.id,
          localInicialId: localAtualId,
          statusEntrada: 'ativo_no_inicio',
          presencaNoMapa: 'inativo',
        }),
        characterId: targetCharacter.id,
        estadoSimulacao: 'pausado_por_contexto',
        localAtualId,
        presencaNoMapa: 'inativo',
        ultimoLog: `${targetCharacter.nome} agora e corpo atual de ${profile?.label ?? playerId}.`,
      })
      const nextClock = currentState.clock

      return createWorldMundiState({
        ...currentState,
        consciencias: {
          ...currentState.consciencias,
          [consciousnessId]: createWorldMundiConsciousness({
            ...(existingConsciousness ?? {}),
            id: consciousnessId,
            nome:
              existingConsciousness?.nome ??
              `Consciencia ${profile?.label ?? getShortPlayerLabel(playerId)}`,
            jogadorId: playerId,
            corpoAtualId: bodyId,
            grupoAtualId: playerPartyId,
          }),
        },
        corpos: nextBodies,
        logs: [
          createWorldMundiLogEntry({
            dia: nextClock.dia,
            hora: nextClock.hora,
            texto: `${profile?.label ?? getShortPlayerLabel(playerId)} agora ocupa o corpo de ${targetCharacter.nome}.`,
            tecnico: `Vinculo persistente criado. Jogador: ${playerId}. Consciencia: ${consciousnessId}. Corpo: ${bodyId}. NPC original: ${targetCharacter.id}. Estado original: ${originalState}.`,
            categoria: 'players',
            canal: 'mestre',
            tone: 'watch',
          }),
          ...currentState.logs,
        ],
        npcs: {
          ...currentState.npcs,
          [targetCharacter.id]: nextNpc,
        },
        parties: nextParties,
        players: {
          ...currentState.players,
          [playerId]: createWorldMundiPlayer({
            ...(existingPlayer ?? {}),
            id: playerId,
            nome: profile?.label ?? existingPlayer?.nome ?? getShortPlayerLabel(playerId),
            conscienciaId: consciousnessId,
          }),
        },
      })
    })

    updateCurrentScene((scene) => ({
      ...scene,
      tokens: scene.tokens.map((token) =>
        token.id === tokenId ? nextToken : token,
      ),
    }))

    appendLogEntry({
      id: buildRuntimeEventId(`log-body-bind-${tokenId}-${playerId}`),
      type: 'system',
      visibility: 'gm',
      author: 'Mesa',
      text: `${profile?.label ?? getShortPlayerLabel(playerId)} agora ocupa o corpo de ${targetCharacter.nome}.`,
      createdAt: new Date().toISOString(),
    })
    setTableFeedbackMessage(
      `${profile?.label ?? getShortPlayerLabel(playerId)} vinculado ao corpo de ${targetCharacter.nome}.`,
    )
  }

  function handleInspectorCharacterChange(nextCharacter: CharacterSheet) {
    const normalizedCharacter = normalizeCharacterSheet(nextCharacter)
    const identityProfileId =
      activeToken && isIdentityResourceProfileId(activeIdentityResourceProfileId)
        ? activeIdentityResourceProfileId
        : ''

    if (activeToken && identityProfileId) {
      const bodyKey = getTokenIdentityBodyKey(activeToken)

      setIdentityResourcesByBody((currentResources) => ({
        ...currentResources,
        [bodyKey]: {
          ...(currentResources[bodyKey] ?? {}),
          [identityProfileId]: getIdentityResourcePool(normalizedCharacter),
        },
      }))
    }

    const persistentCharacter =
      identityProfileId && baseActiveCharacter
        ? {
            ...normalizedCharacter,
            atributos: { ...baseActiveCharacter.atributos },
            jogador: baseActiveCharacter.jogador,
            pericias: baseActiveCharacter.pericias.map((skill) => ({ ...skill })),
            recursos: {
              ...normalizedCharacter.recursos,
              determinacaoAtual: baseActiveCharacter.recursos.determinacaoAtual,
              determinacaoMaxima: baseActiveCharacter.recursos.determinacaoMaxima,
              fushiAtual: baseActiveCharacter.recursos.fushiAtual,
              fushiMaximo: baseActiveCharacter.recursos.fushiMaximo,
            },
          }
        : normalizedCharacter

    if (!data) {
      updateCharacter(persistentCharacter)
      return
    }

    const isSharedBodyHost = data.characters.items.some(
      (character) => getSharedBodyHostId(character) === persistentCharacter.id,
    )
    const sharedBodyHostId = persistentCharacter.isSharedBodyHost || isSharedBodyHost
      ? persistentCharacter.id
      : getSharedBodyHostId(persistentCharacter)

    if (!sharedBodyHostId) {
      updateCharacter(persistentCharacter)
      return
    }

    const sharedVida = {
      vidaAtual: persistentCharacter.recursos.vidaAtual,
      vidaMaxima: persistentCharacter.recursos.vidaMaxima,
    }
    const sharedInventory = [...persistentCharacter.inventario]
    const sharedDetailedInventory = persistentCharacter.inventarioDetalhado
      ? persistentCharacter.inventarioDetalhado.map((item) => ({
          ...item,
          efeitos: [...item.efeitos],
        }))
      : undefined

    data.characters.items
      .filter(
        (character) =>
          character.id === persistentCharacter.id ||
          character.id === sharedBodyHostId ||
          getSharedBodyHostId(character) === sharedBodyHostId,
      )
      .forEach((character) => {
        const nextSharedCharacter =
          character.id === persistentCharacter.id
            ? persistentCharacter
            : normalizeCharacterSheet({
                ...character,
                inventario: sharedInventory,
                inventarioDetalhado: sharedDetailedInventory,
                recursos: {
                  ...character.recursos,
                  ...sharedVida,
                },
              })

        updateCharacter(nextSharedCharacter)
      })
  }

  const rollToastRecord = rollToastEntry?.roll ?? null
  const rollToastBonusText =
    rollToastRecord && rollToastRecord.bonus !== 0
      ? `${rollToastRecord.bonus > 0 ? '+' : '-'}${Math.abs(rollToastRecord.bonus)}`
      : '+0'

  if (!data) {
    return null
  }

  return (
    <div
      className="tabletop-screen"
      data-scene-theme={boardSceneRuntime?.uiTheme.id ?? 'ui-fushi-default'}
      data-weather={boardSceneRuntime?.weather.variant ?? 'none'}
      style={sceneThemeStyle}
    >
      <div
        className={`tabletop-screen__board${
          sceneReturnTransitionActive ? ' tabletop-screen__board--reentering' : ''
        }`}
        ref={boardRootRef}
      >
        <TabletopBoard
          cellSize={
            boardMapCellSize ??
            data.tabletop.map.cellSize ??
            DEFAULT_TABLETOP_GRID_CELL_SIZE
          }
          fullscreen
          isCameraLocked={isBoardCameraLocked}
          isGridVisible={isGridVisible}
          isMeasureModeEnabled={canUseMeasureTool && isMeasureToolActive}
          map={boardMap ?? data.tabletop.map}
          onCellAction={handleBoardCellAction}
          onClearSelection={handleClearSelection}
          onPing={handlePing}
          onTokenClick={viewMode === 'player' ? handleTokenOpen : undefined}
          onTokenDrop={handleTokenDrop}
          onTokenSelect={handleTokenSelect}
          onTokenOpen={handleTokenOpen}
          onViewportCameraChange={handleViewportCameraChange}
          onWheelZoom={handleWheelZoom}
          overlay={
            boardSceneRuntime ? <TabletopWeatherOverlay runtime={boardSceneRuntime.weather} /> : null
          }
          pings={boardPings}
          tokens={tokenViews}
          viewportRef={viewportRef}
          zoom={effectiveZoom}
        />
      </div>

      <div className="tabletop-screen__topbar">
        <div className="tabletop-screen__topbar-main">
          <Link className="tabletop-escape" to="/">
            Plataforma
          </Link>
          {boardMap ? (
            <span className="tabletop-screen__map-pill">
              {boardMap.name}
              {viewMode === 'gm' && boardScene?.id !== currentSceneId ? ' (preparo)' : ''}
            </span>
          ) : null}
          {viewMode === 'gm' && currentScene ? (
            <button
              className="tabletop-escape"
              onClick={() => enterScene(currentScene.id)}
              type="button"
            >
              Reentrar
            </button>
          ) : null}
          {activeIntroCard ? (
            <button
              className="tabletop-escape"
              onClick={triggerSceneIntroOverlay}
              type="button"
            >
              Intro
            </button>
          ) : null}
          {viewMode === 'gm' ? (
            <button
              className={`tabletop-escape${
                gmCameraControlEnabled ? ' tabletop-escape--active' : ''
              }`}
              onClick={() =>
                updateSession((currentSession) =>
                  createPersistedTabletopSession({
                    ...currentSession,
                    currentSceneId: currentSession.currentSceneId,
                    initialSceneId: currentSession.initialSceneId,
                    scenes: currentSession.scenes,
                    gmCameraControlEnabled: !currentSession.gmCameraControlEnabled,
                  }),
                )
              }
              type="button"
            >
              CAM GM
            </button>
          ) : null}
          {canUseMeasureTool ? (
            <button
              className={`tabletop-escape${
                isMeasureToolActive ? ' tabletop-escape--active' : ''
              }`}
              onClick={() => setIsMeasureToolActive((currentValue) => !currentValue)}
              type="button"
            >
              Medir
            </button>
          ) : null}
          {viewMode === 'gm' ? (
            <button
              className={`tabletop-escape${
                playersCanMeasure ? ' tabletop-escape--active' : ''
              }`}
              onClick={() => setPlayersCanMeasure((currentValue) => !currentValue)}
              type="button"
              title="Permitir que jogadores usem a regua no MAP"
            >
              J mede
            </button>
          ) : null}
          <span className="tabletop-screen__selection">
            {selectedTokenIds.length > 0
              ? `${selectedTokenIds.length} selecionado(s)`
              : 'Sem selecao'}
          </span>
        </div>
      </div>

      {tableFeedbackMessage ? (
        <div className="tabletop-screen__feedback">
          <div className="chip chip--accent">{tableFeedbackMessage}</div>
        </div>
      ) : null}

      {!isActiveMapVisibleToPlayer ? (
        <div className="tabletop-screen__map-lock">
          <div className="tabletop-overlay-card tabletop-overlay-card--compact">
            <p className="eyebrow">Mapa em preparacao</p>
            <h3>O mestre ainda nao revelou este mapa.</h3>
            <p className="support-copy">
              A cena local esta em modo mestre/preparacao. Ela aparece para os jogadores
              quando o mestre clicar em Ativar para jogadores no MAP.
            </p>
          </div>
        </div>
      ) : null}

      {rollToastEntry && rollToastRecord ? (
        <div
          className={`tabletop-roll-toast${
            rollToastEntry.visibility === 'gm' ? ' tabletop-roll-toast--gm' : ''
          }`}
          role="status"
        >
          <button
            aria-label="Fechar resultado da rolagem"
            className="tabletop-roll-toast__close"
            onClick={() => setRollToastEntry(null)}
            type="button"
          >
            x
          </button>
          <p className="eyebrow">
            {rollToastEntry.visibility === 'gm' ? 'Rolagem oculta' : 'Rolagem publica'}
          </p>
          <div className="tabletop-roll-toast__body">
            <div>
              <h3>{rollToastRecord.contexto}</h3>
              <p className="support-copy">
                {rollToastRecord.quantidadeDados}d{rollToastRecord.tipoDado}{' '}
                {rollToastBonusText} {'->'} [{rollToastRecord.resultados.join(', ')}]
              </p>
            </div>
            <strong>{rollToastRecord.total}</strong>
          </div>
        </div>
      ) : null}

      {imagePreviewState ? (
        <div className="tabletop-image-preview" role="dialog" aria-modal="true">
          <button
            aria-label="Fechar preview"
            className="tabletop-image-preview__backdrop"
            onClick={closeImagePreview}
            type="button"
          />
          <figure className="tabletop-image-preview__frame">
            <button
              aria-label="Fechar preview"
              className="tabletop-image-preview__close"
              onClick={closeImagePreview}
              type="button"
            >
              x
            </button>
            <img alt={imagePreviewState.label} src={imagePreviewState.src} />
            <figcaption>{imagePreviewState.label}</figcaption>
            {viewMode === 'gm' ? (
              <button
                className="button"
                onClick={() =>
                  broadcastImagePreview(imagePreviewState.src, imagePreviewState.label)
                }
                type="button"
              >
                Mostrar aos players
              </button>
            ) : null}
          </figure>
        </div>
      ) : null}

      {isFocusedPlayerMissingFromScene ? (
        <div className="tabletop-screen__notice">
          <div className="tabletop-overlay-card">
            <p className="eyebrow">Player View</p>
            <h3>{focusedPlayerCharacter?.nome ?? 'Personagem'} ainda nao esta na mesa</h3>
            <p className="support-copy">
              O mapa continua visivel, mas esse personagem ainda nao tem token ativo na
              cena atual.
            </p>
            <div className="tabletop-library-card__actions">
              <Link className="button button--primary" to="/personagens">
                Voltar para Campanhas/Personagens
              </Link>
              <button className="button" onClick={resetViewMode} type="button">
                Voltar ao modo mestre
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="tabletop-screen__utility">
        <button
          className={`tabletop-hud__button${
            activeUtilityWindow === 'log' ? ' tabletop-hud__button--active' : ''
          }`}
          onClick={() =>
            setActiveUtilityWindow((currentWindow) =>
              currentWindow === 'log' ? null : 'log',
            )
          }
          title="Chat, log e rolagem"
          type="button"
        >
          <span>LOG</span>
        </button>
        <button
          className={`tabletop-hud__button${
            activeUtilityWindow === 'notes' ? ' tabletop-hud__button--active' : ''
          }`}
          onClick={() =>
            setActiveUtilityWindow((currentWindow) =>
              currentWindow === 'notes' ? null : 'notes',
            )
          }
          title="Anotacoes pessoais"
          type="button"
        >
          <span>NOT</span>
        </button>
        {viewMode === 'gm' ? (
          <button
            className={`tabletop-hud__button${
              activeUtilityWindow === 'access' ? ' tabletop-hud__button--active' : ''
            }`}
            onClick={() =>
              setActiveUtilityWindow((currentWindow) =>
                currentWindow === 'access' ? null : 'access',
              )
            }
            title="Senhas e acessos"
            type="button"
          >
            <span>SEN</span>
          </button>
        ) : null}
        {viewMode === 'gm' ? (
          <button
            className={`tabletop-hud__button${
              activeUtilityWindow === 'help' ? ' tabletop-hud__button--active' : ''
            }`}
            onClick={() =>
              setActiveUtilityWindow((currentWindow) =>
                currentWindow === 'help' ? null : 'help',
              )
            }
            title="Ajuda e atalhos"
            type="button"
          >
            <span>?</span>
          </button>
        ) : null}
        {sheetActionTokenId ? (
          <button
            className="tabletop-hud__button"
            onClick={() => handleTokenOpen(sheetActionTokenId)}
            title={
              viewMode === 'player'
                ? 'Abrir ficha do personagem'
                : 'Abrir ficha do token selecionado'
            }
            type="button"
          >
            <span>FIC</span>
          </button>
        ) : null}
        {viewMode === 'gm' && primarySelectedToken ? (
          <button
            className={`tabletop-hud__button${
              primarySelectedToken.visibility === 'gm'
                ? ' tabletop-hud__button--active'
                : ''
            }`}
            onClick={() => handleToggleTokenVisibility(primarySelectedToken.id)}
            title={
              primarySelectedToken.visibility === 'gm'
                ? 'Tornar token publico'
                : 'Ocultar token do player'
            }
            type="button"
          >
            <span>{primarySelectedToken.visibility === 'gm' ? 'GM' : 'PUB'}</span>
          </button>
        ) : null}
      </div>

      {activeIntroCard && isIntroCardVisible ? (
        <SceneIntroCard
          introCard={activeIntroCard}
          key={`${introOverlayState?.triggerId ?? 0}:${activeIntroCard.id}`}
          onClose={() => setIntroOverlayState(null)}
          sceneName={currentScene?.name ?? 'Cena'}
        />
      ) : null}
      {activeTransitionOverlay ? (
        <TabletopTransitionOverlay
          key={`${transitionOverlayState?.triggerId ?? 0}:${activeTransitionOverlay.id}`}
          isGm={viewMode === 'gm'}
          onConfirm={concludeTransitionOverlay}
          onClose={closeTransitionOverlay}
          onPlaybackStateChange={handleTransitionPlaybackStateChange}
          playbackState={sharedTransitionPlaybackState}
          scenePreviewUrl={activeMap?.imageUrl ?? activeMap?.image ?? null}
          transition={activeTransitionOverlay}
        />
      ) : null}
      {activeCinematicOverlay ? (
        <TabletopCinematicOverlay
          cinematic={activeCinematicOverlay}
          key={`${cinematicOverlayState?.triggerId ?? 0}:${activeCinematicOverlay.id}`}
          onClose={() => setCinematicOverlayState(null)}
        />
      ) : null}
      {configurableMap ? (
        <MapConfigurationModal
          folderOptions={mapFolderOptions}
          map={configurableMap}
          onClose={() => setConfigureMapId(null)}
          onSave={handleSaveMapConfiguration}
          selectedFolderId={
            libraryState.itemFolders.maps[configurableMap.id] ??
            configurableMap.folderId ??
            ''
          }
        />
      ) : null}
      {configurableTransition ? (
        <TransitionConfigurationModal
          allMaps={availableMaps}
          currentConfig={transitionOverrides[configurableTransition.id]}
          onClose={() => setConfigureTransitionId(null)}
          onSave={(config) => {
            handleSaveTransitionOverride(configurableTransition, config)
            setConfigureTransitionId(null)
          }}
          transition={configurableTransition}
        />
      ) : null}

      {viewMode === 'gm' ? (
        <>
          <div className="tabletop-screen__hud">
            <TabletopHud
              activeItemId={activeHudPanel}
              items={hudItems.map((item) => ({
                id: item.id,
                label: item.label,
                shortLabel: item.shortLabel,
              }))}
              onToggle={(itemId) => toggleHudPanel(itemId as HudPanelId)}
            />
          </div>

          {activeHudPanel === 'npcs' ? (
            <FloatingWindow
              initialPosition={{ x: 104, y: 220 }}
              initialSize={{ width: 1080, height: 720 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Biblioteca visual para colocar personagens na cena em mesa com previsibilidade."
              title="Biblioteca de Personagens"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Biblioteca visual para colocar personagens na cena em mesa com previsibilidade."
                title="Biblioteca de Personagens"
              >
                <TabletopNpcLibrary
                  activeCharacterIds={activeSceneCharacterIds}
                  characterFolders={libraryState.itemFolders.npcs}
                  characters={spawnLibraryCharacters}
                  folders={libraryState.folders}
                  onAssignCharacterFolder={(characterId, folderId) =>
                    assignLibraryItemFolder('npcs', characterId, folderId)
                  }
                  onCreateFolder={(parentId, name) =>
                    createLibraryFolder('npcs', parentId, name)
                  }
                  onDeleteFolder={deleteLibraryFolder}
                  onHideCharacter={hideLibraryCharacter}
                  onMoveFolder={moveLibraryFolder}
                  onRenameFolder={renameLibraryFolder}
                  onRemoveFromScene={removeCharacterTokenFromCurrentScene}
                  onSpawn={spawnCharacterOnCurrentScene}
                />
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

          {activeHudPanel === 'world' ? (
            <FloatingWindow
              initialPosition={{ x: 84, y: 140 }}
              initialSize={{ width: 1240, height: 780 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Tabuleiro logico aberto da ilha para organizar risco, NPCs, rotas e logs sem prender os jogadores."
              title="Mapa Mundi"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Tabuleiro logico aberto da ilha para organizar risco, NPCs, rotas e logs sem prender os jogadores."
                title="Mapa Mundi"
              >
                <TabletopWorldMundiPanel
                  characters={data.characters.items}
                  maps={availableMaps}
                  mapPreviewById={mapPreviewById}
                  onChange={setWorldMundiState}
                  onEnsureMapPlaceholders={ensureWorldMundiMapPlaceholders}
                  onLinkMapToLocation={linkWorldMundiLocationToMap}
                  onOpenMap={openWorldMundiMap}
                  state={worldMundiState}
                />
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

          {activeHudPanel === 'maps' ? (
            <FloatingWindow
              initialPosition={{ x: 104, y: 220 }}
              initialSize={{ width: 1180, height: 760 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Biblioteca principal da mesa com Scene Manager recolhido como camada tecnica."
              title="Biblioteca de Mapas"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Biblioteca principal da mesa com Scene Manager recolhido como camada tecnica."
                title="Biblioteca de Mapas"
              >
                <div className="list-stack">
                  <TabletopMapLibrary
                    biomes={availableBiomes}
                    currentMapId={currentScene?.mapId ?? ''}
                    focusedMapId={focusedMapLibraryId}
                    folders={libraryState.folders}
                    isGridVisible={isGridVisible}
                    mapFolders={libraryState.itemFolders.maps}
                    maps={availableMaps}
                    onActivateMap={activateMapForPlayers}
                    onAssignMapFolder={(mapId, folderId) =>
                      assignLibraryItemFolder('maps', mapId, folderId)
                    }
                    onAssignTransitionFolder={(transitionId, folderId) =>
                      assignLibraryItemFolder('transitions', transitionId, folderId)
                    }
                    onConfigureMap={setConfigureMapId}
                    onConfigureTransition={setConfigureTransitionId}
                    onCreateFolder={(category, parentId, name) =>
                      createLibraryFolder(category, parentId, name)
                    }
                    onCreateMap={handleCreateMap}
                    onCreateTransition={handleCreateTransition}
                    onDeleteFolder={deleteLibraryFolder}
                    onDeleteMap={deleteLibraryMap}
                    onDeleteTransition={deleteLibraryTransition}
                    onHideMap={hideMapFromPlayers}
                    onMoveFolder={moveLibraryFolder}
                    onPrepareMap={prepareMapForGm}
                    onRenameFolder={renameLibraryFolder}
                    onReturnToActiveMap={returnToActivePlayerMap}
                    onReturnToWorld={() => setActiveHudPanel('world')}
                    onShowTransition={triggerTransitionOverlay}
                    onToggleGrid={() =>
                      updateSession((currentSession) =>
                        createPersistedTabletopSession({
                          ...currentSession,
                          isGridVisible: !currentSession.isGridVisible,
                        }),
                      )
                    }
                    transitionFolders={libraryState.itemFolders.transitions}
                    transitions={availableTransitions}
                  />

                  <details className="tabletop-library-technical">
                    <summary className="tabletop-library-technical__summary">
                      Avancado
                    </summary>

                    <div className="tabletop-library-technical__content list-stack">
                      <article className="list-card">
                        <div className="list-card__top">
                          <h3>Gerenciamento de cenas</h3>
                          <div className="tag-row">
                            <span className="tag">{scenes.length} cenas</span>
                            {initialScene ? (
                              <span className="tag">Inicial: {initialScene.name}</span>
                            ) : null}
                          </div>
                        </div>

                        <div className="tabletop-hud-panel__actions">
                          <button
                            className="button button--primary"
                            onClick={createScene}
                            type="button"
                          >
                            Criar cena tecnica
                          </button>
                        </div>

                        <div className="list-stack">
                          {scenes.map((scene) => (
                            <article className="summary-card" key={scene.id}>
                              <div className="list-card__top">
                                <div>
                                  <strong>{scene.name}</strong>
                                  <p className="support-copy">
                                    {scene.id === currentSceneId
                                      ? 'Cena em mesa.'
                                      : scene.id === preparedSceneId
                                        ? 'Cena preparada.'
                                        : 'Cena em espera.'}
                                  </p>
                                </div>
                                <div className="tag-row">
                                  {scene.id === currentSceneId ? (
                                    <span className="tag">na mesa</span>
                                  ) : null}
                                  {scene.id === preparedSceneId ? (
                                    <span className="tag">preparada</span>
                                  ) : null}
                                  {scene.id === initialSceneId ? (
                                    <span className="tag">inicial</span>
                                  ) : null}
                                </div>
                              </div>
                              <div className="tabletop-hud-panel__actions">
                                <button
                                  className={`button${
                                    scene.id === preparedSceneId ? ' button--primary' : ''
                                  }`}
                                  onClick={() => prepareScene(scene.id)}
                                  type="button"
                                >
                                  Ativar
                                </button>
                                <button
                                  className="button"
                                  onClick={() => enterScene(scene.id)}
                                  type="button"
                                >
                                  Entrar
                                </button>
                                <button
                                  className="button"
                                  onClick={() => setInitialScene(scene.id)}
                                  type="button"
                                >
                                  Definir inicial
                                </button>
                                <button
                                  className="button"
                                  onClick={() => duplicateScene(scene.id)}
                                  type="button"
                                >
                                  Duplicar
                                </button>
                                <button
                                  className="button"
                                  disabled={scenes.length <= 1}
                                  onClick={() => deleteScene(scene.id)}
                                  type="button"
                                >
                                  Excluir
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      </article>

                      {preparedScene ? (
                        <article className="list-card">
                          <div className="list-card__top">
                            <h3>{preparedScene.name}</h3>
                            <div className="tag-row">
                              <span className="tag">
                                {preparedSceneMap?.name ?? data.tabletop.map.name}
                              </span>
                              {preparedSceneCinematic ? (
                                <span className="tag">{preparedSceneCinematic.label}</span>
                              ) : null}
                            </div>
                          </div>

                          <label className="field">
                            <span>Nome da cena</span>
                            <input
                              className="field__input"
                              onChange={(event) =>
                                renameScene(preparedScene.id, event.target.value)
                              }
                              type="text"
                              value={preparedScene.name}
                            />
                          </label>

                          <label className="field">
                            <span>Mapa</span>
                            <select
                              className="field__input"
                              onChange={(event) =>
                                updateSceneMap(preparedScene.id, event.target.value)
                              }
                              value={preparedScene.mapId}
                            >
                              {availableMaps.map((map) => (
                                <option key={map.id} value={map.id}>
                                  {map.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <div className="cards-grid">
                            <article className="summary-card">
                              <span className="summary-card__label">Grid atual</span>
                              <strong className="summary-card__value">
                                {preparedSceneMap?.gridColumns ?? 0}x
                                {preparedSceneMap?.gridRows ?? 0}
                              </strong>
                              <p className="support-copy">
                                Celula base: {preparedSceneCellSize ?? DEFAULT_TABLETOP_GRID_CELL_SIZE}
                                px
                              </p>
                            </article>

                            <label className="field">
                              <span>Celula do grid</span>
                              <input
                                className="field__input"
                                max={MAX_TABLETOP_GRID_CELL_SIZE}
                                min={MIN_TABLETOP_GRID_CELL_SIZE}
                                onChange={(event) =>
                                  updateSceneGridCellSize(
                                    preparedScene.id,
                                    Number(event.target.value),
                                  )
                                }
                                step={8}
                                type="range"
                                value={
                                  preparedSceneCellSize ?? DEFAULT_TABLETOP_GRID_CELL_SIZE
                                }
                              />
                            </label>

                            <div className="tabletop-hud-panel__actions">
                              {[88, 104, 120, 136].map((cellPreset) => (
                                <button
                                  className={`button${
                                    (preparedSceneCellSize ?? DEFAULT_TABLETOP_GRID_CELL_SIZE) ===
                                    cellPreset
                                      ? ' button--primary'
                                      : ''
                                  }`}
                                  key={cellPreset}
                                  onClick={() =>
                                    updateSceneGridCellSize(preparedScene.id, cellPreset)
                                  }
                                  type="button"
                                >
                                  {cellPreset}px
                                </button>
                              ))}
                            </div>
                          </div>

                          {assetLibrary ? (
                            <div className="cards-grid">
                              <label className="field">
                                <span>Musica</span>
                                <select
                                  className="field__input"
                                  onChange={(event) =>
                                    updateSceneMetadata(
                                      preparedScene.id,
                                      'musicTrackId',
                                      event.target.value,
                                    )
                                  }
                                  value={preparedScene.metadata.musicTrackId}
                                >
                                  <option value="">Sem musica</option>
                                  {assetLibrary.musicTracks.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                      {asset.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="field">
                                <span>Ambiencia</span>
                                <select
                                  className="field__input"
                                  onChange={(event) =>
                                    updateSceneMetadata(
                                      preparedScene.id,
                                      'ambienceTrackId',
                                      event.target.value,
                                    )
                                  }
                                  value={preparedScene.metadata.ambienceTrackId}
                                >
                                  <option value="">Sem ambiencia</option>
                                  {assetLibrary.ambienceTracks.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                      {asset.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="field">
                                <span>Iluminacao</span>
                                <select
                                  className="field__input"
                                  onChange={(event) =>
                                    updateSceneMetadata(
                                      preparedScene.id,
                                      'lightingPresetId',
                                      event.target.value,
                                    )
                                  }
                                  value={preparedScene.metadata.lightingPresetId}
                                >
                                  <option value="">Sem preset</option>
                                  {assetLibrary.lightingPresets.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                      {asset.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="field">
                                <span>Clima</span>
                                <select
                                  className="field__input"
                                  onChange={(event) =>
                                    updateSceneMetadata(
                                      preparedScene.id,
                                      'weatherPresetId',
                                      event.target.value,
                                    )
                                  }
                                  value={preparedScene.metadata.weatherPresetId}
                                >
                                  <option value="">Sem preset</option>
                                  {assetLibrary.weatherPresets.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                      {asset.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="field">
                                <span>Tema UI</span>
                                <select
                                  className="field__input"
                                  onChange={(event) =>
                                    updateSceneMetadata(
                                      preparedScene.id,
                                      'uiThemePresetId',
                                      event.target.value,
                                    )
                                  }
                                  value={preparedScene.metadata.uiThemePresetId}
                                >
                                  <option value="">Sem tema</option>
                                  {assetLibrary.uiThemes.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                      {asset.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="field">
                                <span>Intro card</span>
                                <select
                                  className="field__input"
                                  onChange={(event) =>
                                    updateSceneMetadata(
                                      preparedScene.id,
                                      'introCardId',
                                      event.target.value,
                                    )
                                  }
                                  value={preparedScene.metadata.introCardId}
                                >
                                  <option value="">Sem intro</option>
                                  {assetLibrary.introCards.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                      {asset.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="field">
                                <span>Cinematic</span>
                                <select
                                  className="field__input"
                                  onChange={(event) =>
                                    event.target.value
                                      ? applyCinematicToPreparedScene(event.target.value)
                                      : updateSceneMetadata(
                                          preparedScene.id,
                                          'cinematicId',
                                          '',
                                        )
                                  }
                                  value={preparedScene.metadata.cinematicId}
                                >
                                  <option value="">Sem cinematic</option>
                                  {assetLibrary.cinematics.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                      {asset.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="field">
                                <span>Camera</span>
                                <select
                                  className="field__input"
                                  onChange={(event) =>
                                    updateSceneMetadata(
                                      preparedScene.id,
                                      'cameraPresetId',
                                      event.target.value,
                                    )
                                  }
                                  value={preparedScene.metadata.cameraPresetId}
                                >
                                  <option value="">Sem preset</option>
                                  {assetLibrary.cameraPresets.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                      {asset.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          ) : null}

                          <label className="field">
                            <span>Notas da cena</span>
                            <textarea
                              className="field__input field__input--textarea"
                              onChange={(event) =>
                                updateSceneMetadata(
                                  preparedScene.id,
                                  'notes',
                                  event.target.value,
                                )
                              }
                              value={preparedScene.metadata.notes}
                            />
                          </label>
                        </article>
                      ) : null}

                      {assetLibrary ? (
                        <article className="list-card">
                          <div className="list-card__top">
                            <h3>Base local de assets</h3>
                            <span className="tag">secundario</span>
                          </div>
                          <div className="tag-row">
                            <span className="tag">{assetLibrary.maps.length} mapas</span>
                            <span className="tag">
                              {assetLibrary.musicTracks.length} musicas
                            </span>
                            <span className="tag">
                              {assetLibrary.ambienceTracks.length} ambiencias
                            </span>
                            <span className="tag">
                              {assetLibrary.cinematics.length} cinematics
                            </span>
                            <span className="tag">{assetLibrary.images.length} imagens</span>
                            <span className="tag">
                              {assetLibrary.videoClips.length} videos
                            </span>
                          </div>
                        </article>
                      ) : null}
                    </div>
                  </details>
                </div>

                <div className="tabletop-hud-panel__actions">
                  <button
                    className="button"
                    onClick={() => centerScrollableViewport(viewportRef.current)}
                    type="button"
                  >
                    Centralizar
                  </button>
                  <button
                    className="button"
                    onClick={() =>
                      updateSession((currentSession) =>
                        createPersistedTabletopSession({
                          ...currentSession,
                          currentSceneId,
                          initialSceneId: currentSession.initialSceneId,
                          scenes: currentSession.scenes.map((scene) =>
                            scene.id === currentSceneId
                              ? {
                                  ...scene,
                                  cameraState: {
                                    ...scene.cameraState,
                                    zoom: Math.max(MIN_TABLETOP_ZOOM, currentSession.zoom - 0.2),
                                  },
                                }
                              : scene,
                          ),
                          zoom: Math.max(MIN_TABLETOP_ZOOM, currentSession.zoom - 0.2),
                        }),
                      )
                    }
                    type="button"
                  >
                    Zoom -
                  </button>
                  <button
                    className="button button--primary"
                    onClick={() =>
                      updateSession((currentSession) =>
                        createPersistedTabletopSession({
                          ...currentSession,
                          currentSceneId,
                          initialSceneId: currentSession.initialSceneId,
                          scenes: currentSession.scenes.map((scene) =>
                            scene.id === currentSceneId
                              ? {
                                  ...scene,
                                  cameraState: {
                                    ...scene.cameraState,
                                    zoom: Math.min(MAX_TABLETOP_ZOOM, currentSession.zoom + 0.2),
                                  },
                                }
                              : scene,
                          ),
                          zoom: Math.min(MAX_TABLETOP_ZOOM, currentSession.zoom + 0.2),
                        }),
                      )
                    }
                    type="button"
                  >
                    Zoom +
                  </button>
                </div>
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

          {activeHudPanel === 'music' ? (
            <FloatingWindow
              initialPosition={{ x: 104, y: 220 }}
              initialSize={{ width: 880, height: 720 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Biblioteca musical para tocar previews isolados e preparar a cena sem autoplay acidental."
              title="Biblioteca de Musicas"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Biblioteca musical para tocar previews isolados e preparar a cena sem autoplay acidental."
                title="Biblioteca de Musicas"
              >
                <TabletopMusicLibrary
                  favoriteTrackIds={libraryState.favoriteTrackIds}
                  folders={libraryState.folders}
                  mixerTracks={mixerTracks}
                  onAssignTrackFolder={(trackId, folderId) =>
                    assignLibraryItemFolder('music', trackId, folderId)
                  }
                  onCreateFolder={(parentId, name) =>
                    createLibraryFolder('music', parentId, name)
                  }
                  onCreateTrack={handleCreateMusicTrack}
                  onDeleteFolder={deleteLibraryFolder}
                  onDeleteTrack={deleteLibraryTrack}
                  onMoveFolder={moveLibraryFolder}
                  onPauseAll={pauseAllMixerTracks}
                  onPauseTrack={pauseMixerTrack}
                  onPlayFavorites={playFavoriteTracks}
                  onPlayTrack={playMixerTrack}
                  onRenameFolder={renameLibraryFolder}
                  onSeekTrack={seekMixerTrack}
                  onStopAll={stopAllMixerTracks}
                  onStopTrack={stopMixerTrack}
                  onToggleFavorite={toggleFavoriteTrack}
                  onTrackVolumeChange={setMixerTrackVolume}
                  statusMessage={libraryAudioStatusMessage}
                  trackFolders={libraryState.itemFolders.music}
                  trackVolumes={libraryState.trackVolumes}
                  tracks={audioLibraryTracks}
                />
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

          {activeHudPanel === 'cinematics' ? (
            <FloatingWindow
              initialPosition={{ x: 104, y: 220 }}
              initialSize={{ width: 1040, height: 720 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Biblioteca de overlays visuais simples para salvar ou disparar sem mexer no core."
              title="Biblioteca de Cinematics"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Biblioteca de overlays visuais simples para salvar ou disparar sem mexer no core."
                title="Biblioteca de Cinematics"
              >
                <TabletopCinematicsLibrary
                  activeCinematicId={preparedScene?.metadata.cinematicId ?? ''}
                  cinematics={assetLibrary?.cinematics ?? []}
                  onActivate={(cinematicId) => applyCinematicToPreparedScene(cinematicId)}
                  onTrigger={triggerCinematicOverlay}
                  targetSceneName={preparedScene?.name ?? 'Sem cena'}
                />
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

          {activeHudPanel === 'book' ? (
            <FloatingWindow
              initialPosition={{ x: 104, y: 220 }}
              initialSize={{ width: 400, height: 320 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Atalho rapido para consulta sem prender a mesa a um painel fixo."
              title="Livro"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Atalho rapido para consulta sem prender a mesa a um painel fixo."
                title="Livro"
                footer={
                  <Link className="button button--primary" to="/livro">
                    Abrir modulo Livro
                  </Link>
                }
              >
                <div className="tag-row">
                  <span className="tag">Visao Geral</span>
                  <span className="tag">FUSHI</span>
                  <span className="tag">Protagonistas</span>
                  <span className="tag">Regras da Existencia</span>
                  <span className="tag">Faccoes</span>
                  <span className="tag">Sistema</span>
                </div>
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

          {activeHudPanel === 'settings' ? (
            <FloatingWindow
              initialPosition={{ x: 104, y: 220 }}
              initialSize={{ width: 420, height: 340 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Preferencias e controles locais da mesa."
              title="Configuracao"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Preferencias e controles locais da mesa."
                title="Configuracao"
                footer={
                  <Link className="button" to="/configuracoes">
                    Abrir configuracoes
                  </Link>
                }
              >
                <div className="tabletop-hud-panel__actions">
                  <button
                    className="button"
                    onClick={() =>
                      updateSession((currentSession) => ({
                        ...currentSession,
                        isGridVisible: !currentSession.isGridVisible,
                      }))
                    }
                    type="button"
                  >
                    {isGridVisible ? 'Esconder grid' : 'Mostrar grid'}
                  </button>
                  <button
                    className="button"
                    onClick={() => setSelection([])}
                    type="button"
                  >
                    Limpar selecao
                  </button>
                  <button
                    className="button button--primary"
                    onClick={handleResetSession}
                    type="button"
                  >
                    Resetar sessao
                  </button>
                </div>
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}
        </>
      ) : null}

      {activeUtilityWindow === 'log' ? (
        <FloatingWindow
          className="floating-window--log"
          initialPosition={{ x: window.innerWidth > 1200 ? 980 : 140, y: 72 }}
          initialSize={{ width: 420, height: 620 }}
          onClose={() => setActiveUtilityWindow(null)}
          subtitle="Mensagens, pings e rolagens da sessao."
          title="Chat e rolagem"
        >
          <TabletopSessionLog
            entries={logEntries}
            isGm={viewMode === 'gm'}
            onAddEntry={appendLogEntry}
            onClearEntries={clearLogEntries}
          />
        </FloatingWindow>
      ) : null}

      {activeUtilityWindow === 'notes' ? (
        <FloatingWindow
          initialPosition={{ x: window.innerWidth > 1200 ? 920 : 120, y: 92 }}
          initialSize={{ width: 440, height: 520 }}
          onClose={() => setActiveUtilityWindow(null)}
          subtitle="Bloco de notas pessoal salvo neste navegador."
          title="Anotacoes"
        >
          <TabletopNotesPanel
            onChange={(nextNotes) =>
              setPersonalNotesByOwner((currentNotes) => ({
                ...currentNotes,
                [personalNotesOwnerId]: nextNotes,
              }))
            }
            onClear={() =>
              setPersonalNotesByOwner((currentNotes) => ({
                ...currentNotes,
                [personalNotesOwnerId]: '',
              }))
            }
            ownerLabel={personalNotesOwnerLabel}
            value={personalNotes}
          />
        </FloatingWindow>
      ) : null}

      {activeUtilityWindow === 'audio' && viewMode === 'gm' ? (
        <FloatingWindow
          initialPosition={{ x: window.innerWidth > 1200 ? 980 : 140, y: 72 }}
          initialSize={{ width: 420, height: 520 }}
          onClose={() => setActiveUtilityWindow(null)}
          subtitle="Controle local de musica e ambiencia da cena ativa."
          title="Audio"
        >
          <TabletopAudioPanel
            ambienceTrack={activeSceneAudio.ambience}
            ambienceVolume={ambienceVolume}
            musicTrack={activeSceneAudio.music}
            musicVolume={musicVolume}
            onAmbienceVolumeChange={(value) =>
              setAmbienceVolume(sanitizeAudioVolume(value))
            }
            onMusicVolumeChange={(value) =>
              setMusicVolume(sanitizeAudioVolume(value))
            }
            onPause={handleAudioPause}
            onPlay={handleAudioPlay}
            onStop={handleAudioStop}
            statusMessage={audioStatusMessage}
            transportState={audioTransportState}
          />
        </FloatingWindow>
      ) : null}

      {activeUtilityWindow === 'access' && viewMode === 'gm' ? (
        <FloatingWindow
          initialPosition={{ x: window.innerWidth > 1200 ? 900 : 120, y: 92 }}
          initialSize={{ width: 680, height: 620 }}
          onClose={() => setActiveUtilityWindow(null)}
          subtitle="Controle local das entradas de mestre e jogadores."
          title="Senhas"
        >
          <TabletopAccessPanel
            onLogout={logoutAccessProfile}
            onSaveProfile={updateAccessProfile}
            playerCharacters={playerCharacters}
            profiles={accessState.profiles}
          />
        </FloatingWindow>
      ) : null}

      {activeUtilityWindow === 'help' && viewMode === 'gm' ? (
        <FloatingWindow
          initialPosition={{ x: 140, y: 72 }}
          initialSize={{ width: 360, height: 420 }}
          onClose={() => setActiveUtilityWindow(null)}
          subtitle="Atalhos e gestos da Mesa."
          title="Ajuda"
        >
          <TabletopHelpPanel />
        </FloatingWindow>
      ) : null}

      <TokenInspector
        canEdit={canEditActiveCharacter}
        canEditToken={canEditActiveToken}
        canRemoveToken={viewMode === 'gm' && Boolean(activeToken)}
        character={activeCharacter}
        factionName={activeFaction?.nome ?? null}
        factions={data.factions.items}
        activeSharedBodySheetSelectionId={activeSharedBodySheetSelectionId}
        activeIdentityResourceProfileId={activeIdentityResourceProfileId}
        identityResourceOptions={identityResourceOptions}
        onBroadcastImage={viewMode === 'gm' ? broadcastImagePreview : undefined}
        onCharacterChange={handleInspectorCharacterChange}
        onClose={() => setInspectedTokenId('')}
        onIdentityResourceSelect={(profileId) => {
          if (!activeToken) {
            return
          }

          setIdentityResourceProfileByToken((currentSelections) => ({
            ...currentSelections,
            [activeToken.id]: profileId,
          }))
        }}
        onPreviewImage={openImagePreview}
        onRemoveToken={() =>
          activeToken ? removeTokenFromCurrentScene(activeToken.id) : null
        }
        onSharedBodySheetSelect={(selectionId) => {
          if (!activeToken) {
            return
          }

          setSharedBodySheetProfileByToken((currentSelections) => ({
            ...currentSelections,
            [activeToken.id]: selectionId,
          }))
        }}
        onBindTokenAsPlayerBody={
          viewMode === 'gm' && activeToken
            ? (playerId, originalState) =>
                handleBindTokenAsPlayerBody(activeToken.id, playerId, originalState)
            : undefined
        }
        onTokenControlChange={
          viewMode === 'gm' && activeToken
            ? (playerIds) => handleTokenControlChange(activeToken.id, playerIds)
            : undefined
        }
        onTokenSizeChange={(preset) =>
          activeToken ? handleTokenSizeChange(activeToken.id, preset) : null
        }
        onToggleVisibility={
          viewMode === 'gm' && activeToken
            ? () => handleToggleTokenVisibility(activeToken.id)
            : undefined
        }
        selectedCount={selectedTokenIds.length}
        showSensitiveNotes={viewMode === 'gm'}
        playerProfiles={accessState.profiles}
        sharedBodySheetOptions={viewMode === 'gm' ? sharedBodySheetOptions : []}
        token={activeToken}
        tokenSizePreset={activeTokenSpan?.preset ?? null}
        tokenSizeSummary={activeTokenSizeSummary}
      />
    </div>
  )
}
