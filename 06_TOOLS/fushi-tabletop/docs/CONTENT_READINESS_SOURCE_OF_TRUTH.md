# Content Readiness - Fonte De Verdade

Data: 2026-08-01

Este arquivo aponta para os artefatos que devem guiar o trabalho de estabilidade,
otimizacao e conteudo novo do FUSHI Tabletop.

## Arquivos principais

| Arquivo | Uso |
| --- | --- |
| `docs/planejamento/campanha-controle.json` | Modelo editavel e simples de producao da campanha: app, lore, protagonistas, NPCs, mobs, bosses, biomas, audio, VFX e protocolos. |
| `docs/planejamento/ALPHA84_PROXIMAS_SESSOES_BOARD.md` | Board pratico para priorizar o que pode aparecer nas proximas sessoes: hubs, livro do jogador, combate, morte/renascimento, MSC e conteudo imediato. |
| `docs/planejamento/LIVRO_JOGADOR_COMBATE_BLUEPRINT.md` | Controle editorial ativo: fontes canonicas, regras publicas, sigilo, estados editoriais e portoes de fechamento dos livros. |
| `src/data/rulebook/*.json` | Fonte unica dos Livros do Jogador e do Mestre usados pelo app e pelos PDFs. |
| `docs/fushi-system/FUSHI_COMBAT_V2.md` | Fonte ativa para defesa, critico, manobras, mobs e builds; prevalece sobre regra V1 conflitante. |
| `docs/fushi-system/COMBAT_V2_SIMULATION_REPORT.md` | Auditoria de matematica, cenarios e alertas de ficha antes de ajustar Vida, dano ou item. |
| `docs/fushi-system/FUSHI_TRAINING_ARC_V1.md` | Runbook canonico do Circuito do Centro: ativacao MUN, seis estacoes, Segundo Sino, privacidade e aceite manual. |
| `docs/fushi-system/FUSHI_EVENT_SYSTEM_V1.md` | Protocolo do hub EVE: ciclo de vida, coexistencia, limpeza, privacidade e regras para eventos futuros. |
| `docs/fushi-system/FUSHI_CHARACTER_STAGES_V1.md` | Contrato canonico de Estagios/Fases: snapshots privados do Mestre, fase ativa unica, troca atomica, VFX e multiplayer. |
| `docs/planejamento/ALPHA91_RULEBOOK_REFRESH_2026-07-30.md` | Registro do fechamento editorial alpha.91, portoes de PDF/release e limites do que nao foi alterado. |
| `docs/planejamento/ALPHA92_MSC_LIBRARY_REWORK_2026-08-01.md` | Contrato do rework visual da biblioteca MSC, persistencia, privacidade multiplayer e gates da release. |
| `src/data/training/village-training-arc.json` | Fonte unica das regras exibidas pelo painel de treinamento; React apenas renderiza. |
| `output/pdf/FUSHI_Livro_do_Jogador_Alpha84.pdf` | Caminho legado estavel do volume publico; conteudo alpha.91 com 28 paginas, destaques semanticos, diagramas taticos e bibliografia filtrada. |
| `output/pdf/FUSHI_Livro_do_Mestre_Alpha84.pdf` | Caminho legado estavel do volume confidencial; conteudo alpha.91 com 392 paginas, regras publicas, escudo e compendio vivo. |
| `output/pdf/FUSHI_Rulebook_QA_Alpha84.json` | Auditoria de metadados, render, paginas vazias/cortadas e vazamento de termos secretos. |
| `docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx` | Planilha principal para ver o que esta estavel, o que falta e como testar. |
| `.codex-dev/content-readiness-audit.json` | Snapshot tecnico gerado por `npm run content:audit`. |
| `.codex-dev/content-readiness-actions.csv` | Backlog operacional resumido. |
| `.codex-dev/content-map-status.csv` | Tabela por mapa da biblioteca/MUN. |
| `.codex-dev/content-heavy-originals.csv` | Lista de originais pesados cobertos por WebP. |
| `.codex-dev/mun-interludes-audit.json` | Auditoria tecnica de interludios automaticos do MUN. |
| `.codex-dev/mun-interlude-thumbnails/*` | Folhas de contato para revisar thumbs visualmente. |
| `release-codex/baselines/alpha83-stable-20260616/baseline-manifest.json` | Manifesto do backup da alpha.83 estavel. |

