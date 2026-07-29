import type {
  CharacterActionCheckOption,
  CharacterAttack,
  CharacterActionCost,
  CharacterActionEffect,
  CharacterActionCostResource,
  CharacterActionKind,
  CharacterFeatureDetail,
  CharacterInventoryItem,
  CharacterResources,
  CharacterSheet,
  RollConfig,
} from '../data/types'
import { getCharacterSkillRollBonus } from './combatV2'
import { createCombatRollConfig, formatRollFormula } from './rolls'

const resourceCurrentKeyByActionResource = {
  vida: 'vidaAtual',
  fushi: 'fushiAtual',
  determinacao: 'determinacaoAtual',
} satisfies Record<CharacterActionCostResource, keyof CharacterResources>

const resourceMaxKeyByActionResource = {
  vida: 'vidaMaxima',
  fushi: 'fushiMaximo',
  determinacao: 'determinacaoMaxima',
} satisfies Record<CharacterActionCostResource, keyof CharacterResources>

const resourceLabelByActionResource = {
  vida: 'Vida',
  fushi: 'FUSHI',
  determinacao: 'Determinacao',
} satisfies Record<CharacterActionCostResource, string>

export type CharacterActionRequirementChipTone =
  | 'cost'
  | 'passive'
  | 'condition'
  | 'activation'
  | 'free'

export interface CharacterActionRequirementChip {
  label: string
  tone: CharacterActionRequirementChipTone
}

export function getCharacterActionKindLabel(feature: CharacterFeatureDetail) {
  const kind = feature.automation?.kind ?? feature.tipo

  if (kind === 'ataque') return 'Ataque'
  if (kind === 'tecnica') return 'Tecnica'
  if (kind === 'passiva') return 'Passiva'
  if (kind === 'instintiva') return 'Instintiva'
  if (kind === 'ritual') return 'Ritual'
  if (kind === 'item') return 'Item'

  return 'Acao'
}

export function getCharacterActionCommandLabel(feature: CharacterFeatureDetail) {
  const kind = feature.automation?.kind ?? feature.tipo

  if (kind === 'ataque') return 'Atacar'
  if (kind === 'item') return 'Usar'
  if (kind === 'passiva') return 'Registrar'
  if (kind === 'instintiva') return 'Disparar'
  if (kind === 'ritual') return 'Conjurar'

  return 'Ativar'
}

export function getCharacterActionCostLabel(cost: CharacterActionCost) {
  const label = cost.label?.trim() || resourceLabelByActionResource[cost.resource]

  return `${cost.amount} ${label}`
}

export function getCharacterActionCostsLabel(feature: CharacterFeatureDetail) {
  const costs = feature.automation?.costs ?? []

  return costs.length > 0
    ? costs.map((cost) => getCharacterActionCostLabel(cost)).join(' + ')
    : 'Sem custo'
}

function normalizeActionActivationLabel(value?: string) {
  return value?.trim().replace(/\s+/g, ' ') ?? ''
}

function isPassiveActivationLabel(value: string) {
  return /^passiv[ao]$/i.test(value)
}

function shouldTreatActivationAsCondition(kind?: CharacterActionKind) {
  return kind === 'passiva' || kind === 'instintiva'
}

export function getCharacterActionActivationLabel(feature: CharacterFeatureDetail) {
  const automation = feature.automation
  const kind = automation?.kind ?? feature.tipo
  const activation = normalizeActionActivationLabel(automation?.activation)

  if (kind === 'passiva') {
    return activation && !isPassiveActivationLabel(activation)
      ? `Passiva: ${activation}`
      : 'Passiva'
  }

  if (!activation) {
    return ''
  }

  return shouldTreatActivationAsCondition(kind)
    ? `Condicao: ${activation}`
    : `Ativacao: ${activation}`
}

export function getCharacterActionRequirementChips(
  feature: CharacterFeatureDetail,
): CharacterActionRequirementChip[] {
  const automation = feature.automation
  const costs = automation?.costs ?? []
  const chips: CharacterActionRequirementChip[] = []

  if (costs.length > 0) {
    chips.push({
      label: getCharacterActionCostsLabel(feature),
      tone: 'cost',
    })
  }

  const activationLabel = getCharacterActionActivationLabel(feature)

  if (activationLabel) {
    const kind = automation?.kind ?? feature.tipo
    chips.push({
      label: activationLabel,
      tone:
        kind === 'passiva'
          ? 'passive'
          : shouldTreatActivationAsCondition(kind)
            ? 'condition'
            : 'activation',
    })
  }

  if (chips.length === 0) {
    chips.push({
      label: 'Sem custo',
      tone: 'free',
    })
  }

  return chips
}

