import type {
  CharacterInventoryItem,
  CharacterInventoryProfile,
  CharacterSheet,
  InventoryItemSize,
  InventoryPackType,
} from '../data/types'

export const INVENTORY_RULES = {
  baseMediumCapacity: 3,
  smallPerMedium: 3,
  mediumPerLarge: 2,
  minimumMovementMeters: 1,
  normalBackpackExtraMediumCapacity: 3,
  normalBackpackPenaltyPerExtraMedium: 2,
  backpackPlusPenaltyPerExtraMedium: 1,
} as const

export interface InventoryCapacitySummary {
  pack: InventoryPackType
  packLabel: string
  baseMovementMeters: number
  effectiveMovementMeters: number
  movementPenaltyMeters: number
  capacityMediumUnits: number
  capacitySmallUnits: number
  usedMediumUnits: number
  usedSmallUnits: number
  usedMediumCount: number
  usedLargeCount: number
  largePlusCount: number
  unknownSizeCount: number
  isOverCapacity: boolean
  hasInvalidLargePlusCombination: boolean
  movementFloorReached: boolean
  warnings: string[]
}

interface InventoryItemMeasurement {
  size: InventoryItemSize | 'pendente'
  quantity: number
  smallUnits: number
  isLargePlus: boolean
  isUnknown: boolean
}

function asPositiveInteger(value: number | undefined, fallback = 1) {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(1, Math.floor(value as number))
}

function getPackLabel(pack: InventoryPackType) {
  switch (pack) {
    case 'mochila':
      return 'Mochila normal'
    case 'mochila_plus':
      return 'Mochila+'
    default:
      return 'Inventario comum'
  }
}

function parseMovementMeters(value?: string) {
  const match = value?.match(/-?\d+(?:[.,]\d+)?/)
  const parsed = match ? Number(match[0].replace(',', '.')) : 9

  return Number.isFinite(parsed)
    ? Math.max(INVENTORY_RULES.minimumMovementMeters, Math.floor(parsed))
    : 9
}

function getInventoryMeasurement(item: CharacterInventoryItem): InventoryItemMeasurement {
  const quantity = asPositiveInteger(item.quantidade)
  const size = item.porte ?? 'pendente'

  if (size === 'pequeno') {
    return {
      size,
      quantity,
      smallUnits: quantity,
      isLargePlus: false,
      isUnknown: false,
    }
  }

  if (size === 'medio') {
    return {
      size,
      quantity,
      smallUnits: quantity * INVENTORY_RULES.smallPerMedium,
      isLargePlus: false,
      isUnknown: false,
    }
  }

  if (size === 'grande') {
    return {
      size,
      quantity,
      smallUnits: quantity * INVENTORY_RULES.smallPerMedium * INVENTORY_RULES.mediumPerLarge,
      isLargePlus: false,
      isUnknown: false,
    }
  }

  if (size === 'grande_plus') {
    return {
      size,
      quantity,
      smallUnits: 0,
      isLargePlus: true,
      isUnknown: false,
    }
  }

  // Legacy items have no size yet. Treating them as medium protects the
  // capacity calculation without silently changing the campaign data.
  return {
    size,
    quantity,
    smallUnits: quantity * INVENTORY_RULES.smallPerMedium,
    isLargePlus: false,
    isUnknown: true,
  }
}

function getCapacityMediumUnits(
  pack: InventoryPackType,
  baseMovementMeters: number,
) {
  if (pack === 'mochila') {
    return (
      INVENTORY_RULES.baseMediumCapacity +
      INVENTORY_RULES.normalBackpackExtraMediumCapacity
    )
  }

  if (pack === 'mochila_plus') {
    // A 12 m character reaches 14 medium-equivalents:
    // 3 base + (12 - 1) movement-funded slots.
    return (
      INVENTORY_RULES.baseMediumCapacity +
      Math.max(0, baseMovementMeters - INVENTORY_RULES.minimumMovementMeters)
    )
  }

  return INVENTORY_RULES.baseMediumCapacity
}

function getExtraMediumUnits(usedSmallUnits: number) {
  const baseSmallUnits =
    INVENTORY_RULES.baseMediumCapacity * INVENTORY_RULES.smallPerMedium

  return Math.max(
    0,
    Math.ceil(
      (usedSmallUnits - baseSmallUnits) / INVENTORY_RULES.smallPerMedium,
    ),
  )
}

