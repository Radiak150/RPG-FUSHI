import type {
  AppViewMode,
  CharacterActionCost,
  CharacterActionResolutionRule,
  CharacterResources,
  RollRecord,
  TabletopBoardObject,
  TabletopCamera3DState,
  TabletopCameraState,
  TabletopCell,
  TabletopObject3DPlacement,
  TabletopObjectVisibility,
  TabletopOriginalConsciousnessState,
  TabletopSceneMetadata,
  TabletopScene,
  TokenControl,
  TabletopToken,
  TabletopTokenStealthState,
  TabletopTokenVisibility,
} from '../data/types'
import {
  TABLETOP_STATUS_CATALOG,
  type TabletopStatusIcon,
  type TabletopStatusId,
} from '../data/statusCatalog'
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
import {
  normalizeTabletopTrainingState,
  type TabletopTrainingState,
} from './tabletopTraining'
import {
  normalizeTabletopEventSystemState,
  type TabletopEventSystemState,
} from './tabletopEvents'
import {
  createDefaultTabletopSceneLighting,
  normalizeTabletopSceneLighting,
} from './tabletopLighting'

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

export interface TabletopMeasurement {
  id: string
  sceneId: string
  authorView: AppViewMode
  authorId?: string
  authorLabel?: string
  start: TabletopCell
  end: TabletopCell
  visualColor?: string
  updatedAt: number
}

export interface TabletopCombatPreview {
  color: string
  createdAt: number
  expiresAt: number
  id: string
  label: string
  origin: TabletopCell
  radiusMeters?: number
  sceneId: string
  shape: 'adjacent' | 'map' | 'radius'
  sourceTokenId: string
  targetTokenId?: string
}

export interface TabletopCombatImpact {
  amount?: number
  createdAt: number
  expiresAt: number
  id: string
  tokenId: string
  type: 'ability-failure' | 'ability-success' | 'attack' | 'damage' | 'heal'
}

export interface TabletopCombatMark {
  cancelableBySource?: boolean
  color: string
  createdAt: number
  description?: string
  durationRounds?: number
  id: string
  icon?: TabletopStatusIcon
  kind?: 'buff' | 'condition' | 'debuff' | 'mark'
  label: string
  lastProcessedRound?: number
  notes?: string
  sourceCharacterId?: string
  sourceFeatureId?: string
  sourceTokenId: string
  stacks?: number
  statusId?: TabletopStatusId
  targetCharacterId?: string
  targetTokenId: string
}

export interface TabletopPlayerDeathState {
  failures: number
  results: Array<'failure' | 'success' | null>
  status: 'down' | 'dead'
  successes: number
  tokenId: string
  updatedAt: number
}

export interface TabletopCombatResourceChange {
  after: number
  before: number
  label: string
}

export interface TabletopCombatReceipt {
  attackerName: string
  createdAt: number
  damageApplied: number
  healingApplied: number
  id: string
  outcome: 'block' | 'dodge' | 'hit' | 'miss'
  resourceChangesByPlayerId: Record<string, TabletopCombatResourceChange[]>
  sceneId: string
  summary: string
  targetName: string
  visibleToPlayerIds: string[]
}

export interface TabletopLogEntry {
  id: string
  type: 'message' | 'roll' | 'ping' | 'system'
  visibility: 'public' | 'gm'
  author: string
  text: string
  createdAt: string
  roll?: RollRecord
  combat?: TabletopCombatLogPayload
  turnRequest?: TabletopTurnActionRequest
}

export interface TabletopTurnActionRequest {
  characterId: string
  featureId?: string
  id: string
  kind: 'feature' | 'maneuver'
  label: string
  maneuverId?: string
  playerId: string
  status: 'approved' | 'pending' | 'rejected'
  timing: TabletopTurnActionId
  tokenId: string
  updatedAt?: number
}

export interface TabletopCharacterEditLock {
  acquiredAt: number
  characterId: string
  expiresAt: number
  mode: 'full' | 'quick'
  ownerId: string
  ownerLabel: string
}

export interface TabletopCombatLogPayload {
  attackerCharacterId: string
  attackerName: string
  attackerTokenId: string
  attackName: string
  baseDamageFormula?: string
  buildDamageBonus?: number
  checkDifficulty?: number
  checkTarget?: 'ca' | 'dt' | 'resistido'
  costs?: CharacterActionCost[]
  damageContexts?: Array<'ability' | 'adjacent' | 'melee' | 'ranged'>
  damageFormula: string
  distanceMeters?: number | null
  distanceSquares?: number | null
  kind: 'attack'
  isCritical?: boolean
  opposedAttribute?: string
  opposedSkill?: string
  rollBase?: number
  rollText?: string
  rollTotal?: number
  sourceFeatureId?: string
  sourceFeatureResolution?: CharacterActionResolutionRule
  sourceCell?: TabletopCell
  targetCell?: TabletopCell
  targetTokenId?: string
  turnActionId?: TabletopTurnActionId
}

export type TabletopTurnActionId =
  | 'fala'
  | 'padrao'
  | 'bonus'
  | 'movimento'
  | 'reacao'

export interface TabletopTurnParticipant {
  characterId: string
  color: string
  id: string
  imageUrl?: string
  label: string
  name: string
  tokenId: string
  tokenKind?: TabletopToken['tokenKind']
}

export interface TabletopTurnState {
  activeParticipantId: string
  encounterId: string
  isActive: boolean
  participants: TabletopTurnParticipant[]
  round: number
  updatedAt: number
  usedActions: Partial<Record<string, Partial<Record<TabletopTurnActionId, boolean>>>>
}

