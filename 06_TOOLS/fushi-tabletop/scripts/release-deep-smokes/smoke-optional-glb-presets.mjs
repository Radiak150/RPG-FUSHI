import { writeFile } from 'node:fs/promises'
import { openGmTable } from './cdp-table-helpers.mjs'

const port = Number(process.argv[2] ?? 9385)
const screenshotPath =
  process.argv[3] ?? 'release/win-unpacked/smoke-optional-glb-presets.png'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const coreGlbAssets = [
  '/assets/objects/3d/inbox-1k/stone_pack.glb',
  '/assets/objects/3d/inbox-1k/the_sword_in_the_stone.glb',
]
const optionalGlbAssets = [
  '/assets/objects/3d/inbox-1k/ship_pinnace.glb',
  '/assets/objects/3d/inbox-1k/corrupted_dark_forest_ent.glb',
  '/assets/objects/3d/inbox-1k/procedural_city_3.glb',
]
const corePresetNames = [
  'Pedra 3D Grande 1k',
  'Pedra Runica 1k',
  'Espada na Pedra 1k',
]
const optionalPresetNames = [
  'Navio Pinnace 1k',
  'Ent Corrompido 1k',
  'Cidade Procedural 1k',
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

  const audit = await evaluate(
    send,
    `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const coreGlbAssets = ${JSON.stringify(coreGlbAssets)}
      const optionalGlbAssets = ${JSON.stringify(optionalGlbAssets)}
      const corePresetNames = ${JSON.stringify(corePresetNames)}
      const optionalPresetNames = ${JSON.stringify(optionalPresetNames)}
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
      const assetExists = (url) => {
        try {
          return window.fushiDesktop?.assetExists?.(url) ?? null
        } catch (error) {
          return String(error?.message ?? error)
        }
      }

      await clickButton(
        (button) => button.getAttribute('aria-label') === 'Abrir menu superior',
        240,
      )
      await clickButton(
        (button) => button.getAttribute('aria-label') === 'Abrir atalhos',
        240,
      )
      await clickButton(
        (button) => button.getAttribute('aria-label') === 'Abrir ferramentas',
        280,
      )

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const opened = await clickButton(
          (button) => button.getAttribute('aria-label') === 'Objetos' || button.title === 'Objetos',
          320,
        )
        if (opened || document.querySelector('.tabletop-object-preset')) break
        await clickButton(
          (button) => button.getAttribute('aria-label') === 'Abrir ferramentas',
          220,
        )
        await wait(140)
      }

      for (let attempt = 0; attempt < 12; attempt += 1) {
        const objectTab = Array.from(document.querySelectorAll('.tabletop-object-library-tab')).find(
          (button) => button.textContent?.trim() === 'Objetos',
        )
        if (objectTab instanceof HTMLElement) {
          objectTab.click()
          await wait(180)
          break
        }
        if (document.querySelector('.tabletop-object-preset')) break
        await wait(160)
      }

      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (document.querySelector('.tabletop-object-preset')) break
        await wait(160)
      }

      const presetTexts = Array.from(document.querySelectorAll('.tabletop-object-preset')).map(
        (preset) => preset.textContent ?? '',
      )
      const coreAssets = Object.fromEntries(coreGlbAssets.map((url) => [url, assetExists(url)]))
      const optionalAssets = Object.fromEntries(optionalGlbAssets.map((url) => [url, assetExists(url)]))
      const presentCoreNames = corePresetNames.filter((name) =>
        presetTexts.some((text) => text.includes(name)),
      )
      const visibleOptionalNames = optionalPresetNames.filter((name) =>
        presetTexts.some((text) => text.includes(name)),
      )

      return {
        bodyText: document.body.innerText.slice(0, 240),
        coreAssets,
        hasDesktopAssetApi: typeof window.fushiDesktop?.assetExists === 'function',
        objectPanelOpen: Boolean(document.querySelector('.tabletop-object-preset-grid')),
        optionalAssets,
        presetCount: presetTexts.length,
        presetTexts,
        presentCoreNames,
        visibleOptionalNames,
      }
    })()`,
  )

  const screenshot = await send('Page.captureScreenshot', {
    captureBeyondViewport: false,
    format: 'png',
  })
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))
  socket.close()

  const coreAssetsPresent = Object.values(audit.coreAssets ?? {}).every((value) => value === true)
  const optionalAssetsOmitted = Object.values(audit.optionalAssets ?? {}).every(
    (value) => value === false,
  )
  const allCorePresetsVisible = audit.presentCoreNames?.length === corePresetNames.length
  const noOptionalPresetsVisible = audit.visibleOptionalNames?.length === 0
  const stable =
    audit.hasDesktopAssetApi &&
    audit.objectPanelOpen &&
    audit.presetCount >= corePresetNames.length &&
    coreAssetsPresent &&
    optionalAssetsOmitted &&
    allCorePresetsVisible &&
    noOptionalPresetsVisible &&
    issueEvents.length === 0

  const result = {
    audit,
    coreAssetsPresent,
    issueEvents,
    noOptionalPresetsVisible,
    optionalAssetsOmitted,
    screenshotPath,
    stable,
  }
  console.log(JSON.stringify(result, null, 2))

  if (!stable) {
    throw new Error(`Optional GLB preset smoke failed: ${JSON.stringify(result)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
