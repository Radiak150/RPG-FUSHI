import type { CharacterAttack, CharacterAttributes } from '../../data/types'
import { createAttributeRollConfig, formatAttributeLabel } from '../../lib/rolls'

interface CharacterAttackListProps {
  attributeValues: CharacterAttributes
  items: CharacterAttack[]
  onUseRoll: (payload: {
    id: string
    contextLabel: string
    config: ReturnType<typeof createAttributeRollConfig>
  }) => void
}

export function CharacterAttackList({
  attributeValues,
  items,
  onUseRoll,
}: CharacterAttackListProps) {
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
                      {formatAttributeLabel(item.atributoBase)} · {item.dano}
                    </p>
                  </div>
                </summary>

                <div className="action-card__body">
                  <p className="support-copy">{item.resumo}</p>
                  <div className="tag-row">
                    <span className="tag">{formatAttributeLabel(item.atributoBase)}</span>
                    <span className="tag">{formula}</span>
                    <span className="tag">{item.dano}</span>
                    <span className="tag">{item.alcance}</span>
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
                Atacar
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
