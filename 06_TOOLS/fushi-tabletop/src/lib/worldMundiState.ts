import type { CharacterSheet } from '../data/types'
import { storageAdapter } from './storage/storageAdapter'

export type WorldMundiLocationType =
  | 'ponto_importante'
  | 'subponto'
  | 'dungeon_visivel'
  | 'dungeon_escondida'
  | 'dungeon_condicional'
  | 'base_faccao'
  | 'base_bioma'
  | 'descanso'
  | 'evento'
  | 'recurso'
  | 'segredo'
  | 'vila'

export type WorldMundiVisualState =
  | 'normal'
  | 'sutil'
  | 'instavel'
  | 'alterado'
  | 'distorcido'
  | 'cataclismico'

export type WorldMundiDetailLevel =
  | 'detalhado'
  | 'slot_planejado'
  | 'generico'
  | 'oculto'

export type WorldMundiMapStatus =
  | 'placeholder'
  | 'asset_pendente'
  | 'pronto'
  | 'customizado'

export type WorldMundiSubmapType =
  | 'submapa'
  | 'interior'
  | 'entrada'
  | 'puzzle'
  | 'fase_boss'
  | 'cataclisma'
  | 'memoria'

export type WorldMundiEntryStatus =
  | 'ativo_no_inicio'
  | 'chega_dia_x'
  | 'chega_por_evento'
  | 'em_base'
  | 'oculto'
  | 'selado'
  | 'ainda_fora_da_ilha'

export type WorldMundiPresence =
  | 'token_visivel'
  | 'token_oculto'
  | 'influencia_regional'
  | 'rumor'
  | 'selado'
  | 'inativo'

export type WorldMundiIntention =
  | 'descansando'
  | 'patrulhando'
  | 'investigando'
  | 'cacando_recurso'
  | 'protegendo_base'
  | 'fugindo'
  | 'seguindo_pista'
  | 'procurando_combate'
  | 'observando'
  | 'oculto'
  | 'selado'
  | 'viajando'
  | 'negociando'
  | 'treinando'
  | 'recuperando'
  | 'em_evento_narrativo'

export type WorldMundiSimulationState =
  | 'autonomo'
  | 'em_cena_com_players'
  | 'acompanhando_grupo'
  | 'sob_controle_do_mestre'
  | 'pausado_por_contexto'
  | 'seguindo_contexto'
  | 'fora_de_cena'

export type WorldMundiPartyType =
  | 'grupo_principal'
  | 'player_solo'
  | 'party_temporaria'
  | 'grupo_misto'
  | 'grupo_npc'
  | 'grupo_faccao'
  | 'mob'

export type WorldMundiPartyState =
  | 'junto'
  | 'planejando_movimento'
  | 'viajando'
  | 'acampando'
  | 'separado'
  | 'em_cena'

export type WorldMundiRouteType =
  | 'rota_normal'
  | 'rota_dificil'
  | 'rota_oculta'
  | 'rota_condicional'
  | 'rota_bloqueada'
  | 'rota_perigosa'

export type WorldMundiEntityType =
  | 'mob'
  | 'patrulha'
  | 'viajantes'
  | 'criatura'
  | 'faccao'
  | 'evento'

export type WorldMundiEntityState =
  | 'ativo'
  | 'evitado'
  | 'derrotado'
  | 'fugiu'
  | 'oculto'
  | 'inativo'

export type WorldMundiBodyType =
  | 'corpo_original'
  | 'npc'
  | 'humano'
  | 'humano_comum'
  | 'animal'
  | 'criatura'
  | 'npc_importante'
  | 'fushi'

export type WorldMundiOriginalConsciousnessState =
  | 'suprimida'
  | 'em_disputa'
  | 'coexistindo'
  | 'removida'
  | 'desconhecida'

export interface WorldMundiBiome {
  id: string
  nome: string
  resumo: string
  riscoInicial: string
  estabilidadeInicial: number
  recursos: string[]
  faccoesProvaveis: string[]
  notes: string
}

export interface WorldMundiLocation {
  id: string
  nome: string
  tipo: WorldMundiLocationType
  biomaId: string
  nivelDetalhe: WorldMundiDetailLevel
  imagemLocalUrl: string
  previewImageUrl: string
  previewImageAssetId: string
  usarImagemDoMapaLocal: boolean
  thumbnailTipo: string
  mapId: string
  mapFolderId: string
  hasMap: boolean
  mapStatus: WorldMundiMapStatus
  activeSubmapIds: string[]
  posicao: {
    x: number
    y: number
  }
  descricaoInicial: string
  descricaoSutil: string
  descricaoInstavel: string
  descricaoAlterado: string
  descricaoDistorcido: string
  descricaoCataclismico: string
  riscoBase: string
  riscoAtual: string
  estabilidadeFushi: number
  distorcao: number
  estadoVisual: WorldMundiVisualState
  faccaoDominante: string
  faccoesPresentes: string[]
  npcsPresentes: string[]
  npcsAtraidos: string[]
  recursos: string[]
  corposDisponiveis: string[]
  qualidadeMediaCorpos: string
  riscoReencarnacao: string
  segredos: string
  requisitosEntrada: string
  dtEncontrar: number
  basePossivel: boolean
  baseOcupada: boolean
  donoBase: string
  eventosPossiveis: string[]
  tags: string[]
}

export interface WorldMundiSubmap {
  id: string
  parentLocationId: string
  mapId: string
  codigo: string
  nome: string
  tipo: WorldMundiSubmapType
  descricao: string
  ordem: number
  status: WorldMundiMapStatus
  visibilidade: 'mestre_apenas' | 'ativo_para_jogadores'
  tags: string[]
}

export interface WorldMundiPlayer {
  id: string
  nome: string
  conscienciaId: string
}

export interface WorldMundiConsciousness {
  id: string
  nome: string
  jogadorId: string
  corpoAtualId: string
  grupoAtualId: string
}

export interface WorldMundiBody {
  id: string
  nome: string
  tipo: WorldMundiBodyType
  localAtualId: string
  submapAtualId: string
  ocupadoPorConsciencia: boolean
  conscienciaControladoraId: string
  jogadorControladorId: string
  jogadoresControladoresIds?: string[]
  npcOriginalId: string
  estadoDaConscienciaOriginal: WorldMundiOriginalConsciousnessState
}

export interface WorldMundiRoute {
  id: string
  origemId: string
  destinoId: string
  tipo: WorldMundiRouteType
  distanciaHoras: number
  tempoPlayersHoras: number
  tempoNpcHoras: number
  terreno: string
  risco: string
  visibilidade: string
  restricao: string
  requisito: string
  dtEncontrar: number
  faccoesUsam: string[]
  chanceEncontro: string
  encontrosPossiveis: string[]
  eventosPossiveis: string[]
  bloqueada: boolean
  secreta: boolean
  tags: string[]
}

export interface WorldMundiNpcMemory {
  conheceuPlayers: boolean
  interesseNosPlayers: number
  afinidadeComPlayers: number
  rivalidadeComPlayers: number
  ameacaPercebidaPlayers: number
  confiancaNosPlayers: number
  querEncontrarPlayersNovamente: boolean
  querEvitarPlayers: boolean
  promessaAtiva: string
  dividaAtiva: string
  conflitoPendente: string
  segredoCompartilhado: string
  medoAtual: string
  memoriaCurta: string[]
  agenda: string[]
  limitesCanon: string[]
  relacoesPorAtor: Record<string, WorldMundiNpcActorRelation>
}

export interface WorldMundiNpcActorRelation {
  actorId: string
  label: string
  afinidade: number
  confianca: number
  rivalidade: number
  ameaca: number
  notas: string
  ultimoEvento: string
}

export interface WorldMundiNpcState {
  characterId: CharacterSheet['id']
  estadoSimulacao: WorldMundiSimulationState
  statusEntrada: WorldMundiEntryStatus
  diaChegada: number
  condicaoChegada: string
  presencaNoMapa: WorldMundiPresence
  localInicialId: string
  baseId: string
  localAtualId: string
  submapAtualId: string
  destinoAtualId: string
  objetivoMacro: string
  objetivoAtual: string
  intencaoAtual: WorldMundiIntention
  locaisConhecidosIds: string[]
  biomasPreferidosIds: string[]
  biomasEvitadosIds: string[]
  agressividade: number
  cautela: number
  curiosidade: number
  riscoAceito: number
  lealdadeFaccao: number
  chanceViajar: number
  chanceInvestigar: number
  chanceDescansar: number
  chanceProcurarCombate: number
  chanceFugir: number
  tagsInteresse: string[]
  tagsAmeaca: string[]
  estadoFisico: string
  estadoMental: string
  contextoNarrativo: string
  comportamentoResumo: string
  tendencias: string[]
  memoriaSimulacao: WorldMundiNpcMemory
  emViagem: boolean
  viagemOrigemId: string
  viagemDestinoId: string
  viagemTempoRestante: number
  viagemMotivo: string
  ultimoLog: string
}

export interface WorldMundiParty {
  id: string
  nome: string
  tipo: WorldMundiPartyType
  memberPlayerIds: string[]
  memberCharacterIds: string[]
  memberEntityIds: string[]
  leaderId: string
  localAtualId: string
  submapAtualId: string
  destinoAtualId: string
  acaoPlanejada: string
  tempoPlanejadoHoras: number
  estado: WorldMundiPartyState
  contextoAtual: string
  tempoJuntosHoras: number
  motivoFormacao: string
  condicaoSeparacao: string
  ultimoLog: string
}

export interface WorldMundiEntity {
  id: string
  nome: string
  tipo: WorldMundiEntityType
  localAtualId: string
  submapAtualId: string
  rotaAtualId: string
  comportamento: string
  hostilidade: string
  risco: string
  quantidade: number
  estado: WorldMundiEntityState
  tags: string[]
  ultimoLog: string
}

export interface WorldMundiLogEntry {
  id: string
  createdAt: string
  dia: number
  hora: number
  texto: string
  tecnico: string
  categoria: 'players' | 'npcs' | 'mundo' | 'combate' | 'fushi' | 'sistema'
  canal: 'mestre' | 'tecnico'
  tone: 'steady' | 'watch' | 'critical'
}

export interface WorldMundiClock {
  dia: number
  hora: number
  fase: number
}

export interface WorldMundiPublicMapState {
  releasedToPlayers: boolean
  discoveredLocationIds: string[]
}

export type WorldMundiBaseUpgradeStatus =
  | 'bloqueado'
  | 'planejado'
  | 'em_construcao'
  | 'ativo'

export type WorldMundiBaseUpgradeIconKey =
  | 'bed'
  | 'book'
  | 'box'
  | 'core'
  | 'cross'
  | 'home'
  | 'map'
  | 'music'
  | 'shield'
  | 'tool'
  | 'water'

export interface WorldMundiBaseUpgrade {
  id: string
  nome: string
  categoria: string
  iconKey: WorldMundiBaseUpgradeIconKey
  resumo: string
  efeitoMesa: string
  bonus: string
  custo: string
  requisito: string
  locationHintId: string
  x: number
  y: number
  dependsOnIds: string[]
  status: WorldMundiBaseUpgradeStatus
  tags: string[]
}

export interface WorldMundiBiomeBaseState {
  id: string
  nome: string
  biomaId: string
  locationId: string
  resumo: string
  buffBioma: string
  buffMundo: string
  selectedUpgradeId: string
  upgrades: WorldMundiBaseUpgrade[]
}

export interface WorldMundiPlayerBaseState {
  releasedToPlayers: boolean
  anchorLocationId: string
  selectedBaseId: string
  selectedUpgradeId: string
  upgrades: WorldMundiBaseUpgrade[]
  bases: WorldMundiBiomeBaseState[]
}

export interface WorldMundiUiState {
  factionOrderIds: string[]
}

export interface WorldMundiWaveTrackerState {
  active: boolean
  currentWave: number
  completedWaves: number[]
  lastReward: string
  notes: string
}

export interface WorldMundiXpPlayerLedger {
  playerId: string
  label: string
  act: number
  level: number
  marks: Record<string, boolean>
  notes: string
}

export interface WorldMundiXpLedgerState {
  players: Record<string, WorldMundiXpPlayerLedger>
}

export interface WorldMundiSessionToolsState {
  waves: WorldMundiWaveTrackerState
  xp: WorldMundiXpLedgerState
}

export interface WorldMundiState {
  version: 1
  clock: WorldMundiClock
  selectedLocationId: string
  publicMap: WorldMundiPublicMapState
  playerBase: WorldMundiPlayerBaseState
  sessionTools: WorldMundiSessionToolsState
  ui: WorldMundiUiState
  biomes: WorldMundiBiome[]
  locations: WorldMundiLocation[]
  submaps: WorldMundiSubmap[]
  routes: WorldMundiRoute[]
  players: Record<string, WorldMundiPlayer>
  consciencias: Record<string, WorldMundiConsciousness>
  corpos: Record<string, WorldMundiBody>
  npcs: Record<string, WorldMundiNpcState>
  entities: Record<string, WorldMundiEntity>
  parties: Record<string, WorldMundiParty>
  selectedPartyId: string
  logs: WorldMundiLogEntry[]
}

export const TABLETOP_WORLD_MUNDI_STORAGE_KEY =
  'fushi-tabletop:world-mundi:v1'

const DEFAULT_WORLD_MUNDI_CAMPAIGN_ID = 'campaign-local-default'

function normalizeCampaignStorageId(campaignId?: string) {
  return campaignId?.trim() || DEFAULT_WORLD_MUNDI_CAMPAIGN_ID
}

export function getPersistedWorldMundiStorageKey(campaignId?: string) {
  const normalizedCampaignId = normalizeCampaignStorageId(campaignId)

  return `${TABLETOP_WORLD_MUNDI_STORAGE_KEY}:campaign:${normalizedCampaignId}`
}

export const WORLD_MUNDI_LOCATION_TYPES: WorldMundiLocationType[] = [
  'ponto_importante',
  'subponto',
  'dungeon_visivel',
  'dungeon_escondida',
  'dungeon_condicional',
  'base_faccao',
  'base_bioma',
  'descanso',
  'evento',
  'recurso',
  'segredo',
  'vila',
]

export const WORLD_MUNDI_VISUAL_STATES: WorldMundiVisualState[] = [
  'normal',
  'sutil',
  'instavel',
  'alterado',
  'distorcido',
  'cataclismico',
]

export const WORLD_MUNDI_DETAIL_LEVELS: WorldMundiDetailLevel[] = [
  'detalhado',
  'slot_planejado',
  'generico',
  'oculto',
]

export const WORLD_MUNDI_MAP_STATUSES: WorldMundiMapStatus[] = [
  'placeholder',
  'asset_pendente',
  'pronto',
  'customizado',
]

export const WORLD_MUNDI_SUBMAP_TYPES: WorldMundiSubmapType[] = [
  'submapa',
  'interior',
  'entrada',
  'puzzle',
  'fase_boss',
  'cataclisma',
  'memoria',
]

export const WORLD_MUNDI_ENTRY_STATUSES: WorldMundiEntryStatus[] = [
  'ativo_no_inicio',
  'chega_dia_x',
  'chega_por_evento',
  'em_base',
  'oculto',
  'selado',
  'ainda_fora_da_ilha',
]

export const WORLD_MUNDI_PRESENCES: WorldMundiPresence[] = [
  'token_visivel',
  'token_oculto',
  'influencia_regional',
  'rumor',
  'selado',
  'inativo',
]

export const WORLD_MUNDI_INTENTIONS: WorldMundiIntention[] = [
  'descansando',
  'patrulhando',
  'investigando',
  'cacando_recurso',
  'protegendo_base',
  'fugindo',
  'seguindo_pista',
  'procurando_combate',
  'observando',
  'oculto',
  'selado',
  'viajando',
  'negociando',
  'treinando',
  'recuperando',
  'em_evento_narrativo',
]

export const WORLD_MUNDI_SIMULATION_STATES: WorldMundiSimulationState[] = [
  'autonomo',
  'em_cena_com_players',
  'acompanhando_grupo',
  'sob_controle_do_mestre',
  'pausado_por_contexto',
  'seguindo_contexto',
  'fora_de_cena',
]

export const WORLD_MUNDI_PARTY_TYPES: WorldMundiPartyType[] = [
  'grupo_principal',
  'player_solo',
  'party_temporaria',
  'grupo_misto',
  'grupo_npc',
  'grupo_faccao',
  'mob',
]

export const WORLD_MUNDI_PARTY_STATES: WorldMundiPartyState[] = [
  'junto',
  'planejando_movimento',
  'viajando',
  'acampando',
  'separado',
  'em_cena',
]

export const WORLD_MUNDI_ROUTE_TYPES: WorldMundiRouteType[] = [
  'rota_normal',
  'rota_dificil',
  'rota_oculta',
  'rota_condicional',
  'rota_bloqueada',
  'rota_perigosa',
]

export const WORLD_MUNDI_ENTITY_TYPES: WorldMundiEntityType[] = [
  'mob',
  'patrulha',
  'viajantes',
  'criatura',
  'faccao',
  'evento',
]

export const WORLD_MUNDI_ENTITY_STATES: WorldMundiEntityState[] = [
  'ativo',
  'evitado',
  'derrotado',
  'fugiu',
  'oculto',
  'inativo',
]

export const WORLD_MUNDI_BODY_TYPES: WorldMundiBodyType[] = [
  'corpo_original',
  'npc',
  'humano',
  'humano_comum',
  'animal',
  'criatura',
  'npc_importante',
  'fushi',
]

export const WORLD_MUNDI_ORIGINAL_CONSCIOUSNESS_STATES: WorldMundiOriginalConsciousnessState[] = [
  'suprimida',
  'em_disputa',
  'coexistindo',
  'removida',
  'desconhecida',
]

export const WORLD_MUNDI_BASE_UPGRADE_STATUSES: WorldMundiBaseUpgradeStatus[] = [
  'bloqueado',
  'planejado',
  'em_construcao',
  'ativo',
]

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function buildId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function clampScale(value: unknown, fallback = 0) {
  return Math.max(
    0,
    Math.min(
      5,
      Math.round(typeof value === 'number' && Number.isFinite(value) ? value : fallback),
    ),
  )
}

function clampPercentage(value: unknown, fallback = 50) {
  return Math.max(
    2,
    Math.min(
      98,
      typeof value === 'number' && Number.isFinite(value) ? value : fallback,
    ),
  )
}

function clampNonNegative(value: unknown, fallback = 0) {
  const nextValue = typeof value === 'number' && Number.isFinite(value) ? value : fallback

  return Math.max(0, Math.round(nextValue))
}

function clampDuration(value: unknown, fallback = 0) {
  const nextValue = typeof value === 'number' && Number.isFinite(value) ? value : fallback

  return Math.max(0, Math.round(nextValue * 6) / 6)
}

function clampClockHour(value: unknown, fallback = 0) {
  const nextValue = typeof value === 'number' && Number.isFinite(value) ? value : fallback

  return Math.max(0, Math.min(23 + 5 / 6, Math.round(nextValue * 6) / 6))
}

function normalizeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    )
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function normalizePublicMapState(value: unknown): WorldMundiPublicMapState {
  const input = isRecord(value) ? value : {}

  return {
    releasedToPlayers: input.releasedToPlayers === true,
    discoveredLocationIds: normalizeStringArray(input.discoveredLocationIds),
  }
}

const XP_LEDGER_MARK_KEYS = [
  'risco1',
  'risco2',
  'vontade',
  'vinculo',
  'fushi',
  'custo1',
  'custo2',
  'treino',
  'ritual',
  'reencarnacao',
  'itemMarco',
]

function normalizeBooleanMarks(value: unknown) {
  const input = isRecord(value) ? value : {}

  return Object.fromEntries(
    XP_LEDGER_MARK_KEYS.map((key) => [key, input[key] === true]),
  )
}

function createWorldMundiWaveTrackerState(
  input: Partial<WorldMundiWaveTrackerState> = {},
): WorldMundiWaveTrackerState {
  return {
    active: input.active === true,
    currentWave: Math.max(1, clampNonNegative(input.currentWave, 1)),
    completedWaves: (Array.isArray(input.completedWaves) ? input.completedWaves : [])
      .map((value) => Number.parseInt(String(value), 10))
      .filter((value) => Number.isFinite(value) && value > 0),
    lastReward: input.lastReward ?? '',
    notes: input.notes ?? '',
  }
}

function createWorldMundiXpPlayerLedger(
  input: Omit<Partial<WorldMundiXpPlayerLedger>, 'marks'> & {
    marks?: unknown
    playerId: string
  },
): WorldMundiXpPlayerLedger {
  return {
    playerId: input.playerId,
    label: input.label ?? input.playerId.toUpperCase(),
    act: Math.max(1, Math.min(5, clampNonNegative(input.act, 1))),
    level: Math.max(1, clampNonNegative(input.level, 1)),
    marks: normalizeBooleanMarks(input.marks),
    notes: input.notes ?? '',
  }
}

function createWorldMundiXpLedgerState(
  input: Partial<WorldMundiXpLedgerState> = {},
): WorldMundiXpLedgerState {
  const previousPlayers = isRecord(input.players) ? input.players : {}
  const playerIds = ['player1', 'player2', 'player3', 'player4', 'player5']

  return {
    players: Object.fromEntries(
      playerIds.map((playerId, index) => {
        const previous: Record<string, unknown> = isRecord(previousPlayers[playerId])
          ? previousPlayers[playerId]
          : {}

        return [
          playerId,
          createWorldMundiXpPlayerLedger({
            playerId,
            label: normalizeString(previous.label, `J${index + 1}`),
            act: clampNonNegative(previous.act, 1),
            level: clampNonNegative(previous.level, 1),
            marks: previous.marks,
            notes: normalizeString(previous.notes),
          }),
        ]
      }),
    ),
  }
}

function normalizeSessionToolsState(value: unknown): WorldMundiSessionToolsState {
  const input = isRecord(value) ? value : {}

  return {
    waves: createWorldMundiWaveTrackerState(
      isRecord(input.waves) ? input.waves : undefined,
    ),
    xp: createWorldMundiXpLedgerState(isRecord(input.xp) ? input.xp : undefined),
  }
}

function normalizeBaseUpgrade(value: unknown): WorldMundiBaseUpgrade | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.nome !== 'string') {
    return null
  }

  return createWorldMundiBaseUpgrade({
    id: value.id,
    nome: value.nome,
    categoria: normalizeString(value.categoria, 'estrutura'),
    iconKey: normalizeBaseUpgradeIconKey(value.iconKey, value.id),
    resumo: normalizeString(value.resumo),
    efeitoMesa: normalizeString(value.efeitoMesa),
    bonus: normalizeString(value.bonus, normalizeString(value.efeitoMesa)),
    custo: normalizeString(value.custo),
    requisito: normalizeString(value.requisito),
    locationHintId: normalizeString(value.locationHintId),
    x: clampPercentage(value.x, 50),
    y: clampPercentage(value.y, 50),
    dependsOnIds: normalizeStringArray(value.dependsOnIds),
    status: normalizeBaseUpgradeStatus(value.status),
    tags: normalizeStringArray(value.tags),
  })
}

function normalizeBiomeBase(value: unknown): WorldMundiBiomeBaseState | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.nome !== 'string') {
    return null
  }

  const upgrades = Array.isArray(value.upgrades)
    ? value.upgrades
        .map(normalizeBaseUpgrade)
        .filter((entry): entry is WorldMundiBaseUpgrade => Boolean(entry))
    : []

  return createWorldMundiBiomeBaseState({
    id: value.id,
    nome: value.nome,
    biomaId: normalizeString(value.biomaId, 'planicie_floresta_inicial'),
    locationId: normalizeString(value.locationId, 'base_planicie_nascente'),
    resumo: normalizeString(value.resumo),
    buffBioma: normalizeString(value.buffBioma),
    buffMundo: normalizeString(value.buffMundo),
    selectedUpgradeId: normalizeString(value.selectedUpgradeId),
    upgrades,
  })
}

function normalizePlayerBaseState(value: unknown): WorldMundiPlayerBaseState {
  const input = isRecord(value) ? value : {}
  const previousUpgrades = Array.isArray(input.upgrades)
    ? input.upgrades.map(normalizeBaseUpgrade).filter((entry): entry is WorldMundiBaseUpgrade => Boolean(entry))
    : []
  const previousBases = Array.isArray(input.bases)
    ? input.bases.map(normalizeBiomeBase).filter((entry): entry is WorldMundiBiomeBaseState => Boolean(entry))
    : []
  const legacyById = new Map(previousUpgrades.map((upgrade) => [upgrade.id, upgrade]))
  const mergedBases = defaultPlayerBase.bases.map((defaultBase, index) => {
    const previousBase = previousBases.find((base) => base.id === defaultBase.id)
    const previousById = new Map(
      [
        ...(previousBase?.upgrades ?? []),
        ...(index === 0 ? previousUpgrades : []),
      ].map((upgrade) => [upgrade.id, upgrade]),
    )
    const basePrefix = `${defaultBase.id.replace(/^base_/, '')}_`

    return createWorldMundiBiomeBaseState({
      ...defaultBase,
      selectedUpgradeId: normalizeString(
        previousBase?.selectedUpgradeId,
        defaultBase.selectedUpgradeId,
      ),
      upgrades: defaultBase.upgrades.map((defaultUpgrade) => {
        const legacyUpgradeId = defaultUpgrade.id.startsWith(basePrefix)
          ? defaultUpgrade.id.slice(basePrefix.length)
          : defaultUpgrade.id
        const previousUpgrade =
          previousById.get(defaultUpgrade.id) ??
          previousById.get(legacyUpgradeId) ??
          legacyById.get(legacyUpgradeId)

        return previousUpgrade
          ? createWorldMundiBaseUpgrade({
              ...defaultUpgrade,
              status: previousUpgrade.status,
            })
          : defaultUpgrade
      }),
    })
  })
  const selectedBaseId = normalizeString(
    input.selectedBaseId,
    mergedBases[0]?.id ?? defaultPlayerBase.selectedBaseId,
  )
  const selectedBase =
    mergedBases.find((base) => base.id === selectedBaseId) ?? mergedBases[0] ?? defaultPlayerBase.bases[0]

  return createWorldMundiPlayerBaseState({
    releasedToPlayers: input.releasedToPlayers === true,
    anchorLocationId: normalizeString(
      input.anchorLocationId,
      selectedBase?.locationId ?? defaultPlayerBase.anchorLocationId,
    ),
    selectedBaseId: selectedBase?.id ?? defaultPlayerBase.selectedBaseId,
    selectedUpgradeId: normalizeString(
      input.selectedUpgradeId,
      selectedBase?.selectedUpgradeId ?? defaultPlayerBase.selectedUpgradeId,
    ),
    upgrades: selectedBase?.upgrades ?? defaultPlayerBase.upgrades,
    bases: mergedBases,
  })
}

function normalizeLocationType(value: unknown): WorldMundiLocationType {
  return WORLD_MUNDI_LOCATION_TYPES.includes(value as WorldMundiLocationType)
    ? (value as WorldMundiLocationType)
    : 'ponto_importante'
}

function normalizeVisualState(value: unknown): WorldMundiVisualState {
  return WORLD_MUNDI_VISUAL_STATES.includes(value as WorldMundiVisualState)
    ? (value as WorldMundiVisualState)
    : 'normal'
}

function normalizeDetailLevel(value: unknown): WorldMundiDetailLevel {
  return WORLD_MUNDI_DETAIL_LEVELS.includes(value as WorldMundiDetailLevel)
    ? (value as WorldMundiDetailLevel)
    : 'slot_planejado'
}

function normalizeMapStatus(value: unknown): WorldMundiMapStatus {
  return WORLD_MUNDI_MAP_STATUSES.includes(value as WorldMundiMapStatus)
    ? (value as WorldMundiMapStatus)
    : 'asset_pendente'
}

