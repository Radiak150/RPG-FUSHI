# Roadmap VFX e Topdown Vivo

Plano tecnico para elevar o visual do RPG FUSHI sem transformar a mesa em uma engine nova e sem quebrar logica de jogo.

Complemento essencial para a proxima build: ver `docs/MAQUETE_3D_TABLETOP_CONTEXT.md`.

O objetivo correto para o ultra e maquete 3D topdown: o mapa 2D vira o floor da cena 3D, a camera fica acima, e VFX/props ficam ancorados nesse plano. Overlays fullscreen continuam permitidos para dramatizacao, mas o efeito principal precisa afetar o tabuleiro.

## Norte

Toda evolucao visual deve seguir tres regras:

1. VFX nao altera regra, permissao, multiplayer ou persistencia sozinho.
2. VFX entra por camada desacoplada, com modo de qualidade e fallback.
3. Assets externos entram com fonte, licenca, tamanho e motivo registrados.

## Fase 0 - Release e estabilidade

Objetivo: garantir que toda mudanca chegue ao app real que o usuario testa.

- Manter `npm run release:zip` como comando padrao de entrega.
- Gerar `BUILD-INFO.txt` dentro do `win-unpacked` e do ZIP.
- Confirmar `release\win-unpacked\RPG FUSHI.exe` apos cada build relevante.
- Evitar duas instancias iguais conflitando no mesmo perfil.
- Usar launcher multi-instancia apenas para teste local.

## Fase 1 - Identidade por bioma

Objetivo: remover sensacao de fundo generico.

- Cada mapa/topdown deve carregar um `biomeVisualPreset`.
- Preset controla vinheta, luz, particulas leves, cor de ambiente, nevoa e intensidade.
- O fundo do tabuleiro deve responder ao bioma do mapa atual.
- Interludio de entrada/saida deve usar o mesmo preset do mapa.

Exemplos:

- Veu Cinzento: frio mineral, nevoa baixa, ciano fraco, poeira cinza.
- Praia/litoral: luz mais aberta, agua viva, umidade, reflexo sutil.
- Floresta mistica: particulas organicas, glow verde/azul controlado.
- Montanha/ruina: vento, poeira, sombras duras, pedra fria.

## Fase 2 - Clima e particulas 2D

Objetivo: dar vida constante com custo baixo.

Tecnica recomendada:

- PixiJS como canvas overlay.
- `ParticleContainer`/`Particle` nativos do Pixi 8 para chuva, neve, cinza, fagulha, poeira, folhas e bolhas.
- `pixi-filters` para glow, bloom leve, noise, blur e displacement.

Primeiros presets:

- `rain-light`
- `rain-heavy`
- `mist-low`
- `ash-drift`
- `embers`
- `fushi-sparks`
- `water-surface-soft`

Regras:

- `low` desliga particulas continuas.
- `balanced` usa poucos emissores.
- `ultra` aumenta densidade e filtros.
- Nunca bloquear pointer/input da mesa.

## Fase 3 - Agua, lava e superficies vivas

Objetivo: topdown parecer vivo sem virar 3D total.

Abordagem segura:

- Mascara 2D por area do mapa para agua/lava/nevoa.
- Displacement animado apenas dentro da mascara.
- Normal/noise texture leve para movimento.
- Reflexo falso e highlight em overlay, sem mexer na imagem base.

Para agua muito importante:

- Testar Three.js `Water` apenas em cena especial ou preview, nao em todos os mapas.
- Preferir Pixi displacement no tabletop comum por ser mais barato e simples de encaixar.

## Fase 3.5 - Maquete 3D topdown

Objetivo: fazer o tabuleiro parecer uma peca 3D viva, mantendo a arte 2D autoral como base.

- Criar `Tabletop3DStage` em modo `ultra`.
- Renderizar `map.image` como textura de um plano/floor.
- Usar camera ortografica topdown.
- Sincronizar camera/zoom/scroll com o board atual.
- Renderizar props 3D e VFX no mesmo sistema de coordenadas do mapa.
- Manter React/HUD e logicas atuais por cima.
- Usar fullscreen apenas para flash/camera shake/time freeze, nao como substituto do impacto no mapa.

