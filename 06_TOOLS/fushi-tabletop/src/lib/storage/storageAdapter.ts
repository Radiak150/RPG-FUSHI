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
  mundiState: unknown
  playerAccess: PlayerAccessStorageSnapshot
  physicalPersistence: unknown
}

export interface StorageAdapter {
  loadCampaignSession(campaignId?: string): unknown
  saveCampaignSession(campaignId: string | undefined, data: unknown): void
  clearCampaignSession(campaignId?: string): void

  loadMundiState(campaignId?: string): unknown
  saveMundiState(campaignId: string | undefined, data: unknown): void

  loadLibraryState(campaignId?: string): string | null
  saveLibraryState(campaignId: string | undefined, data: unknown): void

  loadPlayerAccess(campaignId?: string): PlayerAccessStorageSnapshot
  savePlayerAccess(campaignId: string | undefined, data: PlayerAccessStorageSnapshot): void

  loadPhysicalPersistence(campaignId?: string): unknown
  savePhysicalPersistence(campaignId: string | undefined, data: unknown): void

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

  saveLibraryState(campaignId, data) {
    writeLocalStorageItem(
      buildCampaignKey(TABLETOP_LIBRARY_STORAGE_KEY, campaignId),
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

export const storageAdapter = BrowserStorageAdapter
