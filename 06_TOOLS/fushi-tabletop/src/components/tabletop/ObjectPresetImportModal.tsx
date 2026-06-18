import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { TabletopBoardObject } from '../../data/types'
import { uploadPhysicalAsset } from '../../lib/physicalAssets'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'

export interface ObjectPresetImportSaveData {
  assetUrl: string
  color: string
  description: string
  label: string
  libraryKind: 'animation' | 'object'
  modelFormat?: string
  modelUrl?: string
  name: string
  objectType: TabletopBoardObject['objectType']
  placementScale?: number
  previewImage?: string
  renderMode: TabletopBoardObject['renderMode']
  size: TabletopBoardObject['size']
  sourceFileName?: string
}

interface ObjectPresetImportModalProps {
  campaignId: string
  libraryKind: 'animation' | 'object'
  onClose: () => void
  onSave: (data: ObjectPresetImportSaveData) => void
}

const modelAccept = '.glb,.gltf,.obj,.fbx,.stl'
const imageAccept = 'image/png,image/jpeg,image/webp,image/gif,image/*'

const supportedModelExtensions = new Set(['glb', 'gltf', 'obj', 'fbx', 'stl'])

const objectTypeOptions: Array<{
  label: string
  value: TabletopBoardObject['objectType']
}> = [
  { value: 'prop', label: 'Prop' },
  { value: 'item', label: 'Item' },
  { value: 'objective', label: 'Objetivo' },
  { value: 'hazard', label: 'Perigo' },
]

const sizeOptions: Array<{ label: string; value: TabletopBoardObject['size'] }> = [
  { value: 1, label: '1 celula' },
  { value: 2, label: '2 celulas' },
  { value: 3, label: '3 celulas' },
]

function getFileExtension(filename: string) {
  const match = /\.([a-z0-9]+)$/i.exec(filename.trim())

  return match?.[1]?.toLowerCase() ?? ''
}

function getModelContentType(filename: string, fallback: string) {
  switch (getFileExtension(filename)) {
    case 'glb':
      return 'model/gltf-binary'
    case 'gltf':
      return 'model/gltf+json'
    case 'obj':
      return 'model/obj'
    case 'stl':
      return 'model/stl'
    case 'fbx':
      return 'application/octet-stream'
    default:
      return fallback || 'application/octet-stream'
  }
}

function createShortLabel(name: string, label: string, fallback: string) {
  const rawLabel = (label.trim() || name.trim() || fallback)
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 3)
    .toUpperCase()

  return rawLabel || fallback
}

function clampPlacementScale(value: number) {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.min(80, Math.max(0.01, value))
}

