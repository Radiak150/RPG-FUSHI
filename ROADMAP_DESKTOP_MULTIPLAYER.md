# Desktop and Multiplayer Roadmap

## Current State

The app is currently a Vite/React browser app. It runs locally through Vite and stores most state in browser storage.

Current persistence areas:
- campaign/session state: `src/lib/tabletopSession.ts`;
- MUN state: `src/lib/worldMundiState.ts`;
- MAP/library/assets metadata: `src/lib/tabletopLibraryState.ts`;
- player access profiles: `src/lib/playerAccess.ts`;
- physical asset helpers: `src/lib/physicalAssets.ts`;
- physical persistence helpers: `src/lib/physicalPersistence.ts`.

There is no authoritative multiplayer backend yet. There is no database and no WebSocket state server yet.

## Why It Is Not Real Multiplayer Yet

Running the app on LAN only shares the UI bundle. Each browser still has its own storage and its own local state.

Real multiplayer needs one authoritative state source that:
- owns the active campaign/session;
- validates master/player permissions;
- broadcasts map/token changes in real time;
- sends only public state to players;
- keeps the full MUN and private logs master-only.

## Storage Adapter Plan

Create a single persistence layer before changing runtime targets.

Initial adapter behavior:
- browser mode continues using `localStorage`/`sessionStorage`;
- no visual changes;
- no feature changes;
- existing storage keys remain backward-compatible.

Future adapter targets:
- desktop filesystem storage;
- server/database storage;
- import/export backup storage.

## Desktop Plan

The app can be packaged with Electron or Tauri because it is already a Vite/React app.

Recommended path:
1. Stabilize Git checkpoint.
2. Add storage adapter while preserving current behavior.
3. Add desktop shell only after persistence is centralized.
4. Store campaigns/assets in an app-data folder.
5. Keep GM mode fully offline.

Tauri is preferred for a smaller desktop app. Electron is easier if we want Node filesystem/server code embedded early.

## Multiplayer Plan

Minimum V1 architecture:

```text
React client
  -> HTTP/WebSocket
Node server
  -> campaign/session JSON storage initially
  -> assets folder per campaign/session
```

V1 requirements:
- GM creates/opens a session;
- players join as J1-J5 with permission checks;
- GM sees full MUN;
- players see only the active player MAP;
- `mestreCurrentMapId` and `playerCurrentMapId` remain separate;
- player token movement syncs live;
- player-body bindings persist server-side.

## Safe Implementation Order

1. Pre-commit security audit.
2. First Git commit and tag `MVP_MUN_MAP_BASE_V1`.
3. Introduce `storageAdapter` without visual changes.
4. Move direct storage reads/writes behind adapter.
5. Define public vs GM-only state slices.
6. Add server action protocol.
7. Add WebSocket sync.
8. Add desktop shell.
9. Add desktop filesystem persistence.

Do not implement Electron or multiplayer before the storage boundary is stable.
