# Pre-Commit Audit

Date: 2026-05-10

## Current Git State

The repository has no safe baseline commit yet.

Current risk:
- `.idea/*` and `RPG-FUSHI.iml` are staged in Git and should be removed from the index before the first commit.
- Private/runtime folders are now ignored by the root `.gitignore`.
- `out.txt`, Vite logs, `dist`, and `node_modules` are ignored.

## Ignored Private/Runtime Areas

- `00_ADMIN/`
- `01_LORE/`
- `02_GAME_DESIGN/`
- `03_DATA/`
- `04_SESSIONS/`
- `05_ASSETS/`
- `06_TOOLS/fushi-tabletop/dist/`
- `06_TOOLS/fushi-tabletop/node_modules/`
- `06_TOOLS/fushi-tabletop/public/assets/tokens/`
- `06_TOOLS/fushi-tabletop/vite-dev.log`
- `06_TOOLS/fushi-tabletop/vite-dev.err`
- `06_TOOLS/fushi-tabletop/out.txt`

## Candidate Files

`git ls-files --others --exclude-standard` reported 149 non-ignored untracked files.

Main candidate groups:
- root safety docs and `.env.example`;
- `README.md` and `docs/`;
- `06_TOOLS/fushi-tabletop` source/config/package files;
- safe placeholder/static assets currently under `public/assets/maps` and `public/assets/transitions`;
- source assets under `src/assets`.

## Large Files

No non-ignored candidate file above 10 MB was found.

Ignored large file found:
- `06_TOOLS/fushi-tabletop/node_modules/@rolldown/.../rolldown-binding.win32-x64-msvc.node` around 23 MB.

## Secret-Term Scan

The scan looked for:
- `API_KEY`
- `SECRET`
- `TOKEN`
- `PASSWORD`
- `PRIVATE_KEY`
- `.env`
- `credentials`

Findings are mostly expected code/documentation terms:
- password UI/access code references in `playerAccess`, `AccessGate`, and `TabletopAccessPanel`;
- default local MVP passwords in `playerAccess.ts`;
- RPG/token terminology in tabletop code and docs;
- "secret/hidden" gameplay terminology in MUN code;
- `.env` references in safety docs/config.

Important note:
- default MVP passwords (`mestre1`, `111`, `222`, `333`, `444`, `555`) are not private secrets, but should be replaced by server-side permission validation before real multiplayer/public release.

## Commit Readiness

Not ready for commit yet.

Before first commit:
1. Remove `.idea/*` and `RPG-FUSHI.iml` from the Git index.
2. Confirm whether current placeholder images under `public/assets/maps` and `public/assets/transitions` are safe to version.
3. Stage only source/config/safe docs/safe placeholders.
4. Commit with message `MVP MUN MAP base`.
5. Tag `MVP_MUN_MAP_BASE_V1`.
