const { app, BrowserWindow, ipcMain, protocol, shell } = require('electron')
const { autoUpdater } = require('electron-updater')
const fs = require('node:fs')
const path = require('node:path')
const {
  getAppInfo,
  getStorageStatus,
  assetExists,
  loadBackups,
  loadJson,
  readAssetResponse,
  readRuntimeAssetResponse,
  saveAsset,
  saveBackups,
  saveJson,
} = require('./storage.cjs')
const { FushiMultiplayerServer } = require('./multiplayer-server.cjs')

const DEV_URL = process.env.ELECTRON_RENDERER_URL
const VALID_PROFILES = new Set(['gm', 'player1', 'player2', 'player3', 'player4', 'player5'])
const UPDATE_FEED_URL_ENV = 'FUSHI_UPDATE_FEED_URL'
const UPDATE_FEED_CONFIG_FILENAME = 'update-feed.json'
const AI_PROVIDER_CONFIG_FILENAME = 'ai-provider.json'
const PLACEHOLDER_UPDATE_FEED_PATTERN = /updates\.example\.invalid/i
const DEFAULT_AI_PROVIDER_CONFIG = {
  endpoint: 'http://127.0.0.1:11434',
  model: 'llama3.1:8b',
  provider: 'ollama',
  temperature: 0.2,
  timeoutMs: 90000,
}
const storageActivity = {
  lastLoadAt: null,
  lastSaveAt: null,
  lastOperation: null,
}
const updateState = {
  availableVersion: null,
  currentVersion: app.getVersion(),
  error: null,
  feedUrl: null,
  feedUrlSource: null,
  isPackaged: app.isPackaged,
  isFeedUrlInsecure: false,
  isSupported: process.platform === 'win32',
  message: 'Pronto para jogar.',
  percent: null,
  releaseDate: null,
  state: 'idle',
}
let multiplayerServer = null
let updaterInitialized = false
let updateCheckInFlight = null
let updateDownloadInFlight = null
const windowByLaunchKey = new Map()

protocol.registerSchemesAsPrivileged([
  {
    privileges: {
      bypassCSP: false,
      corsEnabled: true,
      secure: true,
      standard: true,
      stream: true,
      supportFetchAPI: true,
    },
    scheme: 'fushi-asset',
  },
  {
    privileges: {
      bypassCSP: false,
      corsEnabled: true,
      secure: true,
      standard: true,
      stream: true,
      supportFetchAPI: true,
    },
    scheme: 'fushi-library',
  },
])

function buildWindowUrl(profileId) {
  const hash = profileId && profileId !== 'gm' ? '/jogar/mesa' : '/'

  if (DEV_URL) {
    const url = new URL(DEV_URL)

    if (profileId) {
      url.searchParams.set('fushiProfile', profileId)
    }

    url.hash = hash
    return url.toString()
  }

  return null
}

function getProfileArg(argv) {
  const profileArg = argv.find((argument) => argument.startsWith('--fushi-profile='))
  const profileId = profileArg ? profileArg.split('=').slice(1).join('=').trim() : ''

  return VALID_PROFILES.has(profileId) ? profileId : ''
}

function shouldOpenMultiWindow(argv) {
  return process.env.FUSHI_ELECTRON_MULTI === '1' || argv.includes('--fushi-multi')
}

function getLaunchProfiles(argv = process.argv) {
  if (shouldOpenMultiWindow(argv)) {
    return ['gm', 'player1', 'player2']
  }

  const cliProfile = getProfileArg(argv)

  if (cliProfile) {
    return [cliProfile]
  }

  if (VALID_PROFILES.has(process.env.FUSHI_ELECTRON_PROFILE)) {
    return [process.env.FUSHI_ELECTRON_PROFILE]
  }

  return ['']
}

function getWindowLaunchKey(profileId) {
  return profileId || 'default'
}

function focusWindow(window) {
  if (window.isMinimized()) {
    window.restore()
  }

  window.show()
  window.focus()
}

function getUpdateStatus() {
  return {
    ...updateState,
    currentVersion: app.getVersion(),
    feedUrl: updateState.feedUrl,
    feedUrlSource: updateState.feedUrlSource,
    isPackaged: app.isPackaged,
    isFeedUrlInsecure: updateState.isFeedUrlInsecure,
    isSupported: updateState.isSupported,
  }
}

