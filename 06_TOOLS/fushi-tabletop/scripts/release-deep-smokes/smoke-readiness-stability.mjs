import { writeFile } from 'node:fs/promises'
import { openGmTable } from './cdp-table-helpers.mjs'

const port = Number(process.argv[2] ?? 9391)
const screenshotPath =
  process.argv[3] ?? 'release/win-unpacked/smoke-readiness-stability.png'

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
  await send('Input.setIgnoreInputEvents', { ignore: false })

  await openGmTable(send, evaluate, delay)
  await delay(600)

  const before = await evaluate(
    send,
    `(() => {
      const stage = document.querySelector('.tabletop-board__stage')
      if (stage instanceof HTMLElement) stage.dataset.readinessSmoke = 'stage-stable'
      const smoke = {
        readinessAppearances: 0,
        readinessVisibleNow: Boolean(document.querySelector('.tabletop-readiness')),
      }
      const observer = new MutationObserver(() => {
        if (document.querySelector('.tabletop-readiness')) {
          smoke.readinessAppearances += 1
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
      window.__fushiReadinessSmoke = smoke
      window.__fushiReadinessSmokeObserver = observer
      return {
        hasReadiness: smoke.readinessVisibleNow,
        stageMark: stage?.dataset.readinessSmoke ?? null,
        tokenCount: document.querySelectorAll('.tabletop-token').length,
      }
    })()`,
  )

  const actions = await evaluate(
    send,
    `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const clickButton = async (predicate, pause = 220) => {
        const button = Array.from(document.querySelectorAll('button')).find(predicate)
        if (button instanceof HTMLElement) {
          button.click()
          await wait(pause)
          return true
        }
        return false
      }
      const clickToken = async () => {
        const token = document.querySelector('.tabletop-token')
        if (!(token instanceof HTMLElement)) return false
        const rect = token.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        token.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          button: 0,
          cancelable: true,
          clientX: x,
          clientY: y,
        }))
        await wait(180)
        token.dispatchEvent(new MouseEvent('dblclick', {
          bubbles: true,
          button: 0,
          cancelable: true,
          clientX: x,
          clientY: y,
        }))
        await wait(420)
        return true
      }
      const measureDistance = async () => {
        await clickButton(
          (button) => button.getAttribute('aria-label') === 'Abrir menu superior',
          260,
        )
        const measureEnabled = await clickButton(
          (button) => button.getAttribute('aria-label') === 'Medir distancia',
          260,
        )
        const stage = document.querySelector('.tabletop-board__stage')
        if (!measureEnabled || !(stage instanceof HTMLElement)) {
          return {
            finalVisible: false,
            measureEnabled,
            reason: measureEnabled ? 'missing-stage' : 'missing-button',
            snapshots: [],
          }
        }

        const rect = stage.getBoundingClientRect()
        const pointerId = 5517
        const startX = rect.left + rect.width * 0.22
        const startY = rect.top + rect.height * 0.24
        const points = [
          [rect.left + rect.width * 0.34, rect.top + rect.height * 0.34],
          [rect.left + rect.width * 0.48, rect.top + rect.height * 0.46],
          [rect.left + rect.width * 0.62, rect.top + rect.height * 0.58],
          [rect.left + rect.width * 0.7, rect.top + rect.height * 0.66],
        ]
        const snapshots = []

        stage.dispatchEvent(new PointerEvent('pointerdown', {
          bubbles: true,
          button: 0,
          buttons: 1,
          cancelable: true,
          clientX: startX,
          clientY: startY,
          pointerId,
          pointerType: 'mouse',
        }))
        await wait(120)

        for (const [clientX, clientY] of points) {
          window.dispatchEvent(new PointerEvent('pointermove', {
            bubbles: true,
            button: 0,
            buttons: 1,
            cancelable: true,
            clientX,
            clientY,
            pointerId,
            pointerType: 'mouse',
          }))
          await wait(120)
          const line = document.querySelector('.tabletop-measurement')
          snapshots.push({
            label: line?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
            visible: Boolean(line),
          })
        }

        const [endX, endY] = points[points.length - 1]
        window.dispatchEvent(new PointerEvent('pointerup', {
          bubbles: true,
          button: 0,
          buttons: 0,
          cancelable: true,
          clientX: endX,
          clientY: endY,
          pointerId,
          pointerType: 'mouse',
        }))
        await wait(240)

        const finalLine = document.querySelector('.tabletop-measurement')
        return {
          finalLabel: finalLine?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
          finalVisible: Boolean(finalLine),
          measureEnabled,
          snapshots,
        }
      }

      const tokenOpened = await clickToken()
      const portraitButton = document.querySelector('.sheet-view__portrait-button')
      if (portraitButton instanceof HTMLElement) {
        portraitButton.click()
        await wait(420)
      }
      const previewOpened = Boolean(document.querySelector('.tabletop-image-preview'))
      const broadcastButton = Array.from(document.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Mostrar aos players',
      )
      if (broadcastButton instanceof HTMLElement) {
        broadcastButton.click()
        await wait(520)
      }
      const previewClose = document.querySelector('button[aria-label="Fechar preview"]')
      if (previewClose instanceof HTMLElement) {
        previewClose.click()
        await wait(240)
      }
      for (const closeButton of Array.from(document.querySelectorAll('button[aria-label="Fechar janela"]')).slice(0, 3)) {
        if (closeButton instanceof HTMLElement) {
          closeButton.click()
          await wait(180)
        }
      }

      const measurement = await measureDistance()

      await clickButton(
        (button) => button.getAttribute('aria-label') === 'Abrir ferramentas',
        260,
      )
      const mapsOpened = await clickButton(
        (button) => button.getAttribute('aria-label') === 'Mapas' || button.title === 'Mapas',
        360,
      )
      const interludeTabOpened = await clickButton(
        (button) => (button.textContent ?? '').toUpperCase().includes('INTERLUDIOS'),
        360,
      )
      let createdInterlude = false
      let interludeShown = await clickButton(
        (button) => button.textContent?.trim() === 'Mostrar interludio',
        720,
      )
      if (!interludeShown) {
        createdInterlude = await clickButton(
          (button) => button.textContent?.trim() === '+ Interludio',
          360,
        )
        await clickButton(
          (button) => button.textContent?.trim() === 'Cancelar',
          260,
        )
        interludeShown = await clickButton(
          (button) => button.textContent?.trim() === 'Mostrar interludio',
          720,
        )
      }
      const transitionVisible = Boolean(document.querySelector('.tabletop-transition-overlay'))

      return {
        createdInterlude,
        interludeShown,
        interludeTabOpened,
        mapsOpened,
        measurement,
        previewOpened,
        tokenOpened,
        transitionVisible,
      }
    })()`,
  )

  await delay(900)

  const after = await evaluate(
    send,
    `(() => {
      window.__fushiReadinessSmokeObserver?.disconnect?.()
      const stage = document.querySelector('.tabletop-board__stage')
      return {
        bodyText: document.body.innerText.slice(0, 240),
        hasReadiness: Boolean(document.querySelector('.tabletop-readiness')),
        readinessAppearances: window.__fushiReadinessSmoke?.readinessAppearances ?? -1,
        stageMark: stage?.dataset.readinessSmoke ?? null,
        tokenBorderColor: getComputedStyle(document.querySelector('.tabletop-token') ?? document.body)
          .getPropertyValue('--token-border-color')
          .trim(),
        tokenCount: document.querySelectorAll('.tabletop-token').length,
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
    before.hasReadiness === false &&
    before.stageMark === 'stage-stable' &&
    after.stageMark === 'stage-stable' &&
    after.hasReadiness === false &&
    after.readinessAppearances === 0 &&
    after.tokenCount > 0 &&
    actions.tokenOpened === true &&
    actions.previewOpened === true &&
    actions.mapsOpened === true &&
    actions.interludeTabOpened === true &&
    actions.interludeShown === true &&
    actions.transitionVisible === true &&
    actions.measurement?.measureEnabled === true &&
    actions.measurement?.finalVisible === true &&
    actions.measurement?.finalLabel.length > 0 &&
    actions.measurement?.snapshots?.length >= 4 &&
    actions.measurement.snapshots.every((snapshot) => snapshot.visible === true) &&
    after.tokenBorderColor.length > 0 &&
    issueEvents.length === 0

  const result = {
    actions,
    after,
    before,
    issueEvents,
    screenshotPath,
    stable,
  }

  console.log(JSON.stringify(result, null, 2))

  if (!stable) {
    throw new Error(`readiness stability smoke failed: ${JSON.stringify(result)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
