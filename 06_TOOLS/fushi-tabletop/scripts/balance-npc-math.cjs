const fs = require('node:fs')
const path = require('node:path')
const { normalizeText } = require('./lib/lore-npc-parser.cjs')
const {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
  writeWorkspaceState,
} = require('./lib/fushi-workspace-io.cjs')

const projectRoot = process.cwd()
const workspacePath = process.env.FUSHI_WORKSPACE_PATH || getDefaultWorkspacePath()
const autosavePath = process.env.FUSHI_AUTOSAVE_PATH || getDefaultAutosavePath(projectRoot)
const outputDirectory = process.env.FUSHI_NPC_AUDIT_OUT ||
  path.join(projectRoot, 'docs', 'fushi-system')
const planPath = path.join(outputDirectory, 'NPC_MATH_BALANCE_PLAN.json')
const reportPath = path.join(outputDirectory, 'NPC_MATH_BALANCE_REPORT.md')

const POWER_RULES = {
  Basico: { minimumCa: 16, minimumDt: 20 },
  Avancado: { minimumCa: 20, minimumDt: 25 },
  Ascensao: { minimumCa: 25, minimumDt: 30 },
  Cataclisma: {
    cataclysmDamageAverage: 3 * 6.5 + 10,
    cataclysmDamageFormula: '3d12 + 10',
    minimumCa: 30,
    minimumDt: 32,
  },
}

const ATTRIBUTE_ALIASES = new Map(
  Object.entries({
    agi: 'agilidade',
    agilidade: 'agilidade',
    for: 'forca',
    forca: 'forca',
    int: 'intelecto',
    intelecto: 'intelecto',
    pre: 'presenca',
    pres: 'presenca',
    presenca: 'presenca',
    vig: 'vigor',
    vigor: 'vigor',
  }).map(([key, value]) => [normalizeText(key), value]),
)

function hasArg(name) {
  return process.argv.includes(`--${name}`)
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value))
}

function getCharacters(workspace) {
  if (Array.isArray(workspace.characters)) return workspace.characters
  if (Array.isArray(workspace.characters?.items)) return workspace.characters.items
  return []
}

function setCharacters(workspace, characters) {
  if (Array.isArray(workspace.characters)) return { ...workspace, characters }
  return { ...workspace, characters: { ...workspace.characters, items: characters } }
}

function getResource(character, key) {
  return Number(character.recursos?.[key] ?? 0) || 0
}

function inferPowerLevel(character) {
  const normalized = normalizeText([
    ...(character.status ?? []),
    character.notas ?? '',
    character.combatRole ?? '',
    character.nivelPoder ?? '',
    character.tier ?? '',
  ].join(' '))
  const vida = getResource(character, 'vidaMaxima')
  const fushi = getResource(character, 'fushiMaximo')
  const determinacao = getResource(character, 'determinacaoMaxima')

  if (
    normalized.includes('cataclisma') ||
    vida >= 450 ||
    fushi >= 150 ||
    determinacao >= 100
  ) return 'Cataclisma'

  if (
    normalized.includes('ascensao') ||
    normalized.includes('ascendente') ||
    vida >= 250 ||
    fushi >= 100 ||
    determinacao >= 40
  ) return 'Ascensao'

  if (
    normalized.includes('avancado') ||
    normalized.includes('avancada') ||
    vida >= 100 ||
    fushi >= 60 ||
    determinacao >= 25
  ) return 'Avancado'

  return 'Basico'
}

function findSkillBonus(character, skillName) {
  const normalizedName = normalizeText(skillName)
  const skill = (character.pericias ?? []).find((item) =>
    normalizeText(item.nome) === normalizedName
  )
  return Number(skill?.bonusPericia ?? 0) || 0
}

function findSkillMentionBonus(character, text) {
  const normalized = normalizeText(text)
  const matches = (character.pericias ?? [])
    .filter((skill) => {
      const normalizedSkill = normalizeText(skill.nome)
      return normalizedSkill && normalized.includes(normalizedSkill)
    })
    .sort((left, right) => normalizeText(right.nome).length - normalizeText(left.nome).length)

  return Number(matches[0]?.bonusPericia ?? 0) || 0
}

