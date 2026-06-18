# Contexto Para Proximo Chat

Este arquivo existe para continuar o trabalho se o chat atual quebrar, compactar ou ficar pesado.

## Objetivo do app agora

O foco e deixar o RPG FUSHI estavel, bonito e pronto para teste real com outro PC, sem quebrar a logica ja existente de mesa, campanha, multiplayer, MUN, mapas, fichas e persistencia.

O usuario esta criando NPCs importantes, lore e roadmap de topdown. Enquanto isso, o app deve evoluir em estabilidade, release, visual, VFX e preparacao tecnica.

## Regra principal

Nao inventar lore, regiao, ponto de interesse, item ou logica narrativa sem base no projeto ou sem perguntar. Para mapas, pontos de interesse e biomas, procurar primeiro em:

`C:\RPG FUSHI\RPG-FUSHI\MUN_REWORK`

Depois analisar o projeto inteiro quando a tarefa depender de consistencia narrativa.

## App real que o usuario testa

O usuario nao testa pelo site/dev server. Ele abre o app empacotado:

`C:\RPG FUSHI\RPG-FUSHI\06_TOOLS\fushi-tabletop\release\win-unpacked\RPG FUSHI.exe`

Depois de qualquer mudanca que precise aparecer para ele no proprio PC, rodar o build do Electron para atualizar o `win-unpacked`:

```powershell
npm run electron:build
```

Quando ele pedir explicitamente um pacote para outro PC, atualizar o ZIP:

```powershell
npm run release:zip
```

O ZIP fica em:

`C:\RPG FUSHI\RPG-FUSHI\06_TOOLS\fushi-tabletop\release\RPG-FUSHI-<versao>-win-x64.zip`

O ZIP deve conter `BUILD-INFO.txt` para confirmar versao, horario e hash do `app.asar`. Nao recriar ZIP sem pedido explicito do usuario.

## Estado recente estabilizado

