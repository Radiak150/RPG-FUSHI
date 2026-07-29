import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Info } from 'lucide-react'
import type {
  AttributeKey,
  CharacterActionAutomation,
  CharacterActionStatusEffect,
  CharacterAttack,
  CharacterFeatureActivationRequest,
  CharacterFeatureActivationSource,
  CharacterFeatureDetail,
  CharacterInventoryItem,
  CharacterSheet,
  CharacterSkill,
  FactionItem,
  InventoryPackType,
} from '../../data/types'
import {
  emptyBuildModifiers,
  formatBuildModifiers,
  getBuildArchetypePresentation,
  getBuildItems,
  ITEM_RARITY_META,
} from '../../data/combatCatalog'
import {
  TABLETOP_STATUS_CATALOG,
  findTabletopStatusDefinition,
  type TabletopStatusIcon as TabletopStatusIconName,
} from '../../data/statusCatalog'
import {
  getCharacterBuildBaseline,
  getCharacterBuildBaseResources,
  reconcileCharacterBuild,
  renameCharacterBuildItem,
  updateCharacterBuildBaseDefense,
  updateCharacterBuildBaseMovement,
  updateCharacterBuildBaseResources,
} from '../../lib/characterBuilds'
import {
  getCharacterSheetModel,
  prepareCharacterForEditing,
} from '../../lib/characterSheet'
import {
  formatInventoryCapacity,
  formatInventoryMovement,
  getInventoryCapacitySummary,
  getInventoryItemSizeLabel,
} from '../../lib/inventoryCapacity'
import {
  buildAttackActionFeature,
  buildInventoryItemActionFeature,
  featureHasExecutableAutomation,
  getCharacterActionCheckOptions,
  getCharacterActionCommandLabel,
  getCharacterActionEffectsLabel,
  getCharacterActionKindLabel,
  getCharacterActionRequirementChips,
  getCharacterActionRollLabel,
} from '../../lib/characterActions'
import {
  getCombatBlockValue,
  getCombatDodgeSummary,
  getCombatDodgeValue,
  resolveCombatAction,
} from '../../lib/combatV2'
import { formatAttributeLabel } from '../../lib/rolls'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'
import { LocalImageInput } from '../ui/LocalImageInput'
import { TabletopStatusIcon } from '../tabletop/TabletopStatusIcon'

interface CharacterProfileCardProps {
  character: CharacterSheet
  factionName: string
  showSensitiveNotes: boolean
  editable?: boolean
  factions?: FactionItem[]
  onChange?: (nextCharacter: CharacterSheet) => void
  onActivateFeature?: (input: CharacterFeatureActivationRequest) => void
  onPreviewImage?: (src: string, label: string) => void
  onBroadcastImage?: (src: string, label: string) => void
  canBroadcastImage?: boolean
  allowQuickResourceEdit?: boolean
  className?: string
  focusRequest?: CharacterSheetFocusRequest
  effectsAppliedByCharacter?: CharacterSheetEffectView[]
  effectsAppliedToCharacter?: CharacterSheetEffectView[]
  onCancelEffect?: (effectId: string) => void
  onOpenStatusGuide?: (statusId?: string) => void
}

export type CharacterSheetTab =
  | 'combate'
  | 'habilidades'
  | 'rituais'
  | 'inventario'
  | 'efeitos'
  | 'build'
  | 'descricao'

export interface CharacterSheetEffectView {
  canCancel: boolean
  color: string
  description: string
  durationRounds?: number
  icon: TabletopStatusIconName
  id: string
  kind: 'buff' | 'condition' | 'debuff' | 'mark'
  label: string
  sourceName: string
  stacks?: number
  statusId?: string
  targetName: string
}

export interface CharacterSheetFocusRequest {
  featureId?: string
  id: number
  tab: CharacterSheetTab
}

const SHEET_TABS: Array<{ id: CharacterSheetTab; label: string }> = [
  { id: 'combate', label: 'Combate' },
  { id: 'habilidades', label: 'Habilidades' },
  { id: 'rituais', label: 'Rituais' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'efeitos', label: 'Efeitos ativos' },
  { id: 'build', label: 'Build Absorvida' },
  { id: 'descricao', label: 'Descricao' },
]

function createDefaultCombatAutomation(
  kind: 'ataque' | 'ritual' | 'tecnica',
  attribute: AttributeKey = 'forca',
): CharacterActionAutomation {
  return {
    activation: 'Acao Principal',
    combat: {
      acao: 'principal',
      alcance: {
        band: kind === 'ataque' ? 'corpo-a-corpo' : 'curto',
        maxSquares: kind === 'ataque' ? 1 : 6,
      },
      efeitoRapido: '',
      falha: 'Sem efeito.',
      teste: {
        alvo: 'ca',
        atributo: attribute,
        pericia: kind === 'ataque' ? 'Luta' : '',
      },
    },
    costs: [],
    kind,
    target: 'Um alvo',
  }
}

const attributeOptions: AttributeKey[] = [
  'forca',
  'agilidade',
  'intelecto',
  'presenca',
  'vigor',
]

function buildInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function buildId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function parseNumberValue(value: string, fallback = 0) {
  const nextValue = Number(value)

  return Number.isFinite(nextValue) ? nextValue : fallback
}

function clampResourceValue(value: number) {
  return Math.max(0, value)
}

