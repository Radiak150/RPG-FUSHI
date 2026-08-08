import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  CornerUpLeft,
  Folder,
  FolderOpen,
  FolderPlus,
  Plus,
  Save,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import type { CharacterSheet, FactionItem } from '../../data/types'
import type { TabletopLibraryFolder } from '../../lib/tabletopLibraryState'
import { getCharacterSheetModel } from '../../lib/characterSheet'
import { getFactionLogoUrl } from '../../lib/factionAssets'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'
import { TabletopVisualLibrary } from './TabletopVisualLibrary'

interface TabletopNpcLibraryProps {
  activeCharacterIds: string[]
  characterFolders: Record<string, string>
  characters: CharacterSheet[]
  factions?: FactionItem[]
  folders: TabletopLibraryFolder[]
  onAssignCharacterFolder: (characterId: string, folderId: string) => void
  onCreateFolder: (parentId: string, name: string) => void
  onDeleteFolder: (folderId: string) => void
  onHideCharacter: (characterId: string) => void
  onReorderFolder: (
    folderId: string,
    targetFolderId: string,
    placement: 'before' | 'after',
  ) => void
  onRenameFolder: (folderId: string, name: string) => void
  onRenameVirtualFaction?: (currentName: string, nextName: string) => void
  onSpawn: (characterId: string) => void
  onRemoveFromScene: (characterId: string) => void
}

interface FolderView extends TabletopLibraryFolder {
  factionId?: string
  factionKey?: string
  isVirtual?: boolean
}

interface NpcDragPayload {
  category: 'npcs'
  id: string
}

