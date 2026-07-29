import type {
  CharacterActionAutomation,
  CharacterAttack,
  CharacterFeatureDetail,
  CharacterSheet,
  CharacterSkill,
  RollRecord,
} from '../data/types'

export const COMBAT_V2_VERSION = 2
export const COMBAT_V2_BLOCK_CAP = 15

export type CombatManeuverId =
  | 'agarrar'
  | 'empurrar'
  | 'puxar'
  | 'derrubar'
  | 'desarmar'
  | 'ajudar'
  | 'desengajar'
  | 'preparar'

export interface CombatManeuverDefinition {
  id: CombatManeuverId
  label: string
  timing: 'principal' | 'curta'
  test: string
  result: string
  playerHint: string
}

export const COMBAT_MANEUVER_DEFINITIONS: CombatManeuverDefinition[] = [
  {
    id: 'agarrar',
    label: 'Agarrar',
    timing: 'principal',
    test: 'FOR + Luta vs FOR + Fortitude ou AGI + Acrobacia',
    result: 'Alvo fica Agarrado: deslocamento 0; escapar exige Ação Principal.',
    playerHint: 'Segure um alvo para abrir espaço a aliados ou impedir fuga.',
  },
  {
    id: 'empurrar',
    label: 'Empurrar',
    timing: 'principal',
    test: 'FOR + Luta vs FOR + Fortitude ou AGI + Acrobacia',
    result: 'Move o alvo 3 m; terreno perigoso cria a consequência narrada.',
    playerHint: 'Crie distância, tire cobertura ou force posição ruim.',
  },
  {
    id: 'puxar',
    label: 'Puxar',
    timing: 'principal',
    test: 'FOR + Luta com pegada, corda ou gancho vs FOR + Fortitude ou AGI + Acrobacia',
    result: 'Move o alvo 3 m em sua direcao; sem pegada, corda ou gancho a tentativa falha.',
    playerHint: 'Tire um alvo da cobertura, aproxime-o do grupo ou afaste-o de um aliado.',
  },
  {
    id: 'derrubar',
    label: 'Derrubar',
    timing: 'principal',
    test: 'FOR ou AGI + Luta vs AGI + Acrobacia',
    result: 'Alvo fica Caído e gasta Movimento para levantar.',
    playerHint: 'Abra vantagem para combate corpo a corpo sem causar dano direto.',
  },
  {
    id: 'desarmar',
    label: 'Desarmar',
    timing: 'principal',
    test: 'AGI + Luta vs AGI + Acrobacia',
    result: 'O item cai em uma célula adjacente; não é destruído.',
    playerHint: 'Quebre a rotina de quem depende de arma, foco ou objeto.',
  },
  {
    id: 'ajudar',
    label: 'Ajudar',
    timing: 'curta',
    test: 'Ação coerente com a cena',
    result: 'Aliado recebe +1d20 na próxima ação declarada.',
    playerHint: 'Declare como está criando a abertura antes da rolagem do aliado.',
  },
  {
    id: 'desengajar',
    label: 'Desengajar',
    timing: 'curta',
    test: 'Sem teste',
    result: 'Sai de uma manada sem provocar ataque de oportunidade.',
    playerHint: 'Use antes de abandonar dois ou mais inimigos pressionando você.',
  },
  {
    id: 'preparar',
    label: 'Preparar',
    timing: 'principal',
    test: 'Gatilho declarado',
    result: 'Reserva a Reação para uma ação específica quando o gatilho ocorrer.',
    playerHint: 'Diga claramente o que fará e qual evento dispara a resposta.',
  },
]

export interface ParsedDamageFormula {
  bonus: number
  dice: number
  sides: number
}

export interface ResolvedCombatAction {
  action: 'principal' | 'curta' | 'reacao' | 'movimento' | 'passiva'
  damageFormula: string
  effect: string
  failure: string
  range: string
  reaction: string
  risk: string
  target: string
  test: string
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function normalizeSkillName(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]/g, '')
}

function readSkill(character: CharacterSheet, name: string): CharacterSkill | undefined {
  const target = normalizeSkillName(name)

  return character.pericias.find((skill) => normalizeSkillName(skill.nome) === target)
}

export function getSkillBonus(character: CharacterSheet, name: string) {
  return Math.max(0, Math.round(readSkill(character, name)?.bonusPericia ?? 0))
}

function getCombatBuildModifiers(character: CharacterSheet) {
  const build = character.combatProfile?.build
  return build?.totals ?? build?.item?.modifiers ?? null
}

export function getCharacterSkillRollBonus(character: CharacterSheet, name: string) {
  const skillBonus = getSkillBonus(character, name)
  const buildBonus =
    normalizeSkillName(name) === 'iniciativa'
      ? Math.round(getCombatBuildModifiers(character)?.initiative ?? 0)
      : 0

  return skillBonus + buildBonus
}

