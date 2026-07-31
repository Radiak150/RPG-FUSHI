const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { _electron: electron } = require('playwright')

const root = path.resolve(__dirname, '..')
const executablePath = path.resolve(
  process.env.FUSHI_RELEASE_EXE || path.join(root, 'release/win-unpacked/RPG FUSHI.exe'),
)
const artifactRoot = path.join(root, '.codex-dev', 'rulebooks-release')
const playerRulebook = JSON.parse(
  fs.readFileSync(path.join(root, 'src/data/rulebook/player-rulebook.json'), 'utf8'),
)
const masterRulebook = JSON.parse(
  fs.readFileSync(path.join(root, 'src/data/rulebook/master-rulebook.json'), 'utf8'),
)
const expectedPlayerChapterCount = playerRulebook.sections.length
const expectedMasterChapterCount = masterRulebook.sections.length

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function isBenignFailedRequest(message) {
  return message.includes('net::ERR_ABORTED')
}

function seedRealWorkspace(appDataDir) {
  const sourceRoot = path.join(process.env.APPDATA || '', 'FUSHI')
  const sourceWorkspace = path.join(sourceRoot, 'workspace.json')

  if (!fs.existsSync(sourceWorkspace)) return null

  const targetRoot = path.join(appDataDir, 'FUSHI')
  const targetWorkspace = path.join(targetRoot, 'workspace.json')
  const workspace = JSON.parse(fs.readFileSync(sourceWorkspace, 'utf8'))
  const characters = Array.isArray(workspace.characters) ? workspace.characters : []
  const campaignAssetUrls = new Set()

  characters.forEach((character) => {
    for (const value of [character.avatarUrl, character.tokenImageUrl]) {
      if (typeof value === 'string' && value.startsWith('fushi-asset://campaign/')) {
        campaignAssetUrls.add(value)
      }
    }
  })

  fs.mkdirSync(targetRoot, { recursive: true })
  fs.copyFileSync(sourceWorkspace, targetWorkspace)

  campaignAssetUrls.forEach((assetUrl) => {
    const url = new URL(assetUrl)
    const [campaignId, category, ...filenameParts] = url.pathname
      .split('/')
      .filter(Boolean)
      .map(decodeURIComponent)
    const relativePath = path.join(
      'campaigns',
      campaignId,
      'assets',
      category,
      filenameParts.join('-'),
    )
    const sourcePath = path.join(sourceRoot, relativePath)
    const targetPath = path.join(targetRoot, relativePath)

    assert(fs.existsSync(sourcePath), `Asset da ficha real nao encontrado: ${sourcePath}`)
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.copyFileSync(sourcePath, targetPath)
  })

  return characters.filter(
    (character) => normalize(character.nome).trim() !== 'teste',
  ).length
}

async function enterProfile(page, profile) {
  await page.evaluate((audience) => {
    location.hash = `#/livro?audience=${audience}`
  }, profile.audience)

  await page.locator('.access-gate').waitFor({ state: 'visible', timeout: 20_000 })
  const profileButton = page
    .locator('.access-gate__profile')
    .filter({ hasText: profile.label })
    .first()

  await profileButton.click()
  await page.locator('input[type="password"]').fill(profile.password)
  await page.locator('button[type="submit"]').click()
  await page.locator(`.rulebook-page--${profile.audience}`).waitFor({
    state: 'visible',
    timeout: 30_000,
  })
}

async function auditPlayer(page) {
  await page.evaluate(() => document.fonts.ready)
  const state = await page.evaluate(() => ({
    badPartialKeyword: Array.from(document.querySelectorAll('.rulebook-keyword')).some(
      (node) => node.parentElement?.textContent?.includes('dúvida') && node.textContent?.toLowerCase() === 'vida',
    ),
    bodyText: document.body.innerText,
    chapterCount: document.querySelectorAll('.rulebook-chapter-button').length,
    diagramCount: document.querySelectorAll('.rulebook-example-visual').length,
    fonts: {
      accent: document.fonts.check('700 12px "FUSHI Orbitron"'),
      body: document.fonts.check('400 16px "FUSHI Manrope"'),
      display: document.fonts.check('700 24px "FUSHI Cinzel"'),
    },
    hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
    hasRouteError: Boolean(document.querySelector('.route-error')),
    hasVolumeSwitch: Boolean(document.querySelector('.rulebook-volume-switch')),
    title: document.querySelector('.rulebook-hero h1')?.textContent?.trim() ?? '',
  }))
  const normalizedText = normalize(state.bodyText)

  assert(state.title.includes('Livro do Jogador'), 'Release Jogador abriu o volume incorreto.')
  assert(
    state.chapterCount === expectedPlayerChapterCount,
    `Release Jogador exibiu ${state.chapterCount}/${expectedPlayerChapterCount} capitulos da fonte real.`,
  )
  assert(state.diagramCount > 0, 'Release Jogador perdeu os diagramas dos exemplos.')
  assert(Object.values(state.fonts).every(Boolean), 'Release Jogador nao carregou a tipografia FUSHI embutida.')
  assert(!state.badPartialKeyword, 'Release Jogador destacou trecho parcial de palavra comum.')
  assert(!state.hasVolumeSwitch, 'Release Jogador exibiu seletor do Livro do Mestre.')
  assert(!state.hasRouteError, 'Release Jogador abriu tela de recuperacao.')
  assert(!state.hasHorizontalOverflow, 'Release Jogador gerou overflow horizontal.')

  for (const forbidden of ['reencarn', 'novo corpo', 'corpo receptor', 'receptaculo', 'identidade original']) {
    assert(!normalizedText.includes(forbidden), `Release Jogador vazou segredo: ${forbidden}`)
  }

  const search = page.locator('.rulebook-search input')
  await search.fill('ataque de oportunidade')
  const filteredCount = await page.locator('.rulebook-chapter-button').count()
  assert(filteredCount > 0, 'Busca publica nao encontrou ataque de oportunidade.')
  await search.fill('')
}

