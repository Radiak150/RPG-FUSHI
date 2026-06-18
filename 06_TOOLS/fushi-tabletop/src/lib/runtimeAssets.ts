import type { VisualQualityMode } from './productPreferences'

interface RuntimeAssetVariantOptions {
  kind: 'tabletop-map'
  visualQuality?: VisualQualityMode
}

function normalizeRuntimePublicAssetUrl(value: string) {
  const normalizedValue = value.trim().replace(/\\/g, '/')
  const assetPathMatch = /^(?:\.\/|\/)?assets\/(.+)$/.exec(normalizedValue)

  if (!assetPathMatch) {
    return value
  }

  return `/assets/${assetPathMatch[1]}`
}

export function resolveRuntimeAssetUrl(value?: string | null) {
  if (!value) {
    return value ?? ''
  }

  const normalizedValue = normalizeRuntimePublicAssetUrl(value)

  if (
    typeof window !== 'undefined' &&
    window.fushiDesktop &&
    normalizedValue.startsWith('/assets/')
  ) {
    return toDesktopLibraryAssetUrl(normalizedValue)
  }

  return normalizedValue
}

export function resolveRuntimeAssetVariantUrl(
  value: string | null | undefined,
  options: RuntimeAssetVariantOptions,
) {
  if (!value) {
    return resolveRuntimeAssetUrl(value)
  }

  const variantUrl = buildRuntimeAssetVariantUrl(value, options)

  if (!variantUrl) {
    return resolveRuntimeAssetUrl(value)
  }

  if (typeof window !== 'undefined' && window.fushiDesktop) {
    const desktopOriginalUrl = resolveRuntimeAssetUrl(value)
    const desktopVariantUrl = resolveRuntimeAssetUrl(variantUrl)

    if (options.visualQuality === 'ultra') {
      if (window.fushiDesktop.assetExists(desktopOriginalUrl)) {
        return desktopOriginalUrl
      }

      if (window.fushiDesktop.assetExists(desktopVariantUrl)) {
        return desktopVariantUrl
      }

      return desktopOriginalUrl
    }

    if (window.fushiDesktop.assetExists(desktopVariantUrl)) {
      return desktopVariantUrl
    }

    return desktopOriginalUrl
  }

  if (options.visualQuality === 'ultra') {
    return resolveRuntimeAssetUrl(value)
  }

  return resolveRuntimeAssetUrl(value)
}

export function resolveRuntimeCssAssetUrl(value?: string | null) {
  if (!value) {
    return value ?? ''
  }

  const normalizedValue = normalizeRuntimePublicAssetUrl(value)

  if (
    typeof window !== 'undefined' &&
    window.fushiDesktop &&
    normalizedValue.startsWith('/assets/')
  ) {
    return toDesktopLibraryAssetUrl(normalizedValue)
  }

  return normalizedValue
}

function buildRuntimeAssetVariantUrl(value: string, options: RuntimeAssetVariantOptions) {
  if (options.kind !== 'tabletop-map') {
    return ''
  }

  const cleanValue = value.split('?')[0].split('#')[0]
  const isRuntimeAsset =
    cleanValue.startsWith('/assets/') ||
    cleanValue.startsWith('assets/') ||
    cleanValue.startsWith('./assets/') ||
    cleanValue.startsWith('fushi-library://assets/')

  if (!isRuntimeAsset || !/\.(png|jpe?g)$/i.test(cleanValue)) {
    return ''
  }

  const relativePath = cleanValue
    .replace(/^fushi-library:\/\/assets\/?/, '')
    .replace(/^\.?\/*assets\//, '')
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => decodeURIComponent(part))
    .join('/')

  if (!relativePath || relativePath.startsWith('_optimized/')) {
    return ''
  }

  const encodedVariantPath = relativePath
    .replace(/\.(png|jpe?g)$/i, '.webp')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')

  return `/assets/_optimized/${encodedVariantPath}`
}

function toDesktopLibraryAssetUrl(value: string) {
  const relativePath = value
    .replace(/^\/assets\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/')

  return `fushi-library://assets/${relativePath}`
}
