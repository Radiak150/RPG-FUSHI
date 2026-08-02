import { useMemo, useState, type CSSProperties } from 'react'
import {
  Crosshair,
  HeartPulse,
  Shield,
  Sparkles,
  Swords,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react'
import {
  BUILD_ARCHETYPES,
  BUILD_ITEMS,
  BUILD_MODIFIER_LABELS,
  BUILD_SECRET_ITEMS,
  FUSHI_BUILD_CATALOG,
  ITEM_RARITY_META,
  formatBuildModifiers,
  getBuildItems,
  resolveBuildItemByRarity,
  type FushiBuildArchetype,
  type FushiItemRarity,
} from '../../data/combatCatalog'
import type { CharacterSheet } from '../../data/types'
import {
  absorbCharacterBuildItem,
  removeCharacterBuildItemForDebug,
  replaceCharacterBuildItemRarityForMaster,
} from '../../lib/characterBuilds'
import { TabletopVisualLibrary } from './TabletopVisualLibrary'
import { TabletopVisualThumbnailPicker } from './TabletopVisualThumbnailPicker'

type StandardRarity = Exclude<FushiItemRarity, 'secreto'>

interface TabletopBuildManagerProps {
  campaignId?: string
  characters: CharacterSheet[]
  onChangeCharacter: (character: CharacterSheet) => void
  onSetVisualThumbnail: (key: string, value: string) => void
  visualThumbnails: Record<string, string>
}

const rarityOrder: StandardRarity[] = ['comum', 'raro', 'epico', 'lendario', 'mitico']
const archetypeIcons: Record<FushiBuildArchetype, LucideIcon> = {
  tank: Shield,
  assassino: Crosshair,
  suporte: HeartPulse,
  lutador: Swords,
  atirador: Crosshair,
  ocultista: WandSparkles,
}

function rarityFromRoll(roll: number): StandardRarity {
  if (roll <= 2) return 'comum'
  if (roll <= 4) return 'raro'
  if (roll <= 6) return 'epico'
  if (roll <= 9) return 'lendario'
  return 'mitico'
}

export function TabletopBuildManager({
  campaignId,
  characters,
  onChangeCharacter,
  onSetVisualThumbnail,
  visualThumbnails,
}: TabletopBuildManagerProps) {
  const [archetypeId, setArchetypeId] = useState<FushiBuildArchetype>('tank')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState(
    () => BUILD_ITEMS.find((item) => item.archetype === 'tank')?.id ?? '',
  )
  const [rarity, setRarity] = useState<StandardRarity>('comum')
  const [characterId, setCharacterId] = useState(() => characters[0]?.id ?? '')
  const [feedback, setFeedback] = useState('')
  const [secretTargetId, setSecretTargetId] = useState('')
  const [rerollResults, setRerollResults] = useState<Array<{ rarity: StandardRarity; roll: number }>>([])

  const archetype = BUILD_ARCHETYPES.find((entry) => entry.id === archetypeId)
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase('pt-BR')
  const visibleItems = BUILD_ITEMS
    .filter((item) => item.archetype === archetypeId)
    .filter((item) =>
      !normalizedSearchQuery ||
      [item.name, item.passive, item.biomeId]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(normalizedSearchQuery),
    )
  const selectedItem = visibleItems.find((item) => item.id === selectedItemId) ?? visibleItems[0]
  const SelectedArchetypeIcon = archetypeIcons[archetypeId]
  const selectedCharacter = characters.find((character) => character.id === characterId) ?? characters[0]
  const previewItem = selectedItem ? resolveBuildItemByRarity(selectedItem, rarity) : null
  const absorbedItems = getBuildItems(selectedCharacter?.combatProfile?.build)
  const isAlreadyAbsorbed = Boolean(
    previewItem && absorbedItems.some((item) => item.catalogItemId === previewItem.catalogItemId),
  )
  const charactersByType = useMemo(
    () => [...characters].sort((left, right) =>
      left.tipo.localeCompare(right.tipo) || left.nome.localeCompare(right.nome, 'pt-BR'),
    ),
    [characters],
  )

  function chooseArchetype(nextArchetype: FushiBuildArchetype) {
    setArchetypeId(nextArchetype)
    setSelectedItemId(BUILD_ITEMS.find((item) => item.archetype === nextArchetype)?.id ?? '')
    setFeedback('')
  }

  function absorbSelectedItem() {
    if (!selectedCharacter || !previewItem || isAlreadyAbsorbed) return
    onChangeCharacter(absorbCharacterBuildItem(selectedCharacter, previewItem))
    setFeedback(`${previewItem.name} foi vinculado a ${selectedCharacter.nome}.`)
  }

  function removeItem(catalogItemId: string, itemName: string) {
    if (!selectedCharacter) return
    onChangeCharacter(removeCharacterBuildItemForDebug(selectedCharacter, catalogItemId))
    setFeedback(`${itemName} removido apenas pelo modo de correcao do Mestre.`)
  }

  function applySecretRarity(nextRarity: StandardRarity) {
    if (!selectedCharacter || !secretTargetId) return
    const target = absorbedItems.find((item) => item.catalogItemId === secretTargetId)
    if (!target) return
    onChangeCharacter(
      replaceCharacterBuildItemRarityForMaster(
        selectedCharacter,
        secretTargetId,
        nextRarity,
      ),
    )
    setFeedback(`${target.name} agora está na raridade ${ITEM_RARITY_META[nextRarity].label}.`)
    setRerollResults([])
  }

  function rollFiveRarities() {
    if (!secretTargetId) return
    setRerollResults(
      Array.from({ length: 5 }, () => {
        const roll = 1 + Math.floor(Math.random() * 10)
        return { rarity: rarityFromRoll(roll), roll }
      }),
    )
  }

  const sidebar = (
    <>
      <div className="tabletop-visual-library__sidebar-heading">
        <span>Arquetipos</span>
        <Sparkles aria-hidden="true" size={15} />
      </div>
      <nav className="tabletop-visual-library__nav" aria-label="Arquetipos de build">
        {BUILD_ARCHETYPES.map((entry) => {
          const Icon = archetypeIcons[entry.id]
          return (
            <button
              aria-selected={entry.id === archetypeId}
              className={entry.id === archetypeId ? 'is-active' : ''}
              key={entry.id}
              onClick={() => chooseArchetype(entry.id)}
              style={{ '--build-accent': entry.color } as CSSProperties}
              type="button"
            >
              <Icon size={17} />
              <span>{entry.label}</span>
              <small>{BUILD_ITEMS.filter((item) => item.archetype === entry.id).length}</small>
            </button>
          )
        })}
      </nav>

      <div className="tabletop-visual-library__sidebar-heading">
        <span>Itens</span>
        <small>{visibleItems.length}</small>
      </div>
      <div className="tabletop-visual-library__folder-list build-manager__visual-items build-manager__item-list">
        {visibleItems.map((item) => (
          <button
            className={`tabletop-visual-library-folder__select${item.id === selectedItem?.id ? ' is-active' : ''}`}
            key={item.id}
            onClick={() => {
              setSelectedItemId(item.id)
              setFeedback('')
            }}
            type="button"
          >
            <Sparkles size={15} />
            <span>{item.name}</span>
          </button>
        ))}
      </div>

      <label className="field build-manager__visual-character-select">
        <span>Ficha selecionada</span>
        <select
          className="field__input"
          onChange={(event) => {
            setCharacterId(event.target.value)
            setFeedback('')
            setSecretTargetId('')
            setRerollResults([])
          }}
          value={selectedCharacter?.id ?? ''}
        >
          {charactersByType.map((character) => (
            <option key={character.id} value={character.id}>{character.nome} - {character.tipo}</option>
          ))}
        </select>
      </label>
    </>
  )

  return (
    <TabletopVisualLibrary
      code="BUI"
      contentHeader={
        <>
          <div>
            <p className="eyebrow">{archetype?.label ?? 'Build'}</p>
            <h2>{selectedItem?.name ?? 'Catalogo de builds'}</h2>
            <small>{FUSHI_BUILD_CATALOG.items.length} itens canonicos no catalogo</small>
          </div>
          <span className="tag">{absorbedItems.length} em {selectedCharacter?.nome ?? 'nenhuma ficha'}</span>
        </>
      }
      icon={Sparkles}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Buscar item de build"
      searchValue={searchQuery}
      sidebar={sidebar}
      testId="build-manager"
      title="Builds absorvidas"
    >
    <div className="build-manager build-manager--visual">
      <header className="build-manager__header">
        <div>
          <p className="eyebrow">BUI · Mestre</p>
          <h3>Builds absorvidas</h3>
          <p className="support-copy">
            Escolha o arquétipo, inspecione o item, defina a raridade e vincule à identidade.
          </p>
        </div>
        <span className="tag">{FUSHI_BUILD_CATALOG.items.length} itens canônicos</span>
      </header>

      <div className="build-manager__archetypes" role="tablist" aria-label="Arquétipos de build">
        {BUILD_ARCHETYPES.map((entry) => (
          <button
            aria-selected={entry.id === archetypeId}
            className={entry.id === archetypeId ? 'is-active' : ''}
            key={entry.id}
            onClick={() => chooseArchetype(entry.id)}
            role="tab"
            style={{ '--build-accent': entry.color } as CSSProperties}
            type="button"
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="build-manager__workspace">
        <aside className="build-manager__item-list-legacy" aria-label="Itens do arquétipo">
          {visibleItems.map((item) => (
            <button
              className={item.id === selectedItem?.id ? 'is-active' : ''}
              key={item.id}
              onClick={() => {
                setSelectedItemId(item.id)
                setFeedback('')
              }}
              type="button"
            >
              <span>{item.name}</span>
              <small>{FUSHI_BUILD_CATALOG.biomes.find((biome) => biome.id === item.biomeId)?.label}</small>
            </button>
          ))}
        </aside>

        <section className="build-manager__detail">
          {selectedItem && previewItem ? (
            <>
              <TabletopVisualThumbnailPicker
                alt={selectedItem.name}
                campaignId={campaignId}
                className="tabletop-visual-thumbnail--feature build-manager__thumbnail"
                fallback={<SelectedArchetypeIcon size={42} />}
                onChange={(value) =>
                  onSetVisualThumbnail(`build:${selectedItem.id}`, value)
                }
                value={visualThumbnails[`build:${selectedItem.id}`]}
              />
              <header>
                <div>
                  <p className="eyebrow">{archetype?.label}</p>
                  <h3>{selectedItem.name}</h3>
                </div>
                <span
                  className="build-manager__rarity-mark"
                  style={{ '--rarity-color': ITEM_RARITY_META[rarity].color } as CSSProperties}
                >
                  {ITEM_RARITY_META[rarity].label}
                </span>
              </header>

              <div className="build-manager__rarities" aria-label="Raridade do item">
                {rarityOrder.map((rarityId) => (
                  <button
                    className={rarityId === rarity ? 'is-active' : ''}
                    key={rarityId}
                    onClick={() => setRarity(rarityId)}
                    style={{ '--rarity-color': ITEM_RARITY_META[rarityId].color } as CSSProperties}
                    type="button"
                  >
                    {ITEM_RARITY_META[rarityId].label}
                  </button>
                ))}
              </div>

              <dl className="build-manager__modifier-grid">
                {formatBuildModifiers(previewItem.modifiers).map((modifier) => (
                  <div className={modifier.value > 0 ? 'is-positive' : 'is-negative'} key={modifier.key}>
                    <dt>{BUILD_MODIFIER_LABELS[modifier.key]}</dt>
                    <dd>{modifier.value > 0 ? '+' : ''}{modifier.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="build-manager__passive"><b>Passiva:</b> {selectedItem.passive}</p>

              <div className="build-manager__binding">
                <label className="field">
                  <span>Vincular à ficha</span>
                  <select
                    className="field__input"
                    onChange={(event) => {
                      setCharacterId(event.target.value)
                      setFeedback('')
                      setSecretTargetId('')
                      setRerollResults([])
                    }}
                    value={selectedCharacter?.id ?? ''}
                  >
                    {charactersByType.map((character) => (
                      <option key={character.id} value={character.id}>
                        {character.nome} · {character.tipo}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button button--primary"
                  data-testid="build-absorb"
                  disabled={!selectedCharacter || isAlreadyAbsorbed}
                  onClick={absorbSelectedItem}
                  type="button"
                >
                  {isAlreadyAbsorbed ? 'Já absorvido' : 'Absorver item'}
                </button>
              </div>
              <p className="support-copy">
                A raridade é revelada somente depois da decisão narrativa de absorver. O seletor existe para o Mestre registrar o resultado.
              </p>
            </>
          ) : null}
        </section>

        <aside className="build-manager__character">
          <div>
            <p className="eyebrow">Ficha selecionada</p>
            <h3>{selectedCharacter?.nome ?? 'Nenhuma ficha'}</h3>
            <span className="tag">{absorbedItems.length} absorvido(s)</span>
          </div>
          <div className="build-manager__absorbed-list">
            {absorbedItems.length > 0 ? absorbedItems.map((item) => (
              <article key={item.catalogItemId}>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.rarityLabel}</small>
                </div>
                <button
                  className="button button--ghost"
                  onClick={() => removeItem(item.catalogItemId, item.name)}
                  title="Remover somente para correção técnica"
                  type="button"
                >
                  Remover debug
                </button>
              </article>
            )) : (
              <p className="support-copy">Nenhum item absorvido.</p>
            )}
          </div>
          <details className="build-manager__secret-note">
            <summary>Itens Secretos de correção</summary>
            {BUILD_SECRET_ITEMS.map((item) => (
              <p key={item.id}><b>{item.name}:</b> {item.effect}</p>
            ))}
            <label className="field">
              <span>Absorção afetada</span>
              <select
                className="field__input"
                disabled={absorbedItems.length === 0}
                onChange={(event) => {
                  setSecretTargetId(event.target.value)
                  setRerollResults([])
                }}
                value={secretTargetId}
              >
                <option value="">Selecione um item</option>
                {absorbedItems.map((item) => (
                  <option key={item.catalogItemId} value={item.catalogItemId}>
                    {item.name} · {item.rarityLabel}
                  </option>
                ))}
              </select>
            </label>
            <div className="build-manager__secret-actions">
              <button
                className="button button--secondary"
                disabled={!secretTargetId}
                onClick={() => applySecretRarity('mitico')}
                type="button"
              >
                Elevar a Mítico
              </button>
              <button
                className="button button--secondary"
                disabled={!secretTargetId}
                onClick={rollFiveRarities}
                type="button"
              >
                Rerrolar 5 vezes
              </button>
            </div>
            {rerollResults.length > 0 ? (
              <div className="build-manager__reroll-results" aria-label="Resultados da rerrolagem">
                {rerollResults.map((result, index) => (
                  <button
                    key={`${result.roll}-${index}`}
                    onClick={() => applySecretRarity(result.rarity)}
                    style={{ '--rarity-color': ITEM_RARITY_META[result.rarity].color } as CSSProperties}
                    type="button"
                  >
                    <b>{result.roll}</b>
                    <span>{ITEM_RARITY_META[result.rarity].label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </details>
        </aside>
      </div>

      {feedback ? <p className="build-manager__feedback" role="status">{feedback}</p> : null}
    </div>
    </TabletopVisualLibrary>
  )
}
