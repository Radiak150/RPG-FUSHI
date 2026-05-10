# Storage Adapter

## Estado atual

O app continua sendo um Vite/React rodando no navegador. A persistencia padrao ainda usa `localStorage` e `sessionStorage`, mas agora os principais modulos passam por `src/lib/storage/storageAdapter.ts`.

Nao houve mudanca visual nem mudanca de fluxo para o usuario.

## Chaves antigas preservadas

As chaves antigas continuam validas para manter compatibilidade com dados ja salvos:

- `fushi-tabletop:mesa-session:v1`
- `fushi-tabletop:mesa-session:v1:campaign:{campaignId}`
- `fushi-tabletop:asset-library:v1`
- `fushi-tabletop:asset-library:v1:campaign:{campaignId}`
- `fushi-tabletop:world-mundi:v1`
- `fushi-tabletop:world-mundi:v1:campaign:{campaignId}`
- `fushi-tabletop:access-control:v1`
- `fushi-tabletop:active-access-profile:v1`
- `fushi-tabletop:physical-persistence:v1`
- `tabletop_session_state`
- `fushi-tabletop:transition-overrides:v1`
- `fushi-tabletop:transition-overrides:v1:campaign:{campaignId}`
- `fushi-tabletop:mesa-view:v1`

O adapter ainda faz fallback para as chaves legadas quando a campanha local padrao e usada.

## Interface principal

O adapter expõe metodos de alto nivel:

- `loadCampaignSession(campaignId)`
- `saveCampaignSession(campaignId, data)`
- `loadMundiState(campaignId)`
- `saveMundiState(campaignId, data)`
- `loadLibraryState(campaignId)`
- `saveLibraryState(campaignId, data)`
- `loadPlayerAccess(campaignId)`
- `savePlayerAccess(campaignId, data)`
- `loadPhysicalPersistence(campaignId)`
- `savePhysicalPersistence(campaignId, data)`
- `exportCampaign(campaignId)`
- `importCampaign(data)`

Tambem existem metodos internos de compatibilidade para preferencias de view, interludios/transicoes e contagem de entradas locais.

## Arquivos migrados

Os seguintes arquivos deixaram de acessar `window.localStorage` ou `window.sessionStorage` diretamente:

- `src/lib/tabletopSession.ts`
- `src/lib/tabletopLibraryState.ts`
- `src/lib/worldMundiState.ts`
- `src/lib/playerAccess.ts`
- `src/lib/physicalPersistence.ts`

## Por que isso prepara desktop

No futuro, `BrowserStorageAdapter` pode ser trocado por um adapter de filesystem para Electron/Tauri, salvando dados em uma pasta local do app:

```text
FUSHI/
  campaigns/
    campaign-id/
      session.json
      library.json
      mundi.json
      access.json
      assets/
  backups/
```

As telas nao precisam saber se os dados vieram do navegador ou do disco.

## Por que isso prepara multiplayer

Para multiplayer, o adapter pode ser substituido por um client que fala com um servidor Node/WebSocket:

```text
React client -> storage/realtime client -> Node/WebSocket server -> campaign state
```

O servidor passa a ser a fonte autoritativa, validando permissoes e enviando para jogadores apenas o estado publico.

## Regra de continuidade

Enquanto o app estiver em modo navegador local, o comportamento esperado e identico ao anterior. Qualquer mudanca futura de armazenamento deve preservar import/export e fallback das chaves antigas.
