import { writeFile } from 'node:fs/promises'
import { openGmTable } from './cdp-table-helpers.mjs'

const port = Number(process.argv[2] ?? 9375)
const screenshotPath =
  process.argv[3] ?? 'release/win-unpacked/smoke-object-vfx-layer.png'

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

async function waitFor(send, expression, attempts = 60, interval = 250) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const value = await evaluate(send, expression)
      if (value) return value
    } catch {
      // The page can reload while the smoke is preparing product preferences.
    }
    await delay(interval)
  }
  return null
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
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      localStorage.setItem(
        'fushi-tabletop:product-preferences:v1',
        JSON.stringify({
          theme: 'obsidian',
          visualQuality: 'ultra',
          showModuleDescriptions: false,
        }),
      )
    `,
  })

  await evaluate(
    send,
    `(() => {
      localStorage.setItem(
        'fushi-tabletop:product-preferences:v1',
        JSON.stringify({
          theme: 'obsidian',
          visualQuality: 'ultra',
          showModuleDescriptions: false,
        }),
      )
      location.reload()
      return location.href
    })()`,
  )

  await waitFor(send, `document.documentElement.dataset.visualQuality === 'ultra'`, 50, 240)
  await openGmTable(send, evaluate, delay)

  const setup = await evaluate(
    send,
    `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const buttons = () => Array.from(document.querySelectorAll('button'))
      const clickButton = async (predicate, pause = 220) => {
        const button = buttons().find(predicate)
        if (button instanceof HTMLElement) {
          button.click()
          await wait(pause)
          return true
        }
        return false
      }

      await clickButton(
        (button) => button.getAttribute('aria-label') === 'Abrir menu superior',
        260,
      )
      await clickButton(
        (button) => button.getAttribute('aria-label') === 'Abrir atalhos',
        260,
      )
      await clickButton(
        (button) => button.getAttribute('aria-label') === 'Abrir ferramentas',
        320,
      )

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const gm3d = buttons().find((button) => button.textContent?.trim().includes('3D GM'))
        const is3dActive =
          gm3d?.classList.contains('is-active') ||
          gm3d?.classList.contains('tabletop-escape--active') ||
          gm3d?.getAttribute('aria-pressed') === 'true'
        if (gm3d instanceof HTMLElement && is3dActive) {
          gm3d.click()
          await wait(400)
          break
        }
        if (document.querySelector('.tabletop-board__image')) break
        await wait(160)
      }

      for (let attempt = 0; attempt < 8; attempt += 1) {
        if (buttons().some((button) => button.getAttribute('aria-label') === 'Objetos' || button.title === 'Objetos')) {
          break
        }
        await clickButton(
          (button) => button.getAttribute('aria-label') === 'Abrir ferramentas',
          260,
        )
        await wait(120)
      }

      await clickButton(
        (button) => button.getAttribute('aria-label') === 'Objetos' || button.title === 'Objetos',
        320,
      )

      let animationsTab = null
      for (let attempt = 0; attempt < 12; attempt += 1) {
        animationsTab = buttons().find((button) => button.textContent?.trim() === 'Animacoes')
        if (animationsTab instanceof HTMLElement) break
        await wait(160)
      }
      if (animationsTab instanceof HTMLElement) animationsTab.click()
      await wait(260)

      const presets = Array.from(document.querySelectorAll('.tabletop-object-preset'))
      const firePreset = presets.find((preset) =>
        preset.textContent?.toLowerCase().includes('coluna de fogo'),
      )
      const stage = document.querySelector('.tabletop-board__stage')
      if (firePreset instanceof HTMLElement && stage instanceof HTMLElement) {
        firePreset.click()
        await wait(220)
        const rect = stage.getBoundingClientRect()
        stage.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          button: 0,
          cancelable: true,
          clientX: rect.left + rect.width * 0.52,
          clientY: rect.top + rect.height * 0.48,
        }))
        await wait(1200)
      }

      return {
        animationsPanel: animationsTab instanceof HTMLElement,
        firePreset: Boolean(firePreset),
        objectCount: document.querySelectorAll('.tabletop-object').length,
        topbarExpanded: Boolean(document.querySelector('.tabletop-screen__topbar')),
        toolButtons: buttons().map((button) => button.getAttribute('aria-label') || button.title || button.textContent?.trim()).filter(Boolean).slice(0, 16),
      }
    })()`,
  )

  const layerReady = await waitFor(
    send,
    `(() => {
      const layer = document.querySelector('.tabletop-object-vfx-layer')
      const canvas = layer?.querySelector('canvas')
      return canvas
        ? {
            canvasHeight: canvas.height,
            canvasWidth: canvas.width,
            kinds: layer.dataset.vfxKinds ?? '',
            objectCount: Number(layer.dataset.vfxObjectCount ?? 0),
          }
        : null
    })()`,
    60,
    250,
  )

  const selectionAudit = await evaluate(
    send,
    `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const object = document.querySelector('.tabletop-object[data-object-variant^="vfx-"]')
      if (object instanceof HTMLElement) {
        object.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        await wait(180)
      }
      return {
        clicked: object instanceof HTMLElement,
        background: object instanceof HTMLElement ? getComputedStyle(object).backgroundImage : null,
        opacity: object instanceof HTMLElement ? getComputedStyle(object).opacity : null,
        outlineStyle: object instanceof HTMLElement ? getComputedStyle(object).outlineStyle : null,
        pointerEvents: object instanceof HTMLElement ? getComputedStyle(object).pointerEvents : null,
        selected: Boolean(document.querySelector('.tabletop-object--selected[data-object-variant^="vfx-"]')),
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
    setup.animationsPanel &&
    setup.firePreset &&
    setup.objectCount > 0 &&
    layerReady?.objectCount > 0 &&
    layerReady?.kinds.includes('fire') &&
    layerReady?.canvasWidth > 0 &&
    layerReady?.canvasHeight > 0 &&
    selectionAudit.clicked &&
    selectionAudit.background === 'none' &&
    selectionAudit.opacity === '0' &&
    selectionAudit.outlineStyle === 'none' &&
    selectionAudit.pointerEvents === 'auto' &&
    selectionAudit.selected &&
    issueEvents.length === 0

  const result = {
    issueEvents,
    layerReady,
    screenshotPath,
    selectionAudit,
    setup,
    stable,
  }
  console.log(JSON.stringify(result, null, 2))

  if (!stable) {
    throw new Error(`Object VFX layer smoke failed: ${JSON.stringify(result)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