- Checkpoint 2026-05-19 18:53: `release\win-unpacked\RPG FUSHI.exe` foi rebuilt e validado via CDP na rota `#/jogar/mesa`. O smoke final deixou `3D GM` desligado no autosave para o usuario abrir em topdown normal. Nao atualizar ZIP sem pedido explicito.
- Checkpoint 2026-05-19 20:33: `3D GM` foi isolado em camada fixa `.tabletop-board__free-3d-layer`, fora do viewport 2D scrollavel. Wheel/pointer/scroll da mesa 2D ficam bloqueados enquanto a camera livre 3D esta ativa. Camera 3D por wheel/teclado nao remonta mais o renderer Three, pois a camera e aplicada via ref e o persist debounced. Zoom/alvo da camera agora sao clampados para nao fugir do tabuleiro. Smoke do `release\win-unpacked\RPG FUSHI.exe` confirmou `floorTexture=loaded`, canvas sem remount apos 48 wheels, sem erro de console, e o autosave foi deixado com `3D GM` desligado. ZIP nao atualizado.
- Checkpoint 2026-05-19 23:39: novo rebuild em `release\win-unpacked\RPG FUSHI.exe`. A camera livre 3D agora aplica teclado/scroll dentro do renderer Three e ignora estado externo antigo durante movimento ao vivo para evitar flicker/reset. Duplo clique em objeto 2D e engolido no board para nao disparar rota extra de abertura/selecao que podia embranquecer o mapa. Smoke final: `stable=true`, `cameraTarget` mudou de distancia, `externalCameraIgnored=1` durante input local, `scrollTop` 2D ficou parado, sem erro de console, e apos desligar `3D GM` o topdown continuou com imagem carregada (`imageNaturalWidth=4000`) depois de duplo clique em objeto. ZIP nao atualizado.
- Checkpoint 2026-05-20 01:03: novo rebuild em `release\win-unpacked\RPG FUSHI.exe`. Drag de objeto no 2D deixou de remontar/recarregar a camada Three quando muda apenas `x/y/cell`; os objetos 3D existentes agora sincronizam posicao/rotacao incrementalmente por ref. Smoke `smoke-2d-object-drag.mjs`: 10 drags repetidos no 2D, canvas manteve o mesmo marcador (`stable=true`), mapa continuou carregado (`imageNaturalWidth=4000`) e nao houve erro de console. ZIP nao atualizado.
- Checkpoint 2026-05-20 05:00: novo rebuild em `release\win-unpacked\RPG FUSHI.exe`. Movimento de token/personagem no 2D deixou de remontar a camada Three quando muda apenas `cell`; tokens agora sincronizam posicao e selecao incrementalmente por ref. O loader GLB agora preserva o transform de mundo do subnode escolhido, evitando que presets recortados de packs percam escala/rotacao dos pais. Foi empacotado o lote GLB 1k de teste em `public/assets/objects/3d/inbox-1k`: `stone_pack`, `the_sword_in_the_stone`, `ship_pinnace`, `corrupted_dark_forest_ent`, `procedural_city_3`. Smokes finais do exe: token drag `stable=true`, object drag `stable=true`, GLB `Pedra 3D Grande 1k` colocado no mapa com `stable=true`, mapa carregado (`imageNaturalWidth=4000`), sem erro de console. ZIP nao atualizado.
- Checkpoint 2026-05-20 06:54: novo rebuild em `release\win-unpacked\RPG FUSHI.exe`. Objetos 3D agora separam escala visual da barreira de grid; o grid e so footprint/celula de referencia. Painel OBJ ganhou controles de `Escala 3D`, `Altura Z`, `Giro Y`, `Pitch X` e `Roll Z`, alem dos atalhos no modo `3D GM`: `[ ]` gira, `-/+` escala, `PageUp/PageDown` sobe/desce. Presets template/feios foram removidos, mantendo so GLB reais 1k do inbox. A sincronizacao runtime da camada Three foi reforcada para `add/remove/hide/select/drag` de tokens e objetos sem remontar canvas. Smokes do exe empacotado: `smoke-2d-token-drag stable=true`, `smoke-2d-object-drag stable=true`, `smoke-3d-wheel stable=true`, e `smoke-2d-spam-stability stable=true` cobrindo duplo clique em objeto, 8 alternancias de visibilidade de token e remocao de 3 objetos. ZIP nao atualizado.
- Checkpoint 2026-05-20 09:58: novo rebuild em `release\win-unpacked\RPG FUSHI.exe`. O editor 3D ganhou uma primeira versao Axiom-lite baseada em TransformControls: toolbar no `3D GM` com `1 Mover`, `2 Girar`, `3 Escala`; atalhos `Del`, `Ctrl+D`, `[ ]`, `+/-` e `PageUp/PageDown`; criacao direta de OBJ no chao da maquete quando um preset esta ativo; escala `X/Y/Z` independente e ranges maiores (`0.01..80`, altura `-18..80`). Os proxies 2D dos GLBs agora ficam invisiveis e sem pointer events para nao disputar clique/drag com a maquete, reduzindo o risco de tela branca por reload. Foi adicionada ambiencia 3D leve em balanced/ultra. Smokes no exe empacotado: `smoke-3d-editor-gizmo stable=true`, `smoke-2d-token-drag stable=true`, `smoke-2d-spam-stability stable=true`, `smoke-3d-wheel stable=true`. ZIP nao atualizado.
- Checkpoint 2026-05-20 21:38: novo rebuild em `release\win-unpacked\RPG FUSHI.exe`. A barra visual do editor 3D saiu do rodape do canvas e virou controle compacto no topo (`M/G/E`), mantendo atalhos. `Ctrl+scroll` agora escala objeto 3D selecionado de forma proporcional, sem puxar eixo isolado; `Ctrl+Z` desfaz snapshot anterior de objetos da cena. O movimento `W/A/S/D/Q/E/R/F` passou a ser continuo por frame e `W/S` foi invertido para parecer mais natural com a camera. A lista `Cena atual` no painel OBJ ficou compacta, com preview, nome, ocultar/desocultar, remover e `Avancado` para abrir sliders. Objetos ganharam paleta/tint 3D. Praia/oceano recebeu primeira camada de agua: ondas, vortices e spray 2D no Pixi + wakes/rings 3D no floor. Smokes no exe: `smoke-3d-editor-gizmo stable=true` validando criacao, `Ctrl+scroll`, `Del` e `Ctrl+Z`; `smoke-2d-token-drag stable=true`; `smoke-3d-wheel stable=true`; `smoke-2d-spam-stability stable=true`. ZIP nao atualizado.
- Checkpoint 2026-05-21 01:20: novo rebuild em `release\win-unpacked\RPG FUSHI.exe`. A paleta de cor deixou de remontar GLB e deixou de tingir material real do modelo; agora e tratada como `Cor do marcador`, atualizando selecao/aura sem destruir a cor original do asset. A assinatura runtime de GLB nao inclui mais `object.color`, entao trocar cor nao deve causar tela preta/branca nem reload do modelo. Os placeholders de agua procedural foram removidos: `Alto Mar` e mapas aquaticos agora usam `three/addons/objects/Water.js` com normal map oficial do Three.js em `public/assets/fx/textures/water/three-waternormals.jpg`, mais uma camada Pixi texturizada de caustics no 2D. O shader 3D cria superficie de agua sobre o floor e cortinas/queda nas bordas do tabuleiro. Smokes no exe: `smoke-2d-spam-stability stable=true`, `smoke-3d-editor-gizmo stable=true`, `smoke-3d-wheel stable=true`, `smoke-2d-token-drag stable=true`; teste extra confirmou troca repetida de swatches sem erro de console e `waterSurface=loaded`. ZIP nao atualizado.
- Checkpoint 2026-05-21 02:50: novo rebuild em `release\win-unpacked\RPG FUSHI.exe`. A agua pesada/opaca do Water.js foi trocada por shader Three proprio e transparente, com caustics/correnteza em additive blending e geometrias muito menores; a camada Pixi 2D do oceano perdeu o `DisplacementFilter` e agora usa duas TilingSprites sutis para correnteza, preservando o mapa topdown em vez de apagar o fundo. O canvas 3D passou a ser transparente tambem em `3D GM`, permitindo fundo cinematografico por bioma atras da maquete; no modo `low`, o fundo continua preto. Foi criada a pasta `public/assets/biomes/8-biomas` com 8 mapas topdown genericos leves em SVG (mais `neutral`), gerados por `scripts/generate-biome-cinematic-assets.mjs`, e o app passou a resolver esses fundos por `src/rendering/biomeCinematicAssets.ts`. Corrigido bug de URL CSS empacotada que tentava carregar `dist/assets/assets/...`. Smokes sequenciais no exe: `smoke-2d-spam-stability stable=true`, `smoke-3d-editor-gizmo stable=true`, `smoke-3d-wheel stable=true`, `smoke-2d-token-drag stable=true`, todos sem eventos de erro. ZIP nao atualizado.
- Checkpoint 2026-05-21 15:34: novo rebuild em `release\win-unpacked\RPG FUSHI.exe`. O modo `ultra` agora usa fundos raster reais/otimizados em `public/assets/biomes/8-biomas-ultra`, copiados para `dist/assets/biomes/8-biomas-ultra` no pacote. O `low` continua preto; o `balanced` continua usando a camada leve atual; apenas o `ultra` troca para JPGs 2048x1280 por bioma. Os fundos foram gerados por `scripts/generate-ultra-biome-textures.ps1`, combinando arte local do MUN_REWORK/FUSHI com texturas CC0 da Poly Haven, ambientCG e Wikimedia Commons. `SOURCES.md` registra fontes/licencas. Smoke do exe empacotado confirmou `rootQuality=ultra`, `boardQuality=ultra`, CSS carregando `8-biomas-ultra` a partir de `app.asar/dist`, mapa topdown carregado (`imageNaturalWidth=4000`) e sem tela branca. Smokes 2D de spam/token e 3D wheel continuaram estaveis; o smoke de criacao 3D em perfil limpo nao e conclusivo porque o perfil isolado nasce sem estado/cena completa para inserir objeto. ZIP nao atualizado.
- Checkpoint 2026-05-21 20:26: novo rebuild em `release\win-unpacked\RPG FUSHI.exe`. Os fundos ultra foram substituidos por imagens novas geradas para cada bioma, sem usar thumbs/MUN_REWORK como base: planicie, praia/oceano, montanha, floresta mistica, vulcao, gelo, ruinas, veu cinzento e neutral. Cada arquivo final e JPG 2048x1280 em `public/assets/biomes/8-biomas-ultra`. `SOURCES.md` foi atualizado com o batch de geracao e regra para nao regenerar ultra a partir de thumbs. A ambiencia generica poluida foi limpa: `TabletopFxStage` nao desenha mais pulso circular/aneis/riscos/motes por padrao; agora so renderiza agua sutil no bioma oceanico e clima explicito (`rain/snow`). `Tabletop3DStage` parou de criar `Points` quadrados e aneis ambientais 3D; a proxima fase de VFX deve usar sprites/flipbooks/assets reais. Baixados para inbox, sem integrar no runtime ainda: Kenney Smoke Particles e Kenney Particle Pack em `C:\RPG FUSHI\RPG-FUSHI\VFX_ASSETS_INBOX\vfx\kenney` (CC0). Smokes no exe: `smoke-2d-token-drag stable=true`, `smoke-2d-spam-stability stable=true`; camera 3D por wheel sem erro de console e com floor texture loaded, embora um smoke tenha ficado `stable=false` por alvo ja clampado no limite, nao por crash/tela branca. ZIP nao atualizado.
- Checkpoint 2026-05-22 00:44: novo rebuild em `release\win-unpacked\RPG FUSHI.exe`. A agua global do `Alto Mar` deixou de criar a grande chapa `Water.js` por baixo/fora do tabuleiro, que estava criando sensacao de tres camadas; ficou so overlay/cortina muito mais sutis e a agua real de cena passa a entrar como objeto/animacao colocavel. O painel `Objetos da Cena` ganhou abas `Objetos` e `Animacoes`; a aba `Animacoes` tem 8 VFX 3D colocaveis como objetos: Coluna de Fogo, Banco de Nevoa, Rajada de Vento, Jorro de Agua, Tempestade de Raios, Vortice de Folhas, Erupcao de Lava e Nuvem de Chuva. Esses VFX usam sprites/texturas runtime em Three.js com luz, rings, fumaca/brasas/gotas/raios, transform controls, escala, altura, rotacao, selecao e remocao iguais aos GLBs. O impacto do d20 critico no 3D nao desmonta mais o renderer: `boardImpact` agora sincroniza dentro do loop Three e limpa depois de ~3.2s, evitando o bug em que o mapa sumia ate reiniciar o app. Smokes no exe: `smoke-2d-spam-stability stable=true`, `smoke-3d-wheel stable=true`, teste custom de criar/remover `vfx-fire-column` em 3D passou sem erro de console. BUILD-INFO SHA256 `ACBC00F21D2848624F0B6779FBA5A4F12CCFEC6D198E8AC90B4F622CF2C60E7E`. ZIP nao atualizado.
- Dados 3D ja rodam com modo `+` para soma e `=` para maior resultado mais bonus.
- Resultado da rolagem agora espera a animacao do dado antes de aparecer.
- Resultado antigo nao deve mais rolar sozinho ao reentrar na mesa.
- Falha critica e sucesso critico ja tem animacao inicial.
- Historico de conversa fica acima do historico de rolagens.
- Botoes separados: `Limpar roll` e `Limpar chat`.
- Acoes de sair para Plataforma foram reforcadas com troca de hash/location e reload.
- App tem lock de instancia unica por padrao para evitar conflito ao abrir dois executaveis iguais.
- Para teste local multi-instancia, usar o launcher `RPG FUSHI - Teste Local Multi.cmd` na raiz da pasta extraida do ZIP.
- `3D GM` agora tolera estados antigos/inconsistentes de camera: o toggle e a classe ativa usam camera livre real (`enabled` + `mode free`).
- Camera 3D do mestre abre por padrao em angulo obliquo de maquete, nao quase topdown.
- Objetos 3D renderizam no topdown em todos os modos de qualidade; `ultra` fica para FX/ambiencia mais forte.
- Props de floresta usam fallback procedural estavel para evitar o GLB aparecer quebrado enquanto nao houver extracao real dos subnodes.
- FX Pixi ambiental foi trocado para particulas procedurais; nao usar os PNGs atlas com texto como sprite direto.
- Repo `Moulberry/AxiomPaperPlugin` foi avaliado so como referencia conceitual. Ele nao entrega a UI do Axiom para copiar; a direcao util e separar modo editor, input e permissao/estado, sem misturar com o fluxo normal da mesa.

