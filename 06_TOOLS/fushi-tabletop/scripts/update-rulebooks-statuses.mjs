import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const catalogPath = path.join(root, 'src', 'data', 'statusCatalog.ts')
const playerPath = path.join(
  root,
  'src',
  'data',
  'rulebook',
  'player-rulebook.json',
)
const masterPath = path.join(
  root,
  'src',
  'data',
  'rulebook',
  'master-rulebook.json',
)

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function readLiteral(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text
  }
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(readLiteral)
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(
      node.properties
        .filter(ts.isPropertyAssignment)
        .map((property) => {
          const name = ts.isIdentifier(property.name)
            ? property.name.text
            : ts.isStringLiteral(property.name)
              ? property.name.text
              : ''
          return [name, readLiteral(property.initializer)]
        })
        .filter(([name]) => Boolean(name)),
    )
  }
  return undefined
}

function loadCatalog() {
  const sourceFile = ts.createSourceFile(
    catalogPath,
    fs.readFileSync(catalogPath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  let catalog = null

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'TABLETOP_STATUS_CATALOG' &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      catalog = readLiteral(node.initializer)
      return
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  if (!Array.isArray(catalog) || catalog.length !== 24) {
    throw new Error(
      `Catalogo de estados inesperado: ${Array.isArray(catalog) ? catalog.length : 0}.`,
    )
  }
  return catalog
}

function buildStatusTable(title, statuses) {
  return {
    kind: 'table',
    title,
    table: {
      columns: ['Estado', 'Efeito', 'Causa', 'Como encerrar'],
      rows: statuses.map((status) => [
        status.label,
        status.effect,
        status.cause,
        status.recovery,
      ]),
    },
  }
}

function replaceBlocks(section, removedTitles, nextBlocks) {
  const normalizedTitles = new Set([...removedTitles].map(normalize))
  section.blocks = [
    ...section.blocks.filter(
      (block) => !normalizedTitles.has(normalize(block.title)),
    ),
    ...nextBlocks,
  ]
}

function updatePlayerBook(book, catalog) {
  const section = book.sections.find((candidate) => candidate.id === 'recursos')
  if (!section) throw new Error('Secao publica de recursos nao encontrada.')

  const zeroStateTable = section.blocks.find(
    (block) => normalize(block.title) === 'os tres estados de zero',
  )
  if (zeroStateTable?.table?.rows) {
    zeroStateTable.table.rows = [
      ['Vida', 'Desmaiado', 'Nada; inicia o teste contra a morte'],
      [
        'FUSHI',
        'Exausto',
        'Perceber, pensar e falar brevemente, sem agir ou se mover',
      ],
      [
        'Determinacao',
        'Descontrolado',
        'O Mestre conduz as acoes ate alguma recuperacao',
      ],
    ]
  }

  const zeroLifeRule = section.blocks.find(
    (block) => normalize(block.title) === 'queda a 0 vida',
  )
  if (Array.isArray(zeroLifeRule?.items)) {
    zeroLifeRule.items = [
      'Voce desmaia imediatamente e nao fala, move, reage ou mantem concentracao.',
      'O Mestre conduz ate tres tentativas de estabilizacao.',
      'Um aliado pode usar Acao Principal e Medicina, item ou Habilidade apropriada para ajudar.',
      'Tres sucessos recuperam 1 Vida, mas o personagem continua Desmaiado.',
      'Chegar a 2 Vida encerra Desmaiado e permite acordar, conforme a cena.',
      'Tres falhas significam morte; as consequencias seguintes pertencem a conducao do Mestre.',
    ]
  }

  replaceBlocks(
    section,
    new Set([
      'Condicoes publicas frequentes',
      'Condicoes dizem como terminam',
      'Estados canonicos - debuffs e condicoes',
      'Estados canonicos - buffs',
    ]),
    [
      buildStatusTable(
        'Estados canonicos - debuffs e condicoes',
        catalog.filter((status) => status.kind !== 'buff'),
      ),
      buildStatusTable(
        'Estados canonicos - buffs',
        catalog.filter((status) => status.kind === 'buff'),
      ),
      {
        kind: 'warning',
        tone: 'warning',
        title: 'Todo estado informa como termina',
        text: 'A ficha mostra origem, duracao, acumulos e forma de encerramento. O personagem que criou uma marca Especial pode cancelar apenas essa marca; estados comuns sao encerrados pelo Mestre conforme a regra.',
      },
    ],
  )
}

function updateMasterBook(book, catalog) {
  const section = book.sections.find((candidate) => candidate.id === 'condicoes')
  if (!section) throw new Error('Secao do Mestre de condicoes nao encontrada.')

  replaceBlocks(
    section,
    new Set([
      'Condicoes leves',
      'Condicoes graves',
      'Estados canonicos - debuffs e condicoes',
      'Estados canonicos - buffs',
    ]),
    [
      buildStatusTable(
        'Estados canonicos - debuffs e condicoes',
        catalog.filter((status) => status.kind !== 'buff'),
      ),
      buildStatusTable(
        'Estados canonicos - buffs',
        catalog.filter((status) => status.kind === 'buff'),
      ),
      {
        kind: 'rule',
        tone: 'rule',
        title: 'Operacao na mesa',
        items: [
          'Use o painel BUF para aplicar, acompanhar e encerrar estados da cena.',
          'Registre origem, alvo, duracao, acumulos e qualquer DT propria da habilidade.',
          'O Mestre pode remover qualquer estado. A fonte so pode cancelar uma marca Especial explicitamente cancelavel.',
          'Vacina remove os demais estados do alvo e impede novos estados enquanto durar.',
          'Palavra parecida em uma habilidade nao vira automacao sem revisao da regra.',
        ],
      },
    ],
  )
}

const catalog = loadCatalog()
const playerBook = JSON.parse(fs.readFileSync(playerPath, 'utf8'))
const masterBook = JSON.parse(fs.readFileSync(masterPath, 'utf8'))

updatePlayerBook(playerBook, catalog)
updateMasterBook(masterBook, catalog)

fs.writeFileSync(playerPath, `${JSON.stringify(playerBook, null, 2)}\n`)
fs.writeFileSync(masterPath, `${JSON.stringify(masterBook, null, 2)}\n`)

console.log(`[rulebooks-statuses] ${catalog.length} estados canonicos sincronizados.`)
