import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import launcherBackground from '../assets/launcher-bg.jpg'
import { useMasterData } from '../hooks/useMasterData'
import {
  buildImportedCampaignMetadata,
  createCampaignExportFile,
  createCampaignExportFilename,
  downloadJsonFile,
  getCampaignExportCharacters,
  saveImportedCampaignStorage,
  validateCampaignExportFile,
} from '../lib/campaignTransfer'
import {
  embedCampaignAssets,
  materializeCampaignAssetsForImport,
} from '../lib/campaignAssetTransfer'
import { readJsonFile } from '../lib/localBackup'
import { forceSaveCampaignStorage } from '../lib/storage/storageAdapter'
import type {
  FushiCampaignPackageStatus,
  FushiUpdateStatus,
} from '../types/fushiDesktop'

type LauncherSettingsTab = 'preferences' | 'download' | 'about'
type LauncherTopbarIcon = 'config' | 'discord' | 'folder' | 'repair'

const launcherSettingsTabLabels: Record<LauncherSettingsTab, string> = {
  preferences: 'Preferencias',
  download: 'Download',
  about: 'Sobre',
}
const launcherSettingsTabs: LauncherSettingsTab[] = ['preferences', 'download', 'about']
const CAMPAIGN_PACKAGE_FILE_LOG_LIMIT = 28

function getEditableUpdateFeedUrl(status: FushiUpdateStatus | null) {
  const feedUrl = status?.feedUrl ?? ''

  if (!/^https?:\/\//i.test(feedUrl) || /updates\.example\.invalid/i.test(feedUrl)) {
    return ''
  }

  return feedUrl
}

function getUpdateActionLabel(status: FushiUpdateStatus | null, isBusy: boolean) {
  if (isBusy) {
    return 'Atualizando'
  }

  switch (status?.state) {
    case 'available':
      return 'Baixar'
    case 'downloaded':
      return 'Instalar'
    case 'downloading':
      return 'Baixando'
    case 'checking':
      return 'Checando'
    case 'not-available':
      return 'Checar'
    case 'error':
      return 'Tentar'
    default:
      return 'Atualizar'
  }
}

function getUpdateBadgeLabel(status: FushiUpdateStatus | null) {
  switch (status?.state) {
    case 'available':
      return `Update ${status.availableVersion ?? ''}`.trim()
    case 'downloaded':
      return 'Pronto para instalar'
    case 'downloading':
      return 'Baixando update'
    case 'checking':
      return 'Checando update'
    case 'not-available':
      return 'Atualizado'
    case 'disabled':
      return 'Canal offline'
    case 'error':
      return 'Atencao'
    default:
      return 'Launcher'
  }
}

function formatPackageBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 MB'
  }

  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function appendPackageFileLog(currentFiles: string[], nextFile: string) {
  const normalizedFile = nextFile.trim()

  if (!normalizedFile || currentFiles[currentFiles.length - 1] === normalizedFile) {
    return currentFiles
  }

  return [...currentFiles, normalizedFile].slice(-CAMPAIGN_PACKAGE_FILE_LOG_LIMIT)
}

