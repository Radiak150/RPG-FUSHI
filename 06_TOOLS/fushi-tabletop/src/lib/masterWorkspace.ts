import type {
  CampaignsData,
  CharacterAttack,
  CharacterAttributes,
  CharacterDescription,
  CharacterFeatureDetail,
  CharacterInventoryItem,
  CharacterResources,
  CharacterSheet,
  CharacterSkill,
  LocalCampaign,
  MasterPanelData,
  RollConfig,
} from '../data/types'
import { storageAdapter } from './storage/storageAdapter'

interface MasterWorkspaceState {
  version: 1
  characters: CharacterSheet[]
  campaigns: CampaignsData
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isRollConfig(value: unknown): value is RollConfig {
  return (
    isRecord(value) &&
    Number.isInteger(value.quantidadeDados) &&
    Number.isInteger(value.tipoDado) &&
    (value.bonus === undefined || typeof value.bonus === 'number') &&
    (value.modo === undefined ||
      value.modo === 'highest' ||
      value.modo === 'lowest' ||
      value.modo === 'sum')
  )
}

function isCharacterAttributes(value: unknown): value is CharacterAttributes {
  return (
    isRecord(value) &&
    Number.isInteger(value.forca) &&
    Number.isInteger(value.agilidade) &&
    Number.isInteger(value.intelecto) &&
    Number.isInteger(value.presenca) &&
    Number.isInteger(value.vigor)
  )
}

function isCharacterResources(value: unknown): value is CharacterResources {
  return (
    isRecord(value) &&
    Number.isInteger(value.vidaAtual) &&
    Number.isInteger(value.vidaMaxima) &&
    Number.isInteger(value.fushiAtual) &&
    Number.isInteger(value.fushiMaximo) &&
    Number.isInteger(value.determinacaoAtual) &&
    Number.isInteger(value.determinacaoMaxima)
  )
}

function isCharacterSkill(value: unknown): value is CharacterSkill {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.nome === 'string' &&
    typeof value.atributoBase === 'string' &&
    typeof value.bonusPericia === 'number' &&
    typeof value.resumo === 'string'
  )
}

function isCharacterAttack(value: unknown): value is CharacterAttack {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.nome === 'string' &&
    typeof value.atributoBase === 'string' &&
    typeof value.bonusPericia === 'number' &&
    typeof value.dano === 'string' &&
    typeof value.alcance === 'string' &&
    typeof value.resumo === 'string'
  )
}

function isCharacterFeatureDetail(value: unknown): value is CharacterFeatureDetail {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.nome === 'string' &&
    typeof value.descricao === 'string'
  )
}

function isCharacterInventoryItem(value: unknown): value is CharacterInventoryItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.nome === 'string' &&
    typeof value.descricao === 'string' &&
    (value.imagemUrl === undefined || typeof value.imagemUrl === 'string') &&
    Array.isArray(value.efeitos) &&
    value.efeitos.every((item) => typeof item === 'string')
  )
}

function isCharacterDescription(value: unknown): value is CharacterDescription {
  return (
    isRecord(value) &&
    typeof value.historia === 'string' &&
    typeof value.objetivo === 'string' &&
    typeof value.aparencia === 'string' &&
    typeof value.personalidade === 'string'
  )
}

