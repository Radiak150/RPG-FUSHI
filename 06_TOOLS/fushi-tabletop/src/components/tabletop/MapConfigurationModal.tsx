import { useRef, useState } from 'react'
import type { TabletopMap, TabletopMapType } from '../../data/types'
import { uploadPhysicalAsset } from '../../lib/physicalAssets'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'

export interface MapConfigurationFolderOption {
  id: string
  label: string
}

export interface MapConfigurationSaveData extends TabletopMap {
  folderId?: string
}

interface MapConfigurationModalProps {
  campaignId: string
  folderOptions: MapConfigurationFolderOption[]
  map: TabletopMap
  selectedFolderId: string
  onClose: () => void
  onSave: (map: MapConfigurationSaveData) => void
}

const mapTypes: Array<{ value: TabletopMapType; label: string }> = [
  { value: 'livre', label: 'Livre' },
  { value: 'evento', label: 'Evento' },
  { value: 'base', label: 'Base' },
  { value: 'extra', label: 'Extra' },
  { value: 'interior', label: 'Interior' },
  { value: 'dungeon', label: 'Dungeon' },
]

function readImageDimensions(source: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      })
    }
    image.onerror = () => reject(new Error('Imagem invalida'))
    image.src = source
  })
}

function readVideoDimensions(source: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const video = document.createElement('video')

    function cleanup() {
      video.removeAttribute('src')
      video.load()
    }

    video.onloadedmetadata = () => {
      const dimensions = {
        width: video.videoWidth,
        height: video.videoHeight,
      }
      cleanup()
      resolve(dimensions)
    }
    video.onerror = () => {
      cleanup()
      reject(new Error('Video invalido'))
    }
    video.preload = 'metadata'
    video.src = source
  })
}

function clampNumber(value: number, min: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(min, Math.round(value))
}