export type TabletopAudioMixerTrackStatus = 'playing' | 'paused' | 'stopped'

export interface TabletopAudioMixerTrackState {
  currentTime: number
  duration: number
  status: TabletopAudioMixerTrackStatus
  updatedAt: number
  volume: number
}

export interface TabletopAudioMixerState {
  tracks: Record<string, TabletopAudioMixerTrackState>
  updatedAt: number
}

export interface PersistedTabletopSession {
  version: 17
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
  activeMeasurement: TabletopMeasurement | null
  publicCombatPreview: TabletopCombatPreview | null
  publicCombatImpacts: TabletopCombatImpact[]
  publicCombatMarks: TabletopCombatMark[]
  publicCombatReceipt: TabletopCombatReceipt | null
  playerDeathStates: Record<string, TabletopPlayerDeathState>
  logEntries: TabletopLogEntry[]
  broadcastEvents: TabletopBroadcastEvent[]
  turnState: TabletopTurnState | null
  trainingState: TabletopTrainingState | null
  eventState: TabletopEventSystemState
  audioMixerState: TabletopAudioMixerState
  characterEditLocks: Record<string, TabletopCharacterEditLock>
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
  updatedAt: number
}

export interface TabletopBroadcastEvent {
  id: string
  type:
    | 'audio'
    | 'cinematic'
    | 'image-preview'
    | 'image-preview-close'
    | 'intro'
    | 'mixer-audio'
    | 'transition'
    | 'transition-close'
    | 'transition-playback'
    | 'vfx'
  createdAt: number
  sceneId?: string
  introCardId?: string
  transitionId?: string
  cinematicId?: string
  src?: string
  label?: string
  audioTransportState?: 'playing' | 'paused' | 'stopped'
  musicVolume?: number
  ambienceVolume?: number
  mixerAction?: 'play' | 'pause' | 'stop' | 'seek' | 'volume'
  mixerTrackId?: string
  mixerTime?: number
  mixerVolume?: number
  playbackState?: SharedTransitionPlaybackState | null
  vfxAction?: 'show' | 'clear'
  vfxPresetId?: string
  vfxTargetTokenId?: string
  vfxExpiresAt?: number
}

export interface PersistedTransitionOverride {
  assetUrl?: string
  customName?: string
  thumbnailUrl?: string
  keepCurrentMap?: boolean
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

function normalizeMeasurement(value: unknown): TabletopMeasurement | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.sceneId !== 'string' ||
    (value.authorView !== 'gm' && value.authorView !== 'player') ||
    !isValidCell(value.start) ||
    !isValidCell(value.end) ||
    typeof value.updatedAt !== 'number'
  ) {
    return null
  }

  return {
    authorId: typeof value.authorId === 'string' ? value.authorId : undefined,
    authorLabel: typeof value.authorLabel === 'string' ? value.authorLabel : undefined,
    id: value.id,
    sceneId: value.sceneId,
    authorView: value.authorView,
    start: value.start,
    end: value.end,
    visualColor: typeof value.visualColor === 'string' ? value.visualColor : undefined,
    updatedAt: value.updatedAt,
  }
}

function normalizeCombatPreview(value: unknown): TabletopCombatPreview | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.sceneId !== 'string' ||
    typeof value.sourceTokenId !== 'string' ||
    typeof value.label !== 'string' ||
    typeof value.color !== 'string' ||
    !isValidCell(value.origin) ||
    (value.shape !== 'adjacent' && value.shape !== 'map' && value.shape !== 'radius') ||
    typeof value.createdAt !== 'number' ||
    typeof value.expiresAt !== 'number'
  ) {
    return null
  }

  const radiusMeters =
    typeof value.radiusMeters === 'number' && Number.isFinite(value.radiusMeters)
      ? Math.max(0, value.radiusMeters)
      : undefined

  return {
    color: /^#[0-9a-f]{6}$/i.test(value.color) ? value.color : '#8e6cff',
    createdAt: value.createdAt,
    expiresAt: value.expiresAt,
    id: value.id,
    label: value.label,
    origin: value.origin,
    radiusMeters,
    sceneId: value.sceneId,
    shape: value.shape,
    sourceTokenId: value.sourceTokenId,
    targetTokenId:
      typeof value.targetTokenId === 'string' && value.targetTokenId
        ? value.targetTokenId
        : undefined,
  }
}

function normalizeCombatImpacts(value: unknown): TabletopCombatImpact[] {
  if (!Array.isArray(value)) {
    return []
  }

  const now = Date.now()

  return value
    .filter(
      (candidate): candidate is Record<string, unknown> =>
        isRecord(candidate) &&
        typeof candidate.id === 'string' &&
        typeof candidate.tokenId === 'string' &&
        (candidate.type === 'attack' ||
          candidate.type === 'ability-failure' ||
          candidate.type === 'ability-success' ||
          candidate.type === 'damage' ||
          candidate.type === 'heal') &&
        typeof candidate.createdAt === 'number' &&
        typeof candidate.expiresAt === 'number' &&
        candidate.expiresAt > now - 1000,
    )
    .slice(-12)
    .map((candidate) => ({
      amount:
        typeof candidate.amount === 'number' && Number.isFinite(candidate.amount)
          ? Math.max(0, Math.round(candidate.amount))
          : undefined,
      createdAt: candidate.createdAt as number,
      expiresAt: candidate.expiresAt as number,
      id: candidate.id as string,
      tokenId: candidate.tokenId as string,
      type: candidate.type as TabletopCombatImpact['type'],
    }))
}

