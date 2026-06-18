import { useState, type ReactNode } from 'react'
import { BookSectionNav } from '../components/product/BookSectionNav'
import { Panel } from '../components/ui/Panel'
import { StatusPill } from '../components/ui/StatusPill'
import { bookSectionEntries } from '../data/mock/product'
import type { Tone } from '../data/types'
import { useMasterData } from '../hooks/useMasterData'
import { useProductPreferences } from '../hooks/useProductPreferences'
import { useViewMode } from '../hooks/useViewMode'
import { getCharactersByIds } from '../lib/selectors'

interface BookCardProps {
  eyebrow?: string
  title: string
  status?: string
  tone?: Tone
  tags?: string[]
  children: ReactNode
}

const GM_ONLY_SECTIONS = new Set([
  'sessao-1',
  'xp',
  'waves',
  'mun-base',
  'segredos-fushi',
])

const sessionFlow = [
  {
    id: 'caverna',
    title: 'Caverna do Primeiro Corpo',
    detail: 'Nascimento, estranhamento, corpo compartilhado e primeira escolha real.',
  },
  {
    id: 'lobos',
    title: 'Clareira dos Lobos',
    detail: 'Tutorial de movimento, ataque, defesa, dano, queda a 0 HP e fuga.',
  },
  {
    id: 'vila',
    title: 'Vila da Planicie',
    detail: 'Orian pode entregar o mapa; Elara acolhe; alguem desconfia.',
  },
  {
    id: 'fecho',
    title: 'Treino ou Riacho Claro',
    detail: 'Fechar em mecanica, memoria de Liora/Nilo ou gancho de identidade.',
  },
]

const sessionChecks = [
  'Host 3030 ativo antes de abrir tunnel multiplayer.',
  'Jogador entra, recebe mapa, move token e rola dado publico.',
  'Mestre troca mapa e dispara interludio sem tela preta.',
  'Se lagar, parar assets pesados e validar apenas movimento, rolagem e mapa.',
]

const xpMarks = [
  {
    id: 'risco',
    label: 'Risco 1/2',
    detail: 'Cena real de perigo de vida ou quase morte. Conta ate 2 vezes por ato.',
  },
  {
    id: 'vontade',
    label: 'Vontade',
    detail: 'Escolha que revela identidade, desejo ou limite moral do fragmento.',
  },
  {
    id: 'vinculo',
    label: 'Vinculo',
    detail: 'Criar, fortalecer, romper ou sacrificar relacao importante.',
  },
  {
    id: 'fushi',
    label: 'FUSHI',
    detail: 'Entender uma regra real do FUSHI, da ilha ou da propria identidade.',
  },
  {
    id: 'custo',
    label: 'Custo 1/2',
    detail: 'Pagar preco real por escolha propria. Conta ate 2 vezes por ato.',
  },
  {
    id: 'treino',
    label: 'Treino',
    detail: 'Desafio de treino com local, NPC, corpo, base ou disciplina coerente.',
  },
  {
    id: 'ritual',
    label: 'Ritual',
    detail: 'Concluir ritual com custo, risco ou consequencia observavel.',
  },
  {
    id: 'reencarnacao',
    label: 'Reencarnacao',
    detail: 'Morrer, voltar e carregar consequencia real de memoria/corpo.',
  },
  {
    id: 'item',
    label: 'Item marco',
    detail: 'Encontrar ou ativar item que muda build, identidade ou leitura do mundo.',
  },
]

const levelBands = [
  ['Ato 1', 'Nivel 1 -> 9', '8 ganhos', 'Inicial para Basico'],
  ['Ato 2', 'Nivel 9 -> 17', '8 ganhos', 'Avancado'],
  ['Ato 3', 'Nivel 17 -> 20', '3 ganhos', 'Ascensao curta'],
  ['Ato 4', 'Nivel 20 -> 30', '10 ganhos', 'Ascensao alta'],
  ['Ato 5', 'Nivel 30 -> 37', '7 ganhos', 'Cataclisma'],
]