function LauncherIcon({ name }: { name: LauncherTopbarIcon }) {
  if (name === 'discord') {
    return (
      <svg aria-hidden="true" className="launcher-topbar__icon" viewBox="0 0 24 24">
        <path d="M7.2 7.3c1.4-.7 2.8-1 4.8-1s3.4.3 4.8 1c1.1 1.7 1.6 3.6 1.5 5.6-1.3 1.1-2.6 1.6-4.1 1.8l-.6-1.1c.7-.2 1.3-.5 1.8-.9-1.1.5-2.3.7-3.4.7s-2.3-.2-3.4-.7c.5.4 1.1.7 1.8.9l-.6 1.1c-1.5-.2-2.8-.7-4.1-1.8-.1-2 .4-3.9 1.5-5.6Z" />
        <circle cx="9.7" cy="10.8" r="1.1" />
        <circle cx="14.3" cy="10.8" r="1.1" />
      </svg>
    )
  }

  if (name === 'folder') {
    return (
      <svg aria-hidden="true" className="launcher-topbar__icon" viewBox="0 0 24 24">
        <path d="M3.5 7.2h6l1.7 2h9.3v8.6c0 .8-.5 1.3-1.3 1.3H4.8c-.8 0-1.3-.5-1.3-1.3V7.2Z" />
        <path d="M3.5 9.2V6.8c0-.8.5-1.3 1.3-1.3h4.1l1.7 1.7" />
      </svg>
    )
  }

  if (name === 'config') {
    return (
      <svg aria-hidden="true" className="launcher-topbar__icon" viewBox="0 0 24 24">
        <path d="M12 8.3a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4Z" />
        <path d="m12 3.8 1.1 2.1 2.4.5 1.7-1.4 1.8 1.8-1.4 1.7.5 2.4 2.1 1.1-1 2.4-2.4-.2-1.8 1.8.2 2.4-2.4 1-1.1-2.1-2.4-.5-1.7 1.4-1.8-1.8 1.4-1.7-.5-2.4-2.1-1.1 1-2.4 2.4.2 1.8-1.8-.2-2.4Z" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="launcher-topbar__icon" viewBox="0 0 24 24">
      <path d="m13.3 5.3 2.2 2.2-8.9 8.9-2.8.6.6-2.8 8.9-8.9Z" />
      <path d="m14.8 4.1 1.2-1.2 2.8 2.8-1.2 1.2" />
      <path d="m10.2 14.5 3.3 3.3c1 1 2.7 1 3.7 0l.8-.8" />
    </svg>
  )
}

export function LauncherPage() {
  const navigate = useNavigate()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const desktopInfo = window.fushiDesktop?.getAppInfo()
  const {
    data,
    mergeImportedCampaign,
    refresh,
    setActiveCampaign,
    status: masterDataStatus,
  } = useMasterData()
  const activeCampaign =
    data?.campaigns.items.find(
      (campaign) => campaign.id === data.campaigns.activeCampaignId,
    ) ??
    data?.campaigns.items[0] ??
    null
  const campaignCount = data?.campaigns.items.length ?? 0
  const characterCount = data?.characters.items.length ?? 0
  const [updateStatus, setUpdateStatus] = useState<FushiUpdateStatus | null>(null)
  const [updateFeedDraft, setUpdateFeedDraft] = useState('')
  const [isUpdateFeedDirty, setIsUpdateFeedDirty] = useState(false)
  const [isUpdateFeedSaving, setIsUpdateFeedSaving] = useState(false)
  const [isUpdateBusy, setIsUpdateBusy] = useState(false)
  const [campaignPackageCode, setCampaignPackageCode] = useState('')
  const [isCampaignPackageCodeDirty, setIsCampaignPackageCodeDirty] = useState(false)
  const [campaignPackageStatus, setCampaignPackageStatus] =
    useState<FushiCampaignPackageStatus | null>(null)
  const [campaignPackageFileLog, setCampaignPackageFileLog] = useState<string[]>([])
  const [isCampaignPackageDetailsOpen, setIsCampaignPackageDetailsOpen] =
    useState(false)
  const [isCampaignPackageBusy, setIsCampaignPackageBusy] = useState(false)
  const [isTransferBusy, setIsTransferBusy] = useState(false)
  const [isRepairBusy, setIsRepairBusy] = useState(false)
  const [isRepairConfirmOpen, setIsRepairConfirmOpen] = useState(false)
  const [isLauncherSettingsOpen, setIsLauncherSettingsOpen] = useState(false)
  const [launcherSettingsTab, setLauncherSettingsTab] =
    useState<LauncherSettingsTab>('preferences')
  const [launcherSettingsStatus, setLauncherSettingsStatus] = useState('')
  const [launcherStatus, setLauncherStatus] = useState('Pronto para entrar.')
  const resolvedCampaignPackageCode = isCampaignPackageCodeDirty
    ? campaignPackageCode
    : activeCampaign?.codigo ?? ''
  const updateActionLabel = getUpdateActionLabel(updateStatus, isUpdateBusy)
  const updateBadgeLabel = getUpdateBadgeLabel(updateStatus)
  const updateProgress = useMemo(() => {
    if (
      updateStatus?.state !== 'downloading' ||
      typeof updateStatus.percent !== 'number'
    ) {
      return 0
    }

    return Math.max(0, Math.min(100, updateStatus.percent))
  }, [updateStatus])
  const campaignPackageProgress = useMemo(() => {
    if (campaignPackageStatus?.ok && campaignPackageStatus.state === 'downloaded') {
      return 100
    }

    if (typeof campaignPackageStatus?.percent !== 'number') {
      return 0
    }

    return Math.max(0, Math.min(100, campaignPackageStatus.percent))
  }, [campaignPackageStatus])
  const campaignPackageSummary = useMemo(() => {
    if (!campaignPackageStatus) {
      return 'Nenhum pacote verificado.'
    }

    if (!campaignPackageStatus.ok) {
      return campaignPackageStatus.error ?? campaignPackageStatus.message
    }

    if (campaignPackageStatus.state === 'checking') {
      return 'Verificando pacote da campanha...'
    }

    if (campaignPackageStatus.state === 'downloading') {
      return `${campaignPackageStatus.downloadedFiles}/${campaignPackageStatus.totalFiles} arquivo(s) baixados.`
    }

    if (campaignPackageStatus.state === 'downloaded') {
      return 'Voce ja baixou o pacote inteiro!'
    }

    return `${campaignPackageStatus.missingFiles + campaignPackageStatus.changedFiles} pendente(s), ${formatPackageBytes(
      campaignPackageStatus.bytesToDownload,
    )}.`
  }, [campaignPackageStatus])
  const campaignPackageDetail = useMemo(() => {
    if (!campaignPackageStatus) {
      return 'Verifique o codigo antes de baixar.'
    }

    if (!campaignPackageStatus.ok) {
      return campaignPackageStatus.error ?? campaignPackageStatus.message
    }

    if (campaignPackageStatus.state === 'downloaded') {
      return `${campaignPackageStatus.totalFiles} arquivo(s), ${formatPackageBytes(
        campaignPackageStatus.totalBytes,
      )} local.`
    }

    if (campaignPackageStatus.state === 'downloading') {
      return `${formatPackageBytes(campaignPackageStatus.downloadedBytes)} de ${formatPackageBytes(
        campaignPackageStatus.bytesToDownload,
      )} nesta rodada.`
    }

    if (campaignPackageStatus.state === 'ready') {
      return `${campaignPackageStatus.missingFiles} faltante(s), ${campaignPackageStatus.changedFiles} alterado(s).`
    }

    return campaignPackageStatus.message
  }, [campaignPackageStatus])
  const campaignPackageIsReady =
    campaignPackageStatus?.ok === true && campaignPackageStatus.state === 'downloaded'
  const campaignPackageDetailFiles =
    campaignPackageFileLog.length > 0
      ? campaignPackageFileLog
      : campaignPackageStatus?.currentFile
        ? [campaignPackageStatus.currentFile]
        : []
  const isUpdateActionDisabled =
    !window.fushiDesktop ||
    isUpdateBusy ||
    updateStatus?.state === 'checking' ||
    updateStatus?.state === 'downloading' ||
    updateStatus?.state === 'installing'
  const isCampaignPackageActionDisabled =
    !window.fushiDesktop ||
    isCampaignPackageBusy ||
    !resolvedCampaignPackageCode.trim() ||
    !(updateFeedDraft.trim() || updateStatus?.feedUrl)

  useEffect(() => {
    const desktopApi = window.fushiDesktop

    if (!desktopApi) {
      return
    }

    let isMounted = true

    void desktopApi.getUpdateStatus().then((status) => {
      if (!isMounted) {
        return
      }

      setUpdateStatus(status)
      setUpdateFeedDraft((currentDraft) =>
        isUpdateFeedDirty ? currentDraft : getEditableUpdateFeedUrl(status),
      )
    })

    const unsubscribe = desktopApi.onUpdateStatusChanged((status) => {
      setUpdateStatus(status)
      setUpdateFeedDraft((currentDraft) =>
        isUpdateFeedDirty ? currentDraft : getEditableUpdateFeedUrl(status),
      )
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [isUpdateFeedDirty])

  useEffect(() => {
    const desktopApi = window.fushiDesktop

    if (!desktopApi?.onCampaignPackageStatusChanged) {
      return
    }

    return desktopApi.onCampaignPackageStatusChanged((status) => {
      setCampaignPackageStatus(status)
      if (status.currentFile) {
        setCampaignPackageFileLog((currentFiles) =>
          appendPackageFileLog(currentFiles, status.currentFile ?? ''),
        )
      }
      setLauncherStatus(status.ok ? status.message : status.error ?? status.message)
    })
  }, [])

  async function handleUpdateAction() {
    const desktopApi = window.fushiDesktop

    if (!desktopApi || isUpdateActionDisabled) {
      return
    }

    setIsUpdateBusy(true)

    try {
      if (updateStatus?.state === 'downloaded') {
        setUpdateStatus(await desktopApi.installUpdate())
      } else if (updateStatus?.state === 'available') {
        setUpdateStatus(await desktopApi.downloadUpdate())
      } else {
        setUpdateStatus(await desktopApi.checkForUpdates())
      }
    } finally {
      setIsUpdateBusy(false)
    }
  }

  async function handleSaveUpdateFeedUrl() {
    const desktopApi = window.fushiDesktop

    if (!desktopApi || isUpdateFeedSaving) {
      return
    }

    setIsUpdateFeedSaving(true)

    try {
      const status = await desktopApi.setUpdateFeedUrl(updateFeedDraft)
      setUpdateStatus(status)
      setUpdateFeedDraft(getEditableUpdateFeedUrl(status))
      setIsUpdateFeedDirty(false)
      setLauncherStatus(status.feedUrl ? 'Canal de update salvo.' : 'Canal de update limpo.')
    } finally {
      setIsUpdateFeedSaving(false)
    }
  }

  function getCampaignPackageRequest() {
    const feedUrl = updateFeedDraft.trim() || updateStatus?.feedUrl || ''
    const code = resolvedCampaignPackageCode.trim().toUpperCase()

    if (!feedUrl) {
      setLauncherStatus('Salve ou informe o canal de updates antes do pacote.')
      return null
    }

    if (!code) {
      setLauncherStatus('Informe o codigo da campanha para baixar o pacote.')
      return null
    }

    return { code, feedUrl }
  }

  async function handleCheckCampaignPackage() {
    const desktopApi = window.fushiDesktop
    const request = getCampaignPackageRequest()

    if (!desktopApi || !request || isCampaignPackageBusy) {
      return
    }

    setIsCampaignPackageBusy(true)
    setLauncherStatus('Verificando pacote da campanha...')
    setCampaignPackageFileLog([])

    try {
      const status = await desktopApi.checkCampaignPackage(request)
      setCampaignPackageStatus(status)
      setLauncherStatus(
        status.ok && status.state === 'downloaded'
          ? 'Voce ja baixou o pacote inteiro!'
          : status.ok
            ? status.message
            : status.error ?? status.message,
      )
    } finally {
      setIsCampaignPackageBusy(false)
    }
  }

  async function handleDownloadCampaignPackage() {
    const desktopApi = window.fushiDesktop
    const request = getCampaignPackageRequest()

    if (!desktopApi || !request || isCampaignPackageBusy) {
      return
    }

    setIsCampaignPackageBusy(true)
    setLauncherStatus('Baixando pacote da campanha...')
    setCampaignPackageFileLog([])

    try {
      const status = await desktopApi.downloadCampaignPackage(request)
      setCampaignPackageStatus(status)
      setLauncherStatus(
        status.ok && status.state === 'downloaded'
          ? 'Pronto para Jogar!'
          : status.ok
            ? status.message
            : status.error ?? status.message,
      )
    } finally {
      setIsCampaignPackageBusy(false)
    }
  }

  async function handleExportCampaign() {
    if (!activeCampaign || isTransferBusy) {
      setLauncherStatus('Nenhuma campanha ativa para exportar.')
      return
    }

    setIsTransferBusy(true)
    setLauncherStatus('Preparando campanha e assets para exportar...')

    try {
      const exportFile = await embedCampaignAssets(createCampaignExportFile(activeCampaign))

      downloadJsonFile(exportFile, createCampaignExportFilename(activeCampaign))
      setLauncherStatus(
        `Campanha "${activeCampaign.nome}" exportada com ${exportFile.assets?.length ?? 0} asset(s).`,
      )
    } catch (error) {
      setLauncherStatus(
        error instanceof Error ? error.message : 'Nao foi possivel exportar a campanha.',
      )
    } finally {
      setIsTransferBusy(false)
    }
  }

  async function handleImportCampaign(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file || isTransferBusy) {
      return
    }

    setIsTransferBusy(true)
    setLauncherStatus('Validando campanha...')

    try {
      const parsedValue = await readJsonFile(file)
      const validation = validateCampaignExportFile(parsedValue)

      if (!validation.ok || !validation.file) {
        setLauncherStatus(validation.error ?? 'Arquivo de campanha invalido.')
        return
      }

      const targetCampaignBase = buildImportedCampaignMetadata(validation.file, 'new')
      const preparedImport = await materializeCampaignAssetsForImport(
        validation.file,
        targetCampaignBase.id,
      )
      const importFile = preparedImport.file
      const targetCampaign = {
        ...targetCampaignBase,
        coverImageUrl: importFile.campaign.coverImageUrl,
        resumo: importFile.campaign.resumo,
        sessaoAtual: importFile.campaign.sessaoAtual,
        status: importFile.campaign.status,
        tone: importFile.campaign.tone,
      }

      saveImportedCampaignStorage(importFile, targetCampaign.id)
      mergeImportedCampaign({
        campaign: targetCampaign,
        characters: getCampaignExportCharacters(importFile),
        mode: 'new',
      })
      setActiveCampaign(targetCampaign.id)
      await refresh()

      setLauncherStatus(
        preparedImport.failedAssets.length > 0
          ? `Campanha importada, mas ${preparedImport.failedAssets.length} asset(s) ficaram pendentes.`
          : `Campanha "${targetCampaign.nome}" importada e selecionada.`,
      )
    } catch (error) {
      setLauncherStatus(
        error instanceof Error ? error.message : 'Nao foi possivel importar a campanha.',
      )
    } finally {
      setIsTransferBusy(false)

      if (importInputRef.current) {
        importInputRef.current.value = ''
      }
    }
  }

  async function handleRepair() {
    if (isRepairBusy) {
      return
    }

    setIsRepairConfirmOpen(false)
    setIsRepairBusy(true)
    setLauncherStatus('Revisando dados locais e canal de updates...')

    try {
      forceSaveCampaignStorage(activeCampaign?.id)
      await refresh()

      const storageStatus = window.fushiDesktop?.getStorageStatus(activeCampaign?.id)
      const nextUpdateStatus = window.fushiDesktop
        ? await window.fushiDesktop.checkForUpdates()
        : updateStatus

      if (nextUpdateStatus) {
        setUpdateStatus(nextUpdateStatus)
      }

      const savedBlocks =
        storageStatus?.campaignBlocks.filter((block) => block.exists).length ?? 0

      setLauncherStatus(
        `Reparo concluido. ${savedBlocks} bloco(s) de campanha conferido(s).`,
      )
    } catch (error) {
      setLauncherStatus(
        error instanceof Error ? error.message : 'Nao foi possivel reparar os dados locais.',
      )
    } finally {
      setIsRepairBusy(false)
    }
  }

  async function handleOpenDiscord() {
    const discordUrl = 'https://discord.gg/5B2x9zRry2'

    if (window.fushiDesktop) {
      const opened = await window.fushiDesktop.openExternalUrl(discordUrl)
      setLauncherStatus(opened ? 'Discord aberto no navegador.' : 'Nao foi possivel abrir o Discord.')
      return
    }

    window.open(discordUrl, '_blank', 'noopener,noreferrer')
  }

  function openLauncherSettings(tab: LauncherSettingsTab) {
    setLauncherSettingsTab(tab)
    setLauncherSettingsStatus('')
    setIsLauncherSettingsOpen(true)
  }

  function handleOpenInstallFolder() {
    const opened = window.fushiDesktop?.openInstallFolder()
    setLauncherSettingsStatus(
      opened
        ? 'Pasta de instalacao solicitada ao Windows.'
        : 'Nao foi possivel abrir a pasta de instalacao.',
    )
  }

  function handleOpenDataFolder() {
    const opened = window.fushiDesktop?.openDataFolder()
    setLauncherSettingsStatus(
      opened
        ? 'Pasta da biblioteca local solicitada ao Windows.'
        : 'Nao foi possivel abrir a biblioteca local.',
    )
  }

  async function handleOpenUninstallSettings() {
    const opened = await window.fushiDesktop?.openUninstallSettings()
    setLauncherSettingsStatus(
      opened
        ? 'Tela de aplicativos do Windows aberta. Procure FUSHI Tabletop para desinstalar.'
        : 'Nao foi possivel abrir a tela de aplicativos do Windows.',
    )
  }

  return (
    <main
      className="launcher-screen"
      style={{ '--launcher-hero-image': `url(${launcherBackground})` } as CSSProperties}
    >
      <div className="launcher-screen__shade" />
      <header className="launcher-topbar">
        <button
          className="launcher-brand"
          onClick={() => navigate('/jogar')}
          type="button"
        >
          <span className="launcher-brand__mark">F</span>
          <span>
            <strong>FUSHI</strong>
            <small>Tabletop Launcher</small>
          </span>
        </button>

        <div className="launcher-topbar__actions">
          <button
          className="launcher-topbar__button"
          onClick={() => setIsRepairConfirmOpen(true)}
          type="button"
        >
          <LauncherIcon name="repair" />
          <span>Reparar</span>
        </button>
        <button
          className="launcher-topbar__button"
          onClick={() => void handleOpenDiscord()}
          type="button"
        >
          <LauncherIcon name="discord" />
          <span>Discord</span>
        </button>
        <button
          className="launcher-topbar__button"
          onClick={() => openLauncherSettings('download')}
          type="button"
        >
          <LauncherIcon name="folder" />
          <span>Pasta</span>
        </button>
        <button className="launcher-topbar__button" onClick={() => navigate('/configuracoes')} type="button">
          <LauncherIcon name="config" />
          <span>Config</span>
        </button>
          <span className="launcher-version">v{desktopInfo?.version ?? 'web'}</span>
        </div>
      </header>

      <section className="launcher-hero">
        <div className="launcher-hero__copy">
          <p className="launcher-kicker">Sessao pronta</p>
          <h1>FUSHI Tabletop</h1>
          <p>
            Launcher externo para atualizar o app, reparar dados locais e preparar a
            campanha antes de abrir a mesa.
          </p>
        </div>
      </section>

      <section className="launcher-notices" aria-label="Noticias do launcher">
        <div className="launcher-notices__media" />
        <div className="launcher-notices__tabs">
          <span className="launcher-notices__tab launcher-notices__tab--active">Notas</span>
          <span className="launcher-notices__tab">Sistema</span>
        </div>
        <article>
          <time>Agora</time>
          <strong>Launcher separado do jogo</strong>
        </article>
        <article>
          <time>Multiplayer</time>
          <strong>Entrada espera estado real da mesa</strong>
        </article>
      </section>

      <aside className="launcher-panel">
        <div className="launcher-panel__status">
          <span>{updateBadgeLabel}</span>
          <strong>{updateStatus?.message ?? 'Canal de update do app desktop.'}</strong>
        </div>

        <div className="launcher-progress" aria-label="Progresso do update">
          <span style={{ width: `${updateProgress}%` }} />
        </div>

        <div className="launcher-tools">
          <button
            disabled={isUpdateActionDisabled}
            onClick={() => void handleUpdateAction()}
            type="button"
          >
            {updateActionLabel}
          </button>
          <button
            disabled={isRepairBusy}
            onClick={() => setIsRepairConfirmOpen(true)}
            type="button"
          >
            {isRepairBusy ? 'Reparando' : 'Reparar'}
          </button>
          <button
            disabled={isTransferBusy}
            onClick={() => importInputRef.current?.click()}
            type="button"
          >
            Importar
          </button>
          <button
            disabled={isTransferBusy || !activeCampaign}
            onClick={() => void handleExportCampaign()}
            type="button"
          >
            Exportar
          </button>
        </div>

        <label className="launcher-feed">
          <span>Canal de updates</span>
          <div>
            <input
              onChange={(event) => {
                setUpdateFeedDraft(event.target.value)
                setIsUpdateFeedDirty(true)
              }}
              placeholder="https://seu-tunnel-ou-servidor"
              spellCheck={false}
              type="url"
              value={updateFeedDraft}
            />
            <button
              disabled={isUpdateFeedSaving}
              onClick={() => void handleSaveUpdateFeedUrl()}
              type="button"
            >
              Salvar
            </button>
          </div>
        </label>

        <section className="launcher-feed launcher-package" aria-label="Pacote da campanha">
          <span>Pacote da campanha</span>
          <div className="launcher-package__row">
            <input
              onChange={(event) => {
                setCampaignPackageCode(event.target.value.toUpperCase())
                setIsCampaignPackageCodeDirty(true)
              }}
              placeholder={activeCampaign?.codigo ?? 'FUSHI-KZT3KA'}
              spellCheck={false}
              value={resolvedCampaignPackageCode}
            />
            <button
              disabled={isCampaignPackageActionDisabled}
              onClick={() => void handleCheckCampaignPackage()}
              type="button"
            >
              Verificar
            </button>
            <button
              disabled={isCampaignPackageActionDisabled}
              onClick={() => void handleDownloadCampaignPackage()}
              type="button"
            >
              Baixar pacote
            </button>
          </div>
          <div
            className={`launcher-progress launcher-package__progress${
              campaignPackageIsReady ? ' launcher-package__progress--ready' : ''
            }`}
          >
            <span style={{ width: `${campaignPackageProgress}%` }} />
          </div>
          <div
            className={`launcher-package__result${
              campaignPackageIsReady ? ' launcher-package__result--ready' : ''
            }`}
          >
            <strong>
              {campaignPackageIsReady ? 'Pronto para Jogar!' : campaignPackageSummary}
            </strong>
            <small>{campaignPackageDetail}</small>
          </div>
          {campaignPackageDetailFiles.length > 0 ? (
            <button
              aria-expanded={isCampaignPackageDetailsOpen}
              className="launcher-package__details-toggle"
              onClick={() => setIsCampaignPackageDetailsOpen((current) => !current)}
              type="button"
            >
              <span className="launcher-package__chevron" aria-hidden="true">
                &gt;
              </span>
              Mais
            </button>
          ) : null}
          {isCampaignPackageDetailsOpen && campaignPackageDetailFiles.length > 0 ? (
            <div className="launcher-package__details">
              {campaignPackageDetailFiles.map((file, index) => (
                <code key={`${file}-${index}`}>{file}</code>
              ))}
            </div>
          ) : null}
        </section>

        <div className="launcher-campaign">
          <span>Campanha ativa</span>
          <strong>{activeCampaign?.nome ?? 'Nenhuma campanha selecionada'}</strong>
          <small>
            {masterDataStatus === 'loading'
              ? 'Carregando dados locais...'
              : `${campaignCount} campanha(s), ${characterCount} personagem(ns).`}
          </small>
        </div>

        <div className="launcher-start-row">
          <button
            className="launcher-menu-button"
            onClick={() => navigate('/multiplayer')}
            type="button"
          >
            Multiplayer
          </button>
          <button
            className="launcher-start-button"
            onClick={() => navigate('/jogar')}
            type="button"
          >
            Iniciar
          </button>
        </div>

        <p className="launcher-status-line">{launcherStatus}</p>
      </aside>

      <input
        accept="application/json,.json"
        hidden
        onChange={(event) => void handleImportCampaign(event)}
        ref={importInputRef}
        type="file"
      />

      {isLauncherSettingsOpen ? (
        <div className="launcher-modal-backdrop" role="presentation">
          <section
            aria-label="Configuracoes do launcher"
            aria-modal="true"
            className="launcher-settings-modal"
            role="dialog"
          >
            <aside className="launcher-settings-modal__nav">
              <button
                className="launcher-brand launcher-brand--settings"
                onClick={() => setLauncherSettingsTab('preferences')}
                type="button"
              >
                <span className="launcher-brand__mark">F</span>
                <span>
                  <strong>FUSHI</strong>
                  <small>Launcher</small>
                </span>
              </button>
              {launcherSettingsTabs.map((tab) => (
                <button
                  className={`launcher-settings-modal__tab${
                    launcherSettingsTab === tab
                      ? ' launcher-settings-modal__tab--active'
                      : ''
                  }`}
                  key={tab}
                  onClick={() => {
                    setLauncherSettingsTab(tab)
                    setLauncherSettingsStatus('')
                  }}
                  type="button"
                >
                  {launcherSettingsTabLabels[tab]}
                </button>
              ))}
            </aside>

            <div className="launcher-settings-modal__content">
              <button
                aria-label="Fechar configuracoes"
                className="launcher-settings-modal__close"
                onClick={() => setIsLauncherSettingsOpen(false)}
                type="button"
              >
                X
              </button>

              {launcherSettingsTab === 'preferences' ? (
                <div className="launcher-settings-modal__panel">
                  <p className="launcher-kicker">Preferencias</p>
                  <h2>Preferencias</h2>
                  <label className="launcher-settings-field">
                    <span>Idioma do launcher</span>
                    <select value="pt-BR" disabled>
                      <option value="pt-BR">Portugues do Brasil</option>
                    </select>
                  </label>
                  <div className="launcher-settings-radio-group">
                    <span>Ao fechar o launcher</span>
                    <label>
                      <input checked readOnly type="radio" />
                      <span>Fechar o launcher</span>
                    </label>
                    <label>
                      <input disabled type="radio" />
                      <span>Minimizar para bandeja</span>
                    </label>
                  </div>
                </div>
              ) : null}

              {launcherSettingsTab === 'download' ? (
                <div className="launcher-settings-modal__panel">
                  <p className="launcher-kicker">Download</p>
                  <h2>Diretorios</h2>
                  <div className="launcher-settings-paths">
                    <article>
                      <span>App instalado</span>
                      <strong>{desktopInfo?.installDir ?? 'Disponivel somente no app desktop.'}</strong>
                    </article>
                    <article>
                      <span>Executavel</span>
                      <strong>{desktopInfo?.exePath ?? 'Disponivel somente no app desktop.'}</strong>
                    </article>
                    <article>
                      <span>Biblioteca da campanha</span>
                      <strong>{desktopInfo?.dataDir ?? 'Disponivel somente no app desktop.'}</strong>
                    </article>
                  </div>
                  <div className="launcher-settings-modal__actions">
                    <button onClick={handleOpenInstallFolder} type="button">
                      Abrir app
                    </button>
                    <button onClick={handleOpenDataFolder} type="button">
                      Abrir biblioteca
                    </button>
                    <button
                      onClick={() =>
                        setLauncherSettingsStatus(
                          'Para mudar de disco com seguranca, desinstale e instale novamente escolhendo a nova pasta.',
                        )
                      }
                      type="button"
                    >
                      Mudar pasta
                    </button>
                    <button
                      className="launcher-settings-modal__danger"
                      onClick={() => void handleOpenUninstallSettings()}
                      type="button"
                    >
                      Desinstalar
                    </button>
                  </div>
                </div>
              ) : null}

              {launcherSettingsTab === 'about' ? (
                <div className="launcher-settings-modal__panel">
                  <p className="launcher-kicker">Sobre</p>
                  <h2>FUSHI Tabletop</h2>
                  <div className="launcher-settings-about">
                    <article>
                      <span>Versao do launcher</span>
                      <strong>{desktopInfo?.version ?? 'web'}</strong>
                    </article>
                    <article>
                      <span>Canal de updates</span>
                      <strong>{updateStatus?.feedUrl ?? 'Nao configurado'}</strong>
                    </article>
                    <article>
                      <span>Termos</span>
                      <strong>Uso privado para testes da mesa FUSHI.</strong>
                    </article>
                  </div>
                  <button
                    className="launcher-settings-modal__secondary"
                    onClick={() => void handleUpdateAction()}
                    type="button"
                  >
                    Checar updates
                  </button>
                </div>
              ) : null}

              {launcherSettingsStatus ? (
                <p className="launcher-settings-modal__status">{launcherSettingsStatus}</p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {isRepairConfirmOpen ? (
        <div className="launcher-modal-backdrop" role="presentation">
          <section
            aria-labelledby="launcher-repair-title"
            aria-modal="true"
            className="launcher-maintenance-modal"
            role="dialog"
          >
            <p className="launcher-kicker">Manutencao</p>
            <h2 id="launcher-repair-title">Confirmar reparo</h2>
            <p>
              Esta area mexe nos dados locais do app. Faca backup antes de
              confirmar; reparos profundos podem apagar ou substituir campanhas
              locais.
            </p>
            <div className="launcher-maintenance-modal__actions">
              <button
                className="launcher-topbar__button"
                onClick={() => setIsRepairConfirmOpen(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="launcher-start-button"
                disabled={isRepairBusy}
                onClick={() => void handleRepair()}
                type="button"
              >
                Confirmar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
