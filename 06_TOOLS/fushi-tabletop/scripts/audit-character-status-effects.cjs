const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
} = require('./lib/fushi-workspace-io.cjs')

const root = path.resolve(__dirname, '..')
const outputDirectory = path.join(root, 'docs', 'fushi-system')
const outputJson = path.join(outputDirectory, 'NPC_STATUS_EFFECT_AUDIT.json')
const outputMarkdown = path.join(outputDirectory, 'NPC_STATUS_EFFECT_AUDIT.md')
const catalogPath = path.join(root, 'src', 'data', 'statusCatalog.ts')

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
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map(readLiteral)
  }
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

function loadStatusCatalog() {
  const sourceText = fs.readFileSync(catalogPath, 'utf8')
  const sourceFile = ts.createSourceFile(
    catalogPath,
    sourceText,
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
  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new Error('Catalogo canonico de estados nao encontrado.')
  }
  return catalog
}

function getCharacters(workspace) {
  if (Array.isArray(workspace?.characters)) return workspace.characters
  return Array.isArray(workspace?.characters?.items)
    ? workspace.characters.items
    : []
}

function getFeatures(character) {
  return [
    ...(character.ataques ?? []).map((feature) => ({
      ...feature,
      kind: 'ataque',
    })),
    ...(character.habilidadesDetalhadas ?? []).map((feature) => ({
      ...feature,
      kind: 'habilidade',
    })),
    ...(character.rituais ?? []).map((feature) => ({
      ...feature,
      kind: 'ritual',
    })),
  ]
}

