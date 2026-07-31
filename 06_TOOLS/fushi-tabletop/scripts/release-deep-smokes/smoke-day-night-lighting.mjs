import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { openGmTable } from './cdp-table-helpers.mjs'

const port = Number(process.argv[2] ?? 9364)
const screenshotPath =
  process.argv[3] ?? 'release/win-unpacked/smoke-day-night-lighting.png'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchJson(url, attempts = 50) {
  let lastError

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      lastError = error
      await delay(250)
    }
  }

  throw lastError
}

async function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl)
  const pending = new Map()
  const issueEvents = []
  const networkFailures = []
  let nextId = 1

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)

    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timeoutId } = pending.get(message.id)
      clearTimeout(timeoutId)
      pending.delete(message.id)

      if (message.error) {
        reject(new Error(message.error.message))
      } else {
        resolve(message.result)
      }
      return
    }

    if (message.method === 'Runtime.exceptionThrown') {
      issueEvents.push({
        method: message.method,
        text:
          message.params?.exceptionDetails?.exception?.description ??
          message.params?.exceptionDetails?.text,
      })
    }

    if (message.method === 'Log.entryAdded') {
      const entry = message.params?.entry

      if (entry?.level === 'error') {
        issueEvents.push({
          method: message.method,
          text: entry.text,
          url: entry.url ?? '',
        })
      }
    }

    if (
      message.method === 'Network.responseReceived' &&
      message.params?.response?.status >= 400
    ) {
      networkFailures.push({
        status: message.params.response.status,
        url: message.params.response.url,
      })
    }
  })

  function send(method, params = {}) {
    const id = nextId
    nextId += 1
    socket.send(JSON.stringify({ id, method, params }))

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        pending.delete(id)
        reject(new Error(`CDP timeout: ${method}`))
      }, 30_000)

      pending.set(id, {
        reject,
        resolve,
        timeoutId,
      })
    })
  }

  return {
    issueEvents,
    networkFailures,
    send,
    socket,
  }
}

async function evaluate(send, expression) {
  const result = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression,
    returnByValue: true,
  })

  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ??
        result.exceptionDetails.text,
    )
  }

  return result.result?.value
}

async function waitFor(send, expression, description, timeoutMs = 12_000) {
  const startedAt = Date.now()
  let lastValue = null

  while (Date.now() - startedAt < timeoutMs) {
    lastValue = await evaluate(send, expression)

    if (lastValue?.ok) {
      return lastValue
    }

    await delay(150)
  }

  throw new Error(
    `Timeout aguardando ${description}: ${JSON.stringify(lastValue)}`,
  )
}

async function getVisibleButtonCenter(send, predicateSource) {
  return evaluate(
    send,
    `(() => {
      const isVisible = (element) => {
        if (!(element instanceof HTMLElement)) return false
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden'
        )
      }
      const predicate = ${predicateSource}
      const button = Array.from(document.querySelectorAll('button')).find(
        (candidate) => isVisible(candidate) && predicate(candidate)
      )

      if (!(button instanceof HTMLElement)) {
        return {
          found: false,
          visibleButtons: Array.from(document.querySelectorAll('button'))
            .filter(isVisible)
            .map((candidate) => ({
              ariaLabel: candidate.getAttribute('aria-label') ?? '',
              text: candidate.textContent?.trim() ?? '',
              title: candidate.title ?? '',
            }))
            .slice(0, 80),
        }
      }

      const rect = button.getBoundingClientRect()
      return {
        found: true,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
    })()`,
  )
}

async function clickAt(send, x, y) {
  await send('Input.dispatchMouseEvent', {
    button: 'left',
    clickCount: 1,
    type: 'mouseMoved',
    x,
    y,
  })
  await send('Input.dispatchMouseEvent', {
    button: 'left',
    clickCount: 1,
    type: 'mousePressed',
    x,
    y,
  })
  await send('Input.dispatchMouseEvent', {
    button: 'left',
    clickCount: 1,
    type: 'mouseReleased',
    x,
    y,
  })
}

async function clickVisibleButton(
  send,
  predicateSource,
  description,
  timeoutMs = 5_000,
) {
  const startedAt = Date.now()
  let lastState = null

  while (Date.now() - startedAt < timeoutMs) {
    lastState = await getVisibleButtonCenter(send, predicateSource)

    if (lastState?.found) {
      await clickAt(send, lastState.x, lastState.y)
      return lastState
    }

    await delay(180)
  }

  throw new Error(
    `Botao ${description} nao ficou clicavel: ${JSON.stringify(lastState)}`,
  )
}

