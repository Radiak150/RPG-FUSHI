const childProcess = require('node:child_process')
const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')
const defaultExecutablePath = path.join(rootDir, 'release', 'win-unpacked', 'RPG FUSHI.exe')

const smokeCases = [
  {
    name: 'mun-interludes',
    script: 'scripts/release-deep-smokes/smoke-mun-interludes.mjs',
    timeoutMs: 180_000,
    linkFullAssetLibrary: true,
    seedLegacyMundiTransition: true,
  },
  { name: '2d-token-drag', script: 'scripts/release-deep-smokes/smoke-2d-token-drag.mjs', timeoutMs: 120_000 },
  {
    name: '2d-spam-stability',
    script: 'scripts/release-deep-smokes/smoke-2d-spam-stability.mjs',
    timeoutMs: 120_000,
  },
  {
    name: 'readiness-stability',
    script: 'scripts/release-deep-smokes/smoke-readiness-stability.mjs',
    timeoutMs: 150_000,
  },
  {
    name: 'base-map-assets',
    script: 'scripts/release-deep-smokes/smoke-base-map-assets.mjs',
    timeoutMs: 90_000,
  },
  { name: '3d-wheel', script: 'scripts/release-deep-smokes/smoke-3d-wheel.mjs', timeoutMs: 120_000 },
  {
    name: '3d-editor-gizmo',
    script: 'scripts/release-deep-smokes/smoke-3d-editor-gizmo.mjs',
    timeoutMs: 150_000,
  },
  {
    name: '3d-d20-impact',
    script: 'scripts/release-deep-smokes/smoke-3d-d20-impact.mjs',
    timeoutMs: 180_000,
  },
  {
    name: 'object-vfx-layer',
    script: 'scripts/release-deep-smokes/smoke-object-vfx-layer.mjs',
    timeoutMs: 150_000,
  },
  {
    name: 'optional-glb-presets',
    script: 'scripts/release-deep-smokes/smoke-optional-glb-presets.mjs',
    timeoutMs: 150_000,
  },
  {
    name: 'dice-numbering',
    script: 'scripts/release-deep-smokes/smoke-dice-numbering.mjs',
    timeoutMs: 240_000,
  },
]

function parseArgs(argv) {
  const options = {
    executablePath: defaultExecutablePath,
    list: false,
    only: [],
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--list') {
      options.list = true
    } else if (arg === '--exe') {
      options.executablePath = path.resolve(argv[index + 1] ?? '')
      index += 1
    } else if (arg.startsWith('--exe=')) {
      options.executablePath = path.resolve(arg.slice('--exe='.length))
    } else if (arg === '--only') {
      options.only = (argv[index + 1] ?? '').split(',').map((value) => value.trim()).filter(Boolean)
      index += 1
    } else if (arg.startsWith('--only=')) {
      options.only = arg.slice('--only='.length).split(',').map((value) => value.trim()).filter(Boolean)
    } else {
      throw new Error(`Argumento desconhecido: ${arg}`)
    }
  }

  return options
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = http.createServer()

    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0

      server.close(() => resolve(port))
    })
  })
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readCdpTargets(port) {
  return new Promise((resolve, reject) => {
    const request = http.get(`http://127.0.0.1:${port}/json`, (response) => {
      let body = ''

      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        body += chunk
      })
      response.on('end', () => {
        if (response.statusCode !== 200) {
          reject(new Error(`CDP HTTP ${response.statusCode}: ${body.slice(0, 160)}`))
          return
        }

        try {
          resolve(JSON.parse(body))
        } catch (error) {
          reject(error)
        }
      })
    })

    request.once('error', reject)
    request.setTimeout(1_500, () => {
      request.destroy(new Error('Timeout lendo CDP /json'))
    })
  })
}

async function waitForCdp(port, appProcess, timeoutMs = 45_000) {
  const startedAt = Date.now()
  let lastError = null

  while (Date.now() - startedAt < timeoutMs) {
    if (appProcess.exitCode !== null) {
      throw new Error(`RPG FUSHI fechou antes do CDP abrir. exitCode=${appProcess.exitCode}`)
    }

    try {
      const targets = await readCdpTargets(port)

      if (Array.isArray(targets) && targets.some((target) => target.webSocketDebuggerUrl)) {
        return targets
      }
    } catch (error) {
      lastError = error
    }

    await delay(300)
  }

  throw new Error(`Timeout aguardando CDP na porta ${port}: ${lastError?.message ?? 'sem resposta'}`)
}

function killProcessTree(processToKill) {
  if (!processToKill?.pid || processToKill.exitCode !== null) {
    return
  }

  if (process.platform === 'win32') {
    childProcess.spawnSync('taskkill', ['/pid', String(processToKill.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    return
  }

  processToKill.kill('SIGTERM')
}

async function removeTempDir(dir) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
      return
    } catch (error) {
      if (attempt === 11) {
        console.warn(`[smoke:release:deep] aviso: nao consegui remover temp ${dir}: ${error.message}`)
        return
      }

      await delay(250)
    }
  }
}

