import { useMemo, useState, type CSSProperties, type JSX } from 'react'
import type { CharacterSheet, TabletopMap } from '../../data/types'
import { uploadPhysicalAsset } from '../../lib/physicalAssets'
import {
  createWorldMundiBody,
  createWorldMundiConsciousness,
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
  type WorldMundiClock,
  type WorldMundiEntity,
  type WorldMundiLocation,
  type WorldMundiNpcState,
  type WorldMundiParty,
  type WorldMundiRoute,
  type WorldMundiState,
} from '../../lib/worldMundiState'

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
  characters: CharacterSheet[]
  maps?: TabletopMap[]
  mapPreviewById?: Record<string, string>
  state: WorldMundiState
  onChange: (nextState: WorldMundiState) => void
  onEnsureMapPlaceholders?: (requests: WorldMundiMapPlaceholderRequest[]) => void
  onLinkMapToLocation?: (mapId: string, locationId: string) => void
  onOpenMap?: (mapId: string) => void
}

type WorldMundiTab = 'mestre' | 'editor' | 'rotas' | 'npcs' | 'logs'
type TravelMode = 'players' | 'npc'
type MovementMode = 'quick' | 'planning'
type WorldLogView = 'mestre' | 'tecnico'
type WorldLogFilter = 'todos' | 'players' | 'npcs' | 'mundo' | 'combate' | 'fushi' | 'sistema'

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
  id: string
  label: string
  kind: 'player' | 'npc' | 'entity'
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

function formatLabel(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
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

function getLocationIcon(location: WorldMundiLocation) {
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
  const totalHours = clock.hora + hours
  const daysToAdd = Math.floor(totalHours / 24)
  const nextHour = Math.round((totalHours % 24) * 2) / 2

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
    return 'GP'
  }

  if (party.memberPlayerIds.length > 0) {
    return party.memberPlayerIds
      .map((playerId) => playerId.replace('player', 'J'))
      .slice(0, 2)
      .join('+')
  }

  return 'G'
}

function getPartyMemberLabel(party: WorldMundiParty, entityById: Map<string, WorldMundiEntity>) {
  const playerLabels = party.memberPlayerIds.map((playerId) => playerId.replace('player', 'J'))
  const entityLabels = party.memberEntityIds
    .map((entityId) => entityById.get(entityId)?.nome ?? entityId)
    .filter(Boolean)
  const characterLabels = party.memberCharacterIds

  return [...playerLabels, ...characterLabels, ...entityLabels].join(', ') || 'Sem membros'
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

  return Math.max(0.5, Math.round((distance / 100) * 24 * 2) / 2)
}

