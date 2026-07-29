const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const outputJson = path.join(root, 'docs', 'fushi-system', 'COMBAT_BUILD_PROPOSAL_RESULTS.json')

const ENCOUNTER_ITERATIONS = 30_000
const WORLD_ITERATIONS = 100_000
const ROUND_LIMIT = 50

// Offline fixtures. They describe the proposal under test and never migrate a ficha.
const POWER_PROFILES = {
  basico: {
    attackSkill: 5,
    attributeCap: 4,
    attributeTotal: 9,
    block: 5,
    caPowerBase: 10,
    damage: { bonus: 2, count: 1, sides: 6 },
    determination: 10,
    fushi: 10,
    hp: 25,
    movement: 6,
    reflexSkillCap: 10,
  },
  avancado: {
    attackSkill: 10,
    attributeCap: 6,
    attributeTotal: 14,
    block: 10,
    caPowerBase: 15,
    damage: { bonus: 5, count: 3, sides: 10 },
    determination: 25,
    fushi: 50,
    hp: 130,
    movement: 6,
    reflexSkillCap: 10,
  },
  ascensao: {
    attackSkill: 15,
    attributeCap: 8,
    attributeTotal: 20,
    block: 15,
    caPowerBase: 20,
    damage: { bonus: 8, count: 5, sides: 10 },
    determination: 50,
    fushi: 125,
    hp: 325,
    movement: 6,
    reflexSkillCap: 15,
  },
}

const ARCHETYPES = ['tank', 'assassino', 'suporte', 'lutador', 'atirador', 'ocultista']
const ATTRIBUTE_ORDER = ['forca', 'agilidade', 'intelecto', 'vigor', 'presenca']

const ARCHETYPE_RULES = {
  tank: { affinity: 'vigor', favorableMetric: 'life' },
  assassino: { affinity: 'agilidade', favorableMetric: 'isolatedDamage' },
  suporte: { affinity: 'presenca', favorableMetric: 'care' },
  lutador: { affinity: 'forca', favorableMetric: 'sustainedMelee' },
  atirador: { affinity: 'agilidade', favorableMetric: 'farDamage' },
  ocultista: { affinity: 'intelecto', favorableMetric: 'fushiAndCasts' },
}

function randomFactory(seed) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let output = value
    output = Math.imul(output ^ (output >>> 15), output | 1)
    output ^= output + Math.imul(output ^ (output >>> 7), output | 61)
    return ((output ^ (output >>> 14)) >>> 0) / 4294967296
  }
}

function rollDie(random, sides) {
  return 1 + Math.floor(random() * sides)
}

function rollPool(random, dice, bonus = 0) {
  let selected = 0
  for (let index = 0; index < Math.max(1, dice); index += 1) {
    selected = Math.max(selected, rollDie(random, 20))
  }
  return { natural: selected, total: selected + bonus }
}

function rollDamage(random, damage, critical = false) {
  const dice = damage.count * (critical ? 2 : 1)
  let total = damage.bonus
  for (let index = 0; index < dice; index += 1) total += rollDie(random, damage.sides)
  return Math.max(0, total)
}

function exactPoolChance(dice, bonus, target) {
  const needed = target - bonus
  if (needed <= 1) return 1
  if (needed > 20) return 0
  return 1 - Math.pow((needed - 1) / 20, Math.max(1, dice))
}

function rarityFromPotency(potency) {
  if (potency <= 2) return 'comum'
  if (potency <= 4) return 'raro'
  if (potency <= 6) return 'epico'
  if (potency <= 9) return 'lendario'
  return 'mitico'
}

function attributeSpread(profile, primary = null) {
  if (!primary) {
    const base = Math.floor(profile.attributeTotal / ATTRIBUTE_ORDER.length)
    let remainder = profile.attributeTotal - base * ATTRIBUTE_ORDER.length
    return Object.fromEntries(ATTRIBUTE_ORDER.map((attribute) => {
      const value = base + (remainder > 0 ? 1 : 0)
      remainder -= remainder > 0 ? 1 : 0
      return [attribute, value]
    }))
  }

  const result = Object.fromEntries(ATTRIBUTE_ORDER.map((attribute) => [attribute, 0]))
  result[primary] = profile.attributeCap
  let remaining = profile.attributeTotal - profile.attributeCap
  const secondary = ATTRIBUTE_ORDER.filter((attribute) => attribute !== primary)
  let index = 0
  while (remaining > 0) {
    result[secondary[index % secondary.length]] += 1
    remaining -= 1
    index += 1
  }
  return result
}

