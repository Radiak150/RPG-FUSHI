import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Box,
  Film,
  History,
  Layers3,
  Plus,
} from 'lucide-react'
import { TabletopCinematicOverlay } from '../components/tabletop/TabletopCinematicOverlay'
import type {
  MapConfigurationFolderOption,
  MapConfigurationSaveData,
} from '../components/tabletop/MapConfigurationModal'
import type {
  ObjectPresetImportSaveData,
} from '../components/tabletop/ObjectPresetImportModal'
import { TabletopAccessPanel } from '../components/tabletop/TabletopAccessPanel'
import type {
  TabletopMixerTrackState,
  TabletopMusicCreateInput,
  TabletopMusicLibraryItem,
  TabletopMusicUpdateInput,
} from '../components/tabletop/TabletopMusicLibrary'
import { TabletopNotesPanel } from '../components/tabletop/TabletopNotesPanel'
import { TabletopReadinessGate } from '../components/tabletop/TabletopReadinessGate'
import { SceneIntroCard } from '../components/tabletop/SceneIntroCard'
import { TabletopAudioPanel } from '../components/tabletop/TabletopAudioPanel'
import { TabletopBoard } from '../components/tabletop/TabletopBoard'
import { TabletopBuildManager } from '../components/tabletop/TabletopBuildManager'
import { TabletopCombatRangeOverlay } from '../components/tabletop/TabletopCombatRangeOverlay'
import { TabletopCombatRoller } from '../components/tabletop/TabletopCombatRoller'
import { TabletopEventManager } from '../components/tabletop/TabletopEventManager'
import { TabletopEventPresentation } from '../components/tabletop/TabletopEventPresentation'
import { TabletopTrainingArc } from '../components/tabletop/TabletopTrainingArc'
import { TabletopHelpPanel } from '../components/tabletop/TabletopHelpPanel'
import { TabletopHud } from '../components/tabletop/TabletopHud'
import { TabletopHudPanel } from '../components/tabletop/TabletopHudPanel'
import {
  TabletopDayNightAtmosphere,
  type TabletopDayNightTransitionState,
} from '../components/tabletop/TabletopDayNightAtmosphere'
import { TabletopLightingControls } from '../components/tabletop/TabletopLightingControls'
import {
  TABLETOP_CURSOR_LIGHT_MOVE_EVENT,
  TabletopLightingLayer,
} from '../components/tabletop/TabletopLightingLayer'
import { RulebookQuickReference } from '../components/product/RulebookContent'
import {
  TabletopSessionLog,
  type TabletopRollDraft,
} from '../components/tabletop/TabletopSessionLog'
import {
  TabletopStatusManager,
  type TabletopStatusParticipant,
} from '../components/tabletop/TabletopStatusManager'
import { TabletopTransitionOverlay } from '../components/tabletop/TabletopTransitionOverlay'
import {
  TabletopTurnOverlay,
  TabletopTurnSetupPanel,
  type TabletopTurnCandidate,
  type TabletopTurnFeatureAction,
  type TabletopTurnParticipantView,
} from '../components/tabletop/TabletopTurnTracker'
import { TabletopWeatherOverlay } from '../components/tabletop/TabletopWeatherOverlay'
import { TabletopVfxLibrary } from '../components/tabletop/TabletopVfxLibrary'
import { TabletopVfxPresentation } from '../components/tabletop/TabletopVfxPresentation'
import { TabletopVisualLibrary } from '../components/tabletop/TabletopVisualLibrary'
import { HistoryQuickReference } from '../components/product/HistoryQuickReference'
import type {
  WorldMundiMapPlaceholderRequest,
} from '../components/tabletop/TabletopWorldMundiPanel'
import { TokenInspector } from '../components/tabletop/TokenInspector'
import { FloatingWindow } from '../components/ui/FloatingWindow'
import type {
  CharacterSheetEffectView,
  CharacterSheetFocusRequest,
} from '../components/characters/CharacterProfileCard'
import type {
  AttributeKey,
  CharacterActionCost,
  CharacterActionResolutionRule,
  CharacterActionStatusEffect,
  CharacterFeatureActivationRequest,
  CharacterSheet,
  TabletopBoardObject,
  TabletopCamera3DState,
  TabletopOriginalConsciousnessState,
  TabletopAssetLibrary,
  TabletopMediaAsset,
  TabletopMap,
  TabletopScene,
  TabletopSceneLight,
  TabletopSceneLighting,
  TabletopToken,
  TabletopTokenSize,
  TabletopTokenSizePreset,
  TabletopTransitionAsset,
} from '../data/types'
import { getCharacterGrant } from '../data/grants/characterGrantCatalog'
import { getInitialTrainingReward } from '../data/training/initialTrainingRewards'
import { getBuildItems } from '../data/combatCatalog'
import {
  getTabletopVfxPreset,
  type TabletopVfxPreset,
  type TabletopVfxPresentationState,
} from '../data/vfxCatalog'
import {
  findTabletopStatusDefinition,
  getTabletopStatusDefinition,
  type TabletopStatusId,
} from '../data/statusCatalog'
import { useMasterData } from '../hooks/useMasterData'
import { useMultiplayer } from '../hooks/useMultiplayer'
import { useProductPreferences } from '../hooks/useProductPreferences'
import { useTabletopReadiness, type TabletopReadinessAsset } from '../hooks/useTabletopReadiness'
import { useViewMode } from '../hooks/useViewMode'
import { normalizeCharacterSheet } from '../lib/characterSheet'
import {
  createCharacterStage,
  deleteCharacterStage,
  renameCharacterStage,
  switchCharacterStage,
} from '../lib/characterStages'
import {
  formatInventoryMovement,
  getInventoryCapacitySummary,
} from '../lib/inventoryCapacity'
import {
  applyCharacterActionCosts,
  applyCharacterActionEffects,
  canPayCharacterActionCosts,
  getCharacterActionActivationLabel,
  getCharacterActionEffectsLabel,
  getCharacterActionCostsLabel,
  getCharacterActionRollConfig,
} from '../lib/characterActions'
import {
  applyCombatBlock,
  getCombatBlockValue,
  getCombatCaPenetration,
  getCombatCriticalDamageBonus,
  getCombatDodgeSummary,
  getCombatDodgeValue,
  getCharacterSkillRollBonus,
  getCriticalDamageFormula,
  isCriticalAttackRoll,
  resolveCombatAction,
} from '../lib/combatV2'
import {
  applyCombatDicePoolModifier,
  calculateCombatAction,
  getCharacterCombatActions,
  getCombatRollDicePenalty,
  getTabletopDistanceSquares,
  resolveCombatCheckOption,
  resolveCombatDamageSequence,
  validateCombatRange,
} from '../lib/combatRolls'
import type { FushiAccessProfile, FushiAccessProfileId } from '../lib/playerAccess'
import { resolveRuntimeAssetUrl, resolveRuntimeAssetVariantUrl } from '../lib/runtimeAssets'
import {
  buildPublicMundiState,
  type PublicMundiState,
} from '../lib/session/publicState'
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
  type PersistedTabletopObjectPreset,
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
  createDefaultTabletopSceneLighting,
  createTabletopSceneLight,
  isTabletopNight,
  normalizeTabletopSceneLighting,
  TABLETOP_SCENE_LIGHT_LIMIT,
} from '../lib/tabletopLighting'
import {
  clearTabletopRarityDraw,
  clearTabletopRarityHistory,
  createTabletopEventSystemState,
  isTabletopEventActive,
  setTabletopEventActive,
  startTabletopRarityDraw,
  type TabletopEventId,
} from '../lib/tabletopEvents'
import {
  applyTrainingFinalOutcome,
  applyTrainingParticipantOutcome,
  createTabletopTrainingState,
  setTrainingArcActive,
  setTrainingParticipantStation,
  unlockTrainingFinalTrial,
  VILLAGE_TRAINING_ARC,
  type TabletopTrainingFinalOutcome,
  type TabletopTrainingOutcome,
  type TabletopTrainingParticipantInput,
  type TabletopTrainingState,
} from '../lib/tabletopTraining'
import {
  getSceneCameraTarget,
  getSceneCameraZoom,
  resolveTabletopSceneRuntime,
} from '../lib/tabletopRuntime'
import { resolveTokenImage } from '../lib/tabletopTokenImages'
import { playTabletopSfx, preloadTabletopSfx } from '../lib/tabletopSfx'
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
  type PersistedTabletopSession,
  type TabletopBroadcastEvent,
  type TabletopCharacterEditLock,
  type PersistedTransitionOverride,
  type TabletopCombatMark,
  type TabletopCombatLogPayload,
  type TabletopCombatReceipt,
  type TabletopCombatResourceChange,
  type TabletopCombatPreview,
  type SharedTransitionPlaybackState,
  type TabletopLogEntry,
  type TabletopMeasurement,
  type TabletopPing,
  type TabletopTurnActionId,
  type TabletopTurnActionRequest,
  type TabletopTurnParticipant,
  type TabletopTurnState,
  writePersistedTransitionOverrides,
  writeSharedTransitionPlaybackState,
  writePersistedTabletopSession,
} from '../lib/tabletopSession'
import {
  createWorldMundiBody,
  createWorldMundiBaseUpgrade,
  createWorldMundiConsciousness,
  createWorldMundiLogEntry,
  createWorldMundiNpcState,
  createWorldMundiParty,
  createWorldMundiPlayer,
  createWorldMundiState,
  getPersistedWorldMundiStorageKey,
  readPersistedWorldMundiState,
  TABLETOP_WORLD_MUNDI_STORAGE_KEY,
  type WorldMundiClock,
  type WorldMundiBody,
  writePersistedWorldMundiState,
} from '../lib/worldMundiState'
import {
  appendWorldSimulationEvent,
  createWorldSimulationEventFromLogEntry,
  createWorldSimulationMapChangeEvent,
  createWorldSimulationTokenMoveEvent,
} from '../lib/worldSimulation'
import { TabletopFxStage } from '../rendering/pixi/TabletopFxStage'
import { TabletopDiceRollOverlay } from '../rendering/three/TabletopDiceRollOverlay'
import type {
  Tabletop3DBoardImpact,
  Tabletop3DEditorTool,
} from '../rendering/three/Tabletop3DStage'

const CAMERA_PERSIST_DEBOUNCE_MS = 80
const REMOTE_2D_CAMERA_SMOOTHING_SPEED = 18
const REMOTE_2D_CAMERA_SNAP_PX = 0.5
const HOST_SESSION_POLL_MS = 300
const DEFAULT_MIXER_TRACK_VOLUME = 0.35
const DICE_ROLL_ACTOR_COOLDOWN_MS = 16000
const DICE_ROLL_MAX_PENDING_QUEUE = 6
const DICE_ROLL_MAX_TOTAL_QUEUE = DICE_ROLL_MAX_PENDING_QUEUE + 1
import { DiceIcon } from '../components/ui/DiceIcon'
import {
  createCombatRollConfig,
  createRollRecord,
  formatRollFormula,
  getRollOutcome,
} from '../lib/rolls'

const loadCinematicsLibrary = () =>
  import('../components/tabletop/TabletopCinematicsLibrary')
const loadMapConfigurationModal = () =>
  import('../components/tabletop/MapConfigurationModal')
const loadMapLibrary = () => import('../components/tabletop/TabletopMapLibrary')
const loadMusicLibrary = () => import('../components/tabletop/TabletopMusicLibrary')
const loadNpcLibrary = () => import('../components/tabletop/TabletopNpcLibrary')
const loadObjectPresetImportModal = () =>
  import('../components/tabletop/ObjectPresetImportModal')
const loadTransitionConfigurationModal = () =>
  import('../components/tabletop/TransitionConfigurationModal')
const loadWorldMundiViews = () =>
  import('../components/tabletop/TabletopWorldMundiPanel')

const MapConfigurationModal = lazy(() =>
  loadMapConfigurationModal().then((module) => ({
    default: module.MapConfigurationModal,
  })),
)
const ObjectPresetImportModal = lazy(() =>
  loadObjectPresetImportModal().then((module) => ({
    default: module.ObjectPresetImportModal,
  })),
)
const TabletopBaseMundiView = lazy(() =>
  loadWorldMundiViews().then((module) => ({
    default: module.TabletopBaseMundiView,
  })),
)
const TabletopCinematicsLibrary = lazy(() =>
  loadCinematicsLibrary().then((module) => ({
    default: module.TabletopCinematicsLibrary,
  })),
)
const TabletopGeneralMundiView = lazy(() =>
  loadWorldMundiViews().then((module) => ({
    default: module.TabletopGeneralMundiView,
  })),
)
const TabletopMapLibrary = lazy(() =>
  loadMapLibrary().then((module) => ({
    default: module.TabletopMapLibrary,
  })),
)
const TabletopMusicLibrary = lazy(() =>
  loadMusicLibrary().then((module) => ({
    default: module.TabletopMusicLibrary,
  })),
)
const TabletopNpcLibrary = lazy(() =>
  loadNpcLibrary().then((module) => ({
    default: module.TabletopNpcLibrary,
  })),
)
const TabletopWorldMundiPanel = lazy(() =>
  loadWorldMundiViews().then((module) => ({
    default: module.TabletopWorldMundiPanel,
  })),
)
const TransitionConfigurationModal = lazy(() =>
  loadTransitionConfigurationModal().then((module) => ({
    default: module.TransitionConfigurationModal,
  })),
)

const deferredTabletopModules = [
  loadCinematicsLibrary,
  loadMapConfigurationModal,
  loadMapLibrary,
  loadMusicLibrary,
  loadNpcLibrary,
  loadObjectPresetImportModal,
  loadTransitionConfigurationModal,
  loadWorldMundiViews,
]

function DeferredTabletopTool({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}

type HudPanelId =
  | 'npcs'
  | 'builds'
  | 'statuses'
  | 'events'
  | 'maps'
  | 'music'
  | 'objects'
  | 'world'
  | 'cinematics'
  | 'vfx'
  | 'book'
  | 'diagnostics'
  | 'settings'
  | 'turns'
  | 'combat'

type UtilityWindowId =
  | 'audio'
  | 'log'
  | 'notes'
  | 'book'
  | 'access'
  | 'help'
  | 'world'
  | null

type DiceRollGuardNoticeTone = 'danger' | 'warning'

type TabletopObjectPreset = PersistedTabletopObjectPreset

interface TabletopObjectPreviewInput {
  id?: string
  label?: string
  libraryKind?: 'animation' | 'object'
  linkedItemId?: string
  modelUrl?: string
  name?: string
  objectType?: TabletopBoardObject['objectType']
  renderMode?: TabletopBoardObject['renderMode']
}

type CombatResolutionOutcome = 'hit' | 'block' | 'dodge' | 'miss'

interface PendingCombatResolution {
  attackerCharacterId: string
  attackerName: string
  attackerTokenId: string
  attackName: string
  baseDamageFormula: string
  buildDamageBonus: number
  checkDifficulty?: number
  checkTarget: 'ca' | 'dt' | 'resistido'
  costs: CharacterActionCost[]
  damageContexts: Array<'ability' | 'adjacent' | 'melee' | 'ranged'>
  damageFormula: string
  distanceMeters: number | null
  distanceSquares: number | null
  sourceCell?: TabletopToken['cell']
  targetCell?: TabletopToken['cell']
  id: string
  isCritical: boolean
  manualDamage?: number
  outcome?: CombatResolutionOutcome
  rawDamage: number
  rollText?: string
  rollTotal?: number
  opposedAttribute?: string
  opposedRollEntryId?: string
  opposedRollTotal?: number
  opposedSkill?: string
  damageRollEntryId?: string
  healingTargetTokenId?: string
  sourceFeatureId?: string
  sourceFeatureResolution?: CharacterActionResolutionRule
  stage: 'defense' | 'damage' | 'result'
  targetTokenId: string
  turnActionId?: TabletopTurnActionId
}

interface CombatFocusRequest {
  featureId: string
  id: number
  sourceTokenId: string
}

function sanitizeCombatDamage(value: number) {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))
}

function getTurnActionIdForFeature(
  feature: CharacterFeatureActivationRequest['feature'],
): TabletopTurnActionId | undefined {
  const timing = resolveCombatAction(feature).action

  return timing === 'principal'
    ? 'padrao'
    : timing === 'curta'
      ? 'bonus'
      : timing === 'movimento'
        ? 'movimento'
        : timing === 'reacao'
          ? 'reacao'
          : undefined
}

function parseDamageRollFormula(formula: string) {
  const match = /(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?/i.exec(formula)

  if (!match) {
    return null
  }

  const quantidadeDados = Math.max(1, Number(match[1] || '1'))
  const tipoDado = Math.max(2, Number(match[2]))
  const bonusValue = Number(match[4] ?? '0')
  const bonus = match[3] === '-' ? -bonusValue : bonusValue

  if (!Number.isFinite(quantidadeDados) || !Number.isFinite(tipoDado)) {
    return null
  }

  return {
    bonus,
    modo: 'sum' as const,
    quantidadeDados,
    tipoDado,
  }
}

function applyDamageDicePenaltyToFormula(formula: string, penalty: number) {
  if (penalty <= 0) {
    return formula
  }

  const match = /(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?/i.exec(formula)

  if (!match) {
    return formula
  }

  const dice = Math.max(0, Number(match[1] || '1') - penalty)
  const sides = Math.max(2, Number(match[2]))
  const modifier = match[3] && match[4]
    ? ` ${match[3]} ${match[4]}`
    : ''

  return dice > 0 ? `${dice}d${sides}${modifier}` : '0'
}

function createStatusFormulaRoll(
  formula: string,
  context: string,
  visualColor: string,
) {
  const config = parseDamageRollFormula(formula)

  if (!config) {
    const fixedValue = Number(formula.trim())

    return {
      roll: null,
      total: Number.isFinite(fixedValue)
        ? Math.max(0, Math.floor(fixedValue))
        : 0,
    }
  }

  const roll = createRollRecord(config, context, { visualColor })

  return {
    roll,
    total: Math.max(0, roll.total),
  }
}

const TABLETOP_OBJECT_PRESETS: TabletopObjectPreset[] = [
  {
    id: 'inbox-stone-big-1k',
    name: 'Pedra 3D Grande 1k',
    label: 'PDG',
    description:
      'Teste GLB 1k do stone pack; prop fisico para cobertura, relevo e bloqueio visual.',
    objectType: 'prop',
    renderMode: 'three',
    assetUrl: '',
    modelUrl: '/assets/objects/3d/inbox-1k/stone_pack.glb',
    modelNodeName: 'Big_5',
    color: '#a9a28e',
    size: 2,
    placementScale: 0.75,
  },
  {
    id: 'inbox-stone-runic-1k',
    name: 'Pedra Runica 1k',
    label: 'PDR',
    description:
      'Teste GLB 1k do stone pack; rocha runica para selo, trilha antiga ou dominio.',
    objectType: 'objective',
    renderMode: 'three',
    assetUrl: '',
    modelUrl: '/assets/objects/3d/inbox-1k/stone_pack.glb',
    modelNodeName: 'Runic_1',
    color: '#c8bc91',
    size: 1,
    placementScale: 0.65,
  },
  {
    id: 'inbox-sword-stone-1k',
    name: 'Espada na Pedra 1k',
    label: 'ESP',
    description:
      'Teste GLB 1k completo; objetivo ritualistico, item lendario ou marco de cena.',
    objectType: 'objective',
    renderMode: 'three',
    assetUrl: '',
    modelUrl: '/assets/objects/3d/inbox-1k/the_sword_in_the_stone.glb',
    modelNodeName: 'RootNode',
    color: '#e9c97e',
    size: 2,
    placementScale: 0.55,
  },
  {
    id: 'inbox-ship-pinnace-1k',
    name: 'Navio Pinnace 1k',
    label: 'NAV',
    description:
      'Teste GLB 1k de navio; prop grande para costa, porto, dominio ou cena naval.',
    objectType: 'prop',
    renderMode: 'three',
    assetUrl: '',
    modelUrl: '/assets/objects/3d/inbox-1k/ship_pinnace.glb',
    modelNodeName: 'GLTF_SceneRootNode',
    color: '#b78b56',
    size: 3,
    placementScale: 0.55,
  },
  {
    id: 'inbox-dark-forest-ent-1k',
    name: 'Ent Corrompido 1k',
    label: 'ENT',
    description:
      'Teste GLB 1k pesado; criatura/cenario vivo para floresta corrompida e dominio.',
    objectType: 'prop',
    renderMode: 'three',
    assetUrl: '',
    modelUrl: '/assets/objects/3d/inbox-1k/corrupted_dark_forest_ent.glb',
    modelNodeName: 'tripo_node_bc03e0ff',
    color: '#6f9d63',
    size: 3,
    placementScale: 0.55,
  },
  {
    id: 'inbox-procedural-city-1k',
    name: 'Cidade Procedural 1k',
    label: 'CID',
    description:
      'Teste GLB 1k pesado; bloco de cenario para dominio, ruina urbana ou fundo 3D.',
    objectType: 'prop',
    renderMode: 'three',
    assetUrl: '',
    modelUrl: '/assets/objects/3d/inbox-1k/procedural_city_3.glb',
    modelNodeName: 'GLTF_SceneRootNode',
    color: '#9aa0a3',
    size: 3,
    placementScale: 0.16,
  },
  {
    id: 'vfx-fire-column',
    libraryKind: 'animation',
    name: 'Coluna de Fogo',
    label: 'FIR',
    description:
      'Animacao 3D colocavel: fogo, brasas e calor subindo do tabuleiro.',
    objectType: 'hazard',
    renderMode: 'three',
    assetUrl: '',
    color: '#ff6d2f',
    size: 2,
    placementScale: 1.15,
  },
  {
    id: 'vfx-fog-bank',
    libraryKind: 'animation',
    name: 'Banco de Nevoa',
    label: 'NEV',
    description:
      'Animacao 3D colocavel: nevoa densa, lenta e removivel da cena.',
    objectType: 'prop',
    renderMode: 'three',
    assetUrl: '',
    color: '#b8d7d5',
    size: 3,
    placementScale: 1.35,
  },
  {
    id: 'vfx-wind-gust',
    libraryKind: 'animation',
    name: 'Rajada de Vento',
    label: 'VEN',
    description:
      'Animacao 3D colocavel: faixa de vento cruzando o mapa com particulas.',
    objectType: 'prop',
    renderMode: 'three',
    assetUrl: '',
    color: '#d8f6ff',
    size: 3,
    placementScale: 1.3,
  },
  {
    id: 'vfx-water-splash',
    libraryKind: 'animation',
    name: 'Jorro de Agua',
    label: 'AGU',
    description:
      'Animacao 3D colocavel: splash, espuma e corrente sem apagar o mapa.',
    objectType: 'prop',
    renderMode: 'three',
    assetUrl: '',
    color: '#70eaff',
    size: 3,
    placementScale: 1.45,
  },
  {
    id: 'vfx-lightning-storm',
    libraryKind: 'animation',
    name: 'Tempestade de Raios',
    label: 'RAI',
    description:
      'Animacao 3D colocavel: descargas, flash e energia sobre o tabuleiro.',
    objectType: 'hazard',
    renderMode: 'three',
    assetUrl: '',
    color: '#ff2748',
    size: 2,
    placementScale: 1.25,
  },
  {
    id: 'vfx-leaf-vortex',
    libraryKind: 'animation',
    name: 'Vortice de Folhas',
    label: 'FOL',
    description:
      'Animacao 3D colocavel: folhas e magia girando para florestas e dominios.',
    objectType: 'prop',
    renderMode: 'three',
    assetUrl: '',
    color: '#9aff6a',
    size: 2,
    placementScale: 1.2,
  },
  {
    id: 'vfx-lava-burst',
    libraryKind: 'animation',
    name: 'Erupcao de Lava',
    label: 'LAV',
    description:
      'Animacao 3D colocavel: fissura quente, fumaca escura e fagulhas.',
    objectType: 'hazard',
    renderMode: 'three',
    assetUrl: '',
    color: '#ff3b18',
    size: 3,
    placementScale: 1.35,
  },
  {
    id: 'vfx-rain-cloud',
    libraryKind: 'animation',
    name: 'Nuvem de Chuva',
    label: 'CHU',
    description:
      'Animacao 3D colocavel: nuvem baixa, gotas e respingo em area.',
    objectType: 'prop',
    renderMode: 'three',
    assetUrl: '',
    color: '#9fdcff',
    size: 3,
    placementScale: 1.3,
  },
]

const OPTIONAL_BUNDLED_OBJECT_PRESET_IDS = new Set([
  'inbox-ship-pinnace-1k',
  'inbox-dark-forest-ent-1k',
  'inbox-procedural-city-1k',
])

function isOptionalBundledObjectPreset(preset: TabletopObjectPreset) {
  return OPTIONAL_BUNDLED_OBJECT_PRESET_IDS.has(preset.id)
}

function isBundledObjectPresetAvailable(preset: TabletopObjectPreset) {
  if (!isOptionalBundledObjectPreset(preset) || !preset.modelUrl) {
    return true
  }

  if (typeof window === 'undefined' || !window.fushiDesktop?.assetExists) {
    return true
  }

  try {
    return window.fushiDesktop.assetExists(preset.modelUrl)
  } catch {
    return true
  }
}

function resolveObjectPreviewKind(input: TabletopObjectPreviewInput) {
  const lookup = [
    input.id,
    input.label,
    input.linkedItemId,
    input.modelUrl,
    input.name,
    input.objectType,
    input.renderMode,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (input.libraryKind === 'animation' || lookup.includes('vfx-')) {
    if (lookup.includes('fire') || lookup.includes('fogo')) return 'fire'
    if (lookup.includes('fog') || lookup.includes('nevoa')) return 'fog'
    if (lookup.includes('wind') || lookup.includes('vento')) return 'wind'
    if (lookup.includes('water') || lookup.includes('agua')) return 'water'
    if (lookup.includes('lightning') || lookup.includes('raio')) return 'lightning'
    if (lookup.includes('leaf') || lookup.includes('folha')) return 'leaf'
    if (lookup.includes('lava')) return 'lava'
    if (lookup.includes('rain') || lookup.includes('chuva')) return 'rain'
    return 'magic'
  }

  if (lookup.includes('ship') || lookup.includes('navio')) return 'ship'
  if (lookup.includes('ent') || lookup.includes('forest') || lookup.includes('arvore')) {
    return 'creature'
  }
  if (lookup.includes('city') || lookup.includes('cidade')) return 'city'
  if (lookup.includes('sword') || lookup.includes('espada')) return 'relic'
  if (lookup.includes('stone') || lookup.includes('pedra') || lookup.includes('runic')) {
    return 'rock'
  }
  if (input.objectType === 'hazard') return 'hazard'
  if (input.objectType === 'objective') return 'relic'
  if (input.objectType === 'item') return 'item'
  return 'prop'
}

const TABLETOP_NOTES_STORAGE_KEY = 'fushi-tabletop:personal-notes:v1'
const TABLETOP_OBJECT_SCALE_MIN = 0.01
const TABLETOP_OBJECT_SCALE_MAX = 80
const TABLETOP_OBJECT_HEIGHT_MIN = -18
const TABLETOP_OBJECT_HEIGHT_MAX = 80
const TABLETOP_OBJECT_COLOR_SWATCHES = [
  '#e9c97e',
  '#77e7ff',
  '#7fffd0',
  '#ff6d2f',
  '#8e6cff',
  '#f2f0e8',
  '#9aa0a3',
  '#2f9f6b',
]
const HUD_ICON_ASSETS = {
  log: '/assets/ui/icons/hud-log-d20.svg',
  notes: '/assets/ui/icons/hud-not-scroll.svg',
  book: '/assets/ui/icons/hud-book.svg',
  world: '/assets/ui/icons/hud-mun-compass.svg',
  access: '/assets/ui/icons/hud-key.svg',
  help: '/assets/ui/icons/hud-help.svg',
  settings: '/assets/ui/icons/hud-settings.svg',
  sheet: '/assets/ui/icons/hud-fic-sheet.svg',
  visibility: '/assets/ui/icons/hud-visibility.svg',
  ruler: '/assets/ui/icons/hud-ruler.svg',
  playerMeasure: '/assets/ui/icons/hud-player-measure.svg',
  turns: '/assets/ui/icons/hud-trn-turns.svg',
  diagnostics: '/assets/ui/icons/hud-net-diagnostics.svg',
  menu: '/assets/ui/icons/hud-menu.svg',
} as const
const TABLETOP_IDENTITY_RESOURCES_STORAGE_KEY =
  'fushi-tabletop:identity-resources:v1'

type IdentityResourceProfileId = Exclude<FushiAccessProfileId, 'gm'>

const PLAYER_TOKEN_ACCENTS: Record<IdentityResourceProfileId, string> = {
  player1: '#8e6cff',
  player2: '#f2cc48',
  player3: '#72b083',
  player4: '#f4f1e8',
  player5: '#15181f',
}
const PLAYER_TOKEN_STEALTH_ACCENTS: Record<IdentityResourceProfileId, string> = {
  player1: '#4a318f',
  player2: '#8a6a10',
  player3: '#2f6544',
  player4: '#9fa5ac',
  player5: '#050608',
}
const NPC_TOKEN_ACCENT = '#8f9ca5'

interface IdentityResourcePool {
  atributos?: CharacterSheet['atributos']
  determinacaoAtual: number
  determinacaoMaxima: number
  fushiAtual: number
  fushiMaximo: number
  jogador?: string
  pericias?: CharacterSheet['pericias']
  vidaAtual?: number
  vidaMaxima?: number
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

function getPlayerTokenAccent(playerId: string) {
  return isIdentityResourceProfileId(playerId)
    ? PLAYER_TOKEN_ACCENTS[playerId]
    : NPC_TOKEN_ACCENT
}

function getPlayerTokenStealthAccent(playerId: string) {
  return isIdentityResourceProfileId(playerId)
    ? PLAYER_TOKEN_STEALTH_ACCENTS[playerId]
    : '#4e5964'
}

function buildVillageTrainingParticipants(
  scene: TabletopScene | null | undefined,
  characters: CharacterSheet[],
): TabletopTrainingParticipantInput[] {
  if (!scene) {
    return []
  }

  const characterById = new Map(characters.map((character) => [character.id, character]))
  const participantByPlayerId = new Map<string, TabletopTrainingParticipantInput>()

  scene.tokens.forEach((token) => {
    const playerId = inferIdentityResourceProfileId(
      token.controladoPorJogadorId ?? token.persistentControl?.playerId ?? '',
    )

    if (!playerId || participantByPlayerId.has(playerId)) {
      return
    }

    const character = characterById.get(token.characterId)
    const playerNumber = playerId.replace('player', '')

    participantByPlayerId.set(playerId, {
      characterId: token.characterId,
      color: getPlayerTokenAccent(playerId),
      id: playerId,
      label: `J${playerNumber}`,
      name: character?.nome ?? token.label,
      playerId,
      tokenId: token.id,
    })
  })

  return Array.from(participantByPlayerId.values()).sort((left, right) =>
    left.playerId.localeCompare(right.playerId),
  )
}

function inferIdentityResourceProfileId(value?: string | null): IdentityResourceProfileId | '' {
  const normalizedValue = value?.trim().toLowerCase() ?? ''

  if (isIdentityResourceProfileId(normalizedValue)) {
    return normalizedValue
  }

  const compactValue = normalizedValue.replace(/[^a-z0-9]/g, '')
  const match =
    /^j([1-5])$/.exec(compactValue) ??
    /^jogador([1-5])$/.exec(compactValue) ??
    /^player([1-5])$/.exec(compactValue) ??
    /fragmentop?0?([1-5])/.exec(compactValue)

  return match ? (`player${match[1]}` as IdentityResourceProfileId) : ''
}

function getTokenPlayerIds(token: TabletopToken | null | undefined) {
  if (!token) {
    return []
  }

  return Array.from(
    new Set(
      [
        token.controladoPorJogadorId,
        token.persistentControl?.playerId,
        token.control?.primaryControllerId,
        ...(token.control?.controlledByPlayerIds ?? []),
      ]
        .map((playerId) => inferIdentityResourceProfileId(playerId))
        .filter(isIdentityResourceProfileId),
    ),
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
    vidaAtual:
      typeof record.vidaAtual === 'number'
        ? Math.max(0, Math.round(record.vidaAtual))
        : undefined,
    vidaMaxima:
      typeof record.vidaMaxima === 'number'
        ? Math.max(0, Math.round(record.vidaMaxima))
        : undefined,
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
    vidaAtual: character.recursos.vidaAtual,
    vidaMaxima: character.recursos.vidaMaxima,
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
      vidaAtual: pool.vidaAtual ?? character.recursos.vidaAtual,
      vidaMaxima: pool.vidaMaxima ?? character.recursos.vidaMaxima,
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

function getLogEntryTimestamp(entry: TabletopLogEntry) {
  const timestamp = Date.parse(entry.createdAt)

  return Number.isFinite(timestamp) ? timestamp : 0
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
    lighting: createDefaultTabletopSceneLighting(),
  }
}

function resolveMapById(maps: TabletopMap[], fallbackMap: TabletopMap, mapId: string) {
  return maps.find((map) => map.id === mapId) ?? fallbackMap
}

function getRemoteAssetBaseUrl(publicState: unknown) {
  if (!publicState || typeof publicState !== 'object' || Array.isArray(publicState)) {
    return ''
  }

  const metadata = (publicState as { metadata?: unknown }).metadata

  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return ''
  }

  const remoteAssetBaseUrl = (metadata as { remoteAssetBaseUrl?: unknown }).remoteAssetBaseUrl

  return typeof remoteAssetBaseUrl === 'string'
    ? remoteAssetBaseUrl.replace(/\/+$/, '')
    : ''
}

function getRemotePublicAssetPath(value: string) {
  const normalizedValue = value.trim().replace(/\\/g, '/')

  try {
    const url = new URL(normalizedValue)

    if (url.protocol === 'fushi-library:' && url.hostname === 'assets') {
      return url.pathname.replace(/^\/+/, '')
    }

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      if (url.pathname.startsWith('/assets/library/')) {
        return url.pathname.slice('/assets/library/'.length)
      }

      if (url.pathname.startsWith('/assets/campaign/')) {
        return ''
      }

      if (url.pathname.startsWith('/assets/')) {
        return url.pathname.slice('/assets/'.length)
      }
    }
  } catch {
    // Plain packaged/library paths are handled below.
  }

  if (normalizedValue.startsWith('/assets/')) {
    return normalizedValue.slice('/assets/'.length)
  }

  if (normalizedValue.startsWith('./assets/')) {
    return normalizedValue.slice('./assets/'.length)
  }

  if (normalizedValue.startsWith('assets/')) {
    return normalizedValue.slice('assets/'.length)
  }

  return ''
}

function getRemoteCampaignAssetUrl(value: string, remoteAssetBaseUrl: string) {
  if (!value.startsWith('fushi-asset://campaign/')) {
    return ''
  }

  try {
    const url = new URL(value)
    const [campaignId, category, ...filenameParts] = url.pathname
      .split('/')
      .filter(Boolean)
      .map(decodeURIComponent)

    if (!campaignId || !category || filenameParts.length === 0) {
      return ''
    }

    return `${remoteAssetBaseUrl}/assets/campaign/${encodeURIComponent(campaignId)}/${encodeURIComponent(category)}/${filenameParts.map(encodeURIComponent).join('/')}`
  } catch {
    return ''
  }
}

function resolveTabletopRuntimeAssetUrl(value: string | null | undefined, remoteAssetBaseUrl: string) {
  if (!value) {
    return value ?? ''
  }

  if (remoteAssetBaseUrl) {
    const campaignAssetUrl = getRemoteCampaignAssetUrl(value, remoteAssetBaseUrl)

    if (campaignAssetUrl && !window.fushiDesktop?.assetExists(value)) {
      return campaignAssetUrl
    }

    const publicAssetPath = getRemotePublicAssetPath(value)

    if (publicAssetPath) {
      const localAssetUrl = `/assets/${publicAssetPath}`

      if (window.fushiDesktop?.assetExists(localAssetUrl)) {
        return resolveRuntimeAssetUrl(localAssetUrl)
      }

      return `${remoteAssetBaseUrl}/assets/library/${publicAssetPath
        .split('/')
        .filter(Boolean)
        .map(encodeURIComponent)
        .join('/')}`
    }
  }

  return resolveRuntimeAssetUrl(value)
}

const AUTOMATIC_MUN_TRANSITION_PREFIX = 'interlude-map-'

const MUN_AUTOMATIC_ARRIVAL_MEDIA_BY_MAP_ID: Record<
  string,
  { assetUrl: string; description: string; name: string; summary: string; thumbnailUrl: string }
> = {
  planicie_armazem_comunitario_topdown: {
    assetUrl: '/assets/mundi/locations/loc_armazem_comunitario.png',
    thumbnailUrl: '/assets/mundi/locations/loc_armazem_comunitario.png',
    name: 'Chegada - Armazem Comunitario',
    summary: 'Interludio da cabana do Armazem antes de abrir o topdown interno.',
    description:
      'Chegada externa ao Armazem Comunitario antes da troca para o topdown interno.',
  },
}

function getAutomaticMundiTransitionId(mapId: string) {
  return `${AUTOMATIC_MUN_TRANSITION_PREFIX}${mapId}`
}

function isAutomaticMundiTransitionId(transitionId: string) {
  return transitionId.startsWith(AUTOMATIC_MUN_TRANSITION_PREFIX)
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

interface TabletopCharacterStageTransition {
  id: string
  previousTokenImageUrl?: string
  previousPortraitUrl?: string
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
  instanceNumber?: number
  map: TabletopMap
}): TabletopToken {
  const { character, existingTokens, map } = input
  const size: TabletopTokenSize =
    character.tokenSize === 2 || character.tokenSize === 3
      ? character.tokenSize
      : 1
  const label = buildTokenLabel(character.nome)
  const isMob = character.tipo === 'mob'
  const mobInstanceNumber =
    isMob && input.instanceNumber && input.instanceNumber > 0
      ? Math.floor(input.instanceNumber)
      : undefined

  return {
    id: buildTabletopTokenId(character.id),
    characterId: character.id,
    label: mobInstanceNumber ? `${label}${mobInstanceNumber}` : label,
    color: getTokenColor(character.tone, character.tipo),
    cell: findNextOpenCell(existingTokens, map, size),
    size,
    tokenKind:
      isMob
        ? 'mob'
        : character.tipo === 'npc'
          ? 'npc'
          : undefined,
    mobId: isMob ? character.id : undefined,
    mobInstanceNumber,
    npcId: character.tipo === 'npc' ? character.id : undefined,
    visibility: character.tipo === 'player' ? 'public' : 'gm',
    control: character.permissions?.tokenControl
      ? {
          ...character.permissions.tokenControl,
          controlledByPlayerIds: [
            ...character.permissions.tokenControl.controlledByPlayerIds,
          ],
        }
      : undefined,
    resourceOverride:
      character.tipo === 'mob'
        ? { ...character.recursos }
        : undefined,
  }
}

function getNextMobInstanceNumber(characterId: string, existingTokens: TabletopToken[]) {
  const currentMax = existingTokens
    .filter((token) => token.characterId === characterId)
    .reduce((maxValue, token) => {
      if (typeof token.mobInstanceNumber === 'number' && token.mobInstanceNumber > maxValue) {
        return token.mobInstanceNumber
      }

      const labelMatch = /(\d+)$/.exec(token.label)
      const labelNumber = labelMatch ? Number(labelMatch[1]) : 0

      return Number.isFinite(labelNumber) && labelNumber > maxValue
        ? labelNumber
        : maxValue
    }, 0)

  return currentMax + 1
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

function getSessionActorLabel(profile: FushiAccessProfile | null) {
  if (!profile || profile.role === 'gm') {
    return 'M'
  }

  return getShortPlayerLabel(profile.id)
}

function getWorldMundiBodyControllerIds(body: WorldMundiBody | null | undefined) {
  if (!body) {
    return []
  }

  return Array.from(
    new Set([
      body.jogadorControladorId,
      ...(body.jogadoresControladoresIds ?? []),
    ].filter(Boolean)),
  )
}

function applyPersistentBodyControlToToken(
  token: TabletopToken,
  body: WorldMundiBody,
): TabletopToken {
  const controllerIds = getWorldMundiBodyControllerIds(body)
  const playerId = controllerIds[0] ?? ''
  const consciousnessId =
    body.conscienciaControladoraId || getWorldMundiConsciousnessIdForPlayer(playerId)

  if (controllerIds.length === 0 || !body.ocupadoPorConsciencia) {
    return token
  }

  const controlledByPlayerIds = controllerIds
  const controllerLabel =
    controllerIds.length > 1
      ? controllerIds.map(getShortPlayerLabel).join('/')
      : getShortPlayerLabel(playerId)

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
    label: controllerLabel,
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

function normalizeRemoteTransitionPlaybackState(
  value: unknown,
): SharedTransitionPlaybackState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const input = value as Partial<SharedTransitionPlaybackState>
  const activeTransitionId =
    typeof input.activeTransitionId === 'string' && input.activeTransitionId
      ? input.activeTransitionId
      : null

  if (!activeTransitionId) {
    return null
  }

  return {
    activeTransitionId,
    currentTime:
      typeof input.currentTime === 'number' && Number.isFinite(input.currentTime)
        ? Math.max(0, input.currentTime)
        : 0,
    mapTargetId:
      typeof input.mapTargetId === 'string' && input.mapTargetId
        ? input.mapTargetId
        : null,
    paused: input.paused === true,
    startedAt:
      typeof input.startedAt === 'number' && Number.isFinite(input.startedAt)
        ? input.startedAt
        : Date.now(),
    updatedAt:
      typeof input.updatedAt === 'number' && Number.isFinite(input.updatedAt)
        ? input.updatedAt
        : typeof input.startedAt === 'number' && Number.isFinite(input.startedAt)
          ? input.startedAt
          : Date.now(),
  }
}

function formatDiagnosticTimestamp(value: string | null) {
  if (!value) {
    return '--'
  }

  const timestamp = new Date(value)

  if (Number.isNaN(timestamp.getTime())) {
    return '--'
  }

  return timestamp.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function getDiagnosticStatusLabel(status: string) {
  switch (status) {
    case 'queued':
      return 'Na fila'
    case 'confirmed':
      return 'Confirmado'
    case 'rejected':
      return 'Recusado'
    case 'retrying':
      return 'Tentando de novo'
    case 'offline':
      return 'Offline'
    default:
      return 'Pronto'
  }
}

function formatDiagnosticValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '--'
  }

  return String(value)
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

export function TablePage() {
  const navigate = useNavigate()
  const { data, updateCharacter } = useMasterData()
  const { showPerformanceOverlay, visualQuality } = useProductPreferences()
  const {
    addLogEntry: addRemoteLogEntry,
    cancelCombatEffect: cancelRemoteCombatEffect,
    clientConfig: multiplayerClientConfig,
    connectedPlayers: multiplayerConnectedPlayers,
    connectionStatus: multiplayerConnectionStatus,
    diagnostics: multiplayerDiagnostics,
    errorMessage: multiplayerErrorMessage,
    hostStatus: multiplayerHostStatus,
    moveToken: moveRemoteToken,
    networkLatencyMs: multiplayerNetworkLatencyMs,
    publicState: multiplayerPublicState,
    requestTurnAction,
    remoteActiveProfile: multiplayerRemoteActiveProfile,
    setCharacterEditLock,
    updateCharacter: updateRemoteCharacter,
    updateMeasurement: updateRemoteMeasurement,
  } = useMultiplayer()
  const {
    accessState,
    activeAccessProfile,
    logoutAccessProfile,
    playerCharacterId,
    resetViewMode,
    updateAccessProfile,
    viewMode,
  } = useViewMode()
  const isRemotePlayerMode =
    multiplayerConnectionStatus === 'connected' && viewMode === 'player'
  const isRemotePlayerSession =
    isRemotePlayerMode && Boolean(multiplayerPublicState)
  const effectiveActiveAccessProfile =
    isRemotePlayerMode && multiplayerRemoteActiveProfile?.role === 'player'
      ? multiplayerRemoteActiveProfile
      : activeAccessProfile
  const boardRootRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const pingTimeoutsRef = useRef<number[]>([])
  const pendingSceneCameraKeyRef = useRef('')
  const externalSyncKeysRef = useRef(new Set<string>())
  const cameraPersistFrameRef = useRef<number | null>(null)
  const updateCurrentScene3dCameraRef = useRef<
    (partialCameraState: TabletopCamera3DState) => void
  >(() => {})
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
  const rollWindowRestoreTimeoutRef = useRef<number | null>(null)
  const diceQueueAdvanceTimeoutRef = useRef<number | null>(null)
  const boardImpactTimeoutRef = useRef<number | null>(null)
  const vfxPresentationTimeoutRef = useRef<number | null>(null)
  const lastRollToastIdRef = useRef('')
  const isRollToastPlaybackArmedRef = useRef(false)
  const activeDiceRollEntryRef = useRef<TabletopLogEntry | null>(null)
  const pendingDiceRollEntriesRef = useRef<TabletopLogEntry[]>([])
  const queuedDiceRollIdsRef = useRef(new Set<string>())
  const settledDiceRollIdsRef = useRef(new Set<string>())
  const turnActionRequestCooldownRef = useRef<Record<string, number>>({})
  const diceRollCooldownUntilRef = useRef<Record<string, number>>({})
  const diceRollGuardNoticeTimeoutRef = useRef<number | null>(null)
  const processedCombatLogEntryIdsRef = useRef(new Set<string>())
  const remoteCharacterSyncKeyRef = useRef('')
  const tableMountedAtRef = useRef(getRuntimeTimestamp())
  const lastProcessedBroadcastEventIdRef = useRef('')
  const lastAppliedAudioMixerKeyRef = useRef('')
  const objectUndoStackRef = useRef<TabletopBoardObject[][]>([])
  const objectUndoSceneIdRef = useRef('')
  const activeCampaignId = data?.campaigns.activeCampaignId ?? 'campaign-local-default'
  const [session, setSession] = useState(() =>
    readPersistedTabletopSession(activeCampaignId),
  )
  const emptyEventState = useMemo(() => createTabletopEventSystemState(), [])
  const eventState = session?.eventState ?? emptyEventState
  const [personalNotesByOwner, setPersonalNotesByOwner] = useState(() =>
    readPersistedTabletopNotes(),
  )
  const [identityResourcesByBody, setIdentityResourcesByBody] = useState(() =>
    readPersistedIdentityResources(),
  )
  const [libraryState, setLibraryState] = useState(() =>
    readPersistedTabletopLibraryState(activeCampaignId),
  )
  const [worldMundiState, setWorldMundiState] = useState(() =>
    readPersistedWorldMundiState(activeCampaignId),
  )
  const [activeHudPanel, setActiveHudPanel] = useState<HudPanelId | null>(null)
  const [masterBookView, setMasterBookView] = useState<'rules' | 'history'>('rules')
  const [trainingOpenRequestId, setTrainingOpenRequestId] = useState(0)
  const [turnDraftActiveTokenId, setTurnDraftActiveTokenId] = useState('')
  const [turnDraftTokenIds, setTurnDraftTokenIds] = useState<string[]>([])
  const [activeUtilityWindow, setActiveUtilityWindow] =
    useState<UtilityWindowId>(null)
  const [isTopbarExpanded, setIsTopbarExpanded] = useState(false)
  const [isHudExpanded, setIsHudExpanded] = useState(false)
  const [isUtilityExpanded, setIsUtilityExpanded] = useState(false)
  const [inspectedTokenId, setInspectedTokenId] = useState('')
  const [sheetFocusRequest, setSheetFocusRequest] =
    useState<CharacterSheetFocusRequest | undefined>(undefined)
  const [sharedBodySheetProfileByToken, setSharedBodySheetProfileByToken] =
    useState<Record<string, string>>({})
  const [identityResourceProfileByToken, setIdentityResourceProfileByToken] =
    useState<Record<string, FushiAccessProfileId | ''>>({})
  const [configureMapId, setConfigureMapId] = useState<string | null>(null)
  const [focusedMapLibraryId, setFocusedMapLibraryId] = useState('')
  const [isMeasureToolActive, setIsMeasureToolActive] = useState(false)
  const [objectPlacementPresetId, setObjectPlacementPresetId] = useState('')
  const [objectLibraryTab, setObjectLibraryTab] = useState<'animations' | 'objects'>(
    'objects',
  )
  const [objectLibraryView, setObjectLibraryView] =
    useState<'catalog' | 'scene'>('catalog')
  const [objectLibrarySearch, setObjectLibrarySearch] = useState('')
  const [isObjectPresetImportOpen, setIsObjectPresetImportOpen] = useState(false)
  const [selectedObjectId, setSelectedObjectId] = useState('')
  const [objectMoveTargetId, setObjectMoveTargetId] = useState('')
  const [editor3dTool, setEditor3dTool] = useState<Tabletop3DEditorTool>('translate')
  const [expandedObjectAdvancedId, setExpandedObjectAdvancedId] = useState('')
  const playersCanMeasure = true
  const [preparedSceneIdOverride, setPreparedSceneIdOverride] = useState('')
  const [sceneEntryId, setSceneEntryId] = useState(0)
  const [boardRenderEpoch, setBoardRenderEpoch] = useState(0)
  const [isBoardArtworkSuspended, setIsBoardArtworkSuspended] = useState(false)
  const [isLightingEditMode, setIsLightingEditMode] = useState(false)
  const [selectedSceneLightId, setSelectedSceneLightId] = useState('')
  const [dayNightTransition, setDayNightTransition] =
    useState<TabletopDayNightTransitionState | null>(null)
  const previousBoardIsNightRef = useRef<boolean | null>(null)
  const dayNightTransitionTimerRef = useRef<number | null>(null)
  const lightingWriteRef = useRef<{
    pending: TabletopSceneLighting | null
    sceneId: string
    timerId: number | null
  }>({
    pending: null,
    sceneId: '',
    timerId: null,
  })
  const lightingPointerLastWriteRef = useRef(0)
  const characterStageSnapshotsRef = useRef<
    Record<
      string,
      {
        activeStageId: string
        avatarUrl?: string
        revision: number
        tokenImageUrl?: string
      }
    >
  >({})
  const [characterStageTransitions, setCharacterStageTransitions] = useState<
    Record<string, TabletopCharacterStageTransition>
  >({})
  const boardRecoveryTimerRef = useRef<number | null>(null)
  const boardAutoRecoveryRef = useRef({
    attempts: 0,
    mapId: '',
    startedAt: 0,
  })
  const boardManualRecoveryRef = useRef({
    hardRecoveryStarted: false,
    requestedAt: 0,
  })
  const [introOverlayState, setIntroOverlayState] =
    useState<TabletopIntroOverlayState | null>(null)
  const [transitionOverlayState, setTransitionOverlayState] =
    useState<TabletopTransitionOverlayState | null>(null)
  const [cinematicOverlayState, setCinematicOverlayState] =
    useState<TabletopCinematicOverlayState | null>(null)
  const [activeVfxPresentation, setActiveVfxPresentation] =
    useState<TabletopVfxPresentationState | null>(null)
  const [audioTransportState, setAudioTransportState] =
    useState<TabletopAudioTransportState>('stopped')
  const [musicVolume, setMusicVolume] = useState(0.18)
  const [ambienceVolume, setAmbienceVolume] = useState(0.14)
  const [audioStatusMessage, setAudioStatusMessage] = useState('')
  const [mixerTracks, setMixerTracks] = useState<Record<string, TabletopMixerTrackState>>(
    () => session?.audioMixerState.tracks ?? {},
  )
  const [libraryAudioStatusMessage, setLibraryAudioStatusMessage] = useState('')
  const [tableFeedbackMessage, setTableFeedbackMessage] = useState('')
  const [pendingCombatResolution, setPendingCombatResolution] =
    useState<PendingCombatResolution | null>(null)
  const [combatFocusRequest, setCombatFocusRequest] =
    useState<CombatFocusRequest | null>(null)
  const [dismissedCombatReceiptId, setDismissedCombatReceiptId] = useState('')
  const [localCombatPreview, setLocalCombatPreview] =
    useState<TabletopCombatPreview | null>(null)
  const [dismissedCombatPreviewId, setDismissedCombatPreviewId] = useState('')
  const [activeDiceRollEntry, setActiveDiceRollEntry] = useState<TabletopLogEntry | null>(null)
  const [pendingDiceRollEntries, setPendingDiceRollEntries] = useState<TabletopLogEntry[]>([])
  const [diceRollGuardNotice, setDiceRollGuardNotice] = useState<{
    id: number
    message: string
    tone: DiceRollGuardNoticeTone
  } | null>(null)
  const [tabletopRollDraft, setTabletopRollDraft] = useState<TabletopRollDraft>({
    bonus: 0,
    diceColor: '#d8a34d',
    modo: 'highest',
    quantidadeDados: 1,
    tipoDado: 20,
  })
  const [consumedCombatPassives, setConsumedCombatPassives] = useState<Record<string, true>>({})
  const [boardImpactEvent, setBoardImpactEvent] =
    useState<Tabletop3DBoardImpact | null>(null)
  const [rollToastEntry, setRollToastEntry] = useState<TabletopLogEntry | null>(null)
  const [tokenInspectorRestoreSignal, setTokenInspectorRestoreSignal] = useState(0)
  const [imagePreviewState, setImagePreviewState] =
    useState<TabletopImagePreviewState | null>(() => readSharedImagePreviewState())
  const [pings, setPings] = useState<TabletopPing[]>([])
  const [sharedTransitionPlaybackState, setSharedTransitionPlaybackState] =
    useState<SharedTransitionPlaybackState | null>(() =>
      readSharedTransitionPlaybackState(),
    )
  const lastTransitionPlaybackUpdatedAtRef = useRef(
    sharedTransitionPlaybackState?.updatedAt ?? 0,
  )
  const [transitionOverrides, setTransitionOverrides] = useState<
    Record<string, PersistedTransitionOverride>
  >(() => readPersistedTransitionOverrides(activeCampaignId))
  const [playerLocalZoomByScene, setPlayerLocalZoomByScene] = useState<
    Record<string, number>
  >({})
  const [sceneReturnTransitionActive, setSceneReturnTransitionActive] =
    useState(false)
  const [configureTransitionId, setConfigureTransitionId] = useState<string | null>(null)
  const [performanceFps, setPerformanceFps] = useState(0)

  const isGridVisible = session?.isGridVisible ?? DEFAULT_TABLETOP_GRID_VISIBLE
  const logEntries = session?.logEntries ?? EMPTY_TABLETOP_LOG_ENTRIES
  const [loadedTableCampaignId, setLoadedTableCampaignId] = useState(activeCampaignId)
  const latestTableStateRef = useRef({
    activeCampaignId,
    libraryState,
    loadedTableCampaignId,
    session,
    transitionOverrides,
    worldMundiState,
  })
  const isRemotePlayerSessionRef = useRef(isRemotePlayerMode)
  const lastRemoteMeasurementKeyRef = useRef('clear')

  const checkHostingActiveCampaign = useEffectEvent(isHostingActiveCampaign)

  useEffect(() => {
    if (!showPerformanceOverlay) {
      return
    }

    let cancelled = false
    let frameCount = 0
    let lastSampleAt = performance.now()
    let frameId = 0

    const tick = () => {
      if (cancelled) {
        return
      }

      frameCount += 1
      const now = performance.now()
      const elapsed = now - lastSampleAt

      if (elapsed >= 500) {
        setPerformanceFps(Math.round((frameCount * 1000) / elapsed))
        frameCount = 0
        lastSampleAt = now
      }

      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frameId)
    }
  }, [showPerformanceOverlay])

  useLayoutEffect(() => {
    isRemotePlayerSessionRef.current = isRemotePlayerMode
    latestTableStateRef.current = {
      activeCampaignId,
      libraryState,
      loadedTableCampaignId,
      session,
      transitionOverrides,
      worldMundiState,
    }
  }, [
    activeCampaignId,
    isRemotePlayerMode,
    libraryState,
    loadedTableCampaignId,
    session,
    transitionOverrides,
    worldMundiState,
  ])

  useEffect(() => {
    if (
      isRemotePlayerMode ||
      viewMode !== 'gm' ||
      loadedTableCampaignId !== activeCampaignId ||
      !window.fushiDesktop
    ) {
      return
    }

    let cancelled = false
    let timeoutId: number | null = null

    const pollPersistedSession = () => {
      if (cancelled) {
        return
      }

      const hostStatus = window.fushiDesktop?.getMultiplayerHostStatus()

      if (
        !hostStatus?.isRunning ||
        (hostStatus.campaignId && hostStatus.campaignId !== activeCampaignId)
      ) {
        timeoutId = window.setTimeout(pollPersistedSession, HOST_SESSION_POLL_MS)
        return
      }

      const persistedSession = readPersistedTabletopSession(activeCampaignId)

      if (persistedSession) {
        const currentSession = latestTableStateRef.current.session
        const currentSessionKey = currentSession ? JSON.stringify(currentSession) : ''
        const persistedSessionKey = JSON.stringify(persistedSession)

        if (persistedSessionKey !== currentSessionKey) {
          externalSyncKeysRef.current.add('session')
          setSession(persistedSession)
        }
      }

      timeoutId = window.setTimeout(pollPersistedSession, HOST_SESSION_POLL_MS)
    }

    timeoutId = window.setTimeout(pollPersistedSession, HOST_SESSION_POLL_MS)

    return () => {
      cancelled = true
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [
    activeCampaignId,
    isRemotePlayerMode,
    loadedTableCampaignId,
    viewMode,
  ])

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
    if (!isRemotePlayerSession || !multiplayerPublicState) {
      return
    }

    queueMicrotask(() => {
      const remoteTransitionPlaybackState = normalizeRemoteTransitionPlaybackState(
        multiplayerPublicState.transitionPlayback,
      )

      externalSyncKeysRef.current.add('session')
      externalSyncKeysRef.current.add('library')
      externalSyncKeysRef.current.add('mundi')
      setSession(
        createPersistedTabletopSession(
          multiplayerPublicState.tabletopSession as Parameters<
            typeof createPersistedTabletopSession
          >[0],
        ),
      )
      setLibraryState(
        createTabletopLibraryState(
          multiplayerPublicState.libraryState as Parameters<
            typeof createTabletopLibraryState
          >[0],
        ),
      )
      setWorldMundiState(
        createWorldMundiState(
          multiplayerPublicState.world as Parameters<typeof createWorldMundiState>[0],
          { useDefaults: false },
        ),
      )
      setTransitionOverrides(
        multiplayerPublicState.transitionOverrides &&
          typeof multiplayerPublicState.transitionOverrides === 'object' &&
          !Array.isArray(multiplayerPublicState.transitionOverrides)
          ? (multiplayerPublicState.transitionOverrides as Record<
              string,
              PersistedTransitionOverride
            >)
          : {},
      )
      const acceptedPlaybackState = applySharedTransitionPlaybackState(
        remoteTransitionPlaybackState,
      )
      if (acceptedPlaybackState && remoteTransitionPlaybackState?.activeTransitionId) {
        setTransitionOverlayState((currentState) =>
          currentState?.transitionId === remoteTransitionPlaybackState.activeTransitionId
            ? currentState
            : {
                transitionId: remoteTransitionPlaybackState.activeTransitionId ?? '',
                triggerId: (currentState?.triggerId ?? 0) + 1,
              },
        )
      }
      setLoadedTableCampaignId(activeCampaignId)
    })
  }, [
    activeCampaignId,
    isRemotePlayerSession,
    multiplayerPublicState,
  ])

  useEffect(() => {
    if (!isRemotePlayerSession || !data || !Array.isArray(multiplayerPublicState?.characters)) {
      if (!isRemotePlayerSession) {
        remoteCharacterSyncKeyRef.current = ''
      }
      return
    }

    const remoteCharacters = multiplayerPublicState.characters
      .filter(
        (character): character is CharacterSheet =>
          Boolean(character) &&
          typeof character === 'object' &&
          typeof (character as CharacterSheet).id === 'string',
      )
      .map((character) => normalizeCharacterSheet(character))
    const syncKey = JSON.stringify(remoteCharacters)

    if (remoteCharacterSyncKeyRef.current === syncKey) {
      return
    }

    remoteCharacterSyncKeyRef.current = syncKey
    remoteCharacters.forEach((remoteCharacter) => {
      const localCharacter = data.characters.items.find(
        (character) => character.id === remoteCharacter.id,
      )
      const mergedRemoteCharacter = localCharacter
        ? normalizeCharacterSheet({
            ...remoteCharacter,
            avatarUrl: remoteCharacter.avatarUrl || localCharacter.avatarUrl,
            tokenImageUrl: remoteCharacter.tokenImageUrl || localCharacter.tokenImageUrl,
          })
        : remoteCharacter

      if (
        localCharacter &&
        JSON.stringify(localCharacter) === JSON.stringify(mergedRemoteCharacter)
      ) {
        return
      }

      updateCharacter(mergedRemoteCharacter)
    })
  }, [
    data,
    isRemotePlayerSession,
    multiplayerPublicState?.characters,
    updateCharacter,
  ])

  useEffect(() => {
    if (loadedTableCampaignId !== activeCampaignId) {
      return
    }

    if (isRemotePlayerMode) {
      return
    }

    if (externalSyncKeysRef.current.delete('session')) {
      return
    }

    if (checkHostingActiveCampaign()) {
      return
    }

    if (!session) {
      clearPersistedTabletopSession(activeCampaignId)
      return
    }

    writePersistedTabletopSession(session, activeCampaignId)
  }, [activeCampaignId, isRemotePlayerMode, loadedTableCampaignId, session])

  useEffect(() => {
    if (loadedTableCampaignId !== activeCampaignId) {
      return
    }

    if (isRemotePlayerMode) {
      return
    }

    if (externalSyncKeysRef.current.delete('library')) {
      return
    }

    writePersistedTabletopLibraryState(libraryState, activeCampaignId, {
      origin: 'TablePage:libraryState-effect',
    })
  }, [activeCampaignId, isRemotePlayerMode, libraryState, loadedTableCampaignId])

  useEffect(() => {
    if (loadedTableCampaignId !== activeCampaignId) {
      return
    }

    if (isRemotePlayerMode) {
      return
    }

    if (externalSyncKeysRef.current.delete('mundi')) {
      return
    }

    writePersistedWorldMundiState(worldMundiState, activeCampaignId)
  }, [activeCampaignId, isRemotePlayerMode, loadedTableCampaignId, worldMundiState])

  useEffect(() => {
    writePersistedTabletopNotes(personalNotesByOwner)
  }, [personalNotesByOwner])

  useEffect(() => {
    writePersistedIdentityResources(identityResourcesByBody)
  }, [identityResourcesByBody])

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (isRemotePlayerSessionRef.current) {
        return
      }

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
        applySharedTransitionPlaybackState(readSharedTransitionPlaybackState())
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
    const unsubscribe = window.fushiDesktop?.onStorageChanged((event) => {
      if (isRemotePlayerSessionRef.current) {
        return
      }

      if (event.scope === 'campaign' && event.campaignId && event.campaignId !== activeCampaignId) {
        return
      }

      if (event.name === 'session') {
        externalSyncKeysRef.current.add('session')
        setSession(readPersistedTabletopSession(activeCampaignId))
      }

      if (event.name === 'library') {
        externalSyncKeysRef.current.add('library')
        setLibraryState(readPersistedTabletopLibraryState(activeCampaignId))
      }

      if (event.name === 'mundi') {
        externalSyncKeysRef.current.add('mundi')
        setWorldMundiState(readPersistedWorldMundiState(activeCampaignId))
      }

      if (event.name === 'transitionOverrides') {
        externalSyncKeysRef.current.add('transitionOverrides')
        setTransitionOverrides(readPersistedTransitionOverrides(activeCampaignId))
      }

      if (event.name === 'transitionPlayback') {
        applySharedTransitionPlaybackState(readSharedTransitionPlaybackState())
      }
    })

    return () => {
      unsubscribe?.()
    }
  }, [activeCampaignId])

  useEffect(() => {
    if (loadedTableCampaignId !== activeCampaignId) {
      return
    }

    if (isRemotePlayerMode) {
      return
    }

    if (externalSyncKeysRef.current.delete('transitionOverrides')) {
      return
    }

    writePersistedTransitionOverrides(transitionOverrides, activeCampaignId)
  }, [activeCampaignId, isRemotePlayerMode, loadedTableCampaignId, transitionOverrides])

  useEffect(() => {
    function flushTableStateBeforeClose() {
      if (isRemotePlayerSessionRef.current) {
        return
      }

      const latest = latestTableStateRef.current

      if (latest.loadedTableCampaignId !== latest.activeCampaignId) {
        return
      }

      if (latest.session) {
        writePersistedTabletopSession(latest.session, latest.activeCampaignId)
      }

      writePersistedTabletopLibraryState(
        latest.libraryState,
        latest.activeCampaignId,
        { origin: 'TablePage:beforeunload-flush' },
      )
      writePersistedWorldMundiState(
        latest.worldMundiState,
        latest.activeCampaignId,
      )
      writePersistedTransitionOverrides(
        latest.transitionOverrides,
        latest.activeCampaignId,
      )
    }

    window.addEventListener('beforeunload', flushTableStateBeforeClose)

    return () => {
      window.removeEventListener('beforeunload', flushTableStateBeforeClose)
    }
  }, [])

  const hudItems = useMemo(
    () => [
      { id: 'maps', label: 'Mapas', shortLabel: 'MAP' },
      { id: 'book', label: 'Livro', shortLabel: 'LIV' },
      { id: 'music', label: 'Musicas', shortLabel: 'MSC' },
      { id: 'objects', label: 'Objetos', shortLabel: 'OBJ' },
      { id: 'npcs', label: 'NPCs', shortLabel: 'NPC' },
      { id: 'builds', label: 'Builds absorvidas', shortLabel: 'BUI' },
      { id: 'statuses', label: 'Buffs e debuffs', shortLabel: 'BUF' },
      { id: 'events', label: 'Eventos da mesa', shortLabel: 'EVE' },
      { id: 'vfx', label: 'Efeitos visuais', shortLabel: 'VFX' },
      { id: 'world', label: 'Mapa Mundi', shortLabel: 'MUN' },
      { id: 'turns', label: 'Turnos', shortLabel: 'TRN' },
      { id: 'diagnostics', label: 'Diagnostico multiplayer', shortLabel: 'NET' },
    ] as const,
    [],
  )

  useEffect(() => {
    return () => {
      pingTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      if (cameraPersistFrameRef.current !== null) {
        window.clearTimeout(cameraPersistFrameRef.current)
      }
      if (rollToastTimeoutRef.current !== null) {
        window.clearTimeout(rollToastTimeoutRef.current)
      }
      if (rollWindowRestoreTimeoutRef.current !== null) {
        window.clearTimeout(rollWindowRestoreTimeoutRef.current)
      }
      if (diceQueueAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(diceQueueAdvanceTimeoutRef.current)
      }
      if (diceRollGuardNoticeTimeoutRef.current !== null) {
        window.clearTimeout(diceRollGuardNoticeTimeoutRef.current)
      }
      if (boardImpactTimeoutRef.current !== null) {
        window.clearTimeout(boardImpactTimeoutRef.current)
      }
      if (vfxPresentationTimeoutRef.current !== null) {
        window.clearTimeout(vfxPresentationTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    activeDiceRollEntryRef.current = activeDiceRollEntry
  }, [activeDiceRollEntry])

  useEffect(() => {
    pendingDiceRollEntriesRef.current = pendingDiceRollEntries
  }, [pendingDiceRollEntries])

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

  function getDiceRollActorKey(entry: TabletopLogEntry) {
    const author = entry.author?.trim()

    if (author) {
      return author
    }

    return viewMode === 'gm' ? 'M' : 'J'
  }

  function getDiceRollQueueSize() {
    return (activeDiceRollEntryRef.current ? 1 : 0) + pendingDiceRollEntriesRef.current.length
  }

  function showDiceRollGuardNotice(message: string, tone: DiceRollGuardNoticeTone = 'danger') {
    if (diceRollGuardNoticeTimeoutRef.current !== null) {
      window.clearTimeout(diceRollGuardNoticeTimeoutRef.current)
    }

    setDiceRollGuardNotice({
      id: Date.now(),
      message,
      tone,
    })
    diceRollGuardNoticeTimeoutRef.current = window.setTimeout(() => {
      diceRollGuardNoticeTimeoutRef.current = null
      setDiceRollGuardNotice(null)
    }, 2600)
  }

  function canSubmitDiceRollEntry(entry: TabletopLogEntry) {
    if (entry.type !== 'roll' || !entry.roll) {
      return true
    }

    if (getDiceRollQueueSize() >= DICE_ROLL_MAX_TOTAL_QUEUE) {
      showDiceRollGuardNotice('Fila de dados cheia. Aguarde a proxima rolagem terminar.', 'warning')
      return false
    }

    const actorKey = getDiceRollActorKey(entry)
    const now = Date.now()
    const cooldownUntil = diceRollCooldownUntilRef.current[actorKey] ?? 0

    if (cooldownUntil > now) {
      const seconds = Math.max(1, Math.ceil((cooldownUntil - now) / 1000))

      showDiceRollGuardNotice(`Espere ${seconds}s para rolar novamente.`, 'danger')
      return false
    }

    diceRollCooldownUntilRef.current[actorKey] = now + DICE_ROLL_ACTOR_COOLDOWN_MS
    return true
  }

  function clearDiceRollQueue() {
    if (diceQueueAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(diceQueueAdvanceTimeoutRef.current)
      diceQueueAdvanceTimeoutRef.current = null
    }

    queuedDiceRollIdsRef.current.clear()
    settledDiceRollIdsRef.current.clear()
    activeDiceRollEntryRef.current = null
    pendingDiceRollEntriesRef.current = []
    setPendingDiceRollEntries([])
    setActiveDiceRollEntry(null)
  }

  function startDiceRollPlayback(entry: TabletopLogEntry) {
    if (entry.type !== 'roll' || !entry.roll) {
      return
    }

    if (diceQueueAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(diceQueueAdvanceTimeoutRef.current)
      diceQueueAdvanceTimeoutRef.current = null
    }

    queuedDiceRollIdsRef.current.delete(entry.id)
    activeDiceRollEntryRef.current = entry
    setPendingDiceRollEntries((currentEntries) => {
      const nextEntries = currentEntries.filter((currentEntry) => currentEntry.id !== entry.id)

      pendingDiceRollEntriesRef.current = nextEntries
      return nextEntries
    })
    setActiveDiceRollEntry(entry)
    setRollToastEntry(null)
  }

  function queueDiceRollPlayback(entry: TabletopLogEntry) {
    if (entry.type !== 'roll' || !entry.roll) {
      return
    }

    if (
      settledDiceRollIdsRef.current.has(entry.id) ||
      queuedDiceRollIdsRef.current.has(entry.id) ||
      activeDiceRollEntryRef.current?.id === entry.id
    ) {
      return
    }

    if (getDiceRollQueueSize() >= DICE_ROLL_MAX_TOTAL_QUEUE) {
      return
    }

    queuedDiceRollIdsRef.current.add(entry.id)
    setPendingDiceRollEntries((currentEntries) => {
      if (currentEntries.some((currentEntry) => currentEntry.id === entry.id)) {
        return currentEntries
      }

      if (
        (activeDiceRollEntryRef.current ? 1 : 0) + currentEntries.length >=
        DICE_ROLL_MAX_TOTAL_QUEUE
      ) {
        queuedDiceRollIdsRef.current.delete(entry.id)
        pendingDiceRollEntriesRef.current = currentEntries
        return currentEntries
      }

      const nextEntries = [...currentEntries, entry]

      pendingDiceRollEntriesRef.current = nextEntries
      return nextEntries
    })
  }

  function requestDiceRollPlayback(entry: TabletopLogEntry) {
    if (entry.type !== 'roll' || !entry.roll) {
      return
    }

    if (
      settledDiceRollIdsRef.current.has(entry.id) ||
      activeDiceRollEntryRef.current?.id === entry.id
    ) {
      return
    }

    if (activeDiceRollEntryRef.current) {
      queueDiceRollPlayback(entry)
      return
    }

    startDiceRollPlayback(entry)
  }

  const requestDiceRollPlaybackFromEffect = useEffectEvent(requestDiceRollPlayback)

  useEffect(() => {
    const visibleRollEntries = logEntries.filter(
      (entry) =>
        entry.type === 'roll' &&
        entry.roll &&
        getLogEntryTimestamp(entry) >= tableMountedAtRef.current - 1000 &&
        (entry.visibility !== 'gm' || viewMode === 'gm'),
    )
    const latestRollEntryId = visibleRollEntries.at(-1)?.id ?? ''

    if (!isRollToastPlaybackArmedRef.current) {
      isRollToastPlaybackArmedRef.current = true
      lastRollToastIdRef.current = latestRollEntryId
      return
    }

    if (!latestRollEntryId || lastRollToastIdRef.current === latestRollEntryId) {
      return
    }

    const lastSeenIndex = visibleRollEntries.findIndex(
      (entry) => entry.id === lastRollToastIdRef.current,
    )
    const nextRollEntries =
      lastSeenIndex >= 0 ? visibleRollEntries.slice(lastSeenIndex + 1) : visibleRollEntries.slice(-1)

    lastRollToastIdRef.current = latestRollEntryId

    nextRollEntries.forEach((entry) => requestDiceRollPlaybackFromEffect(entry))
  }, [logEntries, viewMode])

  const ensureMixerAudioElementFromEffect = useEffectEvent(ensureMixerAudioElement)
  const pauseMixerTrackFromEffect = useEffectEvent(pauseMixerTrack)
  const playMixerTrackFromEffect = useEffectEvent(playMixerTrack)
  const seekMixerTrackFromEffect = useEffectEvent(seekMixerTrack)
  const setMixerTrackStateFromEffect = useEffectEvent(setMixerTrackState)
  const setMixerTrackVolumeFromEffect = useEffectEvent(setMixerTrackVolume)
  const stopMixerTrackFromEffect = useEffectEvent(stopMixerTrack)

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
    activeProfile: effectiveActiveAccessProfile,
    playerCharacterId,
    playerCharacters,
    viewMode,
  })
  const personalNotesOwnerId =
    viewMode === 'gm'
      ? 'gm'
      : `player:${effectiveActiveAccessProfile?.id || focusedPlayerCharacter?.id || playerCharacterId || 'guest'}`
  const personalNotesOwnerLabel =
    viewMode === 'gm'
      ? 'Notas do mestre'
      : `Notas de ${effectiveActiveAccessProfile?.label ?? focusedPlayerCharacter?.nome ?? 'jogador'}`
  const personalNotes = personalNotesByOwner[personalNotesOwnerId] ?? ''
  const playerPublicMundiState = useMemo<PublicMundiState | null>(() => {
    if (
      isRemotePlayerMode &&
      multiplayerPublicState?.world &&
      typeof multiplayerPublicState.world === 'object'
    ) {
      return multiplayerPublicState.world as PublicMundiState
    }

    const playerId =
      viewMode === 'player' && effectiveActiveAccessProfile?.role === 'player'
        ? effectiveActiveAccessProfile.id
        : ''

    return buildPublicMundiState(worldMundiState, playerId)
  }, [
    effectiveActiveAccessProfile?.id,
    effectiveActiveAccessProfile?.role,
    isRemotePlayerMode,
    multiplayerPublicState?.world,
    viewMode,
    worldMundiState,
  ])
  const canOpenPlayerMundi =
    viewMode === 'player' &&
    (playerPublicMundiState?.publicMap?.releasedToPlayers === true ||
      playerPublicMundiState?.publicBase?.releasedToPlayers === true)
  const remoteAssetBaseUrl = useMemo(
    () => (isRemotePlayerMode ? getRemoteAssetBaseUrl(multiplayerPublicState) : ''),
    [isRemotePlayerMode, multiplayerPublicState],
  )
  const availableMaps = useMemo(
    () => {
      const baseMaps = data ? getTabletopMaps(data.tabletop) : []
      const mergedMaps = [...baseMaps, ...libraryState.customMaps].filter(
        (map) => !libraryState.hiddenItems.maps[map.id],
      )

      return mergedMaps.map((map) => {
        const mergedMap = {
          ...map,
          ...(libraryState.mapOverrides[map.id] ?? {}),
        }

        return {
          ...mergedMap,
          image: resolveTabletopRuntimeAssetUrl(mergedMap.image, remoteAssetBaseUrl),
          imageUrl: resolveTabletopRuntimeAssetUrl(mergedMap.imageUrl, remoteAssetBaseUrl),
          previewImage: resolveTabletopRuntimeAssetUrl(mergedMap.previewImage, remoteAssetBaseUrl),
          thumbnailUrl: resolveTabletopRuntimeAssetUrl(mergedMap.thumbnailUrl, remoteAssetBaseUrl),
          animatedSurface: mergedMap.animatedSurface
            ? {
                ...mergedMap.animatedSurface,
                poster: resolveTabletopRuntimeAssetUrl(
                  mergedMap.animatedSurface.poster,
                  remoteAssetBaseUrl,
                ),
                source: resolveTabletopRuntimeAssetUrl(
                  mergedMap.animatedSurface.source,
                  remoteAssetBaseUrl,
                ),
              }
            : undefined,
        }
      })
    },
    [
      data,
      libraryState.customMaps,
      libraryState.hiddenItems.maps,
      libraryState.mapOverrides,
      remoteAssetBaseUrl,
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
  const automaticMundiTransitions = useMemo(() => {
    const persistedTransitions = new Map(
      libraryState.customTransitions
        .filter((transition) => isAutomaticMundiTransitionId(transition.id))
        .map((transition) => [transition.id, transition]),
    )
    const locationByMapId = new Map(
      worldMundiState.locations
        .filter((location) => location.mapId)
        .map((location) => [location.mapId, location]),
    )
    const submapByMapId = new Map(
      worldMundiState.submaps
        .filter((submap) => submap.mapId)
        .map((submap) => [submap.mapId, submap]),
    )

    return availableMaps.flatMap<TabletopTransitionAsset>((map) => {
      const linkedLocation = locationByMapId.get(map.id) ?? null
      const linkedSubmap = submapByMapId.get(map.id) ?? null

      if (!map.munLocationId && !linkedLocation && !linkedSubmap) {
        return []
      }

      const transitionId = getAutomaticMundiTransitionId(map.id)
      const persistedTransition = persistedTransitions.get(transitionId)
      const configuredArrival = MUN_AUTOMATIC_ARRIVAL_MEDIA_BY_MAP_ID[map.id]
      const previewAsset =
        configuredArrival?.assetUrl ||
        linkedLocation?.previewImageUrl ||
        linkedLocation?.imagemLocalUrl ||
        map.thumbnailUrl ||
        map.previewImage ||
        map.imageUrl ||
        map.image

      if (!previewAsset) {
        return []
      }

      return [
        {
          ...persistedTransition,
          id: transitionId,
          name:
            persistedTransition?.name?.trim() || configuredArrival?.name || `Chegada - ${map.name}`,
          summary:
            persistedTransition?.summary?.trim() ||
            configuredArrival?.summary ||
            `Interludio de chegada antes de abrir ${map.name}.`,
          category: 'MUN',
          biomeId: map.biomeId ?? linkedLocation?.biomaId ?? 'custom',
          toMapId: map.id,
          type: 'image',
          assetUrl: previewAsset,
          thumbnailUrl:
            configuredArrival?.thumbnailUrl || previewAsset,
          description:
            persistedTransition?.description?.trim() ||
            configuredArrival?.description ||
            `Chegada de ${linkedSubmap?.nome ?? linkedLocation?.nome ?? map.name} antes da troca para o mapa.`,
        },
      ]
    })
  }, [
    availableMaps,
    libraryState.customTransitions,
    worldMundiState.locations,
    worldMundiState.submaps,
  ])
  const availableTransitions = useMemo(
    () =>
      [
        ...(data?.tabletop.transitions ?? []),
        ...libraryState.customTransitions.filter(
          (transition) => !isAutomaticMundiTransitionId(transition.id),
        ),
        ...automaticMundiTransitions,
      ]
        .filter((transition) => !libraryState.hiddenItems.transitions[transition.id])
        .map((transition) => {
          const override = transitionOverrides[transition.id]
          const isAutomaticMundiTransition =
            isAutomaticMundiTransitionId(transition.id)
          const overrideHasToMap = override
            ? Object.prototype.hasOwnProperty.call(override, 'toMapId')
            : false
          const mergedTransition = override
            ? {
                ...transition,
                assetUrl: isAutomaticMundiTransition
                  ? transition.assetUrl
                  : override.assetUrl ?? transition.assetUrl,
                thumbnailUrl: isAutomaticMundiTransition
                  ? transition.thumbnailUrl
                  : override.thumbnailUrl ?? transition.thumbnailUrl,
                toMapId: override.keepCurrentMap
                  ? ''
                  : overrideHasToMap
                    ? override.toMapId
                    : transition.toMapId,
                type: isAutomaticMundiTransition
                  ? transition.type
                  : override.type ?? transition.type,
              }
            : transition

          return {
            ...mergedTransition,
            name: override?.customName?.trim() || mergedTransition.name,
            assetUrl: resolveTabletopRuntimeAssetUrl(
              mergedTransition.assetUrl,
              remoteAssetBaseUrl,
            ),
            thumbnailUrl: resolveTabletopRuntimeAssetUrl(
              mergedTransition.thumbnailUrl,
              remoteAssetBaseUrl,
            ),
          }
      }),
    [
      automaticMundiTransitions,
      data?.tabletop.transitions,
      libraryState.customTransitions,
      libraryState.hiddenItems.transitions,
      remoteAssetBaseUrl,
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
            ]
              .map((track) => ({
                ...track,
                ...(libraryState.trackOverrides[track.id] ?? {}),
              }))
              .filter((track) => !libraryState.hiddenItems.music[track.id])
              .map((track) => ({
                ...track,
                previewImage: resolveTabletopRuntimeAssetUrl(
                  track.previewImage,
                  remoteAssetBaseUrl,
                ),
                source: resolveTabletopRuntimeAssetUrl(track.source, remoteAssetBaseUrl),
              })),
            maps: availableMaps,
            musicTracks: [
              ...data.tabletop.assetLibrary.musicTracks,
              ...libraryState.customMusicTracks,
            ]
              .map((track) => ({
                ...track,
                ...(libraryState.trackOverrides[track.id] ?? {}),
              }))
              .filter((track) => !libraryState.hiddenItems.music[track.id])
              .map((track) => ({
                ...track,
                previewImage: resolveTabletopRuntimeAssetUrl(
                  track.previewImage,
                  remoteAssetBaseUrl,
                ),
                source: resolveTabletopRuntimeAssetUrl(track.source, remoteAssetBaseUrl),
              })),
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
      libraryState.trackOverrides,
      remoteAssetBaseUrl,
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
  const hasBoardScene = Boolean(boardScene)
  const boardLighting = useMemo(
    () =>
      normalizeTabletopSceneLighting(
        boardScene?.metadata.lighting ?? createDefaultTabletopSceneLighting(),
      ),
    [boardScene?.metadata.lighting],
  )
  const activeSelectedSceneLightId = boardLighting.lights.some(
    (light) => light.id === selectedSceneLightId,
  )
    ? selectedSceneLightId
    : ''
  const boardIsNight = isTabletopNight(worldMundiState.clock)
  const remoteBoardIsNight =
    isRemotePlayerSession &&
    multiplayerPublicState?.world &&
    typeof multiplayerPublicState.world === 'object'
      ? isTabletopNight(
          (multiplayerPublicState.world as { clock?: WorldMundiClock }).clock,
        )
      : boardIsNight
  const isBoardDayNightResolved =
    !isRemotePlayerSession || remoteBoardIsNight === boardIsNight

  useEffect(() => {
    void preloadTabletopSfx(['nightfall', 'daybreak'])
  }, [])

  useEffect(() => {
    previousBoardIsNightRef.current = null

    if (dayNightTransitionTimerRef.current !== null) {
      window.clearTimeout(dayNightTransitionTimerRef.current)
    }

    dayNightTransitionTimerRef.current = window.setTimeout(() => {
      setDayNightTransition(null)
      dayNightTransitionTimerRef.current = null
    }, 0)
  }, [activeCampaignId, isRemotePlayerMode])

  useEffect(() => {
    if (!hasBoardScene || !isBoardDayNightResolved) {
      return
    }

    const previousMode = previousBoardIsNightRef.current

    if (previousMode === null) {
      previousBoardIsNightRef.current = boardIsNight
      return
    }

    if (previousMode === boardIsNight) {
      return
    }

    previousBoardIsNightRef.current = boardIsNight
    const transition: TabletopDayNightTransitionState = {
      direction: boardIsNight ? 'to-night' : 'to-day',
      id: Date.now(),
    }

    setDayNightTransition(transition)
    void playTabletopSfx(boardIsNight ? 'nightfall' : 'daybreak')

    if (dayNightTransitionTimerRef.current !== null) {
      window.clearTimeout(dayNightTransitionTimerRef.current)
    }

    dayNightTransitionTimerRef.current = window.setTimeout(
      () => {
        setDayNightTransition((current) =>
          current?.id === transition.id ? null : current,
        )
        dayNightTransitionTimerRef.current = null
      },
      boardIsNight ? 6_200 : 4_200,
    )
  }, [boardIsNight, hasBoardScene, isBoardDayNightResolved])

  useEffect(
    () => () => {
      if (dayNightTransitionTimerRef.current !== null) {
        window.clearTimeout(dayNightTransitionTimerRef.current)
        dayNightTransitionTimerRef.current = null
      }
    },
    [],
  )
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

  function handleToggleBoardDayNight() {
    if (isRemotePlayerMode || viewMode !== 'gm') {
      return
    }

    setWorldMundiState((currentState) => {
      const nextMode = isTabletopNight(currentState.clock) ? 'day' : 'night'
      const nextClock: WorldMundiClock = {
        ...currentState.clock,
        hora: nextMode === 'day' ? 8 : 20,
        fase: 0,
      }

      return createWorldMundiState({
        ...currentState,
        clock: nextClock,
        logs: [
          createWorldMundiLogEntry({
            dia: nextClock.dia,
            hora: nextClock.hora,
            texto:
              nextMode === 'day'
                ? 'O Mestre abriu o dia sobre a mesa.'
                : 'O Mestre deixou a noite cair sobre a mesa.',
            tecnico: `Modo visual ${nextMode === 'day' ? 'dia' : 'noite'} definido diretamente no tabletop. O relogio publico foi atualizado.`,
            categoria: 'sistema',
            canal: 'mestre',
            tone: 'steady',
          }),
          ...currentState.logs,
        ],
      })
    })

    setTableFeedbackMessage(
      boardIsNight ? 'Dia definido para 08:00.' : 'Noite definida para 20:00.',
    )
  }

  function getLightingForWrite() {
    const pending = lightingWriteRef.current

    if (pending.pending && pending.sceneId === boardSceneId) {
      return pending.pending
    }

    return boardLighting
  }

  function commitSceneLighting(sceneId: string, lighting: TabletopSceneLighting) {
    if (isRemotePlayerMode || viewMode !== 'gm' || !sceneId) {
      return
    }

    updateSceneMetadata(sceneId, 'lighting', normalizeTabletopSceneLighting(lighting))
  }

  function flushLightingWrite() {
    const pending = lightingWriteRef.current

    if (pending.timerId !== null) {
      window.clearTimeout(pending.timerId)
      pending.timerId = null
    }

    const nextLighting = pending.pending
    const sceneId = pending.sceneId
    pending.pending = null

    if (nextLighting && sceneId) {
      commitSceneLighting(sceneId, nextLighting)
    }
  }

  function queueLightingWrite(
    nextLighting: TabletopSceneLighting,
    options: { immediate?: boolean } = {},
  ) {
    if (isRemotePlayerMode || viewMode !== 'gm' || !boardScene) {
      return
    }

    const pending = lightingWriteRef.current
    pending.pending = normalizeTabletopSceneLighting(nextLighting)
    pending.sceneId = boardScene.id

    if (options.immediate) {
      flushLightingWrite()
      return
    }

    if (pending.timerId !== null) {
      return
    }

    pending.timerId = window.setTimeout(() => {
      pending.timerId = null
      const value = pending.pending
      const sceneId = pending.sceneId
      pending.pending = null

      if (value && sceneId) {
        commitSceneLighting(sceneId, value)
      }
    }, 120)
  }

  function handleLightingPointerMove(input: { x: number; y: number }) {
    if (
      viewMode !== 'gm' ||
      !boardIsNight ||
      !boardLighting.enabled ||
      !boardLighting.cursorLight.enabled
    ) {
      return
    }

    window.dispatchEvent(
      new CustomEvent(TABLETOP_CURSOR_LIGHT_MOVE_EVENT, {
        detail: input,
      }),
    )

    const now = performance.now()

    if (now - lightingPointerLastWriteRef.current < 24) {
      return
    }

    lightingPointerLastWriteRef.current = now
    const currentLighting = getLightingForWrite()
    const cursorLight = currentLighting.cursorLight

    if (
      Math.abs(cursorLight.x - input.x) < 0.004 &&
      Math.abs(cursorLight.y - input.y) < 0.004
    ) {
      return
    }

    queueLightingWrite({
      ...currentLighting,
      cursorLight: {
        ...cursorLight,
        x: input.x,
        y: input.y,
      },
    })
  }

  function handleToggleSceneLighting() {
    const currentLighting = getLightingForWrite()
    queueLightingWrite(
      {
        ...currentLighting,
        enabled: !currentLighting.enabled,
      },
      { immediate: true },
    )
  }

  function handleToggleCursorLight() {
    const currentLighting = getLightingForWrite()
    const cursorWillBeEnabled = !currentLighting.cursorLight.enabled
    queueLightingWrite(
      {
        ...currentLighting,
        enabled: cursorWillBeEnabled ? true : currentLighting.enabled,
        cursorLight: {
          ...currentLighting.cursorLight,
          enabled: cursorWillBeEnabled,
        },
      },
      { immediate: true },
    )
  }

  function handleAddSceneLight() {
    if (!boardScene || viewMode !== 'gm' || isRemotePlayerMode) {
      return
    }

    const currentLighting = getLightingForWrite()

    if (currentLighting.lights.length >= TABLETOP_SCENE_LIGHT_LIMIT) {
      setTableFeedbackMessage('Limite de 24 pontos de luz por cena atingido.')
      return
    }

    const nextLight = createTabletopSceneLight({
      label: `Luz ${currentLighting.lights.length + 1}`,
      x: 0.5,
      y: 0.5,
    })
    const nextLighting = {
      ...currentLighting,
      enabled: true,
      lights: [...currentLighting.lights, nextLight],
    }

    setSelectedSceneLightId(nextLight.id)
    setIsLightingEditMode(true)
    queueLightingWrite(nextLighting, { immediate: true })
    setTableFeedbackMessage('Ponto de luz adicionado. Arraste o centro ou use Ctrl+T.')
  }

  function handleUpdateSceneLight(
    lightId: string,
    patch: Partial<TabletopSceneLight>,
  ) {
    const currentLighting = getLightingForWrite()
    const nextLighting = {
      ...currentLighting,
      lights: currentLighting.lights.map((light) =>
        light.id === lightId ? { ...light, ...patch } : light,
      ),
    }

    queueLightingWrite(nextLighting)
  }

  function handleMoveSceneLight(lightId: string, input: { x: number; y: number }) {
    handleUpdateSceneLight(lightId, input)
  }

  function handleResizeSceneLight(lightId: string, radius: number) {
    handleUpdateSceneLight(lightId, { radius })
  }

  function handleRemoveSceneLight(lightId: string) {
    const currentLighting = getLightingForWrite()
    const nextLighting = {
      ...currentLighting,
      lights: currentLighting.lights.filter((light) => light.id !== lightId),
    }

    if (selectedSceneLightId === lightId) {
      setSelectedSceneLightId('')
    }

    queueLightingWrite(nextLighting, { immediate: true })
  }

  useEffect(
    () => () => {
      if (lightingWriteRef.current.timerId !== null) {
        window.clearTimeout(lightingWriteRef.current.timerId)
        lightingWriteRef.current.timerId = null
      }
    },
    [],
  )

  const activeIntroCard = sceneRuntime?.introCard ?? null
  const activeTransitionOverlay =
    transitionOverlayState
      ? availableTransitions.find(
          (asset) => asset.id === transitionOverlayState.transitionId,
        ) ?? null
      : null
  const hasTransitionOverlay = Boolean(activeTransitionOverlay)
  const boardVisualQuality =
    hasTransitionOverlay && visualQuality === 'ultra' ? 'balanced' : visualQuality
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
  const sceneCamera3dState = boardScene?.camera3dState
  const isScene3dCameraEnabled = sceneCamera3dState?.enabled === true
  const isScene3dCameraFree =
    isScene3dCameraEnabled && (sceneCamera3dState?.mode ?? 'free') === 'free'
  const is3dFreeCameraVisible =
    isScene3dCameraFree && (viewMode === 'gm' || gmCameraControlEnabled)
  const is3dCameraEditorEnabled = viewMode === 'gm' && isScene3dCameraFree
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
  const sceneObjects = useMemo(() => {
    if (!boardScene || !boardMap) {
      return []
    }

    return (boardScene.objects ?? []).map((object) => ({
      ...object,
      cell: clampTabletopTokenCell(object.cell, boardMap, object),
    }))
  }, [boardMap, boardScene])
  const allObjectPresets = useMemo(
    () => [...TABLETOP_OBJECT_PRESETS, ...libraryState.customObjectPresets],
    [libraryState.customObjectPresets],
  )
  const visibleObjectPresets = useMemo(() => {
    const selectedLibraryKind = objectLibraryTab === 'animations' ? 'animation' : 'object'
    const normalizedSearch = objectLibrarySearch.trim().toLocaleLowerCase('pt-BR')

    return allObjectPresets.filter(
      (preset) =>
        (preset.libraryKind ?? 'object') === selectedLibraryKind &&
        isBundledObjectPresetAvailable(preset) &&
        (!normalizedSearch ||
          `${preset.name} ${preset.description}`
            .toLocaleLowerCase('pt-BR')
            .includes(normalizedSearch)),
    )
  },
    [allObjectPresets, objectLibrarySearch, objectLibraryTab],
  )
  const visibleSceneObjects = useMemo(() => {
    const normalizedSearch = objectLibrarySearch.trim().toLocaleLowerCase('pt-BR')
    if (!normalizedSearch) return sceneObjects
    return sceneObjects.filter((object) =>
      `${object.name} ${object.description ?? ''} ${object.renderMode}`
        .toLocaleLowerCase('pt-BR')
        .includes(normalizedSearch),
    )
  }, [objectLibrarySearch, sceneObjects])

  const activePlayerProfileId = getPlayerProfileId(effectiveActiveAccessProfile)
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
          getWorldMundiBodyControllerIds(body).length > 0 &&
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
            getWorldMundiBodyControllerIds(getPersistentBodyForToken(token)).includes(
              activePlayerProfileId,
            ),
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

    if (
      getWorldMundiBodyControllerIds(getPersistentBodyForToken(token)).includes(
        activePlayerProfileId,
      )
    ) {
      return true
    }

    return token.control?.controlledByPlayerIds.includes(activePlayerProfileId) ?? false
  }

  function canActivePlayerMoveTokens() {
    return viewMode === 'gm'
  }

  function isTokenVisibleForActivePlayer(token: TabletopToken) {
    if (viewMode === 'gm') {
      return true
    }

    const canControl = canActivePlayerControlToken(token)

    if (token.stealth?.enabled) {
      return canControl || token.stealth.ownerPlayerId === activePlayerProfileId
    }

    return token.visibility === 'public' || canControl
  }

  function resolveIdentityResourcePoolForToken(
    token: TabletopToken,
    profileId: FushiAccessProfileId | '',
    fallbackCharacter: CharacterSheet | null,
  ): IdentityResourcePool | null {
    if (!isIdentityResourceProfileId(profileId)) {
      return null
    }

    const profile = accessState.profiles.find((item) => item.id === profileId) ?? null
    const profileCharacter =
      profile?.characterId && data
        ? getCharacterById(data, profile.characterId)
        : null

    if (
      profileCharacter &&
      fallbackCharacter &&
      profileCharacter.id === fallbackCharacter.id
    ) {
      return getIdentityResourcePool(profileCharacter)
    }

    const bodyKey = getTokenIdentityBodyKey(token)
    const storedPool = identityResourcesByBody[bodyKey]?.[profileId]

    if (storedPool) {
      return storedPool
    }

    const sourceCharacter = profileCharacter ?? fallbackCharacter

    if (!sourceCharacter) {
      return {
        determinacaoAtual: 0,
        determinacaoMaxima: 0,
        fushiAtual: 0,
        fushiMaximo: 0,
        pericias: [],
        vidaAtual: 0,
        vidaMaxima: 0,
      }
    }

    return getIdentityResourcePool(sourceCharacter)
  }

  const visibleTokens =
    viewMode === 'gm'
      ? tokens
      : tokens.filter((token) => isTokenVisibleForActivePlayer(token))

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
              ...getWorldMundiBodyControllerIds(getPersistentBodyForToken(activeToken)),
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
  const tokenResourceCharacter =
    activeToken?.resourceOverride && baseActiveCharacter
      ? {
          ...baseActiveCharacter,
          recursos: {
            ...baseActiveCharacter.recursos,
            ...activeToken.resourceOverride,
          },
        }
      : baseActiveCharacter
  const activeIdentityResourceProfileId =
    activeToken && viewMode === 'player' && canActivePlayerControlToken(activeToken)
      ? getIdentityProfileId(effectiveActiveAccessProfile)
      : activeToken && viewMode === 'gm'
        ? identityResourceProfileByToken[activeToken.id] ?? ''
        : ''
  const activeIdentityResourcePool =
    activeToken && tokenResourceCharacter
      ? resolveIdentityResourcePoolForToken(
          activeToken,
          activeIdentityResourceProfileId,
          tokenResourceCharacter,
        )
      : null
  const activeCharacter = tokenResourceCharacter
    ? applyIdentityResourcePool(tokenResourceCharacter, activeIdentityResourcePool)
    : null
  const activeCharacterEffects = activeToken
    ? session?.publicCombatMarks ?? []
    : []

  function buildCharacterSheetEffectView(
    mark: TabletopCombatMark,
  ): CharacterSheetEffectView {
    const sourceToken =
      tokens.find((token) => token.id === mark.sourceTokenId) ?? null
    const targetToken =
      tokens.find((token) => token.id === mark.targetTokenId) ?? null
    const sourceCharacter = resolveTokenCharacterForCombat(sourceToken)
    const targetCharacter = resolveTokenCharacterForCombat(targetToken)
    const sourceName = sourceCharacter?.nome ?? sourceToken?.label ?? 'Origem'
    const targetName = targetCharacter?.nome ?? targetToken?.label ?? 'Alvo'
    const sourceCanCancel =
      (mark.cancelableBySource === true &&
        (mark.statusId === 'especial-buff' ||
          mark.statusId === 'especial-debuff')) ||
      mark.label === 'Analise Cirurgica'
    const statusDefinition = findTabletopStatusDefinition(
      mark.statusId ?? mark.label,
    )

    return {
      canCancel:
        viewMode === 'gm' ||
        Boolean(
          sourceCanCancel &&
          sourceToken &&
          canActivePlayerControlToken(sourceToken),
        ),
      color: statusDefinition?.color ?? mark.color,
      description:
        mark.description ||
        statusDefinition?.effect ||
        `${sourceName} aplicou ${mark.label} em ${targetName}.`,
      durationRounds: mark.durationRounds,
      icon: mark.icon ?? statusDefinition?.icon ?? (
        mark.label === 'Analise Cirurgica' ? 'science' : 'custom'
      ),
      id: mark.id,
      kind: mark.kind ?? 'mark',
      label: mark.label,
      sourceName,
      stacks: mark.stacks,
      statusId: mark.statusId ?? statusDefinition?.id,
      targetName,
    }
  }

  function handleOpenStatusGuide(statusId?: string) {
    const query = new URLSearchParams({
      audience: 'player',
      section: 'recursos',
    })

    if (statusId) {
      query.set('status', statusId)
    }

    navigate(`/livro?${query.toString()}`)
  }

  const effectsAppliedByActiveCharacter = activeToken
    ? activeCharacterEffects
        .filter((mark) => mark.sourceTokenId === activeToken.id)
        .map(buildCharacterSheetEffectView)
    : []
  const effectsAppliedToActiveCharacter = activeToken
    ? activeCharacterEffects
        .filter((mark) => mark.targetTokenId === activeToken.id)
        .map(buildCharacterSheetEffectView)
    : []

  function resolveTokenCharacterForCombat(token: TabletopToken | null | undefined) {
    if (!data || !token) {
      return null
    }

    const tokenCharacter = getCharacterById(data, token.characterId)

    if (!tokenCharacter) {
      return null
    }

    return token.resourceOverride
      ? {
          ...tokenCharacter,
          recursos: {
            ...tokenCharacter.recursos,
            ...token.resourceOverride,
          },
        }
      : tokenCharacter
  }

  const statusParticipants: TabletopStatusParticipant[] = visibleTokens
    .map((token) => {
      const character = resolveTokenCharacterForCombat(token)

      return {
        characterId: character?.id,
        id: token.id,
        label: token.label,
        name: character?.nome ?? token.label,
      }
    })
    .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))
  const statusParticipantIds = new Set(
    statusParticipants.map((participant) => participant.id),
  )
  const currentSceneStatusMarks = (session?.publicCombatMarks ?? []).filter(
    (mark) =>
      statusParticipantIds.has(mark.sourceTokenId) ||
      statusParticipantIds.has(mark.targetTokenId),
  )

  function handleApplyTabletopStatus(input: {
    cancelableBySource: boolean
    durationRounds?: number
    notes?: string
    sourceTokenId: string
    stacks: number
    statusId: TabletopStatusId
    targetTokenId: string
  }) {
    if (viewMode !== 'gm') {
      return
    }

    const definition = getTabletopStatusDefinition(input.statusId)
    const sourceToken =
      visibleTokens.find((token) => token.id === input.sourceTokenId) ?? null
    const targetToken =
      visibleTokens.find((token) => token.id === input.targetTokenId) ?? null

    if (!definition || !sourceToken || !targetToken) {
      setTableFeedbackMessage('Origem, alvo ou estado nao esta disponivel nesta cena.')
      return
    }

    const sourceCharacter = resolveTokenCharacterForCombat(sourceToken)
    const targetCharacter = resolveTokenCharacterForCombat(targetToken)
    const existingMarks = session?.publicCombatMarks ?? []
    const targetHasVaccine = existingMarks.some(
      (mark) =>
        mark.targetTokenId === targetToken.id &&
        mark.statusId === 'vacina',
    )

    if (targetHasVaccine && input.statusId !== 'vacina') {
      setTableFeedbackMessage(
        `${targetCharacter?.nome ?? targetToken.label} esta sob Vacina e nao recebe estados.`,
      )
      return
    }

    const nextMark: TabletopCombatMark = {
      cancelableBySource:
        input.cancelableBySource &&
        (definition.id === 'especial-buff' ||
          definition.id === 'especial-debuff'),
      color: definition.color,
      createdAt: Date.now(),
      description: definition.effect,
      durationRounds: input.durationRounds,
      icon: definition.icon,
      id: buildRuntimeEventId(`combat-status-${definition.id}`),
      kind: definition.kind,
      label: definition.label,
      notes: input.notes,
      sourceCharacterId: sourceCharacter?.id,
      sourceTokenId: sourceToken.id,
      stacks: Math.min(
        definition.rules.maxStacks ?? 99,
        Math.max(1, input.stacks),
      ),
      statusId: definition.id,
      targetCharacterId: targetCharacter?.id,
      targetTokenId: targetToken.id,
    }

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        publicCombatMarks: [
          ...currentSession.publicCombatMarks.filter((mark) => {
            if (mark.targetTokenId !== targetToken.id) {
              return true
            }

            if (
              mark.notes === 'automatic:frozen-stack' &&
              definition.id === 'congelado' &&
              input.stacks < (definition.rules.maxStacks ?? 3)
            ) {
              return false
            }

            if (definition.id === 'vacina' && mark.statusId) {
              return false
            }

            return !(
              mark.statusId === definition.id &&
              mark.sourceTokenId === sourceToken.id
            )
          }),
          nextMark,
        ],
      }),
    )
    setTableFeedbackMessage(
      `${definition.label} aplicado em ${targetCharacter?.nome ?? targetToken.label}.`,
    )
  }

  function handleRemoveTabletopStatus(markId: string) {
    if (viewMode !== 'gm') {
      return
    }

    const targetMark =
      session?.publicCombatMarks.find((mark) => mark.id === markId) ?? null

    if (targetMark?.statusId === 'congelado') {
      updateSession((currentSession) =>
        createPersistedTabletopSession({
          ...currentSession,
          publicCombatMarks: currentSession.publicCombatMarks.filter(
            (mark) =>
              mark.id !== markId &&
              !(
                mark.notes === 'automatic:frozen-stack' &&
                mark.targetTokenId === targetMark.targetTokenId
              ),
          ),
        }),
      )
      return
    }

    handleCancelCombatEffect(markId)
  }

  const combatTargetTokens = pendingCombatResolution
    ? visibleTokens.filter((token) => token.id !== pendingCombatResolution.attackerTokenId)
    : []
  const pendingCombatTargetToken =
    pendingCombatResolution?.targetTokenId
      ? visibleTokens.find((token) => token.id === pendingCombatResolution.targetTokenId) ?? null
      : null
  const pendingCombatAttackerToken = pendingCombatResolution
    ? visibleTokens.find((token) => token.id === pendingCombatResolution.attackerTokenId) ?? null
    : null
  const pendingCombatAttackerCharacter = resolveTokenCharacterForCombat(
    pendingCombatAttackerToken,
  )
  const pendingCombatTargetCharacter = resolveTokenCharacterForCombat(
    pendingCombatTargetToken,
  )
  const pendingCombatAttackerStatusDefinitions = pendingCombatAttackerToken
    ? (session?.publicCombatMarks ?? [])
        .filter((mark) => mark.targetTokenId === pendingCombatAttackerToken.id)
        .map((mark) => findTabletopStatusDefinition(mark.statusId ?? mark.label))
        .filter((definition) => Boolean(definition))
    : []
  const pendingCombatTargetStatusDefinitions = pendingCombatTargetToken
    ? (session?.publicCombatMarks ?? [])
        .filter((mark) => mark.targetTokenId === pendingCombatTargetToken.id)
        .map((mark) => findTabletopStatusDefinition(mark.statusId ?? mark.label))
        .filter((definition) => Boolean(definition))
    : []
  const pendingCombatDamageDicePenalty =
    pendingCombatAttackerStatusDefinitions.reduce(
      (total, definition) =>
        total + (definition?.rules.damageDicePenalty ?? 0),
      0,
    )
  const pendingCombatBaseDamageFormula = pendingCombatResolution
    ? pendingCombatResolution.isCritical
      ? getCriticalDamageFormula(
          pendingCombatResolution.baseDamageFormula,
          pendingCombatAttackerCharacter
            ? getCombatCriticalDamageBonus(pendingCombatAttackerCharacter)
            : 0,
        )
      : pendingCombatResolution.baseDamageFormula
    : ''
  const pendingCombatDamageFormula = applyDamageDicePenaltyToFormula(
    pendingCombatBaseDamageFormula,
    pendingCombatDamageDicePenalty,
  )
  const pendingCombatDamageRollConfig = pendingCombatDamageFormula
    ? parseDamageRollFormula(pendingCombatDamageFormula)
    : null
  const pendingCombatRawDamage = pendingCombatResolution
    ? sanitizeCombatDamage(pendingCombatResolution.rawDamage)
    : 0
  const pendingCombatSurgicalStatus =
    pendingCombatResolution?.targetTokenId && pendingCombatAttackerCharacter
      ? `combat:analise-cirurgica:${pendingCombatResolution.targetTokenId}`
      : ''
  const pendingCombatUsesSurgicalAnalysis = Boolean(
    pendingCombatSurgicalStatus &&
      pendingCombatAttackerCharacter?.status.includes(pendingCombatSurgicalStatus),
  )
  const pendingCombatDamageMultiplier = pendingCombatUsesSurgicalAnalysis ? 2 : 1
  const pendingCombatDamageBeforeTargetEffects = resolveCombatDamageSequence({
    buildModifier: pendingCombatResolution?.buildDamageBonus ?? 0,
    multiplier: pendingCombatDamageMultiplier,
    rolledDamage: pendingCombatRawDamage,
  })
  const pendingCombatGuardianPassiveKey =
    pendingCombatTargetToken && currentSceneId
      ? `${currentSceneId}:${pendingCombatTargetToken.id}:planicie-tank-casca-vigia`
      : ''
  const pendingCombatHasGuardianShell = Boolean(
    pendingCombatTargetCharacter &&
      getBuildItems(pendingCombatTargetCharacter.combatProfile?.build).some(
        (item) => item.catalogItemId === 'planicie-tank-casca-vigia',
      ),
  )
  const pendingCombatGuardianReduction =
    pendingCombatHasGuardianShell &&
    pendingCombatGuardianPassiveKey &&
    !consumedCombatPassives[pendingCombatGuardianPassiveKey] &&
    pendingCombatDamageBeforeTargetEffects.afterBuild > 0
      ? 1
      : 0
  const pendingCombatDamageSequence = resolveCombatDamageSequence({
    buildModifier: pendingCombatResolution?.buildDamageBonus ?? 0,
    multiplier: pendingCombatDamageMultiplier,
    reduction: pendingCombatGuardianReduction,
    rolledDamage: pendingCombatRawDamage,
  })
  const pendingCombatDamageBeforeDefense =
    pendingCombatDamageSequence.finalDamage
  const pendingCombatBlockValue = pendingCombatTargetCharacter
    ? getCombatBlockValue(pendingCombatTargetCharacter)
    : 0
  const pendingCombatDodgeValue = pendingCombatTargetCharacter
    ? getCombatDodgeValue(pendingCombatTargetCharacter)
    : null
  const pendingCombatCaPenetration = pendingCombatAttackerCharacter
    ? getCombatCaPenetration(pendingCombatAttackerCharacter)
    : 0
  const pendingCombatStatusCaBonus =
    pendingCombatTargetStatusDefinitions.reduce(
      (total, definition) =>
        total + (definition?.rules.armorClassBonus ?? 0),
      0,
    )
  const pendingCombatEffectiveCa = pendingCombatTargetCharacter
    ? Math.max(
        1,
        pendingCombatTargetCharacter.defesa +
          pendingCombatStatusCaBonus -
          pendingCombatCaPenetration,
      )
    : 0
  const pendingCombatTargetReactionUsed = Boolean(
    pendingCombatTargetToken && session?.turnState?.usedActions[pendingCombatTargetToken.id]?.reacao,
  )
  const pendingCombatVulnerabilityMultiplier =
    pendingCombatTargetStatusDefinitions.some(
      (definition) => definition?.rules.doublesIncomingDamage,
    )
      ? 2
      : 1
  const pendingCombatHitDamage = pendingCombatTargetCharacter
    ? pendingCombatDamageBeforeDefense * pendingCombatVulnerabilityMultiplier
    : 0
  const pendingCombatBlockedDamage = pendingCombatTargetCharacter
    ? applyCombatBlock(
        pendingCombatDamageBeforeDefense,
        pendingCombatBlockValue,
      ) * pendingCombatVulnerabilityMultiplier
    : 0
  const pendingCombatSuggestedDamage =
    pendingCombatResolution?.outcome === 'hit'
      ? pendingCombatHitDamage
      : pendingCombatResolution?.outcome === 'block'
        ? pendingCombatBlockedDamage
        : 0
  const pendingCombatFinalAmount =
    pendingCombatResolution?.outcome === 'hit' ||
    pendingCombatResolution?.outcome === 'block'
      ? sanitizeCombatDamage(
          pendingCombatResolution?.manualDamage ?? pendingCombatSuggestedDamage,
        )
      : 0
  const pendingCombatResolutionMode =
    pendingCombatResolution?.sourceFeatureResolution?.mode ?? 'damage'
  const pendingCombatFinalDamage =
    pendingCombatResolutionMode === 'heal' ? 0 : pendingCombatFinalAmount
  const pendingCombatEffectiveDamage = pendingCombatTargetCharacter
    ? Math.min(
        pendingCombatTargetCharacter.recursos.vidaAtual,
        pendingCombatFinalDamage,
      )
    : 0
  const pendingCombatHealingTargetToken =
    pendingCombatResolution?.healingTargetTokenId
      ? visibleTokens.find(
          (token) => token.id === pendingCombatResolution.healingTargetTokenId,
        ) ?? null
      : pendingCombatResolutionMode === 'heal'
        ? pendingCombatTargetToken
        : null
  const pendingCombatHealingTargetCharacter = resolveTokenCharacterForCombat(
    pendingCombatHealingTargetToken,
  )
  const pendingCombatHealingTargetTokens =
    pendingCombatAttackerToken && pendingCombatResolutionMode === 'drain-transfer'
      ? visibleTokens.filter(
          (token) =>
            Boolean(resolveTokenCharacterForCombat(token)) &&
            getTabletopDistanceSquares(
              pendingCombatAttackerToken.cell,
              token.cell,
            ) <= 6,
        )
      : visibleTokens.filter((token) =>
          Boolean(resolveTokenCharacterForCombat(token)),
        )
  const pendingCombatHealingAmount =
    pendingCombatResolutionMode === 'drain-transfer'
      ? pendingCombatEffectiveDamage
      : pendingCombatResolutionMode === 'heal'
        ? pendingCombatFinalAmount
        : 0
  const pendingCombatEffectiveHealing = pendingCombatHealingTargetCharacter
    ? Math.min(
        Math.max(
          0,
          pendingCombatHealingTargetCharacter.recursos.vidaMaxima -
            pendingCombatHealingTargetCharacter.recursos.vidaAtual,
        ),
        pendingCombatHealingAmount,
      )
    : 0
  const pendingCombatDefenseThreshold =
    pendingCombatResolution?.checkTarget === 'dt'
      ? pendingCombatResolution.checkDifficulty
      : pendingCombatResolution?.checkTarget === 'resistido'
        ? pendingCombatResolution.opposedRollTotal
        : pendingCombatEffectiveCa
  const pendingCombatCheckLabel =
    pendingCombatResolution?.checkTarget === 'dt'
      ? `DT ${pendingCombatResolution.checkDifficulty ?? '--'}`
      : pendingCombatResolution?.checkTarget === 'resistido'
        ? `Teste resistido${pendingCombatResolution.opposedSkill ? ` contra ${pendingCombatResolution.opposedSkill}` : ''}`
        : `CA efetiva ${pendingCombatEffectiveCa}`
  const pendingCombatDamageContextLabel =
    pendingCombatResolution?.damageContexts
      .map((context) =>
        context === 'ability'
          ? 'habilidade'
          : context === 'adjacent'
            ? 'adjacente'
            : context === 'ranged'
              ? 'distancia'
              : 'corpo a corpo',
      )
      .join(' + ') ?? ''
  const pendingCombatSuggestedOutcome: CombatResolutionOutcome | null =
    pendingCombatResolution &&
    pendingCombatTargetCharacter &&
    typeof pendingCombatResolution.rollTotal === 'number' &&
    typeof pendingCombatDefenseThreshold === 'number'
      ? pendingCombatResolution.checkTarget === 'resistido'
        ? pendingCombatResolution.rollTotal > pendingCombatDefenseThreshold
          ? 'hit'
          : 'miss'
        : pendingCombatResolution.rollTotal >= pendingCombatDefenseThreshold
        ? 'hit'
        : 'miss'
      : null
  const pendingCombatDefenseReady =
    pendingCombatResolution?.checkTarget !== 'resistido' ||
    typeof pendingCombatResolution.opposedRollTotal === 'number'
  const pendingCombatSuggestionLabel =
    pendingCombatResolution &&
    pendingCombatTargetCharacter &&
    typeof pendingCombatResolution.rollTotal === 'number' &&
    typeof pendingCombatDefenseThreshold === 'number'
      ? pendingCombatSuggestedOutcome === 'hit'
        ? `Provavel acerto: ${pendingCombatResolution.rollTotal} ${pendingCombatResolution.checkTarget === 'resistido' ? '>' : '>='} defesa ${pendingCombatDefenseThreshold}${pendingCombatResolution.checkTarget === 'ca' && pendingCombatCaPenetration ? ` (perfuracao ${pendingCombatCaPenetration})` : ''}.`
        : `Provavel erro: ${pendingCombatResolution.rollTotal} ${pendingCombatResolution.checkTarget === 'resistido' ? '<=' : '<'} defesa ${pendingCombatDefenseThreshold}${pendingCombatResolution.checkTarget === 'ca' && pendingCombatCaPenetration ? ` (perfuracao ${pendingCombatCaPenetration})` : ''}.`
      : ''
  const pendingCombatDodgeSucceeded =
    pendingCombatResolution &&
    typeof pendingCombatResolution.rollTotal === 'number' &&
    typeof pendingCombatDodgeValue === 'number'
      ? pendingCombatDodgeValue >= pendingCombatResolution.rollTotal
      : null
  const pendingCombatDodgeSuggestionLabel =
    pendingCombatResolution &&
    typeof pendingCombatResolution.rollTotal === 'number' &&
    typeof pendingCombatDodgeValue === 'number'
      ? pendingCombatDodgeSucceeded
        ? `Esquiva disponivel: ${pendingCombatDodgeValue} >= ataque ${pendingCombatResolution.rollTotal}.`
        : `Esquiva insuficiente: ${pendingCombatDodgeValue} < ataque ${pendingCombatResolution.rollTotal}.`
      : ''
  const pendingCombatLifeAfterHit = pendingCombatTargetCharacter
    ? Math.max(
        0,
        pendingCombatTargetCharacter.recursos.vidaAtual -
          (pendingCombatResolution?.outcome === 'hit'
            ? pendingCombatFinalDamage
            : pendingCombatHitDamage),
      )
    : 0
  const pendingCombatLifeAfterBlock = pendingCombatTargetCharacter
    ? Math.max(
        0,
        pendingCombatTargetCharacter.recursos.vidaAtual -
          (pendingCombatResolution?.outcome === 'block'
            ? pendingCombatFinalDamage
            : pendingCombatBlockedDamage),
      )
    : 0

  function createPendingCombatResolutionFromLogEntry(
    entry: TabletopLogEntry,
  ): PendingCombatResolution | null {
    const combat = entry.combat

    if (!combat || combat.kind !== 'attack' || !combat.attackerTokenId) {
      return null
    }

    const suggestedTarget =
      selectedTokens.find((token) => token.id !== combat.attackerTokenId) ?? null

    return {
      attackerCharacterId: combat.attackerCharacterId,
      attackerName: combat.attackerName,
      attackerTokenId: combat.attackerTokenId,
      attackName: combat.attackName,
      baseDamageFormula: combat.baseDamageFormula ?? combat.damageFormula,
      buildDamageBonus: combat.buildDamageBonus ?? 0,
      checkDifficulty: combat.checkDifficulty,
      checkTarget: combat.checkTarget ?? 'ca',
      costs: combat.costs ?? [],
      damageContexts: combat.damageContexts ?? [],
      damageFormula: combat.damageFormula,
      distanceMeters: combat.distanceMeters ?? null,
      distanceSquares: combat.distanceSquares ?? null,
      id: entry.id,
      isCritical: combat.isCritical ?? isCriticalAttackRoll(entry.roll),
      rawDamage: 0,
      rollText: combat.rollText ?? entry.roll?.resultadoTexto,
      rollTotal: combat.rollTotal ?? entry.roll?.total,
      opposedAttribute: combat.opposedAttribute,
      opposedSkill: combat.opposedSkill,
      sourceCell: combat.sourceCell,
      sourceFeatureId: combat.sourceFeatureId,
      sourceFeatureResolution: combat.sourceFeatureResolution,
      stage: 'defense',
      targetCell: combat.targetCell,
      targetTokenId:
        visibleTokens.find((token) => token.id === combat.targetTokenId)?.id ??
        suggestedTarget?.id ??
        '',
      turnActionId: combat.turnActionId,
    }
  }

  const activeFaction =
    data && activeCharacter
      ? data.factions.items.find((faction) => faction.id === activeCharacter.faccao) ??
        null
      : null
  const activeCharacterEditLock =
    activeCharacter && session?.characterEditLocks
      ? session.characterEditLocks[activeCharacter.id] ?? null
      : null
  const currentEditOwnerId =
    viewMode === 'gm'
      ? 'gm'
      : effectiveActiveAccessProfile?.id || `player:${focusedPlayerCharacter?.id ?? ''}`
  const activeCharacterEditBlocked = Boolean(
    activeCharacterEditLock &&
      activeCharacterEditLock.ownerId !== currentEditOwnerId &&
      activeCharacterEditLock.expiresAt > Date.now(),
  )
  const canEditActiveCharacter = Boolean(
    activeCharacter &&
      !activeCharacterEditBlocked &&
      (viewMode === 'gm' || (activeToken && canActivePlayerControlToken(activeToken))),
  )
  const canEditActiveToken = Boolean(
    activeToken &&
      (viewMode === 'gm' || canActivePlayerControlToken(activeToken)),
  )
  const sheetActionTokenId =
    primarySelectedTokenId || playerToken?.id || activeToken?.id || ''
  const rollBonusCharacter =
    viewMode === 'player'
      ? focusedPlayerCharacter
      : resolveTokenCharacterForCombat(
          tokens.find((token) => token.id === sheetActionTokenId) ?? activeToken,
        )
  const rollBonusOptions =
    rollBonusCharacter?.pericias
      .filter((skill) => skill.nome.trim())
      .map((skill) => {
        const bonus = getCharacterSkillRollBonus(rollBonusCharacter, skill.nome)

        return {
          bonus,
          id: skill.id,
          label: skill.nome,
        }
      })
      .filter((skill) => skill.bonus !== 0)
      .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR')) ?? []
  const boardPings = pings.map((ping) => ({
    id: ping.id,
    cell: ping.cell,
    label: ping.authorView === 'gm' ? 'M' : 'J',
  }))
  const activeSessionAuthorId =
    viewMode === 'gm' ? 'gm' : getPlayerProfileId(effectiveActiveAccessProfile)
  const activeSessionAuthorLabel = getSessionActorLabel(effectiveActiveAccessProfile)
  const activeSessionDiceColor = tabletopRollDraft.diceColor
  const activeSharedMeasurement =
    session?.activeMeasurement?.sceneId === boardSceneId
      ? {
          start: session.activeMeasurement.start,
          end: session.activeMeasurement.end,
          color: session.activeMeasurement.visualColor,
          label:
            session.activeMeasurement.authorLabel ??
            (session.activeMeasurement.authorView === 'gm' ? 'M' : 'J'),
        }
      : null
  const currentCombatPreview =
    localCombatPreview?.sceneId === currentSceneId
      ? localCombatPreview
      : session?.publicCombatPreview ?? null
  const activeCombatPreview =
    currentCombatPreview?.sceneId === currentSceneId &&
    currentCombatPreview.expiresAt > Date.now() &&
    currentCombatPreview.id !== dismissedCombatPreviewId
      ? currentCombatPreview
      : null

  const expireCombatPreviewFromEffect = useEffectEvent((previewId: string) => {
    setLocalCombatPreview((preview) =>
      preview?.id === previewId ? null : preview,
    )

    if (viewMode === 'gm' && session?.publicCombatPreview?.id === previewId) {
      updateSession((currentSession) =>
        createPersistedTabletopSession({
          ...currentSession,
          publicCombatPreview: null,
        }),
      )
    }
  })

  useEffect(() => {
    if (!currentCombatPreview) return

    const delay = Math.max(0, currentCombatPreview.expiresAt - Date.now())
    const timeoutId = window.setTimeout(
      () => expireCombatPreviewFromEffect(currentCombatPreview.id),
      delay + 20,
    )

    return () => window.clearTimeout(timeoutId)
  }, [currentCombatPreview])

  const npcLibraryCharacters = useMemo(
    () =>
      data
        ? data.characters.items.filter(
            (character) => character.tipo === 'npc' || character.tipo === 'mob',
          )
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
  useEffect(() => {
    const broadcastEvents = session?.broadcastEvents ?? []

    if (viewMode !== 'player' || broadcastEvents.length === 0) {
      return
    }

    const lastProcessedIndex = lastProcessedBroadcastEventIdRef.current
      ? broadcastEvents.findIndex(
          (event) => event.id === lastProcessedBroadcastEventIdRef.current,
        )
      : -1
    const pendingEvents = broadcastEvents
      .slice(lastProcessedIndex + 1)
      .filter((event) => event.createdAt >= tableMountedAtRef.current - 1000)

    if (pendingEvents.length === 0) {
      return
    }

    lastProcessedBroadcastEventIdRef.current = pendingEvents[pendingEvents.length - 1].id

    queueMicrotask(() => {
      pendingEvents.forEach((broadcastEvent) => {
        switch (broadcastEvent.type) {
          case 'audio':
            if (broadcastEvent.musicVolume !== undefined) {
              setMusicVolume(sanitizeAudioVolume(broadcastEvent.musicVolume))
            }

            if (broadcastEvent.ambienceVolume !== undefined) {
              setAmbienceVolume(sanitizeAudioVolume(broadcastEvent.ambienceVolume))
            }

            setAudioTransportState(broadcastEvent.audioTransportState ?? 'stopped')
            break
          case 'mixer-audio': {
            const mixerTrackId = broadcastEvent.mixerTrackId ?? ''
            const mixerAction = broadcastEvent.mixerAction
            const mixerTrack =
              audioLibraryTracks.find((track) => track.id === mixerTrackId) ?? null

            if (!mixerTrackId || !mixerAction) {
              break
            }

            if (mixerAction === 'play' && mixerTrack) {
              void playMixerTrackFromEffect(mixerTrack, {
                broadcast: false,
                persistGlobal: false,
                time: broadcastEvent.mixerTime,
                volume: broadcastEvent.mixerVolume,
              })
            } else if (mixerAction === 'pause') {
              pauseMixerTrackFromEffect(mixerTrackId, false, false)
            } else if (mixerAction === 'stop') {
              stopMixerTrackFromEffect(mixerTrackId, false, false)
            } else if (mixerAction === 'seek') {
              seekMixerTrackFromEffect(
                mixerTrackId,
                broadcastEvent.mixerTime ?? 0,
                false,
                false,
              )
            } else if (mixerAction === 'volume') {
              setMixerTrackVolumeFromEffect(
                mixerTrackId,
                broadcastEvent.mixerVolume ?? DEFAULT_MIXER_TRACK_VOLUME,
                false,
                false,
              )
            }
            break
          }
          case 'cinematic':
            if (broadcastEvent.cinematicId) {
              setCinematicOverlayState((currentState) => ({
                cinematicId: broadcastEvent.cinematicId ?? '',
                triggerId: (currentState?.triggerId ?? 0) + 1,
              }))
            }
            break
          case 'vfx': {
            if (broadcastEvent.vfxAction === 'clear') {
              clearVfxPresentation()
              break
            }

            const vfxPreset = broadcastEvent.vfxPresetId
              ? getTabletopVfxPreset(broadcastEvent.vfxPresetId)
              : null

            if (vfxPreset) {
              showVfxPresentation(
                vfxPreset,
                broadcastEvent.vfxTargetTokenId,
              )
            }
            break
          }
          case 'image-preview':
            if (broadcastEvent.src) {
              setImagePreviewState({
                id: broadcastEvent.id,
                src: broadcastEvent.src,
                label: broadcastEvent.label ?? 'Imagem',
                createdAt: broadcastEvent.createdAt,
              })
            }
            break
          case 'image-preview-close':
            setImagePreviewState(null)
            break
          case 'intro':
            if (broadcastEvent.introCardId) {
              setIntroOverlayState((currentState) => ({
                sceneId: broadcastEvent.sceneId ?? currentSceneId,
                introCardId: broadcastEvent.introCardId ?? '',
                triggerId: (currentState?.triggerId ?? 0) + 1,
              }))
            }
            break
          case 'transition':
            if (broadcastEvent.transitionId) {
              setTransitionOverlayState((currentState) => ({
                transitionId: broadcastEvent.transitionId ?? '',
                triggerId: (currentState?.triggerId ?? 0) + 1,
              }))
            }
            break
          case 'transition-close':
            setTransitionOverlayState(null)
            closeSharedTransitionPlaybackState()
            break
          case 'transition-playback':
            if (
              !applySharedTransitionPlaybackState(broadcastEvent.playbackState ?? null)
            ) {
              break
            }
            if (broadcastEvent.playbackState?.activeTransitionId) {
              setTransitionOverlayState((currentState) =>
                currentState?.transitionId === broadcastEvent.playbackState?.activeTransitionId
                  ? currentState
                  : {
                      transitionId: broadcastEvent.playbackState?.activeTransitionId ?? '',
                      triggerId: (currentState?.triggerId ?? 0) + 1,
                    },
              )
            }
            break
        }
      })
    })
  }, [audioLibraryTracks, currentSceneId, session?.broadcastEvents, viewMode])

  useLayoutEffect(() => {
    const characters = data?.characters.items ?? []

    if (!data) {
      characterStageSnapshotsRef.current = {}
      return
    }

    const nextSnapshots: typeof characterStageSnapshotsRef.current = {}
    const discoveredTransitions: Record<
      string,
      TabletopCharacterStageTransition
    > = {}

    characters.forEach((character) => {
      const stageState = character.stageState

      if (!stageState) {
        return
      }

      const currentSnapshot = {
        activeStageId: stageState.activeStageId,
        avatarUrl: character.avatarUrl,
        revision: stageState.revision,
        tokenImageUrl: character.tokenImageUrl,
      }
      const previousSnapshot = characterStageSnapshotsRef.current[character.id]

      if (
        previousSnapshot &&
        (previousSnapshot.activeStageId !== currentSnapshot.activeStageId ||
          previousSnapshot.revision !== currentSnapshot.revision)
      ) {
        discoveredTransitions[character.id] = {
          id: `${character.id}:${currentSnapshot.revision}:${currentSnapshot.activeStageId}`,
          previousPortraitUrl: previousSnapshot.avatarUrl,
          previousTokenImageUrl: previousSnapshot.tokenImageUrl,
        }
      }

      nextSnapshots[character.id] = currentSnapshot
    })

    characterStageSnapshotsRef.current = nextSnapshots

    if (Object.keys(discoveredTransitions).length === 0) {
      return
    }

    setCharacterStageTransitions((currentTransitions) => ({
      ...currentTransitions,
      ...discoveredTransitions,
    }))

    Object.entries(discoveredTransitions).forEach(([characterId, transition]) => {
      window.setTimeout(() => {
        setCharacterStageTransitions((currentTransitions) => {
          if (currentTransitions[characterId]?.id !== transition.id) {
            return currentTransitions
          }

          const nextTransitions = { ...currentTransitions }
          delete nextTransitions[characterId]
          return nextTransitions
        })
      }, 1600)
    })
  }, [data])

  const tokenViews = data
    ? visibleTokens
        .map((token) => {
          const character = getCharacterById(data, token.characterId)
          const tokenImage = resolveTokenImage(token, {
            characters: data.characters.items,
            playerProfiles: accessState.profiles,
            worldMundiState,
          })
          const displayCharacter = character ?? tokenImage?.character ?? null
          const persistentBody = getPersistentBodyForToken(token)
          const persistentControllerIds = getWorldMundiBodyControllerIds(persistentBody)
          const persistentControllerProfiles = persistentControllerIds
            .map(
              (playerId) =>
                accessState.profiles.find((profile) => profile.id === playerId) ?? null,
            )
            .filter((profile): profile is FushiAccessProfile => Boolean(profile))
          const persistentControllerLabel =
            persistentControllerProfiles.length > 0
              ? persistentControllerProfiles.map((profile) => profile.label).join(', ')
              : persistentControllerIds.map(getShortPlayerLabel).join('/')
          const persistentShortLabel =
            persistentControllerIds.length > 0
              ? persistentControllerIds.map(getShortPlayerLabel).join('/')
              : ''
          const ownerPlayerId =
            [
              token.controladoPorJogadorId,
              token.persistentControl?.playerId,
              token.control?.primaryControllerId,
              ...(token.control?.controlledByPlayerIds ?? []),
              ...persistentControllerIds,
            ]
              .map(inferIdentityResourceProfileId)
              .find(Boolean) ??
            inferIdentityResourceProfileId(persistentShortLabel || token.label)
          const isStealthed = token.stealth?.enabled === true
          const borderColor = isStealthed
            ? getPlayerTokenStealthAccent(ownerPlayerId)
            : getPlayerTokenAccent(ownerPlayerId)
          const now = Date.now()
          const combatImpact = session?.publicCombatImpacts
            .filter((impact) => impact.tokenId === token.id && impact.expiresAt > now)
            .at(-1)
          const combatMarks = (session?.publicCombatMarks ?? [])
            .filter((mark) => mark.targetTokenId === token.id)
            .sort((first, second) => first.createdAt - second.createdAt)
          const deathState = session?.playerDeathStates[token.id]

          if (!displayCharacter && !tokenImage) {
            return null
          }

          return {
            id: token.id,
            label: persistentShortLabel || token.label,
            name: persistentBody
              ? `${persistentControllerLabel || token.label} / ${displayCharacter?.nome ?? token.label}`
              : displayCharacter?.nome ?? token.label,
            color: token.color,
            borderColor,
            portraitUrl: resolveTabletopRuntimeAssetUrl(
              tokenImage?.avatarUrl,
              remoteAssetBaseUrl,
            ),
            tokenImageUrl: resolveTabletopRuntimeAssetUrl(
              tokenImage?.tokenImageUrl,
              remoteAssetBaseUrl,
            ),
            cell: token.cell,
            size: token.size,
            customSize: token.customSize,
            visibility: token.visibility,
            isSelected: selectedTokenIds.includes(token.id),
            isPrimarySelected: token.id === primarySelectedTokenId,
            isControllable: canActivePlayerControlToken(token),
            isMovable: canActivePlayerMoveTokens(),
            isStealthed,
            combatImpact,
            combatMarks,
            deathState,
            stageTransition: displayCharacter
              ? characterStageTransitions[displayCharacter.id]
              : undefined,
          }
        })
        .filter((token): token is NonNullable<typeof token> => Boolean(token))
    : []
  const playerTokenLifeSnapshot = visibleTokens
    .filter((token) => getTokenPlayerIds(token).length > 0)
    .map((token) => ({
      life: resolveTokenCharacterForCombat(token)?.recursos.vidaAtual ?? 0,
      tokenId: token.id,
    }))
  const playerTokenLifeSignature = playerTokenLifeSnapshot
    .map((entry) => `${entry.tokenId}:${entry.life}`)
    .join('|')
  const visibleTokenResourceSnapshot = visibleTokens
    .map((token) => {
      const character = resolveTokenCharacterForCombat(token)

      return character
        ? {
            determination: character.recursos.determinacaoAtual,
            fushi: character.recursos.fushiAtual,
            life: character.recursos.vidaAtual,
            tokenId: token.id,
          }
        : null
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  const visibleTokenResourceSignature = visibleTokenResourceSnapshot
    .map(
      (entry) =>
        `${entry.tokenId}:${entry.life}:${entry.fushi}:${entry.determination}`,
    )
    .join('|')

  useEffect(() => {
    if (viewMode !== 'gm') {
      return
    }

    const currentLifeEntries = playerTokenLifeSignature
      .split('|')
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.lastIndexOf(':')

        return {
          life: Number(entry.slice(separatorIndex + 1)),
          tokenId: entry.slice(0, separatorIndex),
        }
      })

    updateSession((currentSession) => {
      const nextDeathStates = { ...currentSession.playerDeathStates }
      let changed = false

      currentLifeEntries.forEach(({ life, tokenId }) => {
        const currentState = nextDeathStates[tokenId]

        if (life <= 0 && !currentState) {
          nextDeathStates[tokenId] = {
            failures: 0,
            results: [null, null, null],
            status: 'down',
            successes: 0,
            tokenId,
            updatedAt: Date.now(),
          }
          changed = true
        } else if (life >= 2 && currentState) {
          delete nextDeathStates[tokenId]
          changed = true
        }
      })

      return changed
        ? createPersistedTabletopSession({
            ...currentSession,
            playerDeathStates: nextDeathStates,
          })
        : currentSession
    })
    // updateSession is intentionally excluded: this reconciliation is keyed by life changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerTokenLifeSignature, viewMode])

  useEffect(() => {
    if (viewMode !== 'gm') {
      return
    }

    const automaticStatusByResource = [
      {
        active: (
          entry: (typeof visibleTokenResourceSnapshot)[number],
          existing: TabletopCombatMark | undefined,
        ) => entry.life <= 0 || Boolean(existing && entry.life < 2),
        id: 'desmaiado' as const,
      },
      {
        active: (entry: (typeof visibleTokenResourceSnapshot)[number]) =>
          entry.fushi <= 0,
        id: 'exausto' as const,
      },
      {
        active: (entry: (typeof visibleTokenResourceSnapshot)[number]) =>
          entry.determination <= 0,
        id: 'descontrolado' as const,
      },
    ]

    updateSession((currentSession) => {
      const currentMarks = currentSession.publicCombatMarks
      const nextMarks = currentMarks.filter(
        (mark) => mark.notes !== 'automatic:zero-resource',
      )

      visibleTokenResourceSnapshot.forEach((entry) => {
        automaticStatusByResource.forEach((automaticStatus) => {
          const definition = getTabletopStatusDefinition(automaticStatus.id)

          if (!definition) {
            return
          }

          const existingMark = currentMarks.find(
            (mark) =>
              mark.notes === 'automatic:zero-resource' &&
              mark.statusId === definition.id &&
              mark.targetTokenId === entry.tokenId,
          )

          if (!automaticStatus.active(entry, existingMark)) {
            return
          }

          nextMarks.push(
            existingMark ?? {
              cancelableBySource: false,
              color: definition.color,
              createdAt: Date.now(),
              description: definition.effect,
              icon: definition.icon,
              id: `automatic-resource-${definition.id}-${entry.tokenId}`,
              kind: definition.kind,
              label: definition.label,
              notes: 'automatic:zero-resource',
              sourceTokenId: entry.tokenId,
              statusId: definition.id,
              targetTokenId: entry.tokenId,
            },
          )
        })
      })

      const unchanged =
        nextMarks.length === currentMarks.length &&
        nextMarks.every((mark, index) => mark === currentMarks[index])

      return unchanged
        ? currentSession
        : createPersistedTabletopSession({
            ...currentSession,
            publicCombatMarks: nextMarks,
          })
    })
    // Resource changes are the only trigger; session writes must not loop this reconciliation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTokenResourceSignature, viewMode])

  const activeAbilityImpact =
    session?.publicCombatImpacts
      .filter(
        (impact) =>
          impact.expiresAt > Date.now() &&
          (impact.type === 'ability-success' ||
            impact.type === 'ability-failure'),
      )
      .at(-1) ?? null
  const activeAbilityImpactToken = activeAbilityImpact
    ? visibleTokens.find((token) => token.id === activeAbilityImpact.tokenId) ?? null
    : null
  const activeAbilityImpactMap = boardMap ?? data?.tabletop.map ?? null
  const activeAbilityImpactStyle =
    activeAbilityImpactToken && activeAbilityImpactMap
      ? ({
          '--ability-origin-x': `${
            ((activeAbilityImpactToken.cell.column + 0.5) /
              activeAbilityImpactMap.gridColumns) *
            100
          }%`,
          '--ability-origin-y': `${
            ((activeAbilityImpactToken.cell.row + 0.5) /
              activeAbilityImpactMap.gridRows) *
            100
          }%`,
        } as CSSProperties)
      : undefined
  const activeVfxPreset = activeVfxPresentation
    ? getTabletopVfxPreset(activeVfxPresentation.presetId)
    : null

  const objectViews = sceneObjects
    .filter((object) => viewMode === 'gm' || object.visibility === 'public')
    .map((object) => ({
      id: object.id,
      name: object.name,
      label: object.label,
      description: object.description,
      assetUrl: resolveTabletopRuntimeAssetUrl(object.assetUrl, remoteAssetBaseUrl),
      color: object.color,
      linkedItemId: object.linkedItemId,
      modelUrl: resolveTabletopRuntimeAssetUrl(object.modelUrl, remoteAssetBaseUrl),
      modelNodeName: object.modelNodeName,
      objectType: object.objectType,
      renderMode: object.renderMode,
      cell: object.cell,
      size: object.size,
      customSize: object.customSize,
      placement3d: object.placement3d,
      visibility: object.visibility,
      isSelected: object.id === selectedObjectId,
      isControllable: viewMode === 'gm',
    }))
  const tabletopReadinessAssets: TabletopReadinessAsset[] = (() => {
    const assets: TabletopReadinessAsset[] = []

    function addAsset(input: {
      id: string
      kind?: TabletopReadinessAsset['kind']
      label: string
      required?: boolean
      url?: string | null
    }) {
      const url = input.url?.trim()

      if (!url) {
        return
      }

      assets.push({
        id: input.id,
        kind: input.kind,
        label: input.label,
        required: input.required,
        url,
      })
    }

    const primaryMapAssetUrl = resolveRuntimeAssetVariantUrl(boardMap?.image, {
      kind: 'tabletop-map',
      visualQuality,
    })

    addAsset({
      id: `map:${boardMap?.id ?? 'fallback'}`,
      kind: 'image',
      label: 'Mapa atual',
      required: true,
      url: primaryMapAssetUrl,
    })

    if (
      boardMap?.animatedSurface?.enabled !== false &&
      boardMap?.animatedSurface?.source &&
      visualQuality !== 'low' &&
      (boardMap.animatedSurface.minQuality !== 'ultra' || visualQuality === 'ultra')
    ) {
      addAsset({
        id: `map-video:${boardMap.id}`,
        kind: 'media',
        label: 'Superficie animada do mapa',
        required: false,
        url: boardMap.animatedSurface.source,
      })
    }

    const alternateMapAssetUrl = resolveRuntimeAssetVariantUrl(boardMap?.imageUrl, {
        kind: 'tabletop-map',
        visualQuality,
    })

    if (boardMap?.imageUrl && alternateMapAssetUrl !== primaryMapAssetUrl) {
      addAsset({
        id: `map-image-url:${boardMap.id}`,
        kind: 'image',
        label: 'Imagem alternativa do mapa',
        url: alternateMapAssetUrl,
      })
    }

    tokenViews.forEach((token) => {
      addAsset({
        id: `token:${token.id}:token`,
        kind: 'image',
        label: 'Token visivel',
        url: token.tokenImageUrl,
      })
      addAsset({
        id: `token:${token.id}:portrait`,
        kind: 'image',
        label: 'Retrato de token',
        url: token.portraitUrl,
      })
    })

    objectViews.forEach((object) => {
      addAsset({
        id: `object:${object.id}:asset`,
        kind: 'image',
        label: object.renderMode === 'three' ? 'Preview de objeto 3D' : 'Objeto de cena',
        url: object.assetUrl,
      })
      addAsset({
        id: `object:${object.id}:model`,
        kind: 'model',
        label: 'Modelo 3D da cena',
        url: object.modelUrl,
      })
    })

    addAsset({
      id: `scene-audio:${activeSceneAudio.music?.id ?? 'music'}`,
      kind: 'media',
      label: 'MSC da cena',
      required: audioTransportState === 'playing',
      url: activeSceneAudio.music?.source,
    })
    addAsset({
      id: `scene-ambience:${activeSceneAudio.ambience?.id ?? 'ambience'}`,
      kind: 'media',
      label: 'Ambiencia da cena',
      required: audioTransportState === 'playing',
      url: activeSceneAudio.ambience?.source,
    })

    audioLibraryTracks.forEach((track) => {
      const trackState =
        mixerTracks[track.id] ?? session?.audioMixerState.tracks[track.id] ?? null

      if (trackState?.status !== 'playing') {
        return
      }

      addAsset({
        id: `mixer:${track.id}`,
        kind: 'media',
        label: 'MSC global ativa',
        required: true,
        url: track.source,
      })
    })

    return assets
  })()
  const tabletopReadinessKey = [
    viewMode,
    isRemotePlayerSession ? 'remote' : 'local',
    boardSceneId,
    boardMap?.id ?? '',
    visualQuality,
  ].join(':')
  const tabletopReadiness = useTabletopReadiness({
    assets: tabletopReadinessAssets,
    enabled: Boolean(data && boardMap && hasBoardScene),
    key: tabletopReadinessKey,
  })

  useEffect(() => {
    if (!tabletopReadiness.isReady) {
      return
    }

    const preloadTimer = window.setTimeout(() => {
      deferredTabletopModules.forEach((loadModule) => {
        void loadModule()
      })
    }, 300)

    return () => window.clearTimeout(preloadTimer)
  }, [tabletopReadiness.isReady])

  const tabletopReadinessContextKey = [
    activeCampaignId,
    viewMode,
    isRemotePlayerSession ? 'remote' : 'local',
  ].join(':')
  const initialTabletopReadinessRef = useRef({
    contextKey: '',
    sceneKey: '',
  })

  if (initialTabletopReadinessRef.current.contextKey !== tabletopReadinessContextKey) {
    initialTabletopReadinessRef.current = {
      contextKey: tabletopReadinessContextKey,
      sceneKey: '',
    }
  }

  if (
    !initialTabletopReadinessRef.current.sceneKey &&
    data &&
    boardMap &&
    hasBoardScene
  ) {
    initialTabletopReadinessRef.current.sceneKey = tabletopReadinessKey
  }

  const shouldBlockForTabletopReadiness =
    !tabletopReadiness.isReady &&
    initialTabletopReadinessRef.current.sceneKey === tabletopReadinessKey &&
    !activeTransitionOverlay
  const turnState = session?.turnState ?? null

  function buildTurnParticipantFromToken(token: TabletopToken): TabletopTurnParticipant {
    const tokenImage = data
      ? resolveTokenImage(token, {
          characters: data.characters.items,
          playerProfiles: accessState.profiles,
          worldMundiState,
        })
      : null
    const character = data ? getCharacterById(data, token.characterId) : null
    const imageUrl = resolveTabletopRuntimeAssetUrl(
      tokenImage?.tokenImageUrl ?? tokenImage?.avatarUrl,
      remoteAssetBaseUrl,
    )
    const name = character?.nome ?? tokenImage?.character?.nome ?? token.label

    return {
      characterId: token.characterId,
      color: token.color,
      id: token.id,
      imageUrl: imageUrl || undefined,
      label: token.label,
      name,
      tokenId: token.id,
      tokenKind: token.tokenKind,
    }
  }

  const turnParticipantViews: TabletopTurnParticipantView[] =
    turnState?.participants
      .reduce<TabletopTurnParticipantView[]>((participantViews, participant, _index, participants) => {
        const token =
          (viewMode === 'gm' ? tokens : visibleTokens).find(
            (entry) => entry.id === participant.tokenId,
          ) ?? null

        if (!token) {
          return participantViews
        }

        const nextIndex = participants.findIndex(
          (entry) => entry.id === turnState.activeParticipantId,
        )
        const followingParticipant =
          nextIndex >= 0 ? participants[(nextIndex + 1) % participants.length] : null
        const participantCharacter = data
          ? getCharacterById(data, participant.characterId)
          : null
        const participantInventorySummary = participantCharacter
          ? getInventoryCapacitySummary(participantCharacter)
          : null

        participantViews.push({
          characterId: participant.characterId,
          color: participant.color || token.color,
          id: participant.id,
          imageUrl: participant.imageUrl,
          isActive: participant.id === turnState.activeParticipantId,
          isNext: participant.id === followingParticipant?.id,
          label: participant.label || token.label,
          movementLabel: participantInventorySummary
            ? formatInventoryMovement(participantInventorySummary)
            : undefined,
          name: participant.name || token.label,
          tokenId: participant.tokenId,
        })

        return participantViews
      }, []) ?? []
  const activeTurnParticipantView =
    turnParticipantViews.find((participant) => participant.isActive) ?? null
  const activeTurnToken = activeTurnParticipantView
    ? (viewMode === 'gm' ? tokens : visibleTokens).find(
        (token) => token.id === activeTurnParticipantView.tokenId,
      ) ?? null
    : null
  const activeTurnCharacter =
    viewMode === 'player'
      ? activeTurnParticipantView?.characterId === focusedPlayerCharacter?.id
        ? focusedPlayerCharacter
        : null
      : resolveTokenCharacterForCombat(activeTurnToken)
  const canControlActiveTurnParticipant =
    viewMode === 'gm' ||
    Boolean(
      activeTurnParticipantView &&
        focusedPlayerCharacter &&
        activeTurnParticipantView.characterId === focusedPlayerCharacter.id &&
        activeTurnToken &&
        canActivePlayerControlToken(activeTurnToken),
    )
  const activeTurnFeatureActions: TabletopTurnFeatureAction[] = activeTurnCharacter
    ? [
        ...(activeTurnCharacter.habilidadesDetalhadas ?? []).map((feature) => ({
          feature,
          id: `habilidade:${feature.id}`,
          label: feature.nome,
          source: 'habilidade' as const,
        })),
        ...(activeTurnCharacter.rituais ?? []).map((feature) => ({
          feature,
          id: `ritual:${feature.id}`,
          label: feature.nome,
          source: 'ritual' as const,
        })),
        ...activeTurnCharacter.ataques.map((attack) => ({
          feature: {
            automation: attack.automation,
            descricao: attack.resumo,
            id: attack.id,
            nome: attack.nome,
            tipo: 'ataque' as const,
          },
          id: `ataque:${attack.id}`,
          label: attack.nome,
          source: 'ataque' as const,
        })),
      ].map((entry) => {
        const timing =
          resolveCombatAction(entry.feature).action === 'principal'
            ? 'padrao'
            : resolveCombatAction(entry.feature).action === 'curta'
              ? 'bonus'
              : resolveCombatAction(entry.feature).action === 'movimento'
                ? 'movimento'
                : resolveCombatAction(entry.feature).action === 'reacao'
                  ? 'reacao'
                  : 'padrao'
        const costs = entry.feature.automation?.costs ?? []

        return {
          ...entry,
          disabled: !entry.feature.automation || !canPayCharacterActionCosts(activeTurnCharacter, costs).ok,
          reason: !entry.feature.automation
            ? 'Esta acao ainda nao tem automacao.'
            : !canPayCharacterActionCosts(activeTurnCharacter, costs).ok
              ? 'Recurso insuficiente na ficha.'
              : undefined,
          timing,
        }
      })
    : []
  const pendingTurnActionRequests: TabletopTurnActionRequest[] =
    viewMode === 'gm'
      ? logEntries
          .map((entry) => entry.turnRequest)
          .filter(
            (request): request is TabletopTurnActionRequest =>
              Boolean(request && request.status === 'pending'),
          )
      : []
  const turnCandidates: TabletopTurnCandidate[] = tokens.map((token) => {
    const participant = buildTurnParticipantFromToken(token)

    return {
      color: participant.color,
      id: token.id,
      imageUrl: participant.imageUrl,
      isHidden: token.visibility === 'gm',
      isSelected: turnDraftTokenIds.includes(token.id),
      isStealthed: token.stealth?.enabled === true,
      label: participant.label,
      name: participant.name,
    }
  })
  useEffect(() => {
    const hasPersistentPlayerBody = occupiedPlayerBodies.some(
      (body) => getWorldMundiBodyControllerIds(body).length > 0 && body.npcOriginalId,
    )

    if (
      isRemotePlayerMode ||
      !session ||
      !currentScene ||
      !activeMap ||
      playerCharacters.length === 0 ||
      hasPersistentPlayerBody
    ) {
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
    isRemotePlayerMode,
    occupiedPlayerBodies,
    removedCharacterIdsByScene,
    playerCharacters,
    session,
  ])

  useEffect(() => {
    if (
      isRemotePlayerMode ||
      !session ||
      !currentScene ||
      !activeMap ||
      !data
    ) {
      return
    }

    const bodiesForScene = occupiedPlayerBodies.filter(
      (body) =>
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
    currentScene,
    currentSceneId,
    data,
    isRemotePlayerMode,
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

    const nextCameraTarget = getSceneCameraTarget({
      viewport,
      scene: currentScene,
      cameraRuntime: sceneRuntime.camera,
    })
    let frameId = 0
    let lastFrameTime = window.performance.now()

    const animateTowardsMaster = (now: number) => {
      const deltaSeconds = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000))
      lastFrameTime = now
      const deltaLeft = nextCameraTarget.scrollLeft - viewport.scrollLeft
      const deltaTop = nextCameraTarget.scrollTop - viewport.scrollTop

      if (
        Math.abs(deltaLeft) <= REMOTE_2D_CAMERA_SNAP_PX &&
        Math.abs(deltaTop) <= REMOTE_2D_CAMERA_SNAP_PX
      ) {
        viewport.scrollLeft = nextCameraTarget.scrollLeft
        viewport.scrollTop = nextCameraTarget.scrollTop
        return
      }

      const smoothing =
        1 - Math.exp(-deltaSeconds * REMOTE_2D_CAMERA_SMOOTHING_SPEED)
      viewport.scrollLeft += deltaLeft * smoothing
      viewport.scrollTop += deltaTop * smoothing
      frameId = window.requestAnimationFrame(animateTowardsMaster)
    }

    frameId = window.requestAnimationFrame(animateTowardsMaster)

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [
    currentScene,
    currentScene?.cameraState?.scrollLeft,
    currentScene?.cameraState?.scrollTop,
    currentScene?.cameraState?.zoom,
    effectiveZoom,
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
      setSelectedObjectId('')
      setObjectMoveTargetId('')
      setObjectPlacementPresetId('')
      setIsMeasureToolActive(false)
      setIntroOverlayState(null)
      setTransitionOverlayState(null)
      setCinematicOverlayState(null)
      setIsLightingEditMode(false)
      setSelectedSceneLightId('')
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const recoverBoardRendering = useCallback(
    (origin: 'automatic' | 'manual') => {
      const mapId = boardMap?.id ?? currentSceneId ?? 'tabletop-map'
      const now = Date.now()
      const recoveryState = boardAutoRecoveryRef.current

      if (
        recoveryState.mapId !== mapId ||
        now - recoveryState.startedAt > 20000
      ) {
        boardAutoRecoveryRef.current = {
          attempts: 0,
          mapId,
          startedAt: now,
        }
      }

      if (
        origin === 'automatic' &&
        boardAutoRecoveryRef.current.attempts >= 2
      ) {
        setTableFeedbackMessage(
          'A mesa ainda nao respondeu. Use Ctrl+A para forcar uma recuperacao completa.',
        )
        return
      }

      boardAutoRecoveryRef.current.attempts += 1

      if (origin === 'manual') {
        boardManualRecoveryRef.current = {
          hardRecoveryStarted: false,
          requestedAt: now,
        }
      }

      if (boardRecoveryTimerRef.current !== null) {
        window.clearTimeout(boardRecoveryTimerRef.current)
      }

      setIsBoardArtworkSuspended(true)
      setTableFeedbackMessage(
        origin === 'manual'
          ? 'Recuperando a renderizacao da mesa...'
          : 'Renderizacao incompleta detectada. Recuperando a mesa...',
      )

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          boardRecoveryTimerRef.current = window.setTimeout(() => {
            setBoardRenderEpoch((currentEpoch) => currentEpoch + 1)
            setIsBoardArtworkSuspended(false)
            setTableFeedbackMessage(
              'Mesa renderizada novamente. Estado da sessao preservado.',
            )
            boardRecoveryTimerRef.current = null
          }, 180)
        })
      })
    },
    [boardMap?.id, currentSceneId],
  )

  const hardRecoverBoardRenderer = useCallback(() => {
    if (boardManualRecoveryRef.current.hardRecoveryStarted) {
      return
    }

    boardManualRecoveryRef.current.hardRecoveryStarted = true
    setTableFeedbackMessage(
      'A imagem continuou branca. Recuperando o renderizador completo...',
    )
    window.sessionStorage.setItem(
      'fushi-tabletop-render-recovery',
      String(Date.now()),
    )

    const reloadRenderer = window.fushiDesktop?.reloadRenderer

    if (!reloadRenderer) {
      setTableFeedbackMessage(
        'A recuperacao completa so esta disponivel no aplicativo Windows.',
      )
      return
    }

    void reloadRenderer().then((result) => {
      if (!result.ok) {
        setTableFeedbackMessage(
          'O renderizador nao respondeu. Tente Ctrl+A novamente.',
        )
      }
    })
  }, [])

  const handleBoardArtworkBlank = useCallback(() => {
    if (
      Date.now() - boardManualRecoveryRef.current.requestedAt < 18000
    ) {
      hardRecoverBoardRenderer()
      return
    }

    recoverBoardRendering('automatic')
  }, [hardRecoverBoardRenderer, recoverBoardRendering])

  const handleBoardArtworkReady = useCallback(() => {
    boardAutoRecoveryRef.current = {
      attempts: 0,
      mapId: boardMap?.id ?? currentSceneId ?? 'tabletop-map',
      startedAt: Date.now(),
    }
    boardManualRecoveryRef.current = {
      hardRecoveryStarted: false,
      requestedAt: 0,
    }
  }, [boardMap?.id, currentSceneId])

  useEffect(() => {
    function handleBoardRenderRefresh(event: KeyboardEvent) {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        event.key.toLowerCase() !== 'a'
      ) {
        return
      }

      const target = event.target

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      recoverBoardRendering('manual')
    }

    window.addEventListener('keydown', handleBoardRenderRefresh, true)

    return () => {
      window.removeEventListener('keydown', handleBoardRenderRefresh, true)
    }
  }, [recoverBoardRendering])

  useEffect(() => {
    function handleLightingEditorShortcut(event: KeyboardEvent) {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        event.key.toLowerCase() !== 't' ||
        viewMode !== 'gm' ||
        isRemotePlayerMode
      ) {
        return
      }

      const target = event.target

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      setIsLightingEditMode((current) => !current)
    }

    window.addEventListener('keydown', handleLightingEditorShortcut, true)

    return () => {
      window.removeEventListener('keydown', handleLightingEditorShortcut, true)
    }
  }, [isRemotePlayerMode, viewMode])

  useEffect(() => {
    return () => {
      if (boardRecoveryTimerRef.current !== null) {
        window.clearTimeout(boardRecoveryTimerRef.current)
      }
    }
  }, [])

  function updateSession(
    updater: (
      currentSession: ReturnType<typeof createPersistedTabletopSession>,
    ) => ReturnType<typeof createPersistedTabletopSession>,
  ) {
    if (isRemotePlayerMode) {
      return
    }

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
      const authoritativeSession = readAuthoritativeHostedSession(baseSession)

      const nextSession = updater(authoritativeSession)

      writePersistedTabletopSession(nextSession, activeCampaignId)

      return nextSession
    })
  }

  function isHostingActiveCampaign() {
    const hostStatus = window.fushiDesktop?.getMultiplayerHostStatus()

    return Boolean(
      hostStatus?.isRunning &&
        (!hostStatus.campaignId || hostStatus.campaignId === activeCampaignId),
    )
  }

  function readAuthoritativeHostedSession(
    fallbackSession: ReturnType<typeof createPersistedTabletopSession>,
  ) {
    if (!isHostingActiveCampaign()) {
      return fallbackSession
    }

    return readPersistedTabletopSession(activeCampaignId) ?? fallbackSession
  }

  function updateLibraryState(
    updater: (
      currentState: PersistedTabletopLibraryState,
    ) => PersistedTabletopLibraryState,
  ) {
    if (isRemotePlayerMode) {
      return
    }

    setLibraryState((currentState) => {
      const nextState = createTabletopLibraryState(updater(currentState))

      writePersistedTabletopLibraryState(nextState, activeCampaignId, {
        origin: 'TablePage:updateLibraryState',
      })

      return nextState
    })
  }

  function setLibraryVisualThumbnail(key: string, value: string) {
    updateLibraryState((currentState) => {
      const visualThumbnails = { ...currentState.visualThumbnails }

      if (value) {
        visualThumbnails[key] = value
      } else {
        delete visualThumbnails[key]
      }

      return {
        ...currentState,
        visualThumbnails,
      }
    })
  }

  function getLibraryFolderIcon(category: TabletopLibraryCategory) {
    switch (category) {
      case 'maps':
        return 'MAP'
      case 'transitions':
        return 'INT'
      case 'music':
        return 'MSC'
      case 'npcs':
        return 'NPC'
      default:
        return 'DIR'
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

  function renameNpcFaction(currentName: string, nextName: string) {
    const trimmedName = nextName.trim()

    if (!data || !trimmedName || trimmedName === currentName) {
      return
    }

    data.characters.items
      .filter((character) => {
        if (character.tipo === 'player') {
          return false
        }

        return (character.faccao || 'Sem faccao') === currentName
      })
      .forEach((character) => {
        updateCharacter({
          ...character,
          faccao: trimmedName === 'Sem faccao' ? '' : trimmedName,
        })
      })
  }

  function deleteLibraryFolder(folderId: string) {
    updateLibraryState((currentState) => {
      const targetFolder = currentState.folders.find((folder) => folder.id === folderId)

      if (!targetFolder) {
        return currentState
      }

      const parentId = targetFolder.parentId
      const moveAssignmentsToParent = (assignments: Record<string, string>) =>
        Object.fromEntries(
          Object.entries(assignments).map(([itemId, itemFolderId]) => [
            itemId,
            itemFolderId === folderId ? parentId : itemFolderId,
          ]),
        )

      return {
        ...currentState,
        folders: currentState.folders
          .filter((folder) => folder.id !== folderId)
          .map((folder) =>
            folder.parentId === folderId ? { ...folder, parentId } : folder,
          ),
        itemFolders: {
          maps: moveAssignmentsToParent(currentState.itemFolders.maps),
          transitions: moveAssignmentsToParent(currentState.itemFolders.transitions),
          music: moveAssignmentsToParent(currentState.itemFolders.music),
          npcs: moveAssignmentsToParent(currentState.itemFolders.npcs),
        },
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

  function getExactMapById(mapId: string) {
    return (
      availableMaps.find((map) => map.id === mapId) ??
      (data?.tabletop.map.id === mapId ? data.tabletop.map : null)
    )
  }

  function stripPreparedSceneName(name: string) {
    return name.replace(/\s+-\s+preparo$/i, '')
  }

  function findSceneForExactMap(
    sessionScenes: TabletopScene[],
    mapId: string,
    preferredSceneId = preparedSceneId,
  ) {
    return (
      (preferredSceneId
        ? sessionScenes.find(
            (scene) => scene.id === preferredSceneId && scene.mapId === mapId,
          )
        : null) ??
      sessionScenes.find(
        (scene) => scene.mapId === mapId && scene.id.startsWith('scene-map-prep-'),
      ) ??
      sessionScenes.find((scene) => scene.mapId === mapId) ??
      null
    )
  }

  function createSceneForMap(input: {
    map: TabletopMap
    mapId: string
    sceneId: string
    sourceScene: TabletopScene
    name?: string
  }): TabletopScene {
    const mapPreset = getMapVisualPreset({
      biomes: availableBiomes,
      map: input.map,
    })

    return {
      ...input.sourceScene,
      cameraState: undefined,
      gridCellSize: input.map.cellSize,
      id: input.sceneId,
      mapId: input.mapId,
      metadata: {
        ...createEmptySceneMetadata(),
        ...mapPreset,
      },
      name: input.name ?? input.map.name,
      objects: [],
      tokens: [],
    }
  }

  function alignExistingSceneToMap(input: {
    map: TabletopMap
    mapId: string
    scene: TabletopScene
    name?: string
  }): TabletopScene {
    const mapPreset = getMapVisualPreset({
      biomes: availableBiomes,
      map: input.map,
    })

    return {
      ...input.scene,
      gridCellSize: input.map.cellSize,
      mapId: input.mapId,
      metadata: {
        ...input.scene.metadata,
        ...mapPreset,
      },
      name: (input.name ?? stripPreparedSceneName(input.scene.name)) || input.map.name,
      tokens: input.scene.tokens.map((token) => ({
        ...token,
        cell: clampTabletopTokenCell(token.cell, input.map, token),
      })),
    }
  }

  function prepareMapPreviewScene(mapId: string) {
    if (!data) {
      return ''
    }

    const targetMap = getExactMapById(mapId)

    if (!targetMap) {
      return ''
    }

    let nextPreparedSceneId = ''
    const candidateSceneId = `scene-map-prep-${mapId}`
    const plannedPreparedScene =
      session?.scenes && session.scenes.length > 0
        ? findSceneForExactMap(session.scenes, mapId)
        : null
    const plannedPreparedSceneId = plannedPreparedScene?.id ?? candidateSceneId

    updateSession((currentSession) => {
      const preparedSceneById =
        currentSession.scenes.find((scene) => scene.id === candidateSceneId) ?? null
      const existingScene = findSceneForExactMap(currentSession.scenes, mapId)

      if (existingScene) {
        nextPreparedSceneId = existingScene.id

        return currentSession
      }

      if (preparedSceneById) {
        const repairedScene = alignExistingSceneToMap({
          map: targetMap,
          mapId,
          scene: preparedSceneById,
        })

        nextPreparedSceneId = repairedScene.id

        return createPersistedTabletopSession({
          ...currentSession,
          currentSceneId: currentSession.currentSceneId,
          initialSceneId: currentSession.initialSceneId,
          scenes: currentSession.scenes.map((scene) =>
            scene.id === repairedScene.id ? repairedScene : scene,
          ),
          selectedTokenId: '',
          selectedTokenIds: [],
        })
      }

      const sourceScene =
        currentSession.scenes.find((scene) => scene.id === currentSession.currentSceneId) ??
        currentSession.scenes[0] ??
        currentScene ??
        scenes[0] ??
        null

      if (!sourceScene) {
        return currentSession
      }

      const nextSceneId = currentSession.scenes.some(
        (scene) => scene.id === candidateSceneId,
      )
        ? buildSceneId()
        : candidateSceneId
      const nextScene = createSceneForMap({
        map: targetMap,
        mapId,
        sceneId: nextSceneId,
        sourceScene,
      })

      nextPreparedSceneId = nextScene.id

      return createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: [...currentSession.scenes, nextScene],
        selectedTokenId: '',
        selectedTokenIds: [],
      })
    })

    if (nextPreparedSceneId || plannedPreparedSceneId) {
      setPreparedSceneIdOverride(nextPreparedSceneId || plannedPreparedSceneId)
      setInspectedTokenId('')
    }

    return nextPreparedSceneId || plannedPreparedSceneId
  }

  function createVillageTrainingForSession(
    currentSession: ReturnType<typeof createPersistedTabletopSession>,
  ): TabletopTrainingState | null {
    if (!data) {
      return null
    }

    const trainingScene =
      findSceneForExactMap(currentSession.scenes, VILLAGE_TRAINING_ARC.mapId) ??
      currentSession.scenes.find(
        (scene) => scene.id === `scene-map-prep-${VILLAGE_TRAINING_ARC.mapId}`,
      ) ??
      null
    const participants = buildVillageTrainingParticipants(
      trainingScene,
      data.characters.items,
    )

    return participants.length > 0 ? createTabletopTrainingState(participants) : null
  }

  function updateTrainingState(
    updater: (trainingState: TabletopTrainingState) => TabletopTrainingState,
  ) {
    if (viewMode !== 'gm') {
      return
    }

    updateSession((currentSession) => {
      if (!currentSession.trainingState) {
        return currentSession
      }

      return createPersistedTabletopSession({
        ...currentSession,
        trainingState: updater(currentSession.trainingState),
      })
    })
  }

  function handleActivateVillageTraining(locationId: string) {
    if (viewMode !== 'gm' || locationId !== VILLAGE_TRAINING_ARC.locationId) {
      return
    }

    if (isTabletopEventActive(eventState, 'initial-training')) {
      setActiveHudPanel('events')
      setTableFeedbackMessage('Treinamento ja esta ativo. Controle aberto no EVE.')
      return
    }

    const restoreMapId =
      currentScene?.mapId && currentScene.mapId !== VILLAGE_TRAINING_ARC.mapId
        ? currentScene.mapId
        : session?.eventState.events['initial-training'].restoreMapId

    activateMapForPlayers(VILLAGE_TRAINING_ARC.mapId)
    updateSession((currentSession) => {
      const nextTrainingState = currentSession.trainingState
        ? setTrainingArcActive(currentSession.trainingState, true)
        : createVillageTrainingForSession(currentSession)

      if (!nextTrainingState) {
        setTableFeedbackMessage(
          'Campo aberto, mas nenhum corpo de jogador vinculado foi encontrado para o treino.',
        )
        return currentSession
      }

      return createPersistedTabletopSession({
        ...currentSession,
        eventState: setTabletopEventActive(
          currentSession.eventState,
          'initial-training',
          true,
          { restoreMapId },
        ),
        trainingState: nextTrainingState,
      })
    })
    setActiveHudPanel('events')
    setTableFeedbackMessage('Treinamento ativado para Mestre e Jogadores.')
  }

  function handleActivateTabletopEvent(eventId: TabletopEventId) {
    if (viewMode !== 'gm') return

    if (eventId === 'initial-training') {
      handleActivateVillageTraining(VILLAGE_TRAINING_ARC.locationId)
      return
    }

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        eventState: setTabletopEventActive(currentSession.eventState, eventId, true),
      }),
    )
    setTableFeedbackMessage('Evento visual ativado. Use o EVE para transmitir a apresentacao.')
  }

  function handleDeactivateTabletopEvent(eventId: TabletopEventId) {
    if (viewMode !== 'gm') return

    const restoreMapId = session?.eventState.events[eventId].restoreMapId
    const shouldRestoreTrainingMap =
      eventId === 'initial-training' &&
      currentScene?.mapId === VILLAGE_TRAINING_ARC.mapId &&
      Boolean(restoreMapId) &&
      restoreMapId !== VILLAGE_TRAINING_ARC.mapId

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        eventState: setTabletopEventActive(currentSession.eventState, eventId, false),
        trainingState:
          eventId === 'initial-training' && currentSession.trainingState
            ? setTrainingArcActive(currentSession.trainingState, false)
            : currentSession.trainingState,
      }),
    )

    if (shouldRestoreTrainingMap && restoreMapId) {
      window.setTimeout(() => activateMapForPlayers(restoreMapId), 0)
    }

    setTableFeedbackMessage(
      eventId === 'initial-training'
        ? 'Treinamento desativado. Progresso preservado e mesa devolvida ao estado-base.'
        : 'Evento visual desativado e apresentacao removida de todas as telas.',
    )
  }

  function handleOpenTrainingControl() {
    setTrainingOpenRequestId((current) => current + 1)
    setActiveHudPanel(null)
  }

  function handleStartRarityDraw(input: {
    characterId: string
    characterName: string
    itemId: string
    itemName: string
  }) {
    if (viewMode !== 'gm') return

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        eventState: startTabletopRarityDraw(currentSession.eventState, input),
      }),
    )
    setTableFeedbackMessage('Sorteio de raridade transmitido para a mesa.')
  }

  function handleClearRarityDraw() {
    if (viewMode !== 'gm') return

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        eventState: clearTabletopRarityDraw(currentSession.eventState),
      }),
    )
  }

  function handleClearRarityHistory() {
    if (viewMode !== 'gm') return

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        eventState: clearTabletopRarityHistory(currentSession.eventState),
      }),
    )
    setTableFeedbackMessage('Backlog de sorteios limpo. A apresentacao e a ficha permanecem intactas.')
  }

  function handleTrainingParticipantOutcome(
    participantId: string,
    stationId: string,
    outcome: TabletopTrainingOutcome,
  ) {
    updateTrainingState((trainingState) =>
      applyTrainingParticipantOutcome(trainingState, participantId, stationId, outcome),
    )
  }

  function handleTrainingFinalOutcome(
    participantId: string,
    detail: string,
    outcome: TabletopTrainingFinalOutcome,
  ) {
    if (viewMode === 'gm' && (outcome === 'body-failure' || outcome === 'stabilize')) {
      const participant = session?.trainingState?.participants.find(
        (candidate) => candidate.id === participantId,
      )
      const character = participant
        ? data?.characters.items.find((candidate) => candidate.id === participant.characterId)
        : null

      if (character) {
        const delta = outcome === 'body-failure' ? -2 : Math.max(0, Number(detail) || 0)
        commitCanonicalCharacterUpdate(normalizeCharacterSheet({
          ...character,
          recursos: {
            ...character.recursos,
            fushiAtual: Math.max(
              0,
              Math.min(character.recursos.fushiMaximo, character.recursos.fushiAtual + delta),
            ),
          },
        }))
      }
    }

    updateTrainingState((trainingState) =>
      applyTrainingFinalOutcome(trainingState, participantId, detail, outcome),
    )
  }

  function handleAssignCharacterGrant(input: { characterId: string; grantId: string }) {
    if (viewMode !== 'gm' || !data?.characters.items) return

    const grant = getCharacterGrant(input.grantId)
    const character = data.characters.items.find(
      (candidate) => candidate.id === input.characterId,
    )

    if (!grant || grant.status !== 'ready' || !grant.feature) {
      setTableFeedbackMessage('Este conteudo ainda esta em construcao e nao pode ser atribuido.')
      return
    }

    if (!character || character.tipo !== 'player' || character.isSharedBodyHost === true) {
      setTableFeedbackMessage('Selecione uma ficha real de Jogador para receber o conteudo.')
      return
    }

    if (grant.category === 'outro') {
      setTableFeedbackMessage('A categoria Outros ainda esta em construcao.')
      return
    }

    const currentFeatures =
      grant.category === 'ritual'
        ? character.rituais ?? []
        : character.habilidadesDetalhadas ?? []

    if (currentFeatures.some((feature) => feature.id === grant.feature?.id)) {
      setTableFeedbackMessage(`${character.nome} ja possui ${grant.feature.nome}.`)
      return
    }

    const nextCharacter = normalizeCharacterSheet({
      ...character,
      ...(grant.category === 'ritual'
        ? { rituais: [...currentFeatures, grant.feature] }
        : { habilidadesDetalhadas: [...currentFeatures, grant.feature] }),
    })
    commitCanonicalCharacterUpdate(nextCharacter)
    setTableFeedbackMessage(`${grant.feature.nome} atribuida a ${character.nome}.`)
  }

  function handleAssignTrainingRewardAbility(participantId: string) {
    if (
      viewMode !== 'gm' ||
      !data?.characters.items ||
      !session?.trainingState?.finalTrial.isUnlocked
    ) {
      return
    }

    const participant = session.trainingState.participants.find(
      (candidate) => candidate.id === participantId,
    )
    const reward = participant ? getInitialTrainingReward(participant.playerId) : null
    if (!participant || !reward) return

    handleAssignCharacterGrant({
      characterId: participant.characterId,
      grantId: reward.feature.id,
    })
  }

  const assignedRewardCharacterIds = useMemo(
    () =>
      session?.trainingState?.participants
        .filter((participant) => {
          const reward = getInitialTrainingReward(participant.playerId)
          const character = data?.characters.items.find(
            (candidate) => candidate.id === participant.characterId,
          )
          return Boolean(
            reward &&
              character?.habilidadesDetalhadas?.some(
                (feature) => feature.id === reward.feature.id,
              ),
          )
        })
        .map((participant) => participant.characterId) ?? [],
    [data?.characters.items, session?.trainingState?.participants],
  )

  function handleRestartVillageTraining() {
    if (viewMode !== 'gm') {
      return
    }

    const shouldRestart = window.confirm(
      'Iniciar um novo ciclo vai zerar as Marcas e Contratempos do treinamento atual. Continuar?',
    )

    if (!shouldRestart) {
      return
    }

    updateSession((currentSession) => {
      const nextTrainingState = createVillageTrainingForSession(currentSession)

      if (!nextTrainingState) {
        setTableFeedbackMessage('Nao foi possivel iniciar o ciclo: jogadores nao encontrados no mapa.')
        return currentSession
      }

      return createPersistedTabletopSession({
        ...currentSession,
        trainingState: nextTrainingState,
      })
    })
  }

  function openWorldMundiMap(mapId: string) {
    const targetMap = getExactMapById(mapId)

    if (!targetMap) {
      setTableFeedbackMessage('Mapa nao encontrado na biblioteca.')
      return
    }

    const transitionId = getAutomaticMundiTransitionId(mapId)
    const automaticTransition =
      availableTransitions.find((transition) => transition.id === transitionId) ?? null

    setFocusedMapLibraryId(mapId)
    setMapVisibility(mapId, 'preparado')
    prepareMapPreviewScene(mapId)

    if (automaticTransition) {
      triggerTransitionOverlay(automaticTransition.id)
      setActiveHudPanel('maps')
      setTableFeedbackMessage('Interludio aberto; mapa sera ativado para os jogadores.')
      return
    }

    activateMapForPlayers(mapId)
    setActiveHudPanel('maps')
    setTableFeedbackMessage('Mapa ativado para os jogadores.')
  }

  function prepareMapForGm(mapId: string) {
    setFocusedMapLibraryId(mapId)
    setMapVisibility(mapId, 'preparado')
    const preparedSceneId = prepareMapPreviewScene(mapId)

    setActiveHudPanel(null)
    if (preparedSceneId) {
      setInspectedTokenId('')
      setSelection([])
      setSceneEntryId((currentValue) => currentValue + 1)
    }
    setTableFeedbackMessage('Mapa em preparacao. Jogadores ainda nao veem.')
  }

  function activateMapForPlayers(mapId: string) {
    if (!data) {
      return
    }

    const targetMap = getExactMapById(mapId)

    if (!targetMap) {
      setTableFeedbackMessage('Mapa nao encontrado na biblioteca.')
      return
    }

    let activatedSceneId = ''
    let activatedSceneName = targetMap.name

    setMapVisibility(mapId, 'ativo_para_jogadores')
    updateSession((currentSession) => {
      const candidateSceneId = `scene-map-prep-${mapId}`
      const preparedSceneById =
        currentSession.scenes.find((scene) => scene.id === candidateSceneId) ?? null
      const existingScene = findSceneForExactMap(currentSession.scenes, mapId)
      const sourceScene =
        currentSession.scenes.find((scene) => scene.id === currentSession.currentSceneId) ??
        currentSession.scenes[0] ??
        currentScene ??
        scenes[0] ??
        null

      if (!existingScene && !sourceScene) {
        return currentSession
      }

      const nextScene =
        existingScene ??
        (preparedSceneById
          ? alignExistingSceneToMap({
              map: targetMap,
              mapId,
              scene: preparedSceneById,
              name: targetMap.name,
            })
          : null) ??
        createSceneForMap({
          map: targetMap,
          mapId,
          sceneId: currentSession.scenes.some((scene) => scene.id === candidateSceneId)
            ? buildSceneId()
            : candidateSceneId,
          sourceScene: sourceScene as TabletopScene,
          name: targetMap.name,
        })
      const activatedScene: TabletopScene = {
        ...nextScene,
        name: stripPreparedSceneName(nextScene.name),
      }
      const nextScenes = existingScene
        ? currentSession.scenes.map((scene) =>
            scene.id === activatedScene.id ? activatedScene : scene,
          )
        : [...currentSession.scenes, activatedScene]
      const nextSceneRuntime = resolveTabletopSceneRuntime({
        assetLibrary,
        scene: activatedScene,
      })

      activatedSceneId = activatedScene.id
      activatedSceneName = activatedScene.name

      return createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: activatedScene.id,
        initialSceneId: currentSession.initialSceneId,
        scenes: nextScenes,
        selectedTokenId: '',
        selectedTokenIds: [],
        tokens: activatedScene.tokens,
        zoom: getSceneCameraZoom({
          cameraRuntime: nextSceneRuntime.camera,
          scene: activatedScene,
        }),
      })
    })

    if (activatedSceneId) {
      setPreparedSceneIdOverride(activatedSceneId)
      appendWorldSimulationEvent(
        activeCampaignId,
        createWorldSimulationMapChangeEvent({
          actor: activeSessionAuthorLabel,
          campaignId: activeCampaignId,
          fromMapId: currentScene?.mapId ?? '',
          fromSceneId: currentSceneId,
          mapName: activatedSceneName,
          toMapId: mapId,
          toSceneId: activatedSceneId,
        }),
      )
    }

    setInspectedTokenId('')
    setActiveHudPanel(null)
    setSceneEntryId((currentValue) => currentValue + 1)
    setTransitionOverlayState(null)
    setCinematicOverlayState(null)
    setTableFeedbackMessage(`Mapa ativado para os jogadores: ${activatedSceneName}.`)
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
      toMapId: '',
      type: 'image' as const,
      assetUrl: fallbackTransition?.assetUrl ?? fallbackMap?.image ?? '',
      thumbnailUrl:
        fallbackTransition?.thumbnailUrl ??
        fallbackMap?.thumbnailUrl ??
        fallbackMap?.previewImage ??
        fallbackMap?.image,
      description: 'Configure a midia. Por padrao, o grupo continua no mapa atual.',
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
      previewImage: input.previewImage,
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

  function handleUpdateMusicTrack(
    trackId: string,
    input: TabletopMusicUpdateInput,
  ) {
    updateLibraryState((currentState) => {
      const updateTrack = (track: TabletopMediaAsset) =>
        track.id === trackId ? { ...track, ...input } : track
      const isCustomTrack =
        currentState.customMusicTracks.some((track) => track.id === trackId) ||
        currentState.customAmbienceTracks.some((track) => track.id === trackId)

      return {
        ...currentState,
        customAmbienceTracks: currentState.customAmbienceTracks.map(updateTrack),
        customMusicTracks: currentState.customMusicTracks.map(updateTrack),
        trackOverrides: isCustomTrack
          ? removeRecordKey(currentState.trackOverrides, trackId)
          : {
              ...currentState.trackOverrides,
              [trackId]: {
                ...currentState.trackOverrides[trackId],
                ...input,
              },
            },
      }
    })
  }

  function deleteLibraryMap(mapId: string) {
    const sceneReferences = scenes.filter((scene) => scene.mapId === mapId)
    const hasActiveSceneReference = sceneReferences.some((scene) => scene.id === currentSceneId)

    if (hasActiveSceneReference) {
      window.alert('Esse mapa esta ativo na mesa. Ative outro mapa antes de excluir ou ocultar este.')
      return
    }

    if (sceneReferences.length > 0) {
      const sceneList = sceneReferences.map((scene) => `- ${scene.name}`).join('\n')
      const shouldRemoveSceneReferences = window.confirm(
        `Esse mapa esta ligado a ${sceneReferences.length} cena(s) de preparo/teste:\n\n${sceneList}\n\nRemover essas cenas invisiveis e continuar?`,
      )

      if (!shouldRemoveSceneReferences) {
        return
      }

      updateSession((currentSession) => {
        const removedSceneIds = new Set(sceneReferences.map((scene) => scene.id))
        const nextRemovedCharacterIdsByScene = {
          ...currentSession.removedCharacterIdsByScene,
        }

        removedSceneIds.forEach((sceneId) => {
          delete nextRemovedCharacterIdsByScene[sceneId]
        })

        return createPersistedTabletopSession({
          ...currentSession,
          currentSceneId: currentSession.currentSceneId,
          initialSceneId: removedSceneIds.has(currentSession.initialSceneId)
            ? currentSession.currentSceneId
            : currentSession.initialSceneId,
          scenes: currentSession.scenes.filter((scene) => !removedSceneIds.has(scene.id)),
          selectedTokenId: '',
          selectedTokenIds: [],
          removedCharacterIdsByScene: nextRemovedCharacterIdsByScene,
        })
      })

      if (sceneReferences.some((scene) => scene.id === preparedSceneId)) {
        setPreparedSceneIdOverride(currentSceneId)
      }
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
    setTableFeedbackMessage('Mapa removido da biblioteca e referencias antigas foram limpas.')
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
    commitMixerTrackGlobalState(trackId, {
      currentTime: 0,
      duration: 0,
      status: 'stopped',
      updatedAt: Date.now(),
      volume: libraryState.trackVolumes[trackId] ?? DEFAULT_MIXER_TRACK_VOLUME,
    })
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
        favoritePresets: currentState.favoritePresets
          .map((preset) => ({
            ...preset,
            trackIds: preset.trackIds.filter((presetTrackId) => presetTrackId !== trackId),
          }))
          .filter((preset) => preset.trackIds.length > 0),
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
        trackOverrides: removeRecordKey(currentState.trackOverrides, trackId),
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
    if (isRemotePlayerSession) {
      setSession((currentSession) =>
        currentSession
          ? createPersistedTabletopSession({
              ...currentSession,
              selectedTokenIds: nextTokenIds,
              selectedTokenId: nextTokenIds[nextTokenIds.length - 1] ?? '',
            })
          : currentSession,
      )
      return
    }

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

    cameraPersistFrameRef.current = window.setTimeout(() => {
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
    }, CAMERA_PERSIST_DEBOUNCE_MS)
  }

  function handleToggleGmCameraControl() {
    const viewport = viewportRef.current

    if (!gmCameraControlEnabled && viewport && boardScene) {
      persistCurrentSceneCamera({
        sceneId: boardScene.id,
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
        zoom,
      })
    }

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

  useEffect(() => {
    updateCurrentScene3dCameraRef.current = (
      partialCameraState: TabletopCamera3DState,
    ) => {
      if (!hasBoardScene || viewMode !== 'gm') {
        return
      }

      updateSession((currentSession) =>
        createPersistedTabletopSession({
          ...currentSession,
          currentSceneId: currentSession.currentSceneId,
          initialSceneId: currentSession.initialSceneId,
          scenes: currentSession.scenes.map((scene) =>
            scene.id === boardSceneId
              ? {
                  ...scene,
                  camera3dState: {
                    ...(scene.camera3dState ?? {}),
                    ...partialCameraState,
                  },
                }
              : scene,
          ),
        }),
      )
    }
  })

  function updateCurrentScene3dCamera(partialCameraState: TabletopCamera3DState) {
    updateCurrentScene3dCameraRef.current(partialCameraState)
  }

  function handleToggleGm3dCamera() {
    if (!boardScene || viewMode !== 'gm') {
      return
    }

    const nextEnabled = !isScene3dCameraFree
    updateCurrentScene3dCamera({
      enabled: nextEnabled,
      mode: 'free',
      yaw: sceneCamera3dState?.yaw ?? 0.72,
      pitch: sceneCamera3dState?.pitch ?? 0.58,
      distance: sceneCamera3dState?.distance ?? 9.2,
      targetX: sceneCamera3dState?.targetX ?? 0,
      targetY: sceneCamera3dState?.targetY ?? 0,
      targetZ: sceneCamera3dState?.targetZ ?? 0.3,
    })
    setTableFeedbackMessage(
      nextEnabled ? 'Camera 3D do mestre ativada.' : 'Camera 3D do mestre desligada.',
    )
  }

  function handleResetGm3dCamera() {
    updateCurrentScene3dCamera({
      enabled: true,
      mode: 'free',
      yaw: 0.72,
      pitch: 0.58,
      distance: 9.2,
      targetX: 0,
      targetY: 0,
      targetZ: 0.3,
    })
    setTableFeedbackMessage('Camera 3D recentrada.')
  }

  function handle3dCameraChange(cameraState: TabletopCamera3DState) {
    updateCurrentScene3dCamera(cameraState)
  }

  function handleObjectDrop(input: {
    cell: { column: number; row: number }
    objectId: string
    placement3d?: NonNullable<TabletopBoardObject['placement3d']>
  }) {
    if (!boardScene || viewMode !== 'gm') {
      return
    }

    const object =
      boardScene.objects?.find((sceneObject) => sceneObject.id === input.objectId) ??
      null

    if (!object) {
      return
    }

    const fallbackX =
      input.placement3d?.x ??
      object.placement3d?.x ??
      (input.cell.column + 0.5) / Math.max(1, boardMap?.gridColumns ?? 1)
    const fallbackY =
      input.placement3d?.y ??
      object.placement3d?.y ??
      (input.cell.row + 0.5) / Math.max(1, boardMap?.gridRows ?? 1)

    updateObjectOnCurrentScene(input.objectId, {
      cell: input.cell,
      placement3d:
        object.renderMode === 'three'
          ? {
              ...(object.placement3d ?? {}),
              ...(input.placement3d ?? {}),
              x: fallbackX,
              y: fallbackY,
              z: input.placement3d?.z ?? object.placement3d?.z ?? 0,
              rotationX:
                input.placement3d?.rotationX ?? object.placement3d?.rotationX ?? 0,
              rotationY:
                input.placement3d?.rotationY ?? object.placement3d?.rotationY ?? 0,
              rotationZ:
                input.placement3d?.rotationZ ?? object.placement3d?.rotationZ ?? 0,
              scale: input.placement3d?.scale ?? object.placement3d?.scale ?? 1,
            }
          : object.placement3d,
    })
    setObjectMoveTargetId('')
    setTableFeedbackMessage(`${object.name} reposicionado.`)
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
    appendBroadcastEvent({
      type: 'intro',
      sceneId,
      introCardId,
    })
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

    setIntroOverlayState(null)
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
                objects: scene.mapId === mapId ? scene.objects ?? [] : [],
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
        updatedAt: Date.now(),
        volume: libraryState.trackVolumes[trackId] ?? DEFAULT_MIXER_TRACK_VOLUME,
      }

      return {
        ...currentTracks,
        [trackId]: updater(currentState),
      }
    })
  }

  function commitMixerTrackGlobalState(trackId: string, nextState: TabletopMixerTrackState) {
    const updatedAt = nextState.updatedAt || Date.now()

    updateSession((currentSession) => {
      const currentMixerState = currentSession.audioMixerState ?? {
        tracks: {},
        updatedAt,
      }
      const nextTracks = { ...currentMixerState.tracks }

      if (nextState.status === 'stopped') {
        delete nextTracks[trackId]
      } else {
        nextTracks[trackId] = {
          currentTime: Math.max(0, nextState.currentTime),
          duration: Math.max(0, nextState.duration),
          status: nextState.status,
          updatedAt,
          volume: sanitizeAudioVolume(nextState.volume),
        }
      }

      return createPersistedTabletopSession({
        ...currentSession,
        audioMixerState: {
          tracks: nextTracks,
          updatedAt,
        },
      })
    })
  }

  function calculateGlobalMixerTime(state: TabletopMixerTrackState) {
    if (state.status !== 'playing') {
      return state.currentTime
    }

    const elapsedSeconds = Math.max(0, (Date.now() - state.updatedAt) / 1000)
    const nextTime = state.currentTime + elapsedSeconds

    if (state.duration > 0) {
      return nextTime % state.duration
    }

    return nextTime
  }

  function setMixerElementTime(audioElement: HTMLAudioElement, time: number) {
    const nextTime = Math.max(0, time)

    try {
      audioElement.currentTime = Number.isFinite(audioElement.duration)
        ? Math.min(nextTime, audioElement.duration)
        : nextTime
    } catch {
      const seekAfterMetadataLoad = () => {
        try {
          audioElement.currentTime = Number.isFinite(audioElement.duration)
            ? Math.min(nextTime, audioElement.duration)
            : nextTime
        } catch {
          // Some formats reject seeking until the browser has decoded enough data.
        }
      }

      audioElement.addEventListener('loadedmetadata', seekAfterMetadataLoad, { once: true })
    }
  }

  function ensureMixerAudioElement(track: TabletopMusicLibraryItem) {
    let audioElement = mixerAudioElementsRef.current[track.id]

    if (!audioElement) {
      audioElement = createTabletopAudioElement()
      audioElement.volume = sanitizeAudioVolume(
        mixerTracks[track.id]?.volume ??
          libraryState.trackVolumes[track.id] ??
          DEFAULT_MIXER_TRACK_VOLUME,
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
        updatedAt: Date.now(),
      }))
    }

    return audioElement
  }

  async function playMixerTrack(
    track: TabletopMusicLibraryItem,
    options: { broadcast?: boolean; persistGlobal?: boolean; time?: number; volume?: number } = {},
  ) {
    if (!track.source) {
      return
    }

    const audioElement = ensureMixerAudioElement(track)
    const nextVolume = sanitizeAudioVolume(
      options.volume ??
        mixerTracks[track.id]?.volume ??
        libraryState.trackVolumes[track.id] ??
        DEFAULT_MIXER_TRACK_VOLUME,
    )
    audioElement.volume = nextVolume

    if (typeof options.time === 'number' && Number.isFinite(options.time)) {
      setMixerElementTime(audioElement, options.time)
    }

    try {
      await audioElement.play()
      const updatedAt = Date.now()
      const nextState: TabletopMixerTrackState = {
        currentTime: audioElement.currentTime,
        duration: Number.isFinite(audioElement.duration)
          ? audioElement.duration
          : mixerTracks[track.id]?.duration ?? 0,
        status: 'playing',
        updatedAt,
        volume: audioElement.volume,
      }

      setMixerTrackState(track.id, (currentState) => ({
        ...currentState,
        ...nextState,
      }))
      if (options.persistGlobal !== false) {
        commitMixerTrackGlobalState(track.id, nextState)
      }
      setLibraryAudioStatusMessage('')
      if (options.broadcast !== false) {
        appendBroadcastEvent({
          type: 'mixer-audio',
          mixerAction: 'play',
          mixerTrackId: track.id,
          mixerTime: audioElement.currentTime,
          mixerVolume: audioElement.volume,
        })
      }
    } catch {
      setLibraryAudioStatusMessage(
        'Autoplay bloqueado pelo navegador. Clique em Ativar novamente para liberar o som.',
      )
    }
  }

  function pauseMixerTrack(trackId: string, shouldBroadcast = true, shouldPersistGlobal = true) {
    const audioElement = mixerAudioElementsRef.current[trackId]

    if (!audioElement) {
      const currentState = mixerTracks[trackId] ??
        session?.audioMixerState.tracks[trackId] ?? {
          currentTime: 0,
          duration: 0,
          status: 'paused' as const,
          updatedAt: Date.now(),
          volume: libraryState.trackVolumes[trackId] ?? DEFAULT_MIXER_TRACK_VOLUME,
        }
      const nextState: TabletopMixerTrackState = {
        ...currentState,
        currentTime: calculateGlobalMixerTime(currentState),
        status: 'paused',
        updatedAt: Date.now(),
      }

      setMixerTrackState(trackId, (state) => ({
        ...state,
        ...nextState,
      }))
      if (shouldPersistGlobal) {
        commitMixerTrackGlobalState(trackId, nextState)
      }
      if (shouldBroadcast) {
        appendBroadcastEvent({
          type: 'mixer-audio',
          mixerAction: 'pause',
          mixerTrackId: trackId,
          mixerTime: nextState.currentTime,
        })
      }
      return
    }

    audioElement.pause()
    const nextState: TabletopMixerTrackState = {
      ...(mixerTracks[trackId] ?? {
        currentTime: 0,
        duration: 0,
        status: 'paused' as const,
        updatedAt: Date.now(),
        volume: libraryState.trackVolumes[trackId] ?? DEFAULT_MIXER_TRACK_VOLUME,
      }),
      currentTime: audioElement.currentTime,
      status: 'paused',
      updatedAt: Date.now(),
    }

    setMixerTrackState(trackId, (currentState) => ({
      ...currentState,
      ...nextState,
    }))
    if (shouldPersistGlobal) {
      commitMixerTrackGlobalState(trackId, nextState)
    }

    if (shouldBroadcast) {
      appendBroadcastEvent({
        type: 'mixer-audio',
        mixerAction: 'pause',
        mixerTrackId: trackId,
        mixerTime: audioElement.currentTime,
      })
    }
  }

  function stopMixerTrack(trackId: string, shouldBroadcast = true, shouldPersistGlobal = true) {
    const audioElement = mixerAudioElementsRef.current[trackId]

    if (!audioElement) {
      const nextState: TabletopMixerTrackState = {
        ...(mixerTracks[trackId] ??
          session?.audioMixerState.tracks[trackId] ?? {
          duration: 0,
          volume: libraryState.trackVolumes[trackId] ?? DEFAULT_MIXER_TRACK_VOLUME,
        }),
        currentTime: 0,
        status: 'stopped',
        updatedAt: Date.now(),
      }

      setMixerTrackState(trackId, (currentState) => ({
        ...currentState,
        ...nextState,
      }))
      if (shouldPersistGlobal) {
        commitMixerTrackGlobalState(trackId, nextState)
      }
      if (shouldBroadcast) {
        appendBroadcastEvent({
          type: 'mixer-audio',
          mixerAction: 'stop',
          mixerTrackId: trackId,
        })
      }
      return
    }

    stopAudioElement(audioElement)
    const nextState: TabletopMixerTrackState = {
      ...(mixerTracks[trackId] ??
        session?.audioMixerState.tracks[trackId] ?? {
        duration: 0,
        volume: libraryState.trackVolumes[trackId] ?? DEFAULT_MIXER_TRACK_VOLUME,
      }),
      currentTime: 0,
      duration: Number.isFinite(audioElement.duration)
        ? audioElement.duration
        : mixerTracks[trackId]?.duration ?? 0,
      status: 'stopped',
      updatedAt: Date.now(),
    }

    setMixerTrackState(trackId, (currentState) => ({
      ...currentState,
      ...nextState,
    }))
    if (shouldPersistGlobal) {
      commitMixerTrackGlobalState(trackId, nextState)
    }

    if (shouldBroadcast) {
      appendBroadcastEvent({
        type: 'mixer-audio',
        mixerAction: 'stop',
        mixerTrackId: trackId,
      })
    }
  }

  function seekMixerTrack(
    trackId: string,
    time: number,
    shouldBroadcast = true,
    shouldPersistGlobal = true,
  ) {
    const audioElement = mixerAudioElementsRef.current[trackId]
    const nextTime = Math.max(0, time)

    if (audioElement) {
      setMixerElementTime(audioElement, nextTime)
    }

    const nextState: TabletopMixerTrackState = {
      ...(mixerTracks[trackId] ?? {
        duration: 0,
        status: 'paused' as const,
        volume: libraryState.trackVolumes[trackId] ?? DEFAULT_MIXER_TRACK_VOLUME,
      }),
      currentTime: audioElement?.currentTime ?? nextTime,
      updatedAt: Date.now(),
    }

    setMixerTrackState(trackId, (currentState) => ({
      ...currentState,
      ...nextState,
    }))
    if (shouldPersistGlobal) {
      commitMixerTrackGlobalState(trackId, nextState)
    }

    if (shouldBroadcast) {
      appendBroadcastEvent({
        type: 'mixer-audio',
        mixerAction: 'seek',
        mixerTrackId: trackId,
        mixerTime: audioElement?.currentTime ?? nextTime,
      })
    }
  }

  function setMixerTrackVolume(
    trackId: string,
    volume: number,
    shouldBroadcast = true,
    shouldPersistGlobal = true,
  ) {
    const nextVolume = sanitizeAudioVolume(volume)
    const audioElement = mixerAudioElementsRef.current[trackId]

    if (audioElement) {
      audioElement.volume = nextVolume
    }

    const nextState: TabletopMixerTrackState = {
      ...(mixerTracks[trackId] ?? {
        currentTime: audioElement?.currentTime ?? 0,
        duration: Number.isFinite(audioElement?.duration)
          ? audioElement?.duration ?? 0
          : 0,
        status: 'paused' as const,
        updatedAt: Date.now(),
        volume: nextVolume,
      }),
      currentTime: audioElement?.currentTime ?? mixerTracks[trackId]?.currentTime ?? 0,
      duration: Number.isFinite(audioElement?.duration)
        ? audioElement?.duration ?? mixerTracks[trackId]?.duration ?? 0
        : mixerTracks[trackId]?.duration ?? 0,
      updatedAt: Date.now(),
      volume: nextVolume,
    }

    setMixerTrackState(trackId, (currentState) => ({
      ...currentState,
      ...nextState,
    }))
    if (shouldPersistGlobal) {
      commitMixerTrackGlobalState(trackId, nextState)
    }
    updateLibraryState((currentState) => ({
      ...currentState,
      trackVolumes: {
        ...currentState.trackVolumes,
        [trackId]: nextVolume,
      },
    }))

    if (shouldBroadcast) {
      appendBroadcastEvent({
        type: 'mixer-audio',
        mixerAction: 'volume',
        mixerTrackId: trackId,
        mixerVolume: nextVolume,
      })
    }
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

  function saveFavoritePreset(name: string) {
    const trackIds = libraryState.favoriteTrackIds.filter((trackId) =>
      audioLibraryTracks.some((track) => track.id === trackId),
    )

    if (trackIds.length === 0) {
      setLibraryAudioStatusMessage('Favorite pelo menos um som antes de salvar um preset.')
      return
    }

    updateLibraryState((currentState) => ({
      ...currentState,
      favoritePresets: [
        ...currentState.favoritePresets,
        {
          id: buildLibraryItemId('fav-mix'),
          name: name.trim() || `Favoritos ${currentState.favoritePresets.length + 1}`,
          trackIds,
        },
      ],
    }))
  }

  function getFavoritePresetTracks(presetId: string) {
    const preset = libraryState.favoritePresets.find((item) => item.id === presetId)

    if (!preset) {
      return []
    }

    return preset.trackIds
      .map((trackId) => audioLibraryTracks.find((track) => track.id === trackId))
      .filter((track): track is TabletopMusicLibraryItem => Boolean(track))
  }

  function playFavoritePreset(presetId: string) {
    getFavoritePresetTracks(presetId).forEach((track) => {
      void playMixerTrack(track)
    })
  }

  function applyFavoritePreset(presetId: string) {
    const trackIds = getFavoritePresetTracks(presetId).map((track) => track.id)

    updateLibraryState((currentState) => ({
      ...currentState,
      favoriteTrackIds: trackIds,
    }))
  }

  function renameFavoritePreset(presetId: string, name: string) {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return
    }

    updateLibraryState((currentState) => ({
      ...currentState,
      favoritePresets: currentState.favoritePresets.map((preset) =>
        preset.id === presetId
          ? {
              ...preset,
              name: trimmedName,
            }
          : preset,
      ),
    }))
  }

  function deleteFavoritePreset(presetId: string) {
    updateLibraryState((currentState) => ({
      ...currentState,
      favoritePresets: currentState.favoritePresets.filter((preset) => preset.id !== presetId),
    }))
  }

  function pauseAllMixerTracks() {
    Array.from(
      new Set([
        ...Object.keys(mixerTracks),
        ...Object.keys(session?.audioMixerState.tracks ?? {}),
        ...Object.keys(mixerAudioElementsRef.current),
      ]),
    ).forEach((trackId) => {
      pauseMixerTrack(trackId)
    })
  }

  function stopAllMixerTracks() {
    Array.from(
      new Set([
        ...Object.keys(mixerTracks),
        ...Object.keys(session?.audioMixerState.tracks ?? {}),
        ...Object.keys(mixerAudioElementsRef.current),
      ]),
    ).forEach((trackId) => {
      stopMixerTrack(trackId)
    })
  }

  useEffect(() => {
    const globalTracks = session?.audioMixerState.tracks ?? {}
    const libraryKey = audioLibraryTracks.map((track) => track.id).join('|')
    const syncKey = JSON.stringify({
      libraryKey,
      tracks: Object.entries(globalTracks)
        .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
        .map(([trackId, trackState]) => ({
          trackId,
          currentTime: trackState.currentTime,
          status: trackState.status,
          updatedAt: trackState.updatedAt,
          volume: trackState.volume,
        })),
    })

    if (lastAppliedAudioMixerKeyRef.current === syncKey) {
      return
    }

    lastAppliedAudioMixerKeyRef.current = syncKey

    const globalTrackIds = new Set(Object.keys(globalTracks))

    Object.entries(globalTracks).forEach(([trackId, trackState]) => {
      const track = audioLibraryTracks.find((candidate) => candidate.id === trackId) ?? null

      if (!track) {
        return
      }

      if (trackState.status === 'playing') {
        void playMixerTrackFromEffect(track, {
          broadcast: false,
          persistGlobal: false,
          time: calculateGlobalMixerTime(trackState),
          volume: trackState.volume,
        })
        return
      }

      if (trackState.status === 'paused') {
        const audioElement = ensureMixerAudioElementFromEffect(track)

        audioElement.pause()
        setMixerElementTime(audioElement, trackState.currentTime)
        audioElement.volume = sanitizeAudioVolume(trackState.volume)
        setMixerTrackStateFromEffect(trackId, (currentState) => ({
          ...currentState,
          ...trackState,
        }))
        return
      }

      stopMixerTrackFromEffect(trackId, false, false)
    })

    Object.entries(mixerTracks).forEach(([trackId, trackState]) => {
      if (!globalTrackIds.has(trackId) && trackState.status !== 'stopped') {
        stopMixerTrackFromEffect(trackId, false, false)
      }
    })
  }, [audioLibraryTracks, session?.audioMixerState, mixerTracks])

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
    appendBroadcastEvent({
      type: 'transition',
      transitionId: transition.id,
    })
    const playbackStartedAt = getRuntimeTimestamp()
    handleTransitionPlaybackStateChange({
      activeTransitionId: transition.id,
      currentTime: 0,
      mapTargetId: transition.toMapId || null,
      paused: false,
      startedAt: playbackStartedAt,
      updatedAt: playbackStartedAt,
    })
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
    if (!applySharedTransitionPlaybackState(nextState)) {
      return
    }
    writeSharedTransitionPlaybackState(nextState)
    appendBroadcastEvent({
      type: 'transition-playback',
      playbackState: nextState,
      transitionId: nextState.activeTransitionId ?? undefined,
    })
  }

  function applySharedTransitionPlaybackState(
    nextState: SharedTransitionPlaybackState | null,
  ) {
    if (!nextState || !nextState.activeTransitionId) {
      if (nextState?.updatedAt) {
        lastTransitionPlaybackUpdatedAtRef.current = Math.max(
          lastTransitionPlaybackUpdatedAtRef.current,
          nextState.updatedAt,
        )
      }
      setSharedTransitionPlaybackState(null)
      return true
    }

    const nextUpdatedAt = nextState.updatedAt || nextState.startedAt || 0

    if (nextUpdatedAt + 1 < lastTransitionPlaybackUpdatedAtRef.current) {
      return false
    }

    lastTransitionPlaybackUpdatedAtRef.current = nextUpdatedAt
    setSharedTransitionPlaybackState(nextState)
    return true
  }

  function closeSharedTransitionPlaybackState() {
    lastTransitionPlaybackUpdatedAtRef.current = Math.max(
      lastTransitionPlaybackUpdatedAtRef.current,
      Date.now(),
    )
    setSharedTransitionPlaybackState(null)
  }

  function closeTransitionOverlay() {
    setTransitionOverlayState(null)
    closeSharedTransitionPlaybackState()
    clearSharedTransitionPlaybackState()
    appendBroadcastEvent({
      type: 'transition-close',
    })
  }

  function applyTransitionToScene(mapId: string) {
    if (!mapId) {
      closeTransitionOverlay()
      return
    }

    closeTransitionOverlay()

    window.requestAnimationFrame(() => {
      activateMapForPlayers(mapId)
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
    setTransitionOverrides((currentOverrides) => {
      const nextOverrides = { ...currentOverrides }
      const nextOverride: PersistedTransitionOverride = {}
      const customName = config.customName?.trim()

      if (customName) {
        nextOverride.customName = customName
      }

      if (config.assetUrl && config.assetUrl !== transition.assetUrl) {
        nextOverride.assetUrl = config.assetUrl
      }

      if (config.thumbnailUrl && config.thumbnailUrl !== transition.thumbnailUrl) {
        nextOverride.thumbnailUrl = config.thumbnailUrl
      }

      if (config.keepCurrentMap) {
        nextOverride.keepCurrentMap = true
        nextOverride.toMapId = ''
      } else if (config.toMapId !== transition.toMapId) {
        nextOverride.toMapId = config.toMapId ?? ''
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
    appendBroadcastEvent({
      type: 'cinematic',
      cinematicId: cinematic.id,
    })
  }

  function clearVfxPresentation() {
    if (vfxPresentationTimeoutRef.current !== null) {
      window.clearTimeout(vfxPresentationTimeoutRef.current)
      vfxPresentationTimeoutRef.current = null
    }

    setActiveVfxPresentation(null)
  }

  function showVfxPresentation(
    preset: TabletopVfxPreset,
    targetTokenId?: string,
  ) {
    if (vfxPresentationTimeoutRef.current !== null) {
      window.clearTimeout(vfxPresentationTimeoutRef.current)
    }

    const createdAt = getRuntimeTimestamp()
    const presentation: TabletopVfxPresentationState = {
      createdAt,
      expiresAt: createdAt + preset.durationMs,
      id: buildRuntimeEventId(`vfx-${preset.id}`),
      presetId: preset.id,
      targetTokenId,
    }

    setActiveVfxPresentation(presentation)
    vfxPresentationTimeoutRef.current = window.setTimeout(() => {
      vfxPresentationTimeoutRef.current = null
      setActiveVfxPresentation((current) =>
        current?.id === presentation.id ? null : current,
      )
    }, preset.durationMs + 40)
  }

  function previewVfx(preset: TabletopVfxPreset, targetTokenId?: string) {
    showVfxPresentation(preset, targetTokenId)
  }

  function broadcastVfx(preset: TabletopVfxPreset, targetTokenId?: string) {
    if (viewMode !== 'gm' || isRemotePlayerMode) {
      return
    }

    showVfxPresentation(preset, targetTokenId)
    appendBroadcastEvent({
      type: 'vfx',
      vfxAction: 'show',
      vfxPresetId: preset.id,
      vfxTargetTokenId: targetTokenId,
      vfxExpiresAt: getRuntimeTimestamp() + preset.durationMs + 500,
    })
  }

  function stopBroadcastVfx() {
    if (viewMode !== 'gm' || isRemotePlayerMode) {
      return
    }

    clearVfxPresentation()
    appendBroadcastEvent({
      type: 'vfx',
      vfxAction: 'clear',
      vfxExpiresAt: getRuntimeTimestamp() + 2500,
    })
  }

  function appendBroadcastEvent(
    event: Omit<TabletopBroadcastEvent, 'createdAt' | 'id'>,
  ) {
    if (viewMode !== 'gm') {
      return
    }

    const nextEvent: TabletopBroadcastEvent = {
      ...event,
      id: buildRuntimeEventId(`broadcast-${event.type}`),
      createdAt: getRuntimeTimestamp(),
    }

    updateSession((currentSession) => {
      const existingEvents =
        event.type === 'vfx'
          ? currentSession.broadcastEvents.filter(
              (currentEvent) => currentEvent.type !== 'vfx',
            )
          : currentSession.broadcastEvents

      return createPersistedTabletopSession({
        ...currentSession,
        broadcastEvents: [...existingEvents, nextEvent].slice(-40),
      })
    })
  }

  function appendLogEntry(entry: TabletopLogEntry) {
    if (entry.type === 'roll' && entry.roll && !canSubmitDiceRollEntry(entry)) {
      return false
    }

    if (isRemotePlayerSession) {
      const publicEntry: TabletopLogEntry = {
        ...entry,
        visibility: 'public',
      }

      if (publicEntry.type === 'roll' && publicEntry.roll) {
        queueDiceRollPlayback(publicEntry)
      }
      addRemoteLogEntry(publicEntry)
      return true
    }

    if (entry.type === 'roll' && entry.roll && (entry.visibility !== 'gm' || viewMode === 'gm')) {
      requestDiceRollPlayback(entry)
    }

    appendWorldSimulationEvent(
      activeCampaignId,
      createWorldSimulationEventFromLogEntry(entry, {
        campaignId: activeCampaignId,
        mapId: currentScene?.mapId ?? '',
        sceneId: currentSceneId,
      }),
    )
    updateSession((currentSession) => ({
      ...currentSession,
      logEntries: [...currentSession.logEntries, entry].slice(-80),
    }))
    return true
  }

  function handleCombatRangePreview(input: {
    featureName: string
    range: {
      color: string
      label: string
      radiusMeters?: number
      shape: 'adjacent' | 'map' | 'radius'
    }
    sourceTokenId: string
    targetTokenId?: string
    visibility: 'local' | 'public'
  }) {
    const sourceToken = visibleTokens.find((token) => token.id === input.sourceTokenId)

    if (!sourceToken) {
      setTableFeedbackMessage('O token de origem nao esta visivel nesta cena.')
      return
    }

    const now = Date.now()
    const preview: TabletopCombatPreview = {
      color: input.range.color || '#8e6cff',
      createdAt: now,
      expiresAt: now + 9000,
      id: buildRuntimeEventId(`combat-range-${sourceToken.id}`),
      label: `${input.featureName} | ${input.range.label}`,
      origin: sourceToken.cell,
      radiusMeters: input.range.radiusMeters,
      sceneId: currentSceneId,
      shape: input.range.shape,
      sourceTokenId: sourceToken.id,
      targetTokenId: input.targetTokenId,
    }

    if (input.visibility === 'public') {
      if (viewMode !== 'gm') return

      setLocalCombatPreview(null)
      updateSession((currentSession) =>
        createPersistedTabletopSession({
          ...currentSession,
          publicCombatPreview: preview,
        }),
      )
      setTableFeedbackMessage(`${input.featureName}: area mostrada para todos por 9 segundos.`)
      return
    }

    setLocalCombatPreview(preview)
    setTableFeedbackMessage(`${input.featureName}: previa local por 9 segundos.`)
  }

  function handleCloseCombatRangePreview() {
    if (localCombatPreview) {
      setLocalCombatPreview(null)
      return
    }

    if (viewMode === 'gm' && session?.publicCombatPreview) {
      updateSession((currentSession) =>
        createPersistedTabletopSession({
          ...currentSession,
          publicCombatPreview: null,
        }),
      )
      return
    }

    if (session?.publicCombatPreview?.id) {
      setDismissedCombatPreviewId(session.publicCombatPreview.id)
    }
  }

  function commitCanonicalCharacterUpdate(character: CharacterSheet) {
    if (isRemotePlayerSession) {
      updateRemoteCharacter(character)
      return
    }

    updateCharacter(character)
  }

  function beginCharacterEdit(characterId: string) {
    const currentLock = session?.characterEditLocks?.[characterId]

    if (
      currentLock &&
      currentLock.expiresAt > Date.now() &&
      currentLock.ownerId !== currentEditOwnerId
    ) {
      setTableFeedbackMessage(`Ficha em edicao por ${currentLock.ownerLabel}.`)
      return false
    }

    const lock: TabletopCharacterEditLock = {
      acquiredAt: Date.now(),
      characterId,
      expiresAt: Date.now() + 10 * 60 * 1000,
      mode: 'full',
      ownerId: currentEditOwnerId,
      ownerLabel:
        viewMode === 'gm'
          ? 'Mestre'
          : effectiveActiveAccessProfile?.label ?? focusedPlayerCharacter?.nome ?? 'Jogador',
    }

    if (viewMode === 'gm') {
      updateSession((currentSession) =>
        createPersistedTabletopSession({
          ...currentSession,
          characterEditLocks: {
            ...currentSession.characterEditLocks,
            [characterId]: lock,
          },
        }),
      )
    } else {
      setCharacterEditLock({
        characterId,
        mode: 'full',
      })
    }

    return true
  }

  function endCharacterEdit(characterId: string) {
    if (viewMode === 'gm') {
      updateSession((currentSession) => {
        const nextLocks = { ...currentSession.characterEditLocks }

        if (nextLocks[characterId]?.ownerId === 'gm') {
          delete nextLocks[characterId]
        }

        return createPersistedTabletopSession({
          ...currentSession,
          characterEditLocks: nextLocks,
        })
      })
      return
    }

    setCharacterEditLock({
      characterId,
      mode: 'full',
      release: true,
    })
  }

  function commitCombatCharacterResourceUpdate(
    character: CharacterSheet,
    targetToken: TabletopToken,
    nextResources: CharacterSheet['recursos'],
  ) {
    const normalizedCharacter = normalizeCharacterSheet({
      ...character,
      recursos: nextResources,
    })

    if (targetToken.resourceOverride || character.tipo === 'mob') {
      updateCurrentScene((scene) => ({
        ...scene,
        tokens: scene.tokens.map((token) =>
          token.id === targetToken.id
            ? {
                ...token,
                resourceOverride: normalizedCharacter.recursos,
              }
            : token,
        ),
      }))
      return
    }

    if (!data) {
      commitCanonicalCharacterUpdate(normalizedCharacter)
      return
    }

    const isSharedBodyHost = data.characters.items.some(
      (item) => getSharedBodyHostId(item) === normalizedCharacter.id,
    )
    const sharedBodyHostId = normalizedCharacter.isSharedBodyHost || isSharedBodyHost
      ? normalizedCharacter.id
      : getSharedBodyHostId(normalizedCharacter)

    if (!sharedBodyHostId) {
      commitCanonicalCharacterUpdate(normalizedCharacter)
      return
    }

    const sharedVida = {
      vidaAtual: normalizedCharacter.recursos.vidaAtual,
      vidaMaxima: normalizedCharacter.recursos.vidaMaxima,
    }

    data.characters.items
      .filter(
        (item) =>
          item.id === normalizedCharacter.id ||
          item.id === sharedBodyHostId ||
          getSharedBodyHostId(item) === sharedBodyHostId,
      )
      .forEach((item) => {
        const nextSharedCharacter =
          item.id === normalizedCharacter.id
            ? normalizedCharacter
            : normalizeCharacterSheet({
                ...item,
                recursos: {
                  ...item.recursos,
                  ...sharedVida,
                },
              })

        commitCanonicalCharacterUpdate(nextSharedCharacter)
      })
  }

  function handleRollSubmitWindowBehavior() {
    if (rollWindowRestoreTimeoutRef.current !== null) {
      window.clearTimeout(rollWindowRestoreTimeoutRef.current)
      rollWindowRestoreTimeoutRef.current = null
    }

    window.dispatchEvent(new Event('fushi:tabletop-windows-minimize'))
  }

  function clearRollLogEntries() {
    updateSession((currentSession) => ({
      ...currentSession,
      logEntries: currentSession.logEntries.filter((entry) => entry.type !== 'roll'),
    }))
    clearDiceRollQueue()
    setRollToastEntry(null)
  }

  function clearChatLogEntries() {
    updateSession((currentSession) => ({
      ...currentSession,
      logEntries: currentSession.logEntries.filter((entry) => entry.type === 'roll'),
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
    appendBroadcastEvent({
      type: 'image-preview',
      src,
      label,
    })
  }

  function closeImagePreview() {
    setImagePreviewState(null)
    clearSharedImagePreviewState()
    appendBroadcastEvent({
      type: 'image-preview-close',
    })
  }

  function handleAudioPlay() {
    if (!activeSceneAudio.music && !activeSceneAudio.ambience) {
      setAudioStatusMessage('A cena atual nao tem musica ou ambiencia definida.')
      setAudioTransportState('stopped')
      return
    }

    setAudioStatusMessage('')
    setAudioTransportState('playing')
    appendBroadcastEvent({
      type: 'audio',
      audioTransportState: 'playing',
      musicVolume,
      ambienceVolume,
    })
  }

  function handleAudioPause() {
    setAudioTransportState('paused')
    appendBroadcastEvent({
      type: 'audio',
      audioTransportState: 'paused',
      musicVolume,
      ambienceVolume,
    })
  }

  function handleAudioStop() {
    setAudioTransportState('stopped')
    appendBroadcastEvent({
      type: 'audio',
      audioTransportState: 'stopped',
      musicVolume,
      ambienceVolume,
    })
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
        setTokenInspectorRestoreSignal((currentValue) => currentValue + 1)
        return
      }

      const previewSource =
        nextCharacter?.tokenImageUrl ??
        nextCharacter?.avatarUrl ??
        ''

      if (previewSource && nextCharacter) {
        openImagePreview(previewSource, nextCharacter.nome)
      }

      return
    }

    setInspectedTokenId(nextToken.id)
    setTokenInspectorRestoreSignal((currentValue) => currentValue + 1)
  }

  function handleDeathSaveSlotChange(tokenId: string, slotIndex: number) {
    if (viewMode !== 'gm' || slotIndex < 0 || slotIndex > 2) {
      return
    }

    const token = visibleTokens.find((candidate) => candidate.id === tokenId) ?? null
    const character = resolveTokenCharacterForCombat(token)
    const currentState = session?.playerDeathStates[tokenId]

    if (
      !token ||
      !character ||
      !currentState ||
      getTokenPlayerIds(token).length === 0
    ) {
      return
    }

    const nextResults = [...currentState.results]
    const currentResult = nextResults[slotIndex]
    nextResults[slotIndex] =
      currentResult === null
        ? 'success'
        : currentResult === 'success'
          ? 'failure'
          : null
    const successes = nextResults.filter((result) => result === 'success').length
    const failures = nextResults.filter((result) => result === 'failure').length
    const stabilized = successes >= 3

    if (stabilized) {
      commitCombatCharacterResourceUpdate(character, token, {
        ...character.recursos,
        vidaAtual: Math.max(1, character.recursos.vidaAtual),
      })
      void playTabletopSfx('select', { rate: 1.15 })
    } else if (failures >= 3) {
      void playTabletopSfx('error')
    }

    updateSession((currentSession) => {
      const nextDeathStates = { ...currentSession.playerDeathStates }

      nextDeathStates[tokenId] = {
        failures,
        results: nextResults,
        status: failures >= 3 ? 'dead' : 'down',
        successes,
        tokenId,
        updatedAt: Date.now(),
      }

      return createPersistedTabletopSession({
        ...currentSession,
        playerDeathStates: nextDeathStates,
        publicCombatImpacts: stabilized
          ? [
              ...currentSession.publicCombatImpacts.filter(
                (impact) => impact.expiresAt > Date.now(),
              ),
              {
                amount: 1,
                createdAt: Date.now(),
                expiresAt: Date.now() + 1800,
                id: buildRuntimeEventId('death-save-heal'),
                tokenId,
                type: 'heal',
              },
            ]
          : currentSession.publicCombatImpacts,
      })
    })
    setTableFeedbackMessage(
      stabilized
        ? `${character.nome} estabilizou e recuperou 1 de Vida.`
        : failures >= 3
          ? `${character.nome} falhou nas tres tentativas.`
          : `${character.nome}: ${successes} sucesso(s), ${failures} falha(s).`,
    )
  }

  function handleCancelCombatEffect(effectId: string) {
    const effect =
      session?.publicCombatMarks.find((mark) => mark.id === effectId) ?? null
    const sourceToken =
      effect
        ? tokens.find((token) => token.id === effect.sourceTokenId) ?? null
        : null
    const sourceMayCancel =
      (effect?.cancelableBySource === true &&
        (effect.statusId === 'especial-buff' ||
          effect.statusId === 'especial-debuff')) ||
      effect?.label === 'Analise Cirurgica'
    const canCancel =
      viewMode === 'gm' ||
      Boolean(
        sourceMayCancel &&
        sourceToken &&
        canActivePlayerControlToken(sourceToken),
      )

    if (!effect || !canCancel) {
      setTableFeedbackMessage('Este efeito so pode ser cancelado por sua origem ou pelo Mestre.')
      return
    }

    if (isRemotePlayerSession) {
      cancelRemoteCombatEffect(effectId)
      setTableFeedbackMessage(`${effect.label}: cancelamento enviado ao Mestre.`)
      return
    }

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        publicCombatMarks: currentSession.publicCombatMarks.filter(
          (mark) => mark.id !== effectId,
        ),
      }),
    )
    setTableFeedbackMessage(`${effect.label} foi encerrado.`)
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
      author: activeSessionAuthorLabel,
      text: 'Ping no mapa',
      createdAt: new Date().toISOString(),
    })
  }

  function handleMeasurementChange(
    measurement: { start: TabletopMeasurement['start']; end: TabletopMeasurement['end'] } | null,
  ) {
    if (!boardSceneId) {
      return
    }

    if (isRemotePlayerSession) {
      const remoteMeasurement = measurement
        ? {
            start: measurement.start,
            end: measurement.end,
            visualColor: activeSessionDiceColor,
          }
        : null
      const nextMeasurementKey = remoteMeasurement
        ? [
            remoteMeasurement.start.column,
            remoteMeasurement.start.row,
            remoteMeasurement.end.column,
            remoteMeasurement.end.row,
            remoteMeasurement.visualColor,
          ].join(':')
        : 'clear'

      if (nextMeasurementKey === lastRemoteMeasurementKeyRef.current) {
        return
      }

      lastRemoteMeasurementKeyRef.current = nextMeasurementKey
      updateRemoteMeasurement(remoteMeasurement)
      return
    }

    const currentMeasurement = session?.activeMeasurement ?? null
    const isMeasurementAlreadySynced = measurement
      ? Boolean(
          currentMeasurement &&
            currentMeasurement.sceneId === boardSceneId &&
            currentMeasurement.authorId === activeSessionAuthorId &&
            currentMeasurement.authorLabel === activeSessionAuthorLabel &&
            currentMeasurement.authorView === viewMode &&
            currentMeasurement.visualColor === activeSessionDiceColor &&
            currentMeasurement.start.column === measurement.start.column &&
            currentMeasurement.start.row === measurement.start.row &&
            currentMeasurement.end.column === measurement.end.column &&
            currentMeasurement.end.row === measurement.end.row,
        )
      : currentMeasurement === null

    if (isMeasurementAlreadySynced) {
      return
    }

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        activeMeasurement: measurement
          ? {
              id: currentSession.activeMeasurement?.id ?? buildRuntimeEventId('measure'),
              sceneId: boardSceneId,
              authorId: activeSessionAuthorId,
              authorLabel: activeSessionAuthorLabel,
              authorView: viewMode,
              start: measurement.start,
              end: measurement.end,
              visualColor: activeSessionDiceColor,
              updatedAt: getRuntimeTimestamp(),
            }
          : null,
      }),
    )
  }

  function handleExitToPlatform(event?: MouseEvent<HTMLButtonElement>) {
    event?.preventDefault()
    event?.stopPropagation()

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    if (rollToastTimeoutRef.current !== null) {
      window.clearTimeout(rollToastTimeoutRef.current)
      rollToastTimeoutRef.current = null
    }

    clearDiceRollQueue()
    setRollToastEntry(null)
    setIsMeasureToolActive(false)
    setObjectMoveTargetId('')
    setObjectPlacementPresetId('')
    setSelectedObjectId('')
    setInspectedTokenId('')
    setActiveHudPanel(null)
    setActiveUtilityWindow(null)
    setIntroOverlayState(null)
    setTransitionOverlayState(null)
    setCinematicOverlayState(null)
    setImagePreviewState(null)
    setSceneReturnTransitionActive(false)

    navigate('/', { replace: true })
  }

  function revealRollToast(entry: TabletopLogEntry) {
    if (!entry.roll) {
      return
    }

    setRollToastEntry(entry)
    void playTabletopSfx('dice-result')

    if (rollToastTimeoutRef.current !== null) {
      window.clearTimeout(rollToastTimeoutRef.current)
    }

    rollToastTimeoutRef.current = window.setTimeout(() => {
      setRollToastEntry(null)
      rollToastTimeoutRef.current = null
    }, 5600)
  }

  function handleDiceRollSettled(entryId: string) {
    const settledEntry =
      activeDiceRollEntry?.id === entryId
        ? activeDiceRollEntry
        : logEntries.find((entry) => entry.id === entryId) ?? null

    if (!settledEntry || settledEntry.type !== 'roll' || !settledEntry.roll) {
      return
    }

    revealRollToast(settledEntry)
    const isCombatRoll =
      settledEntry.combat?.kind === 'attack' ||
      pendingCombatResolution?.opposedRollEntryId === settledEntry.id ||
      pendingCombatResolution?.damageRollEntryId === settledEntry.id

    rollWindowRestoreTimeoutRef.current = window.setTimeout(() => {
      rollWindowRestoreTimeoutRef.current = null

      if (
        viewMode === 'gm' &&
        pendingCombatResolution?.opposedRollEntryId === settledEntry.id
      ) {
        setPendingCombatResolution((currentResolution) =>
          currentResolution?.opposedRollEntryId === settledEntry.id
            ? {
                ...currentResolution,
                opposedRollEntryId: undefined,
                opposedRollTotal: settledEntry.roll?.total,
              }
            : currentResolution,
        )
      } else if (
        viewMode === 'gm' &&
        pendingCombatResolution?.damageRollEntryId === settledEntry.id
      ) {
        setPendingCombatResolution((currentResolution) =>
          currentResolution?.damageRollEntryId === settledEntry.id
            ? {
                ...currentResolution,
                damageRollEntryId: undefined,
                rawDamage: sanitizeCombatDamage(settledEntry.roll?.total ?? 0),
                stage: 'result',
              }
            : currentResolution,
        )
      } else if (
        viewMode === 'gm' &&
        settledEntry.combat?.kind === 'attack' &&
        !processedCombatLogEntryIdsRef.current.has(settledEntry.id)
      ) {
        processedCombatLogEntryIdsRef.current.add(settledEntry.id)
        const nextResolution = createPendingCombatResolutionFromLogEntry(settledEntry)

        if (nextResolution) {
          setPendingCombatResolution(nextResolution)
          setTableFeedbackMessage(
            `Ataque recebido: ${nextResolution.attackerName} usou ${nextResolution.attackName}.`,
          )
        }
      }

      if (!isCombatRoll) {
        window.dispatchEvent(new Event('fushi:tabletop-windows-restore'))
      }
    }, 900)

    const outcome = getRollOutcome(settledEntry.roll)

    if (outcome !== 'normal') {
      if (boardImpactTimeoutRef.current !== null) {
        window.clearTimeout(boardImpactTimeoutRef.current)
      }
      setBoardImpactEvent({
        color: settledEntry.roll.visualColor,
        id: `${settledEntry.id}:${Date.now()}`,
        outcome,
      })
      boardImpactTimeoutRef.current = window.setTimeout(() => {
        setBoardImpactEvent(null)
        boardImpactTimeoutRef.current = null
      }, 3200)
    }

    settledDiceRollIdsRef.current.add(settledEntry.id)
    queuedDiceRollIdsRef.current.delete(settledEntry.id)
    activeDiceRollEntryRef.current = null
    setActiveDiceRollEntry(null)

    if (diceQueueAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(diceQueueAdvanceTimeoutRef.current)
    }

    diceQueueAdvanceTimeoutRef.current = window.setTimeout(() => {
      diceQueueAdvanceTimeoutRef.current = null
      const [nextQueuedEntry] = pendingDiceRollEntriesRef.current

      if (nextQueuedEntry) {
        startDiceRollPlayback(nextQueuedEntry)
      }
    }, 900)
  }

  function handleToggleMeasureTool() {
    setObjectMoveTargetId('')
    setObjectPlacementPresetId('')
    setSelectedObjectId('')
    setIsMeasureToolActive((currentValue) => !currentValue)
  }

  function handleTokenSelect(tokenId: string, options: { additive: boolean }) {
    const nextToken = visibleTokens.find((token) => token.id === tokenId) ?? null

    if (!nextToken) {
      return
    }

    setSelectedObjectId('')
    setObjectMoveTargetId('')

    if (
      viewMode === 'gm' &&
      pendingCombatResolution &&
      tokenId !== pendingCombatResolution.attackerTokenId &&
      !options.additive
    ) {
      setSelection([tokenId])
      setPendingCombatResolution((currentResolution) =>
        currentResolution
          ? {
              ...currentResolution,
              targetTokenId: tokenId,
            }
          : currentResolution,
      )
      setTableFeedbackMessage(`${nextToken.label} definido como alvo.`)
      return
    }

    if (viewMode === 'player') {
      if (!canActivePlayerControlToken(nextToken)) {
        return
      }

      setSelection([tokenId])
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
    if (viewMode === 'player' || (selectedTokenIds.length === 0 && !selectedObjectId)) {
      return
    }

    setSelection([])
    setSelectedObjectId('')
    setObjectMoveTargetId('')
  }

  function handleConfirm3dObjectSelection() {
    if (viewMode !== 'gm' || !selectedObjectId) {
      return
    }

    setSelectedObjectId('')
    setObjectMoveTargetId('')
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
          : selectedTokens
    const controllableTokens = canActivePlayerMoveTokens()
      ? baseMovementTokens.filter((token) => canActivePlayerControlToken(token))
      : []

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
    const worldTokenMoves = controllableTokens
      .map((token) => {
        const to = clampTabletopTokenCell(
          {
            column: token.cell.column + columnDelta,
            row: token.cell.row + rowDelta,
          },
          boardMap,
          token,
        )

        return {
          id: token.id,
          name:
            data?.characters.items.find((character) => character.id === token.characterId)
              ?.nome ?? token.label,
          from: token.cell,
          to,
        }
      })
      .filter(
        (move) =>
          move.from.column !== move.to.column || move.from.row !== move.to.row,
      )

    if (isRemotePlayerSession) {
      const remoteTokenMoves = controllableTokens.map((token) => ({
        cell: clampTabletopTokenCell(
          {
            column: token.cell.column + columnDelta,
            row: token.cell.row + rowDelta,
          },
          boardMap,
          token,
        ),
        id: token.id,
      }))

      remoteTokenMoves.forEach((move) => {
        moveRemoteToken(move.id, move.cell)
      })
      return
    }

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

    if (worldTokenMoves.length > 0) {
      appendWorldSimulationEvent(
        activeCampaignId,
        createWorldSimulationTokenMoveEvent({
          actor: activeSessionAuthorLabel,
          campaignId: activeCampaignId,
          mapId: boardMap.id,
          sceneId: boardSceneId,
          tokens: worldTokenMoves,
        }),
      )
    }
  }

  function handleBoardCellAction(cell: { column: number; row: number }) {
    if (viewMode === 'gm' && objectPlacementPresetId) {
      placeObjectPresetOnCurrentScene(objectPlacementPresetId, cell)
      return
    }

    if (viewMode === 'gm' && objectMoveTargetId) {
      const movedObject =
        boardScene?.objects?.find((object) => object.id === objectMoveTargetId) ?? null
      updateObjectOnCurrentScene(objectMoveTargetId, {
        cell,
        placement3d:
          boardMap && movedObject?.renderMode === 'three'
            ? {
                ...(movedObject.placement3d ?? {}),
                x: (cell.column + 0.5) / boardMap.gridColumns,
                y: (cell.row + 0.5) / boardMap.gridRows,
              }
            : movedObject?.placement3d,
      })
      setTableFeedbackMessage('Objeto reposicionado no mapa.')
      setObjectMoveTargetId('')
      return
    }

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

  function cloneSceneObjectsForUndo(objects: TabletopBoardObject[] = []) {
    return objects.map((object) => ({
      ...object,
      cell: { ...object.cell },
      customSize: object.customSize ? { ...object.customSize } : undefined,
      placement3d: object.placement3d ? { ...object.placement3d } : undefined,
    }))
  }

  function pushObjectUndoSnapshot() {
    if (!boardScene || viewMode !== 'gm') {
      return
    }

    if (objectUndoSceneIdRef.current !== boardSceneId) {
      objectUndoSceneIdRef.current = boardSceneId
      objectUndoStackRef.current = []
    }

    const snapshot = cloneSceneObjectsForUndo(boardScene.objects ?? [])
    const snapshotKey = JSON.stringify(snapshot)
    const lastSnapshot = objectUndoStackRef.current.at(-1)

    if (lastSnapshot && JSON.stringify(lastSnapshot) === snapshotKey) {
      return
    }

    objectUndoStackRef.current.push(snapshot)
    if (objectUndoStackRef.current.length > 40) {
      objectUndoStackRef.current.shift()
    }
  }

  function undoLastObjectSceneChange() {
    if (!boardScene || viewMode !== 'gm') {
      return
    }

    if (objectUndoSceneIdRef.current !== boardSceneId) {
      objectUndoSceneIdRef.current = boardSceneId
      objectUndoStackRef.current = []
      return
    }

    const previousObjects = objectUndoStackRef.current.pop()

    if (!previousObjects) {
      setTableFeedbackMessage('Nada para desfazer nos objetos.')
      return
    }

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.map((scene) =>
          scene.id === boardSceneId
            ? {
                ...scene,
                objects: cloneSceneObjectsForUndo(previousObjects),
              }
            : scene,
        ),
      }),
    )

    if (!previousObjects.some((object) => object.id === selectedObjectId)) {
      setSelectedObjectId('')
    }
    if (!previousObjects.some((object) => object.id === objectMoveTargetId)) {
      setObjectMoveTargetId('')
    }
    setTableFeedbackMessage('Alteracao de objeto desfeita.')
  }

  function handleSaveObjectPresetImport(data: ObjectPresetImportSaveData) {
    const nextPreset: PersistedTabletopObjectPreset = {
      id: buildLibraryItemId(
        data.libraryKind === 'animation' ? 'custom-anim' : 'custom-obj',
      ),
      libraryKind: data.libraryKind,
      name: data.name,
      label: data.label,
      description: data.description,
      objectType: data.objectType,
      renderMode: data.renderMode,
      assetUrl: data.assetUrl,
      previewImage: data.previewImage,
      modelUrl: data.modelUrl,
      color: data.color,
      size: data.size,
      placementScale: data.placementScale,
      sourceFileName: data.sourceFileName,
      modelFormat: data.modelFormat,
    }

    updateLibraryState((currentState) => ({
      ...currentState,
      customObjectPresets: [...currentState.customObjectPresets, nextPreset],
    }))
    setObjectLibraryTab(data.libraryKind === 'animation' ? 'animations' : 'objects')
    setObjectPlacementPresetId(nextPreset.id)
    setActiveHudPanel('objects')
    setTableFeedbackMessage(`${nextPreset.name} adicionado a biblioteca.`)
  }

  function createBoardObjectFromPreset(
    preset: TabletopObjectPreset,
    cell: { column: number; row: number },
    placementOverride?: NonNullable<TabletopBoardObject['placement3d']>,
  ): TabletopBoardObject {
    const previewAssetUrl =
      preset.renderMode === 'three'
        ? preset.previewImage || preset.assetUrl || undefined
        : preset.assetUrl || preset.previewImage || undefined
    const placement3d =
      boardMap && preset.renderMode === 'three'
        ? {
            x: (cell.column + 0.5) / boardMap.gridColumns,
            y: (cell.row + 0.5) / boardMap.gridRows,
            rotationY: 0,
            ...placementOverride,
            scale: placementOverride?.scale ?? preset.placementScale ?? 1,
          }
        : undefined

    return {
      id: buildLibraryItemId('obj'),
      name: preset.name,
      label: preset.label,
      description: preset.description,
      objectType: preset.objectType,
      renderMode: preset.renderMode ?? 'sprite',
      assetUrl: previewAssetUrl,
      modelUrl: preset.modelUrl,
      modelNodeName: preset.modelNodeName,
      color: preset.color,
      cell,
      size: preset.size,
      placement3d,
      visibility: 'public',
      linkedItemId: preset.id,
      interactable: true,
    }
  }

  function placeObjectPresetOnCurrentScene(
    presetId: string,
    cell: { column: number; row: number },
    placementOverride?: NonNullable<TabletopBoardObject['placement3d']>,
  ) {
    if (!boardScene || !boardMap || viewMode !== 'gm') {
      return
    }

    const preset = allObjectPresets.find((item) => item.id === presetId)

    if (!preset) {
      return
    }

    if (!isBundledObjectPresetAvailable(preset)) {
      setObjectPlacementPresetId('')
      setTableFeedbackMessage('Asset 3D opcional ausente no pacote atual.')
      return
    }

    const nextObject = createBoardObjectFromPreset(preset, cell, placementOverride)

    pushObjectUndoSnapshot()
    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.map((scene) =>
          scene.id === boardSceneId
            ? {
                ...scene,
                objects: [...(scene.objects ?? []), nextObject],
              }
            : scene,
        ),
      }),
    )
    setSelectedObjectId(nextObject.id)
    setObjectPlacementPresetId('')
    setActiveHudPanel('objects')
    setTableFeedbackMessage(`${preset.name} colocado no mapa.`)
  }

  function handle3dObjectCreateAtPlacement(input: {
    cell: { column: number; row: number }
    placement3d: NonNullable<TabletopBoardObject['placement3d']>
  }) {
    if (!objectPlacementPresetId) {
      return
    }

    placeObjectPresetOnCurrentScene(
      objectPlacementPresetId,
      input.cell,
      input.placement3d,
    )
  }

  function removeObjectFromCurrentScene(objectId: string) {
    if (!boardScene || viewMode !== 'gm') {
      return
    }

    pushObjectUndoSnapshot()
    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.map((scene) =>
          scene.id === boardSceneId
            ? {
                ...scene,
                objects: (scene.objects ?? []).filter((object) => object.id !== objectId),
              }
            : scene,
        ),
      }),
    )
    if (selectedObjectId === objectId) {
      setSelectedObjectId('')
    }
    if (objectMoveTargetId === objectId) {
      setObjectMoveTargetId('')
    }
    if (expandedObjectAdvancedId === objectId) {
      setExpandedObjectAdvancedId('')
    }
  }

  function duplicateObjectById(objectId: string) {
    const object = boardScene?.objects?.find((sceneObject) => sceneObject.id === objectId)

    if (object) {
      duplicateObjectOnCurrentScene(object)
    }
  }

  function toggleObjectVisibility(objectId: string) {
    if (!boardScene || viewMode !== 'gm') {
      return
    }

    pushObjectUndoSnapshot()
    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.map((scene) =>
          scene.id === boardSceneId
            ? {
                ...scene,
                objects: (scene.objects ?? []).map((object) =>
                  object.id === objectId
                    ? {
                        ...object,
                        visibility: object.visibility === 'public' ? 'gm' : 'public',
                      }
                    : object,
                ),
              }
            : scene,
        ),
      }),
    )
  }

  function updateObjectOnCurrentScene(
    objectId: string,
    partialObject: Partial<TabletopBoardObject>,
  ) {
    if (!boardScene || viewMode !== 'gm') {
      return
    }

    pushObjectUndoSnapshot()
    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.map((scene) =>
          scene.id === boardSceneId
            ? {
                ...scene,
                objects: (scene.objects ?? []).map((object) =>
                  object.id === objectId
                    ? {
                        ...object,
                        ...partialObject,
                      }
                    : object,
                ),
              }
            : scene,
        ),
      }),
    )
  }

  function updateObject3dPlacement(
    object: TabletopBoardObject,
    partialPlacement: Partial<NonNullable<TabletopBoardObject['placement3d']>>,
  ) {
    const fallbackX =
      object.placement3d?.x ??
      (object.cell.column + 0.5) / Math.max(1, boardMap?.gridColumns ?? 1)
    const fallbackY =
      object.placement3d?.y ??
      (object.cell.row + 0.5) / Math.max(1, boardMap?.gridRows ?? 1)
    const nextX = partialPlacement.x ?? fallbackX
    const nextY = partialPlacement.y ?? fallbackY
    const nextCell = boardMap
      ? {
          column: Math.max(
            0,
            Math.min(boardMap.gridColumns - 1, Math.floor(nextX * boardMap.gridColumns)),
          ),
          row: Math.max(
            0,
            Math.min(boardMap.gridRows - 1, Math.floor(nextY * boardMap.gridRows)),
          ),
        }
      : object.cell

    updateObjectOnCurrentScene(object.id, {
      cell: nextCell,
      placement3d: {
        ...(object.placement3d ?? {}),
        ...partialPlacement,
        x: nextX,
        y: nextY,
      },
    })
  }

  function handle3dObjectPlacementChange(
    objectId: string,
    placement3d: NonNullable<TabletopBoardObject['placement3d']>,
  ) {
    const object = boardScene?.objects?.find((sceneObject) => sceneObject.id === objectId)

    if (!object) {
      return
    }

    updateObject3dPlacement(object, placement3d)
  }

  function duplicateObjectOnCurrentScene(object: TabletopBoardObject) {
    if (!boardScene || viewMode !== 'gm') {
      return
    }

    const nextObject: TabletopBoardObject = {
      ...object,
      id: buildLibraryItemId('obj'),
      name: `${object.name} copia`,
      cell: {
        column: Math.min((boardMap?.gridColumns ?? object.cell.column + 2) - 1, object.cell.column + 1),
        row: object.cell.row,
      },
      placement3d: object.placement3d
        ? {
            ...object.placement3d,
            x:
              boardMap
                ? Math.min(0.98, object.placement3d.x + 1 / boardMap.gridColumns)
                : object.placement3d.x,
          }
        : undefined,
    }

    pushObjectUndoSnapshot()
    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        currentSceneId: currentSession.currentSceneId,
        initialSceneId: currentSession.initialSceneId,
        scenes: currentSession.scenes.map((scene) =>
          scene.id === boardSceneId
            ? {
                ...scene,
                objects: [...(scene.objects ?? []), nextObject],
              }
            : scene,
        ),
      }),
    )
    setSelectedObjectId(nextObject.id)
    setTableFeedbackMessage(`${object.name} duplicado.`)
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

    if (existingToken && nextCharacter.tipo !== 'mob') {
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

    const nextMobInstanceNumber =
      nextCharacter.tipo === 'mob'
        ? getNextMobInstanceNumber(nextCharacter.id, tokens)
        : undefined
    const nextToken = createTokenForCharacter({
      character: nextCharacter,
      existingTokens: tokens,
      instanceNumber: nextMobInstanceNumber,
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

  function duplicateMobTokenOnCurrentScene(tokenId: string) {
    if (!data || !boardMap || !boardScene || viewMode !== 'gm') {
      return
    }

    const sourceToken = boardScene.tokens.find((token) => token.id === tokenId) ?? null

    if (!sourceToken) {
      return
    }

    const sourceCharacter = data.characters.items.find(
      (character) => character.id === sourceToken.characterId && character.tipo === 'mob',
    )

    if (!sourceCharacter) {
      return
    }

    const nextToken: TabletopToken = {
      ...createTokenForCharacter({
        character: sourceCharacter,
        existingTokens: tokens,
        instanceNumber: getNextMobInstanceNumber(sourceCharacter.id, tokens),
        map: boardMap,
      }),
      customSize: sourceToken.customSize,
      size: sourceToken.size,
      visibility: sourceToken.visibility,
    }

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
          sourceCharacter.id,
        ),
      }),
    )
    setInspectedTokenId(nextToken.id)
    setTableFeedbackMessage(`${sourceCharacter.nome} duplicado como ${nextToken.label}.`)
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
    const tokenCharacter = data?.characters.items.find(
      (character) => character.id === tokenToRemove.characterId,
    )
    const isMobToken = tokenToRemove.tokenKind === 'mob' || tokenCharacter?.tipo === 'mob'

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
        removedCharacterIdsByScene: isMobToken
          ? currentSession.removedCharacterIdsByScene
          : addRemovedCharacterToScene(
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

    const character = data?.characters.items.find((item) => item.id === characterId) ?? null
    const matchingTokens = boardScene.tokens.filter(
      (token) => token.characterId === characterId,
    )
    const tokenToRemove =
      character?.tipo === 'mob'
        ? matchingTokens[matchingTokens.length - 1] ?? null
        : matchingTokens[0] ?? null

    if (!tokenToRemove) {
      return
    }

    removeTokenFromCurrentScene(tokenToRemove.id)
  }

  function handleTokenSizeChange(
    tokenId: string,
    preset: Exclude<TabletopTokenSizePreset, 'custom'>,
  ) {
    if (viewMode !== 'gm' || !boardMap) {
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
    closeSharedTransitionPlaybackState()
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
    if (panelId === 'turns' && activeHudPanel !== 'turns') {
      const currentTurnTokens = session?.turnState?.participants
        .map((participant) => participant.tokenId)
        .filter((tokenId) => tokens.some((token) => token.id === tokenId)) ?? []
      const initialTokenIds =
        currentTurnTokens.length > 0
          ? currentTurnTokens
          : selectedTokenIds.length > 0
            ? selectedTokenIds
            : []
      const activeParticipant = session?.turnState?.participants.find(
        (participant) => participant.id === session.turnState?.activeParticipantId,
      )

      setTurnDraftTokenIds(initialTokenIds)
      setTurnDraftActiveTokenId(activeParticipant?.tokenId ?? initialTokenIds[0] ?? '')
    }

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

  function getTokenStealthOwner(token: TabletopToken) {
    return (
      token.persistentControl?.playerId ??
      token.controladoPorJogadorId ??
      token.control?.primaryControllerId ??
      token.control?.controlledByPlayerIds[0] ??
      ''
    )
  }

  function handleToggleTokenStealth(tokenId: string) {
    if (viewMode !== 'gm') {
      return
    }

    const targetToken = tokens.find((token) => token.id === tokenId) ?? null

    updateCurrentScene((scene) => ({
      ...scene,
      tokens: scene.tokens.map((token) =>
        token.id === tokenId
          ? {
              ...token,
              stealth: token.stealth?.enabled
                ? undefined
                : {
                    enabled: true,
                    ownerPlayerId: getTokenStealthOwner(token) || undefined,
                  },
            }
          : token,
      ),
    }))

    if (targetToken) {
      setTableFeedbackMessage(
        targetToken.stealth?.enabled
          ? `${targetToken.label} saiu de furtividade`
          : `${targetToken.label} entrou em furtividade`,
      )
    }
  }

  function handleTurnDraftToggle(tokenId: string) {
    setTurnDraftTokenIds((currentIds) => {
      if (currentIds.includes(tokenId)) {
        const nextIds = currentIds.filter((id) => id !== tokenId)

        if (turnDraftActiveTokenId === tokenId) {
          setTurnDraftActiveTokenId(nextIds[0] ?? '')
        }

        return nextIds
      }

      if (!turnDraftActiveTokenId) {
        setTurnDraftActiveTokenId(tokenId)
      }

      return [...currentIds, tokenId]
    })
  }

  function handleTurnDraftMove(tokenId: string, direction: -1 | 1) {
    setTurnDraftTokenIds((currentIds) => {
      const currentIndex = currentIds.indexOf(tokenId)
      const nextIndex = currentIndex + direction

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentIds.length) {
        return currentIds
      }

      const nextIds = [...currentIds]
      const [movedId] = nextIds.splice(currentIndex, 1)
      nextIds.splice(nextIndex, 0, movedId)

      return nextIds
    })
  }

  function handleTurnDraftReorder(sourceTokenId: string, targetTokenId: string) {
    setTurnDraftTokenIds((currentIds) => {
      const sourceIndex = currentIds.indexOf(sourceTokenId)
      const targetIndex = currentIds.indexOf(targetTokenId)

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return currentIds
      }

      const nextIds = [...currentIds]
      const [movedId] = nextIds.splice(sourceIndex, 1)
      nextIds.splice(targetIndex, 0, movedId)

      return nextIds
    })
  }

  function handleApplyTurnDraft() {
    if (viewMode !== 'gm') {
      return
    }

    const participants = turnDraftTokenIds
      .map((tokenId) => tokens.find((token) => token.id === tokenId) ?? null)
      .filter((token): token is TabletopToken => Boolean(token))
      .map((token) => buildTurnParticipantFromToken(token))

    if (participants.length === 0) {
      setTableFeedbackMessage('Selecione pelo menos um token para os turnos.')
      return
    }

    const participantIds = new Set(participants.map((participant) => participant.id))
    const activeParticipantId = participantIds.has(turnDraftActiveTokenId)
      ? turnDraftActiveTokenId
      : participants[0].id
    const activeParticipant =
      participants.find(
        (participant) => participant.id === activeParticipantId,
      ) ?? participants[0]
    const activeRound = session?.turnState?.round ?? 1
    const statusTurnStart = resolveStatusTurnStart(
      activeParticipant,
      activeRound,
    )

    updateSession((currentSession) => {
      const previousTurnState = currentSession.turnState
      const usedActions = Object.fromEntries(
        Object.entries(previousTurnState?.usedActions ?? {}).filter(([participantId]) =>
          participantIds.has(participantId),
        ),
      ) as TabletopTurnState['usedActions']

      return createPersistedTabletopSession({
        ...currentSession,
        publicCombatImpacts: [
          ...currentSession.publicCombatImpacts.filter(
            (impact) => impact.expiresAt > Date.now(),
          ),
          ...statusTurnStart.impacts,
        ].slice(-48),
        publicCombatMarks: statusTurnStart.marks,
        turnState: {
          activeParticipantId,
          encounterId: previousTurnState?.encounterId ?? buildRuntimeEventId('turn'),
          isActive: true,
          participants,
          round: activeRound,
          updatedAt: Date.now(),
          usedActions: {
            ...usedActions,
            [activeParticipantId]: statusTurnStart.usedActions,
          },
        },
      })
    })
    setTableFeedbackMessage('Turnos aplicados.')
  }

  function handleTurnActionToggle(actionId: TabletopTurnActionId) {
    if (viewMode !== 'gm' || !turnState?.isActive || !turnState.activeParticipantId) {
      return
    }

    updateSession((currentSession) => {
      const currentTurnState = currentSession.turnState

      if (!currentTurnState?.isActive || !currentTurnState.activeParticipantId) {
        return currentSession
      }

      const activeParticipantId = currentTurnState.activeParticipantId
      const activeActions = currentTurnState.usedActions[activeParticipantId] ?? {}

      return createPersistedTabletopSession({
        ...currentSession,
        turnState: {
          ...currentTurnState,
          updatedAt: Date.now(),
          usedActions: {
            ...currentTurnState.usedActions,
            [activeParticipantId]: {
              ...activeActions,
              [actionId]: activeActions[actionId] !== true,
            },
          },
        },
      })
    })
  }

  function handleTurnFeatureAction(action: TabletopTurnFeatureAction) {
    if (!turnState?.isActive || !activeTurnParticipantView || !activeTurnCharacter) {
      return
    }

    const sourceTokenId = activeTurnParticipantView.tokenId

    if (viewMode !== 'gm' && !canControlActiveTurnParticipant) {
      return
    }

    handleTokenOpen(sourceTokenId)
    setSheetFocusRequest({
      featureId: action.feature.id,
      id: Date.now(),
      tab:
        action.source === 'ataque'
          ? 'combate'
          : action.source === 'ritual'
            ? 'rituais'
            : action.source === 'item'
              ? 'inventario'
              : 'habilidades',
    })
    setTableFeedbackMessage(`${action.label} aberta na ficha de ${activeTurnCharacter.nome}.`)
  }

  function handleTurnManeuverAction(
    maneuverId: string,
    label: string,
    timing: TabletopTurnActionId,
  ) {
    if (!turnState?.isActive || !activeTurnParticipantView || !activeTurnCharacter) {
      return
    }

    if (viewMode === 'gm') {
      markActiveTurnActionForToken(activeTurnParticipantView.tokenId, timing)
      appendLogEntry({
        author: activeSessionAuthorLabel,
        createdAt: new Date().toISOString(),
        id: buildRuntimeEventId(`maneuver-${maneuverId}`),
        text: `${activeTurnCharacter.nome} usou a manobra ${label}.`,
        type: 'system',
        visibility: 'public',
      })
      return
    }

    if (!canControlActiveTurnParticipant) {
      return
    }

    const cooldownKey = `maneuver:${maneuverId}`
    const now = Date.now()
    const cooldownUntil = turnActionRequestCooldownRef.current[cooldownKey] ?? 0

    if (cooldownUntil > now) {
      setTableFeedbackMessage('Pedido ja enviado. Aguarde alguns segundos antes de repetir.')
      return
    }

    turnActionRequestCooldownRef.current[cooldownKey] = now + 10000
    requestTurnAction({
      characterId: activeTurnCharacter.id,
      kind: 'maneuver',
      label,
      maneuverId,
      timing,
      tokenId: activeTurnParticipantView.tokenId,
    })
    setTableFeedbackMessage(`${label} enviada ao Mestre para aprovacao.`)
  }

  function handleResolveTurnActionRequest(
    request: TabletopTurnActionRequest,
    approve: boolean,
  ) {
    if (viewMode !== 'gm') {
      return
    }

    const requestEntry = logEntries.find(
      (entry) => entry.turnRequest?.id === request.id,
    )

    if (!requestEntry || requestEntry.turnRequest?.status !== 'pending') {
      return
    }

    if (approve) {
      const requestToken = tokens.find((token) => token.id === request.tokenId) ?? null
      const requestCharacter = requestToken
        ? resolveTokenCharacterForCombat(requestToken)
        : data?.characters.items.find((character) => character.id === request.characterId) ?? null

      if (
        !requestToken ||
        !requestCharacter ||
        !turnState?.isActive ||
        turnState.activeParticipantId !== request.tokenId
      ) {
        setTableFeedbackMessage('Pedido recusado: o participante nao esta no turno atual.')
        approve = false
      } else if (request.kind === 'feature' && request.featureId) {
        const feature =
          requestCharacter.habilidadesDetalhadas?.find(
            (candidate) => candidate.id === request.featureId,
          ) ??
          requestCharacter.rituais?.find(
            (candidate) => candidate.id === request.featureId,
          ) ??
          requestCharacter.ataques
            .map((attack) => ({
              automation: attack.automation,
              descricao: attack.resumo,
              id: attack.id,
              nome: attack.nome,
              tipo: 'ataque' as const,
            }))
            .find((candidate) => candidate.id === request.featureId)

        if (!feature) {
          setTableFeedbackMessage('Pedido recusado: habilidade nao encontrada na ficha canonica.')
          approve = false
        } else {
          const source = requestCharacter.rituais?.some(
            (candidate) => candidate.id === feature.id,
          )
            ? 'ritual'
            : requestCharacter.ataques.some((candidate) => candidate.id === feature.id)
              ? 'ataque'
              : 'habilidade'

          handleActivateCharacterFeature({
            character: requestCharacter,
            feature,
            source,
            tokenId: request.tokenId,
          })
        }
      } else if (request.kind === 'maneuver') {
        markActiveTurnActionForToken(request.tokenId, request.timing)
        appendLogEntry({
          author: activeSessionAuthorLabel,
          createdAt: new Date().toISOString(),
          id: buildRuntimeEventId(`approved-maneuver-${request.id}`),
          text: `${requestCharacter.nome} usou a manobra ${request.label}.`,
          type: 'system',
          visibility: 'public',
        })
      }
    }

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        logEntries: currentSession.logEntries.map((entry) =>
          entry.turnRequest?.id === request.id
            ? {
                ...entry,
                turnRequest: {
                  ...entry.turnRequest,
                  status: approve ? 'approved' : 'rejected',
                  updatedAt: Date.now(),
                },
              }
            : entry,
        ),
      }),
    )
  }

  function markActiveTurnActionForToken(
    tokenId: string,
    actionId: TabletopTurnActionId,
  ) {
    if (viewMode !== 'gm') {
      return
    }

    updateSession((currentSession) => {
      const currentTurnState = currentSession.turnState

      if (
        !currentTurnState?.isActive ||
        currentTurnState.activeParticipantId !== tokenId ||
        currentTurnState.usedActions[tokenId]?.[actionId]
      ) {
        return currentSession
      }

      return createPersistedTabletopSession({
        ...currentSession,
        turnState: {
          ...currentTurnState,
          updatedAt: Date.now(),
          usedActions: {
            ...currentTurnState.usedActions,
            [tokenId]: {
              ...currentTurnState.usedActions[tokenId],
              [actionId]: true,
            },
          },
        },
      })
    })
  }

  function resolveStatusTurnStart(
    participant: TabletopTurnParticipant,
    round: number,
  ) {
    const targetToken =
      visibleTokens.find((token) => token.id === participant.tokenId) ?? null
    const targetCharacter = resolveTokenCharacterForCombat(targetToken)
    const currentMarks = session?.publicCombatMarks ?? []
    const targetMarks = currentMarks.filter(
      (mark) =>
        mark.targetTokenId === participant.tokenId &&
        mark.lastProcessedRound !== round,
    )

    if (!targetToken || !targetCharacter || targetMarks.length === 0) {
      return {
        impacts: [] as NonNullable<
          PersistedTabletopSession['publicCombatImpacts']
        >,
        marks: currentMarks,
        usedActions: {} as Partial<Record<TabletopTurnActionId, boolean>>,
      }
    }

    const definitions = targetMarks
      .map((mark) => ({
        definition: findTabletopStatusDefinition(mark.statusId ?? mark.label),
        mark,
      }))
      .filter(
        (
          entry,
        ): entry is {
          definition: NonNullable<
            ReturnType<typeof findTabletopStatusDefinition>
          >
          mark: TabletopCombatMark
        } => Boolean(entry.definition),
      )
    const usedActions: Partial<Record<TabletopTurnActionId, boolean>> = {}
    const impacts: NonNullable<
      PersistedTabletopSession['publicCombatImpacts']
    > = []
    const statusRollEntries: TabletopLogEntry[] = []
    let damage = 0
    let healing = 0
    let fushi = 0
    const frozenParalysisSource =
      definitions.find(
        ({ definition, mark }) =>
          definition.id === 'congelado' &&
          (mark.stacks ?? 1) >= (definition.rules.maxStacks ?? 3),
      )?.mark ?? null

    definitions.forEach(({ definition, mark }) => {
      const rules = definition.rules

      if (rules.preventsTurn) {
        usedActions.fala = true
        usedActions.padrao = true
        usedActions.bonus = true
        usedActions.movimento = true
        usedActions.reacao = true
      } else {
        if (rules.preventsPrimaryAction) {
          usedActions.padrao = true
        }

        if (rules.preventsMovement) {
          usedActions.movimento = true
        }

        if (definition.id === 'exausto') {
          usedActions.bonus = true
          usedActions.reacao = true
        }
      }

      if (definition.id === 'quebrado') {
        const tiredPenalty = definitions.reduce(
          (total, entry) =>
            total + (entry.definition.rules.dicePenalty ?? 0),
          0,
        )
        const baseConfig = createCombatRollConfig({
          atributo: targetCharacter.atributos.vigor,
          bonusPericia: getCharacterSkillRollBonus(
            targetCharacter,
            'Fortitude',
          ),
        })
        const roll = createRollRecord(
          applyCombatDicePoolModifier(baseConfig, -tiredPenalty),
          `${targetCharacter.nome} - Quebrado`,
          { visualColor: definition.color },
        )

        statusRollEntries.push({
          author: targetCharacter.nome,
          createdAt: new Date().toISOString(),
          id: buildRuntimeEventId(`status-broken-${targetToken.id}`),
          roll,
          text: `${definition.label}: ${roll.resultadoTexto}. DT 15.`,
          type: 'roll',
          visibility: 'public',
        })

        if (roll.total < 15) {
          usedActions.padrao = true
          usedActions.movimento = true
        }
      }

      if (rules.continuousDamage) {
        const damageFormula =
          (definition.id === 'queimando' &&
            (mark.stacks ?? 1) >= (rules.maxStacks ?? 3)) ||
          (definition.id === 'congelado' &&
            (mark.stacks ?? 1) >= (rules.maxStacks ?? 3))
            ? rules.continuousDamage.replace(/^1d/i, '2d')
            : rules.continuousDamage
        const result = createStatusFormulaRoll(
          damageFormula,
          `${targetCharacter.nome} - ${definition.label}`,
          definition.color,
        )

        damage += result.total

        if (result.roll) {
          statusRollEntries.push({
            author: targetCharacter.nome,
            createdAt: new Date().toISOString(),
            id: buildRuntimeEventId(`status-damage-${mark.id}`),
            roll: result.roll,
            text: `${definition.label}: ${result.roll.resultadoTexto}.`,
            type: 'roll',
            visibility: 'public',
          })
        } else if (result.total > 0) {
          statusRollEntries.push({
            author: 'Mesa',
            createdAt: new Date().toISOString(),
            id: buildRuntimeEventId(`status-damage-${mark.id}`),
            text: `${targetCharacter.nome} sofreu ${result.total} de dano por ${definition.label}.`,
            type: 'system',
            visibility: 'public',
          })
        }
      }

      if (rules.healingPerTurn) {
        const result = createStatusFormulaRoll(
          rules.healingPerTurn,
          `${targetCharacter.nome} - ${definition.label}`,
          definition.color,
        )

        healing += result.total

        if (result.roll) {
          statusRollEntries.push({
            author: targetCharacter.nome,
            createdAt: new Date().toISOString(),
            id: buildRuntimeEventId(`status-heal-${mark.id}`),
            roll: result.roll,
            text: `${definition.label}: ${result.roll.resultadoTexto}.`,
            type: 'roll',
            visibility: 'public',
          })
        }
      }

      fushi += rules.fushiPerTurn ?? 0

    })

    const lifeAfterDamage = Math.max(
      0,
      targetCharacter.recursos.vidaAtual - damage,
    )
    const nextLife = Math.min(
      targetCharacter.recursos.vidaMaxima,
      lifeAfterDamage + healing,
    )
    const nextFushi = Math.min(
      targetCharacter.recursos.fushiMaximo,
      targetCharacter.recursos.fushiAtual + fushi,
    )

    if (
      nextLife !== targetCharacter.recursos.vidaAtual ||
      nextFushi !== targetCharacter.recursos.fushiAtual
    ) {
      commitCombatCharacterResourceUpdate(targetCharacter, targetToken, {
        ...targetCharacter.recursos,
        fushiAtual: nextFushi,
        vidaAtual: nextLife,
      })
    }

    const now = Date.now()

    if (damage > 0) {
      impacts.push({
        amount: Math.min(targetCharacter.recursos.vidaAtual, damage),
        createdAt: now,
        expiresAt: now + 1800,
        id: buildRuntimeEventId(`status-impact-damage-${targetToken.id}`),
        tokenId: targetToken.id,
        type: 'damage',
      })
    }

    if (healing > 0) {
      impacts.push({
        amount: Math.max(0, nextLife - lifeAfterDamage),
        createdAt: now,
        expiresAt: now + 1800,
        id: buildRuntimeEventId(`status-impact-heal-${targetToken.id}`),
        tokenId: targetToken.id,
        type: 'heal',
      })
    }

    statusRollEntries.forEach((entry) => {
      appendLogEntry(entry)
    })

    const processedMarkIds = new Set(targetMarks.map((mark) => mark.id))
    const nextMarks = currentMarks.flatMap((mark) => {
      if (!processedMarkIds.has(mark.id)) {
        return [mark]
      }

      if (mark.durationRounds === 1) {
        return []
      }

      return [
        {
          ...mark,
          durationRounds:
            typeof mark.durationRounds === 'number'
              ? mark.durationRounds - 1
              : undefined,
          lastProcessedRound: round,
        },
      ]
    })
    const paralysisDefinition = getTabletopStatusDefinition('paralisado')
    const frozenParalysisId = `automatic-frozen-paralysis-${targetToken.id}`
    const marksWithoutOldFrozenParalysis = nextMarks.filter(
      (mark) => mark.id !== frozenParalysisId,
    )

    if (
      frozenParalysisSource &&
      paralysisDefinition &&
      !marksWithoutOldFrozenParalysis.some(
        (mark) =>
          mark.targetTokenId === targetToken.id &&
          mark.statusId === 'paralisado',
      )
    ) {
      marksWithoutOldFrozenParalysis.push({
        cancelableBySource: false,
        color: paralysisDefinition.color,
        createdAt: now,
        description:
          'Paralisado enquanto Congelado permanecer com 3 Acumulos.',
        icon: paralysisDefinition.icon,
        id: frozenParalysisId,
        kind: paralysisDefinition.kind,
        label: paralysisDefinition.label,
        notes: 'automatic:frozen-stack',
        sourceCharacterId: frozenParalysisSource.sourceCharacterId,
        sourceTokenId: frozenParalysisSource.sourceTokenId,
        statusId: paralysisDefinition.id,
        targetCharacterId: targetCharacter.id,
        targetTokenId: targetToken.id,
      })
      usedActions.padrao = true
      usedActions.movimento = true
    }

    return {
      impacts,
      marks: marksWithoutOldFrozenParalysis,
      usedActions,
    }
  }

  function handleNextTurn() {
    if (viewMode !== 'gm' || !turnState?.isActive || turnState.participants.length === 0) {
      return
    }

    const currentIndex = Math.max(
      0,
      turnState.participants.findIndex(
        (participant) => participant.id === turnState.activeParticipantId,
      ),
    )
    const nextIndex = (currentIndex + 1) % turnState.participants.length
    const nextParticipant = turnState.participants[nextIndex]
    const nextRound =
      nextIndex <= currentIndex ? turnState.round + 1 : turnState.round
    const statusTurnStart = resolveStatusTurnStart(nextParticipant, nextRound)

    updateSession((currentSession) => {
      const currentTurnState = currentSession.turnState

      if (!currentTurnState?.isActive || currentTurnState.participants.length === 0) {
        return currentSession
      }

      const freshCurrentIndex = Math.max(
        0,
        currentTurnState.participants.findIndex(
          (participant) => participant.id === currentTurnState.activeParticipantId,
        ),
      )
      const freshNextIndex =
        (freshCurrentIndex + 1) % currentTurnState.participants.length
      const freshNextParticipant =
        currentTurnState.participants[freshNextIndex]
      const freshNextRound =
        freshNextIndex <= freshCurrentIndex
          ? currentTurnState.round + 1
          : currentTurnState.round

      return createPersistedTabletopSession({
        ...currentSession,
        publicCombatImpacts: [
          ...currentSession.publicCombatImpacts.filter(
            (impact) => impact.expiresAt > Date.now(),
          ),
          ...statusTurnStart.impacts,
        ].slice(-48),
        publicCombatMarks: statusTurnStart.marks,
        turnState: {
          ...currentTurnState,
          activeParticipantId: freshNextParticipant.id,
          round: freshNextRound,
          updatedAt: Date.now(),
          usedActions: {
            ...currentTurnState.usedActions,
            [freshNextParticipant.id]: statusTurnStart.usedActions,
          },
        },
      })
    })
  }

  function handlePreviousTurn() {
    if (viewMode !== 'gm' || !turnState?.isActive || turnState.participants.length === 0) {
      return
    }

    updateSession((currentSession) => {
      const currentTurnState = currentSession.turnState

      if (!currentTurnState?.isActive || currentTurnState.participants.length === 0) {
        return currentSession
      }

      const currentIndex = Math.max(
        0,
        currentTurnState.participants.findIndex(
          (participant) => participant.id === currentTurnState.activeParticipantId,
        ),
      )
      const previousIndex =
        (currentIndex - 1 + currentTurnState.participants.length) %
        currentTurnState.participants.length
      const previousParticipant = currentTurnState.participants[previousIndex]
      const previousRound =
        previousIndex > currentIndex
          ? Math.max(1, currentTurnState.round - 1)
          : currentTurnState.round

      return createPersistedTabletopSession({
        ...currentSession,
        turnState: {
          ...currentTurnState,
          activeParticipantId: previousParticipant.id,
          round: previousRound,
          updatedAt: Date.now(),
        },
      })
    })
  }

  function handleEndCombatTurns() {
    if (viewMode !== 'gm') {
      return
    }

    updateSession((currentSession) =>
      createPersistedTabletopSession({
        ...currentSession,
        turnState: null,
      }),
    )
    setTableFeedbackMessage('Combate encerrado.')
  }

  function handleBindTokenAsPlayerBody(
    tokenId: string,
    playerIds: FushiAccessProfileId[],
    originalState: TabletopOriginalConsciousnessState,
  ) {
    const controllerIds = Array.from(
      new Set(playerIds.filter(isIdentityResourceProfileId)),
    ).slice(0, 1)

    if (viewMode !== 'gm' || !data || controllerIds.length === 0) {
      return
    }

    const primaryPlayerId = controllerIds[0]
    const targetToken = tokens.find((token) => token.id === tokenId) ?? null
    const targetCharacter = targetToken
      ? getCharacterById(data, targetToken.characterId)
      : null

    if (!targetToken || !targetCharacter) {
      return
    }

    const profilesById = new Map(
      controllerIds.map((playerId) => [
        playerId,
        accessState.profiles.find(
          (entry) => entry.id === playerId && entry.role === 'player',
        ) ?? null,
      ]),
    )
    const controllerLabel =
      controllerIds
        .map((playerId) => profilesById.get(playerId)?.label ?? getShortPlayerLabel(playerId))
        .join(', ') || getShortPlayerLabel(primaryPlayerId)
    const consciousnessId =
      worldMundiState.players[primaryPlayerId]?.conscienciaId ||
      getWorldMundiConsciousnessIdForPlayer(primaryPlayerId)
    const bodyId = getWorldMundiBodyIdForCharacter(targetCharacter.id)
    const mapLocationId =
      boardScene?.mapId
        ? worldMundiState.locations.find((location) => location.mapId === boardScene.mapId)
            ?.id ?? ''
        : ''
    const existingParty =
      Object.values(worldMundiState.parties).find((party) =>
        party.memberPlayerIds.some((playerId) =>
          controllerIds.includes(playerId as IdentityResourceProfileId),
        ),
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
      jogadorControladorId: primaryPlayerId,
      jogadoresControladoresIds: controllerIds,
      npcOriginalId: targetCharacter.id,
      estadoDaConscienciaOriginal: originalState,
    })
    const nextToken = applyPersistentBodyControlToToken(targetToken, body)
    const controllerIdSet = new Set<string>(controllerIds)
    const clearControllersFromToken = (token: TabletopToken): TabletopToken => {
      if (token.id === tokenId) {
        return nextToken
      }

      const existingControllerIds = token.control?.controlledByPlayerIds ?? []
      const remainingControllerIds = existingControllerIds.filter(
        (playerId) => !controllerIdSet.has(playerId),
      )
      const nextControl =
        token.control && remainingControllerIds.length !== existingControllerIds.length
          ? {
              ...token.control,
              controlledByPlayerIds: remainingControllerIds,
              primaryControllerId: controllerIdSet.has(
                token.control.primaryControllerId ?? '',
              )
                ? remainingControllerIds[0] ?? ''
                : token.control.primaryControllerId,
              sharedControl: remainingControllerIds.length > 1,
            }
          : token.control
      const shouldClearDirectControl = controllerIdSet.has(
        token.controladoPorJogadorId ?? '',
      )
      const shouldClearPersistentControl = controllerIdSet.has(
        token.persistentControl?.playerId ?? '',
      )

      if (
        nextControl === token.control &&
        !shouldClearDirectControl &&
        !shouldClearPersistentControl
      ) {
        return token
      }

      return {
        ...token,
        control: nextControl,
        controladoPorJogadorId: shouldClearDirectControl
          ? undefined
          : token.controladoPorJogadorId,
        persistentControl: shouldClearPersistentControl
          ? undefined
          : token.persistentControl,
      }
    }

    setIdentityResourcesByBody((currentResources) => {
      const currentBodyResources = currentResources[bodyId] ?? {}
      const nextBodyResources = { ...currentBodyResources }

      controllerIds.forEach((playerId) => {
        const profile = profilesById.get(playerId) ?? null
        const sourceCharacter =
          profile?.characterId && data
            ? getCharacterById(data, profile.characterId) ?? targetCharacter
            : targetCharacter

        nextBodyResources[playerId] =
          currentBodyResources[playerId] ?? getIdentityResourcePool(sourceCharacter)
      })

      return {
        ...currentResources,
        [bodyId]: nextBodyResources,
      }
    })

    setWorldMundiState((currentState) => {
      const currentExistingParty =
        Object.values(currentState.parties).find((party) =>
          party.memberPlayerIds.some((playerId) =>
            controllerIds.includes(playerId as IdentityResourceProfileId),
          ),
        ) ?? null
      const primaryConsciousnessId =
        currentState.players[primaryPlayerId]?.conscienciaId ||
        getWorldMundiConsciousnessIdForPlayer(primaryPlayerId)
      const primaryConsciousness =
        currentState.consciencias[primaryConsciousnessId] ?? null
      const playerPartyId =
        currentExistingParty?.id ||
        primaryConsciousness?.grupoAtualId ||
        currentState.selectedPartyId ||
        'party_protagonistas'
      const nextBodies = { ...currentState.corpos }

      controllerIds.forEach((playerId) => {
        const playerConsciousnessId =
          currentState.players[playerId]?.conscienciaId ||
          getWorldMundiConsciousnessIdForPlayer(playerId)
        const existingConsciousness =
          currentState.consciencias[playerConsciousnessId] ?? null
        const previousBodyId = existingConsciousness?.corpoAtualId ?? ''

        if (!previousBodyId || previousBodyId === bodyId || !nextBodies[previousBodyId]) {
          return
        }

        const previousBody = nextBodies[previousBodyId]
        const remainingControllerIds = getWorldMundiBodyControllerIds(previousBody).filter(
          (controllerId) => controllerId !== playerId,
        )
        const remainingPrimaryPlayerId = remainingControllerIds[0] ?? ''

        nextBodies[previousBodyId] = createWorldMundiBody({
          ...previousBody,
          ocupadoPorConsciencia: remainingControllerIds.length > 0,
          conscienciaControladoraId: remainingPrimaryPlayerId
            ? getWorldMundiConsciousnessIdForPlayer(remainingPrimaryPlayerId)
            : '',
          jogadorControladorId: remainingPrimaryPlayerId,
          jogadoresControladoresIds: remainingControllerIds,
        })
      })

      nextBodies[bodyId] = body

      const nextParties = Object.fromEntries(
        Object.entries(currentState.parties).map(([partyId, party]) => {
          const filteredPlayerIds = party.memberPlayerIds.filter(
            (memberPlayerId) =>
              !controllerIds.includes(memberPlayerId as IdentityResourceProfileId),
          )
          const nextPlayerIds =
            partyId === playerPartyId
              ? Array.from(new Set([...filteredPlayerIds, ...controllerIds]))
              : filteredPlayerIds

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
        ultimoLog: `${targetCharacter.nome} agora e corpo atual de ${controllerLabel}.`,
      })
      const nextClock = currentState.clock
      const nextConsciousnesses = { ...currentState.consciencias }
      const nextPlayers = { ...currentState.players }

      controllerIds.forEach((playerId) => {
        const profile = profilesById.get(playerId) ?? null
        const existingPlayer = currentState.players[playerId]
        const playerConsciousnessId =
          currentState.players[playerId]?.conscienciaId ||
          getWorldMundiConsciousnessIdForPlayer(playerId)
        const existingConsciousness =
          currentState.consciencias[playerConsciousnessId] ?? null

        nextConsciousnesses[playerConsciousnessId] = createWorldMundiConsciousness({
          ...(existingConsciousness ?? {}),
          id: playerConsciousnessId,
          nome:
            existingConsciousness?.nome ??
            `Consciencia ${profile?.label ?? getShortPlayerLabel(playerId)}`,
          jogadorId: playerId,
          corpoAtualId: bodyId,
          grupoAtualId: playerPartyId,
        })

        nextPlayers[playerId] = createWorldMundiPlayer({
          ...(existingPlayer ?? {}),
          id: playerId,
          nome: profile?.label ?? existingPlayer?.nome ?? getShortPlayerLabel(playerId),
          conscienciaId: playerConsciousnessId,
        })
      })

      return createWorldMundiState({
        ...currentState,
        consciencias: nextConsciousnesses,
        corpos: nextBodies,
        logs: [
          createWorldMundiLogEntry({
            dia: nextClock.dia,
            hora: nextClock.hora,
            texto: `${controllerLabel} agora ocupa o corpo de ${targetCharacter.nome}.`,
            tecnico: `Vinculo persistente criado. Jogadores: ${controllerIds.join(', ')}. Corpo: ${bodyId}. NPC original: ${targetCharacter.id}. Estado original: ${originalState}.`,
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
        players: nextPlayers,
      })
    })

    controllerIds.forEach((playerId) => {
      updateAccessProfile(playerId, { characterId: targetCharacter.id })
    })

    updateCurrentScene((scene) => ({
      ...scene,
      tokens: scene.tokens.map(clearControllersFromToken),
    }))

    appendLogEntry({
      id: buildRuntimeEventId(`log-body-bind-${tokenId}-${controllerIds.join('-')}`),
      type: 'system',
      visibility: 'gm',
      author: 'Mesa',
      text: `${controllerLabel} agora ocupa o corpo de ${targetCharacter.nome}.`,
      createdAt: new Date().toISOString(),
    })
    setTableFeedbackMessage(
      `${controllerLabel} vinculado ao corpo de ${targetCharacter.nome}.`,
    )
  }

  function handleInspectorCharacterChange(nextCharacter: CharacterSheet) {
    const normalizedCharacter = normalizeCharacterSheet(nextCharacter)

    const currentLock = session?.characterEditLocks?.[normalizedCharacter.id]
    if (
      currentLock &&
      currentLock.expiresAt > Date.now() &&
      currentLock.ownerId !== currentEditOwnerId
    ) {
      setTableFeedbackMessage(`Ficha em edicao por ${currentLock.ownerLabel}.`)
      return
    }

    if (!currentLock || currentLock.mode !== 'full') {
      if (viewMode === 'gm') {
        updateSession((currentSession) =>
          createPersistedTabletopSession({
            ...currentSession,
            characterEditLocks: {
              ...currentSession.characterEditLocks,
              [normalizedCharacter.id]: {
                acquiredAt: Date.now(),
                characterId: normalizedCharacter.id,
                expiresAt: Date.now() + 10000,
                mode: 'quick',
                ownerId: 'gm',
                ownerLabel: 'Mestre',
              },
            },
          }),
        )
      } else {
        setCharacterEditLock({
          characterId: normalizedCharacter.id,
          mode: 'quick',
        })
      }
    }

    if (
      activeToken &&
      (activeToken.resourceOverride || normalizedCharacter.tipo === 'mob')
    ) {
      const nextResources = { ...normalizedCharacter.recursos }

      updateCurrentScene((scene) => ({
        ...scene,
        tokens: scene.tokens.map((token) =>
          token.id === activeToken.id
            ? {
                ...token,
                resourceOverride: nextResources,
              }
            : token,
        ),
      }))

      if (normalizedCharacter.tipo === 'mob') {
        return
      }
    }

    const identityProfileId =
      activeToken && isIdentityResourceProfileId(activeIdentityResourceProfileId)
        ? activeIdentityResourceProfileId
        : ''
    const identityProfile = identityProfileId
      ? accessState.profiles.find((profile) => profile.id === identityProfileId) ?? null
      : null
    const identityProfileCharacterId = identityProfile?.characterId ?? ''
    const shouldPersistSeparateIdentityPool =
      Boolean(identityProfileId) &&
      (!identityProfileCharacterId || identityProfileCharacterId !== normalizedCharacter.id)

    if (activeToken && identityProfileId) {
      const bodyKey = getTokenIdentityBodyKey(activeToken)

      if (shouldPersistSeparateIdentityPool) {
        setIdentityResourcesByBody((currentResources) => ({
          ...currentResources,
          [bodyKey]: {
            ...(currentResources[bodyKey] ?? {}),
            [identityProfileId]: getIdentityResourcePool(normalizedCharacter),
          },
        }))
      } else {
        setIdentityResourcesByBody((currentResources) => {
          const bodyResources = currentResources[bodyKey]

          if (!bodyResources?.[identityProfileId]) {
            return currentResources
          }

          const nextBodyResources = { ...bodyResources }
          delete nextBodyResources[identityProfileId]

          const nextResources = { ...currentResources }

          if (Object.keys(nextBodyResources).length > 0) {
            nextResources[bodyKey] = nextBodyResources
          } else {
            delete nextResources[bodyKey]
          }

          return nextResources
        })
      }
    }

    const persistentCharacter = normalizedCharacter

    if (!data) {
      commitCanonicalCharacterUpdate(persistentCharacter)
      return
    }

    const isSharedBodyHost = data.characters.items.some(
      (character) => getSharedBodyHostId(character) === persistentCharacter.id,
    )
    const sharedBodyHostId = persistentCharacter.isSharedBodyHost || isSharedBodyHost
      ? persistentCharacter.id
      : getSharedBodyHostId(persistentCharacter)

    if (!sharedBodyHostId) {
      commitCanonicalCharacterUpdate(persistentCharacter)
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
    const sharedInventoryProfile = persistentCharacter.inventarioPerfil
      ? { ...persistentCharacter.inventarioPerfil }
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
                inventarioPerfil: sharedInventoryProfile,
                recursos: {
                  ...character.recursos,
                  ...sharedVida,
                },
              })

        commitCanonicalCharacterUpdate(nextSharedCharacter)
      })
  }

  function canManageActiveCharacterStage() {
    if (viewMode !== 'gm' || !activeCharacter) {
      return false
    }

    const lock = session?.characterEditLocks?.[activeCharacter.id]

    if (lock && lock.expiresAt > Date.now() && lock.ownerId !== 'gm') {
      setTableFeedbackMessage(
        `${lock.ownerLabel} esta atualizando esta ficha. Aguarde o salvamento.`,
      )
      return false
    }

    return true
  }

  function handleCreateCharacterStage(label: string) {
    if (!canManageActiveCharacterStage() || !activeCharacter) {
      return
    }

    const nextCharacter = normalizeCharacterSheet(
      createCharacterStage(activeCharacter, label),
    )
    handleInspectorCharacterChange(nextCharacter)
    setTableFeedbackMessage(
      `Fase ${nextCharacter.stageState?.activeStageLabel ?? 'nova'} criada e ativada.`,
    )
  }

  function handleSwitchCharacterStage(stageId: string) {
    if (!canManageActiveCharacterStage() || !activeCharacter) {
      return
    }

    const nextCharacter = normalizeCharacterSheet(
      switchCharacterStage(activeCharacter, stageId),
    )

    if (nextCharacter === activeCharacter) {
      return
    }

    handleInspectorCharacterChange(nextCharacter)
    setTableFeedbackMessage(
      `Estagio ativo: ${nextCharacter.stageState?.activeStageLabel ?? 'Padrao'}.`,
    )
  }

  function handleRenameCharacterStage(stageId: string, label: string) {
    if (!canManageActiveCharacterStage() || !activeCharacter) {
      return
    }

    const nextCharacter = normalizeCharacterSheet(
      renameCharacterStage(activeCharacter, stageId, label),
    )
    handleInspectorCharacterChange(nextCharacter)
    setTableFeedbackMessage('Nome do estagio atualizado.')
  }

  function handleDeleteCharacterStage(stageId: string) {
    if (!canManageActiveCharacterStage() || !activeCharacter) {
      return
    }

    const nextCharacter = normalizeCharacterSheet(
      deleteCharacterStage(activeCharacter, stageId),
    )

    if (nextCharacter === activeCharacter) {
      return
    }

    handleInspectorCharacterChange(nextCharacter)
    setTableFeedbackMessage('Estagio arquivado removido.')
  }

  function consumeCombatReaction(token: TabletopToken) {
    const currentTurnState = session?.turnState
    const participant = currentTurnState?.participants.find(
      (entry) => entry.tokenId === token.id,
    )

    if (!currentTurnState?.isActive || !participant) {
      return true
    }

    if (currentTurnState.usedActions[participant.id]?.reacao) {
      setTableFeedbackMessage(`${participant.name} ja usou a Reacao neste ciclo.`)
      return false
    }

    updateSession((currentSession) => {
      const turn = currentSession.turnState

      if (!turn?.isActive) {
        return currentSession
      }

      const currentParticipant = turn.participants.find(
        (entry) => entry.tokenId === token.id,
      )

      if (!currentParticipant) {
        return currentSession
      }

      return createPersistedTabletopSession({
        ...currentSession,
        turnState: {
          ...turn,
          updatedAt: Date.now(),
          usedActions: {
            ...turn.usedActions,
            [currentParticipant.id]: {
              ...turn.usedActions[currentParticipant.id],
              reacao: true,
            },
          },
        },
      })
    })

    return true
  }

  function handleRollPendingCombatOpposedDefense() {
    if (
      !pendingCombatResolution ||
      pendingCombatResolution.checkTarget !== 'resistido' ||
      !pendingCombatTargetCharacter
    ) {
      return
    }

    const explicitAttribute = pendingCombatResolution.opposedAttribute
    const validAttributes: AttributeKey[] = [
      'forca',
      'agilidade',
      'intelecto',
      'presenca',
      'vigor',
    ]
    const skill = pendingCombatResolution.opposedSkill
      ? pendingCombatTargetCharacter.pericias.find(
          (item) =>
            item.nome
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]/gi, '')
              .toLocaleLowerCase('pt-BR') ===
            pendingCombatResolution.opposedSkill
              ?.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]/gi, '')
              .toLocaleLowerCase('pt-BR'),
        )
      : undefined
    const attribute =
      validAttributes.find((item) => item === explicitAttribute) ??
      skill?.atributoBase

    if (!attribute) {
      setTableFeedbackMessage('A defesa resistida precisa informar atributo ou pericia do alvo.')
      return
    }

    const roll = createRollRecord(
      createCombatRollConfig({
        atributo: pendingCombatTargetCharacter.atributos[attribute],
        bonusPericia: skill
          ? getCharacterSkillRollBonus(pendingCombatTargetCharacter, skill.nome)
          : 0,
      }),
      `Defesa resistida - ${pendingCombatTargetCharacter.nome}`,
      { visualColor: '#63b5aa' },
    )
    const opposedRollEntryId = buildRuntimeEventId(
      `roll-combat-opposed-${pendingCombatResolution.id}`,
    )

    if (
      appendLogEntry({
        id: opposedRollEntryId,
        type: 'roll',
        visibility: 'public',
        author: pendingCombatTargetCharacter.nome,
        text: roll.resultadoTexto,
        createdAt: new Date().toISOString(),
        roll,
      }) === false
    ) {
      return
    }

    setPendingCombatResolution((currentResolution) =>
      currentResolution
        ? {
            ...currentResolution,
            opposedRollEntryId,
          }
        : currentResolution,
    )
    handleRollSubmitWindowBehavior()
  }

  function handleRollPendingCombatDamage() {
    if (!pendingCombatResolution || !pendingCombatDamageRollConfig) {
      return
    }

    const roll = createRollRecord(
      pendingCombatDamageRollConfig,
      `Dano - ${pendingCombatResolution.attackName}`,
      {
        visualColor: '#ca747a',
      },
    )
    const damageRollEntryId = buildRuntimeEventId(
      `roll-combat-damage-${pendingCombatResolution.id}`,
    )

    const rollAccepted = appendLogEntry({
      id: damageRollEntryId,
      type: 'roll',
      visibility: 'public',
      author: pendingCombatResolution.attackerName,
      text: roll.resultadoTexto,
      createdAt: new Date().toISOString(),
      roll,
    })

    if (rollAccepted === false) {
      return
    }

    setPendingCombatResolution((currentResolution) =>
      currentResolution
        ? {
            ...currentResolution,
            damageRollEntryId,
          }
        : currentResolution,
    )
    handleRollSubmitWindowBehavior()
  }

  function handleResolvePendingCombat(outcome: CombatResolutionOutcome) {
    if (!pendingCombatResolution || !pendingCombatTargetToken || !pendingCombatTargetCharacter) {
      setTableFeedbackMessage('Escolha um alvo antes de resolver o ataque.')
      return
    }

    if (
      pendingCombatResolution.checkTarget === 'resistido' &&
      typeof pendingCombatResolution.opposedRollTotal !== 'number'
    ) {
      setTableFeedbackMessage('Role a defesa resistida do alvo antes de resolver o ataque.')
      return
    }

    if (outcome === 'dodge') {
      if (pendingCombatResolution.checkTarget !== 'ca') {
        setTableFeedbackMessage('Esquiva e Bloqueio reagem apenas a ataques contra CA.')
        return
      }

      if (
        typeof pendingCombatResolution.rollTotal !== 'number' ||
        typeof pendingCombatDodgeValue !== 'number'
      ) {
        setTableFeedbackMessage('Este alvo nao possui uma Esquiva fixa valida.')
        return
      }

      if (pendingCombatDodgeValue < pendingCombatResolution.rollTotal) {
        setTableFeedbackMessage('A Esquiva nao superou o total do ataque.')
        return
      }
    }

    if (outcome === 'block' && pendingCombatResolution.checkTarget !== 'ca') {
      setTableFeedbackMessage('Esquiva e Bloqueio reagem apenas a ataques contra CA.')
      return
    }

    if (
      (outcome === 'block' || outcome === 'dodge') &&
      pendingCombatTargetReactionUsed
    ) {
      setTableFeedbackMessage(
        `${pendingCombatTargetCharacter.nome} ja usou a Reacao neste ciclo.`,
      )
      return
    }

    setPendingCombatResolution((currentResolution) =>
      currentResolution
        ? {
            ...currentResolution,
            outcome,
            stage:
              (outcome === 'hit' || outcome === 'block') &&
              pendingCombatDamageRollConfig
                ? 'damage'
                : 'result',
          }
        : currentResolution,
    )

    if (outcome === 'block') {
      void playTabletopSfx('impact-metal')
    } else if (outcome === 'dodge') {
      void playTabletopSfx('select', { rate: 1.2 })
    } else if (outcome === 'miss') {
      void playTabletopSfx('error')
    }
  }

  function handleFinalizePendingCombat() {
    if (
      !pendingCombatResolution ||
      !pendingCombatResolution.outcome ||
      !pendingCombatTargetToken ||
      !pendingCombatTargetCharacter ||
      !pendingCombatAttackerToken ||
      !pendingCombatAttackerCharacter
    ) {
      setTableFeedbackMessage('Escolha e confirme o resultado antes de concluir o ataque.')
      return
    }

    const outcome = pendingCombatResolution.outcome
    const rawDamage = pendingCombatDamageBeforeDefense
    const blockValue = getCombatBlockValue(pendingCombatTargetCharacter)
    const appliedDamage = pendingCombatFinalDamage
    const previousLife = pendingCombatTargetCharacter.recursos.vidaAtual
    const nextLife = Math.max(0, previousLife - appliedDamage)
    const targetNextResources = {
      ...pendingCombatTargetCharacter.recursos,
      vidaAtual: nextLife,
    }
    const payment = canPayCharacterActionCosts(
      pendingCombatAttackerCharacter,
      pendingCombatResolution.costs,
    )

    if (!payment.ok) {
      setTableFeedbackMessage(
        `${pendingCombatAttackerCharacter.nome} nao possui mais recurso suficiente para confirmar a acao.`,
      )
      return
    }

    if (
      pendingCombatResolution.sourceFeatureResolution?.mode === 'drain-transfer' &&
      appliedDamage > 0 &&
      (!pendingCombatHealingTargetToken || !pendingCombatHealingTargetCharacter)
    ) {
      setTableFeedbackMessage('Escolha quem recebe a Vida drenada antes de confirmar.')
      return
    }

    if (
      (outcome === 'block' || outcome === 'dodge') &&
      !consumeCombatReaction(pendingCombatTargetToken)
    ) {
      return
    }

    const attackerBeforeResources = pendingCombatAttackerCharacter.recursos
    let nextAttacker = normalizeCharacterSheet(
      applyCharacterActionCosts(
        pendingCombatAttackerCharacter,
        pendingCombatResolution.costs,
      ),
    )
    const isSurgicalActivation =
      pendingCombatResolution.sourceFeatureId ===
      'training-davi-analise-cirurgica'
    const surgicalActivationStatus = isSurgicalActivation
      ? `combat:analise-cirurgica:${pendingCombatTargetToken.id}`
      : ''

    if (isSurgicalActivation && outcome === 'hit') {
      nextAttacker = normalizeCharacterSheet({
        ...nextAttacker,
        status: [
          ...nextAttacker.status.filter(
            (status) => !status.startsWith('combat:analise-cirurgica:'),
          ),
          surgicalActivationStatus,
        ],
      })
    } else if (pendingCombatUsesSurgicalAnalysis && pendingCombatSurgicalStatus) {
      nextAttacker = normalizeCharacterSheet({
        ...nextAttacker,
        status: nextAttacker.status.filter(
          (status) => status !== pendingCombatSurgicalStatus,
        ),
      })
    }

    let healingTargetNextResources =
      pendingCombatHealingTargetCharacter?.recursos ?? null
    if (pendingCombatHealingTargetCharacter && pendingCombatHealingAmount > 0) {
      const healingBaseResources =
        pendingCombatHealingTargetToken?.id === pendingCombatAttackerToken.id
          ? nextAttacker.recursos
          : pendingCombatHealingTargetToken?.id === pendingCombatTargetToken.id
            ? targetNextResources
            : pendingCombatHealingTargetCharacter.recursos

      healingTargetNextResources = {
        ...healingBaseResources,
        vidaAtual: Math.min(
          healingBaseResources.vidaMaxima,
          healingBaseResources.vidaAtual + pendingCombatHealingAmount,
        ),
      }

      if (pendingCombatHealingTargetToken?.id === pendingCombatAttackerToken.id) {
        nextAttacker = normalizeCharacterSheet({
          ...nextAttacker,
          recursos: healingTargetNextResources,
        })
      } else if (
        pendingCombatHealingTargetToken?.id === pendingCombatTargetToken.id
      ) {
        targetNextResources.vidaAtual = healingTargetNextResources.vidaAtual
      }
    }

    if (
      pendingCombatAttackerToken.resourceOverride ||
      pendingCombatAttackerCharacter.tipo === 'mob'
    ) {
      commitCombatCharacterResourceUpdate(
        pendingCombatAttackerCharacter,
        pendingCombatAttackerToken,
        nextAttacker.recursos,
      )
    } else {
      commitCanonicalCharacterUpdate(nextAttacker)
    }

    if (
      appliedDamage > 0 ||
      (healingTargetNextResources &&
        pendingCombatHealingTargetToken?.id === pendingCombatTargetToken.id)
    ) {
      commitCombatCharacterResourceUpdate(
        pendingCombatTargetCharacter,
        pendingCombatTargetToken,
        targetNextResources,
      )
    }

    if (
      pendingCombatHealingTargetCharacter &&
      pendingCombatHealingTargetToken &&
      healingTargetNextResources &&
      pendingCombatHealingTargetToken.id !== pendingCombatAttackerToken.id &&
      pendingCombatHealingTargetToken.id !== pendingCombatTargetToken.id
    ) {
      commitCombatCharacterResourceUpdate(
        pendingCombatHealingTargetCharacter,
        pendingCombatHealingTargetToken,
        healingTargetNextResources,
      )
    }

    const targetLifeAfterResolution = targetNextResources.vidaAtual
    const outcomeLabel =
      outcome === 'hit'
        ? 'acerto'
        : outcome === 'block'
          ? 'bloqueio'
          : outcome === 'dodge'
            ? 'esquiva'
            : 'erro'
    const criticalText = pendingCombatResolution.isCritical
      ? ` Critico V2: dados de dano dobrados (${pendingCombatDamageFormula}).`
      : ''
    const dodgeText =
      outcome === 'dodge'
        ? ` Esquiva fixa ${pendingCombatDodgeValue} vs ataque ${pendingCombatResolution.rollTotal}.`
        : ''

    if (
      pendingCombatGuardianReduction > 0 &&
      pendingCombatGuardianPassiveKey &&
      (outcome === 'hit' || outcome === 'block')
    ) {
      setConsumedCombatPassives((currentState) => ({
        ...currentState,
        [pendingCombatGuardianPassiveKey]: true,
      }))
    }

    if (pendingCombatResolution.turnActionId) {
      markActiveTurnActionForToken(
        pendingCombatAttackerToken.id,
        pendingCombatResolution.turnActionId,
      )
    }

    const attackerPlayerIds = getTokenPlayerIds(pendingCombatAttackerToken)
    const targetPlayerIds = getTokenPlayerIds(pendingCombatTargetToken)
    const healingPlayerIds = getTokenPlayerIds(pendingCombatHealingTargetToken)
    const visibleToPlayerIds = Array.from(
      new Set([...attackerPlayerIds, ...targetPlayerIds, ...healingPlayerIds]),
    )
    const resourceChangesByPlayerId: Record<
      string,
      TabletopCombatResourceChange[]
    > = {}
    const attackerResourceChanges = pendingCombatResolution.costs.flatMap((cost) => {
      const key =
        cost.resource === 'vida'
          ? 'vidaAtual'
          : cost.resource === 'fushi'
            ? 'fushiAtual'
            : 'determinacaoAtual'
      const label =
        cost.resource === 'vida'
          ? 'Vida'
          : cost.resource === 'fushi'
            ? 'FUSHI'
            : 'Determinacao'

      return [{
        after: nextAttacker.recursos[key],
        before: attackerBeforeResources[key],
        label,
      }]
    })

    attackerPlayerIds.forEach((playerId) => {
      resourceChangesByPlayerId[playerId] = [...attackerResourceChanges]
    })
    targetPlayerIds.forEach((playerId) => {
      resourceChangesByPlayerId[playerId] = [
        ...(resourceChangesByPlayerId[playerId] ?? []),
        { after: targetNextResources.vidaAtual, before: previousLife, label: 'Vida' },
      ]
    })
    if (
      pendingCombatHealingTargetCharacter &&
      healingTargetNextResources &&
      pendingCombatHealingTargetToken
    ) {
      healingPlayerIds.forEach((playerId) => {
        resourceChangesByPlayerId[playerId] = [
          ...(resourceChangesByPlayerId[playerId] ?? []),
          {
            after: healingTargetNextResources?.vidaAtual ?? 0,
            before: pendingCombatHealingTargetCharacter.recursos.vidaAtual,
            label: 'Vida curada',
          },
        ]
      })
    }

    const receiptSummary =
      outcome !== 'hit' && outcome !== 'block'
        ? `${pendingCombatResolution.attackerName} usou ${pendingCombatResolution.attackName} contra ${pendingCombatTargetCharacter.nome}: ${outcomeLabel}.`
        : pendingCombatResolutionMode === 'drain-transfer'
          ? `${pendingCombatResolution.attackerName} causou ${pendingCombatFinalDamage} de dano em ${pendingCombatTargetCharacter.nome}, drenou ${pendingCombatEffectiveDamage} de Vida e curou ${pendingCombatHealingTargetCharacter?.nome ?? 'ninguem'} em ${pendingCombatEffectiveHealing}.`
          : pendingCombatResolutionMode === 'heal'
            ? `${pendingCombatResolution.attackerName} curou ${pendingCombatHealingTargetCharacter?.nome ?? pendingCombatTargetCharacter.nome} em ${pendingCombatEffectiveHealing}.`
            : `${pendingCombatResolution.attackerName} causou ${pendingCombatEffectiveDamage} de dano em ${pendingCombatTargetCharacter.nome}.`
    const isAbilityResolution = Boolean(
      pendingCombatResolution.sourceFeatureId &&
      pendingCombatAttackerCharacter.habilidadesDetalhadas?.some(
        (feature) =>
          feature.id === pendingCombatResolution.sourceFeatureId,
      ),
    )
    const resolvedSourceFeature = pendingCombatResolution.sourceFeatureId
      ? getCharacterCombatActions(pendingCombatAttackerCharacter).find(
          (action) =>
            action.feature.id === pendingCombatResolution.sourceFeatureId,
        )?.feature ?? null
      : null
    const resolvedTargetStatusEffects =
      (resolvedSourceFeature?.automation?.effects ?? []).filter(
        (effect): effect is CharacterActionStatusEffect =>
          effect.type === 'status' &&
          effect.target === 'target',
      )

    updateSession((currentSession) => {
      const now = Date.now()
      const impacts = [
        ...currentSession.publicCombatImpacts.filter(
          (impact) => impact.expiresAt > now,
        ),
        {
          createdAt: now,
          expiresAt: now + 1800,
          id: buildRuntimeEventId('combat-impact-attacker'),
          tokenId: pendingCombatAttackerToken.id,
          type: 'attack' as const,
        },
        ...(isAbilityResolution
          ? [{
              createdAt: now,
              expiresAt: now + 2100,
              id: buildRuntimeEventId('combat-impact-ability'),
              tokenId: pendingCombatAttackerToken.id,
              type:
                outcome === 'hit' || outcome === 'block'
                  ? 'ability-success' as const
                  : 'ability-failure' as const,
            }]
          : []),
        ...(appliedDamage > 0
          ? [{
              amount: pendingCombatEffectiveDamage,
              createdAt: now,
              expiresAt: now + 1800,
              id: buildRuntimeEventId('combat-impact-damage'),
              tokenId: pendingCombatTargetToken.id,
              type: 'damage' as const,
            }]
          : []),
        ...(pendingCombatHealingTargetToken && pendingCombatEffectiveHealing > 0
          ? [{
              amount: pendingCombatEffectiveHealing,
              createdAt: now,
              expiresAt: now + 1800,
              id: buildRuntimeEventId('combat-impact-heal'),
              tokenId: pendingCombatHealingTargetToken.id,
              type: 'heal' as const,
            }]
          : []),
      ]
      const nextDeathStates = { ...currentSession.playerDeathStates }

      if (targetPlayerIds.length > 0 && targetLifeAfterResolution <= 0) {
        nextDeathStates[pendingCombatTargetToken.id] = {
          failures: 0,
          results: [null, null, null],
          status: 'down',
          successes: 0,
          tokenId: pendingCombatTargetToken.id,
          updatedAt: now,
        }
      } else if (targetLifeAfterResolution >= 2) {
        delete nextDeathStates[pendingCombatTargetToken.id]
      }

      let marks = currentSession.publicCombatMarks.filter(
        (mark) =>
          !(
            pendingCombatUsesSurgicalAnalysis &&
            mark.sourceTokenId === pendingCombatAttackerToken.id &&
            mark.targetTokenId === pendingCombatTargetToken.id
          ),
      )

      if (isSurgicalActivation && outcome === 'hit') {
        marks.push({
          cancelableBySource: true,
          color: '#f2cc48',
          createdAt: now,
          description:
            `O proximo ataque de ${pendingCombatResolution.attackerName} contra ` +
            `${pendingCombatTargetCharacter.nome} dobra o dano antes de aplicar penalidades negativas.`,
          id: surgicalActivationStatus,
          icon: 'science',
          kind: 'mark',
          label: 'Analise Cirurgica',
          sourceCharacterId: pendingCombatAttackerCharacter.id,
          sourceFeatureId: pendingCombatResolution.sourceFeatureId,
          sourceTokenId: pendingCombatAttackerToken.id,
          targetCharacterId: pendingCombatTargetCharacter.id,
          targetTokenId: pendingCombatTargetToken.id,
        })
      }

      if (
        (outcome === 'hit' || outcome === 'block') &&
        resolvedTargetStatusEffects.length > 0
      ) {
        const targetIsVaccinated = marks.some(
          (mark) =>
            mark.targetTokenId === pendingCombatTargetToken.id &&
            mark.statusId === 'vacina',
        )

        resolvedTargetStatusEffects.forEach((effect) => {
          const definition = findTabletopStatusDefinition(
            effect.statusId ?? effect.status,
          )

          if (!definition) {
            return
          }

          if (effect.mode === 'remove') {
            marks = marks.filter(
              (mark) =>
                !(
                  mark.targetTokenId === pendingCombatTargetToken.id &&
                  mark.statusId === definition.id
                ),
            )
            return
          }

          if (targetIsVaccinated && definition.id !== 'vacina') {
            return
          }

          if (definition.id === 'vacina') {
            marks = marks.filter(
              (mark) =>
                mark.targetTokenId !== pendingCombatTargetToken.id ||
                !mark.statusId,
            )
          } else {
            marks = marks.filter(
              (mark) =>
                !(
                  mark.targetTokenId === pendingCombatTargetToken.id &&
                  mark.sourceTokenId === pendingCombatAttackerToken.id &&
                  mark.statusId === definition.id
                ),
            )
          }

          marks.push({
            cancelableBySource:
              effect.cancelableBySource === true ||
              definition.id === 'especial-buff' ||
              definition.id === 'especial-debuff',
            color: definition.color,
            createdAt: now,
            description: definition.effect,
            durationRounds:
              effect.durationRounds ?? definition.defaultDurationRounds,
            icon: definition.icon,
            id: buildRuntimeEventId(`combat-status-${definition.id}`),
            kind: definition.kind,
            label: definition.label,
            sourceCharacterId: pendingCombatAttackerCharacter.id,
            sourceFeatureId: pendingCombatResolution.sourceFeatureId,
            sourceTokenId: pendingCombatAttackerToken.id,
            stacks: Math.min(
              definition.rules.maxStacks ?? 99,
              Math.max(1, effect.stacks ?? 1),
            ),
            statusId: definition.id,
            targetCharacterId: pendingCombatTargetCharacter.id,
            targetTokenId: pendingCombatTargetToken.id,
          })
        })
      }

      const receipt: TabletopCombatReceipt = {
        attackerName: pendingCombatResolution.attackerName,
        createdAt: now,
        damageApplied: pendingCombatEffectiveDamage,
        healingApplied: pendingCombatEffectiveHealing,
        id: buildRuntimeEventId('combat-receipt'),
        outcome,
        resourceChangesByPlayerId,
        sceneId: currentSceneId,
        summary: receiptSummary,
        targetName: pendingCombatTargetCharacter.nome,
        visibleToPlayerIds,
      }

      return createPersistedTabletopSession({
        ...currentSession,
        playerDeathStates: nextDeathStates,
        publicCombatImpacts: impacts,
        publicCombatMarks: marks,
        publicCombatReceipt: visibleToPlayerIds.length > 0 ? receipt : null,
      })
    })

    appendLogEntry({
      id: buildRuntimeEventId(`log-combat-resolution-${pendingCombatResolution.id}`),
      type: 'system',
      visibility: 'gm',
      author: 'Combate',
      text:
        `${pendingCombatResolution.attackerName} resolveu ${pendingCombatResolution.attackName} contra ` +
        `${pendingCombatTargetCharacter.nome}: ${outcomeLabel}. ` +
        (outcome === 'block'
          ? `Dano antes do bloqueio ${rawDamage}, bloqueio ${blockValue}, aplicado ${appliedDamage}.`
          : outcome === 'hit'
            ? `Dano aplicado ${appliedDamage}.`
            : 'Nenhum dano aplicado.') +
        criticalText +
        dodgeText +
        ` Vida: ${previousLife} -> ${nextLife}/${pendingCombatTargetCharacter.recursos.vidaMaxima}.`,
      createdAt: new Date().toISOString(),
    })

    setTableFeedbackMessage(
      `${pendingCombatResolution.attackName}: ${outcomeLabel} em ${pendingCombatTargetCharacter.nome}.`,
    )
    setPendingCombatResolution(null)
  }

  function handlePrepareCharacterFeature(
    request: CharacterFeatureActivationRequest,
  ) {
    const sourceToken =
      visibleTokens.find((token) => token.id === request.tokenId) ??
      visibleTokens.find((token) => token.id === sheetActionTokenId) ??
      visibleTokens.find((token) => token.characterId === request.character.id) ??
      null

    if (!sourceToken) {
      setTableFeedbackMessage(
        `Coloque ${request.character.nome} na cena antes de preparar ${request.feature.nome}.`,
      )
      return
    }

    setCombatFocusRequest({
      featureId: request.feature.id,
      id: Date.now(),
      sourceTokenId: sourceToken.id,
    })
    setInspectedTokenId('')
    setActiveUtilityWindow('log')
    setTableFeedbackMessage(
      `${request.feature.nome} preparada. Escolha alvo e forma de uso em Dados de combate.`,
    )
  }

  function handleActivateCharacterFeature({
    character,
    checkOptionId,
    combatSnapshot,
    feature,
    source,
    targetTokenId,
    tokenId,
  }: CharacterFeatureActivationRequest) {
    const automation = feature.automation

    if (!automation) {
      setTableFeedbackMessage(`${feature.nome} ainda nao tem mecanica cadastrada.`)
      return
    }

    const combatSourceToken =
      tokens.find((token) => token.id === tokenId) ??
      tokens.find((token) => token.id === sheetActionTokenId) ??
      activeToken ??
      null
    const currentCharacter =
      resolveTokenCharacterForCombat(combatSourceToken) ??
      data?.characters.items.find((item) => item.id === character.id) ??
      character
    const combatTargetToken =
      tokens.find((token) => token.id === targetTokenId && token.id !== combatSourceToken?.id) ??
      selectedTokens.find((token) => token.id !== combatSourceToken?.id) ??
      null
    const selectedCheckOption = resolveCombatCheckOption({
      checkOptionId,
      feature,
      sourceCell: combatSourceToken?.cell,
      targetCell: combatTargetToken?.cell,
    })
    const sourceCell = combatSnapshot?.sourceCell ?? combatSourceToken?.cell
    const targetCell = combatSnapshot?.targetCell ?? combatTargetToken?.cell
    const distanceSquares =
      combatSnapshot?.distanceSquares ??
      (sourceCell && targetCell
        ? calculateCombatAction({
            character: currentCharacter,
            checkOptionId: selectedCheckOption?.id,
            feature,
            source,
            sourceCell,
            targetCell,
          }).distanceSquares
        : null)
    const rangeValidation = validateCombatRange({
      checkOption: selectedCheckOption,
      distanceSquares,
      feature,
    })

    if (combatTargetToken && !rangeValidation.isInRange) {
      setTableFeedbackMessage(rangeValidation.reason)
      return
    }

    if (feature.id === 'training-davi-analise-cirurgica') {
      if (!combatTargetToken) {
        setTableFeedbackMessage('Escolha o alvo da Analise Cirurgica antes de ativar.')
        return
      }

      if (
        currentCharacter.status.some((status) =>
          status.startsWith('combat:analise-cirurgica:'),
        )
      ) {
        setTableFeedbackMessage(
          'Analise Cirurgica ja esta ativa. Resolva o proximo ataque antes de usar novamente.',
        )
        return
      }
    }

    const costs = automation.costs ?? []
    const effects = automation.effects ?? []
    const payment = canPayCharacterActionCosts(currentCharacter, costs)

    if (!payment.ok) {
      const missingResources = Array.from(
        new Set(
          payment.missing.map((cost) =>
            cost.resource === 'vida'
              ? 'Vida'
              : cost.resource === 'fushi'
                ? 'FUSHI'
                : 'Determinacao',
          ),
        ),
      )
      setTableFeedbackMessage(
        `${currentCharacter.nome} esta sem ${missingResources.join(' e ')} para ${feature.nome}.`,
      )
      appendLogEntry({
        id: buildRuntimeEventId(`log-action-denied-${feature.id}`),
        type: 'system',
        visibility: 'gm',
        author: 'Mesa',
        text: `${currentCharacter.nome} tentou ativar ${feature.nome}, mas falta recurso.`,
        createdAt: new Date().toISOString(),
      })
      return
    }

    const baseRollConfig = getCharacterActionRollConfig(
      feature,
      currentCharacter,
      selectedCheckOption?.id ?? checkOptionId,
    )
    const actionAttribute =
      selectedCheckOption?.atributo ??
      feature.automation?.combat?.teste?.atributo
    const isPhysicalAction =
      actionAttribute === 'forca' ||
      actionAttribute === 'agilidade' ||
      actionAttribute === 'vigor'
    const activeStatusDicePenalty = combatSourceToken
      ? (session?.publicCombatMarks ?? [])
          .filter((mark) => mark.targetTokenId === combatSourceToken.id)
          .reduce((total, mark) => {
            const definition = findTabletopStatusDefinition(
              mark.statusId ?? mark.label,
            )

            return (
              total +
              (definition?.rules.dicePenalty ?? 0) +
              (isPhysicalAction
                ? definition?.rules.physicalDicePenalty ?? 0
                : 0)
            )
          }, 0)
      : 0
    const dicePoolPenalty =
      getCombatRollDicePenalty({
        checkOption: selectedCheckOption,
        distanceSquares,
        feature,
      }) - activeStatusDicePenalty
    const rollConfig = baseRollConfig
      ? applyCombatDicePoolModifier(baseRollConfig, dicePoolPenalty)
      : null
    const author = currentCharacter.nome
    const sourceLabel =
      source === 'ritual'
        ? 'Ritual'
        : source === 'ataque'
          ? 'Ataque'
          : source === 'item'
            ? 'Item'
            : 'Habilidade'
    const publicText =
      automation.publicText?.trim() ||
      `${author} ativou ${sourceLabel.toLowerCase()}: ${feature.nome}.`
    const gmCostText = costs.length > 0 ? ` Custo: ${getCharacterActionCostsLabel(feature)}.` : ''
    const activationLabel = getCharacterActionActivationLabel(feature)
    const gmActivationText = activationLabel ? ` ${activationLabel}.` : ''
    const characterAfterCosts =
      costs.length > 0
        ? applyCharacterActionCosts(currentCharacter, costs)
        : currentCharacter
    const effectApplication = applyCharacterActionEffects(characterAfterCosts, effects)
    const gmEffectText =
      effectApplication.appliedLabels.length > 0
        ? ` Efeito: ${getCharacterActionEffectsLabel(feature)}.`
        : ''
    const gmText =
      automation.gmText?.trim() ||
      `${author} ativou ${sourceLabel.toLowerCase()}: ${feature.nome}.${gmCostText}${gmActivationText}${gmEffectText}`

    let actionRoll: ReturnType<typeof createRollRecord> | null = null
    let actionLogEntryId = ''
    const combatCalculation = calculateCombatAction({
      character: currentCharacter,
      checkOptionId: selectedCheckOption?.id,
      feature,
      source,
      sourceCell,
      targetCell,
    })
    const damageContexts = combatCalculation.contexts
    const damageFormula = combatCalculation.damageFormula
    const actionCheck = automation.combat?.teste
    const hasTransactionalDamage = Boolean(combatCalculation.damageFormula)
    const hasTransactionalResolution =
      hasTransactionalDamage ||
      feature.id === 'training-davi-analise-cirurgica' ||
      Boolean(automation.combat?.resolucao)
    const nextActionCharacter = normalizeCharacterSheet(effectApplication.character)
    const baseCombatPayload: TabletopCombatLogPayload | undefined =
      combatSourceToken && hasTransactionalResolution
        ? {
            attackerCharacterId: currentCharacter.id,
            attackerName: currentCharacter.nome,
            attackerTokenId: combatSourceToken.id,
            attackName: feature.nome,
            baseDamageFormula:
              combatCalculation.baseDamageFormula || damageFormula || '0',
            buildDamageBonus: combatCalculation.buildDamageBonus,
            checkDifficulty: actionCheck?.dificuldade,
            checkTarget: actionCheck?.alvo ?? 'ca',
            costs,
            damageContexts,
            damageFormula: damageFormula || '0',
            distanceMeters: combatCalculation.distanceMeters,
            distanceSquares: combatCalculation.distanceSquares,
            kind: 'attack',
            opposedAttribute: actionCheck?.oposto?.atributo,
            opposedSkill: actionCheck?.oposto?.pericia,
            sourceFeatureId: feature.id,
            sourceFeatureResolution: automation.combat?.resolucao,
            sourceCell: sourceCell ? { ...sourceCell } : undefined,
            targetCell: targetCell ? { ...targetCell } : undefined,
            targetTokenId: combatTargetToken?.id,
            turnActionId: getTurnActionIdForFeature(feature),
          }
        : undefined

    if (rollConfig) {
      const roll = createRollRecord(
        rollConfig,
        selectedCheckOption?.label ||
          automation.roll?.contexto?.trim() ||
          feature.nome,
        {
          visualColor:
            automation.roll?.visualColor ||
            automation.visualColor ||
            '#d8a34d',
        },
      )
      actionRoll = roll
      actionLogEntryId = buildRuntimeEventId(`roll-feature-${feature.id}`)
      const combatPayload = baseCombatPayload
      ? {
            ...baseCombatPayload,
            isCritical: isCriticalAttackRoll(roll),
            rollBase: roll.resultadoBase,
            rollText: roll.resultadoTexto,
            rollTotal: roll.total,
          }
        : undefined

      const rollAccepted = appendLogEntry({
        id: actionLogEntryId,
        type: 'roll',
        visibility: automation.roll?.visibility ?? 'public',
        author,
        text: `${publicText} ${roll.resultadoTexto}`,
        createdAt: new Date().toISOString(),
        roll,
        combat: combatPayload,
      })

      if (rollAccepted === false) {
        return
      }
      handleRollSubmitWindowBehavior()
    } else {
      actionLogEntryId = buildRuntimeEventId(`log-feature-${feature.id}`)
      appendLogEntry({
        id: actionLogEntryId,
        type: 'system',
        visibility: 'public',
        author,
        text: publicText,
        createdAt: new Date().toISOString(),
        combat: baseCombatPayload,
      })
    }

    if (
      !hasTransactionalResolution &&
      (costs.length > 0 || effectApplication.appliedLabels.length > 0)
    ) {
      handleInspectorCharacterChange(
        nextActionCharacter,
      )
    }

    if (viewMode === 'gm' && baseCombatPayload && !actionRoll) {
      const suggestedTarget =
        combatTargetToken ??
        selectedTokens.find((token) => token.id !== baseCombatPayload.attackerTokenId) ??
        null

      processedCombatLogEntryIdsRef.current.add(actionLogEntryId)
      setPendingCombatResolution({
        attackerCharacterId: baseCombatPayload.attackerCharacterId,
        attackerName: baseCombatPayload.attackerName,
        attackerTokenId: baseCombatPayload.attackerTokenId,
        attackName: baseCombatPayload.attackName,
        baseDamageFormula:
          baseCombatPayload.baseDamageFormula ?? baseCombatPayload.damageFormula,
        buildDamageBonus: baseCombatPayload.buildDamageBonus ?? 0,
        checkDifficulty: baseCombatPayload.checkDifficulty,
        checkTarget: baseCombatPayload.checkTarget ?? 'ca',
        costs: baseCombatPayload.costs ?? [],
        damageContexts: baseCombatPayload.damageContexts ?? [],
        damageFormula: baseCombatPayload.damageFormula,
        distanceMeters: baseCombatPayload.distanceMeters ?? null,
        distanceSquares: baseCombatPayload.distanceSquares ?? null,
        id: actionLogEntryId,
        isCritical: false,
        rawDamage: 0,
        rollText: undefined,
        rollTotal: undefined,
        opposedAttribute: baseCombatPayload.opposedAttribute,
        opposedSkill: baseCombatPayload.opposedSkill,
        sourceCell: baseCombatPayload.sourceCell,
        sourceFeatureId: baseCombatPayload.sourceFeatureId,
        sourceFeatureResolution: baseCombatPayload.sourceFeatureResolution,
        stage: 'defense',
        targetCell: baseCombatPayload.targetCell,
        targetTokenId: suggestedTarget?.id ?? '',
        turnActionId: baseCombatPayload.turnActionId,
      })
    }

    if (viewMode === 'gm' && gmText !== publicText) {
      appendLogEntry({
        id: buildRuntimeEventId(`log-feature-gm-${feature.id}`),
        type: 'system',
        visibility: 'gm',
        author,
        text: gmText,
        createdAt: new Date().toISOString(),
      })
    }

    const turnActionId = getTurnActionIdForFeature(feature)
    const actionToken =
      combatSourceToken ?? tokens.find((token) => token.id === sheetActionTokenId) ?? null

    if (turnActionId && actionToken && !hasTransactionalResolution) {
      markActiveTurnActionForToken(actionToken.id, turnActionId)
    }

    setTableFeedbackMessage(`${feature.nome} ativada.`)
  }

  useEffect(() => {
    function handleUndoShortcut(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') {
        return
      }

      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      undoLastObjectSceneChange()
    }

    window.addEventListener('keydown', handleUndoShortcut, true)

    return () => {
      window.removeEventListener('keydown', handleUndoShortcut, true)
    }
  })

  const activeDiceRollRecord = activeDiceRollEntry?.roll ?? null
  const isDiceRollLocked = Boolean(activeDiceRollEntry) || pendingDiceRollEntries.length > 0
  const diceRollLockLabel = activeDiceRollEntry
    ? `${activeDiceRollEntry.author} - ${activeDiceRollEntry.roll?.contexto ?? 'rolagem'}`
    : pendingDiceRollEntries[0]
      ? `${pendingDiceRollEntries[0].author} - ${pendingDiceRollEntries[0].roll?.contexto ?? 'rolagem'}`
      : ''
  const diceRollQueueLabels = pendingDiceRollEntries
    .map((entry, index) => `${index + 1}. ${entry.author || entry.roll?.contexto || 'Mesa'}`)
  const rollToastRecord = rollToastEntry?.roll ?? null
  const rollToastOutcome = rollToastRecord ? getRollOutcome(rollToastRecord) : 'normal'
  const multiplayerDiagnosticPlayers =
    multiplayerConnectionStatus === 'hosting'
      ? multiplayerHostStatus?.clients ?? multiplayerConnectedPlayers
      : multiplayerConnectedPlayers
  const multiplayerDiagnosticPingLabel =
    multiplayerNetworkLatencyMs !== null
      ? `${multiplayerNetworkLatencyMs} ms`
      : multiplayerConnectionStatus === 'hosting'
        ? 'local'
        : '--'
  const multiplayerDiagnosticStatusLabel = getDiagnosticStatusLabel(
    multiplayerDiagnostics.lastActionStatus,
  )
  const multiplayerDiagnosticTone =
    multiplayerDiagnostics.lastActionStatus === 'confirmed'
      ? 'steady'
      : multiplayerDiagnostics.lastActionStatus === 'retrying' ||
          multiplayerDiagnostics.pendingActions > 0
        ? 'watch'
        : multiplayerDiagnostics.lastActionStatus === 'rejected' ||
            multiplayerDiagnostics.lastActionStatus === 'offline'
          ? 'critical'
          : 'steady'
  const desktopAppInfo = window.fushiDesktop?.getAppInfo() ?? null
  const activeCampaignName =
    data?.campaigns.items.find((campaign) => campaign.id === activeCampaignId)?.nome ??
    activeCampaignId
  const multiplayerDiagnosticRiskItems = [
    {
      label: 'Conexao',
      status:
        multiplayerConnectionStatus === 'hosting' ||
        multiplayerConnectionStatus === 'connected'
          ? 'steady'
          : multiplayerConnectionStatus === 'error'
            ? 'critical'
            : 'watch',
      text:
        multiplayerConnectionStatus === 'hosting'
          ? 'Mestre hospedando.'
          : multiplayerConnectionStatus === 'connected'
            ? 'Jogador conectado.'
            : multiplayerConnectionStatus === 'error'
              ? 'Conexao em erro.'
              : 'Sem sessao online ativa.',
    },
    {
      label: 'Fila remota',
      status:
        multiplayerDiagnostics.pendingActions === 0
          ? 'steady'
          : multiplayerDiagnostics.pendingActions <= 2
            ? 'watch'
            : 'critical',
      text:
        multiplayerDiagnostics.pendingActions === 0
          ? 'Sem comando aguardando ACK.'
          : `${multiplayerDiagnostics.pendingActions} comando(s) aguardando ACK.`,
    },
    {
      label: 'Socket',
      status:
        multiplayerConnectionStatus === 'hosting' ||
        multiplayerDiagnostics.socketState === 'open'
          ? 'steady'
          : multiplayerDiagnostics.socketState === 'connecting'
            ? 'watch'
            : 'critical',
      text:
        multiplayerConnectionStatus === 'hosting'
          ? 'Host local ativo.'
          : `Socket ${multiplayerDiagnostics.socketState}.`,
    },
    {
      label: 'Reconexao',
      status:
        multiplayerDiagnostics.reconnectAttempts === 0
          ? 'steady'
          : multiplayerDiagnostics.reconnectAttempts <= 2
            ? 'watch'
            : 'critical',
      text:
        multiplayerDiagnostics.reconnectAttempts === 0
          ? 'Sem reconexao registrada neste cliente.'
          : `${multiplayerDiagnostics.reconnectAttempts} tentativa(s) de reconexao.`,
    },
    {
      label: 'Ordem de estado',
      status:
        multiplayerDiagnostics.staleStatesIgnored === 0
          ? 'steady'
          : multiplayerDiagnostics.staleStatesIgnored <= 2
            ? 'watch'
            : 'critical',
      text:
        multiplayerDiagnostics.staleStatesIgnored === 0
          ? `Snapshot v${multiplayerDiagnostics.stateVersion || '--'} sem regressao.`
          : `${multiplayerDiagnostics.staleStatesIgnored} snapshot(s) atrasado(s) bloqueado(s).`,
    },
    {
      label: 'Ping',
      status:
        multiplayerNetworkLatencyMs === null ||
        multiplayerNetworkLatencyMs <= 180
          ? 'steady'
          : multiplayerNetworkLatencyMs <= 350
            ? 'watch'
            : 'critical',
      text:
        multiplayerNetworkLatencyMs === null
          ? multiplayerConnectionStatus === 'hosting'
            ? 'Ping local do host.'
            : 'Ping ainda nao medido.'
          : `${multiplayerNetworkLatencyMs} ms.`,
    },
  ] as const
  const multiplayerDiagnosticReport = [
    'FUSHI TABLETOP - DIAGNOSTICO MULTIPLAYER',
    `Gerado: ${new Date().toLocaleString('pt-BR')}`,
    `App: ${desktopAppInfo?.version ?? 'web/dev'}`,
    `Campanha: ${activeCampaignName}`,
    `Campanha ID: ${activeCampaignId}`,
    `Modo: ${viewMode}`,
    `Estado: ${multiplayerConnectionStatus}`,
    `Socket: ${multiplayerDiagnostics.socketState}`,
    `Ping: ${multiplayerDiagnosticPingLabel}`,
    `Fila remota: ${multiplayerDiagnostics.pendingActions}`,
    `Ultima acao: ${multiplayerDiagnostics.lastActionType || '--'}`,
    `Ultimo status: ${multiplayerDiagnostics.lastActionStatus}`,
    `Enfileirada: ${formatDiagnosticTimestamp(multiplayerDiagnostics.lastQueuedAt)}`,
    `ACK: ${formatDiagnosticTimestamp(multiplayerDiagnostics.lastAckAt)}`,
    `Retries: ${multiplayerDiagnostics.retryAttempts}`,
    `Reconexoes: ${multiplayerDiagnostics.reconnectAttempts}`,
    `Snapshot: ${multiplayerDiagnostics.stateVersion || '--'}`,
    `Snapshots atrasados bloqueados: ${multiplayerDiagnostics.staleStatesIgnored}`,
    `Erro: ${multiplayerErrorMessage || '--'}`,
    `Host: ${multiplayerClientConfig?.host || multiplayerHostStatus?.localIps?.[0] || 'local'}`,
    `Porta: ${formatDiagnosticValue(multiplayerHostStatus?.port ?? multiplayerClientConfig?.port)}`,
    `Codigo: ${multiplayerHostStatus?.sessionCode || multiplayerClientConfig?.sessionCode || '--'}`,
    `Servidor: ${multiplayerHostStatus?.serverVersion ?? '--'}`,
    `Jogadores conectados: ${multiplayerDiagnosticPlayers.length}`,
    ...multiplayerDiagnosticPlayers.map(
      (player) =>
        `- ${player.playerId}: ${formatDiagnosticValue(player.latencyMs)} ms | pong ${formatDiagnosticTimestamp(player.lastPongAt ?? null)}`,
    ),
    `Cena: ${boardScene?.name ?? '--'}`,
    `Mapa: ${boardMap?.name ?? '--'}`,
    `Tokens visiveis/total: ${visibleTokens.length}/${tokens.length}`,
    `Dados: ativo ${activeDiceRollEntry?.id ?? '--'} | fila ${pendingDiceRollEntries.length}`,
    'Checklist:',
    ...multiplayerDiagnosticRiskItems.map(
      (item) => `- ${item.label}: ${item.status.toUpperCase()} - ${item.text}`,
    ),
  ].join('\n')

  async function handleCopyMultiplayerDiagnostics() {
    try {
      await copyTextToClipboard(multiplayerDiagnosticReport)
      setTableFeedbackMessage('Diagnostico multiplayer copiado.')
    } catch {
      setTableFeedbackMessage('Nao consegui copiar o diagnostico automaticamente.')
    }
  }

  if (!data) {
    return null
  }

  if (isRemotePlayerMode && !multiplayerPublicState) {
    return (
      <div className="tabletop-screen">
        <div className="tabletop-loading">
          <p className="eyebrow">Multiplayer V1</p>
          <h1>Carregando mesa remota</h1>
          <p>Aguardando o estado publico enviado pelo servidor do mestre.</p>
        </div>
      </div>
    )
  }

  if (shouldBlockForTabletopReadiness) {
    return (
      <div
        className="tabletop-screen"
        data-scene-theme={boardSceneRuntime?.uiTheme.id ?? 'ui-fushi-default'}
        data-weather={boardSceneRuntime?.weather.variant ?? 'none'}
        style={sceneThemeStyle}
      >
        <TabletopReadinessGate
          canContinue={tabletopReadiness.canContinue}
          completed={tabletopReadiness.completed}
          items={tabletopReadiness.items}
          onContinue={tabletopReadiness.continueAnyway}
          onRetry={tabletopReadiness.retry}
          phase={tabletopReadiness.phase}
          progress={tabletopReadiness.progress}
          roleLabel={
            viewMode === 'gm'
              ? 'Mestre'
              : isRemotePlayerSession
                ? 'Jogador online'
                : 'Jogador local'
          }
          sceneName={boardScene?.name ?? boardMap?.name ?? 'Mesa'}
          total={tabletopReadiness.total}
          warnings={tabletopReadiness.warnings}
        />
      </div>
    )
  }

  return (
    <div
      className={`tabletop-screen tabletop-screen--${
        boardIsNight ? 'night' : 'day'
      }${
        dayNightTransition
          ? ` tabletop-screen--transition-${dayNightTransition.direction}`
          : ''
      }`}
      data-day-night-mode={boardIsNight ? 'night' : 'day'}
      data-day-night-transition={dayNightTransition?.direction ?? 'idle'}
      data-scene-theme={boardSceneRuntime?.uiTheme.id ?? 'ui-fushi-default'}
      data-weather={boardSceneRuntime?.weather.variant ?? 'none'}
      style={sceneThemeStyle}
    >
      <TabletopDayNightAtmosphere
        isNight={boardIsNight}
        transition={dayNightTransition}
      />
      <div
        className={`tabletop-screen__board${
          sceneReturnTransitionActive ? ' tabletop-screen__board--reentering' : ''
        }`}
        ref={boardRootRef}
      >
        <TabletopBoard
          boardImpact={boardImpactEvent}
          camera3dState={sceneCamera3dState}
          cellSize={
            boardMapCellSize ??
            data.tabletop.map.cellSize ??
            DEFAULT_TABLETOP_GRID_CELL_SIZE
          }
          editor3dTool={editor3dTool}
          fullscreen
          is3dCameraEditorEnabled={is3dCameraEditorEnabled}
          is3dFreeCameraVisible={is3dFreeCameraVisible}
          isArtworkSuspended={isBoardArtworkSuspended}
          isCameraLocked={isBoardCameraLocked}
          isGridVisible={isGridVisible}
          isMeasureModeEnabled={canUseMeasureTool && isMeasureToolActive}
          isObjectPlacementActive={Boolean(objectPlacementPresetId)}
          map={boardMap ?? data.tabletop.map}
          onArtworkBlank={handleBoardArtworkBlank}
          onArtworkReady={handleBoardArtworkReady}
          onStagePointerMove={handleLightingPointerMove}
          renderEpoch={boardRenderEpoch}
          measurementColor={activeSessionDiceColor}
          measurementLabel={activeSessionAuthorLabel}
          sharedMeasurement={activeSharedMeasurement}
          visualQuality={boardVisualQuality}
          onCellAction={handleBoardCellAction}
          onClearSelection={handleClearSelection}
          on3dEditorToolChange={setEditor3dTool}
          onMeasurementChange={handleMeasurementChange}
          objects={objectViews}
          on3dObjectCreateAtPlacement={handle3dObjectCreateAtPlacement}
          onObjectDrop={handleObjectDrop}
          onObjectDuplicate={duplicateObjectById}
          onObjectConfirm={handleConfirm3dObjectSelection}
          onObjectRemove={removeObjectFromCurrentScene}
          onObjectSelect={(objectId) => {
            setSelectedObjectId(objectId)
            setObjectMoveTargetId('')
            setSelection([])
            if (viewMode === 'gm') {
              setActiveHudPanel('objects')
            }
          }}
          onObjectUndo={undoLastObjectSceneChange}
          onPing={handlePing}
          onTokenClick={undefined}
          onTokenDrop={handleTokenDrop}
          onTokenSelect={handleTokenSelect}
          onTokenOpen={handleTokenOpen}
          on3dCameraChange={handle3dCameraChange}
          on3dObjectPlacementChange={handle3dObjectPlacementChange}
          onViewportCameraChange={handleViewportCameraChange}
          onWheelZoom={handleWheelZoom}
          lightingOverlay={
            <TabletopLightingLayer
              isEditing={isLightingEditMode}
              isGm={viewMode === 'gm' && !isRemotePlayerMode}
              isNight={boardIsNight}
              lighting={boardLighting}
              onMoveLight={handleMoveSceneLight}
              onResizeLight={handleResizeSceneLight}
              onSelectLight={setSelectedSceneLightId}
              selectedLightId={activeSelectedSceneLightId}
            />
          }
          overlay={
            <>
              <TabletopFxStage
                biomeId={boardMap?.biomeId}
                height={boardMap?.stageHeight ?? data.tabletop.map.stageHeight}
                quality={boardVisualQuality}
                weather={boardSceneRuntime?.weather}
                width={boardMap?.stageWidth ?? data.tabletop.map.stageWidth}
              />
              <TabletopCombatRangeOverlay
                map={boardMap ?? data.tabletop.map}
                onClose={handleCloseCombatRangePreview}
                preview={activeCombatPreview}
                tokens={visibleTokens}
              />
              {activeAbilityImpact?.type === 'ability-success' &&
              activeAbilityImpactToken ? (
                <div
                  aria-hidden="true"
                  className="tabletop-ability-vfx tabletop-ability-vfx--success"
                  key={activeAbilityImpact.id}
                  style={activeAbilityImpactStyle}
                >
                  <span />
                  <span />
                  <span />
                </div>
              ) : null}
              {boardMap && activeVfxPresentation && activeVfxPreset ? (
                <TabletopVfxPresentation
                  map={boardMap}
                  presentation={activeVfxPresentation}
                  preset={activeVfxPreset}
                  tokens={tokenViews}
                />
              ) : null}
              {boardSceneRuntime ? (
                <TabletopWeatherOverlay runtime={boardSceneRuntime.weather} />
              ) : null}
            </>
          }
          pings={boardPings}
          tokens={tokenViews}
          viewportRef={viewportRef}
          zoom={effectiveZoom}
        />
        <TabletopLightingControls
          isEditing={isLightingEditMode}
          isGm={viewMode === 'gm' && !isRemotePlayerMode}
          isNight={boardIsNight}
          lighting={boardLighting}
          onAddLight={handleAddSceneLight}
          onRemoveLight={handleRemoveSceneLight}
          onSelectLight={setSelectedSceneLightId}
          onToggleDayNight={handleToggleBoardDayNight}
          onToggleCursor={handleToggleCursorLight}
          onToggleEditing={() => setIsLightingEditMode((current) => !current)}
          onToggleEnabled={handleToggleSceneLighting}
          onUpdateLight={handleUpdateSceneLight}
          selectedLightId={activeSelectedSceneLightId}
        />
        <TabletopDiceRollOverlay
          entryId={activeDiceRollEntry?.id}
          onRollSettled={handleDiceRollSettled}
          quality={boardVisualQuality}
          record={activeDiceRollRecord}
        />
      </div>

      {showPerformanceOverlay ? (
        <div className="tabletop-performance-overlay" aria-hidden="true">
          <span>{performanceFps || '--'} FPS</span>
          <span>
            {multiplayerConnectionStatus === 'connected'
              ? `${multiplayerNetworkLatencyMs ?? '--'} ms`
              : multiplayerConnectionStatus === 'hosting'
                ? 'HOST'
                : 'LOCAL'}
          </span>
        </div>
      ) : null}

      <div className="tabletop-screen__topbar">
        <button
          aria-label={isTopbarExpanded ? 'Recolher menu superior' : 'Abrir menu superior'}
          className="tabletop-hud__button tabletop-hud__button--menu"
          onClick={() => setIsTopbarExpanded((current) => !current)}
          title="Menu"
          type="button"
        >
          <img alt="" className="tabletop-hud__icon" src={resolveRuntimeAssetUrl(HUD_ICON_ASSETS.menu)} />
        </button>
        <div className={`tabletop-screen__topbar-main${isTopbarExpanded ? ' tabletop-screen__topbar-main--expanded' : ''}`}>
          <button
            className="tabletop-escape"
            onClick={handleExitToPlatform}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            Plataforma
          </button>
          <button
            aria-label="Abrir configuracoes"
            className="tabletop-escape tabletop-escape--icon"
            onClick={() => navigate('/configuracoes')}
            title="Configuracoes"
            type="button"
          >
            <img alt="" className="tabletop-action-icon" src={resolveRuntimeAssetUrl(HUD_ICON_ASSETS.settings)} />
          </button>
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
              onClick={handleToggleGmCameraControl}
              type="button"
            >
              CAM GM
            </button>
          ) : null}
          {viewMode === 'gm' ? (
            <button
              className={`tabletop-escape${
                isScene3dCameraFree ? ' tabletop-escape--active' : ''
              }`}
              onClick={handleToggleGm3dCamera}
              type="button"
            >
              3D GM
            </button>
          ) : null}
          {viewMode === 'gm' && isScene3dCameraEnabled ? (
            <button
              className="tabletop-escape"
              onClick={handleResetGm3dCamera}
              type="button"
            >
              Reset
            </button>
          ) : null}
          {viewMode === 'gm' && isScene3dCameraFree ? (
            <div className="tabletop-editor-toolstrip" aria-label="Editor 3D">
              {(['translate', 'rotate', 'scale'] as const).map((tool) => (
                <button
                  className={`tabletop-editor-toolstrip__button${
                    editor3dTool === tool ? ' tabletop-editor-toolstrip__button--active' : ''
                  }`}
                  key={tool}
                  onClick={() => setEditor3dTool(tool)}
                  title={
                    tool === 'translate'
                      ? 'Mover objeto 3D'
                      : tool === 'rotate'
                        ? 'Girar objeto 3D'
                        : 'Escalar objeto 3D'
                  }
                  type="button"
                >
                  {tool === 'translate' ? 'M' : tool === 'rotate' ? 'G' : 'E'}
                </button>
              ))}
            </div>
          ) : null}
          {canUseMeasureTool ? (
            <button
              className={`tabletop-escape${
                isMeasureToolActive ? ' tabletop-escape--active' : ''
              }`}
              aria-label="Medir distancia"
              onClick={handleToggleMeasureTool}
              type="button"
              title="Medir distancia"
            >
              <img alt="" className="tabletop-action-icon" src={resolveRuntimeAssetUrl(HUD_ICON_ASSETS.ruler)} />
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

      {diceRollGuardNotice ? (
        <div
          className={`tabletop-dice-guard tabletop-dice-guard--${diceRollGuardNotice.tone}`}
          key={diceRollGuardNotice.id}
          role="status"
        >
          {diceRollGuardNotice.message}
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
          } tabletop-roll-toast--${rollToastOutcome}`}
          role="status"
        >
          <div className="tabletop-roll-toast__header">
            <p className="eyebrow">
              {rollToastEntry.visibility === 'gm' ? 'Rolagem oculta' : 'Rolagem publica'}
              {' '}
              {rollToastEntry.author ? `- ${rollToastEntry.author}` : ''}
            </p>
            <button
              aria-label="Fechar resultado da rolagem"
              className="tabletop-roll-toast__close"
              onClick={() => setRollToastEntry(null)}
              type="button"
            >
              x
            </button>
          </div>
          <div className="tabletop-roll-toast__body">
            <div className="tabletop-roll-toast__die" aria-hidden="true">
              <DiceIcon
                color={rollToastRecord.visualColor}
                label={String(rollToastRecord.total)}
                type={rollToastRecord.tipoDado}
              />
            </div>
            <div className="tabletop-roll-toast__meta">
              <h3>{rollToastRecord.contexto}</h3>
              <p>{formatRollFormula(rollToastRecord)}</p>
              <div className="tabletop-roll-toast__rolls">
                {rollToastRecord.resultados.map((result, index) => (
                  <span key={`${rollToastRecord.id}-${index}`}>{result}</span>
                ))}
              </div>
            </div>
            <strong className="tabletop-roll-toast__total">
              {rollToastRecord.total}
            </strong>
          </div>
        </div>
      ) : null}

      {viewMode === 'player' &&
      session?.publicCombatReceipt &&
      session.publicCombatReceipt.id !== dismissedCombatReceiptId ? (
        <div className="tabletop-combat-receipt" role="status">
          <p className="eyebrow">Resultado confirmado pelo Mestre</p>
          <h3>
            {session.publicCombatReceipt.attackerName} -&gt;{' '}
            {session.publicCombatReceipt.targetName}
          </h3>
          <p>{session.publicCombatReceipt.summary}</p>
          <div className="tabletop-combat-receipt__resources">
            {Object.values(session.publicCombatReceipt.resourceChangesByPlayerId)
              .flat()
              .map((change, index) => (
                <span className="tag" key={`${change.label}-${index}`}>
                  {change.label}: {change.before} -&gt; {change.after}
                </span>
              ))}
          </div>
          <button
            className="button button--primary"
            onClick={() =>
              setDismissedCombatReceiptId(session.publicCombatReceipt?.id ?? '')
            }
            type="button"
          >
            OK
          </button>
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
          aria-label={isUtilityExpanded ? 'Recolher atalhos' : 'Abrir atalhos'}
          className="tabletop-hud__button tabletop-hud__button--collapse"
          onClick={() => setIsUtilityExpanded((current) => !current)}
          title="Atalhos"
          type="button"
        >
          <span>{isUtilityExpanded ? '>' : '<'}</span>
        </button>
        <div className={`tabletop-screen__utility-items${isUtilityExpanded ? ' tabletop-screen__utility-items--expanded' : ''}`}>
        <button
          aria-label="Abrir chat, log e rolagem"
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
          <img alt="" className="tabletop-hud__icon" src={resolveRuntimeAssetUrl(HUD_ICON_ASSETS.log)} />
        </button>
        <button
          aria-label="Abrir anotacoes pessoais"
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
          <img alt="" className="tabletop-hud__icon" src={resolveRuntimeAssetUrl(HUD_ICON_ASSETS.notes)} />
        </button>
        {viewMode === 'player' ? (
          <button
            aria-label="Abrir Livro do Jogador"
            className={`tabletop-hud__button${
              activeUtilityWindow === 'book' ? ' tabletop-hud__button--active' : ''
            }`}
            onClick={() =>
              setActiveUtilityWindow((currentWindow) =>
                currentWindow === 'book' ? null : 'book',
              )
            }
            title="Livro do Jogador"
            type="button"
          >
            <img alt="" className="tabletop-hud__icon" src={resolveRuntimeAssetUrl(HUD_ICON_ASSETS.book)} />
          </button>
        ) : null}
        {canOpenPlayerMundi ? (
          <button
            aria-label="Abrir Mapa Mundi"
            className={`tabletop-hud__button${
              activeUtilityWindow === 'world' ? ' tabletop-hud__button--active' : ''
            }`}
            onClick={() =>
              setActiveUtilityWindow((currentWindow) =>
                currentWindow === 'world' ? null : 'world',
              )
            }
            title="Mapa Mundi geral liberado pelo mestre"
            type="button"
          >
            <img alt="" className="tabletop-hud__icon" src={resolveRuntimeAssetUrl(HUD_ICON_ASSETS.world)} />
          </button>
        ) : null}
        {viewMode === 'gm' ? (
          <button
            aria-label="Abrir senhas e acessos"
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
            <img alt="" className="tabletop-hud__icon" src={resolveRuntimeAssetUrl(HUD_ICON_ASSETS.access)} />
          </button>
        ) : null}
        {viewMode === 'gm' ? (
          <button
            aria-label="Abrir ajuda e atalhos"
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
            <img alt="" className="tabletop-hud__icon" src={resolveRuntimeAssetUrl(HUD_ICON_ASSETS.help)} />
          </button>
        ) : null}
        {sheetActionTokenId ? (
          <button
            aria-label="Abrir ficha"
            className="tabletop-hud__button"
            onClick={() => handleTokenOpen(sheetActionTokenId)}
            title={
              viewMode === 'player'
                ? 'Abrir ficha do personagem'
                : 'Abrir ficha do token selecionado'
            }
            type="button"
          >
            <img alt="" className="tabletop-hud__icon" src={resolveRuntimeAssetUrl(HUD_ICON_ASSETS.sheet)} />
          </button>
        ) : null}
        {viewMode === 'gm' && primarySelectedToken ? (
          <button
            aria-label="Alternar visibilidade do token"
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
            <img alt="" className="tabletop-hud__icon" src={resolveRuntimeAssetUrl(HUD_ICON_ASSETS.visibility)} />
          </button>
        ) : null}
        </div>
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
          preferStillMedia={visualQuality === 'low'}
          scenePreviewUrl={
            (activeTransitionOverlay.toMapId
              ? mapPreviewById[activeTransitionOverlay.toMapId]
              : '') ||
            activeMap?.imageUrl ||
            activeMap?.image ||
            null
          }
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
      {turnState?.isActive ? (
        <TabletopTurnOverlay
          activeParticipant={activeTurnParticipantView}
          canControlActiveParticipant={canControlActiveTurnParticipant}
          featureActions={activeTurnFeatureActions}
          isGm={viewMode === 'gm'}
          onActionToggle={handleTurnActionToggle}
          onEndCombat={handleEndCombatTurns}
          onFeatureAction={handleTurnFeatureAction}
          onManeuverAction={handleTurnManeuverAction}
          onNextTurn={handleNextTurn}
          onOpenParticipant={handleTokenOpen}
          onPreviousTurn={handlePreviousTurn}
          onResolveActionRequest={handleResolveTurnActionRequest}
          participants={turnParticipantViews}
          pendingActionRequests={pendingTurnActionRequests}
          turnState={turnState}
        />
      ) : null}
      {session?.trainingState?.isActive &&
      isTabletopEventActive(eventState, 'initial-training') ? (
        <TabletopTrainingArc
          assignedRewardCharacterIds={assignedRewardCharacterIds}
          isGm={viewMode === 'gm'}
          key={`training-${trainingOpenRequestId}`}
          openRequestId={trainingOpenRequestId}
          onFinalOutcome={handleTrainingFinalOutcome}
          onAssignRewardAbility={handleAssignTrainingRewardAbility}
          onParticipantOutcome={handleTrainingParticipantOutcome}
          onRestart={handleRestartVillageTraining}
          onSelectStation={(participantId, stationId) =>
            updateTrainingState((trainingState) =>
              setTrainingParticipantStation(trainingState, participantId, stationId),
            )
          }
          onSetActive={(isActive) =>
            isActive
              ? handleActivateTabletopEvent('initial-training')
              : handleDeactivateTabletopEvent('initial-training')
          }
          onUnlockFinal={() =>
            updateTrainingState((trainingState) =>
              unlockTrainingFinalTrial(trainingState),
            )
          }
          state={session.trainingState}
          viewerCharacterId={
            playerCharacterId || effectiveActiveAccessProfile?.characterId || ''
          }
        />
      ) : null}
      <TabletopEventPresentation state={eventState} />
      {configurableMap ? (
        <DeferredTabletopTool>
          <MapConfigurationModal
            campaignId={activeCampaignId}
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
        </DeferredTabletopTool>
      ) : null}
      {isObjectPresetImportOpen ? (
        <DeferredTabletopTool>
          <ObjectPresetImportModal
            campaignId={activeCampaignId}
            libraryKind={objectLibraryTab === 'animations' ? 'animation' : 'object'}
            onClose={() => setIsObjectPresetImportOpen(false)}
            onSave={handleSaveObjectPresetImport}
          />
        </DeferredTabletopTool>
      ) : null}
      {configurableTransition ? (
        <DeferredTabletopTool>
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
        </DeferredTabletopTool>
      ) : null}

      {viewMode === 'gm' ? (
        <>
          <div className="tabletop-screen__hud">
            <button
              aria-label={isHudExpanded ? 'Recolher ferramentas' : 'Abrir ferramentas'}
              className="tabletop-hud__button tabletop-hud__button--collapse"
              onClick={() => setIsHudExpanded((current) => !current)}
              title="Ferramentas"
              type="button"
            >
              <span>{isHudExpanded ? 'v' : '^'}</span>
            </button>
            {isHudExpanded ? (
              <TabletopHud
                activeItemId={activeHudPanel}
                items={hudItems
                  .map((item) => ({
                  id: item.id,
                  label: item.label,
                  shortLabel: item.shortLabel,
                  }))}
                onToggle={(itemId) => toggleHudPanel(itemId as HudPanelId)}
              />
            ) : null}
          </div>

          {activeHudPanel === 'objects' ? (
            <FloatingWindow
              initialPosition={{ x: 104, y: 240 }}
              initialSize={{ width: 760, height: 620 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Itens e props colocados sobre o mapa atual."
              title="Objetos da Cena"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Itens e props colocados sobre o mapa atual."
                title="Objetos da Cena"
              >
                <TabletopVisualLibrary
                  actions={
                    <button
                      aria-label="Adicionar preset"
                      className="tabletop-visual-library-icon-button"
                      data-testid="object-preset-add"
                      onClick={() => setIsObjectPresetImportOpen(true)}
                      title="Adicionar preset com imagem"
                      type="button"
                    >
                      <Plus size={18} />
                    </button>
                  }
                  className="tabletop-object-browser"
                  code="OBJ"
                  contentHeader={
                    <div>
                      <p className="eyebrow">
                        {objectLibraryView === 'scene'
                          ? 'Cena atual'
                          : objectLibraryTab === 'animations'
                            ? 'Animações'
                            : 'Objetos'}
                      </p>
                      <h3>
                        {objectLibraryView === 'scene'
                          ? `${visibleSceneObjects.length} objeto(s) colocado(s)`
                          : `${visibleObjectPresets.length} preset(s)`}
                      </h3>
                      <p className="support-copy">
                        {objectLibraryView === 'scene'
                          ? 'Selecione, mova, configure ou remova elementos do mapa atual.'
                          : 'Escolha um cartão e clique no mapa ou no 3D GM para posicionar.'}
                      </p>
                    </div>
                  }
                  icon={Box}
                  onSearchChange={setObjectLibrarySearch}
                  searchPlaceholder="Buscar objeto ou animação"
                  searchValue={objectLibrarySearch}
                  sidebar={
                    <nav
                      aria-label="Seções da biblioteca de objetos"
                      className="tabletop-visual-library__nav"
                    >
                      <button
                        className={
                          objectLibraryView === 'catalog' && objectLibraryTab === 'objects'
                            ? 'is-active'
                            : ''
                        }
                        onClick={() => {
                          setObjectLibraryView('catalog')
                          setObjectLibraryTab('objects')
                        }}
                        type="button"
                      >
                        <Box aria-hidden="true" size={17} />
                        <span>Objetos</span>
                        <small>
                          {allObjectPresets.filter(
                            (preset) => (preset.libraryKind ?? 'object') === 'object',
                          ).length}
                        </small>
                      </button>
                      <button
                        className={
                          objectLibraryView === 'catalog' && objectLibraryTab === 'animations'
                            ? 'is-active'
                            : ''
                        }
                        onClick={() => {
                          setObjectLibraryView('catalog')
                          setObjectLibraryTab('animations')
                        }}
                        type="button"
                      >
                        <Film aria-hidden="true" size={17} />
                        <span>Animações</span>
                        <small>
                          {allObjectPresets.filter(
                            (preset) => preset.libraryKind === 'animation',
                          ).length}
                        </small>
                      </button>
                      <button
                        className={objectLibraryView === 'scene' ? 'is-active' : ''}
                        onClick={() => setObjectLibraryView('scene')}
                        type="button"
                      >
                        <Layers3 aria-hidden="true" size={17} />
                        <span>Cena atual</span>
                        <small>{sceneObjects.length}</small>
                      </button>
                    </nav>
                  }
                  testId="object-library"
                  title="Biblioteca visual"
                >
                <div
                  className={`list-stack tabletop-object-browser__content is-${objectLibraryView}`}
                >
                  <article className="list-card">
                    <div className="list-card__top">
                      <div>
                        <p className="eyebrow">
                          {objectLibraryTab === 'animations'
                            ? 'Biblioteca Animacoes'
                            : 'Biblioteca OBJ'}
                        </p>
                        <h3>
                          {objectLibraryTab === 'animations'
                            ? 'Colocar efeito vivo'
                            : 'Colocar objeto no mapa'}
                        </h3>
                      </div>
                      <div className="tabletop-object-library-actions">
                        {objectPlacementPresetId ? (
                          <span className="tag">Clique no mapa ou no 3D GM</span>
                        ) : null}
                        <button
                          className="button button--ghost"
                          data-testid="object-preset-add-legacy"
                          onClick={() => setIsObjectPresetImportOpen(true)}
                          type="button"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>

                    <div
                      aria-label="Alternar biblioteca de objetos"
                      className="tabletop-object-library-tabs"
                      role="tablist"
                    >
                      {[
                        ['objects', 'Objetos'],
                        ['animations', 'Animacoes'],
                      ].map(([tabId, label]) => (
                        <button
                          aria-selected={objectLibraryTab === tabId}
                          className={`tabletop-object-library-tab${
                            objectLibraryTab === tabId
                              ? ' tabletop-object-library-tab--active'
                              : ''
                          }`}
                          key={tabId}
                          onClick={() =>
                            setObjectLibraryTab(tabId as 'animations' | 'objects')
                          }
                          role="tab"
                          type="button"
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="tabletop-object-preset-grid">
                      {visibleObjectPresets.map((preset) => (
                        <button
                          className={`tabletop-object-preset${
                            objectPlacementPresetId === preset.id
                              ? ' tabletop-object-preset--active'
                              : ''
                          }`}
                          key={preset.id}
                          onClick={() =>
                            setObjectPlacementPresetId((currentPresetId) =>
                              currentPresetId === preset.id ? '' : preset.id,
                            )
                          }
                          type="button"
                        >
                          <span className="tabletop-object-preset__preview">
                            {preset.previewImage || preset.assetUrl ? (
                              <img
                                alt=""
                                src={resolveRuntimeAssetUrl(
                                  preset.previewImage || preset.assetUrl,
                                )}
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className="tabletop-object-preview-3d tabletop-object-preview-3d--preset"
                                data-preview-kind={resolveObjectPreviewKind(preset)}
                                style={{ ['--object-preview-color' as string]: preset.color }}
                              />
                            )}
                          </span>
                          <span>
                            <strong>{preset.name}</strong>
                            <small>{preset.description}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </article>

                  <article className="list-card">
                    <div className="list-card__top">
                      <div>
                        <p className="eyebrow">Cena atual</p>
                        <h3>{sceneObjects.length} objeto(s)</h3>
                      </div>
                    </div>

                    <div className="list-stack">
                      {visibleSceneObjects.length > 0 ? (
                        visibleSceneObjects.map((object) => (
                          <article
                            className={`summary-card${
                              selectedObjectId === object.id ? ' summary-card--active' : ''
                            }${
                              objectMoveTargetId === object.id ? ' summary-card--moving' : ''
                            }`}
                            key={object.id}
                          >
                            <div
                              className="tabletop-scene-object-compact"
                              onClick={() => {
                                setSelectedObjectId(object.id)
                                setObjectMoveTargetId('')
                              }}
                            >
                              <span className="tabletop-scene-object-compact__preview">
                                {object.assetUrl ? (
                                  <img alt="" src={resolveRuntimeAssetUrl(object.assetUrl)} />
                                ) : (
                                  <span
                                    aria-hidden="true"
                                    className="tabletop-object-preview-3d tabletop-object-preview-3d--compact"
                                    data-preview-kind={resolveObjectPreviewKind(object)}
                                    style={{
                                      ['--object-preview-color' as string]:
                                        object.color ?? '#e9c97e',
                                    }}
                                  />
                                )}
                              </span>
                              <span className="tabletop-scene-object-compact__body">
                                <strong>{object.name}</strong>
                                <small>
                                  {object.visibility === 'public' ? 'visivel' : 'oculto'} |{' '}
                                  {object.renderMode}
                                </small>
                              </span>
                              <button
                                className="button button--ghost"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  toggleObjectVisibility(object.id)
                                }}
                                type="button"
                              >
                                {object.visibility === 'public' ? 'Ocultar' : 'Desocultar'}
                              </button>
                              <button
                                className="button button--ghost"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  removeObjectFromCurrentScene(object.id)
                                }}
                                type="button"
                              >
                                Remover
                              </button>
                            </div>
                            <details
                              className="tabletop-scene-object-advanced"
                              onToggle={(event) => {
                                setExpandedObjectAdvancedId(
                                  event.currentTarget.open ? object.id : '',
                                )
                              }}
                              open={expandedObjectAdvancedId === object.id}
                            >
                              <summary>Avancado</summary>
                            <div className="list-card__top">
                              <div>
                                <strong>{object.name}</strong>
                                <p className="support-copy">
                                  {object.description ?? 'Objeto da cena.'}
                                </p>
                              </div>
                              <span className="tag">
                                {object.visibility === 'public' ? 'players' : 'mestre'}
                              </span>
                            </div>
                            <div className="tag-row">
                              <span className="tag">
                                Celula {object.cell.column + 1}, {object.cell.row + 1}
                              </span>
                              <span className="tag">{object.renderMode}</span>
                              {objectMoveTargetId === object.id ? (
                                <span className="tag">Clique no mapa para mover</span>
                              ) : null}
                            </div>
                            <div className="tabletop-object-color-row">
                              <label className="field">
                                <span>Cor do marcador</span>
                                <input
                                  className="field__input"
                                  onChange={(event) =>
                                    updateObjectOnCurrentScene(object.id, {
                                      color: event.target.value,
                                    })
                                  }
                                  type="color"
                                  value={object.color ?? '#e9c97e'}
                                />
                              </label>
                              <div className="tabletop-object-color-row__swatches">
                                {TABLETOP_OBJECT_COLOR_SWATCHES.map((color) => (
                                  <button
                                    aria-label={`Aplicar cor ${color}`}
                                    className={`tabletop-object-color-swatch${
                                      (object.color ?? '#e9c97e').toLowerCase() === color
                                        ? ' tabletop-object-color-swatch--active'
                                        : ''
                                    }`}
                                    key={color}
                                    onClick={() =>
                                      updateObjectOnCurrentScene(object.id, { color })
                                    }
                                    style={{ ['--swatch-color' as string]: color }}
                                    type="button"
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="tabletop-object-controls">
                              <label className="field">
                                <span>Barreira grid</span>
                                <select
                                  className="field__input"
                                  onChange={(event) =>
                                    updateObjectOnCurrentScene(object.id, {
                                      size: Number(event.target.value) as TabletopBoardObject['size'],
                                    })
                                  }
                                  value={object.size}
                                >
                                  <option value={1}>1x1</option>
                                  <option value={2}>2x2</option>
                                  <option value={3}>3x3</option>
                                </select>
                              </label>
                              <label className="field">
                                <span>Camada</span>
                                <select
                                  className="field__input"
                                  onChange={(event) =>
                                    updateObjectOnCurrentScene(object.id, {
                                      renderMode: event.target.value as TabletopBoardObject['renderMode'],
                                    })
                                  }
                                  value={object.renderMode}
                                >
                                  <option value="sprite">Sprite</option>
                                  <option value="three">3D</option>
                                </select>
                              </label>
                            </div>
                            {object.renderMode === 'three' ? (
                              <div className="tabletop-object-3d-tools tabletop-object-3d-tools--precise">
                                <label className="field">
                                  <span>
                                    Escala 3D {(object.placement3d?.scale ?? 1).toFixed(2)}
                                  </span>
                                  <input
                                    className="field__input"
                                    max={TABLETOP_OBJECT_SCALE_MAX}
                                    min={TABLETOP_OBJECT_SCALE_MIN}
                                    onChange={(event) =>
                                      {
                                        const nextScale = Number(event.target.value)
                                        updateObject3dPlacement(object, {
                                          scale: nextScale,
                                          scaleX: nextScale,
                                          scaleY: nextScale,
                                          scaleZ: nextScale,
                                        })
                                      }
                                    }
                                    step={0.05}
                                    type="range"
                                    value={object.placement3d?.scale ?? 1}
                                  />
                                </label>
                                <label className="field">
                                  <span>
                                    Altura Z {(object.placement3d?.z ?? 0).toFixed(2)}
                                  </span>
                                  <input
                                    className="field__input"
                                    max={TABLETOP_OBJECT_HEIGHT_MAX}
                                    min={TABLETOP_OBJECT_HEIGHT_MIN}
                                    onChange={(event) =>
                                      updateObject3dPlacement(object, {
                                        z: Number(event.target.value),
                                      })
                                    }
                                    step={0.1}
                                    type="range"
                                    value={object.placement3d?.z ?? 0}
                                  />
                                </label>
                                <label className="field">
                                  <span>
                                    Dim X{' '}
                                    {(
                                      object.placement3d?.scaleX ??
                                      object.placement3d?.scale ??
                                      1
                                    ).toFixed(2)}
                                  </span>
                                  <input
                                    className="field__input"
                                    max={TABLETOP_OBJECT_SCALE_MAX}
                                    min={TABLETOP_OBJECT_SCALE_MIN}
                                    onChange={(event) =>
                                      updateObject3dPlacement(object, {
                                        scaleX: Number(event.target.value),
                                      })
                                    }
                                    step={0.05}
                                    type="range"
                                    value={
                                      object.placement3d?.scaleX ??
                                      object.placement3d?.scale ??
                                      1
                                    }
                                  />
                                </label>
                                <label className="field">
                                  <span>
                                    Dim Y{' '}
                                    {(
                                      object.placement3d?.scaleY ??
                                      object.placement3d?.scale ??
                                      1
                                    ).toFixed(2)}
                                  </span>
                                  <input
                                    className="field__input"
                                    max={TABLETOP_OBJECT_SCALE_MAX}
                                    min={TABLETOP_OBJECT_SCALE_MIN}
                                    onChange={(event) =>
                                      updateObject3dPlacement(object, {
                                        scaleY: Number(event.target.value),
                                      })
                                    }
                                    step={0.05}
                                    type="range"
                                    value={
                                      object.placement3d?.scaleY ??
                                      object.placement3d?.scale ??
                                      1
                                    }
                                  />
                                </label>
                                <label className="field">
                                  <span>
                                    Dim Z{' '}
                                    {(
                                      object.placement3d?.scaleZ ??
                                      object.placement3d?.scale ??
                                      1
                                    ).toFixed(2)}
                                  </span>
                                  <input
                                    className="field__input"
                                    max={TABLETOP_OBJECT_SCALE_MAX}
                                    min={TABLETOP_OBJECT_SCALE_MIN}
                                    onChange={(event) =>
                                      updateObject3dPlacement(object, {
                                        scaleZ: Number(event.target.value),
                                      })
                                    }
                                    step={0.05}
                                    type="range"
                                    value={
                                      object.placement3d?.scaleZ ??
                                      object.placement3d?.scale ??
                                      1
                                    }
                                  />
                                </label>
                                <label className="field">
                                  <span>
                                    Giro Y{' '}
                                    {Math.round(((object.placement3d?.rotationY ?? 0) * 180) / Math.PI)}
                                    °
                                  </span>
                                  <input
                                    className="field__input"
                                    max={180}
                                    min={-180}
                                    onChange={(event) =>
                                      updateObject3dPlacement(object, {
                                        rotationY:
                                          (Number(event.target.value) * Math.PI) / 180,
                                      })
                                    }
                                    step={1}
                                    type="range"
                                    value={((object.placement3d?.rotationY ?? 0) * 180) / Math.PI}
                                  />
                                </label>
                                <label className="field">
                                  <span>
                                    Pitch X{' '}
                                    {Math.round(((object.placement3d?.rotationX ?? 0) * 180) / Math.PI)}
                                    °
                                  </span>
                                  <input
                                    className="field__input"
                                    max={90}
                                    min={-90}
                                    onChange={(event) =>
                                      updateObject3dPlacement(object, {
                                        rotationX:
                                          (Number(event.target.value) * Math.PI) / 180,
                                      })
                                    }
                                    step={1}
                                    type="range"
                                    value={((object.placement3d?.rotationX ?? 0) * 180) / Math.PI}
                                  />
                                </label>
                                <label className="field">
                                  <span>
                                    Roll Z{' '}
                                    {Math.round(((object.placement3d?.rotationZ ?? 0) * 180) / Math.PI)}
                                    °
                                  </span>
                                  <input
                                    className="field__input"
                                    max={180}
                                    min={-180}
                                    onChange={(event) =>
                                      updateObject3dPlacement(object, {
                                        rotationZ:
                                          (Number(event.target.value) * Math.PI) / 180,
                                      })
                                    }
                                    step={1}
                                    type="range"
                                    value={((object.placement3d?.rotationZ ?? 0) * 180) / Math.PI}
                                  />
                                </label>
                                <p className="support-copy tabletop-object-shortcuts">
                                  3D GM: 1 move, 2 gira, 3 escala, Del remove,
                                  Ctrl+D duplica.
                                </p>
                                <button
                                  className="button"
                                  onClick={() =>
                                    updateObject3dPlacement(object, {
                                      rotationY: (object.placement3d?.rotationY ?? 0) - Math.PI / 12,
                                    })
                                  }
                                  type="button"
                                >
                                  Rot -15
                                </button>
                                <button
                                  className="button"
                                  onClick={() =>
                                    updateObject3dPlacement(object, {
                                      rotationY: (object.placement3d?.rotationY ?? 0) + Math.PI / 12,
                                    })
                                  }
                                  type="button"
                                >
                                  Rot +15
                                </button>
                                <button
                                  className="button"
                                  onClick={() => {
                                    const nextScale = Math.max(
                                      TABLETOP_OBJECT_SCALE_MIN,
                                      (object.placement3d?.scale ?? 1) - 0.15,
                                    )
                                    updateObject3dPlacement(object, {
                                      scale: nextScale,
                                      scaleX: nextScale,
                                      scaleY: nextScale,
                                      scaleZ: nextScale,
                                    })
                                  }}
                                  type="button"
                                >
                                  Esc -
                                </button>
                                <button
                                  className="button"
                                  onClick={() => {
                                    const nextScale = Math.min(
                                      TABLETOP_OBJECT_SCALE_MAX,
                                      (object.placement3d?.scale ?? 1) + 0.15,
                                    )
                                    updateObject3dPlacement(object, {
                                      scale: nextScale,
                                      scaleX: nextScale,
                                      scaleY: nextScale,
                                      scaleZ: nextScale,
                                    })
                                  }}
                                  type="button"
                                >
                                  Esc +
                                </button>
                                <button
                                  className="button"
                                  onClick={() => duplicateObjectOnCurrentScene(object)}
                                  type="button"
                                >
                                  Duplicar
                                </button>
                              </div>
                            ) : null}
                            <div className="tabletop-hud-panel__actions">
                              <button
                                className="button"
                                onClick={() => setSelectedObjectId(object.id)}
                                type="button"
                              >
                                Selecionar
                              </button>
                              <button
                                className={`button${
                                  objectMoveTargetId === object.id ? ' button--primary' : ''
                                }`}
                                onClick={() => {
                                  setSelectedObjectId(object.id)
                                  setSelection([])
                                  setObjectPlacementPresetId('')
                                  setObjectMoveTargetId((currentId) =>
                                    currentId === object.id ? '' : object.id,
                                  )
                                }}
                                type="button"
                              >
                                {objectMoveTargetId === object.id ? 'Mover ativo' : 'Mover'}
                              </button>
                              <button
                                className="button"
                                onClick={() => toggleObjectVisibility(object.id)}
                                type="button"
                              >
                                {object.visibility === 'public'
                                  ? 'Ocultar dos jogadores'
                                  : 'Mostrar aos jogadores'}
                              </button>
                              <button
                                className="button"
                                onClick={() => removeObjectFromCurrentScene(object.id)}
                                type="button"
                              >
                                Remover
                              </button>
                            </div>
                            </details>
                          </article>
                        ))
                      ) : (
                        <p className="support-copy">
                          Nenhum objeto na cena. Escolha um OBJ e clique no mapa para
                          posicionar.
                        </p>
                      )}
                    </div>
                  </article>
                </div>
                </TabletopVisualLibrary>
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

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
                <DeferredTabletopTool>
                  <TabletopNpcLibrary
                    activeCharacterIds={activeSceneCharacterIds}
                    characterFolders={libraryState.itemFolders.npcs}
                    characters={spawnLibraryCharacters}
                    factions={data.factions.items}
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
                    onRenameVirtualFaction={renameNpcFaction}
                    onRemoveFromScene={removeCharacterTokenFromCurrentScene}
                    onSpawn={spawnCharacterOnCurrentScene}
                  />
                </DeferredTabletopTool>
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

          {activeHudPanel === 'builds' ? (
            <FloatingWindow
              initialPosition={{ x: 72, y: 72 }}
              initialSize={{ width: 1120, height: 620 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Catálogo canônico, raridades e vínculo permanente de itens à identidade."
              title="BUI · Builds Absorvidas"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Catálogo canônico, raridades e vínculo permanente de itens à identidade."
                title="BUI · Builds Absorvidas"
              >
                <TabletopBuildManager
                  campaignId={activeCampaignId}
                  characters={data.characters.items}
                  onChangeCharacter={commitCanonicalCharacterUpdate}
                  onSetVisualThumbnail={setLibraryVisualThumbnail}
                  visualThumbnails={libraryState.visualThumbnails}
                />
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

          {activeHudPanel === 'statuses' ? (
            <FloatingWindow
              initialPosition={{ x: 82, y: 76 }}
              initialSize={{ width: 1100, height: 680 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Aplique, acompanhe e encerre estados temporarios da cena."
              title="BUF · Buffs e Debuffs"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Aplique, acompanhe e encerre estados temporarios da cena."
                title="BUF · Buffs e Debuffs"
              >
                <TabletopStatusManager
                  marks={currentSceneStatusMarks}
                  onApply={handleApplyTabletopStatus}
                  onRemove={handleRemoveTabletopStatus}
                  participants={statusParticipants}
                />
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

          {activeHudPanel === 'events' ? (
            <FloatingWindow
              initialPosition={{ x: 88, y: 84 }}
              initialSize={{ width: 1060, height: 650 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Ative, controle e encerre camadas temporarias da mesa sem deixar estado residual."
              title="EVE · Eventos"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Ative, controle e encerre camadas temporarias da mesa sem deixar estado residual."
                title="EVE · Eventos"
              >
                <TabletopEventManager
                  campaignId={activeCampaignId}
                  characters={data.characters.items}
                  eventState={eventState}
                  onActivate={handleActivateTabletopEvent}
                  onAssignCharacterGrant={handleAssignCharacterGrant}
                  onClearRarityDraw={handleClearRarityDraw}
                  onClearRarityHistory={handleClearRarityHistory}
                  onDeactivate={handleDeactivateTabletopEvent}
                  onOpenTraining={handleOpenTrainingControl}
                  onRestartTraining={handleRestartVillageTraining}
                  onStartRarityDraw={handleStartRarityDraw}
                  onSetVisualThumbnail={setLibraryVisualThumbnail}
                  trainingState={session?.trainingState ?? null}
                  visualThumbnails={libraryState.visualThumbnails}
                />
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

          {activeHudPanel === 'vfx' ? (
            <FloatingWindow
              initialPosition={{ x: 98, y: 104 }}
              initialSize={{ width: 980, height: 720 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Presets visuais leves, efêmeros e sincronizados para a mesa."
              title="VFX · Efeitos visuais"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Presets visuais leves, efêmeros e sincronizados para a mesa."
                title="VFX · Efeitos visuais"
              >
                <TabletopVfxLibrary
                  activePresetId={activeVfxPresentation?.presetId ?? ''}
                  campaignId={activeCampaignId}
                  onBroadcast={broadcastVfx}
                  onClear={stopBroadcastVfx}
                  onPreview={previewVfx}
                  onSetVisualThumbnail={setLibraryVisualThumbnail}
                  participants={statusParticipants}
                  visualThumbnails={libraryState.visualThumbnails}
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
                <DeferredTabletopTool>
                  <TabletopWorldMundiPanel
                    campaignId={activeCampaignId}
                    characters={data.characters.items}
                    factions={data.factions.items}
                    maps={availableMaps}
                    mapPreviewById={mapPreviewById}
                    isTrainingActive={isTabletopEventActive(eventState, 'initial-training')}
                    onChange={setWorldMundiState}
                    onActivateTraining={handleActivateVillageTraining}
                    onEnsureMapPlaceholders={ensureWorldMundiMapPlaceholders}
                    onLinkMapToLocation={linkWorldMundiLocationToMap}
                    onOpenMap={openWorldMundiMap}
                    onPrepareMap={prepareMapForGm}
                    onShowTransition={triggerTransitionOverlay}
                    state={worldMundiState}
                  />
                </DeferredTabletopTool>
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
                  <DeferredTabletopTool>
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
                  </DeferredTabletopTool>

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
              initialPosition={{ x: 72, y: 118 }}
              initialSize={{ width: 1180, height: 780 }}
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
                <DeferredTabletopTool>
                  <TabletopMusicLibrary
                    campaignId={activeCampaignId}
                    favoriteTrackIds={libraryState.favoriteTrackIds}
                    favoritePresets={libraryState.favoritePresets}
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
                    onApplyFavoritePreset={applyFavoritePreset}
                    onDeleteFavoritePreset={deleteFavoritePreset}
                    onPlayFavorites={playFavoriteTracks}
                    onPlayFavoritePreset={playFavoritePreset}
                    onPlayTrack={playMixerTrack}
                    onRenameFavoritePreset={renameFavoritePreset}
                    onSaveFavoritePreset={saveFavoritePreset}
                    onRenameFolder={renameLibraryFolder}
                    onSeekTrack={seekMixerTrack}
                    onStopAll={stopAllMixerTracks}
                    onStopTrack={stopMixerTrack}
                    onToggleFavorite={toggleFavoriteTrack}
                    onTrackVolumeChange={setMixerTrackVolume}
                    onUpdateTrack={handleUpdateMusicTrack}
                    statusMessage={libraryAudioStatusMessage}
                    trackFolders={libraryState.itemFolders.music}
                    trackVolumes={libraryState.trackVolumes}
                    tracks={audioLibraryTracks}
                  />
                </DeferredTabletopTool>
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
                <DeferredTabletopTool>
                  <TabletopCinematicsLibrary
                    activeCinematicId={preparedScene?.metadata.cinematicId ?? ''}
                    cinematics={assetLibrary?.cinematics ?? []}
                    onActivate={(cinematicId) => applyCinematicToPreparedScene(cinematicId)}
                    onTrigger={triggerCinematicOverlay}
                    targetSceneName={preparedScene?.name ?? 'Sem cena'}
                  />
                </DeferredTabletopTool>
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

          {activeHudPanel === 'book' ? (
            <FloatingWindow
              initialPosition={{ x: 104, y: 220 }}
              initialSize={{ width: viewMode === 'gm' ? 900 : 720, height: 680 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle={
                viewMode === 'gm'
                  ? masterBookView === 'history'
                    ? 'Cronica e continuidade confidencial da campanha.'
                    : 'Regras, DTs e protocolos do Mestre sem sair da mesa.'
                  : 'Regras publicas para decidir a proxima acao.'
              }
              title={viewMode === 'gm' ? 'Escudo do Mestre' : 'Livro do Jogador'}
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle={
                  viewMode === 'gm'
                    ? masterBookView === 'history'
                      ? 'Cronica e continuidade confidencial da campanha.'
                      : 'Regras, DTs e protocolos do Mestre sem sair da mesa.'
                    : 'Regras publicas para decidir a proxima acao.'
                }
                title={viewMode === 'gm' ? 'Escudo do Mestre' : 'Livro do Jogador'}
              >
                {viewMode === 'gm' ? (
                  <TabletopVisualLibrary
                    className="tabletop-master-shield"
                    code="ESC"
                    contentHeader={
                      <div>
                        <p className="eyebrow">
                          {masterBookView === 'history' ? 'Continuidade' : 'Consulta rápida'}
                        </p>
                        <h3>
                          {masterBookView === 'history'
                            ? 'Livro da História'
                            : 'Regras do Mestre'}
                        </h3>
                        <p className="support-copy">
                          {masterBookView === 'history'
                            ? 'Crônica e continuidade confidencial da campanha.'
                            : 'Regras, DTs e protocolos sem sair da mesa.'}
                        </p>
                      </div>
                    }
                    icon={BookOpen}
                    sidebar={
                      <nav
                        aria-label="Conteúdo do Escudo do Mestre"
                        className="tabletop-visual-library__nav"
                        data-testid="master-shield-section-tabs"
                      >
                        <button
                          aria-current={masterBookView === 'rules' ? 'page' : undefined}
                          className={masterBookView === 'rules' ? 'is-active' : ''}
                          onClick={() => setMasterBookView('rules')}
                          type="button"
                        >
                          <BookOpen aria-hidden="true" size={17} />
                          <span>Regras</span>
                        </button>
                        <button
                          aria-current={masterBookView === 'history' ? 'page' : undefined}
                          className={masterBookView === 'history' ? 'is-active' : ''}
                          onClick={() => setMasterBookView('history')}
                          type="button"
                        >
                          <History aria-hidden="true" size={17} />
                          <span>Livro da História</span>
                        </button>
                      </nav>
                    }
                    testId="master-shield-library"
                    title="Escudo do Mestre"
                  >
                    {masterBookView === 'history' ? (
                      <HistoryQuickReference audience="master" />
                    ) : (
                      <RulebookQuickReference audience="master" />
                    )}
                  </TabletopVisualLibrary>
                ) : (
                  <RulebookQuickReference audience="player" />
                )}
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

          {activeHudPanel === 'turns' ? (
            <FloatingWindow
              initialPosition={{ x: 104, y: 190 }}
              initialSize={{ width: 980, height: 660 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Selecione participantes, ordem e vez atual."
              title="Turnos"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Selecione participantes, ordem e vez atual."
                title="Turnos"
              >
                <TabletopTurnSetupPanel
                  activeTokenId={turnDraftActiveTokenId}
                  candidates={turnCandidates}
                  onApply={handleApplyTurnDraft}
                  onMove={handleTurnDraftMove}
                  onReorder={handleTurnDraftReorder}
                  onSetActive={setTurnDraftActiveTokenId}
                  onToggleCandidate={handleTurnDraftToggle}
                  selectedTokenIds={turnDraftTokenIds}
                />
              </TabletopHudPanel>
            </FloatingWindow>
          ) : null}

          {activeHudPanel === 'diagnostics' ? (
            <FloatingWindow
              initialPosition={{ x: 104, y: 220 }}
              initialSize={{ width: 620, height: 560 }}
              onClose={() => setActiveHudPanel(null)}
              subtitle="Rede, fila remota e confirmacoes do servidor."
              title="Diagnostico multiplayer"
            >
              <TabletopHudPanel
                onClose={() => setActiveHudPanel(null)}
                showChrome={false}
                subtitle="Rede, fila remota e confirmacoes do servidor."
                title="Diagnostico multiplayer"
              >
                <div className="multiplayer-diagnostics">
                  <div className="multiplayer-diagnostics__summary">
                    <article>
                      <span>Estado</span>
                      <strong>{multiplayerConnectionStatus}</strong>
                    </article>
                    <article>
                      <span>Ping</span>
                      <strong>{multiplayerDiagnosticPingLabel}</strong>
                    </article>
                    <article>
                      <span>Fila</span>
                      <strong>{multiplayerDiagnostics.pendingActions}</strong>
                    </article>
                    <article>
                      <span>Socket</span>
                      <strong>{multiplayerDiagnostics.socketState}</strong>
                    </article>
                  </div>

                  <article className="list-card">
                    <div className="list-card__top">
                      <div>
                        <h3>Pre-voo da mesa</h3>
                        <p className="support-copy">
                          Use antes do teste e copie se alguma coisa travar, cair ou nao sincronizar.
                        </p>
                      </div>
                      <button
                        className="button"
                        onClick={handleCopyMultiplayerDiagnostics}
                        type="button"
                      >
                        Copiar diagnostico
                      </button>
                    </div>
                    <div className="multiplayer-diagnostics__checklist">
                      {multiplayerDiagnosticRiskItems.map((item) => (
                        <div
                          className={`multiplayer-diagnostics__check multiplayer-diagnostics__check--${item.status}`}
                          key={item.label}
                        >
                          <span className={`status-pill status-pill--${item.status}`}>
                            {item.status === 'steady'
                              ? 'OK'
                              : item.status === 'watch'
                                ? 'Atencao'
                                : 'Critico'}
                          </span>
                          <strong>{item.label}</strong>
                          <small>{item.text}</small>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="list-card">
                    <div className="list-card__top">
                      <h3>Ultima acao remota</h3>
                      <span className={`status-pill status-pill--${multiplayerDiagnosticTone}`}>
                        {multiplayerDiagnosticStatusLabel}
                      </span>
                    </div>
                    <div className="multiplayer-diagnostics__grid">
                      <span>Tipo</span>
                      <strong>{multiplayerDiagnostics.lastActionType || '--'}</strong>
                      <span>Enfileirada</span>
                      <strong>{formatDiagnosticTimestamp(multiplayerDiagnostics.lastQueuedAt)}</strong>
                      <span>ACK</span>
                      <strong>{formatDiagnosticTimestamp(multiplayerDiagnostics.lastAckAt)}</strong>
                      <span>Retries</span>
                      <strong>{multiplayerDiagnostics.retryAttempts}</strong>
                      <span>Reconexoes</span>
                      <strong>{multiplayerDiagnostics.reconnectAttempts}</strong>
                      <span>Snapshot</span>
                      <strong>{multiplayerDiagnostics.stateVersion || '--'}</strong>
                      <span>Atrasados bloqueados</span>
                      <strong>{multiplayerDiagnostics.staleStatesIgnored}</strong>
                    </div>
                  </article>

                  <article className="list-card">
                    <div className="list-card__top">
                      <h3>Host e jogadores</h3>
                      <span className="tag">
                        {multiplayerDiagnosticPlayers.length} conectado(s)
                      </span>
                    </div>
                    <div className="multiplayer-diagnostics__grid">
                      <span>Codigo</span>
                      <strong>
                        {multiplayerHostStatus?.sessionCode ||
                          multiplayerClientConfig?.sessionCode ||
                          '--'}
                      </strong>
                      <span>Porta</span>
                      <strong>
                        {multiplayerHostStatus?.port ?? multiplayerClientConfig?.port ?? '--'}
                      </strong>
                      <span>Host</span>
                      <strong>
                        {multiplayerClientConfig?.host ||
                          multiplayerHostStatus?.localIps?.[0] ||
                          'local'}
                      </strong>
                      <span>Versao</span>
                      <strong>{multiplayerHostStatus?.serverVersion ?? '--'}</strong>
                      <span>Protocolo</span>
                      <strong>{multiplayerHostStatus?.protocolVersion ?? '--'}</strong>
                      <span>Snapshot host</span>
                      <strong>{multiplayerHostStatus?.stateVersion ?? '--'}</strong>
                    </div>
                    <div className="multiplayer-diagnostics__players">
                      {multiplayerDiagnosticPlayers.length > 0 ? (
                        multiplayerDiagnosticPlayers.map((player) => (
                          <span className="tag" key={player.id}>
                            {player.playerId}
                            {typeof player.latencyMs === 'number'
                              ? ` · ${player.latencyMs} ms`
                              : ''}
                          </span>
                        ))
                      ) : (
                        <p className="support-copy">Nenhum jogador remoto conectado agora.</p>
                      )}
                    </div>
                  </article>

                  {multiplayerErrorMessage ? (
                    <article className="list-card list-card--danger">
                      <div className="list-card__top">
                        <h3>Alerta atual</h3>
                        <span className="tag">
                          {formatDiagnosticTimestamp(multiplayerDiagnostics.lastErrorAt)}
                        </span>
                      </div>
                      <p className="support-copy">{multiplayerErrorMessage}</p>
                    </article>
                  ) : null}
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

      {activeUtilityWindow === 'world' && canOpenPlayerMundi && playerPublicMundiState ? (
        <FloatingWindow
          initialPosition={{ x: 80, y: 70 }}
          initialSize={{ width: Math.min(window.innerWidth - 160, 1320), height: Math.min(window.innerHeight - 120, 820) }}
          onClose={() => setActiveUtilityWindow(null)}
          subtitle="Mapa geral liberado pelo mestre."
          title="Mapa Mundi"
        >
          <div className="list-stack">
            <DeferredTabletopTool>
              {playerPublicMundiState.publicMap.releasedToPlayers ? (
                <TabletopGeneralMundiView
                  clock={
                    playerPublicMundiState.clock &&
                    typeof playerPublicMundiState.clock === 'object'
                      ? (playerPublicMundiState.clock as WorldMundiClock)
                      : null
                  }
                  points={playerPublicMundiState.publicLocations.map((location) => ({
                    ...location,
                    current: playerPublicMundiState.currentLocationIds.includes(location.id),
                    discovered: true,
                  }))}
                  releasedToPlayers={playerPublicMundiState.publicMap.releasedToPlayers}
                />
              ) : null}
              {playerPublicMundiState.publicBase?.releasedToPlayers ? (
                <TabletopBaseMundiView
                  bases={playerPublicMundiState.publicBase.bases.map((base) => ({
                    ...base,
                    upgrades: base.upgrades.map((upgrade) =>
                      createWorldMundiBaseUpgrade({
                        ...upgrade,
                        custo: '',
                        locationHintId: '',
                        requisito: '',
                        tags: [],
                        status: upgrade.status === 'ativo' ? 'ativo' : 'bloqueado',
                      }),
                    ),
                  }))}
                  clock={
                    playerPublicMundiState.clock &&
                    typeof playerPublicMundiState.clock === 'object'
                      ? (playerPublicMundiState.clock as WorldMundiClock)
                      : null
                  }
                  releasedToPlayers={playerPublicMundiState.publicBase.releasedToPlayers}
                  selectedBaseId={playerPublicMundiState.publicBase.selectedBaseId}
                  upgrades={playerPublicMundiState.publicBase.upgrades.map((upgrade) =>
                    createWorldMundiBaseUpgrade({
                      ...upgrade,
                      custo: '',
                      locationHintId: '',
                      requisito: '',
                      tags: [],
                      status: upgrade.status === 'ativo' ? 'ativo' : 'bloqueado',
                    }),
                  )}
                />
              ) : null}
            </DeferredTabletopTool>
          </div>
        </FloatingWindow>
      ) : null}

      {activeUtilityWindow === 'log' ? (
        <FloatingWindow
          className="floating-window--log"
          initialPosition={{ x: window.innerWidth > 1200 ? 980 : 140, y: 72 }}
          initialSize={{ width: 420, height: 620 }}
          onClose={() => setActiveUtilityWindow(null)}
          restoreSignal={combatFocusRequest?.id}
          subtitle="Mensagens, pings e rolagens da sessao."
          title="Chat e rolagem"
        >
          <TabletopSessionLog
            authorLabel={activeSessionAuthorLabel}
            bonusOptions={rollBonusOptions}
            combatFocusSignal={combatFocusRequest?.id}
            combatPanel={
              <TabletopCombatRoller
                characters={data.characters.items}
                fixedCharacterId={
                  viewMode === 'player' ? focusedPlayerCharacter?.id : undefined
                }
                focusRequest={combatFocusRequest ?? undefined}
                isGm={viewMode === 'gm'}
                onActivate={handleActivateCharacterFeature}
                onPreview={handleCombatRangePreview}
                preferredSourceTokenId={sheetActionTokenId}
                tokens={visibleTokens}
              />
            }
            entries={logEntries}
            isGm={viewMode === 'gm'}
            isRollLocked={isDiceRollLocked}
            onAddEntry={appendLogEntry}
            onClearChatEntries={clearChatLogEntries}
            onClearRollEntries={clearRollLogEntries}
            onRollDraftChange={setTabletopRollDraft}
            onRollSubmit={handleRollSubmitWindowBehavior}
            rollLockLabel={diceRollLockLabel}
            rollQueueLabels={diceRollQueueLabels}
            rollDraft={tabletopRollDraft}
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

      {activeUtilityWindow === 'book' && viewMode === 'player' ? (
        <FloatingWindow
          initialPosition={{
            x: Math.max(24, window.innerWidth - Math.min(720, window.innerWidth - 48) - 24),
            y: 82,
          }}
          initialSize={{
            width: Math.min(720, window.innerWidth - 48),
            height: Math.min(640, window.innerHeight - 106),
          }}
          onClose={() => setActiveUtilityWindow(null)}
          subtitle="Regras publicas para decidir a proxima acao sem sair da mesa."
          title="Livro do Jogador"
        >
          <TabletopHudPanel
            onClose={() => setActiveUtilityWindow(null)}
            showChrome={false}
            subtitle="Regras publicas para decidir a proxima acao sem sair da mesa."
            title="Livro do Jogador"
          >
            <RulebookQuickReference audience="player" />
          </TabletopHudPanel>
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

      {pendingCombatResolution && viewMode === 'gm' ? (
        <FloatingWindow
          initialPosition={{ x: window.innerWidth > 1180 ? 760 : 120, y: 120 }}
          initialSize={{ width: 520, height: 560 }}
          onClose={() => setPendingCombatResolution(null)}
          subtitle="Confirme alvo, defesa e dano antes de alterar a ficha."
          title="Resolver ataque"
        >
          <div className="list-stack">
            <article className="list-card">
              <div className="list-card__top">
                <div>
                  <p className="eyebrow">Ataque</p>
                  <h3>{pendingCombatResolution.attackName}</h3>
                  <p className="support-copy">
                    <strong>
                      {pendingCombatResolution.attackerName} -&gt;{' '}
                      {pendingCombatTargetCharacter?.nome ?? 'alvo ainda nao escolhido'}
                    </strong>
                  </p>
                </div>
                <div className="tag-row">
                  <span className="tag">{pendingCombatResolution.attackerName}</span>
                  <span className="tag">
                    {pendingCombatResolution.stage === 'defense'
                      ? '1. Defesa'
                      : pendingCombatResolution.stage === 'damage'
                        ? '2. Dano'
                        : '3. Resultado'}
                  </span>
                </div>
              </div>
              {typeof pendingCombatResolution.rollTotal === 'number' ? (
                <p className="support-copy">
                  Acerto: {pendingCombatResolution.rollTotal}
                </p>
              ) : null}
              {pendingCombatResolution.rollText ? (
                <p className="support-copy">{pendingCombatResolution.rollText}</p>
              ) : null}
              {typeof pendingCombatResolution.distanceSquares === 'number' ? (
                <p className="support-copy">
                  Distancia congelada na rolagem:{' '}
                  <strong>
                    {pendingCombatResolution.distanceSquares.toFixed(
                      pendingCombatResolution.distanceSquares % 1 === 0 ? 0 : 1,
                    )}{' '}
                    quadrado(s) / {(pendingCombatResolution.distanceMeters ?? 0).toFixed(1)} m
                  </strong>
                </p>
              ) : null}
              {pendingCombatResolution.costs.length > 0 &&
              pendingCombatAttackerCharacter ? (
                <div className="tag-row">
                  {pendingCombatResolution.costs.map((cost, index) => {
                    const currentValue =
                      cost.resource === 'vida'
                        ? pendingCombatAttackerCharacter.recursos.vidaAtual
                        : cost.resource === 'fushi'
                          ? pendingCombatAttackerCharacter.recursos.fushiAtual
                          : pendingCombatAttackerCharacter.recursos.determinacaoAtual
                    const label =
                      cost.resource === 'vida'
                        ? 'Vida'
                        : cost.resource === 'fushi'
                          ? 'FUSHI'
                          : 'Determinacao'

                    return (
                      <span className="tag tag--warning" key={`${cost.resource}-${index}`}>
                        {label}: {currentValue} -&gt; {Math.max(0, currentValue - cost.amount)}
                      </span>
                    )
                  })}
                </div>
              ) : null}
            </article>

            {pendingCombatResolution.stage === 'defense' ? (
            <article className="list-card">
              <label className="field">
                <span className="field__label">Alvo</span>
                <select
                  className="field__input"
                  onChange={(event) =>
                    setPendingCombatResolution((currentResolution) =>
                      currentResolution
                        ? {
                            ...currentResolution,
                            opposedRollEntryId: undefined,
                            opposedRollTotal: undefined,
                            targetTokenId: event.target.value,
                          }
                        : currentResolution,
                    )
                  }
                  value={pendingCombatResolution.targetTokenId}
                >
                  <option value="">Escolher alvo</option>
                  {combatTargetTokens.map((token) => {
                    const tokenCharacter = resolveTokenCharacterForCombat(token)

                    return (
                      <option key={token.id} value={token.id}>
                        {tokenCharacter?.nome ?? token.label}
                      </option>
                    )
                  })}
                </select>
              </label>

              {pendingCombatTargetCharacter ? (
                <>
                  {pendingCombatResolution.checkTarget === 'ca' ? (
                    <div className="metric-grid metric-grid--compact">
                    <article className="metric-card">
                      <span className="metric-card__label">CA</span>
                      <strong className="metric-card__value">
                        {pendingCombatTargetCharacter.defesa}
                      </strong>
                    </article>
                    <article className="metric-card">
                      <span className="metric-card__label">Bloqueio</span>
                      <strong className="metric-card__value">
                        {pendingCombatBlockValue}
                      </strong>
                      <small>Fortitude, teto 15</small>
                    </article>
                    <article className="metric-card">
                      <span className="metric-card__label">Esquiva</span>
                      <strong className="metric-card__value">
                        {pendingCombatDodgeValue ?? '--'}
                      </strong>
                      <small>{getCombatDodgeSummary(pendingCombatTargetCharacter)}</small>
                    </article>
                    </div>
                  ) : (
                    <div className="metric-grid metric-grid--compact">
                      <article className="metric-card">
                        <span className="metric-card__label">
                          {pendingCombatResolution.checkTarget === 'dt'
                            ? 'Dificuldade'
                            : 'Defesa resistida'}
                        </span>
                        <strong className="metric-card__value">
                          {pendingCombatResolution.checkTarget === 'dt'
                            ? pendingCombatResolution.checkDifficulty ?? '--'
                            : pendingCombatResolution.opposedRollTotal ?? '--'}
                        </strong>
                        <small>{pendingCombatCheckLabel}</small>
                      </article>
                    </div>
                  )}
                  {pendingCombatResolution.checkTarget === 'ca' ? (
                    <p className="support-copy">
                      {pendingCombatTargetReactionUsed
                        ? 'Reacao ja usada neste ciclo de turno.'
                        : 'Reacao disponivel: Bloquear ou Esquivar.'}
                    </p>
                  ) : null}
                  {pendingCombatResolution.checkTarget === 'resistido' &&
                  typeof pendingCombatResolution.opposedRollTotal !== 'number' ? (
                    <div className="combat-resolution-suggestion">
                      <div className="list-card__top">
                        <div>
                          <p className="eyebrow">Defesa do alvo</p>
                          <h3>{pendingCombatCheckLabel}</h3>
                        </div>
                        <button
                          className="button button--primary"
                          disabled={Boolean(pendingCombatResolution.opposedRollEntryId)}
                          onClick={handleRollPendingCombatOpposedDefense}
                          type="button"
                        >
                          {pendingCombatResolution.opposedRollEntryId
                            ? 'Rolando defesa...'
                            : 'Rolar defesa resistida'}
                        </button>
                      </div>
                      <p className="support-copy">
                        O alvo usa o proprio atributo e pericia. Empate favorece a defesa.
                      </p>
                    </div>
                  ) : null}
                  {pendingCombatSuggestionLabel ? (
                    <div className="combat-resolution-suggestion">
                      <div className="list-card__top">
                        <div>
                          <p className="eyebrow">Sugestao</p>
                          <h3>
                            {pendingCombatSuggestedOutcome === 'hit'
                              ? 'Provavel acerto'
                              : 'Provavel erro'}
                          </h3>
                        </div>
                        {pendingCombatSuggestedOutcome ? (
                          <button
                            className="button"
                            onClick={() =>
                              handleResolvePendingCombat(pendingCombatSuggestedOutcome)
                            }
                            type="button"
                          >
                            Aplicar sugestao
                          </button>
                        ) : null}
                      </div>
                      <p className="support-copy">{pendingCombatSuggestionLabel}</p>
                    </div>
                  ) : null}
                  {pendingCombatResolution.checkTarget === 'ca' &&
                  pendingCombatDodgeSuggestionLabel ? (
                    <div className="combat-resolution-suggestion">
                      <div className="list-card__top">
                        <div>
                          <p className="eyebrow">Esquiva</p>
                          <h3>
                            {pendingCombatDodgeSucceeded
                              ? 'Esquiva confirmada'
                              : 'Esquiva falhou'}
                          </h3>
                        </div>
                        {pendingCombatDodgeSucceeded ? (
                          <button
                            className="button"
                            onClick={() => handleResolvePendingCombat('dodge')}
                            type="button"
                          >
                            Aplicar Esquiva
                          </button>
                        ) : null}
                      </div>
                      <p className="support-copy">{pendingCombatDodgeSuggestionLabel}</p>
                    </div>
                  ) : null}
                  <div className="button-row">
                    <button
                      className="button button--primary"
                      disabled={!pendingCombatDefenseReady}
                      onClick={() => handleResolvePendingCombat('hit')}
                      type="button"
                    >
                      Confirmar acerto
                    </button>
                    <button
                      className="button"
                      disabled={
                        pendingCombatResolution.checkTarget !== 'ca' ||
                        pendingCombatTargetReactionUsed
                      }
                      onClick={() => handleResolvePendingCombat('block')}
                      type="button"
                    >
                      Bloquear
                    </button>
                    <button
                      className="button"
                      disabled={
                        pendingCombatResolution.checkTarget !== 'ca' ||
                        pendingCombatDodgeValue === null ||
                        pendingCombatTargetReactionUsed ||
                        typeof pendingCombatResolution.rollTotal !== 'number' ||
                        pendingCombatDodgeSucceeded !== true
                      }
                      onClick={() => handleResolvePendingCombat('dodge')}
                      type="button"
                    >
                      Esquivar
                    </button>
                    <button
                      className="button"
                      disabled={!pendingCombatDefenseReady}
                      onClick={() => handleResolvePendingCombat('miss')}
                      type="button"
                    >
                      Confirmar erro
                    </button>
                  </div>
                </>
              ) : (
                <p className="support-copy">Escolha um token alvo para resolver.</p>
              )}
            </article>
            ) : null}

            {pendingCombatResolution.stage === 'damage' ? (
            <article className="list-card">
              <div className="list-card__top">
                <div>
                  <p className="eyebrow">Dano</p>
                  <h3>{pendingCombatDamageFormula || 'Manual'}</h3>
                </div>
                {pendingCombatResolution.isCritical ? (
                  <span className="tag tag--danger">Critico: dados dobrados</span>
                ) : null}
                {pendingCombatDamageRollConfig ? (
                  <button
                    className="button"
                    disabled={Boolean(pendingCombatResolution.damageRollEntryId)}
                    onClick={handleRollPendingCombatDamage}
                    type="button"
                  >
                    {pendingCombatResolution.damageRollEntryId ? 'Rolando...' : 'Rolar dano'}
                  </button>
                ) : null}
              </div>
              <div className="combat-resolution-result__calculation">
                <span>Base: {pendingCombatResolution.baseDamageFormula || 'manual'}</span>
                <span>
                  Build:{' '}
                  {pendingCombatResolution.buildDamageBonus > 0 ? '+' : ''}
                  {pendingCombatResolution.buildDamageBonus}
                  {pendingCombatDamageContextLabel
                    ? ` (${pendingCombatDamageContextLabel})`
                    : ''}
                </span>
                <strong>Rolagem base: {pendingCombatDamageFormula || 'manual'}</strong>
              </div>
              {pendingCombatUsesSurgicalAnalysis ? (
                <div className="combat-resolution-effect combat-resolution-effect--positive">
                  <strong>Análise Cirúrgica ativa</strong>
                  <span>O dano bruto será dobrado uma vez contra este alvo.</span>
                </div>
              ) : null}
              {pendingCombatGuardianReduction > 0 ? (
                <div className="combat-resolution-effect">
                  <strong>Casca de Vigia</strong>
                  <span>A primeira fonte de dano desta cena causa 1 a menos.</span>
                </div>
              ) : null}
              <label className="field">
                <span className="field__label">Resultado dos dados, sem Build</span>
                <input
                  className="field__input"
                  min={0}
                  onChange={(event) =>
                    setPendingCombatResolution((currentResolution) =>
                      currentResolution
                        ? {
                            ...currentResolution,
                            rawDamage: sanitizeCombatDamage(Number(event.target.value)),
                          }
                        : currentResolution,
                    )
                  }
                  type="number"
                  value={pendingCombatResolution.rawDamage}
                />
              </label>
              {pendingCombatTargetCharacter ? (
                <div className="metric-grid metric-grid--compact">
                  <article className="metric-card">
                    <span className="metric-card__label">Dano aplicado</span>
                    <strong className="metric-card__value">{pendingCombatHitDamage}</strong>
                    <small>
                      Vida {pendingCombatTargetCharacter.recursos.vidaAtual} -&gt;{' '}
                      {pendingCombatLifeAfterHit}
                    </small>
                  </article>
                  {pendingCombatResolution.outcome === 'block' ? (
                    <article className="metric-card">
                    <span className="metric-card__label">Bloqueio</span>
                    <strong className="metric-card__value">
                      {pendingCombatBlockedDamage}
                    </strong>
                    <small>
                      Bloq {pendingCombatBlockValue} · vida{' '}
                      {pendingCombatTargetCharacter.recursos.vidaAtual} -&gt;{' '}
                      {pendingCombatLifeAfterBlock}
                    </small>
                  </article>
                  ) : null}
                </div>
              ) : null}
              <div className="button-row">
                <button
                  className="button button--primary"
                  disabled={
                    !pendingCombatTargetCharacter ||
                    Boolean(pendingCombatResolution.damageRollEntryId)
                  }
                  onClick={() =>
                    setPendingCombatResolution((currentResolution) =>
                      currentResolution
                        ? { ...currentResolution, stage: 'result' }
                        : currentResolution,
                    )
                  }
                  type="button"
                >
                  Confirmar dano manual
                </button>
              </div>
            </article>
            ) : null}

            {pendingCombatResolution.stage === 'result' &&
            pendingCombatResolution.outcome ? (
              <article
                className={`combat-resolution-result combat-resolution-result--${pendingCombatResolution.outcome}`}
              >
                <span>Resultado</span>
                <strong>
                  {pendingCombatResolution.outcome === 'miss'
                    ? 'ERROU'
                    : pendingCombatResolution.outcome === 'dodge'
                      ? 'ESQUIVOU'
                      : pendingCombatResolution.outcome === 'block'
                        ? `BLOQUEOU ${Math.min(
                            pendingCombatDamageBeforeDefense,
                            pendingCombatBlockValue,
                          )}`
                        : pendingCombatResolutionMode === 'heal'
                          ? `CURA ${pendingCombatFinalAmount}`
                          : `ACERTOU ${pendingCombatHitDamage}`}
                </strong>
                {pendingCombatResolution.outcome === 'hit' ||
                pendingCombatResolution.outcome === 'block' ? (
                  <div className="combat-resolution-result__calculation">
                    <span>Rolagem bruta: {pendingCombatRawDamage}</span>
                    {pendingCombatResolution.buildDamageBonus !== 0 ? (
                      <span>
                        {pendingCombatResolution.buildDamageBonus > 0
                          ? 'Build antes do multiplicador'
                          : 'Penalidade depois do multiplicador'}
                        :{' '}
                        {pendingCombatResolution.buildDamageBonus > 0 ? '+' : ''}
                        {pendingCombatResolution.buildDamageBonus}
                      </span>
                    ) : null}
                    {pendingCombatUsesSurgicalAnalysis ? (
                      <span>
                        Analise: ({pendingCombatRawDamage}
                        {pendingCombatDamageSequence.positiveBuildModifier > 0
                          ? ` + ${pendingCombatDamageSequence.positiveBuildModifier}`
                          : ''}
                        ) x2
                        {pendingCombatDamageSequence.negativeBuildModifier < 0
                          ? ` ${pendingCombatDamageSequence.negativeBuildModifier}`
                          : ''}
                      </span>
                    ) : null}
                    {pendingCombatGuardianReduction > 0 ? <span>Casca: -1</span> : null}
                    {pendingCombatResolution.outcome === 'block' ? (
                      <span>Bloqueio: -{pendingCombatBlockValue}</span>
                    ) : null}
                    <strong>
                      {pendingCombatResolutionMode === 'heal'
                        ? 'Cura final'
                        : 'Dano final'}: {pendingCombatFinalAmount}
                    </strong>
                  </div>
                ) : (
                  <p>Nenhum dano será aplicado.</p>
                )}
                {pendingCombatResolution.outcome === 'hit' ||
                pendingCombatResolution.outcome === 'block' ? (
                  <label className="field">
                    <span className="field__label">
                      {pendingCombatResolutionMode === 'heal'
                        ? 'Cura final ajustavel pelo Mestre'
                        : 'Dano final ajustavel pelo Mestre'}
                    </span>
                    <input
                      className="field__input"
                      min={0}
                      onChange={(event) =>
                        setPendingCombatResolution((currentResolution) =>
                          currentResolution
                            ? {
                                ...currentResolution,
                                manualDamage: sanitizeCombatDamage(
                                  Number(event.target.value),
                                ),
                              }
                            : currentResolution,
                        )
                      }
                      type="number"
                      value={pendingCombatFinalAmount}
                    />
                    <small>
                      Sugestao automatica: {pendingCombatSuggestedDamage}. Este valor sera
                      aplicado na ficha.
                    </small>
                  </label>
                ) : null}
                {pendingCombatResolution.sourceFeatureResolution?.mode ===
                  'drain-transfer' &&
                pendingCombatEffectiveDamage > 0 ? (
                  <label className="field">
                    <span className="field__label">Transferir a Vida drenada para</span>
                    <select
                      className="field__input"
                      onChange={(event) =>
                        setPendingCombatResolution((currentResolution) =>
                          currentResolution
                            ? {
                                ...currentResolution,
                                healingTargetTokenId: event.target.value,
                              }
                            : currentResolution,
                        )
                      }
                      value={pendingCombatResolution.healingTargetTokenId ?? ''}
                    >
                      <option value="">Escolher quem recebe a cura</option>
                      {pendingCombatHealingTargetTokens
                        .map((token) => (
                          <option key={token.id} value={token.id}>
                            {resolveTokenCharacterForCombat(token)?.nome ?? token.label}
                          </option>
                        ))}
                    </select>
                  </label>
                ) : null}
                {pendingCombatTargetCharacter ? (
                  <div className="metric-grid metric-grid--compact">
                    {pendingCombatFinalDamage > 0 ? (
                      <article className="metric-card">
                        <span className="metric-card__label">Quem recebe o dano</span>
                        <strong className="metric-card__value">
                          {pendingCombatTargetCharacter.nome}
                        </strong>
                        <small>
                          Vida {pendingCombatTargetCharacter.recursos.vidaAtual} -&gt;{' '}
                          {Math.max(
                            0,
                            pendingCombatTargetCharacter.recursos.vidaAtual -
                              pendingCombatEffectiveDamage,
                          )}
                        </small>
                      </article>
                    ) : null}
                    {pendingCombatHealingTargetCharacter &&
                    pendingCombatHealingAmount > 0 ? (
                      <article className="metric-card">
                        <span className="metric-card__label">Quem recebe a cura</span>
                        <strong className="metric-card__value">
                          {pendingCombatHealingTargetCharacter.nome}
                        </strong>
                        <small>
                          Vida {pendingCombatHealingTargetCharacter.recursos.vidaAtual} -&gt;{' '}
                          {pendingCombatHealingTargetCharacter.recursos.vidaAtual +
                            pendingCombatEffectiveHealing}
                        </small>
                      </article>
                    ) : null}
                  </div>
                ) : null}
                <div className="button-row">
                  <button
                    className="button button--primary"
                    disabled={
                      pendingCombatResolutionMode === 'drain-transfer' &&
                      pendingCombatEffectiveDamage > 0 &&
                      !pendingCombatHealingTargetCharacter
                    }
                    onClick={handleFinalizePendingCombat}
                    type="button"
                  >
                    Confirmar alteracoes
                  </button>
                  <button
                    className="button"
                    onClick={() =>
                      setPendingCombatResolution((currentResolution) =>
                        currentResolution
                          ? { ...currentResolution, outcome: undefined, stage: 'defense' }
                          : currentResolution,
                      )
                    }
                    type="button"
                  >
                    Voltar à defesa
                  </button>
                  <button
                    className="button button--danger"
                    onClick={() => setPendingCombatResolution(null)}
                    type="button"
                  >
                    Cancelar ataque
                  </button>
                </div>
              </article>
            ) : null}
            {pendingCombatResolution.stage !== 'result' ? (
              <div className="button-row">
                <button
                  className="button button--danger"
                  onClick={() => setPendingCombatResolution(null)}
                  type="button"
                >
                  Cancelar ataque
                </button>
              </div>
            ) : null}
          </div>
        </FloatingWindow>
      ) : null}

      <TokenInspector
        canEdit={canEditActiveCharacter}
        editLock={activeCharacterEditLock}
        canEditToken={canEditActiveToken}
        canDuplicateMobToken={
          viewMode === 'gm' &&
          Boolean(activeToken) &&
          (activeToken?.tokenKind === 'mob' || activeCharacter?.tipo === 'mob')
        }
        canResizeToken={viewMode === 'gm' && Boolean(activeToken)}
        canRemoveToken={viewMode === 'gm' && Boolean(activeToken)}
        canManageDeathState={
          viewMode === 'gm' &&
          Boolean(activeToken && session?.playerDeathStates[activeToken.id])
        }
        character={activeCharacter}
        deathState={
          activeToken ? session?.playerDeathStates[activeToken.id] ?? null : null
        }
        effectsAppliedByCharacter={effectsAppliedByActiveCharacter}
        effectsAppliedToCharacter={effectsAppliedToActiveCharacter}
        factionName={activeFaction?.nome ?? null}
        factions={data.factions.items}
        focusRequest={sheetFocusRequest}
        activeSharedBodySheetSelectionId={activeSharedBodySheetSelectionId}
        activeIdentityResourceProfileId={
          viewMode === 'gm' ? activeIdentityResourceProfileId : ''
        }
        identityResourceOptions={viewMode === 'gm' ? identityResourceOptions : []}
        onBroadcastImage={viewMode === 'gm' ? broadcastImagePreview : undefined}
        onCancelEffect={handleCancelCombatEffect}
        onCreateStage={
          viewMode === 'gm' ? handleCreateCharacterStage : undefined
        }
        onDeleteStage={
          viewMode === 'gm' ? handleDeleteCharacterStage : undefined
        }
        onOpenStatusGuide={handleOpenStatusGuide}
        onRenameStage={
          viewMode === 'gm' ? handleRenameCharacterStage : undefined
        }
        onSwitchStage={
          viewMode === 'gm' ? handleSwitchCharacterStage : undefined
        }
        onActivateFeature={handlePrepareCharacterFeature}
        onBeginCharacterEdit={() =>
          activeCharacter ? beginCharacterEdit(activeCharacter.id) : false
        }
        onCharacterChange={handleInspectorCharacterChange}
        onClose={() => setInspectedTokenId('')}
        onDuplicateMobToken={() =>
          activeToken ? duplicateMobTokenOnCurrentScene(activeToken.id) : null
        }
        onDeathSaveSlotChange={(slotIndex) =>
          activeToken
            ? handleDeathSaveSlotChange(activeToken.id, slotIndex)
            : undefined
        }
        onEndCharacterEdit={() =>
          activeCharacter ? endCharacterEdit(activeCharacter.id) : undefined
        }
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
            ? (playerIds, originalState) =>
                handleBindTokenAsPlayerBody(activeToken.id, playerIds, originalState)
            : undefined
        }
        onTokenSizeChange={(preset) =>
          activeToken ? handleTokenSizeChange(activeToken.id, preset) : null
        }
        onToggleStealth={
          viewMode === 'gm' && activeToken
            ? () => handleToggleTokenStealth(activeToken.id)
            : undefined
        }
        onToggleVisibility={
          viewMode === 'gm' && activeToken
            ? () => handleToggleTokenVisibility(activeToken.id)
            : undefined
        }
        selectedCount={selectedTokenIds.length}
        showMasterControls={viewMode === 'gm'}
        showSensitiveNotes={viewMode === 'gm'}
        playerProfiles={accessState.profiles}
        sharedBodySheetOptions={viewMode === 'gm' ? sharedBodySheetOptions : []}
        token={activeToken}
        tokenSizePreset={activeTokenSpan?.preset ?? null}
        tokenSizeSummary={activeTokenSizeSummary}
        restoreSignal={tokenInspectorRestoreSignal}
      />
    </div>
  )
}