const wolfWaves = [
  ['1', 'Segura', '2x Lobo Cinzento', 'Bandagem de Emergencia'],
  ['2-4', 'Segura', '2x Lobo Cinzento', 'Sem item'],
  ['5', 'Padrao', '3x Lobo Cinzento', 'Faca simples 1d6 ou Dente do Primeiro Lobo'],
  ['6-9', 'Segura', '2x Lobo Cinzento', 'Sem item'],
  ['10', 'Forte', '2x Lobo Cinzento + 1x Lobo Marcado', 'Nucleo Instavel de Lobo'],
  ['11+', 'Ciclo', 'Repete 1-10 mantendo numero real', 'Item so em marco 5/10 aprovado'],
]

const wolfRules = [
  'Entre marcos nao entregar drop automatico.',
  'Se o grupo cair cedo, corpo volta a 1 HP e a cena vira tutorial de falha.',
  'Ao fim de cada wave o grupo pode sair com o que ganhou.',
  'Fuga ruim ou morte feia pode cortar 50% das recompensas da serie.',
]

const baseUpgrades = [
  ['1', 'Reforma Inicial', 'Libera trilha local da base.'],
  ['2', 'Dormitorio Compartilhado', 'Descanso e recuperacao de condicao leve.'],
  ['3', 'Agua e Cozinha', 'Reduz penalidade de fome/sede.'],
  ['4', 'Deposito de Recursos', 'Inventario de grupo e campanha.'],
  ['5', 'Oficina Improvisada', 'Craft basico, armadilhas e reparo.'],
  ['6', 'Enfermaria', 'Trata ferimento grave uma vez por descanso.'],
  ['7', 'Biblioteca de Memoria', 'Transforma descoberta em preparo.'],
  ['8', 'Sala de Musica', 'Apoia moral, trauma e vinculo.'],
  ['9', 'Defesas Externas', 'Reduz ataque surpresa na base.'],
  ['10', 'Nucleo FUSHI Controlado', 'Rituais seguros e estudo de FUSHI.'],
  ['11', 'Sala MUN', 'Liga base, rotas, relogio e checkpoints.'],
]

const fushiUnlockPaths = [
  {
    title: 'Treino brutal por impacto',
    detail:
      'Usuario com FUSHI imbuido causa 10 de dano no peito com intencao clara de desbloqueio. A dificuldade cai a cada tentativa, mas FUSHI/Determinacao drenam e falha critica pode matar por desidratacao de FUSHI.',
  },
  {
    title: 'Flow proximo da morte',
    detail:
      'Treino ou feito extremo ligado a identidade do personagem. Tres chances para obter um critico puro em 1d20.',
  },
  {
    title: 'Sete pontos do FUSHI Puro',
    detail:
      'Terra, Agua, Fogo, Coracao, Som, Luz e Pensamento. Cada ponto exige libertacao narrativa e teste puro sem falha critica.',
  },
  {
    title: 'FUSHI Escuro',
    detail:
      'Pacto interno de vontade absoluta. Nao exige teste, mas cobra condicao, contra-condicao e aceitacao do pior custo do mundo.',
  },
]

const bibliography = [
  'FUSHI Core System e Combat/Progression.',
  'FUSHI Mechanics Gap Audit - 2026-05-27.',
  'FUSHI Mobs And Waves V1.',
  'FUSHI Items And Base V1.',
  'Preparacao da primeira sessao - 2026-05-30.',
]

