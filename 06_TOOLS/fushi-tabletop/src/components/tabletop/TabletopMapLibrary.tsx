import { useEffect, useMemo, useRef, useState } from 'react'
import type { TabletopBiome, TabletopMap, TabletopTransitionAsset } from '../../data/types'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'
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

interface FolderContextMenuState {
  folderId: string
  x: number
  y: number
}

const ROOT_FOLDER_ID = ''
const LIBRARY_DRAG_DATA_TYPE = 'application/x-fushi-library-item'
const BASE_MAP_FOLDER_ID = 'virtual:maps:bases'
const BASE_TRANSITION_FOLDER_ID = 'virtual:transitions:bases'
const MUN_TRANSITION_FOLDER_ID = 'virtual:transitions:mun'
const AUTOMATIC_MUN_TRANSITION_PREFIX = 'interlude-map-'

function isBaseLibraryMap(map: TabletopMap) {
  return (
    map.type === 'base' ||
    map.id.startsWith('base_') ||
    map.munLocationId?.startsWith('base_') === true
  )
}

function isBaseLibraryTransition(transition: TabletopTransitionAsset) {
  return (
    transition.id.startsWith('transicao_chegada_base_') ||
    transition.toMapId?.startsWith('base_') === true ||
    transition.category === 'Bases'
  )
}

function buildBaseVirtualFolder(
  category: Extract<TabletopLibraryCategory, 'maps' | 'transitions'>,
): FolderView {
  return {
    id: category === 'maps' ? BASE_MAP_FOLDER_ID : BASE_TRANSITION_FOLDER_ID,
    category,
    parentId: ROOT_FOLDER_ID,
    name: 'Bases',
    icon: 'BASE',
    isVirtual: true,
  }
}

function buildMunVirtualFolder(): FolderView {
  return {
    id: MUN_TRANSITION_FOLDER_ID,
    category: 'transitions',
    parentId: ROOT_FOLDER_ID,
    name: 'MUN',
    icon: 'MUN',
    isVirtual: true,
  }
}

function getMapLibraryPreviewAsset(map: TabletopMap) {
  const preferredAsset = map.thumbnailUrl ?? map.previewImage ?? map.image

  if (preferredAsset.endsWith('_4000.png')) {
    return preferredAsset.replace(/_4000\.png$/, '_thumb_640.jpg')
  }

  if (preferredAsset.endsWith('_4000.jpg')) {
    return preferredAsset.replace(/_4000\.jpg$/, '_thumb_640.jpg')
  }

  return preferredAsset
}

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

