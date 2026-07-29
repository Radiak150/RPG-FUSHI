import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const projectRoot = process.cwd()
const require = createRequire(import.meta.url)
const {
  evaluateBuildItemByRarity,
  getCatalogItem,
  readBuildCatalog,
} = require('./lib/fushi-build-system.cjs')
const buildCatalog = readBuildCatalog(projectRoot)
const assignmentPath = path.join(
  projectRoot,
  'docs',
  'fushi-system',
  'NPC_BUILD_ASSIGNMENTS.json',
)
const npcAssignments = fs.existsSync(assignmentPath)
  ? JSON.parse(fs.readFileSync(assignmentPath, 'utf8'))
  : { records: [] }

const STAT_LABELS = {
  abilityDamage: 'Dano de Habilidade',
  adjacentDamage: 'Dano adjacente',
  block: 'Bloqueio',
  ca: 'CA',
  caPenetration: 'Perfuracao de CA',
  criticalDamage: 'Dano Critico',
  damage: 'Dano',
  determination: 'Determinacao',
  fushi: 'FUSHI',
  healing: 'Cura',
  healingReceived: 'Cura recebida',
  initiative: 'Iniciativa',
  life: 'Vida',
  meleeDamage: 'Dano corpo a corpo',
  movement: 'Deslocamento',
  rangedDamage: 'Dano a distancia',
}

function normalizeTitle(value) {
  const raw = String(value ?? '')
  const repaired = raw.includes('Ã')
    ? Buffer.from(raw, 'latin1').toString('utf8')
    : raw

  return repaired
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function sameTitle(left, right) {
  return normalizeTitle(left) === normalizeTitle(right)
}

function upsertBlock(section, block, afterTitle) {
  const existingIndex = section.blocks.findIndex((entry) => entry.title === block.title)
  if (existingIndex >= 0) {
    section.blocks[existingIndex] = block
    return
  }

  const afterIndex = afterTitle
    ? section.blocks.findIndex((entry) => entry.title === afterTitle)
    : -1
  section.blocks.splice(afterIndex >= 0 ? afterIndex + 1 : section.blocks.length, 0, block)
}

function formatModifiers(modifiers) {
  const entries = Object.entries(modifiers ?? {})
    .filter(([, value]) => Number(value) !== 0)
    .map(([key, value]) => `${Number(value) > 0 ? '+' : ''}${value} ${STAT_LABELS[key] ?? key}`)

  return entries.length > 0 ? entries.join('; ') : 'Sem alteracao numerica'
}

function commonBuildExample(archetypeId) {
  const archetype = buildCatalog.archetypes.find((entry) => entry.id === archetypeId)
  const item = buildCatalog.items.find((entry) => entry.id === archetype?.publicExampleItemId)
    ?? getCatalogItem(buildCatalog, 'planicie', archetypeId)
  return item ? evaluateBuildItemByRarity(buildCatalog, item, 'comum') : null
}

function readVolume(relativePath) {
  const filePath = path.join(projectRoot, relativePath)

  return {
    filePath,
    volume: JSON.parse(fs.readFileSync(filePath, 'utf8')),
  }
}

function getSection(volume, id) {
  const section = volume.sections.find((entry) => entry.id === id)

  if (!section) {
    throw new Error(`Secao ausente: ${id}`)
  }

  return section
}

function getBlock(section, title) {
  const block = section.blocks.find((entry) => sameTitle(entry.title, title))

  if (!block) {
    throw new Error(`Bloco ausente em ${section.id}: ${title}`)
  }

  return block
}

function replaceText(value) {
  if (typeof value === 'string') {
    return value
      .replaceAll('redução derivada da CA base quando você escolhe bloquear.', 'redução por Fortitude quando você escolhe Bloquear.')
      .replaceAll('redução = piso(CA base / 2)', 'redução = Fortitude (0/5/10/15; teto 15)')
      .replaceAll('Esquiva = dado escolhido de AGI + Reflexos vs ataque', 'Esquiva = CA atual + AGI + Reflexos')
      .replaceAll('dado escolhido de AGI + Reflexos vs ataque', 'CA atual + AGI + Reflexos')
      .replaceAll('CA de Esquiva = CA base + AGI + Reflexos', 'Esquiva = CA atual + AGI + Reflexos')
      .replaceAll('CA base + AGI + Reflexos', 'CA atual + AGI + Reflexos')
      .replaceAll('dobra o dano total antes de Bloqueio e outras reduções.', 'dobra apenas os dados de dano; bonus fixo nao dobra.')
      .replaceAll('2 x dano total antes de redução', 'dobra os dados de dano antes de redução')
      .replaceAll('dano final = dano - piso(CA base / 2)', 'dano final = dano - Fortitude (teto 15)')
  }

  if (Array.isArray(value)) {
    return value.map((entry) => replaceText(entry))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, replaceText(entry)]),
    )
  }

  return value
}