function normalizeSubmapType(value: unknown): WorldMundiSubmapType {
  return WORLD_MUNDI_SUBMAP_TYPES.includes(value as WorldMundiSubmapType)
    ? (value as WorldMundiSubmapType)
    : 'submapa'
}

function normalizeEntryStatus(value: unknown): WorldMundiEntryStatus {
  return WORLD_MUNDI_ENTRY_STATUSES.includes(value as WorldMundiEntryStatus)
    ? (value as WorldMundiEntryStatus)
    : 'ainda_fora_da_ilha'
}

function normalizePresence(value: unknown): WorldMundiPresence {
  return WORLD_MUNDI_PRESENCES.includes(value as WorldMundiPresence)
    ? (value as WorldMundiPresence)
    : 'inativo'
}

function normalizeIntention(value: unknown): WorldMundiIntention {
  return WORLD_MUNDI_INTENTIONS.includes(value as WorldMundiIntention)
    ? (value as WorldMundiIntention)
    : 'observando'
}

function normalizeSimulationState(value: unknown): WorldMundiSimulationState {
  return WORLD_MUNDI_SIMULATION_STATES.includes(value as WorldMundiSimulationState)
    ? (value as WorldMundiSimulationState)
    : 'autonomo'
}

function normalizePartyType(value: unknown): WorldMundiPartyType {
  return WORLD_MUNDI_PARTY_TYPES.includes(value as WorldMundiPartyType)
    ? (value as WorldMundiPartyType)
    : 'party_temporaria'
}

function normalizePartyState(value: unknown): WorldMundiPartyState {
  return WORLD_MUNDI_PARTY_STATES.includes(value as WorldMundiPartyState)
    ? (value as WorldMundiPartyState)
    : 'junto'
}

function normalizeRouteType(value: unknown): WorldMundiRouteType {
  return WORLD_MUNDI_ROUTE_TYPES.includes(value as WorldMundiRouteType)
    ? (value as WorldMundiRouteType)
    : 'rota_normal'
}

function normalizeEntityType(value: unknown): WorldMundiEntityType {
  return WORLD_MUNDI_ENTITY_TYPES.includes(value as WorldMundiEntityType)
    ? (value as WorldMundiEntityType)
    : 'mob'
}

function normalizeEntityState(value: unknown): WorldMundiEntityState {
  return WORLD_MUNDI_ENTITY_STATES.includes(value as WorldMundiEntityState)
    ? (value as WorldMundiEntityState)
    : 'ativo'
}

function normalizeBodyType(value: unknown): WorldMundiBodyType {
  return WORLD_MUNDI_BODY_TYPES.includes(value as WorldMundiBodyType)
    ? (value as WorldMundiBodyType)
    : 'humano'
}

function normalizeOriginalConsciousnessState(
  value: unknown,
): WorldMundiOriginalConsciousnessState {
  return WORLD_MUNDI_ORIGINAL_CONSCIOUSNESS_STATES.includes(
    value as WorldMundiOriginalConsciousnessState,
  )
    ? (value as WorldMundiOriginalConsciousnessState)
    : 'desconhecida'
}

function normalizeBaseUpgradeStatus(value: unknown): WorldMundiBaseUpgradeStatus {
  return WORLD_MUNDI_BASE_UPGRADE_STATUSES.includes(value as WorldMundiBaseUpgradeStatus)
    ? (value as WorldMundiBaseUpgradeStatus)
    : 'bloqueado'
}

function normalizeBaseUpgradeIconKey(
  value: unknown,
  fallbackId = '',
): WorldMundiBaseUpgradeIconKey {
  const validIconKeys: WorldMundiBaseUpgradeIconKey[] = [
    'bed',
    'book',
    'box',
    'core',
    'cross',
    'home',
    'map',
    'music',
    'shield',
    'tool',
    'water',
  ]

  if (validIconKeys.includes(value as WorldMundiBaseUpgradeIconKey)) {
    return value as WorldMundiBaseUpgradeIconKey
  }

  const rawId = fallbackId
    .replace(/^planicie_nascente_/, '')
    .replace(/^praia_ancora_/, '')
    .replace(/^montanha_refugio_/, '')
    .replace(/^floresta_seiva_/, '')
    .replace(/^vulcao_obsidiana_/, '')
    .replace(/^gelo_abrigo_/, '')
    .replace(/^ruinas_memorial_/, '')
    .replace(/^veu_esconderijo_/, '')

  if (rawId === 'reforma_inicial') {
    return 'home'
  }

  if (rawId === 'dormitorio_compartilhado') {
    return 'bed'
  }

  if (rawId === 'agua_e_cozinha') {
    return 'water'
  }

  if (rawId === 'deposito_de_recursos') {
    return 'box'
  }

  if (rawId === 'oficina_improvisada') {
    return 'tool'
  }

  if (rawId === 'enfermaria') {
    return 'cross'
  }

  if (rawId === 'biblioteca_de_memoria') {
    return 'book'
  }

  if (rawId === 'sala_de_musica') {
    return 'music'
  }

  if (rawId === 'defesas_externas') {
    return 'shield'
  }

  if (rawId === 'nucleo_fushi_controlado') {
    return 'core'
  }

  if (rawId === 'sala_mundi') {
    return 'map'
  }

  return 'home'
}

function clampSignedScale(value: unknown) {
  return Math.max(
    -5,
    Math.min(5, Math.round(typeof value === 'number' ? value : 0)),
  )
}

function normalizeNpcActorRelation(
  actorId: string,
  value: unknown,
): WorldMundiNpcActorRelation {
  const record = isRecord(value) ? value : {}

  return {
    actorId,
    label: normalizeString(record.label) || actorId,
    afinidade: clampSignedScale(record.afinidade),
    confianca: clampScale(record.confianca),
    rivalidade: clampScale(record.rivalidade),
    ameaca: clampScale(record.ameaca),
    notas: normalizeString(record.notas),
    ultimoEvento: normalizeString(record.ultimoEvento),
  }
}

function normalizeNpcActorRelations(value: unknown) {
  const record = isRecord(value) ? value : {}

  return Object.fromEntries(
    Object.entries(record).map(([actorId, relation]) => [
      actorId,
      normalizeNpcActorRelation(actorId, relation),
    ]),
  )
}

function normalizeNpcMemory(value: unknown): WorldMundiNpcMemory {
  const record = isRecord(value) ? value : {}

  return {
    conheceuPlayers: record.conheceuPlayers === true,
    interesseNosPlayers: clampScale(record.interesseNosPlayers),
    afinidadeComPlayers: clampSignedScale(record.afinidadeComPlayers),
    rivalidadeComPlayers: clampScale(record.rivalidadeComPlayers),
    ameacaPercebidaPlayers: clampScale(record.ameacaPercebidaPlayers),
    confiancaNosPlayers: clampScale(record.confiancaNosPlayers),
    querEncontrarPlayersNovamente: record.querEncontrarPlayersNovamente === true,
    querEvitarPlayers: record.querEvitarPlayers === true,
    promessaAtiva: normalizeString(record.promessaAtiva),
    dividaAtiva: normalizeString(record.dividaAtiva),
    conflitoPendente: normalizeString(record.conflitoPendente),
    segredoCompartilhado: normalizeString(record.segredoCompartilhado),
    medoAtual: normalizeString(record.medoAtual),
    memoriaCurta: normalizeStringArray(record.memoriaCurta),
    agenda: normalizeStringArray(record.agenda),
    limitesCanon: normalizeStringArray(record.limitesCanon),
    relacoesPorAtor: normalizeNpcActorRelations(record.relacoesPorAtor),
  }
}

function createBiome(input: Partial<WorldMundiBiome>): WorldMundiBiome {
  return {
    id: input.id ?? buildId('biome'),
    nome: input.nome ?? 'Novo bioma',
    resumo: input.resumo ?? '',
    riscoInicial: input.riscoInicial ?? 'medio',
    estabilidadeInicial: clampScale(input.estabilidadeInicial),
    recursos: normalizeStringArray(input.recursos),
    faccoesProvaveis: normalizeStringArray(input.faccoesProvaveis),
    notes: input.notes ?? '',
  }
}

export function createWorldMundiLocation(
  input: Partial<WorldMundiLocation> = {},
): WorldMundiLocation {
  return {
    id: input.id ?? buildId('local'),
    nome: input.nome ?? 'Novo local',
    tipo: normalizeLocationType(input.tipo),
    biomaId: input.biomaId ?? 'planicie_floresta_inicial',
    nivelDetalhe: normalizeDetailLevel(input.nivelDetalhe),
    imagemLocalUrl: input.imagemLocalUrl ?? '',
    previewImageUrl: input.previewImageUrl ?? input.imagemLocalUrl ?? '',
    previewImageAssetId: input.previewImageAssetId ?? '',
    usarImagemDoMapaLocal: input.usarImagemDoMapaLocal === true,
    thumbnailTipo: input.thumbnailTipo ?? '',
    mapId: input.mapId ?? '',
    mapFolderId: input.mapFolderId ?? '',
    hasMap: input.hasMap === true,
    mapStatus: normalizeMapStatus(input.mapStatus),
    activeSubmapIds: normalizeStringArray(input.activeSubmapIds),
    posicao: {
      x: clampPercentage(input.posicao?.x),
      y: clampPercentage(input.posicao?.y),
    },
    descricaoInicial: input.descricaoInicial ?? '',
    descricaoSutil: input.descricaoSutil ?? '',
    descricaoInstavel: input.descricaoInstavel ?? '',
    descricaoAlterado: input.descricaoAlterado ?? '',
    descricaoDistorcido: input.descricaoDistorcido ?? '',
    descricaoCataclismico: input.descricaoCataclismico ?? '',
    riscoBase: input.riscoBase ?? 'medio',
    riscoAtual: input.riscoAtual ?? input.riscoBase ?? 'medio',
    estabilidadeFushi: clampScale(input.estabilidadeFushi),
    distorcao: clampScale(input.distorcao),
    estadoVisual: normalizeVisualState(input.estadoVisual),
    faccaoDominante: input.faccaoDominante ?? '',
    faccoesPresentes: normalizeStringArray(input.faccoesPresentes),
    npcsPresentes: normalizeStringArray(input.npcsPresentes),
    npcsAtraidos: normalizeStringArray(input.npcsAtraidos),
    recursos: normalizeStringArray(input.recursos),
    corposDisponiveis: normalizeStringArray(input.corposDisponiveis),
    qualidadeMediaCorpos: input.qualidadeMediaCorpos ?? 'comum',
    riscoReencarnacao: input.riscoReencarnacao ?? 'medio',
    segredos: input.segredos ?? '',
    requisitosEntrada: input.requisitosEntrada ?? '',
    dtEncontrar: clampNonNegative(input.dtEncontrar, 20),
    basePossivel: input.basePossivel ?? false,
    baseOcupada: input.baseOcupada ?? false,
    donoBase: input.donoBase ?? '',
    eventosPossiveis: normalizeStringArray(input.eventosPossiveis),
    tags: normalizeStringArray(input.tags),
  }
}

export function createWorldMundiSubmap(
  input: Partial<WorldMundiSubmap> & { parentLocationId: string; mapId: string },
): WorldMundiSubmap {
  return {
    id: input.id ?? buildId('submap'),
    parentLocationId: input.parentLocationId,
    mapId: input.mapId,
    codigo: input.codigo ?? '',
    nome: input.nome ?? 'Submapa',
    tipo: normalizeSubmapType(input.tipo),
    descricao: input.descricao ?? '',
    ordem: clampNonNegative(input.ordem, 0),
    status: normalizeMapStatus(input.status),
    visibilidade: input.visibilidade === 'ativo_para_jogadores' ? 'ativo_para_jogadores' : 'mestre_apenas',
    tags: normalizeStringArray(input.tags),
  }
}

export function createWorldMundiRoute(
  input: Partial<WorldMundiRoute> = {},
): WorldMundiRoute {
  const tempoPlayersHoras = clampDuration(
    input.tempoPlayersHoras ?? input.distanciaHoras,
    1,
  )
  const tempoNpcHoras = clampDuration(input.tempoNpcHoras, tempoPlayersHoras * 2)

  return {
    id: input.id ?? buildId('rota'),
    origemId: input.origemId ?? '',
    destinoId: input.destinoId ?? '',
    tipo: normalizeRouteType(input.tipo),
    distanciaHoras: tempoPlayersHoras,
    tempoPlayersHoras,
    tempoNpcHoras,
    terreno: input.terreno ?? 'trilha',
    risco: input.risco ?? 'medio',
    visibilidade: input.visibilidade ?? 'normal',
    restricao: input.restricao ?? '',
    requisito: input.requisito ?? input.restricao ?? '',
    dtEncontrar: clampNonNegative(input.dtEncontrar, 20),
    faccoesUsam: normalizeStringArray(input.faccoesUsam),
    chanceEncontro: input.chanceEncontro ?? 'media',
    encontrosPossiveis: normalizeStringArray(input.encontrosPossiveis),
    eventosPossiveis: normalizeStringArray(input.eventosPossiveis),
    bloqueada: input.bloqueada === true,
    secreta: input.secreta === true,
    tags: normalizeStringArray(input.tags),
  }
}

export function createWorldMundiBaseUpgrade(
  input: Partial<WorldMundiBaseUpgrade> & { id: string; nome: string },
): WorldMundiBaseUpgrade {
  return {
    id: input.id,
    nome: input.nome,
    categoria: input.categoria ?? 'estrutura',
    iconKey: normalizeBaseUpgradeIconKey(input.iconKey, input.id),
    resumo: input.resumo ?? '',
    efeitoMesa: input.efeitoMesa ?? '',
    bonus: input.bonus ?? input.efeitoMesa ?? '',
    custo: input.custo ?? '',
    requisito: input.requisito ?? '',
    locationHintId: input.locationHintId ?? '',
    x: clampPercentage(input.x, 50),
    y: clampPercentage(input.y, 50),
    dependsOnIds: [],
    status: normalizeBaseUpgradeStatus(input.status),
    tags: normalizeStringArray(input.tags),
  }
}

export function createWorldMundiBiomeBaseState(
  input: Partial<WorldMundiBiomeBaseState> & { id: string; nome: string },
): WorldMundiBiomeBaseState {
  const upgrades = Array.isArray(input.upgrades)
    ? input.upgrades.map((upgrade) => createWorldMundiBaseUpgrade(upgrade))
    : []

  return {
    id: input.id,
    nome: input.nome,
    biomaId: input.biomaId ?? 'planicie_floresta_inicial',
    locationId: input.locationId ?? 'base_planicie_nascente',
    resumo: input.resumo ?? '',
    buffBioma: input.buffBioma ?? '',
    buffMundo: input.buffMundo ?? '',
    selectedUpgradeId: input.selectedUpgradeId ?? upgrades[0]?.id ?? '',
    upgrades,
  }
}

export function createWorldMundiPlayerBaseState(
  input: Partial<WorldMundiPlayerBaseState> = {},
): WorldMundiPlayerBaseState {
  const bases = Array.isArray(input.bases)
    ? input.bases.map((base) => createWorldMundiBiomeBaseState(base))
    : createDefaultBiomeBases(
        Array.isArray(input.upgrades)
          ? input.upgrades.map((upgrade) => createWorldMundiBaseUpgrade(upgrade))
          : [],
      )
  const selectedBaseId =
    input.selectedBaseId && bases.some((base) => base.id === input.selectedBaseId)
      ? input.selectedBaseId
      : bases[0]?.id ?? ''
  const selectedBase = bases.find((base) => base.id === selectedBaseId) ?? bases[0]
  const upgrades = selectedBase?.upgrades.length
    ? selectedBase.upgrades
    : Array.isArray(input.upgrades)
      ? input.upgrades.map((upgrade) => createWorldMundiBaseUpgrade(upgrade))
      : []
  const selectedUpgradeId =
    input.selectedUpgradeId && upgrades.some((upgrade) => upgrade.id === input.selectedUpgradeId)
      ? input.selectedUpgradeId
      : selectedBase?.selectedUpgradeId ?? upgrades[0]?.id ?? 'reforma_inicial'

  return {
    releasedToPlayers: input.releasedToPlayers === true,
    anchorLocationId: input.anchorLocationId ?? selectedBase?.locationId ?? 'caverna_primeiro_corpo',
    selectedBaseId,
    selectedUpgradeId,
    upgrades,
    bases,
  }
}

export function createWorldMundiNpcState(
  input: Partial<WorldMundiNpcState> & { characterId: string },
): WorldMundiNpcState {
  return {
    characterId: input.characterId,
    estadoSimulacao: normalizeSimulationState(input.estadoSimulacao),
    statusEntrada: normalizeEntryStatus(input.statusEntrada),
    diaChegada: clampNonNegative(input.diaChegada, 1),
    condicaoChegada: input.condicaoChegada ?? '',
    presencaNoMapa: normalizePresence(input.presencaNoMapa),
    localInicialId: input.localInicialId ?? '',
    baseId: input.baseId ?? '',
    localAtualId: input.localAtualId ?? '',
    submapAtualId: input.submapAtualId ?? '',
    destinoAtualId: input.destinoAtualId ?? '',
    objetivoMacro: input.objetivoMacro ?? '',
    objetivoAtual: input.objetivoAtual ?? '',
    intencaoAtual: normalizeIntention(input.intencaoAtual),
    locaisConhecidosIds: normalizeStringArray(input.locaisConhecidosIds),
    biomasPreferidosIds: normalizeStringArray(input.biomasPreferidosIds),
    biomasEvitadosIds: normalizeStringArray(input.biomasEvitadosIds),
    agressividade: clampScale(input.agressividade, 2),
    cautela: clampScale(input.cautela, 3),
    curiosidade: clampScale(input.curiosidade, 3),
    riscoAceito: clampScale(input.riscoAceito, 2),
    lealdadeFaccao: clampScale(input.lealdadeFaccao, 3),
    chanceViajar: clampScale(input.chanceViajar, 2),
    chanceInvestigar: clampScale(input.chanceInvestigar, 3),
    chanceDescansar: clampScale(input.chanceDescansar, 2),
    chanceProcurarCombate: clampScale(input.chanceProcurarCombate, 1),
    chanceFugir: clampScale(input.chanceFugir, 2),
    tagsInteresse: normalizeStringArray(input.tagsInteresse),
    tagsAmeaca: normalizeStringArray(input.tagsAmeaca),
    estadoFisico: input.estadoFisico ?? 'inteiro',
    estadoMental: input.estadoMental ?? 'estavel',
    contextoNarrativo: input.contextoNarrativo ?? '',
    comportamentoResumo: input.comportamentoResumo ?? '',
    tendencias: normalizeStringArray(input.tendencias),
    memoriaSimulacao: normalizeNpcMemory(input.memoriaSimulacao),
    emViagem: input.emViagem === true,
    viagemOrigemId: input.viagemOrigemId ?? '',
    viagemDestinoId: input.viagemDestinoId ?? '',
    viagemTempoRestante: clampDuration(input.viagemTempoRestante),
    viagemMotivo: input.viagemMotivo ?? '',
    ultimoLog: input.ultimoLog ?? '',
  }
}

export function createWorldMundiParty(
  input: Partial<WorldMundiParty> = {},
): WorldMundiParty {
  return {
    id: input.id ?? buildId('party'),
    nome: input.nome ?? 'Nova party',
    tipo: normalizePartyType(input.tipo),
    memberPlayerIds: normalizeStringArray(input.memberPlayerIds),
    memberCharacterIds: normalizeStringArray(input.memberCharacterIds),
    memberEntityIds: normalizeStringArray(input.memberEntityIds),
    leaderId: input.leaderId ?? '',
    localAtualId: input.localAtualId ?? 'caverna_primeiro_corpo',
    submapAtualId: input.submapAtualId ?? '',
    destinoAtualId: input.destinoAtualId ?? '',
    acaoPlanejada: input.acaoPlanejada ?? '',
    tempoPlanejadoHoras: clampDuration(input.tempoPlanejadoHoras),
    estado: normalizePartyState(input.estado),
    contextoAtual: input.contextoAtual ?? '',
    tempoJuntosHoras: clampDuration(input.tempoJuntosHoras),
    motivoFormacao: input.motivoFormacao ?? '',
    condicaoSeparacao: input.condicaoSeparacao ?? '',
    ultimoLog: input.ultimoLog ?? '',
  }
}

export function createWorldMundiEntity(
  input: Partial<WorldMundiEntity> = {},
): WorldMundiEntity {
  return {
    id: input.id ?? buildId('entity'),
    nome: input.nome ?? 'Entidade do mundo',
    tipo: normalizeEntityType(input.tipo),
    localAtualId: input.localAtualId ?? '',
    submapAtualId: input.submapAtualId ?? '',
    rotaAtualId: input.rotaAtualId ?? '',
    comportamento: input.comportamento ?? '',
    hostilidade: input.hostilidade ?? 'variavel',
    risco: input.risco ?? 'medio',
    quantidade: Math.max(1, clampNonNegative(input.quantidade, 1)),
    estado: normalizeEntityState(input.estado),
    tags: normalizeStringArray(input.tags),
    ultimoLog: input.ultimoLog ?? '',
  }
}

export function createWorldMundiPlayer(
  input: Partial<WorldMundiPlayer> & { id: string },
): WorldMundiPlayer {
  return {
    id: input.id,
    nome: input.nome ?? input.id,
    conscienciaId: input.conscienciaId ?? `consciencia_${input.id}`,
  }
}

export function createWorldMundiConsciousness(
  input: Partial<WorldMundiConsciousness> & { id: string },
): WorldMundiConsciousness {
  return {
    id: input.id,
    nome: input.nome ?? input.id,
    jogadorId: input.jogadorId ?? '',
    corpoAtualId: input.corpoAtualId ?? 'corpo_compartilhado',
    grupoAtualId: input.grupoAtualId ?? 'party_protagonistas',
  }
}

export function createWorldMundiBody(
  input: Partial<WorldMundiBody> = {},
): WorldMundiBody {
  return {
    id: input.id ?? buildId('corpo'),
    nome: input.nome ?? 'Corpo',
    tipo: normalizeBodyType(input.tipo),
    localAtualId: input.localAtualId ?? 'caverna_primeiro_corpo',
    submapAtualId: input.submapAtualId ?? '',
    ocupadoPorConsciencia: input.ocupadoPorConsciencia === true,
    conscienciaControladoraId: input.conscienciaControladoraId ?? '',
    jogadorControladorId: input.jogadorControladorId ?? '',
    jogadoresControladoresIds: Array.isArray(input.jogadoresControladoresIds)
      ? Array.from(
          new Set(
            input.jogadoresControladoresIds.filter(
              (playerId): playerId is string => typeof playerId === 'string' && Boolean(playerId),
            ),
          ),
        )
      : undefined,
    npcOriginalId: input.npcOriginalId ?? '',
    estadoDaConscienciaOriginal: normalizeOriginalConsciousnessState(
      input.estadoDaConscienciaOriginal,
    ),
  }
}

export function createWorldMundiLogEntry(
  input: Partial<WorldMundiLogEntry> & Pick<WorldMundiLogEntry, 'dia' | 'hora' | 'texto'>,
): WorldMundiLogEntry {
  return {
    id: input.id ?? buildId('world-log'),
    createdAt: input.createdAt ?? new Date().toISOString(),
    dia: clampNonNegative(input.dia, 1),
    hora: clampClockHour(input.hora),
    texto: input.texto,
    tecnico: input.tecnico ?? '',
    categoria: input.categoria ?? 'mundo',
    canal: input.canal ?? 'mestre',
    tone: input.tone ?? 'steady',
  }
}

const defaultBiomes: WorldMundiBiome[] = [
  createBiome({
    id: 'planicie_floresta_inicial',
    nome: 'Planicie / Floresta Inicial',
    resumo: 'Regiao de nascimento, primeiros rastros humanos e improviso seguro sem trilho obrigatorio.',
    riscoInicial: 'baixo/medio',
    recursos: ['madeira', 'comida', 'agua', 'ervas', 'couro'],
    faccoesProvaveis: ['vila_local'],
  }),
  createBiome({
    id: 'praia_litoral_oceano',
    nome: 'Praia / Litoral / Oceano',
    resumo: 'Borda da ilha, naufragios, rotas costeiras, mare e entradas escondidas.',
    riscoInicial: 'baixo/medio',
    recursos: ['comida', 'restos de naufragio', 'madeira molhada', 'metal enferrujado'],
  }),
  createBiome({
    id: 'montanhas_vazio_sereno',
    nome: 'Montanhas do Vazio Sereno',
    resumo: 'Altura, treino, FUSHI puro, base dos monges e rotas perigosas.',
    riscoInicial: 'medio/alto',
    recursos: ['pedra', 'minerio', 'ervas raras', 'cristal de FUSHI'],
    faccoesProvaveis: ['monges'],
  }),
  createBiome({
    id: 'floresta_mistica',
    nome: 'Floresta Mistica',
    resumo: 'Natureza viva, equilibrio, criaturas e FUSHI natural.',
    riscoInicial: 'medio',
    recursos: ['madeira viva', 'ervas raras', 'agua', 'FUSHI natural'],
  }),
  createBiome({
    id: 'vulcao_terras_cinzentas',
    nome: 'Vulcao / Terras Cinzentas',
    resumo: 'Calor, minerais, forjas antigas e perigo fisico alto sem corrupcao inicial obrigatoria.',
    riscoInicial: 'alto',
    estabilidadeInicial: 1,
    recursos: ['minerio', 'pedra vulcanica', 'cristais termicos', 'cinzas especiais'],
  }),
  createBiome({
    id: 'regiao_congelada_neve',
    nome: 'Regiao Congelada / Neve',
    resumo: 'Isolamento, sobrevivencia, ruinas preservadas e clima hostil.',
    riscoInicial: 'medio/alto',
    recursos: ['gelo puro', 'peles', 'cristais frios', 'ruinas preservadas'],
  }),
  createBiome({
    id: 'ruinas_antigas',
    nome: 'Ruinas Antigas',
    resumo: 'Fragmentos, rituais, memoria antiga e perigo narrativo elevado.',
    riscoInicial: 'alto',
    estabilidadeInicial: 2,
    recursos: ['reliquias', 'fragmentos', 'inscricoes', 'pedra antiga'],
  }),
  createBiome({
    id: 'vale_cinzento_veu',
    nome: 'Vale Cinzento / Rotas do Veu',
    resumo: 'Observacao, bases moveis, investigacao e caminhos discretos da Ordem do Veu Cinza.',
    riscoInicial: 'medio',
    recursos: ['registros', 'suprimentos', 'rotas secretas'],
    faccoesProvaveis: ['ordem_do_veu_cinza'],
  }),
]

function getSeedLocationTags(id: string, biomaId: string) {
  const tags = new Set<string>(['slot_planejado'])

  if (biomaId.includes('praia')) {
    tags.add('litoral')
    tags.add('exploracao')
    tags.add('naufragio')
  }
  if (biomaId.includes('montanhas')) {
    tags.add('montanha')
    tags.add('fushi_puro')
    tags.add('treino')
    tags.add('monges')
  }
  if (biomaId.includes('floresta_mistica')) {
    tags.add('floresta')
    tags.add('natureza')
    tags.add('fushi_natural')
    tags.add('equilibrio')
  }
  if (biomaId.includes('vulcao')) {
    tags.add('calor')
    tags.add('risco_alto')
    tags.add('minerio')
    tags.add('conflito_potencial')
  }
  if (biomaId.includes('congelada')) {
    tags.add('frio')
    tags.add('sobrevivencia')
    tags.add('isolamento')
    tags.add('ruina_preservada')
  }
  if (biomaId.includes('ruinas')) {
    tags.add('ruinas')
    tags.add('fushi_instavel')
    tags.add('fragmento')
    tags.add('ocultismo')
  }
  if (biomaId.includes('veu')) {
    tags.add('informacao')
    tags.add('vigilancia')
    tags.add('estrategia')
    tags.add('rota_secreta')
  }

  if (id.includes('cacadores')) {
    tags.add('caca')
    tags.add('humano')
    tags.add('conflito_potencial')
  }
  if (id.includes('laboratorio')) {
    tags.add('experimento')
    tags.add('origem')
    tags.add('segredo')
  }
  if (id.includes('arvore') || id.includes('coracao')) {
    tags.add('cura')
    tags.add('natureza')
    tags.add('fushi_puro')
  }
  if (id.includes('camara') || id.includes('selo') || id.includes('portao')) {
    tags.add('selo')
    tags.add('dungeon_condicional')
    tags.add('alto_impacto')
  }
  if (id.includes('arena')) {
    tags.add('duelo')
    tags.add('combate')
  }
  if (id.includes('acampamento') || id.includes('templo')) {
    tags.add('base_faccao')
  }

  return Array.from(tags)
}

