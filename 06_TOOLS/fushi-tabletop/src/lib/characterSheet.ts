import type {
  CharacterActionAutomation,
  CharacterDescription,
  CharacterFeatureDetail,
  CharacterInventoryItem,
  CharacterSheet,
} from '../data/types'
import { createAttributeRollConfig } from './rolls'
import { createDefaultSkills, ensureGeneralSkills } from './skillCatalog'

function buildId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function buildFeatureDetails(items: string[]): CharacterFeatureDetail[] {
  return items.map((item, index) => ({
    id: `detail-${index + 1}`,
    nome: item,
    descricao: '',
  }))
}

function buildInventoryDetails(items: string[]): CharacterInventoryItem[] {
  return items.map((item, index) => ({
    id: `item-${index + 1}`,
    nome: item,
    descricao: '',
    efeitos: [],
  }))
}

function cloneFeatureAutomation(
  automation?: CharacterActionAutomation,
): CharacterActionAutomation | undefined {
  if (!automation) {
    return undefined
  }

  return {
    ...automation,
    costs: automation.costs?.map((cost) => ({ ...cost })),
    effects: automation.effects?.map((effect) => ({ ...effect })),
    roll: automation.roll ? { ...automation.roll } : undefined,
    tags: automation.tags ? [...automation.tags] : undefined,
  }
}

function cloneFeatureDetail(item: CharacterFeatureDetail): CharacterFeatureDetail {
  return {
    ...item,
    automation: cloneFeatureAutomation(item.automation),
  }
}

function normalizeFeatureDetail(item: CharacterFeatureDetail): CharacterFeatureDetail {
  const automation = cloneFeatureAutomation(item.automation)

  return {
    ...item,
    nome: item.nome.trim(),
    descricao: item.descricao.trim(),
    automation: automation
      ? {
          ...automation,
          activation: automation.activation?.trim() || undefined,
          target: automation.target?.trim() || undefined,
          range: automation.range?.trim() || undefined,
          duration: automation.duration?.trim() || undefined,
          limit: automation.limit?.trim() || undefined,
          publicText: automation.publicText?.trim() || undefined,
          gmText: automation.gmText?.trim() || undefined,
          visualColor: automation.visualColor?.trim() || undefined,
          tags: automation.tags?.map((tag) => tag.trim()).filter(Boolean),
          costs: automation.costs
            ?.map((cost) => ({
              ...cost,
              amount: Math.max(0, Math.floor(cost.amount)),
              label: cost.label?.trim() || undefined,
            }))
            .filter((cost) => cost.amount > 0),
          effects: automation.effects
            ?.map((effect) => {
              if (effect.type === 'resource') {
                return {
                  ...effect,
                  amount: Math.trunc(effect.amount),
                  label: effect.label?.trim() || undefined,
                  target: effect.target ?? 'self',
                }
              }

              return {
                ...effect,
                label: effect.label?.trim() || undefined,
                mode: effect.mode ?? 'add',
                status: effect.status.trim(),
                target: effect.target ?? 'self',
              }
            })
            .filter((effect) =>
              effect.type === 'resource'
                ? effect.amount !== 0
                : Boolean(effect.status.trim()),
            ),
          roll: automation.roll
            ? {
                ...automation.roll,
                quantidadeDados: Math.max(1, Math.floor(automation.roll.quantidadeDados)),
                tipoDado: Math.max(2, Math.floor(automation.roll.tipoDado)),
                bonus: automation.roll.bonus ?? 0,
                contexto: automation.roll.contexto?.trim() || undefined,
                visualColor: automation.roll.visualColor?.trim() || undefined,
              }
            : undefined,
        }
      : undefined,
  }
}

export function getCharacterDescription(
  character: CharacterSheet,
): CharacterDescription {
  return (
    character.descricao ?? {
      historia: character.notas,
      objetivo: '',
      aparencia: '',
      personalidade: '',
    }
  )
}