## Resultado atual da auditoria

| Medida | Valor |
| --- | ---: |
| Mapas na biblioteca | 125 |
| Locais MUN | 69 |
| Submapas MUN | 58 |
| Interludios automaticos | 121 |
| Issues tecnicas MUN | 0 |
| Thumbs MUN validas | 121 / 121 |
| Thumbs pretas/vazias | 0 |
| Gaps core/library | 0 |
| Pack campanha atual | 4422.7 MiB |
| Originais pesados cobertos por WebP | 103 / 103 |
| Economia potencial estimada | 3120.6 MiB |
| Slots de tema de personagem vazios | 5 / 5 |
| Personagens ativos do workspace real | 55 |
| Pastas de lore lidas | 53 |
| Protagonistas reais | 6 |
| Fichas avancadas/boss em foco | 15 |
| Boss Cataclisma | 9 |
| Biomas MUN | 9 |
| Capitulos publicos no app/PDF | 16 |
| Capitulos confidenciais do Mestre | 19 |
| Paginas PDF Jogador / Mestre | 28 / 392 |
| Fichas no snapshot do Mestre | 55 |
| Vazamentos detectados no livro publico | 0 |

## Fechamento tecnico alpha.84

- `smoke:release:deep`: 11/11 cenarios de jogo aprovados no executavel
  empacotado; o laboratorio matematico foi removido da interface e voltou a ser
  ferramenta offline.
- `perf:release`: estavel em low, balanced e ultra; readiness entre 291 e
  417 ms, abertura 3D entre 1673 e 2231 ms e working set entre 486.9 e
  524.6 MiB no ambiente automatizado.
- `base:diagnose`: 8 bases, 88 upgrades e 24 topdowns validos.
- `asset:audit`: 103 imagens pesadas cobertas por derivados e GLB de 61 MB
  protegido por proxy fora do Ultra; nenhum pesado sem cobertura runtime.
- `npm audit` em 2026-08-01: zero criticas, zero moderadas e 3 altas residuais
  (`brace-expansion` transitivo e `react-router-dom`). A correcao do roteador
  precisa de branch e smokes de navegacao/multiplayer; nao usar `npm audit fix`
  automatico na build de sessao.
  As correcoes sem quebra foram aplicadas; o restante exige `--force` e mudancas
  maiores de tooling/runtime, portanto continua como risco tecnico registrado,
  sem promover uma atualizacao forcada na vespera da release.
- O smoke de camera 3D exige movimento e incremento real do stream Mestre para
  Jogador, aguardando ate 1.2 s sob carga antes de declarar falha.

## Linguagem editorial dos livros

- Manrope: corpo de texto legivel.
- Cinzel: titulos e capitulos com identidade premium de RPG.
- Orbitron: rotulos, dados, DTs e palavras-chave cosmicas; nunca usada em paragrafos longos.
- Roxo: ataque, precisao e Coreografia.
- Ciano: Vida, FUSHI e Determinacao.
- Dourado: economia de acoes, defesa e tempo de turno.
- Vermelho: estados de recurso em zero.
- Exemplos taticos usam diagramas vetoriais leves no app e no PDF.

## Leitura correta dos gaps

A auditoria atual nao encontrou gap entre core, biblioteca e runtime. Isso nao
autoriza remover os fallbacks: todo asset novo continua obrigado a ter thumb,
manifest, variante leve quando aplicavel e validacao no release empacotado.

## Regra para conteudo novo

Todo conteudo novo deve entrar com:

1. asset original, se existir, separado do runtime quando for pesado;
2. thumb 640 valida;
3. derivado leve WebP/video otimizado quando aplicavel;
4. entrada em manifest;
5. fallback para low/balanced quando existir 3D/VFX/video;
6. smoke ou auditoria que rode no release empacotado;
7. licenca/fonte registrada quando for audio, VFX, imagem ou modelo externo.

## Combat V2

- Antes de mexer em Vida, dano, Bloqueio ou item, usar
  `npm run combat:simulate` e `npm run combat:builds:plan`, seguidos de
  `npm run smoke:combat-v2`. O simulador nao aparece na Mesa normal.
- A migracao do workspace real tem backup rastreado em
  `docs/fushi-system/COMBAT_V2_MIGRATION_APPLIED_2026-07-11.md`.
- Qualquer regra de combate nova precisa aparecer na ficha estruturada, no
  Livro do Jogador, no Escudo do Mestre, no simulador e no release empacotado.
- O smoke offline protege o seed de instalacao limpa: Lobo Cinzento 8 Vida e
  Lobo Marcado 14.
- `npm run smoke:builds` valida o baseline canonico isolado: 48 itens, 240
  raridades e 41 conjuntos NPC 8/8. `npm run smoke:builds:live` e diagnostico
  estrito do save real e pode falhar depois de uma remocao manual pelo BUI.
- Em 2026-07-17 o baseline canonico passou, mas o save real manteve Eiran 7/8
  apos uso do modo de correcao tecnica. O gate nao repara nem sobrescreve essa
  escolha do Mestre.
- No mesmo fechamento, o migrador de defesas corrigiu somente Maira Velan de
  Bloqueio 8 para 0 por Fortitude. O workspace anterior ficou preservado em
  `%APPDATA%\FUSHI\workspace.backup-before-combat-v2-2026-07-17T19-47-22-272Z.json`.
- A auditoria atual cobre 55 fichas e 5 cenarios. Ainda ha 30 fichas usando
  ataque de referencia; Veyra tambem nao alcanca a CA 24 de Liryssa com seu
  ataque-base atual. Esses pontos sao backlog de conteudo/playtest, nao motivo
  para inventar ataques em massa nem para alterar Vida/CA no escuro.

## EVE e Treinamento da Vila

- `EVE` e a fonte unica para ativar, controlar e desativar eventos temporarios.
- Eventos ativos coexistem e sao desativados de forma independente.
- `Campo de Treinamento > Ativar treinamento` abre o mapa e registra o evento
  `Treino Inicial`; quando ativo, o mesmo botao abre o EVE sem reiniciar.
- O Treino V2 aplica `Treinamentos atuais.docx`: seis estacoes com DT 10,
  Marcas, Ousadia e Contratempos totais. Jogador recebe somente objetivo e
  progresso, sem DT ou guia privado.
- Contratempos sao acumulados por participante no circuito inteiro: 0-1 sem
  efeito; 2-5 aplica -1d4 no proximo ataque; 6+ tambem permite ao Mestre
  escolher um turno de paralisia.
- A prova final registra Sensacao do Corpo, recuperacao de FUSHI e Euforia por
  participante. Falha corporal e recuperacao atualizam a ficha canonica.
- O estado canonico fica em `PersistedTabletopSession.trainingState` e atravessa
  o sanitizador multiplayer; o ciclo do evento fica em `eventState`.
- Desativar o treino fecha a camada publica, restaura o mapa anterior quando
  aplicavel e preserva o progresso. Reiniciar continua sendo uma acao separada.
- `Sorteio Raridade Build` e uma apresentacao sincronizada; nao altera ficha e
  nao substitui o vinculo canonico do BUI.
- A raridade revelada pode ser fechada com clique em qualquer ponto da tela;
  fechar e local e nao apaga o resultado do EVE/BUI. A apresentacao expira em
  ate 18 segundos e nao reaparece ao trocar de cena ou voltar para a Mesa.