function getSeedLocationEvents(id: string, biomaId: string) {
  const events = new Set<string>()

  if (biomaId.includes('floresta_mistica')) {
    events.add('animais reagem a mudancas de FUSHI')
    events.add('Aureon detecta interferencia humana')
  }
  if (biomaId.includes('montanhas')) {
    events.add('monges percebem alteracao no fluxo')
    events.add('treino ou peregrinacao cruza a rota')
  }
  if (biomaId.includes('ruinas')) {
    events.add('vozes antigas atraem investigadores')
    events.add('fragmentos elevam instabilidade local')
  }
  if (biomaId.includes('vulcao')) {
    events.add('calor extremo muda a rota')
    events.add('minerais raros atraem exploradores')
  }
  if (biomaId.includes('veu')) {
    events.add('batedores do Veu observam movimentacao')
    events.add('informacao regional vira rumor')
  }
  if (biomaId.includes('praia')) {
    events.add('destrocos trazem pista ou recurso')
    events.add('mar muda acesso a rotas costeiras')
  }
  if (biomaId.includes('congelada')) {
    events.add('frio cobra teste de sobrevivencia')
    events.add('ruina preservada revela pista antiga')
  }

  if (id.includes('cacadores')) {
    events.add('cacadores atravessam a regiao')
    events.add('animais fogem da area')
  }
  if (id.includes('camara') || id.includes('selo')) {
    events.add('sinais do Primeiro Selo circulam como rumor')
  }
  if (id.includes('arena')) {
    events.add('um duelista procura oponente digno')
  }

  return Array.from(events)
}

const OFFICIAL_MUNDI_GEOGRAPHY_TAG = 'geografia_mun_60_v2_cataclismas'
const OFFICIAL_MUNDI_ROUTE_REVISION_TAG = 'rotas_mun_60_v9_tempo_10min'
const SUBMAP_ONLY_LOCATION_ACTIVE_DEFAULTS: Record<string, string[]> = {
  torre_abismo: ['m30_s1_portao_torre_abismo'],
  estruturas_ruinas_abandonadas: ['m33_s1_entrada_estruturas'],
  vulcao_abandonado: ['m16_s1_sala_estatuas_xadrez'],
  boca_inferno: ['m18_s1_escadaria_vulcao_erupcao'],
  mar_inquieto: ['m19_s1_costa_preparacao_navio'],
}

const SUBMAP_ONLY_LOCATION_MAIN_MAP_IDS: Record<string, string> = {
  torre_abismo: 'ruinas_m30_s1_portao_torre_abismo',
  estruturas_ruinas_abandonadas: 'ruinas_m33_s1_entrada_estruturas',
  vulcao_abandonado: '',
  boca_inferno: 'vulcao_m18_s1_escadaria_erupcao',
  mar_inquieto: 'vulcao_m19_mar_inquieto_thalzhyr',
}

const LEGACY_SUBMAP_ONLY_LOCATION_MAP_IDS: Record<string, string[]> = {
  torre_abismo: ['ruinas_m30_torre_abismo'],
  estruturas_ruinas_abandonadas: [
    'ruinas_m33_estruturas_abandonadas',
    'ruinas_m33_s2_parkour_forma_instavel',
  ],
  vulcao_abandonado: ['vulcao_m16_abandonado_euryaleth'],
  boca_inferno: ['vulcao_m18_boca_inferno_aeronyx'],
}

interface OfficialMundiPoint {
  biomaId: string
  descricao?: string
  id: string
  image?: string
  mapId?: string
  nome: string
  numero: number
  risco?: string
  tags?: string[]
  tipo?: WorldMundiLocationType
  x: number
  y: number
}

const officialMundiPoints: OfficialMundiPoint[] = [
  { numero: 1, id: 'caverna_primeiro_corpo', nome: 'Caverna do Primeiro Corpo', biomaId: 'planicie_floresta_inicial', tipo: 'ponto_importante', x: 17, y: 27.5, image: '/assets/mundi/locations/loc_caverna_primeiro_corpo.png', mapId: 'planicie_caverna_primeiro_corpo_topdown', descricao: 'Caverna onde o corpo compartilhado desperta no inicio da campanha.', tags: ['spawn_players', 'corpo_compartilhado', 'fushi_sutil'] },
  { numero: 2, id: 'clareira_lobos', nome: 'Clareira dos Lobos', biomaId: 'planicie_floresta_inicial', tipo: 'evento', x: 20.1, y: 27.3, image: '/assets/mundi/locations/loc_clareira_lobos.png', mapId: 'planicie_clareira_lobos_topdown', risco: 'baixo/medio', descricao: 'Primeiro perigo animal opcional da regiao inicial.', tags: ['tutorial_opcional', 'animais', 'combate'] },
  { numero: 3, id: 'armazem_comunitario', nome: 'Armazem Comunitario', biomaId: 'planicie_floresta_inicial', tipo: 'recurso', x: 25.1, y: 22.4, image: '/assets/mundi/locations/loc_armazem_comunitario.png', mapId: 'planicie_armazem_comunitario_topdown', risco: 'baixo', tags: ['recursos', 'vila'] },
  { numero: 4, id: 'campo_treino_vila', nome: 'Campo de Treino da Vila', biomaId: 'planicie_floresta_inicial', tipo: 'recurso', x: 27.9, y: 22.5, image: '/assets/mundi/locations/loc_campo_treino_vila.png', mapId: 'planicie_campo_treino_vila_topdown', risco: 'baixo', tags: ['treino', 'evolucao_inicial'] },
  { numero: 5, id: 'vila_conhecimento_absorvido', nome: 'Vila do Conhecimento Absorvido', biomaId: 'planicie_floresta_inicial', tipo: 'vila', x: 27.2, y: 28.9, image: '/assets/mundi/locations/loc_vila_conhecimento_absorvido.png', mapId: 'planicie_vila_conhecimento_absorvido_topdown', risco: 'baixo', descricao: 'Vila inicial da planicie, hub social e ponto de conhecimento absorvido.', tags: ['hub_opcional', 'social', 'vila'] },
  { numero: 6, id: 'bosque_baixo', nome: 'Bosque Baixo', biomaId: 'planicie_floresta_inicial', tipo: 'descanso', x: 43, y: 34.3, image: '/assets/mundi/locations/loc_bosque_baixo.png', mapId: 'planicie_bosque_baixo_topdown', risco: 'baixo/medio', tags: ['coleta', 'passagem'] },
  { numero: 7, id: 'caverna_meditacao', nome: 'Caverna de Meditacao', biomaId: 'montanhas_vazio_sereno', tipo: 'dungeon_condicional', x: 47.7, y: 41, image: '/assets/mundi/locations/loc_caverna_meditacao.png', mapId: 'montanha_caverna_meditacao_exterior_topdown', risco: 'medio', descricao: 'Chegada e interior ritual da caverna de meditacao, passagem espiritual entre planicie e montanhas.', tags: ['meditacao', 'fushi_puro', 'passagem_planicie'] },
  { numero: 8, id: 'templo_vazio_sereno', nome: 'Templo do Vazio Sereno', biomaId: 'montanhas_vazio_sereno', tipo: 'base_faccao', x: 48.8, y: 16, image: '/assets/mundi/locations/loc_templo_vazio_sereno.png', mapId: 'montanha_templo_vazio_sereno_exterior_topdown', risco: 'medio', descricao: 'Templo/base dos monges nas montanhas, com patios de disciplina e interior de meditacao.', tags: ['base_faccao', 'monges', 'fushi_puro'] },
  { numero: 9, id: 'ponte_suspensa', nome: 'Ponte Suspensa', biomaId: 'montanhas_vazio_sereno', tipo: 'ponto_importante', x: 35.6, y: 14.4, image: '/assets/mundi/locations/loc_ponte_suspensa.png', mapId: 'montanha_ponte_suspensa_topdown', risco: 'medio', descricao: 'Travessia de altitude com ponte suspensa, ventos fortes e acesso a subponto ritual.', tags: ['montanha', 'travessia', 'vento'] },
  { numero: 10, id: 'pico_quatro_ventos', nome: 'Pico dos Quatro Ventos', biomaId: 'montanhas_vazio_sereno', tipo: 'ponto_importante', x: 50.5, y: 3.8, image: '/assets/mundi/locations/loc_pico_quatro_ventos.png', mapId: 'montanha_pico_quatro_ventos_exterior_topdown', risco: 'medio/alto', descricao: 'Subida ao pico sagrado acima das nuvens e ao santuario dos quatro ventos.', tags: ['vento', 'altitude', 'santuario'] },
  { numero: 11, id: 'arena_natural_pedra', nome: 'Arena Natural de Pedra', biomaId: 'montanhas_vazio_sereno', tipo: 'ponto_importante', x: 57.5, y: 14.1, image: '/assets/mundi/locations/loc_arena_natural_pedra.png', mapId: 'montanha_arena_natural_pedra_topdown', risco: 'medio/alto', descricao: 'Arena natural de pedra para duelo, treino e conflitos de honra nas montanhas.', tags: ['duelo', 'combate'] },
  { numero: 12, id: 'saida_montanhas', nome: 'Saida das Montanhas', biomaId: 'montanhas_vazio_sereno', tipo: 'ponto_importante', x: 55.5, y: 34.3, image: '/assets/mundi/locations/loc_saida_das_montanhas.png', mapId: 'montanha_saida_montanhas_topdown', risco: 'medio/alto', descricao: 'Saida das montanhas e bifurcacao perigosa para Vulcao e Regiao Congelada.', tags: ['passagem', 'vulcao', 'gelo'] },
  { numero: 13, id: 'vulcao_entrada', nome: 'Entrada do Vulcao', biomaId: 'vulcao_terras_cinzentas', tipo: 'ponto_importante', x: 64.4, y: 47.1, image: '/assets/mundi/locations/loc_vulcao_entrada.png', mapId: 'vulcao_m13_entrada', risco: 'alto', descricao: 'Bifurcacao de acesso ao Vulcao, conectando Montanhas, Gelo, Ruinas e o caminho para o nucleo.', tags: ['vulcao', 'bifurcacao', 'entrada_cataclisma'] },
  { numero: 14, id: 'campo_cinzas', nome: 'Campo de Cinzas', biomaId: 'vulcao_terras_cinzentas', tipo: 'dungeon_condicional', x: 64.3, y: 35.3, image: '/assets/mundi/locations/loc_campo_cinzas.png', mapId: 'vulcao_m14_campo_cinzas', risco: 'alto', descricao: 'Nucleo paradoxal do Vulcao, com seis estatuas guardias ao redor do orbe ligado ao Dragao FUSHI.', tags: ['nucleo_vulcao', 'orbe', 'seis_guardioes', 'dragao_fushi'] },
  { numero: 15, id: 'rio_da_escuridao', nome: 'Rio da Escuridao', biomaId: 'vulcao_terras_cinzentas', tipo: 'dungeon_visivel', x: 73.1, y: 34.3, image: '/assets/mundi/locations/loc_rio_da_escuridao.png', mapId: 'vulcao_m15_rio_escuridao', risco: 'alto', descricao: 'Rio sombrio do Vulcao e arena de Morghast, com fases de sombra, nucleo e expulsao do grupo.', tags: ['morghast', 'guardiao_vulcao', 'fushi_escuro'] },
  { numero: 16, id: 'vulcao_abandonado', nome: 'Vulcao Abandonado', biomaId: 'vulcao_terras_cinzentas', tipo: 'dungeon_visivel', x: 79.8, y: 32.3, image: '/assets/mundi/locations/loc_vulcao_abandonado.png', risco: 'alto', descricao: 'Jardim petrificado do Vulcao, tabuleiro de xadrez ritual e fases de Euryaleth.', tags: ['euryaleth', 'petrificacao', 'guardiao_vulcao', 'xadrez'] },
  { numero: 17, id: 'labirinto_quente', nome: 'Labirinto Quente', biomaId: 'vulcao_terras_cinzentas', tipo: 'dungeon_visivel', x: 84.7, y: 10.8, image: '/assets/mundi/locations/loc_labirinto_quente.png', mapId: 'vulcao_m17_labirinto_quente_vorashk', risco: 'alto', descricao: 'Labirinto vivo do Vulcao, dominado por Vorashk, perseguicao e chests com risco de debuff permanente.', tags: ['vorashk', 'labirinto', 'guardiao_vulcao'] },
  { numero: 18, id: 'boca_inferno', nome: 'Boca do Inferno', biomaId: 'vulcao_terras_cinzentas', tipo: 'dungeon_condicional', x: 75.1, y: 10.7, image: '/assets/mundi/locations/loc_boca_inferno.png', mapId: 'vulcao_m18_s1_escadaria_erupcao', risco: 'alto', descricao: 'Ascensao por plataformas rochosas sobre lava ate a arena de Aeronyx no topo do Vulcao.', tags: ['aeronyx', 'vento', 'guardiao_vulcao', 'parkour'] },
  { numero: 19, id: 'mar_inquieto', nome: 'Mar Inquieto', biomaId: 'vulcao_terras_cinzentas', tipo: 'dungeon_condicional', x: 97.2, y: 20.5, image: '/assets/mundi/locations/loc_mar_inquieto.png', mapId: 'vulcao_m19_mar_inquieto_thalzhyr', risco: 'alto', descricao: 'Mar hostil ligado ao Vulcao, preparacao naval e confronto contra Thal\'Zhyr em alto risco.', tags: ['thal_zhyr', 'oceano', 'guardiao_vulcao'] },
  { numero: 20, id: 'transcendente', nome: 'Transcendente', biomaId: 'vulcao_terras_cinzentas', tipo: 'dungeon_condicional', x: 91.2, y: 7.2, image: '/assets/mundi/locations/loc_transcendente.png', mapId: 'vulcao_m20_transcendente_astrael', risco: 'alto', descricao: 'Dimensao ligada a Astrael, julgamento e transicao para a escala cosmica do Dragao FUSHI.', tags: ['astrael', 'dimensao', 'dragao_fushi'] },
  { numero: 21, id: 'deus_dragao', nome: 'Deus Dragao', biomaId: 'vulcao_terras_cinzentas', tipo: 'evento', x: 96.4, y: 8.5, image: '/assets/mundi/locations/loc_deus_dragao.png', mapId: 'vulcao_m21_deus_dragao', risco: 'cataclismico', descricao: 'Manifestacao de escala total do Dragao FUSHI, capaz de alterar a ilha inteira e iniciar jogo global.', tags: ['dragao_fushi', 'cataclisma', 'mapa_inteiro'] },
  { numero: 22, id: 'vale_branco', nome: 'Vale Branco', biomaId: 'regiao_congelada_neve', tipo: 'ponto_importante', x: 75.7, y: 48, image: '/assets/mundi/locations/loc_vale_branco.png', mapId: 'gelo_m22_vale_branco', risco: 'medio/alto' },
  { numero: 23, id: 'fortaleza_soterrada', nome: 'Fortaleza Soterrada', biomaId: 'regiao_congelada_neve', tipo: 'dungeon_visivel', x: 83.5, y: 47.3, image: '/assets/mundi/locations/loc_fortaleza_soterrada.png', mapId: 'gelo_m23_fortaleza_soterrada', risco: 'alto', tags: ['fragmento_ryoku'] },
  { numero: 24, id: 'lago_congelado', nome: 'Lago Congelado', biomaId: 'regiao_congelada_neve', tipo: 'ponto_importante', x: 92.2, y: 35.7, image: '/assets/mundi/locations/loc_lago_congelado.png', mapId: 'gelo_m24_lago_congelado', risco: 'medio/alto' },
  { numero: 25, id: 'grande_avalanche', nome: 'Grande Avalanche', biomaId: 'regiao_congelada_neve', tipo: 'evento', x: 87.1, y: 58, image: '/assets/mundi/locations/loc_grande_avalanche.png', mapId: 'gelo_m25_grande_avalanche', risco: 'alto' },
  { numero: 26, id: 'caverna_azul', nome: 'Caverna Azul', biomaId: 'regiao_congelada_neve', tipo: 'dungeon_visivel', x: 93.6, y: 62.6, image: '/assets/mundi/locations/loc_caverna_azul.png', mapId: 'gelo_m26_caverna_azul', risco: 'alto' },
  { numero: 27, id: 'bonecos_de_neve', nome: 'Bonecos de Neve', biomaId: 'regiao_congelada_neve', tipo: 'evento', x: 86.7, y: 67.3, image: '/assets/mundi/locations/loc_bonecos_de_neve.png', mapId: 'gelo_m27_bonecos_de_neve', risco: 'medio/alto' },
  { numero: 28, id: 'santuario_sob_gelo', nome: 'Santuario Sob o Gelo', biomaId: 'regiao_congelada_neve', tipo: 'dungeon_condicional', x: 90.6, y: 77, image: '/assets/mundi/locations/loc_santuario_sob_gelo.png', mapId: 'gelo_m28_santuario_sob_gelo', risco: 'alto' },
  { numero: 29, id: 'terras_podres', nome: 'Terras Podres', biomaId: 'ruinas_antigas', tipo: 'ponto_importante', x: 70.5, y: 48.3, image: '/assets/mundi/locations/loc_terras_podres.png', mapId: 'ruinas_m29_terras_podres', risco: 'alto', descricao: 'Entrada degradada das Ruinas Antigas, area de transicao para selos, vozes e Torre do Abismo.', tags: ['ruinas', 'entrada_ryoku'] },
  { numero: 30, id: 'torre_abismo', nome: 'Torre do Abismo', biomaId: 'ruinas_antigas', tipo: 'dungeon_condicional', x: 67.5, y: 59.6, image: '/assets/mundi/locations/loc_torre_abismo.png', mapId: 'ruinas_m30_s1_portao_torre_abismo', risco: 'alto', descricao: 'Torre selada de Ryoku, com pressao espiritual, grande portao e sistema de alavancas/puzzle.', tags: ['ryoku', 'cataclisma', 'selo', 'torre'] },
  { numero: 31, id: 'corredor_vozes', nome: 'Corredor das Vozes', biomaId: 'ruinas_antigas', tipo: 'dungeon_visivel', x: 73.3, y: 59.5, image: '/assets/mundi/locations/loc_corredor_vozes.png', mapId: 'ruinas_m31_corredor_vozes', risco: 'alto', descricao: 'Corredor de vozes antigas e um dos pontos ligados aos fragmentos/travas de Ryoku.', tags: ['ryoku', 'vozes', 'fragmento'] },
  { numero: 32, id: 'altar_quebrado', nome: 'Altar Quebrado', biomaId: 'ruinas_antigas', tipo: 'dungeon_condicional', x: 75.1, y: 73.5, image: '/assets/mundi/locations/loc_altar_quebrado.png', mapId: 'ruinas_m32_altar_quebrado', risco: 'alto', descricao: 'Altar ritual quebrado, uma das travas fisicas do selo de Ryoku.', tags: ['ryoku', 'altar', 'selo'] },
  { numero: 33, id: 'estruturas_ruinas_abandonadas', nome: 'Estruturas das Ruinas Abandonadas', biomaId: 'ruinas_antigas', tipo: 'dungeon_visivel', x: 64.6, y: 66.1, image: '/assets/mundi/locations/loc_estruturas_ruinas_abandonadas.png', mapId: 'ruinas_m33_s1_entrada_estruturas', risco: 'alto', descricao: 'Entrada e campo de pilares antigos com parkour/puzzle vertical ligado a formas instaveis de Ryoku.', tags: ['ryoku', 'pilares', 'parkour', 'fragmento'] },
  { numero: 34, id: 'biblioteca_morta', nome: 'Biblioteca Morta', biomaId: 'ruinas_antigas', tipo: 'dungeon_visivel', x: 61.7, y: 59.3, image: '/assets/mundi/locations/loc_biblioteca_morta.png', mapId: 'ruinas_m34_biblioteca_morta', risco: 'alto', descricao: 'Ruina com livros antigos intactos e organizados, ligada a memoria de Ryoku.', tags: ['ryoku', 'memoria', 'biblioteca'] },
  { numero: 35, id: 'portao_sem_nome', nome: 'Portao Sem Nome', biomaId: 'ruinas_antigas', tipo: 'dungeon_condicional', x: 57.8, y: 65.8, image: '/assets/mundi/locations/loc_portao_sem_nome.png', mapId: 'ruinas_m35_portao_sem_nome', risco: 'alto', descricao: 'Grande portao entre montanhas, controlando passagem entre Ruinas, Floresta Mistica e Veu.', tags: ['portao', 'rota_condicional', 'ruinas'] },
  { numero: 36, id: 'trilha_enraizada', nome: 'Trilha Enraizada', biomaId: 'floresta_mistica', tipo: 'ponto_importante', x: 51, y: 60.7, image: '/assets/mundi/locations/loc_trilha_enraizada.png', mapId: 'floresta_trilha_enraizada_topdown', risco: 'medio', descricao: 'Trilha fechada por raizes que separa a Floresta Mistica do Veu Cinzento, com passagem secreta para o laboratorio abandonado.', tags: ['travessia', 'raizes', 'passagem_secreta', 'veu_cinzento'] },
  { numero: 37, id: 'coracao_verde', nome: 'Coracao Verde', biomaId: 'floresta_mistica', tipo: 'ponto_importante', x: 46.7, y: 53.1, image: '/assets/mundi/locations/loc_coracao_verde.png', mapId: 'floresta_coracao_verde_topdown', risco: 'medio/alto', descricao: 'Centro vivo da floresta e arvore mae do bioma, onde a vida vegetal se conecta como um unico organismo.', tags: ['arvore_mae', 'fushi_vivo', 'bioma_vivo', 'energia_natural'] },
  { numero: 38, id: 'arvore_fushi_vivo', nome: 'Arvore de FUSHI Vivo', biomaId: 'floresta_mistica', tipo: 'dungeon_condicional', x: 46.8, y: 39.7, image: '/assets/mundi/locations/loc_arvore_fushi_vivo.png', mapId: 'floresta_arvore_fushi_vivo_interior_topdown', risco: 'alto', descricao: 'Interior da arvore mistica, com nucleo cristalino esmeralda pulsante que protege e sustenta todo o bioma.', tags: ['interior_arvore', 'boss_fight', 'nucleo_fushi', 'bioma_vivo'] },
  { numero: 39, id: 'laboratorio_abandonado', nome: 'Laboratorio Abandonado', biomaId: 'floresta_mistica', tipo: 'dungeon_visivel', x: 54.9, y: 42.2, image: '/assets/mundi/locations/loc_laboratorio_abandonado.png', mapId: 'floresta_laboratorio_abandonado_exterior_topdown', risco: 'medio/alto', descricao: 'Laboratorio humano antigo escondido por passagem secreta desde a Trilha Enraizada, tomado pela vegetacao e por vestigios de tecnologia.', tags: ['laboratorio', 'humanidade_antiga', 'passagem_secreta', 'lore_ilha'] },
  { numero: 40, id: 'clareira_animais', nome: 'Clareira dos Animais', biomaId: 'floresta_mistica', tipo: 'evento', x: 57.7, y: 46.9, image: '/assets/mundi/locations/loc_clareira_animais.png', mapId: 'floresta_clareira_animais_topdown', risco: 'medio/alto', descricao: 'Clareira com aviao caido e animais impedidos de se alimentar por um urso FUSHI territorial.', tags: ['animais', 'aviao_caido', 'frutas_fushi', 'urso_fushi'] },
  { numero: 41, id: 'lago_espelhado', nome: 'Lago Espelhado', biomaId: 'floresta_mistica', tipo: 'evento', x: 45, y: 61.1, image: '/assets/mundi/locations/loc_lago_espelhado.png', mapId: 'floresta_lago_espelhado_topdown', risco: 'medio/alto', descricao: 'Lago reflexivo abaixo das cachoeiras da arvore central, cercado por nevoa, esporos soniferos e ilusoes perigosas.', tags: ['lago', 'ilusao', 'esporos', 'batalha_mental'] },
  { numero: 42, id: 'arvore_bebe', nome: 'Arvore Bebe', biomaId: 'floresta_mistica', tipo: 'ponto_importante', x: 39.1, y: 60, image: '/assets/mundi/locations/loc_arvore_bebe.png', mapId: 'floresta_arvore_bebe_topdown', risco: 'medio/alto', descricao: 'Bifurcacao fantasiosa entre Praia, Veu Cinzento e interior da Floresta, com broto rosado protegido por arvores translucidas.', tags: ['bifurcacao', 'arvore_filha', 'praia', 'veu_cinzento', 'bioma_vivo'] },
  { numero: 43, id: 'saida_portao', nome: 'Saida do Portao', biomaId: 'vale_cinzento_veu', tipo: 'ponto_importante', x: 52.5, y: 71.4, image: '/assets/mundi/locations/loc_saida_portao.png', mapId: 'veu_saida_portao_topdown', risco: 'medio/alto', descricao: 'Saida do tunel de ferro que liga o Veu Cinzento as Ruinas Antigas, com rotas para a Floresta Mistica e o acampamento principal.', tags: ['portao', 'tunel', 'rota_ruinas', 'bifurcacao'] },
  { numero: 44, id: 'acampamento_veu', nome: 'Acampamento do Veu', biomaId: 'vale_cinzento_veu', tipo: 'base_faccao', x: 47.2, y: 77.4, image: '/assets/mundi/locations/loc_acampamento_veu.png', mapId: 'veu_acampamento_veu_exterior_topdown', risco: 'medio', descricao: 'Base circular da Ordem do Veu Cinza, militar e investigativa, com estrada central e edificio principal.', tags: ['base_faccao', 'detetives', 'estrategia', 'treinamento'] },
  { numero: 45, id: 'ruina_segura', nome: 'Ruina Segura', biomaId: 'vale_cinzento_veu', tipo: 'ponto_importante', x: 61.9, y: 89.6, image: '/assets/mundi/locations/loc_ruina_segura.png', mapId: 'veu_ruina_segura_topdown', risco: 'baixo/medio', descricao: 'Ruina calma proxima a uma pequena cachoeira e ao oceano, marcada por estatuas quebradas e um casal sentado diante da agua.', tags: ['lore', 'oferenda', 'estatuas', 'oceano'] },
  { numero: 46, id: 'deposito_camuflado', nome: 'Deposito Camuflado', biomaId: 'vale_cinzento_veu', tipo: 'recurso', x: 54.6, y: 89.4, image: '/assets/mundi/locations/loc_deposito_camuflado.png', mapId: 'veu_deposito_camuflado_exterior_topdown', risco: 'medio', descricao: 'Deposito de armamentos escondido perto da costa, com descida rochosa ate uma entrada camuflada.', tags: ['recursos', 'armamentos', 'caverna_escondida', 'suprimentos'] },
  { numero: 47, id: 'trilha_espioes', nome: 'Trilha dos Espioes', biomaId: 'vale_cinzento_veu', tipo: 'ponto_importante', x: 42.5, y: 89.1, image: '/assets/mundi/locations/loc_trilha_espioes.png', mapId: 'veu_trilha_espioes_topdown', risco: 'medio/alto', descricao: 'Trilha estreita e arquitetada junto a relevos e cachoeiras, usada para passagem dificil e acesso a um objeto raro.', tags: ['trilha', 'espionagem', 'relevo', 'item_raro'] },
  { numero: 48, id: 'posto_interceptacao', nome: 'Posto de Interceptacao', biomaId: 'vale_cinzento_veu', tipo: 'base_faccao', x: 36.5, y: 83.2, image: '/assets/mundi/locations/loc_posto_interceptacao.png', mapId: 'veu_posto_interceptacao_exterior_topdown', risco: 'alto', descricao: 'Posto fortificado com defesas e bunker protegido, usado para interceptacao e armazenamento de armamento pesado.', tags: ['bunker', 'defesa', 'perigo_extremo', 'dinamite'] },
  { numero: 49, id: 'torre_observacao', nome: 'Torre de Observacao', biomaId: 'vale_cinzento_veu', tipo: 'base_faccao', x: 37.4, y: 76.7, image: '/assets/mundi/locations/loc_torre_observacao.png', mapId: 'veu_torre_observacao_exterior', risco: 'medio', descricao: 'Torre de informacoes com telescopio gigante, usada para observar o Veu, a Praia, a Planicie e a Floresta Mistica.', tags: ['observacao', 'telescopio', 'informacao', 'vigilancia'] },
  { numero: 50, id: 'grande_lago', nome: 'Grande Lago', biomaId: 'vale_cinzento_veu', tipo: 'ponto_importante', x: 36.4, y: 67.3, image: '/assets/mundi/locations/loc_grande_lago.png', mapId: 'veu_grande_lago_topdown', risco: 'medio/alto', descricao: 'Lago largo com correnteza forte levando a cachoeira, conectando rotas para Praia, Floresta Mistica e o proprio Veu.', tags: ['lago', 'cachoeira', 'caiaque', 'travessia', 'bifurcacao'] },
  { numero: 51, id: 'praia_naufragos', nome: 'Praia dos Naufragos', biomaId: 'praia_litoral_oceano', x: 31, y: 61, image: '/assets/mundi/locations/loc_praia_naufragos.png', mapId: 'praia_naufragos_topdown', risco: 'medio' },
  { numero: 52, id: 'enseada_azul', nome: 'Enseada Azul', biomaId: 'praia_litoral_oceano', x: 21.7, y: 70.5, image: '/assets/mundi/locations/loc_enseada_azul.png', mapId: 'praia_enseada_azul_topdown', risco: 'baixo/medio' },
  { numero: 53, id: 'embarque_faccao_mare', nome: 'Embarque da Mare Livre', biomaId: 'praia_litoral_oceano', tipo: 'base_faccao', x: 13.9, y: 64.1, image: '/assets/mundi/locations/embarque_faccao_mare.png', mapId: 'praia_embarque_mare_exterior_topdown', risco: 'medio', tags: ['faccao', 'navegacao'] },
  { numero: 54, id: 'recife_cortante', nome: 'Recife Cortante', biomaId: 'praia_litoral_oceano', x: 5.5, y: 84, image: '/assets/mundi/locations/loc_recife_cortante.png', mapId: 'praia_recife_cortante_topdown', risco: 'medio/alto' },
  { numero: 55, id: 'alto_mar', nome: 'Alto Mar', biomaId: 'praia_litoral_oceano', x: 3.3, y: 59.6, image: '/assets/mundi/locations/alto_mar.png', mapId: 'praia_alto_mar_topdown', risco: 'alto' },
  { numero: 56, id: 'farol_quebrado', nome: 'Farol Quebrado', biomaId: 'praia_litoral_oceano', x: 6.6, y: 36, image: '/assets/mundi/locations/loc_farol_quebrado.png', mapId: 'praia_farol_quebrado_exterior_topdown', risco: 'medio' },
  { numero: 57, id: 'caverna_mare', nome: 'Caverna da Mare', biomaId: 'praia_litoral_oceano', tipo: 'dungeon_visivel', x: 11.6, y: 47.3, image: '/assets/mundi/locations/loc_caverna_mare.png', mapId: 'praia_caverna_mare_topdown', risco: 'medio/alto' },
  { numero: 58, id: 'costa_ossos', nome: 'Costa dos Ossos', biomaId: 'praia_litoral_oceano', tipo: 'dungeon_condicional', x: 16.6, y: 50.3, image: '/assets/mundi/locations/loc_costa_ossos.png', mapId: 'praia_costa_ossos_exterior_topdown', risco: 'alto', tags: ['dungeon_interna', 'cachoeira_confirmar'] },
  { numero: 59, id: 'estatuas_litoral', nome: 'Estatuas do Litoral', biomaId: 'praia_litoral_oceano', x: 25, y: 51.3, image: '/assets/mundi/locations/estatuas_litoral.png', mapId: 'praia_estatuas_litoral_topdown', risco: 'medio' },
  { numero: 60, id: 'riacho_claro', nome: 'Riacho Claro', biomaId: 'planicie_floresta_inicial', tipo: 'descanso', x: 32.8, y: 42.6, image: '/assets/mundi/locations/loc_riacho_claro.png', mapId: 'planicie_riacho_claro_topdown', risco: 'baixo' },
]

