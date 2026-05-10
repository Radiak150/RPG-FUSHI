# Public and Private State

## Objetivo

Preparar o app para multiplayer sem implementar servidor ainda.

O modulo `src/lib/session/publicState.ts` cria a primeira separacao entre:

- estado completo do mestre;
- estado sanitizado para cada jogador.

## Estado do mestre

O mestre pode receber/ver:

- MUN completo;
- mapas em preparacao;
- `mestreCurrentMapId`;
- NPCs ocultos;
- notas do mestre;
- logs tecnicos;
- simulacao privada;
- locais ocultos;
- segredos e relacoes internas.

## Estado publico do jogador

O jogador deve receber/ver apenas:

- `playerCurrentMapId`;
- mapa ativo para jogadores;
- tokens publicos no mapa ativo;
- tokens controlados por ele;
- proprio perfil sem senha;
- logs publicos;
- relogio/dados mundanos liberados.

## Nunca enviar ao jogador

- MUN completo;
- mapas em preview/preparacao;
- NPCs ocultos;
- logs tecnicos;
- notas do mestre;
- locais ocultos;
- segredos de NPC;
- simulacao privada;
- `mestreCurrentMapId` quando for preview/preparacao.

## Funcoes

- `buildMasterState(campaignState)`: retorna uma copia do estado completo.
- `buildPublicPlayerState(campaignState, playerId)`: cria estado publico para um jogador.
- `sanitizeStateForPlayer(state, playerId)`: funcao base de sanitizacao.

## Uso futuro no multiplayer

No backend WebSocket, o servidor deve usar a mesma ideia:

```text
estado completo -> sanitizeStateForPlayer -> envio para jogador
estado completo -> buildMasterState -> envio para mestre
```

Essa separacao precisa ficar no servidor no futuro. Esconder botoes na interface nao e seguranca suficiente.
