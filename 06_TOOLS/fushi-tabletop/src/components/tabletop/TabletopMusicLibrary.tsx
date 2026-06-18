import { useMemo, useRef, useState } from 'react'
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
  onMoveFolder: (folderId: string, direction: 'up' | 'down') => void
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
}

interface FolderView extends TabletopLibraryFolder {
  isVirtual?: boolean
}

interface MusicDragPayload {
  category: 'music'
  id: string
}

const ROOT_FOLDER_ID = ''
const ACTIVE_FOLDER_ID = 'virtual:music:ativos'
const FAVORITES_FOLDER_ID = 'virtual:music:favoritos'
const LIBRARY_DRAG_DATA_TYPE = 'application/x-fushi-library-item'
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
    new Set(
      tracks.map((track) => track.categoryLabel || track.category || 'Sem categoria'),
    ),
  ).sort((a, b) => a.localeCompare(b))

  return labels.map((label, index) => ({
    id: getVirtualMusicFolderId(label),
    category: 'music',
    parentId: ROOT_FOLDER_ID,
    name: label,
    icon: '🎵',
    sortOrder: index + 1,
    isVirtual: true,
  }))
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

function startItemDrag(event: React.DragEvent, trackId: string) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData(
    LIBRARY_DRAG_DATA_TYPE,
    JSON.stringify({ category: 'music', id: trackId } satisfies MusicDragPayload),
  )
}

