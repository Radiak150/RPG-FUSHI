const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { _electron: electron } = require('playwright')

const root = path.resolve(__dirname, '..')
const executablePath = path.resolve(
  process.env.FUSHI_RELEASE_EXE || path.join(root, 'release/win-unpacked/RPG FUSHI.exe'),
)
const artifactRoot = path.join(root, '.codex-dev', 'history-vfx-release')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function seedWorkspace(appDataDir) {
  const source = path.join(process.env.APPDATA || '', 'FUSHI', 'workspace.json')
  if (!fs.existsSync(source)) return false

  const sourceRoot = path.dirname(source)
  const targetDir = path.join(appDataDir, 'FUSHI')
  fs.mkdirSync(targetDir, { recursive: true })
  fs.copyFileSync(source, path.join(targetDir, 'workspace.json'))

  const workspace = JSON.parse(fs.readFileSync(source, 'utf8'))
  const campaignAssetUrls = new Set()
  function collectCampaignAssetUrls(value) {
    if (typeof value === 'string' && value.startsWith('fushi-asset://campaign/')) {
      campaignAssetUrls.add(value)
      return
    }
    if (Array.isArray(value)) {
      value.forEach(collectCampaignAssetUrls)
      return
    }
    if (value && typeof value === 'object') {
      Object.values(value).forEach(collectCampaignAssetUrls)
    }
  }
  collectCampaignAssetUrls(workspace)

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
    const targetPath = path.join(targetDir, relativePath)
    assert(fs.existsSync(sourcePath), `Asset referenciado pela ficha ausente: ${sourcePath}`)
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.copyFileSync(sourcePath, targetPath)
  })

  return true
}

async function chooseProfile(page, label, password) {
  const gate = page.locator('.access-gate')
  try {
    await gate.waitFor({ state: 'visible', timeout: 15_000 })
  } catch {
    return
  }

  await gate
    .locator('.access-gate__profile')
    .filter({ hasText: label })
    .first()
    .click()
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
}

async function openHistory(page, audience) {
  await page.evaluate((nextAudience) => {
    location.hash = `#/historia?audience=${nextAudience}`
  }, audience)
  await page.waitForFunction(
    () => Boolean(document.querySelector('.access-gate, [data-testid="history-page"]')),
    { timeout: 20_000 },
  )
  await chooseProfile(page, audience === 'master' ? 'Mestre' : 'Jogador 1', audience === 'master' ? 'mestre1' : '111')
  await page.locator('[data-testid="history-page"]').waitFor({ timeout: 30_000 })
}

async function runPlayerProfile() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fushi-history-player-user-'))
  const appDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fushi-history-player-app-'))
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
    await page.waitForLoadState('domcontentloaded')
    await openHistory(page, 'player')

    const state = await page.evaluate(() => ({
      bodyText: document.body.innerText,
      hasMasterSwitch: Boolean(document.querySelector('[data-testid="history-audience-master"]')),
      sectionCount: document.querySelectorAll('.rulebook-chapter-button').length,
      hasRouteError: Boolean(document.querySelector('.route-error')),
    }))
    const text = normalize(state.bodyText)
    assert(!state.hasMasterSwitch, 'Jogador recebeu seletor do Livro do Mestre.')
    assert(state.sectionCount >= 6, 'Crônicas públicas não carregaram todos os registros.')
    assert(!text.includes('organismo alienigena'), 'Crônicas públicas vazaram natureza dos protagonistas.')
    assert(!text.includes('metaplot'), 'Crônicas públicas vazaram metaplot.')
    assert(!state.hasRouteError, 'História pública abriu tela de recuperação.')

    fs.mkdirSync(artifactRoot, { recursive: true })
    await page.screenshot({ fullPage: true, path: path.join(artifactRoot, 'history-player.png') })
  } finally {
    await app.close()
    fs.rmSync(userDataDir, { recursive: true, force: true })
    fs.rmSync(appDataDir, { recursive: true, force: true })
  }
}

