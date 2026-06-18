# Object Layer Plan

Objetivo: permitir que o mestre coloque itens, props, perigos e objetivos sobre mapas topdown sem transformar esses elementos em personagens/tokens.

## Modelo

- `Token`: personagem, NPC, mob ou grupo que participa de controle/permissao.
- `Object`: item ou elemento de cena colocado no mapa.
- `Scene.objects`: fonte de verdade dos objetos posicionados na cena atual.
- `visibility`: `public` aparece para jogadores; `gm` fica apenas para o mestre.
- `renderMode`: `sprite` agora; `three` reservado para modelos 3D futuros.

## Fluxo V1

1. Mestre abre `OBJ`.
2. Escolhe um objeto da biblioteca.
3. Clica no mapa para posicionar.
4. O objeto fica salvo na cena/campanha.
5. Mestre pode selecionar, ocultar/mostrar para jogadores ou remover.

## Exemplo Implementado

- `Espada Selada`
- Asset: `/assets/objects/obj_espada_selada.svg`
- Uso: puzzle, recompensa, cena de espada emergindo do chao ou objetivo de encontro.

## Futuro Three.js

O `renderMode: three` deve ser usado como camada visual opcional, sem virar fonte de verdade. A persistencia continua sendo:

- `id`
- `cell`
- `size/customSize`
- `visibility`
- `modelUrl`
- `linkedItemId`

Assim o objeto pode renderizar como sprite no modo baixo e como modelo 3D no modo ultra.
