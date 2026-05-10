import { useRef, useState, type DragEvent } from 'react'
import { readImageFileAsDataUrl } from '../../lib/localImages'

interface LocalImageInputProps {
  label: string
  value?: string
  onChange: (nextValue: string) => void
  aspect?: 'square' | 'wide' | 'item'
}

export function LocalImageInput({
  label,
  value,
  onChange,
  aspect = 'square',
}: LocalImageInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File | null) {
    if (!file) {
      return
    }

    try {
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
        onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
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
    </div>
  )
}
