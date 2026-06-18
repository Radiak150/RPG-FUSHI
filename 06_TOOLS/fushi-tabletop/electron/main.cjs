const { app, BrowserWindow, ipcMain, protocol, shell } = require('electron')
const { autoUpdater } = require('electron-updater')
const { spawn } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const http = require('node:http')
const https = require('node:https')
const os = require('node:os')
const path = require('node:path')
const {
  getAppInfo,
  getCampaignAssetsDirectory,
  getContentLibraryAssetsDirectory,
  getFushiRoot,
  getStorageStatus,
  assetExists,
  loadBackups,
  loadJson,
  readAssetResponse,
  readRuntimeAssetResponse,
  resolvePathInside,
  saveAsset,
  saveAssetBuffer,
  saveBackups,
  saveJson,
  toSafeRelativeAssetPath,
} = require('./storage.cjs')
const { FushiMultiplayerServer } = require('./multiplayer-server.cjs')

const DEV_URL = process.env.ELECTRON_RENDERER_URL
const VALID_PROFILES = new Set(['gm', 'player1', 'player2', 'player3', 'player4', 'player5'])
const UPDATE_FEED_URL_ENV = 'FUSHI_UPDATE_FEED_URL'
const UPDATE_FEED_CONFIG_FILENAME = 'update-feed.json'
const CAMPAIGN_PACKAGE_REGISTRY_FILENAME = 'campaign-packages.json'
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
let campaignPackageDownloadInFlight = null
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
  return path.join(getFushiRoot(app), UPDATE_FEED_CONFIG_FILENAME)
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
  return path.join(getFushiRoot(app), AI_PROVIDER_CONFIG_FILENAME)
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

function getCampaignPackageRegistryPath() {
  return path.join(getFushiRoot(app), CAMPAIGN_PACKAGE_REGISTRY_FILENAME)
}

function readCampaignPackageRegistry() {
  try {
    const parsed = JSON.parse(fs.readFileSync(getCampaignPackageRegistryPath(), 'utf8'))

    if (!parsed || typeof parsed !== 'object') {
      return { packages: {}, version: 1 }
    }

    return {
      packages:
        parsed.packages && typeof parsed.packages === 'object' ? parsed.packages : {},
      version: 1,
    }
  } catch (_error) {
    return { packages: {}, version: 1 }
  }
}

function writeCampaignPackageRegistry(registry) {
  const registryPath = getCampaignPackageRegistryPath()
  const temporaryPath = `${registryPath}.tmp`

  fs.mkdirSync(path.dirname(registryPath), { recursive: true })
  fs.writeFileSync(temporaryPath, JSON.stringify(registry, null, 2), 'utf8')
  fs.renameSync(temporaryPath, registryPath)
}

function normalizeCampaignPackageCode(value) {
  const code = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')

  if (!/^FUSHI-[A-Z0-9]{4,32}$/.test(code)) {
    throw new Error('Codigo de campanha invalido. Use algo como FUSHI-KZT3KA.')
  }

  return code
}

function normalizeCampaignPackageFeedUrl(value) {
  const feedUrl = normalizeUpdateFeedUrl(value || updateState.feedUrl || '')
  const parsedUrl = new URL(feedUrl)

  if (/\/latest\.ya?ml$/i.test(parsedUrl.pathname)) {
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/latest\.ya?ml$/i, '')
  }

  parsedUrl.search = ''
  parsedUrl.hash = ''
  return parsedUrl.toString().replace(/\/+$/, '')
}

