import { useRef, useState } from 'react'
import type { TabletopMap, TabletopTransitionAsset } from '../../data/types'
import { uploadPhysicalAsset } from '../../lib/physicalAssets'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'

interface TransitionOverrideConfig {
  assetUrl?: string
  thumbnailUrl?: string
  keepCurrentMap?: boolean
  toMapId?: string
  type?: 'image' | 'video'
  customName?: string
}

interface TransitionConfigurationModalProps {
  transition: TabletopTransitionAsset
  allMaps: TabletopMap[]
  currentConfig: TransitionOverrideConfig | undefined
  onSave: (config: TransitionOverrideConfig) => void
  onClose: () => void
}

function formatAssetLabel(assetUrl: string) {
  return assetUrl.startsWith('/api/fushi/assets/')
    ? 'Arquivo salvo na pasta fisica do app'
    : assetUrl.startsWith('data:')
      ? 'Arquivo local carregado no app'
      : assetUrl
}

function resolveSelectedMediaType(file: File): 'image' | 'video' {
  const mimeType = file.type.toLowerCase()
  const filename = file.name.toLowerCase()

  if (
    mimeType.startsWith('video/') ||
    filename.endsWith('.mp4') ||
    filename.endsWith('.webm')
  ) {
    return 'video'
  }

  return 'image'
}

function resolveSelectedContentType(file: File) {
  const mimeType = file.type.toLowerCase()
  const filename = file.name.toLowerCase()

  if (mimeType) {
    return mimeType
  }

  if (filename.endsWith('.mp4')) {
    return 'video/mp4'
  }

  if (filename.endsWith('.webm')) {
    return 'video/webm'
  }

  return 'application/octet-stream'
}

function replaceFileExtension(filename: string, extension: string) {
  const baseName = filename.replace(/\.[^.]+$/, '')

  return `${baseName || 'video'}${extension}`
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

function captureVideoThumbnail(file: File) {
  return new Promise<Blob | null>((resolve) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    let settled = false
    let timeoutId = 0

    function cleanup(result: Blob | null) {
      if (settled) {
        return
      }

      settled = true
      window.clearTimeout(timeoutId)
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(objectUrl)
      resolve(result)
    }

    async function drawFrame() {
      if (!video.videoWidth || !video.videoHeight) {
        cleanup(null)
        return
      }

      const maxWidth = 960
      const maxHeight = 540
      const ratio = Math.min(maxWidth / video.videoWidth, maxHeight / video.videoHeight, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(video.videoWidth * ratio))
      canvas.height = Math.max(1, Math.round(video.videoHeight * ratio))

      const context = canvas.getContext('2d')

      if (!context) {
        cleanup(null)
        return
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      cleanup(await canvasToBlob(canvas, 'image/webp', 0.82))
    }

    video.onerror = () => cleanup(null)
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0
      const captureTime = duration > 1 ? Math.min(1, duration * 0.15) : 0

      if (Math.abs(video.currentTime - captureTime) < 0.05) {
        void drawFrame()
        return
      }

      video.currentTime = captureTime
    }
    video.onseeked = () => {
      void drawFrame()
    }
    video.muted = true
    video.preload = 'metadata'
    video.playsInline = true
    video.src = objectUrl
    timeoutId = window.setTimeout(() => cleanup(null), 8000)
    video.load()
  })
}

