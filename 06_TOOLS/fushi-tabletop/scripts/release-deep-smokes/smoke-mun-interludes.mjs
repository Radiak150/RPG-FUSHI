import childProcess from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { writeFile } from 'node:fs/promises'
import { openGmTable } from './cdp-table-helpers.mjs'

const require = createRequire(import.meta.url)
const ffmpegPath = require('ffmpeg-static')
const port = Number(process.argv[2] ?? 9391)
const screenshotPath =
  process.argv[3] ?? 'release/win-unpacked/smoke-mun-interludes.png'
const libraryScreenshotPath = screenshotPath.replace(/\.png$/i, '-library.png')
const mediaScreenshotPath = screenshotPath.replace(/\.png$/i, '-media.png')
const mundiHubScreenshotPath = screenshotPath.replace(/\.png$/i, '-mundi-hub.png')
const prepareScreenshotPath = screenshotPath.replace(/\.png$/i, '-prepare-map.png')
const baseReleaseScreenshotPath = screenshotPath.replace(/\.png$/i, '-base-release.png')
const targetMapId = 'planicie_m5_s1_riacho_claro_nilo_liora'
const targetTransitionId = `interlude-map-${targetMapId}`
const targetMapName = 'M5-S1 - Riacho Claro: Nilo e Liora'
const prepareMapName = 'Riacho Claro'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function fetchJson(url, attempts = 50) {
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
  const networkFailures = []
  const networkRequestUrls = new Map()
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
        issueEvents.push({ method: message.method, text: entry.text })
      }
    }

    if (
      message.method === 'Network.responseReceived' &&
      message.params?.response?.status >= 400
    ) {
      networkFailures.push({
        status: message.params.response.status,
        url: message.params.response.url,
      })
    }

    if (message.method === 'Network.requestWillBeSent') {
      networkRequestUrls.set(
        message.params?.requestId,
        message.params?.request?.url ?? '',
      )
    }

    if (message.method === 'Network.loadingFailed') {
      networkFailures.push({
        errorText: message.params?.errorText ?? 'loading failed',
        url: networkRequestUrls.get(message.params?.requestId) ?? '',
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
      }, 30_000)

      pending.set(id, { resolve, reject, timeoutId })
    })
  }

  return { issueEvents, networkFailures, send, socket }
}

async function evaluate(send, expression) {
  const result = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression,
    returnByValue: true,
  })

  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ??
        result.exceptionDetails.text,
    )
  }

  return result.result?.value
}

