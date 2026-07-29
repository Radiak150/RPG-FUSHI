import { useMemo, useState, type CSSProperties } from 'react'
import type {
  CharacterAttack,
  CharacterFeatureDetail,
  CharacterSheet,
} from '../../data/types'
import {
  BUILD_ARCHETYPES,
  emptyBuildModifiers,
  formatBuildModifiers,
  getBuildItems,
  ITEM_RARITY_META,
} from '../../data/combatCatalog'
import { buildAttackActionFeature } from '../../lib/characterActions'
import {
  getCombatBlockValue,
  getCombatDodgeSummary,
  resolveCombatAction,
} from '../../lib/combatV2'
import {
  formatInventoryMovement,
  getInventoryCapacitySummary,
} from '../../lib/inventoryCapacity'

type CharacterFilter = 'all' | 'mob' | 'npc' | 'player'

const FILTERS: Array<{ id: CharacterFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'player', label: 'Protagonistas' },
  { id: 'npc', label: 'NPCs' },
  { id: 'mob', label: 'Mobs' },
]

function typeLabel(character: CharacterSheet) {
  if (character.tipo === 'player') {
    return 'Protagonista'
  }

  if (character.tipo === 'mob') {
    return 'Mob'
  }

  return 'NPC'
}

function resourceText(current: number, maximum: number) {
  return current + '/' + maximum
}

function attackCombatSummary(character: CharacterSheet, attack: CharacterAttack) {
  const combat = resolveCombatAction(buildAttackActionFeature(character, attack))

  return [
    combat.test ? `Teste: ${combat.test}` : '',
    combat.damageFormula ? `Dano: ${combat.damageFormula}` : '',
    combat.reaction ? combat.reaction : '',
  ]
    .filter(Boolean)
    .join(' | ')
}

interface FeatureMetaEntry {
  label: string
  tone: 'cost' | 'damage' | 'effect' | 'risk' | 'test' | 'timing'
}

function featureMeta(feature: CharacterFeatureDetail): FeatureMetaEntry[] {
  const automation = feature.automation
  const combat = resolveCombatAction(feature)

  if (!automation) {
    return []
  }

  const actionLabel = combat.action === 'principal'
    ? 'Principal'
    : combat.action === 'curta'
      ? 'Curta'
      : combat.action === 'reacao'
        ? 'Reacao'
        : combat.action === 'movimento'
          ? 'Movimento'
          : 'Passiva'

  return [
    combat.action !== 'passiva'
      ? { tone: 'timing' as const, label: 'Acao: ' + actionLabel }
      : { tone: 'timing' as const, label: 'Passiva' },
    combat.test ? { tone: 'test' as const, label: 'Teste: ' + combat.test } : null,
    combat.damageFormula ? { tone: 'damage' as const, label: 'Dano: ' + combat.damageFormula } : null,
    combat.effect ? { tone: 'effect' as const, label: 'Efeito: ' + combat.effect } : null,
    combat.reaction ? { tone: 'effect' as const, label: 'Reacao: ' + combat.reaction } : null,
    combat.failure ? { tone: 'risk' as const, label: 'Falha: ' + combat.failure } : null,
    combat.risk ? { tone: 'risk' as const, label: 'Risco: ' + combat.risk } : null,
    automation.activation ? { tone: 'timing' as const, label: 'Ativacao: ' + automation.activation } : null,
    automation.range ? { tone: 'timing' as const, label: 'Alcance: ' + automation.range } : null,
    automation.duration ? { tone: 'timing' as const, label: 'Duracao: ' + automation.duration } : null,
    automation.limit ? { tone: 'risk' as const, label: 'Limite: ' + automation.limit } : null,
    ...(automation.costs ?? []).map(
      (cost) => ({
        tone: 'cost' as const,
        label: cost.amount + ' ' + (cost.label ?? cost.resource),
      }),
    ),
  ].filter((entry): entry is FeatureMetaEntry => Boolean(entry))
}

