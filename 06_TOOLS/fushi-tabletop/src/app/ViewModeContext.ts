import { createContext } from 'react'
import type { AppViewMode } from '../data/types'
import type {
  FushiAccessProfile,
  FushiAccessProfileId,
  FushiAccessState,
} from '../lib/playerAccess'

export interface ViewModeContextValue {
  viewMode: AppViewMode
  supportedViews: AppViewMode[]
  playerCharacterId: string
  accessState: FushiAccessState
  activeAccessProfile: FushiAccessProfile | null
  authenticateAccessProfile: (
    profileId: FushiAccessProfileId,
    password: string,
  ) => boolean | Promise<boolean>
  logoutAccessProfile: () => void
  setViewMode: (viewMode: AppViewMode) => void
  setPlayerCharacterId: (characterId: string) => void
  updateAccessProfile: (
    profileId: FushiAccessProfileId,
    updates: Partial<Pick<FushiAccessProfile, 'characterId' | 'label' | 'password'>>,
  ) => void
  resetViewMode: () => void
}

export const ViewModeContext = createContext<ViewModeContextValue | null>(null)