export function getCharacterActionEffectLabel(effect: CharacterActionEffect) {
  if (effect.label?.trim()) {
    return effect.label.trim()
  }

  if (effect.type === 'resource') {
    const resourceLabel = resourceLabelByActionResource[effect.resource]
    const sign = effect.amount > 0 ? '+' : ''

    return `${sign}${effect.amount} ${resourceLabel}`
  }

  return effect.mode === 'remove'
    ? `Remove ${effect.status}`
    : `Aplica ${effect.status}`
}

export function getCharacterActionEffectsLabel(feature: CharacterFeatureDetail) {
  const effects = feature.automation?.effects ?? []

  return effects.length > 0
    ? effects.map((effect) => getCharacterActionEffectLabel(effect)).join(' + ')
    : ''
}

export function getCharacterActionRollLabel(
  feature: CharacterFeatureDetail,
  character?: CharacterSheet,
  checkOptionId?: string,
) {
  const roll = getCharacterActionRollConfig(feature, character, checkOptionId)

  return roll ? formatRollFormula(roll) : ''
}

export function featureHasExecutableAutomation(feature: CharacterFeatureDetail) {
  return Boolean(feature.automation)
}

export function canPayCharacterActionCosts(
  character: CharacterSheet,
  costs: CharacterActionCost[] = [],
) {
  const missing = costs.filter((cost) => {
    const currentKey = resourceCurrentKeyByActionResource[cost.resource]

    return character.recursos[currentKey] < cost.amount
  })

  return {
    ok: missing.length === 0,
    missing,
  }
}

export function applyCharacterActionCosts(
  character: CharacterSheet,
  costs: CharacterActionCost[] = [],
): CharacterSheet {
  const nextResources = { ...character.recursos }

  costs.forEach((cost) => {
    const currentKey = resourceCurrentKeyByActionResource[cost.resource]
    nextResources[currentKey] = Math.max(0, nextResources[currentKey] - cost.amount)
  })

  return {
    ...character,
    recursos: nextResources,
  }
}

export function applyCharacterActionEffects(
  character: CharacterSheet,
  effects: CharacterActionEffect[] = [],
) {
  let nextCharacter: CharacterSheet = {
    ...character,
    recursos: { ...character.recursos },
    status: [...character.status],
  }
  const appliedLabels: string[] = []

  effects
    .filter((effect) => effect.target === undefined || effect.target === 'self')
    .forEach((effect) => {
      if (effect.type === 'resource') {
        const currentKey = resourceCurrentKeyByActionResource[effect.resource]
        const maxKey = resourceMaxKeyByActionResource[effect.resource]
        const currentValue = nextCharacter.recursos[currentKey]
        const maxValue = nextCharacter.recursos[maxKey]
        const nextValue = Math.max(0, Math.min(maxValue, currentValue + effect.amount))

        nextCharacter = {
          ...nextCharacter,
          recursos: {
            ...nextCharacter.recursos,
            [currentKey]: nextValue,
          },
        }
        appliedLabels.push(getCharacterActionEffectLabel(effect))
        return
      }

      const statusLabel = effect.status.trim()

      if (!statusLabel) {
        return
      }

      const nextStatus =
        effect.mode === 'remove'
          ? nextCharacter.status.filter((status) => status !== statusLabel)
          : nextCharacter.status.includes(statusLabel)
            ? nextCharacter.status
            : [...nextCharacter.status, statusLabel]

      nextCharacter = {
        ...nextCharacter,
        status: nextStatus,
      }
      appliedLabels.push(getCharacterActionEffectLabel(effect))
    })

  return {
    appliedLabels,
    character: nextCharacter,
  }
}