function BuildSummary({ character }: { character: CharacterSheet }) {
  const build = character.combatProfile?.build
  if (!build) return null

  const archetype = BUILD_ARCHETYPES.find((entry) => entry.id === build.archetype)
  const items = getBuildItems(build)
  const latestItem = items[items.length - 1]
  const modifiers = formatBuildModifiers(
    build.totals ?? build.item?.modifiers ?? emptyBuildModifiers(),
  )
  const rarityColor = latestItem?.rarity === 'secreto'
    ? '#f08d88'
    : latestItem
      ? ITEM_RARITY_META[latestItem.rarity]?.color
      : '#aeb9b5'

  return (
    <section
      className="rulebook-build-summary"
      style={{
        '--rulebook-build-accent': archetype?.color ?? '#74d6f2',
        '--rulebook-build-rarity': rarityColor ?? '#aeb9b5',
      } as CSSProperties}
    >
      <div>
        <span>Build {archetype?.label ?? build.archetype}</span>
        <strong>{items.length} item(ns) absorvido(s)</strong>
        <small>Ressonancia dominante</small>
      </div>
      <div className="rulebook-build-summary__modifiers">
        {modifiers.map((modifier) => (
          <span className={modifier.value > 0 ? 'is-positive' : 'is-negative'} key={modifier.key}>
            {modifier.value > 0 ? '+' : ''}{modifier.value} {modifier.label}
          </span>
        ))}
      </div>
      <p>
        <b>Itens:</b>{' '}
        {items
          .map((item) => `${item.name} (${item.rarityLabel} R${item.potency})`)
          .join(', ')}
      </p>
      <p>
        <b>Passiva:</b>{' '}
        {items.map((item) => `${item.name}: ${item.passive}`).join(' | ')}
      </p>
    </section>
  )
}

