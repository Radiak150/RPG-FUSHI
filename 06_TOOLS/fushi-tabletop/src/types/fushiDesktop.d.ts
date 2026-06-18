export {}

export type FushiDesktopJsonScope = 'app' | 'campaign'

export interface FushiDesktopJsonRequest {
  campaignId?: string
  data?: unknown
  name:
    | 'access'
    | 'library'
    | 'mundi'
    | 'physicalPersistence'
    | 'session'
    | 'transitionOverrides'
    | 'transitionPlayback'
    | 'viewPreferences'
    | 'workspace'
  scope: FushiDesktopJsonScope
}

export type FushiUpdateState =
  | 'available'
  | 'checking'
  | 'disabled'
  | 'downloaded'
  | 'downloading'
  | 'error'
  | 'idle'
  | 'installing'
  | 'not-available'

export interface FushiUpdateStatus {
  availableVersion: string | null
  currentVersion: string
  error: string | null
  feedUrl: string | null
  feedUrlSource: 'build' | 'env' | 'manual' | 'none' | null
  isPackaged: boolean
  isFeedUrlInsecure: boolean
  isSupported: boolean
  message: string
  percent: number | null
  releaseDate: string | null
  state: FushiUpdateState
}

export type FushiCampaignPackageState =
  | 'checking'
  | 'downloaded'
  | 'downloading'
  | 'error'
  | 'ready'

export interface FushiCampaignPackageRequest {
  code: string
  feedUrl: string
}

export interface FushiCampaignPackageStatus {
  bytesToDownload: number
  campaignId: string | null
  campaignName: string | null
  changedFiles: number
  code: string
  currentFile: string | null
  downloadedBytes: number
  downloadedFiles: number
  error: string | null
  feedUrl: string | null
  installedFiles: number
  manifestVersion: string | null
  message: string
  missingFiles: number
  ok: boolean
  percent: number | null
  state: FushiCampaignPackageState
  totalBytes: number
  totalFiles: number
}

export interface FushiAiProviderConfig {
  endpoint: string
  model: string
  provider: 'ollama'
  temperature: number
  timeoutMs: number
}

export interface FushiAiChatMessage {
  content: string
  role: 'assistant' | 'system' | 'user'
}

export interface FushiAiConfigResult {
  config: FushiAiProviderConfig
  error?: string
  ok: boolean
}

export interface FushiOllamaTestResult {
  config?: FushiAiProviderConfig
  error?: string
  models?: string[]
  ok: boolean
}

export interface FushiOllamaChatResult {
  config?: FushiAiProviderConfig
  error?: string | null
  model?: string
  ok: boolean
  raw?: unknown
  text?: string
}

export interface FushiDesktopApi {
  getAppInfo(): {
    dataDir: string
    exePath: string
    installDir: string
    isDesktop: true
    libraryDir: string
    platform: string
    version: string
  }
  getStorageStatus(campaignId?: string): {
    activity?: {
      lastLoadAt: string | null
      lastOperation: string | null
      lastSaveAt: string | null
    }
    appBlocks: Array<{
      exists: boolean
      name: string
      path: string
      size: number
      updatedAt: string | null
    }>
    campaignBlocks: Array<{
      exists: boolean
      name: string
      path: string
      size: number
      updatedAt: string | null
    }>
    campaignDir: string
    campaignId: string
    dataDir: string
  }
  getMultiplayerHostStatus(): FushiMultiplayerHostStatus
  loadBackups(campaignId: string): unknown
  loadJson(request: FushiDesktopJsonRequest): unknown
  openDataFolder(): boolean
  openInstallFolder(): boolean
  openExternalUrl(url: string): Promise<boolean>
  openUninstallSettings(): Promise<boolean>
  getUpdateStatus(): Promise<FushiUpdateStatus>
  setUpdateFeedUrl(feedUrl: string): Promise<FushiUpdateStatus>
  checkForUpdates(): Promise<FushiUpdateStatus>
  downloadUpdate(): Promise<FushiUpdateStatus>
  installUpdate(): Promise<FushiUpdateStatus>
  checkCampaignPackage(
    request: FushiCampaignPackageRequest,
  ): Promise<FushiCampaignPackageStatus>
  downloadCampaignPackage(
    request: FushiCampaignPackageRequest,
  ): Promise<FushiCampaignPackageStatus>
  getAiConfig(): Promise<FushiAiProviderConfig>
  saveAiConfig(config: Partial<FushiAiProviderConfig>): Promise<FushiAiConfigResult>
  testOllama(config?: Partial<FushiAiProviderConfig>): Promise<FushiOllamaTestResult>
  runOllamaChat(request: {
    config?: Partial<FushiAiProviderConfig>
    messages: FushiAiChatMessage[]
  }): Promise<FushiOllamaChatResult>
  assetExists(url: string): boolean
  saveBackups(campaignId: string, data: unknown): boolean
  saveAsset(campaignId: string | undefined, asset: {
    category: string
    contentType: string
    dataUrl: string
    filename: string
    sourceUrl: string
  }): { ok: boolean; url?: string; error?: string }
  extractAudioFromMedia(campaignId: string | undefined, asset: {
    contentType: string
    dataUrl: string
    filename: string
  }): Promise<{
    ok: boolean
    category?: string
    contentType?: string
    error?: string
    filename?: string
    size?: number
    storagePath?: string
    url?: string
  }>
  saveJson(request: FushiDesktopJsonRequest): boolean
  startMultiplayerHost(request: {
    campaignId: string
    port: number
    sessionCode?: string
  }): Promise<{ ok: boolean; status?: FushiMultiplayerHostStatus; error?: string }>
  controlMultiplayerPlayerAdmission(request: {
    action: 'accept' | 'kick' | 'reject'
    clientId?: string
    playerId?: string
  }): Promise<{ ok: boolean; status?: FushiMultiplayerHostStatus | null; error?: string }>
  stopMultiplayerHost(): Promise<{ ok: boolean; status?: FushiMultiplayerHostStatus | null; error?: string }>
  onStorageChanged(
    callback: (event: {
      campaignId?: string
      name?: FushiDesktopJsonRequest['name'] | 'assets' | 'backups'
      receivedAt?: string
      scope?: FushiDesktopJsonScope
      type?: 'asset' | 'backups' | 'json'
    }) => void,
  ): () => void
  onUpdateStatusChanged(callback: (status: FushiUpdateStatus) => void): () => void
  onCampaignPackageStatusChanged(
    callback: (status: FushiCampaignPackageStatus) => void,
  ): () => void
}

export interface FushiMultiplayerHostStatus {
  campaignId?: string
  clients: Array<{
    admissionStatus?: 'accepted' | 'anonymous' | 'kicked' | 'pending' | 'rejected'
    connectedAt: string
    id: string
    latencyMs?: number | null
    lastPongAt?: string | null
    playerId: string
    profileLabel?: string
    requestedAt?: string | null
  }>
  isRunning: boolean
  localIps: string[]
  port: number
  protocolVersion?: number
  serverInstanceId?: string
  serverVersion: string
  sessionCode: string
  startedAt: string | null
  stateVersion?: number
}

declare global {
  interface Window {
    fushiDesktop?: FushiDesktopApi
  }
}