async function getVisibleButtonCenter(send, predicateSource) {
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
      const predicate = ${predicateSource}
      const button = Array.from(document.querySelectorAll('button')).find(
        (candidate) => isVisible(candidate) && predicate(candidate),
      )
      if (!(button instanceof HTMLElement)) {
        return {
          found: false,
          visibleButtons: Array.from(document.querySelectorAll('button'))
            .filter(isVisible)
            .map((candidate) => ({
              ariaLabel: candidate.getAttribute('aria-label') ?? '',
              text: candidate.textContent?.trim() ?? '',
              title: candidate.title ?? '',
            }))
            .slice(0, 80),
        }
      }
      const rect = button.getBoundingClientRect()
      return {
        ariaLabel: button.getAttribute('aria-label') ?? '',
        found: true,
        text: button.textContent?.trim() ?? '',
        title: button.title ?? '',
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
    })()`,
  )
}

async function clickAt(send, x, y) {
  await send('Input.dispatchMouseEvent', {
    button: 'left',
    clickCount: 1,
    type: 'mouseMoved',
    x,
    y,
  })
  await send('Input.dispatchMouseEvent', {
    button: 'left',
    clickCount: 1,
    type: 'mousePressed',
    x,
    y,
  })
  await send('Input.dispatchMouseEvent', {
    button: 'left',
    clickCount: 1,
    type: 'mouseReleased',
    x,
    y,
  })
}

async function clickVisibleButton(send, predicateSource, label, timeoutMs = 5_000) {
  const startedAt = Date.now()
  let lastState = null

  while (Date.now() - startedAt < timeoutMs) {
    lastState = await getVisibleButtonCenter(send, predicateSource)

    if (lastState?.found) {
      await clickAt(send, lastState.x, lastState.y)
      return lastState
    }

    await delay(180)
  }

  throw new Error(`Botao ${label} nao ficou clicavel: ${JSON.stringify(lastState)}`)
}

async function waitFor(send, predicateSource, label, timeoutMs = 20_000) {
  const startedAt = Date.now()
  let lastValue = null

  while (Date.now() - startedAt < timeoutMs) {
    lastValue = await evaluate(
      send,
      `(() => {
        try {
          return (${predicateSource})()
        } catch (error) {
          return { error: error instanceof Error ? error.message : String(error) }
        }
      })()`,
    )

    if (lastValue === true || lastValue?.ready === true) {
      return lastValue
    }

    await delay(180)
  }

  throw new Error(`Timeout aguardando ${label}: ${JSON.stringify(lastValue)}`)
}

async function captureScreenshot(send, destinationPath) {
  const screenshot = await send('Page.captureScreenshot', {
    captureBeyondViewport: false,
    format: 'png',
  })

  await writeFile(destinationPath, Buffer.from(screenshot.data, 'base64'))
}

async function captureElementScreenshot(send, selector, destinationPath) {
  const rect = await evaluate(
    send,
    `(() => {
      const element = document.querySelector(${JSON.stringify(selector)})
      if (!(element instanceof HTMLElement)) return null
      const rect = element.getBoundingClientRect()
      return {
        height: rect.height,
        width: rect.width,
        x: rect.x,
        y: rect.y,
      }
    })()`,
  )

  assert(
    rect && rect.width > 200 && rect.height > 120,
    `Elemento sem area visual para screenshot: ${selector}`,
  )

  const screenshot = await send('Page.captureScreenshot', {
    captureBeyondViewport: false,
    clip: {
      height: rect.height,
      scale: 1,
      width: rect.width,
      x: rect.x,
      y: rect.y,
    },
    format: 'png',
  })

  await writeFile(destinationPath, Buffer.from(screenshot.data, 'base64'))
}

function probeRenderedImage(filePath) {
  const result = childProcess.spawnSync(
    ffmpegPath,
    [
      '-v',
      'error',
      '-i',
      filePath,
      '-vf',
      'scale=32:32:force_original_aspect_ratio=decrease,pad=32:32:(ow-iw)/2:(oh-ih)/2:black,format=gray',
      '-frames:v',
      '1',
      '-f',
      'rawvideo',
      'pipe:1',
    ],
    {
      encoding: null,
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
    },
  )
  const pixels = result.stdout ?? Buffer.alloc(0)

  assert(
    result.status === 0 && pixels.length === 32 * 32,
    `Nao foi possivel analisar os pixels renderizados: ${String(result.stderr ?? '').trim()}`,
  )

  const values = [...pixels]
  const mean = values.reduce((total, value) => total + value, 0) / values.length
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) /
    values.length
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const standardDeviation = Math.sqrt(variance)
  const nearBlack = mean < 7 && maximum < 22
  const visuallyEmpty =
    (maximum - minimum < 8 || standardDeviation < 2) &&
    (mean < 18 || mean > 237)

  return {
    maximum,
    mean: Number(mean.toFixed(2)),
    minimum,
    nearBlack,
    standardDeviation: Number(standardDeviation.toFixed(2)),
    visuallyEmpty,
  }
}

async function openMundiRiachoInterlude(send) {
  const toolsButtonPredicate = `(button) =>
    ['Abrir atalhos', 'Abrir ferramentas'].includes(button.getAttribute('aria-label') ?? '')`
  const worldButtonPredicate = `(button) =>
    button.textContent?.trim() === 'MUN' ||
    button.textContent?.trim() === 'Mapa Mundi' ||
    button.getAttribute('aria-label') === 'Abrir Mapa Mundi' ||
    button.getAttribute('aria-label') === 'Mapa Mundi' ||
    button.title === 'Mapa Mundi'`

  let worldButton = await getVisibleButtonCenter(send, worldButtonPredicate)
  if (!worldButton?.found) {
    await clickVisibleButton(send, toolsButtonPredicate, 'ferramentas do GM', 4_000)
    await delay(350)
    worldButton = await getVisibleButtonCenter(send, worldButtonPredicate)
    if (!worldButton?.found) {
      await evaluate(
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
          const button = Array.from(document.querySelectorAll('button')).find(
            (candidate) =>
              isVisible(candidate) &&
              ['Abrir atalhos', 'Abrir ferramentas'].includes(
                candidate.getAttribute('aria-label') ?? '',
              ),
          )
          if (button instanceof HTMLElement) {
            button.dispatchEvent(
              new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
            )
            return true
          }
          return false
        })()`,
      )
      await delay(350)
    }
    worldButton = await clickVisibleButton(send, worldButtonPredicate, 'Mapa Mundi', 5_000)
  } else {
    await clickAt(send, worldButton.x, worldButton.y)
  }

  await delay(500)
  await waitFor(
    send,
    `() => Boolean(document.querySelector('.world-mundi__map--world'))`,
    'mapa geral do MUN',
  )

  const enteredPlanicie = await evaluate(
    send,
    `(() => {
      const title = Array.from(document.querySelectorAll('.world-mundi__biome-region title')).find(
        (item) => /plan/i.test(item.textContent ?? ''),
      )
      const region = title?.parentElement
      if (!(region instanceof SVGElement)) return false
      region.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      return true
    })()`,
  )

  assert(enteredPlanicie, 'Bioma da Planicie nao foi encontrado no MUN.')
  await waitFor(
    send,
    `() => Boolean(document.querySelector('.world-mundi__map--biome'))`,
    'bioma da Planicie',
  )

  const openedVillage = await evaluate(
    send,
    `(() => {
      const marker = Array.from(document.querySelectorAll('.world-mundi__marker')).find(
        (item) =>
          (item.getAttribute('title') ?? '')
            .toLowerCase()
            .startsWith('vila do conhecimento absorvido |'),
      )
      if (!(marker instanceof HTMLElement)) return false
      marker.click()
      return true
    })()`,
  )

  assert(openedVillage, 'Vila do Conhecimento Absorvido nao foi encontrada na Planicie.')
  await waitFor(
    send,
    `() => {
      const hub = document.querySelector('.world-mundi__location-hub')
      return {
        ready:
          hub instanceof HTMLElement &&
          /Vila do Conhecimento Absorvido/i.test(hub.innerText) &&
          /M5-S1/i.test(hub.innerText),
      }
    }`,
    'hub da Vila com o submapa M5-S1 do Riacho Claro',
  )
  await captureScreenshot(send, mundiHubScreenshotPath)

  const returnedFromVillageToBiome = await evaluate(
    send,
    `(() => {
      const button = Array.from(document.querySelectorAll('button')).find(
        (item) => item.textContent?.trim() === 'Voltar',
      )
      if (!(button instanceof HTMLElement)) return false
      button.click()
      return true
    })()`,
  )

  assert(returnedFromVillageToBiome, 'Botao Voltar do hub da Vila nao foi encontrado.')
  await waitFor(
    send,
    `() => Boolean(document.querySelector('.world-mundi__map--biome'))`,
    'retorno ao mapa da Planicie apos conferir a Vila',
  )

  const openedRiacho = await evaluate(
    send,
    `(() => {
      const marker = Array.from(document.querySelectorAll('.world-mundi__marker')).find(
        (item) =>
          (item.getAttribute('title') ?? '')
            .toLowerCase()
            .startsWith('riacho claro |'),
      )
      if (!(marker instanceof HTMLElement)) return false
      marker.click()
      return true
    })()`,
  )

  assert(openedRiacho, 'Riacho Claro/M60 nao foi encontrado na Planicie.')
  await waitFor(
    send,
    `() => {
      const hub = document.querySelector('.world-mundi__location-hub')
      const text = hub instanceof HTMLElement ? hub.innerText : ''
      const activeRiachoMarker = Array.from(document.querySelectorAll('.world-mundi__marker--active')).some(
        (item) =>
          (item.getAttribute('title') ?? '')
            .toLowerCase()
            .startsWith('riacho claro |'),
      )
      return {
        ready:
          activeRiachoMarker &&
          (!(hub instanceof HTMLElement) || !/M5-S1/i.test(text)),
        hasHub: hub instanceof HTMLElement,
        text: text.slice(0, 1000),
      }
    }`,
    'Riacho/M60 selecionado sem o submapa M5-S1',
  )

  const returnedFromRiachoToBiome = await evaluate(
    send,
    `(() => {
      if (!document.querySelector('.world-mundi__location-hub')) return true
      const button = Array.from(document.querySelectorAll('button')).find(
        (item) => item.textContent?.trim() === 'Voltar',
      )
      if (!(button instanceof HTMLElement)) return false
      button.click()
      return true
    })()`,
  )

  assert(returnedFromRiachoToBiome, 'Botao Voltar do hub do Riacho/M60 nao foi encontrado.')
  await waitFor(
    send,
    `() => Boolean(document.querySelector('.world-mundi__map--biome'))`,
    'retorno ao mapa da Planicie apos conferir o Riacho/M60',
  )

  const reopenedVillage = await evaluate(
    send,
    `(() => {
      const marker = Array.from(document.querySelectorAll('.world-mundi__marker')).find(
        (item) =>
          (item.getAttribute('title') ?? '')
            .toLowerCase()
            .startsWith('vila do conhecimento absorvido |'),
      )
      if (!(marker instanceof HTMLElement)) return false
      marker.click()
      return true
    })()`,
  )

  assert(reopenedVillage, 'Vila nao foi reencontrada depois de conferir o Riacho/M60.')
  await waitFor(
    send,
    `() => {
      const hub = document.querySelector('.world-mundi__location-hub')
      return {
        ready:
          hub instanceof HTMLElement &&
          /Vila do Conhecimento Absorvido/i.test(hub.innerText) &&
          /M5-S1/i.test(hub.innerText),
      }
    }`,
    'hub da Vila com M5-S1 apos conferir que o Riacho/M60 nao contem esse submapa',
  )

  const openedSubmap = await evaluate(
    send,
    `(() => {
      const card = Array.from(document.querySelectorAll('.world-mundi__location-hub-card')).find(
        (item) => /M5-S1/i.test(item.textContent ?? ''),
      )
      const button = card
        ? Array.from(card.querySelectorAll('button')).find(
            (item) => item.textContent?.trim() === 'Abrir',
          )
        : null
      if (!(button instanceof HTMLElement)) return false
      button.click()
      return true
    })()`,
  )

  assert(openedSubmap, 'Botao Abrir do M5-S1 nao foi encontrado.')
}

