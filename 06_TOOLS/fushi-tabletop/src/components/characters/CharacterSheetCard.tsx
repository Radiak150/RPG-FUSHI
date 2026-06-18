import type { CharacterSheet, RollConfig } from '../../data/types'
import { useViewMode } from '../../hooks/useViewMode'
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssets'
import { ResourceMeter } from '../ui/ResourceMeter'
import { StatusPill } from '../ui/StatusPill'
import { CharacterAttackList } from './CharacterAttackList'
import { CharacterSkillList } from './CharacterSkillList'

interface CharacterSheetCardProps {
  character: CharacterSheet
  factionName: string
  onUseRoll: (payload: {
    id: string
    contextLabel: string
    config: RollConfig
  }) => void
}

const attributeLabels = [
  ['forca', 'Forca'],
  ['agilidade', 'Agilidade'],
  ['intelecto', 'Intelecto'],
  ['presenca', 'Presenca'],
  ['vigor', 'Vigor'],
] as const

export function CharacterSheetCard({
  character,
  factionName,
  onUseRoll,
}: CharacterSheetCardProps) {
  const { viewMode } = useViewMode()
  const isMobSheet = character.tipo === 'mob'

  return (
    <article className="sheet-card">
      <div className="sheet-card__hero">
        <div>
          <p className="eyebrow">Ficha ativa</p>
          <h2>{character.nome}</h2>
          <p className="support-copy">
            {character.tipo} | {factionName} | {character.localAtual}
          </p>
        </div>

        <StatusPill
          label={character.status[0] ?? 'Sem status'}
          tone={character.tone}
        />
      </div>

      <div className="summary-strip">
        <article className="summary-card">
          <span className="summary-card__label">Defesa</span>
          <strong className="summary-card__value">{character.defesa}</strong>
          <p className="support-copy">Valor fixo contra ataques.</p>
        </article>
        <article className="summary-card">
          <span className="summary-card__label">Rolagem base</span>
          <strong className="summary-card__value">
            {character.rolagemBase.quantidadeDados}d20
          </strong>
          <p className="support-copy">Usa o maior resultado + bonus.</p>
        </article>
        <article className="summary-card">
          <span className="summary-card__label">Determinacao</span>
          <strong className="summary-card__value">
            {character.recursos.determinacaoAtual}/
            {character.recursos.determinacaoMaxima}
          </strong>
          <p className="support-copy">
            Em zero, o personagem perde o controle.
          </p>
        </article>
      </div>

      <div className="tag-row">
        {character.status.map((status) => (
          <span key={status} className="tag">
            {status}
          </span>
        ))}
      </div>

      <div className="sheet-grid">
        <section className="sheet-section">
          <div className="section-header">
            <p className="eyebrow sheet-section__sigil-heading">
              <img alt="" src={resolveRuntimeAssetUrl('/assets/ui/fushi-sigil.svg')} />
              <span>Atributos</span>
            </p>
            <span className="support-copy">MVP oficial</span>
          </div>

          <div className="attribute-grid">
            {attributeLabels.map(([key, label]) => (
              <article key={key} className="attribute-card">
                <span className="attribute-card__label">{label}</span>
                <strong className="attribute-card__value">
                  {character.atributos[key]}
                </strong>
              </article>
            ))}
          </div>
        </section>

        <section className="sheet-section">
          <div className="section-header">
            <p className="eyebrow">Recursos</p>
            <span className="support-copy">Leitura local</span>
          </div>

          <div className="resource-grid">
            <ResourceMeter
              atual={character.recursos.vidaAtual}
              label="Vida"
              maximo={character.recursos.vidaMaxima}
            />
            <ResourceMeter
              atual={character.recursos.fushiAtual}
              label="FUSHI"
              maximo={character.recursos.fushiMaximo}
            />
            <ResourceMeter
              atual={character.recursos.determinacaoAtual}
              label="Determinacao"
              maximo={character.recursos.determinacaoMaxima}
            />
          </div>
        </section>
      </div>

      <div className="sheet-grid">
        <section className="sheet-section">
          {isMobSheet ? (
            <>
              <div className="section-header">
                <p className="eyebrow">Mob</p>
                <span className="support-copy">Ficha compacta</span>
              </div>
              <div className="tag-row">
                <span className="tag">{character.faccao || factionName}</span>
                <span className="tag">{character.deslocamento}</span>
                <span className="tag">{character.status[0] ?? 'ativo'}</span>
              </div>
              <p className="support-copy">
                {character.notas || 'Criatura simples baseada em atributos, recursos e ataques.'}
              </p>
            </>
          ) : (
            <>
              <div className="section-header">
                <p className="eyebrow">Pericias</p>
                <span className="support-copy">Atributo define dados</span>
              </div>

              <CharacterSkillList
                attributeValues={character.atributos}
                items={character.pericias}
                onUseRoll={onUseRoll}
              />
            </>
          )}
        </section>

        <section className="sheet-section">
          <div className="section-header">
            <p className="eyebrow">Ataques</p>
            <span className="support-copy">Teste + dano</span>
          </div>

          <CharacterAttackList
            attributeValues={character.atributos}
            items={character.ataques}
            onUseRoll={onUseRoll}
          />
        </section>
      </div>

      <div className="sheet-grid">
        <section className="sheet-section">
          <div className="section-header">
            <p className="eyebrow">Habilidades</p>
          </div>

          <div className="tag-row">
            {character.habilidades.map((skill) => (
              <span key={skill} className="tag">
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section className="sheet-section">
          <div className="section-header">
            <p className="eyebrow">Recuperacao e pressao</p>
            <span className="support-copy">Leitura consolidada</span>
          </div>

          <ul className="bullet-list">
            <li>Determinacao pode cair por uso, pressao mental ou pressao narrativa.</li>
            <li>FUSHI pode voltar por descanso, item, tecnica, absorcao ambiental e momentos significativos.</li>
            <li>Defesa e fixa e separada da rolagem base.</li>
          </ul>
        </section>

        {viewMode === 'gm' ? (
          <section className="sheet-section">
            <div className="section-header">
              <p className="eyebrow">Notas</p>
              <span className="support-copy">GM View</span>
            </div>

            <p className="support-copy">{character.notas}</p>
          </section>
        ) : null}
      </div>
    </article>
  )
}