export function getCharacterActionCheckOptions(feature: CharacterFeatureDetail) {
  const structuredOptions = feature.automation?.combat?.teste?.opcoes ?? []

  if (structuredOptions.length > 0) {
    return structuredOptions
  }

  const structuredCheck = feature.automation?.combat?.teste

  if (structuredCheck?.atributo) {
    return [
      {
        atributo: structuredCheck.atributo,
        id: 'structured-combat-check',
        label: `${structuredCheck.atributo.toUpperCase()}${
          structuredCheck.pericia ? ` + ${structuredCheck.pericia}` : ''
        }`,
        pericia: structuredCheck.pericia,
      } satisfies CharacterActionCheckOption,
    ]
  }

  const legacyOption = getLegacyCombatCheckOption(feature)

  return legacyOption ? [legacyOption] : []
}

export function getCharacterActionCheckOption(
  feature: CharacterFeatureDetail,
  checkOptionId?: string,
) {
  const options = getCharacterActionCheckOptions(feature)

  return (
    options.find((option) => option.id === checkOptionId) ??
    options[0] ??
    null
  )
}

function normalizeSkillName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]/g, '')
}

const legacyAttributeByName: Record<string, CharacterActionCheckOption['atributo']> = {
  agilidade: 'agilidade',
  forca: 'forca',
  intelecto: 'intelecto',
  presenca: 'presenca',
  vigor: 'vigor',
}

function getLegacyCombatCheckOption(feature: CharacterFeatureDetail) {
  const descriptor = [
    feature.automation?.activation,
    ...(feature.automation?.tags ?? []),
    feature.descricao,
  ]
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
  const match =
    /\b(forca|agilidade|intelecto|presenca|vigor)\s*\+\s*([a-z0-9]+(?:\s+[a-z0-9]+){0,2})\s+vs\b/.exec(
      descriptor,
    )

  if (!match) {
    return null
  }

  const atributo = legacyAttributeByName[match[1]]
  const pericia = match[2].trim()

  if (!atributo || !pericia) {
    return null
  }

  return {
    atributo,
    id: 'legacy-combat-check',
    label: `${atributo.toUpperCase()} + ${pericia}`,
    pericia,
  } satisfies CharacterActionCheckOption
}

function getActionSkillBonus(
  character: CharacterSheet,
  skillName: string | undefined,
  fallback: number,
) {
  if (!skillName) {
    return fallback
  }

  const target = normalizeSkillName(skillName)
  const hasSkill = character.pericias.some(
    (skill) => normalizeSkillName(skill.nome) === target,
  )

  return hasSkill
    ? getCharacterSkillRollBonus(character, skillName)
    : fallback
}

export function getCharacterActionRollConfig(
  feature: CharacterFeatureDetail,
  character?: CharacterSheet,
  checkOptionId?: string,
): RollConfig | null {
  const roll = feature.automation?.roll
  const check = feature.automation?.combat?.teste
  const option = getCharacterActionCheckOption(feature, checkOptionId)

  if (character && (option?.atributo || check?.atributo)) {
    const attribute = option?.atributo ?? check?.atributo
    const skill = option?.pericia ?? check?.pericia

    if (attribute) {
      return createCombatRollConfig({
        atributo: character.atributos[attribute] ?? 0,
        bonusPericia: getActionSkillBonus(character, skill, roll?.bonus ?? 0),
      })
    }
  }

  if (!roll) {
    return null
  }

  return {
    quantidadeDados: roll.quantidadeDados,
    tipoDado: roll.tipoDado,
    bonus: roll.bonus,
    modo: roll.modo,
  }
}

function inferAttackSkill(attack: CharacterAttack) {
  const descriptor = `${attack.nome} ${attack.alcance} ${attack.resumo}`.toLocaleLowerCase('pt-BR')

  return /arco|besta|disparo|pistola|rifle|tiro|pontaria|proj[eé]til|dist[aâ]ncia/.test(
    descriptor,
  )
    ? 'Pontaria'
    : 'Luta'
}

