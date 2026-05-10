import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="landing-screen">
      <div className="landing-screen__hero">
        <p className="eyebrow">FUSHI Tabletop</p>
        <h1>Entre na mesa.</h1>

        <div className="landing-screen__actions landing-screen__actions--single">
          <Link className="landing-action landing-action--primary" to="/jogar">
            <span className="landing-action__label">JOGAR</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