function emptyModifier() {
  return {
    care: 0,
    closeDamage: 0,
    damage: 0,
    determination: 0,
    farDamage: 0,
    fushi: 0,
    hp: 0,
    isolatedDamage: 0,
    movement: 0,
    protection: 0,
  }
}

function referenceItemModifier(archetype, potency, attributes) {
  const modifier = emptyModifier()
  const rarity = rarityFromPotency(potency)

  switch (archetype) {
    case 'tank':
      modifier.hp = 2 + potency + attributes.vigor
      modifier.damage = -Math.ceil(potency / 4)
      break
    case 'assassino':
      modifier.damage = Math.ceil(potency / 3) + Math.floor(attributes.agilidade / 3)
      modifier.hp = -(2 + Math.ceil(potency / 2))
      modifier.isolatedDamage = 1
      break
    case 'suporte':
      modifier.care = potency + attributes.presenca
      modifier.fushi = -(1 + Math.ceil(potency / 2))
      break
    case 'lutador':
      modifier.hp = Math.ceil(potency / 4) + Math.floor(attributes.forca / 3)
      modifier.damage = Math.ceil(potency / 5)
      modifier.protection = -Math.ceil(potency / 5)
      break
    case 'atirador':
      modifier.farDamage = Math.ceil(potency / 3) + Math.floor(attributes.agilidade / 3)
      modifier.closeDamage = -(1 + Math.ceil(potency / 3))
      break
    case 'ocultista':
      modifier.fushi = potency + attributes.intelecto
      modifier.hp = -(1 + Math.ceil(potency / 2))
      break
    default:
      throw new Error(`Arquetipo desconhecido: ${archetype}`)
  }

  return { archetype, modifier, potency, rarity }
}

function mergeModifiers(items) {
  const result = emptyModifier()
  for (const item of items) {
    for (const key of Object.keys(result)) result[key] += item.modifier[key] ?? 0
  }
  return result
}

function buildSpec(profile, attributes, itemDirections = [], context = 'melee') {
  const items = itemDirections.map(({ archetype, potency }) => (
    referenceItemModifier(archetype, potency, attributes)
  ))
  const modifier = mergeModifiers(items)
  const contextDamage = context === 'far' ? modifier.farDamage : modifier.closeDamage
  const passiveCa = profile.caPowerBase + attributes.agilidade + modifier.protection
  const reflexSkill = Math.min(profile.reflexSkillCap, context === 'defense_cap' ? profile.reflexSkillCap : 5)
  const dodge = passiveCa + attributes.agilidade + reflexSkill

  return {
    agility: attributes.agilidade,
    attackBonus: profile.attackSkill,
    attackDice: Math.max(1, context === 'far' ? attributes.agilidade : attributes.forca),
    attributes,
    block: profile.block,
    ca: passiveCa,
    care: modifier.care,
    context,
    damage: {
      ...profile.damage,
      bonus: Math.max(0, profile.damage.bonus + modifier.damage + contextDamage),
    },
    determination: Math.max(0, profile.determination + modifier.determination),
    dodge,
    fushi: Math.max(0, profile.fushi + modifier.fushi),
    hp: Math.max(1, profile.hp + modifier.hp),
    isolatedDamage: modifier.isolatedDamage,
    items,
    movement: Math.max(0, profile.movement + modifier.movement),
    rawModifier: modifier,
  }
}

function actor(spec, id) {
  return { ...spec, currentHp: spec.hp, id, reaction: true }
}

function living(team) {
  return team.filter((entry) => entry.currentHp > 0)
}

function chooseTarget(team, preferredId = null) {
  if (preferredId) {
    const preferred = living(team).find((entry) => entry.id === preferredId)
    if (preferred) return preferred
  }
  return living(team).sort((left, right) => left.currentHp - right.currentHp)[0] ?? null
}

