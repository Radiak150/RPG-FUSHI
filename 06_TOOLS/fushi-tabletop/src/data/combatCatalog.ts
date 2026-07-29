import rawCatalog from './builds/fushi-build-catalog.json'
import type {
  CharacterAttributes,
  CharacterBuildArchetype,
  CharacterBuildItemIntegration,
  CharacterBuildModifiers,
} from './types'

export type FushiItemRarity =
  | 'comum'
  | 'raro'
  | 'epico'
  | 'lendario'
  | 'mitico'
  | 'secreto'

export type FushiBuildArchetype = CharacterBuildArchetype

export type FushiBuildBiomeId =
  | 'planicie'
  | 'praia'
  | 'montanha'
  | 'floresta'
  | 'vulcao'
  | 'gelo'
  | 'ruinas'
  | 'veu'

type BuildModifierKey = keyof CharacterBuildModifiers
type StandardRarity = Exclude<FushiItemRarity, 'secreto'>

export interface FushiBuildCatalogItem {
  archetype: FushiBuildArchetype
  biomeId: FushiBuildBiomeId
  id: string
  name: string
  passive: string
  weights: Partial<Record<BuildModifierKey, number>>
}

interface BuildArchetypeMeta {
  affinity: keyof CharacterAttributes
  affinityDivisor: number
  affinityStat: BuildModifierKey
  color: string
  id: FushiBuildArchetype
  label: string
  publicExampleItemId: string
  summary: string
}

interface BuildRarityMeta {
  color: string
  id: StandardRarity
  label: string
  max: number
  min: number
  representativeRoll: number
}

interface BuildCatalog {
  archetypes: BuildArchetypeMeta[]
  biomes: Array<{ id: FushiBuildBiomeId; label: string }>
  items: FushiBuildCatalogItem[]
  rarities: BuildRarityMeta[]
  rarityBudgets: Record<StandardRarity, number>
  roll: '1d10'
  rules: Record<string, string>
  secretItems: Array<{ effect: string; id: string; name: string; placement: string }>
  version: number
}

export interface ResolvedFushiBuildItem extends CharacterBuildItemIntegration {
  archetype: FushiBuildArchetype
  biomeId: FushiBuildBiomeId
  rarity: StandardRarity
}

export const FUSHI_BUILD_CATALOG = rawCatalog as BuildCatalog
export const BUILD_ARCHETYPES = FUSHI_BUILD_CATALOG.archetypes
export const BUILD_BIOMES = FUSHI_BUILD_CATALOG.biomes
export const BUILD_ITEMS = FUSHI_BUILD_CATALOG.items
export const BUILD_SECRET_ITEMS = FUSHI_BUILD_CATALOG.secretItems
export const ITEM_RARITY_META = Object.fromEntries(
  FUSHI_BUILD_CATALOG.rarities.map((rarity) => [rarity.id, rarity]),
) as Record<StandardRarity, BuildRarityMeta>

export const BUILD_MODIFIER_LABELS: Record<BuildModifierKey, string> = {
  abilityDamage: 'Dano de Habilidade',
  adjacentDamage: 'Dano adjacente',
  block: 'Bloqueio',
  ca: 'CA',
  caPenetration: 'Perfuracao de CA',
  criticalDamage: 'Dano Critico',
  damage: 'Dano geral',
  determination: 'Determinacao',
  fushi: 'FUSHI',
  healing: 'Cura',
  healingReceived: 'Cura recebida',
  initiative: 'Iniciativa',
  life: 'Vida',
  meleeDamage: 'Dano corpo a corpo',
  movement: 'Deslocamento',
  rangedDamage: 'Dano a distancia',
}

export const BUILD_MODIFIER_KEYS = Object.keys(BUILD_MODIFIER_LABELS) as BuildModifierKey[]

export function emptyBuildModifiers(): CharacterBuildModifiers {
  return Object.fromEntries(BUILD_MODIFIER_KEYS.map((key) => [key, 0])) as unknown as CharacterBuildModifiers
}

export function formatBuildModifiers(modifiers: CharacterBuildModifiers) {
  return BUILD_MODIFIER_KEYS
    .map((key) => ({ key, label: BUILD_MODIFIER_LABELS[key], value: modifiers[key] ?? 0 }))
    .filter((entry) => entry.value !== 0)
}

function allocateBudget(
  weights: Partial<Record<BuildModifierKey, number>>,
  budget: number,
) {
  const entries = (Object.entries(weights) as Array<[BuildModifierKey, number]>)
    .filter(([, value]) => Number(value) !== 0)
  const total = entries.reduce((sum, [, value]) => sum + Math.abs(value), 0)
  if (total <= 0) throw new Error('Item sem pesos de modificador validos.')

  const allocation = entries.map(([key, signedWeight], index) => {
    const absoluteWeight = Math.abs(signedWeight)
    const raw = (absoluteWeight / total) * budget
    return {
      absoluteWeight,
      fraction: raw - Math.floor(raw),
      index,
      key,
      sign: signedWeight < 0 ? -1 : 1,
      value: Math.floor(raw),
    }
  })
  let remainder = budget - allocation.reduce((sum, entry) => sum + entry.value, 0)
  const priority = allocation
    .slice()
    .sort((left, right) =>
      right.fraction - left.fraction ||
      right.absoluteWeight - left.absoluteWeight ||
      left.index - right.index,
    )
  for (let index = 0; remainder > 0; index += 1, remainder -= 1) {
    priority[index % priority.length].value += 1
  }

  return Object.fromEntries(
    allocation.map((entry) => [entry.key, entry.value * entry.sign]),
  ) as Partial<CharacterBuildModifiers>
}