interface FolderDragPayload {
  category: 'npcs'
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
const PROTAGONISTS_FOLDER_ID = 'virtual:npcs:protagonistas'
const MAIN_CHARACTERS_FOLDER_ID = 'virtual:npcs:personagens-principais'
const FACTIONS_FOLDER_ID = 'virtual:npcs:factions'
const MOBS_FOLDER_ID = 'virtual:npcs:mobs'

function buildInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
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

function getVirtualFactionFolderId(value: string) {
  return `virtual:npcs:faction:${slugify(value || 'sem-faccao')}`
}

function isVirtualFactionFolderId(folderId: string) {
  return folderId.startsWith('virtual:npcs:faction:')
}

function isMobCharacter(character: CharacterSheet) {
  if (character.tipo === 'mob') {
    return true
  }

  const searchText = [
    character.nome,
    character.faccao,
    character.classe,
    character.origem,
    character.notas,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return /\b(mob|mobs|animal|animais|bicho|bixos|criatura|fera|lobo)\b/.test(searchText)
}

function resolveCharacterFolderId(
  character: CharacterSheet,
  folderAssignments: Record<string, string>,
) {
  const hasAssignedFolder = Object.prototype.hasOwnProperty.call(
    folderAssignments,
    character.id,
  )
  const assignedFolderId = hasAssignedFolder ? folderAssignments[character.id] : undefined

  if (typeof assignedFolderId === 'string') {
    return assignedFolderId
  }

  if (character.tipo === 'player') {
    return PROTAGONISTS_FOLDER_ID
  }

  if (isMobCharacter(character)) {
    return MOBS_FOLDER_ID
  }

  return getVirtualFactionFolderId(character.faccao || 'Sem faccao')
}

function buildVirtualFolders(
  characters: CharacterSheet[],
  factions: FactionItem[] = [],
): FolderView[] {
  const factionById = new Map(factions.map((faction) => [faction.id, faction]))
  const factionEntries = Array.from(
    new Set(
      characters
        .filter((character) => character.tipo !== 'player' && !isMobCharacter(character))
        .map((character) => character.faccao || 'Sem faccao'),
    ),
  )
    .map((factionKey) => {
      const faction = factionById.get(factionKey)

      return {
        faction,
        factionKey,
        label: faction?.nome ?? factionKey,
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))

  return [
    {
      id: PROTAGONISTS_FOLDER_ID,
      category: 'npcs',
      parentId: ROOT_FOLDER_ID,
      name: 'Protagonistas',
      icon: 'PC',
      sortOrder: 10,
      isVirtual: true,
    },
    {
      id: MAIN_CHARACTERS_FOLDER_ID,
      category: 'npcs',
      parentId: ROOT_FOLDER_ID,
      name: 'Personagens principais',
      icon: 'NPC',
      sortOrder: 20,
      isVirtual: true,
    },
    {
      id: MOBS_FOLDER_ID,
      category: 'npcs',
      parentId: ROOT_FOLDER_ID,
      name: 'Mobs',
      icon: 'MOB',
      sortOrder: 30,
      isVirtual: true,
    },
    {
      id: FACTIONS_FOLDER_ID,
      category: 'npcs',
      parentId: MAIN_CHARACTERS_FOLDER_ID,
      name: 'Faccoes',
      icon: 'FAC',
      sortOrder: 10,
      isVirtual: true,
    },
    ...factionEntries.map((entry, index) => ({
      id: getVirtualFactionFolderId(entry.factionKey),
      category: 'npcs' as const,
      parentId: FACTIONS_FOLDER_ID,
      name: entry.label,
      icon: 'F',
      factionId: entry.faction?.id,
      factionKey: entry.factionKey,
      sortOrder: index + 1,
      isVirtual: true,
    })),
  ]
}

function compareFolders(a: FolderView, b: FolderView) {
  const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER
  const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER

  if (orderA !== orderB) {
    return orderA - orderB
  }

  return a.name.localeCompare(b.name)
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
  const visited = new Set<string>()
  let currentId = folderId

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId)
    const folder = folders.find((item) => item.id === currentId)
    if (!folder) break
    if (folder.parentId) ancestorIds.unshift(folder.parentId)
    currentId = folder.parentId
  }

  return ancestorIds
}

function startFolderDrag(event: React.DragEvent, payload: FolderDragPayload) {
  const serializedPayload = JSON.stringify(payload)
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData(FOLDER_DRAG_DATA_TYPE, serializedPayload)
  event.dataTransfer.setData('text/plain', serializedPayload)
}

function readFolderDragPayload(event: React.DragEvent) {
  const serializedPayload = event.dataTransfer.getData(FOLDER_DRAG_DATA_TYPE)
  if (!serializedPayload) return null

  try {
    return JSON.parse(serializedPayload) as FolderDragPayload
  } catch {
    return null
  }
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

function getFolderVisualLabel(folder: FolderView) {
  if (folder.id === PROTAGONISTS_FOLDER_ID) return 'PC'
  if (folder.id === MAIN_CHARACTERS_FOLDER_ID) return 'NPC'
  if (folder.id === MOBS_FOLDER_ID) return 'MOB'
  if (folder.id === FACTIONS_FOLDER_ID) return 'FAC'
  if (isVirtualFactionFolderId(folder.id)) return 'F'

  return folder.icon ?? 'DIR'
}

function getFolderLogoUrl(folder: FolderView) {
  return folder.factionId ? getFactionLogoUrl(folder.factionId) : ''
}

function renderFolderIcon(folder: FolderView, className: string) {
  const logoUrl = getFolderLogoUrl(folder)

  if (logoUrl) {
    return (
      <span className={`${className} ${className}--logo`}>
        <img alt="" src={resolveRuntimeAssetUrl(logoUrl)} />
      </span>
    )
  }

  return <span className={className}>{getFolderVisualLabel(folder)}</span>
}

function startItemDrag(event: React.DragEvent, characterId: string) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData(
    LIBRARY_DRAG_DATA_TYPE,
    JSON.stringify({ category: 'npcs', id: characterId } satisfies NpcDragPayload),
  )
}

function readDragPayload(event: React.DragEvent): NpcDragPayload | null {
  const rawPayload = event.dataTransfer.getData(LIBRARY_DRAG_DATA_TYPE)

  if (!rawPayload) {
    return null
  }

  try {
    const payload = JSON.parse(rawPayload) as Partial<NpcDragPayload>

    if (payload.category === 'npcs' && typeof payload.id === 'string') {
      return {
        category: 'npcs',
        id: payload.id,
      }
    }
  } catch {
    return null
  }

  return null
}

export function TabletopNpcLibrary({
  activeCharacterIds,
  characterFolders,
  characters,
  factions = [],
  folders,
  onAssignCharacterFolder,
  onCreateFolder,
  onDeleteFolder,
  onHideCharacter,
  onReorderFolder,
  onRenameFolder,
  onRenameVirtualFaction,
  onSpawn,
  onRemoveFromScene,
}: TabletopNpcLibraryProps) {
  const [selectedFolderId, setSelectedFolderId] = useState(ROOT_FOLDER_ID)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => new Set())
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [renamingFolderId, setRenamingFolderId] = useState('')
  const [renamingFolderName, setRenamingFolderName] = useState('')
  const [folderContextMenu, setFolderContextMenu] =
    useState<FolderContextMenuState | null>(null)
  const [draggingFolderId, setDraggingFolderId] = useState('')
  const [folderDropTarget, setFolderDropTarget] = useState<{
    folderId: string
    placement: 'before' | 'after'
  } | null>(null)
  const virtualFolders = useMemo(
    () => buildVirtualFolders(characters, factions),
    [characters, factions],
  )
  const effectiveFolders = [
    ...virtualFolders,
    ...(folders.filter((folder) => folder.category === 'npcs') as FolderView[]),
  ]
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
  const characterFolderIds = characters.map((character) =>
    resolveCharacterFolderId(character, characterFolders),
  )
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase('pt-BR')
  const selectedCharacters = characters
    .filter(
      (character) =>
        isAllItemsView ||
        resolveCharacterFolderId(character, characterFolders) === currentFolderId,
    )
    .filter((character) =>
      !normalizedSearchQuery ||
      [character.nome, character.faccao, character.classe, character.origem, character.tipo]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(normalizedSearchQuery),
    )
    .sort((a, b) => a.nome.localeCompare(b.nome))
  const activeCount = characters.filter((character) =>
    activeCharacterIds.includes(character.id),
  ).length

