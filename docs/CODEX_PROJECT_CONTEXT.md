# Codex Project Context

## Product

FUSHI Tabletop is a custom RPG tabletop app for a living-world campaign. The app currently focuses on:
- MAP: local scene/maps, tokens, media, folders, audio, previews;
- MUN: world map/simulation layer, biomes, locations, groups, routes, logs;
- NPC/player permissions;
- player consciousness/body binding for reincarnation-style play.

## Current Technical Shape

- Frontend: Vite + React + TypeScript.
- Main app path: `06_TOOLS/fushi-tabletop`.
- Fonte de verdade operacional atual: `06_TOOLS/fushi-tabletop/docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx`.
- Antes de planejar conteudo novo ou concluir uma build relevante, atualizar a planilha com `npm run content:audit` e o gerador `.codex-dev/artifact-work/build-alpha84-control-workbook.mjs`.
- As abas `Protagonistas`, `NPC_Mecanicas`, `Bosses_Fases`, `Faccoes` e `Mundo_Biomas` devem vir somente do workspace real persistido (`%APPDATA%\FUSHI\workspace.json` ou `FUSHI_APPDATA_ROOT`), do MUN real do app e da lore real em `01_LORE\npcs\Facções`. Seeds/mock/backups/repros nao podem ser tratados como campanha real.
- `Bosses_Fases` e a classificacao `BOSS CATACLISMA` exigem planejamento de fases, mapas, aparencias, VFX/3D, interludios, audio e controle de estado antes de implementar boss complexo no app.
- Ler tambem `06_TOOLS/fushi-tabletop/docs/CONTENT_READINESS_SOURCE_OF_TRUTH.md` e `06_TOOLS/fushi-tabletop/docs/ALPHA84_CORE_PACK_PLAN.md`.
- Current persistence: browser `localStorage`/`sessionStorage` in web mode, and JSON files under `%APPDATA%/FUSHI` in Electron desktop mode.
- No real backend, database, or WebSocket authority yet.
- Physical asset helpers exist. Desktop filesystem persistence is now available through the same `storageAdapter` boundary.

## Recent Stabilized Areas

- MUN and MAP are intended to be linked by real `mapId` references, not separate map systems.
- GM map preview/preparation is separate from the player-active map.
- Player control is conceptually split into:
  - temporary token permission;
  - persistent player/consciousness/body binding.
- Campaign data should be isolated by `campaignId`.
- Storage adapter introduced at `06_TOOLS/fushi-tabletop/src/lib/storage/storageAdapter.ts`.
- The first migrated persistence files are:
  - `tabletopSession.ts`;
  - `tabletopLibraryState.ts`;
  - `worldMundiState.ts`;
  - `playerAccess.ts`;
  - `physicalPersistence.ts`.
- The adapter still uses the legacy browser storage keys to preserve existing local data.
- Campaign export/import helpers live at `06_TOOLS/fushi-tabletop/src/lib/campaignTransfer.ts`.
- Internal campaign backup helpers live at `06_TOOLS/fushi-tabletop/src/lib/campaignBackups.ts`.
- Automatic backup bridge lives at `06_TOOLS/fushi-tabletop/src/app/CampaignAutoBackupBridge.tsx`.
- Campaign transfer UI is in `SettingsPage.tsx` under the campaign management panel.
- Public/private state preparation lives at `06_TOOLS/fushi-tabletop/src/lib/session/publicState.ts`.
- The public state module is preparatory only; no real backend/WebSocket exists yet.
- Electron shell files live in `06_TOOLS/fushi-tabletop/electron/`.
- Desktop docs:
  - `06_TOOLS/fushi-tabletop/docs/DESKTOP_APP.md`
  - `06_TOOLS/fushi-tabletop/docs/DESKTOP_TESTING.md`
- Visual direction context:
  - `06_TOOLS/fushi-tabletop/docs/VISUAL_RULES.md`
- Electron commands:
  - `npm run electron:dev`
  - `npm run electron:dev:multi`
  - `npm run electron:build`
- Desktop asset parity:
  - local campaign assets are exported by `campaignAssetTransfer.ts`;
  - imported desktop assets are materialized to `%APPDATA%/FUSHI/campaigns/[campaignId]/assets/`;
  - runtime display of `/assets/...` in Electron is handled by `runtimeAssets.ts`;
  - asset audit doc lives at `06_TOOLS/fushi-tabletop/docs/ASSET_FIELD_AUDIT.md`.
- Placeholder/template audit:
  - `06_TOOLS/fushi-tabletop/docs/PLACEHOLDER_TEMPLATE_AUDIT.md`;
  - `Ver no MAP` no MUN no longer creates a MAP placeholder automatically.
- Local Electron multi-window sync is test-only:
  - main process broadcasts storage writes through IPC;
  - renderer windows reload session/library/MUN/access/workspace slices;
  - this is not real multiplayer authority.
- MUN visual rework has started:
  - plan: `06_TOOLS/fushi-tabletop/docs/MUN_REWORK_PLAN.md`;
  - requested asset list: `06_TOOLS/fushi-tabletop/docs/MUN_ASSET_REQUEST.md`;
  - imported asset status: `06_TOOLS/fushi-tabletop/docs/MUN_ASSET_STATUS.md`;
  - source assets from user: `MUN_REWORK/`;
  - app assets copied to `06_TOOLS/fushi-tabletop/public/assets/mundi/`;
  - current MUN Mestre uses the illustrated island image, real biome/location thumbnails when available, map toolbar overlay, fullscreen toggle, hover labels, and in-map local popover.
- Visual/VFX architecture decision recorded:
  - `06_TOOLS/fushi-tabletop/docs/VFX_RENDERING_ARCHITECTURE.md`;
  - `06_TOOLS/fushi-tabletop/docs/VFX_ASSET_SHOPPING_LIST.md`;
  - `06_TOOLS/fushi-tabletop/docs/VFX_LIBRARY_RESEARCH.md`;
  - React remains the app/UI layer;
  - PixiJS is the planned 2D render layer for MAP/MUN effects;
  - Three.js is reserved for dice, domains, boss cinematics and special 3D scenes;
  - Howler.js is the planned real audio layer;
  - final painterly/HD assets should be delivered by the user in `VFX_ASSETS_INBOX/`.

## Next Safe Technical Moves

1. Secure first Git checkpoint.
2. Add `storageAdapter` while preserving existing behavior.
3. Keep browser mode working exactly as it works now.
4. Validate desktop filesystem persistence.
5. Prepare future Node/WebSocket multiplayer authority.

## Do Not Do Yet

- Do not migrate to Godot.
- Do not implement multiplayer yet.
- Do not commit private campaigns, lore, assets, logs, uploads, or local backups.
