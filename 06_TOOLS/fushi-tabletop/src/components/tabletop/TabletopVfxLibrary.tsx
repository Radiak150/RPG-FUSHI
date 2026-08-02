import { useMemo, useState, type CSSProperties } from 'react'
import {
  ArrowRightLeft,
  CircleStop,
  Cloud,
  Eye,
  Layers3,
  Radio,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import {
  TABLETOP_VFX_CATALOG,
  type TabletopVfxCategory,
  type TabletopVfxPreset,
} from '../../data/vfxCatalog'
import type { TabletopStatusParticipant } from './TabletopStatusManager'
import { TabletopVisualLibrary } from './TabletopVisualLibrary'
import { TabletopVisualThumbnailPicker } from './TabletopVisualThumbnailPicker'

const CATEGORY_LABELS: Record<'all' | TabletopVfxCategory, string> = {
  all: 'Todos os efeitos',
  ambiente: 'Ambiente',
  energia: 'Energia',
  impacto: 'Impacto',
  transicao: 'Transição',
}

const CATEGORY_ICONS: Record<'all' | TabletopVfxCategory, LucideIcon> = {
  all: Layers3,
  ambiente: Cloud,
  energia: Zap,
  impacto: Sparkles,
  transicao: ArrowRightLeft,
}

export function TabletopVfxLibrary({
  activePresetId,
  campaignId,
  onBroadcast,
  onClear,
  onPreview,
  onSetVisualThumbnail,
  participants,
  visualThumbnails,
}: {
  activePresetId: string
  campaignId?: string
  onBroadcast: (preset: TabletopVfxPreset, targetTokenId?: string) => void
  onClear: () => void
  onPreview: (preset: TabletopVfxPreset, targetTokenId?: string) => void
  onSetVisualThumbnail: (key: string, value: string) => void
  participants: TabletopStatusParticipant[]
  visualThumbnails: Record<string, string>
}) {
  const [category, setCategory] = useState<'all' | TabletopVfxCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [targetTokenId, setTargetTokenId] = useState('')

  const visiblePresets = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase('pt-BR')
    return TABLETOP_VFX_CATALOG.filter((preset) => {
      if (category !== 'all' && preset.category !== category) return false
      if (!normalizedSearch) return true
      return `${preset.label} ${preset.description} ${CATEGORY_LABELS[preset.category]}`
        .toLocaleLowerCase('pt-BR')
        .includes(normalizedSearch)
    })
  }, [category, searchQuery])

  const selectedTargetId =
    participants.some((participant) => participant.id === targetTokenId)
      ? targetTokenId
      : participants[0]?.id ?? ''

  function getTargetId(preset: TabletopVfxPreset) {
    return preset.scope === 'token' ? selectedTargetId || undefined : undefined
  }

  const sidebar = (
    <>
      <nav aria-label="Categorias de efeitos" className="tabletop-visual-library__nav">
        {(Object.keys(CATEGORY_LABELS) as Array<'all' | TabletopVfxCategory>).map(
          (nextCategory) => {
            const Icon = CATEGORY_ICONS[nextCategory]
            const count =
              nextCategory === 'all'
                ? TABLETOP_VFX_CATALOG.length
                : TABLETOP_VFX_CATALOG.filter(
                    (preset) => preset.category === nextCategory,
                  ).length
            return (
              <button
                aria-current={category === nextCategory ? 'page' : undefined}
                className={category === nextCategory ? 'is-active' : ''}
                key={nextCategory}
                onClick={() => setCategory(nextCategory)}
                type="button"
              >
                <Icon aria-hidden="true" size={17} />
                <span>{CATEGORY_LABELS[nextCategory]}</span>
                <small>{count}</small>
              </button>
            )
          },
        )}
      </nav>

      <div className="tabletop-visual-library__sidebar-section">
        <p className="eyebrow">Alvo por token</p>
        <label className="field">
          <span className="sr-only">Alvo do efeito</span>
          <select
            className="field__input"
            disabled={participants.length === 0}
            onChange={(event) => setTargetTokenId(event.target.value)}
            value={selectedTargetId}
          >
            {participants.length === 0 ? (
              <option value="">Nenhum token disponível</option>
            ) : (
              participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name} [{participant.label}]
                </option>
              ))
            )}
          </select>
        </label>
        <p className="support-copy">
          Efeitos de mapa ignoram este alvo. Efeitos de token usam a seleção atual.
        </p>
      </div>
    </>
  )

  return (
    <TabletopVisualLibrary
      actions={
        activePresetId ? (
          <button
            aria-label="Parar efeito atual"
            className="tabletop-visual-library-icon-button is-danger"
            onClick={onClear}
            title="Parar efeito atual"
            type="button"
          >
            <CircleStop size={18} />
          </button>
        ) : null
      }
      className="tabletop-vfx-library tabletop-vfx-library--visual"
      code="VFX"
      contentHeader={
        <div>
          <p className="eyebrow">{CATEGORY_LABELS[category]}</p>
          <h3>{visiblePresets.length} efeito(s)</h3>
          <p className="support-copy">
            Prévia é local. Transmitir mostra um pulso sincronizado para toda a mesa.
          </p>
        </div>
      }
      icon={Sparkles}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Buscar efeito"
      searchValue={searchQuery}
      sidebar={sidebar}
      testId="tabletop-vfx-library"
      title="Biblioteca de efeitos"
    >
      {visiblePresets.length > 0 ? (
        <div className="tabletop-visual-library__grid tabletop-vfx-library__grid">
          {visiblePresets.map((preset) => {
            const targetId = getTargetId(preset)
            const isActive = activePresetId === preset.id

            return (
              <article
                className={[
                  'tabletop-visual-library-card',
                  'tabletop-vfx-library__card',
                  isActive ? 'tabletop-vfx-library__card--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={preset.id}
                style={{ '--vfx-card-color': preset.color } as CSSProperties}
              >
                <TabletopVisualThumbnailPicker
                  alt={preset.label}
                  campaignId={campaignId}
                  className="tabletop-vfx-library__thumbnail"
                  fallback={
                    <div
                      className="tabletop-visual-library-card__media tabletop-vfx-library__swatch"
                    >
                      <span />
                      <Sparkles size={28} />
                    </div>
                  }
                  onChange={(value) =>
                    onSetVisualThumbnail(`vfx:${preset.id}`, value)
                  }
                  value={visualThumbnails[`vfx:${preset.id}`]}
                />
                <div className="tabletop-visual-library-card__body tabletop-vfx-library__copy">
                  <div className="tabletop-vfx-library__card-top">
                    <div>
                      <p className="eyebrow">{CATEGORY_LABELS[preset.category]}</p>
                      <h4>{preset.label}</h4>
                    </div>
                    <span className="tag">
                      {preset.scope === 'map' ? 'Mapa' : 'Token'}
                    </span>
                  </div>
                  <p className="support-copy">{preset.description}</p>
                  <div className="tag-row">
                    <span className="tag">{preset.durationMs} ms</span>
                    <span className="tag">Sem estado residual</span>
                  </div>
                </div>
                <div className="tabletop-visual-library-card__actions tabletop-vfx-library__actions">
                  <button
                    aria-label={`Prévia local de ${preset.label}`}
                    onClick={() => onPreview(preset, targetId)}
                    title="Prévia local"
                    type="button"
                  >
                    <Eye size={17} />
                  </button>
                  <button
                    aria-label={`Mostrar ${preset.label} na mesa`}
                    className="is-primary"
                    onClick={() => onBroadcast(preset, targetId)}
                    title="Mostrar na mesa"
                    type="button"
                  >
                    <Radio size={17} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="tabletop-visual-library__empty">
          <Sparkles aria-hidden="true" size={28} />
          <strong>Nenhum efeito encontrado</strong>
          <span>Ajuste a categoria ou a busca.</span>
        </div>
      )}
    </TabletopVisualLibrary>
  )
}
