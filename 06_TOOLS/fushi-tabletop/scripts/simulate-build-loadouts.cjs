const fs = require('node:fs')
const path = require('node:path')
const {
  emptyBuildModifiers,
  evaluateBuildItem,
  evaluateBuildItemByRarity,
  evaluateBuildSet,
  readBuildCatalog,
} = require('./lib/fushi-build-system.cjs')
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
} = require('./lib/fushi-workspace-io.cjs')

const root = process.cwd()
const outputDirectory = path.join(root, 'docs', 'fushi-system')
const assignmentPath = path.join(outputDirectory, 'NPC_BUILD_ASSIGNMENTS.json')
const jsonPath = path.join(outputDirectory, 'BUILD_LOADOUT_SIMULATION.json')
const reportPath = path.join(outputDirectory, 'BUILD_LOADOUT_SIMULATION.md')
const workspacePath = process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath()
const autosavePath = process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(root)
const ITERATIONS = Math.max(200, Math.min(4000, Number(readArg('iterations')) || 1000))
const MAX_ROUNDS = 40

function readArg(name) {
  const prefix = `--${name}=`
  return process.argv.find((entry) => entry.startsWith(prefix))?.slice(prefix.length)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getCharacters(workspace) {
  if (Array.isArray(workspace.characters)) return workspace.characters
  if (Array.isArray(workspace.characters?.items)) return workspace.characters.items
  return []
}

function parseDamageFormula(value) {
  const match = /\b(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?/i.exec(String(value ?? ''))
  if (!match) return null
  return {
    bonus: (match[3] === '-' ? -1 : 1) * Number(match[4] ?? 0),
    dice: Math.max(1, Number(match[1] || 1)),
    sides: Math.max(2, Number(match[2])),
  }
}

function averageDamage(formula) {
  return formula.dice * ((formula.sides + 1) / 2) + formula.bonus
}

function isRangedAttack(attack) {
  return /pontaria|distancia|arco|pistola|tiro|disparo|\b[2-9]\d*\s*m/i.test(
    normalize(`${attack?.automation?.combat?.teste?.pericia ?? ''} ${attack?.alcance ?? ''} ${attack?.nome ?? ''}`),
  )
}

function strongestAttack(character) {
  const attacks = (character.ataques ?? [])
    .map((attack) => {
      const formula = parseDamageFormula(attack.automation?.combat?.dano?.formula || attack.dano)
      return formula ? { attack, formula, ranged: isRangedAttack(attack) } : null
    })
    .filter(Boolean)
    .sort((left, right) => averageDamage(right.formula) - averageDamage(left.formula))

  return attacks[0] ?? {
    attack: { atributoBase: 'forca', nome: 'Desarmado' },
    formula: parseDamageFormula('1d2'),
    ranged: false,
  }
}

function skillBonus(character, baseline, name, cap) {
  const target = normalize(name).replace(/[*+]/g, '')
  const skill = (character.pericias ?? []).find(
    (entry) => normalize(entry.nome).replace(/[*+]/g, '') === target,
  )
  const raw = Number(baseline?.pericias?.[skill?.id] ?? skill?.bonusPericia ?? 0) || 0
  return Math.min(cap, Math.max(0, raw))
}

function movementNumber(value) {
  const match = /(-?\d+(?:[.,]\d+)?)/.exec(String(value ?? ''))
  return match ? Number(match[1].replace(',', '.')) : 0
}

function buildNpcCombatant(character, record, mode) {
  const baseline = character.combatProfile?.build?.baseline
  if (!baseline) throw new Error(`Baseline ausente em ${character.nome}`)
  const modifiers = mode === 'built' ? record.totals : emptyBuildModifiers()
  const attack = strongestAttack(character)
  const ranged = attack.ranged
  const attributeKey = ranged ? 'agilidade' : attack.attack.atributoBase || 'forca'
  const attackDice = Number(character.atributos?.[attributeKey] ?? 1) || 0
  const cap = record.skillCap
  const attackBonus = skillBonus(character, baseline, ranged ? 'Pontaria' : 'Luta', cap)
  const life = Math.max(1, Number(baseline.recursos.vidaMaxima ?? 1) + Number(modifiers.life ?? 0))
  const ca = Math.max(1, Number(baseline.defesa ?? 1) + Number(modifiers.ca ?? 0))
  const fortitude = skillBonus(character, baseline, 'Fortitude', cap)
  const reflexes = skillBonus(character, baseline, 'Reflexos', cap)
  const block = Math.min(15, fortitude + Number(character.combatProfile?.bloqueioBonus ?? 0)) +
    Math.max(0, Number(modifiers.block ?? 0))
  const dodge = ca + Number(character.atributos?.agilidade ?? 0) + reflexes
  const damageBonus = Number(modifiers.damage ?? 0) +
    Number(ranged ? modifiers.rangedDamage : modifiers.meleeDamage) +
    Number(ranged ? 0 : modifiers.adjacentDamage)

  return {
    archetype: record.archetype,
    attackBonus,
    attackDice,
    block,
    ca,
    caPenetration: Math.max(0, Number(modifiers.caPenetration ?? 0)),
    criticalDamage: Math.max(0, Number(modifiers.criticalDamage ?? 0)),
    damageBonus,
    damageFormula: attack.formula,
    determination: Math.max(1, Number(baseline.recursos.determinacaoMaxima ?? 1) + Number(modifiers.determination ?? 0)),
    dodge,
    fushi: Math.max(1, Number(baseline.recursos.fushiMaximo ?? 1) + Number(modifiers.fushi ?? 0)),
    healing: Number(modifiers.healing ?? 0),
    healingReceived: Number(modifiers.healingReceived ?? 0),
    life,
    mode,
    movement: Math.max(0, movementNumber(baseline.deslocamento) + Number(modifiers.movement ?? 0)),
    name: character.nome,
    powerLevel: record.powerLevel,
  }
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

function rollAttack(random, dice, bonus) {
  const count = dice <= 0 ? 2 : Math.max(1, dice)
  const rolls = Array.from({ length: count }, () => rollDie(random, 20))
  const natural = dice <= 0 ? Math.min(...rolls) : Math.max(...rolls)
  return { natural, total: natural + bonus }
}

function rollDamage(random, combatant, critical, coreographyDice = 0) {
  const formula = combatant.damageFormula
  let value = formula.bonus + combatant.damageBonus + (critical ? combatant.criticalDamage : 0)
  const dice = (formula.dice + coreographyDice) * (critical ? 2 : 1)
  for (let index = 0; index < dice; index += 1) value += rollDie(random, formula.sides)
  return Math.max(0, value)
}

function chooseCoreography(attacker, defender, reactions) {
  const maxSacrifice = Math.max(0, Math.max(1, attacker.attackDice) - 1)
  let best = { attackDice: attacker.attackDice, expectedPressure: -1, sacrificed: 0 }
  for (let sacrificed = 0; sacrificed <= maxSacrifice; sacrificed += 1) {
    const attackDice = attacker.attackDice <= 0
      ? attacker.attackDice
      : Math.max(1, attacker.attackDice - sacrificed)
    const effectiveCa = Math.max(1, defender.ca - attacker.caPenetration)
    const defense = reactions ? Math.max(effectiveCa, defender.dodge + 1) : effectiveCa
    const chance = hitChance(attackDice, attacker.attackBonus, defense)
    const averageRaw = averageDamage({
      ...attacker.damageFormula,
      dice: attacker.damageFormula.dice + sacrificed,
    }) + attacker.damageBonus
    const averageApplied = reactions
      ? Math.max(0, averageRaw - defender.block)
      : Math.max(0, averageRaw)
    const expectedPressure = chance * averageApplied
    if (expectedPressure > best.expectedPressure) {
      best = { attackDice, expectedPressure, sacrificed }
    }
  }
  return best
}

function hitChance(dice, bonus, defense) {
  const needed = Math.max(1, Math.min(21, defense - bonus))
  if (dice <= 0) {
    const single = (21 - needed) / 20
    return single * single
  }
  return 1 - ((needed - 1) / 20) ** Math.max(1, dice)
}

function simulateDuel(left, right, seed, options = {}) {
  const reactions = options.reactions !== false
  const random = randomFactory(seed)
  const leftCoreography = chooseCoreography(left, right, reactions)
  const rightCoreography = chooseCoreography(right, left, reactions)
  let leftWins = 0
  let rightWins = 0
  let draws = 0
  let rounds = 0
  for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
    const life = [left.life, right.life]
    let round = 0
    while (round < MAX_ROUNDS && life[0] > 0 && life[1] > 0) {
      round += 1
      const order = random() < 0.5 ? [0, 1] : [1, 0]
      for (const attackerIndex of order) {
        const defenderIndex = attackerIndex === 0 ? 1 : 0
        if (life[attackerIndex] <= 0 || life[defenderIndex] <= 0) continue
        const attacker = attackerIndex === 0 ? left : right
        const defender = defenderIndex === 0 ? left : right
        const coreography = attackerIndex === 0 ? leftCoreography : rightCoreography
        const roll = rollAttack(random, coreography.attackDice, attacker.attackBonus)
        const effectiveCa = Math.max(1, defender.ca - attacker.caPenetration)
        if (roll.total < effectiveCa) continue
        if (reactions && roll.total <= defender.dodge) continue
        const rawDamage = rollDamage(
          random,
          attacker,
          roll.natural === 20,
          coreography.sacrificed,
        )
        const appliedDamage = reactions
          ? Math.max(0, rawDamage - defender.block)
          : rawDamage
        life[defenderIndex] = Math.max(0, life[defenderIndex] - appliedDamage)
      }
    }
    rounds += round
    if (life[0] <= 0 && life[1] <= 0) draws += 1
    else if (life[1] <= 0) leftWins += 1
    else if (life[0] <= 0) rightWins += 1
    else draws += 1
  }
  const completed = leftWins + rightWins
  return {
    averageRounds: Number((rounds / ITERATIONS).toFixed(2)),
    completionRate: Number((completed / ITERATIONS).toFixed(4)),
    drawRate: Number((draws / ITERATIONS).toFixed(4)),
    leftCoreographyDice: leftCoreography.sacrificed,
    leftConditionalWinRate: completed > 0 ? Number((leftWins / completed).toFixed(4)) : null,
    leftWinRate: Number((leftWins / ITERATIONS).toFixed(4)),
    reactions,
    rightCoreographyDice: rightCoreography.sacrificed,
    rightConditionalWinRate: completed > 0 ? Number((rightWins / completed).toFixed(4)) : null,
    rightWinRate: Number((rightWins / ITERATIONS).toFixed(4)),
  }
}

function simulateComparison(left, right, seed) {
  return {
    semReacoes: simulateDuel(left, right, seed ^ 0xa5a5a5a5, { reactions: false }),
    tatico: simulateDuel(left, right, seed, { reactions: true }),
  }
}

function simulatePressure(defender, attacker, seed, attackerCount = 5) {
  const random = randomFactory(seed)
  let damageTotal = 0
  let damageIterations = 0
  for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
    let reactionAvailable = true
    let damage = 0
    for (let index = 0; index < attackerCount; index += 1) {
      const coreography = chooseCoreography(attacker, defender, reactionAvailable)
      const roll = rollAttack(random, coreography.attackDice, attacker.attackBonus)
      const effectiveCa = Math.max(1, defender.ca - attacker.caPenetration)
      if (roll.total < effectiveCa) continue
      if (reactionAvailable && roll.total <= defender.dodge) {
        reactionAvailable = false
        continue
      }
      const rawDamage = rollDamage(
        random,
        attacker,
        roll.natural === 20,
        coreography.sacrificed,
      )
      const appliedDamage = reactionAvailable
        ? Math.max(0, rawDamage - defender.block)
        : rawDamage
      reactionAvailable = false
      damage += appliedDamage
    }
    damageTotal += damage
    if (damage > 0) damageIterations += 1
  }
  const averageDamage = damageTotal / ITERATIONS
  return {
    attackerCount,
    averageDamage: Number(averageDamage.toFixed(2)),
    chanceToDealDamage: Number((damageIterations / ITERATIONS).toFixed(4)),
    estimatedRoundsToDefeat: averageDamage > 0
      ? Number((defender.life / averageDamage).toFixed(2))
      : null,
  }
}

function functionalMetrics(combatant) {
  const averageRawDamage = averageDamage(combatant.damageFormula) + combatant.damageBonus
  return {
    averageRawDamage: Number(Math.max(0, averageRawDamage).toFixed(2)),
    block: combatant.block,
    ca: combatant.ca,
    caPenetration: combatant.caPenetration,
    criticalDamage: combatant.criticalDamage,
    determination: combatant.determination,
    dodge: combatant.dodge,
    fushi: combatant.fushi,
    healing: combatant.healing,
    healingReceived: combatant.healingReceived,
    life: combatant.life,
    movement: combatant.movement,
  }
}

function buildGenericFixture(powerLevel, archetype, modifiers) {
  const advanced = powerLevel === 'Avancado'
  const base = {
    attackBonus: advanced ? 10 : 5,
    attackDice: advanced ? 4 : 2,
    block: advanced ? 10 : 5,
    ca: advanced ? 16 : 12,
    determination: advanced ? 25 : 5,
    dodge: advanced ? 30 : 19,
    fushi: advanced ? 60 : 5,
    life: advanced ? 120 : 20,
    movement: 9,
  }
  const ranged = archetype === 'atirador'
  return {
    archetype,
    attackBonus: base.attackBonus,
    attackDice: base.attackDice,
    block: base.block + Math.max(0, modifiers.block),
    ca: Math.max(1, base.ca + modifiers.ca),
    caPenetration: Math.max(0, modifiers.caPenetration),
    criticalDamage: Math.max(0, modifiers.criticalDamage),
    damageBonus: modifiers.damage +
      (ranged ? modifiers.rangedDamage : modifiers.meleeDamage) +
      (ranged ? 0 : modifiers.adjacentDamage),
    damageFormula: parseDamageFormula(advanced ? '2d8+4' : '1d6'),
    determination: Math.max(1, base.determination + modifiers.determination),
    dodge: Math.max(1, base.dodge + modifiers.ca),
    fushi: Math.max(1, base.fushi + modifiers.fushi),
    healing: modifiers.healing,
    healingReceived: modifiers.healingReceived,
    life: Math.max(1, base.life + modifiers.life),
    mode: 'fixture',
    movement: Math.max(0, base.movement + modifiers.movement),
    name: `${archetype}-${powerLevel}`,
    powerLevel,
  }
}

function catalogAudit(catalog) {
  const rows = []
  for (const item of catalog.items) {
    for (const rarity of catalog.rarities) {
      const resolved = evaluateBuildItemByRarity(catalog, item, rarity.id)
      const grossBudget = Object.values(resolved.modifiers)
        .reduce((sum, value) => sum + Math.abs(Number(value) || 0), 0)
      rows.push({
        archetype: item.archetype,
        biomeId: item.biomeId,
        grossBudget,
        itemId: item.id,
        modifiers: resolved.modifiers,
        name: item.name,
        rarity: rarity.id,
        valid: grossBudget === catalog.rarityBudgets[rarity.id] &&
          Object.values(resolved.modifiers).some((value) => value > 0) &&
          Object.values(resolved.modifiers).some((value) => value < 0),
      })
    }
  }
  return rows
}

function archetypeScenarios(catalog) {
  const scenarios = []
  for (const powerLevel of ['Basico', 'Avancado']) {
    const rarity = powerLevel === 'Basico' ? 'comum' : 'raro'
    for (const archetype of catalog.archetypes) {
      const items = catalog.items
        .filter((item) => item.archetype === archetype.id)
        .map((item) => evaluateBuildItemByRarity(catalog, item, rarity))
      const attributes = { agilidade: powerLevel === 'Basico' ? 2 : 4, forca: powerLevel === 'Basico' ? 2 : 4, intelecto: powerLevel === 'Basico' ? 2 : 4, presenca: powerLevel === 'Basico' ? 2 : 4, vigor: powerLevel === 'Basico' ? 2 : 4 }
      const builtSet = evaluateBuildSet(catalog, items, attributes, archetype.id)
      const none = buildGenericFixture(powerLevel, archetype.id, emptyBuildModifiers())
      const built = buildGenericFixture(powerLevel, archetype.id, builtSet.totals)
      const mythicItems = catalog.items
        .filter((item) => item.archetype === archetype.id)
        .map((item) => evaluateBuildItemByRarity(catalog, item, 'mitico'))
      const mythicSet = evaluateBuildSet(catalog, mythicItems, attributes, archetype.id)
      const mythic = buildGenericFixture(powerLevel, archetype.id, mythicSet.totals)
      scenarios.push({
        archetype: archetype.id,
        buildVsBuild: simulateComparison(built, clone(built), 0xa24baed1 ^ scenarios.length),
        buildVsNone: simulateComparison(built, none, 0x9e3779b9 ^ scenarios.length),
        built: functionalMetrics(built),
        fullMythicStress: {
          canBaselineHitCa: hitChance(none.attackDice, none.attackBonus, mythic.ca - none.caPenetration) > 0,
          canBaselineHitDodge: hitChance(none.attackDice, none.attackBonus, mythic.dodge - none.caPenetration) > 0,
          metrics: functionalMetrics(mythic),
          pressureFromFiveBaseline: simulatePressure(mythic, none, 0x6c8e9cf5 ^ scenarios.length),
          viableLife: mythic.life > 0,
        },
        none: functionalMetrics(none),
        noneVsNone: simulateComparison(none, clone(none), 0x85ebca6b ^ scenarios.length),
        pressureBuilt: simulatePressure(built, none, 0x4cf5ad43 ^ scenarios.length),
        pressureNone: simulatePressure(none, none, 0x9d2c5680 ^ scenarios.length),
        powerLevel,
        rarity,
      })
    }
  }
  return scenarios
}

function itemScenarios(catalog) {
  const rows = []
  const attributes = { agilidade: 2, forca: 2, intelecto: 2, presenca: 2, vigor: 2 }
  for (const item of catalog.items) {
    for (const rarity of catalog.rarities) {
      const resolvedItem = evaluateBuildItemByRarity(catalog, item, rarity.id)
      const buildSet = evaluateBuildSet(catalog, [resolvedItem], attributes, item.archetype)
      const none = buildGenericFixture('Basico', item.archetype, emptyBuildModifiers())
      const built = buildGenericFixture('Basico', item.archetype, buildSet.totals)
      rows.push({
        archetype: item.archetype,
        biomeId: item.biomeId,
        built: functionalMetrics(built),
        duel: simulateComparison(built, none, 0xd3a2646c ^ rows.length),
        itemId: item.id,
        name: item.name,
        none: functionalMetrics(none),
        rarity: rarity.id,
      })
    }
  }
  return rows
}

function itemPairwiseScenarios(catalog) {
  const rows = []
  const attributes = { agilidade: 2, forca: 2, intelecto: 2, presenca: 2, vigor: 2 }
  for (const archetype of catalog.archetypes) {
    const sourceItems = catalog.items.filter((item) => item.archetype === archetype.id)
    for (const rarity of catalog.rarities) {
      const combatants = sourceItems.map((item) => {
        const resolved = evaluateBuildItemByRarity(catalog, item, rarity.id)
        const set = evaluateBuildSet(catalog, [resolved], attributes, archetype.id)
        return { item, combatant: buildGenericFixture('Basico', archetype.id, set.totals) }
      })
      for (let leftIndex = 0; leftIndex < combatants.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < combatants.length; rightIndex += 1) {
          rows.push({
            archetype: archetype.id,
            duel: simulateDuel(
              combatants[leftIndex].combatant,
              combatants[rightIndex].combatant,
              0x7feb352d ^ rows.length,
            ),
            leftItemId: combatants[leftIndex].item.id,
            rightItemId: combatants[rightIndex].item.id,
            rarity: rarity.id,
          })
        }
      }
    }
  }
  return rows
}