async function assertTransitionLoaded(send, cycleLabel) {
  return waitFor(
    send,
    `() => {
      const overlay = document.querySelector('.tabletop-transition-overlay')
      const image = document.querySelector('.tabletop-transition-overlay__image')
      const fallbackImage = document.querySelector('.tabletop-transition-overlay__fallback-image')
      const activeImage =
        image instanceof HTMLImageElement
          ? image
          : fallbackImage instanceof HTMLImageElement
            ? fallbackImage
            : null
      const mediaFrame = document.querySelector('.tabletop-transition-overlay__media-frame')
      const frameStyle =
        mediaFrame instanceof HTMLElement ? getComputedStyle(mediaFrame) : null
      const rect = mediaFrame?.getBoundingClientRect()
      const src = activeImage?.getAttribute('src') ?? ''
      const centerElement = document.elementFromPoint(
        Math.floor(window.innerWidth / 2),
        Math.floor(window.innerHeight / 2),
      )

      return {
        ready:
          overlay instanceof HTMLElement &&
          !document.querySelector('.tabletop-readiness') &&
          activeImage instanceof HTMLImageElement &&
          activeImage.complete &&
          activeImage.naturalWidth > 0 &&
          activeImage.naturalHeight > 0 &&
          Boolean(rect && rect.width > 200 && rect.height > 120) &&
          frameStyle?.display !== 'none' &&
          Boolean(centerElement?.closest('.tabletop-transition-overlay')) &&
          !src.includes('./assets/'),
        hasFallback: Boolean(fallbackImage),
        naturalHeight: activeImage?.naturalHeight ?? 0,
        naturalWidth: activeImage?.naturalWidth ?? 0,
        src,
      }
    }`,
    `interludio carregado (${cycleLabel})`,
  )
}

