const crypto = require('node:crypto')
const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const {
  loadJson,
  saveJson,
  sendRuntimeAssetHttpResponse,
  sendStoredAssetHttpResponse,
} = require('./storage.cjs')

const SERVER_VERSION = 'multiplayer-v2'
const PROTOCOL_VERSION = 2
const SERVER_ROOT =
  process.env.FUSHI_SERVER_ROOT || path.resolve('C:/RPG FUSHI/SERVIDOR-FUSHI')
const PLAYER_IDS = new Set(['player1', 'player2', 'player3', 'player4', 'player5'])
const ACCESS_PROFILE_IDS = new Set(['gm', 'player1', 'player2', 'player3', 'player4', 'player5'])
const DEFAULT_ACCESS_PROFILES = [
  {
    characterId: '',
    id: 'gm',
    label: 'Mestre',
    password: 'mestre1',
    role: 'gm',
  },
  {
    characterId: 'fragmento-p01',
    id: 'player1',
    label: 'Jogador 1',
    password: '111',
    role: 'player',
  },
  {
    characterId: 'fragmento-p02',
    id: 'player2',
    label: 'Jogador 2',
    password: '222',
    role: 'player',
  },
  {
    characterId: '',
    id: 'player3',
    label: 'Jogador 3',
    password: '333',
    role: 'player',
  },
  {
    characterId: '',
    id: 'player4',
    label: 'Jogador 4',
    password: '444',
    role: 'player',
  },
  {
    characterId: '',
    id: 'player5',
    label: 'Jogador 5',
    password: '555',
    role: 'player',
  },
]
const SESSION_STATE_NAMES = new Set([
  'session',
  'library',
  'mundi',
  'access',
  'workspace',
  'transitionOverrides',
  'transitionPlayback',
])
const BROADCAST_DEBOUNCE_MS = 66
const HEARTBEAT_INTERVAL_MS = 20000
const HEARTBEAT_STALE_MS = 120000
const REMOTE_DICE_ROLL_COOLDOWN_MS = 16000
const REMOTE_DICE_ROLL_BURST_WINDOW_MS = 8000
const REMOTE_DICE_ROLL_MAX_BURST = 7
const REMOTE_ACTION_REPLAY_TTL_MS = 5 * 60 * 1000
const REMOTE_ACTION_TYPES = new Set([
  'add-log-entry',
  'move-token',
  'update-character',
  'update-measurement',
])
const FREQUENT_LOG_EVENTS = new Set([
  'http:state-send',
])
const VERBOSE_LOG_EVENTS = new Set([
  'asset:campaign-request',
  'asset:library-request',
  'client:message',
  'http:health',
  'state:broadcast',
  'state:public-send',
  'state:session-info-send',
  'storage:changed-campaign',
  'storage:changed-workspace',
])

function ensureServerWorkspace() {
  fs.mkdirSync(path.join(SERVER_ROOT, 'logs'), { recursive: true })
  fs.mkdirSync(path.join(SERVER_ROOT, 'tunnels'), { recursive: true })
  fs.mkdirSync(path.join(SERVER_ROOT, 'tutoriais'), { recursive: true })
}

function getLogDate() {
  return new Date().toISOString().slice(0, 10)
}

function compactDetails(details) {
  if (!details || typeof details !== 'object') {
    return {}
  }

  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  )
}

function writeOnlineLog(event, details = {}) {
  if (
    (VERBOSE_LOG_EVENTS.has(event) || FREQUENT_LOG_EVENTS.has(event)) &&
    process.env.FUSHI_ONLINE_VERBOSE !== '1'
  ) {
    return
  }

  try {
    ensureServerWorkspace()

    const timestamp = new Date().toISOString()
    const payload = {
      timestamp,
      event,
      ...compactDetails(details),
    }
    const date = getLogDate()
    const jsonlPath = path.join(SERVER_ROOT, 'logs', `${date}-fushi-online.jsonl`)
    const textPath = path.join(SERVER_ROOT, 'logs', `${date}-fushi-online.log`)
    const detailText = JSON.stringify(compactDetails(details))

    fs.appendFileSync(jsonlPath, `${JSON.stringify(payload)}\n`, 'utf8')
    fs.appendFileSync(textPath, `[${timestamp}] ${event} ${detailText}\n`, 'utf8')
    if (process.env.FUSHI_ONLINE_CONSOLE === '1') {
      console.log(`[FUSHI ONLINE] ${event} ${detailText}`)
    }
  } catch (_error) {
    // Logging must never break a live table.
  }
}

function readLastOnlineLogLine() {
  try {
    const textPath = path.join(SERVER_ROOT, 'logs', `${getLogDate()}-fushi-online.log`)
    const rawText = fs.readFileSync(textPath, 'utf8')
    const lines = rawText.split(/\r?\n/).filter(Boolean)

    return lines[lines.length - 1] ?? 'Nenhum log registrado ainda.'
  } catch (_error) {
    return 'Nenhum log registrado ainda.'
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value))
}

function createSessionCode() {
  return crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase()
}

function getLocalIpAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((entry) => entry && entry.family === 'IPv4' && !entry.internal)
    .map((entry) => entry.address)
}

function tokenIsVisibleForPlayer(token, playerId) {
  if (!isRecord(token)) {
    return false
  }

  const canControlToken = tokenCanBeControlledByPlayer(token, playerId)
  const stealth = isRecord(token.stealth) ? token.stealth : null

  if (stealth?.enabled === true) {
    return canControlToken || stealth.ownerPlayerId === playerId
  }

  if (token.visibility === 'public' || token.visibleInPlayerView === true) {
    return true
  }

  return canControlToken
}

function tokenCanBeControlledByPlayer(token, playerId) {
  if (!isRecord(token) || !PLAYER_IDS.has(playerId)) {
    return false
  }

  if (token.controladoPorJogadorId === playerId) {
    return true
  }

  const persistentControl = isRecord(token.persistentControl)
    ? token.persistentControl
    : null

  if (persistentControl && persistentControl.playerId === playerId) {
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

function tokenCanBeMovedByPlayer(_token, _playerId) {
  return false
}

function getBodyControllerIds(body) {
  if (!isRecord(body)) {
    return []
  }

  return Array.from(
    new Set([
      typeof body.jogadorControladorId === 'string' ? body.jogadorControladorId : '',
      ...(Array.isArray(body.jogadoresControladoresIds)
        ? body.jogadoresControladoresIds.filter((id) => typeof id === 'string')
        : []),
    ]),
  ).filter((id) => PLAYER_IDS.has(id))
}

function getPlayerShortLabel(playerId) {
  const match = /^player([1-5])$/.exec(typeof playerId === 'string' ? playerId : '')

  return match ? `J${match[1]}` : 'J'
}

function isValidMeasurementCell(value) {
  return (
    isRecord(value) &&
    Number.isInteger(value.column) &&
    Number.isInteger(value.row) &&
    value.column >= 0 &&
    value.row >= 0
  )
}

function sanitizeMeasurementColor(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : '#d8a34d'
}

function sanitizeMeasurementForPlayer(session, currentSceneId) {
  const measurement = isRecord(session?.activeMeasurement) ? session.activeMeasurement : null

  if (
    !measurement ||
    measurement.sceneId !== currentSceneId ||
    !isValidMeasurementCell(measurement.start) ||
    !isValidMeasurementCell(measurement.end)
  ) {
    return null
  }

  return cloneValue(measurement)
}

function sanitizeTurnStateForPlayer(turnState, session, playerId) {
  if (!isRecord(turnState) || turnState.isActive !== true || !Array.isArray(turnState.participants)) {
    return null
  }

  const allTokens = new Map()

  if (Array.isArray(session?.tokens)) {
    session.tokens.forEach((token) => {
      if (isRecord(token) && typeof token.id === 'string') {
        allTokens.set(token.id, token)
      }
    })
  }

  if (Array.isArray(session?.scenes)) {
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
      .map((participant) => participant.id),
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

function sanitizeSessionForPlayer(session, playerId) {
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
            ? scene.tokens.filter((token) => tokenIsVisibleForPlayer(token, playerId))
            : []

          return {
            ...cloneValue(scene),
            tokens,
          }
        })
    : []
  const currentScene = scenes[0] ?? null

  return {
    currentSceneId,
    initialSceneId:
      typeof session.initialSceneId === 'string' ? session.initialSceneId : '',
    isGridVisible: session.isGridVisible === true,
    logEntries: Array.isArray(session.logEntries)
      ? session.logEntries.filter((entry) => isRecord(entry) && entry.visibility === 'public')
      : [],
    audioMixerState: isRecord(session.audioMixerState)
      ? cloneValue(session.audioMixerState)
      : { tracks: {}, updatedAt: Date.now() },
    broadcastEvents: Array.isArray(session.broadcastEvents)
      ? cloneValue(session.broadcastEvents).slice(-40)
      : [],
    scenes,
    selectedTokenId: '',
    selectedTokenIds: [],
    tokens: currentScene ? currentScene.tokens : [],
    gmCameraControlEnabled: session.gmCameraControlEnabled === true,
    zoom: typeof session.zoom === 'number' ? session.zoom : undefined,
    activeMeasurement: sanitizeMeasurementForPlayer(session, currentSceneId),
    turnState: sanitizeTurnStateForPlayer(session.turnState, session, playerId),
    version: session.version ?? 1,
  }
}

function getActiveScene(session) {
  if (!isRecord(session)) {
    return null
  }

  const currentSceneId =
    typeof session.currentSceneId === 'string' ? session.currentSceneId : ''
  const scenes = Array.isArray(session.scenes) ? session.scenes : []

  return scenes.find((scene) => isRecord(scene) && scene.id === currentSceneId) ?? null
}

function getActiveMapId(session) {
  const activeScene = getActiveScene(session)

  return typeof activeScene?.mapId === 'string' ? activeScene.mapId : ''
}

function sanitizeLibraryForPlayer(libraryState, activeMapId = '') {
  if (!isRecord(libraryState)) {
    return null
  }

  const mapOverrides = isRecord(libraryState.mapOverrides)
    ? libraryState.mapOverrides
    : {}
  const customMaps = Array.isArray(libraryState.customMaps)
    ? libraryState.customMaps
        .map((map) => {
          if (!isRecord(map)) {
            return null
          }

          return {
            ...cloneValue(map),
            ...(isRecord(mapOverrides[map.id]) ? cloneValue(mapOverrides[map.id]) : {}),
          }
        })
        .filter(
          (map) =>
            isRecord(map) &&
            (map.id === activeMapId ||
              (map.mapVisibility !== 'mestre_apenas' &&
                map.mapVisibility !== 'preparado')),
        )
    : []
  const publicMapOverrides = isRecord(libraryState.mapOverrides)
    ? Object.fromEntries(
        Object.entries(libraryState.mapOverrides).filter(([mapId, override]) => {
          if (!isRecord(override)) {
            return false
          }

          return (
            mapId === activeMapId ||
            (override.mapVisibility !== 'mestre_apenas' &&
              override.mapVisibility !== 'preparado')
          )
        }),
      )
    : {}

  return {
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
    mapOverrides: publicMapOverrides,
    trackVolumes: isRecord(libraryState.trackVolumes)
      ? cloneValue(libraryState.trackVolumes)
      : {},
    version: libraryState.version ?? 1,
  }
}

function sanitizeNumber(value, fallback = 50) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function getMundiNpcStates(mundiState) {
  if (Array.isArray(mundiState?.npcStates)) {
    return mundiState.npcStates.filter(isRecord)
  }

  if (isRecord(mundiState?.npcs)) {
    return Object.values(mundiState.npcs).filter(isRecord)
  }

  return []
}

function sanitizePublicBaseUpgrade(upgrade) {
  return {
    bonus: typeof upgrade.bonus === 'string' ? upgrade.bonus : '',
    categoria: typeof upgrade.categoria === 'string' ? upgrade.categoria : '',
    dependsOnIds: Array.isArray(upgrade.dependsOnIds)
      ? upgrade.dependsOnIds.filter((id) => typeof id === 'string')
      : [],
    efeitoMesa: typeof upgrade.efeitoMesa === 'string' ? upgrade.efeitoMesa : '',
    id: typeof upgrade.id === 'string' ? upgrade.id : '',
    nome: typeof upgrade.nome === 'string' ? upgrade.nome : '',
    resumo: typeof upgrade.resumo === 'string' ? upgrade.resumo : '',
    status: 'ativo',
    x: sanitizeNumber(upgrade.x),
    y: sanitizeNumber(upgrade.y),
  }
}

function sanitizePublicBaseForPlayer(mundiState) {
  const playerBase = isRecord(mundiState?.playerBase) ? mundiState.playerBase : {}
  const releasedToPlayers = playerBase.releasedToPlayers === true
  const baseUpgrades = Array.isArray(playerBase.upgrades)
    ? playerBase.upgrades.filter(isRecord)
    : []
  const baseStates = Array.isArray(playerBase.bases)
    ? playerBase.bases.filter(isRecord)
    : []

  return {
    anchorLocationId:
      typeof playerBase.anchorLocationId === 'string'
        ? playerBase.anchorLocationId
        : 'caverna_primeiro_corpo',
    bases: releasedToPlayers
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
                .map(sanitizePublicBaseUpgrade)
            : [],
        }))
      : [],
    releasedToPlayers,
    selectedBaseId:
      typeof playerBase.selectedBaseId === 'string' ? playerBase.selectedBaseId : '',
    upgrades: releasedToPlayers
      ? baseUpgrades
          .filter((upgrade) => upgrade.status === 'ativo')
          .map(sanitizePublicBaseUpgrade)
      : [],
  }
}

