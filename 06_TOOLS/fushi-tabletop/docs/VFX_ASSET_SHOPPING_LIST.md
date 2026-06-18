# Lista de Assets para o Salto Visual FUSHI

Este e o checklist do que o mestre precisa buscar/criar para eu integrar no app. O objetivo e separar o que depende de arte final do que eu consigo resolver com codigo.

Pasta raiz sugerida para entrega:

`C:\RPG FUSHI\RPG-FUSHI\VFX_ASSETS_INBOX`

## 1. MUN - Mapa mundi

### Obrigatorio

- `mun/base/mun_base_ilha_sem_labels.png`
  - Ja existe.
  - Deve ser a realidade geografica principal.

- `mun/reference/mun_base_ilha_com_marcacao.png`
  - Ja existe.
  - Usar como referencia de biomas e POIs.

- `mun/reference/mun_base_ilha_com_rotas_interligadas.png`
  - Ja existe.
  - Usar como referencia de rotas oficiais.

### Para ficar perfeito

- `mun/pois/poi_01.png` ate `mun/pois/poi_60.png`
  - Mini imagem/card de cada ponto de interesse.
  - Formato ideal: PNG ou WEBP, 512x512 ou 768x768.
  - Sem texto dentro da imagem.
  - Pode ser pintura/cinematic establishing shot.
  - Nome do arquivo precisa manter o numero.

- `mun/biomes/biome_planicie.png`
- `mun/biomes/biome_praia.png`
- `mun/biomes/biome_montanha.png`
- `mun/biomes/biome_vulcao.png`
- `mun/biomes/biome_gelo.png`
- `mun/biomes/biome_ruinas.png`
- `mun/biomes/biome_mistica.png`
- `mun/biomes/biome_veu.png`

Uso: tela interna do bioma quando o mestre entra nele.

Como procurar/criar:

- "fantasy world map point of interest cinematic [forest/village/volcano/ruins] no text"
- "dark fantasy location concept art no characters"
- "isometric fantasy location thumbnail no labels"

Evitar:

- imagem com logo/marca;
- texto embutido;
- baixa resolucao;
- asset claramente de IP conhecido se for publicar/comercializar.

## 2. MAP - Mapas de mesa/topdown

Para cada POI que sera jogavel no tabletop:

`maps/poi_XX/map_main.png`

Ideal:

- 4K ou maior se possivel.
- Sem grid embutido, porque o app ja tem grid.
- Topdown, battlemap ou vista mesa.
- Proporcao livre, mas preferir 16:9, 4:3 ou quadrado grande.

Se houver submapas:

`maps/poi_58/map_main.png`
`maps/poi_58/sub_cachoeira.png`
`maps/poi_58/sub_dungeon_entrada.png`
`maps/poi_58/sub_dungeon_interior.png`

Como procurar/criar:

- "fantasy battlemap no grid waterfall cave 4k"
- "volcano dungeon battlemap no grid"
- "frozen ruins battlemap no grid"
- "mystic forest clearing battlemap no grid"

## 3. Interludios por bioma

Pasta:

`interludes/[biome]/`

Para cada bioma, ideal:

- `intro.mp4` ou `intro.webm` curto, 5-12s.
- `still.png` fallback.
- `transition_overlay.png` opcional com alpha.

Biomas:

- planicie/floresta inicial;
- praia/litoral/oceano;
- montanhas/vazio sereno;
- vulcao/terras cinzentas;
- regiao congelada/neve;
- ruinas antigas;
- floresta mistica;
- vale cinzento/veu cinza.

Como procurar/criar:

- "looping fantasy forest cinematic transition"
- "volcanic ash fantasy cinematic loop"
- "snow storm fantasy loop"
- "ancient ruins purple magic loop"

## 4. Texturas e sprites VFX

Pasta:

`vfx/textures/`

Necessarios:

- `smoke_soft.png` alpha;
- `ember.png` alpha;
- `spark_gold.png` alpha;
- `leaf_particle.png` alpha;
- `snowflake.png` alpha;
- `rain_streak.png` alpha;
- `mist.png` alpha;
- `magic_noise.png`;
- `water_caustics_loop.png` ou spritesheet;
- `lava_noise.png`;
- `fushi_glow.png`;
- `fushi_dark_glitch.png`.

Como procurar:

- "particle sprite alpha png smoke"
- "ember particle transparent png"
- "leaf particle alpha sprite"
- "snow particle alpha png"
- "water caustics seamless texture"
- "lava noise seamless texture"
- "magic noise texture seamless"

Licenca:

- procurar assets CC0, comerciais, comprados, ou gerados por voce.
- salvar junto um `LICENSE.txt` quando baixar de pacote.

## 5. Tokens e personagens

Pasta:

`characters/[id]/`

Para NPC importante:

- `portrait.png` - ficha/card.
- `token.png` - token usado no MAP.
- `topdown.png` - se existir topdown real.
- `silhouette.png` - opcional para oculto/rumor.

Como procurar/criar:

- retrato: cinematic portrait, bust, no text.
- token: circular or transparent character token, topdown if possible.
- topdown: fantasy character topdown token transparent background.

Regra:

- Se nao houver `token.png`, o app usa portrait como fallback visual.
- Nao usar placeholder permanente.

## 6. UI e icones

Pasta:

`ui/`

Necessarios:

- icone MAP;
- icone MUN;
- icone NPC;
- icone MSC/audio;
- icone ficha;
- icone log;
- icone configuracoes;
- moldura de card;
- selo FUSHI;
- marcador de POI;
- marcador de dungeon;
- marcador de rota secreta;
- marcador de grupo/player.

Formato ideal:

- SVG para icones limpos.
- PNG/WebP para molduras texturizadas.

## 7. Audio

Pasta:

`audio/biomes/`

Loops:

- `planicie_ambience.ogg`
- `praia_mar.ogg`
- `montanha_vento.ogg`
- `vulcao_lava.ogg`
- `gelo_neve.ogg`
- `ruinas_sussurros.ogg`
- `mistica_floresta.ogg`
- `veu_cinzento_tensao.ogg`

SFX:

- `dice_roll.ogg`
- `dice_critical_1.ogg`
- `dice_critical_20.ogg`
- `map_reveal.ogg`
- `interlude_in.ogg`
- `interlude_out.ogg`
- `domain_start.ogg`

Como procurar:

- "royalty free fantasy ambience loop forest ogg"
- "royalty free volcano lava ambience loop"
- "dice roll sfx fantasy"

## 8. 3D futuro

Pasta:

`3d/`

Para dominios/boss:

- GLB/GLTF de arena ou elemento central;
- textura HDRI/skybox;
- particulas/texturas;
- audio curto;
- imagem de fallback.

Exemplos:

- `domains/aureon/domain_tree.glb`
- `domains/jaxir/arena_shards.glb`
- `boss/dragon_fushi/dragon.glb`

Como procurar:

- "glb fantasy portal low poly"
- "glb magic circle"
- "glb fantasy dragon rigged"
- "HDRI dark fantasy sky"

## Ordem para voce produzir/baixar

1. POIs do MUN 1-60 em thumbnails.
2. Mapas topdown dos locais da primeira sessao.
3. Tokens/retratos dos NPCs que podem aparecer na primeira sessao.
4. Texturas VFX basicas: smoke, ember, mist, leaf, snow, rain.
5. Audio de ambiente dos 8 biomas.
6. Interludios curtos por bioma.
7. 3D/domains somente depois do tabletop estar estavel.

## Como me entregar

Coloque tudo em:

`C:\RPG FUSHI\RPG-FUSHI\VFX_ASSETS_INBOX`

Com esta estrutura:

```txt
VFX_ASSETS_INBOX/
  mun/
    pois/
    biomes/
    reference/
  maps/
  interludes/
  vfx/
    textures/
  characters/
  ui/
  audio/
  3d/
```

Depois me diga: "assets novos estao na inbox".