async function skipTransitionAndAssertBoard(send, cycleLabel) {
  const skipped = await evaluate(
    send,
    `(() => {
      const button = Array.from(document.querySelectorAll('.tabletop-transition-overlay button')).find(
        (item) => item.textContent?.trim() === 'Pular',
      )
      if (!(button instanceof HTMLElement)) return false
      button.click()
      return true
    })()`,
  )

  assert(skipped, `Botao Pular ausente no ciclo ${cycleLabel}.`)
  await waitFor(
    send,
    `() => !document.querySelector('.tabletop-transition-overlay')`,
    `fechamento do interludio (${cycleLabel})`,
  )

  return waitFor(
    send,
    `() => {
      const boardImage = document.querySelector(
        '.tabletop-board__image[data-map-image-status="ready"]',
      )
      const bodyText = document.body.innerText
      return {
        ready:
          boardImage instanceof HTMLImageElement &&
          boardImage.complete &&
          boardImage.naturalWidth > 0 &&
          boardImage.naturalHeight > 0 &&
          boardImage.alt === ${JSON.stringify(targetMapName)} &&
          !document.querySelector('.route-error') &&
          !document.querySelector('.tabletop-readiness') &&
          !/Imagem do mapa indisponivel/i.test(bodyText),
        alt: boardImage?.getAttribute('alt') ?? '',
        naturalHeight: boardImage instanceof HTMLImageElement ? boardImage.naturalHeight : 0,
        naturalWidth: boardImage instanceof HTMLImageElement ? boardImage.naturalWidth : 0,
      }
    }`,
    `mapa M5-S1 pronto (${cycleLabel})`,
    30_000,
  )
}

async function openM5InterludeFromLibrary(send) {
  const opened = await evaluate(
    send,
    `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
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
      const poll = async (finder, timeoutMs = 12_000) => {
        const startedAt = Date.now()
        while (Date.now() - startedAt < timeoutMs) {
          const result = finder()
          if (result) return result
          await wait(120)
        }
        return null
      }
      const findVisibleButton = (predicate) =>
        Array.from(document.querySelectorAll('button')).find(
          (button) => isVisible(button) && predicate(button),
        )
      const findFolder = (text) =>
        Array.from(document.querySelectorAll('.tabletop-library-folder-card')).find(
          (item) =>
            isVisible(item) &&
            item.querySelector('strong')?.textContent?.trim() === text,
        )
      const openLibrary = async () => {
        for (let attempt = 0; attempt < 4; attempt += 1) {
          const existingTab = findVisibleButton(
            (button) => button.textContent?.trim() === 'INTERLUDIOS',
          )
          if (existingTab) return existingTab

          const toolsButton = findVisibleButton(
            (button) =>
              ['Abrir atalhos', 'Abrir ferramentas'].includes(
                button.getAttribute('aria-label') ?? '',
              ),
          )
          if (toolsButton) {
            toolsButton.click()
            await wait(220)
          }

          const mapsButton = await poll(
            () =>
              findVisibleButton(
                (button) =>
                  button.getAttribute('aria-label') === 'Mapas' ||
                  button.title === 'Mapas',
              ),
            2_000,
          )
          if (mapsButton) {
            mapsButton.click()
            const tab = await poll(
              () =>
                findVisibleButton(
                  (button) => button.textContent?.trim() === 'INTERLUDIOS',
                ),
              3_000,
            )
            if (tab) return tab
          }
        }
        return null
      }

      const transitionTab = await openLibrary()
      if (!(transitionTab instanceof HTMLElement)) {
        return {
          step: 'tab',
          visibleButtons: Array.from(document.querySelectorAll('button'))
            .filter(isVisible)
            .map((button) => ({
              ariaLabel: button.getAttribute('aria-label'),
              text: button.textContent?.trim(),
              title: button.title,
            }))
            .slice(0, 30),
        }
      }
      transitionTab.click()

      const munFolder = await poll(() => findFolder('MUN'))
      if (!(munFolder instanceof HTMLElement)) return { step: 'mun-folder' }
      munFolder.click()

      const planicieFolder = await poll(() =>
        Array.from(document.querySelectorAll('.tabletop-library-folder-card')).find(
          (item) => isVisible(item) && /Plan/i.test(item.textContent ?? ''),
        ),
      )
      if (!(planicieFolder instanceof HTMLElement)) return { step: 'biome-folder' }
      planicieFolder.click()

      const card = await poll(() =>
        Array.from(document.querySelectorAll('.tabletop-library-card')).find(
          (item) =>
            isVisible(item) &&
            item.textContent?.includes(${JSON.stringify(targetMapName)}) &&
            item.querySelector('button')?.closest('.tabletop-library-card'),
        ),
      )
      if (!(card instanceof HTMLElement)) return { step: 'transition-card' }
      const showButton = Array.from(card.querySelectorAll('button')).find(
        (item) => item.textContent?.trim() === 'Mostrar interludio',
      )
      if (!(showButton instanceof HTMLElement)) return { step: 'show-button' }
      showButton.click()
      return { step: 'done' }
    })()`,
  )

  assert(opened?.step === 'done', `Falha abrindo interludio pela biblioteca: ${JSON.stringify(opened)}`)
}

