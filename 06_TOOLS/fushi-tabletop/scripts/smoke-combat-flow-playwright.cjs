const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { chromium } = require('playwright')
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
} = require('./lib/fushi-workspace-io.cjs')

const port = Number(process.env.FUSHI_COMBAT_FLOW_SMOKE_PORT || 5183)
const baseUrl = `http://127.0.0.1:${port}`
const root = path.resolve(__dirname, '..')
const statusVisualOnly = process.argv.includes('--status-visual-only')

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function fail(message) {
  throw new Error(`[combat-flow-ui] ${message}`)
}

function isServerReady() {
  return new Promise((resolve) => {
    const request = http.get(`${baseUrl}/jogar/mesa`, (response) => {
      response.resume()
      resolve(response.statusCode >= 200 && response.statusCode < 500)
    })
    request.on('error', () => resolve(false))
    request.setTimeout(1_200, () => {
      request.destroy()
      resolve(false)
    })
  })
}

async function waitForServer() {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 30_000) {
    if (await isServerReady()) return
    await wait(250)
  }
  fail(`Vite nao respondeu em ${baseUrl}`)
}

function startDevServer() {
  return spawn(
    process.execPath,
    [
      path.join(root, 'node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
    ],
    {
      cwd: root,
      env: process.env,
      stdio: 'ignore',
    },
  )
}

async function stopDevServer(serverProcess) {
  if (!serverProcess || serverProcess.exitCode !== null) return
  serverProcess.kill()
  await Promise.race([
    new Promise((resolve) => serverProcess.once('exit', resolve)),
    wait(2_000),
  ])
}

async function loginAsGmIfNeeded(page) {
  const password = page.locator('input[type="password"]')
  try {
    await password.waitFor({ state: 'visible', timeout: 10_000 })
    await password.fill('mestre1')
    await page.locator('button[type="submit"]').click()
  } catch {
    if ((await page.locator('.tabletop-screen').count()) === 0) {
      const body = await page.locator('body').innerText().catch(() => '')
      fail(`Entrada do Mestre nao apareceu. Tela: ${body.slice(0, 600)}`)
    }
  }
  await page.locator('.tabletop-screen').waitFor({ timeout: 25_000 })
}

async function openUtilityRail(page) {
  const logButton = page.getByRole('button', { name: 'Abrir chat, log e rolagem' })
  if (await logButton.isVisible().catch(() => false)) return
  const shortcuts = page.getByRole('button', { name: 'Abrir atalhos' })
  if (await shortcuts.isVisible().catch(() => false)) {
    await shortcuts.click()
  }
  await logButton.waitFor({ state: 'visible', timeout: 5_000 })
}

async function seedCombatScene(page, realCharacters) {
  return page.evaluate((charactersFromWorkspace) => {
    const normalize = (value) =>
      String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR')
    const workspaceKey = 'fushi-tabletop:workspace:v1'
    const workspace = JSON.parse(window.localStorage.getItem(workspaceKey) || 'null')
    workspace.characters = charactersFromWorkspace
    window.localStorage.setItem(workspaceKey, JSON.stringify(workspace))
    const characters = Array.isArray(workspace?.characters?.items)
      ? workspace.characters.items
      : Array.isArray(workspace?.characters)
        ? workspace.characters
        : []
    const davi = characters.find((character) => normalize(character.nome) === 'davi')
    const connor = characters.find((character) => normalize(character.nome) === 'connor')
    const grim = characters.find((character) => normalize(character.nome) === 'grim')
    const kairos = characters.find((character) => normalize(character.nome) === 'kairos')
    if (!davi || !connor || !grim || !kairos) {
      throw new Error(
        `Fichas de smoke ausentes: Davi=${Boolean(davi)} Connor=${Boolean(connor)} Grim=${Boolean(grim)} Kairos=${Boolean(kairos)} ` +
        `workspace=${Object.keys(workspace ?? {}).join(',')} ` +
        `nomes=${characters.slice(0, 20).map((character) => character.nome).join('|')}`,
      )
    }

    const activeCampaignId =
      workspace?.campaigns?.activeCampaignId ??
      workspace?.campaigns?.items?.find((campaign) => campaign.active)?.id ??
      ''
    const exactSessionKey = activeCampaignId
      ? `fushi-tabletop:mesa-session:v1:campaign:${activeCampaignId}`
      : ''
    const sessionKey =
      (exactSessionKey && window.localStorage.getItem(exactSessionKey)
        ? exactSessionKey
        : '') ||
      Object.keys(window.localStorage).find((key) =>
        key.includes('fushi-tabletop:mesa-session:v1:campaign:'),
      )
    if (!sessionKey) throw new Error('Chave da sessao da mesa nao encontrada')
    const session = JSON.parse(window.localStorage.getItem(sessionKey) || 'null')
    const scene =
      session?.scenes?.find((entry) => entry.id === session.currentSceneId) ??
      session?.scenes?.[0]
    if (!scene) throw new Error('Cena base nao encontrada')

    const sceneId = 'combat-flow-smoke-scene'
    const smokeScene = {
      ...scene,
      id: sceneId,
      name: 'Combat Flow Smoke',
      objects: [],
      tokens: [
        {
          cell: { column: 10, row: 10 },
          characterId: davi.id,
          color: '#d9b54a',
          controladoPorJogadorId: 'player2',
          id: 'combat-flow-davi',
          label: 'J2',
          persistentControl: { playerId: 'player2' },
          tokenKind: 'player_corpo',
          visibility: 'public',
        },
        {
          cell: { column: 11, row: 10 },
          characterId: connor.id,
          color: '#e8e4dc',
          controladoPorJogadorId: 'player4',
          id: 'combat-flow-connor',
          label: 'J4',
          persistentControl: { playerId: 'player4' },
          resourceOverride: {
            ...connor.recursos,
            vidaAtual: 0,
          },
          tokenKind: 'player_corpo',
          visibility: 'public',
        },
        {
          cell: { column: 9, row: 10 },
          characterId: grim.id,
          color: '#16191f',
          controladoPorJogadorId: 'player5',
          id: 'combat-flow-grim',
          label: 'J5',
          persistentControl: { playerId: 'player5' },
          resourceOverride: {
            ...grim.recursos,
            fushiAtual: grim.recursos.fushiMaximo,
            vidaAtual: 1,
          },
          tokenKind: 'player_corpo',
          visibility: 'public',
        },
        {
          cell: { column: 8, row: 10 },
          characterId: kairos.id,
          color: '#7554b7',
          controladoPorJogadorId: 'player1',
          id: 'combat-flow-kairos',
          label: 'J1',
          persistentControl: { playerId: 'player1' },
          resourceOverride: {
            ...kairos.recursos,
            vidaAtual: 4,
            vidaMaxima: Math.max(4, kairos.recursos.vidaMaxima),
          },
          tokenKind: 'player_corpo',
          visibility: 'public',
        },
      ],
    }

    const nextSession = {
      ...session,
      currentSceneId: sceneId,
      initialSceneId: sceneId,
      logEntries: [],
      playerDeathStates: {
        'combat-flow-connor': {
          failures: 0,
          results: [null, null, null],
          status: 'down',
          successes: 0,
          tokenId: 'combat-flow-connor',
          updatedAt: Date.now(),
        },
      },
      publicCombatImpacts: [],
      publicCombatMarks: [
        {
          cancelableBySource: true,
          color: '#f4f5f7',
          createdAt: Date.now() - 2,
          description: 'Efeito visual publico de teste.',
          durationRounds: 2,
          id: 'combat-flow-status-special',
          icon: 'special',
          kind: 'buff',
          label: 'Especial',
          sourceTokenId: 'combat-flow-kairos',
          stacks: 2,
          statusId: 'especial-buff',
          targetTokenId: 'combat-flow-davi',
        },
        {
          cancelableBySource: false,
          color: '#4cc5df',
          createdAt: Date.now() - 1,
          description: 'Protecao visual publica de teste.',
          durationRounds: 1,
          id: 'combat-flow-status-protection',
          icon: 'protection',
          kind: 'buff',
          label: 'Protecao',
          sourceTokenId: 'combat-flow-connor',
          stacks: 1,
          statusId: 'protecao',
          targetTokenId: 'combat-flow-davi',
        },
      ],
      publicCombatReceipt: null,
      scenes: [smokeScene],
      selectedTokenId: '',
      selectedTokenIds: [],
      tokens: smokeScene.tokens,
    }

    return {
      connorId: connor.id,
      daviId: davi.id,
      grimId: grim.id,
      kairosId: kairos.id,
      sessionKey,
      sessionValue: JSON.stringify(nextSession),
      workspaceKey,
      workspaceValue: JSON.stringify(workspace),
    }
  }, realCharacters)
}

async function main() {
  let serverProcess = null
  let browser = null

  if (!(await isServerReady())) {
    serverProcess = startDevServer()
    await waitForServer()
  }

  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({ viewport: { width: 1600, height: 960 } })
    const page = await context.newPage()
    const pageErrors = []
    const failedRequests = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        !message.text().includes('ERR_UNKNOWN_URL_SCHEME')
      ) {
        pageErrors.push(message.text())
      }
    })
    page.on('requestfailed', (request) => {
      failedRequests.push({
        error: request.failure()?.errorText ?? '',
        url: request.url(),
      })
    })

    console.log('[combat-flow-ui] abrir mesa')
    await page.goto(`${baseUrl}/jogar/mesa`, { waitUntil: 'domcontentloaded' })
    await loginAsGmIfNeeded(page)
    const workspaceSnapshot = readWorkspaceState({
      autosavePath: process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(root),
      projectRoot: root,
      workspacePath: process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath(),
    })
    const allRealCharacters = Array.isArray(workspaceSnapshot.workspace?.characters?.items)
      ? workspaceSnapshot.workspace.characters.items
      : Array.isArray(workspaceSnapshot.workspace?.characters)
        ? workspaceSnapshot.workspace.characters
        : []
    const realCharacters = allRealCharacters.filter((character) =>
      ['davi', 'connor', 'grim', 'kairos'].includes(
        String(character.nome ?? '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleLowerCase('pt-BR'),
      ),
    )
    if (realCharacters.length !== 4) {
      fail(`Workspace real sem fichas: ${workspaceSnapshot.sourcePath}`)
    }
    const seeded = await seedCombatScene(page, realCharacters)
    await page.addInitScript((seed) => {
      window.localStorage.setItem(seed.workspaceKey, seed.workspaceValue)
      window.localStorage.setItem(seed.sessionKey, seed.sessionValue)
    }, seeded)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await loginAsGmIfNeeded(page)
    pageErrors.length = 0
    failedRequests.length = 0

    const daviToken = page.getByRole('button', { name: 'Selecionar Davi' })
    const connorToken = page.getByRole('button', { name: 'Selecionar Connor' })
    try {
      await daviToken.waitFor({ state: 'visible', timeout: 15_000 })
    } catch (error) {
      const diagnostics = await page.evaluate(() => ({
        body: document.body.innerText.slice(0, 800),
        sessionKeys: Object.keys(window.localStorage).filter((key) =>
          key.includes('mesa-session'),
        ),
        tokens: Array.from(document.querySelectorAll('.tabletop-token')).map((token) =>
          token.getAttribute('aria-label'),
        ),
      }))
      fail(`Davi nao apareceu depois da semente: ${JSON.stringify(diagnostics)}; ${error.message}`)
    }
    await connorToken.waitFor({ state: 'visible', timeout: 15_000 })

    console.log('[combat-flow-ui] hierarquia visual dos estados no token')
    const statusCluster = daviToken.locator('[data-testid="token-status-cluster"]')
    const statusStrip = statusCluster.locator('[data-testid="token-status-strip"]')
    const statusPopover = statusCluster.locator('[data-testid="token-status-popover"]')
    await statusCluster.waitFor({ state: 'visible', timeout: 8_000 })
    if ((await statusStrip.locator('.tabletop-token__status-glyph').count()) !== 2) {
      fail('Faixa compacta nao exibiu os dois estados publicos')
    }
    const stripText = await statusStrip.innerText()
    if (/Especial|Protecao/i.test(stripText)) {
      fail(`Faixa compacta voltou a escrever nomes sobre o token: ${stripText}`)
    }
    await daviToken.locator('.tabletop-token__art').hover()
    await page.waitForTimeout(180)
    const popoverOpenState = await statusPopover.evaluate((popover) => {
      const style = window.getComputedStyle(popover)
      const rect = popover.getBoundingClientRect()
      const centerTarget = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      )
      return {
        height: rect.height,
        hit: Boolean(centerTarget && popover.contains(centerTarget)),
        opacity: Number(style.opacity),
        pointerEvents: style.pointerEvents,
        visibility: style.visibility,
        width: rect.width,
      }
    })
    if (
      popoverOpenState.visibility !== 'visible' ||
      popoverOpenState.opacity < 0.95 ||
      popoverOpenState.pointerEvents !== 'auto' ||
      popoverOpenState.width < 90 ||
      popoverOpenState.height < 50 ||
      !popoverOpenState.hit
    ) {
      fail(`Popover nao abriu de forma clicavel: ${JSON.stringify(popoverOpenState)}`)
    }
    const popoverItems = statusPopover.locator('.tabletop-token__status-popover-item')
    if ((await popoverItems.count()) !== 2) {
      fail('Popover nao exibiu todos os estados do token')
    }
    const popoverGlyphBox = await popoverItems
      .first()
      .locator('.tabletop-token__status-popover-glyph')
      .boundingBox()
    if (!popoverGlyphBox || popoverGlyphBox.width < 40 || popoverGlyphBox.height < 40) {
      fail(`Icone expandido ficou pequeno: ${JSON.stringify(popoverGlyphBox)}`)
    }
    await popoverItems.first().hover()
    const statusDetail = popoverItems
      .first()
      .locator('[data-testid="token-status-detail"]')
    await page.waitForTimeout(180)
    const detailOpenState = await statusDetail.evaluate((detail) => {
      const style = window.getComputedStyle(detail)
      const rect = detail.getBoundingClientRect()
      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        opacity: Number(style.opacity),
        right: rect.right,
        top: rect.top,
        visibility: style.visibility,
        width: rect.width,
      }
    })
    if (
      detailOpenState.visibility !== 'visible' ||
      detailOpenState.opacity < 0.95 ||
      detailOpenState.width < 250 ||
      detailOpenState.height < 100 ||
      detailOpenState.top < 8 ||
      detailOpenState.left < 8 ||
      detailOpenState.right > 1592 ||
      detailOpenState.bottom > 952
    ) {
      fail(`Detalhe individual nao abriu: ${JSON.stringify(detailOpenState)}`)
    }
    const statusDetailText = await statusDetail.innerText()
    if (!/Especial|Efeito visual publico de teste/i.test(statusDetailText)) {
      fail(`Detalhe individual nao abriu o efeito correto: ${statusDetailText}`)
    }
    if (!/x2/i.test(await statusCluster.innerText())) {
      fail('Acumulo x2 nao apareceu no conjunto visual')
    }
    if (statusVisualOnly) {
      const screenshotDirectory = path.join(root, 'tmp')
      fs.mkdirSync(screenshotDirectory, { recursive: true })
      await page.screenshot({
        path: path.join(screenshotDirectory, 'smoke-token-status-visuals.png'),
      })
    }
    await page.mouse.move(10, 10)
    await page.waitForTimeout(180)
    const popoverClosedState = await statusPopover.evaluate((popover) => {
      const style = window.getComputedStyle(popover)
      return {
        opacity: Number(style.opacity),
        pointerEvents: style.pointerEvents,
        visibility: style.visibility,
      }
    })
    if (
      popoverClosedState.visibility !== 'hidden' ||
      popoverClosedState.opacity > 0.05 ||
      popoverClosedState.pointerEvents !== 'none'
    ) {
      fail(`Popover nao fechou ao sair: ${JSON.stringify(popoverClosedState)}`)
    }
    if (statusVisualOnly) {
      if (pageErrors.length > 0) {
        fail(`erros no navegador: ${pageErrors.join(' | ')}`)
      }
      const unexpectedRequestFailures = failedRequests.filter(
        (request) =>
          !request.url.startsWith('fushi-library://') &&
          !request.url.startsWith('fushi-asset://'),
      )
      if (unexpectedRequestFailures.length > 0) {
        fail(
          `recursos inesperados falharam: ${JSON.stringify(unexpectedRequestFailures.slice(0, 4))}`,
        )
      }
      console.log('[combat-flow-ui] PASS visual de estados')
      console.log('  captura: tmp/smoke-token-status-visuals.png')
      return
    }

    console.log('[combat-flow-ui] caveira e tres sucessos')
    const deathState = page.locator('.tabletop-token__death-state')
    await deathState.waitFor({ state: 'visible', timeout: 10_000 })
    await connorToken.dblclick()
    const deathSheet = page.locator('.floating-window--sheet')
    await deathSheet.waitFor({ state: 'visible', timeout: 8_000 })
    const deathCard = deathSheet.locator('.tabletop-sheet-death-state')
    await deathCard.waitFor({ state: 'visible', timeout: 5_000 })
    const deathPoints = deathCard.locator('.tabletop-sheet-death-state__result')
    if ((await deathPoints.count()) !== 3) fail('Ficha nao exibiu tres tentativas')
    for (let index = 0; index < 3; index += 1) {
      await deathPoints.nth(index).click()
    }
    await deathState.waitFor({ state: 'visible', timeout: 8_000 })
    const lifeCard = deathSheet.locator('.sheet-view__resource-card--life')
    await lifeCard.getByText(/^1\/\d+$/).waitFor({ state: 'visible', timeout: 8_000 })
    await lifeCard
      .locator('.sheet-view__resource-editor--quick')
      .getByRole('button', { name: '+' })
      .click()
    await deathState.waitFor({ state: 'detached', timeout: 8_000 })
    await lifeCard
      .locator('.sheet-view__resource-editor--quick')
      .getByRole('button', { name: '-' })
      .click()
    await lifeCard.getByText(/^1\/\d+$/).waitFor({ state: 'visible', timeout: 8_000 })
    await deathSheet.getByRole('button', { name: 'Fechar janela' }).click()

    console.log('[combat-flow-ui] duplo clique e restauracao da ficha')
    await daviToken.dblclick()
    const sheet = page.locator('.floating-window--sheet')
    await sheet.waitFor({ state: 'visible', timeout: 8_000 })
    await sheet.getByRole('button', { name: 'Minimizar janela' }).click()
    if (!(await sheet.evaluate((element) => element.classList.contains('floating-window--minimized')))) {
      fail('Ficha nao minimizou')
    }
    await daviToken.dblclick()
    await page.waitForFunction(() => {
      const sheetWindow = document.querySelector('.floating-window--sheet')
      return sheetWindow && !sheetWindow.classList.contains('floating-window--minimized')
    })

    console.log('[combat-flow-ui] ficha -> dados de combate')
    const daggerCard = sheet
      .locator('[data-character-feature-id]')
      .filter({ hasText: 'Adaga' })
      .first()
    await daggerCard.getByRole('button', { name: 'Atacar' }).click()
    await openUtilityRail(page)
    const logWindow = page.locator('.floating-window--log')
    await logWindow.waitFor({ state: 'visible', timeout: 8_000 })
    await logWindow
      .getByRole('button', { name: 'Dados de combate', exact: true })
      .click()
    if (await sheet.isVisible().catch(() => false)) {
      fail('Ficha permaneceu aberta depois de preparar o ataque')
    }

    const roller = logWindow.locator('.tabletop-combat-roller')
    await roller.waitFor({ state: 'visible', timeout: 8_000 })
    const sourceSelect = roller.getByLabel('Personagem da cena')
    await sourceSelect.selectOption('combat-flow-grim')
    await page.waitForTimeout(350)
    if ((await sourceSelect.inputValue()) !== 'combat-flow-grim') {
      fail('Seletor retornou ao personagem preparado depois da troca manual')
    }
    const lifeSiphon = roller
      .locator('[data-combat-feature-id]')
      .filter({ hasText: 'Vida Sugada' })
      .first()
    await lifeSiphon.waitFor({ state: 'visible', timeout: 5_000 })
    const combatResolver = page
      .locator('.floating-window')
      .filter({ hasText: 'Resolver ataque' })

    console.log('[combat-flow-ui] Vida Sugada -> dano efetivo -> cura')
    await roller.locator('select').nth(1).selectOption('combat-flow-kairos')
    await lifeSiphon.getByRole('button', { name: 'Ativar' }).click()
    await combatResolver.waitFor({ state: 'visible', timeout: 35_000 })
    await combatResolver.getByRole('button', { name: 'Confirmar acerto' }).click()
    const siphonRawDamage = combatResolver.getByLabel('Resultado dos dados, sem Build')
    await siphonRawDamage.waitFor({ state: 'visible', timeout: 5_000 })
    await siphonRawDamage.fill('11')
    await combatResolver
      .getByRole('button', { name: 'Confirmar dano manual' })
      .click()
    const healingTarget = combatResolver.getByLabel(
      'Transferir a Vida drenada para',
    )
    await healingTarget.waitFor({ state: 'visible', timeout: 5_000 })
    await healingTarget.selectOption('combat-flow-grim')
    await combatResolver
      .getByText(/Vida 4\s*->\s*0/)
      .waitFor({ state: 'visible', timeout: 5_000 })
    await combatResolver
      .getByText(/Vida 1\s*->\s*5/)
      .waitFor({ state: 'visible', timeout: 5_000 })
    await combatResolver
      .getByRole('button', { name: 'Confirmar alteracoes' })
      .click()
    await combatResolver.waitFor({ state: 'detached', timeout: 5_000 })
    await page
      .locator('.tabletop-ability-vfx--success')
      .waitFor({ state: 'visible', timeout: 2_500 })
    const siphonState = await page.evaluate((sessionKey) => {
      const session = JSON.parse(window.localStorage.getItem(sessionKey) || 'null')
      const scene =
        session?.scenes?.find((entry) => entry.id === session.currentSceneId) ??
        session?.scenes?.[0]
      return {
        grimLife: scene?.tokens?.find((token) => token.id === 'combat-flow-grim')
          ?.resourceOverride?.vidaAtual,
        kairosLife: scene?.tokens?.find((token) => token.id === 'combat-flow-kairos')
          ?.resourceOverride?.vidaAtual,
        impactTypes: (session?.publicCombatImpacts ?? []).map((impact) => impact.type),
        receipt: session?.publicCombatReceipt ?? null,
      }
    }, seeded.sessionKey)
    if (
      siphonState.grimLife !== 5 ||
      siphonState.kairosLife !== 0 ||
      siphonState.receipt?.damageApplied !== 4 ||
      siphonState.receipt?.healingApplied !== 4 ||
      !siphonState.impactTypes.includes('ability-success')
    ) {
      fail(`Vida Sugada nao fechou dano e cura: ${JSON.stringify(siphonState)}`)
    }

    await openUtilityRail(page)
    await logWindow.waitFor({ state: 'visible', timeout: 8_000 })
    const restoreLogWindow = logWindow
      .getByRole('button', { name: 'Expandir janela' })
      .filter({ hasText: '+' })
    if ((await restoreLogWindow.count()) > 0) {
      await restoreLogWindow.first().click()
    }
    await logWindow
      .getByRole('button', { name: 'Dados de combate', exact: true })
      .click()
    await sourceSelect.selectOption('combat-flow-davi')
    await page.waitForTimeout(350)
    if ((await sourceSelect.inputValue()) !== 'combat-flow-davi') {
      fail('Seletor nao permaneceu em Davi depois de voltar do Grim')
    }
    await roller.locator('select').nth(1).selectOption('combat-flow-connor')
    const combatDagger = roller
      .locator('[data-combat-feature-id]')
      .filter({ hasText: 'Adaga' })
      .first()
    const modeSelect = combatDagger.getByLabel('Forma do ataque')
    await modeSelect.selectOption('ranged')
    await combatDagger
      .getByText('Pontaria adjacente: -1d20', { exact: true })
      .waitFor({ state: 'visible', timeout: 5_000 })

    console.log('[combat-flow-ui] rolagem -> resolver')
    await combatDagger.getByRole('button', { name: 'Ativar' }).click()
    const resolver = combatResolver
    await resolver.waitFor({ state: 'visible', timeout: 35_000 })
    await resolver
      .getByText(/Davi\s*->\s*Connor/)
      .waitFor({ state: 'visible', timeout: 5_000 })
    if (!(await logWindow.evaluate((element) =>
      element.classList.contains('floating-window--minimized'),
    ))) {
      fail('Janela de dados nao permaneceu minimizada durante a resolucao')
    }
    await resolver.getByRole('button', { name: 'Cancelar ataque' }).click()
    await resolver.waitFor({ state: 'detached', timeout: 5_000 })

    console.log('[combat-flow-ui] segunda rolagem -> confirmar transacao')
    await daviToken.dblclick()
    await sheet.waitFor({ state: 'visible', timeout: 8_000 })
    await sheet
      .locator('[data-character-feature-id]')
      .filter({ hasText: 'Adaga' })
      .first()
      .getByRole('button', { name: 'Atacar' })
      .click()
    await logWindow.waitFor({ state: 'visible', timeout: 8_000 })
    await page.waitForFunction(
      () =>
        !document
          .querySelector('.floating-window--log')
          ?.classList.contains('floating-window--minimized'),
      undefined,
      { timeout: 8_000 },
    )
    await logWindow
      .getByRole('button', { name: 'Dados de combate', exact: true })
      .click()
    const secondRoller = logWindow.locator('.tabletop-combat-roller')
    await secondRoller.locator('select').nth(1).selectOption('combat-flow-connor')
    const secondDagger = secondRoller
      .locator('[data-combat-feature-id]')
      .filter({ hasText: 'Adaga' })
      .first()
    await secondDagger.getByLabel('Forma do ataque').selectOption('ranged')
    // The first public roll still owns the per-actor anti-spam cooldown.
    await page.waitForTimeout(16_200)
    await secondDagger.getByRole('button', { name: 'Ativar' }).click()
    await resolver.waitFor({ state: 'visible', timeout: 35_000 })
    await resolver.getByRole('button', { name: 'Confirmar acerto' }).click()
    const rawDamage = resolver.getByLabel('Resultado dos dados, sem Build')
    await rawDamage.waitFor({ state: 'visible', timeout: 5_000 })
    await rawDamage.fill('7')
    await resolver.getByRole('button', { name: 'Confirmar dano manual' }).click()
    await resolver
      .getByLabel('Dano final ajustavel pelo Mestre')
      .waitFor({ state: 'visible', timeout: 5_000 })
    await resolver.getByRole('button', { name: 'Confirmar alteracoes' }).click()
    await resolver.waitFor({ state: 'detached', timeout: 5_000 })

    const committedState = await page.evaluate((sessionKey) => {
      const session = JSON.parse(window.localStorage.getItem(sessionKey) || 'null')
      const scene =
        session?.scenes?.find((entry) => entry.id === session.currentSceneId) ??
        session?.scenes?.[0]
      const connor = scene?.tokens?.find((token) => token.id === 'combat-flow-connor')
      return {
        connorLife: connor?.resourceOverride?.vidaAtual,
        deathStatus: session?.playerDeathStates?.['combat-flow-connor']?.status,
        impactCount: session?.publicCombatImpacts?.length ?? 0,
        receipt: session?.publicCombatReceipt ?? null,
      }
    }, seeded.sessionKey)
    if (committedState.connorLife !== 0) {
      fail(`Vida confirmada de Connor deveria ser 0: ${JSON.stringify(committedState)}`)
    }
    if (committedState.deathStatus !== 'down') {
      fail(`Caveira nao retornou depois do dano letal: ${JSON.stringify(committedState)}`)
    }
    if (committedState.impactCount < 1) {
      fail(`Impacto publico nao foi gravado: ${JSON.stringify(committedState)}`)
    }
    if (
      committedState.receipt?.attackerName !== 'Davi' ||
      committedState.receipt?.targetName !== 'Connor' ||
      committedState.receipt?.damageApplied !== 1
    ) {
      fail(`Recibo publico incorreto: ${JSON.stringify(committedState.receipt)}`)
    }

    if (pageErrors.length > 0) {
      fail(`erros no navegador: ${JSON.stringify(pageErrors.slice(0, 4))}`)
    }
    const unexpectedRequestFailures = failedRequests.filter(
      (request) =>
        !request.url.startsWith('fushi-library://') &&
        !request.url.startsWith('fushi-asset://'),
    )
    if (unexpectedRequestFailures.length > 0) {
      fail(
        `recursos inesperados falharam: ${JSON.stringify(unexpectedRequestFailures.slice(0, 4))}`,
      )
    }

    console.log('[combat-flow-ui] PASS')
    console.log('  estados usam icones, popover completo, detalhe por hover e acumulos')
    console.log('  ficha restaura por duplo clique')
    console.log('  seletor troca Davi -> Grim -> Davi sem rollback')
    console.log('  Vida Sugada limita o dreno a Vida real e cura o mesmo valor')
    console.log('  Atacar abre Dados de Combate sem rolar imediatamente')
    console.log('  Pontaria adjacente aplica -1d20')
    console.log('  Resolver abre depois do dado e Cancelar encerra')
    console.log('  Confirmar grava Vida, recibo, impacto e caveira')
    console.log('  3 sucessos restauram 1 Vida; 2 Vida encerram Desmaiado')
  } finally {
    await browser?.close()
    await stopDevServer(serverProcess)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
