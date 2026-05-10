export type PhysicalAssetCategory =
  | 'audio'
  | 'images'
  | 'interludes'
  | 'maps'
  | 'misc'

export interface PhysicalAssetUploadResult {
  ok: true
  category: PhysicalAssetCategory
  contentType: string
  filename: string
  size: number
  storagePath: string
  url: string
}

interface PhysicalAssetUploadOptions {
  category: PhysicalAssetCategory
  contentType?: string
  filename: string
}

function getUploadErrorMessage(value: unknown) {
  if (value && typeof value === 'object' && 'error' in value) {
    const error = (value as { error?: unknown }).error

    if (typeof error === 'string' && error.trim()) {
      return error
    }
  }

  return 'Nao foi possivel salvar o arquivo fisico.'
}

export function isPhysicalAssetUrl(value: string | undefined | null) {
  return typeof value === 'string' && value.startsWith('/api/fushi/assets/')
}

export async function uploadPhysicalAsset(
  asset: Blob,
  options: PhysicalAssetUploadOptions,
) {
  const response = await fetch('/api/fushi/assets/upload', {
    method: 'POST',
    headers: {
      'Content-Type': options.contentType || asset.type || 'application/octet-stream',
      'x-fushi-category': options.category,
      'x-fushi-filename': options.filename,
    },
    body: asset,
  })
  const payload = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    throw new Error(getUploadErrorMessage(payload))
  }

  if (!payload || typeof payload !== 'object' || !('url' in payload)) {
    throw new Error('Resposta invalida ao salvar asset fisico.')
  }

  return payload as PhysicalAssetUploadResult
}

function getDataUrlExtension(mimeType: string) {
  switch (mimeType.toLowerCase()) {
    case 'audio/mpeg':
      return '.mp3'
    case 'audio/mp4':
      return '.m4a'
    case 'audio/ogg':
      return '.ogg'
    case 'audio/wav':
      return '.wav'
    case 'image/gif':
      return '.gif'
    case 'image/jpeg':
      return '.jpg'
    case 'image/png':
      return '.png'
    case 'image/svg+xml':
      return '.svg'
    case 'image/webp':
      return '.webp'
    case 'video/mp4':
      return '.mp4'
    case 'video/webm':
      return '.webm'
    default:
      return ''
  }
}

function getDataUrlCategory(mimeType: string): PhysicalAssetCategory {
  if (mimeType.startsWith('audio/')) {
    return 'audio'
  }

  if (mimeType.startsWith('image/')) {
    return 'images'
  }

  if (mimeType.startsWith('video/')) {
    return 'interludes'
  }

  return 'misc'
}

export async function uploadDataUrlAsPhysicalAsset(
  dataUrl: string,
  filenamePrefix = 'migrated-asset',
) {
  const mimeMatch = /^data:([^;,]+)/.exec(dataUrl)
  const mimeType = mimeMatch?.[1] ?? 'application/octet-stream'
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const extension = getDataUrlExtension(mimeType)

  return uploadPhysicalAsset(blob, {
    category: getDataUrlCategory(mimeType),
    contentType: mimeType,
    filename: `${filenamePrefix}${extension}`,
  })
}