- O EVE preserva os 100 sorteios mais recentes em backlog privado do Mestre;
  `lastRoll` e `rarityHistory` nao entram no payload do Jogador.
- O EVE oferece `Limpar backlog` com confirmacao para remover somente esse
  historico operacional de testes/sorteios; a apresentacao atual, ficha, BUI,
  itens absorvidos e logs narrativos ficam intactos.
- `Build Absorvida` deriva somente dos itens realmente vinculados: sem item a
  ficha nao mostra build; um arquetipo mostra seu nome; dois ou mais mostram
  `MultiClasse` em branco. Saves antigos com build vazia sao saneados ao abrir.
- Ao concluir o Treino Inicial, o Mestre pode atribuir individualmente as cinco
  habilidades canonicas de Kairos, Davi, Connor, Kael e Grim. A gravacao usa a
  ficha canonica, sincroniza pelo fluxo existente e e idempotente.
- O mesmo catalogo esta disponivel em `EVE > Atribuir Skills`: o Mestre ativa
  o evento, escolhe a ficha e atribui o conteudo sem depender do painel final
  do treino. `Habilidades` contem somente as cinco recompensas aprovadas;
  `Rituais` e `Outros` ficam marcados como `EM CONSTRUCAO`, sem placeholders.
- Desativar `Atribuir Skills` fecha a ferramenta, mas nunca remove conteudo ja
  gravado. O Jogador nao recebe catalogo nem controles privados; ve apenas a
  habilidade em sua ficha canonica.
- O aceite multiplayer e unico por instancia viva do app: navegar entre Mesa,
  Fluxo, Livro e Multiplayer preserva a entrada; uma queda pode trocar o socket
  usando o mesmo `clientInstanceId`. Fechar o app, desconectar, recusar ou
  expulsar revoga a entrada.
- Ficha remota usa patch dos campos alterados. Uma copia antiga do Jogador nao
  pode apagar Habilidades, Rituais, permissoes, corpo compartilhado ou Build
  Absorvida concedidos pelo Mestre.
- Preparar um mapa continua ocultando o tabuleiro dos jogadores, mas a camada
  de bloqueio nao cobre mais o menu superior nem impede a navegacao interna.
- BUI e EVE usam icones proprios no HUD, sem fallback textual.
- Estagios/Fases usam uma unica ficha ativa. O Mestre ve o catalogo privado;
  Jogadores recebem somente fase ativa, label e revision. Criar/trocar/renomear
  e excluir fase arquivada passa pelo salvamento canonico e preserva vinculo,
  permissoes e corpo compartilhado.
- A troca de fase publica uma transicao visual idempotente no token; a mesma
  revision nao pode repetir o giro ao reconectar. O smoke dedicado e
  `npm run smoke:stages`.
- Mudancas exigem `npm run smoke:training`, `npm run smoke:training:ui` e
  `npm run smoke:events` + `npm run smoke:multiplayer` antes da release.
- A alpha.84 tambem passou em `npm run smoke:release`, `release:assets` e no
  `smoke:release:deep` 11/11: no executavel isolado,
  o MUN abriu a Planicie, ativou mapa/painel, persistiu a Marca do Mestre e
  publicou os cinco participantes sem DT/notas privadas.
- Status atual: OK tecnico; falta somente o playtest fisico do arco em sessao.

## Comando para atualizar a fonte de verdade

```powershell
npm run status:audit
npm run smoke:statuses
npm run mun:interludes:audit
npm run content:audit
npm run books:build
npm run books:audit
npm run smoke:rulebooks
npm run smoke:rulebooks:release
npm run smoke:combat-v2
npm run combat:builds:plan
npm run smoke:builds
npm run smoke:builds:live
npm run smoke:training
npm run smoke:training:ui
npm run smoke:events
npm run smoke:stages
npm run smoke:release:deep
npm run perf:release
npm run base:diagnose
npm run asset:audit -- --top=12
npm audit --json
```

## Estados de combate e recuperacao da Mesa

