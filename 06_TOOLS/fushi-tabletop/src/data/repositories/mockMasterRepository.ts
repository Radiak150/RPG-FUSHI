import { campaignData } from '../mock/campaign'
import { campaignsData } from '../mock/campaigns'
import { charactersData } from '../mock/characters'
import { dashboardData } from '../mock/dashboard'
import { factionsData } from '../mock/factions'
import { systemData } from '../mock/system'
import { tabletopData } from '../mock/tabletop'
import { worldData } from '../mock/world'
import type { MasterRepository } from './masterRepository'

export const mockMasterRepository: MasterRepository = {
  async getMasterPanelData() {
    await new Promise((resolve) => {
      window.setTimeout(resolve, 120)
    })

    return {
      meta: {
        sourceLabel: 'mock-local',
        supportedViews: ['gm', 'player'],
      },
      dashboard: dashboardData,
      world: worldData,
      tabletop: tabletopData,
      factions: factionsData,
      campaigns: campaignsData,
      campaign: campaignData,
      characters: charactersData,
      system: systemData,
    }
  },
}