export function prepareCharacterForEditing(character: CharacterSheet): CharacterSheet {
  const description = character.descricao ?? {
    historia: '',
    objetivo: '',
    aparencia: '',
    personalidade: '',
  }

  return {
    ...character,
    avatarUrl: character.avatarUrl ?? '',
    tokenImageUrl: character.tokenImageUrl ?? '',
    tokenSize: character.tokenSize ?? 1,
    jogador: character.jogador ?? '',
    classe: character.classe ?? '',
    origem: character.origem ?? '',
    tier: character.tier ?? 0,
    combatRole: character.combatRole ?? '',
    nivel: character.nivel ?? 1,
    deslocamento: character.deslocamento ?? '9 m',
    bloqueio: character.bloqueio ?? 0,
    esquiva: character.esquiva ?? 0,
    protecao: character.protecao ?? '',
    resistencia: character.resistencia ?? '',
    proficiencias: [...(character.proficiencias ?? [])],
    habilidadesDetalhadas:
      character.habilidadesDetalhadas && character.habilidadesDetalhadas.length > 0
        ? character.habilidadesDetalhadas.map(cloneFeatureDetail)
        : buildFeatureDetails(character.habilidades),
    rituais: (character.rituais ?? []).map(cloneFeatureDetail),
    inventarioDetalhado:
      character.inventarioDetalhado && character.inventarioDetalhado.length > 0
        ? character.inventarioDetalhado.map((item) => ({
            ...item,
            efeitos: [...item.efeitos],
          }))
        : buildInventoryDetails(character.inventario),
    descricao: {
      historia: description.historia ?? '',
      objetivo: description.objetivo ?? '',
      aparencia: description.aparencia ?? '',
      personalidade: description.personalidade ?? '',
    },
    sharedBody: character.sharedBody ? { ...character.sharedBody } : undefined,
    permissions: character.permissions
      ? {
          ...character.permissions,
          tokenControl: {
            ...character.permissions.tokenControl,
            controlledByPlayerIds: [
              ...character.permissions.tokenControl.controlledByPlayerIds,
            ],
          },
        }
      : undefined,
    status: [...character.status],
    pericias: ensureGeneralSkills(character.pericias).map((skill) => ({ ...skill })),
    ataques: character.ataques.map((attack) => ({ ...attack })),
    atributos: { ...character.atributos },
    recursos: { ...character.recursos },
    rolagemBase: { ...character.rolagemBase },
  }
}

export function getCharacterSheetModel(character: CharacterSheet) {
  const mergedSkills = ensureGeneralSkills(character.pericias)

  return {
    ...character,
    avatarUrl: character.avatarUrl?.trim() ?? '',
    tokenImageUrl: character.tokenImageUrl?.trim() ?? '',
    tokenSize: character.tokenSize ?? 1,
    jogador: character.jogador?.trim() || 'Sem jogador',
    classe: character.classe?.trim() || 'Sem classe',
    origem: character.origem?.trim() || 'Sem origem',
    tier: character.tier ?? 0,
    combatRole: character.combatRole?.trim() || 'Sem papel',
    nivel: character.nivel ?? 1,
    deslocamento: character.deslocamento?.trim() || '9 m',
    bloqueio: character.bloqueio ?? 0,
    esquiva: character.esquiva ?? 0,
    protecao: character.protecao?.trim() || 'Sem protecao',
    resistencia: character.resistencia?.trim() || 'Sem resistencia',
    proficiencias: character.proficiencias ?? [],
    habilidadesDetalhadas:
      character.habilidadesDetalhadas && character.habilidadesDetalhadas.length > 0
        ? character.habilidadesDetalhadas
        : buildFeatureDetails(character.habilidades),
    rituais: character.rituais ?? [],
    inventarioDetalhado:
      character.inventarioDetalhado && character.inventarioDetalhado.length > 0
        ? character.inventarioDetalhado
        : buildInventoryDetails(character.inventario),
    descricao: getCharacterDescription(character),
    pericias: mergedSkills,
  }
}

export function createEmptyCharacter(factionId: string): CharacterSheet {
  return {
    id: buildId('character'),
    nome: 'Novo personagem',
    avatarUrl: '',
    tokenImageUrl: '',
    tokenSize: 1,
    jogador: '',
    classe: '',
    origem: '',
    tier: 0,
    combatRole: '',
    tipo: 'player',
    faccao: factionId,
    localAtual: 'Sem local definido',
    notas: '',
    defesa: 12,
    nivel: 1,
    deslocamento: '9 m',
    bloqueio: 0,
    esquiva: 0,
    protecao: '',
    resistencia: '',
    proficiencias: [],
    habilidades: [],
    habilidadesDetalhadas: [],
    rituais: [],
    inventario: [],
    inventarioDetalhado: [],
    descricao: {
      historia: '',
      objetivo: '',
      aparencia: '',
      personalidade: '',
    },
    sharedBody: undefined,
    permissions: {
      canBeAssignedToPlayer: true,
      gmCanRevokeControl: true,
      tokenControl: {
        controlledByPlayerIds: [],
        sharedControl: false,
      },
      notes: '',
    },
    status: ['Ativo'],
    pericias: createDefaultSkills(),
    ataques: [],
    atributos: {
      forca: 2,
      agilidade: 2,
      intelecto: 2,
      presenca: 2,
      vigor: 2,
    },
    recursos: {
      vidaAtual: 10,
      vidaMaxima: 10,
      fushiAtual: 5,
      fushiMaximo: 5,
      determinacaoAtual: 3,
      determinacaoMaxima: 3,
    },
    rolagemBase: createAttributeRollConfig(2, 0),
    tone: 'steady',
  }
}

