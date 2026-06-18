const { spawn } = require('node:child_process')
const http = require('node:http')
const electronPath = require('electron')

const DEV_URL = 'http://127.0.0.1:5173'
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const isMultiWindow = process.argv.includes('--multi')
const useWindowsShell = process.platform === 'win32'
let viteProcess = null
let electronProcess = null
let isShuttingDown = false

function waitForServer(url, timeoutMs = 60000) {
  const startedAt = Date.now()

  return new Promise((resolve, reject) => {
    function attempt() {
      const request = http.get(url, (response) => {
        response.resume()
        resolve()
      })

      request.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Vite nao respondeu em ${url}.`))
          return
        }

        setTimeout(attempt, 450)
      })

      request.setTimeout(1200, () => {
        request.destroy()
      })
    }

    attempt()
  })
}

function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true

  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill()
  }

  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill()
  }

  process.exit(exitCode)
}

async function run() {
  const cwd = process.cwd()
  const viteArgs = ['run', 'dev', '--', '--host', '127.0.0.1']
  const electronCommand = useWindowsShell ? `"${electronPath}"` : electronPath

  console.log('[electron:dev] cwd:', cwd)
  console.log('[electron:dev] spawn Vite:', npmCommand, viteArgs.join(' '))

  viteProcess = spawn(npmCommand, viteArgs, {
    cwd,
    shell: useWindowsShell,
    stdio: 'inherit',
  })

  viteProcess.on('exit', (code) => {
    if (!isShuttingDown && code !== 0) {
      shutdown(code ?? 1)
    }
  })

  await waitForServer(DEV_URL)

  console.log('[electron:dev] spawn Electron:', electronCommand, '.')

  electronProcess = spawn(electronCommand, ['.'], {
    cwd,
    env: {
      ...process.env,
      ELECTRON_RENDERER_URL: DEV_URL,
      FUSHI_ELECTRON_MULTI: isMultiWindow ? '1' : '',
    },
    shell: useWindowsShell,
    stdio: 'inherit',
  })

  electronProcess.on('exit', (code) => {
    shutdown(code ?? 0)
  })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

run().catch((error) => {
  console.error(error)
  shutdown(1)
})
