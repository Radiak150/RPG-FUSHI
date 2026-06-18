const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { _electron: electron } = require('playwright')

const rootDir = path.resolve(__dirname, '..')
const defaultExecutablePath = path.join(rootDir, 'release', 'win-unpacked', 'RPG FUSHI.exe')
const preferenceKey = 'fushi-tabletop:product-preferences:v1'
const qualityModes = ['low', 'balanced', 'ultra']

function parseNumber(value, fallback, label) {
  if (value === undefined || value === '') {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} invalido: ${value}`)
  }

  return parsed
}

function parseArgs(argv) {
  const options = {
    executablePath: defaultExecutablePath,
    maxReadyMs: 60_000,
    maxThreeMs: 45_000,
    maxWorkingSetMiB: 2500,
    minFps: 15,
    qualities: qualityModes,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--exe') {
      options.executablePath = path.resolve(argv[index + 1] ?? '')
      index += 1
    } else if (arg.startsWith('--exe=')) {
      options.executablePath = path.resolve(arg.slice('--exe='.length))
    } else if (arg === '--quality') {
      options.qualities = parseQualities(argv[index + 1] ?? '')
      index += 1
    } else if (arg.startsWith('--quality=')) {
      options.qualities = parseQualities(arg.slice('--quality='.length))
    } else if (arg === '--max-ready-ms') {
      options.maxReadyMs = parseNumber(argv[index + 1], options.maxReadyMs, 'max-ready-ms')
      index += 1
    } else if (arg.startsWith('--max-ready-ms=')) {
      options.maxReadyMs = parseNumber(
        arg.slice('--max-ready-ms='.length),
        options.maxReadyMs,
        'max-ready-ms',
      )
    } else if (arg === '--max-3d-ms') {
      options.maxThreeMs = parseNumber(argv[index + 1], options.maxThreeMs, 'max-3d-ms')
      index += 1
    } else if (arg.startsWith('--max-3d-ms=')) {
      options.maxThreeMs = parseNumber(
        arg.slice('--max-3d-ms='.length),
        options.maxThreeMs,
        'max-3d-ms',
      )
    } else if (arg === '--max-working-set-mib') {
      options.maxWorkingSetMiB = parseNumber(
        argv[index + 1],
        options.maxWorkingSetMiB,
        'max-working-set-mib',
      )
      index += 1
    } else if (arg.startsWith('--max-working-set-mib=')) {
      options.maxWorkingSetMiB = parseNumber(
        arg.slice('--max-working-set-mib='.length),
        options.maxWorkingSetMiB,
        'max-working-set-mib',
      )
    } else if (arg === '--min-fps') {
      options.minFps = parseNumber(argv[index + 1], options.minFps, 'min-fps')
      index += 1
    } else if (arg.startsWith('--min-fps=')) {
      options.minFps = parseNumber(arg.slice('--min-fps='.length), options.minFps, 'min-fps')
    } else {
      throw new Error(`Argumento desconhecido: ${arg}`)
    }
  }

  return options
}

function parseQualities(value) {
  const parsed = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!parsed.length || parsed.some((item) => !qualityModes.includes(item))) {
    throw new Error(`quality invalido: ${value}`)
  }

  return parsed
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function removeTempDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
  } catch (error) {
    console.warn(`[perf:release] aviso: nao consegui remover temp ${dir}: ${error.message}`)
  }
}

function getProcessTreeWorkingSet(rootPid) {
  if (process.platform !== 'win32' || !rootPid) {
    return null
  }

  const script = `
$root = ${Number(rootPid)}
$all = Get-CimInstance Win32_Process
$ids = New-Object System.Collections.Generic.List[int]
$queue = New-Object System.Collections.Generic.Queue[int]
$queue.Enqueue($root)
while ($queue.Count -gt 0) {
  $id = $queue.Dequeue()
  if ($ids.Contains($id)) { continue }
  $ids.Add($id)
  foreach ($child in ($all | Where-Object { $_.ParentProcessId -eq $id })) {
    $queue.Enqueue([int]$child.ProcessId)
  }
}
$processes = foreach ($id in $ids) {
  Get-Process -Id $id -ErrorAction SilentlyContinue
}
$processes | Select-Object Id,ProcessName,WorkingSet64 | ConvertTo-Json -Compress
`

  try {
    const output = childProcess.execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
      {
        encoding: 'utf8',
        windowsHide: true,
      },
    )
    const parsed = output.trim() ? JSON.parse(output) : []
    const processes = Array.isArray(parsed) ? parsed : [parsed]
    const totalBytes = processes.reduce(
      (total, item) => total + (Number(item?.WorkingSet64) || 0),
      0,
    )

    return {
      processCount: processes.length,
      processes,
      totalBytes,
      totalMiB: Number((totalBytes / 1024 / 1024).toFixed(1)),
    }
  } catch (error) {
    return {
      error: error.message,
      processCount: 0,
      processes: [],
      totalBytes: 0,
      totalMiB: 0,
    }
  }
}

async function openGmTable(page, quality, maxReadyMs) {
  const entryStartedAt = Date.now()
  const timings = {
    attempts: 0,
    loginMs: 0,
    qualityAppliedMs: 0,
    readinessMs: 0,
    totalOpenMs: 0,
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    timings.attempts = attempt
    await page.evaluate(
      ({ preferenceKey, quality }) => {
        localStorage.setItem(
          preferenceKey,
          JSON.stringify({
            theme: 'obsidian',
            visualQuality: quality,
            showModuleDescriptions: false,
            showPerformanceOverlay: true,
          }),
        )
        location.hash = '#/jogar/mesa'
        location.reload()
      },
      { preferenceKey, quality },
    )

    await page.waitForLoadState('domcontentloaded').catch(() => {})
    const qualityReady = await page
      .waitForFunction(
        (expectedQuality) => document.documentElement.dataset.visualQuality === expectedQuality,
        quality,
        { timeout: 10_000 },
      )
      .then(() => true)
      .catch(() => false)

    if (qualityReady) {
      timings.qualityAppliedMs = Date.now() - entryStartedAt
      break
    }

    if (attempt === 3) {
      const state = await page.evaluate(() => ({
        bodyText: document.body.innerText.slice(0, 240),
        hash: location.hash,
        quality: document.documentElement.dataset.visualQuality ?? null,
        routeError: Boolean(document.querySelector('.route-error')),
      }))

      throw new Error(
        `Nao consegui aplicar visualQuality=${quality} no release: ${JSON.stringify(state)}`,
      )
    }
  }

  const loginStartedAt = Date.now()
  const passwordInput = page.locator('input[type="password"]').first()
  if (await passwordInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
    const gmButton = page
      .locator('button')
      .filter({ hasText: /Mestre|GM/ })
      .first()

    if (await gmButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await gmButton.click()
    }

    await passwordInput.fill('mestre1')
    await page.locator('button[type="submit"]').click()
  }
  timings.loginMs = Date.now() - loginStartedAt

  const readinessTrace = []
  let lastSignature = ''
  const readinessStartedAt = Date.now()

  while (Date.now() - readinessStartedAt <= maxReadyMs) {
    const state = await page.evaluate(() => {
      const image = document.querySelector('.tabletop-board__image')
      const readiness = document.querySelector('.tabletop-readiness')
      const items = Array.from(
        document.querySelectorAll('.tabletop-readiness__item'),
      ).map((item) => ({
        kind: item.querySelector('small')?.textContent?.trim() ?? '',
        label: item.querySelector('strong')?.textContent?.trim() ?? '',
        status:
          Array.from(item.classList)
            .find((className) => className.startsWith('tabletop-readiness__item--'))
            ?.replace('tabletop-readiness__item--', '') ?? '',
      }))

      return {
        imageReady: !image || (image.complete && image.naturalWidth > 0),
        items,
        phase:
          readiness?.querySelector('.tabletop-readiness__status span')?.textContent?.trim() ??
          '',
        progress:
          readiness?.querySelector('.tabletop-readiness__status strong')?.textContent?.trim() ??
          '',
        ready:
          Boolean(document.querySelector('.tabletop-screen')) &&
          !readiness &&
          Boolean(document.querySelector('.tabletop-board__stage')) &&
          (!image || (image.complete && image.naturalWidth > 0)),
      }
    })
    const signature = JSON.stringify({
      imageReady: state.imageReady,
      items: state.items,
      phase: state.phase,
      progress: state.progress,
      ready: state.ready,
    })

    if (signature !== lastSignature) {
      const now = Date.now()
      readinessTrace.push({
        elapsedMs: now - readinessStartedAt,
        totalElapsedMs: now - entryStartedAt,
        ...state,
      })
      lastSignature = signature
    }

    if (state.ready) {
      timings.readinessMs = Date.now() - readinessStartedAt
      timings.totalOpenMs = Date.now() - entryStartedAt
      return {
        readinessTrace,
        readyMs: timings.readinessMs,
        timings,
      }
    }

    await delay(100)
  }

  throw new Error(
    `Readiness excedeu ${maxReadyMs}ms: ${JSON.stringify({
      timings,
      trace: readinessTrace.slice(-5),
    })}`,
  )
}

async function activate3d(page, maxThreeMs) {
  const startedAt = Date.now()
  await ensureShortcutRail(page)
  const activation = await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.trim().includes('3D GM'),
    )
    const isActive =
      button?.classList.contains('is-active') ||
      button?.classList.contains('tabletop-escape--active') ||
      button?.getAttribute('aria-pressed') === 'true'

    if (button instanceof HTMLElement && !isActive) {
      button.click()
    }

    return {
      clicked: Boolean(button && !isActive),
      hadButton: Boolean(button),
      wasActive: Boolean(isActive),
    }
  })

  if (!activation.hadButton) {
    throw new Error('Botao 3D GM ausente no diagnostico de performance.')
  }

  await page.waitForFunction(
    () => Boolean(document.querySelector('.tabletop-board__free-3d-layer canvas')),
    null,
    { timeout: maxThreeMs },
  )
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
      const floorTexture = canvas?.dataset.floorTexture ?? ''

      return ['fallback', 'loaded', 'not-needed'].includes(floorTexture)
    },
    null,
    { timeout: maxThreeMs },
  )

  return Date.now() - startedAt
}

async function ensureShortcutRail(page) {
  const gm3dButton = page
    .locator('button')
    .filter({ hasText: '3D GM' })
    .first()

  if (await gm3dButton.isVisible({ timeout: 500 }).catch(() => false)) {
    return
  }

  const menuButton = page.getByRole('button', { name: 'Abrir menu superior' }).first()
  if (await menuButton.isVisible({ timeout: 500 }).catch(() => false)) {
    await menuButton.click()
    await page.waitForTimeout(180)
  }

  const shortcutsButton = page.getByRole('button', { name: 'Abrir atalhos' }).first()
  if (await shortcutsButton.isVisible({ timeout: 1500 }).catch(() => false)) {
    await shortcutsButton.click()
    await page.waitForTimeout(220)
  }
}

async function samplePageMetrics(page) {
  const firstFrame = await page.evaluate(
    () =>
      Number(
        document.querySelector('.tabletop-board__free-3d-layer canvas')?.dataset.renderFrame ??
          0,
      ),
  )
  await delay(2500)
  const secondFrame = await page.evaluate(
    () =>
      Number(
        document.querySelector('.tabletop-board__free-3d-layer canvas')?.dataset.renderFrame ??
          0,
      ),
  )

  return page.evaluate(
    ({ firstFrame, secondFrame }) => {
      const overlayText = Array.from(
        document.querySelectorAll('.tabletop-performance-overlay span'),
      ).map((element) => element.textContent?.trim() ?? '')
      const fpsText = overlayText[0] ?? ''
      const fps = Number.parseInt(fpsText, 10)
      const image = document.querySelector('.tabletop-board__image')
      const canvas = document.querySelector('.tabletop-board__free-3d-layer canvas')
      const memory = performance.memory
        ? {
            jsHeapLimitMiB: Number(
              (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1),
            ),
            totalJsHeapMiB: Number(
              (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1),
            ),
            usedJsHeapMiB: Number(
              (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1),
            ),
          }
        : null

      return {
        bodyText: document.body.innerText.slice(0, 240),
        canvas: canvas
          ? {
              cameraMode: canvas.dataset.cameraMode ?? null,
              floorTexture: canvas.dataset.floorTexture ?? null,
              height: canvas.height,
              renderFrame: Number(canvas.dataset.renderFrame ?? 0),
              waterSurface: canvas.dataset.waterSurface ?? null,
              width: canvas.width,
            }
          : null,
        dom: {
          canvases: document.querySelectorAll('canvas').length,
          floatingWindows: document.querySelectorAll('.floating-window').length,
          objects: document.querySelectorAll('.tabletop-object').length,
          tokens: document.querySelectorAll('.tabletop-token').length,
        },
        fps: Number.isFinite(fps) ? fps : 0,
        frameDelta: secondFrame - firstFrame,
        frameFpsApprox: Number(((secondFrame - firstFrame) / 2.5).toFixed(1)),
        hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
        hasReadinessGate: Boolean(document.querySelector('.tabletop-readiness')),
        hasRouteError: Boolean(document.querySelector('.route-error')),
        image: image
          ? {
              complete: image.complete,
              naturalHeight: image.naturalHeight,
              naturalWidth: image.naturalWidth,
            }
          : null,
        memory,
        overlayText,
      }
    },
    { firstFrame, secondFrame },
  )
}

async function measureQuality(quality, options, artifactDir) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), `fushi-perf-${quality}-userdata-`))
  const appDataDir = fs.mkdtempSync(path.join(os.tmpdir(), `fushi-perf-${quality}-appdata-`))
  const app = await electron.launch({
    executablePath: options.executablePath,
    args: [
      `--user-data-dir=${userDataDir}`,
      '--disable-gpu-sandbox',
      '--enable-precise-memory-info',
    ],
    env: {
      ...process.env,
      APPDATA: appDataDir,
      FUSHI_APPDATA_ROOT: appDataDir,
    },
  })

  try {
    const page = await app.firstWindow({ timeout: 30_000 })
    const issues = []
    const startedAt = Date.now()

    page.on('console', (message) => {
      if (message.type() === 'error') {
        issues.push({
          kind: 'console-error',
          text: message.text(),
        })
      }
    })
    page.on('pageerror', (error) => {
      issues.push({
        kind: 'page-error',
        text: error.stack || error.message,
      })
    })
    page.on('requestfailed', (request) => {
      const failure = request.failure()
      const url = request.url()

      if (url.startsWith('data:')) {
        return
      }

      issues.push({
        kind: 'request-failed',
        text: `${request.method()} ${url} -> ${failure?.errorText ?? 'unknown'}`,
      })
    })

    await page.waitForLoadState('domcontentloaded')
    const readiness = await openGmTable(page, quality, options.maxReadyMs)
    const readyMs = readiness.readyMs
    const threeMs = await activate3d(page, options.maxThreeMs)
    const pageMetrics = await samplePageMetrics(page)
    const processInfo = typeof app.process === 'function' ? app.process() : null
    const workingSet = getProcessTreeWorkingSet(processInfo?.pid)
    const screenshotPath = path.join(artifactDir, `${quality}.png`)
    await page.screenshot({ path: screenshotPath })
    pageMetrics.effectiveFps = Math.max(pageMetrics.fps, pageMetrics.frameFpsApprox)

    const failures = []

    if (readyMs > options.maxReadyMs) {
      failures.push(`readiness ${readyMs}ms > ${options.maxReadyMs}ms`)
    }
    if (threeMs > options.maxThreeMs) {
      failures.push(`3D readiness ${threeMs}ms > ${options.maxThreeMs}ms`)
    }
    if (pageMetrics.hasRouteError) {
      failures.push('route error visivel')
    }
    if (pageMetrics.hasHorizontalOverflow) {
      failures.push('overflow horizontal visivel')
    }
    if (pageMetrics.hasReadinessGate) {
      failures.push('readiness gate continuou aberto')
    }
    if (!pageMetrics.image || !pageMetrics.image.complete || pageMetrics.image.naturalWidth <= 0) {
      failures.push('mapa nao carregou imagem valida')
    }
    if (!pageMetrics.canvas || pageMetrics.canvas.width <= 0 || pageMetrics.canvas.height <= 0) {
      failures.push('canvas 3D ausente ou vazio')
    }
    if (pageMetrics.effectiveFps < options.minFps) {
      failures.push(`FPS efetivo ${pageMetrics.effectiveFps} < ${options.minFps}`)
    }
    if (workingSet?.totalMiB > options.maxWorkingSetMiB) {
      failures.push(
        `working set ${workingSet.totalMiB} MiB > ${options.maxWorkingSetMiB} MiB`,
      )
    }
    if (issues.length) {
      failures.push(`${issues.length} erro(s) de console/page/request`)
    }

    return {
      failures,
      issues,
      launchAndMeasureMs: Date.now() - startedAt,
      quality,
      readinessTrace: readiness.readinessTrace,
      readyMs,
      timings: readiness.timings,
      screenshotPath,
      stable: failures.length === 0,
      threeMs,
      metrics: pageMetrics,
      workingSet,
    }
  } finally {
    await app.close().catch(() => {})
    removeTempDir(appDataDir)
    removeTempDir(userDataDir)
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (!fs.existsSync(options.executablePath)) {
    throw new Error(`Release nao encontrada: ${options.executablePath}`)
  }

  const artifactDir = path.join(
    rootDir,
    '.codex-dev',
    'perf-release',
    new Date().toISOString().replace(/[:.]/g, '-'),
  )
  fs.mkdirSync(artifactDir, { recursive: true })

  const results = []
  console.log(`[perf:release] exe=${options.executablePath}`)
  console.log(`[perf:release] qualities=${options.qualities.join(',')} artifacts=${artifactDir}`)

  for (const quality of options.qualities) {
    console.log(`\n[perf:release] medindo ${quality}`)
    const result = await measureQuality(quality, options, artifactDir)
    results.push(result)
    console.log(
      `[perf:release] ${quality}: ready=${result.readyMs}ms totalOpen=${result.timings?.totalOpenMs ?? 'n/a'}ms 3d=${result.threeMs}ms fps=${result.metrics.effectiveFps} heap=${result.metrics.memory?.usedJsHeapMiB ?? 'n/a'}MiB workingSet=${result.workingSet?.totalMiB ?? 'n/a'}MiB stable=${result.stable}`,
    )

    if (result.failures.length) {
      console.log(`[perf:release] ${quality} falhas: ${result.failures.join('; ')}`)
    }
  }

  const summary = {
    budgets: {
      maxReadyMs: options.maxReadyMs,
      maxThreeMs: options.maxThreeMs,
      maxWorkingSetMiB: options.maxWorkingSetMiB,
      minFps: options.minFps,
    },
    executablePath: options.executablePath,
    results,
    stable: results.every((result) => result.stable),
  }
  const summaryPath = path.join(artifactDir, 'summary.json')
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')

  console.log(`\n[perf:release] summary=${path.relative(rootDir, summaryPath)}`)

  if (!summary.stable) {
    throw new Error('perf:release encontrou regressao de readiness/performance.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
