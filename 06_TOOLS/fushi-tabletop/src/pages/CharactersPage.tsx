import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CharacterCollectionCard } from '../components/characters/CharacterCollectionCard'
import { CharacterEditorPanel } from '../components/characters/CharacterEditorPanel'
import { CharacterProfileCard } from '../components/characters/CharacterProfileCard'
import { ConfirmDeleteDialog } from '../components/ui/ConfirmDeleteDialog'
import type { CharacterSheet } from '../data/types'
import { useMasterData } from '../hooks/useMasterData'
import { useViewMode } from '../hooks/useViewMode'
import {
  createEmptyCharacter,
  normalizeCharacterSheet,
  prepareCharacterForEditing,
} from '../lib/characterSheet'
import { getFocusedPlayerCharacter } from '../lib/selectors'

function cloneCharacter(character: CharacterSheet): CharacterSheet {
  return JSON.parse(JSON.stringify(character)) as CharacterSheet
}

export function CharactersPage() {
  const { data, createCharacter, updateCharacter, deleteCharacter } = useMasterData()
  const { viewMode, playerCharacterId, setPlayerCharacterId } = useViewMode()
  const navigate = useNavigate()
  const [selectedCharacterId, setSelectedCharacterId] = useState('')
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null)
  const [draft, setDraft] = useState<CharacterSheet | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  if (!data) {
    return null
  }

  const masterData = data
  const playerCharacters = masterData.characters.items.filter(
    (character) => character.tipo === 'player',
  )
  const npcCharacters = masterData.characters.items.filter(
    (character) => character.tipo === 'npc',
  )
  const fallbackCharacter =
    masterData.characters.items.find(
      (character) => character.id === selectedCharacterId,
    ) ??
    playerCharacters[0] ??
    npcCharacters[0] ??
    null
  const selectedCharacter =
    viewMode === 'player'
      ? getFocusedPlayerCharacter(masterData, playerCharacterId)
      : fallbackCharacter
  const selectedFaction = selectedCharacter
    ? masterData.factions.items.find((faction) => faction.id === selectedCharacter.faccao)
    : null
  const selectedPlayerCharacter =
    selectedCharacter?.tipo === 'player'
      ? selectedCharacter
      : playerCharacters[0] ?? null
  const canCreateCharacter = true
  const canEditSelectedCharacter = Boolean(
    selectedCharacter &&
      (viewMode === 'gm' || selectedCharacter.tipo === 'player'),
  )
  const canDeleteSelectedCharacter = Boolean(
    selectedCharacter &&
      (viewMode === 'gm' || selectedCharacter.tipo === 'player'),
  )

  function openCreateEditor() {
    setDraft(createEmptyCharacter(masterData.factions.items[0]?.id ?? ''))
    setEditorMode('create')
  }

  function openEditEditor(targetCharacter?: CharacterSheet | null) {
    const characterToEdit = targetCharacter ?? selectedCharacter

    if (!characterToEdit) {
      return
    }

    if (viewMode !== 'gm' && characterToEdit.tipo !== 'player') {
      return
    }

    setSelectedCharacterId(characterToEdit.id)
    setDraft(prepareCharacterForEditing(cloneCharacter(characterToEdit)))
    setEditorMode('edit')
  }

  function handleSaveDraft() {
    if (!draft) {
      return
    }

    const normalizedDraft = normalizeCharacterSheet(draft)

    if (editorMode === 'create') {
      const nextCharacter = createCharacter(normalizedDraft)

      if (nextCharacter) {
        setSelectedCharacterId(nextCharacter.id)
        if (nextCharacter.tipo === 'player') {
          setPlayerCharacterId(nextCharacter.id)
        }
      }
    }

    if (editorMode === 'edit') {
      const nextCharacter = updateCharacter(normalizedDraft)

      if (nextCharacter) {
        setSelectedCharacterId(nextCharacter.id)

        if (nextCharacter.tipo === 'player') {
          setPlayerCharacterId(nextCharacter.id)
        }
      }
    }

    setEditorMode(null)
    setDraft(null)
  }

  function handleDeleteCharacter() {
    if (!selectedCharacter) {
      return
    }

    if (playerCharacterId === selectedCharacter.id) {
      setPlayerCharacterId('')
    }

    deleteCharacter(selectedCharacter.id)
    setIsDeleteOpen(false)
    setSelectedCharacterId('')
  }

  return (
    <div className="page-stack">
      <section className="flow-hero">
        <div>
          <p className="eyebrow">Personagens</p>
          <h1>Galeria e ficha.</h1>
        </div>

        <div className="flow-card__actions">
          {canCreateCharacter ? (
            <>
              <button className="button" onClick={openCreateEditor} type="button">
                Criar personagem
              </button>
              <button
                className="button"
                disabled={!canEditSelectedCharacter}
                onClick={() => openEditEditor()}
                type="button"
              >
                Editar personagem
              </button>
              <button
                className="button"
                disabled={!canDeleteSelectedCharacter}
                onClick={() => setIsDeleteOpen(true)}
                type="button"
              >
                Excluir personagem
              </button>
            </>
          ) : null}

          {selectedPlayerCharacter ? (
            <button
              className="button button--primary"
              onClick={() => {
                if (selectedPlayerCharacter.tipo === 'player') {
                  setPlayerCharacterId(selectedPlayerCharacter.id)
                }

                navigate('/jogar/mesa')
              }}
              type="button"
            >
              {viewMode === 'gm' ? 'Abrir mesa' : 'Entrar na mesa'}
            </button>
          ) : null}
        </div>
      </section>

      <section className="flow-card">
        <div className="flow-card__header">
          <div>
            <p className="eyebrow">Jogadores</p>
            <h2>Personagens criados</h2>
          </div>
        </div>

        <div className="collection-grid">
          {playerCharacters.map((character) => (
            <CharacterCollectionCard
              character={character}
              isActive={selectedCharacter?.id === character.id}
              key={character.id}
              onOpenEditor={() => openEditEditor(character)}
              onSelect={() => {
                setSelectedCharacterId(character.id)
                if (viewMode === 'player') {
                  setPlayerCharacterId(character.id)
                }
              }}
            />
          ))}
        </div>
      </section>

      {viewMode === 'gm' ? (
        <section className="flow-card">
          <div className="flow-card__header">
            <div>
              <p className="eyebrow">NPCs</p>
              <h2>Elenco local</h2>
            </div>
          </div>

          <div className="collection-grid">
            {npcCharacters.map((character) => (
              <CharacterCollectionCard
                character={character}
                isActive={selectedCharacter?.id === character.id}
                key={character.id}
                onOpenEditor={() => openEditEditor(character)}
                onSelect={() => setSelectedCharacterId(character.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {selectedCharacter ? (
        <CharacterProfileCard
          character={selectedCharacter}
          factionName={selectedFaction?.nome ?? selectedCharacter.faccao}
          showSensitiveNotes={viewMode === 'gm'}
        />
      ) : (
        <section className="flow-card">
          <p className="support-copy">Nenhum personagem selecionado.</p>
        </section>
      )}

      {editorMode && draft ? (
        <CharacterEditorPanel
          draft={draft}
          factions={masterData.factions.items}
          mode={editorMode}
          onChange={setDraft}
          onClose={() => {
            setEditorMode(null)
            setDraft(null)
          }}
          onSave={handleSaveDraft}
        />
      ) : null}

      {isDeleteOpen && selectedCharacter ? (
        <ConfirmDeleteDialog
          entityLabel={selectedCharacter.nome}
          message="A exclusao e local. Tokens associados somem da Mesa automaticamente se nao houver mais ficha correspondente."
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteCharacter}
          title="Excluir personagem"
        />
      ) : null}
    </div>
  )
}
