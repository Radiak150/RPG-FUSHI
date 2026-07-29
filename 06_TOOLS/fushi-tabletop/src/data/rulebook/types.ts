export type RulebookAudience = 'player' | 'master'

export type RulebookStatus = 'canon' | 'playtest' | 'development'

export type RulebookTone = 'info' | 'rule' | 'example' | 'warning' | 'secret'

export interface RulebookTable {
  columns: string[]
  rows: string[][]
}

export interface RulebookBlock {
  formula?: string
  items?: string[]
  kind:
    | 'lead'
    | 'paragraph'
    | 'rule'
    | 'bullets'
    | 'steps'
    | 'table'
    | 'example'
    | 'warning'
    | 'secret'
    | 'formula'
  table?: RulebookTable
  text?: string
  title?: string
  tone?: RulebookTone
}

export interface RulebookSection {
  blocks: RulebookBlock[]
  id: string
  label: string
  number: string
  searchTerms?: string[]
  status: RulebookStatus
  summary: string
  tags: string[]
}

export interface RulebookQuickEntry {
  detail: string
  label: string
  sectionId: string
}

export interface RulebookVolume {
  audience: RulebookAudience
  confidentiality: string
  edition: string
  quickReference: RulebookQuickEntry[]
  sections: RulebookSection[]
  subtitle: string
  title: string
}

export interface RulebookBibliographyEntry {
  note: string
  path?: string
  title: string
  type: 'canon' | 'campaign' | 'design-reference'
}

export interface FushiRulebooks {
  bibliography: RulebookBibliographyEntry[]
  books: {
    master: RulebookVolume
    player: RulebookVolume
  }
  updatedAt: string
  version: string
}
