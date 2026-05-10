import type { LocalCampaign } from '../data/types'
import {
  storageAdapter,
  type CampaignStorageExport,
} from './storage/storageAdapter'

export const FUSHI_CAMPAIGN_EXPORT_VERSION = 1

export interface FushiCampaignExportFile {
  appId: 'fushi-tabletop'
  exportType: 'campaign'
  version: typeof FUSHI_CAMPAIGN_EXPORT_VERSION
  exportedAt: string
  campaign: LocalCampaign
  storage: CampaignStorageExport
}

export interface FushiCampaignImportSummary {
  campaignName: string
  campaignId: string
  exportedAt: string
  version: number
  mapCount: number
  locationCount: number
  groupCount: number
}

export interface FushiCampaignImportValidation {
  ok: boolean
  error?: string
  file?: FushiCampaignExportFile
  summary?: FushiCampaignImportSummary
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function sanitizeFilePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function createCampaignCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const block = Array.from({ length: 6 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join('')

  return `FUSHI-${block}`
}

function isLocalCampaign(value: unknown): value is LocalCampaign {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.nome === 'string' &&
    typeof value.codigo === 'string' &&
    typeof value.link === 'string' &&
    (value.coverImageUrl === undefined || typeof value.coverImageUrl === 'string') &&
    typeof value.resumo === 'string' &&
    typeof value.sessaoAtual === 'string' &&
    typeof value.status === 'string' &&
    typeof value.createdAt === 'string' &&
    (value.tone === 'steady' || value.tone === 'watch' || value.tone === 'critical')
  )
}

function countLibraryMaps(value: unknown) {
  if (!isRecord(value)) {
    return 0
  }

  const customMaps = Array.isArray(value.customMaps) ? value.customMaps.length : 0
  const mapOverrides = isRecord(value.mapOverrides)
    ? Object.keys(value.mapOverrides).length
    : 0

  return customMaps + mapOverrides
}

function countMundiLocations(value: unknown) {
  return isRecord(value) && Array.isArray(value.locations) ? value.locations.length : 0
}

function countMundiGroups(value: unknown) {
  return isRecord(value) && isRecord(value.parties) ? Object.keys(value.parties).length : 0
}

function replaceCampaignIdDeep<T>(value: T, previousCampaignId: string, nextCampaignId: string): T {
  if (typeof value === 'string') {
    return (value === previousCampaignId ? nextCampaignId : value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      replaceCampaignIdDeep(item, previousCampaignId, nextCampaignId),
    ) as T
  }

  if (!isRecord(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      replaceCampaignIdDeep(entryValue, previousCampaignId, nextCampaignId),
    ]),
  ) as T
}

export function createCampaignExportFile(
  campaign: LocalCampaign,
): FushiCampaignExportFile {
  return {
    appId: 'fushi-tabletop',
    exportType: 'campaign',
    version: FUSHI_CAMPAIGN_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    campaign: cloneValue(campaign),
    storage: storageAdapter.exportCampaign(campaign.id),
  }
}

export function createCampaignExportFilename(
  campaign: LocalCampaign,
  prefix = 'fushi-campaign',
) {
  const label = sanitizeFilePart(campaign.nome || campaign.id) || campaign.id
  const date = new Date().toISOString().slice(0, 10)

  return `${prefix}-${label}-${date}.json`
}

export function downloadJsonFile(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
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

export function validateCampaignExportFile(
  value: unknown,
): FushiCampaignImportValidation {
  if (!isRecord(value)) {
    return {
      ok: false,
      error: 'Arquivo invalido: o JSON precisa ser um objeto.',
    }
  }

  if (
    value.appId !== 'fushi-tabletop' ||
    value.exportType !== 'campaign' ||
    value.version !== FUSHI_CAMPAIGN_EXPORT_VERSION ||
    typeof value.exportedAt !== 'string' ||
    !isLocalCampaign(value.campaign) ||
    !isRecord(value.storage)
  ) {
    return {
      ok: false,
      error: 'Arquivo invalido: export de campanha FUSHI nao reconhecido.',
    }
  }

  if (value.storage.version !== 1 || typeof value.storage.campaignId !== 'string') {
    return {
      ok: false,
      error: 'Arquivo invalido: bloco de armazenamento da campanha corrompido.',
    }
  }

  const file = value as unknown as FushiCampaignExportFile

  return {
    ok: true,
    file,
    summary: {
      campaignName: file.campaign.nome,
      campaignId: file.campaign.id,
      exportedAt: file.exportedAt,
      version: file.version,
      mapCount: countLibraryMaps(file.storage.libraryState),
      locationCount: countMundiLocations(file.storage.mundiState),
      groupCount: countMundiGroups(file.storage.mundiState),
    },
  }
}

export function buildImportedCampaignMetadata(
  file: FushiCampaignExportFile,
  mode: 'new' | 'replace',
  targetCampaign?: LocalCampaign,
) {
  if (mode === 'replace' && targetCampaign) {
    return {
      ...targetCampaign,
      nome: file.campaign.nome || targetCampaign.nome,
      coverImageUrl: file.campaign.coverImageUrl,
      resumo: file.campaign.resumo,
      sessaoAtual: file.campaign.sessaoAtual,
      status: file.campaign.status,
      tone: file.campaign.tone,
    } satisfies LocalCampaign
  }

  const nextCode = createCampaignCode()

  return {
    ...file.campaign,
    id: createId('campaign-import'),
    codigo: nextCode,
    link: `fushi://campanha/${nextCode}`,
    nome: `${file.campaign.nome} (importada)`,
    createdAt: new Date().toISOString(),
  } satisfies LocalCampaign
}

export function saveImportedCampaignStorage(
  file: FushiCampaignExportFile,
  targetCampaignId: string,
) {
  const sourceCampaignId = file.storage.campaignId || file.campaign.id
  const normalize = <T,>(value: T) =>
    replaceCampaignIdDeep(value, sourceCampaignId, targetCampaignId)

  storageAdapter.saveCampaignSession(
    targetCampaignId,
    normalize(file.storage.campaignSession),
  )
  storageAdapter.saveMundiState(targetCampaignId, normalize(file.storage.mundiState))
  storageAdapter.saveLibraryState(targetCampaignId, normalize(file.storage.libraryState))

  if (file.storage.playerAccess) {
    storageAdapter.savePlayerAccess(targetCampaignId, file.storage.playerAccess)
  }

  if (file.storage.physicalPersistence) {
    storageAdapter.savePhysicalPersistence(
      targetCampaignId,
      normalize(file.storage.physicalPersistence),
    )
  }
}
