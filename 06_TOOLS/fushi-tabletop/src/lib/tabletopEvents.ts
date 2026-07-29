import type { FushiItemRarity } from '../data/combatCatalog'

export type TabletopEventId =
  | 'initial-training'
  | 'build-rarity-draw'
  | 'skill-assignment'
export type TabletopEventCategory = 'world' | 'presentation' | 'management'
export type TabletopEventRarity = Exclude<FushiItemRarity, 'secreto'>

export interface TabletopEventDefinition {
  category: TabletopEventCategory
  description: string
  id: TabletopEventId
  label: string
  playerSurface: string
  shortLabel: string
  summary: string
}

export interface TabletopEventRuntimeState {
  activatedAt?: number
  deactivatedAt?: number
  isActive: boolean
  restoreMapId?: string
  updatedAt: number
}

export interface TabletopRarityDrawState {
  characterId: string
  characterName: string
  drawId: string
  itemId: string
  itemName: string
  lastRoll?: number
  phase: 'idle' | 'rolling'
  presentationExpiresAt?: number
  rarity?: TabletopEventRarity
  revealAt?: number
  startedAt?: number
}

export interface TabletopRarityDrawHistoryEntry {
  characterId: string
  characterName: string
  drawId: string
  itemId: string
  itemName: string
  rarity: TabletopEventRarity
  roll: number
  rolledAt: number
}

export interface TabletopEventSystemState {
  events: Record<TabletopEventId, TabletopEventRuntimeState>
  rarityDraw: TabletopRarityDrawState
  rarityHistory: TabletopRarityDrawHistoryEntry[]
  updatedAt: number
  version: 1
}

export const TABLETOP_EVENT_DEFINITIONS: TabletopEventDefinition[] = [
  {
    category: 'world',
    description:
      'Controla o arco do Campo de Treinamento, o painel de progresso e a visao publica dos cinco participantes.',
    id: 'initial-training',
    label: 'Treino Inicial',
    playerSurface: 'Painel de progresso do Circuito do Centro.',
    shortLabel: 'TREINO',
    summary: 'Evento de mundo com mapa, estacoes, progresso e prova final.',
  },
  {
    category: 'presentation',
    description:
      'Apresenta para a mesa o sorteio da raridade de um item no momento da absorcao, sem alterar a ficha automaticamente.',
    id: 'build-rarity-draw',
    label: 'Sorteio Raridade Build',
    playerSurface: 'Apresentacao sincronizada do item e da raridade revelada.',
    shortLabel: 'RARIDADE',
    summary: 'Evento visual temporario; o vinculo real continua sendo feito no BUI.',
  },
  {
    category: 'management',
    description:
      'Abre o catalogo privado do Mestre para atribuir habilidades e, futuramente, rituais ou outros efeitos diretamente a ficha canonica.',
    id: 'skill-assignment',
    label: 'Atribuir Skills',
    playerSurface: 'A ficha do personagem recebe apenas o conteudo atribuido pelo Mestre.',
    shortLabel: 'SKILLS',
    summary: 'Gestao privada de recompensas e desbloqueios permanentes.',
  },
]

