const { spawn } = require('node:child_process')
const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const { chromium } = require('playwright')

const port = Number(process.env.FUSHI_UI_SMOKE_PORT || 5174)
const baseUrl = `http://127.0.0.1:${port}`

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function isServerReady() {
  return new Promise((resolve) => {
    const request = http.get(`${baseUrl}/launcher`, (response) => {
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
    if (await isServerReady()) {
      return
    }

    await wait(350)
  }

  throw new Error(`Vite nao respondeu em ${baseUrl}.`)
}

function startDevServer() {
  const viteEntry = path.resolve(__dirname, '../node_modules/vite/bin/vite.js')

  const serverProcess = spawn(process.execPath, [viteEntry, '--host', '127.0.0.1', '--port', String(port)], {
    cwd: __dirname + '/..',
    env: process.env,
    stdio: 'ignore',
  })

  serverProcess.unref()
  return serverProcess
}

async function stopDevServer(serverProcess) {
  if (!serverProcess || serverProcess.exitCode !== null) return

  serverProcess.kill()
  await Promise.race([
    new Promise((resolve) => serverProcess.once('exit', resolve)),
    wait(2_000),
  ])
}

async function installConsoleCapture(page) {
  await page.addInitScript(() => {
    window.__fushiConsoleErrors = []
    const originalError = console.error

    console.error = (...args) => {
      window.__fushiConsoleErrors.push(
        args.map((arg) => {
          try {
            return typeof arg === 'string' ? arg : JSON.stringify(arg)
          } catch {
            return String(arg)
          }
        }),
      )
      originalError.apply(console, args)
    }
  })
}

async function getConsoleErrors(page) {
  return page.evaluate(() => window.__fushiConsoleErrors || [])
}

async function clearConsoleErrors(page) {
  await page.evaluate(() => {
    window.__fushiConsoleErrors = []
  })
}

async function assertNoConsoleErrors(page, label) {
  const errors = await getConsoleErrors(page)

  if (errors.length > 0) {
    throw new Error(`${label}: console.error detectado: ${JSON.stringify(errors.slice(0, 3))}`)
  }
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }))

  if (overflow.bodyWidth > overflow.viewportWidth + 1) {
    throw new Error(
      `${label}: overflow horizontal (${overflow.bodyWidth}px > ${overflow.viewportWidth}px).`,
    )
  }
}

async function loginAsGmIfNeeded(page) {
  const passwordInput = page.locator('input[type="password"]')

  try {
    await passwordInput.waitFor({ state: 'visible', timeout: 10_000 })
  } catch {
    if ((await page.locator('.tabletop-screen').count()) > 0) {
      return
    }

    throw new Error('Mesa: entrada do Mestre nao exibiu campo de senha.')
  }

  await passwordInput.fill('mestre1')
  await page.locator('button[type="submit"]').click()
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

  if (!(await waitForVisible(shortcutButton))) {
    const diagnostics = await page.evaluate(() => ({
      bodyText: document.body.innerText.slice(0, 800),
      hasRouteError: Boolean(document.querySelector('.route-error')),
      utilityButtons: Array.from(document.querySelectorAll('.tabletop-screen__utility button'))
        .map((button) => button.getAttribute('aria-label')),
    }))
    throw new Error(`Mesa: rail de atalhos nao apareceu. ${JSON.stringify(diagnostics)}`)
  }

  await shortcutButton.first().click()

  if (
    !(await waitForVisible(notesButton)) &&
    !(await waitForVisible(rollButton)) &&
    !(await waitForVisible(helpButton))
  ) {
    throw new Error('Mesa: rail de atalhos abriu sem liberar anotacoes pessoais.')
  }
}

