import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Clapperboard,
  CornerUpLeft,
  Folder,
  FolderOpen,
  FolderPlus,
  Globe2,
  Grid3X3,
  Map as MapIcon,
  MapPinned,
  Plus,
  Save,
  X,
} from 'lucide-react'
import type { TabletopBiome, TabletopMap, TabletopTransitionAsset } from '../../data/types'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'
import type {
  TabletopLibraryCategory,
  TabletopLibraryFolder,
} from '../../lib/tabletopLibraryState'
import { TabletopVisualLibrary } from './TabletopVisualLibrary'

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
  onReorderFolder: (
    folderId: string,
    targetFolderId: string,
    placement: 'before' | 'after',
  ) => void
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

interface FolderDragPayload {
  category: MapLibraryTab
  folderId: string
}

interface FolderRow {
  depth: number
  folder: FolderView
}

interface FolderContextMenuState {
  folderId: string
  x: number
  y: number
}

const ROOT_FOLDER_ID = ''
const ALL_ITEMS_FOLDER_ID = 'virtual:all-items'
const LIBRARY_DRAG_DATA_TYPE = 'application/x-fushi-library-item'
const FOLDER_DRAG_DATA_TYPE = 'application/x-fushi-library-folder'
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

function buildFolderRows(folders: FolderView[], expandedFolderIds: Set<string>) {
  const rows: FolderRow[] = []
  const visited = new Set<string>()

  function visit(parentId: string, depth: number) {
    folders
      .filter((folder) => folder.parentId === parentId)
      .sort(compareFolders)
      .forEach((folder) => {
        if (visited.has(folder.id)) return
        visited.add(folder.id)
        rows.push({ depth, folder })
        if (expandedFolderIds.has(folder.id)) {
          visit(folder.id, depth + 1)
        }
      })
  }

  visit(ROOT_FOLDER_ID, 0)
  const knownFolderIds = new Set(folders.map((folder) => folder.id))
  folders
    .filter(
      (folder) =>
        !visited.has(folder.id) &&
        folder.parentId !== ROOT_FOLDER_ID &&
        !knownFolderIds.has(folder.parentId),
    )
    .sort(compareFolders)
    .forEach((folder) => {
      visited.add(folder.id)
      rows.push({ depth: 0, folder })
      if (expandedFolderIds.has(folder.id)) {
        visit(folder.id, 1)
      }
    })

  return rows
}

function getAncestorFolderIds(folders: FolderView[], folderId: string) {
  const ancestorIds: string[] = []
  const visitedIds = new Set<string>()
  let currentId = folderId

  while (currentId && !visitedIds.has(currentId)) {
    visitedIds.add(currentId)
    const folder = folders.find((entry) => entry.id === currentId)

    if (!folder) break
    if (folder.parentId) ancestorIds.unshift(folder.parentId)
    currentId = folder.parentId
  }

  return ancestorIds
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

function startFolderDrag(
  event: React.DragEvent,
  payload: FolderDragPayload,
) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData(FOLDER_DRAG_DATA_TYPE, JSON.stringify(payload))
}

