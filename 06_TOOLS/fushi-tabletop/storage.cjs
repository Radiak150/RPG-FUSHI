const fs = require('node:fs')
const path = require('node:path')

const CAMPAIGN_FILES = new Map([
  ['access', 'access.json'],
  ['library', 'library.json'],
  ['mundi', 'mundi.json'],
  ['physicalPersistence', 'physicalPersistence.json'],
  ['session', 'session.json'],
  ['transitionOverrides', 'transitionOverrides.json'],
])

const APP_FILES = new Map([
  ['access', 'access.json'],
  ['physicalPersistence', 'physicalPersistence.json'],
  ['transitionPlayback', 'transitionPlayback.json'],
  ['viewPreferences', 'viewPreferences.json'],
  ['workspace', 'workspace.json'],
])

function sanitizeId(value, fallback = 'default') {
  const sanitized = String(value || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)

  return sanitized || fallback
}

function getFushiRoot(app) {
  return path.join(app.getPath('appData'), 'FUSHI')
}

function getContentLibraryAssetsDirectory(app) {
  return path.join(getFushiRoot(app), 'library', 'assets')
}

function getPackagedAssetsDirectory() {
  return path.resolve(__dirname, '..', 'dist', 'assets')
}

function getPackagedExternalAssetsDirectories(app) {
  const roots = []

  if (process.resourcesPath) {
    roots.push(path.join(process.resourcesPath, 'assets'))
  }

  try {
    const exePath = typeof app?.getPath === 'function' ? app.getPath('exe') : ''

    if (exePath) {
      roots.push(path.join(path.dirname(exePath), 'assets'))
    }
  } catch (_error) {
    // Some test harnesses provide a partial Electron app mock.
  }

  return roots
}

function getDevPublicAssetsDirectory() {
  return path.resolve(__dirname, '..', 'public', 'assets')
}

function assertInsideRoot(root, targetPath) {
  const resolvedRoot = path.resolve(root)
  const resolvedTarget = path.resolve(targetPath)

  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error('Caminho fora da pasta FUSHI bloqueado.')
  }
}

