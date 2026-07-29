import { useState } from 'react'
import type {
  CharacterFeatureActivationRequest,
  CharacterSheet,
  FactionItem,
  TabletopOriginalConsciousnessState,
  TabletopToken,
  TabletopTokenSizePreset,
} from '../../data/types'
import type { FushiAccessProfile, FushiAccessProfileId } from '../../lib/playerAccess'
import { prepareCharacterForEditing } from '../../lib/characterSheet'
import type {
  TabletopCharacterEditLock,
  TabletopPlayerDeathState,
} from '../../lib/tabletopSession'
import {
  CharacterProfileCard,
  type CharacterSheetEffectView,
  type CharacterSheetFocusRequest,
} from '../characters/CharacterProfileCard'
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

type MasterInspectorTab = 'token' | 'identity' | 'binding'

interface TokenInspectorProps {
  character: CharacterSheet | null
  factionName: string | null
  token: TabletopToken | null
  selectedCount: number
  canEdit: boolean
  editLock?: TabletopCharacterEditLock | null
  canEditToken: boolean
  canDuplicateMobToken: boolean
  canResizeToken: boolean
  canRemoveToken: boolean
  deathState?: TabletopPlayerDeathState | null
  canManageDeathState?: boolean
  effectsAppliedByCharacter?: CharacterSheetEffectView[]
  effectsAppliedToCharacter?: CharacterSheetEffectView[]
  factions: FactionItem[]
  focusRequest?: CharacterSheetFocusRequest
  playerProfiles: FushiAccessProfile[]
  showMasterControls: boolean
  showSensitiveNotes: boolean
  sharedBodySheetOptions: SharedBodySheetOption[]
  activeSharedBodySheetSelectionId: string
  identityResourceOptions: IdentityResourceOption[]
  activeIdentityResourceProfileId: FushiAccessProfileId | ''
  tokenSizePreset: TabletopTokenSizePreset | null
  tokenSizeSummary: string | null
  restoreSignal?: number | string
  onCharacterChange: (nextCharacter: CharacterSheet) => void
  onBeginCharacterEdit?: () => boolean
  onEndCharacterEdit?: () => void
  onActivateFeature?: (input: CharacterFeatureActivationRequest) => void
  onPreviewImage: (src: string, label: string) => void
  onBroadcastImage?: (src: string, label: string) => void
  onRemoveToken: () => void
  onSharedBodySheetSelect: (selectionId: string) => void
  onIdentityResourceSelect: (profileId: FushiAccessProfileId | '') => void
  onBindTokenAsPlayerBody?: (
    playerIds: FushiAccessProfileId[],
    originalState: TabletopOriginalConsciousnessState,
  ) => void
  onTokenSizeChange: (preset: Exclude<TabletopTokenSizePreset, 'custom'>) => void
  onToggleStealth?: () => void
  onToggleVisibility?: () => void
  onClose: () => void
  onDuplicateMobToken?: () => void
  onDeathSaveSlotChange?: (slotIndex: number) => void
  onCancelEffect?: (effectId: string) => void
  onOpenStatusGuide?: (statusId?: string) => void
}

function getTokenControlPlayerIds(
  token: TabletopToken | null,
  playerProfiles: FushiAccessProfile[],
) {
  const playerIds = new Set(
    playerProfiles
      .filter((profile) => profile.role === 'player')
      .map((profile) => profile.id),
  )

  return Array.from(
    new Set([
      ...(token?.control?.controlledByPlayerIds ?? []),
      token?.persistentControl?.playerId ?? '',
    ]),
  ).filter(
    (playerId): playerId is FushiAccessProfileId =>
      Boolean(playerId) && playerIds.has(playerId as FushiAccessProfileId),
  )
}