function FeatureList({
  emptyLabel,
  features,
  title,
}: {
  emptyLabel: string
  features: CharacterFeatureDetail[]
  title: string
}) {
  return (
    <section className="rulebook-compendium-section">
      <div className="rulebook-compendium-section__title">
        <h3>{title}</h3>
        <span>{features.length}</span>
      </div>
      {features.length > 0 ? (
        <div className="rulebook-feature-list">
          {features.map((feature) => {
            const metadata = featureMeta(feature)

            return (
              <details className="rulebook-feature" key={feature.id}>
                <summary>
                  <strong>{feature.nome}</strong>
                  <span>{feature.tipo ?? 'regra da ficha'}</span>
                </summary>
                {metadata.length > 0 ? (
                  <div className="tag-row">
                    {metadata.map((entry) => (
                      <span
                        className={`tag rulebook-feature__meta rulebook-feature__meta--${entry.tone}`}
                        key={`${entry.tone}-${entry.label}`}
                      >
                        {entry.label}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p>{feature.descricao}</p>
              </details>
            )
          })}
        </div>
      ) : (
        <p className="support-copy">{emptyLabel}</p>
      )}
    </section>
  )
}

export function RulebookCompendium({ characters }: { characters: CharacterSheet[] }) {
  const [filter, setFilter] = useState<CharacterFilter>('all')
  const [query, setQuery] = useState('')
  const campaignCharacters = useMemo(
    () =>
      characters
        .filter((character) => character.nome.trim().toLocaleLowerCase('pt-BR') !== 'teste')
        .sort((left, right) =>
          left.nome.localeCompare(right.nome, 'pt-BR', { sensitivity: 'base' }),
        ),
    [characters],
  )
  const visibleCharacters = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')

    return campaignCharacters.filter((character) => {
      if (filter !== 'all' && character.tipo !== filter) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return [
        character.nome,
        character.faccao,
        character.localAtual,
        character.origem ?? '',
        character.classe ?? '',
        character.combatRole ?? '',
        character.descricao?.historia ?? '',
        character.descricao?.objetivo ?? '',
        ...character.habilidades,
        ...(character.habilidadesDetalhadas ?? []).flatMap((feature) => [
          feature.nome,
          feature.descricao,
        ]),
        ...(character.rituais ?? []).flatMap((feature) => [
          feature.nome,
          feature.descricao,
        ]),
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(normalizedQuery)
    })
  }, [campaignCharacters, filter, query])
  const [selectedCharacterId, setSelectedCharacterId] = useState(
    visibleCharacters[0]?.id ?? '',
  )

  const selectedCharacter =
    visibleCharacters.find((character) => character.id === selectedCharacterId) ??
    visibleCharacters[0]
  const selectedInventorySummary = selectedCharacter
    ? getInventoryCapacitySummary(selectedCharacter)
    : null

  return (
    <div className="rulebook-compendium">
      <div className="rulebook-compendium-toolbar">
        <label className="rulebook-search rulebook-search--compact">
          <span>Buscar ficha</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, facção, local ou habilidade"
            type="search"
            value={query}
          />
        </label>
        <div aria-label="Filtrar compêndio" className="rulebook-segmented" role="group">
          {FILTERS.map((entry) => (
            <button
              aria-pressed={filter === entry.id}
              className={filter === entry.id ? 'rulebook-segmented__active' : ''}
              key={entry.id}
              onClick={() => setFilter(entry.id)}
              type="button"
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rulebook-compendium-layout">
        <aside className="rulebook-compendium-list">
          <p className="rulebook-compendium-count">
            {visibleCharacters.length} ficha(s) no workspace real
          </p>
          {visibleCharacters.map((character) => (
            <button
              className={
                'rulebook-character-button' +
                (character.id === selectedCharacter?.id
                  ? ' rulebook-character-button--active'
                  : '')
              }
              key={character.id}
              onClick={() => setSelectedCharacterId(character.id)}
              type="button"
            >
              {character.avatarUrl ? (
                <img alt="" src={character.avatarUrl} />
              ) : (
                <span className="rulebook-character-button__fallback">
                  {character.nome.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span>
                <strong>{character.nome}</strong>
                <small>
                  {typeLabel(character)} · {character.localAtual || 'Local não registrado'}
                </small>
              </span>
            </button>
          ))}
        </aside>

        {selectedCharacter ? (
          <article className="rulebook-character-sheet">
            <header className="rulebook-character-sheet__header">
              {selectedCharacter.avatarUrl ? (
                <img alt={selectedCharacter.nome} src={selectedCharacter.avatarUrl} />
              ) : null}
              <div>
                <p className="eyebrow">
                  {typeLabel(selectedCharacter)} · {selectedCharacter.faccao}
                </p>
                <h2>{selectedCharacter.nome}</h2>
                <p>{selectedCharacter.localAtual}</p>
                <div className="tag-row">
                  {selectedCharacter.nivel !== undefined ? (
                    <span className="tag">Nível {selectedCharacter.nivel}</span>
                  ) : null}
                  {selectedCharacter.combatRole ? (
                    <span className="tag">{selectedCharacter.combatRole}</span>
                  ) : null}
                  {selectedCharacter.classe ? (
                    <span className="tag">{selectedCharacter.classe}</span>
                  ) : null}
                </div>
              </div>
            </header>

            <div className="rulebook-stat-grid">
              <div>
                <span>Vida</span>
                <strong>
                  {resourceText(
                    selectedCharacter.recursos.vidaAtual,
                    selectedCharacter.recursos.vidaMaxima,
                  )}
                </strong>
              </div>
              <div>
                <span>FUSHI</span>
                <strong>
                  {resourceText(
                    selectedCharacter.recursos.fushiAtual,
                    selectedCharacter.recursos.fushiMaximo,
                  )}
                </strong>
              </div>
              <div>
                <span>Determinação</span>
                <strong>
                  {resourceText(
                    selectedCharacter.recursos.determinacaoAtual,
                    selectedCharacter.recursos.determinacaoMaxima,
                  )}
                </strong>
              </div>
              <div>
                <span>CA</span>
                <strong>{selectedCharacter.defesa}</strong>
              </div>
              <div>
                <span>Bloqueio</span>
                <strong>{getCombatBlockValue(selectedCharacter)}</strong>
              </div>
              <div>
                <span>Esquiva</span>
                <strong>Reacao</strong>
                <small>{getCombatDodgeSummary(selectedCharacter)}</small>
              </div>
              <div>
                <span>Deslocamento</span>
                <strong>
                  {selectedInventorySummary?.movementPenaltyMeters
                    ? formatInventoryMovement(selectedInventorySummary)
                    : selectedCharacter.deslocamento ?? '9 m'}
                </strong>
              </div>
            </div>

            <BuildSummary character={selectedCharacter} />

            <div className="rulebook-attribute-grid">
              {Object.entries(selectedCharacter.atributos).map(([attribute, value]) => (
                <div key={attribute}>
                  <span>{attribute}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            {selectedCharacter.descricao ? (
              <section className="rulebook-character-lore">
                {Object.entries(selectedCharacter.descricao).map(([label, value]) =>
                  value ? (
                    <div key={label}>
                      <h3>{label}</h3>
                      <p>{value}</p>
                    </div>
                  ) : null,
                )}
              </section>
            ) : null}

            <section className="rulebook-compendium-section">
              <div className="rulebook-compendium-section__title">
                <h3>Ataques</h3>
                <span>{selectedCharacter.ataques.length}</span>
              </div>
              {selectedCharacter.ataques.length > 0 ? (
                <div className="rulebook-attack-list">
                  {selectedCharacter.ataques.map((attack) => (
                    <article key={attack.id}>
                      <strong>{attack.nome}</strong>
                      <span>
                        {attack.atributoBase.toUpperCase()} + {attack.bonusPericia} ·{' '}
                        {attack.dano} · {attack.alcance}
                      </span>
                      <p>{attack.resumo}</p>
                      <small>{attackCombatSummary(selectedCharacter, attack)}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="support-copy">Nenhum ataque estruturado.</p>
              )}
            </section>

            <FeatureList
              emptyLabel="Nenhuma Habilidade detalhada."
              features={selectedCharacter.habilidadesDetalhadas ?? []}
              title="Habilidades"
            />
            <FeatureList
              emptyLabel="Nenhum Ritual detalhado."
              features={selectedCharacter.rituais ?? []}
              title="Rituais"
            />
          </article>
        ) : (
          <div className="rulebook-empty-search">
            Nenhuma ficha real corresponde a esta busca.
          </div>
        )}
      </div>
    </div>
  )
}
