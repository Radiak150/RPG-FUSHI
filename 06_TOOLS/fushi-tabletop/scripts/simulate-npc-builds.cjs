const fs = require('node:fs')
const path = require('node:path')
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
} = require('./lib/fushi-workspace-io.cjs')

const projectRoot = process.cwd()
const outputDirectory = path.join(projectRoot, 'docs', 'fushi-system')
const assignmentsPath = path.join(outputDirectory, 'NPC_BUILD_ASSIGNMENTS.json')
const jsonPath = path.join(outputDirectory, 'NPC_BUILD_PAIRWISE_SIMULATION.json')
const reportPath = path.join(outputDirectory, 'NPC_BUILD_PAIRWISE_SIMULATION.md')
const workspacePath = process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath()
const autosavePath = process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(projectRoot)
const ITERATIONS = Math.max(100, Math.min(5000, Number(readArg('iterations')) || 600))
const MAX_ROUNDS = Math.max(5, Math.min(100, Number(readArg('rounds')) || 30))

function readArg(name) {
  const prefix = `--${name}=`
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length)
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

function hash(value) {
  let output = 2166136261
  for (const character of String(value)) {
    output ^= character.charCodeAt(0)
    output = Math.imul(output, 16777619)
  }
  return output >>> 0
}

function rollDie(random, sides) {
  return 1 + Math.floor(random() * Math.max(2, sides))
}

function rollPool(random, dice, bonus) {
  const count = dice <= 0 ? 2 : Math.max(1, dice)
  const values = Array.from({ length: count }, () => rollDie(random, 20))
  const natural = dice <= 0 ? Math.min(...values) : Math.max(...values)
  return { natural, total: natural + bonus }
}