export function getCombatBlockValue(character: CharacterSheet) {
  const base = getSkillBonus(character, 'Fortitude')
  const bonus = Math.max(0, Math.round(character.combatProfile?.bloqueioBonus ?? 0))
  const buildBonus = Math.max(0, Math.round(getCombatBuildModifiers(character)?.block ?? 0))
  const cap = Math.max(
    0,
    Math.min(COMBAT_V2_BLOCK_CAP, Math.round(character.combatProfile?.bloqueioCap ?? COMBAT_V2_BLOCK_CAP)),
  )

  return Math.max(0, Math.min(cap, base + bonus) + buildBonus)
}

export function getCombatDodgeValue(character: CharacterSheet): number | null {
  if (character.combatProfile?.podeEsquivar === false) {
    return null
  }

  const agility = Math.round(character.atributos.agilidade ?? 0)
  const reflexes = getSkillBonus(character, 'Reflexos')

  return Math.max(0, Math.round(character.defesa) + agility + reflexes)
}

export function getCombatDodgeSummary(character: CharacterSheet) {
  const dodge = getCombatDodgeValue(character)

  if (dodge === null) {
    return 'Não pode Esquivar por regra específica.'
  }

  return `${dodge} fixo = CA ${character.defesa} + AGI ${character.atributos.agilidade} + Reflexos ${getSkillBonus(character, 'Reflexos')}`
}

export type CombatBuildDamageContext = 'ability' | 'adjacent' | 'melee' | 'ranged'

export function getCombatBuildDamageBonus(
  character: CharacterSheet,
  context: CombatBuildDamageContext | CombatBuildDamageContext[],
) {
  const modifiers = getCombatBuildModifiers(character)

  if (!modifiers) return 0

  const contexts = new Set(Array.isArray(context) ? context : [context])

  return Math.round(
    modifiers.damage +
      (contexts.has('ability') ? modifiers.abilityDamage : 0) +
      (contexts.has('adjacent') ? modifiers.adjacentDamage : 0) +
      (contexts.has('melee') ? modifiers.meleeDamage : 0) +
      (contexts.has('ranged') ? modifiers.rangedDamage : 0),
  )
}

export function getCombatCaPenetration(character: CharacterSheet) {
  return Math.max(0, Math.round(getCombatBuildModifiers(character)?.caPenetration ?? 0))
}

export function getCombatCriticalDamageBonus(character: CharacterSheet) {
  return Math.max(0, Math.round(getCombatBuildModifiers(character)?.criticalDamage ?? 0))
}

export function getCombatHealingBonus(character: CharacterSheet) {
  return Math.round(getCombatBuildModifiers(character)?.healing ?? 0)
}

export function applyCombatBuildDamageBonus(
  formula: string,
  character: CharacterSheet,
  context: CombatBuildDamageContext | CombatBuildDamageContext[],
) {
  const parsed = parseDamageFormula(formula)

  if (!parsed) return formula

  return formatDamageFormula({
    ...parsed,
    bonus: parsed.bonus + getCombatBuildDamageBonus(character, context),
  })
}

