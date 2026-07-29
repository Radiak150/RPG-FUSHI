import { writeFile } from 'node:fs/promises'
import { openGmTable } from './cdp-table-helpers.mjs'

const port = Number(process.argv[2] ?? 9352)
const screenshotPath =
  process.argv[3] ?? 'release/win-unpacked/smoke-combat-v2-lab.png'

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

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
      const request = pending.get(message.id)
      clearTimeout(request.timeoutId)
      pending.delete(message.id)

      if (message.error) request.reject(new Error(message.error.message))
      else request.resolve(message.result)
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

    if (message.method === 'Log.entryAdded' && message.params?.entry?.level === 'error') {
      issueEvents.push({
        method: message.method,
        text: message.params.entry.text,
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

      pending.set(id, { reject, resolve, timeoutId })
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

async function waitFor(send, expression, label, timeoutMs = 20_000) {
  const startedAt = Date.now()
  let lastValue = null

  while (Date.now() - startedAt < timeoutMs) {
    lastValue = await evaluate(send, `(${expression})()`)
    if (lastValue?.ready ?? lastValue === true) return lastValue
    await delay(200)
  }

  throw new Error(`Timeout aguardando ${label}: ${JSON.stringify(lastValue)}`)
}

async function seedCombatScene(send) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const result = await evaluate(
      send,
      `(() => {
        const desktop = window.fushiDesktop
        const workspace = desktop?.loadJson?.({ name: 'workspace', scope: 'app' })
        const campaignId = workspace?.campaigns?.activeCampaignId

        if (!desktop?.saveJson || !campaignId) {
          return { ready: false, hasDesktop: Boolean(desktop), campaignId: campaignId ?? '' }
        }

        const session = {
          broadcastEvents: [],
          currentSceneId: 'combat-v2-release-scene',
          initialSceneId: 'combat-v2-release-scene',
          logEntries: [],
          scenes: [
            {
              id: 'combat-v2-release-scene',
              mapId: 'planicie_caverna_nascimento',
              metadata: {},
              name: 'Combat V2 - smoke release',
              objects: [],
              tokens: [
                {
                  cell: { column: 7, row: 8 },
                  characterId: 'fragmento-p01',
                  color: '#8e6cff',
                  controladoPorJogadorId: 'player1',
                  id: 'combat-v2-fragmentado',
                  label: 'Fragmentado',
                  tokenKind: 'player_corpo',
                  visibility: 'public',
                },
                {
                  cell: { column: 11, row: 7 },
                  characterId: 'mob-lobo-cinzento-basico',
                  color: '#8f887e',
                  id: 'combat-v2-lobo-cinzento',
                  label: 'Lobo Cinzento',
                  mobId: 'mob-lobo-cinzento-basico',
                  tokenKind: 'mob',
                  visibility: 'public',
                },
                {
                  cell: { column: 12, row: 9 },
                  characterId: 'mob-lobo-fushi-marcado',
                  color: '#67b7a4',
                  id: 'combat-v2-lobo-marcado',
                  label: 'Lobo Marcado',
                  mobId: 'mob-lobo-fushi-marcado',
                  tokenKind: 'mob',
                  visibility: 'public',
                },
              ],
            },
          ],
          selectedTokenId: '',
          selectedTokenIds: [],
          version: 15,
        }
        const saved = desktop.saveJson({
          campaignId,
          data: session,
          name: 'session',
          scope: 'campaign',
        })

        return { campaignId, ready: saved === true }
      })()`,
    )

    if (result?.ready) return result
    await delay(200)
  }

  throw new Error('Nao foi possivel semear a cena isolada do Combat V2.')
}

async function main() {
  const targets = await fetchJson(`http://127.0.0.1:${port}/json`)
  const page = targets.find((target) => target.type === 'page') ?? targets[0]

  if (!page?.webSocketDebuggerUrl) {
    throw new Error('No debuggable Electron page found')
  }

  const { issueEvents, send, socket } = await connectCdp(page.webSocketDebuggerUrl)
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Page.enable')

  const seed = await seedCombatScene(send)
  await openGmTable(send, evaluate, delay)

  const toolsState = await evaluate(
    send,
    `(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const labButton = buttons.find(
        (button) => button.getAttribute('aria-label') === 'Laboratorio de combate',
      )

      if (labButton instanceof HTMLElement) return { labVisible: true, toolsClicked: false }
      const toolsButton = buttons.find(
        (button) => button.getAttribute('aria-label') === 'Abrir ferramentas',
      )
      if (!(toolsButton instanceof HTMLElement)) {
        return { labVisible: false, toolsClicked: false }
      }
      toolsButton.click()
      return { labVisible: false, toolsClicked: true }
    })()`,
  )

  if (!toolsState?.labVisible && !toolsState?.toolsClicked) {
    throw new Error('Rail de ferramentas do Mestre nao apareceu no release.')
  }

  await waitFor(
    send,
    `() => ({
      ready: Array.from(document.querySelectorAll('button')).some(
        (button) => button.getAttribute('aria-label') === 'Laboratorio de combate',
      ),
    })`,
    'botao do Laboratorio de Combate',
  )

  const openedLab = await evaluate(
    send,
    `(() => {
      const labButton = Array.from(document.querySelectorAll('button')).find(
        (button) => button.getAttribute('aria-label') === 'Laboratorio de combate',
      )
      if (!(labButton instanceof HTMLElement)) return false
      labButton.click()
      return true
    })()`,
  )

  if (!openedLab) throw new Error('Laboratorio de combate nao apareceu no release.')

  const before = await waitFor(
    send,
    `() => {
      const lab = document.querySelector('.combat-balance-lab')
      const candidates = document.querySelectorAll('.combat-balance-lab__candidate')
      return {
        ready: lab instanceof HTMLElement && candidates.length === 3,
        candidateCount: candidates.length,
        candidateTexts: Array.from(candidates).map((candidate) => candidate.innerText),
        text: lab instanceof HTMLElement ? lab.innerText.slice(0, 900) : '',
      }
    }`,
    'Laboratorio de Combate com tres tokens',
  )

  const selectedIterations = await evaluate(
    send,
    `(() => {
      const lab = document.querySelector('.combat-balance-lab')
      if (!(lab instanceof HTMLElement)) return false
      const buttons = Array.from(lab.querySelectorAll('button'))
      const iterations = buttons.find((button) => button.textContent?.trim() === '100')
      if (!(iterations instanceof HTMLElement)) return false
      iterations.click()
      return true
    })()`,
  )

  if (!selectedIterations) throw new Error('Controle de 100 iteracoes nao respondeu no release.')
  await waitFor(
    send,
    `() => {
      const button = Array.from(document.querySelectorAll('.combat-balance-lab button')).find(
        (candidate) => candidate.textContent?.trim() === '100',
      )
      return { ready: button?.getAttribute('aria-pressed') === 'true' }
    }`,
    'selecao de 100 iteracoes',
  )

  const simulated = await evaluate(
    send,
    `(() => {
      const simulate = Array.from(
        document.querySelectorAll('.combat-balance-lab button'),
      ).find((button) => button.textContent?.trim() === 'Simular cena')
      if (!(simulate instanceof HTMLElement)) return false
      simulate.click()
      return true
    })()`,
  )

  if (!simulated) throw new Error('Botao Simular cena nao respondeu no release.')

  const after = await waitFor(
    send,
    `() => {
      const lab = document.querySelector('.combat-balance-lab')
      const results = document.querySelector('.combat-balance-lab__results')
      const text = lab instanceof HTMLElement ? lab.innerText : ''
      return {
        ready: results instanceof HTMLElement,
        candidateCount: document.querySelectorAll('.combat-balance-lab__candidate').length,
        resultCount: document.querySelectorAll('.combat-balance-lab__team-result').length,
        hasBlock: /bloqueios/i.test(text),
        hasCrit: /criticos/i.test(text),
        hasDodge: /esquivas/i.test(text),
        hasIterationCount: /100 duelos simulados/i.test(text),
        hasV2Message: /CA passiva, Bloqueio por Fortitude e Esquiva por Reacao/i.test(text),
        text: text.slice(0, 1_400),
      }
    }`,
    'resultado do Laboratorio de Combate',
  )

  const screenshot = await send('Page.captureScreenshot', {
    captureBeyondViewport: false,
    format: 'png',
  })
  await writeFile(screenshotPath, Buffer.from(screenshot.data, 'base64'))
  socket.close()

  const stable =
    seed.ready === true &&
    before.candidateCount === 3 &&
    before.candidateTexts.some((text) => /Lobo Cinzento[\s\S]*8 Vida/i.test(text)) &&
    before.candidateTexts.some((text) => /Lobo Marcado por FUSHI[\s\S]*14 Vida/i.test(text)) &&
    after.candidateCount === 3 &&
    after.resultCount === 2 &&
    after.hasBlock &&
    after.hasCrit &&
    after.hasDodge &&
    after.hasIterationCount &&
    after.hasV2Message &&
    issueEvents.length === 0
  const result = {
    after,
    before,
    issueEvents,
    screenshotPath,
    seed,
    stable,
  }

  console.log(JSON.stringify(result, null, 2))

  if (!stable) {
    throw new Error(`Combat V2 release smoke failed: ${JSON.stringify(result)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