function seedSmokeData(smoke, appDataDir) {
  const fushiRoot = path.join(appDataDir, 'FUSHI')
  const contentLibraryRoot = path.join(fushiRoot, 'library', 'assets')

  if (smoke.linkFullAssetLibrary) {
    const sourceAssetRoot = path.join(rootDir, 'public', 'assets')

    if (!fs.existsSync(sourceAssetRoot)) {
      throw new Error(`Biblioteca de assets ausente: ${sourceAssetRoot}`)
    }

    fs.mkdirSync(path.dirname(contentLibraryRoot), { recursive: true })
    fs.symlinkSync(
      sourceAssetRoot,
      contentLibraryRoot,
      process.platform === 'win32' ? 'junction' : 'dir',
    )
  } else {
    for (const relativeAssetPath of smoke.seedAssets ?? []) {
      const sourcePath = path.join(rootDir, 'public', 'assets', ...relativeAssetPath.split('/'))
      const targetPath = path.join(contentLibraryRoot, ...relativeAssetPath.split('/'))

      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Asset de seed ausente: ${sourcePath}`)
      }

      fs.mkdirSync(path.dirname(targetPath), { recursive: true })
      fs.copyFileSync(sourcePath, targetPath)
    }
  }

  if (!smoke.seedLegacyMundiTransition) {
    return
  }

  const relativeThumbnail =
    'maps/planicie/vila/exterior-grande/riacho-claro/submapas/M5-S1_riacho_claro_nilo_liora_topdown_thumb_640.jpg'
  const campaignDirectory = path.join(
    fushiRoot,
    'campaigns',
    'campaign-local-default',
  )
  const libraryPath = path.join(campaignDirectory, 'library.json')
  const libraryState = {
    version: 1,
    folders: [],
    itemFolders: {
      maps: {},
      transitions: {},
      music: {},
      npcs: {},
    },
    hiddenItems: {
      maps: {},
      transitions: {},
      music: {},
      npcs: {},
    },
    customMaps: [],
    customObjectPresets: [],
    customTransitions: [
      {
        id: 'interlude-map-planicie_m5_s1_riacho_claro_nilo_liora',
        name: 'Chegada - M5-S1 - Riacho Claro: Nilo e Liora',
        summary: 'Referencia legada usada para provar a normalizacao do runtime.',
        category: 'MUN',
        biomeId: 'planicie_floresta_inicial',
        toMapId: 'planicie_m5_s1_riacho_claro_nilo_liora',
        type: 'image',
        assetUrl: `./assets/${relativeThumbnail}`,
        thumbnailUrl: `./assets/${relativeThumbnail}`,
      },
    ],
    customMusicTracks: [],
    customAmbienceTracks: [],
    mapOverrides: {},
    favoriteTrackIds: [],
    favoritePresets: [],
    trackVolumes: {},
  }

  fs.mkdirSync(campaignDirectory, { recursive: true })
  fs.writeFileSync(libraryPath, `${JSON.stringify(libraryState, null, 2)}\n`)
}

function spawnNode(scriptPath, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(process.execPath, [scriptPath, ...args], {
      cwd: rootDir,
      env: process.env,
      stdio: 'inherit',
      windowsHide: true,
    })
    const timeoutId = setTimeout(() => {
      killProcessTree(child)
      reject(new Error(`Timeout executando ${path.basename(scriptPath)} depois de ${timeoutMs}ms`))
    }, timeoutMs)

    child.once('error', (error) => {
      clearTimeout(timeoutId)
      reject(error)
    })
    child.once('exit', (code, signal) => {
      clearTimeout(timeoutId)

      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${path.basename(scriptPath)} falhou com code=${code} signal=${signal ?? 'none'}`))
    })
  })
}

async function runSmokeCase(smoke, executablePath, artifactDir) {
  const port = await getFreePort()
  const appDataDir = fs.mkdtempSync(path.join(os.tmpdir(), `fushi-deep-${smoke.name}-appdata-`))
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), `fushi-deep-${smoke.name}-userdata-`))
  const screenshotPath = path.join(artifactDir, `${smoke.name}.png`)
  const scriptPath = path.join(rootDir, smoke.script)

  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Smoke CDP ausente: ${scriptPath}`)
  }

  seedSmokeData(smoke, appDataDir)

  console.log(`\n[smoke:release:deep] ${smoke.name} porta=${port}`)
  const appProcess = childProcess.spawn(
    executablePath,
    [`--remote-debugging-port=${port}`, `--user-data-dir=${userDataDir}`, '--disable-gpu-sandbox'],
    {
      cwd: rootDir,
      env: {
        ...process.env,
        APPDATA: appDataDir,
        FUSHI_APPDATA_ROOT: appDataDir,
      },
      stdio: 'ignore',
      windowsHide: true,
    },
  )

  try {
    await waitForCdp(port, appProcess)
    await spawnNode(scriptPath, [String(port), screenshotPath], smoke.timeoutMs)
    console.log(`[smoke:release:deep] ${smoke.name} ok -> ${path.relative(rootDir, screenshotPath)}`)
  } finally {
    killProcessTree(appProcess)
    await removeTempDir(appDataDir)
    await removeTempDir(userDataDir)
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.list) {
    console.log(smokeCases.map((smoke) => smoke.name).join('\n'))
    return
  }

  if (!fs.existsSync(options.executablePath)) {
    throw new Error(`Release nao encontrada: ${options.executablePath}`)
  }

  const selectedCases = options.only.length
    ? smokeCases.filter((smoke) => options.only.includes(smoke.name))
    : smokeCases

  const unknownCases = options.only.filter((name) => !smokeCases.some((smoke) => smoke.name === name))

  if (unknownCases.length) {
    throw new Error(`Smoke(s) desconhecido(s): ${unknownCases.join(', ')}`)
  }

  if (!selectedCases.length) {
    throw new Error('Nenhum smoke selecionado.')
  }

  const artifactDir = path.join(
    rootDir,
    '.codex-dev',
    'release-deep',
    new Date().toISOString().replace(/[:.]/g, '-'),
  )
  fs.mkdirSync(artifactDir, { recursive: true })

  console.log(`[smoke:release:deep] exe=${options.executablePath}`)
  console.log(`[smoke:release:deep] artifacts=${artifactDir}`)

  for (const smoke of selectedCases) {
    await runSmokeCase(smoke, options.executablePath, artifactDir)
  }

  console.log(`\nsmoke:release:deep ok (${selectedCases.length} smoke(s))`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