function sanitizeWorldForPlayer(mundiState, playerId = '') {
  if (!isRecord(mundiState)) {
    return null
  }

  const publicMap = isRecord(mundiState.publicMap) ? mundiState.publicMap : {}
  const releasedToPlayers = publicMap.releasedToPlayers === true
  const discoveredLocationIds = Array.isArray(publicMap.discoveredLocationIds)
    ? publicMap.discoveredLocationIds.filter((id) => typeof id === 'string')
    : []
  const locations = Array.isArray(mundiState.locations)
    ? mundiState.locations.filter(isRecord)
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
  const parties = isRecord(mundiState.parties)
    ? Object.values(mundiState.parties).filter(isRecord)
    : []
  const npcStates = getMundiNpcStates(mundiState)
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
                typeof npc.nome === 'string'
                  ? npc.nome
                  : typeof npc.characterId === 'string'
                    ? npc.characterId
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
                : typeof location.imagemLocalUrl === 'string'
                  ? location.imagemLocalUrl
                  : undefined,
            nome: typeof location.nome === 'string' ? location.nome : locationId,
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
    publicBase: sanitizePublicBaseForPlayer(mundiState),
    publicLocations,
    publicMap: {
      discoveredLocationIds,
      releasedToPlayers,
    },
    selectedPartyId:
      typeof mundiState.selectedPartyId === 'string' ? mundiState.selectedPartyId : '',
  }
}

function sanitizeAccessForPlayer(playerAccess, playerId) {
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
      characterId: ownProfile.characterId,
      id: ownProfile.id,
      label: ownProfile.label,
      role: ownProfile.role,
    },
  }
}

function cloneDefaultAccessProfiles() {
  return DEFAULT_ACCESS_PROFILES.map((profile) => ({ ...profile }))
}

function createDefaultAccessState() {
  return {
    activeProfileId: '',
    profiles: cloneDefaultAccessProfiles(),
    version: 1,
  }
}

function getRawAccessProfiles(playerAccess) {
  if (!isRecord(playerAccess)) {
    return []
  }

  const state = isRecord(playerAccess.state) ? playerAccess.state : playerAccess

  return Array.isArray(state.profiles) ? state.profiles : []
}

function hasUsableAccessProfiles(playerAccess) {
  return getRawAccessProfiles(playerAccess).some(
    (profile) => isRecord(profile) && ACCESS_PROFILE_IDS.has(profile.id),
  )
}

function getAccessState(playerAccess) {
  const profiles = getRawAccessProfiles(playerAccess)

  if (profiles.length === 0) {
    return createDefaultAccessState()
  }

  return {
    activeProfileId: '',
    profiles,
    version: 1,
  }
}

function sanitizeAccessStateForRemoteLogin(playerAccess) {
  const state = getAccessState(playerAccess)

  return {
    activeProfileId: '',
    profiles: state.profiles
      .filter((profile) => isRecord(profile) && PLAYER_IDS.has(profile.id))
      .map((profile) => ({
        characterId: typeof profile.characterId === 'string' ? profile.characterId : '',
        id: profile.id,
        label: typeof profile.label === 'string' ? profile.label : profile.id,
        password: '',
        role: 'player',
      })),
    version: 1,
  }
}

function authenticateAccessProfile(playerAccess, profileId, password) {
  if (!ACCESS_PROFILE_IDS.has(profileId)) {
    return null
  }

  if (profileId === 'gm') {
    return null
  }

  const state = getAccessState(playerAccess)
  const profile = state.profiles.find(
    (entry) => isRecord(entry) && entry.id === profileId,
  )

  if (!isRecord(profile) || profile.password !== password) {
    return null
  }

  return {
    characterId: typeof profile.characterId === 'string' ? profile.characterId : '',
    id: profile.id,
    label: typeof profile.label === 'string' ? profile.label : profile.id,
    password: '',
    role: profile.role === 'gm' ? 'gm' : 'player',
  }
}

function loadPlayerAccess(app, campaignId) {
  const campaignAccess = loadJson(app, {
    campaignId,
    name: 'access',
    scope: 'campaign',
  })

  if (hasUsableAccessProfiles(campaignAccess)) {
    return campaignAccess
  }

  const appAccess = loadJson(app, {
    name: 'access',
    scope: 'app',
  })

  return hasUsableAccessProfiles(appAccess) ? appAccess : createDefaultAccessState()
}

function collectVisibleCharacterIds(session, playerId, playerAccess, mundiState) {
  const ids = new Set()
  const publicSession = sanitizeSessionForPlayer(session, playerId)
  const scenes = Array.isArray(publicSession?.scenes) ? publicSession.scenes : []

  scenes.forEach((scene) => {
    const tokens = Array.isArray(scene.tokens) ? scene.tokens : []

    tokens.forEach((token) => {
      if (typeof token.characterId === 'string') {
        ids.add(token.characterId)
      }

      if (typeof token.npcId === 'string') {
        ids.add(token.npcId)
      }
    })
  })

  const access = sanitizeAccessForPlayer(playerAccess, playerId)

  if (typeof access?.profile?.characterId === 'string' && access.profile.characterId) {
    ids.add(access.profile.characterId)
  }

  const corpos = isRecord(mundiState?.corpos) ? mundiState.corpos : {}
  Object.values(corpos).forEach((body) => {
    if (
      isRecord(body) &&
      getBodyControllerIds(body).includes(playerId) &&
      typeof body.npcOriginalId === 'string' &&
      body.npcOriginalId
    ) {
      ids.add(body.npcOriginalId)
    }
  })

  return ids
}

