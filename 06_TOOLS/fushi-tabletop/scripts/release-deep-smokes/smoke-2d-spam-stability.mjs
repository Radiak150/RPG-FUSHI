import { writeFile } from 'node:fs/promises'
import { openGmTable } from './cdp-table-helpers.mjs'

const port = Number(process.argv[2] ?? 9357)
const screenshotPath =
  process.argv[3] ?? 'release/win-unpacked/smoke-2d-spam-stability.png'

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

  await evaluate(
    send,
    `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const toolsButton = Array.from(document.querySelectorAll('button')).find(
        (button) => button.getAttribute('aria-label') === 'Abrir ferramentas',
      )
      if (toolsButton instanceof HTMLElement) {
        toolsButton.click()
        await wait(180)
      }

      const objectsButton = Array.from(document.querySelectorAll('button')).find(
        (button) => button.getAttribute('aria-label') === 'Objetos' || button.title === 'Objetos',
      )
      if (objectsButton instanceof HTMLElement) {
        objectsButton.click()
        await wait(260)
      }

      const stage = document.querySelector('.tabletop-board__stage')
      if (
        document.querySelectorAll('.tabletop-object').length === 0 &&
        stage instanceof HTMLElement
      ) {
        const rect = stage.getBoundingClientRect()
        const points = [
          [rect.left + rect.width * 0.45, rect.top + rect.height * 0.42],
          [rect.left + rect.width * 0.57, rect.top + rect.height * 0.5],
          [rect.left + rect.width * 0.51, rect.top + rect.height * 0.62],
        ]
        for (let index = 0; index < points.length; index += 1) {
          const preset = document.querySelectorAll('.tabletop-object-preset')[index]
          if (!(preset instanceof HTMLElement)) continue
          preset.click()
          await wait(140)
          const [clientX, clientY] = points[index]
          stage.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            button: 0,
            cancelable: true,
            clientX,
            clientY,
          }))
          await wait(260)
        }
      }

      return {
        objectCount: document.querySelectorAll('.tabletop-object').length,
        panelOpen: Boolean(document.querySelector('.tabletop-object-preset')),
      }
    })()`,
  )
  await delay(900)

  const before = await evaluate(
    send,
    `(() => {
      const canvas = document.querySelector('.tabletop-board__stage .tabletop-3d-stage canvas')
      const image = document.querySelector('.tabletop-board__image')
      if (canvas) canvas.dataset.smoke = 'spam-stable'
      return {
        canvasMark: canvas?.dataset.smoke ?? null,
        imageComplete: image?.complete ?? false,
        imageNaturalWidth: image?.naturalWidth ?? 0,
        objectCount: document.querySelectorAll('.tabletop-object').length,
        tokenCount: document.querySelectorAll('.tabletop-token').length,
      }
    })()`,
  )

  const actionResult = await evaluate(
    send,
    `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      let objectClicks = 0
      let visibilityToggles = 0
      let removed = 0
      const initialObjectCount = document.querySelectorAll('.tabletop-object').length

      for (let index = 0; index < 10; index += 1) {
        const object = document.querySelector('.tabletop-object')
        if (object instanceof HTMLElement) {
          object.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
          object.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
          object.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
          objectClicks += 1
        }
        await wait(80)
      }

      const token = document.querySelector('.tabletop-token')
      if (token instanceof HTMLElement) {
        const rect = token.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        const pointerId = 7781
        token.dispatchEvent(new PointerEvent('pointerdown', {
          bubbles: true,
          button: 0,
          buttons: 1,
          cancelable: true,
          clientX: x,
          clientY: y,
          pointerId,
          pointerType: 'mouse',
        }))
        window.dispatchEvent(new PointerEvent('pointerup', {
          bubbles: true,
          button: 0,
          buttons: 0,
          cancelable: true,
          clientX: x,
          clientY: y,
          pointerId,
          pointerType: 'mouse',
        }))
        token.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          button: 0,
          cancelable: true,
          clientX: x,
          clientY: y,
        }))
        await wait(180)
      }

      for (let index = 0; index < 8; index += 1) {
        const visibilityButton = document.querySelector('button[aria-label="Alternar visibilidade do token"]')
        if (visibilityButton instanceof HTMLElement) {
          visibilityButton.click()
          visibilityToggles += 1
          await wait(110)
        }
      }

      const openObjectPanelButton = Array.from(document.querySelectorAll('button')).find(
        (button) =>
          button.getAttribute('aria-label')?.toLowerCase().includes('objet') ||
          button.title?.toLowerCase().includes('objet'),
      )
      if (openObjectPanelButton instanceof HTMLElement) {
        openObjectPanelButton.click()
        await wait(200)
      }

      const removableObjectCount = Math.max(0, initialObjectCount - 1)
      for (let index = 0; index < Math.min(3, removableObjectCount); index += 1) {
        const removeButton = Array.from(document.querySelectorAll('button')).find(
          (button) => button.textContent?.trim() === 'Remover',
        )
        if (removeButton instanceof HTMLElement) {
          removeButton.click()
          removed += 1
          await wait(120)
        }
      }

      return {
        initialObjectCount,
        objectClicks,
        removed,
        visibilityToggles,
      }
    })()`,
  )
  await delay(1200)

  const after = await evaluate(
    send,
    `(() => {
      const canvas = document.querySelector('.tabletop-board__stage .tabletop-3d-stage canvas')
      const image = document.querySelector('.tabletop-board__image')
      return {
        canvasMark: canvas?.dataset.smoke ?? null,
        floorTexture: canvas?.dataset.floorTexture ?? null,
        imageComplete: image?.complete ?? false,
        imageNaturalWidth: image?.naturalWidth ?? 0,
        objectCount: document.querySelectorAll('.tabletop-object').length,
        tokenCount: document.querySelectorAll('.tabletop-token').length,
        bodyText: document.body.innerText.slice(0, 180),
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
    before.canvasMark === 'spam-stable' &&
    after.canvasMark === 'spam-stable' &&
    actionResult.objectClicks > 0 &&
    actionResult.visibilityToggles > 0 &&
    after.imageComplete &&
    after.imageNaturalWidth > 0 &&
    issueEvents.length === 0

  const result = {
    actionResult,
    after,
    before,
    issueEvents,
    screenshotPath,
    stable,
  }

  console.log(JSON.stringify(result, null, 2))

  if (!stable) {
    throw new Error(`2D spam stability smoke failed: ${JSON.stringify(result)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
