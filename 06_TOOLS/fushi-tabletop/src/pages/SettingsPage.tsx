import { useRef, useState, type ChangeEvent } from 'react'
import { ViewModeControls } from '../components/layout/ViewModeControls'
import { Panel } from '../components/ui/Panel'
import { useMasterData } from '../hooks/useMasterData'
import { useProductPreferences } from '../hooks/useProductPreferences'
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
  const { data, refresh } = useMasterData()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [backupStatus, setBackupStatus] = useState('')
  const [isImportingBackup, setIsImportingBackup] = useState(false)
  const {
    theme,
    setTheme,
    showModuleDescriptions,
    setShowModuleDescriptions,
  } = useProductPreferences()

  function handleExportBackup() {
    const backup = createFushiLocalBackup()
    const summary = getFushiBackupSummary(backup)
    const filename = createFushiBackupFilename(data?.dashboard.campaignName)

    downloadFushiLocalBackup(backup, filename)
    setBackupStatus(
      `Backup exportado com ${summary.localStorageKeys} chave(s) locais e ${summary.sessionStorageKeys} chave(s) de sessao.`,
    )
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
