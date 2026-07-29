const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { FushiMultiplayerServer } = require('../electron/multiplayer-server.cjs')
const { saveJson, loadJson } = require('../electron/storage.cjs')

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fushi-multiplayer-'))
const campaignId = 'smoke-campaign'
const sessionCode = 'SMOKE1'
const app = {
  getPath(name) {
    if (name !== 'appData') {
      return tempRoot
    }

    return tempRoot
  },
  getVersion() {
    return '0.0.0-smoke'
  },
}

function writeSeedData() {
  const libraryAssetPath = path.join(
    tempRoot,
    'FUSHI',
    'library',
    'assets',
    'ui',
    'smoke-library.txt',
  )
  const tokens = Array.from({ length: 5 }, (_, index) => {
    const playerNumber = index + 1

    return {
      cell: { column: playerNumber, row: playerNumber },
      characterId: `hero-${playerNumber}`,
      color: '#92c0b6',
      controladoPorJogadorId: `player${playerNumber}`,
      id: `token-${playerNumber}`,
      label: `Heroi ${playerNumber}`,
      name: `Heroi ${playerNumber}`,
      persistentControl: {
        playerId: `player${playerNumber}`,
      },
      size: 'medium',
      stealth:
        playerNumber === 3
          ? {
              enabled: true,
              ownerPlayerId: 'player3',
            }
          : undefined,
      visibility: playerNumber === 2 ? 'gm' : 'public',
    }
  }).concat([
    {
      cell: { column: 6, row: 6 },
      characterId: 'mob-wolf',
      color: '#8a7562',
      id: 'token-wolf-1',
      label: 'LC1',
      mobId: 'mob-wolf',
      mobInstanceNumber: 1,
      resourceOverride: {
        determinacaoAtual: 1,
        determinacaoMaxima: 1,
        fushiAtual: 0,
        fushiMaximo: 0,
        vidaAtual: 4,
        vidaMaxima: 4,
      },
      size: 1,
      tokenKind: 'mob',
      visibility: 'gm',
    },
    {
      cell: { column: 7, row: 6 },
      characterId: 'mob-wolf',
      color: '#8a7562',
      id: 'token-wolf-2',
      label: 'LC2',
      mobId: 'mob-wolf',
      mobInstanceNumber: 2,
      resourceOverride: {
        determinacaoAtual: 1,
        determinacaoMaxima: 1,
        fushiAtual: 0,
        fushiMaximo: 0,
        vidaAtual: 2,
        vidaMaxima: 4,
      },
      size: 1,
      tokenKind: 'mob',
      visibility: 'gm',
    },
  ])

  fs.mkdirSync(path.dirname(libraryAssetPath), { recursive: true })
  fs.writeFileSync(libraryAssetPath, 'fushi-library-ok', 'utf8')

  saveJson(app, {
    campaignId,
    data: {
      activeProfileId: '',
      profiles: Array.from({ length: 5 }, (_, index) => {
        const playerNumber = index + 1

        return {
          characterId: `hero-${playerNumber}`,
          id: `player${playerNumber}`,
          label: `Jogador ${playerNumber}`,
          password: playerNumber === 1 ? '1234' : `${playerNumber}${playerNumber}${playerNumber}${playerNumber}`,
          role: 'player',
        }
      }),
      version: 1,
    },
    name: 'access',
    scope: 'campaign',
  })
  saveJson(app, {
    data: {
      campaigns: [{ id: campaignId, nome: 'Smoke Campaign' }],
      characters: [
        ...Array.from({ length: 5 }, (_, index) => {
          const playerNumber = index + 1
          const canonicalAvatarUrl =
            playerNumber === 1
              ? `fushi-asset://campaign/${campaignId}/images/hero-1.webp`
              : ''

          return {
            atributos: {
              agilidade: 1,
              forca: 1,
              intelecto: 1,
              presenca: 1,
              vigor: 1,
            },
            avatarUrl: canonicalAvatarUrl,
            id: `hero-${playerNumber}`,
            nome: `Heroi ${playerNumber}`,
            recursos: {
              determinacaoAtual: 3,
              determinacaoMaxima: 3,
              fushiAtual: 5,
              fushiMaximo: 5,
              vidaAtual: 10,
              vidaMaxima: 10,
            },
            combatProfile:
              playerNumber === 1
                ? {
                    build: {
                      archetype: 'tank',
                      items: [
                        {
                          catalogItemId: 'canonical-gm-build-item',
                          name: 'Build canonica do Mestre',
                          potency: 2,
                          rarity: 'comum',
                          rarityLabel: 'Comum',
                        },
                      ],
                      totals: { life: 7, damage: -3 },
                    },
                  }
                : undefined,
            tipo: 'player',
            tokenImageUrl: canonicalAvatarUrl,
            tokenSize: 'medium',
          }
        }),
        {
          atributos: {
            agilidade: 2,
            forca: 1,
            intelecto: 0,
            presenca: 0,
            vigor: 1,
          },
          avatarUrl: '',
          id: 'mob-wolf',
          nome: 'Lobo Smoke',
          recursos: {
            determinacaoAtual: 1,
            determinacaoMaxima: 1,
            fushiAtual: 0,
            fushiMaximo: 0,
            vidaAtual: 4,
            vidaMaxima: 4,
          },
          tipo: 'mob',
          tokenImageUrl: '',
          tokenSize: 1,
        },
      ],
      version: 1,
    },
    name: 'workspace',
    scope: 'app',
  })
  saveJson(app, {
    campaignId,
    data: {
      customAmbienceTracks: [],
      customMaps: [
        {
          cellSize: 100,
          gridColumns: 10,
          gridRows: 10,
          id: 'map-1',
          image: '',
          mapVisibility: 'preparado',
          name: 'Arena',
          stageHeight: 1000,
          stageWidth: 1000,
        },
      ],
      customMusicTracks: [
        {
          category: 'Musicas de trilha',
          folderId: '',
          id: 'music-smoke',
          libraryType: 'music',
          name: 'Trilha Smoke',
          source: '/assets/audio/smoke-theme.ogg',
          summary: 'Trilha global para validar reconexao no MSC.',
        },
      ],
      customTransitions: [],
      mapOverrides: {},
      trackVolumes: {
        'music-smoke': 0.42,
      },
      version: 1,
    },
    name: 'library',
    scope: 'campaign',
  })
  saveJson(app, {
    campaignId,
    data: {
      broadcastEvents: [],
      audioMixerState: {
        tracks: {
          'music-smoke': {
            currentTime: 12,
            duration: 120,
            status: 'playing',
            updatedAt: Date.now(),
            volume: 0.42,
          },
        },
        updatedAt: Date.now(),
      },
      currentSceneId: 'scene-1',
      initialSceneId: 'scene-1',
      isGridVisible: true,
      logEntries: [],
      publicCombatMarks: [
        {
          cancelableBySource: true,
          color: '#7c5ce7',
          createdAt: new Date().toISOString(),
          description: 'O proximo ataque do Heroi 1 causa o dobro de dano.',
          icon: 'science',
          id: 'combat-effect-cancel-smoke',
          kind: 'mark',
          label: 'Analise Cirurgica',
          sourceCharacterId: 'hero-1',
          sourceFeatureId: 'analysis-smoke',
          sourceTokenId: 'token-1',
          targetCharacterId: 'hero-4',
          targetTokenId: 'token-4',
        },
      ],
      scenes: [
        {
          id: 'scene-1',
          mapId: 'map-1',
          name: 'Cena Smoke',
          objects: [],
          tokens,
        },
      ],
      selectedTokenId: '',
      selectedTokenIds: [],
      tokens,
      turnState: {
        activeParticipantId: 'token-2',
        encounterId: 'turn-smoke',
        isActive: true,
        participants: [
          {
            characterId: 'hero-1',
            color: '#92c0b6',
            id: 'token-1',
            label: 'H1',
            name: 'Heroi 1',
            tokenId: 'token-1',
            tokenKind: 'player_corpo',
          },
          {
            characterId: 'hero-2',
            color: '#92c0b6',
            id: 'token-2',
            label: 'H2',
            name: 'Heroi 2 Oculto',
            tokenId: 'token-2',
            tokenKind: 'player_corpo',
          },
          {
            characterId: 'hero-3',
            color: '#92c0b6',
            id: 'token-3',
            label: 'H3',
            name: 'Heroi 3 Furtivo',
            tokenId: 'token-3',
            tokenKind: 'player_corpo',
          },
        ],
        round: 1,
        updatedAt: Date.now(),
        usedActions: {
          'token-2': {
            movimento: true,
          },
        },
      },
      trainingState: {
        arcId: 'vila-circuito-centro-v1',
        finalTrial: {
          contributorIds: ['player1'],
          isActive: false,
          isCompleted: false,
          isUnlocked: false,
          pressure: 0,
          progress: 0,
          stationIds: [],
        },
        gmNotes: 'nao pode chegar ao jogador',
        isActive: true,
        isCompleted: false,
        locationId: 'campo_treino_vila',
        mapId: 'map-1',
        participants: tokens.slice(0, 5).map((token, index) => ({
          activeStationId: 'escalada',
          characterId: token.characterId,
          color: token.color,
          id: `player${index + 1}`,
          label: `J${index + 1}`,
          name: `Heroi ${index + 1}`,
          playerId: `player${index + 1}`,
          stations: {
            escalada: {
              boldSuccesses: 0,
              dt: 12,
              progress: index === 0 ? 2 : 0,
              setbacks: 0,
              status: index === 0 ? 'active' : 'pending',
            },
          },
          tokenId: token.id,
        })),
        startedAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      },
      eventState: {
        events: {
          'initial-training': {
            activatedAt: Date.now() - 2000,
            isActive: true,
            restoreMapId: 'mapa-privado-smoke',
            updatedAt: Date.now(),
          },
          'build-rarity-draw': {
            activatedAt: Date.now() - 1000,
            isActive: true,
            updatedAt: Date.now(),
          },
          'skill-assignment': {
            activatedAt: Date.now() - 500,
            isActive: true,
            updatedAt: Date.now(),
          },
        },
        rarityDraw: {
          characterId: 'hero-1',
          characterName: 'Heroi 1',
          drawId: 'rarity-multiplayer-smoke',
          itemId: 'item-smoke',
          itemName: 'Item Smoke',
          lastRoll: 10,
          phase: 'rolling',
          rarity: 'mitico',
          revealAt: Date.now() + 2800,
          startedAt: Date.now(),
        },
        updatedAt: Date.now(),
        version: 1,
      },
      version: 16,
    },
    name: 'session',
    scope: 'campaign',
  })
  saveJson(app, {
    campaignId,
    data: {
      biomes: [
        {
          id: 'biome-1',
          nome: 'Planicie',
        },
      ],
      clock: null,
      locations: [
        {
          biomaId: 'biome-1',
          id: 'loc-1',
          nome: 'Clareira Smoke',
          posicao: { x: 24, y: 42 },
          previewImageUrl: '/assets/mundi/locations/loc_clareira_lobos.png',
        },
      ],
      parties: {
        party_smoke: {
          id: 'party_smoke',
          localAtualId: 'loc-1',
          memberPlayerIds: ['player1', 'player2', 'player3', 'player4', 'player5'],
          nome: 'Grupo Smoke',
        },
      },
      publicMap: {
        discoveredLocationIds: ['loc-1'],
        releasedToPlayers: true,
      },
      playerBase: {
        anchorLocationId: 'loc-1',
        bases: [
          {
            biomaId: 'biome-1',
            buffBioma: '+1 descanso local',
            buffMundo: '+1 retorno seguro',
            id: 'base-smoke',
            locationId: 'loc-1',
            nome: 'Base Smoke',
            resumo: 'Base publica do smoke multiplayer.',
            selectedUpgradeId: 'upgrade-smoke-active',
            upgrades: [
              {
                categoria: 'estrutura',
                dependsOnIds: [],
                efeitoMesa: 'Visivel para jogadores.',
                id: 'upgrade-smoke-active',
                nome: 'Upgrade Ativo',
                resumo: 'Upgrade ativo enviado ao jogador.',
                status: 'ativo',
                x: 33,
                y: 44,
              },
              {
                categoria: 'estrutura',
                dependsOnIds: [],
                efeitoMesa: 'Nao deve vazar.',
                id: 'upgrade-smoke-blocked',
                nome: 'Upgrade Bloqueado',
                resumo: 'Upgrade bloqueado nao deve ir ao jogador.',
                status: 'bloqueado',
                x: 50,
                y: 50,
              },
            ],
          },
        ],
        releasedToPlayers: true,
        selectedBaseId: 'base-smoke',
        upgrades: [
          {
            categoria: 'estrutura',
            dependsOnIds: [],
            efeitoMesa: 'Resumo ativo da base.',
            id: 'upgrade-smoke-active',
            nome: 'Upgrade Ativo',
            resumo: 'Resumo ativo enviado ao jogador.',
            status: 'ativo',
            x: 33,
            y: 44,
          },
          {
            categoria: 'estrutura',
            dependsOnIds: [],
            efeitoMesa: 'Nao deve vazar.',
            id: 'upgrade-smoke-blocked',
            nome: 'Upgrade Bloqueado',
            resumo: 'Resumo bloqueado nao deve ir ao jogador.',
            status: 'bloqueado',
            x: 50,
            y: 50,
          },
        ],
      },
      selectedPartyId: '',
      version: 1,
    },
    name: 'mundi',
    scope: 'campaign',
  })
  saveJson(app, {
    campaignId,
    data: {},
    name: 'transitionOverrides',
    scope: 'campaign',
  })
}