function collectEditableCharacterIds(session, playerId, playerAccess, mundiState) {
  const ids = new Set()
  const activeScene = getActiveScene(session)
  const tokens = Array.isArray(activeScene?.tokens) ? activeScene.tokens : []

  tokens.forEach((token) => {
    if (!isRecord(token) || !tokenCanBeControlledByPlayer(token, playerId)) {
      return
    }

    if (typeof token.characterId === 'string') {
      ids.add(token.characterId)
    }

    if (typeof token.npcId === 'string') {
      ids.add(token.npcId)
    }
  })

  const access = sanitizeAccessForPlayer(playerAccess, playerId)

  if (typeof access?.profile?.characterId === 'string' && access.profile.characterId) {
    ids.add(access.profile.characterId)
  }

  const corpos = isRecord(mundiState?.corpos) ? mundiState.corpos : {}
  Object.values(corpos).forEach((body) => {
    if (
      isRecord(body) &&
      getBodyControllerIds(body).includes(playerId) &&
      typeof body.npcOriginalId === 'string' &&
      body.npcOriginalId
    ) {
      ids.add(body.npcOriginalId)
    }
  })

  return ids
}

function sanitizeCharactersForPlayer(workspace, visibleCharacterIds) {
  const characters = Array.isArray(workspace?.characters) ? workspace.characters : []

  return characters
    .filter((character) => isRecord(character) && visibleCharacterIds.has(character.id))
    .map((character) => cloneValue(character))
}

function findActiveMap(libraryState, publicSession) {
  const scene = Array.isArray(publicSession?.scenes) ? publicSession.scenes[0] : null
  const mapId = typeof scene?.mapId === 'string' ? scene.mapId : ''
  const maps = Array.isArray(libraryState?.customMaps) ? libraryState.customMaps : []
  const override = isRecord(libraryState?.mapOverrides)
    ? libraryState.mapOverrides[mapId]
    : null
  const map = maps.find((item) => isRecord(item) && item.id === mapId)

  if (!map && !override) {
    return null
  }

  return {
    ...(map ?? { id: mapId, name: mapId }),
    ...(isRecord(override) ? override : {}),
  }
}

function sanitizeTransitionOverridesForPlayer(value) {
  return isRecord(value) ? cloneValue(value) : {}
}

function sanitizeTransitionPlaybackForPlayer(value) {
  if (!isRecord(value) || typeof value.activeTransitionId !== 'string') {
    return null
  }

  if (!value.activeTransitionId) {
    return null
  }

  return {
    activeTransitionId: value.activeTransitionId,
    currentTime:
      typeof value.currentTime === 'number' && Number.isFinite(value.currentTime)
        ? Math.max(0, value.currentTime)
        : 0,
    mapTargetId:
      typeof value.mapTargetId === 'string' && value.mapTargetId
        ? value.mapTargetId
        : null,
    paused: value.paused === true,
    startedAt:
      typeof value.startedAt === 'number' && Number.isFinite(value.startedAt)
        ? value.startedAt
        : Date.now(),
  }
}

function sanitizeCombatLogPayload(value, playerId, session) {
  if (!isRecord(value) || value.kind !== 'attack') {
    return null
  }

  const attackerTokenId =
    typeof value.attackerTokenId === 'string' ? value.attackerTokenId.trim() : ''
  const currentSceneId =
    isRecord(session) && typeof session.currentSceneId === 'string'
      ? session.currentSceneId
      : ''
  const currentScene =
    isRecord(session) && Array.isArray(session.scenes)
      ? session.scenes.find((scene) => isRecord(scene) && scene.id === currentSceneId)
      : null
  const attackerToken =
    isRecord(currentScene) && Array.isArray(currentScene.tokens)
      ? currentScene.tokens.find(
          (token) => isRecord(token) && token.id === attackerTokenId,
        )
      : null

  if (!attackerToken || !tokenCanBeControlledByPlayer(attackerToken, playerId)) {
    writeOnlineLog('combat-log:metadata-rejected-token', {
      attackerTokenId,
      playerId,
    })
    return null
  }

  const attackerCharacterId =
    typeof value.attackerCharacterId === 'string'
      ? value.attackerCharacterId.trim().slice(0, 120)
      : ''
  const attackerName =
    typeof value.attackerName === 'string'
      ? value.attackerName.trim().slice(0, 120)
      : ''
  const attackName =
    typeof value.attackName === 'string' ? value.attackName.trim().slice(0, 160) : ''

  if (!attackerCharacterId || !attackerName || !attackName) {
    return null
  }

  const combat = {
    attackerCharacterId,
    attackerName,
    attackerTokenId,
    attackName,
    damageFormula:
      typeof value.damageFormula === 'string'
        ? value.damageFormula.trim().slice(0, 80)
        : '',
    kind: 'attack',
  }

  if (typeof value.rollText === 'string') {
    combat.rollText = value.rollText.trim().slice(0, 240)
  }

  if (typeof value.rollTotal === 'number' && Number.isFinite(value.rollTotal)) {
    combat.rollTotal = value.rollTotal
  }

  if (typeof value.sourceFeatureId === 'string' && value.sourceFeatureId.trim()) {
    combat.sourceFeatureId = value.sourceFeatureId.trim().slice(0, 120)
  }

  return combat
}

function sanitizePublicLogEntry(value, playerId, _playerAccess, session) {
  if (!isRecord(value)) {
    return null
  }

  if (
    value.type !== 'message' &&
    value.type !== 'roll' &&
    value.type !== 'ping' &&
    value.type !== 'system'
  ) {
    return null
  }

  const author = getPlayerShortLabel(playerId)
  const text = typeof value.text === 'string' ? value.text.trim().slice(0, 1000) : ''

  if (!text && value.type !== 'roll') {
    return null
  }

  const entry = {
    author,
    createdAt:
      typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    id:
      typeof value.id === 'string' && value.id
        ? value.id
        : `remote-log-${Date.now()}-${Math.round(Math.random() * 100000)}`,
    text,
    type: value.type,
    visibility: 'public',
  }

  if (value.type === 'roll' && isRecord(value.roll)) {
    entry.roll = cloneValue(value.roll)
    entry.text = typeof value.roll.resultadoTexto === 'string'
      ? value.roll.resultadoTexto
      : text
  }

  const combat = sanitizeCombatLogPayload(value.combat, playerId, session)

  if (combat) {
    entry.combat = combat
  }

  return entry
}

function sanitizePlayerCharacterUpdate(value, existingCharacter) {
  if (!isRecord(value) || !isRecord(existingCharacter) || typeof existingCharacter.id !== 'string') {
    return null
  }

  if (value.id !== existingCharacter.id) {
    return null
  }

  const nextCharacter = {
    ...cloneValue(existingCharacter),
    ...cloneValue(value),
    id: existingCharacter.id,
    tipo: existingCharacter.tipo,
  }
  ;['avatarUrl', 'tokenImageUrl'].forEach((field) => {
    const incomingUrl = typeof value[field] === 'string' ? value[field].trim() : ''
    const existingUrl =
      typeof existingCharacter[field] === 'string' ? existingCharacter[field] : ''
    let isTemporaryRemoteAssetUrl = false

    if (/^https?:\/\//i.test(incomingUrl)) {
      try {
        const parsedUrl = new URL(incomingUrl)
        isTemporaryRemoteAssetUrl =
          parsedUrl.pathname.startsWith('/assets/campaign/') ||
          parsedUrl.pathname.startsWith('/assets/library/')
      } catch {
        isTemporaryRemoteAssetUrl = false
      }
    }

    nextCharacter[field] =
      incomingUrl && !isTemporaryRemoteAssetUrl ? incomingUrl : existingUrl
  })

  if (isRecord(value.recursos) && isRecord(existingCharacter.recursos)) {
    nextCharacter.recursos = {
      ...cloneValue(existingCharacter.recursos),
      ...cloneValue(value.recursos),
    }
  }

  if (isRecord(value.atributos) && isRecord(existingCharacter.atributos)) {
    nextCharacter.atributos = {
      ...cloneValue(existingCharacter.atributos),
      ...cloneValue(value.atributos),
    }
  }

  if (Array.isArray(value.pericias)) {
    nextCharacter.pericias = cloneValue(value.pericias)
  }

  return nextCharacter
}

function buildPublicPlayerState(app, campaignId, playerId, sessionCode) {
  const campaignSession = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })
  const libraryState = loadJson(app, {
    campaignId,
    name: 'library',
    scope: 'campaign',
  })
  const mundiState = loadJson(app, {
    campaignId,
    name: 'mundi',
    scope: 'campaign',
  })
  const playerAccess = loadJson(app, {
    campaignId,
    name: 'access',
    scope: 'campaign',
  })
  const transitionOverrides = loadJson(app, {
    campaignId,
    name: 'transitionOverrides',
    scope: 'campaign',
  })
  const transitionPlayback = loadJson(app, {
    name: 'transitionPlayback',
    scope: 'app',
  })
  const workspace = loadJson(app, {
    name: 'workspace',
    scope: 'app',
  })
  const publicSession = sanitizeSessionForPlayer(campaignSession, playerId)
  const activeMapId = getActiveMapId(campaignSession)
  const publicLibrary = sanitizeLibraryForPlayer(libraryState, activeMapId)
  const visibleCharacterIds = collectVisibleCharacterIds(
    campaignSession,
    playerId,
    playerAccess,
    mundiState,
  )

  return {
    activeMap: findActiveMap(publicLibrary, publicSession),
    campaignId,
    characters: sanitizeCharactersForPlayer(workspace, visibleCharacterIds),
    libraryState: publicLibrary,
    metadata: {
      serverVersion: SERVER_VERSION,
      sessionCode,
    },
    playerAccess: sanitizeAccessForPlayer(playerAccess, playerId),
    playerCurrentMapId:
      activeMapId ||
      (isRecord(publicSession) &&
      Array.isArray(publicSession.scenes) &&
      isRecord(publicSession.scenes[0]) &&
      typeof publicSession.scenes[0].mapId === 'string'
        ? publicSession.scenes[0].mapId
        : ''),
    playerId,
    tabletopSession: publicSession,
    transitionPlayback: sanitizeTransitionPlaybackForPlayer(transitionPlayback),
    transitionOverrides: sanitizeTransitionOverridesForPlayer(transitionOverrides),
    world: sanitizeWorldForPlayer(mundiState, playerId),
  }
}

