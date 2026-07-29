const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const { _electron: electron } = require('playwright')

const executablePath = path.resolve(
  process.env.FUSHI_RELEASE_EXE ||
    path.join(__dirname, '../release/win-unpacked/RPG FUSHI.exe'),
)

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function isBenignFailedRequest(requestFailure) {
  if (requestFailure.includes('-> net::ERR_ABORTED')) {
    return true
  }

  return /^GET http:\/\/127\.0\.0\.1:\d+\/ping -> net::ERR_CONNECTION_REFUSED$/.test(
    requestFailure,
  )
}

function isBenignConsoleError(consoleError) {
  return /^Failed to load resource: net::ERR_CONNECTION_REFUSED @ http:\/\/127\.0\.0\.1:\d+\/ping:0$/.test(
    consoleError,
  )
}

async function waitForVisible(locator, timeout = 5_000) {
  const deadline = Date.now() + timeout

  while (Date.now() <= deadline) {
    const count = await locator.count()

    for (let index = 0; index < count; index += 1) {
      if (await locator.nth(index).isVisible()) {
        return true
      }
    }

    await locator.page().waitForTimeout(25)
  }

  return false
}

async function openShortcutsRail(page) {
  const notesButton = page.getByRole('button', { name: 'Abrir anotacoes pessoais' })
  const rollButton = page.getByRole('button', { name: 'Abrir chat, log e rolagem' })
  const helpButton = page.getByRole('button', { name: 'Abrir ajuda e atalhos' })

  if (
    (await waitForVisible(notesButton, 250)) ||
    (await waitForVisible(rollButton, 250)) ||
    (await waitForVisible(helpButton, 250))
  ) {
    return
  }

  const collapseButton = page.getByRole('button', { name: 'Recolher atalhos' })
  if (await waitForVisible(collapseButton, 500)) {
    await collapseButton.click()
  }

  const shortcutButton = page.getByRole('button', { name: 'Abrir atalhos' })

  if (!(await waitForVisible(shortcutButton, 20_000))) {
    const diagnostics = await page.evaluate(() => ({
      bodyText: document.body.innerText.slice(0, 1_200),
      hasReadinessGate: Boolean(document.querySelector('.tabletop-readiness')),
      hasRouteError: Boolean(document.querySelector('.route-error')),
      trainingVisible: Boolean(document.querySelector('[data-testid="training-arc-overlay"]')),
    }))

    throw new Error(`Release Mesa: rail de atalhos nao apareceu. ${JSON.stringify(diagnostics)}`)
  }

  await shortcutButton.first().click()

  if (
    !(await waitForVisible(notesButton)) &&
    !(await waitForVisible(rollButton)) &&
    !(await waitForVisible(helpButton))
  ) {
    throw new Error('Release Mesa: rail de atalhos abriu sem liberar anotacoes pessoais.')
  }
}

async function smokePackagedBuildManager(page) {
  const buildButton = page.getByRole('button', { name: 'Builds absorvidas' })

  if (!(await waitForVisible(buildButton, 500))) {
    const toolsButton = page.getByRole('button', { name: 'Abrir ferramentas' })
    if (await waitForVisible(toolsButton, 5_000)) await toolsButton.click()
  }

  await page.getByRole('button', { name: 'Builds absorvidas' }).click()
  const manager = page.locator('[data-testid="build-manager"]')
  await manager.waitFor({ state: 'visible', timeout: 10_000 })

  assert(
    (await manager.locator('[role="tab"]').count()) === 6,
    'Release BUI nao exibiu os seis arquetipos.',
  )
  assert(
    (await manager.locator('.build-manager__item-list button').count()) === 8,
    'Release BUI nao exibiu os oito itens do arquetipo selecionado.',
  )

  const absorbButton = manager.locator('[data-testid="build-absorb"]')
  const characterSelect = manager.getByLabel('Vincular a ficha')
  const characterOptions = await characterSelect.locator('option').count()
  const itemButtons = manager.locator('.build-manager__item-list button')
  const absorbedCountTag = manager.locator('.build-manager__character .tag')

  let foundAbsorbable = !(await absorbButton.isDisabled())
  for (let characterIndex = 0; !foundAbsorbable && characterIndex < characterOptions; characterIndex += 1) {
    await characterSelect.selectOption({ index: characterIndex })
    for (let itemIndex = 0; itemIndex < (await itemButtons.count()); itemIndex += 1) {
      await itemButtons.nth(itemIndex).click()
      if (!(await absorbButton.isDisabled())) {
        foundAbsorbable = true
        break
      }
    }
  }

  assert(foundAbsorbable, 'Release BUI nao encontrou uma combinacao segura para absorcao isolada.')
  const initialAbsorbedCount = Number.parseInt(await absorbedCountTag.innerText(), 10) || 0
  const absorbedItemName = await manager.locator('.build-manager__detail h3').innerText()
  await absorbButton.click()
  await manager
    .getByText(`${initialAbsorbedCount + 1} absorvido(s)`, { exact: true })
    .waitFor({ timeout: 5_000 })
  await manager.getByText('Itens Secretos de correção', { exact: true }).click()
  const secretSelect = manager.getByLabel('Absorção afetada')
  const absorbedItemOption = secretSelect.locator('option').filter({ hasText: absorbedItemName }).last()
  const absorbedItemValue = await absorbedItemOption.getAttribute('value')
  assert(absorbedItemValue, 'Release BUI nao listou a absorcao nova nos Itens Secretos.')
  await secretSelect.selectOption(absorbedItemValue)
  await manager.getByRole('button', { name: 'Rerrolar 5 vezes' }).click()
  const rerollButtons = manager.locator('.build-manager__reroll-results button')
  assert((await rerollButtons.count()) === 5, 'Release BUI nao gerou cinco resultados de rerrolagem.')

  const artifactDirectory = path.resolve(__dirname, '../.codex-dev/artifact-work')
  fs.mkdirSync(artifactDirectory, { recursive: true })
  await page.screenshot({
    path: path.join(artifactDirectory, 'build-manager-release.png'),
    fullPage: true,
  })

  await rerollButtons.first().click()
  await manager
    .locator('.build-manager__absorbed-list article')
    .filter({ hasText: absorbedItemName })
    .getByRole('button', { name: 'Remover debug' })
    .click()
  await manager
    .getByText(`${initialAbsorbedCount} absorvido(s)`, { exact: true })
    .waitFor({ timeout: 5_000 })
  await page
    .locator('.floating-window')
    .filter({ has: manager })
    .locator('button[aria-label="Fechar janela"]')
    .click()
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = http.createServer()

    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 3030

      server.close(() => resolve(port))
    })
  })
}

