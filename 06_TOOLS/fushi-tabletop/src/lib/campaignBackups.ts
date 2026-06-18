import type { LocalCampaign } from '../data/types'
import {
  createCampaignExportFile,
  downloadJsonFile,
  saveImportedCampaignStorage,
  type FushiCampaignExportFile,
} from './campaignTransfer'
import { storageAdapter } from './storage/storageAdapter'

export const CAMPAIGN_BACKUP_LIMIT = 5
export const CAMPAIGN_AUTOBACKUP_INTERVAL_MS = 5 * 60 * 1000

export type FushiCampaignBackupReason = 'manual' | 'auto' | 'replace' | 'restore'

export interface FushiCampaignBackupSnapshot {
  id: string
  campaignId: string
  campaignName: string
  createdAt: string
  reason: FushiCampaignBackupReason
  signature: string
  file: FushiCampaignExportFile
}

export function formatLocalBackupDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const parts = new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    year: 'numeric',
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((accumulator, part) => {
      accumulator[part.type] = part.value
      return accumulator
    }, {})

  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function createSignature(file: FushiCampaignExportFile) {
  return JSON.stringify({
    campaign: file.campaign,
    storage: file.storage,
  })
}

function normalizeSnapshot(value: unknown): FushiCampaignBackupSnapshot | null {
  if (!isRecord(value) || !isRecord(value.file)) {
    return null
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.campaignId !== 'string' ||
    typeof value.campaignName !== 'string' ||
    typeof value.createdAt !== 'string' ||
    typeof value.signature !== 'string' ||
    (value.reason !== 'manual' &&
      value.reason !== 'auto' &&
      value.reason !== 'replace' &&
      value.reason !== 'restore')
  ) {
    return null
  }

  return value as unknown as FushiCampaignBackupSnapshot
}

export function readCampaignBackupSnapshots(campaignId: string) {
  const rawValue = storageAdapter.loadCampaignBackups(campaignId)

  if (!Array.isArray(rawValue)) {
    return []
  }

  return rawValue
    .map(normalizeSnapshot)
    .filter((snapshot): snapshot is FushiCampaignBackupSnapshot => snapshot !== null)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

function writeCampaignBackupSnapshots(
  campaignId: string,
  snapshots: FushiCampaignBackupSnapshot[],
) {
  storageAdapter.saveCampaignBackups(
    campaignId,
    snapshots
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, CAMPAIGN_BACKUP_LIMIT),
  )
}

export function createCampaignBackupSnapshot(
  campaign: LocalCampaign,
  reason: FushiCampaignBackupReason,
): FushiCampaignBackupSnapshot {
  const file = createCampaignExportFile(campaign)
  const createdAt = new Date().toISOString()

  return {
    id: createId('campaign-backup'),
    campaignId: campaign.id,
    campaignName: campaign.nome,
    createdAt,
    reason,
    signature: createSignature(file),
    file: {
      ...file,
      exportedAt: createdAt,
    },
  }
}

export function saveCampaignBackupSnapshot(
  campaign: LocalCampaign,
  reason: FushiCampaignBackupReason,
) {
  const snapshot = createCampaignBackupSnapshot(campaign, reason)
  const currentSnapshots = readCampaignBackupSnapshots(campaign.id)
  const latestSnapshot = currentSnapshots[0]

  if (latestSnapshot?.signature === snapshot.signature) {
    return {
      created: false,
      snapshot: latestSnapshot,
      snapshots: currentSnapshots,
    }
  }

  const snapshots = [snapshot, ...currentSnapshots].slice(0, CAMPAIGN_BACKUP_LIMIT)

  writeCampaignBackupSnapshots(campaign.id, snapshots)

  return {
    created: true,
    snapshot,
    snapshots,
  }
}

export function downloadCampaignBackupSnapshot(snapshot: FushiCampaignBackupSnapshot) {
  const date = snapshot.createdAt.slice(0, 10)

  downloadJsonFile(snapshot.file, `fushi-backup-${snapshot.campaignId}-${date}.json`)
}

export function restoreCampaignBackupSnapshot(snapshot: FushiCampaignBackupSnapshot) {
  saveImportedCampaignStorage(snapshot.file, snapshot.campaignId)
}