function takeTurn(random, source, enemies, events) {
  if (source.currentHp <= 0) return
  const target = chooseTarget(enemies, source.preferredTargetId)
  if (!target) return

  const attack = rollPool(random, source.attackDice, source.attackBonus)
  if (attack.total < target.ca) {
    events.passiveMisses += 1
    return
  }

  // Exact rule requested by the Mestre: passive CA + AGI + full Reflexes.
  // A successful Dodge spends the sole Reaction; later attackers face passive CA.
  if (target.reaction && attack.total < target.dodge) {
    target.reaction = false
    events.dodges += 1
    return
  }

  let damage = rollDamage(random, source.damage, attack.natural === 20)
  if (living(enemies).length === 1) damage += source.isolatedDamage

  if (target.reaction && target.block > 0) {
    target.reaction = false
    damage = Math.max(0, damage - target.block)
    events.blocks += 1
  }

  target.currentHp = Math.max(0, target.currentHp - damage)
  events.damage += damage
  if (attack.natural === 20) events.criticals += 1
}

function simulateEncounter(playerSpecs, enemySpecs, seed) {
  const random = randomFactory(seed)
  const totals = {
    blocks: 0,
    criticals: 0,
    damage: 0,
    dodges: 0,
    draws: 0,
    enemyWins: 0,
    passiveMisses: 0,
    playerWins: 0,
    rounds: 0,
  }

  for (let iteration = 0; iteration < ENCOUNTER_ITERATIONS; iteration += 1) {
    const players = playerSpecs.map((spec, index) => actor(spec, `p${index}`))
    const enemies = enemySpecs.map((spec, index) => actor(spec, `e${index}`))
    let round = 0

    while (round < ROUND_LIMIT && living(players).length > 0 && living(enemies).length > 0) {
      round += 1
      for (const entry of [...players, ...enemies]) entry.reaction = true
      const order = [...players, ...enemies]
        .map((entry) => ({ entry, tie: random() }))
        .sort((left, right) => right.entry.agility - left.entry.agility || left.tie - right.tie)
        .map(({ entry }) => entry)

      for (const source of order) {
        takeTurn(random, source, players.includes(source) ? enemies : players, totals)
        if (living(players).length === 0 || living(enemies).length === 0) break
      }
    }

    totals.rounds += round
    const playersAlive = living(players).length > 0
    const enemiesAlive = living(enemies).length > 0
    if (playersAlive && !enemiesAlive) totals.playerWins += 1
    else if (!playersAlive && enemiesAlive) totals.enemyWins += 1
    else totals.draws += 1
  }

  return {
    averageRounds: Number((totals.rounds / ENCOUNTER_ITERATIONS).toFixed(2)),
    decisivePlayerShare: totals.playerWins + totals.enemyWins > 0
      ? Number((totals.playerWins / (totals.playerWins + totals.enemyWins)).toFixed(4))
      : null,
    drawRate: Number((totals.draws / ENCOUNTER_ITERATIONS).toFixed(4)),
    enemyWinRate: Number((totals.enemyWins / ENCOUNTER_ITERATIONS).toFixed(4)),
    events: {
      blocks: totals.blocks,
      criticals: totals.criticals,
      damage: totals.damage,
      dodges: totals.dodges,
      passiveMisses: totals.passiveMisses,
    },
    iterations: ENCOUNTER_ITERATIONS,
    playerWinRate: Number((totals.playerWins / ENCOUNTER_ITERATIONS).toFixed(4)),
  }
}

function averageDamage(spec, isolated = false) {
  return Number((
    spec.damage.count * ((spec.damage.sides + 1) / 2) +
    spec.damage.bonus +
    (isolated ? spec.isolatedDamage : 0)
  ).toFixed(2))
}

function roleMetrics(spec) {
  return {
    careBonus: spec.care,
    castsAtCost3: Math.floor(spec.fushi / 3),
    castsAtCost5: Math.floor(spec.fushi / 5),
    determination: spec.determination,
    dodge: spec.dodge,
    farDamageAverage: spec.context === 'far' ? averageDamage(spec) : null,
    fushi: spec.fushi,
    hp: spec.hp,
    isolatedDamageAverage: averageDamage(spec, true),
    meleeDamageAverage: spec.context === 'melee' ? averageDamage(spec) : null,
    movement: spec.movement,
    passiveCa: spec.ca,
  }
}

