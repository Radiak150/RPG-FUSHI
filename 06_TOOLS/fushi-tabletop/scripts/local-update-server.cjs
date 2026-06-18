const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const releaseDir = path.join(projectRoot, 'release', 'nsis-web')
const campaignPacksDir = path.join(projectRoot, 'release', 'campaign-packs')
const port = Number.parseInt(process.env.FUSHI_UPDATE_PORT || '8765', 10)
const host = process.env.FUSHI_UPDATE_HOST || '127.0.0.1'
const packageAssetRoots = [
  ...(process.env.FUSHI_PACKAGE_ASSET_ROOT || '')
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean),
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'FUSHI', 'library', 'assets'),
  path.join(projectRoot, 'public', 'assets'),
].map((entry) => path.resolve(entry))

const contentTypes = new Map([
  ['.exe', 'application/vnd.microsoft.portable-executable'],
  ['.json', 'application/json; charset=utf-8'],
  ['.yml', 'application/yaml; charset=utf-8'],
  ['.yaml', 'application/yaml; charset=utf-8'],
  ['.7z', 'application/x-7z-compressed'],
  ['.avif', 'image/avif'],
  ['.gif', 'image/gif'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.m4a', 'audio/mp4'],
  ['.mp3', 'audio/mpeg'],
  ['.ogg', 'audio/ogg'],
  ['.wav', 'audio/wav'],
  ['.webm', 'video/webm'],
  ['.mp4', 'video/mp4'],
  ['.fbx', 'application/octet-stream'],
  ['.glb', 'model/gltf-binary'],
  ['.gltf', 'model/gltf+json'],
  ['.obj', 'model/obj'],
  ['.stl', 'model/stl'],
])

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload, null, 2))
}

function getSafeFilePath(urlPathname) {
  const relativePath = decodeURIComponent(urlPathname)
    .replace(/^\/+/, '')
    .replaceAll('/', path.sep)
  const filePath = path.resolve(releaseDir, relativePath || 'latest.yml')

  if (filePath !== releaseDir && !filePath.startsWith(`${releaseDir}${path.sep}`)) {
    return null
  }

  return filePath
}

function getSafePathInside(root, relativePath) {
  const filePath = path.resolve(root, relativePath)

  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    return null
  }

  return filePath
}

function sanitizePackageCode(value) {
  const code = String(value || '').trim().toUpperCase()

  return /^FUSHI-[A-Z0-9]{4,32}$/.test(code) ? code : ''
}

function getCampaignPackageFilePath(urlPathname) {
  const parts = decodeURIComponent(urlPathname)
    .split('/')
    .filter(Boolean)

  if (parts[0] !== 'campaign-packs') {
    return null
  }

  const code = sanitizePackageCode(parts[1])

  if (!code) {
    return null
  }

  if (parts.length === 3 && parts[2] === 'manifest.json') {
    return getSafePathInside(campaignPacksDir, path.join(code, 'manifest.json'))
  }

  if (parts.length >= 4 && parts[2] === 'files') {
    const relativeAssetPath = parts.slice(3).join(path.sep)

    if (
      !relativeAssetPath ||
      relativeAssetPath.split(/[\\/]+/).some((part) => part === '.' || part === '..')
    ) {
      return null
    }

    for (const assetRoot of packageAssetRoots) {
      const candidatePath = getSafePathInside(assetRoot, relativeAssetPath)

      if (candidatePath && fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
        return candidatePath
      }
    }
  }

  if (parts.length >= 5 && parts[2] === 'campaign-files') {
    const campaignId = parts[3]
    const relativeAssetPath = parts.slice(4).join(path.sep)

    if (
      !campaignId ||
      !relativeAssetPath ||
      [campaignId, ...parts.slice(4)].some((part) => part === '.' || part === '..')
    ) {
      return null
    }

    const campaignAssetsRoot = path.resolve(
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
      'FUSHI',
      'campaigns',
      campaignId,
      'assets',
    )
    const candidatePath = getSafePathInside(campaignAssetsRoot, relativeAssetPath)

    if (candidatePath && fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
      return candidatePath
    }
  }

  return null
}

function serveFile(request, response, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendJson(response, 404, { error: 'Arquivo nao encontrado.' })
    return
  }

  const stat = fs.statSync(filePath)
  const range = request.headers.range
  const contentType = contentTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream'

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range)

    if (match) {
      const start = match[1] ? Number.parseInt(match[1], 10) : 0
      const end = match[2] ? Number.parseInt(match[2], 10) : stat.size - 1
      const safeStart = Math.max(0, Math.min(start, stat.size - 1))
      const safeEnd = Math.max(safeStart, Math.min(end, stat.size - 1))

      response.writeHead(206, {
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Content-Length': safeEnd - safeStart + 1,
        'Content-Range': `bytes ${safeStart}-${safeEnd}/${stat.size}`,
        'Content-Type': contentType,
      })
      fs.createReadStream(filePath, { end: safeEnd, start: safeStart }).pipe(response)
      return
    }
  }

  response.writeHead(200, {
    'Accept-Ranges': 'bytes',
    'Access-Control-Allow-Origin': '*',
    'Content-Length': stat.size,
    'Content-Type': contentType,
  })
  fs.createReadStream(filePath).pipe(response)
}

if (!fs.existsSync(path.join(releaseDir, 'latest.yml'))) {
  console.error(`Nao encontrei latest.yml em ${releaseDir}. Rode npm run release:installer primeiro.`)
  process.exit(1)
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)

  if (url.pathname === '/health') {
    sendJson(response, 200, {
      campaignPacksDir,
      ok: true,
      packageAssetRoots,
      releaseDir,
    })
    return
  }

  if (url.pathname.startsWith('/campaign-packs/')) {
    const packageFilePath = getCampaignPackageFilePath(url.pathname)

    if (!packageFilePath) {
      sendJson(response, 404, { error: 'Pacote da campanha nao encontrado.' })
      return
    }

    serveFile(request, response, packageFilePath)
    return
  }

  const filePath = getSafeFilePath(url.pathname)

  if (!filePath) {
    sendJson(response, 403, { error: 'Caminho bloqueado.' })
    return
  }

  serveFile(request, response, filePath)
})

server.listen(port, host, () => {
  const displayHost = host === '0.0.0.0' ? 'SEU-IP-LOCAL' : host
  console.log(`FUSHI update server local: http://${displayHost}:${port}`)
  console.log(`Servindo: ${releaseDir}`)
  console.log('Use Ctrl+C para parar.')
})
