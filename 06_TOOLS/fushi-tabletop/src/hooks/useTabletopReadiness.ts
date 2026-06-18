import { useEffect, useState } from 'react'

export type TabletopReadinessAssetKind = 'image' | 'media' | 'model' | 'other'
export type TabletopReadinessItemStatus = 'pending' | 'loading' | 'ready' | 'failed'

export interface TabletopReadinessAsset {
  id: string
  kind?: TabletopReadinessAssetKind
  label: string
  required?: boolean
  url: string
}

export interface TabletopReadinessItem extends TabletopReadinessAsset {
  kind: TabletopReadinessAssetKind
  status: TabletopReadinessItemStatus
}

export interface TabletopReadinessWarning {
  id: string
  label: string
  message: string
  required: boolean
}

interface UseTabletopReadinessInput {
  assets: TabletopReadinessAsset[]
  enabled: boolean
  key: string
  timeoutMs?: number
}

interface TabletopReadinessState {
  completed: number
  isReady: boolean
  items: TabletopReadinessItem[]
  phase: string
  progress: number
  requiredFailures: number
  total: number
  warnings: TabletopReadinessWarning[]
}

const DEFAULT_TIMEOUT_MS = 45000
const MAX_PARALLEL_PRELOADS = 4

function getUrlExtension(value: string) {
  const cleanValue = value.split('?')[0].split('#')[0].toLowerCase()
  const match = /\.([a-z0-9]+)$/.exec(cleanValue)

  return match?.[1] ?? ''
}

function inferAssetKind(url: string): TabletopReadinessAssetKind {
  const extension = getUrlExtension(url)

  if (
    extension === 'png' ||
    extension === 'jpg' ||
    extension === 'jpeg' ||
    extension === 'webp' ||
    extension === 'gif' ||
    extension === 'svg' ||
    extension === 'avif'
  ) {
    return 'image'
  }

  if (
    extension === 'mp3' ||
    extension === 'ogg' ||
    extension === 'wav' ||
    extension === 'flac' ||
    extension === 'aac' ||
    extension === 'm4a' ||
    extension === 'mp4' ||
    extension === 'webm' ||
    extension === 'mov'
  ) {
    return 'media'
  }

  if (extension === 'glb' || extension === 'gltf' || extension === 'fbx' || extension === 'obj') {
    return 'model'
  }

  return 'other'
}

function normalizeReadinessAssets(assets: TabletopReadinessAsset[]) {
  const seen = new Set<string>()
  const normalized: TabletopReadinessItem[] = []

  assets.forEach((asset) => {
    const url = asset.url.trim()

    if (!url) {
      return
    }

    const dedupeKey = `${asset.kind ?? inferAssetKind(url)}:${url}`

    if (seen.has(dedupeKey)) {
      return
    }

    seen.add(dedupeKey)
    normalized.push({
      ...asset,
      kind: asset.kind ?? inferAssetKind(url),
      required: asset.required === true,
      status: 'pending',
      url,
    })
  })

  return normalized
}

function createTimeout(timeoutMs: number, onTimeout: () => void) {
  const timeoutId = window.setTimeout(onTimeout, timeoutMs)

  return () => window.clearTimeout(timeoutId)
}

function isDataUrl(url: string) {
  return url.startsWith('data:')
}

function hasDesktopAsset(url: string) {
  try {
    return window.fushiDesktop?.assetExists(url) === true
  } catch {
    return false
  }
}

function preloadImageAsset(asset: TabletopReadinessItem, timeoutMs: number) {
  if (isDataUrl(asset.url)) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const image = new Image()
    let settled = false
    const cleanupTimeout = createTimeout(timeoutMs, () => {
      settle(() => reject(new Error('tempo limite')))
    })

    function settle(callback: () => void) {
      if (settled) {
        return
      }

      settled = true
      cleanupTimeout()
      image.onload = null
      image.onerror = null
      callback()
    }

    image.decoding = 'async'
    image.onload = () => {
      const decode = typeof image.decode === 'function' ? image.decode() : Promise.resolve()

      decode
        .catch(() => undefined)
        .finally(() => settle(resolve))
    }
    image.onerror = () => settle(() => reject(new Error('imagem indisponivel')))
    image.src = asset.url
  })
}

function preloadMediaAsset(asset: TabletopReadinessItem, timeoutMs: number) {
  if (isDataUrl(asset.url)) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const extension = getUrlExtension(asset.url)
    const media =
      extension === 'mp4' || extension === 'webm' || extension === 'mov'
        ? document.createElement('video')
        : document.createElement('audio')
    let settled = false
    const cleanupTimeout = createTimeout(timeoutMs, () => {
      settle(() => reject(new Error('tempo limite')))
    })

    function settle(callback: () => void) {
      if (settled) {
        return
      }

      settled = true
      cleanupTimeout()
      media.onloadedmetadata = null
      media.oncanplay = null
      media.onerror = null
      media.removeAttribute('src')
      media.load()
      callback()
    }

    media.preload = 'metadata'
    media.muted = true
    media.onloadedmetadata = () => settle(resolve)
    media.oncanplay = () => settle(resolve)
    media.onerror = () => settle(() => reject(new Error('midia indisponivel')))
    media.src = asset.url
    media.load()
  })
}