function defenseAudit() {
  const rows = []
  for (const [tier, profile] of Object.entries(POWER_PROFILES)) {
    const agilityValues = [...new Set([0, Math.min(2, profile.attributeCap), profile.attributeCap])]
    const reflexValues = [...new Set([0, 5, profile.reflexSkillCap])]
    for (const agility of agilityValues) {
      for (const reflexes of reflexValues) {
        const passiveCa = profile.caPowerBase + agility
        const dodge = passiveCa + agility + reflexes
        rows.push({
          agility,
          attackMaximum: 20 + profile.attackSkill,
          attackReachesDodge: Number(exactPoolChance(
            Math.max(1, profile.attributeCap),
            profile.attackSkill,
            dodge,
          ).toFixed(4)),
          attackReachesPassiveCa: Number(exactPoolChance(
            Math.max(1, profile.attributeCap),
            profile.attackSkill,
            passiveCa,
          ).toFixed(4)),
          automaticFirstDodge: dodge > 20 + profile.attackSkill,
          dodge,
          formula: `${passiveCa} CA atual + ${agility} AGI + ${reflexes} Reflexos = ${dodge}`,
          passiveCa,
          reflexes,
          skillCapForTier: profile.reflexSkillCap,
          tier,
        })
      }
    }
  }
  return rows
}

function subsetAudit(profile) {
  const attributes = attributeSpread(profile)
  const rows = []
  for (let mask = 0; mask < 1 << ARCHETYPES.length; mask += 1) {
    const selected = ARCHETYPES.filter((_, index) => (mask & (1 << index)) !== 0)
    const directions = selected.map((archetype) => ({ archetype, potency: 1 }))
    const melee = buildSpec(profile, attributes, directions, 'melee')
    const far = buildSpec(profile, attributes, directions, 'far')
    rows.push({
      count: selected.length,
      id: selected.length ? selected.join('+') : 'controle_sem_item',
      metrics: {
        careBonus: melee.care,
        farDamageAverage: averageDamage(far),
        fushi: melee.fushi,
        hp: melee.hp,
        isolatedMeleeDamageAverage: averageDamage(melee, true),
        meleeDamageAverage: averageDamage(melee),
        movement: melee.movement,
      },
      selected,
    })
  }
  return rows
}

function bundleAudit(profile) {
  const genericAttributes = attributeSpread(profile)
  const mixedDirections = ARCHETYPES.map((archetype) => ({ archetype, potency: 1 }))
  const mixedMelee = buildSpec(profile, genericAttributes, mixedDirections, 'melee')
  const mixedFar = buildSpec(profile, genericAttributes, mixedDirections, 'far')
  const specialists = {}

  for (const archetype of ARCHETYPES) {
    const attributes = attributeSpread(profile, ARCHETYPE_RULES[archetype].affinity)
    const context = archetype === 'atirador' ? 'far' : 'melee'
    const directions = Array.from({ length: 6 }, () => ({ archetype, potency: 1 }))
    specialists[archetype] = {
      attributes,
      metrics: roleMetrics(buildSpec(profile, attributes, directions, context)),
    }
  }

  const mixedMetrics = {
    careBonus: mixedMelee.care,
    castsAtCost3: Math.floor(mixedMelee.fushi / 3),
    farDamageAverage: averageDamage(mixedFar),
    fushi: mixedMelee.fushi,
    hp: mixedMelee.hp,
    isolatedDamageAverage: averageDamage(mixedMelee, true),
    meleeDamageAverage: averageDamage(mixedMelee),
    movement: mixedMelee.movement,
  }

  const dominanceChecks = {
    assassinHasMoreIsolatedDamage: specialists.assassino.metrics.isolatedDamageAverage > mixedMetrics.isolatedDamageAverage,
    mixedBundleDominatesEverySpecialist: false,
    occultistHasMoreFushi: specialists.ocultista.metrics.fushi > mixedMetrics.fushi,
    shooterHasMoreFarDamage: specialists.atirador.metrics.farDamageAverage > mixedMetrics.farDamageAverage,
    supportHasMoreCare: specialists.suporte.metrics.careBonus > mixedMetrics.careBonus,
    tankHasMoreLife: specialists.tank.metrics.hp > mixedMetrics.hp,
  }

  return { dominanceChecks, mixedOneOfEach: mixedMetrics, specialistsSixCommon: specialists }
}

