import type { CharacterSheet, FactionItem } from '../../data/types'
import { CharacterProfileCard } from './CharacterProfileCard'

interface CharacterEditorPanelProps {
  draft: CharacterSheet
  factions: FactionItem[]
  mode: 'create' | 'edit'
  onChange: (nextDraft: CharacterSheet) => void
  onClose: () => void
  onSave: () => void
}

export function CharacterEditorPanel({
  draft,
  factions,
  mode,
  onChange,
  onClose,
  onSave,
}: CharacterEditorPanelProps) {
  const activeFaction =
    factions.find((faction) => faction.id === draft.faccao) ?? factions[0] ?? null

  return (
    <div className="editor-overlay" role="presentation">
      <section
        aria-label={mode === 'create' ? 'Criar personagem' : 'Editar personagem'}
        className="editor-panel editor-panel--sheet"
      >
        <header className="editor-panel__header">
          <div>
            <p className="eyebrow">{mode === 'create' ? 'Criar' : 'Editar'}</p>
            <h2>{mode === 'create' ? 'Novo personagem' : draft.nome}</h2>
          </div>

          <button className="tabletop-icon-button" onClick={onClose} type="button">
            x
          </button>
        </header>

        <CharacterProfileCard
          character={draft}
          editable
          factionName={activeFaction?.nome ?? draft.faccao}
          factions={factions}
          onChange={onChange}
          showSensitiveNotes
        />

        <footer className="editor-panel__footer">
          <button className="button" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="button button--primary" onClick={onSave} type="button">
            Salvar
          </button>
        </footer>
      </section>
    </div>
  )
}