function parseDamageFormula(value) {
  const match = /(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?/i.exec(String(value ?? ''))
  if (!match) return null
  return {
    bonus: (match[3] === '-' ? -1 : 1) * Number(match[4] ?? 0),
    dice: Math.max(1, Number(match[1] || 1)),
    sides: Math.max(2, Number(match[2])),
  }
}

function damageAverage(formula) {
  return formula.dice * ((formula.sides + 1) / 2) + formula.bonus
}

function rollDamage(random, formula, critical, bonus, choreographyDice = 0) {
  let total = formula.bonus + bonus
  const dice = (formula.dice + choreographyDice) * (critical ? 2 : 1)
  for (let index = 0; index < dice; index += 1) total += rollDie(random, formula.sides)
  return Math.max(0, total)
}

function getSkillBonus(character, name, cap) {
  const target = normalize(name)
  const skill = (character.pericias ?? []).find((entry) => normalize(entry.nome) === target)
  return Math.min(cap, Math.max(0, Number(skill?.bonusPericia ?? 0) || 0))
}

function damageFormulaFromFeature(feature) {
  const structured = feature.automation?.combat?.dano?.formula
  if (structured && parseDamageFormula(structured)) return structured

  const lines = [feature.descricao, feature.resumo]
    .filter(Boolean)
    .join('\n')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const previous = lines[index - 1] ?? ''
    const normalizedLine = normalize(line)
    const normalizedPrevious = normalize(previous)
    if (!/dano|causa/.test(`${normalizedPrevious} ${normalizedLine}`)) continue
    if (/cura|recupera|sofre|recebe|reduz|custo|pos-uso|falha/.test(normalizedLine)) continue
    const match = /\b(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?/i.exec(line)
    if (!match || Number(match[2]) === 20) continue
    const formula = match[0]
    if (parseDamageFormula(formula)) return formula
  }

  return ''
}

function healingFormulaFromFeature(feature) {
  const lines = [feature.descricao, feature.resumo]
    .filter(Boolean)
    .join('\n')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const previous = lines[index - 1] ?? ''
    const nearby = normalize(`${previous} ${line}`)
    if (!/cura|recupera.*vida|vida.*recupera/.test(nearby)) continue
    if (/dano|sofre|custo|determinacao|fushi/.test(normalize(line))) continue
    const match = /\b(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?/i.exec(line)
    if (!match || Number(match[2]) === 20) continue
    const formula = match[0]
    if (parseDamageFormula(formula)) return formula
  }

  return ''
}

function isRangedFeature(feature) {
  return /pontaria|distancia|arco|pistola|tiro|disparo/i.test(
    normalize(
      `${feature?.automation?.combat?.teste?.pericia ?? ''} ${feature?.alcance ?? ''} ${feature?.nome ?? ''} ${feature?.automation?.range ?? ''}`,
    ),
  )
}

function getActionCosts(feature) {
  const structured = Object.fromEntries(
    (feature?.automation?.costs ?? []).map((cost) => [
      cost.resource,
      Math.max(0, Number(cost.amount ?? 0) || 0),
    ]),
  )
  if (Object.keys(structured).length > 0) return structured

  const costs = {}
  const description = String(feature?.descricao ?? feature?.resumo ?? '')
  for (const match of description.matchAll(/(\d+)\s*(FUSHI|Determina(?:cao|ção))/gi)) {
    const resource = normalize(match[2]).startsWith('determina') ? 'determinacao' : 'fushi'
    costs[resource] = Math.max(costs[resource] ?? 0, Number(match[1]))
  }
  return costs
}

function isLockedAction(feature, source) {
  if (source === 'ritual') return true
  if (/fase|final|femto|ascensao|dominio|lendaria|berserk|game over/i.test(normalize(feature?.nome))) {
    return true
  }
  return source === 'ability' && feature?.automation?.kind === 'ataque' && (feature.automation.costs ?? []).length === 0
}

function isReactiveAction(feature) {
  return /reacao|ao receber dano|quando .*dano|quando .*ataca/i.test(
    normalize(feature?.automation?.activation),
  )
}

function collectDamageActions(character, archetype) {
  const candidates = []
  for (const attack of character.ataques ?? []) {
    const formula = attack.automation?.combat?.dano?.formula || attack.dano
    const parsed = parseDamageFormula(formula)
    if (parsed) candidates.push({ costs: {}, feature: attack, formula, parsed, source: 'attack' })
  }

  for (const feature of character.habilidadesDetalhadas ?? []) {
    const formula = damageFormulaFromFeature(feature)
    const parsed = parseDamageFormula(formula)
    if (parsed && !isLockedAction(feature, 'ability') && !isReactiveAction(feature)) {
      candidates.push({ costs: getActionCosts(feature), feature, formula, parsed, source: 'ability' })
    }
  }

  const hasRoutine = candidates.some((action) => action.source === 'attack')
  if (!hasRoutine) {
    candidates.push({
      costs: {},
      feature: null,
      formula: '1d2',
      parsed: parseDamageFormula('1d2'),
      source: 'unarmed',
    })
  }

  return candidates.map((candidate) => ({
    ...candidate,
    ranged: archetype === 'atirador' || isRangedFeature(candidate.feature),
  }))
}

function collectHealingActions(character, healingBonus) {
  return (character.habilidadesDetalhadas ?? [])
    .filter((feature) => !/minuto|hora|descanso/i.test(normalize(feature.automation?.activation)))
    .map((feature) => {
      const formula = healingFormulaFromFeature(feature)
      const parsed = parseDamageFormula(formula)
      if (!parsed) return null
      const attributeBonus = /presenca/i.test(normalize(feature.descricao))
        ? Number(character.atributos?.presenca ?? 0) || 0
        : 0
      return {
        averageHealing: damageAverage(parsed) + attributeBonus + healingBonus,
        attributeBonus,
        costs: getActionCosts(feature),
        formula,
        name: feature.nome,
        parsed,
      }
    })
    .filter(Boolean)
}

function inferRoll(character, action, record) {
  const configured = action.feature?.automation?.roll
  if (configured && Number(configured.bonus ?? 0) > 0) {
    return {
      bonus: Math.min(record.skillCap, Math.max(0, Number(configured.bonus ?? 0) || 0)),
      dice: Number(configured.quantidadeDados ?? 1) || 1,
    }
  }

  if (action.source === 'attack') {
    const attack = action.feature
    const ranged = isRangedFeature(attack) || record.archetype === 'atirador'
    const agileMelee = record.archetype === 'assassino' && /lamina|agulha|faca|katana|wakizashi/i.test(normalize(attack.nome))
    return {
      bonus: getSkillBonus(character, ranged ? 'Pontaria' : 'Luta', record.skillCap),
      dice: Number(character.atributos?.[ranged || agileMelee ? 'agilidade' : attack.atributoBase] ?? 1) || 0,
    }
  }

  if (action.source === 'ability' || action.source === 'ritual') {
    const text = normalize(`${action.feature?.automation?.activation ?? ''} ${action.feature?.descricao ?? ''}`)
    if (text.includes('intelecto') || text.includes('ocultismo')) {
      return {
        bonus: getSkillBonus(character, 'Ocultismo*', record.skillCap),
        dice: Number(character.atributos?.intelecto ?? 0) || 0,
      }
    }
    if (text.includes('agilidade') || text.includes('pontaria')) {
      return {
        bonus: getSkillBonus(character, 'Pontaria', record.skillCap),
        dice: Number(character.atributos?.agilidade ?? 0) || 0,
      }
    }
  }

  if (record.archetype === 'atirador') {
    return {
      bonus: getSkillBonus(character, 'Pontaria', record.skillCap),
      dice: Number(character.atributos?.agilidade ?? 0) || 0,
    }
  }
  if (record.archetype === 'ocultista') {
    return {
      bonus: getSkillBonus(character, 'Ocultismo*', record.skillCap),
      dice: Number(character.atributos?.intelecto ?? 0) || 0,
    }
  }

  return {
    bonus: getSkillBonus(character, 'Luta', record.skillCap),
    dice: Number(character.atributos?.forca ?? 0) || 0,
  }
}

function buildCombatant(character, record) {
  const modifiers = record.item.modifiers
  const actions = collectDamageActions(character, record.archetype).map((action) => {
    const contextBonus =
      modifiers.damage +
      (action.source === 'ability' ? modifiers.abilityDamage : 0) +
      (action.ranged ? modifiers.rangedDamage : modifiers.meleeDamage) +
      (!action.ranged ? modifiers.adjacentDamage : 0) +
      (record.archetype === 'assassino' && /isolado/i.test(record.item.passive) ? 1 : 0)
    return {
      ...action,
      averageDamage: damageAverage(action.parsed) + contextBonus,
      contextBonus,
      lifeStealRatio: /recupera metade do dano causado/i.test(normalize(action.feature?.descricao))
        ? 0.5
        : 0,
      name: action.feature?.nome ?? 'Ataque desarmado',
      roll: inferRoll(character, action, record),
    }
  })
  const primaryAction = actions
    .slice()
    .sort((left, right) => right.averageDamage - left.averageDamage)[0]
  const healingActions = collectHealingActions(character, modifiers.healing)
  const controlCount = (character.habilidadesDetalhadas ?? []).filter((feature) =>
    /atordo|imobil|derrub|perde 1 acao|reduz.*acao|puxa|empurra|silencio|petrifica/i.test(
      normalize(`${feature.nome} ${feature.descricao}`),
    ),
  ).length
  const phaseActionCount =
    (character.rituais ?? []).length +
    (character.habilidadesDetalhadas ?? []).filter((feature) =>
      isLockedAction(feature, 'ability'),
    ).length

  return {
    action: {
      averageDamage: primaryAction.averageDamage,
      contextBonus: primaryAction.contextBonus,
      formula: primaryAction.formula,
      name: primaryAction.name,
      parsedDamage: primaryAction.parsed,
      roll: primaryAction.roll,
      source: primaryAction.source,
    },
    actions,
    archetype: record.archetype,
    block: record.after.block,
    ca: record.after.ca,
    dodge: record.after.dodge,
    id: character.id,
    initiative: Number(character.atributos?.agilidade ?? 0) +
      getSkillBonus(character, 'Iniciativa', record.skillCap) +
      Number(modifiers.initiative ?? 0),
    healingActions,
    life: record.after.life,
    name: character.nome,
    powerLevel: record.powerLevel,
    phaseActionCount,
    utility: {
      determination: record.after.determination,
      fushi: record.after.fushi,
      healing: modifiers.healing,
      healingAverage: healingActions.reduce(
        (maximum, action) => Math.max(maximum, action.averageHealing),
        0,
      ),
      initiative: modifiers.initiative,
      movement: modifiers.movement,
      controlCount,
    },
  }
}

function canPayAction(resources, action) {
  return Object.entries(action.costs).every(
    ([resource, amount]) => Number(resources[resource] ?? 0) >= amount,
  )
}

function payAction(resources, action) {
  for (const [resource, amount] of Object.entries(action.costs)) {
    resources[resource] = Math.max(0, Number(resources[resource] ?? 0) - amount)
  }
}

function chooseCounterAction(actor) {
  return actor.actions
    .filter(
      (action) =>
        (action.source === 'attack' || action.source === 'unarmed') &&
        Object.keys(action.costs ?? {}).length === 0,
    )
    .sort((left, right) => right.averageDamage - left.averageDamage)[0] ?? null
}

function hitChance(dice, bonus, threshold) {
  if (dice <= 0) {
    const needed = Math.max(1, Math.min(21, threshold - bonus))
    const single = (21 - needed) / 20
    return single * single
  }
  const needed = Math.max(1, Math.min(21, threshold - bonus))
  const missSingle = (needed - 1) / 20
  return 1 - missSingle ** Math.max(1, dice)
}

function bestChoreography(action, target, reactionAvailable) {
  if (action.roll.dice <= 1) return { keptDice: action.roll.dice, sacrificedDice: 0 }
  const threshold = reactionAvailable ? target.dodge + 1 : target.ca
  let best = { keptDice: action.roll.dice, sacrificedDice: 0, score: -1 }
  for (let sacrificedDice = 0; sacrificedDice < action.roll.dice; sacrificedDice += 1) {
    const keptDice = action.roll.dice - sacrificedDice
    const chance = hitChance(keptDice, action.roll.bonus, threshold)
    const expectedDamage =
      (action.parsed.dice + sacrificedDice) * ((action.parsed.sides + 1) / 2) +
      action.parsed.bonus +
      action.contextBonus
    const score = chance * Math.max(0, expectedDamage)
    if (score > best.score) best = { keptDice, sacrificedDice, score }
  }
  return best
}

function chooseAction(actor, target, resources, reactionAvailable, currentLife) {
  return actor.actions
    .filter((action) => canPayAction(resources, action))
    .map((action) => {
      const choreography = bestChoreography(action, target, reactionAvailable)
      const threshold = reactionAvailable ? target.dodge + 1 : target.ca
      const score =
        hitChance(choreography.keptDice, action.roll.bonus, threshold) *
        Math.max(
          0,
          (action.parsed.dice + choreography.sacrificedDice) * ((action.parsed.sides + 1) / 2) +
            action.parsed.bonus +
            action.contextBonus,
        )
      const missingLifeRatio = Math.max(0, (actor.life - currentLife) / Math.max(1, actor.life))
      const sustainScore = score * action.lifeStealRatio * missingLifeRatio
      return { action, choreography, score: score + sustainScore }
    })
    .sort((left, right) => right.score - left.score)[0]
}

function chooseHealingAction(actor, state) {
  const missingLife = actor.life - state.currentLife
  if (missingLife <= 0 || state.currentLife > actor.life * 0.6) return null
  return actor.healingActions
    .filter((action) => canPayAction(state.resources, action))
    .map((action) => ({
      action,
      effectiveAverage: Math.min(missingLife, action.averageHealing),
    }))
    .sort((left, right) => right.effectiveAverage - left.effectiveAverage)[0]?.action ?? null
}

function rollHealing(random, action) {
  let total = action.parsed.bonus + action.attributeBonus
  for (let index = 0; index < action.parsed.dice; index += 1) {
    total += rollDie(random, action.parsed.sides)
  }
  return Math.max(0, total)
}

function simulatePair(left, right, reactionPreSpent, seed) {
  const random = randomFactory(seed)
  let leftWins = 0
  let rightWins = 0
  let draws = 0
  let roundsTotal = 0
  let dodges = 0
  let blocks = 0
  let healingEvents = 0
  let healingTotal = 0
  let hits = 0
  let counterAttacks = 0
  let counterHits = 0

  for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
    const state = [
      {
        actor: left,
        currentLife: left.life,
        resources: { determinacao: left.utility.determination, fushi: left.utility.fushi },
        reactionAvailable: false,
      },
      {
        actor: right,
        currentLife: right.life,
        resources: { determinacao: right.utility.determination, fushi: right.utility.fushi },
        reactionAvailable: false,
      },
    ]
    let round = 0

    while (round < MAX_ROUNDS && state[0].currentLife > 0 && state[1].currentLife > 0) {
      round += 1
      state.forEach((entry) => {
        entry.reactionAvailable = !reactionPreSpent
      })
      const first = left.initiative > right.initiative
        ? 0
        : right.initiative > left.initiative
          ? 1
          : random() < 0.5 ? 0 : 1
      const order = first === 0 ? [0, 1] : [1, 0]

      for (const attackerIndex of order) {
        const targetIndex = attackerIndex === 0 ? 1 : 0
        if (state[attackerIndex].currentLife <= 0 || state[targetIndex].currentLife <= 0) continue
        for (let actionIndex = 0; actionIndex < 1; actionIndex += 1) {
          if (state[targetIndex].currentLife <= 0) break
          const attacker = state[attackerIndex].actor
          const target = state[targetIndex].actor
          const healingAction = chooseHealingAction(attacker, state[attackerIndex])
          if (healingAction) {
            payAction(state[attackerIndex].resources, healingAction)
            const recovered = Math.min(
              attacker.life - state[attackerIndex].currentLife,
              rollHealing(random, healingAction),
            )
            state[attackerIndex].currentLife += recovered
            healingEvents += 1
            healingTotal += recovered
            continue
          }
          const selection = chooseAction(
            attacker,
            target,
            state[attackerIndex].resources,
            state[targetIndex].reactionAvailable,
            state[attackerIndex].currentLife,
          )
          if (!selection) break
          const { action, choreography } = selection
          payAction(state[attackerIndex].resources, action)
          const attackRoll = rollPool(random, choreography.keptDice, action.roll.bonus)
          if (attackRoll.total < target.ca) {
            const counterAction = chooseCounterAction(target)
            if (state[targetIndex].reactionAvailable && counterAction) {
              state[targetIndex].reactionAvailable = false
              counterAttacks += 1
              const counterRoll = rollPool(
                random,
                Math.max(1, counterAction.roll.dice),
                counterAction.roll.bonus,
              )
              if (counterRoll.total >= attacker.ca) {
                if (state[attackerIndex].reactionAvailable && attacker.dodge >= counterRoll.total) {
                  state[attackerIndex].reactionAvailable = false
                  dodges += 1
                } else {
                  const counterCritical = counterRoll.natural === 20
                  let counterDamage = rollDamage(
                    random,
                    counterAction.parsed,
                    counterCritical,
                    counterAction.contextBonus,
                    0,
                  )
                  if (state[attackerIndex].reactionAvailable && attacker.block > 0) {
                    state[attackerIndex].reactionAvailable = false
                    counterDamage = Math.max(0, counterDamage - attacker.block)
                    blocks += 1
                  }
                  state[attackerIndex].currentLife = Math.max(
                    0,
                    state[attackerIndex].currentLife - counterDamage,
                  )
                  counterHits += 1
                  hits += 1
                }
              }
            }
            continue
          }

          if (state[targetIndex].reactionAvailable && target.dodge >= attackRoll.total) {
            state[targetIndex].reactionAvailable = false
            dodges += 1
            continue
          }

          const critical = attackRoll.natural === 20
          let damage = rollDamage(
            random,
            action.parsed,
            critical,
            action.contextBonus,
            choreography.sacrificedDice,
          )
          if (state[targetIndex].reactionAvailable && target.block > 0) {
            state[targetIndex].reactionAvailable = false
            damage = Math.max(0, damage - target.block)
            blocks += 1
          }
          hits += 1
          state[targetIndex].currentLife = Math.max(0, state[targetIndex].currentLife - damage)
          if (action.lifeStealRatio > 0 && damage > 0) {
            const recovered = Math.min(
              attacker.life - state[attackerIndex].currentLife,
              Math.floor(damage * action.lifeStealRatio),
            )
            state[attackerIndex].currentLife += recovered
            healingEvents += recovered > 0 ? 1 : 0
            healingTotal += recovered
          }
        }
      }
    }

    roundsTotal += round
    if (state[0].currentLife <= 0 && state[1].currentLife <= 0) draws += 1
    else if (state[1].currentLife <= 0) leftWins += 1
    else if (state[0].currentLife <= 0) rightWins += 1
    else draws += 1
  }

  return {
    averageRounds: Number((roundsTotal / ITERATIONS).toFixed(2)),
    blockEvents: blocks,
    counterAttackEvents: counterAttacks,
    counterHitEvents: counterHits,
    dodgeEvents: dodges,
    drawRate: Number((draws / ITERATIONS).toFixed(4)),
    healingEvents,
    healingTotal,
    hitEvents: hits,
    leftWinRate: Number((leftWins / ITERATIONS).toFixed(4)),
    rightWinRate: Number((rightWins / ITERATIONS).toFixed(4)),
  }
}

