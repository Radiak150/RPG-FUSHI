import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
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

function upsertSection(book, section, afterId) {
  const existingIndex = book.sections.findIndex(
    (candidate) => candidate.id === section.id,
  )

  if (existingIndex >= 0) {
    book.sections[existingIndex] = section
    return
  }

  const afterIndex = book.sections.findIndex(
    (candidate) => candidate.id === afterId,
  )
  book.sections.splice(afterIndex >= 0 ? afterIndex + 1 : book.sections.length, 0, section)
}

const playerSection = {
  id: 'inventario-carga',
  number: '05B',
  label: 'Inventário, porte e mochila',
  summary: 'Quanto cada personagem carrega e como a carga altera o deslocamento.',
  status: 'canon',
  tags: ['inventário', 'porte', 'mochila', 'deslocamento'],
  searchTerms: [
    'pequeno',
    'médio',
    'grande',
    'grande+',
    'mochila+',
    'carga',
  ],
  blocks: [
    {
      kind: 'table',
      tone: 'rule',
      title: 'Conversão de porte',
      table: {
        columns: ['Porte', 'Espaço ocupado', 'Referência visual'],
        rows: [
          ['Pequeno', '3 pequenos = 1 médio', 'Cabe na mão ou junto ao corpo'],
          ['Médio', '1 espaço médio', 'Aproximadamente o tamanho de um braço'],
          ['Grande', '2 espaços médios', 'Aproximadamente metade do corpo'],
          [
            'Grande+',
            'Regra exclusiva',
            'Do tamanho do corpo ou maior; exige foco para carregar',
          ],
        ],
      },
    },
    {
      kind: 'rule',
      tone: 'rule',
      title: 'Inventário comum',
      items: [
        'Sem mochila, todo personagem possui 3 espaços médios.',
        'Isso equivale a 9 pequenos, 3 médios, 1 grande + 1 médio ou 1 grande + 3 pequenos.',
        'Um Grande+ remove todos os médios e grandes do inventário, mas permite até 3 pequenos.',
        'O porte é informado na ficha. Item ainda sem porte definido conta como médio por segurança.',
      ],
    },
    {
      kind: 'rule',
      title: 'Mochila normal',
      items: [
        'Adiciona 3 espaços médios, totalizando 6.',
        'Cada espaço médio equivalente ocupado acima dos 3 espaços comuns reduz 2 m de deslocamento.',
        'Com os 6 espaços médios ocupados, a penalidade total é -6 m.',
        'Pequenos além da capacidade comum são agrupados de três em três; qualquer grupo parcial já conta para a penalidade.',
      ],
    },
    {
      kind: 'rule',
      title: 'Mochila+',
      items: [
        'Rompe o limite da mochila normal e transforma deslocamento em capacidade.',
        'Cada espaço médio equivalente acima dos 3 comuns reduz 1 m de deslocamento.',
        'O deslocamento nunca cai abaixo de 1 m.',
        'A referência de carga antes do piso é 3 + (deslocamento base - 1) médios equivalentes.',
        'Com 12 m de deslocamento base, 14 médios equivalentes correspondem a 42 pequenos; ao chegar a 1 m, a carga adicional continua permitida.',
      ],
    },
    {
      kind: 'warning',
      tone: 'warning',
      title: 'Grande+ continua exclusivo',
      text: 'Mesmo com mochila, Grande+ não pode dividir o inventário com médio ou grande. Ele pode dividir espaço apenas com pequenos, respeitando a cota de pequenos disponível.',
    },
  ],
}

const masterSection = {
  id: 'inventario-carga',
  number: 'M09B',
  label: 'Inventário, carga e deslocamento',
  summary: 'Regra operacional única para ficha, mesa, multiplayer e futuras automações.',
  status: 'canon',
  tags: ['inventário', 'capacidade', 'mochila', 'Grande+', 'migração'],
  searchTerms: [
    '3 pequenos',
    '3 médios',
    '6 médios',
    'Mochila+',
    'Grande+',
    'deslocamento efetivo',
  ],
  blocks: [
    {
      kind: 'table',
      tone: 'rule',
      title: 'Unidade de cálculo',
      table: {
        columns: ['Carga', 'Unidades pequenas', 'Equivalência média'],
        rows: [
          ['Pequeno', '1', '1/3'],
          ['Médio', '3', '1'],
          ['Grande', '6', '2'],
          ['Grande+', 'Exclusivo', 'Não entra na soma comum'],
        ],
      },
    },
    {
      kind: 'rule',
      tone: 'rule',
      title: 'Fórmulas aplicadas pelo app',
      items: [
        'Inventário comum: capacidade 3 médios, sem penalidade automática; excedente gera alerta e não é apagado.',
        'Mochila normal: capacidade 6 médios; penalidade = teto dos médios equivalentes acima de 3 x 2 m.',
        'Mochila+: referência de carga = 3 + (deslocamento base - 1) médios; não existe teto de itens depois que o deslocamento chega a 1 m.',
        'Deslocamento efetivo = deslocamento base - penalidade, com piso de 1 m.',
        'O app preserva o deslocamento base da ficha e calcula o efetivo; remover carga ou mochila restaura o valor sem perda acumulada.',
      ],
    },
    {
      kind: 'rule',
      title: 'Grande+',
      items: [
        'Aceita apenas um Grande+ por vez.',
        'Médio, grande ou item legado sem porte junto de Grande+ gera combinação inválida.',
        'Sem mochila, Grande+ permite 3 pequenos.',
        'Com mochila normal, a cota de pequenos acompanha a capacidade da mochila.',
        'Com Mochila+, a referência acompanha a capacidade calculada; 12 m permite Grande+ + 42 pequenos antes do piso, e carga adicional continua permitida no piso de 1 m.',
      ],
    },
    {
      kind: 'warning',
      tone: 'warning',
      title: 'Compatibilidade e segurança',
      items: [
        'Item antigo sem porte não é reescrito automaticamente: conta como médio e aparece como pendente.',
        'Nenhuma validação remove item, mochila ou lore; conflito fica visível para decisão do Mestre.',
        'A ficha canônica envia porte, quantidade e mochila tanto Mestre > Jogador quanto Jogador > Mestre.',
        'O sistema MSC permanece fora desta entrega e só será desenhado com aprovação direta do Mestre.',
      ],
    },
    {
      kind: 'steps',
      title: 'Teste rápido de mesa',
      items: [
        'Sem mochila: confirme 9 pequenos, 3 médios e grande + médio.',
        'Confirme Grande+ + 3 pequenos e bloqueie Grande+ + médio.',
        'Mochila normal: 6 médios devem mostrar -6 m.',
        'Mochila+ com 12 m: 42 pequenos devem mostrar 1 m restante; carga maior continua válida e permanece em 1 m.',
        'Edite em uma ponta multiplayer e confirme capacidade e deslocamento efetivo na outra.',
      ],
    },
  ],
}

const playerBook = JSON.parse(fs.readFileSync(playerPath, 'utf8'))
const masterBook = JSON.parse(fs.readFileSync(masterPath, 'utf8'))

upsertSection(playerBook, playerSection, 'movimento')
upsertSection(masterBook, masterSection, 'itens-builds')

fs.writeFileSync(playerPath, `${JSON.stringify(playerBook, null, 2)}\n`)
fs.writeFileSync(masterPath, `${JSON.stringify(masterBook, null, 2)}\n`)

console.log('[rulebooks-inventory] Regras de inventario sincronizadas.')
