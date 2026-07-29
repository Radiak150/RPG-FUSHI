const childProcess = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const {
  getAttributeRollContract,
  getCombatV2Block,
  getCombatV2Dodge,
} = require('./lib/combat-v2.cjs')
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
} = require('./lib/fushi-workspace-io.cjs')

const root = path.resolve(__dirname, '..')
const outputDirectory = path.join(root, 'docs', 'fushi-system')

function fail(message) {
  throw new Error(`[combat-v2] ${message}`)
}

function assert(condition, message) {
  if (!condition) fail(message)
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getCharacters(workspace) {
  if (Array.isArray(workspace?.characters)) return workspace.characters
  if (Array.isArray(workspace?.characters?.items)) return workspace.characters.items
  return []
}

function findCharacter(characters, name) {
  return characters.find((character) => normalize(character.nome) === normalize(name))
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'))
}

function hasNamedFeature(features, name) {
  return (features ?? []).some((feature) => normalize(feature.nome).includes(normalize(name)))
}

function runSimulator() {
  const result = childProcess.spawnSync(process.execPath, ['scripts/simulate-combat-v2.cjs', '--iterations=120'], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  })

  assert(result.status === 0, `simulador falhou: ${(result.stderr || result.stdout || '').trim()}`)
}

function main() {
  const snapshot = readWorkspaceState({
    autosavePath: process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(root),
    projectRoot: root,
    workspacePath: process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath(),
  })
  assert(snapshot.workspace, `workspace real ausente: ${snapshot.sourcePath}`)

  const characters = getCharacters(snapshot.workspace)
  assert(characters.length >= 50, `workspace incompleto: ${characters.length} fichas`)

  for (const character of characters) {
    assert(character.combatProfile?.versao === 2, `${character.nome}: perfil Combat V2 ausente`)
    assert(
      Number(character.esquiva ?? 0) === (getCombatV2Dodge(character) ?? 0),
      `${character.nome}: Esquiva diverge de CA + AGI + Reflexos`,
    )
    assert(
      Number(character.bloqueio ?? 0) === getCombatV2Block(character),
      `${character.nome}: Bloqueio diverge de Fortitude`,
    )
  }

  const grayWolf = findCharacter(characters, 'Lobo Cinzento')
  const markedWolf = findCharacter(characters, 'Lobo Marcado por FUSHI')
  const liryssa = findCharacter(characters, 'Liryssa')
  const veyra = findCharacter(characters, 'Veyra')
  const davi = findCharacter(characters, 'Davi')

  assert(davi, 'ficha real de Davi ausente')
  assert(Number(davi.atributos?.forca ?? -1) === 0, 'Davi perdeu FOR 0 de referencia')
  assert(Number(davi.atributos?.agilidade ?? -1) === 2, 'Davi perdeu AGI 2 de referencia')
  assert(
    JSON.stringify(getAttributeRollContract(davi.atributos.forca, 0)) ===
      JSON.stringify({ bonus: 0, mode: 'lowest', quantity: 2, sides: 20 }),
    'FOR 0 precisa rolar 2d20 e manter o menor',
  )
  assert(
    JSON.stringify(getAttributeRollContract(1, 5)) ===
      JSON.stringify({ bonus: 5, mode: 'highest', quantity: 1, sides: 20 }),
    'atributo 1 precisa rolar 1d20',
  )
  assert(
    JSON.stringify(getAttributeRollContract(davi.atributos.agilidade, 5)) ===
      JSON.stringify({ bonus: 5, mode: 'highest', quantity: 2, sides: 20 }),
    'AGI 2 precisa rolar 2d20 e manter o maior',
  )

  assert(grayWolf?.recursos?.vidaMaxima === 8, 'Lobo Cinzento precisa ter 8 Vida')
  assert(grayWolf?.combatProfile?.papelBuild === 'minion', 'Lobo Cinzento precisa ser Minion')
  assert(grayWolf?.ataques?.[0]?.automation?.combat?.dano?.formula === '1d6', 'Mordida do Lobo Cinzento precisa ser estruturada')
  assert(markedWolf?.recursos?.vidaMaxima === 14, 'Lobo Marcado precisa ter 14 Vida')
  assert(markedWolf?.combatProfile?.papelBuild === 'elite-minion', 'Lobo Marcado precisa ser Elite Minion')
  assert(markedWolf?.ataques?.[0]?.automation?.combat?.dano?.formula === '1d6 + 1', 'Mordida Instavel precisa ser estruturada')

  const signalPistol = liryssa?.ataques?.find((attack) => normalize(attack.nome).includes('pistola de sinalizacao'))
  assert(signalPistol?.automation?.combat?.dano?.formula === '1d8', 'Liryssa perdeu a Pistola de Sinalizacao estruturada')
  assert(!hasNamedFeature(liryssa?.habilidadesDetalhadas, 'Comando da Capita'), 'Liryssa manteve habilidade solta apos fusao')
  assert(hasNamedFeature(liryssa?.rituais, 'Capitulo Final'), 'Liryssa perdeu o Ritual integrado')

  assert(!hasNamedFeature(veyra?.habilidadesDetalhadas, 'Resultado'), 'Veyra manteve habilidade solta apos fusao')
  assert(hasNamedFeature(veyra?.rituais, 'Tudo ou Nada'), 'Veyra perdeu o Ritual integrado')

  const canonPath = path.join(outputDirectory, 'FUSHI_COMBAT_V2.md')
  const migrationPath = path.join(outputDirectory, 'COMBAT_V2_MIGRATION_APPLIED_2026-07-11.md')
  assert(fs.existsSync(canonPath), 'documento canonico Combat V2 ausente')
  assert(fs.existsSync(migrationPath), 'evidencia da migracao real ausente')
  const canon = fs.readFileSync(canonPath, 'utf8')
  assert(/Fortitude/i.test(canon) && /Esquiva/i.test(canon) && /Crit/i.test(canon), 'documento canonico incompleto')

  const playerBook = readJson('src/data/rulebook/player-rulebook.json')
  const masterBook = readJson('src/data/rulebook/master-rulebook.json')
  const playerDefense = playerBook.sections.find((section) => section.id === 'defesas')
  const masterShield = masterBook.sections.find((section) => section.id === 'escudo')
  assert(JSON.stringify(playerDefense).includes('Fortitude'), 'Livro do Jogador nao recebeu defesa V2')
  assert(JSON.stringify(masterShield).includes('Bloqueio'), 'Livro do Mestre nao recebeu defesa V2')

  runSimulator()
  const results = readJson('docs/fushi-system/COMBAT_V2_SIMULATION_RESULTS.json')
  assert(Array.isArray(results.scenarios) && results.scenarios.length >= 5, 'simulador nao gerou os cenarios base')
  const veyraScenario = results.scenarios.find((scenario) => normalize(scenario.name).includes('veyra vs liryssa'))
  assert(veyraScenario, 'cenario Veyra vs Liryssa ausente')
  assert(
    veyraScenario.warnings.some((warning) => normalize(warning).includes('impasse tatico')),
    'simulador nao sinalizou o impasse tatico atual de Veyra e Liryssa',
  )

  console.log('[combat-v2] PASS')
  console.log(`  workspace: ${snapshot.sourcePath}`)
  console.log(`  fichas Combat V2: ${characters.length}`)
  console.log(`  cenarios simulados: ${results.scenarios.length}`)
  console.log('  contratos: defesa, lobos, Liryssa, Veyra, livros e alerta real de impasse')
}

main()