  function handleCreateFolder() {
    const trimmedName = newFolderName.trim()

    if (!trimmedName) {
      return
    }

    onCreateFolder(currentFolderId, trimmedName)
    setNewFolderName('')
    setShowNewFolderInput(false)
  }

  function selectFolder(folderId: string, expandAncestors = true) {
    setSelectedFolderId(folderId)
    if (!expandAncestors || !folderId || folderId === ALL_ITEMS_FOLDER_ID) return

    const ancestorIds = getAncestorFolderIds(effectiveFolders, folderId)
    setExpandedFolderIds((current) => new Set([...current, ...ancestorIds]))
  }

  function toggleFolder(folderId: string) {
    selectFolder(folderId)
    const hasChildren = effectiveFolders.some((folder) => folder.parentId === folderId)
    if (!hasChildren) return

    setExpandedFolderIds((current) => {
      const next = new Set(current)
      if (next.has(folderId)) next.delete(folderId)
      else next.add(folderId)
      return next
    })
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

  function beginRenameFolder(folder: FolderView) {
    if (folder.isVirtual) {
      return
    }

    setRenamingFolderId(folder.id)
    setRenamingFolderName(folder.name)
    setSelectedFolderId(folder.parentId)
    setFolderContextMenu(null)
  }

  function createChildFolder(parentId: string) {
    const name = window.prompt('Nome da nova subpasta')

    if (!name?.trim()) {
      return
    }

    onCreateFolder(parentId, name.trim())
    setFolderContextMenu(null)
  }

  function renameVirtualFaction(folder: FolderView) {
    if (!isVirtualFactionFolderId(folder.id) || folder.factionId || !onRenameVirtualFaction) {
      return
    }

    const nextName = window.prompt('Novo nome da faccao', folder.name)

    if (!nextName?.trim() || nextName.trim() === folder.name) {
      setFolderContextMenu(null)
      return
    }

    onRenameVirtualFaction(folder.factionKey ?? folder.name, nextName.trim())
    setFolderContextMenu(null)
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

  function handleFolderDrop(event: React.DragEvent, folderId: string) {
    event.preventDefault()
    const payload = readDragPayload(event)

    if (!payload) {
      return
    }

    onAssignCharacterFolder(payload.id, folderId)
  }

  function handleFolderOrderDragOver(
    event: React.DragEvent<HTMLElement>,
    targetFolder: FolderView,
  ) {
    const folderPayload = readFolderDragPayload(event)
    const sourceFolderId = folderPayload?.category === 'npcs'
      ? folderPayload.folderId
      : draggingFolderId

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

    if (folderPayload?.category === 'npcs') {
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

  function handleFolderKeyDown(event: React.KeyboardEvent, folderId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleFolder(folderId)
    }
  }

  useEffect(() => {
    if (!folderContextMenu) {
      return
    }

    function closeMenu() {
      setFolderContextMenu(null)
    }

    window.addEventListener('click', closeMenu)
    window.addEventListener('contextmenu', closeMenu)

    return () => {
      window.removeEventListener('click', closeMenu)
      window.removeEventListener('contextmenu', closeMenu)
    }
  }, [folderContextMenu])

  const sidebar = (
    <>
      <nav className="tabletop-visual-library__nav" aria-label="Visoes de personagens">
        <button
          className={isAllItemsView ? 'is-active' : ''}
          onClick={() => setSelectedFolderId(ALL_ITEMS_FOLDER_ID)}
          type="button"
        >
          <Users size={17} />
          <span>Todos</span>
          <small>{characters.length}</small>
        </button>
        <button
          className={!isAllItemsView && currentFolderId === ROOT_FOLDER_ID ? 'is-active' : ''}
          onClick={() => setSelectedFolderId(ROOT_FOLDER_ID)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleFolderDrop(event, ROOT_FOLDER_ID)}
          type="button"
        >
          <Users size={17} />
          <span>Sem pasta</span>
          <small>{characterFolderIds.filter((id) => id === ROOT_FOLDER_ID).length}</small>
        </button>
        <button
          className={currentFolderId === PROTAGONISTS_FOLDER_ID ? 'is-active' : ''}
          onClick={() => setSelectedFolderId(PROTAGONISTS_FOLDER_ID)}
          type="button"
        >
          <UserPlus size={17} />
          <span>Protagonistas</span>
          <small>{characterFolderIds.filter((id) => id === PROTAGONISTS_FOLDER_ID).length}</small>
        </button>
      </nav>

      <div className="tabletop-visual-library__sidebar-heading">
        <span>Pastas e faccoes</span>
        <button
          aria-label="Nova pasta"
          onClick={() => setShowNewFolderInput((current) => !current)}
          title="Nova pasta"
          type="button"
        >
          <FolderPlus aria-hidden="true" size={15} />
        </button>
      </div>
      <div className="tabletop-visual-library__folder-list">
        {folderRows.map(({ depth, folder }) => {
          const itemCount = getFolderItemCount(folder.id, effectiveFolders, characterFolderIds)
          const isRenaming = renamingFolderId === folder.id
          const hasChildren = effectiveFolders.some((item) => item.parentId === folder.id)
          const isExpanded = expandedFolderIds.has(folder.id)
          const dropPlacement = folderDropTarget?.folderId === folder.id
            ? folderDropTarget.placement
            : null

          return (
            <div
              className={`tabletop-visual-library-folder${
                currentFolderId === folder.id ? ' is-active' : ''
              }${dropPlacement ? ` is-drop-${dropPlacement}` : ''}`}
              draggable={!folder.isVirtual}
              key={folder.id}
              onDragEnd={() => {
                setDraggingFolderId('')
                setFolderDropTarget(null)
              }}
              onDragOver={(event) => handleFolderOrderDragOver(event, folder)}
              onDragStart={(event) => {
                if (folder.isVirtual) return
                startFolderDrag(event, { category: 'npcs', folderId: folder.id })
                setDraggingFolderId(folder.id)
              }}
              onDrop={(event) => handleFolderTargetDrop(event, folder)}
              onContextMenu={(event) => handleFolderContextMenu(event, folder.id)}
              style={{ paddingLeft: `${Math.min(depth, 4) * 12}px` }}
            >
              <button
                className="tabletop-visual-library-folder__select tabletop-visual-library-folder__select--tree"
                onClick={() => toggleFolder(folder.id)}
                onKeyDown={(event) => handleFolderKeyDown(event, folder.id)}
                title="Abrir pasta ou soltar um personagem aqui"
                type="button"
              >
                <span className="tabletop-visual-library-folder__chevron">
                  {hasChildren
                    ? isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    : null}
                </span>
                {getFolderLogoUrl(folder)
                  ? renderFolderIcon(folder, 'tabletop-visual-library-folder__logo')
                  : currentFolderId === folder.id
                    ? <FolderOpen size={16} />
                    : <Folder size={16} />}
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
                  <button aria-label="Salvar nome" onClick={() => handleSaveFolderRename(folder.id)} title="Salvar nome" type="button"><Save size={13} /></button>
                  <button aria-label="Cancelar" onClick={() => setRenamingFolderId('')} title="Cancelar" type="button"><X size={13} /></button>
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
            onChange={(event) => setNewFolderName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleCreateFolder()
              if (event.key === 'Escape') setShowNewFolderInput(false)
            }}
            placeholder="Nova pasta"
            value={newFolderName}
          />
          <button aria-label="Criar pasta" onClick={handleCreateFolder} title="Criar pasta" type="button"><Plus size={16} /></button>
        </div>
      ) : null}
    </>
  )

  return (
    <TabletopVisualLibrary
      actions={
        <button aria-label="Criar pasta" onClick={() => setShowNewFolderInput(true)} title="Criar pasta" type="button">
          <Plus size={17} />
        </button>
      }
      className="tabletop-library tabletop-library--visual"
      code="NPC"
      contentHeader={
        <>
          <div>
            <div className="tabletop-visual-library__breadcrumb">
              <button onClick={() => setSelectedFolderId(ALL_ITEMS_FOLDER_ID)} type="button">Biblioteca</button>
              {breadcrumb.map((folder) => (
                <span key={folder.id}>
                  <ChevronRight size={13} />
                  <button onClick={() => setSelectedFolderId(folder.id)} type="button">{folder.name}</button>
                </span>
              ))}
            </div>
            <h2>{
              isAllItemsView
                ? 'Todos os personagens'
                : breadcrumb.at(-1)?.name ?? 'Personagens sem pasta'
            }</h2>
            <small>{selectedCharacters.length} personagem(ns) nesta visao</small>
          </div>
          <div className="tag-row">
            <span className="tag">{characters.length} fichas</span>
            <span className="tag">{activeCount} na cena</span>
          </div>
        </>
      }
      icon={Users}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Buscar personagem"
      searchValue={searchQuery}
      sidebar={sidebar}
      testId="npc-library"
      title="Personagens e criaturas"
    >

      <div className="tabletop-library-folder-grid">
        {currentFolderId ? (
          <button
            className="tabletop-library-folder-card tabletop-library-folder-card--back"
            onClick={() =>
              setSelectedFolderId(
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
          const itemCount = getFolderItemCount(folder.id, effectiveFolders, characterFolderIds)
          const isRenaming = renamingFolderId === folder.id
          const dropPlacement = folderDropTarget?.folderId === folder.id
            ? folderDropTarget.placement
            : null

          return (
            <article
              className={`tabletop-library-folder-card${dropPlacement ? ` is-drop-${dropPlacement}` : ''}`}
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
                startFolderDrag(event, { category: 'npcs', folderId: folder.id })
                setDraggingFolderId(folder.id)
              }}
              onDrop={(event) => handleFolderTargetDrop(event, folder)}
              onKeyDown={(event) => handleFolderKeyDown(event, folder.id)}
              onContextMenu={(event) => handleFolderContextMenu(event, folder.id)}
              role="button"
              tabIndex={0}
              title="Solte um personagem aqui para mover para esta pasta"
            >
              {renderFolderIcon(folder, 'tabletop-library-folder-card__icon')}
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
              {!folder.isVirtual && isRenaming ? (
                <div
                  className="tabletop-library-folder-card__actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button aria-label="Salvar nome" className="tabletop-visual-library-icon-button" onClick={() => handleSaveFolderRename(folder.id)} title="Salvar nome" type="button"><Save size={15} /></button>
                  <button aria-label="Cancelar" className="tabletop-visual-library-icon-button" onClick={() => setRenamingFolderId('')} title="Cancelar" type="button"><X size={15} /></button>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>

      <div className="tabletop-library__grid tabletop-library__grid--npcs">
        {selectedCharacters.map((character) => {
          const model = getCharacterSheetModel(character)
          const initials = buildInitials(model.nome)
          const activeInstances = activeCharacterIds.filter(
            (characterId) => characterId === character.id,
          ).length
          const isActive = activeInstances > 0
          const isMob = character.tipo === 'mob'
          const typeLabel =
            character.tipo === 'player' ? 'Player' : character.tipo === 'mob' ? 'Mob' : 'NPC'

          return (
            <article
              className={`tabletop-library-card tabletop-library-card--npc${
                isActive ? ' tabletop-library-card--active' : ''
              }`}
              draggable
              key={character.id}
              onDragStart={(event) => startItemDrag(event, character.id)}
            >
              <div className="tabletop-library-npc tabletop-library-npc--compact">
                <div className="tabletop-library-npc__portrait tabletop-library-npc__portrait--square">
                  {model.avatarUrl ? (
                    <img
                      alt={model.nome}
                      className="tabletop-library-npc__portrait-image"
                      src={resolveRuntimeAssetUrl(model.avatarUrl)}
                    />
                  ) : (
                    <div
                      className="tabletop-library-card__placeholder"
                      data-tone={model.tone}
                    >
                      {initials}
                    </div>
                  )}
                </div>

                <div className="tabletop-library-npc__identity tabletop-library-npc__identity--compact">
                  <p className="eyebrow">{typeLabel}</p>
                  <h3>{model.nome}</h3>
                  <div className="tag-row">
                    <span className="tag">{character.faccao || 'Sem faccao'}</span>
                  </div>
                </div>
              </div>

              <div className="tabletop-library-card__actions">
                <button
                  className={`button${isActive ? '' : ' button--primary'}`}
                  disabled={isActive && !isMob}
                  onClick={() => onSpawn(character.id)}
                  type="button"
                >
                  {isMob && isActive
                    ? `Spawnar +1 (${activeInstances})`
                    : isActive
                      ? 'Ja na cena'
                      : 'Spawnar'}
                </button>
                {isActive ? (
                  <button
                    className="button"
                    onClick={() => onRemoveFromScene(character.id)}
                    type="button"
                  >
                    {isMob ? 'Remover 1' : 'Remover'}
                  </button>
                ) : null}
                <button
                  className="button"
                  onClick={() => {
                    if (window.confirm(`Ocultar "${model.nome}" desta biblioteca? A ficha nao sera apagada.`)) {
                      onHideCharacter(character.id)
                    }
                  }}
                  type="button"
                >
                  Ocultar
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {folderContextMenu ? (() => {
        const folder = effectiveFolders.find((item) => item.id === folderContextMenu.folderId)

        if (!folder) {
          return null
        }

        const itemCount = getFolderItemCount(folder.id, effectiveFolders, characterFolderIds)
        const canDeleteFolder = !folder.isVirtual && itemCount === 0
        const canRenameVirtualFaction =
          Boolean(onRenameVirtualFaction) && isVirtualFactionFolderId(folder.id) && !folder.factionId

        return (
          <div
            className="tabletop-library-folder-menu"
            onClick={(event) => event.stopPropagation()}
            role="menu"
            style={{
              left: folderContextMenu.x,
              top: folderContextMenu.y,
            }}
          >
            <button onClick={() => setSelectedFolderId(folder.id)} type="button">
              Abrir pasta
            </button>
            <button
              disabled={folder.isVirtual && !canRenameVirtualFaction}
              onClick={() =>
                canRenameVirtualFaction ? renameVirtualFaction(folder) : beginRenameFolder(folder)
              }
              type="button"
            >
              {canRenameVirtualFaction ? 'Renomear faccao' : 'Renomear'}
            </button>
            <button onClick={() => createChildFolder(folder.id)} type="button">
              Nova subpasta
            </button>
            <button
              className="tabletop-library-folder-menu__danger"
              disabled={!canDeleteFolder}
              onClick={() => {
                onDeleteFolder(folder.id)
                setFolderContextMenu(null)
              }}
              type="button"
            >
              Excluir pasta
            </button>
          </div>
        )
      })() : null}
      {selectedCharacters.length === 0 ? (
        <div className="tabletop-visual-library__empty">
          <Users size={26} />
          <strong>Nenhum personagem nesta pasta</strong>
          <span>Arraste uma ficha para ca ou escolha outra pasta.</span>
        </div>
      ) : null}
    </TabletopVisualLibrary>
  )
}
