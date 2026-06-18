import { useEffect, useMemo, useState } from 'react'
import type { CharacterSheet, FactionItem } from '../../data/types'
import type { TabletopLibraryFolder } from '../../lib/tabletopLibraryState'
import { getCharacterSheetModel } from '../../lib/characterSheet'
import { getFactionLogoUrl } from '../../lib/factionAssets'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'

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
  onMoveFolder: (folderId: string, direction: 'up' | 'down') => void
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

interface FolderContextMenuState {
  folderId: string
  x: number
  y: number
}

const ROOT_FOLDER_ID = ''
const LIBRARY_DRAG_DATA_TYPE = 'application/x-fushi-library-item'
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
  onMoveFolder,
  onRenameFolder,
  onRenameVirtualFaction,
  onSpawn,
  onRemoveFromScene,
}: TabletopNpcLibraryProps) {
  const [selectedFolderId, setSelectedFolderId] = useState(ROOT_FOLDER_ID)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingFolderId, setRenamingFolderId] = useState('')
  const [renamingFolderName, setRenamingFolderName] = useState('')
  const [folderContextMenu, setFolderContextMenu] =
    useState<FolderContextMenuState | null>(null)
  const virtualFolders = useMemo(
    () => buildVirtualFolders(characters, factions),
    [characters, factions],
  )
  const effectiveFolders = [
    ...virtualFolders,
    ...(folders.filter((folder) => folder.category === 'npcs') as FolderView[]),
  ]
  const currentFolderId =
    selectedFolderId === ROOT_FOLDER_ID ||
    effectiveFolders.some((folder) => folder.id === selectedFolderId)
      ? selectedFolderId
      : ROOT_FOLDER_ID
  const breadcrumb = buildBreadcrumb(effectiveFolders, currentFolderId)
  const directFolders = effectiveFolders
    .filter((folder) => folder.parentId === currentFolderId)
    .sort(compareFolders)
  const characterFolderIds = characters.map((character) =>
    resolveCharacterFolderId(character, characterFolders),
  )
  const selectedCharacters = characters
    .filter(
      (character) =>
        resolveCharacterFolderId(character, characterFolders) === currentFolderId,
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

  function handleFolderKeyDown(event: React.KeyboardEvent, folderId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedFolderId(folderId)
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

  return (
    <section className="tabletop-library tabletop-library--folders">
      <div className="tabletop-library__hero">
        <div>
          <p className="eyebrow">NPC</p>
          <h3>Personagens por pastas</h3>
          <p className="support-copy">
            Protagonistas, faccoes, mobs e pastas livres para arrastar personagens sem alterar a ficha.
          </p>
        </div>
        <div className="tag-row">
          <span className="tag">{characters.length} personagens</span>
          <span className="tag">{activeCount} na cena</span>
        </div>
      </div>

      <div className="tabletop-library-toolbar">
        <div className="tabletop-library-breadcrumb">
          <button
            className="tabletop-library-breadcrumb__item"
            onClick={() => setSelectedFolderId(ROOT_FOLDER_ID)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleFolderDrop(event, ROOT_FOLDER_ID)}
            type="button"
          >
            Todos
          </button>
          {breadcrumb.map((folder) => (
            <button
              className="tabletop-library-breadcrumb__item"
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleFolderDrop(event, folder.id)}
              type="button"
            >
              {getFolderLogoUrl(folder) ? (
                <img
                  alt=""
                  className="tabletop-library-breadcrumb__logo"
                  src={resolveRuntimeAssetUrl(getFolderLogoUrl(folder))}
                />
              ) : (
                getFolderVisualLabel(folder)
              )}{' '}
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
        </div>
      </div>

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
            <span>Voltar</span>
            <strong>Voltar</strong>
          </button>
        ) : null}
        {directFolders.map((folder) => {
          const itemCount = getFolderItemCount(folder.id, effectiveFolders, characterFolderIds)
          const canDeleteFolder = !folder.isVirtual && itemCount === 0
          const canEditFolder = !folder.isVirtual
          const isRenaming = renamingFolderId === folder.id

          return (
            <article
              className="tabletop-library-folder-card"
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleFolderDrop(event, folder.id)}
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
                        Subir
                      </button>
                      <button
                        className="button button--compact"
                        onClick={() => onMoveFolder(folder.id, 'down')}
                        type="button"
                      >
                        Descer
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
    </section>
  )
}
