import type { CharacterSheet, RollConfig } from '../data/types'
import { buildAttackActionFeature } from './characterActions'
import {
  applyCombatBuildDamageBonus,
  applyCombatBlock,
  getAttackDamageFormula,
  getCombatBlockValue,
  getCombatDodgeValue,
  getDefaultUnarmedDamage,
  getPrimaryAttack,
  parseDamageFormula,
} from './combatV2'

export type CombatSimulationTeamId = 'a' | 'b'

export interface CombatSimulationCombatant {
  id: string
  name: string
  character: CharacterSheet
  team: CombatSimulationTeamId
}

export interface CombatSimulationInput {
  combatants: CombatSimulationCombatant[]
  iterations?: number
  maxRounds?: number
  seed?: number
}

export interface CombatSimulationTeamResult {
  averageDamage: number
  averageRemainingLife: number
  label: string
  winRate: number
  wins: number
}

export interface CombatSimulationEventResult {
  blocks: number
  crits: number
  dodges: number
  hits: number
  misses: number
}

export interface CombatSimulationResult {
  averageRounds: number
  drawRate: number
  draws: number
  events: CombatSimulationEventResult
  iterations: number
  maxRounds: number
  teams: Record<CombatSimulationTeamId, CombatSimulationTeamResult>
}

interface RuntimeCombatant {
  character: CharacterSheet
  id: string
  life: number
  name: string
  reactionAvailable: boolean
  team: CombatSimulationTeamId
}

interface AttackProfile {
  damageFormula: string
  roll: RollConfig
}

function createSeededRandom(seed: number) {
  let value = seed >>> 0

  return () => {
    value += 0x6d2b79f5
    let output = value
    output = Math.imul(output ^ (output >>> 15), output | 1)
    output ^= output + Math.imul(output ^ (output >>> 7), output | 61)

    return ((output ^ (output >>> 14)) >>> 0) / 4294967296
  }
}

function rollDie(random: () => number, sides: number) {
  return 1 + Math.floor(random() * Math.max(2, sides))
}

function rollConfig(random: () => number, config: RollConfig) {
  const dice = Array.from(
    { length: Math.max(1, config.quantidadeDados) },
    () => rollDie(random, config.tipoDado),
  )
  const selected =
    config.modo === 'lowest'
      ? Math.min(...dice)
      : config.modo === 'sum'
        ? dice.reduce((sum, die) => sum + die, 0)
        : Math.max(...dice)

  return {
    selected,
    total: selected + (config.bonus ?? 0),
  }
}

function buildAttackProfile(character: CharacterSheet): AttackProfile {
  const attack = getPrimaryAttack(character)

  if (!attack) {
    return {
      damageFormula: applyCombatBuildDamageBonus(
        getDefaultUnarmedDamage(character),
        character,
        'melee',
      ),
      roll: {
        quantidadeDados: Math.max(1, character.atributos.forca),
        tipoDado: 20,
        bonus: 0,
        modo: 'highest',
      },
    }
  }

  const feature = buildAttackActionFeature(character, attack)
  const ranged =
    attack.atributoBase === 'agilidade' ||
    /distancia|distância|arco|pistola|tiro|[2-9]\d*\s*m/i.test(`${attack.alcance} ${attack.nome}`)

  return {
    damageFormula: applyCombatBuildDamageBonus(
      getAttackDamageFormula(attack) || getDefaultUnarmedDamage(character),
      character,
      ranged ? 'ranged' : 'melee',
    ),
    roll: feature.automation?.roll ?? {
      quantidadeDados: Math.max(1, character.atributos[attack.atributoBase]),
      tipoDado: 20,
      bonus: attack.bonusPericia,
      modo: 'highest',
    },
  }
}

function rollDamage(random: () => number, formula: string, critical: boolean) {
  const parsed = parseDamageFormula(formula)

  if (!parsed) {
    return 0
  }

  const diceCount = parsed.dice * (critical ? 2 : 1)
  let total = parsed.bonus

  for (let index = 0; index < diceCount; index += 1) {
    total += rollDie(random, parsed.sides)
  }

  return Math.max(0, total)
}

function chooseTarget(combatants: RuntimeCombatant[], team: CombatSimulationTeamId) {
  return combatants
    .filter((combatant) => combatant.team !== team && combatant.life > 0)
    .sort((left, right) => left.life - right.life)[0] ?? null
}

function shouldAttemptDodge(
  dodgeValue: number | null,
  attackTotal: number,
  damageFormula: string,
  blockValue: number,
) {
  if (dodgeValue === null) {
    return false
  }

  const parsed = parseDamageFormula(damageFormula)
  const expectedDamage = parsed
    ? parsed.dice * ((parsed.sides + 1) / 2) + parsed.bonus
    : 0

  return expectedDamage > blockValue && dodgeValue >= attackTotal
}