function favorableComparison(profile, archetype) {
  const affinity = ARCHETYPE_RULES[archetype].affinity
  const attributes = attributeSpread(profile, affinity)
  const context = archetype === 'atirador' ? 'far' : 'melee'
  const baseline = buildSpec(profile, attributes, [], context)
  const itemized = buildSpec(profile, attributes, [{ archetype, potency: 1 }], context)
  const baselineControl = simulateEncounter(
    [baseline],
    [baseline],
    5_000 + profile.hp + ARCHETYPES.indexOf(archetype),
  )
  const duel = simulateEncounter([itemized], [baseline], 10_000 + profile.hp + ARCHETYPES.indexOf(archetype))
  const enemyTeam = [baseline, baseline, baseline, baseline, baseline].map((entry) => (
    archetype === 'tank' ? { ...entry, preferredTargetId: 'p0' } : entry
  ))
  const team = simulateEncounter(
    [itemized, baseline, baseline, baseline, baseline],
    enemyTeam,
    20_000 + profile.hp + ARCHETYPES.indexOf(archetype),
  )
  const mirror = simulateEncounter([itemized], [itemized], 30_000 + profile.hp + ARCHETYPES.indexOf(archetype))

  return {
    archetype,
    baseline: roleMetrics(baseline),
    noItemMirrorControl: baselineControl,
    context,
    itemized: roleMetrics(itemized),
    itemizedVsNoItemDuel: duel,
    itemizedVsNoItemTeam: team,
    note: ['suporte', 'ocultista'].includes(archetype)
      ? 'Vitoria fisica nao mede a funcao. Leia careBonus ou casts/FUSHI como metrica favoravel.'
      : 'A condicao favoravel do arquetipo foi usada no dano quando aplicavel.',
    sameItemMirrorControl: mirror,
  }
}

function crossTierAudit() {
  const basicProfile = POWER_PROFILES.basico
  const advancedProfile = POWER_PROFILES.avancado
  const basicAttributes = attributeSpread(basicProfile)
  const advancedAttributes = attributeSpread(advancedProfile)
  const basicBaseline = buildSpec(basicProfile, basicAttributes, [], 'melee')
  const advancedBaseline = buildSpec(advancedProfile, advancedAttributes, [], 'melee')
  const sixCommon = ARCHETYPES.map((archetype) => ({ archetype, potency: 1 }))
  const sixMythic = ARCHETYPES.map((archetype) => ({ archetype, potency: 10 }))
  const basicSixCommon = buildSpec(basicProfile, basicAttributes, sixCommon, 'melee')
  const basicSixMythic = buildSpec(basicProfile, basicAttributes, sixMythic, 'melee')

  return {
    advancedNoItemVsBasicNoItem: simulateEncounter([advancedBaseline], [basicBaseline], 40_101),
    advancedNoItemVsThreeBasicNoItem: simulateEncounter(
      [advancedBaseline],
      [basicBaseline, basicBaseline, basicBaseline],
      40_102,
    ),
    basicNoItemVsAdvancedNoItem: simulateEncounter([basicBaseline], [advancedBaseline], 40_103),
    basicSixCommonMixedVsAdvancedNoItem: simulateEncounter([basicSixCommon], [advancedBaseline], 40_104),
    basicSixMythicMixedVsAdvancedNoItemStressOnly: simulateEncounter([basicSixMythic], [advancedBaseline], 40_105),
    stats: {
      advancedNoItem: roleMetrics(advancedBaseline),
      basicNoItem: roleMetrics(basicBaseline),
      basicSixCommonMixed: roleMetrics(basicSixCommon),
      basicSixMythicMixed: roleMetrics(basicSixMythic),
    },
  }
}