function readFolderDragPayload(event: React.DragEvent): FolderDragPayload | null {
  const rawPayload = event.dataTransfer.getData(FOLDER_DRAG_DATA_TYPE)

  if (!rawPayload) return null

  try {
    const payload = JSON.parse(rawPayload) as Partial<FolderDragPayload>

    if (
      (payload.category === 'maps' || payload.category === 'transitions') &&
      typeof payload.folderId === 'string'
    ) {
      return {
        category: payload.category,
        folderId: payload.folderId,
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
  onReorderFolder,
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
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [renamingFolderId, setRenamingFolderId] = useState('')
  const [renamingFolderName, setRenamingFolderName] = useState('')
  const [folderContextMenu, setFolderContextMenu] = useState<FolderContextMenuState | null>(null)
  const [draggingPayload, setDraggingPayload] = useState<LibraryDragPayload | null>(null)
  const [draggingFolderId, setDraggingFolderId] = useState('')
  const [folderDropTarget, setFolderDropTarget] = useState<{
    folderId: string
    placement: 'before' | 'after'
  } | null>(null)
  const lastFocusedMapIdRef = useRef('')

  const categoryFolders = useMemo(
    () => folders.filter((folder) => folder.category === activeTab) as FolderView[],
    [activeTab, folders],
  )
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
    // The automatic interludes are derived after campaign hydration. Keep the
    // MUN home visible while that list is being assembled so a first library
    // open never appears to have lost its campaign transitions.
    const munFolders = [buildMunVirtualFolder()]

    return [
      ...baseFolders,
      ...munFolders,
      ...buildVirtualBiomeFolders('transitions', biomes, []),
    ]
  }, [activeTab, biomes, maps, transitions])
  const effectiveFolders = useMemo(
    () => [...virtualFolders, ...categoryFolders],
    [categoryFolders, virtualFolders],
  )
  const selectedFolderId = selectedFolderIds[activeTab]
  const isAllItemsView = selectedFolderId === ALL_ITEMS_FOLDER_ID
  const selectedFolderExists =
    isAllItemsView ||
    selectedFolderId === ROOT_FOLDER_ID ||
    effectiveFolders.some((folder) => folder.id === selectedFolderId)
  const currentFolderId =
    isAllItemsView || !selectedFolderExists ? ROOT_FOLDER_ID : selectedFolderId
  const breadcrumb = buildBreadcrumb(effectiveFolders, currentFolderId)
  const folderRows = buildFolderRows(effectiveFolders, expandedFolderIds)
  const directFolders = effectiveFolders
    .filter((folder) => folder.parentId === currentFolderId)
    .sort(compareFolders)

  const mapFolderIds = maps.map((map) => resolveMapFolderId(map, mapFolders))
  const transitionFolderIds = transitions.map((transition) =>
    resolveTransitionFolderId(transition, transitionFolders),
  )
  const currentMapName = maps.find((map) => map.id === currentMapId)?.name ?? 'Sem mapa'
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase('pt-BR')
  const selectedMaps = maps
    .filter(
      (map) =>
        isAllItemsView || resolveMapFolderId(map, mapFolders) === currentFolderId,
    )
    .filter((map) =>
      !normalizedSearchQuery ||
      [map.name, map.summary, map.biome, map.biomeId, map.type]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(normalizedSearchQuery),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
  const selectedTransitions = transitions
    .filter(
      (transition) =>
        isAllItemsView ||
        resolveTransitionFolderId(transition, transitionFolders) === currentFolderId,
    )
    .filter((transition) =>
      !normalizedSearchQuery ||
      [transition.name, transition.summary, transition.biomeId, transition.description]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(normalizedSearchQuery),
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
      const focusedFolderId = resolveMapFolderId(focusedMap, mapFolders)
      setActiveTab('maps')
      setSelectedFolderIds((currentFolders) => ({
        ...currentFolders,
        maps: focusedFolderId,
      }))
      setExpandedFolderIds((currentIds) => {
        const nextIds = new Set(currentIds)
        getAncestorFolderIds(effectiveFolders, focusedFolderId).forEach((id) =>
          nextIds.add(id),
        )
        return nextIds
      })
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [effectiveFolders, focusedMapId, mapFolders, maps])

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

  function selectFolder(folderId: string, expandAncestors = true) {
    setSelectedFolderIds((currentFolders) => ({
      ...currentFolders,
      [activeTab]: folderId,
    }))

    if (expandAncestors && folderId && folderId !== ALL_ITEMS_FOLDER_ID) {
      setExpandedFolderIds((currentIds) => {
        const nextIds = new Set(currentIds)
        getAncestorFolderIds(effectiveFolders, folderId).forEach((id) =>
          nextIds.add(id),
        )
        return nextIds
      })
    }
  }

  function toggleFolder(folderId: string) {
    const hasChildren = effectiveFolders.some((folder) => folder.parentId === folderId)
    selectFolder(folderId)

    if (!hasChildren) return

    setExpandedFolderIds((currentIds) => {
      const nextIds = new Set(currentIds)

      if (nextIds.has(folderId)) {
        nextIds.delete(folderId)
      } else {
        nextIds.add(folderId)
      }

      return nextIds
    })
  }

  function handleCreateFolder() {
    const trimmedName = newFolderName.trim()

    if (!trimmedName) {
      return
    }

    onCreateFolder(activeTab, currentFolderId, trimmedName)
    setNewFolderName('')
    setShowNewFolderInput(false)
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

  function handleFolderOrderDragOver(
    event: React.DragEvent<HTMLElement>,
    targetFolder: FolderView,
  ) {
    const folderPayload = readFolderDragPayload(event)
    const sourceFolderId =
      folderPayload?.category === activeTab ? folderPayload.folderId : draggingFolderId

    if (!sourceFolderId) {
      event.preventDefault()
      return
    }

    const sourceFolder = effectiveFolders.find((folder) => folder.id === sourceFolderId)

    if (
      !sourceFolder ||
      sourceFolder.id === targetFolder.id ||
      sourceFolder.isVirtual ||
      targetFolder.isVirtual ||
      sourceFolder.parentId !== targetFolder.parentId
    ) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const bounds = event.currentTarget.getBoundingClientRect()
    const placement = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after'
    setFolderDropTarget({ folderId: targetFolder.id, placement })
  }

  function handleFolderTargetDrop(
    event: React.DragEvent<HTMLElement>,
    targetFolder: FolderView,
  ) {
    event.preventDefault()
    event.stopPropagation()
    const folderPayload = readFolderDragPayload(event)

    if (folderPayload?.category === activeTab) {
      const sourceFolder = effectiveFolders.find(
        (folder) => folder.id === folderPayload.folderId,
      )
      const targetBounds = event.currentTarget.getBoundingClientRect()
      const dropPlacement =
        event.clientY < targetBounds.top + targetBounds.height / 2
          ? 'before'
          : 'after'
      const placement = folderDropTarget?.folderId === targetFolder.id
        ? folderDropTarget.placement
        : dropPlacement

      if (
        sourceFolder &&
        !sourceFolder.isVirtual &&
        !targetFolder.isVirtual &&
        sourceFolder.parentId === targetFolder.parentId &&
        sourceFolder.id !== targetFolder.id
      ) {
        onReorderFolder(sourceFolder.id, targetFolder.id, placement)
      }

      setDraggingFolderId('')
      setFolderDropTarget(null)
      return
    }

    handleFolderDrop(event, targetFolder.id)
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
      '.tabletop-visual-library__content',
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
      toggleFolder(folderId)
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

  const visibleItemCount = activeTab === 'maps' ? selectedMaps.length : selectedTransitions.length
  const sidebar = (
    <>
      <nav className="tabletop-visual-library__nav" aria-label="Tipo de biblioteca">
        <button
          className={activeTab === 'maps' && isAllItemsView ? 'is-active' : ''}
          data-library-view="maps"
          onClick={() => {
            setActiveTab('maps')
            setSelectedFolderIds((current) => ({ ...current, maps: ALL_ITEMS_FOLDER_ID }))
          }}
          type="button"
        >
          <MapIcon size={17} />
          <span>Mapas</span>
          <small>{maps.length}</small>
        </button>
        <button
          className={activeTab === 'transitions' && isAllItemsView ? 'is-active' : ''}
          data-library-view="transitions"
          onClick={() => {
            setActiveTab('transitions')
            setSelectedFolderIds((current) => ({
              ...current,
              transitions: ALL_ITEMS_FOLDER_ID,
            }))
          }}
          type="button"
        >
          <Clapperboard size={17} />
          <span>Interludios</span>
          <small>{transitions.length}</small>
        </button>
        <button
          className={!isAllItemsView && currentFolderId === ROOT_FOLDER_ID ? 'is-active' : ''}
          data-library-view="unfiled"
          onClick={() => selectFolder(ROOT_FOLDER_ID)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleFolderDrop(event, ROOT_FOLDER_ID)}
          type="button"
        >
          <FolderOpen size={17} />
          <span>Sem pasta</span>
          <small>{itemFolderIds.filter((id) => id === ROOT_FOLDER_ID).length}</small>
        </button>
      </nav>

      <div className="tabletop-visual-library__sidebar-heading">
        <span>Pastas</span>
        <button
          aria-label="Criar pasta"
          className={showNewFolderInput ? 'is-active' : ''}
          onClick={() => setShowNewFolderInput((current) => !current)}
          title="Criar pasta"
          type="button"
        >
          <FolderPlus aria-hidden="true" size={15} />
        </button>
      </div>
      <div className="tabletop-visual-library__folder-list">
        {folderRows.map(({ depth, folder }) => {
          const itemCount = getFolderItemCount(folder.id, effectiveFolders, itemFolderIds)
          const isRenaming = renamingFolderId === folder.id
          const hasChildren = effectiveFolders.some(
            (entry) => entry.parentId === folder.id,
          )
          const isExpanded = expandedFolderIds.has(folder.id)
          const dropPlacement =
            folderDropTarget?.folderId === folder.id
              ? folderDropTarget.placement
              : null

          if (folder.isVirtual && itemCount === 0 && folder.id !== MUN_TRANSITION_FOLDER_ID) {
            return null
          }

          return (
            <div
              className={`tabletop-visual-library-folder${
                currentFolderId === folder.id ? ' is-active' : ''
              }${dropPlacement ? ` is-drop-${dropPlacement}` : ''}`}
              data-library-folder-id={folder.id}
              data-library-folder-name={folder.name}
              draggable={!folder.isVirtual && !isRenaming}
              key={folder.id}
              onContextMenu={(event) => handleFolderContextMenu(event, folder.id)}
              onDragEnd={() => {
                setDraggingFolderId('')
                setFolderDropTarget(null)
              }}
              onDragOver={(event) => handleFolderOrderDragOver(event, folder)}
              onDragStart={(event) => {
                if (folder.isVirtual || isRenaming) return
                startFolderDrag(event, { category: activeTab, folderId: folder.id })
                setDraggingFolderId(folder.id)
              }}
              onDrop={(event) => handleFolderTargetDrop(event, folder)}
              style={{ paddingLeft: `${Math.min(depth, 4) * 12}px` }}
            >
              <button
                className="tabletop-visual-library-folder__select tabletop-visual-library-folder__select--tree"
                onClick={() => toggleFolder(folder.id)}
                onKeyDown={(event) => handleFolderKeyDown(event, folder.id)}
                title="Abrir pasta ou soltar um item aqui"
                type="button"
              >
                <span className="tabletop-visual-library-folder__chevron" aria-hidden="true">
                  {hasChildren ? (
                    isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                  ) : null}
                </span>
                {currentFolderId === folder.id ? <FolderOpen size={16} /> : <Folder size={16} />}
                {isRenaming ? (
                  <input
                    autoFocus
                    onChange={(event) => setRenamingFolderName(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                      event.stopPropagation()
                      if (event.key === 'Enter') handleSaveFolderRename(folder.id)
                      if (event.key === 'Escape') setRenamingFolderId('')
                    }}
                    value={renamingFolderName}
                  />
                ) : (
                  <span>{folder.name}</span>
                )}
                <small>{itemCount}</small>
              </button>
              {!folder.isVirtual && isRenaming ? (
                <div className="tabletop-visual-library-folder__actions">
                  <button aria-label="Salvar nome" onClick={() => handleSaveFolderRename(folder.id)} title="Salvar nome" type="button">
                    <Save size={13} />
                  </button>
                  <button aria-label="Cancelar" onClick={() => setRenamingFolderId('')} title="Cancelar" type="button">
                    <X size={13} />
                  </button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {showNewFolderInput ? (
        <div className="tabletop-visual-library__new-folder">
          <input
            autoFocus
            data-testid="map-library-new-folder-name"
            onChange={(event) => setNewFolderName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleCreateFolder()
              if (event.key === 'Escape') setShowNewFolderInput(false)
            }}
            placeholder="Nova pasta"
            value={newFolderName}
          />
          <button aria-label="Criar pasta" data-testid="map-library-create-folder" onClick={handleCreateFolder} title="Criar pasta" type="button">
            <Plus size={16} />
          </button>
        </div>
      ) : null}
    </>
  )

  return (
    <TabletopVisualLibrary
      actions={
        <>
          {onReturnToActiveMap ? (
            <button aria-label="Voltar ao mapa ativo" onClick={onReturnToActiveMap} title="Voltar ao mapa ativo dos jogadores" type="button">
              <MapPinned size={17} />
            </button>
          ) : null}
          {onReturnToWorld ? (
            <button aria-label="Voltar ao MUN" onClick={onReturnToWorld} title="Voltar ao MUN" type="button">
              <Globe2 size={17} />
            </button>
          ) : null}
          <button
            aria-label={isGridVisible ? 'Esconder grid' : 'Mostrar grid'}
            className={isGridVisible ? 'is-active' : ''}
            onClick={onToggleGrid}
            title={isGridVisible ? 'Esconder grid' : 'Mostrar grid'}
            type="button"
          >
            <Grid3X3 size={17} />
          </button>
          <button
            aria-label={activeTab === 'maps' ? 'Criar mapa' : 'Criar interludio'}
            onClick={() => activeTab === 'maps' ? onCreateMap(currentFolderId) : onCreateTransition(currentFolderId)}
            title={activeTab === 'maps' ? 'Criar mapa' : 'Criar interludio'}
            type="button"
          >
            <Plus size={17} />
          </button>
        </>
      }
      className="tabletop-library tabletop-library--visual"
      code="MAP"
      contentHeader={
        <>
          <div>
            <div className="tabletop-visual-library__breadcrumb">
              <button onClick={() => selectFolder(ALL_ITEMS_FOLDER_ID)} type="button">Biblioteca</button>
              {breadcrumb.map((folder) => (
                <span key={folder.id}>
                  <ChevronRight size={13} />
                  <button onClick={() => selectFolder(folder.id)} type="button">{folder.name}</button>
                </span>
              ))}
            </div>
            <h2>{
              isAllItemsView
                ? activeTab === 'maps' ? 'Todos os mapas' : 'Todos os interludios'
                : breadcrumb.at(-1)?.name ?? 'Sem pasta'
            }</h2>
            <small>{visibleItemCount} item(ns) nesta visao</small>
          </div>
          <div className="tag-row">
            <span className="tag">Atual: {currentMapName}</span>
            {focusedMapId ? <span className="tag">Foco MUN</span> : null}
          </div>
        </>
      }
      icon={activeTab === 'maps' ? MapIcon : Clapperboard}
      onSearchChange={setSearchQuery}
      searchPlaceholder={activeTab === 'maps' ? 'Buscar mapas' : 'Buscar interludios'}
      searchValue={searchQuery}
      sidebar={sidebar}
      testId="map-library"
      title="Mapas e interludios"
    >
      <div onDragEnd={() => setDraggingPayload(null)} onDragOver={handleLibraryDragOver}>

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
            data-library-folder-action="back"
            onClick={() =>
              selectFolder(
                effectiveFolders.find((folder) => folder.id === currentFolderId)?.parentId ??
                  ROOT_FOLDER_ID,
              )
            }
            type="button"
          >
            <CornerUpLeft aria-hidden="true" size={24} />
            <strong>Voltar</strong>
          </button>
        ) : null}
        {directFolders.map((folder) => {
          const itemCount = getFolderItemCount(folder.id, effectiveFolders, itemFolderIds)
          const isRenaming = renamingFolderId === folder.id
          const dropPlacement = folderDropTarget?.folderId === folder.id
            ? folderDropTarget.placement
            : null

          if (folder.isVirtual && itemCount === 0) {
            return null
          }

          return (
            <article
              className={`tabletop-library-folder-card${dropPlacement ? ` is-drop-${dropPlacement}` : ''}`}
              data-library-folder-id={folder.id}
              data-library-folder-name={folder.name}
              draggable={!folder.isVirtual}
              key={folder.id}
              onClick={() => selectFolder(folder.id)}
              onDragEnd={() => {
                setDraggingFolderId('')
                setFolderDropTarget(null)
              }}
              onDragOver={(event) => handleFolderOrderDragOver(event, folder)}
              onDragStart={(event) => {
                if (folder.isVirtual) return
                startFolderDrag(event, { category: activeTab, folderId: folder.id })
                setDraggingFolderId(folder.id)
              }}
              onDrop={(event) => handleFolderTargetDrop(event, folder)}
              onContextMenu={(event) => handleFolderContextMenu(event, folder.id)}
              onKeyDown={(event) => handleFolderKeyDown(event, folder.id)}
              role="button"
              tabIndex={0}
              title="Solte um item aqui para mover para esta pasta"
            >
              <span className="tabletop-library-folder-card__icon">
                <FolderOpen aria-hidden="true" size={26} />
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
              {!folder.isVirtual && isRenaming ? (
                <div
                  className="tabletop-library-folder-card__actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    aria-label="Salvar nome"
                    className="tabletop-visual-library-icon-button"
                    onClick={() => handleSaveFolderRename(folder.id)}
                    title="Salvar nome"
                    type="button"
                  >
                    <Save size={15} />
                  </button>
                  <button
                    aria-label="Cancelar"
                    className="tabletop-visual-library-icon-button"
                    onClick={() => setRenamingFolderId('')}
                    title="Cancelar"
                    type="button"
                  >
                    <X size={15} />
                  </button>
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
                data-library-item-id={map.id}
                data-library-item-name={map.name}
                data-library-item-type="map"
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
                data-library-item-id={transition.id}
                data-library-item-name={transition.name}
                data-library-item-type="transition"
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
                      preload="none"
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
      {visibleItemCount === 0 ? (
        <div className="tabletop-visual-library__empty">
          {activeTab === 'maps' ? <MapIcon size={26} /> : <Clapperboard size={26} />}
          <strong>Nenhum item nesta pasta</strong>
          <span>Crie um novo item ou mova um card para esta pasta.</span>
        </div>
      ) : null}
      </div>
    </TabletopVisualLibrary>
  )
}
