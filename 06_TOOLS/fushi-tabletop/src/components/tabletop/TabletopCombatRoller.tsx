import { useEffect, useMemo, useRef, useState } from 'react'
import {
  formatBuildModifiers,
  getBuildItems,
} from '../../data/combatCatalog'
import type {
  CharacterFeatureActivationRequest,
  CharacterSheet,
  TabletopToken,
} from '../../data/types'
import {
  getCharacterActionCheckOptions,
  getCharacterActionActivationLabel,
  getCharacterActionCostsLabel,
} from '../../lib/characterActions'
import {
  calculateCombatAction,
  getCombatRollDicePenalty,
  getCharacterCombatActions,
  resolveCombatCheckOption,
  type CharacterCombatActionOption,
  type CombatRangeDefinition,
} from '../../lib/combatRolls'
import {
  getCombatBlockValue,
  getCombatDodgeValue,
  resolveCombatAction,
} from '../../lib/combatV2'

interface TabletopCombatRollerProps {
  characters: CharacterSheet[]
  fixedCharacterId?: string
  focusRequest?: {
    featureId: string
    id: number
    sourceTokenId: string
  }
  isGm: boolean
  onActivate: (request: CharacterFeatureActivationRequest) => void
  onPreview: (input: {
    featureName: string
    range: CombatRangeDefinition
    sourceTokenId: string
    targetTokenId?: string
    visibility: 'local' | 'public'
  }) => void
  preferredSourceTokenId?: string
  tokens: TabletopToken[]
}

type CombatActionGroup = 'ataque' | 'habilidade' | 'ritual'

const ACTION_GROUPS: Array<{ id: CombatActionGroup; label: string }> = [
  { id: 'ataque', label: 'Ataques' },
  { id: 'habilidade', label: 'Habilidades' },
  { id: 'ritual', label: 'Rituais' },
]

function getActionGroup(option: CharacterCombatActionOption): CombatActionGroup {
  return option.source === 'ataque'
    ? 'ataque'
    : option.source === 'ritual'
      ? 'ritual'
      : 'habilidade'
}

function formatContextLabel(context: string) {
  if (context === 'ability') return 'habilidade'
  if (context === 'adjacent') return 'adjacente'
  if (context === 'ranged') return 'distancia'
  return 'corpo a corpo'
}