async function preloadFetchableAsset(asset: TabletopReadinessItem, timeoutMs: number) {
  if (isDataUrl(asset.url) || hasDesktopAsset(asset.url)) {
    return
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(asset.url, {
      method: 'HEAD',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`status ${response.status}`)
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function preloadAsset(asset: TabletopReadinessItem, timeoutMs: number) {
  if (asset.kind === 'image') {
    return preloadImageAsset(asset, timeoutMs)
  }

  if (asset.kind === 'media') {
    return preloadMediaAsset(asset, timeoutMs)
  }

  return preloadFetchableAsset(asset, timeoutMs)
}

function buildInitialState(items: TabletopReadinessItem[]): TabletopReadinessState {
  return {
    completed: 0,
    isReady: items.length === 0,
    items,
    phase: items.length === 0 ? 'Mesa pronta.' : 'Preparando assets da cena...',
    progress: items.length === 0 ? 100 : 3,
    requiredFailures: 0,
    total: items.length,
    warnings: [],
  }
}

export function useTabletopReadiness({
  assets,
  enabled,
  key,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: UseTabletopReadinessInput) {
  const [attempt, setAttempt] = useState(0)
  const [forceReadyKey, setForceReadyKey] = useState('')
  const [readyKeys] = useState(() => new Set<string>())
  const normalizedAssets = normalizeReadinessAssets(assets)
  const assetSignature = normalizedAssets
    .map((asset) => `${asset.id}:${asset.kind}:${asset.required ? 'required' : 'optional'}:${asset.url}`)
    .join('|')
  const preloadKey = `${key}:${assetSignature}`
  const [state, setState] = useState<TabletopReadinessState>(() =>
    buildInitialState([]),
  )

  useEffect(() => {
    let cancelled = false
    const startTimerId = window.setTimeout(() => {
      if (cancelled) {
        return
      }

      if (!enabled) {
        setState({
          completed: 0,
          isReady: true,
          items: [],
          phase: 'Mesa pronta.',
          progress: 100,
          requiredFailures: 0,
          total: 0,
          warnings: [],
        })
        return
      }

      let completed = 0
      let requiredCompleted = 0
      let requiredFailures = 0
      const warnings: TabletopReadinessWarning[] = []
      const items = normalizedAssets.map((asset) => ({
        ...asset,
        status: 'pending' as const,
      }))
      const requiredTotal = items.filter((item) => item.required).length
      const shouldKeepSceneReady = readyKeys.has(key) || forceReadyKey === key

      setState({
        ...buildInitialState(items),
        isReady: shouldKeepSceneReady || requiredTotal === 0,
        phase:
          shouldKeepSceneReady || requiredTotal === 0
            ? 'Mesa pronta.'
            : items.length === 0
              ? 'Mesa pronta.'
              : 'Preparando assets da cena...',
        progress: shouldKeepSceneReady || requiredTotal === 0 ? 100 : items.length === 0 ? 100 : 3,
      })

      if (items.length === 0) {
        readyKeys.add(key)
        return
      }

      function updateItem(assetId: string, status: TabletopReadinessItemStatus) {
        setState((currentState) => ({
          ...currentState,
          items: currentState.items.map((item) =>
            item.id === assetId ? { ...item, status } : item,
          ),
        }))
      }

      function markCompleted(asset: TabletopReadinessItem, status: 'ready' | 'failed') {
        completed += 1

        if (status === 'failed' && asset.required) {
          requiredFailures += 1
        }

        if (asset.required) {
          requiredCompleted += 1
        }

        const progress = Math.max(8, Math.round((completed / items.length) * 100))
        const done = completed >= items.length
        const requiredDone = requiredCompleted >= requiredTotal
        const sceneReady =
          shouldKeepSceneReady || requiredTotal === 0 || (requiredDone && requiredFailures === 0)

        if (sceneReady && requiredFailures === 0) {
          readyKeys.add(key)
        }

        setState((currentState) => ({
          ...currentState,
          completed,
          isReady: sceneReady,
          items: currentState.items.map((item) =>
            item.id === asset.id ? { ...item, status } : item,
          ),
          phase: sceneReady
            ? 'Mesa pronta.'
            : done
            ? requiredFailures > 0
              ? 'A mesa encontrou assets criticos indisponiveis.'
              : 'Mesa pronta.'
            : asset.kind === 'media'
              ? 'Preparando midia da cena...'
              : asset.kind === 'model'
                ? 'Conferindo objetos 3D...'
                : 'Carregando imagens da cena...',
          progress,
          requiredFailures,
          warnings: [...warnings],
        }))
      }

      async function runWorker(queue: TabletopReadinessItem[]) {
        while (!cancelled) {
          const asset = queue.shift()

          if (!asset) {
            return
          }

          updateItem(asset.id, 'loading')

          try {
            await preloadAsset(asset, timeoutMs)

            if (!cancelled) {
              markCompleted(asset, 'ready')
            }
          } catch (error) {
            warnings.push({
              id: asset.id,
              label: asset.label,
              message: error instanceof Error ? error.message : 'asset indisponivel',
              required: asset.required === true,
            })

            if (!cancelled) {
              markCompleted(asset, 'failed')
            }
          }
        }
      }

      const queue = [...items]
      const workerCount = Math.min(MAX_PARALLEL_PRELOADS, queue.length)

      for (let index = 0; index < workerCount; index += 1) {
        void runWorker(queue)
      }
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(startTimerId)
    }
    // normalizedAssets is represented by readinessKey; this avoids restarting
    // preloading when React recreates an equivalent asset array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, enabled, preloadKey, timeoutMs])

  const requiredItems = state.items.filter((item) => item.required)
  const requiredItemsChecked = requiredItems.every(
    (item) => item.status === 'ready' || item.status === 'failed',
  )
  const isReady = state.isReady || forceReadyKey === key || readyKeys.has(key)

  return {
    ...state,
    canContinue: requiredItemsChecked && state.requiredFailures > 0,
    isReady,
    retry: () => setAttempt((currentAttempt) => currentAttempt + 1),
    continueAnyway: () => setForceReadyKey(key),
  }
}