const EVENT_IDS = TABLETOP_EVENT_DEFINITIONS.map((event) => event.id)

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function finiteTimestamp(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function createRuntimeState(now: number): TabletopEventRuntimeState {
  return {
    isActive: false,
    updatedAt: now,
  }
}

export function createTabletopEventSystemState(): TabletopEventSystemState {
  const now = Date.now()

  return {
    events: Object.fromEntries(
      EVENT_IDS.map((eventId) => [eventId, createRuntimeState(now)]),
    ) as Record<TabletopEventId, TabletopEventRuntimeState>,
    rarityDraw: {
      characterId: '',
      characterName: '',
      drawId: '',
      itemId: '',
      itemName: '',
      phase: 'idle',
    },
    rarityHistory: [],
    updatedAt: now,
    version: 1,
  }
}

function normalizeRuntimeState(value: unknown, fallback: TabletopEventRuntimeState) {
  const source = isRecord(value) ? value : {}

  return {
    activatedAt: finiteTimestamp(source.activatedAt),
    deactivatedAt: finiteTimestamp(source.deactivatedAt),
    isActive: source.isActive === true,
    restoreMapId:
      typeof source.restoreMapId === 'string' && source.restoreMapId.trim()
        ? source.restoreMapId.trim()
        : undefined,
    updatedAt: finiteTimestamp(source.updatedAt) ?? fallback.updatedAt,
  } satisfies TabletopEventRuntimeState
}

function normalizeRarity(value: unknown): TabletopEventRarity | undefined {
  return value === 'comum' ||
    value === 'raro' ||
    value === 'epico' ||
    value === 'lendario' ||
    value === 'mitico'
    ? value
    : undefined
}

function normalizeRarityDraw(value: unknown): TabletopRarityDrawState {
  const source = isRecord(value) ? value : {}
  const rarity = normalizeRarity(source.rarity)
  const startedAt = finiteTimestamp(source.startedAt)
  const presentationExpiresAt =
    finiteTimestamp(source.presentationExpiresAt) ??
    (startedAt ? startedAt + 18_000 : undefined)
  const phase =
    source.phase === 'rolling' &&
    rarity &&
    presentationExpiresAt &&
    presentationExpiresAt > Date.now()
      ? 'rolling'
      : 'idle'

  return {
    characterId: typeof source.characterId === 'string' ? source.characterId : '',
    characterName: typeof source.characterName === 'string' ? source.characterName : '',
    drawId: typeof source.drawId === 'string' ? source.drawId : '',
    itemId: typeof source.itemId === 'string' ? source.itemId : '',
    itemName: typeof source.itemName === 'string' ? source.itemName : '',
    lastRoll:
      typeof source.lastRoll === 'number' && Number.isInteger(source.lastRoll)
        ? Math.max(1, Math.min(10, source.lastRoll))
        : undefined,
    phase,
    presentationExpiresAt,
    rarity,
    revealAt: finiteTimestamp(source.revealAt),
    startedAt,
  }
}

function normalizeRarityHistory(value: unknown): TabletopRarityDrawHistoryEntry[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      if (!isRecord(entry)) return null
      const rarity = normalizeRarity(entry.rarity)
      const rolledAt = finiteTimestamp(entry.rolledAt)
      const roll =
        typeof entry.roll === 'number' && Number.isInteger(entry.roll)
          ? Math.max(1, Math.min(10, entry.roll))
          : undefined

      if (!rarity || !rolledAt || !roll || typeof entry.drawId !== 'string') return null

      return {
        characterId: typeof entry.characterId === 'string' ? entry.characterId : '',
        characterName: typeof entry.characterName === 'string' ? entry.characterName : '',
        drawId: entry.drawId,
        itemId: typeof entry.itemId === 'string' ? entry.itemId : '',
        itemName: typeof entry.itemName === 'string' ? entry.itemName : '',
        rarity,
        roll,
        rolledAt,
      } satisfies TabletopRarityDrawHistoryEntry
    })
    .filter((entry): entry is TabletopRarityDrawHistoryEntry => Boolean(entry))
    .slice(-100)
}