## Direcao visual pedida

O app deve ficar mais vivo e premium sem perder performance:

- tabuleiro com fundo adaptado por bioma, nao preto generico;
- interludios por mapa com identidade do bioma;
- agua com movimento visual;
- chuva, lava, cinzas, nevoa, vento e particulas quando fizer sentido;
- efeitos de raio, explosao, impacto, rachadura e marcas persistentes no topdown;
- objetos 3D e props coerentes com a campanha;
- futuras mudancas ambientais reais, como raio marcando o mapa, piso molhado e lava afetando a cena.
- futuro armazem de objetos deve funcionar como biblioteca/pastas reais, parecido com NPC/MAP: importar GLB/gltf, inspecionar subnodes, recortar/criar presets individuais, salvar variantes, clonar com Ctrl+C/Ctrl+V e posicionar livremente no tabuleiro.

Contexto visual mais novo: ver `docs/MAQUETE_3D_TABLETOP_CONTEXT.md`.

Checkpoint 2026-05-22 VFX: o app agora usa subset runtime da Kenney em `public/assets/fx/kenney`, com sprites reais por bioma no Pixi 2D e billboards/objetos 3D no modo 3D GM. Os efeitos fortes devem entrar pela biblioteca `Animacoes`, como objetos removiveis/posicionaveis. Continuar evitando placeholders procedurais quando o usuario pedir "cinema": para agua/lava/cachoeira premium, procurar/importar flipbooks, GLB, Effekseer ou assets bakeados de Blender/Houdini antes de escrever shader grande na mao.