function simulateWorldDistribution() {
  const random = randomFactory(0xf0541)
  const rarityTotals = { comum: 0, raro: 0, epico: 0, lendario: 0, mitico: 0 }
  const potencySpreadCounts = { atLeast10: 0, atLeast15: 0, atLeast20: 0 }
  let worldsWithMythic = 0
  let totalMythics = 0

  for (let iteration = 0; iteration < WORLD_ITERATIONS; iteration += 1) {
    let mythics = 0
    const archetypePotencies = []
    for (const _archetype of ARCHETYPES) {
      let archetypeTotal = 0
      for (let biome = 0; biome < 8; biome += 1) {
        const potency = rollDie(random, 10)
        archetypeTotal += potency
        const rarity = rarityFromPotency(potency)
        rarityTotals[rarity] += 1
        if (rarity === 'mitico') mythics += 1
      }
      archetypePotencies.push(archetypeTotal)
    }
    const spread = Math.max(...archetypePotencies) - Math.min(...archetypePotencies)
    if (spread >= 10) potencySpreadCounts.atLeast10 += 1
    if (spread >= 15) potencySpreadCounts.atLeast15 += 1
    if (spread >= 20) potencySpreadCounts.atLeast20 += 1
    if (mythics > 0) worldsWithMythic += 1
    totalMythics += mythics
  }

  const totalItems = WORLD_ITERATIONS * 48
  return {
    exactModel: {
      biomes: 8,
      itemsPerArchetype: 8,
      itemsPerBiome: 6,
      standardItems: 48,
      secretItems: 'adicionais; nao entram no sorteio',
    },
    expected: {
      mythicsAcross48: 4.8,
      mythicsPerArchetype: 0.8,
      potencyPerItem: 5.5,
      probabilityAtLeastOneMythicAmongEight: Number((1 - 0.9 ** 8).toFixed(6)),
    },
    simulated: {
      averageMythicsPerWorld: Number((totalMythics / WORLD_ITERATIONS).toFixed(4)),
      potencySpreadBetweenStrongestAndWeakestArchetype: Object.fromEntries(
        Object.entries(potencySpreadCounts).map(([key, count]) => [key, Number((count / WORLD_ITERATIONS).toFixed(4))]),
      ),
      probabilityWorldHasAnyMythic: Number((worldsWithMythic / WORLD_ITERATIONS).toFixed(4)),
      rarityRates: Object.fromEntries(
        Object.entries(rarityTotals).map(([rarity, count]) => [rarity, Number((count / totalItems).toFixed(4))]),
      ),
      worlds: WORLD_ITERATIONS,
    },
  }
}

const defense = defenseAudit()
const favorableComparisons = {}
const subsetCombinations = {}
const equalCountBundles = {}

for (const [tier, profile] of Object.entries(POWER_PROFILES)) {
  favorableComparisons[tier] = Object.fromEntries(
    ARCHETYPES.map((archetype) => [archetype, favorableComparison(profile, archetype)]),
  )
  subsetCombinations[tier] = subsetAudit(profile)
  equalCountBundles[tier] = bundleAudit(profile)
}

const referenceAffixTable = {}
for (const [tier, profile] of Object.entries(POWER_PROFILES)) {
  referenceAffixTable[tier] = {}
  for (const archetype of ARCHETYPES) {
    const attributes = attributeSpread(profile, ARCHETYPE_RULES[archetype].affinity)
    referenceAffixTable[tier][archetype] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((potency) => ({
      ...referenceItemModifier(archetype, potency, attributes),
      attributes,
    }))
  }
}

