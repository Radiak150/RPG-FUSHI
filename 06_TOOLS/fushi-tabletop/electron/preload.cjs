const { contextBridge, ipcRenderer } = require('electron')

function sendSync(channel, payload) {
  return ipcRenderer.sendSync(channel, payload)
}

contextBridge.exposeInMainWorld('fushiDesktop', {
  getAppInfo() {
    return sendSync('fushi-desktop:get-app-info')
  },
  getStorageStatus(campaignId) {
    return sendSync('fushi-desktop:get-storage-status', campaignId)
  },
  getMultiplayerHostStatus() {
    return sendSync('fushi-desktop:multiplayer-status')
  },
  loadBackups(campaignId) {
    return sendSync('fushi-desktop:load-backups', campaignId)
  },
  loadJson(request) {
    return sendSync('fushi-desktop:load-json', request)
  },
  openDataFolder() {
    return sendSync('fushi-desktop:open-data-folder')
  },
  openInstallFolder() {
    return sendSync('fushi-desktop:open-install-folder')
  },
  openExternalUrl(url) {
    return ipcRenderer.invoke('fushi-desktop:open-external-url', url)
  },
  openUninstallSettings() {
    return ipcRenderer.invoke('fushi-desktop:open-uninstall-settings')
  },
  getUpdateStatus() {
    return ipcRenderer.invoke('fushi-desktop:update-get-status')
  },
  setUpdateFeedUrl(feedUrl) {
    return ipcRenderer.invoke('fushi-desktop:update-set-feed-url', feedUrl)
  },
  checkForUpdates() {
    return ipcRenderer.invoke('fushi-desktop:update-check')
  },
  downloadUpdate() {
    return ipcRenderer.invoke('fushi-desktop:update-download')
  },
  installUpdate() {
    return ipcRenderer.invoke('fushi-desktop:update-install')
  },
  checkCampaignPackage(request) {
    return ipcRenderer.invoke('fushi-desktop:campaign-package-check', request)
  },
  downloadCampaignPackage(request) {
    return ipcRenderer.invoke('fushi-desktop:campaign-package-download', request)
  },
  getAiConfig() {
    return ipcRenderer.invoke('fushi-desktop:ai-get-config')
  },
  saveAiConfig(config) {
    return ipcRenderer.invoke('fushi-desktop:ai-save-config', config)
  },
  testOllama(config) {
    return ipcRenderer.invoke('fushi-desktop:ai-test-ollama', config)
  },
  runOllamaChat(request) {
    return ipcRenderer.invoke('fushi-desktop:ai-run-ollama-chat', request)
  },
  assetExists(url) {
    return sendSync('fushi-desktop:asset-exists', url)
  },
  saveBackups(campaignId, data) {
    return sendSync('fushi-desktop:save-backups', { campaignId, data })
  },
  saveAsset(campaignId, asset) {
    return sendSync('fushi-desktop:save-asset', { asset, campaignId })
  },
  extractAudioFromMedia(campaignId, asset) {
    return ipcRenderer.invoke('fushi-desktop:extract-audio-from-media', { asset, campaignId })
  },
  saveJson(request) {
    return sendSync('fushi-desktop:save-json', request)
  },
  startMultiplayerHost(request) {
    return ipcRenderer.invoke('fushi-desktop:multiplayer-start-host', request)
  },
  controlMultiplayerPlayerAdmission(request) {
    return ipcRenderer.invoke('fushi-desktop:multiplayer-player-admission', request)
  },
  stopMultiplayerHost() {
    return ipcRenderer.invoke('fushi-desktop:multiplayer-stop-host')
  },
  onStorageChanged(callback) {
    const listener = (_event, payload) => {
      callback(payload)
    }

    ipcRenderer.on('fushi-desktop:storage-changed', listener)

    return () => {
      ipcRenderer.removeListener('fushi-desktop:storage-changed', listener)
    }
  },
  onUpdateStatusChanged(callback) {
    const listener = (_event, payload) => {
      callback(payload)
    }

    ipcRenderer.on('fushi-desktop:update-status-changed', listener)

    return () => {
      ipcRenderer.removeListener('fushi-desktop:update-status-changed', listener)
    }
  },
  onCampaignPackageStatusChanged(callback) {
    const listener = (_event, payload) => {
      callback(payload)
    }

    ipcRenderer.on('fushi-desktop:campaign-package-status-changed', listener)

    return () => {
      ipcRenderer.removeListener('fushi-desktop:campaign-package-status-changed', listener)
    }
  },
})