const officialMundiBasePoints: OfficialMundiPoint[] = [
  {
    numero: 61,
    id: 'base_planicie_nascente',
    nome: 'Base da Nascente',
    biomaId: 'planicie_floresta_inicial',
    tipo: 'base_bioma',
    x: 23.4,
    y: 36.4,
    image: '/assets/maps/base-upgrades/base_planicie_nascente/base_planicie_nascente_fase1_construcao_topdown_thumb_640.jpg',
    mapId: 'base_planicie_nascente_fase1_construcao_topdown',
    risco: 'baixo',
    descricao: 'Ponto de base do bioma da planicie; recurso dominavel fora dos 60 pontos principais.',
    tags: ['base_bioma', 'base_planicie', 'recurso_dominado'],
  },
  {
    numero: 62,
    id: 'base_praia_ancora',
    nome: 'Base da Ancora',
    biomaId: 'praia_litoral_oceano',
    tipo: 'base_bioma',
    x: 15.2,
    y: 72.8,
    image: '/assets/maps/base-upgrades/base_praia_ancora/base_praia_ancora_fase1_construcao_topdown_thumb_640.jpg',
    mapId: 'base_praia_ancora_fase1_construcao_topdown',
    risco: 'medio',
    descricao: 'Ponto de base costeira para navegacao, suprimentos e controle de praia.',
    tags: ['base_bioma', 'base_praia', 'recurso_dominado'],
  },
  {
    numero: 63,
    id: 'base_montanha_refugio',
    nome: 'Base do Refugio Alto',
    biomaId: 'montanhas_vazio_sereno',
    tipo: 'base_bioma',
    x: 43.2,
    y: 24.8,
    image: '/assets/maps/base-upgrades/base_montanha_refugio/base_montanha_refugio_fase1_construcao_topdown_thumb_640.jpg',
    mapId: 'base_montanha_refugio_fase1_construcao_topdown',
    risco: 'medio/alto',
    descricao: 'Ponto de base nas montanhas, separado dos templos e das rotas principais.',
    tags: ['base_bioma', 'base_montanha', 'recurso_dominado'],
  },
  {
    numero: 64,
    id: 'base_floresta_seiva',
    nome: 'Base da Seiva',
    biomaId: 'floresta_mistica',
    tipo: 'base_bioma',
    x: 52.4,
    y: 51.5,
    image: '/assets/maps/base-upgrades/base_floresta_seiva/base_floresta_seiva_fase1_construcao_topdown_thumb_640.jpg',
    mapId: 'base_floresta_seiva_fase1_construcao_topdown',
    risco: 'medio/alto',
    descricao: 'Ponto de base vivo da Floresta Mistica, ligado a cura e estudo dos esporos.',
    tags: ['base_bioma', 'base_floresta', 'recurso_dominado'],
  },
  {
    numero: 65,
    id: 'base_vulcao_obsidiana',
    nome: 'Base de Obsidiana',
    biomaId: 'vulcao_terras_cinzentas',
    tipo: 'base_bioma',
    x: 69.2,
    y: 24.6,
    image: '/assets/maps/base-upgrades/base_vulcao_obsidiana/base_vulcao_obsidiana_fase1_construcao_topdown_thumb_640.jpg',
    mapId: 'base_vulcao_obsidiana_fase1_construcao_topdown',
    risco: 'alto',
    descricao: 'Ponto de base extremo do Vulcao, util para sobreviver a cinzas e calor.',
    tags: ['base_bioma', 'base_vulcao', 'recurso_dominado'],
  },
  {
    numero: 66,
    id: 'base_gelo_abrigo',
    nome: 'Base do Abrigo Branco',
    biomaId: 'regiao_congelada_neve',
    tipo: 'base_bioma',
    x: 82.5,
    y: 56.8,
    image: '/assets/maps/base-upgrades/base_gelo_abrigo/base_gelo_abrigo_fase1_construcao_topdown_thumb_640.jpg',
    mapId: 'base_gelo_abrigo_fase1_construcao_topdown',
    risco: 'alto',
    descricao: 'Ponto de base da regiao congelada, abrigo termico fora das fortalezas.',
    tags: ['base_bioma', 'base_gelo', 'recurso_dominado'],
  },
  {
    numero: 67,
    id: 'base_ruinas_memorial',
    nome: 'Base Memorial',
    biomaId: 'ruinas_antigas',
    tipo: 'base_bioma',
    x: 66.4,
    y: 72.4,
    image: '/assets/maps/base-upgrades/base_ruinas_memorial/base_ruinas_memorial_fase1_construcao_topdown_thumb_640.jpg',
    mapId: 'base_ruinas_memorial_fase1_construcao_topdown',
    risco: 'alto',
    descricao: 'Ponto de base das Ruinas Antigas para memoria, selos e contencao.',
    tags: ['base_bioma', 'base_ruinas', 'recurso_dominado'],
  },
  {
    numero: 68,
    id: 'base_veu_esconderijo',
    nome: 'Base do Esconderijo Cinza',
    biomaId: 'vale_cinzento_veu',
    tipo: 'base_bioma',
    x: 51.8,
    y: 83.2,
    image: '/assets/maps/base-upgrades/base_veu_esconderijo/base_veu_esconderijo_fase1_construcao_topdown_thumb_640.jpg',
    mapId: 'base_veu_esconderijo_fase1_construcao_topdown',
    risco: 'medio/alto',
    descricao: 'Ponto de base oculto do Veu Cinzento para observacao e movimentacao silenciosa.',
    tags: ['base_bioma', 'base_veu', 'recurso_dominado'],
  },
]

const officialMundiBasePhase1ThumbById = new Map(
  officialMundiBasePoints.map((point) => [point.id, point.image]),
)

const allOfficialMundiPoints = [...officialMundiPoints, ...officialMundiBasePoints]

const officialMundiPointByNumber = new Map(
  allOfficialMundiPoints.map((point) => [point.numero, point]),
)

const OFFICIAL_ROUTE_PLAYER_TIME_OVERRIDES: Record<string, number> = {
  '3-5': 1 / 6,
  '4-5': 1 / 6,
  '5-60': 0.5,
  '2-5': 0.5,
  '5-6': 0.75,
  '6-60': 0.5,
}

const officialMundiRoutePairs: Array<[number, number]> = [
  [1, 2], [2, 5], [3, 5], [4, 5], [5, 6], [5, 59], [5, 60], [6, 7], [6, 42], [6, 60],
  [7, 8], [8, 9], [8, 10], [8, 11], [8, 12], [9, 10], [10, 11], [11, 12], [12, 13], [12, 14],
  [13, 15], [13, 22], [13, 29], [14, 11], [14, 15], [15, 16], [15, 22], [16, 17], [17, 18], [18, 19], [19, 20], [20, 21],
  [22, 23], [22, 25], [22, 29], [23, 24], [23, 25], [24, 25], [25, 26], [25, 27], [25, 28], [26, 27], [26, 28], [27, 28],
  [29, 30], [29, 31], [29, 34], [30, 31], [30, 32], [30, 33], [30, 34], [31, 32], [32, 33], [33, 35], [34, 35], [35, 43],
  [36, 37], [36, 39], [36, 43], [37, 38], [37, 41], [37, 42], [39, 40], [41, 42], [42, 50], [42, 51],
  [43, 44], [43, 45], [43, 46], [44, 46], [44, 47], [44, 48], [44, 49], [44, 50], [45, 46], [47, 48], [47, 46], [48, 49], [49, 50], [50, 52],
  [51, 42], [51, 50], [51, 59], [51, 60], [52, 53], [52, 58], [53, 54], [53, 58], [54, 55], [55, 57], [56, 57], [57, 58], [58, 59],
]

function getOfficialPoiTag(number: number) {
  return `mun_poi_${String(number).padStart(2, '0')}`
}

function getOfficialRouteTime(from: OfficialMundiPoint, to: OfficialMundiPoint) {
  const routeKey = [from.numero, to.numero].sort((a, b) => a - b).join('-')
  const override = OFFICIAL_ROUTE_PLAYER_TIME_OVERRIDES[routeKey]

  if (typeof override === 'number') {
    return override
  }

  const distance = Math.hypot(from.x - to.x, from.y - to.y)

  return Math.max(1 / 6, Math.min(8, Math.round(distance * 0.22 * 6) / 6))
}

function getOfficialLocationFindDt(risk: string) {
  const normalizedRisk = risk.toLowerCase()

  if (normalizedRisk.includes('cataclismico')) {
    return 32
  }

  if (normalizedRisk.includes('alto')) {
    return 25
  }

  if (normalizedRisk.includes('medio')) {
    return 20
  }

  return 15
}

function createOfficialMundiLocation(point: OfficialMundiPoint) {
  const isHighRiskBiome =
    point.biomaId === 'vulcao_terras_cinzentas' ||
    point.biomaId === 'ruinas_antigas' ||
    point.biomaId === 'regiao_congelada_neve'
  const risk = point.risco ?? (isHighRiskBiome ? 'alto' : 'medio')
  const defaultActiveSubmapIds = SUBMAP_ONLY_LOCATION_ACTIVE_DEFAULTS[point.id] ?? []
  const hasPlayableMap = Boolean(point.mapId) || defaultActiveSubmapIds.length > 0

  return createWorldMundiLocation({
    id: point.id,
    nome: point.nome,
    biomaId: point.biomaId,
    tipo: point.tipo ?? 'ponto_importante',
    nivelDetalhe: point.image ? 'detalhado' : 'slot_planejado',
    previewImageUrl: point.image ?? '',
    imagemLocalUrl: point.image ?? '',
    mapId: point.mapId ?? '',
    hasMap: Boolean(point.mapId),
    mapStatus: hasPlayableMap ? 'pronto' : 'asset_pendente',
    activeSubmapIds: defaultActiveSubmapIds,
    posicao: { x: point.x, y: point.y },
    descricaoInicial: point.descricao ?? 'CONSTRUCAO - ponto oficial numerado no MUN; asset e detalhes finais pendentes.',
    riscoBase: risk,
    riscoAtual: risk,
    estabilidadeFushi: point.biomaId === 'ruinas_antigas' ? 2 : 0,
    distorcao: point.biomaId === 'ruinas_antigas' ? 1 : 0,
    dtEncontrar: point.numero === 1 ? 0 : getOfficialLocationFindDt(risk),
    basePossivel: point.tipo === 'vila' || point.tipo === 'base_faccao' || point.tipo === 'base_bioma',
    eventosPossiveis: getSeedLocationEvents(point.id, point.biomaId),
    tags: [
      OFFICIAL_MUNDI_GEOGRAPHY_TAG,
      getOfficialPoiTag(point.numero),
      ...getSeedLocationTags(point.id, point.biomaId),
      ...(point.tags ?? []),
    ],
  })
}

const defaultLocations: WorldMundiLocation[] = allOfficialMundiPoints.map(createOfficialMundiLocation)
const officialMundiMapLinks = new Map(
  defaultLocations
    .filter((location) => location.mapId)
    .map((location) => [location.id, location.mapId]),
)

const baseUpgradeSubmapSeeds = [
  { id: 'base_planicie_nascente', codigo: 'B61', nome: 'Base da Nascente', tags: ['base_planicie', 'planicie'] },
  { id: 'base_praia_ancora', codigo: 'B62', nome: 'Base da Ancora', tags: ['base_praia', 'praia'] },
  { id: 'base_montanha_refugio', codigo: 'B63', nome: 'Base do Refugio Alto', tags: ['base_montanha', 'montanha'] },
  { id: 'base_floresta_seiva', codigo: 'B64', nome: 'Base da Seiva', tags: ['base_floresta', 'floresta'] },
  { id: 'base_vulcao_obsidiana', codigo: 'B65', nome: 'Base de Obsidiana', tags: ['base_vulcao', 'vulcao'] },
  { id: 'base_gelo_abrigo', codigo: 'B66', nome: 'Base do Abrigo Branco', tags: ['base_gelo', 'gelo'] },
  { id: 'base_ruinas_memorial', codigo: 'B67', nome: 'Base Memorial', tags: ['base_ruinas', 'ruinas'] },
  { id: 'base_veu_esconderijo', codigo: 'B68', nome: 'Base do Esconderijo Cinza', tags: ['base_veu', 'veu'] },
] as const

const defaultBaseUpgradeSubmaps: WorldMundiSubmap[] = baseUpgradeSubmapSeeds.flatMap(
  (base) => [
    createWorldMundiSubmap({
      id: `${base.id}_fase2_meio_construida`,
      parentLocationId: base.id,
      mapId: `${base.id}_fase2_meio_construida_topdown`,
      codigo: `${base.codigo}-F2`,
      nome: `${base.nome}: Fase 2 - Meio Construida`,
      tipo: 'submapa',
      descricao:
        'Submapa visual da base parcialmente erguida, usado quando o mestre quiser mostrar o avanco da construcao.',
      ordem: 20,
      status: 'pronto',
      tags: ['base_bioma', 'upgrade_visual', 'fase_2', ...base.tags],
    }),
    createWorldMundiSubmap({
      id: `${base.id}_fase3_completa`,
      parentLocationId: base.id,
      mapId: `${base.id}_fase3_completa_topdown`,
      codigo: `${base.codigo}-F3`,
      nome: `${base.nome}: Fase 3 - Completa`,
      tipo: 'submapa',
      descricao:
        'Submapa visual da base concluida, usado quando o mestre quiser ativar o estado completo do bioma.',
      ordem: 30,
      status: 'pronto',
      tags: ['base_bioma', 'upgrade_visual', 'fase_3', ...base.tags],
    }),
  ],
)

const M5_RIACHO_SUBMAP_ID = 'm5_s1_riacho_nilo_liora'
const M5_RIACHO_PARENT_LOCATION_ID = 'vila_conhecimento_absorvido'
const M5_RIACHO_MAP_ID = 'planicie_m5_s1_riacho_claro_nilo_liora'
const MUNDI_MAIN_SUBMAP_ID = '__main__'