function buildWarnings(input: {
  capacityMediumUnits: number
  capacitySmallUnits: number
  hasInvalidLargePlusCombination: boolean
  largePlusCount: number
  pack: InventoryPackType
  usedMediumUnits: number
  usedSmallUnits: number
  unknownSizeCount: number
  movementFloorReached: boolean
  isUnlimitedPack: boolean
}) {
  const warnings: string[] = []

  if (input.unknownSizeCount > 0) {
    warnings.push(
      `${input.unknownSizeCount} item(ns) sem porte definido; calculado(s) como medio até a ficha ser classificada.`,
    )
  }

  if (input.largePlusCount > 1) {
    warnings.push(
      'Mais de um Grande+ exige uma decisao do Mestre; a regra publica considera um Grande+ por vez.',
    )
  }

  if (input.hasInvalidLargePlusCombination) {
    warnings.push(
      'Grande+ nao pode ser combinado com itens medio ou grande. Remova a carga incompatível antes de confirmar a ficha.',
    )
  }

  if (
    !input.isUnlimitedPack &&
    input.largePlusCount === 0 &&
    input.usedSmallUnits > input.capacitySmallUnits
  ) {
    warnings.push(
      `Carga acima da capacidade: ${input.usedMediumUnits} medio(s) equivalentes para ${input.capacityMediumUnits}.`,
    )
  }

  if (
    !input.isUnlimitedPack &&
    input.largePlusCount > 0 &&
    input.usedSmallUnits > input.capacitySmallUnits
  ) {
    warnings.push(
      `Grande+ com pequenos acima da cota: ${input.usedSmallUnits} pequeno(s) para ${input.capacitySmallUnits}.`,
    )
  }

  if (input.pack === 'mochila_plus' && input.movementFloorReached) {
    warnings.push(
      'Mochila+ atingiu o piso de 1 m; carga adicional nao reduz mais o deslocamento.',
    )
  }

  return warnings
}

export function getInventoryProfile(
  profile?: CharacterInventoryProfile,
): CharacterInventoryProfile {
  const mochila = profile?.mochila

  return {
    mochila:
      mochila === 'mochila' || mochila === 'mochila_plus'
        ? mochila
        : 'nenhuma',
  }
}

