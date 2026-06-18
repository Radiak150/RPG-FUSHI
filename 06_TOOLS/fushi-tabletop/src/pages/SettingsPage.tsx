import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Panel } from '../components/ui/Panel'
import { useMasterData } from '../hooks/useMasterData'
import { useProductPreferences } from '../hooks/useProductPreferences'
import { useViewMode } from '../hooks/useViewMode'
import {
  buildImportedCampaignMetadata,
  createCampaignExportFile,
  createCampaignExportFilename,
  downloadJsonFile,
  getCampaignExportCharacters,
  saveImportedCampaignStorage,
  validateCampaignExportFile,
  type FushiCampaignExportFile,
  type FushiCampaignImportSummary,
} from '../lib/campaignTransfer'
import {
  buildCampaignAssetDiagnostic,
  type CampaignAssetDiagnostic,
} from '../lib/campaignAssetDiagnostics'
import {
  embedCampaignAssets,
  materializeCampaignAssetsForImport,
} from '../lib/campaignAssetTransfer'
import {
  CAMPAIGN_BACKUP_LIMIT,
  downloadCampaignBackupSnapshot,
  formatLocalBackupDateTime,
  readCampaignBackupSnapshots,
  restoreCampaignBackupSnapshot,
  saveCampaignBackupSnapshot,
  type FushiCampaignBackupSnapshot,
} from '../lib/campaignBackups'
import {
  applyFushiLocalBackup,
  createFushiBackupFilename,
  createFushiLocalBackup,
  downloadFushiLocalBackup,
  getFushiBackupSummary,
  normalizeFushiLocalBackup,
  readJsonFile,
} from '../lib/localBackup'
import {
  forceSaveCampaignStorage,
  getStorageAdapterDiagnostics,
} from '../lib/storage/storageAdapter'
import { readPersistedTabletopLibraryState } from '../lib/tabletopLibraryState'
import { readPersistedTabletopSession } from '../lib/tabletopSession'

type DesktopStorageStatus = ReturnType<
  NonNullable<Window['fushiDesktop']>['getStorageStatus']
>

