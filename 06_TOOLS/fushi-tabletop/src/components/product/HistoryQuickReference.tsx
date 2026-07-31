import { Link } from 'react-router-dom'
import {
  getHistoryBookForAudience,
  type RulebookAudience,
} from '../../data/history'
import { RulebookRichText } from './RulebookContent'

export function HistoryQuickReference({
  audience,
  onSelectSection,
  showFullBookLink = true,
}: {
  audience: RulebookAudience
  onSelectSection?: (sectionId: string) => void
  showFullBookLink?: boolean
}) {
  const volume = getHistoryBookForAudience(audience)

  return (
    <div className={'history-quick history-quick--' + audience}>
      <div className="history-quick__header">
        <div>
          <p className="eyebrow">
            {audience === 'master' ? 'Continuidade confidencial' : 'Crônica da mesa'}
          </p>
          <h3>{audience === 'master' ? 'História do Mestre' : 'Nossa jornada'}</h3>
        </div>
        <span>{volume.edition}</span>
      </div>

      <div className="history-quick__grid">
        {volume.quickReference.map((entry) => {
          const content = (
            <>
              <strong>{entry.label}</strong>
              <span>
                <RulebookRichText text={entry.detail} />
              </span>
            </>
          )

          return onSelectSection ? (
            <button
              className="history-quick__entry"
              key={entry.sectionId + '-' + entry.label}
              onClick={() => onSelectSection(entry.sectionId)}
              type="button"
            >
              {content}
            </button>
          ) : (
            <Link
              className="history-quick__entry"
              key={entry.sectionId + '-' + entry.label}
              to={`/historia?audience=${audience}&section=${entry.sectionId}`}
            >
              {content}
            </Link>
          )
        })}
      </div>

      {showFullBookLink ? (
        <Link
          className="history-quick__open"
          to={`/historia?audience=${audience}`}
        >
          Abrir Livro da História
        </Link>
      ) : null}
    </div>
  )
}