function updatePlayer(volume) {
  const defenseQuick = volume.quickReference.find((entry) => entry.label === 'Defesa')
  if (defenseQuick) {
    defenseQuick.detail = 'Quando acertarem sua CA, escolha Bloqueio, Esquiva ou Contra-ataque usando sua Reacao.'
  }

  const ficha = getSection(volume, 'ficha')
  const fields = getBlock(ficha, 'Campos de combate')
  fields.table.rows = [
    ['CA base', 'Numero que um ataque precisa alcancar antes de uma Reacao defensiva.'],
    ['Bloqueio V2', 'Reducao por Fortitude: 0, 5, 10 ou 15; teto normal 15.'],
    ['Esquiva V2', 'Valor fixo: CA atual + AGI + Reflexos. Gasta Reacao e nao usa dados.'],
    ['Deslocamento', 'Quantidade de metros que voce pode mover no turno.'],
    ['Vida', 'Quanto dano o corpo suporta antes de desmaiar.'],
    ['FUSHI', 'Recurso de poder usado por Habilidades e Rituais liberados.'],
    ['Determinacao', 'Recurso mental para sustentar controle, tecnicas e resistencia interna.'],
  ]

  const testes = getSection(volume, 'testes')
  const criticos = getBlock(testes, 'Críticos')
  criticos.items = [
    '20 natural no dado escolhido de um ataque e critico.',
    'O critico dobra somente os dados de dano; bonus fixo, custo e condicao nao dobram por padrao.',
    'Em Coreografia extrema, so e critico se o dado escolhido continuar sendo 20.',
    'Fora de ataque, um critico melhora efeito, tempo ou posicao; ele nao cria informacao impossivel.',
  ]

  const ataques = getSection(volume, 'ataques')
  const standardAttack = getBlock(ataques, 'Ataque padrão')
  standardAttack.formula = 'ataque = d20 escolhido + Luta ou Pontaria + bonus; acerta se ataque >= CA'
  standardAttack.items = [
    'Declare alvo, arma, intencao e Coreografia antes de rolar.',
    'Corpo a corpo causa dano por FOR + Luta; distancia causa dano por AGI + Pontaria.',
    'Se o ataque errar ou for evitado, o dano nao acontece e os recursos declarados sao gastos quando a regra disser.',
    '20 natural no dado escolhido e critico: dobre os dados de dano e aplique Bloqueio depois.',
  ]
  const damageReference = getBlock(ataques, 'Dano físico de referência')
  damageReference.table.rows = [
    ['Golpe desarmado', '1d2', 'Soco, chute ou impacto sem arma; Luta define o acerto, nao aumenta o dado base.'],
    ['Arma leve', '1d6', 'Faca, bastao leve, arco simples.'],
    ['Arma maior ou afiada', '1d8', 'Exige mais espaco, preparo ou risco.'],
    ['Acima de 1d8', 'Regra nomeada', 'Precisa custo, condicao, preparo, habilidade, item ou fase.'],
  ]

  const defesas = getSection(volume, 'defesas')
  const defenseTable = getBlock(defesas, 'As três Reações defensivas')
  defenseTable.table.rows = [
    ['Bloqueio', 'Fortitude: 0/5/10/15, teto normal 15', 'Gasta Reacao e reduz apenas dano; nao apaga condicao sem regra.'],
    ['Esquiva', 'CA atual + AGI + Reflexos vs ataque', 'Gasta Reacao; se o valor fixo igualar ou superar o ataque, evita o dano e move 3 m seguros.'],
    ['Contra-ataque', 'ataque inimigo falha contra CA', 'Gasta Reacao para fazer um ataque normal sem Coreografia.'],
  ]
  const chooseDefense = getBlock(defesas, 'Escolha antes de saber o dano')
  chooseDefense.text = 'Depois de um ataque alcancar sua CA, escolha uma Reacao antes de rolar dano. Bloqueio garante reducao. Esquiva pode evitar tudo, mas precisa igualar ou superar o ataque. Contra-ataque so aparece quando o ataque inimigo falha contra sua CA.'
  const defenseWarning =
    defesas.blocks.find(
      (entry) =>
        entry.title === 'Bloqueio está em observação de balanceamento' ||
        entry.title === 'Regra V2 ja aplicada',
    ) ?? getBlock(defesas, 'Bloqueio está em observação de balanceamento')
  defenseWarning.kind = 'rule'
  defenseWarning.tone = 'rule'
  defenseWarning.title = 'Regra V2 ja aplicada'
  defenseWarning.text = 'Bloqueio agora depende de Fortitude, nao da metade da CA. Itens futuramente podem dar bonus temporario, mas o teto normal continua 15. Nao use item para compensar uma defesa que nao faz sentido.'
  const defenseExample = getBlock(defesas, 'Exemplo: CA 16, AGI 2 e Reflexos +5')
  defenseExample.text = 'Um ataque 18 alcanca CA 16. Bloqueio de Fortitude 5 reduz 5 do dano. A Esquiva fixa vale 23: CA 16 + AGI 2 + Reflexos 5. Ao gastar a Reacao, ela evita esse ataque sem rolar dados. Contra-ataque nao dispara porque o ataque alcancou sua CA.'

  const manobras = getSection(volume, 'manobras')
  const maneuverTable =
    manobras.blocks.find(
      (entry) =>
        entry.title === 'Manobras universais - regra V1' ||
        entry.title === 'Manobras universais - Combat V2',
    ) ?? getBlock(manobras, 'Manobras universais - regra V1')
  maneuverTable.title = 'Manobras universais - Combat V2'
  maneuverTable.table.rows = [
    ['Agarrar', 'FOR + Luta vs FOR + Fortitude ou AGI + Acrobacia', 'Alvo Agarrado: deslocamento 0; escapar exige Acao Principal.'],
    ['Empurrar', 'FOR + Luta vs FOR + Fortitude ou AGI + Acrobacia', 'Move 3 m; terreno perigoso cria consequencia narrada.'],
    ['Puxar', 'FOR + Luta com pegada, corda ou gancho vs defesa fisica', 'Move 3 m na sua direcao; sem pegada ou ferramenta a tentativa falha.'],
    ['Derrubar', 'FOR ou AGI + Luta vs AGI + Acrobacia', 'Alvo Caido; gasta Movimento para levantar.'],
    ['Desarmar', 'AGI + Luta vs AGI + Acrobacia', 'Item cai em celula adjacente; nao e destruido.'],
    ['Ajudar', 'Acao coerente com a cena', 'Aliado recebe +1d20 na proxima acao declarada.'],
    ['Desengajar', 'Sem teste', 'Sai de manada sem provocar oportunidade.'],
    ['Preparar', 'Gatilho declarado', 'Reserva a Reacao para uma resposta especifica.'],
    ['Agro', 'Acao Completa; PRE + Intimidacao vs CA de cada alvo visivel', 'Sucesso obriga o proximo ataque legal do alvo a priorizar voce. O custo em Determinacao e resolvido por alvo.'],
  ]
  upsertBlock(manobras, {
    kind: 'rule',
    tone: 'rule',
    title: 'Agro: custo e resolucao',
    text: 'Declare os alvos visiveis antes do teste. Resolva PRE + Intimidacao contra a CA atual de cada alvo separadamente. Em sucesso, o proximo ataque legal daquele alvo deve priorizar voce e voce perde metade da Determinacao atual dele, arredondada para cima. Em falha, nao ha Agro e voce perde a Determinacao atual inteira daquele alvo. A Acao Completa e gasta mesmo se todos os testes falharem; Agro nao obriga movimento ou ataque impossivel.',
  }, maneuverTable.title)

  const builds = getSection(volume, 'builds')
  builds.status = 'canon'
  builds.tags = ['itens', 'arquetipos', 'integracao permanente', 'raridade oculta']
  const oldBuildWarning = builds.blocks.find(
    (entry) =>
      sameTitle(entry.title, 'Sistema em construcao') ||
      sameTitle(entry.title, 'Sistema em construção') ||
      sameTitle(entry.title, 'Sistema aplicado'),
  )
  if (oldBuildWarning) {
    oldBuildWarning.kind = 'rule'
    oldBuildWarning.tone = 'rule'
    oldBuildWarning.title = 'Sistema aplicado'
    oldBuildWarning.text = 'Cada item integra um ganho, um custo e, quando existir, uma passiva. Os numeros dependem da raridade revelada depois da absorcao e da afinidade da build dominante registrada na ficha.'
  }
  const playerIntegration = getBlock(builds, 'IntegraÃ§Ã£o permanente')
  playerIntegration.items = [
    'Ao aceitar a integracao, o ganho, o custo e a passiva passam a fazer parte da identidade.',
    'O objeto fisico continua existindo e pode ser integrado por outras identidades.',
    'Cada identidade integra a mesma matriz apenas uma vez; nao existe remover ou resetar por rotina.',
    'A raridade somente e revelada depois que voce confirma a absorcao. Depois de vinculada, a matriz nao pode ser removida por rotina.',
    'Misturar arquetipos e permitido. Todos os ganhos e custos se somam literalmente.',
  ]
  const buildIndex = builds.blocks.findIndex((entry) => sameTitle(entry.title, 'Build não limita criatividade'))
  const buildExamples = {
    kind: 'table',
    title: 'Exemplos publicos de tradeoff',
    table: {
      columns: ['Caminho', 'Exemplo Comum', 'Orcamento comparavel de 10 pontos', 'Passiva constante'],
      rows: [
        ...buildCatalog.archetypes.map((archetype) => {
          const item = commonBuildExample(archetype.id)
          return [
            archetype.label,
            item?.name ?? '-',
            item ? formatModifiers(item.modifiers) : '-',
            item?.passive ?? '-',
          ]
        }),
      ],
    },
  }
  upsertBlock(builds, buildExamples, builds.blocks[Math.max(0, buildIndex - 1)]?.title)
  const oldRarityBlock = builds.blocks.find((entry) => sameTitle(entry.title, 'Raridade e rolagem do item'))
  if (oldRarityBlock) {
    oldRarityBlock.kind = 'rule'
    oldRarityBlock.tone = 'rule'
    oldRarityBlock.title = 'Raridade revelada apos absorcao'
    oldRarityBlock.text = 'Um item pode ser Comum, Raro, Epico, Lendario ou Mitico. Voce conhece a matriz e decide se quer absorve-la antes de descobrir a raridade obtida. Existem itens Secretos capazes de elevar ou rerrolar a raridade de uma absorcao, mas eles pertencem a descobertas da campanha.'
  } else {
    upsertBlock(builds, {
      kind: 'rule',
      tone: 'rule',
      title: 'Raridade revelada apos absorcao',
      text: 'Um item pode ser Comum, Raro, Epico, Lendario ou Mitico. Voce conhece a matriz e decide se quer absorve-la antes de descobrir a raridade obtida. Existem itens Secretos capazes de elevar ou rerrolar a raridade de uma absorcao, mas eles pertencem a descobertas da campanha.',
    }, buildExamples.title)
  }
  upsertBlock(builds, {
    kind: 'rule',
    tone: 'warning',
    title: 'Saturacao de cura em combate',
    text: 'O primeiro efeito de cura recebido por um alvo na rodada usa todo o bonus de Cura da build. Curas seguintes no mesmo alvo e na mesma rodada usam metade desse bonus, arredondada para baixo. O dado e o valor base da cura nao sao reduzidos.',
  }, 'Raridade revelada apos absorcao')

  const reference = getSection(volume, 'referencia')
  const formulas = getBlock(reference, 'Fórmulas essenciais')
  formulas.table.rows = [
    ['Teste', 'd20 escolhido + Pericia + bonus'],
    ['Ataque corpo a corpo', 'FOR + Luta vs CA'],
    ['Ataque a distancia', 'AGI + Pontaria vs CA'],
    ['Bloqueio', 'dano - Fortitude (0/5/10/15; teto 15)'],
    ['Esquiva', 'CA atual + AGI + Reflexos vs total do ataque; sem dados'],
    ['Contra-ataque', 'ataque inimigo falha contra CA'],
    ['Critico', '20 escolhido: dobra dados de dano'],
    ['Coreografia', '-1d20 de acerto = +1 dado de dano'],
    ['Agro', 'Acao Completa; PRE + Intimidacao vs CA por alvo visivel'],
  ]
}