async function openWorldClock(send) {
  const toolsButtonPredicate = `(button) =>
    ['Abrir atalhos', 'Abrir ferramentas'].includes(
      button.getAttribute('aria-label') ?? ''
    )`
  const worldButtonPredicate = `(button) =>
    button.textContent?.trim() === 'MUN' ||
    button.textContent?.trim() === 'Mapa Mundi' ||
    button.getAttribute('aria-label') === 'Abrir Mapa Mundi' ||
    button.getAttribute('aria-label') === 'Mapa Mundi' ||
    button.title === 'Mapa Mundi'`

  let worldButton = await getVisibleButtonCenter(send, worldButtonPredicate)

  for (let attempt = 0; attempt < 3 && !worldButton?.found; attempt += 1) {
    const toolLayerOpened = await evaluate(
      send,
      `(() => {
        const isVisible = (element) => {
          if (!(element instanceof HTMLElement)) return false
          const rect = element.getBoundingClientRect()
          const style = getComputedStyle(element)
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden'
          )
        }
        const predicate = ${toolsButtonPredicate}
        const button = Array.from(document.querySelectorAll('button')).find(
          (candidate) => isVisible(candidate) && predicate(candidate)
        )
        if (!(button instanceof HTMLButtonElement)) {
          return { ok: false }
        }
        button.click()
        return {
          ariaLabel: button.getAttribute('aria-label') ?? '',
          ok: true,
        }
      })()`,
    )

    if (!toolLayerOpened?.ok) {
      break
    }

    await delay(350)
    worldButton = await getVisibleButtonCenter(send, worldButtonPredicate)
  }

  if (!worldButton?.found) {
    throw new Error(`MUN indisponivel: ${JSON.stringify(worldButton)}`)
  }

  await clickAt(send, worldButton.x, worldButton.y)
  await waitFor(
    send,
    `(() => ({ ok: Boolean(document.querySelector('.world-mundi')) }))()`,
    'painel MUN',
  )

  const clockOpened = await evaluate(
    send,
    `(() => {
      const panel = document.querySelector('.world-mundi')
      const button = Array.from(panel?.querySelectorAll('button') ?? []).find(
        (candidate) => candidate.textContent?.trim() === 'Relogio'
      )

      if (!(button instanceof HTMLButtonElement)) {
        return { ok: false, step: 'clock-button' }
      }

      button.click()
      return { ok: true }
    })()`,
  )

  assert.equal(
    clockOpened?.ok,
    true,
    `Aba Relogio indisponivel: ${JSON.stringify(clockOpened)}`,
  )

  await waitFor(
    send,
    `(() => ({
      ok: Array.from(
        document.querySelectorAll('.world-mundi button')
      ).some((button) => button.textContent?.trim() === 'Noite')
    }))()`,
    'controles Dia/Noite',
  )
}

async function setClockMode(send, mode) {
  const label = mode === 'night' ? 'Noite' : 'Dia'
  const clicked = await evaluate(
    send,
    `(() => {
      const button = Array.from(
        document.querySelectorAll('.world-mundi button')
      ).find((candidate) => candidate.textContent?.trim() === ${JSON.stringify(label)})

      if (!(button instanceof HTMLButtonElement)) {
        return { ok: false }
      }

      button.click()
      return { ok: true }
    })()`,
  )

  assert.equal(clicked?.ok, true, `Nao consegui definir ${label}.`)

  await waitFor(
    send,
    `(() => {
      const layer = document.querySelector('.tabletop-lighting-layer')
      return {
        ok:
          layer?.getAttribute('data-night') ===
          ${JSON.stringify(mode === 'night' ? 'true' : 'false')},
        night: layer?.getAttribute('data-night') ?? null,
      }
    })()`,
    `modo ${label}`,
  )
}

async function closeWorld(send) {
  const closed = await evaluate(
    send,
    `(() => {
      const windowElement = Array.from(
        document.querySelectorAll('.floating-window')
      ).find(
        (candidate) =>
          candidate.querySelector('.floating-window__title h3')
            ?.textContent?.trim() === 'Mapa Mundi'
      )
      const closeButton = windowElement?.querySelector(
        'button[aria-label="Fechar janela"]'
      )

      if (!(closeButton instanceof HTMLButtonElement)) {
        return { ok: false }
      }

      closeButton.click()
      return { ok: true }
    })()`,
  )

  assert.equal(closed?.ok, true, 'Nao consegui fechar o MUN.')
  await waitFor(
    send,
    `(() => ({ ok: !document.querySelector('.world-mundi') }))()`,
    'fechamento do MUN',
  )
}