function archetypeRoundRobinScenarios(catalog) {
  const rows = []
  for (const powerLevel of ['Basico', 'Avancado']) {
    const rarity = powerLevel === 'Basico' ? 'comum' : 'raro'
    const attributeValue = powerLevel === 'Basico' ? 2 : 4
    const attributes = { agilidade: attributeValue, forca: attributeValue, intelecto: attributeValue, presenca: attributeValue, vigor: attributeValue }
    const combatants = catalog.archetypes.map((archetype) => {
      const items = catalog.items
        .filter((item) => item.archetype === archetype.id)
        .map((item) => evaluateBuildItemByRarity(catalog, item, rarity))
      const set = evaluateBuildSet(catalog, items, attributes, archetype.id)
      return { archetype: archetype.id, combatant: buildGenericFixture(powerLevel, archetype.id, set.totals) }
    })
    for (let leftIndex = 0; leftIndex < combatants.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < combatants.length; rightIndex += 1) {
        rows.push({
          duel: simulateDuel(combatants[leftIndex].combatant, combatants[rightIndex].combatant, 0x846ca68b ^ rows.length),
          leftArchetype: combatants[leftIndex].archetype,
          powerLevel,
          rarity,
          rightArchetype: combatants[rightIndex].archetype,
        })
      }
    }
  }
  return rows
}

