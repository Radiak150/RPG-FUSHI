import type { CharacterSheet, TabletopToken } from '../data/types'
import type { FushiAccessProfile } from './playerAccess'
import { resolveRuntimeAssetUrl } from './runtimeAssets'
import type { WorldMundiState } from './worldMundiState'

interface TokenImageContext {
  characters: CharacterSheet[]
  playerProfiles?: FushiAccessProfile[]
  worldMundiState?: Pick<WorldMundiState, 'consciencias' | 'corpos'>
}

interface TokenImageFields {
  avatarUrl?: string
  character?: CharacterSheet
  source: string
  tokenImageUrl?: string
}

type TokenImageSource = Partial<
  Pick<CharacterSheet, 'avatarUrl' | 'tokenImageUrl'>
> & {
  imageUrl?: string
}

function cleanUrl(value?: string | null) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function resolveUrl(value?: string | null) {
  const cleanedValue = cleanUrl(value)

  return cleanedValue ? resolveRuntimeAssetUrl(cleanedValue) : ''
}

function collectImageFields(
  source: TokenImageSource,
  sourceName: string,
  character?: CharacterSheet,
): TokenImageFields | null {
  const tokenImageUrl = resolveUrl(source.tokenImageUrl)
  const avatarUrl = resolveUrl(source.avatarUrl ?? source.imageUrl)

  if (!tokenImageUrl && !avatarUrl) {
    return null
  }

  return {
    avatarUrl: avatarUrl || undefined,
    character,
    source: sourceName,
    tokenImageUrl: tokenImageUrl || undefined,
  }
}

function pushCandidate(candidates: string[], value?: string) {
  const candidate = cleanUrl(value)

  if (candidate && !candidates.includes(candidate)) {
    candidates.push(candidate)
  }
}

function findCharacterById(characters: CharacterSheet[], characterId?: string) {
  const normalizedCharacterId = cleanUrl(characterId)

  return normalizedCharacterId
    ? characters.find((character) => character.id === normalizedCharacterId) ?? null
    : null
}

export function resolveTokenImage(
  token: TabletopToken,
  context: TokenImageContext,
): TokenImageFields | null {
  const candidates: string[] = []
  const bodies = context.worldMundiState?.corpos ?? {}
  const consciousnesses = context.worldMundiState?.consciencias ?? {}

  pushCandidate(candidates, token.characterId)
  pushCandidate(candidates, token.npcId)

  const tokenBody =
    (token.bodyId ? bodies[token.bodyId] : null) ??
    (token.persistentControl?.bodyId ? bodies[token.persistentControl.bodyId] : null)

  pushCandidate(candidates, tokenBody?.npcOriginalId)

  const controllingPlayerId =
    token.controladoPorJogadorId ?? token.persistentControl?.playerId ?? ''

  if (controllingPlayerId) {
    const controllingConsciousness = Object.values(consciousnesses).find(
      (consciousness) => consciousness.jogadorId === controllingPlayerId,
    )
    const currentBody = controllingConsciousness?.corpoAtualId
      ? bodies[controllingConsciousness.corpoAtualId]
      : null
    const playerProfile = context.playerProfiles?.find(
      (profile) => profile.id === controllingPlayerId,
    )

    pushCandidate(candidates, currentBody?.npcOriginalId)
    pushCandidate(candidates, playerProfile?.characterId)
  }

  for (const candidate of candidates) {
    const character = findCharacterById(context.characters, candidate)
    const imageFields = character
      ? collectImageFields(character, `character:${candidate}`, character)
      : null

    if (imageFields) {
      return imageFields
    }
  }

  return collectImageFields(token, 'token')
}
