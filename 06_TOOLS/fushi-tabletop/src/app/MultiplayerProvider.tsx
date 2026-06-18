import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { CharacterSheet, TabletopCell } from '../data/types'
import {
  type FushiAccessProfile,
  type FushiAccessProfileId,
  type FushiAccessState,
} from '../lib/playerAccess'
import type { TabletopLogEntry, TabletopMeasurement } from '../lib/tabletopSession'
import {
  MultiplayerContext,
  type MultiplayerClientConfig,
  type MultiplayerDiagnostics,
  type MultiplayerHostStatus,
  type MultiplayerPublicState,
} from './MultiplayerContext'

const REMOTE_PUBLIC_STATE_POLL_MS = 450
const REMOTE_PUBLIC_STATE_HIDDEN_POLL_MS = 3000
const REMOTE_RECONNECT_BASE_DELAY_MS = 900
const REMOTE_RECONNECT_MAX_DELAY_MS = 8000
const REMOTE_ACTION_HTTP_TIMEOUT_MS = 4500
const REMOTE_ACTION_ACK_TIMEOUT_MS = 4500
const REMOTE_ACTION_RETRY_BASE_DELAY_MS = 350
const REMOTE_ACTION_RETRY_MAX_DELAY_MS = 6000
const REMOTE_AUTH_APPROVAL_TIMEOUT_MS = 10 * 60 * 1000

interface MultiplayerWireMessage {
  message?: string
  payload?: unknown
  type: string
}

interface RemoteQueuedAction {
  attempts: number
  id: string
  message: Record<string, unknown>
  queuedAt: number
}

interface RemoteActionAckOutcome {
  applied: boolean
  message?: string
  publicState?: unknown
  received: boolean
}

interface RemoteActionResponse {
  actionId?: string
  applied?: boolean
  error?: string
  message?: string
  ok?: boolean
  publicState?: unknown
}

const INITIAL_MULTIPLAYER_DIAGNOSTICS: MultiplayerDiagnostics = {
  lastAckAt: null,
  lastActionStatus: 'idle',
  lastActionType: '',
  lastErrorAt: null,
  lastQueuedAt: null,
  pendingActions: 0,
  reconnectAttempts: 0,
  retryAttempts: 0,
  socketState: 'unavailable',
  staleStatesIgnored: 0,
  stateVersion: 0,
}

function normalizeHost(value: string) {
  const input = value.trim()

  if (!input) {
    return ''
  }

  try {
    const parsed = new URL(/^[a-z]+:\/\//i.test(input) ? input : `http://${input}`)
    return parsed.host
  } catch {
    return input
      .replace(/^https?:\/\//, '')
      .replace(/^wss?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/\/+$/, '')
  }
}

function isSecureRemoteHost(value: string) {
  const normalizedHost = normalizeHost(value).toLowerCase()

  return (
    /^(https|wss):\/\//i.test(value.trim()) ||
    normalizedHost.endsWith('.trycloudflare.com') ||
    normalizedHost.includes('.ngrok-free.app')
  )
}

function hasUrlScheme(value: string) {
  return /^[a-z]+:\/\//i.test(value.trim())
}

function shouldOmitConfiguredPort(config: MultiplayerClientConfig, host: string) {
  return host.includes(':') || (config.secure === true && hasUrlScheme(config.host))
}

function buildBaseHttpUrl(config: MultiplayerClientConfig) {
  const host = normalizeHost(config.host)
  const protocol = config.secure ? 'https' : 'http'

  if (shouldOmitConfiguredPort(config, host)) {
    return `${protocol}://${host}`
  }

  return `${protocol}://${host}:${config.port}`
}

function buildWebSocketUrl(config: MultiplayerClientConfig) {
  const host = normalizeHost(config.host)
  const hostWithPort = shouldOmitConfiguredPort(config, host)
    ? host
    : `${host}:${config.port}`
  const protocol = config.secure ? 'wss' : 'ws'
  const params = new URLSearchParams({
    code: config.sessionCode.trim().toUpperCase(),
  })

  return `${protocol}://${hostWithPort}/session?${params.toString()}`
}

function buildSessionHttpUrl(config: MultiplayerClientConfig, path: string) {
  const baseUrl = buildBaseHttpUrl(config)
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

function rewriteRemoteAssetUrls(value: unknown, baseHttpUrl: string): unknown {
  if (typeof value === 'string') {
    if (value.startsWith('fushi-asset://campaign/')) {
      if (window.fushiDesktop?.assetExists(value)) {
        return value
      }

      const url = new URL(value)
      const [campaignId, category, ...filenameParts] = url.pathname
        .split('/')
        .filter(Boolean)
        .map(decodeURIComponent)

      if (campaignId && category && filenameParts.length > 0) {
        return `${baseHttpUrl}/assets/campaign/${encodeURIComponent(campaignId)}/${encodeURIComponent(category)}/${filenameParts.map(encodeURIComponent).join('/')}`
      }
    }

    const publicAssetPath = getPublicAssetPath(value)

    if (publicAssetPath) {
      return `${baseHttpUrl}/assets/library/${publicAssetPath
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`
    }

    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteRemoteAssetUrls(item, baseHttpUrl))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        rewriteRemoteAssetUrls(item, baseHttpUrl),
      ]),
    )
  }

  return value
}

