# Alpha84 - Proximas Sessoes Board

Data: 2026-07-10

Objetivo: organizar o que precisa ficar pronto para as proximas mesas sem tentar
fechar todo o RPG de uma vez. Este board deve guiar as perguntas para o mestre:
o que existe hoje, o que incomoda, uma sugestao conservadora, aprovacao e teste.

## Regra de trabalho

1. Nao implementar sistema grande sem antes aprovar o comportamento de mesa.
2. Priorizar o que pode aparecer nas proximas sessoes.
3. Separar regra publica de jogador, regra secreta de mestre e lore oculta.
4. Toda regra nova precisa ter: gatilho, custo, efeito, limite, consequencia e teste.
5. Toda melhoria visual/audio/video precisa ter fallback leve e nao pode quebrar multiplayer.

## Prioridade imediata

| Ordem | Frente | Status | Por que importa agora | Primeiro passo |
| ---: | --- | --- | --- | --- |
| 1 | Livro do Jogador - combate publico | OK | Jogadores precisam saber o que podem fazer sem assumir regra errada. | Usar no app/PDF e coletar apenas duvidas reais de playtest. |
| 2 | Kit secreto de morte e renascimento | FOCO | Fragmentado/Davi quase morreu na S2; isso nao pode pegar a mesa sem preparo. | Runbook numerico esta no Livro do Mestre; produzir imagem, interludio, puzzle e operacao audiovisual. |
| 3 | Combate e balanceamento | FOCO | Bloqueio parece forte demais e as opcoes taticas ainda nao estao claras. | Auditar Bloqueio e criar 2 variantes para o mestre aprovar/testar. |
| 4 | Hubs de mesa | FOCO | Na narracao, o mestre precisa achar mapa, livro, MSC, ficha e interludio rapido. | Mapear botoes/atalhos usados em sessao e separar jogar de editar. |
| 5 | MSC / audio | FOCO | Audio precisa ser encontrado por emocao/cena sem travar a mesa. | Criar taxonomia antes de adicionar mais sons. |
| 6 | Conteudo da Sessao 03 | FOCO | A proxima sessao ja tem ganchos claros na Vila. | Preparar Kael, Fragmentado ferido, Vila reagindo, Orian/Cartoteca e Nilo/Riacho se puxarem. |

## Livro do Jogador - escopo publico

Pode mostrar para jogadores:

- turno e economia de acoes;
- movimento, alcance, cobertura e terreno;
- ataque, dano e coreografia de luta;
- Bloqueio, Esquiva e Contra-ataque;
- agarrar, empurrar, puxar, derrubar, ajudar, preparar e recuar;
- condicoes visiveis;
- exemplos taticos sem revelar lore.

Nao mostrar ate o mestre revelar:

- XP por identidade e tabela completa de progressao;
- reencarnacao, posse de corpo e dano de alma;
- natureza real dos protagonistas;
- Ryoku, Vhazaryon, Cataclismas e metaplot;
- Ritual do Silencio;
- regras ocultas de FUSHI e simulacao do mundo.

## Kit secreto de morte e renascimento

Precisa existir antes de qualquer combate mais perigoso:

- quando aciona quase morte;
- quando aciona morte real;
- imagem/interludio de transicao;
- 3 pulsos de sobrevivencia;
- corpos proximos e ordem de tentativa;
- disputa de posse;
- fallback animal;
- consequencia mecanica;
- o que os outros fragmentos percebem;
- o que fica secreto para os jogadores.

Pergunta principal para aprovar:

> Como narrar a primeira morte real mostrando apenas a experiencia confusa do personagem, sem revelar a regra de renascimento?

Sugestao inicial:

- Mostrar a experiencia confusa do personagem.
- O jogador sente os pulsos e escolhe ancoras.
- O mestre resolve a tabela secreta.
- Depois da cena, revelar apenas as consequencias que o personagem percebeu.

## Combate e balanceamento

Problemas atuais:

- Bloqueio pode estar forte demais porque reduz `floor(CA_base / 2)`.
- Jogadores nao tem lista clara de manobras.
- Mestre improvisa agarrar, puxar, empurrar, ajudar e terreno.
- Builds ainda nao tem norte suficiente.

Pergunta para aprovar:

> Voce prefere nerfar Bloqueio agora ou testar primeiro com exemplos e limites?

