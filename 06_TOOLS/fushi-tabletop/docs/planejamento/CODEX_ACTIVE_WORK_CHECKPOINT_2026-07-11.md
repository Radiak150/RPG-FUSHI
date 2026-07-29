# Checkpoint de trabalho - 2026-07-11

## Frente concluida

Combat V2 e fechamento da release alpha.84.

Estado final confirmado em 2026-07-12:

- Combat V2 implementado na ficha e turnos; o laboratorio visual foi removido
  da Mesa e a simulacao voltou a ser exclusivamente offline.
- Workspace real migrado com backup e dry-run idempotente.
- `smoke:combat-v2` criado e aprovado com 56 fichas e 5 cenarios.
- Scripts de lore, auditoria e matematica alinhados a Bloqueio por Fortitude e
  Esquiva ativa; `math:npc:plan` retorna 0 alteracoes.
- Livros do Jogador e do Mestre regenerados pelo ultimo `books:build`.
- Build, lint, UI, multiplayer, livros, assets e release aprovados.
- Deep smoke completo aprovado nos 11 cenarios de jogo; performance estavel em
  low/balanced/ultra, Base 8/8 e auditoria npm sem vulnerabilidades.
- Simulador offline e seeds de instalacao limpa corrigidos para lobos com 8/14
  Vida.
- Auditoria atual: 55 fichas e 5 cenarios; 30 fichas ainda usam ataque de
  referencia, e Veyra nao alcanca a CA 24 de Liryssa com o ataque-base atual.
- Promocao estrutural concluida. Os dois alertas acima permanecem como
  conteudo/balanceamento para playtest, sem ajuste automatico de ficha.

## Frente prioritaria entregue durante a interrupcao

Arco de Treinamento da Vila integrado ao MUN e a Mesa, com painel publico de
progresso para jogadores e controles/DTs exclusivos do Mestre.

## Atualizacao EVE - 2026-07-17

- Hub `EVE` criado como gerenciador canonico de eventos temporarios da Mesa.
- Eventos ativos podem coexistir e sao encerrados de forma independente.
- `Treino Inicial` ganhou ativacao/desativacao explicita; desativar fecha a
  camada Mestre/Jogador e preserva Marcas, Contratempos e progresso.
- O botao ativo do Campo de Treinamento agora abre o EVE, sem reativar mapa ou
  reiniciar o arco.
- `Sorteio Raridade Build` transmite uma apresentacao sincronizada e nao altera
  ficha; o vinculo real continua exclusivo do BUI.
- O payload publico remove `restoreMapId` e `lastRoll`.
- `smoke:events`, `smoke:training`, `smoke:training:ui` e
  `smoke:multiplayer` sao gates obrigatorios desta frente.
- Protocolo para novos eventos: `docs/fushi-system/FUSHI_EVENT_SYSTEM_V1.md`.
- Builds permanecem estabilizadas tecnicamente e aguardam teste real; nenhum
  valor, lore ou habilidade foi alterado nesta frente.

## Atualizacao de sessao e apresentacao - 2026-07-18

- Raridade revelada fecha com clique em qualquer ponto; o descarte e local e
  nao altera ficha, BUI ou resultado do EVE.
- BUI e EVE ganharam icones proprios no HUD.
- Sair da Mesa passou a usar navegacao interna, preservando o Provider e o
  socket multiplayer.
- Jogador aceito ve `Sessao ativa` e `Voltar a mesa` sem novo pedido ao Mestre.
- O servidor mantem `accepted` quando o mesmo perfil autentica novamente no
  mesmo socket; fechar app ou expulsar continua encerrando a conexao.
- A camada de mapa preparado preserva o bloqueio visual do tabuleiro, mas o
  menu superior permanece acessivel para Fluxo, Livro e Multiplayer.
- Gates adicionados: smoke visual Mestre/Jogador, reautenticacao no servidor e
  segundo Electron real no smoke da release.

## Fechamento EVE, Build Absorvida e recompensas - 2026-07-18