function waitForMessage(socket, predicate, timeoutMs = 10_000) {
  if (typeof socket.__fushiWaitForMessage === 'function') {
    return socket.__fushiWaitForMessage(predicate, timeoutMs)
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      socket.removeEventListener('message', handleMessage)
      reject(new Error('Timeout aguardando mensagem multiplayer no release.'))
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

function attachSocketInbox(socket) {
  const bufferedMessages = []
  const waiters = []

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))

    for (let index = 0; index < waiters.length; index += 1) {
      const waiter = waiters[index]

      if (!waiter.predicate(message)) {
        continue
      }

      waiters.splice(index, 1)
      clearTimeout(waiter.timeoutId)
      waiter.resolve(message)
      return
    }

    bufferedMessages.push(message)
  })

  socket.__fushiWaitForMessage = (predicate, timeoutMs = 10_000) => {
    const bufferedIndex = bufferedMessages.findIndex(predicate)

    if (bufferedIndex >= 0) {
      const [message] = bufferedMessages.splice(bufferedIndex, 1)
      return Promise.resolve(message)
    }

    return new Promise((resolve, reject) => {
      const waiter = {
        predicate,
        resolve,
        timeoutId: null,
      }

      waiter.timeoutId = setTimeout(() => {
        const waiterIndex = waiters.indexOf(waiter)

        if (waiterIndex >= 0) {
          waiters.splice(waiterIndex, 1)
        }

        const bufferedTypes = bufferedMessages.map((message) => message.type).join(', ') || 'nenhuma'
        reject(
          new Error(`Timeout aguardando mensagem multiplayer no release. Buffer: ${bufferedTypes}`),
        )
      }, timeoutMs)

      waiters.push(waiter)
    })
  }
}

async function connectRemotePlayer(
  port,
  profileId,
  password,
  sessionCode,
  clientInstanceId = `release-smoke-${profileId}-${Date.now()}`,
) {
  assert(typeof WebSocket === 'function', 'WebSocket global nao esta disponivel no smoke.')

  const socket = new WebSocket(
    `ws://127.0.0.1:${port}/session?code=${sessionCode}&clientInstanceId=${encodeURIComponent(clientInstanceId)}`,
  )
  attachSocketInbox(socket)

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  await waitForMessage(socket, (message) => message.type === 'session-info')

  const authOkPromise = waitForMessage(socket, (message) => message.type === 'auth-ok')
  const pendingPromise = waitForMessage(
    socket,
    (message) =>
      message.type === 'admission-status' && message.payload?.status === 'pending',
  )

  socket.send(
    JSON.stringify({
      password,
      profileId,
      type: 'authenticate',
    }),
  )
  await authOkPromise
  await pendingPromise

  return socket
}

async function refreshMultiplayerStatus(page) {
  const button = page.getByRole('button', { name: 'Atualizar status' })

  if (await waitForVisible(button, 500)) {
    await button.click()
  }
}

async function getPlayerRow(page, playerId) {
  const row = page.locator('.multiplayer-player-row').filter({ hasText: playerId }).first()

  await row.waitFor({ state: 'visible', timeout: 10_000 })
  return row
}

async function waitForPlayerRow(page, playerId, timeout = 10_000) {
  const deadline = Date.now() + timeout
  const row = page.locator('.multiplayer-player-row').filter({ hasText: playerId }).first()

  while (Date.now() < deadline) {
    await refreshMultiplayerStatus(page)
    if (await row.isVisible().catch(() => false)) {
      return row
    }

    await page.waitForTimeout(250)
  }

  await row.waitFor({ state: 'visible', timeout: 1_000 })
  return row
}

async function waitForPlayerRowDetached(page, playerId, timeout = 10_000) {
  const deadline = Date.now() + timeout
  const row = page.locator('.multiplayer-player-row').filter({ hasText: playerId }).first()

  while (Date.now() < deadline) {
    await refreshMultiplayerStatus(page)
    if ((await row.count()) === 0) {
      return
    }

    await page.waitForTimeout(250)
  }

  await row.waitFor({ state: 'detached', timeout: 1_000 })
}

async function smokePackagedAudio(page) {
  const sources = [
    'fushi-library://assets/audio/sfx/ui/bong_001.ogg',
    'fushi-library://assets/audio/ambience/weather/rain_window_gentle_01.ogg',
    'fushi-library://assets/audio/msc/boss/music__boss__whispers_abyss__high__alkakrab__001.ogg',
  ]
  const results = await page.evaluate(async (audioSources) => {
    const waitForAudio = (source) =>
      new Promise((resolve) => {
        const audio = new Audio()
        let settled = false
        const finish = (result) => {
          if (settled) {
            return
          }

          settled = true
          audio.pause()
          audio.removeAttribute('src')
          audio.load()
          resolve({
            source,
            ...result,
          })
        }
        const timeoutId = window.setTimeout(
          () => finish({ ready: false, reason: 'timeout' }),
          12_000,
        )

        audio.muted = true
        audio.preload = 'auto'
        audio.onerror = () => {
          window.clearTimeout(timeoutId)
          finish({ ready: false, reason: 'error' })
        }
        audio.oncanplay = async () => {
          try {
            await audio.play()
            await new Promise((resume) => window.setTimeout(resume, 320))
            window.clearTimeout(timeoutId)
            finish({
              currentTime: audio.currentTime,
              duration: audio.duration,
              ready: audio.duration > 0,
            })
          } catch (error) {
            window.clearTimeout(timeoutId)
            finish({
              ready: false,
              reason: error instanceof Error ? error.message : String(error),
            })
          }
        }
        audio.src = source
        audio.load()
      })

    return Promise.all(audioSources.map(waitForAudio))
  }, sources)

  assert(
    results.every((result) => result.ready === true),
    `Release nao reproduziu audio empacotado: ${JSON.stringify(results)}`,
  )
}