function encodePackageRelativePath(relativePath) {
  return String(relativePath || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/')
}

function getCampaignPackageBaseUrl(feedUrl, code) {
  return new URL(
    `campaign-packs/${encodeURIComponent(code)}/`,
    `${normalizeCampaignPackageFeedUrl(feedUrl)}/`,
  )
}

function getCampaignPackageManifestUrl(feedUrl, code) {
  return new URL('manifest.json', getCampaignPackageBaseUrl(feedUrl, code)).toString()
}

function normalizeCampaignPackageAsset(entry, packageBaseUrl) {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const safePath = toSafeRelativeAssetPath(entry.path || entry.relativePath || entry.file)

  if (!safePath) {
    return null
  }

  const scope = entry.scope === 'campaign' ? 'campaign' : 'library'
  const relativePath = safePath.replace(/\\/g, '/')
  const campaignId =
    scope === 'campaign' && typeof entry.campaignId === 'string'
      ? entry.campaignId.trim()
      : null
  const category =
    scope === 'campaign' && typeof entry.category === 'string'
      ? entry.category.trim().replace(/[^a-z0-9._-]+/gi, '-')
      : null
  const filename =
    scope === 'campaign' && typeof entry.filename === 'string'
      ? entry.filename.trim().replace(/[^a-z0-9._-]+/gi, '-')
      : null

  if (scope === 'campaign' && (!campaignId || !category || !filename)) {
    return null
  }

  const size = Number(entry.size)
  const sha256 = String(entry.sha256 || '').trim().toLowerCase()
  const url = String(entry.url || `files/${encodePackageRelativePath(relativePath)}`).trim()

  return {
    campaignId,
    category,
    filename,
    path: relativePath,
    sha256: /^[a-f0-9]{64}$/i.test(sha256) ? sha256 : null,
    size: Number.isFinite(size) && size >= 0 ? size : null,
    scope,
    updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : null,
    url: new URL(url, packageBaseUrl).toString(),
  }
}

function normalizeCampaignPackageManifest(payload, feedUrl, requestedCode) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Manifesto do pacote invalido.')
  }

  const code = normalizeCampaignPackageCode(payload.code || requestedCode)

  if (code !== requestedCode) {
    throw new Error(`Manifesto retornou ${code}, mas o pacote pedido foi ${requestedCode}.`)
  }

  const packageBaseUrl = getCampaignPackageBaseUrl(feedUrl, code)
  const assets = Array.isArray(payload.assets)
    ? payload.assets
        .map((entry) => normalizeCampaignPackageAsset(entry, packageBaseUrl))
        .filter(Boolean)
    : []
  const totalBytes = assets.reduce(
    (sum, asset) => sum + (Number.isFinite(asset.size) ? asset.size : 0),
    0,
  )

  if (!assets.length) {
    throw new Error('Pacote sem assets para baixar.')
  }

  return {
    assets,
    campaignId: typeof payload.campaignId === 'string' ? payload.campaignId : null,
    campaignName: typeof payload.campaignName === 'string' ? payload.campaignName : null,
    code,
    createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : null,
    manifestUrl: getCampaignPackageManifestUrl(feedUrl, code),
    totalBytes,
    totalFiles: assets.length,
    version: typeof payload.version === 'string' ? payload.version : null,
  }
}

