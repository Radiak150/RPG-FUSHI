import { useMemo, useState } from 'react'
import type { CharacterSheet, TabletopToken } from '../../data/types'
import {
  simulateCombat,
  type CombatSimulationResult,
  type CombatSimulationTeamId,
} from '../../lib/combatSimulator'

type LabTeam = CombatSimulationTeamId | 'outside'

interface CombatCandidate {
  character: CharacterSheet
  token: TabletopToken
}

interface TabletopCombatBalanceLabProps {
  characters: CharacterSheet[]
  tokens: TabletopToken[]
}

function getDefaultTeam(candidate: CombatCandidate): LabTeam {
  return candidate.character.tipo === 'player' || candidate.token.tokenKind === 'player_corpo'
    ? 'a'
    : 'b'
}

function percentage(value: number) {
  return `${Math.round(value * 100)}%`
}

function teamLabel(team: LabTeam) {
  if (team === 'a') return 'A'
  if (team === 'b') return 'B'

  return 'Fora'
}

export function TabletopCombatBalanceLab({
  characters,
  tokens,
}: TabletopCombatBalanceLabProps) {
  const candidates = useMemo<CombatCandidate[]>(
    () =>
      tokens.flatMap((token) => {
        const character = characters.find((entry) => entry.id === token.characterId)

        return character ? [{ character, token }] : []
      }),
    [characters, tokens],
  )
  const [teamByTokenId, setTeamByTokenId] = useState<Record<string, LabTeam>>({})
  const [iterations, setIterations] = useState(500)
  const [result, setResult] = useState<CombatSimulationResult | null>(null)
  const [message, setMessage] = useState('Escolha as duas equipes e simule a cena atual.')

  const teamCounts = candidates.reduce(
    (counts, candidate) => {
      const team = teamByTokenId[candidate.token.id] ?? getDefaultTeam(candidate)

      if (team === 'a' || team === 'b') {
        counts[team] += 1
      }

      return counts
    },
    { a: 0, b: 0 },
  )

  function assignTeam(tokenId: string, team: LabTeam) {
    setTeamByTokenId((current) => ({ ...current, [tokenId]: team }))
    setResult(null)
  }

  function runSimulation() {
    if (teamCounts.a === 0 || teamCounts.b === 0) {
      setMessage('A simulacao precisa de pelo menos um token em cada equipe.')
      return
    }

    const nextResult = simulateCombat({
      combatants: candidates.flatMap((candidate) => {
        const team = teamByTokenId[candidate.token.id] ?? getDefaultTeam(candidate)

        return team === 'outside'
          ? []
          : [
              {
                character: candidate.character,
                id: candidate.token.id,
                name: candidate.character.nome,
                team,
              },
            ]
      }),
      iterations,
      maxRounds: 24,
      seed: Date.now(),
    })

    setResult(nextResult)
    setMessage(
      `${nextResult.iterations} duelos simulados com CA passiva, Bloqueio por Fortitude e Esquiva por Reacao.`,
    )
  }

  return (
    <div className="combat-balance-lab">
      <section className="combat-balance-lab__intro">
        <div>
          <p className="eyebrow">Combat V2</p>
          <h3>Laboratorio da cena</h3>
        </div>
        <span className="tag">{candidates.length} token(s)</span>
      </section>

      <p className="support-copy">{message}</p>

      <div className="combat-balance-lab__controls">
        <div aria-label="Iteracoes da simulacao" className="rulebook-segmented" role="group">
          {[100, 500, 1000].map((value) => (
            <button
              aria-pressed={iterations === value}
              className={iterations === value ? 'rulebook-segmented__active' : ''}
              key={value}
              onClick={() => setIterations(value)}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
        <button className="button button--primary" onClick={runSimulation} type="button">
          Simular cena
        </button>
      </div>

      <div className="combat-balance-lab__roster" aria-label="Equipes da simulacao">
        {candidates.map((candidate) => {
          const selectedTeam = teamByTokenId[candidate.token.id] ?? getDefaultTeam(candidate)

          return (
            <article className="combat-balance-lab__candidate" key={candidate.token.id}>
              <div>
                <strong>{candidate.character.nome}</strong>
                <span>
                  {candidate.character.tipo} - {candidate.character.recursos.vidaMaxima} Vida - CA{' '}
                  {candidate.character.defesa}
                </span>
              </div>
              <div className="combat-balance-lab__team-buttons">
                {(['a', 'b', 'outside'] as const).map((team) => (
                  <button
                    aria-label={`Colocar ${candidate.character.nome} na equipe ${teamLabel(team)}`}
                    aria-pressed={selectedTeam === team}
                    className={selectedTeam === team ? 'combat-balance-lab__team--active' : ''}
                    key={team}
                    onClick={() => assignTeam(candidate.token.id, team)}
                    type="button"
                  >
                    {teamLabel(team)}
                  </button>
                ))}
              </div>
            </article>
          )
        })}
      </div>

      {result ? (
        <section className="combat-balance-lab__results" aria-live="polite">
          <div className="combat-balance-lab__team-result combat-balance-lab__team-result--a">
            <span>Equipe A</span>
            <strong>{percentage(result.teams.a.winRate)}</strong>
            <small>{result.teams.a.label}</small>
            <p>
              {result.teams.a.averageDamage.toFixed(1)} dano medio -{' '}
              {result.teams.a.averageRemainingLife.toFixed(1)} Vida restante
            </p>
          </div>
          <div className="combat-balance-lab__team-result combat-balance-lab__team-result--b">
            <span>Equipe B</span>
            <strong>{percentage(result.teams.b.winRate)}</strong>
            <small>{result.teams.b.label}</small>
            <p>
              {result.teams.b.averageDamage.toFixed(1)} dano medio -{' '}
              {result.teams.b.averageRemainingLife.toFixed(1)} Vida restante
            </p>
          </div>
          <div className="combat-balance-lab__events">
            <span>{result.averageRounds.toFixed(1)} rodadas medias</span>
            <span>{percentage(result.drawRate)} empate</span>
            <span>{result.events.hits} acertos</span>
            <span>{result.events.blocks} bloqueios</span>
            <span>{result.events.dodges} esquivas</span>
            <span>{result.events.crits} criticos</span>
          </div>
        </section>
      ) : null}
    </div>
  )
}
