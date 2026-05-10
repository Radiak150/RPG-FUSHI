import { Link, NavLink } from 'react-router-dom'
import { useViewMode } from '../../hooks/useViewMode'
import { navigationItems } from '../../lib/navigation'
import { ViewModeControls } from './ViewModeControls'

export function SidebarNav() {
  const { viewMode } = useViewMode()

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Link className="sidebar__brand-link" to="/">
          <p className="eyebrow">FUSHI Tabletop</p>
          <h2>Fluxo principal</h2>
        </Link>
      </div>

      <nav className="sidebar__nav" aria-label="Navegacao principal">
        {navigationItems
          .filter((item) => item.allowedViews.includes(viewMode))
          .map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link--active' : ''}`
            }
            to={item.to}
          >
            <span className="nav-link__title">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <ViewModeControls showPlayerCharacterSelect={false} />
        {viewMode === 'gm' ? (
          <Link className="sidebar__footer-link" to="/configuracoes">
            Configuracoes
          </Link>
        ) : null}
      </div>
    </aside>
  )
}
