import type { Biome, PointOfInterest, WorldRegion } from '../../data/types'
import { StatusPill } from '../ui/StatusPill'

interface PointDetailsProps {
  point: PointOfInterest
  biome?: Biome
  region?: WorldRegion
}

export function PointDetails({ point, biome, region }: PointDetailsProps) {
  return (
    <div className="point-details">
      <div className="point-details__top">
        <div>
          <p className="eyebrow">Ponto selecionado</p>
          <h3>{point.nome}</h3>
        </div>
        <StatusPill label={point.status} tone={point.tone} />
      </div>

      <p className="point-details__summary">{point.resumo}</p>

      <dl className="detail-grid">
        <div>
          <dt>Regiao</dt>
          <dd>{region?.nome ?? 'Nao definida'}</dd>
        </div>
        <div>
          <dt>Bioma</dt>
          <dd>{biome?.nome ?? 'Nao definido'}</dd>
        </div>
      </dl>

      <div className="stack-list">
        {point.detalhes.map((line) => (
          <p key={line} className="support-copy">
            {line}
          </p>
        ))}
      </div>

      <div className="tag-row">
        {point.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
