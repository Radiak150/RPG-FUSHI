import {
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  isImageFile,
  loadImage,
  readFileAsDataUrl,
  readImageFileAsDataUrl,
  replaceImageFileExtension,
  uploadImageBlobAsAsset,
} from '../../lib/localImages'

interface LocalImageInputProps {
  label: string
  value?: string
  onChange: (nextValue: string) => void
  aspect?: 'square' | 'wide' | 'item'
}

interface CropDraft {
  filename: string
  isApplying: boolean
  naturalSize: {
    height: number
    width: number
  } | null
  offsetX: number
  offsetY: number
  src: string
  zoom: number
}

interface CropOffset {
  x: number
  y: number
}

const CROP_OUTPUT_SIZE = 512
const CROP_VIEWPORT_FALLBACK_SIZE = 420
const CROP_ZOOM_MIN = 1
const CROP_ZOOM_MAX = 3

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

function getCoverDisplaySize(
  naturalSize: NonNullable<CropDraft['naturalSize']>,
  viewportSize: number,
  zoom: number,
) {
  const imageRatio = naturalSize.width / naturalSize.height
  const baseWidth = imageRatio >= 1 ? viewportSize * imageRatio : viewportSize
  const baseHeight = imageRatio >= 1 ? viewportSize : viewportSize / imageRatio

  return {
    height: baseHeight * zoom,
    width: baseWidth * zoom,
  }
}

function clampCropOffset(
  naturalSize: CropDraft['naturalSize'],
  viewportSize: number,
  zoom: number,
  offset: CropOffset,
) {
  if (!naturalSize) {
    return offset
  }

  const displaySize = getCoverDisplaySize(naturalSize, viewportSize, zoom)
  const maxX = Math.max(0, (displaySize.width - viewportSize) / 2)
  const maxY = Math.max(0, (displaySize.height - viewportSize) / 2)

  return {
    x: clamp(offset.x, -maxX, maxX),
    y: clamp(offset.y, -maxY, maxY),
  }
}