function getTransitionMediaType(transition: TabletopTransitionAsset): TabletopTransitionAsset['type'] {
  const assetUrl = transition.assetUrl.split('?')[0].toLowerCase()

  if (assetUrl.endsWith('.mp4') || assetUrl.endsWith('.webm')) {
    return 'video'
  }

  return transition.type
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
    parentId: category === 'transitions' ? MUN_TRANSITION_FOLDER_ID : ROOT_FOLDER_ID,
    name: biome.name,
    icon: category === 'maps' ? 'MAP' : 'BIO',
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
      parentId: category === 'transitions' ? MUN_TRANSITION_FOLDER_ID : ROOT_FOLDER_ID,
      name: biomeName,
      icon: category === 'maps' ? 'MAP' : 'BIO',
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

  if (
    isBaseLibraryMap(map) &&
    (assignedFolderId === undefined ||
      assignedFolderId === '' ||
      assignedFolderId === BASE_MAP_FOLDER_ID ||
      assignedFolderId.startsWith('virtual:maps:biome:'))
  ) {
    return BASE_MAP_FOLDER_ID
  }

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

  if (
    isBaseLibraryTransition(transition) &&
    (assignedFolderId === undefined ||
      assignedFolderId === '' ||
      assignedFolderId === BASE_MAP_FOLDER_ID ||
      assignedFolderId === BASE_TRANSITION_FOLDER_ID ||
      assignedFolderId.startsWith('virtual:maps:') ||
      assignedFolderId.startsWith('virtual:transitions:biome:'))
  ) {
    return BASE_TRANSITION_FOLDER_ID
  }

  if (
    transition.id.startsWith(AUTOMATIC_MUN_TRANSITION_PREFIX) &&
    (!assignedFolderId ||
      assignedFolderId.startsWith('virtual:maps:') ||
      assignedFolderId.startsWith('virtual:transitions:biome:'))
  ) {
    return getVirtualBiomeFolderId('transitions', transition.biomeId)
  }

  if (typeof assignedFolderId === 'string') {
    return assignedFolderId
  }

  return ROOT_FOLDER_ID
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

function getFolderPathLabel(folder: FolderView, folders: FolderView[]) {
  const path = buildBreadcrumb(folders, folder.id).map((entry) => entry.name)

  return path.join(' / ') || folder.name
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
  const [folderContextMenu, setFolderContextMenu] = useState<FolderContextMenuState | null>(null)
  const [draggingPayload, setDraggingPayload] = useState<LibraryDragPayload | null>(null)
  const lastFocusedMapIdRef = useRef('')

  const categoryFolders = folders.filter(
    (folder) => folder.category === activeTab,
  ) as FolderView[]
  const virtualFolders = useMemo(() => {
    const looseMapBiomeNames = maps
      .filter((map) => !map.biomeId && map.biome)
      .map((map) => map.biome ?? '')

    if (activeTab === 'maps') {
      const baseFolders = maps.some(isBaseLibraryMap) ? [buildBaseVirtualFolder('maps')] : []

      return [...baseFolders, ...buildVirtualBiomeFolders('maps', biomes, looseMapBiomeNames)]
    }

    const baseFolders = transitions.some(isBaseLibraryTransition)
      ? [buildBaseVirtualFolder('transitions')]
      : []
    const munFolders = transitions.some((transition) =>
      transition.id.startsWith(AUTOMATIC_MUN_TRANSITION_PREFIX),
    )
      ? [buildMunVirtualFolder()]
      : []

    return [
      ...baseFolders,
      ...munFolders,
      ...buildVirtualBiomeFolders('transitions', biomes, []),
    ]
  }, [activeTab, biomes, maps, transitions])
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
  const moveFolderOptions = [
    { id: ROOT_FOLDER_ID, label: 'Todas' },
    ...effectiveFolders
      .slice()
      .sort((a, b) => getFolderPathLabel(a, effectiveFolders).localeCompare(
        getFolderPathLabel(b, effectiveFolders),
      ))
      .map((folder) => ({
        id: folder.id,
        label: getFolderPathLabel(folder, effectiveFolders),
      })),
  ]

  useEffect(() => {
    if (!focusedMapId || lastFocusedMapIdRef.current === focusedMapId) {
      return
    }

    const focusedMap = maps.find((map) => map.id === focusedMapId)

    if (!focusedMap) {
      return
    }

    lastFocusedMapIdRef.current = focusedMapId
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

  useEffect(() => {
    if (!folderContextMenu) {
      return
    }

    function closeContextMenu() {
      setFolderContextMenu(null)
    }

    window.addEventListener('pointerdown', closeContextMenu)
    window.addEventListener('keydown', closeContextMenu)

    return () => {
      window.removeEventListener('pointerdown', closeContextMenu)
      window.removeEventListener('keydown', closeContextMenu)
    }
  }, [folderContextMenu])

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
      setDraggingPayload(null)
      return
    }

    onAssignTransitionFolder(payload.id, folderId)
    setDraggingPayload(null)
  }

  function handleItemDragStart(
    event: React.DragEvent,
    payload: LibraryDragPayload,
  ) {
    startItemDrag(event, payload)
    setDraggingPayload(payload)
  }

  function handleLibraryDragOver(event: React.DragEvent<HTMLElement>) {
    if (!draggingPayload) {
      return
    }

    event.preventDefault()
    const scrollContainer = event.currentTarget.closest(
      '.floating-window__body',
    ) as HTMLElement | null
    const threshold = 84
    const speed = 28

    if (scrollContainer) {
      const bounds = scrollContainer.getBoundingClientRect()

      if (event.clientY < bounds.top + threshold) {
        scrollContainer.scrollBy({ top: -speed })
      } else if (event.clientY > bounds.bottom - threshold) {
        scrollContainer.scrollBy({ top: speed })
      }
      return
    }

    if (event.clientY < threshold) {
      window.scrollBy({ top: -speed })
    } else if (event.clientY > window.innerHeight - threshold) {
      window.scrollBy({ top: speed })
    }
  }

  function handleFolderKeyDown(event: React.KeyboardEvent, folderId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectFolder(folderId)
    }
  }

  function handleFolderContextMenu(event: React.MouseEvent, folderId: string) {
    event.preventDefault()
    event.stopPropagation()
    setFolderContextMenu({
      folderId,
      x: event.clientX,
      y: event.clientY,
    })
  }

  function beginFolderRename(folder: FolderView) {
    if (folder.isVirtual) {
      window.alert('Esta e uma pasta automatica de bioma. Para renomear de verdade, ajuste o nome do bioma.')
      return
    }

    setRenamingFolderId(folder.id)
    setRenamingFolderName(folder.name)
    setFolderContextMenu(null)
  }

  function createItemInsideFolder(folder: FolderView) {
    setFolderContextMenu(null)
    if (activeTab === 'maps') {
      onCreateMap(folder.id)
      return
    }

    onCreateTransition(folder.id)
  }

  function createChildFolderInside(folder: FolderView) {
    setFolderContextMenu(null)
    const name = window.prompt('Nome da nova subpasta')

    if (!name?.trim()) {
      return
    }

    onCreateFolder(activeTab, folder.id, name)
  }

  function deleteFolderFromMenu(folder: FolderView) {
    setFolderContextMenu(null)

    if (folder.isVirtual) {
      const message =
        activeTab === 'maps'
          ? `Remover o agrupamento automatico "${folder.name}" da tela? Os mapas nao serao apagados; eles vao para "Todas".`
          : `Remover o agrupamento automatico "${folder.name}" da tela? Os interludios nao serao apagados; eles vao para "Todas".`

      if (!window.confirm(message)) {
        return
      }

      if (activeTab === 'maps') {
        maps
          .filter((map) => resolveMapFolderId(map, mapFolders) === folder.id)
          .forEach((map) => onAssignMapFolder(map.id, ROOT_FOLDER_ID))
        return
      }

      transitions
        .filter(
          (transition) =>
            resolveTransitionFolderId(transition, transitionFolders) === folder.id,
        )
        .forEach((transition) => onAssignTransitionFolder(transition.id, ROOT_FOLDER_ID))
      return
    }

    const itemCount = getFolderItemCount(folder.id, effectiveFolders, itemFolderIds)
    const message =
      itemCount > 0
        ? `Excluir a pasta "${folder.name}"? Os itens e subpastas serao movidos para a pasta anterior ou para o agrupamento automatico.`
        : `Excluir a pasta vazia "${folder.name}"?`

    if (window.confirm(message)) {
      onDeleteFolder(folder.id)
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
    const isAutomatic = transition.id.startsWith(AUTOMATIC_MUN_TRANSITION_PREFIX)
    const message = isAutomatic
      ? `Restaurar "${transition.name}" para a configuracao automatica do MUN?`
      : `Excluir "${transition.name}" da biblioteca?`

    if (window.confirm(message)) {
      onDeleteTransition(transition.id)
    }
  }

  return (
    <section
      className="tabletop-library tabletop-library--folders"
      onDragEnd={() => setDraggingPayload(null)}
      onDragOver={handleLibraryDragOver}
    >
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
          MAPAS
        </button>
        <button
          className={`tabletop-library-tabs__button${
            activeTab === 'transitions' ? ' tabletop-library-tabs__button--active' : ''
          }`}
          onClick={() => setActiveTab('transitions')}
          type="button"
        >
          INTERLUDIOS
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
              <span className="tabletop-library-breadcrumb__folder-icon">
                {folder.icon ?? 'DIR'}
              </span>
              {folder.name}
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

      {draggingPayload?.category === activeTab ? (
        <div className="tabletop-library-drop-dock" role="region" aria-label="Mover item">
          <strong>Mover para</strong>
          <div className="tabletop-library-drop-dock__targets">
            {moveFolderOptions.map((folder) => (
              <button
                key={folder.id || 'root'}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(event) => handleFolderDrop(event, folder.id)}
                type="button"
              >
                {folder.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
          const canEditFolder = !folder.isVirtual
          const isRenaming = renamingFolderId === folder.id

          if (folder.isVirtual && itemCount === 0) {
            return null
          }

          return (
            <article
              className="tabletop-library-folder-card"
              key={folder.id}
              onClick={() => selectFolder(folder.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleFolderDrop(event, folder.id)}
              onContextMenu={(event) => handleFolderContextMenu(event, folder.id)}
              onKeyDown={(event) => handleFolderKeyDown(event, folder.id)}
              role="button"
              tabIndex={0}
              title="Solte um item aqui para mover para esta pasta"
            >
              <span className="tabletop-library-folder-card__icon">
                {folder.icon ?? 'DIR'}
              </span>
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
              <small>
                {folder.isVirtual ? 'Sistema' : 'Pasta'} - {itemCount} item(s)
              </small>
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
                          beginFolderRename(folder)
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
                        onClick={() => deleteFolderFromMenu(folder)}
                        title="Excluir pasta e reorganizar o conteudo com seguranca"
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

      {folderContextMenu ? (() => {
        const folder = effectiveFolders.find((item) => item.id === folderContextMenu.folderId)

        if (!folder) {
          return null
        }

        return (
          <div
            className="tabletop-library-folder-menu"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              left: folderContextMenu.x,
              top: folderContextMenu.y,
            }}
          >
            <button onClick={() => selectFolder(folder.id)} type="button">
              Abrir pasta
            </button>
            {!folder.isVirtual ? (
              <button onClick={() => beginFolderRename(folder)} type="button">
                Renomear
              </button>
            ) : null}
            <button onClick={() => createChildFolderInside(folder)} type="button">
              Nova subpasta
            </button>
            <button onClick={() => createItemInsideFolder(folder)} type="button">
              {activeTab === 'maps' ? 'Novo mapa aqui' : 'Novo interludio aqui'}
            </button>
            {!folder.isVirtual ? (
              <button
                className="tabletop-library-folder-menu__danger"
                onClick={() => deleteFolderFromMenu(folder)}
                type="button"
              >
                Excluir pasta
              </button>
            ) : null}
          </div>
        )
      })() : null}

      {activeTab === 'maps' ? (
        <div className="tabletop-library__grid tabletop-library__grid--maps">
          {selectedMaps.map((map) => {
            const isActive = map.id === currentMapId
            const isFocused = map.id === focusedMapId
            const visibility = map.mapVisibility ?? 'ativo_para_jogadores'
            const isVisibleToPlayers = visibility === 'ativo_para_jogadores'
            const previewAsset = getMapLibraryPreviewAsset(map)
            const fallbackAsset = map.previewImage ?? map.image

            return (
              <article
                className={`tabletop-library-card tabletop-library-card--map${
                  isActive ? ' tabletop-library-card--active' : ''
                }${isFocused ? ' tabletop-library-card--highlighted' : ''
                }`}
                draggable
                key={map.id}
                onDragEnd={() => setDraggingPayload(null)}
                onDragStart={(event) =>
                  handleItemDragStart(event, { category: 'maps', id: map.id })
                }
              >
                <div className="tabletop-library-card__media tabletop-library-card__media--wide">
                  <img
                    alt={map.name}
                    className="tabletop-library-card__image"
                    decoding="async"
                    loading="lazy"
                    onError={(event) => {
                      if (event.currentTarget.dataset.fallbackApplied === 'true') {
                        return
                      }

                      const fallbackUrl = resolveRuntimeAssetUrl(fallbackAsset)

                      event.currentTarget.dataset.fallbackApplied = 'true'
                      event.currentTarget.src = fallbackUrl
                    }}
                    src={resolveRuntimeAssetUrl(previewAsset)}
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
                  <label className="tabletop-library-card__folder-select">
                    <span>Pasta</span>
                    <select
                      onChange={(event) => onAssignMapFolder(map.id, event.target.value)}
                      value={resolveMapFolderId(map, mapFolders)}
                    >
                      {moveFolderOptions.map((folder) => (
                        <option key={folder.id || 'root'} value={folder.id}>
                          {folder.label}
                        </option>
                      ))}
                    </select>
                  </label>
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
            const mediaType = getTransitionMediaType(transition)
            const fallbackPreview = targetMap ? getMapLibraryPreviewAsset(targetMap) : ''

            return (
              <article
                className="tabletop-library-card"
                draggable
                key={transition.id}
                onDragEnd={() => setDraggingPayload(null)}
                onDragStart={(event) =>
                  handleItemDragStart(event, {
                    category: 'transitions',
                    id: transition.id,
                  })
                }
              >
                <div className="tabletop-library-card__media tabletop-library-card__media--wide">
                  {mediaType === 'video' ? (
                    <video
                      className="tabletop-library-card__image"
                      muted
                      poster={resolveRuntimeAssetUrl(
                        transition.thumbnailUrl || fallbackPreview,
                      )}
                      preload="metadata"
                      src={resolveRuntimeAssetUrl(transition.assetUrl)}
                    />
                  ) : transition.thumbnailUrl || transition.assetUrl ? (
                    <img
                      alt={transition.name}
                      className="tabletop-library-card__image"
                      decoding="async"
                      loading="lazy"
                      onError={(event) => {
                        if (
                          !fallbackPreview ||
                          event.currentTarget.dataset.fallbackApplied === 'true'
                        ) {
                          return
                        }

                        event.currentTarget.dataset.fallbackApplied = 'true'
                        event.currentTarget.src = resolveRuntimeAssetUrl(fallbackPreview)
                      }}
                      src={resolveRuntimeAssetUrl(transition.thumbnailUrl || transition.assetUrl)}
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
                      <p className="eyebrow">{getTransitionTypeLabel(mediaType)}</p>
                      <h3>{transition.name}</h3>
                    </div>
                    <span className="tag">
                      {targetMap ? `Destino: ${targetMap.name}` : 'Mantem mapa atual'}
                    </span>
                  </div>
                  <p className="support-copy">{transition.summary}</p>
                </div>

                <div className="tabletop-library-card__actions">
                  <label className="tabletop-library-card__folder-select">
                    <span>Pasta</span>
                    <select
                      onChange={(event) =>
                        onAssignTransitionFolder(transition.id, event.target.value)
                      }
                      value={resolveTransitionFolderId(transition, transitionFolders)}
                    >
                      {moveFolderOptions.map((folder) => (
                        <option key={folder.id || 'root'} value={folder.id}>
                          {folder.label}
                        </option>
                      ))}
                    </select>
                  </label>
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
                    {transition.id.startsWith(AUTOMATIC_MUN_TRANSITION_PREFIX)
                      ? 'Restaurar padrao'
                      : 'Excluir'}
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