function readDragPayload(event: React.DragEvent): MusicDragPayload | null {
  const rawPayload = event.dataTransfer.getData(LIBRARY_DRAG_DATA_TYPE)

  if (!rawPayload) {
    return null
  }

  try {
    const payload = JSON.parse(rawPayload) as Partial<MusicDragPayload>

    if (payload.category === 'music' && typeof payload.id === 'string') {
      return {
        category: 'music',
        id: payload.id,
      }
    }
  } catch {
    return null
  }

  return null
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
  onMoveFolder,
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
}: TabletopMusicLibraryProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState(ROOT_FOLDER_ID)
  const [newFolderName, setNewFolderName] = useState('')
  const [newPresetName, setNewPresetName] = useState('')
  const [renamingFolderId, setRenamingFolderId] = useState('')
  const [renamingFolderName, setRenamingFolderName] = useState('')
  const [isCreatingTrack, setIsCreatingTrack] = useState(false)
  const [isMixerOpen, setIsMixerOpen] = useState(false)
  const [activeScrubTrackId, setActiveScrubTrackId] = useState('')
  const [scrubValues, setScrubValues] = useState<Record<string, number>>({})
  const [createForm, setCreateForm] = useState<TabletopMusicCreateInput>({
    category: 'Musicas de trilha',
    folderId: ROOT_FOLDER_ID,
    libraryType: 'music',
    name: '',
    source: '',
    summary: '',
  })
  const [uploadStatus, setUploadStatus] = useState('')
  const virtualFolders = useMemo(() => buildVirtualFolders(tracks), [tracks])
  const effectiveFolders = [
    ...virtualFolders,
    ...(folders.filter((folder) => folder.category === 'music') as FolderView[]),
  ]
  const isSelectedSpecialView =
    selectedFolderId === ACTIVE_FOLDER_ID || selectedFolderId === FAVORITES_FOLDER_ID
  const currentFolderId =
    isSelectedSpecialView ||
    selectedFolderId === ROOT_FOLDER_ID ||
    effectiveFolders.some((folder) => folder.id === selectedFolderId)
      ? selectedFolderId
      : ROOT_FOLDER_ID
  const isActiveView = currentFolderId === ACTIVE_FOLDER_ID
  const isFavoritesView = currentFolderId === FAVORITES_FOLDER_ID
  const isSpecialView = isActiveView || isFavoritesView
  const breadcrumb = isSpecialView
    ? [
        {
          id: currentFolderId,
          category: 'music' as const,
          parentId: ROOT_FOLDER_ID,
          name: isActiveView ? 'Ativos' : 'Favoritos',
          icon: isActiveView ? 'ON' : '*',
          isVirtual: true,
        },
      ]
    : buildBreadcrumb(effectiveFolders, currentFolderId)
  const directFolders = effectiveFolders
    .filter((folder) => !isSpecialView && folder.parentId === currentFolderId)
    .sort(compareFolders)
  const trackFolderIds = tracks.map((track) => resolveTrackFolderId(track, trackFolders))
  const activeTracks = tracks
    .filter((track) => getTrackState(track.id, mixerTracks, trackVolumes).status !== 'stopped')
    .sort((a, b) => a.name.localeCompare(b.name))
  const favoriteTracks = favoriteTrackIds
    .map((trackId) => tracks.find((track) => track.id === trackId))
    .filter((track): track is TabletopMusicLibraryItem => Boolean(track))
  const selectedTracks = (
    isActiveView
      ? activeTracks
      : isFavoritesView
        ? favoriteTracks
        : tracks.filter((track) => resolveTrackFolderId(track, trackFolders) === currentFolderId)
  ).sort((a, b) => a.name.localeCompare(b.name))

  function handleCreateFolder() {
    const trimmedName = newFolderName.trim()

    if (!trimmedName || isSpecialView) {
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

  function handleSaveFavoritePreset() {
    const trimmedName = newPresetName.trim() || `Favoritos ${favoritePresets.length + 1}`

    onSaveFavoritePreset(trimmedName)
    setNewPresetName('')
  }

  function handleRenameFavoritePreset(preset: TabletopMusicFavoritePreset) {
    const nextName = window.prompt('Nome do preset de favoritos', preset.name)?.trim()

    if (!nextName) {
      return
    }

    onRenameFavoritePreset(preset.id, nextName)
  }

  async function handleTrackFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setUploadStatus('Carregando audio...')

    try {
      const isVideo = isVideoFile(file)
      let uploadedAsset = null as Awaited<ReturnType<typeof uploadPhysicalAsset>> | null

      if (isVideo && window.fushiDesktop?.extractAudioFromMedia) {
        setUploadStatus('Extraindo audio do video...')
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
        } else {
          setUploadStatus(
            `${extractedAsset.error ?? 'Nao foi possivel extrair audio.'} Salvando video como fonte de audio.`,
          )
        }
      }

      if (!uploadedAsset) {
        uploadedAsset = await uploadPhysicalAsset(file, {
          campaignId,
          category: 'audio',
          contentType: file.type || 'application/octet-stream',
          filename: file.name,
        })
      }

      setCreateForm((current) => ({
        ...current,
        name: current.name || file.name.replace(/\.[^.]+$/, ''),
        source: uploadedAsset.url,
      }))
      setUploadStatus(
        isVideo
          ? `Audio pronto para tocar no MSC: ${uploadedAsset.filename}`
          : `Audio salvo em pasta fisica: ${file.name}`,
      )
      window.setTimeout(() => setUploadStatus(''), 2400)
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : 'Erro ao salvar audio')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
      libraryType: createForm.libraryType,
      name: createForm.name.trim(),
      summary: createForm.summary.trim() || 'Faixa local adicionada pelo mestre.',
      category: createForm.category.trim() || 'Musicas de trilha',
    })
    setCreateForm({
      category: 'Musicas de trilha',
      folderId: ROOT_FOLDER_ID,
      libraryType: 'music',
      name: '',
      source: '',
      summary: '',
    })
    setIsCreatingTrack(false)
    setUploadStatus('')
  }

  function handleFolderDrop(event: React.DragEvent, folderId: string) {
    event.preventDefault()
    const payload = readDragPayload(event)

    if (!payload) {
      return
    }

    onAssignTrackFolder(payload.id, folderId)
  }

  function handleFolderKeyDown(event: React.KeyboardEvent, folderId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedFolderId(folderId)
    }
  }

  function renderTrackControls(track: TabletopMusicLibraryItem, compact = false) {
    const isFavorite = favoriteTrackIds.includes(track.id)
    const state = getTrackState(track.id, mixerTracks, trackVolumes)
    const isPlaying = state.status === 'playing'
    const canScrub = state.duration > 0
    const displayedTime =
      activeScrubTrackId === track.id
        ? scrubValues[track.id] ?? state.currentTime
        : state.currentTime
    const maxTime = Math.max(state.duration, 1)

    function handleSeekInput(value: number) {
      const nextTime = Math.min(Math.max(0, value), maxTime)

      setScrubValues((currentValues) => ({
        ...currentValues,
        [track.id]: nextTime,
      }))
      onSeekTrack(track.id, nextTime)
    }

    return (
      <>
        <div className="tabletop-music-transport">
          <button
            className={`button${isPlaying ? ' button--primary' : ''}`}
            onClick={() => onPlayTrack(track)}
            type="button"
          >
            {state.status === 'paused' ? 'Continuar' : 'Ativar'}
          </button>
          <button
            className="button"
            disabled={state.status !== 'playing'}
            onClick={() => onPauseTrack(track.id)}
            type="button"
          >
            Pausar
          </button>
          <button
            className="button"
            disabled={state.status === 'stopped'}
            onClick={() => onStopTrack(track.id)}
            type="button"
          >
            Parar musica
          </button>
          <button
            className={`button${isFavorite ? ' button--primary' : ''}`}
            onClick={() => onToggleFavorite(track.id)}
            type="button"
          >
            {isFavorite ? 'Favorita' : 'Favoritar'}
          </button>
        </div>
        <div className="tabletop-music-sliders">
          <label className="tabletop-music-slider">
            <span>
              Tempo {formatDuration(displayedTime)} / {formatDuration(state.duration)}
            </span>
            <input
              disabled={!canScrub}
              max={maxTime}
              min={0}
              onBlur={() => setActiveScrubTrackId('')}
              onChange={(event) => handleSeekInput(Number(event.currentTarget.value))}
              onInput={(event) => handleSeekInput(Number(event.currentTarget.value))}
              onPointerDown={() => setActiveScrubTrackId(track.id)}
              onPointerUp={() => setActiveScrubTrackId('')}
              step={0.1}
              type="range"
              value={Math.min(displayedTime, maxTime)}
            />
          </label>
          <label className="tabletop-music-slider">
            <span>Volume {Math.round(state.volume * 100)}%</span>
            <input
              max={100}
              min={0}
              onChange={(event) =>
                onTrackVolumeChange(track.id, Number(event.target.value) / 100)
              }
              type="range"
              value={Math.round(state.volume * 100)}
            />
          </label>
        </div>
        {!compact ? (
          <div className="tabletop-library-card__actions">
            <button
              className="button"
              onClick={() => {
                if (window.confirm(`Excluir "${track.name}" da biblioteca de sons?`)) {
                  onDeleteTrack(track.id)
                }
              }}
              type="button"
            >
              Excluir
            </button>
          </div>
        ) : null}
      </>
    )
  }

  return (
    <section className="tabletop-library tabletop-library--folders">
      <div className="tabletop-library__hero">
        <div>
          <p className="eyebrow">MSC</p>
          <h3>Sons por pastas</h3>
          <p className="support-copy">
            Ative varias faixas ao mesmo tempo, favorite mixes e controle volume e tempo individualmente.
          </p>
        </div>
        <div className="tabletop-library__hero-actions">
          <div className="tag-row">
            <button
              className={`tag tabletop-library__quick-filter${
                currentFolderId === ROOT_FOLDER_ID ? ' tabletop-library__quick-filter--active' : ''
              }`}
              onClick={() => setSelectedFolderId(ROOT_FOLDER_ID)}
              type="button"
            >
              {tracks.length} sons
            </button>
            <button
              className={`tag tabletop-library__quick-filter${
                isFavoritesView ? ' tabletop-library__quick-filter--active' : ''
              }`}
              onClick={() => setSelectedFolderId(FAVORITES_FOLDER_ID)}
              type="button"
            >
              {favoriteTracks.length} favoritos
            </button>
            <button
              className={`tag tabletop-library__quick-filter${
                isActiveView ? ' tabletop-library__quick-filter--active' : ''
              }`}
              onClick={() => setSelectedFolderId(ACTIVE_FOLDER_ID)}
              type="button"
            >
              {activeTracks.length} ativos
            </button>
          </div>
          <button className="button" onClick={() => setIsMixerOpen((current) => !current)} type="button">
            {isMixerOpen ? 'Fechar mix tecnico' : 'Abrir mix tecnico'}
          </button>
        </div>
      </div>

      {statusMessage ? <p className="support-copy">{statusMessage}</p> : null}

      {isMixerOpen ? (
        <article className="tabletop-music-mixer">
          <div className="tabletop-library-row__main">
            <div>
              <p className="eyebrow">Mix tecnico</p>
              <h3>Favoritos ativos</h3>
            </div>
            <div className="tabletop-music-transport">
              <button className="button button--primary" onClick={onPlayFavorites} type="button">
                Play favoritos
              </button>
              <button className="button" onClick={onPauseAll} type="button">
                Pause todos
              </button>
              <button className="button" onClick={onStopAll} type="button">
                Stop todos
              </button>
            </div>
          </div>
          <div className="tabletop-music-presets">
            <div className="tabletop-music-presets__save">
              <input
                className="field__input"
                onChange={(event) => setNewPresetName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSaveFavoritePreset()
                  }
                }}
                placeholder={`Nome do preset ${favoritePresets.length + 1}`}
                value={newPresetName}
              />
              <button
                className="button"
                disabled={favoriteTracks.length === 0}
                onClick={handleSaveFavoritePreset}
                title={
                  favoriteTracks.length === 0
                    ? 'Favorite pelo menos um som antes de salvar um preset'
                    : 'Salvar favoritos atuais como preset'
                }
                type="button"
              >
                Salvar preset
              </button>
            </div>
            {favoritePresets.length > 0 ? (
              <div className="tabletop-music-presets__list">
                {favoritePresets.map((preset) => (
                  <article className="tabletop-music-preset" key={preset.id}>
                    <div>
                      <strong>{preset.name}</strong>
                      <span>{preset.trackIds.length} som(ns)</span>
                    </div>
                    <button
                      className="button button--compact button--primary"
                      onClick={() => onPlayFavoritePreset(preset.id)}
                      type="button"
                    >
                      Play
                    </button>
                    <button
                      className="button button--compact"
                      onClick={() => onApplyFavoritePreset(preset.id)}
                      type="button"
                    >
                      Usar
                    </button>
                    <button
                      className="button button--compact"
                      onClick={() => handleRenameFavoritePreset(preset)}
                      type="button"
                    >
                      Nome
                    </button>
                    <button
                      className="button button--compact"
                      onClick={() => onDeleteFavoritePreset(preset.id)}
                      type="button"
                    >
                      Excluir
                    </button>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
          {favoriteTracks.length ? (
            <div className="tabletop-library-list">
              {favoriteTracks.map((track) => (
                <article className="tabletop-library-row" key={track.id}>
                  <div className="tabletop-library-row__main">
                    <div>
                      <p className="eyebrow">{track.categoryLabel}</p>
                      <h3>{track.name}</h3>
                    </div>
                    <span className="tag">
                      {getTrackState(track.id, mixerTracks, trackVolumes).status}
                    </span>
                  </div>
                  {renderTrackControls(track, true)}
                </article>
              ))}
            </div>
          ) : (
            <p className="support-copy">
              Favorite sons para montar um mix pronto antes da cena.
            </p>
          )}
        </article>
      ) : null}

      <div className="tabletop-library-toolbar">
        <div className="tabletop-library-breadcrumb">
          <button
            className="tabletop-library-breadcrumb__item"
            onClick={() => setSelectedFolderId(ROOT_FOLDER_ID)}
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
              onClick={() => setSelectedFolderId(folder.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleFolderDrop(event, folder.id)}
              type="button"
            >
              {folder.icon ?? '📁'} {folder.name}
            </button>
          ))}
        </div>
        <div className="tabletop-library-toolbar__actions">
          {!isSpecialView ? (
            <>
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
            </>
          ) : null}
          <button
            className="button button--primary"
            onClick={() => setIsCreatingTrack((current) => !current)}
            type="button"
          >
            + Som
          </button>
        </div>
      </div>

      {isCreatingTrack ? (
        <article className="tabletop-library-row tabletop-library-row--composer">
          <div className="tabletop-library-row__main">
            <label className="field">
              <span>Nome</span>
              <input
                className="field__input"
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, name: event.target.value }))
                }
                value={createForm.name}
              />
            </label>
            <label className="field">
              <span>Tipo</span>
              <select
                className="field__input"
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    libraryType: event.target.value as 'music' | 'ambience',
                  }))
                }
                value={createForm.libraryType}
              >
                <option value="music">Musica</option>
                <option value="ambience">Ambiencia/SFX</option>
              </select>
            </label>
            <label className="field">
              <span>Categoria</span>
              <select
                className="field__input"
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, category: event.target.value }))
                }
                value={createForm.category}
              >
                {AUDIO_CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Arquivo de audio ou video</span>
            <input
              accept={AUDIO_FILE_ACCEPT}
              className="field__input"
              onChange={handleTrackFileSelect}
              ref={fileInputRef}
              type="file"
            />
          </label>
          <label className="field">
            <span>Resumo</span>
            <textarea
              className="field__input field__input--textarea"
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, summary: event.target.value }))
              }
              value={createForm.summary}
            />
          </label>
          {uploadStatus ? <p className="support-copy">{uploadStatus}</p> : null}
          <div className="tabletop-library-card__actions">
            <button className="button" onClick={() => setIsCreatingTrack(false)} type="button">
              Cancelar
            </button>
            <button className="button button--primary" onClick={handleSaveTrack} type="button">
              Salvar som
            </button>
          </div>
        </article>
      ) : null}

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
            <span>↩</span>
            <strong>Voltar</strong>
          </button>
        ) : null}
        {directFolders.map((folder) => {
          const itemCount = getFolderItemCount(folder.id, effectiveFolders, trackFolderIds)
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
              role="button"
              tabIndex={0}
              title="Solte um som aqui para mover para esta pasta"
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

      <div className="tabletop-library-list">
        {selectedTracks.map((track) => {
          const state = getTrackState(track.id, mixerTracks, trackVolumes)

          return (
            <article
              className={`tabletop-library-row${
                state.status === 'playing' ? ' tabletop-library-row--active' : ''
              }`}
              draggable
              key={track.id}
              onDragStart={(event) => startItemDrag(event, track.id)}
            >
              <div className="tabletop-library-row__main">
                <div>
                  <p className="eyebrow">Som</p>
                  <h3>{track.name}</h3>
                </div>
                <div className="tag-row">
                  <span className="tag">{track.categoryLabel}</span>
                  <span className="tag">{state.status}</span>
                </div>
              </div>

              <p className="support-copy">{track.summary}</p>
              {renderTrackControls(track)}
            </article>
          )
        })}
      </div>
    </section>
  )
}
