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

  if (token.visibility === 'public' || token.visibleInPlayerView === true) {
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

          return {
            ...cloneValue(scene),
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
    isGridVisible: session.isGridVisible === true,
    logEntries: Array.isArray(session.logEntries)
      ? session.logEntries.filter(
          (entry) => isRecord(entry) && entry.visibility === 'public',
        )
      : [],
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
    mapOverrides,
  }
}

function sanitizeWorldForPlayer(mundiState: unknown) {
  if (!isRecord(mundiState)) {
    return null
  }

  return {
    clock: cloneValue(mundiState.clock ?? null),
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
    world: sanitizeWorldForPlayer(state.mundiState),
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