function findNearestLocation(
  locations: WorldMundiLocation[],
  position: { x: number; y: number },
  options: { includeHidden?: boolean } = {},
) {
  return locations
    .filter((location) => options.includeHidden || location.nivelDetalhe !== 'oculto')
    .map((location) => ({
      location,
      distance: Math.sqrt(
        (location.posicao.x - position.x) ** 2 + (location.posicao.y - position.y) ** 2,
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0]
}

function buildFreeTravelPlan(
  locations: WorldMundiLocation[],
  originId: string,
  targetPosition: { x: number; y: number },
): TravelPlan | null {
  const origin = locations.find((location) => location.id === originId)

  if (!origin) {
    return null
  }

  const nearest = findNearestLocation(locations, targetPosition)
  const direction =
    nearest?.location.id === origin.id
      ? getRouteDirection(origin, {
          ...origin,
          posicao: targetPosition,
        })
      : nearest
        ? getRouteDirection(origin, nearest.location)
        : getRouteDirection(origin, { ...origin, posicao: targetPosition })
  const targetName =
    nearest && nearest.distance <= 7
      ? nearest.location.nome
      : `Exploracao ${direction.toLowerCase()}`

  return {
    destinationId: nearest && nearest.distance <= 7 ? nearest.location.id : '',
    destinationName: targetName,
    freePosition: targetPosition,
    isFreeMovement: true,
    originId,
    originName: origin.nome,
    risk: nearest?.location.riscoAtual ?? origin.riscoAtual,
    routeIds: [],
    routeNames: [`movimento livre ${direction.toLowerCase()}`],
    timeHours: getDistanceHours(origin, targetPosition),
  }
}

function createFreeExplorationLocation(
  state: WorldMundiState,
  origin: WorldMundiLocation,
  plan: TravelPlan,
) {
  const nearest = plan.freePosition
    ? findNearestLocation(state.locations, plan.freePosition)
    : null
  const biomaId = nearest?.location.biomaId ?? origin.biomaId

  return createWorldMundiLocation({
    nome: plan.destinationId
      ? plan.destinationName
      : `Ponto temporario - ${plan.destinationName.replace(/^Exploracao\s+/i, '')} de ${origin.nome}`,
    tipo: 'subponto',
    biomaId,
    nivelDetalhe: 'generico',
    posicao: plan.freePosition ?? origin.posicao,
    descricaoInicial: `Ponto livre criado durante exploracao a partir de ${origin.nome}.`,
    riscoBase: nearest?.location.riscoBase ?? origin.riscoBase,
    riscoAtual: nearest?.location.riscoAtual ?? origin.riscoAtual,
    dtEncontrar: 8,
    eventosPossiveis: ['exploracao livre', 'rastro local', 'mudanca de direcao'],
    tags: ['exploracao_livre', 'temporario'],
  })
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
  characters,
  maps = [],
  mapPreviewById = {},
  state,
  onChange,
  onEnsureMapPlaceholders,
  onLinkMapToLocation,
  onOpenMap,
}: TabletopWorldMundiPanelProps) {
  const [activeTab, setActiveTab] = useState<WorldMundiTab>('mestre')
  const [draggedPartyId, setDraggedPartyId] = useState('')
  const [logFilter, setLogFilter] = useState<WorldLogFilter>('todos')
  const [logView, setLogView] = useState<WorldLogView>('mestre')
  const [manualLogText, setManualLogText] = useState('')
  const [memberSelection, setMemberSelection] = useState<string[]>([])
  const [movementMode, setMovementMode] = useState<MovementMode>('quick')
  const [movementNotice, setMovementNotice] = useState('')
  const [movementDestinationId, setMovementDestinationId] = useState('')
  const [npcJoinDraft, setNpcJoinDraft] = useState<NpcJoinDraft | null>(null)
  const [npcReleaseDraft, setNpcReleaseDraft] = useState<NpcReleaseDraft | null>(null)
  const [npcToAddId, setNpcToAddId] = useState('')
  const [reincarnationDraft, setReincarnationDraft] = useState<ReincarnationDraft | null>(null)
  const [resetCampaignText, setResetCampaignText] = useState('')
  const [resetClockText, setResetClockText] = useState('')
  const [resetTarget, setResetTarget] = useState<'clock' | 'campaign' | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [simulationPreview, setSimulationPreview] = useState<SimulationSuggestion[]>([])
  const [timePlanEntries, setTimePlanEntries] = useState<TimePlanEntry[]>([])
  const [undoStack, setUndoStack] = useState<WorldMundiState[]>([])

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
  const biomeById = useMemo(
    () => new Map(state.biomes.map((biome, index) => [biome.id, { ...biome, index }])),
    [state.biomes],
  )
  const visibleLocations = state.locations.filter(
    (location) => location.nivelDetalhe !== 'oculto',
  )
  const activeNpcStates = Object.values(state.npcs)
  const occupiedNpcCharacterIds = useMemo(
    () =>
      new Set(
        Object.values(state.corpos)
          .filter((body) => body.ocupadoPorConsciencia && body.npcOriginalId)
          .map((body) => body.npcOriginalId),
      ),
    [state.corpos],
  )
  const activeParties = Object.values(state.parties)
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
          npc.localAtualId === selectedLocation.id &&
          npc.presencaNoMapa !== 'inativo' &&
          npc.presencaNoMapa !== 'selado',
      )
    : []
  const logsAtSelectedLocation = selectedLocation
    ? state.logs.filter((log) =>
        log.texto.toLowerCase().includes(selectedLocation.nome.toLowerCase()),
      )
    : []
  const movementPreview =
    selectedParty && movementDestinationId
      ? findBestTravelPlan(
          state.locations,
          state.routes,
          selectedParty.localAtualId,
          movementDestinationId,
          'players',
        )
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
        ...npcsAtSelectedLocation.map((npc) => ({
          id: `npc:${npc.characterId}`,
          kind: 'npc' as const,
          label: characterById.get(npc.characterId)?.nome ?? npc.characterId,
        })),
        ...Object.values(state.entities)
          .filter((entity) => entity.estado === 'ativo' && entity.localAtualId === selectedLocation.id)
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
  const selectedPlayersAtLocation = membersAtSelectedLocation.filter(
    (member) => member.kind === 'player',
  )
  const selectedNpcsAtLocation = membersAtSelectedLocation.filter((member) => member.kind === 'npc')
  const selectedEntitiesAtLocation = membersAtSelectedLocation.filter(
    (member) => member.kind === 'entity',
  )

  function commit(updater: (currentState: WorldMundiState) => WorldMundiState) {
    onChange(createWorldMundiState(updater(state)))
  }

  function patchClock(partialClock: Partial<WorldMundiClock>) {
    commit((currentState) => ({
      ...currentState,
      clock: {
        ...currentState.clock,
        ...partialClock,
      },
    }))
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

  function selectLocation(locationId: string) {
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

  function ensureAllLocationMaps() {
    const requests: WorldMundiMapPlaceholderRequest[] = []
    const nextLocationLinks = new Map<string, { mapId: string; status: WorldMundiLocation['mapStatus'] }>()

    state.locations.forEach((location) => {
      const existingMap = findExistingMapForLocation(location)

      if (existingMap) {
        nextLocationLinks.set(location.id, {
          mapId: existingMap.id,
          status: location.hasMap ? location.mapStatus : 'customizado',
        })
        return
      }

      const request = buildMapPlaceholderRequest(location, state.biomes)

      requests.push(request)
      nextLocationLinks.set(location.id, {
        mapId: request.mapId,
        status: location.hasMap ? location.mapStatus : 'placeholder',
      })
    })

    onEnsureMapPlaceholders?.(requests)
    nextLocationLinks.forEach((link, locationId) => {
      onLinkMapToLocation?.(link.mapId, locationId)
    })
    commit((currentState) => ({
      ...currentState,
      locations: currentState.locations.map((location) => {
        const link = nextLocationLinks.get(location.id)
        const request = buildMapPlaceholderRequest(location, state.biomes)

        return link
          ? createWorldMundiLocation({
              ...location,
              hasMap: true,
              mapFolderId: location.mapFolderId || request.folderId,
              mapId: link.mapId,
              mapStatus: link.status,
            })
          : location
      }),
      logs: [
        createWorldMundiLogEntry({
          dia: currentState.clock.dia,
          hora: currentState.clock.hora,
          texto: `Placeholders MAP gerados para ${requests.length} local(is) do MUN.`,
          tecnico: 'MUN sincronizou estrutura Campanha atual > Ilha FUSHI > bioma > local > mapa principal.',
          categoria: 'sistema',
          canal: 'mestre',
          tone: 'steady',
        }),
        ...currentState.logs,
      ],
    }))
    setMovementNotice('MAP sincronizado com todos os locais do MUN.')
  }

  function openLocationMap(location: WorldMundiLocation) {
    const linkedMap = location.mapId
      ? maps.find((map) => map.id === location.mapId)
      : undefined
    const existingMap = linkedMap ?? findExistingMapForLocation(location)

    if (existingMap) {
      linkMapToLocation(location, existingMap.id, location.hasMap ? location.mapStatus : 'customizado')
      onOpenMap?.(existingMap.id)
      return
    }

    const request = buildMapPlaceholderRequest(location, state.biomes)

    onEnsureMapPlaceholders?.([request])
    linkMapToLocation(location, request.mapId, 'placeholder')
    onOpenMap?.(request.mapId)
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
    const selectedPlayerIds = memberSelection
      .filter((memberId) => memberId.startsWith('player:'))
      .map((memberId) => memberId.replace('player:', ''))
    const selectedCharacterIds = memberSelection
      .filter((memberId) => memberId.startsWith('npc:'))
      .map((memberId) => memberId.replace('npc:', ''))
    const selectedEntityIds = memberSelection
      .filter((memberId) => memberId.startsWith('entity:'))
      .map((memberId) => memberId.replace('entity:', ''))
    const nextParty = createWorldMundiParty({
      nome: `Grupo ${activeParties.length + 1}`,
      tipo: selectedCharacterIds.length > 0 ? 'grupo_misto' : 'party_temporaria',
      memberPlayerIds: selectedPlayerIds,
      memberCharacterIds: selectedCharacterIds,
      memberEntityIds: selectedEntityIds,
      localAtualId,
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
                estadoSimulacao: selectedPlayerIds.length > 0 ? 'acompanhando_grupo' : npc.estadoSimulacao,
              })
            : npc,
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
      contextoAtual: `Separado de ${party.nome}.`,
    })

    commit((currentState) => ({
      ...currentState,
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
    if (Object.keys(state.parties).length <= 1) {
      return
    }

    commit((currentState) => {
      const remainingParties = Object.fromEntries(
        Object.entries(currentState.parties).filter(([entryPartyId]) => entryPartyId !== partyId),
      )
      const nextSelectedPartyId = Object.keys(remainingParties)[0] ?? ''

      return {
        ...currentState,
        parties: remainingParties,
        selectedPartyId: nextSelectedPartyId,
      }
    })
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

  function startReincarnation(playerId?: string) {
    const targetPlayerId = playerId ?? selectedParty?.memberPlayerIds[0] ?? 'player1'

    setReincarnationDraft({
      bodyName: 'Novo corpo',
      bodyType: 'humano',
      estadoOriginal: 'em_disputa',
      locationId: selectedLocation?.id ?? selectedParty?.localAtualId ?? 'caverna_primeiro_corpo',
      npcOriginalId: '',
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

  function advanceClock(hours: number) {
    commit((currentState) => {
      const nextClock = resolveClockAfterAdvance(currentState.clock, hours)
      const nextLog = createWorldMundiLogEntry({
        dia: nextClock.dia,
        hora: nextClock.hora,
        texto: `Relogio do mundo avancou ${formatHours(hours)}. Use Simular para gerar a previa dos NPCs.`,
        categoria: 'sistema',
        tone: 'steady',
      })

      return {
        ...currentState,
        clock: nextClock,
        logs: [nextLog, ...currentState.logs],
      }
    })
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
      const suggestions = hours > 0 ? createSimulationSuggestions(hours, currentState) : []

      return applySimulationSuggestionsToState(baseState, suggestions, nextClock)
    })
    setMovementNotice(`${actionLabel} aplicado. O mundo avancou ${formatHours(hours)}.`)
  }

  function findCharacterIdByName(name: string) {
    const lowerName = name.toLowerCase()

    return characters.find((character) => character.nome.toLowerCase().includes(lowerName))?.id
  }

  function buildStateWithKnownNpcs(baseState = createWorldMundiState()) {
    const npcConfigs = [
      {
        lookup: 'eiran',
        localAtualId: 'vila_conhecimento_absorvido',
        intencaoAtual: 'observando',
        statusEntrada: 'ativo_no_inicio',
        presencaNoMapa: 'token_visivel',
        objetivoMacro: 'Entender os protagonistas sem comprometer a vila.',
        objetivoAtual: 'Observar o despertar social do grupo e avaliar se sao ameaca.',
        tagsInteresse: ['social', 'hub_opcional', 'players', 'informacao'],
        tagsAmeaca: ['violencia_gratuita', 'fushi_escuro'],
        biomasPreferidosIds: ['planicie_floresta_inicial'],
        biomasEvitadosIds: ['ruinas_antigas'],
        agressividade: 1,
        cautela: 4,
        curiosidade: 3,
        riscoAceito: 2,
        tendencias: ['ajudar se o grupo proteger inocentes', 'recuar se a vila estiver em risco'],
      },
      {
        lookup: 'aureon',
        localAtualId: 'laboratorio_abandonado',
        intencaoAtual: 'patrulhando',
        statusEntrada: 'ativo_no_inicio',
        presencaNoMapa: 'token_oculto',
        objetivoMacro: 'Preservar o equilibrio natural da Floresta Mistica.',
        objetivoAtual: 'Monitorar caca, fogo e sinais de dano ambiental.',
        tagsInteresse: ['natureza', 'caca', 'desequilibrio', 'destruicao_ambiental', 'fushi_natural'],
        tagsAmeaca: ['fogo', 'fushi_escuro', 'corrupcao', 'cacadores'],
        biomasPreferidosIds: ['floresta_mistica', 'planicie_floresta_inicial'],
        biomasEvitadosIds: ['vulcao_terras_cinzentas'],
        agressividade: 2,
        cautela: 4,
        curiosidade: 3,
        riscoAceito: 3,
        tendencias: ['observar humanos antes de agir', 'intervir contra dano ambiental real'],
      },
      {
        lookup: 'kael',
        localAtualId: 'templo_vazio_sereno',
        intencaoAtual: 'treinando',
        statusEntrada: 'em_base',
        presencaNoMapa: 'token_oculto',
        objetivoMacro: 'Manter o fluxo de FUSHI puro estavel nas montanhas.',
        objetivoAtual: 'Treinar e responder a anomalias percebidas pelos monges.',
        tagsInteresse: ['fushi_puro', 'treino', 'monges', 'equilibrio'],
        tagsAmeaca: ['fushi_instavel', 'distorcao', 'corrupcao'],
        biomasPreferidosIds: ['montanhas_vazio_sereno'],
        biomasEvitadosIds: ['ruinas_antigas'],
        agressividade: 2,
        cautela: 3,
        curiosidade: 3,
        riscoAceito: 3,
        tendencias: ['estabilizar fluxo antes de lutar', 'testar quem busca treino real'],
      },
      {
        lookup: 'lux',
        localAtualId: 'santuario_primeiro_fluxo',
        intencaoAtual: 'investigando',
        statusEntrada: 'ativo_no_inicio',
        presencaNoMapa: 'token_oculto',
        objetivoMacro: 'Entender anomalias sem quebrar o equilibrio local.',
        objetivoAtual: 'Investigar sinais sutis de FUSHI antes que virem distorcao.',
        tagsInteresse: ['fushi_puro', 'selo', 'informacao', 'anomalia'],
        tagsAmeaca: ['abuso_fushi', 'cataclismo', 'fushi_instavel'],
        biomasPreferidosIds: ['montanhas_vazio_sereno', 'ruinas_antigas'],
        biomasEvitadosIds: [],
        agressividade: 1,
        cautela: 5,
        curiosidade: 4,
        riscoAceito: 3,
        tendencias: ['investigar antes de revelar conclusoes', 'procurar padroes entre locais'],
      },
      {
        lookup: 'musashi',
        localAtualId: 'arena_natural_pedra',
        intencaoAtual: 'treinando',
        statusEntrada: 'ativo_no_inicio',
        presencaNoMapa: 'token_oculto',
        objetivoMacro: 'Encontrar duelos que revelem identidade verdadeira.',
        objetivoAtual: 'Treinar e testar oponentes dignos sem perseguir fracos.',
        tagsInteresse: ['duelo', 'combate', 'treino', 'npc_forte'],
        tagsAmeaca: ['covardia', 'inimigo_fraco'],
        biomasPreferidosIds: ['montanhas_vazio_sereno'],
        biomasEvitadosIds: [],
        agressividade: 4,
        cautela: 2,
        curiosidade: 3,
        riscoAceito: 4,
        tendencias: ['desafiar com honra', 'ignorar confronto sem valor'],
      },
      {
        lookup: 'yanzik',
        localAtualId: 'campo_cinzas',
        intencaoAtual: 'recuperando',
        statusEntrada: 'oculto',
        presencaNoMapa: 'token_oculto',
        objetivoMacro: 'Sobreviver ate ter vantagem real.',
        objetivoAtual: 'Evitar exposicao e recuperar recursos em zona hostil.',
        tagsInteresse: ['risco_alto', 'minerio', 'oculto', 'sobrevivencia'],
        tagsAmeaca: ['patrulha', 'npc_forte', 'players'],
        biomasPreferidosIds: ['vulcao_terras_cinzentas'],
        biomasEvitadosIds: ['vila_conhecimento_absorvido'],
        agressividade: 2,
        cautela: 5,
        curiosidade: 2,
        riscoAceito: 3,
        tendencias: ['fugir se estiver em desvantagem', 'aproveitar caos como cobertura'],
      },
      {
        lookup: 'seraph',
        localAtualId: 'costa_ossos',
        intencaoAtual: 'negociando',
        statusEntrada: 'ainda_fora_da_ilha',
        presencaNoMapa: 'inativo',
        objetivoMacro: 'Expandir influencia quando a ilha estiver pronta para dobrar.',
        objetivoAtual: 'Permanecer como ameaca futura ate gatilho narrativo.',
        tagsInteresse: ['influencia', 'players', 'faccao', 'caos'],
        tagsAmeaca: ['estabilidade', 'fushi_puro'],
        biomasPreferidosIds: ['praia_litoral_oceano', 'ruinas_antigas'],
        biomasEvitadosIds: [],
        agressividade: 4,
        cautela: 4,
        curiosidade: 4,
        riscoAceito: 5,
        tendencias: ['surgir por rumor antes de aparecer', 'recrutar ou pressionar figuras-chave'],
      },
      {
        lookup: 'velkar',
        localAtualId: 'camara_primeiro_selo',
        intencaoAtual: 'investigando',
        statusEntrada: 'oculto',
        presencaNoMapa: 'token_oculto',
        objetivoMacro: 'Manipular corpos, almas e fragmentos para abrir caminhos proibidos.',
        objetivoAtual: 'Investigar o Primeiro Selo sem se expor cedo demais.',
        tagsInteresse: ['fragmento', 'selo', 'corpo', 'fushi_instavel', 'ocultismo'],
        tagsAmeaca: ['monges', 'fushi_puro', 'observadores'],
        biomasPreferidosIds: ['ruinas_antigas'],
        biomasEvitadosIds: ['montanhas_vazio_sereno'],
        agressividade: 3,
        cautela: 5,
        curiosidade: 5,
        riscoAceito: 4,
        tendencias: ['agir por intermediarios', 'seguir sinais de reencarnacao incomum'],
      },
      {
        lookup: 'ryoku',
        localAtualId: 'camara_primeiro_selo',
        intencaoAtual: 'selado',
        statusEntrada: 'selado',
        presencaNoMapa: 'influencia_regional',
        objetivoMacro: 'Existir como pressao selada e eco de fragmentos.',
        objetivoAtual: 'Influenciar a regiao apenas por sinais, sonhos e instabilidade.',
        tagsInteresse: ['fragmento', 'selo', 'distorcao', 'fushi_instavel'],
        tagsAmeaca: ['purificacao', 'fushi_puro'],
        biomasPreferidosIds: ['ruinas_antigas'],
        biomasEvitadosIds: [],
        agressividade: 5,
        cautela: 3,
        curiosidade: 5,
        riscoAceito: 5,
        tendencias: ['aumentar pressao se fragmentos forem tocados', 'atrair ocultistas e sensitivos'],
      },
      {
        lookup: 'jaxir',
        localAtualId: 'praia_naufragos',
        intencaoAtual: 'procurando_combate',
        statusEntrada: 'chega_por_evento',
        presencaNoMapa: 'rumor',
        objetivoMacro: 'Encontrar oponentes interessantes e cultivar futuros duelos.',
        objetivoAtual: 'Seguir rumores de conflito e FUSHI chamativo.',
        tagsInteresse: ['combate', 'duelo', 'npc_forte', 'players', 'caos', 'risco_alto'],
        tagsAmeaca: ['tedio', 'inimigo_fraco'],
        biomasPreferidosIds: ['vulcao_terras_cinzentas', 'ruinas_antigas'],
        biomasEvitadosIds: [],
        agressividade: 5,
        cautela: 1,
        curiosidade: 5,
        riscoAceito: 5,
        tendencias: ['provocar sem matar rapido', 'seguir players se achar potencial divertido'],
      },
      {
        lookup: 'lyssara',
        localAtualId: 'cidade_afundada',
        intencaoAtual: 'negociando',
        statusEntrada: 'ativo_no_inicio',
        presencaNoMapa: 'token_oculto',
        objetivoMacro: 'Manipular relacoes sociais em locais instaveis.',
        objetivoAtual: 'Criar dependencia e informacao em ruinas habitaveis.',
        tagsInteresse: ['social', 'segredo', 'informacao', 'ruinas', 'faccao'],
        tagsAmeaca: ['exposicao', 'fushi_puro'],
        biomasPreferidosIds: ['ruinas_antigas', 'vale_cinzento_veu'],
        biomasEvitadosIds: [],
        agressividade: 2,
        cautela: 4,
        curiosidade: 4,
        riscoAceito: 3,
        tendencias: ['trocar ajuda por dependencia', 'evitar combate direto'],
      },
      {
        lookup: 'kairo',
        localAtualId: 'acampamento_movel_veu',
        intencaoAtual: 'observando',
        statusEntrada: 'em_base',
        presencaNoMapa: 'token_oculto',
        objetivoMacro: 'Manipular eventos por informacao e tempo correto.',
        objetivoAtual: 'Observar padroes regionais antes de mover pecas.',
        tagsInteresse: ['informacao', 'vigilancia', 'players', 'fushi_instavel', 'rumor'],
        tagsAmeaca: ['exposicao', 'combate_direto'],
        biomasPreferidosIds: ['vale_cinzento_veu'],
        biomasEvitadosIds: [],
        agressividade: 1,
        cautela: 5,
        curiosidade: 5,
        riscoAceito: 3,
        tendencias: ['enviar terceiros', 'seguir pista sem revelar autoria'],
      },
      {
        lookup: 'elion',
        localAtualId: 'ruina_segura',
        intencaoAtual: 'investigando',
        statusEntrada: 'em_base',
        presencaNoMapa: 'token_oculto',
        objetivoMacro: 'Transformar anomalias em informacao util para o Veu.',
        objetivoAtual: 'Analisar fluxo de FUSHI e cruzar logs regionais.',
        tagsInteresse: ['informacao', 'fushi_instavel', 'ruinas', 'analise'],
        tagsAmeaca: ['pressao_direta', 'caos'],
        biomasPreferidosIds: ['vale_cinzento_veu', 'ruinas_antigas'],
        biomasEvitadosIds: ['vulcao_terras_cinzentas'],
        agressividade: 1,
        cautela: 4,
        curiosidade: 5,
        riscoAceito: 2,
        tendencias: ['ficar onde ha dados', 'pedir protecao se investigacao ficar perigosa'],
      },
      {
        lookup: 'arven',
        localAtualId: 'acampamento_movel_veu',
        intencaoAtual: 'protegendo_base',
        statusEntrada: 'em_base',
        presencaNoMapa: 'token_oculto',
        objetivoMacro: 'Manter a Ordem do Veu viva e operacional.',
        objetivoAtual: 'Proteger base movel e decidir quando intervir.',
        tagsInteresse: ['base_faccao', 'estrategia', 'vigilancia', 'ordem'],
        tagsAmeaca: ['invasao', 'caos', 'fushi_escuro'],
        biomasPreferidosIds: ['vale_cinzento_veu'],
        biomasEvitadosIds: [],
        agressividade: 3,
        cautela: 4,
        curiosidade: 3,
        riscoAceito: 3,
        tendencias: ['proteger aliados antes de perseguir alvo', 'intervir apenas com vantagem'],
      },
      {
        lookup: 'varek',
        localAtualId: 'acampamento_movel_veu',
        intencaoAtual: 'protegendo_base',
        statusEntrada: 'em_base',
        presencaNoMapa: 'token_oculto',
        objetivoMacro: 'Proteger Arven e manter a linha defensiva.',
        objetivoAtual: 'Escoltar a lideranca do Veu e bloquear ameacas diretas.',
        tagsInteresse: ['protecao', 'base_faccao', 'patrulha', 'ordem'],
        tagsAmeaca: ['ameaca_superior', 'ataque_surpresa', 'players_hostis'],
        biomasPreferidosIds: ['vale_cinzento_veu'],
        biomasEvitadosIds: [],
        agressividade: 4,
        cautela: 3,
        curiosidade: 2,
        riscoAceito: 4,
        tendencias: ['ficar proximo de Arven', 'confrontar ameaca direta sem negociar muito'],
      },
    ] as const
    const seededNpcs = Object.fromEntries(
      npcConfigs
        .map((config) => {
          const characterId = findCharacterIdByName(config.lookup)

          if (!characterId) {
            return null
          }

          return [
            characterId,
            createWorldMundiNpcState({
              characterId,
              estadoSimulacao:
                config.presencaNoMapa === 'inativo' ||
                config.presencaNoMapa === 'influencia_regional'
                  ? 'pausado_por_contexto'
                  : 'autonomo',
              statusEntrada: config.statusEntrada,
              presencaNoMapa: config.presencaNoMapa,
              localAtualId: config.localAtualId,
              localInicialId: config.localAtualId,
              baseId: config.localAtualId,
              intencaoAtual: config.intencaoAtual,
              objetivoMacro: config.objetivoMacro,
              objetivoAtual: config.objetivoAtual,
              tagsInteresse: [...config.tagsInteresse],
              tagsAmeaca: [...config.tagsAmeaca],
              biomasPreferidosIds: [...config.biomasPreferidosIds],
              biomasEvitadosIds: [...config.biomasEvitadosIds],
              agressividade: config.agressividade,
              cautela: config.cautela,
              curiosidade: config.curiosidade,
              riscoAceito: config.riscoAceito,
              tendencias: [...config.tendencias],
              comportamentoResumo: config.objetivoMacro,
            }),
          ] as const
        })
        .filter((entry): entry is readonly [string, WorldMundiNpcState] => entry !== null),
    )

    return createWorldMundiState({
      ...baseState,
      npcs: {
        ...baseState.npcs,
        ...seededNpcs,
      },
    })
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

  function resetClock() {
    if (resetClockText !== 'RESET') {
      setMovementNotice('Digite RESET para confirmar o reset do relogio.')
      return
    }

    pushUndoSnapshot(state)
    commit((currentState) => ({
      ...currentState,
      clock: { dia: 1, hora: 8, fase: 0 },
      logs: [
        createWorldMundiLogEntry({
          dia: 1,
          hora: 8,
          texto: 'Relogio resetado para Dia 1, 08:00.',
          categoria: 'sistema',
          canal: 'mestre',
          tone: 'steady',
        }),
        ...currentState.logs,
      ],
    }))
    setResetClockText('')
    setResetTarget(null)
  }

  function applyTestScenario(scenario: string) {
    const baseState = buildStateWithKnownNpcs()

    if (scenario === 'separacao') {
      onChange(
        createWorldMundiState({
          ...baseState,
          parties: {
            grupo_a: createWorldMundiParty({
              id: 'grupo_a',
              nome: 'Grupo A',
              tipo: 'party_temporaria',
              memberPlayerIds: ['player1', 'player2'],
              localAtualId: 'vila_conhecimento_absorvido',
            }),
            grupo_b: createWorldMundiParty({
              id: 'grupo_b',
              nome: 'Grupo B',
              tipo: 'player_solo',
              memberPlayerIds: ['player3'],
              localAtualId: 'bosque_baixo',
            }),
            grupo_c: createWorldMundiParty({
              id: 'grupo_c',
              nome: 'Grupo C',
              tipo: 'party_temporaria',
              memberPlayerIds: ['player4', 'player5'],
              localAtualId: 'riacho_claro',
            }),
          },
          selectedPartyId: 'grupo_a',
          selectedLocationId: 'vila_conhecimento_absorvido',
        }),
      )
    } else if (scenario === 'npc_contexto') {
      const jaxirId = findCharacterIdByName('jaxir')
      const nextNpcs = { ...baseState.npcs }

      if (jaxirId) {
        nextNpcs[jaxirId] = createWorldMundiNpcState({
          ...(nextNpcs[jaxirId] ?? createWorldMundiNpcState({ characterId: jaxirId })),
          characterId: jaxirId,
          estadoSimulacao: 'acompanhando_grupo',
          presencaNoMapa: 'token_visivel',
          localAtualId: 'vila_conhecimento_absorvido',
          contextoNarrativo:
            'Jaxir acompanha J1/J2 por curiosidade e quer testar o potencial deles no futuro.',
          memoriaSimulacao: {
            conheceuPlayers: true,
            interesseNosPlayers: 5,
            afinidadeComPlayers: 1,
            rivalidadeComPlayers: 4,
            ameacaPercebidaPlayers: 2,
            confiancaNosPlayers: 1,
            querEncontrarPlayersNovamente: true,
            querEvitarPlayers: false,
            promessaAtiva: '',
            dividaAtiva: '',
            conflitoPendente: 'Quer lutar com eles quando estiverem fortes.',
            segredoCompartilhado: 'Sabe da condicao corporal incomum.',
          },
        })
      }

      onChange(
        createWorldMundiState({
          ...baseState,
          npcs: nextNpcs,
          parties: {
            grupo_jaxir: createWorldMundiParty({
              id: 'grupo_jaxir',
              nome: 'J1/J2 + Jaxir',
              tipo: 'grupo_misto',
              memberPlayerIds: ['player1', 'player2'],
              memberCharacterIds: jaxirId ? [jaxirId] : [],
              localAtualId: 'vila_conhecimento_absorvido',
            }),
            grupo_restante: createWorldMundiParty({
              id: 'grupo_restante',
              nome: 'Restante',
              tipo: 'party_temporaria',
              memberPlayerIds: ['player3', 'player4', 'player5'],
              localAtualId: 'vila_conhecimento_absorvido',
            }),
          },
          selectedPartyId: 'grupo_jaxir',
          selectedLocationId: 'vila_conhecimento_absorvido',
        }),
      )
    } else if (scenario === 'rota_perigosa') {
      onChange(
        createWorldMundiState({
          ...baseState,
          parties: {
            ...baseState.parties,
            party_protagonistas: createWorldMundiParty({
              ...baseState.parties.party_protagonistas,
              localAtualId: 'bosque_baixo',
            }),
          },
          selectedLocationId: 'bosque_baixo',
        }),
      )
    } else if (scenario === 'local_oculto') {
      onChange(
        createWorldMundiState({
          ...baseState,
          locations: baseState.locations.map((location) =>
            location.id === 'portao_sem_nome'
              ? createWorldMundiLocation({
                  ...location,
                  nivelDetalhe: 'oculto',
                  tipo: 'dungeon_escondida',
                  tags: [...location.tags, 'oculto', 'segredo'],
                  dtEncontrar: 16,
                })
              : location,
          ),
          parties: {
            ...baseState.parties,
            party_protagonistas: createWorldMundiParty({
              ...baseState.parties.party_protagonistas,
              localAtualId: 'altar_quebrado',
            }),
          },
          selectedLocationId: 'altar_quebrado',
        }),
      )
    } else {
      onChange(baseState)
    }

    pushUndoSnapshot(state)
    setMovementNotice(`Cenario aplicado: ${formatLabel(scenario)}.`)
    setShowSettings(false)
  }

  function pushUndoSnapshot(snapshot: WorldMundiState = state) {
    setUndoStack((currentStack) => [createWorldMundiState(snapshot), ...currentStack].slice(0, 20))
  }

  function buildTimePlanEntry(
    party: WorldMundiParty,
    travelPlan: TravelPlan,
    newLocation?: WorldMundiLocation,
  ): TimePlanEntry {
    return {
      action: 'travel',
      destinationId: newLocation?.id ?? travelPlan.destinationId,
      destinationName: newLocation?.nome ?? travelPlan.destinationName,
      freeTimeHours: 0,
      newLocation,
      originId: travelPlan.originId,
      originName: travelPlan.originName,
      partyId: party.id,
      partyName: party.nome,
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
    const origin = state.locations.find((location) => location.id === party.localAtualId)
    const routeTravelPlan = findBestTravelPlan(
      state.locations,
      state.routes,
      party.localAtualId,
      destinationId,
      'players',
    )
    const travelPlan =
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

    if (!travelPlan) {
      setMovementNotice(
        `Nao foi possivel calcular deslocamento para ${destination?.nome ?? 'este destino'}.`,
      )
      return
    }

    const nextEntry = buildTimePlanEntry(party, travelPlan)
    const routeNotice = routeTravelPlan
      ? ''
      : ' Sem rota cadastrada. Usando deslocamento livre estimado.'

    if (movementMode === 'quick') {
      applyMovementEntries([nextEntry], `Movimento aplicado.${routeNotice}`)
      return
    }

    setTimePlanEntries((currentEntries) => [
      ...currentEntries.filter((entry) => entry.partyId !== party.id),
      nextEntry,
    ])
    setMovementDestinationId('')
    setMovementNotice(`${party.nome} adicionado ao Plano de Tempo.${routeNotice}`)
    commit((currentState) => ({
      ...currentState,
      selectedLocationId: destinationId,
      selectedPartyId: party.id,
    }))
  }

  function movePartyFreely(partyId: string, targetPosition: { x: number; y: number }) {
    const party = state.parties[partyId]

    if (!party) {
      return
    }

    const travelPlan = buildFreeTravelPlan(state.locations, party.localAtualId, targetPosition)
    const origin = state.locations.find((location) => location.id === party.localAtualId)

    if (!travelPlan || !origin) {
      setMovementNotice('Nao foi possivel calcular movimento livre.')
      return
    }

    const existingDestination = travelPlan.destinationId
      ? state.locations.find((location) => location.id === travelPlan.destinationId)
      : null
    const newLocation =
      existingDestination || !travelPlan.isFreeMovement
        ? undefined
        : createFreeExplorationLocation(state, origin, travelPlan)
    const nextEntry = buildTimePlanEntry(party, travelPlan, newLocation)

    if (movementMode === 'quick') {
      applyMovementEntries([nextEntry], 'Movimento livre aplicado.')
      return
    }

    setTimePlanEntries((currentEntries) => [
      ...currentEntries.filter((entry) => entry.partyId !== party.id),
      nextEntry,
    ])
    setMovementNotice(`${party.nome} adicionado ao Plano de Tempo por movimento livre.`)
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

    return Object.values(sourceState.npcs)
      .filter((npc) => !occupiedNpcIds.has(npc.characterId))
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
          body.jogadorControladorId,
      )

      if (occupiedBody) {
        return {
          action: 'paused',
          actionText: 'Corpo ocupado por consciencia de jogador.',
          characterId: npc.characterId,
          fromId: currentLocation.id,
          fromName: currentLocation.nome,
          intention: npc.intencaoAtual,
          motivation: `${character?.nome ?? 'NPC'} esta sendo usado como corpo atual de ${formatLabel(occupiedBody.jogadorControladorId)}. A simulacao autonoma nao move este corpo.`,
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

    pushUndoSnapshot(state)
    commit((currentState) => {
      const nextClock = resolveClockAfterAdvance(currentState.clock, totalHours)
      const nextParties = { ...currentState.parties }
      const nextBodies = { ...currentState.corpos }
      const nextConsciousnesses = { ...currentState.consciencias }
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
        const logText = `${entry.partyName} chegou a ${entry.destinationName} apos ${formatHours(entry.timeHours)}.${encounterText}${hiddenText}${freeTimeText}`
        const technicalText = `Origem: ${entry.originName}. Destino: ${entry.destinationName}. Risco: ${entry.risk}. Rotas: ${entry.routeNames.join(' / ') || 'movimento livre'}. Eventos: ${consequences.events.join(', ') || 'nenhum'}.`

        if (party) {
          nextParties[entry.partyId] = createWorldMundiParty({
            ...party,
            localAtualId: entry.destinationId,
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
        parties: nextParties,
        selectedLocationId: lastEntry.destinationId,
        logs: [...movementLogs, ...currentState.logs],
      }
      const simulationSuggestions =
        totalHours > 0 ? createSimulationSuggestions(totalHours, currentState) : []

      return applySimulationSuggestionsToState(
        stateAfterMovement,
        simulationSuggestions,
        nextClock,
      )
    })
    setTimePlanEntries([])
    setMovementDestinationId('')
    setMovementNotice(`${notice} O mundo avancou ${formatHours(totalHours)}.`)
    setSimulationPreview([])
  }

  function confirmTimePlan() {
    applyMovementEntries(timePlanEntries, 'Plano aplicado.')
  }

  function buildSimulationPreview(hours: number) {
    setSimulationPreview(createSimulationSuggestions(hours))
  }

  function applySimulationPreview() {
    if (simulationPreview.length === 0) {
      return
    }

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
                key={party.id}
                style={
                  {
                    '--party-color': getPartyColor(party.id, activeParties),
                  } as CSSProperties
                }
              >
                <div className="list-card__top">
                  <div>
                    <strong>{party.nome}</strong>
                    <p className="support-copy">{getPartyMemberLabel(party, entityById)}</p>
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
                    <label className="world-mundi__member-option" key={member.id}>
                      <input
                        checked={memberSelection.includes(member.id)}
                        onChange={() => toggleMemberSelection(member.id)}
                        type="checkbox"
                      />
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

  function renderMemberCategory(title: string, members: SelectableWorldMember[]) {
    if (members.length === 0) {
      return null
    }

    return (
      <div className="list-stack">
        <h3>{title}</h3>
        <div className="world-mundi__member-grid">
          {members.map((member) => (
            <label className="world-mundi__member-option" key={member.id}>
              <input
                checked={memberSelection.includes(member.id)}
                onChange={() => toggleMemberSelection(member.id)}
                type="checkbox"
              />
              <span>{member.label}</span>
              <small>{formatLabel(member.kind)}</small>
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

    return (
      <div
        className={`world-mundi__map world-mundi__map--${mode}`}
        aria-label="Mapa logico da ilha"
        onDragOver={(event) => {
          if (draggedPartyId) {
            event.preventDefault()
          }
        }}
        onDrop={(event) => {
          if (!draggedPartyId) {
            return
          }

          event.preventDefault()
          const bounds = event.currentTarget.getBoundingClientRect()
          const x = Math.max(2, Math.min(98, ((event.clientX - bounds.left) / bounds.width) * 100))
          const y = Math.max(2, Math.min(98, ((event.clientY - bounds.top) / bounds.height) * 100))

          movePartyFreely(draggedPartyId, { x, y })
          setDraggedPartyId('')
        }}
      >
        <svg className="world-mundi__routes" viewBox="0 0 100 100" preserveAspectRatio="none">
          {state.routes.map((route) => {
            const origin = state.locations.find((location) => location.id === route.origemId)
            const destination = state.locations.find((location) => location.id === route.destinoId)

            if (!origin || !destination) {
              return null
            }

            return (
              <line
                key={route.id}
                className={`world-mundi__route-line${
                  connectedRouteIds.has(route.id) ? ' world-mundi__route-line--active' : ''
                }${route.bloqueada ? ' world-mundi__route-line--blocked' : ''}${
                  route.secreta ? ' world-mundi__route-line--secret' : ''
                }`}
                x1={origin.posicao.x}
                x2={destination.posicao.x}
                y1={origin.posicao.y}
                y2={destination.posicao.y}
              />
            )
          })}
          {timePlanEntries.map((entry) => {
            const party = state.parties[entry.partyId]
            const origin = party
              ? state.locations.find((location) => location.id === party.localAtualId)
              : null
            const destination =
              entry.newLocation ??
              state.locations.find((location) => location.id === entry.destinationId)

            if (!origin || !destination) {
              return null
            }

            return (
              <line
                className="world-mundi__route-line world-mundi__route-line--planned"
                key={`planned-${entry.partyId}`}
                x1={origin.posicao.x}
                x2={destination.posicao.x}
                y1={origin.posicao.y}
                y2={destination.posicao.y}
              />
            )
          })}
        </svg>

        {partyVisualEntries.map(({ party, plannedEntry, realLocation, visualLocation }) => {
          const stackInfo = stackInfoByPartyId.get(party.id) ?? { index: 0, total: 1 }
          const stackOffset = getStackOffset(stackInfo.index, stackInfo.total)
          const visualTitle = plannedEntry
            ? `${party.nome}: planejado para ${plannedEntry.destinationName}. Local real: ${realLocation.nome}.`
            : `${party.nome}: ${getPartyMemberLabel(party, entityById)}`

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
              onDragStart={() => {
                setDraggedPartyId(party.id)
                selectParty(party.id)
              }}
              style={{
                '--party-color': getPartyColor(party.id, activeParties),
                left: `calc(${visualLocation.posicao.x}% + ${stackOffset.x}px)`,
                top: `calc(${visualLocation.posicao.y}% + ${stackOffset.y}px)`,
              } as CSSProperties}
              title={visualTitle}
              type="button"
            >
              <span>{getPartyShortLabel(party)}</span>
              <small>
                {party.memberPlayerIds.length +
                  party.memberCharacterIds.length +
                  party.memberEntityIds.length}
              </small>
            </button>
          )
        })}

        {visibleLocations.map((location) => {
          const biomeInfo = biomeById.get(location.biomaId)
          const locationNpcs = activeNpcStates.filter(
            (npc) =>
              !occupiedNpcCharacterIds.has(npc.characterId) &&
              npc.localAtualId === location.id &&
              npc.presencaNoMapa !== 'inativo' &&
              npc.presencaNoMapa !== 'selado',
          )
          const biomeColor = BIOME_COLORS[(biomeInfo?.index ?? 0) % BIOME_COLORS.length]
          const isCurrentPartyLocation = selectedPartyLocationId === location.id
          const isConnectedLocation = connectedLocationIds.has(location.id)
          const shouldDim =
            mode === 'master' &&
            Boolean(selectedPartyLocationId) &&
            !isCurrentPartyLocation &&
            !isConnectedLocation &&
            selectedLocation?.id !== location.id

          return (
            <button
              className={`world-mundi__marker${
                selectedLocation?.id === location.id ? ' world-mundi__marker--active' : ''
              }${isConnectedLocation ? ' world-mundi__marker--connected' : ''}${
                shouldDim ? ' world-mundi__marker--dimmed' : ''
              }`}
              data-state={location.estadoVisual}
              key={location.id}
              onDragOver={(event) => {
                if (draggedPartyId) {
                  event.preventDefault()
                }
              }}
              onDrop={(event) => {
                event.stopPropagation()
                event.preventDefault()
                if (draggedPartyId) {
                  queuePartyMovement(draggedPartyId, location.id)
                  setDraggedPartyId('')
                }
              }}
              onClick={() => selectLocation(location.id)}
              style={{
                '--biome-color': biomeColor,
                left: `${location.posicao.x}%`,
                top: `${location.posicao.y}%`,
              } as CSSProperties}
              title={`${location.nome} | ${biomeInfo?.nome ?? 'Bioma'} | risco ${location.riscoAtual}`}
              type="button"
            >
              <span>{getLocationIcon(location)}</span>
              {locationNpcs.length > 0 ? <small>{locationNpcs.length}</small> : null}
              {mode === 'master' ? <strong>{location.nome}</strong> : null}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="world-mundi">
      <div className="world-mundi__top">
        <div>
          <p className="eyebrow">Mapa Mundi</p>
          <h3>Leitura de mestre</h3>
          <p className="support-copy">
            Tabuleiro de mesa: arraste grupos pelo mapa, deixe o relogio andar e leia apenas o
            que importa para narrar.
          </p>
        </div>

        <div className="world-mundi__clock">
          <span>Dia {state.clock.dia}</span>
          <strong>{formatClockTime(state.clock.hora)}</strong>
          <select
            className="field__input"
            onChange={(event) =>
              patchClock({ fase: clampNumber(event.target.value, state.clock.fase) })
            }
            value={state.clock.fase}
          >
            <option value={0}>Fase 0 - Despertar</option>
            <option value={1}>Fase 1 - Primeiros dias</option>
            <option value={2}>Fase 2 - Exploracao aberta</option>
            <option value={3}>Fase 3 - Mundo vivo</option>
            <option value={4}>Fase 4 - Instabilidade</option>
            <option value={5}>Fase 5 - Cataclismo possivel</option>
          </select>
        </div>
      </div>

      <div className="tabletop-hud-panel__actions">
        {(['mestre', 'editor', 'rotas', 'npcs', 'logs'] as WorldMundiTab[]).map((tab) => (
          <button
            className={`button${activeTab === tab ? ' button--primary' : ''}`}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab === 'mestre' ? 'Mestre' : formatLabel(tab)}
          </button>
        ))}
        <button className="button" onClick={() => buildSimulationPreview(1)} type="button">
          Simular 1h
        </button>
        <button className="button" onClick={() => buildSimulationPreview(6)} type="button">
          Simular 6h
        </button>
        <button className="button" onClick={() => buildSimulationPreview(24)} type="button">
          Simular 1 dia
        </button>
        <button className="button" onClick={() => setShowGuide((current) => !current)} type="button">
          Como usar
        </button>
        <button className="button" onClick={() => setShowSettings(true)} type="button">
          Configuracoes / Testes
        </button>
      </div>

      {showGuide ? (
        <article className="list-card">
          <div className="list-card__top">
            <div>
              <p className="eyebrow">Guia rapido</p>
              <h3>Como usar este mapa</h3>
            </div>
            <span className="tag">mesa</span>
          </div>
          <ul className="bullet-list">
            <li>Arraste um grupo para um ponto ou para qualquer area do mapa.</li>
            <li>No Modo rapido, o movimento aplica na hora, o relogio anda e o mundo reage.</li>
            <li>Use Desfazer movimento para voltar quantas vezes precisar durante o teste.</li>
            <li>No Modo planejamento, arraste varios grupos e confirme tudo junto.</li>
            <li>Clique em um local para ver quem esta ali e criar grupos por selecao.</li>
            <li>Logs do Mestre sao curtos; Logs Tecnicos guardam os detalhes da simulacao.</li>
            <li>Use resets e cenarios de teste para preparar a sessao sem medo.</li>
            <li>Reencarnacao separa jogador, consciencia e corpo no Mapa Mundi.</li>
          </ul>
        </article>
      ) : null}

      {showSettings ? (
        <div className="world-mundi__modal-backdrop" role="presentation">
          <article className="world-mundi__modal">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Configuracoes / Testes</p>
                <h3>Ferramentas fora da mesa</h3>
              </div>
              <button className="button" onClick={() => setShowSettings(false)} type="button">
                Fechar
              </button>
            </div>

            {resetTarget ? (
              <div className="world-mundi__preview-card">
                <strong>
                  {resetTarget === 'campaign' ? 'Resetar campanha' : 'Resetar relogio'}
                </strong>
                <p className="support-copy">Digite RESET para confirmar.</p>
                <input
                  className="field__input"
                  onChange={(event) =>
                    resetTarget === 'campaign'
                      ? setResetCampaignText(event.target.value)
                      : setResetClockText(event.target.value)
                  }
                  placeholder="RESET"
                  value={resetTarget === 'campaign' ? resetCampaignText : resetClockText}
                />
                <div className="tabletop-hud-panel__actions">
                  <button
                    className="button button--primary"
                    onClick={resetTarget === 'campaign' ? resetCampaign : resetClock}
                    type="button"
                  >
                    Confirmar
                  </button>
                  <button
                    className="button"
                    onClick={() => {
                      setResetTarget(null)
                      setResetCampaignText('')
                      setResetClockText('')
                    }}
                    type="button"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="tabletop-hud-panel__actions">
                <button className="button" onClick={() => setResetTarget('clock')} type="button">
                  Resetar relogio
                </button>
                <button className="button" onClick={() => setResetTarget('campaign')} type="button">
                  Resetar campanha
                </button>
                <button className="button" onClick={ensureAllLocationMaps} type="button">
                  Gerar placeholders MAP
                </button>
              </div>
            )}

            <div className="list-stack">
              <h3>Cenarios de teste</h3>
              <div className="tag-row">
                <button className="button" onClick={() => applyTestScenario('inicio')} type="button">
                  Cenario: Inicio da campanha
                </button>
                <button className="button" onClick={() => applyTestScenario('separacao')} type="button">
                  Cenario: Separacao dos players
                </button>
                <button className="button" onClick={() => applyTestScenario('npc_contexto')} type="button">
                  Cenario: NPC acompanhando players
                </button>
                <button className="button" onClick={() => applyTestScenario('npc_simulacao')} type="button">
                  Cenario: Simulacao de NPCs
                </button>
                <button className="button" onClick={() => applyTestScenario('rota_perigosa')} type="button">
                  Cenario: Rota perigosa
                </button>
                <button className="button" onClick={() => applyTestScenario('local_oculto')} type="button">
                  Cenario: Local oculto
                </button>
              </div>
            </div>
          </article>
        </div>
      ) : null}

      {activeTab === 'mestre' ? (
        <div className="world-mundi__layout">
          <div className="list-stack">
            <div className="world-mundi__map-controls" aria-label="Controle do mapa">
              <div className="segmented-control">
                <button
                  className={`segmented-control__option${
                    movementMode === 'quick' ? ' segmented-control__option--active' : ''
                  }`}
                  onClick={() => setMovementMode('quick')}
                  type="button"
                >
                  Modo rapido
                </button>
                <button
                  className={`segmented-control__option${
                    movementMode === 'planning' ? ' segmented-control__option--active' : ''
                  }`}
                  onClick={() => setMovementMode('planning')}
                  type="button"
                >
                  Modo planejamento
                </button>
              </div>
              <span className="tag">{selectedParty?.nome ?? 'sem grupo'}</span>
              <div className="tabletop-hud-panel__actions">
                {undoStack.length > 0 ? (
                  <button className="button" onClick={undoLastMovement} type="button">
                    Desfazer ({undoStack.length})
                  </button>
                ) : (
                  <button className="button" disabled type="button">
                    Desfazer
                  </button>
                )}
                {timePlanEntries.length > 0 ? (
                  <>
                    <button className="button button--primary" onClick={confirmTimePlan} type="button">
                      Confirmar plano ({formatHours(totalPlannedHours)})
                    </button>
                    <button className="button" onClick={cancelTimePlan} type="button">
                      Cancelar plano
                    </button>
                  </>
                ) : null}
              </div>
              {movementNotice ? <p className="support-copy">{movementNotice}</p> : null}
            </div>
            {renderWorldMap('master')}
            <article className="list-card world-mundi__legend">
              <div className="tag-row">
                <span className="tag">B Base</span>
                <span className="tag">D Dungeon</span>
                <span className="tag">L Condicional</span>
                <span className="tag">C Descanso</span>
                <span className="tag">R Recurso</span>
                <span className="tag">V Vila</span>
                <span className="tag">GP Grupo Principal</span>
              </div>
            </article>
            {renderActiveGroups()}
          </div>

          <div className="list-stack">
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
                  <h3>{selectedParty?.nome ?? 'Nenhum grupo selecionado'}</h3>
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

      {activeTab === 'editor' ? (
        <div className="world-mundi__layout">
          {renderWorldMap('editor')}
          <LocationEditor
            biomes={state.biomes}
            location={selectedLocation}
            mapPreviewById={mapPreviewById}
            onCreateLocation={createLocation}
            onCreateRoute={createRoute}
            onPatchLocation={patchLocation}
          />
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
          npcs={activeNpcStates}
          onAddNpc={addNpcToWorld}
          onNpcToAddChange={setNpcToAddId}
          onPatchNpc={patchNpc}
          onRemoveNpc={removeNpcFromWorld}
          renderLocationSelect={renderLocationSelect}
        />
      ) : null}

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
              <button className="button" onClick={() => advanceClock(1)} type="button">
                +1h sem simular
              </button>
              <button className="button" onClick={() => advanceClock(6)} type="button">
                +6h sem simular
              </button>
              <button className="button" onClick={() => advanceClock(24)} type="button">
                +1 dia sem simular
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
    location.previewImageUrl || location.imagemLocalUrl || mapPreviewImage
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
          src={locationPreviewImage}
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

            return (
              <div className="world-mundi__preview-card" key={npc.characterId}>
                <strong>{character?.nome ?? npc.characterId}</strong>
                <p className="support-copy">Intencao: {formatLabel(npc.intencaoAtual)}</p>
                <p className="support-copy">
                  Motivo: {npc.contextoNarrativo || npc.ultimoLog || npc.objetivoAtual || 'Ainda sem nota narrativa.'}
                </p>
                <p className="support-copy">
                  Proxima tendencia: {npc.tendencias[0] ?? 'Reagir ao local e ao objetivo atual.'}
                </p>
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
    (location.usarImagemDoMapaLocal ? linkedMapPreview : '')

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
            src={effectivePreviewImage}
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
                step={0.5}
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
                step={0.5}
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
  npcs: WorldMundiNpcState[]
  onAddNpc: () => void
  onNpcToAddChange: (characterId: string) => void
  onPatchNpc: (characterId: string, partialNpc: Partial<WorldMundiNpcState>) => void
  onRemoveNpc: (characterId: string) => void
  renderLocationSelect: (
    value: string,
    onSelect: (nextLocationId: string) => void,
  ) => JSX.Element
}

function NpcWorldEditor({
  availableCharacters,
  characterById,
  npcToAddId,
  npcs,
  onAddNpc,
  onNpcToAddChange,
  onPatchNpc,
  onRemoveNpc,
  renderLocationSelect,
}: NpcWorldEditorProps) {
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
          Para os 40 NPCs, o ideal continua sendo importar/injetar dados estruturados. Esta tela fica para ajustes pontuais.
        </p>
        <div className="tabletop-hud-panel__actions">
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

        return (
          <article className="list-card" key={npc.characterId}>
            <div className="list-card__top">
              <div>
                <p className="eyebrow">NPC</p>
                <h3>{character?.nome ?? npc.characterId}</h3>
              </div>
              <span className="tag">{formatLabel(npc.estadoSimulacao)}</span>
            </div>

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
                  onPatchNpc(npc.characterId, { localAtualId: locationId }),
                )}
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
