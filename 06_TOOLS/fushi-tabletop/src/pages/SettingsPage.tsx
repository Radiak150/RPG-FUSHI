import { useRef, useState, type ChangeEvent } from 'react'
import { ViewModeControls } from '../components/layout/ViewModeControls'
import { Panel } from '../components/ui/Panel'
import { useMasterData } from '../hooks/useMasterData'
import { useProductPreferences } from '../hooks/useProductPreferences'
import {
  buildImportedCampaignMetadata,
  createCampaignExportFile,
  createCampaignExportFilename,
  downloadJsonFile,
  saveImportedCampaignStorage,
  validateCampaignExportFile,
  type FushiCampaignExportFile,
  type FushiCampaignImportSummary,
} from '../lib/campaignTransfer'
import {
  applyFushiLocalBackup,
  createFushiBackupFilename,
  createFushiLocalBackup,
  downloadFushiLocalBackup,
  getFushiBackupSummary,
  normalizeFushiLocalBackup,
  readJsonFile,
} from '../lib/localBackup'

export function SettingsPage() {
  const {
    data,
    createCampaign,
    refresh,
    setActiveCampaign,
    updateCampaign,
  } = useMasterData()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const campaignImportInputRef = useRef<HTMLInputElement | null>(null)
  const [backupStatus, setBackupStatus] = useState('')
  const [campaignTransferStatus, setCampaignTransferStatus] = useState('')
  const [isImportingBackup, setIsImportingBackup] = useState(false)
  const [pendingCampaignImport, setPendingCampaignImport] = useState<{
    file: FushiCampaignExportFile
    summary: FushiCampaignImportSummary
  } | null>(null)
  const {
    theme,
    setTheme,
    showModuleDescriptions,
    setShowModuleDescriptions,
  } = useProductPreferences()
  const activeCampaign =
    data?.campaigns.items.find(
      (campaign) => campaign.id === data.campaigns.activeCampaignId,
    ) ??
    data?.campaigns.items[0] ??
    null

  function buildBackupFilename(campaignId: string) {
    const date = new Date().toISOString().slice(0, 10)

    return `fushi-backup-${campaignId}-${date}.json`
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

  function handleExportCampaign() {
    if (!activeCampaign) {
      setCampaignTransferStatus('Nenhuma campanha ativa para exportar.')
      return
    }

    const exportFile = createCampaignExportFile(activeCampaign)

    downloadJsonFile(exportFile, createCampaignExportFilename(activeCampaign))
    setCampaignTransferStatus(`Campanha "${activeCampaign.nome}" exportada.`)
  }

  function handleCreateCampaignBackup() {
    if (!activeCampaign) {
      setCampaignTransferStatus('Nenhuma campanha ativa para backup.')
      return
    }

    const exportFile = createCampaignExportFile(activeCampaign)

    downloadJsonFile(exportFile, buildBackupFilename(activeCampaign.id))
    setCampaignTransferStatus(`Backup da campanha "${activeCampaign.nome}" criado.`)
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

    const targetCampaign = buildImportedCampaignMetadata(
      pendingCampaignImport.file,
      mode,
      activeCampaign ?? undefined,
    )

    if (mode === 'replace' && activeCampaign) {
      downloadJsonFile(createCampaignExportFile(activeCampaign), buildBackupFilename(activeCampaign.id))
      updateCampaign(targetCampaign)
      saveImportedCampaignStorage(pendingCampaignImport.file, activeCampaign.id)
      setActiveCampaign(activeCampaign.id)
      setCampaignTransferStatus(`Campanha atual substituida por "${targetCampaign.nome}".`)
    } else {
      const createdCampaign = createCampaign(targetCampaign)

      if (!createdCampaign) {
        setCampaignTransferStatus('Nao foi possivel criar a campanha importada.')
        return
      }

      saveImportedCampaignStorage(pendingCampaignImport.file, createdCampaign.id)
      setActiveCampaign(createdCampaign.id)
      setCampaignTransferStatus(`Campanha importada como "${createdCampaign.nome}".`)
    }

    setPendingCampaignImport(null)
    await refresh()
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

          <label className="toggle-row">
            <input
              checked={showModuleDescriptions}
              onChange={(event) => setShowModuleDescriptions(event.target.checked)}
              type="checkbox"
            />
            <span>Mostrar descricoes auxiliares na navegacao e no hub</span>
          </label>
        </Panel>

        <Panel
          eyebrow="View mode"
          title="Visao da plataforma"
          subtitle="Altere entre GM View e Player View sem sair do produto."
        >
          <ViewModeControls />
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
                Exportada: {pendingCampaignImport.summary.exportedAt.slice(0, 10)}
              </span>
              <span className="tag">{pendingCampaignImport.summary.mapCount} mapas</span>
              <span className="tag">
                {pendingCampaignImport.summary.locationCount} locais MUN
              </span>
              <span className="tag">
                {pendingCampaignImport.summary.groupCount} grupos
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
  )
}
