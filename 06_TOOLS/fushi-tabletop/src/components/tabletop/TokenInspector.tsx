import { useState } from 'react'
import type {
  CharacterSheet,
  FactionItem,
  TabletopOriginalConsciousnessState,
  TabletopToken,
  TabletopTokenSizePreset,
} from '../../data/types'
import type { FushiAccessProfile, FushiAccessProfileId } from '../../lib/playerAccess'
import { CharacterProfileCard } from '../characters/CharacterProfileCard'
import { FloatingWindow } from '../ui/FloatingWindow'

interface SharedBodySheetOption {
  characterId: string
  characterName: string
  label: string
  selectionId: string
}

interface IdentityResourceOption {
  label: string
  profileId: FushiAccessProfileId
}

interface TokenInspectorProps {
  character: CharacterSheet | null
  factionName: string | null
  token: TabletopToken | null
  selectedCount: number
  canEdit: boolean
  canEditToken: boolean
  canRemoveToken: boolean
  factions: FactionItem[]
  playerProfiles: FushiAccessProfile[]
  showSensitiveNotes: boolean
  sharedBodySheetOptions: SharedBodySheetOption[]
  activeSharedBodySheetSelectionId: string
  identityResourceOptions: IdentityResourceOption[]
  activeIdentityResourceProfileId: FushiAccessProfileId | ''
  tokenSizePreset: TabletopTokenSizePreset | null
  tokenSizeSummary: string | null
  onCharacterChange: (nextCharacter: CharacterSheet) => void
  onPreviewImage: (src: string, label: string) => void
  onBroadcastImage?: (src: string, label: string) => void
  onRemoveToken: () => void
  onSharedBodySheetSelect: (selectionId: string) => void
  onIdentityResourceSelect: (profileId: FushiAccessProfileId | '') => void
  onBindTokenAsPlayerBody?: (
    playerId: FushiAccessProfileId,
    originalState: TabletopOriginalConsciousnessState,
  ) => void
  onTokenControlChange?: (playerIds: FushiAccessProfileId[]) => void
  onTokenSizeChange: (preset: Exclude<TabletopTokenSizePreset, 'custom'>) => void
  onToggleVisibility?: () => void
  onClose: () => void
}