async function readLightingState(send) {
  return evaluate(
    send,
    `(() => {
      const controls = document.querySelector('[data-lighting-controls]')
      const layer = document.querySelector('.tabletop-lighting-layer')
      const cursorGlow = document.querySelector(
        '.tabletop-lighting-layer__glow--cursor'
      )
      const boardImage = document.querySelector('.tabletop-board__image')

      return {
        boardImageReady:
          boardImage instanceof HTMLImageElement &&
          boardImage.complete &&
          boardImage.naturalWidth > 0 &&
          boardImage.naturalHeight > 0,
        cursorEnabled: layer?.getAttribute('data-cursor-enabled') ?? null,
        cursorLeft:
          cursorGlow instanceof HTMLElement ? cursorGlow.style.left : '',
        cursorTop:
          cursorGlow instanceof HTMLElement ? cursorGlow.style.top : '',
        gmControls: controls?.getAttribute('data-gm-controls') ?? null,
        hasAddButton: Boolean(
          document.querySelector('button[aria-label="Adicionar ponto de luz"]')
        ),
        hasDarkness: Boolean(
          document.querySelector('.tabletop-lighting-layer__mask')
        ),
        lightCount: Number(layer?.getAttribute('data-light-count') ?? -1),
        lightingEnabled:
          layer?.getAttribute('data-lighting-enabled') ?? null,
        night: layer?.getAttribute('data-night') ?? null,
      }
    })()`,
  )
}