function broadcastUpdateStatus() {
  const status = getUpdateStatus()

  BrowserWindow.getAllWindows().forEach((window) => {
    if (window.webContents.isDestroyed()) {
      return
    }

    window.webContents.send('fushi-desktop:update-status-changed', status)
  })
}

function setUpdateState(patch) {
  Object.assign(updateState, patch)
  broadcastUpdateStatus()
}

function getUpdateFeedConfigPath() {
  return path.join(app.getPath('appData'), 'FUSHI', UPDATE_FEED_CONFIG_FILENAME)
}

function normalizeUpdateFeedUrl(value) {
  const rawUrl = String(value || '').trim()

  if (!rawUrl) {
    return ''
  }

  const parsedUrl = new URL(rawUrl)

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error('Use uma URL iniciada por http:// ou https://.')
  }

  parsedUrl.hash = ''
  return parsedUrl.toString().replace(/\/+$/, '')
}

function isInsecureUpdateFeedUrl(feedUrl) {
  if (!feedUrl) {
    return false
  }

  try {
    return new URL(feedUrl).protocol === 'http:'
  } catch (_error) {
    return false
  }
}

function readManualUpdateFeedUrl() {
  try {
    const parsedConfig = JSON.parse(fs.readFileSync(getUpdateFeedConfigPath(), 'utf8'))
    return normalizeUpdateFeedUrl(parsedConfig?.feedUrl)
  } catch (_error) {
    return ''
  }
}

function writeManualUpdateFeedUrl(feedUrl) {
  const configPath = getUpdateFeedConfigPath()

  if (!feedUrl) {
    fs.rmSync(configPath, { force: true })
    return
  }

  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        feedUrl,
        savedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  )
}

function getAiProviderConfigPath() {
  return path.join(app.getPath('appData'), 'FUSHI', AI_PROVIDER_CONFIG_FILENAME)
}

function normalizeOllamaEndpoint(value) {
  const rawUrl = String(value || DEFAULT_AI_PROVIDER_CONFIG.endpoint).trim()
  const parsedUrl = new URL(rawUrl)

  if (parsedUrl.protocol !== 'http:') {
    throw new Error('Ollama local deve usar http://127.0.0.1:11434 ou http://localhost:11434.')
  }

  const hostname = parsedUrl.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'

  if (!isLocalhost) {
    throw new Error('Por seguranca, o provedor Ollama so aceita endereco local.')
  }

  parsedUrl.hash = ''
  parsedUrl.search = ''
  return parsedUrl.toString().replace(/\/+$/, '')
}

function normalizeAiProviderConfig(input = {}) {
  const model = String(input.model || DEFAULT_AI_PROVIDER_CONFIG.model).trim()
  const temperature = Number(input.temperature ?? DEFAULT_AI_PROVIDER_CONFIG.temperature)
  const timeoutMs = Number(input.timeoutMs ?? DEFAULT_AI_PROVIDER_CONFIG.timeoutMs)

  return {
    endpoint: normalizeOllamaEndpoint(input.endpoint),
    model: model || DEFAULT_AI_PROVIDER_CONFIG.model,
    provider: 'ollama',
    temperature: Number.isFinite(temperature) ? Math.min(1, Math.max(0, temperature)) : 0.2,
    timeoutMs: Number.isFinite(timeoutMs) ? Math.min(180000, Math.max(10000, timeoutMs)) : 90000,
  }
}

function readAiProviderConfig() {
  try {
    const parsedConfig = JSON.parse(fs.readFileSync(getAiProviderConfigPath(), 'utf8'))
    return normalizeAiProviderConfig(parsedConfig)
  } catch (_error) {
    return { ...DEFAULT_AI_PROVIDER_CONFIG }
  }
}

function writeAiProviderConfig(input) {
  const nextConfig = normalizeAiProviderConfig(input)
  const configPath = getAiProviderConfigPath()

  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        ...nextConfig,
        savedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  )

  return nextConfig
}

