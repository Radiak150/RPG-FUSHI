import type { LocalCampaign } from '../../data/types'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'

interface CampaignCollectionCardProps {
  campaign: LocalCampaign
  isActive: boolean
  actionLabel: string
  onOpen: () => void
  onEnter: () => void
}

function buildInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function CampaignCollectionCard({
  campaign,
  isActive,
  actionLabel,
  onOpen,
  onEnter,
}: CampaignCollectionCardProps) {
  return (
    <article className={`collection-card${isActive ? ' collection-card--active' : ''}`}>
      <button className="collection-card__media-button" onClick={onOpen} type="button">
        <div className="collection-card__media collection-card__media--wide">
          {campaign.coverImageUrl ? (
            <img
              alt={campaign.nome}
              className="collection-card__image"
              src={resolveRuntimeAssetUrl(campaign.coverImageUrl)}
            />
          ) : (
            <div className="collection-card__placeholder collection-card__placeholder--cover">
              {buildInitials(campaign.nome)}
            </div>
          )}
        </div>
      </button>

      <div className="collection-card__body">
        <p className="eyebrow">Campanha</p>
        <h3>{campaign.nome}</h3>
        <p className="support-copy">{campaign.sessaoAtual}</p>
      </div>

      <div className="collection-card__actions">
        <button className="button" onClick={onOpen} type="button">
          Abrir
        </button>
        <button className="button button--primary" onClick={onEnter} type="button">
          {actionLabel}
        </button>
      </div>
    </article>
  )
}
