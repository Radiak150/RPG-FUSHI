import type {
  CharacterActionCheckOption,
  CharacterActionRangeRule,
  CharacterFeatureActivationSource,
  CharacterFeatureDetail,
  CharacterSheet,
  RollConfig,
  TabletopCell,
} from '../data/types'
import {
  buildAttackActionFeature,
  getCharacterActionCheckOption,
  getCharacterActionCheckOptions,
} from './characterActions'
import {
  applyCombatBuildDamageBonus,
  getCombatBuildDamageBonus,
  resolveCombatAction,
  type CombatBuildDamageContext,
} from './combatV2'
import { normalizeCharacterFeatureDetail } from './characterSheet'

export type CombatRangeShape = 'adjacent' | 'map' | 'radius'

export interface CombatRangeDefinition {
  color: string
  label: string
  radiusMeters?: number
  shape: CombatRangeShape
}

export interface CharacterCombatActionOption {
  feature: CharacterFeatureDetail
  source: CharacterFeatureActivationSource
}

export interface CombatActionCalculation {
  baseDamageFormula: string
  buildDamageBonus: number
  contexts: CombatBuildDamageContext[]
  damageFormula: string
  distanceMeters: number | null
  distanceSquares: number | null
  isInRange: boolean
  rangeReason: string
  range: CombatRangeDefinition | null
}

export interface CombatDamageSequence {
  afterBuild: number
  afterMultiplier: number
  finalDamage: number
  negativeBuildModifier: number
  positiveBuildModifier: number
  rolledDamage: number
}

const METERS_PER_COMBAT_SQUARE = 1.5