async function exerciseFolderOrganization(send) {
  const result = await evaluate(
    send,
    `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const setValue = (element, value) => {
        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(element),
          'value',
        )
        descriptor?.set?.call(element, value)
        element.dispatchEvent(new Event('input', { bubbles: true }))
        element.dispatchEvent(new Event('change', { bubbles: true }))
      }
      const clickButton = async (label, root = document) => {
        const button = Array.from(root.querySelectorAll('button')).find(
          (item) => item.textContent?.trim() === label,
        )
        if (!(button instanceof HTMLElement)) return false
        button.click()
        await wait(260)
        return true
      }
      const clickFolder = async (label) => {
        const folder = Array.from(
          document.querySelectorAll('.tabletop-library-folder-card'),
        ).find((item) => item.querySelector('strong')?.textContent?.trim() === label)
        if (!(folder instanceof HTMLElement)) return false
        folder.click()
        await wait(260)
        return true
      }
      const ensureTransitionsRoot = async () => {
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const transitionTab = Array.from(
            document.querySelectorAll('.tabletop-library-tabs__button'),
          ).find((item) => item.textContent?.trim() === 'INTERLUDIOS')
          if (!(transitionTab instanceof HTMLElement)) return false
          if (!transitionTab.classList.contains('tabletop-library-tabs__button--active')) {
            transitionTab.click()
            await wait(160)
          }
          const rootButton = Array.from(
            document.querySelectorAll('.tabletop-library-breadcrumb__item'),
          ).find((item) => item.textContent?.trim() === 'Todas')
          if (rootButton instanceof HTMLElement) {
            rootButton.click()
            await wait(160)
          }
          if (
            transitionTab.classList.contains('tabletop-library-tabs__button--active') &&
            document.querySelector('input[placeholder="Nome da pasta"]')
          ) {
            return true
          }
        }
        return false
      }

      const toolsButton = Array.from(document.querySelectorAll('button')).find(
        (button) =>
          ['Abrir atalhos', 'Abrir ferramentas'].includes(
            button.getAttribute('aria-label') ?? '',
          ),
      )
      if (toolsButton instanceof HTMLElement) {
        toolsButton.click()
        await wait(220)
      }
      const mapsButton = Array.from(document.querySelectorAll('button')).find(
        (button) =>
          button.getAttribute('aria-label') === 'Mapas' ||
          button.title === 'Mapas',
      )
      if (!(mapsButton instanceof HTMLElement)) return { step: 'maps-tool' }
      mapsButton.click()
      await wait(380)
      if (!(await ensureTransitionsRoot())) return { step: 'tab' }
      const input = document.querySelector('input[placeholder="Nome da pasta"]')
      if (!(input instanceof HTMLInputElement)) return { step: 'folder-input' }
      setValue(input, 'Teste Riacho')
      if (!(await clickButton('+ Pasta'))) return { step: 'create-folder' }

      const newFolder = Array.from(document.querySelectorAll('.tabletop-library-folder-card')).find(
        (item) => item.textContent?.includes('Teste Riacho'),
      )
      if (!(newFolder instanceof HTMLElement)) {
        return {
          step: 'folder-card',
          inputValue: input.value,
          folderTexts: Array.from(
            document.querySelectorAll('.tabletop-library-folder-card'),
          ).map((item) => item.textContent?.trim()).slice(0, 12),
          tabTexts: Array.from(document.querySelectorAll('.tabletop-library-tabs__button')).map(
            (item) => ({
              active: item.classList.contains('tabletop-library-tabs__button--active'),
              text: item.textContent?.trim(),
            }),
          ),
        }
      }
      const newFolderId = Array.from(document.querySelectorAll('.tabletop-library-folder-card'))
        .indexOf(newFolder)

      if (!(await clickFolder('MUN'))) return { step: 'mun-folder' }
      const planicieFolder = Array.from(document.querySelectorAll('.tabletop-library-folder-card')).find(
        (item) => /Plan/i.test(item.textContent ?? ''),
      )
      if (!(planicieFolder instanceof HTMLElement)) return { step: 'planicie-folder' }
      planicieFolder.click()
      await wait(280)

      const card = Array.from(document.querySelectorAll('.tabletop-library-card')).find(
        (item) => item.textContent?.includes(${JSON.stringify(targetMapName)}),
      )
      if (!(card instanceof HTMLElement)) return { step: 'm5-card' }
      const dragData = new DataTransfer()
      card.dispatchEvent(
        new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dragData,
        }),
      )
      await wait(180)
      const dock = document.querySelector('.tabletop-library-drop-dock')
      const dockTarget = dock
        ? Array.from(dock.querySelectorAll('button')).find(
            (item) => item.textContent?.trim() === 'Teste Riacho',
          )
        : null
      if (!(dockTarget instanceof HTMLElement)) return { step: 'drop-dock' }
      dockTarget.dispatchEvent(
        new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dragData,
        }),
      )
      dockTarget.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dragData,
        }),
      )
      card.dispatchEvent(
        new DragEvent('dragend', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dragData,
        }),
      )
      await wait(320)

      await clickButton('Todas')
      const movedFolder = Array.from(document.querySelectorAll('.tabletop-library-folder-card')).find(
        (item) => item.textContent?.includes('Teste Riacho'),
      )
      if (!(movedFolder instanceof HTMLElement)) return { step: 'moved-folder' }
      movedFolder.click()
      await wait(260)
      const movedCard = Array.from(document.querySelectorAll('.tabletop-library-card')).find(
        (item) => item.textContent?.includes(${JSON.stringify(targetMapName)}),
      )
      if (!(movedCard instanceof HTMLElement)) return { step: 'moved-card' }

      const backButton = Array.from(document.querySelectorAll('.tabletop-library-folder-card')).find(
        (item) => item.textContent?.includes('Voltar'),
      )
      if (!(backButton instanceof HTMLElement)) return { step: 'back-folder' }
      backButton.click()
      await wait(240)
      const folderForRename = Array.from(document.querySelectorAll('.tabletop-library-folder-card')).find(
        (item) => item.textContent?.includes('Teste Riacho'),
      )
      if (!(folderForRename instanceof HTMLElement)) return { step: 'rename-folder' }
      if (!(await clickButton('Nome', folderForRename))) return { step: 'rename-button' }
      const renameInput = folderForRename.querySelector('input')
      if (!(renameInput instanceof HTMLInputElement)) return { step: 'rename-input' }
      setValue(renameInput, 'Sessao Riacho')
      if (!(await clickButton('Salvar', folderForRename))) return { step: 'rename-save' }

      const renamedFolder = Array.from(document.querySelectorAll('.tabletop-library-folder-card')).find(
        (item) => item.textContent?.includes('Sessao Riacho'),
      )
      if (!(renamedFolder instanceof HTMLElement)) return { step: 'renamed-folder' }
      window.confirm = () => true
      if (!(await clickButton('Excluir', renamedFolder))) return { step: 'delete-folder' }
      await wait(320)

      const folderStillExists = Array.from(document.querySelectorAll('.tabletop-library-folder-card')).some(
        (item) => item.textContent?.includes('Sessao Riacho'),
      )
      if (!(await clickFolder('MUN'))) return { step: 'restored-mun-folder' }
      const restoredPlanicieFolder = Array.from(
        document.querySelectorAll('.tabletop-library-folder-card'),
      ).find((item) => /Plan/i.test(item.textContent ?? ''))
      if (!(restoredPlanicieFolder instanceof HTMLElement)) {
        return { step: 'restored-planicie-folder' }
      }
      restoredPlanicieFolder.click()
      await wait(260)
      const restoredCard = Array.from(document.querySelectorAll('.tabletop-library-card')).find(
        (item) => item.textContent?.includes(${JSON.stringify(targetMapName)}),
      )

      return {
        step: 'done',
        folderStillExists,
        hasRestoredCard: restoredCard instanceof HTMLElement,
        newFolderId,
      }
    })()`,
  )

  assert(result?.step === 'done', `Falha na organizacao de pastas: ${JSON.stringify(result)}`)
  assert(result.folderStillExists === false, 'Pasta excluida continuou visivel.')
  assert(
    result.hasRestoredCard === true,
    'Conteudo da pasta excluida nao voltou para o agrupamento automatico.',
  )

  return result
}