async function seedPackagedTrainingState(page) {
  return page.evaluate(() => {
    const desktop = window.fushiDesktop

    if (!desktop?.loadJson || !desktop?.saveJson) {
      throw new Error('Bridge de persistencia do Electron nao esta disponivel.')
    }

    const workspace = desktop.loadJson({
      name: 'workspace',
      scope: 'app',
    })
    const campaignId = workspace?.campaigns?.activeCampaignId

    if (!campaignId) {
      throw new Error('Campanha ativa nao foi encontrada no release isolado.')
    }

    const smokeGrantIds = new Set([
      'training-kairos-barulho-torturante',
      'training-davi-analise-cirurgica',
      'training-connor-percepcao-sensorial',
      'training-kael-pata-mansa',
      'training-grim-vida-sugada',
    ])
    const rawWorkspaceCharacters = Array.isArray(workspace?.characters)
      ? workspace.characters
      : workspace?.characters?.items ?? []
    const cleanedCharacters = rawWorkspaceCharacters.map((character) => ({
      ...character,
      habilidadesDetalhadas: (character.habilidadesDetalhadas ?? []).filter(
        (feature) => !smokeGrantIds.has(feature.id),
      ),
    }))
    const cleanedWorkspace = {
      ...workspace,
      characters: Array.isArray(workspace?.characters)
        ? cleanedCharacters
        : { ...workspace.characters, items: cleanedCharacters },
    }
    const savedWorkspace = desktop.saveJson({
      data: cleanedWorkspace,
      name: 'workspace',
      scope: 'app',
    })

    if (!savedWorkspace) {
      throw new Error('Workspace isolado nao foi preparado para o smoke de Skills.')
    }

    const workspaceCharacters = cleanedCharacters.slice(0, 5)
    const characters = Array.from({ length: 5 }, (_, index) =>
      workspaceCharacters[index] || {
        id: `training-release-character-${index + 1}`,
        nome: `Jogador ${index + 1}`,
      },
    )

    const accessSnapshot = desktop.loadJson({ name: 'access', scope: 'app' }) || {}
    const accessState = accessSnapshot?.state && typeof accessSnapshot.state === 'object'
      ? accessSnapshot.state
      : {}
    const accessProfiles = Array.isArray(accessState.profiles) ? accessState.profiles : []
    const playerIds = ['player1', 'player2', 'player3', 'player4', 'player5']
    const nextAccessProfiles = playerIds.map((playerId, index) => {
      const existingProfile = accessProfiles.find((profile) => profile?.id === playerId) || {
        id: playerId,
        label: `Jogador ${index + 1}`,
        role: 'player',
        password: String((index + 1) * 111),
      }

      return {
        ...existingProfile,
        characterId: characters[index]?.id || existingProfile.characterId || '',
      }
    })
    const gmProfile = accessProfiles.find((profile) => profile?.id === 'gm') || {
      id: 'gm',
      label: 'Mestre',
      role: 'gm',
      password: 'mestre1',
      characterId: '',
    }
    const savedAccess = desktop.saveJson({
      data: {
        ...accessSnapshot,
        state: {
          ...accessState,
          version: 1,
          profiles: [gmProfile, ...nextAccessProfiles],
        },
      },
      name: 'access',
      scope: 'app',
    })

    if (!savedAccess) {
      throw new Error('Perfis isolados nao foram preparados para o smoke de ficha.')
    }

    const smokeMapUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
    const smokeMap = {
      biome: 'Smoke release',
      biomeId: 'training-release-biome',
      gridColumns: 24,
      gridRows: 15,
      id: 'smoke-release-campo-treino',
      image: smokeMapUrl,
      imageUrl: smokeMapUrl,
      name: 'Campo de Treinamento - smoke release',
      previewImage: smokeMapUrl,
      stageHeight: 600,
      stageWidth: 960,
      thumbnailUrl: smokeMapUrl,
      type: 'evento',
    }
    const savedLibrary = desktop.saveJson({
      campaignId,
      data: {
        customAmbienceTracks: [],
        customMaps: [smokeMap],
        customMusicTracks: [],
        customObjectPresets: [],
        customTransitions: [],
        favoritePresets: [],
        favoriteTrackIds: [],
        folders: [],
        hiddenItems: { maps: {}, music: {}, npcs: {}, transitions: {} },
        itemFolders: { maps: {}, music: {}, npcs: {}, transitions: {} },
        mapOverrides: {
          [smokeMap.id]: {
            gridColumns: smokeMap.gridColumns,
            gridRows: smokeMap.gridRows,
            image: smokeMap.image,
            imageUrl: smokeMap.imageUrl,
            previewImage: smokeMap.previewImage,
            stageHeight: smokeMap.stageHeight,
            stageWidth: smokeMap.stageWidth,
            thumbnailUrl: smokeMap.thumbnailUrl,
          },
        },
        trackVolumes: {},
        version: 1,
      },
      name: 'library',
      scope: 'campaign',
    })

    if (!savedLibrary) {
      throw new Error('Mapa isolado do treinamento nao foi salvo.')
    }

    const tokens = characters.map((character, index) => ({
      cell: { column: 7 + index * 2, row: 7 },
      characterId: character.id,
      color: ['#8f65d9', '#e4c84e', '#55b878', '#e7e8e8', '#4e535b'][index],
      control: {
        controlledByPlayerIds: [`player${index + 1}`],
        primaryControllerId: `player${index + 1}`,
      },
      controladoPorJogadorId: `player${index + 1}`,
      id: `training-release-token-${index + 1}`,
      label: character.nome || `Jogador ${index + 1}`,
      tokenKind: 'player_corpo',
      visibility: 'public',
    }))
    const session = {
      broadcastEvents: [],
      currentSceneId: 'training-release-scene',
      initialSceneId: 'training-release-scene',
      logEntries: [],
      scenes: [
        {
          id: 'training-release-scene',
          mapId: smokeMap.id,
          metadata: {},
          name: 'Campo de Treinamento - smoke release',
          objects: [],
          tokens,
        },
      ],
      selectedTokenId: '',
      selectedTokenIds: [],
      version: 16,
    }
    const sceneTokens = (session?.scenes || []).flatMap((scene) => scene.tokens || [])
    const participants = []
    const usedTokenIds = new Set()
    const usedCharacterIds = new Set()

    for (const playerId of playerIds) {
      const token = sceneTokens.find((candidate) => {
        const controllerId =
          candidate?.controladoPorJogadorId || candidate?.persistentControl?.playerId || ''

        return (
          controllerId === playerId &&
          candidate?.id &&
          candidate?.characterId &&
          !usedTokenIds.has(candidate.id) &&
          !usedCharacterIds.has(candidate.characterId)
        )
      })

      if (!token) continue
      participants.push({ playerId, token })
      usedTokenIds.add(token.id)
      usedCharacterIds.add(token.characterId)
    }

    for (const playerId of playerIds) {
      if (participants.some((participant) => participant.playerId === playerId)) continue

      const token = sceneTokens.find(
        (candidate) =>
          candidate?.id &&
          candidate?.characterId &&
          !usedTokenIds.has(candidate.id) &&
          !usedCharacterIds.has(candidate.characterId),
      )

      if (!token) continue
      token.controladoPorJogadorId = playerId
      participants.push({ playerId, token })
      usedTokenIds.add(token.id)
      usedCharacterIds.add(token.characterId)
    }

    if (participants.length !== 5) {
      throw new Error(
        `Release isolado nao forneceu cinco corpos para o treinamento: ${participants.length}.`,
      )
    }

    participants.sort((left, right) => left.playerId.localeCompare(right.playerId))
    const stationIds = ['escalada', 'bonecos', 'obstaculos', 'pontaria', 'ringue', 'lama']
    const now = Date.now()

    session.trainingState = {
      arcId: 'vila-circuito-centro-v1',
      finalTrial: {
        contributorIds: [],
        isActive: false,
        isCompleted: false,
        isUnlocked: false,
        pressure: 0,
        progress: 0,
        stationIds: [],
      },
      isActive: true,
      isCompleted: false,
      locationId: 'campo_treino_vila',
          mapId: smokeMap.id,
      participants: participants.map(({ playerId, token }) => ({
        activeStationId: 'escalada',
        characterId: token.characterId,
        color: token.color || '#92c0b6',
        id: playerId,
        label: `J${playerId.replace('player', '')}`,
        name: token.label || playerId,
        playerId,
        stations: Object.fromEntries(
          stationIds.map((stationId) => {
            const hasInitialProgress = playerId === 'player1' && stationId === 'escalada'

            return [
              stationId,
              {
                boldSuccesses: 0,
                progress: hasInitialProgress ? 1 : 0,
                setbacks: 0,
                status: hasInitialProgress ? 'active' : 'pending',
              },
            ]
          }),
        ),
        tokenId: token.id,
      })),
      startedAt: now,
      updatedAt: now,
      version: 1,
    }
    session.eventState = {
      events: {
        'initial-training': {
          activatedAt: now - 2000,
          isActive: true,
          restoreMapId: 'release-private-map',
          updatedAt: now,
        },
        'build-rarity-draw': {
          activatedAt: now - 1000,
          isActive: true,
          updatedAt: now,
        },
        'skill-assignment': {
          activatedAt: now - 500,
          isActive: true,
          updatedAt: now,
        },
      },
      rarityDraw: {
        characterId: characters[0].id,
        characterName: characters[0].nome,
        drawId: 'release-rarity-seed',
        itemId: 'release-item-seed',
        itemName: 'Item Release Seed',
        lastRoll: 10,
        phase: 'rolling',
        rarity: 'mitico',
        revealAt: now + 2800,
        startedAt: now,
      },
      updatedAt: now,
      version: 1,
    }

    const saved = desktop.saveJson({
      campaignId,
      data: session,
      name: 'session',
      scope: 'campaign',
    })

    if (!saved) {
      throw new Error('Treinamento nao foi salvo no release isolado.')
    }

    return { campaignId }
  })
}

