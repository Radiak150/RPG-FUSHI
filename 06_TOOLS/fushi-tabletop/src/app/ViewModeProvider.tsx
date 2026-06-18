import { type PropsWithChildren, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AppViewMode } from '../data/types'
import { useMultiplayer } from '../hooks/useMultiplayer'
import type {
  FushiAccessProfile,
  FushiAccessProfileId,
  FushiAccessState,
} from '../lib/playerAccess'
import {
  createFushiAccessState,
  getFushiAccessProfile,
  isFushiAccessProfileId,
  readFushiAccessState,
  writeFushiAccessState,
} from '../lib/playerAccess'
import {
  clearPersistedViewPreferences,
  readPersistedViewPreferences,
  writePersistedViewPreferences,
} from '../lib/tabletopSession'
import { ViewModeContext } from './ViewModeContext'

function readDesktopProfileOverride(): FushiAccessProfileId | '' {
  if (!window.fushiDesktop) {
    return ''
  }

  const profileId = new URLSearchParams(window.location.search).get('fushiProfile')

  return profileId && isFushiAccessProfileId(profileId) ? profileId : ''
}

const EMPTY_REMOTE_ACCESS_STATE: FushiAccessState = {
  activeProfileId: '',
  profiles: [],
  version: 1,
}

export function ViewModeProvider({ children }: PropsWithChildren) {
  const multiplayer = useMultiplayer()
  const [desktopProfileOverride] = useState(() => readDesktopProfileOverride())
  const skipNextAccessSaveRef = useRef(false)
  const latestAccessStateRef = useRef<ReturnType<typeof createFushiAccessState> | null>(null)
  const latestPreferencesRef = useRef<ReturnType<typeof readPersistedViewPreferences> | null>(null)
  const [accessState, setAccessState] = useState(() =>
    createFushiAccessState({
      ...readFushiAccessState(),
      activeProfileId:
        desktopProfileOverride || readFushiAccessState().activeProfileId,
    }),
  )
  const isRemoteClient =
    multiplayer.connectionStatus === 'connected' && Boolean(multiplayer.clientConfig)
  const remoteActiveProfileId: FushiAccessProfileId | '' =
    multiplayer.remoteActiveProfile?.id &&
    multiplayer.remoteAccessState?.profiles.some(
      (profile) => profile.id === multiplayer.remoteActiveProfile?.id,
    )
      ? multiplayer.remoteActiveProfile.id
      : ''
  const effectiveAccessState =
    isRemoteClient
      ? {
          ...(multiplayer.remoteAccessState ?? EMPTY_REMOTE_ACCESS_STATE),
          activeProfileId: remoteActiveProfileId,
        }
      : accessState
  const activeAccessProfile = getFushiAccessProfile(
    effectiveAccessState,
    effectiveAccessState.activeProfileId,
  )
  const [preferences, setPreferences] = useState(() => {
    const savedPreferences = readPersistedViewPreferences()
    const forcedProfile = desktopProfileOverride
      ? getFushiAccessProfile(accessState, desktopProfileOverride)
      : null

    if (!forcedProfile) {
      return savedPreferences
    }

    return {
      playerCharacterId:
        forcedProfile.role === 'player' ? forcedProfile.characterId : '',
      viewMode: forcedProfile.role === 'gm' ? 'gm' : 'player',
    } satisfies ReturnType<typeof readPersistedViewPreferences>
  })

  useLayoutEffect(() => {
    latestPreferencesRef.current = preferences

    if (desktopProfileOverride || isRemoteClient) {
      return
    }

    writePersistedViewPreferences(preferences)
  }, [desktopProfileOverride, isRemoteClient, preferences])

  useLayoutEffect(() => {
    latestAccessStateRef.current = accessState

    if (isRemoteClient) {
      return
    }

    if (skipNextAccessSaveRef.current) {
      skipNextAccessSaveRef.current = false
      return
    }

    writeFushiAccessState(
      desktopProfileOverride
        ? createFushiAccessState({
            ...accessState,
            activeProfileId: '',
          })
        : accessState,
    )
  }, [accessState, desktopProfileOverride, isRemoteClient])

  useEffect(() => {
    function flushAccessBeforeClose() {
      if (isRemoteClient) {
        return
      }

      if (!desktopProfileOverride && latestPreferencesRef.current) {
        writePersistedViewPreferences(latestPreferencesRef.current)
      }

      if (latestAccessStateRef.current) {
        writeFushiAccessState(
          desktopProfileOverride
            ? createFushiAccessState({
                ...latestAccessStateRef.current,
                activeProfileId: '',
              })
            : latestAccessStateRef.current,
        )
      }
    }

    window.addEventListener('beforeunload', flushAccessBeforeClose)

    return () => {
      window.removeEventListener('beforeunload', flushAccessBeforeClose)
      flushAccessBeforeClose()
    }
  }, [desktopProfileOverride, isRemoteClient])

  useEffect(() => {
    if (!isRemoteClient) {
      return
    }

    queueMicrotask(() => {
      setPreferences({
        playerCharacterId:
          multiplayer.remoteActiveProfile?.role === 'player'
            ? multiplayer.remoteActiveProfile.characterId
            : '',
        viewMode: multiplayer.remoteActiveProfile?.role === 'gm' ? 'gm' : 'player',
      })
    })
  }, [
    isRemoteClient,
    multiplayer.remoteActiveProfile?.characterId,
    multiplayer.remoteActiveProfile?.id,
    multiplayer.remoteActiveProfile?.role,
  ])

  useEffect(() => {
    const unsubscribe = window.fushiDesktop?.onStorageChanged((event) => {
      if (event.name !== 'access') {
        return
      }

      skipNextAccessSaveRef.current = true
      setAccessState(
        createFushiAccessState({
          ...readFushiAccessState(),
          activeProfileId:
            desktopProfileOverride || readFushiAccessState().activeProfileId,
        }),
      )
    })

    return () => {
      unsubscribe?.()
    }
  }, [desktopProfileOverride])

  function setViewMode(viewMode: AppViewMode) {
    if (isRemoteClient && activeAccessProfile?.role !== 'gm') {
      return
    }

    if (activeAccessProfile?.role === 'gm') {
      setPreferences((currentPreferences) => ({
        ...currentPreferences,
        viewMode,
      }))
      return
    }

    if (activeAccessProfile?.role === 'player' && viewMode === 'player') {
      setPreferences((currentPreferences) => ({
        ...currentPreferences,
        viewMode: 'player',
      }))
    }
  }

  function setPlayerCharacterId(characterId: string) {
    if (isRemoteClient) {
      return
    }

    if (activeAccessProfile?.role === 'player') {
      if (!activeAccessProfile.characterId || characterId !== activeAccessProfile.characterId) {
        return
      }
    }

    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      playerCharacterId: characterId,
    }))

    if (activeAccessProfile?.role === 'player') {
      updateAccessProfile(activeAccessProfile.id, {
        characterId,
      })
    }
  }

  async function authenticateAccessProfile(
    profileId: FushiAccessProfileId,
    password: string,
  ) {
    if (isRemoteClient) {
      const authenticated = await multiplayer.authenticateRemoteProfile(profileId, password)
      const targetProfile = effectiveAccessState.profiles.find(
        (profile) => profile.id === profileId,
      )

      if (authenticated && targetProfile) {
        setPreferences((currentPreferences) => ({
          ...currentPreferences,
          playerCharacterId:
            targetProfile.role === 'player'
              ? targetProfile.characterId
              : '',
          viewMode: targetProfile.role === 'gm' ? 'gm' : 'player',
        }))
      }

      return authenticated
    }

    const targetProfile = accessState.profiles.find((profile) => profile.id === profileId)

    if (!targetProfile || targetProfile.password !== password) {
      return false
    }

    setAccessState((currentState) =>
      createFushiAccessState({
        ...currentState,
        activeProfileId: profileId,
      }),
    )
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      playerCharacterId:
        targetProfile.role === 'player'
          ? targetProfile.characterId
          : '',
      viewMode: targetProfile.role === 'gm' ? 'gm' : 'player',
    }))

    return true
  }

  function logoutAccessProfile() {
    if (isRemoteClient) {
      multiplayer.disconnect()
      return
    }

    if (desktopProfileOverride) {
      return
    }

    setAccessState((currentState) =>
      createFushiAccessState({
        ...currentState,
        activeProfileId: '',
      }),
    )
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      playerCharacterId: '',
      viewMode: 'player',
    }))
  }

  function updateAccessProfile(
    profileId: FushiAccessProfileId,
    updates: Partial<Pick<FushiAccessProfile, 'characterId' | 'label' | 'password'>>,
  ) {
    if (isRemoteClient) {
      return
    }

    setAccessState((currentState) =>
      createFushiAccessState({
        ...currentState,
        profiles: currentState.profiles.map((profile) =>
          profile.id === profileId
            ? {
                ...profile,
                ...updates,
                password: updates.password?.trim() || profile.password,
              }
            : profile,
        ),
      }),
    )
  }

  function resetViewMode() {
    if (isRemoteClient) {
      multiplayer.disconnect()
      return
    }

    clearPersistedViewPreferences()
    setAccessState((currentState) =>
      createFushiAccessState({
        ...currentState,
        activeProfileId: '',
      }),
    )
    setPreferences({
      viewMode: 'player',
      playerCharacterId: '',
    })
  }

  return (
    <ViewModeContext.Provider
      value={{
        viewMode: preferences.viewMode,
        supportedViews: ['gm', 'player'],
        playerCharacterId: preferences.playerCharacterId,
        accessState: effectiveAccessState,
        activeAccessProfile,
        authenticateAccessProfile,
        logoutAccessProfile,
        setViewMode,
        setPlayerCharacterId,
        updateAccessProfile,
        resetViewMode,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  )
}