export function SettingsPage() {
  const navigate = useNavigate()
  const {
    data,
    mergeImportedCampaign,
    refresh,
    setActiveCampaign,
    updateCampaign,
  } = useMasterData()
  const { activeAccessProfile, viewMode } = useViewMode()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const campaignImportInputRef = useRef<HTMLInputElement | null>(null)
  const [backupStatus, setBackupStatus] = useState('')
  const [backupRevision, setBackupRevision] = useState(0)
  const [campaignTransferStatus, setCampaignTransferStatus] = useState('')
  const [desktopDiagnosticStatus, setDesktopDiagnosticStatus] = useState('')
  const [lastDesktopSyncEvent, setLastDesktopSyncEvent] = useState('nenhum')
  const [desktopStorageStatus, setDesktopStorageStatus] =
    useState<DesktopStorageStatus | null>(null)
  const [assetDiagnostic, setAssetDiagnostic] =
    useState<CampaignAssetDiagnostic | null>(null)
  const [isImportingBackup, setIsImportingBackup] = useState(false)
  const [pendingCampaignImport, setPendingCampaignImport] = useState<{
    file: FushiCampaignExportFile
    summary: FushiCampaignImportSummary
  } | null>(null)
  const {
    theme,
    setTheme,
    visualQuality,
    setVisualQuality,
    showModuleDescriptions,
    setShowModuleDescriptions,
    showPerformanceOverlay,
    setShowPerformanceOverlay,
  } = useProductPreferences()
  const activeCampaign =
    data?.campaigns.items.find(
      (campaign) => campaign.id === data.campaigns.activeCampaignId,
    ) ??
    data?.campaigns.items[0] ??
    null
  const campaignBackupSnapshots = activeCampaign
    ? readCampaignBackupSnapshots(activeCampaign.id)
    : []
  const desktopInfo = window.fushiDesktop?.getAppInfo()
  const isDesktopRuntime = Boolean(desktopInfo)
  const storageDiagnostics = getStorageAdapterDiagnostics(activeCampaign?.id)
  const activeCampaignId = activeCampaign?.id
  const diagnosticLibraryState = activeCampaignId
    ? readPersistedTabletopLibraryState(activeCampaignId)
    : null
  const diagnosticSession = activeCampaignId
    ? readPersistedTabletopSession(activeCampaignId)
    : null
  const diagnosticTokenCount =
    diagnosticSession?.scenes.reduce((total, scene) => total + scene.tokens.length, 0) ?? 0
  const diagnosticCharacterCount = data?.characters.items.length ?? 0
  const diagnosticNpcCount =
    data?.characters.items.filter((character) => character.tipo === 'npc').length ?? 0

  void backupRevision

  useEffect(() => {
    const unsubscribe = window.fushiDesktop?.onStorageChanged((event) => {
      setLastDesktopSyncEvent(
        `${event.name ?? 'estado'} @ ${formatLocalBackupDateTime(event.receivedAt ?? new Date().toISOString())}`,
      )
      setDesktopStorageStatus(window.fushiDesktop?.getStorageStatus(activeCampaign?.id) ?? null)
    })

    return () => {
      unsubscribe?.()
    }
  }, [activeCampaign?.id])

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (!cancelled) {
        setDesktopStorageStatus(
          window.fushiDesktop?.getStorageStatus(activeCampaign?.id) ?? null,
        )
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeCampaign?.id])

  function refreshDesktopStorageStatus() {
    const status = window.fushiDesktop?.getStorageStatus(activeCampaign?.id) ?? null

    setDesktopStorageStatus(status)
    return status
  }

  function handleExportBackup() {
    const backup = createFushiLocalBackup()
    const summary = getFushiBackupSummary(backup)
    const filename = createFushiBackupFilename(data?.dashboard.campaignName)

    downloadFushiLocalBackup(backup, filename)
    setBackupStatus(
      `Backup exportado com ${summary.localStorageKeys} chave(s) locais e ${summary.sessionStorageKeys} chave(s) de sessao.`,
    )
  }

  async function handleExportCampaign() {
    if (!activeCampaign) {
      setCampaignTransferStatus('Nenhuma campanha ativa para exportar.')
      return
    }

    setCampaignTransferStatus('Preparando campanha e assets...')
    const exportFile = await embedCampaignAssets(createCampaignExportFile(activeCampaign))

    downloadJsonFile(exportFile, createCampaignExportFilename(activeCampaign))
    setCampaignTransferStatus(
      `Campanha "${activeCampaign.nome}" exportada com ${exportFile.assets?.length ?? 0} asset(s) embutido(s)${
        exportFile.assetWarnings?.length
          ? ` e ${exportFile.assetWarnings.length} aviso(s) de asset.`
          : '.'
      }`,
    )
  }

  function handleCreateCampaignBackup() {
    if (!activeCampaign) {
      setCampaignTransferStatus('Nenhuma campanha ativa para backup.')
      return
    }

    const backupResult = saveCampaignBackupSnapshot(activeCampaign, 'manual')

    downloadCampaignBackupSnapshot(backupResult.snapshot)
    setBackupRevision((current) => current + 1)
    setCampaignTransferStatus(
      backupResult.created
        ? `Backup da campanha "${activeCampaign.nome}" criado.`
        : `Backup da campanha "${activeCampaign.nome}" exportado sem novo snapshot interno, pois nada mudou.`,
    )
  }

  async function handleSelectCampaignImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setCampaignTransferStatus('Validando arquivo de campanha...')
    setPendingCampaignImport(null)

    try {
      const parsedValue = await readJsonFile(file)
      const validation = validateCampaignExportFile(parsedValue)

      if (!validation.ok || !validation.file || !validation.summary) {
        setCampaignTransferStatus(validation.error ?? 'Arquivo de campanha invalido.')
        return
      }

      setPendingCampaignImport({
        file: validation.file,
        summary: validation.summary,
      })
      setCampaignTransferStatus('Arquivo valido. Escolha como deseja importar.')
    } catch (error) {
      setCampaignTransferStatus(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel validar o arquivo de campanha.',
      )
    } finally {
      if (campaignImportInputRef.current) {
        campaignImportInputRef.current.value = ''
      }
    }
  }

  async function handleImportCampaign(mode: 'new' | 'replace') {
    if (!pendingCampaignImport) {
      return
    }

    if (mode === 'replace' && !activeCampaign) {
      setCampaignTransferStatus('Nenhuma campanha ativa para substituir.')
      return
    }

    if (mode === 'replace') {
      const confirmed = window.confirm(
        'Isso vai substituir os dados da campanha atual. Um backup JSON sera baixado antes. Confirmar?',
      )

      if (!confirmed) {
        return
      }
    }

    const targetCampaignBase = buildImportedCampaignMetadata(
      pendingCampaignImport.file,
      mode,
      activeCampaign ?? undefined,
    )
    const preparedImport = await materializeCampaignAssetsForImport(
      pendingCampaignImport.file,
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

    if (mode === 'replace' && activeCampaign) {
      const backupResult = saveCampaignBackupSnapshot(activeCampaign, 'replace')

      downloadCampaignBackupSnapshot(backupResult.snapshot)
      saveImportedCampaignStorage(importFile, activeCampaign.id)
      mergeImportedCampaign({
        campaign: targetCampaign,
        characters: getCampaignExportCharacters(importFile),
        mode: 'replace',
      })
      setActiveCampaign(activeCampaign.id)
      setCampaignTransferStatus(
        `Campanha importada com sucesso: "${targetCampaign.nome}".`,
      )
    } else {
      saveImportedCampaignStorage(importFile, targetCampaign.id)
      mergeImportedCampaign({
        campaign: targetCampaign,
        characters: getCampaignExportCharacters(importFile),
        mode: 'new',
      })
      setActiveCampaign(targetCampaign.id)
      setCampaignTransferStatus(
        `Campanha importada com sucesso: "${targetCampaign.nome}".`,
      )
    }

    setPendingCampaignImport(null)
    setBackupRevision((current) => current + 1)
    if (preparedImport.failedAssets.length > 0) {
      setCampaignTransferStatus(
        `Campanha importada, mas ${preparedImport.failedAssets.length} asset(s) ficaram como dataUrl por falha ao salvar no desktop.`,
      )
    }
    const shouldOpen = window.confirm('Campanha importada com sucesso. Abrir agora?')

    if (shouldOpen) {
      navigate('/jogar/mesa')
    }
  }

  async function handleRestoreCampaignBackup(snapshot: FushiCampaignBackupSnapshot) {
    if (!activeCampaign) {
      setCampaignTransferStatus('Nenhuma campanha ativa para restaurar.')
      return
    }

    const confirmed = window.confirm(
      `Restaurar backup de ${formatLocalBackupDateTime(snapshot.createdAt)}? Um snapshot do estado atual sera preservado antes.`,
    )

    if (!confirmed) {
      return
    }

    saveCampaignBackupSnapshot(activeCampaign, 'restore')
    updateCampaign(buildImportedCampaignMetadata(snapshot.file, 'replace', activeCampaign))
    restoreCampaignBackupSnapshot(snapshot)
    setActiveCampaign(activeCampaign.id)
    setBackupRevision((current) => current + 1)
    await refresh()
    setCampaignTransferStatus(`Backup de "${snapshot.campaignName}" restaurado.`)
  }

  async function handleImportBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsImportingBackup(true)
    setBackupStatus('Importando backup...')

    try {
      const parsedBackup = await readJsonFile(file)
      const backup = normalizeFushiLocalBackup(parsedBackup)

      if (!backup) {
        setBackupStatus('Arquivo de backup invalido para o FUSHI Tabletop.')
        return
      }

      const restoredKeys = applyFushiLocalBackup(backup)
      await refresh()
      setBackupStatus(
        `Backup importado com ${restoredKeys} chave(s) restaurada(s). Recarregando...`,
      )
      window.setTimeout(() => {
        window.location.reload()
      }, 700)
    } catch (error) {
      setBackupStatus(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel importar o backup.',
      )
    } finally {
      setIsImportingBackup(false)

      if (importInputRef.current) {
        importInputRef.current.value = ''
      }
    }
  }

  return (
    <main className="settings-screen">
      <header className="settings-topbar">
        <button
          className="launcher-brand launcher-brand--back"
          onClick={() => navigate('/launcher')}
          type="button"
        >
          <span className="launcher-brand__mark">F</span>
          <span>
            <strong>FUSHI</strong>
            <small>Voltar Launcher</small>
          </span>
        </button>
      </header>

      <section className="settings-screen__content">
        <div className="settings-screen__heading">
          <p className="eyebrow">Preferencias</p>
          <h1>Configuracoes</h1>
          <p className="support-copy">
            Ajustes locais do launcher e da mesa, livres para mestre e jogadores.
          </p>
        </div>

        <div className="page-stack">
      <div className="split-grid">
        <Panel
          eyebrow="Tema"
          title="Aparencia local"
          subtitle="Preferencias visuais aplicadas somente nesta instalacao local."
        >
          <label className="field">
            <span>Tema</span>
            <select
              className="field__input"
              onChange={(event) =>
                setTheme(event.target.value === 'mist' ? 'mist' : 'obsidian')
              }
              value={theme}
            >
              <option value="obsidian">Obsidiana</option>
              <option value="mist">Bruma</option>
            </select>
          </label>

          <label className="field">
            <span>Qualidade visual</span>
            <select
              className="field__input"
              onChange={(event) =>
                setVisualQuality(
                  event.target.value === 'low' || event.target.value === 'ultra'
                    ? event.target.value
                    : 'balanced',
                )
              }
              value={visualQuality}
            >
              <option value="low">Low</option>
              <option value="balanced">Equilibrado</option>
              <option value="ultra">Ultra</option>
            </select>
          </label>

          <label className="toggle-row">
            <input
              checked={showModuleDescriptions}
              onChange={(event) => setShowModuleDescriptions(event.target.checked)}
              type="checkbox"
            />
            <span>Mostrar descricoes auxiliares na navegacao e no hub</span>
          </label>

          <label className="toggle-row">
            <input
              checked={showPerformanceOverlay}
              onChange={(event) => setShowPerformanceOverlay(event.target.checked)}
              type="checkbox"
            />
            <span>Mostrar FPS e ping na mesa</span>
          </label>
        </Panel>

        <Panel
          eyebrow="Preferencias"
          title="Ajustes gerais"
          subtitle="Configuracoes locais que ficam neste PC e nao alteram a campanha do mestre."
        >
          <div className="cards-grid">
            <article className="list-card">
              <h3>Entrada da mesa</h3>
              <p className="support-copy">
                O acesso de mestre ou jogador e escolhido ao iniciar a mesa, nao nas
                configuracoes.
              </p>
            </article>
            <article className="list-card">
              <h3>Biblioteca local</h3>
              <p className="support-copy">
                {desktopInfo?.libraryDir ?? 'Disponivel somente no app desktop.'}
              </p>
            </article>
          </div>
        </Panel>
      </div>

      <Panel
        eyebrow="Gerenciar campanha"
        title="Exportar e importar campanha"
        subtitle="Exporta somente a campanha ativa e seus estados persistidos, sem codigo, builds ou dados ignorados."
      >
        <div className="cards-grid">
          <article className="list-card">
            <div className="list-card__top">
              <h3>Campanha ativa</h3>
              <span className="tag">{activeCampaign?.codigo ?? 'sem campanha'}</span>
            </div>
            <p className="support-copy">
              {activeCampaign?.nome ?? 'Selecione ou crie uma campanha antes de exportar.'}
            </p>
            <div className="tabletop-hud-panel__actions">
              <button
                className="button button--primary"
                disabled={!activeCampaign}
                onClick={handleExportCampaign}
                type="button"
              >
                Exportar campanha
              </button>
              <button
                className="button"
                disabled={!activeCampaign}
                onClick={handleCreateCampaignBackup}
                type="button"
              >
                Criar backup da campanha atual
              </button>
            </div>
          </article>

          <article className="list-card">
            <div className="list-card__top">
              <h3>Importar campanha</h3>
              <span className="tag">json</span>
            </div>
            <p className="support-copy">
              Valida o arquivo antes de criar uma nova campanha ou substituir a atual.
            </p>
            <div className="tabletop-hud-panel__actions">
              <button
                className="button"
                onClick={() => campaignImportInputRef.current?.click()}
                type="button"
              >
                Importar campanha
              </button>
              <input
                accept="application/json,.json"
                hidden
                onChange={handleSelectCampaignImport}
                ref={campaignImportInputRef}
                type="file"
              />
            </div>
          </article>
        </div>

        {pendingCampaignImport ? (
          <article className="list-card">
            <div className="list-card__top">
              <h3>{pendingCampaignImport.summary.campaignName}</h3>
              <span className="tag">v{pendingCampaignImport.summary.version}</span>
            </div>
            <div className="tag-row">
              <span className="tag">
                Exportada: {formatLocalBackupDateTime(pendingCampaignImport.summary.exportedAt)}
              </span>
              <span className="tag">{pendingCampaignImport.summary.mapCount} mapas</span>
              <span className="tag">
                {pendingCampaignImport.summary.locationCount} locais MUN
              </span>
              <span className="tag">
                {pendingCampaignImport.summary.groupCount} grupos
              </span>
              <span className="tag">
                {pendingCampaignImport.summary.characterCount} fichas
              </span>
              <span className="tag">
                {pendingCampaignImport.summary.assetCount} assets
              </span>
            </div>
            <p className="support-copy">Como deseja importar?</p>
            <div className="tabletop-hud-panel__actions">
              <button
                className="button button--primary"
                onClick={() => void handleImportCampaign('new')}
                type="button"
              >
                Importar como nova campanha
              </button>
              <button
                className="button"
                disabled={!activeCampaign}
                onClick={() => void handleImportCampaign('replace')}
                type="button"
              >
                Substituir campanha atual
              </button>
              <button
                className="button"
                onClick={() => setPendingCampaignImport(null)}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </article>
        ) : null}

        {campaignTransferStatus ? (
          <p className="support-copy">{campaignTransferStatus}</p>
        ) : null}

        <article className="list-card">
          <div className="list-card__top">
            <h3>Restaurar backup</h3>
            <span className="tag">ultimos {CAMPAIGN_BACKUP_LIMIT}</span>
          </div>
          {campaignBackupSnapshots.length > 0 ? (
            <div className="stack-list">
              {campaignBackupSnapshots.map((snapshot) => (
                <div className="split-row" key={snapshot.id}>
                  <div>
                    <strong>{formatLocalBackupDateTime(snapshot.createdAt)}</strong>
                    <p className="support-copy">
                      {snapshot.reason === 'auto'
                        ? 'Backup automatico'
                        : snapshot.reason === 'replace'
                          ? 'Backup antes de substituicao'
                          : snapshot.reason === 'restore'
                            ? 'Backup antes de restauracao'
                            : 'Backup manual'}
                    </p>
                  </div>
                  <div className="tabletop-hud-panel__actions">
                    <button
                      className="button"
                      onClick={() => downloadCampaignBackupSnapshot(snapshot)}
                      type="button"
                    >
                      Exportar
                    </button>
                    <button
                      className="button"
                      onClick={() => void handleRestoreCampaignBackup(snapshot)}
                      type="button"
                    >
                      Restaurar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="support-copy">
              Nenhum snapshot interno desta campanha ainda. O app cria backups automaticos
              periodicamente enquanto a campanha esta aberta.
            </p>
          )}
        </article>
      </Panel>

      <Panel
        eyebrow="Diagnostico"
        title="Diagnostico Desktop"
        subtitle="Ferramentas locais para conferir o runtime e o storage fisico do FUSHI."
      >
        <div className="cards-grid">
          <article className="list-card">
            <div className="list-card__top">
              <h3>Runtime</h3>
              <span className="tag">{isDesktopRuntime ? 'Electron' : 'Browser'}</span>
            </div>
            <p className="support-copy">
              {desktopInfo?.dataDir ?? 'Usando storage do navegador atual.'}
            </p>
          </article>
          <article className="list-card">
            <div className="list-card__top">
              <h3>Biblioteca</h3>
              <span className="tag">conteudo externo</span>
            </div>
            <p className="support-copy">
              {desktopInfo?.libraryDir ?? 'Disponivel somente no app desktop.'}
            </p>
          </article>
          <article className="list-card">
            <div className="list-card__top">
              <h3>Desktop V1</h3>
              <span className="tag">offline local</span>
            </div>
            <div className="tag-row">
              <span className="tag">
                mapas custom: {diagnosticLibraryState?.customMaps.length ?? 0}
              </span>
              <span className="tag">tokens: {diagnosticTokenCount}</span>
              <span className="tag">fichas: {diagnosticCharacterCount}</span>
              <span className="tag">NPCs: {diagnosticNpcCount}</span>
            </div>
          </article>
          <article className="list-card">
            <div className="list-card__top">
              <h3>Campanha ativa</h3>
              <span className="tag">{data?.campaigns.activeCampaignId ?? 'nenhuma'}</span>
            </div>
            <p className="support-copy">
              {activeCampaign?.nome ?? 'Nenhuma campanha selecionada.'}
            </p>
          </article>
          <article className="list-card">
            <div className="list-card__top">
              <h3>Sync local</h3>
              <span className="tag">{window.fushiDesktop?.onStorageChanged ? 'ativo' : 'browser'}</span>
            </div>
            <p className="support-copy">
              View: {viewMode} | Perfil: {activeAccessProfile?.id ?? 'sem login'} | Ultimo evento: {lastDesktopSyncEvent}
            </p>
          </article>
          <article className="list-card">
            <div className="list-card__top">
              <h3>Persistencia fisica</h3>
              <span className="tag">
                {storageDiagnostics.lastSaveAt
                  ? formatLocalBackupDateTime(storageDiagnostics.lastSaveAt)
                  : 'sem save'}
              </span>
            </div>
            <p className="support-copy">
              Ultimo load:{' '}
              {storageDiagnostics.lastLoadAt
                ? formatLocalBackupDateTime(storageDiagnostics.lastLoadAt)
                : 'nenhum'}{' '}
              | Operacao: {storageDiagnostics.lastOperation ?? 'nenhuma'}
            </p>
          </article>
        </div>

        {desktopStorageStatus ? (
          <article className="list-card">
            <div className="list-card__top">
              <h3>Blocos no filesystem</h3>
              <span className="tag">{desktopStorageStatus.campaignId}</span>
            </div>
            <p className="support-copy">{desktopStorageStatus.campaignDir}</p>
            <div className="tag-row">
              {desktopStorageStatus.campaignBlocks.map((block) => (
                <span className="tag" key={block.name}>
                  {block.name}: {block.exists ? 'ok' : 'faltando'}
                </span>
              ))}
              {desktopStorageStatus.appBlocks
                .filter((block) => block.name === 'workspace')
                .map((block) => (
                  <span className="tag" key={block.name}>
                    masterWorkspace: {block.exists ? 'ok' : 'faltando'}
                  </span>
                ))}
            </div>
          </article>
        ) : null}

        <article className="list-card">
          <div className="list-card__top">
            <h3>Campanhas no workspace</h3>
            <span className="tag">{data?.campaigns.items.length ?? 0}</span>
          </div>
          <div className="stack-list">
            {data?.campaigns.items.map((campaign) => (
              <div className="split-row" key={campaign.id}>
                <div>
                  <strong>{campaign.nome}</strong>
                  <p className="support-copy">{campaign.id}</p>
                </div>
                <span className="tag">
                  {campaign.id === data.campaigns.activeCampaignId ? 'ativa' : campaign.status}
                </span>
              </div>
            ))}
          </div>
        </article>

        <div className="tabletop-hud-panel__actions">
          <button
            className="button"
            disabled={!isDesktopRuntime}
            onClick={() => {
              const opened = window.fushiDesktop?.openDataFolder()
              setDesktopDiagnosticStatus(
                opened
                  ? 'Pasta de dados solicitada ao Windows.'
                  : 'Nao foi possivel abrir a pasta de dados.',
              )
            }}
            type="button"
          >
            Abrir pasta de dados
          </button>
          <button
            className="button"
            onClick={() => {
              forceSaveCampaignStorage(activeCampaign?.id)
              refreshDesktopStorageStatus()
              setDesktopDiagnosticStatus('Estado atual gravado novamente no storage fisico.')
            }}
            type="button"
          >
            Forcar salvar agora
          </button>
          <button
            className="button"
            onClick={() => {
              void refresh()
              window.setTimeout(refreshDesktopStorageStatus, 50)
              setDesktopDiagnosticStatus('Campanha atual recarregada do disco.')
            }}
            type="button"
          >
            Recarregar do disco
          </button>
          <button
            className="button"
            onClick={() => {
              void refresh()
              setDesktopDiagnosticStatus(
                'Nao existe cache separado de placeholders; se eles aparecem, faltam dados reais no workspace/campanha importada.',
              )
            }}
            type="button"
          >
            Limpar cache de placeholders/template
          </button>
          <button
            className="button"
            onClick={() => {
              setAssetDiagnostic(
                buildCampaignAssetDiagnostic(data, data?.campaigns.activeCampaignId),
              )
            }}
            type="button"
          >
            Verificar assets da campanha
          </button>
          <button
            className="button"
            onClick={() => {
              setAssetDiagnostic(
                buildCampaignAssetDiagnostic(data, data?.campaigns.activeCampaignId),
              )
              setDesktopDiagnosticStatus(
                'Reparo automatico roda durante importacao de exports novos. Para URLs antigas quebradas, reexporte a campanha na web atualizada e importe novamente.',
              )
            }}
            type="button"
          >
            Reparar referencias de assets
          </button>
        </div>
        {desktopDiagnosticStatus ? (
          <p className="support-copy">{desktopDiagnosticStatus}</p>
        ) : null}
        {assetDiagnostic ? (
          <article className="list-card">
            <div className="list-card__top">
              <h3>Diagnostico de Assets</h3>
              <span className="tag">
                {assetDiagnostic.resolvedCount}/{assetDiagnostic.totalCount} resolvidos
              </span>
            </div>
            <div className="tag-row">
              <span className="tag">campanha: {assetDiagnostic.brokenByCategory.campanha}</span>
              <span className="tag">mapa: {assetDiagnostic.brokenByCategory.mapa}</span>
              <span className="tag">personagem: {assetDiagnostic.brokenByCategory.personagem}</span>
              <span className="tag">item: {assetDiagnostic.brokenByCategory.item}</span>
              <span className="tag">MUN: {assetDiagnostic.brokenByCategory.mun}</span>
            </div>
            {assetDiagnostic.broken.length > 0 ? (
              <div className="stack-list">
                {assetDiagnostic.broken.slice(0, 12).map((issue) => (
                  <div className="split-row" key={`${issue.owner}-${issue.field}-${issue.url}`}>
                    <div>
                      <strong>{issue.owner}</strong>
                      <p className="support-copy">
                        {issue.category} | {issue.field}: {issue.reason}
                      </p>
                    </div>
                    <span className="tag">{issue.url.slice(0, 38)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="support-copy">Nenhuma imagem quebrada detectada.</p>
            )}
          </article>
        ) : null}
      </Panel>

      <Panel
        eyebrow="Backup"
        title="Backup do Mestre"
        subtitle="Salva e restaura personagens, campanhas, mesa, imagens locais e preferencias desta instalacao."
      >
        <div className="cards-grid">
          <article className="list-card">
            <div className="list-card__top">
              <h3>Dados atuais</h3>
              <span className="tag">local</span>
            </div>
            <div className="tag-row">
              <span className="tag">{data?.characters.items.length ?? 0} fichas</span>
              <span className="tag">{data?.campaigns.items.length ?? 0} campanhas</span>
              <span className="tag">{data?.tabletop.scenes.length ?? 0} cenas base</span>
            </div>
          </article>

          <article className="list-card">
            <div className="list-card__top">
              <h3>Arquivo fisico</h3>
              <span className="tag">json</span>
            </div>
            <p className="support-copy">
              Use antes de atualizar, limpar navegador ou mudar de porta.
            </p>
            <div className="tabletop-hud-panel__actions">
              <button
                className="button button--primary"
                onClick={handleExportBackup}
                type="button"
              >
                Exportar tudo
              </button>
              <button
                className="button"
                disabled={isImportingBackup}
                onClick={() => importInputRef.current?.click()}
                type="button"
              >
                Importar backup
              </button>
              <input
                accept="application/json,.json"
                hidden
                onChange={handleImportBackup}
                ref={importInputRef}
                type="file"
              />
            </div>
          </article>
        </div>

        {backupStatus ? <p className="support-copy">{backupStatus}</p> : null}
      </Panel>

      <Panel
        eyebrow="Preferencias locais"
        title="Estado salvo do produto"
        subtitle="Resumo simples das camadas locais que ja existem nesta etapa."
      >
        <div className="cards-grid">
          <article className="list-card">
            <h3>Tema atual</h3>
            <p className="support-copy">{theme === 'mist' ? 'Bruma' : 'Obsidiana'}</p>
          </article>
          <article className="list-card">
            <h3>Qualidade visual</h3>
            <p className="support-copy">
              {visualQuality === 'ultra'
                ? 'Ultra'
                : visualQuality === 'low'
                  ? 'Low'
                  : 'Equilibrado'}
            </p>
          </article>
          <article className="list-card">
            <h3>Descricoes auxiliares</h3>
            <p className="support-copy">
              {showModuleDescriptions ? 'Visiveis' : 'Ocultas'}
            </p>
          </article>
          <article className="list-card">
            <h3>Fonte atual</h3>
            <p className="support-copy">{data?.meta.sourceLabel ?? 'local'}</p>
          </article>
          <article className="list-card">
            <h3>Mesa local</h3>
            <p className="support-copy">
              Tokens, zoom, grid e view mode continuam persistidos localmente.
            </p>
          </article>
        </div>
      </Panel>
        </div>
      </section>
    </main>
  )
}
