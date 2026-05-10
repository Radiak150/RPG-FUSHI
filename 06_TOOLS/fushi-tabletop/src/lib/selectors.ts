import type {
  CharacterSheet,
  FactionItem,
  MasterPanelData,
  PointOfInterest,
} from '../data/types'

export function getCharactersByIds(
  data: MasterPanelData,
  characterIds: string[],
): CharacterSheet[] {
  return characterIds
    .map((characterId) =>
      data.characters.items.find((character) => character.id === characterId),
    )
    .filter((character): character is CharacterSheet => Boolean(character))
}

export function getCharacterById(
  data: MasterPanelData,
  characterId: string,
): CharacterSheet | null {
  return (
    data.characters.items.find((character) => character.id === characterId) ?? null
  )
}

export function getPlayerCharacters(data: MasterPanelData): CharacterSheet[] {
  return data.characters.items.filter(
    (character) => character.tipo === 'player' && character.isSharedBodyHost !== true,
  )
}

export function getFocusedPlayerCharacter(
  data: MasterPanelData,
  playerCharacterId: string,
): CharacterSheet | null {
  const playerCharacters = getPlayerCharacters(data)

  return (
    playerCharacters.find((character) => character.id === playerCharacterId) ??
    playerCharacters[0] ??
    null
  )
}

export function getFactionsByIds(
  data: MasterPanelData,
  factionIds: string[],
): FactionItem[] {
  return factionIds
    .map((factionId) =>
      data.factions.items.find((faction) => faction.id === factionId),
    )
    .filter((faction): faction is FactionItem => Boolean(faction))
}

export function getPointsByIds(
  data: MasterPanelData,
  pointIds: string[],
): PointOfInterest[] {
  return pointIds
    .map((pointId) => data.world.pontos.find((point) => point.id === pointId))
    .filter((point): point is PointOfInterest => Boolean(point))
}