function waitForMessage(socket, predicate, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const waitingFrom = new Error('waitForMessage chamado aqui')
    const timeoutId = setTimeout(() => {
      socket.removeEventListener('message', handleMessage)
      reject(
        new Error(
          `Timeout aguardando mensagem multiplayer.\n${waitingFrom.stack ?? ''}`,
        ),
      )
    }, timeoutMs)

    function handleMessage(event) {
      const message = JSON.parse(String(event.data))

      if (!predicate(message)) {
        return
      }

      clearTimeout(timeoutId)
      socket.removeEventListener('message', handleMessage)
      resolve(message)
    }

    socket.addEventListener('message', handleMessage)
  })
}

async function connectAndAuthenticate(
  port,
  profileId,
  password,
  server,
  clientInstanceId = `smoke-instance-${profileId}`,
) {
  const socket = new WebSocket(
    `ws://127.0.0.1:${port}/session?code=${sessionCode}&clientInstanceId=${encodeURIComponent(clientInstanceId)}`,
  )

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  const sessionInfoPromise = waitForMessage(socket, (message) => message.type === 'session-info')
  socket.send(JSON.stringify({ type: 'request-state' }))
  await sessionInfoPromise

  const authOkPromise = waitForMessage(socket, (message) => message.type === 'auth-ok')
  const pendingAdmissionPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'admission-status' && message.payload?.status === 'pending',
  )
  socket.send(JSON.stringify({
    password,
    profileId,
    type: 'authenticate',
  }))
  await authOkPromise
  await pendingAdmissionPromise

  const initialPublicStatePromise = waitForMessage(socket, (message) => message.type === 'public-state')
  const admissionResult = server.updatePlayerAdmission({
    action: 'accept',
    playerId: profileId,
  })

  if (!admissionResult.ok) {
    throw new Error(`Mestre nao conseguiu liberar ${profileId}: ${admissionResult.error}`)
  }

  const publicStateMessage = await initialPublicStatePromise

  if (publicStateMessage.payload?.playerId !== profileId) {
    throw new Error(`Estado publico nao veio no perfil autenticado ${profileId}.`)
  }

  return { clientInstanceId, publicStateMessage, socket }
}

async function connectPendingAdmission(
  port,
  profileId,
  password,
  clientInstanceId = `smoke-pending-${profileId}-${Date.now()}`,
) {
  const socket = new WebSocket(
    `ws://127.0.0.1:${port}/session?code=${sessionCode}&clientInstanceId=${encodeURIComponent(clientInstanceId)}`,
  )

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  const sessionInfoPromise = waitForMessage(socket, (message) => message.type === 'session-info')
  socket.send(JSON.stringify({ type: 'request-state' }))
  await sessionInfoPromise

  const authOkPromise = waitForMessage(socket, (message) => message.type === 'auth-ok')
  const pendingAdmissionPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'admission-status' && message.payload?.status === 'pending',
  )
  socket.send(JSON.stringify({
    password,
    profileId,
    type: 'authenticate',
  }))
  await authOkPromise
  const pendingAdmissionMessage = await pendingAdmissionPromise
  const clientId = pendingAdmissionMessage.payload?.clientId

  if (typeof clientId !== 'string' || !clientId) {
    throw new Error('Pedido pendente nao informou clientId para controle do mestre.')
  }

  return { clientId, clientInstanceId, socket }
}