export function parseDamageFormula(formula: string): ParsedDamageFormula | null {
  const match = /^\s*(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?\s*$/i.exec(formula)

  if (!match) {
    return null
  }

  const dice = Math.max(1, Number(match[1] || '1'))
  const sides = Math.max(2, Number(match[2]))
  const bonusMagnitude = Number(match[4] ?? '0')
  const bonus = match[3] === '-' ? -bonusMagnitude : bonusMagnitude

  return Number.isFinite(dice) && Number.isFinite(sides) && Number.isFinite(bonus)
    ? { bonus, dice, sides }
    : null
}

export function formatDamageFormula(parsed: ParsedDamageFormula) {
  const prefix = `${parsed.dice}d${parsed.sides}`

  if (!parsed.bonus) {
    return prefix
  }

  return `${prefix} ${parsed.bonus > 0 ? '+' : '-'} ${Math.abs(parsed.bonus)}`
}

export function getCriticalDamageFormula(formula: string, criticalBuildBonus = 0) {
  const parsed = parseDamageFormula(formula)

  if (!parsed) {
    return formula
  }

  return formatDamageFormula({
    ...parsed,
    bonus: parsed.bonus + Math.max(0, Math.round(criticalBuildBonus)),
    dice: parsed.dice * 2,
  })
}

export function getDamageAverage(formula: string) {
  const parsed = parseDamageFormula(formula)

  if (!parsed) {
    return 0
  }

  return parsed.dice * ((parsed.sides + 1) / 2) + parsed.bonus
}

export function applyCombatBlock(rawDamage: number, blockValue: number) {
  return Math.max(0, Math.floor(rawDamage) - Math.max(0, Math.floor(blockValue)))
}

export function isCriticalAttackRoll(roll: Pick<RollRecord, 'resultadoBase' | 'tipoDado'> | null | undefined) {
  return Boolean(roll && roll.resultadoBase === roll.tipoDado)
}

function getLegacyDamageFormula(automation: CharacterActionAutomation | undefined, description: string) {
  const tagged = automation?.tags
    ?.map((tag) => {
      const normalizedTag = tag.trim()
      return (
        /^dano\s*[:=-]\s*(.+)$/i.exec(normalizedTag)?.[1]?.trim() ??
        /\b(\d*d\d+(?:\s*[+-]\s*\d+)?)\s+dano\b/i.exec(normalizedTag)?.[1]?.trim() ??
        ''
      )
    })
    .find(Boolean)

  if (tagged) {
    return tagged
  }

  return (
    /dano\s*[:=-]\s*(\d*d\d+(?:\s*[+-]\s*\d+)?)/i.exec(description)?.[1]?.trim() ??
    /(\d*d\d+(?:\s*[+-]\s*\d+)?)\s+dano\b/i.exec(description)?.[1]?.trim() ??
    ''
  )
}

const DESCRIPTION_SECTION_LABELS = [
  'acao',
  'ativacao',
  'alvo',
  'alcance',
  'custo',
  'dano',
  'duracao',
  'efeito',
  'falha',
  'fracasso',
  'limite',
  'preco',
  'reacao',
  'resultado',
  'risco',
  'sucesso',
  'teste',
  'tipo',
]

function readDescriptionSection(description: string, requestedLabels: string[]) {
  const requested = new Set(requestedLabels.map(normalizeSkillName))
  const known = new Set(DESCRIPTION_SECTION_LABELS.map(normalizeSkillName))
  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
  const collected: string[] = []
  let reading = false

  for (const line of lines) {
    if (!line) {
      continue
    }

    const headingMatch = /^([^:]{2,24})\s*:\s*(.*)$/.exec(line)
    const bareHeading = !headingMatch && line.length <= 24 ? normalizeSkillName(line) : ''
    const heading = headingMatch ? normalizeSkillName(headingMatch[1]) : bareHeading

    if (heading && known.has(heading)) {
      if (reading && !requested.has(heading)) {
        break
      }

      reading = requested.has(heading)
      const inlineValue = headingMatch?.[2]?.trim()

      if (reading && inlineValue) {
        collected.push(inlineValue)
      }
      continue
    }

    if (reading) {
      collected.push(line.replace(/^[→•-]\s*/, ''))
    }
  }

  return collected.join(' · ').trim()
}

function getLegacyEffect(automation: CharacterActionAutomation | undefined, description: string) {
  const described =
    readDescriptionSection(description, ['efeito', 'sucesso', 'resultado']) ||
    readDescriptionSection(description, ['dano'])

  if (described) {
    return described
  }

  return (automation?.tags ?? [])
    .map((tag) => tag.trim())
    .filter(
      (tag) =>
        tag &&
        !/^(ataque|tecnica|t[eÃ©]cnica|passiva|instintiva|ritual|item)$/i.test(tag),
    )
    .slice(0, 2)
    .join(' · ')
}

export function resolveCombatAction(
  source: Pick<CharacterFeatureDetail, 'descricao' | 'automation'> | CharacterAttack,
): ResolvedCombatAction {
  const automation = source.automation
  const combat = automation?.combat
  const description = 'descricao' in source ? source.descricao : source.resumo
  const defaultAction = automation?.kind === 'passiva' ? 'passiva' : 'principal'
  const test = combat?.teste
  const optionText = test?.opcoes
    ?.map((option) => `${option.atributo.toUpperCase()} + ${option.pericia ?? 'sem pericia'}`)
    .join(' ou ')
  const opposedText =
    test?.alvo === 'resistido'
      ? [
          'vs',
          test.oposto?.atributo?.toUpperCase(),
          test.oposto?.pericia ? `+ ${test.oposto.pericia}` : '',
          'do alvo',
        ]
          .filter(Boolean)
          .join(' ')
      : ''
  const structuredTestText = test
    ? [
        optionText || test.atributo?.toUpperCase(),
        optionText ? '' : test.pericia,
        test.alvo === 'ca'
          ? 'vs CA'
          : test.alvo === 'dt' && test.dificuldade
            ? `vs DT ${test.dificuldade}`
            : opposedText,
        test.detalhe,
      ]
        .filter(Boolean)
        .join(' ')
    : ''
  const testText =
    structuredTestText ||
    readDescriptionSection(description, ['teste']) ||
    ''

  return {
    action: combat?.acao ?? defaultAction,
    damageFormula: combat?.dano?.formula ?? getLegacyDamageFormula(automation, description),
    effect: combat?.efeitoRapido ?? getLegacyEffect(automation, description),
    failure:
      combat?.falha ??
      readDescriptionSection(description, ['falha', 'fracasso']),
    range: automation?.range ?? '',
    reaction:
      combat?.reacao ??
      readDescriptionSection(description, ['reacao']),
    risk:
      combat?.risco ??
      readDescriptionSection(description, ['risco', 'preco']),
    target: automation?.target ?? '',
    test: testText,
  }
}

export function getAttackDamageFormula(attack: CharacterAttack) {
  return attack.automation?.combat?.dano?.formula ?? attack.dano
}

export function getDefaultUnarmedDamage(character: CharacterSheet) {
  void character
  return '1d2'
}

export function getPrimaryAttack(character: CharacterSheet) {
  return character.ataques[0] ?? null
}