const TABLETOP_STATUS_IDS = new Set(
  TABLETOP_STATUS_CATALOG.map((status) => status.id),
)
const TABLETOP_STATUS_ICONS = new Set<TabletopStatusIcon>([
  ...TABLETOP_STATUS_CATALOG.map((status) => status.icon),
  'custom',
  'science',
])

function normalizeCombatMarks(value: unknown): TabletopCombatMark[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (candidate): candidate is Record<string, unknown> =>
        isRecord(candidate) &&
        typeof candidate.id === 'string' &&
        typeof candidate.label === 'string' &&
        typeof candidate.sourceTokenId === 'string' &&
        typeof candidate.targetTokenId === 'string' &&
        typeof candidate.createdAt === 'number',
    )
    .slice(-48)
    .map((candidate) => ({
      cancelableBySource:
        typeof candidate.cancelableBySource === 'boolean'
          ? candidate.cancelableBySource
          : undefined,
      color:
        typeof candidate.color === 'string' && /^#[0-9a-f]{6}$/i.test(candidate.color)
          ? candidate.color
          : '#a88cff',
      createdAt: candidate.createdAt as number,
      description:
        typeof candidate.description === 'string'
          ? candidate.description.trim().slice(0, 480)
          : undefined,
      durationRounds:
        typeof candidate.durationRounds === 'number' &&
        Number.isFinite(candidate.durationRounds)
          ? Math.max(1, Math.min(99, Math.round(candidate.durationRounds)))
          : undefined,
      id: candidate.id as string,
      icon:
        typeof candidate.icon === 'string' &&
        TABLETOP_STATUS_ICONS.has(candidate.icon as TabletopStatusIcon)
          ? (candidate.icon as TabletopStatusIcon)
          : undefined,
      kind:
        candidate.kind === 'buff' ||
        candidate.kind === 'condition' ||
        candidate.kind === 'debuff' ||
        candidate.kind === 'mark'
          ? candidate.kind
          : undefined,
      label: candidate.label as string,
      lastProcessedRound:
        typeof candidate.lastProcessedRound === 'number' &&
        Number.isFinite(candidate.lastProcessedRound)
          ? Math.max(1, Math.round(candidate.lastProcessedRound))
          : undefined,
      notes:
        typeof candidate.notes === 'string'
          ? candidate.notes.trim().slice(0, 480)
          : undefined,
      sourceCharacterId:
        typeof candidate.sourceCharacterId === 'string'
          ? candidate.sourceCharacterId
          : undefined,
      sourceFeatureId:
        typeof candidate.sourceFeatureId === 'string'
          ? candidate.sourceFeatureId
          : undefined,
      sourceTokenId: candidate.sourceTokenId as string,
      stacks:
        typeof candidate.stacks === 'number' && Number.isFinite(candidate.stacks)
          ? Math.max(1, Math.min(99, Math.round(candidate.stacks)))
          : undefined,
      statusId:
        typeof candidate.statusId === 'string' &&
        TABLETOP_STATUS_IDS.has(candidate.statusId as TabletopStatusId)
          ? (candidate.statusId as TabletopStatusId)
          : undefined,
      targetCharacterId:
        typeof candidate.targetCharacterId === 'string'
          ? candidate.targetCharacterId
          : undefined,
      targetTokenId: candidate.targetTokenId as string,
    }))
}

function normalizePlayerDeathStates(
  value: unknown,
): Record<string, TabletopPlayerDeathState> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([tokenId, candidate]) => {
      if (!isRecord(candidate)) {
        return []
      }

      const legacyFailures =
        typeof candidate.failures === 'number'
          ? Math.max(0, Math.min(3, Math.round(candidate.failures)))
          : 0
      const legacySuccesses =
        typeof candidate.successes === 'number'
          ? Math.max(0, Math.min(3, Math.round(candidate.successes)))
          : 0
      const results = (
        Array.isArray(candidate.results)
          ? candidate.results
              .slice(0, 3)
              .map((result) =>
                result === 'failure' || result === 'success' ? result : null,
              )
          : [
              ...Array.from({ length: legacySuccesses }, () => 'success' as const),
              ...Array.from({ length: legacyFailures }, () => 'failure' as const),
            ]
      ).concat([null, null, null]).slice(0, 3)
      const failures = results.filter((result) => result === 'failure').length
      const successes = results.filter((result) => result === 'success').length

      return [[
        tokenId,
        {
          failures,
          results,
          status: candidate.status === 'dead' || failures >= 3 ? 'dead' : 'down',
          successes,
          tokenId,
          updatedAt:
            typeof candidate.updatedAt === 'number' ? candidate.updatedAt : Date.now(),
        } satisfies TabletopPlayerDeathState,
      ]]
    }),
  )
}

