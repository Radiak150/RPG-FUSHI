import { writeFile } from 'node:fs/promises'

const port = Number(process.argv[2] ?? 9391)
const screenshotPath =
  process.argv[3] ?? 'release/win-unpacked/smoke-base-map-assets.png'

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

  const result = await evaluate(
    send,
    `(async () => {
      const baseTopdown =
        'fushi-library://assets/_optimized/maps/base-upgrades/base_floresta_seiva/base_floresta_seiva_fase2_meio_construida_topdown.webp'
      const baseThumb =
        'fushi-library://assets/maps/base-upgrades/base_floresta_seiva/base_floresta_seiva_fase2_meio_construida_topdown_thumb_640.jpg'
      const manifestUrl =
        'fushi-library://assets/maps/base-upgrades/base-upgrades-manifest.json'

      const loadImage = (url) =>
        new Promise((resolve) => {
          const image = new Image()
          image.onload = () => {
            resolve({
              ok: true,
              naturalHeight: image.naturalHeight,
              naturalWidth: image.naturalWidth,
              url,
            })
          }
          image.onerror = () => resolve({ ok: false, naturalHeight: 0, naturalWidth: 0, url })
          image.src = url
        })

      const [topdownLoad, thumbLoad] = await Promise.all([
        loadImage(baseTopdown),
        loadImage(baseThumb),
      ])
      const manifestResponse = await fetch(manifestUrl)
      const manifest = manifestResponse.ok ? await manifestResponse.json() : []
      const entries = Array.isArray(manifest) ? manifest : []
      const seivaPhase2Entry =
        entries.find((entry) =>
          entry?.slug === 'base_floresta_seiva' &&
          entry?.phase === 'fase2_meio_construida' &&
          String(entry?.image ?? '').includes('base_floresta_seiva_fase2_meio_construida_topdown.png')
        ) ?? null

      return {
        appInfo: window.fushiDesktop?.getAppInfo?.() ?? null,
        assets: {
          manifest: window.fushiDesktop?.assetExists?.(manifestUrl) ?? null,
          topdown: window.fushiDesktop?.assetExists?.(baseTopdown) ?? null,
          thumb: window.fushiDesktop?.assetExists?.(baseThumb) ?? null,
        },
        hasDesktopAssetApi: typeof window.fushiDesktop?.assetExists === 'function',
        manifest: {
          entryCount: entries.length,
          ok: manifestResponse.ok,
          seivaPhase2Entry,
          status: manifestResponse.status,
        },
        topdownLoad,
        thumbLoad,
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
    result.hasDesktopAssetApi === true &&
    result.assets?.manifest === true &&
    result.assets?.topdown === true &&
    result.assets?.thumb === true &&
    result.manifest?.ok === true &&
    result.manifest?.entryCount >= 24 &&
    Boolean(result.manifest?.seivaPhase2Entry) &&
    result.topdownLoad?.ok === true &&
    result.topdownLoad?.naturalWidth > 0 &&
    result.topdownLoad?.naturalHeight > 0 &&
    result.thumbLoad?.ok === true &&
    result.thumbLoad?.naturalWidth > 0 &&
    result.thumbLoad?.naturalHeight > 0 &&
    issueEvents.length === 0

  const output = {
    issueEvents,
    result,
    screenshotPath,
    stable,
  }

  console.log(JSON.stringify(output, null, 2))

  if (!stable) {
    throw new Error(`base map assets smoke failed: ${JSON.stringify(output)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
