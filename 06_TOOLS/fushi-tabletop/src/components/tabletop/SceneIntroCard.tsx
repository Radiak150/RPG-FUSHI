import type { TabletopIntroCardRuntime } from '../../lib/tabletopRuntime'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'

interface SceneIntroCardProps {
  introCard: TabletopIntroCardRuntime
  sceneName: string
  onClose: () => void
}

export function SceneIntroCard({
  introCard,
  sceneName,
  onClose,
}: SceneIntroCardProps) {
  return (
    <div className="scene-intro-card" role="dialog" aria-modal="true">
      <button
        aria-label="Fechar introducao da cena"
        className="scene-intro-card__backdrop"
        onClick={onClose}
        type="button"
      />
      <div className="tabletop-overlay-card tabletop-overlay-card--scene-intro">
        {introCard.imageSource ? (
          <img
            alt={introCard.title}
            className="scene-intro-card__image"
            src={resolveRuntimeAssetUrl(introCard.imageSource)}
          />
        ) : null}

        <div className="scene-intro-card__body">
          <p className="eyebrow">Entrada de cena</p>
          <h2>{introCard.title}</h2>
          <p className="scene-intro-card__scene-name">{sceneName}</p>
          <p className="support-copy">{introCard.summary}</p>
          {introCard.notes ? (
            <p className="support-copy">{introCard.notes}</p>
          ) : null}
        </div>

        <div className="scene-intro-card__actions">
          <button className="button button--primary" onClick={onClose} type="button">
            Continuar
          </button>
          <button className="button" onClick={onClose} type="button">
            Fechar intro
          </button>
        </div>
      </div>
    </div>
  )
}