function getFeatureText(feature) {
  return [
    feature.nome,
    feature.resumo,
    feature.descricao,
    feature.automation?.activation,
    feature.automation?.combat?.efeitoRapido,
    feature.automation?.combat?.falha,
    feature.automation?.combat?.reacao,
    ...(feature.automation?.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
}

function getStructuredStatuses(feature, validStatusIds) {
  return (feature.automation?.effects ?? [])
    .filter(
      (effect) =>
        effect?.type === 'status' &&
        typeof effect.statusId === 'string' &&
        validStatusIds.has(effect.statusId),
    )
    .map((effect) => ({
      durationRounds: effect.durationRounds ?? null,
      stacks: effect.stacks ?? 1,
      statusId: effect.statusId,
      target: effect.target ?? null,
    }))
}

function getKeywordCandidates(feature, catalog, structuredStatusIds) {
  const text = normalize(getFeatureText(feature))
  if (!text) return []

  return catalog
    .filter((status) => !structuredStatusIds.has(status.id))
    .filter((status) => !status.id.startsWith('especial-'))
    .filter((status) =>
      [status.label, ...(status.aliases ?? [])]
        .map(normalize)
        .filter((candidate) => candidate.length >= 4)
        .some((candidate) => text.includes(candidate)),
    )
    .map((status) => status.id)
}

function getResourceCosts(feature) {
  return (feature.automation?.costs ?? [])
    .filter((cost) => cost && typeof cost.resource === 'string')
    .map((cost) => ({
      amount: Number(cost.amount) || 0,
      resource: cost.resource,
    }))
}

const NON_APPLYING_REFERENCE_FEATURES = new Set(
  [
    'instinto de sobrevivencia',
    'passo do vento',
    'retirada elegante',
    'movimento relampago',
    'passo kunoichi',
    'agulhas de sutra',
    'maos que aprenderam demais',
    'rota impossivel',
    'reparo improvisado',
    'regeneracao anormal',
    'senhor das coordenadas',
    'ler sinais do corpo',
    'leitura organica',
    'corte de esquina',
    'sorriso de mentira',
    'sair da linha',
    'ouvir o fluxo',
    'fase 1 o labirinto vivo',
    'fase 2 a serpente exposta',
    'fase 1 a ascensao',
    'fase final a forma humana do dragao',
    'recompensa desejo do dragao fushi',
  ].map(normalize),
)

function normalizeFeatureName(value) {
  return normalize(value)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function classifyReviewCandidate(feature, keywordCandidates) {
  const featureName = normalizeFeatureName(feature.nome)
  const text = normalize(getFeatureText(feature))
  const kind = normalize(feature.automation?.kind ?? feature.kind)

  if (NON_APPLYING_REFERENCE_FEATURES.has(featureName)) {
    return {
      category: 'REFERENCIA_NAO_APLICA',
      reason:
        'O texto cita o conceito, evita reacao, diagnostica ou move imediatamente; nao impoe o estado canonico.',
    }
  }

  if (
    /escolh(?:a|e|er)|escolher 1 efeito|escolher 1/.test(text) &&
    keywordCandidates.length > 0
  ) {
    return {
      category: 'ESCOLHA_OU_MODO',
      reason:
        'A acao possui modos diferentes. O estado so pode ser aplicado depois que o Mestre escolher o modo resolvido.',
    }
  }

  if (
    /teste adicional|falha[^.]{0,180}(fica|sofre|perde|recebe)|se falhar|falha do alvo/.test(
      text,
    )
  ) {
    return {
      category: 'TESTE_SECUNDARIO',
      reason:
        'O estado depende de uma segunda defesa ou falha; nao pode entrar automaticamente apenas com o acerto principal.',
    }
  }

  if (
    keywordCandidates.includes('cura') &&
    /cura \d|recupera (?:o mesmo|metade|\\d)|estabiliza com|tratamento de emergencia/.test(
      text,
    )
  ) {
    return {
      category: 'RESOLUCAO_IMEDIATA',
      reason:
        'A cura ou transferencia ocorre uma vez na resolucao da acao; nao e o buff continuo Cura.',
    }
  }

  if (
    kind === 'passiva' ||
    /fase \d|mecanica global|por turno|durante \d+ turnos|dominio|lendaria/.test(
      text,
    )
  ) {
    return {
      category: 'PASSIVA_FASE_OU_EVENTO',
      reason:
        'A regra persiste, altera uma fase ou usa valor proprio; precisa de integracao de evento/passiva antes de automatizar.',
    }
  }

  if (
    /alvo fica confuso|recebe \+\d+ ca|concede \+\d+ ca|novo usuario recebe imediatamente/.test(
      text,
    )
  ) {
    return {
      category: 'EFEITO_DIRETO_ESTRUTURAVEL',
      reason:
        'O texto aplica um estado ou modificador direto e pode receber automacao estruturada sem mudar a habilidade.',
    }
  }

  return {
    category: 'REGRA_ESPECIAL_MANUAL',
    reason:
      'O efeito e real, mas nao equivale sozinho ao estado padrao; exige regra propria ou confirmacao do Mestre.',
  }
}

function buildReport() {
  const catalog = loadStatusCatalog()
  const validStatusIds = new Set(catalog.map((status) => status.id))
  const snapshot = readWorkspaceState({
    autosavePath:
      process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(root),
    projectRoot: root,
    workspacePath:
      process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath(),
  })
  const characters = getCharacters(snapshot.workspace)
  const npcs = characters.filter(
    (character) =>
      character.tipo === 'npc' ||
      normalize(character.jogador) === 'npc',
  )
  const items = npcs.flatMap((character) =>
    getFeatures(character).map((feature) => {
      const structuredStatuses = getStructuredStatuses(feature, validStatusIds)
      const structuredStatusIds = new Set(
        structuredStatuses.map((status) => status.statusId),
      )
      const keywordCandidates = getKeywordCandidates(
        feature,
        catalog,
        structuredStatusIds,
      )
      const resourceCosts = getResourceCosts(feature)
      const reviewDecision =
        structuredStatuses.length === 0 && keywordCandidates.length > 0
          ? classifyReviewCandidate(feature, keywordCandidates)
          : null
      const classification =
        structuredStatuses.length > 0
          ? 'AUTOMATICO'
          : keywordCandidates.length > 0
            ? 'REVISAR_ESTRUTURA'
            : 'SEM_ESTADO_EXPLICITO'

      return {
        characterId: character.id,
        character: character.nome,
        featureId: feature.id,
        feature: feature.nome,
        kind: feature.kind,
        classification,
        structuredStatuses,
        keywordCandidates,
        reviewDecision,
        resourceCosts,
        resourceCostStatus:
          feature.automation?.kind === 'passiva' || resourceCosts.length > 0
            ? 'DEFINIDO'
            : 'REVISAR_CUSTO',
      }
    }),
  )

  return {
    generatedAt: new Date().toISOString(),
    sourcePath: snapshot.sourcePath,
    catalogPath,
    statusCatalogSize: catalog.length,
    npcs: npcs.length,
    features: items.length,
    automatic: items.filter((item) => item.classification === 'AUTOMATICO')
      .length,
    reviewCandidates: items.filter(
      (item) => item.classification === 'REVISAR_ESTRUTURA',
    ).length,
    reviewByCategory: Object.fromEntries(
      Array.from(
        new Set(
          items
            .map((item) => item.reviewDecision?.category)
            .filter(Boolean),
        ),
      )
        .sort()
        .map((category) => [
          category,
          items.filter(
            (item) => item.reviewDecision?.category === category,
          ).length,
        ]),
    ),
    noExplicitStatus: items.filter(
      (item) => item.classification === 'SEM_ESTADO_EXPLICITO',
    ).length,
    costsToReview: items.filter(
      (item) => item.resourceCostStatus === 'REVISAR_CUSTO',
    ).length,
    items,
  }
}

function buildMarkdown(report) {
  const automaticRows = report.items
    .filter((item) => item.classification === 'AUTOMATICO')
    .map(
      (item) =>
        `| ${item.character} | ${item.feature} | ${item.structuredStatuses
          .map((status) => `${status.statusId} -> ${status.target ?? 'alvo'}`)
          .join(', ')} |`,
    )
    .join('\n')
  const reviewRows = report.items
    .filter((item) => item.classification === 'REVISAR_ESTRUTURA')
    .map(
      (item) =>
        `| ${item.character} | ${item.feature} | ${item.keywordCandidates.join(
          ', ',
        )} | ${item.reviewDecision?.category ?? 'REVISAR'} | ${
          item.resourceCostStatus === 'REVISAR_CUSTO'
            ? 'custo pendente'
            : item.resourceCosts
                .map((cost) => `${cost.amount} ${cost.resource}`)
                .join(', ')
        } |`,
    )
    .join('\n')

  return `# Auditoria de estados das fichas NPC

Gerado em ${report.generatedAt}.

Fonte real: \`${report.sourcePath}\`.

Catalogo canonico: \`${report.catalogPath}\`.

## Regra desta auditoria

Este relatorio nao altera lore, habilidade, ritual, dano, custo ou efeito. Uma palavra parecida com um estado canonico e apenas um candidato de revisao: ela nao e convertida automaticamente em regra. A classificacao **SEM_ESTADO_EXPLICITO** tambem nao e erro; muitas acoes causam dano, cura ou movimento sem aplicar estado.

## Resumo

| Medida | Total |
| --- | ---: |
| NPCs auditados | ${report.npcs} |
| Acoes auditadas | ${report.features} |
| Estados estruturados e automaticos | ${report.automatic} |
| Candidatos que exigem revisao do Mestre | ${report.reviewCandidates} |
| Acoes sem estado explicito | ${report.noExplicitStatus} |
| Custos ativos que exigem revisao | ${report.costsToReview} |

## Ja automatico

| NPC | Acao | Estado estruturado |
| --- | --- | --- |
${automaticRows || '| - | - | Nenhum estado automatico encontrado |'}

## Destino mecanico dos candidatos

${Object.entries(report.reviewByCategory)
  .map(([category, total]) => `- **${category}**: ${total}`)
  .join('\n')}

## Exige revisao antes de virar regra

| NPC | Acao | Estado candidato | Destino | Custo |
| --- | --- | --- | --- | --- |
${reviewRows || '| - | - | Nenhum candidato | - | - |'}

Os detalhes completos, inclusive acoes sem estado, permanecem em \`NPC_STATUS_EFFECT_AUDIT.json\`.
`
}

const report = buildReport()
fs.mkdirSync(outputDirectory, { recursive: true })
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`)
fs.writeFileSync(outputMarkdown, buildMarkdown(report))

console.log(
  `[status-audit] ${report.npcs} NPCs, ${report.features} acoes, ${report.automatic} automaticas, ${report.reviewCandidates} para revisao`,
)
console.log(`[status-audit] fonte: ${report.sourcePath}`)
