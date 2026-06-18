import {
  applyFushiLocalBackup,
  normalizeFushiLocalBackup,
} from '../localBackup'

const DEFAULT_CAMPAIGN_ID = 'campaign-local-default'

const TABLETOP_SESSION_STORAGE_KEY = 'fushi-tabletop:mesa-session:v1'
const TABLETOP_LIBRARY_STORAGE_KEY = 'fushi-tabletop:asset-library:v1'
const TABLETOP_WORLD_MUNDI_STORAGE_KEY = 'fushi-tabletop:world-mundi:v1'
const ACCESS_STORAGE_KEY = 'fushi-tabletop:access-control:v1'
const ACTIVE_ACCESS_SESSION_KEY = 'fushi-tabletop:active-access-profile:v1'
const PHYSICAL_PERSISTENCE_META_KEY = 'fushi-tabletop:physical-persistence:v1'
const TABLETOP_TRANSITION_SYNC_STORAGE_KEY = 'tabletop_session_state'
const TABLETOP_TRANSITION_OVERRIDES_STORAGE_KEY =
  'fushi-tabletop:transition-overrides:v1'
const TABLETOP_VIEW_STORAGE_KEY = 'fushi-tabletop:mesa-view:v1'
const CAMPAIGN_BACKUPS_STORAGE_KEY = 'fushi-tabletop:campaign-backups:v1'
const MASTER_WORKSPACE_STORAGE_KEY = 'fushi-tabletop:workspace:v1'

type DesktopStorageName =
  | 'access'
  | 'library'
  | 'mundi'
  | 'physicalPersistence'
  | 'session'
  | 'transitionOverrides'
  | 'transitionPlayback'
  | 'viewPreferences'
  | 'workspace'

interface SaveLibraryStateOptions {
  allowDestructiveReset?: boolean
  origin?: string
}

const desktopStorageActivity = {
  lastLoadAt: null as string | null,
  lastSaveAt: null as string | null,
  lastOperation: null as string | null,
}

function normalizeCampaignStorageId(campaignId?: string) {
  return campaignId?.trim() || DEFAULT_CAMPAIGN_ID
}

function shouldFallbackToLegacyStorage(campaignId?: string) {
  const normalizedCampaignId = normalizeCampaignStorageId(campaignId)

  return !campaignId || normalizedCampaignId === DEFAULT_CAMPAIGN_ID
}

function buildCampaignKey(baseKey: string, campaignId?: string) {
  const normalizedCampaignId = normalizeCampaignStorageId(campaignId)

  return `${baseKey}:campaign:${normalizedCampaignId}`
}

function readLocalStorageItem(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocalStorageItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return
  }
}

function removeLocalStorageItem(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    return
  }
}

function readSessionStorageItem(key: string) {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSessionStorageItem(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    return
  }
}

function removeSessionStorageItem(key: string) {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    return
  }
}

function parseJsonValue(rawValue: string | null): unknown {
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as unknown
  } catch {
    return null
  }
}

