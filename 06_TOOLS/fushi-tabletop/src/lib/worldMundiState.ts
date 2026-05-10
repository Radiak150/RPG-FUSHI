import type { CharacterSheet } from '../data/types'

export type WorldMundiLocationType =
  | 'ponto_importante'
  | 'subponto'
  | 'dungeon_visivel'
  | 'dungeon_escondida'
  | 'dungeon_condicional'
  | 'base_faccao'
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
  ocupadoPorConsciencia: boolean
  conscienciaControladoraId: string
  jogadorControladorId: string
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

export interface WorldMundiState {
  version: 1
  clock: WorldMundiClock
  selectedLocationId: string
  biomes: WorldMundiBiome[]
  locations: WorldMundiLocation[]
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

function shouldFallbackToLegacyStorage(campaignId?: string) {
  const normalizedCampaignId = normalizeCampaignStorageId(campaignId)

  return !campaignId || normalizedCampaignId === DEFAULT_WORLD_MUNDI_CAMPAIGN_ID
}

export const WORLD_MUNDI_LOCATION_TYPES: WorldMundiLocationType[] = [
  'ponto_importante',
  'subponto',
  'dungeon_visivel',
  'dungeon_escondida',
  'dungeon_condicional',
  'base_faccao',
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

  return Math.max(0, Math.round(nextValue * 2) / 2)
}

function clampClockHour(value: unknown, fallback = 0) {
  const nextValue = typeof value === 'number' && Number.isFinite(value) ? value : fallback

  return Math.max(0, Math.min(23.5, Math.round(nextValue * 2) / 2))
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

function normalizeNpcMemory(value: unknown): WorldMundiNpcMemory {
  const record = isRecord(value) ? value : {}

  return {
    conheceuPlayers: record.conheceuPlayers === true,
    interesseNosPlayers: clampScale(record.interesseNosPlayers),
    afinidadeComPlayers: Math.max(
      -5,
      Math.min(
        5,
        Math.round(
          typeof record.afinidadeComPlayers === 'number'
            ? record.afinidadeComPlayers
            : 0,
        ),
      ),
    ),
    rivalidadeComPlayers: clampScale(record.rivalidadeComPlayers),
    ameacaPercebidaPlayers: clampScale(record.ameacaPercebidaPlayers),
    confiancaNosPlayers: clampScale(record.confiancaNosPlayers),
    querEncontrarPlayersNovamente: record.querEncontrarPlayersNovamente === true,
    querEvitarPlayers: record.querEvitarPlayers === true,
    promessaAtiva: normalizeString(record.promessaAtiva),
    dividaAtiva: normalizeString(record.dividaAtiva),
    conflitoPendente: normalizeString(record.conflitoPendente),
    segredoCompartilhado: normalizeString(record.segredoCompartilhado),
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
    dtEncontrar: clampNonNegative(input.dtEncontrar, 10),
    basePossivel: input.basePossivel ?? false,
    baseOcupada: input.baseOcupada ?? false,
    donoBase: input.donoBase ?? '',
    eventosPossiveis: normalizeStringArray(input.eventosPossiveis),
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
    dtEncontrar: clampNonNegative(input.dtEncontrar, 10),
    faccoesUsam: normalizeStringArray(input.faccoesUsam),
    chanceEncontro: input.chanceEncontro ?? 'media',
    encontrosPossiveis: normalizeStringArray(input.encontrosPossiveis),
    eventosPossiveis: normalizeStringArray(input.eventosPossiveis),
    bloqueada: input.bloqueada === true,
    secreta: input.secreta === true,
    tags: normalizeStringArray(input.tags),
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
    ocupadoPorConsciencia: input.ocupadoPorConsciencia === true,
    conscienciaControladoraId: input.conscienciaControladoraId ?? '',
    jogadorControladorId: input.jogadorControladorId ?? '',
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

const defaultLocations: WorldMundiLocation[] = [
  createWorldMundiLocation({
    id: 'caverna_primeiro_corpo',
    nome: 'Caverna do Primeiro Corpo',
    biomaId: 'planicie_floresta_inicial',
    tipo: 'ponto_importante',
    nivelDetalhe: 'detalhado',
    posicao: { x: 18, y: 55 },
    descricaoInicial: 'Caverna natural escura onde as consciencias despertam no mesmo corpo.',
    riscoBase: 'medio',
    riscoAtual: 'medio',
    corposDisponiveis: ['animais pequenos'],
    qualidadeMediaCorpos: 'fraco',
    riscoReencarnacao: 'medio',
    dtEncontrar: 0,
    eventosPossiveis: ['despertar dos protagonistas', 'eco de FUSHI sutil'],
    tags: ['spawn_players', 'corpo_compartilhado', 'fushi_sutil'],
  }),
  createWorldMundiLocation({
    id: 'clareira_lobos',
    nome: 'Clareira dos Lobos',
    biomaId: 'planicie_floresta_inicial',
    tipo: 'evento',
    nivelDetalhe: 'detalhado',
    posicao: { x: 24, y: 49 },
    descricaoInicial: 'Clareira natural com grama alta, rastros de caca e tensao animal.',
    riscoBase: 'baixo/medio',
    riscoAtual: 'baixo/medio',
    corposDisponiveis: ['lobos', 'animais comuns'],
    qualidadeMediaCorpos: 'fraco',
    riscoReencarnacao: 'medio',
    dtEncontrar: 8,
    eventosPossiveis: ['encontro com lobos', 'fuga para trilha', 'rastro de sangue'],
    tags: ['tutorial_opcional', 'animais', 'combate'],
  }),
  createWorldMundiLocation({
    id: 'trilha_para_vila',
    nome: 'Trilha para a Vila',
    biomaId: 'planicie_floresta_inicial',
    tipo: 'subponto',
    nivelDetalhe: 'detalhado',
    posicao: { x: 33, y: 45 },
    descricaoInicial: 'Trilha simples que liga a mata baixa aos primeiros sinais humanos.',
    riscoBase: 'baixo',
    riscoAtual: 'baixo',
    corposDisponiveis: ['viajantes raros', 'animais comuns'],
    qualidadeMediaCorpos: 'comum',
    riscoReencarnacao: 'baixo/medio',
    dtEncontrar: 8,
    eventosPossiveis: ['rastro humano', 'carroca quebrada', 'rumor distante'],
    tags: ['rota', 'vila', 'exploracao_inicial'],
  }),
  createWorldMundiLocation({
    id: 'vila_conhecimento_absorvido',
    nome: 'Vila do Conhecimento Absorvido',
    biomaId: 'planicie_floresta_inicial',
    tipo: 'vila',
    nivelDetalhe: 'detalhado',
    posicao: { x: 43, y: 43 },
    descricaoInicial: 'Vila funcional, viva e assustada por lendas locais, mas sem catastrofe.',
    riscoBase: 'baixo',
    riscoAtual: 'baixo',
    faccaoDominante: 'vila_local',
    recursos: ['comida', 'tecido', 'ferramentas', 'informacao'],
    corposDisponiveis: ['humanos comuns', 'guardas', 'trabalhadores'],
    qualidadeMediaCorpos: 'comum',
    riscoReencarnacao: 'baixo/medio',
    basePossivel: true,
    dtEncontrar: 6,
    eventosPossiveis: ['treino inicial', 'rumores da ilha', 'primeiros recursos'],
    tags: ['hub_opcional', 'social', 'treino', 'base_tutorial'],
  }),
  createWorldMundiLocation({
    id: 'campo_treino_vila',
    nome: 'Campo de Treino da Vila',
    biomaId: 'planicie_floresta_inicial',
    tipo: 'recurso',
    nivelDetalhe: 'detalhado',
    posicao: { x: 48, y: 46 },
    descricaoInicial: 'Campo simples para treino de guarda, caca e controle corporal.',
    riscoBase: 'baixo',
    riscoAtual: 'baixo',
    recursos: ['treino', 'equipamento simples'],
    corposDisponiveis: ['aprendizes', 'guardas'],
    qualidadeMediaCorpos: 'treinado',
    riscoReencarnacao: 'baixo',
    dtEncontrar: 6,
    eventosPossiveis: ['treino fisico', 'teste de pericia', 'orientacao de combate'],
    tags: ['treino', 'evolucao_inicial', 'opcional'],
  }),
  createWorldMundiLocation({
    id: 'armazem_comunitario',
    nome: 'Armazem Comunitario',
    biomaId: 'planicie_floresta_inicial',
    tipo: 'recurso',
    nivelDetalhe: 'detalhado',
    posicao: { x: 51, y: 40 },
    descricaoInicial: 'Deposito de ferramentas, alimentos e materiais simples da vila.',
    riscoBase: 'baixo',
    riscoAtual: 'baixo',
    recursos: ['madeira', 'comida', 'tecido', 'corda'],
    corposDisponiveis: ['trabalhadores'],
    qualidadeMediaCorpos: 'comum',
    riscoReencarnacao: 'baixo',
    dtEncontrar: 6,
    eventosPossiveis: ['coleta de recursos', 'pedido de ajuda', 'negociacao'],
    tags: ['recursos', 'construcao', 'base'],
  }),
  createWorldMundiLocation({
    id: 'bosque_baixo',
    nome: 'Bosque Baixo',
    biomaId: 'planicie_floresta_inicial',
    tipo: 'descanso',
    nivelDetalhe: 'detalhado',
    posicao: { x: 31, y: 61 },
    descricaoInicial: 'Trecho baixo de floresta com madeira, ervas e caca leve.',
    riscoBase: 'baixo/medio',
    riscoAtual: 'baixo/medio',
    recursos: ['madeira', 'ervas', 'comida', 'couro'],
    corposDisponiveis: ['animais comuns', 'cacadores ocasionais'],
    qualidadeMediaCorpos: 'fraco/comum',
    riscoReencarnacao: 'medio',
    basePossivel: true,
    dtEncontrar: 10,
    eventosPossiveis: ['caca', 'coleta', 'acampamento improvisado'],
    tags: ['coleta', 'caca', 'base_possivel'],
  }),
  createWorldMundiLocation({
    id: 'riacho_claro',
    nome: 'Riacho Claro',
    biomaId: 'planicie_floresta_inicial',
    tipo: 'descanso',
    nivelDetalhe: 'detalhado',
    posicao: { x: 39, y: 59 },
    descricaoInicial: 'Agua limpa, vegetacao baixa e seguranca relativa para descanso curto.',
    riscoBase: 'baixo',
    riscoAtual: 'baixo',
    recursos: ['agua', 'ervas', 'peixes pequenos'],
    corposDisponiveis: ['animais pequenos'],
    qualidadeMediaCorpos: 'fraco',
    riscoReencarnacao: 'baixo/medio',
    basePossivel: true,
    dtEncontrar: 9,
    eventosPossiveis: ['descanso', 'cura leve', 'rastro na margem'],
    tags: ['agua', 'descanso', 'seguro'],
  }),
  ...[
    ['praia_naufragos', 'Praia dos Naufragos', 'praia_litoral_oceano', 18, 80],
    ['enseada_azul', 'Enseada Azul', 'praia_litoral_oceano', 30, 84],
    ['recife_cortante', 'Recife Cortante', 'praia_litoral_oceano', 42, 88],
    ['farol_quebrado', 'Farol Quebrado', 'praia_litoral_oceano', 52, 78],
    ['caverna_mare', 'Caverna da Mare', 'praia_litoral_oceano', 62, 84],
    ['costa_ossos', 'Costa dos Ossos', 'praia_litoral_oceano', 74, 78],
    ['templo_vazio_sereno', 'Templo do Vazio Sereno', 'montanhas_vazio_sereno', 62, 25],
    ['pico_quatro_ventos', 'Pico dos Quatro Ventos', 'montanhas_vazio_sereno', 70, 18],
    ['ponte_suspensa', 'Ponte Suspensa', 'montanhas_vazio_sereno', 58, 32],
    ['caverna_meditacao', 'Caverna de Meditacao', 'montanhas_vazio_sereno', 67, 36],
    ['arena_natural_pedra', 'Arena Natural de Pedra', 'montanhas_vazio_sereno', 76, 31],
    ['santuario_primeiro_fluxo', 'Santuario do Primeiro Fluxo', 'montanhas_vazio_sereno', 82, 22],
    ['coracao_verde', 'Coracao Verde', 'floresta_mistica', 21, 24],
    ['laboratorio_abandonado', 'Laboratorio Abandonado', 'floresta_mistica', 28, 31],
    ['clareira_animais', 'Clareira dos Animais', 'floresta_mistica', 17, 34],
    ['arvore_fushi_vivo', 'Arvore de FUSHI Vivo', 'floresta_mistica', 35, 27],
    ['trilha_cacadores', 'Trilha dos Cacadores', 'floresta_mistica', 39, 34],
    ['lago_espelhado', 'Lago Espelhado', 'floresta_mistica', 28, 40],
    ['vulcao_adormecido', 'Vulcao Adormecido', 'vulcao_terras_cinzentas', 82, 55],
    ['campo_cinzas', 'Campo de Cinzas', 'vulcao_terras_cinzentas', 73, 59],
    ['rio_lava_antiga', 'Rio de Lava Antiga', 'vulcao_terras_cinzentas', 88, 63],
    ['forja_abandonada', 'Forja Abandonada', 'vulcao_terras_cinzentas', 77, 68],
    ['tuneis_quentes', 'Tuneis Quentes', 'vulcao_terras_cinzentas', 91, 70],
    ['boca_inferno', 'Boca do Inferno', 'vulcao_terras_cinzentas', 86, 48],
    ['vale_branco', 'Vale Branco', 'regiao_congelada_neve', 45, 15],
    ['lago_congelado', 'Lago Congelado', 'regiao_congelada_neve', 51, 12],
    ['fortaleza_soterrada', 'Fortaleza Soterrada', 'regiao_congelada_neve', 57, 9],
    ['floresta_pinheiros_negros', 'Floresta de Pinheiros Negros', 'regiao_congelada_neve', 43, 8],
    ['caverna_azul', 'Caverna Azul', 'regiao_congelada_neve', 62, 15],
    ['santuario_sob_gelo', 'Santuario Sob o Gelo', 'regiao_congelada_neve', 54, 20],
    ['camara_primeiro_selo', 'Camara do Primeiro Selo', 'ruinas_antigas', 56, 57],
    ['corredor_vozes', 'Corredor das Vozes', 'ruinas_antigas', 61, 61],
    ['altar_quebrado', 'Altar Quebrado', 'ruinas_antigas', 52, 65],
    ['cidade_afundada', 'Cidade Afundada', 'ruinas_antigas', 47, 70],
    ['biblioteca_morta', 'Biblioteca Morta', 'ruinas_antigas', 60, 70],
    ['portao_sem_nome', 'Portao Sem Nome', 'ruinas_antigas', 66, 66],
    ['acampamento_movel_veu', 'Acampamento Movel do Veu', 'vale_cinzento_veu', 35, 70],
    ['torre_observacao', 'Torre de Observacao', 'vale_cinzento_veu', 41, 72],
    ['ruina_segura', 'Ruina Segura', 'vale_cinzento_veu', 31, 75],
    ['deposito_camuflado', 'Deposito Camuflado', 'vale_cinzento_veu', 27, 70],
    ['trilha_espioes', 'Trilha dos Espioes', 'vale_cinzento_veu', 45, 76],
    ['posto_interceptacao', 'Posto de Interceptacao', 'vale_cinzento_veu', 38, 80],
  ].map(([id, nome, biomaId, x, y]) =>
    createWorldMundiLocation({
      id: String(id),
      nome: String(nome),
      biomaId: String(biomaId),
      tipo: String(id).includes('caverna') || String(id).includes('portao')
        ? 'dungeon_condicional'
        : String(id).includes('templo') || String(id).includes('acampamento')
          ? 'base_faccao'
          : 'ponto_importante',
      nivelDetalhe: 'slot_planejado',
      posicao: { x: Number(x), y: Number(y) },
      descricaoInicial: 'Slot planejado para detalhamento durante a campanha.',
      riscoBase: String(biomaId).includes('vulcao') || String(biomaId).includes('ruinas')
        ? 'alto'
        : 'medio',
      riscoAtual: String(biomaId).includes('vulcao') || String(biomaId).includes('ruinas')
        ? 'alto'
        : 'medio',
      estabilidadeFushi: String(biomaId).includes('ruinas') ? 2 : 0,
      distorcao: String(biomaId).includes('ruinas') ? 1 : 0,
      dtEncontrar: 12,
      eventosPossiveis: getSeedLocationEvents(String(id), String(biomaId)),
      tags: getSeedLocationTags(String(id), String(biomaId)),
    }),
  ),
]

const defaultRoutes: WorldMundiRoute[] = [
  createWorldMundiRoute({
    id: 'rota_caverna_clareira',
    origemId: 'caverna_primeiro_corpo',
    destinoId: 'clareira_lobos',
    tempoPlayersHoras: 1,
    terreno: 'caverna e mata baixa',
    risco: 'baixo/medio',
    visibilidade: 'facil',
    dtEncontrar: 6,
    encontrosPossiveis: ['lobos na clareira', 'rastros de caca'],
    eventosPossiveis: ['primeiro contato com perigo local'],
    tags: ['inicial', 'opcional'],
  }),
  createWorldMundiRoute({
    id: 'rota_clareira_trilha_vila',
    origemId: 'clareira_lobos',
    destinoId: 'trilha_para_vila',
    tempoPlayersHoras: 1,
    terreno: 'trilha leve',
    risco: 'baixo',
    visibilidade: 'facil',
    dtEncontrar: 8,
    encontrosPossiveis: ['rastros humanos', 'animais pequenos'],
    tags: ['inicial', 'vila'],
  }),
  createWorldMundiRoute({
    id: 'rota_trilha_vila',
    origemId: 'trilha_para_vila',
    destinoId: 'vila_conhecimento_absorvido',
    tempoPlayersHoras: 1,
    terreno: 'planicie',
    risco: 'baixo',
    visibilidade: 'facil',
    dtEncontrar: 6,
    eventosPossiveis: ['avistar a vila', 'encontro social leve'],
    tags: ['inicial', 'hub_opcional'],
  }),
  createWorldMundiRoute({
    id: 'rota_vila_praia',
    origemId: 'vila_conhecimento_absorvido',
    destinoId: 'praia_naufragos',
    tempoPlayersHoras: 4,
    terreno: 'planicie para litoral',
    risco: 'medio',
    visibilidade: 'normal',
    dtEncontrar: 10,
    encontrosPossiveis: ['viajantes', 'animais de planicie'],
    tags: ['exploracao_aberta'],
  }),
  createWorldMundiRoute({
    id: 'rota_bosque_floresta_mistica',
    origemId: 'bosque_baixo',
    destinoId: 'coracao_verde',
    tempoPlayersHoras: 6,
    terreno: 'floresta densa',
    risco: 'medio',
    visibilidade: 'normal',
    dtEncontrar: 12,
    encontrosPossiveis: ['cacadores', 'rastro de Aureon', 'animal hostil'],
    tags: ['natureza', 'exploracao_aberta'],
  }),
  createWorldMundiRoute({
    id: 'rota_vila_montanhas',
    origemId: 'vila_conhecimento_absorvido',
    destinoId: 'ponte_suspensa',
    tempoPlayersHoras: 8,
    terreno: 'subida rochosa',
    risco: 'medio/alto',
    visibilidade: 'normal',
    dtEncontrar: 12,
    encontrosPossiveis: ['peregrinos', 'queda de pedra', 'patrulha monge'],
    tags: ['montanha'],
  }),
  createWorldMundiRoute({
    id: 'rota_montanha_neve',
    origemId: 'pico_quatro_ventos',
    destinoId: 'vale_branco',
    tempoPlayersHoras: 10,
    terreno: 'passagem fria',
    risco: 'alto',
    visibilidade: 'dificil',
    dtEncontrar: 15,
    encontrosPossiveis: ['frio extremo', 'criatura da neve'],
    tags: ['frio', 'alto_risco'],
  }),
  createWorldMundiRoute({
    id: 'rota_veu_ruinas',
    origemId: 'trilha_espioes',
    destinoId: 'biblioteca_morta',
    tempoPlayersHoras: 7,
    terreno: 'rota secreta',
    risco: 'alto',
    visibilidade: 'secreta',
    dtEncontrar: 16,
    restricao: 'precisa encontrar marcas do Veu ou seguir alguem',
    requisito: 'marcas do Veu ou seguir alguem',
    secreta: true,
    tipo: 'rota_oculta',
    encontrosPossiveis: ['observador do Veu', 'armadilha de vigilancia'],
    tags: ['secreta', 'ruinas'],
  }),
]

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

export const EMPTY_WORLD_MUNDI_STATE: WorldMundiState = {
  version: 1,
  clock: {
    dia: 1,
    hora: 8,
    fase: 0,
  },
  selectedLocationId: 'caverna_primeiro_corpo',
  biomes: defaultBiomes,
  locations: defaultLocations,
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

  return createWorldMundiLocation({
    id: value.id,
    nome: value.nome,
    tipo: normalizeLocationType(value.tipo),
    biomaId: normalizeString(value.biomaId, 'planicie_floresta_inicial'),
    nivelDetalhe: normalizeDetailLevel(value.nivelDetalhe),
    imagemLocalUrl: normalizeString(value.imagemLocalUrl),
    previewImageUrl: normalizeString(value.previewImageUrl ?? value.imagemLocalUrl),
    previewImageAssetId: normalizeString(value.previewImageAssetId),
    usarImagemDoMapaLocal: value.usarImagemDoMapaLocal === true,
    thumbnailTipo: normalizeString(value.thumbnailTipo),
    mapId: normalizeString(value.mapId),
    mapFolderId: normalizeString(value.mapFolderId),
    hasMap: value.hasMap === true,
    mapStatus: normalizeMapStatus(value.mapStatus),
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
    dtEncontrar: clampNonNegative(value.dtEncontrar, 10),
    basePossivel: value.basePossivel === true,
    baseOcupada: value.baseOcupada === true,
    donoBase: normalizeString(value.donoBase),
    eventosPossiveis: normalizeStringArray(value.eventosPossiveis),
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
    dtEncontrar: clampNonNegative(value.dtEncontrar, 10),
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
    ocupadoPorConsciencia: value.ocupadoPorConsciencia === true,
    conscienciaControladoraId: normalizeString(value.conscienciaControladoraId),
    jogadorControladorId: normalizeString(value.jogadorControladorId),
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

  return {
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
    biomes: biomes.length > 0 ? biomes : useDefaults ? cloneValue(defaultBiomes) : [],
    locations:
      locations.length > 0 ? locations : useDefaults ? cloneValue(defaultLocations) : [],
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
}

export function createBlankWorldMundiState(): WorldMundiState {
  return createWorldMundiState(
    {
      selectedLocationId: '',
      biomes: [],
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
    const campaignKey = getPersistedWorldMundiStorageKey(campaignId)
    const rawValue =
      window.localStorage.getItem(campaignKey) ??
      (shouldFallbackToLegacyStorage(campaignId)
        ? window.localStorage.getItem(TABLETOP_WORLD_MUNDI_STORAGE_KEY)
        : null)

    if (!rawValue) {
      return cloneValue(EMPTY_WORLD_MUNDI_STATE)
    }

    const parsedValue = JSON.parse(rawValue) as unknown

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
    window.localStorage.setItem(
      getPersistedWorldMundiStorageKey(campaignId),
      JSON.stringify(createWorldMundiState(state, { useDefaults: false })),
    )
  } catch {
    return
  }
}