Editor mestre desejado:

- biblioteca de modelos;
- posicionamento livre;
- snap opcional no grid;
- mover/rotacionar/escalar;
- duplicar/copiar/cortar/apagar;
- brush para espalhar arvores, pedras, props;
- controle de visibilidade public/gm;
- regras de oclusao para token nao sumir atras de objeto.

## Fase 4 - Impactos e eventos cinematograficos

Objetivo: efeitos raros podem ser muito mais fortes.

Casos:

- sucesso critico d20;
- falha critica d20;
- raio no mapa;
- explosao;
- portal;
- dominio;
- boss intro;
- evento cataclismico de historia.

Tecnica:

- Three.js para efeito 3D isolado acima da mesa.
- `three.quarks` como candidato principal para particulas 3D com editor e JSON.
- `three-nebula` como alternativa caso o peso/integracao de `three.quarks` fique ruim.
- Post-processing Three apenas nas cinematicas, nao como filtro global permanente.

Para d20:

- `1`: wash vermelho curto, tremor, ruido, queda de luz, eco sonoro grave.
- `20`: flash direcional, raios vermelho/preto, onda de choque, cracks cosmeticos, particulas puxando para o dado.

## Fase 5 - Decals e marcas persistentes

Objetivo: eventos deixam memoria visual quando o mestre quiser.

Tipos:

- rachadura;
- queimado;
- molhado;
- gelo;
- sangue/sombra;
- marca FUSHI;
- area de maldicao;
- runa temporaria.

Implementacao:

- Decal cosmetico salvo como entidade leve no estado do mapa.
- Render em overlay acima do mapa base e abaixo dos tokens.
- Mestre pode remover/limpar por camada.
- Multiplayer recebe apenas decals publicos.

## Fase 6 - Props e objetos 3D

Objetivo: enriquecer tabuleiro e inventario sem pesar entrada do app.

Pipeline:

1. Escolher asset `.glb` ou `.gltf`.
2. Registrar `SOURCE.md` com link, autor, licenca e motivo.
3. Otimizar tamanho/textura.
4. Criar preview 2D ou thumbnail.
5. Carregar sob demanda quando objeto estiver visivel.

Observacao nova: packs GLB nao devem virar um "bloco" unico preso a celula. Para packs como `low_poly_forest_tree_pack.glb`, separar/instanciar sub-objetos individuais: arvore A, arvore B, tronco, rocha, arbusto etc. O mestre precisa posicionar esses objetos como parte do cenario 3D da maquete.

Fontes prioritarias:

- Quaternius para props fantasy, ruinas, vila, natureza e humanoides stylized.
- Poly Haven para HDRIs, PBR e materiais de alto nivel.
- ambientCG para materiais PBR CC0.
- Khronos glTF Sample Assets para testes tecnicos de loader.
- Sketchfab apenas caso a caso, com licenca e atribuicao conferidas por asset.

## Fase 7 - NPCs e simulacao

Objetivo futuro: NPCs reagirem ao mundo com coerencia.

Antes de automatizar:

- base;
- historia;
- faccao;
- rotina;
- recursos;
- segredo;
- objetivo;
- relacao com regioes e eventos;
- nivel de informacao publica/privada.

A simulacao deve consumir dados oficiais da campanha. Nao gerar "logica fantasma".

## Fontes tecnicas avaliadas

- PixiJS: https://pixijs.com/
- pixi-filters: https://github.com/pixijs/filters
- PixiJS ParticleContainer: https://pixijs.com/8.x/guides/components/scene-objects/particle-container
- Three.js: https://threejs.org/
- Three.js Water: https://threejs.org/docs/pages/Water.html
- Three.js post-processing: https://threejs.org/manual/en/post-processing.html
- three.quarks: https://github.com/Alchemist0823/three.quarks
- Quaternius FAQ/licenca: https://quaternius.com/faq.html
- Poly Haven licenca: https://polyhaven.com/license
- ambientCG licenca: https://docs.ambientcg.com/license/
- Khronos glTF Sample Assets: https://github.com/KhronosGroup/glTF-Sample-Assets