function buildOllamaUrl(config, pathname) {
  const baseUrl = new URL(normalizeOllamaEndpoint(config.endpoint))
  baseUrl.pathname = pathname
  baseUrl.search = ''
  baseUrl.hash = ''
  return baseUrl.toString()
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function testOllamaConnection(inputConfig) {
  try {
    const config = normalizeAiProviderConfig(inputConfig || readAiProviderConfig())
    const response = await fetchWithTimeout(
      buildOllamaUrl(config, '/api/tags'),
      { method: 'GET' },
      Math.min(config.timeoutMs, 20000),
    )

    if (!response.ok) {
      return {
        error: `Ollama respondeu HTTP ${response.status}.`,
        ok: false,
      }
    }

    const payload = await response.json()
    const models = Array.isArray(payload?.models)
      ? payload.models.map((model) => String(model?.name || '')).filter(Boolean)
      : []

    return {
      config,
      models,
      ok: true,
    }
  } catch (error) {
    return {
      error:
        error?.name === 'AbortError'
          ? 'Ollama demorou para responder. Confira se ele esta aberto.'
          : error instanceof Error
            ? error.message
            : 'Nao foi possivel conectar ao Ollama.',
      ok: false,
    }
  }
}

async function runOllamaChat(request) {
  try {
    const config = normalizeAiProviderConfig(request?.config || readAiProviderConfig())
    const messages = Array.isArray(request?.messages) ? request.messages : []

    if (!messages.length) {
      return {
        error: 'Nenhuma mensagem enviada para a IA.',
        ok: false,
      }
    }

    const response = await fetchWithTimeout(
      buildOllamaUrl(config, '/api/chat'),
      {
        body: JSON.stringify({
          messages,
          model: config.model,
          options: {
            temperature: config.temperature,
          },
          stream: false,
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      },
      config.timeoutMs,
    )

    if (!response.ok) {
      return {
        error: `Ollama respondeu HTTP ${response.status}.`,
        ok: false,
      }
    }

    const payload = await response.json()
    const text = String(payload?.message?.content || payload?.response || '').trim()

    return {
      config,
      model: payload?.model || config.model,
      ok: Boolean(text),
      raw: payload,
      text,
      error: text ? null : 'Ollama respondeu sem texto.',
    }
  } catch (error) {
    return {
      error:
        error?.name === 'AbortError'
          ? 'Ollama demorou para responder. Tente um modelo menor ou aumente o tempo limite.'
          : error instanceof Error
            ? error.message
            : 'Falha ao chamar o Ollama.',
      ok: false,
    }
  }
}

function configureUpdateFeedUrl() {
  const envFeedUrl = process.env[UPDATE_FEED_URL_ENV]?.trim()
  const manualFeedUrl = readManualUpdateFeedUrl()
  let feedUrl = null
  let feedUrlSource = 'none'

  if (envFeedUrl) {
    try {
      feedUrl = normalizeUpdateFeedUrl(envFeedUrl)
      feedUrlSource = 'env'
    } catch (error) {
      updateState.error = error instanceof Error ? error.message : String(error)
      updateState.message = 'URL de update invalida.'
      updateState.state = 'error'
      feedUrl = null
      feedUrlSource = 'env'
    }
  } else if (manualFeedUrl) {
    feedUrl = manualFeedUrl
    feedUrlSource = 'manual'
  } else {
    try {
      const configuredFeedUrl = autoUpdater.getFeedURL() ?? ''
      feedUrl =
        /^https?:\/\//i.test(configuredFeedUrl) &&
        !/updates\.example\.invalid/i.test(configuredFeedUrl)
        ? normalizeUpdateFeedUrl(configuredFeedUrl)
        : null
      feedUrlSource = feedUrl ? 'build' : 'none'
    } catch (_error) {
      feedUrl = null
      feedUrlSource = 'none'
    }
  }

  if (feedUrl && feedUrlSource !== 'build') {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: feedUrl,
    })
  }

  updateState.feedUrlSource = feedUrlSource
  updateState.isFeedUrlInsecure = isInsecureUpdateFeedUrl(feedUrl)

  return feedUrl
}

function getUpdateDisabledMessage(feedUrl) {
  if (!updateState.isSupported) {
    return 'Updates automaticos estao preparados para Windows.'
  }

  if (!app.isPackaged) {
    return 'Updates automaticos ficam ativos somente na build instalada.'
  }

  if (!feedUrl || PLACEHOLDER_UPDATE_FEED_PATTERN.test(feedUrl)) {
    return `Canal de updates remoto ainda nao configurado.`
  }

  return ''
}

function resetUpdateRuntimeStatus(feedUrl, message) {
  updateCheckInFlight = null
  updateDownloadInFlight = null
  setUpdateState({
    availableVersion: null,
    error: null,
    feedUrl,
    message,
    percent: null,
    releaseDate: null,
    state: 'idle',
  })
}

function setManualUpdateFeedUrl(inputUrl) {
  try {
    const feedUrl = normalizeUpdateFeedUrl(inputUrl)
    writeManualUpdateFeedUrl(feedUrl)
    const activeFeedUrl = configureUpdateFeedUrl()
    const disabledMessage = getUpdateDisabledMessage(activeFeedUrl)

    if (disabledMessage) {
      setUpdateState({
        availableVersion: null,
        error: null,
        feedUrl: activeFeedUrl,
        message: disabledMessage,
        percent: null,
        releaseDate: null,
        state: 'disabled',
      })
      return getUpdateStatus()
    }

    resetUpdateRuntimeStatus(
      activeFeedUrl,
      activeFeedUrl ? 'Canal de updates salvo.' : 'Canal manual removido.',
    )
  } catch (error) {
    setUpdateState({
      error: error instanceof Error ? error.message : String(error),
      message: 'URL de update invalida.',
      percent: null,
      state: 'error',
    })
  }

  return getUpdateStatus()
}

function ensureUpdaterReady() {
  configureAutoUpdater()

  const feedUrl = configureUpdateFeedUrl()
  const disabledMessage = getUpdateDisabledMessage(feedUrl)

  updateState.feedUrl = feedUrl

  if (disabledMessage) {
    setUpdateState({
      error: null,
      feedUrl,
      message: disabledMessage,
      percent: null,
      state: 'disabled',
    })
    return false
  }

  return true
}

function configureAutoUpdater() {
  if (updaterInitialized) {
    return
  }

  updaterInitialized = true
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.allowPrerelease = true
  autoUpdater.disableWebInstaller = false

  autoUpdater.on('checking-for-update', () => {
    setUpdateState({
      error: null,
      message: 'Procurando atualizacao.',
      percent: null,
      state: 'checking',
    })
  })

  autoUpdater.on('update-available', (info) => {
    setUpdateState({
      availableVersion: info.version ?? null,
      error: null,
      message: info.version
        ? `Versao ${info.version} disponivel.`
        : 'Atualizacao disponivel.',
      percent: null,
      releaseDate: info.releaseDate ?? null,
      state: 'available',
    })
  })

  autoUpdater.on('update-not-available', () => {
    setUpdateState({
      availableVersion: null,
      error: null,
      message: 'Voce esta na versao mais recente.',
      percent: null,
      releaseDate: null,
      state: 'not-available',
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    setUpdateState({
      error: null,
      message: 'Baixando atualizacao.',
      percent: Number.isFinite(progress.percent) ? progress.percent : null,
      state: 'downloading',
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    setUpdateState({
      availableVersion: info.version ?? updateState.availableVersion,
      error: null,
      message: 'Atualizacao pronta para instalar.',
      percent: 100,
      releaseDate: info.releaseDate ?? updateState.releaseDate,
      state: 'downloaded',
    })
  })

  autoUpdater.on('error', (error) => {
    setUpdateState({
      error: error instanceof Error ? error.message : String(error),
      message: 'Nao foi possivel concluir a verificacao de update.',
      percent: null,
      state: 'error',
    })
  })
}

async function checkForFushiUpdates() {
  if (!ensureUpdaterReady()) {
    return getUpdateStatus()
  }

  if (updateCheckInFlight) {
    await updateCheckInFlight
    return getUpdateStatus()
  }

  updateCheckInFlight = autoUpdater
    .checkForUpdates()
    .catch((error) => {
      setUpdateState({
        error: error instanceof Error ? error.message : String(error),
        message: 'Nao foi possivel verificar updates.',
        percent: null,
        state: 'error',
      })
    })
    .finally(() => {
      updateCheckInFlight = null
    })

  await updateCheckInFlight
  return getUpdateStatus()
}

async function downloadFushiUpdate() {
  if (!ensureUpdaterReady()) {
    return getUpdateStatus()
  }

  if (updateDownloadInFlight) {
    await updateDownloadInFlight
    return getUpdateStatus()
  }

  updateDownloadInFlight = autoUpdater
    .downloadUpdate()
    .catch((error) => {
      setUpdateState({
        error: error instanceof Error ? error.message : String(error),
        message: 'Nao foi possivel baixar a atualizacao.',
        percent: null,
        state: 'error',
      })
    })
    .finally(() => {
      updateDownloadInFlight = null
    })

  await updateDownloadInFlight
  return getUpdateStatus()
}

function installFushiUpdate() {
  if (updateState.state !== 'downloaded') {
    return getUpdateStatus()
  }

  setUpdateState({
    message: 'Reiniciando para instalar.',
    state: 'installing',
  })
  autoUpdater.quitAndInstall(false, true)

  return getUpdateStatus()
}

function createWindow(profileId = '', index = 0) {
  const launchKey = getWindowLaunchKey(profileId)
  const existingWindow = windowByLaunchKey.get(launchKey)

  if (existingWindow && !existingWindow.isDestroyed()) {
    focusWindow(existingWindow)
    return existingWindow
  }

  const profileLabel = profileId ? ` - ${profileId}` : ''
  const mainWindow = new BrowserWindow({
    height: 900,
    minHeight: 720,
    minWidth: 1024,
    show: false,
    title: `RPG FUSHI${profileLabel}`,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true,
      webSecurity: true,
    },
    width: 1440,
    x: 80 + index * 42,
    y: 60 + index * 42,
  })

  mainWindow.setMenuBarVisibility(false)
  windowByLaunchKey.set(launchKey, mainWindow)
  mainWindow.on('closed', () => {
    if (windowByLaunchKey.get(launchKey) === mainWindow) {
      windowByLaunchKey.delete(launchKey)
    }
  })
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  const windowUrl = buildWindowUrl(profileId)

  if (windowUrl) {
    void mainWindow.loadURL(windowUrl)
    return mainWindow
  }

  void mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
    hash: profileId && profileId !== 'gm' ? '/jogar/mesa' : '/launcher',
    query: profileId ? { fushiProfile: profileId } : {},
  })

  return mainWindow
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const profiles = getLaunchProfiles(argv)

    profiles.forEach((profileId, index) => createWindow(profileId, index))
  })
}

