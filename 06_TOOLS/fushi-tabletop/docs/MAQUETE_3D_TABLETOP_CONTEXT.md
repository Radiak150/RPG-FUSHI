# Contexto Maquete 3D Topdown

Este documento registra a direcao correta para a proxima build visual do tabletop.

## Problema original

Antes da maquete 3D, a camada `ultra` do dado era majoritariamente screen-space: o efeito nascia na tela/camera, nao no tabuleiro. Isso melhorava impacto, mas nao criava a sensacao de que o mapa 2D era uma peca viva dentro de uma cena 3D.

O usuario quer que o tabuleiro seja tratado como uma maquete:

- o PNG/JPG do mapa topdown vira o chao/floor de uma cena 3D;
- a camera fica acima, olhando para baixo;
- os efeitos, objetos e clima acontecem em relacao ao plano do tabuleiro;
- o dado pode continuar responsivo/fullscreen, mas raio, explosao, chuva, lava, vento e props precisam parecer ancorados no mapa;
- o impacto visual precisa parecer que veio de cima, bateu no tabuleiro e rachou/alterou aquela superficie.

## Direcao tecnica obrigatoria

Criar uma camada `Tabletop3DStage` separada do board 2D atual.

Entrada esperada:

- `map.image` como textura do plano 3D;
- `map.stageWidth`, `map.stageHeight`, `gridColumns`, `gridRows` para escala;
- camera ortografica topdown;
- viewport/camera do board sincronizada com zoom/scroll atual;
- objetos 3D salvos em coordenada normalizada ou coordenada de mapa, nao em "1 bloco" fixo;
- VFX com ponto de origem no mapa, nao no centro da tela.

Camadas desejadas:

1. mapa 2D como floor/plane;
2. decals no floor: rachadura, queimado, molhado, gelo, marca FUSHI;
3. props 3D ancorados no mapa;
4. tokens 2D/3D;
5. VFX 3D: raio, explosao, vento, chuva, lava, agua;
6. HUD React acima de tudo.

## Editor de objetos estilo Axiom

O usuario quer um modo de construcao de cena parecido com Axiom/Minecraft, adaptado ao tabletop:

- biblioteca de objetos 3D;
- selecionar objeto;
- colocar livremente no tabuleiro, nao apenas por celula;
- mover, rotacionar, escalar;
- duplicar, copiar, cortar/remover;
- alinhar ao chao;
- alternar snap por grid / livre;
- selecionar varias instancias;
- travar/destravar camada;
- salvar tudo no estado da cena;
- manter multiplayer filtrando public/gm-only.

Controles esperados:

- gizmo de mover/rotacionar/escalar;
- nudge fino;
- duplicar rapido;
- modo "pincel" para espalhar arvores/pedras;
- modo "apagar";
- preview antes de colocar;
- painel com propriedades: posicao, rotacao, escala, visibilidade, colisao/oclusao, nome.

## Regra de token/oclusao

Objetos 3D precisam ser parte do cenario, mas nao podem fazer o token sumir ou ficar perdido.

Regras iniciais:

- token sempre deve ter prioridade de selecao quando clicavel;
- props podem renderizar abaixo, acima ou misto, mas o token precisa ter highlight/outline se estiver atras de algo;
- objetos altos devem ter opcao de opacidade temporaria ao passar mouse/selecionar token;
- cada prop pode ter `blocksMovement`, `blocksVision`, `occludesToken`, `selectionPriority`;
- mestre pode alternar modo "ver atraves dos props";
- se token estiver atras de objeto, desenhar silhueta/contorno por cima.

## Pack de arvores baixado

Arquivo atual:

`public/assets/objects/3d/low_poly_forest_tree_pack.glb`

O GLB e um pack com varias arvores/rochas/partes, nao um item unico. O proximo passo nao e colocar o pack inteiro como um bloco 3x3. O correto e:

1. inspecionar nodes/meshes do GLB;
2. extrair ou instanciar sub-objetos individuais;
3. criar variantes na biblioteca: arvore A, arvore B, tronco, rocha, arbusto etc;
4. permitir colocar cada variante livremente na maquete;
5. depois permitir brush para floresta.

Metadata encontrada no GLB:

- Title: Low Poly Forest Tree Pack
- Author: 99.Miles
- Source: https://sketchfab.com/3d-models/low-poly-forest-tree-pack-5ff5a51e74324845a4e4905f182dfb2b
- License: CC-BY-4.0

## Pack de raio baixado

Arquivo atual:

`public/assets/fx/models/lighting_pack_chain_lighting.glb`

O GLB de raio tambem deve ser usado como efeito ancorado ao plano do tabuleiro, nao como overlay solto na tela.

Uso correto:

- origem no ceu/camera acima do mapa;
- alvo em coordenada do tabuleiro;
- raio toca o floor;
- cria decal de rachadura/queimado no floor;
- ilumina temporariamente props e tokens proximos;
- se for critico, pode usar fullscreen para dramatizar, mas o golpe principal precisa bater no mapa.

Metadata encontrada no GLB:

- Title: Lighting Pack - Chain Lighting
- Author: re1monsen
- Source: https://sketchfab.com/3d-models/lighting-pack-chain-lighting-dec878738a9d4200976aecf4773def1b
- License: CC-BY-4.0

## Video de raio

Arquivo atual:

`public/assets/fx/video/thunder_red_looping_2.mp4`

O video pode continuar como camada de dramatizacao, mas nao deve ser o efeito principal. Ele deve complementar a cena 3D:

- flash;
- textura emissiva;
- reflexo temporario;
- fundo de impacto;
- distorcao de tempo.

Licenca nao confirmada; manter como user-provided/private-test ate confirmar.

## Proxima implementacao recomendada

## Implementado em 2026-05-19

Primeira base real da maquete entrou no app:

- `src/rendering/three/Tabletop3DStage.tsx` renderiza o `map.image` como floor/plane 3D;
- o board passa tokens e objetos para a camada 3D;
- `TabletopScene.camera3dState` persiste camera 3D opcional por cena;
- `TabletopBoardObject.placement3d` persiste posicao normalizada, rotacao e escala;
- `TabletopBoardObject.modelNodeName` permite instanciar um sub-node do GLB em vez do pack inteiro;
- botao `3D GM` ativa camera livre do mestre;
- botao `CAM GM` continua sendo o controle para jogadores acompanharem a camera do mestre;
- se `3D GM` estiver ativo e `CAM GM` tambem, jogador ve a camera 3D do mestre;
- foram criados presets individuais do pack de floresta: arvore, galhos, tronco e rochas;
- painel de objetos ganhou rotacao, escala e duplicacao para props 3D;
- rolagens criticas agora disparam um primeiro impacto 3D ancorado no floor do tabuleiro, com raios, rachaduras radiais, aneis de choque e luz local;
- `release/win-unpacked` foi atualizado; ZIP nao foi recriado por decisao do usuario.

Checkpoint final 2026-05-19 18:53:

- `3D GM` foi corrigido para ligar camera livre mesmo quando uma sessao antiga tinha `enabled` sem `mode: free`;
- a camera livre abre em angulo obliquo de maquete por padrao/reset;
- `WASD` move o alvo da camera, botao direito orbita, scroll aproxima/afasta, `Q/E` gira e `R/F` ajusta pitch;
- clique esquerdo seleciona objeto 3D e arrastar move livremente sobre o plano do tabuleiro, salvando `placement3d` e uma celula aproximada de referencia;
- a camada 3D topdown renderiza em todos os modos de qualidade; `ultra` fica reservado para FX/ambiencia mais fortes;
- props de floresta estao usando fallback procedural estavel enquanto o GLB nao for extraido em variantes reais;
- FX ambiental Pixi foi convertido para particulas procedurais, porque alguns PNGs atlas tinham texto embutido e vazavam no mapa;
- smoke do exe empacotado confirmou: sem tela branca, sem erro de console, `3D GM` ativa `tabletop-3d-stage--free`, e o autosave foi deixado com `3D GM` desligado.

