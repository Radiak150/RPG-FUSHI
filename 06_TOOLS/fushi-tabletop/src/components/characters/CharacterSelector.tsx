import type { CharacterSheet } from '../../data/types'
import { StatusPill } from '../ui/StatusPill'

interface CharacterSelectorProps {
  characters: CharacterSheet[]
  activeCharacterId: string
  onSelect: (characterId: string) => void
}

export function CharacterSelector({
  characters,
  activeCharacterId,
  onSelect,
}: CharacterSelectorProps) {
  return (
    <div className="selector-list">
      {characters.map((character) => (
        <button
          key={character.id}
          className={`selector-card${
            character.id === activeCharacterId ? ' selector-card--active' : ''
          }`}
          onClick={() => onSelect(character.id)}
          type="button"
        >
          <div className="selector-card__top">
            <div>
              <p className="eyebrow">
                {character.tipo === 'player' ? 'Jogador' : character.tipo === 'mob' ? 'Mob' : 'NPC'}
              </p>
              <h3>{character.nome}</h3>
            </div>
            <StatusPill label={character.status[0] ?? 'Sem status'} tone={character.tone} />
          </div>

          <p className="support-copy">{character.localAtual}</p>
        </button>
      ))}
    </div>
  )
}
