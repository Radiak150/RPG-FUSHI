# Arquitetura VFX / Render FUSHI

Este documento registra a direcao tecnica para transformar o FUSHI Tabletop em uma mesa visualmente viva sem quebrar a logica ja estabilizada de MUN, MAP, campanhas, desktop e multiplayer.

Complemento direto: ver `docs/VFX_TOPDOWN_ROADMAP.md` para fases de clima, agua, decals, impactos criticos, props 3D e continuidade.

## Norte tecnico

O app nao deve virar uma engine nova do zero. A base correta e:

- React/Vite continua controlando UI, estado, fluxo, paineis, modais, fichas, biblioteca e multiplayer.
- PixiJS entra como camada 2D viva para MAP/MUN: particulas, glow, clima, auras, distorcao, fog, rotas e overlays.
- Three.js entra apenas para momentos especiais: dados 3D, dominios, portais, bosses, cinematics e cenas lendarias.
- Howler.js entra para audio real com loops e SFX, nao osciladores sinteticos.
- Assets finais painterly continuam vindo do mestre/geracao visual externa.

## Por que nao DirectX `.fx`

Electron/React roda em Chromium. O caminho natural e WebGL/WebGPU, nao DirectX direto. Shaders `.fx`/HLSL de DirectX podem servir como referencia conceitual, mas precisariam ser portados para GLSL/WGSL.

Para este app, o caminho pratico e eficiente e:

- GLSL em PixiJS/Three.js para filtros e shaders.
- Pixi filters para glow, blur, displacement, noise e ajustes 2D.
- Three.js para cenas 3D isoladas, sem substituir o tabletop inteiro.

## Camadas propostas

### UI React

Responsavel por:

- Plataforma;
- fichas;
- biblioteca;
- configuracoes;
- chat/log;
- modais;
- MUN/MAP panels;
- multiplayer/local session flow.

Nunca deve depender diretamente de filesystem nem WebSocket bruto. Deve falar com providers/adapters.

### MAP 2D com Pixi

Entrada ideal:

- mapa base;
- grid;
- tokens;
- estado de cena;
- biome/theme;
- weather/fushi state;
- quality mode.

Camadas:

1. mapa base;
2. textura/tonalizacao de bioma;
3. grid;
4. tokens;
5. auras/areas;
6. particulas;
7. clima;
8. highlights de selecao;
9. overlay de eventos.

Primeira versao segura: adicionar `FxStage` como overlay nao interativo em cima/baixo do board atual, sem mover token logic para Pixi.

### MUN visual

Entrada ideal:

- `mun_base_ilha_sem_labels.png`;
- regioes/biomas como paths SVG precisos;
- pontos de interesse numerados 1-60;
- rotas oficiais;
- estado publico/privado;
- descobertas por player;
- presenca de grupos/NPCs.

Camadas:

1. mapa limpo da ilha;
2. masks de bioma;
3. hover/selecionado;
4. rotas;
5. POIs;
6. badges de grupos/NPCs;
7. popover do local.

Meta: parar de parecer "bolinhas em template" e virar mapa mundi navegavel.

### Three.js

Usar para:

- dado 3D e impacto de rolagem;
- dominios lendarios;
- boss intro;
- portais;
- dragao/FUSHI;
- eventos cataclismicos;
- cenas especiais com camera.

Nao usar para:

- todos os tokens;
- toda UI;
- todo MUN;
- todo MAP comum.

## Fases de implementacao

### Fase 1 - Fundacao segura

- Instalar e encapsular Pixi/Three sem mudar logica da mesa.
- Criar `VisualQualityMode` ja conectado a low/balanced/ultra.
- Criar `FxStage` com pointer-events none.
- Criar presets por bioma.
- Documentar assets esperados.

Status atual:

- Dependencias instaladas: PixiJS, pixi-filters, Three.js, Howler.js, vite-plugin-glsl.
- Presets por bioma criados em `src/rendering/biomeVisualPresets.ts`.
- Primeira camada Pixi segura criada em `src/rendering/pixi/TabletopFxStage.tsx`.
- `TabletopFxStage` foi integrada ao MAP como overlay nao interativo; nao altera tokens, grid, permissao, multiplayer nem persistencia.
- Modo `low` desliga a camada Pixi; `balanced` e `ultra` ativam com densidade diferente.

### Fase 2 - MUN profissional

- Substituir shapes genericas por masks reais de bioma.
- Usar a geografia dos 60 pontos como fonte oficial.
- Trocar POI numerico por card/thumbnail quando asset existir.
- Deixar `CONSTRUCAO` quando asset ainda nao existir.
- Corrigir editor para nao atravessar o mapa.

### Fase 3 - MAP vivo

- Adicionar particulas por bioma.
- Adicionar textura/tonalizacao por mapa.
- Adicionar efeitos de selecao/visibilidade/permissao.
- Adicionar "CAM GM" com sync de camera real para players.

### Fase 4 - Interludio cinematografico

- Entrada/saida com particulas por bioma.
- Zoom/iris/portal sobre o tabuleiro.
- Transicao entre mapa atual e interludio.
- Final do interludio devolve para MAP.

### Fase 5 - Dados e feedback critico

- Dado 3D com Three.
- 1 = falha critica vermelha / choque curto.
- 20 = brilho dourado / impacto forte.
- Resultados comuns = feedback elegante, sem poluir.

### Fase 6 - Dominios e boss fights

- Criar runtime de cinematic 3D isolada.
- Carregar assets 3D/GLB quando existirem.
- Encerrar cinematic e voltar para tabletop normal.

## Regras de seguranca funcional

- Nenhum VFX pode alterar estado de jogo sozinho.
- Nenhum efeito visual pode salvar placeholder permanente.
- Multiplayer recebe apenas estado publico filtrado.
- Desktop e web precisam usar os mesmos providers.
- Modo Low precisa desligar efeitos caros.
- Modo Ultra pode ser bonito, mas nunca bloquear input do mestre.

## Bibliotecas candidatas

- PixiJS: render 2D WebGL/WebGPU.
- pixi-filters: glow, blur, displacement, color matrix e filtros 2D.
- PixiJS ParticleContainer: particulas 2D compativeis com Pixi 8.
- Three.js: cenas 3D e shaders.
- @react-three/fiber: usar Three em React quando fizer sentido.
- Howler.js: audio real, loops e SFX.
- vite-plugin-glsl: importar shaders GLSL como arquivos.
- @3d-dice/dice-box: avaliar para dado 3D antes de criar do zero.

## Criterio de sucesso

O app deve continuar funcionando igual, mas a sensacao deve mudar:

- MUN vira mapa de campanha real.
- MAP parece palco vivo.
- Dado tem peso.
- Interludio parece entrada de cena.
- Bioma tem identidade.
- Boss/domino pode quebrar o tabletop comum por alguns segundos e virar cinematic.
