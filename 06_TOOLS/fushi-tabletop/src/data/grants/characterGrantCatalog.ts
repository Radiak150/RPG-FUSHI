import { INITIAL_TRAINING_REWARDS } from '../training/initialTrainingRewards'
import type { CharacterFeatureDetail } from '../types'

export type CharacterGrantCategory = 'habilidade' | 'ritual' | 'outro'
export type CharacterGrantStatus = 'ready' | 'construction'

export interface CharacterGrantDefinition {
  category: CharacterGrantCategory
  feature?: CharacterFeatureDetail
  id: string
  recommendedCharacterName?: string
  source: string
  status: CharacterGrantStatus
  summary: string
  title: string
}

export const CHARACTER_GRANT_CATEGORY_META: Record<
  CharacterGrantCategory,
  { label: string; statusLabel: string }
> = {
  habilidade: { label: 'Habilidades', statusLabel: 'PRONTO' },
  ritual: { label: 'Rituais', statusLabel: 'EM CONSTRUCAO' },
  outro: { label: 'Outros', statusLabel: 'EM CONSTRUCAO' },
}

export const CHARACTER_GRANT_CATALOG: CharacterGrantDefinition[] =
  INITIAL_TRAINING_REWARDS.map((reward) => ({
    category: 'habilidade',
    feature: reward.feature,
    id: reward.feature.id,
    recommendedCharacterName: reward.characterName,
    source: 'Treino Inicial - Circuito do Centro',
    status: 'ready',
    summary: reward.summary,
    title: reward.feature.nome,
  }))

export function getCharacterGrant(grantId: string) {
  return CHARACTER_GRANT_CATALOG.find((grant) => grant.id === grantId) ?? null
}
