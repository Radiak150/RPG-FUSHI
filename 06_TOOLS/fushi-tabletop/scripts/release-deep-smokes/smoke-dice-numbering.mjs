import { writeFile } from 'node:fs/promises'
import { openGmTable } from './cdp-table-helpers.mjs'

const port = Number(process.argv[2] ?? 9373)
const screenshotPath =
  process.argv[3] ?? 'release/win-unpacked/smoke-dice-numbering.png'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const diceCooldownMs = 16_000
const rollCases = [
  { diceType: 2, expectedValue: 1, randomValue: 0 },
  { diceType: 4, expectedValue: 4, randomValue: 0.999999 },
  { diceType: 16, expectedValue: 1, randomValue: 0 },
  { diceType: 100, expectedValue: 100, randomValue: 0.999999 },
]

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

function expectedNotation(diceType, value) {
  if (![2, 4, 6, 8, 10, 12, 20, 100].includes(diceType)) {
    return ''
  }

  if (diceType === 2) {
    return ''
  }

  if (diceType === 100) {
    const tens = value >= 100 ? 100 : Math.floor((value % 100) / 10) * 10
    const ones = value % 10
    return `1d100@${tens === 0 ? 100 : tens}+1d10@${ones === 0 ? 10 : ones}`
  }

  return `1d${diceType}@${value}`
}

function expectedOutcome(diceType, value) {
  if (value === 1) return 'critical'
  if (value === diceType) return 'triumph'
  return 'normal'
}

async function rollDie(send, diceType, randomValue, expectedValue) {
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
          await wait(160)
        }
      }
      if (!document.querySelector('.tabletop-session-log__roller')) {
        const logButton = allButtons().find(
          (button) => button.getAttribute('aria-label') === 'Abrir chat, log e rolagem',
        )
        if (logButton instanceof HTMLElement) {
          logButton.click()
          await wait(220)
        }
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
      if (select instanceof HTMLSelectElement) setValue(select, '${diceType}')
      const inputs = Array.from(
        document.querySelectorAll('.tabletop-session-log__dice-builder input[type="number"]'),
      )
      if (inputs[0] instanceof HTMLInputElement) setValue(inputs[0], '1')
      if (inputs[1] instanceof HTMLInputElement) setValue(inputs[1], '0')
      await wait(80)

      const rollButton = allButtons().find(
        (button) => button.textContent?.trim() === 'Rolar publico',
      )
      if (!(rollButton instanceof HTMLElement)) {
        return { clicked: false, reason: 'missing-roll-button' }
      }

      const originalRandom = Math.random
      try {
        Math.random = () => ${randomValue}
        rollButton.click()
      } finally {
        Math.random = originalRandom
      }
      return { clicked: true }
    })()`,
  )

  if (!clickResult.clicked) {
    return { ...clickResult, diceType, expectedValue }
  }

  const settled = await waitFor(
    send,
    `(() => {
      const overlay = document.querySelector('.tabletop-dice-box-overlay--settled')
      if (!overlay) return null
      return {
        impactText: document.querySelector('.tabletop-dice-box-overlay__impact')?.textContent?.trim() ?? '',
        minimized: Boolean(document.querySelector('.floating-window--log.floating-window--minimized')),
        notation: overlay.dataset.rollPhysicsNotation ?? '',
        outcome: overlay.dataset.rollOutcome ?? '',
        total: overlay.dataset.rollTotal ?? '',
      }
    })()`,
    36,
    250,
  )

  await waitFor(
    send,
    `!document.querySelector('.tabletop-dice-box-overlay--active')`,
    24,
    250,
  )

  return {
    ...clickResult,
    diceType,
    expectedNotation: expectedNotation(diceType, expectedValue),
    expectedOutcome: expectedOutcome(diceType, expectedValue),
    expectedValue,
    settled,
  }
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

  await evaluate(
    send,
    `(() => {
      localStorage.setItem(
        'fushi-tabletop:product-preferences:v1',
        JSON.stringify({
          theme: 'obsidian',
          visualQuality: 'balanced',
          showModuleDescriptions: false,
        }),
      )
      if (document.documentElement.dataset.visualQuality !== 'balanced') location.reload()
      return location.href
    })()`,
  )
  await waitFor(send, `document.documentElement.dataset.visualQuality === 'balanced'`, 50, 240)
  await openGmTable(send, evaluate, delay)

  const results = []
  for (const rollCase of rollCases) {
    await delay(diceCooldownMs + 800)
    results.push(
      await rollDie(
        send,
        rollCase.diceType,
        rollCase.randomValue,
        rollCase.expectedValue,
      ),
    )
  }

  const chatAudit = await evaluate(
    send,
    `(() => {
      const chatFeedText = Array.from(
        document.querySelectorAll('.tabletop-session-log__feed-panel'),
      )
        .find((panel) => panel.textContent?.includes('Historico da conversa'))
        ?.textContent ?? ''
      return {
        hasSystemLogInChat:
          chatFeedText.includes('Cena entrou') ||
          chatFeedText.includes('Mapa na mesa') ||
          chatFeedText.includes('sistema'),
        text: chatFeedText,
      }
    })()`,
  )

  const screenshot = await send('Page.captureScreenshot', {
    captureBeyondViewport: false,
    format: 'png',
  })
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))
  socket.close()

  const failures = results.filter((result) => {
    const settled = result.settled
    return (
      !result.clicked ||
      !settled ||
      settled.total !== String(result.expectedValue) ||
      settled.outcome !== result.expectedOutcome ||
      settled.notation !== result.expectedNotation ||
      !settled.minimized
    )
  })

  const stable = failures.length === 0 && !chatAudit.hasSystemLogInChat && issueEvents.length === 0
  const summary = {
    chatAudit,
    failures,
    issueEvents,
    results,
    screenshotPath,
    stable,
  }

  console.log(JSON.stringify(summary, null, 2))

  if (!stable) {
    throw new Error(`Dice numbering smoke failed: ${JSON.stringify(summary)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