function normalizeCombatReceipt(value: unknown): TabletopCombatReceipt | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.sceneId !== 'string' ||
    typeof value.attackerName !== 'string' ||
    typeof value.targetName !== 'string' ||
    typeof value.summary !== 'string' ||
    typeof value.createdAt !== 'number' ||
    !Array.isArray(value.visibleToPlayerIds) ||
    !isRecord(value.resourceChangesByPlayerId) ||
    (value.outcome !== 'hit' &&
      value.outcome !== 'block' &&
      value.outcome !== 'dodge' &&
      value.outcome !== 'miss')
  ) {
    return null
  }

  const resourceChangesByPlayerId = Object.fromEntries(
    Object.entries(value.resourceChangesByPlayerId).map(([playerId, changes]) => [
      playerId,
      Array.isArray(changes)
        ? changes
            .filter(
              (change): change is Record<string, unknown> =>
                isRecord(change) &&
                typeof change.label === 'string' &&
                typeof change.before === 'number' &&
                typeof change.after === 'number',
            )
            .map((change) => ({
              after: Math.round(change.after as number),
              before: Math.round(change.before as number),
              label: change.label as string,
            }))
        : [],
    ]),
  )

  return {
    attackerName: value.attackerName,
    createdAt: value.createdAt,
    damageApplied:
      typeof value.damageApplied === 'number'
        ? Math.max(0, Math.round(value.damageApplied))
        : 0,
    healingApplied:
      typeof value.healingApplied === 'number'
        ? Math.max(0, Math.round(value.healingApplied))
        : 0,
    id: value.id,
    outcome: value.outcome,
    resourceChangesByPlayerId,
    sceneId: value.sceneId,
    summary: value.summary,
    targetName: value.targetName,
    visibleToPlayerIds: value.visibleToPlayerIds.filter(
      (playerId): playerId is string => typeof playerId === 'string',
    ),
  }
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

function normalizeTokenStealth(value: unknown): TabletopTokenStealthState | undefined {
  if (!isRecord(value) || value.enabled !== true) {
    return undefined
  }

  return {
    enabled: true,
    ownerPlayerId:
      typeof value.ownerPlayerId === 'string' && value.ownerPlayerId.trim()
        ? value.ownerPlayerId.trim()
        : undefined,
  }
}

function normalizeTokenResourceOverride(value: unknown): CharacterResources | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const vidaMaxima =
    typeof value.vidaMaxima === 'number' && Number.isFinite(value.vidaMaxima)
      ? Math.max(0, Math.round(value.vidaMaxima))
      : null
  const fushiMaximo =
    typeof value.fushiMaximo === 'number' && Number.isFinite(value.fushiMaximo)
      ? Math.max(0, Math.round(value.fushiMaximo))
      : null
  const determinacaoMaxima =
    typeof value.determinacaoMaxima === 'number' && Number.isFinite(value.determinacaoMaxima)
      ? Math.max(0, Math.round(value.determinacaoMaxima))
      : null

  if (vidaMaxima === null || fushiMaximo === null || determinacaoMaxima === null) {
    return undefined
  }

  const vidaAtual =
    typeof value.vidaAtual === 'number' && Number.isFinite(value.vidaAtual)
      ? Math.max(0, Math.min(vidaMaxima, Math.round(value.vidaAtual)))
      : vidaMaxima
  const fushiAtual =
    typeof value.fushiAtual === 'number' && Number.isFinite(value.fushiAtual)
      ? Math.max(0, Math.min(fushiMaximo, Math.round(value.fushiAtual)))
      : fushiMaximo
  const determinacaoAtual =
    typeof value.determinacaoAtual === 'number' && Number.isFinite(value.determinacaoAtual)
      ? Math.max(0, Math.min(determinacaoMaxima, Math.round(value.determinacaoAtual)))
      : determinacaoMaxima

  return {
    determinacaoAtual,
    determinacaoMaxima,
    fushiAtual,
    fushiMaximo,
    vidaAtual,
    vidaMaxima,
  }
}

function normalizeObjectVisibility(value: unknown): TabletopObjectVisibility | null {
  if (value === 'public' || value === 'gm') {
    return value
  }

  if (typeof value === 'boolean') {
    return value ? 'public' : 'gm'
  }

  return null
}

function sanitizeFiniteNumber(
  value: unknown,
  fallback: number,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(min, Math.min(max, value))
}

function normalizeObject3DPlacement(value: unknown): TabletopObject3DPlacement | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const placement: TabletopObject3DPlacement = {
    x: sanitizeFiniteNumber(value.x, 0.5, 0, 1),
    y: sanitizeFiniteNumber(value.y, 0.5, 0, 1),
  }

  if (typeof value.z === 'number' && Number.isFinite(value.z)) {
    placement.z = sanitizeFiniteNumber(value.z, 0, -4, 20)
  }

  if (typeof value.rotationX === 'number' && Number.isFinite(value.rotationX)) {
    placement.rotationX = sanitizeFiniteNumber(value.rotationX, 0, -Math.PI * 8, Math.PI * 8)
  }

  if (typeof value.rotationY === 'number' && Number.isFinite(value.rotationY)) {
    placement.rotationY = sanitizeFiniteNumber(value.rotationY, 0, -Math.PI * 8, Math.PI * 8)
  }

  if (typeof value.rotationZ === 'number' && Number.isFinite(value.rotationZ)) {
    placement.rotationZ = sanitizeFiniteNumber(value.rotationZ, 0, -Math.PI * 8, Math.PI * 8)
  }

  if (typeof value.scale === 'number' && Number.isFinite(value.scale)) {
    placement.scale = sanitizeFiniteNumber(value.scale, 1, 0.01, 80)
  }

  if (typeof value.scaleX === 'number' && Number.isFinite(value.scaleX)) {
    placement.scaleX = sanitizeFiniteNumber(value.scaleX, 1, 0.01, 80)
  }

  if (typeof value.scaleY === 'number' && Number.isFinite(value.scaleY)) {
    placement.scaleY = sanitizeFiniteNumber(value.scaleY, 1, 0.01, 80)
  }

  if (typeof value.scaleZ === 'number' && Number.isFinite(value.scaleZ)) {
    placement.scaleZ = sanitizeFiniteNumber(value.scaleZ, 1, 0.01, 80)
  }

  return placement
}

