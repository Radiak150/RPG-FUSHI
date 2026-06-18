import { writeFile } from 'node:fs/promises'
import { openGmTable } from './cdp-table-helpers.mjs'

const port = Number(process.argv[2] ?? 9352)
const screenshotPath =
  process.argv[3] ?? 'release/win-unpacked/smoke-2d-token-drag.png'

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

async function main() {
  const targets = await fetchJson(`http://127.0.0.1:${port}/json`)
  const page = targets.find((target) => target.type === 'page') ?? targets[0]
  if (!page?.webSocketDebuggerUrl) throw new Error('No debuggable Electron page found')

  const { issueEvents, send, socket } = await connectCdp(page.webSocketDebuggerUrl)
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Page.enable')

  await openGmTable(send, evaluate, delay)

  await evaluate(
    send,
    `(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const button = buttons.find((candidate) => candidate.textContent?.trim().includes('3D GM'))
      const isActive =
        button?.classList.contains('is-active') ||
        button?.classList.contains('tabletop-escape--active') ||
        button?.getAttribute('aria-pressed') === 'true'
      if (button && isActive) button.click()
      return { hadButton: Boolean(button), wasActive: Boolean(isActive) }
    })()`,
  )
  await delay(900)

  const before = await evaluate(
    send,
    `(() => {
      const canvas = document.querySelector('.tabletop-board__stage .tabletop-3d-stage canvas')
      const image = document.querySelector('.tabletop-board__image')
      const token = document.querySelector('.tabletop-token')
      if (canvas) canvas.dataset.smoke = 'token-drag-stable'
      return {
        canvasMark: canvas?.dataset.smoke ?? null,
        floorTexture: canvas?.dataset.floorTexture ?? null,
        tokenSyncCount: canvas?.dataset.tokenSyncCount ?? null,
        hasToken: Boolean(token),
        imageComplete: image?.complete ?? false,
        imageNaturalWidth: image?.naturalWidth ?? 0,
        tokenStyle: token instanceof HTMLElement ? token.getAttribute('style') : null,
      }
    })()`,
  )

  const dragResult = await evaluate(
    send,
    `(async () => {
      const stage = document.querySelector('.tabletop-board__stage')
      if (!(stage instanceof HTMLElement)) {
        return { dragged: false, reason: 'missing-stage' }
      }
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const stageRect = stage.getBoundingClientRect()
      let pointerId = 1301
      for (let index = 0; index < 10; index += 1) {
        const token = document.querySelector('.tabletop-token')
        if (!(token instanceof HTMLElement)) {
          return { dragged: false, reason: 'missing-token', index }
        }
        const rect = token.getBoundingClientRect()
        const startX = rect.left + rect.width / 2
        const startY = rect.top + rect.height / 2
        const deltaX = index % 2 === 0 ? 130 : -96
        const deltaY = index % 3 === 0 ? 86 : -64
        const endX = Math.max(stageRect.left + 36, Math.min(stageRect.right - 36, startX + deltaX))
        const endY = Math.max(stageRect.top + 36, Math.min(stageRect.bottom - 36, startY + deltaY))

        token.dispatchEvent(new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 1,
          clientX: startX,
          clientY: startY,
          pointerId,
          pointerType: 'mouse',
        }))
        window.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 1,
          clientX: endX,
          clientY: endY,
          pointerId,
          pointerType: 'mouse',
        }))
        window.dispatchEvent(new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 0,
          clientX: endX,
          clientY: endY,
          pointerId,
          pointerType: 'mouse',
        }))
        pointerId += 1
        await wait(140)
      }
      const token = document.querySelector('.tabletop-token')
      return {
        dragged: true,
        tokenStyle: token instanceof HTMLElement ? token.getAttribute('style') : null,
      }
    })()`,
  )
  await delay(1200)

  const after = await evaluate(
    send,
    `(() => {
      const canvas = document.querySelector('.tabletop-board__stage .tabletop-3d-stage canvas')
      const image = document.querySelector('.tabletop-board__image')
      const token = document.querySelector('.tabletop-token')
      return {
        canvasMark: canvas?.dataset.smoke ?? null,
        floorTexture: canvas?.dataset.floorTexture ?? null,
        tokenSyncCount: canvas?.dataset.tokenSyncCount ?? null,
        tokenSyncFrame: canvas?.dataset.tokenSyncFrame ?? null,
        imageComplete: image?.complete ?? false,
        imageNaturalWidth: image?.naturalWidth ?? 0,
        tokenStyle: token instanceof HTMLElement ? token.getAttribute('style') : null,
        bodyText: document.body.innerText.slice(0, 140),
      }
    })()`,
  )

  const screenshot = await send('Page.captureScreenshot', {
    captureBeyondViewport: false,
    format: 'png',
  })
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))
  socket.close()

  const stable =
    before.canvasMark === 'token-drag-stable' &&
    after.canvasMark === 'token-drag-stable' &&
    dragResult.dragged === true &&
    before.tokenStyle !== after.tokenStyle &&
    after.imageComplete &&
    after.imageNaturalWidth > 0 &&
    issueEvents.length === 0

  const result = {
    before,
    dragResult,
    after,
    issueEvents,
    screenshotPath,
    stable,
  }

  console.log(JSON.stringify(result, null, 2))

  if (!stable) {
    throw new Error(`2D token drag smoke failed: ${JSON.stringify(result)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
