import type { CharacterSheet } from '../../data/types'

interface TabletopToolbarProps {
  viewMode: 'gm' | 'player'
  isGridVisible: boolean
  zoom: number
  selectedTokenName: string | null
  spawnCharacters: CharacterSheet[]
  spawnCharacterId: string
  onSpawnCharacterIdChange: (characterId: string) => void
  onToggleGrid: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onCenterMap: () => void
  onSpawnToken: () => void
  onResetSession: () => void
}

export function TabletopToolbar({
  viewMode,
  isGridVisible,
  zoom,
  selectedTokenName,
  spawnCharacters,
  spawnCharacterId,
  onSpawnCharacterIdChange,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
  onCenterMap,
  onSpawnToken,
  onResetSession,
}: TabletopToolbarProps) {
  return (
    <div className="tabletop-toolbar">
      <div className="tabletop-toolbar__row">
        <div className="tag-row">
          <span className="chip chip--accent">Mesa V1</span>
          <span className="chip">Zoom {Math.round(zoom * 100)}%</span>
          <span className="chip">
            Selecionado {selectedTokenName ?? 'Nenhum token'}
          </span>
        </div>

        <div className="tabletop-toolbar__controls">
          <button className="button" onClick={onZoomOut} type="button">
            Zoom -
          </button>
          <button className="button button--primary" onClick={onZoomIn} type="button">
            Zoom +
          </button>
          <button className="button" onClick={onResetSession} type="button">
            Resetar sessao local
          </button>

          {viewMode === 'gm' ? (
            <>
              <button className="button" onClick={onToggleGrid} type="button">
                {isGridVisible ? 'Esconder grid' : 'Mostrar grid'}
              </button>
              <button className="button" onClick={onCenterMap} type="button">
                Centralizar mapa
              </button>
            </>
          ) : null}
        </div>
      </div>

      {viewMode === 'gm' ? (
        <div className="tabletop-toolbar__row tabletop-toolbar__row--gm">
          <label className="field">
            <span>Adicionar token local</span>
            <select
              className="field__input"
              onChange={(event) => onSpawnCharacterIdChange(event.target.value)}
              value={spawnCharacterId}
            >
              {spawnCharacters.length > 0 ? (
                spawnCharacters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.nome}
                  </option>
                ))
              ) : (
                <option value="">Todos os personagens ja estao na mesa</option>
              )}
            </select>
          </label>

          <button
            className="button button--primary"
            disabled={spawnCharacters.length === 0 || !spawnCharacterId}
            onClick={onSpawnToken}
            type="button"
          >
            Criar token mockado
          </button>
        </div>
      ) : (
        <p className="support-copy">
          Player View mostra apenas tokens visiveis e remove os controles do mestre.
        </p>
      )}
    </div>
  )
}
