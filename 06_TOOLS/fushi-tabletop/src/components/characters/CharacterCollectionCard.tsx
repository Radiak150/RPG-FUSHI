import type { CharacterSheet } from '../../data/types'
import { getCharacterSheetModel } from '../../lib/characterSheet'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'

interface CharacterCollectionCardProps {
  character: CharacterSheet
  isActive: boolean
  onSelect: () => void
  onOpenEditor?: () => void
}

function buildInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function CharacterCollectionCard({
  character,
  isActive,
  onSelect,
  onOpenEditor,
}: CharacterCollectionCardProps) {
  const model = getCharacterSheetModel(character)

  return (
    <button
      className={`collection-card${isActive ? ' collection-card--active' : ''}`}
      onDoubleClick={onOpenEditor}
      onClick={onSelect}
      type="button"
    >
      <div className="collection-card__media">
        {model.avatarUrl ? (
          <img
            alt={model.nome}
            className="collection-card__image"
            src={resolveRuntimeAssetUrl(model.avatarUrl)}
          />
        ) : (
          <div className="collection-card__placeholder" data-tone={model.tone}>
            {buildInitials(model.nome)}
          </div>
        )}
      </div>

      <div className="collection-card__body">
        <p className="eyebrow">
          {model.tipo === 'player' ? 'Jogador' : model.tipo === 'mob' ? 'Mob' : 'NPC'}
        </p>
        <h3>{model.nome}</h3>
        <p className="support-copy">
          {model.classe} | {model.origem}
        </p>
      </div>
    </button>
  )
}