function BookCard({
  eyebrow,
  title,
  status,
  tone = 'steady',
  tags = [],
  children,
}: BookCardProps) {
  return (
    <article className={`book-card book-card--${tone}`}>
      <div className="book-card__top">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h3>{title}</h3>
        </div>
        {status ? <StatusPill label={status} tone={tone} /> : null}
      </div>
      <div className="book-card__body">{children}</div>
      {tags.length > 0 ? (
        <div className="tag-row">
          {tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  )
}

function BookTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: string[][]
}) {
  return (
    <div className="book-table-scroll">
      <table className="book-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join(':')}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FlowList({
  items,
}: {
  items: Array<{ id: string; title: string; detail: string }>
}) {
  return (
    <div className="book-flow">
      {items.map((item, index) => (
        <article className="book-flow__item" key={item.id}>
          <span className="book-flow__marker">{index + 1}</span>
          <div>
            <h3>{item.title}</h3>
            <p className="support-copy">{item.detail}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

export function BookPage() {
  const { data } = useMasterData()
  const { showModuleDescriptions } = useProductPreferences()
  const { viewMode } = useViewMode()
  const [selectedSectionId, setSelectedSectionId] = useState('visao-geral')

  if (!data) {
    return null
  }

  const isGm = viewMode === 'gm'
  const visibleSections = isGm
    ? bookSectionEntries
    : bookSectionEntries.filter((section) => !GM_ONLY_SECTIONS.has(section.id))
  const selectedSection =
    visibleSections.find((section) => section.id === selectedSectionId) ??
    visibleSections[0]
  const protagonistSamples = getCharactersByIds(
    data,
    data.campaign.destaquePersonagensIds,
  ).filter((character) => character.tipo === 'player')
  const mechanicalItems = data.system.itemLibrary.filter(
    (item) => !item.summary.toLowerCase().includes('placeholder'),
  )

  return (
    <div className="page-stack book-page">
      <div className="book-layout">
        <Panel
          aside={
            <StatusPill
              label={isGm ? 'Mestre' : 'Jogador'}
              tone={isGm ? 'watch' : 'steady'}
            />
          }
          className="book-index-panel"
          eyebrow="Livro"
          title="Indice oficial"
          subtitle="Consulta rapida de sistema, sessao, progresso e referencias consolidadas."
        >
          <BookSectionNav
            activeSectionId={selectedSection.id}
            items={visibleSections}
            onSelect={setSelectedSectionId}
            showDescriptions={showModuleDescriptions}
          />
        </Panel>

        <Panel
          aside={
            GM_ONLY_SECTIONS.has(selectedSection.id) ? (
              <StatusPill label="Mestre" tone="watch" />
            ) : null
          }
          className="book-content-panel"
          eyebrow="FUSHI Tabletop"
          title={selectedSection.label}
          subtitle={selectedSection.description}
        >
          {selectedSection.id === 'visao-geral' ? (
            <div className="book-spread">
              <BookCard
                eyebrow="Campanha"
                status={data.dashboard.campaignStatus}
                tags={[data.dashboard.currentSession, data.meta.sourceLabel]}
                title={data.dashboard.campaignName}
              >
                <p className="support-copy">{data.dashboard.overview}</p>
              </BookCard>
              <BookCard
                eyebrow="Leitura de mesa"
                status="Agora"
                tags={['sem railroad', 'teste de app', 'tutorial']}
                title="Primeira sessao em 1 hora"
              >
                <p className="support-copy">
                  O objetivo nao e mostrar a ilha inteira. Prove que mapa, ficha,
                  token, dado, interludio e primeiro conflito funcionam sem travar a
                  narrativa.
                </p>
              </BookCard>
              <div className="book-reference-grid">
                {data.dashboard.manualAlerts.map((alert) => (
                  <BookCard
                    eyebrow="Alerta"
                    key={alert.id}
                    status={alert.title}
                    title={alert.title}
                    tone={alert.tone}
                  >
                    <p className="support-copy">{alert.detail}</p>
                  </BookCard>
                ))}
              </div>
            </div>
          ) : null}

          {selectedSection.id === 'sessao-1' ? (
            <div className="book-spread">
              <BookCard
                eyebrow="Fluxo recomendado"
                status="Preparado"
                tags={['caverna', 'lobos', 'vila', 'treino/ riacho']}
                title="Roteiro sem prender os jogadores"
              >
                <FlowList items={sessionFlow} />
              </BookCard>
              <BookCard
                eyebrow="Checklist tecnico"
                status="Critico"
                title="Antes de chamar jogadores"
                tone="critical"
              >
                <ul className="bullet-list">
                  {sessionChecks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </BookCard>
              <BookCard
                eyebrow="O que deixar fora"
                status="Controle"
                title="Nao explodir escopo"
                tone="watch"
              >
                <ul className="bullet-list">
                  <li>Cataclismas completos, guardioes e Arvore da Vida ficam depois.</li>
                  <li>60 pontos do MUN nao precisam estar narrativamente ativos agora.</li>
                  <li>Objetos 3D decorativos complexos so depois da mesa estavel.</li>
                </ul>
              </BookCard>
            </div>
          ) : null}

          {selectedSection.id === 'combate' ? (
            <div className="book-spread">
              <div className="book-reference-grid">
                {data.system.combatGuidelines.map((rule) => (
                  <BookCard
                    eyebrow="Combate"
                    key={rule.id}
                    status="Regra"
                    title={rule.title}
                  >
                    <p className="support-copy">{rule.summary}</p>
                    <ul className="bullet-list">
                      {rule.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </BookCard>
                ))}
              </div>
              <BookCard
                eyebrow="Ficha universal"
                status="Base"
                tags={['players', 'npcs', 'mobs']}
                title="Mesma estrutura, permissao diferente"
              >
                <ul className="bullet-list">
                  {data.system.universalSheetNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </BookCard>
              <BookCard eyebrow="Dificuldade" status="Escala" title="Como pesar encontro">
                <div className="cards-grid cards-grid--dense">
                  {data.system.difficultyScale.map((difficulty) => (
                    <article className="book-mini-card" key={difficulty.id}>
                      <h3>{difficulty.label}</h3>
                      <p className="support-copy">{difficulty.summary}</p>
                    </article>
                  ))}
                </div>
              </BookCard>
            </div>
          ) : null}

          {selectedSection.id === 'xp' ? (
            <div className="book-spread">
              <BookCard
                eyebrow="XP / Atos"
                status="Tabela"
                title="Faixas de nivel por ato"
              >
                <BookTable
                  columns={['Ato', 'Faixa', 'Ganhos', 'Poder']}
                  rows={levelBands}
                />
              </BookCard>
              <BookCard
                eyebrow="Marcacoes"
                status="Mestre"
                title="Quando marcar caixa"
              >
                <div className="book-reference-grid book-reference-grid--compact">
                  {xpMarks.map((mark) => (
                    <article className="book-mini-card" key={mark.id}>
                      <h3>{mark.label}</h3>
                      <p className="support-copy">{mark.detail}</p>
                    </article>
                  ))}
                </div>
              </BookCard>
              <BookCard
                eyebrow="Aplicacao"
                status="Regra"
                tags={['cena real', 'sem grind', 'sem anunciar na hora']}
                title="Progresso vem de identidade"
              >
                <p className="support-copy">
                  Matar muitos inimigos nao e o eixo principal. Ganho pode entrar em
                  descanso, reflexao, ritual ou fim de sessao quando a cena merecer.
                </p>
              </BookCard>
            </div>
          ) : null}

          {selectedSection.id === 'waves' ? (
            <div className="book-spread">
              <BookCard
                eyebrow="Wave Lobos - Planicie"
                status="Sessao 1"
                title="Clareira dos Lobos"
              >
                <BookTable
                  columns={['Wave', 'Tipo', 'Encontro', 'Recompensa']}
                  rows={wolfWaves}
                />
              </BookCard>
              <BookCard
                eyebrow="Regras de marco"
                status="Sem drop aleatorio"
                title="Item so quando tiver funcao"
                tone="watch"
              >
                <ul className="bullet-list">
                  {wolfRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </BookCard>
              <BookCard eyebrow="Mobs" status="Criaturas" title="Fichas iniciais">
                <div className="book-reference-grid book-reference-grid--compact">
                  {data.system.tutorialEncounters.map((encounter) => (
                    <article className="book-mini-card" key={encounter.id}>
                      <h3>{encounter.name}</h3>
                      <p className="support-copy">{encounter.summary}</p>
                      <div className="tag-row">
                        <span className="tag">{encounter.role}</span>
                        <span className="tag">Ameaca {encounter.threat}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </BookCard>
            </div>
          ) : null}

          {selectedSection.id === 'itens' ? (
            <div className="book-spread">
              <BookCard
                eyebrow="Itemizacao"
                status="Regra"
                title="Item precisa ter funcao mecanica"
              >
                <ul className="bullet-list">
                  <li>Todo item bom diz build, nivel de poder, efeito, custo e limite.</li>
                  <li>Nenhum item deve aumentar dano, CA, mobilidade e recurso ao mesmo tempo.</li>
                  <li>Consumivel tem uso claro; item marco muda build, identidade ou leitura do mundo.</li>
                </ul>
              </BookCard>
              <div className="book-reference-grid">
                {mechanicalItems.map((item) => (
                  <BookCard
                    eyebrow={item.category}
                    key={item.id}
                    status="Item"
                    tags={item.futureHooks}
                    title={item.name}
                  >
                    <p className="support-copy">{item.summary}</p>
                  </BookCard>
                ))}
              </div>
            </div>
          ) : null}

          {selectedSection.id === 'fushi' ? (
            <div className="book-spread">
              <div className="book-reference-grid">
                {data.system.states.map((state) => (
                  <BookCard
                    eyebrow="Estado"
                    key={state.id}
                    status={state.name}
                    tags={state.markers}
                    title={state.name}
                    tone={state.tone}
                  >
                    <p className="support-copy">{state.summary}</p>
                    <p className="support-copy">Riscos: {state.risks.join(', ')}.</p>
                  </BookCard>
                ))}
              </div>
              <BookCard eyebrow="Termos" status="Glossario" title="Conceitos base">
                <div className="book-reference-grid book-reference-grid--compact">
                  {data.system.terms.map((term) => (
                    <article className="book-mini-card" key={term.id}>
                      <h3>{term.term}</h3>
                      <p className="support-copy">{term.summary}</p>
                    </article>
                  ))}
                </div>
              </BookCard>
            </div>
          ) : null}

          {selectedSection.id === 'segredos-fushi' ? (
            <div className="book-spread">
              <BookCard
                eyebrow="Mestre"
                status="Segredo"
                title="Desbloqueio dos Esporos de FUSHI"
                tone="critical"
              >
                <div className="book-reference-grid">
                  {fushiUnlockPaths.map((path) => (
                    <article className="book-mini-card" key={path.title}>
                      <h3>{path.title}</h3>
                      <p className="support-copy">{path.detail}</p>
                    </article>
                  ))}
                </div>
              </BookCard>
              <BookCard
                eyebrow="Poder Unido"
                status="Bloqueado"
                title="Ver ficha de outro fragmento"
                tone="watch"
              >
                <p className="support-copy">
                  Por enquanto jogadores nao devem ver Identidade de outros corpos.
                  Quando Poder Unido existir, liberar leitura controlada da ficha do
                  fragmento que esta no mesmo corpo.
                </p>
              </BookCard>
            </div>
          ) : null}

          {selectedSection.id === 'mun-base' ? (
            <div className="book-spread">
              <BookCard
                eyebrow="MUN"
                status="Base"
                tags={['8 bases', '68 pontos', 'sem rota forcada']}
                title="Bases sao pontos avulsos por bioma"
              >
                <p className="support-copy">
                  Cada base pertence a um bioma. Nao precisa ligar com rota visual
                  direta: o tempo segue 1h por bioma atravessado, somando entrada,
                  saida e biomas intermediarios.
                </p>
              </BookCard>
              <BookCard
                eyebrow="Upgrades"
                status="11 por base"
                title="Espinha inicial de qualquer base"
              >
                <BookTable columns={['#', 'Upgrade', 'Efeito']} rows={baseUpgrades} />
              </BookCard>
            </div>
          ) : null}

          {selectedSection.id === 'faccoes-lore' ? (
            <div className="book-spread">
              <BookCard eyebrow="Protagonistas" status="Campanha" title="Fragmentos">
                <div className="book-reference-grid book-reference-grid--compact">
                  {protagonistSamples.map((character) => (
                    <article className="book-mini-card" key={character.id}>
                      <h3>{character.nome}</h3>
                      <p className="support-copy">
                        Ficha player ligada a campanha atual. Use para lembrar nome,
                        origem e corpo em cena.
                      </p>
                    </article>
                  ))}
                </div>
              </BookCard>
              <div className="book-reference-grid">
                {data.factions.items.map((faction) => (
                  <BookCard
                    eyebrow="Faccao"
                    key={faction.id}
                    status={faction.status}
                    tags={[faction.base, faction.localAtual]}
                    title={faction.nome}
                    tone={faction.tone}
                  >
                    <p className="support-copy">{faction.resumo}</p>
                  </BookCard>
                ))}
              </div>
            </div>
          ) : null}

          {selectedSection.id === 'bibliografia' ? (
            <div className="book-spread">
              <BookCard
                eyebrow="Bibliografia interna"
                status="Consolidado"
                title="Documentos usados como base"
              >
                <ul className="bullet-list">
                  {bibliography.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </BookCard>
              <BookCard
                eyebrow="Nota de uso"
                status="Pratico"
                title="Como tratar o Livro na mesa"
              >
                <p className="support-copy">
                  O Livro e a versao consultavel do que ja foi decidido. Se uma regra
                  for ajustada durante a sessao, trate o ajuste como regra de mesa e
                  depois consolide aqui.
                </p>
              </BookCard>
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  )
}
