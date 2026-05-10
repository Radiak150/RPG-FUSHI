export type FushiAccessProfileId =
  | 'gm'
  | 'player1'
  | 'player2'
  | 'player3'
  | 'player4'
  | 'player5'

export type FushiAccessRole = 'gm' | 'player'

export interface FushiAccessProfile {
  id: FushiAccessProfileId
  label: string
  role: FushiAccessRole
  password: string
  characterId: string
}

export interface FushiAccessState {
  version: 1
  activeProfileId: FushiAccessProfileId | ''
  profiles: FushiAccessProfile[]
}

const ACCESS_STORAGE_KEY = 'fushi-tabletop:access-control:v1'
const ACTIVE_ACCESS_SESSION_KEY = 'fushi-tabletop:active-access-profile:v1'

export const DEFAULT_FUSHI_ACCESS_PROFILES: FushiAccessProfile[] = [
  {
    id: 'gm',
    label: 'Mestre',
    role: 'gm',
    password: 'mestre1',
    characterId: '',
  },
  {
    id: 'player1',
    label: 'Jogador 1',
    role: 'player',
    password: '111',
    characterId: 'fragmento-p01',
  },
  {
    id: 'player2',
    label: 'Jogador 2',
    role: 'player',
    password: '222',
    characterId: 'fragmento-p02',
  },
  {
    id: 'player3',
    label: 'Jogador 3',
    role: 'player',
    password: '333',
    characterId: '',
  },
  {
    id: 'player4',
    label: 'Jogador 4',
    role: 'player',
    password: '444',
    characterId: '',
  },
  {
    id: 'player5',
    label: 'Jogador 5',
    role: 'player',
    password: '555',
    characterId: '',
  },
]

export const EMPTY_FUSHI_ACCESS_STATE: FushiAccessState = {
  version: 1,
  activeProfileId: '',
  profiles: DEFAULT_FUSHI_ACCESS_PROFILES,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function readStorageItem(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function readSessionStorageItem(key: string) {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSessionStorageItem(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    return
  }
}

function removeSessionStorageItem(key: string) {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    return
  }
}

function writeStorageItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return
  }
}

function normalizeProfile(value: unknown, fallback: FushiAccessProfile) {
  if (!isRecord(value)) {
    return fallback
  }

  return {
    ...fallback,
    label: typeof value.label === 'string' ? value.label : fallback.label,
    password:
      typeof value.password === 'string' && value.password.length > 0
        ? value.password
        : fallback.password,
    characterId:
      typeof value.characterId === 'string' ? value.characterId : fallback.characterId,
  }
}

export function createFushiAccessState(input?: Partial<FushiAccessState>): FushiAccessState {
  const profiles = DEFAULT_FUSHI_ACCESS_PROFILES.map((fallbackProfile) => {
    const currentProfile = input?.profiles?.find(
      (profile) => profile.id === fallbackProfile.id,
    )

    return normalizeProfile(currentProfile, fallbackProfile)
  })
  const activeProfileId = profiles.some((profile) => profile.id === input?.activeProfileId)
    ? input?.activeProfileId ?? ''
    : ''

  return {
    version: 1 as const,
    activeProfileId,
    profiles,
  }
}

export function readFushiAccessState() {
  const rawValue = readStorageItem(ACCESS_STORAGE_KEY)
  const activeProfileId = readActiveFushiAccessProfileId()

  if (!rawValue) {
    return createFushiAccessState({
      ...cloneValue(EMPTY_FUSHI_ACCESS_STATE),
      activeProfileId,
    })
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown

    if (!isRecord(parsedValue) || parsedValue.version !== 1) {
      return cloneValue(EMPTY_FUSHI_ACCESS_STATE)
    }

    return createFushiAccessState({
      activeProfileId,
      profiles: Array.isArray(parsedValue.profiles)
        ? (parsedValue.profiles as FushiAccessProfile[])
        : [],
    })
  } catch {
    return cloneValue(EMPTY_FUSHI_ACCESS_STATE)
  }
}

export function writeFushiAccessState(state: FushiAccessState) {
  const normalizedState = createFushiAccessState(state)

  writeActiveFushiAccessProfileId(normalizedState.activeProfileId)
  writeStorageItem(
    ACCESS_STORAGE_KEY,
    JSON.stringify({
      ...normalizedState,
      activeProfileId: '',
    }),
  )
}

export function getFushiAccessProfile(
  state: FushiAccessState,
  profileId: FushiAccessProfileId | '',
) {
  return state.profiles.find((profile) => profile.id === profileId) ?? null
}

export function isFushiAccessProfileId(value: string): value is FushiAccessProfileId {
  return DEFAULT_FUSHI_ACCESS_PROFILES.some((profile) => profile.id === value)
}

export function readActiveFushiAccessProfileId(): FushiAccessProfileId | '' {
  const value = readSessionStorageItem(ACTIVE_ACCESS_SESSION_KEY)

  return value && isFushiAccessProfileId(value) ? value : ''
}

export function writeActiveFushiAccessProfileId(profileId: FushiAccessProfileId | '') {
  if (!profileId) {
    removeSessionStorageItem(ACTIVE_ACCESS_SESSION_KEY)
    return
  }

  writeSessionStorageItem(ACTIVE_ACCESS_SESSION_KEY, profileId)
}