async function smokeLauncher(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await installConsoleCapture(page)
  await page.goto(`${baseUrl}/launcher`, { waitUntil: 'domcontentloaded' })
  await page.locator('.launcher-panel').waitFor({ timeout: 15_000 })

  if ((await page.locator('.launcher-package').count()) === 0) {
    throw new Error('Launcher: card do pacote da campanha nao apareceu.')
  }

  if ((await page.locator('.launcher-package__details').count()) > 0) {
    throw new Error('Launcher: detalhes de arquivos vieram abertos por padrao.')
  }

  if ((await page.locator('.launcher-topbar svg').count()) < 4) {
    throw new Error('Launcher: icones do topo nao renderizaram.')
  }

  await assertNoHorizontalOverflow(page, 'Launcher desktop')
  await assertNoConsoleErrors(page, 'Launcher desktop')

  await page.setViewportSize({ width: 390, height: 760 })
  await page.waitForTimeout(250)
  await assertNoHorizontalOverflow(page, 'Launcher mobile')
  await assertNoConsoleErrors(page, 'Launcher mobile')
  await page.close()
}

async function smokeMesa(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await page.addInitScript(() => {
    window.localStorage.removeItem('fushi-tabletop:workspace:v1')
  })
  await installConsoleCapture(page)
  await page.goto(`${baseUrl}/jogar/mesa`, { waitUntil: 'domcontentloaded' })
  await loginAsGmIfNeeded(page)
  await page.locator('.tabletop-screen').waitFor({ timeout: 20_000 })
  await clearConsoleErrors(page)

  console.log('smoke:ui mesa/ficha')
  const editableToken = page.locator('.tabletop-token').first()
  await editableToken.waitFor({ state: 'visible', timeout: 10_000 })
  const editableTokenLabel = (await editableToken.getAttribute('aria-label') || '')
    .replace(/^Selecionar\s+/, '')
    .trim()
  await editableToken.dblclick()
  const sheetWindow = page.locator('.floating-window--sheet')
  await sheetWindow.waitFor({ state: 'visible', timeout: 10_000 })
  await sheetWindow.getByRole('button', { name: 'Editar', exact: true }).click()

  await sheetWindow.getByRole('button', { name: 'Combate', exact: true }).click()
  await sheetWindow.getByRole('button', { name: 'Adicionar ataque', exact: true }).click()
  const smokeAttackName = `Ataque smoke ${Date.now()}`
  const attackNameInput = sheetWindow.locator('input[placeholder="Nome do ataque"]').last()
  await attackNameInput.waitFor({ state: 'visible', timeout: 5_000 })
  await attackNameInput.fill(smokeAttackName)
  await sheetWindow.locator('input[placeholder="Dano"]:visible').last().fill('1d4 + 1', {
    timeout: 5_000,
  })
  await sheetWindow.locator('input[placeholder="Alcance"]:visible').last().fill('1 m', {
    timeout: 5_000,
  })

  await sheetWindow.getByRole('button', { name: 'Habilidades', exact: true }).click()
  await sheetWindow.getByRole('button', { name: 'Adicionar habilidade', exact: true }).click()
  const smokeSkillName = `Habilidade smoke ${Date.now()}`
  const skillNameInput = sheetWindow.locator('input[placeholder="Nome da habilidade"]').last()
  await skillNameInput.waitFor({ state: 'visible', timeout: 5_000 })
  await skillNameInput.fill(smokeSkillName)
  await sheetWindow.locator('textarea[placeholder="Descricao"]:visible').last().fill(
    'Habilidade persistida pelo smoke da Mesa.',
  )

  await sheetWindow.getByRole('button', { name: 'Rituais', exact: true }).click()
  await sheetWindow.getByRole('button', { name: 'Adicionar ritual', exact: true }).click()
  const smokeRitualName = `Ritual smoke ${Date.now()}`
  const ritualNameInput = sheetWindow.locator('input[placeholder="Nome do ritual"]').last()
  await ritualNameInput.waitFor({ state: 'visible', timeout: 5_000 })
  await ritualNameInput.fill(smokeRitualName)
  await sheetWindow.locator('textarea[placeholder="Descricao"]:visible').last().fill(
    'Ritual persistido pelo smoke da Mesa.',
  )

  await sheetWindow.getByRole('button', { name: 'Inventario', exact: true }).click()
  await sheetWindow.getByRole('button', { name: 'Adicionar item', exact: true }).click()
  const smokeItemName = `Item smoke ${Date.now()}`
  const itemNameInput = sheetWindow.locator('input[placeholder="Nome do item"]').last()
  await itemNameInput.waitFor({ state: 'visible', timeout: 5_000 })
  await itemNameInput.fill(smokeItemName)
  await sheetWindow.locator('textarea[placeholder="Descricao"]:visible').last().fill(
    'Item persistido pelo smoke da Mesa.',
  )

  await sheetWindow.getByRole('button', { name: 'Salvar', exact: true }).click()
  await page.waitForTimeout(500)
  const canonicalProbe = await page.evaluate(
    ({ attackName, characterName, itemName, ritualName, skillName }) => {
      const rawWorkspace = window.localStorage.getItem('fushi-tabletop:workspace:v1')
      const workspace = rawWorkspace ? JSON.parse(rawWorkspace) : null
      const character = workspace?.characters?.find?.(
        (candidate) => candidate.nome === characterName,
      )

      return {
        characterNames: workspace?.characters?.map?.((candidate) => candidate.nome) ?? [],
        characterName,
        matches: {
          attack: Boolean(character?.ataques?.some?.((attack) => attack.nome === attackName)),
          skill: Boolean(character?.habilidadesDetalhadas?.some?.((skill) => skill.nome === skillName)),
          ritual: Boolean(character?.rituais?.some?.((ritual) => ritual.nome === ritualName)),
          item: Boolean(character?.inventarioDetalhado?.some?.((item) => item.nome === itemName)),
        },
      }
    },
    {
      attackName: smokeAttackName,
      characterName: editableTokenLabel,
      itemName: smokeItemName,
      ritualName: smokeRitualName,
      skillName: smokeSkillName,
    },
  )
  if (Object.values(canonicalProbe.matches).some((value) => !value)) {
    throw new Error(`Mesa ficha canonica: dados nao persistiram: ${JSON.stringify(canonicalProbe)}`)
  }
  await sheetWindow.locator('button[aria-label="Fechar janela"]').click()
  await assertNoConsoleErrors(page, 'Mesa ficha canonica')

  console.log('smoke:ui mesa/build')
  const rarityPresentation = page.locator('[data-testid="build-rarity-presentation"]')
  if (await waitForVisible(rarityPresentation, 500)) {
    await page.waitForFunction(() =>
      document.querySelector('[data-testid="build-rarity-presentation"]')?.getAttribute('data-phase') === 'revealed',
    )
    await rarityPresentation.click({ position: { x: 12, y: 12 } })
    await rarityPresentation.waitFor({ state: 'detached', timeout: 5_000 })
  }

  await openShortcutsRail(page)
  const buildButton = page.getByRole('button', { name: 'Builds absorvidas' })
  if (!(await waitForVisible(buildButton, 500))) {
    const toolsButton = page.getByRole('button', { name: 'Abrir ferramentas' })
    if (!(await waitForVisible(toolsButton, 5_000))) {
      throw new Error('Mesa BUI: rail aberto sem disponibilizar as ferramentas do Mestre.')
    }
    await toolsButton.click()
  }
  await page.getByRole('button', { name: 'Builds absorvidas' }).click()
  await page.locator('[data-testid="build-manager"]').waitFor({ timeout: 10_000 })
  const buildManager = page.locator('[data-testid="build-manager"]')
  const characterSelect = buildManager.locator('.build-manager__binding select')
  const catalogButtons = buildManager.locator('.build-manager__item-list button')
  const absorbButton = buildManager.locator('[data-testid="build-absorb"]')
  const characterOptions = await characterSelect.locator('option').evaluateAll((options) =>
    options.map((option) => option.value),
  )
  let foundBuildCandidate = false

  for (const characterId of characterOptions) {
    await characterSelect.selectOption(characterId)
    for (let itemIndex = 0; itemIndex < await catalogButtons.count(); itemIndex += 1) {
      await catalogButtons.nth(itemIndex).click()
      if (await absorbButton.isEnabled()) {
        foundBuildCandidate = true
        break
      }
    }
    if (foundBuildCandidate) break
  }

  if (!foundBuildCandidate) {
    throw new Error('Mesa BUI: catálogo inteiro já absorvido; não há candidato isolado para o smoke.')
  }

  const initialBuildState = await page.evaluate(() => {
    const rawWorkspace = window.localStorage.getItem('fushi-tabletop:workspace:v1')
    const workspace = rawWorkspace ? JSON.parse(rawWorkspace) : null
    const characterId = document.querySelector('[data-testid="build-manager"] select')?.value
    return workspace?.characters?.find?.((item) => item.id === characterId) ?? null
  })
  if (!initialBuildState) {
    throw new Error('Mesa BUI: ficha selecionada não foi encontrada no workspace.')
  }
  const initialBuild = initialBuildState.combatProfile?.build
  const initialBuildItems = initialBuild?.items ?? (initialBuild?.item ? [initialBuild.item] : [])
  await absorbButton.click()
  await page.waitForFunction(
    ({ characterId, itemCount }) => {
      const rawWorkspace = window.localStorage.getItem('fushi-tabletop:workspace:v1')
      const workspace = rawWorkspace ? JSON.parse(rawWorkspace) : null
      const character = workspace?.characters?.find?.((item) => item.id === characterId)
      return (character?.combatProfile?.build?.items?.length ?? 0) === itemCount + 1
    },
    { characterId: initialBuildState.id, itemCount: initialBuildItems.length },
  )
  const absorbedBuildState = await page.evaluate(() => {
    const rawWorkspace = window.localStorage.getItem('fushi-tabletop:workspace:v1')
    const workspace = rawWorkspace ? JSON.parse(rawWorkspace) : null
    const characterId = document.querySelector('[data-testid="build-manager"] select')?.value
    const character = workspace?.characters?.find?.((item) => item.id === characterId)
    const build = character?.combatProfile?.build
    return {
      baseline: build?.baseline?.recursos ?? null,
      buildTotals: build?.totals ?? null,
      items: build?.items ?? [],
      resources: character?.recursos ?? null,
    }
  })
  if (!absorbedBuildState.baseline || !absorbedBuildState.buildTotals || !absorbedBuildState.resources) {
    throw new Error('Mesa BUI: estado base/build da ficha não foi persistido após absorção.')
  }
  const expectedLifeMaximum =
    absorbedBuildState.baseline.vidaMaxima + (absorbedBuildState.buildTotals.life ?? 0)
  if (absorbedBuildState.resources.vidaMaxima !== expectedLifeMaximum) {
    throw new Error(
      `Mesa BUI: vida efetiva incorreta (${absorbedBuildState.resources.vidaMaxima} !== ${expectedLifeMaximum}).`,
    )
  }
  if (
    absorbedBuildState.baseline.vidaAtual === absorbedBuildState.baseline.vidaMaxima &&
    absorbedBuildState.resources.vidaAtual !== expectedLifeMaximum
  ) {
    throw new Error('Mesa BUI: vida atual não acompanhou o máximo efetivo em uma ficha cheia.')
  }
  const addedBuildItem = absorbedBuildState.items.find(
    (item) => !initialBuildItems.some((initialItem) => initialItem.catalogItemId === item.catalogItemId),
  )
  if (!addedBuildItem) {
    throw new Error('Mesa BUI: não foi possível identificar o item recém-absorvido.')
  }
  await page.getByText('Itens Secretos de correção', { exact: true }).click()
  const secretSelect = page.getByLabel('Absorção afetada')
  await secretSelect.selectOption(addedBuildItem.catalogItemId)
  await page.getByRole('button', { name: 'Rerrolar 5 vezes' }).click()
  const rerollButtons = page.locator('.build-manager__reroll-results button')
  if ((await rerollButtons.count()) !== 5) {
    throw new Error(`BUI: esperava 5 resultados de raridade, encontrou ${await rerollButtons.count()}.`)
  }
  const artifactDirectory = path.resolve(__dirname, '../.codex-dev/artifact-work')
  fs.mkdirSync(artifactDirectory, { recursive: true })
  await page.screenshot({
    path: path.join(artifactDirectory, 'build-manager-gm.png'),
    fullPage: true,
  })
  await rerollButtons.first().click()
  const addedItemCard = buildManager
    .locator('.build-manager__absorbed-list article')
    .filter({ hasText: addedBuildItem.name })
  await addedItemCard.getByRole('button', { name: 'Remover debug' }).click()
  await page.waitForFunction(
    ({ characterId, itemCount }) => {
      const rawWorkspace = window.localStorage.getItem('fushi-tabletop:workspace:v1')
      const workspace = rawWorkspace ? JSON.parse(rawWorkspace) : null
      const character = workspace?.characters?.find?.((item) => item.id === characterId)
      return (character?.combatProfile?.build?.items?.length ?? 0) === itemCount
    },
    { characterId: initialBuildState.id, itemCount: initialBuildItems.length },
  )
  const removedBuildState = await page.evaluate(() => {
    const rawWorkspace = window.localStorage.getItem('fushi-tabletop:workspace:v1')
    const workspace = rawWorkspace ? JSON.parse(rawWorkspace) : null
    const characterId = document.querySelector('[data-testid="build-manager"] select')?.value
    return workspace?.characters?.find?.((item) => item.id === characterId) ?? null
  })
  if (!removedBuildState) {
    throw new Error('Mesa BUI: ficha de teste sumiu após remover o item.')
  }
  if (JSON.stringify(removedBuildState.recursos) !== JSON.stringify(initialBuildState.recursos)) {
    throw new Error(
      `Mesa BUI: remover o item não restaurou os recursos anteriores da ficha. antes=${JSON.stringify(initialBuildState.recursos)} depois=${JSON.stringify(removedBuildState.recursos)} baseline=${JSON.stringify(removedBuildState.combatProfile?.build?.baseline?.recursos ?? null)}`,
    )
  }
  await assertNoConsoleErrors(page, 'Mesa BUI')
  await assertNoHorizontalOverflow(page, 'Mesa BUI')
  await page
    .locator('.floating-window')
    .filter({ has: page.locator('[data-testid="build-manager"]') })
    .locator('button[aria-label="Fechar janela"]')
    .click()

  console.log('smoke:ui mesa/janelas')
  await openShortcutsRail(page)

  await page.getByRole('button', { name: 'Abrir anotacoes pessoais' }).click()
  await page.locator('.floating-window').waitFor({ timeout: 10_000 })
  await page.locator('.floating-window button[aria-label="Minimizar janela"]').click()
  await page.waitForTimeout(150)
  await page
    .locator('.floating-window button[aria-label="Expandir janela"]')
    .filter({ hasText: '+' })
    .first()
    .click()
  await page.waitForTimeout(350)
  await assertNoConsoleErrors(page, 'Mesa janela flutuante')
  await assertNoHorizontalOverflow(page, 'Mesa janela flutuante')

  await page.getByRole('button', { name: 'Abrir anotacoes pessoais' }).click()
  await openShortcutsRail(page)
  await page.getByRole('button', { name: 'Abrir chat, log e rolagem' }).click()
  const rollWindow = page.locator('.floating-window--log')
  await rollWindow.waitFor({ timeout: 10_000 })
  await clearConsoleErrors(page)

  console.log('smoke:ui mesa/combate')
  await rollWindow.getByRole('button', { name: 'Dados de combate', exact: true }).click()
  const combatRoller = rollWindow.locator('.tabletop-combat-roller')
  await combatRoller.waitFor({ state: 'visible', timeout: 8_000 })
  if ((await combatRoller.locator('.tabletop-combat-roller__stats').count()) === 0) {
    await combatRoller
      .getByText('Nenhum personagem vinculado a um token visivel.', { exact: true })
      .waitFor({ state: 'visible', timeout: 5_000 })
  } else {
    const previewButton = combatRoller
      .getByRole('button', { name: 'Ver area', exact: true })
      .first()

    if (await waitForVisible(previewButton, 1_000)) {
      await previewButton.click()
      const combatRange = page.locator('.tabletop-combat-range')
      await combatRange.waitFor({ state: 'visible', timeout: 5_000 })
      await page
        .getByRole('button', { name: 'Fechar visualizacao da area', exact: true })
        .click()
      await combatRange.waitFor({ state: 'detached', timeout: 5_000 })
    }
  }
  await rollWindow.getByRole('button', { name: 'Dados comuns', exact: true }).click()
  await rollWindow.locator('[data-roll-surface="common"]').waitFor({ state: 'visible', timeout: 5_000 })

  const rollPublicButton = rollWindow.getByRole('button', {
    name: 'Rolar publico',
    exact: true,
  })
  await rollPublicButton.click()

  console.log('smoke:ui mesa/fila-dados')
  const diceGuard = page.locator('.tabletop-dice-guard, .tabletop-session-log__roll-lock')
  await rollPublicButton.evaluate((button) => button.click())
  await diceGuard.first().waitFor({ state: 'visible', timeout: 3_000 })
  const guardText = (await diceGuard.allTextContents()).join(' ')
  if (!/Espere|Aguarde|Fila/i.test(guardText)) {
    const diceDiagnostics = await page.evaluate(() => ({
      guardText: document.querySelector('.tabletop-dice-guard, .tabletop-session-log__roll-lock')?.textContent ?? '',
      logButtons: Array.from(document.querySelectorAll('.floating-window--log button')).map((button) => ({
        aria: button.getAttribute('aria-label'),
        text: button.textContent?.trim(),
      })),
      sessionKeys: Object.keys(window.localStorage).filter((key) => key.includes('mesa-session')),
      logText: document.querySelector('.floating-window--log')?.textContent?.slice(-800) ?? '',
    }))
    throw new Error(
      `Mesa dado: fila/cooldown não bloqueou tentativas rápidas consecutivas. ${JSON.stringify(diceDiagnostics)}`,
    )
  }

  await assertNoConsoleErrors(page, 'Mesa dado')
  await assertNoHorizontalOverflow(page, 'Mesa dado')
  await page.close()
}

