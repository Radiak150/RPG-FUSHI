import type { TabletopCinematicAsset } from '../../data/types'

interface TabletopCinematicsLibraryProps {
  activeCinematicId: string
  cinematics: TabletopCinematicAsset[]
  targetSceneName: string
  onActivate: (cinematicId: string) => void
  onTrigger: (cinematicId: string) => void
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

function buildPlaceholderLabel(category: TabletopCinematicAsset['category']) {
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

export function TabletopCinematicsLibrary({
  activeCinematicId,
  cinematics,
  targetSceneName,
  onActivate,
  onTrigger,
}: TabletopCinematicsLibraryProps) {
  return (
    <section className="tabletop-library">
      <div className="tabletop-library__hero">
        <div>
          <p className="eyebrow">Biblioteca de cinematics</p>
          <h3>Entradas prontas para acionar</h3>
          <p className="support-copy">
            Cada item funciona como overlay visual simples. Ele pode ser salvo na cena
            preparada ou disparado manualmente sem alterar o runtime.
          </p>
        </div>
        <div className="tag-row">
          <span className="tag">{cinematics.length} entradas</span>
          <span className="tag">Cena preparada: {targetSceneName}</span>
          <span className="tag">Overlay visual controlado</span>
        </div>
      </div>

      <div className="tabletop-library__grid tabletop-library__grid--cinematics">
        {cinematics.map((cinematic) => {
          const isActive = cinematic.id === activeCinematicId

          return (
            <article
              className={`tabletop-library-card tabletop-library-card--cinematic${
                isActive ? ' tabletop-library-card--active' : ''
              }`}
              key={cinematic.id}
            >
              <div className="tabletop-library-card__media tabletop-library-card__media--wide">
                {cinematic.previewImage ? (
                  <img
                    alt={cinematic.name}
                    className="tabletop-library-card__image"
                    src={cinematic.previewImage}
                  />
                ) : (
                  <div className="tabletop-library-card__placeholder">
                    {buildPlaceholderLabel(cinematic.category)}
                  </div>
                )}
              </div>

              <div className="tabletop-library-card__body">
                <div className="tabletop-library-card__top">
                  <div>
                    <p className="eyebrow">{getCategoryLabel(cinematic.category)}</p>
                    <h3>{cinematic.name}</h3>
                  </div>
                  <div className="tag-row">
                    <span className="tag">{getCategoryLabel(cinematic.category)}</span>
                    {isActive ? <span className="tag">ativo</span> : null}
                  </div>
                </div>

                <p className="support-copy">{cinematic.summary}</p>

                <div className="tag-row">
                  <span className="tag">visual</span>
                  <span className="tag">placeholder</span>
                </div>
              </div>

              <div className="tabletop-library-card__actions">
                <button
                  className={`button${isActive ? ' button--primary' : ''}`}
                  onClick={() => onActivate(cinematic.id)}
                  type="button"
                >
                  {isActive ? 'Mantido na cena' : 'Ativar na cena'}
                </button>
                <button
                  className="button"
                  onClick={() => onTrigger(cinematic.id)}
                  type="button"
                >
                  Disparar overlay
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