function isCharacterSheet(value: unknown): value is CharacterSheet {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.nome === 'string' &&
    (value.avatarUrl === undefined || typeof value.avatarUrl === 'string') &&
    (value.tokenImageUrl === undefined || typeof value.tokenImageUrl === 'string') &&
    (value.tokenSize === undefined ||
      value.tokenSize === 1 ||
      value.tokenSize === 2 ||
      value.tokenSize === 3) &&
    (value.jogador === undefined || typeof value.jogador === 'string') &&
    (value.classe === undefined || typeof value.classe === 'string') &&
    (value.origem === undefined || typeof value.origem === 'string') &&
    (value.tipo === 'player' || value.tipo === 'npc' || value.tipo === 'mob') &&
    typeof value.faccao === 'string' &&
    typeof value.localAtual === 'string' &&
    typeof value.notas === 'string' &&
    typeof value.defesa === 'number' &&
    (value.nivel === undefined || typeof value.nivel === 'number') &&
    (value.deslocamento === undefined || typeof value.deslocamento === 'string') &&
    (value.bloqueio === undefined || typeof value.bloqueio === 'number') &&
    (value.esquiva === undefined || typeof value.esquiva === 'number') &&
    (value.protecao === undefined || typeof value.protecao === 'string') &&
    (value.resistencia === undefined || typeof value.resistencia === 'string') &&
    (value.proficiencias === undefined ||
      (Array.isArray(value.proficiencias) &&
        value.proficiencias.every((item) => typeof item === 'string'))) &&
    Array.isArray(value.habilidades) &&
    value.habilidades.every((item) => typeof item === 'string') &&
    (value.habilidadesDetalhadas === undefined ||
      (Array.isArray(value.habilidadesDetalhadas) &&
        value.habilidadesDetalhadas.every(isCharacterFeatureDetail))) &&
    (value.rituais === undefined ||
      (Array.isArray(value.rituais) &&
        value.rituais.every(isCharacterFeatureDetail))) &&
    Array.isArray(value.inventario) &&
    value.inventario.every((item) => typeof item === 'string') &&
    (value.inventarioDetalhado === undefined ||
      (Array.isArray(value.inventarioDetalhado) &&
        value.inventarioDetalhado.every(isCharacterInventoryItem))) &&
    (value.descricao === undefined || isCharacterDescription(value.descricao)) &&
    Array.isArray(value.status) &&
    value.status.every((item) => typeof item === 'string') &&
    Array.isArray(value.pericias) &&
    value.pericias.every(isCharacterSkill) &&
    Array.isArray(value.ataques) &&
    value.ataques.every(isCharacterAttack) &&
    isCharacterAttributes(value.atributos) &&
    isCharacterResources(value.recursos) &&
    isRollConfig(value.rolagemBase) &&
    (value.tone === 'steady' || value.tone === 'watch' || value.tone === 'critical')
  )
}

function isLocalCampaign(value: unknown): value is LocalCampaign {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.nome === 'string' &&
    typeof value.codigo === 'string' &&
    typeof value.link === 'string' &&
    (value.coverImageUrl === undefined || typeof value.coverImageUrl === 'string') &&
    typeof value.resumo === 'string' &&
    typeof value.sessaoAtual === 'string' &&
    typeof value.status === 'string' &&
    typeof value.createdAt === 'string' &&
    (value.tone === 'steady' || value.tone === 'watch' || value.tone === 'critical')
  )
}

function isLikelySeedCharacterList(characters: CharacterSheet[]) {
  const names = new Set(characters.map((character) => character.nome))

  return (
    characters.length <= 10 &&
    (names.has('Fragmento Desperto I') ||
      names.has('Fragmento Desperto II') ||
      names.has('Corpo Compartilhado Inicial') ||
      Array.from(names).some((name) => name.startsWith('NPC Placeholder')))
  )
}

function shouldPreserveCharacterImages(character: CharacterSheet) {
  return (
    character.nome.trim().length > 0 &&
    !character.nome.trim().toLowerCase().startsWith('npc placeholder')
  )
}

function mergeCanonicalWorkspaceCharacter(
  currentCharacter: CharacterSheet,
  canonicalCharacter: CharacterSheet,
): CharacterSheet {
  const preserveImages = shouldPreserveCharacterImages(currentCharacter)

  return {
    ...cloneValue(canonicalCharacter),
    avatarUrl:
      preserveImages && currentCharacter.avatarUrl
        ? currentCharacter.avatarUrl
        : canonicalCharacter.avatarUrl,
    tokenImageUrl:
      preserveImages && currentCharacter.tokenImageUrl
        ? currentCharacter.tokenImageUrl
        : canonicalCharacter.tokenImageUrl,
    tokenSize: currentCharacter.tokenSize ?? canonicalCharacter.tokenSize,
    permissions: currentCharacter.permissions ?? canonicalCharacter.permissions,
  }
}

function repairCanonicalWorkspaceCharacters(
  characters: CharacterSheet[],
  baseData: MasterPanelData,
) {
  const canonicalMaira = baseData.characters.items.find(
    (character) => character.id === 'npc-d1',
  )

  if (!canonicalMaira || canonicalMaira.nome !== 'Maira Velan') {
    return characters
  }

  const hasCanonicalSlot = characters.some((character) => character.id === canonicalMaira.id)
  let hasMaira = false
  const repairedCharacters = characters.map((character) => {
    const normalizedName = character.nome.trim().toLowerCase()
    const isMairaSlot =
      character.id === canonicalMaira.id ||
      (!hasCanonicalSlot &&
        (normalizedName === 'maira' || normalizedName === 'maira velan'))

    if (!isMairaSlot) {
      return character
    }

    hasMaira = true
    return mergeCanonicalWorkspaceCharacter(character, canonicalMaira)
  })

  return hasMaira
    ? repairedCharacters
    : [...repairedCharacters, cloneValue(canonicalMaira)]
}