function encodeFrame(input) {
  const payload = Buffer.from(typeof input === 'string' ? input : JSON.stringify(input))
  const length = payload.length
  let header

  if (length < 126) {
    header = Buffer.alloc(2)
    header[1] = length
  } else if (length < 65536) {
    header = Buffer.alloc(4)
    header[1] = 126
    header.writeUInt16BE(length, 2)
  } else {
    header = Buffer.alloc(10)
    header[1] = 127
    header.writeBigUInt64BE(BigInt(length), 2)
  }

  header[0] = 0x81

  return Buffer.concat([header, payload])
}

function decodeFrames(state, chunk) {
  state.buffer = Buffer.concat([state.buffer, chunk])
  const messages = []

  while (state.buffer.length >= 2) {
    const firstByte = state.buffer[0]
    const secondByte = state.buffer[1]
    const opcode = firstByte & 0x0f
    const masked = (secondByte & 0x80) === 0x80
    let payloadLength = secondByte & 0x7f
    let offset = 2

    if (payloadLength === 126) {
      if (state.buffer.length < offset + 2) {
        break
      }
      payloadLength = state.buffer.readUInt16BE(offset)
      offset += 2
    } else if (payloadLength === 127) {
      if (state.buffer.length < offset + 8) {
        break
      }
      payloadLength = Number(state.buffer.readBigUInt64BE(offset))
      offset += 8
    }

    const maskLength = masked ? 4 : 0
    const frameLength = offset + maskLength + payloadLength

    if (state.buffer.length < frameLength) {
      break
    }

    const mask = masked ? state.buffer.subarray(offset, offset + 4) : null
    offset += maskLength
    const payload = Buffer.from(state.buffer.subarray(offset, offset + payloadLength))
    state.buffer = state.buffer.subarray(frameLength)

    if (mask) {
      for (let index = 0; index < payload.length; index += 1) {
        payload[index] ^= mask[index % 4]
      }
    }

    if (opcode === 0x8) {
      messages.push({ type: 'close' })
      continue
    }

    if (opcode === 0x9) {
      messages.push({ payload, type: 'ping' })
      continue
    }

    if (opcode === 0x1) {
      messages.push({
        payload: payload.toString('utf8'),
        type: 'text',
      })
    }
  }

  return messages
}

function sendWs(socket, payload) {
  if (socket.destroyed || socket.writableEnded) {
    return false
  }

  try {
    return socket.write(encodeFrame(payload))
  } catch (error) {
    writeOnlineLog('ws:send-failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload, null, 2))
}

function sendEmpty(response, statusCode) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
  })
  response.end()
}

function readRequestJson(request) {
  return new Promise((resolve, reject) => {
    let body = ''

    request.on('data', (chunk) => {
      body += chunk.toString('utf8')

      if (body.length > 1_000_000) {
        reject(new Error('Payload HTTP grande demais.'))
        request.destroy()
      }
    })

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })
    request.on('error', reject)
  })
}

class FushiMultiplayerServer {
  constructor(app, options) {
    this.app = app
    this.campaignId = options.campaignId
    this.clients = new Map()
    this.broadcastTimer = null
    this.heartbeatTimer = null
    this.httpServer = null
    this.localIps = []
    this.onStorageChanged = options.onStorageChanged
    this.port = options.port
    this.serverInstanceId = crypto.randomUUID()
    this.stateVersion = 1
    this.remoteActionReplayCache = new Map()
    this.recentRemoteDiceRolls = []
    this.remoteDiceRollCooldownUntilByPlayer = new Map()
    this.sessionCode = options.sessionCode || createSessionCode()
    this.startedAt = null
  }

  getClientAdmissionStatus(client) {
    if (!client || !PLAYER_IDS.has(client.playerId)) {
      return 'anonymous'
    }

    return client.admissionStatus === 'accepted' ||
      client.admissionStatus === 'pending' ||
      client.admissionStatus === 'rejected' ||
      client.admissionStatus === 'kicked'
      ? client.admissionStatus
      : 'pending'
  }

  isClientAccepted(client) {
    return PLAYER_IDS.has(client?.playerId) && this.getClientAdmissionStatus(client) === 'accepted'
  }

  isPlayerAccepted(playerId) {
    if (!PLAYER_IDS.has(playerId)) {
      return false
    }

    return Array.from(this.clients.values()).some(
      (client) => client.playerId === playerId && this.isClientAccepted(client),
    )
  }

  getRemoteActionId(message) {
    return typeof message?.remoteActionId === 'string' && message.remoteActionId.trim()
      ? message.remoteActionId.trim().slice(0, 160)
      : ''
  }

  getRemoteActionReplayKey(client, message) {
    const actionId = this.getRemoteActionId(message)

    return actionId && PLAYER_IDS.has(client?.playerId)
      ? `${client.playerId}:${actionId}`
      : ''
  }

  pruneRemoteActionReplayCache() {
    const now = Date.now()

    this.remoteActionReplayCache.forEach((entry, key) => {
      if (!entry || now - entry.storedAt > REMOTE_ACTION_REPLAY_TTL_MS) {
        this.remoteActionReplayCache.delete(key)
      }
    })
  }

  getRemoteActionReplay(client, message) {
    this.pruneRemoteActionReplayCache()

    const key = this.getRemoteActionReplayKey(client, message)

    return key ? this.remoteActionReplayCache.get(key) ?? null : null
  }

  rememberRemoteActionReplay(client, message, applied) {
    const key = this.getRemoteActionReplayKey(client, message)

    if (!key) {
      return
    }

    this.remoteActionReplayCache.set(key, {
      applied: applied === true,
      message:
        typeof client.lastActionErrorMessage === 'string' && client.lastActionErrorMessage
          ? client.lastActionErrorMessage
          : undefined,
      storedAt: Date.now(),
    })
  }

  async start() {
    if (this.httpServer) {
      return this.getStatus()
    }

    ensureServerWorkspace()
    writeOnlineLog('server:start-request', {
      campaignId: this.campaignId,
      port: this.port,
      serverRoot: SERVER_ROOT,
      sessionCode: this.sessionCode,
    })

    this.httpServer = http.createServer((request, response) => {
      this.handleHttpRequest(request, response)
    })
    this.httpServer.on('upgrade', (request, socket) => {
      this.handleUpgrade(request, socket)
    })

    await new Promise((resolve, reject) => {
      this.httpServer.once('error', reject)
      this.httpServer.listen(this.port, '0.0.0.0', () => {
        this.httpServer.off('error', reject)
        resolve()
      })
    })

    this.port = this.httpServer.address().port
    this.localIps = getLocalIpAddresses()
    this.startedAt = new Date().toISOString()
    this.startHeartbeat()
    writeOnlineLog('server:started', {
      campaignId: this.campaignId,
      localIps: this.localIps,
      port: this.port,
      sessionCode: this.sessionCode,
      startedAt: this.startedAt,
    })

    return this.getStatus()
  }

  stop() {
    writeOnlineLog('server:stop-request', {
      campaignId: this.campaignId,
      clients: this.clients.size,
      port: this.port,
      sessionCode: this.sessionCode,
    })
    this.clients.forEach((client) => {
      client.socket.destroy()
    })
    this.clients.clear()

    if (this.broadcastTimer) {
      clearTimeout(this.broadcastTimer)
      this.broadcastTimer = null
    }

    this.stopHeartbeat()

    if (this.httpServer) {
      this.httpServer.close()
      this.httpServer = null
    }

    writeOnlineLog('server:stopped', {
      campaignId: this.campaignId,
      port: this.port,
      sessionCode: this.sessionCode,
    })

    return this.getStatus()
  }

  getStatus() {
    return {
      campaignId: this.campaignId,
      clients: Array.from(this.clients.values()).map((client) => ({
        admissionStatus: this.getClientAdmissionStatus(client),
        connectedAt: client.connectedAt,
        id: client.id,
        latencyMs: Number.isFinite(client.latencyMs) ? client.latencyMs : null,
        lastPongAt: client.lastPongAt
          ? new Date(client.lastPongAt).toISOString()
          : null,
        profileLabel: client.profileLabel || '',
        requestedAt: client.admissionRequestedAt || null,
        playerId: client.playerId || 'aguardando_acesso',
      })),
      isRunning: Boolean(this.httpServer),
      localIps: this.localIps,
      port: this.port,
      protocolVersion: PROTOCOL_VERSION,
      serverInstanceId: this.serverInstanceId,
      serverVersion: SERVER_VERSION,
      serverRoot: SERVER_ROOT,
      sessionCode: this.sessionCode,
      stateVersion: this.stateVersion,
      startedAt: this.startedAt,
    }
  }

  buildVersionedPublicState(playerId) {
    return {
      ...buildPublicPlayerState(
        this.app,
        this.campaignId,
        playerId,
        this.sessionCode,
      ),
      protocolVersion: PROTOCOL_VERSION,
      serverInstanceId: this.serverInstanceId,
      stateVersion: this.stateVersion,
    }
  }

  handleHttpRequest(request, response) {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)

    if (request.method === 'OPTIONS') {
      sendEmpty(response, 204)
      return
    }

