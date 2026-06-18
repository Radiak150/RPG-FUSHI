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
      version: 15,
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
    const timeoutId = setTimeout(() => {
      socket.removeEventListener('message', handleMessage)
      reject(new Error('Timeout aguardando mensagem multiplayer.'))
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

async function connectAndAuthenticate(port, profileId, password, server) {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/session?code=${sessionCode}`)

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

  return { publicStateMessage, socket }
}

async function connectPendingAdmission(port, profileId, password) {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/session?code=${sessionCode}`)

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

  return { clientId, socket }
}

async function postRemoteAction(port, playerId, message, actionId) {
  const response = await fetch(`http://127.0.0.1:${port}/action`, {
    body: JSON.stringify({
      actionId,
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
    health.protocolVersion !== 2 ||
    health.serverVersion !== 'multiplayer-v2' ||
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

  const { publicStateMessage, socket } = await connectAndAuthenticate(
    status.port,
    'player1',
    '1234',
    server,
  )
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

  if (publicStateMessage.payload?.playerId !== 'player1') {
    throw new Error('Estado publico nao veio no perfil autenticado.')
  }

  const initialServerInstanceId = publicStateMessage.payload?.serverInstanceId
  const initialStateVersion = publicStateMessage.payload?.stateVersion

  if (
    publicStateMessage.payload?.protocolVersion !== 2 ||
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
    `http://127.0.0.1:${status.port}/state?code=${sessionCode}&playerId=player1`,
  )
  const httpState = await httpStateResponse.json()

  if (!httpStateResponse.ok || httpState.publicState?.playerId !== 'player1') {
    throw new Error('Fallback HTTP de estado publico falhou.')
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
          entry.combat?.kind === 'attack' &&
          entry.combat?.attackName === 'Mordida Smoke' &&
          entry.combat?.attackerTokenId === 'token-1' &&
          entry.combat?.rollTotal === 17,
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
    `http://127.0.0.1:${status.port}/state?code=${sessionCode}&playerId=player1`,
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

  const characterStatePromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'public-state' &&
      message.payload?.characters?.some?.(
        (character) =>
          character.id === 'hero-1' &&
          character.recursos?.vidaAtual === 7 &&
          character.atributos?.forca === 4,
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
      recursos: {
        vidaAtual: 7,
        vidaMaxima: 10,
      },
      tokenImageUrl:
        'https://temporary-smoke.trycloudflare.com/assets/library/campaign/default/images/hero-1.webp',
      tipo: 'player',
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
    savedWorkspace.characters[0].atributos?.forca !== 4
  ) {
    throw new Error('Atualizacao remota completa de ficha nao persistiu.')
  }

  const expectedCanonicalAvatar =
    `fushi-asset://campaign/${campaignId}/images/hero-1.webp`

  if (
    savedWorkspace.characters[0].avatarUrl !== expectedCanonicalAvatar ||
    savedWorkspace.characters[0].tokenImageUrl !== expectedCanonicalAvatar
  ) {
    throw new Error('Atualizacao remota substituiu avatar canonico por URL temporaria.')
  }

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

  socket.close()
  extraSockets.forEach((extraSocket) => {
    extraSocket.close()
  })
  server.stop()
  fs.rmSync(tempRoot, { force: true, recursive: true })
  console.log('Smoke multiplayer OK: 5 jogadores, asset remoto, auth com aceite/recusa/expulsao do mestre, estado publico, MSC global, ACK real/idempotente, movimento de jogador bloqueado, rejeicao sem falso positivo, fila/cooldown de dados, regua, log remoto, playback de interludio, ficha remota, turnos e furtividade.')
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
