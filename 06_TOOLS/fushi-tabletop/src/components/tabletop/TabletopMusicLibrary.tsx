import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'
import {
  Activity,
  ChevronDown,
  ChevronRight,
  CornerUpLeft,
  Disc3,
  Edit3,
  Folder,
  FolderOpen,
  FolderPlus,
  Heart,
  Image as ImageIcon,
  ListMusic,
  Music2,
  Pause,
  Play,
  Save,
  Search,
  SlidersHorizontal,
  Square,
  Trash2,
  Upload,
  Volume2,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { TabletopMediaAsset } from '../../data/types'
import { uploadPhysicalAsset } from '../../lib/physicalAssets'
import type {
  TabletopLibraryFolder,
  TabletopMusicFavoritePreset,
} from '../../lib/tabletopLibraryState'

export interface TabletopMusicLibraryItem extends TabletopMediaAsset {
  libraryType: 'music' | 'ambience'
  categoryLabel: string
}

export interface TabletopMusicCreateInput {
  category: string
  folderId: string
  libraryType: 'music' | 'ambience'
  name: string
  previewImage?: string
  source: string
  summary: string
}

export interface TabletopMusicUpdateInput {
  category: string
  name: string
  previewImage?: string
  source: string
  summary: string
}

export type TabletopMixerTrackStatus = 'playing' | 'paused' | 'stopped'

export interface TabletopMixerTrackState {
  currentTime: number
  duration: number
  status: TabletopMixerTrackStatus
  updatedAt: number
  volume: number
}

interface TabletopMusicLibraryProps {
  campaignId?: string
  favoriteTrackIds: string[]
  favoritePresets: TabletopMusicFavoritePreset[]
  folders: TabletopLibraryFolder[]
  mixerTracks: Record<string, TabletopMixerTrackState>
  statusMessage: string
  trackFolders: Record<string, string>
  trackVolumes: Record<string, number>
  tracks: TabletopMusicLibraryItem[]
  onAssignTrackFolder: (trackId: string, folderId: string) => void
  onCreateFolder: (parentId: string, name: string) => void
  onCreateTrack: (input: TabletopMusicCreateInput) => void
  onDeleteFolder: (folderId: string) => void
  onDeleteTrack: (trackId: string) => void
  onReorderFolder: (
    folderId: string,
    targetFolderId: string,
    placement: 'before' | 'after',
  ) => void
  onPauseAll: () => void
  onPauseTrack: (trackId: string) => void
  onApplyFavoritePreset: (presetId: string) => void
  onDeleteFavoritePreset: (presetId: string) => void
  onPlayFavorites: () => void
  onPlayFavoritePreset: (presetId: string) => void
  onPlayTrack: (track: TabletopMusicLibraryItem) => void
  onRenameFavoritePreset: (presetId: string, name: string) => void
  onSaveFavoritePreset: (name: string) => void
  onRenameFolder: (folderId: string, name: string) => void
  onSeekTrack: (trackId: string, time: number) => void
  onStopAll: () => void
  onStopTrack: (trackId: string) => void
  onToggleFavorite: (trackId: string) => void
  onTrackVolumeChange: (trackId: string, volume: number) => void
  onUpdateTrack: (trackId: string, input: TabletopMusicUpdateInput) => void
}

interface FolderView extends TabletopLibraryFolder {
  isVirtual?: boolean
}

interface FolderRow {
  depth: number
  folder: FolderView
}

interface MusicDragPayload {
  category: 'music'
  id: string
}

interface MusicFolderDragPayload {
  category: 'music'
  folderId: string
}

interface FolderContextMenuState {
  folderId: string
  x: number
  y: number
}

interface TrackVisual {
  color: string
  Icon: LucideIcon
}

const ROOT_FOLDER_ID = ''
const ALL_TRACKS_FOLDER_ID = 'virtual:music:todos'
const ACTIVE_FOLDER_ID = 'virtual:music:ativos'
const FAVORITES_FOLDER_ID = 'virtual:music:favoritos'
const LIBRARY_DRAG_DATA_TYPE = 'application/x-fushi-library-item'
const FOLDER_DRAG_DATA_TYPE = 'application/x-fushi-library-folder'
const DEFAULT_TRACK_VOLUME = 0.35
const AUDIO_CATEGORY_OPTIONS = [
  'efeitos de trilha',
  'Musicas de trilha',
  'Musicas Cinematicas',
  'Musicas para batalhas',
  'Musicas temas',
  'Musicas para Expansao de dominio e habilidades especiais',
  'Efeitos sonoros de impactos narrativos',
]
const AUDIO_FILE_ACCEPT =
  'audio/*,video/*,.mp3,.m4a,.ogg,.wav,.flac,.aac,.mp4,.webm,.mov,.mkv'
const IMAGE_FILE_ACCEPT = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp'

const TRACK_VISUALS: Array<{ terms: string[]; visual: TrackVisual }> = [
  { terms: ['chuva', 'agua', 'mar'], visual: { color: '#4f9fbd', Icon: Activity } },
  { terms: ['batalha', 'combate', 'impacto'], visual: { color: '#c66b4e', Icon: Disc3 } },
  { terms: ['cinematic', 'expansao', 'especial'], visual: { color: '#a477cf', Icon: ListMusic } },
  { terms: ['tema', 'personagem'], visual: { color: '#d0a14d', Icon: Music2 } },
]

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getVirtualMusicFolderId(value: string) {
  return `virtual:music:${slugify(value || 'sem-categoria')}`
}

function resolveTrackFolderId(
  track: TabletopMusicLibraryItem,
  folderAssignments: Record<string, string>,
) {
  const hasAssignedFolder = Object.prototype.hasOwnProperty.call(folderAssignments, track.id)
  const assignedFolderId = hasAssignedFolder ? folderAssignments[track.id] : track.folderId

  if (typeof assignedFolderId === 'string') {
    return assignedFolderId
  }

  return getVirtualMusicFolderId(track.categoryLabel || track.category || 'Sem categoria')
}

function buildVirtualFolders(tracks: TabletopMusicLibraryItem[]): FolderView[] {
  const labels = Array.from(
    new Set(tracks.map((track) => track.categoryLabel || track.category || 'Sem categoria')),
  ).sort((a, b) => a.localeCompare(b))

  return labels.map((label, index) => ({
    id: getVirtualMusicFolderId(label),
    category: 'music',
    parentId: ROOT_FOLDER_ID,
    name: label,
    icon: 'music',
    sortOrder: index + 1,
    isVirtual: true,
  }))
}

function compareFolders(a: FolderView, b: FolderView) {
  const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER
  const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER

  return orderA === orderB ? a.name.localeCompare(b.name) : orderA - orderB
}

function buildFolderRows(folders: FolderView[], expandedFolderIds: Set<string>) {
  const rows: FolderRow[] = []
  const visited = new Set<string>()

  function visit(parentId: string, depth: number) {
    folders
      .filter((folder) => folder.parentId === parentId)
      .sort(compareFolders)
      .forEach((folder) => {
        if (visited.has(folder.id)) {
          return
        }
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

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00'
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Nao foi possivel ler a midia local.'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(blob)
  })
}

function isVideoFile(file: File) {
  const name = file.name.toLowerCase()
  return (
    file.type.startsWith('video/') ||
    name.endsWith('.mp4') ||
    name.endsWith('.webm') ||
    name.endsWith('.mov') ||
    name.endsWith('.mkv')
  )
}

function getTrackState(
  trackId: string,
  mixerTracks: Record<string, TabletopMixerTrackState>,
  trackVolumes: Record<string, number>,
): TabletopMixerTrackState {
  return (
    mixerTracks[trackId] ?? {
      currentTime: 0,
      duration: 0,
      status: 'stopped',
      updatedAt: Date.now(),
      volume: trackVolumes[trackId] ?? DEFAULT_TRACK_VOLUME,
    }
  )
}

function startItemDrag(event: DragEvent, trackId: string) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData(
    LIBRARY_DRAG_DATA_TYPE,
    JSON.stringify({ category: 'music', id: trackId } satisfies MusicDragPayload),
  )
}

function readDragPayload(event: DragEvent): MusicDragPayload | null {
  const rawPayload = event.dataTransfer.getData(LIBRARY_DRAG_DATA_TYPE)
  if (!rawPayload) {
    return null
  }

  try {
    const payload = JSON.parse(rawPayload) as Partial<MusicDragPayload>
    return payload.category === 'music' && typeof payload.id === 'string'
      ? { category: 'music', id: payload.id }
      : null
  } catch {
    return null
  }
}

function startFolderDrag(event: DragEvent, folderId: string) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData(
    FOLDER_DRAG_DATA_TYPE,
    JSON.stringify({ category: 'music', folderId } satisfies MusicFolderDragPayload),
  )
}