Checkpoint 2026-05-22 03:11: VFX refinado no pacote real `release/win-unpacked`.
As animacoes colocaveis agora se comportam no 2D como objetos 3D stage-backed: sem mini-canvas `TabletopObject3D` dentro do botao do grid, sem texto visivel/label tipo `FOL` no proxy, e com o proxy invisivel como barreira/entidade tecnica. O label 3D interno das VFX foi removido em `Tabletop3DStage`, o anel de selecao das VFX foi reduzido, e o vortice de folhas deixou de usar o PNG-sheet inteiro (`leaf_particle.png`) como sprite solto. A agua do Alto Mar voltou a ter uma camada `Water.js` sutil fora/abaixo da maquete no ultra, enquanto a pelicula por cima do tabuleiro foi reduzida para nao apagar o mapa. Smoke final no exe empacotado: VFX criada/removida no 2D, `stage-backed=true`, sem preview canvas, texto vazio, 3D GM abriu com `floorTexture=loaded` e `waterSurface=loaded`, zero erro de console.

Checkpoint usuario 2026-05-22 03:37: ainda ha pontos para proximo chat. A animacao do dado `1d20` nao some mais com a mesa infinitamente, mas ainda trava/buga o 3D ate sair e entrar no `3D GM`. Falta `Enter` para confirmar/soltar objeto no editor 3D, diferente do `Esc`. Existem mini fallbacks/reloads visuais do tabuleiro e troca rapida `Objetos`/`Animacoes` pode sumir o mapa por um instante. Handoff detalhado para continuar esta em `docs/NEXT_CHAT_VFX_HANDOFF.md`.