async function exerciseBaseRelease(send) {
  const result = await evaluate(
    send,
    `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
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
      const findVisibleButton = (predicate) =>
        Array.from(document.querySelectorAll('button')).find(
          (button) => isVisible(button) && predicate(button),
        )
      const clickTools = async () => {
        const toolsButton = findVisibleButton(
          (button) =>
            ['Abrir atalhos', 'Abrir ferramentas'].includes(
              button.getAttribute('aria-label') ?? '',
            ),
        )
        if (toolsButton instanceof HTMLElement) {
          toolsButton.click()
          await wait(220)
        }
      }

      await clickTools()
      const worldButton = findVisibleButton(
        (button) =>
          button.getAttribute('aria-label') === 'Abrir Mapa Mundi' ||
          button.getAttribute('aria-label') === 'Mapa Mundi' ||
          button.title === 'Mapa Mundi',
      )
      if (!(worldButton instanceof HTMLElement)) return { step: 'world-button' }
      worldButton.click()
      await wait(500)

      const baseTab = findVisibleButton((button) => button.textContent?.trim() === 'Base')
      if (!(baseTab instanceof HTMLElement)) {
        return {
          step: 'base-tab',
          visibleButtons: Array.from(document.querySelectorAll('button'))
            .filter(isVisible)
            .map((button) => button.textContent?.trim())
            .slice(0, 40),
        }
      }
      baseTab.click()
      await wait(420)

      const releaseButton = findVisibleButton(
        (button) => button.textContent?.trim() === 'Liberar BASE para jogadores',
      )
      if (releaseButton instanceof HTMLElement) {
        releaseButton.click()
        await wait(520)
      }

      const bodyText = document.body.innerText
      return {
        bodyText: bodyText.slice(0, 1200),
        hasBaseReleased:
          /BASE liberada para jogadores/i.test(bodyText) ||
          Boolean(
            findVisibleButton(
              (button) => button.textContent?.trim() === 'Ocultar BASE dos jogadores',
            ),
          ),
        hasReadiness: Boolean(document.querySelector('.tabletop-readiness')),
        hasRouteError: Boolean(document.querySelector('.route-error')),
        step: 'done',
      }
    })()`,
  )

  assert(result?.step === 'done', `Falha abrindo/liberando BASE no MUN: ${JSON.stringify(result)}`)
  assert(result.hasBaseReleased === true, 'BASE nao ficou marcada como liberada na UI do mestre.')
  assert(result.hasReadiness === false, 'Liberar BASE reabriu readiness da mesa.')
  assert(result.hasRouteError === false, 'Liberar BASE terminou em tela de recuperacao.')
  await captureScreenshot(send, baseReleaseScreenshotPath)

  return result
}

