import type { CharacterAttributes, CharacterSkill } from '../../data/types'
import { createAttributeRollConfig, formatAttributeLabel } from '../../lib/rolls'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'

interface CharacterSkillListProps {
  attributeValues: CharacterAttributes
  items: CharacterSkill[]
  onUseRoll: (payload: {
    id: string
    contextLabel: string
    config: ReturnType<typeof createAttributeRollConfig>
  }) => void
}

const SKILL_ICON_ASSETS: Record<string, string> = {
  acrobacia: '/assets/ui/icons/skill-acrobatics.svg',
  adestramento: '/assets/ui/icons/skill-animal.svg',
}

function getSkillIconAsset(skillName: string) {
  const normalizedName = skillName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  return SKILL_ICON_ASSETS[normalizedName] ?? '/assets/ui/icons/skill-default.svg'
}

export function CharacterSkillList({
  attributeValues,
  items,
  onUseRoll,
}: CharacterSkillListProps) {
  return (
    <div className="action-list">
      {items.map((item) => {
        const quantidadeDados = attributeValues[item.atributoBase] ?? 1
        const formula = `maior de ${quantidadeDados}d20 + ${item.bonusPericia}`

        return (
          <article key={item.id} className="action-card action-card--compact">
            <div className="action-card__compact-top">
              <img
                alt=""
                className="action-card__skill-icon"
                src={resolveRuntimeAssetUrl(getSkillIconAsset(item.nome))}
              />
              <details className="action-card__details">
                <summary className="action-card__summary">
                  <div>
                    <h3>{item.nome}</h3>
                    <p className="support-copy">
                      {formatAttributeLabel(item.atributoBase)} · +{item.bonusPericia}
                    </p>
                  </div>
                </summary>

                <div className="action-card__body">
                  <p className="support-copy">{item.resumo}</p>
                  <div className="tag-row">
                    <span className="tag">{formatAttributeLabel(item.atributoBase)}</span>
                    <span className="tag">{formula}</span>
                  </div>
                </div>
              </details>
              <button
                className="button"
                onClick={() =>
                  onUseRoll({
                    id: item.id,
                    contextLabel: item.nome,
                    config: createAttributeRollConfig(
                      quantidadeDados,
                      item.bonusPericia,
                    ),
                  })
                }
                type="button"
              >
                Usar
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
