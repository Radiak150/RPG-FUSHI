const BACKUP_APP_ID = 'fushi-tabletop'
const BACKUP_SCHEMA_VERSION = 1
const LOCAL_STORAGE_PREFIX = 'fushi-tabletop:'
const EXTRA_LOCAL_STORAGE_KEYS = ['tabletop_session_state']
const EXTRA_SESSION_STORAGE_KEYS = ['transition-uploads']

export interface FushiLocalBackup {
  appId: typeof BACKUP_APP_ID
  schemaVersion: typeof BACKUP_SCHEMA_VERSION
  exportedAt: string
  origin: string
  localStorage: Record<string, string>
  sessionStorage: Record<string, string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readStorageValue(storage: Storage, key: string) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function writeStorageValue(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function collectStorageEntries(input: {
  storage: Storage
  prefix?: string
  extraKeys?: string[]
}) {
  const entries: Record<string, string> = {}

  for (let index = 0; index < input.storage.length; index += 1) {
    const key = input.storage.key(index)

    if (!key || (input.prefix && !key.startsWith(input.prefix))) {
      continue
    }

    const value = readStorageValue(input.storage, key)

    if (typeof value === 'string') {
      entries[key] = value
    }
  }

  input.extraKeys?.forEach((key) => {
    const value = readStorageValue(input.storage, key)

    if (typeof value === 'string') {
      entries[key] = value
    }
  })

  return entries
}

function sanitizeFilePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function createFushiLocalBackup(): FushiLocalBackup {
  return {
    appId: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    origin: window.location.origin,
    localStorage: collectStorageEntries({
      storage: window.localStorage,
      prefix: LOCAL_STORAGE_PREFIX,
      extraKeys: EXTRA_LOCAL_STORAGE_KEYS,
    }),
    sessionStorage: collectStorageEntries({
      storage: window.sessionStorage,
      extraKeys: EXTRA_SESSION_STORAGE_KEYS,
    }),
  }
}

export function getFushiBackupSummary(backup: FushiLocalBackup) {
  return {
    localStorageKeys: Object.keys(backup.localStorage).length,
    sessionStorageKeys: Object.keys(backup.sessionStorage).length,
  }
}

export function createFushiBackupFilename(label = 'backup') {
  const datePart = new Date().toISOString().slice(0, 10)
  const labelPart = sanitizeFilePart(label) || 'backup'

  return `fushi-tabletop-${labelPart}-${datePart}.json`
}

export function downloadFushiLocalBackup(backup: FushiLocalBackup, filename: string) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function parseStorageMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === 'string' && typeof entry[1] === 'string',
    ),
  )
}

export function normalizeFushiLocalBackup(value: unknown): FushiLocalBackup | null {
  if (!isRecord(value)) {
    return null
  }

  if (value.appId === BACKUP_APP_ID && value.schemaVersion === BACKUP_SCHEMA_VERSION) {
    return {
      appId: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt:
        typeof value.exportedAt === 'string'
          ? value.exportedAt
          : new Date().toISOString(),
      origin: typeof value.origin === 'string' ? value.origin : '',
      localStorage: parseStorageMap(value.localStorage),
      sessionStorage: parseStorageMap(value.sessionStorage),
    }
  }

  if (value.version === 1 && Array.isArray(value.characters)) {
    return {
      appId: BACKUP_APP_ID,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      origin: '',
      localStorage: {
        'fushi-tabletop:workspace:v1': JSON.stringify(value),
      },
      sessionStorage: {},
    }
  }

  return null
}

export function applyFushiLocalBackup(backup: FushiLocalBackup) {
  let restoredKeys = 0

  Object.entries(backup.localStorage).forEach(([key, value]) => {
    if (!key.startsWith(LOCAL_STORAGE_PREFIX) && !EXTRA_LOCAL_STORAGE_KEYS.includes(key)) {
      return
    }

    if (writeStorageValue(window.localStorage, key, value)) {
      restoredKeys += 1
    }
  })

  Object.entries(backup.sessionStorage).forEach(([key, value]) => {
    if (!EXTRA_SESSION_STORAGE_KEYS.includes(key)) {
      return
    }

    if (writeStorageValue(window.sessionStorage, key, value)) {
      restoredKeys += 1
    }
  })

  return restoredKeys
}

export function readJsonFile(file: File) {
  return new Promise<unknown>((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error('Nao foi possivel ler o arquivo de backup.'))
    }

    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result ?? '')))
      } catch {
        reject(new Error('Arquivo de backup invalido.'))
      }
    }

    reader.readAsText(file)
  })
}