const defaultSubmaps: WorldMundiSubmap[] = [
  ...defaultBaseUpgradeSubmaps,
  createWorldMundiSubmap({
    id: M5_RIACHO_SUBMAP_ID,
    parentLocationId: M5_RIACHO_PARENT_LOCATION_ID,
    mapId: M5_RIACHO_MAP_ID,
    codigo: 'M5-S1',
    nome: 'Riacho Claro: Nilo e Liora',
    tipo: 'memoria',
    descricao: 'Submapa emocional ligado a Nilo, Liora e ao eixo do Riacho Claro.',
    ordem: 10,
    status: 'pronto',
    tags: ['nilo', 'liora', 'riacho_claro', 'memoria'],
  }),
  createWorldMundiSubmap({
    id: 'm7_s1_caverna_meditacao_interior',
    parentLocationId: 'caverna_meditacao',
    mapId: 'montanha_caverna_meditacao_interior_topdown',
    codigo: 'M7-S1',
    nome: 'Interior da Caverna de Meditacao',
    tipo: 'interior',
    ordem: 10,
    status: 'pronto',
    tags: ['montanha', 'interior', 'ritual'],
  }),
  createWorldMundiSubmap({
    id: 'm8_s1_templo_vazio_interior',
    parentLocationId: 'templo_vazio_sereno',
    mapId: 'montanha_templo_vazio_sereno_interior_topdown',
    codigo: 'M8-S1',
    nome: 'Interior do Templo do Vazio Sereno',
    tipo: 'interior',
    ordem: 10,
    status: 'pronto',
    tags: ['montanha', 'monges', 'interior'],
  }),
  createWorldMundiSubmap({
    id: 'm9_s1_poco_yin_yang',
    parentLocationId: 'ponte_suspensa',
    mapId: 'montanha_poco_yin_yang_topdown',
    codigo: 'M9-S1',
    nome: 'Poco Yin-Yang',
    tipo: 'submapa',
    ordem: 10,
    status: 'pronto',
    tags: ['montanha', 'despertar', 'poco'],
  }),
  createWorldMundiSubmap({
    id: 'm10_s1_santuario_quatro_ventos',
    parentLocationId: 'pico_quatro_ventos',
    mapId: 'montanha_santuario_quatro_ventos_interior_topdown',
    codigo: 'M10-S1',
    nome: 'Santuario dos Quatro Ventos',
    tipo: 'interior',
    ordem: 10,
    status: 'pronto',
    tags: ['montanha', 'santuario', 'vento'],
  }),
  createWorldMundiSubmap({
    id: 'm14_s1_nucleo_paradoxal_rachado',
    parentLocationId: 'campo_cinzas',
    mapId: 'vulcao_m14_s1_nucleo_rachado',
    codigo: 'M14-S1',
    nome: 'Nucleo Paradoxal Rachado',
    tipo: 'cataclisma',
    descricao: 'Variante do Campo de Cinzas quando o orbe começa a falhar.',
    ordem: 20,
    status: 'pronto',
    tags: ['dragao_fushi', 'nucleo', 'cataclisma'],
  }),
  createWorldMundiSubmap({
    id: 'm14_s2_nucleo_paradoxal_desperto',
    parentLocationId: 'campo_cinzas',
    mapId: 'vulcao_m14_s2_nucleo_desperto',
    codigo: 'M14-S2',
    nome: 'Nucleo Paradoxal Desperto',
    tipo: 'cataclisma',
    descricao: 'Variante do orbe aberto, com energia subindo e sombra draconica.',
    ordem: 30,
    status: 'pronto',
    tags: ['dragao_fushi', 'nucleo', 'despertar'],
  }),
  createWorldMundiSubmap({
    id: 'm15_s1_corrida_abismo',
    parentLocationId: 'rio_da_escuridao',
    mapId: 'vulcao_m15_s1_corrida_abismo',
    codigo: 'M15-S1',
    nome: 'Corrida do Abismo',
    tipo: 'fase_boss',
    descricao: 'Fase inicial de Morghast, corredor colapsando em sombras durante a corrida.',
    ordem: 10,
    status: 'pronto',
    tags: ['morghast', 'fase_1', 'sombras'],
  }),
  createWorldMundiSubmap({
    id: 'm15_s2_nucleo_sombras',
    parentLocationId: 'rio_da_escuridao',
    mapId: 'vulcao_m15_s2_nucleo_sombras',
    codigo: 'M15-S2',
    nome: 'Nucleo das Sombras',
    tipo: 'fase_boss',
    descricao: 'Fase central de Morghast, arena do nucleo sombrio e combate direto.',
    ordem: 20,
    status: 'pronto',
    tags: ['morghast', 'fase_2', 'nucleo'],
  }),
  createWorldMundiSubmap({
    id: 'm15_s3_takedown_mar_infinito',
    parentLocationId: 'rio_da_escuridao',
    mapId: 'vulcao_m15_s3_takedown_mar_infinito',
    codigo: 'M15-S3',
    nome: 'Takedown: Mar Infinito',
    tipo: 'fase_boss',
    descricao: 'Fase final de Morghast, mar de sombras com ilhas seguras e nucleo atacavel.',
    ordem: 30,
    status: 'pronto',
    tags: ['morghast', 'fase_3', 'mar_infinito'],
  }),
  createWorldMundiSubmap({
    id: 'm16_s1_sala_estatuas_xadrez',
    parentLocationId: 'vulcao_abandonado',
    mapId: 'vulcao_m16_s1_sala_estatuas_xadrez',
    codigo: 'M16-S1',
    nome: 'Sala das Estatuas e Tabuleiro',
    tipo: 'fase_boss',
    descricao: 'Entrada correta de Euryaleth: jardim de pessoas petrificadas, tabuleiro gigante e pecas de xadrez como cobertura/obstaculo.',
    ordem: 10,
    status: 'pronto',
    tags: ['euryaleth', 'fase_1', 'xadrez', 'petrificacao'],
  }),
  createWorldMundiSubmap({
    id: 'm16_s2_olhar_estagnacao',
    parentLocationId: 'vulcao_abandonado',
    mapId: 'vulcao_m16_s2_olhar_estagnacao',
    codigo: 'M16-S2',
    nome: 'Olhar da Estagnacao',
    tipo: 'fase_boss',
    descricao: 'Variante da sala quando Euryaleth altera o tabuleiro, ativa serpentes e transforma estatuas em ameacas de petrificacao.',
    ordem: 20,
    status: 'pronto',
    tags: ['euryaleth', 'fase_2', 'serpentes', 'petrificacao'],
  }),
  createWorldMundiSubmap({
    id: 'm16_s3_escadaria_espiral_aberta',
    parentLocationId: 'vulcao_abandonado',
    mapId: 'vulcao_m16_s3_escadaria_espiral_aberta',
    codigo: 'M16-S3',
    nome: 'Escadaria Espiral Aberta',
    tipo: 'puzzle',
    descricao: 'Estado final apos o puzzle: tabuleiro aberto no centro, escadaria espiral descendo e a cabeca viva de Euryaleth como pressao de 5 turnos.',
    ordem: 30,
    status: 'pronto',
    tags: ['euryaleth', 'fase_3', 'escadaria', 'cabeca_viva'],
  }),
  createWorldMundiSubmap({
    id: 'm17_s1_arena_vorashk_sem_muros',
    parentLocationId: 'labirinto_quente',
    mapId: 'vulcao_m17_s1_arena_vorashk_sem_muros',
    codigo: 'M17-S1',
    nome: 'Arena de Vorashk sem Muros',
    tipo: 'fase_boss',
    descricao: 'Submapa revelado depois dos quatro baus corretos: os muros caem, o labirinto abre e Vorashk vira luta direta.',
    ordem: 20,
    status: 'pronto',
    tags: ['vorashk', 'fase_final', 'labirinto_aberto'],
  }),
  createWorldMundiSubmap({
    id: 'm18_s1_escadaria_vulcao_erupcao',
    parentLocationId: 'boca_inferno',
    mapId: 'vulcao_m18_s1_escadaria_erupcao',
    codigo: 'M18-S1',
    nome: 'Escadaria do Vulcao em Erupcao',
    tipo: 'entrada',
    descricao: 'Primeiro estado de M18: parkour de subida por rochas, pontes quebradas e plataformas suspensas sobre lava ate o topo do vulcao.',
    ordem: 10,
    status: 'pronto',
    tags: ['aeronyx', 'parkour', 'vulcao'],
  }),
  createWorldMundiSubmap({
    id: 'm18_s2_arena_aeronyx_topo',
    parentLocationId: 'boca_inferno',
    mapId: 'vulcao_m18_boca_inferno_aeronyx',
    codigo: 'M18-S2',
    nome: 'Arena de Aeronyx no Topo',
    tipo: 'fase_boss',
    descricao: 'Estado seguinte: arena no topo da Boca do Inferno, com vento, lava extrema, plataformas instaveis e dominio aereo de Aeronyx.',
    ordem: 20,
    status: 'pronto',
    tags: ['aeronyx', 'fase_boss', 'topo_vulcao'],
  }),
  createWorldMundiSubmap({
    id: 'm18_s3_chuva_obsidiana',
    parentLocationId: 'boca_inferno',
    mapId: 'vulcao_m18_s3_chuva_obsidiana',
    codigo: 'M18-S3',
    nome: 'Chuva e Obsidiana',
    tipo: 'cataclisma',
    descricao: 'Estado final da luta: chuva forte, lava esfriando em obsidiana e a arena ruindo depois de Aeronyx.',
    ordem: 30,
    status: 'pronto',
    tags: ['aeronyx', 'fase_final', 'obsidiana'],
  }),
  createWorldMundiSubmap({
    id: 'm19_s1_costa_preparacao_navio',
    parentLocationId: 'mar_inquieto',
    mapId: 'vulcao_m19_mar_inquieto_thalzhyr',
    codigo: 'M19-S1',
    nome: 'Costa Tempestuosa e Preparacao do Navio',
    tipo: 'entrada',
    descricao: 'Primeiro estado de M19: costa sob tempestade, construcao/preparo do navio e leitura do mar antes de Thal Zhyr.',
    ordem: 10,
    status: 'pronto',
    tags: ['thal_zhyr', 'preparacao', 'navio', 'costa'],
  }),
  createWorldMundiSubmap({
    id: 'm19_s2_alto_mar_tempestade',
    parentLocationId: 'mar_inquieto',
    mapId: 'vulcao_m19_s2_alto_mar_tempestade',
    codigo: 'M19-S2',
    nome: 'Alto Mar: Navio em Colapso',
    tipo: 'fase_boss',
    descricao: 'Submapa de alto mar com ondas massivas, vortexes e o navio sendo destruido pela tempestade.',
    ordem: 20,
    status: 'pronto',
    tags: ['thal_zhyr', 'alto_mar', 'navio', 'tempestade'],
  }),
  createWorldMundiSubmap({
    id: 'm19_s3_hidra_thalzhyr',
    parentLocationId: 'mar_inquieto',
    mapId: 'vulcao_m19_s3_hidra_thalzhyr',
    codigo: 'M19-S3',
    nome: 'Hidra no Mar Aberto',
    tipo: 'fase_boss',
    descricao: 'Arena principal de Thal Zhyr: mar aberto, cabecas da hidra, zonas de onda e espaco de sobrevivencia sem terra firme.',
    ordem: 30,
    status: 'pronto',
    tags: ['thal_zhyr', 'hidra', 'alto_mar', 'boss'],
  }),
  createWorldMundiSubmap({
    id: 'm19_s4_mar_colapsando_costa',
    parentLocationId: 'mar_inquieto',
    mapId: 'vulcao_m19_s4_mar_colapsando_costa',
    codigo: 'M19-S4',
    nome: 'Mar Colapsando ate a Costa',
    tipo: 'cataclisma',
    descricao: 'Fase final de sobrevivencia: ondas gigantes empurram o grupo de volta a costa enquanto o mar fecha caminhos.',
    ordem: 40,
    status: 'pronto',
    tags: ['thal_zhyr', 'sobrevivencia', 'cataclisma'],
  }),
  createWorldMundiSubmap({
    id: 'm20_s1_observatorio_selo',
    parentLocationId: 'transcendente',
    mapId: 'vulcao_m20_s1_observatorio_selo',
    codigo: 'M20-S1',
    nome: 'Observatorio do Selo',
    tipo: 'fase_boss',
    descricao: 'Primeira fase de Astrael, arena estavel com altar central e leitura espacial.',
    ordem: 10,
    status: 'pronto',
    tags: ['astrael', 'fase_1', 'dimensao'],
  }),
  createWorldMundiSubmap({
    id: 'm20_s2_seis_orbitas',
    parentLocationId: 'transcendente',
    mapId: 'vulcao_m20_s2_seis_orbitas',
    codigo: 'M20-S2',
    nome: 'Seis Orbitas do Vulcao',
    tipo: 'fase_boss',
    descricao: 'Segunda fase de Astrael, seis plataformas orbitais separadas pelo vazio.',
    ordem: 20,
    status: 'pronto',
    tags: ['astrael', 'fase_2', 'orbitas'],
  }),
  createWorldMundiSubmap({
    id: 'm20_s3_ciclo_vorpal',
    parentLocationId: 'transcendente',
    mapId: 'vulcao_m20_s3_ciclo_vorpal',
    codigo: 'M20-S3',
    nome: 'Ciclo Vorpal',
    tipo: 'fase_boss',
    descricao: 'Terceira fase de Astrael, com tres pilares vorpais e horizonte de evento.',
    ordem: 30,
    status: 'pronto',
    tags: ['astrael', 'fase_3', 'pilares_vorpais'],
  }),
  createWorldMundiSubmap({
    id: 'm20_s4_colapso_selo',
    parentLocationId: 'transcendente',
    mapId: 'vulcao_m20_s4_colapso_selo',
    codigo: 'M20-S4',
    nome: 'Colapso do Ultimo Selo',
    tipo: 'cataclisma',
    descricao: 'Quarta fase, fuga ou decisao final entre estabilizar e romper o selo.',
    ordem: 40,
    status: 'pronto',
    tags: ['astrael', 'cataclisma', 'dragao_fushi'],
  }),
  createWorldMundiSubmap({
    id: 'm30_s1_portao_torre_abismo',
    parentLocationId: 'torre_abismo',
    mapId: 'ruinas_m30_s1_portao_torre_abismo',
    codigo: 'M30-S1',
    nome: 'Portao Externo das Quatro Chaves',
    tipo: 'entrada',
    descricao: 'Entrada da Torre do Abismo com quatro encaixes e mecanismo de abertura.',
    ordem: 10,
    status: 'pronto',
    tags: ['ryoku', 'torre', 'quatro_chaves'],
  }),
  createWorldMundiSubmap({
    id: 'm30_s2_camara_fragmentos',
    parentLocationId: 'torre_abismo',
    mapId: 'ruinas_m30_torre_abismo',
    codigo: 'M30-S2',
    nome: 'Camara dos Fragmentos',
    tipo: 'interior',
    descricao: 'Sala interna para os dez fragmentos e preparo do ritual.',
    ordem: 20,
    status: 'pronto',
    tags: ['ryoku', 'fragmentos', 'interior'],
  }),
  createWorldMundiSubmap({
    id: 'm30_s3_corpo_petrificado_ryoku',
    parentLocationId: 'torre_abismo',
    mapId: 'ruinas_m30_s3_corpo_petrificado_ryoku',
    codigo: 'M30-S3',
    nome: 'Corpo Petrificado de Ryoku',
    tipo: 'interior',
    descricao: 'Camada superior com Ryoku acorrentado como silhueta e corpo petrificado.',
    ordem: 30,
    status: 'pronto',
    tags: ['ryoku', 'correntes', 'suspense'],
  }),
  createWorldMundiSubmap({
    id: 'm30_s4_torre_despertando',
    parentLocationId: 'torre_abismo',
    mapId: 'ruinas_m30_s4_torre_despertando',
    codigo: 'M30-S4',
    nome: 'Torre do Abismo Despertando',
    tipo: 'cataclisma',
    ordem: 40,
    status: 'pronto',
    tags: ['ryoku', 'cataclisma', 'despertar'],
  }),
  createWorldMundiSubmap({
    id: 'm33_s1_entrada_estruturas',
    parentLocationId: 'estruturas_ruinas_abandonadas',
    mapId: 'ruinas_m33_s1_entrada_estruturas',
    codigo: 'M33-S1',
    nome: 'Entrada das Estruturas',
    tipo: 'entrada',
    ordem: 10,
    status: 'pronto',
    tags: ['ryoku', 'ruinas', 'entrada'],
  }),
  createWorldMundiSubmap({
    id: 'm33_s2_parkour_forma_instavel',
    parentLocationId: 'estruturas_ruinas_abandonadas',
    mapId: 'ruinas_m33_s2_parkour_forma_instavel',
    codigo: 'M33-S2',
    nome: 'Parkour da Forma Instavel',
    tipo: 'puzzle',
    descricao: 'Pilares, abismos e selos em altura para a Chave da Forma.',
    ordem: 20,
    status: 'pronto',
    tags: ['ryoku', 'parkour', 'pilares'],
  }),
  createWorldMundiSubmap({
    id: 'm39_s1_laboratorio_interior',
    parentLocationId: 'laboratorio_abandonado',
    mapId: 'floresta_laboratorio_abandonado_interior_topdown',
    codigo: 'M39-S1',
    nome: 'Interior do Laboratorio Abandonado',
    tipo: 'interior',
    ordem: 10,
    status: 'pronto',
    tags: ['floresta', 'laboratorio', 'interior'],
  }),
  createWorldMundiSubmap({
    id: 'm44_s1_acampamento_veu_base',
    parentLocationId: 'acampamento_veu',
    mapId: 'veu_acampamento_veu_base_interior_topdown',
    codigo: 'M44-S1',
    nome: 'Interior da Base do Veu',
    tipo: 'interior',
    ordem: 10,
    status: 'pronto',
    tags: ['veu', 'base', 'interior'],
  }),
  createWorldMundiSubmap({
    id: 'm46_s1_deposito_camuflado_interior',
    parentLocationId: 'deposito_camuflado',
    mapId: 'veu_deposito_camuflado_interior_topdown',
    codigo: 'M46-S1',
    nome: 'Interior do Deposito Camuflado',
    tipo: 'interior',
    ordem: 10,
    status: 'pronto',
    tags: ['veu', 'deposito', 'interior'],
  }),
  createWorldMundiSubmap({
    id: 'm48_s1_bunker_interceptacao',
    parentLocationId: 'posto_interceptacao',
    mapId: 'veu_posto_interceptacao_bunker_interior_topdown',
    codigo: 'M48-S1',
    nome: 'Bunker do Posto de Interceptacao',
    tipo: 'interior',
    ordem: 10,
    status: 'pronto',
    tags: ['veu', 'bunker', 'interior'],
  }),
  createWorldMundiSubmap({
    id: 'm49_s1_topo_torre_observacao',
    parentLocationId: 'torre_observacao',
    mapId: 'veu_torre_observacao_topo',
    codigo: 'M49-S1',
    nome: 'Topo da Torre de Observacao',
    tipo: 'submapa',
    ordem: 10,
    status: 'pronto',
    tags: ['veu', 'torre', 'observacao'],
  }),
  createWorldMundiSubmap({
    id: 'm53_s1_navio_mare_interior',
    parentLocationId: 'embarque_faccao_mare',
    mapId: 'praia_navio_mare_interior_topdown',
    codigo: 'M53-S1',
    nome: 'Interior do Navio da Mare Livre',
    tipo: 'interior',
    ordem: 10,
    status: 'pronto',
    tags: ['praia', 'mare', 'navio'],
  }),
  createWorldMundiSubmap({
    id: 'm55_s1_santuario_submerso',
    parentLocationId: 'alto_mar',
    mapId: 'praia_alto_mar_santuario_submerso_topdown',
    codigo: 'M55-S1',
    nome: 'Santuario Submerso',
    tipo: 'submapa',
    ordem: 10,
    status: 'pronto',
    tags: ['praia', 'oceano', 'submerso'],
  }),
  createWorldMundiSubmap({
    id: 'm56_s1_farol_quebrado_interior',
    parentLocationId: 'farol_quebrado',
    mapId: 'praia_farol_quebrado_interior_topdown',
    codigo: 'M56-S1',
    nome: 'Interior do Farol Quebrado',
    tipo: 'interior',
    ordem: 10,
    status: 'pronto',
    tags: ['praia', 'farol', 'interior'],
  }),
  createWorldMundiSubmap({
    id: 'm58_s1_caverna_cachoeira_ossos',
    parentLocationId: 'costa_ossos',
    mapId: 'praia_caverna_cachoeira_ossos_topdown',
    codigo: 'M58-S1',
    nome: 'Caverna da Cachoeira dos Ossos',
    tipo: 'interior',
    ordem: 10,
    status: 'pronto',
    tags: ['praia', 'ossos', 'caverna'],
  }),
]

const defaultLocationsWithSubmapState: WorldMundiLocation[] = defaultLocations.map((location) =>
  location.id === M5_RIACHO_PARENT_LOCATION_ID
    ? createWorldMundiLocation({
        ...location,
        activeSubmapIds: Array.from(
          new Set([MUNDI_MAIN_SUBMAP_ID, M5_RIACHO_SUBMAP_ID, ...location.activeSubmapIds]),
        ),
      })
    : location,
)

const defaultRoutes: WorldMundiRoute[] = officialMundiRoutePairs
  .map(([fromNumber, toNumber]) => {
    const from = officialMundiPointByNumber.get(fromNumber)
    const to = officialMundiPointByNumber.get(toNumber)

    if (!from || !to) {
      return null
    }

    const time = getOfficialRouteTime(from, to)
    const isCrossBiome = from.biomaId !== to.biomaId
    const isHighRisk =
      from.risco?.includes('alto') ||
      to.risco?.includes('alto') ||
      from.biomaId === 'vulcao_terras_cinzentas' ||
      to.biomaId === 'vulcao_terras_cinzentas' ||
      from.biomaId === 'ruinas_antigas' ||
      to.biomaId === 'ruinas_antigas'

    return createWorldMundiRoute({
      id: `rota_mun_${String(fromNumber).padStart(2, '0')}_${String(toNumber).padStart(2, '0')}`,
      origemId: from.id,
      destinoId: to.id,
      tempoPlayersHoras: time,
      terreno: isCrossBiome ? 'rota oficial entre biomas' : 'rota oficial do bioma',
      risco: isHighRisk ? 'alto' : isCrossBiome ? 'medio/alto' : 'medio',
      visibilidade: 'normal',
      chanceEncontro: isHighRisk ? 'alta' : 'media',
      encontrosPossiveis: ['encontro regional possivel', 'sinais de movimentacao local'],
      eventosPossiveis: ['rota oficial do mapa mundi atravessada'],
      tags: [
        OFFICIAL_MUNDI_GEOGRAPHY_TAG,
        OFFICIAL_MUNDI_ROUTE_REVISION_TAG,
        'rota_oficial_mun',
      ],
    })
  })
  .filter((route): route is WorldMundiRoute => route !== null)

const defaultEntities: Record<string, WorldMundiEntity> = {
  lobos_clareira_inicial: createWorldMundiEntity({
    id: 'lobos_clareira_inicial',
    nome: 'Lobos da Clareira',
    tipo: 'mob',
    localAtualId: 'clareira_lobos',
    comportamento: 'Defendem territorio e reagem ao cheiro estranho de FUSHI.',
    hostilidade: 'alta se ameacados',
    risco: 'baixo/medio',
    quantidade: 3,
    tags: ['tutorial_opcional', 'animal', 'combate'],
  }),
}

const defaultParties: Record<string, WorldMundiParty> = {
  party_protagonistas: createWorldMundiParty({
    id: 'party_protagonistas',
    nome: 'Grupo Principal',
    tipo: 'grupo_principal',
    memberPlayerIds: ['player1', 'player2', 'player3', 'player4', 'player5'],
    localAtualId: 'caverna_primeiro_corpo',
    estado: 'junto',
    contextoAtual:
      'Consciências protagonistas vinculadas ao corpo atual. Move como um grupo enquanto coexistirem.',
    motivoFormacao: 'Despertar inicial no mesmo corpo.',
  }),
}

const defaultPlayers: Record<string, WorldMundiPlayer> = Object.fromEntries(
  [1, 2, 3, 4, 5].map((index) => {
    const id = `player${index}`

    return [
      id,
      createWorldMundiPlayer({
        id,
        nome: `Jogador ${index}`,
        conscienciaId: `consciencia_${id}`,
      }),
    ]
  }),
)

const defaultConsciousnesses: Record<string, WorldMundiConsciousness> = Object.fromEntries(
  [1, 2, 3, 4, 5].map((index) => {
    const playerId = `player${index}`
    const id = `consciencia_${playerId}`

    return [
      id,
      createWorldMundiConsciousness({
        id,
        nome: `Consciencia J${index}`,
        jogadorId: playerId,
        corpoAtualId: 'corpo_compartilhado',
        grupoAtualId: 'party_protagonistas',
      }),
    ]
  }),
)

const defaultBodies: Record<string, WorldMundiBody> = {
  corpo_compartilhado: createWorldMundiBody({
    id: 'corpo_compartilhado',
    nome: 'Corpo Compartilhado',
    tipo: 'fushi',
    localAtualId: 'caverna_primeiro_corpo',
    ocupadoPorConsciencia: true,
    estadoDaConscienciaOriginal: 'coexistindo',
  }),
}

const defaultBiomeBaseSeeds = [
  {
    id: 'base_planicie_nascente',
    nome: 'Base da Nascente',
    biomaId: 'planicie_floresta_inicial',
    locationId: 'base_planicie_nascente',
    resumo: 'Abrigo vivo da planicie para descanso, treino leve e recuperacao inicial.',
    buffBioma: 'Planicie completa: +1 em testes de recuperacao, coleta e retorno seguro na planicie.',
  },
  {
    id: 'base_praia_ancora',
    nome: 'Base da Ancora',
    biomaId: 'praia_litoral_oceano',
    locationId: 'base_praia_ancora',
    resumo: 'Entreposto costeiro para navegacao, resgate e rotas maritimas.',
    buffBioma: 'Praia completa: viagens costeiras ganham preparo e menor risco de perda de suprimentos.',
  },
  {
    id: 'base_montanha_refugio',
    nome: 'Base do Refugio Alto',
    biomaId: 'montanhas_vazio_sereno',
    locationId: 'base_montanha_refugio',
    resumo: 'Refugio de altitude para disciplina, vigia e preparacao contra clima extremo.',
    buffBioma: 'Montanhas completas: +1 em travessias, escalada e resistencia a vento/frio.',
  },
  {
    id: 'base_floresta_seiva',
    nome: 'Base da Seiva',
    biomaId: 'floresta_mistica',
    locationId: 'base_floresta_seiva',
    resumo: 'Ponto de convivencia com a floresta viva, cura e estudo dos esporos.',
    buffBioma: 'Floresta completa: recuperacao natural melhorada e menor risco de esporos hostis.',
  },
  {
    id: 'base_vulcao_obsidiana',
    nome: 'Base de Obsidiana',
    biomaId: 'vulcao_terras_cinzentas',
    locationId: 'base_vulcao_obsidiana',
    resumo: 'Posto extremo para suportar cinzas, calor e sinais dos guardioes.',
    buffBioma: 'Vulcao completo: reduz desgaste de calor/cinzas e melhora preparo contra guardioes.',
  },
  {
    id: 'base_gelo_abrigo',
    nome: 'Base do Abrigo Branco',
    biomaId: 'regiao_congelada_neve',
    locationId: 'base_gelo_abrigo',
    resumo: 'Abrigo termico para travessias longas e sobrevivencia na regiao congelada.',
    buffBioma: 'Gelo completo: menor risco de exaustao por frio e avalanches em rotas preparadas.',
  },
  {
    id: 'base_ruinas_memorial',
    nome: 'Base Memorial',
    biomaId: 'ruinas_antigas',
    locationId: 'base_ruinas_memorial',
    resumo: 'Posto de memoria e contencao contra vozes, fragmentos e selos antigos.',
    buffBioma: 'Ruinas completas: +1 em leitura de memoria, selos e rotas ruinosas ja estudadas.',
  },
  {
    id: 'base_veu_esconderijo',
    nome: 'Base do Esconderijo Cinza',
    biomaId: 'vale_cinzento_veu',
    locationId: 'base_veu_esconderijo',
    resumo: 'Ponto oculto para inteligencia, observacao e movimentacao silenciosa pelo Veu.',
    buffBioma: 'Veu completo: melhora furtividade/logistica e reduz risco de interceptacao.',
  },
] satisfies Array<{
  id: string
  nome: string
  biomaId: string
  locationId: string
  resumo: string
  buffBioma: string
}>

function prefixBiomeBaseUpgradeId(baseId: string, upgradeId: string) {
  return `${baseId.replace(/^base_/, '')}_${upgradeId}`
}

type BaseUpgradeWebLayout = {
  x: number
  y: number
  dependsOnIds: string[]
  iconKey: WorldMundiBaseUpgradeIconKey
}

const baseUpgradeWebLayoutById: Record<string, BaseUpgradeWebLayout> = {
  reforma_inicial: { x: 50, y: 83, dependsOnIds: [], iconKey: 'home' },
  dormitorio_compartilhado: { x: 13, y: 69, dependsOnIds: [], iconKey: 'bed' },
  agua_e_cozinha: { x: 85, y: 69, dependsOnIds: [], iconKey: 'water' },
  deposito_de_recursos: {
    x: 16,
    y: 36,
    dependsOnIds: [],
    iconKey: 'box',
  },
  oficina_improvisada: {
    x: 34,
    y: 56,
    dependsOnIds: [],
    iconKey: 'tool',
  },
  defesas_externas: { x: 23, y: 18, dependsOnIds: [], iconKey: 'shield' },
  enfermaria: { x: 64, y: 56, dependsOnIds: [], iconKey: 'cross' },
  sala_de_musica: { x: 86, y: 38, dependsOnIds: [], iconKey: 'music' },
  biblioteca_de_memoria: { x: 43, y: 35, dependsOnIds: [], iconKey: 'book' },
  nucleo_fushi_controlado: {
    x: 50,
    y: 18,
    dependsOnIds: [],
    iconKey: 'core',
  },
  sala_mundi: { x: 77, y: 18, dependsOnIds: [], iconKey: 'map' },
}

const baseUpgradePedestalLayoutByBaseId: Record<
  string,
  Partial<Record<string, { x: number; y: number }>>
> = {
  base_planicie_nascente: {
    reforma_inicial: { x: 50, y: 83 },
    dormitorio_compartilhado: { x: 12, y: 69 },
    agua_e_cozinha: { x: 85, y: 69 },
    deposito_de_recursos: { x: 16, y: 36 },
    enfermaria: { x: 64, y: 56 },
    oficina_improvisada: { x: 34, y: 56 },
    biblioteca_de_memoria: { x: 43, y: 35 },
    sala_de_musica: { x: 86, y: 38 },
    defesas_externas: { x: 23, y: 18 },
    nucleo_fushi_controlado: { x: 50, y: 18 },
    sala_mundi: { x: 77, y: 18 },
  },
  base_praia_ancora: {
    reforma_inicial: { x: 50, y: 76 },
    dormitorio_compartilhado: { x: 24, y: 65 },
    agua_e_cozinha: { x: 71, y: 65 },
    deposito_de_recursos: { x: 18, y: 37 },
    enfermaria: { x: 59, y: 46 },
    oficina_improvisada: { x: 40, y: 42 },
    biblioteca_de_memoria: { x: 50, y: 31 },
    sala_de_musica: { x: 78, y: 38 },
    defesas_externas: { x: 32, y: 22 },
    nucleo_fushi_controlado: { x: 47, y: 13 },
    sala_mundi: { x: 68, y: 22 },
  },
  base_montanha_refugio: {
    reforma_inicial: { x: 50, y: 82 },
    dormitorio_compartilhado: { x: 30, y: 59 },
    agua_e_cozinha: { x: 72, y: 63 },
    deposito_de_recursos: { x: 18, y: 38 },
    enfermaria: { x: 63, y: 42 },
    oficina_improvisada: { x: 43, y: 36 },
    biblioteca_de_memoria: { x: 50, y: 53 },
    sala_de_musica: { x: 83, y: 47 },
    defesas_externas: { x: 29, y: 18 },
    nucleo_fushi_controlado: { x: 51, y: 18 },
    sala_mundi: { x: 72, y: 23 },
  },
  base_floresta_seiva: {
    reforma_inicial: { x: 50, y: 82 },
    dormitorio_compartilhado: { x: 29, y: 63 },
    agua_e_cozinha: { x: 73, y: 63 },
    deposito_de_recursos: { x: 15, y: 39 },
    enfermaria: { x: 62, y: 40 },
    oficina_improvisada: { x: 40, y: 40 },
    biblioteca_de_memoria: { x: 50, y: 55 },
    sala_de_musica: { x: 86, y: 39 },
    defesas_externas: { x: 29, y: 18 },
    nucleo_fushi_controlado: { x: 50, y: 12 },
    sala_mundi: { x: 73, y: 18 },
  },
  base_vulcao_obsidiana: {
    reforma_inicial: { x: 50, y: 80 },
    dormitorio_compartilhado: { x: 21, y: 69 },
    agua_e_cozinha: { x: 80, y: 69 },
    deposito_de_recursos: { x: 16, y: 35 },
    enfermaria: { x: 65, y: 43 },
    oficina_improvisada: { x: 35, y: 43 },
    biblioteca_de_memoria: { x: 50, y: 50 },
    sala_de_musica: { x: 84, y: 36 },
    defesas_externas: { x: 24, y: 18 },
    nucleo_fushi_controlado: { x: 50, y: 18 },
    sala_mundi: { x: 75, y: 15 },
  },
  base_gelo_abrigo: {
    reforma_inicial: { x: 50, y: 81 },
    dormitorio_compartilhado: { x: 28, y: 60 },
    agua_e_cozinha: { x: 77, y: 61 },
    deposito_de_recursos: { x: 16, y: 35 },
    enfermaria: { x: 62, y: 40 },
    oficina_improvisada: { x: 42, y: 40 },
    biblioteca_de_memoria: { x: 50, y: 53 },
    sala_de_musica: { x: 82, y: 38 },
    defesas_externas: { x: 28, y: 18 },
    nucleo_fushi_controlado: { x: 50, y: 14 },
    sala_mundi: { x: 73, y: 18 },
  },
  base_ruinas_memorial: {
    reforma_inicial: { x: 50, y: 82 },
    dormitorio_compartilhado: { x: 25, y: 68 },
    agua_e_cozinha: { x: 72, y: 68 },
    deposito_de_recursos: { x: 17, y: 37 },
    enfermaria: { x: 62, y: 52 },
    oficina_improvisada: { x: 34, y: 52 },
    biblioteca_de_memoria: { x: 50, y: 44 },
    sala_de_musica: { x: 80, y: 37 },
    defesas_externas: { x: 28, y: 18 },
    nucleo_fushi_controlado: { x: 50, y: 18 },
    sala_mundi: { x: 72, y: 18 },
  },
  base_veu_esconderijo: {
    reforma_inicial: { x: 50, y: 82 },
    dormitorio_compartilhado: { x: 21, y: 71 },
    agua_e_cozinha: { x: 70, y: 71 },
    deposito_de_recursos: { x: 18, y: 37 },
    enfermaria: { x: 64, y: 48 },
    oficina_improvisada: { x: 34, y: 55 },
    biblioteca_de_memoria: { x: 47, y: 43 },
    sala_de_musica: { x: 81, y: 38 },
    defesas_externas: { x: 30, y: 18 },
    nucleo_fushi_controlado: { x: 50, y: 15 },
    sala_mundi: { x: 76, y: 19 },
  },
}

function getBaseUpgradeRawId(baseId: string, upgradeId: string) {
  const basePrefix = `${baseId.replace(/^base_/, '')}_`

  return upgradeId.startsWith(basePrefix) ? upgradeId.slice(basePrefix.length) : upgradeId
}

function getBaseUpgradeWebLayout(baseId: string, upgradeId: string) {
  const rawId = getBaseUpgradeRawId(baseId, upgradeId)
  const defaultLayout = baseUpgradeWebLayoutById[rawId]
  const pedestalLayout = baseUpgradePedestalLayoutByBaseId[baseId]?.[rawId]

  if (!defaultLayout) {
    return undefined
  }

  return {
    ...defaultLayout,
    ...pedestalLayout,
  }
}

type BiomeBaseUpgradeOverride = Partial<
  Pick<
    WorldMundiBaseUpgrade,
    | 'nome'
    | 'categoria'
    | 'resumo'
    | 'efeitoMesa'
    | 'bonus'
    | 'custo'
    | 'requisito'
    | 'locationHintId'
  >
>

const biomeBaseUpgradeRequirementOverridesByBaseId: Record<
  string,
  Record<string, Pick<WorldMundiBaseUpgrade, 'custo' | 'requisito'>>