export function TransitionConfigurationModal({
  transition,
  allMaps,
  currentConfig,
  onSave,
  onClose,
}: TransitionConfigurationModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [formData, setFormData] = useState<TransitionOverrideConfig>({
    assetUrl: currentConfig?.assetUrl ?? transition.assetUrl,
    thumbnailUrl: currentConfig?.thumbnailUrl ?? transition.thumbnailUrl,
    keepCurrentMap: currentConfig?.keepCurrentMap ?? (!transition.toMapId && !currentConfig?.toMapId),
    toMapId: currentConfig?.keepCurrentMap
      ? ''
      : currentConfig?.toMapId ?? transition.toMapId ?? '',
    type: currentConfig?.type ?? transition.type,
    customName: currentConfig?.customName ?? '',
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsUploading(true)
    setUploadStatus('Processando arquivo...')

    try {
      const mediaType = resolveSelectedMediaType(file)
      const uploadedAsset = await uploadPhysicalAsset(file, {
        category: 'interludes',
        contentType: resolveSelectedContentType(file),
        filename: file.name,
      })
      let thumbnailUrl = uploadedAsset.url

      if (mediaType === 'video') {
        setUploadStatus('Gerando thumbnail do video...')
        const thumbnailBlob = await captureVideoThumbnail(file)

        if (thumbnailBlob) {
          const uploadedThumbnail = await uploadPhysicalAsset(thumbnailBlob, {
            category: 'interludes',
            contentType: 'image/webp',
            filename: replaceFileExtension(file.name, '-thumb.webp'),
          })
          thumbnailUrl = uploadedThumbnail.url
        } else {
          thumbnailUrl = ''
        }
      }

      setFormData((current) => ({
        ...current,
        assetUrl: uploadedAsset.url,
        thumbnailUrl,
        type: mediaType,
      }))

      setUploadStatus(`Arquivo salvo em pasta fisica: ${file.name}`)
      window.setTimeout(() => setUploadStatus(''), 2400)
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : 'Erro ao salvar arquivo')
    } finally {
      setIsUploading(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleSave() {
    onSave(formData)
    onClose()
  }

  function handleReset() {
    setFormData({
      assetUrl: transition.assetUrl,
      thumbnailUrl: transition.thumbnailUrl,
      keepCurrentMap: !transition.toMapId,
      toMapId: transition.toMapId ?? '',
      type: transition.type,
      customName: '',
    })
    setUploadStatus('')
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Configurar Interludio</h2>
          <button
            aria-label="Fechar modal"
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>

        <div className="modal-body">
          <fieldset>
            <legend>Informacoes do Interludio</legend>
            <div className="form-group">
              <label>
                <span>ID</span>
                <input type="text" value={transition.id} disabled />
              </label>
            </div>
            <div className="form-group">
              <label>
                <span>Nome exibido</span>
                <input
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      customName: event.target.value,
                    }))
                  }
                  placeholder={transition.name}
                  type="text"
                  value={formData.customName ?? ''}
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                <span>Tipo de Midia</span>
                <select
                  value={formData.type ?? 'image'}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      type: event.target.value as 'image' | 'video',
                    }))
                  }
                >
                  <option value="image">Imagem</option>
                  <option value="video">Video</option>
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Upload de Midia</legend>
            <div className="form-group">
              <label>
                <span>Selecione arquivo (imagem ou video)</span>
                <input
                  accept="image/*,video/*"
                  disabled={isUploading}
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  type="file"
                />
              </label>
              {uploadStatus ? <p className="status-message">{uploadStatus}</p> : null}
            </div>
            {formData.assetUrl ? (
              <div className="current-asset">
                <p className="label">Midia atual:</p>
                <p className="asset-path">{formatAssetLabel(formData.assetUrl)}</p>
                {formData.type === 'video' ? (
                  <video
                    controls
                    src={resolveRuntimeAssetUrl(formData.assetUrl)}
                    style={{ maxWidth: '300px', maxHeight: '200px' }}
                  />
                ) : (
                  <img
                    alt="Preview"
                    src={resolveRuntimeAssetUrl(formData.assetUrl)}
                    style={{ maxWidth: '300px', maxHeight: '200px' }}
                  />
                )}
              </div>
            ) : null}
          </fieldset>

          <fieldset>
            <legend>Mapa Destino</legend>
            <div className="form-group">
              <label>
                <span>Destino apos interludio</span>
                <select
                  value={formData.keepCurrentMap ? '__current__' : formData.toMapId ?? ''}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      keepCurrentMap: event.target.value === '__current__',
                      toMapId: event.target.value === '__current__' ? '' : event.target.value,
                    }))
                  }
                >
                  <option value="__current__">Continuar no mapa atual</option>
                  {allMaps.map((map) => (
                    <option key={map.id} value={map.id}>
                      {map.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>
        </div>

        <div className="modal-footer">
          <button className="button button--secondary" onClick={handleReset} type="button">
            Restaurar ao padrao
          </button>
          <div className="button-group">
            <button className="button" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="button button--primary" onClick={handleSave} type="button">
              Salvar Configuracao
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #1a1a1a;
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9);
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          color: #e0e0e0;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #333;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .modal-close {
          background: none;
          border: none;
          color: #e0e0e0;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        fieldset {
          border: 1px solid #333;
          border-radius: 6px;
          padding: 16px;
          margin: 0;
        }

        legend {
          padding: 0 8px;
          font-weight: 600;
          color: #fff;
          font-size: 14px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }

        .form-group:first-child {
          margin-top: 0;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
        }

        label span {
          font-weight: 500;
          color: #fff;
        }

        input,
        select {
          padding: 10px 12px;
          background: #0d0d0d;
          border: 1px solid #444;
          border-radius: 4px;
          color: #e0e0e0;
          font-size: 14px;
          font-family: inherit;
        }

        input:disabled,
        select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        input:focus,
        select:focus {
          outline: none;
          border-color: #666;
          background: #1a1a1a;
        }

        input[type="file"] {
          cursor: pointer;
        }

        .status-message {
          margin: 8px 0 0 0;
          padding: 8px 12px;
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid #4caf80;
          border-radius: 4px;
          font-size: 13px;
          color: #4caf80;
        }

        .current-asset {
          margin-top: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .current-asset .label {
          margin: 0 0 8px 0;
          font-size: 13px;
          font-weight: 500;
          color: #aaa;
        }

        .asset-path {
          margin: 0 0 8px 0;
          padding: 8px;
          background: #0d0d0d;
          border-radius: 4px;
          font-size: 12px;
          color: #888;
          word-break: break-word;
          font-family: monospace;
        }

        .current-asset video,
        .current-asset img {
          margin-top: 8px;
          border-radius: 4px;
          display: block;
        }

        .modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-top: 1px solid #333;
          gap: 12px;
        }

        .button-group {
          display: flex;
          gap: 12px;
        }

        .button {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: #333;
          color: #e0e0e0;
        }

        .button:hover {
          background: #444;
        }

        .button--primary {
          background: #0066cc;
          color: white;
        }

        .button--primary:hover {
          background: #0052a3;
        }

        .button--secondary {
          background: transparent;
          border: 1px solid #444;
        }

        .button--secondary:hover {
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  )
}