export function LocalImageInput({
  label,
  value,
  onChange,
  aspect = 'square',
}: LocalImageInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const cropViewportRef = useRef<HTMLDivElement | null>(null)
  const cropDragRef = useRef<{
    pointerId: number
    startClientX: number
    startClientY: number
    startOffsetX: number
    startOffsetY: number
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const [cropDraft, setCropDraft] = useState<CropDraft | null>(null)
  const shouldCropImage = aspect === 'square' || aspect === 'item'

  function getViewportSize() {
    return (
      cropViewportRef.current?.getBoundingClientRect().width ??
      CROP_VIEWPORT_FALLBACK_SIZE
    )
  }

  async function handleFile(file: File | null) {
    if (!file) {
      return
    }

    try {
      if (shouldCropImage) {
        if (!isImageFile(file)) {
          throw new Error('Selecione um arquivo de imagem valido.')
        }

        const sourceDataUrl = await readFileAsDataUrl(file)

        setCropDraft({
          filename: file.name,
          isApplying: false,
          naturalSize: null,
          offsetX: 0,
          offsetY: 0,
          src: sourceDataUrl,
          zoom: 1,
        })
        setError('')
        return
      }

      const nextValue = await readImageFileAsDataUrl(file)
      onChange(nextValue)
      setError('')
    } catch (fileError) {
      setError(
        fileError instanceof Error
          ? fileError.message
          : 'Nao foi possivel carregar a imagem.',
      )
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)

    const nextFile = event.dataTransfer.files?.[0] ?? null
    void handleFile(nextFile)
  }

  function updateCropZoom(nextZoom: number) {
    setCropDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft
      }

      const zoom = clamp(nextZoom, CROP_ZOOM_MIN, CROP_ZOOM_MAX)
      const offset = clampCropOffset(
        currentDraft.naturalSize,
        getViewportSize(),
        zoom,
        {
          x: currentDraft.offsetX,
          y: currentDraft.offsetY,
        },
      )

      return {
        ...currentDraft,
        offsetX: offset.x,
        offsetY: offset.y,
        zoom,
      }
    })
  }

  function handleCropPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!cropDraft) {
      return
    }

    cropDragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: cropDraft.offsetX,
      startOffsetY: cropDraft.offsetY,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleCropPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = cropDragRef.current

    if (!dragState || !cropDraft || dragState.pointerId !== event.pointerId) {
      return
    }

    const offset = clampCropOffset(
      cropDraft.naturalSize,
      getViewportSize(),
      cropDraft.zoom,
      {
        x: dragState.startOffsetX + event.clientX - dragState.startClientX,
        y: dragState.startOffsetY + event.clientY - dragState.startClientY,
      },
    )

    setCropDraft({
      ...cropDraft,
      offsetX: offset.x,
      offsetY: offset.y,
    })
  }

  function handleCropPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (cropDragRef.current?.pointerId === event.pointerId) {
      cropDragRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  async function applyCrop() {
    if (!cropDraft || !cropDraft.naturalSize) {
      return
    }

    setCropDraft({
      ...cropDraft,
      isApplying: true,
    })

    try {
      const image = await loadImage(cropDraft.src)
      const viewportSize = getViewportSize()
      const displaySize = getCoverDisplaySize(
        cropDraft.naturalSize,
        viewportSize,
        cropDraft.zoom,
      )
      const imageLeft = viewportSize / 2 + cropDraft.offsetX - displaySize.width / 2
      const imageTop = viewportSize / 2 + cropDraft.offsetY - displaySize.height / 2
      const sourceX = clamp(
        ((0 - imageLeft) / displaySize.width) * cropDraft.naturalSize.width,
        0,
        cropDraft.naturalSize.width,
      )
      const sourceY = clamp(
        ((0 - imageTop) / displaySize.height) * cropDraft.naturalSize.height,
        0,
        cropDraft.naturalSize.height,
      )
      const sourceWidth = clamp(
        (viewportSize / displaySize.width) * cropDraft.naturalSize.width,
        1,
        cropDraft.naturalSize.width - sourceX,
      )
      const sourceHeight = clamp(
        (viewportSize / displaySize.height) * cropDraft.naturalSize.height,
        1,
        cropDraft.naturalSize.height - sourceY,
      )
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Nao foi possivel preparar o recorte da imagem.')
      }

      canvas.width = CROP_OUTPUT_SIZE
      canvas.height = CROP_OUTPUT_SIZE
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        CROP_OUTPUT_SIZE,
        CROP_OUTPUT_SIZE,
      )

      const croppedBlob = await canvasToBlob(canvas, 'image/webp', 0.92)

      if (!croppedBlob) {
        throw new Error('Nao foi possivel gerar o recorte da imagem.')
      }

      const uploadedUrl = await uploadImageBlobAsAsset(
        croppedBlob,
        replaceImageFileExtension(cropDraft.filename, '.webp'),
      )

      onChange(uploadedUrl)
      setCropDraft(null)
      setError('')
    } catch (cropError) {
      setError(
        cropError instanceof Error
          ? cropError.message
          : 'Nao foi possivel aplicar o recorte.',
      )
      setCropDraft((currentDraft) =>
        currentDraft
          ? {
              ...currentDraft,
              isApplying: false,
            }
          : currentDraft,
      )
    }
  }

  const cropImageStyle: CSSProperties | undefined =
    cropDraft?.naturalSize
      ? {
          height:
            cropDraft.naturalSize.width >= cropDraft.naturalSize.height
              ? `${100 * cropDraft.zoom}%`
              : `${(cropDraft.naturalSize.height / cropDraft.naturalSize.width) * 100 * cropDraft.zoom}%`,
          transform: `translate(-50%, -50%) translate(${cropDraft.offsetX}px, ${cropDraft.offsetY}px)`,
          width:
            cropDraft.naturalSize.width >= cropDraft.naturalSize.height
              ? `${(cropDraft.naturalSize.width / cropDraft.naturalSize.height) * 100 * cropDraft.zoom}%`
              : `${100 * cropDraft.zoom}%`,
        }
      : undefined

  return (
    <div className="local-image-field">
      <span className="field__label">{label}</span>

      <div
        className={`local-image-field__dropzone local-image-field__dropzone--${aspect}${
          isDragging ? ' local-image-field__dropzone--dragging' : ''
        }`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDragOver={(event) => {
          event.preventDefault()
        }}
        onDrop={handleDrop}
        role="presentation"
      >
        {value ? (
          <img
            alt="Imagem selecionada"
            className="local-image-field__preview"
            src={value}
          />
        ) : (
          <div className="local-image-field__placeholder">
            <strong>Coloque imagem</strong>
            <span>Clique ou arraste um arquivo do computador.</span>
          </div>
        )}
      </div>

      <input
        accept="image/*"
        className="local-image-field__input"
        onChange={(event) => {
          void handleFile(event.target.files?.[0] ?? null)
          event.currentTarget.value = ''
        }}
        ref={inputRef}
        type="file"
      />

      <div className="flow-card__actions">
        <button
          className="button"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          Escolher imagem
        </button>

        {value ? (
          <button className="button" onClick={() => onChange('')} type="button">
            Remover imagem
          </button>
        ) : null}
      </div>

      {error ? <p className="support-copy support-copy--danger">{error}</p> : null}

      {cropDraft ? (
        <div className="local-image-cropper__overlay" role="presentation">
          <section
            aria-modal="true"
            className="local-image-cropper"
            role="dialog"
          >
            <header className="local-image-cropper__header">
              <h2>Editar imagem</h2>
              <button
                aria-label="Fechar editor de imagem"
                className="local-image-cropper__close"
                onClick={() => setCropDraft(null)}
                type="button"
              >
                x
              </button>
            </header>

            <div
              className="local-image-cropper__viewport"
              onPointerCancel={handleCropPointerUp}
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerUp}
              ref={cropViewportRef}
            >
              <img
                alt=""
                className="local-image-cropper__image"
                draggable={false}
                onLoad={(event) => {
                  const nextNaturalSize = {
                    height: event.currentTarget.naturalHeight,
                    width: event.currentTarget.naturalWidth,
                  }
                  const offset = clampCropOffset(
                    nextNaturalSize,
                    getViewportSize(),
                    cropDraft.zoom,
                    {
                      x: cropDraft.offsetX,
                      y: cropDraft.offsetY,
                    },
                  )

                  setCropDraft((currentDraft) =>
                    currentDraft
                      ? {
                          ...currentDraft,
                          naturalSize: nextNaturalSize,
                          offsetX: offset.x,
                          offsetY: offset.y,
                        }
                      : currentDraft,
                  )
                }}
                src={cropDraft.src}
                style={cropImageStyle}
              />
              <span className="local-image-cropper__frame" />
            </div>

            <div className="local-image-cropper__controls">
              <button
                className="button"
                onClick={() => inputRef.current?.click()}
                type="button"
              >
                Escolher outra imagem
              </button>
              <label className="local-image-cropper__zoom">
                <span>Zoom</span>
                <input
                  max={CROP_ZOOM_MAX}
                  min={CROP_ZOOM_MIN}
                  onChange={(event) => updateCropZoom(Number(event.target.value))}
                  step={0.01}
                  type="range"
                  value={cropDraft.zoom}
                />
              </label>
            </div>

            <footer className="local-image-cropper__footer">
              <button
                className="button button--ghost"
                onClick={() =>
                  setCropDraft({
                    ...cropDraft,
                    offsetX: 0,
                    offsetY: 0,
                    zoom: 1,
                  })
                }
                type="button"
              >
                Redefinir
              </button>
              <span className="local-image-cropper__spacer" />
              <button
                className="button"
                onClick={() => setCropDraft(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="button button--primary"
                disabled={!cropDraft.naturalSize || cropDraft.isApplying}
                onClick={() => void applyCrop()}
                type="button"
              >
                {cropDraft.isApplying ? 'Aplicando...' : 'Aplicar'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )
}