function toSafeRelativeAssetPath(value) {
  const rawValue = String(value || '').trim()
  let relativePath = ''

  try {
    const url = new URL(rawValue)

    if (url.protocol === 'fushi-library:' && url.hostname === 'assets') {
      relativePath = url.pathname
    } else if (url.protocol === 'http:' || url.protocol === 'https:') {
      relativePath = url.pathname.replace(/^\/assets\/library\/?/, '')
    }
  } catch (_error) {
    relativePath = rawValue
  }

  relativePath = relativePath
    .replace(/\\/g, '/')
    .replace(/^\.?\/*assets\//, '')
    .replace(/^\/+/, '')

  const parts = relativePath
    .split('/')
    .map((part) => decodeURIComponent(part))
    .filter(Boolean)

  if (parts.length === 0 || parts.some((part) => part === '.' || part === '..')) {
    return null
  }

  return path.join(...parts)
}

function resolvePathInside(root, relativePath) {
  const targetPath = path.resolve(root, relativePath)
  assertInsideRoot(root, targetPath)
  return targetPath
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true })
}

function getAssetContentType(filename, fallback = 'application/octet-stream') {
  const extension = path.extname(filename).toLowerCase()

  switch (extension) {
    case '.avif':
      return 'image/avif'
    case '.gif':
      return 'image/gif'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.svg':
      return 'image/svg+xml'
    case '.webp':
      return 'image/webp'
    case '.mp3':
      return 'audio/mpeg'
    case '.m4a':
      return 'audio/mp4'
    case '.ogg':
      return 'audio/ogg'
    case '.wav':
      return 'audio/wav'
    case '.webm':
      return 'video/webm'
    case '.mp4':
      return 'video/mp4'
    case '.fbx':
      return 'application/octet-stream'
    case '.glb':
      return 'model/gltf-binary'
    case '.gltf':
      return 'model/gltf+json'
    case '.obj':
      return 'model/obj'
    case '.stl':
      return 'model/stl'
    default:
      return fallback
  }
}

function sanitizeAssetCategory(value) {
  const category = sanitizeId(value, 'misc').toLowerCase()
  return ['audio', 'images', 'interludes', 'maps', 'misc'].includes(category)
    ? category
    : 'misc'
}

function sanitizeAssetFilename(value) {
  const parsed = path.parse(String(value || `asset-${Date.now()}`))
  const name = sanitizeId(parsed.name, 'asset')
  const extension = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 16)

  return `${name}${extension}`
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null
    }

    return null
  }
}

function writeJsonFile(filePath, data) {
  ensureDirectory(path.dirname(filePath))
  const temporaryPath = `${filePath}.tmp`

  fs.writeFileSync(temporaryPath, JSON.stringify(data, null, 2), 'utf8')
  fs.renameSync(temporaryPath, filePath)
}

function resolveJsonPath(app, request) {
  if (!request || typeof request !== 'object') {
    throw new Error('Requisicao de storage invalida.')
  }

  const root = getFushiRoot(app)
  const scope = request.scope === 'campaign' ? 'campaign' : 'app'
  const name = typeof request.name === 'string' ? request.name : ''
  const files = scope === 'campaign' ? CAMPAIGN_FILES : APP_FILES
  const filename = files.get(name)

  if (!filename) {
    throw new Error('Tipo de storage nao permitido.')
  }

  const targetPath =
    scope === 'campaign'
      ? path.join(root, 'campaigns', sanitizeId(request.campaignId), filename)
      : path.join(root, filename)

  assertInsideRoot(root, targetPath)

  return targetPath
}

function getCampaignBackupsDirectory(app, campaignId) {
  const root = getFushiRoot(app)
  const directoryPath = path.join(root, 'campaigns', sanitizeId(campaignId), 'backups')

  assertInsideRoot(root, directoryPath)

  return directoryPath
}

function getCampaignAssetsDirectory(app, campaignId) {
  const root = getFushiRoot(app)
  const directoryPath = path.join(root, 'campaigns', sanitizeId(campaignId), 'assets')

  assertInsideRoot(root, directoryPath)

  return directoryPath
}

function getCampaignAssetPath(app, input) {
  const root = getFushiRoot(app)
  const campaignId = sanitizeId(input.campaignId)
  const category = sanitizeAssetCategory(input.category)
  const filename = sanitizeAssetFilename(input.filename)
  const targetPath = path.join(root, 'campaigns', campaignId, 'assets', category, filename)

  assertInsideRoot(root, targetPath)

  return {
    campaignId,
    category,
    filename,
    targetPath,
  }
}

function parseAssetUrl(app, assetUrl) {
  try {
    const url = new URL(assetUrl)

    if (url.protocol !== 'fushi-asset:' || url.hostname !== 'campaign') {
      return null
    }

    const [campaignId, category, ...filenameParts] = url.pathname
      .split('/')
      .filter(Boolean)
      .map(decodeURIComponent)

    if (!campaignId || !category || filenameParts.length === 0) {
      return null
    }

    return getCampaignAssetPath(app, {
      campaignId,
      category,
      filename: filenameParts.join('-'),
    }).targetPath
  } catch {
    return null
  }
}

function resolveRuntimeAssetPath(app, assetUrl) {
  const relativeAssetPath = toSafeRelativeAssetPath(assetUrl)

  if (!relativeAssetPath) {
    return null
  }

  const candidateRoots = [
    getContentLibraryAssetsDirectory(app),
    ...getPackagedExternalAssetsDirectories(app),
    getPackagedAssetsDirectory(),
    getDevPublicAssetsDirectory(),
  ]

  for (const root of candidateRoots) {
    try {
      const candidatePath = resolvePathInside(root, relativeAssetPath)

      if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
        return candidatePath
      }
    } catch (_error) {
      // Ignore invalid candidate roots and keep searching the fallback chain.
    }
  }

  return null
}

function saveAsset(app, request) {
  try {
    const asset = request && request.asset

    if (!asset || typeof asset.dataUrl !== 'string') {
      return {
        ok: false,
        error: 'Asset invalido.',
      }
    }

    const match = /^data:([^;,]+);base64,(.+)$/s.exec(asset.dataUrl)

    if (!match) {
      return {
        ok: false,
        error: 'Asset sem dataUrl base64.',
      }
    }

    const resolved = getCampaignAssetPath(app, {
      campaignId: request.campaignId,
      category: asset.category,
      filename: asset.filename,
    })
    const fileBuffer = Buffer.from(match[2], 'base64')

    ensureDirectory(path.dirname(resolved.targetPath))
    fs.writeFileSync(resolved.targetPath, fileBuffer)

    return {
      ok: true,
      url: `fushi-asset://campaign/${encodeURIComponent(resolved.campaignId)}/${encodeURIComponent(resolved.category)}/${encodeURIComponent(resolved.filename)}`,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Erro ao salvar asset.',
    }
  }
}

function assetExists(app, assetUrl) {
  const assetPath = parseAssetUrl(app, assetUrl) || resolveRuntimeAssetPath(app, assetUrl)

  return assetPath ? fs.existsSync(assetPath) : false
}

function getRequestHeader(request, headerName) {
  if (!request || !request.headers) {
    return ''
  }

  if (typeof request.headers.get === 'function') {
    return request.headers.get(headerName) || ''
  }

  const headers = request.headers
  return headers[headerName.toLowerCase()] || headers[headerName] || ''
}

function readFileProtocolResponse(request, filePath, notFoundMessage) {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return new Response(notFoundMessage, { status: 404 })
  }

  const stat = fs.statSync(filePath)
  const range = getRequestHeader(request, 'range')
  const contentType = getAssetContentType(filePath)
  const commonHeaders = {
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Type': contentType,
  }

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range)

    if (match) {
      const hasStart = match[1] !== ''
      const hasEnd = match[2] !== ''
      const requestedStart = hasStart ? Number.parseInt(match[1], 10) : 0
      const suffixLength = !hasStart && hasEnd ? Number.parseInt(match[2], 10) : 0
      const requestedEnd =
        suffixLength > 0
          ? stat.size - 1
          : hasEnd
          ? Number.parseInt(match[2], 10)
          : stat.size - 1
      const safeStart =
        suffixLength > 0
          ? Math.max(0, stat.size - suffixLength)
          : Math.max(0, requestedStart)
      const safeEnd = Math.min(
        Math.max(safeStart, requestedEnd),
        Math.max(0, stat.size - 1),
      )

      if (stat.size === 0 || safeStart >= stat.size || safeStart > safeEnd) {
        return new Response(null, {
          headers: {
            ...commonHeaders,
            'Content-Range': `bytes */${stat.size}`,
          },
          status: 416,
        })
      }

      const body =
        request?.method === 'HEAD'
          ? null
          : fs.readFileSync(filePath).subarray(safeStart, safeEnd + 1)

      return new Response(body, {
        headers: {
          ...commonHeaders,
          'Content-Length': String(safeEnd - safeStart + 1),
          'Content-Range': `bytes ${safeStart}-${safeEnd}/${stat.size}`,
        },
        status: 206,
      })
    }
  }

  const body = request?.method === 'HEAD' ? null : fs.readFileSync(filePath)

  return new Response(body, {
    headers: {
      ...commonHeaders,
      'Content-Length': String(stat.size),
    },
  })
}

function readAssetResponse(app, request) {
  const assetPath = parseAssetUrl(app, request.url)

  return readFileProtocolResponse(request, assetPath, 'Asset nao encontrado.')
}

function readRuntimeAssetResponse(app, request) {
  const assetPath = resolveRuntimeAssetPath(app, request.url)

  return readFileProtocolResponse(
    request,
    assetPath,
    'Asset nao encontrado na biblioteca.',
  )
}

function sendFileHttpResponse(request, response, filePath) {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendJsonHttpResponse(response, 404, { error: 'Asset nao encontrado.' })
    return
  }

  const stat = fs.statSync(filePath)
  const range = request.headers.range
  const contentType = getAssetContentType(filePath)
  const commonHeaders = {
    'Accept-Ranges': 'bytes',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Type': contentType,
  }

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range)

    if (match) {
      const start = match[1] ? Number.parseInt(match[1], 10) : 0
      const end = match[2] ? Number.parseInt(match[2], 10) : stat.size - 1
      const safeStart = Math.max(0, Math.min(start, stat.size - 1))
      const safeEnd = Math.max(safeStart, Math.min(end, stat.size - 1))

      response.writeHead(206, {
        ...commonHeaders,
        'Content-Length': safeEnd - safeStart + 1,
        'Content-Range': `bytes ${safeStart}-${safeEnd}/${stat.size}`,
      })

      if (request.method === 'HEAD') {
        response.end()
        return
      }

      fs.createReadStream(filePath, { end: safeEnd, start: safeStart }).pipe(response)
      return
    }
  }

  response.writeHead(200, {
    ...commonHeaders,
    'Content-Length': stat.size,
  })

  if (request.method === 'HEAD') {
    response.end()
    return
  }

  fs.createReadStream(filePath).pipe(response)
}

function sendJsonHttpResponse(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload, null, 2))
}

function sendStoredAssetHttpResponse(app, request, response, assetUrl) {
  sendFileHttpResponse(request, response, parseAssetUrl(app, assetUrl))
}

function sendRuntimeAssetHttpResponse(app, request, response, assetUrl) {
  sendFileHttpResponse(request, response, resolveRuntimeAssetPath(app, assetUrl))
}

function createBackupFilename(snapshot) {
  const createdAt =
    snapshot && typeof snapshot.createdAt === 'string'
      ? snapshot.createdAt
      : new Date().toISOString()
  const id = snapshot && typeof snapshot.id === 'string' ? snapshot.id : 'snapshot'
  const stamp = createdAt.replace(/[^0-9a-zA-Z_-]+/g, '-').replace(/-+$/g, '')

  return `backup-${stamp}-${sanitizeId(id)}.json`
}

function getAppInfo(app) {
  const exePath = app.getPath('exe')

  return {
    dataDir: getFushiRoot(app),
    exePath,
    installDir: path.dirname(exePath),
    isDesktop: true,
    libraryDir: getContentLibraryAssetsDirectory(app),
    platform: process.platform,
    version: app.getVersion(),
  }
}

function describeStorageFile(filePath) {
  try {
    const stats = fs.statSync(filePath)

    return {
      exists: true,
      path: filePath,
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
    }
  } catch {
    return {
      exists: false,
      path: filePath,
      size: 0,
      updatedAt: null,
    }
  }
}

function getStorageStatus(app, campaignId) {
  const root = getFushiRoot(app)
  const sanitizedCampaignId = sanitizeId(campaignId)
  const campaignDir = path.join(root, 'campaigns', sanitizedCampaignId)

  assertInsideRoot(root, campaignDir)

  const campaignBlocks = Array.from(CAMPAIGN_FILES.entries()).map(([name, filename]) => ({
    name,
    ...describeStorageFile(path.join(campaignDir, filename)),
  }))
  const appBlocks = Array.from(APP_FILES.entries()).map(([name, filename]) => ({
    name,
    ...describeStorageFile(path.join(root, filename)),
  }))

  return {
    appBlocks,
    campaignBlocks,
    campaignDir,
    campaignId: sanitizedCampaignId,
    dataDir: root,
  }
}

function loadJson(app, request) {
  try {
    return readJsonFile(resolveJsonPath(app, request))
  } catch {
    return null
  }
}

function saveJson(app, request) {
  try {
    writeJsonFile(resolveJsonPath(app, request), request.data ?? null)
    return true
  } catch {
    return false
  }
}

function loadBackups(app, campaignId) {
  try {
    const directoryPath = getCampaignBackupsDirectory(app, campaignId)

    if (!fs.existsSync(directoryPath)) {
      return []
    }

    return fs
      .readdirSync(directoryPath)
      .filter((filename) => filename.startsWith('backup-') && filename.endsWith('.json'))
      .map((filename) => readJsonFile(path.join(directoryPath, filename)))
      .filter(Boolean)
      .sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''))
  } catch {
    return []
  }
}

function saveBackups(app, request) {
  try {
    const snapshots = Array.isArray(request && request.data) ? request.data.slice(0, 5) : []
    const directoryPath = getCampaignBackupsDirectory(app, request && request.campaignId)

    ensureDirectory(directoryPath)

    fs.readdirSync(directoryPath)
      .filter((filename) => filename.startsWith('backup-') && filename.endsWith('.json'))
      .forEach((filename) => {
        fs.unlinkSync(path.join(directoryPath, filename))
      })

    snapshots.forEach((snapshot) => {
      writeJsonFile(path.join(directoryPath, createBackupFilename(snapshot)), snapshot)
    })

    return true
  } catch {
    return false
  }
}

module.exports = {
  assetExists,
  getAppInfo,
  getStorageStatus,
  loadBackups,
  loadJson,
  readAssetResponse,
  readRuntimeAssetResponse,
  saveAsset,
  saveBackups,
  saveJson,
  sendRuntimeAssetHttpResponse,
  sendStoredAssetHttpResponse,
}