function stringifyJsonValue(value: unknown) {
  return JSON.stringify(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function countRecordKeys(value: unknown) {
  return isRecord(value) ? Object.keys(value).length : 0
}

interface LibraryDataSummary {
  customAmbienceTracks: number
  customMaps: number
  customMusicTracks: number
  customTransitions: number
  folders: number
  itemFolders: number
  mapOverrides: number
  total: number
}

function getLibraryDataSummary(value: unknown): LibraryDataSummary {
  const parsedValue = typeof value === 'string' ? parseJsonValue(value) : value

  if (!isRecord(parsedValue)) {
    return {
      customAmbienceTracks: 0,
      customMaps: 0,
      customMusicTracks: 0,
      customTransitions: 0,
      folders: 0,
      itemFolders: 0,
      mapOverrides: 0,
      total: 0,
    }
  }

  const itemFolders: number = isRecord(parsedValue.itemFolders)
    ? Object.values(parsedValue.itemFolders).reduce<number>(
        (total, item) => total + countRecordKeys(item),
        0,
      )
    : 0
  const summary = {
    customAmbienceTracks: Array.isArray(parsedValue.customAmbienceTracks)
      ? parsedValue.customAmbienceTracks.length
      : 0,
    customMaps: Array.isArray(parsedValue.customMaps)
      ? parsedValue.customMaps.length
      : 0,
    customMusicTracks: Array.isArray(parsedValue.customMusicTracks)
      ? parsedValue.customMusicTracks.length
      : 0,
    customTransitions: Array.isArray(parsedValue.customTransitions)
      ? parsedValue.customTransitions.length
      : 0,
    folders: Array.isArray(parsedValue.folders) ? parsedValue.folders.length : 0,
    itemFolders,
    mapOverrides: countRecordKeys(parsedValue.mapOverrides),
  }

  return {
    ...summary,
    total:
      summary.customAmbienceTracks +
      summary.customMaps +
      summary.customMusicTracks +
      summary.customTransitions +
      summary.folders +
      summary.itemFolders +
      summary.mapOverrides,
  }
}

function recordBlockedLibraryOverwrite(input: {
  campaignId?: string
  newSummary: ReturnType<typeof getLibraryDataSummary>
  oldSummary: ReturnType<typeof getLibraryDataSummary>
  origin?: string
}) {
  const payload = {
    campaignId: normalizeCampaignStorageId(input.campaignId),
    newCustomMaps: input.newSummary.customMaps,
    oldCustomMaps: input.oldSummary.customMaps,
    newTotal: input.newSummary.total,
    oldTotal: input.oldSummary.total,
    operation: 'blocked-empty-library-overwrite',
    origin: input.origin ?? 'unknown',
    stack: new Error().stack,
    timestamp: new Date().toISOString(),
  }

  console.warn('[FUSHI storage] Bloqueado overwrite destrutivo de library.', payload)
  writeLocalStorageItem(
    'fushi-tabletop:diagnostics:last-blocked-library-overwrite',
    stringifyJsonValue(payload),
  )
}

function shouldBlockDestructiveLibraryOverwrite(input: {
  campaignId?: string
  nextValue: unknown
  options?: SaveLibraryStateOptions
  previousValue: unknown
}) {
  if (input.options?.allowDestructiveReset) {
    return false
  }

  const oldSummary = getLibraryDataSummary(input.previousValue)
  const newSummary = getLibraryDataSummary(input.nextValue)

  if (oldSummary.total > 0 && newSummary.total === 0) {
    recordBlockedLibraryOverwrite({
      campaignId: input.campaignId,
      newSummary,
      oldSummary,
      origin: input.options?.origin,
    })

    return true
  }

  return false
}

function getDesktopApi() {
  return typeof window !== 'undefined' ? window.fushiDesktop : undefined
}

function loadDesktopJson(input: {
  campaignId?: string
  name: DesktopStorageName
  scope: 'app' | 'campaign'
}) {
  const value = getDesktopApi()?.loadJson(input) ?? null

  desktopStorageActivity.lastLoadAt = new Date().toISOString()
  desktopStorageActivity.lastOperation = `load:${input.scope}:${input.name}`

  return value
}

function saveDesktopJson(input: {
  campaignId?: string
  data: unknown
  name: DesktopStorageName
  scope: 'app' | 'campaign'
}) {
  const saved = getDesktopApi()?.saveJson(input)

  if (saved) {
    desktopStorageActivity.lastSaveAt = new Date().toISOString()
    desktopStorageActivity.lastOperation = `save:${input.scope}:${input.name}`
  }
}

function loadWithDesktopMigration<T>(input: {
  loadBrowser: () => T
  loadDesktop: () => T
  saveDesktop: (value: T) => void
}) {
  const desktopValue = input.loadDesktop()

  if (desktopValue !== null && desktopValue !== undefined) {
    return desktopValue
  }

  const browserValue = input.loadBrowser()

  if (browserValue !== null && browserValue !== undefined) {
    input.saveDesktop(browserValue)
  }

  return browserValue
}

function normalizePlayerAccessSnapshot(value: unknown): PlayerAccessStorageSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      activeProfileId: null,
      state: null,
    }
  }

  const snapshot = value as Partial<PlayerAccessStorageSnapshot>

  return {
    activeProfileId:
      typeof snapshot.activeProfileId === 'string' ? snapshot.activeProfileId : null,
    state: snapshot.state ?? null,
  }
}

function loadDesktopPlayerAccess(input: {
  campaignId?: string
  scope: 'app' | 'campaign'
}) {
  const value = loadDesktopJson({
    campaignId: input.campaignId,
    name: 'access',
    scope: input.scope,
  })

  return value === null || value === undefined
    ? null
    : normalizePlayerAccessSnapshot(value)
}