export function TokenInspector({
  character,
  factionName,
  token,
  selectedCount,
  canEdit,
  canEditToken,
  canRemoveToken,
  factions,
  playerProfiles,
  showSensitiveNotes,
  sharedBodySheetOptions,
  activeSharedBodySheetSelectionId,
  identityResourceOptions,
  activeIdentityResourceProfileId,
  tokenSizePreset,
  tokenSizeSummary,
  onCharacterChange,
  onPreviewImage,
  onBroadcastImage,
  onRemoveToken,
  onSharedBodySheetSelect,
  onIdentityResourceSelect,
  onBindTokenAsPlayerBody,
  onTokenControlChange,
  onTokenSizeChange,
  onToggleVisibility,
  onClose,
}: TokenInspectorProps) {
  const [editingSheetKey, setEditingSheetKey] = useState('')
  const [bodyBindingPlayerId, setBodyBindingPlayerId] =
    useState<FushiAccessProfileId | ''>('')
  const [bodyBindingState, setBodyBindingState] =
    useState<TabletopOriginalConsciousnessState>('em_disputa')

  if (!character || !token) {
    return null
  }

  const sheetKey = `${character.id}:${token.id}`
  const sheetIsEditable = canEdit && editingSheetKey === sheetKey
  const visibilityLabel =
    token.visibility === 'gm'
      ? 'Visivel somente para o mestre'
      : 'Visivel para todos os jogadores'
  const controlledByPlayerIds = token.control?.controlledByPlayerIds ?? []
  const playerProfileOptions = playerProfiles.filter((profile) => profile.role === 'player')
  const persistentPlayer = token.persistentControl?.playerId
    ? playerProfiles.find((profile) => profile.id === token.persistentControl?.playerId)
    : null

  function togglePlayerControl(profileId: FushiAccessProfileId) {
    if (!onTokenControlChange) {
      return
    }

    const nextPlayerIds = controlledByPlayerIds.includes(profileId)
      ? controlledByPlayerIds.filter((playerId) => playerId !== profileId)
      : [...controlledByPlayerIds, profileId]

    onTokenControlChange(nextPlayerIds as FushiAccessProfileId[])
  }

  return (
    <FloatingWindow
      className="floating-window--sheet"
      initialPosition={{ x: 120, y: 72 }}
      initialSize={{ width: 980, height: 760 }}
      onClose={onClose}
      subtitle={selectedCount > 1 ? `${selectedCount} tokens selecionados` : visibilityLabel}
      title={character.nome}
    >
      <div className="list-stack">
        {canEditToken && (onToggleVisibility || sheetIsEditable) ? (
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Token em mesa</p>
                <h3>{sheetIsEditable ? 'Escala e ocupacao' : 'Visibilidade'}</h3>
              </div>
              {tokenSizeSummary ? <span className="tag">{tokenSizeSummary}</span> : null}
            </div>

            <div className="tabletop-hud-panel__actions">
              {onToggleVisibility ? (
                <button
                  className={`button${token.visibility === 'public' ? ' button--primary' : ''}`}
                  onClick={onToggleVisibility}
                  type="button"
                >
                  {token.visibility === 'gm'
                    ? 'Mostrar aos jogadores'
                    : 'Ocultar dos jogadores'}
                </button>
              ) : null}
              {sheetIsEditable ? (
                <>
                  {(['1x1', '2x2', '3x3'] as const).map((preset) => (
                    <button
                      className={`button${tokenSizePreset === preset ? ' button--primary' : ''}`}
                      key={preset}
                      onClick={() => onTokenSizeChange(preset)}
                      type="button"
                    >
                      {preset}
                    </button>
                  ))}
                  <button className="button" disabled type="button">
                    Custom futuro
                  </button>
                  {canRemoveToken ? (
                    <button className="button" onClick={onRemoveToken} type="button">
                      Remover token da cena
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </article>
        ) : null}

        {sharedBodySheetOptions.length > 0 ? (
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Corpo compartilhado</p>
                <h3>Ficha por jogador</h3>
              </div>
              <span className="tag">{sharedBodySheetOptions.length} ficha(s)</span>
            </div>

            <div className="tabletop-hud-panel__actions">
              <button
                className={`button${
                  activeSharedBodySheetSelectionId ? '' : ' button--primary'
                }`}
                onClick={() => onSharedBodySheetSelect('')}
                type="button"
              >
                Corpo
              </button>
              {sharedBodySheetOptions.map((option) => (
                <button
                  className={`button${
                    activeSharedBodySheetSelectionId === option.selectionId
                      ? ' button--primary'
                      : ''
                  }`}
                  key={option.selectionId}
                  onClick={() => onSharedBodySheetSelect(option.selectionId)}
                  type="button"
                  title={option.characterName}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </article>
        ) : null}

        {identityResourceOptions.length > 0 ? (
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Identidade</p>
                <h3>Atributos, pericias e FUSHI</h3>
              </div>
              <span className="tag">{identityResourceOptions.length} jogador(es)</span>
            </div>

            <div className="tabletop-hud-panel__actions">
              <button
                className={`button${
                  activeIdentityResourceProfileId ? '' : ' button--primary'
                }`}
                onClick={() => onIdentityResourceSelect('')}
                type="button"
              >
                Corpo
              </button>
              {identityResourceOptions.map((option) => (
                <button
                  className={`button${
                    activeIdentityResourceProfileId === option.profileId
                      ? ' button--primary'
                      : ''
                  }`}
                  key={option.profileId}
                  onClick={() => onIdentityResourceSelect(option.profileId)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </article>
        ) : null}

        {onTokenControlChange ? (
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Permissao temporaria</p>
                <h3>Controle nesta cena</h3>
              </div>
              <span className="tag">
                {controlledByPlayerIds.length > 0
                  ? `${controlledByPlayerIds.length} controlando`
                  : 'sem player'}
              </span>
            </div>

            <div className="tabletop-control-grid">
              {playerProfileOptions.map((profile) => {
                  const isChecked = controlledByPlayerIds.includes(profile.id)

                  return (
                    <label className="tabletop-control-toggle" key={profile.id}>
                      <input
                        checked={isChecked}
                        onChange={() => togglePlayerControl(profile.id)}
                        type="checkbox"
                      />
                      <span>{profile.label}</span>
                    </label>
                  )
                })}
            </div>

            <div className="tabletop-hud-panel__actions">
              <button
                className="button"
                disabled={controlledByPlayerIds.length === 0}
                onClick={() => onTokenControlChange([])}
                type="button"
              >
                Descontrolar todos
              </button>
            </div>
          </article>
        ) : null}

        {onBindTokenAsPlayerBody ? (
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Vinculo permanente</p>
                <h3>Corpo atual de jogador</h3>
              </div>
              <span className="tag">
                {persistentPlayer ? persistentPlayer.label : 'sem vinculo'}
              </span>
            </div>

            {persistentPlayer ? (
              <p className="support-copy">
                {persistentPlayer.label} ocupa este corpo. Esse vinculo persiste entre MUN,
                MAP, cenas e grupos.
              </p>
            ) : (
              <p className="support-copy">
                Use isso para reencarnacao/ocupacao de corpo. Diferente da permissao
                temporaria, o jogador passa a controlar este corpo como protagonista.
              </p>
            )}

            <div className="form-grid form-grid--two">
              <label className="field">
                <span>Jogador</span>
                <select
                  className="field__input"
                  onChange={(event) =>
                    setBodyBindingPlayerId(event.target.value as FushiAccessProfileId | '')
                  }
                  value={bodyBindingPlayerId}
                >
                  <option value="">Escolher jogador</option>
                  {playerProfileOptions.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Consciencia original</span>
                <select
                  className="field__input"
                  onChange={(event) =>
                    setBodyBindingState(
                      event.target.value as TabletopOriginalConsciousnessState,
                    )
                  }
                  value={bodyBindingState}
                >
                  <option value="suprimida">suprimida</option>
                  <option value="em_disputa">em disputa</option>
                  <option value="coexistindo">coexistindo</option>
                  <option value="removida">removida</option>
                  <option value="desconhecida">desconhecida</option>
                </select>
              </label>
            </div>

            <div className="tabletop-hud-panel__actions">
              <button
                className="button button--primary"
                disabled={!bodyBindingPlayerId}
                onClick={() => {
                  if (!bodyBindingPlayerId) {
                    return
                  }

                  onBindTokenAsPlayerBody(bodyBindingPlayerId, bodyBindingState)
                }}
                type="button"
              >
                Vincular como corpo de jogador
              </button>
            </div>
          </article>
        ) : null}

        {sheetIsEditable && (character.permissions || token.control) ? (
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Controle e permissao</p>
                <h3>Preparado para compartilhamento</h3>
              </div>
              {token.control?.sharedControl ? <span className="tag">compartilhado</span> : null}
            </div>

            {token.control ? (
              <p className="support-copy">
                Token controlado por: {token.control.controlledByPlayerIds.join(', ') || 'ninguem'}
                . Primario: {token.control.primaryControllerId ?? 'nao definido'}.
              </p>
            ) : null}

            {character.permissions ? (
              <p className="support-copy">
                Pode virar personagem: {character.permissions.canBeAssignedToPlayer ? 'sim' : 'nao'}
                . Mestre pode revogar: {character.permissions.gmCanRevokeControl ? 'sim' : 'nao'}.
              </p>
            ) : null}

            {character.permissions?.notes ? (
              <p className="support-copy">{character.permissions.notes}</p>
            ) : null}
          </article>
        ) : null}

        <CharacterProfileCard
          allowQuickResourceEdit={canEdit}
          canBroadcastImage={Boolean(onBroadcastImage)}
          character={character}
          className="sheet-view--window"
          editable={sheetIsEditable}
          factionName={factionName ?? character.faccao}
          factions={factions}
          onBroadcastImage={onBroadcastImage}
          onChange={onCharacterChange}
          onPreviewImage={onPreviewImage}
          showSensitiveNotes={showSensitiveNotes}
        />

        {canEdit ? (
          <div className="sheet-editor-footer">
            <button
              className={`button${sheetIsEditable ? ' button--primary' : ''}`}
              onClick={() =>
                setEditingSheetKey((currentKey) => (currentKey === sheetKey ? '' : sheetKey))
              }
              type="button"
            >
              {sheetIsEditable ? 'Salvar' : 'Editar'}
            </button>
          </div>
        ) : null}
      </div>
    </FloatingWindow>
  )
}
