import { writeFile } from 'node:fs/promises'
import { openGmTable } from './cdp-table-helpers.mjs'

const port = Number(process.argv[2] ?? 9371)
const screenshotPath =
  process.argv[3] ?? 'release/win-unpacked/smoke-3d-d20-impact.png'
const diceCooldownMs = 16_000

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
  const networkRequests = new Map()
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
        issueEvents.push({
          method: message.method,
          text: entry.text,
          url: entry.url ?? null,
        })
      }
    }
    if (message.method === 'Network.responseReceived') {
      const response = message.params?.response
      if (response?.status >= 400) {
        issueEvents.push({
          method: message.method,
          status: response.status,
          url: response.url,
        })
      }
    }
    if (message.method === 'Network.requestWillBeSent') {
      if (message.params?.requestId && message.params?.request?.url) {
        networkRequests.set(message.params.requestId, message.params.request.url)
      }
    }
    if (message.method === 'Network.loadingFailed') {
      issueEvents.push({
        blockedReason: message.params?.blockedReason ?? null,
        errorText: message.params?.errorText ?? null,
        method: message.method,
        url: networkRequests.get(message.params?.requestId) ?? null,
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

async function waitFor(send, expression, attempts = 40, interval = 250) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const value = await evaluate(send, expression)
      if (value) return value
    } catch {
      // Reloads can briefly destroy the execution context while the smoke waits.
    }
    await delay(interval)
  }
  return null
}

function isBenignImpactVideoAbort(event) {
  return (
    event?.method === 'Network.loadingFailed' &&
    event?.errorText === 'net::ERR_ABORTED' &&
    typeof event?.url === 'string' &&
    event.url.endsWith('/assets/fx/video/thunder_red_looping_2.mp4')
  )
}

async function waitForOverlayToClear(send) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const isClear = await evaluate(
      send,
      `!document.querySelector('.tabletop-dice-box-overlay--active')`,
    )
    if (isClear) return true
    await delay(250)
  }
  return false
}

async function waitForImpactToClear(send) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const isClear = await evaluate(
      send,
      `(() => {
        const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
        const active = canvas?.dataset.impactActive ?? ''
        return !active || active === '0'
      })()`,
    )
    if (isClear) return true
    await delay(250)
  }
  return false
}