function assertPublicTrainingState(publicStateMessage) {
  const trainingState = publicStateMessage.payload?.tabletopSession?.trainingState
  const serializedState = JSON.stringify(trainingState)
  const participantIds =
    trainingState?.participants?.map?.((participant) => participant.id) ?? []

  assert(trainingState?.isActive === true, 'Release multiplayer nao publicou o treinamento ativo.')
  assert(participantIds.length === 5, 'Release multiplayer perdeu participantes do treinamento.')
  assert(
    trainingState?.participants?.find?.((participant) => participant.id === 'player1')
      ?.stations?.escalada?.progress === 1,
    'Release multiplayer perdeu o progresso publico do treinamento.',
  )
  assert(!serializedState.includes('gmNotes'), 'Release multiplayer vazou notas privadas do Mestre.')
  assert(!serializedState.includes('"dt"'), 'Release multiplayer vazou DT para o Jogador.')

  const eventState = publicStateMessage.payload?.tabletopSession?.eventState
  const serializedEventState = JSON.stringify(eventState)
  assert(
    eventState?.events?.['initial-training']?.isActive === true &&
      eventState?.events?.['build-rarity-draw']?.isActive === true &&
      eventState?.events?.['skill-assignment']?.isActive === true,
    'Release multiplayer perdeu eventos simultaneos do EVE.',
  )
  assert(
    eventState?.rarityDraw?.drawId === 'release-rarity-seed' &&
      eventState?.rarityDraw?.rarity === 'mitico',
    'Release multiplayer perdeu a apresentacao publica de raridade.',
  )
  assert(!serializedEventState.includes('lastRoll'), 'Release multiplayer vazou o d10 privado.')
  assert(!serializedEventState.includes('restoreMapId'), 'Release multiplayer vazou mapa de retorno.')
}

async function deactivatePackagedTrainingState(page, seededTraining) {
  await page.evaluate(({ campaignId }) => {
    const session = window.fushiDesktop?.loadJson?.({
      campaignId,
      name: 'session',
      scope: 'campaign',
    })

    if (!session?.trainingState) {
      throw new Error('Treinamento sem estado para testar a ativacao pelo MUN.')
    }

    session.trainingState.isActive = false
    session.trainingState.updatedAt = Date.now()
    if (session.eventState?.events?.['initial-training']) {
      session.eventState.events['initial-training'].isActive = false
      session.eventState.events['initial-training'].updatedAt = Date.now()
      delete session.eventState.events['initial-training'].restoreMapId
    }
    if (session.eventState?.events?.['build-rarity-draw']) {
      session.eventState.events['build-rarity-draw'].isActive = false
      session.eventState.events['build-rarity-draw'].updatedAt = Date.now()
    }
    if (session.eventState?.events?.['skill-assignment']) {
      session.eventState.events['skill-assignment'].isActive = false
      session.eventState.events['skill-assignment'].updatedAt = Date.now()
    }
    if (session.eventState) {
      session.eventState.rarityDraw = {
        characterId: '',
        characterName: '',
        drawId: '',
        itemId: '',
        itemName: '',
        phase: 'idle',
      }
      session.eventState.updatedAt = Date.now()
    }
    const saved = window.fushiDesktop?.saveJson?.({
      campaignId,
      data: session,
      name: 'session',
      scope: 'campaign',
    })

    if (!saved) {
      throw new Error('Treinamento nao foi desativado antes do teste do MUN.')
    }
  }, seededTraining)
}

