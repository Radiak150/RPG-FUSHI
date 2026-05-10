# Repository Structure

## Versioned App Code

- `06_TOOLS/fushi-tabletop/src/`: React/Vite source code.
- `06_TOOLS/fushi-tabletop/public/`: safe public placeholders and static files.
- `06_TOOLS/fushi-tabletop/package.json`: app dependencies and scripts.
- `06_TOOLS/fushi-tabletop/vite.config.*`: Vite configuration.
- `06_TOOLS/fushi-tabletop/tsconfig*.json`: TypeScript configuration.
- `README.md`, `docs/`, `SECURITY_NOTES.md`, `ROADMAP_DESKTOP_MULTIPLAYER.md`: safe documentation.
- `.env.example`: fake environment variable names only.

## Local Data Not Versioned

These folders are private/runtime data and are ignored by Git:

- `00_ADMIN/`
- `01_LORE/`
- `02_GAME_DESIGN/`
- `03_DATA/`
- `04_SESSIONS/`
- `05_ASSETS/`
- `campaigns/`
- `uploads/`
- `backups/`
- `logs/`
- `fushi-data/`
- `fushi-assets/`
- `fushi-campaigns/`
- `.fushi/`

If any lore or asset must become versioned later, create a sanitized copy in `docs/` or a clearly named safe folder and review it before committing.

## Future Desktop Runtime

Recommended local runtime layout for a desktop build:

```text
FUSHI/
  campaigns/
    campaign-id/
      session.json
      library.json
      mundi.json
      access.json
      logs.json
      assets/
  backups/
  config.json
```

The app should eventually access this through a storage adapter instead of direct `localStorage` calls.