async function exercisePrepareMapForGm(send) {
  const result = await evaluate(
    send,
    `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
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
      const findVisibleButton = (predicate) =>
        Array.from(document.querySelectorAll('button')).find(
          (button) => isVisible(button) && predicate(button),
        )
      const clickTools = async () => {
        const toolsButton = findVisibleButton(
          (button) =>
            ['Abrir atalhos', 'Abrir ferramentas'].includes(
              button.getAttribute('aria-label') ?? '',
            ),
        )
        if (toolsButton instanceof HTMLElement) {
          toolsButton.click()
          await wait(220)
        }
      }
      const openMapLibrary = async () => {
        await clickTools()
        const mapsButton = findVisibleButton(
          (button) =>
            button.getAttribute('aria-label') === 'Mapas' ||
            button.title === 'Mapas',
        )
        if (!(mapsButton instanceof HTMLElement)) return false
        mapsButton.click()
        await wait(420)
        return true
      }
      const waitForBoardMap = async (expectedAlt, timeoutMs = 12_000) => {
        const startedAt = Date.now()
        let lastState = null
        while (Date.now() - startedAt < timeoutMs) {
          const image = document.querySelector(
            '.tabletop-board__image[data-map-image-status="ready"]',
          )
          const topbarText = document.querySelector('.tabletop-toolbar')?.textContent ?? ''
          lastState = {
            alt: image instanceof HTMLImageElement ? image.alt : '',
            complete: image instanceof HTMLImageElement ? image.complete : false,
            naturalHeight: image instanceof HTMLImageElement ? image.naturalHeight : 0,
            naturalWidth: image instanceof HTMLImageElement ? image.naturalWidth : 0,
            topbarText,
          }
          if (
            lastState.alt === expectedAlt &&
            lastState.complete &&
            lastState.naturalWidth > 0 &&
            lastState.naturalHeight > 0
          ) {
            return { ready: true, ...lastState }
          }
          await wait(160)
        }
        return { ready: false, ...lastState }
      }

      if (!(await openMapLibrary())) return { step: 'open-library' }

      const mapsTab = findVisibleButton((button) => button.textContent?.trim() === 'MAPAS')
      if (!(mapsTab instanceof HTMLElement)) return { step: 'maps-tab' }
      mapsTab.click()
      await wait(260)

      const rootButton = findVisibleButton((button) => button.textContent?.trim() === 'Todas')
      if (rootButton instanceof HTMLElement) {
        rootButton.click()
        await wait(180)
      }

      const planicieFolder = Array.from(
        document.querySelectorAll('.tabletop-library-folder-card'),
      ).find(
        (item) =>
          isVisible(item) &&
          /plan/i.test(item.querySelector('strong')?.textContent ?? item.textContent ?? ''),
      )
      if (!(planicieFolder instanceof HTMLElement)) {
        return {
          step: 'planicie-folder',
          folderTexts: Array.from(
            document.querySelectorAll('.tabletop-library-folder-card'),
          ).map((item) => item.textContent?.trim()).slice(0, 20),
        }
      }
      planicieFolder.click()
      await wait(360)

      const card = Array.from(document.querySelectorAll('.tabletop-library-card')).find(
        (item) =>
          isVisible(item) &&
          item.textContent?.includes(${JSON.stringify(prepareMapName)}) &&
          !item.textContent?.includes('M5-S1'),
      )
      if (!(card instanceof HTMLElement)) {
        return {
          step: 'map-card',
          cardTexts: Array.from(document.querySelectorAll('.tabletop-library-card'))
            .filter(isVisible)
            .map((item) => item.textContent?.trim())
            .slice(0, 20),
        }
      }
      const prepareButton = Array.from(card.querySelectorAll('button')).find(
        (button) => button.textContent?.trim() === 'Preparar mapa',
      )
      if (!(prepareButton instanceof HTMLElement)) return { step: 'prepare-button' }
      prepareButton.click()
      await wait(700)

      const preparedBoard = await waitForBoardMap(${JSON.stringify(prepareMapName)})
      if (!preparedBoard.ready) {
        return { step: 'prepared-board', preparedBoard }
      }

      if (!(await openMapLibrary())) return { step: 'reopen-library' }
      const returnButton = findVisibleButton(
        (button) => button.textContent?.trim() === 'Voltar ao mapa ativo dos jogadores',
      )
      if (!(returnButton instanceof HTMLElement)) return { step: 'return-button' }
      returnButton.click()
      await wait(500)
      const returnedBoard = await waitForBoardMap(${JSON.stringify(targetMapName)})

      return {
        hasReadiness: Boolean(document.querySelector('.tabletop-readiness')),
        hasRouteError: Boolean(document.querySelector('.route-error')),
        preparedBoard,
        returnedBoard,
        step: returnedBoard.ready ? 'done' : 'returned-board',
      }
    })()`,
  )

  assert(result?.step === 'done', `Falha no fluxo Preparar MAP: ${JSON.stringify(result)}`)
  assert(result.hasReadiness === false, 'Preparar MAP reabriu readiness indevidamente.')
  assert(result.hasRouteError === false, 'Preparar MAP terminou em tela de recuperacao.')
  await captureScreenshot(send, prepareScreenshotPath)

  return result
}

