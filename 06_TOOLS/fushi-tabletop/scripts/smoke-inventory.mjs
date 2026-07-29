import assert from 'node:assert/strict'
import {
  getInventoryCapacitySummary,
  INVENTORY_RULES,
  formatInventoryCapacity,
} from '../src/lib/inventoryCapacity.ts'

function item(nome, porte, quantidade = 1) {
  return {
    id: nome.toLowerCase().replaceAll(/\s+/g, '-'),
    nome,
    descricao: '',
    efeitos: [],
    porte,
    quantidade,
  }
}

function character({
  items = [],
  legacyItems = [],
  mochila = 'nenhuma',
  movimento = '9 m',
} = {}) {
  return {
    inventario: legacyItems,
    inventarioDetalhado: items,
    inventarioPerfil: { mochila },
    deslocamento: movimento,
  }
}

function summary(input) {
  const snapshot = structuredClone(input)
  const result = getInventoryCapacitySummary(input)
  assert.deepEqual(input, snapshot, 'calculo de carga nao pode mutar a ficha')
  return result
}

assert.equal(INVENTORY_RULES.baseMediumCapacity, 3)
assert.equal(INVENTORY_RULES.smallPerMedium, 3)
assert.equal(INVENTORY_RULES.mediumPerLarge, 2)

{
  const result = summary(
    character({ items: [item('Facas', 'pequeno', 9)] }),
  )
  assert.equal(result.usedMediumUnits, 3)
  assert.equal(result.capacityMediumUnits, 3)
  assert.equal(result.isOverCapacity, false)
  assert.equal(result.effectiveMovementMeters, 9)
}

{
  const result = summary(
    character({ items: [item('Kit medio', 'medio', 3)] }),
  )
  assert.equal(result.usedMediumUnits, 3)
  assert.equal(result.isOverCapacity, false)
}

{
  const result = summary(
    character({
      items: [
        item('Item grande', 'grande'),
        item('Item medio', 'medio'),
      ],
    }),
  )
  assert.equal(result.usedMediumUnits, 3)
  assert.equal(result.isOverCapacity, false)
}

{
  const result = summary(
    character({
      items: [
        item('Item grande', 'grande'),
        item('Utilitarios', 'pequeno', 3),
      ],
    }),
  )
  assert.equal(result.usedMediumUnits, 3)
  assert.equal(result.isOverCapacity, false)
}

{
  const result = summary(
    character({
      items: [
        item('Grande+', 'grande_plus'),
        item('Utilitarios', 'pequeno', 3),
      ],
    }),
  )
  assert.equal(result.capacitySmallUnits, 3)
  assert.equal(result.isOverCapacity, false)
  assert.equal(result.hasInvalidLargePlusCombination, false)
}

{
  const result = summary(
    character({
      items: [
        item('Grande+', 'grande_plus'),
        item('Utilitarios', 'pequeno', 4),
      ],
    }),
  )
  assert.equal(result.isOverCapacity, true)
}

{
  const result = summary(
    character({
      items: [
        item('Grande+', 'grande_plus'),
        item('Item medio', 'medio'),
      ],
    }),
  )
  assert.equal(result.hasInvalidLargePlusCombination, true)
  assert.equal(result.isOverCapacity, true)
}

{
  const result = summary(
    character({
      items: [item('Carga de mochila', 'medio', 6)],
      mochila: 'mochila',
      movimento: '9 m',
    }),
  )
  assert.equal(result.capacityMediumUnits, 6)
  assert.equal(result.movementPenaltyMeters, 6)
  assert.equal(result.effectiveMovementMeters, 3)
  assert.equal(result.isOverCapacity, false)
}

{
  const result = summary(
    character({
      items: [item('Carga Mochila+', 'pequeno', 42)],
      mochila: 'mochila_plus',
      movimento: '12 m',
    }),
  )
  assert.equal(result.capacityMediumUnits, 14)
  assert.equal(result.capacitySmallUnits, 42)
  assert.equal(result.movementPenaltyMeters, 11)
  assert.equal(result.effectiveMovementMeters, 1)
  assert.equal(result.isOverCapacity, false)
}

{
  const result = summary(
    character({
      items: [item('Carga Mochila+ sem limite', 'pequeno', 60)],
      mochila: 'mochila_plus',
      movimento: '12 m',
    }),
  )
  assert.equal(result.movementPenaltyMeters, 11)
  assert.equal(result.effectiveMovementMeters, 1)
  assert.equal(
    result.isOverCapacity,
    false,
    'Mochila+ nao cria um teto de itens depois de chegar a 1 m',
  )
  assert.match(
    formatInventoryCapacity(result),
    /sem teto de carga/,
    'a ficha deve explicar que a referencia da Mochila+ nao e um teto',
  )
}

{
  const result = summary(
    character({
      items: [
        item('Grande+', 'grande_plus'),
        item('Carga pequena Mochila+', 'pequeno', 42),
      ],
      mochila: 'mochila_plus',
      movimento: '12 m',
    }),
  )
  assert.equal(result.capacitySmallUnits, 42)
  assert.equal(result.isOverCapacity, false)
  assert.equal(result.hasInvalidLargePlusCombination, false)
}

{
  const result = summary(
    character({ legacyItems: ['Item antigo'] }),
  )
  assert.equal(result.usedMediumUnits, 1)
  assert.equal(result.unknownSizeCount, 1)
  assert.match(result.warnings.join(' '), /sem porte definido/)
}

console.log('[smoke:inventory] OK - regras de capacidade e deslocamento validadas.')
