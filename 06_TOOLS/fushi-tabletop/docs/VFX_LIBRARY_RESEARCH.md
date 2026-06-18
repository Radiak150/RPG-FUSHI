# Pesquisa de Bibliotecas VFX

Registro curto das bibliotecas recomendadas para o salto visual do FUSHI Tabletop.

## Escolha principal

### PixiJS

Uso no FUSHI:

- MAP 2D vivo;
- particulas;
- overlays;
- aura;
- rotas;
- glow;
- filtros de clima;
- fog/fushi/distorcao.

Motivo:

- Integracao direta com canvas/WebGL no browser/Electron.
- Mais adequado que Three para efeitos 2D frequentes sobre tabletop.

Links:

- https://pixijs.com/
- https://pixijs.com/8.x/guides

### pixi-filters

Uso no FUSHI:

- glow;
- blur;
- displacement;
- color matrix;
- glitch;
- ajustes de luz/sombra em overlays 2D.

Link:

- https://github.com/pixijs/filters

### PixiJS ParticleContainer

Uso no FUSHI:

- chuva;
- neve;
- brasas;
- folhas;
- poeira;
- particulas FUSHI;
- cinzas de vulcao.

Link:

- https://pixijs.com/8.x/guides/components/scene-objects/particle-container

Nota 2026-05-22:

- `@pixi/particle-emitter@5.0.10` foi avaliado, mas o pacote declara peer dependency para Pixi `<8` e causou erro real no exe com Pixi 8 (`updateLocalTransform is not a function`).
- Para o runtime atual, usar `ParticleContainer`/`Particle` nativos do Pixi 8 para VFX topdown ate existir uma lib externa comprovadamente compativel.

### Three.js

Uso no FUSHI:

- dado 3D;
- dominios;
- boss cinematics;
- portais;
- rochas/elementos 3D especiais;
- scenes que saem do tabletop comum.

Links:

- https://threejs.org/
- https://threejs.org/docs/

### React Three Fiber

Uso no FUSHI:

- integrar Three com React quando a cena 3D precisar ser componente.
- bom para overlays/portais/dado se a integracao ficar limpa.

Link:

- https://r3f.docs.pmnd.rs/getting-started/introduction

### Howler.js

Uso no FUSHI:

- loops de ambiente;
- musica;
- SFX;
- fade in/out;
- audio sprite se necessario.

Link:

- https://howlerjs.com/

### vite-plugin-glsl

Uso no FUSHI:

- importar shaders GLSL como arquivos.
- manter shaders fora de strings gigantes em TSX.

Link:

- https://github.com/UstymUkhman/vite-plugin-glsl

### @3d-dice/dice-box

Uso no FUSHI:

- avaliar para dado 3D antes de construir do zero.
- se ficar pesado, criar Three dice proprio mais simples.

Link:

- https://github.com/3d-dice/dice-box

## Regras para repos externos

Antes de clonar/usar qualquer repo:

1. Confirmar licenca.
2. Preferir pacote npm mantido.
3. Evitar repo abandonado se for virar dependencia central.
4. Java/C#/Unity servem como referencia de tecnica, nao como codigo plugavel.
5. Nao copiar shader/asset sem licenca.

## Recursos VFX reais encontrados

### Kenney Particle Pack / Smoke Particles

Status: baixado para inbox, ainda nao integrado ao runtime.

Caminho:

`C:\RPG FUSHI\RPG-FUSHI\VFX_ASSETS_INBOX\vfx\kenney`

Uso pretendido:

- substituir particulas quadradas/procedurais por sprites/flipbooks reais;
- fumaça, poeira, impacto, fogo, rastro, explosao leve;
- materia-prima para PixiJS e Three.js billboards.

Licenca:

- CC0 segundo as paginas dos assets e os `License.txt` dos zips.
- Pode usar em projeto pessoal/comercial; credito Kenney e opcional.

Links:

- https://kenney.nl/assets/smoke-particles
- https://kenney.nl/assets/particle-pack
- https://kenney.nl/support

### three.quarks

Status: candidato forte para a etapa de VFX 3D pronto/editor visual.

Uso pretendido:

- particulas 3D em Three.js com JSON/export;
- efeitos como fogo, lava spray, raios, impacto, nevoa e magia;
- melhor do que hand-roll constante em TSX quando o efeito precisar parecer VFX real.

Licenca:

- MIT no repo oficial.

Links:

- https://github.com/Alchemist0823/three.quarks
- https://quarks.art/

### three-nebula

Status: candidato secundario para sistema de particulas via JSON/editor.

Uso pretendido:

- particulas Three.js exportaveis em JSON;
- prototipar sistemas de neve, poeira, cinza, fogo e magia sem escrever tudo na mao.

Licenca:

- MIT.

Links:

- https://three-nebula.org/
- https://github.com/creativelifeform/three-nebula

### Effekseer

Status: referencia importante para VFX pronto/baked, especialmente se quisermos exportar sprite sheet/video ou usar runtime WebGL depois.

Uso pretendido:

- criar ou importar efeitos em ferramenta visual;
- exportar sprite sheet/video para Pixi quando runtime direto ficar pesado;
- possivel runtime WebGL, mas precisa prototipo isolado antes de entrar no app.