function createDefaultCampaign(baseData: MasterPanelData): LocalCampaign {
  return {
    id: 'campaign-local-default',
    nome: baseData.dashboard.campaignName,
    codigo: 'FUSHI-LOCAL',
    link: 'fushi://campanha/FUSHI-LOCAL',
    coverImageUrl: '',
    resumo: baseData.campaign.focoAtual,
    sessaoAtual: baseData.campaign.sessaoAtual,
    status: baseData.campaign.estadoAtual,
    createdAt: new Date().toISOString(),
    tone: 'steady',
  }
}

export function createDefaultMasterWorkspace(
  baseData: MasterPanelData,
): MasterWorkspaceState {
  const defaultCampaign = createDefaultCampaign(baseData)

  return {
    version: 1,
    characters: cloneValue(baseData.characters.items),
    campaigns: {
      activeCampaignId: defaultCampaign.id,
      items: [defaultCampaign],
    },
  }
}

export function readMasterWorkspace(
  baseData: MasterPanelData,
): MasterWorkspaceState {
  const parsedValue = storageAdapter.loadMasterWorkspace()

  if (!parsedValue) {
    return createDefaultMasterWorkspace(baseData)
  }

  try {
    if (!isRecord(parsedValue) || parsedValue.version !== 1) {
      return createDefaultMasterWorkspace(baseData)
    }

    const parsedCharacters = Array.isArray(parsedValue.characters)
      ? parsedValue.characters.filter(isCharacterSheet)
      : []
    const characters =
      parsedCharacters.length > 0
        ? parsedCharacters
        : cloneValue(baseData.characters.items)
    const repairedCharacters = repairCanonicalWorkspaceCharacters(characters, baseData)
    const parsedCampaigns = isRecord(parsedValue.campaigns)
      ? parsedValue.campaigns
      : null

    const items =
      parsedCampaigns &&
      Array.isArray(parsedCampaigns.items) &&
      parsedCampaigns.items.every(isLocalCampaign)
        ? parsedCampaigns.items
        : [createDefaultCampaign(baseData)]

    const activeCampaignId =
      parsedCampaigns &&
      typeof parsedCampaigns.activeCampaignId === 'string' &&
      items.some((item) => item.id === parsedCampaigns.activeCampaignId)
        ? parsedCampaigns.activeCampaignId
        : items[0]?.id ?? ''

    return {
      version: 1,
      characters: cloneValue(repairedCharacters),
      campaigns: {
        activeCampaignId,
        items: cloneValue(items),
      },
    }
  } catch {
    return createDefaultMasterWorkspace(baseData)
  }
}

export function writeMasterWorkspace(workspace: MasterWorkspaceState) {
  const currentWorkspace = storageAdapter.loadMasterWorkspace()
  const currentCharacters = isRecord(currentWorkspace) && Array.isArray(currentWorkspace.characters)
    ? currentWorkspace.characters.filter(isCharacterSheet)
    : []

  if (
    currentCharacters.length > 20 &&
    workspace.characters.length < currentCharacters.length &&
    isLikelySeedCharacterList(workspace.characters)
  ) {
    console.warn(
      '[FUSHI workspace] Bloqueado overwrite destrutivo do elenco por seed placeholder.',
      {
        currentCharacters: currentCharacters.length,
        nextCharacters: workspace.characters.length,
      },
    )
    return
  }

  storageAdapter.saveMasterWorkspace(workspace)
}

export function mergeMasterPanelData(
  baseData: MasterPanelData,
  workspace: MasterWorkspaceState,
): MasterPanelData {
  const activeCampaign =
    workspace.campaigns.items.find(
      (campaign) => campaign.id === workspace.campaigns.activeCampaignId,
    ) ??
    workspace.campaigns.items[0] ??
    createDefaultCampaign(baseData)
  const characters = cloneValue(workspace.characters)
  const factions = baseData.factions.items.map((faction) => ({
    ...faction,
    membrosIds: characters
      .filter((character) => character.faccao === faction.id)
      .map((character) => character.id),
  }))

  return {
    ...cloneValue(baseData),
    dashboard: {
      ...cloneValue(baseData.dashboard),
      campaignName: activeCampaign.nome,
      currentSession: activeCampaign.sessaoAtual,
      campaignStatus: activeCampaign.status,
    },
    factions: {
      items: factions,
    },
    campaigns: {
      activeCampaignId: activeCampaign.id,
      items: cloneValue(workspace.campaigns.items),
    },
    campaign: {
      ...cloneValue(baseData.campaign),
      estadoAtual: activeCampaign.status,
      sessaoAtual: activeCampaign.sessaoAtual,
      focoAtual: activeCampaign.resumo,
    },
    characters: {
      items: characters,
    },
  }
}