export function normalizeCharacterSheet(draft: CharacterSheet): CharacterSheet {
  const highestAttribute = Math.max(...Object.values(draft.atributos), 1)
  const editableDraft = prepareCharacterForEditing(draft)
  const proficiencies = editableDraft.proficiencias ?? []
  const detailedSkills = editableDraft.habilidadesDetalhadas ?? []
  const rituals = editableDraft.rituais ?? []
  const inventory = editableDraft.inventarioDetalhado ?? []
  const description = editableDraft.descricao ?? {
    historia: '',
    objetivo: '',
    aparencia: '',
    personalidade: '',
  }

  return {
    ...draft,
    nome: draft.nome.trim() || 'Personagem sem nome',
    avatarUrl: draft.avatarUrl?.trim() ? draft.avatarUrl.trim() : undefined,
    tokenImageUrl: draft.tokenImageUrl?.trim()
      ? draft.tokenImageUrl.trim()
      : undefined,
    tokenSize:
      draft.tokenSize === 2 || draft.tokenSize === 3 ? draft.tokenSize : 1,
    jogador: editableDraft.jogador?.trim() || undefined,
    classe: editableDraft.classe?.trim() || undefined,
    origem: editableDraft.origem?.trim() || undefined,
    tier: editableDraft.tier ?? 0,
    combatRole: editableDraft.combatRole?.trim() || undefined,
    localAtual: draft.localAtual.trim() || 'Sem local definido',
    notas: draft.notas.trim(),
    nivel: editableDraft.nivel,
    deslocamento: editableDraft.deslocamento?.trim() || undefined,
    bloqueio: editableDraft.bloqueio,
    esquiva: editableDraft.esquiva,
    protecao: editableDraft.protecao?.trim() || undefined,
    resistencia: editableDraft.resistencia?.trim() || undefined,
    proficiencias: proficiencies
      .map((item) => item.trim())
      .filter(Boolean),
    habilidades: detailedSkills
      .map((item) => item.nome.trim())
      .filter(Boolean),
    habilidadesDetalhadas: detailedSkills
      .map(normalizeFeatureDetail)
      .filter((item) => item.nome),
    rituais: rituals
      .map(normalizeFeatureDetail)
      .filter((item) => item.nome),
    inventario: inventory
      .map((item) => item.nome.trim())
      .filter(Boolean),
    inventarioDetalhado: inventory
      .map((item) => ({
        ...item,
        nome: item.nome.trim(),
        descricao: item.descricao.trim(),
        imagemUrl: item.imagemUrl?.trim() ? item.imagemUrl.trim() : undefined,
        efeitos: item.efeitos.map((effect) => effect.trim()).filter(Boolean),
      }))
      .filter((item) => item.nome),
    descricao: {
      historia: description.historia.trim(),
      objetivo: description.objetivo.trim(),
      aparencia: description.aparencia.trim(),
      personalidade: description.personalidade.trim(),
    },
    sharedBody: editableDraft.sharedBody
      ? {
          ...editableDraft.sharedBody,
          bodyId: editableDraft.sharedBody.bodyId.trim(),
          bodyName: editableDraft.sharedBody.bodyName.trim(),
          notes: editableDraft.sharedBody.notes.trim(),
        }
      : undefined,
    permissions: editableDraft.permissions
      ? {
          ...editableDraft.permissions,
          notes: editableDraft.permissions.notes.trim(),
          tokenControl: {
            controlledByPlayerIds:
              editableDraft.permissions.tokenControl.controlledByPlayerIds
                .map((playerId) => playerId.trim())
                .filter(Boolean),
            primaryControllerId: editableDraft.permissions.tokenControl.primaryControllerId?.trim()
              ? editableDraft.permissions.tokenControl.primaryControllerId.trim()
              : undefined,
            sharedControl: editableDraft.permissions.tokenControl.sharedControl,
          },
        }
      : undefined,
    pericias: ensureGeneralSkills(draft.pericias)
      .map((skill) => ({
        ...skill,
        nome: skill.nome.trim(),
        resumo: skill.resumo.trim(),
      }))
      .filter((skill) => skill.nome),
    ataques: draft.ataques
      .map((attack) => ({
        ...attack,
        nome: attack.nome.trim(),
        resumo: attack.resumo.trim(),
        dano: attack.dano.trim(),
        alcance: attack.alcance.trim(),
      }))
      .filter((attack) => attack.nome),
    rolagemBase: createAttributeRollConfig(
      highestAttribute,
      draft.rolagemBase.bonus ?? 0,
    ),
  }
}