export function ObjectPresetImportModal({
  campaignId,
  libraryKind,
  onClose,
  onSave,
}: ObjectPresetImportModalProps) {
  const isAnimation = libraryKind === 'animation'
  const [formData, setFormData] = useState<ObjectPresetImportSaveData>({
    assetUrl: '',
    color: isAnimation ? '#7dd7ff' : '#e9c97e',
    description: '',
    label: isAnimation ? 'FX' : 'OBJ',
    libraryKind,
    name: isAnimation ? 'Nova Animacao' : 'Novo Objeto',
    objectType: isAnimation ? 'hazard' : 'prop',
    placementScale: 1,
    renderMode: 'three',
    size: 1,
  })
  const [statusMessage, setStatusMessage] = useState('')
  const [isUploadingModel, setIsUploadingModel] = useState(false)
  const [isUploadingPreview, setIsUploadingPreview] = useState(false)
  const isBusy = isUploadingModel || isUploadingPreview

  async function handleModelFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const extension = getFileExtension(file.name)

    if (!supportedModelExtensions.has(extension)) {
      setStatusMessage('Formato 3D aceito: GLB, GLTF, OBJ, FBX ou STL.')
      event.target.value = ''
      return
    }

    setIsUploadingModel(true)
    setStatusMessage('Salvando modelo 3D...')

    try {
      const uploadedAsset = await uploadPhysicalAsset(file, {
        campaignId,
        category: 'misc',
        contentType: getModelContentType(file.name, file.type),
        filename: file.name,
      })

      setFormData((current) => ({
        ...current,
        modelFormat: extension,
        modelUrl: uploadedAsset.url,
        renderMode: 'three',
        sourceFileName: file.name,
      }))
      setStatusMessage(`${file.name} salvo.`)
      window.setTimeout(() => setStatusMessage(''), 2400)
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Erro ao salvar modelo 3D.',
      )
    } finally {
      setIsUploadingModel(false)
      event.target.value = ''
    }
  }

  async function handlePreviewFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsUploadingPreview(true)
    setStatusMessage('Salvando preview...')

    try {
      const uploadedAsset = await uploadPhysicalAsset(file, {
        campaignId,
        category: 'images',
        contentType: file.type || 'application/octet-stream',
        filename: file.name,
      })

      setFormData((current) => ({
        ...current,
        assetUrl: current.renderMode === 'sprite' ? uploadedAsset.url : current.assetUrl,
        previewImage: uploadedAsset.url,
      }))
      setStatusMessage(`${file.name} salvo.`)
      window.setTimeout(() => setStatusMessage(''), 2400)
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Erro ao salvar preview.',
      )
    } finally {
      setIsUploadingPreview(false)
      event.target.value = ''
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextName = formData.name.trim()
    const nextLabel = createShortLabel(
      nextName,
      formData.label,
      isAnimation ? 'FX' : 'OBJ',
    )
    const nextPlacementScale = clampPlacementScale(formData.placementScale ?? 1)

    if (!nextName) {
      setStatusMessage('Informe um nome.')
      return
    }

    if (formData.renderMode === 'three' && !formData.modelUrl) {
      setStatusMessage('Selecione um modelo 3D.')
      return
    }

    if (formData.renderMode === 'sprite' && !formData.previewImage) {
      setStatusMessage('Selecione uma imagem.')
      return
    }

    onSave({
      ...formData,
      assetUrl:
        formData.renderMode === 'sprite'
          ? formData.previewImage ?? formData.assetUrl
          : formData.assetUrl,
      description: formData.description.trim(),
      label: nextLabel,
      name: nextName,
      placementScale: nextPlacementScale,
      previewImage: formData.previewImage,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <form
        className="modal-content modal-content--wide"
        data-testid="object-preset-import-modal"
        onSubmit={handleSubmit}
      >
        <div className="modal-header">
          <h2>{isAnimation ? 'Adicionar Animacao' : 'Adicionar Objeto'}</h2>
          <button
            aria-label="Fechar modal"
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>

        <div className="modal-body object-preset-import">
          <fieldset>
            <legend>Cadastro</legend>
            <div className="object-preset-import__grid">
              <label>
                <span>Nome</span>
                <input
                  data-testid="object-preset-name"
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  type="text"
                  value={formData.name}
                />
              </label>
              <label>
                <span>Sigla</span>
                <input
                  maxLength={3}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      label: event.target.value.toUpperCase(),
                    }))
                  }
                  type="text"
                  value={formData.label}
                />
              </label>
              <label>
                <span>Tipo</span>
                <select
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      objectType: event.target
                        .value as TabletopBoardObject['objectType'],
                    }))
                  }
                  value={formData.objectType}
                >
                  {objectTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Render</span>
                <select
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      assetUrl:
                        event.target.value === 'sprite'
                          ? current.previewImage ?? current.assetUrl
                          : '',
                      renderMode: event.target
                        .value as TabletopBoardObject['renderMode'],
                    }))
                  }
                  value={formData.renderMode}
                >
                  <option value="three">3D</option>
                  <option value="sprite">Imagem</option>
                </select>
              </label>
              <label>
                <span>Tamanho</span>
                <select
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      size: Number(event.target.value) as TabletopBoardObject['size'],
                    }))
                  }
                  value={formData.size}
                >
                  {sizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Escala 3D</span>
                <input
                  min="0.01"
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      placementScale: Number(event.target.value),
                    }))
                  }
                  step="0.01"
                  type="number"
                  value={formData.placementScale ?? 1}
                />
              </label>
              <label>
                <span>Cor</span>
                <input
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      color: event.target.value,
                    }))
                  }
                  type="color"
                  value={formData.color}
                />
              </label>
            </div>
            <label>
              <span>Descricao</span>
              <textarea
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                value={formData.description}
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Arquivos</legend>
            <div className="object-preset-import__grid">
              <label>
                <span>Modelo 3D</span>
                <input
                  accept={modelAccept}
                  data-testid="object-preset-model-file"
                  disabled={isUploadingModel}
                  onChange={handleModelFileSelect}
                  type="file"
                />
              </label>
              <label>
                <span>Preview PNG/JPG</span>
                <input
                  accept={imageAccept}
                  data-testid="object-preset-preview-file"
                  disabled={isUploadingPreview}
                  onChange={handlePreviewFileSelect}
                  type="file"
                />
              </label>
            </div>

            <div className="object-preset-import__preview-row">
              <span className="tabletop-object-preset__preview">
                {formData.previewImage ? (
                  <img
                    alt=""
                    src={resolveRuntimeAssetUrl(formData.previewImage)}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="tabletop-object-preview-3d tabletop-object-preview-3d--preset"
                    data-preview-kind={isAnimation ? 'vfx' : 'object'}
                    style={{
                      ['--object-preview-color' as string]: formData.color,
                    }}
                  />
                )}
              </span>
              <div>
                <strong>
                  {formData.sourceFileName ?? 'Sem modelo 3D selecionado'}
                </strong>
                <small>
                  {formData.previewImage
                    ? 'Preview definido'
                    : 'Preview padrao'}
                </small>
              </div>
            </div>

            <p className="form-note">3D: GLB, GLTF, OBJ, FBX ou STL.</p>
          </fieldset>

          {statusMessage ? (
            <p
              className="form-status"
              data-testid="object-preset-import-status"
            >
              {statusMessage}
            </p>
          ) : null}
        </div>

        <div className="modal-footer">
          <button className="button button--ghost" onClick={onClose} type="button">
            Cancelar
          </button>
          <button
            className="button button--primary"
            data-testid="object-preset-save"
            disabled={isBusy}
            type="submit"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}