async function auditMaster(page, expectedCharacterCount) {
  const initialState = await page.evaluate(() => ({
    chapterCount: document.querySelectorAll('.rulebook-chapter-button').length,
    hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
    hasRouteError: Boolean(document.querySelector('.route-error')),
    hasVolumeSwitch: Boolean(document.querySelector('.rulebook-volume-switch')),
    title: document.querySelector('.rulebook-hero h1')?.textContent?.trim() ?? '',
  }))

  assert(initialState.title.includes('Livro do Mestre'), 'Release Mestre abriu o volume incorreto.')
  assert(
    initialState.chapterCount === expectedMasterChapterCount,
    `Release Mestre exibiu ${initialState.chapterCount}/${expectedMasterChapterCount} capitulos da fonte real.`,
  )
  assert(initialState.hasVolumeSwitch, 'Release Mestre perdeu o seletor dos dois volumes.')
  assert(!initialState.hasRouteError, 'Release Mestre abriu tela de recuperacao.')
  assert(!initialState.hasHorizontalOverflow, 'Release Mestre gerou overflow horizontal.')

  await page
    .locator('.rulebook-chapter-button')
    .filter({ hasText: /Reencarna/i })
    .first()
    .click()
  await page
    .locator('.rulebook-reader')
    .filter({ hasText: /Disputa de posse/i })
    .waitFor({ timeout: 10_000 })

  await page
    .locator('.rulebook-chapter-button')
    .filter({ hasText: /Compendio|Compêndio/i })
    .first()
    .click()
  await page.locator('.rulebook-compendium').waitFor({ state: 'visible', timeout: 20_000 })

  const workspaceBuildAudit = await page.evaluate(() => {
    const workspace = window.fushiDesktop?.loadJson({ name: 'workspace', scope: 'app' })
    const characters = workspace && typeof workspace === 'object' && Array.isArray(workspace.characters)
      ? workspace.characters
      : []
    const npcs = characters.filter((character) => character?.tipo === 'npc')
    return {
      builds: npcs.filter((character) => character?.combatProfile?.build).length,
      characters: characters.length,
      npcs: npcs.length,
    }
  })
  assert(
    workspaceBuildAudit.builds === 41 && workspaceBuildAudit.npcs === 41,
    `Workspace isolado carregou ${workspaceBuildAudit.builds}/41 builds em ${workspaceBuildAudit.npcs}/41 NPCs.`,
  )

  const compendiumState = await page.evaluate(() => ({
    cards: document.querySelectorAll('.rulebook-character-button').length,
    hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
    text: document.querySelector('.rulebook-compendium')?.textContent ?? '',
  }))
  assert(compendiumState.cards > 0, 'Release Mestre abriu compendio sem fichas reais.')
  if (expectedCharacterCount !== null) {
    assert(
      compendiumState.cards === expectedCharacterCount,
      `Release Mestre exibiu ${compendiumState.cards}/${expectedCharacterCount} fichas reais.`,
    )
  }
  assert(compendiumState.text.trim().length > 0, 'Release Mestre abriu compendio vazio.')
  assert(!compendiumState.hasHorizontalOverflow, 'Compendio da release gerou overflow horizontal.')

  await page
    .locator('.rulebook-segmented button')
    .filter({ hasText: /^NPCs$/i })
    .click()

  const npcCards = page.locator('.rulebook-character-button')
  const npcCount = await npcCards.count()
  assert(npcCount === 41, `Release Mestre exibiu ${npcCount}/41 NPCs canonicos.`)

  const buildAudits = []
  for (let index = 0; index < npcCount; index += 1) {
    const card = npcCards.nth(index)
    const npcName = (await card.locator('strong').textContent())?.trim() ?? `NPC ${index + 1}`
    await card.click()

    const summary = page.locator('.rulebook-build-summary')
    const summaryVisible = await summary.isVisible().catch(() => false)
    if (!summaryVisible) {
      const selectedName = await page
        .locator('.rulebook-character-sheet h2')
        .textContent()
        .catch(() => '')
      throw new Error(`${npcName}: resumo da build ausente; ficha selecionada: ${selectedName || 'nenhuma'}.`)
    }
    const summaryText = (await summary.textContent())?.trim() ?? ''
    const summaryState = await summary.evaluate((node) => ({
      hasHorizontalOverflow: node.scrollWidth > node.clientWidth + 1,
      positiveModifiers: node.querySelectorAll('.is-positive').length,
      negativeModifiers: node.querySelectorAll('.is-negative').length,
    }))

    assert(/Build\s+/i.test(summaryText), `${npcName}: arquetipo da build nao apareceu.`)
    assert(/R\d+/i.test(summaryText), `${npcName}: potencia/raridade da build nao apareceu.`)
    assert(/Passiva:/i.test(summaryText), `${npcName}: passiva da build nao apareceu.`)
    assert(summaryState.positiveModifiers > 0, `${npcName}: build sem ganho visivel.`)
    assert(summaryState.negativeModifiers > 0, `${npcName}: build sem custo visivel.`)
    assert(!summaryState.hasHorizontalOverflow, `${npcName}: resumo da build gerou overflow.`)

    buildAudits.push({ npcName, summaryText })
  }

  const compendiumSearch = page.locator('.rulebook-search--compact input')
  await compendiumSearch.fill('Vhazaryon')
  await page.locator('.rulebook-character-button').first().click()
  await page.locator('.rulebook-build-summary').waitFor({ state: 'visible' })

  const advancedHub = await page.evaluate(() => ({
    buildVisible: Boolean(document.querySelector('.rulebook-build-summary')),
    featureMetadata: document.querySelectorAll('.rulebook-feature__meta').length,
    hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
    selectedName: document.querySelector('.rulebook-character-sheet h2')?.textContent?.trim() ?? '',
  }))
  assert(advancedHub.selectedName === 'Vhazaryon', 'Compendio nao abriu Vhazaryon para a auditoria avancada.')
  assert(advancedHub.buildVisible, 'Vhazaryon perdeu o resumo de build.')
  assert(advancedHub.featureMetadata > 0, 'Hub avancado perdeu os marcadores rapidos das habilidades.')
  assert(!advancedHub.hasHorizontalOverflow, 'Hub avancado de Vhazaryon gerou overflow horizontal.')

  return { buildAudits, advancedHub }
}

