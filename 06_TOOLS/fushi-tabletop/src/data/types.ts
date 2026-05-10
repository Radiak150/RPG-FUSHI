export type Tone = 'steady' | 'watch' | 'critical'
export type AppViewMode = 'gm' | 'player'
export type CharacterKind = 'player' | 'npc'
export type RollMode = 'highest' | 'lowest' | 'sum'
export type TabletopTokenSize = 1 | 2 | 3
export type TabletopTokenSizePreset = '1x1' | '2x2' | '3x3' | 'custom'
export type EncounterDifficulty = 'facil' | 'medio' | 'dificil' | 'boss'
export type TabletopMapType =
  | 'livre'
  | 'evento'
  | 'base'
  | 'extra'
  | 'interior'
  | 'dungeon'

export interface DashboardMetric {
  id: string
  label: string
  value: string
  note: string
  tone: Tone
  toneLabel: string
}

export interface ManualAlert {
  id: string
  title: string
  detail: string
  tone: Tone
}

export interface DashboardData {
  campaignName: string
  currentSession: string
  campaignStatus: string
  overview: string
  manualAlerts: ManualAlert[]
}

export interface CharacterAttributes {
  forca: number
  agilidade: number
  intelecto: number
  presenca: number
  vigor: number
}

export type AttributeKey = keyof CharacterAttributes

export interface CharacterResources {
  vidaAtual: number
  vidaMaxima: number
  fushiAtual: number
  fushiMaximo: number
  determinacaoAtual: number
  determinacaoMaxima: number
}

export interface RollConfig {
  quantidadeDados: number
  tipoDado: number
  bonus?: number
  modo?: RollMode
}

export interface RollRecord extends RollConfig {
  id: string
  contexto: string
  resultados: number[]
  bonus: number
  modo: RollMode
  resultadoBase: number
  total: number
  resultadoTexto: string
}

export interface CharacterSkill {
  id: string
  nome: string
  atributoBase: AttributeKey
  bonusPericia: number
  resumo: string
}

export interface CharacterAttack {
  id: string
  nome: string
  atributoBase: AttributeKey
  bonusPericia: number
  dano: string
  alcance: string
  resumo: string
}

export interface CharacterFeatureDetail {
  id: string
  nome: string
  descricao: string
}

export interface CharacterInventoryItem {
  id: string
  nome: string
  descricao: string
  efeitos: string[]
  imagemUrl?: string
}

export interface CharacterDescription {
  historia: string
  objetivo: string
  aparencia: string
  personalidade: string
}

export interface TokenControl {
  controlledByPlayerIds: string[]
  primaryControllerId?: string
  sharedControl: boolean
}

export interface CharacterPermissionProfile {
  canBeAssignedToPlayer: boolean
  gmCanRevokeControl: boolean
  tokenControl: TokenControl
  notes: string
}

export interface SharedBodyLink {
  bodyId: string
  bodyName: string
  sharesHealthPool: boolean
  sharesFushiPool: boolean
  notes: string
}

export interface CharacterSheet {
  id: string
  nome: string
  avatarUrl?: string
  tokenImageUrl?: string
  topdownImageUrl?: string
  tokenSize?: TabletopTokenSize
  isSharedBodyHost?: boolean
  jogador?: string
  classe?: string
  origem?: string
  tipo: CharacterKind
  faccao: string
  localAtual: string
  notas: string
  tier?: number
  combatRole?: string
  defesa: number
  nivel?: number
  deslocamento?: string
  bloqueio?: number
  esquiva?: number
  protecao?: string
  resistencia?: string
  proficiencias?: string[]
  habilidades: string[]
  habilidadesDetalhadas?: CharacterFeatureDetail[]
  rituais?: CharacterFeatureDetail[]
  inventario: string[]
  inventarioDetalhado?: CharacterInventoryItem[]
  descricao?: CharacterDescription
  sharedBody?: SharedBodyLink
  permissions?: CharacterPermissionProfile
  status: string[]
  pericias: CharacterSkill[]
  ataques: CharacterAttack[]
  atributos: CharacterAttributes
  recursos: CharacterResources
  rolagemBase: RollConfig
  tone: Tone
}

export interface CharactersData {
  items: CharacterSheet[]
}