function buildRemotePublicState(
  payload: unknown,
  config: MultiplayerClientConfig,
) {
  const remoteAssetBaseUrl = buildBaseHttpUrl(config)
  const rewrittenPayload = rewriteRemoteAssetUrls(payload, remoteAssetBaseUrl)

  return rewrittenPayload &&
    typeof rewrittenPayload === 'object' &&
    !Array.isArray(rewrittenPayload)
    ? ({
        ...rewrittenPayload,
        metadata: {
          ...((rewrittenPayload as MultiplayerPublicState).metadata &&
          typeof (rewrittenPayload as MultiplayerPublicState).metadata === 'object'
            ? ((rewrittenPayload as MultiplayerPublicState).metadata as Record<
                string,
                unknown
              >)
            : {}),
          remoteAssetBaseUrl,
        },
      } as MultiplayerPublicState)
    : (rewrittenPayload as MultiplayerPublicState)
}

function createPublicStateKey(value: MultiplayerPublicState) {
  try {
    return JSON.stringify(value)
  } catch {
    return `${Date.now()}`
  }
}

function getPublicAssetPath(value: string) {
  const normalizedValue = value.trim().replace(/\\/g, '/')

  try {
    const url = new URL(normalizedValue)

    if (url.protocol === 'fushi-library:' && url.hostname === 'assets') {
      return url.pathname.replace(/^\/+/, '')
    }

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      if (url.pathname.startsWith('/assets/library/')) {
        return url.pathname.slice('/assets/library/'.length)
      }

      if (url.pathname.startsWith('/assets/')) {
        return url.pathname.slice('/assets/'.length)
      }
    }
  } catch {
    // Keep parsing plain runtime paths below.
  }

  if (normalizedValue.startsWith('/assets/')) {
    return normalizedValue.slice('/assets/'.length)
  }

  if (normalizedValue.startsWith('./assets/')) {
    return normalizedValue.slice('./assets/'.length)
  }

  if (normalizedValue.startsWith('assets/')) {
    return normalizedValue.slice('assets/'.length)
  }

  return ''
}

function isRemoteProfileId(value: unknown): value is FushiAccessProfileId {
  return (
    value === 'gm' ||
    value === 'player1' ||
    value === 'player2' ||
    value === 'player3' ||
    value === 'player4' ||
    value === 'player5'
  )
}

function createRemoteActionId(profileId: string, type: unknown) {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `remote-${profileId}-${typeof type === 'string' ? type : 'action'}-${randomPart}`
}

function normalizeRemoteAccessState(value: unknown): FushiAccessState {
  const input =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Partial<FushiAccessState>)
      : {}
  const profiles = Array.isArray(input.profiles)
    ? input.profiles
        .filter((profile): profile is FushiAccessProfile =>
          Boolean(profile) &&
          typeof profile === 'object' &&
          isRemoteProfileId((profile as FushiAccessProfile).id),
        )
        .map((profile) => ({
          characterId: typeof profile.characterId === 'string' ? profile.characterId : '',
          id: profile.id,
          label: typeof profile.label === 'string' ? profile.label : profile.id,
          password: '',
          role: profile.role === 'gm' ? ('gm' as const) : ('player' as const),
        }))
    : []

  return {
    activeProfileId: '',
    profiles,
    version: 1,
  }
}