async function smokeMultiplayerAdmission(page, appDataDir) {
  const sessionCode = `REL${Date.now().toString(36).slice(-5).toUpperCase()}`
  const port = await getFreePort()
  const openedSockets = []
  const playerUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fushi-release-player-'))
  let playerApp = null

  await page.evaluate(() => window.fushiDesktop?.stopMultiplayerHost?.())
  await page.evaluate(() => {
    location.hash = '#/multiplayer'
  })
  await page.locator('.stack-list').waitFor({ timeout: 20_000 })

  await page.getByLabel('Porta local').fill(String(port))
  await page.getByLabel('Codigo da sessao opcional').fill(sessionCode)
  await page.getByRole('button', { name: 'Hospedar sessao' }).click()
  await page.getByText('Servidor ativo').waitFor({ timeout: 15_000 })

  const hostedUiState = await page.evaluate(() => ({
    hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
    hasRouteError: Boolean(document.querySelector('.route-error')),
  }))

  assert(!hostedUiState.hasRouteError, 'Release Multiplayer abriu a tela de recuperacao.')
  assert(!hostedUiState.hasHorizontalOverflow, 'Release Multiplayer tem overflow horizontal.')

  try {
    const player1 = await connectRemotePlayer(port, 'player1', '111', sessionCode)
    openedSockets.push(player1)
    const player1PublicState = waitForMessage(
      player1,
      (message) => message.type === 'public-state' && message.payload?.playerId === 'player1',
    )

    await refreshMultiplayerStatus(page)
    const player1Row = await getPlayerRow(page, 'player1')
    await player1Row.getByRole('button', { name: 'Aceitar' }).click()
    const player1State = await player1PublicState
    assertPublicTrainingState(player1State)
    await getPlayerRow(page, 'player1')

    playerApp = await electron.launch({
      executablePath,
      args: [
        `--user-data-dir=${playerUserDataDir}`,
        '--disable-gpu-sandbox',
        '--fushi-secondary-instance',
        '--fushi-profile=player4',
        '--fushi-route=/multiplayer',
      ],
      env: {
        ...process.env,
        APPDATA: appDataDir,
        FUSHI_APPDATA_ROOT: appDataDir,
        FUSHI_ELECTRON_ISOLATED: '1',
        FUSHI_ELECTRON_PROFILE: 'player4',
      },
    })
    const playerPage = await playerApp.firstWindow({ timeout: 30_000 })
    const playerPageErrors = []
    playerPage.on('pageerror', (error) => playerPageErrors.push(error.stack || error.message))
    await playerPage.locator('.stack-list').waitFor({ timeout: 20_000 })
    await playerPage.getByLabel('Host/IP/tunnel').fill('127.0.0.1')
    await playerPage.getByLabel('Porta').fill(String(port))
    await playerPage.getByRole('button', { name: /Jogador 4/ }).click()
    await playerPage.getByLabel('Codigo da sessao').fill(sessionCode)
    await playerPage.getByLabel('Senha do jogador').fill('444')
    await playerPage.getByRole('button', { name: 'Entrar em sessao' }).click()

    const player4PendingRow = await waitForPlayerRow(page, 'player4')
    await player4PendingRow.getByRole('button', { name: 'Aceitar' }).click()
    await playerPage.locator('.tabletop-screen').waitFor({ timeout: 30_000 })
    const playerRarityPresentation = playerPage.locator(
      '[data-testid="build-rarity-presentation"]',
    )
    if (await playerRarityPresentation.isVisible()) {
      await playerPage.waitForFunction(() =>
        document
          .querySelector('[data-testid="build-rarity-presentation"]')
          ?.getAttribute('data-phase') === 'revealed',
      )
      try {
        await playerRarityPresentation.click({ position: { x: 12, y: 12 } })
      } catch (error) {
        if ((await playerPage.locator('[data-testid="build-rarity-presentation"]').count()) > 0) {
          throw error
        }
      }
      await playerRarityPresentation.waitFor({ state: 'detached', timeout: 5_000 }).catch(() => {})
    }
    const platformButton = playerPage.getByRole('button', {
      name: 'Plataforma',
      exact: true,
    })
    if (!(await platformButton.isVisible())) {
      await playerPage.getByRole('button', { name: 'Abrir menu superior' }).click()
    }
    await platformButton.click()
    await playerPage.locator('.sidebar').waitFor({ state: 'visible', timeout: 10_000 })
    await playerPage.getByRole('link', { name: 'Multiplayer', exact: true }).click()
    const activePlayerSession = playerPage.locator('[data-testid="active-player-session"]')
    await activePlayerSession.waitFor({ state: 'visible', timeout: 10_000 })

    const player4ResumedRow = await waitForPlayerRow(page, 'player4')
    assert(
      /Online/i.test(await player4ResumedRow.innerText()) &&
        (await player4ResumedRow.getByRole('button', { name: 'Aceitar' }).count()) === 0,
      'Jogador aceito voltou para pending ao sair da Mesa sem fechar o app.',
    )

    await activePlayerSession.getByRole('button', { name: 'Voltar a mesa' }).click()
    await playerPage.locator('.tabletop-screen').waitFor({ timeout: 30_000 })
    assert(playerPageErrors.length === 0, `Jogador real registrou pageerror: ${playerPageErrors.join(' | ')}`)

    const liveSyncSeed = await page.evaluate(() => {
      const desktop = window.fushiDesktop
      const hostStatus = desktop?.getMultiplayerHostStatus?.()
      const campaignId = hostStatus?.campaignId
      if (!desktop?.loadJson || !desktop?.saveJson || !campaignId) {
        throw new Error('Release nao encontrou persistencia/campanha para sync ao vivo.')
      }

      const access = desktop.loadJson({ name: 'access', scope: 'app' })
      const profile = access?.state?.profiles?.find?.((candidate) => candidate.id === 'player4')
      const workspace = desktop.loadJson({ name: 'workspace', scope: 'app' })
      const characters = Array.isArray(workspace?.characters)
        ? workspace.characters
        : workspace?.characters?.items ?? []
      const characterIndex = characters.findIndex(
        (character) => character.id === profile?.characterId,
      )
      if (characterIndex < 0) {
        throw new Error('Release nao encontrou a ficha canonica do Jogador 4.')
      }

      const character = characters[characterIndex]
      const skillId = `release-live-skill-${Date.now()}`
      const skillName = 'Pulso de Sincronia Release'
      const nextCharacter = {
        ...character,
        habilidades: [...new Set([...(character.habilidades ?? []), skillName])],
        habilidadesDetalhadas: [
          ...(character.habilidadesDetalhadas ?? []).filter((skill) => skill.id !== skillId),
          {
            custo: '1 FUSHI',
            descricao: 'Skill transmitida ao vivo pelo Mestre no smoke empacotado.',
            id: skillId,
            nome: skillName,
          },
        ],
      }
      const nextCharacters = characters.map((candidate, index) =>
        index === characterIndex ? nextCharacter : candidate,
      )
      const nextWorkspace = {
        ...workspace,
        characters: Array.isArray(workspace?.characters)
          ? nextCharacters
          : { ...workspace.characters, items: nextCharacters },
      }
      desktop.saveJson({ data: nextWorkspace, name: 'workspace', scope: 'app' })

      const session = desktop.loadJson({ campaignId, name: 'session', scope: 'campaign' })
      const now = Date.now()
      const nextSession = {
        ...session,
        eventState: {
          ...(session.eventState ?? {}),
          events: {
            ...(session.eventState?.events ?? {}),
            'build-rarity-draw': {
              activatedAt: now,
              isActive: true,
              updatedAt: now,
            },
          },
          rarityDraw: {
            characterId: character.id,
            characterName: character.nome,
            drawId: `release-live-draw-${now}`,
            itemId: 'release-live-item',
            itemName: 'Ressonancia Ao Vivo',
            lastRoll: 9,
            phase: 'rolling',
            presentationExpiresAt: now + 60_000,
            rarity: 'lendario',
            revealAt: now + 350,
            startedAt: now,
          },
          rarityHistory: [
            { drawId: 'release-private-backlog', lastRoll: 10, rarity: 'mitico' },
          ],
          updatedAt: now,
          version: 1,
        },
      }
      desktop.saveJson({
        campaignId,
        data: nextSession,
        name: 'session',
        scope: 'campaign',
      })

      return {
        characterId: character.id,
        characterName: character.nome,
        initialLife: character.recursos?.vidaAtual,
        skillId,
        skillName,
      }
    })

    const liveRarityPresentation = playerPage.locator(
      '[data-testid="build-rarity-presentation"]',
    )
    await liveRarityPresentation.waitFor({ state: 'visible', timeout: 10_000 })
    await playerPage.waitForFunction(() =>
      document
        .querySelector('[data-testid="build-rarity-presentation"]')
        ?.getAttribute('data-phase') === 'revealed',
    )
    const liveRarityText = await liveRarityPresentation.innerText()
    assert(/Ressonancia Ao Vivo/i.test(liveRarityText), 'EVE ao vivo nao chegou ao Jogador.')
    assert(!/release-private-backlog|lastRoll/i.test(liveRarityText), 'EVE vazou backlog do Mestre.')
    await liveRarityPresentation.click({ position: { x: 12, y: 12 } })
    await liveRarityPresentation.waitFor({ state: 'detached', timeout: 5_000 })

    await playerPage.waitForFunction(
      ({ characterId, skillId, skillName }) => {
        const workspace = window.fushiDesktop?.loadJson?.({
          name: 'workspace',
          scope: 'app',
        })
        const characters = Array.isArray(workspace?.characters)
          ? workspace.characters
          : workspace?.characters?.items ?? []
        const character = characters.find?.(
          (candidate) => candidate.id === characterId,
        )
        return Boolean(
          character?.habilidadesDetalhadas?.some?.(
            (skill) => skill.id === skillId && skill.nome === skillName,
          ),
        )
      },
      {
        characterId: liveSyncSeed.characterId,
        skillId: liveSyncSeed.skillId,
        skillName: liveSyncSeed.skillName,
      },
      { timeout: 20_000 },
    )

    const playerToken = playerPage
      .getByRole('button', {
        name: `Selecionar ${liveSyncSeed.characterName}`,
        exact: true,
      })
      .first()
    await playerToken.waitFor({ state: 'visible', timeout: 10_000 })
    await playerToken.dblclick()
    const playerSheet = playerPage.locator('.floating-window--sheet').first()
    await playerSheet.waitFor({ state: 'visible', timeout: 10_000 })
    await playerSheet.getByRole('button', { name: 'Habilidades', exact: true }).click()
    await playerSheet.getByText(liveSyncSeed.skillName, { exact: true }).waitFor({
      state: 'visible',
      timeout: 10_000,
    })

    const lifeCard = playerSheet.locator('.sheet-view__resource-card--life')
    await lifeCard.getByRole('button', { name: '-' }).click()
    await page.waitForFunction(
      ({ characterId, expectedLife }) => {
        const workspace = window.fushiDesktop?.loadJson?.({ name: 'workspace', scope: 'app' })
        const characters = Array.isArray(workspace?.characters)
          ? workspace.characters
          : workspace?.characters?.items ?? []
        return characters.find?.((character) => character.id === characterId)
          ?.recursos?.vidaAtual === expectedLife
      },
      {
        characterId: liveSyncSeed.characterId,
        expectedLife: Math.max(0, Number(liveSyncSeed.initialLife) - 1),
      },
      { timeout: 10_000 },
    )

    await playerApp.close()
    playerApp = null
    await waitForPlayerRowDetached(page, 'player4')

    const player2 = await connectRemotePlayer(port, 'player2', '222', sessionCode)
    openedSockets.push(player2)
    const player2Rejected = waitForMessage(
      player2,
      (message) =>
        message.type === 'admission-status' && message.payload?.status === 'rejected',
    )

    await refreshMultiplayerStatus(page)
    const player2Row = await getPlayerRow(page, 'player2')
    await player2Row.getByRole('button', { name: 'Recusar' }).click()
    await player2Rejected

    const player3 = await connectRemotePlayer(port, 'player3', '333', sessionCode)
    openedSockets.push(player3)
    const player3PublicState = waitForMessage(
      player3,
      (message) => message.type === 'public-state' && message.payload?.playerId === 'player3',
    )

    await refreshMultiplayerStatus(page)
    const player3Row = await getPlayerRow(page, 'player3')
    await player3Row.getByRole('button', { name: 'Aceitar' }).click()
    await player3PublicState

    const player3Kicked = waitForMessage(
      player3,
      (message) =>
        message.type === 'admission-status' && message.payload?.status === 'kicked',
    )

    await refreshMultiplayerStatus(page)
    const acceptedPlayer3Row = await getPlayerRow(page, 'player3')
    await acceptedPlayer3Row.getByRole('button', { name: 'Expulsar' }).click()
    await player3Kicked

    const finalUiState = await page.evaluate(() => ({
      hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
      hasRouteError: Boolean(document.querySelector('.route-error')),
      playerRows: document.querySelectorAll('.multiplayer-player-row').length,
    }))

    assert(!finalUiState.hasRouteError, 'Release Multiplayer quebrou apos administrar jogadores.')
    assert(!finalUiState.hasHorizontalOverflow, 'Release Multiplayer gerou overflow apos administrar jogadores.')
    assert(finalUiState.playerRows >= 1, 'Release Multiplayer perdeu lista de jogadores administrados.')
  } finally {
    if (playerApp) {
      await playerApp.close().catch(() => {})
    }
    fs.rmSync(playerUserDataDir, { force: true, recursive: true })
    openedSockets.forEach((socket) => {
      try {
        socket.close()
      } catch (_error) {
        // ignored in smoke cleanup
      }
    })
    await page.evaluate(() => window.fushiDesktop?.stopMultiplayerHost?.())
  }
}