function broadcastStorageChanged(sender, payload) {
  BrowserWindow.getAllWindows().forEach((window) => {
    if (window.webContents === sender || window.webContents.isDestroyed()) {
      return
    }

    window.webContents.send('fushi-desktop:storage-changed', {
      ...payload,
      receivedAt: new Date().toISOString(),
    })
  })
}

function notifyMultiplayerStorageChanged(payload) {
  multiplayerServer?.handleStorageChanged(payload)
}

ipcMain.on('fushi-desktop:get-app-info', (event) => {
  event.returnValue = getAppInfo(app)
})

ipcMain.on('fushi-desktop:load-json', (event, request) => {
  const result = loadJson(app, request)

  storageActivity.lastLoadAt = new Date().toISOString()
  storageActivity.lastOperation = `load:${request?.scope ?? 'app'}:${request?.name ?? 'unknown'}`
  event.returnValue = result
})

ipcMain.on('fushi-desktop:save-json', (event, request) => {
  const result = saveJson(app, request)

  if (result) {
    storageActivity.lastSaveAt = new Date().toISOString()
    storageActivity.lastOperation = `save:${request?.scope ?? 'app'}:${request?.name ?? 'unknown'}`
  }

  event.returnValue = result

  if (result) {
    const payload = {
      campaignId: request?.campaignId,
      name: request?.name,
      scope: request?.scope,
      type: 'json',
    }

    broadcastStorageChanged(event.sender, payload)
    notifyMultiplayerStorageChanged(payload)
  }
})

