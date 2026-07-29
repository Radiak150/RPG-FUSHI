# FUSHI Rulebook Canon V1

Data: 2026-07-10

Este documento registra as decisoes definitivas usadas na primeira edicao dos
Livros do Jogador e do Mestre. Em caso de conflito com texto anterior, esta
decisao e a fonte mais recente ate nova aprovacao explicita do Mestre.

## Fontes editoriais

- Livro do Jogador: `src/data/rulebook/player-rulebook.json`.
- Livro do Mestre: `src/data/rulebook/master-rulebook.json`.
- Bibliografia: `src/data/rulebook/bibliography.json`.
- Fichas do compendio: workspace real em `%APPDATA%\FUSHI\workspace.json` ou
  `FUSHI_APPDATA_ROOT` ativo.

O app e os PDFs devem sair destas fontes. Nao manter uma segunda copia manual
do texto de regras dentro de componentes React.

## Separacao de segredo

- O Livro do Jogador nunca explica reencarnacao, posse, dano de alma, tabela de
  progresso por identidade, natureza real dos protagonistas, desbloqueios de
  Esporos, Poder Unido ou metaplot.
- O jogador pode conhecer Vida, FUSHI, Determinacao, os estados de zero,
  manobras, Coreografia, builds publicas e Niveis de Poder como escala de risco.
- O Livro do Mestre pode conter todos os numeros, gatilhos, tabelas e segredos.

## Dano direto

- Ataque fisico corpo a corpo: Forca + Luta.
- Ataque fisico a distancia: Agilidade + Pontaria.
- Outro Atributo ou Pericia cria vantagem, desvantagem, posicao, cobertura,
  condicao ou oportunidade. Nao causa dano direto sem Habilidade, Ritual, item
  ou perigo ambiental que declare dano.

## Coreografia

- E regra central, nao opcional.
- Cada d20 sacrificado no acerto adiciona um dado de dano da arma/efeito.
- Se os sacrificios forem menores que o Atributo, rolar os d20 restantes e
  pegar o maior.
- Se forem iguais ou maiores, rolar a quantidade sacrificada e pegar o pior.

## Oportunidade e manada

- Dois ou mais oponentes em lados diferentes deixam um alvo Cercado e concedem
  +1d20 em ataques corpo a corpo contra ele.
- Sair sem Desengajar permite um ataque de oportunidade de um oponente com
  Reacao disponivel.
- Em duelo 1 contra 1 nao existe oportunidade padrao, salvo Passiva, Habilidade
  ou provocacao explicita.
- Desengajar usa Acao Curta.

## Estados de zero

- Vida 0: desmaio completo. O personagem nao fala nem age.
- FUSHI 0: paralisia e incapacidade de agir; ainda percebe, pensa e fala.
- Determinacao 0: perda de controle; o Mestre conduz temporariamente.

### Estabilizacao operacional V1

- No inicio de cada turno do caido, rolar 1d20 puro.
- 10+: estabiliza em 0 Vida.
- 2 a 9: 1 falha.
- 1 natural: 2 falhas.
- 20 natural: recupera 1 Vida.
- 3 falhas: morte e abertura imediata do protocolo secreto.
- Primeiros socorros: Intelecto + Medicina DT 20, Acao Principal; sucesso
  estabiliza, falha nao adiciona falha de morte.
- Dano em 0 Vida adiciona 1 falha; critico adiciona 2.

Esta matematica esta em teste de mesa, mas e a regra operacional ate revisao.

## Reencarnacao

- Apos a terceira falha, a busca padrao segue para outro corpo.
- Ordem: Ficha Avancada mais proxima, Ficha Basica mais proxima, Animal
  silvestre como fallback.
- A opcao antiga de reacender o proprio corpo fica suspensa. So pode ocorrer por
  evento, item ou Ritual aprovado explicitamente.
- O restante segue o protocolo de tres pulsos, disputa de posse, resgate e dano
  critico de alma.

## Builds por itens

- Nao existem classes rigidas. Tank, Assassino, Suporte, Lutador, Atirador e
  Ocultista sao direcoes de build.
- O FUSHI integra a identidade mecanica do item ao individuo.
- O objeto nao desaparece e pode ser integrado por varias identidades.
- Cada identidade integra o mesmo item uma unica vez.
- Beneficio e custo sao permanentes e nao podem ser retirados por troca de
  loadout.
- O vinculo acompanha a identidade, inclusive depois de troca de corpo.
- Catalogo, quantidade por Nivel de Poder e limiares de promocao continuam em
  construcao e devem aparecer marcados como tal.

## Niveis de Poder publicos

- Jogadores podem conhecer Basico, Avancado, Ascensao e Cataclisma como escala
  de perigo.
- Faixas completas de Vida, FUSHI, CA e progressao ficam no Livro do Mestre.
- Itens e builds influenciam a escala, mas a formula final ainda esta em
  construcao.

## Bloqueio

Esta secao V1 foi substituida por `FUSHI_COMBAT_V2.md` em 2026-07-11.

- CA continua sendo a defesa passiva do alvo.
- Bloqueio e uma Reacao e reduz dano pelo bonus de Fortitude: 0, 5, 10 ou 15.
- O teto normal de Bloqueio e 15; item so pode ultrapassar com regra rara
  explicita.
- Correcao de 2026-07-13: Esquiva e uma Reacao de valor fixo, sem dados:
  `CA passiva atual + AGI + bonus integral de Reflexos`. A CA atual ja contem
  Base do Nivel, AGI, Protecao e efeitos declarados. Depois de alcancar a CA
  passiva, o ataque precisa alcancar tambem a Esquiva para causar dano.
- Reflexos entra como 0/5/10/15. Basico e Avancado chegam a +10; +15 fica para
  Ascensao/Cataclisma. Nao existe conversao 0/2/4/6.
- Critico acontece quando o dado escolhido do ataque e 20 natural e dobra
  apenas os dados de dano.
- Item e build aprofundam uma base funcional; eles nao existem para compensar
  defesa matematica quebrada.

## Primeiras Habilidades do treinamento

Correcao canonica do Mestre em 2026-07-13. Todas usam FUSHI; nenhuma usa
Determinacao. Custos, DTs, Acoes e limites finais continuam pendentes de
balanceamento e nao devem ser inventados antes da aprovacao.

- Kairos, `Sinos - Barulho Torturante`: area de ate 5 m, entra na
  alma/identidade, atrasa em um turno os inimigos afetados e gera Desengajar.
- Davi, `Ciencias - Analise Cirurgica`: le um alvo especifico, encontra um
  ponto fraco que somente Davi compreende e dobra o proximo dano de Davi contra
  esse alvo no turno seguinte.
- Connor, `Cego - Percepcao Sensorial`: percebe posicao e conversas de todas as
  pessoas na cena/mapa atual enquanto a Habilidade estiver ativa.
- Kael, `Ladrao - Pata Mansa`: em corpo a corpo, analisa o que o alvo carrega e
  pode roubar furtivamente ate objeto empunhado; se a ativacao falhar, Kael
  descobre que nao consegue executar o roubo sem realizar a tentativa.
- Grim, `Curandeiro - Vida Sugada`: a media distancia, retira Vida de um alvo e
  transfere imediatamente o mesmo valor para outro alvo, inclusive Grim; nao
  pode guardar a Vida.
- Fragmentado esta sem consciencias no corpo e nao recebe recompensa nesta
  etapa.
