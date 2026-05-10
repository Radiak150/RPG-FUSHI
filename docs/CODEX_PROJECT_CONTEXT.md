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
- Current persistence: mostly browser `localStorage`/`sessionStorage`.
- No real backend, database, or WebSocket authority yet.
- Physical asset helpers exist, but browser storage remains the core compatibility layer.

## Recent Stabilized Areas

- MUN and MAP are intended to be linked by real `mapId` references, not separate map systems.
- GM map preview/preparation is separate from the player-active map.
- Player control is conceptually split into:
  - temporary token permission;
  - persistent player/consciousness/body binding.
- Campaign data should be isolated by `campaignId`.

## Next Safe Technical Moves

1. Secure first Git checkpoint.
2. Add `storageAdapter` while preserving existing behavior.
3. Keep browser mode working exactly as it works now.
4. Prepare future desktop filesystem persistence.
5. Prepare future Node/WebSocket multiplayer authority.

## Do Not Do Yet

- Do not migrate to Godot.
- Do not implement Electron/Tauri yet.
- Do not implement multiplayer yet.
- Do not commit private campaigns, lore, assets, logs, uploads, or local backups.