ipcMain.on('fushi-desktop:get-storage-status', (event, campaignId) => {
  event.returnValue = {
    ...getStorageStatus(app, campaignId),
    activity: storageActivity,
  }
})

ipcMain.on('fushi-desktop:load-backups', (event, campaignId) => {
  event.returnValue = loadBackups(app, campaignId)
})

ipcMain.on('fushi-desktop:save-backups', (event, request) => {
  const result = saveBackups(app, request)
  event.returnValue = result

  if (result) {
    const payload = {
      campaignId: request?.campaignId,
      name: 'backups',
      scope: 'campaign',
      type: 'backups',
    }

    broadcastStorageChanged(event.sender, payload)
    notifyMultiplayerStorageChanged(payload)
  }
})

ipcMain.on('fushi-desktop:open-data-folder', (event) => {
  event.returnValue = true
  void shell.openPath(getAppInfo(app).dataDir)
})

ipcMain.on('fushi-desktop:open-install-folder', (event) => {
  event.returnValue = true
  void shell.openPath(getAppInfo(app).installDir)
})

ipcMain.handle('fushi-desktop:open-external-url', (_event, inputUrl) => {
  try {
    const url = new URL(String(inputUrl || ''))

    if (url.protocol !== 'https:') {
      return false
    }

    void shell.openExternal(url.toString())
    return true
  } catch {
    return false
  }
})

