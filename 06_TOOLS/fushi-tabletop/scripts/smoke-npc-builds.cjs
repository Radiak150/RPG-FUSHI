const fs = require('node:fs')
const path = require('node:path')
const {
  BUILD_MODIFIER_KEYS,
  evaluateBuildItem,
  evaluateBuildSet,
  readBuildCatalog,
} = require('./lib/fushi-build-system.cjs')
const { getCombatV2Block, getCombatV2Dodge } = require('./lib/combat-v2.cjs')
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
} = require('./lib/fushi-workspace-io.cjs')

const root = process.cwd()
const assignmentPath = path.join(root, 'docs', 'fushi-system', 'NPC_BUILD_ASSIGNMENTS.json')
const workspacePath = process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath()
const autosavePath = process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(root)

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function getCharacters(workspace) {
  if (Array.isArray(workspace.characters)) return workspace.characters
  if (Array.isArray(workspace.characters?.items)) return workspace.characters.items
  return []
}

function expectedResource(resources, maximumKey, delta) {
  return Math.max(1, Number(resources[maximumKey] ?? 0) + Number(delta ?? 0))
}

function assertBalancedDistribution(distribution) {
  const counts = Object.values(distribution).sort((left, right) => left - right)
  assert(Object.keys(distribution).length === 6, 'Distribuicao nao cobre os 6 arquetipos')
  assert(counts.at(-1) - counts[0] <= 1, `Distribuicao desigual: ${counts.join('/')}`)
}

function auditCanonicalAssignments(catalog, assignments) {
  assert(assignments.mode === 'applied', `Registro nao aplicado: ${assignments.mode}`)
  assert(assignments.catalogVersion === 2, `Registro nao usa catalogo v2: ${assignments.catalogVersion}`)
  assert(assignments.records.length === 41, `Esperado 41 NPCs canonicos: ${assignments.records.length}`)

  const characterIds = new Set()
  const distribution = {}
  for (const record of assignments.records) {
    assert(!characterIds.has(record.characterId), `${record.name}: id duplicado`)
    characterIds.add(record.characterId)
    assert(record.items?.length === 8, `${record.name}: esperado conjunto canonico 8/8`)
    assert(new Set(record.items.map((item) => item.biomeId)).size === 8, `${record.name}: biomas repetidos`)

    const totals = Object.fromEntries(BUILD_MODIFIER_KEYS.map((key) => [key, 0]))
    for (const entry of record.items) {
      const source = catalog.items.find((item) => item.id === entry.catalogItemId)
      assert(source, `${record.name}: item inexistente ${entry.catalogItemId}`)
      const evaluated = evaluateBuildItem(catalog, source, entry.potency)
      assert(evaluated.archetype === record.archetype, `${record.name}: arquetipo divergente`)
      assert(JSON.stringify(evaluated.modifiers) === JSON.stringify(entry.modifiers), `${record.name}: modificadores divergentes em ${entry.catalogItemId}`)
      for (const key of BUILD_MODIFIER_KEYS) totals[key] += Number(evaluated.modifiers[key] ?? 0)
    }

    if (record.affinity?.stat) totals[record.affinity.stat] += Number(record.affinity.bonus ?? 0)
    assert(JSON.stringify(totals) === JSON.stringify(record.totals), `${record.name}: totais canonicos divergentes`)
    distribution[record.archetype] = (distribution[record.archetype] ?? 0) + 1
  }

  assertBalancedDistribution(distribution)
  console.log('[npc-builds-smoke] PASS canonico: 41 NPCs, conjunto 8/8 e totais do catalogo consistentes')
  console.log(`  distribuicao: ${JSON.stringify(distribution)}`)
}

function auditLiveWorkspace(catalog, assignments) {
  const snapshot = readWorkspaceState({ autosavePath, projectRoot: root, workspacePath })
  const npcs = getCharacters(snapshot.workspace).filter((character) => character.tipo === 'npc')
  assert(assignments.mode === 'applied', `Registro nao aplicado: ${assignments.mode}`)
  assert(assignments.catalogVersion === 2, `Registro nao usa catalogo v2: ${assignments.catalogVersion}`)
  assert(npcs.length === 41, `Esperado 41 NPCs: ${npcs.length}`)
  const records = new Map(assignments.records.map((record) => [record.characterId, record]))
  const distribution = {}

  for (const npc of npcs) {
    const record = records.get(npc.id)
    const build = npc.combatProfile?.build
    assert(record, `${npc.nome}: registro ausente`)
    assert(build?.version === 2, `${npc.nome}: build v2 ausente`)
    assert(build.items?.length === 8, `${npc.nome}: esperado conjunto 8/8`)
    assert(build.item === undefined, `${npc.nome}: item legado ainda gravado`)
    const expectedItems = build.items.map((entry) => {
      const source = catalog.items.find((item) => item.id === entry.catalogItemId)
      assert(source, `${npc.nome}: item inexistente ${entry.catalogItemId}`)
      return evaluateBuildItem(catalog, source, entry.potency)
    })
    const expected = evaluateBuildSet(catalog, expectedItems, npc.atributos, build.archetype)
    assert(JSON.stringify(build.totals) === JSON.stringify(expected.totals), `${npc.nome}: totais divergentes`)
    assert(npc.recursos.vidaMaxima === expectedResource(build.baseline.recursos, 'vidaMaxima', build.totals.life), `${npc.nome}: Vida incorreta`)
    assert(npc.recursos.fushiMaximo === expectedResource(build.baseline.recursos, 'fushiMaximo', build.totals.fushi), `${npc.nome}: FUSHI incorreto`)
    assert(npc.recursos.determinacaoMaxima === expectedResource(build.baseline.recursos, 'determinacaoMaxima', build.totals.determination), `${npc.nome}: Determinacao incorreta`)
    assert(npc.defesa === Math.max(1, build.baseline.defesa + build.totals.ca), `${npc.nome}: CA incorreta`)
    assert(npc.bloqueio === getCombatV2Block(npc), `${npc.nome}: Bloqueio incorreto`)
    assert(npc.esquiva === getCombatV2Dodge(npc), `${npc.nome}: Esquiva incorreta`)
    distribution[build.archetype] = (distribution[build.archetype] ?? 0) + 1
  }

  assertBalancedDistribution(distribution)
  console.log(`[npc-builds-smoke] PASS live: ${snapshot.sourcePath}`)
  console.log('  41 NPCs, conjunto 8/8, CA/Bloqueio/Esquiva derivados')
  console.log(`  distribuicao: ${JSON.stringify(distribution)}`)
}

function main() {
  const catalog = readBuildCatalog(root)
  const assignments = JSON.parse(fs.readFileSync(assignmentPath, 'utf8'))
  if (process.argv.includes('--live')) {
    auditLiveWorkspace(catalog, assignments)
    return
  }
  auditCanonicalAssignments(catalog, assignments)
}

main()