export function MapConfigurationModal({
  campaignId,
  folderOptions,
  map,
  selectedFolderId,
  onClose,
  onSave,
}: MapConfigurationModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const [formData, setFormData] = useState<MapConfigurationSaveData>({
    ...map,
    folderId: map.folderId ?? selectedFolderId,
    type: map.type ?? 'livre',
    imageUrl: map.imageUrl ?? map.image,
    previewImage: map.previewImage ?? map.image,
    thumbnailUrl: map.thumbnailUrl ?? map.previewImage ?? map.image,
    cellSize: map.cellSize ?? 112,
  })
  const [uploadStatus, setUploadStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsUploading(true)
    setUploadStatus('Processando imagem...')

    try {
      const uploadedAsset = await uploadPhysicalAsset(file, {
        campaignId,
        category: 'maps',
        contentType: file.type || 'application/octet-stream',
        filename: file.name,
      })
      const dimensions = await readImageDimensions(uploadedAsset.url)
      const nextCellSize = formData.cellSize ?? 112
      const nextColumns = Math.max(1, Math.round(dimensions.width / nextCellSize))
      const nextRows = Math.max(1, Math.round(dimensions.height / nextCellSize))

      setFormData((current) => ({
        ...current,
        image: uploadedAsset.url,
        imageUrl: uploadedAsset.url,
        previewImage: uploadedAsset.url,
        thumbnailUrl: uploadedAsset.url,
        stageWidth: dimensions.width,
        stageHeight: dimensions.height,
        gridColumns: nextColumns,
        gridRows: nextRows,
      }))
      setUploadStatus(`Mapa salvo em pasta fisica: ${file.name}`)
      window.setTimeout(() => setUploadStatus(''), 2400)
    } catch (error) {
      setUploadStatus(
        error instanceof Error ? error.message : 'Erro ao salvar imagem do mapa',
      )
    } finally {
      setIsUploading(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleVideoFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (file.size > 180 * 1024 * 1024) {
      setUploadStatus(
        'Video acima de 180 MB. Otimize para 1080p, 30 FPS e sem audio antes de importar.',
      )
      event.target.value = ''
      return
    }

    setIsUploadingVideo(true)
    setUploadStatus('Processando superficie animada...')

    try {
      const uploadedAsset = await uploadPhysicalAsset(file, {
        campaignId,
        category: 'maps',
        contentType: file.type || 'application/octet-stream',
        filename: file.name,
      })
      const dimensions = await readVideoDimensions(uploadedAsset.url)

      setFormData((current) => ({
        ...current,
        animatedSurface: {
          enabled: true,
          loop: true,
          minQuality: current.animatedSurface?.minQuality ?? 'balanced',
          playbackRate: current.animatedSurface?.playbackRate ?? 1,
          poster: current.previewImage ?? current.image,
          source: uploadedAsset.url,
        },
        stageWidth: dimensions.width || current.stageWidth,
        stageHeight: dimensions.height || current.stageHeight,
      }))
      setUploadStatus(`Video salvo em pasta fisica: ${file.name}`)
      window.setTimeout(() => setUploadStatus(''), 2400)
    } catch (error) {
      setUploadStatus(
        error instanceof Error ? error.message : 'Erro ao salvar video do mapa',
      )
    } finally {
      setIsUploadingVideo(false)

      if (videoInputRef.current) {
        videoInputRef.current.value = ''
      }
    }
  }

  function updateNumberField(
    key: 'stageWidth' | 'stageHeight' | 'gridColumns' | 'gridRows' | 'cellSize',
    value: number,
  ) {
    setFormData((current) => ({
      ...current,
      [key]: clampNumber(value, 1, current[key] ?? 1),
    }))
  }

  function handleSave() {
    onSave({
      ...formData,
      name: formData.name.trim() || map.name,
      summary: formData.summary?.trim() || '',
      imageUrl: formData.imageUrl || formData.image,
      previewImage: formData.previewImage || formData.image,
      thumbnailUrl: formData.thumbnailUrl || formData.previewImage || formData.image,
      stageWidth: clampNumber(formData.stageWidth, 1, map.stageWidth),
      stageHeight: clampNumber(formData.stageHeight, 1, map.stageHeight),
      gridColumns: clampNumber(formData.gridColumns, 1, map.gridColumns),
      gridRows: clampNumber(formData.gridRows, 1, map.gridRows),
      cellSize: clampNumber(formData.cellSize ?? 112, 16, map.cellSize ?? 112),
    })
    onClose()
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content modal-content--wide">
        <div className="modal-header">
          <h2>Configurar Mapa</h2>
          <button aria-label="Fechar modal" className="modal-close" onClick={onClose} type="button">
            x
          </button>
        </div>

        <div className="modal-body">
          <fieldset>
            <legend>Informacoes do Mapa</legend>
            <div className="form-group">
              <label>
                <span>Nome</span>
                <input
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, name: event.target.value }))
                  }
                  type="text"
                  value={formData.name}
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                <span>Pasta</span>
                <select
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      folderId: event.target.value,
                    }))
                  }
                  value={formData.folderId ?? ''}
                >
                  {folderOptions.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-group">
              <label>
                <span>Tipo</span>
                <select
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      type: event.target.value as TabletopMapType,
                    }))
                  }
                  value={formData.type ?? 'livre'}
                >
                  {mapTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-group">
              <label>
                <span>Resumo</span>
                <textarea
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      summary: event.target.value,
                    }))
                  }
                  value={formData.summary ?? ''}
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Imagem do Mapa</legend>
            <div className="form-group">
              <label>
                <span>Upload de imagem</span>
                <input
                  accept="image/*"
                  disabled={isUploading}
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  type="file"
                />
              </label>
              {uploadStatus ? <p className="status-message">{uploadStatus}</p> : null}
            </div>
            <div className="current-asset">
              <p className="label">Preview atual:</p>
              <img
                alt={formData.name}
                src={resolveRuntimeAssetUrl(formData.previewImage ?? formData.image)}
                style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain' }}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>Superficie Animada Opcional</legend>
            <p className="support-copy">
              MP4 ou WebM sem audio, ate 1080p e 30 FPS. A imagem acima continua
              sendo o fallback obrigatorio.
            </p>
            <div className="form-group">
              <label>
                <span>Upload de video</span>
                <input
                  accept="video/mp4,video/webm"
                  disabled={isUploadingVideo}
                  onChange={handleVideoFileSelect}
                  ref={videoInputRef}
                  type="file"
                />
              </label>
            </div>
            <div className="cards-grid">
              <label>
                <span>Ativar nesta cena</span>
                <input
                  checked={formData.animatedSurface?.enabled === true}
                  disabled={!formData.animatedSurface?.source}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      animatedSurface: current.animatedSurface
                        ? {
                            ...current.animatedSurface,
                            enabled: event.target.checked,
                          }
                        : undefined,
                    }))
                  }
                  type="checkbox"
                />
              </label>
              <label>
                <span>Qualidade minima</span>
                <select
                  disabled={!formData.animatedSurface?.source}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      animatedSurface: current.animatedSurface
                        ? {
                            ...current.animatedSurface,
                            minQuality:
                              event.target.value === 'ultra' ? 'ultra' : 'balanced',
                          }
                        : undefined,
                    }))
                  }
                  value={formData.animatedSurface?.minQuality ?? 'balanced'}
                >
                  <option value="balanced">Balanced e Ultra</option>
                  <option value="ultra">Somente Ultra</option>
                </select>
              </label>
              <label>
                <span>Velocidade</span>
                <input
                  disabled={!formData.animatedSurface?.source}
                  max={2}
                  min={0.25}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      animatedSurface: current.animatedSurface
                        ? {
                            ...current.animatedSurface,
                            playbackRate: Number(event.target.value),
                          }
                        : undefined,
                    }))
                  }
                  step={0.05}
                  type="number"
                  value={formData.animatedSurface?.playbackRate ?? 1}
                />
              </label>
            </div>
            {formData.animatedSurface?.source ? (
              <button
                className="button"
                onClick={() =>
                  setFormData((current) => ({
                    ...current,
                    animatedSurface: undefined,
                  }))
                }
                type="button"
              >
                Remover video animado
              </button>
            ) : null}
          </fieldset>

          <fieldset>
            <legend>Grid e Tamanho Real</legend>
            <div className="cards-grid">
              <label>
                <span>Largura do palco</span>
                <input
                  min={1}
                  onChange={(event) => updateNumberField('stageWidth', Number(event.target.value))}
                  type="number"
                  value={formData.stageWidth}
                />
              </label>
              <label>
                <span>Altura do palco</span>
                <input
                  min={1}
                  onChange={(event) => updateNumberField('stageHeight', Number(event.target.value))}
                  type="number"
                  value={formData.stageHeight}
                />
              </label>
              <label>
                <span>Colunas do grid</span>
                <input
                  min={1}
                  onChange={(event) => updateNumberField('gridColumns', Number(event.target.value))}
                  type="number"
                  value={formData.gridColumns}
                />
              </label>
              <label>
                <span>Linhas do grid</span>
                <input
                  min={1}
                  onChange={(event) => updateNumberField('gridRows', Number(event.target.value))}
                  type="number"
                  value={formData.gridRows}
                />
              </label>
              <label>
                <span>Tamanho base da celula</span>
                <input
                  min={16}
                  onChange={(event) => updateNumberField('cellSize', Number(event.target.value))}
                  type="number"
                  value={formData.cellSize ?? 112}
                />
              </label>
            </div>
          </fieldset>
        </div>

        <div className="modal-footer">
          <button className="button" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="button button--primary" onClick={handleSave} type="button">
            Salvar mapa
          </button>
        </div>
      </div>
    </div>
  )
}