function getDefaultAttackCheckOptions(attack: CharacterAttack): CharacterActionCheckOption[] {
  const descriptor = `${attack.nome} ${attack.alcance} ${attack.resumo}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
  const canBeThrown = /\b(adaga|faca|punhal|dardo)\b/.test(descriptor)

  if (canBeThrown) {
    return [
      {
        atributo: 'forca',
        damageContext: 'melee',
        id: 'melee',
        label: 'Corpo a corpo - FOR + Luta',
        pericia: 'Luta',
      },
      {
        atributo: 'agilidade',
        damageContext: 'ranged',
        id: 'ranged',
        label: 'Arremesso - AGI + Pontaria',
        pericia: 'Pontaria',
      },
    ]
  }

  return []
}

export function buildAttackActionFeature(
  character: CharacterSheet,
  attack: CharacterAttack,
): CharacterFeatureDetail {
  const damageLabel = attack.dano.trim()
  const rangeLabel = attack.alcance.trim()
  const summary = attack.resumo.trim()
  const inferredSkill = inferAttackSkill(attack)
  const inferredOptions = getDefaultAttackCheckOptions(attack)
  const defaultCheckOption = inferredOptions[0]
  const defaultAttribute = defaultCheckOption?.atributo ?? attack.atributoBase
  const defaultSkill = defaultCheckOption?.pericia ?? inferredSkill
  const defaultRollConfig = createCombatRollConfig({
    atributo: character.atributos[defaultAttribute] ?? 0,
    bonusPericia: getActionSkillBonus(
      character,
      defaultSkill,
      attack.bonusPericia,
    ),
  })
  const tags = [
    damageLabel ? `Dano: ${damageLabel}` : '',
    rangeLabel ? `Alcance: ${rangeLabel}` : '',
  ].filter(Boolean)
  const defaultRoll = {
    ...defaultRollConfig,
    contexto: attack.nome,
    visibility: 'public' as const,
    visualColor: '#e5743d',
  }
  const defaultDamage = damageLabel
    ? {
        formula: damageLabel,
        critico: 'dados' as const,
        gatilho: 'acerto' as const,
      }
    : undefined
  const defaultCombat = {
    acao: 'principal' as const,
    teste: {
      atributo: defaultAttribute,
      pericia: defaultSkill,
      alvo: 'ca' as const,
      opcoes: inferredOptions.length > 0 ? inferredOptions : undefined,
    },
    dano: defaultDamage,
    efeitoRapido: summary || (damageLabel ? 'Aplica dano se acertar.' : ''),
    falha: 'Sem dano; a Acao Principal foi usada.',
    reacao: 'O alvo pode gastar a Reacao para Bloquear ou Esquivar.',
  }
  const previousAutomation = attack.automation
  const previousCombat = previousAutomation?.combat
  const previousCheck = previousCombat?.teste
  const mergedCheck = {
    ...defaultCombat.teste,
    ...previousCheck,
    opcoes:
      previousCheck?.opcoes && previousCheck.opcoes.length > 0
        ? previousCheck.opcoes
        : defaultCombat.teste.opcoes,
  }

  return {
    id: `attack-action-${attack.id}`,
    nome: attack.nome,
    descricao:
      summary ||
      [damageLabel ? `Dano: ${damageLabel}` : '', rangeLabel ? `Alcance: ${rangeLabel}` : '']
        .filter(Boolean)
        .join(' | '),
    tipo: 'ataque',
    automation: {
      kind: 'ataque',
      activation: 'Acao Principal',
      range: rangeLabel || undefined,
      tags,
      roll: defaultRoll,
      publicText: `${character.nome} atacou com ${attack.nome}.`,
      gmText: `${character.nome} atacou com ${attack.nome}.${damageLabel ? ` Dano: ${damageLabel}.` : ''}${rangeLabel ? ` Alcance: ${rangeLabel}.` : ''}`,
      visualColor: '#e5743d',
      ...previousAutomation,
      combat: {
        ...defaultCombat,
        ...previousCombat,
        teste: {
          ...mergedCheck,
        },
        dano: previousCombat?.dano
          ? {
              ...defaultDamage,
              ...previousCombat.dano,
            }
          : defaultDamage,
      },
    },
  }
}

export function buildInventoryItemActionFeature(
  character: CharacterSheet,
  item: CharacterInventoryItem,
): CharacterFeatureDetail {
  const effects = item.efeitos
    .map((effect) => effect.trim())
    .filter(Boolean)
  const description = item.descricao.trim()

  return {
    id: `item-action-${item.id}`,
    nome: item.nome,
    descricao:
      description ||
      (effects.length > 0 ? effects.join(' | ') : 'Item sem descricao cadastrada.'),
    tipo: 'item',
    automation: item.automation ?? {
      kind: 'item',
      activation: 'Uso',
      tags: effects,
      publicText: `${character.nome} usou item: ${item.nome}.`,
      gmText: `${character.nome} usou item: ${item.nome}.${effects.length > 0 ? ` Efeitos: ${effects.join('; ')}.` : ''}`,
      visualColor: '#7ec8a5',
    },
  }
}