async function smokePlayerTokenMovementLock(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  await installConsoleCapture(page)
  await page.goto(`${baseUrl}/jogar/mesa`, { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: /Jogador 1/ }).click()
  await page.locator('input[type="password"]').fill('111')
  await page.locator('button[type="submit"]').click()
  await page.locator('.tabletop-screen').waitFor({ timeout: 20_000 })
  if ((await page.getByRole('button', { name: 'Builds absorvidas' }).count()) > 0) {
    throw new Error('Jogador recebeu acesso ao BUI do Mestre.')
  }
  await clearConsoleErrors(page)

  const tokens = page.locator('.tabletop-token')
  await tokens.first().waitFor({ timeout: 10_000 })

  const movableTokens = await page.locator('.tabletop-token:not(.tabletop-token--immovable)').count()

  if (movableTokens > 0) {
    throw new Error(`Jogador recebeu ${movableTokens} token(s) movivel(is).`)
  }

  const token = tokens.first()
  const beforePosition = await token.evaluate((element) => ({
    left: element.style.left,
    top: element.style.top,
  }))
  const box = await token.boundingBox()

  if (!box) {
    throw new Error('Jogador: token visivel sem caixa de layout.')
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2 + 80, {
    steps: 8,
  })
  await page.mouse.up()
  await page.waitForTimeout(250)

  const afterPosition = await token.evaluate((element) => ({
    left: element.style.left,
    top: element.style.top,
  }))

  if (
    afterPosition.left !== beforePosition.left ||
    afterPosition.top !== beforePosition.top
  ) {
    throw new Error('Jogador conseguiu alterar a posicao visual de um token.')
  }

  await assertNoConsoleErrors(page, 'Jogador trava de movimento de token')
  await assertNoHorizontalOverflow(page, 'Jogador trava de movimento de token')
  await context.close()
}

async function main() {
  let serverProcess = null

  if (!(await isServerReady())) {
    serverProcess = startDevServer()
    await waitForServer()
  }

  const browser = await chromium.launch({ headless: true })

  try {
    console.log('smoke:ui launcher')
    await smokeLauncher(browser)
    console.log('smoke:ui mesa')
    await smokeMesa(browser)
    console.log('smoke:ui jogador')
    await smokePlayerTokenMovementLock(browser)
  } finally {
    await browser.close()

    if (serverProcess) {
      await stopDevServer(serverProcess)
    }
  }

  console.log('smoke:ui ok')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
