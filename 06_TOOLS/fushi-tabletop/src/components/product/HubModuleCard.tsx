import { Link } from 'react-router-dom'
import { useProductPreferences } from '../../hooks/useProductPreferences'

interface HubModuleCardProps {
  to: string
  title: string
  description: string
  badge?: string
  featured?: boolean
}

export function HubModuleCard({
  to,
  title,
  description,
  badge,
  featured,
}: HubModuleCardProps) {
  const { showModuleDescriptions } = useProductPreferences()

  return (
    <Link
      className={`module-card${featured ? ' module-card--featured' : ''}`}
      to={to}
    >
      <div className="module-card__top">
        <div>
          <p className="eyebrow">{featured ? 'Prioridade' : 'Modulo'}</p>
          <h3>{title}</h3>
        </div>
        {badge ? <span className="chip chip--accent">{badge}</span> : null}
      </div>
      {showModuleDescriptions ? (
        <p className="support-copy">{description}</p>
      ) : null}
      <span className="module-card__action">
        Abrir modulo
      </span>
    </Link>
  )
}
