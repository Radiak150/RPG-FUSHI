import { uploadDataUrlAsPhysicalAsset } from './physicalAssets'

const MIGRATION_META_KEY = 'fushi-tabletop:physical-asset-migration:v1'
const STORAGE_KEY_PREFIX = 'fushi-tabletop:'
const EXTRA_STORAGE_KEYS = ['tabletop_session_state', 'transition-uploads']
const DATA_URL_PATTERN =
  /data:(?:image|audio|video)\/[a-zA-Z0-9.+-]+(?:;[a-zA-Z0-9=.+-]+)*;base64,[A-Za-z0-9+/=]+/g

interface PhysicalAssetMigrationMeta {
  lastRunAt?: string
  migratedCount?: number
}

interface PhysicalAssetMigrationResult {
  changed: boolean
  migratedCount: number
}

function readStorageKeys(storage: Storage) {
  const keys: string[] = []

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)

    if (
      key &&
      (key.startsWith(STORAGE_KEY_PREFIX) || EXTRA_STORAGE_KEYS.includes(key)) &&
      key !== MIGRATION_META_KEY
    ) {
      keys.push(key)
    }
  }

  return keys
}

function readMigrationMeta(): PhysicalAssetMigrationMeta {
  try {
    const rawValue = window.localStorage.getItem(MIGRATION_META_KEY)

    if (!rawValue) {
      return {}
    }

    const parsedValue = JSON.parse(rawValue) as unknown

    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
      return {}
    }

    return {
      lastRunAt:
        typeof (parsedValue as { lastRunAt?: unknown }).lastRunAt === 'string'
          ? (parsedValue as { lastRunAt: string }).lastRunAt
          : undefined,
      migratedCount:
        typeof (parsedValue as { migratedCount?: unknown }).migratedCount === 'number'
          ? (parsedValue as { migratedCount: number }).migratedCount
          : undefined,
    }
  } catch {
    return {}
  }
}

function writeMigrationMeta(meta: PhysicalAssetMigrationMeta) {
  try {
    window.localStorage.setItem(
      MIGRATION_META_KEY,
      JSON.stringify({
        ...readMigrationMeta(),
        ...meta,
      }),
    )
  } catch {
    return
  }
}

function getUniqueDataUrls(value: string) {
  const matches = value.match(DATA_URL_PATTERN) ?? []

  return Array.from(new Set(matches))
}

async function migrateStorage(storage: Storage, replacementCache: Map<string, string>) {
  let migratedCount = 0

  for (const key of readStorageKeys(storage)) {
    const currentValue = storage.getItem(key)

    if (!currentValue || !currentValue.includes('data:')) {
      continue
    }

    const dataUrls = getUniqueDataUrls(currentValue)

    if (dataUrls.length === 0) {
      continue
    }

    let nextValue = currentValue

    for (const dataUrl of dataUrls) {
      let physicalUrl = replacementCache.get(dataUrl)

      if (!physicalUrl) {
        const uploadedAsset = await uploadDataUrlAsPhysicalAsset(
          dataUrl,
          `migrated-${key.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 48)}`,
        )

        physicalUrl = uploadedAsset.url
        replacementCache.set(dataUrl, physicalUrl)
        migratedCount += 1
      }

      nextValue = nextValue.split(dataUrl).join(physicalUrl)
    }

    if (nextValue !== currentValue) {
      storage.setItem(key, nextValue)
    }
  }

  return migratedCount
}

export async function migratePersistedDataUrlsToPhysicalAssets(): Promise<PhysicalAssetMigrationResult> {
  const replacementCache = new Map<string, string>()
  let migratedCount = 0

  try {
    migratedCount += await migrateStorage(window.localStorage, replacementCache)
    migratedCount += await migrateStorage(window.sessionStorage, replacementCache)
  } catch {
    return {
      changed: false,
      migratedCount,
    }
  }

  writeMigrationMeta({
    lastRunAt: new Date().toISOString(),
    migratedCount: (readMigrationMeta().migratedCount ?? 0) + migratedCount,
  })

  return {
    changed: migratedCount > 0,
    migratedCount,
  }
}