function aggregateByPower(results) {
  const groups = {}
  for (const result of results) {
    const key = `${result.left.powerLevel} x ${result.right.powerLevel}`
    const group = groups[key] ?? { count: 0, duelDraw: 0, pressureDraw: 0 }
    group.count += 1
    group.duelDraw += result.duel.drawRate
    group.pressureDraw += result.pressure.drawRate
    groups[key] = group
  }
  return Object.fromEntries(
    Object.entries(groups).map(([key, value]) => [key, {
      count: value.count,
      duelDrawRate: Number((value.duelDraw / value.count).toFixed(4)),
      pressureDrawRate: Number((value.pressureDraw / value.count).toFixed(4)),
    }]),
  )
}

function renderReport(payload) {
  const sameTier = payload.pairs.filter((pair) => pair.left.powerLevel === pair.right.powerLevel)
  const decisivePressure = sameTier.filter((pair) => pair.pressure.drawRate < 0.5)
  const crossTierUpsets = payload.pairs.filter((pair) => {
    const order = { Basico: 0, Avancado: 1, Ascensao: 2, Cataclisma: 3 }
    const leftTier = order[pair.left.powerLevel]
    const rightTier = order[pair.right.powerLevel]
    if (leftTier === rightTier) return false
    return leftTier < rightTier
      ? pair.pressure.leftWinRate > 0.25
      : pair.pressure.rightWinRate > 0.25
  })
  const combatantByName = new Map(payload.combatants.map((entry) => [entry.name, entry]))
  const powerOrder = { Basico: 0, Avancado: 1, Ascensao: 2, Cataclisma: 3 }
  const contextualUpsets = []
  const hardUpsets = []
  for (const pair of crossTierUpsets) {
    const higherSummary = powerOrder[pair.left.powerLevel] > powerOrder[pair.right.powerLevel]
      ? pair.left
      : pair.right
    const higher = combatantByName.get(higherSummary.name)
    const roleLimited = Boolean(
      higher && (
        (higher.utility.healingAverage > 0 && higher.action.averageDamage <= 5) ||
        (higher.action.source === 'unarmed' && higher.utility.controlCount >= 2)
      ),
    )
    const phaseDependent = Boolean(higher?.phaseActionCount > 0)
    const entry = { pair, phaseDependent, roleLimited }
    if (roleLimited || phaseDependent) contextualUpsets.push(entry)
    else hardUpsets.push(entry)
  }
  const lines = [
    '# Simulacao Pareada dos NPCs com Builds',
    '',
    `Gerado em: ${payload.generatedAt}`,
    `NPCs: ${payload.combatants.length}`,
    `Pares unicos: ${payload.pairs.length}`,
    `Iteracoes por par/modo: ${payload.iterations}`,
    `Limite de rodadas: ${payload.maxRounds}`,
    '',
    '## Como ler',
    '',
    '- Duelo usa um ataque por personagem/rodada. Uma Esquiva fixa alta pode travar o 1x1.',
    '- Pressao simula o ataque com a Reacao ja gasta por outro perigo da rodada; o golpe enfrenta apenas a CA.',
    '- Habilidades gastam FUSHI/Determinacao, curas reais sao usadas quando ferido e a Coreografia troca d20 por dados de dano.',
    '- Acoes de fase, Dominio, Lendaria, Berserk ou ataque futuro ficam fora do duelo comum.',
    '- Suporte e controle nao sao julgados apenas por vitoria solo; cura e quantidade de controles ficam publicadas no JSON.',
    '- Nenhum efeito de Habilidade foi reescrito para a simulacao; sem dano direto sustentavel, usa 1d2.',
    '',
    '## Resumo',
    '',
    `- Pares do mesmo Nivel: ${sameTier.length}`,
    `- Pares do mesmo Nivel com resultado majoritariamente decisivo sob pressao: ${decisivePressure.length}`,
    `- Viradas brutas entre Niveis acima de 25%: ${crossTierUpsets.length}`,
    `- Alertas numericos duros: ${hardUpsets.length}`,
    `- Resultados contextuais de suporte, controle ou fase: ${contextualUpsets.length}`,
    '',
    '## Empates por faixa',
    '',
    '| Faixa | Pares | Empate 1x1 | Empate sob pressao |',
    '| --- | ---: | ---: | ---: |',
  ]
  Object.entries(payload.summaryByPower).forEach(([name, value]) => {
    lines.push(`| ${name} | ${value.count} | ${(value.duelDrawRate * 100).toFixed(1)}% | ${(value.pressureDrawRate * 100).toFixed(1)}% |`)
  })

  lines.push('', '## Alertas numericos duros', '')
  if (hardUpsets.length === 0) lines.push('- Nenhuma virada sem explicacao de papel/fase acima do limite de 25% sob pressao.')
  else hardUpsets.slice(0, 30).forEach(({ pair }) => {
    lines.push(`- ${pair.left.name} (${pair.left.powerLevel}) x ${pair.right.name} (${pair.right.powerLevel}): ${(pair.pressure.leftWinRate * 100).toFixed(1)}% / ${(pair.pressure.rightWinRate * 100).toFixed(1)}%.`)
  })

  lines.push('', '## Resultados contextuais, nao nerfar automaticamente', '')
  if (contextualUpsets.length === 0) lines.push('- Nenhum resultado contextual acima do limite.')
  else contextualUpsets.slice(0, 30).forEach(({ pair, phaseDependent, roleLimited }) => {
    const reasons = [roleLimited ? 'papel de suporte/controle' : '', phaseDependent ? 'mecanica de fase fora do duelo' : ''].filter(Boolean).join('; ')
    lines.push(`- ${pair.left.name} (${pair.left.powerLevel}) x ${pair.right.name} (${pair.right.powerLevel}): ${(pair.pressure.leftWinRate * 100).toFixed(1)}% / ${(pair.pressure.rightWinRate * 100).toFixed(1)}% (${reasons}).`)
  })

  lines.push('', '## Acao primaria usada', '')
  payload.combatants.forEach((combatant) => {
    const healing = combatant.utility.healingAverage > 0
      ? `; cura ${(combatant.utility.healingAverage).toFixed(1)}`
      : ''
    lines.push(`- ${combatant.name}: ${combatant.action.name} (${combatant.action.formula}; media ${(combatant.action.averageDamage).toFixed(1)} antes de defesa${healing}; controles ${combatant.utility.controlCount}).`)
  })

  return `${lines.join('\n')}\n`
}