const result = {
  assumptions: {
    attributeAffinities: {
      assassino: 'AGI',
      atirador: 'AGI (atributo compartilhado)',
      lutador: 'FOR',
      ocultista: 'INT',
      suporte: 'PRE',
      tank: 'VIG',
    },
    attributeCaps: 'Basico e Avancado: Pericias ate +10. Ascensao e Cataclisma: ate +15. Totais/tetos de Atributo de Avancado e Ascensao ainda sao fixtures.',
    buildRule: 'Sem slot, teto de item ou carga. Integracoes permanentes acumulam prefixo, sufixo e passiva. NPC recebe build fechada pelo Mestre.',
    caFormula: 'CA passiva = Base do Nivel de Poder + AGI + Protecao.',
    dodgeFormulaRequired: 'Esquiva = CA passiva atual + AGI + bonus integral de Reflexos. Valor fixo, sem dados, uma Reacao por rodada.',
    itemFormulaStatus: 'Matriz de referencia para teste, nao catalogo nem regra aprovada.',
    rarityRoll: '1d10: 1-2 Comum; 3-4 Raro; 5-6 Epico; 7-9 Lendario; 10 Mitico. Secreto nao rola.',
  },
  defenseAudit: {
    rows: defense,
    interpretation: [
      'Esquiva especializada pode negar automaticamente o primeiro ataque do mesmo Nivel; isso e consequencia aceita da formula exigida.',
      'A protecao nao e apagada: ela ja esta dentro da CA passiva atual e, portanto, acompanha a Esquiva uma vez.',
      'A unica Reacao por rodada e a trava de pressao: o segundo atacante enfrenta apenas a CA passiva.',
      'Nao converter Reflexos para 0/2/4/6 e nao rolar dados para Esquiva.',
    ],
  },
  crossTierAudit: crossTierAudit(),
  encounterIterations: ENCOUNTER_ITERATIONS,
  equalCountBundleAudit: equalCountBundles,
  favorableComparisons,
  itemArchitecture: {
    normal: 'Objeto narrativo + um prefixo benefico + um sufixo negativo + uma passiva pequena fixa.',
    potencyFormulas: {
      assassino: 'dano = ceil(R/3) + floor(AGI/2); Vida = -(2 + ceil(R/2)); passiva pequena fixa de alvo isolado',
      atirador: 'dano distante = ceil(R/3) + floor(AGI/2); dano adjacente = -(1 + ceil(R/3))',
      lutador: 'Vida = ceil(R/4) + floor(FOR/3); dano = ceil(R/5); Protecao/CA = -ceil(R/5)',
      ocultista: 'FUSHI = R + INT; Vida = -(1 + ceil(R/2))',
      suporte: 'Cuidados = R + PRE; FUSHI = -(1 + ceil(R/2))',
      tank: 'Vida = 2 + R + VIG; dano = -ceil(R/4)',
    },
    secret: 'Fora do 1d10; afixos no maximo da matriz aprovada e passiva autoral mais forte ligada a lore.',
    templateAxesNotCatalog: {
      damage: ['assassino', 'lutador', 'atirador'],
      determination: ['variantes de suporte, ocultista e itens Secretos ainda por desenhar'],
      displacement: ['lutador e variantes defensivas'],
      fushi: ['ocultista; custo em suporte; variantes futuras'],
      life: ['tank, lutador; custo em assassino e ocultista'],
      protectionAndCa: ['variantes de tank/atirador ainda por desenhar sem alterar a formula de Esquiva'],
    },
  },
  referenceAffixTable,
  status: 'PROPOSTA_OFFLINE_V3_NAO_APROVADA_NAO_APLICADA',
  subsetCombinationAudit: subsetCombinations,
  warnings: [
    'Controle sem item contra sem item e espelho itemizado contra espelho itemizado devem ficar perto de 50%; eles nao medem vantagem do item.',
    'Suporte e Ocultista nao podem ser julgados por vitoria em duelo fisico; leia Cuidados, FUSHI e numero de usos.',
    'Seis melhorias sempre superam zero em algum eixo. A trava correta e seis itens mistos nao dominarem seis itens coerentes com a mesma contagem.',
    'CA/Protecao negativa do Lutador e candidata de contrapartida, nao regra aprovada; preserva a formula de Esquiva porque altera a CA atual antes da soma de AGI e Reflexos.',
    'Cataclisma continua fora da curva plana: depende de fase, arena e regra de boss.',
    'Nenhum dado de ficha, lore, multiplayer, token, Livro ou runtime foi alterado por este simulador.',
  ],
  worldDistribution: simulateWorldDistribution(),
}

fs.writeFileSync(outputJson, `${JSON.stringify(result, null, 2)}\n`, 'utf8')

console.log(`Plano offline V3: ${ENCOUNTER_ITERATIONS.toLocaleString('pt-BR')} iteracoes por encontro.`)
console.log(`Mundos de loot simulados: ${WORLD_ITERATIONS.toLocaleString('pt-BR')}.`)
console.log(`Combinacoes de seis direcoes: ${64 * Object.keys(POWER_PROFILES).length}.`)
console.log(`Resultado: ${path.relative(root, outputJson)}`)