async function fetchCampaignPackageManifest(input) {
  const code = normalizeCampaignPackageCode(input?.code)
  const feedUrl = normalizeCampaignPackageFeedUrl(input?.feedUrl)
  const manifestUrl = getCampaignPackageManifestUrl(feedUrl, code)
  const response = await fetch(manifestUrl, {
    cache: 'no-store',
    headers: {
      accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Pacote ${code} nao encontrado no canal (${response.status}).`)
  }

  return normalizeCampaignPackageManifest(await response.json(), feedUrl, code)
}

function getCampaignPackageRecord(registry, code) {
  const record = registry.packages?.[code]

  return record && typeof record === 'object'
    ? {
        assets: record.assets && typeof record.assets === 'object' ? record.assets : {},
        code,
        installedAt: typeof record.installedAt === 'string' ? record.installedAt : null,
        manifestVersion:
          typeof record.manifestVersion === 'string' ? record.manifestVersion : null,
        updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : null,
      }
    : {
        assets: {},
        code,
        installedAt: null,
        manifestVersion: null,
        updatedAt: null,
      }
}

function getCampaignPackageAssetTarget(asset) {
  if (asset.scope === 'campaign' && asset.campaignId && asset.category && asset.filename) {
    return resolvePathInside(
      getCampaignAssetsDirectory(app, asset.campaignId),
      path.join(asset.category, asset.filename),
    )
  }

  return resolvePathInside(getContentLibraryAssetsDirectory(app), asset.path)
}

function describeCampaignPackageAssetInstall(record, asset) {
  const targetPath = getCampaignPackageAssetTarget(asset)

  try {
    const stats = fs.statSync(targetPath)

    if (!stats.isFile()) {
      return { reason: 'missing', targetPath }
    }

    if (asset.size !== null && stats.size !== asset.size) {
      return { reason: 'changed', targetPath }
    }

    const recordedAsset = record.assets?.[asset.path]

    if (
      asset.sha256 &&
      recordedAsset?.sha256 &&
      String(recordedAsset.sha256).toLowerCase() !== asset.sha256
    ) {
      return { reason: 'changed', targetPath }
    }

    return { reason: 'installed', targetPath }
  } catch (_error) {
    return { reason: 'missing', targetPath }
  }
}

function buildCampaignPackagePlan(manifest) {
  const registry = readCampaignPackageRegistry()
  const record = getCampaignPackageRecord(registry, manifest.code)
  const plan = {
    assetsToDownload: [],
    bytesToDownload: 0,
    changedFiles: 0,
    installedFiles: 0,
    missingFiles: 0,
    record,
    registry,
  }

  manifest.assets.forEach((asset) => {
    const installed = describeCampaignPackageAssetInstall(record, asset)

    if (installed.reason === 'installed') {
      plan.installedFiles += 1
      return
    }

    if (installed.reason === 'changed') {
      plan.changedFiles += 1
    } else {
      plan.missingFiles += 1
    }

    plan.bytesToDownload += Number.isFinite(asset.size) ? asset.size : 0
    plan.assetsToDownload.push({
      ...asset,
      targetPath: installed.targetPath,
    })
  })

  return plan
}

function createCampaignPackageStatus(manifest, plan, patch = {}) {
  const needsDownload = plan.assetsToDownload.length > 0

  return {
    bytesToDownload: plan.bytesToDownload,
    campaignId: manifest.campaignId,
    campaignName: manifest.campaignName,
    changedFiles: plan.changedFiles,
    code: manifest.code,
    currentFile: null,
    downloadedBytes: 0,
    downloadedFiles: 0,
    error: null,
    feedUrl: normalizeCampaignPackageFeedUrl(manifest.manifestUrl.replace(/\/campaign-packs\/.+$/i, '')),
    installedFiles: plan.installedFiles,
    manifestVersion: manifest.version,
    message: needsDownload
      ? `${plan.assetsToDownload.length} asset(s) para baixar/atualizar.`
      : 'Pacote da campanha ja esta local.',
    missingFiles: plan.missingFiles,
    ok: true,
    percent: needsDownload && plan.bytesToDownload > 0 ? 0 : 100,
    state: needsDownload ? 'ready' : 'downloaded',
    totalBytes: manifest.totalBytes,
    totalFiles: manifest.totalFiles,
    ...patch,
  }
}

function broadcastCampaignPackageStatus(status) {
  BrowserWindow.getAllWindows().forEach((window) => {
    if (window.webContents.isDestroyed()) {
      return
    }

    window.webContents.send('fushi-desktop:campaign-package-status-changed', status)
  })
}

function createCampaignPackageErrorStatus(input, error) {
  return {
    bytesToDownload: 0,
    campaignId: null,
    campaignName: null,
    changedFiles: 0,
    code: input?.code ? String(input.code).trim().toUpperCase() : '',
    currentFile: null,
    downloadedBytes: 0,
    downloadedFiles: 0,
    error: error instanceof Error ? error.message : String(error),
    feedUrl: input?.feedUrl || updateState.feedUrl || null,
    installedFiles: 0,
    manifestVersion: null,
    message: 'Nao foi possivel acessar o pacote da campanha.',
    missingFiles: 0,
    ok: false,
    percent: null,
    state: 'error',
    totalBytes: 0,
    totalFiles: 0,
  }
}

async function checkCampaignPackage(input) {
  try {
    const manifest = await fetchCampaignPackageManifest(input)
    const plan = buildCampaignPackagePlan(manifest)
    const status = createCampaignPackageStatus(manifest, plan)

    broadcastCampaignPackageStatus(status)
    return status
  } catch (error) {
    const status = createCampaignPackageErrorStatus(input, error)

    broadcastCampaignPackageStatus(status)
    return status
  }
}

function downloadUrlToFile(fileUrl, targetPath, onChunk, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error('Muitos redirecionamentos ao baixar asset.'))
      return
    }

    let parsedUrl

    try {
      parsedUrl = new URL(fileUrl)
    } catch (_error) {
      reject(new Error('URL de asset invalida.'))
      return
    }

    const transport = parsedUrl.protocol === 'https:' ? https : parsedUrl.protocol === 'http:' ? http : null

    if (!transport) {
      reject(new Error('Asset precisa usar http ou https.'))
      return
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    const temporaryPath = `${targetPath}.fushi-download`

    fs.rmSync(temporaryPath, { force: true })

    const request = transport.get(
      parsedUrl,
      {
        headers: {
          'user-agent': `FUSHI-Tabletop/${app.getVersion()}`,
        },
      },
      (response) => {
        const statusCode = response.statusCode || 0

        if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
          response.resume()
          downloadUrlToFile(
            new URL(response.headers.location, parsedUrl).toString(),
            targetPath,
            onChunk,
            redirectCount + 1,
          ).then(resolve, reject)
          return
        }

        if (statusCode < 200 || statusCode >= 300) {
          response.resume()
          reject(new Error(`Servidor respondeu HTTP ${statusCode} ao baixar asset.`))
          return
        }

        let bytes = 0
        const fileStream = fs.createWriteStream(temporaryPath)

        response.on('data', (chunk) => {
          bytes += chunk.length
          onChunk?.(chunk.length)
        })

        response.on('error', (error) => {
          fileStream.destroy()
          fs.rmSync(temporaryPath, { force: true })
          reject(error)
        })

        fileStream.on('error', (error) => {
          response.destroy()
          fs.rmSync(temporaryPath, { force: true })
          reject(error)
        })

        fileStream.on('finish', () => {
          fileStream.close(() => {
            try {
              fs.renameSync(temporaryPath, targetPath)
              resolve({ bytes })
            } catch (error) {
              fs.rmSync(temporaryPath, { force: true })
              reject(error)
            }
          })
        })

        response.pipe(fileStream)
      },
    )

    request.setTimeout(120000, () => {
      request.destroy(new Error('Tempo limite ao baixar asset.'))
    })

    request.on('error', (error) => {
      fs.rmSync(temporaryPath, { force: true })
      reject(error)
    })
  })
}

function hashFileSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(filePath)

    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

async function downloadCampaignPackage(input) {
  if (campaignPackageDownloadInFlight) {
    return campaignPackageDownloadInFlight
  }

  campaignPackageDownloadInFlight = (async () => {
    try {
      const manifest = await fetchCampaignPackageManifest(input)
      const plan = buildCampaignPackagePlan(manifest)
      let downloadedBytes = 0
      let downloadedFiles = 0
      let status = createCampaignPackageStatus(manifest, plan, {
        message: plan.assetsToDownload.length
          ? 'Baixando pacote da campanha.'
          : 'Pacote da campanha ja esta local.',
        state: plan.assetsToDownload.length ? 'downloading' : 'downloaded',
      })

      broadcastCampaignPackageStatus(status)

      if (!plan.assetsToDownload.length) {
        return status
      }

      const registry = plan.registry
      const now = new Date().toISOString()
      const record = {
        ...plan.record,
        assets: { ...plan.record.assets },
        code: manifest.code,
        installedAt: plan.record.installedAt || now,
        manifestVersion: manifest.version,
        updatedAt: now,
      }

      for (const asset of plan.assetsToDownload) {
        status = {
          ...status,
          currentFile: asset.path,
          downloadedBytes,
          downloadedFiles,
          message: `Baixando ${asset.path}`,
          percent:
            plan.bytesToDownload > 0
              ? Math.min(99, Math.round((downloadedBytes / plan.bytesToDownload) * 100))
              : null,
        }
        broadcastCampaignPackageStatus(status)

        const result = await downloadUrlToFile(asset.url, asset.targetPath, (chunkLength) => {
          downloadedBytes += chunkLength
          broadcastCampaignPackageStatus({
            ...status,
            downloadedBytes,
            percent:
              plan.bytesToDownload > 0
                ? Math.min(99, Math.round((downloadedBytes / plan.bytesToDownload) * 100))
                : null,
          })
        })

        if (asset.size !== null && result.bytes !== asset.size) {
          throw new Error(`Download incompleto de ${asset.path}.`)
        }

        if (asset.sha256) {
          const downloadedSha256 = await hashFileSha256(asset.targetPath)

          if (downloadedSha256 !== asset.sha256) {
            fs.rmSync(asset.targetPath, { force: true })
            throw new Error(`Integridade invalida ao baixar ${asset.path}.`)
          }
        }

        downloadedFiles += 1
        record.assets[asset.path] = {
          downloadedAt: new Date().toISOString(),
          sha256: asset.sha256,
          size: asset.size,
          updatedAt: asset.updatedAt,
        }
        registry.packages[manifest.code] = record
        writeCampaignPackageRegistry(registry)
      }

      status = {
        ...createCampaignPackageStatus(manifest, buildCampaignPackagePlan(manifest)),
        currentFile: null,
        downloadedBytes,
        downloadedFiles,
        message: 'Pacote da campanha baixado e pronto para mesa.',
        percent: 100,
        state: 'downloaded',
      }
      broadcastCampaignPackageStatus(status)
      return status
    } catch (error) {
      const status = createCampaignPackageErrorStatus(input, error)

      broadcastCampaignPackageStatus(status)
      return status
    } finally {
      campaignPackageDownloadInFlight = null
    }
  })()

  return campaignPackageDownloadInFlight
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

function sanitizeMediaImportName(value, fallback = 'audio-extraido') {
  const parsed = path.parse(String(value || fallback))
  const name = parsed.name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)

  return name || fallback
}

function getDataUrlPayload(dataUrl) {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(String(dataUrl || ''))

  if (!match) {
    throw new Error('Arquivo sem dataUrl base64 valido.')
  }

  return {
    buffer: Buffer.from(match[2], 'base64'),
    contentType: match[1],
  }
}

function resolveFfmpegBinaryPath() {
  try {
    const ffmpegPath = require('ffmpeg-static')
    const candidates = [
      ffmpegPath,
      typeof ffmpegPath === 'string'
        ? ffmpegPath.replace(`${path.sep}app.asar${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`)
        : '',
    ].filter(Boolean)

    return candidates.find((candidate) => fs.existsSync(candidate)) || ''
  } catch (_error) {
    return ''
  }
}

function runFfmpegExtractAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpegPath = resolveFfmpegBinaryPath()

    if (!ffmpegPath) {
      reject(new Error('Conversor de audio nao encontrado no app.'))
      return
    }

    const ffmpegProcess = spawn(
      ffmpegPath,
      [
        '-y',
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        inputPath,
        '-vn',
        '-acodec',
        'aac',
        '-b:a',
        '192k',
        outputPath,
      ],
      { windowsHide: true },
    )
    let stderr = ''

    ffmpegProcess.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })

    ffmpegProcess.on('error', reject)
    ffmpegProcess.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve()
        return
      }

      reject(new Error(stderr.trim() || 'Nao foi possivel extrair audio do video.'))
    })
  })
}

async function extractAudioFromMedia(request) {
  const asset = request && request.asset

  if (!asset || typeof asset.dataUrl !== 'string') {
    return {
      ok: false,
      error: 'Midia invalida.',
    }
  }

  const sourceName = sanitizeMediaImportName(asset.filename)
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'fushi-media-'))
  const inputExtension = path.extname(String(asset.filename || '')).toLowerCase() || '.media'
  const inputPath = path.join(temporaryDirectory, `source${inputExtension}`)
  const outputFilename = `${sourceName}-audio.m4a`
  const outputPath = path.join(temporaryDirectory, outputFilename)

  try {
    const { buffer } = getDataUrlPayload(asset.dataUrl)

    fs.writeFileSync(inputPath, buffer)
    await runFfmpegExtractAudio(inputPath, outputPath)

    const audioBuffer = fs.readFileSync(outputPath)
    const savedAsset = saveAssetBuffer(app, {
      asset: {
        buffer: audioBuffer,
        category: 'audio',
        filename: outputFilename,
      },
      campaignId: request.campaignId,
    })

    if (!savedAsset.ok || !savedAsset.url) {
      return {
        ok: false,
        error: savedAsset.error || 'Nao foi possivel salvar audio extraido.',
      }
    }

    return {
      ok: true,
      category: 'audio',
      contentType: 'audio/mp4',
      filename: outputFilename,
      size: audioBuffer.length,
      storagePath: savedAsset.url,
      url: savedAsset.url,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Erro ao extrair audio.',
    }
  } finally {
    fs.rmSync(temporaryDirectory, { force: true, recursive: true })
  }
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

ipcMain.handle('fushi-desktop:campaign-package-check', (_event, request) =>
  checkCampaignPackage(request),
)

ipcMain.handle('fushi-desktop:campaign-package-download', (_event, request) =>
  downloadCampaignPackage(request),
)

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

ipcMain.handle('fushi-desktop:extract-audio-from-media', async (event, request) => {
  const result = await extractAudioFromMedia(request)

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

  return result
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

ipcMain.handle('fushi-desktop:multiplayer-player-admission', (_event, request) => {
  if (!multiplayerServer) {
    return {
      error: 'Servidor multiplayer nao esta ativo.',
      ok: false,
      status: null,
    }
  }

  return multiplayerServer.updatePlayerAdmission(request)
})

ipcMain.on('fushi-desktop:multiplayer-status', (event) => {
  event.returnValue = multiplayerServer?.getStatus() ?? {
    clients: [],
    isRunning: false,
    localIps: [],
    port: 3030,
    protocolVersion: 2,
    serverInstanceId: '',
    serverVersion: 'multiplayer-v2',
    sessionCode: '',
    startedAt: null,
    stateVersion: 0,
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