> = {
  base_planicie_nascente: {
    reforma_inicial: { custo: 'Madeira viva, pedra lisa da caverna, 1 cena de limpeza e marco de abrigo.', requisito: 'Reconhecer a Caverna do Primeiro Corpo como ponto seguro.' },
    dormitorio_compartilhado: { custo: 'Peles de lobo, fibras do Bosque Baixo e folhas largas secas.', requisito: 'Nucleo da Nascente ativo.' },
    agua_e_cozinha: { custo: 'Pedras filtrantes do Riacho Claro, carvao limpo e panela simples.', requisito: 'Riacho Claro conhecido ou agua coletada em cena.' },
    deposito_de_recursos: { custo: 'Caixotes do Armazem Comunitario, cordas e marcadores de grupo.', requisito: 'Nucleo da Nascente ativo e 1 coleta organizada.' },
    oficina_improvisada: { custo: 'Madeira firme do Campo de Treino, pedra plana e ferramentas simples.', requisito: 'Armazem de Campo ativo.' },
    enfermaria: { custo: 'Ervas da planicie, pano limpo, agua filtrada e luz estavel.', requisito: 'Riacho Filtrado ativo.' },
    biblioteca_de_memoria: { custo: 'Papel, tinta, relatos da vila e um fragmento de memoria registrado.', requisito: 'Armazem de Campo ativo e contato com a Vila.' },
    sala_de_musica: { custo: 'Instrumento simples, fogueira segura e objeto emocional do grupo.', requisito: 'Leitos de Folhas ativo.' },
    defesas_externas: { custo: 'Estacas, sinos baixos, corda e trilhas marcadas da Clareira dos Lobos.', requisito: 'Bancada de Treino ativa.' },
    nucleo_fushi_controlado: { custo: 'Cristais claros da floresta, circulo de sal e amostra de FUSHI vivo.', requisito: 'Memoria da Vila ativa.' },
    sala_mundi: { custo: 'Mapa da ilha, marcadores, logs de viagem e nucleo FUSHI estabilizado.', requisito: 'Esporo Contido ativo.' },
  },
  base_praia_ancora: {
    reforma_inicial: { custo: 'Madeira de naufragio, cordas salgadas, ancora velha e lona impermeavel.', requisito: 'Chegar a um ponto costeiro seguro.' },
    dormitorio_compartilhado: { custo: 'Redes secas, tecido encerado e postes acima da mare.', requisito: 'Ancoradouro Seguro ativo.' },
    agua_e_cozinha: { custo: 'Filtro de areia, conchas calcarias, barril e fogareiro protegido.', requisito: 'Enseada Azul ou fonte costeira conhecida.' },
    deposito_de_recursos: { custo: 'Baia coberta, barris, ganchos, velas e madeira de casco.', requisito: 'Ancoradouro Seguro ativo.' },
    oficina_improvisada: { custo: 'Ferragem salgada, breu, martelo, lona e banco de casco.', requisito: 'Baia de Carga ativa.' },
    enfermaria: { custo: 'Salmoura controlada, algas medicinais, maca suspensa e tecido seco.', requisito: 'Dessalinizador Simples ativo.' },
    biblioteca_de_memoria: { custo: 'Cartas nauticas, relatos da Mare Livre e registro de correntes.', requisito: 'Baia de Carga ativa.' },
    sala_de_musica: { custo: 'Sino costeiro, concha ressonante e abrigo contra vento.', requisito: 'Redes Secas ativo.' },
    defesas_externas: { custo: 'Estacas de recife, redes, ganchos e sinal de tempestade.', requisito: 'Oficina de Casco ativa.' },
    nucleo_fushi_controlado: { custo: 'Perola azul-FUSHI, tanque salino e runas contra vazamento.', requisito: 'Cartas Nauticas ativas.' },
    sala_mundi: { custo: 'Mesa de correntes, bussola, mapa costeiro e nucleo salino estabilizado.', requisito: 'Mare FUSHI Selada ativa.' },
  },
  base_montanha_refugio: {
    reforma_inicial: { custo: 'Pedra chata, corda de escalada, lona grossa e abrigo contra vento.', requisito: 'Encontrar patamar estavel nas montanhas.' },
    dormitorio_compartilhado: { custo: 'Esteiras de palha dura, manta termica e divisorias de pedra.', requisito: 'Refugio de Altitude ativo.' },
    agua_e_cozinha: { custo: 'Gelo limpo, chaleira, pedra aquecida e filtro mineral.', requisito: 'Fonte de neve ou pico conhecido.' },
    deposito_de_recursos: { custo: 'Cofre de pedra, pitons, cordas e marcadores de rota.', requisito: 'Refugio de Altitude ativo.' },
    oficina_improvisada: { custo: 'Bigorna fria, talhadeira, pedra plana e sucata de escalada.', requisito: 'Cofre de Pedra ativo.' },
    enfermaria: { custo: 'Ervas de altitude, panos quentes e sala sem corrente de ar.', requisito: 'Neve Derretida ativa.' },
    biblioteca_de_memoria: { custo: 'Pergaminhos secos, carimbo do templo e mapa de vento.', requisito: 'Cofre de Pedra ativo.' },
    sala_de_musica: { custo: 'Sino pequeno, corda tensionada e pedra de ressonancia.', requisito: 'Esteiras de Disciplina ativas.' },
    defesas_externas: { custo: 'Totens, cordas de alerta, pedras empilhadas e ponto de vigia.', requisito: 'Forja Fria ativa.' },
    nucleo_fushi_controlado: { custo: 'Cristal de altitude, circulo de foco e pedra do Vazio Sereno.', requisito: 'Pergaminhos do Vazio ativos.' },
    sala_mundi: { custo: 'Mesa dos picos, bussola de vento e cristais de rota.', requisito: 'Camara do Vazio ativa.' },
  },
  base_floresta_seiva: {
    reforma_inicial: { custo: 'Raiz viva permitida, resina clara, musgo macio e pacto de nao ferir a arvore.', requisito: 'A floresta aceitar a presenca do grupo.' },
    dormitorio_compartilhado: { custo: 'Folhas largas, casulos secos, fibra verde e seiva estabilizada.', requisito: 'Raiz Guardia ativa.' },
    agua_e_cozinha: { custo: 'Orvalho cristalino, folha-filtro, cogumelo manso e recipiente natural.', requisito: 'Lago Espelhado ou fonte verde conhecida.' },
    deposito_de_recursos: { custo: 'Sementes, cestos vivos, resina e fibras de coleta.', requisito: 'Raiz Guardia ativa.' },
    oficina_improvisada: { custo: 'Resina endurecida, espinhos mansos e bancada de raiz.', requisito: 'Ninho de Coleta ativo.' },
    enfermaria: { custo: 'Seiva medicinal, fungo calmante, agua limpa e leito organico.', requisito: 'Orvalho Filtrado ativo.' },
    biblioteca_de_memoria: { custo: 'Cascas marcadas, aneis de arvore e memoria vegetal.', requisito: 'Ninho de Coleta ativo.' },
    sala_de_musica: { custo: 'Folhas sonoras, vento canalizado e pedra de agua.', requisito: 'Casulos de Folha ativos.' },
    defesas_externas: { custo: 'Espinhos vivos, cipós de alarme e ordem de nao matar.', requisito: 'Oficina de Resina ativa.' },
    nucleo_fushi_controlado: { custo: 'Cristais verdes de seiva, esporo anciao e circulo organico.', requisito: 'Aneis da Arvore ativos.' },
    sala_mundi: { custo: 'Mapa de raizes, marcas vivas e nucleo de esporo estabilizado.', requisito: 'Esporo Anciao ativo.' },
  },
  base_vulcao_obsidiana: {
    reforma_inicial: { custo: 'Obsidiana fria, basalto cortado, lona anti-cinza e 1 rota sem lava ativa.', requisito: 'Chegar a um platô que nao colapse.' },
    dormitorio_compartilhado: { custo: 'Cinza fria compactada, manta de couro grosso e respiradouro seguro.', requisito: 'Abrigo de Obsidiana ativo.' },
    agua_e_cozinha: { custo: 'Condensador de vapor, pote ceramico, carvao mineral e filtro de cinza.', requisito: 'Campo de Cinzas conhecido.' },
    deposito_de_recursos: { custo: 'Cofre basaltico, luvas grossas, travas de metal e caixa termica.', requisito: 'Abrigo de Obsidiana ativo.' },
    oficina_improvisada: { custo: 'Forja de cinzas, martelo pesado, pedra refrataria e metal bruto.', requisito: 'Cofre Basaltico ativo.' },
    enfermaria: { custo: 'Unguento contra queimadura, pano umido e sala sem fuligem.', requisito: 'Condensador de Vapor ativo.' },
    biblioteca_de_memoria: { custo: 'Placas de obsidiana gravadas, registros dos Guardioes e mapa de calor.', requisito: 'Cofre Basaltico ativo.' },
    sala_de_musica: { custo: 'Tambor de cinza, pele grossa e pedra ressonante quente.', requisito: 'Leitos de Cinza Fria ativos.' },
    defesas_externas: { custo: 'Muralha basaltica, valeta de cinza e sinal de erupcao.', requisito: 'Forja de Cinzas ativa.' },
    nucleo_fushi_controlado: { custo: 'Cristal rubro-azul de FUSHI, brasa selada e runas de pressao.', requisito: 'Arquivo dos Guardioes ativo.' },
    sala_mundi: { custo: 'Mapa termico, marcadores de risco, cristal selado e registros de guardiao.', requisito: 'Brasa FUSHI Selada ativa.' },
  },
  base_gelo_abrigo: {
    reforma_inicial: { custo: 'Blocos de gelo firme, madeira seca, pele grossa e pedra termica.', requisito: 'Encontrar area fora de avalanche imediata.' },
    dormitorio_compartilhado: { custo: 'Peles, manta dupla, parede isolante e fogueira protegida.', requisito: 'Abrigo Branco ativo.' },
    agua_e_cozinha: { custo: 'Caldeira, gelo limpo, sal mineral e abrigo contra vento.', requisito: 'Lago Congelado ou neve limpa conhecida.' },
    deposito_de_recursos: { custo: 'Despensa fria, trenó, cordas e caixas isoladas.', requisito: 'Abrigo Branco ativo.' },
    oficina_improvisada: { custo: 'Mesa de trenos, laminas, ganchos e couro endurecido.', requisito: 'Despensa Congelada ativa.' },
    enfermaria: { custo: 'Pedra quente, tecido seco, gordura medicinal e maca termica.', requisito: 'Caldeira de Neve ativa.' },
    biblioteca_de_memoria: { custo: 'Mapas brancos, marcas de avalanche e registros sob gelo.', requisito: 'Despensa Congelada ativa.' },
    sala_de_musica: { custo: 'Sino de neve, cristal oco e sala silenciosa.', requisito: 'Dormitorio Termico ativo.' },
    defesas_externas: { custo: 'Muro de gelo, estacas frias, corda de alerta e valeta de neve.', requisito: 'Mesa de Trenos ativa.' },
    nucleo_fushi_controlado: { custo: 'Cristal termico azul, circulo isolante e gelo que nao derrete.', requisito: 'Cartografia Branca ativa.' },
    sala_mundi: { custo: 'Mapa de nevasca, cristal termico e marcadores de avalanche.', requisito: 'Cristal Termico ativo.' },
  },
  base_ruinas_memorial: {
    reforma_inicial: { custo: 'Pedra antiga limpa, selo de contencao, lamparina fria e circulo de silencio.', requisito: 'Encontrar ruina que nao esteja gritando.' },
    dormitorio_compartilhado: { custo: 'Cela seca, manta grossa, selo contra eco e vigia mental.', requisito: 'Selo Memorial ativo.' },
    agua_e_cozinha: { custo: 'Fonte selada, filtro de pedra, vaso antigo e teste de contaminacao.', requisito: 'Ruina Segura ou fonte limpa conhecida.' },
    deposito_de_recursos: { custo: 'Arquivo lacrado, caixas de reliquia e tinta de catalogacao.', requisito: 'Selo Memorial ativo.' },
    oficina_improvisada: { custo: 'Bancada de selos, corrente, chave quebrada e cinzel antigo.', requisito: 'Arquivo de Fragmentos ativo.' },
    enfermaria: { custo: 'Sala muda, tecido limpo, incenso baixo e selo anti-voz.', requisito: 'Fonte Selada ativa.' },
    biblioteca_de_memoria: { custo: 'Prateleiras antigas, registros de Ryoku e fragmentos estabilizados.', requisito: 'Arquivo de Fragmentos ativo.' },
    sala_de_musica: { custo: 'Instrumento grave, sino rachado e ritual de foco.', requisito: 'Cela de Repouso ativa.' },
    defesas_externas: { custo: 'Portoes runicos, marcas de limite e pedras de travamento.', requisito: 'Bancada de Selos ativa.' },
    nucleo_fushi_controlado: { custo: 'Fragmento escuro selado, circulo duplo e chave de contencao.', requisito: 'Biblioteca Morta Viva ativa.' },
    sala_mundi: { custo: 'Mesa dos Ecos, mapa de selos e nucleo contido.', requisito: 'Fragmento Selado ativo.' },
  },
  base_veu_esconderijo: {
    reforma_inicial: { custo: 'Tecido cinza, madeira baixa, entrada falsa e rota sem pegadas.', requisito: 'Encontrar ponto que o Veu nao entregue.' },
    dormitorio_compartilhado: { custo: 'Beliches baixos, cobertas escuras e parede sem sombra externa.', requisito: 'Esconderijo Cinza ativo.' },
    agua_e_cozinha: { custo: 'Fogao sem fumaca, cantil escuro, filtro cinza e comida seca.', requisito: 'Deposito Camuflado ou agua escondida conhecida.' },
    deposito_de_recursos: { custo: 'Cache secreto, caixas falsas, marcadores de fuga e chave escondida.', requisito: 'Esconderijo Cinza ativo.' },
    oficina_improvisada: { custo: 'Bancada de disfarces, roupas neutras, tintas e ferramentas silenciosas.', requisito: 'Cache de Suprimentos ativo.' },
    enfermaria: { custo: 'Sala de extracao, ataduras rapidas e medicamento sem cheiro.', requisito: 'Fogao Sem Fumaca ativo.' },
    biblioteca_de_memoria: { custo: 'Relatorios, perfis de faccao, cifras e mapas de vigilancia.', requisito: 'Cache de Suprimentos ativo.' },
    sala_de_musica: { custo: 'Radio baixo, codigo ritmico e sino abafado.', requisito: 'Beliches Camuflados ativos.' },
    defesas_externas: { custo: 'Fios de alarme, sinos abafados, falsa trilha e ponto cego.', requisito: 'Bancada de Disfarces ativa.' },
    nucleo_fushi_controlado: { custo: 'Cristal cinza-azul, camara fria e barreira contra rastreamento.', requisito: 'Arquivo do Veu ativo.' },
    sala_mundi: { custo: 'Mesa de operacoes, perfis, rotas de fuga e nucleo isolado.', requisito: 'Camara de Contencao ativa.' },
  },
}

const biomeBaseUpgradeOverridesByBaseId: Record<
  string,
  Record<string, BiomeBaseUpgradeOverride>
> = {
  base_planicie_nascente: {
    reforma_inicial: {
      nome: 'Nucleo da Nascente',
      resumo: 'Caverna viva estabilizada como primeiro abrigo da campanha.',
      efeitoMesa: '+1 ponto seguro de descanso na planicie.',
      locationHintId: 'caverna_primeiro_corpo',
    },
    dormitorio_compartilhado: {
      nome: 'Leitos de Folhas',
      resumo: 'Abrigo simples para recuperar corpo e identidade depois das rotas.',
      efeitoMesa: 'Descanso na planicie reduz 1 condicao leve.',
      locationHintId: 'bosque_baixo',
    },
    agua_e_cozinha: {
      nome: 'Riacho Filtrado',
      resumo: 'Agua limpa e fogo controlado perto da vila.',
      efeitoMesa: 'Rotas curtas da planicie ignoram fome/sede.',
      locationHintId: 'riacho_claro',
    },
    deposito_de_recursos: {
      nome: 'Armazem de Campo',
      resumo: 'Caixas para achados da planicie e materiais basicos.',
      efeitoMesa: 'Permite registrar suprimentos comuns da planicie.',
      locationHintId: 'armazem_comunitario',
    },
    oficina_improvisada: {
      nome: 'Bancada de Treino',
      resumo: 'Mesa de reparo ligada ao campo de treino da vila.',
      efeitoMesa: 'Conserta itens Basicos e prepara armadilhas simples.',
      locationHintId: 'campo_treino_vila',
    },
    enfermaria: {
      nome: 'Ervas da Planicie',
      resumo: 'Tratamento com plantas comuns e agua do riacho.',
      efeitoMesa: 'Uma vez por descanso converte ferimento grave em condicao leve.',
      locationHintId: 'bosque_baixo',
    },
    biblioteca_de_memoria: {
      nome: 'Memoria da Vila',
      resumo: 'Relatos e pistas ligados ao Conhecimento Absorvido.',
      efeitoMesa: 'Transforma descoberta local em pista de preparacao.',
      locationHintId: 'vila_conhecimento_absorvido',
    },
    sala_de_musica: {
      nome: 'Fogueira de Vinculo',
      resumo: 'Ponto emocional para processar medo e primeira morte.',
      efeitoMesa: 'Ajuda cenas de Determinacao e vinculo entre fragmentos.',
      locationHintId: 'vila_conhecimento_absorvido',
    },
    defesas_externas: {
      nome: 'Cercas do Bosque',
      resumo: 'Alarmes, trilhas marcadas e vigia contra lobos.',
      efeitoMesa: 'Reduz risco de emboscada no retorno para a caverna.',
      locationHintId: 'clareira_lobos',
    },
    nucleo_fushi_controlado: {
      nome: 'Esporo Contido',
      resumo: 'Camara para estudar FUSHI vivo sem contaminar o abrigo.',
      efeitoMesa: 'Permite estudo seguro de FUSHI inicial.',
      locationHintId: 'coracao_verde',
    },
    sala_mundi: {
      nome: 'Mesa da Planicie',
      resumo: 'Mapa vivo das rotas iniciais, vila e floresta baixa.',
      efeitoMesa: 'Conecta planos da planicie ao MUN e checkpoints.',
      locationHintId: 'vila_conhecimento_absorvido',
    },
  },
  base_praia_ancora: {
    reforma_inicial: { nome: 'Ancoradouro Seguro', resumo: 'Base costeira contra maresia e mar hostil.', efeitoMesa: '+1 retorno seguro em cenas costeiras.', locationHintId: 'embarque_faccao_mare' },
    dormitorio_compartilhado: { nome: 'Redes Secas', resumo: 'Descanso suspenso longe da agua salgada.', efeitoMesa: 'Descanso na praia reduz exaustao de viagem.', locationHintId: 'praia_naufragos' },
    agua_e_cozinha: { nome: 'Dessalinizador Simples', resumo: 'Agua potavel e preparo de peixe.', efeitoMesa: 'Ignora sede em rotas costeiras curtas.', locationHintId: 'enseada_azul' },
    deposito_de_recursos: { nome: 'Baia de Carga', resumo: 'Espaco para cordas, madeira, velas e achados.', efeitoMesa: 'Registra recursos nauticos e salvados.', locationHintId: 'farol_quebrado' },
    oficina_improvisada: { nome: 'Oficina de Casco', resumo: 'Reparo de barco, arpao e ferragens salgadas.', efeitoMesa: 'Conserta itens de navegacao Basicos.', locationHintId: 'embarque_faccao_mare' },
    enfermaria: { nome: 'Posto de Resgate', resumo: 'Macas, salmoura controlada e tratamento de afogamento.', efeitoMesa: 'Reduz penalidade por afogamento ou queda no mar.', locationHintId: 'caverna_mare' },
    biblioteca_de_memoria: { nome: 'Cartas Nauticas', resumo: 'Mapa de correntes, recifes e relatos da Mare Livre.', efeitoMesa: 'Gera pistas de rota maritima e tempestade.', locationHintId: 'alto_mar' },
    sala_de_musica: { nome: 'Canto da Mare', resumo: 'Lugar para acalmar medo do oceano e perdas.', efeitoMesa: 'Ajuda cenas de moral em travessias maritimas.', locationHintId: 'embarque_faccao_mare' },
    defesas_externas: { nome: 'Estacas de Arrecife', resumo: 'Defesas contra criaturas costeiras e saqueadores sem voz.', efeitoMesa: 'Reduz risco de ataque surpresa na costa.', locationHintId: 'recife_cortante' },
    nucleo_fushi_controlado: { nome: 'Mare FUSHI Selada', resumo: 'Tanque para observar FUSHI reagindo com agua salgada.', efeitoMesa: 'Permite rituais menores ligados a mar e recuperacao.', locationHintId: 'caverna_mare' },
    sala_mundi: { nome: 'Mesa das Correntes', resumo: 'Rotas costeiras, mar aberto e retorno seguro.', efeitoMesa: 'Conecta planejamento nautico ao MUN.', locationHintId: 'farol_quebrado' },
  },
  base_montanha_refugio: {
    reforma_inicial: { nome: 'Refugio de Altitude', resumo: 'Abrigo contra vento, pedra solta e queda.', efeitoMesa: '+1 retorno seguro nas montanhas.', locationHintId: 'saida_montanhas' },
    dormitorio_compartilhado: { nome: 'Esteiras de Disciplina', resumo: 'Descanso seco e frio para foco corporal.', efeitoMesa: 'Recupera Determinacao em cena de treino.', locationHintId: 'templo_vazio_sereno' },
    agua_e_cozinha: { nome: 'Neve Derretida', resumo: 'Agua filtrada em pedra e comida seca.', efeitoMesa: 'Ignora sede em rotas de altitude curtas.', locationHintId: 'pico_quatro_ventos' },
    deposito_de_recursos: { nome: 'Cofre de Pedra', resumo: 'Armazem protegido contra vento e queda.', efeitoMesa: 'Registra cordas, pitons e recursos de escalada.', locationHintId: 'ponte_suspensa' },
    oficina_improvisada: { nome: 'Forja Fria', resumo: 'Bancada de pedra para reparar equipamento de montanha.', efeitoMesa: 'Conserta itens de escalada Basicos.', locationHintId: 'arena_natural_pedra' },
    enfermaria: { nome: 'Sala de Respiracao', resumo: 'Tratamento de queda, frio e falta de ar.', efeitoMesa: 'Reduz uma condicao de exaustao por altitude.', locationHintId: 'caverna_meditacao' },
    biblioteca_de_memoria: { nome: 'Pergaminhos do Vazio', resumo: 'Registros de disciplina, rotas e riscos do alto.', efeitoMesa: 'Gera pista de travessia ou prova de foco.', locationHintId: 'templo_vazio_sereno' },
    sala_de_musica: { nome: 'Sino de Equilibrio', resumo: 'Som baixo para foco, luto e meditacao.', efeitoMesa: 'Ajuda cenas de medo, raiva e controle interno.', locationHintId: 'caverna_meditacao' },
    defesas_externas: { nome: 'Totens de Vigia', resumo: 'Pontos de observacao e cordas de alerta.', efeitoMesa: 'Reduz emboscada em penhascos e pontes.', locationHintId: 'pico_quatro_ventos' },
    nucleo_fushi_controlado: { nome: 'Camara do Vazio', resumo: 'Circulo seguro para estudar FUSHI puro.', efeitoMesa: 'Permite ritual menor de foco e resistencia.', locationHintId: 'templo_vazio_sereno' },
    sala_mundi: { nome: 'Mesa dos Picos', resumo: 'Rotas de vento, ponte, templo e descida.', efeitoMesa: 'Conecta planejamento de altitude ao MUN.', locationHintId: 'saida_montanhas' },
  },
  base_floresta_seiva: {
    reforma_inicial: { nome: 'Raiz Guardia', resumo: 'Base viva sem ferir a floresta mistica.', efeitoMesa: '+1 retorno seguro dentro da floresta.', locationHintId: 'coracao_verde' },
    dormitorio_compartilhado: { nome: 'Casulos de Folha', resumo: 'Descanso suspenso e protegido por seiva.', efeitoMesa: 'Reduz medo leve causado por esporos.', locationHintId: 'arvore_bebe' },
    agua_e_cozinha: { nome: 'Orvalho Filtrado', resumo: 'Agua de folha e preparo sem chama agressiva.', efeitoMesa: 'Ignora sede em rotas verdes curtas.', locationHintId: 'lago_espelhado' },
    deposito_de_recursos: { nome: 'Ninho de Coleta', resumo: 'Guarda sementes, fibras, resina e pistas vivas.', efeitoMesa: 'Registra recursos organicos e catalisadores.', locationHintId: 'trilha_enraizada' },
    oficina_improvisada: { nome: 'Oficina de Resina', resumo: 'Cria reparos flexiveis, armadilhas e suporte natural.', efeitoMesa: 'Conserta itens organicos Basicos.', locationHintId: 'clareira_animais' },
    enfermaria: { nome: 'Berco de Seiva', resumo: 'Cura por plantas, esporos mansos e repouso verde.', efeitoMesa: 'Converte ferimento grave em condicao leve em descanso.', locationHintId: 'coracao_verde' },
    biblioteca_de_memoria: { nome: 'Aneis da Arvore', resumo: 'Memoria natural marcada em cascas e raizes.', efeitoMesa: 'Gera pista sobre FUSHI vivo ou rotas ocultas.', locationHintId: 'arvore_fushi_vivo' },
    sala_de_musica: { nome: 'Coro das Folhas', resumo: 'Som de vento, agua e folhas para acalmar FUSHI.', efeitoMesa: 'Ajuda cenas de vinculo e medo da floresta.', locationHintId: 'lago_espelhado' },
    defesas_externas: { nome: 'Cerca de Espinhos', resumo: 'Defesa viva que nao mata sem ordem do mestre.', efeitoMesa: 'Reduz ataque surpresa de animais distorcidos.', locationHintId: 'clareira_animais' },
    nucleo_fushi_controlado: { nome: 'Esporo Anciao', resumo: 'Camara viva para estudar esporos de FUSHI.', efeitoMesa: 'Permite estudo seguro de esporos e Poder Unido.', locationHintId: 'arvore_fushi_vivo' },
    sala_mundi: { nome: 'Mesa das Raizes', resumo: 'Mapa de raizes, laboratorio, lago e coracao verde.', efeitoMesa: 'Conecta rotas vivas ao MUN.', locationHintId: 'coracao_verde' },
  },
  base_vulcao_obsidiana: {
    reforma_inicial: { nome: 'Abrigo de Obsidiana', resumo: 'Base fria dentro de um bioma de cinzas.', efeitoMesa: '+1 retorno seguro no vulcao.', locationHintId: 'vulcao_entrada' },
    dormitorio_compartilhado: { nome: 'Leitos de Cinza Fria', resumo: 'Descanso isolado de calor e fuligem.', efeitoMesa: 'Reduz exaustao leve por calor.', locationHintId: 'campo_cinzas' },
    agua_e_cozinha: { nome: 'Condensador de Vapor', resumo: 'Agua retirada do calor e comida protegida de cinzas.', efeitoMesa: 'Ignora sede em rotas vulcanicas curtas.', locationHintId: 'campo_cinzas' },
    deposito_de_recursos: { nome: 'Cofre Basaltico', resumo: 'Guarda minerais, obsidiana e achados perigosos.', efeitoMesa: 'Registra recursos de calor, pedra e metal.', locationHintId: 'boca_inferno' },
    oficina_improvisada: { nome: 'Forja de Cinzas', resumo: 'Reparo agressivo para armas e armaduras simples.', efeitoMesa: 'Conserta itens Basicos e prepara armas contra calor.', locationHintId: 'vulcao_abandonado' },
    enfermaria: { nome: 'Sala de Queimaduras', resumo: 'Tratamento de calor, fumaca e pele rachada.', efeitoMesa: 'Reduz uma condicao de queimadura leve.', locationHintId: 'rio_da_escuridao' },
    biblioteca_de_memoria: { nome: 'Arquivo dos Guardioes', resumo: 'Registros de selos, bosses e rotas do vulcao.', efeitoMesa: 'Gera pista sobre guardioes e eventos de cataclisma.', locationHintId: 'vulcao_abandonado' },
    sala_de_musica: { nome: 'Tambor de Cinzas', resumo: 'Ritmo grave para medo, raiva e sobrevivencia.', efeitoMesa: 'Ajuda cenas de moral contra pressao extrema.', locationHintId: 'boca_inferno' },
    defesas_externas: { nome: 'Muralha de Basalto', resumo: 'Barreira contra fluxo, criaturas e colapso local.', efeitoMesa: 'Reduz ataque surpresa e dano ambiental inicial.', locationHintId: 'labirinto_quente' },
    nucleo_fushi_controlado: { nome: 'Brasa FUSHI Selada', resumo: 'Camara para conter calor espiritual sem explodir.', efeitoMesa: 'Permite ritual menor contra distorcao vulcanica.', locationHintId: 'transcendente' },
    sala_mundi: { nome: 'Mesa das Cinzas', resumo: 'Rotas de calor, mar inquieto, labirinto e guardioes.', efeitoMesa: 'Conecta risco vulcanico ao MUN.', locationHintId: 'campo_cinzas' },
  },
  base_gelo_abrigo: {
    reforma_inicial: { nome: 'Abrigo Branco', resumo: 'Base termica contra neve, vento e isolamento.', efeitoMesa: '+1 retorno seguro no gelo.', locationHintId: 'vale_branco' },
    dormitorio_compartilhado: { nome: 'Dormitorio Termico', resumo: 'Peles, paredes duplas e fogo protegido.', efeitoMesa: 'Reduz exaustao leve por frio.', locationHintId: 'vale_branco' },
    agua_e_cozinha: { nome: 'Caldeira de Neve', resumo: 'Agua quente e comida preservada.', efeitoMesa: 'Ignora sede/frio em rotas curtas de gelo.', locationHintId: 'lago_congelado' },
    deposito_de_recursos: { nome: 'Despensa Congelada', resumo: 'Guarda comida, cordas e ferramentas de neve.', efeitoMesa: 'Registra recursos de sobrevivencia gelida.', locationHintId: 'bonecos_de_neve' },
    oficina_improvisada: { nome: 'Mesa de Trenos', resumo: 'Reparo de trenos, botas e ganchos.', efeitoMesa: 'Conserta itens Basicos de travessia congelada.', locationHintId: 'grande_avalanche' },
    enfermaria: { nome: 'Tenda de Aquecimento', resumo: 'Tratamento de congelamento e choque termico.', efeitoMesa: 'Reduz uma condicao leve de frio extremo.', locationHintId: 'caverna_azul' },
    biblioteca_de_memoria: { nome: 'Cartografia Branca', resumo: 'Rotas sob neve, marcas de avalanche e sinais ocultos.', efeitoMesa: 'Gera pista de caminho seguro no gelo.', locationHintId: 'santuario_sob_gelo' },
    sala_de_musica: { nome: 'Sino de Neve', resumo: 'Som baixo para manter foco no silencio.', efeitoMesa: 'Ajuda cenas de medo e isolamento.', locationHintId: 'vale_branco' },
    defesas_externas: { nome: 'Muros de Gelo', resumo: 'Barreiras, estacas e alerta contra avalanches.', efeitoMesa: 'Reduz risco de emboscada ou colapso inicial.', locationHintId: 'fortaleza_soterrada' },
    nucleo_fushi_controlado: { nome: 'Cristal Termico', resumo: 'Nucleo que estabiliza frio e FUSHI em equilibrio.', efeitoMesa: 'Permite ritual menor de resistencia ao frio.', locationHintId: 'santuario_sob_gelo' },
    sala_mundi: { nome: 'Mesa da Nevasca', resumo: 'Mapa de neve, fortaleza, lago e avalanche.', efeitoMesa: 'Conecta rotas congeladas ao MUN.', locationHintId: 'vale_branco' },
  },
  base_ruinas_memorial: {
    reforma_inicial: { nome: 'Selo Memorial', resumo: 'Base de contencao contra vozes e memoria instavel.', efeitoMesa: '+1 retorno seguro nas ruinas.', locationHintId: 'torre_abismo' },
    dormitorio_compartilhado: { nome: 'Cela de Repouso', resumo: 'Descanso protegido de sussurros e eco mental.', efeitoMesa: 'Reduz uma condicao leve de medo ou eco.', locationHintId: 'corredor_vozes' },
    agua_e_cozinha: { nome: 'Fonte Selada', resumo: 'Agua limpa protegida de memoria corrompida.', efeitoMesa: 'Ignora sede em rotas curtas de ruinas.', locationHintId: 'ruina_segura' },
    deposito_de_recursos: { nome: 'Arquivo de Fragmentos', resumo: 'Guarda selos, mapas quebrados e reliquias seguras.', efeitoMesa: 'Registra itens de ruina sem contaminar fichas.', locationHintId: 'biblioteca_morta' },
    oficina_improvisada: { nome: 'Bancada de Selos', resumo: 'Reparo de chaves, correntes e marcas antigas.', efeitoMesa: 'Conserta itens Basicos ligados a selos.', locationHintId: 'altar_quebrado' },
    enfermaria: { nome: 'Camara de Silencio', resumo: 'Tratamento de trauma, voz e contaminacao leve.', efeitoMesa: 'Reduz uma condicao mental leve.', locationHintId: 'corredor_vozes' },
    biblioteca_de_memoria: { nome: 'Biblioteca Morta Viva', resumo: 'Registros de Ryoku, vozes e estruturas antigas.', efeitoMesa: 'Gera pista de memoria ou selo antigo.', locationHintId: 'biblioteca_morta' },
    sala_de_musica: { nome: 'Lamento Controlado', resumo: 'Ritual sonoro para nao se perder nas vozes.', efeitoMesa: 'Ajuda cenas de terror e lembranca quebrada.', locationHintId: 'torre_abismo' },
    defesas_externas: { nome: 'Portoes Runicos', resumo: 'Defesas contra forma instavel e memoria agressiva.', efeitoMesa: 'Reduz ataque surpresa nas ruinas.', locationHintId: 'portao_sem_nome' },
    nucleo_fushi_controlado: { nome: 'Fragmento Selado', resumo: 'Camara para estudar FUSHI escuro sem abrir prisao.', efeitoMesa: 'Permite ritual menor de contencao.', locationHintId: 'terras_podres' },
    sala_mundi: { nome: 'Mesa dos Ecos', resumo: 'Rotas de torre, biblioteca, altar e corredor.', efeitoMesa: 'Conecta ruinas e selos ao MUN.', locationHintId: 'torre_abismo' },
  },
  base_veu_esconderijo: {
    reforma_inicial: { nome: 'Esconderijo Cinza', resumo: 'Base discreta para vigia, fuga e inteligencia.', efeitoMesa: '+1 retorno seguro no Veu Cinza.', locationHintId: 'deposito_camuflado' },
    dormitorio_compartilhado: { nome: 'Beliches Camuflados', resumo: 'Descanso oculto sem denunciar a posicao.', efeitoMesa: 'Reduz uma condicao leve de perseguicao.', locationHintId: 'acampamento_veu' },
    agua_e_cozinha: { nome: 'Fogao Sem Fumaca', resumo: 'Preparo sem rastro visivel.', efeitoMesa: 'Ignora fome/sede em rotas furtivas curtas.', locationHintId: 'deposito_camuflado' },
    deposito_de_recursos: { nome: 'Cache de Suprimentos', resumo: 'Estoque escondido para fuga, troca e emergencia.', efeitoMesa: 'Registra recursos secretos e kits de rota.', locationHintId: 'posto_interceptacao' },
    oficina_improvisada: { nome: 'Bancada de Disfarces', resumo: 'Reparo, roupas, marcas falsas e ferramentas discretas.', efeitoMesa: 'Conserta itens Basicos de furtividade.', locationHintId: 'acampamento_veu' },
    enfermaria: { nome: 'Sala de Extracao', resumo: 'Tratamento rapido depois de interceptacao.', efeitoMesa: 'Reduz uma condicao leve apos fuga ou emboscada.', locationHintId: 'posto_interceptacao' },
    biblioteca_de_memoria: { nome: 'Arquivo do Veu', resumo: 'Relatorios, perfis, rotas e sinais de faccao.', efeitoMesa: 'Gera pista de faccao, vigilancia ou rota discreta.', locationHintId: 'torre_observacao' },
    sala_de_musica: { nome: 'Radio Silencioso', resumo: 'Sinais baixos, codigos e ritmo para manter calma.', efeitoMesa: 'Ajuda cenas de pressao e infiltracao.', locationHintId: 'torre_observacao' },
    defesas_externas: { nome: 'Rede de Alarme', resumo: 'Fios, sinos abafados e pontos cegos marcados.', efeitoMesa: 'Reduz ataque surpresa e melhora fuga inicial.', locationHintId: 'trilha_espioes' },
    nucleo_fushi_controlado: { nome: 'Camara de Contencao', resumo: 'Sala fria para estudar fenomenos sem chamar atencao.', efeitoMesa: 'Permite ritual menor de analise e isolamento.', locationHintId: 'ruina_segura' },
    sala_mundi: { nome: 'Mesa de Operacoes', resumo: 'Quadro de rotas, faccoes, alvos e riscos.', efeitoMesa: 'Conecta inteligencia do Veu ao MUN.', locationHintId: 'torre_observacao' },
  },
}

