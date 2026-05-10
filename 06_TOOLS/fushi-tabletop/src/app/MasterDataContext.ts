import { createContext } from 'react'
import type { CharacterSheet, LocalCampaign, MasterPanelData } from '../data/types'

export type MasterDataStatus = 'loading' | 'ready' | 'error'

export interface MasterDataContextValue {
  status: MasterDataStatus
  data: MasterPanelData | null
  error: string | null
  refresh: () => Promise<void>
  createCharacter: (character: CharacterSheet) => CharacterSheet | null
  updateCharacter: (character: CharacterSheet) => CharacterSheet | null
  deleteCharacter: (characterId: string) => void
  createCampaign: (campaign: LocalCampaign) => LocalCampaign | null
  updateCampaign: (campaign: LocalCampaign) => LocalCampaign | null
  deleteCampaign: (campaignId: string) => void
  setActiveCampaign: (campaignId: string) => void
}

export const MasterDataContext = createContext<MasterDataContextValue | null>(
  null,
)
