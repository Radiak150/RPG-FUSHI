import type { DashboardMetric } from '../../data/types'
import { StatusPill } from './StatusPill'

interface MetricCardProps {
  metric: DashboardMetric
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-card__top">
        <span className="metric-card__label">{metric.label}</span>
        <StatusPill label={metric.toneLabel} tone={metric.tone} />
      </div>

      <strong className="metric-card__value">{metric.value}</strong>
      <p className="metric-card__note">{metric.note}</p>
    </article>
  )
}