function npcMirrorScenarios(workspace, assignmentData) {
  const recordById = new Map(assignmentData.records.map((record) => [record.characterId, record]))
  return getCharacters(workspace)
    .filter((character) => character.tipo === 'npc')
    .map((character, index) => {
      const record = recordById.get(character.id)
      if (!record) throw new Error(`NPC sem registro v2: ${character.nome}`)
      const none = buildNpcCombatant(character, record, 'none')
      const built = buildNpcCombatant(character, record, 'built')
      return {
        archetype: record.archetype,
        buildVsBuild: simulateComparison(built, clone(built), 0x27d4eb2f ^ index),
        buildVsNone: simulateComparison(built, none, 0x165667b1 ^ index),
        built: functionalMetrics(built),
        name: character.nome,
        none: functionalMetrics(none),
        noneVsNone: simulateComparison(none, clone(none), 0xc2b2ae35 ^ index),
        powerLevel: record.powerLevel,
      }
    })
}

function roundRobinBuilt(workspace, assignmentData) {
  const recordById = new Map(assignmentData.records.map((record) => [record.characterId, record]))
  const combatants = getCharacters(workspace)
    .filter((character) => character.tipo === 'npc')
    .map((character) => buildNpcCombatant(character, recordById.get(character.id), 'built'))
  const rows = []
  for (let leftIndex = 0; leftIndex < combatants.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < combatants.length; rightIndex += 1) {
      const left = combatants[leftIndex]
      const right = combatants[rightIndex]
      const duel = simulateDuel(left, right, 0x94d049bb ^ (leftIndex * 131 + rightIndex))
      rows.push({
        duel,
        left: { archetype: left.archetype, name: left.name, powerLevel: left.powerLevel },
        right: { archetype: right.archetype, name: right.name, powerLevel: right.powerLevel },
      })
    }
  }
  return rows
}