function seedIsolatedMundiAssets(appDataDir) {
  const relativeAssets = [
    'mundi/mun_base_ilha_sem_labels.png',
    'mundi/biomes/thumb_bioma_planicie_floresta_inicial.png',
    'mundi/locations/loc_caverna_primeiro_corpo.png',
    'mundi/locations/loc_clareira_lobos.png',
    'mundi/locations/loc_armazem_comunitario.png',
    'mundi/locations/loc_campo_treino_vila.png',
    'mundi/locations/loc_vila_conhecimento_absorvido.png',
    'mundi/locations/loc_bosque_baixo.png',
    'mundi/locations/loc_riacho_claro.png',
  ]
  const sourceRoot = path.resolve(__dirname, '../public/assets')
  const targetRoot = path.join(appDataDir, 'FUSHI', 'library', 'assets')

  relativeAssets.forEach((relativeAsset) => {
    const sourcePath = path.join(sourceRoot, relativeAsset)
    const targetPath = path.join(targetRoot, relativeAsset)

    assert(fs.existsSync(sourcePath), `Asset MUN ausente no projeto: ${sourcePath}`)
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.copyFileSync(sourcePath, targetPath)
  })
}

async function main() {
  assert(fs.existsSync(executablePath), `Release nao encontrada: ${executablePath}`)

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fushi-release-smoke-'))
  const appDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fushi-release-appdata-'))
  seedIsolatedMundiAssets(appDataDir)
  const app = await electron.launch({
    executablePath,
    args: [`--user-data-dir=${userDataDir}`, '--disable-gpu-sandbox'],
    env: {
      ...process.env,
      APPDATA: appDataDir,
      FUSHI_APPDATA_ROOT: appDataDir,
    },
  })

  try {
    const page = await app.firstWindow({ timeout: 30_000 })
    const consoleErrors = []
    const pageErrors = []
    const failedRequests = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        const location = message.location()
        consoleErrors.push(
          `${message.text()} @ ${location.url || 'unknown'}:${location.lineNumber ?? 0}`,
        )
      }
    })
    page.on('pageerror', (error) => {
      pageErrors.push(error.stack || error.message)
    })
    page.on('requestfailed', (request) => {
      const failure = request.failure()
      failedRequests.push(`${request.method()} ${request.url()} -> ${failure?.errorText || 'unknown'}`)
    })

    await page.waitForLoadState('domcontentloaded')
    await page.locator('.launcher-screen').waitFor({ timeout: 20_000 })

    const launcherState = await page.evaluate(() => ({
      hasRouteError: Boolean(document.querySelector('.route-error')),
      hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
      packageCardCount: document.querySelectorAll('.launcher-package').length,
    }))

    assert(!launcherState.hasRouteError, 'Release launcher abriu a tela de recuperacao.')
    assert(!launcherState.hasHorizontalOverflow, 'Release launcher tem overflow horizontal.')
    assert(launcherState.packageCardCount === 1, 'Release launcher nao montou pacote da campanha.')

    await smokePackagedAudio(page)
    const seededTraining = await seedPackagedTrainingState(page)
    await smokeMultiplayerAdmission(page, appDataDir)
    await deactivatePackagedTrainingState(page, seededTraining)

    await page.evaluate(() => {
      location.hash = '#/jogar/mesa'
    })
    await page.waitForTimeout(1_000)

    const passwordInput = page.locator('input[type="password"]')
    if ((await passwordInput.count()) > 0) {
      await passwordInput.fill('mestre1')
      await page.locator('button[type="submit"]').click()
    }

    await page.locator('.tabletop-screen').waitFor({ timeout: 30_000 })

    await openShortcutsRail(page)
    await smokePackagedBuildManager(page)
    await openShortcutsRail(page)

    await page.getByRole('button', { name: 'Abrir anotacoes pessoais' }).click()
    for (let cycle = 0; cycle < 12; cycle += 1) {
      await page.locator('.floating-window button[aria-label="Minimizar janela"]').click()
      await page
        .locator('.floating-window button[aria-label="Expandir janela"]')
        .filter({ hasText: '+' })
        .click()
    }
    await page.waitForTimeout(500)

    const windowState = await page.evaluate(() => ({
      hasRouteError: Boolean(document.querySelector('.route-error')),
      hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
      floatingWindowCount: document.querySelectorAll('.floating-window').length,
    }))

    assert(!windowState.hasRouteError, 'Release Mesa abriu a tela de recuperacao.')
    assert(!windowState.hasHorizontalOverflow, 'Release Mesa tem overflow horizontal.')
    assert(windowState.floatingWindowCount === 1, 'Release Mesa perdeu a janela restaurada.')

    await page.getByRole('button', { name: 'Abrir anotacoes pessoais' }).click()
    await openShortcutsRail(page)
    await page.getByRole('button', { name: 'Abrir chat, log e rolagem' }).click()
    const rollWindow = page.locator('.floating-window--log')
    await rollWindow.waitFor({ timeout: 10_000 })
    await rollWindow.getByRole('button', { name: 'Dados de combate', exact: true }).click()
    const combatRoller = rollWindow.locator('.tabletop-combat-roller')
    await combatRoller.waitFor({ state: 'visible', timeout: 8_000 })
    if ((await combatRoller.locator('.tabletop-combat-roller__stats').count()) === 0) {
      await combatRoller
        .getByText('Nenhum personagem vinculado a um token visivel.', { exact: true })
        .waitFor({ state: 'visible', timeout: 5_000 })
    } else {
      const previewButton = combatRoller.getByRole('button', { name: 'Ver area', exact: true })

      if (await waitForVisible(previewButton, 1_000)) {
        await previewButton.click()
        await page.locator('.tabletop-combat-range').waitFor({ state: 'visible', timeout: 5_000 })
      }
    }
    await rollWindow.getByRole('button', { name: 'Dados comuns', exact: true }).click()
    await rollWindow.locator('[data-roll-surface="common"]').waitFor({ state: 'visible', timeout: 5_000 })
    await rollWindow.getByRole('button', { name: 'Rolar publico', exact: true }).click()

    const restoreRollWindow = rollWindow
      .locator('button[aria-label="Expandir janela"]')
      .filter({ hasText: '+' })
      .first()
    if ((await restoreRollWindow.count()) > 0) {
      await restoreRollWindow.click()
    }

    await page.waitForTimeout(300)
    await rollWindow
      .locator('button')
      .filter({ hasText: /Entrar na fila|Rolar publico/ })
      .first()
      .click()
    await page.locator('.tabletop-dice-guard, .tabletop-session-log__roll-lock').first().waitFor({
      timeout: 8_000,
    })

    const diceState = await page.evaluate(() => ({
      hasRouteError: Boolean(document.querySelector('.route-error')),
      hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
      guardText:
        document.querySelector('.tabletop-dice-guard, .tabletop-session-log__roll-lock')
          ?.textContent || '',
    }))

    assert(!diceState.hasRouteError, 'Release dado abriu a tela de recuperacao.')
    assert(!diceState.hasHorizontalOverflow, 'Release dado causou overflow horizontal.')
    assert(/Espere|Aguarde|Fila/i.test(diceState.guardText), 'Release dado perdeu fila/cooldown.')

    const closeFloatingWindowButtons = page.locator(
      '.floating-window button[aria-label="Fechar janela"]',
    )
    while ((await closeFloatingWindowButtons.count()) > 0) {
      await closeFloatingWindowButtons.first().click()
    }

    const mapMundiButton = page.getByRole('button', { name: 'Mapa Mundi', exact: true })
    if (!(await waitForVisible(mapMundiButton, 500))) {
      const openToolsButton = page.getByRole('button', { name: 'Abrir ferramentas' })

      if (!(await waitForVisible(openToolsButton, 5_000))) {
        throw new Error('Release Mesa nao exibiu o rail de ferramentas do Mestre.')
      }

      await openToolsButton.click()
    }
    if (!(await waitForVisible(mapMundiButton, 5_000))) {
      throw new Error('Release Mesa abriu ferramentas sem liberar o Mapa Mundi.')
    }
    assert(
      (await page.getByRole('button', { name: 'Laboratorio de combate', exact: true }).count()) === 0,
      'Release voltou a expor o Laboratorio de combate na Mesa.',
    )
    assert(
      (await page.locator('.tabletop-hud button').filter({ hasText: /^SIM$/ }).count()) === 0,
      'Release voltou a expor o atalho SIM na Mesa.',
    )
    await mapMundiButton.click()
    await page.locator('.world-mundi__map--world').waitFor({
      state: 'visible',
      timeout: 20_000,
    })
    const enteredPlanicie = await page.evaluate(() => {
      const title = Array.from(
        document.querySelectorAll('.world-mundi__biome-region title'),
      ).find((candidate) => /plan/i.test(candidate.textContent || ''))
      const region = title?.parentElement

      if (!(region instanceof SVGElement)) return false
      region.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      return true
    })
    assert(enteredPlanicie, 'Release MUN nao encontrou a regiao da Planicie.')
    await page.locator('.world-mundi__map--biome').waitFor({
      state: 'visible',
      timeout: 10_000,
    })
    const trainingLocationMarker = page.locator(
      '.world-mundi__marker[title^="Campo de Treino da Vila"]',
    )
    await trainingLocationMarker.waitFor({ state: 'visible', timeout: 20_000 })
    await trainingLocationMarker.click()

    const activateTrainingButton = page.locator('[data-testid="activate-village-training"]')
    await activateTrainingButton.waitFor({ state: 'visible', timeout: 10_000 })
    assert(
      /Ativar treinamento/i.test(await activateTrainingButton.innerText()),
      'Release MUN nao exibiu o gatilho inicial do treinamento.',
    )
    await activateTrainingButton.click()
    await page.waitForFunction(
      ({ campaignId }) => {
        const session = window.fushiDesktop?.loadJson?.({
          campaignId,
          name: 'session',
          scope: 'campaign',
        })
        const currentScene = session?.scenes?.find?.(
          (scene) => scene.id === session.currentSceneId,
        )

        return (
          session?.trainingState?.isActive === true &&
          session?.eventState?.events?.['initial-training']?.isActive === true &&
          currentScene?.mapId === 'planicie_campo_treino_vila_topdown'
        )
      },
      seededTraining,
      { timeout: 10_000 },
    )
    await page.locator('.tabletop-readiness').waitFor({ state: 'detached', timeout: 20_000 })

    const trainingOverlay = page.locator('[data-testid="training-arc-overlay"]')
    await trainingOverlay.waitFor({ state: 'visible', timeout: 10_000 })
    const initialEventManager = page.locator('[data-testid="event-manager"]')
    await initialEventManager.waitFor({ state: 'visible', timeout: 10_000 })
    await initialEventManager.getByRole('button', { name: 'Abrir controle', exact: true }).click()
    await initialEventManager.waitFor({ state: 'detached', timeout: 10_000 })
    await page.locator('[data-testid="training-participant-player1"]').click()

    const trainingText = await trainingOverlay.innerText()
    assert(
      /Somente Mestre/i.test(trainingText) && trainingText.includes('DT 10'),
      'Release Mesa nao exibiu o guia privado e a DT do treinamento para o Mestre.',
    )
    await page.getByRole('button', { name: '+1 Marca', exact: true }).click()
    await page.waitForFunction(
      ({ campaignId }) => {
        const session = window.fushiDesktop?.loadJson?.({
          campaignId,
          name: 'session',
          scope: 'campaign',
        })

        return (
          session?.trainingState?.participants?.find?.(
            (participant) => participant.id === 'player1',
          )?.stations?.escalada?.progress === 2
        )
      },
      seededTraining,
      { timeout: 8_000 },
    )

    await page.getByRole('button', { name: 'Eventos da mesa', exact: true }).click()
    const eventManager = page.locator('[data-testid="event-manager"]')
    await eventManager.waitFor({ state: 'visible', timeout: 10_000 })
    const activeEventCount = page.locator('[data-testid="active-event-count"]')
    assert(
      /1 ativo\(s\)/i.test(await activeEventCount.innerText()),
      'Release EVE nao reconheceu o Treino Inicial ativo.',
    )

    await page.locator('[data-testid="event-card-build-rarity-draw"]').click()
    await page.locator('[data-testid="activate-build-rarity-draw"]').click()
    await activeEventCount.filter({ hasText: /2 ativo\(s\)/i }).waitFor({ timeout: 10_000 })
    const workspaceBeforeDraw = await page.evaluate(() =>
      JSON.stringify(window.fushiDesktop?.loadJson?.({ name: 'workspace', scope: 'app' })),
    )
    await page.locator('[data-testid="start-rarity-draw"]').click()
    const rarityPresentation = page.locator('[data-testid="build-rarity-presentation"]')
    await rarityPresentation.waitFor({ state: 'visible', timeout: 10_000 })
    await page.waitForFunction(() =>
      document.querySelector('[data-testid="build-rarity-presentation"]')?.getAttribute('data-phase') === 'revealed',
    )
    const workspaceAfterDraw = await page.evaluate(() =>
      JSON.stringify(window.fushiDesktop?.loadJson?.({ name: 'workspace', scope: 'app' })),
    )
    assert(
      workspaceBeforeDraw === workspaceAfterDraw,
      'Release sorteio visual alterou ficha/workspace sem passar pelo BUI.',
    )
    assert(
      /clique em qualquer lugar/i.test(await rarityPresentation.innerText()),
      'Release nao informou como fechar a raridade revelada.',
    )
    await rarityPresentation.click({ position: { x: 12, y: 12 } })
    await rarityPresentation.waitFor({ state: 'detached', timeout: 5_000 })
    let clearBacklogDialogMessage = ''
    page.once('dialog', (dialog) => {
      clearBacklogDialogMessage = dialog.message()
      void dialog.accept()
    })
    await page.locator('[data-testid="clear-rarity-history"]').click()
    assert(
      /limpar somente o backlog/i.test(clearBacklogDialogMessage),
      `Release confirmacao de limpeza inesperada: ${clearBacklogDialogMessage}`,
    )
    await page
      .locator('[data-testid="rarity-draw-history"]')
      .getByText('Nenhum sorteio registrado.')
      .waitFor({ timeout: 5_000 })

    await page.locator('[data-testid="event-card-skill-assignment"]').click()
    await page.locator('[data-testid="activate-skill-assignment"]').click()
    await activeEventCount.filter({ hasText: /3 ativo\(s\)/i }).waitFor({ timeout: 10_000 })

    const skillControls = page.locator('[data-testid="skill-assignment-controls"]')
    const skillCatalog = skillControls.locator('[data-testid="skill-grant-catalog"]')
    assert(
      (await skillCatalog.locator('.tabletop-skill-grant__card').count()) === 5,
      'Release EVE nao exibiu as cinco habilidades canonicas.',
    )
    await skillControls.locator('[data-testid="skill-grant-tab-ritual"]').click()
    assert(
      /EM CONSTRUCAO/i.test(await skillCatalog.innerText()),
      'Release aba Rituais nao esta marcada como construcao.',
    )
    await skillControls.locator('[data-testid="skill-grant-tab-outro"]').click()
    assert(
      /EM CONSTRUCAO/i.test(await skillCatalog.innerText()),
      'Release aba Outros nao esta marcada como construcao.',
    )
    await skillControls.locator('[data-testid="skill-grant-tab-habilidade"]').click()

    const characterSelect = skillControls.locator('[data-testid="skill-grant-character"]')
    const characterIds = await characterSelect.locator('option').evaluateAll(
      (options) => options.map((option) => option.value),
    )
    const grantIds = [
      'training-kairos-barulho-torturante',
      'training-davi-analise-cirurgica',
      'training-connor-percepcao-sensorial',
      'training-kael-pata-mansa',
      'training-grim-vida-sugada',
    ]
    let assignedCharacterId = ''
    let smokeGrantId = ''
    let assignButton = null

    for (const characterId of characterIds) {
      await characterSelect.selectOption(characterId)
      for (const grantId of grantIds) {
        const candidate = skillControls.locator(
          `[data-testid="assign-character-grant-${grantId}"]`,
        )
        if (!(await candidate.isDisabled())) {
          assignedCharacterId = characterId
          smokeGrantId = grantId
          assignButton = candidate
          break
        }
      }
      if (assignButton) break
    }

    assert(assignButton && assignedCharacterId && smokeGrantId, 'Release nao encontrou atribuicao limpa para testar.')
    await assignButton.click()
    await page.waitForFunction(
      ({ characterId, grantId }) => {
        const workspace = window.fushiDesktop?.loadJson?.({
          name: 'workspace',
          scope: 'app',
        })
        const characters = Array.isArray(workspace?.characters)
          ? workspace.characters
          : workspace?.characters?.items ?? []
        const character = characters.find?.(
          (candidate) => candidate.id === characterId,
        )
        return (
          character?.habilidadesDetalhadas?.filter?.(
            (feature) => feature.id === grantId,
          )?.length === 1
        )
      },
      { characterId: assignedCharacterId, grantId: smokeGrantId },
      { timeout: 10_000 },
    )
    assert(await assignButton.isDisabled(), 'Release permitiu duplicar a habilidade atribuida.')
    await skillControls.locator('[data-testid="deactivate-skill-assignment"]').click()
    await activeEventCount.filter({ hasText: /2 ativo\(s\)/i }).waitFor({ timeout: 10_000 })

    await page.locator('[data-testid="event-card-build-rarity-draw"]').click()
    await page.locator('[data-testid="deactivate-build-rarity-draw"]').click()
    await activeEventCount.filter({ hasText: /1 ativo\(s\)/i }).waitFor({ timeout: 10_000 })

    await page.locator('[data-testid="event-card-initial-training"]').click()
    await page.locator('[data-testid="deactivate-initial-training"]').click()
    await page.waitForFunction(
      ({ campaignId }) => {
        const session = window.fushiDesktop?.loadJson?.({
          campaignId,
          name: 'session',
          scope: 'campaign',
        })
        const events = session?.eventState?.events
        return Boolean(
          events &&
            Object.values(events).every((event) => event?.isActive === false) &&
            session?.trainingState?.isActive === false,
        )
      },
      seededTraining,
      { timeout: 10_000 },
    )
    await trainingOverlay.waitFor({ state: 'detached', timeout: 10_000 })
    await page.waitForFunction(
      ({ campaignId }) => {
        const session = window.fushiDesktop?.loadJson?.({
          campaignId,
          name: 'session',
          scope: 'campaign',
        })
        return (
          session?.eventState?.events?.['initial-training']?.isActive === false &&
          session?.trainingState?.isActive === false &&
          session?.trainingState?.participants?.find?.(
            (participant) => participant.id === 'player1',
          )?.stations?.escalada?.progress === 2
        )
      },
      seededTraining,
      { timeout: 10_000 },
    )

    const actionableFailedRequests = failedRequests.filter(
      (requestFailure) => !isBenignFailedRequest(requestFailure),
    )
    assert(
      actionableFailedRequests.length === 0,
      `Release registrou requestfailed: ${actionableFailedRequests.join(' | ')}`,
    )
    const actionableConsoleErrors = consoleErrors.filter(
      (consoleError) => !isBenignConsoleError(consoleError),
    )
    assert(
      actionableConsoleErrors.length === 0,
      `Release registrou console.error: ${actionableConsoleErrors.join(' | ')}`,
    )
    assert(pageErrors.length === 0, `Release registrou erro de pagina: ${pageErrors.join(' | ')}`)
  } finally {
    await app.close()
    fs.rmSync(userDataDir, { recursive: true, force: true })
    fs.rmSync(appDataDir, { recursive: true, force: true })
  }

  console.log('smoke:release ok')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