Checkpoint 2026-05-19 20:33:

- `3D GM` foi isolado em `.tabletop-board__free-3d-layer`, uma camada fixa acima da mesa 2D e abaixo da UI, em vez de ficar montado dentro do viewport 2D scrollavel;
- a mesa 2D deixa de receber `pointer/wheel/scroll` quando a camera livre 3D esta ativa, evitando conflito entre zoom/pan 2D e camera 3D;
- movimento de camera por scroll/teclado nao remonta mais o renderer Three: `cameraSignature` saiu das dependencias do efeito principal e a camera agora e aplicada via ref;
- persistencia de camera por wheel/teclado foi debounceada, reduzindo writes e renders enquanto o mestre mexe;
- zoom da camera livre virou curva suave e limitada, com alvo clampado na area util do tabuleiro para a camera nao fugir para preto/branco;
- o canvas 3D marca `data-floor-texture=loaded/fallback/loading` para smoke/debug confirmar se a textura real do mapa entrou no floor;
- smoke do `release/win-unpacked/RPG FUSHI.exe` confirmou `floorTexture=loaded`, sem erros de console, canvas sem remount apos 48 eventos de wheel e scroll 2D parado;
- o app foi deixado com `3D GM` desligado depois do smoke, e o ZIP nao foi recriado.

Checkpoint 2026-05-19 23:39:

- camera livre 3D deixou de depender de updates React/session em tempo real para teclado/scroll; o input agora altera o `freeState` local do renderer e so sincroniza para a sessao com debounce;
- `applyCameraStateRef` ignora camera externa antiga por uma janela curta apos input local, evitando o efeito visual de flicker/reset quando o autosave ou multiplayer ainda esta com camera anterior;
- o canvas 3D expõe diagnosticos `data-camera-mode`, `data-editor-enabled`, `data-last-input`, `data-last-key-seen` e `data-external-camera-ignored` para smoke/debug;
- duplo clique em objeto 2D agora e interceptado no `TabletopBoard` e nao chama mais uma rota extra de `onObjectOpen`; selecao simples continua funcionando;
- smoke final do `release/win-unpacked/RPG FUSHI.exe`: `stable=true`, sem erro de console, `cameraTarget` mudou apos input 3D, scroll 2D ficou travado, e apos desligar `3D GM` o topdown permaneceu com imagem carregada depois de duplo clique em objeto;
- ZIP nao foi recriado.

Checkpoint 2026-05-20 01:03:

- objetos movidos no 2D nao devem mais forcar reload/reset da camada Three quando muda apenas `x/y/cell`;
- `Tabletop3DStage` passou a manter os nodes existentes vivos e sincronizar posicao/rotacao incrementalmente por `applyObjectStateRef`;
- a assinatura que remonta o Three ficou restrita a mudancas estruturais/visuais do objeto: tipo de render, modelo, node, tamanho, escala, z e visibilidade;
- cada sync incrementa diagnosticos `data-object-sync-count` e `data-object-sync-frame` no canvas para smoke/debug;
- smoke do exe empacotado com 10 drags repetidos no 2D confirmou canvas sem remount, mapa carregado (`imageNaturalWidth=4000`) e zero erro de console;
- ZIP nao foi recriado.

Checkpoint 2026-05-20 05:00:

- tokens/personagens movidos no 2D agora tambem nao remontam o Three quando muda apenas `cell`;
- `Tabletop3DStage` ganhou `applyTokenStateRef`, mantendo nodes de token vivos e sincronizando posicao/selecao incrementalmente;
- `tokenSignature` nao inclui mais linha/coluna, entao mover personagem repetidamente nao deve resetar textura/canvas;
- o loader GLB passou a preservar o transform de mundo do subnode escolhido antes de normalizar/centralizar o modelo;
- isso reduz chance de objetos de packs aparecerem fora de escala, desmontados ou com rotacao errada quando recortados por `modelNodeName`;
- lote GLB 1k foi empacotado em `public/assets/objects/3d/inbox-1k`: pedras, espada na pedra, navio pinnace, ent corrompido e cidade procedural;
- presets de teste foram adicionados na biblioteca OBJ para avaliar visual/peso antes de criar o armazem definitivo;
- smokes finais no exe empacotado: `smoke-2d-token-drag` e `smoke-2d-object-drag` ambos `stable=true`, `Pedra 3D Grande 1k` foi colocada no mapa com `stable=true`, mapa carregado (`imageNaturalWidth=4000`) e sem erro de console;
- ZIP nao foi recriado.

Checkpoint 2026-05-20 06:54:

- objetos 3D deixaram de usar tamanho de grid como escala visual; `size/customSize` ficam como footprint/barreira aproximada e `placement3d.scale` controla a escala real do modelo;
- `Tabletop3DStage` agora reconcilia objetos e tokens incrementalmente por mapas runtime (`runtimeObjectNodes`, `runtimeTokenNodes`) e so recria node quando muda estrutura/modelo, nao em `x/y/z/rotacao/escala/visibilidade/selecao`;
- o loader GLB clona materiais antes de usar para evitar corrupcao/dispose de material cacheado;
- painel OBJ ganhou sliders para `Escala 3D`, `Altura Z`, `Giro Y`, `Pitch X` e `Roll Z`;
- atalhos no `3D GM` para objeto selecionado: `[ ]` gira no eixo Y, `-/+` muda escala, `PageUp/PageDown` muda altura; `Shift` aumenta o passo;
- presets template/procedurais antigos foram removidos da biblioteca OBJ; ficaram apenas GLB reais 1k do inbox para teste de fluxo/peso;
- novo smoke `.codex-dev/smoke-2d-spam-stability.mjs` cobre criacao de objetos, duplo clique em objeto 2D, alternancia repetida de visibilidade de token e remocao de varios objetos;
- smokes no exe empacotado: token drag, object drag, 3D wheel/topdown return e spam stability todos sem erro de console, com mapa carregado (`imageNaturalWidth=4000`) e canvas sem remount;
- `release/win-unpacked/BUILD-INFO.txt` atualizado; ZIP nao foi recriado.

Nota sobre Axiom:

- O repo `Moulberry/AxiomPaperPlugin` foi avaliado como referencia conceitual. Ele e mais plugin server-side/integração do Axiom do que a UI completa de edicao. Nao copiar logica dele diretamente; usar como principio de arquitetura: modo editor separado, input dedicado e estado explicito.

Limitacoes conscientes desta primeira base:

- existe uma primeira versao de gizmo visual com `TransformControls` no `3D GM`: `1` move, `2` gira, `3` escala;
- ainda falta gizmo custom completo no estilo Axiom, snap/free explicito, multi-selecao, brush e alcas mais bonitas de resize;
- objetos podem ser colocados direto na maquete 3D a partir da biblioteca OBJ quando um preset esta ativo;
- proxies 2D de GLBs devem permanecer invisiveis e sem input; a edicao real deve acontecer no `3D GM` e no painel OBJ;
- o dado critico ainda mantem a camada fullscreen para dramatizacao, mas agora tambem tem impacto no floor; falta evoluir para decal persistente e alvo coordenado por token/celula;
- a selecao 3D ja existe no canvas quando o editor esta ativo, mas precisa evoluir para prioridades melhores com tokens, oclusao e ferramentas Axiom-lite.

Checkpoint 2026-05-20 09:58:

- `release/win-unpacked/RPG FUSHI.exe` atualizado com a primeira etapa Axiom-lite;
- `TabletopObject3DPlacement` agora aceita `scaleX`, `scaleY` e `scaleZ`;
- ranges de escala/altura foram ampliados para permitir cidade/navio/ent sem ficar preso ao grid;
- `Tabletop3DStage` usa `TransformControls` sob demanda e sincroniza transform final para a sessao sem recriar o GLB;
- shortcuts novos: `Del`, `Ctrl+D`, `[ ]`, `+/-`, `PageUp/PageDown`;
- camada 2D de objeto GLB virou barreira invisivel sem pointer events, para parar conflitos de clique/duplo clique com a maquete;
- ambiencia 3D leve por bioma entrou como particulas/rings em balanced/ultra;
- smokes empacotados passaram: `smoke-3d-editor-gizmo`, `smoke-2d-token-drag`, `smoke-2d-spam-stability`, `smoke-3d-wheel`;
- proxima frente: biblioteca GLB/schematic com importacao, preview 3D por subnode, recorte de variantes, brush, Ctrl+C/Ctrl+V real e VFX de bioma ancorado no tabuleiro.

Checkpoint 2026-05-20 21:38:

- `release/win-unpacked/RPG FUSHI.exe` atualizado;
- toolbar inferior do editor 3D foi removida para nao poluir a captura do mestre; controles `M/G/E` ficam no topo quando `3D GM` esta ativo;
- `Ctrl+scroll` no canvas 3D escala o objeto selecionado uniformemente/proporcionalmente e atualiza a sessao;
- `Ctrl+Z` desfaz snapshots de objetos da cena, cobrindo criacao, remocao, visibilidade, cor e ajustes 3D;
- camera via teclado ficou continua por frame, menos em blocos; `W/S` foram invertidos para bater melhor com a sensacao da camera;
- painel OBJ agora separa `Biblioteca OBJ` e `Cena atual`; a cena atual mostra preview/nome/visibilidade e esconde controles grandes em `Avancado`;
- objetos GLB recebem tint sutil por paleta de cor sem destruir material original em cache, pois materiais continuam clonados por instancia;
- mapas `praia_litoral_oceano` receberam primeiro teste de agua: linhas de onda, vortices e spray 2D + wakes/rings 3D no floor;
- smokes do exe empacotado passaram: editor gizmo com `Ctrl+scroll`/`Ctrl+Z`, token drag, 3D wheel e spam stability.

Checkpoint 2026-05-21 01:20:

- `release/win-unpacked/RPG FUSHI.exe` atualizado novamente;
- a cor de objeto nao deve mais ser usada como tint destrutivo do GLB real: ela virou `Cor do marcador`, para selecao/aura e UI;
- `object.color` saiu da chave de runtime dos GLBs, entao mudar swatch nao recria/remonta navio, ent, cidade etc.;
- placeholders de agua por linhas/vortices procedurais foram removidos;
- mapas aquaticos abertos, com destaque para `Alto Mar`, agora recebem uma superficie 3D com `three/addons/objects/Water.js` e normal map oficial do Three.js;
- a agua 3D fica acima do floor do mapa e tem cortinas animadas nas bordas para comecar a sensacao de agua escorrendo para fora do tabuleiro;
- o 2D ganhou camada texturizada de caustics via Pixi, em vez de ondas desenhadas manualmente;
- smokes do exe empacotado passaram e um teste extra confirmou `waterSurface=loaded`, troca repetida de swatches sem erro de console e mapa carregado.

Checkpoint 2026-05-21 02:50:

- `release/win-unpacked/RPG FUSHI.exe` atualizado novamente;
- a superficie Water.js foi removida porque ficava opaca demais, cobria o mapa e tinha custo maior do que o necessario para a RX 580;
- `Tabletop3DStage` agora usa um shader Three proprio de agua/correnteza com normal/caustics em additive blending, alpha baixo e geometria reduzida;
- `TabletopFxStage` nao usa mais `DisplacementFilter` na agua 2D; a correnteza e feita com duas `TilingSprite`s leves, em opacidade sutil, para preservar o topdown;
- o canvas WebGL do `3D GM` passou a limpar com alpha 0, deixando o fundo cinematografico por bioma aparecer atras da maquete;
- foi criada `public/assets/biomes/8-biomas` com um mapa topdown generico SVG para cada bioma principal, mais `neutral`, gerado por `scripts/generate-biome-cinematic-assets.mjs`;
- `src/rendering/biomeCinematicAssets.ts` resolve fundo/acento/cor de vazio por bioma, e `TabletopBoard` aplica isso no viewport e na camada 3D;
- `low` continua com fundo preto, enquanto `balanced/ultra` usam os fundos de bioma;
- corrigido path CSS empacotado (`dist/assets/assets/...`) via `resolveRuntimeCssAssetUrl`;
- smokes sequenciais do exe empacotado passaram: spam 2D, editor 3D/gizmo, wheel/camera 3D e drag de token.

Checkpoint 2026-05-21 15:34:

- `release/win-unpacked/RPG FUSHI.exe` atualizado novamente;
- `low` permanece com fundo preto para performance/legibilidade;
- `balanced` permanece com o fundo leve atual de bioma;
- `ultra` agora carrega fundos raster JPG 2048x1280 em `public/assets/biomes/8-biomas-ultra`;
- os JPGs finais entram no pacote em `dist/assets/biomes/8-biomas-ultra` e foram validados no exe via CSS resolvido dentro de `app.asar/dist`;
- a geracao fica documentada em `scripts/generate-ultra-biome-textures.ps1` e `public/assets/biomes/8-biomas-ultra/SOURCES.md`;
- as fontes usadas combinam arte local FUSHI/MUN_REWORK com materiais CC0 da Poly Haven, ambientCG e Wikimedia Commons;
- objetivo visual desta etapa: deixar o ultra com fundo de bioma mais cinematografico e texturizado sem transformar tudo em shader pesado, mantendo compatibilidade com maquina alvo RX 580 8GB;
- smoke especifico confirmou `rootQuality=ultra`, `boardQuality=ultra`, `--tabletop-biome-backdrop` apontando para `8-biomas-ultra`, imagem topdown carregada e sem tela branca;
- smokes 2D de spam/token e camera 3D por wheel continuaram estaveis depois do rebuild;
- ZIP nao foi recriado.

Checkpoint 2026-05-21 20:26:

- `release/win-unpacked/RPG FUSHI.exe` atualizado;
- os fundos ultra foram trocados por imagens novas geradas para os biomas, sem usar thumbs/topdowns existentes como fonte visual;
- `public/assets/biomes/8-biomas-ultra/SOURCES.md` agora registra o batch de geracao e deixa claro que o script antigo baseado em MUN_REWORK e apenas referencia historica;
- a camada Pixi 2D deixou de desenhar pulso circular, aneis, riscos e motes genericos; ela so entra para agua oceanica sutil e clima explicito;
- a camada Three 3D deixou de criar `Points` quadrados e aneis ambientais, que eram os principais quadradinhos/riscos vistos pelo usuario;
- o visual 3D de oceano ficou mais limpo: fundo cinematico novo atras da maquete, sem particulas quadradas;
- foram baixados assets reais CC0 para a proxima fase de VFX: Kenney Smoke Particles e Kenney Particle Pack em `C:\RPG FUSHI\RPG-FUSHI\VFX_ASSETS_INBOX\vfx\kenney`;
- `docs/VFX_LIBRARY_RESEARCH.md` foi atualizado com Kenney, three.quarks, three-nebula e Effekseer como caminho para parar de hand-rollar efeitos complexos;
- proxima direcao para agua/lava/cachoeira: usar sprite sheets/flipbooks/assets baked ou ferramentas como Blender/Effekseer; shader proprio so quando for medido e necessario;
- smokes confirmados no exe: token drag e spam 2D estaveis, sem tela branca; camera 3D carregou floor texture e nao gerou erro de console;
- ZIP nao foi recriado.