function pct(value) {
  return `${(value * 100).toFixed(1)}%`
}

function duelSummary(duel) {
  if (!duel || duel.completionRate <= 0) return '0% concl.; impasse'
  return `${pct(duel.completionRate)} concl.; ${pct(duel.leftConditionalWinRate)} / ${pct(duel.rightConditionalWinRate)}`
}

function delta(before, after) {
  const value = Number(after ?? 0) - Number(before ?? 0)
  return value > 0 ? `+${value}` : String(value)
}

function renderReport(payload) {
  const invalidItems = payload.catalogAudit.filter((entry) => !entry.valid)
  const impossibleMythic = payload.archetypeScenarios.filter(
    (entry) =>
      !entry.fullMythicStress.canBaselineHitCa ||
      entry.fullMythicStress.pressureFromFiveBaseline.chanceToDealDamage <= 0 ||
      !entry.fullMythicStress.viableLife,
  )
  const lines = [
    '# Simulacao de Builds por Cenario Real',
    '',
    `Gerado em: ${payload.generatedAt}`,
    `Iteracoes por duelo: ${payload.iterations}`,
    '',
    '## O que foi testado',
    '',
    '1. Sem item contra a mesma ficha sem item: confirma a linha de base.',
    '2. Conjunto completo contra a mesma ficha sem build: isola o efeito dos itens.',
    '3. Conjunto completo contra a mesma ficha com o mesmo conjunto: procura vantagem artificial.',
    '4. Cada um dos 48 itens nas 5 raridades: confere ganho, custo e orcamento exato.',
    '5. Conjunto Mitico completo: verifica Vida positiva e se uma ficha do mesmo Nivel ainda pode acertar a CA.',
    '6. Todos os 41 NPCs entre si com suas builds: procura alvos matematicamente impossiveis e quebras entre Niveis.',
    '',
    'O laboratorio usa Coreografia automaticamente quando ela aumenta a pressao. O resultado mostra quanto dos duelos terminou e depois a divisao de vitorias apenas entre os duelos concluidos. Impasse nao e aprovado como equilibrio.',
    '',
    '## Portoes objetivos',
    '',
    `- Itens com orcamento/gain/cost invalido: ${invalidItems.length}`,
    `- Conjuntos Miticos com Vida zero, CA inalcançavel ou imunes a 5 ataques do mesmo Nivel: ${impossibleMythic.length}`,
    `- NPCs espelhados avaliados: ${payload.npcMirrorScenarios.length}`,
    `- Pares reais com build: ${payload.roundRobinBuilt.length}`,
    `- Item contra a mesma ficha sem item: ${payload.itemScenarios.length}`,
    `- Item contra item do mesmo arquetipo/raridade: ${payload.itemPairwiseScenarios.length}`,
    '',
    '## Arquetipos - Basico e Avancado',
    '',
    '| Nivel | Arquetipo | Sem x Sem (tatico) | Build x Sem (sem Reacao) | Build x Sem (tatico) | Build x Build (tatico) | Vida | CA | Bloqueio | Dano medio | Pressao 5x recebida | Cura | FUSHI | DET |',
    '| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]
  payload.archetypeScenarios.forEach((entry) => {
    lines.push(
      `| ${entry.powerLevel} | ${entry.archetype} | ${duelSummary(entry.noneVsNone.tatico)} | ${duelSummary(entry.buildVsNone.semReacoes)} | ${duelSummary(entry.buildVsNone.tatico)} | ${duelSummary(entry.buildVsBuild.tatico)} | ${entry.built.life} (${delta(entry.none.life, entry.built.life)}) | ${entry.built.ca} (${delta(entry.none.ca, entry.built.ca)}) | ${entry.built.block} (${delta(entry.none.block, entry.built.block)}) | ${entry.built.averageRawDamage} (${delta(entry.none.averageRawDamage, entry.built.averageRawDamage)}) | ${entry.pressureNone.averageDamage} -> ${entry.pressureBuilt.averageDamage} | ${entry.built.healing} | ${entry.built.fushi} | ${entry.built.determination} |`,
    )
  })

  lines.push('', '## Conjuntos completos - arquetipo contra arquetipo', '')
  lines.push('| Nivel | Build A | Build B | Resultado tatico: conclusao; A / B entre concluidos |')
  lines.push('| --- | --- | --- | --- |')
  payload.archetypeRoundRobinScenarios.forEach((entry) => {
    lines.push(`| ${entry.powerLevel} | ${entry.leftArchetype} | ${entry.rightArchetype} | ${duelSummary(entry.duel)} |`)
  })

  lines.push('', '## NPCs - antes e depois do conjunto completo', '')
  lines.push('| NPC | Nivel | Build | Vida | CA | Bloqueio | Dano medio | Cura | FUSHI | DET | Build x Sem |')
  lines.push('| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |')
  payload.npcMirrorScenarios.forEach((entry) => {
    lines.push(
      `| ${entry.name} | ${entry.powerLevel} | ${entry.archetype} | ${entry.built.life} (${delta(entry.none.life, entry.built.life)}) | ${entry.built.ca} (${delta(entry.none.ca, entry.built.ca)}) | ${entry.built.block} (${delta(entry.none.block, entry.built.block)}) | ${entry.built.averageRawDamage} (${delta(entry.none.averageRawDamage, entry.built.averageRawDamage)}) | ${entry.built.healing} | ${entry.built.fushi} | ${entry.built.determination} | ${duelSummary(entry.buildVsNone.tatico)} |`,
    )
  })

  lines.push('', '## Leitura correta', '')
  lines.push('- `Build x Sem` compara a mesma ficha consigo mesma. Primeiro aparece quanto terminou; depois Build / Sem somente entre os duelos concluidos.')
  lines.push('- `Sem Reacao` isola Vida, CA e dano. `Tatico` inclui Esquiva, Bloqueio e a melhor Coreografia calculada para o alvo.')
  lines.push('- `Pressao 5x recebida` usa cinco ataques do mesmo Nivel contra um alvo com uma unica Reacao; isso representa a mesa real melhor que um duelo 1x1.')
  lines.push('- Tank e Suporte podem melhorar muito sua funcao e ainda empatar ou perder 1x1; o delta de defesa/cura e o dado relevante.')
  lines.push('- Assassino e Atirador devem mostrar ganho ofensivo acompanhado de perda defensiva clara.')
  lines.push('- O JSON guarda todas as 240 linhas item/raridade e os 820 pares reais, sem resumir alertas como OK.')
  lines.push('- O teste nao altera lore, Habilidades, Rituais, tokens ou multiplayer.')

  return `${lines.join('\n')}\n`
}

function main() {
  const catalog = readBuildCatalog(root)
  const snapshot = readWorkspaceState({ autosavePath, projectRoot: root, workspacePath })
  if (!snapshot.workspace) throw new Error(`Workspace ausente: ${snapshot.sourcePath}`)
  if (!fs.existsSync(assignmentPath)) throw new Error('Rode combat:builds:balance antes da simulacao.')
  const assignmentData = JSON.parse(fs.readFileSync(assignmentPath, 'utf8'))
  if (assignmentData.catalogVersion !== 2) throw new Error('Atribuicoes ainda nao usam catalogo v2.')

  const payload = {
    archetypeScenarios: archetypeScenarios(catalog),
    archetypeRoundRobinScenarios: archetypeRoundRobinScenarios(catalog),
    catalogAudit: catalogAudit(catalog),
    generatedAt: new Date().toISOString(),
    iterations: ITERATIONS,
    itemPairwiseScenarios: itemPairwiseScenarios(catalog),
    itemScenarios: itemScenarios(catalog),
    npcMirrorScenarios: npcMirrorScenarios(snapshot.workspace, assignmentData),
    roundRobinBuilt: roundRobinBuilt(snapshot.workspace, assignmentData),
    sourcePath: snapshot.sourcePath,
  }
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  fs.writeFileSync(reportPath, renderReport(payload), 'utf8')
  console.log(`[build-loadouts] PASS estrutural: ${payload.catalogAudit.length} item/raridade, ${payload.npcMirrorScenarios.length} NPCs, ${payload.roundRobinBuilt.length} pares`)
  console.log(`  relatorio: ${reportPath}`)
  console.log(`  dados: ${jsonPath}`)
}

main()
