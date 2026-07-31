import vfxCatalogData from './vfx/catalog.json'

export type TabletopVfxCategory =
  | 'ambiente'
  | 'energia'
  | 'impacto'
  | 'transicao'

export type TabletopVfxScope = 'map' | 'token'

export type TabletopVfxVariant =
  | 'aura-cyan'
  | 'damage-slash'
  | 'ember-rain'
  | 'frost-breath'
  | 'fushi-wave'
  | 'heal-bloom'
  | 'lightning-flash'
  | 'phase-shift'
  | 'shadow-veil'
  | 'spell-fizzle'

export interface TabletopVfxPreset {
  category: TabletopVfxCategory
  color: string
  description: string
  durationMs: number
  id: string
  label: string
  scope: TabletopVfxScope
  status: 'ready' | 'construction'
  variant: TabletopVfxVariant
}

export interface TabletopVfxPresentationState {
  createdAt: number
  expiresAt: number
  id: string
  presetId: string
  targetTokenId?: string
}

export const TABLETOP_VFX_CATALOG = vfxCatalogData as TabletopVfxPreset[]

export function getTabletopVfxPreset(presetId: string) {
  return TABLETOP_VFX_CATALOG.find((preset) => preset.id === presetId) ?? null
}
