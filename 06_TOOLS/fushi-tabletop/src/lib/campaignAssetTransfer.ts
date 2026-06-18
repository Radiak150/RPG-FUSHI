import type { FushiCampaignExportFile } from './campaignTransfer'

export interface FushiCampaignEmbeddedAsset {
  category: string
  contentType: string
  dataUrl: string
  filename: string
  size: number
  sourceUrl: string
}

type ExportFileWithAssets = FushiCampaignExportFile & {
  assets?: FushiCampaignEmbeddedAsset[]
  assetWarnings?: Array<{ reason: string; sourceUrl: string }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function sanitizeFilename(value: string) {
  const fallback = `asset-${Date.now()}`
  const filename = value.split(/[/?#]/)[0] || fallback

  return filename.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 120) || fallback
}

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash.toString(36)
}

function buildEmbeddedFilename(sourceUrl: string, contentType = '') {
  const filename = getFilenameFromUrl(sourceUrl)
  const parsed = /^(.+?)(\.[a-zA-Z0-9]+)?$/.exec(filename)
  const name = parsed?.[1] || 'asset'
  const extension =
    parsed?.[2] ||
    (contentType === 'image/png'
      ? '.png'
      : contentType === 'image/jpeg'
        ? '.jpg'
        : contentType === 'image/webp'
          ? '.webp'
          : contentType === 'image/gif'
            ? '.gif'
            : '')

  return sanitizeFilename(`${name}-${hashString(sourceUrl)}${extension}`)
}

function inferCategory(url: string, contentType = '') {
  const pathParts = url.split('?')[0].split('/')
  const apiIndex = pathParts.findIndex((part) => part === 'assets')
  const apiCategory = apiIndex >= 0 ? pathParts[apiIndex + 1] : ''

  if (apiCategory) {
    return apiCategory
  }

  if (contentType.startsWith('audio/')) {
    return 'audio'
  }

  if (contentType.startsWith('video/')) {
    return 'interludes'
  }

  if (contentType.startsWith('image/')) {
    return 'images'
  }

  return 'misc'
}

function getFilenameFromUrl(url: string) {
  try {
    const parsedUrl = new URL(url, window.location.origin)
    const filename = decodeURIComponent(parsedUrl.pathname.split('/').pop() ?? '')

    return sanitizeFilename(filename)
  } catch {
    return sanitizeFilename(url.split('/').pop() ?? '')
  }
}

function shouldEmbedUrl(value: string) {
  return (
    value.startsWith('data:image/') ||
    value.startsWith('data:audio/') ||
    value.startsWith('data:video/') ||
    value.startsWith('blob:') ||
    value.startsWith('/api/fushi/assets/') ||
    value.startsWith('/assets/') ||
    value.startsWith('./assets/') ||
    value.startsWith('assets/') ||
    value.startsWith('fushi-asset://')
  )
}

function collectAssetUrls(value: unknown, urls = new Set<string>()) {
  if (typeof value === 'string') {
    if (shouldEmbedUrl(value)) {
      urls.add(value)
    }

    return urls
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectAssetUrls(item, urls))
    return urls
  }

  if (isRecord(value)) {
    Object.entries(value).forEach(([key, entryValue]) => {
      if (key === 'assets') {
        return
      }

      collectAssetUrls(entryValue, urls)
    })
  }

  return urls
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Nao foi possivel embutir asset.'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(blob)
  })
}

async function embedUrl(sourceUrl: string): Promise<FushiCampaignEmbeddedAsset | null> {
  try {
    if (sourceUrl.startsWith('data:')) {
      const contentType = /^data:([^;,]+)/.exec(sourceUrl)?.[1] ?? 'application/octet-stream'
      const byteLength = Math.round((sourceUrl.length * 3) / 4)

      return {
        category: inferCategory(sourceUrl, contentType),
        contentType,
        dataUrl: sourceUrl,
        filename: buildEmbeddedFilename(sourceUrl, contentType),
        size: byteLength,
        sourceUrl,
      }
    }

    const response = await fetch(sourceUrl)

    if (!response.ok) {
      return null
    }

    const blob = await response.blob()
    const contentType = blob.type || response.headers.get('content-type') || 'application/octet-stream'

    return {
      category: inferCategory(sourceUrl, contentType),
      contentType,
      dataUrl: await blobToDataUrl(blob),
      filename: buildEmbeddedFilename(sourceUrl, contentType),
      size: blob.size,
      sourceUrl,
    }
  } catch {
    return null
  }
}

function rewriteAssetReferences<T>(value: T, replacements: Map<string, string>): T {
  if (typeof value === 'string') {
    return (replacements.get(value) ?? value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteAssetReferences(item, replacements)) as T
  }

  if (!isRecord(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      rewriteAssetReferences(entryValue, replacements),
    ]),
  ) as T
}

export async function embedCampaignAssets(
  file: FushiCampaignExportFile,
): Promise<ExportFileWithAssets> {
  const urls = Array.from(collectAssetUrls(file))
  const embeddedAssets = await Promise.all(
    urls.map(async (url) => ({
      asset: await embedUrl(url),
      sourceUrl: url,
    })),
  )
  const assets = embeddedAssets
    .map((entry) => entry.asset)
    .filter((asset): asset is FushiCampaignEmbeddedAsset => asset !== null)
  const assetWarnings = embeddedAssets
    .filter((entry) => entry.asset === null)
    .map((entry) => ({
      reason: 'Nao foi possivel localizar ou ler o asset durante o export.',
      sourceUrl: entry.sourceUrl,
    }))

  return {
    ...file,
    assets,
    assetWarnings,
  }
}

export async function materializeCampaignAssetsForImport(
  file: FushiCampaignExportFile,
  targetCampaignId: string,
) {
  const fileWithAssets = file as ExportFileWithAssets
  const replacements = new Map<string, string>()
  const failedAssets: FushiCampaignEmbeddedAsset[] = []

  for (const asset of fileWithAssets.assets ?? []) {
    const savedAsset = window.fushiDesktop?.saveAsset(targetCampaignId, asset)

    if (savedAsset?.ok && savedAsset.url) {
      replacements.set(asset.sourceUrl, savedAsset.url)
      continue
    }

    replacements.set(asset.sourceUrl, asset.dataUrl)
    failedAssets.push(asset)
  }

  return {
    failedAssets,
    file: {
      ...cloneValue(file),
      campaign: rewriteAssetReferences(file.campaign, replacements),
      storage: rewriteAssetReferences(file.storage, replacements),
    } satisfies FushiCampaignExportFile,
  }
}
