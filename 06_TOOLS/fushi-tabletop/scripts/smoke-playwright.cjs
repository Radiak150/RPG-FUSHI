const { spawn } = require('node:child_process')
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

  return spawn(process.execPath, [viteEntry, '--host', '127.0.0.1', '--port', String(port)], {
    cwd: __dirname + '/..',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
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

  if ((await passwordInput.count()) === 0) {
    return
  }

  await passwordInput.fill('mestre1')
  await page.locator('button[type="submit"]').click()
}

async function waitForVisible(locator, timeout = 5_000) {
  try {
    await locator.first().waitFor({ state: 'visible', timeout })
    return true
  } catch (_error) {
    return false
  }
}

async function openShortcutsRail(page) {
  const notesButton = page.getByRole('button', { name: 'Abrir anotacoes pessoais' })

  if (await waitForVisible(notesButton, 250)) {
    return
  }

  const shortcutButton = page.getByRole('button', { name: 'Abrir atalhos' })

  if (!(await waitForVisible(shortcutButton))) {
    throw new Error('Mesa: rail de atalhos nao apareceu.')
  }

  await shortcutButton.first().click()

  if (!(await waitForVisible(notesButton))) {
    throw new Error('Mesa: rail de atalhos abriu sem liberar anotacoes pessoais.')
  }
}

async function smokeLauncher(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await installConsoleCapture(page)
  await page.goto(`${baseUrl}/launcher`, { waitUntil: 'networkidle' })
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
  await installConsoleCapture(page)
  await page.goto(`${baseUrl}/jogar/mesa`, { waitUntil: 'networkidle' })
  await loginAsGmIfNeeded(page)
  await page.locator('.tabletop-screen').waitFor({ timeout: 20_000 })
  await clearConsoleErrors(page)

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
  await page.locator('.floating-window--log').waitFor({ timeout: 10_000 })
  await clearConsoleErrors(page)

  await page.getByRole('button', { name: 'Rolar publico' }).click()
  await page.waitForTimeout(300)

  const restoreRollWindow = page
    .locator('.floating-window--log button[aria-label="Expandir janela"]')
    .filter({ hasText: '+' })
    .first()
  if ((await restoreRollWindow.count()) > 0) {
    await restoreRollWindow.click()
  }

  await page.waitForTimeout(300)
  await page
    .locator('.floating-window--log button')
    .filter({ hasText: /Entrar na fila|Rolar publico/ })
    .first()
    .click()
  await page.locator('.tabletop-dice-guard, .tabletop-session-log__roll-lock').first().waitFor({
    timeout: 8_000,
  })

  const guardText = await page
    .locator('.tabletop-dice-guard, .tabletop-session-log__roll-lock')
    .first()
    .innerText()

  if (!/Espere|Aguarde|Fila/i.test(guardText)) {
    throw new Error(`Mesa dado: aviso de fila/cooldown inesperado: ${guardText}`)
  }

  await assertNoConsoleErrors(page, 'Mesa dado')
  await assertNoHorizontalOverflow(page, 'Mesa dado')
  await page.close()
}

async function smokePlayerTokenMovementLock(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  await installConsoleCapture(page)
  await page.goto(`${baseUrl}/jogar/mesa`, { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: /Jogador 1/ }).click()
  await page.locator('input[type="password"]').fill('111')
  await page.locator('button[type="submit"]').click()
  await page.locator('.tabletop-screen').waitFor({ timeout: 20_000 })
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
    await smokeLauncher(browser)
    await smokeMesa(browser)
    await smokePlayerTokenMovementLock(browser)
  } finally {
    await browser.close()

    if (serverProcess) {
      serverProcess.kill()
    }
  }

  console.log('smoke:ui ok')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