export function getInventoryCapacitySummary(
  character: Pick<CharacterSheet, 'inventario' | 'inventarioDetalhado' | 'inventarioPerfil' | 'deslocamento'>,
): InventoryCapacitySummary {
  const profile = getInventoryProfile(character.inventarioPerfil)
  const items =
    character.inventarioDetalhado && character.inventarioDetalhado.length > 0
      ? character.inventarioDetalhado
      : character.inventario.map((nome, index) => ({
          id: `legacy-${index + 1}`,
          nome,
          descricao: '',
          efeitos: [],
        }))
  const measurements = items.map(getInventoryMeasurement)
  const baseMovementMeters = parseMovementMeters(character.deslocamento)
  const capacityMediumUnits = getCapacityMediumUnits(
    profile.mochila,
    baseMovementMeters,
  )
  const capacitySmallUnits =
    capacityMediumUnits * INVENTORY_RULES.smallPerMedium
  const largePlusCount = measurements.filter((item) => item.isLargePlus).reduce(
    (total, item) => total + item.quantity,
    0,
  )
  const unknownSizeCount = measurements.filter((item) => item.isUnknown).length
  const usedSmallUnits = measurements.reduce(
    (total, item) => total + item.smallUnits,
    0,
  )
  const usedMediumUnits =
    Math.ceil(usedSmallUnits / INVENTORY_RULES.smallPerMedium * 100) / 100
  const usedMediumCount = measurements
    .filter((item) => item.size === 'medio' || item.isUnknown)
    .reduce((total, item) => total + item.quantity, 0)
  const usedLargeCount = measurements
    .filter((item) => item.size === 'grande')
    .reduce((total, item) => total + item.quantity, 0)
  const hasInvalidLargePlusCombination =
    largePlusCount > 0 &&
    measurements.some(
      (item) =>
        !item.isLargePlus &&
        (item.size === 'medio' || item.size === 'grande' || item.isUnknown),
    )

  // Grande+ keeps the explicitly stated small-item allowance. With no pack
  // this is 3 small; backpacks add their normal small-equivalent capacity.
  const largePlusSmallCapacity =
    largePlusCount > 0
      ? profile.mochila === 'nenhuma'
        ? INVENTORY_RULES.smallPerMedium
        : capacitySmallUnits
      : Number.POSITIVE_INFINITY
  const effectiveSmallCapacity =
    largePlusCount > 0 ? largePlusSmallCapacity : capacitySmallUnits
  const extraMediumUnits = getExtraMediumUnits(usedSmallUnits)
  const uncappedMovementPenaltyMeters =
    profile.mochila === 'mochila'
      ? extraMediumUnits * INVENTORY_RULES.normalBackpackPenaltyPerExtraMedium
      : profile.mochila === 'mochila_plus'
        ? extraMediumUnits * INVENTORY_RULES.backpackPlusPenaltyPerExtraMedium
        : 0
  const movementPenaltyMeters = Math.min(
    uncappedMovementPenaltyMeters,
    Math.max(0, baseMovementMeters - INVENTORY_RULES.minimumMovementMeters),
  )
  const effectiveMovementMeters =
    profile.mochila === 'mochila_plus'
      ? Math.max(
          INVENTORY_RULES.minimumMovementMeters,
          baseMovementMeters - movementPenaltyMeters,
        )
      : Math.max(
          INVENTORY_RULES.minimumMovementMeters,
          baseMovementMeters - movementPenaltyMeters,
        )
  const movementFloorReached =
    profile.mochila === 'mochila_plus' &&
    movementPenaltyMeters > 0 &&
    effectiveMovementMeters === INVENTORY_RULES.minimumMovementMeters &&
    movementPenaltyMeters >=
      baseMovementMeters - INVENTORY_RULES.minimumMovementMeters
  const isOverCapacity =
    largePlusCount > 1 ||
    hasInvalidLargePlusCombination ||
    (profile.mochila !== 'mochila_plus' &&
      usedSmallUnits > effectiveSmallCapacity)
  const warnings = buildWarnings({
    capacityMediumUnits,
    capacitySmallUnits: effectiveSmallCapacity,
    hasInvalidLargePlusCombination,
    largePlusCount,
    pack: profile.mochila,
    usedMediumUnits,
    usedSmallUnits,
    unknownSizeCount,
    movementFloorReached,
    isUnlimitedPack: profile.mochila === 'mochila_plus',
  })

  return {
    pack: profile.mochila,
    packLabel: getPackLabel(profile.mochila),
    baseMovementMeters,
    effectiveMovementMeters,
    movementPenaltyMeters,
    capacityMediumUnits,
    capacitySmallUnits: effectiveSmallCapacity,
    usedMediumUnits,
    usedSmallUnits,
    usedMediumCount,
    usedLargeCount,
    largePlusCount,
    unknownSizeCount,
    isOverCapacity,
    hasInvalidLargePlusCombination,
    movementFloorReached,
    warnings,
  }
}

export function getInventoryItemSizeLabel(size?: InventoryItemSize) {
  switch (size) {
    case 'pequeno':
      return 'Pequeno'
    case 'medio':
      return 'Medio'
    case 'grande':
      return 'Grande'
    case 'grande_plus':
      return 'Grande+'
    default:
      return 'Porte pendente'
  }
}

export function formatInventoryCapacity(summary: InventoryCapacitySummary) {
  if (summary.largePlusCount > 0) {
    if (summary.pack === 'mochila_plus' && summary.movementFloorReached) {
      return `${summary.usedSmallUnits} pequenos com Grande+ (piso 1 m; sem teto de carga)`
    }

    return `${summary.usedSmallUnits}/${summary.capacitySmallUnits} pequenos com Grande+`
  }

  if (summary.pack === 'mochila_plus' && summary.movementFloorReached) {
    return `${summary.usedMediumUnits} medios equivalentes (piso 1 m; sem teto de carga)`
  }

  return `${summary.usedMediumUnits}/${summary.capacityMediumUnits} medio(s) equivalentes`
}

export function formatInventoryMovement(summary: InventoryCapacitySummary) {
  if (summary.movementPenaltyMeters <= 0) {
    return `${summary.baseMovementMeters} m`
  }

  return `${summary.effectiveMovementMeters} m (-${summary.movementPenaltyMeters} m)`
}
