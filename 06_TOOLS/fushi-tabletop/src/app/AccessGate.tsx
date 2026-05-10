import { useState, type FormEvent, type PropsWithChildren } from 'react'
import type { FushiAccessProfileId } from '../lib/playerAccess'
import { useViewMode } from '../hooks/useViewMode'

export function AccessGate({ children }: PropsWithChildren) {
  const {
    accessState,
    activeAccessProfile,
    authenticateAccessProfile,
  } = useViewMode()
  const [selectedProfileId, setSelectedProfileId] =
    useState<FushiAccessProfileId>('gm')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  if (activeAccessProfile) {
    return <>{children}</>
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (authenticateAccessProfile(selectedProfileId, password)) {
      setPassword('')
      setErrorMessage('')
      return
    }

    setErrorMessage('Senha incorreta para essa entrada.')
  }

  return (
    <div className="access-gate">
      <form className="access-gate__panel" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Entrada da mesa</p>
          <h1>Escolha seu acesso.</h1>
          <p className="support-copy">
            Cada jogador entra na propria conta. O mestre controla senhas e personagens.
          </p>
        </div>

        <div className="access-gate__profiles">
          {accessState.profiles.map((profile) => (
            <button
              className={`access-gate__profile${
                selectedProfileId === profile.id ? ' access-gate__profile--active' : ''
              }`}
              key={profile.id}
              onClick={() => {
                setSelectedProfileId(profile.id)
                setPassword('')
                setErrorMessage('')
              }}
              type="button"
            >
              <strong>{profile.label}</strong>
              <span>{profile.role === 'gm' ? 'Mestre' : 'Jogador'}</span>
            </button>
          ))}
        </div>

        <label className="field">
          <span>Senha</span>
          <input
            autoFocus
            className="field__input"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </label>
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        <button className="button button--primary" type="submit">
          Entrar
        </button>
      </form>
    </div>
  )
}
