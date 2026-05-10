interface DataStateProps {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function DataState({
  title,
  message,
  actionLabel,
  onAction,
}: DataStateProps) {
  return (
    <section className="panel panel--state">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Estado do painel</p>
          <h2 className="panel__title">{title}</h2>
        </div>
      </div>

      <p className="panel__subtitle">{message}</p>

      {actionLabel && onAction ? (
        <button className="button" onClick={onAction} type="button">
          {actionLabel}
        </button>
      ) : null}
    </section>
  )
}
