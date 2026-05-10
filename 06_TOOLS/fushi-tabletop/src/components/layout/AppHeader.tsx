interface AppHeaderProps {
  title: string
  description: string
  eyebrow: string
  currentSession?: string
  campaignStatus?: string
  sourceLabel?: string
  viewLabel?: string
}

export function AppHeader({
  title,
  description,
  eyebrow,
  currentSession,
  campaignStatus,
  sourceLabel,
  viewLabel,
}: AppHeaderProps) {
  const chips = [sourceLabel, viewLabel, currentSession, campaignStatus].filter(Boolean)

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <p className="app-header__description">{description}</p> : null}
      </div>

      {chips.length > 0 ? (
        <div className="app-header__chips">
          {sourceLabel ? <span className="chip chip--accent">{sourceLabel}</span> : null}
          {viewLabel ? <span className="chip">{viewLabel}</span> : null}
          {currentSession ? <span className="chip">{currentSession}</span> : null}
          {campaignStatus ? <span className="chip">{campaignStatus}</span> : null}
        </div>
      ) : null}
    </header>
  )
}
