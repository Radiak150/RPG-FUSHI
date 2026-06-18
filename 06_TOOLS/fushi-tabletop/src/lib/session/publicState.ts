export interface CampaignStateSnapshot {
  campaignId: string
  campaignSession?: unknown
  libraryState?: unknown
  mundiState?: unknown
  playerAccess?: unknown
  physicalPersistence?: unknown
  metadata?: unknown
}

export interface PublicPlayerState {
  campaignId: string
  metadata?: unknown
  playerId: string
  playerCurrentMapId: string
  tabletopSession: unknown
  libraryState: unknown
  world: unknown
  playerAccess: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function tokenIsVisibleForPlayer(token: unknown, playerId: string) {
  if (!isRecord(token)) {
    return false
  }

  const isControlledByPlayer = tokenCanBeControlledByPlayer(token, playerId)
  const stealth = isRecord(token.stealth) ? token.stealth : null

  if (stealth?.enabled === true) {
    return isControlledByPlayer || stealth.ownerPlayerId === playerId
  }

  if (token.visibility === 'public' || token.visibleInPlayerView === true) {
    return true
  }

  return isControlledByPlayer
}

function tokenCanBeControlledByPlayer(token: Record<string, unknown>, playerId: string) {
  if (token.controladoPorJogadorId === playerId) {
    return true
  }

  const persistentControl = isRecord(token.persistentControl)
    ? token.persistentControl
    : null

  if (persistentControl?.playerId === playerId) {
    return true
  }

  const control = isRecord(token.control) ? token.control : null
  const controlledByPlayerIds = Array.isArray(control?.controlledByPlayerIds)
    ? control.controlledByPlayerIds
    : []

  return (
    control?.primaryControllerId === playerId ||
    controlledByPlayerIds.some((id) => id === playerId)
  )
}

function sanitizeTurnStateForPlayer(
  turnState: unknown,
  session: Record<string, unknown>,
  playerId: string,
) {
  if (!isRecord(turnState) || turnState.isActive !== true || !Array.isArray(turnState.participants)) {
    return null
  }

  const allTokens = new Map<string, unknown>()

  if (Array.isArray(session.tokens)) {
    session.tokens.forEach((token) => {
      if (isRecord(token) && typeof token.id === 'string') {
        allTokens.set(token.id, token)
      }
    })
  }

  if (Array.isArray(session.scenes)) {
    session.scenes.forEach((scene) => {
      if (!isRecord(scene) || !Array.isArray(scene.tokens)) {
        return
      }

      scene.tokens.forEach((token) => {
        if (isRecord(token) && typeof token.id === 'string') {
          allTokens.set(token.id, token)
        }
      })
    })
  }

  const visibleParticipants = turnState.participants.filter((participant) => {
    if (!isRecord(participant) || typeof participant.tokenId !== 'string') {
      return false
    }

    const token = allTokens.get(participant.tokenId)

    return token ? tokenIsVisibleForPlayer(token, playerId) : false
  })
  const visibleParticipantIds = new Set(
    visibleParticipants
      .filter((participant) => isRecord(participant) && typeof participant.id === 'string')
      .map((participant) => (participant as { id: string }).id),
  )
  const usedActions = isRecord(turnState.usedActions)
    ? Object.fromEntries(
        Object.entries(turnState.usedActions).filter(([participantId]) =>
          visibleParticipantIds.has(participantId),
        ),
      )
    : {}

  return {
    ...cloneValue(turnState),
    activeParticipantId:
      typeof turnState.activeParticipantId === 'string' &&
      visibleParticipantIds.has(turnState.activeParticipantId)
        ? turnState.activeParticipantId
        : '',
    participants: cloneValue(visibleParticipants),
    usedActions,
  }
}

function objectIsVisibleForPlayer(object: unknown) {
  return isRecord(object) && object.visibility === 'public'
}

function sanitizeMeasurementForPlayer(session: Record<string, unknown>, currentSceneId: string) {
  const measurement = isRecord(session.activeMeasurement) ? session.activeMeasurement : null

  if (
    !measurement ||
    measurement.sceneId !== currentSceneId ||
    !isRecord(measurement.start) ||
    !isRecord(measurement.end)
  ) {
    return null
  }

  return cloneValue(measurement)
}

function sanitizeSessionForPlayer(session: unknown, playerId: string) {
  if (!isRecord(session)) {
    return null
  }

  const currentSceneId =
    typeof session.currentSceneId === 'string' ? session.currentSceneId : ''
  const scenes = Array.isArray(session.scenes)
    ? session.scenes
        .filter((scene) => isRecord(scene) && scene.id === currentSceneId)
        .map((scene) => {
          const tokens = Array.isArray(scene.tokens)
            ? scene.tokens.filter((token: unknown) =>
                tokenIsVisibleForPlayer(token, playerId),
              )
            : []
          const objects = Array.isArray(scene.objects)
            ? scene.objects.filter(objectIsVisibleForPlayer)
            : []

          return {
            ...cloneValue(scene),
            objects,
            tokens,
          }
        })
    : []

  return {
    currentSceneId,
    initialSceneId:
      typeof session.initialSceneId === 'string' ? session.initialSceneId : '',
    scenes,
    tokens: Array.isArray(session.tokens)
      ? session.tokens.filter((token) => tokenIsVisibleForPlayer(token, playerId))
      : null,
    gmCameraControlEnabled: session.gmCameraControlEnabled === true,
    isGridVisible: session.isGridVisible === true,
    zoom: typeof session.zoom === 'number' ? session.zoom : undefined,
    activeMeasurement: sanitizeMeasurementForPlayer(session, currentSceneId),
    logEntries: Array.isArray(session.logEntries)
      ? session.logEntries.filter(
          (entry) => isRecord(entry) && entry.visibility === 'public',
        )
      : [],
    audioMixerState: isRecord(session.audioMixerState)
      ? cloneValue(session.audioMixerState)
      : { tracks: {}, updatedAt: Date.now() },
    turnState: sanitizeTurnStateForPlayer(session.turnState, session, playerId),
  }
}

function sanitizeLibraryForPlayer(libraryState: unknown) {
  if (!isRecord(libraryState)) {
    return null
  }

  const customMaps = Array.isArray(libraryState.customMaps)
    ? libraryState.customMaps.filter(
        (map) =>
          isRecord(map) &&
          map.mapVisibility !== 'mestre_apenas' &&
          map.mapVisibility !== 'preparado',
      )
    : []
  const mapOverrides = isRecord(libraryState.mapOverrides)
    ? Object.fromEntries(
        Object.entries(libraryState.mapOverrides).filter(([, override]) => {
          if (!isRecord(override)) {
            return false
          }

          return (
            override.mapVisibility !== 'mestre_apenas' &&
            override.mapVisibility !== 'preparado'
          )
        }),
      )
    : {}

  return {
    version: libraryState.version,
    customMaps,
    customAmbienceTracks: Array.isArray(libraryState.customAmbienceTracks)
      ? cloneValue(libraryState.customAmbienceTracks)
      : [],
    customMusicTracks: Array.isArray(libraryState.customMusicTracks)
      ? cloneValue(libraryState.customMusicTracks)
      : [],
    customTransitions: Array.isArray(libraryState.customTransitions)
      ? cloneValue(libraryState.customTransitions)
      : [],
    mapOverrides,
    trackVolumes: isRecord(libraryState.trackVolumes)
      ? cloneValue(libraryState.trackVolumes)
      : {},
  }
}

export interface PublicMundiLocation {
  biomaId: string
  biomaNome: string
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

export interface PublicMundiState {
  clock: unknown
  currentLocationIds: string[]
  publicBase: {
    anchorLocationId: string
    bases: Array<{
      biomaId: string
      buffBioma: string
      buffMundo: string
      id: string
      locationId: string
      nome: string
      resumo: string
      selectedUpgradeId: string
      upgrades: Array<{
        categoria: string
        dependsOnIds: string[]
        efeitoMesa: string
        id: string
        nome: string
        resumo: string
        status: string
        x: number
        y: number
      }>
    }>
    releasedToPlayers: boolean
    selectedBaseId: string
    upgrades: Array<{
      categoria: string
      dependsOnIds: string[]
      efeitoMesa: string
      id: string
      nome: string
      resumo: string
      status: string
      x: number
      y: number
    }>
  }
  publicLocations: PublicMundiLocation[]
  publicMap: {
    discoveredLocationIds: string[]
    releasedToPlayers: boolean
  }
  selectedPartyId: string
}

function sanitizeNumber(value: unknown, fallback = 50) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function buildPublicMundiState(
  mundiState: unknown,
  playerId = '',
): PublicMundiState | null {
  if (!isRecord(mundiState)) {
    return null
  }

  const publicMap = isRecord(mundiState.publicMap) ? mundiState.publicMap : {}
  const releasedToPlayers = publicMap.releasedToPlayers === true
  const playerBase = isRecord(mundiState.playerBase) ? mundiState.playerBase : {}
  const baseReleasedToPlayers = playerBase.releasedToPlayers === true
  const baseUpgrades = Array.isArray(playerBase.upgrades)
    ? playerBase.upgrades.filter(isRecord)
    : []
  const baseStates = Array.isArray(playerBase.bases)
    ? playerBase.bases.filter(isRecord)
    : []
  const discoveredLocationIds = Array.isArray(publicMap.discoveredLocationIds)
    ? publicMap.discoveredLocationIds.filter((id): id is string => typeof id === 'string')
    : []
  const biomes = Array.isArray(mundiState.biomes)
    ? mundiState.biomes.filter(isRecord)
    : []
  const biomeNameById = new Map(
    biomes.map((biome) => [
      typeof biome.id === 'string' ? biome.id : '',
      typeof biome.nome === 'string' ? biome.nome : '',
    ]),
  )
  const locations = Array.isArray(mundiState.locations)
    ? mundiState.locations.filter(isRecord)
    : []
  const parties = isRecord(mundiState.parties)
    ? Object.values(mundiState.parties).filter(isRecord)
    : []
  const npcStates = Array.isArray(mundiState.npcStates)
    ? mundiState.npcStates.filter(isRecord)
    : []
  const characterNameById = new Map<string, string>()
  if (Array.isArray(mundiState.characters)) {
    mundiState.characters.filter(isRecord).forEach((character) => {
      if (typeof character.id === 'string' && typeof character.nome === 'string') {
        characterNameById.set(character.id, character.nome)
      }
    })
  }
  const playerLocationIds = playerId
    ? parties
        .filter((party) => {
          const members = Array.isArray(party.memberPlayerIds) ? party.memberPlayerIds : []

          return members.includes(playerId)
        })
        .map((party) => (typeof party.localAtualId === 'string' ? party.localAtualId : ''))
        .filter(Boolean)
    : []
  const visibleLocationIds = new Set([...discoveredLocationIds, ...playerLocationIds])
  const publicLocations = releasedToPlayers
    ? locations
        .filter((location) => {
          const locationId = typeof location.id === 'string' ? location.id : ''

          return Boolean(locationId) && visibleLocationIds.has(locationId)
        })
        .map((location) => {
          const posicao = isRecord(location.posicao) ? location.posicao : {}
          const biomaId = typeof location.biomaId === 'string' ? location.biomaId : ''
          const locationId = typeof location.id === 'string' ? location.id : ''
          const presenceNames = [
            ...parties
              .filter((party) => party.localAtualId === locationId)
              .map((party) => (typeof party.nome === 'string' ? party.nome : 'Grupo')),
            ...npcStates
              .filter(
                (npc) =>
                  npc.localAtualId === locationId &&
                  npc.presencaNoMapa !== 'inativo' &&
                  npc.presencaNoMapa !== 'selado',
              )
              .map((npc) =>
                typeof npc.characterId === 'string'
                  ? characterNameById.get(npc.characterId) ?? npc.characterId
                  : 'NPC',
              ),
          ]

          return {
            biomaId,
            biomaNome: biomeNameById.get(biomaId) ?? '',
            id: locationId,
            image:
              typeof location.previewImageUrl === 'string'
                ? location.previewImageUrl
                : undefined,
            nome: typeof location.nome === 'string' ? location.nome : '',
            presenceCount: presenceNames.length,
            presenceNames: presenceNames.slice(0, 4),
            posicao: {
              x: sanitizeNumber(posicao.x),
              y: sanitizeNumber(posicao.y),
            },
          }
        })
    : []

  return {
    clock: cloneValue(mundiState.clock ?? null),
    currentLocationIds: Array.from(new Set(playerLocationIds)),
    publicBase: {
      anchorLocationId:
        typeof playerBase.anchorLocationId === 'string'
          ? playerBase.anchorLocationId
          : 'caverna_primeiro_corpo',
      bases: baseReleasedToPlayers
        ? baseStates.map((base) => ({
            biomaId: typeof base.biomaId === 'string' ? base.biomaId : '',
            buffBioma: typeof base.buffBioma === 'string' ? base.buffBioma : '',
            buffMundo: typeof base.buffMundo === 'string' ? base.buffMundo : '',
            id: typeof base.id === 'string' ? base.id : '',
            locationId: typeof base.locationId === 'string' ? base.locationId : '',
            nome: typeof base.nome === 'string' ? base.nome : '',
            resumo: typeof base.resumo === 'string' ? base.resumo : '',
            selectedUpgradeId:
              typeof base.selectedUpgradeId === 'string' ? base.selectedUpgradeId : '',
            upgrades: Array.isArray(base.upgrades)
              ? base.upgrades
                  .filter(isRecord)
                  .filter((upgrade) => upgrade.status === 'ativo')
                  .map((upgrade) => ({
                    bonus: typeof upgrade.bonus === 'string' ? upgrade.bonus : '',
                    categoria: typeof upgrade.categoria === 'string' ? upgrade.categoria : '',
                    dependsOnIds: Array.isArray(upgrade.dependsOnIds)
                      ? upgrade.dependsOnIds.filter((id): id is string => typeof id === 'string')
                      : [],
                    efeitoMesa: typeof upgrade.efeitoMesa === 'string' ? upgrade.efeitoMesa : '',
                    id: typeof upgrade.id === 'string' ? upgrade.id : '',
                    nome: typeof upgrade.nome === 'string' ? upgrade.nome : '',
                    resumo: typeof upgrade.resumo === 'string' ? upgrade.resumo : '',
                    status: 'ativo',
                    x: sanitizeNumber(upgrade.x),
                    y: sanitizeNumber(upgrade.y),
                  }))
              : [],
          }))
        : [],
      releasedToPlayers: baseReleasedToPlayers,
      selectedBaseId:
        typeof playerBase.selectedBaseId === 'string' ? playerBase.selectedBaseId : '',
      upgrades: baseReleasedToPlayers
        ? baseUpgrades
            .filter((upgrade) => upgrade.status === 'ativo')
            .map((upgrade) => ({
              bonus: typeof upgrade.bonus === 'string' ? upgrade.bonus : '',
              categoria: typeof upgrade.categoria === 'string' ? upgrade.categoria : '',
              dependsOnIds: Array.isArray(upgrade.dependsOnIds)
                ? upgrade.dependsOnIds.filter((id): id is string => typeof id === 'string')
                : [],
              efeitoMesa: typeof upgrade.efeitoMesa === 'string' ? upgrade.efeitoMesa : '',
              id: typeof upgrade.id === 'string' ? upgrade.id : '',
              nome: typeof upgrade.nome === 'string' ? upgrade.nome : '',
              resumo: typeof upgrade.resumo === 'string' ? upgrade.resumo : '',
              status: 'ativo',
              x: sanitizeNumber(upgrade.x),
              y: sanitizeNumber(upgrade.y),
            }))
        : [],
    },
    publicLocations,
    publicMap: {
      discoveredLocationIds,
      releasedToPlayers,
    },
    selectedPartyId:
      typeof mundiState.selectedPartyId === 'string' ? mundiState.selectedPartyId : '',
  }
}

function sanitizeAccessForPlayer(playerAccess: unknown, playerId: string) {
  if (!isRecord(playerAccess)) {
    return null
  }

  const state = isRecord(playerAccess.state) ? playerAccess.state : playerAccess
  const profiles = Array.isArray(state.profiles) ? state.profiles : []
  const ownProfile = profiles.find(
    (profile) => isRecord(profile) && profile.id === playerId,
  )

  if (!isRecord(ownProfile)) {
    return null
  }

  return {
    activeProfileId: playerId,
    profile: {
      id: ownProfile.id,
      label: ownProfile.label,
      role: ownProfile.role,
      characterId: ownProfile.characterId,
    },
  }
}

export function sanitizeStateForPlayer(
  state: CampaignStateSnapshot,
  playerId: string,
): PublicPlayerState {
  const tabletopSession = sanitizeSessionForPlayer(state.campaignSession, playerId)
  const playerCurrentMapId =
    isRecord(tabletopSession) && typeof tabletopSession.currentSceneId === 'string'
      ? tabletopSession.currentSceneId
      : ''

  return {
    campaignId: state.campaignId,
    metadata: state.metadata,
    playerId,
    playerCurrentMapId,
    tabletopSession,
    libraryState: sanitizeLibraryForPlayer(state.libraryState),
    world: buildPublicMundiState(state.mundiState, playerId),
    playerAccess: sanitizeAccessForPlayer(state.playerAccess, playerId),
  }
}

export function buildPublicPlayerState(
  campaignState: CampaignStateSnapshot,
  playerId: string,
) {
  return sanitizeStateForPlayer(campaignState, playerId)
}

export function buildMasterState(campaignState: CampaignStateSnapshot) {
  return cloneValue(campaignState)
}
