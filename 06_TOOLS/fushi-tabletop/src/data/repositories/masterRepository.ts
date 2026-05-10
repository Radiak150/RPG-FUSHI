import type { MasterPanelData } from '../types'

export interface MasterRepository {
  getMasterPanelData: () => Promise<MasterPanelData>
}