Checkpoint lore/app 2026-05-22 23:10: o exe real foi rebuilt em `release\win-unpacked\RPG FUSHI.exe`. Importante: personagens que aparecem no app estao no workspace persistido `C:\Users\danie\AppData\Roaming\FUSHI\workspace.json`, nao apenas no seed/mock. Backup criado em `C:\Users\danie\AppData\Roaming\FUSHI\workspace.backup-before-overnight-lore-2026-05-22.json`. O workspace real agora tem 48 personagens; foram adicionados como `player`: `Davi Paixao`, `Connor Mayweather`, `Keal Lebranc`, `Ruiz`; e como `npc`: `Elara Vonn`, `Orian Vonn`, `Nilo Arven`, `Maira Velan`, `Dalvo Seren`, `Elias Norem`, `Nayr Velcaris`, `Renji Akimura`, `Kazuo Kato`. `Kairos` e `Selian` foram alinhados sem duplicar: Kairos jogador/identidade fragmentada, Selian NPC real/matriz emocional. Docs novos: `LORE_ACTION_BOARD_2026-05-22.md`, `SESSION_1_MASTER_RUNBOOK_2026-05-30.md`, `WORLD_SIMULATION_STRATEGY_2026-05-22.md`, `OVERNIGHT_BUILD_REPORT_2026-05-22.md`.

