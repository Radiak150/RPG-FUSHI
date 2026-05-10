# Security Notes

This repository should keep only source code and safe documentation in Git.

Never commit:
- real campaigns, session exports, backups, or local databases;
- private NPC sheets, unreleased lore, commercial assets, maps, music, videos, or generated images;
- uploads, runtime cache, physical persistence folders, logs, or build output;
- `.env` files, API keys, passwords, tokens, certificates, private keys, or credentials;
- local IDE metadata such as `.idea/` or personal workspace files.

Safe to commit by default:
- app source code under `06_TOOLS/fushi-tabletop/src`;
- safe static placeholders under `public`;
- package manifests and config files;
- sanitized documentation;
- `.env.example` with fake values only.

Before the first real commit, run a pre-commit audit:
- `git status --short`;
- list files larger than 10 MB;
- search for `API_KEY`, `SECRET`, `TOKEN`, `PASSWORD`, `PRIVATE_KEY`, `.env`, and `credentials`;
- confirm that private campaign/assets folders are ignored.

Future Electron baseline:
- keep `contextIsolation: true`;
- keep `nodeIntegration: false`;
- use sandboxing when possible;
- do not disable `webSecurity`;
- avoid loading untrusted remote content;
- expose only minimal APIs through a safe preload/context bridge;
- validate file paths before reading or writing local files.

Future multiplayer baseline:
- the server must validate permissions, not just the UI;
- players must receive only the state the GM has revealed;
- the full MUN and technical logs remain GM-only;
- `playerCurrentMapId` and `mestreCurrentMapId` stay separate;
- token permissions and player-body bindings are enforced server-side.
