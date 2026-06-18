import type { CharacterSheet, TabletopCell } from '../data/types'
import type { TabletopLogEntry } from './tabletopSession'
import {
  createWorldMundiNpcState,
  type WorldMundiLocation,
  type WorldMundiNpcState,
  type WorldMundiState,
} from './worldMundiState'

export const WORLD_SIMULATION_EVENTS_STORAGE_KEY =
  'fushi-tabletop:world-simulation-events:v1'

export type WorldSimulationEventType =
  | 'chat'
  | 'roll'
  | 'ping'
  | 'system'
  | 'token_move'
  | 'map_change'
  | 'measurement'
  | 'gm_note'
  | 'npc_state'
  | 'asset_request'

export type WorldSimulationCanonStatus =
  | 'observed'
  | 'canon_candidate'
  | 'canon_approved'
  | 'rejected'

export interface WorldSimulationEvent {
  id: string
  timestamp: string
  campaignId: string
  actor: string
  actorCharacterId?: string
  actorLabel?: string
  type: WorldSimulationEventType
  canonStatus: WorldSimulationCanonStatus
  sceneId: string
  mapId: string
  text: string
  payload: Record<string, unknown>
}

export interface NpcSimulationMemorySeed {
  npcId: string
  name: string
  fixedMemory: string
  shortMemory: string[]
  currentGoal: string
  currentFear: string
  currentIntention: string
  relationships: Record<string, string>
  canonLimits: string[]
}

export interface WorldSimulationContextSnapshot {
  generatedAt: string
  campaignId: string
  sceneId: string
  mapId: string
  worldClock: {
    dia: number
    hora: number
    fase: number
  }
  activeLocationId: string
  recentEvents: WorldSimulationEvent[]
  npcMemories: NpcSimulationMemorySeed[]
  openQuestions: string[]
  guardrails: string[]
}

export interface WorldSimulationSessionSummary {
  campaignId: string
  generatedAt: string
  observedCount: number
  candidateCount: number
  approvedCount: number
  rejectedCount: number
  recentApprovedFacts: string[]
  pendingReview: WorldSimulationEvent[]
}

export type NpcSimulationReadinessStatus =
  | 'ready'
  | 'needs_context'
  | 'missing_location'

export interface NpcSimulationQuestion {
  id: string
  label: string
  detail: string
  blocking: boolean
}

export interface NpcSimulationReadiness {
  characterId: string
  status: NpcSimulationReadinessStatus
  questions: NpcSimulationQuestion[]
  blockingQuestions: NpcSimulationQuestion[]
}

export interface NpcCanonicalPlacement {
  characterId: string
  locationId: string
  baseId: string
  submapId?: string
  biomeIds: string[]
  statusEntrada: WorldMundiNpcState['statusEntrada']
  presencaNoMapa: WorldMundiNpcState['presencaNoMapa']
  intencaoAtual: WorldMundiNpcState['intencaoAtual']
  tags: string[]
  confidence: 'explicit' | 'faction' | 'needs_review'
  notes: string[]
  blockers: string[]
}

export interface NpcCanonicalSyncResult {
  world: WorldMundiState
  readiness: NpcSimulationReadiness[]
  syncedCount: number
  readyCount: number
  needsContextCount: number
  missingLocationCount: number
}

function buildCampaignKey(campaignId?: string) {
  return `${WORLD_SIMULATION_EVENTS_STORAGE_KEY}:campaign:${campaignId?.trim() || 'campaign-local-default'}`
}