function normalizeBoardObject(value: unknown): TabletopBoardObject | null {
  if (!isRecord(value)) {
    return null
  }

  const visibility = normalizeObjectVisibility(value.visibility)

  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.label !== 'string' ||
    !isValidCell(value.cell) ||
    !visibility
  ) {
    return null
  }

  return {
    id: value.id,
    name: value.name,
    label: value.label,
    description:
      typeof value.description === 'string' ? value.description : undefined,
    objectType:
      value.objectType === 'prop' ||
      value.objectType === 'hazard' ||
      value.objectType === 'objective'
        ? value.objectType
        : 'item',
    renderMode: value.renderMode === 'three' ? 'three' : 'sprite',
    assetUrl: typeof value.assetUrl === 'string' ? value.assetUrl : undefined,
    modelUrl: typeof value.modelUrl === 'string' ? value.modelUrl : undefined,
    modelNodeName:
      typeof value.modelNodeName === 'string' ? value.modelNodeName : undefined,
    color: typeof value.color === 'string' ? value.color : undefined,
    cell: value.cell,
    size: normalizeTabletopTokenSize(
      typeof value.size === 'number' ? value.size : undefined,
    ),
    customSize: normalizeTabletopTokenCustomSize(value.customSize),
    placement3d: normalizeObject3DPlacement(value.placement3d),
    visibility,
    linkedItemId:
      typeof value.linkedItemId === 'string' ? value.linkedItemId : undefined,
    interactable: value.interactable !== false,
  }
}

