import { useEffect, useMemo, useState } from 'react'
import type { TabletopBiome, TabletopMap, TabletopTransitionAsset } from '../../data/types'
import type {
  TabletopLibraryCategory,
  TabletopLibraryFolder,
} from '../../lib/tabletopLibraryState'

interface TabletopMapLibraryProps {
  currentMapId: string
  biomes: TabletopBiome[]
  focusedMapId?: string
  folders: TabletopLibraryFolder[]
  isGridVisible: boolean
  mapFolders: Record<string, string>
  maps: TabletopMap[]
  transitionFolders: Record<string, string>
  transitions: TabletopTransitionAsset[]
  onActivateMap: (mapId: string) => void
  onAssignMapFolder: (mapId: string, folderId: string) => void
  onAssignTransitionFolder: (transitionId: string, folderId: string) => void
  onConfigureMap: (mapId: string) => void
  onConfigureTransition: (transitionId: string) => void
  onCreateFolder: (
    category: Extract<TabletopLibraryCategory, 'maps' | 'transitions'>,
    parentId: string,
    name: string,
  ) => void
  onCreateMap: (folderId: string) => void
  onCreateTransition: (folderId: string) => void
  onDeleteFolder: (folderId: string) => void
  onDeleteMap: (mapId: string) => void
  onDeleteTransition: (transitionId: string) => void
  onHideMap?: (mapId: string) => void
  onMoveFolder: (folderId: string, direction: 'up' | 'down') => void
  onPrepareMap?: (mapId: string) => void
  onReturnToActiveMap?: () => void
  onRenameFolder: (folderId: string, name: string) => void
  onReturnToWorld?: () => void
  onShowTransition: (transitionId: string) => void
  onToggleGrid: () => void
}

type MapLibraryTab = 'maps' | 'transitions'

interface FolderView extends TabletopLibraryFolder {
  isVirtual?: boolean
}

interface LibraryDragPayload {
  category: MapLibraryTab
  id: string
}

const ROOT_FOLDER_ID = ''
const LIBRARY_DRAG_DATA_TYPE = 'application/x-fushi-library-item'

function getMapTypeLabel(type: TabletopMap['type']) {
  switch (type) {
    case 'livre':
      return 'Livre'
    case 'evento':
      return 'Evento'
    case 'base':
      return 'Base'
    case 'extra':
      return 'Extra'
    case 'interior':
      return 'Interior'
    case 'dungeon':
      return 'Dungeon'
    default:
      return 'Mapa'
  }
}

function getMapVisibilityLabel(visibility: TabletopMap['mapVisibility']) {
  switch (visibility) {
    case 'mestre_apenas':
      return 'Mestre apenas'
    case 'preparado':
      return 'Preparacao'
    case 'ativo_para_jogadores':
      return 'Ativo para jogadores'
    case 'arquivado':
      return 'Arquivado'
    default:
      return 'Ativo para jogadores'
  }
}

