import { Link } from 'react-router-dom'

export function PlayPage() {
  return (
    <div className="play-entry">
      <div className="play-entry__shell">
        <div className="play-entry__copy">
          <p className="eyebrow">Jogar</p>
          <h1>Escolha o proximo passo.</h1>
        </div>

        <div className="play-entry__actions">
          <Link className="play-entry__action play-entry__action--primary" to="/campanhas">
            <span className="play-entry__label">Campanhas</span>
            <span className="play-entry__hint">Entrar ou criar antes da mesa.</span>
          </Link>

          <Link className="play-entry__action" to="/personagens">
            <span className="play-entry__label">Personagens</span>
            <span className="play-entry__hint">Escolher ficha e preparar o elenco.</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