function normalizeOriginalConsciousnessState(
  value: unknown,
): TabletopOriginalConsciousnessState {
  return value === 'suprimida' ||
    value === 'em_disputa' ||
    value === 'coexistindo' ||
    value === 'removida' ||
    value === 'desconhecida'
    ? value
    : 'desconhecida'
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

  const persistentControl = isRecord(value.persistentControl)
    ? {
        bodyId:
          typeof value.persistentControl.bodyId === 'string'
            ? value.persistentControl.bodyId
            : '',
        consciousnessId:
          typeof value.persistentControl.consciousnessId === 'string'
            ? value.persistentControl.consciousnessId
            : '',
        linkedAt:
          typeof value.persistentControl.linkedAt === 'string'
            ? value.persistentControl.linkedAt
            : new Date().toISOString(),
        originalConsciousnessState: normalizeOriginalConsciousnessState(
          value.persistentControl.originalConsciousnessState,
        ),
        playerId:
          typeof value.persistentControl.playerId === 'string'
            ? value.persistentControl.playerId
            : '',
      }
    : undefined

  return {
    id: value.id,
    avatarUrl: typeof value.avatarUrl === 'string' ? value.avatarUrl : undefined,
    bodyId: typeof value.bodyId === 'string' ? value.bodyId : undefined,
    characterId: value.characterId,
    controladoPorJogadorId:
      typeof value.controladoPorJogadorId === 'string'
        ? value.controladoPorJogadorId
        : undefined,
    customSize: normalizeTabletopTokenCustomSize(value.customSize),
    label: value.label,
    color: value.color,
    cell: value.cell,
    mobId: typeof value.mobId === 'string' ? value.mobId : undefined,
    mobInstanceNumber:
      typeof value.mobInstanceNumber === 'number' &&
      Number.isFinite(value.mobInstanceNumber) &&
      value.mobInstanceNumber > 0
        ? Math.floor(value.mobInstanceNumber)
        : undefined,
    npcId: typeof value.npcId === 'string' ? value.npcId : undefined,
    tokenImageUrl:
      typeof value.tokenImageUrl === 'string' ? value.tokenImageUrl : undefined,
    size: normalizeTabletopTokenSize(
      typeof value.size === 'number' ? value.size : undefined,
    ),
    tokenKind:
      value.tokenKind === 'player_corpo' ||
      value.tokenKind === 'npc' ||
      value.tokenKind === 'mob' ||
      value.tokenKind === 'grupo'
        ? value.tokenKind
        : undefined,
    visibility,
    control: normalizeTokenControl(value.control),
    persistentControl:
      persistentControl?.bodyId &&
      persistentControl.consciousnessId &&
      persistentControl.playerId
        ? persistentControl
        : undefined,
    resourceOverride: normalizeTokenResourceOverride(value.resourceOverride),
    stealth: normalizeTokenStealth(value.stealth),
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

function normalizeCamera3DState(value: unknown): TabletopCamera3DState | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const nextCameraState: TabletopCamera3DState = {}

  if (typeof value.enabled === 'boolean') {
    nextCameraState.enabled = value.enabled
  }

  if (value.mode === 'topdown' || value.mode === 'free') {
    nextCameraState.mode = value.mode
  }

  if (typeof value.yaw === 'number' && Number.isFinite(value.yaw)) {
    nextCameraState.yaw = sanitizeFiniteNumber(
      value.yaw,
      0.72,
      -Math.PI * 8,
      Math.PI * 8,
    )
  }

  if (typeof value.pitch === 'number' && Number.isFinite(value.pitch)) {
    nextCameraState.pitch = sanitizeFiniteNumber(value.pitch, 1.08, 0.18, 1.54)
  }

  if (typeof value.distance === 'number' && Number.isFinite(value.distance)) {
    nextCameraState.distance = sanitizeFiniteNumber(value.distance, 8.4, 2.2, 28)
  }

  if (typeof value.targetX === 'number' && Number.isFinite(value.targetX)) {
    nextCameraState.targetX = sanitizeFiniteNumber(value.targetX, 0, -12, 12)
  }

  if (typeof value.targetY === 'number' && Number.isFinite(value.targetY)) {
    nextCameraState.targetY = sanitizeFiniteNumber(value.targetY, 0, -12, 12)
  }

  if (typeof value.targetZ === 'number' && Number.isFinite(value.targetZ)) {
    nextCameraState.targetZ = sanitizeFiniteNumber(value.targetZ, 0, -2, 10)
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
      lighting: createDefaultTabletopSceneLighting(),
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
    lighting: normalizeTabletopSceneLighting(value.lighting),
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

  const objects = Array.isArray(value.objects)
    ? value.objects
        .map((object) => normalizeBoardObject(object))
        .filter((object): object is TabletopBoardObject => object !== null)
    : []

  return {
    id: value.id,
    name: value.name,
    mapId: value.mapId,
    tokens,
    objects,
    gridCellSize:
      typeof value.gridCellSize === 'number'
        ? clampTabletopGridCellSize(value.gridCellSize)
        : undefined,
    cameraState: normalizeCameraState(value.cameraState),
    camera3dState: normalizeCamera3DState(value.camera3dState),
    metadata: normalizeSceneMetadata(value.metadata),
  }
}

function createLegacyScene(tokens: TabletopToken[] | null) {
  return {
    id: LEGACY_SCENE_ID,
    name: 'Cena atual',
    mapId: LEGACY_SCENE_MAP_ID,
    tokens: tokens ?? [],
    objects: [],
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
          camera3dState: normalizeCamera3DState(scene.camera3dState),
          objects: (scene.objects ?? []).map((object) => ({
            ...object,
            placement3d: object.placement3d
              ? { ...object.placement3d }
              : undefined,
          })),
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
    typeof value.tipoDado === 'number' &&
    (value.visualColor === undefined || typeof value.visualColor === 'string')
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
    (value.roll === undefined || isValidRollRecord(value.roll)) &&
    (value.combat === undefined || isValidCombatLogPayload(value.combat))
  )
}

function isValidCombatLogPayload(value: unknown): value is TabletopCombatLogPayload {
  return (
    isRecord(value) &&
    value.kind === 'attack' &&
    typeof value.attackerCharacterId === 'string' &&
    typeof value.attackerName === 'string' &&
    typeof value.attackerTokenId === 'string' &&
    typeof value.attackName === 'string' &&
    typeof value.damageFormula === 'string' &&
    (value.rollText === undefined || typeof value.rollText === 'string') &&
    (value.rollTotal === undefined || typeof value.rollTotal === 'number') &&
    (value.sourceFeatureId === undefined || typeof value.sourceFeatureId === 'string')
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
  const updatedAt =
    typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)
      ? value.updatedAt
      : startedAt

  return {
    activeTransitionId,
    startedAt,
    paused: value.paused === true,
    currentTime: Math.max(0, currentTime),
    mapTargetId,
    updatedAt,
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
      typeof overrideValue.customName === 'string' &&
      overrideValue.customName.trim().length > 0
    ) {
      nextOverride.customName = overrideValue.customName.trim()
    }

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

    if (typeof overrideValue.keepCurrentMap === 'boolean') {
      nextOverride.keepCurrentMap = overrideValue.keepCurrentMap
    }

    if (typeof overrideValue.toMapId === 'string') {
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

function normalizeBroadcastEvent(value: unknown): TabletopBroadcastEvent | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null
  }

  if (
    value.type !== 'audio' &&
    value.type !== 'cinematic' &&
    value.type !== 'image-preview' &&
    value.type !== 'image-preview-close' &&
    value.type !== 'intro' &&
    value.type !== 'mixer-audio' &&
    value.type !== 'transition' &&
    value.type !== 'transition-close' &&
    value.type !== 'transition-playback' &&
    value.type !== 'vfx'
  ) {
    return null
  }

  const event: TabletopBroadcastEvent = {
    id: value.id,
    type: value.type,
    createdAt:
      typeof value.createdAt === 'number' && Number.isFinite(value.createdAt)
        ? value.createdAt
        : Date.now(),
  }

  if (typeof value.sceneId === 'string') event.sceneId = value.sceneId
  if (typeof value.introCardId === 'string') event.introCardId = value.introCardId
  if (typeof value.transitionId === 'string') event.transitionId = value.transitionId
  if (typeof value.cinematicId === 'string') event.cinematicId = value.cinematicId
  if (typeof value.src === 'string') event.src = value.src
  if (typeof value.label === 'string') event.label = value.label
  if (typeof value.mixerTrackId === 'string') event.mixerTrackId = value.mixerTrackId
  if (typeof value.vfxPresetId === 'string' && value.vfxPresetId.trim()) {
    event.vfxPresetId = value.vfxPresetId.trim()
  }
  if (
    typeof value.vfxTargetTokenId === 'string' &&
    value.vfxTargetTokenId.trim()
  ) {
    event.vfxTargetTokenId = value.vfxTargetTokenId.trim()
  }
  if (value.vfxAction === 'show' || value.vfxAction === 'clear') {
    event.vfxAction = value.vfxAction
  }
  if (value.type === 'vfx') {
    if (
      typeof value.vfxExpiresAt !== 'number' ||
      !Number.isFinite(value.vfxExpiresAt) ||
      value.vfxExpiresAt <= Date.now()
    ) {
      return null
    }
    event.vfxExpiresAt = value.vfxExpiresAt
  }

  if (
    value.audioTransportState === 'playing' ||
    value.audioTransportState === 'paused' ||
    value.audioTransportState === 'stopped'
  ) {
    event.audioTransportState = value.audioTransportState
  }

  if (typeof value.musicVolume === 'number' && Number.isFinite(value.musicVolume)) {
    event.musicVolume = value.musicVolume
  }

  if (typeof value.ambienceVolume === 'number' && Number.isFinite(value.ambienceVolume)) {
    event.ambienceVolume = value.ambienceVolume
  }

  if (
    value.mixerAction === 'play' ||
    value.mixerAction === 'pause' ||
    value.mixerAction === 'stop' ||
    value.mixerAction === 'seek' ||
    value.mixerAction === 'volume'
  ) {
    event.mixerAction = value.mixerAction
  }

  if (typeof value.mixerTime === 'number' && Number.isFinite(value.mixerTime)) {
    event.mixerTime = Math.max(0, value.mixerTime)
  }

  if (typeof value.mixerVolume === 'number' && Number.isFinite(value.mixerVolume)) {
    event.mixerVolume = value.mixerVolume
  }

  if (value.type === 'transition-playback') {
    event.playbackState = normalizeSharedTransitionPlaybackState(value.playbackState)
  }

  return event
}

function normalizeBroadcastEvents(value: unknown): TabletopBroadcastEvent[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map(normalizeBroadcastEvent)
    .filter((event): event is TabletopBroadcastEvent => event !== null)
    .slice(-40)
}

function normalizeAudioMixerTrackState(value: unknown): TabletopAudioMixerTrackState | null {
  if (!isRecord(value)) {
    return null
  }

  const status =
    value.status === 'playing' || value.status === 'paused' || value.status === 'stopped'
      ? value.status
      : 'stopped'

  return {
    currentTime:
      typeof value.currentTime === 'number' && Number.isFinite(value.currentTime)
        ? Math.max(0, value.currentTime)
        : 0,
    duration:
      typeof value.duration === 'number' && Number.isFinite(value.duration)
        ? Math.max(0, value.duration)
        : 0,
    status,
    updatedAt:
      typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)
        ? value.updatedAt
        : Date.now(),
    volume:
      typeof value.volume === 'number' && Number.isFinite(value.volume)
        ? Math.min(1, Math.max(0, value.volume))
        : 0.35,
  }
}

function normalizeAudioMixerState(value: unknown): TabletopAudioMixerState {
  if (!isRecord(value) || !isRecord(value.tracks)) {
    return {
      tracks: {},
      updatedAt: Date.now(),
    }
  }

  const tracks = Object.fromEntries(
    Object.entries(value.tracks)
      .map(([trackId, trackState]) => [
        trackId,
        normalizeAudioMixerTrackState(trackState),
      ] as const)
      .filter(
        (entry): entry is [string, TabletopAudioMixerTrackState] =>
          typeof entry[0] === 'string' && entry[0] !== '' && entry[1] !== null,
      ),
  )

  return {
    tracks,
    updatedAt:
      typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)
        ? value.updatedAt
        : Date.now(),
  }
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

function normalizeTurnActionId(value: string): value is TabletopTurnActionId {
  return (
    value === 'fala' ||
    value === 'padrao' ||
    value === 'bonus' ||
    value === 'movimento' ||
    value === 'reacao'
  )
}

function normalizeTurnParticipant(value: unknown): TabletopTurnParticipant | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.tokenId !== 'string' ||
    typeof value.characterId !== 'string'
  ) {
    return null
  }

  const label =
    typeof value.label === 'string' && value.label.trim()
      ? value.label.trim()
      : value.tokenId
  const name =
    typeof value.name === 'string' && value.name.trim()
      ? value.name.trim()
      : label

  return {
    characterId: value.characterId,
    color:
      typeof value.color === 'string' && value.color.trim()
        ? value.color.trim()
        : '#92c0b6',
    id: value.id,
    imageUrl:
      typeof value.imageUrl === 'string' && value.imageUrl.trim()
        ? value.imageUrl.trim()
        : undefined,
    label,
    name,
    tokenId: value.tokenId,
    tokenKind:
      value.tokenKind === 'player_corpo' ||
      value.tokenKind === 'npc' ||
      value.tokenKind === 'mob' ||
      value.tokenKind === 'grupo'
        ? value.tokenKind
        : undefined,
  }
}

