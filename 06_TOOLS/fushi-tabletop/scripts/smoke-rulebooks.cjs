const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')

function fail(message) {
  throw new Error(`[rulebooks] ${message}`)
}

function assert(condition, message) {
  if (!condition) fail(message)
}

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath)
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'))
}

function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function validateBlock(block, sectionId, blockIndex) {
  const location = `${sectionId}.blocks[${blockIndex}]`
  assert(block && typeof block === 'object', `${location} precisa ser um objeto`)
  assert(typeof block.kind === 'string' && block.kind.length > 0, `${location} sem kind`)

  if (block.kind === 'table' || block.table) {
    assert(block.table && Array.isArray(block.table.columns), `${location} sem colunas`)
    assert(block.table.columns.length > 0, `${location} com tabela sem colunas`)
    assert(Array.isArray(block.table.rows), `${location} sem linhas`)

    block.table.rows.forEach((row, rowIndex) => {
      assert(
        Array.isArray(row) && row.length === block.table.columns.length,
        `${location}.table.rows[${rowIndex}] tem ${row?.length ?? 0} celulas para ${block.table.columns.length} colunas`,
      )
    })
    return
  }

  const hasContent =
    (typeof block.text === 'string' && block.text.trim().length > 0) ||
    (typeof block.formula === 'string' && block.formula.trim().length > 0) ||
    (Array.isArray(block.items) && block.items.length > 0)

  assert(hasContent, `${location} sem conteudo`)

  if (Array.isArray(block.items)) {
    block.items.forEach((item, itemIndex) => {
      assert(typeof item === 'string' && item.trim().length > 0, `${location}.items[${itemIndex}] vazio`)
    })
  }
}

function validateBook(book, expectedAudience) {
  assert(book.audience === expectedAudience, `audiencia esperada ${expectedAudience}`)
  assert(typeof book.title === 'string' && book.title.trim().length > 0, `${expectedAudience}: titulo ausente`)
  assert(Array.isArray(book.sections) && book.sections.length > 0, `${expectedAudience}: sem capitulos`)
  assert(Array.isArray(book.quickReference), `${expectedAudience}: referencia rapida ausente`)

  const ids = new Set()
  book.sections.forEach((section, sectionIndex) => {
    assert(typeof section.id === 'string' && section.id.trim().length > 0, `${expectedAudience}: capitulo ${sectionIndex} sem id`)
    assert(!ids.has(section.id), `${expectedAudience}: id duplicado ${section.id}`)
    ids.add(section.id)

    assert(typeof section.label === 'string' && section.label.trim().length > 0, `${section.id}: titulo ausente`)
    assert(typeof section.summary === 'string' && section.summary.trim().length > 0, `${section.id}: resumo ausente`)
    assert(Array.isArray(section.blocks) && section.blocks.length > 0, `${section.id}: sem blocos`)
    assert(['canon', 'playtest', 'development'].includes(section.status), `${section.id}: status invalido`)
    section.blocks.forEach((block, blockIndex) => validateBlock(block, section.id, blockIndex))
  })

  book.quickReference.forEach((entry, entryIndex) => {
    assert(ids.has(entry.sectionId), `${expectedAudience}: atalho ${entryIndex} aponta para ${entry.sectionId}`)
    assert(typeof entry.label === 'string' && entry.label.trim().length > 0, `${expectedAudience}: atalho ${entryIndex} sem titulo`)
    assert(typeof entry.detail === 'string' && entry.detail.trim().length > 0, `${expectedAudience}: atalho ${entryIndex} sem detalhe`)
  })

  return ids
}

const player = readJson('src/data/rulebook/player-rulebook.json')
const master = readJson('src/data/rulebook/master-rulebook.json')
const bibliography = readJson('src/data/rulebook/bibliography.json')