export interface PlayerAccessStorageSnapshot {
  activeProfileId: string | null
  state: unknown
}

export interface CampaignStorageExport {
  version: 1
  campaignId: string
  exportedAt: string
  campaignSession: unknown
  libraryState: unknown
  masterWorkspace: unknown
  mundiState: unknown
  playerAccess: PlayerAccessStorageSnapshot
  physicalPersistence: unknown
  simulationEvents?: unknown
}

export interface StorageAdapter {
  loadCampaignSession(campaignId?: string): unknown
  saveCampaignSession(campaignId: string | undefined, data: unknown): void
  clearCampaignSession(campaignId?: string): void

  loadMundiState(campaignId?: string): unknown
  saveMundiState(campaignId: string | undefined, data: unknown): void

  loadLibraryState(campaignId?: string): string | null
  saveLibraryState(
    campaignId: string | undefined,
    data: unknown,
    options?: SaveLibraryStateOptions,
  ): void

  loadPlayerAccess(campaignId?: string): PlayerAccessStorageSnapshot
  savePlayerAccess(campaignId: string | undefined, data: PlayerAccessStorageSnapshot): void

  loadPhysicalPersistence(campaignId?: string): unknown
  savePhysicalPersistence(campaignId: string | undefined, data: unknown): void

  loadCampaignBackups(campaignId?: string): unknown
  saveCampaignBackups(campaignId: string | undefined, data: unknown): void

  loadMasterWorkspace(): unknown
  saveMasterWorkspace(data: unknown): void

  loadTransitionPlaybackState(): unknown
  saveTransitionPlaybackState(data: unknown): void
  loadTransitionOverrides(campaignId?: string): unknown
  saveTransitionOverrides(campaignId: string | undefined, data: unknown): void

  loadViewPreferences(): unknown
  saveViewPreferences(data: unknown): void
  clearViewPreferences(): void

  countLocalStorageEntries(input: { prefix?: string; extraKeys?: string[] }): number

  exportCampaign(campaignId?: string): CampaignStorageExport
  importCampaign(data: unknown): boolean
}

