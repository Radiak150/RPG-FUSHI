const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function assertUnique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} possui IDs repetidos`)
}

function assertHistory(history, audience) {
  assert.equal(history.audience, audience)
  assert.ok(history.title)
  assert.ok(Array.isArray(history.quickReference) && history.quickReference.length >= 4)
  assert.ok(Array.isArray(history.sections) && history.sections.length >= 5)
  assertUnique(history.sections.map((section) => section.id), `${audience} history`)

  for (const section of history.sections) {
    assert.ok(section.id && section.number && section.label, 'seção de História incompleta')
    assert.ok(['canon', 'playtest', 'development'].includes(section.status))
    assert.ok(Array.isArray(section.blocks), `blocos ausentes em ${section.id}`)
  }
}

const playerHistory = readJson('src/data/history/player-history.json')
const masterHistory = readJson('src/data/history/master-history.json')
assertHistory(playerHistory, 'player')
assertHistory(masterHistory, 'master')

const playerSectionIds = new Set(playerHistory.sections.map((section) => section.id))
for (const required of ['despertar', 'clareira', 'vila', 'riacho', 'mapa-mundi', 'estado-atual']) {
  assert.ok(playerSectionIds.has(required), `Crônicas públicas sem ${required}`)
}
assert.ok(
  normalize(JSON.stringify(playerHistory)).includes(normalize('Sessão 4 ainda não possui um resumo')),
  'Crônicas públicas precisam registrar o limite da Sessão 4',
)

const publicForbidden = [
  'reencarnação',
  'transposição de consciência',
  'progressão oculta',
  'disputa de posse',
  'esporos de fushi',
  'organismo alienígena',
  'matrizes humanas',
  'metaplot',
  'ryoku',
  'vhazaryon',
  'seraph',
  'natureza dos protagonistas',
]
const publicHistoryText = normalize(JSON.stringify(playerHistory))
for (const term of publicForbidden) {
  assert.ok(!publicHistoryText.includes(normalize(term)), `segredo vazou nas Crônicas: ${term}`)
}

const masterHistoryText = normalize(JSON.stringify(masterHistory))
for (const term of ['organismo alienígena', 'matrizes humanas', 'metaplot']) {
  assert.ok(masterHistoryText.includes(normalize(term)), `Livro do Mestre sem bloco esperado: ${term}`)
}
assert.ok(masterHistoryText.includes(normalize('Sessão 4')))
assert.ok(masterHistoryText.includes(normalize('resumo canônico consolidado')))

const sourceReferences = [
  'docs/SESSION_1_ACTUAL_LOG_2026-05-31.md',
  'docs/planejamento/SESSION_2_ACTUAL_LOG_2026-07-09.md',
  'docs/planejamento/PLANICIE_SESSAO_03_RESULTADO_2026-07-18.md',
  'docs/planejamento/LORE_COMPILADO_CONTEXTO.md',
]
for (const source of sourceReferences) {
  assert.ok(fs.existsSync(path.join(ROOT, source)), `fonte de História ausente: ${source}`)
}

const vfxCatalog = readJson('src/data/vfx/catalog.json')
assert.equal(vfxCatalog.length, 10, 'catálogo VFX deve começar com 10 presets auditados')
assertUnique(vfxCatalog.map((preset) => preset.id), 'catálogo VFX')
for (const preset of vfxCatalog) {
  assert.ok(preset.id && preset.label && preset.description)
  assert.ok(['ambiente', 'energia', 'impacto', 'transicao'].includes(preset.category))
  assert.ok(['map', 'token'].includes(preset.scope))
  assert.equal(preset.status, 'ready')
  assert.match(preset.color, /^#[0-9a-f]{6}$/i)
  assert.ok(preset.durationMs >= 500 && preset.durationMs <= 5000)
  assert.ok(preset.variant)
}

const tablePage = read('src/pages/TablePage.tsx')
const sessionSource = read('src/lib/tabletopSession.ts')
const historyPage = read('src/pages/HistoryPage.tsx')
const appSource = read('src/app/App.tsx')
const cssSource = read('src/styles/globals.css')
assert.ok(appSource.includes("path=\"historia\""), 'rota de História ausente')
assert.ok(historyPage.includes('data-testid="history-page"'))
assert.ok(tablePage.includes('HistoryQuickReference'))
assert.ok(tablePage.includes('TabletopVfxLibrary'))
assert.ok(tablePage.includes("type: 'vfx'"))
assert.ok(sessionSource.includes("| 'vfx'"))
assert.ok(sessionSource.includes('vfxExpiresAt'))
assert.ok(sessionSource.includes('value.type === \'vfx\''))
assert.ok(tablePage.includes("currentEvent.type !== 'vfx'"))
assert.ok(tablePage.includes('vfxExpiresAt: getRuntimeTimestamp()'))
for (const preset of vfxCatalog) {
  assert.ok(
    cssSource.includes(`tabletop-vfx-presentation--${preset.variant}`),
    `variante CSS ausente: ${preset.variant}`,
  )
}

console.log(`OK history-vfx: ${playerHistory.sections.length} seções públicas, ${masterHistory.sections.length} seções do Mestre, ${vfxCatalog.length} VFX`)