function createDefaultBiomeBases(
  templateUpgrades: WorldMundiBaseUpgrade[],
): WorldMundiBiomeBaseState[] {
  if (!templateUpgrades.length) {
    return []
  }

  return defaultBiomeBaseSeeds.map((seed) => {
    const upgrades = templateUpgrades.map((upgrade) => {
      const nextId = prefixBiomeBaseUpgradeId(seed.id, upgrade.id)
      const layout = getBaseUpgradeWebLayout(seed.id, upgrade.id)
      const override = {
        ...(biomeBaseUpgradeOverridesByBaseId[seed.id]?.[upgrade.id] ?? {}),
        ...(biomeBaseUpgradeRequirementOverridesByBaseId[seed.id]?.[upgrade.id] ?? {}),
      }

      return createWorldMundiBaseUpgrade({
        ...upgrade,
        ...override,
        id: nextId,
        iconKey: layout?.iconKey ?? upgrade.iconKey,
        locationHintId: override.locationHintId ?? seed.locationId,
        x: layout?.x ?? upgrade.x,
        y: layout?.y ?? upgrade.y,
        dependsOnIds: (layout?.dependsOnIds ?? upgrade.dependsOnIds).map((sourceId) =>
          prefixBiomeBaseUpgradeId(seed.id, sourceId),
        ),
        tags: Array.from(new Set([...upgrade.tags, 'base_bioma', seed.id, seed.biomaId])),
      })
    })

    return createWorldMundiBiomeBaseState({
      id: seed.id,
      nome: seed.nome,
      biomaId: seed.biomaId,
      locationId: seed.locationId,
      resumo: seed.resumo,
      buffBioma: seed.buffBioma,
      buffMundo: 'Todas as 8 bases completas: libera buff de mundo e leitura estrategica total do MUN.',
      selectedUpgradeId: upgrades[0]?.id ?? '',
      upgrades,
    })
  })
}

const defaultPlayerBase = createWorldMundiPlayerBaseState({
  releasedToPlayers: false,
  anchorLocationId: 'base_planicie_nascente',
  selectedBaseId: 'base_planicie_nascente',
  upgrades: [
    createWorldMundiBaseUpgrade({
      id: 'reforma_inicial',
      nome: 'Reforma Inicial',
      categoria: 'fundacao',
      resumo: 'Torna a caverna segura o bastante para virar abrigo fixo.',
      efeitoMesa: '+1 ponto seguro de descanso; marca o nucleo inicial da base.',
      custo: 'Madeira, pedra, tecido e 1 cena de organizacao.',
      requisito: 'Grupo reconhecer a Caverna do Primeiro Corpo como abrigo.',
      locationHintId: 'caverna_primeiro_corpo',
      x: 50,
      y: 18,
      status: 'planejado',
      tags: ['base', 'inicio', 'descanso'],
    }),
    createWorldMundiBaseUpgrade({
      id: 'dormitorio_compartilhado',
      nome: 'Dormitorio Compartilhado',
      categoria: 'sobrevivencia',
      resumo: 'Leitos, cobertores e divisao minima de turno de vigia.',
      efeitoMesa: 'Descanso longo reduz 1 condicao leve ou recupera Determinacao individual.',
      custo: 'Peles, fibras, madeira seca.',
      requisito: 'Reforma Inicial ativa.',
      locationHintId: 'bosque_baixo',
      x: 30,
      y: 36,
      dependsOnIds: [],
      tags: ['base', 'descanso'],
    }),
    createWorldMundiBaseUpgrade({
      id: 'agua_e_cozinha',
      nome: 'Agua e Cozinha',
      categoria: 'sobrevivencia',
      resumo: 'Filtro simples, fogo controlado e area de preparo.',
      efeitoMesa: 'Remove penalidade de viagem por fome/sede em rotas curtas.',
      custo: 'Filtro, panela, carvao, acesso ao Riacho Claro.',
      requisito: 'Riacho Claro conhecido ou agua coletada.',
      locationHintId: 'riacho_claro',
      x: 70,
      y: 36,
      dependsOnIds: [],
      tags: ['base', 'recurso'],
    }),
    createWorldMundiBaseUpgrade({
      id: 'deposito_de_recursos',
      nome: 'Deposito de Recursos',
      categoria: 'logistica',
      resumo: 'Caixas, inventario de grupo e area para guardar achados.',
      efeitoMesa: 'Permite registrar itens de campanha sem prender tudo nas fichas.',
      custo: 'Caixotes, prateleiras, lona, marcadores.',
      requisito: 'Armazem Comunitario visitado ou materiais equivalentes.',
      locationHintId: 'armazem_comunitario',
      x: 18,
      y: 54,
      dependsOnIds: [],
      tags: ['base', 'itens'],
    }),
    createWorldMundiBaseUpgrade({
      id: 'oficina_improvisada',
      nome: 'Oficina Improvisada',
      categoria: 'producao',
      resumo: 'Bancada, ferramentas e area para consertar armas simples.',
      efeitoMesa: 'Permite criar/consertar itens Basicos e preparar armadilhas simples.',
      custo: 'Ferramentas, sucata, pedra plana, madeira firme.',
      requisito: 'Deposito de Recursos planejado ou ativo.',
      locationHintId: 'campo_treino_vila',
      x: 39,
      y: 56,
      dependsOnIds: [],
      tags: ['base', 'craft'],
    }),
    createWorldMundiBaseUpgrade({
      id: 'enfermaria',
      nome: 'Enfermaria',
      categoria: 'suporte',
      resumo: 'Maca, ervas, ataduras e espaco para tratar ferimentos.',
      efeitoMesa: 'Uma vez por descanso, converte ferimento grave em condicao leve.',
      custo: 'Ervas da planicie, tecido limpo, agua, luz estavel.',
      requisito: 'Agua e Cozinha ativa.',
      locationHintId: 'bosque_baixo',
      x: 61,
      y: 56,
      dependsOnIds: [],
      tags: ['base', 'cura'],
    }),
    createWorldMundiBaseUpgrade({
      id: 'biblioteca_de_memoria',
      nome: 'Biblioteca de Memoria',
      categoria: 'conhecimento',
      resumo: 'Lugar para guardar relatos, mapas, simbolos e licoes absorvidas.',
      efeitoMesa: 'Permite transformar descobertas em bonus de preparacao e pistas.',
      custo: 'Papel, tinta, fragmentos de memoria, prateleiras.',
      requisito: 'Vila do Conhecimento Absorvido visitada.',
      locationHintId: 'vila_conhecimento_absorvido',
      x: 24,
      y: 74,
      dependsOnIds: [],
      tags: ['base', 'lore'],
    }),
    createWorldMundiBaseUpgrade({
      id: 'sala_de_musica',
      nome: 'Sala de Musica',
      categoria: 'moral',
      resumo: 'Ponto emocional da base para acalmar FUSHI e processar perdas.',
      efeitoMesa: 'Ajuda cenas de recuperacao, medo, trauma e vinculo de consciencias.',
      custo: 'Instrumento, espaco seco, objeto de memoria do grupo.',
      requisito: 'Dormitorio Compartilhado ativo.',
      locationHintId: 'vila_conhecimento_absorvido',
      x: 50,
      y: 76,
      dependsOnIds: [],
      tags: ['base', 'determinacao'],
    }),
    createWorldMundiBaseUpgrade({
      id: 'defesas_externas',
      nome: 'Defesas Externas',
      categoria: 'seguranca',
      resumo: 'Barricadas, alarmes simples e leitura de trilhas ao redor.',
      efeitoMesa: 'Reduz risco de ataque surpresa na base e cria cena de preparacao.',
      custo: 'Estacas, cordas, sinos, espinhos, turnos de vigia.',
      requisito: 'Oficina Improvisada ou Enfermaria ativa.',
      locationHintId: 'clareira_lobos',
      x: 79,
      y: 54,
      dependsOnIds: [],
      tags: ['base', 'defesa'],
    }),
    createWorldMundiBaseUpgrade({
      id: 'nucleo_fushi_controlado',
      nome: 'Nucleo FUSHI Controlado',
      categoria: 'fushi',
      resumo: 'Camara segura para estudar FUSHI sem deixar a base instavel.',
      efeitoMesa: 'Permite rituais de Ascensao pequenos e estudos sem contaminar a base.',
      custo: 'Cristais, circulo de seguranca, 1 descoberta de FUSHI vivo ou puro.',
      requisito: 'Biblioteca de Memoria e Sala de Musica ativas.',
      locationHintId: 'coracao_verde',
      x: 40,
      y: 90,
      dependsOnIds: [],
      tags: ['base', 'fushi', 'ritual'],
    }),
    createWorldMundiBaseUpgrade({
      id: 'sala_mundi',
      nome: 'Sala MUN',
      categoria: 'estrategia',
      resumo: 'Mesa viva de rotas, faccoes, grupos e memoria da ilha.',
      efeitoMesa: 'Conecta BASE ao MUN: planos, relogio, rotas e checkpoints de sessao.',
      custo: 'Mapa da ilha, marcadores, biblioteca ativa, logs de viagem.',
      requisito: 'Nucleo FUSHI Controlado ou Defesas Externas ativas.',
      locationHintId: 'vila_conhecimento_absorvido',
      x: 62,
      y: 90,
      dependsOnIds: [],
      tags: ['base', 'mun', 'planejamento'],
    }),
  ],
})

const defaultSessionTools = normalizeSessionToolsState(undefined)

export const EMPTY_WORLD_MUNDI_STATE: WorldMundiState = {
  version: 1,
  clock: {
    dia: 1,
    hora: 8,
    fase: 0,
  },
  selectedLocationId: 'caverna_primeiro_corpo',
  publicMap: {
    releasedToPlayers: false,
    discoveredLocationIds: ['caverna_primeiro_corpo'],
  },
  playerBase: defaultPlayerBase,
  sessionTools: defaultSessionTools,
  ui: {
    factionOrderIds: [],
  },
  biomes: defaultBiomes,
  locations: defaultLocationsWithSubmapState,
  submaps: defaultSubmaps,
  routes: defaultRoutes,
  players: defaultPlayers,
  consciencias: defaultConsciousnesses,
  corpos: defaultBodies,
  npcs: {},
  entities: defaultEntities,
  parties: defaultParties,
  selectedPartyId: 'party_protagonistas',
  logs: [
    createWorldMundiLogEntry({
      dia: 1,
      hora: 8,
      texto: 'Mapa Mundi iniciado. A ilha esta viva, saudavel e aberta; nenhum caminho e obrigatorio.',
      tone: 'steady',
    }),
  ],
}

const officialLocationIds = new Set(defaultLocations.map((location) => location.id))

const legacyLocationAliases: Record<string, string> = {
  acampamento_movel_veu: 'acampamento_veu',
  cidade_afundada: 'torre_abismo',
  forja_abandonada: 'vulcao_abandonado',
  floresta_pinheiros_negros: 'caverna_azul',
  ponto_19_terras_cinzentas: 'mar_inquieto',
  ponto_20_terras_cinzentas: 'transcendente',
  ponto_21_terras_cinzentas: 'deus_dragao',
  ponto_28_regiao_congelada: 'santuario_sob_gelo',
  ponto_35_ruinas_antigas: 'portao_sem_nome',
  ponto_50_veu_cinza: 'grande_lago',
  ponto_42_floresta_mistica: 'arvore_bebe',
  rio_lava_antiga: 'rio_da_escuridao',
  santuario_primeiro_fluxo: 'pico_quatro_ventos',
  tuneis_quentes: 'labirinto_quente',
  trilha_cacadores: 'clareira_animais',
  trilha_para_vila: 'vila_conhecimento_absorvido',
  vulcao_adormecido: 'campo_cinzas',
}

const legacyLocationIdByOfficialId = Object.entries(legacyLocationAliases).reduce<
  Record<string, string>
>((aliases, [legacyId, officialId]) => {
  aliases[officialId] = legacyId

  return aliases
}, {})

function resolveOfficialLocationId(locationId: string) {
  if (officialLocationIds.has(locationId)) {
    return locationId
  }

  return legacyLocationAliases[locationId] ?? 'caverna_primeiro_corpo'
}

function shouldMigrateToOfficialMundiGeography(state: WorldMundiState) {
  if (state.locations.length === 0) {
    return false
  }

  const officialCount = state.locations.filter((location) =>
    location.tags.includes(OFFICIAL_MUNDI_GEOGRAPHY_TAG),
  ).length
  const existingLocationIds = new Set(state.locations.map((location) => location.id))
  const hasMissingOfficialLocations = defaultLocations.some(
    (location) => !existingLocationIds.has(location.id),
  )
  const hasCurrentRouteRevision = state.routes.some((route) =>
    route.tags.includes(OFFICIAL_MUNDI_ROUTE_REVISION_TAG),
  )
  const hasMissingMapLinks = Array.from(officialMundiMapLinks).some(([locationId, mapId]) => {
    const location = state.locations.find((entry) => entry.id === locationId)

    return location?.mapId !== mapId
  })
  const hasLegacyBaseBiomeRoutes = state.routes.some(isBaseBiomeRoute)

  return (
    officialCount < 55 ||
    state.locations.length < defaultLocations.length ||
    hasMissingOfficialLocations ||
    !hasCurrentRouteRevision ||
    hasMissingMapLinks ||
    hasLegacyBaseBiomeRoutes
  )
}

function isBaseBiomeRoute(route: WorldMundiRoute) {
  return (
    route.origemId.startsWith('base_') ||
    route.destinoId.startsWith('base_') ||
    route.tags.includes('base_bioma')
  )
}

function mergeOfficialLocationState(
  officialLocation: WorldMundiLocation,
  previousLocation?: WorldMundiLocation,
) {
  if (!previousLocation) {
    return officialLocation
  }

  return {
    ...officialLocation,
    mapId: previousLocation.mapId || officialLocation.mapId,
    mapFolderId: previousLocation.mapFolderId || officialLocation.mapFolderId,
    hasMap: previousLocation.hasMap || officialLocation.hasMap,
    mapStatus: previousLocation.hasMap ? previousLocation.mapStatus : officialLocation.mapStatus,
    activeSubmapIds:
      previousLocation.activeSubmapIds.length > 0
        ? previousLocation.activeSubmapIds
        : officialLocation.activeSubmapIds,
    baseOcupada: previousLocation.baseOcupada,
    donoBase: previousLocation.donoBase || officialLocation.donoBase,
    estabilidadeFushi: previousLocation.estabilidadeFushi || officialLocation.estabilidadeFushi,
    distorcao: previousLocation.distorcao || officialLocation.distorcao,
    estadoVisual:
      previousLocation.estadoVisual !== 'normal'
        ? previousLocation.estadoVisual
        : officialLocation.estadoVisual,
  }
}

function mergeOfficialRoutes(previousRoutes: WorldMundiRoute[]) {
  const officialRouteById = new Map(defaultRoutes.map((route) => [route.id, route]))
  const mergedOfficialRoutes = defaultRoutes.map((officialRoute) => {
    const previousRoute = previousRoutes.find((route) => route.id === officialRoute.id)

    if (!previousRoute) {
      return officialRoute
    }

    return createWorldMundiRoute({
      ...officialRoute,
      bloqueada: previousRoute.bloqueada,
      chanceEncontro: previousRoute.chanceEncontro || officialRoute.chanceEncontro,
      encontrosPossiveis:
        previousRoute.encontrosPossiveis.length > 0
          ? previousRoute.encontrosPossiveis
          : officialRoute.encontrosPossiveis,
      eventosPossiveis:
        previousRoute.eventosPossiveis.length > 0
          ? previousRoute.eventosPossiveis
          : officialRoute.eventosPossiveis,
      faccoesUsam:
        previousRoute.faccoesUsam.length > 0
          ? previousRoute.faccoesUsam
          : officialRoute.faccoesUsam,
      requisito: previousRoute.requisito || officialRoute.requisito,
      restricao: previousRoute.restricao || officialRoute.restricao,
      secreta: previousRoute.secreta,
      tags: Array.from(
        new Set([
          ...officialRoute.tags,
          ...previousRoute.tags.filter(
            (tag) =>
              tag !== OFFICIAL_MUNDI_ROUTE_REVISION_TAG &&
              !tag.startsWith('rotas_mun_60_v'),
          ),
        ]),
      ),
      terreno: previousRoute.terreno || officialRoute.terreno,
      visibilidade: previousRoute.visibilidade || officialRoute.visibilidade,
    })
  })
  const customRoutes = previousRoutes.filter(
    (route) => !officialRouteById.has(route.id) && !isBaseBiomeRoute(route),
  )

  return [...mergedOfficialRoutes, ...customRoutes]
}

function migrateStateToOfficialMundiGeography(state: WorldMundiState) {
  if (!shouldMigrateToOfficialMundiGeography(state)) {
    return state
  }

  const previousLocations = new Map(state.locations.map((location) => [location.id, location]))
  const officialLocationIds = new Set(defaultLocations.map((location) => location.id))
  const legacyOfficialLocationIds = new Set(Object.values(legacyLocationIdByOfficialId))
  const nextLocations = defaultLocationsWithSubmapState.map((officialLocation) =>
    mergeOfficialLocationState(
      officialLocation,
      previousLocations.get(officialLocation.id) ??
        previousLocations.get(legacyLocationIdByOfficialId[officialLocation.id]),
    ),
  )
  const customLocations = state.locations.filter(
    (location) =>
      !officialLocationIds.has(location.id) &&
      !legacyOfficialLocationIds.has(location.id),
  )

  return {
    ...state,
    selectedLocationId: resolveOfficialLocationId(state.selectedLocationId),
    publicMap: {
      releasedToPlayers: state.publicMap.releasedToPlayers,
      discoveredLocationIds: normalizeStringArray(state.publicMap.discoveredLocationIds)
        .map(resolveOfficialLocationId),
    },
    locations: [...nextLocations, ...customLocations],
    routes: mergeOfficialRoutes(state.routes),
    npcs: Object.fromEntries(
      Object.values(state.npcs).map((npc) => [
        npc.characterId,
        {
          ...npc,
          localInicialId: resolveOfficialLocationId(npc.localInicialId),
          localAtualId: resolveOfficialLocationId(npc.localAtualId),
          baseId: resolveOfficialLocationId(npc.baseId),
          destinoAtualId: npc.destinoAtualId
            ? resolveOfficialLocationId(npc.destinoAtualId)
            : npc.destinoAtualId,
          viagemOrigemId: npc.viagemOrigemId
            ? resolveOfficialLocationId(npc.viagemOrigemId)
            : npc.viagemOrigemId,
          viagemDestinoId: npc.viagemDestinoId
            ? resolveOfficialLocationId(npc.viagemDestinoId)
            : npc.viagemDestinoId,
        },
      ]),
    ),
    entities: Object.fromEntries(
      Object.values(state.entities).map((entity) => [
        entity.id,
        {
          ...entity,
          localAtualId: resolveOfficialLocationId(entity.localAtualId),
        },
      ]),
    ),
    parties: Object.fromEntries(
      Object.values(state.parties).map((party) => [
        party.id,
        {
          ...party,
          localAtualId: resolveOfficialLocationId(party.localAtualId),
          destinoAtualId: party.destinoAtualId
            ? resolveOfficialLocationId(party.destinoAtualId)
            : party.destinoAtualId,
        },
      ]),
    ),
    corpos: Object.fromEntries(
      Object.values(state.corpos).map((body) => [
        body.id,
        {
          ...body,
          localAtualId: resolveOfficialLocationId(body.localAtualId),
        },
      ]),
    ),
    logs: state.logs.some((log) => log.texto.includes('geografia oficial de 60 pontos'))
      ? state.logs
      : [
          createWorldMundiLogEntry({
            dia: state.clock.dia,
            hora: state.clock.hora,
            texto: 'MUN atualizado para a geografia oficial de 60 pontos e rotas numeradas.',
            categoria: 'sistema',
          }),
          ...state.logs,
        ],
  }
}