function buildId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function includesAny(value: string, tokens: string[]) {
  return tokens.some((token) => value.includes(token))
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function pickLocationId(locations: WorldMundiLocation[], candidates: string[]) {
  const availableIds = new Set(locations.map((location) => location.id))

  return candidates.find((candidate) => availableIds.has(candidate)) ?? ''
}

function collectExistingCharacterContext(character: CharacterSheet) {
  return uniqueStrings([
    character.notas,
    character.descricao?.historia ?? '',
    character.descricao?.personalidade ?? '',
  ]).join('\n')
}

function collectExistingBehavior(character: CharacterSheet) {
  return uniqueStrings([
    character.combatRole ?? '',
    character.descricao?.personalidade ?? '',
    ...character.habilidades.slice(0, 3),
  ]).join(' | ')
}

interface ExplicitNpcPlacement {
  baseCandidates?: string[]
  biomeIds: string[]
  confidence?: NpcCanonicalPlacement['confidence']
  intencaoAtual?: WorldMundiNpcState['intencaoAtual']
  locationCandidates: string[]
  notes?: string[]
  presencaNoMapa?: WorldMundiNpcState['presencaNoMapa']
  statusEntrada?: WorldMundiNpcState['statusEntrada']
  submapId?: string
  tags?: string[]
}

const EXPLICIT_NPC_PLACEMENTS: Record<string, ExplicitNpcPlacement> = {
  eiran: {
    biomeIds: ['montanhas_vazio_sereno'],
    locationCandidates: ['templo_vazio_sereno'],
    submapId: 'm8_s1_templo_vazio_interior',
    tags: ['faction-a', 'monge', 'templo'],
  },
  aureon: {
    biomeIds: ['floresta_mistica'],
    confidence: 'needs_review',
    intencaoAtual: 'protegendo_base',
    locationCandidates: ['coracao_verde'],
    notes: ['Prioridade narrativa: Aureon protege sistemas vivos; faccao nao prende o personagem nas Montanhas.'],
    presencaNoMapa: 'token_oculto',
    tags: ['faction-a', 'monge', 'floresta_mistica', 'sistema_vivo', 'aureon'],
  },
  kael: {
    biomeIds: ['montanhas_vazio_sereno'],
    locationCandidates: ['arena_natural_pedra'],
    tags: ['faction-a', 'monge', 'duelo'],
  },
  lux: {
    biomeIds: ['montanhas_vazio_sereno'],
    locationCandidates: ['caverna_meditacao'],
    submapId: 'm7_s1_caverna_meditacao_interior',
    tags: ['faction-a', 'monge', 'meditacao'],
  },
  gorin: {
    biomeIds: ['montanhas_vazio_sereno'],
    locationCandidates: ['ponte_suspensa'],
    submapId: 'm9_s1_poco_yin_yang',
    tags: ['faction-a', 'monge', 'travessia'],
  },
  musashi: {
    biomeIds: ['montanhas_vazio_sereno'],
    locationCandidates: ['saida_montanhas'],
    tags: ['faction-a', 'monge', 'fronteira'],
  },
  yanzik: {
    biomeIds: ['regiao_congelada_neve'],
    confidence: 'needs_review',
    intencaoAtual: 'viajando',
    locationCandidates: ['vale_branco'],
    notes: ['Viajante usado como presenca revisavel no Gelo para nao deixar o bioma vazio.'],
    presencaNoMapa: 'rumor',
    statusEntrada: 'oculto',
    tags: ['faction-b', 'viajante', 'gelo', 'revisar'],
  },
  seraph: {
    biomeIds: ['ruinas_antigas'],
    confidence: 'needs_review',
    intencaoAtual: 'oculto',
    locationCandidates: ['portao_sem_nome'],
    notes: ['Andarilho separado dos outros NPCs de FUSHI Escuro; revisar ponto final antes de canonizar.'],
    presencaNoMapa: 'rumor',
    statusEntrada: 'oculto',
    tags: ['faction-b', 'andarilho', 'portao'],
  },
  jaxir: {
    biomeIds: ['ruinas_antigas'],
    confidence: 'needs_review',
    intencaoAtual: 'oculto',
    locationCandidates: ['terras_podres'],
    notes: ['Andarilho mantido como presenca regional, separado de Yanzik/Seraph.'],
    presencaNoMapa: 'rumor',
    statusEntrada: 'oculto',
    tags: ['faction-b', 'andarilho', 'ruinas'],
  },
  velkar: {
    biomeIds: ['ruinas_antigas'],
    locationCandidates: ['biblioteca_morta'],
    tags: ['faction-b', 'biblioteca', 'memoria'],
  },
  lyssara: {
    biomeIds: ['ruinas_antigas'],
    locationCandidates: ['altar_quebrado'],
    tags: ['faction-b', 'altar', 'selo'],
  },
  kairo: {
    biomeIds: ['vale_cinzento_veu'],
    locationCandidates: ['acampamento_veu'],
    tags: ['faction-c', 'veu_cinza', 'base'],
  },
  elion: {
    biomeIds: ['vale_cinzento_veu'],
    locationCandidates: ['trilha_espioes'],
    tags: ['faction-c', 'veu_cinza', 'espionagem'],
  },
  arven: {
    biomeIds: ['vale_cinzento_veu'],
    locationCandidates: ['deposito_camuflado'],
    submapId: 'm46_s1_deposito_camuflado_interior',
    tags: ['faction-c', 'veu_cinza', 'recursos'],
  },
  varek: {
    biomeIds: ['vale_cinzento_veu'],
    locationCandidates: ['posto_interceptacao'],
    submapId: 'm48_s1_bunker_interceptacao',
    tags: ['faction-c', 'veu_cinza', 'bunker'],
  },
  aeron: {
    biomeIds: ['vale_cinzento_veu'],
    locationCandidates: ['torre_observacao'],
    submapId: 'm49_s1_topo_torre_observacao',
    tags: ['faction-c', 'veu_cinza', 'observacao'],
  },
  yor: {
    biomeIds: ['vale_cinzento_veu'],
    locationCandidates: ['torre_observacao'],
    submapId: 'm49_s1_topo_torre_observacao',
    tags: ['faction-c', 'veu_cinza', 'aeron'],
  },
  ryoku: {
    biomeIds: ['ruinas_antigas'],
    intencaoAtual: 'selado',
    locationCandidates: ['torre_abismo'],
    presencaNoMapa: 'influencia_regional',
    statusEntrada: 'selado',
    submapId: 'm30_s3_corpo_petrificado_ryoku',
    tags: ['faction-b', 'ryoku', 'selo'],
  },
  morghast: {
    biomeIds: ['vulcao_terras_cinzentas'],
    intencaoAtual: 'selado',
    locationCandidates: ['rio_da_escuridao'],
    presencaNoMapa: 'selado',
    statusEntrada: 'selado',
    submapId: 'm15_s1_corrida_abismo',
    tags: ['faction-f', 'guardiao_vulcao', 'morghast'],
  },
  euryaleth: {
    biomeIds: ['vulcao_terras_cinzentas'],
    intencaoAtual: 'selado',
    locationCandidates: ['vulcao_abandonado'],
    presencaNoMapa: 'selado',
    statusEntrada: 'selado',
    submapId: 'm16_s1_sala_estatuas_xadrez',
    tags: ['faction-f', 'guardiao_vulcao', 'euryaleth'],
  },
  vorashk: {
    biomeIds: ['vulcao_terras_cinzentas'],
    intencaoAtual: 'selado',
    locationCandidates: ['labirinto_quente'],
    presencaNoMapa: 'selado',
    statusEntrada: 'selado',
    submapId: 'm17_s1_arena_vorashk_sem_muros',
    tags: ['faction-f', 'guardiao_vulcao', 'vorashk'],
  },
  aeronyx: {
    biomeIds: ['vulcao_terras_cinzentas'],
    intencaoAtual: 'selado',
    locationCandidates: ['boca_inferno'],
    presencaNoMapa: 'selado',
    statusEntrada: 'selado',
    submapId: 'm18_s2_arena_aeronyx_topo',
    tags: ['faction-f', 'guardiao_vulcao', 'aeronyx'],
  },
  thalzhyr: {
    biomeIds: ['vulcao_terras_cinzentas'],
    intencaoAtual: 'selado',
    locationCandidates: ['mar_inquieto'],
    presencaNoMapa: 'selado',
    statusEntrada: 'selado',
    submapId: 'm19_s3_hidra_thalzhyr',
    tags: ['faction-f', 'guardiao_vulcao', 'thal_zhyr'],
  },
  astrael: {
    biomeIds: ['vulcao_terras_cinzentas'],
    intencaoAtual: 'selado',
    locationCandidates: ['transcendente'],
    presencaNoMapa: 'selado',
    statusEntrada: 'selado',
    tags: ['faction-f', 'guardiao_vulcao', 'astrael'],
  },
}

function getExplicitNpcPlacement(name: string) {
  const compactName = name.replace(/[^a-z0-9]/g, '')

  return EXPLICIT_NPC_PLACEMENTS[name] ?? EXPLICIT_NPC_PLACEMENTS[compactName]
}

function buildSafeNpcCurrentGoal(
  placement: NpcCanonicalPlacement,
  location?: WorldMundiLocation,
) {
  const locationLabel = location?.nome || placement.locationId || 'local canonico'

  switch (placement.intencaoAtual) {
    case 'treinando':
      return `Manter rotina de treino em ${locationLabel} ate o mestre aprovar uma mudanca de cena.`
    case 'investigando':
      return `Observar e investigar ${locationLabel} sem transformar suspeita em fato canonico.`
    case 'negociando':
      return `Manter presenca em ${locationLabel} e negociar apenas quando houver interacao aprovada.`
    case 'oculto':
      return `Permanecer oculto em ${locationLabel} ate um gatilho canonico aprovado revelar sua acao.`
    case 'selado':
      return `Permanecer selado ou indireto em ${locationLabel} ate o mestre liberar um gatilho canonico.`
    case 'viajando':
      return `Seguir deslocamento canonico ligado a ${locationLabel} sem mudar destino sem aprovacao.`
    case 'patrulhando':
      return `Patrulhar ${locationLabel} sem iniciar conflito importante sem aprovacao.`
    case 'cacando_recurso':
      return `Buscar recursos em ${locationLabel} sem alterar estoque, mapa ou faccao sem aprovacao.`
    case 'protegendo_base':
      return `Proteger ${locationLabel} e reagir somente a ameacas confirmadas pela mesa.`
    case 'fugindo':
      return `Evitar exposicao em ${locationLabel} ate a mesa confirmar perseguicao ou encontro.`
    case 'seguindo_pista':
      return `Seguir pista ligada a ${locationLabel} sem revelar fato novo sem aprovacao.`
    case 'procurando_combate':
      return `Manter postura agressiva em ${locationLabel} sem iniciar combate canonico sem aprovacao.`
    case 'descansando':
    case 'recuperando':
      return `Recuperar-se em ${locationLabel} e aguardar novo evento aprovado.`
    case 'em_evento_narrativo':
      return `Aguardar resolucao do evento narrativo em ${locationLabel} antes de agir fora de cena.`
    default:
      return `Observar ${locationLabel} e aguardar evento aprovado antes de agir.`
  }
}

function buildSafeNpcTendencies(placement: NpcCanonicalPlacement) {
  const base = [
    'Usar apenas fatos confirmados na ficha, no MUN ou em evento canon aprovado.',
    'Pedir revisao do mestre antes de revelar segredo, mudar mapa ou alterar faccao.',
  ]

  switch (placement.intencaoAtual) {
    case 'treinando':
      return [...base, 'Responder por disciplina, treino ou observacao antes de agir.']
    case 'investigando':
      return [...base, 'Coletar sinais e levantar perguntas sem transformar suspeita em fato.']
    case 'negociando':
      return [...base, 'Priorizar troca, rota ou acordo sem criar recurso novo sozinho.']
    case 'oculto':
      return [...base, 'Evitar exposicao direta ate existir gatilho canonico aprovado.']
    case 'selado':
      return [...base, 'Agir apenas como presenca indireta enquanto o selo estiver ativo.']
    case 'patrulhando':
    case 'protegendo_base':
      return [...base, 'Reagir a ameacas confirmadas sem iniciar conflito importante sozinho.']
    case 'viajando':
    case 'seguindo_pista':
      return [...base, 'Manter deslocamento ou pista atual sem trocar destino por conta propria.']
    case 'procurando_combate':
      return [...base, 'Sinalizar tensao antes de combate e aguardar aprovacao do mestre.']
    default:
      return [...base, 'Observar o estado atual da cena e esperar interacao confirmada.']
  }
}

export function isRealNpcCharacter(character: CharacterSheet) {
  const name = normalizeSearchText(character.nome)

  return character.tipo === 'npc' && Boolean(name) && !name.includes('placeholder')
}

export function resolveCanonicalNpcPlacement(
  character: CharacterSheet,
  locations: WorldMundiLocation[],
): NpcCanonicalPlacement {
  const name = normalizeSearchText(character.nome)
  const faction = normalizeSearchText(character.faccao)
  const currentLocationText = normalizeSearchText(character.localAtual)
  const notes: string[] = []
  const blockers: string[] = []

  let locationCandidates: string[] = []
  let baseCandidates: string[] = []
  let biomeIds: string[] = []
  let statusEntrada: WorldMundiNpcState['statusEntrada'] = 'em_base'
  let presencaNoMapa: WorldMundiNpcState['presencaNoMapa'] = 'token_oculto'
  let intencaoAtual: WorldMundiNpcState['intencaoAtual'] = 'observando'
  let tags: string[] = []
  let confidence: NpcCanonicalPlacement['confidence'] = 'faction'
  let submapId = ''
  const explicitPlacement = getExplicitNpcPlacement(name)

  if (explicitPlacement) {
    locationCandidates = explicitPlacement.locationCandidates
    baseCandidates = explicitPlacement.baseCandidates ?? explicitPlacement.locationCandidates
    biomeIds = explicitPlacement.biomeIds
    statusEntrada = explicitPlacement.statusEntrada ?? statusEntrada
    presencaNoMapa = explicitPlacement.presencaNoMapa ?? presencaNoMapa
    intencaoAtual = explicitPlacement.intencaoAtual ?? intencaoAtual
    tags = explicitPlacement.tags ?? []
    confidence = explicitPlacement.confidence ?? 'explicit'
    submapId = explicitPlacement.submapId ?? ''
    notes.push(...(explicitPlacement.notes ?? []))
  } else if (faction === 'faction-a' || includesAny(faction, ['vazio sereno', 'monge'])) {
    locationCandidates = ['templo_vazio_sereno']
    baseCandidates = ['templo_vazio_sereno']
    biomeIds = ['montanhas_vazio_sereno']
    intencaoAtual = 'treinando'
    tags = ['faction-a', 'monges', 'fushi_puro', 'montanhas']
  } else if (faction === 'faction-b' || includesAny(faction, ['fushi escuro'])) {
    locationCandidates = ['terras_podres']
    baseCandidates = ['terras_podres']
    biomeIds = ['ruinas_antigas']
    statusEntrada = 'oculto'
    presencaNoMapa = 'rumor'
    intencaoAtual = 'oculto'
    tags = ['faction-b', 'fushi_escuro', 'ruinas', 'oculto']

    if (name.includes('ryoku')) {
      locationCandidates = ['torre_abismo']
      baseCandidates = ['torre_abismo']
      statusEntrada = 'selado'
      presencaNoMapa = 'influencia_regional'
      intencaoAtual = 'selado'
      confidence = 'explicit'
    } else if (includesAny(name, ['velkar', 'lyssara'])) {
      locationCandidates = ['biblioteca_morta', 'terras_podres']
      confidence = 'needs_review'
      notes.push('O local salvo do personagem e generico para Ruinas; revisar ponto exato.')
    } else if (includesAny(name, ['jaxir', 'seraph', 'yanzik'])) {
      locationCandidates = ['terras_podres', 'portao_sem_nome']
      confidence = 'needs_review'
      notes.push('NPC marcado como viajante/andarilho; ponto regional inicial precisa de confirmacao do mestre.')
    }
  } else if (faction === 'faction-c' || includesAny(faction, ['veu cinza', 'detetive'])) {
    locationCandidates = ['acampamento_veu']
    baseCandidates = ['acampamento_veu']
    biomeIds = ['vale_cinzento_veu']
    intencaoAtual = 'investigando'
    tags = ['faction-c', 'veu_cinza', 'detetives', 'informacao']

    if (includesAny(name, ['aeron', 'yor'])) {
      locationCandidates = ['torre_observacao', 'acampamento_veu']
      confidence = 'needs_review'
      notes.push('Aeron/Yor possuem local textual ligado a organizacao secreta; revisar se devem ficar na torre.')
    } else if (currentLocationText.includes('floresta')) {
      locationCandidates = ['trilha_enraizada', 'acampamento_veu']
      confidence = 'needs_review'
      notes.push('O local salvo cita Floresta; usei a passagem Floresta/Veu como ponto revisavel.')
    }
  } else if (faction === 'faction-d' || includesAny(faction, ['vila', 'conhecimento absorvido'])) {
    locationCandidates = ['vila_conhecimento_absorvido']
    baseCandidates = ['vila_conhecimento_absorvido']
    biomeIds = ['planicie_floresta_inicial']
    intencaoAtual = 'observando'
    tags = ['faction-d', 'vila', 'planicie', 'social']
  } else if (faction === 'faction-e' || includesAny(faction, ['mare livre', 'mare', 'litoral'])) {
    locationCandidates = ['embarque_faccao_mare']
    baseCandidates = ['embarque_faccao_mare']
    biomeIds = ['praia_litoral_oceano']
    intencaoAtual = 'negociando'
    tags = ['faction-e', 'mare_livre', 'praia', 'navegacao']

    if (currentLocationText.includes('oceano')) {
      locationCandidates = ['alto_mar', 'embarque_faccao_mare']
      confidence = 'explicit'
    } else if (includesAny(currentLocationText, ['praia', 'litoral'])) {
      confidence = 'explicit'
    }
  } else if (faction === 'faction-f' || includesAny(faction, ['guardioes', 'guardiao', 'vulcao'])) {
    locationCandidates = ['campo_cinzas']
    baseCandidates = ['campo_cinzas']
    biomeIds = ['vulcao_terras_cinzentas']
    statusEntrada = 'selado'
    presencaNoMapa = 'selado'
    intencaoAtual = 'selado'
    tags = ['faction-f', 'guardiao_vulcao', 'vulcao', 'selado']

    if (name.includes('morghast')) {
      locationCandidates = ['rio_da_escuridao']
      confidence = 'explicit'
    } else if (name.includes('euryaleth')) {
      locationCandidates = ['vulcao_abandonado']
      confidence = 'explicit'
    } else if (name.includes('vorashk')) {
      locationCandidates = ['labirinto_quente']
      confidence = 'explicit'
    } else if (name.includes('aeronyx')) {
      locationCandidates = ['boca_inferno']
      confidence = 'explicit'
    } else if (includesAny(name, ['thal', 'zhyr'])) {
      locationCandidates = ['mar_inquieto']
      confidence = 'explicit'
    } else if (name.includes('astrael')) {
      locationCandidates = ['transcendente']
      confidence = 'explicit'
    }
  }

  if (locationCandidates.length === 0) {
    if (currentLocationText.includes('vila')) {
      locationCandidates = ['vila_conhecimento_absorvido']
      biomeIds = ['planicie_floresta_inicial']
    } else if (currentLocationText.includes('praia')) {
      locationCandidates = ['praia_naufragos']
      biomeIds = ['praia_litoral_oceano']
    } else if (currentLocationText.includes('montanha')) {
      locationCandidates = ['templo_vazio_sereno']
      biomeIds = ['montanhas_vazio_sereno']
    } else if (currentLocationText.includes('vulcao')) {
      locationCandidates = ['campo_cinzas']
      biomeIds = ['vulcao_terras_cinzentas']
    } else if (currentLocationText.includes('ruina')) {
      locationCandidates = ['terras_podres']
      biomeIds = ['ruinas_antigas']
    }

    confidence = locationCandidates.length > 0 ? 'needs_review' : 'needs_review'
  }

  const locationId = pickLocationId(locations, locationCandidates)
  const baseId = pickLocationId(locations, baseCandidates.length > 0 ? baseCandidates : locationCandidates)

  if (!locationId) {
    blockers.push('Nenhum local canonico existente no MUN corresponde a este NPC.')
  }

  return {
    characterId: character.id,
    locationId,
    baseId: baseId || locationId,
    submapId,
    biomeIds,
    statusEntrada,
    presencaNoMapa,
    intencaoAtual,
    tags: uniqueStrings(tags),
    confidence,
    notes,
    blockers,
  }
}

export function createCanonicalNpcWorldState(input: {
  character: CharacterSheet
  existingNpc?: WorldMundiNpcState
  forceCanonicalPlacement?: boolean
  world: WorldMundiState
}) {
  const placement = resolveCanonicalNpcPlacement(input.character, input.world.locations)
  const validLocationIds = new Set(input.world.locations.map((location) => location.id))
  const validSubmapIds = new Set(input.world.submaps.map((submap) => submap.id))
  const existing = input.existingNpc
  const locationFromExisting =
    existing?.localAtualId && validLocationIds.has(existing.localAtualId)
      ? existing.localAtualId
      : ''
  const baseFromExisting =
    existing?.baseId && validLocationIds.has(existing.baseId) ? existing.baseId : ''
  const initialFromExisting =
    existing?.localInicialId && validLocationIds.has(existing.localInicialId)
      ? existing.localInicialId
      : ''
  const submapFromExisting =
    existing?.submapAtualId && validSubmapIds.has(existing.submapAtualId)
      ? existing.submapAtualId
      : ''
  const shouldUseCanonicalLocation = input.forceCanonicalPlacement || !locationFromExisting
  const canonicalLocationId = placement.locationId || locationFromExisting
  const canonicalBaseId = placement.baseId || canonicalLocationId
  const canonicalSubmapId =
    placement.submapId && validSubmapIds.has(placement.submapId) ? placement.submapId : ''
  const existingContext = collectExistingCharacterContext(input.character)
  const existingBehavior = collectExistingBehavior(input.character)
  const location = input.world.locations.find(
    (entry) => entry.id === (shouldUseCanonicalLocation ? canonicalLocationId : locationFromExisting),
  )

  if (!canonicalLocationId) {
    return null
  }

  return createWorldMundiNpcState({
    ...existing,
    characterId: input.character.id,
    estadoSimulacao:
      existing?.estadoSimulacao ??
      (placement.statusEntrada === 'selado' || placement.presencaNoMapa === 'influencia_regional'
        ? 'pausado_por_contexto'
        : 'seguindo_contexto'),
    statusEntrada: input.forceCanonicalPlacement
      ? placement.statusEntrada
      : existing?.statusEntrada ?? placement.statusEntrada,
    presencaNoMapa: input.forceCanonicalPlacement
      ? placement.presencaNoMapa
      : existing?.presencaNoMapa ?? placement.presencaNoMapa,
    localAtualId: shouldUseCanonicalLocation ? canonicalLocationId : locationFromExisting,
    localInicialId: shouldUseCanonicalLocation
      ? canonicalLocationId
      : initialFromExisting || locationFromExisting,
    baseId: input.forceCanonicalPlacement ? canonicalBaseId : baseFromExisting || canonicalBaseId,
    submapAtualId:
      input.forceCanonicalPlacement || shouldUseCanonicalLocation
        ? canonicalSubmapId
        : submapFromExisting,
    intencaoAtual: input.forceCanonicalPlacement
      ? placement.intencaoAtual
      : existing?.intencaoAtual ?? placement.intencaoAtual,
    biomasPreferidosIds: uniqueStrings([
      ...(existing?.biomasPreferidosIds ?? []),
      ...placement.biomeIds,
    ]),
    locaisConhecidosIds: uniqueStrings([
      ...(existing?.locaisConhecidosIds ?? []),
      canonicalLocationId,
      canonicalBaseId,
    ]),
    tagsInteresse: uniqueStrings([
      ...(existing?.tagsInteresse ?? []),
      ...placement.tags,
      ...(location?.tags ?? []),
    ]),
    tendencias: existing?.tendencias?.length
      ? existing.tendencias
      : buildSafeNpcTendencies(placement),
    contextoNarrativo:
      input.forceCanonicalPlacement && existingContext
        ? existingContext
        : existing?.contextoNarrativo || existingContext,
    comportamentoResumo:
      input.forceCanonicalPlacement && existingBehavior
        ? existingBehavior
        : existing?.comportamentoResumo || existingBehavior,
    objetivoMacro:
      input.forceCanonicalPlacement && input.character.descricao?.objetivo
        ? input.character.descricao.objetivo
        : existing?.objetivoMacro || input.character.descricao?.objetivo || '',
    objetivoAtual:
      existing?.objetivoAtual ||
      buildSafeNpcCurrentGoal(placement, location),
    ultimoLog:
      existing?.ultimoLog ||
      `Base canonica sincronizada: ${location?.nome ?? canonicalLocationId}.`,
  })
}

export function validateNpcSimulationReadiness(input: {
  character: CharacterSheet
  npcState?: WorldMundiNpcState
  world: WorldMundiState
}): NpcSimulationReadiness {
  const questions: NpcSimulationQuestion[] = []
  const validLocationIds = new Set(input.world.locations.map((location) => location.id))
  const npc = input.npcState
  const placement = resolveCanonicalNpcPlacement(input.character, input.world.locations)
  const existingContext = collectExistingCharacterContext(input.character)
  const existingBehavior = collectExistingBehavior(input.character)

  function addQuestion(
    id: string,
    label: string,
    detail: string,
    blocking = true,
  ) {
    questions.push({ id, label, detail, blocking })
  }

  if (!npc) {
    addQuestion(
      'npc-not-in-mundi',
      'Adicionar ao MUN',
      'Este NPC existe na campanha, mas ainda nao foi sincronizado para o estado do mundo.',
    )
  }

  if (!npc?.localAtualId || !validLocationIds.has(npc.localAtualId)) {
    addQuestion(
      'current-location',
      'Local atual canonico',
      placement.locationId
        ? `Confirmar se o ponto inicial correto e ${placement.locationId}.`
        : 'Escolher um local existente do MUN antes de liberar simulacao.',
    )
  }

  if (!npc?.localInicialId || !validLocationIds.has(npc.localInicialId)) {
    addQuestion(
      'initial-location',
      'Local de entrada',
      'Definir onde este NPC nasce/entra na historia antes de eventos automaticos.',
    )
  }

  if (!npc?.objetivoMacro && !input.character.descricao?.objetivo) {
    addQuestion(
      'macro-goal',
      'Objetivo de longo prazo',
      'Qual objetivo canonico guia este NPC quando o mestre nao estiver olhando diretamente?',
    )
  }

  if (!npc?.objetivoAtual) {
    addQuestion(
      'current-goal',
      'Objetivo da sessao',
      'O que este NPC esta tentando fazer agora, nesta sessao ou arco atual?',
    )
  }

  if (!npc?.contextoNarrativo && !existingContext) {
    addQuestion(
      'canon-context',
      'Contexto canonico minimo',
      'Registrar fatos confirmados de historia/personalidade; sem isso a IA nao deve preencher lacunas.',
    )
  }

  if (!npc?.comportamentoResumo && !existingBehavior) {
    addQuestion(
      'behavior',
      'Comportamento sob pressao',
      'Como este NPC reage a medo, oportunidade, negociacao e violencia?',
    )
  }

  if (!npc?.tendencias.length) {
    addQuestion(
      'tendencies',
      'Tendencias seguras',
      'Definir 1-3 tendencias permitidas para a simulacao sem transformar sugestao em canon.',
      false,
    )
  }

  if (npc && (npc.statusEntrada === 'chega_por_evento' || npc.statusEntrada === 'chega_dia_x') && !npc.condicaoChegada) {
    addQuestion(
      'entry-trigger',
      'Gatilho de entrada',
      'Qual evento, dia ou decisao do mestre libera este NPC na ilha?',
    )
  }

  if (npc && !npc.memoriaSimulacao.conheceuPlayers && !npc.contextoNarrativo.includes('player')) {
    addQuestion(
      'player-relationship',
      'Relacao inicial com jogadores',
      'Confirmar se ele conhece, ignora, procura, evita ou teme os protagonistas.',
      false,
    )
  }

  if (npc && Object.keys(npc.memoriaSimulacao.relacoesPorAtor).length === 0) {
    addQuestion(
      'actor-relations',
      'Relacoes por M/J1-J5',
      'Preencher confianca, ameaca e notas por ator antes de usar voz/API em tempo real.',
      false,
    )
  }

  if (npc && npc.memoriaSimulacao.limitesCanon.length === 0) {
    addQuestion(
      'canon-limits',
      'Limites de canon',
      'Definir o que este NPC nunca pode decidir sozinho sem aprovacao do mestre.',
      false,
    )
  }

  if (placement.confidence === 'needs_review') {
    addQuestion(
      'placement-review',
      'Revisar ponto escolhido',
      placement.notes[0] ?? 'O local foi inferido por faccao/regiao, nao por cena exata confirmada.',
      false,
    )
  }

  const blockingQuestions = questions.filter((question) => question.blocking)

  return {
    characterId: input.character.id,
    status:
      placement.blockers.length > 0
        ? 'missing_location'
        : blockingQuestions.length > 0
          ? 'needs_context'
          : 'ready',
    questions,
    blockingQuestions,
  }
}

export function seedCanonicalNpcWorld(input: {
  characters: CharacterSheet[]
  forceCanonicalPlacement?: boolean
  world: WorldMundiState
}): NpcCanonicalSyncResult {
  const nextNpcs = { ...input.world.npcs }
  const readiness: NpcSimulationReadiness[] = []
  let syncedCount = 0

  input.characters.filter(isRealNpcCharacter).forEach((character) => {
    const nextNpc = createCanonicalNpcWorldState({
      character,
      existingNpc: nextNpcs[character.id],
      forceCanonicalPlacement: input.forceCanonicalPlacement,
      world: input.world,
    })

    if (nextNpc) {
      nextNpcs[character.id] = nextNpc
      syncedCount += 1
    }

    readiness.push(
      validateNpcSimulationReadiness({
        character,
        npcState: nextNpc ?? nextNpcs[character.id],
        world: input.world,
      }),
    )
  })

  const readyCount = readiness.filter((entry) => entry.status === 'ready').length
  const missingLocationCount = readiness.filter(
    (entry) => entry.status === 'missing_location',
  ).length

  return {
    world: {
      ...input.world,
      npcs: nextNpcs,
    },
    readiness,
    syncedCount,
    readyCount,
    needsContextCount: readiness.length - readyCount - missingLocationCount,
    missingLocationCount,
  }
}

function readJsonArray(key: string): unknown[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    const parsedValue = rawValue ? JSON.parse(rawValue) : []

    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

function writeJsonArray(key: string, value: unknown[]) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Simulation logging is observational; it must never break the table.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeEvent(value: unknown): WorldSimulationEvent | null {
  if (!isRecord(value)) {
    return null
  }

  const type = value.type
  const canonStatus = value.canonStatus

  if (
    type !== 'chat' &&
    type !== 'roll' &&
    type !== 'ping' &&
    type !== 'system' &&
    type !== 'token_move' &&
    type !== 'map_change' &&
    type !== 'measurement' &&
    type !== 'gm_note' &&
    type !== 'npc_state' &&
    type !== 'asset_request'
  ) {
    return null
  }

  if (
    canonStatus !== 'observed' &&
    canonStatus !== 'canon_candidate' &&
    canonStatus !== 'canon_approved' &&
    canonStatus !== 'rejected'
  ) {
    return null
  }

  return {
    id: typeof value.id === 'string' ? value.id : buildId('world-event'),
    timestamp:
      typeof value.timestamp === 'string' ? value.timestamp : new Date().toISOString(),
    campaignId: typeof value.campaignId === 'string' ? value.campaignId : '',
    actor: typeof value.actor === 'string' ? value.actor : 'system',
    actorCharacterId:
      typeof value.actorCharacterId === 'string' ? value.actorCharacterId : undefined,
    actorLabel: typeof value.actorLabel === 'string' ? value.actorLabel : undefined,
    type,
    canonStatus,
    sceneId: typeof value.sceneId === 'string' ? value.sceneId : '',
    mapId: typeof value.mapId === 'string' ? value.mapId : '',
    text: typeof value.text === 'string' ? value.text : '',
    payload: isRecord(value.payload) ? value.payload : {},
  }
}

export function readWorldSimulationEvents(campaignId?: string) {
  return readJsonArray(buildCampaignKey(campaignId))
    .map(normalizeEvent)
    .filter((event): event is WorldSimulationEvent => event !== null)
}

export function writeWorldSimulationEvents(
  campaignId: string | undefined,
  events: WorldSimulationEvent[],
) {
  writeJsonArray(buildCampaignKey(campaignId), events.slice(-500))
}

export function appendWorldSimulationEvent(
  campaignId: string | undefined,
  event: WorldSimulationEvent,
) {
  const events = readWorldSimulationEvents(campaignId)
  writeWorldSimulationEvents(campaignId, [...events, event])
}

export function updateWorldSimulationEventCanonStatus(
  campaignId: string | undefined,
  eventId: string,
  canonStatus: WorldSimulationCanonStatus,
): WorldSimulationEvent | null {
  let updatedEvent: WorldSimulationEvent | null = null
  const events = readWorldSimulationEvents(campaignId).map((event) => {
    if (event.id !== eventId) {
      return event
    }

    updatedEvent = {
      ...event,
      canonStatus,
      payload: {
        ...event.payload,
        reviewedAt: new Date().toISOString(),
      },
    }

    return updatedEvent
  })

  writeWorldSimulationEvents(campaignId, events)

  return updatedEvent
}

export function getWorldSimulationReviewQueue(campaignId?: string) {
  return readWorldSimulationEvents(campaignId)
    .filter((event) => event.canonStatus === 'canon_candidate')
    .slice(-80)
    .reverse()
}

export function buildWorldSimulationSessionSummary(
  campaignId?: string,
): WorldSimulationSessionSummary {
  const events = readWorldSimulationEvents(campaignId)
  const pendingReview = events
    .filter((event) => event.canonStatus === 'canon_candidate')
    .slice(-25)
    .reverse()

  return {
    campaignId: campaignId ?? '',
    generatedAt: new Date().toISOString(),
    observedCount: events.filter((event) => event.canonStatus === 'observed').length,
    candidateCount: events.filter((event) => event.canonStatus === 'canon_candidate').length,
    approvedCount: events.filter((event) => event.canonStatus === 'canon_approved').length,
    rejectedCount: events.filter((event) => event.canonStatus === 'rejected').length,
    recentApprovedFacts: events
      .filter((event) => event.canonStatus === 'canon_approved')
      .slice(-20)
      .map((event) => event.text),
    pendingReview,
  }
}

export function createWorldSimulationEvent(input: {
  actor: string
  actorCharacterId?: string
  actorLabel?: string
  campaignId?: string
  canonStatus?: WorldSimulationCanonStatus
  mapId?: string
  payload?: Record<string, unknown>
  sceneId?: string
  text: string
  type: WorldSimulationEventType
}) {
  return {
    id: buildId(`world-${input.type}`),
    timestamp: new Date().toISOString(),
    campaignId: input.campaignId ?? '',
    actor: input.actor,
    actorCharacterId: input.actorCharacterId,
    actorLabel: input.actorLabel,
    type: input.type,
    canonStatus: input.canonStatus ?? 'observed',
    sceneId: input.sceneId ?? '',
    mapId: input.mapId ?? '',
    text: input.text,
    payload: input.payload ?? {},
  } satisfies WorldSimulationEvent
}

export function createWorldSimulationEventFromLogEntry(
  entry: TabletopLogEntry,
  context: {
    campaignId?: string
    mapId?: string
    sceneId?: string
  },
) {
  const type =
    entry.type === 'message'
      ? 'chat'
      : entry.type === 'roll'
        ? 'roll'
        : entry.type

  return createWorldSimulationEvent({
    actor: entry.author || 'system',
    actorLabel: entry.author,
    campaignId: context.campaignId,
    canonStatus: entry.type === 'system' ? 'canon_candidate' : 'observed',
    mapId: context.mapId,
    payload: {
      entryId: entry.id,
      roll: entry.roll,
      visibility: entry.visibility,
    },
    sceneId: context.sceneId,
    text: entry.text,
    type,
  })
}

export function createWorldSimulationMapChangeEvent(input: {
  actor: string
  campaignId?: string
  fromMapId?: string
  fromSceneId?: string
  mapName: string
  toMapId: string
  toSceneId: string
}) {
  return createWorldSimulationEvent({
    actor: input.actor,
    actorLabel: input.actor,
    campaignId: input.campaignId,
    canonStatus: 'canon_candidate',
    mapId: input.toMapId,
    payload: {
      fromMapId: input.fromMapId ?? '',
      fromSceneId: input.fromSceneId ?? '',
      toMapId: input.toMapId,
      toSceneId: input.toSceneId,
    },
    sceneId: input.toSceneId,
    text: `Mapa ativado para a mesa: ${input.mapName}.`,
    type: 'map_change',
  })
}

export function createWorldSimulationTokenMoveEvent(input: {
  actor: string
  campaignId?: string
  mapId?: string
  sceneId?: string
  tokens: Array<{
    id: string
    name: string
    from: TabletopCell
    to: TabletopCell
  }>
}) {
  return createWorldSimulationEvent({
    actor: input.actor,
    actorLabel: input.actor,
    campaignId: input.campaignId,
    mapId: input.mapId,
    payload: {
      tokens: input.tokens,
    },
    sceneId: input.sceneId,
    text: `${input.tokens.length} token(s) movido(s) na mesa.`,
    type: 'token_move',
  })
}

export function buildNpcSimulationMemorySeed(input: {
  character: CharacterSheet
  npcState?: WorldMundiNpcState
  recentEvents?: WorldSimulationEvent[]
}): NpcSimulationMemorySeed {
  const memory = input.npcState?.memoriaSimulacao
  const shortMemory = (input.recentEvents ?? [])
    .filter((event) => event.text && event.text.includes(input.character.nome))
    .slice(-5)
    .map((event) => event.text)
  const actorRelationships = Object.fromEntries(
    Object.values(memory?.relacoesPorAtor ?? {}).map((relation) => [
      relation.actorId,
      [
        `afinidade ${relation.afinidade}`,
        `confianca ${relation.confianca}`,
        `rivalidade ${relation.rivalidade}`,
        `ameaca ${relation.ameaca}`,
        relation.notas ? `notas: ${relation.notas}` : '',
        relation.ultimoEvento ? `ultimo evento: ${relation.ultimoEvento}` : '',
      ]
        .filter(Boolean)
        .join(' | '),
    ]),
  )

  return {
    npcId: input.character.id,
    name: input.character.nome,
    fixedMemory:
      input.character.notas ||
      input.character.descricao?.historia ||
      input.character.descricao?.personalidade ||
      '',
    shortMemory: [...(memory?.memoriaCurta ?? []), ...shortMemory].slice(-10),
    currentGoal: input.npcState?.objetivoAtual || input.npcState?.objetivoMacro || '',
    currentFear: memory?.medoAtual || memory?.conflitoPendente || '',
    currentIntention: input.npcState?.intencaoAtual || 'observando',
    relationships: {
      playersAffinity: String(memory?.afinidadeComPlayers ?? 0),
      playersTrust: String(memory?.confiancaNosPlayers ?? 0),
      playersThreat: String(memory?.ameacaPercebidaPlayers ?? 0),
      ...actorRelationships,
    },
    canonLimits: [
      'Nao matar NPC importante sem aprovacao do mestre.',
      'Nao revelar verdade final de Cataclisma.',
      'Nao transformar teoria em fato canonico.',
      ...(memory?.limitesCanon ?? []),
    ],
  }
}

export function buildWorldSimulationContextSnapshot(input: {
  campaignId?: string
  characters: CharacterSheet[]
  mapId?: string
  sceneId?: string
  world: WorldMundiState
}) {
  const recentEvents = readWorldSimulationEvents(input.campaignId).slice(-80)
  const npcMemories = input.characters
    .filter((character) => character.tipo === 'npc')
    .map((character) =>
      buildNpcSimulationMemorySeed({
        character,
        npcState: input.world.npcs[character.id],
        recentEvents,
      }),
    )

  return {
    generatedAt: new Date().toISOString(),
    campaignId: input.campaignId ?? '',
    sceneId: input.sceneId ?? '',
    mapId: input.mapId ?? '',
    worldClock: input.world.clock,
    activeLocationId: input.world.selectedLocationId,
    recentEvents,
    npcMemories,
    openQuestions: input.world.logs
      .filter((log) => log.texto.includes('?'))
      .slice(0, 12)
      .map((log) => log.texto),
    guardrails: [
      'IA sugere; mestre aprova antes de virar canon.',
      'Preservar lore e segredos maiores.',
      'Usar eventos da sessao antes de improvisar.',
      'Eventos canon_candidate precisam de aprovacao antes de alterar NPC, mapa ou historia.',
    ],
  } satisfies WorldSimulationContextSnapshot
}