export function CharacterProfileCard({
  character,
  factionName,
  showSensitiveNotes,
  editable = false,
  factions,
  onChange,
  onActivateFeature,
  onPreviewImage,
  onBroadcastImage,
  canBroadcastImage = false,
  allowQuickResourceEdit = false,
  className,
  focusRequest,
  effectsAppliedByCharacter = [],
  effectsAppliedToCharacter = [],
  onCancelEffect,
  onOpenStatusGuide,
}: CharacterProfileCardProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const [activeTab, setActiveTab] = useState<CharacterSheetTab>('combate')
  const [checkOptionByFeature, setCheckOptionByFeature] = useState<Record<string, string>>({})
  const reconciledCharacter = useMemo(() => reconcileCharacterBuild(character), [character])
  const model = useMemo(() => getCharacterSheetModel(reconciledCharacter), [reconciledCharacter])
  const preparedCharacter = useMemo(
    () => prepareCharacterForEditing(reconciledCharacter),
    [reconciledCharacter],
  )
  const [editableDraft, setEditableDraft] = useState(preparedCharacter)
  const editableCharacter = editable ? editableDraft : preparedCharacter
  const workingCharacter = editable ? editableCharacter : model
  const workingFeatures = workingCharacter.habilidadesDetalhadas ?? []
  const workingRituals = workingCharacter.rituais ?? []
  const workingInventory = workingCharacter.inventarioDetalhado ?? []
  const editableFeatures = editableCharacter.habilidadesDetalhadas ?? []
  const editableRituals = editableCharacter.rituais ?? []
  const editableInventory = editableCharacter.inventarioDetalhado ?? []
  const inventorySummary = getInventoryCapacitySummary(workingCharacter)
  const editableDescription = editableCharacter.descricao ?? {
    historia: '',
    objetivo: '',
    aparencia: '',
    personalidade: '',
  }
  const isMobSheet = workingCharacter.tipo === 'mob'
  const combatBlockValue = getCombatBlockValue(workingCharacter)
  const combatDodgeValue = getCombatDodgeValue(workingCharacter)
  const combatDodgeSummary = getCombatDodgeSummary(workingCharacter)
  const characterBuild = workingCharacter.combatProfile?.build
  const editableBuildBaseline = getCharacterBuildBaseline(editableCharacter)
  const editableBaseResources = getCharacterBuildBaseResources(editableCharacter)
  const buildItems = getBuildItems(characterBuild)
  const buildPresentation = getBuildArchetypePresentation(buildItems)
  const buildModifiers = characterBuild && buildItems.length > 0
    ? formatBuildModifiers(
        characterBuild.totals ?? characterBuild.item?.modifiers ?? emptyBuildModifiers(),
      )
    : []
  const lastBuildItem = buildItems[buildItems.length - 1]
  const buildRarityColor = lastBuildItem?.rarity === 'secreto'
    ? '#f08d88'
    : lastBuildItem
      ? ITEM_RARITY_META[lastBuildItem.rarity]?.color
      : undefined
  const visibleSheetTabs = SHEET_TABS.filter(
    (tab) => tab.id !== 'build' || buildItems.length > 0,
  )
  const renderedActiveTab =
    activeTab === 'build' && buildItems.length === 0
      ? 'combate'
      : activeTab

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setEditableDraft(preparedCharacter)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [preparedCharacter])

  useEffect(() => {
    if (!focusRequest) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setActiveTab(focusRequest.tab)

      if (!focusRequest.featureId) {
        return
      }

      const target = rootRef.current?.querySelector<HTMLDetailsElement>(
        `[data-character-feature-id="${CSS.escape(focusRequest.featureId)}"]`,
      )

      if (target) {
        target.open = true
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 80)

    return () => window.clearTimeout(timeoutId)
  }, [focusRequest])

  const attributeEntries = [
    {
      id: 'forca',
      label: formatAttributeLabel('forca'),
      value: workingCharacter.atributos.forca,
    },
    {
      id: 'agilidade',
      label: formatAttributeLabel('agilidade'),
      value: workingCharacter.atributos.agilidade,
    },
    {
      id: 'intelecto',
      label: formatAttributeLabel('intelecto'),
      value: workingCharacter.atributos.intelecto,
    },
    {
      id: 'presenca',
      label: formatAttributeLabel('presenca'),
      value: workingCharacter.atributos.presenca,
    },
    {
      id: 'vigor',
      label: formatAttributeLabel('vigor'),
      value: workingCharacter.atributos.vigor,
    },
  ] as const

  function emit(
    nextCharacter: CharacterSheet,
    options: { allowReadMode?: boolean } = {},
  ) {
    if ((!editable && !options.allowReadMode) || !onChange) {
      return
    }

    onChange(nextCharacter)
  }

  function updateCharacter(
    partialCharacter: Partial<CharacterSheet>,
    options: { allowReadMode?: boolean } = {},
  ) {
    const nextCharacter = {
      ...editableCharacter,
      ...partialCharacter,
    }

    if (editable) {
      setEditableDraft(prepareCharacterForEditing(nextCharacter))
    }

    emit(nextCharacter, options)
  }

  function updateAttribute(attribute: AttributeKey, nextValue: number) {
    updateCharacter(reconcileCharacterBuild({
      ...editableCharacter,
      atributos: {
        ...editableCharacter.atributos,
        [attribute]: clampResourceValue(nextValue),
      },
    }))
  }

  function updateResource(
    resourceKey: keyof CharacterSheet['recursos'],
    nextValue: number,
    options: { allowReadMode?: boolean } = {},
  ) {
    if (editable && editableCharacter.combatProfile?.build && !options.allowReadMode) {
      const nextBaseResources = {
        ...editableBaseResources,
        [resourceKey]: clampResourceValue(nextValue),
      }
      const resourcePair =
        resourceKey === 'vidaMaxima'
          ? { current: 'vidaAtual' as const, maximum: 'vidaMaxima' as const }
          : resourceKey === 'fushiMaximo'
            ? { current: 'fushiAtual' as const, maximum: 'fushiMaximo' as const }
            : resourceKey === 'determinacaoMaxima'
              ? { current: 'determinacaoAtual' as const, maximum: 'determinacaoMaxima' as const }
              : null

      if (resourcePair) {
        if (resourceKey === resourcePair.current) {
          nextBaseResources[resourcePair.maximum] = Math.max(
            nextBaseResources[resourcePair.maximum],
            nextBaseResources[resourcePair.current],
          )
          nextBaseResources[resourcePair.current] = Math.min(
            nextBaseResources[resourcePair.current],
            nextBaseResources[resourcePair.maximum],
          )
        } else {
          nextBaseResources[resourcePair.current] =
            editableBaseResources[resourcePair.current] >= editableBaseResources[resourcePair.maximum]
              ? nextBaseResources[resourcePair.maximum]
              : Math.min(
                  nextBaseResources[resourcePair.current],
                  nextBaseResources[resourcePair.maximum],
                )
        }
      }

      updateCharacter(
        updateCharacterBuildBaseResources(editableCharacter, nextBaseResources),
      )
      return
    }

    updateCharacter({
      recursos: {
        ...editableCharacter.recursos,
        [resourceKey]: clampResourceValue(nextValue),
      },
    }, options)
  }

  function adjustResource(
    resourceKey: keyof CharacterSheet['recursos'],
    delta: number,
    options: { allowReadMode?: boolean } = {},
  ) {
    const sourceResources =
      editable && editableCharacter.combatProfile?.build && !options.allowReadMode
        ? editableBaseResources
        : editableCharacter.recursos

    updateResource(
      resourceKey,
      sourceResources[resourceKey] + delta,
      options,
    )
  }

  function updateSkill(skillIndex: number, partialSkill: Partial<CharacterSkill>) {
    updateCharacter({
      pericias: editableCharacter.pericias.map((skill, index) =>
        index === skillIndex ? { ...skill, ...partialSkill } : skill,
      ),
    })
  }

  function updateAttack(
    attackIndex: number,
    partialAttack: Partial<CharacterAttack>,
  ) {
    updateCharacter({
      ataques: editableCharacter.ataques.map((attack, index) =>
        index === attackIndex ? { ...attack, ...partialAttack } : attack,
      ),
    })
  }

  function updateFeatureList(
    key: 'habilidadesDetalhadas' | 'rituais',
    nextItems: CharacterFeatureDetail[],
  ) {
    const nextPartial: Partial<CharacterSheet> = {
      [key]: nextItems,
    }

    if (key === 'habilidadesDetalhadas') {
      nextPartial.habilidades = nextItems
        .map((item) => item.nome.trim())
        .filter(Boolean)
    }

    updateCharacter(nextPartial)
  }

  function updateInventory(nextItems: CharacterInventoryItem[]) {
    updateCharacter({
      inventario: nextItems.map((item) => item.nome.trim()).filter(Boolean),
      inventarioDetalhado: nextItems,
    })
  }

  function updateInventoryPack(mochila: InventoryPackType) {
    updateCharacter({
      inventarioPerfil: {
        mochila,
      },
    })
  }

  function renderCombatAutomationEditor(
    feature: CharacterFeatureDetail,
    fallbackKind: 'ataque' | 'ritual' | 'tecnica',
    onFeatureChange: (nextFeature: CharacterFeatureDetail) => void,
  ) {
    const automation =
      feature.automation ??
      createDefaultCombatAutomation(
        fallbackKind,
        fallbackKind === 'ataque' ? 'forca' : 'intelecto',
      )
    const combat = automation.combat ?? {}
    const check = combat.teste ?? {}
    const range = combat.alcance ?? {
      band: fallbackKind === 'ataque' ? 'corpo-a-corpo' : 'curto',
      maxSquares: fallbackKind === 'ataque' ? 1 : 6,
    }
    const fushiCost =
      automation.costs?.find((cost) => cost.resource === 'fushi')?.amount ?? 0
    const statusEffects = (automation.effects ?? []).filter(
      (effect): effect is CharacterActionStatusEffect => effect.type === 'status',
    )
    const otherEffects = (automation.effects ?? []).filter(
      (effect) => effect.type !== 'status',
    )

    function commitAutomation(nextAutomation: CharacterActionAutomation) {
      onFeatureChange({
        ...feature,
        automation: nextAutomation,
      })
    }

    function updateAutomation(partial: Partial<CharacterActionAutomation>) {
      commitAutomation({ ...automation, ...partial })
    }

    function updateCombat(
      partial: Partial<NonNullable<CharacterActionAutomation['combat']>>,
    ) {
      updateAutomation({
        combat: {
          ...combat,
          ...partial,
        },
      })
    }

    function updateStatusEffects(nextEffects: CharacterActionStatusEffect[]) {
      updateAutomation({
        effects: [...otherEffects, ...nextEffects],
      })
    }

    return (
      <details className="sheet-view__automation-editor">
        <summary>Automacao de combate</summary>
        {!feature.automation ? (
          <button
            className="button"
            onClick={() => commitAutomation(automation)}
            type="button"
          >
            Ativar modelo estruturado
          </button>
        ) : (
          <div className="sheet-view__edit-grid">
            <label className="field">
              <span className="field__label">Acao</span>
              <select
                className="sheet-view__input"
                onChange={(event) =>
                  updateCombat({
                    acao: event.target.value as NonNullable<
                      CharacterActionAutomation['combat']
                    >['acao'],
                  })
                }
                value={combat.acao ?? 'principal'}
              >
                <option value="principal">Principal</option>
                <option value="curta">Curta</option>
                <option value="movimento">Movimento</option>
                <option value="reacao">Reacao</option>
                <option value="passiva">Passiva</option>
              </select>
            </label>
            <label className="field">
              <span className="field__label">Defesa testada</span>
              <select
                className="sheet-view__input"
                onChange={(event) =>
                  updateCombat({
                    teste: {
                      ...check,
                      alvo: event.target.value as 'ca' | 'dt' | 'resistido',
                    },
                  })
                }
                value={check.alvo ?? 'ca'}
              >
                <option value="ca">CA</option>
                <option value="dt">DT fixa</option>
                <option value="resistido">Teste resistido</option>
              </select>
            </label>
            <label className="field">
              <span className="field__label">Atributo</span>
              <select
                className="sheet-view__input"
                onChange={(event) =>
                  updateCombat({
                    teste: {
                      ...check,
                      atributo: event.target.value as AttributeKey,
                    },
                  })
                }
                value={check.atributo ?? 'forca'}
              >
                {(['forca', 'agilidade', 'intelecto', 'presenca', 'vigor'] as const).map(
                  (attribute) => (
                    <option key={attribute} value={attribute}>
                      {formatAttributeLabel(attribute)}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Pericia</span>
              <input
                className="sheet-view__input"
                onChange={(event) =>
                  updateCombat({
                    teste: {
                      ...check,
                      pericia: event.target.value,
                    },
                  })
                }
                placeholder="Luta, Pontaria, Ocultismo..."
                type="text"
                value={check.pericia ?? ''}
              />
            </label>
            {check.alvo === 'dt' ? (
              <label className="field">
                <span className="field__label">DT</span>
                <input
                  className="sheet-view__input"
                  min={1}
                  onChange={(event) =>
                    updateCombat({
                      teste: {
                        ...check,
                        dificuldade: Math.max(1, Number(event.target.value) || 1),
                      },
                    })
                  }
                  type="number"
                  value={check.dificuldade ?? 10}
                />
              </label>
            ) : null}
            {check.alvo === 'resistido' ? (
              <>
                <label className="field">
                  <span className="field__label">Atributo do alvo</span>
                  <select
                    className="sheet-view__input"
                    onChange={(event) =>
                      updateCombat({
                        teste: {
                          ...check,
                          oposto: {
                            ...check.oposto,
                            atributo: event.target.value as AttributeKey,
                          },
                        },
                      })
                    }
                    value={check.oposto?.atributo ?? 'vigor'}
                  >
                    {(
                      ['forca', 'agilidade', 'intelecto', 'presenca', 'vigor'] as const
                    ).map((attribute) => (
                      <option key={attribute} value={attribute}>
                        {formatAttributeLabel(attribute)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Pericia do alvo</span>
                  <input
                    className="sheet-view__input"
                    onChange={(event) =>
                      updateCombat({
                        teste: {
                          ...check,
                          oposto: {
                            ...check.oposto,
                            pericia: event.target.value,
                          },
                        },
                      })
                    }
                    type="text"
                    value={check.oposto?.pericia ?? ''}
                  />
                </label>
              </>
            ) : null}
            <label className="field">
              <span className="field__label">Dano ou cura</span>
              <input
                className="sheet-view__input"
                onChange={(event) => {
                  const formula = event.target.value
                  updateCombat({
                    dano: formula.trim()
                      ? {
                          ...combat.dano,
                          formula,
                          gatilho: combat.dano?.gatilho ?? 'acerto',
                          tipo: combat.dano?.tipo ?? 'fisico',
                        }
                      : undefined,
                    resolucao:
                      combat.resolucao?.mode === 'heal'
                        ? {
                            ...combat.resolucao,
                            healingFormula: formula,
                          }
                        : combat.resolucao,
                  })
                }}
                placeholder="Ex.: 1d6, 2d8 + 3"
                type="text"
                value={combat.dano?.formula ?? ''}
              />
            </label>
            <label className="field">
              <span className="field__label">Resolucao</span>
              <select
                className="sheet-view__input"
                onChange={(event) =>
                  updateCombat({
                    resolucao: {
                      ...combat.resolucao,
                      mode: event.target.value as 'damage' | 'heal' | 'drain-transfer',
                      healingAmount:
                        event.target.value === 'drain-transfer'
                          ? 'effective-damage'
                          : combat.resolucao?.healingAmount,
                      healingTarget:
                        event.target.value === 'heal'
                          ? 'selected'
                          : combat.resolucao?.healingTarget,
                      healingFormula:
                        event.target.value === 'heal'
                          ? combat.dano?.formula
                          : combat.resolucao?.healingFormula,
                    },
                  })
                }
                value={combat.resolucao?.mode ?? 'damage'}
              >
                <option value="damage">Dano</option>
                <option value="heal">Cura</option>
                <option value="drain-transfer">Drena e transfere Vida</option>
              </select>
            </label>
            <label className="field">
              <span className="field__label">Faixa</span>
              <select
                className="sheet-view__input"
                onChange={(event) =>
                  updateCombat({
                    alcance: {
                      ...range,
                      band: event.target.value as typeof range.band,
                    },
                  })
                }
                value={range.band}
              >
                <option value="corpo-a-corpo">Corpo a corpo</option>
                <option value="curto">Curto</option>
                <option value="medio">Medio</option>
                <option value="longo">Longo</option>
                <option value="extremo">Extremo</option>
                <option value="mapa">Mapa inteiro</option>
              </select>
            </label>
            <label className="field">
              <span className="field__label">Max. quadrados</span>
              <input
                className="sheet-view__input"
                disabled={range.band === 'mapa'}
                min={1}
                onChange={(event) =>
                  updateCombat({
                    alcance: {
                      ...range,
                      maxSquares: Math.max(1, Number(event.target.value) || 1),
                    },
                  })
                }
                type="number"
                value={range.maxSquares ?? 1}
              />
            </label>
            <label className="field">
              <span className="field__label">Custo FUSHI</span>
              <input
                className="sheet-view__input"
                min={0}
                onChange={(event) => {
                  const amount = Math.max(0, Number(event.target.value) || 0)
                  const otherCosts = (automation.costs ?? []).filter(
                    (cost) => cost.resource !== 'fushi',
                  )
                  updateAutomation({
                    costs:
                      amount > 0
                        ? [...otherCosts, { amount, resource: 'fushi' }]
                        : otherCosts,
                  })
                }}
                type="number"
                value={fushiCost}
              />
            </label>
            <label className="field">
              <span className="field__label">Efeito no acerto</span>
              <textarea
                className="sheet-view__input sheet-view__input--textarea sheet-view__input--compact"
                onChange={(event) => updateCombat({ efeitoRapido: event.target.value })}
                value={combat.efeitoRapido ?? ''}
              />
            </label>
            <label className="field">
              <span className="field__label">Falha</span>
              <textarea
                className="sheet-view__input sheet-view__input--textarea sheet-view__input--compact"
                onChange={(event) => updateCombat({ falha: event.target.value })}
                value={combat.falha ?? ''}
              />
            </label>
            <section className="sheet-view__automation-statuses">
              <header>
                <div>
                  <span className="eyebrow">Estados canonicos</span>
                  <strong>Aplicados quando a acao tem sucesso</strong>
                </div>
                <button
                  className="button"
                  onClick={() => {
                    const definition = TABLETOP_STATUS_CATALOG[0]
                    updateStatusEffects([
                      ...statusEffects,
                      {
                        durationRounds: definition.defaultDurationRounds,
                        stacks: 1,
                        status: definition.label,
                        statusId: definition.id,
                        target: 'target',
                        type: 'status',
                      },
                    ])
                  }}
                  type="button"
                >
                  Adicionar estado
                </button>
              </header>
              {statusEffects.map((effect, effectIndex) => (
                <div
                  className="sheet-view__automation-status-row"
                  key={`${feature.id}-status-${effectIndex}`}
                >
                  <label className="field">
                    <span className="field__label">Estado</span>
                    <select
                      className="sheet-view__input"
                      onChange={(event) => {
                        const definition =
                          findTabletopStatusDefinition(event.target.value) ??
                          TABLETOP_STATUS_CATALOG[0]
                        updateStatusEffects(
                          statusEffects.map((currentEffect, currentIndex) =>
                            currentIndex === effectIndex
                              ? {
                                  ...currentEffect,
                                  durationRounds:
                                    definition.defaultDurationRounds,
                                  status: definition.label,
                                  statusId: definition.id,
                                }
                              : currentEffect,
                          ),
                        )
                      }}
                      value={effect.statusId ?? 'sangrando'}
                    >
                      {(['debuff', 'condition', 'buff'] as const).map((kind) => (
                        <optgroup
                          key={kind}
                          label={
                            kind === 'buff'
                              ? 'Buffs'
                              : kind === 'condition'
                                ? 'Condicoes'
                                : 'Debuffs'
                          }
                        >
                          {TABLETOP_STATUS_CATALOG.filter(
                            (status) => status.kind === kind,
                          ).map((status) => (
                            <option key={status.id} value={status.id}>
                              {status.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field__label">Alvo</span>
                    <select
                      className="sheet-view__input"
                      onChange={(event) =>
                        updateStatusEffects(
                          statusEffects.map((currentEffect, currentIndex) =>
                            currentIndex === effectIndex
                              ? {
                                  ...currentEffect,
                                  target: event.target.value as 'self' | 'target',
                                }
                              : currentEffect,
                          ),
                        )
                      }
                      value={effect.target ?? 'target'}
                    >
                      <option value="target">Alvo da acao</option>
                      <option value="self">Proprio usuario</option>
                    </select>
                  </label>
                  <label className="field">
                    <span className="field__label">Rodadas</span>
                    <input
                      className="sheet-view__input"
                      min={1}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        updateStatusEffects(
                          statusEffects.map((currentEffect, currentIndex) =>
                            currentIndex === effectIndex
                              ? {
                                  ...currentEffect,
                                  durationRounds:
                                    Number.isFinite(value) && value > 0
                                      ? value
                                      : undefined,
                                }
                              : currentEffect,
                          ),
                        )
                      }}
                      placeholder="Mestre"
                      type="number"
                      value={effect.durationRounds ?? ''}
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">Acumulos</span>
                    <input
                      className="sheet-view__input"
                      min={1}
                      onChange={(event) =>
                        updateStatusEffects(
                          statusEffects.map((currentEffect, currentIndex) =>
                            currentIndex === effectIndex
                              ? {
                                  ...currentEffect,
                                  stacks: Math.max(
                                    1,
                                    Number(event.target.value) || 1,
                                  ),
                                }
                              : currentEffect,
                          ),
                        )
                      }
                      type="number"
                      value={effect.stacks ?? 1}
                    />
                  </label>
                  <label className="field sheet-view__automation-status-cancel">
                    <input
                      checked={Boolean(effect.cancelableBySource)}
                      onChange={(event) =>
                        updateStatusEffects(
                          statusEffects.map((currentEffect, currentIndex) =>
                            currentIndex === effectIndex
                              ? {
                                  ...currentEffect,
                                  cancelableBySource: event.target.checked,
                                }
                              : currentEffect,
                          ),
                        )
                      }
                      type="checkbox"
                    />
                    <span>Fonte pode cancelar</span>
                  </label>
                  <button
                    className="button button--danger"
                    onClick={() =>
                      updateStatusEffects(
                        statusEffects.filter(
                          (_, currentIndex) => currentIndex !== effectIndex,
                        ),
                      )
                    }
                    type="button"
                  >
                    Remover estado
                  </button>
                </div>
              ))}
            </section>
          </div>
        )}
      </details>
    )
  }

  function renderFeatureActionCard(
    feature: CharacterFeatureDetail,
    source: CharacterFeatureActivationSource,
  ) {
    const automation = feature.automation
    const kindLabel = getCharacterActionKindLabel(feature)
    const commandLabel = getCharacterActionCommandLabel(feature)
    const checkOptions = getCharacterActionCheckOptions(feature)
    const selectedCheckOptionId =
      checkOptionByFeature[feature.id] ?? checkOptions[0]?.id
    const rollLabel = getCharacterActionRollLabel(
      feature,
      workingCharacter,
      selectedCheckOptionId,
    )
    const requirementChips = getCharacterActionRequirementChips(feature)
    const effectLabel = getCharacterActionEffectsLabel(feature)
    const combat = resolveCombatAction(feature)
    const isActiveCombatEffect =
      feature.id === 'training-davi-analise-cirurgica' &&
      workingCharacter.status.some((status) =>
        status.startsWith('combat:analise-cirurgica:'),
      )
    const canActivate =
      Boolean(onActivateFeature) && featureHasExecutableAutomation(feature)
    const tags = [
      kindLabel,
      automation?.activation,
      automation?.target,
      automation?.range,
      automation?.duration,
      automation?.limit,
      ...(automation?.tags ?? []),
    ].filter((tag): tag is string => Boolean(tag?.trim()))
    const combatFacts = [
      automation
        ? {
            label: 'Acao',
            tone: 'timing',
            value:
              combat.action === 'principal'
                ? 'Principal'
                : combat.action === 'curta'
                  ? 'Curta'
                  : combat.action === 'reacao'
                    ? 'Reacao'
                    : combat.action === 'movimento'
                      ? 'Movimento'
                      : 'Passiva',
          }
        : null,
      combat.test ? { label: 'Teste', tone: 'test', value: combat.test } : null,
      combat.damageFormula
        ? { label: 'Dano', tone: 'damage', value: combat.damageFormula }
        : null,
      combat.effect ? { label: 'Efeito', tone: 'effect', value: combat.effect } : null,
      combat.reaction ? { label: 'Reacao', tone: 'reaction', value: combat.reaction } : null,
      combat.failure
        ? { label: 'Falha', tone: 'risk', value: combat.failure }
        : automation && automation.kind !== 'passiva'
          ? {
              label: 'Falha',
              tone: 'risk',
              value: 'Nao cadastrada; Mestre decide antes de resolver.',
            }
          : null,
      combat.risk ? { label: 'Risco', tone: 'risk', value: combat.risk } : null,
    ].filter(
      (
        fact,
      ): fact is { label: string; tone: string; value: string } => Boolean(fact),
    )

    return (
      <details
        className="sheet-view__compact-detail sheet-action-card"
        data-character-feature-id={feature.id}
      >
        <summary className="sheet-view__compact-summary">
          <div className="sheet-view__compact-heading sheet-action-card__heading">
            <div>
              <span className="sheet-action-card__kind">{kindLabel}</span>
              <h3>{feature.nome}</h3>
            </div>
            {canActivate ? (
              <button
                className="button button--primary sheet-action-card__activate"
                disabled={isActiveCombatEffect}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onActivateFeature?.({
                    character: workingCharacter,
                    checkOptionId: selectedCheckOptionId,
                    feature,
                    source,
                  })
                }}
                type="button"
              >
                {isActiveCombatEffect ? 'Ativa' : commandLabel}
              </button>
            ) : (
              <span className="tag">Consulta</span>
            )}
          </div>
          <div className="sheet-action-card__summary-row">
            {requirementChips.map((chip) => (
              <span
                className={`sheet-action-card__chip sheet-action-card__chip--${chip.tone}`}
                key={`${feature.id}-${chip.tone}-${chip.label}`}
              >
                {chip.label}
              </span>
            ))}
            {isActiveCombatEffect ? (
              <span className="sheet-action-card__chip sheet-action-card__chip--effect">
                Ativa ate o proximo ataque
              </span>
            ) : null}
            {rollLabel ? (
              <span className="sheet-action-card__chip sheet-action-card__chip--roll">
                {rollLabel}
              </span>
            ) : null}
            {effectLabel ? (
              <span className="sheet-action-card__chip sheet-action-card__chip--effect">
                {effectLabel}
              </span>
            ) : null}
          </div>
          {combatFacts.length > 0 ? (
            <dl className="sheet-action-card__combat-facts">
              {combatFacts.map((fact) => (
                <div
                  className={`sheet-action-card__combat-fact sheet-action-card__combat-fact--${fact.tone}`}
                  key={`${feature.id}-${fact.label}-${fact.value}`}
                >
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </summary>

        <div className="sheet-view__compact-body">
          {checkOptions.length > 1 ? (
            <label className="field sheet-action-card__check-option">
              <span>Forma do ataque</span>
              <select
                className="field__input"
                onChange={(event) =>
                  setCheckOptionByFeature((current) => ({
                    ...current,
                    [feature.id]: event.target.value,
                  }))
                }
                value={selectedCheckOptionId}
              >
                {checkOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {tags.length > 0 ? (
            <div className="tag-row">
              {tags.map((tag) => (
                <span className="tag" key={`${feature.id}-${tag}`}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <p className="support-copy">
            {feature.descricao || 'Sem descricao cadastrada.'}
          </p>
        </div>
      </details>
    )
  }

  const rootClassName = `sheet-view${editable ? ' sheet-view--editable' : ''}${
    isMobSheet ? ' sheet-view--mob' : ''
  }${
    className ? ` ${className}` : ''
  }`

  return (
    <article className={rootClassName} ref={rootRef}>
      <section className="sheet-view__left">
        <header className="sheet-view__identity">
          <div className="sheet-view__portrait-stack">
            {editable ? (
              <LocalImageInput
                aspect="square"
                label="Avatar"
                onChange={(nextValue) =>
                  updateCharacter({
                    avatarUrl: nextValue,
                    tokenImageUrl: nextValue,
                  })
                }
                value={editableCharacter.avatarUrl || editableCharacter.tokenImageUrl}
              />
            ) : model.avatarUrl || model.tokenImageUrl ? (
              <>
                {model.avatarUrl && onPreviewImage ? (
                  <button
                    className="sheet-view__portrait-button"
                    onClick={() => onPreviewImage(model.avatarUrl!, model.nome)}
                    title="Ampliar imagem"
                    type="button"
                  >
                    <img
                      alt={`Avatar de ${model.nome}`}
                      className="sheet-view__portrait"
                      src={resolveRuntimeAssetUrl(model.avatarUrl)}
                    />
                  </button>
                ) : model.avatarUrl ? (
                  <img
                    alt={`Avatar de ${model.nome}`}
                    className="sheet-view__portrait"
                    src={resolveRuntimeAssetUrl(model.avatarUrl)}
                  />
                ) : model.tokenImageUrl ? (
                  <img
                    alt={`Token de ${model.nome}`}
                    className="sheet-view__portrait"
                    src={resolveRuntimeAssetUrl(model.tokenImageUrl)}
                  />
                ) : null}
                {model.avatarUrl && canBroadcastImage && onBroadcastImage ? (
                  <button
                    className="button sheet-view__image-action"
                    onClick={() => onBroadcastImage(model.avatarUrl!, model.nome)}
                    type="button"
                  >
                    Mostrar players
                  </button>
                ) : null}
              </>
            ) : (
              <div className="sheet-view__portrait sheet-view__portrait--placeholder">
                {buildInitials(model.nome)}
              </div>
            )}
          </div>

          <div className="sheet-view__identity-grid">
            <label className="sheet-view__field">
              <span className="sheet-view__label">Personagem</span>
              {editable ? (
                <input
                  className="sheet-view__input"
                  onChange={(event) =>
                    updateCharacter({ nome: event.target.value })
                  }
                  type="text"
                  value={editableCharacter.nome}
                />
              ) : (
                <strong>{model.nome}</strong>
              )}
            </label>

            <label className="sheet-view__field">
              <span className="sheet-view__label">Jogador</span>
              {editable ? (
                <input
                  className="sheet-view__input"
                  onChange={(event) =>
                    updateCharacter({ jogador: event.target.value })
                  }
                  type="text"
                  value={editableCharacter.jogador ?? ''}
                />
              ) : (
                <strong>{model.jogador}</strong>
              )}
            </label>

            <label className="sheet-view__field">
              <span className="sheet-view__label">Origem</span>
              {editable ? (
                <input
                  className="sheet-view__input"
                  onChange={(event) =>
                    updateCharacter({ origem: event.target.value })
                  }
                  type="text"
                  value={editableCharacter.origem ?? ''}
                />
              ) : (
                <strong>{model.origem}</strong>
              )}
            </label>

            <label className="sheet-view__field">
              <span className="sheet-view__label">Classe</span>
              {editable ? (
                <input
                  className="sheet-view__input"
                  onChange={(event) =>
                    updateCharacter({ classe: event.target.value })
                  }
                  type="text"
                  value={editableCharacter.classe ?? ''}
                />
              ) : (
                <strong>{model.classe}</strong>
              )}
            </label>

            <label className="sheet-view__field">
              <span className="sheet-view__label">Tipo</span>
              {editable ? (
                <select
                  className="sheet-view__input"
                  onChange={(event) =>
                    updateCharacter({
                      tipo:
                        event.target.value === 'npc' || event.target.value === 'mob'
                          ? event.target.value
                          : 'player',
                    })
                  }
                  value={editableCharacter.tipo}
                >
                  <option value="player">Jogador</option>
                  <option value="npc">NPC</option>
                  <option value="mob">Mob</option>
                </select>
              ) : (
                <strong>
                  {model.tipo === 'player' ? 'Jogador' : model.tipo === 'mob' ? 'Mob' : 'NPC'}
                </strong>
              )}
            </label>

            <label className="sheet-view__field">
              <span className="sheet-view__label">Faccao</span>
              {editable && factions ? (
                <select
                  className="sheet-view__input"
                  onChange={(event) =>
                    updateCharacter({ faccao: event.target.value })
                  }
                  value={editableCharacter.faccao}
                >
                  {factions.map((faction) => (
                    <option key={faction.id} value={faction.id}>
                      {faction.nome}
                    </option>
                  ))}
                </select>
              ) : (
                <strong>{factionName}</strong>
              )}
            </label>

            <label className="sheet-view__field">
              <span className="sheet-view__label">Nivel</span>
              {editable ? (
                <input
                  className="sheet-view__input"
                  onChange={(event) =>
                    updateCharacter({
                      nivel: parseNumberValue(event.target.value, 1),
                    })
                  }
                  type="number"
                  value={editableCharacter.nivel ?? 1}
                />
              ) : (
                <strong>{model.nivel}</strong>
              )}
            </label>

            <label className="sheet-view__field">
              <span className="sheet-view__label">Local</span>
              {editable ? (
                <input
                  className="sheet-view__input"
                  onChange={(event) =>
                    updateCharacter({ localAtual: event.target.value })
                  }
                  type="text"
                  value={editableCharacter.localAtual}
                />
              ) : (
                <strong>{model.localAtual}</strong>
              )}
            </label>
          </div>
        </header>

        <section className="sheet-view__attribute-panel">
          <div className="sheet-view__attribute-core">
            <img alt="" src={resolveRuntimeAssetUrl('/assets/ui/fushi-sigil.svg')} />
            <span>Atributos</span>
          </div>
          {attributeEntries.map((attribute, index) => (
            <article
              className={`sheet-view__attribute-orb sheet-view__attribute-orb--${index + 1}`}
              key={attribute.id}
            >
              {editable ? (
                <input
                  className="sheet-view__attribute-input"
                  onChange={(event) =>
                    updateAttribute(
                      attribute.id,
                      parseNumberValue(event.target.value),
                    )
                  }
                  type="number"
                  value={attribute.value}
                />
              ) : (
                <strong>{attribute.value}</strong>
              )}
              <span>{attribute.label}</span>
            </article>
          ))}
        </section>

        <div className="sheet-view__resource-stack">
          {[
            {
              key: 'vida',
              currentKey: 'vidaAtual',
              maxKey: 'vidaMaxima',
              label: 'Vida',
              buildStat: 'life',
              className: 'sheet-view__resource-card--life',
            },
            {
              key: 'fushi',
              currentKey: 'fushiAtual',
              maxKey: 'fushiMaximo',
              label: 'FUSHI',
              buildStat: 'fushi',
              className: 'sheet-view__resource-card--fushi',
            },
            {
              key: 'determinacao',
              currentKey: 'determinacaoAtual',
              maxKey: 'determinacaoMaxima',
              label: 'Determinacao',
              buildStat: 'determination',
              className: 'sheet-view__resource-card--det',
            },
          ].map((resource) => {
            const currentKey = resource.currentKey as keyof CharacterSheet['recursos']
            const maxKey = resource.maxKey as keyof CharacterSheet['recursos']
            const currentValue = model.recursos[currentKey]
            const maxValue = model.recursos[maxKey]
            const fillPercent =
              maxValue > 0 ? Math.max(0, Math.min(100, (currentValue / maxValue) * 100)) : 0
            const resourceStyle = {
              '--resource-fill': `${fillPercent}%`,
            } as CSSProperties
            const canUseQuickResource =
              !editable && allowQuickResourceEdit && Boolean(onChange)
            const buildDelta = characterBuild?.totals?.[
              resource.buildStat as 'life' | 'fushi' | 'determination'
            ] ?? 0

            return (
              <article
                className={`sheet-view__resource-card ${resource.className}`}
                key={resource.key}
                style={resourceStyle}
              >
                <span>{resource.label}</span>
                {buildDelta !== 0 ? (
                  <small
                    className={`sheet-view__resource-build-delta ${
                      buildDelta > 0 ? 'is-positive' : 'is-negative'
                    }`}
                  >
                    Build {buildDelta > 0 ? '+' : ''}{buildDelta}
                  </small>
                ) : null}
                {editable ? (
                  <div className="sheet-view__resource-edit-block">
                    <div className="sheet-view__resource-editor">
                      <button
                        className="sheet-view__stepper"
                        onClick={() => adjustResource(currentKey, -1)}
                        type="button"
                      >
                        -
                      </button>
                      <input
                        aria-label={`${resource.label} base atual`}
                        className="sheet-view__resource-input"
                        onChange={(event) =>
                          updateResource(currentKey, parseNumberValue(event.target.value))
                        }
                        type="number"
                        value={editableBaseResources[currentKey]}
                      />
                      <span>/</span>
                      <input
                        aria-label={`${resource.label} base maxima`}
                        className="sheet-view__resource-input"
                        onChange={(event) =>
                          updateResource(maxKey, parseNumberValue(event.target.value))
                        }
                        type="number"
                        value={editableBaseResources[maxKey]}
                      />
                      <button
                        className="sheet-view__stepper"
                        onClick={() => adjustResource(currentKey, 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    {characterBuild ? (
                      <small className="sheet-view__resource-effective">
                        Base acima | efetivo {currentValue}/{maxValue}
                      </small>
                    ) : null}
                  </div>
                ) : canUseQuickResource ? (
                  <div className="sheet-view__resource-editor sheet-view__resource-editor--quick">
                    <button
                      className="sheet-view__stepper"
                      onClick={() => adjustResource(currentKey, -1, { allowReadMode: true })}
                      type="button"
                    >
                      -
                    </button>
                    <strong>
                      {currentValue}/{maxValue}
                    </strong>
                    <button
                      className="sheet-view__stepper"
                      onClick={() => adjustResource(currentKey, 1, { allowReadMode: true })}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <strong>
                    {currentValue}/{maxValue}
                  </strong>
                )}
              </article>
            )
          })}
        </div>

        <div className="sheet-view__defense-grid">
          <article className="sheet-view__defense-card">
            <span>Classe de Armadura</span>
            {editable ? (
              <input
                className="sheet-view__defense-input"
                onChange={(event) =>
                  updateCharacter(
                    updateCharacterBuildBaseDefense(
                      editableCharacter,
                      parseNumberValue(event.target.value),
                    ),
                  )
                }
                type="number"
                value={editableBuildBaseline.defesa}
              />
            ) : (
              <strong>{model.defesa}</strong>
            )}
            {characterBuild?.totals.ca ? (
              <small className={characterBuild.totals.ca > 0 ? 'is-positive' : 'is-negative'}>
                Build {characterBuild.totals.ca > 0 ? '+' : ''}{characterBuild.totals.ca}
              </small>
            ) : null}
            <small>Alvo passivo do ataque.</small>
          </article>
          <article className="sheet-view__defense-card">
            <span>Bloqueio V2</span>
            <strong>{combatBlockValue}</strong>
            {characterBuild?.totals.block ? (
              <small className={characterBuild.totals.block > 0 ? 'is-positive' : 'is-negative'}>
                Build {characterBuild.totals.block > 0 ? '+' : ''}{characterBuild.totals.block}
              </small>
            ) : null}
            <small>Fortitude, teto 15.</small>
          </article>
          <article className="sheet-view__defense-card">
            <span>Esquiva V2</span>
            <strong>{combatDodgeValue ?? '--'}</strong>
            <small>{combatDodgeSummary}</small>
          </article>
        </div>

        {characterBuild && buildItems.length > 0 ? (
          <section
            className="sheet-view__build-summary"
            style={
              {
                '--build-accent': buildPresentation.color,
                '--build-rarity': buildRarityColor ?? '#aeb9b5',
              } as CSSProperties
            }
          >
            <header>
              <div>
                <span>Build absorvida</span>
                <strong>{buildPresentation.label}</strong>
              </div>
              <div className="sheet-view__build-item">
                <strong>{buildItems.length} item(ns)</strong>
                <span>Ressonancia dominante</span>
              </div>
            </header>
            <div className="sheet-view__build-modifiers">
              {buildModifiers.map((modifier) => (
                <span
                  className={modifier.value > 0 ? 'is-positive' : 'is-negative'}
                  key={modifier.key}
                >
                  {modifier.value > 0 ? '+' : ''}{modifier.value} {modifier.label}
                </span>
              ))}
            </div>
            <p>Abra <b>Build Absorvida</b> para consultar raridades e passivas.</p>
          </section>
        ) : null}

        <div className="sheet-view__meta-list">
          <label className="sheet-view__field">
            <span className="sheet-view__label">Protecao</span>
            {editable ? (
              <input
                className="sheet-view__input"
                onChange={(event) =>
                  updateCharacter({ protecao: event.target.value })
                }
                type="text"
                value={editableCharacter.protecao ?? ''}
              />
            ) : (
              <strong>{model.protecao}</strong>
            )}
          </label>

          <label className="sheet-view__field">
            <span className="sheet-view__label">Resistencia</span>
            {editable ? (
              <input
                className="sheet-view__input"
                onChange={(event) =>
                  updateCharacter({ resistencia: event.target.value })
                }
                type="text"
                value={editableCharacter.resistencia ?? ''}
              />
            ) : (
              <strong>{model.resistencia}</strong>
            )}
          </label>

          <label className="sheet-view__field">
            <span className="sheet-view__label">Proeficiencias</span>
            {editable ? (
              <textarea
                className="sheet-view__input sheet-view__input--textarea sheet-view__input--compact"
                onChange={(event) =>
                  updateCharacter({
                    proficiencias: event.target.value
                      .split('\n')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
                value={editableCharacter.proficiencias?.join('\n') ?? ''}
              />
            ) : (
              <strong>
                {model.proficiencias.length > 0
                  ? model.proficiencias.join(', ')
                  : 'Sem proeficiencias'}
              </strong>
            )}
          </label>

          <label className="sheet-view__field">
            <span className="sheet-view__label">Deslocamento</span>
            {editable ? (
              <input
                className="sheet-view__input"
                onChange={(event) =>
                  updateCharacter(
                    updateCharacterBuildBaseMovement(
                      editableCharacter,
                      event.target.value,
                    ),
                  )
                }
                type="text"
                value={editableBuildBaseline.deslocamento ?? ''}
              />
            ) : (
              <strong>
                {inventorySummary.movementPenaltyMeters > 0
                  ? formatInventoryMovement(inventorySummary)
                  : model.deslocamento}
              </strong>
            )}
          </label>
        </div>
      </section>

      {isMobSheet ? (
        <section className="sheet-view__middle sheet-view__middle--mob">
          <div className="sheet-view__section-header">
            <div>
              <p className="eyebrow">Mob</p>
              <h3>Ficha compacta</h3>
            </div>
          </div>

          <div className="sheet-view__content-list">
            <article className="sheet-view__detail-card">
              <div className="tag-row">
                <span className="tag">{workingCharacter.faccao || factionName}</span>
                <span className="tag">{workingCharacter.localAtual}</span>
                <span className="tag">
                  {inventorySummary.movementPenaltyMeters > 0
                    ? formatInventoryMovement(inventorySummary)
                    : workingCharacter.deslocamento}
                </span>
              </div>
              <p className="support-copy">
                {workingCharacter.notas || 'Criatura simples: atributos, recursos e ataques principais.'}
              </p>
            </article>
            <article className="sheet-view__detail-card">
              <div className="sheet-view__compact-heading">
                <strong>Ataques ativos</strong>
                <span className="tag">{workingCharacter.ataques.length}</span>
              </div>
              <div className="tag-row">
                {workingCharacter.ataques.slice(0, 4).map((attack) => (
                  <span className="tag" key={attack.id}>
                    {attack.nome}
                  </span>
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : (
        <section className="sheet-view__middle">
          <div className="sheet-view__section-header">
            <div>
              <p className="eyebrow">Pericias</p>
              <h3>Lista geral com treino</h3>
            </div>
          </div>

          <div className="sheet-view__skill-list sheet-view__skill-list--dense">
            {workingCharacter.pericias.length > 0 ? (
              workingCharacter.pericias.map((skill, index) => (
                <article className="sheet-view__skill-row sheet-view__skill-row--catalog" key={skill.id}>
                  <div className="sheet-view__skill-main">
                    <strong>{skill.nome}</strong>
                    <span className="sheet-view__skill-attribute">
                      {formatAttributeLabel(skill.atributoBase)}
                    </span>
                  </div>

                  <div className="sheet-view__skill-values">
                    <span className="sheet-view__skill-train-label">Treino</span>
                    {editable ? (
                      <input
                        className="sheet-view__skill-train-input"
                        onChange={(event) =>
                          updateSkill(index, {
                            bonusPericia: parseNumberValue(event.target.value),
                          })
                        }
                        type="number"
                        value={editableCharacter.pericias[index]?.bonusPericia ?? 0}
                      />
                    ) : (
                      <strong className="sheet-view__skill-train-value">
                        +{skill.bonusPericia}
                      </strong>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <article className="sheet-view__detail-card">
                <p className="support-copy">Nenhuma pericia cadastrada.</p>
              </article>
            )}
          </div>
        </section>
      )}

      <section className="sheet-view__right">
        <div className="sheet-view__tabs">
              {visibleSheetTabs.map((tab) => (
            <button
              className={`sheet-view__tab${
                renderedActiveTab === tab.id ? ' sheet-view__tab--active' : ''
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {renderedActiveTab === 'combate' ? (
          <div className="sheet-view__content-list">
            {workingCharacter.ataques.length > 0 ? (
              workingCharacter.ataques.map((attack, index) => (
                <article className="sheet-view__detail-card" key={attack.id}>
                  {editable ? (
                    <div className="sheet-view__edit-grid">
                      <input
                        className="sheet-view__input"
                        onChange={(event) =>
                          updateAttack(index, { nome: event.target.value })
                        }
                        placeholder="Nome do ataque"
                        type="text"
                        value={editableCharacter.ataques[index]?.nome ?? ''}
                      />
                      <select
                        className="sheet-view__input"
                        onChange={(event) =>
                          updateAttack(index, {
                            atributoBase: event.target.value as AttributeKey,
                          })
                        }
                        value={editableCharacter.ataques[index]?.atributoBase ?? 'forca'}
                      >
                        {attributeOptions.map((attribute) => (
                          <option key={attribute} value={attribute}>
                            {formatAttributeLabel(attribute)}
                          </option>
                        ))}
                      </select>
                      <input
                        className="sheet-view__input"
                        onChange={(event) =>
                          updateAttack(index, {
                            bonusPericia: parseNumberValue(event.target.value),
                          })
                        }
                        placeholder="Bonus"
                        type="number"
                        value={editableCharacter.ataques[index]?.bonusPericia ?? 0}
                      />
                      <input
                        className="sheet-view__input"
                        onChange={(event) =>
                          updateAttack(index, { dano: event.target.value })
                        }
                        placeholder="Dano"
                        type="text"
                        value={editableCharacter.ataques[index]?.dano ?? ''}
                      />
                      <input
                        className="sheet-view__input"
                        onChange={(event) =>
                          updateAttack(index, { alcance: event.target.value })
                        }
                        placeholder="Alcance"
                        type="text"
                        value={editableCharacter.ataques[index]?.alcance ?? ''}
                      />
                      <textarea
                        className="sheet-view__input sheet-view__input--textarea sheet-view__input--compact"
                        onChange={(event) =>
                          updateAttack(index, { resumo: event.target.value })
                        }
                        placeholder="Resumo"
                        value={editableCharacter.ataques[index]?.resumo ?? ''}
                      />
                      {renderCombatAutomationEditor(
                        {
                          automation: editableCharacter.ataques[index]?.automation,
                          descricao: editableCharacter.ataques[index]?.resumo ?? '',
                          id: editableCharacter.ataques[index]?.id ?? buildId('attack'),
                          nome: editableCharacter.ataques[index]?.nome ?? '',
                          tipo: 'ataque',
                        },
                        'ataque',
                        (nextFeature) =>
                          updateAttack(index, { automation: nextFeature.automation }),
                      )}
                      <button
                        className="button"
                        onClick={() =>
                          updateCharacter({
                            ataques: editableCharacter.ataques.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          })
                        }
                        type="button"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    renderFeatureActionCard(
                      buildAttackActionFeature(workingCharacter, attack),
                      'ataque',
                    )
                  )}
                </article>
              ))
            ) : (
              <article className="sheet-view__detail-card">
                <p className="support-copy">Nenhum ataque cadastrado.</p>
              </article>
            )}

            {editable ? (
              <button
                className="button"
                onClick={() =>
                  updateCharacter({
                    ataques: [
                      ...editableCharacter.ataques,
                      {
                        id: buildId('attack'),
                        nome: '',
                        atributoBase: 'forca',
                        bonusPericia: 0,
                        dano: '',
                        alcance: '',
                        resumo: '',
                        automation: createDefaultCombatAutomation('ataque', 'forca'),
                      },
                    ],
                  })
                }
                type="button"
              >
                Adicionar ataque
              </button>
            ) : null}
          </div>
        ) : null}

        {renderedActiveTab === 'habilidades' ? (
          <div className="sheet-view__content-list">
            {workingFeatures.length > 0 ? (
              workingFeatures.map((feature, index) => (
                <article className="sheet-view__detail-card" key={feature.id}>
                  {editable ? (
                    <div className="sheet-view__edit-grid">
                      <input
                        className="sheet-view__input"
                        onChange={(event) =>
                          updateFeatureList(
                            'habilidadesDetalhadas',
                            editableFeatures.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, nome: event.target.value }
                                  : item,
                            ),
                          )
                        }
                        placeholder="Nome da habilidade"
                        type="text"
                        value={
                          editableFeatures[index]?.nome ?? ''
                        }
                      />
                      <textarea
                        className="sheet-view__input sheet-view__input--textarea"
                        onChange={(event) =>
                          updateFeatureList(
                            'habilidadesDetalhadas',
                            editableFeatures.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, descricao: event.target.value }
                                  : item,
                            ),
                          )
                        }
                        placeholder="Descricao"
                        value={
                          editableFeatures[index]?.descricao ?? ''
                        }
                      />
                      {renderCombatAutomationEditor(
                        editableFeatures[index] ?? feature,
                        'tecnica',
                        (nextFeature) =>
                          updateFeatureList(
                            'habilidadesDetalhadas',
                            editableFeatures.map((item, itemIndex) =>
                              itemIndex === index ? nextFeature : item,
                            ),
                          ),
                      )}
                      <button
                        className="button"
                        onClick={() =>
                          updateFeatureList(
                            'habilidadesDetalhadas',
                            editableFeatures.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                        type="button"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    renderFeatureActionCard(feature, 'habilidade')
                  )}
                </article>
              ))
            ) : (
              <article className="sheet-view__detail-card">
                <p className="support-copy">Nenhuma habilidade cadastrada.</p>
              </article>
            )}

            {editable ? (
              <button
                className="button"
                onClick={() =>
                  updateFeatureList('habilidadesDetalhadas', [
                    ...editableFeatures,
                    {
                      id: buildId('skill-feature'),
                      nome: '',
                      descricao: '',
                      automation: createDefaultCombatAutomation('tecnica', 'intelecto'),
                      tipo: 'tecnica',
                    },
                  ])
                }
                type="button"
              >
                Adicionar habilidade
              </button>
            ) : null}
          </div>
        ) : null}

        {renderedActiveTab === 'rituais' ? (
          <div className="sheet-view__content-list">
            {workingRituals.length > 0 ? (
              workingRituals.map((ritual, index) => (
                <article className="sheet-view__detail-card" key={ritual.id}>
                  {editable ? (
                    <div className="sheet-view__edit-grid">
                      <input
                        className="sheet-view__input"
                        onChange={(event) =>
                          updateFeatureList(
                            'rituais',
                            editableRituals.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, nome: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Nome do ritual"
                        type="text"
                        value={editableRituals[index]?.nome ?? ''}
                      />
                      <textarea
                        className="sheet-view__input sheet-view__input--textarea"
                        onChange={(event) =>
                          updateFeatureList(
                            'rituais',
                            editableRituals.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, descricao: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Descricao"
                        value={editableRituals[index]?.descricao ?? ''}
                      />
                      {renderCombatAutomationEditor(
                        editableRituals[index] ?? ritual,
                        'ritual',
                        (nextFeature) =>
                          updateFeatureList(
                            'rituais',
                            editableRituals.map((item, itemIndex) =>
                              itemIndex === index ? nextFeature : item,
                            ),
                          ),
                      )}
                      <button
                        className="button"
                        onClick={() =>
                          updateFeatureList(
                            'rituais',
                            editableRituals.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                        type="button"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    renderFeatureActionCard(ritual, 'ritual')
                  )}
                </article>
              ))
            ) : (
              <article className="sheet-view__detail-card">
                <p className="support-copy">Nenhum ritual cadastrado.</p>
              </article>
            )}

            {editable ? (
              <button
                className="button"
                onClick={() =>
                  updateFeatureList('rituais', [
                    ...editableRituals,
                    {
                      id: buildId('ritual'),
                      nome: '',
                      descricao: '',
                      automation: createDefaultCombatAutomation('ritual', 'intelecto'),
                      tipo: 'ritual',
                    },
                  ])
                }
                type="button"
              >
                Adicionar ritual
              </button>
            ) : null}
          </div>
        ) : null}

        {renderedActiveTab === 'inventario' ? (
          <div className="sheet-view__content-list">
            <section
              className={`sheet-view__inventory-summary${
                inventorySummary.isOverCapacity
                  ? ' sheet-view__inventory-summary--warning'
                  : ''
              }`}
            >
              <header>
                <div>
                  <span className="eyebrow">Carga</span>
                  <h3>{inventorySummary.packLabel}</h3>
                </div>
                <span className="tag">
                  {formatInventoryCapacity(inventorySummary)}
                </span>
              </header>
              <div className="sheet-view__inventory-metrics">
                <span>
                  <strong>Deslocamento efetivo</strong>
                  {formatInventoryMovement(inventorySummary)}
                </span>
                <span>
                  <strong>Capacidade base</strong>
                  3 medios / 9 pequenos
                </span>
                {inventorySummary.largePlusCount > 0 ? (
                  <span>
                    <strong>Grande+</strong>
                    {inventorySummary.largePlusCount} ativo(s); medio e grande
                    bloqueados
                  </span>
                ) : null}
              </div>
              {editable ? (
                <label className="field">
                  <span className="field__label">Mochila equipada</span>
                  <select
                    className="sheet-view__input"
                    onChange={(event) =>
                      updateInventoryPack(event.target.value as InventoryPackType)
                    }
                    value={editableCharacter.inventarioPerfil?.mochila ?? 'nenhuma'}
                  >
                    <option value="nenhuma">Sem mochila</option>
                    <option value="mochila">Mochila normal (+3 medios)</option>
                    <option value="mochila_plus">Mochila+</option>
                  </select>
                </label>
              ) : null}
              {inventorySummary.warnings.length > 0 ? (
                <div className="sheet-view__inventory-warnings" role="status">
                  {inventorySummary.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : (
                <p className="support-copy">
                  Carga valida. Nenhuma penalidade oculta.
                </p>
              )}
            </section>
            {workingInventory.length > 0 ? (
              workingInventory.map((item, index) => (
                <article className="sheet-view__inventory-card" key={item.id}>
                  <div className="sheet-view__inventory-media">
                    {editable ? (
                      <LocalImageInput
                        aspect="item"
                        label="Item"
                        onChange={(nextValue) =>
                          updateInventory(
                            editableInventory.map(
                              (currentItem, itemIndex) =>
                                itemIndex === index
                                  ? { ...currentItem, imagemUrl: nextValue }
                                  : currentItem,
                            ),
                          )
                        }
                        value={
                          editableInventory[index]?.imagemUrl ?? ''
                        }
                      />
                    ) : item.imagemUrl ? (
                      onPreviewImage ? (
                        <button
                          className="sheet-view__inventory-image-button"
                          onClick={() => onPreviewImage(item.imagemUrl!, item.nome)}
                          title="Ampliar imagem"
                          type="button"
                        >
                          <img
                            alt={item.nome}
                            className="sheet-view__inventory-image"
                            src={resolveRuntimeAssetUrl(item.imagemUrl)}
                          />
                        </button>
                      ) : (
                        <img
                          alt={item.nome}
                          className="sheet-view__inventory-image"
                          src={resolveRuntimeAssetUrl(item.imagemUrl)}
                        />
                      )
                    ) : (
                      <div className="sheet-view__inventory-image sheet-view__inventory-image--placeholder">
                        {buildInitials(item.nome)}
                      </div>
                    )}
                  </div>
                  <div className="sheet-view__inventory-copy">
                    {editable ? (
                      <>
                        <input
                          className="sheet-view__input"
                          onChange={(event) =>
                            updateInventory(
                              editableInventory.map(
                                (currentItem, itemIndex) =>
                                  itemIndex === index
                                    ? { ...currentItem, nome: event.target.value }
                                    : currentItem,
                              ),
                            )
                          }
                          placeholder="Nome do item"
                          type="text"
                          value={
                            editableInventory[index]?.nome ?? ''
                          }
                        />
                        <div className="sheet-view__inventory-editor-row">
                          <label className="field">
                            <span className="field__label">Porte</span>
                            <select
                              className="sheet-view__input"
                              onChange={(event) =>
                                updateInventory(
                                  editableInventory.map(
                                    (currentItem, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...currentItem,
                                            porte:
                                              event.target.value === ''
                                                ? undefined
                                                : (event.target.value as CharacterInventoryItem['porte']),
                                          }
                                        : currentItem,
                                  ),
                                )
                              }
                              value={editableInventory[index]?.porte ?? ''}
                            >
                              <option value="">Pendente (conta como medio)</option>
                              <option value="pequeno">Pequeno</option>
                              <option value="medio">Medio</option>
                              <option value="grande">Grande</option>
                              <option value="grande_plus">Grande+</option>
                            </select>
                          </label>
                          <label className="field">
                            <span className="field__label">Quantidade</span>
                            <input
                              className="sheet-view__input"
                              min="1"
                              onChange={(event) =>
                                updateInventory(
                                  editableInventory.map(
                                    (currentItem, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...currentItem,
                                            quantidade: Math.max(
                                              1,
                                              Number.parseInt(event.target.value, 10) || 1,
                                            ),
                                          }
                                        : currentItem,
                                  ),
                                )
                              }
                              type="number"
                              value={editableInventory[index]?.quantidade ?? 1}
                            />
                          </label>
                        </div>
                        <textarea
                          className="sheet-view__input sheet-view__input--textarea"
                          onChange={(event) =>
                            updateInventory(
                              editableInventory.map(
                                (currentItem, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...currentItem,
                                        descricao: event.target.value,
                                      }
                                    : currentItem,
                              ),
                            )
                          }
                          placeholder="Descricao"
                          value={
                            editableInventory[index]?.descricao ?? ''
                          }
                        />
                        <textarea
                          className="sheet-view__input sheet-view__input--textarea sheet-view__input--compact"
                          onChange={(event) =>
                            updateInventory(
                              editableInventory.map(
                                (currentItem, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...currentItem,
                                        efeitos: event.target.value
                                          .split('\n')
                                          .map((effect) => effect.trim())
                                          .filter(Boolean),
                                      }
                                    : currentItem,
                              ),
                            )
                          }
                          placeholder="Efeitos, um por linha"
                          value={
                            editableInventory[index]?.efeitos.join(
                              '\n',
                            ) ?? ''
                          }
                        />
                        <button
                          className="button"
                          onClick={() =>
                            updateInventory(
                              editableInventory.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                          type="button"
                        >
                          Remover
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="sheet-view__inventory-facts">
                          <span>{getInventoryItemSizeLabel(item.porte)}</span>
                          <span>{item.quantidade ?? 1} unidade(s)</span>
                        </div>
                        {renderFeatureActionCard(
                          buildInventoryItemActionFeature(workingCharacter, item),
                          'item',
                        )}
                      </>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <article className="sheet-view__detail-card">
                <p className="support-copy">Nenhum item cadastrado.</p>
              </article>
            )}

            {editable ? (
              <button
                className="button"
                onClick={() =>
                  updateInventory([
                    ...editableInventory,
                    {
                      id: buildId('inventory'),
                      nome: '',
                      descricao: '',
                      efeitos: [],
                      imagemUrl: '',
                      quantidade: 1,
                    },
                  ])
                }
                type="button"
              >
                Adicionar item
              </button>
            ) : null}
          </div>
        ) : null}

        {renderedActiveTab === 'efeitos' ? (
          <div className="sheet-view__content-list sheet-view__effects-list">
            <button
              className="sheet-view__effects-guide"
              onClick={() => onOpenStatusGuide?.()}
              title="Abrir guia de estados no Livro do Jogador"
              type="button"
            >
              <Info aria-hidden="true" size={17} />
              <span>Guia de estados</span>
            </button>
            <section className="sheet-view__effects-section">
              <header>
                <div>
                  <span className="eyebrow">Origem</span>
                  <h3>Seus efeitos</h3>
                </div>
                <span className="tag">{effectsAppliedByCharacter.length}</span>
              </header>
              {effectsAppliedByCharacter.length > 0 ? (
                effectsAppliedByCharacter.map((effect) => (
                  <article
                    className={`sheet-view__effect-card sheet-view__effect-card--${effect.kind}`}
                    key={`source-effect-${effect.id}`}
                    style={{ '--effect-color': effect.color } as CSSProperties}
                  >
                    <button
                      className="sheet-view__effect-icon"
                      onClick={() => onOpenStatusGuide?.(effect.statusId)}
                      title={
                        findTabletopStatusDefinition(effect.statusId ?? effect.label)
                          ?.label ?? effect.label
                      }
                      type="button"
                    >
                      <TabletopStatusIcon icon={effect.icon} size={21} />
                    </button>
                    <div className="sheet-view__effect-copy">
                      <span className="eyebrow">{effect.kind}</span>
                      <h3>{effect.label} &gt; {effect.targetName}</h3>
                      <p>{effect.description}</p>
                      {effect.stacks || effect.durationRounds ? (
                        <div className="sheet-view__effect-meta">
                          {effect.stacks ? (
                            <span className="tag">{effect.stacks} acumulo(s)</span>
                          ) : null}
                          {effect.durationRounds ? (
                            <span className="tag">
                              {effect.durationRounds} rodada(s)
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    {effect.canCancel && onCancelEffect ? (
                      <button
                        className="button button--danger sheet-view__effect-cancel"
                        onClick={() => onCancelEffect(effect.id)}
                        type="button"
                      >
                        Cancelar
                      </button>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="support-copy">Nenhum efeito aplicado por este personagem.</p>
              )}
            </section>

            <section className="sheet-view__effects-section">
              <header>
                <div>
                  <span className="eyebrow">Estado atual</span>
                  <h3>Efeitos aplicados em voce</h3>
                </div>
                <span className="tag">{effectsAppliedToCharacter.length}</span>
              </header>
              {effectsAppliedToCharacter.length > 0 ? (
                effectsAppliedToCharacter.map((effect) => (
                  <article
                    className={`sheet-view__effect-card sheet-view__effect-card--${effect.kind}`}
                    key={`target-effect-${effect.id}`}
                    style={{ '--effect-color': effect.color } as CSSProperties}
                  >
                    <button
                      className="sheet-view__effect-icon"
                      onClick={() => onOpenStatusGuide?.(effect.statusId)}
                      title={
                        findTabletopStatusDefinition(effect.statusId ?? effect.label)
                          ?.label ?? effect.label
                      }
                      type="button"
                    >
                      <TabletopStatusIcon icon={effect.icon} size={21} />
                    </button>
                    <div className="sheet-view__effect-copy">
                      <span className="eyebrow">{effect.kind}</span>
                      <h3>{effect.label} &gt; {effect.sourceName}</h3>
                      <p>{effect.description}</p>
                      {effect.stacks || effect.durationRounds ? (
                        <div className="sheet-view__effect-meta">
                          {effect.stacks ? (
                            <span className="tag">{effect.stacks} acumulo(s)</span>
                          ) : null}
                          {effect.durationRounds ? (
                            <span className="tag">
                              {effect.durationRounds} rodada(s)
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <p className="support-copy">Nenhum efeito aplicado neste personagem.</p>
              )}
            </section>
          </div>
        ) : null}

        {renderedActiveTab === 'build' ? (
          <div className="sheet-view__content-list sheet-view__build-list">
            {characterBuild && buildItems.length > 0 ? (
              <>
                <article className="sheet-view__detail-card sheet-view__build-overview">
                  <div>
                    <span className="eyebrow">Identidade dominante</span>
                    <h3 style={{ color: buildPresentation.color }}>
                      {buildPresentation.label}
                    </h3>
                  </div>
                  <div className="sheet-view__build-modifiers">
                    {buildModifiers.map((modifier) => (
                      <span
                        className={modifier.value > 0 ? 'is-positive' : 'is-negative'}
                        key={`build-total-${modifier.key}`}
                      >
                        {modifier.value > 0 ? '+' : ''}{modifier.value} {modifier.label}
                      </span>
                    ))}
                  </div>
                </article>
                {buildItems.map((item) => {
                  const itemModifiers = formatBuildModifiers(item.modifiers)
                  const rarityColor = item.rarity === 'secreto'
                    ? '#f08d88'
                    : ITEM_RARITY_META[item.rarity]?.color ?? '#aeb9b5'
                  return (
                    <article
                      className="sheet-view__detail-card sheet-view__absorbed-item"
                      key={item.catalogItemId}
                      style={{ '--build-rarity': rarityColor } as CSSProperties}
                    >
                      <header>
                        <div>
                          <span className="eyebrow">{item.rarityLabel}</span>
                          {editable ? (
                            <input
                              aria-label={`Renomear ${item.name}`}
                              className="sheet-view__input"
                              onChange={(event) =>
                                updateCharacter(
                                  renameCharacterBuildItem(
                                    editableCharacter,
                                    item.catalogItemId,
                                    event.target.value,
                                  ),
                                )
                              }
                              type="text"
                              value={item.name}
                            />
                          ) : (
                            <h3>{item.name}</h3>
                          )}
                        </div>
                        <span className="tag">R{item.potency}</span>
                      </header>
                      <div className="sheet-view__build-modifiers">
                        {itemModifiers.map((modifier) => (
                          <span
                            className={modifier.value > 0 ? 'is-positive' : 'is-negative'}
                            key={`${item.catalogItemId}-${modifier.key}`}
                          >
                            {modifier.value > 0 ? '+' : ''}{modifier.value} {modifier.label}
                          </span>
                        ))}
                      </div>
                      <p className="support-copy"><b>Passiva:</b> {item.passive}</p>
                    </article>
                  )
                })}
              </>
            ) : (
              <article className="sheet-view__detail-card">
                <p className="support-copy">Nenhum item foi absorvido por esta identidade.</p>
              </article>
            )}
          </div>
        ) : null}

        {renderedActiveTab === 'descricao' ? (
          <div className="sheet-view__content-list">
            {(
              [
                ['historia', 'Historia'],
                ['objetivo', 'Objetivo'],
                ['aparencia', 'Aparencia'],
                ['personalidade', 'Descricao'],
              ] as const
            ).map(([key, label]) => (
              <article className="sheet-view__detail-card" key={key}>
                <h3>{label}</h3>
                {editable ? (
                  <textarea
                    className="sheet-view__input sheet-view__input--textarea"
                    onChange={(event) =>
                      updateCharacter({
                        descricao: {
                          ...editableDescription,
                          [key]: event.target.value,
                        },
                      })
                    }
                    value={
                      editableDescription[key as keyof typeof editableDescription]
                    }
                  />
                ) : (
                  <p className="support-copy">
                    {model.descricao[
                      key as keyof typeof model.descricao
                    ] || `Sem ${label.toLowerCase()} cadastrada.`}
                  </p>
                )}
              </article>
            ))}

            {showSensitiveNotes ? (
              <article className="sheet-view__detail-card">
                <h3>Notas do mestre</h3>
                {editable ? (
                  <textarea
                    className="sheet-view__input sheet-view__input--textarea"
                    onChange={(event) =>
                      updateCharacter({ notas: event.target.value })
                    }
                    value={editableCharacter.notas}
                  />
                ) : (
                  <p className="support-copy">
                    {model.notas || 'Sem notas reservadas para mestre.'}
                  </p>
                )}
              </article>
            ) : null}
          </div>
        ) : null}
      </section>
    </article>
  )
}
