import {
  type PropsWithChildren,
  startTransition,
  useEffect,
  useMemo,
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
import { MasterDataContext, type MasterDataStatus } from './MasterDataContext'

export function MasterDataProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<MasterDataStatus>('loading')
  const [baseData, setBaseData] = useState<MasterPanelData | null>(null)
  const [workspace, setWorkspace] = useState<ReturnType<
    typeof readMasterWorkspace
  > | null>(null)
  const [error, setError] = useState<string | null>(null)

  const data = useMemo(() => {
    if (!baseData || !workspace) {
      return null
    }

    return mergeMasterPanelData(baseData, workspace)
  }, [baseData, workspace])

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

  useEffect(() => {
    if (!workspace) {
      return
    }

    writeMasterWorkspace(workspace)
  }, [workspace])

  function createCharacter(character: CharacterSheet) {
    if (!workspace) {
      return null
    }

    const nextCharacter = {
      ...character,
    }

    setWorkspace((currentWorkspace) => {
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

    setWorkspace((currentWorkspace) => {
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
    setWorkspace((currentWorkspace) => {
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

    setWorkspace((currentWorkspace) => {
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

  function updateCampaign(campaign: LocalCampaign) {
    if (!workspace) {
      return null
    }

    const nextCampaign = {
      ...campaign,
    }

    setWorkspace((currentWorkspace) => {
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
    setWorkspace((currentWorkspace) => {
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
    setWorkspace((currentWorkspace) => {
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
        updateCampaign,
        deleteCampaign,
        setActiveCampaign,
      }}
    >
      {children}
    </MasterDataContext.Provider>
  )
}
