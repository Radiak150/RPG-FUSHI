import {
  BUILD_ITEMS,
  getBuildArchetypePresentation,
  getBuildItems,
  resolveBuildItemByRarity,
  resolveBuildTotals,
  type FushiItemRarity,
} from '../data/combatCatalog'
import type {
  CharacterBuildBaseline,
  CharacterBuildItemIntegration,
  CharacterBuildProfile,
  CharacterResources,
  CharacterSheet,
} from '../data/types'
import { getCombatBlockValue, getCombatDodgeValue } from './combatV2'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function captureBaseline(character: CharacterSheet): CharacterBuildBaseline {
  return {
    actionRolls: Object.fromEntries(
      [...(character.habilidadesDetalhadas ?? []), ...(character.rituais ?? [])]
        .filter((feature) => feature.automation?.roll)
        .map((feature) => [
          feature.id,
          {
            bonus: Number(feature.automation?.roll?.bonus ?? 0),
            quantidadeDados: Number(feature.automation?.roll?.quantidadeDados ?? 1),
          },
        ]),
    ),
    attacks: Object.fromEntries(
      character.ataques.map((attack) => [
        attack.id,
        {
          atributoBase: attack.atributoBase,
          bonusPericia: Number(attack.bonusPericia ?? 0),
        },
      ]),
    ),
    defesa: Number(character.defesa ?? 0),
    deslocamento: character.deslocamento,
    pericias: Object.fromEntries(
      character.pericias.map((skill) => [skill.id, Number(skill.bonusPericia ?? 0)]),
    ),
    recursos: clone(character.recursos),
  }
}

function applyResourceMaximum(
  character: CharacterSheet,
  baseline: CharacterBuildBaseline,
  currentKey: 'vidaAtual' | 'fushiAtual' | 'determinacaoAtual',
  maximumKey: 'vidaMaxima' | 'fushiMaximo' | 'determinacaoMaxima',
  delta: number,
  policy: 'preserve-spent' | 'from-baseline',
) {
  const minimumMaximum = maximumKey === 'vidaMaxima' ? 1 : 0
  const baseMaximum = Math.max(
    minimumMaximum,
    Number(baseline.recursos[maximumKey] ?? 0),
  )
  const maximum = Math.max(minimumMaximum, baseMaximum + delta)
  const spent = Math.max(
    0,
    Number(character.recursos[maximumKey] ?? 0) - Number(character.recursos[currentKey] ?? 0),
  )
  const current = policy === 'from-baseline'
    ? Math.max(
        0,
        Math.min(maximum, Number(baseline.recursos[currentKey] ?? 0) + delta),
      )
    : Math.max(0, maximum - spent)

  return {
    baseCurrent: Math.max(0, Math.min(baseMaximum, current - delta)),
    current,
    maximum,
  }
}

function applyMovement(value: string | undefined, delta: number) {
  if (!delta || !value) return value
  const match = /(-?\d+(?:[.,]\d+)?)/.exec(value)
  if (!match) return value
  const current = Number(match[1].replace(',', '.'))
  const next = Math.max(0, current + delta)
  return value.replace(
    match[1],
    Number.isInteger(next) ? String(next) : String(next).replace('.', ','),
  )
}

export function getCharacterBuildItems(character: CharacterSheet) {
  return getBuildItems(character.combatProfile?.build)
}

export function getCharacterBuildBaseline(character: CharacterSheet) {
  return clone(character.combatProfile?.build?.baseline ?? captureBaseline(character))
}

export function getCharacterBuildBaseResources(character: CharacterSheet) {
  return getCharacterBuildBaseline(character).recursos
}

