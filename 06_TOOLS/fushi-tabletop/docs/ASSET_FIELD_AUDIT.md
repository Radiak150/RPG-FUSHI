# Asset Field Audit

Auditoria estrutural para paridade Web/Desktop. Regra aplicada: asset real deve ser exportado/importado; fallback visual pode aparecer na UI, mas nao deve substituir o dado salvo.

| Arquivo | Entidade | Campo | Exemplo de uso | Export | Import | Desktop | Status |
|---|---|---|---|---|---|---|---|
| `src/data/types.ts` | Campanha | `coverImageUrl` | capa/card da campanha | sim, via `campaign` | sim, reescrito apos materializar assets | sim, `fushi-asset://` ou resolver runtime | ok |
| `src/components/campaigns/CampaignCollectionCard.tsx` | Campanha | `coverImageUrl` | `<img src>` do card | n/a | n/a | `resolveRuntimeAssetUrl` | ok |
| `src/data/types.ts` | Personagem/NPC | `avatarUrl` | retrato/card | sim, via `masterWorkspace` | sim | sim | ok |
| `src/data/types.ts` | Personagem/NPC | `tokenImageUrl` | token circular | sim, via `masterWorkspace` | sim | sim | ok |
| `src/data/types.ts` | Personagem/NPC | `topdownImageUrl` | token top-down no MAP | sim, via `masterWorkspace` | sim | sim | ok |
| `src/data/types.ts` | Item | `inventarioDetalhado[].imagemUrl` | imagem de item | sim, via `masterWorkspace` | sim | sim | ok |
| `src/data/types.ts` | MAP | `image` | imagem principal do mapa | sim, via `libraryState` se custom/override | sim | sim, inclusive `/assets/` em Electron | ok |
| `src/data/types.ts` | MAP | `imageUrl` | alias de imagem do mapa | sim | sim | sim | ok |
| `src/data/types.ts` | MAP | `previewImage` | preview/card do mapa | sim | sim | sim | ok |
| `src/data/types.ts` | MAP | `thumbnailUrl` | thumbnail/lista de mapas | sim | sim | sim | ok |
| `src/data/types.ts` | Transicao | `assetUrl` | imagem/video de transicao | sim, via `libraryState` ou override | sim | sim | ok |
| `src/data/types.ts` | Transicao | `thumbnailUrl` | poster/thumbnail | sim | sim | sim | ok |
| `src/data/types.ts` | Midia | `source` | musica/ambiencia/imagem/video | sim se estiver no estado exportado | sim | asset local resolvido se embutido | ok |
| `src/data/types.ts` | Cinematica | `previewImage` | card/overlay cinematica | sim se estiver no estado exportado | sim | sim | ok |
| `src/lib/worldMundiState.ts` | MUN local | `previewImageUrl` | imagem do local selecionado | sim, via `mundiState` | sim | sim | ok |
| `src/lib/worldMundiState.ts` | MUN local | `previewImageAssetId` | referencia tecnica de asset | sim, como metadado | sim | diagnostico apenas | ok |
| `src/lib/worldMundiState.ts` | MUN local | `imagemLocalUrl` | compatibilidade antiga | sim, normalizado para preview | sim | sim | ok |
| `src/data/types.ts` | WorldData | `mapImage` | mapa mundi base mock | nao e bloco de campanha atual | n/a | depende do build | incerto |

## Correcoes aplicadas

- `campaignAssetTransfer` agora procura assets em todo o export e inclui `data:`, `blob:`, `/api/fushi/assets/`, `/assets/`, `./assets/`, `assets/` e `fushi-asset://`.
- Import no desktop materializa assets em `%APPDATA%/FUSHI/campaigns/[campaignId]/assets/` e reescreve referencias para `fushi-asset://...`.
- Import de campanha agora usa a campanha reescrita depois da materializacao, corrigindo capa/banner.
- `runtimeAssets.resolveRuntimeAssetUrl` corrige `/assets/...` em Electron sem alterar o dado persistido.
- Diagnostico de assets separa quebras por campanha, mapa, personagem, item e MUN.

## Observacao

Exports antigos sem assets embutidos nao conseguem recuperar arquivos que so existiam como URL temporaria ou `/api/fushi/assets/...`. Para esses casos, reexportar pela web atualizada e importar novamente.

