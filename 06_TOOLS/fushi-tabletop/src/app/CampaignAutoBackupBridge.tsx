import { useEffect, useRef } from 'react'
import { useMasterData } from '../hooks/useMasterData'
import {
  CAMPAIGN_AUTOBACKUP_INTERVAL_MS,
  saveCampaignBackupSnapshot,
} from '../lib/campaignBackups'

export function CampaignAutoBackupBridge() {
  const { data, status } = useMasterData()
  const latestCampaignIdRef = useRef('')

  useEffect(() => {
    if (status !== 'ready' || !data) {
      return
    }

    const activeCampaign =
      data.campaigns.items.find(
        (campaign) => campaign.id === data.campaigns.activeCampaignId,
      ) ??
      data.campaigns.items[0] ??
      null

    latestCampaignIdRef.current = activeCampaign?.id ?? ''

    if (!activeCampaign) {
      return
    }

    const runBackup = () => {
      const currentCampaign =
        data.campaigns.items.find(
          (campaign) => campaign.id === latestCampaignIdRef.current,
        ) ?? activeCampaign

      saveCampaignBackupSnapshot(currentCampaign, 'auto')
    }

    const timeoutId = window.setTimeout(runBackup, 1000)
    const intervalId = window.setInterval(runBackup, CAMPAIGN_AUTOBACKUP_INTERVAL_MS)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [data, status])

  return null
}