const requiredFontFiles = [
  'src/assets/fonts/fushi/Manrope-Regular.ttf',
  'src/assets/fonts/fushi/Manrope-Bold.ttf',
  'src/assets/fonts/fushi/Cinzel-SemiBold.ttf',
  'src/assets/fonts/fushi/Cinzel-Bold.ttf',
  'src/assets/fonts/fushi/Orbitron-SemiBold.ttf',
  'src/assets/fonts/fushi/Orbitron-Bold.ttf',
  'src/assets/fonts/fushi/licenses/Manrope-OFL.txt',
  'src/assets/fonts/fushi/licenses/Cinzel-OFL.txt',
  'src/assets/fonts/fushi/licenses/Orbitron-OFL.txt',
]

requiredFontFiles.forEach((relativePath) => {
  const absolutePath = path.join(root, relativePath)
  assert(fs.existsSync(absolutePath), `fonte/licenca ausente: ${relativePath}`)
  assert(fs.statSync(absolutePath).size > 1_000, `fonte/licenca vazia: ${relativePath}`)
})

const playerIds = validateBook(player, 'player')
const masterIds = validateBook(master, 'master')

for (const required of ['testes', 'turno', 'ataques', 'coreografia', 'defesas', 'manobras', 'recursos', 'fushi', 'builds', 'niveis-poder']) {
  assert(playerIds.has(required), `Livro do Jogador sem capitulo obrigatorio: ${required}`)
}

for (const required of ['escudo', 'morte', 'reencarnacao', 'progressao', 'itens-builds', 'rituais', 'bosses', 'compendio', 'bibliografia']) {
  assert(masterIds.has(required), `Livro do Mestre sem capitulo obrigatorio: ${required}`)
}

const playerRaw = normalize(JSON.stringify(player))
const forbiddenPlayerFragments = [
  'reencarn',
  'novo corpo',
  'corpo receptor',
  'receptaculo',
  'identidade original',
  'falha total',
  'arquivo confidencial',
  '48 matrizes',
  '6 em cada bioma',
  '8 de cada arquetipo',
  '1-2 comum',
  '3-4 raro',
  '5-6 epico',
  '7-9 lendario',
]

for (const fragment of forbiddenPlayerFragments) {
  assert(!playerRaw.includes(fragment), `segredo vazou no Livro do Jogador: ${fragment}`)
}

const playerSecretBlocks = player.sections.flatMap((section) => section.blocks).filter((block) => block.kind === 'secret' || block.tone === 'secret')
assert(playerSecretBlocks.length <= 1, 'Livro do Jogador contem mais de um bloco com apresentacao secreta')
playerSecretBlocks.forEach((block) => {
  assert(normalize(block.title) === 'descubra mais', 'Livro do Jogador contem bloco secreto diferente do teaser publico')
})

const masterSecretBlocks = master.sections.flatMap((section) => section.blocks).filter((block) => block.kind === 'secret' || block.tone === 'secret')
assert(masterSecretBlocks.length > 0, 'Livro do Mestre perdeu os blocos secretos')

const masterRaw = normalize(JSON.stringify(master))
for (const required of [
  'catalogo oficial: 48 matrizes padrao',
  'comum',
  'raro',
  'epico',
  'lendario',
  'mitico',
  'itens secretos de correcao de raridade',
  'bui: absorver e corrigir uma build',
  'fushi por dano generico nao esta aprovado',
  'agro: procedimento do mestre',
]) {
  assert(masterRaw.includes(required), `Livro do Mestre perdeu regra operacional: ${required}`)
}

assert(Array.isArray(bibliography) && bibliography.length > 0, 'bibliografia vazia')
bibliography.forEach((entry, index) => {
  assert(typeof entry.title === 'string' && entry.title.trim().length > 0, `bibliografia[${index}] sem titulo`)
  assert(['canon', 'campaign', 'design-reference'].includes(entry.type), `bibliografia[${index}] com tipo invalido`)
})

console.log('[rulebooks] PASS')
console.log(`  jogador: ${player.sections.length} capitulos, ${player.quickReference.length} atalhos`)
console.log(`  mestre: ${master.sections.length} capitulos, ${master.quickReference.length} atalhos`)
console.log(`  bibliografia: ${bibliography.length} entradas`)
console.log('  tipografia: Manrope, Cinzel e Orbitron locais com licencas OFL')
console.log('  sigilo: nenhum termo proibido encontrado no Livro do Jogador')