Limite consciente da agua atual:

- a agua atual agora preserva o mapa e performa melhor, mas ainda nao e um sistema completo de fluido/particula;
- falta splash real com sprites/VFX dedicados, correnteza direcional por mapa, interacao com objetos/tokens e presets editaveis de agua/lava/vento;
- proximos passos recomendados: criar `WaterVfxPreset` por mapa, separar agua como objeto/volume editavel, adicionar biblioteca de texturas/sprites de splash licenciadas e ligar os fundos genericos aos mapas/topdowns oficiais quando cada regiao estiver pronta.

Checkpoint 2026-05-21 VFX asset-backed:

- subset CC0 da Kenney copiado para `public/assets/fx/kenney`;
- 2D Pixi recebeu perfis de sprite por bioma: espuma/foam, cinza, neve, fumaça, magia e brasas;
- 3D GM recebeu billboards com os mesmos sprites, sem `Points` quadrados nem riscos ambientais;
- bioma oceano em ultra agora usa plano `Water` do Three.js por baixo/fora do board e overlay de correnteza mais transparente sobre o mapa;
- manter a agua atual como ponte tecnica, nao como efeito final premium. O salto real de agua/lava/cachoeira deve vir de flipbook/GLB/Effekseer/Blender bakeado, com importacao curada.

## Direcao GLB/schematic real

Para assets baixados de Sketchfab/lojas 3D, preferir `.glb` como formato principal de runtime do app. Usar `.glb` 1k para muitos objetos repetidos e `.glb` 2k para pecas importantes/cinematicas. Manter `.fbx` apenas como fonte/archive quando for necessario reprocessar em Blender ou ferramenta externa.

O armazem futuro deve funcionar assim:

- importar um GLB/gltf para uma biblioteca por pasta, como `Objetos/Floresta`, `Objetos/Ruina`, `Dominios`, `FX`;
- inspecionar nodes/meshes do arquivo e mostrar variantes internas;
- permitir recortar um subnode ou grupo de subnodes e salvar como preset proprio;
- colocar presets livremente no tabuleiro com posicao, rotacao, escala e camada;
- Ctrl+C/Ctrl+V duplica a instancia selecionada, mantendo preset e ajustes;
- brush espalha multiplas instancias, util para arvores, pedras e ruinas;
- o grid vira referencia/barreira/colisao opcional, nao a prisao visual do objeto;
- multiplayer sincroniza instancias e visibilidade (`players` ou `gm-only`) sem depender de reload da maquete.

O fundo fora do tabuleiro tambem precisa evoluir. Em vez de preto generico, cada bioma deve poder ter ambiente visual: nevoa, chuva, vento, folhas, lava, agua, cinzas, brilho, profundidade e parallax leve, visivel tambem para jogadores em topdown quando o mestre habilitar.

Fase 1:

- criar `Tabletop3DStage` com plano do mapa usando `map.image`;
- camera ortografica topdown;
- sincronizar tamanho/posicao com board atual;
- renderizar apenas em `ultra` primeiro.

Fase 2:

- criar runtime `Scene3DObjectInstance`;
- salvar instancias em `scene.objects3d` ou expandir `TabletopBoardObject` com `position3d`;
- nao prender em celula; usar coordenada normalizada do mapa;
- manter compatibilidade com objetos antigos.

Fase 3:

- criar editor Axiom-lite para mestre;
- colocar/mover/rotacionar/escalar/duplicar/remover;
- biblioteca de variantes do GLB de arvores.

Fase 4:

- migrar raio critico para evento ancorado no floor;
- criar decal de rachadura/queimado;
- manter camada fullscreen so como camera shake/flash/time freeze.

Fase 5:

- clima e ambiente por bioma: chuva, agua, lava, vento, nevoa, cinzas;
- todos ancorados no plano do tabuleiro e com fallback para `balanced/low`.