function normalizeTurnState(value: unknown): TabletopTurnState | null {
  if (!isRecord(value) || value.isActive !== true || !Array.isArray(value.participants)) {
    return null
  }

  const participants = value.participants
    .map((participant) => normalizeTurnParticipant(participant))
    .filter((participant): participant is TabletopTurnParticipant => participant !== null)

  if (participants.length === 0) {
    return null
  }

  const participantIds = new Set(participants.map((participant) => participant.id))
  const activeParticipantId =
    typeof value.activeParticipantId === 'string' &&
    participantIds.has(value.activeParticipantId)
      ? value.activeParticipantId
      : participants[0].id
  const usedActionsInput = isRecord(value.usedActions) ? value.usedActions : {}
  const usedActions: TabletopTurnState['usedActions'] = {}

  Object.entries(usedActionsInput).forEach(([participantId, actions]) => {
    if (!participantIds.has(participantId) || !isRecord(actions)) {
      return
    }

    const nextActions: Partial<Record<TabletopTurnActionId, boolean>> = {}

    Object.entries(actions).forEach(([actionId, actionValue]) => {
      if (normalizeTurnActionId(actionId) && actionValue === true) {
        nextActions[actionId] = true
      }
    })

    if (Object.keys(nextActions).length > 0) {
      usedActions[participantId] = nextActions
    }
  })

  return {
    activeParticipantId,
    encounterId:
      typeof value.encounterId === 'string' && value.encounterId.trim()
        ? value.encounterId.trim()
        : `turn-${Date.now()}`,
    isActive: true,
    participants,
    round:
      typeof value.round === 'number' && Number.isFinite(value.round) && value.round > 0
        ? Math.floor(value.round)
        : 1,
    updatedAt:
      typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)
        ? value.updatedAt
        : Date.now(),
    usedActions,
  }
}