async function runProfile(profile) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), `fushi-books-${profile.audience}-user-`))
  const appDataDir = fs.mkdtempSync(path.join(os.tmpdir(), `fushi-books-${profile.audience}-app-`))
  const expectedCharacterCount = profile.audience === 'master' ? seedRealWorkspace(appDataDir) : null
  const app = await electron.launch({
    executablePath,
    args: [
      `--user-data-dir=${userDataDir}`,
      '--disable-gpu-sandbox',
      '--fushi-secondary-instance',
    ],
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
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => pageErrors.push(error.stack || error.message))
    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()} -> ${request.failure()?.errorText || 'unknown'}`)
    })

    await page.waitForLoadState('domcontentloaded')
    await enterProfile(page, profile)

    const auditResult = profile.audience === 'player'
      ? await auditPlayer(page)
      : await auditMaster(page, expectedCharacterCount)

    fs.mkdirSync(artifactRoot, { recursive: true })
    await page.screenshot({
      fullPage: true,
      path: path.join(artifactRoot, `${profile.audience}.png`),
    })

    const actionableFailures = failedRequests.filter((message) => !isBenignFailedRequest(message))
    assert(actionableFailures.length === 0, `${profile.audience}: requestfailed: ${actionableFailures.join(' | ')}`)
    assert(consoleErrors.length === 0, `${profile.audience}: console.error: ${consoleErrors.join(' | ')}`)
    assert(pageErrors.length === 0, `${profile.audience}: pageerror: ${pageErrors.join(' | ')}`)

    return auditResult
  } finally {
    await app.close()
    fs.rmSync(userDataDir, { recursive: true, force: true })
    fs.rmSync(appDataDir, { recursive: true, force: true })
  }
}

async function main() {
  assert(fs.existsSync(executablePath), `Release nao encontrada: ${executablePath}`)

  await runProfile({ audience: 'player', label: 'Jogador 1', password: '111' })
  const masterAudit = await runProfile({ audience: 'master', label: 'Mestre', password: 'mestre1' })

  console.log('[rulebooks:release] PASS')
  console.log(
    `  jogador: ${expectedPlayerChapterCount} capitulos publicos, busca funcional e nenhum segredo detectado`,
  )
  console.log(
    `  mestre: ${expectedMasterChapterCount} capitulos, ${masterAudit.buildAudits.length} builds NPC e hub avancado acessiveis`,
  )
  console.log(`  evidencias: ${path.relative(root, artifactRoot)}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