export function applyCharacterBuildItems(
  character: CharacterSheet,
  requestedItems: CharacterBuildItemIntegration[],
  options: {
    assignmentConfidence?: CharacterBuildProfile['assignmentConfidence']
    assignmentReason?: string
    baseline?: CharacterBuildBaseline
    powerLevel?: CharacterBuildProfile['powerLevel']
    resourcePolicy?: 'preserve-spent' | 'from-baseline'
  } = {},
) {
  const items = requestedItems.map((item) => clone(item))
  const existingBuild = character.combatProfile?.build
  const baseline = clone(options.baseline ?? existingBuild?.baseline ?? captureBaseline(character))
  const resourcePolicy = options.resourcePolicy ?? 'preserve-spent'
  const resolved = resolveBuildTotals(items, character.atributos, existingBuild?.archetype)
  const life = applyResourceMaximum(
    character,
    baseline,
    'vidaAtual',
    'vidaMaxima',
    resolved.totals.life,
    resourcePolicy,
  )
  const fushi = applyResourceMaximum(
    character,
    baseline,
    'fushiAtual',
    'fushiMaximo',
    resolved.totals.fushi,
    resourcePolicy,
  )
  const determination = applyResourceMaximum(
    character,
    baseline,
    'determinacaoAtual',
    'determinacaoMaxima',
    resolved.totals.determination,
    resourcePolicy,
  )
  baseline.recursos = {
    ...baseline.recursos,
    vidaAtual: life.baseCurrent,
    fushiAtual: fushi.baseCurrent,
    determinacaoAtual: determination.baseCurrent,
  }
  const presentation = getBuildArchetypePresentation(items)
  const profile: CharacterBuildProfile = {
    archetype: resolved.archetype,
    assignmentConfidence:
      options.assignmentConfidence ?? existingBuild?.assignmentConfidence ?? 'alta',
    assignmentReason:
      options.assignmentReason ?? existingBuild?.assignmentReason ?? 'Build administrada pelo Mestre no BUI.',
    baseline,
    items,
    powerLevel:
      options.powerLevel ?? existingBuild?.powerLevel ?? character.combatProfile?.powerLevel ?? 'Basico',
    totals: resolved.totals,
    version: 2,
  }
  const next: CharacterSheet = {
    ...character,
    combatProfile: {
      ...character.combatProfile,
      build: items.length > 0 ? profile : undefined,
      papelBuild: presentation.label || undefined,
      powerLevel: profile.powerLevel,
      versao: 2,
    },
    defesa: Math.max(1, Number(baseline.defesa ?? character.defesa) + resolved.totals.ca),
    deslocamento: applyMovement(baseline.deslocamento, resolved.totals.movement),
    recursos: {
      ...character.recursos,
      vidaAtual: life.current,
      vidaMaxima: life.maximum,
      fushiAtual: fushi.current,
      fushiMaximo: fushi.maximum,
      determinacaoAtual: determination.current,
      determinacaoMaxima: determination.maximum,
    },
  }

  next.bloqueio = getCombatBlockValue(next)
  next.esquiva = getCombatDodgeValue(next) ?? 0
  return next
}

export function reconcileCharacterBuildPresentation(character: CharacterSheet) {
  const build = character.combatProfile?.build
  if (!build) return character

  const items = getBuildItems(build)
  const presentation = getBuildArchetypePresentation(items)

  if (items.length === 0) {
    return {
      ...character,
      combatProfile: {
        ...character.combatProfile,
        versao: 2 as const,
        build: undefined,
        papelBuild: undefined,
      },
    }
  }

  if (character.combatProfile?.papelBuild === presentation.label) return character

  return {
    ...character,
    combatProfile: {
      ...character.combatProfile,
      versao: 2 as const,
      papelBuild: presentation.label,
    },
  }
}

export function reconcileCharacterBuild(character: CharacterSheet) {
  const build = character.combatProfile?.build

  if (!build) {
    return reconcileCharacterBuildPresentation(character)
  }

  return applyCharacterBuildItems(character, getBuildItems(build), {
    assignmentConfidence: build.assignmentConfidence,
    assignmentReason: build.assignmentReason,
    powerLevel: build.powerLevel,
  })
}