Links:

- https://effekseer.github.io/en/
- https://github.com/effekseer/EffekseerForWebGL

## Direcao decidida para agua/lava

Agua, lava e fluidos realmente bons nao devem ser feitos so com CSS/SVG ou linhas procedurais simples. A direcao correta e:

1. usar imagem/fundo cinematico gerado ou CC0 para a ambientacao geral;
2. usar textura/normal map para agua de baixo custo quando for apenas superficie;
3. usar sprites/flipbooks/efeitos prontos para splash, queda, vapor e particulas;
4. para cachoeira/lava complexa, preferir asset pronto/baked ou efeito exportado de ferramenta como Blender/Effekseer;
5. so transformar em shader proprio quando houver um motivo claro e performance medida.

## Estrategia de implementacao

1. Instalar apenas o minimo primeiro: PixiJS + Three + Howler.
2. Criar camada interna `rendering/` com adaptadores.
3. Integrar VFX por props/estado, nao misturar com regras de jogo.
4. Habilitar por `VisualQualityMode`.
5. Medir build/performance antes de encher de efeitos.

## Lista curta para decisao

- MAP/MUN vivo: PixiJS.
- Dados e dominios: Three.js.
- Audio: Howler.js.
- Shaders: GLSL com vite-plugin-glsl.
- Assets high-end: mestre gera/baixa e entrega na inbox.

## Checkpoint 2026-05-22 - VFX integrados

- Kenney Particle Pack e Smoke Particles agora possuem subset leve em `public/assets/fx/kenney`.
- `TabletopFxStage` usa sprites PNG transparentes e removeu a textura circular que parecia pulso no oceano 2D.
- `Tabletop3DStage` usa billboards 3D com os mesmos sprites no modo 3D GM.
- A agua global do oceano nao usa mais a grande superficie `Water.js` por tras do tabuleiro; ficou apenas overlay/cortina sutil para nao criar tres camadas visuais.
- A biblioteca de OBJ ganhou a aba `Animacoes`, com VFX 3D colocaveis/removiveis: fogo, nevoa, vento, agua, raio, folhas, lava e chuva.
- O impacto critico do d20 no 3D nao remonta mais o renderer; o efeito sincroniza dentro do loop Three e expira sozinho.
- Nao integrar pack enorme inteiro sem curadoria: cada efeito entra como subset leve, com build e smoke test.

## Checkpoint 2026-05-22 - Primeiro passo VFX premium

- Chuva e neve do MAP 2D agora usam `ParticleContainer`/`Particle` nativos do Pixi 8 com sprites Kenney CC0, em vez de linhas/circulos procedurais no ticker.
- `weather-rain` e `weather-snow` foram liberados como presets de clima na biblioteca da mesa.
- A fonte usada nesta etapa continua o subset local Kenney:
  - `public/assets/fx/kenney/SOURCE.md`
  - `https://kenney.nl/assets/particle-pack`
  - `https://kenney.nl/assets/smoke-particles`
- `@pixi/particle-emitter` foi removido da dependencia do app nesta etapa porque e compativel com Pixi 6/7, nao com Pixi 8. O smoke do exe reproduziu a incompatibilidade antes da troca.
- Para a proxima etapa 3D, manter pesquisa em `three.quarks` e Effekseer:
  - `three.quarks`: MIT, editor visual, JSON export, batched renderer.
  - `Effekseer`: ferramenta open-source para exportar animacoes 2D ou efeitos 3D; runtime WebGL MIT, mas precisa prototipo isolado antes de entrar no stage principal.

## Checkpoint 2026-05-22 - Objetos VFX colocaveis

- A aba `Animacoes` agora tem uma camada topdown propria em `TabletopObjectVfxLayer`, usando Pixi 8 e sprites PNG reais do subset Kenney para os objetos `vfx-*` colocados no mapa.
- O objetivo desta etapa foi tornar fogo, nevoa, vento, agua, raio, folhas, lava e chuva perceptiveis no MAP 2D, nao apenas no `3D GM`.
- A camada nova e `pointer-events: none`, fica separada da logica de token/drag/mapa, e os hitboxes transparentes dos objetos VFX voltaram a aceitar selecao.
- Smoke adicionado: `.codex-dev/smoke-object-vfx-layer.mjs`, que coloca `Coluna de Fogo`, valida canvas Pixi do objeto e confirma selecao do VFX.

## Checkpoint 2026-05-22 - Correcao visual dos VFX colocaveis

- O proxy HTML dos objetos `vfx-*` voltou a ser uma hitbox tecnica invisivel: sem badge, sem retangulo, sem outline e sem background herdado de `.tabletop-object--three`.
- `TabletopObjectVfxLayer` nao renderiza mais por cima do `3D GM`; no 3D, os VFX ficam apenas no renderer Three.
- A chuva topdown deixou de usar sprites circulares/luz que viravam aneis gigantes ao escalar a area. Agora usa sprites transparentes Kenney `trace_*`/`spark_*`, com tamanho maximo travado para nao virar mancha no mapa.
- O anel de selecao 3D dos VFX foi removido para nao criar circulos enormes quando uma chuva/nevoa e ampliada; o gizmo/editor continua fazendo a selecao tecnica.