- Catalogo canonico: `src/data/statusCatalog.ts`.
- Protocolo operacional: `docs/fushi-system/FUSHI_STATUS_SYSTEM_V1.md`.
- Painel do Mestre: `BUF`; estados ativos aparecem permanentemente na ficha.
- Estados de recurso em zero sao automaticos: Vida -> Desmaiado, FUSHI ->
  Exausto, Determinacao -> Descontrolado.
- Dano continuo, Cura, Aura, duracao e restricoes processam uma vez por
  turno/rodada, protegidos por `lastProcessedRound`.
- A auditoria de NPCs classifica acoes sem alterar lore. Palavra parecida nao
  autoriza automacao; efeitos condicionais, escolhas, fases e valores proprios
  continuam como revisao explicita.
- `Ctrl+A` preserva a sessao, remonta o tabuleiro e usa recarga forte somente
  quando a verificacao de pixels do Electron ainda encontra branco.

Depois desses comandos, regerar a planilha:

```powershell
& "C:\Users\danie\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ".codex-dev\artifact-work\build-alpha84-control-workbook.mjs"
```

## Como usar a planilha

- `Controle`: painel simples de producao da campanha; clique nas frentes para ir direto para a aba.
- `App_Base`: checklist do app estavel que nao pode regredir.
- `Campanha_Checklist`: checklist simples de lore, mobs, boss, mundo, audio, VFX e mapas.
- `Protagonistas_Controle`: app + corpo real + corpo da Vila + premissa sem misturar segredo de lore com ficha visivel.
- `NPCs_Mobs`: separa NPC, mob, boss e placeholder/teste.
- `Bosses_Rituais`: painel de producao para Boss Cataclisma, rituais, fases, mapas, VFX, audio e estado.
- `Biomas_Mapas`: painel por bioma/MUN para decidir lore, mapa, interludio, evento e destaque visual.
- `Audio_VFX`: backlog de trilhas, SFX, VFX, habilidades lendarias, dominio e topdown animado.
- `Painel`: visao mais visual do que esta OK, em foco ou critico.
- `Resumo`: leitura executiva do estado atual.
- `Backlog`: o que fazer por prioridade.
- `Core_vs_Pack`: decisao de empacotamento para alpha.84.
- `MUN_Assets`: linha por mapa/thumb/asset.
- `Peso_Assets`: originais pesados candidatos ao split.
- `Checklist_Teste`: roteiro de teste fisico.
- `NPC_Mecanicas`: quadro geral de personagens reais vindos do workspace persistido, com lore, habilidades, animacoes, token e encaixe de mesa.
- `Protagonistas`: somente personagens tipo `player`; nomes repetidos em NPC nao entram aqui.
- `Bosses_Fases`: ficha avancada, boss e Cataclisma; deve explicitar fases, mapas, aparencias, VFX/3D, interludios e controle de estado.
- `Faccoes`: visao por faccao, cruzando app/workspace/lore.
- `Mundo_Biomas`: visao por bioma do MUN para decidir mapas, interludios, riscos, faccoes e conteudo pendente.
- `Conteudo_Futuro`: como entrar com audio, VFX, topdown animado e novos sistemas sem retrabalho.

## Board de proximas sessoes

Antes de implementar sistemas grandes, use
`docs/planejamento/ALPHA84_PROXIMAS_SESSOES_BOARD.md` para escolher o proximo
pacote pequeno. A ordem recomendada atual e:

1. Kit secreto de morte e renascimento: imagens, interludio, puzzle e operacao audiovisual.
2. Combate e balanceamento: playtest das regras em teste sem nerfar Bloqueio no escuro.
3. Hubs de mesa.
4. MSC/audio.
5. Conteudo da Sessao 03.

Cada pacote deve comecar com uma pergunta guiada ao mestre, uma sugestao
conservadora e aprovacao antes de mexer em app, regra canonica ou asset pesado.

## Regra dos personagens

