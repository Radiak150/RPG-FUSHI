import type { TabletopCinematicAsset } from '../../data/types'

interface TabletopCinematicOverlayProps {
  cinematic: TabletopCinematicAsset
  onClose: () => void
}

function getCategoryLabel(category: TabletopCinematicAsset['category']) {
  if (category === 'boss-entry') {
    return 'Entrada de boss'
  }

  if (category === 'domain') {
    return 'Dominio'
  }

  if (category === 'transition') {
    return 'Transicao'
  }

  return 'Intro de cena'
}

function getPlaceholderLabel(category: TabletopCinematicAsset['category']) {
  if (category === 'boss-entry') {
    return 'BOSS'
  }

  if (category === 'domain') {
    return 'DOM'
  }

  if (category === 'transition') {
    return 'CUT'
  }

  return 'INTRO'
}

export function TabletopCinematicOverlay({
  cinematic,
  onClose,
}: TabletopCinematicOverlayProps) {
  return (
    <div className="tabletop-cinematic-overlay" role="dialog" aria-modal="true">
      <button
        aria-label="Fechar cinematic"
        className="tabletop-cinematic-overlay__backdrop"
        onClick={onClose}
        type="button"
      />

      <div className="tabletop-overlay-card tabletop-overlay-card--cinematic">
        <div className="tabletop-cinematic-overlay__media">
          {cinematic.previewImage ? (
            <img
              alt={cinematic.name}
              className="tabletop-cinematic-overlay__image"
              src={cinematic.previewImage}
            />
          ) : (
            <div className="tabletop-cinematic-overlay__placeholder">
              {getPlaceholderLabel(cinematic.category)}
            </div>
          )}
        </div>

        <div className="tabletop-cinematic-overlay__body">
          <p className="eyebrow">{getCategoryLabel(cinematic.category)}</p>
          <h2>{cinematic.name}</h2>
          <p className="support-copy">{cinematic.summary}</p>
          <p className="support-copy">
            Placeholder visual simples. Nao altera audio, mapa ou estado da cena.
          </p>
        </div>

        <div className="tabletop-cinematic-overlay__actions">
          <button className="button button--primary" onClick={onClose} type="button">
            Continuar
          </button>
          <button className="button" onClick={onClose} type="button">
            Fechar overlay
          </button>
        </div>
      </div>
    </div>
  )
}
