import { useMemo, useState, type CSSProperties, type JSX } from 'react'
import type { CharacterSheet, FactionItem, TabletopMap } from '../../data/types'
import { useEffect } from 'react'
import type { DragEvent } from 'react'
import { getFactionLogoUrl } from '../../lib/factionAssets'
import { uploadPhysicalAsset } from '../../lib/physicalAssets'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'
import {
  createWorldMundiBody,
  createWorldMundiConsciousness,
  createWorldMundiEntity,
  createWorldMundiLocation,
  createWorldMundiLogEntry,
  createWorldMundiNpcState,
  createWorldMundiParty,
  createWorldMundiRoute,
  createWorldMundiState,
  WORLD_MUNDI_DETAIL_LEVELS,
  WORLD_MUNDI_ENTRY_STATUSES,
  WORLD_MUNDI_INTENTIONS,
  WORLD_MUNDI_LOCATION_TYPES,
  WORLD_MUNDI_ORIGINAL_CONSCIOUSNESS_STATES,
  WORLD_MUNDI_PRESENCES,
  WORLD_MUNDI_ROUTE_TYPES,
  WORLD_MUNDI_SIMULATION_STATES,
  WORLD_MUNDI_VISUAL_STATES,
  type WorldMundiBody,
  type WorldMundiBaseUpgrade,
  type WorldMundiBaseUpgradeStatus,
  type WorldMundiBiome,
  type WorldMundiBiomeBaseState,
  type WorldMundiClock,
  type WorldMundiEntity,
  type WorldMundiLocation,
  type WorldMundiNpcActorRelation,
  type WorldMundiNpcState,
  type WorldMundiParty,
  type WorldMundiRoute,
  type WorldMundiState,
  type WorldMundiSubmap,
} from '../../lib/worldMundiState'
import {
  appendWorldSimulationEvent,
  buildWorldSimulationContextSnapshot,
  buildWorldSimulationSessionSummary,
  createWorldSimulationEvent,
  getWorldSimulationReviewQueue,
  isRealNpcCharacter,
  readWorldSimulationEvents,
  seedCanonicalNpcWorld,
  updateWorldSimulationEventCanonStatus,
  validateNpcSimulationReadiness,
  writeWorldSimulationEvents,
  type NpcSimulationReadiness,
  type WorldSimulationCanonStatus,
  type WorldSimulationEvent,
  type WorldSimulationSessionSummary,
} from '../../lib/worldSimulation'

export interface WorldMundiMapPlaceholderRequest {
  biomaId: string
  biomeFolderId: string
  biomeFolderName: string
  folderId: string
  locationId: string
  locationName: string
  mapId: string
  mapName: string
  parentFolderId: string
  rootFolderId: string
  rootFolderName: string
  summary: string
  thumbnailTipo: string
  type: WorldMundiLocation['tipo']
}

interface TabletopWorldMundiPanelProps {
  campaignId?: string
  characters: CharacterSheet[]
  factions?: FactionItem[]
  maps?: TabletopMap[]
  mapPreviewById?: Record<string, string>
  state: WorldMundiState
  onChange: (nextState: WorldMundiState) => void
  onEnsureMapPlaceholders?: (requests: WorldMundiMapPlaceholderRequest[]) => void
  onLinkMapToLocation?: (mapId: string, locationId: string) => void
  onOpenMap?: (mapId: string) => void
  onPrepareMap?: (mapId: string) => void
  onShowTransition?: (transitionId: string) => void
}

type WorldMundiTab =
  | 'mestre'
  | 'geral'
  | 'base'
  | 'waves'
  | 'xp'
  | 'personagens'
  | 'historia'
  | 'ia'
  | 'canon'
  | 'relogio'
  | 'logs'
  | 'editor'
  | 'ajuda'
  | 'rotas'
  | 'npcs'
type WorldMundiEditorSection = 'locais' | 'npcs' | 'rotas' | 'npc-ia'
type TravelMode = 'players' | 'npc'
type MovementMode = 'quick' | 'planning'
type MundiView = 'world' | 'biome' | 'locationHub' | 'eventHub'
type WorldLogView = 'mestre' | 'tecnico'
type WorldLogFilter = 'todos' | 'players' | 'npcs' | 'mundo' | 'combate' | 'fushi' | 'sistema'

const SIMULATION_RELATION_ACTORS = [
  { id: 'gm', label: 'M' },
  { id: 'player1', label: 'J1' },
  { id: 'player2', label: 'J2' },
  { id: 'player3', label: 'J3' },
  { id: 'player4', label: 'J4' },
  { id: 'player5', label: 'J5' },
]

const MAIN_SUBMAP_KEY = '__main__'
const CLOCK_STEP_HOURS = 1 / 6
const NPC_SIMULATION_TURN_HOURS = 6
const NPC_AUTONOMOUS_TIME_RATIO = 0.5
const SUBMAP_ONLY_LOCATION_IDS = new Set([
  'torre_abismo',
  'estruturas_ruinas_abandonadas',
  'vulcao_abandonado',
  'boca_inferno',
  'mar_inquieto',
])
const DEFAULT_ACTIVE_SUBMAP_BY_LOCATION_ID: Record<string, string[]> = {
  torre_abismo: ['m30_s1_portao_torre_abismo'],
  estruturas_ruinas_abandonadas: ['m33_s1_entrada_estruturas'],
  vulcao_abandonado: ['m16_s1_sala_estatuas_xadrez'],
  boca_inferno: ['m18_s1_escadaria_vulcao_erupcao'],
  mar_inquieto: ['m19_s1_costa_preparacao_navio'],
}
const PARTY_DRAG_DATA_TYPE = 'application/x-fushi-mundi-party'
const DEFAULT_OLLAMA_CONFIG: MundiAiProviderConfig = {
  endpoint: 'http://127.0.0.1:11434',
  model: 'llama3.1:8b',
  provider: 'ollama',
  temperature: 0.2,
  timeoutMs: 90000,
}

interface MundiEventScenario {
  effects: string[]
  id: string
  maps: string[]
  name: string
  status: string
  summary: string
}

const MUNDI_EVENT_SCENARIOS: MundiEventScenario[] = [
  {
    id: 'cataclisma_dragao',
    name: 'EVENTO CATACLISMA DRAGAO',
    status: 'MUNv2 planejado',
    summary:
      'Camada global do Dragao FUSHI: nucleo rompido, manifestacoes pela ilha e rotas instaveis.',
    effects: [
      'Olho no Vulcao',
      'Garra nas Cinzas',
      'Escama no Litoral',
      'Coracao na Floresta',
      'Sombra no Veu',
      'Cauda no Oceano',
      'Mandibula nas Ruinas',
    ],
    maps: [
      'M14-S1/S2 nucleo rachado/desperto',
      'M21 MUNv2 Dragao',
      'Arena final forma humana',
    ],
  },
  {
    id: 'cataclisma_ryoku',
    name: 'EVENTO CATACLISMA RYOKU',
    status: 'MUNv2 planejado',
    summary:
      'Camada global de Ryoku: prisao rompida, fragmentos reagindo e ruinas contaminando rotas.',
    effects: [
      'Torre despertando',
      'Correntes quebradas',
      'Vozes nas rotas',
      'Formas instaveis atravessando biomas',
    ],
    maps: [
      'M30-S4 torre despertando',
      'Ruinas alteradas',
      'Rotas com fragmentos ativos',
    ],
  },
  {
    id: 'cataclisma_seraph',
    name: 'EVENTO CATACLISMA SERAPH',
    status: 'oculto / mestre apenas',
    summary:
      'Gatilho oculto ligado a traicao, ruptura de controle ou descoberta tardia. A IA pode registrar como risco de mestre, mas Seraph nao trata isso como conhecimento proprio enquanto nao viver ou descobrir o fato em Canon.',
    effects: [
      'Gatilho nao alimenta memoria interna de Seraph por padrao',
      'Usar apenas como evento mestre ate ser revelado',
      'Se revelado em Canon, converter para memoria subjetiva do NPC',
    ],
    maps: ['Portao Sem Nome', 'Rotas de FUSHI Escuro', 'Evento cataclisma aprovado pelo mestre'],
  },
  {
    id: 'destruicao_arvore',
    name: 'EVENTO DESTRUICAO ARVORE',
    status: 'MUNv2 planejado',
    summary:
      'Camada global da Arvore: vida vegetal entra em colapso e a Floresta Mistica muda o status das rotas.',
    effects: [
      'Coracao Verde ferido',
      'Raizes bloqueando caminhos',
      'Animais e FUSHI vivo em panico',
      'Rotas para Veu/Praia/Planicie instaveis',
    ],
    maps: [
      'M37/M38 variantes destruidas',
      'Trilhas enraizadas em colapso',
      'MUNv2 Arvore',
    ],
  },
]

export interface GeneralMundiPoint {
  biomaId: string
  biomaNome?: string
  current?: boolean
  discovered?: boolean
  id: string
  image?: string
  nome: string
  presenceCount?: number
  presenceNames?: string[]
  posicao: {
    x: number
    y: number
  }
}

interface TravelPlan {
  destinationId: string
  destinationName: string
  freePosition?: { x: number; y: number }
  isFreeMovement?: boolean
  originId: string
  originName: string
  risk: string
  routeIds: string[]
  routeNames: string[]
  timeHours: number
}

interface SelectableWorldMember {
  avatarUrl?: string
  id: string
  label: string
  kind: 'player' | 'npc' | 'entity'
  meta?: string
}

interface WorldPresenceMember {
  avatarUrl?: string
  id: string
  label: string
  kind: 'party' | 'player' | 'npc' | 'entity'
  meta?: string
}

interface NpcReleaseDraft {
  afinidade: number
  ameaca: number
  characterId: string
  confianca: number
  interesse: number
  novoEstado: WorldMundiNpcState['estadoSimulacao']
  partyId: string
  resumo: string
  rivalidade: number
}

interface NpcJoinDraft {
  characterId: string
  contexto: string
  estado: WorldMundiNpcState['estadoSimulacao']
  partyId: string
}

interface SessionNpcDraft {
  afinidadeDelta: number
  ameacaDelta: number
  confiancaDelta: number
  contexto: string
  eventoChave: string
  medoAtual: string
  objetivoAtual: string
  promessaOuConflito: string
}

interface ContactUndoSnapshot {
  ignoredContactIds: string[]
  sessionContactIds: string[]
}

interface ReincarnationDraft {
  bodyName: string
  bodyType: WorldMundiBody['tipo']
  estadoOriginal: WorldMundiBody['estadoDaConscienciaOriginal']
  locationId: string
  npcOriginalId: string
  playerId: string
}

interface TimePlanEntry {
  action: 'travel' | 'stay'
  destinationId: string
  destinationName: string
  destinationSubmapId?: string
  destinationSubmapName?: string
  freeTimeHours: number
  newLocation?: WorldMundiLocation
  originId: string
  originName: string
  partyId: string
  partyName: string
  risk: string
  routeIds: string[]
  routeNames: string[]
  timeHours: number
}

interface PartyVisualEntry {
  party: WorldMundiParty
  plannedEntry: TimePlanEntry | undefined
  realLocation: WorldMundiLocation
  visualLocation: WorldMundiLocation
}

interface SimulationSuggestion {
  action: 'move' | 'stay' | 'traveling' | 'paused'
  actionText: string
  characterId: string
  fromId: string
  fromName: string
  intention: WorldMundiNpcState['intencaoAtual']
  motivation: string
  nextTrend: string
  remainingHours?: number
  risk: string
  routeNames: string[]
  timeUsed: number
  toId: string
  toName: string
}

interface MundiAiProviderConfig {
  endpoint: string
  model: string
  provider: 'ollama'
  temperature: number
  timeoutMs: number
}

interface OllamaSimulationWireSuggestion {
  action?: unknown
  actionText?: unknown
  characterId?: unknown
  intention?: unknown
  motivation?: unknown
  nextTrend?: unknown
  remainingHours?: unknown
  risk?: unknown
  routeNames?: unknown
  timeUsed?: unknown
  toId?: unknown
}

const BIOME_COLORS = [
  '#7caf88',
  '#62a7c5',
  '#c6a15f',
  '#72b083',
  '#c47b54',
  '#9db8d8',
  '#9b7ac0',
  '#8f9ca5',
]

const PARTY_COLORS = ['#92c0b6', '#e0a84f', '#a98be0', '#d9777b', '#7eb2d6', '#b0c975']

const MUNDI_BASE_MAP_ASSET = '/assets/mundi/mun_base_ilha_sem_labels.png'
const MUNDI_BIOME_THUMB_BY_ID: Record<string, string> = {
  floresta_mistica: '/assets/mundi/biomes/thumb_bioma_floresta_mistica.png',
  montanhas_vazio_sereno: '/assets/mundi/biomes/thumb_bioma_montanhas_vazio_sereno.png',
  planicie_floresta_inicial: '/assets/mundi/biomes/thumb_bioma_planicie_floresta_inicial.png',
  praia_litoral_oceano: '/assets/mundi/biomes/thumb_bioma_praia_litoral_oceano.png',
  regiao_congelada_neve: '/assets/mundi/biomes/thumb_bioma_regiao_congelada_neve.png',
  ruinas_antigas: '/assets/mundi/biomes/thumb_bioma_ruinas_antigas.png',
  vale_cinzento_veu: '/assets/mundi/biomes/thumb_bioma_vale_cinzento_veu.png',
  vulcao_terras_cinzentas: '/assets/mundi/biomes/thumb_bioma_vulcao_terras_cinzentas.png',
}

const BASE_BIOME_BACKDROP_BY_ID: Record<string, string> = {
  floresta_mistica: '/assets/biomes/8-biomas-ultra/floresta_mistica/cinematic_floresta_mistica_ultra.jpg',
  montanhas_vazio_sereno:
    '/assets/biomes/8-biomas-ultra/montanhas_vazio_sereno/cinematic_montanhas_vazio_sereno_ultra.jpg',
  planicie_floresta_inicial:
    '/assets/biomes/8-biomas-ultra/planicie_floresta_inicial/cinematic_planicie_floresta_inicial_ultra.jpg',
  praia_litoral_oceano:
    '/assets/biomes/8-biomas-ultra/praia_litoral_oceano/cinematic_praia_litoral_oceano_ultra.jpg',
  regiao_congelada_neve:
    '/assets/biomes/8-biomas-ultra/regiao_congelada_neve/cinematic_regiao_congelada_neve_ultra.jpg',
  ruinas_antigas: '/assets/biomes/8-biomas-ultra/ruinas_antigas/cinematic_ruinas_antigas_ultra.jpg',
  vale_cinzento_veu:
    '/assets/biomes/8-biomas-ultra/vale_cinzento_veu/cinematic_vale_cinzento_veu_ultra.jpg',
  vulcao_terras_cinzentas:
    '/assets/biomes/8-biomas-ultra/vulcao_terras_cinzentas/cinematic_vulcao_terras_cinzentas_ultra.jpg',
}

const BASE_BIOME_ACCENT_BY_ID: Record<string, string> = {
  floresta_mistica: '#94d96a',
  montanhas_vazio_sereno: '#e7dfcf',
  planicie_floresta_inicial: '#d9b75d',
  praia_litoral_oceano: '#78d1d8',
  regiao_congelada_neve: '#a7d8ff',
  ruinas_antigas: '#b987ff',
  vale_cinzento_veu: '#d0a37c',
  vulcao_terras_cinzentas: '#ff7048',
}

const BASE_UPGRADE_PHASE1_THUMB_BY_ID: Record<string, string> = {
  base_floresta_seiva:
    '/assets/maps/base-upgrades/base_floresta_seiva/base_floresta_seiva_fase1_construcao_topdown_thumb_640.jpg',
  base_gelo_abrigo:
    '/assets/maps/base-upgrades/base_gelo_abrigo/base_gelo_abrigo_fase1_construcao_topdown_thumb_640.jpg',
  base_montanha_refugio:
    '/assets/maps/base-upgrades/base_montanha_refugio/base_montanha_refugio_fase1_construcao_topdown_thumb_640.jpg',
  base_planicie_nascente:
    '/assets/maps/base-upgrades/base_planicie_nascente/base_planicie_nascente_fase1_construcao_topdown_thumb_640.jpg',
  base_praia_ancora:
    '/assets/maps/base-upgrades/base_praia_ancora/base_praia_ancora_fase1_construcao_topdown_thumb_640.jpg',
  base_ruinas_memorial:
    '/assets/maps/base-upgrades/base_ruinas_memorial/base_ruinas_memorial_fase1_construcao_topdown_thumb_640.jpg',
  base_veu_esconderijo:
    '/assets/maps/base-upgrades/base_veu_esconderijo/base_veu_esconderijo_fase1_construcao_topdown_thumb_640.jpg',
  base_vulcao_obsidiana:
    '/assets/maps/base-upgrades/base_vulcao_obsidiana/base_vulcao_obsidiana_fase1_construcao_topdown_thumb_640.jpg',
}

const BASE_UPGRADE_WEB_BY_BASE_ID: Record<string, string> = {
  base_floresta_seiva:
    '/assets/_optimized/ui/base/upgrade-webs/base_floresta_seiva_upgrade_web.webp',
  base_gelo_abrigo:
    '/assets/_optimized/ui/base/upgrade-webs/base_gelo_abrigo_upgrade_web.webp',
  base_montanha_refugio:
    '/assets/_optimized/ui/base/upgrade-webs/base_montanha_refugio_upgrade_web.webp',
  base_planicie_nascente:
    '/assets/_optimized/ui/base/upgrade-webs/base_planicie_nascente_upgrade_web.webp',
  base_praia_ancora:
    '/assets/_optimized/ui/base/upgrade-webs/base_praia_ancora_upgrade_web.webp',
  base_ruinas_memorial:
    '/assets/_optimized/ui/base/upgrade-webs/base_ruinas_memorial_upgrade_web.webp',
  base_veu_esconderijo:
    '/assets/_optimized/ui/base/upgrade-webs/base_veu_esconderijo_upgrade_web.webp',
  base_vulcao_obsidiana:
    '/assets/_optimized/ui/base/upgrade-webs/base_vulcao_obsidiana_upgrade_web.webp',
}

const MUNDI_LOCATION_THUMB_BY_ID: Record<string, string> = {
  alto_mar: '/assets/mundi/locations/alto_mar.png',
  armazem_comunitario: '/assets/mundi/locations/loc_armazem_comunitario.png',
  arena_natural_pedra: '/assets/mundi/locations/loc_arena_natural_pedra.png',
  arvore_bebe: '/assets/mundi/locations/loc_arvore_bebe.png',
  arvore_fushi_vivo: '/assets/mundi/locations/loc_arvore_fushi_vivo.png',
  ...BASE_UPGRADE_PHASE1_THUMB_BY_ID,
  bosque_baixo: '/assets/mundi/locations/loc_bosque_baixo.png',
  campo_treino_vila: '/assets/mundi/locations/loc_campo_treino_vila.png',
  caverna_meditacao: '/assets/mundi/locations/loc_caverna_meditacao.png',
  caverna_primeiro_corpo: '/assets/mundi/locations/loc_caverna_primeiro_corpo.png',
  caverna_mare: '/assets/mundi/locations/loc_caverna_mare.png',
  clareira_animais: '/assets/mundi/locations/loc_clareira_animais.png',
  clareira_lobos: '/assets/mundi/locations/loc_clareira_lobos.png',
  coracao_verde: '/assets/mundi/locations/loc_coracao_verde.png',
  costa_ossos: '/assets/mundi/locations/loc_costa_ossos.png',
  deposito_camuflado: '/assets/mundi/locations/loc_deposito_camuflado.png',
  embarque_faccao_mare: '/assets/mundi/locations/embarque_faccao_mare.png',
  enseada_azul: '/assets/mundi/locations/loc_enseada_azul.png',
  estatuas_litoral: '/assets/mundi/locations/estatuas_litoral.png',
  farol_quebrado: '/assets/mundi/locations/loc_farol_quebrado.png',
  grande_lago: '/assets/mundi/locations/loc_grande_lago.png',
  laboratorio_abandonado: '/assets/mundi/locations/loc_laboratorio_abandonado.png',
  lago_espelhado: '/assets/mundi/locations/loc_lago_espelhado.png',
  pico_quatro_ventos: '/assets/mundi/locations/loc_pico_quatro_ventos.png',
  ponte_suspensa: '/assets/mundi/locations/loc_ponte_suspensa.png',
  posto_interceptacao: '/assets/mundi/locations/loc_posto_interceptacao.png',
  praia_naufragos: '/assets/mundi/locations/loc_praia_naufragos.png',
  recife_cortante: '/assets/mundi/locations/loc_recife_cortante.png',
  riacho_claro: '/assets/mundi/locations/loc_riacho_claro.png',
  ruina_segura: '/assets/mundi/locations/loc_ruina_segura.png',
  saida_montanhas: '/assets/mundi/locations/loc_saida_das_montanhas.png',
  saida_portao: '/assets/mundi/locations/loc_saida_portao.png',
  templo_vazio_sereno: '/assets/mundi/locations/loc_templo_vazio_sereno.png',
  torre_observacao: '/assets/mundi/locations/loc_torre_observacao.png',
  trilha_enraizada: '/assets/mundi/locations/loc_trilha_enraizada.png',
  trilha_espioes: '/assets/mundi/locations/loc_trilha_espioes.png',
  trilha_para_vila: '/assets/mundi/locations/loc_trilha_para_vila.png',
  vila_conhecimento_absorvido: '/assets/mundi/locations/loc_vila_conhecimento_absorvido.png',
}

const MUNDI_BIOME_REGIONS = [
  {
    id: 'planicie_floresta_inicial',
    color: '#f2cc48',
    label: { x: 28, y: 27 },
    path: 'M10 30 L17 18 L29 15 L38 17 L47 36 L42 48 L34 66 L22 59 L12 48 L7 38 Z',
  },
  {
    id: 'praia_litoral_oceano',
    color: '#efe7b7',
    label: { x: 17, y: 61 },
    path: 'M0 39 L10 36 L22 43 L33 62 L30 75 L22 91 L8 93 L1 86 L-1 72 Z',
  },
  {
    id: 'montanhas_vazio_sereno',
    color: '#f4f1e8',
    label: { x: 50, y: 18 },
    path: 'M25 10 L39 7 L52 0 L63 5 L72 8 L68 22 L60 35 L47 36 L37 28 L27 20 Z',
  },
  {
    id: 'floresta_mistica',
    color: '#adff39',
    label: { x: 48, y: 52 },
    path: 'M43 35 L52 36 L62 49 L57 62 L47 67 L36 62 L34 49 Z',
  },
  {
    id: 'vulcao_terras_cinzentas',
    color: '#e3263a',
    label: { x: 79, y: 23 },
    path: 'M70 5 L80 0 L94 2 L100 13 L97 33 L85 42 L70 39 L62 31 L65 16 Z',
  },
  {
    id: 'regiao_congelada_neve',
    color: '#87f5ff',
    label: { x: 87, y: 56 },
    path: 'M78 36 L94 41 L100 55 L95 73 L84 83 L72 72 L69 56 L71 43 Z',
  },
  {
    id: 'ruinas_antigas',
    color: '#f0a4cb',
    label: { x: 68, y: 62 },
    path: 'M59 48 L70 48 L82 60 L78 76 L66 83 L55 75 L51 61 L54 53 Z',
  },
  {
    id: 'vale_cinzento_veu',
    color: '#d8956c',
    label: { x: 47, y: 78 },
    path: 'M30 62 L43 66 L57 71 L76 80 L72 94 L56 99 L38 97 L24 84 L24 73 Z',
  },
]

const BASE_BIOME_TRAVEL_ORDER = [
  'planicie_floresta_inicial',
  'praia_litoral_oceano',
  'vale_cinzento_veu',
  'ruinas_antigas',
  'regiao_congelada_neve',
  'vulcao_terras_cinzentas',
  'montanhas_vazio_sereno',
  'floresta_mistica',
]

const XP_MARK_DEFINITIONS = [
  {
    id: 'risco1',
    label: 'Risco 1',
    description: 'Passou por uma cena real de risco de vida, quase morte, ferimento grave ou perda importante.',
  },
  {
    id: 'risco2',
    label: 'Risco 2',
    description: 'Segundo risco real do ato; use apenas se houve outro perigo com consequencia concreta.',
  },
  {
    id: 'vontade',
    label: 'Vontade',
    description: 'Escolheu algo que revela quem e, com decisao propria e impacto na identidade.',
  },
  {
    id: 'vinculo',
    label: 'Vinculo',
    description: 'Criou, fortaleceu, rompeu ou sacrificou uma relacao importante em cena.',
  },
  {
    id: 'fushi',
    label: 'FUSHI',
    description: 'Entendeu uma regra real do FUSHI, da ilha, do corpo ou da propria identidade.',
  },
  {
    id: 'custo1',
    label: 'Custo 1',
    description: 'Pagou um preco real por escolha propria: recurso, ferimento, promessa, chance ou consequencia.',
  },
  {
    id: 'custo2',
    label: 'Custo 2',
    description: 'Segundo custo real do ato; use quando outra escolha cobrou preco concreto.',
  },
  {
    id: 'treino',
    label: 'Treino',
    description: 'Passou por desafio de treino com local, BASE, NPC, corpo, tecnica ou disciplina coerente.',
  },
  {
    id: 'ritual',
    label: 'Ritual',
    description: 'Concluiu ritual com preparo, risco, custo ou condicao narrativa clara.',
  },
  {
    id: 'reencarnacao',
    label: 'Reencarnacao',
    description: 'Morreu, voltou em outro corpo e carregou consequencia real da troca.',
  },
  {
    id: 'itemMarco',
    label: 'Item marco',
    description: 'Encontrou ou ativou item que muda identidade, build, leitura do mundo ou rumo da historia.',
  },
]

const XP_ACT_RANGES: Record<number, { cap: number; start: number; target: number }> = {
  1: { start: 1, target: 9, cap: 8 },
  2: { start: 9, target: 17, cap: 8 },
  3: { start: 17, target: 20, cap: 3 },
  4: { start: 20, target: 30, cap: 10 },
  5: { start: 30, target: 37, cap: 7 },
}

const WOLF_WAVE_REWARDS: Record<number, { mechanics: string; title: string }> = {
  1: {
    title: 'Bandagem de Emergencia',
    mechanics: '1 uso. Acao em cena: cura 1 HP do corpo ou levanta um corpo em 0 HP para 1 HP. Nao acumula.',
  },
  5: {
    title: 'Faca Simples 1d6 ou Dente do Primeiro Lobo',
    mechanics: 'Escolha 1. Faca: arma leve corpo a corpo, 1d6 corte. Dente: item marco; pode marcar Item marco no XP de 1 jogador e vira componente de build furtiva.',
  },
  10: {
    title: 'Nucleo Instavel de Lobo',
    mechanics: 'Escolha 1 personagem: +1 FUSHI maximo apos descanso/reflexao, ou vira Foco FUSHI basico de 1 uso para rerrolar 1 teste de FUSHI/instinto aprovado pelo mestre.',
  },
}

function formatLabel(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
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

function formatClockTime(hour: number) {
  const wholeHour = Math.floor(hour)
  const minutes = Math.round((hour - wholeHour) * 60)

  return `${String(wholeHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function formatHours(hours: number) {
  if (hours <= 0) {
    return '0h'
  }

  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)

  if (wholeHours === 0) {
    return `${minutes}min`
  }

  if (minutes === 0) {
    return `${wholeHours}h`
  }

  return `${wholeHours}h${String(minutes).padStart(2, '0')}`
}

function roundClockHours(hours: number) {
  if (!Number.isFinite(hours)) {
    return 0
  }

  return Math.max(0, Math.round(hours / CLOCK_STEP_HOURS) * CLOCK_STEP_HOURS)
}

function parseClockDeltaInput(value: string) {
  const trimmed = value.trim().toLowerCase()

  if (!trimmed) {
    return null
  }

  const timeMatch = trimmed.match(/^(\d{1,2}):([0-5]\d)$/)

  if (timeMatch) {
    return roundClockHours(Number(timeMatch[1]) + Number(timeMatch[2]) / 60)
  }

  const minuteMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*(m|min|minuto|minutos)$/)

  if (minuteMatch) {
    return roundClockHours(Number(minuteMatch[1].replace(',', '.')) / 60)
  }

  const hourMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*(h|hora|horas)?$/)

  if (hourMatch) {
    return roundClockHours(Number(hourMatch[1].replace(',', '.')))
  }

  return null
}

function getNpcSimulationWindow(worldHours: number) {
  const playerHours = roundClockHours(worldHours)
  const turnCount = Math.floor(playerHours / NPC_SIMULATION_TURN_HOURS)

  return {
    npcHours: roundClockHours(turnCount * NPC_SIMULATION_TURN_HOURS * NPC_AUTONOMOUS_TIME_RATIO),
    playerHours,
    turnCount,
  }
}

function toCsv(values: string[]) {
  return values.join(', ')
}

function fromCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function slugifyPathSegment(value: string) {
  return (
    value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'Sem_nome'
  )
}

function normalizeMapLookup(value: string) {
  return slugifyPathSegment(value).toLowerCase()
}

function getWorldMundiRootFolderId() {
  return 'mun-root-ilha-fushi'
}

function getWorldMundiBiomeFolderId(biomaId: string) {
  return `mun-biome-${biomaId}`
}

function getWorldMundiLocationFolderId(locationId: string) {
  return `mun-location-${locationId}`
}

function getWorldMundiLocationMapId(locationId: string) {
  return `mun-map-${locationId}`
}

function getBiomeFolderName(index: number, biomeName: string) {
  return `${String(index + 1).padStart(2, '0')}_${slugifyPathSegment(biomeName)}`
}

function buildMapPlaceholderRequest(
  location: WorldMundiLocation,
  biomes: WorldMundiState['biomes'],
): WorldMundiMapPlaceholderRequest {
  const biomeIndex = Math.max(0, biomes.findIndex((biome) => biome.id === location.biomaId))
  const biome = biomes[biomeIndex] ?? biomes[0]
  const biomeName = biome?.nome ?? location.biomaId

  return {
    biomaId: location.biomaId,
    biomeFolderId: getWorldMundiBiomeFolderId(location.biomaId),
    biomeFolderName: getBiomeFolderName(biomeIndex, biomeName),
    folderId: location.mapFolderId || getWorldMundiLocationFolderId(location.id),
    locationId: location.id,
    locationName: location.nome,
    mapId: location.mapId || getWorldMundiLocationMapId(location.id),
    mapName: `${location.nome} - mapa principal`,
    parentFolderId: getWorldMundiBiomeFolderId(location.biomaId),
    rootFolderId: getWorldMundiRootFolderId(),
    rootFolderName: 'Ilha FUSHI',
    summary: `Placeholder MAP vinculado ao MUN: ${location.nome}. Bioma: ${biomeName}. Tipo: ${formatLabel(location.tipo)}.`,
    thumbnailTipo: getLocationThumbnailType(location),
    type: location.tipo,
  }
}

function clampNumber(value: string, fallback = 0) {
  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

function clampInteger(value: string, fallback: number, min: number, max: number) {
  const parsedValue = Math.round(Number(value))

  if (!Number.isFinite(parsedValue)) {
    return fallback
  }

  return Math.max(min, Math.min(max, parsedValue))
}

function getOfficialLocationNumber(location: WorldMundiLocation) {
  const officialPoiTag = location.tags.find((tag) => /^mun_poi_\d+$/.test(tag))

  return officialPoiTag ? Number(officialPoiTag.replace('mun_poi_', '')) : null
}

function getLocationCode(location: WorldMundiLocation) {
  const officialNumber = getOfficialLocationNumber(location)

  return officialNumber ? `M${officialNumber}` : getLocationIcon(location)
}

function getLocationAvailabilityLabel(location: WorldMundiLocation) {
  if (location.tipo === 'vila') {
    return 'Hub inicial'
  }

  if (location.tipo === 'base_faccao') {
    return 'Base / faccao'
  }

  if (location.tipo === 'dungeon_condicional' || location.requisitosEntrada) {
    return 'Condicional'
  }

  if (location.tipo === 'dungeon_visivel') {
    return 'Dungeon visivel'
  }

  if (location.tipo === 'evento') {
    return 'Evento'
  }

  if (location.tipo === 'descanso') {
    return 'Descanso'
  }

  if (location.mapStatus === 'pronto') {
    return 'Ativo no MUN'
  }

  return formatLabel(location.mapStatus)
}

function getSubmapPurposeLabel(submap: WorldMundiSubmap) {
  if (submap.tipo === 'entrada') {
    return 'Entrada / acesso'
  }

  if (submap.tipo === 'fase_boss') {
    return 'Fase de boss / confronto'
  }

  if (submap.tipo === 'cataclisma') {
    return 'Evento cataclisma'
  }

  if (submap.tipo === 'puzzle') {
    return 'Puzzle / prova'
  }

  if (submap.tipo === 'memoria') {
    return 'Memoria / lore'
  }

  if (submap.tipo === 'interior') {
    return 'Interior'
  }

  return formatLabel(submap.tipo)
}

function getLocationIcon(location: WorldMundiLocation) {
  const officialNumber = getOfficialLocationNumber(location)

  if (officialNumber) {
    return String(officialNumber)
  }

  if (location.tipo === 'base_faccao') {
    return 'B'
  }

  if (location.tipo === 'dungeon_condicional') {
    return 'L'
  }

  if (location.tipo === 'dungeon_escondida') {
    return '?'
  }

  if (location.tipo === 'dungeon_visivel') {
    return 'D'
  }

  if (location.tipo === 'descanso') {
    return 'C'
  }

  if (location.tipo === 'evento') {
    return '!'
  }

  if (location.tipo === 'recurso') {
    return 'R'
  }

  if (location.tipo === 'vila') {
    return 'V'
  }

  return 'P'
}

function getRiskScore(risk: string) {
  const normalizedRisk = risk.toLowerCase()

  if (normalizedRisk.includes('muito') || normalizedRisk.includes('alto')) {
    return 4
  }

  if (normalizedRisk.includes('medio') || normalizedRisk.includes('mÃ©dio')) {
    return 2
  }

  return 1
}

function resolveClockAfterAdvance(clock: WorldMundiClock, hours: number) {
  const totalHours = clock.hora + roundClockHours(hours)
  const daysToAdd = Math.floor(totalHours / 24)
  const nextHourRaw = roundClockHours(totalHours - daysToAdd * 24)
  const nextHour = nextHourRaw >= 24 ? 0 : nextHourRaw

  return {
    ...clock,
    dia: clock.dia + daysToAdd,
    hora: nextHour,
  }
}

function getRouteTime(route: WorldMundiRoute, mode: TravelMode) {
  return mode === 'players'
    ? route.tempoPlayersHoras || route.distanciaHoras
    : route.tempoNpcHoras || (route.tempoPlayersHoras || route.distanciaHoras) * 2
}

function findBestTravelPlan(
  locations: WorldMundiLocation[],
  routes: WorldMundiRoute[],
  originId: string,
  destinationId: string,
  mode: TravelMode,
): TravelPlan | null {
  const origin = locations.find((location) => location.id === originId)
  const destination = locations.find((location) => location.id === destinationId)

  if (!origin || !destination) {
    return null
  }

  if (originId === destinationId) {
    return {
      destinationId,
      destinationName: destination.nome,
      originId,
      originName: origin.nome,
      risk: destination.riscoAtual,
      routeIds: [],
      routeNames: ['mesmo local'],
      timeHours: 0,
    }
  }

  const baseTravelPlan = buildBaseBiomeTravelPlan(origin, destination)

  if (baseTravelPlan) {
    return baseTravelPlan
  }

  const distances = new Map<string, number>([[originId, 0]])
  const previous = new Map<string, { locationId: string; route: WorldMundiRoute }>()
  const unvisited = new Set(locations.map((location) => location.id))

  while (unvisited.size > 0) {
    let currentId = ''
    let currentDistance = Number.POSITIVE_INFINITY

    unvisited.forEach((locationId) => {
      const distance = distances.get(locationId) ?? Number.POSITIVE_INFINITY

      if (distance < currentDistance) {
        currentDistance = distance
        currentId = locationId
      }
    })

    if (!currentId || currentDistance === Number.POSITIVE_INFINITY) {
      break
    }

    if (currentId === destinationId) {
      break
    }

    unvisited.delete(currentId)

    routes
      .filter(
        (route) =>
          !route.bloqueada && (route.origemId === currentId || route.destinoId === currentId),
      )
      .forEach((route) => {
        const nextId = route.origemId === currentId ? route.destinoId : route.origemId

        if (!unvisited.has(nextId)) {
          return
        }

        const nextDistance = currentDistance + getRouteTime(route, mode)

        if (nextDistance < (distances.get(nextId) ?? Number.POSITIVE_INFINITY)) {
          distances.set(nextId, nextDistance)
          previous.set(nextId, { locationId: currentId, route })
        }
      })
  }

  const totalTime = distances.get(destinationId)

  if (typeof totalTime !== 'number' || !Number.isFinite(totalTime)) {
    return null
  }

  const pathRoutes: WorldMundiRoute[] = []
  let cursor = destinationId

  while (cursor !== originId) {
    const pathEntry = previous.get(cursor)

    if (!pathEntry) {
      break
    }

    pathRoutes.unshift(pathEntry.route)
    cursor = pathEntry.locationId
  }

  return {
    destinationId,
    destinationName: destination.nome,
    originId,
    originName: origin.nome,
    risk:
      pathRoutes
        .map((route) => route.risco)
        .sort((a, b) => getRiskScore(b) - getRiskScore(a))[0] ?? destination.riscoAtual,
    routeIds: pathRoutes.map((route) => route.id),
    routeNames: pathRoutes.map((route) => {
      const routeOrigin = locations.find((location) => location.id === route.origemId)
      const routeDestination = locations.find((location) => location.id === route.destinoId)

      return `${routeOrigin?.nome ?? 'Origem'} -> ${routeDestination?.nome ?? 'Destino'}`
    }),
    timeHours: totalTime,
  }
}

function getRouteDirection(fromLocation: WorldMundiLocation, toLocation: WorldMundiLocation) {
  const dx = toLocation.posicao.x - fromLocation.posicao.x
  const dy = toLocation.posicao.y - fromLocation.posicao.y
  const vertical = Math.abs(dy) > 5 ? (dy < 0 ? 'Norte' : 'Sul') : ''
  const horizontal = Math.abs(dx) > 5 ? (dx > 0 ? 'Leste' : 'Oeste') : ''

  if (vertical && horizontal) {
    return `${vertical}-${horizontal.toLowerCase()}`
  }

  return vertical || horizontal || 'Mesmo ponto'
}

function getPartyShortLabel(party: WorldMundiParty) {
  if (party.tipo === 'grupo_principal') {
    return 'GJ'
  }

  if (party.memberPlayerIds.length > 0) {
    return party.memberPlayerIds
      .map((playerId) => playerId.replace('player', 'J'))
      .slice(0, 2)
      .join('+')
  }

  return 'G'
}

function getPartyDisplayName(party: WorldMundiParty) {
  if (party.tipo === 'grupo_principal' && (!party.nome || party.nome === 'Grupo Principal')) {
    return 'Grupo dos jogadores'
  }

  return party.nome || 'Grupo sem nome'
}

function getPartyMemberLabel(
  party: WorldMundiParty,
  entityById: Map<string, WorldMundiEntity>,
  characterById?: Map<string, CharacterSheet>,
) {
  const playerLabels = party.memberPlayerIds.map((playerId) => playerId.replace('player', 'J'))
  const entityLabels = party.memberEntityIds
    .map((entityId) => entityById.get(entityId)?.nome ?? entityId)
    .filter(Boolean)
  const characterLabels = party.memberCharacterIds.map(
    (characterId) => characterById?.get(characterId)?.nome ?? characterId,
  )

  return [...playerLabels, ...characterLabels, ...entityLabels].join(', ') || 'Sem membros'
}

function normalizeFreePresence(presence: WorldMundiNpcState['presencaNoMapa']) {
  return presence === 'inativo' ? 'token_oculto' : presence
}

function isSameMundiPlace(
  leftLocationId: string,
  leftSubmapId: string,
  rightLocationId: string,
  rightSubmapId: string,
) {
  if (!leftLocationId || leftLocationId !== rightLocationId) {
    return false
  }

  if (!leftSubmapId && !rightSubmapId) {
    return true
  }

  return leftSubmapId === rightSubmapId
}

function parseWorldMemberIds(memberIds: string[]) {
  return {
    partyIds: new Set(
      memberIds
        .filter((memberId) => memberId.startsWith('party:'))
        .map((memberId) => memberId.replace('party:', '')),
    ),
    playerIds: new Set(
      memberIds
        .filter((memberId) => memberId.startsWith('player:'))
        .map((memberId) => memberId.replace('player:', '')),
    ),
    characterIds: new Set(
      memberIds
        .filter((memberId) => memberId.startsWith('npc:'))
        .map((memberId) => memberId.replace('npc:', '')),
    ),
    entityIds: new Set(
      memberIds
        .filter((memberId) => memberId.startsWith('entity:'))
        .map((memberId) => memberId.replace('entity:', '')),
    ),
  }
}

function createSessionNpcDraft(): SessionNpcDraft {
  return {
    afinidadeDelta: 0,
    ameacaDelta: 0,
    confiancaDelta: 0,
    contexto: '',
    eventoChave: '',
    medoAtual: '',
    objetivoAtual: '',
    promessaOuConflito: '',
  }
}

function getPartyColor(partyId: string, parties: WorldMundiParty[]) {
  const index = Math.max(0, parties.findIndex((party) => party.id === partyId))

  return PARTY_COLORS[index % PARTY_COLORS.length]
}

function getStackOffset(index: number, total: number) {
  if (total <= 1) {
    return { x: 0, y: 0 }
  }

  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  const radius = Math.min(26, 10 + total * 3)

  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius),
  }
}

function getLocationThumbnailType(location: WorldMundiLocation) {
  if (location.thumbnailTipo) {
    return location.thumbnailTipo
  }

  const source = `${location.tipo} ${location.biomaId} ${location.nome}`.toLowerCase()

  if (source.includes('caverna')) return 'caverna'
  if (source.includes('vila')) return 'vila'
  if (source.includes('floresta')) return 'floresta'
  if (source.includes('ruina') || source.includes('selo')) return 'ruina'
  if (source.includes('montanha') || source.includes('pico')) return 'montanha'
  if (source.includes('vulcao') || source.includes('cinza') || source.includes('lava')) return 'vulcao'
  if (source.includes('neve') || source.includes('gelo')) return 'neve'
  if (source.includes('praia') || source.includes('litoral') || source.includes('oceano')) return 'praia'

  return 'default'
}

function getMundiLocationImage(location: WorldMundiLocation | null) {
  if (!location) {
    return ''
  }

  const officialBaseThumb = BASE_UPGRADE_PHASE1_THUMB_BY_ID[location.id]

  if (location.tipo === 'base_bioma' && officialBaseThumb) {
    return officialBaseThumb
  }

  return (
    location.previewImageUrl ||
    location.imagemLocalUrl ||
    MUNDI_LOCATION_THUMB_BY_ID[location.id] ||
    ''
  )
}

function isBaseMundiLocation(location: WorldMundiLocation) {
  return (
    location.tipo === 'base_bioma' ||
    location.tags.includes('base_bioma') ||
    location.id.startsWith('base_')
  )
}

function getBaseArrivalTransitionId(baseId: string) {
  return `transicao_chegada_${baseId}`
}

function getBasePhaseArrivalTransitionId(baseId: string, phaseKey: string) {
  if (phaseKey === 'fase1_construcao') {
    return getBaseArrivalTransitionId(baseId)
  }

  return `transicao_chegada_${baseId}_${phaseKey}`
}

function getBaseSubmapArrivalTransitionId(submap: WorldMundiSubmap) {
  if (!submap.parentLocationId.startsWith('base_')) {
    return ''
  }

  if (submap.mapId.includes('_fase2_meio_construida_topdown')) {
    return getBasePhaseArrivalTransitionId(
      submap.parentLocationId,
      'fase2_meio_construida',
    )
  }

  if (submap.mapId.includes('_fase3_completa_topdown')) {
    return getBasePhaseArrivalTransitionId(submap.parentLocationId, 'fase3_completa')
  }

  return ''
}

function getMundiBiomeImage(biomaId: string) {
  return MUNDI_BIOME_THUMB_BY_ID[biomaId] ?? ''
}

interface TabletopGeneralMundiViewProps {
  biomes?: WorldMundiBiome[]
  clock?: WorldMundiClock | null
  isMaster?: boolean
  onPointSelect?: (locationId: string) => void
  onReleasedChange?: (released: boolean) => void
  onTogglePoint?: (locationId: string) => void
  points: GeneralMundiPoint[]
  releasedToPlayers: boolean
}

export function TabletopGeneralMundiView({
  biomes = [],
  clock = null,
  isMaster = false,
  onPointSelect,
  onReleasedChange,
  onTogglePoint,
  points,
  releasedToPlayers,
}: TabletopGeneralMundiViewProps) {
  const biomeNameById = useMemo(
    () => new Map(biomes.map((biome) => [biome.id, biome.nome])),
    [biomes],
  )
  const visiblePoints = isMaster
    ? points
    : releasedToPlayers
      ? points.filter((point) => point.discovered || point.current)
      : []

  return (
    <div className="world-mundi-general">
      <div className="world-mundi-general__toolbar">
        {clock ? (
          <div className="world-mundi__map-clock">
            <span>Dia {clock.dia}</span>
            <strong>{formatClockTime(clock.hora)}</strong>
          </div>
        ) : null}
        <span className="tag">
          {releasedToPlayers ? 'MUN liberado para jogadores' : 'MUN oculto dos jogadores'}
        </span>
        {isMaster ? (
          <button
            className={`button${releasedToPlayers ? ' button--primary' : ''}`}
            onClick={() => onReleasedChange?.(!releasedToPlayers)}
            type="button"
          >
            {releasedToPlayers ? 'Ocultar MUN dos jogadores' : 'Liberar MUN para jogadores'}
          </button>
        ) : null}
      </div>

      <div className="world-mundi-general__canvas">
        <img
          alt="Mapa geral da Ilha FUSHI"
          className="world-mundi-general__art"
          src={resolveRuntimeAssetUrl(MUNDI_BASE_MAP_ASSET)}
        />
        <svg
          aria-hidden="true"
          className="world-mundi-general__biomes"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {MUNDI_BIOME_REGIONS.map((region) => (
            <path
              className="world-mundi-general__biome-outline"
              d={region.path}
              key={region.id}
              style={{ '--biome-color': region.color } as CSSProperties}
            />
          ))}
        </svg>

        {visiblePoints.map((point) => {
          const isVisibleToPlayer = point.discovered || point.current
          const biomeName = point.biomaNome || biomeNameById.get(point.biomaId) || 'Bioma'
          const pointImage = point.image || MUNDI_LOCATION_THUMB_BY_ID[point.id] || ''

          return (
            <button
              className={`world-mundi-general__point${
                isVisibleToPlayer ? ' world-mundi-general__point--revealed' : ''
              }${point.current ? ' world-mundi-general__point--current' : ''}${
                pointImage ? ' world-mundi-general__point--image' : ''
              }`}
              key={point.id}
              onClick={() => {
                onPointSelect?.(point.id)
                if (isMaster) {
                  onTogglePoint?.(point.id)
                }
              }}
              style={{
                left: `${point.posicao.x}%`,
                top: `${point.posicao.y}%`,
              }}
              title={
                isMaster
                  ? `${point.nome} | ${biomeName} | ${isVisibleToPlayer ? 'liberado' : 'oculto'}`
                  : point.nome
              }
              type="button"
            >
              {pointImage ? <img alt="" src={resolveRuntimeAssetUrl(pointImage)} /> : null}
              <span>{point.current ? 'GP' : ''}</span>
              {(point.presenceCount ?? 0) > 0 ? (
                <small title={point.presenceNames?.join(', ')}>
                  {point.presenceCount}
                </small>
              ) : null}
            </button>
          )
        })}

        {!isMaster && !releasedToPlayers ? (
          <article className="world-mundi-general__locked">
            <p className="eyebrow">Mapa geral</p>
            <h3>A ilha ainda nao foi liberada pelo mestre.</h3>
          </article>
        ) : null}
      </div>

      {isMaster ? (
        <p className="support-copy">
          Clique em um ponto para liberar/ocultar no MUN dos jogadores. Eles nao recebem NPCs,
          segredos, rotas privadas ou notas do mestre.
        </p>
      ) : null}
    </div>
  )
}

interface TabletopBaseMundiViewProps {
  bases?: WorldMundiBiomeBaseState[]
  clock?: WorldMundiClock | null
  isMaster?: boolean
  onReleasedChange?: (released: boolean) => void
  onBaseSelect?: (baseId: string) => void
  onStatusChange?: (
    baseId: string,
    upgradeId: string,
    status: WorldMundiBaseUpgradeStatus,
  ) => void
  releasedToPlayers: boolean
  selectedBaseId?: string
  upgrades?: WorldMundiBaseUpgrade[]
}

function getBaseStatusLabel(status: WorldMundiBaseUpgradeStatus) {
  if (status === 'ativo') return 'Ativo'

  return 'Bloqueado'
}

function getBaseBiomeVisual(base: WorldMundiBiomeBaseState | null | undefined) {
  const biomaId = base?.biomaId ?? 'planicie_floresta_inicial'
  const baseId = base?.id ?? 'base_planicie_nascente'

  return {
    accent: BASE_BIOME_ACCENT_BY_ID[biomaId] ?? '#92c0b6',
    backdrop:
      BASE_BIOME_BACKDROP_BY_ID[biomaId] ??
      BASE_BIOME_BACKDROP_BY_ID.planicie_floresta_inicial,
    thumb:
      BASE_UPGRADE_PHASE1_THUMB_BY_ID[baseId] ??
      MUNDI_BIOME_THUMB_BY_ID[biomaId] ??
      MUNDI_BIOME_THUMB_BY_ID.planicie_floresta_inicial,
    web:
      BASE_UPGRADE_WEB_BY_BASE_ID[baseId] ??
      BASE_UPGRADE_WEB_BY_BASE_ID.base_planicie_nascente,
  }
}

function getBaseUpgradeIconKey(upgrade: WorldMundiBaseUpgrade) {
  if (upgrade.iconKey) {
    return upgrade.iconKey
  }

  const source = `${upgrade.nome} ${upgrade.categoria}`.toLowerCase()

  if (source.includes('agua') || source.includes('cozinha') || source.includes('caldeira')) {
    return 'water'
  }

  if (source.includes('dormitorio') || source.includes('leito') || source.includes('abrigo')) {
    return 'bed'
  }

  if (source.includes('deposito') || source.includes('armazem') || source.includes('cofre')) {
    return 'box'
  }

  if (source.includes('oficina') || source.includes('forja') || source.includes('bancada')) {
    return 'tool'
  }

  if (source.includes('enfermaria') || source.includes('cura') || source.includes('ferimento')) {
    return 'cross'
  }

  if (source.includes('biblioteca') || source.includes('arquivo') || source.includes('memoria')) {
    return 'book'
  }

  if (source.includes('musica') || source.includes('sino') || source.includes('canto')) {
    return 'music'
  }

  if (source.includes('defesa') || source.includes('muralha') || source.includes('alarme')) {
    return 'shield'
  }

  if (source.includes('fushi') || source.includes('nucleo') || source.includes('esporo')) {
    return 'core'
  }

  if (source.includes('mundi') || source.includes('mesa')) {
    return 'map'
  }

  return 'home'
}

function BaseUpgradeIcon({ upgrade }: { upgrade: WorldMundiBaseUpgrade }) {
  const iconKey = getBaseUpgradeIconKey(upgrade)
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {iconKey === 'water' ? (
        <>
          <path {...common} d="M12 3c3.4 4 5.5 6.9 5.5 10a5.5 5.5 0 0 1-11 0C6.5 9.9 8.6 7 12 3Z" />
          <path {...common} d="M9.5 14.5c.7 1.2 1.6 1.8 2.9 1.8" />
        </>
      ) : iconKey === 'bed' ? (
        <>
          <path {...common} d="M4 11V6" />
          <path {...common} d="M4 16h16" />
          <path {...common} d="M20 16v-4a2 2 0 0 0-2-2H9v6" />
          <path {...common} d="M4 16v2" />
          <path {...common} d="M20 16v2" />
          <path {...common} d="M7 10h2" />
        </>
      ) : iconKey === 'box' ? (
        <>
          <path {...common} d="M4 8 12 4l8 4-8 4-8-4Z" />
          <path {...common} d="M4 8v8l8 4 8-4V8" />
          <path {...common} d="M12 12v8" />
        </>
      ) : iconKey === 'tool' ? (
        <>
          <path {...common} d="M14.5 5.5a4 4 0 0 0 4.8 4.8L11 18.6a2.2 2.2 0 0 1-3.1-3.1l8.3-8.3a4 4 0 0 0-1.7-1.7Z" />
          <path {...common} d="m7.5 16.5 2 2" />
        </>
      ) : iconKey === 'cross' ? (
        <>
          <path {...common} d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4Z" />
        </>
      ) : iconKey === 'book' ? (
        <>
          <path {...common} d="M5 5.5A3.5 3.5 0 0 1 8.5 4H20v14H8.5A3.5 3.5 0 0 0 5 19.5v-14Z" />
          <path {...common} d="M5 5.5A3.5 3.5 0 0 0 1.5 4H1v14h.5A3.5 3.5 0 0 1 5 19.5" />
          <path {...common} d="M9 8h7" />
          <path {...common} d="M9 12h5" />
        </>
      ) : iconKey === 'music' ? (
        <>
          <path {...common} d="M9 18V6l10-2v12" />
          <circle {...common} cx="6" cy="18" r="3" />
          <circle {...common} cx="16" cy="16" r="3" />
        </>
      ) : iconKey === 'shield' ? (
        <>
          <path {...common} d="M12 3 20 6v6c0 4.8-3.2 7.4-8 9-4.8-1.6-8-4.2-8-9V6l8-3Z" />
          <path {...common} d="M12 7v10" />
          <path {...common} d="M8.5 12h7" />
        </>
      ) : iconKey === 'core' ? (
        <>
          <circle {...common} cx="12" cy="12" r="3" />
          <path {...common} d="M12 2v4" />
          <path {...common} d="M12 18v4" />
          <path {...common} d="M2 12h4" />
          <path {...common} d="M18 12h4" />
          <path {...common} d="m5 5 3 3" />
          <path {...common} d="m16 16 3 3" />
          <path {...common} d="m19 5-3 3" />
          <path {...common} d="m8 16-3 3" />
        </>
      ) : iconKey === 'map' ? (
        <>
          <path {...common} d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z" />
          <path {...common} d="M9 4v14" />
          <path {...common} d="M15 6v14" />
        </>
      ) : (
        <>
          <path {...common} d="M4 11 12 4l8 7" />
          <path {...common} d="M6 10.5V20h12v-9.5" />
          <path {...common} d="M10 20v-5h4v5" />
        </>
      )}
    </svg>
  )
}

export function TabletopBaseMundiView({
  bases,
  clock = null,
  isMaster = false,
  onBaseSelect,
  onReleasedChange,
  onStatusChange,
  releasedToPlayers,
  selectedBaseId,
  upgrades = [],
}: TabletopBaseMundiViewProps) {
  const fallbackBase = useMemo<WorldMundiBiomeBaseState>(
    () => ({
      id: 'base_legada',
      nome: 'BASE',
      biomaId: 'planicie_floresta_inicial',
      locationId: 'caverna_primeiro_corpo',
      resumo: 'Base de campanha legada.',
      buffBioma: 'Buff de bioma ainda nao definido.',
      buffMundo: 'Todas as bases completas liberam buff de mundo.',
      selectedUpgradeId: upgrades[0]?.id ?? '',
      upgrades,
    }),
    [upgrades],
  )
  const availableBases = useMemo(
    () => (bases?.length ? bases : upgrades.length ? [fallbackBase] : []),
    [bases, fallbackBase, upgrades.length],
  )
  const [localSelectedBaseId, setLocalSelectedBaseId] = useState('')
  const effectiveSelectedBaseId =
    (selectedBaseId && availableBases.some((base) => base.id === selectedBaseId)
      ? selectedBaseId
      : '') ||
    (localSelectedBaseId && availableBases.some((base) => base.id === localSelectedBaseId)
      ? localSelectedBaseId
      : '') ||
    availableBases[0]?.id ||
    ''
  const activeBase =
    availableBases.find((base) => base.id === effectiveSelectedBaseId) ?? availableBases[0]
  const activeUpgrades = useMemo(() => activeBase?.upgrades ?? [], [activeBase])
  const [localSelectedUpgradeId, setLocalSelectedUpgradeId] = useState('')
  const activeCount = activeUpgrades.filter((upgrade) => upgrade.status === 'ativo').length
  const totalActiveCount = availableBases.reduce(
    (total, base) => total + base.upgrades.filter((upgrade) => upgrade.status === 'ativo').length,
    0,
  )
  const completedBases = availableBases.filter(
    (base) => base.upgrades.length > 0 && base.upgrades.every((upgrade) => upgrade.status === 'ativo'),
  ).length
  const totalUpgradeCount = availableBases.reduce((total, base) => total + base.upgrades.length, 0)
  const visibleUpgrades = useMemo(
    () =>
      isMaster
        ? activeUpgrades
        : releasedToPlayers
          ? activeUpgrades.filter((upgrade) => upgrade.status === 'ativo')
          : [],
    [activeUpgrades, isMaster, releasedToPlayers],
  )
  const selectedUpgrade = useMemo(
    () =>
      visibleUpgrades.find((upgrade) => upgrade.id === localSelectedUpgradeId) ??
      visibleUpgrades.find((upgrade) => upgrade.id === activeBase?.selectedUpgradeId) ??
      visibleUpgrades[0] ??
      null,
    [activeBase?.selectedUpgradeId, localSelectedUpgradeId, visibleUpgrades],
  )
  const [isDetailOpen, setIsDetailOpen] = useState(true)
  const baseVisual = getBaseBiomeVisual(activeBase)
  const baseCoreUpgrade =
    activeBase?.upgrades.find(
      (upgrade) => upgrade.id === 'reforma_inicial' || upgrade.id.endsWith('_reforma_inicial'),
    ) ?? null
  const visibleCoreUpgrade =
    visibleUpgrades.find(
      (upgrade) => upgrade.id === 'reforma_inicial' || upgrade.id.endsWith('_reforma_inicial'),
    ) ?? null
  const radialLinkSource = visibleCoreUpgrade ?? (isMaster ? baseCoreUpgrade : null)
  const worldBuffReady = availableBases.length > 0 && completedBases === availableBases.length
  const selectedUpgradeCanActivate = Boolean(selectedUpgrade)
  const selectedUpgradeLocationHint = selectedUpgrade?.locationHintId
    ? formatLabel(selectedUpgrade.locationHintId)
    : 'Ponto ainda nao definido'

  function selectBase(baseId: string) {
    setLocalSelectedBaseId(baseId)
    setLocalSelectedUpgradeId('')
    setIsDetailOpen(true)
    onBaseSelect?.(baseId)
  }

  return (
    <div
      className="world-mundi-base"
      style={
        {
          '--base-bg': `url("${resolveRuntimeAssetUrl(baseVisual.backdrop)}")`,
          '--base-color': baseVisual.accent,
          '--base-core-x': `${baseCoreUpgrade?.x ?? 50}%`,
          '--base-core-y': `${baseCoreUpgrade?.y ?? 83}%`,
          '--base-thumb': `url("${resolveRuntimeAssetUrl(baseVisual.thumb)}")`,
          '--base-web': `url("${resolveRuntimeAssetUrl(baseVisual.web)}")`,
        } as CSSProperties
      }
    >
      <div className="world-mundi-base__toolbar">
        {clock ? (
          <div className="world-mundi__map-clock">
            <span>Dia {clock.dia}</span>
            <strong>{formatClockTime(clock.hora)}</strong>
          </div>
        ) : null}
        <span className="tag">{totalActiveCount}/{totalUpgradeCount} upgrades ativos</span>
        <span className="tag">{completedBases}/{availableBases.length} bases completas</span>
        <span className="tag">
          {releasedToPlayers ? 'BASE liberada para jogadores' : 'BASE oculta dos jogadores'}
        </span>
        {isMaster ? (
          <button
            className={`button${releasedToPlayers ? ' button--primary' : ''}`}
            onClick={() => onReleasedChange?.(!releasedToPlayers)}
            type="button"
          >
            {releasedToPlayers ? 'Ocultar BASE dos jogadores' : 'Liberar BASE para jogadores'}
          </button>
        ) : null}
      </div>

      <div className="world-mundi-base__summary">
        <article>
          <p className="eyebrow">Base selecionada</p>
          <h3>{activeBase?.nome ?? 'BASE'}</h3>
          <p>{activeBase?.resumo ?? 'Selecione uma base de bioma.'}</p>
        </article>
        <article>
          <p className="eyebrow">Buff do bioma</p>
          <h3>{activeCount}/{activeUpgrades.length}</h3>
          <p>{activeBase?.buffBioma ?? 'Complete os upgrades para liberar.'}</p>
        </article>
        <article className={worldBuffReady ? 'world-mundi-base__world-buff--ready' : ''}>
          <p className="eyebrow">Buff de mundo</p>
          <h3>{worldBuffReady ? 'Pronto' : `${completedBases}/${availableBases.length}`}</h3>
          <p>{activeBase?.buffMundo ?? 'Complete as 8 bases para liberar o bonus global.'}</p>
        </article>
      </div>

      <div className="world-mundi-base__selector" role="tablist" aria-label="Bases por bioma">
        {availableBases.map((base) => {
          const baseActiveCount = base.upgrades.filter((upgrade) => upgrade.status === 'ativo').length
          const isSelected = base.id === effectiveSelectedBaseId
          const visual = getBaseBiomeVisual(base)

          return (
            <button
              aria-selected={isSelected}
              className={`world-mundi-base__base-tab${isSelected ? ' world-mundi-base__base-tab--active' : ''}`}
              key={base.id}
              onClick={() => selectBase(base.id)}
              role="tab"
              style={
                {
                  '--base-color': visual.accent,
                  '--base-thumb': `url("${resolveRuntimeAssetUrl(visual.thumb)}")`,
                } as CSSProperties
              }
              type="button"
            >
              <i aria-hidden="true" />
              <span>{base.nome}</span>
              <small>{baseActiveCount}/{base.upgrades.length}</small>
            </button>
          )
        })}
      </div>

      <div className="world-mundi-base__board-shell">
        <div className="world-mundi-base__board">
          <div className="world-mundi-base__backdrop" aria-hidden="true" />
          <div className="world-mundi-base__sigil" aria-hidden="true" />
          <div className="world-mundi-base__core" aria-hidden="true">
            <span>BASE</span>
          </div>
          <svg
            aria-hidden="true"
            className="world-mundi-base__links"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {radialLinkSource
              ? visibleUpgrades
                  .filter((upgrade) => upgrade.id !== radialLinkSource.id)
                  .map((upgrade) => (
                    <line
                      className={`world-mundi-base__link${
                        upgrade.status === 'ativo' ? ' world-mundi-base__link--ativo' : ''
                      }`}
                      key={`${radialLinkSource.id}-${upgrade.id}`}
                      x1={radialLinkSource.x}
                      x2={upgrade.x}
                      y1={radialLinkSource.y}
                      y2={upgrade.y}
                    />
                  ))
              : null}
          </svg>

          {visibleUpgrades.map((upgrade) => {
            const isActive = upgrade.status === 'ativo'
            const isSelected = selectedUpgrade?.id === upgrade.id

            return (
              <button
                aria-label={upgrade.nome}
                aria-pressed={isSelected}
                className={`world-mundi-base__node${
                  isActive ? ' world-mundi-base__node--ativo' : ' world-mundi-base__node--bloqueado'
                }${isSelected ? ' world-mundi-base__node--selected' : ''}`}
                key={upgrade.id}
                onClick={() => {
                  setLocalSelectedUpgradeId(upgrade.id)
                  setIsDetailOpen(true)
                }}
                style={{ left: `${upgrade.x}%`, top: `${upgrade.y}%` }}
                title={upgrade.nome}
                type="button"
              >
                <span className="world-mundi-base__node-icon">
                  <BaseUpgradeIcon upgrade={upgrade} />
                </span>
                <span className="world-mundi-base__node-ring" />
              </button>
            )
          })}

          {!isMaster && releasedToPlayers && activeUpgrades.length > 0 && visibleUpgrades.length === 0 ? (
            <article className="world-mundi-general__locked">
              <p className="eyebrow">BASE</p>
              <h3>Nenhum upgrade desta base foi ativado ainda.</h3>
            </article>
          ) : null}

          {!isMaster && !releasedToPlayers ? (
            <article className="world-mundi-general__locked">
              <p className="eyebrow">BASE</p>
              <h3>A base ainda nao foi liberada pelo mestre.</h3>
            </article>
          ) : null}
        </div>

        {selectedUpgrade && isDetailOpen ? (
          <aside className="world-mundi-base__detail">
            <button
              aria-label="Fechar detalhe do upgrade"
              className="world-mundi-base__detail-close"
              onClick={() => setIsDetailOpen(false)}
              title="Fechar"
              type="button"
            >
              x
            </button>
            <span className="world-mundi-base__detail-icon">
              <BaseUpgradeIcon upgrade={selectedUpgrade} />
            </span>
            <p className="eyebrow">{selectedUpgrade.categoria}</p>
            <h3>{selectedUpgrade.nome}</h3>
            <p>{selectedUpgrade.resumo}</p>
            <div className="world-mundi-base__bonus">
              <strong>Bonus</strong>
              <span>{selectedUpgrade.bonus || selectedUpgrade.efeitoMesa || 'Bonus ainda nao definido.'}</span>
            </div>
            <span className="tag">{getBaseStatusLabel(selectedUpgrade.status)}</span>
            {isMaster ? (
              <div className="world-mundi-base__requirements">
                <div>
                  <strong>Recurso</strong>
                  <span>{selectedUpgrade.custo || 'Defina o custo antes de liberar.'}</span>
                </div>
                <div>
                  <strong>Condicao</strong>
                  <span>{selectedUpgrade.requisito || 'Sem condicao cadastrada.'}</span>
                </div>
                <div>
                  <strong>Pista de coleta</strong>
                  <span>{selectedUpgradeLocationHint}</span>
                </div>
              </div>
            ) : null}
            {isMaster ? (
              <button
                className={`button${selectedUpgrade.status === 'ativo' ? '' : ' button--primary'}`}
                disabled={selectedUpgrade.status !== 'ativo' && !selectedUpgradeCanActivate}
                onClick={() =>
                  activeBase &&
                  onStatusChange?.(
                    activeBase.id,
                    selectedUpgrade.id,
                    selectedUpgrade.status === 'ativo' ? 'bloqueado' : 'ativo',
                  )
                }
                title={selectedUpgrade.requisito || 'Ativar upgrade da base'}
                type="button"
              >
                {selectedUpgrade.status === 'ativo' ? 'Desativar upgrade' : 'Ativar upgrade'}
              </button>
            ) : null}
          </aside>
        ) : selectedUpgrade ? (
          <button
            className="world-mundi-base__detail-reopen"
            onClick={() => setIsDetailOpen(true)}
            type="button"
          >
            Ver detalhe de {selectedUpgrade.nome}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function getPlanEncounters(
  plan: Pick<TimePlanEntry, 'destinationId' | 'routeIds'>,
  state: WorldMundiState,
) {
  const destination = state.locations.find((location) => location.id === plan.destinationId)
  const planRoutes = state.routes.filter((route) => plan.routeIds.includes(route.id))
  const routeEncounters = planRoutes.flatMap((route) => route.encontrosPossiveis)
  const routeEvents = planRoutes.flatMap((route) => route.eventosPossiveis)
  const destinationEntities = Object.values(state.entities)
    .filter(
      (entity) =>
        entity.estado === 'ativo' &&
        (entity.localAtualId === plan.destinationId || plan.routeIds.includes(entity.rotaAtualId)),
    )
    .map((entity) => `${entity.nome} (${formatLabel(entity.tipo)})`)
  const destinationEvents = destination?.eventosPossiveis ?? []

  return {
    encounters: [...routeEncounters, ...destinationEntities],
    events: [...routeEvents, ...destinationEvents],
  }
}

function getDistanceHours(fromLocation: WorldMundiLocation, toPosition: { x: number; y: number }) {
  const dx = toPosition.x - fromLocation.posicao.x
  const dy = toPosition.y - fromLocation.posicao.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  return Math.max(CLOCK_STEP_HOURS, roundClockHours((distance / 100) * 24))
}

function getBaseBiomeTravelPath(originBiomeId: string, destinationBiomeId: string) {
  if (originBiomeId === destinationBiomeId) {
    return [destinationBiomeId]
  }

  const originIndex = BASE_BIOME_TRAVEL_ORDER.indexOf(originBiomeId)
  const destinationIndex = BASE_BIOME_TRAVEL_ORDER.indexOf(destinationBiomeId)

  if (originIndex < 0 || destinationIndex < 0) {
    return [originBiomeId, destinationBiomeId].filter(Boolean)
  }

  const start = Math.min(originIndex, destinationIndex)
  const end = Math.max(originIndex, destinationIndex)
  const path = BASE_BIOME_TRAVEL_ORDER.slice(start, end + 1)

  return originIndex <= destinationIndex ? path : path.reverse()
}

function buildBaseBiomeTravelPlan(
  origin: WorldMundiLocation,
  destination: WorldMundiLocation,
): TravelPlan | null {
  if (origin.tipo !== 'base_bioma' && destination.tipo !== 'base_bioma') {
    return null
  }

  const biomePath = getBaseBiomeTravelPath(origin.biomaId, destination.biomaId)
  const timeHours = Math.max(1, biomePath.length)
  const biomeNames = biomePath.map((biomeId) => formatLabel(biomeId))

  return {
    destinationId: destination.id,
    destinationName: destination.nome,
    originId: origin.id,
    originName: origin.nome,
    risk: destination.riscoAtual || origin.riscoAtual,
    routeIds: [],
    routeNames: [`base avulsa por biomas: ${biomeNames.join(' -> ')}`],
    timeHours,
  }
}

function getWolfWaveDefinition(waveNumber: number) {
  const wave = Math.max(1, Math.min(50, Math.round(waveNumber)))
  const cyclePosition = ((wave - 1) % 10) + 1
  const type = cyclePosition === 10 ? 'Forte' : cyclePosition === 5 ? 'Padrao' : 'Segura'
  const encounter =
    type === 'Forte'
      ? '2x Lobo Cinzento + 1x Lobo Marcado por FUSHI'
      : type === 'Padrao'
        ? '3x Lobo Cinzento'
        : '2x Lobo Cinzento'

  return {
    cyclePosition,
    encounter,
    reward: WOLF_WAVE_REWARDS[cyclePosition] ?? null,
    type,
    wave,
  }
}

function getXpSuggestedLevel(marks: Record<string, boolean>, act: number) {
  const range = XP_ACT_RANGES[act] ?? XP_ACT_RANGES[1]
  const gained = Math.min(
    range.cap,
    XP_MARK_DEFINITIONS.filter((definition) => marks[definition.id]).length,
  )

  return range.start + gained
}

function getCharacterPortrait(character?: CharacterSheet) {
  return character?.avatarUrl || character?.tokenImageUrl || ''
}

function getHiddenLocationHint(
  state: WorldMundiState,
  position: { x: number; y: number },
  routeIds: string[],
) {
  const hiddenLocations = state.locations.filter(
    (location) =>
      location.nivelDetalhe === 'oculto' ||
      location.tipo === 'dungeon_escondida' ||
      location.tags.includes('oculto') ||
      location.tags.includes('segredo'),
  )
  const closeHidden = hiddenLocations.find((location) => {
    const distance = Math.sqrt(
      (location.posicao.x - position.x) ** 2 + (location.posicao.y - position.y) ** 2,
    )

    return distance <= 7
  })
  const secretRoute = state.routes.find(
    (route) => route.secreta && routeIds.includes(route.id),
  )

  if (closeHidden) {
    return `Ha um local oculto proximo. Percepcao/Investigacao DT ${closeHidden.dtEncontrar} para notar sinais.`
  }

  if (secretRoute) {
    return `Esta rota cruza sinais ocultos. DT ${secretRoute.dtEncontrar} para perceber a rota secreta.`
  }

  return ''
}

function buildNpcMotivation(npc: WorldMundiNpcState, destination: WorldMundiLocation) {
  if (npc.contextoNarrativo) {
    return npc.contextoNarrativo
  }

  if (npc.viagemMotivo) {
    return npc.viagemMotivo
  }

  const matchingTags = destination.tags.filter((tag) => npc.tagsInteresse.includes(tag))

  if (matchingTags.length > 0) {
    return `Foi atraido por ${matchingTags.join(', ')} em ${destination.nome}.`
  }

  if (npc.objetivoAtual) {
    return `Movimento coerente com o objetivo atual: ${npc.objetivoAtual}.`
  }

  if (npc.objetivoMacro) {
    return `Movimento coerente com o objetivo macro: ${npc.objetivoMacro}.`
  }

  return 'Sem contexto forte ainda; movimento baseado em presenca no mundo e oportunidade local.'
}

function scoreLocationForNpc(
  npc: WorldMundiNpcState,
  location: WorldMundiLocation,
  currentLocationId: string,
) {
  if (location.id === currentLocationId) {
    return -999
  }

  let score = 0
  const locationTags = new Set(location.tags)

  npc.tagsInteresse.forEach((tag) => {
    if (locationTags.has(tag)) {
      score += 3
    }
  })

  npc.tagsAmeaca.forEach((tag) => {
    if (locationTags.has(tag)) {
      score -= Math.max(1, npc.cautela)
    }
  })

  if (npc.biomasPreferidosIds.includes(location.biomaId)) {
    score += 3
  }

  if (npc.biomasEvitadosIds.includes(location.biomaId)) {
    score -= 5
  }

  if (location.distorcao > 0) {
    score += npc.curiosidade - npc.cautela
  }

  if (location.basePossivel && npc.intencaoAtual === 'protegendo_base') {
    score += 2
  }

  score -= Math.max(0, getRiskScore(location.riscoAtual) - npc.riscoAceito)

  if (npc.memoriaSimulacao.querEncontrarPlayersNovamente) {
    score += npc.memoriaSimulacao.interesseNosPlayers
  }

  return score
}

export function TabletopWorldMundiPanel({
  campaignId,
  characters,
  factions = [],
  maps = [],
  mapPreviewById = {},
  state,
  onChange,
  onEnsureMapPlaceholders,
  onLinkMapToLocation,
  onOpenMap,
  onPrepareMap,
  onShowTransition,
}: TabletopWorldMundiPanelProps) {
  const [activeTab, setActiveTab] = useState<WorldMundiTab>('mestre')
  const [draggedPartyId, setDraggedPartyId] = useState('')
  const [draggedFactionId, setDraggedFactionId] = useState('')
  const [logFilter, setLogFilter] = useState<WorldLogFilter>('todos')
  const [logView, setLogView] = useState<WorldLogView>('mestre')
  const [manualLogText, setManualLogText] = useState('')
  const [manualClockDeltaText, setManualClockDeltaText] = useState('00:20')
  const [canonNoteText, setCanonNoteText] = useState('')
  const [contextSnapshotText, setContextSnapshotText] = useState('')
  const [, setSimulationEventRefresh] = useState(0)
  const [draggedMemberId, setDraggedMemberId] = useState('')
  const [memberSelection, setMemberSelection] = useState<string[]>([])
  const [movementMode, setMovementMode] = useState<MovementMode>('quick')
  const [movementNotice, setMovementNotice] = useState('')
  const [movementDestinationId, setMovementDestinationId] = useState('')
  const [npcJoinDraft, setNpcJoinDraft] = useState<NpcJoinDraft | null>(null)
  const [npcReleaseDraft, setNpcReleaseDraft] = useState<NpcReleaseDraft | null>(null)
  const [npcToAddId, setNpcToAddId] = useState('')
  const [reincarnationDraft, setReincarnationDraft] = useState<ReincarnationDraft | null>(null)
  const [resetCampaignText, setResetCampaignText] = useState('')
  const [resetTarget, setResetTarget] = useState<'clock' | 'campaign' | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [editorSection, setEditorSection] = useState<WorldMundiEditorSection>('locais')
  const [expandedNpcCatalogId, setExpandedNpcCatalogId] = useState('')
  const [aiPromptText, setAiPromptText] = useState('')
  const [aiDiagnosticText, setAiDiagnosticText] = useState('')
  const [ollamaConfig, setOllamaConfig] =
    useState<MundiAiProviderConfig>(DEFAULT_OLLAMA_CONFIG)
  const [ollamaStatus, setOllamaStatus] = useState('Ollama local ainda nao testado.')
  const [ollamaBusy, setOllamaBusy] = useState(false)
  const [mundiView, setMundiView] = useState<MundiView>('world')
  const [selectedBiomeId, setSelectedBiomeId] = useState('')
  const [hoveredBiomeId, setHoveredBiomeId] = useState('')
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(true)
  const [locationPopoverMode, setLocationPopoverMode] = useState<'detalhes' | 'submapas'>(
    'detalhes',
  )
  const [showBiomeNpcs, setShowBiomeNpcs] = useState(false)
  const [simulationPreview, setSimulationPreview] = useState<SimulationSuggestion[]>([])
  const [sessionNpcDrafts, setSessionNpcDrafts] = useState<Record<string, SessionNpcDraft>>({})
  const [sessionContactIds, setSessionContactIds] = useState<string[]>([])
  const [ignoredSessionContactIds, setIgnoredSessionContactIds] = useState<string[]>([])
  const [contactUndoStack, setContactUndoStack] = useState<ContactUndoSnapshot[]>([])
  const [sessionRecording, setSessionRecording] = useState(false)
  const [sessionCheckpointName, setSessionCheckpointName] = useState('Sessao atual')
  const [sessionCheckpointSummary, setSessionCheckpointSummary] = useState('')
  const [sessionCheckpointStatus, setSessionCheckpointStatus] = useState('')
  const [timePlanEntries, setTimePlanEntries] = useState<TimePlanEntry[]>([])
  const [undoStack, setUndoStack] = useState<WorldMundiState[]>([])

  useEffect(() => {
    let isMounted = true

    window.fushiDesktop
      ?.getAiConfig()
      .then((config) => {
        if (!isMounted) {
          return
        }

        setOllamaConfig({ ...DEFAULT_OLLAMA_CONFIG, ...config, provider: 'ollama' })
      })
      .catch(() => {
        if (isMounted) {
          setOllamaStatus('Config local de IA nao encontrada; usando padrao do Ollama.')
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const selectedLocation =
    state.locations.find((location) => location.id === state.selectedLocationId) ??
    state.locations[0] ??
    null
  const selectedParty = state.parties[state.selectedPartyId] ?? Object.values(state.parties)[0]
  const trackedNpcIds = useMemo(() => new Set(Object.keys(state.npcs)), [state.npcs])
  const characterById = useMemo(
    () => new Map(characters.map((character) => [character.id, character])),
    [characters],
  )
  const factionById = useMemo(
    () => new Map(factions.map((faction) => [faction.id, faction])),
    [factions],
  )
  const biomeById = useMemo(
    () => new Map(state.biomes.map((biome, index) => [biome.id, { ...biome, index }])),
    [state.biomes],
  )
  const visibleLocations = state.locations.filter(
    (location) => location.nivelDetalhe !== 'oculto',
  )
  const locationById = useMemo(
    () => new Map(state.locations.map((location) => [location.id, location])),
    [state.locations],
  )
  const activeNpcStates = useMemo(() => Object.values(state.npcs), [state.npcs])
  const realNpcCharacters = useMemo(
    () => characters.filter(isRealNpcCharacter),
    [characters],
  )
  const npcReadinessByCharacterId = useMemo(() => {
    return new Map(
      realNpcCharacters.map((character) => [
        character.id,
        validateNpcSimulationReadiness({
          character,
          npcState: state.npcs[character.id],
          world: state,
        }),
      ]),
    )
  }, [realNpcCharacters, state])
  const npcReadinessSummary = useMemo(() => {
    const entries = Array.from(npcReadinessByCharacterId.values())
    const readyCount = entries.filter((entry) => entry.status === 'ready').length
    const missingLocationCount = entries.filter(
      (entry) => entry.status === 'missing_location',
    ).length

    return {
      total: realNpcCharacters.length,
      readyCount,
      needsContextCount: entries.length - readyCount - missingLocationCount,
      missingLocationCount,
      missingInMundiCount: realNpcCharacters.filter((character) => !state.npcs[character.id])
        .length,
    }
  }, [npcReadinessByCharacterId, realNpcCharacters, state.npcs])
  const occupiedNpcCharacterIds = useMemo(
    () =>
      new Set(
        Object.values(state.corpos)
          .filter((body) => body.ocupadoPorConsciencia && body.npcOriginalId)
          .map((body) => body.npcOriginalId),
      ),
    [state.corpos],
  )
  const activeParties = useMemo(() => Object.values(state.parties), [state.parties])
  const partyNpcCharacterIds = useMemo(
    () => new Set(activeParties.flatMap((party) => party.memberCharacterIds)),
    [activeParties],
  )
  const partyEntityIds = useMemo(
    () => new Set(activeParties.flatMap((party) => party.memberEntityIds)),
    [activeParties],
  )
  const mapById = useMemo(() => new Map(maps.map((map) => [map.id, map])), [maps])
  const submapById = useMemo(
    () => new Map(state.submaps.map((submap) => [submap.id, submap])),
    [state.submaps],
  )
  const submapsByLocationId = useMemo(() => {
    const groupedSubmaps = new Map<string, WorldMundiSubmap[]>()

    state.submaps.forEach((submap) => {
      const current = groupedSubmaps.get(submap.parentLocationId) ?? []

      current.push(submap)
      groupedSubmaps.set(submap.parentLocationId, current)
    })
    groupedSubmaps.forEach((submaps, locationId) => {
      groupedSubmaps.set(
        locationId,
        [...submaps].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)),
      )
    })

    return groupedSubmaps
  }, [state.submaps])
  const selectedLocationSubmaps = useMemo(
    () =>
      selectedLocation
        ? submapsByLocationId.get(selectedLocation.id) ?? []
        : [],
    [selectedLocation, submapsByLocationId],
  )
  const entityById = useMemo(
    () => new Map(Object.values(state.entities).map((entity) => [entity.id, entity])),
    [state.entities],
  )
  const availableCharactersToAdd = characters.filter(
    (character) => !trackedNpcIds.has(character.id),
  )
  const npcsAtSelectedLocation = selectedLocation
    ? activeNpcStates.filter(
        (npc) =>
          !occupiedNpcCharacterIds.has(npc.characterId) &&
          !partyNpcCharacterIds.has(npc.characterId) &&
          npc.localAtualId === selectedLocation.id &&
          npc.presencaNoMapa !== 'inativo',
      )
    : []
  const logsAtSelectedLocation = selectedLocation
    ? state.logs.filter((log) =>
        log.texto.toLowerCase().includes(selectedLocation.nome.toLowerCase()),
      )
    : []
  function getPartyTravelPlan(originId: string, destinationId: string) {
    const destination = state.locations.find((location) => location.id === destinationId)
    const origin = state.locations.find((location) => location.id === originId)
    const routeTravelPlan = findBestTravelPlan(
      state.locations,
      state.routes,
      originId,
      destinationId,
      'players',
    )

    return (
      routeTravelPlan ??
      (destination && origin
        ? {
            destinationId: destination.id,
            destinationName: destination.nome,
            freePosition: destination.posicao,
            isFreeMovement: true,
            originId: origin.id,
            originName: origin.nome,
            risk: destination.riscoAtual || origin.riscoAtual,
            routeIds: [],
            routeNames: ['movimento livre estimado'],
            timeHours: getDistanceHours(origin, destination.posicao),
          }
        : null)
    )
  }

  const movementPreview =
    selectedParty && movementDestinationId
      ? getPartyTravelPlan(selectedParty.localAtualId, movementDestinationId)
      : null
  const totalPlannedHours =
    timePlanEntries.length > 0
      ? Math.max(...timePlanEntries.map((entry) => entry.timeHours))
      : 0
  const membersAtSelectedLocation: SelectableWorldMember[] = selectedLocation
    ? [
        ...Array.from(
          new Set(
            activeParties
              .filter((party) => party.localAtualId === selectedLocation.id)
              .flatMap((party) => party.memberPlayerIds),
          ),
        ).map((playerId) => ({
          id: `player:${playerId}`,
          kind: 'player' as const,
          label: state.players[playerId]?.nome ?? playerId.replace('player', 'Jogador '),
        })),
        ...npcsAtSelectedLocation.map((npc) => {
          const character = characterById.get(npc.characterId)
          const submapName = npc.submapAtualId ? submapById.get(npc.submapAtualId)?.nome : ''

          return {
            avatarUrl: getCharacterPortrait(character),
            id: `npc:${npc.characterId}`,
            kind: 'npc' as const,
            label: character?.nome ?? npc.characterId,
            meta: submapName || formatLabel(npc.presencaNoMapa),
          }
        }),
        ...Object.values(state.entities)
          .filter(
            (entity) =>
              entity.estado === 'ativo' &&
              !partyEntityIds.has(entity.id) &&
              entity.localAtualId === selectedLocation.id,
          )
          .map((entity) => ({
            id: `entity:${entity.id}`,
            kind: 'entity' as const,
            label: `${entity.nome} x${entity.quantidade}`,
          })),
      ]
    : []
  const filteredLogs = state.logs.filter((log) => {
    const channelMatches = logView === 'tecnico' ? log.canal === 'tecnico' : log.canal !== 'tecnico'
    const filterMatches = logFilter === 'todos' || log.categoria === logFilter

    return channelMatches && filterMatches
  })
  const simulationEvents = readWorldSimulationEvents(campaignId)
  const simulationReviewQueue = getWorldSimulationReviewQueue(campaignId)
  const simulationSessionSummary = buildWorldSimulationSessionSummary(campaignId)
  const selectedPlayersAtLocation = membersAtSelectedLocation.filter(
    (member) => member.kind === 'player',
  )
  const selectedNpcsAtLocation = membersAtSelectedLocation.filter((member) => member.kind === 'npc')
  const selectedEntitiesAtLocation = membersAtSelectedLocation.filter(
    (member) => member.kind === 'entity',
  )
  const selectedSubmapPresenceById = useMemo(() => {
    const presenceById = new Map<string, WorldPresenceMember[]>()

    if (!selectedLocation) {
      return presenceById
    }

    const addPresence = (submapId: string, member: WorldPresenceMember) => {
      if (!submapId) {
        return
      }

      const current = presenceById.get(submapId) ?? []
      current.push(member)
      presenceById.set(submapId, current)
    }

    activeParties
      .filter((party) => party.localAtualId === selectedLocation.id)
      .forEach((party) =>
        addPresence(party.submapAtualId, {
          id: `party:${party.id}`,
          kind: 'party',
          label: getPartyDisplayName(party),
          meta: getPartyMemberLabel(party, entityById, characterById),
        }),
      )
    activeNpcStates
      .filter(
        (npc) =>
          !occupiedNpcCharacterIds.has(npc.characterId) &&
          !partyNpcCharacterIds.has(npc.characterId) &&
          npc.localAtualId === selectedLocation.id &&
          npc.presencaNoMapa !== 'inativo',
      )
      .forEach((npc) => {
        const character = characterById.get(npc.characterId)

        addPresence(npc.submapAtualId, {
          avatarUrl: getCharacterPortrait(character),
          id: `npc:${npc.characterId}`,
          kind: 'npc',
          label: character?.nome ?? npc.characterId,
          meta: formatLabel(npc.presencaNoMapa),
        })
      })
    Object.values(state.entities)
      .filter(
        (entity) =>
          entity.estado === 'ativo' &&
          !partyEntityIds.has(entity.id) &&
          entity.localAtualId === selectedLocation.id,
      )
      .forEach((entity) =>
        addPresence(entity.submapAtualId, {
          id: `entity:${entity.id}`,
          kind: 'entity',
          label: `${entity.nome} x${entity.quantidade}`,
          meta: formatLabel(entity.tipo),
        }),
      )

    return presenceById
  }, [
    activeNpcStates,
    activeParties,
    characterById,
    entityById,
    occupiedNpcCharacterIds,
    partyEntityIds,
    partyNpcCharacterIds,
    selectedLocation,
    state.entities,
  ])
  const publicDiscoveredLocationIds = useMemo(
    () => new Set(state.publicMap.discoveredLocationIds),
    [state.publicMap.discoveredLocationIds],
  )
  const currentPlayerPartyLocationIds = useMemo(
    () =>
      new Set(
        activeParties
          .filter((party) => party.memberPlayerIds.length > 0)
          .map((party) => party.localAtualId)
          .filter(Boolean),
      ),
    [activeParties],
  )
  const generalMundiPoints = useMemo<GeneralMundiPoint[]>(
    () =>
      visibleLocations.map((location) => ({
        biomaId: location.biomaId,
        biomaNome: biomeById.get(location.biomaId)?.nome ?? '',
        current: currentPlayerPartyLocationIds.has(location.id),
        discovered: publicDiscoveredLocationIds.has(location.id),
        id: location.id,
        image: getMundiLocationImage(location),
        nome: location.nome,
        posicao: location.posicao,
      })),
    [biomeById, currentPlayerPartyLocationIds, publicDiscoveredLocationIds, visibleLocations],
  )
  const ignoredSessionContactIdSet = useMemo(
    () => new Set(ignoredSessionContactIds),
    [ignoredSessionContactIds],
  )
  const liveNpcContactIds = useMemo(() => {
    const contactIds = new Set<string>()
    const playerParties = activeParties.filter((party) => party.memberPlayerIds.length > 0)

    playerParties.forEach((party) => {
      activeNpcStates.forEach((npc) => {
        if (
          occupiedNpcCharacterIds.has(npc.characterId) ||
          partyNpcCharacterIds.has(npc.characterId) ||
          npc.presencaNoMapa === 'inativo' ||
          npc.presencaNoMapa === 'selado' ||
          !isSameMundiPlace(
            party.localAtualId,
            party.submapAtualId,
            npc.localAtualId,
            npc.submapAtualId,
          )
        ) {
          return
        }

        contactIds.add(npc.characterId)
      })

      activeParties.forEach((otherParty) => {
        if (
          otherParty.id === party.id ||
          otherParty.memberCharacterIds.length === 0 ||
          !isSameMundiPlace(
            party.localAtualId,
            party.submapAtualId,
            otherParty.localAtualId,
            otherParty.submapAtualId,
          )
        ) {
          return
        }

        otherParty.memberCharacterIds.forEach((characterId) => {
          const npc = state.npcs[characterId]

          if (
            npc &&
            !occupiedNpcCharacterIds.has(characterId) &&
            npc.presencaNoMapa !== 'inativo' &&
            npc.presencaNoMapa !== 'selado'
          ) {
            contactIds.add(characterId)
          }
        })
      })
    })

    return contactIds
  }, [
    activeNpcStates,
    activeParties,
    occupiedNpcCharacterIds,
    partyNpcCharacterIds,
    state.npcs,
  ])
  const sessionContactNpcs = useMemo(() => {
    const contactIds = new Set<string>([
      ...sessionContactIds,
      ...Array.from(liveNpcContactIds),
      ...Array.from(partyNpcCharacterIds),
    ])

    return Array.from(contactIds)
      .filter((characterId) => !ignoredSessionContactIdSet.has(characterId))
      .map((characterId) => state.npcs[characterId])
      .filter((npc): npc is WorldMundiNpcState => Boolean(npc))
      .sort((a, b) => {
        const nameA = characterById.get(a.characterId)?.nome ?? a.characterId
        const nameB = characterById.get(b.characterId)?.nome ?? b.characterId

        return nameA.localeCompare(nameB)
      })
  }, [
    characterById,
    ignoredSessionContactIdSet,
    liveNpcContactIds,
    partyNpcCharacterIds,
    sessionContactIds,
    state.npcs,
  ])

  function commit(updater: (currentState: WorldMundiState) => WorldMundiState) {
    onChange(createWorldMundiState(updater(state)))
  }

  function patchWaveTracker(partialWave: Partial<WorldMundiState['sessionTools']['waves']>) {
    commit((currentState) => ({
      ...currentState,
      sessionTools: {
        ...currentState.sessionTools,
        waves: {
          ...currentState.sessionTools.waves,
          ...partialWave,
        },
      },
    }))
  }

  function setCurrentWave(nextWave: number) {
    const wave = Math.max(1, Math.min(50, Math.round(nextWave)))
    const reward = getWolfWaveDefinition(wave).reward

    patchWaveTracker({
      active: true,
      currentWave: wave,
      lastReward: reward ? `${reward.title}: ${reward.mechanics}` : '',
    })
  }

  function patchXpPlayer(
    playerId: string,
    partialPlayer: Partial<WorldMundiState['sessionTools']['xp']['players'][string]>,
  ) {
    commit((currentState) => {
      const currentPlayer = currentState.sessionTools.xp.players[playerId]

      if (!currentPlayer) {
        return currentState
      }

      return {
        ...currentState,
        sessionTools: {
          ...currentState.sessionTools,
          xp: {
            ...currentState.sessionTools.xp,
            players: {
              ...currentState.sessionTools.xp.players,
              [playerId]: {
                ...currentPlayer,
                ...partialPlayer,
              },
            },
          },
        },
      }
    })
  }

  function toggleXpMark(playerId: string, markId: string, checked: boolean) {
    const player = state.sessionTools.xp.players[playerId]

    if (!player) {
      return
    }

    patchXpPlayer(playerId, {
      marks: {
        ...player.marks,
        [markId]: checked,
      },
    })
  }

  function refreshSimulationEvents() {
    setSimulationEventRefresh((current) => current + 1)
  }

  function addCanonCandidateNote() {
    const text = canonNoteText.trim()

    if (!text) {
      return
    }

    appendWorldSimulationEvent(
      campaignId,
      createWorldSimulationEvent({
        actor: 'gm',
        actorLabel: 'Mestre',
        campaignId,
        canonStatus: 'canon_candidate',
        mapId: selectedLocation?.mapId,
        sceneId: selectedLocation?.id,
        text,
        type: 'gm_note',
      }),
    )
    commit((currentState) => ({
      ...currentState,
      logs: [
        createWorldMundiLogEntry({
          dia: currentState.clock.dia,
          hora: currentState.clock.hora,
          texto: `Candidato de canon registrado: ${text}`,
          tecnico: 'Evento aguardando aprovacao no painel Canon.',
          categoria: 'sistema',
          canal: 'tecnico',
          tone: 'watch',
        }),
        ...currentState.logs,
      ],
    }))
    setCanonNoteText('')
    refreshSimulationEvents()
  }

  function markSimulationEvent(eventId: string, canonStatus: WorldSimulationCanonStatus) {
    const updatedEvent = updateWorldSimulationEventCanonStatus(campaignId, eventId, canonStatus)

    if (!updatedEvent) {
      refreshSimulationEvents()
      return
    }

    commit((currentState) => ({
      ...currentState,
      logs: [
        createWorldMundiLogEntry({
          dia: currentState.clock.dia,
          hora: currentState.clock.hora,
          texto:
            canonStatus === 'canon_approved'
              ? `Canon aprovado: ${updatedEvent.text}`
              : `Canon rejeitado: ${updatedEvent.text}`,
          tecnico: `Evento ${updatedEvent.id} marcado como ${canonStatus}. Tipo ${updatedEvent.type}. Ator ${updatedEvent.actorLabel ?? updatedEvent.actor}.`,
          categoria: 'sistema',
          canal: canonStatus === 'canon_approved' ? 'mestre' : 'tecnico',
          tone: canonStatus === 'canon_approved' ? 'steady' : 'watch',
        }),
        ...currentState.logs,
      ],
    }))
    refreshSimulationEvents()
  }

  function buildContextSnapshotPreview() {
    const snapshot = buildWorldSimulationContextSnapshot({
      campaignId,
      characters,
      mapId: selectedLocation?.mapId,
      sceneId: selectedLocation?.id,
      world: state,
    })

    setContextSnapshotText(JSON.stringify(snapshot, null, 2))
    refreshSimulationEvents()
  }

  function compactAiText(value: string | undefined, fallback = 'nao informado', maxLength = 360) {
    const normalizedValue = value?.replace(/\s+/g, ' ').trim()

    if (!normalizedValue) {
      return fallback
    }

    return normalizedValue.length > maxLength
      ? `${normalizedValue.slice(0, maxLength - 3).trim()}...`
      : normalizedValue
  }

  function getNpcPlaceLabel(npc: WorldMundiNpcState) {
    const location = locationById.get(npc.localAtualId)
    const submap = npc.submapAtualId ? submapById.get(npc.submapAtualId) : null
    const biome = location ? biomeById.get(location.biomaId) : null

    return {
      biomeName: biome?.nome ?? 'bioma desconhecido',
      locationName: location?.nome ?? 'sem local',
      submapName: submap?.nome ?? (npc.submapAtualId ? npc.submapAtualId : 'mapa principal / S0'),
    }
  }

  function inferNpcKnowledgeProfile(character: CharacterSheet | undefined, npc: WorldMundiNpcState) {
    const name = normalizeMapLookup(character?.nome ?? npc.characterId)
    const factionId = character?.faccao ?? ''
    const location = locationById.get(npc.localAtualId)
    const localText = normalizeMapLookup(
      `${character?.localAtual ?? ''} ${location?.nome ?? ''} ${npc.contextoNarrativo}`,
    )

    if (name.includes('lyrissa') || factionId === 'faction-e') {
      return 'Conhecimento inferido: leitura forte de mar, costa, navio e sobrevivencia de chegada; geografia interna da ilha deve ser tratada como parcial ate ela explorar ou receber informacao em cena.'
    }

    if (name.includes('orian')) {
      return 'Conhecimento inferido: morador/arquivo vivo da Vila; entende rotas, mapas antigos e geografia geral melhor que um recem-chegado, mas nao sabe automaticamente o estado atual de cada ponto perigoso.'
    }

    if (name.includes('seraph')) {
      return 'Conhecimento inferido: Seraph age pelo que viveu, deseja e descobriu. Qualquer gatilho oculto de cataclisma fica como risco do mestre, nao como pensamento consciente do NPC ate virar Canon revelado.'
    }

    if (name.includes('velkar')) {
      return 'Conhecimento inferido: Velkar sabe rumores, caos e pistas que encontrou; nao conhece automaticamente o passado real de Ryoku nem segredos que ainda nao obteve em cena ou Canon.'
    }

    if (name.includes('arven') || name.includes('varek')) {
      return 'Conhecimento inferido: Arven e Varek podem considerar historico mutuo e proximidade real entre eles, mas continuam limitados ao que cada um viveu, viu ou recebeu como informacao.'
    }

    if (factionId === 'faction-d' || localText.includes('vila')) {
      return 'Conhecimento inferido: conhece a Vila, arredores e rumores locais; fora disso, use memoria, logs e Canon aprovado antes de assumir certeza.'
    }

    if (factionId === 'faction-c') {
      return 'Conhecimento inferido: tem leitura estrategica, vigilancia e informacao operacional do Veu, mas segredos especificos ainda dependem de log/Canon.'
    }

    if (factionId === 'faction-a') {
      return 'Conhecimento inferido: conhece disciplina, rotas de treino e sinais de FUSHI ligados ao proprio eixo narrativo; faccao nao prende local nem vontade.'
    }

    if (factionId === 'faction-f' || npc.presencaNoMapa === 'selado') {
      return 'Conhecimento inferido: leitura profunda do proprio dominio/selo; autonomia limitada enquanto estiver selado ou pausado por contexto.'
    }

    return 'Conhecimento inferido: use apenas local atual, memoria curta, objetivo, logs e Canon aprovado; nao ha permissao para inventar geografia pessoal.'
  }

  function hasNpcDirectPlayerContext(npc: WorldMundiNpcState) {
    return (
      sessionContactIds.includes(npc.characterId) ||
      liveNpcContactIds.has(npc.characterId) ||
      npc.estadoSimulacao === 'em_cena_com_players' ||
      npc.estadoSimulacao === 'acompanhando_grupo' ||
      npc.memoriaSimulacao.querEncontrarPlayersNovamente ||
      npc.memoriaSimulacao.interesseNosPlayers > 0
    )
  }

  function sanitizeNpcPrivateKnowledgeText(
    value: string | undefined,
    npc: WorldMundiNpcState,
    fallback: string,
  ) {
    const rawText = value?.replace(/\s+/g, ' ').trim()

    if (!rawText) {
      return { blocked: [] as string[], text: fallback }
    }

    const blocked: string[] = []
    let safeText = rawText

    if (!hasNpcDirectPlayerContext(npc)) {
      const beforePlayerMeta = safeText
      safeText = safeText
        .replace(/preparar\s+(os\s+)?protagonistas[^.?!;|]*/gi, '')
        .replace(/protagonistas?[^.?!;|]*/gi, '')
        .replace(/\bplayers?\b[^.?!;|]*/gi, '')

      if (beforePlayerMeta !== safeText) {
        blocked.push('trecho de protagonistas/players removido porque o NPC ainda nao teve contato real')
      }
    }

    const hiddenBefore = safeText
    safeText = safeText
      .replace(/gatilho\s+oculto[^.?!;|]*/gi, '')
      .replace(/cataclisma\s+oculto[^.?!;|]*/gi, '')
      .replace(/poder\s+oculto[^.?!;|]*/gi, '')
      .replace(/passado\s+real\s+de\s+Ryoku[^.?!;|]*/gi, '')

    if (hiddenBefore !== safeText) {
      blocked.push('trecho de plot oculto removido da leitura interna do NPC')
    }

    const compacted = safeText.replace(/\s+([.;,|])/g, '$1').replace(/\s{2,}/g, ' ').trim()

    return {
      blocked,
      text: compacted || fallback,
    }
  }

  function getPromptNpcMatches(prompt: string) {
    const promptLookup = normalizeMapLookup(prompt)

    if (!promptLookup) {
      return []
    }

    return activeNpcStates
      .map((npc) => {
        const character = characterById.get(npc.characterId)
        const nameLookup = normalizeMapLookup(character?.nome ?? npc.characterId)
        const idLookup = normalizeMapLookup(npc.characterId)
        const score =
          promptLookup.includes(nameLookup) || promptLookup.includes(idLookup)
            ? 3
            : nameLookup
                .split('_')
                .filter((part) => part.length >= 3)
                .some((part) => promptLookup.includes(part))
              ? 1
              : 0

        return score > 0 ? { character, npc, score } : null
      })
      .filter(
        (entry): entry is { character: CharacterSheet | undefined; npc: WorldMundiNpcState; score: number } =>
          entry !== null,
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }

  function buildNpcFocusAnswer(prompt: string) {
    const matches = getPromptNpcMatches(prompt)

    if (matches.length === 0) {
      return []
    }

    const lines = [
      `Resposta factual da IA local - ${new Date().toISOString()}`,
      '',
      `Pergunta: ${prompt}`,
      '',
      'Leis usadas:',
      '- Nao inventar fato: se nao esta no MUN, ficha, memoria, log ou Canon, fica como inferencia/revisao.',
      '- Nao mover NPC nem alterar memoria sem botao de aplicar/aprovacao.',
      '- Prioridade narrativa do personagem vem antes de faccao.',
      '- Conhecimento do mestre e plot oculto nao entram na mente do NPC antes de contato, descoberta ou Canon revelado.',
      '- NPC pode atravessar ponto com puzzle/recompensa, mas nao consome recompensa criada para jogadores sem aprovacao manual.',
      '',
    ]

    matches.forEach(({ character, npc }, index) => {
      const faction = character?.faccao ? factionById.get(character.faccao) : null
      const party = activeParties.find((entry) => entry.memberCharacterIds.includes(npc.characterId))
      const place = getNpcPlaceLabel(npc)
      const latestNpcLogs = state.logs
        .filter((log) => {
          const name = character?.nome ?? npc.characterId

          return log.texto.includes(name) || log.tecnico.includes(name)
        })
        .slice(0, 3)
      const rawCurrentAction =
        npc.objetivoAtual ||
        npc.ultimoLog ||
        npc.comportamentoResumo ||
        character?.descricao?.objetivo ||
        'sem acao objetiva cadastrada'
      const rawReason =
        npc.objetivoMacro ||
        character?.descricao?.objetivo ||
        npc.contextoNarrativo ||
        character?.notas ||
        'motivo ainda nao confirmado no contexto'
      const currentAction = sanitizeNpcPrivateKnowledgeText(
        rawCurrentAction,
        npc,
        'sem acao objetiva cadastrada',
      )
      const reason = sanitizeNpcPrivateKnowledgeText(
        rawReason,
        npc,
        'motivo ainda nao confirmado no contexto',
      )
      const travelDestination =
        locationById.get(npc.viagemDestinoId)?.nome ?? npc.viagemDestinoId
      const nextAction =
        npc.presencaNoMapa === 'selado'
          ? 'permanece travado pelo selo ate uma condicao de historia liberar.'
          : npc.emViagem
            ? `continua viagem para ${travelDestination || 'destino pendente'}.`
            : npc.objetivoAtual
              ? `tende a continuar: ${currentAction.text}`
              : 'precisa de aprovacao do mestre ou objetivo preenchido antes de agir de forma autonoma.'
      const blockedKnowledge = Array.from(new Set([...currentAction.blocked, ...reason.blocked]))

      lines.push(
        `${index + 1}. ${character?.nome ?? npc.characterId}`,
        `Local real: ${place.biomeName} > ${place.locationName} > ${place.submapName}.`,
        `Faccao: ${faction?.nome ?? character?.faccao ?? 'sem faccao'}; estado: ${formatLabel(npc.presencaNoMapa)} / ${formatLabel(npc.estadoSimulacao)}; intencao: ${formatLabel(npc.intencaoAtual)}.`,
        party ? `Grupo atual: ${getPartyDisplayName(party)} (${getPartyMemberLabel(party, entityById, characterById)}).` : 'Grupo atual: nenhum; esta como presenca solta do MUN.',
        `O que esta fazendo: ${compactAiText(currentAction.text)}.`,
        `Por que isso faz sentido: ${compactAiText(reason.text, 'sem motivo confirmado')}.`,
        `Possivel proxima acao: ${compactAiText(nextAction)}.`,
        inferNpcKnowledgeProfile(character, npc),
        blockedKnowledge.length > 0
          ? `Bloqueio de metaconhecimento: ${blockedKnowledge.join(' | ')}.`
          : 'Bloqueio de metaconhecimento: nada removido nesta resposta.',
        `Memoria curta: ${
          npc.memoriaSimulacao.memoriaCurta.length > 0
            ? npc.memoriaSimulacao.memoriaCurta.slice(0, 3).join(' | ')
            : 'sem memoria curta registrada'
        }.`,
        `Logs recentes: ${
          latestNpcLogs.length > 0
            ? latestNpcLogs
                .map((log) => `Dia ${log.dia} ${formatClockTime(log.hora)} - ${log.texto}`)
                .join(' | ')
            : 'sem log especifico recente'
        }.`,
        '',
      )
    })

    lines.push(
      'Acao segura disponivel:',
      '- Se voce concordar com esta leitura, use "Aplicar resposta como nota" para mandar isso para a fila de Canon, onde ainda precisa ser aprovado.',
    )

    return lines
  }

  function buildGeneralAiDiagnostic(snapshotGeneratedAt: string) {
    const groupedNpcIds = new Set(activeParties.flatMap((party) => party.memberCharacterIds))
    const livingNpcCount = activeNpcStates.filter((npc) => npc.presencaNoMapa !== 'inativo').length
    const sealedNpcCount = activeNpcStates.filter((npc) => npc.presencaNoMapa === 'selado').length
    const activePlayerGroups = activeParties.filter((party) => party.memberPlayerIds.length > 0)
    const crowdedPlaces = state.locations
      .map((location) => {
        const looseNpcs = activeNpcStates.filter(
          (npc) =>
            npc.localAtualId === location.id &&
            npc.presencaNoMapa !== 'inativo' &&
            !groupedNpcIds.has(npc.characterId),
        )
        const groups = activeParties.filter((party) => party.localAtualId === location.id)

        return {
          location,
          looseNpcs,
          groups,
          total: looseNpcs.length + groups.length,
        }
      })
      .filter((entry) => entry.total >= 3)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
    const contactNames = sessionContactNpcs.map(
      (npc) => characterById.get(npc.characterId)?.nome ?? npc.characterId,
    )
    const pendingQuestions = [
      simulationSessionSummary.candidateCount > 0
        ? `${simulationSessionSummary.candidateCount} evento(s) aguardando Canon.`
        : '',
      ignoredSessionContactIds.length > 0
        ? `${ignoredSessionContactIds.length} contato(s) marcados como nao encontrados nesta sessao.`
        : '',
      npcReadinessSummary.needsContextCount > 0
        ? `${npcReadinessSummary.needsContextCount} NPC(s) ainda precisam de contexto extra.`
        : '',
    ].filter(Boolean)
    const lines = [
      `Diagnostico IA local - ${snapshotGeneratedAt}`,
      '',
      `Pergunta do mestre: ${aiPromptText.trim() || 'sem pergunta especifica'}`,
      `Relogio: Dia ${state.clock.dia}, ${formatClockTime(state.clock.hora)}.`,
      `Local selecionado: ${selectedLocation?.nome ?? 'nenhum'}.`,
      `NPCs vivos no MUN: ${livingNpcCount}; selados: ${sealedNpcCount}; em grupo: ${groupedNpcIds.size}.`,
      `Grupos com jogadores: ${activePlayerGroups
        .map((party) => {
          const location = locationById.get(party.localAtualId)
          const submap = party.submapAtualId ? submapById.get(party.submapAtualId) : null

          return `${getPartyDisplayName(party)} em ${location?.nome ?? 'sem local'}${
            submap ? ` / ${submap.codigo}` : ''
          } (${getPartyMemberLabel(party, entityById, characterById)})`
        })
        .join(' | ') || 'nenhum'}.`,
      `Contatos reais da Historia: ${contactNames.join(', ') || 'nenhum nesta sessao'}.`,
      `Fila Canon: ${simulationSessionSummary.candidateCount} pendente(s), ${simulationSessionSummary.approvedCount} aprovado(s), ${simulationSessionSummary.rejectedCount} rejeitado(s).`,
      '',
      'Locais densos / risco de conflito de contexto:',
      ...crowdedPlaces.map((entry) => {
        const npcNames = entry.looseNpcs
          .map((npc) => characterById.get(npc.characterId)?.nome ?? npc.characterId)
          .join(', ')
        const groupNames = entry.groups.map(getPartyDisplayName).join(', ')

        return `- ${entry.location.nome}: ${entry.total} presenca(s). NPCs: ${npcNames || 'nenhum'}; grupos: ${groupNames || 'nenhum'}.`
      }),
      crowdedPlaces.length === 0 ? '- Nenhum ponto com 3+ presencas.' : '',
      '',
      'Alertas objetivos:',
      ...(pendingQuestions.length > 0 ? pendingQuestions.map((entry) => `- ${entry}`) : ['- Nenhum alerta critico local.']),
      '',
      'Regra de seguranca: este painel comprime o MUN e aponta incoerencias, mas nao move NPC nem transforma sugestao em Canon sem aprovacao do mestre.',
    ]

    return lines
  }

  function buildAiWorldDiagnostic() {
    const prompt = aiPromptText.trim()
    const snapshot = buildWorldSimulationContextSnapshot({
      campaignId,
      characters,
      mapId: selectedLocation?.mapId,
      sceneId: selectedLocation?.id,
      world: state,
    })
    const npcFocusAnswer = buildNpcFocusAnswer(prompt)
    const lines =
      npcFocusAnswer.length > 0 ? npcFocusAnswer : buildGeneralAiDiagnostic(snapshot.generatedAt)

    setAiDiagnosticText(lines.filter((line, index, array) => line || array[index - 1] !== '').join('\n'))
    setContextSnapshotText(JSON.stringify(snapshot, null, 2))
  }

  function buildOllamaMundiContext() {
    const groupedNpcIds = new Set(activeParties.flatMap((party) => party.memberCharacterIds))
    const snapshot = buildWorldSimulationContextSnapshot({
      campaignId,
      characters,
      mapId: selectedLocation?.mapId,
      sceneId: selectedLocation?.id,
      world: state,
    })

    return {
      clock: state.clock,
      selectedLocationId: selectedLocation?.id ?? '',
      selectedLocationName: selectedLocation?.nome ?? '',
      playerGroups: activeParties
        .filter((party) => party.memberPlayerIds.length > 0)
        .map((party) => ({
          id: party.id,
          members: getPartyMemberLabel(party, entityById, characterById),
          name: getPartyDisplayName(party),
          locationId: party.localAtualId,
          locationName: locationById.get(party.localAtualId)?.nome ?? party.localAtualId,
          submapId: party.submapAtualId,
        })),
      looseNpcs: activeNpcStates
        .filter((npc) => npc.presencaNoMapa !== 'inativo' && !groupedNpcIds.has(npc.characterId))
        .map((npc) => {
          const character = characterById.get(npc.characterId)
          const location = locationById.get(npc.localAtualId)
          const submap = npc.submapAtualId ? submapById.get(npc.submapAtualId) : null
          const faction = character?.faccao ? factionById.get(character.faccao) : null

          return {
            id: npc.characterId,
            name: character?.nome ?? npc.characterId,
            faction: faction?.nome ?? character?.faccao ?? '',
            locationId: npc.localAtualId,
            locationName: location?.nome ?? npc.localAtualId,
            submapId: npc.submapAtualId,
            submapName: submap?.nome ?? '',
            presence: npc.presencaNoMapa,
            state: npc.estadoSimulacao,
            intention: npc.intencaoAtual,
            currentGoal: compactAiText(npc.objetivoAtual || character?.descricao?.objetivo, '', 260),
            macroGoal: compactAiText(npc.objetivoMacro || character?.notas, '', 260),
            narrativeContext: compactAiText(npc.contextoNarrativo, '', 260),
            shortMemory: npc.memoriaSimulacao.memoriaCurta.slice(-4),
            trends: npc.tendencias.slice(0, 4),
            canonLimits: npc.memoriaSimulacao.limitesCanon.slice(0, 4),
            isTraveling: npc.emViagem,
            travelDestinationId: npc.viagemDestinoId,
          }
        }),
      locations: state.locations.map((location) => ({
        id: location.id,
        name: location.nome,
        biomeId: location.biomaId,
        type: location.tipo,
        risk: location.riscoAtual,
        fushi: location.estabilidadeFushi,
        distortion: location.distorcao,
        summary: compactAiText(location.descricaoInicial, '', 220),
        submaps: (submapsByLocationId.get(location.id) ?? []).map((submap) => ({
          id: submap.id,
          name: submap.nome,
          status: submap.status,
        })),
      })),
      routes: state.routes.map((route) => ({
        id: route.id,
        fromId: route.origemId,
        toId: route.destinoId,
        name: `${locationById.get(route.origemId)?.nome ?? route.origemId} -> ${
          locationById.get(route.destinoId)?.nome ?? route.destinoId
        }`,
        risk: route.risco,
        timeHoursNpc: route.tempoNpcHoras,
        timeHoursPlayers: route.tempoPlayersHoras,
      })),
      recentLogs: state.logs.slice(0, 25).map((log) => ({
        channel: log.canal,
        day: log.dia,
        hour: log.hora,
        text: log.texto,
        technical: log.tecnico,
      })),
      canonQueue: snapshot.recentEvents.slice(-25),
      guardrails: [
        'Responda so com fatos presentes neste JSON ou inferencias explicitamente marcadas.',
        'Nao coloque conhecimento de plot oculto dentro da mente de NPC antes de log/Canon revelar.',
        'Nao consuma itens, puzzles ou recompensas destinados aos jogadores sem aprovacao do mestre.',
        'Sugestoes de movimento precisam ser revisadas e aplicadas manualmente pelo mestre.',
      ],
    }
  }

  async function saveOllamaConfig(nextConfig = ollamaConfig) {
    if (!window.fushiDesktop?.saveAiConfig) {
      setOllamaStatus('IA local so fica disponivel no app desktop.')
      return null
    }

    const result = await window.fushiDesktop.saveAiConfig(nextConfig)

    if (result.ok) {
      setOllamaConfig({ ...DEFAULT_OLLAMA_CONFIG, ...result.config, provider: 'ollama' })
      setOllamaStatus('Config do Ollama salva.')
      return result.config
    }

    setOllamaStatus(result.error || 'Nao foi possivel salvar o Ollama.')
    return null
  }

  async function testOllamaLocal() {
    if (!window.fushiDesktop?.testOllama) {
      setOllamaStatus('IA local so fica disponivel no app desktop.')
      return
    }

    setOllamaBusy(true)
    try {
      const savedConfig = await saveOllamaConfig()
      const result = await window.fushiDesktop.testOllama(savedConfig ?? ollamaConfig)

      if (!result.ok) {
        setOllamaStatus(result.error || 'Nao consegui encontrar o Ollama local.')
        return
      }

      const modelList = result.models?.length ? result.models.slice(0, 4).join(', ') : 'sem modelos listados'
      setOllamaStatus(`Ollama conectado. Modelos: ${modelList}.`)
    } finally {
      setOllamaBusy(false)
    }
  }

  async function runOllamaMessages(messages: Array<{ content: string; role: 'system' | 'user' | 'assistant' }>) {
    if (!window.fushiDesktop?.runOllamaChat) {
      return {
        error: 'IA local so fica disponivel no app desktop.',
        ok: false,
        text: '',
      }
    }

    const savedConfig = await saveOllamaConfig()
    const result = await window.fushiDesktop.runOllamaChat({
      config: savedConfig ?? ollamaConfig,
      messages,
    })

    return {
      error: result.error || undefined,
      ok: result.ok,
      text: result.text ?? '',
    }
  }

  async function askOllamaDiagnostic() {
    const prompt = aiPromptText.trim() || 'Faça uma leitura objetiva do estado atual do MUN.'
    const context = buildOllamaMundiContext()

    setOllamaBusy(true)
    setOllamaStatus('Ollama pensando sobre o MUN...')
    try {
      const result = await runOllamaMessages([
        {
          role: 'system',
          content:
            'Voce e o assistente factual do MUN FUSHI. Responda em PT-BR, com base apenas no JSON recebido. Se faltar dado, diga que falta dado. Nao mova NPC, nao aprove Canon e nao antecipe plot oculto.',
        },
        {
          role: 'user',
          content: JSON.stringify(
            {
              perguntaDoMestre: prompt,
              contextoMUN: context,
            },
            null,
            2,
          ),
        },
      ])

      if (!result.ok || !result.text.trim()) {
        setOllamaStatus(result.error || 'Ollama nao retornou resposta.')
        return
      }

      setAiDiagnosticText(result.text.trim())
      setContextSnapshotText(JSON.stringify(context, null, 2))
      setOllamaStatus('Resposta Ollama pronta. Nada foi aplicado automaticamente.')
    } finally {
      setOllamaBusy(false)
    }
  }

  function parseOllamaJsonArray(text: string) {
    const candidates: string[] = []
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)

    if (fenced?.[1]) {
      candidates.push(fenced[1])
    }

    const firstArray = text.indexOf('[')
    const lastArray = text.lastIndexOf(']')

    if (firstArray >= 0 && lastArray > firstArray) {
      candidates.push(text.slice(firstArray, lastArray + 1))
    }

    const firstObject = text.indexOf('{')
    const lastObject = text.lastIndexOf('}')

    if (firstObject >= 0 && lastObject > firstObject) {
      candidates.push(text.slice(firstObject, lastObject + 1))
    }

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as unknown

        if (Array.isArray(parsed)) {
          return parsed
        }

        if (
          parsed &&
          typeof parsed === 'object' &&
          Array.isArray((parsed as { suggestions?: unknown }).suggestions)
        ) {
          return (parsed as { suggestions: unknown[] }).suggestions
        }
      } catch {
        // tenta o proximo candidato
      }
    }

    return []
  }

  function coerceOllamaSimulationSuggestion(
    input: unknown,
    baselineByNpc: Map<string, SimulationSuggestion>,
    npcHours: number,
  ): SimulationSuggestion | null {
    if (!input || typeof input !== 'object') {
      return null
    }

    const raw = input as OllamaSimulationWireSuggestion
    const characterId = typeof raw.characterId === 'string' ? raw.characterId : ''
    const baseline = baselineByNpc.get(characterId)
    const npc = state.npcs[characterId]

    if (!baseline || !npc) {
      return null
    }

    const rawAction = typeof raw.action === 'string' ? raw.action : baseline.action
    const action: SimulationSuggestion['action'] =
      rawAction === 'move' || rawAction === 'stay' || rawAction === 'traveling' || rawAction === 'paused'
        ? rawAction
        : baseline.action
    const rawToId = typeof raw.toId === 'string' ? raw.toId : baseline.toId
    const toLocation = locationById.get(rawToId) ?? locationById.get(baseline.toId)
    const fromLocation = locationById.get(baseline.fromId)
    const rawIntention = typeof raw.intention === 'string' ? raw.intention : baseline.intention
    const intention = WORLD_MUNDI_INTENTIONS.includes(
      rawIntention as WorldMundiNpcState['intencaoAtual'],
    )
      ? (rawIntention as WorldMundiNpcState['intencaoAtual'])
      : npc.intencaoAtual
    const rawTimeUsed = Number(raw.timeUsed)
    const timeUsed = Number.isFinite(rawTimeUsed)
      ? Math.max(0, Math.min(npcHours, rawTimeUsed))
      : baseline.timeUsed
    const rawRemainingHours = Number(raw.remainingHours)
    const remainingHours =
      action === 'traveling'
        ? Number.isFinite(rawRemainingHours)
          ? Math.max(0, rawRemainingHours)
          : baseline.remainingHours
        : 0
    const routeNames = Array.isArray(raw.routeNames)
      ? raw.routeNames.map((entry) => String(entry)).filter(Boolean).slice(0, 5)
      : baseline.routeNames
    const fallbackActionText =
      action === 'move'
        ? `Vai para ${toLocation?.nome ?? baseline.toName}.`
        : action === 'traveling'
          ? `Inicia viagem para ${toLocation?.nome ?? baseline.toName}.`
          : baseline.actionText

    return {
      action,
      actionText:
        typeof raw.actionText === 'string' && raw.actionText.trim()
          ? raw.actionText.trim().slice(0, 220)
          : fallbackActionText,
      characterId,
      fromId: baseline.fromId,
      fromName: fromLocation?.nome ?? baseline.fromName,
      intention,
      motivation:
        typeof raw.motivation === 'string' && raw.motivation.trim()
          ? raw.motivation.trim().slice(0, 520)
          : baseline.motivation,
      nextTrend:
        typeof raw.nextTrend === 'string' && raw.nextTrend.trim()
          ? raw.nextTrend.trim().slice(0, 260)
          : baseline.nextTrend,
      remainingHours,
      risk:
        typeof raw.risk === 'string' && raw.risk.trim()
          ? raw.risk.trim().slice(0, 80)
          : toLocation?.riscoAtual ?? baseline.risk,
      routeNames,
      timeUsed,
      toId: toLocation?.id ?? baseline.toId,
      toName: toLocation?.nome ?? baseline.toName,
    }
  }

  async function buildOllamaSimulationPreview(hours: number) {
    const window = getNpcSimulationWindow(hours)

    if (window.turnCount === 0) {
      setSimulationPreview([])
      setMovementNotice(
        `Janela de ${formatHours(window.playerHours)} nao cria novo estado autonomo. Use ${formatHours(NPC_SIMULATION_TURN_HOURS)} ou mais.`,
      )
      return
    }

    const baseline = createSimulationSuggestions(window.npcHours)
    const baselineByNpc = new Map(baseline.map((suggestion) => [suggestion.characterId, suggestion]))

    setOllamaBusy(true)
    setOllamaStatus('Ollama simulando NPCs soltos...')
    try {
      const result = await runOllamaMessages([
        {
          role: 'system',
          content:
            'Voce e o motor local de simulacao do MUN FUSHI. Responda SOMENTE JSON valido. Nao escreva explicacao. Use apenas characterId e toId existentes no contexto. Nao revele plot oculto para NPC. Nao mate, nao consuma recompensa de jogador, nao aprove Canon.',
        },
        {
          role: 'user',
          content: JSON.stringify(
            {
              tarefa:
                'Revise a previa deterministica e devolva um array JSON de sugestoes. Campos por item: characterId, action(move|stay|traveling|paused), toId, intention, motivation, nextTrend, actionText, routeNames, timeUsed, remainingHours, risk.',
              janela: {
                horasJogadores: window.playerHours,
                horasNpc: window.npcHours,
                turnos: window.turnCount,
              },
              contextoMUN: buildOllamaMundiContext(),
              previaDeterministica: baseline,
            },
            null,
            2,
          ),
        },
      ])

      if (!result.ok || !result.text.trim()) {
        setSimulationPreview(baseline)
        setOllamaStatus(
          `${result.error || 'Ollama nao retornou JSON.'} Mantive a previa local deterministica.`,
        )
        return
      }

      const parsedSuggestions = parseOllamaJsonArray(result.text)
        .map((entry) => coerceOllamaSimulationSuggestion(entry, baselineByNpc, window.npcHours))
        .filter((entry): entry is SimulationSuggestion => Boolean(entry))

      if (parsedSuggestions.length === 0) {
        setSimulationPreview(baseline)
        setOllamaStatus('Ollama nao retornou sugestoes validas; mantive a previa local.')
        return
      }

      const mergedSuggestions = baseline.map(
        (suggestion) =>
          parsedSuggestions.find((entry) => entry.characterId === suggestion.characterId) ??
          suggestion,
      )

      setSimulationPreview(mergedSuggestions)
      setAiDiagnosticText(result.text.trim())
      setContextSnapshotText(JSON.stringify(buildOllamaMundiContext(), null, 2))
      setMovementNotice(
        `Previa Ollama criada: ${formatHours(window.playerHours)} de mundo = ${formatHours(window.npcHours)} para NPCs. Revise antes de aplicar.`,
      )
      setOllamaStatus('Previa Ollama pronta. Nada foi aplicado automaticamente.')
    } finally {
      setOllamaBusy(false)
    }
  }

  function applyAiAnswerAsCanonCandidate() {
    const text = aiDiagnosticText.trim()

    if (!text) {
      setMovementNotice('Gere uma resposta da IA antes de aplicar como nota.')
      return
    }

    appendWorldSimulationEvent(
      campaignId,
      createWorldSimulationEvent({
        actor: 'gm',
        actorLabel: 'Mestre',
        campaignId,
        canonStatus: 'canon_candidate',
        mapId: selectedLocation?.mapId,
        sceneId: selectedLocation?.id,
        text: `Resposta IA para revisao: ${text.slice(0, 1400)}`,
        type: 'gm_note',
      }),
    )
    commit((currentState) => ({
      ...currentState,
      logs: [
        createWorldMundiLogEntry({
          dia: currentState.clock.dia,
          hora: currentState.clock.hora,
          texto: 'Resposta da IA enviada para revisao de Canon.',
          tecnico: text.slice(0, 1800),
          categoria: 'sistema',
          canal: 'tecnico',
          tone: 'watch',
        }),
        ...currentState.logs,
      ],
    }))
    refreshSimulationEvents()
    setMovementNotice('Resposta enviada como candidato de Canon; revise antes de aprovar.')
  }

  function setPublicMundiReleased(releasedToPlayers: boolean) {
    commit((currentState) => ({
      ...currentState,
      publicMap: {
        ...currentState.publicMap,
        releasedToPlayers,
      },
    }))
  }

  function setPublicBaseReleased(releasedToPlayers: boolean) {
    commit((currentState) => ({
      ...currentState,
      playerBase: {
        ...currentState.playerBase,
        releasedToPlayers,
      },
      logs: [
        createWorldMundiLogEntry({
          dia: currentState.clock.dia,
          hora: currentState.clock.hora,
          texto: releasedToPlayers
            ? 'BASE liberada para os jogadores.'
            : 'BASE ocultada dos jogadores.',
          tecnico:
            'Estado publico da base atualizado. Upgrades e efeitos continuam controlados pelo mestre.',
          categoria: 'sistema',
          canal: 'mestre',
          tone: 'steady',
        }),
        ...currentState.logs,
      ],
    }))
  }

  function selectPlayerBase(baseId: string) {
    commit((currentState) => {
      const targetBase =
        currentState.playerBase.bases.find((base) => base.id === baseId) ??
        currentState.playerBase.bases[0]

      return {
        ...currentState,
        playerBase: {
          ...currentState.playerBase,
          selectedBaseId: targetBase?.id ?? currentState.playerBase.selectedBaseId,
          anchorLocationId: targetBase?.locationId ?? currentState.playerBase.anchorLocationId,
          selectedUpgradeId: targetBase?.selectedUpgradeId ?? currentState.playerBase.selectedUpgradeId,
          upgrades: targetBase?.upgrades ?? currentState.playerBase.upgrades,
        },
      }
    })
  }

  function setBaseUpgradeStatus(
    baseId: string,
    upgradeId: string,
    status: WorldMundiBaseUpgradeStatus,
  ) {
    commit((currentState) => {
      const targetBase =
        currentState.playerBase.bases.find((base) => base.id === baseId) ??
        currentState.playerBase.bases[0]
      const targetUpgrade = targetBase?.upgrades.find((upgrade) => upgrade.id === upgradeId)
      const nextBases = currentState.playerBase.bases.map((base) =>
        base.id === targetBase?.id
          ? {
              ...base,
              selectedUpgradeId: upgradeId,
              upgrades: base.upgrades.map((upgrade) =>
                upgrade.id === upgradeId ? { ...upgrade, status } : upgrade,
              ),
            }
          : base,
      )
      const nextSelectedBase =
        nextBases.find((base) => base.id === targetBase?.id) ?? nextBases[0]

      return {
        ...currentState,
        playerBase: {
          ...currentState.playerBase,
          selectedBaseId: nextSelectedBase?.id ?? currentState.playerBase.selectedBaseId,
          anchorLocationId: nextSelectedBase?.locationId ?? currentState.playerBase.anchorLocationId,
          selectedUpgradeId: upgradeId,
          upgrades: nextSelectedBase?.upgrades ?? currentState.playerBase.upgrades,
          bases: nextBases,
        },
        logs: [
          createWorldMundiLogEntry({
            dia: currentState.clock.dia,
            hora: currentState.clock.hora,
            texto: `BASE (${targetBase?.nome ?? baseId}): ${targetUpgrade?.nome ?? upgradeId} marcado como ${getBaseStatusLabel(status)}.`,
            tecnico:
              targetUpgrade?.efeitoMesa ??
              'Upgrade de base atualizado pelo mestre.',
            categoria: 'sistema',
            canal: 'mestre',
            tone: status === 'ativo' ? 'steady' : 'watch',
          }),
          ...currentState.logs,
        ],
      }
    })
  }

  function togglePublicMundiLocation(locationId: string) {
    commit((currentState) => {
      const discoveredSet = new Set(currentState.publicMap.discoveredLocationIds)

      if (discoveredSet.has(locationId)) {
        discoveredSet.delete(locationId)
      } else {
        discoveredSet.add(locationId)
      }

      return {
        ...currentState,
        publicMap: {
          ...currentState.publicMap,
          discoveredLocationIds: Array.from(discoveredSet),
        },
        selectedLocationId: locationId,
      }
    })
  }

  function patchLocation(locationId: string, partialLocation: Partial<WorldMundiLocation>) {
    commit((currentState) => ({
      ...currentState,
      locations: currentState.locations.map((location) =>
        location.id === locationId
          ? createWorldMundiLocation({
              ...location,
              ...partialLocation,
              posicao: {
                ...location.posicao,
                ...partialLocation.posicao,
              },
            })
          : location,
      ),
    }))
  }

  function findExistingMapForLocation(location: WorldMundiLocation) {
    const request = buildMapPlaceholderRequest(location, state.biomes)
    const locationSlug = normalizeMapLookup(location.nome)

    return (
      maps.find((map) => map.munLocationId === location.id) ??
      maps.find((map) => map.id === request.mapId) ??
      maps.find((map) => {
        const mapSlug = normalizeMapLookup(map.name)
        const biomeMatches = !map.biomeId || map.biomeId === location.biomaId

        return biomeMatches && (mapSlug === locationSlug || mapSlug.includes(locationSlug))
      }) ??
      null
    )
  }

  function linkMapToLocation(
    location: WorldMundiLocation,
    mapId: string,
    mapStatus: WorldMundiLocation['mapStatus'] = 'customizado',
  ) {
    const request = buildMapPlaceholderRequest(location, state.biomes)

    patchLocation(location.id, {
      hasMap: true,
      mapFolderId: location.mapFolderId || request.folderId,
      mapId,
      mapStatus,
    })
    onLinkMapToLocation?.(mapId, location.id)
  }

  function patchRoute(routeId: string, partialRoute: Partial<WorldMundiRoute>) {
    commit((currentState) => ({
      ...currentState,
      routes: currentState.routes.map((route) =>
        route.id === routeId ? createWorldMundiRoute({ ...route, ...partialRoute }) : route,
      ),
    }))
  }

  function patchNpc(characterId: string, partialNpc: Partial<WorldMundiNpcState>) {
    commit((currentState) => {
      const existingNpc = currentState.npcs[characterId]

      if (!existingNpc) {
        return currentState
      }

      return {
        ...currentState,
        npcs: {
          ...currentState.npcs,
          [characterId]: createWorldMundiNpcState({
            ...existingNpc,
            ...partialNpc,
            characterId,
          }),
        },
      }
    })
  }

  function getDefaultActiveSubmapIds(location: WorldMundiLocation, submaps: WorldMundiSubmap[]) {
    const defaultIds = [MAIN_SUBMAP_KEY]
    const configuredDefaultIds = DEFAULT_ACTIVE_SUBMAP_BY_LOCATION_ID[location.id]

    if (configuredDefaultIds) {
      const availableDefaultIds = configuredDefaultIds.filter((submapId) =>
        submaps.some((submap) => submap.id === submapId),
      )

      if (availableDefaultIds.length > 0) {
        return availableDefaultIds
      }
    }

    if (location.id === 'vila_conhecimento_absorvido') {
      return [
        ...defaultIds,
        ...submaps.filter((submap) => submap.tipo === 'memoria').map((submap) => submap.id),
      ]
    }

    return defaultIds
  }

  function getActiveSubmapIdsForLocation(location: WorldMundiLocation, submaps: WorldMundiSubmap[]) {
    const availableSubmapIds = new Set(submaps.map((submap) => submap.id))
    const activeIds = location.activeSubmapIds.filter((submapId) =>
      submapId === MAIN_SUBMAP_KEY || availableSubmapIds.has(submapId),
    )

    if (SUBMAP_ONLY_LOCATION_IDS.has(location.id)) {
      const submapOnlyActiveIds = activeIds.filter((submapId) => submapId !== MAIN_SUBMAP_KEY)

      return submapOnlyActiveIds.length > 0
        ? submapOnlyActiveIds
        : getDefaultActiveSubmapIds(location, submaps)
    }

    return activeIds.length > 0 ? activeIds : getDefaultActiveSubmapIds(location, submaps)
  }

  function toggleSubmapActive(location: WorldMundiLocation, submapId: string) {
    if (SUBMAP_ONLY_LOCATION_IDS.has(location.id) && submapId === MAIN_SUBMAP_KEY) {
      return
    }

    const locationSubmaps = submapsByLocationId.get(location.id) ?? []
    const currentIds = getActiveSubmapIdsForLocation(location, locationSubmaps)
    const toggledIds = currentIds.includes(submapId)
      ? currentIds.filter((activeId) => activeId !== submapId)
      : [...currentIds, submapId]
    const nextIds = SUBMAP_ONLY_LOCATION_IDS.has(location.id)
      ? toggledIds.filter((activeId) => activeId !== MAIN_SUBMAP_KEY)
      : toggledIds

    commit((currentState) => ({
      ...currentState,
      locations: currentState.locations.map((currentLocation) =>
        currentLocation.id === location.id
          ? createWorldMundiLocation({
              ...currentLocation,
              activeSubmapIds:
                nextIds.length > 0 || SUBMAP_ONLY_LOCATION_IDS.has(location.id)
                  ? nextIds
                  : [MAIN_SUBMAP_KEY],
            })
          : currentLocation,
      ),
    }))
  }

  function selectLocation(locationId: string, options: { openPopover?: boolean } = {}) {
    setIsLocationPopoverOpen(options.openPopover ?? true)
    setLocationPopoverMode('detalhes')
    commit((currentState) => ({
      ...currentState,
      selectedLocationId: locationId,
    }))
  }

  function selectParty(partyId: string) {
    commit((currentState) => ({
      ...currentState,
      selectedPartyId: partyId,
    }))
  }

  function renameParty(partyId: string, nextName: string) {
    const trimmedName = nextName.trimStart()

    commit((currentState) => {
      const party = currentState.parties[partyId]

      if (!party) {
        return currentState
      }

      return {
        ...currentState,
        parties: {
          ...currentState.parties,
          [partyId]: createWorldMundiParty({
            ...party,
            nome: trimmedName,
            ultimoLog: trimmedName
              ? `Grupo renomeado para ${trimmedName}.`
              : 'Grupo aguardando nome do mestre.',
          }),
        },
      }
    })
  }

  function reorderFactionSection(sourceFactionId: string, targetFactionId: string) {
    if (!sourceFactionId || sourceFactionId === targetFactionId) {
      return
    }

    commit((currentState) => {
      const currentOrder = currentState.ui?.factionOrderIds ?? []
      const allFactionIds = Array.from(
        new Set([...currentOrder, ...factions.map((faction) => faction.id), sourceFactionId, targetFactionId]),
      )
      const sourceIndex = allFactionIds.indexOf(sourceFactionId)
      const targetIndex = allFactionIds.indexOf(targetFactionId)

      if (sourceIndex < 0 || targetIndex < 0) {
        return currentState
      }

      const nextOrder = [...allFactionIds]
      const [movedFactionId] = nextOrder.splice(sourceIndex, 1)
      nextOrder.splice(targetIndex, 0, movedFactionId)

      return {
        ...currentState,
        ui: {
          ...(currentState.ui ?? { factionOrderIds: [] }),
          factionOrderIds: nextOrder,
        },
      }
    })
  }

  function enterBiome(biomaId: string) {
    setSelectedBiomeId(biomaId)
    setMundiView('biome')
    setIsLocationPopoverOpen(false)

    if (selectedLocation?.biomaId !== biomaId) {
      const firstLocationInBiome = state.locations.find(
        (location) => location.biomaId === biomaId && location.nivelDetalhe !== 'oculto',
      )

      if (firstLocationInBiome) {
        selectLocation(firstLocationInBiome.id, { openPopover: false })
      }
    }
  }

  function returnToWorldMap() {
    setMundiView('world')
    setHoveredBiomeId('')
    setIsLocationPopoverOpen(false)
  }

  function returnToBiomeMap() {
    if (selectedLocation) {
      setSelectedBiomeId(selectedLocation.biomaId)
    }
    setMundiView('biome')
    setLocationPopoverMode('detalhes')
    setIsLocationPopoverOpen(false)
  }

  function openLocationFromMundi(location: WorldMundiLocation) {
    const locationSubmaps = submapsByLocationId.get(location.id) ?? []

    selectLocation(location.id, { openPopover: locationSubmaps.length === 0 })

    if (locationSubmaps.length > 0) {
      setSelectedBiomeId(location.biomaId)
      setMundiView('locationHub')
      setIsLocationPopoverOpen(false)
    }
  }

  function createLocation() {
    const nextLocation = createWorldMundiLocation({
      nome: 'Novo ponto do mundo',
      biomaId: selectedLocation?.biomaId ?? state.biomes[0]?.id ?? '',
      nivelDetalhe: 'generico',
      posicao: selectedLocation
        ? {
            x: Math.min(96, selectedLocation.posicao.x + 4),
            y: Math.min(96, selectedLocation.posicao.y + 4),
          }
        : { x: 50, y: 50 },
    })

    commit((currentState) => ({
      ...currentState,
      selectedLocationId: nextLocation.id,
      locations: [...currentState.locations, nextLocation],
    }))
  }

  function createRoute() {
    if (state.locations.length < 2) {
      return
    }

    const originId = selectedLocation?.id ?? state.locations[0].id
    const destinationId =
      state.locations.find((location) => location.id !== originId)?.id ?? state.locations[0].id
    const nextRoute = createWorldMundiRoute({
      origemId: originId,
      destinoId: destinationId,
      tempoPlayersHoras: 1,
      risco: 'medio',
      terreno: 'rota nova',
    })

    commit((currentState) => ({
      ...currentState,
      routes: [...currentState.routes, nextRoute],
    }))
    setActiveTab('rotas')
  }

  function ensureLocationMap(locationId: string) {
    const location = state.locations.find((entry) => entry.id === locationId)

    if (!location) {
      return
    }

    const existingMap = findExistingMapForLocation(location)

    if (existingMap) {
      linkMapToLocation(location, existingMap.id, location.hasMap ? location.mapStatus : 'customizado')
      setMovementNotice(`Mapa existente vinculado ao local: ${location.nome}.`)
      return
    }

    const request = buildMapPlaceholderRequest(location, state.biomes)

    onEnsureMapPlaceholders?.([request])
    linkMapToLocation(location, request.mapId, location.hasMap ? location.mapStatus : 'placeholder')
    setMovementNotice(`Mapa local criado/vinculado no MAP: ${location.nome}.`)
  }

  function openLocationMap(location: WorldMundiLocation) {
    const linkedMap = location.mapId
      ? maps.find((map) => map.id === location.mapId)
      : undefined
    const existingMap = linkedMap ?? findExistingMapForLocation(location)

    if (existingMap) {
      linkMapToLocation(location, existingMap.id, location.hasMap ? location.mapStatus : 'customizado')
      if (isBaseMundiLocation(location) && onShowTransition) {
        onShowTransition(getBaseArrivalTransitionId(location.id))
        return
      }
      onOpenMap?.(existingMap.id)
      return
    }

    setMovementNotice(
      `Este local ainda nao tem mapa vinculado. Use "Criar mapa local" para gerar um placeholder no MAP.`,
    )
  }

  function getSubmapPreview(submap: WorldMundiSubmap) {
    const linkedMap = mapById.get(submap.mapId)

    return (
      linkedMap?.thumbnailUrl ??
      linkedMap?.previewImage ??
      linkedMap?.imageUrl ??
      linkedMap?.image ??
      mapPreviewById[submap.mapId] ??
      ''
    )
  }

  function openSubmapMap(submap: WorldMundiSubmap) {
    const linkedMap = mapById.get(submap.mapId)

    if (!linkedMap) {
      setMovementNotice(`${submap.codigo || submap.nome} ainda esta como asset pendente.`)
      return
    }

    const baseTransitionId = getBaseSubmapArrivalTransitionId(submap)

    if (baseTransitionId && onShowTransition) {
      onShowTransition(baseTransitionId)
      return
    }

    onOpenMap?.(linkedMap.id)
  }

  function moveMembersToSubmap(memberIds: string[], submapId: string) {
    if (!selectedLocation || memberIds.length === 0) {
      return
    }

    const { partyIds, playerIds, characterIds, entityIds } = parseWorldMemberIds(memberIds)
    const submapName = submapId ? submapById.get(submapId)?.nome ?? 'submapa' : 'ponto principal'

    commit((currentState) => ({
      ...currentState,
      parties: Object.fromEntries(
        Object.values(currentState.parties).map((party) => {
          const partyTouched =
            party.localAtualId === selectedLocation.id &&
            (partyIds.has(party.id) ||
              party.memberPlayerIds.some((playerId) => playerIds.has(playerId)) ||
              party.memberCharacterIds.some((characterId) => characterIds.has(characterId)) ||
              party.memberEntityIds.some((entityId) => entityIds.has(entityId)))

          return [
            party.id,
            partyTouched
              ? createWorldMundiParty({
                  ...party,
                  submapAtualId: submapId,
                  ultimoLog: `${party.nome} marcado em ${submapName}.`,
                })
              : party,
          ]
        }),
      ),
      npcs: Object.fromEntries(
        Object.values(currentState.npcs).map((npc) => {
          const party = Object.values(currentState.parties).find((entry) =>
            entry.memberCharacterIds.includes(npc.characterId),
          )
          const npcTouched =
            characterIds.has(npc.characterId) &&
            (npc.localAtualId === selectedLocation.id || party?.localAtualId === selectedLocation.id)

          return [
            npc.characterId,
            npcTouched
              ? createWorldMundiNpcState({
                  ...npc,
                  localAtualId: selectedLocation.id,
                  submapAtualId: submapId,
                  ultimoLog: `${characterById.get(npc.characterId)?.nome ?? 'NPC'} marcado em ${submapName}.`,
                })
              : npc,
          ]
        }),
      ),
      entities: Object.fromEntries(
        Object.values(currentState.entities).map((entity) => {
          const party = Object.values(currentState.parties).find((entry) =>
            entry.memberEntityIds.includes(entity.id),
          )
          const entityTouched =
            entityIds.has(entity.id) &&
            (entity.localAtualId === selectedLocation.id || party?.localAtualId === selectedLocation.id)

          return [
            entity.id,
            entityTouched
              ? createWorldMundiEntity({
                  ...entity,
                  localAtualId: selectedLocation.id,
                  submapAtualId: submapId,
                  ultimoLog: `${entity.nome} marcado em ${submapName}.`,
                })
              : entity,
          ]
        }),
      ),
    }))
    setMovementNotice(
      submapId
        ? `Presencas selecionadas agora estao em ${submapName}.`
        : 'Presencas selecionadas voltaram para o ponto principal.',
    )
  }

  function moveMemberSelectionToSubmap(submapId: string) {
    moveMembersToSubmap(memberSelection, submapId)
  }

  function clearMemberSelectionSubmap() {
    moveMembersToSubmap(memberSelection, '')
  }

  function startPartyDrag(event: DragEvent<HTMLElement>, partyId: string) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(PARTY_DRAG_DATA_TYPE, partyId)
    event.dataTransfer.setData('text/plain', partyId)
    setDraggedPartyId(partyId)
    selectParty(partyId)
  }

  function getDraggedPartyIdFromEvent(event: DragEvent<HTMLElement>) {
    return event.dataTransfer.getData(PARTY_DRAG_DATA_TYPE) || draggedPartyId
  }

  function hasPartyDragPayload(event: DragEvent<HTMLElement>) {
    return (
      Boolean(draggedPartyId) ||
      Array.from(event.dataTransfer.types).includes(PARTY_DRAG_DATA_TYPE)
    )
  }

  function handleMemberDropToSubmap(
    event: { preventDefault: () => void; stopPropagation: () => void },
    submapId: string,
  ) {
    if (!draggedMemberId) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    moveMembersToSubmap([draggedMemberId], submapId)
    setDraggedMemberId('')
  }

  function transformTemporaryLocation(locationId: string) {
    const location = state.locations.find((entry) => entry.id === locationId)

    if (!location) {
      return
    }

    patchLocation(location.id, {
      nivelDetalhe: 'generico',
      tags: location.tags.filter((tag) => tag !== 'temporario'),
    })
    setMovementNotice(`${location.nome} virou local permanente do MUN.`)
  }

  function discardTemporaryLocation(locationId: string) {
    const location = state.locations.find((entry) => entry.id === locationId)

    if (!location) {
      return
    }

    const hasParty = Object.values(state.parties).some(
      (party) => party.localAtualId === locationId,
    )
    const hasNpc = Object.values(state.npcs).some((npc) => npc.localAtualId === locationId)
    const hasEntity = Object.values(state.entities).some(
      (entity) => entity.localAtualId === locationId,
    )

    if (hasParty || hasNpc || hasEntity) {
      setMovementNotice('Nao descartei: ainda ha grupo, NPC ou entidade nesse ponto temporario.')
      return
    }

    commit((currentState) => ({
      ...currentState,
      locations: currentState.locations.filter((entry) => entry.id !== locationId),
      selectedLocationId:
        currentState.selectedLocationId === locationId
          ? currentState.locations[0]?.id ?? ''
          : currentState.selectedLocationId,
    }))
    setMovementNotice(`${location.nome} descartado do MUN.`)
  }

  function createPartyAtSelectedLocation() {
    if (!selectedLocation || memberSelection.length === 0) {
      setMovementNotice('Selecione membros no local antes de criar um grupo.')
      return
    }

    const localAtualId = selectedLocation.id
    const { playerIds, characterIds, entityIds } = parseWorldMemberIds(memberSelection)
    const selectedPlayerIds = Array.from(playerIds)
    const selectedCharacterIds = Array.from(characterIds)
    const selectedEntityIds = Array.from(entityIds)
    const selectedSubmaps = [
      ...selectedCharacterIds
        .map((characterId) => state.npcs[characterId]?.submapAtualId ?? '')
        .filter(Boolean),
      ...selectedEntityIds
        .map((entityId) => state.entities[entityId]?.submapAtualId ?? '')
        .filter(Boolean),
    ]
    const sharedSubmapId =
      selectedSubmaps.length > 0 && selectedSubmaps.every((submapId) => submapId === selectedSubmaps[0])
        ? selectedSubmaps[0]
        : ''
    const nextParty = createWorldMundiParty({
      nome: `Grupo ${activeParties.length + 1}`,
      tipo: selectedCharacterIds.length > 0 ? 'grupo_misto' : 'party_temporaria',
      memberPlayerIds: selectedPlayerIds,
      memberCharacterIds: selectedCharacterIds,
      memberEntityIds: selectedEntityIds,
      localAtualId,
      submapAtualId: sharedSubmapId,
      contextoAtual: 'Grupo criado pela selecao de membros presentes no local.',
    })

    commit((currentState) => ({
      ...currentState,
      npcs: Object.fromEntries(
        Object.entries(currentState.npcs).map(([characterId, npc]) => [
          characterId,
          selectedCharacterIds.includes(characterId)
            ? createWorldMundiNpcState({
                ...npc,
                estadoSimulacao:
                  selectedPlayerIds.length > 0 ? 'acompanhando_grupo' : 'sob_controle_do_mestre',
                localAtualId,
                presencaNoMapa: normalizeFreePresence(npc.presencaNoMapa),
                submapAtualId: sharedSubmapId,
                ultimoLog: `Entrou no grupo ${nextParty.nome}.`,
              })
            : npc,
        ]),
      ),
      entities: Object.fromEntries(
        Object.entries(currentState.entities).map(([entityId, entity]) => [
          entityId,
          selectedEntityIds.includes(entityId)
            ? createWorldMundiEntity({
                ...entity,
                localAtualId,
                submapAtualId: sharedSubmapId,
                ultimoLog: `Entrou no grupo ${nextParty.nome}.`,
              })
            : entity,
        ]),
      ),
      parties: {
        ...Object.fromEntries(
          Object.entries(currentState.parties).map(([partyId, party]) => [
            partyId,
            createWorldMundiParty({
              ...party,
              memberPlayerIds: party.memberPlayerIds.filter(
                (playerId) => !selectedPlayerIds.includes(playerId),
              ),
              memberCharacterIds: party.memberCharacterIds.filter(
                (characterId) => !selectedCharacterIds.includes(characterId),
              ),
              memberEntityIds: party.memberEntityIds.filter(
                (entityId) => !selectedEntityIds.includes(entityId),
              ),
            }),
          ]),
        ),
        [nextParty.id]: nextParty,
      },
      selectedPartyId: nextParty.id,
    }))
    setMemberSelection([])
    if (selectedPlayerIds.length > 0 && selectedCharacterIds.length > 0) {
      setNpcJoinDraft({
        characterId: selectedCharacterIds[0],
        contexto: '',
        estado: 'acompanhando_grupo',
        partyId: nextParty.id,
      })
    }
  }

  function toggleMemberSelection(memberId: string) {
    setMemberSelection((currentSelection) =>
      currentSelection.includes(memberId)
        ? currentSelection.filter((entry) => entry !== memberId)
        : [...currentSelection, memberId],
    )
  }

  function splitSelectedMembersFromParty(party: WorldMundiParty) {
    const selectedPlayerIds = memberSelection
      .filter((memberId) => memberId.startsWith('player:'))
      .map((memberId) => memberId.replace('player:', ''))
      .filter((playerId) => party.memberPlayerIds.includes(playerId))
    const selectedCharacterIds = memberSelection
      .filter((memberId) => memberId.startsWith('npc:'))
      .map((memberId) => memberId.replace('npc:', ''))
      .filter((characterId) => party.memberCharacterIds.includes(characterId))
    const selectedEntityIds = memberSelection
      .filter((memberId) => memberId.startsWith('entity:'))
      .map((memberId) => memberId.replace('entity:', ''))
      .filter((entityId) => party.memberEntityIds.includes(entityId))

    if (selectedPlayerIds.length + selectedCharacterIds.length + selectedEntityIds.length === 0) {
      setMovementNotice('Selecione membros desse grupo para dividir.')
      return
    }

    const nextParty = createWorldMundiParty({
      nome: `Grupo ${activeParties.length + 1}`,
      tipo: selectedCharacterIds.length > 0 ? 'grupo_misto' : 'party_temporaria',
      memberPlayerIds: selectedPlayerIds,
      memberCharacterIds: selectedCharacterIds,
      memberEntityIds: selectedEntityIds,
      localAtualId: party.localAtualId,
      submapAtualId: party.submapAtualId,
      contextoAtual: `Separado de ${party.nome}.`,
    })

    commit((currentState) => ({
      ...currentState,
      npcs: Object.fromEntries(
        Object.entries(currentState.npcs).map(([characterId, npc]) => [
          characterId,
          selectedCharacterIds.includes(characterId)
            ? createWorldMundiNpcState({
                ...npc,
                estadoSimulacao:
                  selectedPlayerIds.length > 0 ? 'acompanhando_grupo' : 'sob_controle_do_mestre',
                localAtualId: party.localAtualId,
                presencaNoMapa: normalizeFreePresence(npc.presencaNoMapa),
                submapAtualId: party.submapAtualId,
                ultimoLog: `Separado de ${party.nome} em ${nextParty.nome}.`,
              })
            : npc,
        ]),
      ),
      entities: Object.fromEntries(
        Object.entries(currentState.entities).map(([entityId, entity]) => [
          entityId,
          selectedEntityIds.includes(entityId)
            ? createWorldMundiEntity({
                ...entity,
                localAtualId: party.localAtualId,
                submapAtualId: party.submapAtualId,
                ultimoLog: `Separado de ${party.nome} em ${nextParty.nome}.`,
              })
            : entity,
        ]),
      ),
      parties: {
        ...currentState.parties,
        [party.id]: createWorldMundiParty({
          ...party,
          memberPlayerIds: party.memberPlayerIds.filter(
            (playerId) => !selectedPlayerIds.includes(playerId),
          ),
          memberCharacterIds: party.memberCharacterIds.filter(
            (characterId) => !selectedCharacterIds.includes(characterId),
          ),
          memberEntityIds: party.memberEntityIds.filter(
            (entityId) => !selectedEntityIds.includes(entityId),
          ),
        }),
        [nextParty.id]: nextParty,
      },
      selectedPartyId: nextParty.id,
    }))
    setMemberSelection([])
  }

  function dissolveParty(partyId: string) {
    const partyToDissolve = state.parties[partyId]

    if (!partyToDissolve) {
      return
    }

    if (partyToDissolve.tipo === 'grupo_principal') {
      setMovementNotice('Grupo Principal nao e dissolvido; use Dividir para separar jogadores/NPCs.')
      return
    }

    commit((currentState) => {
      const party = currentState.parties[partyId]

      if (!party) {
        return currentState
      }

      const remainingParties = Object.fromEntries(
        Object.entries(currentState.parties).filter(([entryPartyId]) => entryPartyId !== partyId),
      )
      const releasedPlayerParties = Object.fromEntries(
        party.memberPlayerIds.map((playerId) => {
          const soloParty = createWorldMundiParty({
            nome: `${playerId.replace('player', 'J')} - separado`,
            tipo: 'player_solo',
            memberPlayerIds: [playerId],
            localAtualId: party.localAtualId,
            submapAtualId: party.submapAtualId,
            contextoAtual: `Separado de ${party.nome}.`,
          })

          return [soloParty.id, soloParty]
        }),
      )
      const mergedParties = {
        ...remainingParties,
        ...releasedPlayerParties,
      }
      const nextSelectedPartyId = Object.keys(releasedPlayerParties)[0] ?? Object.keys(remainingParties)[0] ?? ''
      const releasedNpcNames = party.memberCharacterIds
        .map((characterId) => characterById.get(characterId)?.nome ?? characterId)
        .join(', ')

      return {
        ...currentState,
        npcs: Object.fromEntries(
          Object.entries(currentState.npcs).map(([characterId, npc]) => [
            characterId,
            party.memberCharacterIds.includes(characterId)
              ? createWorldMundiNpcState({
                  ...npc,
                  estadoSimulacao: 'seguindo_contexto',
                  localAtualId: party.localAtualId,
                  presencaNoMapa: normalizeFreePresence(npc.presencaNoMapa),
                  submapAtualId: party.submapAtualId,
                  ultimoLog: `Grupo ${party.nome} dissolvido; permaneceu neste ponto.`,
                })
              : npc,
          ]),
        ),
        entities: Object.fromEntries(
          Object.entries(currentState.entities).map(([entityId, entity]) => [
            entityId,
            party.memberEntityIds.includes(entityId)
              ? createWorldMundiEntity({
                  ...entity,
                  localAtualId: party.localAtualId,
                  submapAtualId: party.submapAtualId,
                  ultimoLog: `Grupo ${party.nome} dissolvido; permaneceu neste ponto.`,
                })
              : entity,
          ]),
        ),
        parties: mergedParties,
        selectedPartyId: nextSelectedPartyId,
        logs: [
          createWorldMundiLogEntry({
            dia: currentState.clock.dia,
            hora: currentState.clock.hora,
            texto: `${party.nome} dissolvido em ${locationById.get(party.localAtualId)?.nome ?? 'local atual'}.`,
            tecnico: `NPCs liberados: ${releasedNpcNames || 'nenhum'}. Jogadores viraram grupos solo: ${party.memberPlayerIds.join(', ') || 'nenhum'}. Submapa: ${party.submapAtualId || 'S0'}.`,
            categoria: 'players',
            canal: 'mestre',
            tone: 'steady',
          }),
          ...currentState.logs,
        ],
      }
    })
    setMemberSelection((currentSelection) =>
      currentSelection.filter((memberId) => {
        if (memberId.startsWith('npc:')) {
          return !partyToDissolve.memberCharacterIds.includes(memberId.replace('npc:', ''))
        }

        if (memberId.startsWith('player:')) {
          return !partyToDissolve.memberPlayerIds.includes(memberId.replace('player:', ''))
        }

        if (memberId.startsWith('entity:')) {
          return !partyToDissolve.memberEntityIds.includes(memberId.replace('entity:', ''))
        }

        return true
      }),
    )
    setMovementNotice(`${partyToDissolve.nome} dissolvido; membros ficaram no ultimo ponto.`)
  }

  function startNpcRelease(party: WorldMundiParty) {
    const selectedNpcId = memberSelection
      .filter((memberId) => memberId.startsWith('npc:'))
      .map((memberId) => memberId.replace('npc:', ''))
      .find((characterId) => party.memberCharacterIds.includes(characterId))

    if (!selectedNpcId) {
      setMovementNotice('Selecione um NPC do grupo para remover com contexto.')
      return
    }

    const npc = state.npcs[selectedNpcId]

    setNpcReleaseDraft({
      afinidade: npc?.memoriaSimulacao.afinidadeComPlayers ?? 0,
      ameaca: npc?.memoriaSimulacao.ameacaPercebidaPlayers ?? 0,
      characterId: selectedNpcId,
      confianca: npc?.memoriaSimulacao.confiancaNosPlayers ?? 0,
      interesse: npc?.memoriaSimulacao.interesseNosPlayers ?? 0,
      novoEstado: 'seguindo_contexto',
      partyId: party.id,
      resumo: npc?.contextoNarrativo ?? '',
      rivalidade: npc?.memoriaSimulacao.rivalidadeComPlayers ?? 0,
    })
  }

  function saveNpcRelease() {
    if (!npcReleaseDraft) {
      return
    }

    commit((currentState) => {
      const party = currentState.parties[npcReleaseDraft.partyId]
      const npc = currentState.npcs[npcReleaseDraft.characterId]

      if (!party || !npc) {
        return currentState
      }

      return {
        ...currentState,
        npcs: {
          ...currentState.npcs,
          [npcReleaseDraft.characterId]: createWorldMundiNpcState({
            ...npc,
            contextoNarrativo: npcReleaseDraft.resumo,
            estadoSimulacao: npcReleaseDraft.novoEstado,
            localAtualId: party.localAtualId,
            presencaNoMapa: normalizeFreePresence(npc.presencaNoMapa),
            submapAtualId: party.submapAtualId,
            memoriaSimulacao: {
              ...npc.memoriaSimulacao,
              afinidadeComPlayers: npcReleaseDraft.afinidade,
              ameacaPercebidaPlayers: npcReleaseDraft.ameaca,
              conheceuPlayers: true,
              confiancaNosPlayers: npcReleaseDraft.confianca,
              interesseNosPlayers: npcReleaseDraft.interesse,
              querEncontrarPlayersNovamente: npcReleaseDraft.interesse >= 3,
              rivalidadeComPlayers: npcReleaseDraft.rivalidade,
            },
            ultimoLog: `Saiu do grupo ${party.nome}. ${npcReleaseDraft.resumo}`,
          }),
        },
        parties: {
          ...currentState.parties,
          [party.id]: createWorldMundiParty({
            ...party,
            memberCharacterIds: party.memberCharacterIds.filter(
              (characterId) => characterId !== npcReleaseDraft.characterId,
            ),
          }),
        },
        logs: [
          createWorldMundiLogEntry({
            dia: currentState.clock.dia,
            hora: currentState.clock.hora,
            texto: `${characterById.get(npcReleaseDraft.characterId)?.nome ?? 'NPC'} saiu de ${party.nome}.`,
            tecnico: npcReleaseDraft.resumo,
            categoria: 'npcs',
            canal: 'mestre',
            tone: 'watch',
          }),
          ...currentState.logs,
        ],
      }
    })
    setMemberSelection((currentSelection) =>
      currentSelection.filter((memberId) => memberId !== `npc:${npcReleaseDraft.characterId}`),
    )
    setNpcReleaseDraft(null)
  }

  function saveNpcJoin(skipContext = false) {
    if (!npcJoinDraft) {
      return
    }

    commit((currentState) => {
      const npc = currentState.npcs[npcJoinDraft.characterId]
      const party = currentState.parties[npcJoinDraft.partyId]

      if (!npc || !party) {
        return currentState
      }

      const contextText = skipContext
        ? npc.contextoNarrativo
        : npcJoinDraft.contexto || `Entrou no grupo ${party.nome}.`

      return {
        ...currentState,
        npcs: {
          ...currentState.npcs,
          [npcJoinDraft.characterId]: createWorldMundiNpcState({
            ...npc,
            contextoNarrativo: contextText,
            estadoSimulacao: npcJoinDraft.estado,
            localAtualId: party.localAtualId,
            presencaNoMapa: normalizeFreePresence(npc.presencaNoMapa),
            submapAtualId: party.submapAtualId,
            ultimoLog: `Entrou no grupo ${party.nome}. ${contextText}`,
          }),
        },
        logs: [
          createWorldMundiLogEntry({
            dia: currentState.clock.dia,
            hora: currentState.clock.hora,
            texto: `${characterById.get(npcJoinDraft.characterId)?.nome ?? 'NPC'} entrou em ${party.nome}.`,
            tecnico: contextText,
            categoria: 'npcs',
            canal: 'mestre',
            tone: 'watch',
          }),
          ...currentState.logs,
        ],
      }
    })
    setNpcJoinDraft(null)
  }

  function startReincarnation(
    playerId?: string,
    options: Partial<Pick<ReincarnationDraft, 'bodyName' | 'bodyType' | 'locationId' | 'npcOriginalId'>> = {},
  ) {
    const targetPlayerId = playerId ?? selectedParty?.memberPlayerIds[0] ?? 'player1'

    setReincarnationDraft({
      bodyName: options.bodyName ?? 'Novo corpo',
      bodyType: options.bodyType ?? 'humano',
      estadoOriginal: 'em_disputa',
      locationId:
        options.locationId ??
        selectedLocation?.id ??
        selectedParty?.localAtualId ??
        'caverna_primeiro_corpo',
      npcOriginalId: options.npcOriginalId ?? '',
      playerId: targetPlayerId,
    })
  }

  function saveReincarnation() {
    if (!reincarnationDraft) {
      return
    }

    const player = state.players[reincarnationDraft.playerId]
    const consciousnessId = player?.conscienciaId ?? `consciencia_${reincarnationDraft.playerId}`
    const body = createWorldMundiBody({
      nome: reincarnationDraft.bodyName,
      tipo: reincarnationDraft.bodyType,
      localAtualId: reincarnationDraft.locationId,
      ocupadoPorConsciencia: true,
      conscienciaControladoraId: consciousnessId,
      jogadorControladorId: reincarnationDraft.playerId,
      jogadoresControladoresIds: [reincarnationDraft.playerId],
      npcOriginalId: reincarnationDraft.npcOriginalId,
      estadoDaConscienciaOriginal: reincarnationDraft.estadoOriginal,
    })
    const nextParty = createWorldMundiParty({
      nome: `${reincarnationDraft.playerId.replace('player', 'J')} - ${body.nome}`,
      tipo: 'player_solo',
      memberPlayerIds: [reincarnationDraft.playerId],
      localAtualId: reincarnationDraft.locationId,
      contextoAtual: `Consciencia reencarnada no corpo ${body.nome}.`,
    })

    pushUndoSnapshot(state)
    commit((currentState) => ({
      ...currentState,
      corpos: {
        ...currentState.corpos,
        [body.id]: body,
      },
      consciencias: {
        ...currentState.consciencias,
        [consciousnessId]: createWorldMundiConsciousness({
          ...(currentState.consciencias[consciousnessId] ?? {
            id: consciousnessId,
            jogadorId: reincarnationDraft.playerId,
          }),
          id: consciousnessId,
          jogadorId: reincarnationDraft.playerId,
          corpoAtualId: body.id,
          grupoAtualId: nextParty.id,
        }),
      },
      parties: {
        ...Object.fromEntries(
          Object.entries(currentState.parties).map(([partyId, party]) => [
            partyId,
            createWorldMundiParty({
              ...party,
              memberPlayerIds: party.memberPlayerIds.filter(
                (playerId) => playerId !== reincarnationDraft.playerId,
              ),
            }),
          ]),
        ),
        [nextParty.id]: nextParty,
      },
      selectedPartyId: nextParty.id,
      selectedLocationId: reincarnationDraft.locationId,
      logs: [
        createWorldMundiLogEntry({
          dia: currentState.clock.dia,
          hora: currentState.clock.hora,
          texto: `${state.players[reincarnationDraft.playerId]?.nome ?? reincarnationDraft.playerId} reencarnou no corpo ${body.nome}.`,
          tecnico: `Corpo ${body.id}. Tipo ${body.tipo}. NPC original ${body.npcOriginalId || 'nenhum'}. Estado original ${body.estadoDaConscienciaOriginal}.`,
          categoria: 'players',
          canal: 'mestre',
          tone: 'critical',
        }),
        ...currentState.logs,
      ],
    }))
    setReincarnationDraft(null)
  }

  function mergePartiesAtSelectedLocation() {
    if (!selectedParty) {
      return
    }

    const partiesHere = activeParties.filter(
      (party) => party.id !== selectedParty.id && party.localAtualId === selectedParty.localAtualId,
    )

    if (partiesHere.length === 0) {
      return
    }

    const mergedPlayerIds = Array.from(
      new Set([
        ...selectedParty.memberPlayerIds,
        ...partiesHere.flatMap((party) => party.memberPlayerIds),
      ]),
    )
    const mergedCharacterIds = Array.from(
      new Set([
        ...selectedParty.memberCharacterIds,
        ...partiesHere.flatMap((party) => party.memberCharacterIds),
      ]),
    )
    const mergedEntityIds = Array.from(
      new Set([
        ...selectedParty.memberEntityIds,
        ...partiesHere.flatMap((party) => party.memberEntityIds),
      ]),
    )

    commit((currentState) => ({
      ...currentState,
      npcs: Object.fromEntries(
        Object.entries(currentState.npcs).map(([characterId, npc]) => [
          characterId,
          mergedCharacterIds.includes(characterId)
            ? createWorldMundiNpcState({
                ...npc,
                estadoSimulacao:
                  mergedPlayerIds.length > 0 ? 'acompanhando_grupo' : 'sob_controle_do_mestre',
                localAtualId: selectedParty.localAtualId,
                presencaNoMapa: normalizeFreePresence(npc.presencaNoMapa),
                submapAtualId: selectedParty.submapAtualId,
                ultimoLog: `Unido ao grupo ${selectedParty.nome}.`,
              })
            : npc,
        ]),
      ),
      entities: Object.fromEntries(
        Object.entries(currentState.entities).map(([entityId, entity]) => [
          entityId,
          mergedEntityIds.includes(entityId)
            ? createWorldMundiEntity({
                ...entity,
                localAtualId: selectedParty.localAtualId,
                submapAtualId: selectedParty.submapAtualId,
                ultimoLog: `Unido ao grupo ${selectedParty.nome}.`,
              })
            : entity,
        ]),
      ),
      parties: Object.fromEntries(
        Object.entries({
          ...currentState.parties,
          [selectedParty.id]: createWorldMundiParty({
            ...selectedParty,
            memberPlayerIds: mergedPlayerIds,
            memberCharacterIds: mergedCharacterIds,
            memberEntityIds: mergedEntityIds,
            ultimoLog: `Unido com ${partiesHere.map((party) => party.nome).join(', ')}.`,
          }),
        }).filter(([partyId]) => !partiesHere.some((party) => party.id === partyId)),
      ),
      selectedPartyId: selectedParty.id,
    }))
  }

  function syncCanonicalNpcsToWorld() {
    pushUndoSnapshot(state)
    let nextNotice = ''

    commit((currentState) => {
      const syncResult = seedCanonicalNpcWorld({
        characters,
        forceCanonicalPlacement: true,
        world: currentState,
      })

      nextNotice = `NPCs reais sincronizados: ${syncResult.syncedCount}. Prontos: ${syncResult.readyCount}. Pendentes: ${syncResult.needsContextCount}.`

      return {
        ...syncResult.world,
        logs: [
          createWorldMundiLogEntry({
            dia: currentState.clock.dia,
            hora: currentState.clock.hora,
            texto: 'NPCs reais sincronizados com locais canonicos e validação de contexto IA.',
            tecnico: `Sincronizados ${syncResult.syncedCount}; prontos ${syncResult.readyCount}; pendentes ${syncResult.needsContextCount}; sem local ${syncResult.missingLocationCount}.`,
            categoria: 'npcs',
            canal: 'tecnico',
            tone: syncResult.missingLocationCount > 0 ? 'watch' : 'steady',
          }),
          ...syncResult.world.logs,
        ],
      }
    })
    setMovementNotice(nextNotice)
  }

  function addNpcToWorld() {
    const characterId = npcToAddId || availableCharactersToAdd[0]?.id

    if (!characterId) {
      return
    }

    const defaultLocationId = selectedLocation?.id ?? state.locations[0]?.id ?? ''

    commit((currentState) => ({
      ...currentState,
      npcs: {
        ...currentState.npcs,
        [characterId]: createWorldMundiNpcState({
          characterId,
          estadoSimulacao: 'fora_de_cena',
          statusEntrada: 'ainda_fora_da_ilha',
          presencaNoMapa: 'inativo',
          localAtualId: defaultLocationId,
          localInicialId: defaultLocationId,
          intencaoAtual: 'observando',
        }),
      },
    }))
    setNpcToAddId('')
  }

  function removeNpcFromWorld(characterId: string) {
    commit((currentState) => ({
      ...currentState,
      npcs: Object.fromEntries(
        Object.entries(currentState.npcs).filter(
          ([entryCharacterId]) => entryCharacterId !== characterId,
        ),
      ),
    }))
  }

  function createClockAdvanceState(
    currentState: WorldMundiState,
    hours: number,
    reason = 'ajuste manual do mestre',
  ) {
    const normalizedHours = roundClockHours(hours)
    const nextClock = resolveClockAfterAdvance(currentState.clock, normalizedHours)
    const nextLog = createWorldMundiLogEntry({
      dia: nextClock.dia,
      hora: nextClock.hora,
      texto: `Relogio do mundo avancou ${formatHours(normalizedHours)} (${reason}).`,
      tecnico: `Ajuste de relogio. Origem: Dia ${currentState.clock.dia} ${formatClockTime(currentState.clock.hora)}. Destino: Dia ${nextClock.dia} ${formatClockTime(nextClock.hora)}. Simulacao autonoma de NPC so gera novo estado em janelas de ${formatHours(NPC_SIMULATION_TURN_HOURS)} de tempo do mundo; NPCs soltos usam metade desse tempo.`,
      categoria: 'sistema',
      canal: 'mestre',
      tone: 'steady',
    })

    return {
      ...currentState,
      clock: nextClock,
      logs: [nextLog, ...currentState.logs],
    }
  }

  function advanceClock(hours: number, reason?: string) {
    const normalizedHours = roundClockHours(hours)

    if (normalizedHours <= 0) {
      setMovementNotice('Informe um tempo maior que zero para avancar o relogio.')
      return
    }

    pushUndoSnapshot(state)
    onChange(createWorldMundiState(createClockAdvanceState(state, normalizedHours, reason)))
    setMovementNotice(`Relogio avancou ${formatHours(normalizedHours)}. Use Desfazer se foi um ajuste errado.`)
  }

  function advanceManualClock() {
    const parsedHours = parseClockDeltaInput(manualClockDeltaText)

    if (parsedHours === null || parsedHours <= 0) {
      setMovementNotice('Use um formato de tempo valido, como 00:20, 30min, 1h ou 1.5.')
      return
    }

    advanceClock(parsedHours, 'ajuste manual')
  }

  function applyGroupAction(hours: number, actionLabel: string, category: WorldLogFilter = 'players') {
    if (!selectedParty || category === 'todos') {
      return
    }

    pushUndoSnapshot(state)
    commit((currentState) => {
      const nextClock = resolveClockAfterAdvance(currentState.clock, hours)
      const currentParty = currentState.parties[selectedParty.id]
      const locationName =
        currentState.locations.find((location) => location.id === currentParty?.localAtualId)?.nome ??
        'local atual'
      const logText = `${selectedParty.nome} ficou em ${locationName}: ${actionLabel} por ${formatHours(hours)}.`
      const baseState: WorldMundiState = {
        ...currentState,
        clock: nextClock,
        logs: [
          createWorldMundiLogEntry({
            dia: nextClock.dia,
            hora: nextClock.hora,
            texto: logText,
            tecnico: `Acao sem movimento. Grupo: ${selectedParty.nome}. Local: ${locationName}. Tempo: ${formatHours(hours)}.`,
            categoria: category,
            canal: 'mestre',
            tone: 'steady',
          }),
          ...currentState.logs,
        ],
      }
      return baseState
    })
    setMovementNotice(
      `${actionLabel} aplicado. O relogio avancou ${formatHours(hours)}; NPCs aguardam simulacao/aprovacao na aba IA.`,
    )
  }

  function buildStateWithKnownNpcs(baseState = createWorldMundiState()) {
    const syncResult = seedCanonicalNpcWorld({
      characters,
      forceCanonicalPlacement: true,
      world: baseState,
    })

    return createWorldMundiState(syncResult.world)

  }

  function resetCampaign() {
    if (resetCampaignText !== 'RESET') {
      setMovementNotice('Digite RESET para confirmar o reset da campanha.')
      return
    }

    pushUndoSnapshot(state)
    onChange(buildStateWithKnownNpcs())
    setResetCampaignText('')
    setResetTarget(null)
    setShowSettings(false)
    setMovementNotice('Campanha resetada para Dia 1, 08:00, GP na Caverna e dados iniciais.')
  }

  function pushUndoSnapshot(snapshot: WorldMundiState = state) {
    setUndoStack((currentStack) => [createWorldMundiState(snapshot), ...currentStack].slice(0, 20))
  }

  function buildTimePlanEntry(
    party: WorldMundiParty,
    travelPlan: TravelPlan,
    newLocation?: WorldMundiLocation,
    destinationSubmap?: WorldMundiSubmap | null,
  ): TimePlanEntry {
    return {
      action: 'travel',
      destinationId: newLocation?.id ?? travelPlan.destinationId,
      destinationName: newLocation?.nome ?? travelPlan.destinationName,
      destinationSubmapId: destinationSubmap?.id,
      destinationSubmapName: destinationSubmap?.nome,
      freeTimeHours: 0,
      newLocation,
      originId: travelPlan.originId,
      originName: travelPlan.originName,
      partyId: party.id,
      partyName: getPartyDisplayName(party),
      risk: travelPlan.risk,
      routeIds: travelPlan.routeIds,
      routeNames: travelPlan.routeNames,
      timeHours: travelPlan.timeHours,
    }
  }

  function queuePartyMovement(partyId: string, destinationId: string) {
    const party = state.parties[partyId]

    if (!party) {
      return
    }

    const destination = state.locations.find((location) => location.id === destinationId)
    const travelPlan = getPartyTravelPlan(party.localAtualId, destinationId)

    if (!travelPlan) {
      setMovementNotice(
        `Nao foi possivel calcular deslocamento para ${destination?.nome ?? 'este destino'}.`,
      )
      return
    }

    const nextEntry = buildTimePlanEntry(party, travelPlan)
    const routeNotice = travelPlan.isFreeMovement
      ? ' Sem rota cadastrada. Usando deslocamento livre estimado.'
      : ''

    if (movementMode === 'quick') {
      applyMovementEntries([nextEntry], `Movimento aplicado.${routeNotice}`)
      return
    }

    setTimePlanEntries((currentEntries) => [
      ...currentEntries.filter((entry) => entry.partyId !== party.id),
      nextEntry,
    ])
    setMovementDestinationId('')
    setMovementNotice(`${getPartyDisplayName(party)} adicionado ao Plano de Tempo.${routeNotice}`)
    commit((currentState) => ({
      ...currentState,
      selectedLocationId: destinationId,
      selectedPartyId: party.id,
    }))
  }

  function getSubmapMovementHours(location: WorldMundiLocation, submap: WorldMundiSubmap | null) {
    const lookup = normalizeMapLookup(`${location.id} ${location.nome} ${submap?.id ?? ''} ${submap?.nome ?? ''}`)

    if (lookup.includes('riacho')) {
      return 0.5
    }

    if (lookup.includes('campo_treino') || lookup.includes('armazem')) {
      return 1 / 6
    }

    if (lookup.includes('caverna_primeiro_corpo') || lookup.includes('clareira')) {
      return 0.25
    }

    return 0.5
  }

  function queuePartySubmapMovement(partyId: string, locationId: string, submapId: string) {
    const party = state.parties[partyId]
    const location = locationById.get(locationId)
    const submap = submapId ? submapById.get(submapId) ?? null : null

    if (!party || !location) {
      return
    }

    const samePlace =
      party.localAtualId === locationId && (party.submapAtualId || '') === (submapId || '')
    const origin =
      locationById.get(party.localAtualId) ?? location
    const routeToLocationHours =
      getPartyTravelPlan(party.localAtualId, locationId)
        ?.timeHours ?? getDistanceHours(origin, location.posicao)
    const timeHours = samePlace
      ? 0
      : party.localAtualId === locationId
        ? getSubmapMovementHours(location, submap)
        : routeToLocationHours + (submapId ? getSubmapMovementHours(location, submap) : 0)
    const nextEntry: TimePlanEntry = {
      action: 'travel',
      destinationId: location.id,
      destinationName: submap ? `${location.nome} / ${submap.nome}` : location.nome,
      destinationSubmapId: submapId || '',
      destinationSubmapName: submap?.nome ?? 'Mapa principal',
      freeTimeHours: 0,
      originId: party.localAtualId,
      originName: origin.nome,
      partyId: party.id,
      partyName: getPartyDisplayName(party),
      risk: location.riscoAtual,
      routeIds: [],
      routeNames:
        party.localAtualId === locationId
          ? [`subrota interna: ${submap?.codigo ?? 'S0'}`]
          : ['deslocamento ate ponto e entrada em subrota'],
      timeHours,
    }

    if (movementMode === 'quick') {
      applyMovementEntries([nextEntry], 'Movimento de subrota aplicado.')
      return
    }

    setTimePlanEntries((currentEntries) => [
      ...currentEntries.filter((entry) => entry.partyId !== party.id),
      nextEntry,
    ])
    setMovementNotice(`${getPartyDisplayName(party)} adicionado ao Plano de Tempo.`)
  }

  function queueMovementPreview() {
    if (!selectedParty || !movementPreview) {
      return
    }

    queuePartyMovement(selectedParty.id, movementPreview.destinationId)
  }

  function cancelTimePlan() {
    setTimePlanEntries([])
    setMovementNotice('')
  }

  function undoLastMovement() {
    const [lastSnapshot, ...remainingStack] = undoStack

    if (!lastSnapshot) {
      return
    }

    onChange(createWorldMundiState(lastSnapshot))
    setUndoStack(remainingStack)
    setTimePlanEntries([])
    setSimulationPreview([])
    setMovementNotice('Ultimo movimento foi desfeito.')
  }

  function createSimulationSuggestions(
    hours: number,
    sourceState: WorldMundiState = state,
  ) {
    const occupiedNpcIds = new Set(
      Object.values(sourceState.corpos)
        .filter((body) => body.ocupadoPorConsciencia && body.npcOriginalId)
        .map((body) => body.npcOriginalId),
    )
    const groupedNpcIds = new Set(
      Object.values(sourceState.parties).flatMap((party) => party.memberCharacterIds),
    )

    return Object.values(sourceState.npcs)
      .filter((npc) => !occupiedNpcIds.has(npc.characterId) && !groupedNpcIds.has(npc.characterId))
      .map((npc): SimulationSuggestion => {
      const character = characterById.get(npc.characterId)
      const currentLocation =
        sourceState.locations.find((location) => location.id === npc.localAtualId) ??
        sourceState.locations[0]

      if (!currentLocation) {
        return {
          action: 'paused',
          actionText: 'Sem local atual configurado.',
          characterId: npc.characterId,
          fromId: '',
          fromName: 'Sem local',
          intention: npc.intencaoAtual,
          motivation: 'Configure um local atual para este NPC antes de simular.',
          nextTrend: 'Aguardando configuracao.',
          risk: 'indefinido',
          routeNames: [],
          timeUsed: 0,
          toId: '',
          toName: 'Sem destino',
        }
      }

      const occupiedBody = Object.values(sourceState.corpos).find(
        (body) =>
          body.ocupadoPorConsciencia &&
          body.npcOriginalId === npc.characterId &&
          getWorldMundiBodyControllerIds(body).length > 0,
      )
      const occupiedControllerLabel = getWorldMundiBodyControllerIds(occupiedBody)
        .map(formatLabel)
        .join(', ')

      if (occupiedBody) {
        return {
          action: 'paused',
          actionText: 'Corpo ocupado por consciencia de jogador.',
          characterId: npc.characterId,
          fromId: currentLocation.id,
          fromName: currentLocation.nome,
          intention: npc.intencaoAtual,
          motivation: `${character?.nome ?? 'NPC'} esta sendo usado como corpo atual de ${occupiedControllerLabel || 'jogador'}. A simulacao autonoma nao move este corpo.`,
          nextTrend: 'Aguardar acao do jogador/mestre.',
          risk: currentLocation.riscoAtual,
          routeNames: [],
          timeUsed: 0,
          toId: currentLocation.id,
          toName: currentLocation.nome,
        }
      }

      if (
        npc.estadoSimulacao === 'em_cena_com_players' ||
        npc.estadoSimulacao === 'acompanhando_grupo' ||
        npc.estadoSimulacao === 'sob_controle_do_mestre' ||
        npc.estadoSimulacao === 'pausado_por_contexto'
      ) {
        return {
          action: 'paused',
          actionText: 'Simulacao pausada por contexto de mesa.',
          characterId: npc.characterId,
          fromId: currentLocation.id,
          fromName: currentLocation.nome,
          intention: npc.intencaoAtual,
          motivation:
            npc.contextoNarrativo ||
            'NPC esta em cena, acompanhando o grupo ou sob interpretacao direta do mestre.',
          nextTrend: 'Volta a simular quando o mestre liberar.',
          risk: currentLocation.riscoAtual,
          routeNames: [],
          timeUsed: 0,
          toId: currentLocation.id,
          toName: currentLocation.nome,
        }
      }

      if (npc.emViagem) {
        const destination =
          sourceState.locations.find((location) => location.id === npc.viagemDestinoId) ??
          currentLocation
        const remainingHours = Math.max(0, npc.viagemTempoRestante - hours)

        return {
          action: remainingHours > 0 ? 'traveling' : 'move',
          actionText:
            remainingHours > 0
              ? `Continua em viagem. Restam ${formatHours(remainingHours)}.`
              : `Chega em ${destination.nome}.`,
          characterId: npc.characterId,
          fromId: currentLocation.id,
          fromName: currentLocation.nome,
          intention: npc.intencaoAtual,
          motivation: npc.viagemMotivo || `Viagem ja estava em andamento para ${destination.nome}.`,
          nextTrend:
            remainingHours > 0
              ? 'Continuar viagem.'
              : npc.tendencias[0] ?? 'Agir conforme objetivo atual no destino.',
          remainingHours,
          risk: destination.riscoAtual,
          routeNames: ['viagem em andamento'],
          timeUsed: Math.min(hours, npc.viagemTempoRestante),
          toId: destination.id,
          toName: destination.nome,
        }
      }

      const rankedLocations = sourceState.locations
        .map((location) => ({
          location,
          score: scoreLocationForNpc(npc, location, currentLocation.id),
        }))
        .sort((a, b) => b.score - a.score)
      const bestDestination =
        rankedLocations[0]?.score > 0 ? rankedLocations[0].location : currentLocation

      if (bestDestination.id === currentLocation.id) {
        return {
          action: 'stay',
          actionText: `Permanece em ${currentLocation.nome} e usa o tempo para ${formatLabel(npc.intencaoAtual)}.`,
          characterId: npc.characterId,
          fromId: currentLocation.id,
          fromName: currentLocation.nome,
          intention: npc.intencaoAtual,
          motivation:
            npc.objetivoAtual ||
            npc.objetivoMacro ||
            `${character?.nome ?? 'NPC'} nao encontrou destino mais forte que o local atual.`,
          nextTrend: npc.tendencias[0] ?? 'Reavaliar o ambiente no proximo avanco.',
          risk: currentLocation.riscoAtual,
          routeNames: [],
          timeUsed: hours,
          toId: currentLocation.id,
          toName: currentLocation.nome,
        }
      }

      const travelPlan = findBestTravelPlan(
        sourceState.locations,
        sourceState.routes,
        currentLocation.id,
        bestDestination.id,
        'npc',
      )

      if (!travelPlan) {
        return {
          action: 'stay',
          actionText: `Queria ir para ${bestDestination.nome}, mas nao existe rota configurada.`,
          characterId: npc.characterId,
          fromId: currentLocation.id,
          fromName: currentLocation.nome,
          intention: npc.intencaoAtual,
          motivation: buildNpcMotivation(npc, bestDestination),
          nextTrend: 'Criar rota ou manter no local.',
          risk: bestDestination.riscoAtual,
          routeNames: [],
          timeUsed: 0,
          toId: currentLocation.id,
          toName: currentLocation.nome,
        }
      }

      const remainingHours = Math.max(0, travelPlan.timeHours - hours)

      return {
        action: remainingHours > 0 ? 'traveling' : 'move',
        actionText:
          remainingHours > 0
            ? `Inicia viagem para ${bestDestination.nome}. Restam ${formatHours(remainingHours)}.`
            : `Vai para ${bestDestination.nome} e usa ${formatHours(Math.max(0, hours - travelPlan.timeHours))} no local.`,
        characterId: npc.characterId,
        fromId: currentLocation.id,
        fromName: currentLocation.nome,
        intention: npc.intencaoAtual,
        motivation: buildNpcMotivation(npc, bestDestination),
        nextTrend: npc.tendencias[0] ?? `Continuar ${formatLabel(npc.intencaoAtual)}.`,
        remainingHours,
        risk: travelPlan.risk,
        routeNames: travelPlan.routeNames,
        timeUsed: Math.min(hours, travelPlan.timeHours),
        toId: bestDestination.id,
        toName: bestDestination.nome,
      }
    })
  }

  function applySimulationSuggestionsToState(
    currentState: WorldMundiState,
    suggestions: SimulationSuggestion[],
    logClock = currentState.clock,
  ) {
    const nextNpcs = { ...currentState.npcs }
    const nextLogs = [...currentState.logs]

    suggestions.forEach((suggestion) => {
      const npc = nextNpcs[suggestion.characterId]
      const character = characterById.get(suggestion.characterId)

      if (!npc) {
        return
      }

      const characterName = character?.nome ?? suggestion.characterId
      const logText = `${characterName}: ${suggestion.actionText}`
      const technicalText = `${characterName}: ${suggestion.actionText} Motivo: ${suggestion.motivation} Intencao: ${formatLabel(suggestion.intention)}. Proxima tendencia: ${suggestion.nextTrend}. Rotas: ${suggestion.routeNames.join(' / ') || 'nenhuma'}.`

      if (suggestion.action === 'move') {
        nextNpcs[suggestion.characterId] = createWorldMundiNpcState({
          ...npc,
          emViagem: false,
          localAtualId: suggestion.toId,
          submapAtualId: '',
          destinoAtualId: '',
          ultimoLog: logText,
          viagemDestinoId: '',
          viagemMotivo: '',
          viagemOrigemId: '',
          viagemTempoRestante: 0,
        })
      } else if (suggestion.action === 'traveling') {
        nextNpcs[suggestion.characterId] = createWorldMundiNpcState({
          ...npc,
          emViagem: true,
          destinoAtualId: suggestion.toId,
          ultimoLog: logText,
          viagemDestinoId: suggestion.toId,
          viagemMotivo: suggestion.motivation,
          viagemOrigemId: suggestion.fromId,
          viagemTempoRestante: suggestion.remainingHours ?? 0,
        })
      } else {
        nextNpcs[suggestion.characterId] = createWorldMundiNpcState({
          ...npc,
          ultimoLog: logText,
        })
      }

      nextLogs.unshift(
        createWorldMundiLogEntry({
          dia: logClock.dia,
          hora: logClock.hora,
          texto: logText,
          tecnico: technicalText,
          categoria: 'npcs',
          canal:
            suggestion.action === 'move' || suggestion.action === 'traveling'
              ? 'mestre'
              : 'tecnico',
          tone: suggestion.action === 'paused' || suggestion.action === 'stay' ? 'steady' : 'watch',
        }),
      )
    })

    return {
      ...currentState,
      npcs: nextNpcs,
      logs: nextLogs,
    }
  }

  function applyMovementEntries(entries: TimePlanEntry[], notice: string) {
    if (entries.length === 0) {
      return
    }

    const totalHours = Math.max(...entries.map((entry) => entry.timeHours))
    const lastEntry = entries[entries.length - 1]
    const potentialContactIds = collectPotentialContactIdsForEntries(entries)
    const potentialContactNames = potentialContactIds
      .map((characterId) => characterById.get(characterId)?.nome ?? characterId)
      .slice(0, 4)

    pushUndoSnapshot(state)
    commit((currentState) => {
      const nextClock = resolveClockAfterAdvance(currentState.clock, totalHours)
      const nextParties = { ...currentState.parties }
      const nextBodies = { ...currentState.corpos }
      const nextConsciousnesses = { ...currentState.consciencias }
      const nextNpcs = { ...currentState.npcs }
      const nextEntities = { ...currentState.entities }
      const nextDiscoveredPublicLocations = new Set(
        currentState.publicMap.discoveredLocationIds,
      )
      const nextLocations = [
        ...currentState.locations,
        ...entries
          .map((entry) => entry.newLocation)
          .filter((location): location is WorldMundiLocation => Boolean(location))
          .filter(
            (location) =>
              !currentState.locations.some((currentLocation) => currentLocation.id === location.id),
          ),
      ]
      const movementLogs = entries.map((entry) => {
        const party = nextParties[entry.partyId]
        const freeTime = Math.max(0, totalHours - entry.timeHours)
        const consequences = getPlanEncounters(entry, currentState)
        const nextSubmapId = entry.destinationSubmapId ?? ''
        const destinationLabel = entry.destinationSubmapName
          ? `${entry.destinationName}`
          : entry.destinationName
        const destinationPosition =
          entry.newLocation?.posicao ??
          currentState.locations.find((location) => location.id === entry.destinationId)?.posicao
        const hiddenHint = destinationPosition
          ? getHiddenLocationHint(currentState, destinationPosition, entry.routeIds)
          : ''
        const encounterText =
          consequences.encounters.length > 0
            ? ` Evento: ${consequences.encounters.join(', ')}.`
            : ''
        const hiddenText = hiddenHint ? ` ${hiddenHint}` : ''
        const freeTimeText =
          freeTime > 0
            ? ` Sobra: ${formatHours(freeTime)} de espera/acao curta.`
            : ''
        const logText = `${entry.partyName} chegou a ${destinationLabel} apos ${formatHours(entry.timeHours)}.${encounterText}${hiddenText}${freeTimeText}`
        const technicalText = `Origem: ${entry.originName}. Destino: ${destinationLabel}. Submapa: ${entry.destinationSubmapName ?? 'S0'}. Risco: ${entry.risk}. Rotas: ${entry.routeNames.join(' / ') || 'movimento livre'}. Eventos: ${consequences.events.join(', ') || 'nenhum'}.`

        if (party) {
          if (party.memberPlayerIds.length > 0) {
            nextDiscoveredPublicLocations.add(entry.destinationId)
          }

          nextParties[entry.partyId] = createWorldMundiParty({
            ...party,
            localAtualId: entry.destinationId,
            submapAtualId: nextSubmapId,
            destinoAtualId: '',
            estado: 'junto',
            ultimoLog: logText,
          })
          party.memberPlayerIds.forEach((playerId) => {
            const player = currentState.players[playerId]
            const consciencia = player ? nextConsciousnesses[player.conscienciaId] : null
            const corpo = consciencia ? nextBodies[consciencia.corpoAtualId] : null

            if (consciencia) {
              nextConsciousnesses[consciencia.id] = createWorldMundiConsciousness({
                ...consciencia,
                grupoAtualId: entry.partyId,
              })
            }

            if (corpo) {
              nextBodies[corpo.id] = createWorldMundiBody({
                ...corpo,
                localAtualId: entry.destinationId,
                submapAtualId: nextSubmapId,
              })
            }
          })
          party.memberCharacterIds.forEach((characterId) => {
            const npc = nextNpcs[characterId]

            if (npc) {
              nextNpcs[characterId] = createWorldMundiNpcState({
                ...npc,
                emViagem: false,
                estadoSimulacao:
                  party.memberPlayerIds.length > 0
                    ? 'acompanhando_grupo'
                    : npc.estadoSimulacao,
                localAtualId: entry.destinationId,
                presencaNoMapa: normalizeFreePresence(npc.presencaNoMapa),
                submapAtualId: nextSubmapId,
                viagemDestinoId: '',
                viagemMotivo: '',
                viagemOrigemId: '',
                viagemTempoRestante: 0,
                ultimoLog: `${entry.partyName} chegou a ${entry.destinationName}.`,
              })
            }
          })
          party.memberEntityIds.forEach((entityId) => {
            const entity = nextEntities[entityId]

            if (entity) {
              nextEntities[entityId] = createWorldMundiEntity({
                ...entity,
                localAtualId: entry.destinationId,
                rotaAtualId: '',
                submapAtualId: nextSubmapId,
                ultimoLog: `${entry.partyName} chegou a ${entry.destinationName}.`,
              })
            }
          })
        }

        return createWorldMundiLogEntry({
          dia: nextClock.dia,
          hora: nextClock.hora,
          texto: logText,
          tecnico: technicalText,
          categoria: 'players',
          canal: 'mestre',
          tone: getRiskScore(entry.risk) >= 4 ? 'critical' : 'watch',
        })
      })

      const stateAfterMovement: WorldMundiState = {
        ...currentState,
        clock: nextClock,
        consciencias: nextConsciousnesses,
        corpos: nextBodies,
        locations: nextLocations,
        npcs: nextNpcs,
        entities: nextEntities,
        parties: nextParties,
        publicMap: {
          ...currentState.publicMap,
          discoveredLocationIds: Array.from(nextDiscoveredPublicLocations),
        },
        selectedLocationId: lastEntry.destinationId,
        logs: [...movementLogs, ...currentState.logs],
      }
      return stateAfterMovement
    })
    setTimePlanEntries([])
    setMovementDestinationId('')
    setMovementNotice(
      `${notice} O mundo avancou ${formatHours(totalHours)}.${
        potentialContactNames.length > 0
          ? ` Possivel contato: ${potentialContactNames.join(', ')}.`
          : ''
      }`,
    )
    registerNpcContacts(potentialContactIds)
    setSimulationPreview([])
  }

  function confirmTimePlan() {
    applyMovementEntries(timePlanEntries, 'Plano aplicado.')
  }

  function buildSimulationPreview(hours: number) {
    const window = getNpcSimulationWindow(hours)

    if (window.turnCount === 0) {
      setSimulationPreview([])
      setMovementNotice(
        `Janela de ${formatHours(window.playerHours)} nao cria novo estado autonomo. Use ${formatHours(NPC_SIMULATION_TURN_HOURS)} ou mais, ou avance apenas o relogio.`,
      )
      return
    }

    setSimulationPreview(createSimulationSuggestions(window.npcHours))
    setMovementNotice(
      `Previa criada: ${formatHours(window.playerHours)} de mundo = ${formatHours(window.npcHours)} para NPCs soltos (${window.turnCount} turno(s)).`,
    )
  }

  function applySimulationPreview() {
    if (simulationPreview.length === 0) {
      return
    }

    pushUndoSnapshot(state)
    commit((currentState) =>
      applySimulationSuggestionsToState(currentState, simulationPreview, currentState.clock),
    )
    setSimulationPreview([])
  }

  function addManualLog() {
    const text = manualLogText.trim()

    if (!text) {
      return
    }

    const nextLog = createWorldMundiLogEntry({
      dia: state.clock.dia,
      hora: state.clock.hora,
      texto: text,
      categoria: 'mundo',
      canal: 'mestre',
      tone: 'watch',
    })

    commit((currentState) => ({
      ...currentState,
      logs: [nextLog, ...currentState.logs],
    }))
    setManualLogText('')
  }

  function snapshotContactOverrides() {
    setContactUndoStack((currentStack) =>
      [
        {
          ignoredContactIds: ignoredSessionContactIds,
          sessionContactIds,
        },
        ...currentStack,
      ].slice(0, 12),
    )
  }

  function registerNpcContacts(characterIds: string[], notice?: string, force = false) {
    const nextIds = Array.from(
      new Set(
        characterIds.filter(
          (characterId) =>
            characterId && (force || !ignoredSessionContactIdSet.has(characterId)),
        ),
      ),
    )

    if (nextIds.length === 0) {
      return
    }

    snapshotContactOverrides()
    setSessionContactIds((currentIds) => Array.from(new Set([...currentIds, ...nextIds])))
    setIgnoredSessionContactIds((currentIds) =>
      currentIds.filter((characterId) => !nextIds.includes(characterId)),
    )

    if (notice) {
      setMovementNotice(notice)
    }
  }

  function dismissNpcContact(characterId: string) {
    snapshotContactOverrides()
    setIgnoredSessionContactIds((currentIds) => Array.from(new Set([...currentIds, characterId])))
    setSessionContactIds((currentIds) => currentIds.filter((id) => id !== characterId))
  }

  function undoLastContactChange() {
    const [lastSnapshot, ...remainingStack] = contactUndoStack

    if (!lastSnapshot) {
      return
    }

    setSessionContactIds(lastSnapshot.sessionContactIds)
    setIgnoredSessionContactIds(lastSnapshot.ignoredContactIds)
    setContactUndoStack(remainingStack)
  }

  function clearSessionContacts() {
    snapshotContactOverrides()
    setSessionContactIds([])
    setIgnoredSessionContactIds([])
    setSessionNpcDrafts({})
  }

  function collectPotentialContactIdsForEntries(entries: TimePlanEntry[]) {
    const contactIds = new Set<string>()

    entries
      .filter((entry) => state.parties[entry.partyId]?.memberPlayerIds.length > 0)
      .forEach((entry) => {
        const destinationSubmapId = entry.destinationSubmapId ?? ''

        activeNpcStates.forEach((npc) => {
          if (
            occupiedNpcCharacterIds.has(npc.characterId) ||
            partyNpcCharacterIds.has(npc.characterId) ||
            npc.presencaNoMapa === 'inativo' ||
            npc.presencaNoMapa === 'selado' ||
            !isSameMundiPlace(
              entry.destinationId,
              destinationSubmapId,
              npc.localAtualId,
              npc.submapAtualId,
            )
          ) {
            return
          }

          contactIds.add(npc.characterId)
        })

        activeParties.forEach((party) => {
          if (
            party.id === entry.partyId ||
            party.memberCharacterIds.length === 0 ||
            !isSameMundiPlace(
              entry.destinationId,
              destinationSubmapId,
              party.localAtualId,
              party.submapAtualId,
            )
          ) {
            return
          }

          party.memberCharacterIds.forEach((characterId) => {
            const npc = state.npcs[characterId]

            if (
              npc &&
              !occupiedNpcCharacterIds.has(characterId) &&
              npc.presencaNoMapa !== 'inativo' &&
              npc.presencaNoMapa !== 'selado'
            ) {
              contactIds.add(characterId)
            }
          })
        })
      })

    return Array.from(contactIds)
  }

  function updateSessionNpcDraft(
    characterId: string,
    partialDraft: Partial<SessionNpcDraft>,
  ) {
    setSessionNpcDrafts((currentDrafts) => ({
      ...currentDrafts,
      [characterId]: {
        ...(currentDrafts[characterId] ?? createSessionNpcDraft()),
        ...partialDraft,
      },
    }))
  }

  function saveSessionStoryContext() {
    const draftsToSave = Object.entries(sessionNpcDrafts).filter(([, draft]) =>
      [
        draft.contexto,
        draft.eventoChave,
        draft.medoAtual,
        draft.objetivoAtual,
        draft.promessaOuConflito,
      ].some((value) => value.trim()) ||
      draft.afinidadeDelta !== 0 ||
      draft.ameacaDelta !== 0 ||
      draft.confiancaDelta !== 0,
    )

    if (draftsToSave.length === 0) {
      setMovementNotice('Nenhum contexto de NPC preenchido para salvar.')
      return
    }

    commit((currentState) => {
      const nextNpcs = { ...currentState.npcs }
      const logs = draftsToSave.map(([characterId, draft]) => {
        const npc = nextNpcs[characterId]
        const characterName = characterById.get(characterId)?.nome ?? characterId
        const summaryParts = [
          draft.eventoChave.trim() ? `Evento: ${draft.eventoChave.trim()}` : '',
          draft.contexto.trim() ? `Contexto: ${draft.contexto.trim()}` : '',
          draft.objetivoAtual.trim() ? `Objetivo: ${draft.objetivoAtual.trim()}` : '',
          draft.medoAtual.trim() ? `Medo: ${draft.medoAtual.trim()}` : '',
          draft.promessaOuConflito.trim()
            ? `Promessa/conflito: ${draft.promessaOuConflito.trim()}`
            : '',
        ].filter(Boolean)
        const sessionSummary =
          summaryParts.join(' | ') ||
          `Ajuste relacional: afinidade ${draft.afinidadeDelta}, confianca ${draft.confiancaDelta}, ameaca ${draft.ameacaDelta}.`

        if (npc) {
          const nextShortMemory = [
            `Dia ${currentState.clock.dia} ${formatClockTime(currentState.clock.hora)} - ${sessionSummary}`,
            ...npc.memoriaSimulacao.memoriaCurta,
          ].slice(0, 12)

          nextNpcs[characterId] = createWorldMundiNpcState({
            ...npc,
            contextoNarrativo: draft.contexto.trim()
              ? `${npc.contextoNarrativo ? `${npc.contextoNarrativo}\n` : ''}${draft.contexto.trim()}`
              : npc.contextoNarrativo,
            estadoSimulacao:
              npc.estadoSimulacao === 'acompanhando_grupo'
                ? 'pausado_por_contexto'
                : npc.estadoSimulacao,
            objetivoAtual: draft.objetivoAtual.trim() || npc.objetivoAtual,
            memoriaSimulacao: {
              ...npc.memoriaSimulacao,
              afinidadeComPlayers: Math.max(
                -5,
                Math.min(5, npc.memoriaSimulacao.afinidadeComPlayers + draft.afinidadeDelta),
              ),
              ameacaPercebidaPlayers: Math.max(
                0,
                Math.min(5, npc.memoriaSimulacao.ameacaPercebidaPlayers + draft.ameacaDelta),
              ),
              conheceuPlayers: true,
              confiancaNosPlayers: Math.max(
                0,
                Math.min(5, npc.memoriaSimulacao.confiancaNosPlayers + draft.confiancaDelta),
              ),
              conflitoPendente:
                draft.promessaOuConflito.trim() || npc.memoriaSimulacao.conflitoPendente,
              medoAtual: draft.medoAtual.trim() || npc.memoriaSimulacao.medoAtual,
              memoriaCurta: nextShortMemory,
              querEncontrarPlayersNovamente:
                npc.memoriaSimulacao.querEncontrarPlayersNovamente ||
                draft.afinidadeDelta > 0 ||
                draft.confiancaDelta > 0,
              querEvitarPlayers:
                npc.memoriaSimulacao.querEvitarPlayers || draft.ameacaDelta > 0,
            },
            ultimoLog: `Contexto de sessao salvo: ${sessionSummary}`,
          })
        }

        return createWorldMundiLogEntry({
          dia: currentState.clock.dia,
          hora: currentState.clock.hora,
          texto: `${characterName}: contexto de sessao salvo.`,
          tecnico: sessionSummary,
          categoria: 'npcs',
          canal: 'mestre',
          tone: draft.ameacaDelta > 0 ? 'watch' : 'steady',
        })
      })

      return {
        ...currentState,
        npcs: nextNpcs,
        logs: [
          ...logs,
          createWorldMundiLogEntry({
            dia: currentState.clock.dia,
            hora: currentState.clock.hora,
            texto: `Sessao salva para ${draftsToSave.length} NPC(s).`,
            tecnico:
              'Resumo de Historia gravado em memoria curta dos NPCs. Use Canon para transformar eventos maiores em fatos aprovados.',
            categoria: 'sistema',
            canal: 'mestre',
            tone: 'steady',
          }),
          ...currentState.logs,
        ],
      }
    })
    draftsToSave.forEach(([characterId, draft]) => {
      const characterName = characterById.get(characterId)?.nome ?? characterId
      const summaryParts = [
        draft.eventoChave.trim() ? `Evento: ${draft.eventoChave.trim()}` : '',
        draft.contexto.trim() ? `Contexto: ${draft.contexto.trim()}` : '',
        draft.objetivoAtual.trim() ? `Objetivo: ${draft.objetivoAtual.trim()}` : '',
        draft.medoAtual.trim() ? `Medo: ${draft.medoAtual.trim()}` : '',
        draft.promessaOuConflito.trim()
          ? `Promessa/conflito: ${draft.promessaOuConflito.trim()}`
          : '',
      ].filter(Boolean)

      appendWorldSimulationEvent(
        campaignId,
        createWorldSimulationEvent({
          actor: characterId,
          actorLabel: characterName,
          campaignId,
          canonStatus: 'canon_candidate',
          mapId: state.npcs[characterId]?.localAtualId,
          sceneId: selectedLocation?.id,
          text:
            summaryParts.join(' | ') ||
            `Ajuste relacional com jogadores: afinidade ${draft.afinidadeDelta}, confianca ${draft.confiancaDelta}, ameaca ${draft.ameacaDelta}.`,
          type: 'gm_note',
        }),
      )
    })
    refreshSimulationEvents()
    setSessionNpcDrafts({})
    setMovementNotice(`Contexto salvo para ${draftsToSave.length} NPC(s).`)
    setActiveTab('canon')
  }

  function exportSessionCheckpoint() {
    const exportedAt = new Date().toISOString()
    const safeName = (sessionCheckpointName.trim() || 'sessao-fushi')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
    const payload = {
      version: 1,
      type: 'fushi-session-checkpoint',
      campaignId,
      exportedAt,
      name: sessionCheckpointName.trim() || 'Sessao FUSHI',
      summary: sessionCheckpointSummary.trim(),
      world: createWorldMundiState(state),
      simulationEvents: readWorldSimulationEvents(campaignId),
      simulationSummary: buildWorldSimulationSessionSummary(campaignId),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `fushi-${safeName || 'sessao'}-${exportedAt.slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setSessionCheckpointStatus('Checkpoint exportado como JSON.')
  }

  async function importSessionCheckpoint(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null

    if (!file) {
      return
    }

    try {
      const parsedValue = JSON.parse(await file.text()) as {
        name?: unknown
        summary?: unknown
        simulationEvents?: unknown
        type?: unknown
        world?: unknown
      }

      if (parsedValue.type !== 'fushi-session-checkpoint' || !parsedValue.world) {
        throw new Error('Arquivo nao parece ser um checkpoint de sessao do FUSHI.')
      }

      const nextWorld = createWorldMundiState(parsedValue.world as Partial<WorldMundiState>)
      const importedLog = createWorldMundiLogEntry({
        dia: nextWorld.clock.dia,
        hora: nextWorld.clock.hora,
        texto: `Checkpoint de sessao importado: ${
          typeof parsedValue.name === 'string' ? parsedValue.name : file.name
        }.`,
        tecnico:
          typeof parsedValue.summary === 'string'
            ? parsedValue.summary
            : 'Estado core do MUN restaurado a partir de arquivo externo.',
        categoria: 'sistema',
        canal: 'mestre',
        tone: 'steady',
      })

      if (Array.isArray(parsedValue.simulationEvents)) {
        writeWorldSimulationEvents(
          campaignId,
          parsedValue.simulationEvents.filter(
            (entry): entry is WorldSimulationEvent =>
              Boolean(entry) && typeof entry === 'object',
          ),
        )
        refreshSimulationEvents()
      }

      onChange(
        createWorldMundiState({
          ...nextWorld,
          logs: [importedLog, ...nextWorld.logs],
        }),
      )
      setSessionCheckpointName(
        typeof parsedValue.name === 'string' ? parsedValue.name : 'Sessao importada',
      )
      setSessionCheckpointSummary(
        typeof parsedValue.summary === 'string' ? parsedValue.summary : '',
      )
      setSessionCheckpointStatus('Checkpoint importado e aplicado ao MUN.')
      setSessionContactIds([])
      setIgnoredSessionContactIds([])
      setSessionNpcDrafts({})
    } catch (error) {
      setSessionCheckpointStatus(
        error instanceof Error ? error.message : 'Nao foi possivel importar este checkpoint.',
      )
    } finally {
      event.currentTarget.value = ''
    }
  }

  function startSessionRecording() {
    if (sessionRecording) {
      return
    }

    setSessionRecording(true)
    commit((currentState) => ({
      ...currentState,
      logs: [
        createWorldMundiLogEntry({
          dia: currentState.clock.dia,
          hora: currentState.clock.hora,
          texto: `Sessao iniciada: ${sessionCheckpointName.trim() || 'Sessao atual'}.`,
          tecnico:
            'Marcador de sessao ligado. A partir daqui, movimentos, contatos, rolagens, Canon e logs do MUN devem compor o checkpoint.',
          categoria: 'sistema',
          canal: 'mestre',
          tone: 'steady',
        }),
        ...currentState.logs,
      ],
    }))
    setSessionCheckpointStatus('Sessao ligada: logs novos entram no checkpoint.')
  }

  function stopSessionRecording() {
    if (!sessionRecording) {
      return
    }

    setSessionRecording(false)
    commit((currentState) => ({
      ...currentState,
      logs: [
        createWorldMundiLogEntry({
          dia: currentState.clock.dia,
          hora: currentState.clock.hora,
          texto: `Sessao encerrada: ${sessionCheckpointName.trim() || 'Sessao atual'}.`,
          tecnico:
            'Marcador de sessao desligado. Exporte a historia para salvar um checkpoint externo desta mesa.',
          categoria: 'sistema',
          canal: 'mestre',
          tone: 'watch',
        }),
        ...currentState.logs,
      ],
    }))
    setSessionCheckpointStatus('Sessao encerrada. Exporte a historia para guardar o checkpoint.')
  }

  function renderLocationSelect(
    value: string,
    onSelect: (nextLocationId: string) => void,
  ) {
    return (
      <select
        className="field__input"
        onChange={(event) => onSelect(event.target.value)}
        value={value}
      >
        <option value="">Sem local</option>
        {state.locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.nome}
          </option>
        ))}
      </select>
    )
  }

  function renderActiveGroups() {
    return (
      <article className="list-card">
        <div className="list-card__top">
          <div>
            <p className="eyebrow">Grupos ativos</p>
            <h3>{activeParties.length} grupo(s)</h3>
          </div>
          <span className="tag">{movementMode === 'planning' ? 'planejamento' : 'mesa'}</span>
        </div>

        <div className="world-mundi__group-row">
          {activeParties.map((party) => {
            const plannedEntry = timePlanEntries.find((entry) => entry.partyId === party.id)

            return (
              <div
                className={`world-mundi__group-card${
                  selectedParty?.id === party.id ? ' world-mundi__group-card--active' : ''
                }`}
                draggable
                key={party.id}
                onDragEnd={() => setDraggedPartyId('')}
                onDragStart={(event) => startPartyDrag(event, party.id)}
                style={
                  {
                    '--party-color': getPartyColor(party.id, activeParties),
                  } as CSSProperties
                }
              >
                <div className="list-card__top">
                  <div>
                    <label className="world-mundi__group-name-field">
                      <span>Nome do grupo</span>
                      <input
                        className="field__input"
                        draggable={false}
                        onChange={(event) => renameParty(party.id, event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        onMouseDown={(event) => event.stopPropagation()}
                        value={getPartyDisplayName(party)}
                      />
                    </label>
                    <p className="support-copy">{getPartyMemberLabel(party, entityById, characterById)}</p>
                  </div>
                  <span className="tag">
                    {state.locations.find((location) => location.id === party.localAtualId)?.nome ??
                      'sem local'}
                  </span>
                </div>
                <p className="support-copy">Estado: {formatLabel(party.estado)}</p>
                {plannedEntry ? (
                  <p className="support-copy">
                    Planejado: {plannedEntry.originName} -&gt; {plannedEntry.destinationName} |{' '}
                    {formatHours(plannedEntry.timeHours)}
                  </p>
                ) : null}
                <div className="world-mundi__member-grid">
                  {[
                    ...party.memberPlayerIds.map((playerId) => ({
                      id: `player:${playerId}`,
                      kind: 'player' as const,
                      label: state.players[playerId]?.nome ?? playerId.replace('player', 'Jogador '),
                    })),
                    ...party.memberCharacterIds.map((characterId) => ({
                      avatarUrl: getCharacterPortrait(characterById.get(characterId)),
                      id: `npc:${characterId}`,
                      kind: 'npc' as const,
                      label: characterById.get(characterId)?.nome ?? characterId,
                    })),
                    ...party.memberEntityIds.map((entityId) => ({
                      id: `entity:${entityId}`,
                      kind: 'entity' as const,
                      label: entityById.get(entityId)?.nome ?? entityId,
                    })),
                  ].map((member) => (
                    <label
                      className="world-mundi__member-option"
                      draggable={member.kind === 'npc' || member.kind === 'entity'}
                      key={member.id}
                      onDragEnd={() => setDraggedMemberId('')}
                      onDragStart={() => setDraggedMemberId(member.id)}
                    >
                      <input
                        checked={memberSelection.includes(member.id)}
                        onChange={() => toggleMemberSelection(member.id)}
                        type="checkbox"
                      />
                      <span className="world-mundi__member-avatar">
                        {'avatarUrl' in member && member.avatarUrl ? (
                          <img alt="" src={resolveRuntimeAssetUrl(member.avatarUrl)} />
                        ) : (
                          member.label.slice(0, 2).toUpperCase()
                        )}
                      </span>
                      <span>{member.label}</span>
                      <small>{formatLabel(member.kind)}</small>
                    </label>
                  ))}
                </div>
                <div className="tabletop-hud-panel__actions">
                  <button className="button" onClick={() => selectParty(party.id)} type="button">
                    Selecionar
                  </button>
                  <button className="button" onClick={() => splitSelectedMembersFromParty(party)} type="button">
                    Dividir
                  </button>
                  <button className="button" onClick={() => startNpcRelease(party)} type="button">
                    Remover NPC/contexto
                  </button>
                  <button className="button" onClick={() => dissolveParty(party.id)} type="button">
                    Dissolver
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="tabletop-hud-panel__actions">
          <button className="button" onClick={createPartyAtSelectedLocation} type="button">
            Criar grupo com selecao
          </button>
          <button
            className="button"
            disabled={
              !selectedParty ||
              activeParties.every(
                (party) =>
                  party.id === selectedParty.id || party.localAtualId !== selectedParty.localAtualId,
              )
            }
            onClick={mergePartiesAtSelectedLocation}
            type="button"
          >
            Unir grupos no local
          </button>
          <button className="button" onClick={() => startReincarnation()} type="button">
            Reencarnar consciencia
          </button>
        </div>
      </article>
    )
  }

  function renderHistoryTab() {
    const npcsToShow = sessionContactNpcs

    return (
      <div className="list-stack">
        <article className="list-card">
          <div className="list-card__top">
            <div>
              <p className="eyebrow">Historia da sessao</p>
              <h3>Contexto vivo dos NPCs</h3>
            </div>
            <span className="tag">{npcsToShow.length} NPC(s)</span>
          </div>
          <p className="support-copy">
            Use esta aba quando o grupo realmente cruzar com um NPC. Afinidade, confianca e ameaca sao sempre em relacao ao grupo/jogadores, nao ao mundo inteiro.
          </p>
          <div className="tabletop-hud-panel__actions">
            <button className="button button--primary" onClick={saveSessionStoryContext} type="button">
              Salvar sessao
            </button>
            <button className="button" onClick={clearSessionContacts} type="button">
              Limpar contatos
            </button>
            {contactUndoStack.length > 0 ? (
              <button className="button" onClick={undoLastContactChange} type="button">
                Desfazer contato
              </button>
            ) : null}
            <button className="button" onClick={() => setActiveTab('canon')} type="button">
              Revisar Canon
            </button>
          </div>
        </article>

        {npcsToShow.length === 0 ? (
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Sem contato registrado</p>
                <h3>Nenhum NPC entrou em cena com o grupo ainda</h3>
              </div>
              <span className="tag">sessao limpa</span>
            </div>
            <p className="support-copy">
              Quando o grupo entrar em um ponto do MUN com NPCs, eles aparecem aqui como possivel contato. Se o encontro nao aconteceu na narrativa, marque "Nao encontraram".
            </p>
          </article>
        ) : null}

        <div className="cards-grid cards-grid--dense">
          {npcsToShow.map((npc) => {
            const character = characterById.get(npc.characterId)
            const draft = sessionNpcDrafts[npc.characterId] ?? createSessionNpcDraft()
            const location = locationById.get(npc.localAtualId)
            const submap = npc.submapAtualId ? submapById.get(npc.submapAtualId) : null
            const portrait = getCharacterPortrait(character)

            return (
              <article className="list-card world-mundi__session-npc-card" key={npc.characterId}>
                <div className="list-card__top">
                  <div className="world-mundi__session-npc-heading">
                    <span className="world-mundi__npc-preview-avatar">
                      {portrait ? (
                        <img alt="" src={resolveRuntimeAssetUrl(portrait)} />
                      ) : (
                        (character?.nome ?? npc.characterId).slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <span>
                      <p className="eyebrow">{location?.nome ?? 'Sem local'}</p>
                      <h3>{character?.nome ?? npc.characterId}</h3>
                    </span>
                  </div>
                  <span className="tag">{submap?.codigo ?? (npc.submapAtualId ? 'Submapa' : 'S0')}</span>
                </div>

                <div className="tag-row">
                  <span className="tag">{formatLabel(npc.estadoSimulacao)}</span>
                  <span className="tag">{formatLabel(npc.presencaNoMapa)}</span>
                  <span className="tag">Conf grupo {npc.memoriaSimulacao.confiancaNosPlayers}</span>
                  <span className="tag">Afin grupo {npc.memoriaSimulacao.afinidadeComPlayers}</span>
                  <span className="tag">Ameaca players {npc.memoriaSimulacao.ameacaPercebidaPlayers}</span>
                </div>

                <label className="field">
                  <span>1. O que aconteceu de importante?</span>
                  <input
                    className="field__input"
                    onChange={(event) =>
                      updateSessionNpcDraft(npc.characterId, { eventoChave: event.target.value })
                    }
                    value={draft.eventoChave}
                  />
                </label>
                <label className="field">
                  <span>2. Como isso muda a vontade/objetivo dele?</span>
                  <input
                    className="field__input"
                    onChange={(event) =>
                      updateSessionNpcDraft(npc.characterId, { objetivoAtual: event.target.value })
                    }
                    value={draft.objetivoAtual}
                  />
                </label>
                <label className="field">
                  <span>3. Algum medo, promessa ou conflito novo?</span>
                  <input
                    className="field__input"
                    onChange={(event) =>
                      updateSessionNpcDraft(npc.characterId, {
                        promessaOuConflito: event.target.value,
                      })
                    }
                    value={draft.promessaOuConflito}
                  />
                </label>
                <label className="field">
                  <span>4. Medo atual</span>
                  <input
                    className="field__input"
                    onChange={(event) =>
                      updateSessionNpcDraft(npc.characterId, { medoAtual: event.target.value })
                    }
                    value={draft.medoAtual}
                  />
                </label>
                <label className="field">
                  <span>5. Descricao livre do impacto</span>
                  <textarea
                    className="field__input field__input--textarea"
                    onChange={(event) =>
                      updateSessionNpcDraft(npc.characterId, { contexto: event.target.value })
                    }
                    value={draft.contexto}
                  />
                </label>

                <div className="cards-grid cards-grid--dense">
                  {([
                    ['afinidadeDelta', 'Afinidade com grupo', -5, 5],
                    ['confiancaDelta', 'Confianca nos players', -5, 5],
                    ['ameacaDelta', 'Ameaca percebida', -5, 5],
                  ] as const).map(([field, label, min, max]) => (
                    <label className="field" key={field}>
                      <span>
                        {label} {draft[field] > 0 ? `+${draft[field]}` : draft[field]}
                      </span>
                      <input
                        max={max}
                        min={min}
                        onChange={(event) =>
                          updateSessionNpcDraft(npc.characterId, {
                            [field]: clampInteger(event.target.value, draft[field], min, max),
                          })
                        }
                        type="range"
                        value={draft[field]}
                      />
                    </label>
                  ))}
                </div>
                <div className="tabletop-hud-panel__actions">
                  <button
                    className="button button--compact"
                    onClick={() => dismissNpcContact(npc.characterId)}
                    type="button"
                  >
                    Nao encontraram
                  </button>
                  <button
                    className="button button--compact"
                    onClick={() => {
                      setExpandedNpcCatalogId(npc.characterId)
                      setActiveTab('personagens')
                    }}
                    type="button"
                  >
                    Ver personagem
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    )
  }

  function renderNpcCatalogTab() {
    const npcsToShow = [...activeNpcStates].sort((a, b) => {
      const nameA = characterById.get(a.characterId)?.nome ?? a.characterId
      const nameB = characterById.get(b.characterId)?.nome ?? b.characterId

      return nameA.localeCompare(nameB)
    })
    const factionGroups = new Map<
      string,
      {
        faction?: FactionItem
        label: string
        npcs: WorldMundiNpcState[]
      }
    >()

    npcsToShow.forEach((npc) => {
      const character = characterById.get(npc.characterId)
      const factionKey = character?.faccao || 'sem_faccao'
      const faction = factionById.get(factionKey)
      const currentGroup = factionGroups.get(factionKey) ?? {
        faction,
        label: faction?.nome ?? (character?.faccao ? formatLabel(character.faccao) : 'Sem faccao'),
        npcs: [],
      }

      currentGroup.npcs.push(npc)
      factionGroups.set(factionKey, currentGroup)
    })
    const defaultFactionOrder = factions.map((faction) => faction.id)
    const preferredFactionOrder = state.ui?.factionOrderIds ?? []
    const orderedFactionEntries = [...factionGroups.entries()].sort(([leftId], [rightId]) => {
      const leftIndex = [...preferredFactionOrder, ...defaultFactionOrder].indexOf(leftId)
      const rightIndex = [...preferredFactionOrder, ...defaultFactionOrder].indexOf(rightId)

      if (leftIndex !== -1 || rightIndex !== -1) {
        return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
      }

      return leftId.localeCompare(rightId)
    })

    const renderNpcCatalogCard = (npc: WorldMundiNpcState) => {
      const character = characterById.get(npc.characterId)
      const portrait = getCharacterPortrait(character)
      const location = locationById.get(npc.localAtualId)
      const submap = npc.submapAtualId ? submapById.get(npc.submapAtualId) : null
      const party = activeParties.find((entry) =>
        entry.memberCharacterIds.includes(npc.characterId),
      )
      const isExpanded = expandedNpcCatalogId === npc.characterId
      const latestNpcLogs = state.logs
        .filter((log) => {
          const name = character?.nome ?? npc.characterId

          return log.texto.includes(name) || log.tecnico.includes(name)
        })
        .slice(0, 4)

      return (
        <article
          className={`world-mundi__npc-catalog-card${
            isExpanded ? ' world-mundi__npc-catalog-card--expanded' : ''
          }`}
          key={npc.characterId}
        >
          <button
            className="world-mundi__npc-catalog-main"
            onClick={() =>
              setExpandedNpcCatalogId((currentId) =>
                currentId === npc.characterId ? '' : npc.characterId,
              )
            }
            type="button"
          >
            <span className="world-mundi__npc-preview-avatar">
              {portrait ? (
                <img alt="" src={resolveRuntimeAssetUrl(portrait)} />
              ) : (
                (character?.nome ?? npc.characterId).slice(0, 2).toUpperCase()
              )}
            </span>
            <span>
              <strong>{character?.nome ?? npc.characterId}</strong>
              <small>
                {location?.nome ?? 'Sem local'}
                {submap ? ` / ${submap.codigo}` : ' / S0'}
              </small>
            </span>
            <em>{formatLabel(npc.intencaoAtual)}</em>
          </button>

          {isExpanded ? (
            <div className="world-mundi__npc-catalog-detail">
              <div className="tag-row">
                <span className="tag">{formatLabel(npc.estadoSimulacao)}</span>
                <span className="tag">{formatLabel(npc.presencaNoMapa)}</span>
                {party ? <span className="tag">Grupo: {getPartyDisplayName(party)}</span> : null}
              </div>
              <p className="support-copy">
                <strong>Localizacao:</strong> {location?.nome ?? 'Sem local'}
                {submap ? ` / ${submap.nome}` : ' / mapa principal'}
              </p>
              <p className="support-copy">
                <strong>Descricao breve:</strong>{' '}
                {npc.objetivoAtual || npc.ultimoLog || 'Aguardando objetivo confirmado.'}
              </p>
              <p className="support-copy">
                <strong>Ultimo estado:</strong>{' '}
                {npc.ultimoLog || 'Sem log recente deste personagem.'}
              </p>
              {npc.memoriaSimulacao.memoriaCurta.length > 0 ? (
                <div className="world-mundi__preview-card">
                  <strong>Memoria curta</strong>
                  {npc.memoriaSimulacao.memoriaCurta.slice(0, 3).map((memory) => (
                    <p className="support-copy" key={memory}>
                      {memory}
                    </p>
                  ))}
                </div>
              ) : null}
              {latestNpcLogs.length > 0 ? (
                <div className="world-mundi__preview-card">
                  <strong>Logs relacionados</strong>
                  {latestNpcLogs.map((log) => (
                    <p className="support-copy" key={log.id}>
                      Dia {log.dia} {formatClockTime(log.hora)} - {log.texto}
                    </p>
                  ))}
                </div>
              ) : null}
              <div className="tabletop-hud-panel__actions">
                <button
                  className="button button--compact"
                  onClick={() => {
                    commit((currentState) => ({
                      ...currentState,
                      selectedLocationId: npc.localAtualId,
                    }))
                    setActiveTab('mestre')
                  }}
                  type="button"
                >
                  Abrir no MUN
                </button>
                <button
                  className="button button--compact"
                  onClick={() => {
                    registerNpcContacts(
                      [npc.characterId],
                      `${character?.nome ?? 'NPC'} marcado como contato da sessao.`,
                      true,
                    )
                    setActiveTab('historia')
                  }}
                  type="button"
                >
                  Marcar contato
                </button>
              </div>
            </div>
          ) : null}
        </article>
      )
    }

    return (
      <div className="list-stack">
        <article className="list-card">
          <div className="list-card__top">
            <div>
              <p className="eyebrow">Personagens vivos</p>
              <h3>Catalogo dinamico de NPCs</h3>
            </div>
            <span className="tag">{npcsToShow.length} NPC(s)</span>
          </div>
          <p className="support-copy">
            Painel do mestre para saber onde cada NPC esta e qual e o estado objetivo dele na simulacao.
          </p>
        </article>

        {orderedFactionEntries.map(([factionId, factionGroup]) => {
          const factionLogoUrl = getFactionLogoUrl(factionId)

          return (
          <details
            className={`world-mundi__npc-faction-section${
              draggedFactionId === factionId ? ' world-mundi__npc-faction-section--dragging' : ''
            }`}
            key={factionId}
            onDragOver={(event) => {
              if (draggedFactionId && draggedFactionId !== factionId) {
                event.preventDefault()
              }
            }}
            onDrop={(event) => {
              event.preventDefault()
              reorderFactionSection(draggedFactionId, factionId)
              setDraggedFactionId('')
            }}
            open
          >
            <summary>
              <span
                className="world-mundi__faction-drag-handle"
                draggable
                onClick={(event) => event.preventDefault()}
                onDragEnd={() => setDraggedFactionId('')}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move'
                  setDraggedFactionId(factionId)
                }}
                title="Arraste para mudar a prioridade desta faccao"
              >
                ||
              </span>
              {factionLogoUrl ? (
                <span className="world-mundi__faction-logo">
                  <img alt="" src={resolveRuntimeAssetUrl(factionLogoUrl)} />
                </span>
              ) : null}
              <span className="world-mundi__faction-summary-copy">
                <strong>{factionGroup.label}</strong>
                {factionGroup.faction?.resumo ? <small>{factionGroup.faction.resumo}</small> : null}
              </span>
              <em>{factionGroup.npcs.length} NPC(s)</em>
            </summary>
            <div className="world-mundi__npc-catalog-grid">
              {factionGroup.npcs.map(renderNpcCatalogCard)}
            </div>
          </details>
          )
        })}
      </div>
    )
  }

  function renderAiTab() {
    const groupedNpcIds = new Set(activeParties.flatMap((party) => party.memberCharacterIds))
    const liveNpcs = activeNpcStates.filter((npc) => npc.presencaNoMapa !== 'inativo')
    const freeNpcs = liveNpcs.filter((npc) => !groupedNpcIds.has(npc.characterId))
    const selectedLocationContacts = selectedLocation
      ? activeNpcStates.filter(
          (npc) =>
            npc.localAtualId === selectedLocation.id &&
            npc.presencaNoMapa !== 'inativo' &&
            !groupedNpcIds.has(npc.characterId),
        )
      : []

    return (
      <div className="list-stack">
        <article className="list-card">
          <div className="list-card__top">
            <div>
              <p className="eyebrow">IA / diagnostico</p>
              <h3>Leitura factual do MUN</h3>
            </div>
            <span className="tag">offline seguro</span>
          </div>
          <p className="support-copy">
            Este painel prepara o contexto para API sem inventar resposta: ele le o MUN, grupos, contatos, Canon e logs, e mostra exatamente o que esta sendo interpretado.
          </p>
          <label className="field">
            <span>Pergunta / foco do mestre</span>
            <textarea
              className="field__input field__input--textarea"
              onChange={(event) => setAiPromptText(event.target.value)}
              placeholder="Ex: a vila esta coerente com o que aconteceu na ultima sessao?"
              value={aiPromptText}
            />
          </label>
          <div className="tabletop-hud-panel__actions">
            <button className="button button--primary" onClick={buildAiWorldDiagnostic} type="button">
              Responder / diagnosticar
            </button>
            <button
              className="button"
              disabled={ollamaBusy}
              onClick={askOllamaDiagnostic}
              type="button"
            >
              Responder com Ollama
            </button>
            <button
              className="button"
              disabled={!aiDiagnosticText.trim()}
              onClick={applyAiAnswerAsCanonCandidate}
              type="button"
            >
              Aplicar resposta como nota
            </button>
            <button className="button" onClick={() => buildSimulationPreview(6)} type="button">
              Previa turno 6h
            </button>
            <button
              className="button"
              disabled={ollamaBusy}
              onClick={() => buildOllamaSimulationPreview(6)}
              type="button"
            >
              Previa Ollama 6h
            </button>
            <button
              className="button"
              disabled={simulationPreview.length === 0}
              onClick={applySimulationPreview}
              type="button"
            >
              Aplicar previa aprovada
            </button>
          </div>
        </article>

        <div className="world-mundi__ai-grid">
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Ollama local</p>
                <h3>Motor gratuito no seu PC</h3>
              </div>
              <span className="tag">{ollamaBusy ? 'processando' : 'local'}</span>
            </div>
            <div className="world-mundi__ai-settings">
              <label className="field">
                <span>Endereco</span>
                <input
                  className="field__input"
                  onChange={(event) =>
                    setOllamaConfig((currentConfig) => ({
                      ...currentConfig,
                      endpoint: event.target.value,
                    }))
                  }
                  value={ollamaConfig.endpoint}
                />
              </label>
              <label className="field">
                <span>Modelo</span>
                <input
                  className="field__input"
                  onChange={(event) =>
                    setOllamaConfig((currentConfig) => ({
                      ...currentConfig,
                      model: event.target.value,
                    }))
                  }
                  placeholder="llama3.1:8b"
                  value={ollamaConfig.model}
                />
              </label>
              <label className="field">
                <span>Temperatura</span>
                <input
                  className="field__input"
                  max="1"
                  min="0"
                  onChange={(event) =>
                    setOllamaConfig((currentConfig) => ({
                      ...currentConfig,
                      temperature: Number(event.target.value),
                    }))
                  }
                  step="0.1"
                  type="number"
                  value={ollamaConfig.temperature}
                />
              </label>
            </div>
            <div className="tabletop-hud-panel__actions">
              <button className="button" disabled={ollamaBusy} onClick={testOllamaLocal} type="button">
                Testar
              </button>
              <button
                className="button"
                disabled={ollamaBusy}
                onClick={() => void saveOllamaConfig()}
                type="button"
              >
                Salvar
              </button>
            </div>
            <p className="support-copy">{ollamaStatus}</p>
          </article>

          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Resumo operacional</p>
                <h3>Estado vivo atual</h3>
              </div>
              <span className="tag">MUN</span>
            </div>
            <div className="summary-grid">
              <div>
                <span>NPCs vivos</span>
                <strong>{liveNpcs.length}</strong>
              </div>
              <div>
                <span>NPCs livres</span>
                <strong>{freeNpcs.length}</strong>
              </div>
              <div>
                <span>Em grupo</span>
                <strong>{groupedNpcIds.size}</strong>
              </div>
              <div>
                <span>Canon pendente</span>
                <strong>{simulationSessionSummary.candidateCount}</strong>
              </div>
            </div>
            <p className="support-copy">
              Local selecionado: {selectedLocation?.nome ?? 'nenhum'} | NPCs soltos aqui:{' '}
              {selectedLocationContacts
                .map((npc) => characterById.get(npc.characterId)?.nome ?? npc.characterId)
                .join(', ') || 'nenhum'}
            </p>
          </article>

          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Diagnostico</p>
                <h3>Contexto comprimido</h3>
              </div>
              <span className="tag">{contextSnapshotText ? 'snapshot pronto' : 'aguardando'}</span>
            </div>
            <textarea
              className="field__input field__input--textarea world-mundi__ai-output"
              readOnly
              value={aiDiagnosticText || 'Gere um diagnostico para ver o que a IA local esta lendo do MUN.'}
              wrap="soft"
            />
          </article>
        </div>

        {simulationPreview.length > 0 ? (
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Previa de simulacao</p>
                <h3>{simulationPreview.length} sugestao(oes)</h3>
              </div>
              <span className="tag">precisa aprovacao</span>
            </div>
            <div className="world-mundi__simulation-grid">
              {simulationPreview.slice(0, 12).map((suggestion) => {
                const character = characterById.get(suggestion.characterId)

                return (
                  <article className="world-mundi__preview-card" key={suggestion.characterId}>
                    <strong>{character?.nome ?? suggestion.characterId}</strong>
                    <p className="support-copy">
                      {suggestion.actionText} | {suggestion.fromName} -&gt; {suggestion.toName}
                    </p>
                    <small>{suggestion.motivation}</small>
                  </article>
                )
              })}
            </div>
          </article>
        ) : null}
      </div>
    )
  }

  function renderPresenceStrip(members: WorldPresenceMember[], limit = 99) {
    if (members.length === 0) {
      return null
    }

    return (
      <div className="world-mundi__presence-strip">
        {members.slice(0, limit).map((member) => (
          <span
            className={`world-mundi__presence-chip world-mundi__presence-chip--${member.kind}`}
            draggable={member.kind === 'party' || member.kind === 'npc' || member.kind === 'entity'}
            key={member.id}
            onDragEnd={() => setDraggedMemberId('')}
            onDragStart={() => setDraggedMemberId(member.id)}
            title={`${member.label}${member.meta ? ` | ${member.meta}` : ''}`}
          >
            <span className="world-mundi__presence-avatar">
              {member.avatarUrl ? (
                <img alt="" src={resolveRuntimeAssetUrl(member.avatarUrl)} />
              ) : (
                member.label.slice(0, 2).toUpperCase()
              )}
            </span>
            <span className="world-mundi__presence-label">
              <strong>{member.label}</strong>
              {member.meta ? <small>{member.meta}</small> : null}
            </span>
          </span>
        ))}
        {members.length > limit ? (
          <span className="world-mundi__presence-more">+{members.length - limit}</span>
        ) : null}
      </div>
    )
  }

  function renderMemberCategory(title: string, members: SelectableWorldMember[]) {
    if (members.length === 0) {
      return null
    }

    return (
      <div className="list-stack">
        <h3>{title}</h3>
        <div className="world-mundi__member-grid">
          {members.map((member) => (
            <label
              className="world-mundi__member-option"
              draggable={member.kind === 'npc' || member.kind === 'entity'}
              key={member.id}
              onDragEnd={() => setDraggedMemberId('')}
              onDragStart={() => setDraggedMemberId(member.id)}
            >
              <input
                checked={memberSelection.includes(member.id)}
                onChange={() => toggleMemberSelection(member.id)}
                type="checkbox"
              />
              <span className="world-mundi__member-avatar">
                {member.avatarUrl ? (
                  <img alt="" src={resolveRuntimeAssetUrl(member.avatarUrl)} />
                ) : (
                  member.label.slice(0, 2).toUpperCase()
                )}
              </span>
              <span>
                {member.label}
                {member.meta ? <small>{member.meta}</small> : null}
              </span>
              {member.kind === 'npc' ? (
                <button
                  className="button button--compact"
                  title="Usar este NPC como corpo de jogador. Isso pausa a simulacao autonoma dele."
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    startReincarnation(undefined, {
                      bodyName: member.label,
                      bodyType: 'npc_importante',
                      locationId: selectedLocation?.id,
                      npcOriginalId: member.id.replace('npc:', ''),
                    })
                  }}
                  type="button"
                >
                  Corpo
                </button>
              ) : (
                <small>{formatLabel(member.kind)}</small>
              )}
            </label>
          ))}
        </div>
      </div>
    )
  }

  function renderWorldMap(mode: 'master' | 'editor' = 'master') {
    const selectedPartyLocationId = selectedParty?.localAtualId ?? ''
    const connectedRouteIds = new Set(
      state.routes
        .filter(
          (route) =>
            !route.bloqueada &&
            (route.origemId === selectedPartyLocationId ||
              route.destinoId === selectedPartyLocationId),
        )
        .map((route) => route.id),
    )
    const connectedLocationIds = new Set(
      state.routes
        .filter((route) => connectedRouteIds.has(route.id))
        .map((route) =>
          route.origemId === selectedPartyLocationId ? route.destinoId : route.origemId,
        ),
    )
    const plannedEntryByPartyId = new Map(
      timePlanEntries.map((entry) => [entry.partyId, entry]),
    )
    const partyVisualEntries: PartyVisualEntry[] = activeParties
      .map((party): PartyVisualEntry | null => {
        const realLocation = state.locations.find(
          (location) => location.id === party.localAtualId,
        )
        const plannedEntry =
          movementMode === 'planning' ? plannedEntryByPartyId.get(party.id) : undefined
        const plannedLocation = plannedEntry
          ? plannedEntry.newLocation ??
            state.locations.find((location) => location.id === plannedEntry.destinationId)
          : null
        const visualLocation = plannedLocation ?? realLocation

        if (!realLocation || !visualLocation) {
          return null
        }

        return {
          party,
          plannedEntry,
          realLocation,
          visualLocation,
        }
      })
      .filter((entry): entry is PartyVisualEntry => entry !== null)
    const visualGroupsByPosition = new Map<string, typeof partyVisualEntries>()

    partyVisualEntries.forEach((entry) => {
      const key = `${Math.round(entry.visualLocation.posicao.x * 10)}:${Math.round(
        entry.visualLocation.posicao.y * 10,
      )}`
      const currentEntries = visualGroupsByPosition.get(key) ?? []

      currentEntries.push(entry)
      visualGroupsByPosition.set(key, currentEntries)
    })
    const stackInfoByPartyId = new Map<string, { index: number; total: number }>()

    visualGroupsByPosition.forEach((entries) => {
      entries.forEach((entry, index) => {
        stackInfoByPartyId.set(entry.party.id, {
          index,
          total: entries.length,
        })
      })
    })
    const selectedBiomeInfo = selectedLocation ? biomeById.get(selectedLocation.biomaId) : null
    const selectedRoutes = selectedLocation
      ? state.routes.filter(
          (route) =>
            route.origemId === selectedLocation.id || route.destinoId === selectedLocation.id,
        )
      : []
    const selectedLocationImage = getMundiLocationImage(selectedLocation)
    const selectedMapId = selectedLocation?.mapId ?? ''
    const selectedMemberSummary = [
      selectedPlayersAtLocation.length > 0
        ? `${selectedPlayersAtLocation.length} player(s)`
        : '',
      selectedNpcsAtLocation.length > 0 ? `${selectedNpcsAtLocation.length} NPC(s)` : '',
      selectedEntitiesAtLocation.length > 0
        ? `${selectedEntitiesAtLocation.length} mob(s)`
        : '',
    ].filter(Boolean)
    const selectedLocationIsSubmapOnly = selectedLocation
      ? SUBMAP_ONLY_LOCATION_IDS.has(selectedLocation.id)
      : false
    const activeBiomeId =
      selectedBiomeId || selectedLocation?.biomaId || state.biomes[0]?.id || ''
    const activeBiomeInfo = activeBiomeId ? biomeById.get(activeBiomeId) : null
    const selectedCrossBiomeRoutes = selectedLocation
      ? selectedRoutes
          .map((route) => {
            const nextLocationId =
              route.origemId === selectedLocation.id ? route.destinoId : route.origemId
            const nextLocation = locationById.get(nextLocationId)

            if (!nextLocation || nextLocation.biomaId === selectedLocation.biomaId) {
              return null
            }

            return {
              biomeName: biomeById.get(nextLocation.biomaId)?.nome ?? 'Bioma',
              biomeImage: getMundiBiomeImage(nextLocation.biomaId),
              direction: getRouteDirection(selectedLocation, nextLocation),
              location: nextLocation,
              locationImage: getMundiLocationImage(nextLocation),
              route,
            }
          })
          .filter((entry): entry is {
            biomeName: string
            biomeImage: string
            direction: string
            location: WorldMundiLocation
            locationImage: string
            route: WorldMundiRoute
          } => entry !== null)
      : []
    const activeBiomeLocations = visibleLocations.filter(
      (location) => location.biomaId === activeBiomeId,
    )
    const biomeXs = activeBiomeLocations.map((location) => location.posicao.x)
    const biomeYs = activeBiomeLocations.map((location) => location.posicao.y)
    const minBiomeX = biomeXs.length > 0 ? Math.min(...biomeXs) : 0
    const maxBiomeX = biomeXs.length > 0 ? Math.max(...biomeXs) : 100
    const minBiomeY = biomeYs.length > 0 ? Math.min(...biomeYs) : 0
    const maxBiomeY = biomeYs.length > 0 ? Math.max(...biomeYs) : 100

    function getBiomeDetailPosition(location: WorldMundiLocation) {
      if (activeBiomeLocations.length <= 1) {
        return { x: 50, y: 50 }
      }

      const xRange = Math.max(1, maxBiomeX - minBiomeX)
      const yRange = Math.max(1, maxBiomeY - minBiomeY)

      return {
        x: 12 + ((location.posicao.x - minBiomeX) / xRange) * 76,
        y: 18 + ((location.posicao.y - minBiomeY) / yRange) * 66,
      }
    }

    function getRenderedLocationPosition(location: WorldMundiLocation) {
      return mundiView === 'biome' ? getBiomeDetailPosition(location) : location.posicao
    }

    const activeBiomeRouteEntries = state.routes
      .map((route) => {
        const origin = locationById.get(route.origemId)
        const destination = locationById.get(route.destinoId)

        if (
          mundiView !== 'biome' ||
          !origin ||
          !destination ||
          origin.biomaId !== activeBiomeId ||
          destination.biomaId !== activeBiomeId
        ) {
          return null
        }

        const originPosition = getRenderedLocationPosition(origin)
        const destinationPosition = getRenderedLocationPosition(destination)
        const originNumber = getOfficialLocationNumber(origin) ?? 999
        const destinationNumber = getOfficialLocationNumber(destination) ?? 999

        return {
          destination,
          destinationPosition,
          midpoint: {
            x: (originPosition.x + destinationPosition.x) / 2,
            y: (originPosition.y + destinationPosition.y) / 2,
          },
          origin,
          originPosition,
          route,
          sortKey: Math.min(originNumber, destinationNumber) * 1000 + Math.max(originNumber, destinationNumber),
          subrouteCount:
            (submapsByLocationId.get(origin.id)?.length ?? 0) +
            (submapsByLocationId.get(destination.id)?.length ?? 0),
        }
      })
      .filter((entry): entry is {
        destination: WorldMundiLocation
        destinationPosition: { x: number; y: number }
        midpoint: { x: number; y: number }
        origin: WorldMundiLocation
        originPosition: { x: number; y: number }
        route: WorldMundiRoute
        sortKey: number
        subrouteCount: number
      } => entry !== null)
      .sort((a, b) => a.sortKey - b.sortKey)
    const selectedMainPresence = selectedLocation
      ? [
          ...activeParties
            .filter((party) => party.localAtualId === selectedLocation.id && !party.submapAtualId)
            .map((party) => ({
              id: `party:${party.id}`,
              kind: 'party' as const,
              label: getPartyDisplayName(party),
              meta: getPartyMemberLabel(party, entityById, characterById),
            })),
          ...activeNpcStates
            .filter(
              (npc) =>
                !occupiedNpcCharacterIds.has(npc.characterId) &&
                !partyNpcCharacterIds.has(npc.characterId) &&
                npc.localAtualId === selectedLocation.id &&
                !npc.submapAtualId &&
                npc.presencaNoMapa !== 'inativo',
            )
            .map((npc) => {
              const character = characterById.get(npc.characterId)

              return {
                avatarUrl: getCharacterPortrait(character),
                id: `npc:${npc.characterId}`,
                kind: 'npc' as const,
                label: character?.nome ?? npc.characterId,
                meta: formatLabel(npc.presencaNoMapa),
              }
            }),
          ...Object.values(state.entities)
            .filter(
              (entity) =>
                entity.estado === 'ativo' &&
                !partyEntityIds.has(entity.id) &&
                entity.localAtualId === selectedLocation.id &&
                !entity.submapAtualId,
            )
            .map((entity) => ({
              id: `entity:${entity.id}`,
              kind: 'entity' as const,
              label: `${entity.nome} x${entity.quantidade}`,
              meta: formatLabel(entity.tipo),
            })),
        ]
      : []
    const activeHubSubmapIds = selectedLocation
      ? getActiveSubmapIdsForLocation(selectedLocation, selectedLocationSubmaps)
      : [MAIN_SUBMAP_KEY]
    const primaryHubSubmapId = activeHubSubmapIds[0] ?? MAIN_SUBMAP_KEY

    return (
      <div
        className={`world-mundi__map world-mundi__map--${mode} world-mundi__map--${mundiView}`}
        aria-label="Mapa logico da ilha"
        onDragOver={(event) => {
          if (hasPartyDragPayload(event)) {
            event.dataTransfer.dropEffect = 'move'
            event.preventDefault()
          }
        }}
        onDrop={(event) => {
          const droppedPartyId = getDraggedPartyIdFromEvent(event)

          if (!droppedPartyId) {
            return
          }

          event.preventDefault()
          event.stopPropagation()
          setDraggedPartyId('')
          setMovementNotice(
            'Movimento cancelado: solte o grupo sobre um ponto, rota ou submapa do MUN.',
          )
        }}
      >
        <img
          alt=""
          className="world-mundi__map-art"
          draggable={false}
          src={resolveRuntimeAssetUrl(
            (mundiView === 'biome' || mundiView === 'locationHub') && activeBiomeId
              ? getMundiBiomeImage(activeBiomeId) || MUNDI_BASE_MAP_ASSET
              : MUNDI_BASE_MAP_ASSET,
          )}
        />
        <div className="world-mundi__map-vignette" aria-hidden="true" />
        {mundiView === 'world' ? (
          <svg
            className="world-mundi__biome-layer"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {MUNDI_BIOME_REGIONS.map((region) => {
              const biomeInfo = biomeById.get(region.id)
              const isActive = selectedBiomeId === region.id || hoveredBiomeId === region.id

              return (
                <path
                  className={`world-mundi__biome-region${
                    isActive ? ' world-mundi__biome-region--active' : ''
                  }`}
                  d={region.path}
                  key={region.id}
                  onClick={() => enterBiome(region.id)}
                  onMouseEnter={() => setHoveredBiomeId(region.id)}
                  onMouseLeave={() => setHoveredBiomeId('')}
                  role="button"
                  style={{ '--biome-color': region.color } as CSSProperties}
                  tabIndex={0}
                >
                  <title>{biomeInfo?.nome ?? region.id}</title>
                </path>
              )
            })}
          </svg>
        ) : null}
        {mode === 'master' ? (
          <div className="world-mundi__map-toolbar" aria-label="Controle do mapa">
            <div className="world-mundi__map-clock">
              <span>Dia {state.clock.dia}</span>
              <strong>{formatClockTime(state.clock.hora)}</strong>
            </div>
            {mundiView === 'biome' ? (
              <button className="button" onClick={returnToWorldMap} type="button">
                Ilha
              </button>
            ) : null}
            {mundiView === 'world' ? (
              <button
                className="button"
                onClick={() => {
                  setMundiView('eventHub')
                  setIsLocationPopoverOpen(false)
                }}
                type="button"
              >
                Eventos
              </button>
            ) : null}
            {mundiView === 'locationHub' ? (
              <>
                <button className="button" onClick={returnToBiomeMap} type="button">
                  Voltar
                </button>
                <button className="button" onClick={returnToWorldMap} type="button">
                  Ilha
                </button>
              </>
            ) : null}
            {mundiView === 'eventHub' ? (
              <button className="button" onClick={returnToWorldMap} type="button">
                Ilha
              </button>
            ) : null}
            <span className="tag">
              {mundiView === 'locationHub'
                ? selectedLocation?.nome ?? 'Ponto'
                : mundiView === 'eventHub'
                ? 'EVENTO / MUNv2'
                : mundiView === 'biome'
                ? activeBiomeInfo?.nome ?? 'Bioma'
                : hoveredBiomeId
                  ? biomeById.get(hoveredBiomeId)?.nome ?? 'Bioma'
                  : 'Selecione um bioma'}
            </span>
            {mundiView !== 'eventHub' ? (
              <>
                {mundiView !== 'locationHub' ? (
                  <button
                    className={`button${showBiomeNpcs ? ' button--primary' : ''}`}
                    onClick={() => setShowBiomeNpcs((current) => !current)}
                    type="button"
                  >
                    Mostrar
                  </button>
                ) : null}
                <div className="segmented-control">
                  <button
                    className={`segmented-control__option${
                      movementMode === 'quick' ? ' segmented-control__option--active' : ''
                    }`}
                    onClick={() => setMovementMode('quick')}
                    type="button"
                  >
                    Rapido
                  </button>
                  <button
                    className={`segmented-control__option${
                      movementMode === 'planning' ? ' segmented-control__option--active' : ''
                    }`}
                    onClick={() => setMovementMode('planning')}
                    type="button"
                  >
                    Planejar
                  </button>
                </div>
                <span className="tag">{selectedParty ? getPartyDisplayName(selectedParty) : 'sem grupo'}</span>
                {undoStack.length > 0 ? (
                  <button className="button" onClick={undoLastMovement} type="button">
                    Desfazer {undoStack.length}
                  </button>
                ) : null}
                {timePlanEntries.length > 0 ? (
                  <>
                    <button className="button button--primary" onClick={confirmTimePlan} type="button">
                      Confirmar {formatHours(totalPlannedHours)}
                    </button>
                    <button className="button" onClick={cancelTimePlan} type="button">
                      Cancelar
                    </button>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
        {mode === 'master' && mundiView === 'eventHub' ? (
          <section className="world-mundi__location-hub world-mundi__event-hub" aria-label="Hub de eventos do MUN">
            <div className="world-mundi__location-hub-top">
              <div className="world-mundi__location-hub-media world-mundi__event-hub-media">
                <img alt="" src={resolveRuntimeAssetUrl(MUNDI_BASE_MAP_ASSET)} />
              </div>
              <div>
                <p className="eyebrow">Evento / MUNv2</p>
                <h3>Cataclismos e estados globais</h3>
                <div className="tag-row">
                  <span className="tag">{MUNDI_EVENT_SCENARIOS.length} eventos</span>
                  <span className="tag">rotas instaveis</span>
                  <span className="tag">mapas pendentes por fase</span>
                </div>
                <p className="support-copy">
                  Camada reservada para estados que mudam a ilha inteira. Cada evento lista o que
                  muda no mundo e quais mapas precisam entrar no MUNv2 quando o evento acontecer.
                </p>
              </div>
            </div>

            <div className="world-mundi__event-grid">
              {MUNDI_EVENT_SCENARIOS.map((scenario) => (
                <article className="world-mundi__event-card" key={scenario.id}>
                  <div className="world-mundi__location-hub-card-title">
                    <span className="eyebrow">{scenario.status}</span>
                    <strong>{scenario.name}</strong>
                  </div>
                  <p className="support-copy">{scenario.summary}</p>
                  <div className="world-mundi__event-card-section">
                    <span className="eyebrow">Efeitos</span>
                    <div className="tag-row">
                      {scenario.effects.map((effect) => (
                        <span className="tag" key={effect}>{effect}</span>
                      ))}
                    </div>
                  </div>
                  <div className="world-mundi__event-card-section">
                    <span className="eyebrow">Mapas / slots</span>
                    <div className="tag-row">
                      {scenario.maps.map((mapSlot) => (
                        <span className="tag" key={mapSlot}>{mapSlot}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {mode === 'master' && mundiView === 'locationHub' && selectedLocation ? (
          <section className="world-mundi__location-hub" aria-label="Hub de submapas do ponto">
            <div className="world-mundi__location-hub-top">
              <div className="world-mundi__location-hub-media">
                {selectedLocationImage ? (
                  <img alt="" src={resolveRuntimeAssetUrl(selectedLocationImage)} />
                ) : (
                  <div className="world-mundi__construction-thumb">
                    <span>CONSTRUCAO</span>
                  </div>
                )}
              </div>
              <div>
                <p className="eyebrow">{selectedBiomeInfo?.nome ?? 'Bioma'}</p>
                <h3>
                  {getLocationCode(selectedLocation)} - {selectedLocation.nome}
                </h3>
                <div className="tag-row">
                  <span className="tag">{getLocationAvailabilityLabel(selectedLocation)}</span>
                  <span className="tag">{selectedLocationSubmaps.length} submapa(s)</span>
                  <span className="tag">
                    Principal:{' '}
                    {primaryHubSubmapId === MAIN_SUBMAP_KEY
                      ? `${getLocationCode(selectedLocation)}-S0`
                      : selectedLocationSubmaps.find((submap) => submap.id === primaryHubSubmapId)
                          ?.codigo ?? 'S'}
                  </span>
                </div>
                <p className="support-copy">
                  {selectedLocation.descricaoInicial || 'Sem descricao detalhada ainda.'}
                </p>
              </div>
            </div>

            <div className="world-mundi__location-hub-grid">
              {!selectedLocationIsSubmapOnly ? (
                <article
                  className={`world-mundi__location-hub-card${
                    activeHubSubmapIds.includes(MAIN_SUBMAP_KEY)
                      ? ''
                      : ' world-mundi__location-hub-card--inactive'
                  }${
                    primaryHubSubmapId === MAIN_SUBMAP_KEY
                      ? ' world-mundi__location-hub-card--primary'
                      : ''
                  }`}
                  onDragOver={(event) => {
                    if (draggedMemberId || hasPartyDragPayload(event)) {
                      event.preventDefault()
                    }
                  }}
                  onDrop={(event) => {
                    const droppedPartyId = getDraggedPartyIdFromEvent(event)

                    if (droppedPartyId) {
                      event.preventDefault()
                      event.stopPropagation()
                      queuePartySubmapMovement(droppedPartyId, selectedLocation.id, '')
                      setDraggedPartyId('')
                      return
                    }

                    handleMemberDropToSubmap(event, '')
                  }}
                >
                  <div className="world-mundi__location-hub-card-media">
                    {selectedLocationImage ? (
                      <img alt="" src={resolveRuntimeAssetUrl(selectedLocationImage)} />
                    ) : (
                      <span>{getLocationCode(selectedLocation)}-S0</span>
                    )}
                  </div>
                  <div className="world-mundi__location-hub-card-body">
                    <div className="world-mundi__location-hub-card-title">
                      <span className="eyebrow">{getLocationCode(selectedLocation)}-S0</span>
                      <strong>Mapa principal</strong>
                    </div>
                    <div className="tag-row">
                      <span className="tag">Padrao do ponto</span>
                      <span className="tag">
                        {primaryHubSubmapId === MAIN_SUBMAP_KEY ? 'Principal' : 'Variante'}
                      </span>
                      <span className="tag">
                        {activeHubSubmapIds.includes(MAIN_SUBMAP_KEY) ? 'Ativo' : 'Desativado'}
                      </span>
                    </div>
                    <p className="support-copy">
                      {selectedLocation.descricaoInicial || 'Estado base deste ponto no MUN.'}
                    </p>
                    {selectedMainPresence.length > 0 ? (
                      renderPresenceStrip(selectedMainPresence)
                    ) : null}
                    <div className="tabletop-hud-panel__actions">
                      <button
                        className={`button button--compact${
                          activeHubSubmapIds.includes(MAIN_SUBMAP_KEY) ? ' button--primary' : ''
                        }`}
                        onClick={() => toggleSubmapActive(selectedLocation, MAIN_SUBMAP_KEY)}
                        type="button"
                      >
                        {activeHubSubmapIds.includes(MAIN_SUBMAP_KEY) ? 'Ativo' : 'Desativado'}
                      </button>
                      {selectedMapId ? (
                        <button
                          className="button button--compact"
                          onClick={() => openLocationMap(selectedLocation)}
                          type="button"
                        >
                          Abrir
                        </button>
                      ) : null}
                      {selectedMapId && onPrepareMap ? (
                        <button
                          className="button button--compact"
                          onClick={() => onPrepareMap(selectedMapId)}
                          type="button"
                        >
                          Preparar
                        </button>
                      ) : null}
                      <button
                        className="button button--compact"
                        disabled={memberSelection.length === 0}
                        onClick={clearMemberSelectionSubmap}
                        type="button"
                      >
                        Marcar aqui
                      </button>
                      {selectedParty ? (
                        <button
                          className="button button--compact"
                          onClick={() => queuePartySubmapMovement(selectedParty.id, selectedLocation.id, '')}
                          type="button"
                        >
                          {movementMode === 'planning' ? 'Planejar grupo' : 'Mover grupo'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ) : null}

              {selectedLocationSubmaps.map((submap) => {
                const preview = getSubmapPreview(submap)
                const linkedMap = mapById.get(submap.mapId)
                const presence = selectedSubmapPresenceById.get(submap.id) ?? []
                const isActiveSubmap = activeHubSubmapIds.includes(submap.id)
                const isPrimarySubmap = primaryHubSubmapId === submap.id

                return (
                  <article
                    className={`world-mundi__location-hub-card${
                      isActiveSubmap ? '' : ' world-mundi__location-hub-card--inactive'
                    }${isPrimarySubmap ? ' world-mundi__location-hub-card--primary' : ''}`}
                    key={submap.id}
                    onDragOver={(event) => {
                      if (draggedMemberId || hasPartyDragPayload(event)) {
                        event.preventDefault()
                      }
                    }}
                    onDrop={(event) => {
                      const droppedPartyId = getDraggedPartyIdFromEvent(event)

                      if (droppedPartyId) {
                        event.preventDefault()
                        event.stopPropagation()
                        queuePartySubmapMovement(droppedPartyId, selectedLocation.id, submap.id)
                        setDraggedPartyId('')
                        return
                      }

                      handleMemberDropToSubmap(event, submap.id)
                    }}
                  >
                    <div className="world-mundi__location-hub-card-media">
                      {preview ? (
                        <img alt="" src={resolveRuntimeAssetUrl(preview)} />
                      ) : (
                        <span>{submap.codigo || 'S'}</span>
                      )}
                    </div>
                    <div className="world-mundi__location-hub-card-body">
                      <div className="world-mundi__location-hub-card-title">
                        <span className="eyebrow">{submap.codigo || formatLabel(submap.tipo)}</span>
                        <strong>{submap.nome}</strong>
                      </div>
                      <div className="tag-row">
                        <span className="tag">{getSubmapPurposeLabel(submap)}</span>
                        <span className="tag">{linkedMap ? 'MAP pronto' : formatLabel(submap.status)}</span>
                        <span className="tag">{isPrimarySubmap ? 'Principal' : 'Variante'}</span>
                        <span className="tag">{isActiveSubmap ? 'Ativo' : 'Desativado'}</span>
                      </div>
                      {submap.descricao ? (
                        <p className="support-copy">{submap.descricao}</p>
                      ) : null}
                      {presence.length > 0 ? (
                        renderPresenceStrip(presence)
                      ) : null}
                      <div className="tabletop-hud-panel__actions">
                        <button
                          className={`button button--compact${
                            isActiveSubmap ? ' button--primary' : ''
                          }`}
                          onClick={() => toggleSubmapActive(selectedLocation, submap.id)}
                          type="button"
                        >
                          {isActiveSubmap ? 'Ativo' : 'Desativado'}
                        </button>
                        <button
                          className="button button--compact"
                          disabled={!linkedMap}
                          onClick={() => openSubmapMap(submap)}
                          type="button"
                        >
                          Abrir
                        </button>
                        {onPrepareMap ? (
                          <button
                            className="button button--compact"
                            disabled={!linkedMap}
                            onClick={() => onPrepareMap(submap.mapId)}
                            type="button"
                          >
                            Preparar
                          </button>
                        ) : null}
                        <button
                          className="button button--compact"
                          disabled={memberSelection.length === 0}
                          onClick={() => moveMemberSelectionToSubmap(submap.id)}
                          type="button"
                        >
                          Marcar aqui
                        </button>
                        {selectedParty ? (
                          <button
                            className="button button--compact"
                            onClick={() =>
                              queuePartySubmapMovement(selectedParty.id, selectedLocation.id, submap.id)
                            }
                            type="button"
                          >
                            {movementMode === 'planning' ? 'Planejar grupo' : 'Mover grupo'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}
        {mundiView === 'world' && showBiomeNpcs
          ? MUNDI_BIOME_REGIONS.map((region) => {
              const biomeNpcs = activeNpcStates.filter((npc) => {
                if (
                  occupiedNpcCharacterIds.has(npc.characterId) ||
                  partyNpcCharacterIds.has(npc.characterId) ||
                  npc.presencaNoMapa === 'inativo'
                ) {
                  return false
                }

                return locationById.get(npc.localAtualId)?.biomaId === region.id
              })
              const biomeGroups = activeParties.filter(
                (party) => locationById.get(party.localAtualId)?.biomaId === region.id,
              )
              const presenceMembers: WorldPresenceMember[] = [
                ...biomeGroups.map((party) => ({
                  id: `party:${party.id}`,
                  kind: 'party' as const,
                  label: getPartyDisplayName(party),
                  meta: getPartyMemberLabel(party, entityById, characterById),
                })),
                ...biomeNpcs.map((npc) => {
                  const character = characterById.get(npc.characterId)

                  return {
                    avatarUrl: getCharacterPortrait(character),
                    id: `npc:${npc.characterId}`,
                    kind: 'npc' as const,
                    label: character?.nome ?? npc.characterId,
                    meta: locationById.get(npc.localAtualId)?.nome ?? formatLabel(npc.presencaNoMapa),
                  }
                }),
              ]
              const presenceNames = presenceMembers.map((member) => member.label)

              if (presenceNames.length === 0) {
                return null
              }

              return (
                <button
                  className="world-mundi__biome-npc-cluster"
                  key={region.id}
                  onClick={() => enterBiome(region.id)}
                  style={{
                    left: `${region.label.x}%`,
                    top: `${region.label.y}%`,
                  }}
                  title={presenceNames.join(', ')}
                type="button"
              >
                <strong>{presenceNames.length}</strong>
                <em className="world-mundi__cluster-avatars">
                  {presenceMembers.slice(0, 3).map((member) => (
                    <i key={member.id}>
                      {member.avatarUrl ? (
                        <img alt="" src={resolveRuntimeAssetUrl(member.avatarUrl)} />
                      ) : (
                        member.label.slice(0, 2).toUpperCase()
                      )}
                    </i>
                  ))}
                </em>
                <span>
                  {presenceNames.slice(0, 3).join(', ')}
                </span>
                </button>
              )
            })
          : null}
        <svg className="world-mundi__routes" viewBox="0 0 100 100" preserveAspectRatio="none">
          {activeBiomeRouteEntries.map((entry) => (
            <line
              key={entry.route.id}
              className={`world-mundi__route-line${
                connectedRouteIds.has(entry.route.id) ? ' world-mundi__route-line--active' : ''
              }${entry.route.bloqueada ? ' world-mundi__route-line--blocked' : ''}${
                entry.route.secreta ? ' world-mundi__route-line--secret' : ''
              }`}
              x1={entry.originPosition.x}
              x2={entry.destinationPosition.x}
              y1={entry.originPosition.y}
              y2={entry.destinationPosition.y}
            />
          ))}
          {timePlanEntries.map((entry) => {
            const party = state.parties[entry.partyId]
            const origin = party
              ? state.locations.find((location) => location.id === party.localAtualId)
              : null
            const destination =
              entry.newLocation ??
              state.locations.find((location) => location.id === entry.destinationId)

            if (
              mundiView !== 'biome' ||
              !origin ||
              !destination ||
              origin.biomaId !== activeBiomeId ||
              destination.biomaId !== activeBiomeId
            ) {
              return null
            }
            const originPosition = getRenderedLocationPosition(origin)
            const destinationPosition = getRenderedLocationPosition(destination)

            return (
              <line
                className="world-mundi__route-line world-mundi__route-line--planned"
                key={`planned-${entry.partyId}`}
                x1={originPosition.x}
                x2={destinationPosition.x}
                y1={originPosition.y}
                y2={destinationPosition.y}
              />
            )
          })}
        </svg>

        {partyVisualEntries.map(({ party, plannedEntry, realLocation, visualLocation }) => {
          if (mundiView !== 'biome' || visualLocation.biomaId !== activeBiomeId) {
            return null
          }

          const stackInfo = stackInfoByPartyId.get(party.id) ?? { index: 0, total: 1 }
          const stackOffset = getStackOffset(stackInfo.index, stackInfo.total)
          const visualPosition = getRenderedLocationPosition(visualLocation)
          const visualTitle = plannedEntry
            ? `${getPartyDisplayName(party)}: planejado para ${plannedEntry.destinationName}. Local real: ${realLocation.nome}.`
            : `${getPartyDisplayName(party)}: ${getPartyMemberLabel(party, entityById, characterById)}`
          const partyAvatarMembers = [
            ...party.memberCharacterIds.map((characterId) => {
              const character = characterById.get(characterId)

              return {
                id: characterId,
                label: character?.nome ?? characterId,
                avatarUrl: getCharacterPortrait(character),
              }
            }),
            ...party.memberPlayerIds.map((playerId) => ({
              id: playerId,
              label: playerId.replace('player', 'J'),
              avatarUrl: '',
            })),
          ]

          return (
            <button
              className={`world-mundi__party-token${
                selectedParty?.id === party.id ? ' world-mundi__party-token--active' : ''
              }${draggedPartyId === party.id ? ' world-mundi__party-token--dragging' : ''}${
                plannedEntry ? ' world-mundi__party-token--planned' : ''
              }`}
              draggable
              key={party.id}
              onClick={() => {
                selectParty(party.id)
                selectLocation(plannedEntry && !plannedEntry.newLocation ? plannedEntry.destinationId : party.localAtualId)
              }}
              onDragEnd={() => setDraggedPartyId('')}
              onDragStart={(event) => startPartyDrag(event, party.id)}
              style={{
                '--party-color': getPartyColor(party.id, activeParties),
                left: `calc(${visualPosition.x}% + ${stackOffset.x}px)`,
                top: `calc(${visualPosition.y}% + ${stackOffset.y}px)`,
              } as CSSProperties}
              title={visualTitle}
              type="button"
            >
              <span>{getPartyShortLabel(party)}</span>
              {partyAvatarMembers.length > 0 ? (
                <em className="world-mundi__party-token-avatars">
                  {partyAvatarMembers.slice(0, 3).map((member) => (
                    <i key={member.id}>
                      {member.avatarUrl ? (
                        <img alt="" src={resolveRuntimeAssetUrl(member.avatarUrl)} />
                      ) : (
                        member.label.slice(0, 2).toUpperCase()
                      )}
                    </i>
                  ))}
                </em>
              ) : null}
              <small>
                {party.memberPlayerIds.length +
                  party.memberCharacterIds.length +
                  party.memberEntityIds.length}
              </small>
            </button>
          )
        })}

        {visibleLocations.map((location) => {
          if (mundiView !== 'biome' || location.biomaId !== activeBiomeId) {
            return null
          }

          const biomeInfo = biomeById.get(location.biomaId)
          const locationNpcs = activeNpcStates.filter(
            (npc) =>
              !occupiedNpcCharacterIds.has(npc.characterId) &&
              !partyNpcCharacterIds.has(npc.characterId) &&
              npc.localAtualId === location.id &&
              npc.presencaNoMapa !== 'inativo',
          )
          const locationGroups = activeParties.filter(
            (party) => party.localAtualId === location.id,
          )
          const locationPresenceCount = locationNpcs.length + locationGroups.length
          const locationSubmapCount = submapsByLocationId.get(location.id)?.length ?? 0
          const locationPresenceNames = [
            ...locationGroups.map((party) => getPartyDisplayName(party)),
            ...locationNpcs.map((npc) => characterById.get(npc.characterId)?.nome ?? npc.characterId),
          ]
          const locationPresenceMembers: WorldPresenceMember[] = [
            ...locationGroups.map((party) => ({
              id: `party:${party.id}`,
              kind: 'party' as const,
              label: getPartyDisplayName(party),
              meta: getPartyMemberLabel(party, entityById, characterById),
            })),
            ...locationNpcs.map((npc) => {
              const character = characterById.get(npc.characterId)

              return {
                avatarUrl: getCharacterPortrait(character),
                id: `npc:${npc.characterId}`,
                kind: 'npc' as const,
                label: character?.nome ?? npc.characterId,
                meta: npc.submapAtualId
                  ? submapById.get(npc.submapAtualId)?.nome ?? formatLabel(npc.presencaNoMapa)
                  : formatLabel(npc.presencaNoMapa),
              }
            }),
          ]
          const biomeColor = BIOME_COLORS[(biomeInfo?.index ?? 0) % BIOME_COLORS.length]
          const isCurrentPartyLocation = selectedPartyLocationId === location.id
          const isConnectedLocation = connectedLocationIds.has(location.id)
          const shouldDim =
            mode === 'master' &&
            Boolean(selectedPartyLocationId) &&
            !isCurrentPartyLocation &&
            !isConnectedLocation &&
            selectedLocation?.id !== location.id
          const renderedPosition = getRenderedLocationPosition(location)

          return (
            <button
              className={`world-mundi__marker${
                selectedLocation?.id === location.id ? ' world-mundi__marker--active' : ''
              }${isConnectedLocation ? ' world-mundi__marker--connected' : ''}${
                locationSubmapCount > 0 ? ' world-mundi__marker--has-subroutes' : ''
              }${
                locationPresenceCount > 0 ? ' world-mundi__marker--has-presence' : ''
              }${
                shouldDim ? ' world-mundi__marker--dimmed' : ''
              }`}
              data-state={location.estadoVisual}
              key={location.id}
              onDragOver={(event) => {
                if (hasPartyDragPayload(event)) {
                  event.stopPropagation()
                  event.dataTransfer.dropEffect = 'move'
                  event.preventDefault()
                }
              }}
              onDrop={(event) => {
                event.stopPropagation()
                event.preventDefault()
                const droppedPartyId = getDraggedPartyIdFromEvent(event)

                if (droppedPartyId) {
                  queuePartyMovement(droppedPartyId, location.id)
                  setDraggedPartyId('')
                }
              }}
              onClick={() => openLocationFromMundi(location)}
              style={{
                '--biome-color': biomeColor,
                left: `${renderedPosition.x}%`,
                top: `${renderedPosition.y}%`,
              } as CSSProperties}
              title={`${location.nome} | ${biomeInfo?.nome ?? 'Bioma'} | risco ${location.riscoAtual}`}
              type="button"
            >
              {getMundiLocationImage(location) ? (
                <img
                  alt=""
                  className="world-mundi__marker-thumb"
                  src={resolveRuntimeAssetUrl(getMundiLocationImage(location))}
                />
              ) : (
                <span>{getLocationIcon(location)}</span>
              )}
              {locationPresenceCount > 0 ? <small>{locationPresenceCount}</small> : null}
              {locationSubmapCount > 0 ? (
                <i className="world-mundi__marker-subroutes">S{locationSubmapCount}</i>
              ) : null}
              {mode === 'master' ? (
                <strong>
                  {location.nome}
                  <em>{biomeInfo?.nome ?? 'Bioma'}</em>
                </strong>
              ) : null}
              {showBiomeNpcs && locationPresenceCount > 0 ? (
                <em className="world-mundi__marker-presence">
                  <b>{locationPresenceCount}</b>
                  <i>
                    {locationPresenceMembers.slice(0, 8).map((member) => (
                      <span key={member.id}>
                        {member.avatarUrl ? (
                          <img alt="" src={resolveRuntimeAssetUrl(member.avatarUrl)} />
                        ) : (
                          member.label.slice(0, 2).toUpperCase()
                        )}
                      </span>
                    ))}
                  </i>
                  <span>{locationPresenceNames.slice(0, 4).join(', ')}</span>
                </em>
              ) : null}
            </button>
          )
        })}
        {mode === 'master' && mundiView === 'biome' && selectedLocation && isLocationPopoverOpen ? (
          <article className="world-mundi__map-popover">
            <div className="world-mundi__popover-visual">
              {selectedLocationImage ? (
                <img alt={selectedLocation.nome} src={resolveRuntimeAssetUrl(selectedLocationImage)} />
              ) : (
                <div className="world-mundi__construction-thumb">
                  <span>CONSTRUCAO</span>
                </div>
              )}
            </div>
            <div className="world-mundi__popover-body">
              <button
                aria-label="Fechar local selecionado"
                className="world-mundi__popover-close"
                onClick={() => setIsLocationPopoverOpen(false)}
                type="button"
              >
                x
              </button>
              {locationPopoverMode === 'submapas' ? (
                <>
                  <div className="world-mundi__submap-header">
                    <button
                      className="button button--compact"
                      onClick={() => setLocationPopoverMode('detalhes')}
                      type="button"
                    >
                      Voltar
                    </button>
                    <div>
                      <p className="eyebrow">Submapas de</p>
                      <h3>{selectedLocation.nome}</h3>
                    </div>
                  </div>
                  <p className="support-copy">
                    {selectedLocationSubmaps.length > 0
                      ? 'Abra, prepare ou marque onde grupos, NPCs e mobs estao dentro deste ponto.'
                      : 'Este ponto ainda nao tem submapa cadastrado.'}
                  </p>
                  {selectedLocationSubmaps.length > 0 ? (
                    <div className="world-mundi__submap-list">
                      {selectedLocationSubmaps.map((submap) => {
                        const preview = getSubmapPreview(submap)
                        const linkedMap = mapById.get(submap.mapId)
                        const presence = selectedSubmapPresenceById.get(submap.id) ?? []

                        return (
                          <article
                            className="world-mundi__submap-card"
                            key={submap.id}
                            onDragOver={(event) => {
                              if (draggedMemberId || hasPartyDragPayload(event)) {
                                event.preventDefault()
                              }
                            }}
                            onDrop={(event) => {
                              const droppedPartyId = getDraggedPartyIdFromEvent(event)

                              if (droppedPartyId && selectedLocation) {
                                event.preventDefault()
                                event.stopPropagation()
                                queuePartySubmapMovement(droppedPartyId, selectedLocation.id, submap.id)
                                setDraggedPartyId('')
                                return
                              }

                              handleMemberDropToSubmap(event, submap.id)
                            }}
                          >
                            <div className="world-mundi__submap-card-media">
                              {preview ? (
                                <img alt="" src={resolveRuntimeAssetUrl(preview)} />
                              ) : (
                                <span>{submap.codigo || 'S'}</span>
                              )}
                            </div>
                            <div className="world-mundi__submap-card-body">
                              <div className="world-mundi__submap-card-title">
                                <span className="eyebrow">{submap.codigo || formatLabel(submap.tipo)}</span>
                                <strong>{submap.nome}</strong>
                              </div>
                              <div className="tag-row">
                                <span className="tag">{formatLabel(submap.tipo)}</span>
                                <span className="tag">
                                  {linkedMap ? 'MAP pronto' : formatLabel(submap.status)}
                                </span>
                              </div>
                              {submap.descricao ? (
                                <p className="support-copy">{submap.descricao}</p>
                              ) : null}
                              {presence.length > 0 ? (
                                renderPresenceStrip(presence)
                              ) : null}
                              <div className="tabletop-hud-panel__actions">
                                <button
                                  className="button button--compact"
                                  disabled={!linkedMap}
                                  onClick={() => openSubmapMap(submap)}
                                  type="button"
                                >
                                  Abrir
                                </button>
                                {onPrepareMap ? (
                                  <button
                                    className="button button--compact"
                                    disabled={!linkedMap}
                                    onClick={() => onPrepareMap(submap.mapId)}
                                    type="button"
                                  >
                                    Preparar
                                  </button>
                                ) : null}
                                <button
                                  className="button button--compact"
                                  disabled={memberSelection.length === 0}
                                  onClick={() => moveMemberSelectionToSubmap(submap.id)}
                                  type="button"
                                >
                                  Marcar aqui
                                </button>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  ) : null}
                  {membersAtSelectedLocation.length > 0 ? (
                    <div className="tabletop-hud-panel__actions">
                      <button
                        className="button"
                        disabled={memberSelection.length === 0}
                        onClick={clearMemberSelectionSubmap}
                        type="button"
                      >
                        Marcar no ponto principal
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="eyebrow">{selectedBiomeInfo?.nome ?? 'Local selecionado'}</p>
                  <h3>{selectedLocation.nome}</h3>
                  <div className="tag-row">
                    <span className="tag">Risco {selectedLocation.riscoAtual}</span>
                    <span className="tag">FUSHI {selectedLocation.estabilidadeFushi}/5</span>
                    <span className="tag">Distorcao {selectedLocation.distorcao}/5</span>
                  </div>
                  <p className="support-copy">
                    {selectedLocation.descricaoInicial || 'Sem descricao detalhada ainda.'}
                  </p>
                  <p className="support-copy">
                    {selectedMemberSummary.length > 0
                      ? `Presentes: ${selectedMemberSummary.join(' / ')}.`
                      : 'Nenhum grupo/NPC/mob ativo neste ponto.'}
                  </p>
                  {membersAtSelectedLocation.length > 0 ? (
                    <details className="world-mundi__popover-members">
                      <summary>Selecionar presentes no local</summary>
                      <div className="list-stack">
                        {renderMemberCategory('Players / consciencias', selectedPlayersAtLocation)}
                        {renderMemberCategory('NPCs', selectedNpcsAtLocation)}
                        {renderMemberCategory('Mobs / entidades', selectedEntitiesAtLocation)}
                      </div>
                    </details>
                  ) : null}
                  {selectedLocationSubmaps.length > 0 ? (
                    <button
                      className="world-mundi__submap-entry-button"
                      onClick={() => {
                        setSelectedBiomeId(selectedLocation.biomaId)
                        setMundiView('locationHub')
                        setIsLocationPopoverOpen(false)
                      }}
                      type="button"
                    >
                      <span>Submapas</span>
                      <strong>{selectedLocationSubmaps.length}</strong>
                    </button>
                  ) : null}
                  {selectedRoutes.length > 0 ? (
                    <p className="support-copy">
                      Saidas: {selectedRoutes.map((route) => {
                        const nextLocationId =
                          route.origemId === selectedLocation.id ? route.destinoId : route.origemId
                        const nextLocation = state.locations.find(
                          (location) => location.id === nextLocationId,
                        )

                        return nextLocation?.nome ?? nextLocationId
                      }).join(' / ')}
                    </p>
                  ) : null}
                  {selectedCrossBiomeRoutes.length > 0 ? (
                    <div className="world-mundi__biome-exits">
                      {selectedCrossBiomeRoutes.map((entry) => (
                        <button
                          className="world-mundi__biome-exit-card"
                          key={entry.route.id}
                          onClick={() => {
                            setSelectedBiomeId(entry.location.biomaId)
                            setMundiView('biome')
                            selectLocation(entry.location.id)
                          }}
                          type="button"
                        >
                          <span className="world-mundi__biome-exit-card-media">
                            {entry.biomeImage ? (
                              <img
                                alt=""
                                src={resolveRuntimeAssetUrl(entry.biomeImage)}
                              />
                            ) : null}
                          </span>
                          <span className="world-mundi__biome-exit-card-body">
                            <span>{entry.biomeName}</span>
                            <strong>{entry.location.nome}</strong>
                            <small>
                              {entry.direction} | {formatHours(entry.route.tempoPlayersHoras)} | risco{' '}
                              {entry.route.risco}
                            </small>
                          </span>
                          {entry.locationImage ? (
                            <img
                              alt=""
                              className="world-mundi__biome-exit-card-location"
                              src={resolveRuntimeAssetUrl(entry.locationImage)}
                            />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="tabletop-hud-panel__actions">
                    {selectedMapId ? (
                      <button
                        className="button button--primary"
                        onClick={() => openLocationMap(selectedLocation)}
                        type="button"
                      >
                        Abrir MAP
                      </button>
                    ) : (
                      <span className="tag">Sem MAP vinculado</span>
                    )}
                    {selectedMapId && onPrepareMap ? (
                      <button
                        className="button"
                        onClick={() => onPrepareMap(selectedMapId)}
                        type="button"
                      >
                        Preparar MAP
                      </button>
                    ) : null}
                    {membersAtSelectedLocation.length > 0 ? (
                      <button
                        className="button"
                        disabled={memberSelection.length === 0}
                        onClick={createPartyAtSelectedLocation}
                        type="button"
                      >
                        Criar grupo
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </article>
        ) : null}
      </div>
    )
  }

  function renderClockTab() {
    const dayLabel = `Dia ${state.clock.dia} - ${formatClockTime(state.clock.hora)}`

    return (
      <article className="list-card">
        <div className="list-card__top">
          <div>
            <p className="eyebrow">Relogio do MUN</p>
            <h3>{dayLabel}</h3>
          </div>
        </div>
        <div className="tabletop-hud-panel__actions">
          <button className="button" onClick={() => advanceClock(1, 'tempo parado')} type="button">
            Avancar 1h
          </button>
          <button className="button button--primary" onClick={() => advanceClock(6, 'tempo parado')} type="button">
            Avancar 6h
          </button>
        </div>

        <label className="field">
          <span>Ajuste manual</span>
          <div className="world-mundi__inline-field">
            <input
              className="field__input"
              onChange={(event) => setManualClockDeltaText(event.target.value)}
              placeholder="00:20"
              value={manualClockDeltaText}
            />
            <button className="button" onClick={advanceManualClock} type="button">
              Aplicar
            </button>
          </div>
        </label>
      </article>
    )
  }

  function renderWavesTab() {
    const waveTracker = state.sessionTools.waves
    const wave = getWolfWaveDefinition(waveTracker.currentWave)
    const rewardMilestones = [1, 5, 10].map((cyclePosition) => ({
      cyclePosition,
      reward: WOLF_WAVE_REWARDS[cyclePosition],
    }))

    return (
      <div className="world-mundi__split">
        <article className="list-card world-mundi__wave-card">
          <div className="list-card__top">
            <div>
              <p className="eyebrow">Waves</p>
              <h3>Wave Lobos - Planicie</h3>
            </div>
            <span className="tag">Clareira</span>
          </div>

          <div className={`world-mundi__wave-number world-mundi__wave-number--${wave.type.toLowerCase()}`}>
            <span>Wave</span>
            <strong>{wave.wave}</strong>
            <em>{wave.type}</em>
          </div>

          <div className="summary-grid">
            <div>
              <span>Encontro</span>
              <strong>{wave.encounter}</strong>
            </div>
            <div>
              <span>Recompensa</span>
              <strong>{wave.reward?.title ?? 'Sem item nesta wave'}</strong>
            </div>
          </div>
          <p className="support-copy">
            {wave.reward?.mechanics ?? 'A wave serve apenas para pressao e combate. Nao entregue item neste intervalo.'}
          </p>

          <div className="tabletop-hud-panel__actions">
            <button className="button" onClick={() => setCurrentWave(wave.wave - 1)} type="button">
              Voltar
            </button>
            <button className="button button--primary" onClick={() => setCurrentWave(wave.wave + 1)} type="button">
              Proxima
            </button>
          </div>
        </article>

        <article className="list-card">
          <div className="list-card__top">
            <div>
              <p className="eyebrow">Biblioteca de waves</p>
              <h3>Wave Lobos - Planicie</h3>
            </div>
            <span className="tag">ativa</span>
          </div>
          <div className="world-mundi__wave-library">
            <button className="button button--primary" type="button">
              Wave Lobos - Planicie
            </button>
          </div>
          <div className="list-stack">
            {rewardMilestones.map(({ cyclePosition, reward }) => (
              <div className="world-mundi__preview-card" key={cyclePosition}>
                <strong>Wave {cyclePosition}</strong>
                <p className="support-copy">{reward.title}</p>
                <p className="support-copy">{reward.mechanics}</p>
              </div>
            ))}
          </div>
          <label className="field">
            <span>Notas desta wave</span>
            <textarea
              className="field__input field__input--textarea"
              onChange={(event) => patchWaveTracker({ notes: event.target.value })}
              value={waveTracker.notes}
            />
          </label>
        </article>
      </div>
    )
  }

  function renderXpTab() {
    const xpPlayers = Object.values(state.sessionTools.xp.players)

    return (
      <div className="list-stack">
        <article className="list-card">
          <div className="list-card__top">
            <div>
              <p className="eyebrow">XP / Atos</p>
              <h3>Tabela dos 5 jogadores</h3>
            </div>
            <span className="tag">mestre</span>
          </div>
          <p className="support-copy">
            Marque apenas cenas reais. Risco e custo contam ate 2 vezes por ato; Ato 3 trava em 3 ganhos.
          </p>
        </article>

        <div className="world-mundi__xp-grid">
          {xpPlayers.map((player) => {
            const range = XP_ACT_RANGES[player.act] ?? XP_ACT_RANGES[1]
            const checkedCount = XP_MARK_DEFINITIONS.filter(
              (definition) => player.marks[definition.id],
            ).length
            const suggestedLevel = getXpSuggestedLevel(player.marks, player.act)

            return (
              <article className="list-card world-mundi__xp-card" key={player.playerId}>
                <div className="list-card__top">
                  <div>
                    <p className="eyebrow">{player.playerId.toUpperCase()}</p>
                    <h3>{player.label}</h3>
                  </div>
                  <span className="tag">
                    {checkedCount}/{range.cap} marcas
                  </span>
                </div>

                <div className="cards-grid cards-grid--compact">
                  <label className="field">
                    <span>Nome</span>
                    <input
                      className="field__input"
                      onChange={(event) =>
                        patchXpPlayer(player.playerId, { label: event.target.value })
                      }
                      value={player.label}
                    />
                  </label>
                  <label className="field">
                    <span>Ato</span>
                    <select
                      className="field__input"
                      onChange={(event) =>
                        patchXpPlayer(player.playerId, {
                          act: Number.parseInt(event.target.value, 10),
                        })
                      }
                      value={player.act}
                    >
                      {[1, 2, 3, 4, 5].map((act) => (
                        <option key={act} value={act}>
                          Ato {act}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Nivel atual</span>
                    <input
                      className="field__input"
                      min={1}
                      onChange={(event) =>
                        patchXpPlayer(player.playerId, {
                          level: Number.parseInt(event.target.value, 10) || 1,
                        })
                      }
                      type="number"
                      value={player.level}
                    />
                  </label>
                </div>

                <div className="summary-grid">
                  <div>
                    <span>Faixa</span>
                    <strong>
                      {range.start} {'->'} {range.target}
                    </strong>
                  </div>
                  <div>
                    <span>Sugerido</span>
                    <strong>{suggestedLevel}</strong>
                  </div>
                </div>

                <div className="world-mundi__xp-marks">
                  {XP_MARK_DEFINITIONS.map((definition) => (
                    <label
                      className="world-mundi__xp-mark"
                      data-tooltip={definition.description}
                      key={definition.id}
                      title={definition.description}
                    >
                      <input
                        checked={player.marks[definition.id] === true}
                        onChange={(event) =>
                          toggleXpMark(player.playerId, definition.id, event.target.checked)
                        }
                        type="checkbox"
                      />
                      <span>{definition.label}</span>
                    </label>
                  ))}
                </div>

                <div className="tabletop-hud-panel__actions">
                  <button
                    className="button"
                    onClick={() => patchXpPlayer(player.playerId, { level: suggestedLevel })}
                    type="button"
                  >
                    Aplicar sugerido
                  </button>
                </div>

                <label className="field">
                  <span>Observacao</span>
                  <textarea
                    className="field__input field__input--textarea"
                    onChange={(event) =>
                      patchXpPlayer(player.playerId, { notes: event.target.value })
                    }
                    value={player.notes}
                  />
                </label>
              </article>
            )
          })}
        </div>
      </div>
    )
  }

  function renderHelpTab() {
    const nextTurnWindow = getNpcSimulationWindow(NPC_SIMULATION_TURN_HOURS)

    return (
      <div className="world-mundi__split">
        <article className="list-card">
          <div className="list-card__top">
            <div>
              <p className="eyebrow">Ajuda do MUN</p>
              <h3>Fluxo de mesa</h3>
            </div>
            <span className="tag">guia</span>
          </div>
          <ul className="bullet-list">
            <li>Arraste um grupo para um ponto, rota ou submapa para registrar deslocamento.</li>
            <li>Modo Rapido aplica o movimento na hora; Planejar guarda varias rotas para confirmar junto.</li>
            <li>Submapas ativos contam como lugares reais dentro do mesmo ponto e tambem consomem tempo curto.</li>
            <li>Historia guarda contato com NPC depois de cena real; Canon transforma resumo aprovado em memoria do mundo.</li>
            <li>Sessao exporta/importa checkpoint e deixa reset protegido por trava.</li>
          </ul>
        </article>

        <article className="list-card">
          <div className="list-card__top">
            <div>
              <p className="eyebrow">Comandos</p>
              <h3>Consulta rapida</h3>
            </div>
          </div>
          <ul className="bullet-list">
            <li><code>/help</code> mostra comandos do servidor/mesa.</li>
            <li><code>/lastlog</code> mostra o ultimo evento tecnico importante.</li>
            <li><code>/clock</code> mostra dia e hora atuais do MUN.</li>
            <li><code>/where nome</code> localiza NPC, grupo ou jogador quando existir no estado vivo.</li>
            <li><code>/session</code> resume checkpoint, Canon e pendencias da sessao.</li>
          </ul>
        </article>

        <article className="list-card">
          <div className="list-card__top">
            <div>
              <p className="eyebrow">Relogio e IA</p>
              <h3>Regras de simulacao</h3>
            </div>
            <span className="tag">{formatHours(nextTurnWindow.npcHours)} NPC</span>
          </div>
          <ul className="bullet-list">
            <li>Movimento de grupo usa tempo real de rota e subrota.</li>
            <li>NPC solto so gera novo estado em blocos de 6h de mundo.</li>
            <li>6h de mundo equivalem a {formatHours(nextTurnWindow.npcHours)} de acao autonoma para NPC sem o grupo.</li>
            <li>Itens, puzzles e recompensas ficam reservados aos jogadores salvo decisao manual do mestre.</li>
            <li>A IA nao pode usar plot oculto como conhecimento interno do NPC antes de acontecer em Canon.</li>
          </ul>
        </article>
      </div>
    )
  }

  return (
    <div className="world-mundi">
      <div className="world-mundi__top">
        <div>
          <p className="eyebrow">Mapa Mundi</p>
          <h3>Ilha FUSHI viva</h3>
        </div>
      </div>

      <div className="tabletop-hud-panel__actions">
        {(['mestre', 'geral', 'base', 'waves', 'xp', 'personagens', 'historia', 'ia', 'canon', 'relogio', 'logs', 'editor', 'ajuda'] as WorldMundiTab[]).map((tab) => (
          <button
            className={`button${activeTab === tab ? ' button--primary' : ''}`}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab === 'mestre'
              ? 'Mestre'
              : tab === 'geral'
                ? 'Geral'
              : tab === 'base'
                ? 'Base'
              : tab === 'waves'
                ? 'Waves'
              : tab === 'xp'
                ? 'XP'
              : tab === 'personagens'
                ? 'Personagens'
              : tab === 'ia'
                ? 'IA'
              : tab === 'canon'
                  ? 'Canon'
                  : tab === 'relogio'
                    ? 'Relogio'
                  : tab === 'historia'
                    ? 'Historia'
                  : tab === 'ajuda'
                    ? '?'
                  : formatLabel(tab)}
          </button>
        ))}
        <button className="button" onClick={() => setShowSettings(true)} type="button">
          Sessao
        </button>
      </div>

      {showSettings ? (
        <div className="world-mundi__modal-backdrop" role="presentation">
          <article className="world-mundi__modal">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Sessao</p>
                <h3>Checkpoints da campanha</h3>
              </div>
              <button className="button" onClick={() => setShowSettings(false)} type="button">
                Fechar
              </button>
            </div>

            {resetTarget ? (
              <div className="world-mundi__preview-card">
                <strong>Resetar campanha</strong>
                <p className="support-copy">
                  Isso limpa o estado vivo do MUN desta campanha. Exporte um checkpoint antes se
                  quiser poder voltar.
                </p>
                <input
                  className="field__input"
                  onChange={(event) => setResetCampaignText(event.target.value)}
                  placeholder="RESET"
                  value={resetCampaignText}
                />
                <div className="tabletop-hud-panel__actions">
                  <button
                    className="button button--primary"
                    onClick={resetCampaign}
                    type="button"
                  >
                    Confirmar
                  </button>
                  <button
                    className="button"
                    onClick={() => {
                      setResetTarget(null)
                      setResetCampaignText('')
                    }}
                    type="button"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="list-stack">
                <label className="field">
                  <span>Nome da sessao/checkpoint</span>
                  <input
                    className="field__input"
                    onChange={(event) => setSessionCheckpointName(event.target.value)}
                    placeholder="Ex: Sessao 01 - Despertar na Caverna"
                    value={sessionCheckpointName}
                  />
                </label>
                <label className="field">
                  <span>Breve resumo da campanha agora</span>
                  <textarea
                    className="field__input field__input--textarea"
                    onChange={(event) => setSessionCheckpointSummary(event.target.value)}
                    placeholder="Ex: grupo saiu da caverna, encontrou a vila, Jaxir ficou desconfiado..."
                    value={sessionCheckpointSummary}
                  />
                </label>
                <div className="world-mundi__preview-card">
                  <strong>{sessionCheckpointName || 'Sessao atual'}</strong>
                  <p className="support-copy">
                    {sessionCheckpointSummary ||
                      'Sem resumo manual ainda. Este checkpoint exporta o estado core do MUN, memorias de NPC, grupos, locais, logs e fila Canon.'}
                  </p>
                  <div className="tag-row">
                    <span className={`tag${sessionRecording ? ' tag--success' : ''}`}>
                      {sessionRecording ? 'sessao ligada' : 'sessao parada'}
                    </span>
                    <span className="tag">{activeNpcStates.length} NPCs</span>
                    <span className="tag">{activeParties.length} grupos</span>
                    <span className="tag">{state.logs.length} logs</span>
                    <span className="tag">{simulationSessionSummary.candidateCount} canon pendente</span>
                  </div>
                </div>
                <div className="tabletop-hud-panel__actions">
                  <button
                    className={`button${sessionRecording ? '' : ' button--primary'}`}
                    disabled={sessionRecording}
                    onClick={startSessionRecording}
                    type="button"
                  >
                    Iniciar sessao
                  </button>
                  <button
                    className="button"
                    disabled={!sessionRecording}
                    onClick={stopSessionRecording}
                    type="button"
                  >
                    Encerrar sessao
                  </button>
                  <button className="button button--primary" onClick={exportSessionCheckpoint} type="button">
                    Exportar historia
                  </button>
                  <label className="button">
                    Importar historia
                    <input
                      accept="application/json,.json"
                      className="sr-only"
                      onChange={importSessionCheckpoint}
                      type="file"
                    />
                  </label>
                  <button className="button" onClick={() => setResetTarget('campaign')} type="button">
                    Resetar campanha
                  </button>
                </div>
                {sessionCheckpointStatus ? (
                  <p className="support-copy">{sessionCheckpointStatus}</p>
                ) : null}
              </div>
            )}
          </article>
        </div>
      ) : null}

      {activeTab === 'mestre' ? (
        <div className="world-mundi__layout world-mundi__layout--focus">
          <div className="list-stack">
            {renderWorldMap('master')}
            {movementNotice ? <p className="support-copy">{movementNotice}</p> : null}
            {renderActiveGroups()}
          </div>

          <div
            className={`list-stack world-mundi__master-legacy${
              npcJoinDraft || npcReleaseDraft || reincarnationDraft || simulationPreview.length > 0
                ? ' world-mundi__master-legacy--active'
                : ''
            }`}
          >
            <QuickLocationPanel
              logs={logsAtSelectedLocation}
              location={selectedLocation}
              mapPreviewById={mapPreviewById}
              npcs={npcsAtSelectedLocation}
              characterById={characterById}
              entities={Object.values(state.entities)}
              maps={maps}
              routes={state.routes}
              locations={state.locations}
              onCreateMap={ensureLocationMap}
              onDiscardTemporary={discardTemporaryLocation}
              onLinkExistingMap={(location, mapId) => {
                linkMapToLocation(location, mapId, 'customizado')
                setMovementNotice(`Mapa existente vinculado ao MUN: ${location.nome}.`)
              }}
              onOpenMap={openLocationMap}
              onTransformTemporary={transformTemporaryLocation}
            />

            <article className="list-card">
              <div className="list-card__top">
                <div>
                  <p className="eyebrow">Presentes no local</p>
                  <h3>{selectedLocation?.nome ?? 'Sem local'}</h3>
                </div>
                <span className="tag">{membersAtSelectedLocation.length} membro(s)</span>
              </div>

              {membersAtSelectedLocation.length > 0 ? (
                <div className="list-stack">
                  {renderMemberCategory('Players / consciencias', selectedPlayersAtLocation)}
                  {renderMemberCategory('NPCs', selectedNpcsAtLocation)}
                  {renderMemberCategory('Mobs / entidades', selectedEntitiesAtLocation)}
                </div>
              ) : (
                <p className="support-copy">Nenhum player/NPC/mob neste ponto.</p>
              )}

              <div className="tabletop-hud-panel__actions">
                <button
                  className="button button--primary"
                  disabled={memberSelection.length === 0}
                  onClick={createPartyAtSelectedLocation}
                  type="button"
                >
                  Criar grupo com selecao
                </button>
                <button className="button" onClick={() => setMemberSelection([])} type="button">
                  Limpar selecao
                </button>
              </div>
            </article>

            <article className="list-card">
              <div className="list-card__top">
                <div>
                  <p className="eyebrow">Acoes do grupo selecionado</p>
                  <h3>{selectedParty ? getPartyDisplayName(selectedParty) : 'Nenhum grupo selecionado'}</h3>
                </div>
                <span className="tag">
                  {state.locations.find((location) => location.id === selectedParty?.localAtualId)
                    ?.nome ?? 'sem local'}
                </span>
              </div>

              {selectedParty ? (
                <>
                  <div className="tag-row">
                    <button className="button" onClick={() => applyGroupAction(1, 'descansou')} type="button">
                      Descansar 1h
                    </button>
                    <button className="button" onClick={() => applyGroupAction(6, 'descansou')} type="button">
                      Descansar 6h
                    </button>
                    <button className="button" onClick={() => applyGroupAction(1, 'treinou')} type="button">
                      Treinar
                    </button>
                    <button className="button" onClick={() => applyGroupAction(1, 'investigou o local', 'mundo')} type="button">
                      Investigar
                    </button>
                    <button className="button" onClick={() => applyGroupAction(1, 'procurou recursos', 'mundo')} type="button">
                      Procurar recurso
                    </button>
                    <button className="button" onClick={() => applyGroupAction(1, 'ficou de vigia', 'sistema')} type="button">
                      Vigiar
                    </button>
                  </div>
                  <label className="field">
                    <span>Mover por lista (alternativa)</span>
                    {renderLocationSelect(movementDestinationId, setMovementDestinationId)}
                  </label>
                </>
              ) : (
                <p className="support-copy">Selecione um grupo no mapa para ver acoes rapidas.</p>
              )}

              {movementPreview ? (
                <div className="world-mundi__preview-card">
                  <strong>
                    {movementPreview.originName}
                    {' -> '}
                    {movementPreview.destinationName}
                  </strong>
                  <p className="support-copy">
                    Tempo: {formatHours(movementPreview.timeHours)} | risco {movementPreview.risk}
                  </p>
                  <p className="support-copy">
                    Rotas: {movementPreview.routeNames.join(' / ') || 'sem rota'}
                  </p>
                  <div className="tabletop-hud-panel__actions">
                    <button
                      className="button button--primary"
                      onClick={queueMovementPreview}
                      type="button"
                    >
                      {movementMode === 'quick' ? 'Mover agora' : 'Adicionar ao plano'}
                    </button>
                    <button
                      className="button"
                      onClick={() => setMovementDestinationId('')}
                      type="button"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : movementDestinationId ? (
                <p className="support-copy">
                  Nao existe rota configurada ate esse destino. Crie uma rota ou escolha outro ponto.
                </p>
              ) : null}
            </article>

            <article className="list-card">
              <div className="list-card__top">
                <div>
                  <p className="eyebrow">Log do Mestre</p>
                  <h3>Ultimos acontecimentos</h3>
                </div>
                <button className="button" onClick={() => setActiveTab('logs')} type="button">
                  Ver logs
                </button>
              </div>
              <div className="list-stack">
                {state.logs.filter((log) => log.canal !== 'tecnico').slice(0, 4).map((log) => (
                  <p className="support-copy" key={log.id}>
                    Dia {log.dia} | {formatClockTime(log.hora)} - {log.texto}
                  </p>
                ))}
              </div>
            </article>

            {npcJoinDraft ? (
              <article className="list-card">
                <div className="list-card__top">
                  <div>
                    <p className="eyebrow">NPC entrou no grupo</p>
                    <h3>{characterById.get(npcJoinDraft.characterId)?.nome ?? 'NPC'}</h3>
                  </div>
                  <span className="tag">{formatLabel(npcJoinDraft.estado)}</span>
                </div>
                <label className="field">
                  <span>Motivo/contexto</span>
                  <textarea
                    className="field__input field__input--textarea"
                    onChange={(event) =>
                      setNpcJoinDraft((draft) =>
                        draft ? { ...draft, contexto: event.target.value } : draft,
                      )
                    }
                    value={npcJoinDraft.contexto}
                  />
                </label>
                <label className="field">
                  <span>Estado</span>
                  <select
                    className="field__input"
                    onChange={(event) =>
                      setNpcJoinDraft((draft) =>
                        draft
                          ? {
                              ...draft,
                              estado: event.target.value as WorldMundiNpcState['estadoSimulacao'],
                            }
                          : draft,
                      )
                    }
                    value={npcJoinDraft.estado}
                  >
                    <option value="acompanhando_grupo">Acompanhando grupo</option>
                    <option value="em_cena_com_players">Em cena com players</option>
                    <option value="pausado_por_contexto">Aliado/rival temporario</option>
                    <option value="seguindo_contexto">Seguindo contexto</option>
                  </select>
                </label>
                <div className="tabletop-hud-panel__actions">
                  <button className="button button--primary" onClick={() => saveNpcJoin(false)} type="button">
                    Salvar
                  </button>
                  <button className="button" onClick={() => saveNpcJoin(true)} type="button">
                    Pular por agora
                  </button>
                </div>
              </article>
            ) : null}

            {reincarnationDraft ? (
              <article className="list-card">
                <div className="list-card__top">
                  <div>
                    <p className="eyebrow">Reencarnacao</p>
                    <h3>{state.players[reincarnationDraft.playerId]?.nome ?? reincarnationDraft.playerId}</h3>
                  </div>
                  <span className="tag">{formatLabel(reincarnationDraft.bodyType)}</span>
                </div>
                <div className="cards-grid">
                  <label className="field">
                    <span>Jogador / consciencia</span>
                    <select
                      className="field__input"
                      onChange={(event) =>
                        setReincarnationDraft((draft) =>
                          draft ? { ...draft, playerId: event.target.value } : draft,
                        )
                      }
                      value={reincarnationDraft.playerId}
                    >
                      {Object.values(state.players).map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Nome do corpo</span>
                    <input
                      className="field__input"
                      onChange={(event) =>
                        setReincarnationDraft((draft) =>
                          draft ? { ...draft, bodyName: event.target.value } : draft,
                        )
                      }
                      value={reincarnationDraft.bodyName}
                    />
                  </label>
                  <label className="field">
                    <span>Tipo do corpo</span>
                    <select
                      className="field__input"
                      onChange={(event) =>
                        setReincarnationDraft((draft) =>
                          draft
                            ? { ...draft, bodyType: event.target.value as WorldMundiBody['tipo'] }
                            : draft,
                        )
                      }
                      value={reincarnationDraft.bodyType}
                    >
                      <option value="humano">Humano</option>
                      <option value="animal">Animal</option>
                      <option value="criatura">Criatura</option>
                      <option value="npc_importante">NPC importante</option>
                      <option value="fushi">FUSHI</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Local</span>
                    {renderLocationSelect(reincarnationDraft.locationId, (locationId) =>
                      setReincarnationDraft((draft) =>
                        draft ? { ...draft, locationId } : draft,
                      ),
                    )}
                  </label>
                  <label className="field">
                    <span>NPC original</span>
                    <select
                      className="field__input"
                      onChange={(event) =>
                        setReincarnationDraft((draft) =>
                          draft ? { ...draft, npcOriginalId: event.target.value } : draft,
                        )
                      }
                      value={reincarnationDraft.npcOriginalId}
                    >
                      <option value="">Nenhum / corpo comum</option>
                      {activeNpcStates.map((npc) => (
                        <option key={npc.characterId} value={npc.characterId}>
                          {characterById.get(npc.characterId)?.nome ?? npc.characterId}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Consciencia original</span>
                    <select
                      className="field__input"
                      onChange={(event) =>
                        setReincarnationDraft((draft) =>
                          draft
                            ? {
                                ...draft,
                                estadoOriginal:
                                  event.target.value as WorldMundiBody['estadoDaConscienciaOriginal'],
                              }
                            : draft,
                        )
                      }
                      value={reincarnationDraft.estadoOriginal}
                    >
                      {WORLD_MUNDI_ORIGINAL_CONSCIOUSNESS_STATES.map((stateValue) => (
                        <option key={stateValue} value={stateValue}>
                          {formatLabel(stateValue)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="tabletop-hud-panel__actions">
                  <button className="button button--primary" onClick={saveReincarnation} type="button">
                    Reencarnar
                  </button>
                  <button className="button" onClick={() => setReincarnationDraft(null)} type="button">
                    Cancelar
                  </button>
                </div>
              </article>
            ) : null}

            {npcReleaseDraft ? (
              <article className="list-card">
                <div className="list-card__top">
                  <div>
                    <p className="eyebrow">NPC saindo do grupo</p>
                    <h3>{characterById.get(npcReleaseDraft.characterId)?.nome ?? 'NPC'}</h3>
                  </div>
                  <span className="tag">{formatLabel(npcReleaseDraft.novoEstado)}</span>
                </div>
                <label className="field">
                  <span>Resumo do contexto</span>
                  <textarea
                    className="field__input field__input--textarea"
                    onChange={(event) =>
                      setNpcReleaseDraft((draft) =>
                        draft ? { ...draft, resumo: event.target.value } : draft,
                      )
                    }
                    value={npcReleaseDraft.resumo}
                  />
                </label>
                <label className="field">
                  <span>Novo estado</span>
                  <select
                    className="field__input"
                    onChange={(event) =>
                      setNpcReleaseDraft((draft) =>
                        draft
                          ? {
                              ...draft,
                              novoEstado: event.target.value as WorldMundiNpcState['estadoSimulacao'],
                            }
                          : draft,
                      )
                    }
                    value={npcReleaseDraft.novoEstado}
                  >
                    {WORLD_MUNDI_SIMULATION_STATES.map((simulationState) => (
                      <option key={simulationState} value={simulationState}>
                        {formatLabel(simulationState)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="cards-grid">
                  {(['afinidade', 'interesse', 'rivalidade', 'confianca', 'ameaca'] as const).map(
                    (field) => (
                      <label className="field" key={field}>
                        <span>
                          {formatLabel(field)}: {npcReleaseDraft[field]}
                        </span>
                        <input
                          max={field === 'afinidade' ? 5 : 5}
                          min={field === 'afinidade' ? -5 : 0}
                          onChange={(event) =>
                            setNpcReleaseDraft((draft) =>
                              draft
                                ? {
                                    ...draft,
                                    [field]: clampNumber(event.target.value, draft[field]),
                                  }
                                : draft,
                            )
                          }
                          type="range"
                          value={npcReleaseDraft[field]}
                        />
                      </label>
                    ),
                  )}
                </div>
                <div className="tabletop-hud-panel__actions">
                  <button className="button button--primary" onClick={saveNpcRelease} type="button">
                    Salvar e voltar a simulacao
                  </button>
                  <button className="button" onClick={() => setNpcReleaseDraft(null)} type="button">
                    Cancelar
                  </button>
                </div>
              </article>
            ) : null}

            {timePlanEntries.length > 0 ? (
              <article className="list-card">
                <div className="list-card__top">
                  <div>
                    <p className="eyebrow">Plano de Tempo</p>
                    <h3>{timePlanEntries.length} acao(oes) planejada(s)</h3>
                  </div>
                  <span className="tag">avanca {formatHours(totalPlannedHours)}</span>
                </div>

                <div className="list-stack">
                  {timePlanEntries.map((entry) => {
                    const consequences = getPlanEncounters(entry, state)
                    const freeTime = Math.max(0, totalPlannedHours - entry.timeHours)

                    return (
                      <div className="world-mundi__preview-card" key={entry.partyId}>
                        <strong>
                          {entry.partyName}: {entry.originName} -&gt; {entry.destinationName}
                        </strong>
                        <p className="support-copy">
                          Tempo {formatHours(entry.timeHours)} | risco {entry.risk}
                          {freeTime > 0 ? ` | sobra ${formatHours(freeTime)}` : ''}
                        </p>
                        <p className="support-copy">
                          Rotas: {entry.routeNames.join(' / ') || 'mesmo local'}
                        </p>
                        {consequences.encounters.length > 0 ? (
                          <p className="support-copy">
                            Encontros/presencas: {consequences.encounters.join(', ')}
                          </p>
                        ) : null}
                        {consequences.events.length > 0 ? (
                          <p className="support-copy">
                            Eventos possiveis: {consequences.events.join(', ')}
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                <div className="tabletop-hud-panel__actions">
                  <button className="button button--primary" onClick={confirmTimePlan} type="button">
                    Confirmar plano
                  </button>
                  <button className="button" onClick={cancelTimePlan} type="button">
                    Cancelar plano
                  </button>
                </div>
              </article>
            ) : null}

            {simulationPreview.length > 0 ? (
              <article className="list-card">
                <div className="list-card__top">
                  <div>
                    <p className="eyebrow">Previa de simulacao</p>
                    <h3>{simulationPreview.length} decisao(oes)</h3>
                  </div>
                  <span className="tag">nao aplicado</span>
                </div>

                <div className="list-stack">
                  {simulationPreview.map((suggestion) => {
                    const character = characterById.get(suggestion.characterId)

                    return (
                      <div className="world-mundi__preview-card" key={suggestion.characterId}>
                        <strong>{character?.nome ?? suggestion.characterId}</strong>
                        <p className="support-copy">{suggestion.actionText}</p>
                        <p className="support-copy">Motivo: {suggestion.motivation}</p>
                        <p className="support-copy">
                          Intencao: {formatLabel(suggestion.intention)} | risco {suggestion.risk}
                        </p>
                      </div>
                    )
                  })}
                </div>

                <div className="tabletop-hud-panel__actions">
                  <button className="button button--primary" onClick={applySimulationPreview} type="button">
                    Aplicar tudo
                  </button>
                  <button className="button" onClick={() => setSimulationPreview([])} type="button">
                    Cancelar
                  </button>
                </div>
              </article>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === 'geral' ? (
        <TabletopGeneralMundiView
          biomes={state.biomes}
          clock={state.clock}
          isMaster={true}
          onPointSelect={(locationId) =>
            commit((currentState) => ({
              ...currentState,
              selectedLocationId: locationId,
            }))
          }
          onReleasedChange={setPublicMundiReleased}
          onTogglePoint={togglePublicMundiLocation}
          points={generalMundiPoints}
          releasedToPlayers={state.publicMap.releasedToPlayers}
        />
      ) : null}

      {activeTab === 'base' ? (
        <TabletopBaseMundiView
          bases={state.playerBase.bases}
          clock={state.clock}
          isMaster={true}
          onBaseSelect={selectPlayerBase}
          onReleasedChange={setPublicBaseReleased}
          onStatusChange={setBaseUpgradeStatus}
          releasedToPlayers={state.playerBase.releasedToPlayers}
          selectedBaseId={state.playerBase.selectedBaseId}
          upgrades={state.playerBase.upgrades}
        />
      ) : null}

      {activeTab === 'waves' ? renderWavesTab() : null}

      {activeTab === 'xp' ? renderXpTab() : null}

      {activeTab === 'personagens' ? renderNpcCatalogTab() : null}

      {activeTab === 'editor' ? (
        <div className="list-stack">
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Editor tecnico</p>
                <h3>Inteligencia do mundo</h3>
              </div>
              <span className="tag">uso avancado</span>
            </div>
            <div className="segmented-control segmented-control--wrap">
              {([
                ['locais', 'Locais'],
                ['npcs', 'NPCs'],
                ['npc-ia', 'NPC IA'],
                ['rotas', 'Rotas'],
              ] as const).map(([section, label]) => (
                <button
                  className={`segmented-control__option${
                    editorSection === section ? ' segmented-control__option--active' : ''
                  }`}
                  key={section}
                  onClick={() => setEditorSection(section)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            {editorSection === 'locais' ? (
              <label className="field">
                <span>Local selecionado</span>
                {renderLocationSelect(state.selectedLocationId, (locationId) =>
                  commit((currentState) => ({
                    ...currentState,
                    selectedLocationId: locationId,
                  })),
                )}
              </label>
            ) : null}
          </article>

          {editorSection === 'locais' ? (
            <LocationEditor
              biomes={state.biomes}
              location={selectedLocation}
              mapPreviewById={mapPreviewById}
              onCreateLocation={createLocation}
              onCreateRoute={createRoute}
              onPatchLocation={patchLocation}
            />
          ) : null}

          {editorSection === 'npcs' ? (
            <NpcWorldEditor
              availableCharacters={availableCharactersToAdd}
              characterById={characterById}
              locations={state.locations}
              npcToAddId={npcToAddId}
              npcReadinessByCharacterId={npcReadinessByCharacterId}
              npcReadinessSummary={npcReadinessSummary}
              npcs={activeNpcStates}
              onAddNpc={addNpcToWorld}
              onNpcToAddChange={setNpcToAddId}
              onPatchNpc={patchNpc}
              onRemoveNpc={removeNpcFromWorld}
              onSyncCanonicalNpcs={syncCanonicalNpcsToWorld}
              renderLocationSelect={renderLocationSelect}
              submaps={state.submaps}
            />
          ) : null}

          {editorSection === 'npc-ia' ? (
            <article className="list-card">
              <div className="list-card__top">
                <div>
                  <p className="eyebrow">NPC IA</p>
                  <h3>Motor de vontade e memoria</h3>
                </div>
                <span className="tag">preparado para API</span>
              </div>
              <p className="support-copy">
                Esta camada define as leis da simulacao autonoma: cada NPC age pelo proprio local,
                memoria, conhecimento da ilha, objetivo e Canon aprovado. Nada e aplicado sem
                previa e aprovacao do mestre.
              </p>
              <div className="summary-grid">
                <div>
                  <span>NPCs prontos</span>
                  <strong>{npcReadinessSummary.readyCount}</strong>
                </div>
                <div>
                  <span>Precisam contexto</span>
                  <strong>{npcReadinessSummary.needsContextCount}</strong>
                </div>
                <div>
                  <span>Canon pendente</span>
                  <strong>{simulationSessionSummary.candidateCount}</strong>
                </div>
                <div>
                  <span>Previa atual</span>
                  <strong>{simulationPreview.length}</strong>
                </div>
              </div>
              <div className="world-mundi__ai-law-grid">
                {[
                  'Nao inventar geografia, relacao ou evento sem ficha, MUN, log ou Canon.',
                  'Faccao ajuda a organizar, mas vontade do personagem decide prioridade narrativa.',
                  'Conhecimento do NPC depende de origem, tempo na ilha, local atual e memoria.',
                  'Plot oculto e conhecimento do mestre nao entram na mente do NPC antes de serem vividos.',
                  'Puzzles, itens e recompensas de ponto continuam reservados aos jogadores sem aprovacao manual.',
                  'Toda acao autonoma nasce como previa; o mestre aplica ou descarta.',
                ].map((law) => (
                  <span className="tag" key={law}>
                    {law}
                  </span>
                ))}
              </div>
              <div className="tabletop-hud-panel__actions">
                <button className="button" onClick={() => buildSimulationPreview(6)} type="button">
                  Previa turno 6h
                </button>
                <button className="button" onClick={() => buildSimulationPreview(24)} type="button">
                  Previa 24h
                </button>
                <button
                  className="button button--primary"
                  disabled={simulationPreview.length === 0}
                  onClick={applySimulationPreview}
                  type="button"
                >
                  Aplicar previa aprovada
                </button>
              </div>
            </article>
          ) : null}

          {editorSection === 'rotas' ? (
            <RouteEditor
              locations={state.locations}
              onCreateRoute={createRoute}
              onPatchRoute={patchRoute}
              onDeleteRoute={(routeId) =>
                commit((currentState) => ({
                  ...currentState,
                  routes: currentState.routes.filter((route) => route.id !== routeId),
                }))
              }
              routes={state.routes}
            />
          ) : null}
        </div>
      ) : null}

      {activeTab === 'rotas' ? (
        <RouteEditor
          locations={state.locations}
          onCreateRoute={createRoute}
          onPatchRoute={patchRoute}
          onDeleteRoute={(routeId) =>
            commit((currentState) => ({
              ...currentState,
              routes: currentState.routes.filter((route) => route.id !== routeId),
            }))
          }
          routes={state.routes}
        />
      ) : null}

      {activeTab === 'npcs' ? (
        <NpcWorldEditor
          availableCharacters={availableCharactersToAdd}
          characterById={characterById}
          locations={state.locations}
          npcToAddId={npcToAddId}
          npcReadinessByCharacterId={npcReadinessByCharacterId}
          npcReadinessSummary={npcReadinessSummary}
          npcs={activeNpcStates}
          onAddNpc={addNpcToWorld}
          onNpcToAddChange={setNpcToAddId}
          onPatchNpc={patchNpc}
          onRemoveNpc={removeNpcFromWorld}
          onSyncCanonicalNpcs={syncCanonicalNpcsToWorld}
          renderLocationSelect={renderLocationSelect}
          submaps={state.submaps}
        />
      ) : null}

      {activeTab === 'historia' ? renderHistoryTab() : null}

      {activeTab === 'ia' ? renderAiTab() : null}

      {activeTab === 'canon' ? (
        <CanonReviewPanel
          allEvents={simulationEvents}
          contextSnapshotText={contextSnapshotText}
          noteText={canonNoteText}
          onApprove={(eventId) => markSimulationEvent(eventId, 'canon_approved')}
          onBuildSnapshot={buildContextSnapshotPreview}
          onNoteTextChange={setCanonNoteText}
          onRefresh={refreshSimulationEvents}
          onReject={(eventId) => markSimulationEvent(eventId, 'rejected')}
          onSubmitNote={addCanonCandidateNote}
          pendingEvents={simulationReviewQueue}
          summary={simulationSessionSummary}
        />
      ) : null}

      {activeTab === 'relogio' ? renderClockTab() : null}

      {activeTab === 'ajuda' ? renderHelpTab() : null}

      {activeTab === 'logs' ? (
        <div className="world-mundi__split">
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Log do mundo</p>
                <h3>{logView === 'mestre' ? 'Log do Mestre' : 'Log Tecnico'}</h3>
              </div>
              <span className="tag">{filteredLogs.length} registros</span>
            </div>

            <div className="segmented-control">
              <button
                className={`segmented-control__option${
                  logView === 'mestre' ? ' segmented-control__option--active' : ''
                }`}
                onClick={() => setLogView('mestre')}
                type="button"
              >
                Mestre
              </button>
              <button
                className={`segmented-control__option${
                  logView === 'tecnico' ? ' segmented-control__option--active' : ''
                }`}
                onClick={() => setLogView('tecnico')}
                type="button"
              >
                Tecnico
              </button>
            </div>

            <label className="field">
              <span>Filtro</span>
              <select
                className="field__input"
                onChange={(event) => setLogFilter(event.target.value as WorldLogFilter)}
                value={logFilter}
              >
                {(['todos', 'players', 'npcs', 'mundo', 'combate', 'fushi', 'sistema'] as WorldLogFilter[]).map((filter) => (
                  <option key={filter} value={filter}>
                    {formatLabel(filter)}
                  </option>
                ))}
              </select>
            </label>

            <textarea
              className="field__input field__input--textarea"
              onChange={(event) => setManualLogText(event.target.value)}
              placeholder="Ex: Aureon detectou rastros humanos perto da trilha."
              value={manualLogText}
            />

            <div className="tabletop-hud-panel__actions">
              <button className="button button--primary" onClick={addManualLog} type="button">
                Registrar log
              </button>
              <button className="button" onClick={() => setActiveTab('relogio')} type="button">
                Abrir relogio
              </button>
            </div>
          </article>

          <div className="list-stack">
            {filteredLogs.map((log) => (
              <article className="list-card" key={log.id}>
                <div className="list-card__top">
                  <h3>
                    Dia {log.dia} | {formatClockTime(log.hora)}
                  </h3>
                  <span className={`status-pill status-pill--${log.tone}`}>
                    {formatLabel(log.categoria)}
                  </span>
                </div>
                <p className="support-copy">
                  {logView === 'tecnico' && log.tecnico ? log.tecnico : log.texto}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

interface CanonReviewPanelProps {
  allEvents: WorldSimulationEvent[]
  contextSnapshotText: string
  noteText: string
  onApprove: (eventId: string) => void
  onBuildSnapshot: () => void
  onNoteTextChange: (text: string) => void
  onRefresh: () => void
  onReject: (eventId: string) => void
  onSubmitNote: () => void
  pendingEvents: WorldSimulationEvent[]
  summary: WorldSimulationSessionSummary
}

function CanonReviewPanel({
  allEvents,
  contextSnapshotText,
  noteText,
  onApprove,
  onBuildSnapshot,
  onNoteTextChange,
  onRefresh,
  onReject,
  onSubmitNote,
  pendingEvents,
  summary,
}: CanonReviewPanelProps) {
  const approvedEvents = allEvents
    .filter((event) => event.canonStatus === 'canon_approved')
    .slice(-12)
    .reverse()

  return (
    <div className="world-mundi__split">
      <article className="list-card">
        <div className="list-card__top">
          <div>
            <p className="eyebrow">Canon da sessao</p>
            <h3>Revisao antes da IA</h3>
          </div>
          <span className="tag">{pendingEvents.length} pendente(s)</span>
        </div>

        <p className="support-copy">
          Tudo que a IA sugerir, ouvir ou inferir entra aqui primeiro. So o que for aprovado
          vira fato para memoria, resumo e proximas decisoes.
        </p>

        <div className="tag-row">
          <span className="tag">Observado {summary.observedCount}</span>
          <span className="tag">Candidato {summary.candidateCount}</span>
          <span className="tag">Aprovado {summary.approvedCount}</span>
          <span className="tag">Rejeitado {summary.rejectedCount}</span>
        </div>

        <label className="field">
          <span>Nota candidata de canon</span>
          <textarea
            className="field__input field__input--textarea"
            onChange={(event) => onNoteTextChange(event.target.value)}
            placeholder="Ex: Jaxir viu J2 recuar do combate e interpretou isso como potencial, nao covardia."
            value={noteText}
          />
        </label>

        <div className="tabletop-hud-panel__actions">
          <button className="button button--primary" onClick={onSubmitNote} type="button">
            Enviar para revisao
          </button>
          <button className="button" onClick={onBuildSnapshot} type="button">
            Gerar contexto IA
          </button>
          <button className="button" onClick={onRefresh} type="button">
            Atualizar fila
          </button>
        </div>

        {contextSnapshotText ? (
          <label className="field">
            <span>Snapshot seguro para API</span>
            <textarea
              className="field__input field__input--textarea"
              readOnly
              value={contextSnapshotText}
            />
          </label>
        ) : null}
      </article>

      <div className="list-stack">
        <article className="list-card">
          <div className="list-card__top">
            <div>
              <p className="eyebrow">Fila de aprovacao</p>
              <h3>Eventos candidatos</h3>
            </div>
            <span className="tag">{pendingEvents.length}</span>
          </div>

          {pendingEvents.length > 0 ? (
            <div className="list-stack">
              {pendingEvents.map((event) => (
                <div className="world-mundi__preview-card" key={event.id}>
                  <div className="list-card__top">
                    <strong>{event.actorLabel ?? event.actor}</strong>
                    <span className="tag">{formatLabel(event.type)}</span>
                  </div>
                  <p className="support-copy">{event.text}</p>
                  <p className="support-copy">
                    {new Date(event.timestamp).toLocaleString()} | mapa {event.mapId || 'sem mapa'}
                  </p>
                  <div className="tabletop-hud-panel__actions">
                    <button className="button button--primary" onClick={() => onApprove(event.id)} type="button">
                      Aprovar canon
                    </button>
                    <button className="button" onClick={() => onReject(event.id)} type="button">
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="support-copy">Nenhum evento aguardando aprovacao.</p>
          )}
        </article>

        <article className="list-card">
          <div className="list-card__top">
            <div>
              <p className="eyebrow">Canon aprovado</p>
              <h3>Ultimos fatos</h3>
            </div>
            <span className="tag">{approvedEvents.length}</span>
          </div>
          {approvedEvents.length > 0 ? (
            approvedEvents.map((event) => (
              <p className="support-copy" key={event.id}>
                {event.actorLabel ?? event.actor}: {event.text}
              </p>
            ))
          ) : (
            <p className="support-copy">Ainda nao ha fatos aprovados nesta fila.</p>
          )}
        </article>
      </div>
    </div>
  )
}

interface QuickLocationPanelProps {
  characterById: Map<string, CharacterSheet>
  entities: WorldMundiEntity[]
  location: WorldMundiLocation | null
  locations: WorldMundiLocation[]
  logs: Array<{ id: string; texto: string; dia: number; hora: number }>
  maps: TabletopMap[]
  mapPreviewById: Record<string, string>
  npcs: WorldMundiNpcState[]
  onCreateMap: (locationId: string) => void
  onDiscardTemporary: (locationId: string) => void
  onLinkExistingMap: (location: WorldMundiLocation, mapId: string) => void
  onOpenMap: (location: WorldMundiLocation) => void
  onTransformTemporary: (locationId: string) => void
  routes: WorldMundiRoute[]
}

function QuickLocationPanel({
  characterById,
  entities,
  location,
  locations,
  logs,
  maps,
  mapPreviewById,
  npcs,
  onCreateMap,
  onDiscardTemporary,
  onLinkExistingMap,
  onOpenMap,
  onTransformTemporary,
  routes,
}: QuickLocationPanelProps) {
  const [selectedExistingMapId, setSelectedExistingMapId] = useState('')

  if (!location) {
    return null
  }

  const connectedRoutes = routes.filter(
    (route) =>
      !route.bloqueada && (route.origemId === location.id || route.destinoId === location.id),
  )
  const activeEntities = entities.filter(
    (entity) => entity.estado === 'ativo' && entity.localAtualId === location.id,
  )
  const isTemporaryLocation = location.tags.includes('temporario')
  const mapPreviewImage =
    location.usarImagemDoMapaLocal && location.mapId ? mapPreviewById[location.mapId] : ''
  const locationPreviewImage =
    location.previewImageUrl || location.imagemLocalUrl || mapPreviewImage || getMundiLocationImage(location)
  const compatibleMaps = maps.filter(
    (map) =>
      map.id !== location.mapId &&
      (!map.biomeId || map.biomeId === location.biomaId || !location.biomaId),
  )

  return (
    <article className="list-card">
      <div className="list-card__top">
        <div>
          <p className="eyebrow">Local selecionado</p>
          <h3>{location.nome}</h3>
        </div>
        <span className="tag">{formatLabel(location.estadoVisual)}</span>
      </div>

      {locationPreviewImage ? (
        <img
          alt={location.nome}
          className="world-mundi__location-thumb"
          src={resolveRuntimeAssetUrl(locationPreviewImage)}
        />
      ) : (
        <div
          className={`world-mundi__location-thumb world-mundi__location-thumb--${getLocationThumbnailType(
            location,
          )}`}
        >
          <span>{getLocationIcon(location)}</span>
        </div>
      )}

      <p className="support-copy">{location.descricaoInicial || 'Sem descricao ainda.'}</p>
      <div className="tag-row">
        <span className="tag">Risco {location.riscoAtual}</span>
        <span className="tag">FUSHI {location.estabilidadeFushi}/5</span>
        <span className="tag">Distorcao {location.distorcao}/5</span>
        <span className="tag">DT {location.dtEncontrar}</span>
      </div>

      <div className="world-mundi__map-link">
        <div>
          <p className="eyebrow">Mapa local</p>
          <strong>Status: {location.hasMap ? formatLabel(location.mapStatus) : 'sem mapa'}</strong>
        </div>
        <div className="tabletop-hud-panel__actions">
          {location.hasMap ? (
            <button className="button button--primary" onClick={() => onOpenMap(location)} type="button">
              Ver no MAP
            </button>
          ) : (
            <button className="button button--primary" onClick={() => onCreateMap(location.id)} type="button">
              Criar mapa local
            </button>
          )}
        </div>
      </div>

      {compatibleMaps.length > 0 ? (
        <details className="world-mundi__preview-card">
          <summary>Vincular mapa existente</summary>
          <div className="tabletop-hud-panel__actions">
            <select
              className="field__input world-mundi__inline-select"
              onChange={(event) => setSelectedExistingMapId(event.target.value)}
              value={selectedExistingMapId}
            >
              <option value="">Escolher mapa do MAP</option>
              {compatibleMaps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name}
                </option>
              ))}
            </select>
            <button
              className="button"
              disabled={!selectedExistingMapId}
              onClick={() => {
                if (!selectedExistingMapId) {
                  return
                }

                onLinkExistingMap(location, selectedExistingMapId)
                setSelectedExistingMapId('')
              }}
              type="button"
            >
              Usar mapa existente
            </button>
          </div>
        </details>
      ) : null}

      {isTemporaryLocation ? (
        <div className="world-mundi__preview-card">
          <strong>Ponto temporario de exploracao</strong>
          <p className="support-copy">
            Use enquanto o grupo esta improvisando direcao. Depois transforme em local real ou descarte.
          </p>
          <div className="tabletop-hud-panel__actions">
            <button className="button button--primary" onClick={() => onTransformTemporary(location.id)} type="button">
              Transformar em local permanente
            </button>
            <button className="button" onClick={() => onDiscardTemporary(location.id)} type="button">
              Descartar ponto temporario
            </button>
          </div>
        </div>
      ) : null}

      {activeEntities.length > 0 ? (
        <div className="list-stack">
          <h3>Entidades / mobs</h3>
          {activeEntities.map((entity) => (
            <div className="world-mundi__preview-card" key={entity.id}>
              <strong>
                {entity.nome} x{entity.quantidade}
              </strong>
              <p className="support-copy">
                Tipo: {formatLabel(entity.tipo)} | risco {entity.risco}
              </p>
              <p className="support-copy">
                Hostilidade: {entity.hostilidade}. {entity.comportamento}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {npcs.length > 0 ? (
        <div className="list-stack">
          <h3>NPCs presentes</h3>
          {npcs.map((npc) => {
            const character = characterById.get(npc.characterId)
            const portrait = getCharacterPortrait(character)

            return (
              <div className="world-mundi__preview-card world-mundi__npc-preview-card" key={npc.characterId}>
                <span className="world-mundi__npc-preview-avatar">
                  {portrait ? (
                    <img alt="" src={resolveRuntimeAssetUrl(portrait)} />
                  ) : (
                    (character?.nome ?? npc.characterId).slice(0, 2).toUpperCase()
                  )}
                </span>
                <div>
                  <strong>{character?.nome ?? npc.characterId}</strong>
                  <div className="tag-row">
                    <span className="tag">{formatLabel(npc.presencaNoMapa)}</span>
                    <span className="tag">{formatLabel(npc.intencaoAtual)}</span>
                  </div>
                  <p className="support-copy">
                    Motivo: {npc.contextoNarrativo || npc.ultimoLog || npc.objetivoAtual || 'Ainda sem nota narrativa.'}
                  </p>
                  <p className="support-copy">
                    Proxima tendencia: {npc.tendencias[0] ?? 'Reagir ao local e ao objetivo atual.'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="support-copy">Nenhum NPC configurado neste local.</p>
      )}

      <div className="list-stack">
        <h3>Rotas conectadas</h3>
        {connectedRoutes.slice(0, 5).map((route) => {
          const otherLocationId = route.origemId === location.id ? route.destinoId : route.origemId
          const otherLocation = locations.find((entry) => entry.id === otherLocationId)

          return (
            <p className="support-copy" key={route.id}>
              {otherLocation ? getRouteDirection(location, otherLocation) : 'Rota'}:{' '}
              {otherLocation?.nome ?? 'Destino'} | players {formatHours(route.tempoPlayersHoras)} |
              NPC {formatHours(route.tempoNpcHoras)} | risco {route.risco}
              {route.secreta ? ' | secreta' : ''}
              {route.requisito ? ` | req: ${route.requisito}` : ''}
            </p>
          )
        })}
      </div>

      {logs.length > 0 ? (
        <div className="list-stack">
          <h3>Ultimos registros</h3>
          {logs.slice(0, 3).map((log) => (
            <p className="support-copy" key={log.id}>
              Dia {log.dia} {formatClockTime(log.hora)}: {log.texto}
            </p>
          ))}
        </div>
      ) : null}
    </article>
  )
}

interface LocationEditorProps {
  biomes: WorldMundiState['biomes']
  location: WorldMundiLocation | null
  mapPreviewById: Record<string, string>
  onCreateLocation: () => void
  onCreateRoute: () => void
  onPatchLocation: (locationId: string, partialLocation: Partial<WorldMundiLocation>) => void
}

function LocationEditor({
  biomes,
  location,
  mapPreviewById,
  onCreateLocation,
  onCreateRoute,
  onPatchLocation,
}: LocationEditorProps) {
  const [uploadStatus, setUploadStatus] = useState('')

  async function handlePreviewImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null

    if (!file || !location) {
      return
    }

    setUploadStatus('Salvando imagem de preview...')

    try {
      const uploadedAsset = await uploadPhysicalAsset(file, {
        category: 'images',
        contentType: file.type || 'application/octet-stream',
        filename: file.name,
      })

      onPatchLocation(location.id, {
        imagemLocalUrl: uploadedAsset.url,
        previewImageAssetId: uploadedAsset.storagePath,
        previewImageUrl: uploadedAsset.url,
        usarImagemDoMapaLocal: false,
      })
      setUploadStatus('Imagem de preview salva.')
    } catch (error) {
      setUploadStatus(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel salvar a imagem de preview.',
      )
    } finally {
      event.currentTarget.value = ''
    }
  }

  if (!location) {
    return (
      <article className="list-card">
        <h3>Nenhum local selecionado</h3>
        <button className="button button--primary" onClick={onCreateLocation} type="button">
          Criar local
        </button>
      </article>
    )
  }

  const linkedMapPreview = location.mapId ? mapPreviewById[location.mapId] : ''
  const effectivePreviewImage =
    location.previewImageUrl ||
    location.imagemLocalUrl ||
    (location.usarImagemDoMapaLocal ? linkedMapPreview : '') ||
    getMundiLocationImage(location)

  return (
    <article className="list-card world-mundi__editor">
      <div className="list-card__top">
        <div>
          <p className="eyebrow">Editor tecnico</p>
          <h3>{location.nome}</h3>
        </div>
        <span className="tag">{formatLabel(location.nivelDetalhe)}</span>
      </div>

      <div className="cards-grid">
        <label className="field">
          <span>Nome</span>
          <input
            className="field__input"
            onChange={(event) => onPatchLocation(location.id, { nome: event.target.value })}
            value={location.nome}
          />
        </label>
        <label className="field">
          <span>Bioma</span>
          <select
            className="field__input"
            onChange={(event) => onPatchLocation(location.id, { biomaId: event.target.value })}
            value={location.biomaId}
          >
            {biomes.map((biome) => (
              <option key={biome.id} value={biome.id}>
                {biome.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Tipo</span>
          <select
            className="field__input"
            onChange={(event) =>
              onPatchLocation(location.id, {
                tipo: event.target.value as WorldMundiLocation['tipo'],
              })
            }
            value={location.tipo}
          >
            {WORLD_MUNDI_LOCATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Nivel</span>
          <select
            className="field__input"
            onChange={(event) =>
              onPatchLocation(location.id, {
                nivelDetalhe: event.target.value as WorldMundiLocation['nivelDetalhe'],
              })
            }
            value={location.nivelDetalhe}
          >
            {WORLD_MUNDI_DETAIL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {formatLabel(level)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Descricao para narracao</span>
        <textarea
          className="field__input field__input--textarea"
          onChange={(event) =>
            onPatchLocation(location.id, { descricaoInicial: event.target.value })
          }
          value={location.descricaoInicial}
        />
      </label>

      <div className="cards-grid">
        <label className="field">
          <span>Risco atual</span>
          <input
            className="field__input"
            onChange={(event) => onPatchLocation(location.id, { riscoAtual: event.target.value })}
            value={location.riscoAtual}
          />
        </label>
        <label className="field">
          <span>Estado visual</span>
          <select
            className="field__input"
            onChange={(event) =>
              onPatchLocation(location.id, {
                estadoVisual: event.target.value as WorldMundiLocation['estadoVisual'],
              })
            }
            value={location.estadoVisual}
          >
            {WORLD_MUNDI_VISUAL_STATES.map((visualState) => (
              <option key={visualState} value={visualState}>
                {formatLabel(visualState)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Estabilidade FUSHI: {location.estabilidadeFushi}/5</span>
          <input
            max={5}
            min={0}
            onChange={(event) =>
              onPatchLocation(location.id, {
                estabilidadeFushi: clampNumber(event.target.value, location.estabilidadeFushi),
              })
            }
            type="range"
            value={location.estabilidadeFushi}
          />
        </label>
        <label className="field">
          <span>Distorcao: {location.distorcao}/5</span>
          <input
            max={5}
            min={0}
            onChange={(event) =>
              onPatchLocation(location.id, {
                distorcao: clampNumber(event.target.value, location.distorcao),
              })
            }
            type="range"
            value={location.distorcao}
          />
        </label>
      </div>

      <div className="cards-grid">
        <label className="field">
          <span>Recursos</span>
          <input
            className="field__input"
            onChange={(event) =>
              onPatchLocation(location.id, { recursos: fromCsv(event.target.value) })
            }
            value={toCsv(location.recursos)}
          />
        </label>
        <label className="field">
          <span>Tags</span>
          <input
            className="field__input"
            onChange={(event) =>
              onPatchLocation(location.id, { tags: fromCsv(event.target.value) })
            }
            value={toCsv(location.tags)}
          />
        </label>
        <label className="field">
          <span>Corpos disponiveis</span>
          <input
            className="field__input"
            onChange={(event) =>
              onPatchLocation(location.id, { corposDisponiveis: fromCsv(event.target.value) })
            }
            value={toCsv(location.corposDisponiveis)}
          />
        </label>
        <label className="field">
          <span>DT encontrar</span>
          <input
            className="field__input"
            onChange={(event) =>
              onPatchLocation(location.id, {
                dtEncontrar: clampNumber(event.target.value, location.dtEncontrar),
              })
            }
            type="number"
            value={location.dtEncontrar}
          />
        </label>
      </div>

      <div className="world-mundi__preview-card">
        <div className="list-card__top">
          <div>
            <p className="eyebrow">Imagem de preview</p>
            <h3>Visual do local</h3>
          </div>
          <span className="tag">
            {location.usarImagemDoMapaLocal ? 'MAP vinculado' : 'Preview direto'}
          </span>
        </div>

        {effectivePreviewImage ? (
          <img
            alt={location.nome}
            className="world-mundi__location-thumb"
            src={resolveRuntimeAssetUrl(effectivePreviewImage)}
          />
        ) : (
          <div
            className={`world-mundi__location-thumb world-mundi__location-thumb--${getLocationThumbnailType(
              location,
            )}`}
          >
            <span>{getLocationIcon(location)}</span>
          </div>
        )}

        <div className="tabletop-hud-panel__actions">
          <label className="button">
            Escolher imagem
            <input
              accept="image/*"
              className="sr-only"
              onChange={handlePreviewImageUpload}
              type="file"
            />
          </label>
          <button
            className="button"
            disabled={!location.previewImageUrl && !location.imagemLocalUrl}
            onClick={() =>
              onPatchLocation(location.id, {
                imagemLocalUrl: '',
                previewImageAssetId: '',
                previewImageUrl: '',
                usarImagemDoMapaLocal: false,
              })
            }
            type="button"
          >
            Remover imagem
          </button>
          <button
            className={`button${location.usarImagemDoMapaLocal ? ' button--primary' : ''}`}
            disabled={!location.mapId}
            onClick={() =>
              onPatchLocation(location.id, {
                usarImagemDoMapaLocal: !location.usarImagemDoMapaLocal,
              })
            }
            type="button"
          >
            Usar imagem do MAP vinculado
          </button>
        </div>

        {uploadStatus ? <p className="support-copy">{uploadStatus}</p> : null}

        <details className="tabletop-library-technical">
          <summary className="tabletop-library-technical__summary">
            Detalhes avancados
          </summary>
          <div className="cards-grid">
            <label className="field">
              <span>URL/caminho salvo</span>
              <input
                className="field__input"
                onChange={(event) =>
                  onPatchLocation(location.id, {
                    imagemLocalUrl: event.target.value,
                    previewImageUrl: event.target.value,
                  })
                }
                value={location.previewImageUrl || location.imagemLocalUrl}
              />
            </label>
            <label className="field">
              <span>ID do asset</span>
              <input
                className="field__input"
                onChange={(event) =>
                  onPatchLocation(location.id, { previewImageAssetId: event.target.value })
                }
                value={location.previewImageAssetId}
              />
            </label>
            <label className="field">
              <span>Thumbnail tipo</span>
              <input
                className="field__input"
                onChange={(event) =>
                  onPatchLocation(location.id, { thumbnailTipo: event.target.value })
                }
                placeholder="caverna, vila, floresta..."
                value={location.thumbnailTipo}
              />
            </label>
          </div>
        </details>
      </div>

      <div className="tabletop-hud-panel__actions">
        <button className="button button--primary" onClick={onCreateLocation} type="button">
          + Local
        </button>
        <button className="button" onClick={onCreateRoute} type="button">
          + Rota
        </button>
      </div>
    </article>
  )
}

interface RouteEditorProps {
  locations: WorldMundiLocation[]
  onCreateRoute: () => void
  onDeleteRoute: (routeId: string) => void
  onPatchRoute: (routeId: string, partialRoute: Partial<WorldMundiRoute>) => void
  routes: WorldMundiRoute[]
}

function RouteEditor({
  locations,
  onCreateRoute,
  onDeleteRoute,
  onPatchRoute,
  routes,
}: RouteEditorProps) {
  function renderLocationSelect(
    value: string,
    onSelect: (nextLocationId: string) => void,
  ) {
    return (
      <select
        className="field__input"
        onChange={(event) => onSelect(event.target.value)}
        value={value}
      >
        <option value="">Sem local</option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.nome}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="list-stack">
      <button className="button button--primary" onClick={onCreateRoute} type="button">
        + Rota
      </button>

      {routes.map((route) => (
        <article className="list-card" key={route.id}>
          <div className="list-card__top">
            <h3>
              {locations.find((location) => location.id === route.origemId)?.nome ?? 'Origem'}
              {' -> '}
              {locations.find((location) => location.id === route.destinoId)?.nome ?? 'Destino'}
            </h3>
            <span className="tag">
              players {formatHours(route.tempoPlayersHoras)} | NPC {formatHours(route.tempoNpcHoras)}
            </span>
          </div>

          <div className="cards-grid">
            <label className="field">
              <span>Tipo de rota</span>
              <select
                className="field__input"
                onChange={(event) =>
                  onPatchRoute(route.id, {
                    tipo: event.target.value as WorldMundiRoute['tipo'],
                  })
                }
                value={route.tipo}
              >
                {WORLD_MUNDI_ROUTE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatLabel(type)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Origem</span>
              {renderLocationSelect(route.origemId, (locationId) =>
                onPatchRoute(route.id, { origemId: locationId }),
              )}
            </label>
            <label className="field">
              <span>Destino</span>
              {renderLocationSelect(route.destinoId, (locationId) =>
                onPatchRoute(route.id, { destinoId: locationId }),
              )}
            </label>
            <label className="field">
              <span>Tempo players</span>
              <input
                className="field__input"
                min={0}
                onChange={(event) =>
                  onPatchRoute(route.id, {
                    tempoPlayersHoras: clampNumber(event.target.value, route.tempoPlayersHoras),
                  })
                }
                step={CLOCK_STEP_HOURS}
                type="number"
                value={route.tempoPlayersHoras}
              />
            </label>
            <label className="field">
              <span>Tempo NPC fora de cena</span>
              <input
                className="field__input"
                min={0}
                onChange={(event) =>
                  onPatchRoute(route.id, {
                    tempoNpcHoras: clampNumber(event.target.value, route.tempoNpcHoras),
                  })
                }
                step={CLOCK_STEP_HOURS}
                type="number"
                value={route.tempoNpcHoras}
              />
            </label>
            <label className="field">
              <span>Risco</span>
              <input
                className="field__input"
                onChange={(event) => onPatchRoute(route.id, { risco: event.target.value })}
                value={route.risco}
              />
            </label>
            <label className="field">
              <span>Chance encontro</span>
              <input
                className="field__input"
                onChange={(event) =>
                  onPatchRoute(route.id, { chanceEncontro: event.target.value })
                }
                value={route.chanceEncontro}
              />
            </label>
            <label className="field">
              <span>Encontros possiveis</span>
              <input
                className="field__input"
                onChange={(event) =>
                  onPatchRoute(route.id, { encontrosPossiveis: fromCsv(event.target.value) })
                }
                value={toCsv(route.encontrosPossiveis)}
              />
            </label>
            <label className="field">
              <span>Eventos possiveis</span>
              <input
                className="field__input"
                onChange={(event) =>
                  onPatchRoute(route.id, { eventosPossiveis: fromCsv(event.target.value) })
                }
                value={toCsv(route.eventosPossiveis)}
              />
            </label>
            <label className="field">
              <span>Requisito</span>
              <input
                className="field__input"
                onChange={(event) => onPatchRoute(route.id, { requisito: event.target.value })}
                value={route.requisito}
              />
            </label>
          </div>

          <div className="world-mundi__checks">
            <label>
              <input
                checked={route.bloqueada}
                onChange={(event) => onPatchRoute(route.id, { bloqueada: event.target.checked })}
                type="checkbox"
              />
              Bloqueada
            </label>
            <label>
              <input
                checked={route.secreta}
                onChange={(event) => onPatchRoute(route.id, { secreta: event.target.checked })}
                type="checkbox"
              />
              Secreta
            </label>
          </div>

          <div className="tabletop-hud-panel__actions">
            <button className="button" onClick={() => onDeleteRoute(route.id)} type="button">
              Excluir
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

interface NpcWorldEditorProps {
  availableCharacters: CharacterSheet[]
  characterById: Map<string, CharacterSheet>
  locations: WorldMundiLocation[]
  npcToAddId: string
  npcReadinessByCharacterId: Map<string, NpcSimulationReadiness>
  npcReadinessSummary: {
    total: number
    readyCount: number
    needsContextCount: number
    missingLocationCount: number
    missingInMundiCount: number
  }
  npcs: WorldMundiNpcState[]
  onAddNpc: () => void
  onNpcToAddChange: (characterId: string) => void
  onPatchNpc: (characterId: string, partialNpc: Partial<WorldMundiNpcState>) => void
  onRemoveNpc: (characterId: string) => void
  onSyncCanonicalNpcs: () => void
  renderLocationSelect: (
    value: string,
    onSelect: (nextLocationId: string) => void,
  ) => JSX.Element
  submaps: WorldMundiSubmap[]
}

function getNpcActorRelation(
  npc: WorldMundiNpcState,
  actor: { id: string; label: string },
): WorldMundiNpcActorRelation {
  return (
    npc.memoriaSimulacao.relacoesPorAtor[actor.id] ?? {
      actorId: actor.id,
      label: actor.label,
      afinidade: 0,
      confianca: 0,
      rivalidade: 0,
      ameaca: 0,
      notas: '',
      ultimoEvento: '',
    }
  )
}

function NpcWorldEditor({
  availableCharacters,
  characterById,
  npcToAddId,
  npcReadinessByCharacterId,
  npcReadinessSummary,
  npcs,
  onAddNpc,
  onNpcToAddChange,
  onPatchNpc,
  onRemoveNpc,
  onSyncCanonicalNpcs,
  renderLocationSelect,
  submaps,
}: NpcWorldEditorProps) {
  function patchNpcMemory(
    npc: WorldMundiNpcState,
    partialMemory: Partial<WorldMundiNpcState['memoriaSimulacao']>,
  ) {
    onPatchNpc(npc.characterId, {
      memoriaSimulacao: {
        ...npc.memoriaSimulacao,
        ...partialMemory,
      },
    })
  }

  function patchNpcActorRelation(
    npc: WorldMundiNpcState,
    actor: { id: string; label: string },
    partialRelation: Partial<WorldMundiNpcActorRelation>,
  ) {
    const relation = getNpcActorRelation(npc, actor)

    patchNpcMemory(npc, {
      relacoesPorAtor: {
        ...npc.memoriaSimulacao.relacoesPorAtor,
        [actor.id]: {
          ...relation,
          ...partialRelation,
          actorId: actor.id,
          label: actor.label,
        },
      },
    })
  }

  return (
    <div className="list-stack">
      <article className="list-card">
        <div className="list-card__top">
          <div>
            <p className="eyebrow">Importacao/ajuste</p>
            <h3>NPCs no Mundi</h3>
          </div>
          <span className="tag">{npcs.length} configurado(s)</span>
        </div>
        <p className="support-copy">
          Base segura da simulacao: NPC sem local, objetivo e contexto confirmado fica pendente, sem preencher lacunas sozinho.
        </p>
        <div className="tag-row">
          <span className="tag">{npcReadinessSummary.total} NPCs reais</span>
          <span className="tag">{npcReadinessSummary.missingInMundiCount} fora do MUN</span>
          <span className="tag">{npcReadinessSummary.readyCount} prontos</span>
          <span className="tag">{npcReadinessSummary.needsContextCount} com perguntas</span>
          <span className="tag">{npcReadinessSummary.missingLocationCount} sem local</span>
        </div>
        <div className="tabletop-hud-panel__actions">
          <button className="button button--primary" onClick={onSyncCanonicalNpcs} type="button">
            Sincronizar NPCs reais
          </button>
          <select
            className="field__input world-mundi__inline-select"
            onChange={(event) => onNpcToAddChange(event.target.value)}
            value={npcToAddId}
          >
            <option value="">Escolher personagem</option>
            {availableCharacters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.nome}
              </option>
            ))}
          </select>
          <button className="button button--primary" onClick={onAddNpc} type="button">
            Adicionar
          </button>
        </div>
      </article>

      {npcs.map((npc) => {
        const character = characterById.get(npc.characterId)
        const readiness = npcReadinessByCharacterId.get(npc.characterId)
        const readinessTone =
          readiness?.status === 'ready'
            ? 'steady'
            : readiness?.status === 'missing_location'
              ? 'critical'
              : 'watch'

        return (
          <article className="list-card" key={npc.characterId}>
            <div className="list-card__top">
              <div>
                <p className="eyebrow">NPC</p>
                <h3>{character?.nome ?? npc.characterId}</h3>
              </div>
              <div className="tag-row">
                <span className="tag">{formatLabel(npc.estadoSimulacao)}</span>
                {readiness ? (
                  <span className={`status-pill status-pill--${readinessTone}`}>
                    IA {formatLabel(readiness.status)}
                  </span>
                ) : null}
              </div>
            </div>

            {readiness && readiness.questions.length > 0 ? (
              <div className="world-mundi__preview-card">
                <strong>Perguntas essenciais antes da IA agir</strong>
                {readiness.questions.slice(0, 6).map((question) => (
                  <p className="support-copy" key={question.id}>
                    {question.blocking ? 'Obrigatorio' : 'Revisao'}: {question.label} - {question.detail}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="cards-grid">
              <label className="field">
                <span>Estado de simulacao</span>
                <select
                  className="field__input"
                  onChange={(event) =>
                    onPatchNpc(npc.characterId, {
                      estadoSimulacao: event.target.value as WorldMundiNpcState['estadoSimulacao'],
                    })
                  }
                  value={npc.estadoSimulacao}
                >
                  {WORLD_MUNDI_SIMULATION_STATES.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Status entrada</span>
                <select
                  className="field__input"
                  onChange={(event) =>
                    onPatchNpc(npc.characterId, {
                      statusEntrada: event.target.value as WorldMundiNpcState['statusEntrada'],
                    })
                  }
                  value={npc.statusEntrada}
                >
                  {WORLD_MUNDI_ENTRY_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Presenca</span>
                <select
                  className="field__input"
                  onChange={(event) =>
                    onPatchNpc(npc.characterId, {
                      presencaNoMapa: event.target.value as WorldMundiNpcState['presencaNoMapa'],
                    })
                  }
                  value={npc.presencaNoMapa}
                >
                  {WORLD_MUNDI_PRESENCES.map((presence) => (
                    <option key={presence} value={presence}>
                      {formatLabel(presence)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Intencao</span>
                <select
                  className="field__input"
                  onChange={(event) =>
                    onPatchNpc(npc.characterId, {
                      intencaoAtual: event.target.value as WorldMundiNpcState['intencaoAtual'],
                    })
                  }
                  value={npc.intencaoAtual}
                >
                  {WORLD_MUNDI_INTENTIONS.map((intention) => (
                    <option key={intention} value={intention}>
                      {formatLabel(intention)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Local atual</span>
                {renderLocationSelect(npc.localAtualId, (locationId) =>
                  onPatchNpc(npc.characterId, { localAtualId: locationId, submapAtualId: '' }),
                )}
              </label>
              <label className="field">
                <span>Subrota / submapa</span>
                <select
                  className="field__input"
                  onChange={(event) =>
                    onPatchNpc(npc.characterId, {
                      submapAtualId: event.target.value,
                    })
                  }
                  value={npc.submapAtualId}
                >
                  <option value="">S0 / mapa principal</option>
                  {submaps
                    .filter((submap) => submap.parentLocationId === npc.localAtualId)
                    .map((submap) => (
                      <option key={submap.id} value={submap.id}>
                        {submap.codigo || 'S'} - {submap.nome}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                <span>Destino</span>
                {renderLocationSelect(npc.destinoAtualId, (locationId) =>
                  onPatchNpc(npc.characterId, { destinoAtualId: locationId }),
                )}
              </label>
            </div>

            <label className="field">
              <span>Contexto narrativo</span>
              <textarea
                className="field__input field__input--textarea"
                onChange={(event) =>
                  onPatchNpc(npc.characterId, { contextoNarrativo: event.target.value })
                }
                value={npc.contextoNarrativo}
              />
            </label>

            <div className="cards-grid">
              <label className="field">
                <span>Objetivo macro</span>
                <input
                  className="field__input"
                  onChange={(event) =>
                    onPatchNpc(npc.characterId, { objetivoMacro: event.target.value })
                  }
                  value={npc.objetivoMacro}
                />
              </label>
              <label className="field">
                <span>Objetivo atual</span>
                <input
                  className="field__input"
                  onChange={(event) =>
                    onPatchNpc(npc.characterId, { objetivoAtual: event.target.value })
                  }
                  value={npc.objetivoAtual}
                />
              </label>
              <label className="field">
                <span>Comportamento</span>
                <input
                  className="field__input"
                  onChange={(event) =>
                    onPatchNpc(npc.characterId, { comportamentoResumo: event.target.value })
                  }
                  value={npc.comportamentoResumo}
                />
              </label>
              <label className="field">
                <span>Tags interesse</span>
                <input
                  className="field__input"
                  onChange={(event) =>
                    onPatchNpc(npc.characterId, {
                      tagsInteresse: fromCsv(event.target.value),
                    })
                  }
                  value={toCsv(npc.tagsInteresse)}
                />
              </label>
              <label className="field">
                <span>Tendencias</span>
                <input
                  className="field__input"
                  onChange={(event) =>
                    onPatchNpc(npc.characterId, { tendencias: fromCsv(event.target.value) })
                  }
                  value={toCsv(npc.tendencias)}
                />
              </label>
            </div>

            <details className="world-mundi__preview-card">
              <summary>Memoria IA e relacoes M/J1-J5</summary>

              <div className="cards-grid">
                <label className="field">
                  <span>Medo atual</span>
                  <input
                    className="field__input"
                    onChange={(event) => patchNpcMemory(npc, { medoAtual: event.target.value })}
                    value={npc.memoriaSimulacao.medoAtual}
                  />
                </label>
                <label className="field">
                  <span>Conflito pendente</span>
                  <input
                    className="field__input"
                    onChange={(event) =>
                      patchNpcMemory(npc, { conflitoPendente: event.target.value })
                    }
                    value={npc.memoriaSimulacao.conflitoPendente}
                  />
                </label>
                <label className="field">
                  <span>Promessa ativa</span>
                  <input
                    className="field__input"
                    onChange={(event) => patchNpcMemory(npc, { promessaAtiva: event.target.value })}
                    value={npc.memoriaSimulacao.promessaAtiva}
                  />
                </label>
                <label className="field">
                  <span>Divida ativa</span>
                  <input
                    className="field__input"
                    onChange={(event) => patchNpcMemory(npc, { dividaAtiva: event.target.value })}
                    value={npc.memoriaSimulacao.dividaAtiva}
                  />
                </label>
                <label className="field">
                  <span>Segredo compartilhado</span>
                  <input
                    className="field__input"
                    onChange={(event) =>
                      patchNpcMemory(npc, { segredoCompartilhado: event.target.value })
                    }
                    value={npc.memoriaSimulacao.segredoCompartilhado}
                  />
                </label>
                <label className="field">
                  <span>Agenda</span>
                  <input
                    className="field__input"
                    onChange={(event) => patchNpcMemory(npc, { agenda: fromCsv(event.target.value) })}
                    value={toCsv(npc.memoriaSimulacao.agenda)}
                  />
                </label>
              </div>

              <label className="field">
                <span>Limites de canon</span>
                <textarea
                  className="field__input field__input--textarea"
                  onChange={(event) =>
                    patchNpcMemory(npc, { limitesCanon: fromCsv(event.target.value) })
                  }
                  placeholder="Separar por virgula. Ex: nao matar sem aprovacao, nao revelar Ryoku..."
                  value={toCsv(npc.memoriaSimulacao.limitesCanon)}
                />
              </label>

              <div className="list-stack">
                {SIMULATION_RELATION_ACTORS.map((actor) => {
                  const relation = getNpcActorRelation(npc, actor)

                  return (
                    <div className="world-mundi__preview-card" key={actor.id}>
                      <div className="list-card__top">
                        <strong>{actor.label}</strong>
                        <span className="tag">relacao</span>
                      </div>
                      <div className="cards-grid">
                        <label className="field">
                          <span>Afinidade</span>
                          <input
                            className="field__input"
                            max={5}
                            min={-5}
                            onChange={(event) =>
                              patchNpcActorRelation(npc, actor, {
                                afinidade: clampInteger(
                                  event.target.value,
                                  relation.afinidade,
                                  -5,
                                  5,
                                ),
                              })
                            }
                            type="number"
                            value={relation.afinidade}
                          />
                        </label>
                        <label className="field">
                          <span>Confianca</span>
                          <input
                            className="field__input"
                            max={5}
                            min={0}
                            onChange={(event) =>
                              patchNpcActorRelation(npc, actor, {
                                confianca: clampInteger(
                                  event.target.value,
                                  relation.confianca,
                                  0,
                                  5,
                                ),
                              })
                            }
                            type="number"
                            value={relation.confianca}
                          />
                        </label>
                        <label className="field">
                          <span>Rivalidade</span>
                          <input
                            className="field__input"
                            max={5}
                            min={0}
                            onChange={(event) =>
                              patchNpcActorRelation(npc, actor, {
                                rivalidade: clampInteger(
                                  event.target.value,
                                  relation.rivalidade,
                                  0,
                                  5,
                                ),
                              })
                            }
                            type="number"
                            value={relation.rivalidade}
                          />
                        </label>
                        <label className="field">
                          <span>Ameaca</span>
                          <input
                            className="field__input"
                            max={5}
                            min={0}
                            onChange={(event) =>
                              patchNpcActorRelation(npc, actor, {
                                ameaca: clampInteger(event.target.value, relation.ameaca, 0, 5),
                              })
                            }
                            type="number"
                            value={relation.ameaca}
                          />
                        </label>
                      </div>
                      <label className="field">
                        <span>Notas e ultimo evento</span>
                        <input
                          className="field__input"
                          onChange={(event) =>
                            patchNpcActorRelation(npc, actor, { notas: event.target.value })
                          }
                          placeholder="O que este NPC sabe/sente sobre este ator."
                          value={relation.notas}
                        />
                      </label>
                    </div>
                  )
                })}
              </div>
            </details>

            <div className="tabletop-hud-panel__actions">
              <button className="button" onClick={() => onRemoveNpc(npc.characterId)} type="button">
                Remover do Mundi
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