async function main() {
  const targets = await fetchJson(`http://127.0.0.1:${port}/json`)
  const page = targets.find((target) => target.type === 'page') ?? targets[0]
  if (!page?.webSocketDebuggerUrl) throw new Error('No debuggable Electron page found')

  const { issueEvents, send, socket } = await connectCdp(page.webSocketDebuggerUrl)
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Network.enable')
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
  await waitFor(
    send,
    `document.documentElement.dataset.visualQuality === 'ultra'`,
    50,
    240,
  )
  await openGmTable(send, evaluate, delay)

  await evaluate(
    send,
    `(() => {
      const button = Array.from(document.querySelectorAll('button')).find(
        (candidate) => candidate.textContent?.trim().includes('3D GM'),
      )
      const isActive =
        button?.classList.contains('is-active') ||
        button?.classList.contains('tabletop-escape--active') ||
        button?.getAttribute('aria-pressed') === 'true'
      if (button instanceof HTMLElement && !isActive) button.click()
      return { clicked: Boolean(button && !isActive), hadButton: Boolean(button) }
    })()`,
  )

  const canvasReady = await waitFor(
    send,
    `Boolean(document.querySelector('.tabletop-board__free-3d-layer canvas[data-camera-mode="free"]'))`,
    50,
    240,
  )
  if (!canvasReady) throw new Error('3D GM canvas did not become ready')
  await delay(2200)

  const before = await evaluate(
    send,
    `(() => {
      const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
      const image = document.querySelector('.tabletop-board__image')
      if (canvas) canvas.dataset.smoke = 'd20-impact-stable'
      return {
        canvasMark: canvas?.dataset.smoke ?? null,
        floorTexture: canvas?.dataset.floorTexture ?? null,
        frame: Number(canvas?.dataset.renderFrame ?? 0),
        imageComplete: image?.complete ?? false,
        imageNaturalWidth: image?.naturalWidth ?? 0,
        rootQuality: document.documentElement.dataset.visualQuality ?? null,
        waterSurface: canvas?.dataset.waterSurface ?? null,
      }
    })()`,
  )

  const rollWindowStateAudit = await evaluate(
    send,
    `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const allButtons = () => Array.from(document.querySelectorAll('button'))
      const setValue = (element, value) => {
        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(element),
          'value',
        )
        descriptor?.set?.call(element, value)
        element.dispatchEvent(new Event('input', { bubbles: true }))
        element.dispatchEvent(new Event('change', { bubbles: true }))
      }

      if (!document.querySelector('.tabletop-session-log__roller')) {
        const expandLogButton = document.querySelector(
          '.floating-window--log button[aria-label="Expandir janela"]',
        )
        if (expandLogButton instanceof HTMLElement) {
          expandLogButton.click()
          await wait(180)
        }
      }

      if (!document.querySelector('.tabletop-session-log__roller')) {
        const logButton = allButtons().find(
          (button) => button.getAttribute('aria-label') === 'Abrir chat, log e rolagem',
        )
        if (logButton instanceof HTMLElement) {
          logButton.click()
          await wait(240)
        }
      }

      const select = document.querySelector('.tabletop-session-log__die-picker select')
      if (!(select instanceof HTMLSelectElement)) {
        return { hasRoller: false }
      }

      setValue(select, '2')
      await wait(80)
      const minimizeButton = document.querySelector(
        '.floating-window--log button[aria-label="Minimizar janela"]',
      )
      if (minimizeButton instanceof HTMLElement) {
        minimizeButton.click()
        await wait(160)
      }
      const minimizedAfterClick = Boolean(
        document.querySelector('.floating-window--log.floating-window--minimized'),
      )
      const expandButton = document.querySelector(
        '.floating-window--log button[aria-label="Expandir janela"]',
      )
      if (expandButton instanceof HTMLElement) {
        expandButton.click()
        await wait(220)
      }
      const restoredSelect = document.querySelector('.tabletop-session-log__die-picker select')

      return {
        hasRoller: Boolean(document.querySelector('.tabletop-session-log__roller')),
        minimizedAfterClick,
        selectedAfterRestore:
          restoredSelect instanceof HTMLSelectElement ? restoredSelect.value : null,
      }
    })()`,
  )

  const tabAudit = await evaluate(
    send,
    `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const allButtons = () => Array.from(document.querySelectorAll('button'))
      const toolsButton = allButtons().find(
        (button) => button.getAttribute('aria-label') === 'Abrir ferramentas',
      )
      if (toolsButton instanceof HTMLElement) {
        toolsButton.click()
        await wait(150)
      }
      const objectsButton = allButtons().find(
        (button) => button.getAttribute('aria-label') === 'Objetos' || button.title === 'Objetos',
      )
      if (objectsButton instanceof HTMLElement) {
        objectsButton.click()
        await wait(220)
      }

      let missingImage = 0
      let remountedCanvas = 0
      for (let index = 0; index < 20; index += 1) {
        const label = index % 2 === 0 ? 'Animacoes' : 'Objetos'
        const tab = allButtons().find((button) => button.textContent?.trim() === label)
        if (tab instanceof HTMLElement) tab.click()
        await wait(45)
        const image = document.querySelector('.tabletop-board__image')
        const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
        if (!image?.complete || !image.naturalWidth) missingImage += 1
        if (canvas?.dataset.smoke !== 'd20-impact-stable') remountedCanvas += 1
      }

      return {
        hasObjectsPanel: Boolean(document.querySelector('.tabletop-object-preset')),
        missingImage,
        previewCanvases: document.querySelectorAll('.tabletop-object-three canvas').length,
        remountedCanvas,
      }
    })()`,
  )

  async function forceRoll(randomValue, expectedImpact) {
    const clickResult = await evaluate(
      send,
      `(async () => {
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
        const allButtons = () => Array.from(document.querySelectorAll('button'))
        if (!document.querySelector('.tabletop-session-log__roller')) {
          const expandLogButton = document.querySelector(
            '.floating-window--log button[aria-label="Expandir janela"]',
          )
          if (expandLogButton instanceof HTMLElement) {
            expandLogButton.click()
            await wait(180)
          }
        }
        if (!document.querySelector('.tabletop-session-log__roller')) {
          const logButton = allButtons().find(
            (button) => button.getAttribute('aria-label') === 'Abrir chat, log e rolagem',
          )
          if (logButton instanceof HTMLElement) {
            logButton.click()
            await wait(240)
          }
        }
        if (!document.querySelector('.tabletop-session-log__roller')) {
          return { clicked: false, reason: 'missing-roller' }
        }

        const setValue = (element, value) => {
          const descriptor = Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(element),
            'value',
          )
          descriptor?.set?.call(element, value)
          element.dispatchEvent(new Event('input', { bubbles: true }))
          element.dispatchEvent(new Event('change', { bubbles: true }))
        }

        const select = document.querySelector('.tabletop-session-log__die-picker select')
        if (select instanceof HTMLSelectElement) setValue(select, '20')
        const inputs = Array.from(
          document.querySelectorAll('.tabletop-session-log__dice-builder input[type="number"]'),
        )
        if (inputs[0] instanceof HTMLInputElement) setValue(inputs[0], '1')
        if (inputs[1] instanceof HTMLInputElement) setValue(inputs[1], '0')
        const highestButton = allButtons().find(
          (button) => button.getAttribute('aria-label') === 'Usar maior dado mais bonus',
        )
        if (
          highestButton instanceof HTMLElement &&
          highestButton.getAttribute('aria-pressed') !== 'true'
        ) {
          highestButton.click()
        }

        const getDraftState = () => {
          const roller = document.querySelector('.tabletop-session-log__roller')
          const currentSelect = document.querySelector('.tabletop-session-log__die-picker select')
          const currentInputs = Array.from(
            document.querySelectorAll('.tabletop-session-log__dice-builder input[type="number"]'),
          )
          const currentHighestButton = allButtons().find(
            (button) => button.getAttribute('aria-label') === 'Usar maior dado mais bonus',
          )
          const formulaText = Array.from(roller?.querySelectorAll('.support-copy') ?? [])
            .map((element) => element.textContent?.trim() ?? '')
            .filter(Boolean)
            .join(' | ')

          return {
            bonus:
              currentInputs[1] instanceof HTMLInputElement ? currentInputs[1].value : null,
            formulaText,
            modeHighest: currentHighestButton?.getAttribute('aria-pressed') ?? null,
            quantity:
              currentInputs[0] instanceof HTMLInputElement ? currentInputs[0].value : null,
            selectValue:
              currentSelect instanceof HTMLSelectElement ? currentSelect.value : null,
          }
        }

        let draftState = getDraftState()
        for (let attempt = 0; attempt < 20; attempt += 1) {
          const ready =
            draftState.selectValue === '20' &&
            draftState.quantity === '1' &&
            draftState.bonus === '0' &&
            draftState.modeHighest === 'true' &&
            draftState.formulaText.includes('1d20')
          if (ready) break
          await wait(80)
          draftState = getDraftState()
        }

        const rollButton = allButtons().find(
          (button) => button.textContent?.trim() === 'Rolar publico',
        )
        const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
        const beforeFrame = Number(canvas?.dataset.renderFrame ?? 0)
        if (!(rollButton instanceof HTMLElement)) {
          return { clicked: false, draftState, reason: 'missing-roll-button', beforeFrame }
        }

        const originalRandom = Math.random
        try {
          Math.random = () => ${randomValue}
          rollButton.click()
        } finally {
          Math.random = originalRandom
        }
        return { beforeFrame, clicked: true, draftState, rollButtonText: rollButton.textContent?.trim() ?? '' }
      })()`,
    )

    let observedImpact = null
    if (clickResult.clicked) {
      for (let attempt = 0; attempt < 48; attempt += 1) {
        observedImpact = await evaluate(
          send,
          `(() => {
            const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
            const active = canvas?.dataset.impactActive ?? ''
            return active === '${expectedImpact}'
              ? {
                  frame: Number(canvas?.dataset.renderFrame ?? 0),
                  impactActive: active,
                }
              : null
          })()`,
        )
        if (observedImpact) break
        await delay(250)
      }
    }

    const after = await evaluate(
      send,
      `(() => {
        const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
        const image = document.querySelector('.tabletop-board__image')
        const frame = Number(canvas?.dataset.renderFrame ?? 0)
        return {
          activeDiceOverlay: Boolean(document.querySelector('.tabletop-dice-box-overlay--active')),
          canvasMark: canvas?.dataset.smoke ?? null,
          floorTexture: canvas?.dataset.floorTexture ?? null,
          frame,
          frameAdvanced: frame > ${clickResult.beforeFrame ?? 0},
          hasCanvas: Boolean(canvas),
          hasUltraImpactScene: Boolean(document.querySelector('.tabletop-dice-impact-scene')),
          imageComplete: image?.complete ?? false,
          imageNaturalWidth: image?.naturalWidth ?? 0,
          impactText: document.querySelector('.tabletop-dice-box-overlay__impact')?.textContent?.trim() ?? '',
          impactActive: canvas?.dataset.impactActive ?? null,
          rollOutcome: document.querySelector('.tabletop-dice-box-overlay')?.dataset.rollOutcome ?? null,
          rollTotal: document.querySelector('.tabletop-dice-box-overlay')?.dataset.rollTotal ?? null,
          rollWindowMinimized: Boolean(document.querySelector('.floating-window--log.floating-window--minimized')),
          waterSurface: canvas?.dataset.waterSurface ?? null,
        }
      })()`,
    )

    return { ...clickResult, after, observedImpact }
  }

  const critical = await forceRoll(0, 'critical')
  await waitForOverlayToClear(send)
  await waitForImpactToClear(send)
  await delay(diceCooldownMs + 800)
  const triumph = await forceRoll(0.999999, 'triumph')
  await delay(1200)

  const screenshot = await send('Page.captureScreenshot', {
    captureBeyondViewport: false,
    format: 'png',
  })
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))
  socket.close()

  const ignoredIssueEvents = issueEvents.filter(isBenignImpactVideoAbort)
  const actionableIssueEvents = issueEvents.filter(
    (event) => !isBenignImpactVideoAbort(event),
  )

  const stable =
    before.canvasMark === 'd20-impact-stable' &&
    before.floorTexture === 'loaded' &&
    rollWindowStateAudit.hasRoller &&
    rollWindowStateAudit.minimizedAfterClick &&
    rollWindowStateAudit.selectedAfterRestore === '2' &&
    tabAudit.missingImage === 0 &&
    tabAudit.remountedCanvas === 0 &&
    tabAudit.previewCanvases === 0 &&
    critical.clicked &&
    critical.observedImpact?.impactActive === 'critical' &&
    critical.after.frameAdvanced &&
    critical.after.canvasMark === 'd20-impact-stable' &&
    critical.after.hasCanvas &&
    critical.after.hasUltraImpactScene &&
    critical.after.impactText.toLowerCase().includes('falha critica') &&
    !critical.after.impactText.toLowerCase().includes('sucesso') &&
    critical.after.rollOutcome === 'critical' &&
    critical.after.rollTotal === '1' &&
    critical.after.rollWindowMinimized &&
    critical.after.imageComplete &&
    critical.after.imageNaturalWidth > 0 &&
    triumph.clicked &&
    triumph.observedImpact?.impactActive === 'triumph' &&
    triumph.after.frameAdvanced &&
    triumph.after.canvasMark === 'd20-impact-stable' &&
    triumph.after.hasCanvas &&
    triumph.after.hasUltraImpactScene &&
    triumph.after.impactText.toLowerCase().includes('sucesso critico') &&
    !triumph.after.impactText.toLowerCase().includes('falha') &&
    triumph.after.rollOutcome === 'triumph' &&
    triumph.after.rollTotal === '20' &&
    triumph.after.rollWindowMinimized &&
    triumph.after.imageComplete &&
    triumph.after.imageNaturalWidth > 0 &&
    actionableIssueEvents.length === 0

  const result = {
    actionableIssueEvents,
    before,
    critical,
    ignoredIssueEvents,
    issueEvents,
    rollWindowStateAudit,
    screenshotPath,
    stable,
    tabAudit,
    triumph,
  }
  console.log(JSON.stringify(result, null, 2))

  if (!stable) {
    throw new Error(`3D d20 impact smoke failed: ${JSON.stringify(result)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