async function main() {
  const targets = await fetchJson(`http://127.0.0.1:${port}/json`)
  const page = targets.find((target) => target.type === 'page') ?? targets[0]

  if (!page?.webSocketDebuggerUrl) {
    throw new Error('No debuggable Electron page found')
  }

  const { issueEvents, networkFailures, send, socket } = await connectCdp(
    page.webSocketDebuggerUrl,
  )

  await send('Runtime.enable')
  await send('Log.enable')
  await send('Network.enable')
  await send('Page.enable')
  await openGmTable(send, evaluate, delay)

  const initial = await readLightingState(send)
  await openWorldClock(send)
  await setClockMode(send, 'night')
  await closeWorld(send)

  const lightAdded = await evaluate(
    send,
    `(() => {
      const addButton = document.querySelector(
        'button[aria-label="Adicionar ponto de luz"]'
      )

      if (!(addButton instanceof HTMLButtonElement)) {
        return { ok: false, step: 'add-light' }
      }

      addButton.click()
      return { ok: true }
    })()`,
  )

  assert.equal(
    lightAdded?.ok,
    true,
    `Ponto de luz nao foi adicionado: ${JSON.stringify(lightAdded)}`,
  )

  await waitFor(
    send,
    `(() => {
      const layer = document.querySelector('.tabletop-lighting-layer')
      return {
        count: Number(layer?.getAttribute('data-light-count') ?? -1),
        ok:
          layer?.getAttribute('data-lighting-enabled') === 'true' &&
          Number(layer?.getAttribute('data-light-count') ?? -1) === 1 &&
          Boolean(document.querySelector('.tabletop-lighting-layer__handle')),
      }
    })()`,
    'primeiro ponto de luz',
  )

  const cursorEnabled = await evaluate(
    send,
    `(() => {
      const button = Array.from(document.querySelectorAll('button')).find(
        (candidate) =>
          candidate.getAttribute('aria-label') === 'Ligar lanterna do Mestre'
      )

      if (!(button instanceof HTMLButtonElement)) {
        return { ok: false, step: 'cursor-button' }
      }

      button.click()
      return { ok: true }
    })()`,
  )

  assert.equal(
    cursorEnabled?.ok,
    true,
    `Lanterna nao foi ativada: ${JSON.stringify(cursorEnabled)}`,
  )

  await waitFor(
    send,
    `(() => ({
      ok:
        document.querySelector('.tabletop-lighting-layer')
          ?.getAttribute('data-cursor-enabled') === 'true'
    }))()`,
    'lanterna ativa',
  )

  const cursorTarget = await evaluate(
    send,
    `(() => {
      const stage = document.querySelector('.tabletop-board__stage')
      const viewport = document.querySelector('.tabletop-board__viewport')

      if (
        !(stage instanceof HTMLElement) ||
        !(viewport instanceof HTMLElement)
      ) {
        return { ok: false, step: 'board-surface' }
      }

      const stageRect = stage.getBoundingClientRect()
      const viewportRect = viewport.getBoundingClientRect()
      const visibleLeft = Math.max(stageRect.left, viewportRect.left)
      const visibleTop = Math.max(stageRect.top, viewportRect.top)
      const visibleRight = Math.min(stageRect.right, viewportRect.right)
      const visibleBottom = Math.min(stageRect.bottom, viewportRect.bottom)
      const visibleWidth = visibleRight - visibleLeft
      const visibleHeight = visibleBottom - visibleTop

      if (
        stageRect.width <= 0 ||
        stageRect.height <= 0 ||
        visibleWidth <= 40 ||
        visibleHeight <= 40
      ) {
        return {
          ok: false,
          step: 'visible-board-surface',
          stageRect: {
            height: stageRect.height,
            left: stageRect.left,
            top: stageRect.top,
            width: stageRect.width,
          },
          viewportRect: {
            height: viewportRect.height,
            left: viewportRect.left,
            top: viewportRect.top,
            width: viewportRect.width,
          },
        }
      }

      const clientX = visibleLeft + visibleWidth * 0.68
      const clientY = visibleTop + visibleHeight * 0.34

      return {
        clientX,
        clientY,
        normalizedX: (clientX - stageRect.left) / stageRect.width,
        normalizedY: (clientY - stageRect.top) / stageRect.height,
        ok: true,
      }
    })()`,
  )

  assert.equal(
    cursorTarget?.ok,
    true,
    `Lanterna nao encontrou superficie visivel: ${JSON.stringify(cursorTarget)}`,
  )

  await send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: cursorTarget.clientX - 12,
    y: cursorTarget.clientY - 12,
  })
  await delay(40)
  await send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: cursorTarget.clientX,
    y: cursorTarget.clientY,
  })

  await waitFor(
    send,
    `(() => {
      const glow = document.querySelector(
        '.tabletop-lighting-layer__glow--cursor'
      )
      const x = Number.parseFloat(
        glow instanceof HTMLElement ? glow.style.left : ''
      )
      const y = Number.parseFloat(
        glow instanceof HTMLElement ? glow.style.top : ''
      )
      const expectedX = ${JSON.stringify(cursorTarget.normalizedX * 100)}
      const expectedY = ${JSON.stringify(cursorTarget.normalizedY * 100)}

      return {
        expectedX,
        expectedY,
        ok:
          Number.isFinite(x) &&
          Number.isFinite(y) &&
          Math.abs(x - expectedX) <= 1 &&
          Math.abs(y - expectedY) <= 1,
        x,
        y,
      }
    })()`,
    'lanterna acompanhando movimento fisico',
  )

  const night = await readLightingState(send)
  assert.equal(night.night, 'true')
  assert.equal(night.lightingEnabled, 'true')
  assert.equal(night.gmControls, 'true')
  assert.equal(night.hasAddButton, true)
  assert.equal(night.hasDarkness, true)
  assert.equal(night.lightCount, 1)
  assert.equal(night.cursorEnabled, 'true')
  assert.ok(
    Math.abs(
      Number.parseFloat(night.cursorLeft) - cursorTarget.normalizedX * 100,
    ) <= 1,
    `Lanterna nao seguiu o mouse no eixo X: ${night.cursorLeft}`,
  )
  assert.ok(
    Math.abs(
      Number.parseFloat(night.cursorTop) - cursorTarget.normalizedY * 100,
    ) <= 1,
    `Lanterna nao seguiu o mouse no eixo Y: ${night.cursorTop}`,
  )

  await openWorldClock(send)
  await setClockMode(send, 'day')
  const day = await readLightingState(send)
  assert.equal(day.night, 'false')
  assert.equal(day.hasDarkness, false)
  assert.equal(day.lightCount, 1)

  await setClockMode(send, 'night')
  await closeWorld(send)
  const restoredNight = await readLightingState(send)
  assert.equal(restoredNight.night, 'true')
  assert.equal(restoredNight.lightCount, 1)
  assert.equal(restoredNight.cursorEnabled, 'true')
  assert.equal(restoredNight.boardImageReady, true)

  const screenshot = await send('Page.captureScreenshot', {
    captureBeyondViewport: false,
    format: 'png',
  })
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))
  socket.close()

  const result = {
    day,
    initial,
    issueEvents,
    networkFailures,
    night,
    restoredNight,
    screenshotPath,
    stable:
      issueEvents.length === 0 &&
      networkFailures.length === 0 &&
      restoredNight.boardImageReady === true &&
      restoredNight.lightCount === 1 &&
      restoredNight.night === 'true',
  }

  console.log(JSON.stringify(result, null, 2))

  if (!result.stable) {
    throw new Error(`day/night lighting smoke failed: ${JSON.stringify(result)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
