import { useMemo, useState, type CSSProperties } from 'react'
import type {
  AttributeKey,
  CharacterAttack,
  CharacterFeatureDetail,
  CharacterInventoryItem,
  CharacterSheet,
  CharacterSkill,
  FactionItem,
} from '../../data/types'
import {
  getCharacterSheetModel,
  prepareCharacterForEditing,
} from '../../lib/characterSheet'
import { formatAttributeLabel } from '../../lib/rolls'
import { LocalImageInput } from '../ui/LocalImageInput'

interface CharacterProfileCardProps {
  character: CharacterSheet
  factionName: string
  showSensitiveNotes: boolean
  editable?: boolean
  factions?: FactionItem[]
  onChange?: (nextCharacter: CharacterSheet) => void
  onPreviewImage?: (src: string, label: string) => void
  onBroadcastImage?: (src: string, label: string) => void
  canBroadcastImage?: boolean
  allowQuickResourceEdit?: boolean
  className?: string
}

type SheetTab = 'combate' | 'habilidades' | 'rituais' | 'inventario' | 'descricao'

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
  onPreviewImage,
  onBroadcastImage,
  canBroadcastImage = false,
  allowQuickResourceEdit = false,
  className,
}: CharacterProfileCardProps) {
  const [activeTab, setActiveTab] = useState<SheetTab>('combate')
  const model = useMemo(() => getCharacterSheetModel(character), [character])
  const editableCharacter = useMemo(
    () => prepareCharacterForEditing(character),
    [character],
  )
  const workingCharacter = editable ? editableCharacter : model
  const workingFeatures = workingCharacter.habilidadesDetalhadas ?? []
  const workingRituals = workingCharacter.rituais ?? []
  const workingInventory = workingCharacter.inventarioDetalhado ?? []
  const editableFeatures = editableCharacter.habilidadesDetalhadas ?? []
  const editableRituals = editableCharacter.rituais ?? []
  const editableInventory = editableCharacter.inventarioDetalhado ?? []
  const editableDescription = editableCharacter.descricao ?? {
    historia: '',
    objetivo: '',
    aparencia: '',
    personalidade: '',
  }

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

  const sheetTabs: Array<{ id: SheetTab; label: string }> = [
    { id: 'combate', label: 'Combate' },
    { id: 'habilidades', label: 'Habilidades' },
    { id: 'rituais', label: 'Rituais' },
    { id: 'inventario', label: 'Inventario' },
    { id: 'descricao', label: 'Descricao' },
  ]

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
    emit({
      ...editableCharacter,
      ...partialCharacter,
    }, options)
  }

  function updateAttribute(attribute: AttributeKey, nextValue: number) {
    updateCharacter({
      atributos: {
        ...editableCharacter.atributos,
        [attribute]: clampResourceValue(nextValue),
      },
    })
  }

  function updateResource(
    resourceKey: keyof CharacterSheet['recursos'],
    nextValue: number,
    options: { allowReadMode?: boolean } = {},
  ) {
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
    updateResource(
      resourceKey,
      editableCharacter.recursos[resourceKey] + delta,
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
    updateCharacter({
      [key]: nextItems,
    })
  }

  function updateInventory(nextItems: CharacterInventoryItem[]) {
    updateCharacter({
      inventarioDetalhado: nextItems,
    })
  }

  const rootClassName = `sheet-view${editable ? ' sheet-view--editable' : ''}${
    className ? ` ${className}` : ''
  }`

  return (
    <article className={rootClassName}>
      <section className="sheet-view__left">
        <header className="sheet-view__identity">
          <div className="sheet-view__portrait-stack">
            {editable ? (
              <LocalImageInput
                aspect="square"
                label="Avatar"
                onChange={(nextValue) => updateCharacter({ avatarUrl: nextValue })}
                value={editableCharacter.avatarUrl}
              />
            ) : model.avatarUrl ? (
              <>
                {onPreviewImage ? (
                  <button
                    className="sheet-view__portrait-button"
                    onClick={() => onPreviewImage(model.avatarUrl!, model.nome)}
                    title="Ampliar imagem"
                    type="button"
                  >
                    <img
                      alt={`Avatar de ${model.nome}`}
                      className="sheet-view__portrait"
                      src={model.avatarUrl}
                    />
                  </button>
                ) : (
                  <img
                    alt={`Avatar de ${model.nome}`}
                    className="sheet-view__portrait"
                    src={model.avatarUrl}
                  />
                )}
                {canBroadcastImage && onBroadcastImage ? (
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
                      tipo: event.target.value === 'npc' ? 'npc' : 'player',
                    })
                  }
                  value={editableCharacter.tipo}
                >
                  <option value="player">Jogador</option>
                  <option value="npc">NPC</option>
                </select>
              ) : (
                <strong>{model.tipo === 'player' ? 'Jogador' : 'NPC'}</strong>
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
          <div className="sheet-view__attribute-core">Atributos</div>
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
              className: 'sheet-view__resource-card--life',
            },
            {
              key: 'fushi',
              currentKey: 'fushiAtual',
              maxKey: 'fushiMaximo',
              label: 'FUSHI',
              className: 'sheet-view__resource-card--fushi',
            },
            {
              key: 'determinacao',
              currentKey: 'determinacaoAtual',
              maxKey: 'determinacaoMaxima',
              label: 'Determinacao',
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

            return (
              <article
                className={`sheet-view__resource-card ${resource.className}`}
                key={resource.key}
                style={resourceStyle}
              >
                <span>{resource.label}</span>
                {editable ? (
                  <div className="sheet-view__resource-editor">
                    <button
                      className="sheet-view__stepper"
                      onClick={() => adjustResource(currentKey, -1)}
                      type="button"
                    >
                      -
                    </button>
                    <input
                      className="sheet-view__resource-input"
                      onChange={(event) =>
                        updateResource(currentKey, parseNumberValue(event.target.value))
                      }
                      type="number"
                      value={editableCharacter.recursos[currentKey]}
                    />
                    <span>/</span>
                    <input
                      className="sheet-view__resource-input"
                      onChange={(event) =>
                        updateResource(maxKey, parseNumberValue(event.target.value))
                      }
                      type="number"
                      value={editableCharacter.recursos[maxKey]}
                    />
                    <button
                      className="sheet-view__stepper"
                      onClick={() => adjustResource(currentKey, 1)}
                      type="button"
                    >
                      +
                    </button>
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
          {(
            [
              ['defesa', 'Classe de Armadura'],
              ['bloqueio', 'Bloqueio'],
              ['esquiva', 'Esquiva'],
            ] as const
          ).map(([key, label]) => (
            <article className="sheet-view__defense-card" key={key}>
              <span>{label}</span>
              {editable ? (
                <input
                  className="sheet-view__defense-input"
                  onChange={(event) =>
                    updateCharacter({
                      [key]:
                        key === 'defesa'
                          ? parseNumberValue(event.target.value)
                          : parseNumberValue(event.target.value),
                    })
                  }
                  type="number"
                  value={
                    key === 'defesa'
                      ? editableCharacter.defesa
                      : key === 'bloqueio'
                        ? editableCharacter.bloqueio ?? 0
                        : editableCharacter.esquiva ?? 0
                  }
                />
              ) : (
                <strong>
                  {key === 'defesa'
                    ? model.defesa
                    : key === 'bloqueio'
                      ? model.bloqueio
                      : model.esquiva}
                </strong>
              )}
            </article>
          ))}
        </div>

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
                  updateCharacter({ deslocamento: event.target.value })
                }
                type="text"
                value={editableCharacter.deslocamento ?? ''}
              />
            ) : (
              <strong>{model.deslocamento}</strong>
            )}
          </label>
        </div>
      </section>

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

      <section className="sheet-view__right">
        <div className="sheet-view__tabs">
          {sheetTabs.map((tab) => (
            <button
              className={`sheet-view__tab${
                activeTab === tab.id ? ' sheet-view__tab--active' : ''
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'combate' ? (
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
                    <details className="sheet-view__compact-detail">
                      <summary className="sheet-view__compact-summary">
                        <div className="sheet-view__compact-heading">
                          <h3>{attack.nome}</h3>
                          <p className="support-copy">
                            {attack.dano} · {attack.alcance}
                          </p>
                        </div>
                      </summary>

                      <div className="sheet-view__compact-body">
                        <p className="support-copy">{attack.resumo}</p>
                        <div className="tag-row">
                          <span className="tag">
                            {formatAttributeLabel(attack.atributoBase)}
                          </span>
                          <span className="tag">+{attack.bonusPericia}</span>
                          <span className="tag">{attack.alcance}</span>
                        </div>
                      </div>
                    </details>
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

        {activeTab === 'habilidades' ? (
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
                    <details className="sheet-view__compact-detail">
                      <summary className="sheet-view__compact-summary">
                        <div className="sheet-view__compact-heading">
                          <h3>{feature.nome}</h3>
                        </div>
                      </summary>

                      <div className="sheet-view__compact-body">
                        <p className="support-copy">
                          {feature.descricao || 'Sem descricao cadastrada.'}
                        </p>
                      </div>
                    </details>
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

        {activeTab === 'rituais' ? (
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
                    <details className="sheet-view__compact-detail">
                      <summary className="sheet-view__compact-summary">
                        <div className="sheet-view__compact-heading">
                          <h3>{ritual.nome}</h3>
                        </div>
                      </summary>

                      <div className="sheet-view__compact-body">
                        <p className="support-copy">
                          {ritual.descricao || 'Sem descricao cadastrada.'}
                        </p>
                      </div>
                    </details>
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

        {activeTab === 'inventario' ? (
          <div className="sheet-view__content-list">
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
                            src={item.imagemUrl}
                          />
                        </button>
                      ) : (
                        <img
                          alt={item.nome}
                          className="sheet-view__inventory-image"
                          src={item.imagemUrl}
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
                      <details className="sheet-view__compact-detail">
                        <summary className="sheet-view__compact-summary">
                          <div className="sheet-view__compact-heading">
                            <h3>{item.nome}</h3>
                          </div>
                        </summary>

                        <div className="sheet-view__compact-body">
                          <p className="support-copy">
                            {item.descricao || 'Sem descricao cadastrada.'}
                          </p>
                          <div className="tag-row">
                            {item.efeitos.length > 0 ? (
                              item.efeitos.map((effect) => (
                                <span className="tag" key={effect}>
                                  {effect}
                                </span>
                              ))
                            ) : (
                              <span className="tag">Sem efeitos</span>
                            )}
                          </div>
                        </div>
                      </details>
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

        {activeTab === 'descricao' ? (
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
