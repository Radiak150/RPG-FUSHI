import type { MasterPanelData } from '../data/types'
import { storageAdapter } from './storage/storageAdapter'

export interface CampaignAssetIssue {
  category: 'campanha' | 'item' | 'mapa' | 'mun' | 'personagem' | 'outro'
  field: string
  owner: string
  reason: string
  url: string
}

export interface CampaignAssetDiagnostic {
  broken: CampaignAssetIssue[]
  brokenByCategory: Record<CampaignAssetIssue['category'], number>
  resolvedCount: number
  totalCount: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function collectNamedUrl(
  issues: CampaignAssetIssue[],
  resolved: { count: number },
  category: CampaignAssetIssue['category'],
  owner: string,
  field: string,
  url: unknown,
) {
  if (typeof url !== 'string' || !url.trim()) {
    return 0
  }

  const value = url.trim()
  const reason = getBrokenAssetReason(value)

  if (reason) {
    issues.push({
      category,
      field,
      owner,
      reason,
      url: value,
    })
  } else {
    resolved.count += 1
  }

  return 1
}

function getBrokenAssetReason(url: string) {
  if (url.startsWith('blob:')) {
    return 'URL temporaria blob nao sobrevive a export/import.'
  }

  if (url.startsWith('/api/fushi/assets/') && window.fushiDesktop) {
    return 'URL depende do servidor Vite; reexporte a campanha para embutir este asset.'
  }

  if (url.startsWith('/assets/') && window.fushiDesktop) {
    return ''
  }

  if (url.startsWith('fushi-asset://') && window.fushiDesktop && !window.fushiDesktop.assetExists(url)) {
    return 'Arquivo fisico nao encontrado no storage desktop.'
  }

  return ''
}

function scanObjectUrls(
  value: unknown,
  category: CampaignAssetIssue['category'],
  owner: string,
  path: string,
  issues: CampaignAssetIssue[],
  resolved: { count: number },
): number {
  if (typeof value === 'string') {
    if (
      path.toLowerCase().includes('image') ||
      path.toLowerCase().includes('asset') ||
      path.toLowerCase().includes('thumbnail') ||
      path.toLowerCase().includes('avatar') ||
      path.toLowerCase().includes('url')
    ) {
      return collectNamedUrl(issues, resolved, category, owner, path, value)
    }

    return 0
  }

  if (Array.isArray(value)) {
    return value.reduce<number>(
      (count, item, index) =>
        count + scanObjectUrls(item, category, owner, `${path}.${index}`, issues, resolved),
      0,
    )
  }

  if (isRecord(value)) {
    return Object.entries(value).reduce(
      (count, [key, entryValue]) =>
        count + scanObjectUrls(entryValue, category, owner, path ? `${path}.${key}` : key, issues, resolved),
      0,
    )
  }

  return 0
}

export function buildCampaignAssetDiagnostic(
  data: MasterPanelData | null,
  campaignId?: string,
): CampaignAssetDiagnostic {
  const broken: CampaignAssetIssue[] = []
  const resolved = { count: 0 }
  let totalCount = 0

  data?.campaigns.items.forEach((campaign) => {
    totalCount += collectNamedUrl(
      broken,
      resolved,
      'campanha',
      campaign.nome,
      'coverImageUrl',
      campaign.coverImageUrl,
    )
  })

  data?.characters.items.forEach((character) => {
    totalCount += collectNamedUrl(broken, resolved, 'personagem', character.nome, 'avatarUrl', character.avatarUrl)
    totalCount += collectNamedUrl(
      broken,
      resolved,
      'personagem',
      character.nome,
      'tokenImageUrl',
      character.tokenImageUrl,
    )
    totalCount += scanObjectUrls(
      character.inventarioDetalhado,
      'item',
      character.nome,
      'inventarioDetalhado',
      broken,
      resolved,
    )
  })

  totalCount += scanObjectUrls(
    storageAdapter.loadMundiState(campaignId),
    'mun',
    'MUN',
    'mundi',
    broken,
    resolved,
  )
  let libraryState: unknown = null
  const rawLibraryState = storageAdapter.loadLibraryState(campaignId)

  try {
    libraryState = rawLibraryState ? JSON.parse(rawLibraryState) : null
  } catch {
    libraryState = null
  }

  totalCount += scanObjectUrls(
    libraryState,
    'mapa',
    'MAP',
    'library',
    broken,
    resolved,
  )

  return {
    broken,
    brokenByCategory: broken.reduce<Record<CampaignAssetIssue['category'], number>>(
      (accumulator, issue) => ({
        ...accumulator,
        [issue.category]: (accumulator[issue.category] ?? 0) + 1,
      }),
      {
        campanha: 0,
        item: 0,
        mapa: 0,
        mun: 0,
        outro: 0,
        personagem: 0,
      },
    ),
    resolvedCount: resolved.count,
    totalCount,
  }
}
