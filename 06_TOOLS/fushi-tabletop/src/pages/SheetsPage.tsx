import { useState } from 'react'
import { CharacterSelector } from '../components/characters/CharacterSelector'
import { CharacterSheetCard } from '../components/characters/CharacterSheetCard'
import { DiceRollerPanel } from '../components/rolls/DiceRollerPanel'
import { Panel } from '../components/ui/Panel'
import { useMasterData } from '../hooks/useMasterData'
import { useViewMode } from '../hooks/useViewMode'
import {
  createAttributeRollConfig,
  formatAttributeLabel,
  formatRollFormula,
} from '../lib/rolls'
import { getFocusedPlayerCharacter } from '../lib/selectors'

export function SheetsPage() {
  const { data } = useMasterData()
  const { viewMode, playerCharacterId } = useViewMode()
  const [selectedCharacterId, setSelectedCharacterId] = useState('')
  const [selectedRollSourceId, setSelectedRollSourceId] = useState('')

  if (!data) {
    return null
  }

  const gmCharacterId =
    selectedCharacterId ||
    data.campaign.destaquePersonagensIds[0] ||
    data.characters.items[0]?.id ||
    ''

  const selectedCharacter =
    viewMode === 'player'
      ? getFocusedPlayerCharacter(data, playerCharacterId)
      : data.characters.items.find((character) => character.id === gmCharacterId) ??
        data.characters.items[0]

  if (!selectedCharacter) {
    return null
  }

  const selectedFaction = data.factions.items.find(
    (faction) => faction.id === selectedCharacter.faccao,
  )

  const rollPresets = [
    {
      id: `${selectedCharacter.id}-base`,
      label: 'Rolagem base',
      description: 'Teste base configurado para a ficha atual.',
      config: selectedCharacter.rolagemBase,
    },
    ...selectedCharacter.pericias.map((skill) => ({
      id: skill.id,
      label: skill.nome,
      description: `${formatAttributeLabel(skill.atributoBase)} + bonus de pericia ${skill.bonusPericia}.`,
      config: createAttributeRollConfig(
        selectedCharacter.atributos[skill.atributoBase],
        skill.bonusPericia,
      ),
    })),
    ...selectedCharacter.ataques.map((attack) => ({
      id: attack.id,
      label: attack.nome,
      description: `${formatAttributeLabel(attack.atributoBase)} + bonus de ataque ${attack.bonusPericia}.`,
      config: createAttributeRollConfig(
        selectedCharacter.atributos[attack.atributoBase],
        attack.bonusPericia,
      ),
    })),
  ]

  const activeRollPreset =
    rollPresets.find((preset) => preset.id === selectedRollSourceId) ?? rollPresets[0]

  return (
    <div className="page-stack">
      <div className="sheet-layout">
        {viewMode === 'gm' ? (
          <Panel
            eyebrow="Lista de fichas"
            title="Personagens carregados"
            subtitle="Estrutura oficial do MVP pronta para evoluir."
          >
            <CharacterSelector
              activeCharacterId={selectedCharacter.id}
              characters={data.characters.items}
              onSelect={(characterId) => {
                setSelectedCharacterId(characterId)
                setSelectedRollSourceId('')
              }}
            />
          </Panel>
        ) : (
          <Panel
            eyebrow="Player View"
            title="Ficha visivel"
            subtitle="Mostra apenas o personagem selecionado para o jogador."
          >
            <article className="list-card">
              <h3>{selectedCharacter.nome}</h3>
              <p className="support-copy">
                Esta visao esconde notas do mestre, faccoes sensiveis e telas de
                campanha interna.
              </p>
            </article>
          </Panel>
        )}

        <CharacterSheetCard
          character={selectedCharacter}
          factionName={selectedFaction?.nome ?? selectedCharacter.faccao}
          onUseRoll={(payload) => setSelectedRollSourceId(payload.id)}
        />
      </div>

      <div className="split-grid">
        <DiceRollerPanel
          contextLabel={`${selectedCharacter.nome} - ${activeRollPreset.label}`}
          defaultConfig={activeRollPreset.config}
          key={`${selectedCharacter.id}-${activeRollPreset.id}`}
          title="Rolagem da ficha"
          subtitle={activeRollPreset.description}
        />

        <Panel
          eyebrow="Preset atual"
          title={activeRollPreset.label}
          subtitle="Referencia rapida da acao ou teste selecionado."
        >
          <article className="list-card">
            <p className="support-copy">{activeRollPreset.description}</p>
            <div className="tag-row">
              <span className="tag">{formatRollFormula(activeRollPreset.config)}</span>
              <span className="tag">Defesa {selectedCharacter.defesa}</span>
            </div>
          </article>
        </Panel>
      </div>
    </div>
  )
}
