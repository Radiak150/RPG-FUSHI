import type { AttributeKey, RollConfig, RollMode, RollRecord } from '../data/types'

function buildRollId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `roll-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

export function createAttributeRollConfig(
  quantidadeDados: number,
  bonus = 0,
  modo: RollMode = 'highest',
): RollConfig {
  return {
    quantidadeDados,
    tipoDado: 20,
    bonus,
    modo,
  }
}

export function createCombatRollConfig(input: {
  atributo: number
  bonusPericia?: number
  modo?: RollMode
}): RollConfig {
  return createAttributeRollConfig(
    Math.max(1, input.atributo),
    input.bonusPericia ?? 0,
    input.modo ?? 'highest',
  )
}

export function createMultiAttackRollConfig(input: {
  atributo: number
  quantidadeAtaques: number
  bonusPericia?: number
}): RollConfig {
  const quantidadeAtaques = Math.max(1, input.quantidadeAtaques)
  const quantidadeDados = Math.max(1, input.atributo - (quantidadeAtaques - 1))

  return createAttributeRollConfig(quantidadeDados, input.bonusPericia ?? 0, 'lowest')
}

export function formatAttributeLabel(attribute: AttributeKey) {
  const labels: Record<AttributeKey, string> = {
    forca: 'Forca',
    agilidade: 'Agilidade',
    intelecto: 'Intelecto',
    presenca: 'Presenca',
    vigor: 'Vigor',
  }

  return labels[attribute]
}

export function formatRollFormula(config: RollConfig) {
  const bonus = config.bonus ?? 0
  const bonusText =
    bonus === 0 ? '' : ` ${bonus > 0 ? '+' : '-'} ${Math.abs(bonus)}`
  const modeText =
    config.modo === 'sum'
      ? '+ soma dos dados'
      : config.modo === 'lowest'
        ? '- menor dado'
        : '= maior dado'

  return `${modeText} de ${config.quantidadeDados}d${config.tipoDado}${bonusText}`
}

export type RollOutcome = 'critical' | 'normal' | 'triumph'

export function getRollOutcome(
  record: Pick<RollRecord, 'modo' | 'resultadoBase' | 'resultados' | 'tipoDado'>,
): RollOutcome {
  if (record.modo === 'sum') {
    if (record.resultados.every((result) => result <= 1)) {
      return 'critical'
    }

    if (record.resultados.every((result) => result >= record.tipoDado)) {
      return 'triumph'
    }

    return 'normal'
  }

  if (record.resultadoBase <= 1) {
    return 'critical'
  }

  if (record.resultadoBase >= record.tipoDado) {
    return 'triumph'
  }

  return 'normal'
}

export function createRollRecord(
  config: RollConfig,
  contexto: string,
  options: { visualColor?: string } = {},
): RollRecord {
  const bonus = config.bonus ?? 0
  const modo = config.modo ?? 'highest'
  const resultados = Array.from({ length: config.quantidadeDados }, () =>
    Math.floor(Math.random() * config.tipoDado) + 1,
  )
  const resultadoBase =
    modo === 'sum'
      ? resultados.reduce((total, value) => total + value, 0)
      : modo === 'lowest'
        ? Math.min(...resultados)
      : Math.max(...resultados)
  const total = resultadoBase + bonus
  const bonusText =
    bonus === 0
      ? ''
      : ` ${bonus > 0 ? '+' : '-'} ${Math.abs(bonus)}`
  const modoTexto =
    modo === 'sum'
      ? '+ soma dos dados'
      : modo === 'lowest'
        ? '- menor dado'
        : '= maior dado'

  return {
    ...config,
    bonus,
    modo,
    id: buildRollId(),
    contexto,
    resultados,
    resultadoBase,
    total,
    resultadoTexto: `${contexto}: ${modoTexto} de ${config.quantidadeDados}d${config.tipoDado}${bonusText} -> [${resultados.join(', ')}] = ${total}`,
    visualColor: options.visualColor,
  }
}
