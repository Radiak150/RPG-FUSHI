import type { TabletopReadinessItem, TabletopReadinessWarning } from '../../hooks/useTabletopReadiness'

interface TabletopReadinessGateProps {
  canContinue: boolean
  completed: number
  items: TabletopReadinessItem[]
  onContinue: () => void
  onRetry: () => void
  phase: string
  progress: number
  roleLabel: string
  sceneName: string
  total: number
  warnings: TabletopReadinessWarning[]
}

function getStatusLabel(status: TabletopReadinessItem['status']) {
  if (status === 'ready') {
    return 'OK'
  }

  if (status === 'failed') {
    return 'Alerta'
  }

  if (status === 'loading') {
    return 'Carregando'
  }

  return 'Pendente'
}

export function TabletopReadinessGate({
  canContinue,
  completed,
  items,
  onContinue,
  onRetry,
  phase,
  progress,
  roleLabel,
  sceneName,
  total,
  warnings,
}: TabletopReadinessGateProps) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)))
  const readyCount = items.filter((item) => item.status === 'ready').length
  const failedCount = items.filter((item) => item.status === 'failed').length

  return (
    <div className="tabletop-readiness">
      <section className="tabletop-readiness__panel">
        <div className="tabletop-readiness__header">
          <p className="eyebrow">{roleLabel}</p>
          <h1>Carregando mesa</h1>
          <p className="support-copy">
            {sceneName || 'Cena atual'} esta sendo preparada antes de liberar a tela.
          </p>
        </div>

        <div className="tabletop-readiness__meter" aria-label="Progresso da mesa">
          <div
            className="tabletop-readiness__bar"
            style={{ width: `${safeProgress}%` }}
          />
        </div>

        <div className="tabletop-readiness__status">
          <strong>{safeProgress}%</strong>
          <span>{phase}</span>
        </div>

        <div className="tabletop-readiness__chips" aria-label="Resumo do carregamento">
          <span className="tag">{completed}/{total} verificados</span>
          <span className="tag">{readyCount} prontos</span>
          {failedCount > 0 ? <span className="tag tag--danger">{failedCount} alerta(s)</span> : null}
        </div>

        {warnings.length > 0 ? (
          <div className="tabletop-readiness__warning">
            <strong>Alerta de asset</strong>
            <span>
              {warnings[0].required
                ? 'Um asset critico nao respondeu. A mesa pode abrir sem imagem/midia esperada.'
                : 'Um asset opcional nao respondeu, mas a mesa pode continuar.'}
            </span>
          </div>
        ) : null}

        <details className="tabletop-readiness__details">
          <summary>Mais detalhes</summary>
          <div className="tabletop-readiness__items">
            {items.map((item) => (
              <div
                className={`tabletop-readiness__item tabletop-readiness__item--${item.status}`}
                key={item.id}
              >
                <span>{getStatusLabel(item.status)}</span>
                <strong>{item.label}</strong>
                <small>{item.kind}</small>
              </div>
            ))}
          </div>
        </details>

        <div className="tabletop-readiness__actions">
          <button className="button" onClick={onRetry} type="button">
            Recarregar preparo
          </button>
          {canContinue ? (
            <button className="button button--primary" onClick={onContinue} type="button">
              Entrar mesmo assim
            </button>
          ) : null}
        </div>
      </section>
    </div>
  )
}
