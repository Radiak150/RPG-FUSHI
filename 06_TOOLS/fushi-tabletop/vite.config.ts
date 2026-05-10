import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

const AUTOSAVE_FILENAME = 'fushi-tabletop-autosave.json'
const ALLOWED_ASSET_CATEGORIES = new Set([
  'audio',
  'images',
  'interludes',
  'maps',
  'misc',
])

function getPersistenceDirectory() {
  return (
    process.env.FUSHI_AUTOSAVE_DIR ||
    path.resolve(process.cwd(), '..', '..', '03_DATA', 'APP_STATE')
  )
}

function getPersistenceFilePath() {
  return path.join(getPersistenceDirectory(), AUTOSAVE_FILENAME)
}

function getAssetDirectory() {
  return (
    process.env.FUSHI_ASSET_DIR ||
    path.resolve(process.cwd(), '..', '..', '05_ASSETS', 'APP_UPLOADS')
  )
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>,
) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}

function sendError(
  response: ServerResponse,
  statusCode: number,
  error: string,
  extra?: Record<string, unknown>,
) {
  sendJson(response, statusCode, {
    ok: false,
    error,
    ...extra,
  })
}

function readRequestBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []

    request.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}

function readRequestBuffer(request: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []

    request.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks)))
    request.on('error', reject)
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getHeaderValue(request: IncomingMessage, headerName: string) {
  const value = request.headers[headerName.toLowerCase()]

  if (Array.isArray(value)) {
    return value[0] ?? ''
  }

  return value ?? ''
}

function sanitizeAssetCategory(value: string) {
  const category = value.trim().toLowerCase()

  return ALLOWED_ASSET_CATEGORIES.has(category) ? category : 'misc'
}

function sanitizeAssetFilename(value: string) {
  const fallbackName = `asset-${Date.now()}`
  const parsedName = path.parse(value || fallbackName)
  const extension = parsedName.ext
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '')
    .slice(0, 16)
  const baseName = (parsedName.name || fallbackName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  const uniquePart = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  return `${uniquePart}-${baseName || fallbackName}${extension}`
}

function resolveAssetPath(category: string, filename: string) {
  const assetRoot = path.resolve(getAssetDirectory())
  const targetPath = path.resolve(assetRoot, category, filename)

  if (!targetPath.startsWith(assetRoot + path.sep)) {
    throw new Error('Caminho de asset invalido.')
  }

  return {
    assetRoot,
    targetPath,
  }
}

function getAssetContentType(filename: string, fallback = 'application/octet-stream') {
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
    case '.mov':
      return 'video/quicktime'
    case '.mp4':
      return 'video/mp4'
    default:
      return fallback
  }
}

function parseAssetRequestUrl(request: IncomingMessage) {
  const requestUrl = new URL(request.url ?? '/', 'http://localhost')
  const assetPath = requestUrl.pathname
    .replace(/^\/api\/fushi\/assets\/?/, '')
    .replace(/^\//, '')
  const [category = '', ...filenameParts] = assetPath
    .split('/')

  if (!category || filenameParts.length === 0) {
    return null
  }

  return {
    category: sanitizeAssetCategory(decodeURIComponent(category)),
    filename: path.basename(decodeURIComponent(filenameParts.join('/'))),
  }
}

async function handleAssetUpload(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'POST') {
    sendError(response, 405, 'Metodo nao suportado.')
    return
  }

  const category = sanitizeAssetCategory(getHeaderValue(request, 'x-fushi-category'))
  const originalFilename = getHeaderValue(request, 'x-fushi-filename') || 'asset'
  const contentType = getHeaderValue(request, 'content-type') || 'application/octet-stream'
  const fileBuffer = await readRequestBuffer(request)

  if (fileBuffer.length === 0) {
    sendError(response, 400, 'Arquivo vazio.')
    return
  }

  const filename = sanitizeAssetFilename(originalFilename)
  const { targetPath } = resolveAssetPath(category, filename)

  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.writeFile(targetPath, fileBuffer)

  sendJson(response, 200, {
    ok: true,
    category,
    contentType,
    filename,
    size: fileBuffer.length,
    storagePath: targetPath,
    url: `/api/fushi/assets/${encodeURIComponent(category)}/${encodeURIComponent(filename)}`,
  })
}