export function getBuildItem(biomeId: FushiBuildBiomeId, archetype: FushiBuildArchetype) {
  return BUILD_ITEMS.find(
    (item) => item.biomeId === biomeId && item.archetype === archetype,
  ) ?? null
}

export function getBuildRarity(potency: number) {
  const safePotency = Math.max(1, Math.min(10, Math.round(potency)))
  return FUSHI_BUILD_CATALOG.rarities.find(
    (rarity) => safePotency >= rarity.min && safePotency <= rarity.max,
  ) ?? FUSHI_BUILD_CATALOG.rarities[0]
}

export function resolveBuildItem(
  item: FushiBuildCatalogItem,
  potency: number,
): ResolvedFushiBuildItem {
  const safePotency = Math.max(1, Math.min(10, Math.round(potency)))
  const rarity = getBuildRarity(safePotency)
  const modifiers = emptyBuildModifiers()
  const allocated = allocateBudget(item.weights, FUSHI_BUILD_CATALOG.rarityBudgets[rarity.id])
  BUILD_MODIFIER_KEYS.forEach((key) => {
    modifiers[key] = allocated[key] ?? 0
  })

  return {
    archetype: item.archetype,
    biomeId: item.biomeId,
    catalogItemId: item.id,
    modifiers,
    name: item.name,
    passive: item.passive,
    potency: safePotency,
    rarity: rarity.id,
    rarityLabel: rarity.label,
  }
}

export function resolveBuildItemByRarity(
  item: FushiBuildCatalogItem,
  rarityId: StandardRarity,
) {
  const rarity = ITEM_RARITY_META[rarityId]
  return resolveBuildItem(item, rarity.representativeRoll)
}

export function getBuildItems(profile: { item?: CharacterBuildItemIntegration; items?: CharacterBuildItemIntegration[] } | null | undefined) {
  if (Array.isArray(profile?.items)) return profile.items
  return profile?.item ? [profile.item] : []
}

export function getBuildArchetypePresentation(
  items: CharacterBuildItemIntegration[],
) {
  const archetypeIds = Array.from(new Set(items.map((item) => item.archetype)))

  if (archetypeIds.length === 0) {
    return { color: 'transparent', id: null, isMulticlass: false, label: '' }
  }

  if (archetypeIds.length > 1) {
    return { color: '#f4f1e8', id: null, isMulticlass: true, label: 'MultiClasse' }
  }

  const archetype = BUILD_ARCHETYPES.find((entry) => entry.id === archetypeIds[0])
  return {
    color: archetype?.color ?? '#aeb9b5',
    id: archetypeIds[0],
    isMulticlass: false,
    label: archetype?.label ?? archetypeIds[0],
  }
}

export function resolveDominantBuildArchetype(
  items: CharacterBuildItemIntegration[],
  fallback: FushiBuildArchetype = 'lutador',
) {
  const counts = new Map<FushiBuildArchetype, { count: number; lastIndex: number }>()
  items.forEach((item, index) => {
    const current = counts.get(item.archetype) ?? { count: 0, lastIndex: -1 }
    counts.set(item.archetype, { count: current.count + 1, lastIndex: index })
  })
  return [...counts.entries()]
    .sort((left, right) => right[1].count - left[1].count || right[1].lastIndex - left[1].lastIndex)[0]?.[0] ?? fallback
}

export function resolveBuildTotals(
  items: CharacterBuildItemIntegration[],
  attributes: CharacterAttributes,
  fallback: FushiBuildArchetype = 'lutador',
) {
  const totals = emptyBuildModifiers()
  items.forEach((item) => {
    BUILD_MODIFIER_KEYS.forEach((key) => {
      totals[key] += Number(item.modifiers?.[key] ?? 0) || 0
    })
  })

  const archetype = resolveDominantBuildArchetype(items, fallback)
  const meta = BUILD_ARCHETYPES.find((entry) => entry.id === archetype)
  const affinityBonus = meta && items.length > 0
    ? Math.floor(
        Math.max(0, Number(attributes[meta.affinity] ?? 0)) /
          Math.max(1, meta.affinityDivisor),
      )
    : 0
  if (meta) totals[meta.affinityStat] += affinityBonus

  return {
    affinity: meta
      ? { attribute: meta.affinity, bonus: affinityBonus, stat: meta.affinityStat }
      : null,
    archetype,
    totals,
  }
}