Sugestao inicial:

- Nao nerfar no escuro.
- Criar tres exemplos de combate: lobo simples, humano treinado e inimigo forte.
- Comparar Bloqueio atual com 2 variantes.
- So mudar a regra depois de ver se o problema e numero, falta de limite ou falta de contra-jogo.

## Hubs de mesa

Problema atual:

- Livro, MSC, biblioteca, MUN, mapa, interludio, ficha e editor disputam atencao.
- Durante narracao, o mestre precisa de fluxo rapido, nao painel tecnico.

Pergunta para aprovar:

> Quais botoes voce usa toda sessao e quais so deveriam aparecer quando voce esta preparando conteudo?

Sugestao inicial:

- Fluxo Jogar: mapa ativo, NPCs da cena, livro publico, livro mestre, MSC, interludio, combate.
- Fluxo Preparar: biblioteca, editor de mapa, packs, organizacao de assets, configuracoes.

## MSC / audio

Problema atual:

- Fica dificil saber onde esta cada musica/som.
- Adicionar audio sem organizacao vai piorar isso.

Taxonomia sugerida:

- Cena: exploracao, combate, tensao, descanso, misterio, boss.
- Lugar: Planicie, Vila, Riacho, Floresta, Montanha, Vulcao, Ruinas, Gelo, Veu.
- Personagem: temas dos protagonistas e NPCs centrais.
- Evento: quase morte, morte, renascimento, ritual, dominio, cataclisma.
- Favoritos da sessao: lista curta para a mesa atual.

## Proxima conversa de implementacao

Comecar por um destes pacotes, um por vez:

1. `Livro do Jogador - combate`: mais util para jogadores e mais seguro antes de revelar qualquer sistema oculto.
2. `Kit morte/renascimento`: secreto do mestre, sempre oculto dos jogadores para evitar metagame.
3. `Hubs de mesa`: melhora a experiencia do mestre durante a narracao.
4. `MSC`: prepara audio sem bagunca.

Minha recomendacao atual: fazer primeiro o Livro do Jogador e, em seguida, o kit
secreto de morte/renascimento. O Livro resolve a confusao publica de combate; o
kit secreto protege a imersao quando a morte acontecer sem entregar regra de
renascimento para metagame.

## Estado depois da entrega dos livros

- Livro publico: entregue no app e PDF, sem reencarnacao ou progressao oculta.
- Escudo do Mestre: entregue no app e PDF, incluindo 0 Vida, estabilizacao,
  reencarnacao, progressao, bosses e 55 fichas do workspace real.
- Proximo pacote recomendado: assets e fluxo audiovisual do kit secreto de
  morte, sem alterar ainda o balanceamento do Bloqueio.

## Checkpoint Alpha.88 - estados visuais e proximas builds (2026-07-28)

Entregue nesta passada:

- estados publicos no token agora aparecem somente como icones maiores e pilhas;
- hover no token abre o conjunto de icones;
- hover em um icone abre detalhe lateral sem cortar na janela;
- sair da hierarquia fecha o popover sem deixar camada capturando clique;
- smoke visual oficial gera `tmp/smoke-token-status-visuals.png`;
- build, lint, smoke de estados, UI, multiplayer, assets e release empacotada aprovados;
- `FUSHI_App_Readiness_Alpha84.xlsx` atualizado sem transformar alertas de NPC em OK.

Plano de acao basico:

1. Alpha.89 - playtest fisico de estados: dois clientes, privacidade Mestre/Jogador,
   hover, pilhas, efeitos publicos e persistencia ao trocar de mapa.
2. Alpha.90 - estabilidade de mesa: reproduzir tela branca/troca de mapa e
   validar recuperacao no release antes de adicionar VFX novos.
3. Alpha.91 - combate: revisar Dados de Combate, alcance perto/longe e ficha
   canonica em uma sessao curta; qualquer ajuste numerico depende de evidencia.
4. Alpha.92 - NPCs: fechar as lacunas de Falha/Reacao/Teste/Dano por NPC usando
   somente lore canonica, sem criar placeholder ou falso OK.
5. Depois dos gates: VFX e animacoes especificas de habilidades, sempre com
   fallback low/balanced e smoke Mestre > Jogador/Jogador > Mestre.