async function reconnectAcceptedInstance(
  port,
  profileId,
  password,
  clientInstanceId,
) {
  const socket = new WebSocket(
    `ws://127.0.0.1:${port}/session?code=${sessionCode}&clientInstanceId=${encodeURIComponent(clientInstanceId)}`,
  )

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  const sessionInfoPromise = waitForMessage(socket, (message) => message.type === 'session-info')
  socket.send(JSON.stringify({ type: 'request-state' }))
  await sessionInfoPromise

  const authOkPromise = waitForMessage(socket, (message) => message.type === 'auth-ok')
  const acceptedPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'admission-status' && message.payload?.status === 'accepted',
  )
  const publicStatePromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' && message.payload?.playerId === profileId,
  )
  socket.send(JSON.stringify({
    password,
    profileId,
    type: 'authenticate',
  }))
  await authOkPromise
  await acceptedPromise
  const publicStateMessage = await publicStatePromise

  return { publicStateMessage, socket }
}

function closeSocket(socket) {
  return new Promise((resolve) => {
    if (socket.readyState === WebSocket.CLOSED) {
      resolve()
      return
    }

    socket.addEventListener('close', resolve, { once: true })
    socket.close()
  })
}

async function postRemoteAction(
  port,
  playerId,
  message,
  actionId,
  clientInstanceId = `smoke-instance-${playerId}`,
) {
  const response = await fetch(`http://127.0.0.1:${port}/action`, {
    body: JSON.stringify({
      actionId,
      clientInstanceId,
      code: sessionCode,
      message: {
        ...message,
        remoteActionId: actionId,
      },
      playerId,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
  const payload = await response.json()

  return { payload, response }
}

async function run() {
  if (typeof WebSocket !== 'function') {
    throw new Error('WebSocket global nao esta disponivel neste Node.')
  }

  writeSeedData()

  const server = new FushiMultiplayerServer(app, {
    campaignId,
    port: 0,
    sessionCode,
  })

  const status = await server.start()
  const healthResponse = await fetch(`http://127.0.0.1:${status.port}/health`)
  const health = await healthResponse.json()

  if (!health.isRunning || health.sessionCode !== sessionCode) {
    throw new Error('Healthcheck multiplayer invalido.')
  }

  if (
    health.protocolVersion !== 3 ||
    health.serverVersion !== 'multiplayer-v3' ||
    typeof health.serverInstanceId !== 'string' ||
    !health.serverInstanceId ||
    !Number.isSafeInteger(health.stateVersion)
  ) {
    throw new Error('Servidor nao publicou identidade e versao monotona do protocolo multiplayer.')
  }

  const libraryAssetResponse = await fetch(
    `http://127.0.0.1:${status.port}/assets/library/ui/smoke-library.txt`,
  )
  const libraryAssetText = await libraryAssetResponse.text()

  if (!libraryAssetResponse.ok || libraryAssetText !== 'fushi-library-ok') {
    throw new Error('Servidor multiplayer nao serviu asset da biblioteca.')
  }

  const playerOneConnection = await connectAndAuthenticate(
    status.port,
    'player1',
    '1234',
    server,
  )
  const { clientInstanceId: playerOneInstanceId, publicStateMessage } = playerOneConnection
  let socket = playerOneConnection.socket
  const extraSockets = []

  for (const playerNumber of [2, 3, 4, 5]) {
    const { socket: extraSocket } = await connectAndAuthenticate(
      status.port,
      `player${playerNumber}`,
      `${playerNumber}${playerNumber}${playerNumber}${playerNumber}`,
      server,
    )
    extraSockets.push(extraSocket)
  }

  if (server.getAuthenticatedClientCount() !== 5) {
    throw new Error('Servidor multiplayer nao manteve os 5 jogadores conectados.')
  }

  await closeSocket(socket)
  const resumedConnection = await reconnectAcceptedInstance(
    status.port,
    'player1',
    '1234',
    playerOneInstanceId,
  )
  socket = resumedConnection.socket

  const acceptedPlayerAfterResume = server
    .getStatus()
    .clients.find(
      (client) =>
        client.playerId === 'player1' &&
        client.clientInstanceId === playerOneInstanceId,
    )

  if (
    acceptedPlayerAfterResume?.admissionStatus !== 'accepted' ||
    server.getAuthenticatedClientCount() !== 5
  ) {
    throw new Error('Reentrada em socket novo da mesma instancia voltou para pending ou duplicou o jogador.')
  }

  if (publicStateMessage.payload?.playerId !== 'player1') {
    throw new Error('Estado publico nao veio no perfil autenticado.')
  }

  const initialServerInstanceId = publicStateMessage.payload?.serverInstanceId
  const initialStateVersion = publicStateMessage.payload?.stateVersion

  if (
    publicStateMessage.payload?.protocolVersion !== 3 ||
    initialServerInstanceId !== health.serverInstanceId ||
    !Number.isSafeInteger(initialStateVersion) ||
    initialStateVersion < 1
  ) {
    throw new Error('Snapshot inicial nao trouxe versao/instancia valida do servidor.')
  }

  if (publicStateMessage.payload?.world?.publicMap?.releasedToPlayers !== true) {
    throw new Error('Estado publico do Mundi veio incompleto para o jogador.')
  }

  if (publicStateMessage.payload?.world?.publicLocations?.[0]?.id !== 'loc-1') {
    throw new Error('Local publico do Mundi nao foi enviado ao jogador.')
  }

  if (publicStateMessage.payload?.world?.publicBase?.releasedToPlayers !== true) {
    throw new Error('Estado publico da BASE nao foi enviado ao jogador.')
  }

  if (publicStateMessage.payload?.world?.publicBase?.bases?.[0]?.id !== 'base-smoke') {
    throw new Error('Base publica liberada nao chegou ao jogador.')
  }

  const publicBaseUpgrades =
    publicStateMessage.payload?.world?.publicBase?.upgrades ?? []

  if (
    publicBaseUpgrades.length !== 1 ||
    publicBaseUpgrades[0]?.id !== 'upgrade-smoke-active'
  ) {
    throw new Error('BASE publica vazou upgrade bloqueado ou perdeu upgrade ativo.')
  }

  if (
    publicStateMessage.payload?.tabletopSession?.tokens?.some?.(
      (token) => token.characterId === 'mob-wolf',
    )
  ) {
    throw new Error('Mob oculto duplicado vazou para o estado publico do jogador.')
  }

  const seededSession = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })
  const duplicatedMobTokens = seededSession.tokens.filter(
    (token) => token.characterId === 'mob-wolf',
  )

  if (
    duplicatedMobTokens.length !== 2 ||
    duplicatedMobTokens[0]?.mobInstanceNumber !== 1 ||
    duplicatedMobTokens[1]?.mobInstanceNumber !== 2 ||
    duplicatedMobTokens[0]?.resourceOverride?.vidaAtual ===
      duplicatedMobTokens[1]?.resourceOverride?.vidaAtual
  ) {
    throw new Error('Instancias duplicadas de mob nao foram preservadas com recursos independentes.')
  }

  const initialTurnState = publicStateMessage.payload?.tabletopSession?.turnState

  if (
    initialTurnState?.activeParticipantId !== '' ||
    initialTurnState?.participants?.length !== 1 ||
    initialTurnState.participants[0]?.tokenId !== 'token-1'
  ) {
    throw new Error('Turno publico revelou participante oculto/furtivo para jogador errado.')
  }

  const initialTrainingState =
    publicStateMessage.payload?.tabletopSession?.trainingState
  const publicTrainingText = JSON.stringify(initialTrainingState)
  const publicTrainingParticipantIds =
    initialTrainingState?.participants?.map?.((participant) => participant.id) ?? []

  if (
    initialTrainingState?.isActive !== true ||
    initialTrainingState?.participants?.find?.((participant) => participant.id === 'player1')
      ?.stations?.escalada?.progress !== 2 ||
    publicTrainingParticipantIds.length !== 5 ||
    !publicTrainingParticipantIds.includes('player2') ||
    !publicTrainingParticipantIds.includes('player3') ||
    publicTrainingText.includes('gmNotes') ||
    publicTrainingText.includes('"dt"')
  ) {
    throw new Error('Treinamento publico perdeu progresso ou vazou controle do Mestre.')
  }

  const initialEventState = publicStateMessage.payload?.tabletopSession?.eventState
  const publicEventText = JSON.stringify(initialEventState)

  if (
    initialEventState?.events?.['initial-training']?.isActive !== true ||
    initialEventState?.events?.['build-rarity-draw']?.isActive !== true ||
    initialEventState?.events?.['skill-assignment']?.isActive !== true ||
    initialEventState?.rarityDraw?.drawId !== 'rarity-multiplayer-smoke' ||
    initialEventState?.rarityDraw?.rarity !== 'mitico' ||
    publicEventText.includes('lastRoll') ||
    publicEventText.includes('restoreMapId') ||
    publicEventText.includes('mapa-privado-smoke')
  ) {
    throw new Error('EVE publico perdeu apresentacao ou vazou estado privado do Mestre.')
  }

  const initialCombatEffect =
    publicStateMessage.payload?.tabletopSession?.publicCombatMarks?.find?.(
      (effect) => effect.id === 'combat-effect-cancel-smoke',
    )

  if (
    initialCombatEffect?.sourceTokenId !== 'token-1' ||
    initialCombatEffect?.targetTokenId !== 'token-4' ||
    initialCombatEffect?.cancelableBySource !== true ||
    initialCombatEffect?.description !==
      'O proximo ataque do Heroi 1 causa o dobro de dano.' ||
    Object.hasOwn(initialCombatEffect ?? {}, 'sourceCharacterId') ||
    Object.hasOwn(initialCombatEffect ?? {}, 'sourceFeatureId') ||
    Object.hasOwn(initialCombatEffect ?? {}, 'targetCharacterId')
  ) {
    throw new Error(
      'Efeito de combate publico perdeu contexto seguro ou vazou IDs internos.',
    )
  }

  const cancelledEffectStatePromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' &&
      !message.payload?.tabletopSession?.publicCombatMarks?.some?.(
        (effect) => effect.id === 'combat-effect-cancel-smoke',
      ),
  )
  const cancelledEffectAckPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'action-ack' &&
      message.payload?.actionId === 'smoke-action-cancel-effect-ws' &&
      message.payload?.applied === true,
  )
  socket.send(JSON.stringify({
    effectId: 'combat-effect-cancel-smoke',
    remoteActionId: 'smoke-action-cancel-effect-ws',
    type: 'cancel-combat-effect',
  }))
  await cancelledEffectAckPromise
  await cancelledEffectStatePromise

  const cancelledEffectSession = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })

  if (
    cancelledEffectSession.publicCombatMarks?.some(
      (effect) => effect.id === 'combat-effect-cancel-smoke',
    )
  ) {
    throw new Error('Cancelamento remoto confirmou ACK sem remover o efeito canonico.')
  }

  const { payload: replayedEffect, response: replayedEffectResponse } =
    await postRemoteAction(
      status.port,
      'player1',
      {
        effectId: 'combat-effect-cancel-smoke',
        type: 'cancel-combat-effect',
      },
      'smoke-action-cancel-effect-ws',
    )

  if (
    !replayedEffectResponse.ok ||
    replayedEffect.ok !== true ||
    replayedEffect.applied !== true ||
    replayedEffect.actionId !== 'smoke-action-cancel-effect-ws'
  ) {
    throw new Error(
      'Replay do cancelamento de efeito nao preservou ACK idempotente.',
    )
  }

  const combatReceiptPlayerOnePromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' &&
      message.payload?.tabletopSession?.publicCombatReceipt?.id ===
        'combat-receipt-multiplayer-smoke',
  ).catch((error) => {
    throw new Error(`J1 nao recebeu recibo de combate: ${error.message}`)
  })
  const combatReceiptPlayerTwoPromise = waitForMessage(
    extraSockets[0],
    (message) =>
      message.type === 'public-state' &&
      message.payload?.tabletopSession?.publicCombatReceipt?.id ===
        'combat-receipt-multiplayer-smoke',
  ).catch((error) => {
    throw new Error(`J2 nao recebeu recibo de combate: ${error.message}`)
  })
  const combatReceiptUninvolvedPromise = waitForMessage(
    extraSockets[1],
    (message) =>
      message.type === 'public-state' &&
      message.payload?.tabletopSession?.publicCombatImpacts?.some?.(
        (impact) => impact.id === 'combat-impact-multiplayer-smoke',
      ) &&
      message.payload?.tabletopSession?.publicCombatReceipt === null,
  ).catch((error) => {
    throw new Error(`J3 nao recebeu impacto sem recibo privado: ${error.message}`)
  })
  const sessionWithCombatReceipt = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })
  sessionWithCombatReceipt.publicCombatImpacts = [
    ...(sessionWithCombatReceipt.publicCombatImpacts ?? []),
    {
      amount: 3,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5000,
      id: 'combat-impact-multiplayer-smoke',
      kind: 'damage',
      sceneId: 'scene-1',
      tokenId: 'token-1',
    },
  ]
  sessionWithCombatReceipt.publicCombatReceipt = {
    attackerName: 'Heroi 1',
    createdAt: Date.now(),
    damageApplied: 3,
    healingApplied: 0,
    id: 'combat-receipt-multiplayer-smoke',
    outcome: 'hit',
    resourceChangesByPlayerId: {
      player1: [
        {
          after: 3,
          before: 5,
          label: 'FUSHI',
        },
      ],
      player2: [
        {
          after: 7,
          before: 10,
          label: 'Vida',
        },
      ],
    },
    sceneId: 'scene-1',
    summary: 'Heroi 1 causou 3 de dano em Heroi 2.',
    targetName: 'Heroi 2',
    visibleToPlayerIds: ['player1', 'player2'],
  }
  saveJson(app, {
    campaignId,
    data: sessionWithCombatReceipt,
    name: 'session',
    scope: 'campaign',
  })
  server.handleStorageChanged({
    campaignId,
    name: 'session',
    scope: 'campaign',
    type: 'json',
  })
  const combatReceiptPlayerOne =
    (await combatReceiptPlayerOnePromise).payload?.tabletopSession?.publicCombatReceipt
  const combatReceiptPlayerTwo =
    (await combatReceiptPlayerTwoPromise).payload?.tabletopSession?.publicCombatReceipt
  await combatReceiptUninvolvedPromise

  if (
    combatReceiptPlayerOne?.resourceChangesByPlayerId?.player1?.[0]?.label !== 'FUSHI' ||
    combatReceiptPlayerOne?.resourceChangesByPlayerId?.player2 !== undefined ||
    combatReceiptPlayerOne?.visibleToPlayerIds?.length !== 1 ||
    combatReceiptPlayerOne.visibleToPlayerIds[0] !== 'player1'
  ) {
    throw new Error('Recibo de combate do J1 vazou recursos do alvo.')
  }

  if (
    combatReceiptPlayerTwo?.resourceChangesByPlayerId?.player2?.[0]?.label !== 'Vida' ||
    combatReceiptPlayerTwo?.resourceChangesByPlayerId?.player1 !== undefined ||
    combatReceiptPlayerTwo?.visibleToPlayerIds?.length !== 1 ||
    combatReceiptPlayerTwo.visibleToPlayerIds[0] !== 'player2'
  ) {
    throw new Error('Recibo de combate do J2 vazou recursos do atacante.')
  }

  const publicCombatPreviewPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' &&
      message.payload?.tabletopSession?.publicCombatPreview?.id === 'combat-preview-smoke',
  )
  const sessionWithPublicCombatPreview = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })
  sessionWithPublicCombatPreview.publicCombatPreview = {
    color: '#8e6cff',
    createdAt: Date.now(),
    expiresAt: Date.now() + 5000,
    id: 'combat-preview-smoke',
    label: 'Barulho Torturante | raio 5 m',
    origin: { column: 1, row: 1 },
    radiusMeters: 5,
    sceneId: 'scene-1',
    shape: 'radius',
    sourceTokenId: 'token-1',
  }
  saveJson(app, {
    campaignId,
    data: sessionWithPublicCombatPreview,
    name: 'session',
    scope: 'campaign',
  })
  server.handleStorageChanged({
    campaignId,
    name: 'session',
    scope: 'campaign',
    type: 'json',
  })
  const publicCombatPreviewMessage = await publicCombatPreviewPromise
  const publicCombatPreview = publicCombatPreviewMessage.payload?.tabletopSession?.publicCombatPreview

  if (
    publicCombatPreview?.color !== '#8e6cff' ||
    publicCombatPreview?.shape !== 'radius' ||
    publicCombatPreview?.sourceTokenId !== 'token-1' ||
    publicCombatPreview?.sceneId !== 'scene-1'
  ) {
    throw new Error('Preview de area de combate nao chegou ao Jogador com os dados publicos esperados.')
  }

  const expiredCombatPreviewPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' &&
      !message.payload?.tabletopSession?.publicCombatPreview,
  )
  const sessionWithExpiredCombatPreview = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })
  sessionWithExpiredCombatPreview.publicCombatPreview = {
    ...sessionWithExpiredCombatPreview.publicCombatPreview,
    createdAt: Date.now() - 5000,
    expiresAt: Date.now() - 1000,
    id: 'combat-preview-expired-smoke',
  }
  saveJson(app, {
    campaignId,
    data: sessionWithExpiredCombatPreview,
    name: 'session',
    scope: 'campaign',
  })
  server.handleStorageChanged({
    campaignId,
    name: 'session',
    scope: 'campaign',
    type: 'json',
  })
  await expiredCombatPreviewPromise

  if (!publicStateMessage.payload?.libraryState?.customMaps?.some?.((map) => map.id === 'map-1')) {
    throw new Error('Mapa ativo preparado nao foi enviado ao jogador.')
  }

  if (
    publicStateMessage.payload?.tabletopSession?.audioMixerState?.tracks?.['music-smoke']
      ?.status !== 'playing' ||
    !publicStateMessage.payload?.libraryState?.customMusicTracks?.some?.(
      (track) => track.id === 'music-smoke',
    )
  ) {
    throw new Error('MSC global ativo nao foi enviado ao jogador ao entrar na mesa.')
  }

  const revealTurnPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' &&
      message.payload?.tabletopSession?.turnState?.participants?.some?.(
        (participant) => participant.tokenId === 'token-2',
      ) &&
      !message.payload?.tabletopSession?.turnState?.participants?.some?.(
        (participant) => participant.tokenId === 'token-3',
      ),
  )
  const sessionWithRevealedTurn = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })
  sessionWithRevealedTurn.scenes[0].tokens[1].visibility = 'public'
  sessionWithRevealedTurn.tokens[1].visibility = 'public'
  saveJson(app, {
    campaignId,
    data: sessionWithRevealedTurn,
    name: 'session',
    scope: 'campaign',
  })
  server.handleStorageChanged({
    campaignId,
    name: 'session',
    scope: 'campaign',
    type: 'json',
  })
  const revealTurnMessage = await revealTurnPromise

  if (
    revealTurnMessage.payload?.serverInstanceId !== initialServerInstanceId ||
    !Number.isSafeInteger(revealTurnMessage.payload?.stateVersion) ||
    revealTurnMessage.payload.stateVersion <= initialStateVersion
  ) {
    throw new Error('Broadcast de estado nao avancou stateVersion de forma monotona.')
  }

  const httpStateResponse = await fetch(
    `http://127.0.0.1:${status.port}/state?code=${sessionCode}&playerId=player1&clientInstanceId=${encodeURIComponent(playerOneInstanceId)}`,
  )
  const httpState = await httpStateResponse.json()

  if (!httpStateResponse.ok || httpState.publicState?.playerId !== 'player1') {
    throw new Error('Fallback HTTP de estado publico falhou.')
  }

  const foreignInstanceStateResponse = await fetch(
    `http://127.0.0.1:${status.port}/state?code=${sessionCode}&playerId=player1&clientInstanceId=smoke-foreign-instance`,
  )
  if (foreignInstanceStateResponse.status !== 403) {
    throw new Error('HTTP aceitou instancia que o Mestre nunca liberou.')
  }

  if (
    httpState.publicState?.serverInstanceId !== initialServerInstanceId ||
    httpState.publicState?.stateVersion < revealTurnMessage.payload.stateVersion
  ) {
    throw new Error('Fallback HTTP retornou snapshot anterior ao ultimo broadcast.')
  }

  const { payload: httpMove, response: httpMoveResponse } = await postRemoteAction(
    status.port,
    'player1',
    {
      cell: { column: 2, row: 3 },
      tokenId: 'token-1',
      type: 'move-token',
    },
    'smoke-action-move-http',
  )

  if (
    !httpMoveResponse.ok ||
    httpMove.ok !== false ||
    httpMove.applied !== false ||
    httpMove.actionId !== 'smoke-action-move-http' ||
    httpMove.publicState?.tabletopSession?.tokens?.[0]?.cell?.column !== 1 ||
    httpMove.publicState?.tabletopSession?.tokens?.[0]?.cell?.row !== 1 ||
    !String(httpMove.error ?? '').includes('Mestre')
  ) {
    throw new Error('Fallback HTTP nao bloqueou movimento remoto de jogador.')
  }

  const movedAckPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'action-ack' &&
      message.payload?.actionId === 'smoke-action-move-ws' &&
      message.payload?.applied === false &&
      String(message.payload?.message ?? '').includes('Mestre'),
  )
  const movedErrorPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'error' &&
      String(message.message ?? '').includes('Mestre'),
  )
  socket.send(JSON.stringify({
    cell: { column: 3, row: 4 },
    remoteActionId: 'smoke-action-move-ws',
    tokenId: 'token-1',
    type: 'move-token',
  }))
  await movedAckPromise
  await movedErrorPromise

  const logStatePromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' &&
      message.payload?.tabletopSession?.logEntries?.some?.(
        (entry) => entry.text === 'Teste multiplayer',
      ),
  )
  const logAckPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'action-ack' &&
      message.payload?.actionId === 'smoke-action-log-ws' &&
      message.payload?.applied === true,
  )
  socket.send(JSON.stringify({
    entry: {
      createdAt: new Date().toISOString(),
      id: 'log-smoke',
      text: 'Teste multiplayer',
      type: 'message',
      visibility: 'public',
    },
    remoteActionId: 'smoke-action-log-ws',
    type: 'add-log-entry',
  }))
  await logAckPromise
  await logStatePromise

  const combatLogStatePromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' &&
      message.payload?.tabletopSession?.logEntries?.some?.(
        (entry) =>
          entry.id === 'roll-combat-smoke' &&
          entry.roll?.total === 17 &&
          entry.combat === undefined,
      ),
  )
  const combatLogAckPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'action-ack' &&
      message.payload?.actionId === 'smoke-action-combat-log-ws' &&
      message.payload?.applied === true,
  )
  socket.send(JSON.stringify({
    entry: {
      combat: {
        attackerCharacterId: 'hero-1',
        attackerName: 'Heroi 1',
        attackerTokenId: 'token-1',
        attackName: 'Mordida Smoke',
        damageFormula: '1d6 + 1',
        kind: 'attack',
        rollText: '= maior dado de 1d20 + 2 => 17',
        rollTotal: 17,
        sourceFeatureId: 'attack-smoke',
      },
      createdAt: new Date().toISOString(),
      id: 'roll-combat-smoke',
      roll: {
        bonus: 2,
        contexto: 'Mordida Smoke',
        modo: 'highest',
        quantidadeDados: 1,
        resultadoBase: 15,
        resultados: [15],
        resultadoTexto: '= maior dado de 1d20 + 2 => 17',
        tipoDado: 20,
        total: 17,
      },
      text: 'Heroi 1 atacou com Mordida Smoke.',
      type: 'roll',
      visibility: 'public',
    },
    remoteActionId: 'smoke-action-combat-log-ws',
    type: 'add-log-entry',
  }))
  await combatLogAckPromise
  await combatLogStatePromise

  const { payload: replayedRoll, response: replayedRollResponse } = await postRemoteAction(
    status.port,
    'player1',
    {
      entry: {
        createdAt: new Date().toISOString(),
        id: 'roll-combat-smoke-replay-should-not-save',
        roll: {
          bonus: 0,
          modo: 'sum',
          quantidadeDados: 1,
          resultadoBase: 1,
          resultados: [1],
          resultadoTexto: 'Replay nao deve duplicar',
          tipoDado: 20,
          total: 1,
        },
        text: 'Replay nao deve duplicar',
        type: 'roll',
        visibility: 'public',
      },
      type: 'add-log-entry',
    },
    'smoke-action-combat-log-ws',
  )

  if (
    !replayedRollResponse.ok ||
    replayedRoll.ok !== true ||
    replayedRoll.applied !== true ||
    replayedRoll.actionId !== 'smoke-action-combat-log-ws'
  ) {
    throw new Error('Replay de remoteActionId aceito nao respondeu como acao idempotente.')
  }

  const replaySession = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })

  if (
    replaySession.logEntries.some(
      (entry) => entry.id === 'roll-combat-smoke-replay-should-not-save',
    )
  ) {
    throw new Error('Replay de remoteActionId duplicou entrada de rolagem no log.')
  }

  const { payload: cooldownRoll, response: cooldownRollResponse } = await postRemoteAction(
    status.port,
    'player1',
    {
      entry: {
        createdAt: new Date().toISOString(),
        id: 'roll-cooldown-smoke',
        roll: {
          bonus: 0,
          modo: 'sum',
          quantidadeDados: 1,
          resultadoBase: 12,
          resultados: [12],
          resultadoTexto: 'Cooldown dado player1',
          tipoDado: 20,
          total: 12,
        },
        text: 'Cooldown dado player1',
        type: 'roll',
        visibility: 'public',
      },
      type: 'add-log-entry',
    },
    'smoke-action-roll-cooldown',
  )

  if (
    !cooldownRollResponse.ok ||
    cooldownRoll.ok !== false ||
    cooldownRoll.applied !== false ||
    typeof cooldownRoll.error !== 'string' ||
    !cooldownRoll.error.includes('Espere')
  ) {
    throw new Error('Cooldown de rolagem remota nao bloqueou duplicidade do mesmo jogador.')
  }

  const burstPlayers = ['player2', 'player3', 'player4', 'player5']
  const burstRolls = await Promise.all(
    burstPlayers.map((playerId, index) =>
      postRemoteAction(
        status.port,
        playerId,
        {
          entry: {
            createdAt: new Date().toISOString(),
            id: `roll-burst-${playerId}`,
            roll: {
              bonus: 0,
              modo: 'sum',
              quantidadeDados: 1,
              resultadoBase: 10 + index,
              resultados: [10 + index],
              resultadoTexto: `Fila dado ${playerId}`,
              tipoDado: 20,
              total: 10 + index,
            },
            text: `Fila dado ${playerId}`,
            type: 'roll',
            visibility: 'public',
          },
          type: 'add-log-entry',
        },
        `smoke-action-roll-burst-${playerId}`,
      ),
    ),
  )

  if (
    burstRolls.some(
      ({ payload, response }, index) =>
        !response.ok ||
        payload.ok !== true ||
        payload.applied !== true ||
        payload.actionId !== `smoke-action-roll-burst-${burstPlayers[index]}`,
    )
  ) {
    throw new Error('Fila de rolagens remotas por jogadores diferentes teve falha de ACK.')
  }

  const burstStateResponse = await fetch(
    `http://127.0.0.1:${status.port}/state?code=${sessionCode}&playerId=player1&clientInstanceId=${encodeURIComponent(playerOneInstanceId)}`,
  )
  const burstState = await burstStateResponse.json()
  const burstCount =
    burstState.publicState?.tabletopSession?.logEntries?.filter?.(
      (entry) => typeof entry.id === 'string' && entry.id.startsWith('roll-burst-'),
    ).length ?? 0

  if (burstCount !== burstPlayers.length) {
    throw new Error(
      `Fila de dados remotos perdeu entradas: ${burstCount}/${burstPlayers.length}.`,
    )
  }

  const { payload: rejectedMove, response: rejectedMoveResponse } = await postRemoteAction(
    status.port,
    'player1',
    {
      cell: { column: 8, row: 8 },
      tokenId: 'token-2',
      type: 'move-token',
    },
    'smoke-action-move-rejected',
  )

  if (
    !rejectedMoveResponse.ok ||
    rejectedMove.ok !== false ||
    rejectedMove.applied !== false
  ) {
    throw new Error('Movimento sem permissao nao foi rejeitado de forma confiavel.')
  }

  const measurementStatePromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' &&
      message.payload?.tabletopSession?.activeMeasurement?.authorLabel === 'J1' &&
      message.payload?.tabletopSession?.activeMeasurement?.visualColor === '#654dd8',
  )
  const measurementAckPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'action-ack' &&
      message.payload?.actionId === 'smoke-action-measure-ws' &&
      message.payload?.applied === true,
  )
  socket.send(JSON.stringify({
    measurement: {
      start: { column: 1, row: 1 },
      end: { column: 4, row: 5 },
      visualColor: '#654dd8',
    },
    remoteActionId: 'smoke-action-measure-ws',
    type: 'update-measurement',
  }))
  await measurementAckPromise
  await measurementStatePromise

  const measurementBurstStatePromise = waitForMessage(
    socket,
    (message) => {
      const activeMeasurement = message.payload?.tabletopSession?.activeMeasurement
      return (
        message.type === 'public-state' &&
        activeMeasurement?.authorLabel === 'J1' &&
        activeMeasurement?.visualColor === '#654dd8' &&
        activeMeasurement?.start?.column === 1 &&
        activeMeasurement?.start?.row === 1 &&
        activeMeasurement?.end?.column === 10 &&
        activeMeasurement?.end?.row === 11
      )
    },
  )
  const measurementBurstFinalAckPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'action-ack' &&
      message.payload?.actionId === 'smoke-action-measure-burst-11' &&
      message.payload?.applied === true,
  )

  for (let index = 0; index < 12; index += 1) {
    socket.send(JSON.stringify({
      measurement: {
        start: { column: 1, row: 1 },
        end: { column: Math.min(10, index + 2), row: Math.min(11, index + 3) },
        visualColor: '#654dd8',
      },
      remoteActionId: `smoke-action-measure-burst-${index}`,
      type: 'update-measurement',
    }))
  }

  await measurementBurstFinalAckPromise
  await measurementBurstStatePromise

  const playerMeasurementSession = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })

  if (
    playerMeasurementSession.activeMeasurement?.authorLabel !== 'J1' ||
    playerMeasurementSession.activeMeasurement?.end?.column !== 10 ||
    playerMeasurementSession.activeMeasurement?.end?.row !== 11
  ) {
    throw new Error('Regua Jogador -> Mestre nao persistiu o fim do burst corretamente.')
  }

  const gmMeasurementStatePromise = waitForMessage(
    socket,
    (message) => {
      const activeMeasurement = message.payload?.tabletopSession?.activeMeasurement
      return (
        message.type === 'public-state' &&
        activeMeasurement?.authorView === 'gm' &&
        activeMeasurement?.authorLabel === 'M' &&
        activeMeasurement?.visualColor === '#d8a34d' &&
        activeMeasurement?.start?.column === 2 &&
        activeMeasurement?.start?.row === 2 &&
        activeMeasurement?.end?.column === 7 &&
        activeMeasurement?.end?.row === 7
      )
    },
  )
  const gmMeasurementSession = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })
  gmMeasurementSession.activeMeasurement = {
    id: 'smoke-gm-measurement',
    sceneId: gmMeasurementSession.currentSceneId,
    authorId: 'gm',
    authorLabel: 'M',
    authorView: 'gm',
    start: { column: 2, row: 2 },
    end: { column: 7, row: 7 },
    visualColor: '#d8a34d',
    updatedAt: Date.now(),
  }
  saveJson(app, {
    campaignId,
    data: gmMeasurementSession,
    name: 'session',
    scope: 'campaign',
  })
  server.handleStorageChanged({
    campaignId,
    name: 'session',
    scope: 'campaign',
    type: 'json',
  })
  await gmMeasurementStatePromise

  const transitionPlaybackStatePromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' &&
      message.payload?.transitionPlayback?.activeTransitionId === 'transition-smoke' &&
      message.payload?.transitionPlayback?.paused === true &&
      message.payload?.transitionPlayback?.currentTime === 3.5,
  )
  saveJson(app, {
    data: {
      activeTransitionId: 'transition-smoke',
      currentTime: 3.5,
      mapTargetId: 'map-1',
      paused: true,
      startedAt: Date.now(),
    },
    name: 'transitionPlayback',
    scope: 'app',
  })
  server.handleStorageChanged({
    name: 'transitionPlayback',
    scope: 'app',
    type: 'json',
  })
  await transitionPlaybackStatePromise

  const gmSkillStatePromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' &&
      message.payload?.characters?.some?.(
        (character) =>
          character.id === 'hero-1' &&
          character.recursos?.vidaAtual === 17 &&
          character.recursos?.vidaMaxima === 17 &&
          character.combatProfile?.build?.totals?.life === 7 &&
          character.habilidadesDetalhadas?.some?.(
            (skill) => skill.id === 'gm-granted-skill-smoke',
          ),
      ),
  )
  const workspaceWithGrantedSkill = loadJson(app, {
    name: 'workspace',
    scope: 'app',
  })
  workspaceWithGrantedSkill.characters[0] = {
    ...workspaceWithGrantedSkill.characters[0],
    habilidades: ['Habilidade concedida pelo Mestre'],
    habilidadesDetalhadas: [
      {
        custo: '1 FUSHI',
        descricao: 'Concessao canonica para validar Mestre para Jogador.',
        id: 'gm-granted-skill-smoke',
        nome: 'Habilidade concedida pelo Mestre',
      },
    ],
    recursos: {
      ...workspaceWithGrantedSkill.characters[0].recursos,
      vidaAtual: 17,
      vidaMaxima: 17,
    },
  }
  saveJson(app, {
    data: workspaceWithGrantedSkill,
    name: 'workspace',
    scope: 'app',
  })
  server.handleStorageChanged({
    name: 'workspace',
    scope: 'app',
    type: 'json',
  })
  await gmSkillStatePromise

  const liveEventStatePromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' &&
      message.payload?.tabletopSession?.eventState?.rarityDraw?.drawId ===
        'rarity-after-reconnect-smoke' &&
      message.payload?.tabletopSession?.eventState?.rarityDraw?.rarity === 'lendario',
  )
  const sessionWithLiveEvent = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })
  const liveEventStartedAt = Date.now()
  sessionWithLiveEvent.eventState = {
    ...sessionWithLiveEvent.eventState,
    rarityDraw: {
      characterId: 'hero-1',
      characterName: 'Heroi 1',
      drawId: 'rarity-after-reconnect-smoke',
      itemId: 'item-after-reconnect-smoke',
      itemName: 'Item apos reconexao',
      lastRoll: 9,
      phase: 'rolling',
      presentationExpiresAt: liveEventStartedAt + 8000,
      rarity: 'lendario',
      revealAt: liveEventStartedAt + 120,
      startedAt: liveEventStartedAt,
    },
    rarityHistory: [
      {
        drawId: 'private-history-smoke',
        rarity: 'mitico',
      },
    ],
    updatedAt: liveEventStartedAt,
  }
  saveJson(app, {
    campaignId,
    data: sessionWithLiveEvent,
    name: 'session',
    scope: 'campaign',
  })
  server.handleStorageChanged({
    campaignId,
    name: 'session',
    scope: 'campaign',
    type: 'json',
  })
  const liveEventState = await liveEventStatePromise
  if (JSON.stringify(liveEventState.payload).includes('private-history-smoke')) {
    throw new Error('EVE publico vazou o backlog privado do Mestre apos reconexao.')
  }

  const characterStatePromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' &&
      message.payload?.characters?.some?.(
        (character) =>
          character.id === 'hero-1' &&
          character.recursos?.vidaAtual === 7 &&
          character.recursos?.vidaMaxima === 17 &&
          character.combatProfile?.build?.totals?.life === 7 &&
          character.atributos?.forca === 4 &&
          character.habilidadesDetalhadas?.some?.(
            (skill) => skill.id === 'gm-granted-skill-smoke',
          ),
      ),
  )
  const characterAckPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'action-ack' &&
      message.payload?.actionId === 'smoke-action-character-ws' &&
      message.payload?.applied === true,
  )
  socket.send(JSON.stringify({
    character: {
      atributos: {
        forca: 4,
      },
      avatarUrl:
        'https://temporary-smoke.trycloudflare.com/assets/campaign/smoke-campaign/images/hero-1.webp',
      id: 'hero-1',
      nome: 'Heroi',
      combatProfile: {
        build: {
          archetype: 'assassino',
          items: [{ catalogItemId: 'forged-player-build-item' }],
          totals: { damage: 999 },
        },
      },
      habilidades: [],
      habilidadesDetalhadas: [],
      recursos: {
        vidaAtual: 7,
        vidaMaxima: 10,
      },
      tokenImageUrl:
        'https://temporary-smoke.trycloudflare.com/assets/library/campaign/default/images/hero-1.webp',
      tipo: 'player',
    },
    characterId: 'hero-1',
      characterPatch: {
        atributos: {
          forca: 4,
        },
        ataques: [
          {
            atributoBase: 'forca',
            bonusPericia: 3,
            dano: '1d6 + 2',
            id: 'player-attack-smoke',
            nome: 'Golpe de teste',
            resumo: 'Ataque adicionado pela ficha da mesa.',
          },
        ],
        habilidades: [
          'Habilidade concedida pelo Mestre',
          'Habilidade adicionada na mesa',
        ],
        habilidadesDetalhadas: [
          {
            descricao: 'Concessao canonica para validar Mestre para Jogador.',
            id: 'gm-granted-skill-smoke',
            nome: 'Habilidade concedida pelo Mestre',
          },
          {
            descricao: 'Habilidade adicionada pela ficha do jogador.',
            id: 'player-skill-smoke',
            nome: 'Habilidade adicionada na mesa',
          },
        ],
        inventario: ['Item adicionado na mesa'],
        inventarioDetalhado: [
          {
            descricao: 'Item adicionado pela ficha do jogador.',
            efeitos: ['+1 teste de smoke'],
            id: 'player-item-smoke',
            nome: 'Item adicionado na mesa',
            porte: 'medio',
            quantidade: 1,
          },
        ],
        inventarioPerfil: {
          mochila: 'mochila',
        },
        rituais: [
          {
            descricao: 'Ritual adicionado pela ficha do jogador.',
            id: 'player-ritual-smoke',
            nome: 'Ritual de teste',
          },
        ],
        recursos: {
          vidaAtual: 7,
        },
      },
    remoteActionId: 'smoke-action-character-ws',
    type: 'update-character',
  }))
  await characterAckPromise
  await characterStatePromise

  const savedSession = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })

  if (
    savedSession.scenes[0].tokens[0].cell.column !== 1 ||
    savedSession.scenes[0].tokens[0].cell.row !== 1
  ) {
    throw new Error('Movimento remoto de jogador alterou token vinculado.')
  }

  if (
    savedSession.scenes[0].tokens[1].cell.column === 8 ||
    savedSession.scenes[0].tokens[1].cell.row === 8
  ) {
    throw new Error('Movimento rejeitado alterou token sem permissao.')
  }

  if (
    savedSession.activeMeasurement?.authorLabel !== 'M' ||
    savedSession.activeMeasurement?.authorView !== 'gm' ||
    savedSession.activeMeasurement?.end?.column !== 7 ||
    savedSession.activeMeasurement?.end?.row !== 7
  ) {
    throw new Error('Regua Mestre -> Jogador nao persistiu com autor publico correto.')
  }

  const savedWorkspace = loadJson(app, {
    name: 'workspace',
    scope: 'app',
  })

  if (
    savedWorkspace.characters[0].recursos?.vidaAtual !== 7 ||
    savedWorkspace.characters[0].recursos?.vidaMaxima !== 17 ||
    savedWorkspace.characters[0].atributos?.forca !== 4
  ) {
    throw new Error('Atualizacao remota completa de ficha nao persistiu.')
  }

  if (
    savedWorkspace.characters[0].habilidades?.[0] !==
      'Habilidade concedida pelo Mestre' ||
    savedWorkspace.characters[0].habilidadesDetalhadas?.[0]?.id !==
      'gm-granted-skill-smoke' ||
    savedWorkspace.characters[0].habilidadesDetalhadas?.some?.(
      (skill) => skill.id === 'player-skill-smoke',
    ) !== true ||
    savedWorkspace.characters[0].rituais?.some?.(
      (ritual) => ritual.id === 'player-ritual-smoke',
    ) !== true ||
    savedWorkspace.characters[0].ataques?.some?.(
      (attack) => attack.id === 'player-attack-smoke',
    ) !== true ||
    savedWorkspace.characters[0].inventarioDetalhado?.some?.(
      (item) => item.id === 'player-item-smoke',
    ) !== true ||
    savedWorkspace.characters[0].inventarioPerfil?.mochila !== 'mochila'
  ) {
    throw new Error(
      'Ficha da mesa nao preservou ou adicionou ataque, skill, ritual, item e perfil de inventario canonicos.',
    )
  }

  const expectedCanonicalAvatar =
    `fushi-asset://campaign/${campaignId}/images/hero-1.webp`

  if (
    savedWorkspace.characters[0].avatarUrl !== expectedCanonicalAvatar ||
    savedWorkspace.characters[0].tokenImageUrl !== expectedCanonicalAvatar
  ) {
    throw new Error('Atualizacao remota substituiu avatar canonico por URL temporaria.')
  }

  const savedBuild = savedWorkspace.characters[0].combatProfile?.build
  if (
    savedBuild?.archetype !== 'tank' ||
    savedBuild?.items?.[0]?.catalogItemId !== 'canonical-gm-build-item' ||
    savedBuild?.totals?.life !== 7 ||
    savedBuild?.totals?.damage !== -3 ||
    JSON.stringify(savedBuild).includes('forged-player-build-item') ||
    JSON.stringify(savedBuild).includes('999')
  ) {
    throw new Error('Jogador conseguiu sobrescrever a Build Absorvida canonica do Mestre.')
  }

  const turnRequestResult = await postRemoteAction(
    status.port,
    'player1',
    {
      request: {
        characterId: 'hero-1',
        featureId: 'player-skill-smoke',
        kind: 'feature',
        label: 'Habilidade adicionada na mesa',
        timing: 'padrao',
        tokenId: 'token-1',
      },
      type: 'request-turn-action',
    },
    'smoke-action-turn-request',
  )

  if (
    !turnRequestResult.response.ok ||
    turnRequestResult.payload.ok !== true ||
    turnRequestResult.payload.applied !== true
  ) {
    throw new Error('Pedido de acao Jogador > Mestre nao foi aceito com ACK real.')
  }

  const turnRequestSession = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })
  const savedTurnRequest = turnRequestSession.logEntries.find(
    (entry) => entry.turnRequest?.id === 'turn-request-smoke-action-turn-request',
  )

  if (
    savedTurnRequest?.visibility !== 'gm' ||
    savedTurnRequest.turnRequest?.status !== 'pending' ||
    savedTurnRequest.turnRequest?.playerId !== 'player1' ||
    savedTurnRequest.turnRequest?.featureId !== 'player-skill-smoke'
  ) {
    throw new Error('Pedido de acao nao foi persistido como pendente e reservado ao Mestre.')
  }

  const publicAfterTurnRequestResponse = await fetch(
    `http://127.0.0.1:${status.port}/state?code=${sessionCode}&playerId=player1&clientInstanceId=${encodeURIComponent(playerOneInstanceId)}`,
  )
  const publicAfterTurnRequest = await publicAfterTurnRequestResponse.json()

  if (
    JSON.stringify(publicAfterTurnRequest.publicState?.tabletopSession?.logEntries ?? []).includes(
      'smoke-action-turn-request',
    )
  ) {
    throw new Error('Pedido de acao reservado ao Mestre vazou no estado publico do jogador.')
  }

  const invalidTurnRequest = await postRemoteAction(
    status.port,
    'player1',
    {
      request: {
        characterId: 'hero-1',
        featureId: 'player-skill-smoke',
        kind: 'feature',
        label: 'Tentativa em ficha alheia',
        timing: 'padrao',
        tokenId: 'token-2',
      },
      type: 'request-turn-action',
    },
    'smoke-action-turn-request-invalid-token',
  )

  if (
    !invalidTurnRequest.response.ok ||
    invalidTurnRequest.payload.ok !== false ||
    invalidTurnRequest.payload.applied !== false
  ) {
    throw new Error('Pedido de acao em token de outro jogador nao foi rejeitado.')
  }

  const lockResult = await postRemoteAction(
    status.port,
    'player1',
    {
      characterId: 'hero-1',
      mode: 'full',
      type: 'set-character-edit-lock',
    },
    'smoke-action-player-lock',
  )

  if (
    !lockResult.response.ok ||
    lockResult.payload.ok !== true ||
    lockResult.payload.applied !== true
  ) {
    throw new Error('Jogador nao conseguiu adquirir a trava exclusiva de edicao.')
  }

  const lockedSession = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })
  if (lockedSession.characterEditLocks?.['hero-1']?.ownerId !== 'player1') {
    throw new Error('Trava de edicao do jogador nao foi persistida no estado canonico.')
  }

  lockedSession.characterEditLocks['hero-1'] = {
    acquiredAt: Date.now(),
    characterId: 'hero-1',
    expiresAt: Date.now() + 60000,
    mode: 'full',
    ownerId: 'gm',
    ownerLabel: 'Mestre',
  }
  saveJson(app, {
    campaignId,
    data: lockedSession,
    name: 'session',
    scope: 'campaign',
  })
  server.handleStorageChanged({
    campaignId,
    name: 'session',
    scope: 'campaign',
    type: 'json',
  })

  const rejectedByEditLock = await postRemoteAction(
    status.port,
    'player1',
    {
      characterId: 'hero-1',
      characterPatch: {
        atributos: {
          forca: 5,
        },
      },
      type: 'update-character',
    },
    'smoke-action-update-while-gm-editing',
  )

  if (
    !rejectedByEditLock.response.ok ||
    rejectedByEditLock.payload.ok !== false ||
    rejectedByEditLock.payload.applied !== false ||
    !String(rejectedByEditLock.payload.error ?? '').includes('Ficha ocupada')
  ) {
    throw new Error('Servidor aceitou atualizacao de jogador durante edicao do Mestre.')
  }

  const unlockedSession = loadJson(app, {
    campaignId,
    name: 'session',
    scope: 'campaign',
  })
  delete unlockedSession.characterEditLocks['hero-1']
  saveJson(app, {
    campaignId,
    data: unlockedSession,
    name: 'session',
    scope: 'campaign',
  })
  server.handleStorageChanged({
    campaignId,
    name: 'session',
    scope: 'campaign',
    type: 'json',
  })

  const pendingReject = await connectPendingAdmission(status.port, 'player1', '1234')
  const rejectedAdmissionPromise = waitForMessage(
    pendingReject.socket,
    (message) =>
      message.type === 'admission-status' && message.payload?.status === 'rejected',
  )
  const rejectResult = server.updatePlayerAdmission({
    action: 'reject',
    clientId: pendingReject.clientId,
  })

  if (!rejectResult.ok) {
    throw new Error(`Mestre nao conseguiu recusar entrada pendente: ${rejectResult.error}`)
  }

  await rejectedAdmissionPromise
  pendingReject.socket.close()

  const playerFiveClient = server
    .getStatus()
    .clients.find((client) => client.playerId === 'player5' && client.admissionStatus === 'accepted')
  const playerFiveSocket = extraSockets[3]

  if (!playerFiveClient || !playerFiveSocket) {
    throw new Error('Jogador 5 aceito nao ficou disponivel para teste de expulsao.')
  }

  const kickedAdmissionPromise = waitForMessage(
    playerFiveSocket,
    (message) =>
      message.type === 'admission-status' && message.payload?.status === 'kicked',
  )
  const kickResult = server.updatePlayerAdmission({
    action: 'kick',
    clientId: playerFiveClient.id,
  })

  if (!kickResult.ok) {
    throw new Error(`Mestre nao conseguiu expulsar jogador aceito: ${kickResult.error}`)
  }

  await kickedAdmissionPromise
  await closeSocket(playerFiveSocket)

  const kickedResume = await connectPendingAdmission(
    status.port,
    'player5',
    '5555',
    'smoke-instance-player5',
  )
  const kickedResumeStatus = server
    .getStatus()
    .clients.find((client) => client.id === kickedResume.clientId)
  if (kickedResumeStatus?.admissionStatus !== 'pending') {
    throw new Error('Jogador expulso reutilizou autorizacao revogada da mesma instancia.')
  }
  const kickedResumeRejectedPromise = waitForMessage(
    kickedResume.socket,
    (message) =>
      message.type === 'admission-status' && message.payload?.status === 'rejected',
  )
  server.updatePlayerAdmission({
    action: 'reject',
    clientId: kickedResume.clientId,
  })
  await kickedResumeRejectedPromise
  kickedResume.socket.close()

  socket.close()
  extraSockets.forEach((extraSocket) => {
    extraSocket.close()
  })
  server.stop()
  fs.rmSync(tempRoot, { force: true, recursive: true })
  console.log('Smoke multiplayer OK: 5 jogadores, socket novo da mesma instancia sem novo aceite, instancia nova pendente, expulsao revogada, HTTP vinculado a instancia, dados/ACK/fila/cooldown, EVE publico apos reconexao, recibo de combate privado por jogador, ficha Mestre > Jogador e patch Jogador > Mestre sem apagar skill/build canonicas, movimento de jogador bloqueado, regua, interludio, turnos e furtividade.')
}

run().catch((error) => {
  try {
    fs.rmSync(tempRoot, { force: true, recursive: true })
  } catch {
    // ignore cleanup errors
  }

  console.error(error)
  process.exit(1)
})
