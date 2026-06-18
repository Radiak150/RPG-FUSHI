import {
  applyFushiLocalBackup,
  createFushiLocalBackup,
  normalizeFushiLocalBackup,
  type FushiLocalBackup,
} from './localBackup'
import { storageAdapter } from './storage/storageAdapter'

const PHYSICAL_PERSISTENCE_ENDPOINT = '/api/fushi/persistence/state'
const PHYSICAL_PERSISTENCE_META_KEY = 'fushi-tabletop:physical-persistence:v1'
const LOCAL_STORAGE_PREFIX = 'fushi-tabletop:'
const EXTRA_LOCAL_STORAGE_KEYS = ['tabletop_session_state']
const EXTRA_SESSION_STORAGE_KEYS = ['transition-uploads']

interface PhysicalPersistenceMeta {
  hydratedAt?: string
  lastSavedAt?: string
  origin?: string
  storagePath?: string
}

interface PhysicalPersistenceHydrationResult {
  applied: boolean
  exists: boolean
  error?: string
  storagePath?: string
}

interface PhysicalPersistenceSaveResult {
  ok: boolean
  error?: string
  signature: string
  storagePath?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readPhysicalPersistenceMeta(): PhysicalPersistenceMeta {
  const parsedValue = storageAdapter.loadPhysicalPersistence()

  if (!isRecord(parsedValue)) {
    return {}
  }

  return {
    hydratedAt:
      typeof parsedValue.hydratedAt === 'string' ? parsedValue.hydratedAt : undefined,
    lastSavedAt:
      typeof parsedValue.lastSavedAt === 'string' ? parsedValue.lastSavedAt : undefined,
    origin: typeof parsedValue.origin === 'string' ? parsedValue.origin : undefined,
    storagePath:
      typeof parsedValue.storagePath === 'string' ? parsedValue.storagePath : undefined,
  }
}

function writePhysicalPersistenceMeta(meta: PhysicalPersistenceMeta) {
  storageAdapter.savePhysicalPersistence(undefined, {
      ...readPhysicalPersistenceMeta(),
      ...meta,
    })
}

function isDesktopRuntime() {
  return typeof window !== 'undefined' && Boolean(window.fushiDesktop)
}

function getLocalStorageEntryCount() {
  return storageAdapter.countLocalStorageEntries({
    extraKeys: EXTRA_LOCAL_STORAGE_KEYS,
    prefix: LOCAL_STORAGE_PREFIX,
  })
}

function stripVolatileEntries(backup: FushiLocalBackup) {
  const localStorageEntries = Object.fromEntries(
    Object.entries(backup.localStorage).filter(
      ([key]) => key !== PHYSICAL_PERSISTENCE_META_KEY,
    ),
  )

  return {
    localStorage: localStorageEntries,
    sessionStorage: backup.sessionStorage,
  }
}

function createBackupSignature(backup: FushiLocalBackup) {
  return JSON.stringify(stripVolatileEntries(backup))
}

function parseDateTime(value?: string) {
  if (!value) {
    return 0
  }

  const time = Date.parse(value)

  return Number.isFinite(time) ? time : 0
}

function shouldApplyDiskBackup(backup: FushiLocalBackup) {
  const localEntryCount = getLocalStorageEntryCount()
  const localMeta = readPhysicalPersistenceMeta()
  const localSavedAt = parseDateTime(localMeta.lastSavedAt)
  const diskSavedAt = parseDateTime(backup.exportedAt)

  if (localEntryCount === 0) {
    return true
  }

  if (!localMeta.lastSavedAt) {
    return false
  }

  return diskSavedAt > localSavedAt + 1000
}

function createSaveBackup() {
  const signatureBackup = createFushiLocalBackup()
  const signature = createBackupSignature(signatureBackup)
  const savedAt = new Date().toISOString()

  writePhysicalPersistenceMeta({
    lastSavedAt: savedAt,
    origin: window.location.origin,
  })

  const backup = createFushiLocalBackup()
  backup.exportedAt = savedAt

  return {
    backup,
    signature,
  }
}

export async function hydratePhysicalPersistence(): Promise<PhysicalPersistenceHydrationResult> {
  if (isDesktopRuntime()) {
    writePhysicalPersistenceMeta({
      hydratedAt: new Date().toISOString(),
      origin: 'electron',
      storagePath: window.fushiDesktop?.getAppInfo().dataDir,
    })

    return {
      applied: false,
      exists: true,
      storagePath: window.fushiDesktop?.getAppInfo().dataDir,
    }
  }

  try {
    const response = await fetch(PHYSICAL_PERSISTENCE_ENDPOINT, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        applied: false,
        exists: false,
        error: `Servidor respondeu ${response.status}.`,
      }
    }

    const payload = (await response.json()) as unknown

    if (!isRecord(payload) || payload.ok !== true) {
      return {
        applied: false,
        exists: false,
        error: 'Resposta de autosave invalida.',
      }
    }

    const backup = normalizeFushiLocalBackup(payload.backup)
    const storagePath =
      typeof payload.storagePath === 'string' ? payload.storagePath : undefined

    if (!backup) {
      return {
        applied: false,
        exists: payload.exists === true,
        storagePath,
      }
    }

    if (shouldApplyDiskBackup(backup)) {
      applyFushiLocalBackup(backup)
      writePhysicalPersistenceMeta({
        hydratedAt: new Date().toISOString(),
        lastSavedAt: backup.exportedAt,
        origin: window.location.origin,
        storagePath,
      })

      return {
        applied: true,
        exists: true,
        storagePath,
      }
    }

    return {
      applied: false,
      exists: true,
      storagePath,
    }
  } catch (error) {
    return {
      applied: false,
      exists: false,
      error: error instanceof Error ? error.message : 'Autosave indisponivel.',
    }
  }
}

