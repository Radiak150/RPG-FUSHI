const {
  BUILD_MODIFIER_KEYS,
  evaluateBuildItemByRarity,
  readBuildCatalog,
  rarityFromPotency,
} = require('./lib/fushi-build-system.cjs')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function active(modifiers) {
  return Object.fromEntries(Object.entries(modifiers).filter(([, value]) => value !== 0))
}

function main() {
  const catalog = readBuildCatalog(process.cwd())
  assert(catalog.version === 2, `Catalogo precisa estar em v2: ${catalog.version}`)
  assert(catalog.items.length === 48, `Esperado 48 itens: ${catalog.items.length}`)
  assert(new Set(catalog.items.map((item) => item.id)).size === 48, 'IDs duplicados')
  assert(catalog.biomes.length === 8, `Esperado 8 biomas: ${catalog.biomes.length}`)
  assert(catalog.archetypes.length === 6, `Esperado 6 arquetipos: ${catalog.archetypes.length}`)
  assert(catalog.secretItems.length === 2, `Esperado 2 itens Secretos corretivos: ${catalog.secretItems.length}`)

  for (const biome of catalog.biomes) {
    assert(catalog.items.filter((item) => item.biomeId === biome.id).length === 6, `${biome.label}: precisa de 6 itens`)
  }
  for (const archetype of catalog.archetypes) {
    assert(catalog.items.filter((item) => item.archetype === archetype.id).length === 8, `${archetype.label}: precisa de 8 itens`)
  }

  assert(rarityFromPotency(catalog, 1).id === 'comum', 'R1 precisa ser Comum')
  assert(rarityFromPotency(catalog, 3).id === 'raro', 'R3 precisa ser Raro')
  assert(rarityFromPotency(catalog, 5).id === 'epico', 'R5 precisa ser Epico')
  assert(rarityFromPotency(catalog, 7).id === 'lendario', 'R7 precisa ser Lendario')
  assert(rarityFromPotency(catalog, 10).id === 'mitico', 'R10 precisa ser Mitico')

  for (const item of catalog.items) {
    assert(String(item.passive ?? '').trim(), `${item.name}: passiva vazia`)
    const weightEntries = Object.entries(item.weights ?? {})
    assert(weightEntries.some(([, value]) => value > 0), `${item.name}: sem ganho`)
    assert(weightEntries.some(([, value]) => value < 0), `${item.name}: sem custo`)
    assert(
      weightEntries.reduce((sum, [, value]) => sum + Math.abs(value), 0) === 10,
      `${item.name}: pesos-base precisam somar 10`,
    )
    weightEntries.forEach(([key]) => assert(BUILD_MODIFIER_KEYS.includes(key), `${item.name}: stat desconhecido ${key}`))

    for (const rarity of catalog.rarities) {
      const resolved = evaluateBuildItemByRarity(catalog, item, rarity.id)
      const gross = Object.values(resolved.modifiers).reduce((sum, value) => sum + Math.abs(value), 0)
      assert(gross === catalog.rarityBudgets[rarity.id], `${item.name}/${rarity.label}: ${gross} != ${catalog.rarityBudgets[rarity.id]}`)
    }
  }

  const anchors = Object.fromEntries(
    catalog.archetypes.map((archetype) => {
      const item = catalog.items.find((entry) => entry.id === archetype.publicExampleItemId)
      assert(item, `${archetype.label}: exemplo publico ausente`)
      return [archetype.id, active(evaluateBuildItemByRarity(catalog, item, 'comum').modifiers)]
    }),
  )
  assert(anchors.tank.life === 7 && anchors.tank.damage === -3, 'Tank publico precisa ser +7 Vida/-3 Dano')
  assert(anchors.assassino.damage === 3 && anchors.assassino.life === -7, 'Assassino publico precisa ser +3 Dano/-7 Vida')
  assert(anchors.lutador.life === 2 && anchors.lutador.meleeDamage === 2 && anchors.lutador.fushi === -6, 'Lutador publico precisa ser +2 Vida/+2 corpo a corpo/-6 FUSHI')
  assert(anchors.atirador.rangedDamage === 5 && anchors.atirador.adjacentDamage === -5, 'Atirador publico precisa ser +5 distancia/-5 adjacente')
  assert(anchors.ocultista.fushi === 6 && anchors.ocultista.life === -4, 'Ocultista publico precisa ser +6 FUSHI/-4 Vida')

  console.log('[build-catalog] PASS: v2, 48 itens, 240 raridades e orcamentos exatos')
  console.log(`  exemplos: ${JSON.stringify(anchors)}`)
}

main()