async function handleAssetRead(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendError(response, 405, 'Metodo nao suportado.')
    return
  }

  const parsedUrl = parseAssetRequestUrl(request)

  if (!parsedUrl) {
    sendError(response, 404, 'Asset nao encontrado.')
    return
  }

  try {
    const { targetPath } = resolveAssetPath(parsedUrl.category, parsedUrl.filename)
    const stat = await fs.stat(targetPath)
    const contentType = getAssetContentType(parsedUrl.filename)
    const range = getHeaderValue(request, 'range')

    response.setHeader('Content-Type', contentType)
    response.setHeader('Accept-Ranges', 'bytes')
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range)
      const start = match?.[1] ? Number(match[1]) : 0
      const end = match?.[2] ? Number(match[2]) : stat.size - 1
      const safeStart = Math.max(0, Math.min(start, stat.size - 1))
      const safeEnd = Math.max(safeStart, Math.min(end, stat.size - 1))
      const chunkSize = safeEnd - safeStart + 1

      response.statusCode = 206
      response.setHeader('Content-Length', String(chunkSize))
      response.setHeader('Content-Range', `bytes ${safeStart}-${safeEnd}/${stat.size}`)

      if (request.method === 'HEAD') {
        response.end()
        return
      }

      createReadStream(targetPath, { start: safeStart, end: safeEnd }).pipe(response)
      return
    }

    response.statusCode = 200
    response.setHeader('Content-Length', String(stat.size))

    if (request.method === 'HEAD') {
      response.end()
      return
    }

    createReadStream(targetPath).pipe(response)
  } catch (error) {
    const code = isRecord(error) && typeof error.code === 'string' ? error.code : ''

    sendError(
      response,
      code === 'ENOENT' ? 404 : 500,
      code === 'ENOENT' ? 'Asset nao encontrado.' : 'Erro ao ler asset.',
      {
        storagePath: path.join(getAssetDirectory(), parsedUrl.category, parsedUrl.filename),
      },
    )
  }
}

async function savePersistenceBackup(backup: unknown) {
  if (
    !isRecord(backup) ||
    backup.appId !== 'fushi-tabletop' ||
    backup.schemaVersion !== 1 ||
    !isRecord(backup.localStorage) ||
    !isRecord(backup.sessionStorage)
  ) {
    throw new Error('Backup invalido.')
  }

  const directory = getPersistenceDirectory()
  const filePath = getPersistenceFilePath()
  const temporaryFilePath = `${filePath}.tmp`
  const backupText = JSON.stringify(backup, null, 2)
  const exportedAt =
    typeof backup.exportedAt === 'string' ? backup.exportedAt : new Date().toISOString()
  const dayPart = exportedAt.slice(0, 10)
  const dailyBackupPath = path.join(
    directory,
    'daily',
    `fushi-tabletop-autosave-${dayPart}.json`,
  )

  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(temporaryFilePath, backupText, 'utf8')
  await fs.rename(temporaryFilePath, filePath)

  try {
    await fs.access(dailyBackupPath)
  } catch {
    await fs.mkdir(path.dirname(dailyBackupPath), { recursive: true })
    await fs.writeFile(dailyBackupPath, backupText, 'utf8')
  }

  return filePath
}

function fushiPersistencePlugin(): Plugin {
  return {
    name: 'fushi-persistence',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/fushi/assets/upload', async (request, response) => {
        try {
          await handleAssetUpload(request, response)
        } catch (error) {
          sendError(response, 500, error instanceof Error ? error.message : 'Erro no upload.', {
            storagePath: getAssetDirectory(),
          })
        }
      })

      server.middlewares.use('/api/fushi/assets', async (request, response) => {
        await handleAssetRead(request, response)
      })

      server.middlewares.use('/api/fushi/persistence/state', async (request, response) => {
        const filePath = getPersistenceFilePath()

        try {
          if (request.method === 'GET') {
            try {
              const backupText = await fs.readFile(filePath, 'utf8')
              const backup = JSON.parse(backupText) as unknown

              sendJson(response, 200, {
                ok: true,
                exists: true,
                backup,
                storagePath: filePath,
              })
            } catch (error) {
              const code =
                isRecord(error) && typeof error.code === 'string' ? error.code : ''

              if (code === 'ENOENT') {
                sendJson(response, 200, {
                  ok: true,
                  exists: false,
                  backup: null,
                  storagePath: filePath,
                })
                return
              }

              throw error
            }

            return
          }

          if (request.method === 'POST') {
            const rawBody = await readRequestBody(request)
            const parsedBody = JSON.parse(rawBody) as unknown
            const backup = isRecord(parsedBody) ? parsedBody.backup : null
            const storagePath = await savePersistenceBackup(backup)

            sendJson(response, 200, {
              ok: true,
              savedAt: new Date().toISOString(),
              storagePath,
            })
            return
          }

          sendJson(response, 405, {
            ok: false,
            error: 'Metodo nao suportado.',
          })
        } catch (error) {
          sendJson(response, 500, {
            ok: false,
            error: error instanceof Error ? error.message : 'Erro no autosave.',
            storagePath: filePath,
          })
        }
      })
    },
  }
}

// To stabilize the app inside embedded webviews (IntelliJ browser) and
// avoid occasional HMR/runtime preamble errors, disable Vite HMR while
// keeping the React plugin for JSX/TSX handling. This prevents
// `import.meta.hot` from being active and stops the refresh runtime from
// throwing in environments that don't expose the expected preamble.
export default defineConfig({
  server: {
    hmr: false,
  },
  plugins: [react(), fushiPersistencePlugin()],
})
