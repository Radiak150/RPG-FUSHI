import { useState, type FormEvent, type PropsWithChildren } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { FushiAccessProfileId } from '../lib/playerAccess'
import { useViewMode } from '../hooks/useViewMode'

function LauncherBackLink() {
  return (
    <Link className="launcher-brand launcher-brand--gate" to="/launcher">
      <span className="launcher-brand__mark">F</span>
      <span>
        <strong>FUSHI</strong>
        <small>Voltar Launcher</small>
      </span>
    </Link>
  )
}

export function AccessGate({ children }: PropsWithChildren) {
  const location = useLocation()
  const {
    accessState,
    activeAccessProfile,
    authenticateAccessProfile,
  } = useViewMode()
  const [selectedProfileId, setSelectedProfileId] =
    useState<FushiAccessProfileId>('gm')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const effectiveSelectedProfileId = accessState.profiles.some(
    (profile) => profile.id === selectedProfileId,
  )
    ? selectedProfileId
    : (accessState.profiles[0]?.id ?? 'gm')

  const isPublicEntryRoute =
    location.pathname === '/' ||
    location.pathname === '/launcher' ||
    location.pathname === '/multiplayer' ||
    location.pathname === '/configuracoes'

  if (activeAccessProfile || isPublicEntryRoute) {
    return <>{children}</>
  }

  if (accessState.profiles.length === 0) {
    return (
      <div className="access-gate">
        <section className="access-gate__panel">
          <LauncherBackLink />
          <div>
            <p className="eyebrow">Entrada da mesa</p>
            <h1>Aguardando acessos.</h1>
            <p className="support-copy">
              Recebendo perfis remotos do servidor do mestre.
            </p>
          </div>
          <div aria-label="Carregando perfis" className="route-loading" />
        </section>
      </div>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (await authenticateAccessProfile(effectiveSelectedProfileId, password)) {
      setPassword('')
      setErrorMessage('')
      return
    }

    setErrorMessage('Senha incorreta para essa entrada.')
  }

  return (
    <div className="access-gate">
      <form className="access-gate__panel" onSubmit={handleSubmit}>
        <LauncherBackLink />
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
                effectiveSelectedProfileId === profile.id ? ' access-gate__profile--active' : ''
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