function updateMaster(volume) {
  const escudo = getSection(volume, 'escudo')
  const centralMath = getBlock(escudo, 'Matemática central')
  centralMath.table.rows = [
    ['Teste', 'd20 escolhido do Atributo + Pericia + item + cena'],
    ['Atributo 0', '2d20, pega o pior'],
    ['Treino', '+0 / +5 / +10 / +15'],
    ['Ataque corpo a corpo', 'FOR + Luta vs CA valida'],
    ['Ataque a distancia', 'AGI + Pontaria vs CA valida'],
    ['Critico de ataque', '20 escolhido dobra dados de dano; bonus fixo nao dobra'],
    ['Bloqueio V2', 'dano final = dano - Fortitude; teto normal 15'],
    ['Esquiva V2', 'Reacao: CA atual + AGI + Reflexos vs ataque; sem dados'],
    ['Contra-ataque', 'se ataque < CA, defensor gasta Reacao para ataque normal'],
    ['Coreografia', 'cada d20 sacrificado adiciona 1 dado de dano'],
    ['Agro', 'Acao Completa; PRE + Intimidacao vs CA por alvo; custo usa Determinacao atual do alvo'],
  ]

  const adjudicacao = getSection(volume, 'adjudicacao')
  const oldRule =
    adjudicacao.blocks.find(
      (entry) =>
        entry.title === 'Regra V1 para observar' || entry.title === 'Resolver ataque no app',
    ) ?? getBlock(adjudicacao, 'Regra V1 para observar')
  oldRule.title = 'Resolver ataque no app'
  oldRule.kind = 'steps'
  oldRule.items = [
    'A Mesa registra o ataque, total, dado escolhido e critico quando houver.',
    'Compare o total com CA. Se falhar, ofereca Contra-ataque se houver Reacao.',
    'Se acertar, defensor escolhe Bloqueio ou Esquiva antes do dano.',
    'Role dano com dados dobrados apenas em critico; aplique Bloqueio por Fortitude depois.',
    'Registre dano, condicao, empurrao, gasto e proximo gatilho no log da Mesa.',
  ]

  const balance = getSection(volume, 'poder-balanceamento')
  const damageReference = getBlock(balance, 'Dano de referência')
  damageReference.table.columns = ['Nivel', 'Dano comum', 'Leitura']
  damageReference.table.rows = [
    ['Golpe desarmado', '1d2', 'Luta define o acerto; o dado nao sobe por treino.'],
    ['Arma leve', '1d6', 'Base de mob ou protagonista.'],
    ['Arma maior', '1d8', 'Precisa espaco, preparo ou risco.'],
    ['Acima de 1d8', 'Regra nomeada', 'Custo, condicao, preparo, item, habilidade ou fase.'],
  ]
  if (!balance.blocks.some((entry) => entry.title === 'Protocolo de simulacao')) {
    balance.blocks.push({
      kind: 'rule',
      tone: 'rule',
      title: 'Protocolo de simulacao',
      text: 'Antes de mudar Vida, dano, Bloqueio ou item, rode os simuladores offline de combate e builds. Registre taxa de vitoria, rodadas medias, dano, bloqueios, esquivas e criticos. Ajuste uma variavel por vez e mostre o plano ao Mestre antes de escrever na ficha.',
    })
  }

  const items = getSection(volume, 'itens-builds')
  items.status = 'canon'
  items.tags = ['48 matrizes', 'identidade', 'permanente', 'catalogo aplicado']
  const approvedRules = getBlock(items, 'Regras aprovadas')
  approvedRules.items = [
    'Cada identidade integra o mesmo item no maximo uma vez.',
    'Varias identidades podem integrar a mesma matriz; o objeto fisico permanece no mundo.',
    'O beneficio, o custo e a passiva sao permanentes e acompanham a identidade.',
    'Nao existe remover, trocar ou resetar build por rotina.',
    'Nao existe teto artificial de itens diferentes; localizacao, raridade e tradeoffs controlam a progressao.',
    'Misturar arquetipos e valido: some todos os modificadores, inclusive custos.',
    'Passivas sao pequenas e automaticas; item padrao nao vira botao com recarga por cena.',
    'A raridade so e revelada depois que o jogador confirma a absorcao.',
    'Remocao existe apenas no BUI do Mestre como ferramenta de correcao tecnica.',
  ]
  const checklist = getBlock(items, 'Checklist obrigatório de item')
  checklist.items = [
    'Raridade padrao: Comum, Raro, Epico, Lendario ou Mitico; Secreto fica fora da rolagem.',
    'Ganho numerico e perda numerica ou de situacao.',
    'Passiva pequena e permanente, sem botao de ativacao ou recarga por cena.',
    'Nivel de Poder sugerido e ponto de origem no MUN.',
    'Resultado de simulacao antes de entregar o item na campanha.',
  ]
  upsertBlock(items, {
    kind: 'table',
    title: 'Raridade operacional',
    text: 'Para item padrao, role 1d10 uma vez. A forma fisica pode ser renomeada para combinar com a cena sem mudar a matriz mecanica.',
    table: {
      columns: ['Raridade', 'd10', 'Uso do Mestre'],
      rows: [
        ['Comum', '1-2', 'Primeiro tradeoff simples.'],
        ['Raro', '3-4', 'Especializa um papel.'],
        ['Epico', '5-6', 'Muda a rotina de combate ou cena.'],
        ['Lendario', '7-9', 'Assinatura forte da matriz.'],
        ['Mitico', '10', 'Pico da matriz padrao; ainda respeita seu custo.'],
        ['Secreto', 'fora do d10', 'Item de trama com numeros e passiva definidos individualmente.'],
      ],
    },
  }, 'Regras aprovadas')

  const biomeLabels = Object.fromEntries(buildCatalog.biomes.map((entry) => [entry.id, entry.label]))
  const archetypeLabels = Object.fromEntries(buildCatalog.archetypes.map((entry) => [entry.id, entry.label]))
  const catalogRows = buildCatalog.items.map((item) => {
    const byRarity = buildCatalog.rarities.map((rarity) =>
      evaluateBuildItemByRarity(buildCatalog, item, rarity.id),
    )
    return [
      biomeLabels[item.biomeId] ?? item.biomeId,
      archetypeLabels[item.archetype] ?? item.archetype,
      item.name,
      ...byRarity.map((entry) => formatModifiers(entry.modifiers)),
      item.passive,
    ]
  })
  upsertBlock(items, {
    kind: 'table',
    tone: 'rule',
    title: 'Catalogo oficial: 48 matrizes padrao',
    text: 'Sao 6 itens por bioma e 8 itens por arquetipo. Cada coluna mostra apenas a matriz do item; a afinidade do arquetipo dominante e calculada uma unica vez pela ficha.',
    table: {
      columns: ['Bioma', 'Arquetipo', 'Item', 'Comum', 'Raro', 'Epico', 'Lendario', 'Mitico', 'Passiva'],
      rows: catalogRows,
    },
  }, 'Raridade operacional')

  const assignmentRows = (npcAssignments.records ?? []).map((record) => [
    record.name,
    record.powerLevel,
    archetypeLabels[record.archetype] ?? record.archetype,
    `${record.items?.length ?? 0} matrizes`,
    record.items?.[0] ? `${record.items[0].rarityLabel} R${record.items[0].potency}` : '-',
    formatModifiers(record.totals),
    record.assignmentReason,
  ])
  upsertBlock(items, {
    kind: 'table',
    tone: 'example',
    title: 'Builds aplicadas aos 41 NPCs canonicos',
    text: 'Distribuicao equilibrada entre os seis arquetipos. Lore, nome e efeito de Habilidade permanecem intocados; a build altera somente os campos numericos listados.',
    table: {
      columns: ['NPC', 'Poder', 'Arquetipo', 'Carga', 'Raridade', 'Totais', 'Motivo'],
      rows: assignmentRows,
    },
  }, 'Catalogo oficial: 48 matrizes padrao')

  upsertBlock(items, {
    kind: 'table',
    tone: 'secret',
    title: 'Itens Secretos de correcao de raridade',
    text: 'Esses itens nao entram no d10 nem na distribuicao padrao. Posicao, forma e entrega dependem da trama.',
    table: {
      columns: ['Item', 'Efeito mecanico', 'Restricao'],
      rows: buildCatalog.secretItems.map((item) => [item.name, item.effect, item.placement]),
    },
  }, 'Catalogo oficial: 48 matrizes padrao')

  upsertBlock(items, {
    kind: 'steps',
    tone: 'rule',
    title: 'BUI: absorver e corrigir uma build',
    items: [
      'Abra BUI, escolha o arquetipo e selecione a matriz encontrada.',
      'Mostre ao jogador o ganho, o custo e a passiva, mas mantenha a raridade oculta.',
      'Depois da confirmacao de absorcao, selecione a raridade e vincule a matriz ao personagem.',
      'Confira os deltas automaticos na ficha e registre a absorcao no log da sessao.',
      'Use Remover debug apenas para corrigir erro tecnico; isso nao existe como opcao normal da campanha.',
    ],
  }, 'Itens Secretos de correcao de raridade')

  upsertBlock(items, {
    kind: 'rule',
    tone: 'warning',
    title: 'Limites operacionais das builds',
    text: 'Bloqueio normal por Fortitude para em 15; apenas bonus explicito de item ultrapassa esse teto. Disparada aplica novamente toda perda de Deslocamento da build durante a acao. Perfuracao reduz somente a CA usada contra aquele ataque. Dano Critico de item entra depois de dobrar os dados. Em combate, apenas o primeiro efeito de cura recebido pelo alvo na rodada usa o bonus completo de Cura; os seguintes usam metade do bonus, arredondada para baixo.',
  }, 'BUI: absorver e corrigir uma build')

  upsertBlock(items, {
    kind: 'rule',
    tone: 'warning',
    title: 'FUSHI por dano generico nao esta aprovado',
    text: 'Nao existe regra canonica generica de gastar FUSHI para aumentar dano. Habilidades e itens so alteram dano quando seu texto aprovado disser isso explicitamente.',
  }, 'Limites operacionais das builds')

  upsertBlock(adjudicacao, {
    kind: 'rule',
    tone: 'rule',
    title: 'Agro: procedimento do Mestre',
    text: 'O usuario gasta uma Acao Completa, declara alvos visiveis e resolve PRE + Intimidacao contra a CA atual de cada alvo. Sucesso: o proximo ataque legal do alvo prioriza o usuario; o usuario perde metade da Determinacao atual daquele alvo, arredondada para cima. Falha: nao ha Agro e o usuario perde a Determinacao atual inteira do alvo. Resolva custo e resultado individualmente; um alvo sem ataque legal nao e obrigado a executar uma acao impossivel.',
  })

  const pendingBlock = items.blocks.find((entry) => sameTitle(entry.title, 'Ainda nao fechado'))
  if (pendingBlock) {
    pendingBlock.title = 'Pontos de playtest que continuam visiveis'
    pendingBlock.items = [
      'Itens Secretos continuam sendo definidos individualmente pela trama.',
      'A distribuicao exata dentro de cada ponto do MUN pode mudar por decisao narrativa do Mestre.',
      'Combates de boss por fase, controle sem dano e objetivos de arena exigem validacao de mesa alem do duelo numerico.',
      'Nenhum alerta de simulacao autoriza mudar lore ou efeito de Habilidade automaticamente.',
    ]
  }

  const encontros = getSection(volume, 'encontros')
  if (!encontros.blocks.some((entry) => entry.title === 'Escala de encontro V2')) {
    encontros.blocks.splice(1, 0, {
      kind: 'table',
      title: 'Escala de encontro V2',
      table: {
        columns: ['Tipo', 'Vida guia', 'Leitura'],
        rows: [
          ['Minion', '4 a 8', '1 a 2 acertos; unidade de pressao, nao Nivel de Poder.'],
          ['Mob Basico', '8 a 16', 'Papel claro e sem Canon complexo.'],
          ['Basico', '20 a 30', '3 a 5 acertos relevantes.'],
          ['Avancado', '110 a 150', '5 a 8 acertos relevantes em duelo equilibrado.'],
          ['Ascensao/Cataclisma', 'Por fase', 'Arena, telegrapho, objetivo e condicao; nao so Vida.'],
        ],
      },
    })
  }
}

const player = readVolume('src/data/rulebook/player-rulebook.json')
const master = readVolume('src/data/rulebook/master-rulebook.json')

updatePlayer(player.volume)
updateMaster(master.volume)
player.volume = replaceText(player.volume)
master.volume = replaceText(master.volume)

for (const entry of [player, master]) {
  fs.writeFileSync(entry.filePath, `${JSON.stringify(entry.volume, null, 2)}\n`)
}

console.log(
  JSON.stringify(
    {
      master: path.relative(projectRoot, master.filePath),
      player: path.relative(projectRoot, player.filePath),
      status: 'Combat V2 rulebooks updated',
    },
    null,
    2,
  ),
)