ipcMain.handle('fushi-desktop:open-uninstall-settings', async () => {
  try {
    await shell.openExternal('ms-settings:appsfeatures')
    return true
  } catch {
    return false
  }
})

ipcMain.handle('fushi-desktop:update-get-status', () => {
  ensureUpdaterReady()
  return getUpdateStatus()
})

ipcMain.handle('fushi-desktop:update-set-feed-url', (_event, feedUrl) => setManualUpdateFeedUrl(feedUrl))

ipcMain.handle('fushi-desktop:update-check', () => checkForFushiUpdates())

ipcMain.handle('fushi-desktop:update-download', () => downloadFushiUpdate())

ipcMain.handle('fushi-desktop:update-install', () => installFushiUpdate())

ipcMain.handle('fushi-desktop:ai-get-config', () => readAiProviderConfig())

ipcMain.handle('fushi-desktop:ai-save-config', (_event, config) => {
  try {
    return {
      config: writeAiProviderConfig(config),
      ok: true,
    }
  } catch (error) {
    return {
      config: readAiProviderConfig(),
      error: error instanceof Error ? error.message : 'Nao foi possivel salvar IA.',
      ok: false,
    }
  }
})

ipcMain.handle('fushi-desktop:ai-test-ollama', (_event, config) => testOllamaConnection(config))

ipcMain.handle('fushi-desktop:ai-run-ollama-chat', (_event, request) => runOllamaChat(request))

ipcMain.on('fushi-desktop:asset-exists', (event, assetUrl) => {
  event.returnValue = assetExists(app, assetUrl)
})

ipcMain.on('fushi-desktop:save-asset', (event, request) => {
  const result = saveAsset(app, request)
  event.returnValue = result

  if (result?.ok) {
    const payload = {
      campaignId: request?.campaignId,
      name: 'assets',
      scope: 'campaign',
      type: 'asset',
    }

    broadcastStorageChanged(event.sender, payload)
    notifyMultiplayerStorageChanged(payload)
  }
})

ipcMain.handle('fushi-desktop:multiplayer-start-host', async (_event, request) => {
  try {
    if (multiplayerServer) {
      multiplayerServer.stop()
      multiplayerServer = null
    }

    const campaignId =
      typeof request?.campaignId === 'string' && request.campaignId.trim()
        ? request.campaignId.trim()
        : 'campaign-local-default'
    const requestedPort = Number.parseInt(String(request?.port ?? '3030'), 10)
    const port =
      Number.isInteger(requestedPort) && requestedPort >= 1024 && requestedPort <= 65535
        ? requestedPort
        : 3030
    const sessionCode =
      typeof request?.sessionCode === 'string' && request.sessionCode.trim()
        ? request.sessionCode.trim().toUpperCase().slice(0, 24)
        : undefined

    multiplayerServer = new FushiMultiplayerServer(app, {
      campaignId,
      onStorageChanged: (payload) => {
        broadcastStorageChanged(null, payload)
      },
      port,
      sessionCode,
    })

    return {
      ok: true,
      status: await multiplayerServer.start(),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Nao foi possivel hospedar.',
      ok: false,
    }
  }
})

ipcMain.handle('fushi-desktop:multiplayer-stop-host', () => {
  if (!multiplayerServer) {
    return {
      ok: true,
      status: null,
    }
  }

  const status = multiplayerServer.stop()
  multiplayerServer = null
  return {
    ok: true,
    status,
  }
})

ipcMain.on('fushi-desktop:multiplayer-status', (event) => {
  event.returnValue = multiplayerServer?.getStatus() ?? {
    clients: [],
    isRunning: false,
    localIps: [],
    port: 3030,
    serverVersion: 'multiplayer-v1',
    sessionCode: '',
    startedAt: null,
  }
})

app.whenReady().then(() => {
  configureAutoUpdater()
  updateState.feedUrl = configureUpdateFeedUrl()

  protocol.handle('fushi-asset', (request) => readAssetResponse(app, request))
  protocol.handle('fushi-library', (request) => readRuntimeAssetResponse(app, request))

  if (!hasSingleInstanceLock) {
    return
  }

  const profiles = getLaunchProfiles()
  profiles.forEach((profileId, index) => createWindow(profileId, index))

  if (process.env.FUSHI_ELECTRON_SMOKE === '1') {
    setTimeout(() => app.quit(), 2500)
  } else {
    setTimeout(() => {
      void checkForFushiUpdates()
    }, 1800)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
