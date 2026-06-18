const fs = require('node:fs')
const path = require('node:path')

const ATTRIBUTE_KEYS = {
  agilidade: 'agilidade',
  forca: 'forca',
  intelecto: 'intelecto',
  presenca: 'presenca',
  vigor: 'vigor',
}

const SKILL_ATTRIBUTE_HINTS = {
  acrobacia: 'agilidade',
  adestramento: 'presenca',
  artes: 'presenca',
  atletismo: 'forca',
  atualidades: 'intelecto',
  ciencias: 'intelecto',
  crime: 'agilidade',
  diplomacia: 'presenca',
  enganacao: 'presenca',
  fortitude: 'vigor',
  furtividade: 'agilidade',
  iniciativa: 'agilidade',
  intimidacao: 'presenca',
  intuicao: 'presenca',
  investigacao: 'intelecto',
  luta: 'forca',
  medicina: 'intelecto',
  ocultismo: 'intelecto',
  percepcao: 'intelecto',
  pontaria: 'agilidade',
  reflexos: 'agilidade',
  religiao: 'presenca',
  resistencia: 'vigor',
  sobrevivencia: 'vigor',
  tatica: 'intelecto',
  vontade: 'presenca',
}

const ATTRIBUTE_ROLL_HINTS = {
  agi: 'agilidade',
  agilidade: 'agilidade',
  for: 'forca',
  forca: 'forca',
  força: 'forca',
  força: 'forca',
  int: 'intelecto',
  intelecto: 'intelecto',
  pre: 'presenca',
  pres: 'presenca',
  presenca: 'presenca',
  presença: 'presenca',
  presença: 'presenca',
  vig: 'vigor',
  vigor: 'vigor',
}

const ACTION_VISUAL_COLORS = {
  ataque: '#f2a45f',
  instintiva: '#c9b7ff',
  item: '#d8a34d',
  passiva: '#9ee0b6',
  ritual: '#a78bfa',
  tecnica: '#74d6f2',
}

const FACTION_BY_PATH_MARKER = [
  ['(A)', 'faction-a'],
  ['(B)', 'faction-b'],
  ['(C)', 'faction-c'],
  ['(D)', 'faction-d'],
  ['(E)', 'faction-e'],
  ['(F)', 'faction-f'],
]

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .toLowerCase()
}

