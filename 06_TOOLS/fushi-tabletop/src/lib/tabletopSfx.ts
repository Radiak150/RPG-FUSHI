import type { Howl } from 'howler'
import {
  TABLETOP_SFX_CATALOG,
  type TabletopSfxId,
} from '../data/audioCatalog'
import { resolveRuntimeAssetUrl } from './runtimeAssets'

interface PlayTabletopSfxOptions {
  rate?: number
  volume?: number
}

const MAX_ACTIVE_SFX_VOICES = 12
const howlCache = new Map<TabletopSfxId, Howl>()
const lastPlayedAt = new Map<TabletopSfxId, number>()
let howlConstructorPromise: Promise<typeof import('howler').Howl> | null = null
let activeVoices = 0

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function releaseVoice() {
  activeVoices = Math.max(0, activeVoices - 1)
}

async function getHowlConstructor() {
  if (!howlConstructorPromise) {
    howlConstructorPromise = import('howler').then((module) => module.Howl)
  }

  return howlConstructorPromise
}

async function getSfxHowl(id: TabletopSfxId) {
  const cached = howlCache.get(id)

  if (cached) {
    return cached
  }

  const HowlConstructor = await getHowlConstructor()
  const definition = TABLETOP_SFX_CATALOG[id]
  const howl = new HowlConstructor({
    html5: false,
    pool: 4,
    preload: true,
    src: [resolveRuntimeAssetUrl(definition.source)],
    volume: definition.defaultVolume,
    onend: releaseVoice,
    onplayerror: releaseVoice,
  })

  howlCache.set(id, howl)
  return howl
}

export async function playTabletopSfx(
  id: TabletopSfxId,
  options: PlayTabletopSfxOptions = {},
) {
  const definition = TABLETOP_SFX_CATALOG[id]
  const now = performance.now()
  const elapsed = now - (lastPlayedAt.get(id) ?? Number.NEGATIVE_INFINITY)

  if (elapsed < definition.cooldownMs) {
    return false
  }

  if (activeVoices >= MAX_ACTIVE_SFX_VOICES && definition.priority < 3) {
    return false
  }

  lastPlayedAt.set(id, now)

  try {
    const howl = await getSfxHowl(id)
    const soundId = howl.play()

    activeVoices += 1
    howl.volume(
      clamp(options.volume ?? definition.defaultVolume, 0, 1),
      soundId,
    )
    howl.rate(clamp(options.rate ?? 1, 0.75, 1.25), soundId)
    return true
  } catch {
    return false
  }
}

export async function preloadTabletopSfx(ids: TabletopSfxId[]) {
  await Promise.all(
    ids.map(async (id) => {
      try {
        const howl = await getSfxHowl(id)
        howl.load()
      } catch {
        return
      }
    }),
  )
}

export function disposeTabletopSfx() {
  howlCache.forEach((howl) => howl.unload())
  howlCache.clear()
  lastPlayedAt.clear()
  activeVoices = 0
}
