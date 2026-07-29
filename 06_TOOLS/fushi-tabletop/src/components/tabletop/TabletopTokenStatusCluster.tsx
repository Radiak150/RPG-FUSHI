import type { CSSProperties } from 'react'
import {
  findTabletopStatusDefinition,
  type TabletopStatusKind,
} from '../../data/statusCatalog'
import type { TabletopCombatMark } from '../../lib/tabletopSession'
import { TabletopStatusIcon } from './TabletopStatusIcon'

interface TabletopTokenStatusClusterProps {
  detailSide: 'left' | 'right'
  isExpanded: boolean
  marks: TabletopCombatMark[]
  sourceNameByTokenId: ReadonlyMap<string, string>
  tokenName: string
}

function getStatusKindLabel(kind: TabletopStatusKind | 'mark') {
  if (kind === 'buff') {
    return 'Buff'
  }

  if (kind === 'condition') {
    return 'Condicao'
  }

  if (kind === 'debuff') {
    return 'Debuff'
  }

  return 'Efeito'
}

export function TabletopTokenStatusCluster({
  detailSide,
  isExpanded,
  marks,
  sourceNameByTokenId,
  tokenName,
}: TabletopTokenStatusClusterProps) {
  if (marks.length === 0) {
    return null
  }

  const statusViews = marks.map((mark) => {
    const definition = findTabletopStatusDefinition(mark.statusId ?? mark.label)
    const isScienceMark =
      mark.icon === 'science' || mark.label === 'Analise Cirurgica'

    return {
      cause: definition?.cause,
      color: mark.color || definition?.color || '#e9c97e',
      durationRounds: mark.durationRounds,
      effect:
        mark.description?.trim() ||
        definition?.effect ||
        `${mark.label} esta ativo neste alvo.`,
      icon: mark.icon ?? definition?.icon ?? (isScienceMark ? 'science' : 'custom'),
      id: mark.id,
      kind: mark.kind ?? definition?.kind ?? 'mark',
      label: definition?.label ?? mark.label,
      recovery: definition?.recovery,
      sourceName:
        sourceNameByTokenId.get(mark.sourceTokenId) ??
        (mark.sourceTokenId ? 'Origem oculta' : 'Mestre'),
      stacks: Math.max(1, mark.stacks ?? 1),
      statusId: mark.statusId ?? definition?.id ?? 'custom',
    }
  })

  return (
    <span
      aria-label={`${tokenName}: ${statusViews.length} efeito(s) ativo(s)`}
      className={`tabletop-token__status-cluster tabletop-token__status-cluster--detail-${detailSide}${
        isExpanded ? ' tabletop-token__status-cluster--expanded' : ''
      }`}
      data-status-count={statusViews.length}
      data-testid="token-status-cluster"
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span
        aria-hidden="true"
        className="tabletop-token__status-strip"
        data-testid="token-status-strip"
      >
        {statusViews.map((status) => (
          <span
            className="tabletop-token__status-glyph"
            data-status-id={status.statusId}
            key={`strip:${status.id}`}
            style={{ '--status-color': status.color } as CSSProperties}
          >
            <TabletopStatusIcon icon={status.icon} size={19} />
            <span className="tabletop-token__status-stack">x{status.stacks}</span>
          </span>
        ))}
      </span>

      <span
        aria-label={`Efeitos ativos de ${tokenName}`}
        className="tabletop-token__status-popover"
        data-testid="token-status-popover"
        role="tooltip"
      >
        <span className="tabletop-token__status-popover-icons">
          {statusViews.map((status) => (
            <span
              className="tabletop-token__status-popover-item"
              data-status-id={status.statusId}
              key={`popover:${status.id}`}
              style={{ '--status-color': status.color } as CSSProperties}
            >
              <span className="tabletop-token__status-popover-glyph">
                <TabletopStatusIcon
                  icon={status.icon}
                  label={status.label}
                  size={30}
                />
                <span className="tabletop-token__status-popover-stack">
                  x{status.stacks}
                </span>
              </span>

              <span
                className="tabletop-token__status-detail"
                data-testid="token-status-detail"
              >
                <span className="tabletop-token__status-detail-heading">
                  <span>{getStatusKindLabel(status.kind)}</span>
                  <strong>{status.label}</strong>
                </span>
                <span className="tabletop-token__status-detail-copy">
                  {status.effect}
                </span>
                <span className="tabletop-token__status-detail-meta">
                  <span>
                    <b>Origem</b>
                    {status.sourceName}
                  </span>
                  <span>
                    <b>Acumulos</b>
                    {status.stacks}
                  </span>
                  {status.durationRounds ? (
                    <span>
                      <b>Duracao</b>
                      {status.durationRounds} rodada(s)
                    </span>
                  ) : null}
                </span>
                {status.cause ? (
                  <span className="tabletop-token__status-detail-rule">
                    <b>Causa</b>
                    {status.cause}
                  </span>
                ) : null}
                {status.recovery ? (
                  <span className="tabletop-token__status-detail-rule">
                    <b>Como encerrar</b>
                    {status.recovery}
                  </span>
                ) : null}
              </span>
            </span>
          ))}
        </span>
      </span>
    </span>
  )
}