function findAttributeMention(text) {
  const tokens = normalizeText(text).split(/\s+/).filter(Boolean)

  for (const token of tokens) {
    const attribute = ATTRIBUTE_ALIASES.get(token)
    if (attribute) return attribute
  }

  return null
}

function buildAttributeRoll(attributeValue, bonus, visualColor, contextLabel) {
  if (attributeValue <= 0) {
    return {
      bonus,
      contexto: contextLabel,
      modo: 'lowest',
      quantidadeDados: 2,
      tipoDado: 20,
      visibility: 'public',
      visualColor,
    }
  }

  return {
    bonus,
    contexto: contextLabel,
    modo: 'highest',
    quantidadeDados: Math.max(1, attributeValue),
    tipoDado: 20,
    visibility: 'public',
    visualColor,
  }
}

function getActionTextLines(feature) {
  const automation = feature.automation ?? {}
  return [
    automation.activation,
    feature.descricao,
    ...(automation.tags ?? []),
  ]
    .filter(Boolean)
    .join('\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function findD20Line(feature) {
  return getActionTextLines(feature).find((line) => {
    const normalized = normalizeText(line)
    return normalized.includes('d20') && (
      normalized.includes(' vs ') ||
      normalized.includes(' ca') ||
      normalized.includes(' dt ') ||
      normalized.includes(' + ')
    )
  }) ?? ''
}

function normalizeFeatureRoll(character, feature) {
  const line = findD20Line(feature)
  if (!line) return null

  const attribute = findAttributeMention(line)
  if (!attribute) return null

  const attributeValue = Number(character.atributos?.[attribute] ?? 0) || 0
  const bonus = findSkillMentionBonus(character, line)
  const visualColor =
    feature.automation?.roll?.visualColor ||
    feature.automation?.visualColor ||
    '#74d6f2'

  return buildAttributeRoll(attributeValue, bonus, visualColor, feature.nome)
}

function rollSignature(roll) {
  if (!roll) return ''
  return JSON.stringify({
    bonus: roll.bonus ?? 0,
    modo: roll.modo ?? 'highest',
    quantidadeDados: roll.quantidadeDados,
    tipoDado: roll.tipoDado,
  })
}

function replaceDifficultyText(value, minimumDt) {
  if (typeof value !== 'string') return value
  return value.replace(/\bDT\s*(\d{1,3})\b/gi, (match, rawValue) => {
    const current = Number(rawValue)
    if (!Number.isFinite(current) || current >= minimumDt) return match
    return match.replace(String(rawValue), String(minimumDt))
  })
}

function averageDice(quantity, sides, bonus = 0) {
  return quantity * ((sides + 1) / 2) + bonus
}

function replaceCataclysmDamageText(value, powerLevel) {
  if (typeof value !== 'string' || powerLevel !== 'Cataclisma') return value
  const rule = POWER_RULES.Cataclisma

  return value.replace(
    /\b(\d+)d(\d+)(?:\s*\+\s*(\d+))?(\s+dano\b)/gi,
    (match, rawQuantity, rawSides, rawBonus, suffix) => {
      const quantity = Number(rawQuantity)
      const sides = Number(rawSides)
      const bonus = Number(rawBonus ?? 0)
      if (!Number.isFinite(quantity) || !Number.isFinite(sides)) return match
      if (averageDice(quantity, sides, bonus) >= rule.cataclysmDamageAverage) return match
      return `${rule.cataclysmDamageFormula}${suffix}`
    },
  )
}

function normalizeMathText(value, powerLevel, minimumDt) {
  return replaceCataclysmDamageText(
    replaceDifficultyText(value, minimumDt),
    powerLevel,
  )
}

function normalizeAutomationText(automation, powerLevel, minimumDt) {
  if (!automation) return automation
  return {
    ...automation,
    activation: normalizeMathText(automation.activation, powerLevel, minimumDt),
    duration: normalizeMathText(automation.duration, powerLevel, minimumDt),
    gmText: normalizeMathText(automation.gmText, powerLevel, minimumDt),
    limit: normalizeMathText(automation.limit, powerLevel, minimumDt),
    publicText: normalizeMathText(automation.publicText, powerLevel, minimumDt),
    range: normalizeMathText(automation.range, powerLevel, minimumDt),
    target: normalizeMathText(automation.target, powerLevel, minimumDt),
    tags: automation.tags?.map((tag) => normalizeMathText(tag, powerLevel, minimumDt)),
  }
}

function normalizeFeatureMath(character, feature, powerLevel, minimumDt, changes) {
  const before = cloneValue(feature)
  const nextFeature = {
    ...feature,
    descricao: normalizeMathText(feature.descricao, powerLevel, minimumDt),
    automation: normalizeAutomationText(feature.automation, powerLevel, minimumDt),
  }
  const nextRoll = normalizeFeatureRoll(character, nextFeature)

  if (nextRoll) {
    nextFeature.automation = {
      ...(nextFeature.automation ?? {}),
      roll: { ...(nextFeature.automation?.roll ?? {}), ...nextRoll },
    }
  }

  if (JSON.stringify(before) !== JSON.stringify(nextFeature)) {
    const featureChanges = []
    if (before.descricao !== nextFeature.descricao) featureChanges.push('texto numerico')
    if (rollSignature(before.automation?.roll) !== rollSignature(nextFeature.automation?.roll)) {
      featureChanges.push(
        `rolagem ${rollSignature(before.automation?.roll) || 'sem roll'} -> ${rollSignature(nextFeature.automation?.roll)}`,
      )
    }
    if (JSON.stringify(before.automation?.tags ?? []) !== JSON.stringify(nextFeature.automation?.tags ?? [])) {
      featureChanges.push('tags numericas')
    }
    if (before.automation?.activation !== nextFeature.automation?.activation) {
      featureChanges.push('ativacao numerica')
    }
    changes.push(`${feature.nome}: ${featureChanges.join(', ')}`)
  }

  return nextFeature
}

function applyCharacterMath(character) {
  const nextCharacter = cloneValue(character)
  const changes = []
  const warnings = []
  const powerLevel = inferPowerLevel(nextCharacter)
  const rule = POWER_RULES[powerLevel]
  const isMob = nextCharacter.tipo === 'mob'

  if (!isMob && Number(nextCharacter.defesa ?? 0) < rule.minimumCa) {
    changes.push(`CA ${nextCharacter.defesa ?? 0} -> ${rule.minimumCa}`)
    nextCharacter.defesa = rule.minimumCa
  }

  if (!isMob) {
    const expectedBlock = Math.floor((Number(nextCharacter.defesa ?? 0) || 0) / 2)
    if (Number(nextCharacter.bloqueio ?? 0) !== expectedBlock) {
      changes.push(`Bloqueio ${nextCharacter.bloqueio ?? 0} -> ${expectedBlock}`)
      nextCharacter.bloqueio = expectedBlock
    }
  }

  if (!isMob || Number(nextCharacter.esquiva ?? 0) > 0) {
    const reflexos = findSkillBonus(nextCharacter, 'Reflexos')
    const expectedDodge =
      (Number(nextCharacter.defesa ?? 0) || 0) +
      (Number(nextCharacter.atributos?.agilidade ?? 0) || 0) +
      reflexos
    if (Number(nextCharacter.esquiva ?? 0) !== expectedDodge) {
      changes.push(`Esquiva ${nextCharacter.esquiva ?? 0} -> ${expectedDodge}`)
      nextCharacter.esquiva = expectedDodge
    }
  }

  nextCharacter.habilidadesDetalhadas = (nextCharacter.habilidadesDetalhadas ?? []).map((feature) =>
    normalizeFeatureMath(nextCharacter, feature, powerLevel, rule.minimumDt, changes),
  )
  nextCharacter.rituais = (nextCharacter.rituais ?? []).map((feature) =>
    normalizeFeatureMath(nextCharacter, feature, powerLevel, rule.minimumDt, changes),
  )

  if (powerLevel === 'Ascensao' && getResource(nextCharacter, 'vidaMaxima') > 0 && getResource(nextCharacter, 'vidaMaxima') < 250) {
    warnings.push('Ascensao com Vida abaixo de 250; mantido por seguranca autoral.')
  }
  if (powerLevel === 'Cataclisma' && getResource(nextCharacter, 'vidaMaxima') > 0 && getResource(nextCharacter, 'vidaMaxima') < 450) {
    warnings.push('Cataclisma com Vida abaixo de 450; mantido por poder de fase/evento.')
  }

  return { changes, nextCharacter, powerLevel, warnings }
}

function renderReport(plan, input) {
  const changed = plan.filter((item) => item.changes.length > 0)
  const warnings = plan.flatMap((item) =>
    item.warnings.map((warning) => ({ character: item.name, warning })),
  )
  const lines = [
    '# FUSHI NPC Math Balance Report',
    '',
    `Gerado em: ${new Date().toISOString()}`,
    `Modo: ${input.write ? 'APLICADO' : 'DRY-RUN'}`,
    `Workspace fonte: ${input.workspaceSource}`,
    input.backupPath ? `Backup: ${input.backupPath}` : 'Backup: nao criado em dry-run',
    '',
    '## Regras de seguranca',
    '',
    '- Nao altera nome, conceito, lore, imagem, permissao, vinculo ou identidade do poder.',
    '- Aplica apenas matematica: CA minima por escala, Bloqueio derivado, Esquiva derivada, DT minima por escala e rolagem atributo/pericia.',
    '- Atributo define quantidade de d20; pericia entra como bonus fixo.',
    '- Dano Cataclisma direto com dado abaixo da base `3d12 + 10` sobe para essa base sem mudar o conceito do poder.',
    '- Vida/FUSHI/Determinacao abaixo da faixa ficam apenas como aviso para nao reescrever personagem autoral sem revisao individual.',
    '',
    '## Resumo',
    '',
    `- Fichas analisadas: ${plan.length}`,
    `- Fichas com alteracao matematica: ${changed.length}`,
    `- Avisos preservados: ${warnings.length}`,
    '',
  ]

  if (changed.length > 0) {
    lines.push('## Alteracoes')
    lines.push('')
    changed.forEach((item) => {
      lines.push(`### ${item.name}`)
      lines.push('')
      lines.push(`- Tipo: ${item.type}`)
      lines.push(`- Nivel de Poder usado: ${item.powerLevel}`)
      item.changes.forEach((change) => lines.push(`- ${change}`))
      lines.push('')
    })
  }

  if (warnings.length > 0) {
    lines.push('## Avisos Mantidos')
    lines.push('')
    warnings.forEach((item) => {
      lines.push(`- ${item.character}: ${item.warning}`)
    })
    lines.push('')
  }

  return `${lines.join('\n')}\n`
}

function main() {
  const write = hasArg('write')
  const snapshot = readWorkspaceState({ autosavePath, projectRoot, workspacePath })
  if (!snapshot.workspace) throw new Error(`Workspace invalido ou vazio: ${snapshot.sourcePath}`)

  const originalCharacters = getCharacters(snapshot.workspace)
  const plan = []
  const nextCharacters = originalCharacters.map((character) => {
    if (character.tipo !== 'npc' && character.tipo !== 'mob') return cloneValue(character)

    const result = applyCharacterMath(character)
    plan.push({
      changes: result.changes,
      id: character.id,
      name: character.nome,
      powerLevel: result.powerLevel,
      type: character.tipo,
      warnings: result.warnings,
    })
    return result.nextCharacter
  })
  const nextWorkspace = setCharacters(snapshot.workspace, nextCharacters)

  fs.mkdirSync(outputDirectory, { recursive: true })
  fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8')

  let backupPath = null
  if (write) {
    const result = writeWorkspaceState({
      backupLabel: 'workspace.backup-before-npc-math-balance',
      workspace: nextWorkspace,
      workspacePath: snapshot.sourceType === 'workspace' ? snapshot.sourcePath : workspacePath,
    })
    backupPath = result.backupPath
  }

  fs.writeFileSync(
    reportPath,
    renderReport(plan, {
      backupPath,
      workspaceSource: `${snapshot.sourcePath} (${snapshot.sourceType})`,
      write,
    }),
    'utf8',
  )

  console.log(
    `NPC math balance ${write ? 'APLICADO' : 'DRY-RUN'}: ${plan.length} fichas, ` +
      `${plan.filter((item) => item.changes.length > 0).length} alteradas.`,
  )
  if (backupPath) console.log(`Backup: ${backupPath}`)
  console.log(`Plano: ${planPath}`)
  console.log(`Relatorio: ${reportPath}`)
}

main()
