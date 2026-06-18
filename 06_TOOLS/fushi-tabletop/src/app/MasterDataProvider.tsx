import {
  type PropsWithChildren,
  startTransition,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { mockMasterRepository } from '../data/repositories/mockMasterRepository'
import type {
  CharacterSheet,
  LocalCampaign,
  MasterPanelData,
} from '../data/types'
import {
  mergeMasterPanelData,
  readMasterWorkspace,
  writeMasterWorkspace,
} from '../lib/masterWorkspace'
import { useMultiplayer } from '../hooks/useMultiplayer'
import { MasterDataContext, type MasterDataStatus } from './MasterDataContext'

export function MasterDataProvider({ children }: PropsWithChildren) {
  const { connectionStatus, publicState } = useMultiplayer()
  const [status, setStatus] = useState<MasterDataStatus>('loading')
  const [baseData, setBaseData] = useState<MasterPanelData | null>(null)
  const [workspace, setWorkspace] = useState<ReturnType<
    typeof readMasterWorkspace
  > | null>(null)
  const skipNextWorkspaceSaveRef = useRef(false)
  const latestWorkspaceRef = useRef<ReturnType<typeof readMasterWorkspace> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const data = useMemo(() => {
    if (!baseData || !workspace) {
      return null
    }

    const mergedData = mergeMasterPanelData(baseData, workspace)

    if (connectionStatus !== 'connected' || !Array.isArray(publicState?.characters)) {
      return mergedData
    }

    const charactersById = new Map(
      mergedData.characters.items.map((character) => [character.id, character]),
    )

    publicState.characters.forEach((character) => {
      if (!character || typeof character !== 'object') {
        return
      }

      const candidate = character as Partial<CharacterSheet>

      if (typeof candidate.id !== 'string' || !candidate.id) {
        return
      }

      charactersById.set(candidate.id, {
        ...(charactersById.get(candidate.id) ?? {}),
        ...candidate,
      } as CharacterSheet)
    })

    return {
      ...mergedData,
      characters: {
        ...mergedData.characters,
        items: Array.from(charactersById.values()),
      },
    }
  }, [baseData, connectionStatus, publicState, workspace])

  async function load() {
    setStatus('loading')
    setError(null)

    try {
      const nextBaseData = await mockMasterRepository.getMasterPanelData()
      const nextWorkspace = readMasterWorkspace(nextBaseData)

      startTransition(() => {
        setBaseData(nextBaseData)
        setWorkspace(nextWorkspace)
        setStatus('ready')
      })
    } catch (loadError) {
      const nextError =
        loadError instanceof Error
          ? loadError.message
          : 'Nao foi possivel carregar os dados locais.'

      startTransition(() => {
        setError(nextError)
        setStatus('error')
      })
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void load()
    })
  }, [])

  useLayoutEffect(() => {
    latestWorkspaceRef.current = workspace

    if (!workspace) {
      return
    }

    if (skipNextWorkspaceSaveRef.current) {
      skipNextWorkspaceSaveRef.current = false
      return
    }

    writeMasterWorkspace(workspace)
  }, [workspace])

  useEffect(() => {
    function flushWorkspaceBeforeClose() {
      if (latestWorkspaceRef.current) {
        writeMasterWorkspace(latestWorkspaceRef.current)
      }
    }

    window.addEventListener('beforeunload', flushWorkspaceBeforeClose)

    return () => {
      window.removeEventListener('beforeunload', flushWorkspaceBeforeClose)
      flushWorkspaceBeforeClose()
    }
  }, [])

  useEffect(() => {
    const unsubscribe = window.fushiDesktop?.onStorageChanged((event) => {
      if (event.name !== 'workspace') {
        return
      }

      skipNextWorkspaceSaveRef.current = true
      void load()
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  function updateWorkspaceState(
    updater: (
      currentWorkspace: ReturnType<typeof readMasterWorkspace> | null,
    ) => ReturnType<typeof readMasterWorkspace> | null,
  ) {
    setWorkspace((currentWorkspace) => {
      const nextWorkspace = updater(currentWorkspace)

      if (nextWorkspace) {
        latestWorkspaceRef.current = nextWorkspace
        writeMasterWorkspace(nextWorkspace)
      }

      return nextWorkspace
    })
  }

  function createCharacter(character: CharacterSheet) {
    if (!workspace) {
      return null
    }

    const nextCharacter = {
      ...character,
    }

    updateWorkspaceState((currentWorkspace) => {
      if (!currentWorkspace) {
        return currentWorkspace
      }

      return {
        ...currentWorkspace,
        characters: [...currentWorkspace.characters, nextCharacter],
      }
    })

    return nextCharacter
  }

  function updateCharacter(character: CharacterSheet) {
    if (!workspace) {
      return null
    }

    const nextCharacter = {
      ...character,
    }

    updateWorkspaceState((currentWorkspace) => {
      if (!currentWorkspace) {
        return currentWorkspace
      }

      return {
        ...currentWorkspace,
        characters: currentWorkspace.characters.map((currentCharacter) =>
          currentCharacter.id === nextCharacter.id ? nextCharacter : currentCharacter,
        ),
      }
    })

    return nextCharacter
  }

  function deleteCharacter(characterId: string) {
    updateWorkspaceState((currentWorkspace) => {
      if (!currentWorkspace) {
        return currentWorkspace
      }

      return {
        ...currentWorkspace,
        characters: currentWorkspace.characters.filter(
          (character) => character.id !== characterId,
        ),
      }
    })
  }

  function createCampaign(campaign: LocalCampaign) {
    if (!workspace) {
      return null
    }

    const nextCampaign = {
      ...campaign,
    }

    updateWorkspaceState((currentWorkspace) => {
      if (!currentWorkspace) {
        return currentWorkspace
      }

      return {
        ...currentWorkspace,
        campaigns: {
          activeCampaignId: nextCampaign.id,
          items: [nextCampaign, ...currentWorkspace.campaigns.items],
        },
      }
    })

    return nextCampaign
  }

  function mergeImportedCampaign(input: {
    campaign: LocalCampaign
    characters: CharacterSheet[]
    mode: 'new' | 'replace'
  }) {
    updateWorkspaceState((currentWorkspace) => {
      if (!currentWorkspace) {
        return currentWorkspace
      }

      const charactersById = new Map(
        currentWorkspace.characters.map((character) => [character.id, character]),
      )

      input.characters.forEach((character) => {
        charactersById.set(character.id, { ...character })
      })

      const withoutTargetCampaign = currentWorkspace.campaigns.items.filter(
        (campaign) => campaign.id !== input.campaign.id,
      )
      const nextItems =
        input.mode === 'replace'
          ? currentWorkspace.campaigns.items.map((campaign) =>
              campaign.id === input.campaign.id ? input.campaign : campaign,
            )
          : [input.campaign, ...withoutTargetCampaign]

      return {
        ...currentWorkspace,
        characters: Array.from(charactersById.values()),
        campaigns: {
          activeCampaignId: input.campaign.id,
          items: nextItems.some((campaign) => campaign.id === input.campaign.id)
            ? nextItems
            : [input.campaign, ...nextItems],
        },
      }
    })
  }

  function updateCampaign(campaign: LocalCampaign) {
    if (!workspace) {
      return null
    }

    const nextCampaign = {
      ...campaign,
    }

    updateWorkspaceState((currentWorkspace) => {
      if (!currentWorkspace) {
        return currentWorkspace
      }

      return {
        ...currentWorkspace,
        campaigns: {
          ...currentWorkspace.campaigns,
          items: currentWorkspace.campaigns.items.map((currentCampaign) =>
            currentCampaign.id === nextCampaign.id ? nextCampaign : currentCampaign,
          ),
        },
      }
    })

    return nextCampaign
  }

  function deleteCampaign(campaignId: string) {
    updateWorkspaceState((currentWorkspace) => {
      if (!currentWorkspace) {
        return currentWorkspace
      }

      const nextItems = currentWorkspace.campaigns.items.filter(
        (campaign) => campaign.id !== campaignId,
      )
      const nextActiveCampaignId =
        currentWorkspace.campaigns.activeCampaignId === campaignId
          ? (nextItems[0]?.id ?? '')
          : currentWorkspace.campaigns.activeCampaignId

      return {
        ...currentWorkspace,
        campaigns: {
          activeCampaignId: nextActiveCampaignId,
          items: nextItems,
        },
      }
    })
  }

  function setActiveCampaign(campaignId: string) {
    updateWorkspaceState((currentWorkspace) => {
      if (
        !currentWorkspace ||
        !currentWorkspace.campaigns.items.some(
          (campaign) => campaign.id === campaignId,
        )
      ) {
        return currentWorkspace
      }

      return {
        ...currentWorkspace,
        campaigns: {
          ...currentWorkspace.campaigns,
          activeCampaignId: campaignId,
        },
      }
    })
  }

  return (
    <MasterDataContext.Provider
      value={{
        status,
        data,
        error,
        refresh: load,
        createCharacter,
        updateCharacter,
        deleteCharacter,
        createCampaign,
        mergeImportedCampaign,
        updateCampaign,
        deleteCampaign,
        setActiveCampaign,
      }}
    >
      {children}
    </MasterDataContext.Provider>
  )
}