export function TabletopCombatRoller({
  characters,
  fixedCharacterId,
  focusRequest,
  isGm,
  onActivate,
  onPreview,
  preferredSourceTokenId,
  tokens,
}: TabletopCombatRollerProps) {
  const [activeGroup, setActiveGroup] = useState<CombatActionGroup>('ataque')
  const [checkOptionByAction, setCheckOptionByAction] = useState<Record<string, string>>({})
  const [sourceTokenId, setSourceTokenId] = useState(preferredSourceTokenId ?? '')
  const [targetTokenId, setTargetTokenId] = useState('')
  const lastHandledFocusRequestIdRef = useRef<number | null>(null)
  const characterById = useMemo(
    () => new Map(characters.map((character) => [character.id, character])),
    [characters],
  )
  const availableSourceTokens = useMemo(
    () =>
      tokens.filter(
        (token) =>
          characterById.has(token.characterId) &&
          (!fixedCharacterId || token.characterId === fixedCharacterId),
      ),
    [characterById, fixedCharacterId, tokens],
  )

  const resolvedSourceTokenId =
    availableSourceTokens.find((token) => token.id === sourceTokenId)?.id ??
    availableSourceTokens.find((token) => token.id === preferredSourceTokenId)?.id ??
    availableSourceTokens[0]?.id ??
    ''
  const sourceToken =
    availableSourceTokens.find((token) => token.id === resolvedSourceTokenId) ?? null
  const sourceCharacter = sourceToken ? characterById.get(sourceToken.characterId) ?? null : null
  const targetTokens = tokens.filter((token) => token.id !== sourceToken?.id)
  const targetToken = targetTokens.find((token) => token.id === targetTokenId) ?? null
  const allActions = useMemo(
    () => (sourceCharacter ? getCharacterCombatActions(sourceCharacter) : []),
    [sourceCharacter],
  )
  const groupCounts = ACTION_GROUPS.reduce<Record<CombatActionGroup, number>>(
    (counts, group) => ({
      ...counts,
      [group.id]: allActions.filter((option) => getActionGroup(option) === group.id).length,
    }),
    { ataque: 0, habilidade: 0, ritual: 0 },
  )
  const build = sourceCharacter?.combatProfile?.build
  const buildItems = getBuildItems(build)
  const buildModifiers = build
    ? formatBuildModifiers(build.totals ?? build.item?.modifiers)
    : []

  useEffect(() => {
    if (
      !focusRequest ||
      lastHandledFocusRequestIdRef.current === focusRequest.id
    ) {
      return
    }

    lastHandledFocusRequestIdRef.current = focusRequest.id
    const focusedToken = availableSourceTokens.find(
      (token) => token.id === focusRequest.sourceTokenId,
    )
    const focusedCharacter = focusedToken
      ? characterById.get(focusedToken.characterId) ?? null
      : null
    const focusedAction = (focusedCharacter
      ? getCharacterCombatActions(focusedCharacter)
      : []
    ).find(
      (option) => option.feature.id === focusRequest.featureId,
    )

    const timeoutId = window.setTimeout(() => {
      if (focusedAction) {
        setActiveGroup(getActionGroup(focusedAction))
      }
      setSourceTokenId(focusRequest.sourceTokenId)
      document
        .querySelector<HTMLElement>(
          `[data-combat-feature-id="${CSS.escape(focusRequest.featureId)}"]`,
        )
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)

    return () => window.clearTimeout(timeoutId)
  }, [availableSourceTokens, characterById, focusRequest])

  const renderedActiveGroup =
    groupCounts[activeGroup] > 0
      ? activeGroup
      : ACTION_GROUPS.find((group) => groupCounts[group.id] > 0)?.id ?? activeGroup
  const actions = allActions.filter(
    (option) => getActionGroup(option) === renderedActiveGroup,
  )

  if (!sourceCharacter || !sourceToken) {
    return (
      <section className="tabletop-combat-roller tabletop-combat-roller--empty">
        <strong>Nenhum personagem vinculado a um token visivel.</strong>
        <span>Coloque ou vincule o token na cena para usar os Dados de Combate.</span>
      </section>
    )
  }

  return (
    <section className="tabletop-combat-roller">
      <div className="tabletop-combat-roller__selectors">
        {isGm ? (
          <label className="field">
            <span>Personagem da cena</span>
            <select
              className="field__input"
              onChange={(event) => {
                setSourceTokenId(event.target.value)
                setTargetTokenId('')
              }}
              value={sourceToken.id}
            >
              {availableSourceTokens.map((token) => (
                <option key={token.id} value={token.id}>
                  {characterById.get(token.characterId)?.nome ?? token.label} [{token.label}]
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="tabletop-combat-roller__identity">
            <span>Personagem vinculado</span>
            <strong>{sourceCharacter.nome}</strong>
          </div>
        )}

        <label className="field">
          <span>Alvo para distancia</span>
          <select
            className="field__input"
            onChange={(event) => setTargetTokenId(event.target.value)}
            value={targetTokenId}
          >
            <option value="">Sem alvo selecionado</option>
            {targetTokens.map((token) => (
              <option key={token.id} value={token.id}>
                {characterById.get(token.characterId)?.nome ?? token.label} [{token.label}]
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="tabletop-combat-roller__stats">
        <span><b>CA</b> {sourceCharacter.defesa}</span>
        <span><b>Bloqueio</b> {getCombatBlockValue(sourceCharacter)}</span>
        <span><b>Esquiva</b> {getCombatDodgeValue(sourceCharacter) ?? '--'}</span>
        <span><b>Vida</b> {sourceCharacter.recursos.vidaAtual}/{sourceCharacter.recursos.vidaMaxima}</span>
        <span><b>FUSHI</b> {sourceCharacter.recursos.fushiAtual}/{sourceCharacter.recursos.fushiMaximo}</span>
      </div>

      {buildItems.length > 0 ? (
        <details className="tabletop-combat-roller__build">
          <summary>
            Build ativa <span>{buildItems.length} item(ns)</span>
          </summary>
          <div className="tabletop-combat-roller__modifier-list">
            {buildModifiers.map((modifier) => (
              <span className={modifier.value > 0 ? 'is-positive' : 'is-negative'} key={modifier.key}>
                {modifier.value > 0 ? '+' : ''}{modifier.value} {modifier.label}
              </span>
            ))}
          </div>
        </details>
      ) : null}

      <div className="tabletop-combat-roller__groups" aria-label="Tipo de acao">
        {ACTION_GROUPS.map((group) => (
          <button
            aria-pressed={renderedActiveGroup === group.id}
            className={renderedActiveGroup === group.id ? 'is-active' : ''}
            disabled={groupCounts[group.id] === 0}
            key={group.id}
            onClick={() => setActiveGroup(group.id)}
            type="button"
          >
            {group.label} <span>{groupCounts[group.id]}</span>
          </button>
        ))}
      </div>

      <div className="tabletop-combat-roller__actions">
        {actions.length > 0 ? actions.map((option) => {
          const actionKey = `${option.source}-${option.feature.id}`
          const checkOptions = getCharacterActionCheckOptions(option.feature)
          const selectedCheckOption = resolveCombatCheckOption({
            checkOptionId: checkOptionByAction[actionKey],
            feature: option.feature,
            sourceCell: sourceToken.cell,
            targetCell: targetToken?.cell,
          })
          const resolved = resolveCombatAction(option.feature)
          const calculation = calculateCombatAction({
            character: sourceCharacter,
            checkOptionId: selectedCheckOption?.id,
            feature: option.feature,
            source: option.source,
            sourceCell: sourceToken.cell,
            targetCell: targetToken?.cell,
          })
          const automation = option.feature.automation
          const costs = automation ? getCharacterActionCostsLabel(option.feature) : ''
          const activation = automation ? getCharacterActionActivationLabel(option.feature) : ''
          const closeRangeDicePenalty = getCombatRollDicePenalty({
            checkOption: selectedCheckOption,
            distanceSquares: calculation.distanceSquares,
            feature: option.feature,
          })
          const requiresTarget = Boolean(calculation.damageFormula)
          const canActivate =
            Boolean(automation) &&
            (!requiresTarget || Boolean(targetToken)) &&
            calculation.isInRange

          return (
            <article
              className="tabletop-combat-action"
              data-combat-feature-id={option.feature.id}
              key={actionKey}
            >
              <header>
                <div>
                  <span>{activation || resolved.action}</span>
                  <strong>{option.feature.nome}</strong>
                </div>
                {calculation.damageFormula ? (
                  <div className="tabletop-combat-action__damage">
                    <span>Dano final</span>
                    <strong>{calculation.damageFormula}</strong>
                  </div>
                ) : null}
              </header>

              <div className="tabletop-combat-action__facts">
                {automation?.range ? <span>Alcance: {automation.range}</span> : null}
                {calculation.distanceMeters !== null ? (
                  <span>
                    Alvo: {calculation.distanceSquares} q / {calculation.distanceMeters} m
                  </span>
                ) : null}
                {!calculation.isInRange ? (
                  <span className="is-negative">{calculation.rangeReason}</span>
                ) : null}
                {closeRangeDicePenalty < 0 ? (
                  <span className="is-negative">Pontaria adjacente: -1d20</span>
                ) : null}
                {costs ? <span>Custo: {costs}</span> : null}
                {selectedCheckOption ? (
                  <span>Teste: {selectedCheckOption.label} vs CA</span>
                ) : resolved.test ? <span>Teste: {resolved.test}</span> : null}
                {calculation.buildDamageBonus !== 0 ? (
                  <span className={calculation.buildDamageBonus > 0 ? 'is-positive' : 'is-negative'}>
                    Build {calculation.buildDamageBonus > 0 ? '+' : ''}{calculation.buildDamageBonus} ({calculation.contexts.map(formatContextLabel).join(', ')})
                  </span>
                ) : null}
              </div>

              {checkOptions.length > 1 ? (
                <label className="field tabletop-combat-action__check-option">
                  <span>Forma do ataque</span>
                  <select
                    className="field__input"
                    onChange={(event) =>
                      setCheckOptionByAction((current) => ({
                        ...current,
                        [actionKey]: event.target.value,
                      }))
                    }
                    value={selectedCheckOption?.id ?? checkOptions[0]?.id ?? ''}
                  >
                    {checkOptions.map((checkOption) => (
                      <option key={checkOption.id} value={checkOption.id}>
                        {checkOption.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <p>{resolved.effect || option.feature.descricao}</p>
              {automation?.limit ? <small>Limite: {automation.limit}</small> : null}

              <div className="tabletop-combat-action__commands">
                {calculation.range ? (
                  <button
                    className="button"
                    onClick={() => onPreview({
                      featureName: option.feature.nome,
                      range: calculation.range as CombatRangeDefinition,
                      sourceTokenId: sourceToken.id,
                      targetTokenId: targetToken?.id,
                      visibility: 'local',
                    })}
                    type="button"
                  >
                    Ver area
                  </button>
                ) : null}
                {isGm && calculation.range ? (
                  <button
                    className="button"
                    onClick={() => onPreview({
                      featureName: option.feature.nome,
                      range: calculation.range as CombatRangeDefinition,
                      sourceTokenId: sourceToken.id,
                      targetTokenId: targetToken?.id,
                      visibility: 'public',
                    })}
                    type="button"
                  >
                    Mostrar na mesa
                  </button>
                ) : null}
                <button
                  className="button button--primary"
                  disabled={!canActivate}
                  onClick={() => onActivate({
                    character: sourceCharacter,
                    checkOptionId: selectedCheckOption?.id,
                    combatSnapshot: {
                      distanceMeters: calculation.distanceMeters,
                      distanceSquares: calculation.distanceSquares,
                      sourceCell: sourceToken.cell,
                      targetCell: targetToken?.cell,
                    },
                    feature: option.feature,
                    source: option.source,
                    targetTokenId: targetToken?.id,
                    tokenId: sourceToken.id,
                  })}
                  type="button"
                >
                  {!automation
                    ? 'Sem automacao'
                    : !targetToken && requiresTarget
                      ? 'Escolha o alvo'
                      : !calculation.isInRange
                        ? 'Fora do alcance'
                        : 'Ativar'}
                </button>
              </div>
            </article>
          )
        }) : (
          <p className="support-copy">Nenhuma acao cadastrada nesta categoria.</p>
        )}
      </div>
    </section>
  )
}