function getTransitionTypeLabel(type: TabletopTransitionAsset['type']) {
  return type === 'video' ? 'Video' : 'Imagem'
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getVirtualBiomeFolderId(
  category: Extract<TabletopLibraryCategory, 'maps' | 'transitions'>,
  biomeId: string,
) {
  return `virtual:${category}:biome:${biomeId}`
}

function buildVirtualBiomeFolders(
  category: Extract<TabletopLibraryCategory, 'maps' | 'transitions'>,
  biomes: TabletopBiome[],
  looseBiomeNames: string[],
): FolderView[] {
  const biomeFolders = biomes.map((biome) => ({
    id: getVirtualBiomeFolderId(category, biome.id),
    category,
    parentId: ROOT_FOLDER_ID,
    name: biome.name,
    icon: category === 'maps' ? '🗺️' : '🎬',
    isVirtual: true,
  }))

  const looseFolders = looseBiomeNames
    .filter((biomeName) => biomeName.trim().length > 0)
    .filter(
      (biomeName) =>
        !biomes.some((biome) => biome.name.toLowerCase() === biomeName.toLowerCase()),
    )
    .map((biomeName) => ({
      id: getVirtualBiomeFolderId(category, `loose-${slugify(biomeName)}`),
      category,
      parentId: ROOT_FOLDER_ID,
      name: biomeName,
      icon: category === 'maps' ? '🗺️' : '🎬',
      isVirtual: true,
    }))

  return [...biomeFolders, ...looseFolders]
}

function compareFolders(a: FolderView, b: FolderView) {
  const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER
  const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER

  if (orderA !== orderB) {
    return orderA - orderB
  }

  return a.name.localeCompare(b.name)
}

function resolveBiomeName(biomeId: string, biomes: TabletopBiome[]) {
  return biomes.find((biome) => biome.id === biomeId)?.name ?? biomeId
}

function resolveMapFolderId(
  map: TabletopMap,
  folderAssignments: Record<string, string>,
) {
  const hasAssignedFolder = Object.prototype.hasOwnProperty.call(folderAssignments, map.id)
  const assignedFolderId = hasAssignedFolder ? folderAssignments[map.id] : map.folderId

  if (typeof assignedFolderId === 'string') {
    return assignedFolderId
  }

  if (map.biomeId) {
    return getVirtualBiomeFolderId('maps', map.biomeId)
  }

  if (map.biome) {
    return getVirtualBiomeFolderId('maps', `loose-${slugify(map.biome)}`)
  }

  return ROOT_FOLDER_ID
}

function resolveTransitionFolderId(
  transition: TabletopTransitionAsset,
  folderAssignments: Record<string, string>,
) {
  const hasAssignedFolder = Object.prototype.hasOwnProperty.call(
    folderAssignments,
    transition.id,
  )
  const assignedFolderId = hasAssignedFolder
    ? folderAssignments[transition.id]
    : transition.folderId

  if (typeof assignedFolderId === 'string') {
    return assignedFolderId
  }

  return getVirtualBiomeFolderId('transitions', transition.biomeId)
}

function buildBreadcrumb(folders: FolderView[], selectedFolderId: string) {
  const breadcrumb: FolderView[] = []
  let currentId = selectedFolderId
  const visitedIds = new Set<string>()

  while (currentId && !visitedIds.has(currentId)) {
    visitedIds.add(currentId)
    const folder = folders.find((item) => item.id === currentId)

    if (!folder) {
      break
    }

    breadcrumb.unshift(folder)
    currentId = folder.parentId
  }

  return breadcrumb
}

function getFolderItemCount(
  folderId: string,
  folders: FolderView[],
  itemFolderIds: string[],
) {
  const childFolderCount = folders.filter((folder) => folder.parentId === folderId).length
  const directItemCount = itemFolderIds.filter((itemFolderId) => itemFolderId === folderId).length

  return childFolderCount + directItemCount
}

function startItemDrag(
  event: React.DragEvent,
  payload: LibraryDragPayload,
) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData(LIBRARY_DRAG_DATA_TYPE, JSON.stringify(payload))
}

function readDragPayload(event: React.DragEvent): LibraryDragPayload | null {
  const rawPayload = event.dataTransfer.getData(LIBRARY_DRAG_DATA_TYPE)

  if (!rawPayload) {
    return null
  }

  try {
    const payload = JSON.parse(rawPayload) as Partial<LibraryDragPayload>

    if (
      (payload.category === 'maps' || payload.category === 'transitions') &&
      typeof payload.id === 'string'
    ) {
      return {
        category: payload.category,
        id: payload.id,
      }
    }
  } catch {
    return null
  }

  return null
}