export function TokenInspector({
  character,
  factionName,
  token,
  selectedCount,
  canEdit,
  editLock = null,
  canEditToken,
  canDuplicateMobToken,
  canResizeToken,
  canRemoveToken,
  deathState = null,
  canManageDeathState = false,
  effectsAppliedByCharacter = [],
  effectsAppliedToCharacter = [],
  factions,
  focusRequest,
  playerProfiles,
  showMasterControls,
  showSensitiveNotes,
  sharedBodySheetOptions,
  activeSharedBodySheetSelectionId,
  identityResourceOptions,
  activeIdentityResourceProfileId,
  tokenSizePreset,
  tokenSizeSummary,
  restoreSignal,
  onCharacterChange,
  onBeginCharacterEdit,
  onEndCharacterEdit,
  onCancelEffect,
  onOpenStatusGuide,
  onActivateFeature,
  onPreviewImage,
  onBroadcastImage,
  onRemoveToken,
  onSharedBodySheetSelect,
  onIdentityResourceSelect,
  onBindTokenAsPlayerBody,
  onTokenSizeChange,
  onToggleStealth,
  onToggleVisibility,
  onClose,
  onDuplicateMobToken,
  onDeathSaveSlotChange,
}: TokenInspectorProps) {
  const [editingSheetKey, setEditingSheetKey] = useState('')
  const [sheetDraft, setSheetDraft] = useState<CharacterSheet | null>(null)
  const [sheetDraftKey, setSheetDraftKey] = useState('')
  const [isMasterPanelOpen, setIsMasterPanelOpen] = useState(false)
  const [masterInspectorTab, setMasterInspectorTab] =
    useState<MasterInspectorTab>('token')
  const [bodyBindingDraft, setBodyBindingDraft] = useState<{
    key: string
    playerIds: FushiAccessProfileId[]
  }>({ key: '', playerIds: [] })
  const [bodyBindingState, setBodyBindingState] =
    useState<TabletopOriginalConsciousnessState>('em_disputa')
  const bodyBindingKey = [
    token?.id ?? '',
    token?.persistentControl?.playerId ?? '',
    ...(token?.control?.controlledByPlayerIds ?? []),
  ].join('|')
  const bodyBindingPlayerIds =
    bodyBindingDraft.key === bodyBindingKey
      ? bodyBindingDraft.playerIds
      : getTokenControlPlayerIds(token, playerProfiles)
  const sheetKey = character && token ? `${character.id}:${token.id}` : ''
  const sheetIsEditable = Boolean(canEdit && sheetKey && editingSheetKey === sheetKey)
  const renderedCharacter =
    sheetIsEditable && sheetDraftKey === sheetKey && sheetDraft ? sheetDraft : character

  if (!character || !token || !renderedCharacter) {
    return null
  }

  const visibilityLabel =
    token.visibility === 'gm'
      ? 'Visivel somente para o mestre'
      : 'Visivel para todos os jogadores'
  const playerProfileOptions = playerProfiles.filter((profile) => profile.role === 'player')
  const persistentPlayers = bodyBindingPlayerIds
    .map((playerId) => playerProfiles.find((profile) => profile.id === playerId))
    .filter((profile): profile is FushiAccessProfile => Boolean(profile))
  const persistentPlayerLabel =
    persistentPlayers.length > 0
      ? persistentPlayers.map((profile) => profile.label).join(', ')
      : 'sem vinculo'
  const canShowMasterPanel = showMasterControls && canEditToken
  const masterTabOptions: Array<{
    id: MasterInspectorTab
    label: string
  }> = [
    { id: 'token', label: 'Token em mesa' },
    { id: 'identity', label: 'Identidade' },
    { id: 'binding', label: 'Vinculo Permanente' },
  ]

  return (
    <FloatingWindow
      className="floating-window--sheet"
      initialPosition={{ x: 120, y: 72 }}
      initialSize={{ width: 980, height: 760 }}
      onClose={() => {
        if (sheetIsEditable) {
          onEndCharacterEdit?.()
        }
        onClose()
      }}
      restoreSignal={restoreSignal}
      subtitle={selectedCount > 1 ? `${selectedCount} tokens selecionados` : visibilityLabel}
      title={character.nome}
    >
      <div className="list-stack">
        {canShowMasterPanel ? (
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Controles reservados</p>
                <h3>Mestre</h3>
              </div>
              <button
                className={`button${isMasterPanelOpen ? ' button--primary' : ''}`}
                onClick={() => setIsMasterPanelOpen((currentValue) => !currentValue)}
                type="button"
              >
                Mestre
              </button>
            </div>

            {isMasterPanelOpen ? (
              <div className="tabletop-hud-panel__actions" role="tablist">
                {masterTabOptions.map((option) => (
                  <button
                    className={`button${
                      masterInspectorTab === option.id ? ' button--primary' : ''
                    }`}
                    key={option.id}
                    onClick={() => setMasterInspectorTab(option.id)}
                    role="tab"
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        ) : null}

        {canShowMasterPanel && isMasterPanelOpen && masterInspectorTab === 'token' ? (
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Token em mesa</p>
                <h3>Visibilidade e tamanho</h3>
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
              {onToggleStealth ? (
                <button
                  className={`button${token.stealth?.enabled ? ' button--primary' : ''}`}
                  onClick={onToggleStealth}
                  type="button"
                >
                  {token.stealth?.enabled ? 'Remover furtividade' : 'Furtivo'}
                </button>
              ) : null}
              {canResizeToken ? (
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
                </>
              ) : null}
              {canDuplicateMobToken && onDuplicateMobToken ? (
                <button className="button" onClick={onDuplicateMobToken} type="button">
                  Duplicar mob
                </button>
              ) : null}
              {canRemoveToken ? (
                <button className="button" onClick={onRemoveToken} type="button">
                  Remover token da cena
                </button>
              ) : null}
            </div>
          </article>
        ) : null}

        {canShowMasterPanel && isMasterPanelOpen && masterInspectorTab === 'identity' ? (
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Identidade</p>
                <h3>Fichas e recursos por jogador</h3>
              </div>
              <span className="tag">
                {identityResourceOptions.length + sharedBodySheetOptions.length} vinculo(s)
              </span>
            </div>

            {sharedBodySheetOptions.length > 0 ? (
              <>
                <p className="support-copy">
                  Ficha visivel na janela do mestre para corpos compartilhados.
                </p>
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
              </>
            ) : null}

            {identityResourceOptions.length > 0 ? (
              <>
                <p className="support-copy">
                  Recurso de identidade aplicado na ficha enquanto o mestre consulta o
                  corpo.
                </p>
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
              </>
            ) : null}

            {sharedBodySheetOptions.length === 0 && identityResourceOptions.length === 0 ? (
              <p className="support-copy">
                Nenhum jogador vinculado a este corpo por enquanto.
              </p>
            ) : null}
          </article>
        ) : null}

        {canShowMasterPanel &&
        isMasterPanelOpen &&
        masterInspectorTab === 'binding' &&
        onBindTokenAsPlayerBody ? (
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Vinculo permanente</p>
                <h3>Corpo atual de jogador</h3>
              </div>
              <span className="tag">{persistentPlayerLabel}</span>
            </div>

            {persistentPlayers.length > 0 ? (
              <p className="support-copy">
                {persistentPlayerLabel} ocupa este corpo. Esse vinculo persiste entre MUN,
                MAP, cenas e grupos.
              </p>
            ) : (
              <p className="support-copy">
                Use isso para reencarnacao/ocupacao de corpo. Diferente da permissao
                temporaria, o jogador passa a controlar este corpo como protagonista.
              </p>
            )}

            <div className="tabletop-control-grid">
              {playerProfileOptions.map((profile) => {
                const isChecked = bodyBindingPlayerIds.includes(profile.id)

                return (
                  <label className="tabletop-control-toggle" key={profile.id}>
                    <input
                      checked={isChecked}
                      onChange={() =>
                        setBodyBindingDraft({
                          key: bodyBindingKey,
                          playerIds: isChecked
                            ? bodyBindingPlayerIds.filter(
                                (playerId) => playerId !== profile.id,
                              )
                            : [...bodyBindingPlayerIds, profile.id],
                        })
                      }
                      type="checkbox"
                    />
                    <span>{profile.label}</span>
                  </label>
                )
              })}
            </div>

            <details className="details-block">
              <summary>Opcoes avancadas de reencarnacao</summary>
              <label className="field">
                <span>Estado da consciencia original</span>
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
            </details>

            <div className="tabletop-hud-panel__actions">
              <button
                className="button button--primary"
                disabled={bodyBindingPlayerIds.length === 0}
                onClick={() => {
                  if (bodyBindingPlayerIds.length === 0) {
                    return
                  }

                  onBindTokenAsPlayerBody(bodyBindingPlayerIds, bodyBindingState)
                }}
                type="button"
              >
                Vincular como corpo de jogador
              </button>
            </div>
          </article>
        ) : null}

        {sheetIsEditable && character.permissions ? (
          <article className="list-card">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Controle e permissao</p>
                <h3>Preparado para compartilhamento</h3>
              </div>
              <span className="tag">avancado</span>
            </div>

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
        {editLock && editLock.ownerId !== 'gm' && !sheetIsEditable ? (
          <article className="list-card tabletop-sheet-lock" role="status">
            <p className="eyebrow">Ficha em edicao</p>
            <strong>{editLock.ownerLabel} esta atualizando esta ficha.</strong>
            <p className="support-copy">
              Aguarde o salvamento antes de editar ou alterar recursos.
            </p>
          </article>
        ) : null}

        {deathState ? (
          <article className="list-card tabletop-sheet-death-state" role="status">
            <div className="list-card__top">
              <div>
                <p className="eyebrow">Estado atual</p>
                <h3>Desmaiado</h3>
              </div>
              <span aria-hidden="true" className="tabletop-sheet-death-state__skull">
                ☠
              </span>
            </div>
            <p className="support-copy">
              Tres sucessos estabilizam. Tres falhas encerram as tentativas.
              Recuperar 2 de Vida tambem remove este estado.
            </p>
            <div
              aria-label="Tentativas de estabilizacao"
              className="tabletop-sheet-death-state__results"
            >
              {[0, 1, 2].map((slotIndex) => {
                const result = deathState.results[slotIndex]
                const label =
                  result === 'success'
                    ? 'Sucesso'
                    : result === 'failure'
                      ? 'Falha'
                      : 'Pendente'

                return (
                  <button
                    aria-label={`Tentativa ${slotIndex + 1}: ${label}`}
                    className={`tabletop-sheet-death-state__result${
                      result ? ` is-${result}` : ''
                    }`}
                    disabled={!canManageDeathState}
                    key={slotIndex}
                    onClick={() => onDeathSaveSlotChange?.(slotIndex)}
                    type="button"
                  >
                    <span>{slotIndex + 1}</span>
                    <strong>{label}</strong>
                  </button>
                )
              })}
            </div>
          </article>
        ) : null}

        <CharacterProfileCard
          allowQuickResourceEdit={canEdit}
          canBroadcastImage={Boolean(onBroadcastImage)}
          character={renderedCharacter}
          className="sheet-view--window"
          editable={sheetIsEditable}
          factionName={factionName ?? character.faccao}
          factions={factions}
          focusRequest={focusRequest}
          effectsAppliedByCharacter={effectsAppliedByCharacter}
          effectsAppliedToCharacter={effectsAppliedToCharacter}
          onActivateFeature={onActivateFeature}
          onBroadcastImage={onBroadcastImage}
          onCancelEffect={onCancelEffect}
          onOpenStatusGuide={onOpenStatusGuide}
          onChange={sheetIsEditable ? setSheetDraft : onCharacterChange}
          onPreviewImage={onPreviewImage}
          showSensitiveNotes={showSensitiveNotes}
        />

        {canEdit ? (
          <div className="sheet-editor-footer">
            {sheetIsEditable ? (
              <>
                <button
                  className="button button--primary"
                  onClick={() => {
                    if (sheetDraft && sheetDraftKey === sheetKey) {
                      onCharacterChange(sheetDraft)
                    }
                    onEndCharacterEdit?.()
                    setEditingSheetKey('')
                  }}
                  type="button"
                >
                  Salvar
                </button>
                <button
                  className="button"
                  onClick={() => {
                    setSheetDraft(prepareCharacterForEditing(character))
                    setSheetDraftKey(sheetKey)
                    onEndCharacterEdit?.()
                    setEditingSheetKey('')
                  }}
                  type="button"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                className="button"
                onClick={() => {
                  if (onBeginCharacterEdit && !onBeginCharacterEdit()) {
                    return
                  }
                  setSheetDraft(prepareCharacterForEditing(character))
                  setSheetDraftKey(sheetKey)
                  setEditingSheetKey(sheetKey)
                }}
                type="button"
              >
                Editar
              </button>
            )}
          </div>
        ) : null}
      </div>
    </FloatingWindow>
  )
}