export const BrowserStorageAdapter: StorageAdapter = {
  loadCampaignSession(campaignId) {
    const campaignValue = parseJsonValue(
      readLocalStorageItem(buildCampaignKey(TABLETOP_SESSION_STORAGE_KEY, campaignId)),
    )

    if (campaignValue !== null) {
      return campaignValue
    }

    return shouldFallbackToLegacyStorage(campaignId)
      ? parseJsonValue(readLocalStorageItem(TABLETOP_SESSION_STORAGE_KEY))
      : null
  },

  saveCampaignSession(campaignId, data) {
    writeLocalStorageItem(
      buildCampaignKey(TABLETOP_SESSION_STORAGE_KEY, campaignId),
      stringifyJsonValue(data),
    )
  },

  clearCampaignSession(campaignId) {
    removeLocalStorageItem(buildCampaignKey(TABLETOP_SESSION_STORAGE_KEY, campaignId))
  },

  loadMundiState(campaignId) {
    const campaignValue = parseJsonValue(
      readLocalStorageItem(buildCampaignKey(TABLETOP_WORLD_MUNDI_STORAGE_KEY, campaignId)),
    )

    if (campaignValue !== null) {
      return campaignValue
    }

    return shouldFallbackToLegacyStorage(campaignId)
      ? parseJsonValue(readLocalStorageItem(TABLETOP_WORLD_MUNDI_STORAGE_KEY))
      : null
  },

  saveMundiState(campaignId, data) {
    writeLocalStorageItem(
      buildCampaignKey(TABLETOP_WORLD_MUNDI_STORAGE_KEY, campaignId),
      stringifyJsonValue(data),
    )
  },

  loadLibraryState(campaignId) {
    const campaignValue = readLocalStorageItem(
      buildCampaignKey(TABLETOP_LIBRARY_STORAGE_KEY, campaignId),
    )

    if (campaignValue !== null) {
      return campaignValue
    }

    return shouldFallbackToLegacyStorage(campaignId)
      ? readLocalStorageItem(TABLETOP_LIBRARY_STORAGE_KEY)
      : null
  },

  saveLibraryState(campaignId, data, options) {
    const storageKey = buildCampaignKey(TABLETOP_LIBRARY_STORAGE_KEY, campaignId)
    const previousValue = readLocalStorageItem(storageKey)

    if (
      shouldBlockDestructiveLibraryOverwrite({
        campaignId,
        nextValue: data,
        options,
        previousValue,
      })
    ) {
      return
    }

    writeLocalStorageItem(
      storageKey,
      stringifyJsonValue(data),
    )
  },

  loadPlayerAccess(campaignId) {
    void campaignId

    return {
      activeProfileId: readSessionStorageItem(ACTIVE_ACCESS_SESSION_KEY),
      state: parseJsonValue(readLocalStorageItem(ACCESS_STORAGE_KEY)),
    }
  },

  savePlayerAccess(campaignId, data) {
    void campaignId

    if (data.activeProfileId) {
      writeSessionStorageItem(ACTIVE_ACCESS_SESSION_KEY, data.activeProfileId)
    } else {
      removeSessionStorageItem(ACTIVE_ACCESS_SESSION_KEY)
    }

    writeLocalStorageItem(ACCESS_STORAGE_KEY, stringifyJsonValue(data.state))
  },

  loadPhysicalPersistence(campaignId) {
    void campaignId

    return parseJsonValue(readLocalStorageItem(PHYSICAL_PERSISTENCE_META_KEY))
  },

  savePhysicalPersistence(campaignId, data) {
    void campaignId

    writeLocalStorageItem(PHYSICAL_PERSISTENCE_META_KEY, stringifyJsonValue(data))
  },

  loadCampaignBackups(campaignId) {
    return parseJsonValue(
      readLocalStorageItem(buildCampaignKey(CAMPAIGN_BACKUPS_STORAGE_KEY, campaignId)),
    )
  },

  saveCampaignBackups(campaignId, data) {
    writeLocalStorageItem(
      buildCampaignKey(CAMPAIGN_BACKUPS_STORAGE_KEY, campaignId),
      stringifyJsonValue(data),
    )
  },

  loadMasterWorkspace() {
    return parseJsonValue(readLocalStorageItem(MASTER_WORKSPACE_STORAGE_KEY))
  },

  saveMasterWorkspace(data) {
    writeLocalStorageItem(MASTER_WORKSPACE_STORAGE_KEY, stringifyJsonValue(data))
  },

  loadTransitionPlaybackState() {
    return parseJsonValue(readLocalStorageItem(TABLETOP_TRANSITION_SYNC_STORAGE_KEY))
  },

  saveTransitionPlaybackState(data) {
    writeLocalStorageItem(TABLETOP_TRANSITION_SYNC_STORAGE_KEY, stringifyJsonValue(data))
  },

  loadTransitionOverrides(campaignId) {
    const campaignValue = parseJsonValue(
      readLocalStorageItem(
        buildCampaignKey(TABLETOP_TRANSITION_OVERRIDES_STORAGE_KEY, campaignId),
      ),
    )

    if (campaignValue !== null) {
      return campaignValue
    }

    return shouldFallbackToLegacyStorage(campaignId)
      ? parseJsonValue(readLocalStorageItem(TABLETOP_TRANSITION_OVERRIDES_STORAGE_KEY))
      : null
  },

  saveTransitionOverrides(campaignId, data) {
    writeLocalStorageItem(
      buildCampaignKey(TABLETOP_TRANSITION_OVERRIDES_STORAGE_KEY, campaignId),
      stringifyJsonValue(data),
    )
  },

  loadViewPreferences() {
    return parseJsonValue(readSessionStorageItem(TABLETOP_VIEW_STORAGE_KEY))
  },

  saveViewPreferences(data) {
    writeSessionStorageItem(TABLETOP_VIEW_STORAGE_KEY, stringifyJsonValue(data))
  },

  clearViewPreferences() {
    removeSessionStorageItem(TABLETOP_VIEW_STORAGE_KEY)
  },

  countLocalStorageEntries(input) {
    let count = 0

    try {
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index)

        if (
          key &&
          ((input.prefix && key.startsWith(input.prefix)) ||
            input.extraKeys?.includes(key))
        ) {
          count += 1
        }
      }
    } catch {
      return 0
    }

    return count
  },

  exportCampaign(campaignId) {
    const normalizedCampaignId = normalizeCampaignStorageId(campaignId)

    return {
      version: 1,
      campaignId: normalizedCampaignId,
      exportedAt: new Date().toISOString(),
      campaignSession: this.loadCampaignSession(normalizedCampaignId),
      libraryState: parseJsonValue(this.loadLibraryState(normalizedCampaignId)),
      masterWorkspace: this.loadMasterWorkspace(),
      mundiState: this.loadMundiState(normalizedCampaignId),
      playerAccess: this.loadPlayerAccess(normalizedCampaignId),
      physicalPersistence: this.loadPhysicalPersistence(normalizedCampaignId),
    }
  },

  importCampaign(data) {
    const backup =
      normalizeFushiLocalBackup(data) ??
      (typeof data === 'object' && data !== null && 'backup' in data
        ? normalizeFushiLocalBackup((data as { backup?: unknown }).backup)
        : null)

    if (!backup) {
      return false
    }

    applyFushiLocalBackup(backup)
    return true
  },
}

