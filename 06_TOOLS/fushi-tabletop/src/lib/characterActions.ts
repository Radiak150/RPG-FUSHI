import type {
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
import { formatRollFormula } from './rolls'

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

export function getCharacterActionRollLabel(feature: CharacterFeatureDetail) {
  const roll = feature.automation?.roll

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

export function getCharacterActionRollConfig(
  feature: CharacterFeatureDetail,
): RollConfig | null {
  const roll = feature.automation?.roll

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

export function buildAttackActionFeature(
  character: CharacterSheet,
  attack: CharacterAttack,
): CharacterFeatureDetail {
  const quantidadeDados = Math.max(1, character.atributos[attack.atributoBase] ?? 1)
  const damageLabel = attack.dano.trim()
  const rangeLabel = attack.alcance.trim()
  const summary = attack.resumo.trim()
  const tags = [
    damageLabel ? `Dano: ${damageLabel}` : '',
    rangeLabel ? `Alcance: ${rangeLabel}` : '',
  ].filter(Boolean)

  return {
    id: `attack-action-${attack.id}`,
    nome: attack.nome,
    descricao:
      summary ||
      [damageLabel ? `Dano: ${damageLabel}` : '', rangeLabel ? `Alcance: ${rangeLabel}` : '']
        .filter(Boolean)
        .join(' | '),
    tipo: 'ataque',
    automation: attack.automation ?? {
      kind: 'ataque',
      activation: 'Acao padrao',
      range: rangeLabel || undefined,
      tags,
      roll: {
        quantidadeDados,
        tipoDado: 20,
        bonus: attack.bonusPericia,
        modo: 'highest',
        contexto: attack.nome,
        visibility: 'public',
        visualColor: '#e5743d',
      },
      publicText: `${character.nome} atacou com ${attack.nome}.`,
      gmText: `${character.nome} atacou com ${attack.nome}.${damageLabel ? ` Dano: ${damageLabel}.` : ''}${rangeLabel ? ` Alcance: ${rangeLabel}.` : ''}`,
      visualColor: '#e5743d',
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