export interface WorldRegion {
  id: string
  nome: string
  resumo: string
}

export interface Biome {
  id: string
  nome: string
  regiaoId: string
  resumo: string
  pressao: string
}

export interface PointOfInterest {
  id: string
  nome: string
  regiaoId: string
  biomaId: string
  status: string
  resumo: string
  detalhes: string[]
  tags: string[]
  tone: Tone
  posicao: {
    x: number
    y: number
  }
}

export interface WorldData {
  mapImage: string
  regioes: WorldRegion[]
  biomas: Biome[]
  pontos: PointOfInterest[]
}

export interface TabletopCell {
  column: number
  row: number
}

export interface TabletopGridSpan {
  columns: number
  rows: number
}

export interface TabletopMap {
  id: string
  campaignId?: string
  biomeId?: string
  folderId?: string
  munLocationId?: string
  source?: 'manual' | 'mun_generated' | 'imported'
  name: string
  type?: TabletopMapType
  mapVisibility?: 'mestre_apenas' | 'preparado' | 'ativo_para_jogadores' | 'arquivado'
  image: string
  imageUrl?: string
  previewImage?: string
  thumbnailUrl?: string
  biome?: string
  summary?: string
  stageWidth: number
  stageHeight: number
  gridColumns: number
  gridRows: number
  cellSize?: number
  defaultCamera?: TabletopCameraState
}

export type TabletopTokenVisibility = 'public' | 'gm'
export type TabletopTokenKind = 'player_corpo' | 'npc' | 'mob' | 'grupo'
export type TabletopOriginalConsciousnessState =
  | 'suprimida'
  | 'em_disputa'
  | 'coexistindo'
  | 'removida'
  | 'desconhecida'

export interface TabletopPersistentBodyControl {
  bodyId: string
  consciousnessId: string
  linkedAt: string
  originalConsciousnessState: TabletopOriginalConsciousnessState
  playerId: string
}

export interface TabletopToken {
  id: string
  characterId: string
  bodyId?: string
  npcId?: string
  mobId?: string
  tokenKind?: TabletopTokenKind
  controladoPorJogadorId?: string
  label: string
  color: string
  cell: TabletopCell
  size: TabletopTokenSize
  customSize?: TabletopGridSpan
  visibility: TabletopTokenVisibility
  control?: TokenControl
  persistentControl?: TabletopPersistentBodyControl
}

export interface TabletopCameraState {
  zoom?: number
  scrollLeft?: number
  scrollTop?: number
}

export interface TabletopSceneMetadata {
  musicTrackId: string
  ambienceTrackId: string
  lightingPresetId: string
  weatherPresetId: string
  uiThemePresetId: string
  introCardId: string
  cinematicId: string
  cameraPresetId: string
  notes: string
}

export interface TabletopScene {
  id: string
  name: string
  mapId: string
  tokens: TabletopToken[]
  gridCellSize?: number
  cameraState?: TabletopCameraState
  metadata: TabletopSceneMetadata
}

export interface TabletopBiome {
  id: string
  name: string
  description: string
  themePresetId: string
  weatherPresetId: string
  maps: string[]
  transitions: string[]
}

export interface TabletopAssetItem {
  id: string
  name: string
  summary: string
  category?: string
  folderId?: string
}

export interface TabletopMediaAsset extends TabletopAssetItem {
  source: string
  previewImage?: string
}

export interface TabletopTransitionAsset extends TabletopAssetItem {
  biomeId: string
  fromMapId?: string
  toMapId?: string
  type: 'image' | 'video'
  assetUrl: string
  thumbnailUrl?: string
  description: string
}

export interface TabletopCinematicAsset extends TabletopAssetItem {
  category: 'intro' | 'boss-entry' | 'domain' | 'transition'
  previewImage?: string
  introCardId?: string
  lightingPresetId?: string
  weatherPresetId?: string
  uiThemePresetId?: string
  cameraPresetId?: string
  musicTrackId?: string
  ambienceTrackId?: string
}

export interface TabletopSessionStep {
  id: string
  name: string
  mode: 'map' | 'transition'
  order?: number
  sceneId?: string
  mapId?: string
  transitionId?: string
  nextMapId?: string
  intro?: string
  musicTrackId?: string
  themePresetId?: string
  weatherPresetId?: string
  notes?: string
}

