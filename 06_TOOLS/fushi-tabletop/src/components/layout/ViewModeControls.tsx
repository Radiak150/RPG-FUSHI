import { useMasterData } from '../../hooks/useMasterData'
import { useViewMode } from '../../hooks/useViewMode'
import { getPlayerCharacters } from '../../lib/selectors'

interface ViewModeControlsProps {
  showPlayerCharacterSelect?: boolean
}

export function ViewModeControls({
  showPlayerCharacterSelect = true,
}: ViewModeControlsProps) {
  const { data } = useMasterData()
  const {
    activeAccessProfile,
    logoutAccessProfile,
    playerCharacterId,
    setPlayerCharacterId,
    setViewMode,
    viewMode,
  } = useViewMode()

  const playerCharacters = data ? getPlayerCharacters(data) : []
  const effectivePlayerCharacterId =
    playerCharacterId || playerCharacters[0]?.id || ''

  return (
    <div className="view-mode-controls">
      <div className="view-mode-toggle" role="tablist" aria-label="Modo de visualizacao">
        <button
          className={`toggle-button${viewMode === 'gm' ? ' toggle-button--active' : ''}`}
          disabled={activeAccessProfile?.role !== 'gm'}
          onClick={() => setViewMode('gm')}
          type="button"
        >
          Mestre
        </button>
        <button
          className={`toggle-button${
            viewMode === 'player' ? ' toggle-button--active' : ''
          }`}
          disabled={activeAccessProfile?.role !== 'gm' && activeAccessProfile?.role !== 'player'}
          onClick={() => setViewMode('player')}
          type="button"
        >
          Jogador
        </button>
      </div>

      {activeAccessProfile ? (
        <div className="tag-row">
          <span className="tag">{activeAccessProfile.label}</span>
          <button className="button button--compact" onClick={logoutAccessProfile} type="button">
            Sair
          </button>
        </div>
      ) : null}

      {showPlayerCharacterSelect &&
      viewMode === 'player' &&
      playerCharacters.length > 0 ? (
        <label className="field">
          <span>Personagem do jogador</span>
          <select
            className="field__input"
            onChange={(event) => setPlayerCharacterId(event.target.value)}
            value={effectivePlayerCharacterId}
          >
            {playerCharacters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.nome}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  )
}