function normalizeCharacterEditLocks(value: unknown) {
  if (!isRecord(value)) {
    return {}
  }

  const now = Date.now()
  const locks: Record<string, TabletopCharacterEditLock> = {}

  Object.entries(value).forEach(([characterId, candidate]) => {
    if (
      !isRecord(candidate) ||
      typeof candidate.characterId !== 'string' ||
      candidate.characterId !== characterId ||
      typeof candidate.ownerId !== 'string' ||
      typeof candidate.ownerLabel !== 'string' ||
      typeof candidate.acquiredAt !== 'number' ||
      typeof candidate.expiresAt !== 'number' ||
      candidate.expiresAt <= now ||
      (candidate.mode !== 'full' && candidate.mode !== 'quick')
    ) {
      return
    }

    locks[characterId] = {
      acquiredAt: candidate.acquiredAt,
      characterId,
      expiresAt: candidate.expiresAt,
      mode: candidate.mode,
      ownerId: candidate.ownerId,
      ownerLabel: candidate.ownerLabel,
    }
  })

  return locks
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
  activeMeasurement?: TabletopMeasurement | null
  publicCombatPreview?: TabletopCombatPreview | null
  publicCombatImpacts?: TabletopCombatImpact[]
  publicCombatMarks?: TabletopCombatMark[]
  publicCombatReceipt?: TabletopCombatReceipt | null
  playerDeathStates?: Record<string, TabletopPlayerDeathState>
  logEntries?: TabletopLogEntry[]
  broadcastEvents?: TabletopBroadcastEvent[]
  turnState?: TabletopTurnState | null
  trainingState?: TabletopTrainingState | null
  eventState?: TabletopEventSystemState | null
  audioMixerState?: TabletopAudioMixerState
  characterEditLocks?: Record<string, TabletopCharacterEditLock>
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

  const trainingState = normalizeTabletopTrainingState(input?.trainingState)
  const eventState = normalizeTabletopEventSystemState(input?.eventState, {
    legacyTrainingActive: trainingState?.isActive === true,
  })

  return {
    version: 17,
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
    activeMeasurement: normalizeMeasurement(input?.activeMeasurement),
    publicCombatPreview: normalizeCombatPreview(input?.publicCombatPreview),
    publicCombatImpacts: normalizeCombatImpacts(input?.publicCombatImpacts),
    publicCombatMarks: normalizeCombatMarks(input?.publicCombatMarks),
    publicCombatReceipt: normalizeCombatReceipt(input?.publicCombatReceipt),
    playerDeathStates: normalizePlayerDeathStates(input?.playerDeathStates),
    logEntries: Array.isArray(input?.logEntries) ? input.logEntries : [],
    broadcastEvents: normalizeBroadcastEvents(input?.broadcastEvents),
    turnState: normalizeTurnState(input?.turnState),
    trainingState,
    eventState,
    audioMixerState: normalizeAudioMixerState(input?.audioMixerState),
    characterEditLocks: normalizeCharacterEditLocks(input?.characterEditLocks),
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
    parsedValue.version !== 17 &&
    parsedValue.version !== 16 &&
    parsedValue.version !== 15 &&
    parsedValue.version !== 14 &&
    parsedValue.version !== 12 &&
    parsedValue.version !== 13 &&
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
  const broadcastEvents = normalizeBroadcastEvents(parsedValue.broadcastEvents)

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
    activeMeasurement: normalizeMeasurement(parsedValue.activeMeasurement),
    publicCombatPreview: normalizeCombatPreview(parsedValue.publicCombatPreview),
    publicCombatImpacts: normalizeCombatImpacts(parsedValue.publicCombatImpacts),
    publicCombatMarks: normalizeCombatMarks(parsedValue.publicCombatMarks),
    publicCombatReceipt: normalizeCombatReceipt(parsedValue.publicCombatReceipt),
    playerDeathStates: normalizePlayerDeathStates(parsedValue.playerDeathStates),
    logEntries,
    broadcastEvents,
    turnState: normalizeTurnState(parsedValue.turnState),
    trainingState: normalizeTabletopTrainingState(parsedValue.trainingState),
    eventState: normalizeTabletopEventSystemState(parsedValue.eventState, {
      legacyTrainingActive:
        normalizeTabletopTrainingState(parsedValue.trainingState)?.isActive === true,
    }),
    audioMixerState: normalizeAudioMixerState(parsedValue.audioMixerState),
    characterEditLocks: normalizeCharacterEditLocks(parsedValue.characterEditLocks),
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
      updatedAt: Date.now(),
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