export interface TabletopSessionPlan {
  id: string
  name: string
  objective: string
  summary: string
  scenes: TabletopSessionStep[]
}

export interface TabletopAssetLibrary {
  maps: TabletopMap[]
  transitions: TabletopTransitionAsset[]
  musicTracks: TabletopMediaAsset[]
  ambienceTracks: TabletopMediaAsset[]
  images: TabletopMediaAsset[]
  videoClips: TabletopMediaAsset[]
  fxPresets: TabletopAssetItem[]
  uiThemes: TabletopAssetItem[]
  lightingPresets: TabletopAssetItem[]
  weatherPresets: TabletopAssetItem[]
  introCards: TabletopMediaAsset[]
  cinematics: TabletopCinematicAsset[]
  cameraPresets: TabletopAssetItem[]
}

export interface TabletopData {
  map: TabletopMap
  initialTokens: TabletopToken[]
  maps: TabletopMap[]
  biomes: TabletopBiome[]
  transitions: TabletopTransitionAsset[]
  scenes: TabletopScene[]
  sessions: TabletopSessionPlan[]
  initialSceneId: string
  assetLibrary: TabletopAssetLibrary
}

export interface FactionItem {
  id: string
  nome: string
  status: string
  tone: Tone
  base: string
  localAtual: string
  resumo: string
  membrosIds: string[]
  notas: string
}

export interface FactionsData {
  items: FactionItem[]
}

export interface RecentEvent {
  id: string
  titulo: string
  tipo: string
  janela: string
  impacto: string
  tone: Tone
  resumo: string
}

export interface CampaignData {
  estadoAtual: string
  sessaoAtual: string
  focoAtual: string
  eventosRecentes: RecentEvent[]
  observacoesMestre: string[]
  observacoesTecnicas: string[]
  destaqueFaccoesIds: string[]
  destaquePersonagensIds: string[]
  destaquePontosIds: string[]
}

export interface LocalCampaign {
  id: string
  nome: string
  codigo: string
  link: string
  coverImageUrl?: string
  resumo: string
  sessaoAtual: string
  status: string
  createdAt: string
  tone: Tone
}

export interface CampaignsData {
  activeCampaignId: string
  items: LocalCampaign[]
}

export interface SystemRule {
  id: string
  title: string
  summary: string
  bullets: string[]
}

export interface PowerTierDefinition {
  id: string
  tier: string
  title: string
  summary: string
  examples: string[]
}

export interface DifficultyRule {
  id: string
  label: string
  summary: string
}

export interface CombatGuideline {
  id: string
  title: string
  summary: string
  bullets: string[]
}

export interface TutorialEncounterDefinition {
  id: string
  name: string
  tier: number
  role: string
  threat: string
  summary: string
  attributes: CharacterAttributes
  resources: {
    vida: string
    fushi: string
    determinacao: string
    defesa: string
  }
  attacks: string[]
  scaling: string[]
}

export interface FushiState {
  id: string
  name: string
  summary: string
  markers: string[]
  risks: string[]
  tone: Tone
}

export interface ImportantTerm {
  id: string
  term: string
  summary: string
}

export interface SystemItemDefinition {
  id: string
  name: string
  summary: string
  category: string
  futureHooks: string[]
}

export interface SystemData {
  rules: SystemRule[]
  states: FushiState[]
  terms: ImportantTerm[]
  powerScale: PowerTierDefinition[]
  difficultyScale: DifficultyRule[]
  universalSheetNotes: string[]
  combatGuidelines: CombatGuideline[]
  tutorialEncounters: TutorialEncounterDefinition[]
  futurePermissionNotes: string[]
  itemLibrary: SystemItemDefinition[]
}

export interface AppMetaData {
  sourceLabel: string
  supportedViews: AppViewMode[]
}

export interface MasterPanelData {
  meta: AppMetaData
  dashboard: DashboardData
  world: WorldData
  tabletop: TabletopData
  factions: FactionsData
  campaigns: CampaignsData
  campaign: CampaignData
  characters: CharactersData
  system: SystemData
}