export function updateCharacterBuildBaseResources(
  character: CharacterSheet,
  resources: CharacterResources,
) {
  const build = character.combatProfile?.build

  if (!build) {
    return {
      ...character,
      recursos: clone(resources),
    }
  }

  return applyCharacterBuildItems(character, getBuildItems(build), {
    assignmentConfidence: build.assignmentConfidence,
    assignmentReason: build.assignmentReason,
    baseline: {
      ...clone(build.baseline),
      recursos: clone(resources),
    },
    powerLevel: build.powerLevel,
    resourcePolicy: 'from-baseline',
  })
}

export function updateCharacterBuildBaseDefense(character: CharacterSheet, defesa: number) {
  const build = character.combatProfile?.build

  if (!build) {
    return { ...character, defesa }
  }

  return applyCharacterBuildItems(character, getBuildItems(build), {
    assignmentConfidence: build.assignmentConfidence,
    assignmentReason: build.assignmentReason,
    baseline: {
      ...clone(build.baseline),
      defesa,
    },
    powerLevel: build.powerLevel,
  })
}

export function updateCharacterBuildBaseMovement(
  character: CharacterSheet,
  deslocamento: string,
) {
  const build = character.combatProfile?.build

  if (!build) {
    return { ...character, deslocamento }
  }

  return applyCharacterBuildItems(character, getBuildItems(build), {
    assignmentConfidence: build.assignmentConfidence,
    assignmentReason: build.assignmentReason,
    baseline: {
      ...clone(build.baseline),
      deslocamento,
    },
    powerLevel: build.powerLevel,
  })
}

export function absorbCharacterBuildItem(
  character: CharacterSheet,
  item: CharacterBuildItemIntegration,
) {
  const current = getCharacterBuildItems(character)
  if (current.some((entry) => entry.catalogItemId === item.catalogItemId)) return character
  return applyCharacterBuildItems(character, [
    ...current,
    { ...item, absorbedAt: item.absorbedAt ?? new Date().toISOString() },
  ])
}

export function removeCharacterBuildItemForDebug(
  character: CharacterSheet,
  catalogItemId: string,
) {
  return applyCharacterBuildItems(
    character,
    getCharacterBuildItems(character).filter((item) => item.catalogItemId !== catalogItemId),
    { assignmentReason: 'Build ajustada pelo Mestre no modo de correcao tecnica.' },
  )
}

export function renameCharacterBuildItem(
  character: CharacterSheet,
  catalogItemId: string,
  name: string,
) {
  const build = character.combatProfile?.build

  if (!build) {
    return character
  }

  const nextName = name.trimStart()
  const items = getCharacterBuildItems(character)

  if (!items.some((item) => item.catalogItemId === catalogItemId)) {
    return character
  }

  return applyCharacterBuildItems(
    character,
    items.map((item) =>
      item.catalogItemId === catalogItemId
        ? {
            ...item,
            name: nextName,
          }
        : item,
    ),
    {
      assignmentConfidence: build.assignmentConfidence,
      assignmentReason: build.assignmentReason,
      powerLevel: build.powerLevel,
    },
  )
}

export function replaceCharacterBuildItemRarityForMaster(
  character: CharacterSheet,
  catalogItemId: string,
  rarity: Exclude<FushiItemRarity, 'secreto'>,
) {
  const catalogItem = BUILD_ITEMS.find((item) => item.id === catalogItemId)
  if (!catalogItem) return character
  const current = getCharacterBuildItems(character)
  const existing = current.find((item) => item.catalogItemId === catalogItemId)
  if (!existing) return character
  const replacement = resolveBuildItemByRarity(catalogItem, rarity)

  return applyCharacterBuildItems(
    character,
    current.map((item) =>
      item.catalogItemId === catalogItemId
        ? {
            ...replacement,
            absorbedAt: existing.absorbedAt,
            name: existing.name,
          }
        : item,
    ),
    { assignmentReason: 'Raridade ajustada pelo Mestre por um item Secreto.' },
  )
}