async function main() {
  const targets = await fetchJson(`http://127.0.0.1:${port}/json`)
  const page = targets.find((target) => target.type === 'page') ?? targets[0]

  if (!page?.webSocketDebuggerUrl) {
    throw new Error('No debuggable Electron page found')
  }

  const { issueEvents, networkFailures, send, socket } = await connectCdp(
    page.webSocketDebuggerUrl,
  )
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Network.enable')
  await send('Page.enable')
  await send('Input.setIgnoreInputEvents', { ignore: false })

  try {
    await openGmTable(send, evaluate, delay)
    await openMundiRiachoInterlude(send)

    const cycles = []
    cycles.push({
      transition: await assertTransitionLoaded(send, 'MUN'),
      board: null,
    })
    await captureScreenshot(send, screenshotPath)
    await captureElementScreenshot(
      send,
      '.tabletop-transition-overlay__image, .tabletop-transition-overlay__fallback-image',
      mediaScreenshotPath,
    )
    const renderedImageProbe = probeRenderedImage(mediaScreenshotPath)
    assert(
      !renderedImageProbe.nearBlack && !renderedImageProbe.visuallyEmpty,
      `Interludio renderizou preto ou vazio: ${JSON.stringify(renderedImageProbe)}`,
    )
    cycles[0].board = await skipTransitionAndAssertBoard(send, 'MUN')

    for (let cycle = 1; cycle <= 4; cycle += 1) {
      await openM5InterludeFromLibrary(send)
      const transition = await assertTransitionLoaded(send, `biblioteca-${cycle}`)
      const board = await skipTransitionAndAssertBoard(send, `biblioteca-${cycle}`)
      cycles.push({ transition, board })
    }

    const folderOrganization = await exerciseFolderOrganization(send)
    await captureScreenshot(send, libraryScreenshotPath)
    const baseRelease = await exerciseBaseRelease(send)
    const prepareMap = await exercisePrepareMapForGm(send)

    const finalState = await evaluate(
      send,
      `(() => {
        const readyImage = document.querySelector(
          '.tabletop-board__image[data-map-image-status="ready"]',
        )
        const body = document.body
        const centerElement = document.elementFromPoint(
          Math.floor(window.innerWidth / 2),
          Math.floor(window.innerHeight / 2),
        )
        const centerColor = centerElement ? getComputedStyle(centerElement).backgroundColor : ''

        return {
          activeTransitionId: ${JSON.stringify(targetTransitionId)},
          bodyHeight: body.scrollHeight,
          bodyWidth: body.scrollWidth,
          centerColor,
          hasHorizontalOverflow: body.scrollWidth > window.innerWidth + 1,
          hasReadiness: Boolean(document.querySelector('.tabletop-readiness')),
          hasRouteError: Boolean(document.querySelector('.route-error')),
          mapAlt: readyImage?.getAttribute('alt') ?? '',
          mapNaturalWidth:
            readyImage instanceof HTMLImageElement ? readyImage.naturalWidth : 0,
          overlayVisible: Boolean(document.querySelector('.tabletop-transition-overlay')),
        }
      })()`,
    )

    const genericMissingResourceErrors = issueEvents.filter(
      (event) =>
        event.method === 'Log.entryAdded' &&
        /^Failed to load resource: the server responded with a status of 404/i.test(
          event.text ?? '',
        ),
    )
    const actionableIssueEvents = issueEvents.filter(
      (event) => !genericMissingResourceErrors.includes(event),
    )
    const targetNetworkFailures = networkFailures.filter((failure) =>
      String(failure.url ?? '').toLowerCase().includes('m5-s1_riacho_claro'),
    )

    assert(
      actionableIssueEvents.length === 0,
      `Erros de runtime: ${JSON.stringify(actionableIssueEvents)}`,
    )
    assert(
      genericMissingResourceErrors.length === 0,
      `Recursos ausentes no fluxo MUN/interludios: ${JSON.stringify(genericMissingResourceErrors)}`,
    )
    assert(
      networkFailures.length === 0,
      `Falhas de rede no fluxo MUN/interludios: ${JSON.stringify(networkFailures)}`,
    )
    assert(
      targetNetworkFailures.length === 0,
      `Falha de rede nos assets do M5-S1: ${JSON.stringify(targetNetworkFailures)}`,
    )
    assert(finalState.hasRouteError === false, 'Mesa terminou na tela de recuperacao.')
    assert(finalState.hasReadiness === false, 'Readiness reapareceu durante cliques de interludio.')
    assert(finalState.overlayVisible === false, 'Overlay ficou preso apos os ciclos.')
    assert(finalState.hasHorizontalOverflow === false, 'Biblioteca gerou overflow horizontal.')
    assert(finalState.mapAlt === targetMapName, 'Mapa final nao e o M5-S1.')
    assert(finalState.mapNaturalWidth > 0, 'Imagem final do mapa nao carregou.')

    console.log(
      JSON.stringify(
        {
          cycles,
          finalState,
          baseRelease,
          folderOrganization,
          genericMissingResourceErrors: genericMissingResourceErrors.length,
          issueEvents: actionableIssueEvents,
          baseReleaseScreenshotPath: path.resolve(baseReleaseScreenshotPath),
          libraryScreenshotPath: path.resolve(libraryScreenshotPath),
          mediaScreenshotPath: path.resolve(mediaScreenshotPath),
          mundiHubScreenshotPath: path.resolve(mundiHubScreenshotPath),
          networkFailures: networkFailures.length,
          prepareMap,
          prepareScreenshotPath: path.resolve(prepareScreenshotPath),
          renderedImageProbe,
          screenshotPath: path.resolve(screenshotPath),
          stable: true,
        },
        null,
        2,
      ),
    )
  } finally {
    socket.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