export function TabletopMapLibrary({
  currentMapId,
  biomes,
  focusedMapId = '',
  folders,
  isGridVisible,
  mapFolders,
  maps,
  transitionFolders,
  transitions,
  onActivateMap,
  onAssignMapFolder,
  onAssignTransitionFolder,
  onConfigureMap,
  onConfigureTransition,
  onCreateFolder,
  onCreateMap,
  onCreateTransition,
  onDeleteFolder,
  onDeleteMap,
  onDeleteTransition,
  onHideMap,
  onMoveFolder,
  onPrepareMap,
  onReturnToActiveMap,
  onRenameFolder,
  onReturnToWorld,
  onShowTransition,
  onToggleGrid,
}: TabletopMapLibraryProps) {
  const [activeTab, setActiveTab] = useState<MapLibraryTab>('maps')
  const [selectedFolderIds, setSelectedFolderIds] = useState<Record<MapLibraryTab, string>>({
    maps: ROOT_FOLDER_ID,
    transitions: ROOT_FOLDER_ID,
  })
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingFolderId, setRenamingFolderId] = useState('')
  const [renamingFolderName, setRenamingFolderName] = useState('')

  const categoryFolders = folders.filter(
    (folder) => folder.category === activeTab,
  ) as FolderView[]
  const virtualFolders = useMemo(() => {
    const looseMapBiomeNames = maps
      .filter((map) => !map.biomeId && map.biome)
      .map((map) => map.biome ?? '')

    return activeTab === 'maps'
      ? buildVirtualBiomeFolders('maps', biomes, looseMapBiomeNames)
      : buildVirtualBiomeFolders('transitions', biomes, [])
  }, [activeTab, biomes, maps])
  const effectiveFolders = [...virtualFolders, ...categoryFolders]
  const selectedFolderId = selectedFolderIds[activeTab]
  const selectedFolderExists =
    selectedFolderId === ROOT_FOLDER_ID ||
    effectiveFolders.some((folder) => folder.id === selectedFolderId)
  const currentFolderId = selectedFolderExists ? selectedFolderId : ROOT_FOLDER_ID
  const breadcrumb = buildBreadcrumb(effectiveFolders, currentFolderId)
  const directFolders = effectiveFolders
    .filter((folder) => folder.parentId === currentFolderId)
    .sort(compareFolders)

  const mapFolderIds = maps.map((map) => resolveMapFolderId(map, mapFolders))
  const transitionFolderIds = transitions.map((transition) =>
    resolveTransitionFolderId(transition, transitionFolders),
  )
  const currentMapName = maps.find((map) => map.id === currentMapId)?.name ?? 'Sem mapa'
  const selectedMaps = maps
    .filter((map) => resolveMapFolderId(map, mapFolders) === currentFolderId)
    .sort((a, b) => a.name.localeCompare(b.name))
  const selectedTransitions = transitions
    .filter(
      (transition) =>
        resolveTransitionFolderId(transition, transitionFolders) === currentFolderId,
    )
    .sort((a, b) => a.name.localeCompare(b.name))
  const itemFolderIds = activeTab === 'maps' ? mapFolderIds : transitionFolderIds

  useEffect(() => {
    if (!focusedMapId) {
      return
    }

    const focusedMap = maps.find((map) => map.id === focusedMapId)

    if (!focusedMap) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setActiveTab('maps')
      setSelectedFolderIds((currentFolders) => ({
        ...currentFolders,
        maps: resolveMapFolderId(focusedMap, mapFolders),
      }))
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [focusedMapId, mapFolders, maps])

  function selectFolder(folderId: string) {
    setSelectedFolderIds((currentFolders) => ({
      ...currentFolders,
      [activeTab]: folderId,
    }))
  }

  function handleCreateFolder() {
    const trimmedName = newFolderName.trim()

    if (!trimmedName) {
      return
    }

    onCreateFolder(activeTab, currentFolderId, trimmedName)
    setNewFolderName('')
  }

  function handleSaveFolderRename(folderId: string) {
    const trimmedName = renamingFolderName.trim()

    if (!trimmedName) {
      return
    }

    onRenameFolder(folderId, trimmedName)
    setRenamingFolderId('')
    setRenamingFolderName('')
  }

  function handleFolderDrop(event: React.DragEvent, folderId: string) {
    event.preventDefault()
    const payload = readDragPayload(event)

    if (!payload || payload.category !== activeTab) {
      return
    }

    if (payload.category === 'maps') {
      onAssignMapFolder(payload.id, folderId)
      return
    }

    onAssignTransitionFolder(payload.id, folderId)
  }

  function handleFolderKeyDown(event: React.KeyboardEvent, folderId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectFolder(folderId)
    }
  }

  function handleDeleteMap(map: TabletopMap) {
    if (map.id === currentMapId) {
      window.alert('Esse mapa esta ativo na mesa. Troque o mapa atual antes de excluir.')
      return
    }

    if (window.confirm(`Excluir "${map.name}" da biblioteca?`)) {
      onDeleteMap(map.id)
    }
  }

  function handleDeleteTransition(transition: TabletopTransitionAsset) {
    if (window.confirm(`Excluir "${transition.name}" da biblioteca?`)) {
      onDeleteTransition(transition.id)
    }
  }

  return (
    <section className="tabletop-library tabletop-library--folders">
      <div className="tabletop-library__hero">
        <div>
          <p className="eyebrow">Biblioteca da mesa</p>
          <h3>Mapas e interludios</h3>
          <p className="support-copy">
            Arraste mapas e cenas para dentro das pastas, ou organize por bioma e regiao.
          </p>
        </div>
        <div className="tabletop-library__hero-actions">
          <div className="tag-row">
            <span className="tag">Mapa atual: {currentMapName}</span>
            <span className="tag">{isGridVisible ? 'Grid visivel' : 'Grid oculto'}</span>
            {focusedMapId ? <span className="tag">Foco MUN</span> : null}
          </div>
          <div className="tabletop-hud-panel__actions">
            {onReturnToActiveMap ? (
              <button className="button" onClick={onReturnToActiveMap} type="button">
                Voltar ao mapa ativo dos jogadores
              </button>
            ) : null}
            {onReturnToWorld ? (
              <button className="button" onClick={onReturnToWorld} type="button">
                Voltar ao MUN
              </button>
            ) : null}
            <button className="button" onClick={onToggleGrid} type="button">
              {isGridVisible ? 'Esconder grid' : 'Mostrar grid'}
            </button>
          </div>
        </div>
      </div>

      <div className="tabletop-library-tabs">
        <button
          className={`tabletop-library-tabs__button${
            activeTab === 'maps' ? ' tabletop-library-tabs__button--active' : ''
          }`}
          onClick={() => setActiveTab('maps')}
          type="button"
        >
          🗺️ MAPAS
        </button>
        <button
          className={`tabletop-library-tabs__button${
            activeTab === 'transitions' ? ' tabletop-library-tabs__button--active' : ''
          }`}
          onClick={() => setActiveTab('transitions')}
          type="button"
        >
          🎬 INTERLUDIOS
        </button>
      </div>

      <div className="tabletop-library-toolbar">
        <div className="tabletop-library-breadcrumb">
          <button
            className="tabletop-library-breadcrumb__item"
            onClick={() => selectFolder(ROOT_FOLDER_ID)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleFolderDrop(event, ROOT_FOLDER_ID)}
            type="button"
          >
            Todas
          </button>
          {breadcrumb.map((folder) => (
            <button
              className="tabletop-library-breadcrumb__item"
              key={folder.id}
              onClick={() => selectFolder(folder.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleFolderDrop(event, folder.id)}
              type="button"
            >
              {folder.icon ?? '📁'} {folder.name}
            </button>
          ))}
        </div>
        <div className="tabletop-library-toolbar__actions">
          <input
            className="field__input tabletop-library-toolbar__input"
            onChange={(event) => setNewFolderName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleCreateFolder()
              }
            }}
            placeholder="Nome da pasta"
            value={newFolderName}
          />
          <button className="button" onClick={handleCreateFolder} type="button">
            + Pasta
          </button>
          <button
            className="button button--primary"
            onClick={() =>
              activeTab === 'maps'
                ? onCreateMap(currentFolderId)
                : onCreateTransition(currentFolderId)
            }
            type="button"
          >
            {activeTab === 'maps' ? '+ Mapa' : '+ Interludio'}
          </button>
        </div>
      </div>

      <div className="tabletop-library-folder-grid">
        {currentFolderId ? (
          <button
            className="tabletop-library-folder-card tabletop-library-folder-card--back"
            onClick={() =>
              selectFolder(
                effectiveFolders.find((folder) => folder.id === currentFolderId)?.parentId ??
                  ROOT_FOLDER_ID,
              )
            }
            type="button"
          >
            <span>↩</span>
            <strong>Voltar</strong>
          </button>
        ) : null}
        {directFolders.map((folder) => {
          const itemCount = getFolderItemCount(folder.id, effectiveFolders, itemFolderIds)
          const canDeleteFolder = !folder.isVirtual && itemCount === 0
          const canEditFolder = !folder.isVirtual
          const isRenaming = renamingFolderId === folder.id

          return (
            <article
              className="tabletop-library-folder-card"
              key={folder.id}
              onClick={() => selectFolder(folder.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleFolderDrop(event, folder.id)}
              onKeyDown={(event) => handleFolderKeyDown(event, folder.id)}
              role="button"
              tabIndex={0}
              title="Solte um item aqui para mover para esta pasta"
            >
              <span>{folder.icon ?? '📁'}</span>
              {isRenaming ? (
                <input
                  autoFocus
                  className="field__input tabletop-library-folder-card__input"
                  onChange={(event) => setRenamingFolderName(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    event.stopPropagation()
                    if (event.key === 'Enter') {
                      handleSaveFolderRename(folder.id)
                    }
                    if (event.key === 'Escape') {
                      setRenamingFolderId('')
                    }
                  }}
                  value={renamingFolderName}
                />
              ) : (
                <strong>{folder.name}</strong>
              )}
              <small>{itemCount} item(s)</small>
              {canEditFolder ? (
                <div
                  className="tabletop-library-folder-card__actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  {isRenaming ? (
                    <>
                      <button
                        className="button button--compact"
                        onClick={() => handleSaveFolderRename(folder.id)}
                        type="button"
                      >
                        Salvar
                      </button>
                      <button
                        className="button button--compact"
                        onClick={() => setRenamingFolderId('')}
                        type="button"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="button button--compact"
                        onClick={() => {
                          setRenamingFolderId(folder.id)
                          setRenamingFolderName(folder.name)
                        }}
                        type="button"
                      >
                        Nome
                      </button>
                      <button
                        className="button button--compact"
                        onClick={() => onMoveFolder(folder.id, 'up')}
                        type="button"
                      >
                        ↑
                      </button>
                      <button
                        className="button button--compact"
                        onClick={() => onMoveFolder(folder.id, 'down')}
                        type="button"
                      >
                        ↓
                      </button>
                      <button
                        className="button button--compact"
                        disabled={!canDeleteFolder}
                        onClick={() => onDeleteFolder(folder.id)}
                        title={
                          canDeleteFolder
                            ? 'Excluir pasta vazia'
                            : 'So e possivel excluir uma pasta vazia'
                        }
                        type="button"
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </article>
          )
        })}
      </div>

      {activeTab === 'maps' ? (
        <div className="tabletop-library__grid tabletop-library__grid--maps">
          {selectedMaps.map((map) => {
            const isActive = map.id === currentMapId
            const isFocused = map.id === focusedMapId
            const visibility = map.mapVisibility ?? 'ativo_para_jogadores'
            const isVisibleToPlayers = visibility === 'ativo_para_jogadores'

            return (
              <article
                className={`tabletop-library-card tabletop-library-card--map${
                  isActive ? ' tabletop-library-card--active' : ''
                }${isFocused ? ' tabletop-library-card--highlighted' : ''
                }`}
                draggable
                key={map.id}
                onDragStart={(event) => startItemDrag(event, { category: 'maps', id: map.id })}
              >
                <div className="tabletop-library-card__media tabletop-library-card__media--wide">
                  <img
                    alt={map.name}
                    className="tabletop-library-card__image"
                    src={map.thumbnailUrl ?? map.previewImage ?? map.image}
                  />
                </div>

                <div className="tabletop-library-card__body">
                  <div className="tabletop-library-card__top">
                    <div>
                      <p className="eyebrow">{getMapTypeLabel(map.type)}</p>
                      <h3>{map.name}</h3>
                    </div>
                    {isActive ? <span className="tag">Na mesa</span> : null}
                  </div>
                  <div className="tag-row">
                    <span className="tag">
                      {map.gridColumns}x{map.gridRows}
                    </span>
                    <span className="tag">{getMapVisibilityLabel(visibility)}</span>
                    {map.biomeId ? (
                      <span className="tag">{resolveBiomeName(map.biomeId, biomes)}</span>
                    ) : null}
                  </div>
                </div>

                <div className="tabletop-library-card__actions">
                  <button
                    className="button"
                    disabled={visibility === 'preparado'}
                    onClick={() => onPrepareMap?.(map.id)}
                    type="button"
                  >
                    Preparar mapa
                  </button>
                  <button
                    className={`button${isVisibleToPlayers && isActive ? ' button--primary' : ''}`}
                    disabled={isVisibleToPlayers && isActive}
                    onClick={() => onActivateMap(map.id)}
                    type="button"
                  >
                    {isVisibleToPlayers && isActive ? 'Mapa ativo' : 'Ativar para jogadores'}
                  </button>
                  <button
                    className="button"
                    disabled={visibility === 'mestre_apenas'}
                    onClick={() => onHideMap?.(map.id)}
                    type="button"
                  >
                    Ocultar dos jogadores
                  </button>
                  <button className="button" onClick={() => onConfigureMap(map.id)} type="button">
                    Configurar
                  </button>
                  <button
                    className="button"
                    onClick={() => handleDeleteMap(map)}
                    type="button"
                  >
                    Excluir
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="tabletop-library__grid tabletop-library__grid--cinematics">
          {selectedTransitions.map((transition) => {
            const targetMap = maps.find((map) => map.id === transition.toMapId) ?? null

            return (
              <article
                className="tabletop-library-card"
                draggable
                key={transition.id}
                onDragStart={(event) =>
                  startItemDrag(event, { category: 'transitions', id: transition.id })
                }
              >
                <div className="tabletop-library-card__media tabletop-library-card__media--wide">
                  {transition.type === 'video' ? (
                    <video
                      className="tabletop-library-card__image"
                      muted
                      preload="metadata"
                      src={transition.assetUrl}
                    />
                  ) : transition.thumbnailUrl || transition.assetUrl ? (
                    <img
                      alt={transition.name}
                      className="tabletop-library-card__image"
                      src={transition.thumbnailUrl || transition.assetUrl}
                    />
                  ) : (
                    <div className="tabletop-library-card__placeholder">
                      {getTransitionTypeLabel(transition.type)}
                    </div>
                  )}
                </div>

                <div className="tabletop-library-card__body">
                  <div className="tabletop-library-card__top">
                    <div>
                      <p className="eyebrow">{getTransitionTypeLabel(transition.type)}</p>
                      <h3>{transition.name}</h3>
                    </div>
                    {targetMap ? <span className="tag">Destino: {targetMap.name}</span> : null}
                  </div>
                  <p className="support-copy">{transition.summary}</p>
                </div>

                <div className="tabletop-library-card__actions">
                  <button
                    className="button"
                    onClick={() => onConfigureTransition(transition.id)}
                    type="button"
                  >
                    Configurar
                  </button>
                  <button
                    className="button button--primary"
                    onClick={() => onShowTransition(transition.id)}
                    type="button"
                  >
                    Mostrar interludio
                  </button>
                  <button
                    className="button"
                    onClick={() => handleDeleteTransition(transition)}
                    type="button"
                  >
                    Excluir
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
