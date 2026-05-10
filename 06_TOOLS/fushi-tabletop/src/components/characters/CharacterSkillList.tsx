import type { CharacterAttributes, CharacterSkill } from '../../data/types'
import { createAttributeRollConfig, formatAttributeLabel } from '../../lib/rolls'

interface CharacterSkillListProps {
  attributeValues: CharacterAttributes
  items: CharacterSkill[]
  onUseRoll: (payload: {
    id: string
    contextLabel: string
    config: ReturnType<typeof createAttributeRollConfig>
  }) => void
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