export function resolveCombatDamageSequence(input: {
  buildModifier?: number
  multiplier?: number
  reduction?: number
  rolledDamage: number
}): CombatDamageSequence {
  const rolledDamage = Math.max(0, Math.floor(input.rolledDamage))
  const buildModifier = Math.trunc(input.buildModifier ?? 0)
  const multiplier = Math.max(1, Math.floor(input.multiplier ?? 1))
  const reduction = Math.max(0, Math.floor(input.reduction ?? 0))
  const positiveBuildModifier = Math.max(0, buildModifier)
  const negativeBuildModifier = Math.min(0, buildModifier)
  const afterMultiplier =
    (rolledDamage + positiveBuildModifier) * multiplier
  const afterBuild = Math.max(0, afterMultiplier + negativeBuildModifier)

  return {
    afterBuild,
    afterMultiplier,
    finalDamage: Math.max(0, afterBuild - reduction),
    negativeBuildModifier,
    positiveBuildModifier,
    rolledDamage,
  }
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function getFeatureDescriptor(feature: CharacterFeatureDetail) {
  return normalizeText(
    [
      feature.nome,
      feature.descricao,
      feature.automation?.range,
      feature.automation?.target,
      ...(feature.automation?.tags ?? []),
    ]
      .filter(Boolean)
      .join(' '),
  )
}

export function getCharacterCombatActions(character: CharacterSheet) {
  return [
    ...character.ataques.map((attack) => ({
      feature: buildAttackActionFeature(character, attack),
      source: 'ataque' as const,
    })),
    ...(character.habilidadesDetalhadas ?? []).map((feature) => ({
      feature: normalizeCharacterFeatureDetail(feature),
      source: 'habilidade' as const,
    })),
    ...(character.rituais ?? []).map((feature) => ({
      feature: normalizeCharacterFeatureDetail(feature),
      source: 'ritual' as const,
    })),
  ] satisfies CharacterCombatActionOption[]
}

export function getTabletopDistanceSquares(source: TabletopCell, target: TabletopCell) {
  return Math.round(
    Math.hypot(target.column - source.column, target.row - source.row) * 10,
  ) / 10
}

export function getTabletopDistanceMeters(source: TabletopCell, target: TabletopCell) {
  return Math.round(
    getTabletopDistanceSquares(source, target) * METERS_PER_COMBAT_SQUARE * 10,
  ) / 10
}

function inferStructuredRange(
  feature: CharacterFeatureDetail,
  checkOption?: CharacterActionCheckOption | null,
): CharacterActionRangeRule {
  const structured = feature.automation?.combat?.alcance

  if (structured) {
    return structured
  }

  const descriptor = getFeatureDescriptor(feature)

  if (/mapa inteiro|todo o mapa|mapa atual/.test(descriptor)) {
    return { band: 'mapa' }
  }

  if (checkOption?.damageContext === 'melee' || /corpo a corpo|adjacente/.test(descriptor)) {
    return { band: 'corpo-a-corpo', maxSquares: 1 }
  }

  const meters = /(?:ate|alcance|distancia|area|raio)?\s*(\d+(?:[.,]\d+)?)\s*m\b/.exec(
    descriptor,
  )

  if (meters) {
    const maxMeters = Number(meters[1].replace(',', '.'))
    return {
      band:
        maxMeters <= 9
          ? 'curto'
          : maxMeters <= 18
            ? 'medio'
            : maxMeters <= 36
              ? 'longo'
              : 'extremo',
      maxSquares: Math.max(1, Math.floor(maxMeters / METERS_PER_COMBAT_SQUARE)),
    }
  }

  if (checkOption?.damageContext === 'ranged') {
    return { band: 'medio', closeRangePenaltySquares: 2, maxSquares: 12 }
  }

  return { band: 'corpo-a-corpo', maxSquares: 1 }
}

export function validateCombatRange(input: {
  checkOption?: CharacterActionCheckOption | null
  distanceSquares: number | null
  feature: CharacterFeatureDetail
}) {
  const rule = inferStructuredRange(input.feature, input.checkOption)

  if (input.distanceSquares === null || rule.band === 'mapa') {
    return {
      isInRange: true,
      reason: rule.band === 'mapa' ? 'Alcance: mapa atual.' : 'Escolha um alvo.',
      rule,
    }
  }

  const minSquares = Math.max(0, rule.minSquares ?? 0)
  const maxSquares =
    typeof rule.maxSquares === 'number'
      ? Math.max(minSquares, rule.maxSquares)
      : rule.band === 'corpo-a-corpo'
        ? 1
        : rule.band === 'curto'
          ? 6
          : rule.band === 'medio'
            ? 12
            : rule.band === 'longo'
              ? 24
              : 60
  const isInRange =
    input.distanceSquares >= minSquares && input.distanceSquares <= maxSquares

  return {
    isInRange,
    reason: isInRange
      ? `${input.distanceSquares} q / ${getRangeMetersLabel(input.distanceSquares)} m.`
      : `Fora do alcance: ${input.distanceSquares} q; limite ${maxSquares} q.`,
    rule,
  }
}

function getRangeMetersLabel(distanceSquares: number) {
  return Math.round(distanceSquares * METERS_PER_COMBAT_SQUARE * 10) / 10
}

export function getCombatRollDicePenalty(input: {
  checkOption?: CharacterActionCheckOption | null
  distanceSquares: number | null
  feature: CharacterFeatureDetail
}) {
  const rule = inferStructuredRange(input.feature, input.checkOption)
  const closeRangeLimit = rule.closeRangePenaltySquares ?? 2

  return input.checkOption?.damageContext === 'ranged' &&
    input.distanceSquares !== null &&
    input.distanceSquares <= closeRangeLimit
    ? -1
    : 0
}

export function applyCombatDicePoolModifier(
  config: RollConfig,
  modifier: number,
): RollConfig {
  if (modifier === 0) {
    return config
  }

  let quantity = config.quantidadeDados
  let mode = config.modo

  for (let index = 0; index < Math.abs(modifier); index += 1) {
    if (modifier < 0) {
      if (mode === 'highest' && quantity > 1) {
        quantity -= 1
      } else if (mode === 'highest') {
        quantity = 2
        mode = 'lowest'
      } else {
        quantity += 1
      }
    } else if (mode === 'lowest' && quantity > 2) {
      quantity -= 1
    } else if (mode === 'lowest') {
      quantity = 1
      mode = 'highest'
    } else {
      quantity += 1
    }
  }

  return {
    ...config,
    modo: mode,
    quantidadeDados: Math.max(1, quantity),
  }
}

export function resolveCombatRange(feature: CharacterFeatureDetail): CombatRangeDefinition | null {
  const presentation = feature.automation?.presentation?.area
  const color = presentation?.color || feature.automation?.visualColor || '#8e6cff'
  const label = feature.automation?.range?.trim() || 'Alcance nao cadastrado'

  if (presentation) {
    if (presentation.shape === 'map') {
      return { color, label, shape: 'map' }
    }

    if (presentation.shape === 'adjacent') {
      return { color, label, radiusMeters: 1, shape: 'adjacent' }
    }

    if (typeof presentation.radiusMeters === 'number' && presentation.radiusMeters > 0) {
      return {
        color,
        label,
        radiusMeters: presentation.radiusMeters,
        shape: 'radius',
      }
    }
  }

  const descriptor = getFeatureDescriptor(feature)

  if (/todo o mapa|mapa inteiro|mapa atual/.test(descriptor)) {
    return { color, label, shape: 'map' }
  }

  if (/adjacente|corpo a corpo/.test(descriptor)) {
    return { color, label, radiusMeters: 1, shape: 'adjacent' }
  }

  const meters = /(?:ate|alcance|distancia|area|raio)?\s*(\d+(?:[.,]\d+)?)\s*m\b/.exec(
    descriptor,
  )
  const radiusMeters = meters ? Number(meters[1].replace(',', '.')) : 0

  return radiusMeters > 0
    ? { color, label, radiusMeters, shape: 'radius' }
    : null
}

export function getCombatDamageContexts(input: {
  checkOption?: CharacterActionCheckOption | null
  feature: CharacterFeatureDetail
  source: CharacterFeatureActivationSource
  sourceCell?: TabletopCell | null
  targetCell?: TabletopCell | null
}) {
  const contexts = new Set<CombatBuildDamageContext>()
  const descriptor = getFeatureDescriptor(input.feature)

  if (input.source === 'habilidade' || input.source === 'ritual') {
    contexts.add('ability')
  }

  if (input.sourceCell && input.targetCell) {
    const squareDistance = getTabletopDistanceSquares(
      input.sourceCell,
      input.targetCell,
    )

    if (squareDistance <= 2) {
      contexts.add('adjacent')
    }

    if (input.checkOption?.damageContext === 'ranged' && squareDistance <= 2) {
      // Um disparo colado usa a penalidade adjacente da build; nao recebe
      // simultaneamente o bonus de dano a distancia.
    } else if (input.checkOption?.damageContext) {
      contexts.add(input.checkOption.damageContext)
    } else if (squareDistance <= 1) {
      contexts.add('melee')
    } else {
      contexts.add('ranged')
    }
  } else if (input.checkOption?.damageContext) {
    contexts.add(input.checkOption.damageContext)
  } else if (/adjacente|corpo a corpo/.test(descriptor)) {
    contexts.add('adjacent')
    contexts.add('melee')
  } else if (/distancia|tiro|disparo|arco|pistola|rifle|\d+(?:[.,]\d+)?\s*m\b/.test(descriptor)) {
    contexts.add('ranged')
  } else {
    contexts.add('melee')
  }

  return [...contexts]
}

export function resolveCombatCheckOption(input: {
  checkOptionId?: string
  feature: CharacterFeatureDetail
  sourceCell?: TabletopCell | null
  targetCell?: TabletopCell | null
}) {
  const options = getCharacterActionCheckOptions(input.feature)

  if (options.length === 0) {
    return null
  }

  if (input.checkOptionId) {
    return getCharacterActionCheckOption(input.feature, input.checkOptionId)
  }

  if (input.sourceCell && input.targetCell) {
    const cellDistance = getTabletopDistanceSquares(
      input.sourceCell,
      input.targetCell,
    )
    const inferredContext = cellDistance <= 1 ? 'melee' : 'ranged'

    return (
      options.find((option) => option.damageContext === inferredContext) ??
      options[0]
    )
  }

  return options[0]
}

export function calculateCombatAction(input: {
  character: CharacterSheet
  checkOptionId?: string
  feature: CharacterFeatureDetail
  source: CharacterFeatureActivationSource
  sourceCell?: TabletopCell | null
  targetCell?: TabletopCell | null
}): CombatActionCalculation {
  const checkOption = resolveCombatCheckOption(input)
  const resolution = input.feature.automation?.combat?.resolucao
  const baseDamageFormula =
    resolution?.mode === 'heal' && resolution.healingFormula?.trim()
      ? resolution.healingFormula.trim()
      : resolveCombatAction(input.feature).damageFormula
  const appliesDamageBuild = resolution?.mode !== 'heal'
  const contexts = getCombatDamageContexts({
    ...input,
    checkOption,
  })
  const distanceMeters = input.sourceCell && input.targetCell
    ? getTabletopDistanceMeters(input.sourceCell, input.targetCell)
    : null
  const distanceSquares = input.sourceCell && input.targetCell
    ? getTabletopDistanceSquares(input.sourceCell, input.targetCell)
    : null
  const rangeValidation = validateCombatRange({
    checkOption,
    distanceSquares,
    feature: input.feature,
  })

  return {
    baseDamageFormula,
    buildDamageBonus: baseDamageFormula && appliesDamageBuild
      ? getCombatBuildDamageBonus(input.character, contexts)
      : 0,
    contexts,
    damageFormula: baseDamageFormula && appliesDamageBuild
      ? applyCombatBuildDamageBonus(baseDamageFormula, input.character, contexts)
      : baseDamageFormula,
    distanceMeters,
    distanceSquares,
    isInRange: rangeValidation.isInRange,
    rangeReason: rangeValidation.reason,
    range: resolveCombatRange(input.feature),
  }
}