O usuario esclareceu que o ultra nao deve ser so overlay de tela. O mapa 2D precisa virar o chao/floor de uma cena 3D topdown, como uma maquete. A camera fica acima; efeitos e objetos precisam nascer e bater no tabuleiro, nao na borda da tela. Objetos 3D devem ser posicionados livremente por cima do tabuleiro, com editor estilo Axiom, e nao presos em blocos/celulas como item dropado.

Para o d20:

- `1` deve passar sensacao de falha critica e perigo;
- `20` deve passar sensacao de impacto absurdo, com raio vermelho/preto, explosao visual e rachaduras cosmeticas no tabuleiro;
- estes efeitos visuais nao podem alterar regra ou estado de jogo sozinhos.

## Arquitetura visual desejada

Manter React controlando UI, estado e regras. Adicionar camadas visuais por cima:

- PixiJS para clima, glow, agua 2D, overlays, particulas e distorcao no MAP/MUN.
- Three.js para dados 3D, efeitos especiais, portais, dominios e cinematicas.
- Assets `.glb`/`.gltf` carregados sob demanda, nao todos de uma vez.
- Modo de qualidade `low/balanced/ultra` deve desligar efeitos caros em maquinas fracas.

## Fontes/repo ja avaliados

- PixiJS, `ParticleContainer` nativo do Pixi 8 e `pixi-filters` para VFX 2D.
- Three.js e `three.quarks` para VFX 3D/cinematico.
- Quaternius, Poly Haven e ambientCG para assets CC0.
- Khronos glTF Sample Assets para testes tecnicos e validacao de loader, com licencas por modelo.
- GitHub externo visto em 2026-05-20: `KhronosGroup/glTF-Sample-Assets` continua bom para validar loader/formatos glTF; `Alchemist0823/three.quarks` e candidato forte para particulas/VFX 3D quando estabilizar a maquete; `wass08/wawa-vfx` pode ser referencia secundaria, mas e mais alinhado a React Three Fiber.

Nao baixar repo pesado direto no app. Primeiro registrar fonte/licenca, selecionar asset e otimizar.

## Multiplayer e distribuicao

Para teste real com namorada/amigos:

- usar o mesmo ZIP em todos os PCs;
- extrair a pasta inteira antes de abrir;
- idealmente testar mestre em um PC e jogador em outro;
- bugs vistos ao abrir duas instancias iguais no mesmo PC podem ser conflito local, por isso existe o launcher multi-instancia apenas para teste.

## Proximas frentes grandes

1. Estabilizar plataforma, mesa, multiplayer e release.
2. Melhorar visual de dados, chat, mesa e HUD sem mexer em regra.
3. Criar `Tabletop3DStage`: mapa 2D como floor de maquete 3D com camera ortografica topdown.
4. Criar editor de objetos 3D estilo Axiom: posicionar, mover, rotacionar, escalar, duplicar, apagar, snap/free.
5. Criar armazem de objetos/schematic: importar GLB, separar subnodes, criar presets por pasta, copiar/colar e usar brush sem prender tudo ao grid.
6. Criar sistema de VFX por bioma e mapa ancorado no tabuleiro, incluindo fundo/ambiencia alem do preto ao redor da mesa.
7. Construir mapas topdown seguindo MUN_REWORK e thumbs de referencia.
8. Preparar objetos 3D e animacoes coerentes.
9. Depois disso, evoluir simulacao de NPCs com base, historia, rotina, faccao e estado do mundo.