function createRuntimeCombatants(combatants: CombatSimulationCombatant[]) {
  return combatants.map<RuntimeCombatant>((combatant) => ({
    character: combatant.character,
    id: combatant.id,
    life: Math.max(1, combatant.character.recursos.vidaMaxima),
    name: combatant.name,
    reactionAvailable: true,
    team: combatant.team,
  }))
}

function hasLivingTeam(combatants: RuntimeCombatant[], team: CombatSimulationTeamId) {
  return combatants.some((combatant) => combatant.team === team && combatant.life > 0)
}

export function simulateCombat(input: CombatSimulationInput): CombatSimulationResult {
  const combatants = input.combatants.filter(
    (combatant) => Boolean(combatant.id && combatant.character),
  )
  const iterations = Math.max(1, Math.min(5000, Math.floor(input.iterations ?? 500)))
  const maxRounds = Math.max(1, Math.min(100, Math.floor(input.maxRounds ?? 24)))
  const random = createSeededRandom(input.seed ?? 20260711)
  const eventTotals: CombatSimulationEventResult = {
    blocks: 0,
    crits: 0,
    dodges: 0,
    hits: 0,
    misses: 0,
  }
  const winTotals: Record<CombatSimulationTeamId, number> = { a: 0, b: 0 }
  const damageTotals: Record<CombatSimulationTeamId, number> = { a: 0, b: 0 }
  const remainingLifeTotals: Record<CombatSimulationTeamId, number> = { a: 0, b: 0 }
  let draws = 0
  let roundTotal = 0

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const runtime = createRuntimeCombatants(combatants)
    const turnOrder = [...runtime].sort(
      (left, right) => right.character.atributos.agilidade - left.character.atributos.agilidade,
    )
    let round = 0

    while (
      round < maxRounds &&
      hasLivingTeam(runtime, 'a') &&
      hasLivingTeam(runtime, 'b')
    ) {
      round += 1
      runtime.forEach((combatant) => {
        combatant.reactionAvailable = combatant.life > 0
      })

      for (const attacker of turnOrder) {
        if (attacker.life <= 0 || !hasLivingTeam(runtime, attacker.team)) {
          continue
        }

        const target = chooseTarget(runtime, attacker.team)

        if (!target) {
          break
        }

        const attack = buildAttackProfile(attacker.character)
        const attackRoll = rollConfig(random, attack.roll)
        const critical = attackRoll.selected === 20

        if (attackRoll.total < target.character.defesa) {
          eventTotals.misses += 1
          continue
        }

        const blockValue = getCombatBlockValue(target.character)
        const dodgeValue = getCombatDodgeValue(target.character)

        if (
          target.reactionAvailable &&
          shouldAttemptDodge(dodgeValue, attackRoll.total, attack.damageFormula, blockValue)
        ) {
          target.reactionAvailable = false
          eventTotals.dodges += 1
          continue
        }

        const rawDamage = rollDamage(random, attack.damageFormula, critical)
        let appliedDamage = rawDamage

        if (target.reactionAvailable && blockValue > 0) {
          target.reactionAvailable = false
          appliedDamage = applyCombatBlock(rawDamage, blockValue)
          eventTotals.blocks += 1
        }

        if (critical) {
          eventTotals.crits += 1
        }

        eventTotals.hits += 1
        target.life = Math.max(0, target.life - appliedDamage)
        damageTotals[attacker.team] += appliedDamage

        if (!hasLivingTeam(runtime, target.team)) {
          break
        }
      }
    }

    roundTotal += round
    const aAlive = hasLivingTeam(runtime, 'a')
    const bAlive = hasLivingTeam(runtime, 'b')

    if (aAlive === bAlive) {
      draws += 1
    } else if (aAlive) {
      winTotals.a += 1
    } else {
      winTotals.b += 1
    }

    ;(['a', 'b'] as const).forEach((team) => {
      remainingLifeTotals[team] += runtime
        .filter((combatant) => combatant.team === team)
        .reduce((total, combatant) => total + combatant.life, 0)
    })
  }

  function teamLabel(team: CombatSimulationTeamId) {
    const names = combatants
      .filter((combatant) => combatant.team === team)
      .map((combatant) => combatant.name)

    return names.length > 0 ? names.join(', ') : `Equipe ${team.toUpperCase()}`
  }

  return {
    averageRounds: roundTotal / iterations,
    drawRate: draws / iterations,
    draws,
    events: eventTotals,
    iterations,
    maxRounds,
    teams: {
      a: {
        averageDamage: damageTotals.a / iterations,
        averageRemainingLife: remainingLifeTotals.a / iterations,
        label: teamLabel('a'),
        winRate: winTotals.a / iterations,
        wins: winTotals.a,
      },
      b: {
        averageDamage: damageTotals.b / iterations,
        averageRemainingLife: remainingLifeTotals.b / iterations,
        label: teamLabel('b'),
        winRate: winTotals.b / iterations,
        wins: winTotals.b,
      },
    },
  }
}
