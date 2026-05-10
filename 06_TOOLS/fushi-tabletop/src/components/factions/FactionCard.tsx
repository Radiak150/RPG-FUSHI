import type { CharacterSheet, FactionItem } from '../../data/types'
import { StatusPill } from '../ui/StatusPill'

interface FactionCardProps {
  faction: FactionItem
  members: CharacterSheet[]
}

export function FactionCard({ faction, members }: FactionCardProps) {
  return (
    <article className="faction-card">
      <div className="faction-card__top">
        <div>
          <p className="eyebrow">Facao</p>
          <h3>{faction.nome}</h3>
        </div>
        <StatusPill label={faction.status} tone={faction.tone} />
      </div>

      <dl className="detail-grid">
        <div>
          <dt>Base</dt>
          <dd>{faction.base}</dd>
        </div>
        <div>
          <dt>Local atual</dt>
          <dd>{faction.localAtual}</dd>
        </div>
        <div>
          <dt>Resumo</dt>
          <dd>{faction.resumo}</dd>
        </div>
        <div>
          <dt>Membros</dt>
          <dd>{members.length}</dd>
        </div>
      </dl>

      <div className="tag-row">
        {members.map((member) => (
          <span key={member.id} className="tag">
            {member.nome}
          </span>
        ))}
      </div>

      <p className="support-copy">{faction.notas}</p>
    </article>
  )
}