export async function savePhysicalPersistence(
  lastSignature = '',
  force = false,
): Promise<PhysicalPersistenceSaveResult> {
  const { backup, signature } = createSaveBackup()

  if (!force && signature === lastSignature) {
    return {
      ok: true,
      signature,
    }
  }

  if (isDesktopRuntime()) {
    writePhysicalPersistenceMeta({
      lastSavedAt: backup.exportedAt,
      origin: 'electron',
      storagePath: window.fushiDesktop?.getAppInfo().dataDir,
    })

    return {
      ok: true,
      signature,
      storagePath: window.fushiDesktop?.getAppInfo().dataDir,
    }
  }

  try {
    const response = await fetch(PHYSICAL_PERSISTENCE_ENDPOINT, {
      body: JSON.stringify({ backup }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    const payload = (await response.json()) as unknown

    if (!response.ok || !isRecord(payload) || payload.ok !== true) {
      return {
        ok: false,
        error: isRecord(payload) && typeof payload.error === 'string'
          ? payload.error
          : `Servidor respondeu ${response.status}.`,
        signature: lastSignature,
      }
    }

    const storagePath =
      typeof payload.storagePath === 'string' ? payload.storagePath : undefined

    writePhysicalPersistenceMeta({
      lastSavedAt: backup.exportedAt,
      origin: window.location.origin,
      storagePath,
    })

    return {
      ok: true,
      signature,
      storagePath,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Autosave indisponivel.',
      signature: lastSignature,
    }
  }
}

export function createPhysicalPersistenceSignature() {
  return createBackupSignature(createFushiLocalBackup())
}

export function getPhysicalPersistenceStorageKeys() {
  return {
    extraLocalStorageKeys: EXTRA_LOCAL_STORAGE_KEYS,
    extraSessionStorageKeys: EXTRA_SESSION_STORAGE_KEYS,
    localStoragePrefix: LOCAL_STORAGE_PREFIX,
    metaKey: PHYSICAL_PERSISTENCE_META_KEY,
  }
}