- Fonte aceita: `%APPDATA%\FUSHI\workspace.json`, ou o workspace isolado por `FUSHI_APPDATA_ROOT`.
- Fonte de lore aceita: `C:\RPG FUSHI\RPG-FUSHI\01_LORE\npcs\Facções`.
- Fonte proibida como verdade de campanha: `src/data/mock/characters.ts`, backups antigos, seeds e repros de `.codex-dev`.
- Se a fonte nao for `workspace real`, a planilha deve marcar critico e pedir correcao de origem.
- `OK ficha basica` significa que a ficha existe no workspace real com dados estruturados e lore rastreada; nao significa que arte, animacao, interludio ou lore final ja foram aprovadas.
- `FOCO - ficha avancada` significa que o personagem precisa de requisito extra: tema, imagem de lore, video, VFX/dominio, interludio ou regra especial.
- `FOCO - boss cataclisma` significa que a entidade precisa de planejamento completo antes de programar: fases, mapas, aparencias, VFX/3D, audio, interludios e estado de fase.

## Regra visual

- Verde: estavel/ok; nao precisa ser foco imediato.
- Amarelo: atencao/foco atual; planejar ou completar antes de crescer conteudo.
- Vermelho: critico; placeholder, falta estruturar ou bloqueia qualidade.

## Regra para todo chat/agente

Antes de concluir build relevante, rodada de estabilizacao ou entrada grande de
conteudo, atualizar esta fonte de verdade:

```powershell
npm run content:audit
npm run books:build
npm run books:audit
node scripts/update-combat-v2-readiness.mjs
& "C:\Users\danie\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ".codex-dev\artifact-work\build-alpha84-control-workbook.mjs"
```

O resumo final da build deve citar se a planilha foi atualizada ou explicar por
que nao foi.

## Alpha.92: Historia publica, Historia do Mestre e VFX

- `src/data/history/player-history.json` e a cronica publica. Ela pode ser
  aberta por jogadores e nunca deve conter reencarnacao, natureza real dos
  protagonistas, matrizes, metaplot ou ganchos exclusivos do Mestre.
- `src/data/history/master-history.json` e o Livro da Historia confidencial.
  Ele concentra continuidade, bastidores, lacunas, planejamento e fontes
  primarias. Planejamento ou estado tecnico do app nunca vira acontecimento
  canonico sem log real aprovado pelo Mestre.
- Os PDFs correspondentes sao `output/pdf/FUSHI_Cronicas_da_Ilha_Alpha92.pdf`
  e `output/pdf/FUSHI_Livro_da_Historia_Alpha92.pdf`. Ambos passam por
  `npm run books:build`, `npm run books:audit` e pelo smoke de sigilo.
- `src/data/vfx/catalog.json` e a fonte unica dos presets VFX. Preview e local;
  broadcast e publico; todo broadcast tem `vfxExpiresAt`, e VFX vencido ou
  limpo nao pode voltar ao reconnect, troca de mapa ou reabertura da Mesa.
- O smoke especifico e `npm run smoke:history-vfx`; o gate empacotado e
  `npm run smoke:history-vfx:release`. Ele testa a separacao de audiencia, a
  quantidade do catalogo, preview local, broadcast e ausencia de replay.
- A biblioteca MSC agora usa uma unica superficie visual com pastas persistentes
  na lateral, busca, favoritos, tocando agora, cards com capa opcional e controles
  por icone. O rework preserva o motor de audio e o mixer sincronizado existentes.
- Edicoes de faixas nativas ficam em `trackOverrides`; faixas locais continuam em
  `customAudio`. Ambos aceitam `previewImage` e passam pelo sanitizador publico.
  Jogadores recebem somente os metadados necessarios para reproduzir e desenhar
  a faixa; controles de autoria permanecem exclusivos do Mestre.
- O smoke empacotado abre o MSC, navega mantendo a lateral, edita nome e capa,
  fecha, reabre e confirma persistencia. O smoke multiplayer exige custom track,
  capa e override na visao do Jogador.