function slugify(value) {
  return normalizeText(value)
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function stripMarkdown(value) {
  return String(value ?? '')
    .replace(/^#+\s*/g, '')
    .replace(/[*_`]/g, '')
    .replace(/[🔑🎀🔪📘⚙️🌿🧬🗣️🛡️📊🎯❤️🎒🔥🌱🧠🔍📓🌀📈✨💠⚔️🩸👁️🫀]/gu, '')
    .replace(/[→•\-–—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanHeading(value) {
  return stripMarkdown(value)
    .replace(/^tipo\s*:?/i, '')
    .replace(/^efeito\s*:?/i, '')
    .trim()
}

function normalizeLine(value) {
  return normalizeText(value)
}

function splitLines(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
}

function walkFiles(rootPath) {
  const files = []

  function visit(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const nextPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        visit(nextPath)
      } else if (entry.isFile()) {
        files.push(nextPath)
      }
    }
  }

  visit(rootPath)
  return files
}

function isPotentialNpcLoreFile(filePath, text) {
  const basename = path.basename(filePath).toLowerCase()
  const normalizedPath = normalizeText(filePath)

  if (!/\.(txt|md)$/i.test(filePath)) return false
  if (basename.includes('todas as fichas')) return false
  if (basename.includes('conceito')) return false
  if (basename.includes('evento')) return false
  if (basename.includes('powerscaling')) return false
  if (basename.includes('regras importante')) return false
  if (basename.includes('thumb')) return false
  if (normalizedPath.includes('protagonista real corpo')) return false
  if (basename.includes('formulario')) return false

  const normalizedText = normalizeText(text)

  return (
    normalizedText.includes('atributos') &&
    normalizedText.includes('pericias') &&
    normalizedText.includes('status') &&
    (normalizedText.includes('habilidades') || normalizedText.includes('inventario'))
  )
}

function inferName(filePath, text) {
  const explicitNamePatterns = [
    /(?:^|\n)\s*(?:nome|nome oficial)\s*[:\-]\s*([^\n]+)/i,
    /(?:^|\n)\s*personagem\s*[:\-]\s*([^\n]+)/i,
  ]

  for (const pattern of explicitNamePatterns) {
    const match = pattern.exec(text)
    const value = cleanHeading(match?.[1] ?? '')

    if (value && !/^sem nome$/i.test(value)) return value
  }

  const folderName = path.basename(path.dirname(filePath))
  const fromFolder = cleanHeading(folderName.split('(')[0])

  if (fromFolder) return fromFolder

  return cleanHeading(path.basename(filePath, path.extname(filePath)).replace(/lore|ficha/gi, ''))
}

function inferFactionId(filePath) {
  const normalizedPath = filePath.replaceAll('/', '\\')
  const match = FACTION_BY_PATH_MARKER.find(([marker]) => normalizedPath.includes(marker))

  return match?.[1] ?? 'faction-d'
}

function findSectionIndex(lines, keywords, startAt = 0) {
  for (let index = startAt; index < lines.length; index += 1) {
    const normalized = normalizeLine(lines[index])

    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return index
    }
  }

  return -1
}

function matchesSectionHeading(line, keywords) {
  const trimmed = String(line ?? '').trim()
  const firstCodePoint = trimmed.codePointAt(0) ?? 0

  if (/^[-*â€¢â†’âžœ=>]/u.test(trimmed)) return false
  if (
    firstCodePoint === 0x2022 ||
    firstCodePoint === 0x2192 ||
    firstCodePoint === 0x279c
  ) return false

  const normalized = normalizeLine(line)

  return keywords.some((keyword) => normalized === keyword || normalized.startsWith(`${keyword} `))
}

function findSectionHeadingIndex(lines, keywords, startAt = 0) {
  for (let index = startAt; index < lines.length; index += 1) {
    if (matchesSectionHeading(lines[index], keywords)) {
      return index
    }
  }

  return -1
}

function sliceSection(lines, startKeywords, endKeywords, startAt = 0) {
  const startIndex = findSectionHeadingIndex(lines, startKeywords, startAt)

  if (startIndex < 0) return []

  return sliceSectionFromIndex(lines, startIndex, endKeywords)
}

function sliceSectionFromIndex(lines, startIndex, endKeywords) {
  let endIndex = lines.length

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (matchesSectionHeading(lines[index], endKeywords)) {
      endIndex = index
      break
    }
  }

  return lines.slice(startIndex + 1, endIndex)
}

function collectSections(lines, startKeywords, endKeywords) {
  const sections = []

  for (let index = 0; index < lines.length; index += 1) {
    if (!matchesSectionHeading(lines[index], startKeywords)) continue

    sections.push(sliceSectionFromIndex(lines, index, endKeywords))
  }

  return sections
}

function parseNumberAfterColon(line) {
  const match = /:\s*(-?\d+)/.exec(line)

  return match ? Number(match[1]) : null
}

function parseAttributes(lines) {
  const section = sliceSection(lines, ['atributos'], ['pericias', 'status', 'inventario'])
  const attributes = {}

  for (const line of section) {
    const normalized = normalizeLine(line)
    const key = Object.keys(ATTRIBUTE_KEYS).find((candidate) =>
      normalized.startsWith(candidate),
    )
    const value = parseNumberAfterColon(line)

    if (key && value !== null) {
      attributes[ATTRIBUTE_KEYS[key]] = value
    }
  }

  return {
    forca: attributes.forca ?? 0,
    agilidade: attributes.agilidade ?? 0,
    intelecto: attributes.intelecto ?? 0,
    presenca: attributes.presenca ?? 0,
    vigor: attributes.vigor ?? 0,
  }
}

function inferSkillAttribute(skillName) {
  const normalized = normalizeText(skillName)
  const directMatch = Object.entries(SKILL_ATTRIBUTE_HINTS).find(([key]) =>
    normalized.includes(key),
  )

  return directMatch?.[1] ?? 'intelecto'
}

function parseSkills(lines) {
  const section = sliceSection(lines, ['pericias'], ['status', 'inventario', 'habilidades'])
  const skills = []

  for (const line of section) {
    const trimmedLine = line.trim()
    const match = /^[-\s(]*([^:\n()]+?)\s*:\s*(-?\d+)/u.exec(trimmedLine)

    if (!match) continue

    const name = cleanHeading(match[1])

    if (!name || normalizeText(name) === 'total') continue

    skills.push({
      atributoBase: inferSkillAttribute(name),
      bonusPericia: Number(match[2]),
      nome: name,
      resumo: '',
    })
  }

  return skills
}

function parseFirstNumberNearLabel(lines, labelKeywords, options = {}) {
  const startIndex = findSectionIndex(lines, labelKeywords)

  if (startIndex < 0) return null

  const labelLine = lines[startIndex] ?? ''
  const sameLineValue = /:\s*[^\d-]*(-?\d+)/.exec(labelLine)

  if (sameLineValue) {
    return Number(sameLineValue[1])
  }

  const range = lines.slice(startIndex, Math.min(lines.length, startIndex + (options.lookahead ?? 4)))

  for (const line of range) {
    const afterEquals = /=\s*(-?\d+)/.exec(line)

    if (afterEquals) return Number(afterEquals[1])
  }

  for (const line of range) {
    const numbers = [...line.matchAll(/-?\d+/g)].map((match) => Number(match[0]))

    if (numbers.length > 0) {
      return numbers[0]
    }
  }

  return null
}

function parseStatusSection(statusSection) {
  const vida = parseFirstNumberNearLabel(statusSection, ['vida'], { lookahead: 4 })
  const fushi = parseFirstNumberNearLabel(statusSection, ['fushi'], { lookahead: 4 })
  const determinacao = parseFirstNumberNearLabel(statusSection, ['determinacao'], {
    lookahead: 4,
  })

  return {
    bloqueio: parseFirstNumberNearLabel(statusSection, ['bloqueio'], { lookahead: 4 }),
    defesa: parseFirstNumberNearLabel(statusSection, ['classe de armadura'], {
      lookahead: 4,
    }),
    deslocamento: (() => {
      const value = parseFirstNumberNearLabel(statusSection, ['deslocamento'], { lookahead: 4 })

      return value ? `${value} m` : undefined
    })(),
    esquiva: parseFirstNumberNearLabel(statusSection, ['esquiva'], {
      lookahead: 4,
    }),
    recursos: {
      determinacaoAtual: determinacao ?? 0,
      determinacaoMaxima: determinacao ?? 0,
      fushiAtual: fushi ?? 0,
      fushiMaximo: fushi ?? 0,
      vidaAtual: vida ?? 0,
      vidaMaxima: vida ?? 0,
    },
  }
}

function scoreParsedStatus(status) {
  return [
    status.recursos.vidaMaxima,
    status.recursos.fushiMaximo,
    status.recursos.determinacaoMaxima,
    status.defesa,
    status.bloqueio,
    status.esquiva,
  ].filter((value) => Number(value) > 0).length
}

function parseStatus(lines) {
  const sections = collectSections(lines, ['status'], ['inventario', 'habilidades', 'rituais'])
  const parsedStatuses = sections.map(parseStatusSection)

  if (parsedStatuses.length === 0) {
    return parseStatusSection([])
  }

  return parsedStatuses
    .map((status, index) => ({
      index,
      score: scoreParsedStatus(status),
      status,
    }))
    .sort((left, right) => right.score - left.score || right.index - left.index)[0].status
}

function isValidProtectionCandidate(value) {
  const normalized = normalizeText(value)

  if (!value || value.length > 140) return false
  if (
    /^(bloqueio|esquiva|classe de armadura|deslocamento|inventario|habilidades|rituais|status|regras?)\b/.test(
      normalized,
    )
  ) return false

  return (
    normalized.includes('protecao') ||
    normalized.includes('armadura') ||
    normalized.includes('manto') ||
    normalized.includes('traje') ||
    normalized.includes('roupa') ||
    normalized.includes('jaqueta') ||
    normalized.includes('escudo') ||
    normalized.includes('couro') ||
    /(?:^|\s)ca(?:\s|$)/.test(normalized) ||
    /\+\s*\d+\s*ca/.test(normalized)
  )
}

function parseProtection(lines) {
  const index = findSectionHeadingIndex(lines, ['protecao'])

  if (index < 0) return ''

  const sameLine = lines[index].split(':').slice(1).join(':').trim()

  if (isValidProtectionCandidate(cleanHeading(sameLine))) {
    return cleanHeading(sameLine)
  }

  for (let offset = 1; offset <= 3; offset += 1) {
    const candidate = cleanHeading(lines[index + offset] ?? '')

    if (isValidProtectionCandidate(candidate)) return candidate
  }

  return ''
}

function isHeadingLine(line) {
  const trimmed = line.trim()
  const normalized = normalizeLine(trimmed)
  const firstCodePoint = trimmed.codePointAt(0) ?? 0

  if (!trimmed) return false

  if (/^[-*•→➜=>]/u.test(trimmed)) return false
  if (
    /^(tipo|custo|ativacao|efeito|duracao|limitacao|limite|bonus|buffs|uso|passivo|pericia|dano|se acertar|para escapar|sucesso|falha|descricao|risco narrativo|regras?|condicao|pos uso|area|objetivo|status|inventario|atributos|pericias|habilidades(?:\b|$)|mecanica central|fogo|agua|terra|ar)\b/i.test(
      normalized,
    )
  ) {
    return false
  }

  if (/^#{1,6}\s+/.test(trimmed)) return true

  const startsWithEmojiOrSymbol =
    firstCodePoint > 0xffff ||
    (firstCodePoint >= 0x2300 && firstCodePoint <= 0x23ff) ||
    (firstCodePoint >= 0x2600 && firstCodePoint <= 0x27bf) ||
    (firstCodePoint >= 0x1f300 && firstCodePoint <= 0x1faff)

  if (startsWithEmojiOrSymbol && /\p{Letter}/u.test(trimmed)) {
    return true
  }

  return false
}

function isStopSectionLine(line, stopKeywords) {
  const normalized = normalizeLine(line)

  if (!stopKeywords.some((keyword) => normalized.includes(keyword))) return false
  if (isHeadingLine(line)) return true

  const compact = cleanHeading(line)

  return compact === compact.toUpperCase() && compact.length <= 48
}

function parseNamedBlocks(sectionLines) {
  const blocks = []
  let current = null

  for (const line of sectionLines) {
    if (isHeadingLine(line)) {
      if (current) blocks.push(current)
      current = {
        body: [],
        name: cleanHeading(line),
      }
      continue
    }

    if (current) {
      current.body.push(line)
    }
  }

  if (current) blocks.push(current)

  return blocks.filter((block) => block.name)
}

function parseInventory(lines) {
  const section = sliceSection(lines, ['inventario'], ['habilidades', 'rituais'])
  const blocks = parseNamedBlocks(section)

  return blocks.map((block, index) => ({
    descricao: block.body.join('\n').trim(),
    efeitos: block.body
      .map((line) => cleanHeading(line))
      .filter((line) => line && !/^(tipo|pericia|dano|uso)$/i.test(line))
      .slice(0, 8),
    id: `item-${index + 1}-${slugify(block.name)}`,
    nome: block.name,
  }))
}

function parseCosts(line) {
  const normalized = normalizeText(line)

  if (!normalized.includes('custo')) return []

  return parseResourceCosts(line)
}

function parseResourceCosts(line) {
  const costs = []
  const resourcePattern = /(\d+)\s*(fushi|determina(?:c|ç)(?:a|ã)o|vida|pv|hp)\b/giu
  let match = resourcePattern.exec(line)

  while (match) {
    const resourceText = normalizeText(match[2])
    const resource = resourceText.includes('determinacao')
      ? 'determinacao'
      : resourceText.includes('vida') || resourceText === 'pv' || resourceText === 'hp'
        ? 'vida'
        : 'fushi'

    costs.push({
      amount: Number(match[1]),
      resource,
    })
    match = resourcePattern.exec(line)
  }

  return costs
}

function parseCostsFromLines(lines) {
  const costs = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const lineCosts = parseCosts(line)

    if (lineCosts.length > 0) {
      costs.push(...lineCosts)
      continue
    }

    if (!normalizeText(line).startsWith('custo')) continue

    for (let offset = 1; offset <= 3; offset += 1) {
      const nextLine = lines[index + offset] ?? ''
      const nextCosts = parseResourceCosts(nextLine)

      if (nextCosts.length > 0) {
        costs.push(...nextCosts)
      }
    }
  }

  const seen = new Set()

  return costs.filter((cost) => {
    const key = `${cost.resource}:${cost.amount}`

    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function parseFeatureKind(block) {
  const typeLine = block.body.find((line) => normalizeLine(line).startsWith('tipo'))
  const normalized = normalizeLine(`${typeLine ?? ''} ${block.name}`)

  if (normalized.includes('passiva')) return 'passiva'
  if (normalized.includes('instintiva')) return 'instintiva'
  if (
    normalized.includes('dominio') ||
    normalized.includes('expansao') ||
    normalized.includes('lendaria') ||
    normalized.includes('ritual')
  ) return 'ritual'
  if (normalized.includes('ritual')) return 'ritual'
  if (normalized.includes('ataque')) return 'ataque'
  if (normalized.includes('item')) return 'item'

  return 'tecnica'
}

function findAttributeInText(text) {
  const normalized = normalizeText(text)

  return Object.entries(ATTRIBUTE_ROLL_HINTS).find(([label]) =>
    normalized.includes(normalizeText(label)),
  )?.[1] ?? null
}

function findSkillBonusInText(text, skills) {
  const normalized = normalizeText(text)
  const directSkill = skills.find((skill) => normalized.includes(normalizeText(skill.nome)))

  return directSkill?.bonusPericia ?? 0
}

function buildAttributeRollConfig(attributeValue, bonus) {
  if (attributeValue <= 0) {
    return {
      bonus,
      modo: 'lowest',
      quantidadeDados: 2,
      tipoDado: 20,
    }
  }

  return {
    bonus,
    modo: 'highest',
    quantidadeDados: Math.max(1, attributeValue),
    tipoDado: 20,
  }
}

function parseRollFromBlock(block, context) {
  const lines = block.body.map((line) => line.trim()).filter(Boolean)
  const attackLine = lines.find((line) => {
    const normalized = normalizeText(line)

    return normalized.includes('d20') && (
      normalized.includes(' vs ') ||
      normalized.includes(' dt ') ||
      normalized.includes(' ca') ||
      normalized.includes(' + ')
    )
  })

  if (attackLine) {
    const attribute = findAttributeInText(attackLine)
    const attributeValue = attribute ? context.attributes[attribute] ?? 1 : 1
    const bonus = findSkillBonusInText(attackLine, context.skills)

    return {
      ...buildAttributeRollConfig(attributeValue, bonus),
      contexto: block.name,
      visibility: 'public',
      visualColor: ACTION_VISUAL_COLORS[context.kind] ?? ACTION_VISUAL_COLORS.tecnica,
    }
  }

  const diceLine = lines.find((line) => /(?:^|[^\w])(\d*)d(\d+)(?:[^\w]|$)/i.test(line))

  if (!diceLine) return undefined

  const diceMatch = /(?:^|[^\w])(\d*)d(\d+)(?:[^\w]|$)/i.exec(diceLine)

  if (!diceMatch) return undefined

  const attribute = findAttributeInText(diceLine)
  const bonus = attribute ? context.attributes[attribute] ?? 0 : 0

  return {
    bonus,
    contexto: block.name,
    modo: 'sum',
    quantidadeDados: Math.max(1, Number(diceMatch[1] || 1)),
    tipoDado: Math.max(2, Number(diceMatch[2])),
    visibility: 'public',
    visualColor: ACTION_VISUAL_COLORS[context.kind] ?? ACTION_VISUAL_COLORS.tecnica,
  }
}

function parseFieldFollowingLabel(block, label) {
  const normalizedLabel = normalizeText(label)
  const index = block.body.findIndex((line) => normalizeLine(line).startsWith(normalizedLabel))

  if (index < 0) return ''

  const sameLine = block.body[index].split(':').slice(1).join(':').trim()

  if (sameLine) return cleanHeading(sameLine)

  for (let offset = 1; offset <= 3; offset += 1) {
    const candidate = cleanHeading(block.body[index + offset] ?? '')

    if (candidate) return candidate
  }

  return ''
}

function parseFeatureSection(lines, startKeywords, context) {
  const start = findSectionHeadingIndex(lines, startKeywords)

  if (start < 0) return []

  const stopKeywords = [
    'comportamento',
    'conflitos',
    'consequencias',
    'frase guia',
    'gatilhos',
    'interacoes',
    'interacao',
    'notas do mestre',
    'papel narrativo',
    'plot',
    'relacao',
    'rituais',
    'ritual',
    'uso narrativo',
  ]
  const end = (() => {
    for (let index = start + 1; index < lines.length; index += 1) {
      if (isStopSectionLine(lines[index], stopKeywords)) {
        return index
      }
    }

    return lines.length
  })()
  const section = lines.slice(start + 1, end)
  const blocks = parseNamedBlocks(section)

  return blocks.map((block, index) => {
    const kind = parseFeatureKind(block)
    const costs = parseCostsFromLines(block.body)
    const roll = parseRollFromBlock(block, {
      attributes: context.attributes,
      kind,
      skills: context.skills,
    })
    const activation = parseFieldFollowingLabel(block, 'ativacao')
    const duration = parseFieldFollowingLabel(block, 'duracao')
    const limit = parseFieldFollowingLabel(block, 'limitacao') || parseFieldFollowingLabel(block, 'limite')
    const visualColor = ACTION_VISUAL_COLORS[kind] ?? ACTION_VISUAL_COLORS.tecnica

    return {
      automation: {
        activation: activation || undefined,
        costs,
        duration: duration || undefined,
        kind,
        limit: limit || undefined,
        publicText: `${context.name} ativou ${block.name}.`,
        gmText: `${context.name} ativou ${block.name}.`,
        roll,
        tags: block.body
          .map((line) => cleanHeading(line))
          .filter((line) => /(\+|-)\s*\d|dt|dado|ca|turno|acao/i.test(line))
          .slice(0, 8),
        visualColor,
      },
      descricao: block.body.join('\n').trim(),
      id: `feature-${index + 1}-${slugify(block.name)}`,
      nome: block.name,
      tipo: kind,
    }
  })
}

function parseFeatures(lines, context) {
  return parseFeatureSection(lines, ['habilidades'], context)
}

function parseRituals(lines, context) {
  return parseFeatureSection(lines, ['rituais'], context).map((ritual) => ({
    ...ritual,
    automation: {
      ...ritual.automation,
      kind: 'ritual',
      visualColor: ACTION_VISUAL_COLORS.ritual,
    },
    tipo: 'ritual',
  }))
}

function parseLoreNpcText(text, filePath = '') {
  const lines = splitLines(text)
  const name = inferName(filePath, text)
  const attributes = parseAttributes(lines)
  const status = parseStatus(lines)
  const skills = parseSkills(lines)
  const inventory = parseInventory(lines)
  const featureContext = { attributes, name, skills }
  const parsedFeatures = parseFeatures(lines, featureContext)
  const parsedRituals = parseRituals(lines, featureContext)
  const features = parsedFeatures.filter((feature) => feature.tipo !== 'ritual')
  const ritualsFromFeatures = parsedFeatures.filter((feature) => feature.tipo === 'ritual')
  const rituals = [...ritualsFromFeatures, ...parsedRituals]
  const idSlug = slugify(name || path.basename(filePath, path.extname(filePath)))

  return {
    appDraft: {
      ataques: [],
      atributos: attributes,
      bloqueio: status.bloqueio ?? undefined,
      defesa: status.defesa ?? 10,
      deslocamento: status.deslocamento,
      esquiva: status.esquiva ?? undefined,
      faccao: inferFactionId(filePath),
      habilidades: features.map((feature) => feature.nome),
      habilidadesDetalhadas: features,
      id: `lore-${idSlug}`,
      inventario: inventory.map((item) => item.nome),
      inventarioDetalhado: inventory,
      localAtual: '',
      nome: name,
      notas: `Importado da lore: ${filePath}`,
      pericias: skills.map((skill, index) => ({
        ...skill,
        id: `skill-${index + 1}-${slugify(skill.nome)}`,
      })),
      protecao: parseProtection(lines) || undefined,
      recursos: status.recursos,
      rituais: rituals,
      rolagemBase: {
        quantidadeDados: Math.max(1, ...Object.values(attributes)),
        tipoDado: 20,
        bonus: 0,
        modo: 'highest',
      },
      status: ['Pendente revisao'],
      tipo: 'npc',
      tone: 'steady',
    },
    attributes,
    factionId: inferFactionId(filePath),
    features,
    filePath,
    inventory,
    name,
    rituals,
    skills,
    status,
  }
}

function parseLoreNpcFile(filePath) {
  const text = readUtf8(filePath)

  if (!isPotentialNpcLoreFile(filePath, text)) {
    return null
  }

  return parseLoreNpcText(text, filePath)
}

function parseLoreNpcDirectory(rootPath) {
  return walkFiles(rootPath)
    .map((filePath) => parseLoreNpcFile(filePath))
    .filter(Boolean)
}

module.exports = {
  normalizeText,
  parseLoreNpcDirectory,
  parseLoreNpcFile,
  parseLoreNpcText,
  slugify,
}
