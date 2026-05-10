import { type PropsWithChildren, useEffect, useState } from 'react'
import type { AppViewMode } from '../data/types'
import type { FushiAccessProfile, FushiAccessProfileId } from '../lib/playerAccess'
import {
  createFushiAccessState,
  getFushiAccessProfile,
  readFushiAccessState,
  writeFushiAccessState,
} from '../lib/playerAccess'
import {
  clearPersistedViewPreferences,
  readPersistedViewPreferences,
  writePersistedViewPreferences,
} from '../lib/tabletopSession'
import { ViewModeContext } from './ViewModeContext'

export function ViewModeProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] = useState(() => readPersistedViewPreferences())
  const [accessState, setAccessState] = useState(() => readFushiAccessState())
  const activeAccessProfile = getFushiAccessProfile(
    accessState,
    accessState.activeProfileId,
  )

  useEffect(() => {
    writePersistedViewPreferences(preferences)
  }, [preferences])

  useEffect(() => {
    writeFushiAccessState(accessState)
  }, [accessState])

  function setViewMode(viewMode: AppViewMode) {
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

  function authenticateAccessProfile(
    profileId: FushiAccessProfileId,
    password: string,
  ) {
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
        accessState,
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
