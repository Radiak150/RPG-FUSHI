import masterHistoryData from './master-history.json'
import playerHistoryData from './player-history.json'
import type {
  RulebookAudience,
  RulebookSection,
  RulebookVolume,
} from '../rulebook'

export type {
  RulebookAudience,
  RulebookBlock,
  RulebookSection,
  RulebookStatus,
  RulebookTone,
  RulebookVolume,
} from '../rulebook'

export const playerHistoryBook = playerHistoryData as RulebookVolume
export const masterHistoryBook = masterHistoryData as RulebookVolume

export function getHistoryBookForAudience(audience: RulebookAudience) {
  return audience === 'master' ? masterHistoryBook : playerHistoryBook
}

export function historySectionMatches(section: RulebookSection, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')

  if (!normalizedQuery) {
    return true
  }

  const haystack = [
    section.number,
    section.label,
    section.summary,
    ...section.tags,
    ...(section.searchTerms ?? []),
    ...section.blocks.flatMap((block) => [
      block.title ?? '',
      block.text ?? '',
      block.formula ?? '',
      ...(block.items ?? []),
      ...(block.table?.columns ?? []),
      ...(block.table?.rows.flat() ?? []),
    ]),
  ]
    .join(' ')
    .toLocaleLowerCase('pt-BR')

  return haystack.includes(normalizedQuery)
}
