import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CampaignCollectionCard } from '../components/campaigns/CampaignCollectionCard'
import { ConfirmDeleteDialog } from '../components/ui/ConfirmDeleteDialog'
import { LocalImageInput } from '../components/ui/LocalImageInput'
import type { LocalCampaign } from '../data/types'
import { useMasterData } from '../hooks/useMasterData'
import { useViewMode } from '../hooks/useViewMode'
import {
  createTabletopLibraryState,
  readPersistedTabletopLibraryState,
  writePersistedTabletopLibraryState,
} from '../lib/tabletopLibraryState'
import {
  clearPersistedTabletopSession,
  readPersistedTabletopSession,
  writePersistedTabletopSession,
} from '../lib/tabletopSession'
import {
  createBlankWorldMundiState,
  createWorldMundiState,
  readPersistedWorldMundiState,
  writePersistedWorldMundiState,
} from '../lib/worldMundiState'

type CampaignSeedMode = 'template' | 'empty' | 'duplicate'

function buildId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function buildLocalCampaignCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const block = Array.from({ length: 6 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join('')

  return `FUSHI-${block}`
}

export function CampaignsPage() {
  const { data, createCampaign, deleteCampaign, setActiveCampaign } = useMasterData()
  const { viewMode, setViewMode, playerCharacterId, setPlayerCharacterId } =
    useViewMode()
  const navigate = useNavigate()
  const redirectTimeoutRef = useRef<number | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [campaignCoverUrl, setCampaignCoverUrl] = useState('')
  const [joinError, setJoinError] = useState('')
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [selectedJoinCharacterId, setSelectedJoinCharacterId] = useState('')
  const [campaignSeedMode, setCampaignSeedMode] = useState<CampaignSeedMode>('template')
  const [lastCreatedCampaignId, setLastCreatedCampaignId] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  if (!data) {
    return null
  }

  const campaigns = data.campaigns.items
  const activeCampaign =
    campaigns.find((campaign) => campaign.id === data.campaigns.activeCampaignId) ??
    campaigns[0] ??
    null
  const selectedCampaign =
    campaigns.find((campaign) => campaign.id === selectedCampaignId) ??
    activeCampaign ??
    null
  const playerCharacters = data.characters.items.filter(
    (character) => character.tipo === 'player',
  )
  const effectiveJoinCharacterId =
    selectedJoinCharacterId || playerCharacterId || playerCharacters[0]?.id || ''

  function handleCreateCampaign() {
    const code = buildLocalCampaignCode()
    const nextCampaign: LocalCampaign = {
      id: buildId('campaign'),
      nome: campaignName.trim() || `Campanha ${campaigns.length + 1}`,
      codigo: code,
      link: `fushi://campanha/${code}`,
      coverImageUrl: campaignCoverUrl.trim(),
      resumo: 'Campanha local criada no fluxo do produto.',
      sessaoAtual: 'Sessao 01',
      status: 'Mesa local pronta',
      createdAt: new Date().toISOString(),
      tone: 'steady',
    }
    const createdCampaign = createCampaign(nextCampaign)

    if (!createdCampaign) {
      return
    }

    if (campaignSeedMode === 'duplicate' && selectedCampaign) {
      writePersistedWorldMundiState(
        readPersistedWorldMundiState(selectedCampaign.id),
        createdCampaign.id,
      )
      writePersistedTabletopLibraryState(
        readPersistedTabletopLibraryState(selectedCampaign.id),
        createdCampaign.id,
      )
      const sourceSession = readPersistedTabletopSession(selectedCampaign.id)

      if (sourceSession) {
        writePersistedTabletopSession(sourceSession, createdCampaign.id)
      } else {
        clearPersistedTabletopSession(createdCampaign.id)
      }
    } else {
      writePersistedWorldMundiState(
        campaignSeedMode === 'empty'
          ? createBlankWorldMundiState()
          : createWorldMundiState(),
        createdCampaign.id,
      )
      writePersistedTabletopLibraryState(createTabletopLibraryState(), createdCampaign.id)
      clearPersistedTabletopSession(createdCampaign.id)
    }

    setCampaignName('')
    setCampaignCoverUrl('')
    setCampaignSeedMode('template')
    setSelectedCampaignId(createdCampaign.id)
    setLastCreatedCampaignId(createdCampaign.id)
    setViewMode('gm')
    setActiveCampaign(createdCampaign.id)

    if (redirectTimeoutRef.current) {
      window.clearTimeout(redirectTimeoutRef.current)
    }

    redirectTimeoutRef.current = window.setTimeout(() => {
      navigate('/jogar/mesa')
    }, 900)
  }

  function handleOpenCampaign(campaignId: string) {
    setSelectedCampaignId(campaignId)
    setActiveCampaign(campaignId)
  }

  function handleValidateJoin() {
    const normalizedCode = joinCode.trim()

    if (!normalizedCode) {
      setJoinError('Informe um codigo ou link para continuar.')
      return
    }

    const matchedCampaign =
      campaigns.find(
        (campaign) =>
          campaign.codigo.toLowerCase() === normalizedCode.toLowerCase() ||
          campaign.link.toLowerCase() === normalizedCode.toLowerCase(),
      ) ?? null

    if (!matchedCampaign) {
      setJoinError('Codigo local nao encontrado.')
      return
    }

    setJoinError('')
    handleOpenCampaign(matchedCampaign.id)
  }

  function handleEnterCampaign(campaignId: string) {
    const targetCampaign =
      campaigns.find((campaign) => campaign.id === campaignId) ?? null

    if (!targetCampaign) {
      setJoinError('Selecione uma campanha para continuar.')
      return
    }

    if (viewMode === 'gm') {
      setActiveCampaign(targetCampaign.id)
      navigate('/jogar/mesa')
      return
    }

    if (playerCharacters.length === 0) {
      setJoinError('Crie um personagem antes de entrar na campanha.')
      return
    }

    if (!effectiveJoinCharacterId) {
      setJoinError('Selecione campanha e personagem para entrar.')
      return
    }

    setJoinError('')
    setViewMode('player')
    setPlayerCharacterId(effectiveJoinCharacterId)
    setActiveCampaign(targetCampaign.id)
    navigate('/jogar/mesa')
  }

  function handleDeleteCampaign() {
    if (!selectedCampaign) {
      return
    }

    deleteCampaign(selectedCampaign.id)
    setIsDeleteOpen(false)
    setSelectedCampaignId('')
  }

  return (
    <div className="page-stack">
      <section className="flow-hero">
        <div>
          <p className="eyebrow">Campanhas</p>
          <h1>Galeria e acesso.</h1>
        </div>

        {selectedCampaign ? (
          <div className="flow-card__actions">
            <button
              className="button button--primary"
              onClick={() => handleEnterCampaign(selectedCampaign.id)}
              type="button"
            >
              {viewMode === 'gm' ? 'Abrir mesa' : 'Entrar'}
            </button>
            {viewMode === 'gm' ? (
              <button className="button" onClick={() => setIsDeleteOpen(true)} type="button">
                Excluir campanha
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="flow-card">
        <div className="flow-card__header">
          <div>
            <p className="eyebrow">Campanhas criadas</p>
            <h2>Colecao local</h2>
          </div>
        </div>

        <div className="collection-grid collection-grid--campaigns">
          {campaigns.map((campaign) => (
            <CampaignCollectionCard
              actionLabel={viewMode === 'gm' ? 'Mesa' : 'Entrar'}
              campaign={campaign}
              isActive={selectedCampaign?.id === campaign.id}
              key={campaign.id}
              onEnter={() => handleEnterCampaign(campaign.id)}
              onOpen={() => handleOpenCampaign(campaign.id)}
            />
          ))}
        </div>
      </section>

      <div className="flow-grid">
        <section className="flow-card">
          <div className="flow-card__header">
            <div>
              <p className="eyebrow">Entrar</p>
              <h2>Acessar por codigo</h2>
            </div>
          </div>

          <label className="field">
            <span>Link ou codigo</span>
            <input
              className="field__input"
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder={selectedCampaign?.codigo ?? activeCampaign?.codigo ?? 'FUSHI-LOCAL'}
              type="text"
              value={joinCode}
            />
          </label>

          {joinError ? <p className="support-copy support-copy--danger">{joinError}</p> : null}

          <div className="flow-card__actions">
            <button
              className="button button--primary"
              onClick={handleValidateJoin}
              type="button"
            >
              Validar acesso
            </button>
          </div>

          {selectedCampaign && playerCharacters.length > 0 ? (
            <label className="field">
              <span>Personagem</span>
              <select
                className="field__input"
                onChange={(event) => setSelectedJoinCharacterId(event.target.value)}
                value={effectiveJoinCharacterId}
              >
                {playerCharacters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.nome}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {selectedCampaign && playerCharacters.length === 0 ? (
            <p className="support-copy support-copy--danger">
              Nenhum personagem de jogador criado. Crie um em Personagens antes de entrar.
            </p>
          ) : null}
        </section>

        {viewMode === 'gm' ? (
          <section className="flow-card">
            <div className="flow-card__header">
              <div>
                <p className="eyebrow">Criar</p>
                <h2>Nova campanha</h2>
              </div>
            </div>

            <label className="field">
              <span>Nome</span>
              <input
                className="field__input"
                onChange={(event) => setCampaignName(event.target.value)}
                placeholder="Campanha FUSHI"
                type="text"
                value={campaignName}
              />
            </label>

            <LocalImageInput
              aspect="wide"
              label="Capa"
              onChange={setCampaignCoverUrl}
              value={campaignCoverUrl}
            />

            <label className="field">
              <span>Estado inicial</span>
              <select
                className="field__input"
                onChange={(event) => setCampaignSeedMode(event.target.value as CampaignSeedMode)}
                value={campaignSeedMode}
              >
                <option value="template">Usar Template Base FUSHI</option>
                <option value="empty">Campanha vazia</option>
                <option value="duplicate">Duplicar campanha selecionada</option>
              </select>
            </label>

            <p className="support-copy">
              Cada campanha salva MUN, MAP e mesa em chaves proprias. Duplicar copia o estado
              da campanha selecionada.
            </p>

            <div className="flow-card__actions">
              <button
                className="button button--primary"
                onClick={handleCreateCampaign}
                type="button"
              >
                Criar campanha
              </button>
            </div>
          </section>
        ) : null}
      </div>

      {selectedCampaign ? (
        <section className="flow-card flow-card--access">
          <div className="flow-card__header">
            <div>
              <p className="eyebrow">Campanha aberta</p>
              <h2>{selectedCampaign.nome}</h2>
            </div>
          </div>

          <div className="access-card">
            <strong>{selectedCampaign.codigo}</strong>
            <span>{selectedCampaign.link}</span>
          </div>

          <p className="support-copy">{selectedCampaign.resumo}</p>

          {lastCreatedCampaignId === selectedCampaign.id ? (
            <p className="support-copy">
              Campanha criada. Redirecionando o mestre para a Mesa.
            </p>
          ) : null}
        </section>
      ) : null}

      {isDeleteOpen && selectedCampaign ? (
        <ConfirmDeleteDialog
          entityLabel={selectedCampaign.nome}
          message="A exclusao remove apenas a campanha local salva neste navegador."
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteCampaign}
          title="Excluir campanha"
        />
      ) : null}
    </div>
  )
}