export const DesktopStorageAdapter: StorageAdapter = {
  loadCampaignSession(campaignId) {
    return loadWithDesktopMigration({
      loadBrowser: () => BrowserStorageAdapter.loadCampaignSession(campaignId),
      loadDesktop: () =>
        loadDesktopJson({
          campaignId: normalizeCampaignStorageId(campaignId),
          name: 'session',
          scope: 'campaign',
        }),
      saveDesktop: (value) =>
        saveDesktopJson({
          campaignId: normalizeCampaignStorageId(campaignId),
          data: value,
          name: 'session',
          scope: 'campaign',
        }),
    })
  },

  saveCampaignSession(campaignId, data) {
    saveDesktopJson({
      campaignId: normalizeCampaignStorageId(campaignId),
      data,
      name: 'session',
      scope: 'campaign',
    })
  },

  clearCampaignSession(campaignId) {
    saveDesktopJson({
      campaignId: normalizeCampaignStorageId(campaignId),
      data: null,
      name: 'session',
      scope: 'campaign',
    })
  },

  loadMundiState(campaignId) {
    return loadWithDesktopMigration({
      loadBrowser: () => BrowserStorageAdapter.loadMundiState(campaignId),
      loadDesktop: () =>
        loadDesktopJson({
          campaignId: normalizeCampaignStorageId(campaignId),
          name: 'mundi',
          scope: 'campaign',
        }),
      saveDesktop: (value) =>
        saveDesktopJson({
          campaignId: normalizeCampaignStorageId(campaignId),
          data: value,
          name: 'mundi',
          scope: 'campaign',
        }),
    })
  },

  saveMundiState(campaignId, data) {
    saveDesktopJson({
      campaignId: normalizeCampaignStorageId(campaignId),
      data,
      name: 'mundi',
      scope: 'campaign',
    })
  },

  loadLibraryState(campaignId) {
    const value = loadWithDesktopMigration({
      loadBrowser: () => parseJsonValue(BrowserStorageAdapter.loadLibraryState(campaignId)),
      loadDesktop: () =>
        loadDesktopJson({
          campaignId: normalizeCampaignStorageId(campaignId),
          name: 'library',
          scope: 'campaign',
        }),
      saveDesktop: (nextValue) =>
        saveDesktopJson({
          campaignId: normalizeCampaignStorageId(campaignId),
          data: nextValue,
          name: 'library',
          scope: 'campaign',
        }),
    })

    return value === null || value === undefined ? null : stringifyJsonValue(value)
  },

  saveLibraryState(campaignId, data, options) {
    const normalizedCampaignId = normalizeCampaignStorageId(campaignId)
    const previousValue = loadDesktopJson({
      campaignId: normalizedCampaignId,
      name: 'library',
      scope: 'campaign',
    })

    if (
      shouldBlockDestructiveLibraryOverwrite({
        campaignId: normalizedCampaignId,
        nextValue: data,
        options,
        previousValue,
      })
    ) {
      return
    }

    saveDesktopJson({
      campaignId: normalizedCampaignId,
      data,
      name: 'library',
      scope: 'campaign',
    })
  },

  loadPlayerAccess(campaignId) {
    const scope = campaignId ? 'campaign' : 'app'
    const value = loadWithDesktopMigration({
      loadBrowser: () => BrowserStorageAdapter.loadPlayerAccess(campaignId),
      loadDesktop: () =>
        loadDesktopPlayerAccess({
          campaignId: campaignId ? normalizeCampaignStorageId(campaignId) : undefined,
          scope,
        }),
      saveDesktop: (nextValue) =>
        saveDesktopJson({
          campaignId: campaignId ? normalizeCampaignStorageId(campaignId) : undefined,
          data: nextValue,
          name: 'access',
          scope,
        }),
    })

    return normalizePlayerAccessSnapshot(value)
  },

  savePlayerAccess(campaignId, data) {
    saveDesktopJson({
      campaignId: campaignId ? normalizeCampaignStorageId(campaignId) : undefined,
      data: normalizePlayerAccessSnapshot(data),
      name: 'access',
      scope: campaignId ? 'campaign' : 'app',
    })
  },

  loadPhysicalPersistence(campaignId) {
    return loadWithDesktopMigration({
      loadBrowser: () => BrowserStorageAdapter.loadPhysicalPersistence(campaignId),
      loadDesktop: () =>
        loadDesktopJson({
          campaignId: campaignId ? normalizeCampaignStorageId(campaignId) : undefined,
          name: 'physicalPersistence',
          scope: campaignId ? 'campaign' : 'app',
        }),
      saveDesktop: (value) =>
        saveDesktopJson({
          campaignId: campaignId ? normalizeCampaignStorageId(campaignId) : undefined,
          data: value,
          name: 'physicalPersistence',
          scope: campaignId ? 'campaign' : 'app',
        }),
    })
  },

  savePhysicalPersistence(campaignId, data) {
    saveDesktopJson({
      campaignId: campaignId ? normalizeCampaignStorageId(campaignId) : undefined,
      data,
      name: 'physicalPersistence',
      scope: campaignId ? 'campaign' : 'app',
    })
  },

  loadCampaignBackups(campaignId) {
    const desktopBackups = getDesktopApi()?.loadBackups(normalizeCampaignStorageId(campaignId))

    if (Array.isArray(desktopBackups) && desktopBackups.length > 0) {
      return desktopBackups
    }

    const browserBackups = BrowserStorageAdapter.loadCampaignBackups(campaignId)

    if (Array.isArray(browserBackups) && browserBackups.length > 0) {
      getDesktopApi()?.saveBackups(normalizeCampaignStorageId(campaignId), browserBackups)
    }

    return browserBackups
  },

  saveCampaignBackups(campaignId, data) {
    getDesktopApi()?.saveBackups(normalizeCampaignStorageId(campaignId), data)
  },

  loadMasterWorkspace() {
    return loadWithDesktopMigration({
      loadBrowser: () => BrowserStorageAdapter.loadMasterWorkspace(),
      loadDesktop: () =>
        loadDesktopJson({
          name: 'workspace',
          scope: 'app',
        }),
      saveDesktop: (value) =>
        saveDesktopJson({
          data: value,
          name: 'workspace',
          scope: 'app',
        }),
    })
  },

  saveMasterWorkspace(data) {
    saveDesktopJson({
      data,
      name: 'workspace',
      scope: 'app',
    })
  },

  loadTransitionPlaybackState() {
    return loadWithDesktopMigration({
      loadBrowser: () => BrowserStorageAdapter.loadTransitionPlaybackState(),
      loadDesktop: () =>
        loadDesktopJson({
          name: 'transitionPlayback',
          scope: 'app',
        }),
      saveDesktop: (value) =>
        saveDesktopJson({
          data: value,
          name: 'transitionPlayback',
          scope: 'app',
        }),
    })
  },

  saveTransitionPlaybackState(data) {
    saveDesktopJson({
      data,
      name: 'transitionPlayback',
      scope: 'app',
    })
  },

  loadTransitionOverrides(campaignId) {
    return loadWithDesktopMigration({
      loadBrowser: () => BrowserStorageAdapter.loadTransitionOverrides(campaignId),
      loadDesktop: () =>
        loadDesktopJson({
          campaignId: normalizeCampaignStorageId(campaignId),
          name: 'transitionOverrides',
          scope: 'campaign',
        }),
      saveDesktop: (value) =>
        saveDesktopJson({
          campaignId: normalizeCampaignStorageId(campaignId),
          data: value,
          name: 'transitionOverrides',
          scope: 'campaign',
        }),
    })
  },

  saveTransitionOverrides(campaignId, data) {
    saveDesktopJson({
      campaignId: normalizeCampaignStorageId(campaignId),
      data,
      name: 'transitionOverrides',
      scope: 'campaign',
    })
  },

  loadViewPreferences() {
    return loadWithDesktopMigration({
      loadBrowser: () => BrowserStorageAdapter.loadViewPreferences(),
      loadDesktop: () =>
        loadDesktopJson({
          name: 'viewPreferences',
          scope: 'app',
        }),
      saveDesktop: (value) =>
        saveDesktopJson({
          data: value,
          name: 'viewPreferences',
          scope: 'app',
        }),
    })
  },

  saveViewPreferences(data) {
    saveDesktopJson({
      data,
      name: 'viewPreferences',
      scope: 'app',
    })
  },

  clearViewPreferences() {
    saveDesktopJson({
      data: null,
      name: 'viewPreferences',
      scope: 'app',
    })
  },

  countLocalStorageEntries(input) {
    return BrowserStorageAdapter.countLocalStorageEntries(input)
  },

  exportCampaign(campaignId) {
    const normalizedCampaignId = normalizeCampaignStorageId(campaignId)

    return {
      version: 1,
      campaignId: normalizedCampaignId,
      exportedAt: new Date().toISOString(),
      campaignSession: this.loadCampaignSession(normalizedCampaignId),
      libraryState: parseJsonValue(this.loadLibraryState(normalizedCampaignId)),
      masterWorkspace: this.loadMasterWorkspace(),
      mundiState: this.loadMundiState(normalizedCampaignId),
      playerAccess: this.loadPlayerAccess(normalizedCampaignId),
      physicalPersistence: this.loadPhysicalPersistence(normalizedCampaignId),
    }
  },

  importCampaign(data) {
    return BrowserStorageAdapter.importCampaign(data)
  },
}

