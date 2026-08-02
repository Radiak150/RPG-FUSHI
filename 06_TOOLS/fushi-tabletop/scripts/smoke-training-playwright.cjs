const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { chromium } = require('playwright')

const port = Number(process.env.FUSHI_TRAINING_SMOKE_PORT || 5178)
const baseUrl = `http://127.0.0.1:${port}`
const root = path.resolve(__dirname, '..')
const artifactDirectory = path.join(root, '.codex-dev', 'artifact-work')
const isolatedRuntimeDirectory = path.join(
  root,
  '.codex-dev',
  'smoke-training-runtime',
  String(process.pid),
)

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function isServerReady() {
  return new Promise((resolve) => {
    const request = http.get(`${baseUrl}/jogar/mesa`, (response) => {
      response.resume()
      resolve(response.statusCode >= 200 && response.statusCode < 500)
    })

    request.on('error', () => resolve(false))
    request.setTimeout(1200, () => {
      request.destroy()
      resolve(false)
    })
  })
}

async function waitForServer() {
  const startedAt = Date.now()

  while (Date.now() - startedAt < 30_000) {
    if (await isServerReady()) return
    await wait(300)
  }

  throw new Error(`Vite nao respondeu em ${baseUrl}.`)
}

function startDevServer() {
  const viteEntry = path.resolve(root, 'node_modules/vite/bin/vite.js')

  return spawn(process.execPath, [viteEntry, '--host', '127.0.0.1', '--port', String(port)], {
    cwd: root,
    env: {
      ...process.env,
      FUSHI_ASSET_DIR: path.join(isolatedRuntimeDirectory, 'assets'),
      FUSHI_AUTOSAVE_DIR: path.join(isolatedRuntimeDirectory, 'autosave'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

async function loginAsGmIfNeeded(page) {
  const passwordInput = page.locator('input[type="password"]')

  try {
    await passwordInput.waitFor({ state: 'visible', timeout: 10_000 })
  } catch {
    if ((await page.locator('.tabletop-screen').count()) > 0) return
    throw new Error('Entrada do Mestre nao exibiu o campo de senha.')
  }
  await passwordInput.fill('mestre1')
  await page.locator('button[type="submit"]').click()
}

async function waitForTabletop(page, label) {
  try {
    await page.locator('.tabletop-screen').waitFor({ timeout: 20_000 })
  } catch (error) {
    const bodyText = await page.locator('body').innerText().catch(() => '')
    throw new Error(
      `${label}: Mesa nao abriu em ${page.url()}. Tela: ${bodyText.slice(0, 900)}`,
      { cause: error },
    )
  }
}

async function seedTrainingState(page) {
  return page.evaluate(() => {
    const fallbackSessionKey = Object.keys(window.localStorage).find((key) =>
      key.includes('fushi-tabletop:mesa-session:v1:campaign:'),
    )
    const workspace = JSON.parse(
      window.localStorage.getItem('fushi-tabletop:workspace:v1') || 'null',
    )
    const activeCampaignId = workspace?.campaigns?.activeCampaignId || ''
    const sessionKey = activeCampaignId
      ? `fushi-tabletop:mesa-session:v1:campaign:${activeCampaignId}`
      : fallbackSessionKey

    if (!sessionKey) {
      throw new Error(
        `Sessao persistida nao foi encontrada no navegador. Chaves: ${Object.keys(window.localStorage).join(', ')}`,
      )
    }

    let session = JSON.parse(
      window.localStorage.getItem(sessionKey) ||
      window.localStorage.getItem(fallbackSessionKey) ||
      'null',
    )
    if (!session) {
      session = {
        currentSceneId: 'training-smoke-scene',
        initialSceneId: 'training-smoke-scene',
        isGridVisible: true,
        logEntries: [],
        scenes: [
          {
            id: 'training-smoke-scene',
            mapId: 'planicie_livre',
            name: 'Campo de Treinamento Smoke',
            objects: [],
            tokens: [],
          },
        ],
        selectedTokenId: '',
        selectedTokenIds: [],
        tokens: [],
        version: 16,
      }
    }
    const sceneTokens = (session?.scenes || []).flatMap((scene) => scene.tokens || [])
    let participantTokens = []
    const usedPlayers = new Set()

    for (const token of sceneTokens) {
      const playerId = token.controladoPorJogadorId || token.persistentControl?.playerId || ''

      if (!/^player[1-5]$/.test(playerId) || usedPlayers.has(playerId)) continue
      usedPlayers.add(playerId)
      participantTokens.push({ playerId, token })
    }

    participantTokens.sort((left, right) => left.playerId.localeCompare(right.playerId))

    if (participantTokens.length < 5) {
      const usedTokenIds = new Set(participantTokens.map((entry) => entry.token.id))
      const usedCharacterIds = new Set(
        participantTokens.map((entry) => entry.token.characterId),
      )
      const availablePlayerIds = ['player1', 'player2', 'player3', 'player4', 'player5']
        .filter((playerId) => !participantTokens.some((entry) => entry.playerId === playerId))

      for (const token of sceneTokens) {
        if (
          participantTokens.length >= 5 ||
          !token?.id ||
          !token?.characterId ||
          usedTokenIds.has(token.id) ||
          usedCharacterIds.has(token.characterId)
        ) {
          continue
        }

        const playerId = availablePlayerIds.shift()
        if (!playerId) break
        participantTokens.push({ playerId, token })
        usedTokenIds.add(token.id)
        usedCharacterIds.add(token.characterId)
      }

      participantTokens.sort((left, right) => left.playerId.localeCompare(right.playerId))
    }

    if (participantTokens.length === 0) {
      const workspaceCharacters = Array.isArray(workspace?.characters?.items)
        ? workspace.characters.items
        : Array.isArray(workspace?.characters)
          ? workspace.characters
          : []
      const access = JSON.parse(
        window.localStorage.getItem('fushi-tabletop:access-control:v1') || 'null',
      )
      const profiles = Array.isArray(access?.profiles) ? access.profiles : []

      participantTokens = ['player1', 'player2', 'player3', 'player4', 'player5']
        .map((playerId, index) => {
          const profile = profiles.find((entry) => entry.id === playerId)
          const character = workspaceCharacters.find(
            (entry) => entry.id === profile?.characterId,
          ) ?? workspaceCharacters[index]
          return {
            playerId,
            token: {
              characterId:
                profile?.characterId || character?.id || `training-smoke-character-${index + 1}`,
              color: ['#8b63d8', '#d8bb4a', '#69bb72', '#f2f2f2', '#30343a'][index],
              controladoPorJogadorId: playerId,
              id: `training-smoke-token-${index + 1}`,
              label: character?.nome || `Jogador ${index + 1}`,
              persistentControl: { playerId },
              visibility: 'public',
            },
          }
        })
    }

    while (participantTokens.length < 5 && sceneTokens.length > 0) {
      const playerId = ['player1', 'player2', 'player3', 'player4', 'player5']
        .find((candidate) => !participantTokens.some((entry) => entry.playerId === candidate))
      const sourceToken = sceneTokens[participantTokens.length % sceneTokens.length]

      if (!playerId) break

      participantTokens.push({
        playerId,
        token: {
          ...sourceToken,
          characterId: `${sourceToken.characterId}-training-smoke-${playerId}`,
          id: `${sourceToken.id}-training-smoke-${playerId}`,
          label: `Jogador ${participantTokens.length + 1}`,
        },
      })
    }

    if (participantTokens.length !== 5) {
      throw new Error(`Esperava 5 corpos vinculados, encontrei ${participantTokens.length}.`)
    }

    const activeScene = session.scenes.find((scene) => scene.id === session.currentSceneId)
      ?? session.scenes[0]
    if (activeScene) {
      activeScene.mapId = 'planicie_livre'
      session.currentSceneId = activeScene.id
    }
    if (activeScene && (!Array.isArray(activeScene.tokens) || activeScene.tokens.length === 0)) {
      activeScene.tokens = participantTokens.map((entry, index) => ({
        ...entry.token,
        cell: { column: 2 + index, row: 2 },
      }))
      session.tokens = activeScene.tokens
    }

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
      mapId: 'planicie_livre',
      participants: participantTokens.map(({ playerId, token }) => ({
        activeStationId: 'escalada',
        characterId: token.characterId,
        color: token.color || '#92c0b6',
        id: playerId,
        label: `J${playerId.replace('player', '')}`,
        name: token.label || playerId,
        playerId,
        stations: Object.fromEntries(
          stationIds.map((stationId) => [
            stationId,
            {
              boldSuccesses: 0,
              progress: 0,
              setbacks: 0,
              status: 'pending',
            },
          ]),
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
          activatedAt: now,
          isActive: true,
          restoreMapId: 'planicie_livre',
          updatedAt: now,
        },
        'build-rarity-draw': {
          isActive: false,
          updatedAt: now,
        },
        'skill-assignment': {
          isActive: false,
          updatedAt: now,
        },
      },
      rarityDraw: {
        characterId: '',
        characterName: '',
        drawId: '',
        itemId: '',
        itemName: '',
        phase: 'idle',
      },
      updatedAt: now,
      version: 1,
    }
    session.version = 16

    window.localStorage.setItem(sessionKey, JSON.stringify(session))

    const libraryKey = activeCampaignId
      ? `fushi-tabletop:asset-library:v1:campaign:${activeCampaignId}`
      : 'fushi-tabletop:asset-library:v1'
    const library = JSON.parse(window.localStorage.getItem(libraryKey) || '{}')
    library.mapOverrides = {
      ...(library.mapOverrides || {}),
      planicie_livre: {
        ...(library.mapOverrides?.planicie_livre || {}),
        mapVisibility: 'ativo_para_jogadores',
      },
    }
    window.localStorage.setItem(libraryKey, JSON.stringify(library))

    return {
      sessionKey,
      sessionValue: JSON.stringify(session),
      storageEntries: Object.fromEntries(
        Object.keys(window.localStorage).map((key) => [
          key,
          window.localStorage.getItem(key) || '',
        ]),
      ),
    }
  })
}

async function assertDockInsideViewport(page, label) {
  const bounds = await page.locator('.tabletop-training-dock').boundingBox()
  const viewport = page.viewportSize()

  if (
    !bounds ||
    !viewport ||
    bounds.x < 0 ||
    bounds.y < 0 ||
    bounds.x + bounds.width > viewport.width + 1 ||
    bounds.y + bounds.height > viewport.height + 1
  ) {
    throw new Error(`${label}: painel saiu da viewport: ${JSON.stringify({ bounds, viewport })}`)
  }
}

async function openEventManager(page) {
  const eventButton = page.getByRole('button', { name: 'Eventos da mesa', exact: true })

  if ((await eventButton.count()) === 0 || !(await eventButton.isVisible())) {
    await page.getByRole('button', { name: 'Abrir ferramentas', exact: true }).click()
  }

  await eventButton.click()
  await page.locator('[data-testid="event-manager"]').waitFor({ timeout: 10_000 })
}

async function main() {
  fs.mkdirSync(artifactDirectory, { recursive: true })
  const server = startDevServer()
  let browser

  try {
    await waitForServer()
    browser = await chromium.launch({ headless: true })

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const gmPage = await context.newPage()
    const gmErrors = []
    const gmHttpErrors = []
    gmPage.on('pageerror', (error) => {
      gmErrors.push(`pageerror: ${error.message}`)
    })
    gmPage.on('console', (message) => {
      if (
        message.type() === 'error' &&
        !message.text().includes('ERR_UNKNOWN_URL_SCHEME')
      ) {
        gmErrors.push(message.text())
      }
    })
    gmPage.on('response', (response) => {
      if (response.status() >= 500) {
        gmHttpErrors.push(`${response.status()} ${response.url()}`)
      }
    })
    await gmPage.goto(`${baseUrl}/jogar/mesa`, { waitUntil: 'domcontentloaded' })
    await loginAsGmIfNeeded(gmPage)
    await waitForTabletop(gmPage, 'Entrada do Mestre')
    await gmPage.waitForTimeout(1_000)
    const seeded = await seedTrainingState(gmPage)
    const storageWriter = await context.newPage()
    await storageWriter.goto(`${baseUrl}/launcher`, {
      waitUntil: 'domcontentloaded',
    })
    await storageWriter.evaluate(({ sessionKey, sessionValue }) => {
      const signaledSession = JSON.parse(sessionValue)
      signaledSession.updatedAt = Date.now()
      window.localStorage.setItem(sessionKey, JSON.stringify(signaledSession))
    }, seeded)
    await storageWriter.close()
    try {
      await gmPage.locator('[data-testid="training-arc-overlay"]').waitFor({ timeout: 20_000 })
    } catch (error) {
      const diagnostics = await gmPage.evaluate(() =>
        Object.fromEntries(
          Object.keys(window.localStorage)
            .filter((key) => key.includes('mesa-session'))
            .map((key) => {
              const value = JSON.parse(window.localStorage.getItem(key) || 'null')
              return [key, {
                isActive: value?.trainingState?.isActive,
                participantCount: value?.trainingState?.participants?.length,
              }]
            }),
        ),
      )
      throw new Error(`Mestre nao recebeu overlay: ${JSON.stringify(diagnostics)}`, {
        cause: error,
      })
    }
    await gmPage.getByTitle('Abrir treinamento').click()

    const gmText = await gmPage.locator('[data-testid="training-arc-overlay"]').innerText()
    if (!/Somente Mestre/i.test(gmText) || !gmText.includes('DT 10')) {
      throw new Error(`Painel do Mestre nao exibiu guia privado e DT. Texto: ${gmText}`)
    }
    await assertDockInsideViewport(gmPage, 'Mestre desktop')
    await gmPage.locator('[data-testid="training-participant-player1"]').click()
    await gmPage.getByRole('button', { name: '+1 Marca', exact: true }).click()
    await gmPage.waitForFunction(
      (sessionKey) => {
        const saved = JSON.parse(window.localStorage.getItem(sessionKey) || 'null')
        return saved?.trainingState?.participants
          ?.find?.((participant) => participant.id === 'player1')
          ?.stations?.escalada?.progress === 1
      },
      seeded.sessionKey,
      { timeout: 8_000 },
    )

    const savedProgress = await gmPage.evaluate((sessionKey) => {
      const saved = JSON.parse(window.localStorage.getItem(sessionKey) || 'null')
      return saved?.trainingState?.participants
        ?.find?.((participant) => participant.id === 'player1')
        ?.stations?.escalada?.progress
    }, seeded.sessionKey)
    if (savedProgress !== 1) {
      throw new Error(`Clique do Mestre nao persistiu +1 Marca: ${savedProgress}.`)
    }

    await gmPage.screenshot({
      path: path.join(artifactDirectory, 'training-arc-gm.png'),
      fullPage: false,
    })
    await gmPage.setViewportSize({ width: 760, height: 760 })
    await gmPage.waitForTimeout(250)
    await assertDockInsideViewport(gmPage, 'Mestre compacto')

    await gmPage.setViewportSize({ width: 1440, height: 900 })
    await openEventManager(gmPage)
    const activeEventCount = gmPage.locator('[data-testid="active-event-count"]')
    if (!/^1 ativo\(s\)$/i.test((await activeEventCount.innerText()).trim())) {
      throw new Error(`EVE nao reconheceu apenas o treino ativo: ${await activeEventCount.innerText()}`)
    }

    await gmPage.locator('[data-testid="event-card-build-rarity-draw"]').click()
    await gmPage.locator('[data-testid="activate-build-rarity-draw"]').click()
    await activeEventCount.filter({ hasText: /2 ativo\(s\)/i }).waitFor({ timeout: 10_000 })

    const workspaceBeforeDraw = await gmPage.evaluate(() =>
      window.localStorage.getItem('fushi-tabletop:workspace:v1'),
    )
    await gmPage.locator('[data-testid="start-rarity-draw"]').click()
    const rarityPresentation = gmPage.locator('[data-testid="build-rarity-presentation"]')
    await rarityPresentation.waitFor({ timeout: 10_000 })
    await rarityPresentation.locator('[data-phase="revealed"]').waitFor({ timeout: 6_000 }).catch(() => {})
    await gmPage.waitForFunction(() =>
      document.querySelector('[data-testid="build-rarity-presentation"]')?.getAttribute('data-phase') === 'revealed',
    )
    const workspaceAfterDraw = await gmPage.evaluate(() =>
      window.localStorage.getItem('fushi-tabletop:workspace:v1'),
    )
    if (workspaceBeforeDraw !== workspaceAfterDraw) {
      throw new Error('Sorteio visual alterou a ficha/workspace sem passar pelo BUI.')
    }
    const rarityHistory = gmPage.locator('[data-testid="rarity-draw-history"]')
    await rarityHistory.waitFor({ timeout: 10_000 })
    const rarityHistoryText = await rarityHistory.innerText()
    if (!/backlog do evento/i.test(rarityHistoryText) || !/d10:/i.test(rarityHistoryText)) {
      throw new Error(`EVE nao preservou o backlog privado do Mestre: ${rarityHistoryText}`)
    }
    await gmPage.screenshot({
      path: path.join(artifactDirectory, 'event-rarity-gm.png'),
      fullPage: false,
    })
    if (!/clique em qualquer lugar/i.test(await rarityPresentation.innerText())) {
      throw new Error('Apresentacao revelada nao informou como continuar.')
    }
    await rarityPresentation.click({ position: { x: 12, y: 12 } })
    await rarityPresentation.waitFor({ state: 'detached', timeout: 5_000 })
    let clearBacklogDialogMessage = ''
    gmPage.once('dialog', (dialog) => {
      clearBacklogDialogMessage = dialog.message()
      void dialog.accept()
    })
    await gmPage.locator('[data-testid="clear-rarity-history"]').click()
    if (!/limpar somente o backlog/i.test(clearBacklogDialogMessage)) {
      throw new Error(`Confirmacao de limpeza do backlog inesperada: ${clearBacklogDialogMessage}`)
    }
    await gmPage
      .locator('[data-testid="rarity-draw-history"]')
      .getByText('Nenhum sorteio registrado.')
      .waitFor({ timeout: 5_000 })

    await gmPage.locator('[data-testid="event-card-skill-assignment"]').click()
    await gmPage.locator('[data-testid="activate-skill-assignment"]').click()
    await activeEventCount.filter({ hasText: /3 ativo\(s\)/i }).waitFor({ timeout: 10_000 })

    const skillControls = gmPage.locator('[data-testid="skill-assignment-controls"]')
    const skillCatalog = skillControls.locator('[data-testid="skill-grant-catalog"]')
    const skillCards = skillCatalog.locator('.tabletop-skill-grant__card')
    if ((await skillCards.count()) !== 5) {
      throw new Error(`EVE esperava cinco habilidades canonicas, encontrou ${await skillCards.count()}.`)
    }

    await skillControls.locator('[data-testid="skill-grant-tab-ritual"]').click()
    if (!/EM CONSTRUCAO/i.test(await skillCatalog.innerText())) {
      throw new Error('Aba Rituais nao esta marcada como EM CONSTRUCAO.')
    }
    await skillControls.locator('[data-testid="skill-grant-tab-outro"]').click()
    if (!/EM CONSTRUCAO/i.test(await skillCatalog.innerText())) {
      throw new Error('Aba Outros nao esta marcada como EM CONSTRUCAO.')
    }
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
      // The controlled select updates before React finishes swapping the canonical sheet.
      await gmPage.waitForTimeout(100)
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

    if (!assignButton || !assignedCharacterId || !smokeGrantId) {
      throw new Error('EVE nao encontrou uma combinacao limpa de ficha e habilidade para o smoke.')
    }
    const selectedCharacterBeforeAssign = await characterSelect.inputValue()
    const assignButtonText = (await assignButton.innerText()).trim()
    await assignButton.click()
    try {
      await gmPage.waitForFunction(
        ({ characterId, grantId }) => {
          const workspace = JSON.parse(
            window.localStorage.getItem('fushi-tabletop:workspace:v1') || 'null',
          )
          const characters = Array.isArray(workspace?.characters)
            ? workspace.characters
            : workspace?.characters?.items ?? []
          const character = characters.find?.(
            (candidate) => candidate.id === characterId,
          )
          return character?.habilidadesDetalhadas?.some?.(
            (feature) => feature.id === grantId,
          ) === true
        },
        { characterId: assignedCharacterId, grantId: smokeGrantId },
        { timeout: 10_000 },
      )
    } catch (error) {
      const diagnostics = await gmPage.evaluate(
        ({ expectedCharacterId, grantId }) => {
          const workspace = JSON.parse(
            window.localStorage.getItem('fushi-tabletop:workspace:v1') || 'null',
          )
          const characters = Array.isArray(workspace?.characters)
            ? workspace.characters
            : workspace?.characters?.items ?? []
          return {
            characterFeatures: characters.map((character) => ({
              grants: (character.habilidadesDetalhadas ?? [])
                .filter((feature) => feature.id === grantId)
                .map((feature) => feature.id),
              id: character.id,
              name: character.nome,
            })),
            expectedCharacterId,
            feedback: document.body.innerText
              .split('\n')
              .filter((line) => /atribu|construcao|ficha real|ja possui/i.test(line))
              .slice(-8),
            grantId,
            localStorageKeys: Object.keys(window.localStorage),
            selectedCharacterId:
              document.querySelector('[data-testid="skill-grant-character"]')?.value ?? '',
          }
        },
        {
          expectedCharacterId: assignedCharacterId,
          grantId: smokeGrantId,
        },
      )
      throw new Error(
        `EVE nao persistiu a habilidade selecionada. ` +
        `Select antes=${selectedCharacterBeforeAssign}; botao=${assignButtonText}; ` +
        `diagnostico=${JSON.stringify(diagnostics)}; erros=${JSON.stringify(gmErrors)}`,
        { cause: error },
      )
    }
    await assignButton.waitFor({ state: 'visible' })
    if (!(await assignButton.isDisabled())) {
      throw new Error('Atribuicao repetida continuou habilitada depois de gravar a habilidade.')
    }

    const assignedFeatureCount = await gmPage.evaluate(
      ({ characterId, grantId }) => {
        const workspace = JSON.parse(
          window.localStorage.getItem('fushi-tabletop:workspace:v1') || 'null',
        )
        const characters = Array.isArray(workspace?.characters)
          ? workspace.characters
          : workspace?.characters?.items ?? []
        const character = characters.find?.(
          (candidate) => candidate.id === characterId,
        )
        return character?.habilidadesDetalhadas?.filter?.(
          (feature) => feature.id === grantId,
        )?.length ?? 0
      },
      { characterId: assignedCharacterId, grantId: smokeGrantId },
    )
    if (assignedFeatureCount !== 1) {
      throw new Error(
        `EVE nao persistiu uma unica habilidade na ficha canonica: ${assignedFeatureCount}.`,
      )
    }
    await gmPage.screenshot({
      path: path.join(artifactDirectory, 'event-skill-assignment-gm.png'),
      fullPage: false,
    })
    await skillControls.locator('[data-testid="deactivate-skill-assignment"]').click()
    await activeEventCount.filter({ hasText: /2 ativo\(s\)/i }).waitFor({ timeout: 10_000 })

    await gmPage
      .locator('.floating-window')
      .filter({ has: gmPage.locator('[data-testid="event-manager"]') })
      .getByRole('button', { name: 'Fechar janela' })
      .click()

    const accessWriter = await context.newPage()
    await accessWriter.goto(`${baseUrl}/launcher`, {
      waitUntil: 'domcontentloaded',
    })
    await accessWriter.evaluate(() => {
      const accessKey = 'fushi-tabletop:access-control:v1'
      const access = JSON.parse(window.localStorage.getItem(accessKey) || 'null')

      if (access) {
        access.activeProfileId = ''
        window.localStorage.setItem(accessKey, JSON.stringify(access))
      }
    })
    await accessWriter.close()

    const playerPage = await context.newPage()
    await playerPage.setViewportSize({ width: 1280, height: 800 })
    const playerErrors = []
    const playerHttpErrors = []
    playerPage.on('console', (message) => {
      if (
        message.type() === 'error' &&
        !message.text().includes('ERR_UNKNOWN_URL_SCHEME')
      ) {
        playerErrors.push(message.text())
      }
    })
    playerPage.on('response', (response) => {
      if (response.status() >= 500) {
        playerHttpErrors.push(`${response.status()} ${response.url()}`)
      }
    })
    await playerPage.goto(`${baseUrl}/jogar/mesa`, { waitUntil: 'domcontentloaded' })
    await playerPage.getByRole('button', { name: /Jogador 1/ }).click()
    await playerPage.locator('input[type="password"]').fill('111')
    await playerPage.locator('button[type="submit"]').click()
    await waitForTabletop(playerPage, 'Entrada do Jogador')
    try {
      await playerPage.locator('[data-testid="training-arc-overlay"]').waitFor({ timeout: 20_000 })
    } catch (error) {
      const diagnostics = await playerPage.evaluate((sessionKey) => {
        const stored = JSON.parse(window.localStorage.getItem(sessionKey) || 'null')
        return {
          isActive: stored?.trainingState?.isActive,
          participantCount: stored?.trainingState?.participants?.length,
        }
      }, seeded.sessionKey)
      throw new Error(`Jogador nao recebeu overlay: ${JSON.stringify(diagnostics)}`, {
        cause: error,
      })
    }
    await playerPage.locator('[data-testid="build-rarity-presentation"]').waitFor({
      timeout: 10_000,
    })
    await playerPage.waitForFunction(() =>
      document.querySelector('[data-testid="build-rarity-presentation"]')?.getAttribute('data-phase') === 'revealed',
    )
    const playerRarityPresentation = playerPage.locator(
      '[data-testid="build-rarity-presentation"]',
    )
    if (!/clique em qualquer lugar/i.test(await playerRarityPresentation.innerText())) {
      throw new Error('Jogador nao recebeu instrucao para fechar a raridade revelada.')
    }
    await playerPage.evaluate(() => {
      document.querySelector('[data-testid="build-rarity-presentation"]')?.click()
    })
    await playerPage
      .locator('[data-testid="build-rarity-presentation"]')
      .waitFor({ state: 'detached', timeout: 5_000 })
    if (
      (await playerPage.getByRole('button', { name: 'Eventos da mesa', exact: true }).count()) > 0 ||
      (await playerPage.locator('[data-testid="event-manager"]').count()) > 0
    ) {
      throw new Error('Jogador recebeu controles exclusivos do EVE.')
    }
    await playerPage.getByTitle('Abrir treinamento').click()
    await playerPage.locator('[data-testid="training-participant-player1"]').click()

    const playerText = await playerPage.locator('[data-testid="training-arc-overlay"]').innerText()
    if (
      playerText.includes('Somente Mestre') ||
      /DT\s+\d+/i.test(playerText) ||
      (await playerPage.getByRole('button', { name: '+1 Marca', exact: true }).count()) > 0
    ) {
      throw new Error('Painel do Jogador exibiu DT ou controles exclusivos do Mestre.')
    }
    if (!playerText.includes('1/3') || !playerText.includes('Escalada')) {
      const playerProgressDiagnostics = await playerPage.evaluate((sessionKey) => {
        const saved = JSON.parse(window.localStorage.getItem(sessionKey) || 'null')
        return saved?.trainingState?.participants?.map?.((participant) => ({
          escalada: participant.stations?.escalada?.progress,
          id: participant.id,
        }))
      }, seeded.sessionKey)
      throw new Error(
        `Painel do Jogador nao recebeu o progresso persistido do Mestre. ` +
        `Estado=${JSON.stringify(playerProgressDiagnostics)} Texto=${playerText.slice(0, 1200)}`,
      )
    }
    await assertDockInsideViewport(playerPage, 'Jogador desktop')
    await playerPage.screenshot({
      path: path.join(artifactDirectory, 'training-arc-player.png'),
      fullPage: false,
    })

    await openEventManager(gmPage)
    await gmPage.locator('[data-testid="event-card-build-rarity-draw"]').click()
    await gmPage.locator('[data-testid="deactivate-build-rarity-draw"]').click()
    await activeEventCount.filter({ hasText: /1 ativo\(s\)/i }).waitFor({ timeout: 10_000 })

    await gmPage.locator('[data-testid="event-card-initial-training"]').click()
    await gmPage.locator('[data-testid="deactivate-initial-training"]').click()
    await activeEventCount.filter({ hasText: /0 ativo\(s\)/i }).waitFor({ timeout: 10_000 })
    await gmPage.locator('[data-testid="training-arc-overlay"]').waitFor({
      state: 'detached',
      timeout: 10_000,
    })
    await playerPage.locator('[data-testid="training-arc-overlay"]').waitFor({
      state: 'detached',
      timeout: 10_000,
    })

    const preservedProgress = await gmPage.evaluate((sessionKey) => {
      const saved = JSON.parse(window.localStorage.getItem(sessionKey) || 'null')
      return saved?.trainingState?.participants
        ?.find?.((participant) => participant.id === 'player1')
        ?.stations?.escalada?.progress
    }, seeded.sessionKey)
    if (preservedProgress !== 1) {
      throw new Error(`Desativar treino apagou o progresso salvo: ${preservedProgress}.`)
    }

    await gmPage.locator('[data-testid="activate-initial-training"]').click()
    try {
      await activeEventCount.filter({ hasText: /1 ativo\(s\)/i }).waitFor({ timeout: 20_000 })
    } catch (error) {
      const diagnostics = await gmPage.evaluate((sessionKey) => {
        const saved = JSON.parse(window.localStorage.getItem(sessionKey) || 'null')
        return {
          eventActive: saved?.eventState?.events?.['initial-training']?.isActive,
          trainingActive: saved?.trainingState?.isActive,
          eventCount: document.querySelector('[data-testid="active-event-count"]')?.textContent,
          body: document.body.innerText.slice(0, 700),
        }
      }, seeded.sessionKey)
      throw new Error(`Mestre nao reativou o treino: ${JSON.stringify(diagnostics)}`, {
        cause: error,
      })
    }
    await gmPage.locator('[data-testid="training-arc-overlay"]').waitFor({ timeout: 20_000 })
    const reactivatedStorageState = await context.storageState()

    // The local player fixture intentionally does not subscribe to the GM's
    // localStorage writes. Use a separate context for the reentry so it emulates
    // another machine and cannot overwrite the GM with stale in-memory state.
    const reentryContext = await browser.newContext({
      storageState: reactivatedStorageState,
      viewport: { width: 1280, height: 800 },
    })
    const reentryPage = await reentryContext.newPage()
    reentryPage.on('console', (message) => {
      if (
        message.type() === 'error' &&
        !message.text().includes('ERR_UNKNOWN_URL_SCHEME')
      ) {
        playerErrors.push(message.text())
      }
    })
    reentryPage.on('response', (response) => {
      if (response.status() >= 500) {
        playerHttpErrors.push(`${response.status()} ${response.url()}`)
      }
    })
    await reentryPage.goto(`${baseUrl}/jogar/mesa`, { waitUntil: 'domcontentloaded' })
    await reentryPage.getByRole('button', { name: /Jogador 1/ }).click()
    await reentryPage.locator('input[type="password"]').fill('111')
    await reentryPage.locator('button[type="submit"]').click()
    await waitForTabletop(reentryPage, 'Reentrada do Jogador')
    try {
      await reentryPage.locator('[data-testid="training-arc-overlay"]').waitFor({ timeout: 20_000 })
    } catch (error) {
      const diagnostics = await reentryPage.evaluate((sessionKey) => {
        const saved = JSON.parse(window.localStorage.getItem(sessionKey) || 'null')
        return {
          eventActive: saved?.eventState?.events?.['initial-training']?.isActive,
          trainingActive: saved?.trainingState?.isActive,
          currentSceneId: saved?.currentSceneId,
          body: document.body.innerText.slice(0, 700),
          url: window.location.href,
        }
      }, seeded.sessionKey)
      const gmDiagnostics = await gmPage.evaluate((sessionKey) => {
        const saved = JSON.parse(window.localStorage.getItem(sessionKey) || 'null')
        return {
          eventActive: saved?.eventState?.events?.['initial-training']?.isActive,
          trainingActive: saved?.trainingState?.isActive,
          currentSceneId: saved?.currentSceneId,
          body: document.body.innerText.slice(0, 700),
        }
      }, seeded.sessionKey)
      throw new Error(`Jogador nao recebeu reativacao: ${JSON.stringify({ player: diagnostics, gm: gmDiagnostics })}`, {
        cause: error,
      })
    }
    await reentryContext.close()

    if (gmErrors.length || playerErrors.length) {
      const browserPersistenceEndpoint = '/api/fushi/persistence/state'
      const isBrowserPersistenceFallback = (errors, httpErrors) =>
        errors.length > 0 &&
        errors.every((message) => /Failed to load resource/i.test(message)) &&
        httpErrors.length > 0 &&
        httpErrors.every((entry) => entry.endsWith(browserPersistenceEndpoint))

      const meaningfulGmErrors = isBrowserPersistenceFallback(gmErrors, gmHttpErrors)
        ? []
        : gmErrors
      const meaningfulPlayerErrors = isBrowserPersistenceFallback(playerErrors, playerHttpErrors)
        ? []
        : playerErrors

      if (meaningfulGmErrors.length || meaningfulPlayerErrors.length) {
        throw new Error(
          `console.error no fluxo visual: ${JSON.stringify({
            gmErrors: meaningfulGmErrors,
            playerErrors: meaningfulPlayerErrors,
            gmHttpErrors,
            playerHttpErrors,
          })}`,
        )
      }

      console.log(
        `[training-ui] aviso esperado: fallback de autosave browser (${[
          ...gmHttpErrors,
          ...playerHttpErrors,
        ].join(', ')})`,
      )
    }

    await context.close()
    console.log('[training-ui] PASS')
    console.log('  Mestre: DT, controles e persistencia +1 Marca')
    console.log('  Jogador: progresso publico, sem DT ou controles')
    console.log('  EVE: tres eventos, desativacao independente e reativacao')
    console.log('  Raridade: apresentacao sincronizada sem alterar ficha/BUI')
    console.log('  Skills: cinco habilidades, ficha canonica, idempotencia e abas em construcao')
    console.log('  viewports: 1440x900, 760x760 e 1280x800')
  } finally {
    if (browser) await browser.close()
    server.kill('SIGTERM')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
