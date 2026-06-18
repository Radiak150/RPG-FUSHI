import { writeFile } from 'node:fs/promises'
import { openGmTable } from './cdp-table-helpers.mjs'

const port = Number(process.argv[2] ?? 9361)
const screenshotPath =
  process.argv[3] ?? 'release/win-unpacked/smoke-3d-editor-gizmo.png'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchJson(url, attempts = 50) {
  let lastError
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
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
      if (message.error) reject(new Error(message.error.message))
      else resolve(message.result)
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
        issueEvents.push({ method: message.method, text: entry.text })
      }
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
      }, 30000)
      pending.set(id, { resolve, reject, timeoutId })
    })
  }

  return { issueEvents, send, socket }
}

async function evaluate(send, expression) {
  const result = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text)
  }
  return result.result?.value
}

async function clickMouse(send, x, y) {
  await send('Input.dispatchMouseEvent', {
    button: 'left',
    clickCount: 1,
    type: 'mousePressed',
    x,
    y,
  })
  await delay(80)
  await send('Input.dispatchMouseEvent', {
    button: 'left',
    clickCount: 1,
    type: 'mouseReleased',
    x,
    y,
  })
}

async function getVisibleElementCenter(send, finderSource) {
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
      const finder = ${finderSource}
      const element = finder()
      if (!(element instanceof HTMLElement) || !isVisible(element)) {
        return {
          found: false,
          visibleButtons: Array.from(document.querySelectorAll('button'))
            .filter(isVisible)
            .map((button) => ({
              ariaLabel: button.getAttribute('aria-label') ?? '',
              text: button.textContent?.trim() ?? '',
              title: button.title ?? '',
            }))
            .slice(0, 60),
        }
      }
      const rect = element.getBoundingClientRect()
      return {
        found: true,
        text: element.textContent?.trim() ?? '',
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
    })()`,
  )
}

async function clickVisibleElement(send, finderSource, label, timeoutMs = 5_000) {
  const startedAt = Date.now()
  let lastState = null

  while (Date.now() - startedAt < timeoutMs) {
    lastState = await getVisibleElementCenter(send, finderSource)
    if (lastState?.found) {
      await clickMouse(send, lastState.x, lastState.y)
      return lastState
    }
    await delay(180)
  }

  throw new Error(`Elemento ${label} nao ficou clicavel: ${JSON.stringify(lastState)}`)
}

function buttonFinderSource(predicateSource) {
  return `() => Array.from(document.querySelectorAll('button')).find(${predicateSource})`
}

async function main() {
  const targets = await fetchJson(`http://127.0.0.1:${port}/json`)
  const page = targets.find((target) => target.type === 'page') ?? targets[0]
  if (!page?.webSocketDebuggerUrl) throw new Error('No debuggable Electron page found')

  const { issueEvents, send, socket } = await connectCdp(page.webSocketDebuggerUrl)
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Page.enable')
  await send('Input.setIgnoreInputEvents', { ignore: false })

  await openGmTable(send, evaluate, delay)

  const hasPresetBefore = await evaluate(
    send,
    `Boolean(document.querySelector('.tabletop-object-preset'))`,
  )
  if (!hasPresetBefore) {
    await clickVisibleElement(
      send,
      buttonFinderSource(
        `(button) => button.getAttribute('aria-label') === 'Abrir ferramentas'`,
      ),
      'ferramentas do GM',
      4_000,
    )
    await delay(300)
    await clickVisibleElement(
      send,
      buttonFinderSource(
        `(button) => button.getAttribute('aria-label') === 'Objetos' || button.title === 'Objetos'`,
      ),
      'Objetos',
      5_000,
    )
    await delay(500)
  }

  const alreadyPlacing = await evaluate(
    send,
    `Boolean(document.querySelector('.tabletop-3d-stage--placing'))`,
  )
  if (!alreadyPlacing) {
    await clickVisibleElement(
      send,
      `() => document.querySelector('.tabletop-object-preset')`,
      'preset de objeto 3D',
      5_000,
    )
    await delay(400)
  }

  const canSeeGm3d = await getVisibleElementCenter(
    send,
    buttonFinderSource(`(button) => button.textContent?.trim().includes('3D GM')`),
  )
  if (!canSeeGm3d?.found) {
    await clickVisibleElement(
      send,
      buttonFinderSource(
        `(button) => button.getAttribute('aria-label') === 'Abrir menu superior'`,
      ),
      'menu superior',
      4_000,
    )
    await delay(300)
  }

  const is3dActive = await evaluate(
    send,
    `(() => {
      const gm3d = Array.from(document.querySelectorAll('button')).find((button) =>
        button.textContent?.trim().includes('3D GM'),
      )
      return Boolean(
        gm3d?.classList.contains('is-active') ||
        gm3d?.classList.contains('tabletop-escape--active') ||
        gm3d?.getAttribute('aria-pressed') === 'true'
      )
    })()`,
  )
  if (!is3dActive) {
    await clickVisibleElement(
      send,
      buttonFinderSource(`(button) => button.textContent?.trim().includes('3D GM')`),
      '3D GM',
      5_000,
    )
    await delay(900)
  }

  const setup = await evaluate(
    send,
    `(() => ({
      hasObjectsPanel: Boolean(document.querySelector('.tabletop-object-preset')),
      hasPreset: Boolean(document.querySelector('.tabletop-object-preset')),
      objectCount: document.querySelectorAll('.tabletop-object').length,
      placementActive: Boolean(document.querySelector('.tabletop-3d-stage--placing')),
    }))()`,
  )

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ready = await evaluate(
      send,
      `Boolean(document.querySelector('.tabletop-board__free-3d-layer canvas[data-camera-mode="free"]'))`,
    )
    if (ready) break
    await delay(250)
  }
  await delay(1600)

  const before = await evaluate(
    send,
    `(() => {
      const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
      const rect = canvas?.getBoundingClientRect()
      return {
        hasCanvas: Boolean(canvas),
        rect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null,
        objectCount: document.querySelectorAll('.tabletop-object').length,
        placementActive: Boolean(document.querySelector('.tabletop-3d-stage--placing')),
      }
    })()`,
  )

  if (!before.hasCanvas || !before.rect || !setup.hasPreset && !before.placementActive) {
    throw new Error(`3D editor setup failed: ${JSON.stringify({ before, setup })}`)
  }

  const placementAttempts = []
  const placementPoints = [
    [0.5, 0.62],
    [0.43, 0.66],
    [0.57, 0.66],
    [0.5, 0.74],
    [0.34, 0.7],
    [0.66, 0.7],
    [0.9, 0.35],
  ]

  for (const [xRatio, yRatio] of placementPoints) {
    const clickX = Math.round(before.rect.left + before.rect.width * xRatio)
    const clickY = Math.round(before.rect.top + before.rect.height * yRatio)
    await clickMouse(send, clickX, clickY)
    await delay(900)

    const attemptState = await evaluate(
      send,
      `(() => {
        const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
        return {
          lastInput: canvas?.dataset.lastInput ?? null,
          objectCount: document.querySelectorAll('.tabletop-object').length,
          placementActive: Boolean(document.querySelector('.tabletop-3d-stage--placing')),
          transformAttached: canvas?.dataset.transformAttached ?? null,
        }
      })()`,
    )
    placementAttempts.push({ ...attemptState, xRatio, yRatio })

    if (
      attemptState.objectCount > before.objectCount ||
      attemptState.lastInput === 'place-object-3d'
    ) {
      break
    }
  }

  await delay(1200)

  await evaluate(
    send,
    `(() => {
      for (const key of ['3', '+', 'PageUp', ']']) {
        window.dispatchEvent(new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key,
        }))
      }
      return document.querySelector('.tabletop-board__free-3d-layer canvas')?.dataset.transformTool ?? null
    })()`,
  )
  await delay(800)

  const afterEdit = await evaluate(
    send,
    `(() => {
      const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
      return {
        objectCount: document.querySelectorAll('.tabletop-object').length,
        lastInput: canvas?.dataset.lastInput ?? null,
        transformAttached: canvas?.dataset.transformAttached ?? null,
        transformTool: canvas?.dataset.transformTool ?? null,
      }
    })()`,
  )

  await evaluate(
    send,
    `(() => {
      const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
      if (!canvas) return false
      const rect = canvas.getBoundingClientRect()
      canvas.dispatchEvent(new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width * 0.9,
        clientY: rect.top + rect.height * 0.35,
        ctrlKey: true,
        deltaX: 0,
        deltaY: -260,
      }))
      return true
    })()`,
  )
  await delay(800)

  const afterCtrlWheel = await evaluate(
    send,
    `(() => {
      const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
      return {
        objectCount: document.querySelectorAll('.tabletop-object').length,
        lastInput: canvas?.dataset.lastInput ?? null,
        transformAttached: canvas?.dataset.transformAttached ?? null,
        transformTool: canvas?.dataset.transformTool ?? null,
      }
    })()`,
  )

  await evaluate(
    send,
    `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
      }))
      return true
    })()`,
  )
  await delay(700)

  const afterEnter = await evaluate(
    send,
    `(() => {
      const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
      return {
        objectCount: document.querySelectorAll('.tabletop-object').length,
        lastInput: canvas?.dataset.lastInput ?? null,
        transformAttached: canvas?.dataset.transformAttached ?? null,
        transformTool: canvas?.dataset.transformTool ?? null,
      }
    })()`,
  )

  const screenshot = await send('Page.captureScreenshot', {
    captureBeyondViewport: false,
    format: 'png',
  })
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))
  socket.close()

  const created = afterEdit.objectCount > before.objectCount
  const objectAvailable = afterEdit.objectCount >= before.objectCount && afterEdit.objectCount > 0
  const editedObject = Boolean(afterEdit.transformAttached && afterEdit.transformAttached !== '0')
  const stable =
    (created || editedObject) &&
    objectAvailable &&
    afterEdit.transformTool === 'scale' &&
    afterCtrlWheel.lastInput === 'ctrl-wheel-scale' &&
    afterEnter.lastInput === 'object-confirm' &&
    afterEnter.transformAttached === '0' &&
    afterEnter.objectCount === afterEdit.objectCount &&
    issueEvents.length === 0
  const result = {
    afterEdit,
    afterEnter,
    afterCtrlWheel,
    before,
    created,
    editedObject,
    issueEvents,
    objectAvailable,
    placementAttempts,
    screenshotPath,
    setup,
    stable,
  }

  console.log(JSON.stringify(result, null, 2))

  if (!stable) {
    throw new Error(`3D editor smoke failed: ${JSON.stringify(result)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