export function normalizeTabletopEventSystemState(
  value: unknown,
  options?: { legacyTrainingActive?: boolean },
): TabletopEventSystemState {
  const fallback = createTabletopEventSystemState()
  const source = isRecord(value) ? value : null
  const sourceEvents = source && isRecord(source.events) ? source.events : {}
  const events = Object.fromEntries(
    EVENT_IDS.map((eventId) => [
      eventId,
      normalizeRuntimeState(sourceEvents[eventId], fallback.events[eventId]),
    ]),
  ) as Record<TabletopEventId, TabletopEventRuntimeState>

  if (!source && options?.legacyTrainingActive) {
    events['initial-training'] = {
      activatedAt: Date.now(),
      isActive: true,
      updatedAt: Date.now(),
    }
  }

  const rarityDraw = normalizeRarityDraw(source?.rarityDraw)
  if (!events['build-rarity-draw'].isActive) {
    rarityDraw.phase = 'idle'
  }

  return {
    events,
    rarityDraw,
    rarityHistory: normalizeRarityHistory(source?.rarityHistory),
    updatedAt: finiteTimestamp(source?.updatedAt) ?? fallback.updatedAt,
    version: 1,
  }
}

export function isTabletopEventActive(
  state: TabletopEventSystemState | null | undefined,
  eventId: TabletopEventId,
) {
  return state?.events[eventId]?.isActive === true
}

export function setTabletopEventActive(
  state: TabletopEventSystemState,
  eventId: TabletopEventId,
  isActive: boolean,
  options?: { restoreMapId?: string },
) {
  const now = Date.now()
  const current = state.events[eventId]
  const nextRarityDraw =
    eventId === 'build-rarity-draw' && !isActive
      ? normalizeRarityDraw(null)
      : state.rarityDraw

  return {
    ...state,
    events: {
      ...state.events,
      [eventId]: {
        activatedAt: isActive ? current.activatedAt ?? now : current.activatedAt,
        deactivatedAt: isActive ? undefined : now,
        isActive,
        restoreMapId: isActive
          ? options?.restoreMapId || current.restoreMapId
          : undefined,
        updatedAt: now,
      },
    },
    rarityDraw: nextRarityDraw,
    rarityHistory: state.rarityHistory,
    updatedAt: now,
  } satisfies TabletopEventSystemState
}

export function getRarityFromD10(roll: number): TabletopEventRarity {
  if (roll <= 2) return 'comum'
  if (roll <= 4) return 'raro'
  if (roll <= 6) return 'epico'
  if (roll <= 9) return 'lendario'
  return 'mitico'
}

export function startTabletopRarityDraw(
  state: TabletopEventSystemState,
  input: {
    characterId: string
    characterName: string
    itemId: string
    itemName: string
    roll?: number
  },
) {
  if (!isTabletopEventActive(state, 'build-rarity-draw')) {
    return state
  }

  const now = Date.now()
  const roll = Number.isInteger(input.roll)
    ? Math.max(1, Math.min(10, Number(input.roll)))
    : 1 + Math.floor(Math.random() * 10)
  const drawId = `rarity-${now}-${Math.random().toString(36).slice(2, 9)}`
  const rarity = getRarityFromD10(roll)

  return {
    ...state,
    rarityDraw: {
      characterId: input.characterId,
      characterName: input.characterName,
      drawId,
      itemId: input.itemId,
      itemName: input.itemName,
      lastRoll: roll,
      phase: 'rolling',
      presentationExpiresAt: now + 18_000,
      rarity,
      revealAt: now + 2800,
      startedAt: now,
    },
    rarityHistory: [
      ...state.rarityHistory,
      {
        characterId: input.characterId,
        characterName: input.characterName,
        drawId,
        itemId: input.itemId,
        itemName: input.itemName,
        rarity,
        roll,
        rolledAt: now,
      },
    ].slice(-100),
    updatedAt: now,
  } satisfies TabletopEventSystemState
}

export function clearTabletopRarityDraw(state: TabletopEventSystemState) {
  return {
    ...state,
    rarityDraw: normalizeRarityDraw(null),
    rarityHistory: state.rarityHistory,
    updatedAt: Date.now(),
  } satisfies TabletopEventSystemState
}

export function clearTabletopRarityHistory(state: TabletopEventSystemState) {
  return {
    ...state,
    rarityDraw: state.rarityDraw,
    rarityHistory: [],
    updatedAt: Date.now(),
  } satisfies TabletopEventSystemState
}