function readFolderDragPayload(event: DragEvent): MusicFolderDragPayload | null {
  const rawPayload = event.dataTransfer.getData(FOLDER_DRAG_DATA_TYPE)
  if (!rawPayload) return null

  try {
    const payload = JSON.parse(rawPayload) as Partial<MusicFolderDragPayload>
    return payload.category === 'music' && typeof payload.folderId === 'string'
      ? { category: 'music', folderId: payload.folderId }
      : null
  } catch {
    return null
  }
}

function getTrackVisual(track: TabletopMusicLibraryItem): TrackVisual {
  const searchable = `${track.name} ${track.categoryLabel} ${track.category ?? ''}`.toLowerCase()
  return (
    TRACK_VISUALS.find(({ terms }) => terms.some((term) => searchable.includes(term)))?.visual ?? {
      color: track.libraryType === 'ambience' ? '#4f9c88' : '#b08a4d',
      Icon: track.libraryType === 'ambience' ? Activity : Music2,
    }
  )
}

function getStatusLabel(status: TabletopMixerTrackStatus) {
  if (status === 'playing') return 'Tocando'
  if (status === 'paused') return 'Pausado'
  return 'Parado'
}

export function TabletopMusicLibrary({
  campaignId,
  favoriteTrackIds,
  favoritePresets,
  folders,
  mixerTracks,
  statusMessage,
  trackFolders,
  trackVolumes,
  tracks,
  onAssignTrackFolder,
  onCreateFolder,
  onCreateTrack,
  onDeleteFolder,
  onDeleteTrack,
  onReorderFolder,
  onPauseAll,
  onPauseTrack,
  onApplyFavoritePreset,
  onDeleteFavoritePreset,
  onPlayFavorites,
  onPlayFavoritePreset,
  onPlayTrack,
  onRenameFavoritePreset,
  onSaveFavoritePreset,
  onRenameFolder,
  onSeekTrack,
  onStopAll,
  onStopTrack,
  onToggleFavorite,
  onTrackVolumeChange,
  onUpdateTrack,
}: TabletopMusicLibraryProps) {
  const createAudioInputRef = useRef<HTMLInputElement | null>(null)
  const createImageInputRef = useRef<HTMLInputElement | null>(null)
  const editAudioInputRef = useRef<HTMLInputElement | null>(null)
  const editImageInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState(ROOT_FOLDER_ID)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newPresetName, setNewPresetName] = useState('')
  const [renamingFolderId, setRenamingFolderId] = useState('')
  const [renamingFolderName, setRenamingFolderName] = useState('')
  const [isCreatingTrack, setIsCreatingTrack] = useState(false)
  const [isMixerOpen, setIsMixerOpen] = useState(false)
  const [editingTrackId, setEditingTrackId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeScrubTrackId, setActiveScrubTrackId] = useState('')
  const [scrubValues, setScrubValues] = useState<Record<string, number>>({})
  const [uploadStatus, setUploadStatus] = useState('')
  const [folderContextMenu, setFolderContextMenu] =
    useState<FolderContextMenuState | null>(null)
  const [draggingFolderId, setDraggingFolderId] = useState('')
  const [folderDropTarget, setFolderDropTarget] = useState<{
    folderId: string
    placement: 'before' | 'after'
  } | null>(null)
  const [createForm, setCreateForm] = useState<TabletopMusicCreateInput>({
    category: 'Musicas de trilha',
    folderId: ROOT_FOLDER_ID,
    libraryType: 'music',
    name: '',
    previewImage: '',
    source: '',
    summary: '',
  })
  const [editForm, setEditForm] = useState<TabletopMusicUpdateInput>({
    category: '',
    name: '',
    previewImage: '',
    source: '',
    summary: '',
  })

  const virtualFolders = useMemo(() => buildVirtualFolders(tracks), [tracks])
  const effectiveFolders = useMemo(
    () => [
      ...virtualFolders,
      ...(folders.filter((folder) => folder.category === 'music') as FolderView[]),
    ],
    [folders, virtualFolders],
  )
  const folderRows = useMemo(
    () => buildFolderRows(effectiveFolders, expandedFolderIds),
    [effectiveFolders, expandedFolderIds],
  )
  const isAllTracksView = selectedFolderId === ALL_TRACKS_FOLDER_ID
  const isSelectedSpecialView =
    isAllTracksView ||
    selectedFolderId === ACTIVE_FOLDER_ID ||
    selectedFolderId === FAVORITES_FOLDER_ID
  const currentFolderId =
    isSelectedSpecialView ||
    selectedFolderId === ROOT_FOLDER_ID ||
    effectiveFolders.some((folder) => folder.id === selectedFolderId)
      ? selectedFolderId
      : ROOT_FOLDER_ID
  const isActiveView = currentFolderId === ACTIVE_FOLDER_ID
  const isFavoritesView = currentFolderId === FAVORITES_FOLDER_ID
  const isSpecialView = isAllTracksView || isActiveView || isFavoritesView
  const currentFolder = effectiveFolders.find((folder) => folder.id === currentFolderId) ?? null
  const breadcrumb = buildBreadcrumb(effectiveFolders, currentFolderId)
  const directFolders = effectiveFolders
    .filter((folder) => folder.parentId === currentFolderId)
    .sort(compareFolders)
  const trackFolderIds = tracks.map((track) => resolveTrackFolderId(track, trackFolders))
  const activeTracks = tracks.filter(
    (track) => getTrackState(track.id, mixerTracks, trackVolumes).status !== 'stopped',
  )
  const favoriteTracks = favoriteTrackIds
    .map((trackId) => tracks.find((track) => track.id === trackId))
    .filter((track): track is TabletopMusicLibraryItem => Boolean(track))
  const selectedTracks = (
    isAllTracksView
      ? tracks
      : isActiveView
        ? activeTracks
        : isFavoritesView
          ? favoriteTracks
          : tracks.filter(
              (track) => resolveTrackFolderId(track, trackFolders) === currentFolderId,
            )
  )
    .filter((track) => {
      const query = searchQuery.trim().toLowerCase()
      return (
        !query ||
        `${track.name} ${track.summary} ${track.categoryLabel}`.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => a.name.localeCompare(b.name))
  const editingTrack = tracks.find((track) => track.id === editingTrackId) ?? null

  useEffect(() => {
    if (!folderContextMenu) return

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

  function handleCreateFolder() {
    const trimmedName = newFolderName.trim()
    if (!trimmedName || isSpecialView) {
      return
    }
    onCreateFolder(currentFolderId, trimmedName)
    setNewFolderName('')
    setShowNewFolderInput(false)
  }

  function selectFolder(folderId: string, expandAncestors = true) {
    setSelectedFolderId(folderId)
    if (!expandAncestors || !folderId || folderId === ALL_TRACKS_FOLDER_ID) return

    setExpandedFolderIds((current) =>
      new Set([...current, ...getAncestorFolderIds(effectiveFolders, folderId)]),
    )
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

  function handleSaveFavoritePreset() {
    const trimmedName = newPresetName.trim() || `Favoritos ${favoritePresets.length + 1}`
    onSaveFavoritePreset(trimmedName)
    setNewPresetName('')
  }

  function handleRenameFavoritePreset(preset: TabletopMusicFavoritePreset) {
    const nextName = window.prompt('Nome do preset de favoritos', preset.name)?.trim()
    if (nextName) {
      onRenameFavoritePreset(preset.id, nextName)
    }
  }

  async function saveAudioFile(file: File) {
    const isVideo = isVideoFile(file)
    let uploadedAsset = null as Awaited<ReturnType<typeof uploadPhysicalAsset>> | null

    if (isVideo && window.fushiDesktop?.extractAudioFromMedia) {
      setUploadStatus('Extraindo audio...')
      const extractedAsset = await window.fushiDesktop.extractAudioFromMedia(campaignId, {
        contentType: file.type || 'application/octet-stream',
        dataUrl: await readBlobAsDataUrl(file),
        filename: file.name,
      })
      if (extractedAsset.ok && extractedAsset.url && extractedAsset.filename) {
        uploadedAsset = {
          ok: true,
          category: 'audio',
          contentType: extractedAsset.contentType ?? 'audio/mp4',
          filename: extractedAsset.filename,
          size: extractedAsset.size ?? file.size,
          storagePath: extractedAsset.storagePath ?? extractedAsset.url,
          url: extractedAsset.url,
        }
      }
    }

    return (
      uploadedAsset ??
      uploadPhysicalAsset(file, {
        campaignId,
        category: 'audio',
        contentType: file.type || 'application/octet-stream',
        filename: file.name,
      })
    )
  }

  async function handleAudioSelect(event: ChangeEvent<HTMLInputElement>, mode: 'create' | 'edit') {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadStatus('Salvando audio...')

    try {
      const uploadedAsset = await saveAudioFile(file)
      if (mode === 'create') {
        setCreateForm((current) => ({
          ...current,
          name: current.name || file.name.replace(/\.[^.]+$/, ''),
          source: uploadedAsset.url,
        }))
      } else {
        setEditForm((current) => ({ ...current, source: uploadedAsset.url }))
      }
      setUploadStatus(`Audio pronto: ${uploadedAsset.filename}`)
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : 'Erro ao salvar audio')
    } finally {
      event.target.value = ''
    }
  }

  async function handleImageSelect(event: ChangeEvent<HTMLInputElement>, mode: 'create' | 'edit') {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadStatus('Salvando capa...')

    try {
      const uploadedAsset = await uploadPhysicalAsset(file, {
        campaignId,
        category: 'images',
        contentType: file.type || 'image/png',
        filename: file.name,
      })
      if (mode === 'create') {
        setCreateForm((current) => ({ ...current, previewImage: uploadedAsset.url }))
      } else {
        setEditForm((current) => ({ ...current, previewImage: uploadedAsset.url }))
      }
      setUploadStatus(`Capa pronta: ${uploadedAsset.filename}`)
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : 'Erro ao salvar capa')
    } finally {
      event.target.value = ''
    }
  }

  function handleSaveTrack() {
    if (!createForm.name.trim() || !createForm.source) {
      setUploadStatus('Informe nome e arquivo de audio')
      return
    }

    onCreateTrack({
      ...createForm,
      folderId: isSpecialView ? ROOT_FOLDER_ID : currentFolderId,
      name: createForm.name.trim(),
      summary: createForm.summary.trim() || 'Faixa local adicionada pelo mestre.',
      category: createForm.category.trim() || 'Musicas de trilha',
    })
    setCreateForm({
      category: 'Musicas de trilha',
      folderId: ROOT_FOLDER_ID,
      libraryType: 'music',
      name: '',
      previewImage: '',
      source: '',
      summary: '',
    })
    setIsCreatingTrack(false)
    setUploadStatus('')
  }

  function beginTrackEdit(track: TabletopMusicLibraryItem) {
    setEditingTrackId(track.id)
    setEditForm({
      category: track.category ?? track.categoryLabel,
      name: track.name,
      previewImage: track.previewImage ?? '',
      source: track.source,
      summary: track.summary,
    })
    setUploadStatus('')
  }

  function handleSaveTrackUpdate() {
    if (!editingTrack || !editForm.name.trim() || !editForm.source) {
      setUploadStatus('Nome e audio sao obrigatorios')
      return
    }
    onUpdateTrack(editingTrack.id, {
      ...editForm,
      category: editForm.category.trim() || editingTrack.categoryLabel,
      name: editForm.name.trim(),
      summary: editForm.summary.trim() || 'Som da biblioteca FUSHI.',
    })
    setEditingTrackId('')
    setUploadStatus('')
  }

  function handleFolderDrop(event: DragEvent, folderId: string) {
    event.preventDefault()
    const payload = readDragPayload(event)
    if (payload) {
      onAssignTrackFolder(payload.id, folderId)
    }
  }

  function handleFolderOrderDragOver(
    event: DragEvent<HTMLElement>,
    targetFolder: FolderView,
  ) {
    const folderPayload = readFolderDragPayload(event)
    const sourceFolderId = folderPayload?.folderId ?? draggingFolderId

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

  function handleFolderTargetDrop(event: DragEvent<HTMLElement>, targetFolder: FolderView) {
    event.preventDefault()
    event.stopPropagation()
    const folderPayload = readFolderDragPayload(event)

    if (folderPayload) {
      const sourceFolder = effectiveFolders.find(
        (folder) => folder.id === folderPayload.folderId,
      )
      const targetBounds = event.currentTarget.getBoundingClientRect()
      const dropPlacement =
        event.clientY < targetBounds.top + targetBounds.height / 2
          ? 'before'
          : 'after'
      const placement =
        folderDropTarget?.folderId === targetFolder.id
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

  function handleFolderContextMenu(event: React.MouseEvent, folderId: string) {
    event.preventDefault()
    event.stopPropagation()
    setFolderContextMenu({ folderId, x: event.clientX, y: event.clientY })
  }

  function beginFolderRename(folder: FolderView) {
    if (folder.isVirtual) return
    setRenamingFolderId(folder.id)
    setRenamingFolderName(folder.name)
    setFolderContextMenu(null)
  }

  function createChildFolder(folder: FolderView) {
    setFolderContextMenu(null)
    const name = window.prompt('Nome da nova subpasta')
    if (name?.trim()) onCreateFolder(folder.id, name.trim())
  }

  function deleteFolderFromMenu(folder: FolderView) {
    setFolderContextMenu(null)
    if (folder.isVirtual) return

    if (window.confirm(`Excluir a pasta "${folder.name}"? O conteudo sera movido para a pasta anterior.`)) {
      onDeleteFolder(folder.id)
    }
  }

  function handleFolderKeyDown(event: KeyboardEvent, folderId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleFolder(folderId)
    }
  }

  function handleDeleteTrack(track: TabletopMusicLibraryItem) {
    if (window.confirm(`Excluir "${track.name}" da biblioteca de sons?`)) {
      onDeleteTrack(track.id)
      if (editingTrackId === track.id) {
        setEditingTrackId('')
      }
    }
  }

  function renderTrackCard(track: TabletopMusicLibraryItem) {
    const state = getTrackState(track.id, mixerTracks, trackVolumes)
    const isPlaying = state.status === 'playing'
    const isFavorite = favoriteTrackIds.includes(track.id)
    const canScrub = state.duration > 0
    const displayedTime =
      activeScrubTrackId === track.id
        ? scrubValues[track.id] ?? state.currentTime
        : state.currentTime
    const maxTime = Math.max(state.duration, 1)
    const { color, Icon } = getTrackVisual(track)

    function handleSeekInput(value: number) {
      const nextTime = Math.min(Math.max(0, value), maxTime)
      setScrubValues((current) => ({ ...current, [track.id]: nextTime }))
      onSeekTrack(track.id, nextTime)
    }

    return (
      <article
        className={`tabletop-msc-track${isPlaying ? ' tabletop-msc-track--playing' : ''}`}
        data-track-id={track.id}
        draggable
        key={track.id}
        onDragStart={(event) => startItemDrag(event, track.id)}
      >
        <div className="tabletop-msc-track__visual-row">
          <button
            aria-label={isPlaying ? `Pausar ${track.name}` : `Tocar ${track.name}`}
            className="tabletop-msc-track__art"
            onClick={() => (isPlaying ? onPauseTrack(track.id) : onPlayTrack(track))}
            style={{ borderColor: color }}
            title={isPlaying ? 'Pausar' : 'Tocar'}
            type="button"
          >
            <span className="tabletop-msc-track__fallback" style={{ color }}>
              <Icon aria-hidden="true" size={34} strokeWidth={1.5} />
            </span>
            {track.previewImage ? (
              <img
                alt=""
                onError={(event) => event.currentTarget.remove()}
                src={track.previewImage}
              />
            ) : null}
            <span className="tabletop-msc-track__play-state">
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </span>
          </button>
          <label className="tabletop-msc-track__volume" title={`Volume ${Math.round(state.volume * 100)}%`}>
            <Volume2 aria-hidden="true" size={15} />
            <input
              aria-label={`Volume de ${track.name}`}
              max={100}
              min={0}
              onChange={(event) =>
                onTrackVolumeChange(track.id, Number(event.target.value) / 100)
              }
              type="range"
              value={Math.round(state.volume * 100)}
            />
            <span>{Math.round(state.volume * 100)}</span>
          </label>
        </div>

        <div className="tabletop-msc-track__identity">
          <strong title={track.name}>{track.name}</strong>
          <span>{track.categoryLabel}</span>
        </div>

        <label className="tabletop-msc-track__timeline">
          <span>{formatDuration(displayedTime)}</span>
          <input
            aria-label={`Tempo de ${track.name}`}
            disabled={!canScrub}
            max={maxTime}
            min={0}
            onBlur={() => setActiveScrubTrackId('')}
            onChange={(event) => handleSeekInput(Number(event.currentTarget.value))}
            onPointerDown={() => setActiveScrubTrackId(track.id)}
            onPointerUp={() => setActiveScrubTrackId('')}
            step={0.1}
            type="range"
            value={Math.min(displayedTime, maxTime)}
          />
          <span>{formatDuration(state.duration)}</span>
        </label>

        <div className="tabletop-msc-track__actions">
          <span className={`tabletop-msc-track__status tabletop-msc-track__status--${state.status}`}>
            {getStatusLabel(state.status)}
          </span>
          <button
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={isFavorite ? 'is-active' : ''}
            onClick={() => onToggleFavorite(track.id)}
            title={isFavorite ? 'Favorito' : 'Favoritar'}
            type="button"
          >
            <Heart fill={isFavorite ? 'currentColor' : 'none'} size={16} />
          </button>
          <button
            aria-label={`Parar ${track.name}`}
            disabled={state.status === 'stopped'}
            onClick={() => onStopTrack(track.id)}
            title="Parar"
            type="button"
          >
            <Square size={15} />
          </button>
          <button
            aria-label={`Editar ${track.name}`}
            onClick={() => beginTrackEdit(track)}
            title="Editar"
            type="button"
          >
            <Edit3 size={16} />
          </button>
          <button
            aria-label={`Excluir ${track.name}`}
            className="is-danger"
            onClick={() => handleDeleteTrack(track)}
            title="Excluir"
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </article>
    )
  }

  const selectedTitle = isActiveView
    ? 'Tocando agora'
    : isFavoritesView
      ? 'Favoritos'
      : isAllTracksView
        ? 'Todos os sons'
        : currentFolder?.name ?? 'Biblioteca'

  return (
    <section className="tabletop-msc" data-testid="tabletop-msc-library">
      <datalist id="tabletop-msc-category-options">
        {AUDIO_CATEGORY_OPTIONS.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
      <header className="tabletop-msc__topbar">
        <div className="tabletop-msc__brand">
          <Disc3 aria-hidden="true" size={24} />
          <div>
            <p className="eyebrow">MSC</p>
            <h3>Biblioteca de audio</h3>
          </div>
        </div>
        <label className="tabletop-msc__search">
          <Search aria-hidden="true" size={16} />
          <input
            aria-label="Buscar sons"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar"
            value={searchQuery}
          />
          {searchQuery ? (
            <button aria-label="Limpar busca" onClick={() => setSearchQuery('')} title="Limpar" type="button">
              <X size={15} />
            </button>
          ) : null}
        </label>
        <div className="tabletop-msc__global-actions">
          <button aria-label="Tocar favoritos" onClick={onPlayFavorites} title="Tocar favoritos" type="button">
            <Heart size={18} />
          </button>
          <button aria-label="Pausar todos" onClick={onPauseAll} title="Pausar todos" type="button">
            <Pause size={18} />
          </button>
          <button aria-label="Parar todos" onClick={onStopAll} title="Parar todos" type="button">
            <Square size={17} />
          </button>
          <button
            aria-label="Abrir mixes"
            className={isMixerOpen ? 'is-active' : ''}
            onClick={() => setIsMixerOpen((current) => !current)}
            title="Mixes"
            type="button"
          >
            <SlidersHorizontal size={18} />
          </button>
          <button
            aria-label="Adicionar som"
            className={isCreatingTrack ? 'is-active' : ''}
            onClick={() => {
              setIsCreatingTrack((current) => !current)
              setEditingTrackId('')
            }}
            title="Adicionar som"
            type="button"
          >
            <Upload size={18} />
          </button>
        </div>
      </header>

      {statusMessage ? <div className="tabletop-msc__notice">{statusMessage}</div> : null}

      <div className="tabletop-msc__workspace">
        <aside className="tabletop-msc__sidebar" data-testid="tabletop-msc-folders">
          <nav className="tabletop-msc__nav">
            <button
              className={isAllTracksView ? 'is-active' : ''}
              onClick={() => selectFolder(ALL_TRACKS_FOLDER_ID, false)}
              type="button"
            >
              <ListMusic size={17} />
              <span>Todos os sons</span>
              <small>{tracks.length}</small>
            </button>
            <button
              className={isFavoritesView ? 'is-active' : ''}
              onClick={() => setSelectedFolderId(FAVORITES_FOLDER_ID)}
              type="button"
            >
              <Heart size={17} />
              <span>Favoritos</span>
              <small>{favoriteTracks.length}</small>
            </button>
            <button
              className={isActiveView ? 'is-active' : ''}
              onClick={() => setSelectedFolderId(ACTIVE_FOLDER_ID)}
              type="button"
            >
              <Activity size={17} />
              <span>Tocando agora</span>
              <small>{activeTracks.length}</small>
            </button>
          </nav>

          <div className="tabletop-msc__folder-heading">
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
          <div className="tabletop-msc__folder-list">
            {folderRows.map(({ depth, folder }) => {
              const selected = currentFolderId === folder.id
              const itemCount = getFolderItemCount(folder.id, effectiveFolders, trackFolderIds)
              const isRenaming = renamingFolderId === folder.id
              const hasChildren = effectiveFolders.some(
                (entry) => entry.parentId === folder.id,
              )
              const isExpanded = expandedFolderIds.has(folder.id)
              const dropPlacement =
                folderDropTarget?.folderId === folder.id
                  ? folderDropTarget.placement
                  : null
              return (
                <div
                  className={`tabletop-msc-folder${selected ? ' is-active' : ''}${
                    dropPlacement ? ` is-drop-${dropPlacement}` : ''
                  }`}
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
                    startFolderDrag(event, folder.id)
                    setDraggingFolderId(folder.id)
                  }}
                  onDrop={(event) => handleFolderTargetDrop(event, folder)}
                  style={{ paddingLeft: `${Math.min(depth, 4) * 12}px` }}
                >
                  <button
                    className="tabletop-msc-folder__select tabletop-msc-folder__select--tree"
                    onClick={() => toggleFolder(folder.id)}
                    onKeyDown={(event) => handleFolderKeyDown(event, folder.id)}
                    title="Abrir pasta ou soltar um som aqui"
                    type="button"
                  >
                    <span className="tabletop-msc-folder__chevron" aria-hidden="true">
                      {hasChildren ? (
                        isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                      ) : null}
                    </span>
                    {selected ? <FolderOpen size={16} /> : <Folder size={16} />}
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
                    <div className="tabletop-msc-folder__actions">
                      <button aria-label="Salvar nome" onClick={() => handleSaveFolderRename(folder.id)} title="Salvar" type="button">
                        <Save size={14} />
                      </button>
                      <button aria-label="Cancelar nome" onClick={() => setRenamingFolderId('')} title="Cancelar" type="button">
                        <X size={14} />
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
          {showNewFolderInput ? (
            <div className="tabletop-msc__new-folder">
              <input
                aria-label="Nome da nova pasta"
                autoFocus
                disabled={isSpecialView}
                onChange={(event) => setNewFolderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleCreateFolder()
                  if (event.key === 'Escape') setShowNewFolderInput(false)
                }}
                placeholder="Nova pasta"
                value={newFolderName}
              />
              <button aria-label="Criar pasta" disabled={!newFolderName.trim() || isSpecialView} onClick={handleCreateFolder} title="Criar pasta" type="button">
                <FolderPlus size={16} />
              </button>
            </div>
          ) : null}
        </aside>

        <main className="tabletop-msc__content">
          <header className="tabletop-msc__content-header">
            <div>
              <div className="tabletop-msc__breadcrumb">
                <button onClick={() => selectFolder(ROOT_FOLDER_ID)} type="button">Biblioteca</button>
                {breadcrumb.map((folder) => (
                  <span key={folder.id}>
                    <ChevronRight size={13} />
                    <button onClick={() => selectFolder(folder.id)} type="button">{folder.name}</button>
                  </span>
                ))}
              </div>
              <h2>{selectedTitle}</h2>
              <span>{selectedTracks.length} som(ns)</span>
            </div>
          </header>

          {!isSpecialView ? (
            <div className="tabletop-library-folder-grid tabletop-msc__folder-grid">
              {currentFolderId ? (
                <button
                  className="tabletop-library-folder-card tabletop-library-folder-card--back"
                  onClick={() =>
                    selectFolder(
                      effectiveFolders.find((folder) => folder.id === currentFolderId)
                        ?.parentId ?? ROOT_FOLDER_ID,
                    )
                  }
                  type="button"
                >
                  <CornerUpLeft aria-hidden="true" size={24} />
                  <strong>Voltar</strong>
                </button>
              ) : null}
              {directFolders.map((folder) => {
                const itemCount = getFolderItemCount(
                  folder.id,
                  effectiveFolders,
                  trackFolderIds,
                )
                const dropPlacement =
                  folderDropTarget?.folderId === folder.id
                    ? folderDropTarget.placement
                    : null

                return (
                  <article
                    className={`tabletop-library-folder-card${
                      dropPlacement ? ` is-drop-${dropPlacement}` : ''
                    }`}
                    draggable={!folder.isVirtual}
                    key={folder.id}
                    onClick={() => selectFolder(folder.id)}
                    onContextMenu={(event) => handleFolderContextMenu(event, folder.id)}
                    onDragEnd={() => {
                      setDraggingFolderId('')
                      setFolderDropTarget(null)
                    }}
                    onDragOver={(event) => handleFolderOrderDragOver(event, folder)}
                    onDragStart={(event) => {
                      if (folder.isVirtual) return
                      startFolderDrag(event, folder.id)
                      setDraggingFolderId(folder.id)
                    }}
                    onDrop={(event) => handleFolderTargetDrop(event, folder)}
                    onKeyDown={(event) => handleFolderKeyDown(event, folder.id)}
                    role="button"
                    tabIndex={0}
                    title="Abrir pasta ou soltar um som aqui"
                  >
                    <span className="tabletop-library-folder-card__icon">
                      <FolderOpen aria-hidden="true" size={26} />
                    </span>
                    <strong>{folder.name}</strong>
                    <small>{itemCount} item(ns)</small>
                  </article>
                )
              })}
            </div>
          ) : null}

          {isCreatingTrack ? (
            <section className="tabletop-msc-editor" aria-label="Adicionar som">
              <header>
                <div><p className="eyebrow">Novo som</p><h3>Adicionar a biblioteca</h3></div>
                <button aria-label="Fechar" onClick={() => setIsCreatingTrack(false)} title="Fechar" type="button"><X size={17} /></button>
              </header>
              <div className="tabletop-msc-editor__body">
                <div className="tabletop-msc-editor__cover">
                  {createForm.previewImage ? <img alt="Capa selecionada" src={createForm.previewImage} /> : <ImageIcon size={32} />}
                  <button onClick={() => createImageInputRef.current?.click()} type="button"><ImageIcon size={15} /> Capa</button>
                  <input accept={IMAGE_FILE_ACCEPT} hidden onChange={(event) => handleImageSelect(event, 'create')} ref={createImageInputRef} type="file" />
                </div>
                <div className="tabletop-msc-editor__fields">
                  <label><span>Nome</span><input onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} value={createForm.name} /></label>
                  <label><span>Tipo</span><select onChange={(event) => setCreateForm((current) => ({ ...current, libraryType: event.target.value as 'music' | 'ambience' }))} value={createForm.libraryType}><option value="music">Musica</option><option value="ambience">Ambiencia / SFX</option></select></label>
                  <label><span>Categoria</span><input list="tabletop-msc-category-options" onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value }))} value={createForm.category} /></label>
                  <label className="tabletop-msc-editor__summary"><span>Resumo</span><textarea onChange={(event) => setCreateForm((current) => ({ ...current, summary: event.target.value }))} value={createForm.summary} /></label>
                </div>
              </div>
              <footer>
                <button onClick={() => createAudioInputRef.current?.click()} type="button"><Upload size={15} /> {createForm.source ? 'Trocar audio' : 'Escolher audio'}</button>
                <input accept={AUDIO_FILE_ACCEPT} hidden onChange={(event) => handleAudioSelect(event, 'create')} ref={createAudioInputRef} type="file" />
                <span>{uploadStatus}</span>
                <button className="button--primary" onClick={handleSaveTrack} type="button"><Save size={15} /> Salvar</button>
              </footer>
            </section>
          ) : null}

          {editingTrack ? (
            <section className="tabletop-msc-editor" aria-label={`Editar ${editingTrack.name}`}>
              <header>
                <div><p className="eyebrow">Editar som</p><h3>{editingTrack.name}</h3></div>
                <button aria-label="Fechar" onClick={() => setEditingTrackId('')} title="Fechar" type="button"><X size={17} /></button>
              </header>
              <div className="tabletop-msc-editor__body">
                <div className="tabletop-msc-editor__cover">
                  {editForm.previewImage ? <img alt="Capa do som" src={editForm.previewImage} /> : <ImageIcon size={32} />}
                  <button onClick={() => editImageInputRef.current?.click()} type="button"><ImageIcon size={15} /> Capa</button>
                  {editForm.previewImage ? <button onClick={() => setEditForm((current) => ({ ...current, previewImage: '' }))} type="button"><X size={15} /> Remover</button> : null}
                  <input accept={IMAGE_FILE_ACCEPT} hidden onChange={(event) => handleImageSelect(event, 'edit')} ref={editImageInputRef} type="file" />
                </div>
                <div className="tabletop-msc-editor__fields">
                  <label><span>Nome</span><input onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} value={editForm.name} /></label>
                  <label><span>Categoria</span><input list="tabletop-msc-category-options" onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))} value={editForm.category} /></label>
                  <label className="tabletop-msc-editor__summary"><span>Resumo</span><textarea onChange={(event) => setEditForm((current) => ({ ...current, summary: event.target.value }))} value={editForm.summary} /></label>
                </div>
              </div>
              <footer>
                <button onClick={() => editAudioInputRef.current?.click()} type="button"><Upload size={15} /> Trocar audio</button>
                <input accept={AUDIO_FILE_ACCEPT} hidden onChange={(event) => handleAudioSelect(event, 'edit')} ref={editAudioInputRef} type="file" />
                <span>{uploadStatus}</span>
                <button className="button--primary" onClick={handleSaveTrackUpdate} type="button"><Save size={15} /> Salvar</button>
              </footer>
            </section>
          ) : null}

          {isMixerOpen ? (
            <section className="tabletop-msc-mixer" aria-label="Mixes favoritos">
              <div className="tabletop-msc-mixer__save">
                <input onChange={(event) => setNewPresetName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') handleSaveFavoritePreset() }} placeholder={`Mix ${favoritePresets.length + 1}`} value={newPresetName} />
                <button disabled={favoriteTracks.length === 0} onClick={handleSaveFavoritePreset} title="Salvar favoritos como mix" type="button"><Save size={15} /> Salvar mix</button>
              </div>
              <div className="tabletop-msc-mixer__presets">
                {favoritePresets.map((preset) => (
                  <article key={preset.id}>
                    <div><strong>{preset.name}</strong><span>{preset.trackIds.length} som(ns)</span></div>
                    <button aria-label={`Tocar ${preset.name}`} onClick={() => onPlayFavoritePreset(preset.id)} title="Tocar" type="button"><Play size={15} /></button>
                    <button aria-label={`Carregar ${preset.name}`} onClick={() => onApplyFavoritePreset(preset.id)} title="Carregar favoritos" type="button"><Heart size={15} /></button>
                    <button aria-label={`Renomear ${preset.name}`} onClick={() => handleRenameFavoritePreset(preset)} title="Renomear" type="button"><Edit3 size={15} /></button>
                    <button aria-label={`Excluir ${preset.name}`} className="is-danger" onClick={() => onDeleteFavoritePreset(preset.id)} title="Excluir" type="button"><Trash2 size={15} /></button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {selectedTracks.length > 0 ? (
            <div className="tabletop-msc__track-grid" data-testid="tabletop-msc-track-grid">
              {selectedTracks.map(renderTrackCard)}
            </div>
          ) : (
            <div className="tabletop-msc__empty">
              <Music2 size={34} />
              <strong>Nenhum som nesta selecao</strong>
            </div>
          )}
        </main>
      </div>

      {folderContextMenu ? (() => {
        const folder = effectiveFolders.find(
          (item) => item.id === folderContextMenu.folderId,
        )

        if (!folder) return null

        return (
          <div
            className="tabletop-library-folder-menu"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            style={{ left: folderContextMenu.x, top: folderContextMenu.y }}
          >
            <button onClick={() => selectFolder(folder.id)} type="button">
              Abrir pasta
            </button>
            {!folder.isVirtual ? (
              <button onClick={() => beginFolderRename(folder)} type="button">
                Renomear
              </button>
            ) : null}
            <button onClick={() => createChildFolder(folder)} type="button">
              Nova subpasta
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
    </section>
  )
}
