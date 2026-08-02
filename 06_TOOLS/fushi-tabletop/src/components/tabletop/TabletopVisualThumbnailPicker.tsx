import {
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { uploadPhysicalAsset } from '../../lib/physicalAssets'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'

interface TabletopVisualThumbnailPickerProps {
  alt: string
  campaignId?: string
  className?: string
  fallback: ReactNode
  onChange: (value: string) => void
  value?: string
}

const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export function TabletopVisualThumbnailPicker({
  alt,
  campaignId,
  className = '',
  fallback,
  onChange,
  value = '',
}: TabletopVisualThumbnailPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setFeedback('Use uma imagem PNG, JPG ou WebP.')
      return
    }

    setIsUploading(true)
    setFeedback('Salvando capa...')

    try {
      const uploadedAsset = await uploadPhysicalAsset(file, {
        campaignId,
        category: 'images',
        contentType: file.type,
        filename: `visual-${Date.now()}-${file.name}`,
      })

      onChange(uploadedAsset.url)
      setFeedback('Capa atualizada.')
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'Nao foi possivel salvar a capa.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={`tabletop-visual-thumbnail${className ? ` ${className}` : ''}`}>
      <div className="tabletop-visual-thumbnail__media">
        {value ? (
          <img alt={alt} src={resolveRuntimeAssetUrl(value)} />
        ) : (
          <div className="tabletop-visual-thumbnail__fallback" aria-hidden="true">
            {fallback}
          </div>
        )}
      </div>
      <div className="tabletop-visual-thumbnail__actions">
        <button
          aria-label={value ? `Trocar capa de ${alt}` : `Adicionar capa a ${alt}`}
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          title={value ? 'Trocar capa' : 'Adicionar capa'}
          type="button"
        >
          <ImagePlus size={16} />
        </button>
        {value ? (
          <button
            aria-label={`Remover capa de ${alt}`}
            className="is-danger"
            disabled={isUploading}
            onClick={() => {
              onChange('')
              setFeedback('Capa removida.')
            }}
            title="Remover capa"
            type="button"
          >
            <Trash2 size={16} />
          </button>
        ) : null}
      </div>
      <input
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        hidden
        onChange={handleImageChange}
        ref={inputRef}
        type="file"
      />
      {feedback ? (
        <small className="tabletop-visual-thumbnail__feedback" role="status">
          {feedback}
        </small>
      ) : null}
    </div>
  )
}
