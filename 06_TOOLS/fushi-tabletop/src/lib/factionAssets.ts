export const FACTION_LOGO_BY_ID: Record<string, string> = {
  'faction-a': '/assets/factions/faction-a.svg',
  'faction-b': '/assets/factions/faction-b.svg',
  'faction-c': '/assets/factions/faction-c.svg',
  'faction-d': '/assets/factions/faction-d.svg',
  'faction-e': '/assets/factions/faction-e.svg',
  'faction-f': '/assets/factions/faction-f.svg',
}

export function getFactionLogoUrl(factionId?: string) {
  return factionId ? FACTION_LOGO_BY_ID[factionId] ?? '' : ''
}