function main() {
  const snapshot = readWorkspaceState({ autosavePath, projectRoot, workspacePath })
  if (!snapshot.workspace) throw new Error(`Workspace real ausente: ${snapshot.sourcePath}`)
  if (!fs.existsSync(assignmentsPath)) throw new Error(`Rode balance-npc-builds antes: ${assignmentsPath}`)

  const assignmentData = JSON.parse(fs.readFileSync(assignmentsPath, 'utf8'))
  const recordById = new Map(assignmentData.records.map((record) => [record.characterId, record]))
  const combatants = getCharacters(snapshot.workspace)
    .filter((character) => character.tipo === 'npc')
    .map((character) => {
      const record = recordById.get(character.id)
      if (!record) throw new Error(`NPC sem registro de build: ${character.nome}`)
      return buildCombatant(character, record)
    })

  const pairs = []
  for (let leftIndex = 0; leftIndex < combatants.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < combatants.length; rightIndex += 1) {
      const left = combatants[leftIndex]
      const right = combatants[rightIndex]
      const pairSeed = hash(`${left.id}:${right.id}:20260715`)
      pairs.push({
        duel: simulatePair(left, right, false, pairSeed),
        left: {
          archetype: left.archetype,
          name: left.name,
          powerLevel: left.powerLevel,
        },
        pressure: simulatePair(left, right, true, pairSeed ^ 0x9e3779b9),
        right: {
          archetype: right.archetype,
          name: right.name,
          powerLevel: right.powerLevel,
        },
      })
    }
  }

  const payload = {
    combatants,
    generatedAt: new Date().toISOString(),
    iterations: ITERATIONS,
    maxRounds: MAX_ROUNDS,
    pairs,
    sourcePath: snapshot.sourcePath,
    summaryByPower: aggregateByPower(pairs),
  }
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  fs.writeFileSync(reportPath, renderReport(payload), 'utf8')

  console.log(`[npc-build-sim] PASS: ${combatants.length} NPCs, ${pairs.length} pares`)
  console.log(`  iteracoes: ${ITERATIONS} por par/modo`)
  console.log(`  relatorio: ${reportPath}`)
  console.log(`  dados: ${jsonPath}`)
}

main()
