import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Panel } from '../components/ui/Panel'
import { useMasterData } from '../hooks/useMasterData'
import { useMultiplayer } from '../hooks/useMultiplayer'
import { useViewMode } from '../hooks/useViewMode'
import type { FushiAccessProfileId } from '../lib/playerAccess'

const PLAYER_ACCESS_OPTIONS: Array<{
  id: FushiAccessProfileId
  label: string
}> = [
  { id: 'player1', label: 'Jogador 1' },
  { id: 'player2', label: 'Jogador 2' },
  { id: 'player3', label: 'Jogador 3' },
  { id: 'player4', label: 'Jogador 4' },
  { id: 'player5', label: 'Jogador 5' },
]

function isSecureTunnelHost(value: string) {
  const host = value.trim().toLowerCase()

  return (
    /^(https|wss):\/\//i.test(host) ||
    host.includes('trycloudflare.com') ||
    host.includes('ngrok-free.app')
  )
}

export function MultiplayerPage() {
  const navigate = useNavigate()
  const { data } = useMasterData()
  const { activeAccessProfile } = useViewMode()
  const {
    authenticateRemoteProfile,
    clientConfig,
    connectedPlayers,
    connectionStatus,
    controlPlayerAdmission,
    errorMessage,
    hostStatus,
    joinSession,
    remoteAccessState,
    refreshHostStatus,
    startHosting,
    stopHosting,
  } = useMultiplayer()
  const activeCampaign =
    data?.campaigns.items.find(
      (campaign) => campaign.id === data.campaigns.activeCampaignId,
    ) ??
    data?.campaigns.items[0] ??
    null
  const [hostPort, setHostPort] = useState('3030')
  const [hostCode, setHostCode] = useState('')
  const [joinHost, setJoinHost] = useState('127.0.0.1')
  const [joinPort, setJoinPort] = useState('3030')
  const [joinCode, setJoinCode] = useState('')
  const [joinProfileId, setJoinProfileId] = useState<FushiAccessProfileId>('player1')
  const [joinPassword, setJoinPassword] = useState('')
  const [joinStatusMessage, setJoinStatusMessage] = useState('')
  const [hostActionMessage, setHostActionMessage] = useState('')
  const canHostSession = !clientConfig && activeAccessProfile?.role !== 'player'
  const remoteProfiles = remoteAccessState?.profiles.length
    ? remoteAccessState.profiles.filter((profile) => profile.role === 'player')
    : PLAYER_ACCESS_OPTIONS

  async function handleStartHosting() {
    if (!activeCampaign) {
      return
    }

    await startHosting({
      campaignId: activeCampaign.id,
      port: Number.parseInt(hostPort, 10) || 3030,
      sessionCode: hostCode,
    })
  }

  async function handleJoinSession() {
    setJoinStatusMessage('Conectando ao servidor do mestre...')
    const connected =
      connectionStatus === 'connected'
        ? true
        : await joinSession({
            host: joinHost,
            port: Number.parseInt(joinPort, 10) || (isSecureTunnelHost(joinHost) ? 443 : 3030),
            sessionCode: joinCode,
          })

    if (!connected) {
      setJoinStatusMessage('Nao foi possivel conectar a sessao.')
      return
    }

    setJoinStatusMessage('Validando senha e aguardando liberacao do mestre...')
    const authenticated = await authenticateRemoteProfile(joinProfileId, joinPassword)

    if (!authenticated) {
      setJoinStatusMessage('Senha incorreta, jogador indisponivel ou entrada recusada pelo mestre.')
      return
    }

    setJoinPassword('')
    setJoinStatusMessage('Entrada liberada. Abrindo a mesa...')
    navigate('/jogar/mesa')
  }

  async function handlePlayerAdmission(
    action: 'accept' | 'kick' | 'reject',
    player: (typeof connectedPlayers)[number],
  ) {
    setHostActionMessage('Atualizando acesso do jogador...')
    const ok = await controlPlayerAdmission({
      action,
      clientId: player.id,
      playerId: player.playerId,
    })

    setHostActionMessage(
      ok
        ? action === 'accept'
          ? 'Jogador liberado para a mesa.'
          : action === 'kick'
            ? 'Jogador removido da mesa.'
            : 'Entrada recusada.'
        : 'Nao foi possivel atualizar o jogador.',
    )
  }

  function getPlayerDisplayLabel(player: (typeof connectedPlayers)[number]) {
    if (player.profileLabel) {
      return player.profileLabel
    }

    const match = /^player([1-5])$/.exec(player.playerId)
    return match ? `Jogador ${match[1]}` : 'Aguardando acesso'
  }

  function getAdmissionLabel(status: (typeof connectedPlayers)[number]['admissionStatus']) {
    if (status === 'accepted') {
      return 'Online'
    }

    if (status === 'pending') {
      return 'Aguardando'
    }

    if (status === 'rejected') {
      return 'Recusado'
    }

    if (status === 'kicked') {
      return 'Removido'
    }

    return 'Conectando'
  }

  return (
    <div className="stack-list">
      {canHostSession ? (
        <Panel
          eyebrow="Multiplayer V1"
          title="Hospedar como mestre"
          subtitle="Inicia um servidor local HTTP/WebSocket no seu PC, estilo servidor de Minecraft."
        >
          <div className="cards-grid">
            <article className="list-card">
              <div className="list-card__top">
                <h3>Campanha ativa</h3>
                <span className="tag">{activeCampaign?.id ?? 'nenhuma'}</span>
              </div>
              <p className="support-copy">
                {activeCampaign?.nome ?? 'Abra uma campanha antes de hospedar.'}
              </p>
            </article>
            <article className="list-card">
              <label className="field">
                <span>Porta local</span>
                <input
                  onChange={(event) => setHostPort(event.target.value)}
                  type="number"
                  value={hostPort}
                />
              </label>
              <label className="field">
                <span>Codigo da sessao opcional</span>
                <input
                  onChange={(event) => setHostCode(event.target.value)}
                  placeholder="automatico se vazio"
                  value={hostCode}
                />
              </label>
              <div className="tabletop-hud-panel__actions">
                <button
                  className="button button--primary"
                  disabled={!activeCampaign}
                  onClick={() => void handleStartHosting()}
                  type="button"
                >
                  Hospedar sessao
                </button>
                <button className="button" onClick={() => void stopHosting()} type="button">
                  Parar servidor
                </button>
                <button className="button" onClick={refreshHostStatus} type="button">
                  Atualizar status
                </button>
              </div>
            </article>
          </div>

          {hostStatus?.isRunning ? (
          <article className="list-card">
            <div className="list-card__top">
              <h3>Servidor ativo</h3>
              <span className="tag">porta {hostStatus.port}</span>
            </div>
            <div className="tag-row">
              <span className="tag">codigo: {hostStatus.sessionCode}</span>
              {hostStatus.localIps.map((ip) => (
                <span className="tag" key={ip}>
                  {ip}:{hostStatus.port}
                </span>
              ))}
            </div>
            <p className="support-copy">
              Para internet, crie um tunnel apontando para a porta local {hostStatus.port}.
              Em Cloudflare/HTTPS, o amigo usa a URL do tunnel com porta 443.
            </p>
          </article>
          ) : null}

          <article className="list-card">
            <div className="list-card__top">
              <h3>Jogadores conectados</h3>
              <span className="tag">{connectedPlayers.length}</span>
            </div>
            {connectedPlayers.length > 0 ? (
              <div className="multiplayer-player-list">
                {connectedPlayers.map((player) => (
                  <div className="multiplayer-player-row" key={player.id}>
                    <div>
                      <strong>{getPlayerDisplayLabel(player)}</strong>
                      <span>
                        {player.playerId} · {getAdmissionLabel(player.admissionStatus)}
                      </span>
                    </div>
                    {player.admissionStatus === 'pending' ? (
                      <div className="tabletop-hud-panel__actions">
                        <button
                          className="button button--primary"
                          onClick={() => void handlePlayerAdmission('accept', player)}
                          type="button"
                        >
                          Aceitar
                        </button>
                        <button
                          className="button"
                          onClick={() => void handlePlayerAdmission('reject', player)}
                          type="button"
                        >
                          Recusar
                        </button>
                      </div>
                    ) : player.admissionStatus === 'accepted' ? (
                      <button
                        className="button"
                        onClick={() => void handlePlayerAdmission('kick', player)}
                        type="button"
                      >
                        Expulsar
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="support-copy">Nenhum jogador conectado.</p>
            )}
            {hostActionMessage ? (
              <p className="support-copy">{hostActionMessage}</p>
            ) : null}
          </article>
        </Panel>
      ) : null}

      <Panel
        eyebrow="Multiplayer V1"
        title="Entrar como jogador"
        subtitle="Conecta ao servidor local do mestre por IP/LAN ou endereco de tunnel."
      >
        <div className="cards-grid">
          <article className="list-card">
            <label className="field">
              <span>Host/IP/tunnel</span>
              <input
                onChange={(event) => {
                  const nextHost = event.target.value
                  setJoinHost(nextHost)

                  if (isSecureTunnelHost(nextHost) && (!joinPort || joinPort === '3030')) {
                    setJoinPort('443')
                  }
                }}
                placeholder="127.0.0.1 ou https://...trycloudflare.com"
                value={joinHost}
              />
            </label>
            <label className="field">
              <span>Porta</span>
              <input
                onChange={(event) => setJoinPort(event.target.value)}
                type="number"
                value={joinPort}
              />
            </label>
            <p className="support-copy">
              Rede local usa 3030. Tunnel Cloudflare/HTTPS usa 443.
            </p>
          </article>
          <article className="list-card">
            <div className="access-gate__profiles access-gate__profiles--compact">
              {remoteProfiles.map((profile) => (
                <button
                  className={`access-gate__profile${
                    joinProfileId === profile.id ? ' access-gate__profile--active' : ''
                  }`}
                  key={profile.id}
                  onClick={() => setJoinProfileId(profile.id)}
                  type="button"
                >
                  <strong>{profile.label}</strong>
                  <span>Jogador</span>
                </button>
              ))}
            </div>
            <label className="field">
              <span>Codigo da sessao</span>
              <input
                onChange={(event) => setJoinCode(event.target.value)}
                value={joinCode}
              />
            </label>
            <label className="field">
              <span>Senha do jogador</span>
              <input
                onChange={(event) => setJoinPassword(event.target.value)}
                type="password"
                value={joinPassword}
              />
            </label>
            <p className="support-copy">
              A senha e validada aqui. Depois o app abre direto a mesa do mestre.
            </p>
            <button
              className="button button--primary"
              onClick={() => void handleJoinSession()}
              type="button"
            >
              Entrar em sessao
            </button>
          </article>
        </div>

        <p className="support-copy">
          Status: {connectionStatus}. {joinStatusMessage || errorMessage}
        </p>
      </Panel>
    </div>
  )
}
