import { useMemo, useState, type CSSProperties } from 'react'
import {
  TABLETOP_VFX_CATALOG,
  type TabletopVfxCategory,
  type TabletopVfxPreset,
} from '../../data/vfxCatalog'
import type { TabletopStatusParticipant } from './TabletopStatusManager'

const CATEGORY_LABELS: Record<'all' | TabletopVfxCategory, string> = {
  all: 'Todos',
  ambiente: 'Ambiente',
  energia: 'Energia',
  impacto: 'Impacto',
  transicao: 'Transicao',
}

export function TabletopVfxLibrary({
  activePresetId,
  onBroadcast,
  onClear,
  onPreview,
  participants,
}: {
  activePresetId: string
  onBroadcast: (preset: TabletopVfxPreset, targetTokenId?: string) => void
  onClear: () => void
  onPreview: (preset: TabletopVfxPreset, targetTokenId?: string) => void
  participants: TabletopStatusParticipant[]
}) {
  const [category, setCategory] = useState<'all' | TabletopVfxCategory>('all')
  const [targetTokenId, setTargetTokenId] = useState('')

  const visiblePresets = useMemo(
    () =>
      TABLETOP_VFX_CATALOG.filter(
        (preset) => category === 'all' || preset.category === category,
      ),
    [category],
  )

  const selectedTargetId =
    participants.some((participant) => participant.id === targetTokenId)
      ? targetTokenId
      : participants[0]?.id ?? ''

  function getTargetId(preset: TabletopVfxPreset) {
    return preset.scope === 'token' ? selectedTargetId || undefined : undefined
  }

  return (
    <section className="tabletop-vfx-library" data-testid="tabletop-vfx-library">
      <header className="tabletop-vfx-library__header">
        <div>
          <p className="eyebrow">VFX efêmero</p>
          <h3>Biblioteca de efeitos da mesa</h3>
          <p className="support-copy">
            Prévia local não altera a sessão. Mostrar na mesa envia somente um
            pulso visual sincronizado para todos.
          </p>
        </div>
        <div className="tag-row">
          <span className="tag">{TABLETOP_VFX_CATALOG.length} presets</span>
          <span className="tag">Leve · CSS</span>
          {activePresetId ? <span className="tag">Ativo</span> : null}
        </div>
      </header>

      <div
        aria-label="Filtrar VFX"
        className="tabletop-vfx-library__filters"
        role="tablist"
      >
        {(Object.keys(CATEGORY_LABELS) as Array<
          'all' | TabletopVfxCategory
        >).map((nextCategory) => (
          <button
            aria-selected={category === nextCategory}
            className={
              category === nextCategory
                ? 'tabletop-vfx-library__filter tabletop-vfx-library__filter--active'
                : 'tabletop-vfx-library__filter'
            }
            key={nextCategory}
            onClick={() => setCategory(nextCategory)}
            role="tab"
            type="button"
          >
            {CATEGORY_LABELS[nextCategory]}
          </button>
        ))}
      </div>

      <label className="tabletop-vfx-library__target field">
        <span>Alvo de efeito por token</span>
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

      <div className="tabletop-vfx-library__grid">
        {visiblePresets.map((preset) => {
          const targetId = getTargetId(preset)
          const isActive = activePresetId === preset.id

          return (
            <article
              className={[
                'tabletop-vfx-library__card',
                isActive ? 'tabletop-vfx-library__card--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={preset.id}
              style={{ '--vfx-card-color': preset.color } as CSSProperties}
            >
              <div className="tabletop-vfx-library__swatch" aria-hidden="true">
                <span />
              </div>
              <div className="tabletop-vfx-library__copy">
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
                  <span className="tag">Sin estado residual</span>
                </div>
              </div>
              <div className="tabletop-vfx-library__actions">
                <button
                  className="button button--ghost"
                  onClick={() => onPreview(preset, targetId)}
                  type="button"
                >
                  Prévia local
                </button>
                <button
                  className="button"
                  onClick={() => onBroadcast(preset, targetId)}
                  type="button"
                >
                  Mostrar na mesa
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {activePresetId ? (
        <button className="button button--danger" onClick={onClear} type="button">
          Parar efeito atual
        </button>
      ) : null}
    </section>
  )
}
