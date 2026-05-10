import { useState } from 'react'
import type { CharacterSheet } from '../../data/types'
import type { FushiAccessProfile, FushiAccessProfileId } from '../../lib/playerAccess'

interface TabletopAccessPanelProps {
  profiles: FushiAccessProfile[]
  playerCharacters: CharacterSheet[]
  onLogout: () => void
  onSaveProfile: (
    profileId: FushiAccessProfileId,
    updates: Partial<Pick<FushiAccessProfile, 'characterId' | 'label' | 'password'>>,
  ) => void
}

type AccessDraft = Record<
  FushiAccessProfileId,
  Pick<FushiAccessProfile, 'characterId' | 'label' | 'password'>
>

function buildDraft(profiles: FushiAccessProfile[]): AccessDraft {
  return Object.fromEntries(
    profiles.map((profile) => [
      profile.id,
      {
        characterId: profile.characterId,
        label: profile.label,
        password: profile.password,
      },
    ]),
  ) as AccessDraft
}

export function TabletopAccessPanel({
  profiles,
  playerCharacters,
  onLogout,
  onSaveProfile,
}: TabletopAccessPanelProps) {
  const [draft, setDraft] = useState(() => buildDraft(profiles))
  const [statusMessage, setStatusMessage] = useState('')

  function updateDraft(
    profileId: FushiAccessProfileId,
    updates: Partial<Pick<FushiAccessProfile, 'characterId' | 'label' | 'password'>>,
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [profileId]: {
        ...currentDraft[profileId],
        ...updates,
      },
    }))
  }

  function handleSave() {
    profiles.forEach((profile) => {
      onSaveProfile(profile.id, draft[profile.id])
    })
    setStatusMessage('Senhas e acessos salvos.')
    window.setTimeout(() => setStatusMessage(''), 2200)
  }

  return (
    <div className="tabletop-access-panel">
      <div className="list-card__top">
        <div>
          <p className="eyebrow">Controle de entrada</p>
          <h3>Senhas e jogadores</h3>
        </div>
        <button className="button" onClick={onLogout} type="button">
          Sair da conta
        </button>
      </div>

      <div className="tabletop-access-panel__list">
        {profiles.map((profile) => (
          <article className="tabletop-access-panel__row" key={profile.id}>
            <label className="field">
              <span>Nome</span>
              <input
                className="field__input"
                onChange={(event) =>
                  updateDraft(profile.id, {
                    label: event.target.value,
                  })
                }
                value={draft[profile.id].label}
              />
            </label>
            <label className="field">
              <span>Senha</span>
              <input
                className="field__input"
                onChange={(event) =>
                  updateDraft(profile.id, {
                    password: event.target.value,
                  })
                }
                value={draft[profile.id].password}
              />
            </label>
            {profile.role === 'player' ? (
              <label className="field">
                <span>Personagem</span>
                <select
                  className="field__input"
                  onChange={(event) =>
                    updateDraft(profile.id, {
                      characterId: event.target.value,
                    })
                  }
                  value={draft[profile.id].characterId}
                >
                  <option value="">Sem personagem fixo</option>
                  {playerCharacters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.nome}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="tag">Mestre</span>
            )}
          </article>
        ))}
      </div>

      {statusMessage ? <p className="support-copy">{statusMessage}</p> : null}
      <button className="button button--primary" onClick={handleSave} type="button">
        Salvar acessos
      </button>
    </div>
  )
}