    if (url.pathname === '/health') {
      writeOnlineLog('http:health', {
        host: request.headers.host,
        remoteAddress: request.socket?.remoteAddress,
      })
      sendJson(response, 200, this.getStatus())
      return
    }

    if (url.pathname === '/ping') {
      sendJson(response, 200, {
        ok: true,
        serverTime: Date.now(),
      })
      return
    }

    if (url.pathname === '/state') {
      this.handleStateHttpRequest(url, request, response)
      return
    }

    if (url.pathname === '/action') {
      this.handleActionHttpRequest(request, response).catch((error) => {
        writeOnlineLog('http:action-error', {
          error: error instanceof Error ? error.message : String(error),
          remoteAddress: request.socket?.remoteAddress,
        })
        sendJson(response, 500, { error: 'Acao remota falhou.' })
      })
      return
    }

    if (url.pathname.startsWith('/assets/campaign/')) {
      const [, , campaignId, category, ...filenameParts] = url.pathname
        .split('/')
        .filter(Boolean)
        .map(decodeURIComponent)

      if (!campaignId || !category || filenameParts.length === 0) {
        writeOnlineLog('asset:campaign-invalid', {
          path: url.pathname,
          remoteAddress: request.socket?.remoteAddress,
        })
        sendJson(response, 404, { error: 'Asset invalido.' })
        return
      }

      writeOnlineLog('asset:campaign-request', {
        campaignId,
        category,
        filename: filenameParts.join('/'),
        remoteAddress: request.socket?.remoteAddress,
      })
      sendStoredAssetHttpResponse(
        this.app,
        request,
        response,
        `fushi-asset://campaign/${encodeURIComponent(campaignId)}/${encodeURIComponent(category)}/${encodeURIComponent(filenameParts.join('-'))}`,
      )
      return
    }

    if (url.pathname.startsWith('/assets/library/')) {
      const relativePath = url.pathname
        .replace(/^\/assets\/library\/?/, '')
        .split('/')
        .filter(Boolean)
        .map(decodeURIComponent)
        .join('/')

      if (!relativePath) {
        writeOnlineLog('asset:library-invalid', {
          path: url.pathname,
          remoteAddress: request.socket?.remoteAddress,
        })
        sendJson(response, 404, { error: 'Asset invalido.' })
        return
      }

      writeOnlineLog('asset:library-request', {
        path: relativePath,
        remoteAddress: request.socket?.remoteAddress,
      })
      sendRuntimeAssetHttpResponse(this.app, request, response, `/assets/${relativePath}`)
      return
    }

