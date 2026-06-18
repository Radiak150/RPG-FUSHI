import { createContext } from 'react'
import type { CharacterSheet, TabletopCell } from '../data/types'
import type { TabletopLogEntry, TabletopMeasurement } from '../lib/tabletopSession'
import type {
  FushiAccessProfile,
  FushiAccessProfileId,
  FushiAccessState,
} from '../lib/playerAccess'

export interface MultiplayerPublicState {
  activeMap?: unknown
  campaignId: string
  characters?: unknown[]
  libraryState?: unknown
  metadata?: unknown
  playerAccess?: unknown
  playerCurrentMapId: string
  playerId: FushiAccessProfileId
  protocolVersion?: number
  serverInstanceId?: string
  stateVersion?: number
  tabletopSession?: unknown
  transitionPlayback?: unknown
  transitionOverrides?: unknown
  world?: unknown
}

export interface MultiplayerClientConfig {
  host: string
  port: number
  secure?: boolean
  sessionCode: string
}

export interface MultiplayerHostStatus {
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
  stateVersion?: number
  startedAt: string | null
}

export interface MultiplayerDiagnostics {
  lastAckAt: string | null
  lastActionStatus: 'idle' | 'queued' | 'confirmed' | 'rejected' | 'retrying' | 'offline'
  lastActionType: string
  lastErrorAt: string | null
  lastQueuedAt: string | null
  pendingActions: number
  reconnectAttempts: number
  retryAttempts: number
  socketState: 'closed' | 'closing' | 'connecting' | 'open' | 'unavailable'
  staleStatesIgnored: number
  stateVersion: number
}

export interface MultiplayerContextValue {
  authenticateRemoteProfile: (
    profileId: FushiAccessProfileId,
    password: string,
  ) => Promise<boolean>
  clientConfig: MultiplayerClientConfig | null
  connectedPlayers: MultiplayerHostStatus['clients']
  connectionStatus: 'offline' | 'connecting' | 'connected' | 'hosting' | 'error'
  disconnect: () => void
  errorMessage: string
  hostStatus: MultiplayerHostStatus | null
  diagnostics: MultiplayerDiagnostics
  networkLatencyMs: number | null
  moveToken: (tokenId: string, cell: TabletopCell) => void
  addLogEntry: (entry: TabletopLogEntry) => void
  updateCharacter: (character: CharacterSheet) => void
  updateMeasurement: (
    measurement: Pick<TabletopMeasurement, 'end' | 'start' | 'visualColor'> | null,
  ) => void
  publicState: MultiplayerPublicState | null
  remoteAccessState: FushiAccessState | null
  remoteActiveProfile: FushiAccessProfile | null
  refreshHostStatus: () => void
  requestState: () => void
  controlPlayerAdmission: (input: {
    action: 'accept' | 'kick' | 'reject'
    clientId?: string
    playerId?: string
  }) => Promise<boolean>
  startHosting: (input: {
    campaignId: string
    port: number
    sessionCode?: string
  }) => Promise<boolean>
  stopHosting: () => Promise<void>
  joinSession: (input: MultiplayerClientConfig) => Promise<boolean>
}

export const MultiplayerContext = createContext<MultiplayerContextValue | null>(null)