function getCanonicalSubmapOnlyActiveIds(
  location: WorldMundiLocation,
  defaultActiveIds: string[],
) {
  const activeWithoutMain = location.activeSubmapIds.filter(
    (submapId) => submapId && submapId !== '__main__',
  )
  const hadLegacyMainMap = LEGACY_SUBMAP_ONLY_LOCATION_MAP_IDS[location.id]?.includes(
    location.mapId,
  )

  if (hadLegacyMainMap) {
    return [
      ...defaultActiveIds,
      ...activeWithoutMain.filter((submapId) => !defaultActiveIds.includes(submapId)),
    ]
  }

  return activeWithoutMain.length > 0 ? activeWithoutMain : defaultActiveIds
}

function repairSubmapOnlyLocationState(state: WorldMundiState): WorldMundiState {
  return {
    ...state,
    locations: state.locations.map((location) => {
      const defaultActiveIds = SUBMAP_ONLY_LOCATION_ACTIVE_DEFAULTS[location.id]
      const canonicalMapId = SUBMAP_ONLY_LOCATION_MAIN_MAP_IDS[location.id]

      if (!defaultActiveIds && canonicalMapId === undefined) {
        return location
      }

      const hadLegacyMainMap = LEGACY_SUBMAP_ONLY_LOCATION_MAP_IDS[location.id]?.includes(
        location.mapId,
      )
      const nextMapId =
        canonicalMapId === undefined
          ? location.mapId
          : hadLegacyMainMap || !location.mapId
            ? canonicalMapId
            : location.mapId
      const nextActiveSubmapIds = defaultActiveIds
        ? getCanonicalSubmapOnlyActiveIds(location, defaultActiveIds)
        : location.activeSubmapIds
      const hasPlayableMap = Boolean(nextMapId) || nextActiveSubmapIds.length > 0

      return createWorldMundiLocation({
        ...location,
        mapId: nextMapId,
        hasMap: Boolean(nextMapId),
        mapStatus: hasPlayableMap
          ? location.mapStatus === 'asset_pendente'
            ? 'pronto'
            : location.mapStatus
          : 'asset_pendente',
        activeSubmapIds: nextActiveSubmapIds,
      })
    }),
  }
}

function repairM5RiachoSubmapPlacement(state: WorldMundiState): WorldMundiState {
  return {
    ...state,
    submaps: state.submaps.map((submap) =>
      submap.id === M5_RIACHO_SUBMAP_ID
        ? createWorldMundiSubmap({
            ...submap,
            parentLocationId: M5_RIACHO_PARENT_LOCATION_ID,
            mapId: M5_RIACHO_MAP_ID,
          })
        : submap,
    ),
    locations: state.locations.map((location) => {
      if (location.id === 'riacho_claro') {
        const activeSubmapIds = location.activeSubmapIds.filter(
          (submapId) => submapId !== M5_RIACHO_SUBMAP_ID,
        )

        if (activeSubmapIds.length === location.activeSubmapIds.length) {
          return location
        }

        return createWorldMundiLocation({
          ...location,
          activeSubmapIds,
        })
      }

      if (location.id !== M5_RIACHO_PARENT_LOCATION_ID) {
        return location
      }

      const activeSubmapIds = Array.from(
        new Set([
          MUNDI_MAIN_SUBMAP_ID,
          M5_RIACHO_SUBMAP_ID,
          ...location.activeSubmapIds.filter((submapId) => Boolean(submapId)),
        ]),
      )

      if (
        activeSubmapIds.length === location.activeSubmapIds.length &&
        activeSubmapIds.every((submapId, index) => submapId === location.activeSubmapIds[index])
      ) {
        return location
      }

      return createWorldMundiLocation({
        ...location,
        activeSubmapIds,
      })
    }),
  }
}

function ensureDefaultProtagonistParty(state: WorldMundiState): WorldMundiState {
  const protagonistParty = state.parties.party_protagonistas

  if (!protagonistParty || protagonistParty.memberPlayerIds.length > 0) {
    return state
  }

  const playerIds = ['player1', 'player2', 'player3', 'player4', 'player5'].filter(
    (playerId) => Boolean(state.players[playerId]),
  )
  const playerAlreadyAssigned = Object.values(state.parties).some((party) =>
    party.id === protagonistParty.id
      ? false
      : party.memberPlayerIds.some((playerId) => playerIds.includes(playerId)),
  )

  if (playerIds.length === 0 || playerAlreadyAssigned) {
    return state
  }

  return {
    ...state,
    parties: {
      ...state.parties,
      party_protagonistas: {
        ...protagonistParty,
        memberPlayerIds: playerIds,
      },
    },
  }
}

function normalizeBiome(value: unknown): WorldMundiBiome | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.nome !== 'string') {
    return null
  }

  return createBiome({
    id: value.id,
    nome: value.nome,
    resumo: normalizeString(value.resumo),
    riscoInicial: normalizeString(value.riscoInicial, 'medio'),
    estabilidadeInicial: clampScale(value.estabilidadeInicial),
    recursos: normalizeStringArray(value.recursos),
    faccoesProvaveis: normalizeStringArray(value.faccoesProvaveis),
    notes: normalizeString(value.notes),
  })
}

function normalizeLocation(value: unknown): WorldMundiLocation | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.nome !== 'string') {
    return null
  }

  const position = isRecord(value.posicao) ? value.posicao : {}
  const officialBasePhase1Thumb = officialMundiBasePhase1ThumbById.get(value.id)

  return createWorldMundiLocation({
    id: value.id,
    nome: value.nome,
    tipo: normalizeLocationType(value.tipo),
    biomaId: normalizeString(value.biomaId, 'planicie_floresta_inicial'),
    nivelDetalhe: normalizeDetailLevel(value.nivelDetalhe),
    imagemLocalUrl: officialBasePhase1Thumb ?? normalizeString(value.imagemLocalUrl),
    previewImageUrl:
      officialBasePhase1Thumb ?? normalizeString(value.previewImageUrl ?? value.imagemLocalUrl),
    previewImageAssetId: normalizeString(value.previewImageAssetId),
    usarImagemDoMapaLocal: value.usarImagemDoMapaLocal === true,
    thumbnailTipo: normalizeString(value.thumbnailTipo),
    mapId: normalizeString(value.mapId),
    mapFolderId: normalizeString(value.mapFolderId),
    hasMap: value.hasMap === true,
    mapStatus: normalizeMapStatus(value.mapStatus),
    activeSubmapIds: normalizeStringArray(value.activeSubmapIds),
    posicao: {
      x: clampPercentage(position.x),
      y: clampPercentage(position.y),
    },
    descricaoInicial: normalizeString(value.descricaoInicial),
    descricaoSutil: normalizeString(value.descricaoSutil),
    descricaoInstavel: normalizeString(value.descricaoInstavel),
    descricaoAlterado: normalizeString(value.descricaoAlterado),
    descricaoDistorcido: normalizeString(value.descricaoDistorcido),
    descricaoCataclismico: normalizeString(value.descricaoCataclismico),
    riscoBase: normalizeString(value.riscoBase, 'medio'),
    riscoAtual: normalizeString(value.riscoAtual, 'medio'),
    estabilidadeFushi: clampScale(value.estabilidadeFushi),
    distorcao: clampScale(value.distorcao),
    estadoVisual: normalizeVisualState(value.estadoVisual),
    faccaoDominante: normalizeString(value.faccaoDominante),
    faccoesPresentes: normalizeStringArray(value.faccoesPresentes),
    npcsPresentes: normalizeStringArray(value.npcsPresentes),
    npcsAtraidos: normalizeStringArray(value.npcsAtraidos),
    recursos: normalizeStringArray(value.recursos),
    corposDisponiveis: normalizeStringArray(value.corposDisponiveis),
    qualidadeMediaCorpos: normalizeString(value.qualidadeMediaCorpos, 'comum'),
    riscoReencarnacao: normalizeString(value.riscoReencarnacao, 'medio'),
    segredos: normalizeString(value.segredos),
    requisitosEntrada: normalizeString(value.requisitosEntrada),
    dtEncontrar: clampNonNegative(value.dtEncontrar, 20),
    basePossivel: value.basePossivel === true,
    baseOcupada: value.baseOcupada === true,
    donoBase: normalizeString(value.donoBase),
    eventosPossiveis: normalizeStringArray(value.eventosPossiveis),
    tags: normalizeStringArray(value.tags),
  })
}

function normalizeSubmap(value: unknown): WorldMundiSubmap | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.parentLocationId !== 'string' ||
    typeof value.mapId !== 'string'
  ) {
    return null
  }

  return createWorldMundiSubmap({
    id: value.id,
    parentLocationId: normalizeString(value.parentLocationId),
    mapId: normalizeString(value.mapId),
    codigo: normalizeString(value.codigo),
    nome: normalizeString(value.nome, value.mapId),
    tipo: normalizeSubmapType(value.tipo),
    descricao: normalizeString(value.descricao),
    ordem: clampNonNegative(value.ordem, 0),
    status: normalizeMapStatus(value.status),
    visibilidade: value.visibilidade === 'ativo_para_jogadores' ? 'ativo_para_jogadores' : 'mestre_apenas',
    tags: normalizeStringArray(value.tags),
  })
}

function normalizeRoute(value: unknown): WorldMundiRoute | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null
  }

  return createWorldMundiRoute({
    id: value.id,
    origemId: normalizeString(value.origemId),
    destinoId: normalizeString(value.destinoId),
    tipo: normalizeRouteType(value.tipo),
    distanciaHoras: clampDuration(value.distanciaHoras, 1),
    tempoPlayersHoras: clampDuration(
      value.tempoPlayersHoras ?? value.distanciaHoras,
      1,
    ),
    tempoNpcHoras: clampDuration(
      value.tempoNpcHoras,
      clampDuration(value.tempoPlayersHoras ?? value.distanciaHoras, 1) * 2,
    ),
    terreno: normalizeString(value.terreno, 'trilha'),
    risco: normalizeString(value.risco, 'medio'),
    visibilidade: normalizeString(value.visibilidade, 'normal'),
    restricao: normalizeString(value.restricao),
    requisito: normalizeString(value.requisito),
    dtEncontrar: clampNonNegative(value.dtEncontrar, 20),
    faccoesUsam: normalizeStringArray(value.faccoesUsam),
    chanceEncontro: normalizeString(value.chanceEncontro, 'media'),
    encontrosPossiveis: normalizeStringArray(value.encontrosPossiveis),
    eventosPossiveis: normalizeStringArray(value.eventosPossiveis),
    bloqueada: value.bloqueada === true,
    secreta: value.secreta === true,
    tags: normalizeStringArray(value.tags),
  })
}

function normalizeNpcState(value: unknown): WorldMundiNpcState | null {
  if (!isRecord(value) || typeof value.characterId !== 'string') {
    return null
  }

  return createWorldMundiNpcState({
    characterId: value.characterId,
    estadoSimulacao: normalizeSimulationState(value.estadoSimulacao),
    statusEntrada: normalizeEntryStatus(value.statusEntrada),
    diaChegada: clampNonNegative(value.diaChegada, 1),
    condicaoChegada: normalizeString(value.condicaoChegada),
    presencaNoMapa: normalizePresence(value.presencaNoMapa),
    localInicialId: normalizeString(value.localInicialId),
    baseId: normalizeString(value.baseId),
    localAtualId: normalizeString(value.localAtualId),
    submapAtualId: normalizeString(value.submapAtualId),
    destinoAtualId: normalizeString(value.destinoAtualId),
    objetivoMacro: normalizeString(value.objetivoMacro),
    objetivoAtual: normalizeString(value.objetivoAtual),
    intencaoAtual: normalizeIntention(value.intencaoAtual),
    locaisConhecidosIds: normalizeStringArray(value.locaisConhecidosIds),
    biomasPreferidosIds: normalizeStringArray(value.biomasPreferidosIds),
    biomasEvitadosIds: normalizeStringArray(value.biomasEvitadosIds),
    agressividade: clampScale(value.agressividade, 2),
    cautela: clampScale(value.cautela, 3),
    curiosidade: clampScale(value.curiosidade, 3),
    riscoAceito: clampScale(value.riscoAceito, 2),
    lealdadeFaccao: clampScale(value.lealdadeFaccao, 3),
    chanceViajar: clampScale(value.chanceViajar, 2),
    chanceInvestigar: clampScale(value.chanceInvestigar, 3),
    chanceDescansar: clampScale(value.chanceDescansar, 2),
    chanceProcurarCombate: clampScale(value.chanceProcurarCombate, 1),
    chanceFugir: clampScale(value.chanceFugir, 2),
    tagsInteresse: normalizeStringArray(value.tagsInteresse),
    tagsAmeaca: normalizeStringArray(value.tagsAmeaca),
    estadoFisico: normalizeString(value.estadoFisico, 'inteiro'),
    estadoMental: normalizeString(value.estadoMental, 'estavel'),
    contextoNarrativo: normalizeString(value.contextoNarrativo),
    comportamentoResumo: normalizeString(value.comportamentoResumo),
    tendencias: normalizeStringArray(value.tendencias),
    memoriaSimulacao: normalizeNpcMemory(value.memoriaSimulacao),
    emViagem: value.emViagem === true,
    viagemOrigemId: normalizeString(value.viagemOrigemId),
    viagemDestinoId: normalizeString(value.viagemDestinoId),
    viagemTempoRestante: clampDuration(value.viagemTempoRestante),
    viagemMotivo: normalizeString(value.viagemMotivo),
    ultimoLog: normalizeString(value.ultimoLog),
  })
}

function normalizeParty(value: unknown): WorldMundiParty | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null
  }

  return createWorldMundiParty({
    id: value.id,
    nome: normalizeString(value.nome, 'Party'),
    tipo: normalizePartyType(value.tipo),
    memberPlayerIds: normalizeStringArray(value.memberPlayerIds),
    memberCharacterIds: normalizeStringArray(value.memberCharacterIds),
    memberEntityIds: normalizeStringArray(value.memberEntityIds),
    leaderId: normalizeString(value.leaderId),
    localAtualId: normalizeString(value.localAtualId, 'caverna_primeiro_corpo'),
    submapAtualId: normalizeString(value.submapAtualId),
    destinoAtualId: normalizeString(value.destinoAtualId),
    acaoPlanejada: normalizeString(value.acaoPlanejada),
    tempoPlanejadoHoras: clampDuration(value.tempoPlanejadoHoras),
    estado: normalizePartyState(value.estado),
    contextoAtual: normalizeString(value.contextoAtual),
    tempoJuntosHoras: clampDuration(value.tempoJuntosHoras),
    motivoFormacao: normalizeString(value.motivoFormacao),
    condicaoSeparacao: normalizeString(value.condicaoSeparacao),
    ultimoLog: normalizeString(value.ultimoLog),
  })
}

function normalizeEntity(value: unknown): WorldMundiEntity | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null
  }

  return createWorldMundiEntity({
    id: value.id,
    nome: normalizeString(value.nome, 'Entidade do mundo'),
    tipo: normalizeEntityType(value.tipo),
    localAtualId: normalizeString(value.localAtualId),
    submapAtualId: normalizeString(value.submapAtualId),
    rotaAtualId: normalizeString(value.rotaAtualId),
    comportamento: normalizeString(value.comportamento),
    hostilidade: normalizeString(value.hostilidade, 'variavel'),
    risco: normalizeString(value.risco, 'medio'),
    quantidade: clampNonNegative(value.quantidade, 1),
    estado: normalizeEntityState(value.estado),
    tags: normalizeStringArray(value.tags),
    ultimoLog: normalizeString(value.ultimoLog),
  })
}

function normalizePlayer(value: unknown): WorldMundiPlayer | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null
  }

  return createWorldMundiPlayer({
    id: value.id,
    nome: normalizeString(value.nome, value.id),
    conscienciaId: normalizeString(value.conscienciaId, `consciencia_${value.id}`),
  })
}

function normalizeConsciousness(value: unknown): WorldMundiConsciousness | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null
  }

  return createWorldMundiConsciousness({
    id: value.id,
    nome: normalizeString(value.nome, value.id),
    jogadorId: normalizeString(value.jogadorId),
    corpoAtualId: normalizeString(value.corpoAtualId, 'corpo_compartilhado'),
    grupoAtualId: normalizeString(value.grupoAtualId, 'party_protagonistas'),
  })
}

function normalizeBody(value: unknown): WorldMundiBody | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null
  }

  return createWorldMundiBody({
    id: value.id,
    nome: normalizeString(value.nome, 'Corpo'),
    tipo: normalizeBodyType(value.tipo),
    localAtualId: normalizeString(value.localAtualId, 'caverna_primeiro_corpo'),
    submapAtualId: normalizeString(value.submapAtualId),
    ocupadoPorConsciencia: value.ocupadoPorConsciencia === true,
    conscienciaControladoraId: normalizeString(value.conscienciaControladoraId),
    jogadorControladorId: normalizeString(value.jogadorControladorId),
    jogadoresControladoresIds: Array.isArray(value.jogadoresControladoresIds)
      ? value.jogadoresControladoresIds.filter(
          (playerId): playerId is string => typeof playerId === 'string' && Boolean(playerId),
        )
      : undefined,
    npcOriginalId: normalizeString(value.npcOriginalId),
    estadoDaConscienciaOriginal: normalizeOriginalConsciousnessState(
      value.estadoDaConscienciaOriginal,
    ),
  })
}

function normalizeLogEntry(value: unknown): WorldMundiLogEntry | null {
  if (!isRecord(value) || typeof value.texto !== 'string') {
    return null
  }

  const tone =
    value.tone === 'watch' || value.tone === 'critical' || value.tone === 'steady'
      ? value.tone
      : 'steady'
  const categoria =
    value.categoria === 'players' ||
    value.categoria === 'npcs' ||
    value.categoria === 'mundo' ||
    value.categoria === 'combate' ||
    value.categoria === 'fushi' ||
    value.categoria === 'sistema'
      ? value.categoria
      : 'mundo'
  const canal = value.canal === 'tecnico' ? 'tecnico' : 'mestre'

  return createWorldMundiLogEntry({
    id: normalizeString(value.id, buildId('world-log')),
    createdAt: normalizeString(value.createdAt, new Date().toISOString()),
    dia: clampNonNegative(value.dia, 1),
    hora: clampClockHour(value.hora),
    texto: value.texto,
    tecnico: normalizeString(value.tecnico),
    categoria,
    canal,
    tone,
  })
}

function mergeDefaultSubmaps(
  submaps: WorldMundiSubmap[],
  options: { hasLocations: boolean; useDefaults: boolean },
) {
  if (submaps.length === 0 && !options.useDefaults && !options.hasLocations) {
    return []
  }

  const submapById = new Map(defaultSubmaps.map((submap) => [submap.id, cloneValue(submap)]))
  submaps.forEach((submap) => {
    const officialSubmap = submapById.get(submap.id)

    submapById.set(
      submap.id,
      officialSubmap
        ? {
            ...officialSubmap,
            ...submap,
            codigo: officialSubmap.codigo,
            mapId: officialSubmap.mapId,
            parentLocationId: officialSubmap.parentLocationId,
          }
        : submap,
    )
  })

  return Array.from(submapById.values()).sort((a, b) => {
    if (a.parentLocationId !== b.parentLocationId) {
      return a.parentLocationId.localeCompare(b.parentLocationId)
    }

    return a.ordem - b.ordem || a.nome.localeCompare(b.nome)
  })
}

interface CreateWorldMundiStateOptions {
  useDefaults?: boolean
}

export function createWorldMundiState(
  input?: Partial<WorldMundiState>,
  options: CreateWorldMundiStateOptions = {},
): WorldMundiState {
  const useDefaults = options.useDefaults ?? true
  const biomes = Array.isArray(input?.biomes)
    ? input.biomes.map(normalizeBiome).filter((biome): biome is WorldMundiBiome => biome !== null)
    : []
  const locations = Array.isArray(input?.locations)
    ? input.locations
        .map(normalizeLocation)
        .filter((location): location is WorldMundiLocation => location !== null)
    : []
  const submaps = Array.isArray(input?.submaps)
    ? input.submaps
        .map(normalizeSubmap)
        .filter((submap): submap is WorldMundiSubmap => submap !== null)
    : []
  const routes = Array.isArray(input?.routes)
    ? input.routes.map(normalizeRoute).filter((route): route is WorldMundiRoute => route !== null)
    : []
  const playerEntries = isRecord(input?.players)
    ? Object.values(input.players)
        .map(normalizePlayer)
        .filter((player): player is WorldMundiPlayer => player !== null)
    : []
  const consciousnessEntries = isRecord(input?.consciencias)
    ? Object.values(input.consciencias)
        .map(normalizeConsciousness)
        .filter(
          (consciencia): consciencia is WorldMundiConsciousness => consciencia !== null,
        )
    : []
  const bodyEntries = isRecord(input?.corpos)
    ? Object.values(input.corpos)
        .map(normalizeBody)
        .filter((body): body is WorldMundiBody => body !== null)
    : []
  const npcEntries = isRecord(input?.npcs)
    ? Object.values(input.npcs)
        .map(normalizeNpcState)
        .filter((npc): npc is WorldMundiNpcState => npc !== null)
    : []
  const entityEntries = isRecord(input?.entities)
    ? Object.values(input.entities)
        .map(normalizeEntity)
        .filter((entity): entity is WorldMundiEntity => entity !== null)
    : []
  const partyEntries = isRecord(input?.parties)
    ? Object.values(input.parties)
        .map(normalizeParty)
        .filter((party): party is WorldMundiParty => party !== null)
    : []
  const logs = Array.isArray(input?.logs)
    ? input.logs.map(normalizeLogEntry).filter((log): log is WorldMundiLogEntry => log !== null)
    : []
  const clockInput: Record<string, unknown> = isRecord(input?.clock) ? input.clock : {}

  const normalizedState: WorldMundiState = {
    version: 1,
    clock: {
      dia: clampNonNegative(clockInput.dia, 1),
      hora: clampClockHour(clockInput.hora, 8),
      fase: clampNonNegative(clockInput.fase, 0),
    },
    selectedLocationId:
      typeof input?.selectedLocationId === 'string'
        ? input.selectedLocationId
        : useDefaults
          ? EMPTY_WORLD_MUNDI_STATE.selectedLocationId
          : '',
    publicMap: normalizePublicMapState(
      input?.publicMap ?? (useDefaults ? EMPTY_WORLD_MUNDI_STATE.publicMap : undefined),
    ),
    playerBase: normalizePlayerBaseState(
      input?.playerBase ?? (useDefaults ? EMPTY_WORLD_MUNDI_STATE.playerBase : undefined),
    ),
    sessionTools: normalizeSessionToolsState(
      input?.sessionTools ?? (useDefaults ? EMPTY_WORLD_MUNDI_STATE.sessionTools : undefined),
    ),
    ui: {
      factionOrderIds: isRecord(input?.ui)
        ? normalizeStringArray(input.ui.factionOrderIds)
        : useDefaults
          ? cloneValue(EMPTY_WORLD_MUNDI_STATE.ui.factionOrderIds)
          : [],
    },
    biomes: biomes.length > 0 ? biomes : useDefaults ? cloneValue(defaultBiomes) : [],
    locations:
      locations.length > 0
        ? locations
        : useDefaults
          ? cloneValue(defaultLocationsWithSubmapState)
          : [],
    submaps: mergeDefaultSubmaps(submaps, {
      hasLocations: locations.length > 0,
      useDefaults,
    }),
    routes: routes.length > 0 ? routes : useDefaults ? cloneValue(defaultRoutes) : [],
    players:
      playerEntries.length > 0
        ? Object.fromEntries(playerEntries.map((player) => [player.id, player]))
        : useDefaults
          ? cloneValue(defaultPlayers)
          : {},
    consciencias:
      consciousnessEntries.length > 0
        ? Object.fromEntries(
            consciousnessEntries.map((consciencia) => [consciencia.id, consciencia]),
          )
        : useDefaults
          ? cloneValue(defaultConsciousnesses)
          : {},
    corpos:
      bodyEntries.length > 0
        ? Object.fromEntries(bodyEntries.map((body) => [body.id, body]))
        : useDefaults
          ? cloneValue(defaultBodies)
          : {},
    npcs: Object.fromEntries(npcEntries.map((npc) => [npc.characterId, npc])),
    entities:
      entityEntries.length > 0
        ? Object.fromEntries(entityEntries.map((entity) => [entity.id, entity]))
        : useDefaults
          ? cloneValue(defaultEntities)
          : {},
    parties:
      partyEntries.length > 0
        ? Object.fromEntries(partyEntries.map((party) => [party.id, party]))
        : useDefaults
          ? cloneValue(defaultParties)
          : {},
    selectedPartyId:
      typeof input?.selectedPartyId === 'string'
        ? input.selectedPartyId
        : useDefaults
          ? 'party_protagonistas'
          : '',
    logs: logs.length > 0 ? logs : useDefaults ? cloneValue(EMPTY_WORLD_MUNDI_STATE.logs) : [],
  }

  return ensureDefaultProtagonistParty(
    repairM5RiachoSubmapPlacement(
      repairSubmapOnlyLocationState(migrateStateToOfficialMundiGeography(normalizedState)),
    ),
  )
}

export function createBlankWorldMundiState(): WorldMundiState {
  return createWorldMundiState(
    {
      selectedLocationId: '',
      biomes: [],
      ui: {
        factionOrderIds: [],
      },
      locations: [],
      routes: [],
      players: {},
      consciencias: {},
      corpos: {},
      npcs: {},
      entities: {},
      parties: {},
      selectedPartyId: '',
      logs: [],
    },
    { useDefaults: false },
  )
}

export function readPersistedWorldMundiState(campaignId?: string): WorldMundiState {
  try {
    const parsedValue = storageAdapter.loadMundiState(campaignId)

    if (!parsedValue) {
      return cloneValue(EMPTY_WORLD_MUNDI_STATE)
    }

    if (!isRecord(parsedValue) || parsedValue.version !== 1) {
      return cloneValue(EMPTY_WORLD_MUNDI_STATE)
    }

    return createWorldMundiState(parsedValue, { useDefaults: false })
  } catch {
    return cloneValue(EMPTY_WORLD_MUNDI_STATE)
  }
}

export function writePersistedWorldMundiState(
  state: WorldMundiState,
  campaignId?: string,
) {
  try {
    storageAdapter.saveMundiState(
      campaignId,
      createWorldMundiState(state, { useDefaults: false }),
    )
  } catch {
    return
  }
}
