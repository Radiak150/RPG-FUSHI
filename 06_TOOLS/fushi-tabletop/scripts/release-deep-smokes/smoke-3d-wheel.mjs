import { writeFile } from 'node:fs/promises'
import { openGmTable } from './cdp-table-helpers.mjs'

const port = Number(process.argv[2] ?? 9341)
const screenshotPath =
  process.argv[3] ?? 'release/win-unpacked/smoke-3d-wheel-isolated.png'
const beforeScreenshotPath = screenshotPath.replace(/(\.png)$/i, '-before$1')
const topdownScreenshotPath = screenshotPath.replace(/(\.png)$/i, '-topdown$1')

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchJson(url, attempts = 40) {
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
  let nextId = 1

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id)
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
        })
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
        reject(
          new Error(
            `CDP timeout: ${method} ${JSON.stringify(params).slice(0, 180)}`,
          ),
        )
      }, 30000)
      pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeoutId)
          resolve(value)
        },
        reject: (error) => {
          clearTimeout(timeoutId)
          reject(error)
        },
      })
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
  if (!page?.webSocketDebuggerUrl) {
    throw new Error('No debuggable Electron page found')
  }

  const { issueEvents, send, socket } = await connectCdp(
    page.webSocketDebuggerUrl,
  )
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Page.enable')
  await send('Input.setIgnoreInputEvents', { ignore: false })

  await openGmTable(send, evaluate, delay)

  const activation = await evaluate(
    send,
    `(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const button = buttons.find((candidate) => candidate.textContent?.trim().includes('3D GM'))
      if (!button) {
        return {
          clicked: false,
          reason: 'missing',
          buttons: buttons.map((candidate) => candidate.textContent?.trim()).filter(Boolean),
        }
      }
      const isActive =
        button.classList.contains('is-active') ||
        button.classList.contains('tabletop-escape--active') ||
        button.getAttribute('aria-pressed') === 'true'
      if (!isActive) button.click()
      return {
        clicked: !isActive,
        text: button.textContent?.trim(),
        className: button.className,
        pressed: button.getAttribute('aria-pressed'),
      }
    })()`,
  )
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const isReady = await evaluate(
      send,
      `Boolean(document.querySelector('.tabletop-board__free-3d-layer canvas'))`,
    )
    if (isReady) break
    await delay(200)
  }
  await delay(2600)

  const before = await evaluate(
    send,
    `(() => {
      const layer = document.querySelector('.tabletop-board__free-3d-layer')
      const stage = layer?.querySelector('.tabletop-3d-stage')
      const canvas = layer?.querySelector('canvas')
      const viewport = document.querySelector('.tabletop-board__viewport')
      if (canvas) canvas.dataset.smoke = 'stable'
      const rect = canvas?.getBoundingClientRect()
      let centerPixel = null
      if (canvas) {
        const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
        if (gl) {
          const pixel = new Uint8Array(4)
          gl.readPixels(
            Math.floor(canvas.width / 2),
            Math.floor(canvas.height / 2),
            1,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixel,
          )
          centerPixel = Array.from(pixel)
        }
      }
      return {
        hasLayer: Boolean(layer),
        hasStage: Boolean(stage),
        stageClass: stage?.className ?? null,
        hasCanvas: Boolean(canvas),
        canvasMark: canvas?.dataset.smoke ?? null,
        cameraMode: canvas?.dataset.cameraMode ?? null,
        editorEnabled: canvas?.dataset.editorEnabled ?? null,
        externalCameraIgnored: canvas?.dataset.externalCameraIgnored ?? null,
        floorTexture: canvas?.dataset.floorTexture ?? null,
        lastInput: canvas?.dataset.lastInput ?? null,
        lastKeySeen: canvas?.dataset.lastKeySeen ?? null,
        cameraTarget: canvas?.dataset.cameraTarget ?? null,
        cameraStreamSequence: Number(canvas?.dataset.cameraStreamSequence ?? 0),
        canvases: document.querySelectorAll('canvas').length,
        imageSrc: document.querySelector('.tabletop-board__image')?.src ?? null,
        centerPixel,
        scrollLeft: viewport?.scrollLeft ?? null,
        scrollTop: viewport?.scrollTop ?? null,
        rect: rect ? {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        } : null,
      }
    })()`,
  )

  if (!before.hasCanvas || !before.rect) {
    throw new Error(
      `3D canvas not available: ${JSON.stringify({ activation, before })}`,
    )
  }

  const beforeScreenshot = await send('Page.captureScreenshot', {
    captureBeyondViewport: false,
    format: 'png',
  })
  await writeFile(beforeScreenshotPath, Buffer.from(beforeScreenshot.data, 'base64'))

  const centerX = Math.round(before.rect.left + before.rect.width / 2)
  const centerY = Math.round(before.rect.top + before.rect.height / 2)
  await evaluate(
    send,
    `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'w',
      }))
      return document.querySelector('.tabletop-board__free-3d-layer canvas')?.dataset.cameraTarget ?? null
    })()`,
  )
  await delay(300)
  const streamedDuringHold = await evaluate(
    send,
    `(() => {
      const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
      const result = {
        cameraStreamSequence: Number(canvas?.dataset.cameraStreamSequence ?? 0),
        cameraTarget: canvas?.dataset.cameraTarget ?? null,
      }
      window.dispatchEvent(new KeyboardEvent('keyup', {
        bubbles: true,
        cancelable: true,
        key: 'w',
      }))
      return result
    })()`,
  )
  await send('Input.dispatchMouseEvent', {
    button: 'left',
    clickCount: 1,
    type: 'mousePressed',
    x: centerX,
    y: centerY,
  })
  await delay(40)
  await send('Input.dispatchMouseEvent', {
    button: 'left',
    clickCount: 1,
    type: 'mouseReleased',
    x: centerX,
    y: centerY,
  })
  await delay(220)
  await evaluate(
    send,
    `(() => {
      const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
      if (!canvas) return { dispatched: 0 }
      const rect = canvas.getBoundingClientRect()
      const clientX = rect.left + rect.width / 2
      const clientY = rect.top + rect.height / 2
      let dispatched = 0
      for (let index = 0; index < 48; index += 1) {
        canvas.dispatchEvent(new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
          deltaX: 0,
          deltaY: index % 2 === 0 ? 360 : -240,
        }))
        dispatched += 1
      }
      return {
        cameraTarget: canvas.dataset.cameraTarget ?? null,
        dispatched,
      }
    })()`,
  )
  await delay(700)

  const after = await evaluate(
    send,
    `(() => {
      const layer = document.querySelector('.tabletop-board__free-3d-layer')
      const stage = layer?.querySelector('.tabletop-3d-stage')
      const canvas = layer?.querySelector('canvas')
      const viewport = document.querySelector('.tabletop-board__viewport')
      return {
        hasLayer: Boolean(layer),
        hasStage: Boolean(stage),
        stageClass: stage?.className ?? null,
        hasCanvas: Boolean(canvas),
        canvasMark: canvas?.dataset.smoke ?? null,
        cameraMode: canvas?.dataset.cameraMode ?? null,
        editorEnabled: canvas?.dataset.editorEnabled ?? null,
        externalCameraIgnored: canvas?.dataset.externalCameraIgnored ?? null,
        floorTexture: canvas?.dataset.floorTexture ?? null,
        lastInput: canvas?.dataset.lastInput ?? null,
        lastKeySeen: canvas?.dataset.lastKeySeen ?? null,
        cameraTarget: canvas?.dataset.cameraTarget ?? null,
        cameraStreamSequence: Number(canvas?.dataset.cameraStreamSequence ?? 0),
        canvases: document.querySelectorAll('canvas').length,
        scrollLeft: viewport?.scrollLeft ?? null,
        scrollTop: viewport?.scrollTop ?? null,
        bodyText: document.body.innerText.slice(0, 160),
      }
    })()`,
  )

  const screenshot = await send('Page.captureScreenshot', {
    captureBeyondViewport: false,
    format: 'png',
  })
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))

  await evaluate(
    send,
    `(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const button = buttons.find((candidate) => candidate.textContent?.trim() === 'Reset')
      if (button) button.click()
      return { resetClicked: Boolean(button) }
    })()`,
  )
  await delay(500)

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
      return { restoredTopdown: Boolean(button && isActive) }
    })()`,
  )
  await delay(900)

  const topdown = await evaluate(
    send,
    `(() => {
      const object = document.querySelector('.tabletop-object')
      if (object instanceof HTMLElement) {
        object.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        object.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        object.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
      }
      const image = document.querySelector('.tabletop-board__image')
      const freeLayer = document.querySelector('.tabletop-board__free-3d-layer')
      const stage = document.querySelector('.tabletop-board__stage')
      const rect = stage?.getBoundingClientRect()
      return {
        clickedObject: Boolean(object),
        hasFreeLayer: Boolean(freeLayer),
        imageComplete: image?.complete ?? false,
        imageNaturalWidth: image?.naturalWidth ?? 0,
        objectCount: document.querySelectorAll('.tabletop-object').length,
        rect: rect ? {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        } : null,
      }
    })()`,
  )
  await delay(500)

  const topdownScreenshot = await send('Page.captureScreenshot', {
    captureBeyondViewport: false,
    format: 'png',
  })
  await writeFile(topdownScreenshotPath, Buffer.from(topdownScreenshot.data, 'base64'))

  socket.close()

  const stable =
    before.canvasMark === 'stable' &&
    after.canvasMark === 'stable' &&
    streamedDuringHold.cameraStreamSequence > before.cameraStreamSequence &&
    streamedDuringHold.cameraTarget !== before.cameraTarget &&
    before.cameraTarget !== after.cameraTarget &&
    before.scrollLeft === after.scrollLeft &&
    before.scrollTop === after.scrollTop &&
    (topdown.clickedObject || topdown.objectCount === 0) &&
    !topdown.hasFreeLayer &&
    topdown.imageComplete &&
    topdown.imageNaturalWidth > 0 &&
    issueEvents.length === 0

  const result = {
    before,
    streamedDuringHold,
    after,
    issueEvents,
    beforeScreenshotPath,
    screenshotPath,
    topdown,
    topdownScreenshotPath,
    stable,
  }

  console.log(JSON.stringify(result, null, 2))

  if (!stable) {
    throw new Error(`3D wheel smoke failed: ${JSON.stringify(result)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