- A apresentacao de raridade agora expira em 18 segundos e nao reaparece ao
  voltar para a Mesa. O evento pode continuar ativo para novos sorteios.
- O EVE mantem backlog privado dos 100 sorteios mais recentes; o Jogador nao
  recebe o historico nem o d10 bruto.
- A ficha calcula o rotulo de build pelos itens reais: zero itens nao mostra
  build, um arquetipo mostra o nome e mistura de arquetipos mostra
  `MultiClasse` em branco.
- Builds vazias antigas, como o teste removido de Davi, sao saneadas na leitura
  do workspace sem alterar fichas que ainda possuem itens.
- O painel concluido do Treino Inicial ganhou atribuicao individual das cinco
  habilidades canonicas. O comando e exclusivo do Mestre, grava na ficha
  canonica e nao duplica a habilidade em cliques repetidos.
- O `EVE` ganhou o evento de gestao `Atribuir Skills`. Ele reutiliza as mesmas
  cinco habilidades do Treino Inicial, permite escolher qualquer ficha real de
  Jogador e grava pelo mesmo fluxo canonico. `Rituais` e `Outros` estao
  estruturados e marcados como `EM CONSTRUCAO`, sem conteudo inventado.
- Desativar o evento nao desfaz habilidades concedidas. O Jogador ve apenas a
  habilidade final em sua ficha; catalogo e controles continuam privados.
- Gates locais aprovados: build, lint, `smoke:events`, `smoke:training`,
  `smoke:training:ui`, `smoke:builds` e `smoke:multiplayer`.

## Promocao empacotada concluida - 2026-07-18

- `npm run release:installer` executado depois de fechar a release oficial por
  caminho exato; `release\\win-unpacked` e os instaladores alpha.84 foram
  regenerados.
- `release:assets`, `smoke:release`, `smoke:release:deep` (11/11),
  `smoke:interludes`, `base:diagnose`, `asset:audit -- --top=12`,
  `npm audit --json` e `perf:release` passaram.
- O Riacho Claro passou em cinco ciclos com thumb 640x640, topdown 4000x4000,
  sem fallback, sem erro de rota e sem readiness reabrindo. Preparar mapa,
  voltar ao submapa e liberar Base tambem passaram no executavel real.
- Performance empacotada: low 358 ms de readiness, balanced 958 ms e ultra
  839 ms; os tres modos ficaram `stable=true`.
- Assets core validados: 346.4 MB, 48 audios decodificados, manifest da Base
  consistente e nenhum arquivo vazio. O audit completo continua registrando
  os originais pesados cobertos por `_optimized` e o proxy 3D fora do ultra.
- A unica mensagem nao bloqueante do deep smoke foi `ERR_ABORTED` de um video
  opcional interrompido durante a troca de cena; o caso ficou em `ignored` e
  o smoke terminou estavel, sem erro de recurso obrigatorio.
- A planilha oficial `docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx` foi
  atualizada e verificada apos esta rodada.
- Depois da validacao, todos os processos do executavel em
  `release\\win-unpacked` foram encerrados; a checagem final ficou limpa.

## Registro da Sessao 03 e demanda imediata da Sessao 04 - 2026-07-18

- O resultado canonico da sessao esta em
  `docs/planejamento/PLANICIE_SESSAO_03_RESULTADO_2026-07-18.md`.
- O grupo liberou o Mapa Mundi, esta com a Caixinha do Ontem e uma esfera
  magica, e terminou seguindo para o Campo de Treinamento. Fragmentado ficou
  vazio/paralisado depois da saida de Davi.
- A preparacao imediata inclui treino completo, arma `1d6` e/ou escudo/lanca,
  um nivel por jogador, seis itens de arquetipo, cinco habilidades e cinco
  tradutores. Regiao, faccao, local e linguas dos NPCs ainda precisam ser
  catalogados com fonte real.
- O EVE ganhou `Limpar backlog`: acao exclusiva do Mestre, com confirmacao,
  que remove somente o historico operacional de sorteios. O smoke de release
  passou esse fluxo no executavel empacotado.
