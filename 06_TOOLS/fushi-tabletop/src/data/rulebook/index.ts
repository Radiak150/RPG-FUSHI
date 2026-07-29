import bibliographyData from './bibliography.json'
import masterRulebookData from './master-rulebook.json'
import playerRulebookData from './player-rulebook.json'
import type {
  FushiRulebooks,
  RulebookBibliographyEntry,
  RulebookSection,
  RulebookVolume,
} from './types'

export type {
  FushiRulebooks,
  RulebookAudience,
  RulebookBibliographyEntry,
  RulebookBlock,
  RulebookQuickEntry,
  RulebookSection,
  RulebookStatus,
  RulebookTone,
  RulebookVolume,
} from './types'

export const playerRulebook = playerRulebookData as RulebookVolume
export const masterRulebook = masterRulebookData as RulebookVolume
export const rulebookBibliography = bibliographyData as RulebookBibliographyEntry[]

export const fushiRulebooks: FushiRulebooks = {
  bibliography: rulebookBibliography,
  books: {
    master: masterRulebook,
    player: playerRulebook,
  },
  updatedAt: '2026-07-10',
  version: 'fushi-rulebooks-alpha84-v1',
}

export function getRulebookForAudience(audience: 'master' | 'player') {
  return fushiRulebooks.books[audience]
}

export function rulebookSectionMatches(section: RulebookSection, query: string) {
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
