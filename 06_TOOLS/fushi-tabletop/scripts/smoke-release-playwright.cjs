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
    throw new Error('Release Mesa: rail de atalhos nao apareceu.')
  }

  await shortcutButton.first().click()

  if (!(await waitForVisible(notesButton))) {
    throw new Error('Release Mesa: rail de atalhos abriu sem liberar anotacoes pessoais.')
  }
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

async function connectRemotePlayer(port, profileId, password, sessionCode) {
  assert(typeof WebSocket === 'function', 'WebSocket global nao esta disponivel no smoke.')

  const socket = new WebSocket(`ws://127.0.0.1:${port}/session?code=${sessionCode}`)
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

async function smokeMultiplayerAdmission(page) {
  const sessionCode = `REL${Date.now().toString(36).slice(-5).toUpperCase()}`
  const port = await getFreePort()
  const openedSockets = []

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
    await player1PublicState
    await getPlayerRow(page, 'player1')

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

async function main() {
  assert(fs.existsSync(executablePath), `Release nao encontrada: ${executablePath}`)

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fushi-release-smoke-'))
  const appDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fushi-release-appdata-'))
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
    await smokeMultiplayerAdmission(page)

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
    await page.locator('.floating-window--log').waitFor({ timeout: 10_000 })
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
