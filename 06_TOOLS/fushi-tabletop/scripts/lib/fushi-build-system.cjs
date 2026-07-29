const fs = require('node:fs')
const path = require('node:path')

const BUILD_MODIFIER_KEYS = [
  'abilityDamage',
  'adjacentDamage',
  'block',
  'ca',
  'caPenetration',
  'criticalDamage',
  'damage',
  'determination',
  'fushi',
  'healing',
  'healingReceived',
  'initiative',
  'life',
  'meleeDamage',
  'movement',
  'rangedDamage',
]

function getCatalogPath(projectRoot = process.cwd()) {
  return path.join(projectRoot, 'src', 'data', 'builds', 'fushi-build-catalog.json')
}

function readBuildCatalog(projectRoot = process.cwd()) {
  return JSON.parse(fs.readFileSync(getCatalogPath(projectRoot), 'utf8'))
}

function clampPotency(value) {
  return Math.max(1, Math.min(10, Math.round(Number(value) || 1)))
}

function rarityFromPotency(catalog, value) {
  const potency = clampPotency(value)
  return catalog.rarities.find((rarity) => potency >= rarity.min && potency <= rarity.max) ?? catalog.rarities[0]
}

function rarityFromId(catalog, rarityId) {
  return catalog.rarities.find((rarity) => rarity.id === rarityId) ?? catalog.rarities[0]
}

function emptyBuildModifiers() {
  return Object.fromEntries(BUILD_MODIFIER_KEYS.map((key) => [key, 0]))
}

function allocateBudget(weights, budget) {
  const entries = Object.entries(weights ?? {}).filter(([, value]) => Number(value) !== 0)
  const weightTotal = entries.reduce((total, [, value]) => total + Math.abs(Number(value)), 0)
  if (weightTotal <= 0) throw new Error('Item sem pesos de modificador validos.')

  const allocated = entries.map(([key, signedWeight], index) => {
    const absoluteWeight = Math.abs(Number(signedWeight))
    const raw = (absoluteWeight / weightTotal) * budget
    return {
      absoluteWeight,
      fraction: raw - Math.floor(raw),
      index,
      key,
      sign: Number(signedWeight) < 0 ? -1 : 1,
      value: Math.floor(raw),
    }
  })

  let remainder = budget - allocated.reduce((total, entry) => total + entry.value, 0)
  const priority = allocated
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
    allocated.map((entry) => [entry.key, entry.value * entry.sign]),
  )
}

function evaluateBuildItem(catalog, item, potency) {
  const rarity = rarityFromPotency(catalog, potency)
  const budget = Number(catalog.rarityBudgets?.[rarity.id] ?? 0)
  if (budget <= 0) throw new Error(`Orcamento ausente para raridade: ${rarity.id}`)

  const modifiers = emptyBuildModifiers()
  const allocated = allocateBudget(item.weights, budget)
  for (const [key, value] of Object.entries(allocated)) {
    if (!BUILD_MODIFIER_KEYS.includes(key)) throw new Error(`Modificador desconhecido: ${key}`)
    modifiers[key] = value
  }

  return {
    archetype: item.archetype,
    biomeId: item.biomeId,
    catalogItemId: item.id,
    modifiers,
    name: item.name,
    passive: item.passive ?? '',
    potency: clampPotency(potency),
    rarity: rarity.id,
    rarityLabel: rarity.label,
  }
}

function evaluateBuildItemByRarity(catalog, item, rarityId) {
  const rarity = rarityFromId(catalog, rarityId)
  return evaluateBuildItem(catalog, item, rarity.representativeRoll ?? rarity.max)
}

function getBuildItems(profile) {
  if (Array.isArray(profile?.items)) return profile.items
  return profile?.item ? [profile.item] : []
}

function resolveDominantArchetype(items, fallback = 'lutador') {
  const counts = new Map()
  items.forEach((item, index) => {
    const current = counts.get(item.archetype) ?? { count: 0, lastIndex: -1 }
    counts.set(item.archetype, { count: current.count + 1, lastIndex: index })
  })

  return [...counts.entries()]
    .sort((left, right) => right[1].count - left[1].count || right[1].lastIndex - left[1].lastIndex)[0]?.[0] ?? fallback
}

function evaluateBuildSet(catalog, items, attributes = {}, fallbackArchetype = 'lutador') {
  const totals = emptyBuildModifiers()
  for (const item of items) {
    for (const key of BUILD_MODIFIER_KEYS) totals[key] += Number(item.modifiers?.[key] ?? 0) || 0
  }

  const archetype = resolveDominantArchetype(items, fallbackArchetype)
  const archetypeMeta = catalog.archetypes.find((entry) => entry.id === archetype)
  let affinityBonus = 0
  if (archetypeMeta && items.length > 0) {
    affinityBonus = Math.floor(
      Math.max(0, Number(attributes[archetypeMeta.affinity] ?? 0) || 0) /
        Math.max(1, Number(archetypeMeta.affinityDivisor ?? 1)),
    )
    totals[archetypeMeta.affinityStat] += affinityBonus
  }

  return {
    affinity: archetypeMeta
      ? {
          attribute: archetypeMeta.affinity,
          bonus: affinityBonus,
          stat: archetypeMeta.affinityStat,
        }
      : null,
    archetype,
    totals,
  }
}

function getCatalogItem(catalog, biomeId, archetype) {
  return catalog.items.find(
    (item) => item.biomeId === biomeId && item.archetype === archetype,
  ) ?? null
}

module.exports = {
  BUILD_MODIFIER_KEYS,
  allocateBudget,
  clampPotency,
  emptyBuildModifiers,
  evaluateBuildItem,
  evaluateBuildItemByRarity,
  evaluateBuildSet,
  getBuildItems,
  getCatalogItem,
  getCatalogPath,
  rarityFromId,
  rarityFromPotency,
  readBuildCatalog,
  resolveDominantArchetype,
}