export function MultiplayerProvider({ children }: PropsWithChildren) {
  const socketRef = useRef<WebSocket | null>(null)
  const pendingAuthRef = useRef<{
    password: string
    profile?: FushiAccessProfile
    profileId: FushiAccessProfileId
    resolve: (value: boolean) => void
    timeoutId?: number
  } | null>(null)
  const [clientConfig, setClientConfig] = useState<MultiplayerClientConfig | null>(null)
  const [connectedPlayers, setConnectedPlayers] = useState<
    Array<{
      admissionStatus?: 'accepted' | 'anonymous' | 'kicked' | 'pending' | 'rejected'
      connectedAt: string
      id: string
      latencyMs?: number | null
      lastPongAt?: string | null
      playerId: string
      profileLabel?: string
      requestedAt?: string | null
    }>
  >([])
  const [connectionStatus, setConnectionStatus] =
    useState<'offline' | 'connecting' | 'connected' | 'hosting' | 'error'>('offline')
  const [errorMessage, setErrorMessage] = useState('')
  const [diagnostics, setDiagnostics] = useState<MultiplayerDiagnostics>(
    INITIAL_MULTIPLAYER_DIAGNOSTICS,
  )
  const [hostStatus, setHostStatus] = useState<MultiplayerHostStatus | null>(() =>
    window.fushiDesktop?.getMultiplayerHostStatus() ?? null,
  )
  const [networkLatencyMs, setNetworkLatencyMs] = useState<number | null>(null)
  const [publicState, setPublicState] = useState<MultiplayerPublicState | null>(null)
  const [remoteAccessState, setRemoteAccessState] = useState<FushiAccessState | null>(null)
  const [remoteActiveProfile, setRemoteActiveProfile] =
    useState<FushiAccessProfile | null>(null)
  const clientConfigRef = useRef<MultiplayerClientConfig | null>(clientConfig)
  const connectionStatusRef = useRef(connectionStatus)
  const remoteActiveProfileRef = useRef<FushiAccessProfile | null>(remoteActiveProfile)
  const lastPublicStateKeyRef = useRef('')
  const lastPublicStateVersionRef = useRef(0)
  const remoteServerInstanceIdRef = useRef('')
  const remoteActionsInFlightRef = useRef(0)
  const remoteActionFlushTimerRef = useRef<number | null>(null)
  const remoteActionProcessingRef = useRef(false)
  const remoteActionQueueRef = useRef<RemoteQueuedAction[]>([])
  const remoteStateRequestInFlightRef = useRef(false)
  const pendingActionAckResolversRef = useRef(
    new Map<string, (outcome: RemoteActionAckOutcome) => void>(),
  )
  const processRemoteActionQueueRef = useRef<() => void>(() => {})
  const manualDisconnectRef = useRef(false)
  const reconnectTimerRef = useRef<number | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectingRef = useRef(false)
  const joinSessionRef = useRef<((input: MultiplayerClientConfig) => Promise<boolean>) | null>(
    null,
  )
  const lastRemoteLoginRef = useRef<{
    config: MultiplayerClientConfig
    password: string
    profileId: FushiAccessProfileId
  } | null>(null)

  useEffect(() => {
    clientConfigRef.current = clientConfig
  }, [clientConfig])

  useEffect(() => {
    connectionStatusRef.current = connectionStatus
  }, [connectionStatus])

  useEffect(() => {
    remoteActiveProfileRef.current = remoteActiveProfile
  }, [remoteActiveProfile])

  const refreshHostStatus = useCallback(() => {
    const status = window.fushiDesktop?.getMultiplayerHostStatus() ?? null

    setHostStatus(status)

    if (status?.isRunning) {
      setConnectedPlayers(status.clients)
      setConnectionStatus((current) => (current === 'offline' ? 'hosting' : current))
    } else {
      setConnectionStatus((current) => (current === 'hosting' ? 'offline' : current))
    }
  }, [])

  const updateDiagnostics = useCallback((patch: Partial<MultiplayerDiagnostics>) => {
    setDiagnostics((current) => ({
      ...current,
      ...patch,
    }))
  }, [])

  useEffect(() => {
    if (!hostStatus?.isRunning) {
      return
    }

    const intervalId = window.setInterval(refreshHostStatus, 1500)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [hostStatus?.isRunning, refreshHostStatus])

  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    reconnectAttemptRef.current = 0
    reconnectingRef.current = false
    lastRemoteLoginRef.current = null
    if (remoteActionFlushTimerRef.current !== null) {
      window.clearTimeout(remoteActionFlushTimerRef.current)
      remoteActionFlushTimerRef.current = null
    }
    pendingActionAckResolversRef.current.forEach((resolve) => {
      resolve({ applied: false, received: false })
    })
    pendingActionAckResolversRef.current.clear()
    remoteActionProcessingRef.current = false
    remoteActionQueueRef.current = []
    setDiagnostics({
      ...INITIAL_MULTIPLAYER_DIAGNOSTICS,
      lastActionStatus: 'offline',
      socketState: 'closed',
    })
    socketRef.current?.close()
    socketRef.current = null
    setClientConfig(null)
    setConnectionStatus((current) => (current === 'hosting' ? 'hosting' : 'offline'))
    setErrorMessage('')
    setPublicState(null)
    setRemoteAccessState(null)
    setRemoteActiveProfile(null)
    setNetworkLatencyMs(null)
    lastPublicStateKeyRef.current = ''
    lastPublicStateVersionRef.current = 0
    remoteServerInstanceIdRef.current = ''
    remoteActionsInFlightRef.current = 0
    if (pendingAuthRef.current?.timeoutId) {
      window.clearTimeout(pendingAuthRef.current.timeoutId)
    }
    pendingAuthRef.current?.resolve(false)
    pendingAuthRef.current = null
  }, [])

  const startHosting = useCallback(
    async (input: { campaignId: string; port: number; sessionCode?: string }) => {
      if (!window.fushiDesktop) {
        setErrorMessage('Hospedagem V1 exige o app desktop Electron.')
        setConnectionStatus('error')
        return false
      }

      const result = await window.fushiDesktop.startMultiplayerHost(input)

      if (!result.ok || !result.status) {
        setErrorMessage(result.error ?? 'Nao foi possivel hospedar sessao.')
        setConnectionStatus('error')
        return false
      }

      setHostStatus(result.status)
      setConnectedPlayers(result.status.clients)
      setConnectionStatus('hosting')
      setErrorMessage('')
      updateDiagnostics({
        lastActionStatus: 'idle',
        pendingActions: 0,
        socketState: 'open',
      })
      return true
    },
    [updateDiagnostics],
  )

  const stopHosting = useCallback(async () => {
    if (!window.fushiDesktop) {
      return
    }

    const result = await window.fushiDesktop.stopMultiplayerHost()
    setHostStatus(result.status ?? window.fushiDesktop.getMultiplayerHostStatus())
    setConnectedPlayers([])
    setConnectionStatus('offline')
    updateDiagnostics({
      lastActionStatus: 'offline',
      pendingActions: 0,
      socketState: 'closed',
    })
  }, [updateDiagnostics])

  const controlPlayerAdmission = useCallback(
    async (input: {
      action: 'accept' | 'kick' | 'reject'
      clientId?: string
      playerId?: string
    }) => {
      if (!window.fushiDesktop?.controlMultiplayerPlayerAdmission) {
        setErrorMessage('Controle de entrada exige o app desktop Electron.')
        return false
      }

      const result = await window.fushiDesktop.controlMultiplayerPlayerAdmission(input)

      if (result.status) {
        setHostStatus(result.status)
        setConnectedPlayers(result.status.clients)
      }

      if (!result.ok) {
        setErrorMessage(result.error ?? 'Nao foi possivel atualizar o acesso do jogador.')
        return false
      }

      setErrorMessage('')
      return true
    },
    [],
  )

  const applyPublicStatePayload = useCallback(
    (
      payload: unknown,
      config: MultiplayerClientConfig,
      options?: { resolvePendingAuth?: boolean },
    ) => {
      const nextPublicState = buildRemotePublicState(payload, config)
      const nextServerInstanceId =
        typeof nextPublicState?.serverInstanceId === 'string'
          ? nextPublicState.serverInstanceId
          : ''
      const nextStateVersion =
        typeof nextPublicState?.stateVersion === 'number' &&
        Number.isSafeInteger(nextPublicState.stateVersion) &&
        nextPublicState.stateVersion > 0
          ? nextPublicState.stateVersion
          : 0
      const serverInstanceChanged =
        Boolean(nextServerInstanceId) &&
        nextServerInstanceId !== remoteServerInstanceIdRef.current

      if (serverInstanceChanged) {
        remoteServerInstanceIdRef.current = nextServerInstanceId
        lastPublicStateVersionRef.current = 0
      }

      if (
        nextStateVersion > 0 &&
        nextStateVersion < lastPublicStateVersionRef.current
      ) {
        setDiagnostics((current) => ({
          ...current,
          staleStatesIgnored: current.staleStatesIgnored + 1,
        }))
        return
      }

      if (nextStateVersion > 0) {
        lastPublicStateVersionRef.current = nextStateVersion
        setDiagnostics((current) => ({
          ...current,
          stateVersion: serverInstanceChanged
            ? nextStateVersion
            : Math.max(current.stateVersion, nextStateVersion),
        }))
      }

      const nextPublicStateKey = createPublicStateKey(nextPublicState)

      if (nextPublicStateKey !== lastPublicStateKeyRef.current) {
        lastPublicStateKeyRef.current = nextPublicStateKey
        setPublicState(nextPublicState)
      }

      if (options?.resolvePendingAuth !== true || !pendingAuthRef.current?.profile) {
        return
      }

      if (pendingAuthRef.current.timeoutId) {
        window.clearTimeout(pendingAuthRef.current.timeoutId)
      }

      lastRemoteLoginRef.current = {
        config,
        password: pendingAuthRef.current.password,
        profileId: pendingAuthRef.current.profile.id,
      }
      setRemoteActiveProfile(pendingAuthRef.current.profile)
      pendingAuthRef.current.resolve(true)
      pendingAuthRef.current = null
    },
    [],
  )

  const joinSession = useCallback(
    async (input: MultiplayerClientConfig) =>
      new Promise<boolean>((resolve) => {
        const nextConfig = {
          ...input,
          host: normalizeHost(input.host) || '127.0.0.1',
          secure: input.secure ?? isSecureRemoteHost(input.host),
          sessionCode: input.sessionCode.trim().toUpperCase(),
        }

        if (!reconnectingRef.current) {
          disconnect()
          lastPublicStateKeyRef.current = ''
        }
        setConnectionStatus('connecting')
        setErrorMessage('')
        setClientConfig(nextConfig)
        updateDiagnostics({
          socketState: 'connecting',
        })
        if (!reconnectingRef.current) {
          remoteActionsInFlightRef.current = 0
        }
        manualDisconnectRef.current = false

        const socket = new WebSocket(buildWebSocketUrl(nextConfig))
        let settled = false
        const connectionTimeoutId = window.setTimeout(() => {
          if (settled) {
            return
          }

          settled = true
          socket.close()
          setConnectionStatus('error')
          setErrorMessage('Tempo esgotado aguardando dados da sessao FUSHI.')
          resolve(false)
        }, REMOTE_AUTH_APPROVAL_TIMEOUT_MS)

        socketRef.current = socket

        socket.onopen = () => {
          updateDiagnostics({
            socketState: 'open',
          })
          socket.send(JSON.stringify({ type: 'request-state' }))
        }

        socket.onmessage = (event) => {
          let message: MultiplayerWireMessage

          try {
            message = JSON.parse(String(event.data)) as MultiplayerWireMessage
          } catch {
            setErrorMessage('Mensagem invalida recebida do servidor multiplayer.')
            return
          }

          if (message.type === 'session-info' && message.payload && typeof message.payload === 'object') {
            const payload = message.payload as {
              accessState?: Partial<FushiAccessState>
            }

            setRemoteAccessState(normalizeRemoteAccessState(payload.accessState))

            if (!settled) {
              window.clearTimeout(connectionTimeoutId)
              setConnectionStatus('connected')
              reconnectAttemptRef.current = 0
              updateDiagnostics({
                reconnectAttempts: 0,
                socketState: 'open',
              })
              settled = true
              resolve(true)
            }
          }

          if (message.type === 'server-ping') {
            if (socket.readyState === WebSocket.OPEN) {
              const payload =
                message.payload && typeof message.payload === 'object'
                  ? (message.payload as { serverTime?: unknown })
                  : {}
              const serverTime =
                typeof payload.serverTime === 'number' ? payload.serverTime : undefined

              socket.send(
                JSON.stringify({
                  serverTime,
                  type: 'client-pong',
                }),
              )
            }
          }

          if (message.type === 'auth-ok' && message.payload && typeof message.payload === 'object') {
            const payload = message.payload as {
              profile?: FushiAccessProfile
            }
            const profile = payload.profile ?? null

            if (profile?.id && pendingAuthRef.current?.profileId === profile.id) {
              pendingAuthRef.current.profile = profile
            }
          }

          if (message.type === 'auth-error') {
            if (pendingAuthRef.current?.timeoutId) {
              window.clearTimeout(pendingAuthRef.current.timeoutId)
            }
            pendingAuthRef.current?.resolve(false)
            pendingAuthRef.current = null
            setErrorMessage(message.message ?? 'Nao foi possivel autenticar este acesso.')
          }

          if (message.type === 'admission-status' && message.payload && typeof message.payload === 'object') {
            const payload = message.payload as {
              message?: unknown
              status?: unknown
            }
            const status = typeof payload.status === 'string' ? payload.status : ''
            const admissionMessage =
              typeof payload.message === 'string' && payload.message
                ? payload.message
                : status === 'pending'
                  ? 'Aguardando o mestre liberar sua entrada.'
                  : 'Entrada remota atualizada pelo mestre.'

            if (status === 'pending') {
              setErrorMessage(admissionMessage)
            }

            if (status === 'accepted') {
              setErrorMessage('')
            }

            if (status === 'rejected' || status === 'kicked') {
              if (pendingAuthRef.current?.timeoutId) {
                window.clearTimeout(pendingAuthRef.current.timeoutId)
              }
              pendingAuthRef.current?.resolve(false)
              pendingAuthRef.current = null
              manualDisconnectRef.current = true
              lastRemoteLoginRef.current = null
              socket.close()
              setConnectionStatus('error')
              setErrorMessage(admissionMessage)
              setPublicState(null)
              setRemoteActiveProfile(null)
            }
          }

          if (message.type === 'public-state') {
            applyPublicStatePayload(message.payload, nextConfig, {
              resolvePendingAuth: true,
            })
          }

          if (message.type === 'action-ack' && message.payload && typeof message.payload === 'object') {
            const payload = message.payload as {
              actionId?: unknown
              applied?: unknown
              message?: unknown
              publicState?: unknown
            }
            const actionId = typeof payload.actionId === 'string' ? payload.actionId : ''

            if (payload.publicState) {
              applyPublicStatePayload(payload.publicState, nextConfig)
            }

            if (actionId) {
              const resolveAck = pendingActionAckResolversRef.current.get(actionId)

              if (resolveAck) {
                pendingActionAckResolversRef.current.delete(actionId)
                resolveAck({
                  applied: payload.applied !== false,
                  message: typeof payload.message === 'string' ? payload.message : undefined,
                  publicState: payload.publicState,
                  received: true,
                })
                updateDiagnostics({
                  lastAckAt: new Date().toISOString(),
                  lastActionStatus: payload.applied === false ? 'rejected' : 'confirmed',
                })
              }
            }
          }

          if (message.type === 'players' && message.payload && typeof message.payload === 'object') {
            const payload = message.payload as {
              players?: Array<{
                admissionStatus?: 'accepted' | 'anonymous' | 'kicked' | 'pending' | 'rejected'
                connectedAt: string
                id: string
                latencyMs?: number | null
                lastPongAt?: string | null
                playerId: string
                profileLabel?: string
                requestedAt?: string | null
              }>
            }

            setConnectedPlayers(Array.isArray(payload.players) ? payload.players : [])
          }

          if (message.type === 'error') {
            setErrorMessage(message.message ?? 'Erro de sessao multiplayer.')
            updateDiagnostics({
              lastActionStatus: 'rejected',
              lastErrorAt: new Date().toISOString(),
            })
          }
        }

        socket.onerror = () => {
          if (socketRef.current && socketRef.current !== socket) {
            return
          }

          window.clearTimeout(connectionTimeoutId)
          setConnectionStatus('error')
          setErrorMessage('Nao foi possivel conectar ao servidor FUSHI.')
          updateDiagnostics({
            lastActionStatus: 'offline',
            lastErrorAt: new Date().toISOString(),
            socketState: 'closed',
          })

          if (!settled) {
            settled = true
            resolve(false)
          }
        }

        socket.onclose = () => {
          if (socketRef.current && socketRef.current !== socket) {
            return
          }

          window.clearTimeout(connectionTimeoutId)
          const wasPending = !settled
          const shouldReconnect =
            !manualDisconnectRef.current &&
            Boolean(lastRemoteLoginRef.current) &&
            (settled ||
              connectionStatusRef.current === 'connected' ||
              connectionStatusRef.current === 'connecting')

          if (wasPending) {
            settled = true
            resolve(false)
            setErrorMessage((current) =>
              current || 'Conexao encerrada antes de entrar na sessao.',
            )
          }

          if (shouldReconnect) {
            const login = lastRemoteLoginRef.current
            const delay = Math.min(
              REMOTE_RECONNECT_MAX_DELAY_MS,
              REMOTE_RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttemptRef.current,
            )

            reconnectAttemptRef.current += 1
            setConnectionStatus('connecting')
            setErrorMessage('Reconectando ao servidor FUSHI...')
            updateDiagnostics({
              reconnectAttempts: reconnectAttemptRef.current,
              socketState: 'connecting',
            })
            if (login) {
              setClientConfig(login.config)
            }
            if (reconnectTimerRef.current !== null) {
              window.clearTimeout(reconnectTimerRef.current)
            }
            reconnectTimerRef.current = window.setTimeout(async () => {
              if (!lastRemoteLoginRef.current) {
                return
              }

              const nextLogin = lastRemoteLoginRef.current
              reconnectingRef.current = true
              const connected =
                (await joinSessionRef.current?.(nextLogin.config)) ?? false
              reconnectingRef.current = false

              if (
                connected &&
                socketRef.current &&
                socketRef.current.readyState === WebSocket.OPEN
              ) {
                socketRef.current.send(
                  JSON.stringify({
                    password: nextLogin.password,
                    profileId: nextLogin.profileId,
                    type: 'authenticate',
                  }),
                )
                setErrorMessage('')
              }
            }, delay)
          } else {
            setConnectionStatus((current) =>
              current === 'connected' || current === 'connecting' ? 'offline' : current,
            )
            setClientConfig(null)
            setPublicState(null)
            setRemoteAccessState(null)
            setRemoteActiveProfile(null)
            lastPublicStateKeyRef.current = ''
            lastPublicStateVersionRef.current = 0
            remoteServerInstanceIdRef.current = ''
            updateDiagnostics({
              lastActionStatus: 'offline',
              socketState: 'closed',
            })
          }
          setNetworkLatencyMs(null)
          if (!shouldReconnect) {
            remoteActionsInFlightRef.current = 0
          }
          if (pendingAuthRef.current?.timeoutId) {
            window.clearTimeout(pendingAuthRef.current.timeoutId)
          }
          pendingAuthRef.current?.resolve(false)
          pendingAuthRef.current = null
          manualDisconnectRef.current = false
        }
      }),
    [applyPublicStatePayload, disconnect, updateDiagnostics],
  )

  useLayoutEffect(() => {
    joinSessionRef.current = joinSession
  }, [joinSession])

  const sendSocketMessage = useCallback((message: Record<string, unknown>) => {
    const socket = socketRef.current

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return
    }

    socket.send(JSON.stringify(message))
  }, [])

  const fetchPublicState = useCallback(async () => {
    const config = clientConfigRef.current
    const profile = remoteActiveProfileRef.current

    if (!config || !profile) {
      return false
    }

    const url = new URL(buildSessionHttpUrl(config, '/state'))
    url.searchParams.set('code', config.sessionCode.trim().toUpperCase())
    url.searchParams.set('playerId', profile.id)

    const response = await fetch(url.toString(), {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Estado HTTP falhou: ${response.status}`)
    }

    const payload = (await response.json()) as { publicState?: unknown }
    applyPublicStatePayload(payload.publicState ?? payload, config)
    return true
  }, [applyPublicStatePayload])

  const waitForRemoteActionAck = useCallback(
    (actionId: string) =>
      new Promise<RemoteActionAckOutcome>((resolve) => {
        const timeoutId = window.setTimeout(() => {
          pendingActionAckResolversRef.current.delete(actionId)
          resolve({ applied: false, received: false })
        }, REMOTE_ACTION_ACK_TIMEOUT_MS)

        pendingActionAckResolversRef.current.set(actionId, (outcome) => {
          window.clearTimeout(timeoutId)
          resolve(outcome)
        })
      }),
    [],
  )

  const processRemoteActionQueue = useCallback(() => {
    if (remoteActionProcessingRef.current) {
      return
    }

    remoteActionProcessingRef.current = true

    const run = async () => {
      try {
        while (remoteActionQueueRef.current.length > 0) {
          const config = clientConfigRef.current
          const profile = remoteActiveProfileRef.current
          const action = remoteActionQueueRef.current[0]

          if (!config || !profile) {
            updateDiagnostics({
              lastActionStatus: 'offline',
              pendingActions: remoteActionQueueRef.current.length,
              socketState: socketRef.current ? 'closed' : 'unavailable',
            })
            break
          }

          const messageWithActionId = {
            ...action.message,
            remoteActionId: action.id,
          }
          let shouldRetry = false

          try {
            const controller = new AbortController()
            const timeoutId = window.setTimeout(() => {
              controller.abort()
            }, REMOTE_ACTION_HTTP_TIMEOUT_MS)

            const response = await fetch(buildSessionHttpUrl(config, '/action'), {
              body: JSON.stringify({
                actionId: action.id,
                code: config.sessionCode.trim().toUpperCase(),
                message: messageWithActionId,
                playerId: profile.id,
              }),
              cache: 'no-store',
              headers: {
                'Content-Type': 'application/json',
              },
              method: 'POST',
              signal: controller.signal,
            })

            window.clearTimeout(timeoutId)

            const payload = (await response.json().catch(() => ({}))) as RemoteActionResponse

            if (payload.publicState) {
              applyPublicStatePayload(payload.publicState, config)
            }

            if (response.ok && payload.ok !== false && payload.applied !== false) {
              remoteActionQueueRef.current.shift()
              remoteActionsInFlightRef.current = remoteActionQueueRef.current.length
              updateDiagnostics({
                lastAckAt: new Date().toISOString(),
                lastActionStatus: 'confirmed',
                lastActionType: String(action.message.type ?? ''),
                pendingActions: remoteActionQueueRef.current.length,
                retryAttempts: action.attempts,
              })
              setErrorMessage((current) =>
                current === 'Aguardando servidor FUSHI confirmar a acao remota...'
                  ? ''
                  : current,
              )
              continue
            }

            if (response.ok) {
              remoteActionQueueRef.current.shift()
              remoteActionsInFlightRef.current = remoteActionQueueRef.current.length
              updateDiagnostics({
                lastAckAt: new Date().toISOString(),
                lastActionStatus: 'rejected',
                lastActionType: String(action.message.type ?? ''),
                lastErrorAt: new Date().toISOString(),
                pendingActions: remoteActionQueueRef.current.length,
                retryAttempts: action.attempts,
              })
              setErrorMessage(
                payload.error ??
                  payload.message ??
                  'A mesa recusou esta acao remota pelo estado atual.',
              )
              continue
            }

            shouldRetry =
              response.status === 408 || response.status === 429 || response.status >= 500
          } catch {
            const socket = socketRef.current

            if (socket && socket.readyState === WebSocket.OPEN) {
              try {
                const ackPromise = waitForRemoteActionAck(action.id)
                socket.send(JSON.stringify(messageWithActionId))
                const ack = await ackPromise

                if (ack.publicState) {
                  applyPublicStatePayload(ack.publicState, config)
                }

                if (ack.received && ack.applied) {
                  remoteActionQueueRef.current.shift()
                  remoteActionsInFlightRef.current = remoteActionQueueRef.current.length
                  updateDiagnostics({
                    lastAckAt: new Date().toISOString(),
                    lastActionStatus: 'confirmed',
                    lastActionType: String(action.message.type ?? ''),
                    pendingActions: remoteActionQueueRef.current.length,
                    retryAttempts: action.attempts,
                  })
                  setErrorMessage((current) =>
                    current === 'Aguardando servidor FUSHI confirmar a acao remota...'
                      ? ''
                      : current,
                  )
                  continue
                }

                if (ack.received && !ack.applied) {
                  remoteActionQueueRef.current.shift()
                  remoteActionsInFlightRef.current = remoteActionQueueRef.current.length
                  updateDiagnostics({
                    lastAckAt: new Date().toISOString(),
                    lastActionStatus: 'rejected',
                    lastActionType: String(action.message.type ?? ''),
                    lastErrorAt: new Date().toISOString(),
                    pendingActions: remoteActionQueueRef.current.length,
                    retryAttempts: action.attempts,
                  })
                  setErrorMessage(
                    ack.message ?? 'A mesa recusou esta acao remota pelo estado atual.',
                  )
                  continue
                }
              } catch {
                // Keep the action queued and retry below.
              }
            }

            shouldRetry = true
          }

          if (shouldRetry) {
            action.attempts += 1
            remoteActionsInFlightRef.current = remoteActionQueueRef.current.length
            updateDiagnostics({
              lastActionStatus: 'retrying',
              lastActionType: String(action.message.type ?? ''),
              lastErrorAt: new Date().toISOString(),
              pendingActions: remoteActionQueueRef.current.length,
              retryAttempts: action.attempts,
            })
            setErrorMessage('Aguardando servidor FUSHI confirmar a acao remota...')

            const delay = Math.min(
              REMOTE_ACTION_RETRY_MAX_DELAY_MS,
              REMOTE_ACTION_RETRY_BASE_DELAY_MS * 2 ** Math.min(action.attempts, 5),
            )

            if (remoteActionFlushTimerRef.current !== null) {
              window.clearTimeout(remoteActionFlushTimerRef.current)
            }
            remoteActionFlushTimerRef.current = window.setTimeout(() => {
              remoteActionFlushTimerRef.current = null
              processRemoteActionQueueRef.current()
            }, delay)
            break
          }

          remoteActionQueueRef.current.shift()
          remoteActionsInFlightRef.current = remoteActionQueueRef.current.length
          updateDiagnostics({
            pendingActions: remoteActionQueueRef.current.length,
          })
        }
      } finally {
        remoteActionProcessingRef.current = false
        remoteActionsInFlightRef.current = remoteActionQueueRef.current.length
        updateDiagnostics({
          pendingActions: remoteActionQueueRef.current.length,
        })
        if (
          remoteActionQueueRef.current.length > 0 &&
          remoteActionFlushTimerRef.current === null
        ) {
          remoteActionFlushTimerRef.current = window.setTimeout(() => {
            remoteActionFlushTimerRef.current = null
            processRemoteActionQueueRef.current()
          }, 0)
        }
      }
    }

    void run()
  }, [applyPublicStatePayload, updateDiagnostics, waitForRemoteActionAck])

  useLayoutEffect(() => {
    processRemoteActionQueueRef.current = processRemoteActionQueue
  }, [processRemoteActionQueue])

  const scheduleRemoteActionFlush = useCallback((delay = 0) => {
    if (remoteActionFlushTimerRef.current !== null) {
      window.clearTimeout(remoteActionFlushTimerRef.current)
      remoteActionFlushTimerRef.current = null
    }

    remoteActionFlushTimerRef.current = window.setTimeout(() => {
      remoteActionFlushTimerRef.current = null
      processRemoteActionQueueRef.current()
    }, delay)
  }, [])

  const sendRemoteAction = useCallback(
    (message: Record<string, unknown>) => {
      const config = clientConfigRef.current
      const profile = remoteActiveProfileRef.current

      if (!config || !profile) {
        sendSocketMessage(message)
        return
      }

      const action: RemoteQueuedAction = {
        attempts: 0,
        id: createRemoteActionId(profile.id, message.type),
        message,
        queuedAt: Date.now(),
      }

      remoteActionQueueRef.current.push(action)
      remoteActionsInFlightRef.current = remoteActionQueueRef.current.length
      updateDiagnostics({
        lastActionStatus: 'queued',
        lastActionType: String(message.type ?? ''),
        lastQueuedAt: new Date(action.queuedAt).toISOString(),
        pendingActions: remoteActionQueueRef.current.length,
      })
      scheduleRemoteActionFlush(0)
    },
    [scheduleRemoteActionFlush, sendSocketMessage, updateDiagnostics],
  )

  const requestState = useCallback(async () => {
    if (remoteStateRequestInFlightRef.current) {
      return
    }

    remoteStateRequestInFlightRef.current = true

    try {
      const handled = await fetchPublicState()

      if (!handled) {
        sendSocketMessage({ type: 'request-state' })
      }
    } catch {
      sendSocketMessage({ type: 'request-state' })
    } finally {
      remoteStateRequestInFlightRef.current = false
    }
  }, [fetchPublicState, sendSocketMessage])

  useEffect(() => {
    if (
      connectionStatus !== 'connected' ||
      !clientConfig ||
      !remoteActiveProfile ||
      remoteActionQueueRef.current.length === 0
    ) {
      return
    }

    scheduleRemoteActionFlush(0)
  }, [clientConfig, connectionStatus, remoteActiveProfile, scheduleRemoteActionFlush])

  useEffect(() => {
    if (
      connectionStatus !== 'connected' ||
      !clientConfig ||
      !remoteActiveProfile
    ) {
      return
    }

    let cancelled = false
    let timeoutId: number | null = null

    const queueNextPoll = (delay: number) => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) {
          return
        }

        void requestState().finally(() => {
          if (cancelled) {
            return
          }

          queueNextPoll(
            document.visibilityState === 'hidden'
              ? REMOTE_PUBLIC_STATE_HIDDEN_POLL_MS
              : REMOTE_PUBLIC_STATE_POLL_MS,
          )
        })
      }, delay)
    }

    const requestFreshState = () => {
      void requestState()
    }

    void requestState()
    queueNextPoll(REMOTE_PUBLIC_STATE_POLL_MS)
    window.addEventListener('focus', requestFreshState)
    document.addEventListener('visibilitychange', requestFreshState)

    return () => {
      cancelled = true
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
      window.removeEventListener('focus', requestFreshState)
      document.removeEventListener('visibilitychange', requestFreshState)
    }
  }, [clientConfig, connectionStatus, remoteActiveProfile, requestState])

  useEffect(() => {
    const shouldMeasureHost =
      connectionStatus === 'hosting' && Boolean(hostStatus?.isRunning && hostStatus.port)
    const shouldMeasureRemote =
      connectionStatus === 'connected' && Boolean(clientConfig && remoteActiveProfile)

    if (!shouldMeasureHost && !shouldMeasureRemote) {
      return
    }

    let cancelled = false
    let timeoutId: number | null = null

    const measureLatency = async () => {
      const startedAt = performance.now()

      try {
        const url =
          shouldMeasureHost && hostStatus?.port
            ? new URL(`http://127.0.0.1:${hostStatus.port}/ping`)
            : new URL(buildSessionHttpUrl(clientConfig as MultiplayerClientConfig, '/ping'))

        if (!shouldMeasureHost && clientConfig) {
          url.searchParams.set('code', clientConfig.sessionCode.trim().toUpperCase())
        }

        const response = await fetch(url.toString(), {
          cache: 'no-store',
        })

        if (!cancelled && response.ok) {
          setNetworkLatencyMs(Math.round(performance.now() - startedAt))
        }
      } catch {
        if (!cancelled) {
          setNetworkLatencyMs(null)
        }
      } finally {
        if (!cancelled) {
          timeoutId = window.setTimeout(measureLatency, 2000)
        }
      }
    }

    void measureLatency()

    return () => {
      cancelled = true
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [clientConfig, connectionStatus, hostStatus?.isRunning, hostStatus?.port, remoteActiveProfile])

  const authenticateRemoteProfile = useCallback(
    (profileId: FushiAccessProfileId, password: string) =>
      new Promise<boolean>((resolve) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          resolve(false)
          return
        }

        pendingAuthRef.current?.resolve(false)
        if (pendingAuthRef.current?.timeoutId) {
          window.clearTimeout(pendingAuthRef.current.timeoutId)
        }
        pendingAuthRef.current = {
          password,
          profileId,
          resolve,
        }
        pendingAuthRef.current.timeoutId = window.setTimeout(() => {
          if (pendingAuthRef.current?.profileId !== profileId) {
            return
          }

          pendingAuthRef.current.resolve(false)
          pendingAuthRef.current = null
          setErrorMessage('Tempo esgotado aguardando liberacao do mestre.')
        }, 15000)
        socketRef.current.send(
          JSON.stringify({
            password,
            profileId,
            type: 'authenticate',
          }),
        )
      }),
    [],
  )

  const moveToken = useCallback((tokenId: string, cell: TabletopCell) => {
    sendRemoteAction({
      cell,
      tokenId,
      type: 'move-token',
    })
  }, [sendRemoteAction])

  const addLogEntry = useCallback((entry: TabletopLogEntry) => {
    sendRemoteAction({
      entry,
      type: 'add-log-entry',
    })
  }, [sendRemoteAction])

  const updateCharacter = useCallback((character: CharacterSheet) => {
    sendRemoteAction({
      character,
      type: 'update-character',
    })
  }, [sendRemoteAction])

  const updateMeasurement = useCallback(
    (measurement: Pick<TabletopMeasurement, 'end' | 'start' | 'visualColor'> | null) => {
      sendRemoteAction({
        measurement,
        type: 'update-measurement',
      })
    },
    [sendRemoteAction],
  )

  const shouldExposeNetworkLatency =
    (connectionStatus === 'hosting' && Boolean(hostStatus?.isRunning && hostStatus.port)) ||
    (connectionStatus === 'connected' && Boolean(clientConfig && remoteActiveProfile))
  const displayedNetworkLatencyMs = shouldExposeNetworkLatency ? networkLatencyMs : null

  return (
    <MultiplayerContext.Provider
      value={{
        addLogEntry,
        authenticateRemoteProfile,
        clientConfig,
        connectedPlayers,
        connectionStatus,
        controlPlayerAdmission,
        diagnostics,
        disconnect,
        errorMessage,
        hostStatus,
        joinSession,
        moveToken,
        networkLatencyMs: displayedNetworkLatencyMs,
        publicState,
        remoteAccessState,
        remoteActiveProfile,
        refreshHostStatus,
        requestState,
        startHosting,
        stopHosting,
        updateCharacter,
        updateMeasurement,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  )
}
