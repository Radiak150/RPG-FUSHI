const childProcess = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')
const smokeScript = path.join(rootDir, 'scripts', 'smoke-multiplayer.cjs')

function parsePositiveInteger(value, fallback, label) {
  if (value === undefined || value === '') {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} invalido: ${value}`)
  }

  return parsed
}

function parseArgs(argv) {
  const options = {
    delayMs: 250,
    loops: 5,
    timeoutMs: 90_000,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--loops') {
      options.loops = parsePositiveInteger(argv[index + 1], options.loops, 'loops')
      index += 1
    } else if (arg.startsWith('--loops=')) {
      options.loops = parsePositiveInteger(arg.slice('--loops='.length), options.loops, 'loops')
    } else if (arg === '--timeout-ms') {
      options.timeoutMs = parsePositiveInteger(argv[index + 1], options.timeoutMs, 'timeout-ms')
      index += 1
    } else if (arg.startsWith('--timeout-ms=')) {
      options.timeoutMs = parsePositiveInteger(
        arg.slice('--timeout-ms='.length),
        options.timeoutMs,
        'timeout-ms',
      )
    } else if (arg === '--delay-ms') {
      options.delayMs = parsePositiveInteger(argv[index + 1], options.delayMs, 'delay-ms')
      index += 1
    } else if (arg.startsWith('--delay-ms=')) {
      options.delayMs = parsePositiveInteger(
        arg.slice('--delay-ms='.length),
        options.delayMs,
        'delay-ms',
      )
    } else {
      throw new Error(`Argumento desconhecido: ${arg}`)
    }
  }

  return options
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

function runSmokeLoop(loopNumber, timeoutMs) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const child = childProcess.spawn(process.execPath, [smokeScript], {
      cwd: rootDir,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    const output = []
    const timeoutId = setTimeout(() => {
      killProcessTree(child)
      reject(new Error(`Loop ${loopNumber} excedeu timeout de ${timeoutMs}ms`))
    }, timeoutMs)

    child.stdout.on('data', (chunk) => {
      const text = String(chunk)
      output.push(text)
      process.stdout.write(text)
    })
    child.stderr.on('data', (chunk) => {
      const text = String(chunk)
      output.push(text)
      process.stderr.write(text)
    })
    child.once('error', (error) => {
      clearTimeout(timeoutId)
      reject(error)
    })
    child.once('exit', (code, signal) => {
      clearTimeout(timeoutId)
      const durationMs = Date.now() - startedAt

      if (code === 0) {
        resolve({
          durationMs,
          loop: loopNumber,
          ok: true,
        })
        return
      }

      reject(
        new Error(
          `Loop ${loopNumber} falhou com code=${code} signal=${signal ?? 'none'}\n${output
            .join('')
            .slice(-4000)}`,
        ),
      )
    })
  })
}

function getStats(results) {
  const durations = results.map((result) => result.durationMs)
  const totalDurationMs = durations.reduce((total, value) => total + value, 0)

  return {
    averageMs: Math.round(totalDurationMs / Math.max(1, durations.length)),
    maxMs: Math.max(...durations),
    minMs: Math.min(...durations),
    totalDurationMs,
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (!fs.existsSync(smokeScript)) {
    throw new Error(`Smoke multiplayer ausente: ${smokeScript}`)
  }

  const artifactDir = path.join(
    rootDir,
    '.codex-dev',
    'multiplayer-soak',
    new Date().toISOString().replace(/[:.]/g, '-'),
  )
  fs.mkdirSync(artifactDir, { recursive: true })

  const results = []
  console.log(
    `[smoke:multiplayer:soak] loops=${options.loops} timeoutMs=${options.timeoutMs} artifacts=${artifactDir}`,
  )

  for (let loop = 1; loop <= options.loops; loop += 1) {
    console.log(`\n[smoke:multiplayer:soak] loop ${loop}/${options.loops}`)
    results.push(await runSmokeLoop(loop, options.timeoutMs))

    if (loop < options.loops && options.delayMs > 0) {
      await delay(options.delayMs)
    }
  }

  const summary = {
    loops: options.loops,
    results,
    stable: results.length === options.loops && results.every((result) => result.ok),
    stats: getStats(results),
  }
  const summaryPath = path.join(artifactDir, 'summary.json')
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')

  console.log(
    `\nsmoke:multiplayer:soak ok (${summary.loops} loop(s), media ${summary.stats.averageMs}ms) -> ${path.relative(
      rootDir,
      summaryPath,
    )}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
