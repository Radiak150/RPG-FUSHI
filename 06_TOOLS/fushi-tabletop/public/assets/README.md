# Assets Locais

Use `public/assets/` como raiz de todos os arquivos reais da mesa. Tudo que ficar aqui pode ser referenciado direto por URL, sem backend.

## Estrutura canonica

- `public/assets/maps/`
  - Mapas PNG ou WebP usados no topdown.
  - Organize por bioma ou cena quando fizer sentido.
  - Exemplo: `public/assets/maps/planicie/planicie_aberta.webp`
- `public/assets/transitions/`
  - Imagens ou videos de interludio.
  - Exemplo: `public/assets/transitions/planicie/saida_caverna.png`
  - Exemplo: `public/assets/transitions/planicie/saida_caverna.webm`
- `public/assets/videos/`
  - Videos soltos de apoio, cinematicas gerais ou placeholders maiores.
  - Exemplo: `public/assets/videos/ilha/despertar.mp4`
- `public/assets/music/`
  - Trilhas musicais em MP3 ou OGG.
  - Exemplo: `public/assets/music/planicie/respirar_na_relva.ogg`
- `public/assets/ambience/`
  - Loops de ambiente em MP3 ou OGG.
  - Exemplo: `public/assets/ambience/planicie/vento_leve.mp3`
- `public/assets/tokens/`
  - Tokens PNG/WebP com fundo recortado.
  - Exemplo: `public/assets/tokens/players/fragmento_01.png`
- `public/assets/items/`
  - Imagens de itens para inventario, pickup e biblioteca futura.
  - Exemplo: `public/assets/items/fragmento_desconhecido.webp`
- `public/assets/fx/`
  - Sprites, overlays, flashs ou elementos visuais auxiliares.
  - Exemplo: `public/assets/fx/impacto_leve.png`

## Formatos recomendados

- Mapas: `PNG` ou `WebP`
- Transitions estaticas: `PNG` ou `WebP`
- Videos: `MP4` ou `WebM`
- Musicas e ambience: `MP3` ou `OGG`
- Tokens e itens: `PNG` ou `WebP`

## Como referenciar nos dados

Arquivos dentro de `public/` devem ser referenciados a partir de `/assets/...`.

### Mapa

```ts
image: '/assets/maps/planicie/planicie_aberta.webp'
imageUrl: '/assets/maps/planicie/planicie_aberta.webp'
thumbnailUrl: '/assets/maps/planicie/planicie_aberta.webp'
```

### Transition com imagem

```ts
assetUrl: '/assets/transitions/planicie/saida_caverna.png'
thumbnailUrl: '/assets/transitions/planicie/saida_caverna.png'
```

### Transition com video

```ts
assetUrl: '/assets/transitions/planicie/saida_caverna.webm'
thumbnailUrl: '/assets/transitions/planicie/saida_caverna_poster.png'
```

### Musica

```ts
source: '/assets/music/planicie/respirar_na_relva.ogg'
```

### Ambience

```ts
source: '/assets/ambience/planicie/vento_leve.mp3'
```

### Token

```ts
tokenImageUrl: '/assets/tokens/players/fragmento_01.png'
topdownImageUrl: '/assets/tokens/players/fragmento_01_topdown.png'
```

### Item

```ts
imagemUrl: '/assets/items/fragmento_desconhecido.webp'
```

## Regras praticas

- Se quiser substituir um placeholder atual sem mexer em mocks, mantenha o mesmo nome e caminho.
- Se criar asset novo, atualize `assetUrl`, `thumbnailUrl`, `imageUrl`, `tokenImageUrl`, `topdownImageUrl` ou `source` no mock correspondente.
- Para videos de interludio, prefira ter poster separado em `thumbnailUrl`.
- O overlay de interludio trata `.mp4` e `.webm` como video automaticamente.
- Colocar o arquivo aqui nao ativa audio automaticamente.

## Observacao

Existe uma pasta antiga `public/assets/video/`. O caminho canonico novo passa a ser `public/assets/videos/`. Nao removi a pasta antiga para evitar quebrar referencias locais antigas, mas novas entradas devem usar `videos/`.