    writeOnlineLog('http:root', {
      path: url.pathname,
      remoteAddress: request.socket?.remoteAddress,
    })
    sendJson(response, 200, {
      message: 'FUSHI Multiplayer V1',
      status: this.getStatus(),
    })
  }

  handleStateHttpRequest(url, request, response) {
    const code = (url.searchParams.get('code') || '').trim().toUpperCase()
    const playerId = url.searchParams.get('playerId') || ''

    if (code !== this.sessionCode) {
      writeOnlineLog('http:state-rejected-code', {
        remoteAddress: request.socket?.remoteAddress,
      })
      sendJson(response, 401, { error: 'Codigo de sessao invalido.' })
      return
    }

    if (!PLAYER_IDS.has(playerId)) {
      writeOnlineLog('http:state-rejected-player', {
        playerId,
        remoteAddress: request.socket?.remoteAddress,
      })
      sendJson(response, 403, { error: 'Jogador invalido.' })
      return
    }

    if (!this.isPlayerAccepted(playerId)) {
      writeOnlineLog('http:state-rejected-admission', {
        playerId,
        remoteAddress: request.socket?.remoteAddress,
      })
      sendJson(response, 403, { error: 'Entrada ainda nao liberada pelo mestre.' })
      return
    }

    writeOnlineLog('http:state-send', {
      playerId,
      remoteAddress: request.socket?.remoteAddress,
    })
    sendJson(response, 200, {
      ok: true,
      publicState: this.buildVersionedPublicState(playerId),
    })
  }

  async handleActionHttpRequest(request, response) {
    if (request.method !== 'POST') {
      sendJson(response, 405, { error: 'Metodo nao permitido.' })
      return
    }

    const body = await readRequestJson(request)

    if (!isRecord(body)) {
      sendJson(response, 400, { error: 'Payload invalido.' })
      return
    }

    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
    const playerId = typeof body.playerId === 'string' ? body.playerId : ''
    const message = isRecord(body.message) ? body.message : null
    if (code !== this.sessionCode) {
      writeOnlineLog('http:action-rejected-code', {
        remoteAddress: request.socket?.remoteAddress,
      })
      sendJson(response, 401, { error: 'Codigo de sessao invalido.' })
      return
    }

    if (!PLAYER_IDS.has(playerId)) {
      writeOnlineLog('http:action-rejected-player', {
        playerId,
        remoteAddress: request.socket?.remoteAddress,
      })
      sendJson(response, 403, { error: 'Jogador invalido.' })
      return
    }

    if (!message || !REMOTE_ACTION_TYPES.has(message.type)) {
      writeOnlineLog('http:action-rejected-type', {
        messageType: isRecord(message) ? message.type : null,
        playerId,
      })
      sendJson(response, 400, { error: 'Acao remota invalida.' })
      return
    }

    if (!this.isPlayerAccepted(playerId)) {
      writeOnlineLog('http:action-rejected-admission', {
        messageType: message.type,
        playerId,
        remoteAddress: request.socket?.remoteAddress,
      })
      sendJson(response, 403, {
        applied: false,
        error: 'Entrada ainda nao liberada pelo mestre.',
        ok: false,
      })
      return
    }

    const client = {
      admissionStatus: 'accepted',
      connectedAt: new Date().toISOString(),
      id: `http-${crypto.randomUUID()}`,
      lastActionErrorMessage: '',
      playerId,
      socket: {
        destroyed: true,
        write() {},
      },
      state: {
        buffer: Buffer.alloc(0),
      },
    }

    const remoteActionId =
      typeof body.actionId === 'string'
        ? body.actionId
        : typeof message.remoteActionId === 'string'
          ? message.remoteActionId
          : undefined

    writeOnlineLog('http:action-accepted', {
      messageType: message.type,
      playerId,
      remoteAddress: request.socket?.remoteAddress,
      remoteActionId,
    })
    const actionMessage = remoteActionId
      ? {
          ...message,
          remoteActionId,
        }
      : message
    client.lastActionErrorMessage = ''
    const result = this.handleClientMessage(client, actionMessage)
    const applied = result?.applied === true
    const actionErrorMessage =
      typeof client.lastActionErrorMessage === 'string' && client.lastActionErrorMessage
        ? client.lastActionErrorMessage
        : undefined

    sendJson(response, 200, {
      actionId: remoteActionId,
      applied,
      error: applied ? undefined : actionErrorMessage ?? 'Acao remota rejeitada pelo estado da mesa.',
      message: actionErrorMessage,
      ok: applied,
      publicState: this.buildVersionedPublicState(playerId),
    })
  }

  handleUpgrade(request, socket) {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
    const sessionCode = url.searchParams.get('code') || ''

    if (url.pathname !== '/session') {
      writeOnlineLog('ws:upgrade-rejected-path', {
        path: url.pathname,
        remoteAddress: socket.remoteAddress,
      })
      socket.destroy()
      return
    }

    if (sessionCode !== this.sessionCode) {
      writeOnlineLog('ws:upgrade-rejected-code', {
        expectedCode: this.sessionCode,
        receivedCode: sessionCode,
        remoteAddress: socket.remoteAddress,
      })
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    const key = request.headers['sec-websocket-key']

    if (!key) {
      writeOnlineLog('ws:upgrade-rejected-key', {
        remoteAddress: socket.remoteAddress,
      })
      socket.destroy()
      return
    }

    const accept = crypto
      .createHash('sha1')
      .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest('base64')
    const clientId = crypto.randomUUID()

    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '\r\n',
      ].join('\r\n'),
    )

    const client = {
      connectedAt: new Date().toISOString(),
      id: clientId,
      latencyMs: null,
      lastPingSentAt: null,
      playerId: '',
      profileLabel: '',
      admissionStatus: 'anonymous',
      admissionRequestedAt: null,
      lastPongAt: Date.now(),
      socket,
      state: {
        buffer: Buffer.alloc(0),
      },
    }

    this.clients.set(clientId, client)
    writeOnlineLog('client:connected', {
      clientId,
      clients: this.clients.size,
      remoteAddress: socket.remoteAddress,
      sessionCode: this.sessionCode,
    })
    socket.on('data', (chunk) => this.handleSocketData(client, chunk))
    socket.on('close', () => this.removeClient(clientId))
    socket.on('error', () => this.removeClient(clientId))
    sendWs(socket, {
      payload: {
        clientId,
        status: this.getStatus(),
      },
      type: 'welcome',
    })
    this.sendSessionInfo(client)
    this.broadcastPlayers()
  }

  removeClient(clientId) {
    const client = this.clients.get(clientId)
    if (!client) {
      return
    }

    this.clients.delete(clientId)
    writeOnlineLog('client:disconnected', {
      clientId,
      clients: this.clients.size,
      playerId: client?.playerId || 'aguardando_acesso',
    })
    this.broadcastPlayers()
  }

  handleSocketData(client, chunk) {
    const messages = decodeFrames(client.state, chunk)

    messages.forEach((message) => {
      if (message.type === 'close') {
        client.socket.destroy()
        return
      }

      if (message.type === 'ping') {
        client.socket.write(Buffer.concat([Buffer.from([0x8a, message.payload.length]), message.payload]))
        return
      }

      if (message.type !== 'text') {
        return
      }

      try {
        const payload = JSON.parse(message.payload)
        this.handleClientMessage(client, payload)
      } catch (error) {
        writeOnlineLog('ws:invalid-message', {
          clientId: client.id,
          error: error instanceof Error ? error.message : String(error),
          playerId: client.playerId || 'aguardando_acesso',
        })
        sendWs(client.socket, {
          message: 'Mensagem invalida.',
          type: 'error',
        })
      }
    })
  }

  handleClientMessage(client, message) {
    if (!isRecord(message)) {
      return { applied: false, handled: false }
    }

    client.lastActionErrorMessage = ''

    writeOnlineLog('client:message', {
      clientId: client.id,
      messageType: message.type,
      playerId: client.playerId || 'aguardando_acesso',
    })

    if (message.type === 'authenticate') {
      this.handleAuthenticate(client, message)
      return { applied: true, handled: true }
    }

    if (message.type === 'request-state') {
      this.sendPublicState(client)
      return { applied: true, handled: true }
    }

    if (message.type === 'client-pong') {
      const now = Date.now()
      const serverTime =
        typeof message.serverTime === 'number'
          ? message.serverTime
          : typeof client.lastPingSentAt === 'number'
            ? client.lastPingSentAt
            : null

      client.lastPongAt = now
      client.latencyMs = serverTime !== null ? Math.max(0, Math.round(now - serverTime)) : null
      return { applied: true, handled: true }
    }

    if (REMOTE_ACTION_TYPES.has(message.type) && !this.isClientAccepted(client)) {
      client.lastActionErrorMessage = 'Entrada ainda nao liberada pelo mestre.'
      writeOnlineLog('client:message-rejected-admission', {
        clientId: client.id,
        messageType: message.type,
        playerId: client.playerId || 'aguardando_acesso',
      })
      this.sendActionAck(client, message, false)
      return { applied: false, handled: true }
    }

    if (REMOTE_ACTION_TYPES.has(message.type)) {
      const replay = this.getRemoteActionReplay(client, message)

      if (replay) {
        client.lastActionErrorMessage = replay.message || ''
        writeOnlineLog('client:message-replay', {
          applied: replay.applied,
          clientId: client.id,
          messageType: message.type,
          playerId: client.playerId,
          remoteActionId: this.getRemoteActionId(message),
        })
        this.sendActionAck(client, message, replay.applied)
        return { applied: replay.applied, handled: true }
      }
    }

    if (message.type === 'move-token') {
      const applied = this.handleMoveToken(client, message)
      this.rememberRemoteActionReplay(client, message, applied)
      this.sendActionAck(client, message, applied)
      return { applied, handled: true }
    }

    if (message.type === 'add-log-entry') {
      const applied = this.handleAddLogEntry(client, message)
      this.rememberRemoteActionReplay(client, message, applied)
      this.sendActionAck(client, message, applied)
      return { applied, handled: true }
    }

    if (message.type === 'update-measurement') {
      const applied = this.handleUpdateMeasurement(client, message)
      this.rememberRemoteActionReplay(client, message, applied)
      this.sendActionAck(client, message, applied)
      return { applied, handled: true }
    }

    if (message.type === 'update-character') {
      const applied = this.handleUpdateCharacter(client, message)
      this.rememberRemoteActionReplay(client, message, applied)
      this.sendActionAck(client, message, applied)
      return { applied, handled: true }
    }

    writeOnlineLog('client:message-ignored', {
      clientId: client.id,
      messageType: message.type,
      playerId: client.playerId || 'aguardando_acesso',
    })
    return { applied: false, handled: false }
  }

  sendActionAck(client, message, applied) {
    const actionId = typeof message.remoteActionId === 'string' ? message.remoteActionId : ''

    if (!actionId || !PLAYER_IDS.has(client.playerId)) {
      return
    }

    sendWs(client.socket, {
      payload: {
        actionId,
        applied: applied === true,
        message:
          applied === true || typeof client.lastActionErrorMessage !== 'string'
            ? undefined
            : client.lastActionErrorMessage,
        messageType: message.type,
        publicState: this.isClientAccepted(client)
          ? this.buildVersionedPublicState(client.playerId)
          : undefined,
        serverTime: Date.now(),
      },
      type: 'action-ack',
    })
  }

  handleAuthenticate(client, message) {
    const profileId = typeof message.profileId === 'string' ? message.profileId : ''
    const password = typeof message.password === 'string' ? message.password : ''
    const playerAccess = loadPlayerAccess(this.app, this.campaignId)
    const profile = authenticateAccessProfile(playerAccess, profileId, password)

    if (!profile || !PLAYER_IDS.has(profile.id)) {
      writeOnlineLog('auth:rejected', {
        clientId: client.id,
        profileId,
      })
      sendWs(client.socket, {
        message: 'Acesso remoto invalido ou nao permitido.',
        type: 'auth-error',
      })
      return
    }

    client.admissionRequestedAt = new Date().toISOString()
    client.admissionStatus = 'pending'
    client.playerId = profile.id
    client.profileLabel = profile.label
    writeOnlineLog('auth:pending-master-approval', {
      clientId: client.id,
      label: profile.label,
      playerId: profile.id,
    })
    sendWs(client.socket, {
      payload: {
        profile,
      },
      type: 'auth-ok',
    })
    this.sendAdmissionStatus(client, {
      message: 'Aguardando o mestre liberar sua entrada.',
      status: 'pending',
    })
    this.broadcastPlayers()
  }

  handleMoveToken(client, message) {
    if (!PLAYER_IDS.has(client.playerId)) {
      writeOnlineLog('token:move-rejected-auth', {
        clientId: client.id,
      })
      sendWs(client.socket, {
        message: 'Autentique um jogador antes de mover tokens.',
        type: 'error',
      })
      return false
    }

    const tokenId = typeof message.tokenId === 'string' ? message.tokenId : ''
    const cell = isRecord(message.cell) ? message.cell : null

    if (
      !tokenId ||
      !cell ||
      !Number.isInteger(cell.column) ||
      !Number.isInteger(cell.row) ||
      cell.column < 0 ||
      cell.row < 0
    ) {
      writeOnlineLog('token:move-rejected-invalid', {
        cell,
        clientId: client.id,
        playerId: client.playerId,
        tokenId,
      })
      sendWs(client.socket, {
        message: 'Movimento invalido.',
        type: 'error',
      })
      return false
    }

    const session = loadJson(this.app, {
      campaignId: this.campaignId,
      name: 'session',
      scope: 'campaign',
    })

    if (!isRecord(session) || !Array.isArray(session.scenes)) {
      writeOnlineLog('token:move-rejected-session', {
        clientId: client.id,
        playerId: client.playerId,
        tokenId,
      })
      sendWs(client.socket, {
        message: 'Sessao nao encontrada.',
        type: 'error',
      })
      return false
    }

    const sceneId = typeof session.currentSceneId === 'string' ? session.currentSceneId : ''
    let moved = false

    const nextScenes = session.scenes.map((scene) => {
      if (!isRecord(scene) || scene.id !== sceneId || !Array.isArray(scene.tokens)) {
        return scene
      }

      return {
        ...scene,
        tokens: scene.tokens.map((token) => {
          if (!isRecord(token) || token.id !== tokenId) {
            return token
          }

          if (!tokenCanBeMovedByPlayer(token, client.playerId)) {
            writeOnlineLog('token:move-rejected-permission', {
              clientId: client.id,
              playerId: client.playerId,
              tokenId,
            })
            return token
          }

          moved = true

          return {
            ...token,
            cell: {
              column: cell.column,
              row: cell.row,
            },
          }
        }),
      }
    })

    if (!moved) {
      const errorMessage = 'Apenas o Mestre pode mover tokens nesta mesa.'

      writeOnlineLog('token:move-rejected-not-moved', {
        cell,
        clientId: client.id,
        playerId: client.playerId,
        sceneId,
        tokenId,
      })
      client.lastActionErrorMessage = errorMessage
      sendWs(client.socket, {
        message: errorMessage,
        type: 'error',
      })
      return false
    }

    const currentScene = nextScenes.find((scene) => isRecord(scene) && scene.id === sceneId)
    const nextSession = {
      ...session,
      scenes: nextScenes,
      tokens: isRecord(currentScene) && Array.isArray(currentScene.tokens)
        ? currentScene.tokens
        : session.tokens,
    }

    saveJson(this.app, {
      campaignId: this.campaignId,
      data: nextSession,
      name: 'session',
      scope: 'campaign',
    })
    this.onStorageChanged?.({
      campaignId: this.campaignId,
      name: 'session',
      scope: 'campaign',
      type: 'json',
    })
    writeOnlineLog('token:moved', {
      cell,
      clientId: client.id,
      playerId: client.playerId,
      remoteActionId:
        typeof message.remoteActionId === 'string' ? message.remoteActionId : undefined,
      sceneId,
      tokenId,
    })
    this.broadcastPublicState({ immediate: true })
    return true
  }

  canAcceptRemoteDiceRoll(client, entry) {
    if (!entry || entry.type !== 'roll' || !entry.roll) {
      return true
    }

    const now = Date.now()
    const cooldownUntil = this.remoteDiceRollCooldownUntilByPlayer.get(client.playerId) || 0

    if (cooldownUntil > now) {
      const seconds = Math.max(1, Math.ceil((cooldownUntil - now) / 1000))
      const errorMessage = `Espere ${seconds}s para rolar novamente.`

      writeOnlineLog('log-entry:roll-rejected-cooldown', {
        clientId: client.id,
        entryId: entry.id,
        playerId: client.playerId,
        remainingSeconds: seconds,
      })
      sendWs(client.socket, {
        message: errorMessage,
        type: 'error',
      })
      client.lastActionErrorMessage = errorMessage
      return false
    }

    this.recentRemoteDiceRolls = this.recentRemoteDiceRolls.filter(
      (timestamp) => now - timestamp < REMOTE_DICE_ROLL_BURST_WINDOW_MS,
    )

    if (this.recentRemoteDiceRolls.length >= REMOTE_DICE_ROLL_MAX_BURST) {
      const errorMessage = 'Fila de dados cheia. Aguarde a proxima rolagem terminar.'

      writeOnlineLog('log-entry:roll-rejected-burst', {
        clientId: client.id,
        entryId: entry.id,
        playerId: client.playerId,
        recentRolls: this.recentRemoteDiceRolls.length,
      })
      sendWs(client.socket, {
        message: errorMessage,
        type: 'error',
      })
      client.lastActionErrorMessage = errorMessage
      return false
    }

    this.recentRemoteDiceRolls.push(now)
    this.remoteDiceRollCooldownUntilByPlayer.set(
      client.playerId,
      now + REMOTE_DICE_ROLL_COOLDOWN_MS,
    )
    return true
  }

  handleAddLogEntry(client, message) {
    if (!PLAYER_IDS.has(client.playerId)) {
      writeOnlineLog('log-entry:rejected-auth', {
        clientId: client.id,
      })
      sendWs(client.socket, {
        message: 'Autentique um jogador antes de enviar chat ou rolagem.',
        type: 'error',
      })
      return false
    }

    const session = loadJson(this.app, {
      campaignId: this.campaignId,
      name: 'session',
      scope: 'campaign',
    })
    const playerAccess = loadPlayerAccess(this.app, this.campaignId)
    const entry = this.resolveIncomingLogEntry(
      message.entry,
      client.playerId,
      playerAccess,
      session,
    )

    if (!isRecord(session) || !entry) {
      writeOnlineLog('log-entry:rejected-invalid', {
        clientId: client.id,
        entryType: isRecord(message.entry) ? message.entry.type : null,
        playerId: client.playerId,
      })
      sendWs(client.socket, {
        message: 'Entrada de log invalida.',
        type: 'error',
      })
      return false
    }

    const currentLogEntries = Array.isArray(session.logEntries) ? session.logEntries : []

    if (
      entry.id &&
      currentLogEntries.some((existingEntry) =>
        isRecord(existingEntry) && existingEntry.id === entry.id,
      )
    ) {
      writeOnlineLog('log-entry:duplicate-ignored', {
        clientId: client.id,
        entryId: entry.id,
        entryType: entry.type,
        playerId: client.playerId,
        remoteActionId:
          typeof message.remoteActionId === 'string' ? message.remoteActionId : undefined,
      })
      this.broadcastPublicState({ immediate: true })
      return true
    }

    if (!this.canAcceptRemoteDiceRoll(client, entry)) {
      return false
    }

    const nextSession = {
      ...session,
      logEntries: [
        ...currentLogEntries,
        entry,
      ].slice(-80),
    }

    saveJson(this.app, {
      campaignId: this.campaignId,
      data: nextSession,
      name: 'session',
      scope: 'campaign',
    })
    this.onStorageChanged?.({
      campaignId: this.campaignId,
      name: 'session',
      scope: 'campaign',
      type: 'json',
    })
    writeOnlineLog('log-entry:accepted', {
      author: entry.author,
      clientId: client.id,
      entryId: entry.id,
      entryType: entry.type,
      playerId: client.playerId,
      remoteActionId:
        typeof message.remoteActionId === 'string' ? message.remoteActionId : undefined,
      roll:
        entry.type === 'roll' && entry.roll
          ? {
              resultados: entry.roll.resultados,
              tipoDado: entry.roll.tipoDado,
              total: entry.roll.total,
            }
          : undefined,
      combat:
        isRecord(entry.combat) && entry.combat.kind === 'attack'
          ? {
              attackName: entry.combat.attackName,
              attackerTokenId: entry.combat.attackerTokenId,
            }
          : undefined,
      text: entry.text.slice(0, 180),
    })
    this.broadcastPublicState({ immediate: true })
    return true
  }

  handleUpdateMeasurement(client, message) {
    if (!PLAYER_IDS.has(client.playerId)) {
      writeOnlineLog('measurement:update-rejected-auth', {
        clientId: client.id,
      })
      sendWs(client.socket, {
        message: 'Autentique um jogador antes de medir na mesa.',
        type: 'error',
      })
      return false
    }

    const session = loadJson(this.app, {
      campaignId: this.campaignId,
      name: 'session',
      scope: 'campaign',
    })

    if (!isRecord(session)) {
      writeOnlineLog('measurement:update-rejected-session', {
        clientId: client.id,
        playerId: client.playerId,
      })
      sendWs(client.socket, {
        message: 'Sessao nao encontrada.',
        type: 'error',
      })
      return false
    }

    const incomingMeasurement = isRecord(message.measurement) ? message.measurement : null
    const currentSceneId =
      typeof session.currentSceneId === 'string' ? session.currentSceneId : ''
    let nextActiveMeasurement = null

    if (incomingMeasurement) {
      if (
        !isValidMeasurementCell(incomingMeasurement.start) ||
        !isValidMeasurementCell(incomingMeasurement.end)
      ) {
        writeOnlineLog('measurement:update-rejected-invalid', {
          clientId: client.id,
          measurement: incomingMeasurement,
          playerId: client.playerId,
        })
        sendWs(client.socket, {
          message: 'Medicao invalida.',
          type: 'error',
        })
        return false
      }

      nextActiveMeasurement = {
        id:
          isRecord(session.activeMeasurement) &&
          typeof session.activeMeasurement.id === 'string'
            ? session.activeMeasurement.id
            : `remote-measure-${Date.now()}-${Math.round(Math.random() * 100000)}`,
        sceneId: currentSceneId,
        authorView: 'player',
        authorId: client.playerId,
        authorLabel: getPlayerShortLabel(client.playerId),
        start: {
          column: incomingMeasurement.start.column,
          row: incomingMeasurement.start.row,
        },
        end: {
          column: incomingMeasurement.end.column,
          row: incomingMeasurement.end.row,
        },
        visualColor: sanitizeMeasurementColor(incomingMeasurement.visualColor),
        updatedAt: Date.now(),
      }
    }

    const currentActiveMeasurement = isRecord(session.activeMeasurement)
      ? session.activeMeasurement
      : null

    if (!nextActiveMeasurement && !currentActiveMeasurement) {
      writeOnlineLog('measurement:clear-ignored-empty', {
        clientId: client.id,
        playerId: client.playerId,
        sceneId: currentSceneId,
      })
      return true
    }

    if (
      nextActiveMeasurement &&
      currentActiveMeasurement &&
      currentActiveMeasurement.sceneId === nextActiveMeasurement.sceneId &&
      currentActiveMeasurement.authorId === nextActiveMeasurement.authorId &&
      currentActiveMeasurement.authorView === nextActiveMeasurement.authorView &&
      isValidMeasurementCell(currentActiveMeasurement.start) &&
      isValidMeasurementCell(currentActiveMeasurement.end) &&
      currentActiveMeasurement.start.column === nextActiveMeasurement.start.column &&
      currentActiveMeasurement.start.row === nextActiveMeasurement.start.row &&
      currentActiveMeasurement.end.column === nextActiveMeasurement.end.column &&
      currentActiveMeasurement.end.row === nextActiveMeasurement.end.row &&
      currentActiveMeasurement.visualColor === nextActiveMeasurement.visualColor
    ) {
      writeOnlineLog('measurement:update-ignored-unchanged', {
        clientId: client.id,
        playerId: client.playerId,
        sceneId: currentSceneId,
      })
      return true
    }

    const nextSession = {
      ...session,
      activeMeasurement: nextActiveMeasurement,
    }

    saveJson(this.app, {
      campaignId: this.campaignId,
      data: nextSession,
      name: 'session',
      scope: 'campaign',
    })
    this.onStorageChanged?.({
      campaignId: this.campaignId,
      name: 'session',
      scope: 'campaign',
      type: 'json',
    })
    writeOnlineLog(
      nextActiveMeasurement ? 'measurement:updated' : 'measurement:cleared',
      {
        clientId: client.id,
        playerId: client.playerId,
        sceneId: currentSceneId,
        visualColor: nextActiveMeasurement?.visualColor,
      },
    )
    this.broadcastPublicState()
    return true
  }

  handleUpdateCharacter(client, message) {
    if (!PLAYER_IDS.has(client.playerId)) {
      writeOnlineLog('character:update-rejected-auth', {
        clientId: client.id,
      })
      sendWs(client.socket, {
        message: 'Autentique um jogador antes de atualizar ficha.',
        type: 'error',
      })
      return false
    }

    const incomingCharacter = isRecord(message.character) ? message.character : null
    const characterId = typeof incomingCharacter?.id === 'string' ? incomingCharacter.id : ''
    const session = loadJson(this.app, {
      campaignId: this.campaignId,
      name: 'session',
      scope: 'campaign',
    })
    const playerAccess = loadPlayerAccess(this.app, this.campaignId)
    const mundiState = loadJson(this.app, {
      campaignId: this.campaignId,
      name: 'mundi',
      scope: 'campaign',
    })
    const editableCharacterIds = collectEditableCharacterIds(
      session,
      client.playerId,
      playerAccess,
      mundiState,
    )

    if (!characterId || !editableCharacterIds.has(characterId)) {
      writeOnlineLog('character:update-rejected-permission', {
        characterId,
        clientId: client.id,
        playerId: client.playerId,
      })
      sendWs(client.socket, {
        message: 'Ficha sem permissao para este jogador.',
        type: 'error',
      })
      return false
    }

    const workspace = loadJson(this.app, {
      name: 'workspace',
      scope: 'app',
    })
    const characters = Array.isArray(workspace?.characters) ? workspace.characters : []
    const characterIndex = characters.findIndex(
      (character) => isRecord(character) && character.id === characterId,
    )

    if (characterIndex < 0) {
      writeOnlineLog('character:update-rejected-missing', {
        characterId,
        clientId: client.id,
        playerId: client.playerId,
      })
      sendWs(client.socket, {
        message: 'Ficha nao encontrada no servidor do mestre.',
        type: 'error',
      })
      return false
    }

    const nextCharacter = sanitizePlayerCharacterUpdate(
      incomingCharacter,
      characters[characterIndex],
    )

    if (!nextCharacter) {
      writeOnlineLog('character:update-rejected-invalid', {
        characterId,
        clientId: client.id,
        playerId: client.playerId,
      })
      sendWs(client.socket, {
        message: 'Atualizacao de ficha invalida.',
        type: 'error',
      })
      return false
    }

    const nextWorkspace = {
      ...(isRecord(workspace) ? workspace : { version: 1 }),
      characters: characters.map((character, index) =>
        index === characterIndex ? nextCharacter : character,
      ),
    }

    saveJson(this.app, {
      data: nextWorkspace,
      name: 'workspace',
      scope: 'app',
    })
    this.onStorageChanged?.({
      name: 'workspace',
      scope: 'app',
      type: 'json',
    })
    writeOnlineLog('character:updated', {
      characterId,
      clientId: client.id,
      playerId: client.playerId,
      recursos: nextCharacter.recursos,
    })
    this.broadcastPublicState()
    return true
  }

  resolveIncomingLogEntry(entry, playerId, playerAccess, session) {
    if (!isRecord(entry)) {
      return null
    }

    const text = typeof entry.text === 'string' ? entry.text.trim() : ''

    if (entry.type === 'message' && text.startsWith('/')) {
      return this.createCommandLogEntry(text, playerId, playerAccess)
    }

    return sanitizePublicLogEntry(entry, playerId, playerAccess, session)
  }

  createCommandLogEntry(commandText, playerId, _playerAccess) {
    const author = getPlayerShortLabel(playerId)
    const command = commandText.trim().split(/\s+/)[0].toLowerCase()
    let text = ''

    if (command === '/help') {
      text =
        'Comandos: /help mostra comandos. /lastlog mostra o ultimo evento tecnico registrado no servidor.'
    } else if (command === '/lastlog') {
      text = `Ultimo log tecnico: ${readLastOnlineLogLine()}`
    } else {
      text = `Comando desconhecido: ${command}. Use /help.`
    }

    writeOnlineLog('command:chat', {
      author,
      command,
      playerId,
    })

    return {
      author: 'Servidor FUSHI',
      createdAt: new Date().toISOString(),
      id: `remote-command-${Date.now()}-${Math.round(Math.random() * 100000)}`,
      text,
      type: 'system',
      visibility: 'public',
    }
  }

  sendAdmissionStatus(client, input = {}) {
    if (!client || client.socket.destroyed || client.socket.writableEnded) {
      return
    }

    const status = input.status || this.getClientAdmissionStatus(client)
    sendWs(client.socket, {
      payload: {
        clientId: client.id,
        message:
          typeof input.message === 'string' && input.message
            ? input.message
            : status === 'accepted'
              ? 'Entrada liberada pelo mestre.'
              : status === 'pending'
                ? 'Aguardando o mestre liberar sua entrada.'
                : 'Entrada encerrada pelo mestre.',
        playerId: client.playerId || '',
        serverTime: Date.now(),
        status,
      },
      type: 'admission-status',
    })
  }

  updatePlayerAdmission(input = {}) {
    const action = typeof input.action === 'string' ? input.action : ''
    const clientId = typeof input.clientId === 'string' ? input.clientId : ''
    const playerId = typeof input.playerId === 'string' ? input.playerId : ''
    const client =
      (clientId && this.clients.get(clientId)) ||
      Array.from(this.clients.values()).find(
        (candidate) => PLAYER_IDS.has(playerId) && candidate.playerId === playerId,
      )

    if (!client || !PLAYER_IDS.has(client.playerId)) {
      return {
        error: 'Jogador nao encontrado ou ainda nao autenticado.',
        ok: false,
        status: this.getStatus(),
      }
    }

    if (action === 'accept') {
      client.admissionAcceptedAt = new Date().toISOString()
      client.admissionStatus = 'accepted'
      writeOnlineLog('admission:accepted', {
        clientId: client.id,
        playerId: client.playerId,
      })
      this.sendAdmissionStatus(client, {
        message: 'Entrada liberada pelo mestre.',
        status: 'accepted',
      })
      this.sendPublicState(client)
      this.broadcastPlayers()
      return {
        ok: true,
        status: this.getStatus(),
      }
    }

    if (action === 'reject' || action === 'kick') {
      const status = action === 'kick' ? 'kicked' : 'rejected'
      client.admissionStatus = status
      writeOnlineLog(`admission:${status}`, {
        clientId: client.id,
        playerId: client.playerId,
      })
      this.sendAdmissionStatus(client, {
        message:
          action === 'kick'
            ? 'Voce foi removido da mesa pelo mestre.'
            : 'Entrada recusada pelo mestre.',
        status,
      })
      setTimeout(() => {
        if (!client.socket.destroyed) {
          client.socket.destroy()
        }
      }, 60)
      this.broadcastPlayers()
      return {
        ok: true,
        status: this.getStatus(),
      }
    }

    return {
      error: 'Acao administrativa invalida.',
      ok: false,
      status: this.getStatus(),
    }
  }

  broadcastPlayers() {
    const payload = {
      payload: {
        players: this.getStatus().clients,
        status: this.getStatus(),
      },
      type: 'players',
    }

    this.clients.forEach((client) => sendWs(client.socket, payload))
  }

  startHeartbeat() {
    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      const now = Date.now()

      this.clients.forEach((client) => {
        if (client.socket.destroyed) {
          this.removeClient(client.id)
          return
        }

        if (now - (client.lastPongAt ?? now) > HEARTBEAT_STALE_MS) {
          writeOnlineLog('client:heartbeat-timeout', {
            clientId: client.id,
            playerId: client.playerId || 'aguardando_acesso',
          })
          client.socket.destroy()
          this.removeClient(client.id)
          return
        }

        client.lastPingSentAt = now
        sendWs(client.socket, {
          payload: { serverTime: now },
          type: 'server-ping',
        })
      })
    }, HEARTBEAT_INTERVAL_MS)
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  sendPublicState(client) {
    if (!PLAYER_IDS.has(client.playerId)) {
      this.sendSessionInfo(client)
      return
    }

    if (!this.isClientAccepted(client)) {
      this.sendAdmissionStatus(client, {
        message: 'Aguardando o mestre liberar sua entrada.',
        status: this.getClientAdmissionStatus(client),
      })
      return
    }

    writeOnlineLog('state:public-send', {
      clientId: client.id,
      playerId: client.playerId,
    })
    sendWs(client.socket, {
      payload: this.buildVersionedPublicState(client.playerId),
      type: 'public-state',
    })
  }

  sendSessionInfo(client) {
    const playerAccess = loadPlayerAccess(this.app, this.campaignId)

    writeOnlineLog('state:session-info-send', {
      clientId: client.id,
      playerId: client.playerId || 'aguardando_acesso',
    })
    sendWs(client.socket, {
      payload: {
        accessState: sanitizeAccessStateForRemoteLogin(playerAccess),
        campaignId: this.campaignId,
        status: this.getStatus(),
      },
      type: 'session-info',
    })
  }

  getAuthenticatedClientCount() {
    return Array.from(this.clients.values()).filter((client) =>
      this.isClientAccepted(client),
    ).length
  }

  broadcastPublicState(options = {}) {
    if (this.clients.size === 0) {
      return
    }

    this.stateVersion += 1

    if (options.immediate === true) {
      if (this.broadcastTimer) {
        clearTimeout(this.broadcastTimer)
        this.broadcastTimer = null
      }
      this.flushPublicStateBroadcast()
      return
    }

    if (this.broadcastTimer) {
      clearTimeout(this.broadcastTimer)
    }

    this.broadcastTimer = setTimeout(() => {
      this.broadcastTimer = null
      this.flushPublicStateBroadcast()
    }, BROADCAST_DEBOUNCE_MS)
  }

  flushPublicStateBroadcast() {
    writeOnlineLog('state:broadcast', {
      authenticatedClients: this.getAuthenticatedClientCount(),
      clients: this.clients.size,
    })
    this.clients.forEach((client) => {
      if (PLAYER_IDS.has(client.playerId)) {
        this.sendPublicState(client)
      } else {
        this.sendSessionInfo(client)
      }
    })
    this.broadcastPlayers()
  }

  handleStorageChanged(event) {
    if (this.clients.size === 0) {
      return
    }

    if (
      event?.scope === 'campaign' &&
      event?.campaignId === this.campaignId &&
      SESSION_STATE_NAMES.has(event?.name)
    ) {
      writeOnlineLog('storage:changed-campaign', {
        campaignId: event.campaignId,
        name: event.name,
        type: event.type,
      })
      this.broadcastPublicState()
      return
    }

    if (
      event?.scope === 'app' &&
      (event?.name === 'workspace' || event?.name === 'transitionPlayback')
    ) {
      writeOnlineLog('storage:changed-workspace', {
        name: event.name,
        type: event.type,
      })
      this.broadcastPublicState()
    }
  }
}

module.exports = {
  FushiMultiplayerServer,
  SERVER_VERSION,
}