export const storageAdapter = getDesktopApi() ? DesktopStorageAdapter : BrowserStorageAdapter

export function getStorageAdapterDiagnostics(campaignId?: string) {
  const normalizedCampaignId = normalizeCampaignStorageId(campaignId)
  const desktopStatus = getDesktopApi()?.getStorageStatus(normalizedCampaignId) ?? null

  return {
    desktopStatus,
    isDesktop: Boolean(getDesktopApi()),
    lastLoadAt:
      desktopStatus?.activity?.lastLoadAt ?? desktopStorageActivity.lastLoadAt,
    lastOperation:
      desktopStatus?.activity?.lastOperation ?? desktopStorageActivity.lastOperation,
    lastSaveAt:
      desktopStatus?.activity?.lastSaveAt ?? desktopStorageActivity.lastSaveAt,
  }
}

export function forceSaveCampaignStorage(campaignId?: string) {
  const normalizedCampaignId = normalizeCampaignStorageId(campaignId)
  const campaignSession = storageAdapter.loadCampaignSession(normalizedCampaignId)
  const libraryState = storageAdapter.loadLibraryState(normalizedCampaignId)
  const mundiState = storageAdapter.loadMundiState(normalizedCampaignId)
  const playerAccess = storageAdapter.loadPlayerAccess(normalizedCampaignId)
  const physicalPersistence = storageAdapter.loadPhysicalPersistence(normalizedCampaignId)
  const transitionOverrides = storageAdapter.loadTransitionOverrides(normalizedCampaignId)
  const masterWorkspace = storageAdapter.loadMasterWorkspace()

  if (campaignSession !== null && campaignSession !== undefined) {
    storageAdapter.saveCampaignSession(normalizedCampaignId, campaignSession)
  }

  if (libraryState !== null && libraryState !== undefined) {
    storageAdapter.saveLibraryState(
      normalizedCampaignId,
      parseJsonValue(libraryState),
      { origin: 'forceSaveCampaignStorage' },
    )
  }

  if (mundiState !== null && mundiState !== undefined) {
    storageAdapter.saveMundiState(normalizedCampaignId, mundiState)
  }

  storageAdapter.savePlayerAccess(normalizedCampaignId, playerAccess)

  if (physicalPersistence !== null && physicalPersistence !== undefined) {
    storageAdapter.savePhysicalPersistence(normalizedCampaignId, physicalPersistence)
  }

  if (transitionOverrides !== null && transitionOverrides !== undefined) {
    storageAdapter.saveTransitionOverrides(normalizedCampaignId, transitionOverrides)
  }

  if (masterWorkspace !== null && masterWorkspace !== undefined) {
    storageAdapter.saveMasterWorkspace(masterWorkspace)
  }
}