async function runMasterProfile() {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fushi-history-master-user-'))
  const appDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fushi-history-master-app-'))
  seedWorkspace(appDataDir)
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
    page.on('console', (message) => {
      if (message.type() === 'error') {
        const location = message.location()
        consoleErrors.push(
          `${message.text()} @ ${location.url || 'unknown'}:${location.lineNumber ?? 0}`,
        )
      }
    })
    page.on('pageerror', (error) => pageErrors.push(error.stack || error.message))
    await page.waitForLoadState('domcontentloaded')
    await openHistory(page, 'master')

    const masterState = await page.evaluate(() => ({
      bodyText: document.body.innerText,
      hasMasterSwitch: Boolean(document.querySelector('[data-testid="history-audience-master"]')),
      sectionCount: document.querySelectorAll('.rulebook-chapter-button').length,
      hasRouteError: Boolean(document.querySelector('.route-error')),
    }))
    const masterText = normalize(masterState.bodyText)
    assert(masterState.hasMasterSwitch, 'Mestre perdeu seletor de volumes da História.')
    assert(masterState.sectionCount >= 8, 'Livro da História do Mestre perdeu seções.')
    assert(masterText.includes('organismo alienigena'), 'Livro do Mestre não exibiu bloco confidencial esperado.')
    assert(masterText.includes('metaplot'), 'Livro do Mestre não exibiu continuidade confidencial esperada.')
    assert(!masterState.hasRouteError, 'História do Mestre abriu tela de recuperação.')

    await page.evaluate(() => {
      location.hash = '#/jogar/mesa'
    })
    await chooseProfile(page, 'Mestre', 'mestre1')
    await page.locator('.tabletop-screen').waitFor({ timeout: 45_000 })
    const separateHistoryHub = page.locator('button[aria-label="Livro da Historia"]')
    assert(
      (await separateHistoryHub.count()) === 0,
      'Livro da Historia continuou como hub separado na mesa.',
    )
    const bookButton = page.locator('button[aria-label="Livro"]')
    if (!(await bookButton.isVisible().catch(() => false))) {
      await page.locator('button[aria-label="Abrir ferramentas"]').click()
    }
    await bookButton.click()
    const shieldTabs = page.locator('[data-testid="master-shield-section-tabs"]')
    await shieldTabs.waitFor({ state: 'visible', timeout: 15_000 })
    await shieldTabs.getByRole('tab', { name: 'Livro da Historia' }).click()
    const embeddedHistory = page.locator('.history-quick--master')
    await embeddedHistory.waitFor({ state: 'visible', timeout: 15_000 })
    assert(
      normalize(await embeddedHistory.innerText()).includes('historia do mestre'),
      'Escudo do Mestre nao incorporou a Historia confidencial.',
    )
    const shieldWindow = page
      .locator('.floating-window')
      .filter({ has: page.getByRole('heading', { name: 'Escudo do Mestre' }) })
    await shieldWindow.getByRole('button', { name: 'Fechar janela' }).click()

    const vfxButton = page.locator('button[aria-label="Efeitos visuais"]')
    if (!(await vfxButton.isVisible().catch(() => false))) {
      await page.locator('button[aria-label="Abrir ferramentas"]').click()
    }
    await vfxButton.click()
    const library = page.locator('[data-testid="tabletop-vfx-library"]')
    await library.waitFor({ state: 'visible', timeout: 15_000 })
    assert(await library.locator('.tabletop-vfx-library__card').count() === 10, 'Release VFX não exibiu os 10 presets.')

    await library
      .locator('.tabletop-vfx-library__card')
      .filter({ hasText: 'Onda de FUSHI' })
      .getByRole('button', { name: 'Prévia local' })
      .click()
    await page.locator('[data-testid="tabletop-vfx-presentation"]').waitFor({ timeout: 5_000 })
    assert(
      await page.locator('[data-testid="tabletop-vfx-presentation"]').getAttribute('data-preset-id') === 'fushi-wave',
      'Prévia VFX local abriu preset incorreto.',
    )

    await library
      .locator('.tabletop-vfx-library__card')
      .filter({ hasText: 'Aura Ciano' })
      .getByRole('button', { name: 'Mostrar na mesa' })
      .click()
    await page.locator('[data-testid="tabletop-vfx-presentation"]').waitFor({ timeout: 5_000 })
    assert(
      await page.locator('[data-testid="tabletop-vfx-presentation"]').getAttribute('data-preset-id') === 'aura-cyan',
      'Broadcast VFX não abriu o preset escolhido.',
    )
    await library.getByRole('button', { name: 'Parar efeito atual' }).click()
    await page.locator('[data-testid="tabletop-vfx-presentation"]').waitFor({ state: 'detached', timeout: 5_000 })

    const sessionAudit = await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      const sessionKey = keys.find((key) => key.includes('fushi-tabletop:mesa-session:v1:campaign:'))
      const session = sessionKey ? JSON.parse(localStorage.getItem(sessionKey) || 'null') : null
      return {
        hasVfxEventAfterClear: Boolean(session?.broadcastEvents?.some((event) => event.type === 'vfx' && event.vfxAction === 'show')),
        hasRouteError: Boolean(document.querySelector('.route-error')),
      }
    })
    assert(!sessionAudit.hasVfxEventAfterClear, 'VFX antigo ficou persistido depois de limpar o efeito.')
    assert(!sessionAudit.hasRouteError, 'Mesa/VFX abriu tela de recuperação.')
    assert(consoleErrors.length === 0, `Release História/VFX emitiu console.error: ${consoleErrors.join(' | ')}`)
    assert(pageErrors.length === 0, `Release História/VFX emitiu pageerror: ${pageErrors.join(' | ')}`)

    await page.screenshot({ fullPage: true, path: path.join(artifactRoot, 'vfx-master.png') })
  } finally {
    await app.close()
    fs.rmSync(userDataDir, { recursive: true, force: true })
    fs.rmSync(appDataDir, { recursive: true, force: true })
  }
}

async function main() {
  assert(fs.existsSync(executablePath), `Release não encontrada: ${executablePath}`)
  await runPlayerProfile()
  await runMasterProfile()
  console.log('[history-vfx:release] PASS')
  console.log(`  evidências: ${path.relative(root, artifactRoot)}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
