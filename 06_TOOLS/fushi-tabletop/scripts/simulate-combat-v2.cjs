const fs = require('node:fs')
const path = require('node:path')
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
} = require('./lib/fushi-workspace-io.cjs')
const { getCombatV2Block, getCombatV2Dodge } = require('./lib/combat-v2.cjs')

const projectRoot = process.cwd()
const workspacePath = process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath()
const autosavePath = process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(projectRoot)
const outputDirectory = path.join(projectRoot, 'docs', 'fushi-system')
const reportPath = path.join(outputDirectory, 'COMBAT_V2_SIMULATION_REPORT.md')
const resultsPath = path.join(outputDirectory, 'COMBAT_V2_SIMULATION_RESULTS.json')
const DEFAULT_ITERATIONS = 600

function getArg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function makeRandom(seed) {
  let state = (Number(seed) >>> 0) || 0x9e3779b9
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function getCharacters(workspace) {
  return Array.isArray(workspace.characters)
    ? workspace.characters
    : Array.isArray(workspace.characters?.items)
      ? workspace.characters.items
      : []
}

function getSkill(character, name) {
  return (character.pericias ?? []).find((skill) => normalize(skill.nome) === normalize(name))
}

function skillBonus(character, name) {
  return Math.max(0, Math.round(Number(getSkill(character, name)?.bonusPericia ?? 0) || 0))
}

function parseFormula(value) {
  const match = /^\s*(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?\s*$/i.exec(String(value ?? ''))
  if (!match) return null
  const dice = Math.max(1, Number(match[1] || '1'))
  const sides = Math.max(2, Number(match[2]))
  const magnitude = Number(match[4] ?? '0')
  const bonus = match[3] === '-' ? -magnitude : magnitude
  return Number.isFinite(dice) && Number.isFinite(sides) && Number.isFinite(bonus)
    ? { bonus, dice, sides }
    : null
}

function formulaAverage(formula) {
  const parsed = parseFormula(formula)
  return parsed ? parsed.dice * ((parsed.sides + 1) / 2) + parsed.bonus : 0
}

function rollDie(random, sides) {
  return 1 + Math.floor(random() * sides)
}

function rollCheck(random, attribute, bonus) {
  const dice = attribute <= 0 ? 2 : Math.max(1, attribute)
  const results = Array.from({ length: dice }, () => rollDie(random, 20))
  const selected = attribute <= 0 ? Math.min(...results) : Math.max(...results)
  return { critical: selected === 20, results, selected, total: selected + bonus }
}

function rollDamage(random, formula, critical) {
  const parsed = parseFormula(formula)
  if (!parsed) return 0
  const count = parsed.dice * (critical ? 2 : 1)
  return Array.from({ length: count }, () => rollDie(random, parsed.sides)).reduce((sum, value) => sum + value, 0) + parsed.bonus
}

function primaryAttack(character) {
  const attacks = Array.isArray(character.ataques) ? character.ataques : []
  const usable = attacks
    .map((attack) => ({ attack, average: formulaAverage(attack.automation?.combat?.dano?.formula || attack.dano) }))
    .filter((entry) => entry.average > 0)
    .sort((left, right) => right.average - left.average)
  if (usable[0]) return usable[0].attack
  return {
    atributoBase: 'forca',
    bonusPericia: skillBonus(character, 'Luta'),
    dano: '1d2',
    nome: 'Golpe desarmado',
  }
}

function inferPower(character) {
  const status = normalize([...(character.status ?? []), character.combatRole, character.notas].join(' '))
  const resources = character.recursos ?? {}
  if (status.includes('cataclisma') || Number(resources.vidaMaxima) >= 450) return 'Cataclisma'
  if (status.includes('ascensao') || Number(resources.vidaMaxima) >= 250) return 'Ascensao'
  if (status.includes('avancado') || Number(resources.vidaMaxima) >= 100) return 'Avancado'
  if (status.includes('minion')) return 'Minion'
  return 'Basico'
}

function buildCombatant(character, modifier = {}) {
  const attack = primaryAttack(character)
  const resources = character.recursos ?? {}
  const profile = character.combatProfile ?? {}
  const block = Math.max(0, getCombatV2Block(character) + (modifier.blockBonus ?? 0))
  const agility = Number(character.atributos?.agilidade ?? 0) || 0
  const dodge = getCombatV2Dodge(character)
  return {
    attack,
    attackBonus: Math.max(0, Number(attack.bonusPericia ?? skillBonus(character, attack.atributoBase === 'agilidade' ? 'Pontaria' : 'Luta')) || 0),
    attackAttribute: Number(character.atributos?.[attack.atributoBase] ?? 0) || 0,
    block,
    canDodge: profile.podeEsquivar !== false,
    ca: Math.max(1, Number(character.defesa ?? 10) || 10),
    character,
    damageBonus: modifier.damageBonus ?? 0,
    dodge,
    dodgeAttribute: agility,
    fushi: Math.max(0, Number(resources.fushiMaximo ?? 0) || 0) + (modifier.fushiBonus ?? 0),
    hp: Math.max(1, Number(resources.vidaMaxima ?? 1) || 1) + (modifier.lifeBonus ?? 0),
    id: character.id,
    name: character.nome,
    power: inferPower(character),
    type: character.tipo,
  }
}

function chooseReaction(defender, attackTotal) {
  if (defender.reactionUsed) return 'none'
  if (defender.canDodge && defender.dodge !== null && defender.dodge >= attackTotal) return 'dodge'
  if (defender.block > 0) return 'block'
  return 'none'
}

function performAttack(random, attacker, defender) {
  const attackRoll = rollCheck(random, attacker.attackAttribute, attacker.attackBonus)
  if (attackRoll.total < defender.ca) {
    return { critical: false, damage: 0, outcome: 'miss', total: attackRoll.total }
  }
  const reaction = chooseReaction(defender, attackRoll.total)
  if (reaction === 'dodge') {
    defender.reactionUsed = true
    return { critical: attackRoll.critical, damage: 0, outcome: 'dodge', total: attackRoll.total }
  }
  const formula = attacker.attack.automation?.combat?.dano?.formula || attacker.attack.dano
  const raw = Math.max(0, rollDamage(random, formula, attackRoll.critical) + attacker.damageBonus)
  if (reaction === 'block') {
    defender.reactionUsed = true
    return {
      critical: attackRoll.critical,
      damage: Math.max(0, raw - defender.block),
      outcome: 'block',
      total: attackRoll.total,
    }
  }
  return { critical: attackRoll.critical, damage: raw, outcome: 'hit', total: attackRoll.total }
}

function simulateEncounter(random, left, right, maxRounds = 24) {
  const leftState = left.map((entry) => ({ ...entry, currentHp: entry.hp, reactionUsed: false, team: 'left' }))
  const rightState = right.map((entry) => ({ ...entry, currentHp: entry.hp, reactionUsed: false, team: 'right' }))
  const turnOrder = [...leftState, ...rightState].sort(
    (leftEntry, rightEntry) => rightEntry.dodgeAttribute - leftEntry.dodgeAttribute,
  )
  const stats = { blocks: 0, crits: 0, dodges: 0, hits: 0, misses: 0 }
  let round = 0

  while (round < maxRounds && leftState.some((entry) => entry.currentHp > 0) && rightState.some((entry) => entry.currentHp > 0)) {
    round += 1

    for (const actor of turnOrder) {
      if (actor.currentHp <= 0) continue
      const enemies = actor.team === 'left' ? rightState : leftState
      const target = enemies
        .filter((entry) => entry.currentHp > 0)
        .sort((leftEntry, rightEntry) => leftEntry.currentHp - rightEntry.currentHp)[0]
      if (!target) break

      actor.reactionUsed = false
      const result = performAttack(random, actor, target)
      target.currentHp = Math.max(0, target.currentHp - result.damage)
      stats[result.outcome === 'hit' ? 'hits' : result.outcome === 'block' ? 'blocks' : result.outcome === 'dodge' ? 'dodges' : 'misses'] += 1
      if (result.critical) stats.crits += 1

      if (!enemies.some((entry) => entry.currentHp > 0)) break
    }
  }
  const leftHp = leftState.reduce((sum, entry) => sum + Math.max(0, entry.currentHp), 0)
  const rightHp = rightState.reduce((sum, entry) => sum + Math.max(0, entry.currentHp), 0)
  const leftAlive = leftState.some((entry) => entry.currentHp > 0)
  const rightAlive = rightState.some((entry) => entry.currentHp > 0)
  return {
    leftHp,
    result: leftAlive === rightAlive ? 'draw' : leftAlive ? 'left' : 'right',
    rightHp,
    rounds: round,
    stats,
  }
}

function summarizeScenario(random, left, right, iterations) {
  const totals = { blocks: 0, crits: 0, dodges: 0, draws: 0, leftHp: 0, leftWins: 0, rightHp: 0, rightWins: 0, rounds: 0 }
  for (let index = 0; index < iterations; index += 1) {
    const result = simulateEncounter(random, left, right)
    totals.rounds += result.rounds
    totals.leftHp += result.leftHp
    totals.rightHp += result.rightHp
    totals.blocks += result.stats.blocks
    totals.crits += result.stats.crits
    totals.dodges += result.stats.dodges
    if (result.result === 'left') totals.leftWins += 1
    if (result.result === 'right') totals.rightWins += 1
    if (result.result === 'draw') totals.draws += 1
  }
  return {
    averageLeftHp: Number((totals.leftHp / iterations).toFixed(2)),
    averageRightHp: Number((totals.rightHp / iterations).toFixed(2)),
    averageRounds: Number((totals.rounds / iterations).toFixed(2)),
    blockAverage: Number((totals.blocks / iterations).toFixed(2)),
    critAverage: Number((totals.crits / iterations).toFixed(2)),
    drawRate: Number(((totals.draws / iterations) * 100).toFixed(1)),
    dodgeAverage: Number((totals.dodges / iterations).toFixed(2)),
    iterations,
    leftWinRate: Number(((totals.leftWins / iterations) * 100).toFixed(1)),
    rightWinRate: Number(((totals.rightWins / iterations) * 100).toFixed(1)),
  }
}

function makeReferenceFighter(name, modifier = {}) {
  return buildCombatant(
    {
      atributos: { agilidade: 2, forca: 2, intelecto: 1, presenca: 1, vigor: 2 },
      ataques: [{ atributoBase: 'forca', bonusPericia: 5, dano: '1d6', nome: 'Lâmina simples' }],
      combatProfile: { versao: 2 },
      defesa: 16,
      id: `reference-${name}`,
      nome: name,
      notas: '',
      pericias: [
        { atributoBase: 'forca', bonusPericia: 5, id: 'luta', nome: 'Luta', resumo: '' },
        { atributoBase: 'vigor', bonusPericia: 5, id: 'fortitude', nome: 'Fortitude', resumo: '' },
        { atributoBase: 'agilidade', bonusPericia: 5, id: 'reflexos', nome: 'Reflexos', resumo: '' },
      ],
      recursos: { determinacaoAtual: 10, determinacaoMaxima: 10, fushiAtual: 15, fushiMaximo: 15, vidaAtual: 25, vidaMaxima: 25 },
      status: ['Basico'],
      tipo: 'player',
    },
    modifier,
  )
}

function maxAttackTotal(combatant) {
  return 20 + Math.max(0, Number(combatant.attackBonus ?? 0) || 0)
}

function scenarioWarnings(left, right) {
  const warnings = []

  for (const attacker of left) {
    const highestCa = Math.max(...right.map((defender) => defender.ca))
    if (maxAttackTotal(attacker) < highestCa) {
      warnings.push(`${attacker.name} nao alcanca CA ${highestCa} com o ataque base (maximo ${maxAttackTotal(attacker)}).`)
    }
  }

  for (const attacker of right) {
    const highestCa = Math.max(...left.map((defender) => defender.ca))
    if (maxAttackTotal(attacker) < highestCa) {
      warnings.push(`${attacker.name} nao alcanca CA ${highestCa} com o ataque base (maximo ${maxAttackTotal(attacker)}).`)
    }
  }

  return Array.from(new Set(warnings))
}

function renderReport(input) {
  const lines = [
    '# Combat V2 Simulation Report',
    '',
    `Gerado em: ${input.generatedAt}`,
    `Fonte: ${input.sourcePath}`,
    `Iteracoes por cenario: ${input.iterations}`,
    `Seed: ${input.seed}`,
    '',
    '## Escopo',
    '',
    '- Simulador usa CA passiva, Bloqueio por Fortitude, Esquiva fixa em CA + AGI + Reflexos e critico que dobra apenas dados de dano.',
    '- Usa ataques estruturados; onde nao existe ataque, usa golpe desarmado de referencia.',
    '- Nao simula ainda terreno, FUSHI imbuido, Ritual, cura, manobra, IA narrativa ou objetivo de boss.',
    '- Resultado e um termometro de matematica, nunca uma sentenca sobre lore canonica.',
    '',
    '## Auditoria de fichas',
    '',
    '| Ficha | Tipo | Poder | Vida | CA | Bloqueio | Esquiva fixa | Ataque base | Media | Aviso |',
    '| --- | --- | --- | ---: | ---: | ---: | --- | --- | ---: | --- |',
  ]
  input.audit.forEach((row) => {
    lines.push(`| ${row.name} | ${row.type} | ${row.power} | ${row.hp} | ${row.ca} | ${row.block} | ${row.dodge} | ${row.attack} | ${row.damageAverage} | ${row.warning || '-'} |`)
  })
  lines.push('', '## Cenários', '')
  input.scenarios.forEach((scenario) => {
    const summary = scenario.summary
    lines.push(`### ${scenario.name}`)
    lines.push('')
    lines.push(`- Lado A vence: ${summary.leftWinRate}% | Lado B vence: ${summary.rightWinRate}%`)
    lines.push(`- Empates tecnicos no limite de rodadas: ${summary.drawRate}%`)
    lines.push(`- Rodadas medias: ${summary.averageRounds} | HP final A/B: ${summary.averageLeftHp}/${summary.averageRightHp}`)
    lines.push(`- Esquivas medias: ${summary.dodgeAverage} | Bloqueios medios: ${summary.blockAverage} | Criticos medios: ${summary.critAverage}`)
    scenario.warnings.forEach((warning) => lines.push(`- Alerta de ficha: ${warning}`))
    lines.push('')
  })
  return `${lines.join('\n')}\n`
}

function main() {
  const snapshot = readWorkspaceState({ autosavePath, projectRoot, workspacePath })
  if (!snapshot.workspace) throw new Error(`Workspace ausente: ${snapshot.sourcePath}`)
  const iterations = Math.max(50, Math.min(5000, Number(getArg('iterations', DEFAULT_ITERATIONS)) || DEFAULT_ITERATIONS))
  const seed = Number(getArg('seed', 20260711)) || 20260711
  const random = makeRandom(seed)
  const combatants = getCharacters(snapshot.workspace)
    .filter((character) => normalize(character.nome) !== 'teste')
    .map((character) => buildCombatant(character))
  const byName = (name) => combatants.find((entry) => normalize(entry.name) === normalize(name))
  const audit = combatants
    .map((entry) => ({
      attack: `${entry.attack.nome} (${entry.attack.dano})`,
      block: entry.block,
      ca: entry.ca,
      damageAverage: Number(formulaAverage(entry.attack.dano).toFixed(2)),
      dodge: entry.dodge ?? '-',
      hp: entry.hp,
      name: entry.name,
      power: entry.power,
      type: entry.type,
      warning: entry.character.ataques?.length ? '' : 'Sem ataque estruturado; usa referencia.',
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
  const scenarios = []
  const grayWolf = byName('Lobo Cinzento')
  const markedWolf = byName('Lobo Marcado por FUSHI')
  const veyra = byName('Veyra')
  const liryssa = byName('Liryssa')
  const reference = makeReferenceFighter('Referência Básica')
  const tank = makeReferenceFighter('Tank Comum', { damageBonus: -3, lifeBonus: 7 })
  const assassin = makeReferenceFighter('Assassino Comum', { damageBonus: 3, lifeBonus: -7 })
  const addScenario = (name, left, right) => {
    if (left.length && right.length) {
      const summary = summarizeScenario(random, left, right, iterations)
      const warnings = scenarioWarnings(left, right)
      if (summary.drawRate >= 95) {
        warnings.push('Impasse tatico: pelo menos 95% das iteracoes chegaram ao limite de rodadas sem vencedor.')
      }
      scenarios.push({
        name,
        summary,
        warnings,
      })
    }
  }
  if (grayWolf) addScenario('Referência Básica vs Lobo Cinzento', [reference], [grayWolf])
  if (grayWolf) addScenario('Tank Comum vs Lobo Cinzento', [tank], [grayWolf])
  if (grayWolf) addScenario('Assassino Comum vs Lobo Cinzento', [assassin], [grayWolf])
  if (grayWolf && markedWolf) addScenario('Grupo de 5 Básicos vs 2 Lobos + 1 Marcado', Array.from({ length: 5 }, (_, index) => makeReferenceFighter(`Básico ${index + 1}`)), [grayWolf, grayWolf, markedWolf])
  if (veyra && liryssa) addScenario('Veyra vs Liryssa', [veyra], [liryssa])
  const output = {
    audit,
    generatedAt: new Date().toISOString(),
    iterations,
    scenarios,
    seed,
    sourcePath: snapshot.sourcePath,
  }
  fs.mkdirSync(outputDirectory, { recursive: true })
  fs.writeFileSync(resultsPath, `${JSON.stringify(output, null, 2)}\n`)
  fs.writeFileSync(reportPath, renderReport(output))
  console.log(JSON.stringify({ audit: audit.length, reportPath, resultsPath, scenarios: scenarios.length }, null, 2))
}

main()
